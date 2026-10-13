const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
const ls = { get(k){ try { return localStorage.getItem(k); } catch { return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch {} }, del(k){ try { localStorage.removeItem(k); } catch {} } };
const API = 'https://script.google.com/macros/s/AKfycbyxe1nWupAl6VheDZHaU3Ojm-d6c8F_khhUMtkehNCLh5OnGW6f2uF0PKPYZ4eYUqyGjQ/exec';
let LB = 70;   // bề rộng đầu track (110 ở bố cục CapCut Web)
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }
const ERR = { can_dangky: 'Tạo tài khoản miễn phí để dùng AI.', het_luot_thu: 'Bạn đã dùng hết lượt miễn phí.', het_luot: 'Hết lượt AI hôm nay, mai quay lại nhé.', het_luot_chat: 'Hôm nay bạn đã hết lượt nhờ trợ lý dựng, mai quay lại nhé.', het_phien: 'Phiên đăng nhập hết hạn, đăng nhập lại giúp mình.', video_qua_dai: 'Footage dài quá 12 phút. Cắt bớt trước khi đưa vào.', khong_co_video: 'Chưa có footage nào được hiểu.', can_gemini: 'Máy chủ đang chạy Claude, phần nghe video cần GEMINI_API_KEY. Báo mentor.', ban_qua: 'AI đang quá tải vì nhiều người dùng cùng lúc, thử lại sau 1–2 phút.', het_gio: 'AI xử lý quá lâu, thử lại hoặc chia footage ngắn hơn.', tu_choi: 'AI không xử lý được footage này.', chua_cai_key: 'Máy chủ chưa cài khoá AI. Báo mentor.', sai_key: 'Khoá AI trên máy chủ không hợp lệ. Báo mentor.', unknown_action: 'Máy chủ chưa có DungVideo.gs. Mentor dán DungVideo.gs, HookAI.gs, Studio.gs rồi Deploy, chọn New version.', thieu_text: 'Gõ yêu cầu dựng trước đã.' };
const fmt = s => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), g = Math.floor(s % 60); return m + ':' + (g < 10 ? '0' : '') + g; };
const fmtF = s => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), g = Math.floor(s % 60), f = Math.floor((s % 1) * 30); return m + ':' + (g < 10 ? '0' : '') + g + '.' + (f < 10 ? '0' : '') + f; };
const fmt1 = s => (Math.round((s || 0) * 10) / 10).toFixed(1).replace('.', ',');
const TEN_TAG = { nguoi: 'người', noi: 'nói', trong_nha: 'trong nhà', ngoai_troi: 'ngoài trời', san_pham: 'sản phẩm', man_hinh: 'màn hình', do_an: 'đồ ăn', tay: 'cận tay', cong_viec: 'công việc', di_chuyen: 'di chuyển', cam_xuc: 'cảm xúc', chu_tren_hinh: 'chữ trên hình' };
const TEN_LOAI = { talking_head: 'nói camera', vlog: 'vlog', voice_over: 'lồng tiếng', broll: 'b-roll', man_hinh: 'màn hình', khac: '' };

/* ═════════ trạng thái dự án ═════════ */
const P = { srcs: [], clips: [], gfx: [], tieng: [], moc: [], ban: [], banDang: -1, lamLai: [], am3: [], gomUndo: false, broll: [], zoom: [], t: 0, dang: false, lichSu: [], chon: null, nhac: null, beat: [], thamChieu: null, pxs: 18, snap: true, slip: false, ripple: true, hoanTac: [], tuNhan: [], pdY: 0.78 };
const CHUYEN_TEN = { cat: 'Cắt', fade: 'Mờ', slide: 'Trượt', zoom: 'Zoom', wipe: 'Quét', whip: 'Whip', flash: 'Chớp', glitch: 'Glitch', circle: 'Tròn', blur: 'Nhoè' };
const FONT_CSS = { be_vietnam: '"Be Vietnam Pro"', montserrat: '"Montserrat"', bricolage: '"Bricolage Grotesque"', lexend: '"Lexend"', oswald: '"Oswald"', anton: '"Anton"', playfair: '"Playfair Display"' };
const uid = () => 's' + Math.random().toString(36).slice(2, 8);
/* spec 1.4: ảnh / chữ / màu nền không có giới hạn nguồn → kéo dài vô hạn; chỉ video (và clip ghép = timeline con) dừng ở cuối nguồn */
const gioiHanNguon = (s, mac) => s && (s.loai === 'video' || s.loai === 'ghep') ? s.giay : (s ? 1e9 : mac);
const srcCua = id => (typeof id === 'string' && id.startsWith('ghep:')) ? nguonGhep(id) : P.srcs.find(s => s.id === id);   // 'ghep:<id>' = nguồn ảo của clip ghép
const tocC = c => c.cong ? congTb(c.cong) : (c.toc || 1), daiC = c => (c.kt - c.bd) / tocC(c);   // tốc độ đoạn (CapCut Speed): độ dài trên dòng thời gian
const tongGiay = () => { const t = P.clips.reduce((a, c) => a + daiC(c), 0); /* dài nhất của mọi track như CapCut: kéo chữ / đồ hoạ dài hơn footage thì dự án dài theo */ let m = 0; (P.gfx || []).forEach(g => { m = Math.max(m, g.kt || 0); }); (P.broll || []).forEach(b => { m = Math.max(m, (b.t_bd || 0) + (b.kt - b.bd) / tocC(b)); }); (P.am3 || []).forEach(a => { m = Math.max(m, (a.t_bd || 0) + (a.kt - a.bd)); }); (P.tieng || []).forEach(x => { m = Math.max(m, (x.t_bd || 0) + (x.giay || 0)); }); return Math.round(Math.max(t, m) * 100) / 100; };
const GX = {
  tieu_de: { ic: '💥', ten: 'Tiêu đề đập', dai: 2 }, lower_third: { ic: '🪪', ten: 'Tên + vai trò', dai: 4 }, danh_sach: { ic: '📋', ten: 'Danh sách hiện dần', dai: 6 }, tien_do: { ic: '▬', ten: 'Thanh tiến độ', dai: 0 },
  trich_dan: { ic: '❝', ten: 'Thẻ trích dẫn', dai: 3.5 }, dem_so: { ic: '🔢', ten: 'Đếm số', dai: 2 }, khung_nhan: { ic: '▢', ten: 'Khung nhấn', dai: 1.5 }, mui_ten: { ic: '⬇', ten: 'Mũi tên chỉ', dai: 1.2 }, vong_xoay: { ic: '🌀', ten: 'Vòng màu xoay', dai: 4 }, nhan_goc: { ic: '🏷', ten: 'Nhãn góc', dai: 3 }, chu: { ic: '🔤', ten: 'Chữ tự do', dai: 3 }, sticker: { ic: '😍', ten: 'Sticker', dai: 2 },
  bieu_do_cot: { ic: '📊', ten: 'Biểu đồ cột', dai: 4 }, bieu_do_duong: { ic: '📈', ten: 'Biểu đồ đường', dai: 4 }, bieu_do_vung: { ic: '🏔', ten: 'Biểu đồ vùng', dai: 4 }, hinh: { ic: '⬛', ten: 'Hình vẽ', dai: 3 }, bieu_do_tron: { ic: '🍩', ten: 'Biểu đồ tròn %', dai: 3 }, truoc_sau: { ic: '↔', ten: 'Trước / Sau', dai: 3.5 }, so_sanh: { ic: '🆚', ten: 'So sánh VS', dai: 3 }, checklist: { ic: '✅', ten: 'Checklist', dai: 5 },
  binh_luan: { ic: '💬', ten: 'Trả lời bình luận', dai: 4 }, dang_ky: { ic: '➕', ten: 'Nút Follow', dai: 3 }, dem_nguoc: { ic: '⏱', ten: 'Đếm ngược', dai: 3 }, ghim_ban_do: { ic: '📍', ten: 'Ghim địa điểm', dai: 3 }, tim_kiem: { ic: '🔍', ten: 'Thanh tìm kiếm', dai: 3 }, thong_bao: { ic: '🔔', ten: 'Thông báo', dai: 3 },
  ai: { ic: '✨', ten: 'Đồ hoạ AI (mô tả)', dai: 3 }, ghep: { ic: '▣', ten: 'Clip ghép', dai: 4 }
};
const GX_MD = { bieu_do_cot: { phu: ' triệu' }, bieu_do_duong: { phu: '' }, bieu_do_vung: { phu: '' }, hinh: { x: 0.5, y: 0.5, w: 0.5, h: 0.2, hinh: 'chu_nhat', mau: '#22d3df', vien_mau: '#ffffff', vien_day: 0, bo: 0.2, hu: 'mo' }, bieu_do_tron: { phu: 'người xem hết video' }, binh_luan: { phu: 'nguoixem' }, thong_bao: { phu: '+500.000đ từ khách hàng mới' }, dang_ky: { phu: 'Follow' }, ghim_ban_do: { x: 0.5, y: 0.72 }, chu: { x: 0.5, y: 0.32, co: 0.075, mau: '#ffffff', nen: 'vien', hu: 'pop' }, sticker: { x: 0.78, y: 0.22, co: 0.16, hu: 'nay' } };
/* lồng tiếng A2 lưu nhẹ (không kèm b64, url, phần tử audio): khôi phục lại từ kho theo id */
const TIENG_KHO = {};
function tiengNhe() { return P.tieng.map(t => { TIENG_KHO[t.id] = TIENG_KHO[t.id] || { b64: t.b64, url: t.url, el: t.el, gain: t.gain }; return { id: t.id, text: t.text, giong: t.giong, cach: t.cach, giay: t.giay, t_bd: t.t_bd }; }); }
function tiengDay(ds) { return (ds || []).map(t => { const k = TIENG_KHO[t.id] || {}; const cu = P.tieng.find(x => x.id === t.id); return Object.assign(cu || {}, t, { b64: k.b64 || (cu && cu.b64), url: k.url || (cu && cu.url), el: k.el || (cu && cu.el), gain: k.gain || (cu && cu.gain) }); }).filter(t => t.url); }
/* Ripple: V1 đổi độ dài tại điểm `diem` một lượng `delta` → chữ, đồ hoạ, b-roll từ điểm đó trở đi dồn theo */
function ripple(diem, delta, het) { if (!P.ripple || !delta) return; const ng = x => x >= diem - 0.01 && (het == null || x < het - 0.01);   /* het: mục bắt đầu từ đây trở đi (sau cuối track chính cũ) không nằm trên đoạn nào → giữ nguyên */ P.gfx.forEach(g => { if (ng(g.bd)) { g.bd = Math.max(0, g.bd + delta); g.kt = Math.max(g.bd + 0.3, g.kt + delta); } }); P.broll.forEach(b => { if (ng(b.t_bd)) b.t_bd = Math.max(0, b.t_bd + delta); }); P.zoom = P.zoom.map(z => ng(z) ? Math.max(0, z + delta) : z); (P.am3 || []).forEach(a => { if (ng(a.t_bd)) a.t_bd = Math.max(0, a.t_bd + delta); }); }
/* chèn vào track chính: chỉ mục đang nằm trên các đoạn V1 phía sau (đã liên kết) mới dời theo đoạn của nó; chữ / lớp phủ không nằm trên đoạn nào (V1 trống, sau cuối V1) giữ nguyên lớp và thời điểm */
function chupChen() { return P.ripple && P.lienKet !== false ? { lk: chupLienKet(), z: P.zoom.slice(), v1: P.clips.reduce((a, c) => a + daiC(c), 0) } : null; }
function apChen(x, diem, delta) { if (!x) return; apLienKet(x.lk); if (delta) P.zoom = x.z.map(z => z >= diem - 0.01 && z < x.v1 ? z + delta : z); }
$('#btnHoanTac').onclick = hoanTac;
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'BracketRight' || e.code === 'BracketLeft') && P.chon && (P.chon.k === 'b' || P.chon.k === 'g')) { e.preventDefault(); lopCuc(P.chon.k, P.chon.i, e.code === 'BracketRight'); return; }
  if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.key === '[') && P.chon && (P.chon.k === 'b' || P.chon.k === 'g')) { e.preventDefault(); doiLop(P.chon.k, P.chon.i, e.key === ']' ? 1 : -1); return; }
  const a = document.activeElement, dangGo = /INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable; if (dangGo) return;
  const ctrl = e.ctrlKey || e.metaKey, k = e.key;
  // phím keyframe / zoom như CapCut: K thêm, Alt+J / Alt+L keyframe trước / sau, Ctrl+Shift+K xoá keyframe tại đầu phát, Ctrl+= / Ctrl+- zoom, Shift+Z vừa khung
  if (ctrl && !e.shiftKey && e.code === 'KeyA') { e.preventDefault(); chonTatCa(); return; }
  if (ctrl && !e.shiftKey && e.code === 'KeyX') { e.preventDefault(); if (dsNhieu().length > 1) { saoChepNhieu(); xoaNhieu(); } else if (P.chon) { saoChep(); lenh('xoa'); } return; }
  if (ctrl && e.code === 'KeyG') { e.preventDefault(); if (e.shiftKey) { if (!tachClipGhepChon()) boGopNhom(); } else taoClipGhep(); return; }
  if (ctrl && !e.shiftKey && e.code === 'KeyS') { e.preventDefault(); $('#btnLuuDA').click(); return; }
  if (ctrl && !e.shiftKey && e.code === 'KeyI') { e.preventDefault(); $('#fileIn').click(); return; }
  if (ctrl && !e.shiftKey && e.code === 'KeyE') { e.preventDefault(); $('#btnXuat').click(); return; }
  if (!ctrl && e.altKey && (e.code === 'KeyJ' || e.code === 'KeyL')) { e.preventDefault(); nhayKf(e.code === 'KeyL' ? 1 : -1); return; }
  if (!ctrl && !e.altKey && !e.shiftKey && (k === 'k' || k === 'K')) { e.preventDefault(); if (shuttleT || (P.dang && (P.tocPhat || 1) !== 1)) { shuttle(0); return; } $('#btnKfNhanh').click(); return; }
  if (!ctrl && e.altKey && e.code === 'KeyX') { e.preventDefault(); datVao('bo'); return; }
  if (ctrl && e.shiftKey && e.code === 'KeyK') { e.preventDefault(); xoaKfDauPhat(); return; }
  if (ctrl && (k === '=' || k === '+' || k === '-' || k === '_')) { e.preventDefault(); $('#' + (k === '-' || k === '_' ? 'btnZoomRa' : 'btnZoomVao')).click(); return; }
  if (!ctrl && e.shiftKey && (k === 'Z' || k === 'z')) { e.preventDefault(); zoomVua(); return; }
  if (ctrl && !e.shiftKey && (k === 'z' || k === 'Z')) { e.preventDefault(); hoanTac(); return; }
  if (ctrl && (k === 'd' || k === 'D')) { e.preventDefault(); if (P.chon) lenh('nhan'); return; }
  if (ctrl && ((e.shiftKey && (k === 'z' || k === 'Z')) || k === 'y' || k === 'Y')) { e.preventDefault(); lamLai(); return; }
  if (ctrl && (k === 'b' || k === 'B')) { e.preventDefault(); P.chon = null; lenh('tach'); return; }
  if (ctrl && (k === 'c' || k === 'C')) { e.preventDefault(); saoChep(); return; }
  if (ctrl && e.altKey && e.code === 'KeyV') { e.preventDefault(); danThuocTinh(); return; }
  if (ctrl && (k === 'v' || k === 'V')) { e.preventDefault(); dan(); return; }
  if (ctrl || e.altKey) return;
  if (k === ' ') { e.preventDefault(); P.dang ? dung() : phat(false); return; }
  if (k === 'Delete' || k === 'Backspace') { if (P.chon || dsNhieu().length) { e.preventDefault(); lenh('xoa'); } return; }
  const toi = t => { e.preventDefault(); if (P.dang) dung(); P.t = Math.max(0, Math.min(tongGiay(), t)); veKhung(); vePh(); };
  if (k === 'ArrowLeft') return toi(P.t - (e.shiftKey ? 1 : 1 / 30));
  if (k === 'ArrowRight') return toi(P.t + (e.shiftKey ? 1 : 1 / 30));
  if (k === 'Home') return toi(0);
  if (k === 'End') return toi(tongGiay());
  if (k === 'j' || k === 'J' || k === 'l' || k === 'L') { e.preventDefault(); shuttle(k.toLowerCase() === 'l' ? 1 : -1); return; }
  if (k === 'i' || k === 'I' || k === 'o' || k === 'O') { e.preventDefault(); datVao(k.toLowerCase() === 'i' ? 'vao' : 'ra'); return; }
  if (k === 'ArrowUp' || k === 'ArrowDown') { const moc = [0]; let acc = 0; P.clips.forEach(c => { acc += daiC(c); moc.push(acc); }); const sau = k === 'ArrowDown'; const m = sau ? moc.find(x => x > P.t + 0.02) : [...moc].reverse().find(x => x < P.t - 0.02); if (m != null) toi(m); return; }
  if ((k === 's' || k === 'S') && e.shiftKey) { e.preventDefault(); tachTatCa(); return; }
  if (k === 's' || k === 'S') { e.preventDefault(); P.chon = null; lenh('tach'); return; }
  if (k === 'm' || k === 'M') { e.preventDefault(); themMoc(); return; }
  if (k === 'q' || k === 'Q') { e.preventDefault(); catDauPhat(true); return; }
  if (k === 'w' || k === 'W') { e.preventDefault(); catDauPhat(false); return; }
  if (k === 'n' || k === 'N') { e.preventDefault(); $('#btnSnap').click(); toast(P.snap ? 'Bật hít (snap)' : 'Tắt hít (snap)'); return; }
  if (k === 'f' || k === 'F') { e.preventDefault(); dongBang(); return; }
  if (k === '+' || k === '=') { e.preventDefault(); $('#zoomTl').value = Math.min(80, +$('#zoomTl').value + 6); $('#zoomTl').dispatchEvent(new Event('input')); return; }
  if (k === '-' || k === '_') { e.preventDefault(); $('#zoomTl').value = Math.max(6, +$('#zoomTl').value - 6); $('#zoomTl').dispatchEvent(new Event('input')); return; }
  if (k === '?') { e.preventDefault(); $('#phimHop').classList.add('mo'); }
});

/* ═════════ footage ═════════ */
async function themFile(files) {
  themFile.trung = [];
  for (const f of files) {
    const cu = P.srcs.find(x => x.file && x.file.size === f.size && x.file.type === f.type && (x.file.name === f.name || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(f.name) || (x.file.lastModified === f.lastModified && f.size > 0)));   /* cùng một file (kể cả bản trình duyệt tạo khi kéo ảnh từ thư viện: tên dạng mã) → không thêm lần nữa */
    if (cu) { themFile.trung.push(cu); toast('“' + cu.ten + '” đã có trong thư viện (S' + (P.srcs.indexOf(cu) + 1) + '), dùng lại file đó'); continue; }
    if (!/^(video|image)\//.test(f.type) && !/\.(mp4|mov|webm|m4v|jpe?g|png|webp)$/i.test(f.name)) { toast('Bỏ qua ' + f.name); continue; }
    const laAnh = /^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
    const s = { id: uid(), ten: f.name, file: f, url: URL.createObjectURL(f), loai: laAnh ? 'anh' : 'video', giay: laAnh ? ((P.cai && P.cai.anh) || 5) : 0, w: 0, h: 0, tu: [], cau: [], canh: [], khoanh_khac: [], loai_canh: laAnh ? 'broll' : '', mo_ta: '', chat_luong: '', hook_goi_y: [], nhan_manh: [], tt: 'moi', thumb: '', thumbs: {}, imLang: [], mat: [], matTt: '' };
    P.srcs.push(s); veSrcs();
    try {
      if (laAnh) { const im = await taiAnh(s.url); s.w = im.naturalWidth; s.h = im.naturalHeight; s.el = im; s.thumb = s.url; }
      else { const v = await taoVideoEl(s); s.w = v.videoWidth; s.h = v.videoHeight; s.giay = v.duration; s.thumb = await khungHinh(v, Math.min(0.5, v.duration / 2), 160); setTimeout(() => laySong(s), 300); }
      s.tt = 'san_sang';
      const nho = docNho(s); if (nho) { Object.assign(s, nho); s.tt = 'xong'; toast('Lấy lại kết quả đã hiểu của ' + s.ten + ', không tốn lượt'); }
    } catch (e) { console.error(e); s.tt = 'loi'; s.loi = 'Không đọc được file này.'; }
    veSrcs(); veLoi();
    if (s.tt === 'xong') veThumbCanh(s);
  }
  nhanDuAn();
  $('#trong').hidden = !!(P.clips.length || tongGiay() > 0); veKhung();
}
function taiAnh(u) { return new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = u; }); }
/* phần tử video thứ hai của một source: dùng cho b-roll (V2) và khung cũ khi chuyển cảnh, luôn tắt tiếng */
function elPhu(s, ten) { if (s[ten]) return s[ten]; if (s.loai !== 'video') return s.el; const v = document.createElement('video'); v.src = s.url; v.playsInline = true; v.preload = 'auto'; v.muted = true; v.crossOrigin = 'anonymous'; $('#vids').appendChild(v); s[ten] = v; return v; }
function taoVideoEl(s) {
  return new Promise((ok, no) => {
    const v = document.createElement('video'); v.src = s.url; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    v.onloadedmetadata = () => { if (v.duration === Infinity || isNaN(v.duration)) { v.currentTime = 1e9; v.ontimeupdate = () => { v.ontimeupdate = null; v.currentTime = 0; ok(v); }; } else ok(v); };
    v.onerror = () => no(new Error('video')); $('#vids').appendChild(v); s.el = v;
  });
}
function seekTo(v, t) { return new Promise(ok => { if (Math.abs(v.currentTime - t) < 0.02 && v.readyState >= 2) return ok(); const h = () => { v.removeEventListener('seeked', h); ok(); }; v.addEventListener('seeked', h); v.currentTime = t; setTimeout(() => { v.removeEventListener('seeked', h); ok(); }, 2500); }); }
async function khungHinh(v, t, w, q) { await seekTo(v, t); const c = document.createElement('canvas'); const r = v.videoHeight / v.videoWidth || 1.78; c.width = w; c.height = Math.round(w * r); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q || 0.7); }
async function veThumbCanh(s) { if (s.loai !== 'video' || !s.el || P.dang) return; for (const c of s.canh) { if (!s.thumbs[c.bd]) { s.thumbs[c.bd] = await khungHinh(s.el, Math.min(s.giay - 0.05, c.bd + 0.3), 156, 0.6); } } veSrcs(); }
function keyNho(s) { return 'dv2_' + s.ten.replace(/\W/g, '').slice(0, 40) + '_' + s.file.size; }
function docNho(s) { try { const o = JSON.parse(ls.get(keyNho(s)) || 'null'); return o && Array.isArray(o.cau) ? o : null; } catch { return null; } }
function luuNho(s) { ls.set(keyNho(s), JSON.stringify({ tu: s.tu, cau: s.cau, canh: s.canh, khoanh_khac: s.khoanh_khac, loai_canh: s.loai_canh, mo_ta: s.mo_ta, chat_luong: s.chat_luong, hook_goi_y: s.hook_goi_y, nhan_manh: s.nhan_manh, imLang: s.imLang })); }
function khopTim(s, q) { if (!q) return true; q = q.toLowerCase(); return (s.ten + ' ' + s.mo_ta + ' ' + s.cau.map(c => c.text).join(' ') + ' ' + s.canh.map(c => c.mo_ta + ' ' + c.tags.map(t => TEN_TAG[t] || t).join(' ')).join(' ')).toLowerCase().includes(q); }

function veSrcs() {
  const box = $('#srcs'); box.innerHTML = ''; $('#nSrc').textContent = P.srcs.length;
  const q = $('#tim').value.trim(); $('#srcs').classList.toggle('dangTim', !!q);
  P.srcs.forEach((s, i) => {
    if (!khopTim(s, q)) return;
    const d = el('div', 'fsrc'); d.dataset.id = s.id;
    const fh = el('div', 'fh');
    const im = el('img', 'th'); if (s.thumb) im.src = s.thumb; im.alt = ''; im.draggable = true; im.title = 'Kéo vào dòng thời gian'; im.ondragstart = e => { e.dataTransfer.setData('text/plain', JSON.stringify({ src: s.id, bd: 0, kt: s.giay })); }; fh.appendChild(im);
    const tx = el('div'); { const tb = el('b', null, 'S' + (i + 1) + ' · ' + String(s.ten || '').replace(/\.[a-z0-9]{2,5}$/i, '')); tb.title = s.ten; tx.appendChild(tb); }
    tx.appendChild(el('small', null, [s.loai === 'anh' ? 'Ảnh' : (s.giay ? fmt(s.giay) : '…'), s.w ? (s.w > s.h ? 'ngang' : 'dọc') : '', TEN_LOAI[s.loai_canh] || ''].filter(Boolean).join(' · ')));
    if (s.tt === 'xong') { const vap = s.cau.filter(c => c.loai === 'vap' || c.loai === 'lap' || c.loai === 'lac').length; tx.appendChild(el('small', null, '✓ ' + s.tu.length + ' từ · ' + s.cau.length + ' câu' + (vap ? ' · ' + vap + ' vấp/lặp/lạc' : '') + ' · ' + s.canh.length + ' cảnh' + (s.matTt ? ' · ' + s.matTt : ''))); }
    if (s.tt === 'dang') tx.appendChild(el('small', null, s.buoc || 'Đang hiểu…'));
    if (s.tt === 'loi') tx.appendChild(el('small', null, '⚠ ' + s.loi));
    tx.classList.add('moRong'); tx.title = 'Bấm để xem / ẩn chi tiết AI (cảnh, câu nói, tag)'; tx.onclick = () => { s.mo = !s.mo; veSrcs(); };
    if (s.mo) d.classList.add('mo');
    fh.appendChild(tx);
    const acts = el('div', 'acts');
    if (s.loai === 'video' && (s.tt === 'san_sang' || (s.tt === 'loi' && s.giay))) { const b = el('button', 'btn xanh', s.tt === 'loi' ? 'Thử lại' : '✨ Hiểu footage'); b.type = 'button'; b.onclick = () => hieu(s); acts.appendChild(b); }
    if (s.loai === 'video' && s.w > s.h && !s.mat.length && s.tt !== 'dang' && s.matTt !== 'đang dò mặt…') { const dm = el('button', 'btn', '🙂 Dò mặt'); dm.type = 'button'; dm.title = 'Dò vị trí mặt để crop dọc bám theo (chạy trên máy, không tốn lượt)'; dm.onclick = () => doMat(s); acts.appendChild(dm); }
    const th = el('button', 'btn', '＋ V1'); th.type = 'button'; th.title = 'Thêm cả đoạn vào dòng thời gian'; th.onclick = () => { luuHoanTac(); P.clips.push({ src: s.id, bd: 0, kt: s.giay || 3, ly_do: 'thêm tay' }); veTl(); }; acts.appendChild(th);
    const x = el('button', 'btn ghost', '🗑'); x.type = 'button'; x.onclick = () => { if (!confirm('Bỏ footage ' + s.ten + '?')) return; P.clips = P.clips.filter(c => c.src !== s.id); P.srcs = P.srcs.filter(z => z !== s); if (s.el && s.el.remove) s.el.remove(); veSrcs(); veLoi(); veTl(); }; acts.appendChild(x);
    fh.appendChild(acts); d.appendChild(fh);
    if (s.tt === 'dang') { const b = el('div', 'bar'); b.appendChild(el('i')); b.firstChild.style.width = (s.pt || 5) + '%'; d.appendChild(b); }
    if (s.tt === 'xong') {
      if (s.canh.length) {
        const cs = el('div', 'canhs');
        s.canh.forEach((c, k) => { const ce = el('div', 'canh'); ce.title = c.mo_ta + ' (' + fmt1(c.bd) + '–' + fmt1(c.kt) + 's) · bấm: thêm vào V1 · kéo thả vào V2 để làm b-roll'; const ci = el('img'); ci.src = s.thumbs[c.bd] || s.thumb; ci.alt = ''; ce.appendChild(ci); ce.appendChild(el('span', null, 'Cảnh ' + (k + 1) + ' · ' + c.mo_ta)); ce.appendChild(el('span', 'g', fmt1(c.kt - c.bd) + 's')); ce.draggable = true; ce.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ src: s.id, bd: c.bd, kt: c.kt })); ce.onclick = () => { luuHoanTac(); P.clips.push({ src: s.id, bd: c.bd, kt: c.kt, ly_do: 'cảnh ' + (k + 1) }); veTl(); toast('Đã thêm cảnh ' + (k + 1)); }; cs.appendChild(ce); });
        d.appendChild(cs);
      }
      const tg = el('div', 'tags'); const dsTag = new Set(); s.canh.forEach(c => c.tags.forEach(t => dsTag.add(t)));
      [...dsTag].slice(0, 6).forEach(t => tg.appendChild(el('span', 'tag', TEN_TAG[t] || t))); if (s.tu.length) tg.appendChild(el('span', 'tag ai', 'speech ✓')); if (s.chat_luong) tg.appendChild(el('span', 'tag warn', '⚠ ' + s.chat_luong)); d.appendChild(tg);
      if (s.khoanh_khac.length) { const kk = el('div', 'kk'); s.khoanh_khac.forEach(k => { const b = el('button'); b.type = 'button'; b.appendChild(el('span', 'g', '★ ' + fmt1(k.bd) + 's')); b.appendChild(el('span', null, k.ly_do)); b.onclick = () => { luuHoanTac(); P.clips.push({ src: s.id, bd: k.bd, kt: k.kt, ly_do: 'khoảnh khắc' }); veTl(); toast('Đã thêm khoảnh khắc'); }; kk.appendChild(b); }); d.appendChild(kk); }
    }
    box.appendChild(d);
  });
  const chua = P.srcs.filter(s => s.loai === 'video' && s.tt === 'san_sang');
  $('#srcStatus').innerHTML = chua.length > 1 ? `<button class="btn xanh nho" id="btnHieuHet" type="button">✨ Hiểu cả ${chua.length} footage</button> · mỗi footage 1 lượt` : (chua.length === 1 ? 'Bấm “Hiểu footage” · 1 lượt dựng video' : '');
  const bh = $('#btnHieuHet'); if (bh) bh.onclick = async () => { for (const s of chua) await hieu(s); };
}
$('#tim').addEventListener('input', () => { veSrcs(); veLoi(); });

/* ── hiểu footage: WAV nhỏ + khung hình → từ, câu, cảnh, khoảnh khắc ── */
async function giaiMaAm(file) { const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC(); try { return await ac.decodeAudioData(await file.arrayBuffer()); } finally { try { ac.close(); } catch {} } }
function taiMau(ab, rate) { const n = Math.floor(ab.duration * rate), out = new Float32Array(n), ch = ab.numberOfChannels, ti = ab.sampleRate / rate; const data = []; for (let c = 0; c < ch; c++) data.push(ab.getChannelData(c)); for (let i = 0; i < n; i++) { const p = Math.floor(i * ti); let v = 0; for (let c = 0; c < ch; c++) v += data[c][p] || 0; out[i] = v / ch; } return out; }
function wavB64(pcm, rate) { const b = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(b), W = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }; W(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); W(8, 'WAVE'); W(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); W(36, 'data'); v.setUint32(40, pcm.length * 2, true); for (let i = 0; i < pcm.length; i++) { const s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true); } const u = new Uint8Array(b); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); }
function doImLang(pcm, rate) { const w = Math.floor(rate * 0.05), n = Math.floor(pcm.length / w), rms = []; for (let i = 0; i < n; i++) { let a = 0; for (let j = 0; j < w; j++) { const x = pcm[i * w + j]; a += x * x; } rms.push(Math.sqrt(a / w)); } const sorted = [...rms].sort((a, b) => a - b), nguong = Math.max(0.004, sorted[Math.floor(sorted.length * 0.5)] * 0.35); const ds = []; let bd = -1; for (let i = 0; i <= n; i++) { const im = i < n && rms[i] < nguong; if (im && bd < 0) bd = i; if (!im && bd >= 0) { if ((i - bd) * 0.05 >= 0.4) ds.push([bd * 0.05, i * 0.05]); bd = -1; } } return ds; }
/* beat: đỉnh năng lượng dải trầm, cách nhau tối thiểu 0,25s */
function doBeat(ab) {
  const rate = 4000, pcm = taiMau(ab, rate), w = Math.floor(rate * 0.02), n = Math.floor(pcm.length / w), e = [];
  let prev = 0; for (let i = 0; i < n; i++) { let a = 0; for (let j = 0; j < w; j++) { const x = pcm[i * w + j]; prev = prev * 0.9 + x * 0.1; a += prev * prev; } e.push(a / w); }
  const beats = []; const win = 40;
  for (let i = 2; i < n - 2; i++) { let m = 0, c = 0; for (let k = Math.max(0, i - win); k < Math.min(n, i + win); k++) { m += e[k]; c++; } m /= c; if (e[i] > m * 1.6 && e[i] > e[i - 1] && e[i] >= e[i + 1] && e[i] > 1e-6 && (!beats.length || i * 0.02 - beats[beats.length - 1] > 0.25)) beats.push(Math.round(i * 0.02 * 100) / 100); }
  return beats;
}
async function hieu(s) {
  if (s.tt === 'dang') return;
  if (!(await TK.canCo('dung'))) return;
  s.tt = 'dang'; s.pt = 5; s.buoc = 'Đang tách âm thanh…'; veSrcs();
  try {
    const ab = await giaiMaAm(s.file); if (!s.song) s.song = tinhSong(ab); const rate = ab.duration > 300 ? 8000 : 16000;
    if (ab.duration > 720) throw Object.assign(new Error('dai'), { ma: 'video_qua_dai' });
    const pcm = taiMau(ab, rate); s.imLang = doImLang(pcm, rate); s.pt = 30; s.buoc = 'Đang lấy khung hình…'; veSrcs();
    const am = wavB64(pcm, rate);
    const n = Math.min(12, Math.max(4, Math.ceil(s.giay / 10))), anh = [];
    for (let i = 0; i < n; i++) anh.push(await khungHinh(s.el, Math.min(s.giay - 0.1, (i + 0.5) * s.giay / n), 320, 0.55));
    s.pt = 50; s.buoc = 'AI đang chép từng từ, nhận diện cảnh (' + fmt(s.giay) + ')…'; veSrcs();
    const r = await TK.goiNen({ action: 'hook_ai', mode: 'dung_nhan', token: TK.token(), dev: TK.dev(), am_thanh: am, anh, giay: s.giay, im_lang: s.imLang, ten: s.ten }, { tool: 'dung', nhan: 'Hiểu ' + s.ten });
    if (!r.ok) throw Object.assign(new Error(r.error), { ma: r.error, chi_tiet: r.chi_tiet });
    const d = r.data; Object.assign(s, { tu: d.tu || [], cau: d.cau || [], canh: d.canh || [], khoanh_khac: d.khoanh_khac || [], loai_canh: d.loai_canh || '', mo_ta: d.mo_ta || '', chat_luong: d.chat_luong || '', hook_goi_y: d.hook_goi_y || [], nhan_manh: d.nhan_manh || [] });
    if (!s.canh.length) s.canh = [{ bd: 0, kt: s.giay, mo_ta: s.mo_ta || 'Cả đoạn', tags: [] }];
    s.tt = 'xong'; luuNho(s);
    if (r.luot && TK.me) { TK.me.luot = r.luot; veQuota(); }
    if (!$('#hook').value && s.hook_goi_y[0]) $('#hook').value = s.hook_goi_y[0];
    if (s.nhan_manh.length && !$('#pdNhan').value) $('#pdNhan').value = s.nhan_manh.slice(0, 6).join(', ');
    $('#ds').appendChild(el('div', 'm ai buoc', '✓ ' + s.ten + ': ' + s.tu.length + ' từ, ' + s.cau.length + ' câu, ' + s.canh.length + ' cảnh, ' + s.khoanh_khac.length + ' khoảnh khắc đáng giữ' + (d.giay_xu_ly ? ' · ' + d.giay_xu_ly + 's' : '')));
    toast('Đã hiểu ' + s.ten);
  } catch (e) {
    console.error('[hieu]', e); s.tt = e.ma === 'video_qua_dai' ? 'loi' : 'san_sang';
    const chu = ERR[e.ma] || (TK.loiMang(e) ? 'Mất mạng giữa chừng, bấm lại.' : 'Không hiểu được footage: ' + (e.message || e));
    s.loi = chu; toast(chu + (e.chi_tiet ? ' ' + e.chi_tiet : ''));
    if (e.ma === 'het_luot_thu') TK.moHet('dung'); if (e.ma === 'video_qua_dai') s.tt = 'loi';
  }
  veSrcs(); veLoi(); veThumbCanh(s);
  if (s.tt === 'xong' && s.w > s.h && s.loai_canh !== 'broll' && s.loai_canh !== 'man_hinh') doMat(s);   // source ngang có người: dò mặt nền để crop dọc bám theo
  if (P.srcs.every(z => z.loai !== 'video' || z.tt !== 'san_sang')) doiTab('ai');
}

/* ═════════ dò mặt (MediaPipe Face Detector, chạy WASM tại máy; không có thì FaceDetector của trình duyệt; không có nữa thì giữ giữa) ═════════ */
let mpDet = null, mpLoi = false;
const MP_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/';
let mpMod = null;
async function mpModule() { if (!mpMod) mpMod = (async () => { const m = await import(MP_URL + 'vision_bundle.mjs'); const vision = await m.FilesetResolver.forVisionTasks(MP_URL + 'wasm'); return { m, vision }; })().catch(e => { mpMod = null; throw e; }); return mpMod; }
async function mpNap() {
  if (mpDet || mpLoi) return mpDet;
  try {
    const { m, vision } = await mpModule();
    mpDet = await m.FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite' }, runningMode: 'IMAGE', minDetectionConfidence: 0.5 });
  } catch (e) { console.warn('mediapipe', e); mpLoi = true; }
  return mpDet;
}
async function doMatKhung(c) {
  const det = await mpNap();
  if (det) { const r = det.detect(c); const d = (r.detections || [])[0]; if (!d) return null; const b = d.boundingBox; return { cx: (b.originX + b.width / 2) / c.width, cy: (b.originY + b.height / 2) / c.height, w: b.width / c.width }; }
  if (window.FaceDetector) { try { const ds = await new FaceDetector({ fastMode: true, maxDetectedFaces: 1 }).detect(c); const b = ds[0] && ds[0].boundingBox; if (b) return { cx: (b.x + b.width / 2) / c.width, cy: (b.y + b.height / 2) / c.height, w: b.width / c.width }; } catch {} }
  return null;
}
async function doMat(s) {
  if (s.loai !== 'video' || !s.el || s.matTt === 'đang dò mặt…') return;
  s.matTt = 'đang dò mặt…'; veSrcs();
  try {
    const v = elPhu(s, 'el2'), buoc = Math.max(0.5, s.giay / 90), c = document.createElement('canvas'); c.width = 320; c.height = Math.round(320 * s.h / s.w); const g = c.getContext('2d');
    const mat = []; let co = 0;
    for (let t = 0.2; t < s.giay; t += buoc) { await seekTo(v, t); g.drawImage(v, 0, 0, c.width, c.height); const m = await doMatKhung(c); if (m) { mat.push({ t, cx: m.cx, cy: m.cy }); co++; } if (mat.length && !m) mat.push({ t, cx: mat[mat.length - 1].cx, cy: mat[mat.length - 1].cy, doan: true }); }
    s.mat = co >= 2 ? mat : []; s.matTt = co >= 2 ? '🙂 bám mặt ' + Math.round(co / Math.max(1, mat.length) * 100) + '%' : 'không thấy mặt';
    if (s.mat.length && $('#khungKieu').value === 'cat' && P.srcs.filter(z => z.mat.length).length === 1) { $('#khungKieu').value = 'bam_mat'; toast('Đã dò được mặt: khung dọc sẽ bám theo người nói. Đổi lại ở Thuộc tính → Khung dọc.'); }
  } catch (e) { console.warn('doMat', e); s.mat = []; s.matTt = 'không dò được mặt'; }
  veSrcs(); if (!P.dang) veKhung();
}
/* tâm crop tại giây tSrc: nội suy rồi làm mượt ±1,2s để khung không giật */
function cxTai(s, tSrc) {
  const m = s.mat; if (!m || !m.length) return 0.5;
  let sum = 0, n = 0; for (const x of m) { if (Math.abs(x.t - tSrc) <= 1.2) { const w = 1 - Math.abs(x.t - tSrc) / 1.3; sum += x.cx * w; n += w; } }
  if (n > 0) return sum / n;
  let best = m[0]; for (const x of m) if (Math.abs(x.t - tSrc) < Math.abs(best.t - tSrc)) best = x; return best.cx;
}

/* ═════════ lời thoại ═════════ */
function cauTrongTl(sid, c) { return P.clips.some(k => k.src === sid && k.bd <= c.bd + 0.15 && k.kt >= c.kt - 0.15); }
function veLoi() {
  const box = $('#loi'); box.innerHTML = '';
  const co = P.srcs.filter(s => s.tt === 'xong' && s.cau.length), q = $('#tim').value.trim().toLowerCase();
  if (!co.length) { box.innerHTML = '<div class="etl-trong">Thêm footage và bấm “Hiểu footage” để có lời thoại.</div>'; return; }
  co.forEach(s => {
    const nh = el('div', 'nhom'); nh.dataset.src = s.id; nh.appendChild(el('span', null, 'S' + (P.srcs.indexOf(s) + 1) + ' · ' + s.ten)); nh.appendChild(el('span', 'dem', s.cau.filter(c => cauTrongTl(s.id, c)).length + '/' + s.cau.length)); box.appendChild(nh);
    s.cau.forEach((c, i) => {
      if (q && !c.text.toLowerCase().includes(q)) return;
      const trong = cauTrongTl(s.id, c);
      const d = el('div', 'cau' + (trong ? '' : ' tat')); d.dataset.src = s.id; d.dataset.i = i;
      const cb = el('input'); cb.type = 'checkbox'; cb.checked = trong; cb.onchange = () => batCau(s, c, cb.checked); d.appendChild(cb);
      const g = el('span', 'g', fmt1(c.bd)); g.title = 'Nhảy tới'; g.onclick = () => xemTai(s.id, c.bd); d.appendChild(g);
      const t = el('span', 't', c.text); t.contentEditable = 'true'; t.spellcheck = false; t.oninput = () => { c.text = t.textContent; suaTu(s, c); }; t.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); t.blur(); } };
      const w = el('span'); w.appendChild(t); if (c.loai && c.loai !== 'noi') w.appendChild(el('span', 'lo ' + c.loai, { vap: 'vấp', lap: 'lặp', lac: 'lạc đề', hay: 'câu hay' }[c.loai] || c.loai));
      d.appendChild(w); box.appendChild(d);
    });
  });
}
/* sửa chữ câu → chia đều lại các từ trong khoảng câu để phụ đề karaoke theo kịp */
function suaTu(s, c) { const ws = c.text.trim().split(/\s+/).filter(Boolean); if (!ws.length) return; const i0 = c.i0 != null ? c.i0 : s.tu.findIndex(t => t.bd >= c.bd - 0.01), i1 = c.i1 != null ? c.i1 : s.tu.map((t, i) => t.kt <= c.kt + 0.01 ? i : -1).filter(i => i >= 0).pop(); if (i0 < 0 || i1 == null || i1 < i0) return; const tl = chiaTheoKyTu(ws), moi = ws.map((w, k) => ({ w, bd: Math.round((c.bd + (c.kt - c.bd) * tl[k]) * 100) / 100, kt: Math.round((c.bd + (c.kt - c.bd) * tl[k + 1]) * 100) / 100 })); s.tu.splice(i0, i1 - i0 + 1, ...moi); const lech = moi.length - (i1 - i0 + 1); s.cau.forEach(x => { if (x.i0 != null && x.i0 > i1) { x.i0 += lech; x.i1 += lech; } }); c.i1 = i0 + moi.length - 1; }
function batCau(s, c, bat) {
  luuHoanTac();
  if (bat) { let vt = P.clips.length; for (let i = 0; i < P.clips.length; i++) if (P.clips[i].src === s.id && P.clips[i].bd > c.bd) { vt = i; break; } P.clips.splice(vt, 0, { src: s.id, bd: c.bd, kt: c.kt, ly_do: 'bật câu' }); }
  else { const moi = []; P.clips.forEach(k => { if (k.src !== s.id || k.kt <= c.bd + 0.05 || k.bd >= c.kt - 0.05) { moi.push(k); return; } if (k.bd < c.bd - 0.15) moi.push({ ...k, kt: c.bd }); if (k.kt > c.kt + 0.15) moi.push({ ...k, bd: c.kt }); }); P.clips = moi; }
  gopClips(); veTl(); veLoi();
}
function gopClips() { const out = []; P.clips.forEach(k => { const c = out[out.length - 1]; if (c && c.src === k.src && Math.abs(c.kt - k.bd) < 0.12 && JSON.stringify(propsC(c)) === JSON.stringify(propsC(k))) c.kt = k.kt; else out.push({ ...k }); }); P.clips = out.filter(k => k.kt - k.bd > 0.15); }
$('#btnBoVap').onclick = () => { luuHoanTac(); P.srcs.forEach(s => s.cau.forEach(c => { if (c.loai === 'vap' || c.loai === 'lap' || c.loai === 'lac') { const moi = []; P.clips.forEach(k => { if (k.src !== s.id || k.kt <= c.bd + 0.05 || k.bd >= c.kt - 0.05) { moi.push(k); return; } if (k.bd < c.bd - 0.15) moi.push({ ...k, kt: c.bd }); if (k.kt > c.kt + 0.15) moi.push({ ...k, bd: c.kt }); }); P.clips = moi; } })); gopClips(); veTl(); veLoi(); toast('Đã bỏ câu vấp, lặp, lạc đề'); };
$('#btnBatHet').onclick = () => { luuHoanTac(); P.clips = P.srcs.filter(s => s.tt === 'xong' || s.loai === 'anh').map(s => ({ src: s.id, bd: 0, kt: s.giay, ly_do: 'giữ tất cả' })); veTl(); veLoi(); };
$('#btnChiHay').onclick = () => { luuHoanTac(); const cl = []; P.srcs.forEach(s => s.khoanh_khac.forEach(k => cl.push({ src: s.id, bd: k.bd, kt: k.kt, ly_do: k.ly_do }))); if (!cl.length) { toast('Chưa có khoảnh khắc nào được AI đánh dấu'); return; } P.clips = cl; veTl(); veLoi(); };

/* ═════════ trợ lý dựng ═════════ */
function veDs() { const b = $('#ds'); b.querySelectorAll('.m:not(.buoc)').forEach(x => { if (x.dataset.moi !== '1') x.remove(); }); P.lichSu.forEach(m => { const d = el('div', 'm ' + (m.vai === 'ai' ? 'ai' : 'nd') + (m.buoc ? ' buoc agent' : ''), null); if (m.buoc) (m.dong || m.text.split('\n').map(t => ({ t }))).forEach(x => { const l = el('div', 'bc lenh' + (x.loi ? ' loi' : ''), x.t); if (x.anh) { const im = el('img', 'khungnho'); im.src = x.anh; im.alt = 'khung'; l.appendChild(im); } d.appendChild(l); }); else d.textContent = m.text; b.appendChild(d); }); b.scrollTop = b.scrollHeight; }
const AGENT_TEN = { xem_du_an: 'Xem dự án', xem_loi_thoai: 'Đọc lời thoại', tim_footage: 'Tìm trong footage', them_doan: 'Thêm đoạn', sua_doan: 'Sửa đoạn', xoa_doan: 'Xoá đoạn', tach_doan: 'Tách đoạn', sap_xep_doan: 'Đổi thứ tự', bo_vap: 'Bỏ vấp, lặp', hit_beat: 'Hít beat', dat_broll: 'Đặt b-roll', xoa_broll: 'Xoá b-roll', them_do_hoa: 'Thêm đồ hoạ', sua_do_hoa: 'Sửa đồ hoạ', xoa_do_hoa: 'Xoá đồ hoạ', cai_dat: 'Đổi cài đặt', hieu_footage: 'Hiểu footage', tro_ly_dung: 'Dựng bản nháp', tim_broll_kho: 'Tìm kho B-roll', them_broll_kho: 'Lấy B-roll từ kho', long_tieng: 'Lồng tiếng', xem_khung: 'Xem khung hình', xuat_phu_de: 'Xuất phụ đề', xuat_video: 'Xuất video', luu_du_an: 'Lưu dự án', hoan_tac: 'Hoàn tác', cat_khoang_lang: 'Cắt khoảng lặng', dong_bang: 'Đóng băng khung', them_moc: 'Đặt mốc', tao_shorts: 'Tạo short', mo_phien_ban: 'Mở phiên bản', tim_loi: 'Tìm lời', keyframe: 'Keyframe', sua_broll: 'Sửa overlay', ap_tat_ca: 'Áp cho mọi đoạn', cat_dau_phat: 'Cắt nhanh Q/W', nhan_doi: 'Nhân đôi', mau_chu: 'Mẫu chữ', phu_de_mau: 'Mẫu phụ đề', nhap_srt: 'Phụ đề SRT', nen_khung: 'Nền khung', them_am_thanh: 'Hiệu ứng âm thanh', sua_am_thanh: 'Sửa âm thanh A3', tach_am_thanh: 'Tách âm thanh', chuan_hoa_am: 'Chuẩn hoá âm lượng' };
function agentTomTatGoi(a) { const o = { ...a }; delete o.text; const t = Object.keys(o).map(k => k + '=' + JSON.stringify(o[k])).join(' '); return (a.text ? '“' + String(a.text).slice(0, 40) + '” ' : '') + t.slice(0, 90); }
/* một lượt agent: gửi yêu cầu + trạng thái dự án lên máy chủ, máy chủ hỏi LLM (Gemini/Claude/GPT tuỳ cấu hình),
   LLM trả về lệnh → tab chạy lệnh ngay trên dòng thời gian → gửi kết quả lại → lặp tới khi LLM trả lời xong */
async function agentChay(yc) {
  const st = $('#aiStatus'), btn = $('#btnAI'); btn.disabled = true; AG.dang = true;
  P.lichSu.push({ vai: 'nd', text: yc }); veDs(); $('#yc').value = '';
  luuHoanTac(); P.gomUndo = true; const ls = AG.ls; ls.push({ vai: 'nd', text: yc }); const t0 = Date.now(); let buoc = 0, soLenh = 0, hop = null, ve = '';
  const ghiBuoc = (chu, cls) => { if (!hop) { hop = el('div', 'm ai buoc agent'); hop.dataset.moi = '1'; $('#ds').appendChild(hop); } const d = el('div', 'bc' + (cls ? ' ' + cls : '')); if (typeof chu === 'string') d.textContent = chu; else d.appendChild(chu); hop.appendChild(d); $('#ds').scrollTop = 1e9; return d; };
  const cho = ghiBuoc('Đang nghĩ…', 'dang');
  try {
    for (; buoc < 16; buoc++) {
      cho.textContent = buoc ? 'Đang nghĩ bước tiếp… (' + Math.round((Date.now() - t0) / 1000) + 's)' : 'Đang đọc dự án và yêu cầu… (' + Math.round((Date.now() - t0) / 1000) + 's)';
      const r = await fetch(MC.url + '/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: TK.token(), buoc, ve, lich_su: ls.slice(-30), du_an: agentTomTat(), ho_so: TK.hoSo() }) });
      let j = {}; try { j = await r.json(); } catch { }
      if (!j.ok) { const ma = j.error || ('http_' + r.status); if (ma === 'het_luot_thu') TK.moHet('chat'); const chu = ma === 'het_luot_thu' ? 'Hết lượt chat miễn phí.' : ma === 'het_phien' ? 'Phiên hết hạn, đăng nhập lại.' : ma === 'ban_qua' ? TK.cauQuaTai(j) : 'Trợ lý chưa trả lời (' + ma + (j.chi_tiet ? ': ' + j.chi_tiet : '') + ').'; P.lichSu.push({ vai: 'ai', text: '⚠️ ' + chu }); st.textContent = chu; break; }
      if (j.ve) ve = j.ve; if (j.luot_con != null) st.textContent = 'Còn ' + j.luot_con + ' lượt chat.';
      if (j.goi && j.goi.length) {
        ls.push({ vai: 'ai', text: j.text || '', ky_text: j.ky_text, goi: j.goi }); const kq = [];
        for (const g of j.goi) {
          soLenh++; const nhan = (AGENT_TEN[g.ten] || g.ten) + ' · ' + agentTomTatGoi(g.args || {}); const dong = ghiBuoc('🔧 ' + nhan, 'lenh');
          let res; try { res = await agentXuLy(g.ten, g.args || {}); } catch (e) { res = { isError: true, text: String(e && e.message || e) }; }
          dong.textContent = (res.isError ? '⚠ ' : '✓ ') + nhan; if (res.isError) { dong.classList.add('loi'); dong.title = typeof res.text === 'string' ? res.text : ''; } dong.dataset.anh = res.image && res.image.data ? 'data:' + (res.image.mime || 'image/png') + ';base64,' + res.image.data : '';
          if (res.image) { const im = el('img', 'khungnho'); im.src = 'data:' + (res.image.mime || 'image/png') + ';base64,' + res.image.data; im.alt = 'khung'; im.title = 'Khung AI vừa xem'; dong.appendChild(im); }
          kq.push({ id: g.id, ten: g.ten, text: typeof res.text === 'string' ? res.text : JSON.stringify(res.text), image: res.image, isError: !!res.isError });
        }
        ls.push({ vai: 'tool', kq }); continue;
      }
      const tl = (j.text || 'Xong.').trim(); ls.push({ vai: 'ai', text: tl }); P.lichSu.push({ vai: 'ai', text: tl }); break;
    }
    if (buoc >= 16) P.lichSu.push({ vai: 'ai', text: 'Mình dừng sau 16 bước, bạn xem lại rồi ra lệnh tiếp nhé.' });
  } catch (e) { console.error('[agent]', e); P.lichSu.push({ vai: 'ai', text: '⚠️ Mất kết nối máy chủ trợ lý.' }); }
  finally { P.gomUndo = false; cho.remove(); if (hop) { const dong = [...hop.querySelectorAll('.bc.lenh')].map(x => ({ t: x.textContent, anh: x.dataset.anh || '', loi: x.classList.contains('loi') })); hop.remove(); if (dong.length) P.lichSu.splice(P.lichSu.length - (P.lichSu.length && P.lichSu[P.lichSu.length - 1].vai === 'ai' && !P.lichSu[P.lichSu.length - 1].buoc ? 1 : 0), 0, { vai: 'ai', buoc: true, dong, text: dong.map(x => x.t).join('\n') }); } AG.dang = false; btn.disabled = false; }
  veDs(); veTl(); veLoi(); if (!P.dang) veKhung(); docTuNhan();
  if (soLenh) st.textContent = `Xong sau ${Math.round((Date.now() - t0) / 1000)} giây · ${soLenh} thao tác · ${P.clips.length} đoạn · ${fmt(tongGiay())}` + (P.gfx.length ? ' · ' + P.gfx.length + ' đồ hoạ' : '');
  if (P.clips.some(c => c.chuyen && c.chuyen !== 'cat')) gltNap();
}
async function aiDung(yc) {
  yc = (yc || $('#yc').value).trim(); if (!yc) { toast('Gõ yêu cầu trước đã'); return; }
  if (MC.url && MC.dich_vu.agent && $('#aiAgent').checked && !AG.dang && !arguments[1]) { if (!TK.token()) { TK.canCo && TK.canCo('chat'); return; } return agentChay(yc); }
  const co = P.srcs.filter(s => (s.tt === 'xong' && (s.cau.length || s.canh.length)) || s.loai === 'anh');
  if (!co.length) { toast('Cần ít nhất một footage đã được hiểu'); doiTab('footage'); return; }
  if (!(await TK.canCo('chat'))) return;
  const st = $('#aiStatus'), btn = $('#btnAI'); btn.disabled = true;
  P.lichSu.push({ vai: 'nd', text: yc }); veDs(); $('#yc').value = '';
  const buoc = ['Đang đọc ' + co.length + ' footage…', 'Xếp câu mạnh lên đầu, bỏ vấp và lặp…', P.beat.length ? 'Canh điểm cắt theo ' + P.beat.length + ' beat…' : 'Canh nhịp 3–5 giây một ý…', 'Đặt phụ đề và đồ hoạ…'];
  let bi = 0; const bEl = el('div', 'm ai buoc', buoc[0]); $('#ds').appendChild(bEl);
  const t0 = Date.now(); const tick = setInterval(() => { bi = Math.min(buoc.length - 1, Math.floor((Date.now() - t0) / 6000)); bEl.textContent = buoc[bi] + ' ' + Math.round((Date.now() - t0) / 1000) + 's'; }, 500);
  try {
    const r = await TK.goiNen({ action: 'hook_ai', mode: 'dung_ke_hoach', token: TK.token(), dev: TK.dev(), ho_so: TK.hoSo(), yeu_cau: yc,
      nguon: co.map(s => ({ id: s.id, ten: s.ten, giay: s.giay, loai: s.loai, loai_canh: s.loai_canh, mo_ta: s.mo_ta, cau: s.cau.map(c => ({ bd: c.bd, kt: c.kt, text: c.text, loai: c.loai })), canh: s.canh, khoanh_khac: s.khoanh_khac })),
      clips: P.clips, lich_su: P.lichSu.slice(-8), beat: P.beat, tham_chieu: P.thamChieu, che_do: $('#cheDo').value }, { tool: 'dung_kh', nhan: 'Trợ lý dựng' });
    clearInterval(tick); bEl.remove();
    if (!r.ok) { st.textContent = (ERR[r.error] || 'AI chưa dựng được, thử lại.') + (r.chi_tiet ? ' ' + r.chi_tiet : ''); if (r.error === 'het_luot_thu') TK.moHet('chat'); P.lichSu.push({ vai: 'ai', text: '⚠️ ' + (ERR[r.error] || r.error) }); veDs(); return; }
    const d = r.data; luuHoanTac();
    if (d.clips && d.clips.length) P.clips = d.clips.map(c => ({ src: c.src, bd: c.bd, kt: c.kt, ly_do: c.ly_do, chuyen: c.chuyen || 'cat' }));
    if (Array.isArray(d.broll)) P.broll = d.broll.filter(b => srcCua(b.src)).map(b => ({ id: uid(), ...b }));
    if (d.font && FONT_CSS[d.font]) { $('#font').value = d.font; capNhatFont(); }
    if (d.khung) { if (d.khung !== 'bam_mat' || P.srcs.some(z => z.mat.length)) $('#khungKieu').value = d.khung; }
    if (P.snap && P.beat.length && d.nhac && d.nhac.cat_theo_beat) hitBeat();
    if (typeof d.hook === 'string') $('#hook').value = d.hook;
    if (d.phu_de) { $('#phuDe').checked = d.phu_de.bat; $('#pdKieu').value = d.phu_de.kieu; $('#pdCum').value = d.phu_de.cum_tu; if (d.phu_de.nhan_manh && d.phu_de.nhan_manh.length) $('#pdNhan').value = d.phu_de.nhan_manh.join(', '); }
    if (d.do_hoa) P.gfx = d.do_hoa.map(g => ({ id: uid(), ...g }));
    P.zoom = d.zoom || [];
    if (d.nhac) { $('#duckNoi').value = Math.round(d.nhac.muc_noi * 100); $('#duckBroll').value = Math.round(d.nhac.muc_broll * 100); }
    P.lichSu.push({ vai: 'ai', text: d.tra_loi || 'Đã dựng.' }); veDs();
    gopClips(); veTl(); veLoi(); P.t = 0; veKhung(); docTuNhan();
    st.textContent = `Xong sau ${Math.round((Date.now() - t0) / 1000)} giây · ${P.clips.length} đoạn · ${fmt(tongGiay())}` + (P.gfx.length ? ' · ' + P.gfx.length + ' đồ hoạ' : '') + (P.broll.length ? ' · ' + P.broll.length + ' b-roll' : '');
    if (P.clips.some(c => c.chuyen && c.chuyen !== 'cat')) gltNap();
    if (matchMedia('(max-width:980px)').matches) $('.ecol.giua').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) { clearInterval(tick); bEl.remove(); st.textContent = TK.loiMang(e) ? 'Mất mạng, thử lại.' : 'Có lỗi: ' + (e.message || e); }
  finally { clearInterval(tick); btn.disabled = false; }
}
$('#btnAI').onclick = () => aiDung();
$('#yc').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && innerWidth > 560) { e.preventDefault(); aiDung(); } });
$$('#goiY button').forEach(b => b.onclick = () => aiDung(b.textContent));
/* video tham chiếu: hiểu như footage (tốn 1 lượt) rồi rút số liệu nhịp để AI bắt chước, không đưa vào V1 */
$('#thamChieuIn').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const s = { id: 'ref', ten: f.name, file: f, url: URL.createObjectURL(f), loai: 'video', giay: 0, tu: [], cau: [], canh: [], khoanh_khac: [], thumbs: {}, imLang: [] };
  $('#thamChieuTen').textContent = 'đang hiểu ' + f.name + '…';
  try { const v = await taoVideoEl(s); s.giay = v.duration; s.w = v.videoWidth; s.h = v.videoHeight; await hieu(s); if (s.tt !== 'xong') throw new Error(s.loi || 'lỗi'); }
  catch (err) { $('#thamChieuTen').textContent = 'không đọc được tham chiếu'; return; }
  const doDai = s.canh.map(c => c.kt - c.bd), tb = doDai.length ? doDai.reduce((a, b) => a + b, 0) / doDai.length : 0;
  P.thamChieu = { giay: Math.round(s.giay), so_canh: s.canh.length, do_dai_canh_tb: Math.round(tb * 10) / 10, tu_moi_giay: s.giay ? Math.round(s.tu.length / s.giay * 10) / 10 : 0, cau_dau: s.cau[0] ? s.cau[0].text.slice(0, 120) : '', loai_canh: s.loai_canh, mo_ta: s.mo_ta, co_chu_tren_hinh: s.canh.some(c => c.tags.includes('chu_tren_hinh')) };
  $('#thamChieuTen').textContent = '✓ ' + f.name + ' · ' + s.canh.length + ' cảnh, ' + fmt1(tb) + 's/cảnh'; if (s.el) s.el.remove();
  toast('Đã học nhịp video tham chiếu. Giờ ra lệnh "dựng theo nhịp video tham chiếu".');
};
