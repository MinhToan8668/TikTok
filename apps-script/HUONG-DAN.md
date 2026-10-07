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
| Khách (chưa đăng nhập) | Bố cục Free, xem thử mọi tính năng Pro, 3 lượt AI thử theo thiết bị, xuất PNG có logo |
| Người dùng Free (đăng ký email + SĐT) | 10 lượt AI phân tích hook (đổi bằng `/luotthu`). Font, tuỳ biến sâu, AI chỉnh chữ, xuất sạch cần Pro |
| Người dùng Pro (đã chuyển khoản) | Mọi tính năng Pro tới ngày hết hạn, AI 20 lượt mỗi ngày (đổi bằng `/luotai`) |
| Học viên và vai `pro` (tab HocVien) | Pro không giới hạn, đăng nhập bằng tài khoản khu học viên ngay trên trang |

### Cài đặt
1. Apps Script → **+** → Script → đặt tên `Studio` → dán nội dung `Studio.gs`.
2. Thêm 3 dòng vào `Code.gs` (đã có sẵn trong bản trên GitHub):
   - trong `handleTelegram`, ngay sau dòng `if (quanTri && lichCoLenh(cmd)) ...`:
     `if (quanTri && studioCoLenh(cmd)) return studioLenh(cmd, arg, chatId);`
   - trong `doPost`, ngay sau dòng `if (body.action === 'hook_status') ...`:
     `if (String(body.action||'').indexOf('st_') === 0) return studioApi(body);`
   - trong `handleCallback`, ngay sau dòng `... return lichCallback(cb);`:
     `if (String(cb.data||'').indexOf('s:') === 0) return studioCallback(cb);`
3. Dán `HookAI.gs` bản mới (đã nhận tài khoản người dùng).
4. Deploy → Manage deployments → Edit → New version → Deploy.

5. Nhắn bot `/stk Vietcombank | 0123456789 | Nguyễn Văn A`. Bot đổi tên ngân hàng ra mã VietQR, bỏ dấu tên chủ tài khoản và gửi QR thử để bạn quét kiểm tra.

### Lệnh bot (chat riêng với bot)
| Lệnh | Việc |
|---|---|
| `/studio` | Xem STK, giá, số lượt, số người dùng, giao dịch chờ |
| `/stk Ngân hàng \| STK \| Tên` | Tài khoản nhận tiền |
| `/giapro 50000` · `/ngaypro 30` | Giá và số ngày của gói Pro |
| `/luotthu 10` | Lượt AI phân tích miễn phí cho tài khoản Free |
| `/luotai 20` | Lượt AI mỗi ngày của Pro và học viên |
| `/dsck` | Giao dịch chưa xác nhận (Pro và học phí), kèm nút xác nhận |
| `/ckkhoa bat` · `/ckkhoa tat` | Bật/tắt màn chuyển khoản học phí ngay sau khi học viên điền form đăng ký |
| `/tienkhoa 2000000` · `/tienkhoa auto` | Số tiền học viên chuyển (đặt cọc hoặc học phí; `auto` = giá ưu đãi `/giasom`) |
| `/timnd mail` · `/mopro mail 30` · `/tatpro mail` | Xem, mở tay, tắt Pro một người |

Gõ lệnh trơn (ví dụ `/stk`) thì bot hỏi lại, bạn chỉ cần nhắn nội dung. Mọi thứ lưu vào Script properties, không cần deploy lại.

### Mở Pro sau khi chuyển khoản
- Người dùng quét QR chuyển khoản rồi bấm "Tôi đã chuyển khoản" → bot Telegram nhắn kèm nút **✅ Đã nhận tiền · mở Pro**. Bấm là người dùng thấy Pro mở trong vài giây (trang tự kiểm tra 8 giây một lần).
- Chưa thấy tiền thì bấm **❌ Chưa thấy tiền**, giao dịch chuyển sang `chua_thay`. Người dùng bấm báo lại thì bot nhắn lại.

Dữ liệu nằm ở hai tab mới: `NguoiDung` (tài khoản, lượt thử, hạn Pro) và `ThanhToan` (từng mã chuyển khoản).
Muốn tặng thêm lượt hoặc gia hạn tay: sửa cột `luot_dung` (số lượt đã dùng) hoặc `pro_han` (ISO, ví dụ `2026-12-31T16:59:59.000Z`) trong tab `NguoiDung`.

### Nhận học phí ngay trong form đăng ký học viên
- Bật bằng `/ckkhoa bat` (cần đã cài `/stk`). Học viên điền form xong sẽ thấy QR chuyển khoản, nội dung `TMXK <mã đăng ký>`.
- Học viên bấm "Tôi đã chuyển khoản" → bot nhắn kèm nút **✅ Đã nhận học phí · duyệt học viên**. Bấm là đăng ký chuyển sang `approved`, giao dịch ghi vào tab `ThanhToan` (gói `khoa`).
- Viral Studio mở form này ngay trong trang (`index.html?embed=dangky`), không rời trang edit. Link `index.html#dangky-form` cũng mở thẳng form.

## Chấm kịch bản viral (tools/kich-ban.html)

- Tab thứ hai của Viral Studio. Học viên chọn 1 trong 11 khung kịch bản của khoá, điền từng phần, chọn tốc độ nói. Tool tự đếm chữ và canh giây (mục tiêu 60–105 giây).
- Bấm **Chấm kịch bản** gọi `hook_ai` với `mode: 'script'` trong HookAI.gs (hàm `hookScript`). Kiến thức chấm nằm trong `KB_KIEN_THUC`, khung trong `KB_KHUNG`.
- Lượt dùng chung với AI phân tích hook: khách 3 lượt, tài khoản Free 10 lượt, Pro theo hạn ngày (`HOOK_AI_DAILY`).
- Xem giao diện không cần máy chủ: mở `kich-ban.html#demo`.

## Soi video viral (tools/soi-video.html)

- Tab thứ ba của Viral Studio. Học viên dán link video cùng ngách. `mode: 'link'` (không tốn lượt) lấy caption, tên kênh, ảnh bìa, thời lượng và số liệu (TikTok qua dịch vụ tikwm.com, YouTube qua oEmbed). Khi bấm Soi, máy chủ tự tải video về (TikTok qua tikwm; YouTube Gemini đọc thẳng link; Facebook/Instagram học viên tải file lên, tối đa 40MB) và đưa cho Gemini nghe: bóc lời thoại theo giây, đọc chữ màn hình, nhận xét 1 giây mắt thấy và tai nghe. Video trên 14MB đi qua Files API của Gemini. Không có video thì học viên dán lời thoại.
- Bấm **Soi video** gọi `hook_ai` với `mode: 'soi'` (hàm `hookSoi`). AI mổ theo ba cửa của khoá: dừng lại, xem hết, lặp lại được; đọc bình luận, đọc số theo tỉ lệ trên view; rút khuôn có chỗ trống; áp sang kênh học viên (3 hook + khung kịch bản + gợi ý từng phần).
- Kết quả soi được lưu trong trình duyệt (`soi.kq`), đi qua tab khác rồi quay lại vẫn còn; nút "Soi video mới" để xoá. Sau khi soi, học viên chọn khung kịch bản khác trong ô chọn: `mode: 'apkhuon'` (không tốn lượt) lắp công thức đã rút vào khung mới, trả lời thoại mẫu và cảnh quay từng phần.
- Nút "Viết kịch bản theo khung này" chuyển sang tab Kịch bản viral, điền sẵn lời thoại mẫu và cảnh quay từng phần (qua localStorage `kb.import`). Kết quả chấm kịch bản cũng được lưu (`kb.kq`).
- Phần nghe video chỉ Gemini làm được; nếu HOOK_AI_PROVIDER là claude thì vẫn cần GEMINI_API_KEY cho tool này.
- Lượt dùng chung với AI phân tích hook và chấm kịch bản. Xem giao diện không cần máy chủ: `soi-video.html#demo`.

## Tài khoản, hồ sơ kênh và lượt AI (bản 09/2026)

- **Bỏ hẳn chế độ khách.** Muốn chạy AI phải có tài khoản miễn phí (email + số điện thoại). Đăng ký ngay trong tool, không phải rời trang. File dùng chung: `tools/tai-khoan.js`.
- **Lượt miễn phí theo từng tool:** hook `ST_LUOT_THU` = 10, chấm kịch bản `ST_LUOT_KB` = 3, soi video `ST_LUOT_SOI` = 1. Bot: `/luotthu`, `/luotkb`, `/luotsoi`. Pro và học viên vẫn tính theo `HOOK_AI_DAILY` mỗi ngày.
- **Hồ sơ kênh** (cột `ho_so`, JSON 15 trường): ngách, tệp, định vị, xưng hô, định dạng, độ dài, chữ bắt buộc, nhạc, hashtag, điều cấm, pillar, sản phẩm. Cả ba tool chèn hồ sơ vào prompt nên AI chấm đúng kênh, không nói chung chung. Học viên tự sửa trong mục Tài khoản → Hồ sơ kênh (`st_hoso`).
- **Hồ sơ dựng thẳng từ form đăng ký khoá.** Bảng `DangKy` đã có ngách, tệp, nỗi đau, tone, định dạng, điểm khác biệt. `dkHoSo()` chuyển mấy câu trả lời đó thành hồ sơ kênh, nên học viên vừa điền form là tool đã biết kênh họ, chưa cần tạo tài khoản Studio.
- **Kho hồ sơ chung:** bảng `HoSoKenh` khoá theo email (hoặc số điện thoại). Đọc theo thứ tự: bản sửa tay → cột `ho_so` của tài khoản Studio → dựng tự động từ form đăng ký. Nhờ vậy học viên đăng nhập bằng tài khoản khu học viên cũng được cá nhân hoá.
- **Hồ sơ mẫu 4 kênh** chốt trong buổi 08/09/2026 nằm trong `ST_HS_MAU`. Chạy `stNapHoSoMau()` một lần trong trình soạn Apps Script để tự gán theo tên, hoặc `/naphoso email duong` (duong · duy · phong · hai).
- **Mentor** xem danh sách gộp cả tài khoản Studio lẫn người mới điền form đăng ký khoá, mượn hồ sơ học viên để chạy thử tool, điền hộ hồ sơ cho ai chưa có (`st_ds`, `st_hoso` kèm `email_dich`), xem lịch sử (`st_lichsu`, `/lichsu email`), xem hồ sơ (`/hoso email`), danh sách (`/dshv`).
- **Chống dùng chung tài khoản:** mỗi lượt AI ghi vào bảng `AiLichSu` kèm mã thiết bị. Quá `ST_TB_TOI_DA` (3) thiết bị khác nhau trong `ST_TB_NGAY` (7) ngày thì bot nhắn riêng cho mentor, tối đa một lần mỗi 24 giờ. Không chặn học viên, chỉ báo để mentor tự kiểm tra.
- **Nâng cấp bảng:** `stNangCap()` nối thêm cột mới vào bảng `NguoiDung` đang chạy. Không có hàm này thì `bang()` sẽ đổi tên bảng cũ thành bản lưu và tạo bảng rỗng, mất tài khoản đã có.

## Đăng ký gọn lại: Khách hay Học viên (bản 09/2026)

- Một form duy nhất, chọn vai trước: **Khách dùng thử** tạo tài khoản ngay trong tool; **Học viên khoá học** thì chỉ có hai đường là đăng nhập (tài khoản khu học viên dùng chung cho cả ba tool) hoặc bấm sang trang đăng ký khoá. Không còn nhiều lối vào lẫn lộn.
- Khách hết lượt thì thấy nút **✦ Nâng cấp Pro** cố định ở góc phải dưới, kèm giá lấy từ cấu hình. Đặt giá bằng bot: `/giapro 250k` và `/ngaypro 90` → tự hiện "250.000đ · 3 tháng".
- Màn chuyển khoản nằm luôn trong tool: QR, số tài khoản, số tiền, nội dung, nút "Tôi đã chuyển khoản" báo thẳng cho bot.
- **Link group Zalo** do bot đặt bằng `/zalo https://zalo.me/g/...`. `st_cfg` trả link này xuống, các màn "chờ duyệt" và "đã chuyển khoản" đều dùng chung, không còn câu chữ cứng trong code.

## Chấm video của bạn (bản 09/2026)

- Tab thứ tư của Viral Studio, file `tools/cham-video.html`. Khác Soi video (mổ video người khác để học): ở đây học viên đưa **video của chính mình** lên — kéo file MP4/MOV tối đa 40MB, hoặc dán link TikTok/YouTube video đã đăng — kèm mục tiêu video, ý định muốn truyền tải, và số liệu nếu đã đăng.
- Bấm **Chấm video** gọi `hook_ai` với `mode: 'cham'` (hàm `hookChamVideo` trong HookAI.gs). Dùng lại toàn bộ đường tải video và nghe video của Soi video (`soiLayVideo`, Files API cho video lớn). AI trả về: điểm tổng trên 100 tính theo trọng số 7 thang (hook 25 · giữ chân 25 · nội dung 15 · hình ảnh 10 · âm thanh 10 · dựng 10 · kết 5); khả năng viral thấp/vừa/cao; điểm mạnh phải giữ; lưu ý theo từng giây có mức nặng/vừa/nhẹ; tách **sửa video này** (làm được với footage đang có) với **lần sau** (quay · thu âm · dựng); 3 hook mở lại; 3 kịch bản tiếp theo kèm hook, khung và định hướng 2 tuần. Bảng kiến thức chấm nằm trong `CHAM_KIEN_THUC`.
- Máy chủ tính lại điểm tổng từ 7 thang theo trọng số để không lệch với điểm AI tự ghi. Kết quả lưu trong trình duyệt (`cham.kq`), nút "Viết kịch bản này →" đẩy sang tab Kịch bản viral qua `kb.import`, nút "Đặt lên video →" đẩy hook sang tab Hook viral.
- Lượt riêng: cột `luot_cham` trong bảng `NguoiDung` (`stNangCap()` tự nối cột), mặc định `ST_LUOT_CHAM` = 1, bot chỉnh bằng `/luotcham`. Pro và học viên tính theo `HOOK_AI_DAILY` như các tool khác.
- Xem giao diện không cần máy chủ: `cham-video.html#demo`.

### Video lớn tới 200MB (bản 09/2026)

- Giới hạn 40MB cũ là của Apps Script: mỗi lần gọi chỉ nhận ~50MB, video lại phải đóng base64 (+33%). Giờ trình duyệt **cắt file thành khúc 8MB** (`TK.taiVideo` trong `tai-khoan.js`) gửi lần lượt: `mode: 'up_start'` (size, mime) → `up_chunk` (id, i, b64) → `up_done`. Ở `up_start` máy chủ mở **một phiên resumable upload** lên Gemini Files API; mỗi `up_chunk` nhận được là bơm thẳng qua phiên đó theo offset, khúc cuối kèm finalize rồi chờ file ACTIVE. Không cất tạm ở đâu, **không cần Drive**, không giữ cả video trong bộ nhớ. Giữa các lần gọi chỉ nhớ URL phiên + offset trong Script properties (`UP_<id>`), phiên bỏ dở quá 1 ngày tự dọn.
- Gửi lại một khúc đã nhận (rớt mạng rồi thử lại) thì máy chủ trả `lap: true` và bỏ qua; gửi nhảy cóc thì trả `thieu_khuc` kèm số khúc đang chờ.
- `hook_ai` mode `soi` và `cham` nhận thêm `file_uri` (+ `file_mime`, `file_size`) thay cho `video_b64`. File dưới 12MB vẫn gửi thẳng một lần như cũ. Trần 200MB đặt ở cả hai đầu (`UP_TONG_TOI_DA`). Không tốn lượt AI cho phần tải; cần đăng nhập.

## Vòng khép kín: AI viết trọn kịch bản (bản 09/2026)

- Luồng học viên: **Soi video viral** (tìm mẫu, rút khuôn) → **Kịch bản viral** (AI viết trọn bài) → **Hook viral** (chữ mở đầu) → quay, dựng → **Chấm video của bạn** → 3 kịch bản tiếp theo → quay lại Kịch bản. Bốn tool truyền dữ liệu cho nhau qua `localStorage` (`kb.import`, `hook.text`).
- Nút "AI viết trọn kịch bản này → · 1 lượt AI" ở Soi video và Chấm video ghi `kb.import` kèm `viet: true` và `ngu_canh` (soi: công thức, khuôn, kỹ thuật, chất liệu riêng không được chép, hook đã mượn, lời thoại gốc để học nhịp; chấm: kết luận, điểm mạnh phải giữ, lỗi phải tránh, bài lần sau, định hướng, ý tưởng đã chọn). Tab Kịch bản mở lên là tự gọi `hook_ai` `mode: 'viet'` (hàm `hookVietKichBan`), điền lời thoại + cảnh quay + chữ màn hình vào **mọi phần** của khung, đẩy sẵn chữ hook sang tab Hook. Tính 1 lượt chấm kịch bản (`stToolCua('viet') → 'script'`), hết lượt thì không gọi và mở bảng tài khoản.
- Trong Kịch bản còn nút **"AI viết cả bài · 1 lượt AI"** dùng độc lập cho mọi kiểu content: gửi khung đang chọn, ngách, tệp, mục tiêu, xưng hô, dạng quay, tốc độ nói và những phần đang viết dở (`phan_hien_co`) để AI giữ ý.
- Máy chủ ép đúng số phần và tên phần theo khung, giới hạn tối đa 3 chỗ `[ ]`, tính lại `giay_uoc` từ số chữ. Soi video vẫn giữ nút "Chỉ lấy khung, tự viết →" cho ai muốn tự viết.

### Chấm video: đều tay, bám số thật (bản 09/2026)

- **Độ ngẫu nhiên theo từng việc:** `goiGemini`/`goiClaude` nhận thêm tham số nhiệt độ. Chấm video 0.15, chấm kịch bản 0.2, soi video 0.3, viết bài 0.8, phân tích hook giữ 0.7. Trước đây tất cả dùng 0.7 nên hai lần chấm một video có thể lệch 20 điểm.
- **Bằng chứng trước, điểm sau:** mỗi thang bắt buộc có `bang_chung` (giây, câu, số) rồi mới `diem` theo mốc 0–3 / 4–6 / 7–8 / 9–10 (mục 14 của `CHAM_KIEN_THUC`). Nhãn khả năng viral suy thẳng từ tổng: <45 thấp · 45–69 vừa · ≥70 cao.
- **Số thật là trọng tài** (mục 13): video đã đăng thì tính view/giờ từ số view và giờ đăng (`gio_dang`, tự lấy từ `create_time` của TikTok qua tikwm, hoặc người dùng chọn). Mốc kênh nhỏ 1–2 ngày đầu: <30 chậm · 30–150 bình thường · 150–500 tốt · >500 rất mạnh · >2.000 viral. Đạt mức tốt thì hook và giữ chân không được dưới 6,5, tổng không dưới 65; dưới 30 view/giờ sau 24h thì tổng không quá 60.
- **Nhớ kết quả:** khoá theo mã tài khoản + video (file_uri / đầu file / link) + số liệu + giờ đăng + mục tiêu + ý định. Cùng bộ đó trong 6 giờ thì trả đúng kết quả cũ, hoàn lượt (`tu_bo_nho: true`). Đổi bất kỳ thông số nào là chấm mới. `meta` ghi thêm `model`, `luc`, `gio_dang`, `view_gio`.
- Ô số liệu ở Chấm video và Soi video tự định dạng `12,887` khi rời ô; gõ `12.5K`, `1,2M` vẫn hiểu.

## Gửi video cho Soi video / Chấm video (bản 10/2026): gửi nguyên file một lần

Trước đây video trên 12MB phải cắt thành khúc 8MB, mỗi khúc đóng base64 rồi đi qua Apps Script (chậm, dễ rớt giữa chừng, tối đa 200MB). Giờ:

1. Tool gọi `up_url`: Apps Script mở một phiên tải lên Gemini Files bằng key phân tích, kèm địa chỉ trang tool.
2. Trình duyệt gửi **nguyên file thẳng lên Google** trong một lần, có thanh % và thời gian còn lại. Không base64, không qua Apps Script.
3. Tool gọi `up_xong`: Apps Script chờ Google xử lý xong rồi trả `file_uri` để chấm/soi.

Áp dụng cho mọi video trên 4MB, tối đa 1GB. Video nhỏ hơn 4MB vẫn gửi kèm trong một lần gọi như cũ. Nếu Apps Script chưa cập nhật hoặc mạng chặn, tool tự quay về cách cắt khúc cũ (tối đa 200MB), học viên không phải làm gì. Trang tool đặt ở tên miền khác `*.github.io` thì thêm Script property `UP_ORIGINS` (ví dụ `https://tuminhxaykenh.vn`).

## Tool 5 · Tải video (tools/tai-ve.html + TaiVe.gs)

Dán link là tải được video, ảnh, âm thanh. Không cần đăng nhập, không tốn lượt AI.

**Cài:** trong Apps Script bấm ➕ → Script, đặt tên `TaiVe`, dán nội dung `TaiVe.gs`. Dán `HookAI.gs` mới (có thêm dòng chuyển `mode: 'taive'` sang `taiVe`). Sau đó Deploy → Manage deployments → Edit → New version.

| Nền tảng | Lấy được gì | Đi đường nào |
|---|---|---|
| TikTok, Douyin | Video HD không logo, video có logo, ảnh slide, nhạc nền mp3, ảnh bìa | Trình duyệt gọi thẳng tikwm; lỗi thì máy chủ gọi thay |
| X / Twitter | Video, GIF, ảnh gốc | Trình duyệt gọi thẳng fxtwitter; lỗi thì máy chủ gọi thay |
| Pinterest | Ảnh gốc, video (nếu trang có) | Máy chủ đọc thẻ og: |
| YouTube | Ảnh bìa. Video và mp3 chỉ khi có cobalt | cobalt |
| Instagram, Facebook, Threads, Reddit | Tùy bài công khai; đầy đủ khi có cobalt | cobalt, không có thì đọc thẻ og: |
| Link thẳng tới file .mp4/.jpg/.mp3 | File đó | Trình duyệt |

**Lượt dùng:** học viên và Pro tải không giới hạn. Khách (chưa đăng nhập hoặc tài khoản Free) được `ST_LUOT_TAI` lần, mặc định 10, đổi bằng bot `/luottai 20`. Tài khoản Free do máy chủ đếm (cột `luot_tai`, tự thêm vào sheet NguoiDung). Người chưa đăng nhập thì đếm trong trình duyệt. Còn lượt thì tab Tải video có nhãn FREE ở góc, hết lượt thì nhãn mất. Bấm tiếp sẽ hiện bảng "Nâng cấp Pro / Đăng ký học viên". Bảng này cũng hiện ở Soi, Kịch bản, Chấm video khi hết lượt AI.

**Tải file:** trình duyệt tải thẳng trước. Nếu bị chặn thì máy chủ tải hộ (tối đa 35MB). Vẫn không được thì nút đổi thành "Mở để lưu".

**Muốn tải đủ YouTube / Instagram / Facebook:** tự chạy một máy [cobalt](https://github.com/imputnet/cobalt) (Docker, VPS khoảng 5$/tháng), bật API key. Sau đó thêm vào Script properties: `COBALT_URL` = `https://địa-chỉ-cobalt-của-bạn` và `COBALT_KEY` = key đã tạo. Không cần sửa code. Cobalt công khai (api.cobalt.tools) đã khóa, không dùng được.

## Trợ lý AI · trò chuyện, nói, tự học (tools/tro-ly.js + TroLy.gs)

Nút tròn **🤖 Hỏi trợ lý AI** ở góc trái dưới của cả 5 tool.

- **Gõ hoặc nói:** bấm 🎙️ để nói. Chrome, Edge, Safari nhận giọng ngay trên máy. Trình duyệt không có nhận giọng thì ghi âm rồi gửi cho Gemini nghe. 🔊 bật đọc to câu trả lời. 🗣️ là chế độ nói chuyện rảnh tay: nói, nghe trả lời, rồi tự nghe tiếp.
- **Hiểu ngữ cảnh:** trợ lý đọc kết quả đang hiện ở tool (bài soi, điểm chấm, kịch bản, hook), hồ sơ kênh và 12 tin gần nhất. Học viên hỏi "sao điểm hook thấp?" là nó biết đang nói tới cái gì.
- **Lượt:** tài khoản Free được 15 tin (`/luotchat`). Pro và học viên được 60 tin mỗi ngày (`/chatngay`). Mentor không giới hạn. Chưa đăng nhập thì được mời tạo tài khoản. Free hết tin thì hiện bảng Nâng cấp.

### Tự học: bộ nhớ bài học (sheet `AiBaiHoc`)

Bài học đang bật được chèn vào đầu prompt của **mọi tool AI** (hook, kịch bản, soi, chấm, viết, chat). Mỗi lượt gọi AI chỉ lấy tối đa 15 bài hợp nhất với tool, ngách và câu hỏi.

| Nguồn | Cách tạo | Hiệu lực |
|---|---|---|
| Mentor dạy | Bật **🎓 Chế độ dạy AI** trong khung chat rồi nói hoặc gõ | Dùng ngay |
| Mentor góp ý | Bấm **✍️ Góp ý cho AI** dưới câu trả lời | Dùng ngay |
| Telegram | `/day nội dung` | Dùng ngay |
| AI tự rút khi tư vấn học viên | AI thấy một hiểu biết mới về thị trường hoặc ngách | Chờ duyệt, bot báo kèm `/duyetbh id` |
| Học viên bấm 👎 kèm lý do | Góp ý của học viên | Chờ duyệt |

Quản lý: nút **🧠 Bộ nhớ AI** trong khung chat (chỉ mentor thấy), hoặc bot `/baihoc`, `/duyetbh id`, `/tatbh id`, `/xoabh id`. Mỗi học viên tạo tối đa 3 bài chờ duyệt mỗi ngày để bot không bị spam. Muốn sửa câu chữ một bài học thì sửa thẳng trong sheet `AiBaiHoc` (bộ nhớ đệm tự làm mới sau 10 phút).

### Mentor tra lượt tư vấn và dạy AI trên từng case (sheet `AiTuVan`)

Mỗi lượt hỏi đáp với trợ lý (của học viên, khách và cả mentor) được lưu thành một case: ai hỏi, ở tool nào, câu hỏi, câu AI trả lời, kết quả tool lúc đó, 👍/👎 và lời chê.

- Trong khung Trợ lý bấm **💬 Tư vấn học viên**. Số đỏ trên nút là số lượt chưa dạy. Lọc theo: Chưa dạy · 👎 Bị chê · 🎓 Đã dạy · ✓ Tốt · Tất cả · Của mentor. Tìm được theo tên, email hoặc nội dung.
- Trên mỗi case:
  - **🎓 Dạy AI case này**: gõ hoặc nói AI sai ở đâu, nên tư vấn thế nào. AI chuyển lời dạy thành bài học có hiệu lực ngay.
  - **✓ Trả lời tốt**: AI ghi nhớ hướng trả lời đó cho các câu hỏi tương tự.
- **🧠 Cho AI tự rút bài học từ các lượt mới**: AI đọc các lượt kể từ lần tổng hợp trước (cần ít nhất 5 lượt, mỗi lần đọc tối đa 80 lượt), bỏ qua điều đã có trong bộ nhớ, rút tối đa 5 bài học **chờ duyệt**.
- Bot: `/tuvan` xem nhanh học viên đang hỏi gì. `/tonghop` là tổng hợp ngay.
- Muốn AI tự tổng hợp lúc 21h mỗi tối và báo bot: trong Apps Script chọn hàm `caiTongHopHangNgay` rồi bấm **Run** một lần.

## Chạy nhanh hơn, chạy nền, nhiều Gemini key

**AI chạy nền:** Soi video, Chấm video, Chấm kịch bản, AI viết bài và Trợ lý đều gửi kèm `job_id`. Máy chủ chạy nốt dù người dùng tắt màn hình, chuyển app, sang tool khác hay đóng tab, rồi giữ kết quả 6 giờ (CacheService).
- Mạng đứt giữa chừng: trang tự hỏi lại theo job_id, không phải chạy lại, không tốn thêm lượt.
- Đã rời trang: mở bất kỳ tool nào sẽ hiện "✓ Soi video đã xong · Xem →". Bấm vào là thấy kết quả.
- Đang ở tab hoặc app khác: tiêu đề tab nhấp nháy. Nếu đã cho phép thông báo thì có thông báo của trình duyệt.

**Vì sao chậm hoặc kẹt khi đông người, và đã sửa gì:**
1. Mỗi lượt AI đọc lại cả sheet NguoiDung 3–4 lần. Giờ đọc một lần cho cả lượt. Riêng chỗ trừ lượt vẫn đọc bản mới nhất trong khoá, để hai yêu cầu cùng lúc không trừ trùng.
2. Lưu lượt tư vấn trước đây khoá cả script, nhiều người chat phải xếp hàng. Giờ không khoá nữa: id theo thời gian nên không bị trùng.
3. Chat chỉ nạp phần kiến thức của tool đang mở, nên đầu vào ngắn hơn và trả lời nhanh hơn.
4. Nhiều Gemini key xoay vòng (xem dưới). Key nào bị 429 thì chuyển ngay sang key khác, không ngồi chờ.

**Thêm key (cách nhanh):** nhắn bot `/keygemini them AIza...` (nhiều key cách nhau dấu cách). Bot gọi thử từng key, key tốt thì lưu vào `GEMINI_API_KEYS`, rồi xoá tin chứa key khỏi chat. `/keygemini` xem key nào đang rảnh, key nào hết hạn mức phút hoặc ngày. `/keygemini xoa 2` xoá key phụ số 2. Cách tay vẫn được: Script properties → `GEMINI_API_KEYS`, các key cách nhau dấu phẩy. `GEMINI_API_KEY` vẫn là key chính.
⚠️ Hạn mức Gemini tính theo **project**, không tính theo key. Các key phải tạo ở **các project Google Cloud khác nhau** (AI Studio → Create API key → Create in new project) thì mới cộng dồn được. Nhiều key cùng một project không nhanh hơn chút nào.
☁️ Máy chủ Cloudflare dùng danh sách key **riêng** (`GEMINI_API_KEYS` trong Worker → Settings → Variables and Secrets) cho lồng tiếng, dịch phụ đề, trợ lý dựng. Thêm key mới thì thêm ở cả hai nơi. Hai nơi dùng chung key thì cũng dùng chung hạn mức của project đó.
Cách hiệu quả nhất vẫn là **bật billing (Tier 1)** cho project của key chính: hạn mức mỗi phút tăng hàng chục lần và được Google ưu tiên khi đông.

**Máy chủ xử lý hết hạn mức thế nào (bản 10/2026):**
- Key bị 429 thì nghỉ **riêng model đó**, đúng số giây Google báo. Hết hạn mức ngày thì nghỉ tới lúc Google đặt lại (0 giờ giờ Thái Bình Dương, tức 14–15 giờ chiều VN). Model khác của key đó vẫn dùng tiếp. Lượt sau bỏ qua key đang nghỉ, không gọi thử mất thời gian.
- Video lớn đưa lên Files API bằng key đang rảnh, không dồn hết vào key chính. Trang giữ mã key (`kh`, chỉ là mã băm, không phải key) và gửi lại khi soi, chấm để máy chủ phân tích bằng đúng key đó.
- **Học viên không bao giờ thấy chữ "hạn mức".** Mọi kiểu hết hạn mức hay Google quá tải đều hiện "AI đang quá tải vì nhiều người dùng cùng lúc, thử lại sau khoảng X". Chờ dưới 90 giây thì trang Soi video, Chấm video tự đếm ngược và gọi lại tối đa 2 lần. Lượt luôn được hoàn.
- **Lý do thật** chỉ hiện cho tài khoản mentor (dòng `[mentor] …` sau câu báo lỗi) và gửi bot cho admin: hết hạn mức phút, hết hạn mức ngày (mấy key), hay Google 503. Mỗi loại tối đa 1 tin mỗi 30 phút. Máy chủ Cloudflare cũng báo về bot qua Apps Script (`mode: cf_qua_tai`).

### Xoá nền người nói (chạy trên máy, không tốn lượt)

Thuộc tính → **Nền người nói**: Giữ nguyên · Xoá nền → nhoè · Xoá nền → màu (chọn màu) · Xoá nền → tối. Lần đầu bật, trình duyệt tải mô hình MediaPipe Selfie Segmenter (~10MB, tải một lần), sau đó tách người khỏi nền cho từng khung khi xem trước và khi xuất; tương thích cả ba kiểu khung dọc (cắt giữa, bám mặt, giữ nguyên). Không thấy người trong khung thì vẽ như thường, nên bật nhầm trên b-roll cũng không hỏng hình. Mép người đẹp nhất khi nền phẳng, ánh sáng đều; xuất video chậm hơn bình thường. Lưu trong file dự án (`nenKieu`, `nenMau`).

### Bản đầy đủ (10/2026): tính năng kiểu CapCut + Vyra

Đối chiếu bản research Vyra vs CapCut, trình dựng có thêm:

- **Thuộc tính từng đoạn V1** (chọn đoạn → cột Thuộc tính): phóng to, vị trí ngang/dọc, xoay, độ mờ; **chuyển động keyframe** đầu → cuối đoạn (Zoom vào chậm, Zoom ra, Lia trái → phải, Lia xuống, hoặc tự chỉnh giá trị cuối); **tốc độ** 0,25× → 3× (dòng thời gian, phụ đề, beat tự tính lại, giữ cao độ giọng); **âm lượng** 0–200%, hiện dần vào / mờ dần ra; **màu**: 8 bộ lọc (Ấm, Lạnh, Sáng trong, Điện ảnh, Rực rỡ, Cổ điển, Trắng đen) + độ sáng, tương phản, bão hoà, nút áp cho mọi đoạn.
- **Chữ tự do** và **Sticker** trong thư viện đồ hoạ: kéo thẳng trên khung xem trước, chọn màu, nền (viền, bóng, hộp), 8 hiệu ứng (bật, hiện dần, trượt, nổi lên, gõ chữ, nảy, lắc). Font Be Vietnam Pro giữ dấu chồng (Ẩ, Ễ, Ộ, Ở).
- **Xoá phông xanh (chroma key)** và độ mờ cho b-roll V2.
- **✂ Cắt khoảng lặng** (tab Phụ đề): bỏ khoảng im dài hơn 0,3–1,2 giây và tiếng ừ/ờ/ừm theo lời đã chép từng từ (bản CapCut bên dưới có thêm xem trước); đồ hoạ phía sau tự dồn; Ctrl+Z để hoàn tác.
- **❄ Đóng băng khung** (phím F), **◆ Mốc** trên thước (phím M, chuột phải để xoá).
- **Tỉ lệ khung** 9:16, 1:1, 4:5, 16:9; xuất 720p, 1080p, 1440p, **4K** theo cạnh ngắn.
- **Phong cách** một chạm (Podcast bùng nổ, Vlog nhẹ nhàng, Tin nhanh, Điện ảnh, Năng động, Tối giản) và **lưu phong cách của bạn** dùng lại mọi dự án.
- **Phiên bản** dòng thời gian (＋ Bản) và **✂ Tạo short**: AI cắt footage dài thành 2–5 short (~20/40/60 giây), mỗi short một phiên bản kèm điểm viral và hook (1 lượt chat, mode `dung_shorts` trong DungVideo.gs).
- **Phím tắt** (⌨ hoặc ?): Space, S tách, Delete, Ctrl+D, Ctrl+Z, ← → từng khung, Shift + ← → 1 giây, J/L về điểm cắt, Home/End, M, F, +/−.
- **Trợ lý agent** có thêm lệnh: thuộc tính/tốc độ/màu/keyframe trong `sua_doan`, chữ tự do và sticker, `cat_khoang_lang`, `dong_bang`, `them_moc`, `tao_shorts`, `mo_phien_ban`, tỉ lệ khung và phong cách trong `cai_dat` (31 lệnh).

Chưa làm (cần máy chủ GPU hoặc dịch vụ trả phí): voice clone, tách giọng khỏi nhạc, upscale, theo dõi chuyển động đối tượng bất kỳ, kho nhạc bản quyền.

### Motion graphics (10/2026)

- **24 đồ hoạ trong thư viện**, thêm 11 mẫu: Biểu đồ cột (`Nhãn:số|Nhãn:số`, cột mọc lên kèm số đếm), Biểu đồ tròn %, Trước / Sau, So sánh VS, Checklist (tick từng mục), Trả lời bình luận (khung bình luận kiểu TikTok), Nút Follow (bấm → Đã follow), Đếm ngược, Ghim địa điểm (ghim rơi + sóng), Thanh tìm kiếm (gõ chữ), Thông báo (trượt từ trên xuống). Đều là hàm của thời gian nên tua tới đâu cũng đúng hình, xem trước và xuất giống nhau.
- **Bám theo lời nói**: chọn Danh sách, Checklist, Biểu đồ cột, Trước/Sau hay So sánh → bật "Hiện từng mục đúng lúc nói tới": mỗi mục hiện đúng giây người nói nhắc tới (dựa vào lời đã chép từng từ, tự tính lại khi cắt ghép, đổi tốc độ). Nút **⌖ Đặt đúng lúc nói** dời bất kỳ đồ hoạ nào tới lúc chữ của nó được nói.
- **✨ Đồ hoạ AI (mô tả)**: gõ mô tả tiếng Việt ("biểu đồ đường doanh thu tăng từ 2 lên 9 triệu", "3 ô Hook, Giữ chân, Kêu gọi bay vào lần lượt") → AI thiết kế một cảnh gồm các lớp hộp/tròn/chữ/đường/vòng/số có keyframe và ease, canh theo lời nói trong khoảng đó. Máy chủ tự kiểm lỗi (thiếu chữ, thiếu số, thiếu hướng) và bắt AI sửa một lần; trình dựng vẽ 3 khung thử để chắc có hình. Có **Tạo lại** và **Áp sửa** bằng lời ("chậm hơn, đổi màu đỏ"). AI chỉ trả dữ liệu cảnh, không chạy code, nên an toàn. Mỗi lần tạo tốn 1 lượt chat (Free), chạy qua máy chủ Cloudflare `/do_hoa` (model đổi bằng biến `LLM_DO_HOA`, mặc định gemini-3.5-flash-lite, 2–7 giây).
- **Trợ lý agent** dùng được tất cả: `tim_loi` (giây của một cụm từ), `them_do_hoa` với `bam_loi`, `dat_theo_loi`, kieu `ai` + `canh` (agent tự thiết kế cảnh) hoặc `mo_ta`; quy tắc: ưu tiên mẫu, chỉ tự thiết kế khi không có mẫu hợp, rồi xem khung để tự kiểm. Trợ lý dựng bản nháp (Apps Script) cũng biết 11 mẫu mới.

### Bản CapCut (10/2026): thao tác, chữ, âm thanh, xuất

Làm theo tài liệu tính năng CapCut, ngay trong trình dựng hiện có (không viết lại, không cần máy chủ GPU):

- **Cắt nhanh**: Q bỏ phần trước đầu phát, W bỏ phần sau (ripple), Ctrl+B tách, Ctrl+C / Ctrl+V sao chép, dán tại đầu phát. **Hoàn tác / Làm lại** (Ctrl+Z, Ctrl+Shift+Z hoặc Ctrl+Y, nút ↷), mỗi lượt của trợ lý gộp thành 1 bước.
- **Keyframe từng thuộc tính** (phóng, vị trí ngang/dọc, xoay, độ mờ, âm lượng): bấm ◇ cạnh thanh trượt để đặt mốc tại đầu phát, chấm vàng hiện trên đoạn, chọn kiểu chuyển (mềm, đều, vào, ra, nảy). **Tay cầm trên khung xem trước**: kéo để dời, góc để phóng, núm trên để xoay. **Hoạt ảnh vào/ra** cho đoạn và b-roll (12 kiểu), **lật** ngang/dọc, **cắt khung** (crop).
- **Dạng sóng âm** trên đoạn V1, **Ctrl + lăn chuột** để zoom dòng thời gian, timeline cuộn dọc khi nhiều track.
- **7 tab trái** như CapCut: Media · Âm thanh · Chữ · Phụ đề · Đồ hoạ · Hiệu ứng · Trợ lý.
- **Chữ**: font, đậm, nghiêng, gạch chân, căn lề, viền (màu, độ dày), hộp nền (màu, bo góc), phát sáng, giãn chữ, khoảng dòng; hiệu ứng vào / ra / lặp. **10 mẫu chữ** một chạm (Tiêu đề vàng, Neon, Gõ chữ máy, Số liệu nổi bật, Kêu gọi follow…), emoji nhanh, **sticker PNG/GIF** tải lên thành overlay V3 (vừa khung).
- **Phụ đề**: 6 mẫu một chạm (Trắng viền đen, Vàng karaoke, Hộp nền đen, Viên thuốc, Bật từng từ, Nổi lên nhẹ), **nhập file .srt** thay phụ đề tự sinh.
- **Overlay V3** nằm trên b-roll V2 (chọn Lớp trong Thuộc tính), Khớp khung: phủ kín hoặc vừa khung.
- **Hiệu ứng**: chỉnh màu nâng cao chạy GPU (phơi sáng, nhiệt độ, tint, vùng sáng, vùng tối, vignette, hạt phim), **cường độ bộ lọc**, 6 hiệu ứng clip (rung máy quay, nhịp theo beat, chớp sáng, vệt sáng, phim cũ, phóng nhoè), **áp chuyển cảnh cho mọi điểm cắt**, **nền khung** (đen, màu, mờ chính video, ảnh) khi hình không phủ kín.
- **Âm thanh (track A3)**: 8 hiệu ứng âm thanh tổng hợp ngay trên máy (Whoosh, Pop, Ding, Click, Boom, Riser, Tíc tắc, Chụp ảnh), thêm file, **ghi âm micro** (dòng thời gian phát để nói theo hình), **tách âm thanh** đoạn V1 xuống A3 để làm J-cut / L-cut. Âm lượng theo **dB**, vào/tắt dần, **chuẩn hoá âm lượng** các đoạn về cùng độ to (khoảng -19 dB). A3 lưu trong dự án.
- **✂ Cắt khoảng lặng có xem trước**: bấm → vùng đỏ trên V1 là phần sẽ cắt, bấm **Áp dụng** hoặc **Huỷ**. Footage chưa chép lời vẫn cắt được (đo theo âm lượng). Chỉ tự bỏ ừ, ờ, ừm; "thì, là, kiểu, à" sau chỗ ngập ngừng chỉ được đánh dấu vạch vàng để bạn nghe lại, vì đó có thể là lời thật.
- **Xuất chính xác từng khung** (WebCodecs + mediabunny): vẽ từng khung bằng đúng bộ vẽ của khung xem trước nên bản xuất giống hệt (đã kiểm ở giây 5/15/25), không rớt khung, nhanh hơn thời gian thực với 720p, chạy nền được. Cài đặt (Thuộc tính → Xuất): **MP4 H.264**, MP4 AV1, WebM VP9, **chỉ âm thanh WAV**; 24/25/30/60 khung/giây; chất lượng Vừa/Cao/Rất cao. Máy không mã hoá được codec đã chọn thì tool tự dùng codec khác và báo rõ; trình duyệt cũ không có WebCodecs thì tự ghi thời gian thực như trước (hoặc chọn "Ghi thời gian thực").
- **Trợ lý agent: 45 lệnh**, thêm `keyframe`, `sua_broll` (lớp V3, vừa khung, màu, hoạt ảnh), `ap_tat_ca` (lọc/hiệu ứng/chuyển cảnh cho mọi đoạn), `cat_dau_phat` (Q/W), `nhan_doi`, `mau_chu`, `phu_de_mau`, `nhap_srt`, `nen_khung`, `them_am_thanh`, `sua_am_thanh`, `tach_am_thanh`, `chuan_hoa_am`; `sua_doan` nhận màu nâng cao, hiệu ứng, lật, hoạt ảnh; `sua_do_hoa` nhận đủ kiểu chữ; `xuat_video` nhận fps, định dạng, chất lượng.

### Giao diện kiểu CapCut desktop (10/2026)

Học theo giao diện CapCut và bố cục mã nguồn mở OpenCut (bản classic):

- **Toàn màn hình làm việc** mặc định trên máy tính (nút ⛶ góc trên để thoát / vào lại), nền tối, màu nhấn cyan, nút **Xuất** góc phải.
- **Kéo đổi cỡ** khung trái, khung phải và chiều cao dòng thời gian (bấm đúp tay kéo để đặt lại); máy nhớ kích cỡ.
- **10 tab icon** bên trái: Media · Âm thanh · Văn bản · Nhãn dán · Hiệu ứng · Chuyển cảnh · Bộ lọc · Phụ đề · Đồ hoạ · Trợ lý AI; tab nhiều nhóm có **cột danh mục** bên trái; mẫu hiện dạng **thẻ có ảnh** (bộ lọc xem trước bằng khung hình hiện tại), footage dạng lưới.
- **Trình phát** có đồng hồ giờ:phút:giây:khung, đổi tỉ lệ ngay dưới khung.
- **Thuộc tính theo tab**: đoạn video có Video · Hoạt ảnh · Tốc độ & âm · Điều chỉnh; khi không chọn gì: Khung hình · Xuất · Dự án.
- **Thanh công cụ icon**: hoàn tác, làm lại, tách, xoá trái/phải (Q/W), xoá, nhân đôi, đóng băng, lật, xoay 90°, cắt khung, keyframe nhanh, tách âm thanh, mốc, trượt, ripple, hít, zoom.
- **Keyframe như CapCut**: chọn đoạn → bấm thước để đưa đầu phát tới điểm đầu (đoạn vẫn được chọn) → bấm ◇ cạnh thuộc tính (thành ◆) → dời đầu phát tới điểm sau → kéo thanh hoặc kéo hình trên khung, máy tự thêm ◆ và nội suy ở giữa. ◆ vàng trên đoạn: bấm để nhảy tới, kéo để đổi thời điểm. Phím: K thêm keyframe mọi thuộc tính, Alt+J / Alt+L keyframe trước / sau, Ctrl+Shift+K xoá keyframe tại đầu phát; Ctrl+= / Ctrl+− phóng to / thu nhỏ, Shift+Z vừa khung.
- **Chọn nhiều mục** (như CapCut): Ctrl/⌘ + bấm hoặc Shift + bấm từng mục, hoặc kéo khung chọn ở chỗ trống của dòng thời gian; Ctrl+A chọn tất cả. Kéo một mục là cả nhóm dời theo; Delete xoá cả nhóm; Ctrl+C / Ctrl+V sao chép, dán giữ nguyên khoảng cách; Ctrl+X cắt.
- **Gộp nhóm** (Ctrl+G, bỏ gộp Ctrl+Shift+G): các mục trong nhóm luôn được chọn và dời cùng nhau, có dấu 🔗.
- **Nam châm track chính** (nút nam châm cạnh Liên kết): bật = các đoạn V1 luôn liền nhau; tắt = kéo đoạn tự do, để khoảng trống đen (chọn khoảng trống + Delete để đóng). Bật lại thì mọi khoảng trống tự đóng.
- **Liên kết**: bật thì chữ, b-roll, âm thanh nằm trên một đoạn V1 sẽ đi theo đoạn đó khi đổi chỗ hay dời.
- **Preview axis**: bật rồi rê chuột trên dòng thời gian là khung xem trước hiện hình tại chỗ chuột (vạch vàng), đầu phát không đổi.
- **Đường cong tốc độ** (tab Tốc độ & âm của đoạn): 6 mẫu Montage, Anh hùng, Đạn bay, Nhảy cắt, Vụt vào, Vụt ra, hoặc kéo 5 điểm (0,1× – 10×); thời lượng đoạn tự tính lại, phát và xuất đúng tốc độ.
- **Đường cong keyframe**: đứng ở một ◆, chọn Mượt, Chậm dần, Nhanh dần, Đều, Vượt rồi về, Đàn hồi, hoặc Tuỳ chỉnh (kéo 2 núm bezier).
- **Phím**: Ctrl+S lưu dự án, Ctrl+I nhập file, Ctrl+E xuất.
- **Kéo để tua**: giữ chuột trên thước thời gian hoặc chỗ trống của dòng thời gian rồi kéo, khung xem trước chạy theo (tự cuộn khi chạm mép).
- **Xếp lớp như CapCut**: chỉ hiện line đang có nội dung (line trống tự ẩn, track chính V1 luôn có), đầu track không tên, chỉ có nút tắt tiếng / ẩn / khoá và vạch màu theo loại. Line nằm trên phủ line nằm dưới (cả khi xuất). Kéo thả tự do: thả vào line đúng loại còn trống giờ thì nằm luôn ở đó; thả vào line khác loại hoặc đang vướng giờ thì tự mở line mới ngay chỗ thả; thả lên khoảng trống phía trên cùng thì thành line mới trên cùng. Kéo đoạn V1 lên trên thành video chồng, kéo video chồng xuống V1 thành đoạn chính. Thuộc tính có "Lớp n/N · Lên trên · Xuống dưới", chuột phải có Đưa lên/xuống lớp, phím Ctrl+] / Ctrl+[
- **Track theo loại như CapCut** (theo cấu trúc draft_content của CapCut: mỗi track một loại, các đoạn trong một track không chồng giờ, track trên vẽ đè track dưới): thêm chữ, đồ hoạ, emoji tự vào hàng **Văn bản**; b-roll, ảnh, sticker PNG tự vào hàng **Video**; hiệu ứng âm thanh, ghi âm tự vào hàng **A3**. Chỗ đó đang có mục khác cùng giờ thì tự mở hàng mới cùng loại (hàng video mới luôn nằm dưới hàng chữ), nên một loại có nhiều hàng là bình thường. Kéo mục sang hàng khác loại bị từ chối; kéo chồng giờ lên mục khác thì mục vừa kéo tự sang hàng trống.
- **Kéo mép để cắt** đoạn V1, b-roll, chữ, đồ hoạ, âm thanh: rê chuột vào mép thấy tay cắt trắng, kéo vào/ra, có ô hiện độ dài; mép hít vào đầu phát, mép các mục khác, beat và câu nói. Cắt V1 thì phía sau tự dồn.
- **Đầu track**: tắt tiếng, ẩn, khoá từng track (áp cả khi xuất). **Dải khung hình** trên đoạn video. **Menu chuột phải** trên đoạn (tách tại đây, xoá trái/phải, sao chép, dán, nhân đôi, đóng băng, tách âm thanh, lật, keyframe, xoá) và trên track.

### Đặc tả CapCut 9.1 · Đợt 1 (10/2026)

- **Tự lưu + Dự án của tôi** (nút Dự án trên thanh trên): trình dựng tự lưu vào trình duyệt vài giây một lần (có chữ "✓ Đã lưu"), cả footage (lưu trong bộ nhớ riêng OPFS của trình duyệt, không cần thêm lại file). Danh sách dự án có ảnh bìa, độ dài, dung lượng; tìm, sắp xếp theo ngày/tên/dung lượng; mở, đổi tên, nhân bản, xoá. Dự án xoá nằm **thùng rác 30 ngày**, khôi phục được.
- **Gói dự án .zip** (trong Dự án của tôi): gói dự án + footage thành một file để chuyển máy; máy kia bấm Nhập gói.
- **Mặt nạ** (tab Mặt nạ của đoạn V1/b-roll): Đường thẳng, Gương, Tròn, Chữ nhật (bo góc), Trái tim, Ngôi sao; chỉnh vị trí, cỡ, xoay, mềm viền, đảo ngược. Mặt nạ đi theo khung hình của đoạn.
- **Hoà trộn** (b-roll, chữ, đồ hoạ): 16 chế độ như CapCut (Multiply, Screen, Overlay, Soft light…).
- **LUT .cube** (tab Bộ lọc → Nhập LUT): tối đa 20 MB, lưu trong trình duyệt, áp cho đoạn đang chọn hoặc mọi đoạn, có cường độ. Chuột phải để xoá LUT.
- **Điều chỉnh màu thêm**: Trắng, Đen, Sắc độ, Độ rực, Phai màu, Độ nét, Độ trong (chạy WebGL, áp cả khi xuất).
- **Trình phát**: lưới 3×3, vùng an toàn TikTok (thanh trên, cột nút, tên/mô tả), phóng khung 50/100/200%, nút ⟲ phát lặp.
- **In/Out**: I đặt điểm vào, O đặt điểm ra (vùng xanh trên thước), Alt+X bỏ. Phát lặp sẽ lặp trong vùng này; Xuất chọn Khoảng xuất = Vùng In–Out.
- **J/K/L**: L phát (bấm tiếp để 2×, 4×, 8×), J tua lùi, K dừng (khi không tua thì K vẫn là thêm keyframe). Nhảy điểm cắt chuyển sang ↑ / ↓.
- **Xuất thêm**: GIF (10/12/15 khung/giây, rộng 240/360/480), ảnh tĩnh PNG tại đầu phát, ước tính dung lượng trước khi xuất.
- **Media**: lọc Tất cả / Video / Ảnh; rê chuột ngang trên ảnh thu nhỏ để xem lướt video.

### Đặc tả CapCut 9.1 · Đợt 2 (10/2026)

- **Đảo ngược đoạn** (tab Tốc độ & âm hoặc chuột phải): đoạn V1 phát lùi; bản xuất đảo cả hình và tiếng. Tách, cắt mép, Q/W vẫn đúng chiều.
- **Tốc độ 0,1–100×**: thanh kéo + nút nhanh 0,1×, 0,5×, 1×, 2×, 5×, 10×, 100×. **Giữ cao độ giọng** (bật mặc định); tắt thì giọng cao/trầm theo tốc độ. Trên 16× hoặc đảo ngược, xem trước tua từng khung (có thể giật), bản xuất vẫn mượt.
- **Thay đoạn** (chuột phải đoạn V1/lớp phủ): thay bằng file mới hoặc footage khác, giữ vị trí, độ dài, hiệu ứng, màu.
- **Dán thuộc tính** (Ctrl+Alt+V): Ctrl+C một mục rồi chọn mục khác (một hoặc nhiều) → nhận khung hình, màu, LUT, mặt nạ, hoà trộn, keyframe, kiểu chữ; giữ nguyên nguồn và khúc cắt.
- **Tách mọi track** (Shift+S): tách cùng lúc V1, lớp phủ, chữ, âm thanh tại đầu phát (bỏ qua track đang khoá).
- **Lớp trên cùng / dưới cùng** (Ctrl+Shift+] / [ hoặc chuột phải). **Alt + kéo** chữ/lớp phủ/âm thanh để nhân bản.
- **Keyframe**: Chép ◆, Dán ◆ (sang đoạn khác hoặc chỗ khác), Đảo ngược (chuyển động chạy ngược).
- **Mốc**: chuột phải mốc → đổi tên, ghi chú (hiện khi rê chuột), 6 màu, xoá.
- **Track**: bấm đúp đầu track (chỗ trống) hoặc chuột phải → đổi tên; **Solo** chỉ hiện (track hình) hoặc chỉ nghe (track tiếng) track đó.
- **Chữ**: chuyển màu (gradient, chọn màu thứ hai và hướng), uốn cong (∩ / ∪), chữ dọc.

### Đặc tả CapCut 9.1 · Đợt 3 (10/2026): chạy ngay trên máy

- **Tách theo cảnh** (chuột phải đoạn V1): máy dò chỗ đổi cảnh (so màu và điểm ảnh từng khung nhỏ) rồi tách đoạn.
- **Bám vật thể** (đồ hoạ chữ/sticker/hình → tab Đồ hoạ → Bám vật thể): đặt điểm bám lên vật thể, bấm 🎯; máy dò 10 điểm/giây trên khung đã dựng, chữ đi theo và giữ khoảng cách.
- **Hình vẽ** (Đồ hoạ → ⬛ Hình vẽ): chữ nhật bo góc, tròn, tam giác, ngôi sao, trái tim, lục giác, mũi tên, đường thẳng; màu tô / chỉ viền, độ dày viền, xoay, độ mờ, hiện ra mờ dần / phóng / vẽ dần.
- **Biểu đồ đường, biểu đồ vùng** + **nhập CSV** (2 cột nhãn, số; dấu phẩy, chấm phẩy hoặc tab; dòng tiêu đề tự bỏ). Đổi qua lại cột / đường / vùng.
- **Giảm tiếng ồn** (đoạn V1 → Tốc độ & âm): trừ phổ theo hồ sơ ồn tự đo ở chỗ im lặng; nút 🎧 Nghe thử 6 giây; áp khi xuất video và WAV.
- **Phụ đề song ngữ** (tab Phụ đề): chọn ngôn ngữ (Anh, Trung, Hàn, Nhật, Thái, Indonesia, Pháp, Tây Ban Nha) → 🌐 Dịch phụ đề (qua máy chủ Cloudflare, tốn 1 lượt AI mỗi 60 câu) → dòng dịch hiện dưới phụ đề, có trong file .srt.
- **Scopes** (nút 📊 dưới trình phát): biểu đồ màu RGB, dạng sóng độ sáng, vectorscope có vạch màu da.
- **Bánh xe màu** (vùng tối / trung tính / vùng sáng, kéo để đẩy màu, thanh dưới để sáng/tối, bấm đúp để đặt lại), **Đường cong** (Tổng, R, G, B; bấm thêm điểm, kéo, bấm đúp xoá), **HSL** 8 dải màu (sắc độ, bão hoà, độ sáng từng dải). Tất cả chạy WebGL, áp cả khi xuất.

**Không làm được trên trình duyệt (cần mô hình AI lớn hoặc dịch vụ trả phí):** tạo video/ảnh bằng AI, tách giọng khỏi nhạc chất lượng cao, nhái giọng, khớp khẩu hình, tăng độ phân giải bằng AI; phần thương mại/đội nhóm/đám mây (P3).

### Phụ đề và kéo thả như CapCut (10/2026)

- **Phụ đề là đoạn chữ trên track**: bấm để chọn (hoặc bấm phụ đề ngay trên khung xem trước), bấm đúp để sửa chữ, Delete để xoá, tách tại đầu phát, nút câu trước/sau. Sửa chữ là sửa luôn lời thoại, câu vừa sửa giữ nguyên một khối.
- **Kéo dời / kéo mép** một câu: phụ đề tự tách thành đoạn chữ riêng (giữ nhịp từng từ); đè lên câu bên cạnh thì câu đó tự ngắn lại.
- **Kéo video vào dòng thời gian giữ đủ độ dài** (trước đây lớp phủ chỉ lấy 4 giây). Thả vào track chính thì chèn cả video tại chỗ gần nhất; thả phía trên thì thành lớp phủ, chồng giờ thì tự mở line mới. Thả file từ máy thẳng vào dòng thời gian cũng được.

### Thao tác chuẩn CapCut Desktop 9.1 (10/2026)

Theo bộ phím Custom1 và menu của CapCut:

- **Chế độ Chọn (V) / Cắt (C)**: ở chế độ Cắt, bấm lên đoạn là tách đúng chỗ bấm (có vạch dọc theo chuột). Esc về Chọn.
- **Tách**: Ctrl+K / Ctrl+B tách mục đang chọn tại đầu phát (không chọn gì thì tách track chính); Ctrl+Shift+K / Shift+S tách mọi track (đang đứng trên ◆ của mục chọn thì xoá ◆).
- **Phím khác**: S hít, Shift+Backspace nam châm track chính, Ctrl+L liên kết, A / Shift+A chọn mọi mục trước / sau đầu phát, Shift+X vùng In–Out theo đoạn, Shift+E ẩn/hiện đoạn, Ctrl+R mở bảng tốc độ, Ctrl+. / Ctrl+, tăng giảm 1 dB, M / Alt+M mốc (màu khác) / Shift+M mốc sau / Alt+Shift+M mốc trước, Ctrl+J đánh dấu beat, Shift+Alt+K keyframe cơ bản, Alt+K bảng keyframe, Ctrl+Alt+C / V sao chép / dán thuộc tính có chọn nhóm (biến đổi, màu, bộ lọc, tốc độ, hoạt ảnh, mặt nạ, âm lượng, hoà trộn, keyframe, kiểu chữ), Ctrl+M xuất, Ctrl+N dự án mới, Ctrl+F / ` toàn màn hình, Alt+G / Alt+Shift+G gộp / bỏ gộp, Shift+← → 10 khung, giữ Ctrl khi kéo để tạm tắt hít, Alt+cuộn để cuộn ngang. Bấm ? để xem bảng đầy đủ.
- **Menu chuột phải đoạn**: thêm Sao chép / Dán thuộc tính…, Ẩn đoạn, Tắt tiếng, Tốc độ…, Đổi tên, Nhãn màu (6 màu, vạch trên đoạn), Thêm mốc, Vùng In–Out theo đoạn, Xoá và dồn (ripple delete). **Chuột phải ◆**: Tuyến tính, Chậm đầu, Chậm cuối, Mượt hai đầu, Giữ (Hold), chép / dán / xoá ◆. **Chuột phải track**: chiều cao thấp / vừa / cao, xoá mọi mốc, xoá track.
- **Thanh trượt**: bấm vào số để gõ giá trị, bấm đúp nhãn để đặt lại.
- **Trình phát**: tỉ lệ 9:16, 1:1, 4:5, 16:9, 4:3, 3:4, 21:9, 2.35:1, 1.85:1; phóng 25–200%; bấm đúp chữ hoặc phụ đề trên khung để sửa ngay.
- **Video / lớp phủ**: bo góc, viền (màu, độ đậm), bóng đổ (màu, nhoè, khoảng cách, góc). **Chữ**: bóng chi tiết (màu, độ đậm, nhoè, khoảng cách, góc).
- **Âm thanh đoạn**: bộ lọc giọng (điện thoại, radio, trầm, sáng, vang, echo, thì thầm), cân bằng trái / phải, âm lượng tới +10 dB; áp cả khi xem và xuất.
- **Phụ đề**: tab Phụ đề có danh sách câu: bấm giờ để tới, gõ để sửa, Enter tách tại con trỏ, Backspace ở đầu câu để gộp, tìm & thay hết.
- **Hộp Xuất** (nút Xuất / Ctrl+M): tên, định dạng, độ phân giải, khung/giây, chất lượng, khoảng xuất, tóm tắt + ước tính dung lượng, xuất ảnh tĩnh. **Cài đặt** (⚙ thanh trên): thời lượng ảnh, đóng băng, chuyển cảnh mặc định; tự lưu; dọn footage không dùng.
- **Mở dự án CapCut** (Dự án của tôi → 🎬, hoặc 📂 Mở dự án rồi chọn `draft_info.json` / `draft_content.json` trong thư mục dự án CapCut): đọc track chính (kể cả khoảng trống), lớp phủ, chữ (font cỡ, màu, viền, nền, bóng, căn, dọc), sticker (giữ chỗ), phụ đề (kèm nhịp từng từ), tốc độ, âm lượng, đảo ngược, biến đổi và keyframe vị trí / cỡ / xoay / độ mờ, tỉ lệ khung, mốc. Sau đó thêm lại các file footage (máy khớp theo tên). Không mang sang: hiệu ứng, chuyển cảnh, bộ lọc độc quyền của CapCut, âm thanh (thêm lại ở tab Âm thanh).

### Theo ảnh màn hình CapCut (10/2026)

- **Nhoè chuyển động (Motion blur)** cho đoạn video / lớp phủ: bật, Độ nhoè, Trộn với khung gốc, Hướng (cả hai / tới / lùi), 4 hoặc 6 mẫu. Khi phát: nhoè xấp xỉ bằng vệt khung trước; khi dừng và khi xuất: lấy nhiều mẫu quanh thời điểm (chậm hơn).
- **Hoạt ảnh** thành lưới ô xem trước động với 3 tab Vào / Ra / Kết hợp (8 cặp vào-ra sẵn), thanh thời lượng, nút **Áp cho tất cả**. Áp cho tất cả cũng có ở Tốc độ, Mặt nạ, Nhoè chuyển động.
- **Thanh trên**: nút Menu ▾ (dự án mới, dự án của tôi, mở, lưu, nhập, xuất, cài đặt, phím tắt, toàn màn hình), nút Phím tắt, dòng "Tự lưu hh:mm:ss".
- **Ảnh bìa**: nút Bìa ở đầu track chính đặt khung tại đầu phát làm ảnh bìa dự án (hiện trong Dự án của tôi).
- **Hiệu ứng âm thanh** thành danh sách hàng như CapCut: nghe thử ▶, yêu thích ☆ (lưu trên máy), + thêm, lọc Yêu thích.

### Bố cục điện thoại kiểu CapCut mobile (10/2026)

Màn hình ≤ 760px tự chuyển sang bố cục dọc, trình dựng chiếm trọn màn hình (không cuộn trang):
- **Trên**: thanh gọn (Menu, tên dự án, Cài đặt, Dự án, Xuất). **Giữa trên**: trình phát (~42% màn hình) + đồng hồ, nút phát, tỉ lệ. **Giữa dưới**: dòng thời gian (ngón tay cuộn, hai ngón kéo giãn để phóng to / thu nhỏ, chạm thước để tua).
- **Dưới cùng**: thanh công cụ cuộn ngang (Media, Âm thanh, Văn bản, Nhãn dán, Hiệu ứng, Chuyển cảnh, Bộ lọc, Phụ đề, Đồ hoạ, Trợ lý AI). Bấm một mục → bảng trượt lên (bấm lại hoặc ✓ để đóng).
- **Chạm một đoạn** → thanh thao tác nhanh ngay trên thanh công cụ: Tách, Tốc độ, Âm lượng, Hoạt ảnh, Nhân đôi, Thuộc tính, Xoá, Bỏ chọn. Bấm Thuộc tính / Tốc độ / Hoạt ảnh → bảng thuộc tính trượt lên (✕ để đóng).
- Xoay ngang hoặc màn rộng hơn 760px → về bố cục máy tính.

### Vòng xoay AI không treo nữa (10/2026)

Trước đây trên điện thoại (nhất là iPhone chuyển app giữa chừng) kết nối tới Apps Script có thể treo vô hạn: vòng xoay "AI đang tải video… 486 giây" quay mãi dù máy chủ đã xong hoặc đã dừng. Sửa trong `tools/tai-khoan.js`:
- Mọi cuộc gọi API đều có hạn chờ (100 giây; việc AI chạy nền 9,5 phút).
- Việc AI chạy nền: từ giây 40 trang hỏi song song máy chủ theo `job_id` mỗi 8 giây; bên nào có kết quả trước thì lấy, kết nối treo bị huỷ.
- Quá 9,5 phút: báo rõ "Máy chủ chưa trả kết quả… mở lại trang sau vài phút", việc vẫn nằm trong danh sách chờ để lần mở trang sau tự nhận kết quả (máy chủ giữ 6 giờ). Không cần dán lại Apps Script.

### Chuẩn bị buổi demo (10/2026)

- **Trang kiểm tra hệ thống**: `tools/kiem-tra.html` (https://minhtoan8668.github.io/TikTok/tools/kiem-tra.html). Mở trên đúng máy sẽ demo, bấm Chạy kiểm tra: trang web đã là bản mới chưa, Apps Script có trả lời, Cloudflare + key Gemini còn chạy (gọi thử một câu), máy có WebCodecs / OPFS / WebGL, mạng tới CDN. Cloudflare có thêm đường `/suc-khoe` cho việc này.
- **HookAI.gs đổi**: tải video TikTok và chờ Gemini xử lý file giới hạn 170 giây (trước đây có thể ngốn hết 6 phút rồi bị Apps Script giết, mất lượt). Cần dán lại `HookAI.gs` vào Apps Script rồi Deploy → New version (bản dán sẵn key mentor giữ riêng, không đưa lên GitHub).
- Danh sách việc nên làm trước giờ demo nằm ngay trong trang kiểm tra.

### Bố cục CapCut Web trên máy tính (10/2026, theo `capcut-clone-spec/SPEC.md`)

Thư mục `capcut-clone-spec/` (đặc tả + 161 ảnh chụp CapCut Web) được áp thẳng lên `tools/dung-video.html` (không viết lại bằng React như prompt gợi ý: bản hiện có đã đủ tính năng, AI, tự lưu và bộ kiểm thử; đổi stack ngay trước buổi demo là rủi ro không cần thiết). Bố cục mới chỉ bật trên màn hình rộng hơn 760px; điện thoại vẫn dùng bố cục dọc.

- **Màu & cỡ theo đặc tả**: nền `#0E0E11`, bảng `#17171A`, vùng canvas `#1C1D21`, timeline `#121214`, điểm nhấn cyan `#59C5DD`, clip chữ cam `#D97D3E`, âm thanh xanh `#4CA987`, nhãn dán hồng `#CC5D88`; thanh trên 56px kính mờ, rail trái 71px, thư viện 327px, bảng thuộc tính 265px + rail tab dọc 56px, toolbar timeline 48px, đầu track 110px.
- **Thanh trên**: ☁ trạng thái tự lưu · tên dự án ▾ (Đổi tên, Nhân bản, Dự án của tôi) · Chọn (V) / Bàn tay (H) / zoom khung ▾ / Hoàn tác / Làm lại ở giữa · Dự án, Cài đặt, ⌨, toàn màn hình, ⚙ bảng dự án, **Xuất** gradient, ⋯ menu bên phải.
- **Rail trái**: 10 tab dọc có nhãn (Media, Âm thanh, Văn bản, Phụ đề, Hiệu ứng, Chuyển cảnh, Bộ lọc, Nhãn dán, Đồ hoạ, Trợ lý AI) + ⌨ dưới cùng; tay ‹ ở mép hoặc **Ctrl+/** thu gọn thư viện (nhớ qua `localStorage dv_thuGon`).
- **Vùng canvas**: nút **Tỉ lệ** 52×52 góc trên trái (ô chọn tỉ lệ), cụm ⟲ lặp · 📊 scopes · lưới/vùng an toàn nổi góc phải; bấm nền để bỏ chọn; khung chọn viền cyan 1px, núm tròn trắng. **Bàn tay (H)**: kéo để cuộn khung khi phóng to; ⇧F vừa khung, ⇧0 100%, ⇧1 50%, ⇧2 200%.
- **Bảng thuộc tính phải**: ẩn khi không chọn gì (như CapCut); chọn clip thì hiện với rail tab dọc. Cài đặt dự án (Hook, khung, tỉ lệ, phong cách, font, xuất, dự án) mở bằng nút ⚙ trên thanh trên.
- **Timeline**: ▶ + đồng hồ `MM:SS:FF | tổng` ở giữa toolbar, thước `00:02`, đầu phát trắng, viền chọn cyan; nút ⌧ hoặc **Ctrl+Shift+.** ẩn/hiện track (còn thanh tiến độ như CapCut). Ctrl+. vẫn là tiến 1 khung theo bảng phím CapCut desktop.
- **Xuất**: bấm Xuất mở bảng 365px thả ngay dưới nút (bấm ra ngoài thì đóng), đủ Tên, Định dạng, Độ phân giải, Khung/giây, Chất lượng, Khoảng xuất.
- Kiểm thử: `t121.mjs` (bố cục, phím, bảng Xuất); các bộ t89–t120 vẫn xanh. Ảnh so sánh chụp ở 1431×949 như đặc tả.

### Kho tài nguyên: bộ lọc, mẫu chữ, font, hiệu ứng, chuyển cảnh, âm thanh, sticker (10/2026)

Mọi tài nguyên tách khỏi code, nằm trong `tools/kho/kho.js` (một file JS gán `window.KHO`, nạp trước script chính). Thêm mục mới = thêm một dòng vào danh sách tương ứng, không đụng trình dựng. Không dùng tài nguyên của CapCut (tài sản riêng của họ); tất cả tự viết hoặc nguồn mở.

- **Bộ lọc (62)**: mỗi bộ lọc là bộ tham số (nhiệt độ, tint, bão hoà, tương phản, gamma, nâng đen, tông vùng tối/sáng, đen trắng, hai tông…); máy dựng LUT 17³ ngay khi áp (`taoLutKho`), lưu dưới id `kho:<id>` trong `P.luts`, dự án mở lại tự dựng lại. Nhóm: Điện ảnh, Phim nhựa, Ấm, Lạnh, Màu rực, Đen trắng, Hoài cổ, Hai tông, Chỉnh nhanh. Thẻ xem trước lấy khung hình hiện tại qua chính bộ lọc đó.
- **Mẫu chữ (63 mới, 73 tổng)** theo nhóm Xu hướng, Tiêu đề, Lời nói, Review · bán hàng, Hoài cổ, Tối giản, Vui nhộn, Kêu gọi, Giáo dục · tin; có ô tìm. Dùng đúng các trường của chữ tự do nên Trợ lý AI (`mau_chu`) gọi được theo tên.
- **Font (21 thêm)** từ Google Fonts, đều có tiếng Việt: Bebas Neue, Pacifico, Lobster, Dancing Script, Bangers, Comfortaa, Nunito, Roboto Slab, Space Grotesk, Archivo Black, Quicksand, Patrick Hand, Inter, Kanit, Exo 2, Josefin Sans, Merriweather, Saira Condensed, Baloo 2, Chakra Petch, Big Shoulders Display. Nút **＋ Font** trong tab Văn bản nhập `.ttf/.otf/.woff2` của riêng mình (lưu IndexedDB, dùng cho mọi dự án).
- **Hiệu ứng video (43 mới, 50 tổng)**: shader WebGL chạy sau bước chỉnh màu (`apHuKho`), có thanh **Cường độ hiệu ứng** trong thuộc tính. Nhóm: Hỏng hóc · retro (Glitch, VHS, TV cũ, Pixel, Phim xước…), Biến dạng (Gương, Kính vạn hoa, Xoáy, Sóng, Mắt cá, Chia 4 màn…), Ánh sáng (Bừng sáng, Rò sáng, Tia sáng, Bokeh…), Nghệ thuật (Hai tông, Âm bản, Phác hoạ, Ảnh nhiệt, Chấm bi, Viền neon…), Thời tiết · hạt (Tuyết, Mưa, Bụi sáng, Sương mù, Lửa). Thẻ xem trước render thật qua shader.
- **Chuyển cảnh (20 thêm, 30 tổng)** viết theo chuẩn gl-transitions (`vs_*`), trộn vào kho CDN và vẫn chạy khi CDN không tải được.
- **Âm thanh (49 mới)**: công thức tổng hợp tại máy (`tongHopKho`: lớp dao động + nhiễu lọc, lặp, ngẫu nhiên), nhóm Chuyển động, Va chạm · trống, Giao diện · thông báo, Kịch tính, Vui nhộn, Môi trường; có tìm và nhóm **Của tôi** cho file nhập.
- **Sticker động**: ô tìm Giphy/Tenor trong tab Nhãn dán; GIF/WebP động giải mã bằng `ImageDecoder` (Chrome/Edge) và chạy theo thời gian trên V3. Sticker PNG/GIF tự tải lên cũng động.
- **Âm thanh trực tuyến**: ô tìm Freesound trong tab Âm thanh (nghe thử, bấm + để chèn; giấy phép hiện trên từng dòng).
- **Nhập gói .zip** (cuối tab Bộ lọc): gom `.cube`, font, `.mp3/.wav`, `.png/.gif/.webp` vào một zip để chia sẻ cho học viên; máy tự phân loại.
- **Cloudflare** thêm `GET /nhan-dan?q=` (Giphy hoặc Tenor) và `GET /am-thanh?q=` (Freesound), cache 1 giờ; cần thêm Secret `GIPHY_KEY` (hoặc `TENOR_KEY`) và `FREESOUND_KEY` trong Settings → Variables and Secrets. Chưa có key thì ô tìm báo rõ, phần còn lại của kho vẫn chạy ngoại tuyến. `/tai` cho phép thêm host giphy, tenor, freesound.
- **Trợ lý AI**: `loc`, `hieu_ung`, `chuyen` trong `sua_doan`/`ap_tat_ca` nhận tên trong kho (ví dụ loc "Phim Hàn", hieu_ung "VHS", chuyen "Trái tim").
- Kiểm thử: `t122.mjs` (27 bước: dựng LUT, tìm/nhóm, hiệu ứng + cường độ, chuyển cảnh WebGL, mẫu chữ, nhập font, âm thanh tổng hợp, GIF động, gói .zip, AI theo tên).

### Quét chọn phụ đề, kiểu riêng từng câu, bố cục video dọc (10/2026)

- **Quét chọn nhiều** (kéo ở chỗ trống trên dòng thời gian) nay bắt luôn các câu phụ đề trên O2 cùng với đồ hoạ, b-roll, âm thanh. Trước đây chip phụ đề không có `data-k` nên bị bỏ qua; ngoài ra trình duyệt phát `pointercancel` giữa chừng khi bắt đầu kéo trên track có chữ, nay chặn bằng `preventDefault` và nghe `pointerup` ở `window`. Chọn xong: Delete xoá hết một lần (một bước hoàn tác), bảng thuộc tính báo số câu đang chọn. Hoàn tác/làm lại giờ nhớ cả trạng thái phụ đề (từ bị ẩn, đoạn chữ riêng, kiểu riêng, nhóm từ).
- **Áp cho tất cả phụ đề** (như ô *Apply to all main captions* của CapCut): trong bảng thuộc tính của một câu phụ đề có ô bật/tắt. Bật (mặc định): nhóm "Kiểu phụ đề (cho tất cả câu)" như cũ. Tắt: hiện nhóm **Kiểu riêng cho câu này** gồm Kiểu chữ, Font, Cỡ chữ, Độ đậm, Màu chữ, Màu nhấn, IN HOA, Vị trí dọc; chỉnh áp cho câu đang chọn (hoặc mọi câu đang quét chọn). Kiểu riêng lưu trên từ đầu của câu (`w.kieu`), đi theo dự án và CapCut import/export; chip phụ đề có dấu ✎. Nút "Bỏ kiểu riêng", "Bỏ hết kiểu riêng", "Lấy làm kiểu chung".
- **Bố cục video dọc** (nút 📱 trên thanh trên, nhớ trong `localStorage dv_bocDoc`): khung xem đứng bên phải cao hết màn như điện thoại; thư viện, thuộc tính và dòng thời gian nằm bên trái (giống CapCut desktop khi dựng video dọc). Chưa chọn gì thì thư viện giãn hết chiều ngang.
- **Lớp phủ Giao diện TikTok** (ô lớp phủ trên khung xem, tự bật khi vào bố cục dọc): vẽ thanh "Đang Follow · Dành cho bạn", cột nút tim/bình luận/lưu/chia sẻ, tên kênh + mô tả + nhạc ở đáy, tỉ lệ theo bề rộng khung, để canh chữ và đồ hoạ không bị giao diện TikTok che. Có cả "TikTok + lưới".
- Kiểm thử: `t123.mjs` (21 bước).

### Hộp thoại không bị cắt + giao diện kính mờ hai tông (10/2026)

- **Lỗi bấm Xuất không ra file / không đóng được hộp thoại**: các hộp thoại (Xuất, Cài đặt, Dự án, Phím tắt, Dán thuộc tính, tiến độ xuất) nằm trong cột khung xem; cột này cắt tràn nên trên màn hình thấp (laptop 1280×720, cửa sổ nhỏ) phần nút Xuất/Huỷ/Đóng rơi ra ngoài, không bấm được. Nay hộp thoại được dời ra ngoài cột và cố định toàn màn hình (`position:fixed`), nội dung dài thì cuộn trong hộp; Esc vẫn đóng. Kiểm thử `t124.mjs` chạy ở 1280×720: Xuất ra file thật, mọi hộp đóng được.
- **Gọn hơn (10/2026)**: nút Tỉ lệ và cụm lớp phủ / lặp / scopes nằm trên một thanh riêng phía trên khung xem, không còn đè lên hình; cột giữa chỉ rộng vừa khung hình (tính theo tỉ lệ và chiều cao còn lại, `canhGiua`), phần dư dồn cho thư viện và bảng thuộc tính; khung ứng dụng bo góc 22px (toàn màn hình thì cách mép 6px); nút ☀/☾ đổi sáng tối ngay trên thanh trên; nút Cài đặt dùng icon bánh răng, nút bảng dự án dùng icon bảng để không nhầm với nút sáng tối. Hộp Cài đặt giải thích hạn mức bộ nhớ (do trình duyệt cấp theo ổ đĩa trống) và có nút **Bật lưu bền** (`navigator.storage.persist`).
- **Giao diện kính mờ (liquid glass) theo bảng màu Tự Mình Xây Kênh**: thanh trên, ba cột và dòng thời gian là các tấm kính bo góc 16px (`backdrop-filter`), nền có vệt sáng lime và cyan; màu nhấn lime `#99DF00` (nút Xuất gradient lime → cyan, viền chọn, tab đang mở), chữ mực `#1C2600` ở tông sáng và `#F3F0E4` ở tông tối. Chỉ áp cho bố cục máy tính; điện thoại giữ nguyên.
- **Tông sáng/tối của khung dựng tách riêng với trang (10/2026)**: nút ☀/☾ trên thanh trên của khung dựng chỉ đổi tông bên trong khung (`.ed.ccw.sang`, lưu `localStorage dv_sang`), không đụng tới nút ◐ của trang ngoài và ngược lại. Mặc định khung dựng tối như CapCut.

### Bảng Media kiểu CapCut + rà soát bố cục (10/2026)

- **Sửa bảng thuộc tính lặp dòng "Lớp 1/1 ⬆ Lên trên ⬇ Xuống dưới"**: mỗi lần bấm tab thuộc tính, hàm vẽ tab chèn thêm một hàng lớp mới mà không xoá hàng cũ → hàng lặp nhiều lần. Nay xoá hàng cũ trước khi vẽ. (Dòng này hiện khi đang chọn một đồ hoạ/chữ; nếu không nhớ đã thêm chữ thì có thể là chữ do Trợ lý dựng thêm hoặc bấm nhầm vào tab Văn bản — xoá bằng Delete.)
- **Thẻ footage kiểu CapCut**: ô đều nhau theo lưới (≥132px), ảnh thu nhỏ 16:10 có huy hiệu thời lượng góc dưới phải, huy hiệu **Đã dùng** khi footage đang nằm trên dòng thời gian (cập nhật theo mỗi lần vẽ dòng thời gian), huy hiệu **✦ AI** khi đã hiểu footage; rê chuột hiện nút **＋** để thêm vào cuối V1, bấm đúp ảnh cũng thêm. Chi tiết AI (cảnh, câu, tag) thu gọn mặc định, bấm tên để mở. Ô "Thêm footage" thu gọn khi đã có footage.
- **Thanh dưới khung xem (bố cục dọc)**: đồng hồ `hiện tại | tổng` theo MM:SS:FF, nút vừa khung và toàn màn hình, như thanh player của CapCut desktop.
- **Cột tự canh**: khi chưa tự kéo cỡ, bảng thuộc tính rộng 321–400px (28% bề rộng) để nhãn như "Vị trí ngang" không xuống dòng; cột khung xem rộng vừa tỉ lệ video; phần dư dồn cho thư viện.
- **Nhãn clip chữ trên dòng thời gian**: hiện thẳng nội dung chữ (một dòng) thay vì "📝 Chữ" + nội dung bị cắt.
- **Bảng thuộc tính bị đẩy ra ngoài màn hình khi thêm chữ**: nếu trước đó đã kéo cột thư viện rất rộng (nhớ trong `dv_kc`), lúc chọn một đồ hoạ bảng thuộc tính hiện ra làm tổng ba cột rộng hơn cửa sổ, bảng và thanh trượt nằm ngoài tầm nhìn nên tưởng là lỗi. Nay cỡ cột đã kéo luôn được kẹp lại để cột khung xem còn ≥360px và bảng thuộc tính nằm trong màn hình; tay kéo cũng không cho kéo quá mức đó. Bấm đúp tay kéo để về cỡ mặc định.
- **Dựng chữ / sticker / nhạc khi chưa có footage**: trước đây tổng thời lượng = tổng các đoạn V1 nên không có footage thì khung xem chỉ hiện chữ hướng dẫn, chữ vừa thêm không thấy và không phát được. Nay tổng thời lượng lấy theo điểm kết thúc xa nhất của chữ / b-roll / âm thanh khi V1 trống; khung xem vẽ các lớp trên nền đen, bấm phát và xuất đều chạy, giống CapCut.

### Bảng chọn màu + bảng thuộc tính kiểu CapCut desktop (10/2026)

- **Bảng chọn màu**: bấm bất kỳ ô màu nào trong khung dựng (màu chữ, viền, hộp, bóng, phát sáng, kiểu phụ đề…) là mở bảng kiểu CapCut thay cho hộp màu của hệ điều hành: ô vuông sắc độ (kéo), dải màu, **ống hút** (lấy màu từ bất kỳ đâu trên màn hình, Chrome/Edge), ô **Hex**, **Màu của tôi** (bấm + để lưu, chuột phải để xoá, nhớ trên máy `dv_mauToi`) và lưới **Gợi ý** 60 màu (trắng → đen, lime/cyan thương hiệu, 10 sắc × 5 độ). Đổi màu áp ngay lên khung; Esc hoặc bấm ra ngoài để đóng.
- **Bảng thuộc tính chữ** theo đúng thứ tự CapCut: ô chữ nhiều dòng (Enter xuống dòng; vẫn lưu bằng dấu `|`), Font, Cỡ chữ, hàng Kiểu **B I U** + **TT tt Tt** (in hoa / thường / Viết Hoa Đầu Từ, trường `g.hoa`), Màu chữ (+ chuyển màu), Ký tự / Dòng (giãn), Căn lề (+ chữ dọc), **Kiểu có sẵn** (ô "Aa" cho từng mẫu chữ trong kho, chỉ áp kiểu, giữ nguyên nội dung, vị trí, hoạt ảnh; ⊘ để bỏ kiểu), rồi các mục gập **Biến đổi** (Vị trí X/Y, Xoay, Căn vào khung), **Hoà trộn** (chế độ + Độ mờ), **Viền**, **Nền**, **Phát sáng**, **Bóng**, **Uốn cong**. Viền / Nền / Bóng có ô tích ở đầu mục: bật một cái là tắt cái kia (vẫn là lựa chọn "Nền chữ" cũ bên dưới). Xoay và Độ mờ của chữ nay vẽ thật trên khung và khi xuất (dự án nhập từ CapCut có `text_alpha` cũng áp đúng).
- **Mọi mục thuộc tính** (chữ, video, overlay, âm thanh): tiêu đề mục có mũi tên **gập / mở** (nhớ theo tên mục trong `dv_gap`), nút **↺** đặt lại các thanh trượt trong mục, và với mục có keyframe: **‹ ◇ ›** (keyframe trước / thêm keyframe cho cả mục tại đầu phát / keyframe sau). Mỗi thanh trượt có ô số kiểu CapCut với nút ▴▾ tăng giảm từng bước; bấm vào số để gõ. Mục "Khung hình" của video hiện tên là "Biến đổi".
- Chọn một chữ là bảng mở thẳng tab **Văn bản**; bấm đúp chữ trên khung xem đưa con trỏ vào ô chữ. Kiểm thử: `t126.mjs` (bảng màu + bảng thuộc tính), `t125.mjs`.

### Ô media gọn, khung xem ôm sát cột, toàn màn hình đúng tỉ lệ (10/2026)

- **Ô footage** nhỏ như CapCut (≥108px, 3 ô trên cột 400px): tên một dòng cắt bớt, dòng phụ 10px, nút "＋ V1" ẩn (đã có nút ＋ khi rê và bấm đúp), "Dò mặt" chỉ còn icon 🙂 (giữ tooltip).
- **Khung xem** ở bố cục dọc: đệm 12–14px, bề rộng cột tính sát theo khung hình (`canhGiua`), hết khoảng trống hai bên.
- **Lỗi toàn màn hình bị kéo giãn ngang**: nút ⛶ đưa `.khung` vào fullscreen, trình duyệt ép khung thành đúng cỡ màn hình nên canvas 9:16 bị kéo thành 16:9. Nay `:fullscreen` dùng `object-fit: contain`: video dọc có viền đen hai bên, video ngang viền trên dưới, đúng tỉ lệ đang chọn; tay cầm và lớp phủ ẩn khi đang toàn màn hình. **Thanh điều khiển** kiểu CapCut ở đáy: ▶/⏸, giờ hiện tại / tổng, thanh tua, nút thoát; tự ẩn sau 2,6 s khi đang phát và không rê chuột (rê lại là hiện); bấm vào hình để phát / dừng; Esc để thoát. Kiểm thử `t127.mjs`.

### Keyframe cho chữ, sticker, đồ hoạ như CapCut (10/2026)

- Trước đây keyframe chỉ vẽ thật cho đoạn video và overlay; chữ có nút ◇ trên thanh công cụ nhưng khung không đổi. Nay mục **Biến đổi** của chữ dùng các hàng có keyframe: **Tỉ lệ** (`sc`, nhân với cỡ chữ), **Vị trí X / Y**, **Xoay**; **Độ mờ** trong Hoà trộn. Bấm ◇ cạnh hàng để đặt keyframe tại đầu phát (thành ◆); đã có keyframe thì chỉ cần dời đầu phát rồi kéo thanh (hoặc kéo chữ trên khung xem) là tự thêm keyframe mới, như CapCut. ◇ ở tiêu đề mục đặt cho cả 4 thuộc tính; ‹ › nhảy tới keyframe trước / sau.
- Mục **Keyframe** của chữ (dưới Biến đổi): ◀ ◇ / ◇ ▶, Xoá hết, Chép ◆ / Dán ◆ / Đảo ngược, các mẫu Zoom vào chậm / Zoom ra / Lia trái → phải / Đập vào, chọn đường cong (mượt, tuyến tính, giữ…).
- Trên dòng thời gian, clip chữ hiện chấm ◆ tại mỗi keyframe: kéo để dời, chuột phải để đổi đường cong, chép, dán, xoá. Nút ◇ trên thanh công cụ (phím K) và menu chuột phải "Thêm keyframe tại đây" dùng chung.
- Nội suy áp khi xem trước, khi xuất và trên điện thoại (bọc `veDoHoa`, trả lại giá trị gốc sau khi vẽ nên dự án lưu không bị méo). Dự án nhập từ CapCut có keyframe chữ (`KFTypePositionX/Y`, `Scale`, `Rotation`, `Alpha`) nay chạy đúng. Kiểm thử `t128.mjs`.

### Đầu phát bắt dính, tab Văn bản kiểu CapCut, thêm font (10/2026)

- **Đầu phát bắt dính khi tua trên thước**: trong 7px quanh mép đoạn V1, mép chữ / overlay / âm thanh, ranh câu nói, beat, mốc đánh dấu và keyframe thì đầu phát hít vào đúng mốc đó (vạch đầu phát sáng lime). Giữ **Alt** khi kéo để tua tự do; tắt nam châm (⇧Backspace) cũng tắt bắt dính.
- **Tab Văn bản** bố cục như CapCut, cột mục bên trái: **Thêm chữ** (ô "Chữ mặc định"), **Của tôi** (font .ttf/.otf/.woff2 của bạn, bấm font để thêm chữ dùng font đó), **Hiệu ứng chữ** (toàn bộ mẫu chữ trong kho: tìm, chip nhóm), **Mẫu chữ động** (14 kiểu hoạt ảnh sẵn: bật ra, gõ chữ, trượt, nổi, nhoè, nảy, nhịp, nhấp nháy…), **Phụ đề tự động** (ngôn ngữ nói, song ngữ, "Xoá phụ đề hiện có", nút **Tạo phụ đề** = Hiểu footage cho mọi video chưa hiểu rồi bật phụ đề + dịch nếu chọn), **Phụ đề từ file** (nhập .srt/.vtt; xuất **.srt**, **.vtt**, **.txt lời thoại**, chép lời thoại vào bộ nhớ tạm). Mục đang mở nhớ trong `dv_chuMuc`.
- **Font**: thêm 58 font Google có đủ dấu tiếng Việt, gồm **TikTok Sans**, Roboto, Open Sans, Lora, Source Sans 3, Noto Sans/Serif, Mulish, Manrope, Sora, Public Sans, Cabin, Barlow Condensed, Nunito Sans, Raleway, Work Sans, IBM Plex Sans, Fira Sans, Montserrat Alternates, EB Garamond, Cormorant Garamond, Signika, Asap, Overpass, Encode Sans, nhóm Thái có Việt (Prompt, Mitr, K2D, Sarabun, Bai Jamjuree, Athiti, Niramit, Krub, Maitree, Pridi, Taviraj, Trirong, Fahkwang, Kodchasan, Thasadith, Mali, Itim, Pattaya, Charm, Chonburi, Sriracha), display (Alfa Slab One, Bungee, Lilita One, Grandstander, Arima, Dela Gothic One, Rowdies, Oi, Bungee Shade, Yeseva One, Philosopher, Play). Be Vietnam Pro vẫn là font mặc định. Font tải theo từng cụm 10 họ nên một họ lỗi không làm hỏng cả danh sách. Kiểm thử `t129.mjs`.

### Gõ chữ không bị phím tắt, bảng chọn font TMXK, thêm hiệu ứng + chuyển cảnh (10/2026)

- **Lỗi gõ chữ thành phím tắt** (gõ "c" là tách đoạn): mỗi lần đổi chữ, dòng thời gian vẽ lại kéo theo bảng thuộc tính vẽ lại, ô đang gõ bị thay mới nên mất con trỏ, phím kế tiếp rơi xuống trang và thành phím tắt. Nay khi con trỏ đang ở ô chữ / ô nhập trong bảng thuộc tính thì bảng không vẽ lại (chỉ cập nhật nhãn clip), rời ô mới vẽ lại. Kiểm thử `t130.mjs`.
- **Bảng chọn font** thay cho menu của hệ điều hành: bấm ô Font (bảng thuộc tính chữ, hoặc Font mặc định của dự án) mở bảng theo tông TMXK, mỗi font xem trước đúng kiểu chữ "Aa Bb 123 · Tiếng Việt có dấu", có ô tìm, nhóm Mặc định · Kho · Của bạn, đủ 86 font (trước đây hàng Font của chữ chỉ liệt kê 7 font mặc định, font kho chỉ vào được qua Font mặc định dự án).
- **Thêm 25 hiệu ứng** (nhóm mới Chuyển động: zoom chậm, rung máy, lắc nhẹ, nhịp tim, trôi ngang, nhoè chuyển động, zoom đập nhịp, xoay chậm · Màu sắc: hai tông tím vàng, nâu cổ điển, poster, đổi màu liên tục, tương phản mạnh, âm bản nhấp nháy, camera nhiệt · Khung hình: gương đối xứng, bốn ô, khung điện ảnh, viền bo tối, ống nhòm, mắt cá · Ánh sáng: đèn sân khấu, neon chập chờn · Hạt: bụi bay, lấp lánh) → **68 hiệu ứng** kho + 7 cơ bản. **Thêm 15 chuyển cảnh** (tròn mở / khép, rèm sọc, ô vuông ngẫu nhiên, đẩy trái / lên, quét phải / chéo, zoom mờ, loé trắng, chìm đen, xoắn ốc, sóng nước, cửa mở, nhoè dọc) → **35 chuyển cảnh** kho + 67 gl-transitions. Tất cả là shader WebGL viết tay trong `tools/kho/kho.js`, chạy trên máy, không gọi API.
- **Về "API hiệu ứng"**: không có dịch vụ nào cung cấp hiệu ứng kiểu CapCut qua API miễn phí để dùng thương mại. Đang dùng sẵn **gl-transitions** (MIT, 67 chuyển cảnh, tải từ jsDelivr). Shadertoy có API nhưng shader mặc định giấy phép CC BY-NC-SA (không thương mại) nên không nhúng. Hướng mở rộng tốt nhất là tiếp tục viết shader vào kho hoặc nhập gói .zip của người dùng.

### Xem thử khi rê chuột + lớp hiệu ứng / bộ lọc trên dòng thời gian (10/2026)

- **Xem thử**: rê chuột lên một ô trong tab Hiệu ứng hoặc Bộ lọc là khung xem trước áp ngay hiệu ứng đó lên cả khung hình (không đổi dự án); rời chuột là trả lại. Rê lên ô Chuyển cảnh thì khung xem chạy vòng lặp 1,6 s chuyển từ khung hình thu nhỏ của đoạn tại đầu phát sang đoạn kế (chưa có đoạn kế thì lật gương chính nó). Ô xem trước trong lưới hiệu ứng / bộ lọc vẽ bằng khung hình hiện tại của video, mở lại tab là cập nhật.
- **Lớp hiệu ứng / lớp bộ lọc** (CapCut: effect / filter layer): rê lên ô rồi bấm **＋ Lớp** để thêm lớp 3 giây tại đầu phát, hoặc **kéo thả ô xuống dòng thời gian** đúng chỗ muốn đặt. Lớp hiện màu tím trên dòng thời gian, kéo hai đầu để đổi độ dài, kéo để dời, Delete để xoá, ⬆⬇ Lớp để đổi thứ tự. Lớp áp lên mọi thứ nằm **dưới** nó (video, overlay, chữ đã vẽ trước), đúng như CapCut; phụ đề karaoke vẫn vẽ sau nên không bị ảnh hưởng. Bảng thuộc tính của lớp có chọn hiệu ứng / bộ lọc khác và **Cường độ**. Lưu trong dự án (là một mục trong `P.gfx` với `kieu: hieu_ung | bo_loc`, trường `k`, `muc`), áp cả khi xuất và trên điện thoại. Bấm thẳng vào ô (không qua ＋ Lớp) vẫn áp hiệu ứng cho đoạn đang chọn như trước.
- Kiểm thử `t131.mjs`.

### Kho trực tuyến theo chủ đề: nhạc nền, hiệu ứng âm, nhãn dán động (10/2026)

- **Nhạc theo chủ đề** (tab Âm thanh, trên mục Nhạc nền) và **Hiệu ứng âm theo chủ đề** (đầu hộp hiệu ứng âm): 20 chủ đề nhạc (Vlog, Marketing, Dễ thương, Mơ màng, Du lịch, Làm đẹp, Thể thao, Tiệc tùng, Hip-hop, Disco, Lofi, Điện ảnh, Piano, Acoustic, Buồn, Hào hứng, Chill, Trẻ em, Kinh dị, Giáng sinh) và 24 chủ đề hiệu ứng (Whoosh, Ding, Pop, Click, Boom, Riser, Chuyển cảnh, Hoạt hình, Thiên nhiên, ASMR, Gõ phím, Thông báo, Tiếng cười, Vỗ tay, Game, Máy móc, Kinh dị, Nước, Gió, Động vật, Tiền, Tích tắc, Camera, Trống) + ô tìm tự do. Dữ liệu lấy từ **Openverse API** (api.openverse.org, WordPress Foundation) gom Freesound, Jamendo, Wikimedia Commons…; chỉ lọc giấy phép **dùng thương mại** (CC0, CC BY, CC BY-SA, CC BY-ND, PDM). Mỗi dòng: ▶ nghe thử, **+** (nhạc: đặt làm nhạc nền và đo beat; hiệu ứng: thêm vào A3 tại đầu phát), **⤓** (nhạc: thêm vào A3). Không cần khoá; giới hạn ẩn danh 20 lượt/phút, 200 lượt/ngày mỗi IP, kết quả nhớ 1 giờ trong phiên. File tải thẳng khi host có CORS (Freesound), không thì qua máy chủ Cloudflare `/tai` (worker 2026.10.17 thêm host jamendo, wikimedia, ccmixter → **cần dán lại worker.js**).
- **Ghi nguồn**: mọi bài đã dùng được gom vào `P.ghiNguon`; nút **Chép ghi nguồn** chép sẵn dòng "Tên – Tác giả (giấy phép, nguồn) link" để dán vào mô tả video (CC BY bắt buộc ghi; CC0 không cần; ND = dùng nguyên bản).
- **Nhãn dán động** (tab Nhãn dán): 8 nhóm (Cảm xúc, Bàn tay, Trái tim, Nhấn mạnh, Ăn mừng, Động vật, Đồ ăn, Khác) ~230 emoji hoạt hình **Noto Animated Emoji** của Google (fonts.gstatic.com, Apache 2.0, dùng tự do), xem trước .webp, bấm là tải .gif nền trong suốt lên V3 và giải mã khung động như sticker thường. Ô không có bản động tự ẩn.
- Hiệu ứng hình ảnh và chuyển cảnh không có API miễn phí để dùng thương mại; vẫn mở rộng bằng shader trong `tools/kho/kho.js` (hiện 68 + 35) và gl-transitions (67). Kiểm thử `t132.mjs` (chạy qua proxy mạng của máy test).
- **Key nào còn cần trên Cloudflare** (Settings → Variables and Secrets): `GEMINI_API_KEYS` (AI, lồng tiếng, agent) và `APPS_SCRIPT_URL` bắt buộc; `PIXABAY_KEY` / `PEXELS_KEY` vẫn cần cho **kho B-roll video** (Openverse không có video); `FREESOUND_KEY` **không cần nữa** (Openverse đã gom Freesound); `GIPHY_KEY` / `TENOR_KEY` **tuỳ chọn** (nhãn dán động Noto không cần key; có key thì thêm được tìm GIF meme). Máy chủ thiếu key nào thì mục tìm tương ứng tự ẩn. Worker cài qua GitHub (cách B) nên mỗi lần đẩy `worker.js` lên main là Cloudflare tự cập nhật, không cần dán tay.

### Tab Media kiểu CapCut: Của bạn · Kho video · Kho ảnh; nhãn dán Noto đầy đủ (10/2026)

- **Tab Media** chia ba mục bên trái: **Của bạn** (thêm footage, tìm trong footage, danh sách), **Kho video** (hộp tìm B-roll cũ + 20 chủ đề: Thành phố, Thiên nhiên, Văn phòng, Công nghệ, Tiền bạc, Đồ ăn, Thể thao, Du lịch, Gia đình, Học tập, Gõ phím, Điện thoại, Bầu trời, Biển, Cà phê, Mua sắm, Xe cộ, Sức khoẻ, Làm đẹp, Nông thôn), **Kho ảnh** (mới: ảnh minh hoạ Pixabay / Pexels, cùng chủ đề, chọn dọc / ngang). Bấm ảnh là tải về thành footage ảnh 5 giây (kéo dài tuỳ ý), đánh dấu B-roll, ghi nguồn tự động. Máy chủ không có key thì hai mục kho hiện dòng báo thay vì hộp tìm. Mục đang mở nhớ trong `dv_mediaMuc`.
- Worker **2026.10.18**: `GET /broll?loai=anh&q=&huong=` → ảnh (Pixabay `image_type=photo` + Pexels `/v1/search`), trả `items[].anh = true`, `url` qua `/media` như video; tự cài qua GitHub.
- **Nhãn dán động Noto**: dùng danh sách chính thức của Google (`googlefonts.github.io/noto-emoji-animation/data/api.json`, 881 emoji có hoạt ảnh) nhúng sẵn trong `kho.js` kèm thẻ tìm tiếng Anh, 9 nhóm (Cảm xúc 502, Động vật · thiên nhiên 118, Đồ ăn 67, Hoạt động · lễ hội 58, Đồ vật 51, Biểu tượng 42, Du lịch 31, Người 8, Cờ 4), xếp theo độ phổ biến, ô tìm `fire`, `heart`, `cat`… lọc trên toàn bộ. Kiểm thử `t133.mjs`.
## Lọc kịch bản từ file phụ đề (LocKichBan.gs)

- Ở tool Kịch bản viral, mục **✂️ Có video dài? Lọc kịch bản từ file phụ đề**: học viên thả file `.srt`/`.vtt` của video dài (CapCut xuất được), chọn số video (hoặc để AI gợi ý), kiểu đăng (series / video lẻ), độ dài.
- AI đọc lời thật + hồ sơ kênh, trả: nội dung nói gì, hợp kênh mấy điểm, nên làm mấy video; từng video với mốc cắt từ video gốc, hook chữ, câu mở đầu, khung, điểm viral, cần quay thêm gì, caption; tên series và lịch đăng; đoạn nên bỏ; câu đắt.
- Bấm **Viết thành kịch bản** trên một video: AI viết trọn bài vào khung, giữ lời thật, ghi mốc "Cắt 02:15–02:40" cho từng phần.
- Tính 1 lượt của tool Kịch bản. Cùng file + cùng lựa chọn trong 6 giờ trả lại kết quả cũ, không trừ lượt.
- Cài: tạo file mới `LocKichBan.gs` trong Apps Script, dán nội dung; dán đè `HookAI.gs`, `Studio.gs`; Deploy → New version.

## Bản tin xu hướng tuần (XuHuong.gs)

Các tool AI đọc thêm một bản tin xu hướng ngắn do bạn duyệt, để gợi ý format, hook, nhạc, chủ đề cho hợp thời.

- **Dữ liệu:** mỗi lượt Soi video và Chấm video ghi một dòng vào sheet `XuHuong` (khung, dạng, kiểu hook, concept, view, điểm). Video học viên đem soi là video đang viral ngoài thị trường.
- **Menu bot:** `/xuhuong` hiện tình trạng kèm nút bấm. Trong nút Menu có sẵn lệnh tắt, bấm là chạy, bot hỏi lại khi cần: `/xhtao` tạo bản nháp, `/xhsua` tự viết, `/xhkey` key Gemini riêng cho bản tin (Script Property `XH_GEMINI_KEY`, nên tạo ở project Google khác để không ăn hạn mức của tool học viên; bật thêm YouTube Data API v3 trong project đó thì key này lấy luôn YouTube), `/xhyoutube` gửi key YouTube, `/xhrss` nguồn RSS, `/xhlich` tự chạy thứ Hai. Sau khi dán code mới, chạy hàm `capNhatMenuBot` một lần để menu hiện lệnh mới.
- **Tạo bản tin:** `/xuhuong tao` (hoặc tự chạy mỗi sáng thứ Hai 8 giờ sau khi gõ `/xuhuong lich`, hoặc chạy hàm `xhCaiLich` một lần trong Apps Script). AI đọc số liệu 14 ngày, video thịnh hành YouTube Việt Nam, tin RSS, tra Google xu hướng TikTok, Reels Việt Nam, viết 10–14 dòng theo 5 mục, ghi nguồn từng dòng (nội bộ / YouTube / RSS / Google).
- **YouTube thịnh hành Việt Nam:** mỗi lần tạo bản tin, máy chủ lấy 50 video thịnh hành ở Việt Nam (YouTube Data API v3, tốn 1 đơn vị hạn mức, miễn phí), ưu tiên video ngắn dưới 3 phút. Cần key Google Cloud đã bật *YouTube Data API v3*: nhắn bot `/xuhuong youtube AIza...` (bot gọi thử, lưu, xoá tin chứa key). Chưa cài thì thử bằng key Gemini; project chưa bật API này thì bỏ qua YouTube và ghi rõ trong bản nháp. `/xuhuong youtube thu` để xem thử.
- **RSS:** mặc định 4 truy vấn Google News tiếng Việt về TikTok, Reels, TikTok Shop. Thêm trang tin, blog marketing hoặc kênh YouTube muốn theo dõi (dạng `https://www.youtube.com/feeds/videos.xml?channel_id=UC...`): `/xuhuong rss them <link>` (bot đọc thử trước khi thêm, tối đa 8 nguồn). `/xuhuong rss` xem danh sách, `/xuhuong rss xoa 2`, `/xuhuong rss macdinh`, `/xuhuong rss thu`. Chỉ lấy tin trong 14 ngày, bỏ tin trùng.
- **Duyệt:** bot gửi bản nháp kèm nút ✅ Duyệt · ✏️ Sửa · 🗑 Bỏ. Chưa duyệt thì không tool nào dùng. Bản đã duyệt dùng 21 ngày rồi tự thôi. `/xuhuong sua` để tự viết, `/xuhuong tat` để gỡ ngay, `/xuhuong` xem tình trạng.
- **Dùng ở đâu:** Hook viral, Kịch bản (chấm và viết), Soi video, Chấm video, áp khuôn, Trợ lý AI, thiết kế chữ. Không dùng cho tải video, chép lời, nhận diện source.
- **Chi phí:** tạo bản tin 1–2 lượt gọi AI mỗi tuần. Mỗi lượt dùng tool đọc thêm tối đa 1.500 ký tự (vài trăm token đầu vào), câu trả lời không dài thêm. Key miễn phí thì không mất tiền, chỉ tốn chút hạn mức. Tra Google dùng chung key Gemini; key nào không cho tra thì bản tin chỉ dựa vào số liệu nội bộ và ghi rõ.

### Menu thả xuống dễ đọc ở tông tối + ô lưới cỡ CapCut (10/2026)

- **Chữ khó đọc trong menu của ô chọn**: menu thả xuống của `<select>` do trình duyệt (hệ điều hành) vẽ, không nhận CSS của trang, nên trước đây nền trắng mà chữ lấy màu sáng của khung dựng. Nay khung dựng khai báo `color-scheme: dark` (tông tối) / `light` (tông sáng) nên trình duyệt vẽ menu đúng tông; thêm màu nền và chữ cho `option` ở trình duyệt nào cho phép.
- **Ô lưới nhỏ lại như CapCut**: footage 108 → 92px, hiệu ứng / bộ lọc / chuyển cảnh / mẫu chữ 86 → 72px, emoji 52 → 44px, nhãn dán động 68 → 60px, kết quả kho video và ảnh 104 → 88px, Kiểu có sẵn 46 → 42px, font của bạn 130 → 112px; chữ trong ô và nút ＋ thu nhỏ theo, nút trong ô footage cắt bằng dấu … nên không tràn.
- **Sửa kèm**: khi lưới hiệu ứng / bộ lọc vẽ lại dưới con trỏ đứng yên (đổi tab, lọc nhóm), bản xem thử cũ bị treo và áp chồng lên khung xem. Nay xem thử tự tắt khi con trỏ sang chỗ khác, khi lưới vẽ lại, và bị khoá sau khi bấm áp thật cho tới lúc rời lưới. Kiểm thử `t134.mjs`.

### Nối HyperFrames (HeyGen) và Higgsfield: làm được gì, không làm được gì (10/2026)

- **HyperFrames** (`github.com/heygen-com/hyperframes`, **Apache 2.0** → dùng thương mại được): framework **Node.js ≥ 22** render HTML/CSS/animation thành MP4 bằng **Puppeteer (Chromium thật) + encoder**. Là trình render **phía máy chủ**, không phải trình sửa video trong trình duyệt. Không chạy được trên GitHub Pages (trang tĩnh) hay Cloudflare Workers gói Free (không có Chromium, giới hạn CPU); muốn chạy phải thuê máy chủ Node riêng hoặc dùng gói `aws-lambda` / `gcp-cloud-run` của họ (trả tiền theo lượt render).
- **Đã lấy phần dùng được**: 13 chuyển cảnh WebGL trong `packages/shader-transitions` chuyển sang chuẩn gl-transitions và thêm vào `tools/kho/kho.js` → **48 chuyển cảnh kho** (Xoáy nhiễu, Cháy giấy, Lia vút, Mống mắt, Gợn nước lan, Hố đen, Zoom điện ảnh, Tách màu lệch, Lốc xoáy, Méo nhiệt, Chớp trắng xuyên, Tan biến dạng, Rò sáng). Màu nhấn trong shader đổi sang bảng màu Tự Mình Xây Kênh. Ghi nguồn giấy phép nằm ngay trong `kho.js` theo yêu cầu của Apache 2.0.
- **Chưa lấy**: `registry/blocks` có 173 khối motion graphics, nhưng viết bằng HTML/CSS/GSAP trong khi tool vẽ trên canvas → phải viết lại từng khối, không nhập thẳng được. `@hyperframes/player` chỉ hữu ích nếu dùng luôn định dạng dự án của họ.
- **Higgsfield** (`console.higgsfield.ai`, `docs.higgsfield.ai`): là dịch vụ **sinh ảnh / video bằng AI trả phí theo lượt**, không phải framework dựng video. Có API key, lifecycle polling / webhook nên nối vào worker được như cách đang gọi Gemini, nhưng mỗi lần tạo là tốn tiền thật và cần tài khoản riêng. Để dành khi cần tính năng "tạo cảnh bằng AI", không thay thế được phần dựng.

### Mẫu đồ hoạ dựng sẵn — đợt 1: 10 mẫu (10/2026)

Viết lại các khối `registry/blocks` của HyperFrames thành **cảnh keyframe trên canvas** của tool, nên chạy ngay trên GitHub Pages, không cần Node, không cần máy chủ render, không tốn lượt AI.

- **Chỗ dùng:** tab **Đồ hoạ → Mẫu dựng sẵn**. Mỗi ô là một ảnh thu nhỏ vẽ thật bằng chính bộ vẽ cảnh (không phải ảnh chụp), nên nhìn đúng như khi chèn. Bấm một cái là chèn tại đầu phát, tự chọn và mở bảng thuộc tính.
- **Sửa:** bảng phải chỉ hiện đúng các ô chữ của mẫu (VD "Tên", "Vai trò", "Con số", "Chú thích") — gõ là khung xem trước đổi ngay. Hai nút `↺ Chữ mặc định` và `⏱ Dài chuẩn`. Vẫn kéo dời / kéo mép trên dòng thời gian, vẫn dùng được keyframe, lớp, blend, màu nhấn của dự án như đồ hoạ thường.
- **10 mẫu đợt 1:** *Giới thiệu tên* — Thanh trắng gọn, Khối đen chữ đậm, Gạch chân màu, Thẻ tối bo góc, Hai thanh xếp, Viên thuốc mềm; *Nhấn mạnh* — Khung nhấn mạnh, Danh sách 3 ý; *Số liệu* — Thẻ số liệu + thanh; *Khung quay* — Khung quay REC.
- **Cách lưu mẫu** (`tools/kho/kho.js`, `KHO.doHoa`): `{ id, ten, ic, nhom, dai, text, phu, o: [{nhan, tu}], lop: [...] }`. Lớp dùng đúng định dạng cảnh sẵn có (`hop|tron|chu|duong|vong|so` + keyframe `{t,x,y,w,h,s,xoay,mo,tien_do,ease}`), `x,w` theo bề rộng khung, `y,h` theo chiều cao, `mau: 'nhan'` = màu nhấn dự án, **`t` âm = tính ngược từ cuối** (−0,1 là trước khi hết 0,1 giây) nên kéo dài/ngắn clip là động tác thoát tự dời theo. `tu: 'text' | 'text:<số>' | 'phu'` nối ô người dùng nhập vào lớp chữ/số.
- **Chỉ là dữ liệu**, không phải mã, nên thêm mẫu mới không rủi ro và không làm nặng trang: toàn bộ 10 mẫu ≈ 10 KB trong `kho.js`.
- Thiết kế và nhịp chuyển động dựa trên thư viện mở **HyperFrames (HeyGen, Apache 2.0)**, bố cục lại cho khổ dọc 9:16; ghi nguồn nằm trong `kho.js`.
- Hồi quy: `t135` (10/10) — đủ mẫu và nhóm, mọi mẫu vẽ ra hình ở ≥2/3 thời điểm, ảnh thu nhỏ có nội dung, chèn đúng giây, sửa chữ cập nhật cảnh, `t` âm đúng khi đổi độ dài, nhãn dòng thời gian, khung xem trước có hình, không lỗi JS.
- **Còn lại:** 30 mẫu nữa chia 3 đợt (biểu đồ, hội thoại, trước/sau, danh sách thông số, khung điện thoại…). 84 khối 3D/WebGL của HyperFrames bỏ qua vì không hợp canvas 2D.

### Sửa lỗi phát thử + mặt nạ cho element (10/2026)

**Lỗi đã sửa — bấm phát là nhảy thẳng về cuối.** Trước đây tổng thời lượng dự án chỉ tính theo track V1. Nên hai trường hợp đều hỏng:
- Chưa có footage, mới chỉ có chữ / đồ hoạ: vòng phát coi như "đã hết đoạn cuối" ngay ở giây 0 → dừng luôn tại cuối.
- Có footage nhưng kéo chữ / đồ hoạ dài hơn footage: phần dôi ra không được phát.

Nay **tổng thời lượng = track dài nhất (V1, chữ, đồ hoạ, b-roll, nhạc, lồng tiếng) như CapCut**; vòng phát chỉ dừng khi hết tổng, và khúc sau footage vẽ trên **nền trống** thay vì đứng hình khung cuối. Hồi quy `t136`.

**Mặt nạ cho element.** Trước chỉ đoạn V1 và b-roll V2 có mặt nạ. Nay:
- **Mọi element đồ hoạ / chữ / sticker / ảnh (track V3)** đều có mục **Mặt nạ** trong bảng phải với 7 kiểu: Không, Đường thẳng, Gương, Tròn, Chữ nhật, Trái tim, Ngôi sao — kèm vị trí ngang/dọc, rộng/cao, xoay, mềm viền, bo góc (chữ nhật) và **đảo ngược**.
- **Tay cầm mặt nạ ngay trên khung xem trước** (cả V1, V2 lẫn V3) đúng kiểu CapCut: kéo thân để dời, núm góc dưới–phải để phóng to/thu nhỏ, núm tròn phía trên để xoay (giữ Shift để bỏ hít 15°), núm màu nhấn bên trái để chỉnh mềm viền. Với đoạn V1/V2 tay cầm đi theo đúng scale – xoay – vị trí của đoạn.
- Element được vẽ ra lớp riêng rồi khoét theo hình mặt nạ nên hoạt động chung với hoà trộn, keyframe và hiệu ứng sẵn có.
- Hồi quy `t137`: mặt nạ khoét đúng phần, đảo ngược đúng phần bù, bảng phải đủ 7 kiểu, tay cầm hiện và kéo được, mặt nạ V1 vẫn chạy.

### Bảng Thuộc tính gọn lại kiểu CapCut (10/2026)

Bảng phải trước đây chữ to, hàng cao, mọi mục mở sẵn nên phải cuộn nhiều. Rà lại theo ảnh chụp CapCut:

- **Cỡ chữ và hàng**: chữ 11,5px, hàng cao 26px (trước ~38px), nhãn bên trái cùng cột 82px, điều khiển dồn về phải. Ô nhập / menu cao 24px, nút nhỏ cao 24px, tiêu đề mục 11,5px.
- **Thanh trượt mảnh như CapCut**: rãnh 3px, núm tròn trắng 11px, **phần bên trái tô màu nhấn** theo giá trị (JS đặt biến `--pc`, CSS vẽ gradient) thay vì thanh dày mặc định của trình duyệt.
- **Mục phụ thu gọn sẵn** (Hoà trộn, Keyframe, Lật & cắt khung, Bo góc – viền – bóng, Nhoè chuyển động, Ghép nền, Bánh xe màu, HSL, Đường cong, Bám vật thể, Hình vẽ, Lớp & khớp khung) — bấm tiêu đề để mở, trạng thái được nhớ lại trong `dv_gap`. Mục chính (Biến đổi, Kiểu chữ, Mặt nạ) vẫn mở sẵn.
- Kết quả: bảng của một đoạn V1 **vừa một màn hình**, không phải cuộn; tổng chiều cao bảng giảm ~20%.
- **Tay cầm mặt nạ trên khung** gọn và đủ như CapCut: viền nét đứt mảnh, **chữ thập mờ ở giữa**, núm tròn trắng ở 4 cạnh để kéo riêng chiều rộng / chiều cao, núm góc để phóng đều, núm tròn dưới để xoay, núm màu nhấn phía trên trái để chỉnh mềm viền.
- Hồi quy: các bài cũ được gieo sẵn `dv_gap` (mở hết mục) để vẫn thao tác được như trước; `t137` cập nhật theo số núm mới.

### Hai tầng tab kiểu CapCut + kho ảnh không còn rỗng (10/2026)

**Bảng Thuộc tính 2 tầng** như CapCut desktop:
- Tầng 1 — tab chính nằm ngang trên đầu bảng, gạch chân màu nhấn: đoạn video có *Video · Hoạt ảnh · Tốc độ & âm · Điều chỉnh*; chữ có *Văn bản · Hoạt ảnh · Đồ hoạ*; tab hợp với loại mục luôn đứng đầu và được mở sẵn.
- Tầng 2 — dải nút tròn (segmented) ngay dưới, chỉ hiện khi tab có nhiều mục: *Video → Cơ bản | Mặt nạ | Xoá nền*; *Điều chỉnh → Cơ bản | Bánh xe màu | Đường cong | HSL*; *Văn bản → Cơ bản | Mặt nạ*. Mặt nạ không còn là tab riêng mà là sub-tab của tab chính (đúng vị trí CapCut để nó).
- Cỡ nhỏ thêm một nấc: chữ 11px, hàng 24px, ô nhập / nút 22px, thanh trượt rãnh 2px núm 10px, tiêu đề mục 11px.
- Mã: `TAB_NHOM` (mục → tab chính; `'*'` = tab chính đầu tiên của mục đang chọn) và `SUB_NHOM` (mục → sub-tab, mặc định "Cơ bản"); `moTabProp(tab)` / `moSubProp(sub)` để mở bằng mã; trạng thái nhớ trong `P.propTab` / `P.propSub`.

**Kho ảnh / video Pixabay tìm gì cũng rỗng — nguyên nhân và cách sửa:**
- Pixabay giới hạn theo **IP** của máy gọi. Worker chạy trên Cloudflare dùng IP chung với rất nhiều worker khác nên chỉ 1–2 lượt là Pixabay trả **429**; key của anh vẫn đúng. Trước đây worker nuốt lỗi này thành "không có kết quả" **và cache 24 giờ**, nên từ khoá nào lỡ dính 429 là rỗng cả ngày.
- Worker `2026.10.19`: lỗi từng nguồn trả về trong trường `loi` (trang hiện "Kho báo lỗi: pixabay 429…"), kết quả rỗng do lỗi **không cache**, bị 429 / 5xx thì chờ 1,2 giây thử lại một lần.
- **Ảnh minh hoạ** gộp thêm **Openverse** (CC/PD dùng thương mại, không cần key, ~20 lượt/phút) nên kho ảnh luôn có kết quả kể cả khi Pixabay đang chặn; `/media` cho tải ảnh từ Flickr, Wikimedia, các kho bảo tàng mà Openverse dẫn tới. Tên tác giả + giấy phép ghi trong `tac_gia` để chèn ghi nguồn.
- **Video** chưa có nguồn không-key tương đương. Cách chắc nhất: thêm **`PEXELS_KEY`** (miễn phí tại pexels.com/api, giới hạn theo key 200 lượt/giờ, 20 000/tháng — không theo IP) vào Secrets của Worker; có cả hai thì worker gộp kết quả, Pexels gánh khi Pixabay 429.

### Pixabay gọi thẳng từ trình duyệt — hết 429 (10/2026)

Muốn **luôn lấy dữ liệu Pixabay** thì phải tránh IP chung của Cloudflare. Cách làm: **trình duyệt của từng học viên tự gọi Pixabay** (API Pixabay mở CORS `*`), mỗi máy một IP, hạn mức 100 lượt/phút riêng — đúng cách Pixabay thiết kế cho ứng dụng web.

- Worker `2026.10.20` có `GET /kho-key?token=…`: chỉ trả `PIXABAY_KEY` cho **đúng origin của trang khoá** (danh sách `ORIGINS`) và khi **đã đăng nhập** (có token); không cache. `dich_vu.kho_truc_tiep` báo cho trang biết có đường này.
- Trang: `khoKey()` lấy key một lần mỗi phiên (sessionStorage), `pixabayTrucTiep()` tìm thẳng (ảnh / video, `lang=vi` trước, thiếu thì tìm lại không lang), cache kết quả 1 giờ trong phiên theo yêu cầu cache của Pixabay. `timKho()` gộp: **thẳng Pixabay trước**, được ≥ 6 kết quả là dùng ngay (dòng trạng thái ghi "gọi thẳng"); thiếu thì nhờ worker (dịch từ khoá bằng AI + Openverse) rồi gộp, worker lỗi thì vẫn trả phần đã có.
- File ảnh / video vẫn tải qua `/media` của worker để vẽ được lên canvas (CORS), như cũ.
- **Đánh đổi cần biết:** key Pixabay sẽ nhìn thấy được trong DevTools của học viên đã đăng nhập. Key này chỉ đọc, miễn phí, giới hạn theo IP người gọi nên rủi ro thấp; nếu lộ ra ngoài thì vào pixabay.com/api/docs tạo key mới và đổi Secret `PIXABAY_KEY` là xong — không ảnh hưởng key Gemini hay Apps Script.

### Ô footage gọn như CapCut (10/2026)

Trước đây sau khi "Hiểu footage" thẻ tự bung ra hết cỡ (tên file dài, dòng tóm tắt, dải cảnh, tag, khoảnh khắc) chiếm cả hàng. Nay:
- Ô chỉ còn **hình thu nhỏ + huy hiệu thời lượng + tên 1 dòng (bỏ đuôi file, tên đầy đủ ở tooltip) + 1 dòng "0:19 · ngang"**. Nút 🙂 / ＋V1 / 🗑 chỉ hiện khi rê chuột (máy cảm ứng vẫn hiện); nút **✨ Hiểu footage** luôn hiện khi chưa hiểu.
- Hiểu xong **không tự bung** nữa; bấm vào tên mới mở chi tiết (cảnh để kéo vào V2, khoảnh khắc ★, tag), bấm lần nữa để gọn lại.
- Hồi quy: `hien.mjs` tự mở ô khi bài test cần bấm vào cảnh / khoảnh khắc, giống thao tác người dùng.

### Thanh công cụ dòng thời gian gọn + font Be Vietnam Pro (10/2026)

- Thanh công cụ cao 38px (trước 48px), nút 26px, icon 14px, nút bật (nam châm, liên kết, ripple…) chỉ ánh màu nhấn nhạt có viền thay vì khối lime đặc; đồng hồ `00:01:15 | 00:05:00` nằm một dòng ở giữa, số dạng tabular để không nhảy; thanh zoom mảnh cùng kiểu với thanh trượt trong bảng Thuộc tính.
- Toàn bộ trình dựng (`.ed.ccw`) dùng **Be Vietnam Pro** (đã tải sẵn từ Google Fonts), thay cho font hệ thống.
- Hồi quy `t121` cập nhật chiều cao thanh công cụ.

### Dọn giao diện tổng thể: bỏ kính mờ, màu đặc, tràn viền (10/2026)

Ảnh anh gửi là **bố cục dọc** (nút 📱 trên thanh trên: khung xem đứng bên phải, cao hết cột) cộng với lớp "kính mờ": các tấm (thanh trên, 3 cột, dòng thời gian) trong suốt 72 % + blur, đặt trên nền có quầng lime/cyan, trình dựng lại nổi cách mép màn hình 6 px bo góc 20 px — nên thanh trên và thanh công cụ nhìn như bị nhoè, lime bleed loang ra, khung trông lộn xộn. Sửa:
- **Bỏ kính mờ và quầng sáng**: mọi tấm dùng **màu đặc** (`--ep #15170F`, timeline `#101209`, nền khung `#0A0B07`), viền mảnh 7 % trắng, không bóng đổ, không highlight. Tông sáng cũng đặc tương ứng.
- **Tràn viền màn hình** như CapCut: `inset:0`, không bo góc ngoài; các tấm cách nhau 6 px, bo 10 px. Thanh trên 46 px.
- **Bố cục dọc khi đang chọn mục**: thư viện lấy phần dư, bảng Thuộc tính rộng cố định 360 px (trước thư viện bị ép còn ~190 px, chữ ô "Thêm footage" rơi từng từ một dòng).
- Hồi quy `t121` cập nhật chiều cao thanh trên (46 px, màu đặc).

### Các tab bên trái gọn lại (Âm thanh, Hiệu ứng, Nhãn dán, Văn bản…) (10/2026)

- **Cột danh mục** bên trái mỗi tab: rộng 100 px, chữ 11 px, **một dòng** — tên ngắn ("Kho online", "Hiệu ứng âm", "Ghi âm", "Nhạc chủ đề", "Nhạc nền", "Nhãn động"…; `BEN_TEN` + tự bỏ phần trong ngoặc), tên đầy đủ hiện ở tooltip. Trước đây "Hiệu ứng âm theo chủ đề (trực tuyến)" gãy thành 5 dòng.
- Tiêu đề mục 11 px, dòng ghi chú 10,5 px, ô tìm 26 px, **chip chủ đề 20 px chữ 10,5 px**, hàng hiệu ứng âm thấp hơn (icon 24 px, nút 22 px), ô "Tải lên" nhỏ lại. Emoji nhanh vẫn giữ ô 44 px.
- Hồi quy `t134` (cỡ ô) vẫn 8/8.

## Máy chủ phụ Cloudflare (miễn phí, tuỳ chọn)

Cài theo [`cloudflare/CAI-DAT.md`](../cloudflare/CAI-DAT.md) (khoảng 10 phút, không cần thẻ). Có máy chủ này tool thêm:

- **Dựng video → Footage → Kho B-roll miễn phí**: tìm video stock Pixabay (và Pexels nếu có key) bằng tiếng Việt (máy chủ tự dịch từ khoá nếu ít kết quả), bấm là vào footage, kéo vào V2. Không tốn lượt.
- **Dựng video → Thuộc tính → Lồng tiếng AI (A2)**: gõ lời (hoặc để trống lấy câu tại đầu phát / hook), chọn 8 giọng nam nữ, ghi cách đọc, bấm Tạo. Giọng đặt lên track A2 tại đầu phát, kéo được, khi phát tiếng gốc hạ còn 25% và nhạc hạ như khi có lời. Lưu cả trong file dự án. Tốn 1 lượt Dựng video mỗi lần (Pro, học viên không giới hạn).
- **Tải video**: file lớn hơn 35MB tải qua máy chủ Cloudflare, stream thẳng về máy, có tên file.
- **Dựng video → Trợ lý dựng kiểu agent** (ô "Làm từng bước trên dòng thời gian"): thay vì trả một bản kế hoạch rồi thay cả dòng thời gian, AI gọi từng lệnh lên dự án đang mở, giống cách Vyra cho agent điều khiển trình dựng: xem dự án, đọc lời thoại, tìm footage, thêm/sửa/xoá/tách/trượt/đổi thứ tự đoạn, bỏ vấp, hít beat, b-roll V2, đồ hoạ O1, cài đặt (hook, phụ đề, khung, nền, font, chuyển cảnh), hiểu footage, tìm và lấy B-roll kho, lồng tiếng, xem khung hình để tự kiểm, xuất phụ đề, xuất video, lưu dự án, hoàn tác (26 lệnh, danh sách `AGENT_TOOLS` trong `cloudflare/worker.js`). Khung chat hiện từng bước kèm ảnh khung AI vừa xem; Hoàn tác vẫn lùi từng thao tác. Mỗi yêu cầu tốn 1 lượt chat (Free). Tắt ô này hoặc chưa cài máy chủ thì về bản nháp một phát (dung_ke_hoach) như cũ.
- **Đổi AI**: biến `LLM_PROVIDER` = gemini | claude | openai và key tương ứng trên Cloudflare (xem CAI-DAT.md). Tool và Apps Script không cần đổi.
- **Xuất sang phần mềm khác** (Thuộc tính → Dự án): `📝 Phụ đề .srt` (CapCut: Text → Phụ đề → Nhập; YouTube; Premiere) và `🎞 .fcpxml` (Premiere File → Import, DaVinci Timeline → Import → AAF/EDL/XML, Final Cut) mang dòng thời gian V1, b-roll, đồ hoạ và phụ đề dạng title sang, nối lại file gốc là dựng tiếp được.

Bot: `/maychu <link>` để nối, `/maychu` để xem tình trạng, `/maychu xoa` để tắt. Script property tương ứng: `CF_URL`.

## Tool 6 · Dựng video (tools/dung-video.html + DungVideo.gs)

Trình dựng kiểu Vyra, giao diện tối chuyên nghiệp: **Footage → AI hiểu footage → ra lệnh cho Trợ lý dựng → sửa trên dòng thời gian nhiều track → xuất ngay trên máy.** Hợp talking head, vlog, lồng tiếng, montage có nhạc.

**Cài:** ➕ Script tên `DungVideo`, dán `DungVideo.gs`. Dán đè `HookAI.gs`, `Studio.gs`. Deploy → New version. Key Gemini phải dùng được model `gemini-3.5-transcribe` (key AI Studio thường có sẵn).

### Hiểu footage (Footage Understanding)
Bấm **✨ Hiểu footage** trên từng đoạn (1 lượt "dựng video" mỗi đoạn, Free mặc định 2, bot `/luotdung`). Trình duyệt tách WAV 16kHz, đo khoảng lặng, lấy 4–12 khung hình. Máy chủ chạy 2 bước:
1. **Gemini 3.5 Transcribe** (Interactions API, `timestamp_granularities: word`) → từng từ có mốc giây, giữ cả "ờ, à". Nhanh (8 giây audio ≈ 2 giây).
2. **Gemini Flash** đọc transcript + khung hình → gắn nhãn câu (**vấp / lặp / lạc đề / câu hay**), **cảnh** (mô tả + tag: người, nói, trong nhà, cận tay, sản phẩm…), **khoảnh khắc đáng giữ ★**, từ nên nhấn, hook gợi ý.
Transcribe lỗi thì rơi về cách cũ (Flash nghe thẳng audio). Kết quả nhớ theo tên + cỡ file: đưa lại không tốn lượt. Ô **Tìm trong footage** tìm theo câu nói, mô tả cảnh, tag.

### Trợ lý dựng (chat)
Ra lệnh tự nhiên: "Dựng bản đầu…", "Tìm khoảnh khắc hay nhất ghép 30 giây", "Cắt b-roll theo beat", "Phụ đề kiểu TikTok nhấn các con số". AI nhận câu + cảnh + khoảnh khắc của mọi footage, beat nhạc, dòng thời gian hiện tại, video tham chiếu; trả về V1 (đoạn cắt), hook, phụ đề (kiểu, từ nhấn, số từ mỗi cụm), đồ hoạ O1, điểm zoom, mức nhạc. Chỉ gửi chữ nên tính vào lượt chat. Nói tiếp để sửa.

### Dòng thời gian
Track **O2** chữ (phụ đề tự sinh + hook), **O1** đồ hoạ, **V1** video, **A1** nhạc (vạch xanh = chỗ có tiếng nói, nhạc tự nhỏ). Kéo thân để di chuyển (V1 đổi thứ tự), kéo mép để cắt. **🧲 Hít** vào beat và mép câu. Thanh công cụ: Xoá, Tách (tại đầu phát), Nhân đôi. Phím: Space phát, Delete xoá, Ctrl+Z hoàn tác. Cột phải: thuộc tính đoạn/đồ hoạ đang chọn.

### Phụ đề karaoke, đồ hoạ, nhạc
- Phụ đề theo cụm 2–6 từ, từ đang nói được **tô nền** (TikTok), hoặc viên thuốc karaoke, trắng viền đen, chữ to vui, nền tối. Từ nhấn to hơn và đổi màu (5 màu nhấn). Sửa chữ trong tab Lời thoại là phụ đề đổi theo.
- 10 đồ hoạ "seekable" vẽ bằng canvas (ý tưởng từ catalog HyperFrames): tiêu đề đập, tên + vai trò, danh sách hiện dần theo lời nói, thanh tiến độ, thẻ trích dẫn, đếm số, khung nhấn, mũi tên, vòng màu xoay, nhãn góc. AI tự đặt hoặc thêm tay từ cột phải.
- Nhạc: thêm file → máy đo beat (đỉnh năng lượng dải trầm) → chấm beat trên ruler, hít mép đoạn vào beat, AI "cắt theo beat". Nhạc tự nhỏ khi có tiếng nói (mặc định 12% / 60%), fade cuối.
- Tham chiếu: đưa video mẫu → hiểu như footage (1 lượt) → rút nhịp (số cảnh, độ dài cảnh, từ/giây) để AI bắt chước.

### Xuất
canvas.captureStream + MediaRecorder, thời gian thực (60 giây video ≈ 60 giây), 1080×1920 hoặc 720×1280. Chrome máy tính và Safari ra MP4; Chromium không có H.264 ra WebM (TikTok web vẫn nhận). Không dựng trên máy chủ nên không vướng 6 phút của Apps Script.

### Bản v3: chuyển cảnh, B-roll, bám mặt, font, Trượt/Ripple, dự án
- **Chuyển cảnh:** lõi [gl-transitions](https://gl-transitions.com/) (MIT, 67 shader; bộ shader-transitions của HyperFrames cũng từ họ này) chạy WebGL tại máy. Dùng 10 kiểu: cắt, mờ, trượt, zoom, quét, whip, chớp, glitch, vòng tròn, nhoè. AI chọn theo nội dung (talking head cắt thẳng, montage whip/chớp ở beat); chỉnh từng đoạn ở Thuộc tính hoặc chọn mặc định trên thanh công cụ. Không có WebGL thì rơi về mờ dần 2D.
- **Track V2 b-roll:** kéo một cảnh từ footage thả vào V2, hoặc bảo trợ lý "chèn b-roll". Kiểu che toàn khung hoặc khung nhỏ phía trên. Tắt tiếng, tự mờ vào/ra 0,25s.
- **Bám theo mặt:** source ngang có người nói → trang tự dò mặt bằng MediaPipe Face Detector (WASM của Google, chạy tại máy, không tốn lượt; không tải được thì dùng FaceDetector của trình duyệt, không có nữa thì giữ giữa). Khung dọc "Bám theo mặt" crop theo tâm mặt, làm mượt ±1,2 giây.
- **Font:** 7 font Google có tiếng Việt (Be Vietnam Pro, Montserrat, Bricolage, Lexend, Oswald, Anton, Playfair). AI gợi ý theo ngách, đổi ở Thuộc tính.
- **Phụ đề:** thêm kiểu "bật từng từ" và "nổi lên từng từ"; kéo phụ đề lên xuống ngay trên khung xem trước.
- **Thanh công cụ:** ↔ Trượt (kéo đoạn V1 để đổi khúc lấy trong source, giữ độ dài), ⇤ Ripple (xoá/cắt V1 thì chữ, đồ hoạ, b-roll phía sau dồn theo), chuyển cảnh mặc định.
- **Dự án:** 💾 Lưu ra file `.tmxk.json` (dòng thời gian, phụ đề, đồ hoạ, cài đặt, kết quả hiểu footage). 📂 Mở lại rồi thêm đúng các file footage là khôi phục.
- **Chế độ Nhanh/Kỹ** cho trợ lý dựng (như nút Fast của Vyra): Nhanh dùng flash-lite trả lời trong vài giây, Kỹ dùng flash.
- **Xuất 1440×2560** cho máy mạnh.

**Giới hạn:** chưa có B-roll từ kho ảnh ngoài (Pexels) vì video kho không cho vẽ lên canvas; điện thoại nên dùng footage dưới 3 phút; tải lại trang phải thêm lại file (kết quả hiểu thì còn); mỗi lượt AI mất 1–2 phút trên key miễn phí.

**Đã học từ:** [Vyra](https://www.usevyra.com/ai-video-editor) (luồng footage understanding → chat → timeline → export tại máy, beat sync, ducking), [HyperFrames](https://github.com/heygen-com/hyperframes) (đồ hoạ seekable theo thời gian, catalog caption/kinetic), [Omniclip](https://github.com/omni-media/omniclip), [OpenCut](https://opencut.dev/), [OpenReel](https://github.com/Augani/openreel-video) (dựng và xuất hoàn toàn trong trình duyệt).
