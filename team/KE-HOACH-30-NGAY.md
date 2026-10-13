# Kế hoạch 30 ngày: làm lại vận hành TMXK

Dựng từ buổi góp ý của anh làm marketing (10/2026), chỉnh lại cho vừa một team 3 người.
Chạy thử 30 ngày, hết tháng ngồi lại xem số rồi giữ cái chạy được, bỏ cái không.

Đi kèm: `QUY-TRINH-TEAM.md` (ai làm gì, 7 bước một video), `QUY-CHUAN-THUONG-HIEU.md` (giọng, màu).

---

## 0. Đọc trước: chỗ mình chỉnh so với lời khuyên gốc

Lời khuyên gốc viết cho team có nhiều nhóm. TMXK đang có 3 người, 2 người chưa nhiệt.
Dựng nguyên bộ máy (file phân task theo nhóm, dashboard, scoring nhiều tầng) thì người làm
dashboard sẽ là chủ kênh, tức là thêm việc cho đúng người đang quá tải. Nên:

| Lời khuyên gốc | Làm ở TMXK | Vì sao |
|---|---|---|
| File phân task theo từng group | **Một** Google Sheet, mỗi việc một dòng | 3 người không có "group" |
| Dashboard đánh dấu | Chính cái Sheet đó, tô màu tự động khi trễ hạn | Không làm thêm công cụ thứ hai |
| Scoring bảng công việc | Chấm 3 thứ, mỗi thứ 0–2 điểm, chấm 1 lần/tuần | Chấm nhiều tiêu chí thì không ai chấm đều |
| Gặp riêng từng bạn | Giữ nguyên, làm **tuần đầu tiên** | Đây là việc quan trọng nhất của cả tháng |

Câu quan trọng nhất trong lời khuyên gốc là **"chọn người nhiệt huyết hơn người có chuyên môn
mà không nhiệt huyết"**. Quy trình chỉ giúp thấy rõ ai đang chơi. Nó không biến người không
muốn làm thành người muốn làm. 30 ngày này là để có bằng chứng ra quyết định về người,
không phải để hy vọng họ tự đổi.

---

## 1. Lịch 30 ngày

| Tuần | Việc chính | Xong khi |
|---|---|---|
| **1** | Gặp riêng từng bạn (mục 4). Dựng Sheet (mục 2). Thống nhất cách chấm điểm (mục 3) | Hai bạn đã nói rõ có muốn làm tiếp không, và đồng ý cách chấm |
| **2** | Chạy theo `QUY-TRINH-TEAM.md`: 4 video, đăng đúng lịch. Chủ kênh **chỉ duyệt, không làm hộ** | Sheet có đủ 4 dòng video, có điểm tuần 1 |
| **3** | Chạy tiếp. Bắt đầu kế hoạch truyền thông (mục 6): kênh Toàn dẫn về TMXK | Ít nhất 2 video trên kênh Toàn có dẫn về TMXK |
| **4** | Chạy tiếp. Cuối tuần họp tổng kết (mục 8) | Có quyết định về từng người |

**Luật của 30 ngày:** việc ai trễ thì để trễ, tô đỏ trong Sheet, không âm thầm làm thay.
Làm thay là xoá luôn bằng chứng mình cần để ra quyết định.

---

## 2. Bảng việc (một Google Sheet)

Một tab duy nhất tên `Việc`. Mỗi dòng là một việc có người làm và hạn.

| Cột | Ghi gì | Ví dụ |
|---|---|---|
| Việc | Một câu, bắt đầu bằng động từ | Viết kịch bản video "3 lỗi hook" |
| Nhóm | Video / Bài đăng / Khoá học / Tool | Video |
| Người làm | **Một** tên | Content |
| Hạn | Ngày | 16/10 |
| Trạng thái | Chưa làm / Đang làm / Chờ duyệt / Xong / Trả về | Chờ duyệt |
| Link | Bằng chứng: link kịch bản, link video, link bài | … |
| Ghi chú | Lý do trả về, nếu có | Hook chưa có số |

**Tô màu tự động** (Định dạng → Định dạng có điều kiện):
- Cả dòng đỏ nhạt khi: `Hạn < TODAY()` và `Trạng thái ≠ Xong`
- Cả dòng xanh nhạt khi: `Trạng thái = Xong`

Thế là đủ làm "dashboard": mở Sheet ra, chỗ nào đỏ là chỗ đó có người đang chơi. Không ai
phải đi hỏi, không ai phải đi nhắc.

**Ai cập nhật:** người làm tự đổi trạng thái và dán link khi xong. Không dán link thì chưa xong.

---

## 3. Chấm điểm mỗi tuần

Chủ kênh chấm, Chủ nhật mỗi tuần, 5 phút. Ba tiêu chí, mỗi cái 0–2 điểm:

| Tiêu chí | 0 điểm | 1 điểm | 2 điểm |
|---|---|---|---|
| **Đúng hạn** | Trễ quá nửa số việc | Trễ 1–2 việc | Không trễ việc nào |
| **Đạt chuẩn** | Bị trả về nhiều lần | Bị trả về 1 lần | Duyệt luôn |
| **Chủ động** | Phải nhắc mới làm | Làm đủ việc được giao | Tự đề xuất hoặc tự sửa trước khi bị nói |

Điểm tuần tối đa 6. Ghi vào tab thứ hai tên `Điểm`, mỗi tuần một cột.

**Cách đọc sau 3 tuần:**
- 5–6 đều đặn: người giữ được. Nói chuyện trả công tốt hơn (xem `QUY-TRINH-TEAM.md` mục 6).
- 3–4: chưa chắc. Hỏi thẳng vướng gì.
- 0–2 hai tuần liền: đủ bằng chứng. Xem mục 8.

Tiêu chí "Chủ động" là cái đo đúng chữ "nhiệt huyết". Hai cái kia ai chịu khó cũng đạt được.

---

## 4. Gặp riêng từng bạn (tuần 1)

Gặp từng người một, không gặp chung. Ngồi cà phê hoặc gọi riêng, 30–45 phút.
Mục đích: nói thẳng, và nghe thật.

**Thứ tự nói:**
1. **Hỏi trước, nói sau.** "Làm với TMXK tới giờ, bạn thấy sao? Phần nào thích, phần nào ngán?"
   Rồi im, nghe cho hết.
2. **Nói điều mình thấy, bằng việc cụ thể, không bằng tính cách.**
   Nói: "Tuần rồi 3 trong 4 kịch bản tới hạn mà mình phải nhắc mới có."
   Không nói: "Bạn không có trách nhiệm."
3. **Nói điều mình cần.** "Mình cần người tự chạy được phần [việc], mình chỉ duyệt."
4. **Đưa lựa chọn thật.** "Một tháng tới mình chạy thử cách mới, có bảng việc, có chấm điểm.
   Bạn muốn vô thì mình làm, bạn thấy không hợp thì cũng nói thẳng, mình không giận."
5. **Chốt bằng một câu cụ thể.** Họ đồng ý thì: "Vậy thứ Hai mình gửi Sheet, việc đầu tiên
   của bạn là ___, hạn ___."

Hiểu tính cách người đó (lời khuyên gốc) là ở bước 1. Người hay im thì hỏi câu cụ thể hơn.
Người hay đồng ý cho xong thì hỏi "cái gì làm bạn ngại nhất?".

---

## 5. Học phí 3 gói

Lời khuyên gốc: có 3 gói thì phần đông chọn gói giữa. Nên **gói giữa là gói mình muốn bán**,
hai gói kia để gói giữa trông hợp lý.

| | Tự học | **Có kèm** ★ | 1 kèm 1 |
|---|---|---|---|
| Tài liệu khoá | ✓ | ✓ | ✓ |
| Viral Studio bản Pro | ✓ | ✓ | ✓ |
| Group hỏi đáp, mentor trả lời | ✓ | ✓ | ✓ |
| Kèm edit 1:1 trong lớp | | ✓ | ✓ |
| Lớp tối đa 10 người | | ✓ | |
| Buổi riêng 1 kèm 1 | | | [số] buổi |
| Soi kênh hàng tuần | | | ✓ |
| Học phí | [giá] | **2tr** (giá khoá 4) | [giá] |

Gợi ý tỉ lệ khi điền giá: gói Tự học khoảng một nửa gói giữa, gói 1 kèm 1 khoảng 2–2,5 lần.
Gói đắt nhất không cần nhiều người mua; nó làm 2tr trông như món hời.

Khoá 4 đã chốt 2tr một gói. Áp 3 gói từ **khoá 5**, đừng đổi giữa chừng khi đã có người giữ chỗ.

---

## 6. Kế hoạch truyền thông (không phải kế hoạch marketing)

Lời khuyên gốc nói "communication plan hơn là marketing plan": nghĩ xem **ai nói gì, ở đâu,
cho ai nghe**, chứ không chỉ chạy quảng cáo.

### Dòng chảy

```
Kênh Toàn (@financewithto)  ──►  TMXK (page, group)  ──►  Khoá học
 xây uy tín cá nhân              dạy, cho tool free          bán
```

Kênh Toàn có sẵn người theo dõi và uy tín (CFA, ngân hàng, M&A). Người ta tin **người**
trước khi tin **thương hiệu**. Nên kênh Toàn kể chuyện tự làm kênh, TMXK là nơi người ta
tới để làm theo.

### Mỗi tuần

| Kênh | Nội dung | Dẫn về đâu |
|---|---|---|
| TikTok Toàn | 1 video hậu trường: "mình làm kênh này thế nào", kết quả thật, lỗi thật | "Tool mình dùng để làm video này ở bio" → Viral Studio |
| Page TMXK | 3–4 bài: mẹo, tool, học viên | Group, form khoá học |
| Threads | 1 bài/ngày, hot take về content | Page TMXK |
| Group Zalo học viên | Giao bài, khen bài tốt, nhắc lịch | Khoá tiếp theo |

### Nhờ học viên đăng

Làm một clip ngắn 15–20 giây, học viên đăng lại trên kênh họ:
- Mở bằng video của chính học viên trước và sau khoá (họ đồng ý thì mới dùng)
- Một câu của họ: họ được gì
- Cuối clip: tên TMXK

Đưa sẵn clip và caption mẫu, học viên chỉ việc đăng. Bắt họ tự làm thì không ai làm.

---

## 7. Cái gì chỉ TMXK có

Trả lời câu "cái gì mình có mà đối thủ không có". Đây là thứ đưa lên đầu mọi bài bán:

1. **Kèm edit 1:1 tới khi lên video.** Đa số khoá bán video quay sẵn.
2. **Bộ tool tự code, cho học viên dùng.** Không khoá nào có bộ 6 tool đi đúng thứ tự làm video.
3. **Người dạy có nghề thật ngoài content.** Ngân hàng, M&A, CFA. Dạy làm content mà
   không sống bằng việc bán khoá content.
4. **Lớp 10 người.** Mentor trả lời trực tiếp, không qua trợ lý.

Điểm 3 là của riêng Toàn, không ai sao chép được. Dùng nó nhiều hơn.

---

## 8. Họp tổng kết ngày 30

Một tiếng. Mang theo Sheet và tab `Điểm`.

1. **Số:** bao nhiêu video đăng đúng hạn, view trung bình, bao nhiêu người vào group, bao
   nhiêu người đăng ký khoá.
2. **Người:** điểm từng người qua 3 tuần. Quyết định một trong ba:
   - Giữ, nói chuyện trả công tốt hơn
   - Giữ thêm 2 tuần, nói rõ cần đổi gì
   - Thôi hợp tác, cảm ơn tử tế
3. **Quy trình:** cái gì trong file này không ai làm? Bỏ nó đi. Cái gì thiếu? Thêm vô.

---

## 9. Khi cần tìm người mới

Đừng tuyển theo chức danh ("tuyển editor"). Tuyển theo **việc cần giải quyết**:

| Thay vì tuyển | Tìm người làm được |
|---|---|
| Editor | Dựng xong 4 video/tuần theo phong cách TMXK, tự chấm bằng tool trước khi nộp |
| Content creator | Viết 4 kịch bản/tuần đạt ≥ 60 điểm trong tool, không cần nhắc |
| Admin group | Trả lời câu hỏi học viên trong 2 tiếng, ghi lại câu hỏi hay gặp |

Cách thử: giao một việc thật có trả tiền, hạn 3 ngày. Người nhiệt sẽ hỏi lại cho rõ rồi
nộp sớm. Người không nhiệt sẽ im rồi nộp trễ. Xem cách họ làm cái việc nhỏ đó là đủ biết.

Ứng viên tốt nhất thường là **học viên cũ**: đã hiểu TMXK, đã dùng tool, và đã chứng minh
chịu làm khi tự làm video của mình.
