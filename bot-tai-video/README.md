# Bot tải video — TikTok · Douyin · Instagram · Facebook

Dán link vào Telegram → chọn Video / Nhạc / Ảnh → bot gửi file về.
Chạy bằng [yt-dlp](https://github.com/yt-dlp/yt-dlp), nền tảng nào yt-dlp đỡ được thì bot đỡ được.

> Chỉ tải nội dung của bạn hoặc bạn có quyền sử dụng. Đừng dùng để lấy video
> người khác đăng lại kiếm view — kênh sẽ ăn gậy bản quyền, mà cũng không hay ho gì.

## Chạy trên máy tính (thử nhanh)

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

export BOT_TOKEN="token-từ-BotFather"   # Windows: set BOT_TOKEN=...
python bot.py
```

Nên cài thêm **ffmpeg** để tách nhạc ra MP3 và ghép video chất lượng cao
(`brew install ffmpeg` · `sudo apt install ffmpeg` · Windows tải ở ffmpeg.org).
Không có ffmpeg bot vẫn chạy, chỉ là nhạc trả về ở định dạng gốc (m4a).

## Chạy 24/7 trên VPS (Ubuntu)

```bash
sudo apt update && sudo apt install -y python3-venv ffmpeg
sudo mkdir -p /opt/bot-tai-video && cd /opt/bot-tai-video
# chép bot.py, requirements.txt vào đây
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

sudo tee /etc/systemd/system/bot-tai-video.service >/dev/null <<'UNIT'
[Unit]
Description=Bot tai video Telegram
After=network-online.target

[Service]
WorkingDirectory=/opt/bot-tai-video
Environment=BOT_TOKEN=token-cua-ban
Environment=ALLOWED_IDS=5116087301
ExecStart=/opt/bot-tai-video/venv/bin/python bot.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl enable --now bot-tai-video
sudo journalctl -u bot-tai-video -f      # xem log
```

Cập nhật yt-dlp mỗi tháng (nền tảng đổi API liên tục):

```bash
/opt/bot-tai-video/venv/bin/pip install -U yt-dlp && sudo systemctl restart bot-tai-video
```

## Giới hạn cần biết

| Chuyện | Chi tiết |
|---|---|
| Dung lượng | Bot Telegram chỉ gửi được tối đa **50 MB**. Video nặng hơn, bot tự hạ 1080p → 720p → 480p; vẫn quá thì gửi link tải thẳng. Muốn gửi tới 2 GB phải tự dựng [Local Bot API Server](https://github.com/tdlib/telegram-bot-api). |
| Instagram / Facebook | Nhiều bài đòi đăng nhập. Xuất cookies từ trình duyệt rồi trỏ `COOKIES_FILE` vào file đó. Dùng tài khoản phụ, đừng dùng tài khoản chính. |
| Douyin | Có lúc chặn IP nước ngoài. VPS đặt ở Singapore/HK thường ổn hơn EU/US. |
| Ảnh | Bài ảnh TikTok và carousel Instagram lấy được; tuỳ nền tảng đổi cấu trúc mà có lúc chỉ ra được ảnh bìa. |
| Hỏng đột ngột | Gần như luôn là do yt-dlp lỗi thời. Cập nhật là chạy lại. |
