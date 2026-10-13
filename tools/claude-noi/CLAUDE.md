# Dự án dựng video TMXK

Thư mục này đã được nối với trình **Dựng video** của Viral Studio (Tự Mình Xây Kênh), đang
mở trong Chrome. Bạn (Claude) dựng video bằng cách ra lệnh cho trình dựng. Người dùng xem
kết quả ngay trên dòng thời gian, chỉnh tay tiếp, và bấm Ctrl+Z nếu không ưng.

Trả lời bằng tiếng Việt, ngắn gọn.

## Cấu trúc thư mục

- `footage/`: video và ảnh gốc. Thêm file mới vào đây rồi bấm "Nối lại thư mục" để trình dựng nhận.
- `du-an.tmxk.json`: dự án do trình dựng tự lưu. **Không sửa tay file này**, mọi thay đổi đi qua lệnh.
- `xuat/`: video, phụ đề, FCPXML đã xuất.
- `.tmxk/`: cầu nối (lệnh, kết quả, trạng thái, ảnh khung).

## Cách làm việc

1. Xem dự án trước: `node .tmxk/tmxk.mjs xem`
2. Xem danh sách lệnh và tham số: `node .tmxk/tmxk.mjs cong-cu`
3. Chạy lệnh: `node .tmxk/tmxk.mjs <lenh> '<json>'`, ví dụ
   - `node .tmxk/tmxk.mjs cat_khoang_lang '{"nguong":0.4}'`
   - `node .tmxk/tmxk.mjs xem_loi_thoai '{"src_id":"..."}'`
   - `node .tmxk/tmxk.mjs lo '[{"ten":"bo_vap"},{"ten":"phu_de_mau","a":{"ten":"Vàng karaoke"}}]'`
4. Sau khi đặt chữ, đồ hoạ, đổi khung: chạy `xem_khung '{"t":<giây>}'` rồi mở ảnh
   `.tmxk/khung/*.png` để tự kiểm bố cục. Chữ không được che mặt, không tràn mép.

Lệnh lỗi trả `⚠` kèm lý do. Đọc lý do rồi sửa tham số, đừng lặp lại y nguyên.

## Quy tắc dựng

- Đơn vị là giây. `bd`/`kt` của đoạn V1 là giây trong footage gốc. `tl`, `t_bd`, `bd`/`kt` của
  đồ hoạ là giây trên dòng thời gian.
- Footage chỉ dùng được khi `trang_thai` là `"xong"`. Nếu chưa, `hieu_footage` sẽ tốn 1 lượt
  của người dùng, nên hỏi trước khi gọi.
- Làm đúng yêu cầu, không tự ý làm quá. Không bịa lời thoại.
- Video ngắn: 3 giây đầu phải mạnh, mỗi ý 3–5 giây, bỏ vấp/lặp/lạc, phụ đề bật, đồ hoạ vừa đủ.
- Không gọi `xuat_video`, `long_tieng`, `hieu_footage`, `tao_shorts` khi người dùng chưa yêu cầu.
- Cuối mỗi lượt: tóm tắt 1–3 câu đã làm gì, gợi ý bước tiếp.

## Khi trình dựng thiếu tính năng

Nếu người dùng muốn một thao tác mà không lệnh nào làm được, nói rõ là trình dựng chưa có,
và ghi yêu cầu vào `YEU-CAU-TINH-NANG.md` trong thư mục này (một dòng: ngày, mô tả, ví dụ cụ
thể). Danh sách đó được mang về repo TikTok để bổ sung tính năng cho trình dựng.
