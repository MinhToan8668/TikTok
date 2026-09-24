# Font cho chữ tiếng Việt trên video

Tiêu chí: có đủ dấu tiếng Việt vẽ đúng (dấu không lệch, không đè nhau ở chữ hoa như Ầ, Ề, Ỗ), có nhiều độ đậm để phân cấp, đọc được ở cỡ nhỏ trên điện thoại, và miễn phí để học viên dùng không lo bản quyền.

## Bộ mặc định của skill (đã kèm trong `fonts/`)

| Vai trò | Font | Weight dùng | Lý do |
|---|---|---|---|
| Chữ chính | **Be Vietnam Pro** | Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black | Thiết kế riêng cho tiếng Việt, dấu chuẩn nhất trong nhóm font miễn phí, 7 độ đậm nên phân cấp thoải mái |
| Cụm chốt, cảm xúc | **Playfair Display Italic** | 700 đến 800 (font biến thiên) | Serif tương phản cao, nghiêng, tạo điểm dừng mắt; đủ dấu tiếng Việt |

Giấy phép: SIL Open Font License, file `OFL-*.txt` đi kèm. Dùng thương mại, nhúng video, chia sẻ cho học viên đều được.

CapCut và Canva đều có sẵn Be Vietnam Pro và Playfair Display, gõ tên là ra. CapCut điện thoại nếu thiếu thì vào Text → Font → Import và chọn file .ttf trong thư mục `fonts/`.

## Cặp thay thế cùng tinh thần

Khi kênh cần cá tính khác, đổi theo cặp, không trộn lung tung:

| Cảm giác | Sans chính | Serif nhấn | Ghi chú |
|---|---|---|---|
| Trẻ, năng động | **Bricolage Grotesque** | Fraunces Italic | Bricolage là font landing page Tự Mình Xây Kênh, hợp khi muốn đồng bộ web và video; dấu tiếng Việt ổn ở weight 500 đến 800 |
| Trung tính, tech | **Inter** | Lora Italic | Inter cực dễ đọc cỡ nhỏ, hơi khô |
| Ấm, gần gũi | **Nunito** | Lora Italic | Bo tròn, hợp nội dung gia đình, đời sống |
| Mạnh, đập vào mắt | **Archivo Black** hoặc **Anton** | không cần | Chỉ dùng cho 1 dòng hook rất ngắn, viết hoa; Anton dấu tiếng Việt hơi sát chữ, kiểm tra kỹ chữ Ắ, Ễ |
| Sang, tạp chí | **DM Sans** | DM Serif Display Italic | DM Serif chỉ có một weight, dùng cho đúng một cụm |

Tất cả trên Google Fonts, miễn phí.

## Font nên tránh cho tiếng Việt

- Font chỉ có bảng Latin cơ bản (nhiều font display đẹp trên Dafont): dấu bị thay bằng font hệ thống, nhìn lem nhem.
- Font viết tay quá bay: dấu tiếng Việt chồng lên nét, đọc chậm.
- Montserrat cũ bản trước 2017: dấu lệch. Bản trên Google Fonts hiện tại đã ổn.

## Thông số dùng đi dùng lại

Trên khung 1080 x 1920:

- Hook 2 dòng phía trên: 60 đến 72px, line-height 1.3.
- Text dài kiểu hộp chữ: 42 đến 48px, line-height 1.35.
- Kicker viết hoa giãn chữ: 26px, tracking 0.25em.
- Cụm serif nghiêng: gấp 1.6 đến 1.9 lần chữ thường.
- Bóng: đen, opacity 60 đến 70%, blur 10 đến 12, lệch xuống 5 đến 6px.
- Không nhỏ hơn 40px cho bất kỳ chữ nào người xem cần đọc.
