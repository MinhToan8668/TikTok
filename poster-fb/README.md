# Poster Facebook · Viral Studio

Bộ poster quảng bá 6 tool Viral Studio cho page Tự Mình Xây Kênh, ảnh cắt từ giao diện thật.

| Thư mục, file | Là gì |
|---|---|
| `xuat/*.png` | **Ảnh để đăng**, 2160×2700. `00` tổng quan, `01`–`06` từng tool, `…b-…-cach-dung` là ảnh 3 bước đi kèm, `07` nền xanh chốt tuần, `tn1`–`tn6` từng tính năng Tải video, `ng-6-toi`/`ng-6-lime`/`ng-6-tool` ba bản ảnh ngang 1920×1280 giới thiệu cả 6 tool, `b4-*` bộ 4 ảnh đăng chung một bài (1 ngang 1920×1280 + 3 vuông 2160×2160) |
| `HUONG-DAN-POSTER.md` | Quy tắc khổ ảnh, bố cục, logo theo nền, thuật toán, giọng văn. Đọc trước khi làm poster mới |
| `bai-dang.md` | Caption từng bài, đoạn chia sẻ vào group, lịch đăng 7 ngày, link từng tool |
| `poster.html` | Bố cục tất cả poster. Mở bằng trình duyệt để xem, sửa chữ ở đây |
| `anh/` | Ảnh chụp giao diện tool (khổ điện thoại 390px ×3, dựng video khổ máy tính) |
| `logo/` | Logo đổi màu theo nền: `lockup-nen-lime.svg` (viên gạch play màu kem), `lockup-nen-toi.svg` (gạch sáng, viên play lime). Nền kem dùng logo gốc trong `assets/brand/` |
| `mau/` | Dữ liệu mẫu để chụp, cắt từ hai bài thật của @financewithto: `bia.jpg`, `anh-bai1/2.jpg` (bài nhiều ảnh), `canh1-3.webm` (3 cảnh cho Dựng video) |
| `chup.js` | Chụp lại `anh/` từ tool trong repo |
| `xuat.js` | Xuất `poster.html` ra `xuat/` |

## Sửa chữ trên poster

Sửa `poster.html` rồi xuất lại:

```bash
NODE_PATH=$(npm root -g) node poster-fb/xuat.js                 # tất cả
NODE_PATH=$(npm root -g) node poster-fb/xuat.js 03-hook-viral   # chỉ một poster
```

## Giao diện tool đổi, cần ảnh mới

```bash
NODE_PATH=$(npm root -g) node poster-fb/chup.js
NODE_PATH=$(npm root -g) node poster-fb/xuat.js
```

Cần Playwright cài toàn cục (`npm i -g playwright && npx playwright install chromium`).
Tool chạy chế độ demo (`#demo`, `#demo-pro`) nên không gọi Apps Script, không tốn lượt AI.
Kết quả trên ảnh là dữ liệu demo, poster đã ghi "dữ liệu minh hoạ".
Riêng tool Tải video dùng media thật trong `mau/`, poster ghi công `@financewithto`.
Thay bài khác thì sửa `BAI_VIDEO`, `BAI_ANH`, `TAC_GIA` ở đầu `chup.js` và thay file trong `mau/`.

Máy không vào được Google Fonts thì cài Be Vietnam Pro và Bricolage Grotesque vào máy
rồi chạy kèm `KHONG_FONT_MANG=1`.

Mảnh phóng to trên poster tool (`.zoom`) cắt theo toạ độ trên ảnh chụp: `--x`, `--y` là góc
trên trái vùng cắt tính bằng px css trên ảnh rộng 390, `--cw`, `--ch` là kích thước vùng, `--k`
là độ phóng. Chụp lại mà bố cục tool xê dịch thì chỉnh `--y` cho khớp.
