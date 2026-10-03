# SPEC: CapCut Web Editor Clone

> Tài liệu này được tổng hợp bằng cách quét trực tiếp **CapCut Web Editor** (capcut.com/editor) ngày 03/10/2026, ở viewport **1431×949 CSS px** (DPR 1), theme Dark.
> Ảnh chụp nằm trong `screenshots/`. Ảnh được chụp ở kích thước **1351×896**, tức đã thu nhỏ còn 0.944 lần so với CSS px. Mọi số đo trong file này là **CSS px**, trừ khi có ghi chú khác.
> Ký hiệu: ✅ = đã kiểm chứng trực tiếp · ⚠️ = suy luận, chưa test.

---

## 0. Mục tiêu

Xây một web app chỉnh sửa video (NLE) mà **bố cục, thao tác và cảm giác** giống CapCut Web: import media → kéo vào timeline nhiều track → trim / split / move / snap → thêm text → chỉnh transform/opacity/màu/speed/âm lượng → keyframe → preview realtime → export MP4.

Các tính năng AI (auto captions, remove background, TTS, retouch…) và thư viện online (templates, stock, music) **ngoài phạm vi MVP**. Chỉ dựng UI placeholder cho chúng.

---

## 1. Tech stack đề xuất

| Lớp | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | |
| State | Zustand + immer | 1 store `project`, 1 store `ui` (selection, panel đang mở, zoom…) |
| Undo/Redo | Lưu snapshot của `project` (immer patches) | Mỗi thao tác commit **1 bước** (kéo xong mới commit, không commit từng pixel) |
| Preview | `<canvas>` 2D (MVP) → WebGL/PixiJS (khi cần blend/filter) | CapCut thật dùng engine C++→WASM (`vesdk-lvapi`) vẽ lên canvas, không dùng thẻ `<video>` hiển thị ✅ |
| Decode | Thẻ `<video>` ẩn cho từng media (MVP), seek theo `currentTime` | Giai đoạn 2: WebCodecs `VideoDecoder` + `mp4box.js` để chính xác tới từng frame |
| Timeline | DOM (div absolute) | CapCut vẽ timeline bằng canvas ✅, nhưng DOM dễ làm drag/trim/snap hơn. Chỉ cần đúng giao diện |
| Thumbnails | Lấy frame bằng `<video>` + `canvas.toBlob`, cache theo bước thời gian | |
| Waveform | Web Audio `decodeAudioData` → peaks | |
| Export | WebCodecs `VideoEncoder` + `AudioEncoder` + `mp4-muxer` | Fallback: `ffmpeg.wasm` |
| Icons | lucide-react | Icon của CapCut là bộ riêng; dùng icon tương đương |
| Font UI | `"CapCut Sans Text", "Helvetica Neue", Helvetica, Arial, sans-serif` ✅ → thay bằng **Inter** | |

> Nếu dùng `SharedArrayBuffer` (ffmpeg.wasm đa luồng) thì cần header COOP/COEP. CapCut bật `crossOriginIsolated = true` ✅.

---

## 2. Design tokens (Dark theme)

Lấy bằng `getComputedStyle` ✅, hoặc lấy mẫu pixel từ ảnh PNG lossless ✅.

```css
:root {
  /* nền */
  --bg-app:          #0E0E11;   /* body, sidebar trái, panel thư viện */
  --bg-canvas-area:  #1C1D21;   /* vùng preview giữa */
  --bg-glass:        rgba(18,18,20,0.8); /* header, toolbar timeline, tab bar phải (có backdrop blur) */
  --bg-timeline:     #121214;
  --bg-track:        #27282C;   /* dải track trống trên timeline */
  --bg-elevated:     #1C1D21;   /* item sidebar đang active */
  --bg-input:        rgba(229,236,255,0.10); /* input số, card thumbnail */
  --bg-button:       #242529;   /* nút "Add heading" */
  --bg-popup:        #373739;   /* dropdown/menu (lv-color-bg-5) */
  --bg-panel:        #17171A;   /* panel thuộc tính nổi (≈ lv-color-fill-bg-1) */

  /* chữ */
  --text-primary:    #FAFBFF;   /* rgb(250,251,255) */
  --text-secondary:  rgba(237,240,253,0.5); /* label, "View all", tab chưa active, tổng thời lượng */
  --text-disabled:   rgba(222,227,247,0.2);

  /* viền */
  --border-subtle:   rgba(255,255,255,0.12); /* viền trên của timeline */

  /* accent */
  --accent-cyan:     #59C5DD;   /* viền clip đang chọn, bbox trên canvas, keyframe active, nút Done/Apply */
  --clip-text:       #D97D3E;   /* clip text + caption trên timeline (cam) */
  --clip-audio:      #4CA987;   /* clip audio (xanh ngọc), waveform #60BA9F, vạch beat cam */
  --clip-sticker:    #CC5D88;   /* clip sticker (hồng) */
  --clip-effect:     #6C54DE;   /* clip effect (tím xanh), icon ✨ */
  --clip-filter:     #9B58DF;   /* clip filter (tím), icon ◎◎ */
  --clip-template:   #F5F5F5;   /* clip template trong track chính (trắng), nhãn "Template" nền cyan */
  --clip-video-sel:  #59C5DD;
  --export-gradient: linear-gradient(60deg, #4A7EE3, #1BC9E3, #1AC9C0);
  --badge-pro:       #8B5CF6;   /* icon kim cương tím = tính năng Pro */
  --badge-free:      #6D5DF6;   /* nhãn "Free" nền tím nhạt */
  --danger-badge:    #FF3B4A;   /* chấm đỏ "New" */

  /* bo góc */
  --r-sm: 6px; --r-md: 8px; --r-lg: 12px;

  /* typography */
  --fs-xs: 12px; --fs-sm: 13px; --fs-md: 14px; --fs-lg: 16px; --fs-xl: 20px;
}
```

| Thành phần | Font size / weight | Màu |
|---|---|---|
| Nhãn icon sidebar ("Media", "Text"…) | 12 / 500 | primary |
| Tab panel thư viện ("Text templates") | 16 / 800 | active = primary, inactive = secondary |
| Tiêu đề section ("Trending") | 14 / 800 | primary |
| "View all" | 14 / 400 | secondary |
| Tiêu đề panel thuộc tính ("Basic") | 16 / 700 | primary |
| Tiêu đề block ("Transform") | 14 / 600 | primary |
| Label thuộc tính ("Scale") | 12–13 / 400 | secondary |
| Input số | 14 / 400, cao 32, r 8 | |
| Timecode | 13 / 700 (hiện tại) + 13 / 500 secondary (tổng) | |
| Nút Export | 12 / 700, 90×32, r 8, gradient | trắng |

---

## 3. Bố cục (viewport 1431×949)

```
┌──────┬───────────────┬────────────────────────────────────────────────────────┐
│ Side │ Library panel │ Header (h56)  [☁ tên project ▾] [▶Select][✋Hand][100%▾][↶][↷] ... [Export][⋯] │
│ bar  │ (w≈327)       ├────────────────────────────────────────────────┬───────┤
│ w71  │               │ [Ratio]                                        │ Prop  │
│      │  tabs         │            CANVAS PREVIEW                      │ panel │
│ icon │  search       │            (bg #1C1D21)                        │ (nổi) │
│ 52px │  sections     │                                     ┌─────────┐│ tab   │
│      │  grid cards   │                                     │Panel 265││ bar   │
│      │               │                                     └─────────┘│ 56w   │
│      │              ◀├────────────────────────────────────────────────┴───────┤
│      │  (thu gọn)    │ Timeline toolbar (h48)                                 │
│      │               ├────────────────────────────────────────────────────────┤
│ [⌨]  │               │ Timeline (h≈181): ruler + tracks                       │
└──────┴───────────────┴────────────────────────────────────────────────────────┘
```

| Vùng | x | y | w × h | Ghi chú |
|---|---|---|---|---|
| Sidebar trái | 0 | 0 | 71 × 949 | logo CapCut ở trên cùng; menu bắt đầu ở y≈65; nút ⌨ (shortcuts) ở đáy |
| Item sidebar | 8 | — | 52–58 × 58, r 12 | icon 20px + label 12/500; active có bg `#1C1D21` |
| Library panel | 71 | 0 | ≈327 × 949 | có nút ◀ ở mép phải (giữa chiều cao) để thu gọn panel (⌘/) |
| Header | 398 | 0 | 1033 × 56 | bg glass |
| Canvas area | 398 | 56 | 1033 × 663 | `canvas-space` |
| Nút Ratio | ~410 | ~64 | ≈52 × 52, r 8 | góc trên trái canvas |
| Tab bar thuộc tính | 1367 | 64 | 56 × 388, r 12 | dính mép phải, nổi trên canvas |
| Panel thuộc tính | ≈1096 | 64 | ≈265 × (auto, tối đa ≈ 650), r 12 | nằm bên trái tab bar, có nút ✕; body cuộn được (padding 0 10 0 16) |
| Bottom (toolbar + timeline) | 398 | 719 | 1033 × 232 | bg glass |
| Timeline toolbar | 398 | 719 | 1033 × 48 | trái: công cụ clip · giữa: ▶ + timecode · phải: zoom… |
| Timeline | 398 | 767 | 1033 × 181 | border-top 1px `--border-subtle` |
| Cột track header | 398 | — | ≈110 | mỗi track video chính có: icon loa (mute), nút "Add cover" 48×48 r 6 |
| Ruler | ≈510 (gốc 00:00) | ≈772 | h 18 | nhãn `00:00`, `00:02`… + vạch nhỏ |
| Track text/sticker | — | — | cao ≈28 | |
| Track video chính | — | — | cao ≈50 | |
| Khoảng cách giữa các track | | | ≈6–8 | |

Ghi chú:
- Khi **không chọn gì**, panel thuộc tính và tab bar bên phải **ẩn** ✅ (`03_nothing-selected.jpg`).
- Khi chọn object, panel thuộc tính **không tự mở**; chỉ tab bar hiện ra. Bấm tab nào thì panel đó mở ra. Bấm lại tab đang mở hoặc bấm ✕ để đóng ✅.
- Popup onboarding màu vàng (`#F5D04C`-ish, chữ đen, nút OK đen) hiện ở lần đầu dùng một số tính năng ✅. Có thể bỏ qua.

---

## 4. Header

Từ trái sang phải ✅ (`01_overview_text-selected.jpg`, `44_menu_project-name.jpg`, `43_menu_canvas-zoom.jpg`, `46_menu_top-right-more.jpg`):

1. Icon ☁ = trạng thái lưu. Hover hiện "08:19:30 Saved in … space. Your project is saved automatically while being edited." → **autosave**.
2. **Tên project** (mặc định `YYYYMMDDhhmm`, ví dụ `202610030817`), sửa trực tiếp được. Nút ▾ mở menu: Rename / Move to / Duplicate to.
3. **Select tool** (V) và **Hand tool** (H) dạng toggle. Hand = kéo để pan canvas.
4. **Zoom canvas** `100% ▾`: popover gồm slider "Size" + ô %, Zoom to fit (⇧F), Zoom to 50% (⇧0), Zoom to 100% (⇧1), Zoom to 200% (⇧2).
5. **Undo / Redo** (⌘Z / ⇧⌘Z). Nút bị disable khi stack rỗng.
6. (Phần account/credits/upgrade, bỏ qua.)
7. **Export** (gradient), xem §11.
8. Icon "Switch sidebar" (đổi bố cục sidebar).
9. **⋯**: Feature usage ›, Task bar ›, Sidebar ›, Help Center, Language ›, Theme ›, Input preferences ›.

---

## 5. Sidebar trái + Library panel

Thứ tự item ✅: **Media, Templates, Elements, Audio, Text, Captions, Transcript, Effects, Transitions, Filters, Brand kit, Plugins**. Đáy sidebar có nút ⌨ mở modal Shortcuts.

Chung cho panel thư viện:
- Header có tab con (ví dụ Text: "Text templates | Text effects"; Audio: "Music | Sound effects"; Effects: "Video effects | Body effects"). Tab active có gạch dưới màu cyan, rộng ≈ 24px, nằm giữa.
- Ô search (bo r 8, bg input) + nút filter.
- Hàng chip gợi ý cuộn ngang ("blur", "Countdown 🔥", "zoom lens"…).
- Các **section**: tiêu đề + "View all" bên phải. Bên dưới là hàng card **cuộn ngang**, có nút › tròn ở mép phải.
- Card: bo r 8, bg `--bg-input`, thumbnail. Kim cương tím ở góc trên trái = Pro. Item video có badge thời lượng `00:07` ở góc dưới trái.
- **Thêm vào project**: kéo card thả vào timeline/canvas ✅, hoặc **click** card để thêm tại playhead ✅ (đã test với "Add heading").

| Panel | Nội dung chính | Ảnh |
|---|---|---|
| Media | Ô prompt AI "What do you want to create?" (bỏ qua); tab Uploads / Generated; lưới card: nút **Upload** (icon cloud), media đã upload (thumbnail, badge thời lượng, nhãn "Added" khi đã dùng), thư mục | `10_left_media.jpg` |
| Templates | Search + filter, "For You", Editor's Picks, New Year, Logo reveal, Intro… | `11_left_templates.jpg` |
| Elements | Search, chip; Stock videos, Photos, AI avatars, Stickers | `12_left_elements.jpg` |
| Audio | Tab Music / Sound effects; search; chip; Categories (card ảnh nền + chữ); Recommended (list: thumbnail 56, tên, `00:31 · tác giả`) | `13_left_audio.jpg` |
| Text | **Basic**: nút lớn "Add heading" (20/700), "Add body text"; chip All / Commercial; các section template | `14`, `15` |
| Captions | 4 card lớn: Auto captions, Manual captions, Upload caption file (.srt .ass .lrc), Auto lyrics | `16_left_captions.jpg` |
| Transcript | Language select, Track select, nút Transcribe | `17_left_transcript.jpg` |
| Effects | Video effects / Body effects | `18_left_effects.jpg` |
| Transitions | Tip: "Drag and drop a transition between two clips on the timeline." | `19_left_transitions.jpg` |
| Filters | Featured, Hits, Life, Landscape, Portrait, Mono, Movies… | `20_left_filters.jpg` |
| Brand kit / Plugins | (bỏ qua) | `21`, `22` |

---

## 6. Canvas preview

### 6.1 Hiển thị
- Khung project (ví dụ 9:16) nằm giữa vùng canvas, **fit** theo chiều cao, mỗi phía chừa ≈ 20px.
- Phần nội dung tràn ra ngoài khung vẫn có bbox, nhưng chỉ phần trong khung được render ✅ (`79_keyframe_auto-added-on-value-change.jpg`: scale 150% thì bbox cyan vượt ra ngoài khung).
- Khi **đang play**: ẩn bbox và toolbar nổi; các input trong panel bị disable và hiển thị giá trị nội suy ✅ (`82_playback-state.jpg`).
- Text chỉ được render khi playhead nằm trong khoảng thời gian của clip text ✅.

### 6.2 Chọn và biến đổi (Select tool)
- Click object → bbox **cyan 1px**. 4 handle tròn ở góc (trắng, Ø≈10, viền xám); text có thêm handle cạnh trái/phải dạng thanh dọc. Handle **xoay** (icon ⟳ tròn Ø≈20) nằm dưới cạnh đáy, cách ≈ 24px ✅.
- Kéo bên trong bbox = move. Kéo góc = scale đều. Kéo handle xoay = rotate.
- Phím mũi tên: dịch 1px; giữ ⇧: 10px ✅ (theo bảng shortcuts).
- Click ra vùng trống = bỏ chọn ✅.
- Double-click text = sửa text trực tiếp ⚠️ (popup onboarding che mất, chưa xác nhận rõ). Ô textarea trong panel Basic luôn sửa được ✅.
- ⚠️ Snap guides (đường căn giữa, căn mép) khi kéo: chưa chụp được nhưng nên làm.

### 6.3 Toolbar nổi phía trên bbox
Pill tối, r 8, mỗi icon ≈ 30px:

| Object | Nút |
|---|---|
| Video/ảnh ✅ | Add overlay · Fill · Crop · Overlay ▾ · ⋯ |
| Text ✅ | Duplicate · ⋯ |

Menu ⋯ (video) ✅ `41_menu_canvas-more-options.jpg`: Copy ⌘C · Cut ⌘X · Paste ⌘V · Duplicate ⌘D · Delete ⌫ ─ Replace ─ Crop · Flip › · Overlay › · Add overlay.
Menu ⋯ (text): Copy · Cut · Paste · Duplicate · Delete.

### 6.4 Ratio ✅ (`42_menu_ratio.jpg`)
Dropdown: **Original aspect ratio** ✓ ─ 16:9 (YouTube ads) · 4:3 (LinkedIn ads, Facebook…) · 2:1 ─ 9:16 (TikTok, TikTok ads…) · 1:1 (Instagram posts) · 3:4. Mỗi dòng có icon khung theo đúng tỉ lệ.

### 6.5 Crop modal ✅ (`80_crop-modal.jpg`, `81_…`)
Modal ≈ 760×570, r 12.
- Bên trái: **Aspect ratio** (Custom / Original / 9:16 / 1:1 / 3:4 / 16:9 / 4:3 / 2:1); **Mode** (Manual crop | Auto reframe 💎); **Advanced settings → Rotate** (slider + ô số °).
- Bên phải: preview có khung crop nét đứt cyan, handle ở góc và giữa cạnh, dấu + ở tâm; thanh play mini `00:03 | 00:07`.
- Nút **Reset** và **Apply** (cyan).

---

## 7. Timeline

### 7.1 Toolbar timeline ✅
**Trái** (khi chọn clip video):

| # | Tooltip | Phím | Ghi chú |
|---|---|---|---|
| 1 | Split | ⌘B | Chỉ bật khi playhead nằm trong clip đang chọn |
| 2 | Delete | ⌫ | |
| 3 | Reverse | | |
| 4 | Crop | | mở Crop modal |
| 5 | Flip horizontal | | |
| 6 | Freeze | | tạo freeze frame tại playhead; disable khi playhead ở mép clip |
| 7 | Transcript-based editing | | |
| 8 | Create from reference | | |
| 9 | Download ▾ | | |

Khi chọn **text**, thanh này chỉ còn: Split · Delete · Download ▾ ✅.

**Giữa**: nút ▶ tròn trắng (Ø≈24, icon đen) và timecode `00:06:06 | 02:04:06`.
**Định dạng timecode = `MM:SS:FF`** (FF = frame, 30fps) ✅. Ví dụ: video dài 2 phút 4 giây 6 frame hiển thị `02:04:06`.

**Phải**: Attach/Magnet (N, toggle; bật thì icon có nền cyan, tooltip "Turn off Attach") · Preview axis (S) · Zoom out ⊖ (⌘−) · slider zoom · Zoom in ⊕ (⌘+) · Full screen preview (⇧⌘F) · 1 icon cuối (⚠️ chưa rõ chức năng, có thể là đổi layout preview).

### 7.2 Ruler và zoom ✅
- Nhãn ruler có định dạng `MM:SS`. Bước nhãn tự đổi theo mức zoom. Đo được:

| Mức zoom | px/giây (CSS) | Bước nhãn |
|---|---|---|
| Mặc định (fit project 2 phút) | ≈2.3 | 02:00 |
| +3 bước | ≈23 | 00:10 |
| +5 bước | ≈100 | 00:02 |
| +6 bước | ≈210 | 00:01 |

  → mỗi bước zoom ≈ **×2**. Giữa 2 nhãn có các vạch nhỏ.
- Click/kéo trên ruler → playhead nhảy tới đó ✅ (seek).
- Playhead: đường dọc trắng 1px, xuyên ruler và tracks. Đầu là tay cầm màu trắng bo tròn (≈12×16).
- Có thanh cuộn ngang ở đáy timeline. Scroll = cuộn dọc, ⇧+Scroll = cuộn ngang.

### 7.3 Tracks và clip
- **Track video chính** ở dưới cùng (cao ≈50). Track **text/sticker/overlay** nằm phía trên (text cao ≈28).
- Text mới thêm → tạo **track mới phía trên**, clip bắt đầu tại playhead, **dài mặc định 3s** ✅.
- Clip video: dải **thumbnail** lặp theo chiều ngang. Góc trên trái có nhãn `0926.mp4  02:04:06` (tên + thời lượng, chữ trắng 11px trên nền mờ).
- Clip text: nền **cam `#D97D3E`**, r ≈4, có icon **T** + nội dung text (khi zoom nhỏ chỉ còn một vạch cam).
- Dải track trống: `#27282C`, kéo dài hết chiều rộng.

### 7.4 Tương tác clip ✅
| Thao tác | Kết quả |
|---|---|
| Click clip | Chọn clip: viền **2px cyan**, ở 2 đầu có tay cầm trim (thanh trắng dọc nhỏ). Playhead **không** di chuyển |
| ⌘+Click | Chọn nhiều clip |
| Hover mép trái/phải | Con trỏ đổi thành `col-resize` / trim |
| Kéo mép | **Trim** (đổi in/out). Text kéo dài bao nhiêu cũng được; video không vượt quá độ dài nguồn |
| Kéo thân clip | **Move** theo thời gian, giữ trên cùng track (thả lên vùng trống phía trên không tạo track mới) ✅ |
| Split (⌘B) | Cắt clip tại playhead thành 2 clip; phần **bên trái** được chọn sau khi cắt ✅ |
| Hover mối nối giữa 2 clip liền nhau | Hiện nút **transition** nhỏ (ô trắng bo góc, icon ⋈) ✅. Click để thêm transition |
| Chuột phải clip | Context menu (§7.5) |
| Delete | Xóa clip. Track chính tự dồn clip (ripple) ⚠️ |
| Attach/Magnet bật | Hút vào mép clip khác / playhead / 0 ⚠️ |
| Keyframe | Hình thoi ◆ nhỏ màu trắng, vẽ trên clip tại đúng thời điểm keyframe ✅ |

### 7.5 Context menu clip video ✅ (`40_menu_clip-rightclick.jpg`)
Split ⌘B · Copy ⌘C · Cut ⌘X · Paste ⌘V · Duplicate ⌘D · Delete ⌫ ─ Replace ─ Download clip › · Transcript-based editing · Separate audio ⇧⌘S · Split scene · Freeze.
Style menu: bg `#2B2B30`, r 8, item cao 34, padding 12, shortcut căn phải màu secondary, dùng divider để tách nhóm.

---

## 8. Panel thuộc tính: VIDEO

Tab bar dọc (icon 20 + label 11): **Basic · Background · Smart tools · Audio · Animation · Speed** ✅.

### 8.1 Basic ✅ (`51`, `58`)
| Block | Control | Range / mặc định |
|---|---|---|
| Mask | Hàng "None ›" → mở sub-panel Mask | |
| Color adjustment | "Basic, HSL, Curves ›" → sub-panel | |
| Blend ↺ | Mode (select) | Normal, Overlay, Screen, Darken, Brighten, Hard light, Multiply, Soft light, Linear burn, Color burn, Color dodge ✅ |
| | Opacity: slider + `100 %` + ◇ | 0–100 |
| Stabilize 💎 | toggle | |
| Reduce image noise (Free) | toggle | |
| Remove flicker (Free) | toggle | |
| Transform ↺ | Scale: slider + `100 %` + ◇ | ⚠️ 1–1000; slider đặt 100 ở khoảng 20% chiều dài |
| | Position: `X` `Y` (2 ô số) + ◇ | px theo hệ tọa độ project, gốc ở tâm |
| | Rotate: `0°` + nút xoay tròn + ◇ | −360..360 |

### 8.2 Mask sub-panel ✅ (`52`, `53`)
- Header "‹ Mask" (nút back) ✕.
- Lưới 4 cột: None, Horizontal, Mirror, Circle, Rectangle, Heart, Stars.
- Khi chọn mask: block **Adjust ↺**: Feather (slider + số), Size W×H (có nút khóa tỉ lệ 🔗), Position X/Y, Rotation, đều có ◇ keyframe. Có checkbox **Invert**, nút **Done**.
- Trên canvas: khung mask nét đứt cyan, có handle; phần ngoài mask màu đen; có nút mũi tên ở trên để chỉnh feather.

### 8.3 Color adjustment sub-panel ✅ (`54`–`56`)
Segmented: **Basic | HSL | Curves**
- Basic: AI color correction 💎 (toggle). **Color**: Saturation, Temperature, Hue. **Lightness**: Brightness, Contrast, Shine, Highlight, Shadow. **Effects**: Sharpness, Vignette, Fade, Grain. Mỗi dòng là slider (mặc định 0 ở giữa, −50..50 ⚠️) + ô số + ◇. Footer "Apply to all".
- HSL: 8 ô màu (đỏ, cam, vàng, xanh lá, cyan, xanh dương, tím, hồng). Hue/Saturation/Lightness cho màu đang chọn; track slider tô gradient.
- Curves: preset (Custom, Lighten, Darken, Fade, Contrast, Cool tone, Warm tone, Vintage). Editor RGB curves 4 kênh (trắng/R/G/B), lưới 4×4, đường chéo có 2 điểm; click để thêm điểm.

### 8.4 Background ✅ (`59`–`61`)
Segmented icon 3 tab: **Color** (Background color + Recents + Brand Color + bảng Recommended 7×3) · **Blur** (None + 4 mức blur) · **Format/Image** (lưới pattern). Footer "Apply to all". Áp dụng khi video không phủ hết khung project.

### 8.5 Smart tools ✅ (`62`)
List card (icon 32, tiêu đề 14/600, mô tả 12 secondary, ›): Auto reframe 💎, Retouch, Remove background 💎, Camera tracking (Free), Relight 🖥, AI movement 🖥, Optical flow 🖥. → **MVP: chỉ dựng UI.**

### 8.6 Audio ✅ (`63`, `64`)
Segmented **Basic | Voice changer**.
- Basic: **Volume** ↺ slider + `0 dB` + ◇ (⚠️ −60..+20 dB). **Fade in and out** ↺: Fade-in duration (s), Fade-out duration (s). Noise reduction 💎 toggle.
- Voice changer: list None, Autotune, Valley, 3D Surround, Teenager, Energetic, Sweet, Elf, Deep, High…

### 8.7 Animation ✅ (`65`–`67`)
Segmented **In | Out | Combo** (text dùng **In | Out | Loop**). Lưới 3 cột thumbnail 68×68 r 8 + tên. Ô đang chọn có viền cyan.
- Khi chọn 1 animation: preview tự **play đoạn đầu clip** ✅. Đáy panel hiện **"In and out motion duration"** gồm ô `0.5s` + slider ✅.
- Một số preset: In = Purple Tunnel, Old Radio, Fairy Fog, Memory Drag, Paper Tear, Calcify In, Hot Rise-In, Corner Gel, Slow Fade-In, Slide Down, Slide Up… Out = Negative N…, Grid Out, Voxel Pattern, Slide Down/Up/Right/Left… → MVP: làm ~8 preset cơ bản (Fade, Slide ×4, Zoom in/out, Rotate).

### 8.8 Speed ✅ (`68`, `69`)
Segmented **Normal | Curve**.
- Normal: **Speed** slider (dải log, có vạch, ⚠️ 0.1x–100x) + ô `1 x`. **Duration** `124.2s` ←→ `124.2s` (sửa duration thì speed tự tính lại). **Pitch** toggle. Smooth slow-mo 💎.
- Curve: preset None, Custom, Montage, Hero, Bullet, Jump Cut, Flash In, Flash Out (icon là đồ thị đường cong).

---

## 9. Panel thuộc tính: TEXT

Tab bar: **Presets · Basic · Text to speech · AI avatars · Animation · Motion tracking** ✅.

### 9.1 Presets ✅ (`30`)
Lưới 3×5 các ô "Text" với style khác nhau (nền đen chữ trắng, nền trắng chữ đen, viền, nền tím, nền vàng, chữ xanh, neon…). Ô đầu tiên ⊘ = none.

### 9.2 Basic ✅ (`31`–`37`)
| Block | Control |
|---|---|
| (không tiêu đề) | Textarea nội dung (cao ≈72, bg input, r 8) |
| Font | Select font ("Default"; nhóm "CapCut preset"; cuối list có toggle "Commercial use") + nút **AI fonts** (cyan) |
| Format | Size select `20 ▾` (list số 15,16,…), **B** (bật mặc định cho heading), *I*, U̲, Align, Case (Aa), Line spacing |
| Style ↺ | Fill ■ (ô màu) · Stroke ▢ ⋯ · Background ▢ ⋯ · Shadow ▢ ⋯. Ô gạch chéo = tắt. ⋯ mở popover (Stroke: **Size** slider + `40` + ◇) |
| Glow | toggle |
| Opacity ↺ | slider + % + ◇ |
| Transform ↺ | Scale %, Position X/Y, Rotate (giống video) |
| Footer | ☐ Apply to all · icon lưu preset |

### 9.3 Color picker ✅ (`36`, `37`)
Popover ≈ 250 rộng: header "● Fill ◇"; **Recents** (gồm ô none, eyedropper, ô cầu vồng = custom, các màu gần đây); **Recommended** bảng 7×3:
```
#FFFFFF #F4B6B6 #F6B6D2 #FCE3B6 #C6F2B6 #B6C8F7 #D9C2F7
#8A8A8A #E05A57 #E8609B #F0A93B #5CC93D #5B8DEF #A06AF0
#1E1E22 #B23A35 #A33463 #9C6B1F #2F8A2A #2A4FAF #6A3BB8
```
Bấm ô cầu vồng → custom picker: "‹ Fill", ô SV vuông, thanh Hue, nút eyedropper, `Hex ▾ #ffffff`.

### 9.4 Text to speech / Animation / Motion tracking ✅ (`38`, `39`, `39b`)
- TTS: Category select ("Trending"), Voices (Apply to all), Commercial use toggle, ☐ Sync speech and text. → MVP: chỉ UI.
- Animation: In | Out | **Loop**, lưới preset, ☐ Apply to all.
- Motion tracking: "Select an object on the screen and click Start…", nút ↺ + Start; trên canvas hiện khung chọn **màu cam**. → MVP: chỉ UI.

---

## 10. Keyframe ✅ (`78`, `79`, `79a`)

Đây là cơ chế cốt lõi, cần làm đúng:
1. Mỗi thuộc tính animatable (opacity, scale, position, rotate, volume, color params, mask params…) có nút ◇ bên phải.
2. **Chưa có keyframe**: ◇ rỗng. Click → tạo keyframe tại playhead với giá trị hiện tại → ◆ **cyan đặc**. Tooltip đổi thành "Delete keyframe".
3. **Đã có ≥1 keyframe, playhead không đứng đúng keyframe**: control hiện thành `‹ ◇ ›`. Mũi tên trái/phải để nhảy tới keyframe trước/sau. Nếu **sửa giá trị** ở vị trí này thì **tự động tạo keyframe mới** ✅.
4. **Playhead đứng đúng keyframe**: ◆ cyan. Click để xóa keyframe đó.
5. Trên clip ở timeline (chỉ khi clip đang chọn) vẽ ◆ trắng nhỏ tại mỗi thời điểm có keyframe ✅.
6. Giữa các keyframe, giá trị được **nội suy tuyến tính** ⚠️ (CapCut có tùy chọn easing; MVP dùng linear). Trước keyframe đầu / sau keyframe cuối thì giữ nguyên giá trị.
7. Nút ↺ của block: reset giá trị và xóa keyframe của block đó ⚠️.

```ts
function valueAt(kfs: {t:number; v:number}[], t: number, base: number) {
  if (!kfs.length) return base;
  if (t <= kfs[0].t) return kfs[0].v;
  if (t >= kfs[kfs.length-1].t) return kfs[kfs.length-1].v;
  const i = kfs.findIndex(k => k.t > t);
  const a = kfs[i-1], b = kfs[i];
  return a.v + (b.v - a.v) * (t - a.t) / (b.t - a.t);
}
```
Thời gian `t` của keyframe tính **tương đối với đầu clip** (khi move clip thì keyframe đi theo).

---

## 11. Export ✅ (`45_export-panel.jpg`)
Panel thả xuống từ nút Export (≈365 rộng, r 12, bg `#2F3035`):
- Share for review › · Share as presentation › (card bg `#3A3A40`)
- Share on social: TikTok, TikTok Ads Manager, YouTube, YouTube Shorts, Facebook Page, Instagram Reels, Schedule
- **Download ›** + nút ⋯

Download → **Export settings**: Video cover (thumbnail), Name, **Resolution** (480p/720p/1080p/2K/4K ⚠️, mặc định 720p), **Quality** (Recommended quality / Higher / Customize ⚠️), **Frame rate** (24/25/30/50/60fps, mặc định 30), **Format** (MP4 / MOV ⚠️), nút **Export** cyan.
MVP: chỉ cần Download → settings → render bằng WebCodecs, có progress modal.

---

## 12. Phím tắt ✅ (`90`, `91`)

| Globe | | Timeline | | Canvas | |
|---|---|---|---|---|---|
| Select all | ⌘A | Split | ⌘B | Full screen | ⇧⌘F |
| Select multiple clips | ⌘+Click | Zoom in | ⌘+ | Move (Select tool) | V |
| Copy | ⌘C | Zoom out | ⌘− | Hand tool | H |
| Cut | ⌘X | Scroll up/down | Scroll | Zoom in | ⇧+ |
| Paste | ⌘V | Scroll left/right | ⇧Scroll | Zoom out | ⇧− |
| Delete | ⌫ | Last frame | ⌘← | Zoom to fit | ⇧F |
| Undo | ⌘Z | Next frame | ⌘→ | Zoom to 50% | ⇧0 |
| Redo | ⇧⌘Z | Preview axis on/off | S | Zoom to 100% | ⇧1 |
| Play/Pause | Space | Attach | N | Zoom to 200% | ⇧2 |
| Text wrap | ⌘Enter | Separate/restore audio | ⇧⌘S | Move 1px | ↑↓←→ |
| Split sentence | Enter | Add/remove beats | M | Move 10px | ⇧+↑↓←→ |
| Expand/collapse material panel | ⌘/ | | | | |
| Show/hide timeline | ⌘. | | | | |
| Import | ⌘I | | | | |
| Export | ⌘E | | | | |
| Save | ⌘S | | | | |
| Exit | Esc | | | | |

Trên Windows thì ⌘ → Ctrl. Khi focus đang ở input/textarea thì không bắt phím tắt.

---

## 13. Data model

```ts
type ID = string;
type Sec = number; // giây, float

interface Project {
  id: ID; name: string;
  width: number; height: number;   // ví dụ 1080x1920
  ratio: 'original'|'16:9'|'4:3'|'2:1'|'9:16'|'1:1'|'3:4';
  fps: 30;
  background: { type: 'color'|'blur'|'image'; value: string|number };
  assets: Record<ID, Asset>;
  tracks: Track[];                  // index 0 = trên cùng; track 'main' luôn ở cuối
}

interface Asset { id: ID; kind: 'video'|'image'|'audio'; name: string;
  url: string; duration: Sec; width?: number; height?: number;
  thumbs?: string[]; peaks?: Float32Array; }

interface Track { id: ID; kind: 'main'|'video'|'text'|'audio'|'effect';
  muted?: boolean; hidden?: boolean; locked?: boolean; clips: Clip[]; }

type Animatable = number;
interface Keyframes { [prop: string]: { t: Sec; v: number }[] } // t tương đối với đầu clip

interface ClipBase {
  id: ID; trackId: ID;
  start: Sec;          // vị trí trên timeline
  duration: Sec;       // độ dài trên timeline (đã tính speed)
  transform: { x: number; y: number; scale: number; rotation: number }; // scale %
  opacity: number;     // 0..100
  blend: 'normal'|'overlay'|'screen'|'darken'|'lighten'|'hard-light'|'multiply'|'soft-light'|'linear-burn'|'color-burn'|'color-dodge';
  animIn?:  { preset: string; duration: Sec };
  animOut?: { preset: string; duration: Sec };
  keyframes: Keyframes;
}

interface MediaClip extends ClipBase { type: 'video'|'image'|'audio';
  assetId: ID; in: Sec; out: Sec;   // đoạn cắt trong nguồn
  speed: number; reverse: boolean; flipH: boolean; flipV: boolean;
  volume: number;  /* dB */ fadeIn: Sec; fadeOut: Sec;
  crop?: { x: number; y: number; w: number; h: number; rotate: number }; // 0..1
  mask?: { shape: 'none'|'horizontal'|'mirror'|'circle'|'rect'|'heart'|'stars';
           feather: number; w: number; h: number; x: number; y: number; rotation: number; invert: boolean };
  color: { saturation:number; temperature:number; hue:number; brightness:number; contrast:number;
           shine:number; highlight:number; shadow:number; sharpness:number; vignette:number; fade:number; grain:number };
}

interface TextClip extends ClipBase { type: 'text';
  text: string; font: string; size: number; bold: boolean; italic: boolean; underline: boolean;
  align: 'left'|'center'|'right'; case: 'none'|'upper'|'lower'|'title'; lineSpacing: number;
  fill: string; stroke?: { color: string; size: number };
  background?: { color: string; opacity: number; radius: number };
  shadow?: { color: string; blur: number; distance: number; angle: number };
  glow: boolean; preset?: string;
}
type Clip = MediaClip | TextClip;
```

Quy tắc:
- `duration = (out - in) / speed` với media clip.
- Track `main`: các clip **xếp liền nhau, không có khoảng trống** (magnetic) ⚠️. Các track khác cho phép có khoảng trống, nhưng clip không được chồng lên nhau.
- Kéo một clip vào vị trí đang có clip khác trên cùng track → tự đẩy sang track mới (hoặc từ chối) ⚠️.
- Thứ tự vẽ: track ở dưới vẽ trước, track ở trên đè lên.

---

## 14. Render loop (preview)

```
on rAF:
  t = playing ? audioClock.now() : playhead
  for track from bottom to top:
    clip = clip đang active tại t
    localT = t - clip.start
    props = resolve(clip, localT)         // base + keyframes + animIn/out
    if media: frame = seek(video, clip.in + localT*speed) → drawImage với transform, opacity, blend, crop, mask, color filter
    if text:  vẽ text (stroke → fill → shadow/glow), có background box
  vẽ overlay selection (bbox, handles) lên một canvas DOM riêng phía trên
```
- Audio: Web Audio graph, mỗi clip là một `MediaElementSource` → `GainNode` (dB→gain, fade) → destination. Dùng **audio làm master clock**.
- Seek khi đang dừng: debounce và chờ `seeked` event rồi mới vẽ.

---

## 15. Lộ trình build (chia nhỏ cho Claude Code)

1. **Shell UI**: layout §3 + tokens §2 + header + sidebar 12 mục + library panel (thu gọn được) + tab bar phải. Dùng dữ liệu giả cho các panel.
2. **Media import**: Upload (input file + kéo thả vào panel/canvas), sinh thumbnail và duration, hiện card trong Media.
3. **Timeline core**: ruler + zoom (×2 mỗi bước, ⌘+/⌘−, slider), playhead + seek, tracks, render clip (thumbnail strip, clip text màu cam), cuộn ngang/dọc.
4. **Clip ops**: chọn / chọn nhiều, move, trim, split, delete, duplicate, copy/paste, magnet snap, context menu, nút transition ở mối nối.
5. **Preview canvas**: render loop §14, play/pause, timecode `MM:SS:FF`, ratio, fit.
6. **Canvas transform**: bbox, handle, move/scale/rotate, toolbar nổi, phím mũi tên.
7. **Property panels**: Video (Basic/Audio/Speed/Animation/Background), Text (Basic/Presets/Animation), Color picker.
8. **Keyframes** §10.
9. **Undo/redo + autosave** (IndexedDB) + rename project.
10. **Crop modal, Mask, Color adjustment**.
11. **Export** WebCodecs + mp4-muxer + progress.
12. Panel placeholder: Templates, Elements, Effects, Transitions, Filters, Captions, Transcript, Smart tools, TTS.

**Acceptance cho từng bước**: đặt app cạnh ảnh trong `screenshots/` có cùng tên mục, so pixel-gần-đúng về vị trí, kích thước, màu.

---

## 16. Mục lục ảnh chụp

| File | Nội dung |
|---|---|
| 00_empty-project | Project trống: nút "Click to upload", vùng "Drag and drop media here" ở timeline |
| 01_overview_text-selected | Toàn cảnh khi đang chọn text |
| 02_onboarding-popup_switch-sidebar | Popup hướng dẫn màu vàng |
| 03_nothing-selected | Không chọn gì: panel phải ẩn |
| 10–22 | 12 panel thư viện bên trái |
| 30–39b | Panel thuộc tính Text, font/size dropdown, stroke popover, color picker |
| 40–46 | Các menu: chuột phải clip, ⋯ trên canvas, ratio, zoom canvas, tên project, export, ⋯ góc phải |
| 50–69 | Panel thuộc tính Video: Basic, Mask, Color (Basic/HSL/Curves), Blend, Background ×3, Smart tools, Audio ×2, Animation ×3, Speed ×2 |
| 70–72 | Timeline ở 3 mức zoom |
| 73–77a | Chọn clip, trim, move, split, nút transition ở mối nối |
| 78–79a | Keyframe: thêm, tự thêm khi sửa giá trị, marker trên clip |
| 80–81 | Crop modal |
| 82 | Trạng thái đang play |
| 90–91 | Bảng phím tắt |

---

## 17. Bổ sung (lượt quét 2): các loại clip, thư viện, menu và chế độ xem

### 17.1 Panel thuộc tính theo loại clip ✅
Tab bar bên phải đổi theo loại object đang chọn:

| Loại clip | Tab bar phải | Toolbar timeline (trái) | Màu clip | Ảnh |
|---|---|---|---|---|
| Video (track chính/overlay) | Basic · Background · Smart tools · Audio · Animation · Speed (overlay **không có** Background) | Split · Delete · Reverse · Crop · Flip · Freeze · Transcript · Create from reference · Download▾ | thumbnail strip | 50, 134, 176 |
| Video **đã tách audio** | Basic · Background · Smart tools · Animation · Speed (mất tab Audio) | như trên | | 220 |
| Ảnh (photo/freeze frame) | Basic · Background · Smart tools · Animation (Basic không có Stabilize/Remove flicker) | Split · Delete · Crop · Flip · Download▾ | thumbnail | 133, 223 |
| Audio | **Basic · Voice changer · Speed** | Split · Delete · Transcript-based editing · **Beats detection** · **Add beat (M)** · Download▾ | `#4CA987` + waveform | 111, 112 |
| Text / Caption | Presets · Basic · Text to speech · AI avatars · Animation · Motion tracking | Split · Delete · Download▾ | cam `#D97D3E` | 31, 163 |
| Sticker | **Animation · Basic · Motion tracking** (Basic chỉ có Transform) | Split · Delete · Download▾ | hồng `#CC5D88` | 130–132 |
| Effect | **Basic** (Adjustments: tham số riêng của từng effect, ví dụ Speed 33) | Split · Delete · Download▾ | tím xanh `#6C54DE`, icon ✨ | 141, 142 |
| Filter | **Basic** (Intensity 0–100, mặc định 100, có ◇) | Split · Delete · Download▾ | tím `#9B58DF`, icon ◎◎ | 145, 146 |
| Transition | **Basic**: Name (chỉ đọc) + **Duration** slider (mặc định 0.5s) + Apply to all | — | icon ⋈ tại mối nối | 151, 152 |
| Template | **Elements** (tab Video/Text/Audio + "Batch replace (0/1)") · Basic · Background · Animation · Speed | **"✎ Edit template"** + Split · Delete · Download▾ | trắng, nhãn "Template" | 171–175 |

### 17.2 Hành vi khi thêm item ✅
| Thêm | Kết quả |
|---|---|
| Media/video kéo vào timeline | vào track chính |
| **Click** ảnh stock | **chèn vào track chính** tại ranh giới clip gần nhất (ripple, đẩy các clip sau ra sau), dài **5s** |
| **Kéo** video stock lên vùng **phía trên** các track | tạo **track overlay mới** ở trên cùng, clip bắt đầu tại vị trí thả; track overlay có icon loa riêng ở header |
| Click nhạc → nút ⊕ "Add to timeline" | tạo **track audio bên dưới** track chính, bắt đầu tại 0 / playhead |
| Click sticker / effect / filter / text | tạo **track mới ở trên cùng**, clip bắt đầu tại playhead, dài **3s** |
| Kéo transition thả vào mối nối 2 clip | gắn transition, tự chọn transition đó |
| Captions → Manual captions | tạo track caption; mỗi lần "+ Add" thêm 1 dòng **3s** nối tiếp (00:05:08–00:08:08, 00:08:08–00:11:08…), playhead nhảy tới dòng mới |
| Click template | chèn template vào track chính (ripple) |
| Separate audio (⇧⌘S) | tạo track audio mới chứa audio của clip (icon ⤒ + tên file), thẳng hàng với clip |
| Freeze | hiện modal xử lý (logo CapCut + "Freezing…" + Cancel), sau đó **chèn clip ảnh 3s** tại playhead và tách clip gốc |

### 17.3 Thư viện ✅
- **Click lại icon sidebar đang active → thu gọn library panel** (canvas mở rộng; còn mũi tên › ở mép để mở lại) (`04`).
- Media item khi hover: icon ❝ (Create from reference) góc trên phải; 2 icon góc dưới phải (thêm vào timeline / **xem trước**) (`100`).
- Popover xem trước media: player nhỏ có thanh tua, ⏸, `00:02 | 02:04`, tên file, nút ⬇ download, nút ⊕ cyan (`101`).
- Icon ≡ cạnh tên space → popover "Uploads in progress will appear here" (`102`). Dropdown space để đổi workspace (`103`).
- Item nhạc khi hover: ▶ đè lên thumbnail, 🔖 bookmark, ⊕ cyan "Add to timeline" (`110`).
- "View all" → trang lưới full-panel có "‹ Categories" để quay lại; vào category → list bài hát (`120`, `121`).
- Nút Filter → popover "Commercial" chip + Reset/Done (`122`). Search → ô có ✕ để xóa, chip gợi ý, danh sách kết quả (`123`).
- Sound effects: thumbnail là icon ♫ trên nền xám (`119`).
- Effects/Transitions: hover card hiện 🔖 (`140`).

### 17.4 Captions editor ✅ (`160`–`166`)
- Hàng 4 nút icon trên cùng: Auto (Free) · Manual · Upload · Auto lyrics.
- "Captions" + link **Shortcuts** (popover: Split captions = Enter, Line break = ⇧Enter, Merge up = ⌫ ở đầu câu, Merge down = ⇧⌫ ở cuối câu).
- Mỗi dòng: `00:08:08 - 00:11:08` (secondary 12px) + text (sửa trực tiếp); dòng active có nền teal tối, hiện ▶ và 🗑 khi hover. Nút "+ Add" full-width.
- Đáy panel: ⬇ **Export captions** (SRT file / TXT file) · 文A **Translation** · **Find and replace** (Find có đếm `0/0` + ↑↓, Replace with, nút Replace / Replace all).
- Thuộc tính caption giống text, nhưng **"Apply to all" được tick sẵn**, font size mặc định 10.

### 17.5 Template edit mode ✅ (`173`)
Bấm "Edit template": sidebar chỉ còn bật Media/Elements/Audio; timeline làm mờ các clip khác, vùng thời gian của template được tô teal; toolbar thay bằng nút **"← Back"**.

### 17.6 Smart tools – các sub-panel ✅ (`210`–`213`)
- Retouch: tab icon (Face/…), Skin tone 💎 (swatches), Smooth, Smile lines, Dark circles, Whitening, White teeth, Clear (slider 0–100).
- Camera tracking: Target = Head / Body / Hands (card icon), nút **Track** cyan. Trên canvas hiện khung 4 góc cyan.
- Auto reframe: mở Crop modal ở mode Auto reframe, gồm Image stabilization (Normal…), Camera moving speed, nút Apply có badge Pro.
- Remove background: Auto removal 💎 (toggle), Chroma key 💎 (toggle).
- Tính năng chỉ có trên app desktop (Enhance voice, Relight…) → **modal nhỏ "Open in desktop app"** (`117`).

### 17.7 Audio ✅ (`112`–`118`)
- Basic: Volume dB ◇, Fade in/out (s), Noise reduction 💎, **Beats detection** (toggle), **Enhance voice ›**.
- Speed (audio): Speed `1 x`, Duration `31s → 31s`, Pitch.
- Context menu audio: Split, Copy, Cut, Paste, Duplicate, Delete ─ Download clip › ("Download selected clip (00:00–00:31)" / "Download all content from selected duration") · Transcript-based editing.
- Add beat (M): chấm tròn cyan nhỏ trên mép trên clip audio tại playhead; tooltip đổi thành "Remove beat M".

### 17.8 Menu và dropdown ✅
- Overlay ▾ trên toolbar canvas: 4 icon vị trí PiP; submenu Overlay: Bottom right / Bottom left / Top left / Top right (`177`, `178`).
- Flip ›: ⚠️ submenu không bật được bằng hover tự động; dự kiến có Flip horizontal / Flip vertical.
- Download ▾ (toolbar timeline): "Download selected clip (00:11–02:15)" / "Download all content from selected duration" (`179`).
- Chuột phải lên **vùng trống timeline** → menu chỉ có Paste (`193`). Chuột phải lên **canvas** → chọn object trên cùng tại điểm đó + menu giống ⋯ (`194`).
- Export ⋯ → Download GIF, Download captions › (`181`).
- Export settings dropdowns (`183`–`186`): **Resolution** 360p / 480p / 720p ("Recommended on TikTok Ads Manager") / 1080p ("Recommended on TikTok") (⚠️ có thể còn 2K/4K khi cuộn) · **Quality** High quality / Recommended quality / Fast exporting · **Frame rate** 24 / 25 / 30 / 50 / 60fps · **Format** MP4 / MOV. Khi mở panel Export, nút Export hiện spinner trong ≈1–2s để chuẩn bị.
- Top-right ⋯ (`195`–`199`): Feature usage › (popover có tab Pro | Commercial, liệt kê tính năng Pro đang dùng), Task bar › (tab Export | Sync, "No tasks in progress yet"), Sidebar › (Unfix sidebar ✓ / Fix sidebar), Theme › (**Light mode / Dark mode** ✓), Input preferences › (Left to right ✓ / Right to left).
- Add cover (click ô ✎ ở header track chính) (`200`): modal "Add cover", segmented From video | Upload, khung preview 9:16, filmstrip có playhead để chọn frame, nút New / Cancel / **Edit cover**.

### 17.9 Chế độ xem ✅
- **Hide timeline** (icon cuối toolbar, ⌘.) (`191`): timeline biến mất, chỉ còn toolbar ở đáy + **thanh progress mỏng cyan có tay nắm** để tua; canvas phóng to.
- **Zoom 200% + Hand tool** (`192`): canvas tràn ra dưới header/toolbar. Toolbar timeline là lớp **kính mờ** nên nội dung nhìn xuyên qua được. Hand (H) dùng để kéo pan.
- **Preview axis** (S) (`190`): bật thì icon sáng và có một đường dọc **tím** trên timeline đi theo chuột (skimming: rê chuột là preview frame đó, không di chuyển playhead).
- Modal xử lý chung (`222`): nền tối, card 245×212, logo CapCut, "Freezing…", nút Cancel.

### 17.10 Speed curve Custom ✅ (`221`)
Đồ thị trục Y dạng log 0.1x–1x–10x, 5 điểm điều khiển mặc định ở 1x, kéo điểm lên/xuống; "Duration: 124.2s → 124.2s"; nút ↺ reset và ＋ thêm điểm. Trên clip hiện badge "◎ Custom".

### 17.11 Ảnh bổ sung
| File | Nội dung |
|---|---|
| 04 | Library panel thu gọn |
| 100–103 | Media: hover item, popover preview, upload queue, dropdown space |
| 110–123 | Audio: hover nhạc, track audio + toolbar, panel Basic/Voice/Speed, chuột phải, submenu download, modal desktop-only, marker beat, Sound effects, View all, category, filter, search |
| 130–134 | Sticker (đã chọn, Basic, Animation), ảnh chèn vào track chính, track overlay video |
| 140–148 | Effect (hover, đã thêm, Adjustments, Body effects), Filter (đã thêm, Intensity), zoom các clip |
| 150–152 | Transition (tip, đã áp dụng + Duration, icon ở mối nối) |
| 160–166 | Captions editor, các dòng, track caption, Basic, popover shortcuts, export SRT/TXT, find & replace |
| 170–175 | Template (hover, đã chèn, Elements/Batch replace, Edit mode, text effect, clip template) |
| 176–186 | Multi-track, submenu Overlay, Download ▾, panel Export, Export ⋯, Export settings và 4 dropdown |
| 190–201 | Preview axis, ẩn timeline, zoom 200%, chuột phải vùng trống/canvas, các submenu ⋯, Add cover, header track |
| 210–213 | Smart tools: Retouch, Camera tracking, Auto reframe, Remove background |
| 220–223 | Separate audio, Speed curve Custom, modal Freezing, kết quả Freeze |

> Chưa chụp: **Light mode** (đổi theme là thay đổi cài đặt tài khoản nên mình không bấm), Full screen (trình duyệt chặn khi điều khiển tự động), multi-select bằng ⌘+Click (thao tác giả lập không ăn), các tính năng AI tốn credit (Auto captions, Transcribe, Remove BG chạy thật, AI avatars).
