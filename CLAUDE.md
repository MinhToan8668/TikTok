# Tự Mình Xây Kênh — hướng dẫn cho Claude Code

Repo của khóa học TikTok "Tự Mình Xây Kênh" (TMXK). Không có bước build: HTML tĩnh
deploy thẳng lên GitHub Pages, backend là Google Apps Script deploy tay, bot Telegram
chạy Python trên VPS. Viết code, comment, commit và trả lời bằng tiếng Việt, xưng hô
tự nhiên như trong code hiện có.

## Bản đồ repo

| Đường dẫn | Vai trò | Ghi chú |
|---|---|---|
| `index.html` | Landing page + đăng ký + lịch kèm 1:1 | ~4.400 dòng, một file gồm CSS/JS/HTML |
| `tools/dung-video.html` + `tools/dung/*.js` | Dựng nhanh (style 1, bố cục CapCut, chất liệu FilmCraft): HTML/CSS trong `.html`, JS tách thành 10 file theo mục, `dung/nap.js` ghép lại thành một script lúc chạy (code dựa vào hoisting). `dung/09-chuyen-nghiep.js`: bàn trộn, đồng hồ LUFS, lịch sử thao tác, tự lưu nhiều bản, chế độ cắt, chọn khúc chèn/ghi đè, keyframe màu, keyframe cỡ/màu chữ, đồ thị keyframe dạng làn + đường chuyển động trên khung xem, bản xem nhẹ (proxy 1280px lưu OPFS thư mục `nhe`, xuất luôn dùng file gốc), hình vẽ tô bằng làm mờ / khảm (che vùng, đi cùng Bám vật thể), ổn định hình cho đoạn video (`c.onDinh` lưu phần bù theo thời gian nguồn, áp khi vẽ qua `apDoanGoc`). Đợt 5: thanh tick chọn đoạn / điểm cắt để áp (`dsApDung`), chồng tối đa 5 hiệu ứng (`c.huDs`, phần tử đầu đồng bộ `hu2`/`huMuc`/`huP`), tuỳ chỉnh bộ lọc sinh LUT `tuy:<gốc>:<json>`, nhạc nền tự tạo (`taoNhacTu`). Đợt 6: chỉnh âm lượng / fade ngay trên lớp V1 và A3 (`veLopAm` + `capNhatLopAm`, cập nhật tại chỗ khi kéo để không mất pointer capture), dạng sóng theo mức tuyệt đối (`tinhSong` gắn `out.max`), ngưỡng −1 dBFS tô đỏ + nhãn Quá to. Đợt 7: thanh tab Thuộc tính cuộn ngang (`ganCuonNgang`), ô lẻ gom vào nhóm "Đoạn" (`gomOLe`), tab con một mục thì bỏ tiêu đề, bánh xe màu / đường cong / HSL viết lại (`veBanhXe`, `veDuongCong`, `veHsl` cùng dữ liệu `banh`/`cmau`/`hsl`), đang kéo trong bảng thì hoãn `veProp` (`P._keoProp`), thêm footage thẳng vào dòng thời gian (`themVaoTl`, nút ＋ cuối V1). Đợt 8 (rà soát): hàng thanh trượt trong `#propChon` dạng lưới 4 cột (nhãn · ◇ · thanh · số), hoạt ảnh chữ dạng lưới thẻ (`luoiAnChu`), chữ/nhãn dán đang chọn khi dừng vẽ không hoạt ảnh vào/ra, mũi tên cuộn cho thanh dưới điện thoại (`ganMuiCuon`). Đợt 9–10 (học bố cục Concat, không chép code): khung bo tròn, tiêu đề + thanh phát dưới khung xem (`veDauXem`, `vePhatXem`: mã thời gian, lùi/tới khung, về đầu/cuối, zoom, toàn màn hình), nhãn cỡ/góc trên tay cầm (`.tayNhan`), cột thư viện ~30% (`canhGiua0`), đoạn trên dòng thời gian có thanh tiêu đề màu theo loại (`--kV/--kA/--kT/--kB/--kFx`), khung Media dạng cây có đếm số (`veCayMedia`) + nút Nhập + lưới thẻ; màu nhấn lime TMXK (`--ea:#99DF00`, chữ tối `--eaInk` trên nền lime). Đợt 11 (kéo thả kiểu Concat): kéo từ thư viện có chip theo con trỏ (`chipKeo`, `setDragImage`), thẻ nguồn mờ (`.keoNguon`), bóng đúng độ dài ở lane sẽ rơi vào (`veBongKeo` dùng chung `dichTha`/`hit` với lúc thả), vạch chèn V1; kéo sát mép dòng thời gian tự cuộn, kể cả khi kéo đoạn có sẵn (pointermove giả cộng phần đã cuộn). Đợt 12 (khung xem): thanh tiêu đề / thanh phát trải hết bề ngang, nút lặp / scopes / lớp phủ thành icon nét (`khoiTao09k`), đồng hồ âm lượng `#fcMeter.docMep` nằm sát mép phải `.khungVung` có thang dB, khung chọn chữ `.tayChu` nới 6px và nút xoay đặt phía trên. Thư viện: `tools/kho/kho.js` + `tools/kho/kho-filmcraft.js` (chuyển cảnh, hiệu ứng có tham số `ts` → uniform `p1..p3`, look, âm thanh), đổi `?v=` khi sửa. `dung/giao-dien-fc.css`: lớp giao diện kiểu FilmCraft (bật bằng class `.fc` trên `#ed`) | sửa JS ở `tools/dung/`, đổi `?v=` của `nap.js` và `giao-dien-fc.css` khi deploy |
| `tools/hook-text.html` | Viral Studio · Hook viral (Free không AI, Pro có AI) | ~3.100 dòng |
| `tools/soi-video.html`, `cham-video.html`, `kich-ban.html` | Viral Studio · soi video, chấm video, kịch bản | mỗi file 600–800 dòng |
| `tools/tai-khoan.js` | Module `TK` dùng chung: tài khoản, token, hồ sơ kênh, lượt dùng | nạp bằng `<script src="tai-khoan.js">` |
| `tools/noi-thu-muc.js` | Nối thư mục trên máy với trình dựng: nạp footage, tự lưu dự án, chạy lệnh Claude ghi vào `.tmxk/lenh/` | dùng chung cho cả hai trình dựng qua `window.NTM_CFG`; cần Chrome/Edge máy tính |
| `tools/cau-noi-xa.js` | Nút "📡 Nối với Claude Code" trên hai trình dựng: hiện mã, poll `cc_nhan`, chạy lệnh qua `NTM.cfg`, nộp `cc_kq` | ảnh khung thu còn 640px JPEG để dưới 100 KB |
| `tools/claude-noi/` | `tmxk.mjs` (qua thư mục), `tmxk-xa.mjs` (qua mã ghép nối, chạy từ bất kỳ đâu), `CLAUDE.md`/`CLAUDE-pro.md` mẫu cho thư mục dự án | bộ lệnh lấy từ `AGENT_TOOLS` qua route `/agent_tools` của worker |
| `tools/dung-pro.html` + `dung-pro.js` | Dựng chuyên sâu (style 2, gói Pro): khung TMXK bọc FilmCraft trong iframe, tab Claude Code (nối thư mục, `NTM_CFG` cho `noi-thu-muc.js`), hướng dẫn phím tắt | dự án lưu theo FilmCraft (.fcproj), độc lập với Dựng video |
| `tools/sang-filmcraft.js` | Nút "Mở trong FilmCraft": chuyển V1, b-roll, phụ đề, chữ, mốc sang FilmCraft; lệnh `fc_*` cho cầu nối thư mục | điều khiển tab FilmCraft qua `window.filmcraft` (cùng origin) |
| `tools/filmcraft/` | FilmCraft web v0.7.2 (storytold/filmcraft, MIT/Apache), trình dựng kiểu Premiere bằng WebAssembly | bản build từ release; sửa duy nhất: `index.html` nhận `?wasm=&glue=` để tải từ worker (`/fc/<file>`), nâng cấp thì chép đè rồi thêm lại 2 dòng đó |
| `tools/tao-nen-teams.html` | Tạo nền Teams, độc lập, không gọi API | |
| `apps-script/Code.gs` | `doGet`/`doPost`, đăng ký, Telegram bot, config công khai | điểm vào duy nhất, route theo `body.action` |
| `apps-script/Lich.gs` | Lịch kèm 1:1, action tiền tố `hv_` | |
| `apps-script/Studio.gs` | Tài khoản Viral Studio, gói Pro, action tiền tố `st_` | |
| `apps-script/HookAI.gs` | Gọi Gemini/Claude cho Hook Pro, soi video, action `hook_ai`, `hook_status` | |
| `apps-script/CauNoi.gs` | Cầu nối xa: hộp thư CacheService, action `cc_*`, ghép đôi bằng mã 6 ký tự giữa tab trình dựng và Claude Code | không cần Sheet; tab và Claude đều gọi `/exec` |
| `apps-script/LocKichBan.gs` | Lọc kịch bản từ file phụ đề video dài thành nhiều video / series, action `hook_ai` mode `loc_srt` | |
| `apps-script/HUONG-DAN*.md` | Cách cài backend, Script Properties, webhook | đọc trước khi sửa `.gs` |
| `may-tai/app.py` | Máy tải video riêng (yt-dlp, giao thức cobalt) cho tool Tải video, deploy Railway | cài bằng bot `/maytai`, xem `may-tai/README.md` |
| `bot-tai-video/bot.py` | Bot Telegram tải video bằng yt-dlp | token qua biến môi trường |
| `.claude/skills/dung-video-xa/` | Skill: điều khiển trình dựng của người dùng qua mã ghép nối (`tmxk-xa.mjs`), dùng ngay trong phiên Claude Code cloud | đọc khi người dùng đưa mã 6 ký tự |
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
- Dựng nhanh (`tools/dung/`): thời gian trên dòng thời gian chốt vào lưới khung hình qua `khungGiay` /
  `lamTronKhung` (fps lấy từ `fpsDuAn()`), không ghi số giây thô vào `bd`/`kt`/`t_bd`. Lệnh agent chạy
  qua `agentXuLy` (giao dịch: ném lỗi là dự án về trạng thái trước), tham số số đi qua `kiemSo`. Âm
  lượng đo bằng `tinhNL` (K-weighting) + `doLufs` (gate BS.1770), chuẩn `DB_CHUAN = -14` LUFS.
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
