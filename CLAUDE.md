# Tự Mình Xây Kênh — hướng dẫn cho Claude Code

Repo của khóa học TikTok "Tự Mình Xây Kênh" (TMXK). Không có bước build: HTML tĩnh
deploy thẳng lên GitHub Pages, backend là Google Apps Script deploy tay, bot Telegram
chạy Python trên VPS. Viết code, comment, commit và trả lời bằng tiếng Việt, xưng hô
tự nhiên như trong code hiện có.

## Bản đồ repo

| Đường dẫn | Vai trò | Ghi chú |
|---|---|---|
| `index.html` | Landing page + đăng ký + lịch kèm 1:1 | ~4.400 dòng, một file gồm CSS/JS/HTML |
| `tools/hook-text.html` | Viral Studio · Hook viral (Free không AI, Pro có AI) | ~3.100 dòng |
| `tools/soi-video.html`, `cham-video.html`, `kich-ban.html` | Viral Studio · soi video, chấm video, kịch bản | mỗi file 600–800 dòng |
| `tools/tai-khoan.js` | Module `TK` dùng chung: tài khoản, token, hồ sơ kênh, lượt dùng | nạp bằng `<script src="tai-khoan.js">` |
| `tools/tao-nen-teams.html` | Tạo nền Teams, độc lập, không gọi API | |
| `apps-script/Code.gs` | `doGet`/`doPost`, đăng ký, Telegram bot, config công khai | điểm vào duy nhất, route theo `body.action` |
| `apps-script/Lich.gs` | Lịch kèm 1:1, action tiền tố `hv_` | |
| `apps-script/Studio.gs` | Tài khoản Viral Studio, gói Pro, action tiền tố `st_` | |
| `apps-script/HookAI.gs` | Gọi Gemini/Claude cho Hook Pro, soi video, action `hook_ai`, `hook_status` | |
| `apps-script/LocKichBan.gs` | Lọc kịch bản từ file phụ đề video dài thành nhiều video / series, action `hook_ai` mode `loc_srt` | |
| `apps-script/HUONG-DAN*.md` | Cách cài backend, Script Properties, webhook | đọc trước khi sửa `.gs` |
| `may-tai/app.py` | Máy tải video riêng (yt-dlp, giao thức cobalt) cho tool Tải video, deploy Railway | cài bằng bot `/maytai`, xem `may-tai/README.md` |
| `bot-tai-video/bot.py` | Bot Telegram tải video bằng yt-dlp | token qua biến môi trường |
| `.claude/skills/hook-text/` | Skill thiết kế chữ hook lên frame video cho học viên | skill riêng của dự án, không phải của ECC |
| `assets/` | Logo, brand | |

## Kiến trúc và luồng dữ liệu

- Frontend gọi một URL Apps Script `/exec` duy nhất, khai báo là hằng `API` ở đầu phần
  script của mỗi file HTML. URL này công khai, không phải bí mật. Khi đổi deployment thì
  phải đổi ở cả 5 file HTML.
- Mọi request là `fetch(API, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action, ...})})`.
  Dùng `text/plain` để tránh preflight CORS với Apps Script. Không đổi sang `application/json`.
- Response luôn có dạng `{ok:true, ...}` hoặc `{ok:false, error:'ma_loi'}` qua `jsonOut()`.
  Thêm action mới thì thêm nhánh trong `doPost` ở `Code.gs` và giữ đúng envelope này.
- `doPost` bọc toàn bộ try/catch và ghi lỗi bằng `ghiLoi()`. Không để hàm mới ném lỗi ra ngoài.
- Bí mật (BOT_TOKEN, ADMIN_KEY, API key AI) chỉ nằm trong Script Properties, đọc qua
  `cfgProp()`. Tuyệt đối không ghi token vào HTML, `.gs` hay commit.
- Frontend lưu trạng thái ở `localStorage` với các key `vs_user`, `tmxk_hv`, `vs_dev`,
  `vs_hoso_tam`. Mọi truy cập `localStorage` phải bọc try/catch như trong `tai-khoan.js`.
- Tool Viral Studio phân biệt ba kiểu lỗi: `mang` (mất mạng), `mayChu` (Apps Script trả
  không phải JSON), lỗi nghiệp vụ (`ok:false`). Giữ cách phân loại này khi viết thông báo lỗi.

## Quy ước viết code

- Tên hàm và biến trong `.gs` và JS là tiếng Việt không dấu, ngắn (`datCho`, `layCho`,
  `stHV`, `ndHoSo`). Tiền tố theo module: `st*` Studio, `hook*`/`soi*` HookAI, `nd*` người dùng.
- Apps Script chạy V8 nhưng code hiện dùng `var` và `function` thường. Có thể dùng
  `const`/`let`/arrow trong file HTML; trong `.gs` giữ style hiện có của từng file.
- Không thêm framework, bundler hay npm cho frontend. Vanilla HTML/CSS/JS, mobile-first,
  học viên dùng điện thoại là chính.
- CSS đặt biến màu ở `:root` của từng file. Khi sửa giao diện nhiều tool, dùng cùng
  một bộ token để không lệch phong cách giữa các trang.
- Text hiển thị cho học viên: ngắn, cụ thể, không thuật ngữ. Thông báo lỗi nói rõ phải
  làm gì tiếp.

## Điều chỉnh rules ECC cho repo này

ECC được cài theo dự án trong `.claude/` (profile developer, không hook). Một số rule
chung không áp dụng nguyên văn:

- **Test 80% và TDD**: không có test runner. Với logic thuần trong `.gs` và
  `tai-khoan.js`, viết hàm thuần tách khỏi I/O để có thể kiểm tra bằng Node khi cần,
  và kiểm tra tay trên trang thật sau deploy. Không tự thêm framework test.
- **File dưới 800 dòng**: các file HTML hiện vượt xa ngưỡng này. Không tách ồ ạt. Khi
  một thay đổi chạm vào vùng JS lớn, được phép đề xuất tách phần đó ra file `.js`
  riêng trong `tools/`, nhưng hỏi trước khi làm.
- **Conventional commits**: giữ kiểu commit tiếng Việt hiện có, mô tả kết quả người
  dùng thấy được, ví dụ "Menu: chạm một lần là tới đúng mục".
- **Immutability**: áp dụng cho logic mới; không refactor code cũ chỉ để đổi style.

## Quy trình làm việc khuyến nghị

1. Sửa nhỏ giao diện: sửa thẳng, xong chạy `/review-pr` trước khi commit.
2. Tính năng cho một tool: `/plan` trước để chỉ ra đúng vùng trong file lớn, duyệt rồi code.
3. Thay đổi luồng Apps Script: đọc `HUONG-DAN.md`, sửa `.gs`, nhắc người dùng
   deploy phiên bản mới trong Apps Script vì code trong repo không tự chạy.
4. Sau deploy GitHub Pages: dùng skill `browser-qa` kiểm tra mobile, console và accessibility.
5. Chạm `tai-khoan.js`, `Code.gs`, `Studio.gs`, `bot.py`: chạy `/security-scan`.
6. Cuối phiên: `/ck save` để giữ ngữ cảnh, `/learn` nếu có quy ước mới đáng nhớ.

## Deploy

- Frontend: push lên `main` là GitHub Pages cập nhật. Không có bước build.
- Backend: dán nội dung `.gs` vào Apps Script editor, Deploy → Manage deployments →
  New version. URL `/exec` giữ nguyên.
- Bot: `bot-tai-video/README.md`, chạy bằng systemd trên VPS với `BOT_TOKEN` và `ALLOWED_IDS`.
