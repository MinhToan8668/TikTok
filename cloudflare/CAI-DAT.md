# Cài máy chủ phụ Cloudflare (miễn phí) cho Viral Studio

Máy chủ này làm ba việc Apps Script không làm được:

| Việc | Ở tool nào | Cần key gì |
|---|---|---|
| **Kho B-roll miễn phí** (Pexels): gõ "cận tay gõ phím" là có video dọc để kéo vào V2 | Dựng video → tab Footage | `PEXELS_KEY` |
| **Lồng tiếng AI tiếng Việt** (8 giọng nam nữ, chỉnh cách đọc), đặt lên track A2 | Dựng video → Thuộc tính | `GEMINI_API_KEYS` |
| **Tải hộ file lớn** (không còn giới hạn 35MB, có tên file) | Tải video | không cần |
| **Trợ lý dựng kiểu agent**: AI tự thao tác từng lệnh lên dòng thời gian (thêm/cắt/tách/trượt đoạn, b-roll, đồ hoạ, cài đặt, xem khung hình tự kiểm), đổi được sang Claude hay GPT | Dựng video → Trợ lý dựng | `GEMINI_API_KEYS` (hoặc key Claude/OpenAI) |

Gói **Workers Free** của Cloudflare: 100.000 lượt gọi mỗi ngày, không cần thẻ. Đủ cho cả lớp.

Không cài thì mọi tool vẫn chạy như cũ, chỉ ẩn ba tính năng trên.

---

## Bước 1 · Tạo tài khoản Cloudflare (2 phút)

1. Vào <https://dash.cloudflare.com/sign-up>, đăng ký bằng email, xác nhận email.
2. Đăng nhập. Không cần thêm tên miền, bỏ qua các bước gợi ý mua gói.

## Bước 2 · Tạo Worker và dán code (3 phút)

1. Menu trái → **Compute (Workers)** → **Workers & Pages** → nút **Create**.
2. Chọn **Start with Hello World!** → **Deploy** (chưa cần sửa gì).
3. Đặt tên khi được hỏi, ví dụ `viral-studio`. Link máy chủ sẽ có dạng
   `https://viral-studio.<tên-tài-khoản>.workers.dev`. **Chép link này lại.**
4. Bấm **Edit code** (góc phải trên). Xoá hết code mẫu trong ô soạn thảo, dán toàn bộ nội dung file
   [`cloudflare/worker.js`](worker.js) vào, bấm **Deploy** (góc phải trên).
5. Mở link máy chủ trên trình duyệt. Thấy dòng `{"ok":true,"ten":"Viral Studio · máy chủ Cloudflare"...` là xong bước này.

## Bước 3 · Thêm key (3 phút)

Trong trang Worker vừa tạo → **Settings** → **Variables and Secrets** → **Add**. Thêm lần lượt, mỗi dòng bấm **Deploy** sau khi thêm:

| Variable name | Type | Value |
|---|---|---|
| `GEMINI_API_KEYS` | Secret | key Gemini đang dùng ở Apps Script. Nhiều key thì cách nhau dấu phẩy, máy chủ tự xoay khi key này hết hạn mức |
| `PEXELS_KEY` | Secret | key miễn phí: vào <https://www.pexels.com/api/>, bấm **Get Started**, đăng ký, vào **Your API key** chép ra. Không giới hạn số lần dùng cho mục đích thường (200 lượt/giờ) |
| `APPS_SCRIPT_URL` | Text | link `/exec` của Apps Script (chính là link đang dán trong tool). Máy chủ dùng để kiểm đăng nhập và trừ lượt khi lồng tiếng |

**Đổi AI cho Trợ lý dựng agent** (tuỳ chọn, mặc định Gemini dùng chung key trên):

| Variable name | Type | Value |
|---|---|---|
| `LLM_PROVIDER` | Text | `gemini` (mặc định) · `claude` · `openai` |
| `ANTHROPIC_API_KEY` | Secret | key tại console.anthropic.com, khi chọn `claude` |
| `OPENAI_API_KEY` | Secret | key tại platform.openai.com, khi chọn `openai` |
| `LLM_MODEL` | Text | tên model nếu muốn khác mặc định (`gemini-3.5-flash`, `claude-sonnet-4-5`, `gpt-4.1`). Gemini hết hạn mức thì máy chủ tự lùi về `gemini-3.5-flash-lite` |

Muốn đổi cách gọi API sâu hơn (endpoint riêng, model khác) thì sửa ba hàm `goiGeminiAgent`, `goiClaudeAgent`, `goiOpenAIAgent` trong `worker.js`; phần còn lại của tool không đổi.

Tuỳ chọn: `ORIGINS` (Text) nếu web chạy ở tên miền khác `https://minhtoan8668.github.io`, ghi các tên miền cách nhau dấu phẩy.

## Bước 4 · Báo cho tool biết (30 giây)

Trong Telegram, gửi cho bot:

```
/maychu https://viral-studio.<tên-tài-khoản>.workers.dev
```

Bot tự gọi thử và báo:

```
✅ Máy chủ phụ: https://viral-studio.abc.workers.dev
Máy chủ trả lời ✅ phiên bản 2026.10.01
• Kho B-roll: ✅
• Lồng tiếng AI: ✅
• Kiểm lượt: ✅
```

Dòng nào ❌ thì quay lại bước 3 thêm key còn thiếu. Tắt máy chủ: `/maychu xoa`.

Sau đó tải lại trang Dựng video: tab **Footage** có ô **Kho B-roll miễn phí**, cột **Thuộc tính** có mục **Lồng tiếng AI (A2)**.

---

## Cách tính lượt

- **Kho B-roll** và **tải hộ**: không tốn lượt, ai cũng dùng được (khách vẫn theo lượt tải của tool Tải video).
- **Trợ lý dựng agent**: mỗi yêu cầu (một lượt nhiều bước) tốn 1 lượt *chat* với tài khoản Free (bot `/luotchat`); Pro và học viên theo hạn mức ngày.
- **Lồng tiếng**: mỗi lần tạo tốn 1 lượt *Dựng video* với tài khoản Free (bot `/luotdung`); Pro và học viên không giới hạn. Máy chủ gọi Apps Script để trừ, nên vẫn là một sổ lượt như cũ.

## Khi có trục trặc

| Hiện tượng | Nguyên nhân · cách sửa |
|---|---|
| Ô Kho B-roll không hiện | Bot `/maychu` chưa cài, hoặc thiếu `PEXELS_KEY`. Gửi `/maychu` (không kèm link) để xem tình trạng |
| Tìm B-roll ra "Máy chủ chưa có PEXELS_KEY" | Thêm secret ở bước 3, nhớ bấm Deploy |
| Lồng tiếng báo `origin` | Web đang chạy ở tên miền lạ. Thêm biến `ORIGINS` |
| Lồng tiếng báo `khong_noi_duoc_apps_script` | `APPS_SCRIPT_URL` sai hoặc Apps Script chưa Deploy "Anyone" |
| Lồng tiếng báo `tts_loi 429` | Key Gemini hết hạn mức phút. Thêm key thứ hai vào `GEMINI_API_KEYS` |
| Trợ lý dựng báo `chua_co_key_claude` / `chua_co_key_openai` | Đã đặt `LLM_PROVIDER` nhưng chưa thêm key tương ứng |
| Trợ lý dựng báo `llm_loi 429` | Model hết hạn mức ngày; đổi `LLM_MODEL` hoặc thêm key |
| Muốn xem log | Trang Worker → **Logs** → **Begin log stream**, rồi thao tác trên tool |

## Cập nhật code máy chủ

Khi repo có bản `cloudflare/worker.js` mới: mở Worker → **Edit code** → dán đè → **Deploy**. Key và biến giữ nguyên.
