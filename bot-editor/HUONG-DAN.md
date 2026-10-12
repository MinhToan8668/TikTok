# Bot Editor — chốt kịch bản, hạn draft, góp ý

Bot Telegram cho editor và khách làm việc với nhau: kịch bản phải **cả hai bấm chốt**
mới khóa. Từ lúc chốt, editor có **48 giờ** để có draft. Khách góp ý theo mẫu, bot
đếm vòng sửa, nhắc hạn và ghi mọi bước vào Google Sheet. Khi có hiểu lầm thì gõ
`/xem V001`, cả hai cùng xem lại dòng thời gian.

Mọi con số (48 giờ, 2 video/tuần, 2 vòng sửa…) đổi bằng `/caidat` ngay trong Telegram.

## Cài đặt (khoảng 15 phút)

### 1. Tạo bot
1. Telegram → **@BotFather** → `/newbot` → đặt tên → copy **token**.
2. Vẫn ở BotFather: `/setprivacy` → chọn bot → **Disable**. Không bắt buộc, nhưng tắt
   privacy thì trả lời câu hỏi của bot gọn hơn.

### 2. Tạo project Apps Script RIÊNG
1. Vào <https://script.google.com> → **New project**, đặt tên `Bot Editor`.
   Không dán chung vào project khóa học.
2. Đổi tên file `Code.gs` thành `Bot.gs` rồi dán nội dung `bot-editor/Bot.gs`.
3. Bấm **+ → Script**, đặt tên `Luat`, dán nội dung `bot-editor/Luat.gs`.

### 3. Script Properties
**Project Settings (⚙️) → Script Properties → Add**:

| Property | Giá trị |
|---|---|
| `BOT_TOKEN` | Token từ BotFather |
| `EDITOR_IDS` | User ID của bạn (editor). Nhiều người thì cách nhau dấu phẩy |
| `KHACH_IDS` | User ID của khách |
| `GROUP_ID` | Chat ID của group làm việc (số âm, VD `-1001234567890`) |
| `GEMINI_API_KEY` | Tuỳ chọn. Có key thì AI đối chiếu từng góp ý với kịch bản đã chốt |

Không biết ID: cứ đặt `BOT_TOKEN` trước, chạy bước 4, tạo group gồm bạn, khách và bot,
rồi mỗi người gõ `/id` trong group. Bot trả Chat ID và User ID. Điền vào rồi chạy
lại `setup`.

### 4. Chạy setup
Chọn hàm `setup` → **Run** → đồng ý cấp quyền. Execution log sẽ in link Sheet và
trạng thái bot. Bot tự đặt lịch chạy mỗi phút: nhận lệnh và nhắc hạn. Tin đầu tiên có
thể chờ tối đa 1 phút. Không cần deploy Web App.

Bot nhắn liên tục hoặc muốn tạm nghỉ: chạy `dungBot`. Bật lại: chạy `setup`.

## Cách dùng

| Bước | Ai | Làm gì |
|---|---|---|
| 1 | Ai cũng được | `/moi Tên video` → trả lời tin bot bằng kịch bản |
| 2 | Cả hai | Bấm **✅ Đồng ý chốt**. Đủ hai người thì kịch bản khóa, hạn draft bắt đầu |
| 3 | Editor | `/nop V001 link` |
| 4 | Khách | Bấm **Duyệt**, hoặc **Cần sửa** rồi góp ý theo mẫu `giây – vấn đề – mong muốn` |
| 5 | Editor | Sửa xong `/nop V001 link-mới` → quay lại bước 4 |

Lệnh khác: `/ds` video đang làm · `/xem V001` dòng thời gian · `/tuan` báo cáo ·
`/kichban V001` gửi kịch bản mới · `/caidat` xem/đổi thỏa thuận.

### Đổi thỏa thuận

```
/caidat                 xem toàn bộ
/caidat draft 72        có draft sau 72 giờ kể từ lúc chốt kịch bản
/caidat video 3         mục tiêu 3 video/tuần
/caidat gopy 24         khách có 24 giờ để góp ý mỗi bản
/caidat sua 12          editor có 12 giờ để nộp bản sửa
/caidat luotsua 3       3 vòng sửa miễn phí mỗi video
/caidat nhac 6          nhắc trước hạn 6 giờ
/caidat tuduyet tat     quá hạn góp ý chỉ nhắc, không tự duyệt
```

Chỉ editor đổi được. Mỗi lần đổi, bot báo vào group và ghi vào nhật ký. Hạn mới áp
dụng cho bước bắt đầu sau lúc đổi; video đang chạy giữ hạn cũ.

### Quy tắc bot giữ cho công bằng
- Hạn draft tính từ lúc **người thứ hai** bấm chốt, không tính từ lúc nhận yêu cầu.
- Gửi kịch bản mới sau khi đã chốt thì hạn cũ bị hủy, chờ chốt lại. Lần đổi này được
  ghi riêng và hiện trong báo cáo tuần.
- Nộp trễ hay đúng hạn đều được ghi lại, cả với editor lẫn khách.
- Quá số vòng sửa miễn phí: bot báo để hai bên thống nhất thêm thời gian hoặc chi phí.
- AI chỉ gợi ý phân loại góp ý; quyết định vẫn là hai người.

## Dữ liệu (Google Sheet do setup tạo)
- `Video`: trạng thái và các mốc hạn của từng video.
- `KichBan`: mọi phiên bản kịch bản, ai bấm chốt, lúc nào.
- `NhatKy`: dòng thời gian, chỉ thêm, không sửa. **Đừng sửa tay tab này.**
- `Loi`: lỗi máy chủ nếu có.

## Kiểm tra quy tắc khi sửa code
```
node bot-editor/kiem-tra-luat.js
```
