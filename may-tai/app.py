"""Máy tải video của Viral Studio (tool Tải video).

Chạy yt-dlp trên một máy riêng (Railway, Render, VPS...) để tải YouTube, Facebook, Instagram, Threads,
Reddit, Pinterest... rồi CHUYỂN THẲNG file qua chính máy này cho trình duyệt (tunnel). Link video gốc của
YouTube gắn với IP máy đã lấy nó, nên file phải đi qua máy này chứ không đưa link gốc cho học viên.

Cách làm: POST / chỉ đọc thông tin và chọn định dạng (nhanh); khi trình duyệt mở link tunnel thì yt-dlp mới tải
file về máy này (tự chia khúc, dùng cookie, ghép hình + tiếng bằng ffmpeg) rồi gửi đi, giữ 1 giờ rồi xoá.

Nói đúng giao thức cobalt (github.com/imputnet/cobalt) để Apps Script (TaiVe.gs: tvCobalt) dùng ngay:
  POST /         {url, downloadMode:'auto'|'audio', audioFormat:'mp3'} → {status:'tunnel', url, filename, items:[...]}
  GET  /tunnel?id=…  → file (có tên, hỗ trợ tải tiếp bằng Range khi là một file sẵn)
  GET  /          → {ok, name, ffmpeg, yt_dlp}

Biến môi trường:
  API_KEY     (nên đặt) chuỗi bí mật; Apps Script gửi "Authorization: Api-Key <API_KEY>" (Script property COBALT_KEY)
  PUBLIC_URL  (tuỳ chọn) https://ten-may.up.railway.app, mặc định tự đọc từ header
  COOKIES     (tuỳ chọn) nội dung file cookies.txt kiểu Netscape, giúp tải bài cần đăng nhập / bị chặn bot
  MAX_MB      (tuỳ chọn) file tối đa bao nhiêu MB, mặc định 600
  PORT        cổng, Railway tự đặt
"""
import hmac, json, os, re, secrets, shutil, threading, time, unicodedata
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import yt_dlp

API_KEY = os.environ.get('API_KEY', '').strip()
PUBLIC_URL = os.environ.get('PUBLIC_URL', '').strip().rstrip('/')
FFMPEG = shutil.which('ffmpeg')
TUNNEL_TTL = 3600          # link tải sống 1 giờ
MAX_PER_MIN = 20           # mỗi IP tối đa 20 lần lấy link mỗi phút
CHUNK = 256 * 1024
COOKIE_FILE = None
if os.environ.get('COOKIES', '').strip():
    COOKIE_FILE = '/tmp/cookies.txt'
    with open(COOKIE_FILE, 'w') as f:
        f.write(os.environ['COOKIES'].replace('\\n', '\n'))

_tunnels, _lock, _hits = {}, threading.Lock(), {}


# ── hàm thuần (kiểm tra được không cần mạng) ──
def ten_file(title, ext):
    s = unicodedata.normalize('NFD', str(title or 'video')).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-')[:60] or 'video'
    return f'{s}.{ext}'


def la_http(f):
    return str(f.get('protocol') or '').split('+')[0] in ('http', 'https') and bool(f.get('url'))


def co_hinh(f):
    return (f.get('vcodec') or 'none') != 'none'


def co_tieng(f):
    return (f.get('acodec') or 'none') != 'none'


def chon_dinh_dang(info, che_do='auto', chat='1080', co_ffmpeg=False):
    """Từ info của yt-dlp chọn cách lấy file. Trả list phương án [{kind, inputs:[format,...], ext, nhan}],
    phương án đầu là bản mặc định. kind: direct (một file sẵn) | merge (ghép hình + tiếng) | mp3 | hls."""
    fm = [f for f in (info.get('formats') or [info]) if f.get('url')]
    try:
        tran = int(re.sub(r'\D', '', str(chat)) or 1080)
    except ValueError:
        tran = 1080
    tieng = sorted([f for f in fm if co_tieng(f) and not co_hinh(f) and la_http(f)],
                   key=lambda f: ((f.get('language_preference') or 0) >= 10 or 'original' in str(f.get('format_note') or '').lower() or 'default' in str(f.get('format_note') or '').lower(), (f.get('ext') == 'm4a'), f.get('abr') or f.get('tbr') or 0), reverse=True)   # bài có nhiều tiếng lồng: lấy tiếng gốc
    ra = []
    if che_do == 'audio':
        if tieng and co_ffmpeg:
            ra.append({'kind': 'mp3', 'inputs': [tieng[0]], 'ext': 'mp3', 'nhan': 'Âm thanh (mp3)'})
        elif tieng:
            ra.append({'kind': 'direct', 'inputs': [tieng[0]], 'ext': tieng[0].get('ext') or 'm4a', 'nhan': 'Âm thanh'})
        return ra
    lien = sorted([f for f in fm if co_hinh(f) and co_tieng(f) and la_http(f) and (f.get('height') or 0) <= tran],
                  key=lambda f: ((f.get('height') or 0), f.get('ext') == 'mp4', f.get('tbr') or 0), reverse=True)
    hinh = sorted([f for f in fm if co_hinh(f) and not co_tieng(f) and la_http(f) and (f.get('height') or 0) <= tran],
                  key=lambda f: ((f.get('height') or 0), f.get('ext') == 'mp4', str(f.get('vcodec') or '').startswith('avc'), f.get('tbr') or 0), reverse=True)
    cao_lien = (lien[0].get('height') or 0) if lien else 0
    # bản nét nhất: ghép hình + tiếng khi nét hơn bản liền sẵn có (cần ffmpeg)
    if co_ffmpeg and hinh and tieng and (hinh[0].get('height') or 0) > cao_lien:
        h = hinh[0]
        ra.append({'kind': 'merge', 'inputs': [h, tieng[0]], 'ext': 'mp4', 'nhan': f'Video {h.get("height") or ""}p'.replace(' p', '')})
    if lien:
        ra.append({'kind': 'direct', 'inputs': [lien[0]], 'ext': lien[0].get('ext') or 'mp4', 'nhan': f'Video {cao_lien}p' if cao_lien else 'Video'})
    if not ra:
        hls = [f for f in fm if co_hinh(f) and 'm3u8' in str(f.get('protocol') or '')]
        if hls and co_ffmpeg:
            hls.sort(key=lambda f: f.get('height') or 0, reverse=True)
            ra.append({'kind': 'hls', 'inputs': [hls[0]], 'ext': 'mp4', 'nhan': f'Video {hls[0].get("height") or ""}p'.replace(' p', '')})
        elif hinh:
            ra.append({'kind': 'direct', 'inputs': [hinh[0]], 'ext': hinh[0].get('ext') or 'mp4', 'nhan': 'Video (không tiếng)'})
        elif info.get('url'):
            ra.append({'kind': 'direct', 'inputs': [info], 'ext': info.get('ext') or 'mp4', 'nhan': 'File gốc'})
    if tieng:
        ra += chon_dinh_dang(info, 'audio', chat, co_ffmpeg)
    return ra


# ── tunnel: yt-dlp tự tải file về máy này (đúng cách nó đã được kiểm chứng: chia khúc, cookie, ghép hình + tiếng),
#    xong mới gửi cho trình duyệt. File giữ 1 giờ để tải lại / tải tiếp bằng Range, rồi tự xoá. ──
THU_MUC = os.environ.get('THU_MUC', '/tmp/may-tai')
MAX_MB = int(os.environ.get('MAX_MB', '600'))


def tao_tunnel(pa, title, url, client):
    tid = secrets.token_urlsafe(18)
    fid = '+'.join(str(f.get('format_id')) for f in pa['inputs'] if f.get('format_id')) or 'best'
    with _lock:
        now = time.time()
        for k in [k for k, v in _tunnels.items() if v['exp'] < now]:
            _tunnels.pop(k, None)
            shutil.rmtree(os.path.join(THU_MUC, k), ignore_errors=True)
        _tunnels[tid] = {'kind': pa['kind'], 'ext': pa['ext'], 'exp': now + TUNNEL_TTL, 'filename': ten_file(title, pa['ext']),
                         'url': url, 'client': client, 'fid': fid, 'file': None, 'lock': threading.Lock(), 'loi': ''}
    return tid


def tai_ve_may(t, tid):
    """Tải đúng định dạng đã chọn về THU_MUC/<tid>/ bằng yt-dlp. Trả đường dẫn file."""
    with t['lock']:
        if t['file'] and os.path.exists(t['file']):
            return t['file']
        d = os.path.join(THU_MUC, tid); os.makedirs(d, exist_ok=True)
        opt = {'quiet': True, 'no_warnings': True, 'noprogress': True, 'noplaylist': True, 'outtmpl': os.path.join(d, 'f.%(ext)s'),
               'format': t['fid'], 'max_filesize': MAX_MB * 1024 * 1024, 'socket_timeout': 30, 'retries': 3}
        if t['client']:
            opt['extractor_args'] = {'youtube': {'player_client': t['client']}}
        if COOKIE_FILE:
            opt['cookiefile'] = COOKIE_FILE
        if t['kind'] == 'mp3':
            opt['postprocessors'] = [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '192'}]
        elif '+' in t['fid']:
            opt['merge_output_format'] = 'mp4'
        with yt_dlp.YoutubeDL(opt) as y:
            y.download([t['url']])
        ds = [os.path.join(d, x) for x in os.listdir(d) if not x.endswith(('.part', '.ytdl', '.temp'))]
        if not ds:
            raise RuntimeError('khong_co_file')
        t['file'] = max(ds, key=os.path.getsize)
        t['ext'] = t['file'].rsplit('.', 1)[-1]
        t['filename'] = t['filename'].rsplit('.', 1)[0] + '.' + t['ext']
        return t['file']


# YouTube hay bắt "xác nhận không phải bot" với máy chủ: thử lần lượt vài kiểu ứng dụng, kiểu nào qua thì dùng
YT_CLIENTS = [['android_vr'], ['default', 'android_vr'], ['tv_simply', 'web_safari'], ['ios']]


def ydl_info(url):
    loi = None
    for cl in (YT_CLIENTS if re.search(r'youtu\.?be', url) else [None]):
        opt = {'quiet': True, 'no_warnings': True, 'noplaylist': True, 'skip_download': True, 'socket_timeout': 20}
        if cl:
            opt['extractor_args'] = {'youtube': {'player_client': cl}}
        if COOKIE_FILE:
            opt['cookiefile'] = COOKIE_FILE
        try:
            with yt_dlp.YoutubeDL(opt) as y:
                return y.sanitize_info(y.extract_info(url, download=False)), cl
        except Exception as e:
            loi = e
            if not re.search(r'bot|Sign in|unavailable|format', str(e), re.I):
                break
    raise loi


def xu_ly(body, goc):
    url = str(body.get('url') or '').strip()
    if not re.match(r'^https?://[^\s]+$', url):
        return 400, {'status': 'error', 'error': {'code': 'error.api.link.invalid'}}
    che_do = 'audio' if body.get('downloadMode') == 'audio' else 'auto'
    try:
        info, client = ydl_info(url)
    except Exception as e:  # yt-dlp báo lỗi: bài riêng tư, bị chặn, link sai…
        return 200, {'status': 'error', 'error': {'code': 'error.api.fetch.fail', 'detail': str(e)[:300]}}
    title = info.get('title') or info.get('id') or 'video'
    entries = [e for e in (info.get('entries') or []) if e]
    if entries:  # bài nhiều video / ảnh (Instagram carousel…)
        picker = []
        for i, e in enumerate(entries[:20]):
            pa = chon_dinh_dang(e, 'auto', body.get('videoQuality') or '1080', bool(FFMPEG))
            if pa:
                tid = tao_tunnel(pa[0], f'{title}-{i + 1}', e.get('webpage_url') or e.get('original_url') or url, client)
                picker.append({'type': 'video', 'url': f'{goc}/tunnel?id={tid}', 'thumb': e.get('thumbnail') or ''})
            elif e.get('url'):
                picker.append({'type': 'photo', 'url': e['url'], 'thumb': e.get('thumbnail') or ''})
        return 200, {'status': 'picker', 'picker': picker}
    pas = chon_dinh_dang(info, che_do, body.get('videoQuality') or '1080', bool(FFMPEG))
    if not pas:
        return 200, {'status': 'error', 'error': {'code': 'error.api.fetch.empty'}}
    items = []
    for pa in pas[:4]:
        tid = tao_tunnel(pa, title, url, client)
        items.append({'loai': 'am_thanh' if pa['kind'] == 'mp3' or not co_hinh(pa['inputs'][0]) else 'video',
                      'url': f'{goc}/tunnel?id={tid}', 'ten': ten_file(title, pa['ext']), 'nhan': pa['nhan']})
    if info.get('thumbnail'):
        items.append({'loai': 'anh', 'url': info['thumbnail'], 'nhan': 'Ảnh bìa'})
    return 200, {'status': 'tunnel', 'url': items[0]['url'], 'filename': items[0]['ten'], 'items': items,
                 'title': title, 'author': info.get('uploader') or info.get('channel') or '', 'duration': info.get('duration') or 0}


class Xu(BaseHTTPRequestHandler):
    server_version = 'may-tai/1'

    def log_message(self, fmt, *args):  # gọn log, không in link
        pass

    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range')
        self.send_header('Access-Control-Expose-Headers', 'Content-Length, Content-Disposition, Content-Range')

    def json_out(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(b)))
        self.end_headers(); self.wfile.write(b)

    def goc(self):
        if PUBLIC_URL:
            return PUBLIC_URL
        proto = self.headers.get('X-Forwarded-Proto') or 'http'
        return f'{proto}://{self.headers.get("Host")}'

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def do_GET(self):
        p = urllib.parse.urlparse(self.path)
        if p.path == '/tunnel':
            return self.tunnel(urllib.parse.parse_qs(p.query).get('id', [''])[0])
        if p.path in ('/', '/health'):
            return self.json_out(200, {'ok': True, 'name': 'may-tai', 'ffmpeg': bool(FFMPEG), 'yt_dlp': yt_dlp.version.__version__})
        self.json_out(404, {'status': 'error', 'error': {'code': 'not_found'}})

    def do_POST(self):
        if API_KEY and not hmac.compare_digest(self.headers.get('Authorization', ''), 'Api-Key ' + API_KEY):
            return self.json_out(401, {'status': 'error', 'error': {'code': 'error.api.auth.key.invalid'}})
        ip = (self.headers.get('X-Forwarded-For') or self.client_address[0]).split(',')[0].strip()
        now = time.time()
        with _lock:
            ds = [t for t in _hits.get(ip, []) if t > now - 60]
            if len(ds) >= MAX_PER_MIN:
                return self.json_out(429, {'status': 'error', 'error': {'code': 'error.api.rate_exceeded'}})
            _hits[ip] = ds + [now]
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get('Content-Length') or 0), 20000)) or b'{}')
        except Exception:
            return self.json_out(400, {'status': 'error', 'error': {'code': 'error.api.invalid_body'}})
        code, out = xu_ly(body, self.goc())
        self.json_out(code, out)

    def tieu_de_file(self, t, them_size=None):
        ten = t['filename']
        self.send_header('Content-Disposition', f"attachment; filename=\"{ten}\"; filename*=UTF-8''{urllib.parse.quote(ten)}")
        self.send_header('Content-Type', {'mp3': 'audio/mpeg', 'm4a': 'audio/mp4', 'webm': 'video/webm'}.get(t['ext'], 'video/mp4'))

    def tunnel(self, tid):
        with _lock:
            t = _tunnels.get(tid)
        if not t or t['exp'] < time.time():
            return self.json_out(404, {'status': 'error', 'error': {'code': 'tunnel_het_han'}})
        try:
            duong = tai_ve_may(t, tid)
        except Exception as e:
            return self.json_out(502, {'status': 'error', 'error': {'code': 'tai_loi', 'detail': str(e)[:300]}})
        tong = os.path.getsize(duong)
        bd, kt, rg = 0, tong - 1, self.headers.get('Range')
        m = re.match(r'bytes=(\d*)-(\d*)', rg or '')
        if m and (m.group(1) or m.group(2)):
            if m.group(1):
                bd = int(m.group(1)); kt = int(m.group(2)) if m.group(2) else tong - 1
            else:
                bd = max(0, tong - int(m.group(2)))
            kt = min(kt, tong - 1)
            if bd > kt:
                self.send_response(416); self.cors(); self.send_header('Content-Range', f'bytes */{tong}'); self.end_headers(); return
            self.send_response(206); self.send_header('Content-Range', f'bytes {bd}-{kt}/{tong}')
        else:
            self.send_response(200)
        self.cors(); self.tieu_de_file(t)
        self.send_header('Accept-Ranges', 'bytes'); self.send_header('Content-Length', str(kt - bd + 1)); self.end_headers()
        try:
            with open(duong, 'rb') as f:
                f.seek(bd); con = kt - bd + 1
                while con > 0:
                    b = f.read(min(CHUNK, con))
                    if not b:
                        break
                    self.wfile.write(b); con -= len(b)
        except (BrokenPipeError, ConnectionResetError):
            pass


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8080'))
    print(f'may-tai chạy ở cổng {port} · ffmpeg: {bool(FFMPEG)} · yt-dlp {yt_dlp.version.__version__} · key: {"có" if API_KEY else "KHÔNG (ai cũng gọi được)"}', flush=True)
    ThreadingHTTPServer(('0.0.0.0', port), Xu).serve_forever()
