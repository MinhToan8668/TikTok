/* ═══════════════════════════════════════════════════════════════════════
   KHO TÀI NGUYÊN · Viral Studio / Dựng video
   Bộ lọc (tham số → LUT tính tại máy), mẫu chữ, font, hiệu ứng (shader WebGL),
   chuyển cảnh (GLSL kiểu gl-transitions), âm thanh (công thức tổng hợp).
   Tự viết, giấy phép theo repo. Thêm mục mới = thêm một dòng vào danh sách.
   ═══════════════════════════════════════════════════════════════════════ */
window.KHO = window.KHO || {};
KHO.phienBan = '2026.10.03';

/* ── BỘ LỌC: mỗi mục là bộ tham số, máy dựng LUT 17³ khi áp ──
   nhiet −1..1 (lạnh→ấm) · tint −1..1 (xanh lá→hồng) · bh độ bão hoà (1 = giữ) · vib sống động
   tp tương phản (0 = giữ) · sang độ sáng · gamma · phai nâng đen · hue độ xoay màu
   lift/gain [r,g,b] · bong [màu, mức] tông vùng tối · cao [màu, mức] tông vùng sáng
   mono 0..1 đen trắng · duo [màu tối, màu sáng, mức] hai tông · scurve đường cong S */
KHO.boLoc = [
  // Điện ảnh
  { id: 'teal_orange', ten: 'Teal & Orange', nhom: 'dien_anh', p: { bong: ['#0b4f6c', 0.35], cao: ['#ff9f43', 0.25], tp: 0.12, bh: 1.08 } },
  { id: 'blockbuster', ten: 'Bom tấn', nhom: 'dien_anh', p: { bong: ['#123a5a', 0.45], cao: ['#ffb46a', 0.3], tp: 0.18, phai: 0.06, bh: 1.05 } },
  { id: 'noir_xanh', ten: 'Noir xanh', nhom: 'dien_anh', p: { nhiet: -0.35, tp: 0.22, bh: 0.7, bong: ['#0a1f3a', 0.4], phai: 0.08 } },
  { id: 'hoang_hon', ten: 'Hoàng hôn', nhom: 'dien_anh', p: { nhiet: 0.45, cao: ['#ffb070', 0.35], bong: ['#5a2a6a', 0.25], bh: 1.12 } },
  { id: 'rung_sau', ten: 'Rừng sâu', nhom: 'dien_anh', p: { tint: -0.2, bong: ['#0f3d2e', 0.4], cao: ['#e9f5d0', 0.15], tp: 0.1, bh: 0.95 } },
  { id: 'cyber', ten: 'Cyberpunk', nhom: 'dien_anh', p: { bong: ['#2b0a6b', 0.5], cao: ['#ff2ea6', 0.3], tp: 0.2, bh: 1.3, hue: -6 } },
  { id: 'matrix', ten: 'Ma trận', nhom: 'dien_anh', p: { tint: -0.5, bh: 0.6, bong: ['#003b1f', 0.5], cao: ['#b8ffcc', 0.3], tp: 0.15 } },
  { id: 'sa_mac', ten: 'Sa mạc', nhom: 'dien_anh', p: { nhiet: 0.5, bh: 0.9, cao: ['#ffd9a0', 0.3], tp: 0.08, phai: 0.05 } },
  { id: 'bac_cuc', ten: 'Bắc cực', nhom: 'dien_anh', p: { nhiet: -0.5, bh: 0.85, sang: 0.04, cao: ['#dff4ff', 0.3], tp: 0.05 } },
  { id: 'kinh_di', ten: 'Kinh dị', nhom: 'dien_anh', p: { bh: 0.55, tp: 0.3, tint: -0.15, bong: ['#1a0a0a', 0.5], gamma: 1.15 } },
  // Phim nhựa
  { id: 'kodak_vang', ten: 'Phim vàng', nhom: 'phim', p: { nhiet: 0.25, phai: 0.1, bh: 1.05, cao: ['#fff1b8', 0.25], scurve: 0.3 } },
  { id: 'fuji_xanh', ten: 'Phim xanh', nhom: 'phim', p: { tint: -0.1, nhiet: -0.1, phai: 0.08, bh: 1.0, bong: ['#1d4a4a', 0.2], scurve: 0.25 } },
  { id: 'portra', ten: 'Chân dung mềm', nhom: 'phim', p: { nhiet: 0.15, bh: 0.92, phai: 0.1, cao: ['#ffe4cc', 0.2], tp: -0.05 } },
  { id: 'cinestill', ten: 'Đèn đêm', nhom: 'phim', p: { bong: ['#0e2a4a', 0.35], cao: ['#ff8c6a', 0.4], tp: 0.1, phai: 0.06, bh: 1.1 } },
  { id: 'slide_70', ten: 'Slide 70s', nhom: 'phim', p: { nhiet: 0.3, tint: 0.1, bh: 1.2, tp: 0.15, gamma: 0.95, phai: 0.04 } },
  { id: 'phim_han', ten: 'Phim Hàn', nhom: 'phim', p: { phai: 0.12, bh: 0.85, nhiet: 0.05, cao: ['#f6f0ff', 0.2], tp: -0.08, sang: 0.03 } },
  { id: 'phim_nhat', ten: 'Phim Nhật', nhom: 'phim', p: { tint: -0.08, bh: 0.8, phai: 0.14, nhiet: -0.05, tp: -0.1, sang: 0.05 } },
  { id: 'hat_bui', ten: 'Hạt bụi 90s', nhom: 'phim', p: { phai: 0.16, bh: 0.9, nhiet: 0.12, bong: ['#3b2a1a', 0.3], tp: 0.05 } },
  // Ấm
  { id: 'am_nhe', ten: 'Ấm nhẹ', nhom: 'am', p: { nhiet: 0.2, bh: 1.05 } },
  { id: 'nang_chieu', ten: 'Nắng chiều', nhom: 'am', p: { nhiet: 0.35, cao: ['#ffcf8a', 0.3], sang: 0.03, bh: 1.08 } },
  { id: 'mat_ong', ten: 'Mật ong', nhom: 'am', p: { nhiet: 0.4, tint: 0.05, bh: 1.15, tp: 0.08, cao: ['#ffbf5e', 0.3] } },
  { id: 'ca_phe', ten: 'Cà phê', nhom: 'am', p: { nhiet: 0.3, bh: 0.8, bong: ['#3a2416', 0.4], phai: 0.06, tp: 0.1 } },
  { id: 'dao_hoa', ten: 'Đào hoa', nhom: 'am', p: { tint: 0.25, nhiet: 0.15, bh: 1.1, cao: ['#ffd1dc', 0.25], sang: 0.03 } },
  { id: 'cam_nong', ten: 'Cam nóng', nhom: 'am', p: { nhiet: 0.6, bh: 1.2, tp: 0.12 } },
  // Lạnh
  { id: 'lanh_nhe', ten: 'Lạnh nhẹ', nhom: 'lanh', p: { nhiet: -0.2, bh: 1.02 } },
  { id: 'bang_gia', ten: 'Băng giá', nhom: 'lanh', p: { nhiet: -0.45, bh: 0.9, sang: 0.03, cao: ['#cfeeff', 0.3] } },
  { id: 'xanh_bien', ten: 'Xanh biển', nhom: 'lanh', p: { nhiet: -0.3, tint: -0.1, bh: 1.15, bong: ['#063a5e', 0.3] } },
  { id: 'bac_ha', ten: 'Bạc hà', nhom: 'lanh', p: { tint: -0.3, nhiet: -0.1, bh: 1.0, cao: ['#d6fff0', 0.25] } },
  { id: 'tim_khoi', ten: 'Tím khói', nhom: 'lanh', p: { tint: 0.2, nhiet: -0.25, bh: 0.9, bong: ['#2a1a4a', 0.4], phai: 0.08 } },
  { id: 'thep', ten: 'Thép', nhom: 'lanh', p: { nhiet: -0.3, bh: 0.6, tp: 0.2, bong: ['#1c2733', 0.3] } },
  // Màu rực
  { id: 'ruc_ro', ten: 'Rực rỡ', nhom: 'ruc', p: { bh: 1.35, vib: 0.3, tp: 0.1 } },
  { id: 'pop_art', ten: 'Pop art', nhom: 'ruc', p: { bh: 1.6, tp: 0.3, scurve: 0.4 } },
  { id: 'keo_ngot', ten: 'Kẹo ngọt', nhom: 'ruc', p: { bh: 1.25, tint: 0.15, sang: 0.05, cao: ['#fff0f8', 0.2], tp: -0.05 } },
  { id: 'nhiet_doi', ten: 'Nhiệt đới', nhom: 'ruc', p: { bh: 1.3, nhiet: 0.15, tint: -0.15, cao: ['#fff7b0', 0.2], tp: 0.1 } },
  { id: 'neon', ten: 'Neon', nhom: 'ruc', p: { bh: 1.45, tp: 0.25, bong: ['#120a3a', 0.4], cao: ['#ff66cc', 0.2] } },
  { id: 'cau_vong', ten: 'Cầu vồng', nhom: 'ruc', p: { bh: 1.5, hue: 12, vib: 0.4 } },
  { id: 'do_thi_dem', ten: 'Đô thị đêm', nhom: 'ruc', p: { bh: 1.2, tp: 0.2, bong: ['#0a1030', 0.5], cao: ['#ffb347', 0.35] } },
  // Đen trắng
  { id: 'den_trang', ten: 'Đen trắng', nhom: 'dt', p: { mono: 1 } },
  { id: 'dt_tuong_phan', ten: 'Đen trắng gắt', nhom: 'dt', p: { mono: 1, tp: 0.35, scurve: 0.3 } },
  { id: 'dt_mem', ten: 'Đen trắng mềm', nhom: 'dt', p: { mono: 1, phai: 0.15, tp: -0.08, sang: 0.04 } },
  { id: 'bac', ten: 'Ánh bạc', nhom: 'dt', p: { mono: 1, cao: ['#e8f0ff', 0.3], tp: 0.1 } },
  { id: 'sepia', ten: 'Nâu cổ', nhom: 'dt', p: { mono: 1, duo: ['#2b1a0e', '#f3e2c0', 0.9] } },
  { id: 'xanh_cyano', ten: 'Xanh cyanotype', nhom: 'dt', p: { mono: 1, duo: ['#0b2a5a', '#dfeeff', 0.9] } },
  { id: 'mot_nua', ten: 'Một nửa màu', nhom: 'dt', p: { mono: 0.6, tp: 0.1 } },
  // Hoài cổ
  { id: 'vhs_mau', ten: 'VHS màu', nhom: 'co', p: { bh: 1.1, phai: 0.14, nhiet: 0.1, tint: 0.1, tp: -0.05, gamma: 0.95 } },
  { id: 'polaroid', ten: 'Polaroid', nhom: 'co', p: { phai: 0.18, bh: 0.9, nhiet: 0.1, cao: ['#fff5d6', 0.3], tp: -0.1, sang: 0.04 } },
  { id: 'anh_cu', ten: 'Ảnh cũ', nhom: 'co', p: { bh: 0.6, nhiet: 0.35, phai: 0.2, bong: ['#4a3620', 0.4], tp: -0.05 } },
  { id: 'disco', ten: 'Disco 80s', nhom: 'co', p: { bh: 1.3, bong: ['#3a0a5a', 0.4], cao: ['#ff9ad5', 0.3], tp: 0.1 } },
  { id: 'bac_mau', ten: 'Bạc màu', nhom: 'co', p: { bh: 0.7, phai: 0.22, sang: 0.05, tp: -0.12 } },
  { id: 'nhua_cu', ten: 'Nhựa cũ', nhom: 'co', p: { nhiet: 0.2, tint: 0.15, bh: 0.95, phai: 0.1, gamma: 1.05 } },
  // Hai tông
  { id: 'duo_hong', ten: 'Hai tông hồng', nhom: 'duo', p: { duo: ['#1a0533', '#ff7ac6', 1] } },
  { id: 'duo_xanh', ten: 'Hai tông xanh', nhom: 'duo', p: { duo: ['#001a2e', '#5ad7ff', 1] } },
  { id: 'duo_vang', ten: 'Hai tông vàng', nhom: 'duo', p: { duo: ['#1a1200', '#ffd400', 1] } },
  { id: 'duo_luc', ten: 'Hai tông lục', nhom: 'duo', p: { duo: ['#001a10', '#99df00', 1] } },
  { id: 'duo_do', ten: 'Hai tông đỏ', nhom: 'duo', p: { duo: ['#1a0000', '#ff5a5a', 1] } },
  { id: 'duo_tim_cam', ten: 'Tím & cam', nhom: 'duo', p: { duo: ['#2a0a5a', '#ffa64d', 1] } },
  // Chỉnh nhanh
  { id: 'sang_hon', ten: 'Sáng hơn', nhom: 'nhanh', p: { sang: 0.08, gamma: 0.92 } },
  { id: 'toi_hon', ten: 'Tối hơn', nhom: 'nhanh', p: { sang: -0.06, gamma: 1.1 } },
  { id: 'tuong_phan', ten: 'Tương phản', nhom: 'nhanh', p: { tp: 0.25, scurve: 0.3 } },
  { id: 'mem_mai', ten: 'Mềm mại', nhom: 'nhanh', p: { tp: -0.15, phai: 0.1, bh: 0.95 } },
  { id: 'da_dep', ten: 'Da đẹp', nhom: 'nhanh', p: { nhiet: 0.1, bh: 0.95, cao: ['#ffe9d6', 0.2], tp: -0.05, sang: 0.03 } },
  { id: 'do_an', ten: 'Đồ ăn', nhom: 'nhanh', p: { nhiet: 0.2, bh: 1.25, tp: 0.12, vib: 0.2 } },
];
KHO.nhomBoLoc = { dien_anh: 'Điện ảnh', phim: 'Phim nhựa', am: 'Ấm', lanh: 'Lạnh', ruc: 'Màu rực', dt: 'Đen trắng', co: 'Hoài cổ', duo: 'Hai tông', nhanh: 'Chỉnh nhanh' };

/* ── FONT thêm (Google Fonts, đều có bộ chữ tiếng Việt) ── */
KHO.font = {
  bebas: ['Bebas Neue', 'Bebas+Neue'], pacifico: ['Pacifico', 'Pacifico'], lobster: ['Lobster', 'Lobster'], dancing: ['Dancing Script', 'Dancing+Script:wght@700'],
  bangers: ['Bangers', 'Bangers'], comfortaa: ['Comfortaa', 'Comfortaa:wght@700'], nunito: ['Nunito', 'Nunito:wght@800;900'], roboto_slab: ['Roboto Slab', 'Roboto+Slab:wght@700;900'],
  space: ['Space Grotesk', 'Space+Grotesk:wght@700'], archivo: ['Archivo Black', 'Archivo+Black'], quicksand: ['Quicksand', 'Quicksand:wght@700'], patrick: ['Patrick Hand', 'Patrick+Hand'],
  inter: ['Inter', 'Inter:wght@700;900'], kanit: ['Kanit', 'Kanit:ital,wght@0,800;1,800'], exo: ['Exo 2', 'Exo+2:wght@800'], josefin: ['Josefin Sans', 'Josefin+Sans:wght@700'],
  merriweather: ['Merriweather', 'Merriweather:wght@900'], saira: ['Saira Condensed', 'Saira+Condensed:wght@800'], baloo: ['Baloo 2', 'Baloo+2:wght@800'], chakra: ['Chakra Petch', 'Chakra+Petch:wght@700'], big_shoulders: ['Big Shoulders Display', 'Big+Shoulders+Display:wght@900'],
  /* 10/2026 · thêm font có đủ dấu tiếng Việt (Google Fonts, subset vietnamese) */
  tiktok: ['TikTok Sans', 'TikTok+Sans:wght@400..900'], roboto: ['Roboto', 'Roboto:wght@400;700;900'], open_sans: ['Open Sans', 'Open+Sans:wght@400;700;800'], lora: ['Lora', 'Lora:wght@400;700'], source_sans: ['Source Sans 3', 'Source+Sans+3:wght@400;700;900'],
  noto_sans: ['Noto Sans', 'Noto+Sans:wght@400;700;900'], noto_serif: ['Noto Serif', 'Noto+Serif:wght@400;700'], mulish: ['Mulish', 'Mulish:wght@400;700;900'], manrope: ['Manrope', 'Manrope:wght@400;700;800'], sora: ['Sora', 'Sora:wght@400;700;800'],
  public_sans: ['Public Sans', 'Public+Sans:wght@400;700;900'], cabin: ['Cabin', 'Cabin:wght@400;700'], barlow_cond: ['Barlow Condensed', 'Barlow+Condensed:wght@400;700;900'], nunito_sans: ['Nunito Sans', 'Nunito+Sans:wght@400;700;900'], raleway: ['Raleway', 'Raleway:wght@400;700;900'],
  work_sans: ['Work Sans', 'Work+Sans:wght@400;700;900'], ibm_plex: ['IBM Plex Sans', 'IBM+Plex+Sans:wght@400;700'], fira_sans: ['Fira Sans', 'Fira+Sans:wght@400;700;900'], montserrat_alt: ['Montserrat Alternates', 'Montserrat+Alternates:wght@400;700;900'], eb_garamond: ['EB Garamond', 'EB+Garamond:wght@400;700'],
  cormorant: ['Cormorant Garamond', 'Cormorant+Garamond:wght@400;700'], signika: ['Signika', 'Signika:wght@400;700'], asap: ['Asap', 'Asap:wght@400;700'], overpass: ['Overpass', 'Overpass:wght@400;700;900'], encode_sans: ['Encode Sans', 'Encode+Sans:wght@400;700;900'],
  prompt: ['Prompt', 'Prompt:wght@400;700;900'], mitr: ['Mitr', 'Mitr:wght@400;700'], k2d: ['K2D', 'K2D:wght@400;700;800'], sarabun: ['Sarabun', 'Sarabun:wght@400;700;800'], bai: ['Bai Jamjuree', 'Bai+Jamjuree:wght@400;700'],
  athiti: ['Athiti', 'Athiti:wght@400;700'], niramit: ['Niramit', 'Niramit:wght@400;700'], krub: ['Krub', 'Krub:wght@400;700'], maitree: ['Maitree', 'Maitree:wght@400;700'], pridi: ['Pridi', 'Pridi:wght@400;700'],
  taviraj: ['Taviraj', 'Taviraj:wght@400;700;900'], trirong: ['Trirong', 'Trirong:wght@400;700;900'], fahkwang: ['Fahkwang', 'Fahkwang:wght@400;700'], kodchasan: ['Kodchasan', 'Kodchasan:wght@400;700'], thasadith: ['Thasadith', 'Thasadith:wght@400;700'],
  mali: ['Mali', 'Mali:wght@400;700'], itim: ['Itim', 'Itim'], pattaya: ['Pattaya', 'Pattaya'], charm: ['Charm', 'Charm:wght@400;700'], chonburi: ['Chonburi', 'Chonburi'],
  sriracha: ['Sriracha', 'Sriracha'], alfa: ['Alfa Slab One', 'Alfa+Slab+One'], bungee: ['Bungee', 'Bungee'], lilita: ['Lilita One', 'Lilita+One'], grandstander: ['Grandstander', 'Grandstander:wght@400;700;900'],
  arima: ['Arima', 'Arima:wght@400;700'], dela: ['Dela Gothic One', 'Dela+Gothic+One'], rowdies: ['Rowdies', 'Rowdies:wght@400;700'], oi: ['Oi', 'Oi'], bungee_shade: ['Bungee Shade', 'Bungee+Shade'],
  yeseva: ['Yeseva One', 'Yeseva+One'], philosopher: ['Philosopher', 'Philosopher:wght@400;700'], play: ['Play', 'Play:wght@400;700'],
};

/* ── MẪU CHỮ: [tên, kiểu, nhóm]. Kiểu dùng đúng các trường của chữ tự do: text, co, mau, nen (khong|vien|hop|hop_mau|bong), nen_mau, nen_bo, vien_day, phat_sang, hu (pop|len|truot|nhoe|go|phong|mo|nay|lac|xoay|ve), lap (nhap_nhay|nhip|nay|lac), font, dam, nghieng, can, x, y, dongCao ── */
KHO.mauChu = [
  // Xu hướng
  ['Hook to đậm', { text: 'BẠN ĐANG LÀM SAI', co: 0.105, mau: '#ffffff', nen: 'vien', vien_day: 0.22, hu: 'pop', font: 'bebas', y: 0.2 }, 'xu_huong'],
  ['Vàng chói viền đen', { text: 'SỰ THẬT LÀ', co: 0.1, mau: '#FFD400', nen: 'vien', vien_day: 0.25, hu: 'phong', font: 'archivo', y: 0.22 }, 'xu_huong'],
  ['Hộp đỏ TikTok', { text: 'XEM TỚI CUỐI', co: 0.065, mau: '#ffffff', nen: 'hop', nen_mau: '#fe2c55', nen_bo: 0.35, hu: 'len', font: 'inter', dam: 900, y: 0.78 }, 'xu_huong'],
  ['Highlight vàng', { text: 'mẹo này ít ai biết', co: 0.06, mau: '#111111', nen: 'hop', nen_mau: '#FFE600', nen_bo: 0.2, hu: 'truot', font: 'be_vietnam', dam: 800, y: 0.3 }, 'xu_huong'],
  ['Chữ phát sáng cyan', { text: 'BÙNG NỔ', co: 0.1, mau: '#ffffff', nen: 'khong', phat_sang: '#22d3df', hu: 'phong', lap: 'nhip', font: 'kanit', y: 0.5 }, 'xu_huong'],
  ['Số đếm khổng lồ', { text: '#1', co: 0.22, mau: '#99DF00', nen: 'vien', vien_day: 0.15, hu: 'pop', font: 'anton', y: 0.4 }, 'xu_huong'],
  ['Nhãn góc trái', { text: 'PHẦN 2', co: 0.045, mau: '#ffffff', nen: 'hop', nen_mau: '#111111', nen_bo: 0.5, hu: 'truot', font: 'inter', dam: 800, x: 0.2, y: 0.08 }, 'xu_huong'],
  ['Kiểu gõ máy xanh', { text: 'đang tải sự thật...', co: 0.055, mau: '#99DF00', nen: 'hop', nen_mau: '#0a0f05', hu: 'go', font: 'space', dam: 700, can: 'left', x: 0.08, y: 0.5 }, 'xu_huong'],
  ['POV', { text: 'POV: bạn mới bắt đầu', co: 0.06, mau: '#ffffff', nen: 'bong', hu: 'mo', font: 'nunito', dam: 900, y: 0.14 }, 'xu_huong'],
  ['Nhấn hồng neon', { text: 'ĐỪNG BỎ LỠ', co: 0.085, mau: '#ff5fb2', nen: 'khong', phat_sang: '#ff2ea6', hu: 'nhoe', lap: 'nhap_nhay', font: 'bebas', y: 0.5 }, 'xu_huong'],
  // Tiêu đề
  ['Tiêu đề 2 dòng trắng', { text: 'LÀM ÍT|ĐƯỢC NHIỀU', co: 0.12, mau: '#ffffff', nen: 'vien', vien_day: 0.18, hu: 'phong', font: 'bebas', dongCao: 1.0, y: 0.4 }, 'tieu_de'],
  ['Serif sang trọng', { text: 'Bí mật của sự giàu có', co: 0.07, mau: '#f5e9c8', nen: 'bong', hu: 'mo', font: 'playfair', dam: 800, y: 0.4 }, 'tieu_de'],
  ['Khối đen chữ vàng', { text: 'TOP 3 SAI LẦM', co: 0.08, mau: '#FFD400', nen: 'hop', nen_mau: '#0a0c0e', nen_bo: 0.15, hu: 'len', font: 'anton', y: 0.3 }, 'tieu_de'],
  ['Mỏng tối giản', { text: 'Một ngày của tôi', co: 0.055, mau: '#ffffff', nen: 'khong', hu: 'mo', font: 'josefin', dam: 700, y: 0.5 }, 'tieu_de'],
  ['Chữ ngược sáng', { text: 'TRƯỚC & SAU', co: 0.09, mau: '#0a0c0e', nen: 'hop', nen_mau: '#ffffff', nen_bo: 0.1, hu: 'pop', font: 'archivo', y: 0.5 }, 'tieu_de'],
  ['Khẩu hiệu cong', { text: 'Hành động ngay!', co: 0.075, mau: '#ffffff', nen: 'vien', vien_day: 0.2, hu: 'lac', font: 'bangers', y: 0.3 }, 'tieu_de'],
  ['Số & đơn vị', { text: '3 BƯỚC', co: 0.13, mau: '#22d3df', nen: 'vien', vien_day: 0.12, hu: 'phong', font: 'saira', y: 0.4 }, 'tieu_de'],
  ['Tiêu đề thanh lịch', { text: 'Về nhà ăn cơm', co: 0.08, mau: '#ffffff', nen: 'bong', hu: 've', font: 'dancing', dam: 700, y: 0.4 }, 'tieu_de'],
  // Phụ đề nói (từng câu)
  ['Câu nói nền tối', { text: 'Điều đầu tiên bạn cần nhớ', co: 0.05, mau: '#ffffff', nen: 'hop', nen_mau: '#0a0c0e', nen_bo: 0.3, hu: 'mo', font: 'be_vietnam', dam: 700, y: 0.72 }, 'noi'],
  ['Câu nói viền', { text: 'tôi đã thử cách này', co: 0.052, mau: '#ffffff', nen: 'vien', vien_day: 0.28, hu: 'pop', font: 'montserrat', dam: 900, y: 0.74 }, 'noi'],
  ['Từ khoá vàng', { text: 'KẾT QUẢ', co: 0.07, mau: '#FFD400', nen: 'vien', vien_day: 0.25, hu: 'pop', font: 'anton', y: 0.72 }, 'noi'],
  ['Pill xanh', { text: 'quan trọng nè', co: 0.048, mau: '#062226', nen: 'hop_mau', nen_bo: 1, hu: 'pop', font: 'nunito', dam: 900, y: 0.74 }, 'noi'],
  ['Thì thầm nghiêng', { text: '(nói nhỏ thôi)', co: 0.045, mau: '#e5e7eb', nen: 'bong', nghieng: true, hu: 'mo', font: 'be_vietnam', dam: 600, y: 0.74 }, 'noi'],
  ['Hét to', { text: 'KHÔNG!!!', co: 0.12, mau: '#ff3b3b', nen: 'vien', vien_day: 0.2, hu: 'lac', lap: 'lac', font: 'bangers', y: 0.5 }, 'noi'],
  ['Gõ từng chữ trắng', { text: 'và rồi chuyện gì xảy ra?', co: 0.05, mau: '#ffffff', nen: 'bong', hu: 'go', font: 'inter', dam: 800, y: 0.74 }, 'noi'],
  // Review · bán hàng
  ['Giá sốc', { text: 'CHỈ 99K', co: 0.11, mau: '#ffffff', nen: 'hop', nen_mau: '#fe2c55', nen_bo: 0.2, hu: 'pop', lap: 'nhip', font: 'anton', y: 0.3 }, 'ban_hang'],
  ['Giảm %', { text: '-50%', co: 0.16, mau: '#FFD400', nen: 'vien', vien_day: 0.15, hu: 'xoay', font: 'archivo', y: 0.35, x: 0.7 }, 'ban_hang'],
  ['Ưu điểm ✓', { text: '✓ Pin 2 ngày', co: 0.055, mau: '#062226', nen: 'hop', nen_mau: '#99DF00', nen_bo: 0.3, hu: 'truot', font: 'inter', dam: 800, can: 'left', x: 0.08, y: 0.3 }, 'ban_hang'],
  ['Nhược điểm ✗', { text: '✗ Hơi nặng', co: 0.055, mau: '#ffffff', nen: 'hop', nen_mau: '#ff3b3b', nen_bo: 0.3, hu: 'truot', font: 'inter', dam: 800, can: 'left', x: 0.08, y: 0.38 }, 'ban_hang'],
  ['Điểm số', { text: '9/10', co: 0.14, mau: '#ffffff', nen: 'hop', nen_mau: '#0a0c0e', nen_bo: 0.25, hu: 'phong', font: 'bebas', y: 0.5 }, 'ban_hang'],
  ['Link ở bio', { text: 'LINK Ở BIO 👆', co: 0.055, mau: '#ffffff', nen: 'hop', nen_mau: '#8b5cf6', nen_bo: 0.6, hu: 'len', lap: 'nay', font: 'nunito', dam: 900, y: 0.82 }, 'ban_hang'],
  ['Tên sản phẩm', { text: 'Tai nghe X200', co: 0.05, mau: '#ffffff', nen: 'hop', nen_mau: '#111111', nen_bo: 0.3, hu: 'truot', font: 'space', dam: 700, x: 0.28, y: 0.9 }, 'ban_hang'],
  ['Freeship', { text: 'FREESHIP TOÀN QUỐC', co: 0.05, mau: '#111111', nen: 'hop', nen_mau: '#FFE600', nen_bo: 0.6, hu: 'pop', font: 'kanit', y: 0.86 }, 'ban_hang'],
  // Hoài cổ
  ['Máy đánh chữ', { text: 'Ngày xửa ngày xưa...', co: 0.05, mau: '#f1e7d0', nen: 'khong', hu: 'go', font: 'roboto_slab', dam: 700, y: 0.5 }, 'co'],
  ['VHS ghi hình', { text: '● REC  00:00:12', co: 0.045, mau: '#ff4d4d', nen: 'khong', hu: 'mo', lap: 'nhap_nhay', font: 'chakra', dam: 700, x: 0.25, y: 0.08 }, 'co'],
  ['Tựa phim 80s', { text: 'MÙA HÈ 1989', co: 0.1, mau: '#ff7ac6', nen: 'khong', phat_sang: '#7c3aed', hu: 'phong', font: 'exo', y: 0.5 }, 'co'],
  ['Băng cassette', { text: 'SIDE A', co: 0.06, mau: '#111111', nen: 'hop', nen_mau: '#f3e2c0', nen_bo: 0.1, hu: 'truot', font: 'merriweather', dam: 900, y: 0.5 }, 'co'],
  ['Tem thư', { text: 'KỶ NIỆM', co: 0.065, mau: '#7a1f1f', nen: 'hop', nen_mau: '#fff8e7', nen_bo: 0.05, hu: 'xoay', font: 'playfair', dam: 800, y: 0.5 }, 'co'],
  // Tối giản
  ['Trắng mảnh giữa', { text: 'bắt đầu từ hôm nay', co: 0.05, mau: '#ffffff', nen: 'khong', hu: 'mo', font: 'quicksand', dam: 700, y: 0.5 }, 'toi_gian'],
  ['Gạch chân', { text: 'tập trung', co: 0.07, mau: '#ffffff', nen: 'bong', hu: 've', font: 'inter', dam: 900, y: 0.5 }, 'toi_gian'],
  ['Chữ nhỏ góc dưới', { text: '@tenkenh', co: 0.035, mau: '#e5e7eb', nen: 'bong', hu: 'mo', font: 'inter', dam: 600, x: 0.84, y: 0.94 }, 'toi_gian'],
  ['Trích dẫn thanh', { text: '“Chậm mà chắc”', co: 0.065, mau: '#ffffff', nen: 'bong', nghieng: true, hu: 'mo', font: 'merriweather', dam: 900, y: 0.45 }, 'toi_gian'],
  ['Ngày tháng', { text: '03 · 10 · 2026', co: 0.04, mau: '#ffffff', nen: 'khong', hu: 'truot', font: 'space', dam: 700, y: 0.1 }, 'toi_gian'],
  ['Địa điểm', { text: '📍 Đà Lạt', co: 0.045, mau: '#ffffff', nen: 'hop', nen_mau: 'rgba(0,0,0,.55)', nen_bo: 0.6, hu: 'truot', font: 'nunito', dam: 800, x: 0.2, y: 0.12 }, 'toi_gian'],
  // Vui nhộn
  ['Truyện tranh', { text: 'BÙM!', co: 0.14, mau: '#FFD400', nen: 'vien', vien_day: 0.25, hu: 'pop', lap: 'lac', font: 'bangers', y: 0.4 }, 'vui'],
  ['Tay viết', { text: 'hehe không ngờ luôn', co: 0.06, mau: '#ffffff', nen: 'bong', hu: 've', font: 'patrick', dam: 700, y: 0.3 }, 'vui'],
  ['Kẹo bông', { text: 'cute xỉu', co: 0.08, mau: '#ff7ac6', nen: 'vien', vien_day: 0.2, hu: 'nay', lap: 'nay', font: 'baloo', y: 0.4 }, 'vui'],
  ['Chữ nhảy', { text: 'LET’S GO', co: 0.1, mau: '#99DF00', nen: 'vien', vien_day: 0.15, hu: 'nay', lap: 'nhip', font: 'bangers', y: 0.5 }, 'vui'],
  ['Bong bóng thoại', { text: 'ủa gì vậy trời?', co: 0.055, mau: '#111111', nen: 'hop', nen_mau: '#ffffff', nen_bo: 1, hu: 'pop', font: 'comfortaa', dam: 700, x: 0.6, y: 0.25 }, 'vui'],
  ['Lỗi hệ thống', { text: 'ERROR 404', co: 0.09, mau: '#ff3b3b', nen: 'khong', phat_sang: '#ff0000', hu: 'lac', lap: 'nhap_nhay', font: 'chakra', dam: 700, y: 0.5 }, 'vui'],
  // Kêu gọi
  ['Follow mũi tên', { text: 'FOLLOW ĐỂ XEM TIẾP 👉', co: 0.05, mau: '#ffffff', nen: 'hop', nen_mau: '#fe2c55', nen_bo: 0.6, hu: 'len', lap: 'nay', font: 'nunito', dam: 900, y: 0.8 }, 'keu_goi'],
  ['Bình luận', { text: 'Bình luận “CÓ” nếu bạn muốn phần 2', co: 0.045, mau: '#111111', nen: 'hop', nen_mau: '#ffffff', nen_bo: 0.5, hu: 'len', font: 'inter', dam: 800, y: 0.82 }, 'keu_goi'],
  ['Lưu lại', { text: '🔖 LƯU LẠI KẺO QUÊN', co: 0.05, mau: '#ffffff', nen: 'hop', nen_mau: '#0ea5e9', nen_bo: 0.6, hu: 'truot', font: 'kanit', y: 0.8 }, 'keu_goi'],
  ['Chia sẻ', { text: 'Gửi cho đứa bạn cần cái này', co: 0.045, mau: '#ffffff', nen: 'hop', nen_mau: '#111111', nen_bo: 0.5, hu: 'mo', font: 'be_vietnam', dam: 700, y: 0.84 }, 'keu_goi'],
  ['Đăng ký kênh', { text: 'ĐĂNG KÝ KÊNH', co: 0.055, mau: '#ffffff', nen: 'hop', nen_mau: '#ff0000', nen_bo: 0.25, hu: 'pop', lap: 'nhip', font: 'inter', dam: 900, y: 0.82 }, 'keu_goi'],
  ['Đếm ngược', { text: 'CÒN 3 NGÀY', co: 0.08, mau: '#FFD400', nen: 'hop', nen_mau: '#0a0c0e', nen_bo: 0.2, hu: 'phong', lap: 'nhip', font: 'bebas', y: 0.5 }, 'keu_goi'],
  // Giáo dục · tin tức
  ['Bảng tin', { text: 'TIN NÓNG', co: 0.055, mau: '#ffffff', nen: 'hop', nen_mau: '#c81e1e', nen_bo: 0.1, hu: 'truot', font: 'saira', x: 0.18, y: 0.86 }, 'tin'],
  ['Dòng chạy dưới', { text: 'Giá vàng hôm nay tăng mạnh ・ Thời tiết nắng nóng', co: 0.038, mau: '#ffffff', nen: 'hop', nen_mau: '#0a0c0e', nen_bo: 0, hu: 'truot', font: 'inter', dam: 700, y: 0.93 }, 'tin'],
  ['Định nghĩa', { text: 'Lãi kép (n): lãi sinh ra lãi', co: 0.05, mau: '#ffffff', nen: 'hop', nen_mau: '#1e293b', nen_bo: 0.3, hu: 'mo', font: 'merriweather', dam: 900, can: 'left', x: 0.08, y: 0.4 }, 'tin'],
  ['Bước 1/3', { text: 'BƯỚC 1', co: 0.07, mau: '#062226', nen: 'hop_mau', nen_bo: 0.3, hu: 'pop', font: 'kanit', x: 0.2, y: 0.12 }, 'tin'],
  ['Số liệu lớn', { text: '87%', co: 0.2, mau: '#ffffff', nen: 'khong', phat_sang: '#22d3df', hu: 'phong', font: 'big_shoulders', y: 0.42 }, 'tin'],
  ['Ghi chú vàng', { text: 'Lưu ý: không áp dụng cho...', co: 0.042, mau: '#111111', nen: 'hop', nen_mau: '#fff3b0', nen_bo: 0.2, hu: 'truot', font: 'patrick', dam: 700, can: 'left', x: 0.08, y: 0.86 }, 'tin'],
  ['Tên người nói', { text: 'Minh Toàn · Tự Mình Xây Kênh', co: 0.04, mau: '#ffffff', nen: 'hop', nen_mau: '#0a0c0e', nen_bo: 0.2, hu: 'truot', font: 'inter', dam: 800, can: 'left', x: 0.08, y: 0.88 }, 'tin'],
];
KHO.nhomMauChu = { xu_huong: 'Xu hướng', tieu_de: 'Tiêu đề', noi: 'Lời nói', ban_hang: 'Review · bán hàng', co: 'Hoài cổ', toi_gian: 'Tối giản', vui: 'Vui nhộn', keu_goi: 'Kêu gọi', tin: 'Giáo dục · tin' };

/* ── HIỆU ỨNG VIDEO: shader WebGL chạy sau chỉnh màu. Mỗi mục: id, tên, nhóm, icon, glsl = thân hàm vec4 hu(vec2 uv).
   Có sẵn: uv, s (ảnh), t (giây trong đoạn), muc (cường độ 0..1), res, tx(p) lấy màu, rnd(p), nse(p) nhiễu, PI ── */
KHO.hieuUng = [
  // Hỏng hóc · retro
  { id: 'glitch', ten: 'Glitch', nhom: 'hong', ic: '▦', glsl: 'float b=floor(uv.y*18.+t*9.);float r=rnd(vec2(b,floor(t*9.)));float d=step(.72,r)*(r-.72)*1.6*muc;vec2 p=uv+vec2(d*sin(t*31.+b),0.);vec4 c;c.r=tx(p+vec2(.012*muc,0.)).r;c.g=tx(p).g;c.b=tx(p-vec2(.012*muc,0.)).b;c.a=1.;if(rnd(vec2(floor(t*7.),2.))>.93)c.rgb=c.gbr;return c;' },
  { id: 'rgb_tach', ten: 'Tách màu RGB', nhom: 'hong', ic: '🟥', glsl: 'float d=(.006+.01*sin(t*3.))*muc;return vec4(tx(uv+vec2(d,0.)).r,tx(uv).g,tx(uv-vec2(d,0.)).b,1.);' },
  { id: 'vhs', ten: 'VHS', nhom: 'hong', ic: '📼', glsl: 'vec2 p=uv;p.x+=sin(uv.y*60.+t*8.)*.002*muc;float l=step(.97,fract(uv.y*3.-t*.4))*.15*muc;vec4 c=vec4(tx(p+vec2(.004*muc,0.)).r,tx(p).g,tx(p-vec2(.004*muc,0.)).b,1.);c.rgb*=1.-.18*muc*mod(floor(uv.y*res.y),2.);c.rgb+=l+(rnd(uv*vec2(1.,res.y)+t)-.5)*.12*muc;c.rgb=mix(c.rgb,c.rgb*vec3(1.05,.95,.9),muc*.5);return c;' },
  { id: 'tv_cu', ten: 'TV cũ', nhom: 'hong', ic: '📺', glsl: 'vec2 q=uv*2.-1.;q*=1.+dot(q,q)*.08*muc;vec2 p=q*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)return vec4(0.,0.,0.,1.);vec4 c=tx(p);float sc=.85+.15*sin(p.y*res.y*3.14159);c.rgb*=mix(1.,sc,muc);c.rgb*=1.-.35*muc*dot(q,q);c.rgb+=(rnd(p*res+t*60.)-.5)*.08*muc;return c;' },
  { id: 'pixel', ten: 'Pixel hoá', nhom: 'hong', ic: '🟩', glsl: 'float n=mix(400.,28.,muc);vec2 g=vec2(n,n*res.y/res.x);return tx((floor(uv*g)+.5)/g);' },
  { id: 'nhieu_hat', ten: 'Nhiễu hạt', nhom: 'hong', ic: '🌫', glsl: 'vec4 c=tx(uv);float n=rnd(uv*res*.5+fract(t*13.)*vec2(7.,3.))-.5;return vec4(c.rgb+n*.45*muc,1.);' },
  { id: 'phim_xuoc', ten: 'Phim xước', nhom: 'hong', ic: '🎞', glsl: 'vec4 c=tx(uv+vec2(0.,(rnd(vec2(floor(t*24.),1.))-.5)*.004*muc));float g=dot(c.rgb,vec3(.3,.59,.11));c.rgb=mix(c.rgb,vec3(g)*vec3(1.1,1.,.85),.7*muc);float x=rnd(vec2(floor(t*24.),3.));float v=step(abs(uv.x-x),.0015)*step(.6,rnd(vec2(floor(t*24.),5.)));c.rgb+=v*.6*muc;c.rgb*=1.-(rnd(vec2(floor(t*24.),9.))*.12)*muc;c.rgb*=1.-.5*muc*pow(length(uv-.5),2.);c.rgb+=(rnd(uv*res+t)-.5)*.1*muc;return c;' },
  { id: 'nhay_khung', ten: 'Nhảy khung', nhom: 'hong', ic: '⏭', glsl: 'float k=floor(t*6.);vec2 o=(vec2(rnd(vec2(k,1.)),rnd(vec2(k,2.)))-.5)*.03*muc;float z=1.+rnd(vec2(k,3.))*.06*muc;return tx((uv-.5)/z+.5+o);' },
  { id: 'lo_mau', ten: 'Loang màu', nhom: 'hong', ic: '🫧', glsl: 'vec4 c=tx(uv);for(int i=1;i<5;i++){float f=float(i)*.01*muc;c.rgb+=tx(uv+vec2(f,0.)).rgb*vec3(.5,.1,0.)*.4+tx(uv-vec2(f,0.)).rgb*vec3(0.,.1,.5)*.4;}return vec4(c.rgb/1.9,1.);' },
  // Biến dạng
  { id: 'guong_doc', ten: 'Gương dọc', nhom: 'bien', ic: '🪞', glsl: 'vec2 p=uv;p.x=uv.x<.5?uv.x:1.-uv.x;p.x=mix(uv.x,p.x,step(.5,muc+.5));return tx(p);' },
  { id: 'guong_ngang', ten: 'Gương ngang', nhom: 'bien', ic: '🪞', glsl: 'vec2 p=uv;p.y=uv.y>.5?uv.y:1.-uv.y;return tx(p);' },
  { id: 'kinh_van_hoa', ten: 'Kính vạn hoa', nhom: 'bien', ic: '🔮', glsl: 'vec2 q=uv-.5;q.x*=res.x/res.y;float a=atan(q.y,q.x)+t*.3,r=length(q);float n=mix(2.,6.,muc);a=mod(a,PI*2./n);a=abs(a-PI/n);vec2 p=vec2(cos(a),sin(a))*r;p.x*=res.y/res.x;return tx(p+.5);' },
  { id: 'xoay_oc', ten: 'Xoáy ốc', nhom: 'bien', ic: '🌀', glsl: 'vec2 q=uv-.5;q.x*=res.x/res.y;float r=length(q),a=atan(q.y,q.x)+(1.-smoothstep(0.,.5,r))*3.*muc*sin(t*.8);vec2 p=vec2(cos(a),sin(a))*r;p.x*=res.y/res.x;return tx(p+.5);' },
  { id: 'song', ten: 'Sóng', nhom: 'bien', ic: '〰', glsl: 'vec2 p=uv+vec2(sin(uv.y*20.+t*4.)*.02,sin(uv.x*20.+t*3.)*.015)*muc;return tx(p);' },
  { id: 'gon_nuoc', ten: 'Gợn nước', nhom: 'bien', ic: '💧', glsl: 'vec2 q=uv-.5;q.x*=res.x/res.y;float r=length(q);vec2 p=uv+normalize(q+1e-4)*sin(r*40.-t*6.)*.012*muc*(1.-r);return tx(p);' },
  { id: 'mat_ca', ten: 'Mắt cá', nhom: 'bien', ic: '🐟', glsl: 'vec2 q=uv*2.-1.;float r=length(q);q*=mix(1.,1.-r*r*.35,muc);return tx(q*.5+.5);' },
  { id: 'chia_man', ten: 'Chia 4 màn', nhom: 'bien', ic: '⊞', glsl: 'vec2 p=fract(uv*2.);return mix(tx(uv),tx(p),step(.5,muc+.5));' },
  { id: 'phong_dai', ten: 'Phóng nhịp', nhom: 'bien', ic: '🔍', glsl: 'float b=fract(t*2.);float z=1.+(1.-b)*(1.-b)*.18*muc;return tx((uv-.5)/z+.5);' },
  { id: 'rung_manh', ten: 'Rung mạnh', nhom: 'bien', ic: '📳', glsl: 'float k=floor(t*30.);vec2 o=(vec2(rnd(vec2(k,7.)),rnd(vec2(k,8.)))-.5)*.05*muc;return tx((uv-.5)*.94+.5+o);' },
  { id: 'anaglyph', ten: 'Kính 3D', nhom: 'bien', ic: '🥽', glsl: 'float d=.02*muc;return vec4(tx(uv-vec2(d,0.)).r,tx(uv+vec2(d,0.)).gb,1.);' },
  // Ánh sáng
  { id: 'bloom', ten: 'Bừng sáng', nhom: 'sang', ic: '✨', glsl: 'vec4 c=tx(uv);vec3 b=vec3(0.);for(int i=-3;i<=3;i++)for(int j=-3;j<=3;j++){vec3 q=tx(uv+vec2(float(i),float(j))/res*4.).rgb;b+=max(q-.55,0.);}b/=49.;return vec4(c.rgb+b*2.2*muc,1.);' },
  { id: 'mo_mong', ten: 'Mơ màng', nhom: 'sang', ic: '☁', glsl: 'vec3 b=vec3(0.);for(int i=-3;i<=3;i++)for(int j=-3;j<=3;j++)b+=tx(uv+vec2(float(i),float(j))/res*6.).rgb;b/=49.;vec4 c=tx(uv);return vec4(mix(c.rgb,max(c.rgb,b)*1.05,.6*muc),1.);' },
  { id: 'ro_ri_sang', ten: 'Rò sáng', nhom: 'sang', ic: '🌅', glsl: 'vec4 c=tx(uv);vec2 o=vec2(.2+.6*(.5+.5*sin(t*.7)),.1);float d=length((uv-o)*vec2(res.x/res.y,1.));vec3 l=vec3(1.,.55,.2)*smoothstep(.9,0.,d)*.7+vec3(1.,.2,.3)*smoothstep(.5,0.,length(uv-vec2(.9,.8)))*.4;c.rgb=1.-(1.-c.rgb)*(1.-l*muc);return c;' },
  { id: 'vet_sang', ten: 'Vệt sáng ngang', nhom: 'sang', ic: '💫', glsl: 'vec4 c=tx(uv);vec3 b=vec3(0.);for(int i=-8;i<=8;i++){vec3 q=tx(uv+vec2(float(i)/res.x*6.,0.)).rgb;b+=max(q-.7,0.);}b/=17.;return vec4(c.rgb+b*vec3(.6,.8,1.4)*2.*muc,1.);' },
  { id: 'tia_sang', ten: 'Tia sáng', nhom: 'sang', ic: '🔆', glsl: 'vec4 c=tx(uv);vec2 o=vec2(.5,.05);vec3 a=vec3(0.);vec2 d=(o-uv)/12.;vec2 p=uv;for(int i=0;i<12;i++){p+=d;a+=max(tx(p).rgb-.6,0.)*(1.-float(i)/12.);}return vec4(c.rgb+a/6.*muc*vec3(1.,.95,.8),1.);' },
  { id: 'nhap_nhay', ten: 'Chớp nháy', nhom: 'sang', ic: '⚡', glsl: 'vec4 c=tx(uv);float f=step(.5,fract(t*4.))*.5*muc;return vec4(c.rgb+f,1.);' },
  { id: 'toi_goc_nhip', ten: 'Tối góc nhịp', nhom: 'sang', ic: '🌑', glsl: 'vec4 c=tx(uv);float b=pow(1.-fract(t*2.),2.);float v=smoothstep(.9,.25+.2*b,length((uv-.5)*vec2(res.x/res.y,1.)));c.rgb*=1.-v*(.7+.3*b)*muc;return c;' },
  { id: 'bokeh', ten: 'Bokeh tròn', nhom: 'sang', ic: '🫧', glsl: 'vec4 c=tx(uv);vec3 b=vec3(0.);for(int i=0;i<8;i++){float f=float(i);vec2 o=vec2(rnd(vec2(f,1.)),fract(rnd(vec2(f,2.))+t*.05*(1.+f*.2)));float d=length((uv-o)*vec2(res.x/res.y,1.));b+=smoothstep(.06,.04,d)*vec3(1.,.9,.7)*.25;}return vec4(c.rgb+b*muc,1.);' },
  // Nghệ thuật
  { id: 'duotone_hong', ten: 'Hai tông hồng', nhom: 'nghe', ic: '🎨', glsl: 'vec4 c=tx(uv);float g=dot(c.rgb,vec3(.3,.59,.11));return vec4(mix(c.rgb,mix(vec3(.1,.02,.2),vec3(1.,.48,.78),g),muc),1.);' },
  { id: 'duotone_xanh', ten: 'Hai tông xanh', nhom: 'nghe', ic: '🎨', glsl: 'vec4 c=tx(uv);float g=dot(c.rgb,vec3(.3,.59,.11));return vec4(mix(c.rgb,mix(vec3(0.,.1,.18),vec3(.35,.84,1.),g),muc),1.);' },
  { id: 'am_ban', ten: 'Âm bản', nhom: 'nghe', ic: '◐', glsl: 'vec4 c=tx(uv);return vec4(mix(c.rgb,1.-c.rgb,muc),1.);' },
  { id: 'posterize', ten: 'Tranh cổ động', nhom: 'nghe', ic: '🖼', glsl: 'vec4 c=tx(uv);float n=mix(32.,4.,muc);return vec4(floor(c.rgb*n+.5)/n,1.);' },
  { id: 'phac_hoa', ten: 'Phác hoạ', nhom: 'nghe', ic: '✏', glsl: 'vec2 px=1./res;float gx=dot(tx(uv+vec2(px.x,0.)).rgb-tx(uv-vec2(px.x,0.)).rgb,vec3(.33));float gy=dot(tx(uv+vec2(0.,px.y)).rgb-tx(uv-vec2(0.,px.y)).rgb,vec3(.33));float e=clamp(length(vec2(gx,gy))*6.,0.,1.);vec4 c=tx(uv);return vec4(mix(c.rgb,vec3(1.-e),muc),1.);' },
  { id: 'nhiet', ten: 'Ảnh nhiệt', nhom: 'nghe', ic: '🌡', glsl: 'vec4 c=tx(uv);float g=dot(c.rgb,vec3(.3,.59,.11));vec3 h=g<.25?mix(vec3(0.,0.,.3),vec3(0.,0.,1.),g*4.):g<.5?mix(vec3(0.,0.,1.),vec3(0.,1.,0.),(g-.25)*4.):g<.75?mix(vec3(0.,1.,0.),vec3(1.,1.,0.),(g-.5)*4.):mix(vec3(1.,1.,0.),vec3(1.,0.,0.),(g-.75)*4.);return vec4(mix(c.rgb,h,muc),1.);' },
  { id: 'hoa_tiet', ten: 'Chấm bi báo', nhom: 'nghe', ic: '⚫', glsl: 'vec4 c=tx(uv);float g=dot(c.rgb,vec3(.3,.59,.11));vec2 p=uv*res/mix(14.,6.,muc);float d=length(fract(p)-.5);float r=(1.-g)*.7;return vec4(mix(c.rgb,vec3(step(r,d)),muc*.9),1.);' },
  { id: 'neon_vien', ten: 'Viền neon', nhom: 'nghe', ic: '🟣', glsl: 'vec2 px=1./res;float gx=dot(tx(uv+vec2(px.x,0.)).rgb-tx(uv-vec2(px.x,0.)).rgb,vec3(.33));float gy=dot(tx(uv+vec2(0.,px.y)).rgb-tx(uv-vec2(0.,px.y)).rgb,vec3(.33));float e=clamp(length(vec2(gx,gy))*8.,0.,1.);vec3 n=vec3(.6+.4*sin(t*2.),.2,1.)*e;vec4 c=tx(uv);return vec4(mix(c.rgb,c.rgb*.25+n*1.5,muc),1.);' },
  { id: 'banh_xe_mau', ten: 'Đổi màu liên tục', nhom: 'nghe', ic: '🌈', glsl: 'vec4 c=tx(uv);float a=t*1.5*muc;vec3 k=vec3(.57735);float ca=cos(a);vec3 r=c.rgb*ca+cross(k,c.rgb)*sin(a)+k*dot(k,c.rgb)*(1.-ca);return vec4(r,1.);' },
  { id: 'tranh_dau', ten: 'Tranh sơn dầu', nhom: 'nghe', ic: '🖌', glsl: 'vec3 m=vec3(0.);float w=0.;for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++){vec3 q=tx(uv+vec2(float(i),float(j))/res*3.*muc).rgb;float k=1./(1.+dot(q-tx(uv).rgb,q-tx(uv).rgb)*40.);m+=q*k;w+=k;}return vec4(m/w,1.);' },
  // Thời tiết · hạt
  { id: 'tuyet_roi', ten: 'Tuyết rơi', nhom: 'hat', ic: '❄', glsl: 'vec4 c=tx(uv);float a=0.;for(int i=0;i<3;i++){float f=float(i)+1.;vec2 p=uv*vec2(12.,20.)*f*.5;p.y+=t*f*.6;p.x+=sin(t+f)*.3;vec2 g=floor(p);vec2 o=vec2(rnd(g),rnd(g+7.));float d=length(fract(p)-o);a+=smoothstep(.09,.03,d)*(.9-f*.2);}return vec4(c.rgb+a*muc,1.);' },
  { id: 'mua', ten: 'Mưa', nhom: 'hat', ic: '🌧', glsl: 'vec4 c=tx(uv);float a=0.;for(int i=0;i<2;i++){float f=float(i)+1.;vec2 p=uv*vec2(60.,8.)*f;p.y+=t*8.*f;p.x+=uv.y*2.;vec2 g=floor(p);float r=rnd(g);float d=abs(fract(p.x)-.5);a+=step(.8,r)*smoothstep(.08,0.,d)*step(fract(p.y),.5)*.35;}c.rgb=mix(c.rgb,c.rgb*vec3(.85,.9,1.),muc*.5)+a*muc;return c;' },
  { id: 'bui_sang', ten: 'Bụi sáng', nhom: 'hat', ic: '✦', glsl: 'vec4 c=tx(uv);float a=0.;for(int i=0;i<3;i++){float f=float(i)+1.;vec2 p=uv*vec2(8.,14.)*f;p.y-=t*.15*f;p.x+=sin(t*.5+f)*.2;vec2 g=floor(p);vec2 o=vec2(rnd(g+3.),rnd(g+11.));float d=length(fract(p)-o);float tw=.5+.5*sin(t*3.+rnd(g)*6.);a+=smoothstep(.05,.0,d)*tw;}return vec4(c.rgb+a*vec3(1.,.95,.7)*muc,1.);' },
  { id: 'suong_mu', ten: 'Sương mù', nhom: 'hat', ic: '🌁', glsl: 'vec4 c=tx(uv);float n=nse(uv*3.+vec2(t*.1,0.))*.6+nse(uv*7.-vec2(0.,t*.05))*.4;return vec4(mix(c.rgb,vec3(.85,.88,.92),n*.55*muc),1.);' },
  { id: 'lua_vien', ten: 'Lửa viền dưới', nhom: 'hat', ic: '🔥', glsl: 'vec4 c=tx(uv);float h=nse(vec2(uv.x*8.,t*3.))*.25+.1;float f=smoothstep(h,0.,1.-uv.y);vec3 col=mix(vec3(1.,.9,.2),vec3(1.,.2,0.),f);return vec4(mix(c.rgb,col,f*muc*.9),1.);' },
  /* 10/2026 · thêm: chuyển động, màu, khung hình, ánh sáng, hạt */
  { id: 'zoom_cham', ten: 'Zoom chậm', nhom: 'dong', ic: '🔍', glsl: 'float z=1.+.15*muc*fract(t/6.);return tx((uv-.5)/z+.5);' },
  { id: 'rung_may', ten: 'Rung máy', nhom: 'dong', ic: '📳', glsl: 'vec2 o=vec2(rnd(vec2(floor(t*20.),1.))-.5,rnd(vec2(2.,floor(t*20.)))-.5)*.03*muc;return tx(uv+o);' },
  { id: 'lac_nhe', ten: 'Lắc nhẹ', nhom: 'dong', ic: '🎐', glsl: 'float a=sin(t*1.5)*.03*muc;vec2 c=uv-.5;mat2 m=mat2(cos(a),-sin(a),sin(a),cos(a));return tx((m*c)*(1.-.06*muc)+.5);' },
  { id: 'nhip_tim', ten: 'Nhịp tim', nhom: 'dong', ic: '💓', glsl: 'float b=pow(abs(sin(t*PI*1.2)),8.);float z=1.+.08*muc*b;return tx((uv-.5)/z+.5);' },
  { id: 'troi_ngang', ten: 'Trôi ngang', nhom: 'dong', ic: '↔', glsl: 'float x=(fract(t/8.)-.5)*.1*muc;return tx((uv-.5)*(1.-.1*muc)+.5+vec2(x,0.));' },
  { id: 'nhoe_ngang', ten: 'Nhoè chuyển động', nhom: 'dong', ic: '💨', glsl: 'vec4 c=vec4(0.);for(int i=0;i<8;i++){float f=(float(i)/7.-.5)*.03*muc;c+=tx(uv+vec2(f,0.));}return c/8.;' },
  { id: 'zoom_dap', ten: 'Zoom đập nhịp', nhom: 'dong', ic: '🥁', glsl: 'float ph=fract(t);float z=1.+.12*muc*exp(-ph*6.);return tx((uv-.5)/z+.5);' },
  { id: 'xoay_cham', ten: 'Xoay chậm', nhom: 'dong', ic: '🔄', glsl: 'float a=t*.15*muc;vec2 c=uv-.5;c.x*=res.x/res.y;mat2 m=mat2(cos(a),-sin(a),sin(a),cos(a));c=m*c;c.x/=res.x/res.y;return tx(c*(1.-.2*muc)+.5);' },
  { id: 'duotone_tim_vang', ten: 'Hai tông tím vàng', nhom: 'mau', ic: '🟪', glsl: 'vec4 c=tx(uv);float l=dot(c.rgb,vec3(.299,.587,.114));vec3 d=mix(vec3(.05,.02,.2),vec3(.98,.85,.2),l);return vec4(mix(c.rgb,d,muc),1.);' },
  { id: 'sepia_hu', ten: 'Nâu cổ điển', nhom: 'mau', ic: '🟫', glsl: 'vec4 c=tx(uv);vec3 s2=vec3(dot(c.rgb,vec3(.393,.769,.189)),dot(c.rgb,vec3(.349,.686,.168)),dot(c.rgb,vec3(.272,.534,.131)));return vec4(mix(c.rgb,s2,muc),1.);' },
  { id: 'poster_hu', ten: 'Poster ít màu', nhom: 'mau', ic: '🎨', glsl: 'vec4 c=tx(uv);float n=mix(256.,4.,muc);return vec4(floor(c.rgb*n)/n,1.);' },
  { id: 'xoay_mau', ten: 'Đổi màu liên tục', nhom: 'mau', ic: '🌈', glsl: 'vec4 c=tx(uv);float a=t*muc;mat3 m=mat3(.299,.587,.114,.299,.587,.114,.299,.587,.114)+cos(a)*mat3(.701,-.587,-.114,-.299,.413,-.114,-.3,-.588,.886)+sin(a)*mat3(.168,.33,-.497,-.328,.035,.292,1.25,-1.05,-.203);return vec4(clamp(m*c.rgb,0.,1.),1.);' },
  { id: 'tuong_phan_manh', ten: 'Tương phản mạnh', nhom: 'mau', ic: '◐', glsl: 'vec4 c=tx(uv);vec3 r=(c.rgb-.5)*(1.+2.*muc)+.5;return vec4(clamp(r,0.,1.),1.);' },
  { id: 'am_ban_nhap', ten: 'Âm bản nhấp nháy', nhom: 'mau', ic: '⚡', glsl: 'vec4 c=tx(uv);float f=step(.9,rnd(vec2(floor(t*8.),3.)))*muc;return vec4(mix(c.rgb,1.-c.rgb,f),1.);' },
  { id: 'nhiet_hu', ten: 'Camera nhiệt', nhom: 'mau', ic: '🌡', glsl: 'vec4 c=tx(uv);float l=dot(c.rgb,vec3(.299,.587,.114));vec3 h=vec3(smoothstep(.3,.7,l),smoothstep(.1,.5,l)*(1.-smoothstep(.7,1.,l)),1.-smoothstep(.2,.6,l));return vec4(mix(c.rgb,h,muc),1.);' },
  { id: 'guong_doi', ten: 'Gương đối xứng', nhom: 'khung', ic: '🪞', glsl: 'vec2 p=vec2(uv.x>.5?1.-uv.x:uv.x,uv.y);return mix(tx(uv),tx(p),muc);' },
  { id: 'bon_o', ten: 'Bốn ô', nhom: 'khung', ic: '▦', glsl: 'vec2 p=fract(uv*2.);return mix(tx(uv),tx(p),muc);' },
  { id: 'hop_thu', ten: 'Khung điện ảnh', nhom: 'khung', ic: '▬', glsl: 'float b=.1*muc;float m=step(b,uv.y)*step(uv.y,1.-b);return vec4(tx(uv).rgb*m,1.);' },
  { id: 'vien_bo', ten: 'Viền bo tối', nhom: 'khung', ic: '▢', glsl: 'vec2 c=abs(uv-.5)*2.;float d=length(max(c-vec2(.75),0.));float m=1.-smoothstep(.1,.25,d)*muc;return vec4(tx(uv).rgb*m,1.);' },
  { id: 'ong_nhom', ten: 'Ống nhòm', nhom: 'khung', ic: '🔭', glsl: 'vec2 c=uv-.5;c.x*=res.x/res.y;float d=min(length(c-vec2(.18,0.)),length(c+vec2(.18,0.)));float m=1.-smoothstep(.28,.3,d)*muc;return vec4(tx(uv).rgb*m,1.);' },
  { id: 'mat_ca_hu', ten: 'Mắt cá', nhom: 'khung', ic: '🐟', glsl: 'vec2 c=uv*2.-1.;float r=length(c);vec2 p=c*mix(1.,r*r*.5+.5,muc);return tx(p*.5+.5);' },
  { id: 'den_san_khau', ten: 'Đèn sân khấu', nhom: 'sang', ic: '🔦', glsl: 'vec2 c=uv-vec2(.5+.3*sin(t*.8),.5);c.x*=res.x/res.y;float m=mix(1.,smoothstep(.45,.1,length(c)),muc);return vec4(tx(uv).rgb*(.25+.75*m),1.);' },
  { id: 'neon_nhay', ten: 'Neon chập chờn', nhom: 'sang', ic: '💡', glsl: 'float f=.8+.2*step(.5,rnd(vec2(floor(t*12.),5.)));vec4 c=tx(uv);return vec4(c.rgb*mix(1.,f,muc)+muc*.15*vec3(.6,.1,1.)*(1.-f),1.);' },
  { id: 'bui_bay', ten: 'Bụi bay', nhom: 'hat', ic: '✨', glsl: 'float d=0.;for(int i=0;i<3;i++){vec2 p=uv*vec2(20.,36.)+vec2(t*(.3+float(i)*.2),-t*(.5+float(i)*.3));d+=smoothstep(.97,1.,nse(p));}return vec4(tx(uv).rgb+d*.6*muc,1.);' },
  { id: 'lap_lanh', ten: 'Lấp lánh', nhom: 'hat', ic: '🌟', glsl: 'float d=0.;for(int i=0;i<3;i++){vec2 p=uv*vec2(30.,30.)+vec2(0.,-t*(2.+float(i)));float r=rnd(floor(p));d+=step(.985,r)*smoothstep(.8,0.,length(fract(p)-.5)*2.)*step(.5,fract(t*3.+r*7.));}return vec4(tx(uv).rgb+d*muc,1.);' },
];
KHO.nhomHieuUng = { hong: 'Hỏng hóc · retro', bien: 'Biến dạng', dong: 'Chuyển động', mau: 'Màu sắc', khung: 'Khung hình', sang: 'Ánh sáng', nghe: 'Nghệ thuật', hat: 'Thời tiết · hạt' };

/* ── CHUYỂN CẢNH thêm, viết theo chuẩn gl-transitions: vec4 transition(vec2 uv) với getFromColor/getToColor, progress, ratio ── */
KHO.chuyenCanh = [
  { id: 'vs_zoom_xoay', ten: 'Zoom xoay', ic: '🌀', glsl: 'vec4 transition(vec2 uv){float p=progress;float a=p*p*(3.-2.*p);vec2 c=uv-.5;float r=mix(1.,.2,a)+(1.-mix(1.,.2,a))*step(.5,p);float ang=a*3.14159*(1.-step(.5,p))*2.;mat2 m=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));vec2 q=m*c*(p<.5?1.+a*2.:1.+(1.-a)*2.)+.5;return p<.5?getFromColor(clamp(q,0.,1.)):getToColor(clamp(q,0.,1.));}' },
  { id: 'vs_whip_doc', ten: 'Whip dọc', ic: '⬇', glsl: 'vec4 transition(vec2 uv){float a=smoothstep(0.,1.,progress);float d=sin(a*3.14159)*.12;vec4 c=vec4(0.);for(int i=0;i<8;i++){float f=float(i)/8.;vec2 o=vec2(0.,d*(f-.5));c+=mix(getFromColor(fract(uv+vec2(0.,a)+o)),getToColor(fract(uv+vec2(0.,a-1.)+o)),a);}return c/8.;}' },
  { id: 'vs_phong_sang', ten: 'Phóng sáng', ic: '🔆', glsl: 'vec4 transition(vec2 uv){float a=progress;float z=1.+a*.6;vec4 f=getFromColor((uv-.5)/z+.5);vec4 t=getToColor((uv-.5)*(1.6-.6*a)/1.+.5);float w=sin(a*3.14159);return mix(f,t,a)+vec4(w*w*.9);}' },
  { id: 'vs_man_tre', ten: 'Mành trượt', ic: '🪟', glsl: 'vec4 transition(vec2 uv){float n=8.;float i=floor(uv.x*n);float d=i/n*.4;float a=clamp((progress-d)/(1.-.4),0.,1.);return mix(getFromColor(uv),getToColor(uv),smoothstep(0.,1.,a));}' },
  { id: 'vs_o_vuong', ten: 'Ô vuông', ic: '▦', glsl: 'vec4 transition(vec2 uv){vec2 g=floor(uv*vec2(10.,18.));float r=fract(sin(dot(g,vec2(12.9898,78.233)))*43758.5453);return mix(getFromColor(uv),getToColor(uv),step(r,progress));}' },
  { id: 'vs_tron_nhoe', ten: 'Tròn nhoè', ic: '◯', glsl: 'vec4 transition(vec2 uv){vec2 c=(uv-.5)*vec2(ratio,1.);float d=length(c);float e=progress*1.2;float m=smoothstep(e-.15,e,d);return mix(getToColor(uv),getFromColor(uv),m);}' },
  { id: 'vs_lat_trang', ten: 'Lật trang', ic: '📖', glsl: 'vec4 transition(vec2 uv){float a=progress;float x=1.-a;if(uv.x>x)return getToColor(uv);float s=(x-uv.x)/max(x,1e-3);vec2 q=vec2(uv.x/x,uv.y);vec4 f=getFromColor(q);f.rgb*=1.-.35*(1.-s)*a;return f;}' },
  { id: 'vs_nhoe_sang', ten: 'Nhoè sáng', ic: '✨', glsl: 'vec4 transition(vec2 uv){float a=progress;float b=sin(a*3.14159);vec4 c=vec4(0.);for(int i=0;i<6;i++){float f=(float(i)/5.-.5)*b*.08;c+=mix(getFromColor(uv+vec2(f,0.)),getToColor(uv+vec2(f,0.)),a);}c/=6.;c.rgb+=b*b*.5;return c;}' },
  { id: 'vs_glitch_manh', ten: 'Glitch mạnh', ic: '📺', glsl: 'float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}vec4 transition(vec2 uv){float a=progress;float b=floor(uv.y*24.);float r=hs(vec2(b,floor(a*12.)));float d=(r-.5)*sin(a*3.14159)*.3;vec2 p=fract(uv+vec2(d,0.));vec4 f=getFromColor(p),t=getToColor(p);vec4 c=mix(f,t,step(hs(vec2(b,1.)),a));c.r=mix(getFromColor(p+vec2(.02,0.)),getToColor(p+vec2(.02,0.)),a).r;return c;}' },
  { id: 'vs_mo_den', ten: 'Mờ qua đen', ic: '⬛', glsl: 'vec4 transition(vec2 uv){float a=progress;return a<.5?getFromColor(uv)*(1.-a*2.):getToColor(uv)*((a-.5)*2.);}' },
  { id: 'vs_mo_trang', ten: 'Mờ qua trắng', ic: '⬜', glsl: 'vec4 transition(vec2 uv){float a=progress;return a<.5?mix(getFromColor(uv),vec4(1.),a*2.):mix(vec4(1.),getToColor(uv),(a-.5)*2.);}' },
  { id: 'vs_keo_cheo', ten: 'Kéo chéo', ic: '◩', glsl: 'vec4 transition(vec2 uv){float a=progress*1.2-.1;float m=smoothstep(a-.08,a+.08,(uv.x+uv.y)*.5);return mix(getToColor(uv),getFromColor(uv),m);}' },
  { id: 'vs_xoay_3d', ten: 'Xoay 3D', ic: '🔁', glsl: 'vec4 transition(vec2 uv){float a=progress;float ang=a*3.14159;float c=cos(ang);vec2 q=uv;q.x=(uv.x-.5)/max(abs(c),1e-3)+.5;if(q.x<0.||q.x>1.)return vec4(0.,0.,0.,1.);float sh=.8+.2*abs(c);return (c>0.?getFromColor(q):getToColor(vec2(1.-q.x,q.y)))*vec4(vec3(sh),1.);}' },
  { id: 'vs_phong_to_di', ten: 'Phóng to đi', ic: '🔍', glsl: 'vec4 transition(vec2 uv){float a=smoothstep(0.,1.,progress);float z=1.+a*3.;vec4 f=getFromColor((uv-.5)/z+.5);f.rgb*=1.-a;vec4 t=getToColor(uv);return mix(t,f,1.-a);}' },
  { id: 'vs_truot_mo', ten: 'Trượt mờ lên', ic: '⬆', glsl: 'vec4 transition(vec2 uv){float a=smoothstep(0.,1.,progress);vec4 f=getFromColor(uv+vec2(0.,a*.3));vec4 t=getToColor(uv-vec2(0.,(1.-a)*.3));return mix(f,t,a);}' },
  { id: 'vs_tim', ten: 'Trái tim', ic: '❤', glsl: 'float ht(vec2 p){p.y-=.25;float a=atan(p.x,p.y)/3.14159;float r=length(p);float h=abs(a);float d=(13.*h-22.*h*h+10.*h*h*h)/(6.-5.*h);return r-d*.6;}vec4 transition(vec2 uv){vec2 p=(uv-.5)*vec2(ratio,1.)/max(progress*1.6,1e-3);return ht(p)<0.?getToColor(uv):getFromColor(uv);}' },
  { id: 'vs_ngoi_sao', ten: 'Ngôi sao', ic: '⭐', glsl: 'vec4 transition(vec2 uv){vec2 p=(uv-.5)*vec2(ratio,1.);float a=atan(p.y,p.x);float r=length(p);float s=.5+.5*cos(a*5.);float e=progress*progress*1.6*(.55+.45*s);return r<e?getToColor(uv):getFromColor(uv);}' },
  { id: 'vs_soc_ngang', ten: 'Sọc ngang', ic: '☰', glsl: 'vec4 transition(vec2 uv){float n=10.;float i=floor(uv.y*n);float dir=mod(i,2.)*2.-1.;float a=smoothstep(0.,1.,progress);vec2 q=uv;q.x=fract(uv.x+dir*a);return a<1.?mix(getFromColor(q),getToColor(q),step(fract(uv.x+dir*a*1.),a)):getToColor(uv);}' },
  { id: 'vs_nhip_tim', ten: 'Nhịp đập', ic: '💓', glsl: 'vec4 transition(vec2 uv){float a=progress;float b=abs(sin(a*3.14159*2.))*.1;vec2 q=(uv-.5)/(1.+b)+.5;return mix(getFromColor(q),getToColor(q),smoothstep(.3,.7,a));}' },
  { id: 'vs_cuon_tron', ten: 'Cuộn tròn', ic: '🌪', glsl: 'vec4 transition(vec2 uv){vec2 c=(uv-.5)*vec2(ratio,1.);float r=length(c),an=atan(c.y,c.x);float a=progress;an+=(1.-a)*a*4.*(1.-r);vec2 q=vec2(cos(an),sin(an))*r/vec2(ratio,1.)+.5;return mix(getFromColor(clamp(q,0.,1.)),getToColor(clamp(q,0.,1.)),smoothstep(.2,.8,a));}' },
  /* 10/2026 · thêm 15 chuyển cảnh */
  { id: 'vs_tron_mo', ten: 'Tròn mở ra', ic: '⭕', glsl: 'vec4 transition(vec2 uv){vec2 c=uv-.5;c.x*=ratio;float d=length(c);float r=progress*1.2;float m=1.-smoothstep(r-.05,r,d);return mix(getFromColor(uv),getToColor(uv),m);}' },
  { id: 'vs_tron_dong', ten: 'Tròn khép lại', ic: '🎯', glsl: 'vec4 transition(vec2 uv){vec2 c=uv-.5;c.x*=ratio;float d=length(c);float r=(1.-progress)*1.2;float m=smoothstep(r-.05,r,d);return mix(getFromColor(uv),getToColor(uv),m);}' },
  { id: 'vs_rem_soc', ten: 'Rèm sọc', ic: '🪟', glsl: 'vec4 transition(vec2 uv){float f=fract(uv.x*8.);float m=step(f,progress);return mix(getFromColor(uv),getToColor(uv),m);}' },
  { id: 'vs_o_ngau_nhien', ten: 'Ô vuông ngẫu nhiên', ic: '🧩', glsl: 'vec4 transition(vec2 uv){vec2 g=floor(uv*vec2(12.*ratio,12.));float r=fract(sin(dot(g,vec2(12.9898,78.233)))*43758.5453);return mix(getFromColor(uv),getToColor(uv),step(r,progress));}' },
  { id: 'vs_day_trai', ten: 'Đẩy sang trái', ic: '⬅', glsl: 'vec4 transition(vec2 uv){vec2 a=uv+vec2(progress,0.);return a.x<1.?getFromColor(a):getToColor(uv+vec2(progress-1.,0.));}' },
  { id: 'vs_day_len', ten: 'Đẩy lên', ic: '⬆', glsl: 'vec4 transition(vec2 uv){vec2 a=uv+vec2(0.,progress);return a.y<1.?getFromColor(a):getToColor(uv+vec2(0.,progress-1.));}' },
  { id: 'vs_quet_phai', ten: 'Quét sang phải', ic: '➡', glsl: 'vec4 transition(vec2 uv){float m=smoothstep(progress-.02,progress,uv.x);return mix(getToColor(uv),getFromColor(uv),m);}' },
  { id: 'vs_quet_cheo', ten: 'Quét chéo', ic: '↗', glsl: 'vec4 transition(vec2 uv){float m=smoothstep(progress-.03,progress,(uv.x+uv.y)*.5);return mix(getToColor(uv),getFromColor(uv),m);}' },
  { id: 'vs_zoom_mo', ten: 'Zoom mờ dần', ic: '🔎', glsl: 'vec4 transition(vec2 uv){float z=1.+progress*.3;vec4 a=getFromColor((uv-.5)/z+.5);float z2=1.3-progress*.3;vec4 b=getToColor((uv-.5)/z2+.5);return mix(a,b,smoothstep(.2,.8,progress));}' },
  { id: 'vs_loe_trang', ten: 'Loé trắng', ic: '⚪', glsl: 'vec4 transition(vec2 uv){float f=sin(progress*3.14159);vec4 c=mix(getFromColor(uv),getToColor(uv),step(.5,progress));return mix(c,vec4(1.),f*f);}' },
  { id: 'vs_chim_den', ten: 'Chìm đen', ic: '⚫', glsl: 'vec4 transition(vec2 uv){float f=sin(progress*3.14159);vec4 c=mix(getFromColor(uv),getToColor(uv),step(.5,progress));return c*(1.-f);}' },
  { id: 'vs_xoan_oc', ten: 'Xoắn ốc', ic: '🌪', glsl: 'vec4 transition(vec2 uv){vec2 c=uv-.5;float r=length(c);float a=atan(c.y,c.x)+sin(progress*3.14159)*4.*(1.-r);vec2 p=vec2(cos(a),sin(a))*r+.5;return mix(getFromColor(p),getToColor(p),progress);}' },
  { id: 'vs_song_nuoc', ten: 'Sóng nước', ic: '🌊', glsl: 'vec4 transition(vec2 uv){vec2 c=uv-.5;float d=length(c);float w=sin(d*40.-progress*12.)*.02*sin(progress*3.14159);vec2 p=uv+c/max(d,1e-3)*w;return mix(getFromColor(p),getToColor(p),progress);}' },
  { id: 'vs_cua_mo', ten: 'Cửa mở hai bên', ic: '🚪', glsl: 'vec4 transition(vec2 uv){float h=abs(uv.x-.5)*2.;return mix(getFromColor(uv),getToColor(uv),1.-smoothstep(progress-.03,progress,h));}' },
  { id: 'vs_nhoe_doc', ten: 'Nhoè dọc hoà tan', ic: '〰', glsl: 'vec4 transition(vec2 uv){vec4 a=vec4(0.),b=vec4(0.);for(int i=0;i<6;i++){float o=(float(i)/5.-.5)*.08*sin(progress*3.14159);a+=getFromColor(uv+vec2(0.,o));b+=getToColor(uv+vec2(0.,o));}return mix(a,b,progress)/6.;}' },
];

/* ── ÂM THANH tổng hợp tại máy (không file, không bản quyền). Mỗi mục: id, tên, icon, nhóm, dai (giây), cong = danh sách lớp:
   { k:'osc', w: sine|square|sawtooth|triangle, f:[đầu, cuối], ramp:'exp'|'lin', tre, dai, g, a (attack), d (decay tới 0 ở cuối) }
   { k:'nhieu', loc:[kieu, fĐầu, fCuối, Q], tre, dai, g, a }
   lap: { n, moi } lặp cả công thức n lần cách nhau moi giây ── */
KHO.amThanh = [
  // Chuyển động
  { id: 'whoosh_ngan', ten: 'Whoosh ngắn', ic: '💨', nhom: 'dong', dai: 0.35, cong: [{ k: 'nhieu', loc: ['bandpass', 400, 5000, 1.5], dai: 0.35, g: 0.9, a: 0.1 }] },
  { id: 'whoosh_dai', ten: 'Whoosh dài', ic: '🌬', nhom: 'dong', dai: 1.1, cong: [{ k: 'nhieu', loc: ['bandpass', 200, 3500, 1.2], dai: 1.1, g: 0.9, a: 0.45 }] },
  { id: 'whoosh_dao', ten: 'Whoosh đảo', ic: '↩', nhom: 'dong', dai: 0.7, cong: [{ k: 'nhieu', loc: ['bandpass', 4000, 300, 1.4], dai: 0.7, g: 0.9, a: 0.5 }] },
  { id: 'swish', ten: 'Swish', ic: '〰', nhom: 'dong', dai: 0.25, cong: [{ k: 'nhieu', loc: ['highpass', 3000, 8000, 1], dai: 0.25, g: 0.7, a: 0.05 }] },
  { id: 'truot', ten: 'Trượt lên', ic: '📈', nhom: 'dong', dai: 0.5, cong: [{ k: 'osc', w: 'sine', f: [300, 1200], dai: 0.5, g: 0.5, a: 0.02 }] },
  { id: 'truot_xuong', ten: 'Trượt xuống', ic: '📉', nhom: 'dong', dai: 0.5, cong: [{ k: 'osc', w: 'sine', f: [1200, 200], dai: 0.5, g: 0.5, a: 0.02 }] },
  { id: 'xoay_vut', ten: 'Xoay vút', ic: '🌀', nhom: 'dong', dai: 0.8, cong: [{ k: 'osc', w: 'sawtooth', f: [200, 2400], dai: 0.8, g: 0.18, a: 0.05 }, { k: 'nhieu', loc: ['bandpass', 500, 6000, 2], dai: 0.8, g: 0.5, a: 0.3 }] },
  // Va chạm
  { id: 'boom_sau', ten: 'Boom sâu', ic: '💥', nhom: 'va', dai: 1.4, cong: [{ k: 'osc', w: 'sine', f: [120, 30], dai: 1.4, g: 1, a: 0.01 }, { k: 'nhieu', loc: ['lowpass', 500, 80, 1], dai: 0.6, g: 0.5, a: 0.005 }] },
  { id: 'hit', ten: 'Hit', ic: '👊', nhom: 'va', dai: 0.4, cong: [{ k: 'osc', w: 'sine', f: [180, 50], dai: 0.4, g: 0.9, a: 0.003 }, { k: 'nhieu', loc: ['bandpass', 1500, 400, 1], dai: 0.12, g: 0.6, a: 0.002 }] },
  { id: 'thud', ten: 'Thịch', ic: '🪨', nhom: 'va', dai: 0.3, cong: [{ k: 'osc', w: 'triangle', f: [90, 40], dai: 0.3, g: 0.9, a: 0.003 }] },
  { id: 'punch', ten: 'Đấm', ic: '🥊', nhom: 'va', dai: 0.25, cong: [{ k: 'nhieu', loc: ['lowpass', 900, 150, 1], dai: 0.25, g: 1, a: 0.002 }, { k: 'osc', w: 'sine', f: [140, 60], dai: 0.2, g: 0.6, a: 0.002 }] },
  { id: 'trong_kick', ten: 'Trống kick', ic: '🥁', nhom: 'va', dai: 0.35, cong: [{ k: 'osc', w: 'sine', f: [150, 45], dai: 0.35, g: 1, a: 0.002 }] },
  { id: 'trong_snare', ten: 'Trống snare', ic: '🥁', nhom: 'va', dai: 0.25, cong: [{ k: 'nhieu', loc: ['highpass', 1200, 1200, 0.7], dai: 0.25, g: 0.8, a: 0.002 }, { k: 'osc', w: 'triangle', f: [220, 160], dai: 0.12, g: 0.5, a: 0.002 }] },
  { id: 'hihat', ten: 'Hi-hat', ic: '🎩', nhom: 'va', dai: 0.08, cong: [{ k: 'nhieu', loc: ['highpass', 7000, 7000, 1], dai: 0.08, g: 0.6, a: 0.001 }] },
  { id: 'vo_tay', ten: 'Vỗ tay', ic: '👏', nhom: 'va', dai: 0.9, cong: [{ k: 'nhieu', loc: ['bandpass', 1800, 1800, 1.5], dai: 0.06, g: 0.7, a: 0.002 }], lap: { n: 9, moi: 0.1, ngau: 0.03 } },
  { id: 'cymbal', ten: 'Chũm choẹ', ic: '🔔', nhom: 'va', dai: 1.6, cong: [{ k: 'nhieu', loc: ['highpass', 5000, 3000, 0.8], dai: 1.6, g: 0.6, a: 0.003 }] },
  // Giao diện · thông báo
  { id: 'pop_nho', ten: 'Pop nhỏ', ic: '🫧', nhom: 'ui', dai: 0.12, cong: [{ k: 'osc', w: 'sine', f: [1100, 300], dai: 0.12, g: 0.7, a: 0.003 }] },
  { id: 'bong_bong', ten: 'Bong bóng', ic: '🫧', nhom: 'ui', dai: 0.2, cong: [{ k: 'osc', w: 'sine', f: [400, 1600], dai: 0.2, g: 0.6, a: 0.005 }] },
  { id: 'click_nhe', ten: 'Click nhẹ', ic: '🖱', nhom: 'ui', dai: 0.05, cong: [{ k: 'nhieu', loc: ['highpass', 2500, 2500, 1], dai: 0.05, g: 0.8, a: 0.001 }] },
  { id: 'go_phim', ten: 'Gõ phím', ic: '⌨', nhom: 'ui', dai: 1.2, cong: [{ k: 'nhieu', loc: ['bandpass', 2500, 1800, 2], dai: 0.04, g: 0.6, a: 0.001 }], lap: { n: 10, moi: 0.11, ngau: 0.04 } },
  { id: 'ding', ten: 'Ding', ic: '🔔', nhom: 'ui', dai: 1.0, cong: [{ k: 'osc', w: 'sine', f: [1320, 1320], dai: 1.0, g: 0.6, a: 0.004 }, { k: 'osc', w: 'sine', f: [2640, 2640], dai: 0.6, g: 0.25, a: 0.004 }] },
  { id: 'chuong_2', ten: 'Chuông 2 nốt', ic: '🎐', nhom: 'ui', dai: 1.0, cong: [{ k: 'osc', w: 'sine', f: [880, 880], dai: 0.6, g: 0.6, a: 0.004 }, { k: 'osc', w: 'sine', f: [1320, 1320], tre: 0.18, dai: 0.8, g: 0.6, a: 0.004 }] },
  { id: 'thanh_cong', ten: 'Thành công', ic: '✅', nhom: 'ui', dai: 0.9, cong: [{ k: 'osc', w: 'triangle', f: [523, 523], dai: 0.3, g: 0.5, a: 0.005 }, { k: 'osc', w: 'triangle', f: [659, 659], tre: 0.12, dai: 0.3, g: 0.5, a: 0.005 }, { k: 'osc', w: 'triangle', f: [784, 784], tre: 0.24, dai: 0.6, g: 0.6, a: 0.005 }] },
  { id: 'loi', ten: 'Lỗi', ic: '❌', nhom: 'ui', dai: 0.5, cong: [{ k: 'osc', w: 'square', f: [220, 220], dai: 0.22, g: 0.35, a: 0.005 }, { k: 'osc', w: 'square', f: [180, 180], tre: 0.25, dai: 0.25, g: 0.35, a: 0.005 }] },
  { id: 'thong_bao', ten: 'Thông báo', ic: '📳', nhom: 'ui', dai: 0.6, cong: [{ k: 'osc', w: 'sine', f: [988, 988], dai: 0.18, g: 0.6, a: 0.004 }, { k: 'osc', w: 'sine', f: [1319, 1319], tre: 0.2, dai: 0.4, g: 0.6, a: 0.004 }] },
  { id: 'rung_dien_thoai', ten: 'Rung điện thoại', ic: '📱', nhom: 'ui', dai: 1.2, cong: [{ k: 'osc', w: 'square', f: [55, 55], dai: 0.4, g: 0.35, a: 0.01 }, { k: 'nhieu', loc: ['lowpass', 200, 200, 1], dai: 0.4, g: 0.3, a: 0.01 }], lap: { n: 2, moi: 0.6 } },
  { id: 'tien_xu', ten: 'Tiền xu', ic: '🪙', nhom: 'ui', dai: 0.6, cong: [{ k: 'osc', w: 'square', f: [1760, 1760], dai: 0.08, g: 0.3, a: 0.002 }, { k: 'osc', w: 'square', f: [2349, 2349], tre: 0.08, dai: 0.5, g: 0.3, a: 0.002 }] },
  { id: 'may_tinh_tien', ten: 'Máy tính tiền', ic: '💰', nhom: 'ui', dai: 0.7, cong: [{ k: 'nhieu', loc: ['bandpass', 3000, 2500, 3], dai: 0.05, g: 0.6, a: 0.001 }, { k: 'osc', w: 'sine', f: [2200, 2200], tre: 0.12, dai: 0.5, g: 0.5, a: 0.003 }, { k: 'osc', w: 'sine', f: [3300, 3300], tre: 0.12, dai: 0.4, g: 0.2, a: 0.003 }] },
  { id: 'chup_anh', ten: 'Chụp ảnh', ic: '📸', nhom: 'ui', dai: 0.3, cong: [{ k: 'nhieu', loc: ['bandpass', 3500, 1500, 2], dai: 0.04, g: 0.9, a: 0.001 }, { k: 'nhieu', loc: ['bandpass', 1500, 3500, 2], tre: 0.1, dai: 0.05, g: 0.7, a: 0.001 }] },
  // Căng thẳng · kịch tính
  { id: 'riser_ngan', ten: 'Riser ngắn', ic: '📈', nhom: 'kich', dai: 1.2, cong: [{ k: 'nhieu', loc: ['bandpass', 200, 6000, 3], dai: 1.2, g: 0.8, a: 1.1 }, { k: 'osc', w: 'sawtooth', f: [110, 880], dai: 1.2, g: 0.15, a: 1.1 }] },
  { id: 'riser_dai', ten: 'Riser dài', ic: '📈', nhom: 'kich', dai: 3.0, cong: [{ k: 'nhieu', loc: ['bandpass', 150, 7000, 3], dai: 3.0, g: 0.8, a: 2.8 }, { k: 'osc', w: 'sawtooth', f: [80, 1200], dai: 3.0, g: 0.15, a: 2.8 }] },
  { id: 'downlifter', ten: 'Rơi xuống', ic: '📉', nhom: 'kich', dai: 1.5, cong: [{ k: 'nhieu', loc: ['bandpass', 6000, 150, 2], dai: 1.5, g: 0.8, a: 0.05 }, { k: 'osc', w: 'sawtooth', f: [900, 60], dai: 1.5, g: 0.15, a: 0.05 }] },
  { id: 'tim_dap', ten: 'Tim đập', ic: '💓', nhom: 'kich', dai: 1.0, cong: [{ k: 'osc', w: 'sine', f: [70, 40], dai: 0.25, g: 0.9, a: 0.01 }, { k: 'osc', w: 'sine', f: [60, 35], tre: 0.3, dai: 0.3, g: 0.7, a: 0.01 }] },
  { id: 'hoi_hop', ten: 'Hồi hộp', ic: '😰', nhom: 'kich', dai: 2.5, cong: [{ k: 'osc', w: 'sine', f: [55, 58], dai: 2.5, g: 0.6, a: 1.5 }, { k: 'osc', w: 'sine', f: [110, 116], dai: 2.5, g: 0.2, a: 1.5 }] },
  { id: 'dem_nguoc', ten: 'Đếm ngược 3-2-1', ic: '⏱', nhom: 'kich', dai: 3.2, cong: [{ k: 'osc', w: 'square', f: [880, 880], dai: 0.12, g: 0.3, a: 0.003 }, { k: 'osc', w: 'square', f: [880, 880], tre: 1, dai: 0.12, g: 0.3, a: 0.003 }, { k: 'osc', w: 'square', f: [880, 880], tre: 2, dai: 0.12, g: 0.3, a: 0.003 }, { k: 'osc', w: 'square', f: [1760, 1760], tre: 3, dai: 0.2, g: 0.35, a: 0.003 }] },
  { id: 'dong_ho', ten: 'Đồng hồ tích tắc', ic: '🕰', nhom: 'kich', dai: 2.0, cong: [{ k: 'osc', w: 'square', f: [2400, 2400], dai: 0.03, g: 0.3, a: 0.001 }, { k: 'osc', w: 'square', f: [1800, 1800], tre: 0.5, dai: 0.03, g: 0.3, a: 0.001 }], lap: { n: 2, moi: 1.0 } },
  { id: 'coi_bao', ten: 'Còi báo động', ic: '🚨', nhom: 'kich', dai: 1.6, cong: [{ k: 'osc', w: 'sawtooth', f: [600, 1100], dai: 0.8, g: 0.25, a: 0.05 }, { k: 'osc', w: 'sawtooth', f: [1100, 600], tre: 0.8, dai: 0.8, g: 0.25, a: 0.05 }] },
  // Vui nhộn
  { id: 'boing', ten: 'Boing', ic: '🤸', nhom: 'vui', dai: 0.6, cong: [{ k: 'osc', w: 'triangle', f: [400, 90], dai: 0.6, g: 0.6, a: 0.005 }, { k: 'osc', w: 'triangle', f: [800, 180], dai: 0.6, g: 0.25, a: 0.005 }] },
  { id: 'huyt_sao', ten: 'Huýt sáo trượt', ic: '😗', nhom: 'vui', dai: 0.8, cong: [{ k: 'osc', w: 'sine', f: [600, 2400], dai: 0.45, g: 0.5, a: 0.02 }, { k: 'osc', w: 'sine', f: [2400, 500], tre: 0.45, dai: 0.35, g: 0.5, a: 0.01 }] },
  { id: 'laser', ten: 'Laser', ic: '🔫', nhom: 'vui', dai: 0.3, cong: [{ k: 'osc', w: 'square', f: [2800, 200], dai: 0.3, g: 0.3, a: 0.002 }] },
  { id: 'zap', ten: 'Zap điện', ic: '⚡', nhom: 'vui', dai: 0.25, cong: [{ k: 'nhieu', loc: ['bandpass', 3000, 800, 4], dai: 0.25, g: 0.8, a: 0.002 }, { k: 'osc', w: 'square', f: [1500, 300], dai: 0.2, g: 0.2, a: 0.002 }] },
  { id: 'phep_thuat', ten: 'Phép thuật', ic: '✨', nhom: 'vui', dai: 1.0, cong: [{ k: 'osc', w: 'sine', f: [1047, 1047], dai: 0.5, g: 0.35, a: 0.01 }, { k: 'osc', w: 'sine', f: [1319, 1319], tre: 0.08, dai: 0.5, g: 0.35, a: 0.01 }, { k: 'osc', w: 'sine', f: [1568, 1568], tre: 0.16, dai: 0.5, g: 0.35, a: 0.01 }, { k: 'osc', w: 'sine', f: [2093, 2093], tre: 0.24, dai: 0.7, g: 0.35, a: 0.01 }] },
  { id: 'cuoi_de', ten: 'Dế kêu (im lặng)', ic: '🦗', nhom: 'vui', dai: 1.5, cong: [{ k: 'osc', w: 'sine', f: [4200, 4200], dai: 0.06, g: 0.25, a: 0.005 }], lap: { n: 12, moi: 0.12 } },
  { id: 'that_bai', ten: 'Thất bại (wah wah)', ic: '😩', nhom: 'vui', dai: 1.4, cong: [{ k: 'osc', w: 'sawtooth', f: [392, 370], dai: 0.35, g: 0.25, a: 0.01 }, { k: 'osc', w: 'sawtooth', f: [370, 349], tre: 0.35, dai: 0.35, g: 0.25, a: 0.01 }, { k: 'osc', w: 'sawtooth', f: [349, 330], tre: 0.7, dai: 0.35, g: 0.25, a: 0.01 }, { k: 'osc', w: 'sawtooth', f: [330, 250], tre: 1.05, dai: 0.35, g: 0.25, a: 0.01 }] },
  // Môi trường
  { id: 'gio', ten: 'Gió', ic: '🌬', nhom: 'moi', dai: 4.0, cong: [{ k: 'nhieu', loc: ['bandpass', 300, 700, 0.6], dai: 4.0, g: 0.5, a: 1.5 }] },
  { id: 'mua_roi', ten: 'Mưa', ic: '🌧', nhom: 'moi', dai: 4.0, cong: [{ k: 'nhieu', loc: ['highpass', 1500, 1500, 0.5], dai: 4.0, g: 0.35, a: 0.8 }] },
  { id: 'song_bien', ten: 'Sóng biển', ic: '🌊', nhom: 'moi', dai: 5.0, cong: [{ k: 'nhieu', loc: ['lowpass', 300, 1800, 0.7], dai: 2.6, g: 0.6, a: 1.4 }, { k: 'nhieu', loc: ['lowpass', 1800, 250, 0.7], tre: 2.4, dai: 2.6, g: 0.5, a: 0.3 }] },
  { id: 'nhieu_trang', ten: 'Nhiễu trắng', ic: '📻', nhom: 'moi', dai: 1.0, cong: [{ k: 'nhieu', loc: ['highpass', 100, 100, 0.5], dai: 1.0, g: 0.5, a: 0.01 }] },
  { id: 'dong_dien', ten: 'Tiếng ù máy', ic: '🔌', nhom: 'moi', dai: 3.0, cong: [{ k: 'osc', w: 'sawtooth', f: [50, 50], dai: 3.0, g: 0.15, a: 0.3 }, { k: 'osc', w: 'sine', f: [100, 100], dai: 3.0, g: 0.1, a: 0.3 }] },
];
KHO.nhomAmThanh = { dong: 'Chuyển động', va: 'Va chạm · trống', ui: 'Giao diện · thông báo', kich: 'Kịch tính', vui: 'Vui nhộn', moi: 'Môi trường' };
