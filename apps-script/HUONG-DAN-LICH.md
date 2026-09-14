# Lịch kèm 1:1 — hướng dẫn cài

Mọi thao tác lịch nằm **trên trang web**. Bot chỉ làm hai việc: **báo về**
và **phân vai** cho người mới đăng ký.

```
Người mới vào web → tự tạo tài khoản (email · mật khẩu · họ tên)
        ↓
Bot nhắn về cho Toàn:  [🎓 Học viên]  [🧑‍🏫 Mentor]  [🚫 Từ chối]
        ↓
Toàn bấm một nút → họ đăng nhập được, thấy đúng giao diện của vai đó
        ↓
Mentor tick ca rảnh trên web  →  Học viên thấy và tick đặt
        ↓
Bot báo về: ai đặt, ca nào, mentor nào  →  nhắc lại trước 6 tiếng
```

Trang **không hỏi ai là mentor ai là học viên**. Vai trò do Toàn quyết trong
bot, và người dùng chỉ thấy đúng phần của mình — học viên không bao giờ nhìn
thấy màn hình mentor.

---

## 1. Thêm file Lich.gs

Trong Apps Script: **＋ → Script**, đặt tên `Lich`, dán toàn bộ nội dung
`apps-script/Lich.gs` vào (xóa hết mấy dòng mẫu có sẵn), Ctrl+S.

## 2. Bốn chỗ nối trong Code.gs

Dán lại `Code.gs` từ repo là đã có sẵn cả 4, khỏi làm gì thêm. Sửa tay bản cũ
thì đây là 4 chỗ:

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

và thêm 6 lệnh mới vào `setMyCommands`: `lichtuan`, `dstk`, `vaitro`,
`xoatk`, `doimk`, `nhactruoc`.

## 3. Chạy `setup`

Chọn hàm `setup` → **Run**. Nó sẽ:

* tạo hai sheet **`Lich`** và **`HocVien`**;
* sinh chuỗi `PEPPER` ngẫu nhiên (dùng để băm mật khẩu — đừng xóa, xóa là
  mọi mật khẩu hỏng hết, phải cấp lại từng người);
* đặt trigger `nhacLich` chạy 15 phút một lần để gửi nhắc hẹn;
* nạp menu lệnh mới cho bot.

Muốn kiểm tra riêng khu lịch thì chạy tay hàm **`kiemTraLich`** rồi đọc
Execution log.

**Deploy lại**: Deploy → Manage deployments → ✏️ → New version → Deploy.
Không deploy lại thì khu học viên báo `unknown_action`.

---

## 4. Người dùng tự đăng ký

Trên landing page bấm **"Khu học viên"** (hoặc vào thẳng `…/index.html#hocvien`)
→ tab **Tạo tài khoản** → điền họ tên, email, mật khẩu (tối thiểu 6 ký tự).

Bot nhắn ngay về chat riêng của Toàn:

```
🙋 Có người vừa đăng ký tài khoản

👤 Nguyễn Văn An   (gọi là Văn An)
📧 an@gmail.com
🕐 14/09/2026 21:07

Chọn vai trò để mở khoá tài khoản này:
[🎓 Học viên]  [🧑‍🏫 Mentor]
[🚫 Từ chối · xoá]
```

**Tên gọi** cắt họ ra, giữ tên đệm + tên: *Nguyễn Văn An* → **Văn An**,
*Trần Thị Ngọc Hương* → **Thị Ngọc Hương**. Đây là tên hiện trong mọi tin
báo về bot, nên nhìn phát biết ngay ai đặt lịch.

Chưa bấm nút thì họ đăng nhập vẫn báo *"tụi mình chưa duyệt xong"* — mật
khẩu đúng cũng không vào được. Nhóm nội bộ cũng nhận được tin báo nhưng
không có nút (bấm trong nhóm không ăn), phân vai làm trong chat riêng.

## 5. Lệnh bot

| Lệnh | Việc |
|---|---|
| `/dstk` | Danh sách tài khoản, chia ba nhóm: chờ phân vai · mentor · học viên. Kèm nút phân vai nhanh cho tối đa 4 người đang chờ |
| `/vaitro an@gmail.com mentor` | Đổi vai (`hv` hoặc `mentor`). Đổi xong phiên cũ bị đá, họ đăng nhập lại là thấy đúng giao diện |
| `/xoatk an@gmail.com` | Xoá hẳn tài khoản |
| `/doimk an@gmail.com` | Cấp lại mật khẩu mới (10 ký tự, hiện một lần) |
| `/lichtuan` | Xem lịch cả tuần: ai mở ca, ai đã đặt |
| `/nhactruoc 6` | Nhắc trước mấy tiếng — đổi lúc nào cũng được |
| `/toida 2` | Mỗi học viên đặt tối đa mấy ca **một tuần** (`0` = bỏ giới hạn) |

`/xoatk` dọn luôn lịch: xoá **học viên** thì các ca họ đang giữ mở lại cho
người khác; xoá **mentor** thì các ca họ mở bị gỡ khỏi lịch.

## 6. Mentor làm gì trên web

Đăng nhập → thấy **Khu mentor**. Mỗi ngày có ba ca sẵn: **Sáng 9–11**,
**Chiều 14–16**, **Tối 20–22**. Bấm một ca là mở cho học viên đặt, bấm lại
là đóng. Cần giờ khác thì bấm **＋ giờ khác** rồi gõ `19:30-21:00`.

Ca đã có học viên đặt hiện màu tối kèm **tên người đặt**, không đóng được
bằng cách bấm ba ca mặc định — muốn huỷ phải bấm thẳng vào ca đó **hai lần**:
lần đầu nút chuyển sang đỏ hỏi *"bấm lần nữa để xác nhận"*, lần hai mới huỷ
thật (rồi nhớ báo lại cho bạn học viên). Bấm nhầm thì để yên 6 giây, nút tự
trở lại bình thường.

Mentor chỉ thấy ca của chính mình. Ca của mentor khác không hiện.

## 6b. Giới hạn mỗi học viên

Mặc định mỗi học viên chỉ giữ được **2 ca một tuần**, để còn chỗ cho người
khác. Đổi bằng `/toida 3`, bỏ hẳn bằng `/toida 0`.

Trên trang, học viên thấy một thanh đếm ngay trên lịch: *"Tuần này bạn đã đặt
1/2 ca, còn 1 ca"*. Hết lượt thì thanh đổi màu vàng và mọi ca trống bị khoá —
chỉ còn bấm huỷ được ca của chính mình. Huỷ một buổi là có lại lượt ngay.

Giới hạn tính **theo từng tuần**, tuần sau lại đủ lượt. Đổi số nhỏ hơn thì
lịch cũ vẫn giữ nguyên (không ai bị mất chỗ đã đặt), chỉ lần đặt mới bị chặn
— bot liệt kê luôn ai đang giữ nhiều hơn số mới để bạn biết mà xử lý.

## 7. Học viên làm gì trên web

Đăng nhập → thấy **Khu học viên**: lịch theo tuần, lật tới lui bằng hai nút
mũi tên, tick một ca là đặt xong. Ca người khác đã đặt bị ẩn cho đỡ rối; ca
của chính họ hiện màu xanh, bấm **hai lần** để huỷ (lần đầu hỏi lại cho chắc,
lần hai mới huỷ).

Mỗi lần đặt/huỷ, bot nhắn ngay về kèm tên và email người đặt. Trước giờ hẹn
đúng `nhactruoc` tiếng, bot nhắn nhắc lần nữa.

## 8. Mật khẩu và phiên đăng nhập

Mật khẩu **không lưu dạng chữ thường** ở bất cứ đâu: sheet chỉ giữ bản băm
SHA-256 (1500 vòng, salt riêng từng người + PEPPER chung), so sánh theo thời
gian hằng số. Quên mật khẩu thì cấp lại bằng `/doimk` chứ không đọc lại được
— cố ý như vậy.

Phiên đăng nhập giữ 30 ngày, token cũng băm khi lưu. Trình duyệt chỉ giữ
token, không giữ mật khẩu. Sai mật khẩu 5 lần trong 10 phút thì email đó bị
khoá tạm.

---

## Sự cố hay gặp

**Khu học viên báo "Không nối được máy chủ"** — chưa deploy version mới, hoặc
`API` trong `index.html` trỏ vào deployment cũ.

**Đăng ký xong bot không báo gì** — thiếu chỗ nối (a), hoặc chưa deploy lại.

**Bấm nút phân vai không ăn** — thiếu chỗ nối (c). Chạy lại `setup`.

**Người dùng đăng nhập vẫn thấy giao diện cũ sau khi đổi vai** — họ cần thoát
rồi đăng nhập lại. `/vaitro` đã tự đá phiên cũ nên chỉ cần tải lại trang.

**Không nhận được nhắc hẹn** — chạy `kiemTraLich`, xem dòng "Lịch nhắc". Báo
chưa có trigger thì chạy `lichSetup`.

**Bấm huỷ mà không huỷ được, cũng không báo gì** — bản cũ dùng `confirm()`,
trình duyệt chặn hộp thoại khi trang chạy trong khung nhúng (iframe không có
`allow-modals`) nên lệnh huỷ không bao giờ chạy. Bản này đã bỏ hẳn
`confirm()` và `prompt()`, thay bằng bấm hai lần và ô nhập giờ tại chỗ. Nếu
vẫn gặp, kiểm tra xem có đang chạy bản `index.html` cũ không.

**Ai cũng báo sai mật khẩu** — `PEPPER` trong Script Properties bị đổi hoặc bị
xoá. Cấp lại mật khẩu bằng `/doimk` cho từng người.
