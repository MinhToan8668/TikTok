# Hướng dẫn cài đặt backend — Tự Mình Xây Kênh

Landing page **không chứa bất kỳ token nào**. Mọi thứ nhạy cảm (token Telegram,
mật khẩu admin) nằm trong Google Apps Script — người xem web chỉ thấy được URL
`/exec`, và URL đó không làm gì ngoài nhận đăng ký + trả config công khai.

## ⚠️ Bước 0 — THU HỒI TOKEN CŨ (bắt buộc, làm ngay)

Token bot cũ (`7836419098:AA...`) đã nằm trong lịch sử Git công khai → coi như
đã lộ vĩnh viễn, xóa file cũng không cứu được.

1. Mở Telegram, chat với **@BotFather**
2. Gõ `/revoke` → chọn bot của bạn → BotFather cấp **token mới**
3. Token mới **chỉ dán vào Script Properties** (bước 3 bên dưới), tuyệt đối
   không dán vào file HTML hay commit lên Git.

## Bước 1 — Tạo Google Sheet

1. Tạo một Google Sheet mới, đặt tên tùy ý (VD: `TMXK - Đăng ký`)
2. Menu **Extensions → Apps Script**
3. Xóa code mẫu, dán toàn bộ nội dung file `Code.gs` vào
4. Sheet tab `DangKy` sẽ tự được tạo khi có đăng ký đầu tiên

## Bước 2 — Lấy chat ID Telegram của bạn

Cách nhanh nhất: sau khi hoàn thành bước 3–5, nhắn bất kỳ tin gì cho bot —
bot sẽ trả lời kèm chat ID của bạn. Copy số đó quay lại điền vào
`ADMIN_CHAT_IDS`. (Hoặc dùng bot @userinfobot để lấy trước.)

## Bước 3 — Đặt Script Properties

Trong Apps Script editor: **Project Settings (⚙️) → Script Properties → Add**:

| Property | Giá trị |
|---|---|
| `BOT_TOKEN` | Token MỚI từ BotFather (bước 0) |
| `ADMIN_CHAT_IDS` | Chat ID **được ra lệnh** (chat riêng của Toàn, Tiểu My…), cách nhau dấu phẩy. VD: `123456789,987654321` |
| `NOTIFY_CHAT_IDS` | Chat ID group **chỉ nhận thông báo** — thấy tin đăng ký mới, dùng được `/trangthai` `/danhsach`, không đổi được gì. VD: `-1001234567890` |
| `ADMIN_KEY` | Một chuỗi bí mật tùy chọn để mở trang admin, VD: `tmxk-2026-xyz` |

## Bước 4 — Deploy Web App

1. **Deploy → New deployment → Web app**
2. *Execute as*: **Me** · *Who has access*: **Anyone**
3. Copy URL kết thúc bằng `/exec`

> Lưu ý: mỗi lần sửa code phải **Deploy → Manage deployments → Edit → New
> version** thì thay đổi mới có hiệu lực (URL giữ nguyên).

## Bước 5 — Nối bot Telegram với web app

1. Trong `Code.gs`, kéo xuống hàm `setWebhook()`, dán URL `/exec` vào biến
   `EXEC_URL`
2. Trên thanh công cụ chọn hàm `setWebhook` → bấm **Run** (lần đầu sẽ hỏi
   cấp quyền — đồng ý)
3. Log hiện `"ok":true` là xong. Nhắn `/menu` cho bot để kiểm tra.

## Bước 6 — Nối landing page

Mở `index.html`, tìm dòng:

```js
var API = 'PASTE_APPS_SCRIPT_URL_HERE';
```

thay bằng URL `/exec` của bạn. Đây là **chỗ duy nhất** cần sửa trong file HTML.

## Form "Soi kênh miễn phí" (tab `SoiKenh`)

Landing page có thêm form **gửi video, tụi mình soi** (mục `#soikenh`). Form gọi
cùng URL `/exec` với `action:'soi'`, không cần deploy riêng — chỉ cần **New
version** sau khi dán `Code.gs` mới.

- Mỗi lượt gửi → một dòng trong tab `SoiKenh` (tự tạo lần đầu), trạng thái `moi`.
- Bot báo về mọi chat trong `ADMIN_CHAT_IDS` và `NOTIFY_CHAT_IDS`, kèm dòng
  **có cho phép đưa lên kênh hay không**. Không tick = chỉ trả lời riêng qua Zalo,
  tuyệt đối không dùng làm ca sửa công khai.
- Trả lời xong thì sửa tay cột `Trạng thái` thành `da_tra_loi` để biết ai còn nợ.

## Bước 7 — Đặt link group Zalo

Nhắn cho bot:

```
/zalo https://zalo.me/g/xxxxxx
```

Từ lúc đó, học viên điền form xong sẽ thấy nút **"Tham gia group Zalo"** ngay
màn hình cảm ơn.

---

## Các lệnh bot hay dùng

| Lệnh | Tác dụng |
|---|---|
| `/menu` | Danh sách đầy đủ lệnh |
| `/trangthai` | Xem toàn bộ cấu hình + sĩ số hiện tại |
| `/giasom 2000000` | Đổi giá Early Bird |
| `/gia 3000000` | Đổi giá gốc |
| `/khaigiang 05/09/2026` | Đổi ngày khai giảng |
| `/lichhoc Tối Thứ 5 \| 20:00–22:00` | Đổi lịch buổi live |
| `/solop 4` | Mở lớp mới (số thứ tự lớp) |
| `/siso 15` | Sĩ số tối đa |
| `/ngoaihethong 2` | Số học viên đăng ký ngoài web (chuyển khoản tay…) |
| `/dadangky 12` · `/dadangky auto` | Đặt tay số người đã đăng ký hiện trên web / quay lại tự đếm |
| `/zalo <link>` | Link group Zalo hiện sau khi đăng ký |
| `/thongbao <nội dung>` | Bật banner thông báo đầu trang |
| `/tatthongbao` | Tắt banner |
| `/mo` · `/du` · `/dong` | Trạng thái đăng ký của lớp |
| `/danhsach` | Danh sách đăng ký lớp hiện tại |
| `/duyet AB12` · `/tuchoi AB12` | Duyệt / từ chối một đăng ký (hoặc bấm thẳng nút ✅/❌ trong tin báo) |

## Trang admin chỉ-xem

Mở `https://<trang-cua-ban>/?admin=<ADMIN_KEY>` để xem danh sách đăng ký ngay
trên web (chỉ xem — mọi thao tác làm qua bot).

---

## Hook Text Studio · gói Pro (HookAI.gs)

Trang `tools/hook-text.html` có hai gói. Free chạy hết trên trình duyệt. Pro gọi AI qua chính Web App này, dùng lại tài khoản khu học viên nên không ai phải nhập API key.

### Cơ chế

1. Học viên đăng nhập khu học viên trên landing page. Trình duyệt lưu phiên ở `localStorage` với khóa `tmxk_hv`.
2. Trang tool nằm cùng địa chỉ với landing page nên đọc được phiên đó, gọi `hook_status` để mở Pro và hiện số lượt còn lại.
3. Bấm "Phân tích Pro": trang gửi `hook_ai` kèm token, câu hook và ảnh frame đã thu nhỏ.
4. `HookAI.gs` kiểm tra token bằng `aiDay()` của Lich.gs, trừ một lượt, gọi AI bằng key trong Script Properties, rồi trả về điểm hook, 5 hook viết lại, 3 bố cục, caption và hashtag.
5. Lỗi phía AI thì lượt được hoàn lại. Mỗi lần gọi ghi một dòng vào tab **HookAI** trong Sheet: ai dùng, câu hook, số token, model.

Key AI không bao giờ ra tới trình duyệt. Người không đăng nhập chỉ thấy bản Free và màn hình mời mở Pro.

### Hai nhà cung cấp AI

| | Gemini (mặc định) | Claude |
|---|---|---|
| Chi phí | Bậc miễn phí, đủ cho một lớp | Trả theo lượt, Haiku 4.5 khoảng 270đ/lượt, Opus 5 khoảng 1.300đ/lượt |
| Chất lượng tiếng Việt | Khá | Tốt hơn, nhất là phần viết lại hook |
| Dữ liệu | Bậc miễn phí cho phép Google dùng nội dung để cải thiện sản phẩm | Không dùng để huấn luyện |
| Giới hạn | Có hạn mức lượt mỗi phút và mỗi ngày, xem ở aistudio.google.com/rate-limit | Theo credit đã nạp |

Đổi qua lại chỉ bằng thuộc tính `HOOK_AI_PROVIDER`, không cần sửa code hay deploy lại.

### Cài đặt một lần

1. **Lấy key Gemini miễn phí:** vào aistudio.google.com, đăng nhập Google, bấm **Get API key** → **Create API key**. Không cần thẻ. Key bắt đầu bằng `AIza`.
2. Apps Script → **Project Settings** → **Script properties** → thêm:

   | Thuộc tính | Giá trị | Ghi chú |
   |---|---|---|
   | `GEMINI_API_KEY` | `AIza...` | bắt buộc khi dùng Gemini |
   | `HOOK_AI_PROVIDER` | `gemini` | bỏ trống cũng là gemini; đổi `claude` khi muốn |
   | `HOOK_AI_MODEL` | bỏ trống | mặc định `gemini-2.5-flash`; thử `gemini-3.5-flash` nếu tài khoản bạn có |
   | `HOOK_AI_DAILY` | `20` | số lượt mỗi học viên mỗi ngày |
   | `ANTHROPIC_API_KEY` | `sk-ant-...` | chỉ cần khi đổi sang Claude |

3. Thêm file `HookAI.gs` vào project (Files → + → Script), dán nội dung file cùng tên trong repo. Thay `Code.gs` bằng bản trong repo, vì `doPost` có thêm hai dòng định tuyến `hook_ai` và `hook_status`.
4. **Deploy → Manage deployments → Edit → New version → Deploy.** Giữ nguyên URL `/exec` cũ.

### Kiểm tra

- Mở `https://minhtoan8668.github.io/TikTok/tools/hook-text.html` khi chưa đăng nhập: thấy bản Free và thẻ mời mở Pro.
- Đăng nhập khu học viên, quay lại trang tool: góc trên hiện "Chào tên · gói Pro", thẻ Pro hiện "Còn 20/20 lượt hôm nay".
- Bấm Phân tích Pro: sau 10 đến 30 giây có kết quả, tab HookAI trong Sheet có thêm một dòng với cột model là `gemini-2.5-flash`.
- Nếu báo "AI đang quá tải", đó là chạm hạn mức miễn phí của Gemini theo phút. Đợi một phút rồi thử lại, hoặc giảm `HOOK_AI_DAILY`.

Mentor không bị giới hạn lượt.

### Khi nào nên chuyển sang Claude

Khi lớp đông và hay chạm hạn mức miễn phí, hoặc khi muốn phần viết lại hook mượt hơn. Nạp credit ở console.anthropic.com, thêm `ANTHROPIC_API_KEY`, đặt `HOOK_AI_PROVIDER` = `claude` và `HOOK_AI_MODEL` = `claude-haiku-4-5` để rẻ nhất. Không cần deploy lại.

---

## Viral Studio: tài khoản người dùng và bán Pro (Studio.gs)

Trang `tools/hook-text.html` có tài khoản riêng cho người dùng ngoài lớp:

| Loại | Được gì |
|---|---|
| Khách (chưa đăng nhập) | Bố cục Free, xem thử mọi tính năng Pro, xuất PNG có logo |
| Người dùng Free (đăng ký email + SĐT) | 5 lượt dùng thử Pro. Mỗi lần AI phân tích, AI chỉnh chữ, hoặc xuất file có tính năng Pro dùng 1 lượt (xuất lại trong 15 phút không tính thêm) |
| Người dùng Pro (đã chuyển khoản) | Mọi tính năng Pro tới ngày hết hạn, AI 20 lượt mỗi ngày |
| Học viên (tab HocVien) | Pro không giới hạn, đăng nhập bằng tài khoản khu học viên ngay trên trang |

### Cài đặt
1. Apps Script → **+** → Script → đặt tên `Studio` → dán nội dung `Studio.gs`.
2. Điền đầu file `Studio.gs` (hoặc đặt Script properties cùng tên):
   - `ST_NGAN_HANG_MD`: mã ngân hàng VietQR, ví dụ `MB`, `VCB`, `TCB`, `ACB`.
   - `ST_STK_MD`: số tài khoản nhận tiền. `ST_CHU_TK_MD`: tên chủ tài khoản, IN HOA KHÔNG DẤU.
   - `ST_GOI_MD`: tên gói, giá, số ngày. Muốn đổi giá không cần sửa code thì đặt Script property `ST_GOI` dạng JSON.
3. Thêm 3 dòng vào `Code.gs` (đã có sẵn trong bản trên GitHub):
   - trong `doPost`, ngay trước dòng `// Update từ Telegram webhook`:
     `if (e.parameter && e.parameter.pay) return studioWebhook(e, body);`
   - trong `doPost`, ngay sau dòng `if (body.action === 'hook_status') ...`:
     `if (String(body.action||'').indexOf('st_') === 0) return studioApi(body);`
   - trong `handleCallback`, ngay sau dòng `... return lichCallback(cb);`:
     `if (String(cb.data||'').indexOf('s:') === 0) return studioCallback(cb);`
4. Dán `HookAI.gs` bản mới (đã nhận tài khoản người dùng).
5. Deploy → Manage deployments → Edit → New version → Deploy.

### Mở Pro sau khi chuyển khoản
- **Bằng tay:** người dùng bấm "Tôi đã chuyển khoản" → bot Telegram nhắn kèm nút **✅ Đã nhận tiền · mở Pro**. Bấm là người dùng thấy Pro mở trong vài giây (trang tự kiểm tra 8 giây một lần).
- **Tự động (khuyên dùng):** đăng ký [SePay](https://sepay.vn) hoặc Casso, liên kết tài khoản ngân hàng nhận tiền, rồi:
  1. Đặt `ST_WEBHOOK_KEY_MD` trong `Studio.gs` là một chuỗi bí mật dài, ví dụ 24 ký tự ngẫu nhiên.
  2. Ở SePay → Webhooks → thêm URL: `<URL web app>?pay=<chuỗi bí mật>`, kiểu xác thực: không cần.
  3. Tiền vào có nội dung chứa mã `VS...` và đủ số tiền là Pro tự mở, bot báo "💰 tự mở Pro".
  Thiếu tiền thì bot cảnh báo và không mở.

Dữ liệu nằm ở hai tab mới: `NguoiDung` (tài khoản, lượt thử, hạn Pro) và `ThanhToan` (từng mã chuyển khoản).
Muốn tặng thêm lượt hoặc gia hạn tay: sửa cột `luot_dung` (số lượt đã dùng) hoặc `pro_han` (ISO, ví dụ `2026-12-31T16:59:59.000Z`) trong tab `NguoiDung`.
