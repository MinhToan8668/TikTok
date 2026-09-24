# Bảy mẫu bố cục

Mọi kích thước tính trên khung rộng 1080px. Script tự scale theo khung thật.

Trường chung cho mọi variant trong spec:

| Trường | Ý nghĩa | Mặc định |
|---|---|---|
| `id` | tên file đầu ra | bắt buộc |
| `template` | một trong 7 mẫu dưới | bắt buộc |
| `blocks` | danh sách đoạn text, mỗi đoạn là một khối; trong đoạn dùng `\n` để ngắt dòng | bắt buộc, trừ `timeline` và `chips` có thể để `[]` |
| `y_pct` | mép trên của khối chữ, tính theo % chiều cao khung (0.12 = 12%). Hook ở trên: 0.12 đến 0.14 để né thanh trên của Reels; text ở ngực: 0.48 đến 0.52 để kết thúc trước 74% | 0.08 |
| `size` | cỡ chữ cơ bản (px trên khung 1080) | tùy mẫu |
| `max_width_pct` | bề rộng tối đa của chữ so với khung; 0.80 khi căn giữa để không chạm cột icon phải | 0.86 |
| `align` | `center` hoặc `left` (chỉ `highlight` và `bubbles`) | center |
| `dim` | phủ tối: `["top" hoặc "bottom", tỉ lệ chiều cao, độ đậm 0-255]`, hoặc `null` để tắt | tùy mẫu |

Markup trong text: `**từ khóa**` để nhấn, `_cụm_` để serif nghiêng.

---

## 1. `highlight` — vệt bút dạ

Chữ trắng, bóng mềm, từ khóa nằm trong vệt highlight màu accent hơi nghiêng, chữ trên vệt màu tối.

- Hợp: hook ngắn 1 đến 2 dòng, nền đơn giản. Mẫu mặc định cho kênh vì dễ đọc và nhất quán.
- Cỡ mặc định 66. Từ khóa nên là 2 đến 4 chữ.
- Phủ tối mặc định: mép trên 28%, nhẹ.

```json
{ "id": "A", "template": "highlight", "y_pct": 0.09,
  "blocks": ["mình có **1 đôi giày rách**\nvì đi làm ngân hàng!?"] }
```

## 2. `editorial` — sans nhẹ + serif nghiêng

Dòng thường mảnh, cụm `_..._` phóng to bằng Playfair Display Italic màu accent, dòng `**...**` đậm to. Có gạch ngắn màu accent dưới cùng.

- Hợp: video kể chuyện, muốn nhìn sang. Cần vùng trên tương đối tối hoặc đơn sắc; script tự phủ tối 50%.
- Mỗi dòng nên là một ý, đặt cụm serif ở dòng giữa để tạo nhịp nhẹ, mạnh, nhẹ.
- Cỡ mặc định 58; serif tự phóng gấp 1.9 lần.

```json
{ "id": "B", "template": "editorial", "y_pct": 0.08,
  "blocks": ["mình có 1 đôi\n_giày rách_\nvì đi làm ngân hàng!?"] }
```

## 3. `glass` — thẻ kính mờ

Panel blur nền, phủ đen 60%, viền trắng mảnh, vạch dọc accent bên trái, chữ căn trái. Có thể thêm `kicker` (dòng chủ đề nhỏ, viết hoa giãn chữ, màu accent).

- Hợp: nền rối, hoặc series cần nhãn chủ đề. Nhìn như giao diện app, chuyên nghiệp.
- Dòng thường dùng weight Light, dòng `**...**` Bold. Đặt câu chốt ở dòng đậm.
- Thêm trường `"kicker": "Chuyện đi làm ngân hàng"`.

```json
{ "id": "C", "template": "glass", "y_pct": 0.07, "kicker": "Chuyện đi làm ngân hàng",
  "blocks": ["mình có 1 đôi giày rách\n**vì đi làm ngân hàng!?**"] }
```

## 4. `sticker` — thẻ đen nghiêng

Toàn bộ chữ nằm trong thẻ màu tối, bo góc lớn, nghiêng nhẹ có bóng đổ. Chữ màu kem, từ khóa màu accent to hơn.

- Hợp: nội dung hài, đời thường, muốn cảm giác "dán" lên video.
- Trường thêm: `"tilt": -2.5` (độ nghiêng, âm là nghiêng trái).
- Giữ 2 dòng. Từ khóa viết hoa cho mạnh.

```json
{ "id": "G", "template": "sticker", "y_pct": 0.09,
  "blocks": ["mình có 1 đôi giày rách\nvì đi làm **NGÂN HÀNG!?**"] }
```

## 5. `bubbles` — hộp chữ TikTok

Mỗi dòng một hộp đen 60% bo góc, chữ trắng, từ khóa accent. Mỗi phần tử trong `blocks` là một khối cách nhau một khoảng.

- Hợp: text dài kiểu tâm sự 2 đến 4 đoạn, đặt ở vùng ngực và tay (y_pct 0.50 đến 0.58).
- Cỡ mặc định 46. Text rất dài thì giảm còn 40 đến 42, hoặc tách thành nhiều variant, mỗi variant một khối, vì trong video các khối hiện lần lượt.
- `max_width_pct` mặc định 0.94 để hạn chế ngắt dòng ngoài ý muốn.

```json
{ "id": "D", "template": "bubbles", "y_pct": 0.52, "size": 44,
  "blocks": ["1 ngày làm bank **quần quật,**\n1 buổi **connect,**", "Còn mối quan hệ nào cũng phải **quy ra tiền**\nthì bạn nghĩ nó đi được _bao xa?_"] }
```

## 6. `timeline` — mốc song song

Danh sách `rows`: mỗi hàng là `["mốc", "nội dung"]`. Mốc màu accent to có vạch dọc, nội dung trắng nhỏ hơn. Sau `rows` là gạch ngăn và các `blocks` căn trái, dùng weight Light.

- Hợp: 3 mốc thời gian, 3 bước, 3 ý song song. Hook đọc được ngay nhờ các mốc.
- Trường thêm: `size_big` cho cỡ mốc (mặc định 58), `size` cho nội dung (mặc định 40).
- Phủ tối mặc định từ mép dưới lên 55%, vì mẫu này thường đặt ở nửa dưới.

```json
{ "id": "E", "template": "timeline", "y_pct": 0.55,
  "rows": [["1 ngày", "làm bank quần quật"], ["1 buổi", "connect"], ["9h tối", "vẫn sửa bài học viên"]],
  "blocks": ["Còn mối quan hệ nào cũng phải quy ra tiền\n_thì nó đi được bao xa?_"] }
```

## 7. `chips` — từ A sang B

Hai chip: trái nền tối chữ trắng, phải nền accent chữ tối, mũi tên trắng ở giữa. Có `lead` (dòng dẫn phía trên) và `blocks` (dòng dưới, đậm).

- Hợp: chuyển đổi, so sánh, hành trình: "KHCN → KHDN", "Đà Nẵng → Bắc Ninh", "0 → 10k follow".
- Chip nên là 1 đến 2 từ viết hoa.

```json
{ "id": "F", "template": "chips", "y_pct": 0.10, "lead": "Vy được chuyển từ",
  "chips": ["KHCN", "KHDN"], "blocks": ["chỉ nhờ **mối quan hệ**"] }
```

---

## Đổi brand

Thêm vào spec:

```json
"brand": { "accent": "#FF5A5F", "dark": "#1A1A1A", "light": "#FFFFFF", "cream": "#F5F0E8" }
```

Mọi mẫu dùng 4 màu này. Không có trường màu riêng cho từng mẫu, để giữ nhất quán.
