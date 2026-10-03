# Prompt để dán vào Claude Code

Copy nguyên thư mục `capcut-clone-spec/` (gồm `SPEC.md` và `screenshots/`) vào thư mục gốc của project, rồi dán prompt dưới đây:

---

Đọc kỹ `capcut-clone-spec/SPEC.md` và xem các ảnh trong `capcut-clone-spec/screenshots/`. Mục tiêu là xây một web video editor có giao diện và thao tác **giống CapCut Web nhất có thể**.

Yêu cầu:
- Stack: React 18 + TypeScript + Vite + Zustand (immer) + lucide-react. Không dùng UI kit nặng.
- Đặt design tokens ở §2 trong `src/styles/tokens.css`. Dựng layout đúng số đo ở §3 (viewport chuẩn 1431×949, app phải co giãn theo cửa sổ).
- Data model theo đúng §13, render loop theo §14, keyframe theo §10, phím tắt theo §12.
- Làm **lần lượt từng bước ở §15**. Xong mỗi bước:
  1. chạy `npm run dev`, chụp màn hình app bằng Playwright ở viewport 1431×949;
  2. so với ảnh tương ứng trong `screenshots/` rồi sửa cho khớp về vị trí, kích thước và màu;
  3. commit, sau đó mới sang bước tiếp theo.
- Mục có ký hiệu ⚠️ là suy luận: làm theo hướng hợp lý nhất và ghi chú lại.
- Tính năng AI và thư viện online chỉ dựng UI placeholder.

Bắt đầu với Bước 1 (Shell UI).
