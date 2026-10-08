# Hướng dẫn làm poster và bài đăng Facebook / Threads

Đúc kết từ đợt làm bộ poster Viral Studio (10/2026) và hai cẩm nang viết post viral của page.
Làm poster mới thì đọc file này trước, thêm `<section class="poster">` vào `poster.html`,
xuất bằng `xuat.js`.

## Khổ ảnh

**Luật quan trọng nhất: một bài chỉ đăng MỘT ảnh.** Đăng từ 2 ảnh trở lên là Facebook tự ghép
lưới và cắt ảnh theo khung của nó, poster 4:5 sẽ mất tiêu đề hoặc mất chân. Ảnh phụ (cách dùng,
chi tiết) bỏ xuống bình luận, ở đó vẫn hiện nguyên khổ.

| Loại bài | Khổ ta làm | Vì sao |
|---|---|---|
| Bài một ảnh (mặc định) | 4:5, xuất 2160×2700 | Khung dọc cao nhất Facebook cho ảnh đơn (960×1200), chiếm nhiều màn hình nhất |
| Bài chữ ngắn, nhá hàng | 1:1, xuất 2160×2160 (class `vuong`) | Chữ to, gọn |
| Ảnh bìa page | 1920×710 | Khổ điện thoại; máy tính là 1920×1080, lấy 1920×710 là an toàn cho cả hai |
| Ảnh đại diện | 1000×1000 | Facebook cắt tròn, chừa lề an toàn quanh logo |

Xuất gấp đôi (2160 px) để Facebook nén xong chữ vẫn nét.

### Facebook cắt thế nào khi đăng nhiều ảnh

Chỉ dùng bảng này khi buộc phải đăng nhiều ảnh một bài. Làm ảnh sẵn đúng khung thì không bị cắt:

| Số ảnh | Facebook xếp thành |
|---|---|
| 2 ảnh | 2 ảnh ngang 1200×600 xếp chồng |
| 3 ảnh | 1 ảnh dọc 960×1920 bên trái + 2 ảnh vuông bên phải |
| 4 ảnh | 1 ảnh ngang 1920×1280 trên + 3 ảnh vuông dưới |
| 5 ảnh | 2 ảnh vuông lớn trái + 3 ảnh vuông nhỏ phải |

## Màu, chữ, logo

- Màu: lime `#99DF00`, mực `#26210F`, kem `#F9E8DD`, nền thẻ `#FDFBF3`, đỏ nhấn `#FF5A36` (chỉ cho tem MỚI, 0đ).
- Chữ: tiêu đề Bricolage Grotesque 800, thân Be Vietnam Pro.
- Logo giữ kiểu chồng gạch + chữ, KHÔNG làm huy hiệu tròn. Chọn theo nền:
  - nền lime → `logo/lockup-nen-lime.svg` (viên gạch play màu kem)
  - nền tối → `logo/lockup-nen-toi.svg` (gạch sáng, viên play lime)
  - nền kem → `../assets/brand/tmxk-lockup.svg`
- Mỗi bộ chỉ dùng 2–3 nền: lime cho bài chính, mực cho bài đặc biệt, kem cho ảnh hướng dẫn.

## Bố cục

1. Logo góc trên trái, nhãn nhỏ góc trên phải (`Viral Studio · 02/06`).
2. Tiêu đề trên ảnh **trùng với dòng đầu của caption**. Tối đa 2 dòng, có con số hoặc chi tiết cụ thể.
   Cụm nhấn đóng khung mực chỉ một cụm, không để cụm đó gãy dòng (rút chữ, giảm cỡ, hoặc `white-space:nowrap`).
3. Một hình chính: ảnh chụp giao diện thật trong khung điện thoại hoặc máy tính. Không ghép nhiều thứ ngang hàng.
4. Tối đa 3 bước hoặc 3 ý. Thêm một mảnh phóng to chi tiết đáng chú ý nếu còn chỗ trống.
5. Chân ảnh: "👇 Link dùng thử ở bình luận đầu tiên" và một ô lời mời (dùng thử miễn phí…). Không in URL lên ảnh.
6. Ảnh dùng dữ liệu demo thì ghi nhỏ "Ảnh chụp giao diện thật · dữ liệu minh hoạ".

Xuất xong luôn xem lại ảnh: chữ có tràn hay đè nhau không, logo có chìm vào nền không, cụm nhấn có gãy dòng không.

## Cho đúng thuật toán

- Link để ở bình luận đầu rồi ghim, không để trong thân bài, không in lên ảnh.
- Không câu tương tác: "bình luận X để nhận link", "tag bạn", "share để…", "thả tim nếu…". Meta hạ hiển thị.
- Kết bài bằng câu hỏi trả lời được trong 5 giây, hỏi chuyện của người đọc.
- Bài nào cũng cho đi một mẹo dùng được ngay để người ta lưu hoặc gửi bạn.
- Không bịa số. Số phải lấy từ tool hoặc tài liệu khoá (`.claude/skills/hook-text/reference/kien-thuc-hook.md`).
- Không ghi số lượt miễn phí cụ thể hay "không giới hạn" (lượt chỉnh được qua bot, sau này có hạn mức).

## Giọng văn caption

- Facebook xưng "tụi mình", gọi "bạn". Threads xưng "tụi t", gọi "mn", viết thường, viết tắt, mỗi bài dưới 500 ký tự, 1 chủ đề.
- Viết như nhắn tin: câu dài ngắn lộn xộn, "kiểu", "nha", "=)))". Emoji tối đa 3.
- Tránh giọng AI: danh sách có tiêu đề in đậm, câu "Không phải X, mà là Y", chữ "Mẹo:" ở đầu mỗi đoạn, bảng phân tích trong bài.
- Câu chuyện thật của page (ví dụ học viên ngại mua CapCut Pro) đáng giá hơn mọi công thức. Chưa chắc là thật thì hỏi lại, đừng tự bịa.
