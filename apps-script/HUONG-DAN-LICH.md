# Lịch kèm 1:1 — hướng dẫn cài

Khu này gồm hai nửa:

* **Mentor** tick lịch rảnh ngay trong bot Telegram.
* **Học viên** đăng nhập ở khu riêng trên landing page, thấy ca còn trống theo
  tuần rồi tick đặt. Đặt xong bot nhắn về cho Toàn, và nhắc lại trước giờ hẹn
  6 tiếng (đổi được).

Mọi thứ nằm trong **`Lich.gs`** — một file riêng, không đụng vào `Code.gs` cũ
ngoài 4 dòng nối ở dưới.

---

## 1. Thêm file Lich.gs

Trong Apps Script: **＋ → Script**, đặt tên `Lich`, dán toàn bộ nội dung
`apps-script/Lich.gs` vào (xóa hết mấy dòng mẫu có sẵn), Ctrl+S.

## 2. Bốn chỗ nối trong Code.gs

Nếu bạn dán lại `Code.gs` từ repo thì đã có sẵn cả 4, khỏi làm gì thêm.
Còn nếu đang sửa tay bản cũ thì đây là 4 chỗ:

**(a) trong `doPost`**, ngay dưới dòng `register`:

```js
if (body.action === 'register') return handleRegister(body);

// Khu học viên: đăng nhập / xem lịch / đặt / hủy  (xem Lich.gs)
if (String(body.action||'').indexOf('hv_') === 0) return jsonOut(lichApi(body));
```

**(b) trong `handleTelegram`**, ngay trên dòng `var cfg = getConfig();`:

```js
// Lệnh của khu lịch mentor (Lich.gs) — tách riêng cho gọn
if (quanTri && lichCoLenh(cmd)) return lichLenh(cmd, arg, chatId, msg);
```

**(c) trong `handleCallback`**, ngay dưới dòng kiểm tra `isAdmin`:

```js
// Nút của khu lịch mentor (Lich.gs) đều mang tiền tố "l:"
if (String(cb.data||'').indexOf('l:') === 0) return lichCallback(cb);
```

**(d) trong `setup()`**, dưới dòng đẩy tên sheet vào `out`:

```js
try{ out.push('✔ '+lichSetup()); }
catch(err){ out.push('✘ Không dựng được khu lịch mentor: '+err); }
```

và thêm 8 lệnh mới vào danh sách `setMyCommands` (`lich`, `lichtuan`,
`themhv`, `dshv`, `xoahv`, `doimk`, `nhactruoc`, `tenmentor`).

## 3. Chạy `setup`

Chọn hàm `setup` → **Run**. Nó sẽ:

* tạo hai sheet **`Lich`** và **`HocVien`**;
* sinh chuỗi `PEPPER` ngẫu nhiên (dùng để băm mật khẩu — đừng xóa, xóa là
  mọi mật khẩu học viên hỏng hết, phải cấp lại);
* đặt trigger `nhacLich` chạy 15 phút một lần để gửi nhắc hẹn;
* nạp menu lệnh mới cho bot.

Muốn kiểm tra riêng khu lịch thì chạy tay hàm **`kiemTraLich`** rồi đọc
Execution log.

**Deploy lại**: Deploy → Manage deployments → ✏️ → New version → Deploy.
Không deploy lại thì landing page vẫn gọi vào bản cũ, khu học viên sẽ báo
`unknown_action`.

---

## 4. Mentor dùng thế nào

| Lệnh | Việc |
|---|---|
| `/lich` | Mở bảng tuần, bấm vào ngày rồi tick ca rảnh |
| `/lichtuan` | Xem cả tuần: ca nào trống, ca nào ai đã đặt |
| `/tenmentor Minh Toàn` | Tên hiện cho học viên thấy (mặc định lấy tên Telegram) |
| `/nhactruoc 6` | Nhắc trước mấy tiếng — đổi lúc nào cũng được |

Ba ca mặc định: **Sáng 9–11**, **Chiều 14–16**, **Tối 20–22**. Cần giờ lẻ thì
trong bảng ngày bấm **“➕ Giờ khác”** rồi gõ `19:30-21:00` (hoặc
`7h30 - 9h`, bot đọc được cả hai kiểu).

Bấm lại một ca đang mở là tắt nó. Ca **đã có học viên đặt thì không tắt được**
— hủy phía học viên hoặc nhắn cho họ trước đã.

## 5. Cấp tài khoản học viên

```
/themhv an@gmail.com Nguyễn An
```

Email trước, tên sau (tên không bắt buộc). Bot tự sinh mật khẩu 10 ký tự rồi
nhắn lại cho bạn để chuyển cho học viên — không tự đặt mật khẩu được, cố ý
vậy để khỏi ai đặt `123456`.

Gõ `/themhv` trống thì bot hỏi email ở tin nhắn tiếp theo, khỏi nhớ cú pháp.

| Lệnh | Việc |
|---|---|
| `/dshv` | Danh sách tài khoản |
| `/doimk an@gmail.com` | Cấp lại mật khẩu mới (đá luôn phiên đang đăng nhập) |
| `/xoahv an@gmail.com` | Xóa tài khoản (lịch họ đang giữ sẽ mở lại) |

Mật khẩu **không lưu dạng chữ thường** ở bất cứ đâu: sheet chỉ giữ bản băm
SHA-256 (1500 vòng, có salt riêng từng người + PEPPER chung). Quên mật khẩu
thì cấp lại chứ không đọc lại được — cố ý như vậy.

## 6. Học viên dùng thế nào

Trên landing page bấm **“Khu học viên”** (hoặc vào thẳng
`…/index.html#hocvien`), đăng nhập bằng email + mật khẩu bạn cấp. Họ thấy
lịch theo tuần, lật tới lui bằng hai nút mũi tên, tick một ca là đặt xong.
Ca người khác đã đặt bị ẩn đi cho đỡ rối; ca của chính họ hiện rõ và hủy được.

Mỗi lần đặt/hủy, bot nhắn ngay về chat của Toàn. Trước giờ hẹn đúng
`nhactruoc` tiếng, bot nhắn nhắc một lần nữa.

Phiên đăng nhập giữ 30 ngày. Trình duyệt chỉ lưu **token**, không lưu mật
khẩu. Sai mật khẩu 5 lần trong 10 phút thì email đó bị khóa tạm.

---

## Sự cố hay gặp

**Khu học viên báo “Không gọi được máy chủ”** — chưa deploy version mới, hoặc
`API` trong `index.html` trỏ vào deployment cũ.

**Bấm nút trong bot không thấy gì** — thiếu chỗ nối (c), hoặc lịch hỏi
Telegram (`datLichHoi`) đang tắt. Chạy lại `setup`.

**Không nhận được nhắc hẹn** — chạy `kiemTraLich`, xem dòng “Lịch nhắc”. Nếu
báo chưa có trigger thì chạy `lichSetup`.

**Học viên nào cũng báo sai mật khẩu** — `PEPPER` trong Script Properties bị
đổi hoặc bị xóa. Cấp lại mật khẩu bằng `/doimk` cho từng người.
