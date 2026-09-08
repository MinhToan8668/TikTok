# -*- coding: utf-8 -*-
"""
Bot Telegram tải video / ảnh / nhạc từ TikTok · Douyin · Instagram · Facebook.

Dán link vào chat → bot hỏi muốn lấy gì → gửi file về.
Chạy bằng yt-dlp, nên nền tảng nào yt-dlp đỡ được thì bot đỡ được.

Chạy:  python bot.py       (nhớ đặt biến môi trường, xem .env.example)
"""

import asyncio
import logging
import os
import re
import shutil
import tempfile
import time
import uuid
from pathlib import Path

import yt_dlp
from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaPhoto,
    Update,
)
from telegram.constants import ChatAction, ParseMode
from telegram.error import TelegramError
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# ───────────────────────── CẤU HÌNH ─────────────────────────

BOT_TOKEN = os.environ.get("BOT_TOKEN", "").strip()

# Để trống = ai nhắn bot cũng dùng được.
# Điền chat id cách nhau dấu phẩy để chỉ mình bạn (và team) dùng.
ALLOWED = {
    s.strip() for s in os.environ.get("ALLOWED_IDS", "").split(",") if s.strip()
}

# Bot API thường chỉ cho tải LÊN tối đa 50 MB. Chừa 2 MB cho phần bao gói.
MAX_MB = int(os.environ.get("MAX_MB", "48"))

# File cookies dạng Netscape — cần cho Instagram / Facebook nội dung hạn chế.
COOKIES = os.environ.get("COOKIES_FILE", "").strip()

# Số link xử lý cùng lúc; mỗi người phải cách nhau bao nhiêu giây.
SONG_SONG = int(os.environ.get("CONCURRENCY", "2"))
NGHI_GIAY = int(os.environ.get("COOLDOWN", "3"))

logging.basicConfig(
    format="%(asctime)s  %(levelname)-7s %(name)s — %(message)s",
    level=logging.INFO,
)
logging.getLogger("httpx").setLevel(logging.WARNING)
log = logging.getLogger("taivideo")

# ───────────────────────── TIỆN ÍCH ─────────────────────────

URL_RE = re.compile(r"https?://[^\s<>\"]+", re.I)

NEN_TANG = [
    ("TikTok", ("tiktok.com", "vt.tiktok.com", "vm.tiktok.com")),
    ("Douyin", ("douyin.com", "iesdouyin.com")),
    ("Instagram", ("instagram.com", "instagr.am", "ddinstagram.com")),
    ("Facebook", ("facebook.com", "fb.watch", "fb.com", "m.facebook.com")),
    ("YouTube", ("youtube.com", "youtu.be")),
]

ANH_EXT = {"jpg", "jpeg", "png", "webp", "heic"}

# link đang chờ người dùng chọn kiểu tải: token ngắn → (url, hạn dùng)
CHO_CHON: dict[str, tuple[str, float]] = {}
CHO_SONG = asyncio.Semaphore(SONG_SONG)
LAN_CUOI: dict[int, float] = {}


def tim_link(text: str) -> str | None:
    """Lấy link đầu tiên trong tin nhắn, cắt bỏ dấu câu dính đuôi."""
    m = URL_RE.search(text or "")
    if not m:
        return None
    return m.group(0).rstrip(").,;!\u201d\"'")


def ten_nen_tang(url: str) -> str:
    u = url.lower()
    for ten, mien in NEN_TANG:
        if any(d in u for d in mien):
            return ten
    return "Link"


def doc_mb(so_byte: int | float | None) -> str:
    if not so_byte:
        return "?"
    return f"{so_byte / 1024 / 1024:.1f} MB"


def don_ten(s: str, dai: int = 60) -> str:
    """Bỏ ký tự cấm trong tên file, cắt cho ngắn."""
    s = re.sub(r"[\\/:*?\"<>|\r\n\t]+", " ", s or "").strip()
    s = re.sub(r"\s+", " ", s)
    return (s[:dai] or "media").strip()


def duoc_dung(update: Update) -> bool:
    if not ALLOWED:
        return True
    chat = update.effective_chat
    user = update.effective_user
    return (chat and str(chat.id) in ALLOWED) or (user and str(user.id) in ALLOWED)


def don_token_cu() -> None:
    gio = time.time()
    for k in [k for k, (_, han) in CHO_CHON.items() if han < gio]:
        CHO_CHON.pop(k, None)


# ───────────────────────── YT-DLP ─────────────────────────

def opts_chung(thu_muc: Path) -> dict:
    o = {
        "outtmpl": str(thu_muc / "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "noplaylist": True,
        "restrictfilenames": True,
        "retries": 3,
        "socket_timeout": 30,
        # tiktok/douyin đôi khi chặn user-agent lạ
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            )
        },
    }
    if COOKIES and Path(COOKIES).is_file():
        o["cookiefile"] = COOKIES
    return o


def lay_thong_tin(url: str) -> dict:
    """Chỉ đọc metadata, chưa tải gì."""
    with yt_dlp.YoutubeDL({**opts_chung(Path(tempfile.gettempdir())),
                           "skip_download": True}) as ydl:
        return ydl.extract_info(url, download=False)


# thang chất lượng: thử lần lượt cho tới khi file vừa giới hạn Telegram
THANG = [
    "bv*[height<=1080]+ba/b[height<=1080]/b",
    "bv*[height<=720]+ba/b[height<=720]/b",
    "bv*[height<=480]+ba/b[height<=480]/b",
    "worst",
]


def tai_video(url: str, thu_muc: Path, gioi_han_byte: int) -> tuple[Path | None, dict]:
    """Tải video, tự hạ chất lượng nếu file quá nặng. Trả về (file, info)."""
    info: dict = {}
    for i, fmt in enumerate(THANG):
        for f in thu_muc.glob("*"):
            f.unlink(missing_ok=True)
        opts = {**opts_chung(thu_muc), "format": fmt, "merge_output_format": "mp4"}
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
        except yt_dlp.utils.DownloadError:
            if i == len(THANG) - 1:
                raise
            continue

        files = sorted(
            (p for p in thu_muc.iterdir() if p.is_file()),
            key=lambda p: p.stat().st_size,
            reverse=True,
        )
        if not files:
            continue
        f = files[0]
        if f.stat().st_size <= gioi_han_byte or i == len(THANG) - 1:
            return f, info
        log.info("File %s quá nặng, hạ chất lượng…", doc_mb(f.stat().st_size))
    return None, info


def tai_nhac(url: str, thu_muc: Path) -> tuple[Path | None, dict]:
    """Tách tiếng thành mp3. Không có ffmpeg thì lấy luồng audio nguyên bản."""
    opts = {**opts_chung(thu_muc), "format": "ba/b"}
    if shutil.which("ffmpeg"):
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
    files = [p for p in thu_muc.iterdir() if p.is_file()]
    if not files:
        return None, info
    mp3 = [p for p in files if p.suffix.lower() == ".mp3"]
    return (mp3[0] if mp3 else files[0]), info


def gom_link_anh(info: dict) -> list[str]:
    """Nhặt link ảnh từ metadata — dùng cho bài ảnh TikTok / carousel Instagram."""
    ra: list[str] = []

    def them(u: str | None) -> None:
        if u and u not in ra:
            ra.append(u)

    def la_anh(d: dict) -> bool:
        if d.get("ext", "").lower() in ANH_EXT:
            return True
        return d.get("vcodec") == "none" and d.get("acodec") == "none"

    for entry in info.get("entries") or [info]:
        if not isinstance(entry, dict):
            continue
        if la_anh(entry):
            them(entry.get("url"))
        for f in entry.get("formats") or []:
            if la_anh(f):
                them(f.get("url"))
    if not ra:  # cùng lắm thì lấy ảnh bìa
        for t in reversed(info.get("thumbnails") or []):
            them(t.get("url"))
            if ra:
                break
    return ra[:10]  # Telegram cho tối đa 10 ảnh một album


# ───────────────────────── LỆNH BOT ─────────────────────────

CHAO = (
    "🎬 *Bot tải video*\n\n"
    "Dán link là xong. Bot đỡ được:\n"
    "· TikTok (video sạch, không dính watermark)\n"
    "· Douyin · Instagram · Facebook Reels · YouTube\n\n"
    "Dán link → chọn *Video*, *Nhạc MP3* hay *Ảnh* → bot gửi file về.\n\n"
    "_Chỉ tải nội dung của bạn hoặc bạn có quyền dùng nhé._"
)


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not duoc_dung(update):
        await update.message.reply_text(
            f"⛔ Bot riêng tư.\nChat ID của bạn: `{update.effective_chat.id}`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    await update.message.reply_text(CHAO, parse_mode=ParseMode.MARKDOWN)


async def cmd_id(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        f"Chat ID: `{update.effective_chat.id}`", parse_mode=ParseMode.MARKDOWN
    )


async def nhan_link(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not duoc_dung(update):
        return
    url = tim_link(update.message.text or "")
    if not url:
        return

    uid = update.effective_user.id
    gio = time.time()
    if gio - LAN_CUOI.get(uid, 0) < NGHI_GIAY:
        await update.message.reply_text("⏳ Từ từ thôi, chờ vài giây rồi gửi link tiếp nhé.")
        return
    LAN_CUOI[uid] = gio

    don_token_cu()
    token = uuid.uuid4().hex[:10]
    CHO_CHON[token] = (url, gio + 900)  # nhớ 15 phút

    await update.message.reply_text(
        f"🔗 *{ten_nen_tang(url)}* — bạn muốn lấy gì?",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("🎬 Video", callback_data=f"v:{token}"),
            InlineKeyboardButton("🎵 Nhạc", callback_data=f"a:{token}"),
            InlineKeyboardButton("🖼 Ảnh", callback_data=f"i:{token}"),
        ]]),
    )


async def bam_nut(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    q = update.callback_query
    await q.answer()
    kieu, _, token = q.data.partition(":")

    don_token_cu()
    muc = CHO_CHON.get(token)
    if not muc:
        await q.edit_message_text("⌛ Link này cũ quá rồi, bạn dán lại giúp mình nhé.")
        return
    url = muc[0]

    ten_kieu = {"v": "video", "a": "nhạc", "i": "ảnh"}[kieu]
    await q.edit_message_text(f"⏳ Đang lấy {ten_kieu}…")

    async with CHO_SONG:
        thu_muc = Path(tempfile.mkdtemp(prefix="tai_"))
        try:
            await _xu_ly(kieu, url, thu_muc, q, ctx)
        except yt_dlp.utils.DownloadError as e:
            log.warning("yt-dlp hỏng: %s", e)
            await q.edit_message_text(
                "✘ Không tải được link này.\n\n"
                "Thường là do bài đã bị xoá, để riêng tư, hoặc nền tảng đòi đăng nhập "
                "(Instagram và Facebook hay bị) — lúc đó phải nạp file cookies cho bot."
            )
        except TelegramError as e:
            log.warning("Telegram hỏng: %s", e)
            await q.edit_message_text(f"✘ Gửi file không được: {e}")
        except Exception as e:  # noqa: BLE001 — bắt hết cho bot khỏi chết
            log.exception("Lỗi lạ")
            await q.edit_message_text(f"✘ Lỗi: {type(e).__name__}: {e}")
        finally:
            shutil.rmtree(thu_muc, ignore_errors=True)


async def _xu_ly(kieu: str, url: str, thu_muc: Path,
                 q, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = q.message.chat_id
    gioi_han = MAX_MB * 1024 * 1024

    if kieu == "i":
        await ctx.bot.send_chat_action(chat_id, ChatAction.UPLOAD_PHOTO)
        info = await asyncio.to_thread(lay_thong_tin, url)
        anh = gom_link_anh(info)
        if not anh:
            await q.edit_message_text("✘ Bài này không có ảnh nào để lấy.")
            return
        tieu_de = don_ten(info.get("title") or info.get("description") or "")
        if len(anh) == 1:
            await ctx.bot.send_photo(chat_id, anh[0], caption=tieu_de or None)
        else:
            await ctx.bot.send_media_group(
                chat_id,
                [InputMediaPhoto(u, caption=tieu_de if i == 0 else None)
                 for i, u in enumerate(anh)],
            )
        await q.edit_message_text(f"✅ Xong — {len(anh)} ảnh.")
        return

    if kieu == "a":
        await ctx.bot.send_chat_action(chat_id, ChatAction.UPLOAD_VOICE)
        f, info = await asyncio.to_thread(tai_nhac, url, thu_muc)
        if not f:
            await q.edit_message_text("✘ Không tách được tiếng từ link này.")
            return
        if f.stat().st_size > gioi_han:
            await q.edit_message_text(
                f"✘ File nhạc {doc_mb(f.stat().st_size)}, quá mức {MAX_MB} MB Telegram cho phép."
            )
            return
        with f.open("rb") as fh:
            await ctx.bot.send_audio(
                chat_id, fh,
                title=don_ten(info.get("title") or "audio"),
                performer=info.get("uploader") or None,
                duration=int(info.get("duration") or 0) or None,
                filename=f"{don_ten(info.get('title') or 'audio')}{f.suffix}",
            )
        await q.edit_message_text(f"✅ Xong — {doc_mb(f.stat().st_size)}")
        return

    # ── video ──
    await ctx.bot.send_chat_action(chat_id, ChatAction.UPLOAD_VIDEO)
    f, info = await asyncio.to_thread(tai_video, url, thu_muc, gioi_han)
    if not f:
        await q.edit_message_text("✘ Không tải được video từ link này.")
        return

    co = f.stat().st_size
    if co > gioi_han:
        thang = info.get("url") or (info.get("formats") or [{}])[-1].get("url")
        await q.edit_message_text(
            f"⚠️ Video nặng {doc_mb(co)}, vượt mức {MAX_MB} MB mà Telegram cho bot gửi.\n\n"
            + (f"Tải thẳng ở đây nhé:\n{thang}" if thang else "Bạn thử link khác giúp mình.")
        )
        return

    tieu_de = don_ten(info.get("title") or info.get("description") or "video")
    nguoi_dang = info.get("uploader") or info.get("uploader_id") or ""
    chu_thich = f"🎬 {tieu_de}" + (f"\n👤 {nguoi_dang}" if nguoi_dang else "")

    with f.open("rb") as fh:
        await ctx.bot.send_video(
            chat_id, fh,
            caption=chu_thich[:1024],
            duration=int(info.get("duration") or 0) or None,
            width=info.get("width") or None,
            height=info.get("height") or None,
            supports_streaming=True,
            filename=f"{tieu_de}.mp4",
            read_timeout=120, write_timeout=120, connect_timeout=60,
        )
    await q.edit_message_text(f"✅ Xong — {doc_mb(co)}")


async def loi_chung(update: object, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    log.error("Lỗi không bắt được", exc_info=ctx.error)


def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit("Chưa đặt biến môi trường BOT_TOKEN")

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler(["start", "help"], cmd_start))
    app.add_handler(CommandHandler("id", cmd_id))
    app.add_handler(CallbackQueryHandler(bam_nut, pattern=r"^[vai]:"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, nhan_link))
    app.add_error_handler(loi_chung)

    log.info("Bot chạy rồi. Giới hạn %s MB · %s link cùng lúc%s",
             MAX_MB, SONG_SONG, " · có cookies" if COOKIES else "")
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    main()
