/* ═════════ GIAO DIỆN KIỂU CAPCUT (bố cục, icon, thao tác học từ OpenCut) ═════════ */
const IC = {
  scissor: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  media: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  audio: '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  sticker: '<path d="M21 12a9 9 0 1 1-9-9h9z"/><path d="M9 10h.01M15 10h.01M8.5 14.5c2 2 5 2 7 0"/>',
  effect: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  trans: '<rect x="3" y="6" width="7" height="12" rx="1"/><rect x="14" y="6" width="7" height="12" rx="1"/><path d="M10 12h4"/>',
  filter: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="15" r="5"/>',
  caption: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15h4M13 15h4M7 11h10"/>',
  shape: '<rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="7" r="4"/><path d="m12 21 4.5-8 4.5 8z"/>',
  ai: '<rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 3v4M9 12h.01M15 12h.01M9.5 15.5h5M2 12v3M22 12v3"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  split: '<path d="M12 3v18"/><path d="M8 7 4 12l4 5M16 7l4 5-4 5"/>',
  delL: '<path d="M15 3v18"/><rect x="3" y="7" width="8" height="10" rx="1.5"/><path d="m5.5 10 3 4m0-4-3 4"/>',
  delR: '<path d="M9 3v18"/><rect x="13" y="7" width="8" height="10" rx="1.5"/><path d="m15.5 10 3 4m0-4-3 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  freeze: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
  mirror: '<path d="M12 3v18"/><path d="M8 7 3 17h5zM16 7l5 10h-5z"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  kf: '<path d="m12 3 9 9-9 9-9-9z"/>',
  wave: '<path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2"/>',
  mark: '<path d="M6 3h12v15l-6-4-6 4z"/>',
  slip: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  magnet: '<path d="M6 3v8a6 6 0 0 0 12 0V3"/><path d="M6 7h4M14 7h4"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6M11 8v6"/>',
  kbd: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16M17.5 9h1M17.5 12h1M17.5 15h1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  export: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><path d="M3 3l18 18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  vol: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6m0-6 6 6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  mag2: '<path d="M3 19h18"/><path d="M7 4v6a5 5 0 0 0 10 0V4"/><path d="M7 7h3M14 7h3"/>',
  axis: '<path d="M12 2v20"/><rect x="4" y="7" width="16" height="10" rx="2"/>',
  ripple: '<path d="M3 12h7M14 12h7M7 8l-4 4 4 4M17 8l4 4-4 4"/><path d="M12 5v14"/>',
  group: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M11 7h6v6M13 17H7v-6"/>',
  paste: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'
};
function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
/* đồng hồ kiểu CapCut: giờ:phút:giây:khung */
function tc(t) { return fmtTC(t); }
function datTg(tong) { const g = $('#tg'); if (g && !g.querySelector('input')) g.innerHTML = '<b>' + tc(P.t) + '</b> / ' + tc(tong); const t2 = $('#tiLe2'); if (t2 && t2.value !== $('#tiLe').value) t2.value = $('#tiLe').value; }
/* track: ẩn / tắt tiếng / khoá */
function trO(k) { return (P.tr && P.tr[k]) || {}; }
function trAn(k) { return !!trO(k).an || soloAn(k); }
function trTat(k) { return !!trO(k).tat || soloTat(k); }
function trKhoa(k) { return !!trO(k).khoa; }
/* mục m (loại k) có nằm trên track đang khoá không: mọi thao tác sửa đều phải hỏi hàm này, không chỉ lúc kéo */
function khoaMuc(k, m) { if (!m) return false; return trKhoa(k === 'v' ? 'v1' : k === 't' ? 'a2' : k === 'a' ? keyAm(m.lop) : keyLop(lopCua(k, m))); }
function baoKhoa() { toast('Track đang khoá 🔒 · bấm ổ khoá ở đầu track để mở'); }
const TR_NUT = { o2: ['an', 'khoa'], o1: ['an', 'khoa'], v3: ['an', 'khoa'], v2: ['an', 'khoa'], v1: ['tat', 'an', 'khoa'], a2: ['tat', 'khoa'], a3: ['tat', 'khoa'], a1: ['tat', 'khoa'] };
function veTrNut() { $$('.track').forEach(tr => { const k = tr.dataset.track, o = trO(k); tr.classList.toggle('an', !!o.an); tr.classList.toggle('tat', !!o.tat); tr.classList.toggle('khoa', !!o.khoa); tr.querySelectorAll('.trn').forEach(b => { const n = b.dataset.n, bat = !!o[n]; b.innerHTML = ic(n === 'an' ? (bat ? 'eyeOff' : 'eye') : n === 'tat' ? (bat ? 'mute' : 'vol') : (bat ? 'lock' : 'unlock')); b.classList.toggle('bat', bat); b.title = { an: bat ? 'Hiện track' : 'Ẩn track', tat: bat ? 'Bật tiếng track' : 'Tắt tiếng track', khoa: bat ? 'Mở khoá track' : 'Khoá track (không kéo, sửa được)' }[n]; b.setAttribute('aria-pressed', String(bat)); }); }); }
function doiTr(k, n) { P.tr = P.tr || {}; const o = P.tr[k] = P.tr[k] || {}; o[n] = !o[n]; veTrNut(); if (n === 'tat' && P.dang && (k === 'a3' || /^A\d+$/.test(k))) am3BatDau(); if (n === 'tat' && P.dang && k === 'a2') P.tieng.forEach(t => { if (t.el) t.el.muted = trTat('a2'); }); if (!P.dang) veKhung(); }
/* dải khung hình (filmstrip) trên đoạn, như CapCut */
async function taoPhim(s) {
  if (!s || s.phim || s.dangPhim || !s.el || !s.w || !s.h) return; s.dangPhim = true;
  await null;   // không vẽ lại dòng thời gian khi đang ở giữa veTl
  try {
    const fh = 54, fw = Math.max(24, Math.min(110, Math.round(fh * s.w / s.h)));
    if (s.loai !== 'video') { const c = document.createElement('canvas'); c.width = fw; c.height = fh; c.getContext('2d').drawImage(s.el, 0, 0, fw, fh); s.phim = { cv: c, n: 1, buoc: 1e9, fw, fh }; }
    else { const n = Math.max(2, Math.min(60, Math.ceil(s.giay || 2))), buoc = (s.giay || 2) / n, v = elPhu(s, 'elP'), c = document.createElement('canvas'); c.width = fw * n; c.height = fh; const g = c.getContext('2d');
      for (let i = 0; i < n; i++) { await seekTo(v, Math.min((s.giay || 2) - 0.05, (i + 0.5) * buoc)); try { g.drawImage(v, i * fw, 0, fw, fh); } catch { } }
      s.phim = { cv: c, n, buoc, fw, fh }; }
    setTimeout(() => { if (!P.dang) veTl(); }, 0);
  } catch { } s.dangPhim = false;
}
function vePhimItem(d, s, bd, kt, wPx) {
  if (!s) return; if (!s.phim) { taoPhim(s); return; }
  const h = 54, w = Math.min(4000, Math.max(1, Math.round(wPx))), c = el('canvas', 'phim'); c.width = w; c.height = h; const g = c.getContext('2d'), p = s.phim, tw = Math.max(8, Math.round(h * p.fw / p.fh));
  for (let x = 0; x < w; x += tw) { const t = bd + (kt - bd) * Math.min(1, (x + tw / 2) / w), k = Math.max(0, Math.min(p.n - 1, Math.floor(t / p.buoc))); g.drawImage(p.cv, k * p.fw, 0, p.fw, p.fh, x, 0, tw, h); }
  d.insertBefore(c, d.firstChild);
}
/* thẻ trong lưới (ảnh/biểu tượng ở trên, tên ở dưới) */
function theHoa(b, noi, ten, phu) { b.innerHTML = ''; const t = el('div', 'the'); if (typeof noi === 'string') t.innerHTML = noi; else if (noi) t.appendChild(noi); b.appendChild(t); const n = el('div', 'ten', ten); if (phu) n.appendChild(el('small', null, phu)); b.appendChild(n); b.title = ten; }
const HU_IC = { khong: '⦸', rung: '📳', nhip: '💓', chop: '⚡', ro_sang: '🌅', phim_cu: '🎞', nhoe_zoom: '🌀' };
const CH_IC = { cat: '✂', fade: '◐', slide: '➡', zoom: '🔍', wipe: '▧', whip: '💨', flash: '⚡', glitch: '▦', circle: '◯', blur: '≋' };
function anhKhungNho() { try { if (!P.clips.length) return ''; const c = document.createElement('canvas'); c.width = 96; c.height = 96; const sc = Math.max(96 / cv.width, 96 / cv.height); c.getContext('2d').drawImage(cv, 48 - cv.width * sc / 2, 48 - cv.height * sc / 2, cv.width * sc, cv.height * sc); return c.toDataURL('image/jpeg', 0.75); } catch { return ''; } }
function capNhatAnhLoc() { const u = anhKhungNho(); $$('#locLuoi .the img').forEach(im => { if (u) im.src = u; im.hidden = !u; }); }
function datChuyen(k) {
  if (P.clips.length < 2) { toast('Cần ít nhất 2 đoạn trên V1'); return; }
  let i = P.chon && P.chon.k === 'v' ? P.chon.i : -1;
  if (i < 0 || i >= P.clips.length - 1) { let acc = 0, gan = 1e9; P.clips.forEach((c, j) => { acc += daiC(c); if (j < P.clips.length - 1 && Math.abs(acc - P.t) < gan) { gan = Math.abs(acc - P.t); i = j; } }); }
  luuHoanTac(); P.clips[i].chuyen = k; P.clips[i].chuyen_dai = +$('#chuyenDai').value; if (k !== 'cat') gltNap(); veTl(); veKhung();
  $$('#chuyenLuoi button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k))); toast('Chuyển cảnh “' + CHUYEN_TEN[k] + '” sau đoạn ' + (i + 1));
}
/* cột danh mục bên trái mỗi tab: bấm để cuộn tới nhóm */
const BEN_TEN = { 'Hiệu ứng âm theo chủ đề (trực tuyến)': 'Kho online', 'Hiệu ứng âm thanh': 'Hiệu ứng âm', 'Ghi âm & tách tiếng': 'Ghi âm', 'Nhạc theo chủ đề (miễn phí, dùng thương mại)': 'Nhạc chủ đề', 'Nhạc nền': 'Nhạc nền', 'Nhãn dán động (Noto Emoji · Google)': 'Nhãn động', 'Nhãn dán động (Noto, miễn phí)': 'Nhãn động', 'Hiệu ứng video': 'Hiệu ứng', 'Nền khung (khi hình không phủ kín)': 'Nền khung', 'Mẫu chữ': 'Mẫu chữ', 'Mẫu dựng sẵn': 'Mẫu sẵn' };
function benTen(t) { t = String(t || '').trim(); if (BEN_TEN[t]) return BEN_TEN[t]; const g = t.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim(); return g.length > 18 ? g.slice(0, 17).trim() + '…' : g; }
function taoBen(pane) {
  const hs = [...pane.querySelectorAll('h3.pt')]; if (hs.length < 2 || pane.querySelector('.ben')) return;
  const ben = el('nav', 'ben'), noi = el('div', 'noi'); while (pane.firstChild) noi.appendChild(pane.firstChild); pane.appendChild(ben); pane.appendChild(noi); pane.classList.add('coBen');
  const ve = () => { ben.innerHTML = ''; hs.forEach(h => { if (!h.offsetParent && pane.classList.contains('on')) return; const b = el('button', null, benTen(h.textContent)); b.type = 'button'; b.title = h.textContent.trim(); b.onclick = () => { noi.scrollTo({ top: h.offsetTop - noi.offsetTop - 6, behavior: 'smooth' }); }; b._h = h; ben.appendChild(b); }); soi(); };
  const soi = () => { const bs = [...ben.children]; let cur = bs[0]; bs.forEach(b => { if (b._h.offsetTop - noi.offsetTop - 30 <= noi.scrollTop) cur = b; }); bs.forEach(b => b.classList.toggle('on', b === cur)); };
  noi.addEventListener('scroll', soi, { passive: true }); pane._veBen = ve; ve();
}
/* thuộc tính theo tab (Video · Hoạt ảnh · Tốc độ & âm · Điều chỉnh…) */
const TAB_NHOM = { 'Tốc độ': 'Tốc độ', 'Âm thanh': 'Âm thanh', 'Khung hình': 'Video', 'Keyframe ◇': 'Video', 'Lật & cắt khung': 'Video', 'Khung hình (overlay)': 'Video', 'Lớp & khớp khung': 'Video', 'Ghép nền (chroma key) & độ mờ': 'Video', 'Hoạt ảnh vào / ra': 'Hoạt ảnh', 'Hoạt ảnh chữ': 'Hoạt ảnh', 'Tốc độ & âm thanh': 'Tốc độ & âm', 'Màu': 'Điều chỉnh', 'Mặt nạ': '*', 'Hoà trộn': 'Video', 'Bo góc, viền & bóng': 'Video', 'Bo góc & đổ bóng': 'Video', 'Nhoè chuyển động': 'Video', 'Phụ đề': 'Văn bản', 'Kiểu phụ đề (cho tất cả câu)': 'Văn bản', 'Bánh xe màu': 'Điều chỉnh', 'Đường cong': 'Điều chỉnh', 'HSL': 'Điều chỉnh', 'Hình vẽ': 'Đồ hoạ', 'Dữ liệu biểu đồ': 'Đồ hoạ', 'Bám vật thể': 'Bám theo', 'Kiểu chữ': 'Văn bản', 'Sticker': 'Nhãn dán', 'Bám theo lời nói': 'Bám theo', 'Đồ hoạ AI': 'Đồ hoạ', 'Clip ghép': 'Video' };
function tenNhom(n) { const b = n.querySelector(':scope > b'), t = b ? b.textContent.trim() : 'Khác'; if (t === 'Hoà trộn' && P.chon && P.chon.k === 'g') return '*';   /* chữ / sticker: hoà trộn nằm ở tab chính */ return TAB_NHOM[t] || t; }
/* tầng 2 như CapCut (Basic · Mask · Remove BG… / Basic · Curves · HSL · Wheels): mục không có trong bảng này nằm ở "Cơ bản" */
const SUB_NHOM = { 'Mặt nạ': 'Mặt nạ', 'Ghép nền (chroma key) & độ mờ': 'Xoá nền', 'Bánh xe màu': 'Bánh xe màu', 'Đường cong': 'Đường cong', 'HSL': 'HSL' };
function subNhom(n) { const b = n.querySelector(':scope > b'); return SUB_NHOM[b ? b.textContent.trim() : ''] || 'Cơ bản'; }
function moSubProp(t) { const ds = [...$('#propChon').querySelectorAll(':scope > .nhom2')], n = ds.find(x => subNhom(x) === t); if (!n) return; const tabs0 = [...new Set(ds.map(tenNhom).filter(x => x !== '*'))]; const tab = tenNhom(n) === '*' ? (tabs0[0] || 'Video') : tenNhom(n); P.propTab = tab; P.propSub = P.propSub || {}; P.propSub[tab] = t; tabHoaProp(); }
function moTabProp(t) { if (t === 'Tốc độ & âm') t = 'Tốc độ';   /* tên cũ trước khi tách tab Âm thanh / Tốc độ */ P.propTab = t; tabHoaProp(); }
function tabHoaProp() {
  { const ds = dsNhieu(); if (ds.length > 1) { const box = $('#propChon'); box.innerHTML = ''; $('#ed').classList.add('coChon'); const tde = $('#phaiTieuDe'); if (tde) tde.textContent = 'Nhiều mục'; box.appendChild(el('h3', null, ds.length + ' mục đang chọn')); const dem = {}; ds.forEach(o => { const t = { v: 'đoạn video', b: 'video phủ', g: 'chữ/đồ hoạ', a: 'âm thanh', t: 'lồng tiếng' }[o.k]; dem[t] = (dem[t] || 0) + 1; }); box.appendChild(el('div', 'quota', Object.entries(dem).map(([t, n]) => n + ' ' + t).join(' · ') + '. Kéo một mục là cả nhóm dời theo. Ctrl+G gói lại thành clip ghép, nháy đúp để sửa bên trong.')); const row = el('div', 'row'); [...(ds.some(o => 'vbga'.includes(o.k)) ? [['▣ Tạo clip ghép', () => taoClipGhep()]] : []), ['🗑 Xoá', () => xoaNhieu()], ['⧉ Sao chép', () => saoChepNhieu()], ['🔗 Gộp nhóm', () => gopNhom()], ['Bỏ gộp', () => boGopNhom()], ['Bỏ chọn', () => { P.nhieu = []; veProp(); danhDauNhieu(); }]].forEach(([t, f]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.onclick = f; row.appendChild(b); }); box.appendChild(row); return; } }
  const box = $('#propChon'); box.querySelectorAll(':scope > .ptabs, :scope > .lopHang').forEach(x => x.remove());   // vẽ lại thanh tab và hàng Lớp mỗi lần đổi tab, không nhân đôi
  const co = !!(P.chon && box.children.length); $('#ed').classList.toggle('coChon', co);
  if (co && (P.chon.k === 'b' || P.chon.k === 'g')) { const m = (P.chon.k === 'b' ? P.broll : P.gfx)[P.chon.i]; if (m) { const ds = cacLop(), l = lopCua(P.chon.k, m), r = el('div', 'lopHang'); r.appendChild(el('span', null, 'Lớp ' + (ds.length - ds.indexOf(l)) + '/' + ds.length)); [['⬆ Lên trên', 1], ['⬇ Xuống dưới', -1]].forEach(([t, h]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.onclick = () => doiLop(P.chon.k, P.chon.i, h); r.appendChild(b); }); box.insertBefore(r, box.children[1] || null); } }
  const tde = $('#phaiTieuDe'); if (tde) tde.textContent = co ? ({ v: 'Video', b: 'Overlay', g: 'Văn bản & đồ hoạ', a: 'Âm thanh', t: 'Lồng tiếng' }[P.chon.k] || 'Thuộc tính') : 'Dự án';
  box.querySelectorAll(':scope > .psub').forEach(x => x.remove());
  const ds = [...box.children].filter(x => x.classList.contains('nhom2')); if (!ds.length) return;
  const gC = P.chon && P.chon.k === 'g' ? P.gfx[P.chon.i] : null, uuTien = P.chon && P.chon.k === 'g' ? (gC && gC.kieu === 'chu' ? ['Văn bản', 'Video', 'Hoạt ảnh', 'Bám theo', 'Đồ hoạ', 'Nhãn dán'] : gC && gC.kieu === 'sticker' ? ['Nhãn dán', 'Hoạt ảnh', 'Bám theo', 'Đồ hoạ', 'Video'] : ['Đồ hoạ', 'Nhãn dán', 'Văn bản', 'Video', 'Hoạt ảnh', 'Bám theo']) : ['Video', 'Âm thanh', 'Tốc độ', 'Hoạt ảnh', 'Bám theo', 'Điều chỉnh'];   /* bộ tab theo loại mục như CapCut */
  const thu = t => { const i = uuTien.indexOf(t); return i < 0 ? 99 : i; };
  const tabs0 = [...new Set(ds.map(tenNhom).filter(t => t !== '*'))].sort((a, b) => thu(a) - thu(b)), tabCua = n => { const t = tenNhom(n); return t === '*' ? (tabs0[0] || 'Video') : t; };   /* Mặt nạ là sub-tab của tab chính (Video / Văn bản / Đồ hoạ) như CapCut */
  const tabs = [...new Set(ds.map(tabCua))].sort((a, b) => thu(a) - thu(b)), cur = tabs.includes(P.propTab) ? P.propTab : tabs[0];
  const dau = box.querySelector(':scope > .lopHang') || box.querySelector(':scope > h3'); let bar = null;
  if (tabs.length >= 2) { bar = el('div', 'ptabs'); tabs.forEach(t => { const b = el('button', t === cur ? 'on' : null, t); b.type = 'button'; b.onclick = () => moTabProp(t); bar.appendChild(b); }); box.insertBefore(bar, dau ? dau.nextSibling : box.firstChild); }
  /* tầng 2: dải nút tròn Cơ bản · Mặt nạ · Xoá nền… ngay dưới tab chính như CapCut */
  const trongTab = ds.filter(n => tabCua(n) === cur), subs = [...new Set(trongTab.map(subNhom))].sort((a, b) => a === 'Cơ bản' ? -1 : b === 'Cơ bản' ? 1 : 0);
  P.propSub = P.propSub || {}; const subCur = subs.length > 1 ? (subs.includes(P.propSub[cur]) ? P.propSub[cur] : subs[0]) : null;
  if (subCur) { const sb = el('div', 'psub'); subs.forEach(t => { const b = el('button', t === subCur ? 'on' : null, t); b.type = 'button'; b.onclick = () => { P.propSub[cur] = t; tabHoaProp(); }; sb.appendChild(b); }); box.insertBefore(sb, bar ? bar.nextSibling : (dau ? dau.nextSibling : box.firstChild)); }
  ds.forEach(n => n.classList.toggle('an', tabCua(n) !== cur || (!!subCur && subNhom(n) !== subCur)));
}
function moTabTinh(t) { $$('#prop > .tinh').forEach(s => s.classList.toggle('an', s.dataset.ten !== t)); $$('#tinhTabs button').forEach(b => b.classList.toggle('on', b.textContent === t)); try { localStorage.setItem('dv_tinh', t); } catch { } }
function tabHoaTinh() {
  const prop = $('#prop'), kids = [...prop.children].filter(x => x.id !== 'propChon'), secs = []; let cur = null;
  const TEN = { 'Hook & khung': 'Khung hình', 'Xuất': 'Xuất', 'Dự án': 'Dự án' };
  kids.forEach(x => { if (x.tagName === 'H3') { cur = el('div', 'tinh'); cur.dataset.ten = TEN[x.textContent.trim()] || x.textContent.trim(); secs.push(cur); prop.appendChild(cur); } if (cur) cur.appendChild(x); });
  if (!secs.length) return; const bar = el('div', 'ptabs'); bar.id = 'tinhTabs'; prop.insertBefore(bar, secs[0]);
  secs.forEach(s => { const b = el('button', null, s.dataset.ten); b.type = 'button'; b.onclick = () => moTabTinh(s.dataset.ten); bar.appendChild(b); });
  let dau = 'Khung hình'; try { dau = localStorage.getItem('dv_tinh') || dau; } catch { } moTabTinh(secs.some(s => s.dataset.ten === dau) ? dau : secs[0].dataset.ten);
}
/* khung kéo đổi cỡ (trái · giữa · phải · dòng thời gian), nhớ trên máy */
function kichCo() { try { return JSON.parse(localStorage.getItem('dv_kc') || '{}'); } catch { return {}; } }
function apKichCo(o) { const ed = $('#ed'); if (o.trai) ed.style.setProperty('--wTrai', o.trai + 'px'); if (o.phai) ed.style.setProperty('--wPhai', o.phai + 'px'); if (o.tl) ed.style.setProperty('--hTl', o.tl + 'px'); }
function taoTayKeo(elm, loai) {
  elm.addEventListener('pointerdown', e => {
    e.preventDefault(); elm.classList.add('dang'); try { elm.setPointerCapture(e.pointerId); } catch { }
    const ed = $('#ed'), r = ed.getBoundingClientRect(), o = kichCo(), x0 = e.clientX, y0 = e.clientY, trai0 = $('.ecol.trai').offsetWidth, phai0 = $('.ecol.phai').offsetWidth, tl0 = $('.etl').offsetHeight;
    const mv = ev => { if (loai === 'trai') o.trai = Math.round(Math.max(240, Math.min(r.width * 0.65, r.width - 12 - 260 - (ed.classList.contains('coChon') || ed.classList.contains('co-phai') ? phai0 : 0), trai0 + ev.clientX - x0))); else if (loai === 'phai') o.phai = Math.round(Math.max(240, Math.min(r.width * 0.45, r.width - 12 - trai0 - 260, phai0 - (ev.clientX - x0)))); else o.tl = Math.round(Math.max(150, Math.min(r.height - 260, tl0 - (ev.clientY - y0)))); apKichCo(o); };
    const up = () => { elm.classList.remove('dang'); elm.removeEventListener('pointermove', mv); elm.removeEventListener('pointerup', up); try { localStorage.setItem('dv_kc', JSON.stringify(o)); } catch { } if (!P.dang) veKhung(); };
    elm.addEventListener('pointermove', mv); elm.addEventListener('pointerup', up);
  });
  elm.addEventListener('dblclick', () => { const o = kichCo(); delete o[loai === 'tl' ? 'tl' : loai]; try { localStorage.setItem('dv_kc', JSON.stringify(o)); } catch { } const ed = $('#ed'); ed.style.removeProperty({ trai: '--wTrai', phai: '--wPhai', tl: '--hTl' }[loai]); });
}
function datToanApp(bat) { const ed = $('#ed'); ed.classList.toggle('full', bat); document.body.classList.toggle('edFull', bat); try { localStorage.setItem('dv_full', bat ? '1' : '0'); } catch { } const b = $('#btnToanApp'); if (b) b.title = bat ? 'Thoát toàn màn hình làm việc' : 'Toàn màn hình làm việc (ẩn thanh trang web)'; if (!P.dang) setTimeout(veKhung, 50); }
/* menu chuột phải trên dòng thời gian */
function dongMenu() { $$('.cmenu').forEach(m => m.remove()); }
function moMenu(x, y, ds) {
  dongMenu(); const m = el('div', 'cmenu' + ($('#ed') && $('#ed').classList.contains('ccw') ? ' ccwMenu' : '')); ds.forEach(o => { if (o === '-') { m.appendChild(el('hr')); return; } const b = el('button', o.do ? 'do' : null); b.type = 'button'; b.innerHTML = ic(o.ic) + '<span>' + o.t + '</span>' + (o.k ? '<kbd>' + o.k + '</kbd>' : ''); b.onclick = () => { dongMenu(); o.f(); }; m.appendChild(b); });
  m.style.maxHeight = (innerHeight - 12) + 'px'; m.style.overflowY = 'auto'; document.body.appendChild(m); const r = m.getBoundingClientRect(); m.style.left = Math.max(6, Math.min(x, innerWidth - r.width - 6)) + 'px'; m.style.top = Math.max(6, Math.min(y, innerHeight - r.height - 6)) + 'px';   // menu dài hơn màn hình: luôn nằm trong khung, cuộn được
}
function tChuot(e) { const r = $('#tlIn').getBoundingClientRect(); return Math.max(0, Math.min(tongGiay(), (e.clientX - r.left - LB) / PX())); }
function khoiTaoUI() {
  $$('[data-ic]').forEach(b => b.insertAdjacentHTML('afterbegin', ic(b.dataset.ic)));
  // khung kéo đổi cỡ
  const eb = $('.ebody'), k1 = el('div', 'keo ngang k1'), k2 = el('div', 'keo ngang k2'), k3 = el('div', 'keo doc');
  eb.insertBefore(k1, $('.ecol.giua')); eb.insertBefore(k2, $('.ecol.phai')); $('#ed').insertBefore(k3, $('.etl'));
  k1.title = k2.title = k3.title = 'Kéo để đổi cỡ · bấm đúp để đặt lại'; taoTayKeo(k1, 'trai'); taoTayKeo(k2, 'phai'); taoTayKeo(k3, 'tl'); apKichCo(kichCo());
  // toàn màn hình làm việc (mặc định trên máy tính)
  let full = innerWidth >= 1180; try { const v = localStorage.getItem('dv_full'); if (v != null) full = v === '1'; } catch { } if (innerWidth < 980) full = false;
  datToanApp(full); $('#btnToanApp').onclick = () => datToanApp(!$('#ed').classList.contains('full'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') dongMenu(); });
  // tiêu đề cột phải + tab thuộc tính
  const tp = $('.ecol.phai > .etabs button'); if (tp) tp.id = 'phaiTieuDe'; tabHoaTinh(); tabHoaProp();
  // đầu track
  $$('.track').forEach(tr => { const k = tr.dataset.track, lb = tr.querySelector('.lb'); lb.innerHTML = ''; const tro = el('div', 'tro'); (TR_NUT[k] || []).forEach(n => { const b = el('button', 'trn'); b.type = 'button'; b.dataset.n = n; b.onclick = e => { e.stopPropagation(); doiTr(k, n); }; tro.appendChild(b); }); lb.appendChild(tro); });
  veTrNut();
  // thẻ lưới
  $$('#mauChu button').forEach((b, i) => { const st = MAU_CHU[i] && MAU_CHU[i][1]; if (!st) return; const s = el('span', 'mau', String(st.text).split('|')[0].slice(0, 12)); s.style.fontFamily = st.font ? FONT_CSS[st.font] : ''; s.style.fontWeight = st.dam || 900; s.style.color = st.nen === 'hop_mau' ? '#062226' : st.mau === 'nhan' ? 'var(--ea)' : (st.mau || '#fff'); if (st.nen === 'hop' || st.nen === 'hop_mau') { s.style.background = st.nen === 'hop_mau' ? 'var(--ea)' : (st.nen_mau || '#0a0c0e'); s.style.padding = '2px 6px'; s.style.borderRadius = '4px'; } if (st.nen === 'vien') s.style.webkitTextStroke = '1px #000'; if (st.phat_sang) s.style.textShadow = '0 0 8px ' + st.phat_sang; if (st.nghieng) s.style.fontStyle = 'italic'; b.removeAttribute('style'); theHoa(b, s, MAU_CHU[i][0]); });
  $$('#mauPd button').forEach((b, i) => { const p = MAU_PD[i] && MAU_PD[i][1]; if (!p) return; const s = el('span', 'pdm'); s.style.fontFamily = FONT_CSS[p.font] || ''; const w = el('b', null, 'chào'); s.append('Xin ', w); if (p.pdKieu === 'highlight' || p.pdKieu === 'pill') { w.style.background = p.mau; w.style.color = '#111'; if (p.pdKieu === 'pill') w.style.borderRadius = '999px'; } else if (p.pdKieu === 'toi') { s.style.background = 'rgba(0,0,0,.85)'; w.style.color = p.mau; } else if (p.pdKieu === 'vien') { s.style.webkitTextStroke = '1px #000'; w.style.color = p.mau; } else w.style.color = p.mau; if (p.pdKieu === 'pop') w.style.fontSize = '1.25em'; theHoa(b, s, MAU_PD[i][0]); });
  $$('#locLuoi button').forEach(b => { const k = b.dataset.k, f = (LOC[k] || [])[1] || ''; b.style.filter = ''; theHoa(b, '<span style="font-size:20px;opacity:.6">🎨</span><img alt="" hidden style="filter:' + f + '">', (LOC[k] || [k])[0]); });
  $$('#huLuoi button').forEach(b => theHoa(b, '<span>' + (HU_IC[b.dataset.k] || '✨') + '</span>', HIEU_UNG[b.dataset.k] || b.dataset.k));
  $$('#sfxLuoi button').forEach(b => { const k = b.dataset.k, [ten, dai] = SFX[k] || [b.textContent, 0], m = ten.match(/^(\S+)\s+(.*)$/); theHoa(b, '<span>' + (m ? m[1] : '🔊') + '</span>', m ? m[2] : ten, fmt1(dai) + 's'); });
  Object.keys(CHUYEN_TEN).forEach(k => { const b = el('button'); b.type = 'button'; b.dataset.k = k; theHoa(b, '<span>' + (CH_IC[k] || '⇢') + '</span>', CHUYEN_TEN[k]); b.onclick = () => datChuyen(k); $('#chuyenLuoi').appendChild(b); });
  $('#chuyenDai').addEventListener('change', () => { P._luuCD = 0; }); $('#chuyenDai').addEventListener('input', () => { if (!P._luuCD) { luuHoanTac(); P._luuCD = 1; } const v = +$('#chuyenDai').value; $('#chuyenDaiO').textContent = fmt1(v) + 's'; const c = P.chon && P.chon.k === 'v' ? P.clips[P.chon.i] : null; (c ? [c] : P.clips).forEach(x => { if (x.chuyen && x.chuyen !== 'cat') x.chuyen_dai = v; }); if (!P.dang) veKhung(); });
  // cột danh mục mỗi tab
  $$('.ecol.trai [data-pane]').forEach(taoBen);
  // footage: lưới / danh sách
  $('#btnLuoiSrc').onclick = () => { $('#srcs').classList.toggle('luoi'); };
  // thanh công cụ mới
  $('#btnQ').onclick = () => catDauPhat(true); $('#btnW').onclick = () => catDauPhat(false);
  const mucBienHinh = (choChu) => { let m = mucChon(); if (m && choChu && P.chon.k === 'g') return m; if (m && P.chon.k === 'g') { toast('Chữ / nhãn dán chưa lật được, chỉnh trong bảng Thuộc tính'); return null; } if (!m || !['v', 'b'].includes(P.chon.k)) { const { clip } = viTri(P.t); if (clip < 0) { toast('Chưa có đoạn nào'); return null; } P.chon = { k: 'v', i: clip }; m = P.clips[clip]; } return m; };
  $('#btnLat').onclick = () => { const m = mucBienHinh(); if (!m) return; luuHoanTac(); m.latX = !m.latX; veTl(); veProp(); veKhung(); };
  $('#btnXoay90').onclick = () => { const m = mucBienHinh(true); if (!m) return; luuHoanTac(); const k = P.chon.k, off = offMuc(k, m), coKfX = m.kfs && m.kfs.xoay && m.kfs.xoay.length; let v = (coKfX ? giaTriKf(m, 'xoay', off) : (m.xoay || 0)) + 90; if (v > 180) v -= 360; if (coKfX) datKf(m, 'xoay', off, v); else m.xoay = v; veTl(); veProp(); veKhung(); };
  $('#btnCrop').onclick = () => { const m = mucBienHinh(); if (!m) return; P.propTab = 'Video'; chonHien(); veProp(); moPhaiNeuCan(); const n = [...$$('#propChon .nhom2')].find(x => /cắt khung/i.test(x.textContent)); if (n) n.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  $('#btnKfNhanh').onclick = () => { let m = mucChon(), k = P.chon && P.chon.k; if (!m || !['v', 'b', 'g'].includes(k)) { m = mucBienHinh(); k = 'v'; } if (!m) return; const st = batDauMuc(k, m), off = P.t - st; if (off < 0 || off > daiMuc(k, m)) { toast('Đưa đầu phát vào trong mục đang chọn'); return; } luuHoanTac(); ['sc', 'x', 'y', 'xoay', 'mo'].forEach(p => datKf(m, p, off, giaTriKf(m, p, off))); veTl(); veProp(); toast('Đã thêm keyframe ◇ tại ' + fmt1(P.t) + 's (phóng, vị trí, xoay, độ mờ)'); };
  $('#btnTachAmTl').onclick = () => { const i = P.chon && P.chon.k === 'v' ? P.chon.i : viTri(P.t).clip; if (i < 0) { toast('Chưa có đoạn nào'); return; } tachAmClip(i); };
  const zoom = f => { P.pxs = Math.round(Math.max(6, Math.min(80, P.pxs * f))); $('#zoomTl').value = P.pxs; veTl(); };
  $('#btnZoomRa').onclick = () => zoom(1 / 1.25); $('#btnZoomVao').onclick = () => zoom(1.25);
  // tỉ lệ nhanh ở trình phát
  const t2 = $('#tiLe2'); [...$('#tiLe').options].forEach(o => { const n = el('option', null, o.value); n.value = o.value; t2.appendChild(n); }); t2.value = $('#tiLe').value; t2.onchange = () => { $('#tiLe').value = t2.value; $('#tiLe').dispatchEvent(new Event('change')); };
  // menu chuột phải
  $('#tlIn').addEventListener('contextmenu', e => {
    const it = e.target.closest('.item[data-k]'), tr = e.target.closest('.track'); e.preventDefault();
    if (it) { const k = it.dataset.k, i = +it.dataset.i; if (!dangChon(MANG()[k][i])) P.nhieu = []; P.chon = { k, i }; chonHien(); veProp(); const tm = tChuot(e);
      moMenu(e.clientX, e.clientY, [
        { ic: 'split', t: 'Tách tại đây', k: 'Ctrl+B', f: () => { P.t = tm; lenh('tach'); } },
        { ic: 'delL', t: 'Xoá phần bên trái', k: 'Q', f: () => { P.t = tm; P.chon = { k, i }; catDauPhat(true); } },
        { ic: 'delR', t: 'Xoá phần bên phải', k: 'W', f: () => { P.t = tm; P.chon = { k, i }; catDauPhat(false); } }, '-',
        { ic: 'split', t: 'Tách mọi track tại đây', k: 'Shift+S', f: () => { P.t = tm; tachTatCa(); } }, '-',
        { ic: 'copy', t: 'Sao chép', k: 'Ctrl+C', f: () => saoChep() }, { ic: 'paste', t: 'Dán tại đầu phát', k: 'Ctrl+V', f: () => dan() }, { ic: 'copy', t: 'Sao chép thuộc tính', k: 'Ctrl+Alt+C', f: () => chepThuocTinh() }, { ic: 'paste', t: 'Dán thuộc tính…', k: 'Ctrl+Alt+V', f: () => hopDanThuocTinh() }, { ic: 'copy', t: 'Nhân đôi', k: 'Ctrl+D', f: () => lenh('nhan') },
        ...(k === 'v' || k === 'b' ? ['-', ...menuThay(k, i)] : []),
        ...(k === 'v' ? [{ ic: 'undo', t: P.clips[i] && P.clips[i].dao ? 'Bỏ đảo ngược' : 'Đảo ngược (phát lùi)', f: () => doiDao(i) }, { ic: 'split', t: 'Tách theo cảnh (tự dò)', f: () => catTheoCanh(i) }] : []),
        ...(k === 'v' ? ['-', { ic: 'freeze', t: 'Đóng băng khung tại đây', k: 'Ctrl+Shift+F', f: () => { P.t = tm; $('#btnDongBang').click(); } }, { ic: 'wave', t: 'Tách âm thanh', f: () => tachAmClip(i) }, { ic: 'mirror', t: 'Lật ngang', f: () => $('#btnLat').click() }, { ic: 'kf', t: 'Thêm keyframe tại đây', f: () => { P.t = tm; $('#btnKfNhanh').click(); } }] : []),
        ...(k === 'b' || k === 'g' ? ['-', { ic: 'redo', t: 'Đưa lên lớp trên', k: 'Ctrl+]', f: () => doiLop(k, i, 1) }, { ic: 'undo', t: 'Đưa xuống lớp dưới', k: 'Ctrl+[', f: () => doiLop(k, i, -1) }, { ic: 'redo', t: 'Lên trên cùng', k: 'Ctrl+Shift+]', f: () => lopCuc(k, i, true) }, { ic: 'undo', t: 'Xuống dưới cùng', k: 'Ctrl+Shift+[', f: () => lopCuc(k, i, false) }] : []),
        ...(k === 'v' ? [{ ic: 'redo', t: 'Đưa lên lớp phủ', f: () => { luuHoanTac(); v1LenLop(i, (cacLop()[0] || 0) + 1); veTl(); veKhung(); veProp(); } }] : []),
        ...(k === 'b' ? [{ ic: 'undo', t: 'Đưa xuống track chính', f: () => { luuHoanTac(); lopXuongV1(i); veTl(); veKhung(); veProp(); } }, '-', { ic: 'mirror', t: 'Lật ngang', f: () => $('#btnLat').click() }, { ic: 'kf', t: 'Thêm keyframe tại đây', f: () => { P.t = tm; $('#btnKfNhanh').click(); } }] : []),
        ...(k !== 't' ? ['-', ...(laGhep(MANG()[k][i]) ? [{ ic: 'group', t: 'Sửa bên trong clip ghép', k: 'Nháy đúp', f: () => moClipGhep(MANG()[k][i]) }, { ic: 'group', t: 'Tách clip ghép', k: 'Ctrl+Shift+G', f: () => tachClipGhep(MANG()[k][i]) }] : [{ ic: 'group', t: 'Tạo clip ghép (đang chọn)', k: 'Ctrl+G', f: () => taoClipGhep() }]), { ic: 'group', t: 'Gộp nhóm (đang chọn)', k: 'Alt+G', f: () => gopNhom() }, { ic: 'group', t: 'Bỏ gộp nhóm', k: 'Alt+Shift+G', f: () => boGopNhom() }] : []),
        '-', { ic: MANG()[k][i] && MANG()[k][i].an ? 'eye' : 'eyeOff', t: MANG()[k][i] && MANG()[k][i].an ? 'Hiện đoạn' : 'Ẩn đoạn', k: 'Shift+E', f: () => anHienChon() },
        ...(k === 'v' || k === 'a' || k === 'b' ? [{ ic: 'mute', t: 'Tắt / bật tiếng', f: () => tatTiengChon() }] : []),
        ...(k === 'v' || k === 'b' ? [{ ic: 'slip', t: 'Tốc độ…', k: 'Ctrl+R', f: () => { moTabProp('Tốc độ'); moPhaiNeuCan(); } }] : []),
        { ic: 'text', t: 'Đổi tên…', f: () => doiTenMuc(k, i) }, { ic: 'mark', t: 'Nhãn màu…', f: () => menuNhanMau(e.clientX, e.clientY, k, i) }, { ic: 'mark', t: 'Thêm mốc tại đây', k: 'M', f: () => themMoc(tm) }, { ic: 'axis', t: 'Vùng In–Out theo đoạn', k: 'Shift+X', f: () => vungTheoChon() },
        '-', { ic: 'trash', t: 'Xoá và dồn (Ripple delete)', f: () => xoaDon(k, i) }, { ic: 'trash', t: 'Xoá', k: 'Delete', do: true, f: () => lenh('xoa') }]); return; }
    if (tr) { const k = tr.dataset.track, n = TR_NUT[k] || []; moMenu(e.clientX, e.clientY, [
        ...(n.includes('tat') ? [{ ic: trTat(k) ? 'vol' : 'mute', t: trTat(k) ? 'Bật tiếng track' : 'Tắt tiếng track', f: () => doiTr(k, 'tat') }] : []),
        ...(n.includes('an') ? [{ ic: trAn(k) ? 'eye' : 'eyeOff', t: trAn(k) ? 'Hiện track' : 'Ẩn track', f: () => doiTr(k, 'an') }] : []),
        { ic: trKhoa(k) ? 'unlock' : 'lock', t: trKhoa(k) ? 'Mở khoá track' : 'Khoá track', f: () => doiTr(k, 'khoa') },
        { ic: 'vol', t: trO(k).solo ? 'Bỏ solo' : 'Solo track (chỉ hiện/nghe track này)', f: () => doiSolo(k) }, { ic: 'text', t: 'Đổi tên track…', f: () => doiTenTr(k) }, '-', { ic: 'split', t: 'Tách mọi track tại đây', k: 'Shift+S', f: () => { P.t = tChuot(e); tachTatCa(); } },
        { ic: 'paste', t: 'Dán tại đầu phát', k: 'Ctrl+V', f: () => dan() }, { ic: 'mark', t: 'Đặt mốc tại đây', k: 'M', f: () => themMoc(tChuot(e)) }, { ic: 'trash', t: 'Xoá mọi mốc', f: () => { luuHoanTac(); P.moc = []; veTl(); } }, '-',
        ...[['thap', 'Track thấp'], ['vua', 'Track vừa'], ['cao', 'Track cao']].map(([v, t]) => ({ ic: 'grid', t: ((P.trCao || {})[k] || 'vua') === v ? '● ' + t : t, f: () => { P.trCao = P.trCao || {}; P.trCao[k] = v; veTl(); } })),
        ...(k !== 'v1' ? [{ ic: 'trash', t: 'Xoá track này', do: true, f: () => xoaTrack(k) }] : [])]); }
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.cmenu')) dongMenu(); });
  // làm mới ảnh bộ lọc khi mở tab, vẽ lại danh mục
  const doiTabCu = doiTab; doiTab = function (t) { doiTabCu(t); const p = $('[data-pane="' + t + '"]'); if (p && p._veBen) p._veBen(); if (t === 'loc') capNhatAnhLoc(); };
  $$('.etabs [data-tab]').forEach(b => b.onclick = () => doiTab(b.dataset.tab));
  const veCu = veProp; veProp = function () { veCu(); tabHoaProp(); };
  veTl(); veProp();
}

function veMotBroll(ctx, W, H, t, b) { if (b.an) return; const dai = (b.kt - b.bd) / tocC(b); if (t < b.t_bd || t >= b.t_bd + dai) return; const sb = srcCua(b.src); if (!sb || !sb.el) return; let im = sb.loai === 'video' ? elPhu(sb, 'elB') : sb.el; if (b.chroma) im = chromaKey(im, sb, b) || im; let sbx = sb; [sbx, im] = catNguon(b, sb, im, 1); [sbx, im] = chinhMau(b, sbx, im, t); const a = b.kieu === 'ghep' ? 1 : Math.min(1, (t - b.t_bd) / 0.25, (b.t_bd + dai - t) / 0.25);   // độ mờ b.mo đã tính trong apDoan (clip ghép không tự mờ hai đầu)
    apDoan(ctx, W, H, b, t - b.t_bd, ctx => { ctx.save(); ctx.globalAlpha *= Math.max(0, a); const sb = sbx;
    if (b.kieu === 'pip') { const pw = W * 0.72, ph = pw * 9 / 16, px0 = W / 2 - pw / 2, py0 = H * 0.13; ctx.beginPath(); ctx.roundRect(px0, py0, pw, ph, W * 0.03); ctx.fillStyle = '#000'; ctx.fill(); ctx.clip(); const iw = sb.w || 1, ih = sb.h || 1, sc = Math.max(pw / iw, ph / ih); ctx.drawImage(im, px0 + pw / 2 - iw * sc / 2, py0 + ph / 2 - ih * sc / 2, iw * sc, ih * sc); ctx.restore(); ctx.save(); ctx.strokeStyle = mauNhan(); ctx.lineWidth = W * 0.008; ctx.beginPath(); ctx.roundRect(px0, py0, pw, ph, W * 0.03); ctx.stroke(); }
    else if (b.vua === 'contain') { const iw = sb.w || 1, ih = sb.h || 1, k = Math.min(W / iw, H / ih); ctx.drawImage(im, W / 2 - iw * k / 2, H / 2 - ih * k / 2, iw * k, ih * k); }
    else veNguon(ctx, W, H, sb, im, b.bd + (t - b.t_bd) * tocC(b), 1);
    ctx.restore(); }); }
/* ═════════ XẾP LỚP KIỂU CAPCUT: mỗi lớp phủ là một hàng, lớp trên phủ lớp dưới · KÉO ĐỂ TUA ═════════
   lop của b-roll mặc định 2 (hàng V2), 3 = V3; đồ hoạ/chữ mặc định 10 (hàng O1). Kéo lên trên cùng để tạo lớp mới. */

function lopCua(k, m) { return m && m.lop != null ? +m.lop : (k === 'g' ? 1e3 : 0); }
function keyLop(l) { return 'L' + l; }
function cacLop() { const s = new Set(); P.broll.forEach(b => { if (b.lop != null) s.add(+b.lop); }); P.gfx.forEach(g => { if (g.lop != null) s.add(+g.lop); }); return [...s].sort((a, b) => b - a); }
function dauTrack(tr) { const k = tr.dataset.track, lb = tr.querySelector('.lb'); if (!lb || lb.querySelector('.tro')) return; lb.innerHTML = ''; const tro = el('div', 'tro'); (TR_NUT[k] || ['an', 'khoa']).forEach(n => { const b = el('button', 'trn'); b.type = 'button'; b.dataset.n = n; b.onclick = e => { e.stopPropagation(); doiTr(k, n); }; tro.appendChild(b); }); lb.appendChild(tro); }
/* đảm bảo đủ hàng cho mọi lớp đang dùng, xếp lớp cao ở trên; bỏ hàng phụ đã trống */
function hangLop() {
  const tin = $('#tlIn'), dung = cacLop(), v1 = tin.querySelector('.track.v1'); let moi = false;
  tin.querySelectorAll('.track.lop').forEach(tr => { if (!dung.includes(+tr.dataset.lop)) tr.remove(); });
  dung.forEach(l => { const lo = loaiLop(l) || 'video'; let tr = tin.querySelector('.track.lop[data-lop="' + l + '"]'); if (tr && !tr.classList.contains(lo)) { tr.remove(); tr = null; } if (!tr) { tr = el('div', 'track lop ' + lo); tr.dataset.track = keyLop(l); tr.dataset.lop = l; tr.innerHTML = '<div class="lb"></div>'; TR_NUT[tr.dataset.track] = ['an', 'khoa']; dauTrack(tr); moi = true; } tin.insertBefore(tr, v1); });
  if (moi) veTrNut();
}
/* chỗ thả khi kéo item / thả footage */
/* keyframe: nhảy / xoá / kéo đổi thời điểm (như CapCut) */
function mucKf() { let k = P.chon && P.chon.k, m = mucChon(); if (!m || !['v', 'b', 'g'].includes(k)) { const { clip } = viTri(P.t); if (clip < 0) return null; k = 'v'; m = P.clips[clip]; } return { k, m }; }
function nhayKf(huong) { const o = mucKf(); if (!o) return; const st = batDauMuc(o.k, o.m), off = P.t - st, moc = mocKf(o.m), t = huong > 0 ? moc.find(x => x > off + 0.02) : [...moc].reverse().find(x => x < off - 0.02); if (t == null) { toast(huong > 0 ? 'Không còn keyframe phía sau' : 'Không còn keyframe phía trước'); return; } P.t = st + t; vePh(); datTg(tongGiay()); veKhung(); veProp(); }
function xoaKfDauPhat() { const o = mucKf(); if (!o || !o.m.kfs) { toast('Không có keyframe tại đầu phát'); return; } const off = P.t - batDauMuc(o.k, o.m); let n = 0; luuHoanTac(); Object.keys(o.m.kfs).forEach(p => { if (kfTai(o.m, p, off) >= 0) { xoaKf(o.m, p, off); n++; } }); if (!n) { huyHoanTac(); toast('Không có keyframe tại đầu phát'); return; } veTl(); veProp(); veKhung(); toast('Đã xoá ' + n + ' keyframe'); }
function zoomVua() { const sc = $('#tlScroll'), tong = Math.max(1, tongGiay()); P.pxs = Math.round(Math.max(6, Math.min(80, (sc.clientWidth - LB - 40) / tong))); $('#zoomTl').value = P.pxs; sc.scrollLeft = 0; veTl(); }
function keoKf(e, kd) {
  const it = kd.closest('.item'), k = it.dataset.k, i = +it.dataset.i, m = { v: P.clips, b: P.broll, g: P.gfx }[k][i]; if (!m) return;
  if (P.dang) dung(); P.chon = { k, i }; const t0 = +kd.dataset.t, x0 = e.clientX, px = PX(), dai = daiMuc(k, m); let daKeo = false, tMoi = t0;
  try { kd.setPointerCapture(e.pointerId); } catch { }
  const mv = ev => { const dx = ev.clientX - x0; if (!daKeo && Math.abs(dx) < 3) return; if (!daKeo) { daKeo = true; luuHoanTac(); } tMoi = Math.max(0, Math.min(dai, t0 + dx / px)); kd.style.left = tMoi * px - 4 + 'px'; hienTip(ev, '◆ ' + fmt1(tMoi) + 's'); };
  const up = () => { kd.removeEventListener('pointermove', mv); kd.removeEventListener('pointerup', up); kd.removeEventListener('pointercancel', up); hienTip(null);
    if (daKeo) { Object.keys(m.kfs || {}).forEach(p => { (m.kfs[p] || []).forEach(f => { if (Math.abs(f.t - t0) < 1 / 30) f.t = +tMoi.toFixed(3); }); m.kfs[p].sort((a, b) => a.t - b.t); }); toast('Dời keyframe tới ' + fmt1(tMoi) + 's của đoạn'); }
    P.t = batDauMuc(k, m) + (daKeo ? tMoi : t0); chonHien(); veTl(); vePh(); datTg(tongGiay()); veKhung(); veProp(); moPhaiNeuCan(); };
  kd.addEventListener('pointermove', mv); kd.addEventListener('pointerup', up); kd.addEventListener('pointercancel', up);
}
function dichTha(y, k, m, kh) {
  const loai = k === 'v' ? 'video' : loaiMuc(k, m), ds = dsPhu().filter(o => o.m !== m), tatCa = [...new Set(ds.map(o => o.m.lop).filter(l => l != null))].sort((a, b) => a - b), max = tatCa.length ? tatCa[tatCa.length - 1] : 0, tren = $('#tlTren');
  kh = kh || khoangMuc(k, m);
  if (k !== 'a' && tren && y < tren.getBoundingClientRect().bottom) return { lop: max + 1, moi: true, hang: tren };
  for (const r of $$('#tlIn .track:not(.rong)')) { const b = r.getBoundingClientRect(); if (y < b.top || y >= b.bottom) continue;
    if (k === 'a') { const khac = (P.am3 || []).filter(x => x !== m); if (r.dataset.alop != null) { const l = +r.dataset.alop; if (!khac.some(x => (x.lop || 1) === l && chongNhau(khoangMuc('a', x), kh))) return { alop: l, hang: r }; } return { alop: Math.max(0, ...khac.map(x => x.lop || 1)) + 1, moi: true, hang: r }; }
    if (r.classList.contains('v1')) return k === 'b' ? { v1: true, hang: r } : k === 'v' ? null : { lop: tatCa.length ? tatCa[0] - 1 : 1, moi: true, hang: r };
    if (r.dataset.lop == null) return r.classList.contains('o2') ? { lop: max + 1, moi: true, hang: r } : null;
    const l = +r.dataset.lop, lo = loaiLop(l, ds), trung = ds.some(o => o.m.lop === l && chongNhau(khoangMuc(o.k, o.m), kh));
    if ((lo == null || lo === loai) && !trung) return { lop: l, hang: r };
    const t2 = tatCa.find(x => x > l); return { lop: t2 != null ? (l + t2) / 2 : l + 1, moi: true, hang: r };
  }
  return null;
}
function hangCua(l) { return $('#tlIn .track[data-lop="' + l + '"]'); }
function hangDuoi(y) { for (const r of $$('#tlIn .track:not(.rong)')) { const b = r.getBoundingClientRect(); if (y >= b.top && y < b.bottom) return r; } return null; }
function lopTuHang(r) { return r && r.dataset.lop != null ? +r.dataset.lop : null; }
function hangHop() { return false; }
function doiLop(k, i, huong) {
  const m = (k === 'b' ? P.broll : k === 'g' ? P.gfx : [])[i]; if (!m) return; const ds = dsPhu(), hs = cacLop().slice().sort((a, b) => a - b), l = lopCua(k, m), j = hs.indexOf(l), loai = loaiMuc(k, m), kh = khoangMuc(k, m);
  const trong = x => (loaiLop(x, ds.filter(o => o.m !== m)) || loai) === loai && !ds.some(o => o.m !== m && o.m.lop === x && chongNhau(khoangMuc(o.k, o.m), kh));
  let moi; if (huong > 0) { const a = hs[j + 1], b = hs[j + 2]; moi = a == null ? l + 1 : trong(a) ? a : b != null ? +((a + b) / 2).toFixed(4) : a + 1; }
  else { const a = hs[j - 1], b = hs[j - 2]; moi = a == null ? l - 1 : trong(a) ? a : b != null ? +((a + b) / 2).toFixed(4) : a - 1; }
  luuHoanTac(); m.lop = moi; veTl(); veKhung(); veProp(); toast(huong > 0 ? 'Đưa lên lớp trên' : 'Đưa xuống lớp dưới');
}
/* đoạn V1 → lớp phủ (giữ nguyên chỗ trên dòng thời gian, phía sau dồn lên) */
function v1LenLop(i, lop) { const c = P.clips[i]; if (!c) return; let acc = 0; for (let j = 0; j < i; j++) acc += daiC(P.clips[j]); const dai = daiC(c); P.clips.splice(i, 1); ripple(acc + dai, -dai); const { trong, chuyen, chuyen_dai, chuyenSau, ly_do, ...giu } = JSON.parse(JSON.stringify(c)); P.broll.push({ ...giu, id: uid(), t_bd: khungGiay(acc), kieu: 'full', lop });   /* giữ mọi chỉnh sửa: phóng, vị trí, lọc, âm lượng, keyframe, đảo ngược */ P.chon = { k: 'b', i: P.broll.length - 1 }; }
/* lớp phủ → V1 (chèn vào chỗ gần nhất theo thời gian) */
function lopXuongV1(i) { const b = P.broll[i]; if (!b) return; let acc = 0, vt = P.clips.length; for (let j = 0; j < P.clips.length; j++) { const len = daiC(P.clips[j]); if (b.t_bd < acc + len / 2) { vt = j; break; } acc += len; } P.broll.splice(i, 1); const { t_bd, lop, kieu, nhom, ...giu } = JSON.parse(JSON.stringify(b)), c = { ...giu, ly_do: 'từ lớp phủ' }, ch = chupChen(); P.clips.splice(vt, 0, c); apChen(ch, acc, daiC(c)); P.chon = { k: 'v', i: vt }; }
/* vẽ các lớp phủ theo thứ tự lớp (dùng chung cho xem trước và xuất) */
function veCacLop(ctx, W, H, t) {
  [...P.broll.map(m => ({ k: 'b', m, l: lopCua('b', m) })), ...P.gfx.map(m => ({ k: 'g', m, l: lopCua('g', m) }))].sort((a, b) => a.l - b.l)
    .forEach(o => { if (trAn(keyLop(o.l))) return; if (o.k === 'b') veMotBroll(ctx, W, H, t, o.m); else if (!o.m.an && t >= o.m.bd && t < o.m.kt) { const bl = o.m.blend && BLEND[o.m.blend]; if (bl) { ctx.save(); ctx.globalCompositeOperation = bl[1]; } veDoHoa(ctx, W, H, o.m, t); if (bl) ctx.restore(); } });
}
/* kéo để tua: thước, chỗ trống trên dòng thời gian */
let tuaBan = false, tuaCho = false;
async function veTua() { if (tuaBan) { tuaCho = true; return; } tuaBan = true; try { await veKhung(); } catch { } tuaBan = false; if (tuaCho) { tuaCho = false; veTua(); } }
function khoiTaoLop() {
  hangLop();
  const veTlGoc = veTl; veTl = function () { if (P.dangKeo) { P.veTlCho = true; return; } veTlGoc(); $$('#tlIn .track').forEach(tr => tr.classList.toggle('rong', !tr.classList.contains('v1') && !tr.querySelector('.item'))); danhDauNhieu(); };   // đang kéo: hoãn vẽ lại (filmstrip, sóng âm chạy nền) để không mất mục đang kéo
  const donKeo = () => { if (P.dangKeo) { P.dangKeo = false; if (P.veTlCho) { P.veTlCho = false; veTl(); } } hienTip(null); const sl = $('#snapLine'); if (sl) sl.style.display = 'none'; };   // luôn dọn ô độ dài / vạch hít khi thả chuột
  document.addEventListener('pointerup', donKeo); document.addEventListener('pointercancel', donKeo);
  const tin = $('#tlIn'), sc = $('#tlScroll');
  tin.addEventListener('pointerdown', e => { const kd = e.target.closest('.kfd'); if (!kd || e.button !== 0) return; e.stopPropagation(); e.preventDefault(); keoKf(e, kd); }, true);
  tin.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.item') || e.target.closest('.lb') || e.target.closest('.moc') || e.clientY > $('#ruler').getBoundingClientRect().bottom) return;   // chỉ kéo tua trên thước (theo toạ độ: thước có thể vừa vẽ lại)
    try { tin.setPointerCapture(e.pointerId); } catch { } document.body.classList.add('dangTua');
    let cuon = 0; const tick = () => { if (!cuon) return; sc.scrollLeft += cuon; requestAnimationFrame(tick); };
    const mv = ev => { P.t = batDauPhat(tChuot(ev), ev.altKey); vePh(); datTg(tongGiay()); const r = sc.getBoundingClientRect(), cu = cuon; cuon = ev.clientX > r.right - 30 ? 12 : ev.clientX < r.left + LB + 20 && sc.scrollLeft > 0 ? -12 : 0; if (cuon && !cu) requestAnimationFrame(tick); veTua(); };
    const up = () => { cuon = 0; document.body.classList.remove('dangTua'); const ph0 = $('#ph'); if (ph0) ph0.classList.remove('bat'); if (P.chon) veProp(); tin.removeEventListener('pointermove', mv); tin.removeEventListener('pointerup', up); tin.removeEventListener('pointercancel', up); veTua(); };
    tin.addEventListener('pointermove', mv); tin.addEventListener('pointerup', up); tin.addEventListener('pointercancel', up);
  });
}

/* ═════════ TRACK THEO LOẠI KIỂU CAPCUT (draft_content: track có type, segment trong 1 track không chồng giờ, thứ tự track = thứ tự lớp) ═════════
   Lớp phủ hình: 'video' (b-roll, ảnh, sticker PNG) và 'text' (chữ, emoji, đồ hoạ). Âm thanh A3: nhiều hàng 'audio'. */
const LOP_LOAI = {};
function loaiMuc(k, m) { return k === 'b' ? 'video' : k === 'a' ? 'audio' : 'text'; }
function khoangMuc(k, m) { return k === 'b' ? [m.t_bd, m.t_bd + (m.kt - m.bd) / tocC(m)] : k === 'a' ? [m.t_bd, m.t_bd + (m.kt - m.bd)] : [m.bd, m.kt]; }
function chongNhau(x, y) { return x[0] < y[1] - 0.01 && y[0] < x[1] - 0.01; }
function dsPhu() { return [...P.broll.map(m => ({ k: 'b', m })), ...P.gfx.map(m => ({ k: 'g', m }))]; }
function loaiLop(l, ds) { if (LOP_LOAI[l]) return LOP_LOAI[l]; const o = (ds || dsPhu()).find(o => o.m.lop === l); return o ? loaiMuc(o.k, o.m) : null; }
/* tìm hàng cho một mục: hàng cùng loại còn trống ở khoảng giờ đó (từ dưới lên), không có thì tạo hàng mới cho đúng loại */
function timLop(k, m, ds, boQua) {
  ds = ds || dsPhu(); const loai = loaiMuc(k, m), kh = khoangMuc(k, m), khac = ds.filter(o => o.m !== m), tatCa = [...new Set(khac.map(o => o.m.lop).filter(l => l != null))].sort((a, b) => a - b);
  for (const l of tatCa) { if (l === boQua || loaiLop(l, khac) !== loai) continue; if (!khac.some(o => o.m.lop === l && chongNhau(khoangMuc(o.k, o.m), kh))) return l; }
  if (!tatCa.length) return 1;
  if (loai === 'text') return tatCa[tatCa.length - 1] + 1;
  const vid = tatCa.filter(l => loaiLop(l, khac) === 'video'); if (!vid.length) return tatCa[0] - 1;   // video mới nằm dưới mọi line chữ
  const maxV = Math.max(...vid), tren = tatCa.find(l => l > maxV); return tren != null ? (maxV + tren) / 2 : maxV + 1;
}
/* chuẩn hoá: mục chưa có hàng, nằm sai loại hàng, hoặc chồng giờ với mục khác trong cùng hàng thì xếp sang hàng hợp lệ */
function xepLop() {
  const xong = [];
  dsPhu().forEach(o => { const l = o.m.lop, loai = loaiMuc(o.k, o.m), lh = l == null ? null : (LOP_LOAI[l] || (xong.find(p => p.m.lop === l) ? loaiMuc(xong.find(p => p.m.lop === l).k) : null));
    if (l != null && (lh == null || lh === loai) && !xong.some(p => p.m.lop === l && chongNhau(khoangMuc(p.k, p.m), khoangMuc(o.k, o.m)))) { xong.push(o); return; }
    o.m.lop = timLop(o.k, o.m, xong); xong.push(o); });
  const ls = [...new Set(dsPhu().map(o => o.m.lop))].sort((a, b) => a - b);
  if (ls.some((l, i) => l !== i + 1)) { const map = new Map(ls.map((l, i) => [l, i + 1])); dsPhu().forEach(o => { o.m.lop = map.get(o.m.lop); }); if (P.tr) { const t2 = {}; Object.entries(P.tr).forEach(([k, v]) => { if (/^L-?[\d.]+$/.test(k)) { const n = map.get(+k.slice(1)); if (n != null) t2['L' + n] = v; } else t2[k] = v; }); P.tr = t2; } }
  const xa = [];
  (P.am3 || []).forEach(a => { const l = a.lop || 1; if (!xa.some(b => (b.lop || 1) === l && chongNhau(khoangMuc('a', b), khoangMuc('a', a)))) { a.lop = l; xa.push(a); return; } let n = 1; while (xa.some(b => (b.lop || 1) === n && chongNhau(khoangMuc('a', b), khoangMuc('a', a)))) n++; a.lop = n; xa.push(a); });
}
/* sau khi kéo / cắt mép: mục vừa sửa chồng giờ trong hàng của nó thì đưa sang hàng khác (giữ nguyên các mục còn lại) */
function datLopTha(k, m) {
  if (k === 'a') { const kh = khoangMuc('a', m), l = m.lop || 1; if ((P.am3 || []).some(b => b !== m && (b.lop || 1) === l && chongNhau(khoangMuc('a', b), kh))) { let n = 1; while ((P.am3 || []).some(b => b !== m && (b.lop || 1) === n && chongNhau(khoangMuc('a', b), kh))) n++; m.lop = n; return true; } return false; }
  if (k !== 'b' && k !== 'g') return false; const ds = dsPhu(), kh = khoangMuc(k, m);
  if (m.lop != null && loaiLop(m.lop, ds.filter(o => o.m !== m)) !== null && loaiLop(m.lop, ds.filter(o => o.m !== m)) !== loaiMuc(k, m)) { m.lop = timLop(k, m, ds); return true; }
  if (ds.some(o => o.m !== m && o.m.lop === m.lop && chongNhau(khoangMuc(o.k, o.m), kh))) { m.lop = timLop(k, m, ds, m.lop); return true; }
  return false;
}
function keyAm(l) { return (l || 1) === 1 ? 'a3' : 'A' + l; }
function hangAm() {
  const tin = $('#tlIn'), a3 = tin.querySelector('.track.a3'), dung = [...new Set((P.am3 || []).map(a => a.lop || 1))].filter(l => l > 1).sort((a, b) => b - a); let moi = false;
  if (a3) a3.dataset.alop = 1;
  tin.querySelectorAll('.track.amx').forEach(tr => { if (!dung.includes(+tr.dataset.alop)) tr.remove(); });
  dung.forEach(l => { let tr = tin.querySelector('.track[data-alop="' + l + '"]'); if (!tr) { tr = el('div', 'track amx'); tr.dataset.track = keyAm(l); tr.dataset.alop = l; tr.innerHTML = '<div class="lb"></div>'; TR_NUT[tr.dataset.track] = ['tat', 'khoa']; dauTrack(tr); moi = true; } a3.after(tr); });
  if (moi) veTrNut();
}
function hangAmCua(l) { return $('#tlIn .track[data-alop="' + (l || 1) + '"]'); }
function hienTip(ev, txt) { let t = $('#tipKeo'); if (!t) { t = el('div'); t.id = 'tipKeo'; document.body.appendChild(t); } if (!txt) { t.style.display = 'none'; return; } t.textContent = txt; t.style.display = 'block'; t.style.left = (ev.clientX + 14) + 'px'; t.style.top = (ev.clientY - 30) + 'px'; }

/* ═════════ BẢNG CAPCUT: chọn nhiều · nam châm track chính · liên kết · preview axis · gộp nhóm · đường cong keyframe · đường cong tốc độ ═════════ */
const MANG = () => ({ v: P.clips, b: P.broll, g: P.gfx, a: P.am3 || [], t: P.tieng });
function moiMuc() { const o = []; Object.entries(MANG()).forEach(([k, arr]) => arr.forEach(m => o.push({ k, m }))); return o; }
function dsNhieu() { const tat = moiMuc(); return (P.nhieu || []).filter(o => tat.some(x => x.m === o.m)); }
function dangChon(m) { return (P.nhieu || []).some(o => o.m === m); }
function batDau2(k, m) { return k === 'g' ? m.bd : m.t_bd; }
function datBatDau(k, m, t) { t = khungGiay(t); if (k === 'g') { const len = m.kt - m.bd; m.bd = t; m.kt = khungGiay(t + len); } else m.t_bd = t; }
function danhDauNhieu() { const ds = dsNhieu(); $$('#tlIn .item[data-k]').forEach(d => { const m = MANG()[d.dataset.k] && MANG()[d.dataset.k][+d.dataset.i]; d.classList.toggle('nhieu', !!m && ds.length > 1 && ds.some(o => o.m === m)); d.classList.toggle('coNhom', !!(m && m.nhom)); }); }
function batChonNhieu(k, m) {
  let ds = dsNhieu(); if (!ds.length && P.chon) { const m0 = mucChon(); if (m0) ds = [{ k: P.chon.k, m: m0 }]; }
  const thanh = m.nhom ? moiMuc().filter(o => o.m.nhom === m.nhom) : [{ k, m }];
  if (ds.some(o => o.m === m)) ds = ds.filter(o => !thanh.some(x => x.m === o.m)); else ds = [...ds, ...thanh.filter(x => !ds.some(o => o.m === x.m))];
  P.nhieu = ds; const dau = ds[ds.length - 1]; P.chon = dau ? { k: dau.k, i: MANG()[dau.k].indexOf(dau.m) } : null; chonHien(); veProp(); danhDauNhieu();
}
function chonTatCa() { P.nhieu = moiMuc().filter(o => !o.m.trong); const d = P.nhieu[0]; P.chon = d ? { k: d.k, i: MANG()[d.k].indexOf(d.m) } : null; chonHien(); veProp(); danhDauNhieu(); toast('Đã chọn ' + P.nhieu.length + ' mục'); }
function xoaNhieu(yen) {
  const ds0 = dsNhieu(), ds = ds0.filter(o => !khoaMuc(o.k, o.m)); if (ds.length < ds0.length) baoKhoa(); if (!ds.length) return; if (!yen) luuHoanTac();
  const v1 = ds.filter(o => o.k === 'v').map(o => o.m); let acc = 0; const st = new Map(); P.clips.forEach(c => { st.set(c, acc); acc += daiC(c); });
  v1.sort((a, b) => st.get(b) - st.get(a)).forEach(c => { ripple(st.get(c) + daiC(c), -daiC(c)); P.clips.splice(P.clips.indexOf(c), 1); });
  ['b', 'g', 'a', 't'].forEach(k => { const arr = MANG()[k]; ds.filter(o => o.k === k).forEach(o => { const j = arr.indexOf(o.m); if (j >= 0) arr.splice(j, 1); }); });
  P.nhieu = []; P.chon = null; veTl(); veLoi(); veKhung(); veProp(); if (!yen) toast('Đã xoá ' + ds.length + ' mục');
}
function saoChepNhieu() { const ds = dsNhieu(); let acc = 0; const st = new Map(); P.clips.forEach(c => { st.set(c, acc); acc += daiC(c); }); const bd = o => o.k === 'v' ? st.get(o.m) : batDau2(o.k, o.m), min = Math.min(...ds.map(bd)); P.boNho = { nhieu: ds.map(o => ({ k: o.k, d: JSON.parse(JSON.stringify({ ...o.m, el: undefined, gain: undefined })), off: bd(o) - min, goc: o.k === 't' ? o.m : null })) }; toast('Đã sao chép ' + ds.length + ' mục'); }
function danNhieu() {
  luuHoanTac(); const moi = []; const v1 = P.boNho.nhieu.filter(x => x.k === 'v');
  if (v1.length) { const { clip, bdTl } = viTri(P.t); let vt = clip < 0 ? P.clips.length : (P.t - bdTl < daiC(P.clips[clip]) / 2 ? clip : clip + 1); const diem = P.clips.slice(0, vt).reduce((s, c) => s + daiC(c), 0); let them = 0; const ch = chupChen(); v1.forEach(x => { const c = JSON.parse(JSON.stringify(x.d)); P.clips.splice(vt++, 0, c); them += daiC(c); moi.push({ k: 'v', m: c }); }); apChen(ch, diem, them); }
  P.boNho.nhieu.filter(x => x.k !== 'v').forEach(x => { if (x.k === 't') { if (!x.goc) return; const t = { ...x.goc, el: null, gain: null, id: uid() }; t.t_bd = +(P.t + x.off).toFixed(3); P.tieng.push(t); moi.push({ k: 't', m: t }); return; } const d = JSON.parse(JSON.stringify(x.d)); d.id = uid(); delete d.lop; if (d.nhom) d.nhom = 'n' + x.d.nhom; datBatDau(x.k, d, P.t + x.off); MANG()[x.k].push(d); moi.push({ k: x.k, m: d }); });
  P.nhieu = moi; veTl(); veLoi(); veKhung(); veProp(); toast('Đã dán ' + moi.length + ' mục tại ' + fmt1(P.t) + 's');
}
function gopNhom() { const ds = dsNhieu().filter(o => o.k !== 'v'); if (ds.length < 2) { toast('Chọn ít nhất 2 mục (Ctrl + bấm) rồi gộp'); return; } luuHoanTac(); const id = uid(); ds.forEach(o => { o.m.nhom = id; }); veTl(); veProp(); toast('Đã gộp ' + ds.length + ' mục thành một nhóm · kéo một mục là cả nhóm đi theo'); }
function boGopNhom() { const ds = dsNhieu().length ? dsNhieu() : (P.chon ? [{ m: mucChon() }] : []); const ids = new Set(ds.map(o => o.m && o.m.nhom).filter(Boolean)); if (!ids.size) { toast('Mục đang chọn không thuộc nhóm nào'); return; } luuHoanTac(); moiMuc().forEach(o => { if (ids.has(o.m.nhom)) delete o.m.nhom; }); veTl(); veProp(); toast('Đã bỏ gộp nhóm'); }
/* liên kết: mục nằm trên đoạn V1 nào thì đi theo đoạn đó khi đổi chỗ / tắt mở nam châm */
function chupLienKet() { const ds = [], tim = s => { let a = 0; for (const c of P.clips) { const d = daiC(c); if (s < a + d - 1e-6) return { c, off: s - a }; a += d; } return null; }; [['b', P.broll], ['a', P.am3 || []], ['t', P.tieng], ['g', P.gfx]].forEach(([k, arr]) => arr.forEach(m => { const r = tim(batDau2(k, m)); if (r) ds.push({ k, m, c: r.c, off: r.off }); })); return ds; }
function apLienKet(ds) { const st = new Map(); let acc = 0; P.clips.forEach(c => { st.set(c, acc); acc += daiC(c); }); ds.forEach(x => { if (!st.has(x.c)) return; datBatDau(x.k, x.m, st.get(x.c) + x.off); }); }
/* nam châm track chính tắt: đặt đoạn V1 tự do, để trống ở giữa */
function dichV1Tu(i, T) {
  const me = P.clips[i]; if (!me) return false; const ds = []; let acc = 0; P.clips.forEach(c => { if (!c.trong && c !== me) ds.push({ c, s: acc }); acc += daiC(c); });
  T = Math.max(0, T); const D = daiC(me); if (ds.some(x => T < x.s + daiC(x.c) - 0.01 && x.s < T + D - 0.01)) return false;
  ds.push({ c: me, s: T }); ds.sort((a, b) => a.s - b.s); const moi = []; let cur = 0;
  ds.forEach(x => { if (x.s - cur > 0.01) moi.push({ trong: true, src: '', bd: 0, kt: +(x.s - cur).toFixed(3) }); moi.push(x.c); cur = x.s + daiC(x.c); });
  P.clips = moi; P.chon = { k: 'v', i: moi.indexOf(me) }; return true;
}
function datLaiV1(i, vtMoi, T) {
  const lk = P.lienKet !== false ? chupLienKet() : null;
  if (P.namCham === false && T != null && dichV1Tu(i, T)) { if (lk) apLienKet(lk); return; }
  if (vtMoi !== i) { const [m] = P.clips.splice(i, 1); P.clips.splice(vtMoi, 0, m); P.chon = { k: 'v', i: vtMoi }; }
  if (lk) apLienKet(lk);
}
function doiNamCham() { P.namCham = P.namCham === false; const b = $('#btnNamCham'); b.setAttribute('aria-pressed', String(P.namCham)); if (P.namCham && P.clips.some(c => c.trong)) { luuHoanTac(); const lk = P.lienKet !== false ? chupLienKet() : null; P.clips = P.clips.filter(c => !c.trong); if (lk) apLienKet(lk); veTl(); veKhung(); } toast(P.namCham ? 'Nam châm track chính: BẬT · các đoạn luôn liền nhau' : 'Nam châm track chính: TẮT · kéo đoạn tự do, được để khoảng trống'); }
/* đường cong tốc độ (speed ramp, như CapCut Curve) */
const CONG_MAU = { montage: ['Montage', [0.6, 2.5, 0.6, 2.5, 0.6]], hero: ['Anh hùng', [1.6, 1.6, 0.3, 1.6, 1.6]], bullet: ['Đạn bay', [2, 0.25, 0.25, 0.25, 2]], jump: ['Nhảy cắt', [1, 1, 4, 1, 1]], flash_in: ['Vụt vào', [4, 2, 1, 1, 1]], flash_out: ['Vụt ra', [1, 1, 1, 2, 4]] };
function congTb(v) { let s = 0; for (let i = 0; i < 4; i++) s += (v[i] + v[i + 1]) / 8; return s; }
function congTich(v, u) { let s = 0; for (let i = 0; i < 4; i++) { const a = i * 0.25; if (u <= a) break; const e = Math.min(u, a + 0.25), ve = v[i] + (v[i + 1] - v[i]) * (e - a) / 0.25; s += (v[i] + ve) / 2 * (e - a); } return s; }
function tocTai(c, off) { if (!c.cong) return tocC(c); const u = Math.max(0, Math.min(1, off / daiC(c))), i = Math.min(3, Math.floor(u * 4)), f = u * 4 - i; return c.cong[i] + (c.cong[i + 1] - c.cong[i]) * f; }
function srcTuTl(c, off) { if (!c.cong) return off * tocC(c); const D = daiC(c); return D * congTich(c.cong, Math.max(0, Math.min(1, off / D))); }
function tlTuSrc(c, s) { if (!c.cong) return s / tocC(c); const D = daiC(c); if (s <= 0) return 0; if (s >= c.kt - c.bd) return D; let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (D * congTich(c.cong, mid) < s) lo = mid; else hi = mid; } return D * (lo + hi) / 2; }
/* đường cong tốc độ mà vẫn giữ cao độ giọng (như xem trước): chia thành khúc ~0,12s, mỗi khúc co giãn bằng WSOLA theo tốc độ riêng, nối chồng 10 ms */
function gianCongGiuCao(oc, buf, c) {
  const sr = buf.sampleRate, D = daiC(c), n = Math.max(1, Math.round(D * sr)), ra = oc.createBuffer(buf.numberOfChannels, n, sr), soKhuc = Math.max(1, Math.min(80, Math.round(D / 0.12))), OV = Math.round(0.01 * sr);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch), o = ra.getChannelData(ch);
    for (let i = 0; i < soKhuc; i++) {
      const t0 = D * i / soKhuc, t1 = D * (i + 1) / soKhuc, s0 = c.bd + srcTuTl(c, t0), s1 = c.bd + srcTuTl(c, t1), kk = Math.max(0.05, (s1 - s0) / (t1 - t0));
      const a = Math.max(0, Math.floor(s0 * sr)), b = Math.min(d.length, Math.ceil((s1 + (OV / sr) * kk) * sr) + 1024);
      if (b - a < 1100) continue;
      const kh = keoGian(d.subarray(a, b), kk).du_lieu, dau = Math.round(t0 * sr), dai = Math.min(kh.length, Math.round((t1 - t0) * sr) + OV, n - dau);
      for (let j = 0; j < dai; j++) { const w = i > 0 && j < OV ? j / OV : 1; o[dau + j] = o[dau + j] * (1 - w) + kh[j] * w; }
    }
  }
  return ra;
}
function gianCong(oc, buf, c) { const sr = buf.sampleRate, D = daiC(c), n = Math.max(1, Math.round(D * sr)), ra = oc.createBuffer(buf.numberOfChannels, n, sr); for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch), o = ra.getChannelData(ch); for (let i = 0; i < n; i++) { const x = (c.bd + srcTuTl(c, i / sr)) * sr, j = Math.floor(x), f = x - j; o[i] = j + 1 < d.length ? d[j] * (1 - f) + d[j + 1] * f : 0; } } return ra; }
const yCong = v => 14 - Math.log10(Math.max(0.1, Math.min(10, v))) * 13;
function svgCong(v) { return '<svg viewBox="0 0 60 28"><path d="M0 14H60" stroke="#444" stroke-dasharray="2 2"/><polyline fill="none" stroke="currentColor" stroke-width="2" points="' + v.map((x, i) => (i * 15) + ',' + yCong(x).toFixed(1)).join(' ') + '"/></svg>'; }
function veCongToc(box, c) {
  const n = el('div', 'congToc'); box.appendChild(n); n.appendChild(el('span', 'nhanCong', 'Đường cong tốc độ'));
  const ap = v => { luuHoanTac(); let acc = 0; for (const k of P.clips) { if (k === c) break; acc += daiC(k); } const cu = daiC(c); if (v) c.cong = v.map(x => +x.toFixed(3)); else delete c.cong; ripple(acc + cu, daiC(c) - cu); veTl(); veProp(); veKhung(); };
  const row = el('div', 'mauCong'), b0 = el('button', !c.cong ? 'on' : null); b0.type = 'button'; b0.innerHTML = svgCong([1, 1, 1, 1, 1]) + '<span>Không</span>'; b0.onclick = () => ap(null); row.appendChild(b0);
  Object.entries(CONG_MAU).forEach(([k, [ten, v]]) => { const b = el('button', c.cong && c.cong.join() === v.join() ? 'on' : null); b.type = 'button'; b.dataset.k = k; b.innerHTML = svgCong(v) + '<span>' + ten + '</span>'; b.onclick = () => ap(v); row.appendChild(b); }); n.appendChild(row);
  if (!c.cong) return;
  const W = 240, H = 100, sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sv.classList.add('suaCong'); const v = c.cong.slice(), yy = x => 50 - Math.log10(x) * 45, tu = y => Math.pow(10, (50 - y) / 45);
  const ve = () => { sv.innerHTML = '<path d="M0 50H240" stroke="#555" stroke-dasharray="3 3"/><text x="2" y="10" fill="#777" font-size="9">10×</text><text x="2" y="96" fill="#777" font-size="9">0,1×</text><polyline fill="none" stroke="#22d3df" stroke-width="2" points="' + v.map((x, i) => (10 + i * 55) + ',' + yy(x).toFixed(1)).join(' ') + '"/>' + v.map((x, i) => '<circle data-i="' + i + '" cx="' + (10 + i * 55) + '" cy="' + yy(x).toFixed(1) + '" r="6" fill="#fff" stroke="#22d3df" stroke-width="2" style="cursor:ns-resize"/>').join(''); };
  ve(); sv.addEventListener('pointerdown', e => { const ci = e.target.closest('circle'); if (!ci) return; e.preventDefault(); const i = +ci.dataset.i, r = sv.getBoundingClientRect(); sv.setPointerCapture(e.pointerId); const mv = ev => { const y = (ev.clientY - r.top) / r.height * H; v[i] = Math.max(0.1, Math.min(10, tu(Math.max(5, Math.min(95, y))))); ve(); hienTip(ev, v[i].toFixed(2).replace('.', ',') + '×'); }; const up = () => { sv.removeEventListener('pointermove', mv); sv.removeEventListener('pointerup', up); hienTip(null); ap(v); }; sv.addEventListener('pointermove', mv); sv.addEventListener('pointerup', up); });
  n.appendChild(sv); n.appendChild(el('div', 'quota', 'Kéo 5 điểm lên xuống: trên = nhanh (tới 10×), dưới = chậm (tới 0,1×). Đoạn dài ' + fmt1(daiC(c)) + 's, giọng đổi cao độ theo tốc độ như CapCut.'));
}
/* đường cong keyframe (ease) có xem trước + tuỳ chỉnh bezier */
function bezierFn(b) { const [x1, y1, x2, y2] = b, bx = t => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t, by = t => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t; return p => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (bx(m) < p) lo = m; else hi = m; } return by((lo + hi) / 2); }; }
function svgEase(fn) { let d = ''; for (let i = 0; i <= 20; i++) { const p = i / 20; d += (i ? 'L' : 'M') + (2 + p * 40).toFixed(1) + ' ' + (28 - fn(p) * 22).toFixed(1); } return '<svg viewBox="0 0 44 32"><path d="M2 28H42M2 6H42" stroke="#444" stroke-dasharray="2 2"/><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2"/></svg>'; }
function veChonCong(n, tai) {
  const box = el('div', 'congKf'); box.appendChild(el('span', 'nhanCong', 'Đường cong tới mốc này')); const row = el('div', 'mauCong'), cur = tai[0].bz ? 'bz' : (tai[0].e || 'mem');
  Object.keys(EASE_TEN).forEach(e => { const b = el('button', cur === e ? 'on' : null); b.type = 'button'; b.dataset.e = e; b.innerHTML = svgEase(EASE_KF[e]) + '<span>' + EASE_TEN[e] + '</span>'; b.onclick = () => { luuHoanTac(); tai.forEach(f => { f.e = e; delete f.bz; }); veProp(); veKhung(); }; row.appendChild(b); });
  const bt = el('button', cur === 'bz' ? 'on' : null); bt.type = 'button'; bt.dataset.e = 'bz'; bt.innerHTML = svgEase(bezierFn(tai[0].bz || [0.3, 0, 0.2, 1])) + '<span>Tuỳ chỉnh</span>'; bt.onclick = () => { luuHoanTac(); const b0 = (tai[0].bz || [0.3, 0, 0.2, 1]).slice(); tai.forEach(f => { f.bz = b0.slice(); }); veProp(); }; row.appendChild(bt); box.appendChild(row);
  if (cur === 'bz') {
    const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('viewBox', '0 0 160 140'); sv.classList.add('suaCong'); const b = tai[0].bz.slice(), X = x => 20 + x * 120, Y = y => 110 - y * 80;
    const ve = () => { const fn = bezierFn(b); let d = ''; for (let i = 0; i <= 30; i++) { const p = i / 30; d += (i ? 'L' : 'M') + X(p).toFixed(1) + ' ' + Y(fn(p)).toFixed(1); } sv.innerHTML = '<rect x="20" y="30" width="120" height="80" fill="none" stroke="#444"/><line x1="20" y1="110" x2="' + X(b[0]) + '" y2="' + Y(b[1]) + '" stroke="#888"/><line x1="140" y1="30" x2="' + X(b[2]) + '" y2="' + Y(b[3]) + '" stroke="#888"/><path d="' + d + '" fill="none" stroke="#22d3df" stroke-width="2"/><circle data-h="0" cx="' + X(b[0]) + '" cy="' + Y(b[1]) + '" r="6" fill="#ffd400" style="cursor:move"/><circle data-h="1" cx="' + X(b[2]) + '" cy="' + Y(b[3]) + '" r="6" fill="#ffd400" style="cursor:move"/>'; };
    ve(); sv.addEventListener('pointerdown', e => { const ci = e.target.closest('circle'); if (!ci) return; e.preventDefault(); const h = +ci.dataset.h, r = sv.getBoundingClientRect(); sv.setPointerCapture(e.pointerId); const mv = ev => { const x = ((ev.clientX - r.left) / r.width * 160 - 20) / 120, y = (110 - (ev.clientY - r.top) / r.height * 140) / 80; b[h * 2] = +Math.max(0, Math.min(1, x)).toFixed(3); b[h * 2 + 1] = +Math.max(-0.5, Math.min(1.5, y)).toFixed(3); tai.forEach(f => { f.bz = b.slice(); }); ve(); if (!P.dang) veKhung(); }; const up = () => { sv.removeEventListener('pointermove', mv); sv.removeEventListener('pointerup', up); }; sv.addEventListener('pointermove', mv); sv.addEventListener('pointerup', up); });
    box.appendChild(sv); box.appendChild(el('div', 'quota', 'Kéo 2 núm vàng để chỉnh nhịp: dốc đứng = nhanh, phẳng = chậm, vượt khung = nảy quá rồi về.'));
  }
  n.appendChild(box);
}
/* preview axis: rê chuột trên dòng thời gian là thấy khung hình tại đó */
let xemBan = false, xemCho = null;
async function xemTruocTai(t) { if (xemBan) { xemCho = t; return; } xemBan = true; try { await veKhungXuat(cx, cv.width, cv.height, t); } catch { } xemBan = false; if (xemCho != null) { const t2 = xemCho; xemCho = null; xemTruocTai(t2); } }
function khoiTaoBang() {
  P.namCham = true; P.lienKet = true; P.xemTruc = false;
  $('#btnNamCham').onclick = doiNamCham; $('#btnLienKet').onclick = () => { P.lienKet = P.lienKet === false; $('#btnLienKet').setAttribute('aria-pressed', String(P.lienKet)); toast(P.lienKet ? 'Liên kết: BẬT · chữ, b-roll, âm thanh đi theo đoạn chính' : 'Liên kết: TẮT'); };
  $('#btnXemTruc').onclick = () => { P.xemTruc = !P.xemTruc; $('#btnXemTruc').setAttribute('aria-pressed', String(P.xemTruc)); if (!P.xemTruc) { $('#phXem').style.display = 'none'; veKhung(); } toast(P.xemTruc ? 'Preview axis: BẬT · rê chuột trên dòng thời gian để xem trước' : 'Preview axis: TẮT'); };
  const tin = $('#tlIn'), sc = $('#tlScroll'), phX = el('div'); phX.id = 'phXem'; tin.appendChild(phX);
  tin.addEventListener('pointermove', e => { if (!P.xemTruc || e.buttons || P.dang || P.dangKeo || e.target.closest('.lb')) return; const t = tChuot(e); phX.style.display = 'block'; phX.style.left = (LB + t * PX()) + 'px'; xemTruocTai(t); });
  tin.addEventListener('pointerleave', () => { if (!P.xemTruc || P.dang) return; phX.style.display = 'none'; xemCho = null; setTimeout(() => { if (!xemBan) veKhung(); }, 60); });
  // kéo khung chọn ở chỗ trống của track
  tin.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.pointerType === 'touch' || e.target.closest('.item') || e.target.closest('.lb') || e.target.closest('.moc') || e.clientY <= $('#ruler').getBoundingClientRect().bottom) return;
    e.preventDefault();   // chặn chọn chữ / kéo thả gốc của trình duyệt (gây pointercancel giữa chừng)
    const r0 = tin.getBoundingClientRect(), x0 = e.clientX - r0.left, y0 = e.clientY - r0.top; let k = null; const them = e.ctrlKey || e.metaKey || e.shiftKey, cu = them ? dsNhieu() : [];
    try { tin.setPointerCapture(e.pointerId); } catch { }
    const mv = ev => { const r = tin.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top; if (!k) { if (Math.hypot(x - x0, y - y0) < 5) return; k = el('div'); k.id = 'khungChon'; tin.appendChild(k); }
      const L = Math.min(x, x0), T = Math.min(y, y0), Wd = Math.abs(x - x0), Hd = Math.abs(y - y0); Object.assign(k.style, { left: L + 'px', top: T + 'px', width: Wd + 'px', height: Hd + 'px' });
      const ds = [...cu], pdDs = them ? [...(P.nhieuPd || [])] : []; $$('#tlIn .track:not(.rong) .item[data-k], #tlIn .track:not(.rong) .item.pdIt').forEach(d => { const b = d.getBoundingClientRect(), bl = b.left - r.left, bt = b.top - r.top; if (bl < L + Wd && bl + b.width > L && bt < T + Hd && bt + b.height > T) { if (d.classList.contains('pdIt')) { const j = +d.dataset.pd; if (!isNaN(j) && !pdDs.includes(j)) pdDs.push(j); return; } const arr = MANG()[d.dataset.k]; if (!arr) return; const m = arr[+d.dataset.i]; if (m && !m.trong && !ds.some(o => o.m === m)) ds.push({ k: d.dataset.k, m }); } });
      P.nhieu = ds; P.nhieuPd = pdDs.sort((a, b) => a - b); danhDauNhieu(); };
    const up = ev => { if (ev && ev.type === 'pointercancel') return;   // mất capture (dòng thời gian vẽ lại) vẫn kéo tiếp, chờ pointerup
      tin.removeEventListener('pointermove', mv); tin.removeEventListener('pointerup', up); tin.removeEventListener('pointercancel', up); window.removeEventListener('pointerup', up, true); if (!k) return; k.remove(); const ds = dsNhieu(), nPd = (P.nhieuPd || []).length; const d = ds[0]; P.chon = d ? { k: d.k, i: MANG()[d.k].indexOf(d.m) } : (nPd ? { k: 'pd', i: P.nhieuPd[0] } : null); chonHien(); veProp(); danhDauNhieu(); if (ds.length + nPd > 1) toast('Đã chọn ' + (ds.length + nPd) + ' mục' + (nPd ? ' (' + nPd + ' phụ đề)' : '') + ' · Delete để xoá' + (ds.length > 1 ? ', Ctrl+C sao chép, Ctrl+G gộp nhóm' : '')); };
    tin.addEventListener('pointermove', mv); tin.addEventListener('pointerup', up); tin.addEventListener('pointercancel', up); window.addEventListener('pointerup', up, true);
  });
}

/* ═════════ MOTION GRAPHICS (10/2026): 11 mẫu mới · bám theo lời nói · đồ hoạ AI dạng cảnh JSON có keyframe ═════════
   Tất cả là hàm thuần của thời gian (tua tới giây nào cũng đúng hình), xem trước và xuất dùng chung một bộ vẽ. */
const mucCua = g => String(g.text || '').split('|').map(x => x.trim()).filter(Boolean);
/* mốc xuất hiện của mục thứ i: theo lời nói nếu bật "bám theo lời", không thì rải đều */
function mocMuc(g, i, n, dai) { const m = g.bam_loi && g.moc_tu && g.moc_tu[i]; if (m != null && isFinite(m)) return Math.max(0, m - g.bd); return (i / Math.max(1, n)) * dai * 0.85; }
function veMauMoi(ctx, W, H, g, tl, dai, mau) {
  const Wt = Math.min(W, H * 0.75), k = g.kieu, vao = ease(tl / 0.35);
  ctx.textBaseline = 'middle';
  if (k === 'bieu_do_duong' || k === 'bieu_do_vung') return veBieuDoDuong(ctx, W, H, g, tl, dai, /^#[0-9a-f]{6}$/i.test(mau) ? mau : '#99DF00', k === 'bieu_do_vung');
  if (k === 'bieu_do_cot') {
    const muc = mucCua(g).map(x => { const m = x.match(/^(.*?)[:=]\s*(-?[\d.,]+)\s*(.*)$/); return m ? { ten: m[1].trim(), so: parseFloat(m[2].replace(',', '.')), dv: m[3] || g.phu || '' } : { ten: x, so: 0, dv: '' }; });
    const n = muc.length || 1, max = Math.max(...muc.map(m => m.so), 1), x0 = W * 0.12, w = W * 0.76, h = H * 0.3, y0 = H * 0.66, bw = w / n * 0.62, size = Math.round(Wt * 0.042);
    ctx.fillStyle = 'rgba(10,12,14,.72)'; ctx.beginPath(); ctx.roundRect(x0 - W * 0.04, y0 - h - size * 3, w + W * 0.08, h + size * 5, Wt * 0.04); ctx.fill();
    muc.forEach((m, i) => { const moc = mocMuc(g, i, n, dai * 0.6), a = ease((tl - moc) / 0.6), bh = h * (m.so / max) * a, bx = x0 + (i + 0.5) * w / n - bw / 2;
      ctx.fillStyle = i === n - 1 ? mau : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.roundRect(bx, y0 - bh, bw, Math.max(1, bh), [Wt * 0.015, Wt * 0.015, 0, 0]); ctx.fill();
      ctx.textAlign = 'center'; ctx.font = '900 ' + size + 'px ' + FONT; ctx.fillStyle = '#fff'; if (a > 0.05) ctx.fillText(fmtSo(m.so * a, m.so) + m.dv, bx + bw / 2, y0 - bh - size * 0.8);
      ctx.font = '700 ' + Math.round(size * 0.8) + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(m.ten, bx + bw / 2, y0 + size * 0.9); });
    return true;
  }
  if (k === 'bieu_do_tron') {
    const m = String(g.text || '0').match(/(-?[\d.,]+)/), so = m ? parseFloat(m[1].replace(',', '.')) : 0, p = Math.max(0, Math.min(1, so / 100)) * ease(tl / Math.max(0.8, dai * 0.5)), r = Wt * 0.2, cx0 = W / 2, cy0 = H * 0.42;
    ctx.fillStyle = 'rgba(10,12,14,.7)'; ctx.beginPath(); ctx.arc(cx0, cy0, r * 1.35, 0, 7); ctx.fill();
    ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(cx0, cy0, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = mau; ctx.beginPath(); ctx.arc(cx0, cy0, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(r * 0.62) + 'px ' + FONT; ctx.fillText(Math.round(p * 100) + '%', cx0, cy0);
    if (g.phu) { ctx.font = '800 ' + Math.round(Wt * 0.045) + 'px ' + FONT; ctx.fillText(g.phu, cx0, cy0 + r * 1.75); }
    return true;
  }
  if (k === 'truoc_sau' || k === 'so_sanh') {
    const [a1, a2] = (mucCua(g).concat(['', ''])).slice(0, 2), size = Math.round(Wt * 0.05), cw = W * 0.4, ch = H * 0.16, y = H * 0.4;
    const t1 = ease(tl / 0.4), t2 = ease((tl - mocMuc(g, 1, 2, dai * 0.7)) / 0.4);
    [[a1, W * 0.27, t1, k === 'truoc_sau' ? 'TRƯỚC' : '', 'rgba(255,255,255,.88)', '#141414', -1], [a2, W * 0.73, t2, k === 'truoc_sau' ? 'SAU' : '', mau, '#101400', 1]].forEach(([tx, x, a, nh, nen, chuMau, huong]) => {
      if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + huong * (1 - a) * W * 0.3, y); ctx.fillStyle = nen; ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, ch, Wt * 0.03); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = chuMau; if (nh) { ctx.font = '800 ' + Math.round(size * 0.6) + 'px ' + FONT; ctx.globalAlpha *= 0.7; ctx.fillText(nh, 0, -ch * 0.28); ctx.globalAlpha /= 0.7; }
      ctx.font = '900 ' + size + 'px ' + FONT; ctx.fillText(tx, 0, nh ? ch * 0.08 : 0, cw * 0.9); ctx.restore(); });
    if (k === 'so_sanh') { const v = ease((tl - 0.3) / 0.3); if (v > 0) { ctx.save(); ctx.translate(W / 2, y); ctx.scale(0.5 + 0.5 * v + 0.15 * Math.sin(v * Math.PI), 0.5 + 0.5 * v + 0.15 * Math.sin(v * Math.PI)); ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(0, 0, size * 1.1, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 ' + size + 'px ' + FONT; ctx.fillText('VS', 0, 2); ctx.restore(); } }
    else if (t2 > 0) { ctx.save(); ctx.globalAlpha *= t2; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 ' + Math.round(size * 1.3) + 'px ' + FONT; ctx.fillText('→', W / 2, y); ctx.restore(); }
    return true;
  }
  if (k === 'checklist') {
    const muc = mucCua(g), n = muc.length || 1, size = Math.round(Wt * 0.05);
    muc.forEach((m, i) => { const moc = mocMuc(g, i, n, dai), a = ease((tl - moc) / 0.3), c = ease((tl - moc - 0.25) / 0.3); if (a <= 0) return; const y = H * 0.34 + i * size * 1.9, x = W * 0.1 + (1 - a) * -W * 0.08;
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(10,12,14,.78)'; ctx.font = '800 ' + size + 'px ' + FONT; ctx.beginPath(); ctx.roundRect(x - size * 0.4, y - size * 0.75, ctx.measureText(m).width + size * 2.6, size * 1.5, size * 0.35); ctx.fill();
      ctx.strokeStyle = mau; ctx.lineWidth = size * 0.12; ctx.beginPath(); ctx.roundRect(x, y - size * 0.4, size * 0.8, size * 0.8, size * 0.15); ctx.stroke();
      if (c > 0) { ctx.lineWidth = size * 0.16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + size * 0.15, y); const p1 = Math.min(1, c * 2), p2 = Math.max(0, c * 2 - 1); ctx.lineTo(x + size * (0.15 + 0.2 * p1), y + size * 0.22 * p1); if (p2 > 0) ctx.lineTo(x + size * (0.35 + 0.35 * p2), y + size * (0.22 - 0.5 * p2)); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(m, x + size * 1.3, y); ctx.restore(); });
    return true;
  }
  if (k === 'binh_luan') {
    const size = Math.round(Wt * 0.04), w = W * 0.78, x = W * 0.11, y = H * 0.18 - (1 - vao) * H * 0.05, ten = g.phu || 'người xem';
    ctx.save(); ctx.globalAlpha *= vao; ctx.font = '600 ' + Math.round(size * 1.05) + 'px ' + FONT; const dong = chiaChu(ctx, String(g.text || ''), w - size * 3.6), h = size * (2.6 + dong.length * 1.35);
    ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, size * 0.8); ctx.fill();
    ctx.fillStyle = mau; ctx.beginPath(); ctx.arc(x + size * 1.6, y + size * 1.6, size * 0.95, 0, 7); ctx.fill(); ctx.fillStyle = '#101400'; ctx.textAlign = 'center'; ctx.font = '900 ' + size + 'px ' + FONT; ctx.fillText(ten.replace('@', '').slice(0, 1).toUpperCase(), x + size * 1.6, y + size * 1.62);
    ctx.textAlign = 'left'; ctx.fillStyle = '#6b7280'; ctx.font = '700 ' + Math.round(size * 0.85) + 'px ' + FONT; ctx.fillText((ten[0] === '@' ? '' : '@') + ten + '  ·  Trả lời bình luận', x + size * 3, y + size * 1.25);
    ctx.fillStyle = '#111'; ctx.font = '600 ' + Math.round(size * 1.05) + 'px ' + FONT; dong.forEach((d, i) => ctx.fillText(d, x + size * 3, y + size * (2.6 + i * 1.35)));
    ctx.restore(); return true;
  }
  if (k === 'dang_ky') {
    const size = Math.round(Wt * 0.042), w = W * 0.66, h = size * 2.4, x = W / 2 - w / 2, y = H * 0.78 + (1 - vao) * H * 0.1, bam = tl > dai * 0.45, nhan = ease((tl - dai * 0.45) / 0.2);
    ctx.save(); ctx.globalAlpha *= vao; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = mau; ctx.beginPath(); ctx.arc(x + h / 2, y + h / 2, h * 0.36, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.font = '800 ' + size + 'px ' + FONT; ctx.fillText(String(g.text || '@kenh'), x + h * 1.05, y + h / 2, w * 0.45);
    const bw = w * 0.34, bx = x + w - bw - h * 0.15, s2 = bam ? 1 - 0.12 * Math.sin(nhan * Math.PI) : 1; ctx.save(); ctx.translate(bx + bw / 2, y + h / 2); ctx.scale(s2, s2); ctx.fillStyle = bam ? '#e5e7eb' : '#fe2c55'; ctx.beginPath(); ctx.roundRect(-bw / 2, -h * 0.34, bw, h * 0.68, h * 0.2); ctx.fill(); ctx.fillStyle = bam ? '#111' : '#fff'; ctx.textAlign = 'center'; ctx.font = '800 ' + Math.round(size * 0.85) + 'px ' + FONT; ctx.fillText(bam ? 'Đã follow ✓' : (g.phu || 'Follow'), 0, 1); ctx.restore();
    if (tl > dai * 0.3 && tl < dai * 0.6) { const p = (tl - dai * 0.3) / (dai * 0.3); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(bx + bw / 2 + (1 - p) * W * 0.15, y + h * 0.8 + (1 - p) * H * 0.05, size * 0.5, 0, 7); ctx.fill(); }
    ctx.restore(); return true;
  }
  if (k === 'dem_nguoc') {
    const n = Math.max(1, Math.min(10, parseInt(g.text, 10) || 3)), buoc = dai / n, i = Math.min(n - 1, Math.floor(tl / buoc)), p = (tl - i * buoc) / buoc, so = n - i, r = Wt * 0.17;
    ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.fillStyle = 'rgba(10,12,14,.75)'; ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, 7); ctx.fill();
    ctx.strokeStyle = mau; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, -Math.PI / 2, -Math.PI / 2 + (1 - p) * Math.PI * 2); ctx.stroke();
    const sc = 1.4 - 0.4 * ease(p / 0.25); ctx.scale(sc, sc); ctx.globalAlpha *= Math.min(1, (1 - p) * 4); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 ' + Math.round(r * 1.1) + 'px ' + FONT; ctx.fillText(String(so), 0, r * 0.05); ctx.restore();
    if (g.phu) { ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.round(Wt * 0.045) + 'px ' + FONT; ctx.fillText(g.phu, W / 2, H * 0.42 + r * 1.65); }
    return true;
  }
  if (k === 'ghim_ban_do') {
    const size = Math.round(Wt * 0.045), x = (g.x == null ? 0.5 : g.x) * W, yd = (g.y == null ? 0.45 : g.y) * H, roi = ease(tl / 0.45), nay = tl < 0.6 ? Math.abs(Math.sin(tl * 14)) * (0.6 - tl) * Wt * 0.05 : 0, y = yd - (1 - roi) * H * 0.3 - nay, r = Wt * 0.05;
    for (let i = 0; i < 2; i++) { const q = ((tl + i * 0.7) % 1.4) / 1.4; ctx.save(); ctx.globalAlpha *= (1 - q) * 0.6; ctx.strokeStyle = mau; ctx.lineWidth = Wt * 0.006; ctx.beginPath(); ctx.ellipse(x, yd, r * (0.4 + q * 2.2), r * (0.15 + q * 0.8), 0, 0, 7); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(x, y - r * 1.6, r, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - r * 1.6, r * 0.42, 0, 7); ctx.fill();
    const a = ease((tl - 0.4) / 0.3); if (a > 0 && g.text) { ctx.save(); ctx.globalAlpha *= a; ctx.font = '800 ' + size + 'px ' + FONT; const w = ctx.measureText(g.text).width + size * 1.4; ctx.fillStyle = 'rgba(10,12,14,.85)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - r * 4.4, w, size * 1.6, size * 0.4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(g.text, x, y - r * 4.4 + size * 0.82); ctx.restore(); }
    return true;
  }
  if (k === 'tim_kiem') {
    const size = Math.round(Wt * 0.045), w = W * 0.8, h = size * 2.3, x = W / 2 - w / 2, y = H * 0.25, q = String(g.text || ''), go = Math.min(1, Math.max(0, (tl - 0.3) / Math.max(0.5, dai * 0.55))), hien = q.slice(0, Math.ceil(q.length * go));
    ctx.save(); ctx.globalAlpha *= vao; ctx.translate(0, (1 - vao) * -H * 0.04); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = size * 0.14; ctx.beginPath(); ctx.arc(x + h * 0.5, y + h * 0.47, size * 0.42, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + h * 0.5 + size * 0.3, y + h * 0.47 + size * 0.3); ctx.lineTo(x + h * 0.5 + size * 0.6, y + h * 0.47 + size * 0.6); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.font = '600 ' + size + 'px ' + FONT; ctx.fillText(hien, x + h * 1.0, y + h / 2, w - h * 1.4); const cw = ctx.measureText(hien).width;
    if (Math.floor(tl * 2.5) % 2 === 0 || go < 1) { ctx.fillStyle = mau === '#ffffff' ? '#111' : '#111'; ctx.fillRect(x + h * 1.0 + Math.min(cw, w - h * 1.4) + 3, y + h * 0.25, size * 0.08, h * 0.5); }
    ctx.restore(); return true;
  }
  if (k === 'thong_bao') {
    const size = Math.round(Wt * 0.038), w = W * 0.86, x = W / 2 - w / 2, h = size * 4.2, ra2 = dai - tl < 0.35 ? ease((dai - tl) / 0.35) : 1, y = H * 0.05 - (1 - Math.min(vao, ra2)) * h * 1.6;
    ctx.save(); ctx.fillStyle = 'rgba(245,245,247,.97)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, size * 0.9); ctx.fill();
    ctx.fillStyle = mau; ctx.beginPath(); ctx.roundRect(x + size * 0.7, y + size * 0.7, size * 1.9, size * 1.9, size * 0.45); ctx.fill(); ctx.fillStyle = '#101400'; ctx.textAlign = 'center'; ctx.font = '900 ' + size + 'px ' + FONT; ctx.fillText('✓', x + size * 1.65, y + size * 1.68);
    ctx.textAlign = 'left'; ctx.fillStyle = '#111'; ctx.font = '800 ' + size + 'px ' + FONT; ctx.fillText(String(g.text || 'Thông báo'), x + size * 3.2, y + size * 1.3, w - size * 6); ctx.fillStyle = '#6b7280'; ctx.font = '600 ' + Math.round(size * 0.8) + 'px ' + FONT; ctx.textAlign = 'right'; ctx.fillText('bây giờ', x + w - size * 0.8, y + size * 1.3);
    ctx.textAlign = 'left'; ctx.fillStyle = '#374151'; ctx.font = '600 ' + Math.round(size * 0.92) + 'px ' + FONT; ctx.fillText(String(g.phu || ''), x + size * 3.2, y + size * 2.85, w - size * 4); ctx.restore(); return true;
  }
  if (k === 'ai') { veCanhAI(ctx, W, H, g.canh, tl, dai, mau); return true; }
  return false;
}
function fmtSo(v, dich) { const le = String(dich).includes('.') ? 1 : 0; return v.toLocaleString('vi-VN', { maximumFractionDigits: le, minimumFractionDigits: le && v ? le : 0 }); }
function chiaChu(ctx, text, maxW) { const out = []; let cur = ''; String(text).split(/\s+/).forEach(w => { const th = cur ? cur + ' ' + w : w; if (ctx.measureText(th).width > maxW && cur) { out.push(cur); cur = w; } else cur = th; }); if (cur) out.push(cur); return out.slice(0, 4); }

/* ── bám theo lời: thời điểm từng từ trên dòng thời gian, tìm cụm từ ── */
function tuTrenTl() { const out = []; let acc = 0; P.clips.forEach(c => { const s = srcCua(c.src), k = tocC(c); if (s && s.tu) s.tu.forEach(w => { if (w.bd >= c.bd - 0.02 && w.kt <= c.kt + 0.05) out.push({ w: w.w, n: khongDau(w.w).replace(/[^a-z0-9%]/g, ''), bd: acc + (w.bd - c.bd) / k, kt: acc + (w.kt - c.bd) / k }); }); acc += daiC(c); }); return out; }
function timLoi(cum, tu, tuGiay) {
  tu = tu || tuTrenTl(); const q = khongDau(String(cum)).split(/\s+/).map(x => x.replace(/[^a-z0-9%]/g, '')).filter(Boolean).slice(0, 4); if (!q.length) return [];
  const out = []; for (let i = 0; i < tu.length; i++) { let ok = true; for (let j = 0; j < q.length; j++) { const w = tu[i + j]; if (!w || !(w.n === q[j] || (j === q.length - 1 && w.n.startsWith(q[j]) && q[j].length >= 3))) { ok = false; break; } } if (ok && tu[i].bd >= (tuGiay || 0) - 0.01) out.push(+tu[i].bd.toFixed(2)); }
  if (!out.length && q.length > 1) return timLoi(q.slice(0, 1).join(' '), tu, tuGiay);   // không khớp cả cụm thì thử từ đầu
  return out;
}
const KIEU_NHIEU_MUC = ['danh_sach', 'checklist', 'bieu_do_cot', 'bieu_do_duong', 'bieu_do_vung', 'truoc_sau', 'so_sanh'];
function dongBoBamLoi() { const tu = tuTrenTl(); P.gfx.forEach(g => { if (!g.bam_loi || !KIEU_NHIEU_MUC.includes(g.kieu)) return; let tu0 = Math.max(0, g.bd - 1); g.moc_tu = mucCua(g).map(m => { const ten = m.split(/[:=]/)[0]; const t = timLoi(ten, tu, tu0)[0]; if (t != null) tu0 = t; return t == null ? null : t; }); }); }
function datDungLucNoi(g) { const cum = KIEU_NHIEU_MUC.includes(g.kieu) ? mucCua(g)[0].split(/[:=]/)[0] : (g.kieu === 'dem_so' || g.kieu === 'bieu_do_tron' ? (g.phu || g.text) : g.text); const t = timLoi(cum)[0]; if (t == null) return null; const dai = g.kt - g.bd; g.bd = Math.max(0, +(t - 0.15).toFixed(2)); g.kt = +(g.bd + dai).toFixed(2); if (KIEU_NHIEU_MUC.includes(g.kieu)) { g.bam_loi = true; dongBoBamLoi(); const cuoi = Math.max(...(g.moc_tu || []).filter(x => x != null)); if (isFinite(cuoi) && cuoi + 1.2 > g.kt) g.kt = +(cuoi + 1.5).toFixed(2); } return g.bd; }

/* ── đồ hoạ AI: cảnh JSON gồm các lớp (hộp, tròn, chữ, đường, vòng, số) có keyframe, ease; an toàn vì chỉ là dữ liệu ── */
const EASE_AI = { deu: p => p, vao: p => 1 - Math.pow(1 - p, 3), ra: p => p * p * p, mem: p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2, nay: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); } };
const KF_MD = { x: 0.5, y: 0.5, w: 0.2, h: 0.1, s: 1, xoay: 0, mo: 1, tien_do: 1 };
function kfGia(kf, t, k) { let truoc = null, sau = null; for (const f of kf) { if (f[k] == null || !isFinite(f[k])) continue; if (f.t <= t) truoc = f; else { sau = f; break; } } if (!truoc && !sau) return KF_MD[k]; if (!truoc) return sau[k]; if (!sau) return truoc[k]; const p = Math.max(0, Math.min(1, (t - truoc.t) / Math.max(0.001, sau.t - truoc.t))); return truoc[k] + (sau[k] - truoc[k]) * (EASE_AI[sau.ease] || EASE_AI.vao)(p); }
function mauAI(m, mau) { m = String(m || ''); if (!m || m === 'nhan') return mau; return /^#[0-9a-f]{3,8}$/i.test(m) || /^rgba?\([\d\s.,%]+\)$/i.test(m) ? m : mau; }
function chuanCanh(c) {
  const lop = (c && Array.isArray(c.lop) ? c.lop : []).slice(0, 40).map(l => ({ ...l, loai: ['hop', 'tron', 'chu', 'duong', 'vong', 'so'].includes(l.loai) ? l.loai : 'hop', kf: (Array.isArray(l.kf) && l.kf.length ? l.kf : [{ t: 0 }]).slice(0, 24).map(f => { const o = { t: Math.max(0, +f.t || 0) }; Object.keys(KF_MD).forEach(k => { if (f[k] != null && isFinite(+f[k])) o[k] = +f[k]; }); ['x', 'w'].forEach(k => { if (o[k] > 2) o[k] /= 1080; }); ['y', 'h'].forEach(k => { if (o[k] > 2) o[k] /= 1920; });   /* AI lỡ dùng pixel thì quy về tỉ lệ */ if (f.ease) o.ease = String(f.ease); return o; }).sort((a, b) => a.t - b.t) }));
  return { lop };
}
function veCanhAI(ctx, W, H, canh, tl, dai, mau) {
  if (!canh || !canh.lop) return; const Wt = Math.min(W, H * 0.75);
  canh.lop.forEach(l => {
    const kf = l.kf, g = k => kfGia(kf, tl, k), mo = Math.max(0, Math.min(1, g('mo'))); if (mo <= 0.001) return;
    const x = g('x') * W, y = g('y') * H, w = Math.max(0, g('w')) * W, h = Math.max(0, g('h')) * H, s = g('s'), xoay = g('xoay'), td = Math.max(0, Math.min(1, g('tien_do')));
    ctx.save(); ctx.globalAlpha *= mo; ctx.translate(x, y); if (xoay) ctx.rotate(xoay * Math.PI / 180); if (s !== 1) ctx.scale(s, s);
    const to = mauAI(l.mau, mau), vien = l.vien && l.vien !== 'khong' ? mauAI(l.vien, mau) : '', day = Math.max(0.5, (+l.day || 0.008) * Wt);
    if (l.loai === 'hop') { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2 * Math.max(0, Math.min(1, +l.bo_goc || 0))); if (l.mau !== 'khong') { ctx.fillStyle = to; ctx.fill(); } if (vien) { ctx.strokeStyle = vien; ctx.lineWidth = day; ctx.stroke(); } }
    else if (l.loai === 'tron') { ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, Math.PI * 2); if (l.mau !== 'khong') { ctx.fillStyle = to; ctx.fill(); } if (vien) { ctx.strokeStyle = vien; ctx.lineWidth = day; ctx.stroke(); } }
    else if (l.loai === 'duong') { ctx.strokeStyle = to; ctx.lineWidth = day; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * td, h * td); ctx.stroke(); }
    else if (l.loai === 'vong') { ctx.strokeStyle = to; ctx.lineWidth = day; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, w / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * td); ctx.stroke(); }
    else if (l.loai === 'chu' || l.loai === 'so') {
      let text = l.loai === 'so' ? String(l.dinh_dang || '{}').replace('{}', fmtSo((+l.so_tu || 0) + ((+l.so_den || 0) - (+l.so_tu || 0)) * td, l.so_den)) : String(l.chu || '');
      if (l.loai === 'chu' && td < 1) text = text.slice(0, Math.ceil(text.length * td));
      const nang = l.dam >= 800 ? '900 ' : l.dam >= 600 ? '800 ' : '600 '; let size = Math.max(6, (+l.co || 0.06) * Wt); ctx.font = nang + size + 'px ' + FONT;
      if (+l.rong > 0) { const maxW = +l.rong * W, w0 = ctx.measureText(text).width; if (w0 > maxW && w0 > 0) { size = Math.max(6, size * maxW / w0); ctx.font = nang + size + 'px ' + FONT; } }   /* chữ dài tự thu nhỏ cho vừa khung */
      ctx.textAlign = ['left', 'right'].includes(l.can) ? l.can : 'center'; ctx.textBaseline = 'middle';
      if (vien) { ctx.strokeStyle = vien; ctx.lineWidth = day; ctx.lineJoin = 'round'; ctx.strokeText(text, 0, 0); } ctx.fillStyle = to; ctx.fillText(text, 0, 0);
    }
    ctx.restore();
  });
}
/* AI tạo cảnh qua máy chủ Cloudflare; tự kiểm bằng cách vẽ thử 3 khung xem có hình không */
const kiemCv = document.createElement('canvas');
function kiemCanh(canh, dai) { kiemCv.width = 108; kiemCv.height = Math.round(108 * cv.height / cv.width); const g = kiemCv.getContext('2d'); let co = 0; [0.25, 0.55, 0.9].forEach(p => { g.clearRect(0, 0, kiemCv.width, kiemCv.height); veCanhAI(g, kiemCv.width, kiemCv.height, canh, dai * p, dai, mauNhan()); const d = g.getImageData(0, 0, kiemCv.width, kiemCv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++; if (n > 30) co++; }); return co; }
async function taoDoHoaAI(moTa, bd, dai, g0) {
  if (!MC.url || !MC.dich_vu.agent) throw new Error('Cần máy chủ Cloudflare có AI để tạo đồ hoạ mới');
  if (!TK.token()) { TK.canCo && TK.canCo('chat'); throw new Error('Đăng nhập để tạo đồ hoạ AI'); }
  const tu = tuTrenTl().filter(w => w.bd >= bd - 0.5 && w.bd <= bd + dai + 0.5).map(w => ({ w: w.w, t: +(w.bd - bd).toFixed(2) }));
  const r = await fetch(MC.url + '/do_hoa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: TK.token(), mo_ta: String(moTa).slice(0, 600), dai: +dai.toFixed(2), ti_le: $('#tiLe').value, mau_nhan: mauNhan(), loi: tu.slice(0, 80), cu: g0 && g0.canh ? g0.canh : undefined }) });
  let j = {}; try { j = await r.json(); } catch { }
  if (!j.ok) { if (j.error === 'het_luot_thu') TK.moHet('chat'); throw new Error(j.error === 'het_luot_thu' ? 'Hết lượt chat miễn phí' : j.error === 'ban_qua' ? TK.cauQuaTai(j) : 'AI chưa tạo được (' + (j.error || r.status) + (j.chi_tiet ? ': ' + j.chi_tiet : '') + ')'); }
  const canh = chuanCanh(j.canh); if (!canh.lop.length) throw new Error('AI trả về cảnh trống');
  return { canh, kiem: kiemCanh(canh, dai), luot_con: j.luot_con };
}

const NHAN_CHU = { bieu_do_duong: 'Điểm: Nhãn:số | Nhãn:số', bieu_do_vung: 'Điểm: Nhãn:số | Nhãn:số', hinh: 'Ghi chú (không hiện)', danh_sach: 'Các mục, ngăn bằng |', checklist: 'Các mục, ngăn bằng |', dem_so: 'Con số (VD: 80%)', bieu_do_cot: 'Cột: Nhãn:số | Nhãn:số', bieu_do_tron: 'Phần trăm (VD: 72%)', truoc_sau: 'Trước | Sau', so_sanh: 'Bên A | Bên B', binh_luan: 'Nội dung bình luận', dang_ky: 'Tên kênh (@...)', dem_nguoc: 'Đếm từ số (1–10)', ghim_ban_do: 'Tên địa điểm', tim_kiem: 'Từ khoá gõ vào', thong_bao: 'Tiêu đề', ai: 'Mô tả đồ hoạ cho AI' };
const PHU_NHAN = { bieu_do_duong: 'Đơn vị (VD: k)', bieu_do_vung: 'Đơn vị (VD: k)', lower_third: 'Vai trò / dòng phụ', trich_dan: 'Dòng phụ', nhan_goc: 'Dòng phụ', bieu_do_cot: 'Đơn vị (VD: triệu)', bieu_do_tron: 'Chú thích dưới', binh_luan: 'Tên người bình luận', dang_ky: 'Chữ trên nút', dem_nguoc: 'Chú thích dưới', thong_bao: 'Nội dung' };
function veThuocTinhMG(box, g) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, g.kieu === 'ai' ? 'Đồ hoạ AI' : 'Bám theo lời nói')); box.appendChild(n);
  if (g.kieu === 'ai') {
    n.appendChild(el('div', 'quota', g.canh ? g.canh.lop.length + ' lớp có keyframe · sửa ô mô tả ở trên rồi bấm Tạo lại, hoặc nói thay đổi ở ô dưới' : 'Chưa có hình, bấm Tạo lại'));
    const sua = el('input'); sua.type = 'text'; sua.placeholder = 'Sửa bằng lời: chậm hơn, đổi sang màu đỏ…'; sua.style.width = '100%'; n.appendChild(sua);
    const r = el('div', 'row'); const b1 = el('button', 'btn nho xanh', '✨ Tạo lại'); b1.type = 'button'; const b2 = el('button', 'btn nho', 'Áp sửa'); b2.type = 'button';
    const chay = async (moTa, cu) => { b1.disabled = b2.disabled = true; b1.textContent = 'AI đang vẽ…'; try { const kq = await taoDoHoaAI(moTa, g.bd, g.kt - g.bd, cu ? g : null); luuHoanTac(); g.canh = kq.canh; veTl(); veKhung(); veProp(); toast(kq.kiem >= 2 ? 'Đã vẽ ' + kq.canh.lop.length + ' lớp' : 'AI vẽ ra ít hình, thử mô tả cụ thể hơn'); } catch (e) { toast(e.message); } finally { b1.disabled = b2.disabled = false; b1.textContent = '✨ Tạo lại'; } };
    b1.onclick = () => chay(g.text, false); b2.onclick = () => { if (sua.value.trim()) chay(g.text + '. Sửa: ' + sua.value.trim(), true); };
    r.appendChild(b1); r.appendChild(b2); n.appendChild(r); return;
  }
  if (KIEU_NHIEU_MUC.includes(g.kieu)) {
    const l = el('label'); l.appendChild(el('span', null, 'Hiện từng mục đúng lúc nói tới')); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!g.bam_loi; cb.onchange = () => { luuHoanTac(); g.bam_loi = cb.checked; veTl(); veKhung(); veProp(); }; l.appendChild(cb); n.appendChild(l);
    if (g.bam_loi) { const mt = mucCua(g); n.appendChild(el('div', 'quota', mt.map((m, i) => (g.moc_tu && g.moc_tu[i] != null ? '✓ ' + fmt1(g.moc_tu[i]) + 's' : '✗ chưa nghe thấy') + ' · ' + m.split(/[:=]/)[0]).join(' — '))); }
  }
  const r = el('div', 'row'); const b = el('button', 'btn nho', '⌖ Đặt đúng lúc nói'); b.type = 'button'; b.title = 'Tìm chữ của đồ hoạ trong lời thoại rồi dời đồ hoạ tới đúng giây đó'; b.onclick = () => { luuHoanTac(); const t = datDungLucNoi(g); if (t == null) { huyHoanTac(); toast('Không thấy "' + (mucCua(g)[0] || g.text) + '" trong lời trên dòng thời gian'); return; } P.t = g.bd; veTl(); veKhung(); vePh(); veProp(); toast('Đã dời tới ' + fmt1(t) + 's'); }; r.appendChild(b); n.appendChild(r);
}
async function moHopAI() {
  const moTa = prompt('Mô tả đồ hoạ cần tạo (AI vẽ có chuyển động):\nVD: biểu đồ đường doanh thu tăng từ 2 lên 9 triệu, mũi tên vàng vút lên\nVD: 3 ô chữ "Hook", "Giữ chân", "Kêu gọi" bay vào lần lượt', '');
  if (!moTa || !moTa.trim()) return;
  const bd = +P.t.toFixed(2), dai = 3.5; luuHoanTac(); const g = { id: uid(), kieu: 'ai', bd, kt: +(bd + dai).toFixed(2), text: moTa.trim().slice(0, 600), phu: '', canh: null };
  P.gfx.push(g); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veProp(); toast('AI đang vẽ đồ hoạ…');
  try { const kq = await taoDoHoaAI(g.text, bd, dai); g.canh = kq.canh; veTl(); veKhung(); veProp(); toast(kq.kiem >= 2 ? '✨ Đã tạo đồ hoạ ' + kq.canh.lop.length + ' lớp. Chọn để chỉnh, kéo trên dòng thời gian để dời' : 'AI vẽ ra ít hình, thử mô tả cụ thể hơn rồi bấm Tạo lại'); }
  catch (e) { toast(e.message); veProp(); }
}
