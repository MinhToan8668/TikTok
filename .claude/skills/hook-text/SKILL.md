---
name: hook-text
description: Thiết kế chữ hook (tiêu đề mở đầu) đặt lên frame video TikTok/Reels theo brand Tự Mình Xây Kênh. Dùng khi người dùng gửi ảnh chụp màn hình một frame video kèm nội dung hook và muốn biết nên bố trí chữ thế nào, hoặc nói "làm hook text", "đặt tiêu đề lên video", "bố cục chữ cho video", "text hook". Trả về ảnh preview các phương án, file PNG chữ nền trong suốt để kéo vào CapCut, và hướng dẫn thông số để tự dựng lại.
---

# Hook text cho video

Công cụ này biến một ảnh frame + một đoạn text thành 2 đến 3 phương án bố cục chữ hoàn chỉnh, kèm file overlay và hướng dẫn edit. Người dùng thường là học viên khóa TikTok, không phải designer, nên **kết quả phải dùng được ngay** và lời giải thích phải ngắn, cụ thể.

## Đầu vào cần có

1. **Ảnh frame**: chụp màn hình đoạn video sẽ đặt hook. Nếu ảnh có giao diện app (nút CapCut, thanh TikTok), báo cho người dùng biết bản preview sẽ dính giao diện đó, kết quả thật áp lên video sẽ sạch.
2. **Nội dung hook**: text người dùng muốn hiện. Nếu chưa có, hỏi. Không tự bịa nội dung, nhưng được phép đề xuất ngắt dòng, viết hoa, bỏ viết tắt.

Nếu thiếu một trong hai, hỏi đúng thứ thiếu rồi dừng.

## Quy trình

### Bước 1: Đọc frame

Xem ảnh và ghi nhận:
- **Vị trí mặt và thân người** theo % chiều cao (ví dụ mặt từ 30% đến 55%). Chữ không được đè mặt.
- **Vùng trống**: thường là phía trên đầu (12% đến 28%) hoặc ngực/tay (50% đến 74%).
- **Vùng UI của nền tảng, bắt buộc né** (khung 1080x1920): TikTok trên 150px (8%), dưới 484px (từ 75% trở xuống), cột icon phải 140px trong khoảng 51% đến 76% chiều cao; IG/FB Reels trên 220px (11.5%), dưới 430px (từ 78%), cột icon phải 130px trong khoảng 59% đến 90%; Meta Ads chặt hơn: trên 14%, dưới 35%, hai bên 6%. Vì học viên đăng chéo nền tảng, mặc định né cả TikTok lẫn Reels: bắt đầu chữ từ 12% trở xuống, kết thúc trước 74%, và không để chữ chạm mép phải khi nằm trong dải 51% đến 76%.
- **Nền vùng trống**: sáng hay tối, đơn giản hay rối. Nền sáng đơn giản thì chữ trắng cần phủ tối nhẹ. Nền rối (kệ đồ, bàn thờ, cửa sổ nhiều chi tiết) thì nên dùng mẫu có nền chữ (`glass`, `bubbles`, `sticker`).
- **Tỉ lệ khung**: 9:16, 3:4 hay 4:5. Script tự giữ tỉ lệ.

### Bước 2: Xử lý nội dung

Đọc `reference/kien-thuc-hook.md` trước. Khi hook gốc yếu theo luật 1 giây, đề xuất 2 đến 3 bản viết lại theo các công thức trong đó (con số cụ thể, nỗi đau, lật niềm tin quen, khoảng trống thông tin, xanh chín, HỜI 3 con số, NHƯNG phóng đại) và nói rõ vì sao. Không tự đổi giọng xưng hô của tác giả.

- Tách hook thành **ý chính** (1 cụm người xem phải nắm trong 1 giây) và phần còn lại.
- Chọn **1 đến 2 từ khóa** để nhấn màu. Nhiều hơn là loãng.
- Hook mở đầu: tối đa 2 dòng, mỗi dòng dưới 25 ký tự. Text dài kiểu tâm sự (3 đoạn trở lên) thì dùng `bubbles` hoặc `timeline` và nhắc người dùng cho từng khối hiện lần lượt theo lời nói.
- Viết tắt như "mqh", "KHCN", "t", "m": mở rộng cụm là hook (ví dụ "mối quan hệ"), giữ viết tắt ngành nếu khán giả trong ngành, đổi "m" thành "mình" vì trên màn hình dễ đọc nhầm. Nói rõ với người dùng những chỗ đã đổi.
- Ghi markup: `**từ khóa**` để nhấn, `_cụm chốt_` để dùng serif nghiêng. Xuống dòng bằng `\n` để kiểm soát ngắt dòng.

### Bước 3: Chọn mẫu

Chọn **2 đến 3 mẫu khác nhau về tinh thần**, không chọn 3 mẫu na ná. Bảng chọn nhanh:

| Tình huống | Mẫu nên dùng |
|---|---|
| Hook ngắn, nền đơn giản, muốn nhất quán cả kênh | `highlight` |
| Hook ngắn, muốn sang, video kể chuyện | `editorial` |
| Nền rối, hoặc làm series có nhãn chủ đề | `glass` (có `kicker`) |
| Hài hước, đời thường, kiểu sticker dán | `sticker` |
| Text dài nhiều đoạn, kiểu tâm sự | `bubbles` |
| Nội dung có 3 mốc hoặc 3 ý song song | `timeline` |
| Nội dung "từ A sang B" | `chips` |

Chi tiết từng mẫu và tham số: đọc `reference/templates.md`.

### Bước 4: Viết spec và render

Tạo file spec JSON theo `examples/spec-example.json`, chạy:

```bash
python3 .claude/skills/hook-text/scripts/render.py spec.json
```

Script cần Pillow và numpy. Nếu thiếu: `pip install pillow numpy`.

Đặt `y_pct` theo vùng trống đã xác định ở bước 1. Với hook ở trên: 0.12 đến 0.14. Với text ở ngực: 0.48 đến 0.52. `max_width_pct` để 0.80 khi căn giữa để không chạm cột icon phải.

### Bước 5: Kiểm tra trước khi gửi

Mở `contact-sheet.jpg` và soát từng điểm. Sai bất kỳ điểm nào thì sửa spec và render lại, không gửi bản lỗi kèm lời xin lỗi.

- Chữ không chạm mặt, không tràn mép. Script in dòng `!!` nếu chữ lẹm vùng UI của TikTok, IG/FB Reels hoặc Shorts; có dòng đó là phải sửa, không được gửi.
- Không mất khoảng trắng giữa chữ thường và từ khóa.
- Ngắt dòng hợp nghĩa, không có dòng lẻ một từ.
- Từ khóa nhấn đúng chỗ người dùng muốn.
- Cỡ chữ đọc được khi thu về 540px (contact sheet chính là mức đó).

### Bước 6: Giao kết quả

Gửi cho người dùng:
1. `contact-sheet.jpg` để so sánh, cùng các file `*-preview.jpg`.
2. Các file `*-overlay.png` (nền trong suốt) để kéo thẳng vào CapCut.
3. Tóm tắt **mỗi phương án 2 câu**: kiểu gì, hợp lúc nào. Nêu rõ **một phương án mình khuyên dùng** và lý do.
4. Chỉ đến `guide.md` trong thư mục output cho thông số chi tiết và các bước CapCut. Trong tin nhắn, chỉ nhắc 3 ý cốt lõi: font, màu nhấn, vị trí %.
5. Liệt kê các chỗ đã sửa câu chữ so với bản gốc của người dùng.

Kết thúc bằng một đề nghị duy nhất: nếu người dùng chọn được phương án, gửi video gốc để xuất MP4 có chữ hiện đúng thời điểm.

## Nguyên tắc thiết kế

- **Một màu nhấn** cho cả video: màu accent của brand (`#99DF00`). Không thêm màu khác trừ khi người dùng có brand riêng, khi đó đổi trong `brand` của spec.
- **Font**: Be Vietnam Pro cho toàn bộ chữ sans, Playfair Display Italic cho cụm chốt. Không dùng font không có dấu tiếng Việt chuẩn. Xem `reference/fonts.md`.
- **Phân cấp bằng độ đậm và cỡ chữ**, không bằng viền dày hay nhiều màu.
- **Bóng mềm** thay cho viền đen cứng, trừ khi người dùng yêu cầu kiểu TikTok cổ điển.
- Khi đề xuất, ưu tiên phương án đơn giản nhất còn đọc được. Người xem lướt 0.5 giây.

## Giới hạn

- Script không nhận diện mặt tự động. Việc đọc frame ở bước 1 là do Claude làm bằng mắt và đặt `y_pct` cho đúng.
- Overlay PNG có kích thước bằng frame đã chuẩn hóa về rộng 1080. Video 4K vẫn dùng được, chỉ cần scale overlay lên vừa khung.
- Mẫu `glass` trong overlay dùng nền đen bán trong suốt thay cho blur, vì PNG không blur được nền phía sau. Muốn đúng hiệu ứng kính mờ thì làm theo hướng dẫn trong `guide.md`.
