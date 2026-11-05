# HyperFrames trong repo này

HyperFrames (heygen-com/hyperframes, giấy phép Apache 2.0) biến HTML/CSS + hoạt ảnh tua được
(GSAP) thành video MP4. Repo này giữ sẵn 6 skill của nó trong `.claude/skills/`. Vì vậy mọi phiên
Claude Code mở repo này, kể cả phiên cloud, đều dùng được mà không cần cài plugin.

| Skill | Dùng khi |
|---|---|
| `hyperframes` | Đọc đầu tiên: dựng, sửa, làm hoạt ảnh, render bất kỳ video nào (clip dọc, title card, phụ đề, chart, motion graphic) |
| `hyperframes-cli` | Lệnh CLI: tạo dự án, `check`, chụp khung, sửa timeline, preview, render, xử lý lỗi render |
| `hyperframes-registry` | ~450 block dựng sẵn: chuyển cảnh, lớp phủ, chữ động, phụ đề, chart, chuyển động camera. Xem ở đây trước khi tự vẽ hiệu ứng có tên |
| `media-use` | Lấy hoặc tạo media: nhạc, hiệu ứng âm thanh, giọng đọc, phụ đề từ footage, tách nền, chỉnh màu footage tối/nhạt, trộn âm |
| `reverse-any-video` | Dựng lại một video mẫu thành dự án sửa được, rồi so từng khung với bản gốc |
| `style-sampling` | Làm một tập mới theo một phong cách explainer đã có sẵn |

## Cách dùng

Nói với Claude, ví dụ:

> Dùng `/hyperframes`, làm clip dọc 1080x1920 dài 8 giây: hook chữ to màu lime TMXK, footage
> `video.mp4` làm nền, phụ đề tiếng Việt chạy theo lời, nhạc nền nhỏ.

Claude sẽ tạo thư mục dự án (ví dụ `npx hyperframes init ten-video --resolution portrait`), viết
`index.html`, chạy `npx hyperframes check`, rồi `npx hyperframes render` ra `renders/*.mp4`.

- Cần Node 22 trở lên; CLI chạy bằng `npx hyperframes@0.9.13`, không cài gì vào frontend của repo.
- Dự án video là thư mục riêng, đừng đặt trong `tools/` hay cạnh `index.html` để khỏi lẫn vào GitHub Pages.
- Một số việc trong `media-use` (giọng đọc AI, avatar, video tạo bằng AI) gọi HeyGen và tốn credit;
  phần còn lại (phụ đề bằng whisper, tách nền, chỉnh màu, trộn âm) chạy miễn phí trên máy.
- CLI có gửi telemetry khi render. Xem `npx hyperframes telemetry --help` nếu muốn tắt.

## Nguồn và cập nhật

- Chép từ `heygen-com/hyperframes` commit `06722eb` (CLI 0.9.13), thư mục `skills/`.
  Mỗi skill có file `LICENSE` (Apache 2.0) đi kèm. Nội dung skill giữ nguyên, không sửa.
- Tự cập nhật: workflow `.github/workflows/cap-nhat-hyperframes.yml` chạy mỗi ngày lúc 03:17 giờ Việt Nam,
  lấy bản phát hành mới nhất (tag `vX.Y.Z`, khớp phiên bản CLI), chép đè 6 skill bằng
  `.github/scripts/cap-nhat-hyperframes.sh`, sửa commit và phiên bản ở trên, rồi commit thẳng lên `main`.
  Không có bản mới thì không làm gì. Muốn chạy ngay: tab Actions → "Cập nhật skill HyperFrames" → Run workflow.
- Nếu bản mới bỏ hoặc đổi tên một skill, workflow dừng báo lỗi (không xoá gì); khi đó sửa danh sách
  `SKILLS` trong script và bảng ở đầu file này.
- Cập nhật tay: chạy `.github/scripts/cap-nhat-hyperframes.sh` từ gốc repo rồi commit.
