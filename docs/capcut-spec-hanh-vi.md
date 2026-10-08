# CapCut — spec hành vi chi tiết để build web editor clone
_Cập nhật 07/10/2026_
Tài liệu này mô tả hành vi thực tế của từng thao tác trong CapCut desktop (phiên bản quốc tế, UI tiếng Anh) để AI build web editor clone cho đúng. Nó bổ sung cho file `capcut-web-editor-spec.md` (danh mục tính năng + data model + prompt theo phase): file kia nói có gì, file này nói bấm vào thì chuyện gì xảy ra. Mỗi thao tác viết theo mẫu: điều kiện → input người dùng → kết quả trên model → kết quả trên UI → trường hợp biên.

## 0. Khái niệm cốt lõi

| Khái niệm | Định nghĩa đúng theo CapCut | Hệ quả khi build |
|---|---|---|
| Asset (media trong bin) | File gốc đã import. Không bao giờ bị sửa. | Item chỉ trỏ tới asset bằng id; xóa item không xóa asset |
| Item (segment/clip) | Một đoạn của asset đặt lên timeline. Có `start` (vị trí trên timeline), `in`/`out` (đoạn lấy từ nguồn), `duration = (out − in) / speed` | Trim chỉ đổi `in/out/start`, không đổi asset |
| Main track | Track thấp nhất của video, từ tính: không bao giờ có khoảng trống, item luôn xếp sát nhau từ t=0 | Mọi command trên main track phải kết thúc bằng bước dồn (`ripple`) |
| Overlay track | Track phía trên main track. Item đặt tự do, cho phép khoảng trống, không ripple | Z-order: track càng cao vẽ càng đè lên |
| Audio track | Nằm dưới main track. Cũng đặt tự do như overlay | Không có magnetic |
| Text / Caption / Sticker / Effect track | Cũng là overlay track, mỗi loại một màu. CapCut tự tạo track mới nếu thả đè lên vùng đã có item | Không trộn loại trong 1 track |
| Playhead | Vạch dọc trắng chạy xuyên tất cả track. Là "con trỏ" cho mọi lệnh: split, Q/W, paste, add text, keyframe đều tính tại playhead | Playhead là state toàn cục, không thuộc track nào |
| Selection | Item đang chọn có viền trắng dày. Chỉ có 1 selection toàn timeline, nhiều item cùng lúc được | Inspector render theo item được chọn đầu tiên |
| Snap | Khi kéo, mép item hút vào: playhead, mép item khác (mọi track), marker, t=0, beat marker | Ngưỡng hút ≈ 8 px màn hình, không phụ thuộc zoom |
| Đơn vị thời gian | CapCut lưu µs (số nguyên). Hiển thị `mm:ss:ff` (frame) hoặc `mm:ss.ms` tùy setting | Model nên dùng số nguyên (µs hoặc tick 1/fps) để split nhiều lần không lệch |
| Thứ tự ưu tiên khi vẽ frame | Main track → overlay thấp → overlay cao → text/caption → sticker → effect layer (áp lên tất cả bên dưới) | `renderFrame` duyệt track theo index tăng dần |

## 1. Timeline: hành vi từng thao tác

Quy ước chung: mọi thao tác dưới đây là một command vào store, một bước undo. Kéo thả chỉ commit khi thả chuột (mouseup); trong lúc kéo chỉ vẽ "ghost" (bản mờ) và không đổi model.

### 1.1 Kéo media từ bin vào timeline

| Bước | Hành vi |
|---|---|
| Bắt đầu kéo | Mousedown trên thumbnail trong bin, kéo quá 4 px mới tính là drag (tránh click nhầm). Con trỏ mang theo ghost có độ dài = duration của asset ở zoom hiện tại |
| Rê qua main track | Ghost hút vào mép gần nhất của item đang có. Vị trí thả hợp lệ chỉ có: đầu timeline, giữa 2 item, cuối. Hiện một vạch dọc xanh ở vị trí sẽ chèn |
| Thả lên main track | Insert item tại vị trí vạch; mọi item phía sau bị đẩy lùi đúng bằng duration của item mới. Không bao giờ đè lên item cũ |
| Rê qua vùng trống phía trên main track | Tạo ghost ở đúng vị trí chuột (không đẩy ai). Nếu chuột ở phía trên track overlay cao nhất → sẽ tạo track mới |
| Thả lên overlay | Đặt item tại `start = t(chuột)`; nếu trùng item đang có trên track đó → CapCut tự tạo track mới phía trên rồi đặt vào đó (không từ chối thả) |
| Thả file audio | Chỉ được thả xuống vùng audio phía dưới main track; rê lên trên main track thì ghost hiện dấu cấm |
| Thả ảnh | Item ảnh mặc định 5 s (setting "Image duration"), trim được dài tùy ý |
| Double-click thumbnail trong bin (hoặc nút +) | Chèn vào main track tại playhead: nếu playhead nằm giữa 1 item thì item đó bị split và clip mới chèn vào giữa |
| Kéo nhiều file cùng lúc | Xếp nối đuôi theo thứ tự chọn |

### 1.2 Chọn (selection)

Click item → chọn item đó, bỏ chọn cái khác. Inspector đổi sang loại tương ứng.
Click vùng trống timeline → bỏ chọn tất cả; Inspector chuyển sang thuộc tính dự án (tỉ lệ khung, nền).
Shift+click → thêm vào selection. Ctrl+click → toggle.
Kéo khung chọn (marquee) từ vùng trống: chọn mọi item chạm khung, qua nhiều track.
Ctrl+A → chọn tất cả item trên mọi track.
Item đang chọn: viền trắng 2 px, tay nắm 2 mép hiện rõ, hiện nút keyframe trên item nếu có keyframe.
Chọn 1 item rồi click vào canvas preview → canvas highlight bounding box của item đó (và ngược lại: click vật thể trên canvas chọn item tương ứng ở timeline).

### 1.3 Di chuyển (move)

| Trường hợp | Hành vi |
|---|---|
| Kéo item trên overlay | Item đi theo chuột theo cả 2 chiều: ngang = thời gian, dọc = đổi track. Mép trái và mép phải đều snap |
| Kéo item trên main track sang trái/phải | Không có khoảng trống: item "đổi chỗ" với item láng giềng khi kéo qua quá nửa độ dài của láng giềng (reorder). Ghost hiện ở vị trí sẽ đổi chỗ |
| Kéo item từ main track lên overlay | Rời main track: các item sau dồn lên lấp chỗ. Item trở thành overlay tự do |
| Kéo item từ overlay xuống main track | Chèn như 1.1 (đẩy item sau), track overlay để lại khoảng trống |
| Kéo chồng lên item khác trên overlay | Không đè: tự đẩy lên track mới phía trên |
| Giữ Shift khi kéo | Khóa trục: chỉ đổi thời gian, không đổi track |
| Giữ Alt khi kéo | Tắt snap tạm thời |
| Kéo nhiều item | Giữ nguyên khoảng cách tương đối giữa các item; snap tính theo item đầu tiên |
| Kéo item có transition | Transition đi theo item; nếu tách khỏi item láng giềng thì transition bị xóa |
| Kéo video có audio liên kết | Audio đi theo (link). Sau khi "Extract audio" hoặc unlink thì đi riêng |

### 1.4 Trim bằng mép (edge trim)

Hover mép trái/phải item (vùng 6–8 px) → con trỏ đổi thành `⇤⇥`; mousedown + kéo.
Kéo mép phải sang phải: tăng `out`, kéo dài item. Giới hạn: `out ≤ asset.duration`; chạm giới hạn thì mép dừng lại và nhấp nháy đỏ.
Kéo mép phải sang trái: giảm `out`. Giới hạn: item không ngắn hơn 1 frame.
Kéo mép trái sang phải: tăng `in`. Trên overlay: `start` tăng theo, mép phải đứng yên. Trên main track: `start` giữ nguyên (mép trái đứng yên), item ngắn lại từ bên phải và mọi item sau dồn lên (ripple).
Kéo mép trái sang trái: giảm `in`. Overlay: `start` giảm. Main track: `start` giữ nguyên, item dài thêm, đẩy item sau lùi; giới hạn `in ≥ 0`.
Trên overlay: trim mép trái không được đè sang item trước đó trên cùng track → mép dừng ở mép item kia.
Item ảnh / text / màu nền: không có giới hạn nguồn, kéo dài vô hạn.
Khi trim, preview hiển thị frame tại mép đang kéo (không phải tại playhead) để người dùng nhìn thấy đang cắt ở đâu. Thả chuột thì quay lại frame tại playhead.
Tooltip khi kéo: hiện `Δ +00:01:12` (thay đổi) và duration mới.
Mép item có keyframe: keyframe lưu theo thời gian tương đối với `in` của nguồn (thực tế CapCut lưu offset từ đầu segment); trim mép trái làm keyframe trước `in` bị bỏ qua khi render nhưng vẫn giữ trong data.

### 1.5 Split (Ctrl+B / nút ✂)

Điều kiện: playhead nằm trong item (không trùng mép). Nếu không có item được chọn → split tất cả item trên mọi track mà playhead đang cắt qua (hành vi mặc định của CapCut khi không chọn gì). Nếu có item được chọn → chỉ split các item đó.
Kết quả: item A `[in, out]` thành A1 `[in, in + (t − start)·speed]` và A2 `[in + (t − start)·speed, out]`, `A2.start = t`. Không đổi tổng độ dài.
Mọi thuộc tính (transform, filter, volume, speed) copy sang cả 2. Keyframe: mỗi nửa giữ keyframe nằm trong khoảng của nó; CapCut thêm keyframe nội suy tại điểm cắt để animation không nhảy.
Transition tại mép ngoài giữ nguyên; animation In ở A1, animation Out ở A2.
Audio liên kết split theo.
Sau split: A2 được chọn (selection chuyển sang nửa phải).
Nếu playhead đúng mép item → không làm gì, không báo lỗi.

### 1.6 Q và W (trim theo playhead)

`Q` = "Delete left": với item đang chọn, xóa phần từ `start` đến playhead. Tương đương split rồi xóa nửa trái. Trên main track: item còn lại dồn về vị trí cũ của item bị xóa (tức là phần sau trượt lên, timeline ngắn lại). Playhead đứng yên về thời gian tuyệt đối, nên sau Q playhead nằm ở mép trái của phần còn lại.
`W` = "Delete right": xóa từ playhead đến `end`. Item sau dồn lên. Playhead đứng yên = mép phải của phần còn lại.
Không chọn gì: CapCut áp cho item trên main track mà playhead đang cắt qua.
Playhead ngoài item → không làm gì.
Luồng cắt talking-head điển hình: play → nghe → Space dừng → `←` vài frame → `Q` hoặc `W` → tiếp. Vì vậy Q/W phải chạy < 50 ms và không làm playhead nhảy.

### 1.7 Delete và khoảng trống

| Thao tác | Main track | Overlay / audio track |
|---|---|---|
| `Delete` / `Backspace` | Xóa item, item sau dồn lên (ripple delete) | Xóa item, để lại khoảng trống |
| Click vào khoảng trống | Không có | Khoảng trống được chọn (highlight xám); `Delete` → "Delete gap": item sau dồn lên |
| Chuột phải khoảng trống | Không có | Menu: Delete gap |
| Xóa item có transition | Transition 2 bên bị xóa | Như trên |
| Xóa item đang có audio link | Audio xóa theo | Chỉ xóa cái được chọn |
| Xóa track | Chuột phải header track → Delete track: xóa cả track và item | Main track không xóa được, chỉ xóa hết item |

### 1.8 Copy / Cut / Paste / Duplicate

`Ctrl+C` copy selection (kể cả nhiều item, giữ khoảng cách tương đối).
`Ctrl+V` paste tại playhead, trên cùng loại track: item main track paste vào main track (chèn, đẩy sau); item overlay paste vào track gốc tại t = playhead, nếu trùng thì tạo track mới.
`Ctrl+D` duplicate: bản sao đặt ngay sau item gốc trên cùng track (main track: chèn ngay sau; overlay: đặt tại `end` của gốc, trùng thì lên track mới).
`Ctrl+X` = copy + delete (ripple trên main).
Copy thuộc tính riêng: chuột phải item → "Copy" rồi chuột phải item khác → "Paste attributes" (chọn: transform, filter, adjust, speed, animation, volume). Dùng nhiều để đồng bộ style.

### 1.9 Liên kết audio / tách audio

Video có tiếng khi thả vào timeline: hiển thị 1 item có waveform ở phần dưới item (không tách thành 2 track).
Chuột phải → Extract audio: tạo item audio mới trên audio track, cùng `in/out/start`, trỏ cùng asset; item video giữ nguyên nhưng volume = 0 (mute), hoặc bật "Separate audio" thì item video tắt tiếng hẳn.
Sau extract, 2 item độc lập: move/trim riêng.
Nút "Mute track" (icon loa ở header track): tắt tiếng cả track, không đổi volume từng item.

### 1.10 Zoom, cuộn, hiển thị

`Ctrl + lăn chuột` zoom timeline quanh vị trí chuột (không phải quanh playhead). Slider zoom góc phải dưới. `Shift + lăn` cuộn ngang. Lăn thường = cuộn dọc nếu nhiều track.
Phím `Ctrl+=` / `Ctrl+-` zoom; nút "Fit" zoom cho vừa toàn dự án.
Mức zoom nhỏ nhất: thấy toàn dự án; lớn nhất: 1 frame ≈ 20 px.
Thước thời gian (ruler) phía trên: nhãn đổi theo zoom (1 s / 500 ms / 100 ms / frame). Click lên ruler → nhảy playhead. Kéo trên ruler → scrub.
Item video hiển thị filmstrip thumbnail (1 ảnh mỗi N px, lấy từ proxy), audio hiển thị waveform; text hiển thị nội dung chữ; tất cả có tên asset ở góc trái.
Khi play, timeline tự cuộn để playhead luôn trong tầm nhìn (page-flip khi playhead tới 90 % bề rộng, không scroll mượt).
Header track bên trái có: icon mắt (ẩn/hiện track), loa (mute), khóa (lock: không chọn/kéo được), và cho phép kéo đổi thứ tự track.
Nút "Link/Unlink to main track" trên header: bật thì overlay dồn theo khi main track ripple (hành vi "Main track magnet" có thể bật/tắt trong toolbar timeline).

### 1.11 Marker và beat

`M` thêm marker tại playhead (hình cờ trên ruler). Click marker → chọn, kéo → dời, `Delete` → xóa, double-click → đổi tên/màu.
Audio item: nút "Beats" trong inspector → "Auto generate" (chấm vàng trên waveform) hoặc "Add beat" tay tại playhead. Item ở track khác snap vào các chấm này.

### 1.12 Luật snap (áp cho move và trim)

Điểm hút: `t=0`, playhead, mép trái/phải của mọi item trên mọi track, marker, beat marker, cuối dự án.
Ngưỡng: 8 px màn hình → đổi sang thời gian theo zoom hiện tại.
Khi hút: vẽ vạch dọc màu vàng/xanh xuyên hết chiều cao timeline tại điểm hút.
Ưu tiên khi nhiều điểm trong ngưỡng: playhead > mép item cùng track > mép item track khác > marker.
Alt giữ tạm thời tắt snap; toggle vĩnh viễn ở icon nam châm trên toolbar timeline.

## 2. Playhead và Player

### 2.1 Playhead

Đầu playhead là tam giác trên ruler, thân là vạch 1 px xuyên hết timeline. Kéo đầu → scrub, preview cập nhật frame liên tục (≤ 33 ms/frame, dùng proxy).
Click bất kỳ chỗ nào trên ruler hoặc vùng trống của track → playhead nhảy tới đó. Click lên item không dời playhead (chỉ chọn item).
`←` / `→` lùi/tới 1 frame; `Shift+←/→` 10 frame (một số bản là 1 s). `Home`/`End` về đầu/cuối dự án. `↑`/`↓` nhảy tới mép item trước/sau trên mọi track (edit point).
Playhead không đi quá cuối dự án; tới cuối thì play tự dừng và playhead đứng ở frame cuối.
Timecode ở player: hiển thị `vị trí hiện tại / tổng`, dạng `00:00:12:15` (giờ:phút:giây:frame). Click vào timecode cho nhập số để nhảy.
Khi split/Q/W, playhead không đổi thời gian tuyệt đối (xem 1.6).

### 2.2 Play / Pause

`Space` toggle. `K` pause, `J`/`L` tua ngược/xuôi (tốc độ tăng mỗi lần bấm 1×→2×→4×, ít dùng, P2).
Khi play: âm thanh là đồng hồ chuẩn (`AudioContext.currentTime`), video decode bám theo; cho phép drop frame nếu chậm, không được lệch tiếng.
Play từ giữa một item có speed ≠ 1 hoặc có keyframe → phải tính đúng trạng thái tại t, không bắt đầu từ keyframe đầu.
Nút loop (icon ∞) lặp đoạn: nếu có vùng in/out trên ruler (`I`/`O` đặt) thì lặp vùng đó.
Play khi đang kéo item: CapCut không cho (kéo thả làm pause).

### 2.3 Player preview

| Thành phần | Hành vi |
|---|---|
| Canvas | Vẽ đúng frame tại playhead, tỉ lệ khung dự án; vùng ngoài khung (letterbox) là nền xám đậm, không vẽ gì |
| Tỉ lệ khung (Ratio) | Nút dưới player: 9:16, 16:9, 1:1, 4:5, 4:3, 3:4, 21:9, Original. Đổi tỉ lệ = đổi `project.width/height`; mọi item giữ scale và position tương đối (position lưu theo % khung, không theo px) |
| Fit / Fill khi thêm media | Media vào khung mặc định ở chế độ Fit (thấy trọn, có viền nếu khác tỉ lệ), căn giữa, scale = 100 % tương đối khung fit. Nút "Fill" (hoặc double-click) phóng lên phủ khung |
| Zoom canvas | Dropdown % hoặc Ctrl+lăn trên canvas: chỉ zoom cách nhìn, không đổi dự án |
| Fullscreen | Icon góc, `Esc` thoát |
| Chất lượng preview | Dropdown: Full / 1/2 / 1/4: đổi độ phân giải decode, không ảnh hưởng export |
| Safe zone | Toggle lưới + vùng an toàn TikTok (tránh nút like/caption app) |

### 2.4 Handle trên canvas (direct manipulation)

Chọn item video/ảnh/text/sticker → canvas vẽ bounding box: 4 góc (scale giữ tỉ lệ), 4 mép (scale một chiều, chỉ với ảnh/video khi tắt lock ratio), 1 tay xoay dưới đáy (icon ↻), kéo bên trong để di chuyển.
Kéo góc + giữ Shift → scale không giữ tỉ lệ (ngược mặc định). Kéo xoay + giữ Shift → bước 15°.
Snap trên canvas: tâm khung (vạch hồng dọc/ngang), mép khung, tâm item khác; ngưỡng 5 px.
Thay đổi trên canvas cập nhật Inspector ngay (2 chiều). Khi item có keyframe và playhead không trùng keyframe → thay đổi tự tạo keyframe mới tại playhead (hành vi "auto keyframe" của CapCut sau khi đã có ≥ 1 keyframe trên thuộc tính đó).
Double-click text trên canvas → vào chế độ sửa chữ tại chỗ.
Click vùng trống canvas → bỏ chọn.
Chỉ item đang hiện tại playhead mới có handle; item ngoài thời điểm không chọn được từ canvas.

## 3. Inspector

Inspector chỉ hiện thuộc tính của loại item đang chọn; chọn nhiều item cùng loại thì sửa áp cho tất cả. Mỗi control: slider + ô nhập số, double-click nhãn hoặc nút ↺ để reset về mặc định. Kéo slider liên tục = một bước undo (gom khi mouseup). Mỗi tab có nút "Apply to all" (áp cho mọi item cùng loại trên track) và "Reset".

### 3.1 Tab Video → Basic

| Thuộc tính | Mặc định | Khoảng | Ghi chú hành vi |
|---|---|---|---|
| Scale | 100 % | 1–1000 % | Uniform. Scale quanh tâm item (không phải tâm khung) |
| Position X / Y | 0, 0 | ± khung | Đơn vị px của khung dự án; (0,0) = tâm khung; Y dương là xuống |
| Rotation | 0° | −∞..∞ | Quay quanh tâm item; CapCut cho nhập quá 360 (để keyframe quay nhiều vòng) |
| Flip | — | Horizontal / Vertical | Toggle, không keyframe được |
| Opacity | 100 % | 0–100 | Keyframe được |
| Blend | Normal | Normal, Screen, Multiply, Overlay, Lighten, Darken, Soft light, Hard light, Color burn, Color dodge | P2 |
| Volume | 0 dB | −∞ (mute) .. +12 dB | Keyframe được; hiện trên tab Audio |
| Fade in / out | 0 s | 0..duration/2 | Kéo tay nắm tam giác ở 2 đầu waveform trên timeline cũng được |

Khi không chọn gì, tab này đổi thành Canvas: Ratio, Background (Color / Blur 4 mức / Image). Blur dùng chính frame video đang vẽ, phóng Fill rồi gaussian blur; áp cho mọi item trên main track (thuộc tính dự án), nhưng cũng có thể đặt riêng per item ở tab Video → Background.

### 3.2 Keyframe (cơ chế chung cho mọi thuộc tính có ◇)

Cạnh mỗi thuộc tính keyframe được có icon ◇ rỗng. Bấm → đặt keyframe tại playhead với giá trị hiện tại, icon thành ◆ đặc, trên item ở timeline hiện chấm nhỏ tại vị trí đó.
Khi item đã có ≥ 1 keyframe trên thuộc tính X: mọi thay đổi X ở thời điểm không có keyframe tự tạo keyframe mới (không cần bấm ◇ lại). Đây là hành vi quan trọng nhất, người dùng CapCut quen với nó.
Playhead trùng keyframe → icon ◆; bấm ◆ → xóa keyframe đó. Có nút ‹ › nhảy tới keyframe trước/sau.
Keyframe trên timeline kéo được (dời thời gian), chọn được (click), xóa bằng Delete.
Nội suy mặc định: linear. Chuột phải keyframe → chọn easing: Linear, Ease in, Ease out, Ease in-out, hoặc mở Graph (bezier 2 điểm điều khiển) P2.
Trước keyframe đầu: giữ giá trị keyframe đầu. Sau keyframe cuối: giữ giá trị keyframe cuối (clamp, không extrapolate).
Thời gian keyframe lưu tương đối với đầu item (offset), nên move item thì keyframe đi theo; trim mép trái thì offset giữ nguyên theo nguồn (xem 1.4).
Copy item → copy keyframe. "Paste attributes" cũng mang keyframe.
Mỗi thuộc tính một đường keyframe riêng (position X và Y là 2 kênh nhưng UI gộp 1 nút ◇ "Position").
Khi speed ≠ 1: keyframe tính theo thời gian timeline của item, không theo thời gian nguồn (đổi speed thì animation vẫn khớp đầu/cuối item).

### 3.3 Tab Speed

| Chế độ | Hành vi |
|---|---|
| Normal | Slider 0.1×–100×, nhập số. Đổi speed → `duration = (out−in)/speed`, item co/giãn từ mép trái, item sau trên main track dồn/đẩy theo. Checkbox "Pitch" giữ cao độ giọng (time-stretch) mặc định bật. Checkbox "Smooth slow-mo" nội suy frame (optical flow) P2 |
| Curve | Preset: Custom, Montage, Hero, Bullet, Jump cut, Flash in, Flash out. Đồ thị tốc độ theo thời gian, kéo điểm; tổng duration tính bằng tích phân. P2 |
| Reverse | Toggle; cần transcode nguồn; audio cũng đảo. P2 |
| Freeze | Nút "Freeze" ở toolbar timeline: split tại playhead, chèn ảnh tĩnh 3 s (frame hiện tại) vào giữa, đẩy phần sau. P2 |

### 3.4 Crop

Nút Crop trên toolbar timeline → mở modal: ảnh nguồn + khung cắt kéo được, chọn tỉ lệ (Free, 9:16, 1:1...) và góc xoay nhỏ (±45°).
Crop lưu theo % của nguồn (`left, top, right, bottom` trong 0–1), độc lập với transform. Sau crop, item vẫn Fit vào khung, transform áp lên ảnh đã crop.
Reset crop → về full frame.

### 3.5 Mask (P2, ghi để biết hành vi)

Chọn hình: None, Linear, Mirror, Circle, Rectangle, Heart, Star. Trên canvas hiện handle riêng của mask (kéo vị trí, scale, xoay, feather bằng tay nắm ↕, bo góc với rectangle).
Invert toggle. Mask keyframe được (position, scale, rotation, feather).
Mask tính trong không gian item (đi theo transform của item).

### 3.6 Animation (tab riêng)

3 nhóm: In, Out, Combo (loop). Click preset → áp ngay, slider duration (0.1 s → min(2 s, duration/2)); In và Out có thể cùng lúc nhưng tổng không vượt duration.
Trên item ở timeline hiện vạch nhỏ màu ở đầu/cuối đánh dấu vùng animation.
Animation chồng lên transform/keyframe của người dùng (nhân thêm), không ghi đè.
Chọn "None" để gỡ. Các preset cần có cho talking-head: Fade in/out, Zoom in/out, Slide (4 hướng), Pop, Shake, Spin, Blur.

### 3.7 Tab Adjust / Filter

Filter: lưới preset, click áp, slider Intensity 0–100 (= trộn giữa ảnh gốc và ảnh qua LUT). Chỉ 1 filter per item. "Apply to all" rất hay dùng.
Adjust: nhóm slider (Temperature, Tint, Saturation, Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Brilliance, Sharpen, Vignette, Grain), mỗi cái −50..+50, keyframe được. Nút Auto adjust. Thứ tự áp: Adjust → Filter → Opacity/Blend.
Adjustment layer: Tab Adjustment → "Add to track": tạo item trong suốt trên overlay; mọi item bên dưới nó về z-order và trùng thời gian đều bị áp.

### 3.8 Tab Audio (item audio hoặc video có tiếng)

Volume (dB, keyframe), Fade in/out, Speed (giữ pitch), Noise reduction toggle, Normalize loudness (−14 LUFS cho TikTok), Voice enhance, Voice changer (list preset), Beats (auto/tay).
Mute item: icon loa gạch chéo ngay trên item; khác với volume −∞ ở chỗ bật lại là về volume cũ.

## 4. Text và Caption

### 4.1 Thêm text thủ công

Tab Text → "Default text" bấm + (hoặc kéo vào timeline). Item text 3 s được tạo trên text track tại playhead, nội dung "Default text", căn giữa khung, size 50 % chiều ngang khung.
Inspector mở tab Text với ô nhập chữ được focus sẵn; gõ là canvas đổi ngay.
Text hiện trên canvas có bounding box và handle như 2.4; chiều rộng box co theo nội dung (auto-width), xuống dòng bằng Enter; có thể kéo mép để đặt max-width → wrap tự động.
Item text trên timeline hiện nội dung chữ, kéo dài tùy ý (không giới hạn nguồn).

### 4.2 Thuộc tính text (tab Text → Basic)

| Nhóm | Control | Hành vi |
|---|---|---|
| Font | Dropdown có preview, tìm kiếm, nhóm Favorite / Imported | Cho phép upload .ttf/.otf; thiếu glyph tiếng Việt thì fallback font hệ thống (phải test "Ẩ Ễ Ộ Ở") |
| Size | Slider 1–100 (đơn vị tương đối khung, không phải pt) | Scale ở Transform nhân thêm lên trên |
| Style | B / I / U, All caps |  |
| Color | Picker + pipette lấy màu từ canvas + 20 preset |  |
| Alignment | Trái / giữa / phải / justify; dọc: trên / giữa / dưới | Áp trong box |
| Spacing | Letter spacing −10..+10, line spacing 0.5–3 |  |
| Stroke | Toggle, màu, độ dày 0–100 | Vẽ trước fill (stroke nằm ngoài), không ăn vào thân chữ |
| Background | Toggle, màu, opacity, bo góc 0–100, padding ngang/dọc | Một box cho cả đoạn hoặc per-line (toggle "Line by line") |
| Shadow | Toggle, màu, opacity, blur, khoảng cách, góc |  |
| Glow | Toggle, màu, cường độ, bán kính | P2 |
| Preset style | Lưới preset (chữ trắng viền đen, chữ vàng nền đen...) | Click áp toàn bộ nhóm style; có "Save preset" |

### 4.3 Animation text

Tab Animation: In / Out / Loop, slider duration như 3.6.
Preset cần có: Typewriter (hiện từng ký tự), Fade, Pop (scale 0→1.1→1), Slide up/down/left/right, Bounce, Zoom, Blur in, Wipe (reveal theo mask ngang), Shake (loop), Wave.
Typewriter: tốc độ tính theo duration/số ký tự; dấu tiếng Việt (tổ hợp) phải hiện cùng lúc với chữ gốc, không tách.

### 4.4 Text template

Tab Text → Text templates: lưới preview động. Click + → item template 3–5 s; chữ sửa được qua ô nhập ở inspector (1 ô per vùng chữ), không sửa animation.

### 4.5 Auto captions

Tab Captions → Auto captions: chọn ngôn ngữ (có Vietnamese), nguồn (Main track audio / Audio track / All), toggle "Mark filler words", bấm Generate.
Chạy nền có progress; xong tạo một caption track riêng (màu riêng, không trộn với text track) gồm nhiều item caption liên tiếp, mỗi item = 1 câu/cụm 3–8 từ, `start/end` theo audio.
Caption track đi theo main track: split/Q/W/xóa trên main track thì caption trong vùng đó bị cắt theo và dồn theo (link). Move item main track → caption không đi theo (CapCut giữ theo thời gian tuyệt đối). Đây là hành vi gây khó chịu; clone nên làm caption gắn theo item nguồn.
Chọn bất kỳ item caption → Inspector tab Captions có danh sách tất cả caption (thời gian + chữ), scroll được; click một dòng → playhead nhảy tới và chọn item đó; sửa chữ inline; Enter xuống dòng trong caption, nút "Split" tách tại con trỏ thành 2 item, "Merge" gộp với caption sau.
Style (font, màu, stroke, background, size, position) sửa ở một chỗ, áp cho toàn bộ caption track (không có per-item style mặc định; muốn khác thì phải "Convert to text").
Preset caption: lưới mẫu có highlight từ đang nói (karaoke: đổi màu, phóng to, hoặc nền trượt), hiển thị từng từ hay cả câu. Highlight cần word timestamp; khi người dùng sửa chữ, timestamp từ được chia đều lại theo số ký tự.
"Mark filler": từ đệm được gạch; nút "Delete all fillers" → cắt các khoảng tương ứng trên main track (ripple) và caption.
Nút "Export captions" → SRT/TXT. "Import captions" nhận SRT/LRC, tạo caption track từ file.
Delete 1 item caption → xóa item đó, không ripple (track caption không magnetic).

### 4.6 Text to speech

Chọn item text → tab Text-to-speech: chọn giọng (preview), bấm Start → tạo item audio trên audio track cùng `start` với text, duration theo audio sinh ra; text item tự kéo dài cho bằng audio (có hỏi). P2.

### 4.7 Sticker

Tab Stickers: lưới, tìm kiếm, thêm bằng + hoặc kéo. Item 3 s mặc định, có handle như text, hỗ trợ animation In/Out/Loop và keyframe transform. GIF/APNG loop theo duration item.

## 5. Transition, Effect, Overlay

### 5.1 Transition

Tab Transitions → kéo preset vào khe giữa 2 item trên main track (khe hiện highlight khi rê tới), hoặc chọn item rồi bấm + trên preset → gắn vào mép phải của item đó.
Chỉ main track có transition (overlay dùng animation In/Out thay thế).
Transition hiện là ô vuông nhỏ đè lên mép nối; click → chọn, Inspector hiện Duration (0.1–2 s, mặc định 0.5 s) và nút "Apply to all" (gắn cùng transition vào mọi khe trên main track).
Cách tính thời gian: transition không đổi độ dài timeline. Nó lấy thêm handle từ nguồn 2 bên: item trái render thêm `d/2` sau `out`, item phải render thêm `d/2` trước `in`. Nếu nguồn không đủ handle (clip cắt sát), CapCut vẫn cho nhưng tự rút duration transition về tối đa có thể.
Render: trong vùng `[t_join − d/2, t_join + d/2]`, vẽ cả 2 item với hàm blend theo preset (dissolve = crossfade alpha; slide = dịch vị trí; zoom = scale + fade; whip = motion blur ngang; blur = gaussian tăng rồi giảm).
Kéo 1 trong 2 item đi nơi khác → transition bị xóa. Trim mép làm transition ngắn hơn phần còn lại → transition tự co.
`Delete` khi đang chọn transition → xóa transition, item không đổi.

### 5.2 Video effect

Tab Effects → "Video effects" (áp lên clip) và "Body effects" (bám người, P2). Kéo vào timeline tạo item effect trên effect track (overlay cao nhất), duration mặc định 3 s, áp cho mọi thứ bên dưới trong khoảng đó. Hoặc chọn item rồi + → effect gắn thẳng vào item (xuất hiện trong inspector → Effects, có thể nhiều cái, kéo sắp thứ tự).
Mỗi effect có 1–4 tham số (Speed, Intensity, Size…) sửa ở inspector, keyframe được.
Bộ 10–15 shader đủ dùng cho talking-head: Zoom blur, Shake, Glitch, Flash, Film grain, Light leak, VHS, Pixelate, Mirror, Chromatic aberration.

### 5.3 Overlay / PiP

Video/ảnh thả lên overlay track = picture-in-picture. Mặc định Fit khung, người dùng scale/position bằng handle. Opacity, blend, mask, chroma key, remove background đều ở inspector item đó.
Thứ tự track = z-order; kéo header track để đổi.

## 6. Bảng phím tắt (CapCut desktop mặc định)

| Phím | Hành động | Ưu tiên |
|---|---|---|
| Space | Play / Pause | P0 |
| ← / → | Lùi / tới 1 frame | P0 |
| Shift + ← / → | Lùi / tới 10 frame | P1 |
| Home / End | Đầu / cuối dự án | P1 |
| ↑ / ↓ | Nhảy tới edit point trước / sau | P1 |
| Ctrl + B | Split tại playhead | P0 |
| Q | Xóa phần trái playhead (item chọn) | P0 |
| W | Xóa phần phải playhead | P0 |
| Delete / Backspace | Xóa item (ripple trên main) | P0 |
| Ctrl + Z / Ctrl + Shift + Z (hoặc Ctrl + Y) | Undo / Redo | P0 |
| Ctrl + C / X / V | Copy / Cut / Paste tại playhead | P0 |
| Ctrl + D | Duplicate | P0 |
| Ctrl + A | Chọn tất cả | P1 |
| Ctrl + G / Ctrl + Shift + G | Group / Ungroup | P2 |
| M | Thêm marker tại playhead | P1 |
| I / O | Đặt in / out point trên ruler | P2 |
| Ctrl + Shift + M | Mute item | P1 |
| Ctrl + Shift + L | Link / unlink audio | P1 |
| Ctrl + Shift + F | Freeze frame | P2 |
| Ctrl + = / Ctrl + − | Zoom timeline in / out | P0 |
| Shift + Z | Zoom fit toàn dự án | P1 |
| Ctrl + lăn chuột | Zoom timeline quanh chuột | P0 |
| Shift + lăn chuột | Cuộn ngang | P0 |
| Alt (giữ khi kéo) | Tắt snap tạm | P1 |
| Shift (giữ khi kéo item) | Khóa trục ngang | P1 |
| Shift (giữ khi scale trên canvas) | Bỏ giữ tỉ lệ | P1 |
| Shift (giữ khi xoay) | Bước 15° | P1 |
| Ctrl + T | Thêm text mặc định tại playhead | P1 |
| Ctrl + E | Mở Export | P0 |
| Ctrl + S | Lưu dự án | P0 |
| Ctrl + I | Import media | P1 |
| F | Fullscreen preview | P1 |
| Esc | Thoát fullscreen / hủy drag | P0 |
| Enter (khi chọn text) | Vào sửa chữ | P1 |

Phím tắt chỉ hoạt động khi focus không ở ô nhập liệu. Phải có bảng Settings → Shortcuts cho người dùng xem và đổi (P1).

## 7. Export

Nút Export góc phải trên (hoặc Ctrl+E) → modal: Tên file, Thư mục, tab Video (toggle) với Resolution (480p / 720p / 1080p / 2K / 4K), Bitrate (Lower / Recommended / Higher / Custom Mbps), Codec (H.264 / HEVC), Format (MP4 / MOV), Frame rate (24 / 25 / 30 / 50 / 60); tab Audio (MP3 / WAV, chỉ xuất tiếng); tab GIF; checkbox Export captions (SRT/TXT kèm theo).
Hiện ước tính dung lượng và thời lượng. Vùng export mặc định = cả dự án; nếu có in/out point trên ruler thì chỉ export vùng đó.
Bấm Export → progress bar có % và thời gian còn lại, nút Cancel (hủy thì xóa file dở). Xong → màn hình hoàn tất với nút "Open folder", "Share to TikTok/YouTube".
Export dùng đúng `renderFrame` của preview ở độ phân giải đích, decode từ file gốc (không proxy); audio mix từ mọi item có tiếng với volume/fade/keyframe/speed, rồi encode AAC 192 kbps (320 nếu Higher).
Export không chặn UI nhưng chặn sửa dự án (modal). Clone nên cho export chạy ở worker để vẫn preview được.
Sai lệch cho phép giữa preview và export: cùng frame, cùng vị trí text (≤ 1 px ở 1080p), cùng màu (ΔE < 2).

## 8. Checklist nghiệm thu (dán vào prompt cho AI, mỗi dòng là một test)

Mỗi test là một unit test trên command hoặc một test Playwright. AI chỉ được báo "xong" khi tất cả P0 pass.

**Timeline / main track (P0)**

- [ ] Thả 3 clip (5 s, 3 s, 4 s) vào main track → `start` lần lượt 0, 5, 8; tổng dự án 12 s; không có gap.
- [ ] Xóa clip giữa → clip 3 có `start = 5`; tổng 9 s.
- [ ] Kéo clip 1 đè quá nửa clip 2 → thứ tự thành 2, 1, 3; `start` = 0, 3, 8.
- [ ] Split clip 5 s tại t = 2 s → 2 item `[0,2]` và `[2,5]`, `in/out` nguồn đúng; item phải được chọn; playhead vẫn ở 2 s.
- [ ] Split khi playhead đúng mép → không tạo item mới, không lỗi.
- [ ] Q tại t = 2 s trên clip `[0,5]` → còn `[0,3]` với `in = 2`, clip sau dồn lên 3 s; playhead ở 0 (mép trái phần còn lại).
- [ ] W tại t = 2 s → còn `[0,2]`, playhead ở 2.
- [ ] Trim mép phải clip 5 s thêm 10 s khi nguồn chỉ dài 8 s → `out = 8`, dừng, không ném lỗi.
- [ ] Trim mép trái clip main track sang phải 1 s → `in += 1`, `start` không đổi, duration −1 s, item sau dồn lên 1 s. Cùng thao tác trên overlay → `in += 1`, `start += 1`, mép phải đứng yên.
- [ ] Paste tại playhead giữa clip → clip bị split và item paste nằm giữa.
- [ ] 50 lần split liên tiếp ở các vị trí ngẫu nhiên → tổng duration bằng ban đầu, không lệch 1 µs.
- [ ] Undo sau mỗi command trên trả về project bằng (deep-equal) project trước.

**Overlay (P0)**

- [ ] Thả item lên overlay tại t = 3 s → `start = 3`, có gap trước, main track không đổi.
- [ ] Thả item thứ 2 trùng thời gian → tạo track mới phía trên, không đè.
- [ ] Xóa item overlay → gap, item sau không dồn.
- [ ] Click gap + Delete → item sau dồn lên.

**Snap (P0)**

- [ ] Kéo item overlay tới cách playhead 6 px (ở zoom hiện tại) → hút đúng vào playhead; tới cách 10 px → không hút.
- [ ] Giữ Alt → không hút ở 6 px.

**Playhead / Player (P0)**

- [ ] `→` 30 lần ở 30 fps → playhead đúng 1.000 s.
- [ ] Play 10 s → lệch tiếng-hình đo được < 40 ms.
- [ ] Scrub nhanh qua 60 s → frame cuối hiển thị đúng với frame tại playhead (không stale).
- [ ] Đổi tỉ lệ 9:16 → 16:9 → item vẫn ở tâm, scale tương đối không đổi.

**Canvas handle (P0)**

- [ ] Kéo góc item → scale giữ tỉ lệ; inspector hiện số mới trong cùng frame.
- [ ] Nhập Position X trong inspector → canvas dời ngay.
- [ ] Có keyframe Scale ở t = 0 và t = 2; kéo scale tại t = 1 → tạo keyframe thứ 3 tại t = 1.

**Keyframe (P0)**

- [ ] Keyframe opacity 100 → 0 trong 1 s linear → tại 0.5 s opacity = 50.
- [ ] Trước keyframe đầu và sau keyframe cuối → giá trị clamp.
- [ ] Move item 2 s → keyframe render dịch 2 s theo.
- [ ] Split item có keyframe → mỗi nửa có keyframe nội suy tại điểm cắt; render không nhảy.

**Text / Caption (P0)**

- [ ] Thêm text → item 3 s tại playhead, nội dung mặc định, ô nhập focus.
- [ ] Render "Ẩn Ễ Ộ Ở Ữ — Lãi suất 7,5%" với stroke 10 → không cắt dấu, stroke ngoài thân chữ.
- [ ] Auto caption 60 s → 1 caption track, ≥ 10 item, không chồng thời gian, mỗi item ≤ 8 từ.
- [ ] Đổi màu caption ở inspector → mọi item caption đổi.
- [ ] Split main track trong vùng caption → caption bị cắt tại cùng t.

**Transition (P1)**

- [ ] Gắn dissolve 0.5 s giữa 2 clip → tổng duration không đổi; frame tại điểm nối là trộn 50/50.
- [ ] Kéo clip phải lên overlay → transition biến mất.

**Export (P0)**

- [ ] Export 30 s 1080p30 → file MP4 H.264 + AAC, duration 30.0 ± 0.05 s.
- [ ] Frame export ở 5 s, 15 s, 25 s so với `renderFrame` cùng t → sai khác pixel trung bình < 2/255.
- [ ] Cancel giữa chừng → không để lại file.

**Hiệu năng (P0)**

- [ ] Dự án 50 item, 5 track: mỗi command (split/Q/W/move) < 50 ms; render timeline < 16 ms khi scroll.
- [ ] Scrub với proxy: ≤ 100 ms từ lúc dừng chuột tới frame đúng.

## Ghi chú cho AI khi đọc tài liệu này

Chỗ nào tài liệu viết "CapCut làm X nhưng clone nên làm Y" (caption link theo item, auto-duck, export ở worker) thì làm Y.
CapCut đổi UI thường xuyên; tên menu lệch không quan trọng, hành vi là thứ phải giữ.
Mọi con số (ngưỡng snap 8 px, text 3 s, ảnh 5 s, transition 0.5 s) để trong `src/config/defaults.ts`, không hard-code rải rác.

## 9. Bổ sung: Compound clip và Mask

### 9.1 Compound clip (CapCut gọi là "Create compound clip" / "Group" ở một số bản)

| Khía cạnh | Hành vi thực tế trong CapCut |
|---|---|
| Tạo | Chọn ≥ 2 item (bất kỳ track nào, kể cả text/audio/effect) → chuột phải → **Create compound clip** (`Alt+G`). Item được chọn biến mất khỏi timeline, thay bằng **1 item** nằm trên track của item thấp nhất (thường là main track), có icon lồng nhau ở góc |
| Vị trí / độ dài | `start` = start nhỏ nhất của nhóm, `end` = end lớn nhất. Khoảng trống bên trong nhóm được giữ nguyên (render trong suốt ở chỗ trống). Nếu đặt trên main track thì ripple như clip thường |
| Bản chất | Là **nested timeline**: một `Project` con (có tracks, items, keyframe riêng) được bọc thành 1 asset ảo. Compound clip có đầy đủ inspector của video: transform, opacity, speed, animation, filter, mask, keyframe — tất cả áp lên **kết quả render** của timeline con |
| Mở sửa bên trong | Double-click hoặc chuột phải → **Edit compound clip**: timeline chuyển sang timeline con, có breadcrumb (`Project > Compound 1`) để quay ra. Sửa xong bấm breadcrumb/nút Back; thay đổi phản ánh ngay ra ngoài. Nếu timeline con dài ra/ngắn đi thì item ngoài đổi độ dài theo (main track ripple) |
| Split / trim | Split được như clip thường: 2 nửa trỏ cùng timeline con, khác `in/out`. Trim mép không kéo quá độ dài timeline con (giống asset có duration cố định) |
| Speed | Áp speed lên compound = time-remap cả timeline con, audio bên trong cũng theo |
| Tách | Chuột phải → **Ungroup / Break compound**: trả các item về timeline gốc tại vị trí tương ứng, giữ nguyên keyframe nội bộ; thuộc tính đã đặt lên compound (transform, filter…) **bị mất** (CapCut không bake xuống từng item) |
| Copy / duplicate | Mỗi bản copy là **tham chiếu độc lập** (sửa bên trong bản A không đổi bản B). Không có "shared instance" như Premiere |
| Lồng nhau | Compound trong compound được, không giới hạn thực tế nhưng preview chậm theo tầng |
| Caption | Caption nằm trong vùng đó cũng bị gom vào compound nếu được chọn; nếu không chọn thì ở ngoài và không còn link với main track |

Lưu ý khi build: model nên là `CompoundAsset { kind: 'compound', timeline: Project }`, item trỏ tới nó như trỏ asset video; `renderFrame` gọi đệ quy `renderFrame(childProject, t_local)` vào một render target rồi áp transform/effect của item ngoài. Undo phải bao gồm cả thay đổi trong timeline con (store là một cây, không tách store riêng).

### 9.2 Mask trên element (video, ảnh, text, sticker, compound)

| Khía cạnh | Hành vi thực tế |
|---|---|
| Nơi bật | Inspector → tab **Video** (hoặc Text/Sticker) → mục **Mask**. Lưới hình: None, Linear, Mirror, Circle, Rectangle, Heart, Star (một số bản thêm Love, Text mask). Click hình → áp ngay, canvas chuyển sang chế độ chỉnh mask |
| Handle trên canvas | Khác hẳn handle transform: tâm mask (chấm, kéo để dời), đường viền hình (kéo để scale; Rectangle/Circle có 2 chiều rộng/cao riêng, giữ Shift để đều), tay xoay (vòng cung), tay **feather** (mũi tên ↕ kéo ra ngoài = mềm mép), Rectangle có thêm tay **bo góc** (chấm ở góc). Linear chỉ có 1 đường + hướng; Mirror là dải 2 đường song song |
| Tham số trong inspector | Position X/Y, Size (W/H), Rotation, Feather (0–100), Round corner (Rectangle), **Invert** toggle (lật trong/ngoài), nút Reset |
| Hệ quy chiếu | Mask lưu trong **không gian item** (toạ độ chuẩn hoá theo bề mặt item sau crop, trước transform). Nên xoay/scale/dời item thì mask đi theo; đổi tỉ lệ khung dự án mask vẫn bám đúng vùng ảnh |
| Keyframe | Mọi tham số mask keyframe được (icon ◇ riêng). Cách dùng phổ biến: reveal — Linear mask kéo từ ngoài vào, hoặc Circle từ size 0 lên full |
| Nhiều mask | CapCut desktop chỉ **1 mask per item**. Muốn ghép hình phức tạp: duplicate item chồng lên nhau, mỗi bản một mask; hoặc gom vào compound rồi mask compound |
| Tương tác với các thứ khác | Mask áp sau crop, sau filter/adjust, trước blend/opacity → kết quả: pixel ngoài mask alpha = 0. Animation In/Out, transition vẫn chạy bình thường trên ảnh đã mask. Chroma key và Remove background cũng là "mask tự động", cộng dồn với mask hình |
| Text mask | Text item cũng có mask: hay dùng Linear + keyframe để làm chữ hiện dần theo hướng |
| Hiển thị trên timeline | Không có dấu hiệu riêng trên item (khác keyframe có chấm). Chỉ biết khi chọn item |

Lưu ý khi build: mỗi hình là một hàm `alpha(u, v) ∈ [0,1]` với feather = khoảng mượt quanh biên (SDF + smoothstep là cách dễ nhất, chạy trong shader). Invert = `1 − alpha`. Lưu `mask: { shape, cx, cy, w, h, rotation, feather, radius, invert }` theo đơn vị 0–1 của item; keyframe dùng chung cơ chế ở mục 3.2 của spec.
