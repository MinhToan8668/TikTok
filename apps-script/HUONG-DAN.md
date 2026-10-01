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

**Thêm key:** Script properties → thêm `GEMINI_API_KEYS`, dán các key cách nhau dấu phẩy. `GEMINI_API_KEY` vẫn là key chính.
⚠️ Hạn mức Gemini tính theo **project**, không tính theo key. Các key phải tạo ở **các project Google Cloud khác nhau** (AI Studio → Create API key → Create in new project) thì mới cộng dồn được. Nhiều key cùng một project không nhanh hơn chút nào.
Cách hiệu quả nhất là **bật billing (Tier 1)** cho project của key chính. Hạn mức mỗi phút tăng lên hàng chục lần, trả tiền theo lượng dùng (bản flash rất rẻ). Làm vậy là hết cảnh 429 và phải chờ.
Video đã tải lên Files API chỉ key của đúng project đó đọc được, nên lượt có video lớn luôn dùng key chính.

### Xoá nền người nói (chạy trên máy, không tốn lượt)

Thuộc tính → **Nền người nói**: Giữ nguyên · Xoá nền → nhoè · Xoá nền → màu (chọn màu) · Xoá nền → tối. Lần đầu bật, trình duyệt tải mô hình MediaPipe Selfie Segmenter (~10MB, tải một lần), sau đó tách người khỏi nền cho từng khung khi xem trước và khi xuất; tương thích cả ba kiểu khung dọc (cắt giữa, bám mặt, giữ nguyên). Không thấy người trong khung thì vẽ như thường, nên bật nhầm trên b-roll cũng không hỏng hình. Mép người đẹp nhất khi nền phẳng, ánh sáng đều; xuất video chậm hơn bình thường. Lưu trong file dự án (`nenKieu`, `nenMau`).

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
