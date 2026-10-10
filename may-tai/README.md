# Máy tải video (may-tai)

Máy riêng chạy **yt-dlp** để tool **Tải video** của Viral Studio tải được YouTube, Facebook, Instagram, Threads,
Reddit, Pinterest… (TikTok, Douyin, X vẫn tải thẳng như cũ, không cần máy này).

Cách chạy: khi học viên dán link, Apps Script (`TaiVe.gs`) hỏi máy này. Máy đọc thông tin, chọn bản nét nhất
(tối đa 1080p) và bản mp3. Khi học viên bấm Tải về, máy tải file về chính nó, ghép hình và tiếng, rồi gửi về
trình duyệt kèm tên file. File giữ 1 giờ rồi tự xoá.

Vì sao phải có máy riêng: link video gốc của YouTube chỉ chạy với đúng địa chỉ IP đã lấy nó. Các trang tải
video bạn thấy (link `…up.railway.app/proxy/download?url=…googlevideo.com…`) cũng làm đúng cách này.

## Dựng trên Railway (khoảng 10 phút)

1. Vào [railway.com](https://railway.com), đăng nhập bằng GitHub.
2. **New Project → Deploy from GitHub repo**, chọn repo `MinhToan8668/TikTok`.
3. Bấm vào service vừa tạo → **Settings**:
   - **Source → Root Directory**: gõ `may-tai`. Railway tự thấy `Dockerfile`.
   - **Watch Paths**: gõ `may-tai/**`, để sửa landing hay tool khác không làm máy build lại.
4. Tab **Variables → New Variable**:
   - `API_KEY` = một chuỗi bí mật dài, ví dụ 32 ký tự chữ và số ngẫu nhiên. Không chia sẻ chuỗi này.
5. **Settings → Networking → Generate Domain**. Railway cho link dạng `https://ten-may.up.railway.app`.
6. Đợi build xong (Deployments hiện Active), mở link đó. Thấy `{"ok": true, "name": "may-tai", "ffmpeg": true, …}` là máy chạy.
7. Nhắn bot admin: `/maytai https://ten-may.up.railway.app API_KEY_cua_ban`.
   Bot gọi thử, lưu vào Script Properties (`COBALT_URL`, `COBALT_KEY`) và xoá tin chứa key.
8. Mở tab Tải video, dán một link YouTube, Facebook hoặc Instagram để thử.

## Chi phí

Railway có gói dùng thử, sau đó gói Hobby khoảng 5 USD/tháng (đã gồm 5 USD tài nguyên). Máy này rất nhẹ
khi rảnh. Tốn chủ yếu ở băng thông khi học viên tải video; xem mục Usage trên Railway sau vài ngày để biết
mức thật. Muốn giới hạn, đặt thêm biến `MAX_MB` (mặc định 600MB mỗi file).

## Khi YouTube báo "xác nhận bạn không phải bot"

YouTube hay chặn máy chủ thuê. Máy đã tự thử nhiều kiểu ứng dụng; nếu vẫn bị chặn:

1. Dùng một **tài khoản Google phụ** (đừng dùng tài khoản chính), đăng nhập YouTube trên Chrome.
2. Cài tiện ích "Get cookies.txt LOCALLY", mở youtube.com, xuất file `cookies.txt`.
3. Trên Railway, thêm biến `COOKIES` = toàn bộ nội dung file đó, rồi Redeploy.

Cách này cũng giúp tải bài Facebook, Instagram bắt đăng nhập (xuất cookie của trang đó, có thể gộp nhiều
trang trong một file).

## Giữ cho máy luôn tải được

YouTube, Facebook đổi cách chặn thường xuyên. Máy tự cập nhật yt-dlp mỗi lần khởi động lại, nên khi thấy
tải lỗi hàng loạt: vào Railway → service → **Redeploy** là xong.

## Biến môi trường

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `API_KEY` | nên có | Key bí mật, Apps Script gửi kèm để người ngoài không dùng ké máy |
| `COOKIES` | không | Nội dung cookies.txt (Netscape) cho bài cần đăng nhập hoặc khi YouTube chặn |
| `MAX_MB` | không | File tối đa bao nhiêu MB, mặc định 600 |
| `PUBLIC_URL` | không | Link công khai của máy, mặc định tự đọc |

## API (giống cobalt)

- `POST /` với header `Authorization: Api-Key <API_KEY>`, body `{"url": "...", "downloadMode": "auto" | "audio"}`
  → `{"status": "tunnel", "url", "filename", "items": [{loai, url, ten, nhan}], "title", "author", "duration"}`,
  hoặc `{"status": "picker", "picker": [...]}` cho bài nhiều video, hoặc `{"status": "error", "error": {"code", "detail"}}`.
- `GET /tunnel?id=…` → file, có `Content-Disposition`, hỗ trợ `Range`, mở CORS.
- `GET /` → tình trạng máy.

Chạy thử trên máy mình: `pip install yt-dlp && API_KEY=thu PORT=8790 python app.py` (cần `ffmpeg` để ghép 1080p và ra mp3).
