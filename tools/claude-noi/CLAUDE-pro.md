# Dự án Dựng chuyên sâu TMXK (lõi FilmCraft)

Thư mục này đã được nối với trang **Dựng chuyên sâu** của Viral Studio (Tự Mình Xây Kênh), đang
mở trong Chrome. Bên trong là FilmCraft, trình dựng kiểu Adobe Premiere chạy bằng WebAssembly:
Source/Program monitor, timeline nhiều track, Lumetri Color, Effect Controls, Audio Mixer, caption.
Bạn (Claude) dựng bằng cách ra lệnh cho FilmCraft. Người dùng xem kết quả ngay trên màn hình, chỉnh
tay tiếp, và Ctrl+Z nếu không ưng.

Trả lời bằng tiếng Việt, ngắn gọn. Gọi tên panel và lệnh bằng tên gốc tiếng Anh của FilmCraft để
người dùng tìm được trên màn hình.

## Cấu trúc thư mục

- `footage/`: video, ảnh, nhạc gốc. Thêm file mới vào đây rồi bấm "Nối lại thư mục" để trình dựng nhận.
- `xuat/`: người dùng để video đã xuất vào đây (FilmCraft xuất ra thư mục Tải xuống của trình duyệt).
- `.tmxk/`: cầu nối (lệnh, kết quả, trạng thái, ảnh khung). Dự án do FilmCraft tự lưu trong trình
  duyệt; muốn có file thì người dùng bấm File → Save trong FilmCraft để tải `.fcproj` về.

## Cách làm việc

1. Xem trạng thái: `node .tmxk/tmxk.mjs xem` (project: items có `item` id; sequence: track, clip
   với `clip` id, `bd`/`kt` giây trên timeline, `src_bd`/`src_kt` giây trong nguồn, `toc`, marker).
2. Tìm lệnh FilmCraft và tham số: `node .tmxk/tmxk.mjs fc_ds '{"loc":"lumetri"}'`. Danh sách đầy đủ
   (khoảng 700 lệnh) nằm trong `.tmxk/CONG-CU.md`, grep trong đó nhanh hơn.
3. Chạy lệnh: `node .tmxk/tmxk.mjs fc_chay '{"lenh":"<id>","tham_so":{...}}'`, ví dụ
   - `fc_chay '{"lenh":"file.newSequence","tham_so":{"name":"TMXK","width":1080,"height":1920,"fps":30}}'`
   - `fc_chay '{"lenh":"timeline.place","tham_so":{"item":1,"track":"V1","seconds":0,"sourceIn":0,"duration":762048000000}}'`
   - `fc_lo '{"buoc":[{"lenh":"...","tham_so":{...}},{"lenh":"..."}]}'` chạy nhiều lệnh theo thứ tự
4. Xem khung hình tại giây t để tự kiểm màu, bố cục, chữ: `fc_khung '{"t":2.5}'`, ảnh nằm ở
   `.tmxk/khung/*.png`. Xem cả cửa sổ: `fc_man_hinh '{}'` (hoặc `{"panel":"Lumetri Color"}`).

Lệnh lỗi trả `⚠` kèm lý do. Đọc lý do rồi sửa tham số, đừng lặp lại y nguyên.

## Quy tắc

- Thời gian trong FilmCraft là tick nguyên: **254016000000 tick = 1 giây**. Nhiều lệnh nhận
  `seconds` hoặc `frame` thay cho `time`/`duration` (xem schema trong `fc_ds`).
- Id clip, item, track lấy từ `xem`. Lệnh "đang tắt" (enabled=false) thường vì chưa chọn clip hoặc
  chưa có sequence: dùng lệnh có tham số id thay vì lệnh theo selection.
- Chưa chắc tham số thì `fc_ds` trước, đừng đoán.
- Làm đúng yêu cầu, không tự ý làm quá. Không export, không xoá track, không tạo project mới khi
  người dùng chưa yêu cầu. Hoàn tác: `fc_chay '{"lenh":"edit.undo"}'`.
- Video ngắn TikTok/Reels: 3 giây đầu phải mạnh, tiếng về khoảng −14 LUFS, màu da tự nhiên, phụ đề
  không che mặt. Sau khi đặt chữ/đồ hoạ/đổi màu, `fc_khung` để tự kiểm rồi sửa tiếp.
- Cuối mỗi lượt: tóm tắt 1–3 câu đã làm gì, gợi ý bước tiếp.

## Khi FilmCraft thiếu tính năng

Nói rõ là chưa có, và ghi yêu cầu vào `YEU-CAU-TINH-NANG.md` trong thư mục này (một dòng: ngày, mô
tả, ví dụ cụ thể). Danh sách đó được mang về repo TikTok để bổ sung.
