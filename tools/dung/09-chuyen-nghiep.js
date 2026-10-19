/* ═════════ CHUYÊN NGHIỆP (học từ FilmCraft, giữ cách bày của CapCut) ═════════
   1. Bàn trộn: âm lượng (dB) / tắt / solo từng track, lưu theo dự án; áp cả xem trước lẫn bản xuất (trVol)
   2. Đồng hồ âm lượng: đỉnh trái/phải + độ to tức thời (LUFS, K-weighting) như bảng meter của FilmCraft
   3. Lịch sử thao tác: danh sách từng bước, bấm để quay về đúng bước (vẫn Làm lại được)
   4. Tự lưu nhiều bản: 2 phút một bản, giữ 10 bản gần nhất, khôi phục trong Lịch sử
   5. Chế độ cắt chạm được (điện thoại không có Alt): Thường / Dời điểm nối / Trượt đoạn / Trượt nội dung, nhích từng khung
   6. Chọn khúc từ footage (kiểu Source monitor): đặt đầu–cuối rồi Chèn hoặc Ghi đè tại đầu phát
   7. Keyframe cho màu, bộ lọc, hiệu ứng (mauTai)                                                                           */
Object.assign(IC, {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mixer: '<path d="M6 3v18M12 3v18M18 3v18"/><rect x="4" y="13" width="4" height="3" rx="1"/><rect x="10" y="6" width="4" height="3" rx="1"/><rect x="16" y="10" width="4" height="3" rx="1"/>',
  trim: '<path d="M8 4v16M16 4v16"/><path d="M4 9l4 3-4 3M20 9l-4 3 4 3"/>',
  khuc: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14"/><path d="M11 10l3 2-3 2z"/>'
});

/* ── 1. âm lượng track (dB) ── */
function trVol(k) { const d = +trO(k).db; return Number.isFinite(d) && d ? Math.pow(10, d / 20) : 1; }

/* ── 7. keyframe màu / bộ lọc / hiệu ứng: bản sao của đoạn mang giá trị tại thời điểm off ── */
const MAU_KF = ['sang', 'tuong_phan', 'bao_hoa', 'locMuc', 'phoi', 'nhiet', 'tint', 'sang_cao', 'toi', 'vignette', 'hat', 'trang', 'den', 'hue', 'vib', 'phai', 'net', 'ro', 'huMuc'];
Object.assign(KF_TEN, { sang: 'Độ sáng', tuong_phan: 'Tương phản', bao_hoa: 'Bão hoà', locMuc: 'Cường độ bộ lọc', phoi: 'Phơi sáng', nhiet: 'Nhiệt độ', tint: 'Tint', sang_cao: 'Vùng sáng', toi: 'Vùng tối', vignette: 'Viền tối', hat: 'Hạt phim', trang: 'Trắng', den: 'Đen', hue: 'Sắc độ', vib: 'Độ rực', phai: 'Phai màu', net: 'Độ nét', ro: 'Độ trong', huMuc: 'Cường độ hiệu ứng' });
function mauTai(c, off) {
  if (!c || !c.kfs) return c; const ds = MAU_KF.filter(k => c.kfs[k] && c.kfs[k].length); if (!ds.length) return c;
  const o = Object.assign({}, c); ds.forEach(k => { o[k] = giaTriKf(c, k, off); }); return o;
}

/* ── 3. lịch sử thao tác ── */
const LS_LUC = new Map();
{ const luuGoc = luuHoanTac; luuHoanTac = function () { const n = P.hoanTac.length; const r = luuGoc.apply(this, arguments); if (P.hoanTac.length > n || (n >= 200 && P.hoanTac.length === 200)) LS_LUC.set(P.hoanTac[P.hoanTac.length - 1], Date.now()); if (LS_LUC.size > 260) { const con = new Set(P.hoanTac); [...LS_LUC.keys()].forEach(k => { if (!con.has(k)) LS_LUC.delete(k); }); } return r; }; }
function tenBuoc(a, b) {
  // a: trạng thái trước, b: trạng thái sau (đều là object đã parse)
  const ten = { clips: ['đoạn', 'Track chính'], gfx: ['chữ / đồ hoạ', 'Chữ'], broll: ['lớp phủ', 'Lớp phủ'], am3: ['âm thanh', 'Âm thanh'], tieng: ['lồng tiếng', 'Lồng tiếng'], moc: ['mốc', 'Mốc'], beat: ['beat', 'Beat'] };
  for (const k of Object.keys(ten)) { const x = (a[k] || []).length, y = (b[k] || []).length; if (y > x) return 'Thêm ' + ten[k][0] + (y - x > 1 ? ' (' + (y - x) + ')' : ''); if (y < x) return 'Xoá ' + ten[k][0] + (x - y > 1 ? ' (' + (x - y) + ')' : ''); }
  for (const k of Object.keys(ten)) if (JSON.stringify(a[k] || []) !== JSON.stringify(b[k] || [])) return 'Sửa ' + ten[k][0];
  if (JSON.stringify(a.pdKieu || a.zoom) !== JSON.stringify(b.pdKieu || b.zoom)) return 'Đổi kiểu phụ đề / zoom';
  return 'Chỉnh sửa';
}
function tgTruoc(ms) { const s = Math.round((Date.now() - ms) / 1000); return s < 60 ? s + ' giây trước' : s < 3600 ? Math.round(s / 60) + ' phút trước' : new Date(ms).toTimeString().slice(0, 5); }
async function moLichSu(nut) {
  const r = (nut || $('#ed')).getBoundingClientRect(), ds = [], H = P.hoanTac, n = H.length, hienTai = chupTT();
  const dau = Math.max(0, n - 30);
  for (let i = n - 1; i >= dau; i--) {
    let ten = 'Chỉnh sửa'; try { ten = tenBuoc(JSON.parse(H[i]), JSON.parse(i === n - 1 ? hienTai : H[i + 1])); } catch { }
    const luc = LS_LUC.get(H[i]), lui = n - i;
    ds.push({ ic: 'undo', t: ten, k: luc ? tgTruoc(luc) : lui + ' bước', f: () => { for (let j = 0; j < lui; j++) hoanTac(); toast('Đã quay về trước bước “' + ten + '” · Ctrl+Shift+Z để làm lại'); } });
  }
  if (!ds.length) ds.push({ ic: 'clock', t: 'Chưa có thao tác nào', f: () => { } });
  const ban = await dsBanTuLuu().catch(() => []);
  if (ban.length) { ds.push('-'); ban.slice(0, 10).forEach(b => ds.push({ ic: 'clock', t: 'Bản tự lưu ' + new Date(b.sua).toTimeString().slice(0, 5), k: tgTruoc(b.sua), f: () => khoiPhucBan(b) })); }
  moMenu(Math.max(8, r.left), r.bottom + 4, ds);
}

/* ── 4. tự lưu nhiều bản ── */
const BAN_MOI = 120000, BAN_GIU = 10; let banLuc = 0;
async function dsBanTuLuu() { if (!P.duAnId || !window.indexedDB) return []; const all = await dbTatCa(KHO_DA); return all.filter(r => String(r.id).startsWith('ban:' + P.duAnId + ':')).sort((a, b) => b.sua - a.sua); }
{ const tuLuuGoc = tuLuu; tuLuu = async function () { const r = await tuLuuGoc.apply(this, arguments); try { if (P.duAnId && Date.now() - banLuc > BAN_MOI && (P.clips.length || P.gfx.length)) { banLuc = Date.now(); const goc = await dbLay(KHO_DA, P.duAnId); if (goc) { await dbGhi(KHO_DA, { ...goc, id: 'ban:' + P.duAnId + ':' + Date.now(), ban: true, sua: Date.now() }); const ds = await dsBanTuLuu(); for (const x of ds.slice(BAN_GIU)) await dbXoa(KHO_DA, x.id); } } } catch (e) { console.warn('[bản tự lưu]', e); } return r; }; }
{ const dsGoc = dsDuAn; dsDuAn = async function () { const all = await dsGoc.apply(this, arguments); return all.filter(r => !String(r.id).startsWith('ban:')); }; }
function khoiPhucBan(b) {
  const j = b.json || {}; if (!confirm('Khôi phục bản tự lưu lúc ' + new Date(b.sua).toTimeString().slice(0, 5) + '? Bản hiện tại vẫn hoàn tác lại được.')) return;
  luuHoanTac(); P.clips = j.clips || []; P.gfx = j.gfx || []; P.broll = j.broll || []; P.moc = j.moc || []; P.zoom = j.zoom || []; if (j.beat) P.beat = j.beat; if (j.am3) { am3KhoNap(j.am3Kho); P.am3 = am3Day(j.am3); } P.pdNgoai = j.pdNgoai || null; if (j.tr) P.tr = j.tr;
  P.chon = null; veTl(); veLoi(); veKhung(); try { veTrNut(); } catch { } toast('Đã khôi phục bản tự lưu · Ctrl+Z để về bản vừa rồi');
}

/* ── 5. chế độ cắt chạm được + nhích từng khung ── */
const TRIM_TEN = { thuong: 'Cắt thường (dồn sau)', roll: 'Dời điểm nối (roll)', slide: 'Trượt đoạn (slide)', slip: 'Trượt nội dung (slip)' };
function datCheDoTrim(m) { P.cheDoTrim = m; P.slip = m === 'slip'; const b = $('#btnSlip'); if (b) b.setAttribute('aria-pressed', String(P.slip)); $$('.nutTrim').forEach(x => { x.classList.toggle('bat', m !== 'thuong'); const s = x.querySelector('span'); if (s) s.textContent = m === 'thuong' ? 'Cắt nối' : TRIM_TEN[m].split(' (')[0]; }); toast(TRIM_TEN[m] + (m === 'thuong' ? '' : ' · kéo mép / thân đoạn trên dòng thời gian')); }
function nhichKhung(huong) {
  const ch = P.chon; if (!ch || ch.k !== 'v') { toast('Chọn một đoạn trên track chính trước'); return; } const i = ch.i, c = P.clips[i]; if (!c || khoaMuc('v', c)) { if (c) baoKhoa(); return; }
  const d = huong / fpsDuAn(), che = P.cheDoTrim || 'thuong', s = srcCua(c.src), k = tocC(c); luuHoanTac(); let ok = 0;
  if (che === 'roll') { const B = P.clips[i + 1]; if (B) ok = cuonMep(i, d, JSON.parse(JSON.stringify(c)), JSON.parse(JSON.stringify(B))); }
  else if (che === 'slide') ok = truotDoan(i, d, i > 0 ? JSON.parse(JSON.stringify(P.clips[i - 1])) : null, P.clips[i + 1] ? JSON.parse(JSON.stringify(P.clips[i + 1])) : null);
  else if (che === 'slip') { if (!c.dao && !c.trong) { const len = c.kt - c.bd, nb = Math.max(0, Math.min((s ? s.giay : c.kt) - len, c.bd + d * k)); if (Math.abs(nb - c.bd) > 1e-6) { c.bd = +nb.toFixed(4); c.kt = +(nb + len).toFixed(4); ok = 1; } } }
  else if (!c.dao && !c.trong) { const cu = daiC(c), nk = Math.max(c.bd + 0.1, Math.min(gioiHanNguon(s, 1e9), c.kt + d * k)); if (Math.abs(nk - c.kt) > 1e-6) { const bd = batDauC(c); c.kt = +nk.toFixed(4); ripple(bd + cu, daiC(c) - cu); ok = 1; } }
  if (!ok) { huyHoanTac(); toast('Không nhích được thêm ở chế độ này'); return; }
  veTl(); veLoi(); veKhung(); veProp();
}
function moMenuTrim(nut) {
  const r = nut.getBoundingClientRect(), m = P.cheDoTrim || 'thuong';
  moMenu(r.left, r.bottom + 4, [...Object.keys(TRIM_TEN).map(k => ({ ic: k === m ? 'check' : 'trim', t: TRIM_TEN[k], f: () => datCheDoTrim(k) })), '-',
    { ic: 'back', t: 'Nhích lùi 1 khung (mép phải đoạn chọn)', k: 'Alt+←', f: () => nhichKhung(-1) }, { ic: 'trim', t: 'Nhích tới 1 khung', k: 'Alt+→', f: () => nhichKhung(1) }]);
}

/* ── 1. bàn trộn ── */
function dsTrackAm() {
  const ds = [['v1', 'Tiếng gốc (V1)']]; if (P.nhac) ds.push(['a1', 'Nhạc nền']); if ((P.tieng || []).length) ds.push(['a2', 'Lồng tiếng']);
  const lop = [...new Set((P.am3 || []).map(a => a.lop || 1))].sort((a, b) => a - b); lop.forEach(l => ds.push([keyAm(l), 'Âm thanh ' + (l === 1 ? '' : l) + ' (A3' + (l > 1 ? '·' + l : '') + ')'])); return ds;
}
function moTron() {
  let h = $('#fcTron'); if (h) { h.remove(); return; }
  h = el('div'); h.id = 'fcTron'; h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', 'Bàn trộn âm thanh');
  const hop = el('div', 'hop'), dau = el('div', 'dau'); dau.append(el('b', null, 'Bàn trộn')); const x = el('button', 'btn nho'); x.type = 'button'; x.textContent = 'Xong'; x.onclick = () => h.remove(); dau.append(x); hop.append(dau);
  const ve = () => { [...hop.querySelectorAll('.hang')].forEach(e => e.remove()); dsTrackAm().forEach(([k, ten]) => {
    const o = trO(k), d = el('div', 'hang'), nhan = el('span', 'ten', ten), r = el('input'); r.type = 'range'; r.min = -30; r.max = 6; r.step = 0.5; r.value = Number.isFinite(+o.db) ? +o.db : 0; r.setAttribute('aria-label', 'Âm lượng ' + ten);
    const so = el('span', 'so'), viet = () => { so.textContent = (+r.value > 0 ? '+' : '') + (+r.value).toFixed(1) + ' dB'; }; viet();
    r.oninput = () => { P.tr = P.tr || {}; const t = P.tr[k] = P.tr[k] || {}; t.db = +r.value; if (!t.db) delete t.db; viet(); if (P.dang && (k === 'a3' || /^A\d+$/.test(k))) am3BatDau(); if (typeof henLuu === 'function') henLuu(); };
    r.ondblclick = () => { r.value = 0; r.oninput(); };
    const nM = el('button', 'btn nho' + (o.tat ? ' bat' : ''), 'M'); nM.type = 'button'; nM.title = 'Tắt tiếng track'; nM.onclick = () => { doiTr(k, 'tat'); ve(); };
    const nS = el('button', 'btn nho' + (o.solo ? ' bat' : ''), 'S'); nS.type = 'button'; nS.title = 'Chỉ nghe track này (solo)'; nS.onclick = () => { if (typeof doiSolo === 'function') doiSolo(k); ve(); };
    d.append(nhan, nM, nS, r, so); hop.insertBefore(d, ghi); }); };
  const ghi = el('p', 'ghi', 'Kéo thanh để chỉnh độ to từng track (đúp chuột để về 0 dB). Áp cả lúc xem lẫn lúc xuất; bộ chặn đỉnh ở bus tổng giữ không vỡ tiếng.'); hop.append(ghi);
  h.append(hop); h.onclick = e => { if (e.target === h) h.remove(); }; $('#ed').append(h); ve();
}

/* ── 2. đồng hồ âm lượng (đỉnh L/R + LUFS tức thời) ── */
let DH = null;
function noiDongHo() {
  if (DH || typeof ac === 'undefined' || !ac) return; const lim = raAc(); if (!lim || !lim._ra) return;
  const sp = ac.createChannelSplitter(2), aL = ac.createAnalyser(), aR = ac.createAnalyser(); aL.fftSize = aR.fftSize = 2048; lim._ra.connect(sp); sp.connect(aL, 0); sp.connect(aR, 1);
  const kw = ch => { const hs = ac.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 1500; hs.gain.value = 4; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38; hp.Q.value = 0.5; const an = ac.createAnalyser(); an.fftSize = 16384; sp.connect(hs, ch); hs.connect(hp); hp.connect(an); return an; };
  DH = { aL, aR, kL: kw(0), kR: kw(1), buf: new Float32Array(16384), b2: new Float32Array(2048), pL: 0, pR: 0 };
}
function veDongHo() {
  const m = $('#fcMeter'); if (!m) return; if (!DH) noiDongHo();
  const dB = v => v > 1e-6 ? 20 * Math.log10(v) : -90, ms = a => { a.getFloatTimeDomainData(DH.buf); let s = 0; for (let i = 0; i < DH.buf.length; i++) s += DH.buf[i] * DH.buf[i]; return s / DH.buf.length; };
  let pL = 0, pR = 0, L = -90;
  if (DH && P.dang) { DH.aL.getFloatTimeDomainData(DH.b2); for (const v of DH.b2) pL = Math.max(pL, Math.abs(v)); DH.aR.getFloatTimeDomainData(DH.b2); for (const v of DH.b2) pR = Math.max(pR, Math.abs(v)); const tong = ms(DH.kL) + ms(DH.kR); L = tong > 1e-9 ? -0.691 + 10 * Math.log10(tong) : -90; }
  DH && (DH.pL = Math.max(pL, DH.pL * 0.92), DH.pR = Math.max(pR, DH.pR * 0.92));
  const cao = v => Math.max(0, Math.min(100, (dB(v) + 60) / 60 * 100)) + '%';
  m.querySelector('.cL').style.height = cao(DH ? DH.pL : 0); m.querySelector('.cR').style.height = cao(DH ? DH.pR : 0);
  const t = m.querySelector('.lufs'); t.textContent = L > -60 ? L.toFixed(1) : '–'; t.classList.toggle('to', L > -11); m.classList.toggle('vo', (DH && Math.max(DH.pL, DH.pR) >= 0.99));
}

/* ── 6. chọn khúc từ footage rồi chèn / ghi đè ── */
function moChonKhuc(s) {
  if (!s || !s.el || !(s.loai === 'video' || s.loai === 'ghep')) { toast('Chỉ chọn khúc được với video'); return; }
  let h = $('#fcKhuc'); if (h) h.remove(); h = el('div'); h.id = 'fcKhuc'; h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', 'Chọn khúc từ footage');
  const hop = el('div', 'hop'), dau = el('div', 'dau'); dau.append(el('b', null, 'Chọn khúc · ' + String(s.ten || '').replace(/\.[a-z0-9]{2,5}$/i, ''))); const x = el('button', 'btn nho'); x.type = 'button'; x.textContent = 'Đóng'; x.onclick = () => dong(); dau.append(x); hop.append(dau);
  const v = el('video'); v.src = s.el.currentSrc || s.el.src; v.playsInline = true; v.muted = false; v.preload = 'auto'; hop.append(v);
  const G = s.giay || 1, f = fpsDuAn(); let vao = 0, ra = G;
  const thanh = el('div', 'thanh'), vung = el('div', 'vung'), ph = el('div', 'ph'); thanh.append(vung, ph); hop.append(thanh);
  const tg = el('div', 'tg'), ve = () => { vung.style.left = vao / G * 100 + '%'; vung.style.width = (ra - vao) / G * 100 + '%'; ph.style.left = (v.currentTime || 0) / G * 100 + '%'; tg.innerHTML = '<b>' + fmtTC(v.currentTime || 0) + '</b> · đầu ' + fmtTC(vao) + ' · cuối ' + fmtTC(ra) + ' · dài ' + fmt1(ra - vao) + 's'; };
  hop.append(tg);
  const tua = e => { const r = thanh.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(G, (e.clientX - r.left) / r.width * G)); ve(); };
  thanh.onpointerdown = e => { thanh.setPointerCapture(e.pointerId); tua(e); thanh.onpointermove = tua; }; thanh.onpointerup = () => { thanh.onpointermove = null; };
  const hang = el('div', 'row'), nut = (t, fn, cls) => { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), t); b.type = 'button'; b.onclick = fn; hang.append(b); return b; };
  const choi = nut('▶', () => { if (v.paused) { if (v.currentTime >= ra - 0.02) v.currentTime = vao; v.play(); } else v.pause(); });
  nut('Đặt đầu [I]', () => { vao = Math.min(Math.round(v.currentTime * f) / f, ra - 1 / f); ve(); });
  nut('Đặt cuối [O]', () => { ra = Math.max(Math.round(v.currentTime * f) / f, vao + 1 / f); ve(); });
  hop.append(hang);
  const hang2 = el('div', 'row'); const c1 = el('button', 'btn xanh', 'Chèn tại đầu phát'); c1.type = 'button'; c1.title = 'Đẩy phần sau ra sau (phím ,)'; c1.onclick = () => { chenKhuc(s, vao, ra, false); dong(); };
  const c2 = el('button', 'btn', 'Ghi đè tại đầu phát'); c2.type = 'button'; c2.title = 'Thay phần đang có, tổng độ dài giữ nguyên (phím .)'; c2.onclick = () => { chenKhuc(s, vao, ra, true); dong(); }; hang2.append(c1, c2); hop.append(hang2);
  v.ontimeupdate = () => { if (!v.paused && v.currentTime >= ra) { v.pause(); v.currentTime = ra; } choi.textContent = v.paused ? '▶' : '❚❚'; ve(); }; v.onplay = v.onpause = () => { choi.textContent = v.paused ? '▶' : '❚❚'; };
  const phim = e => { const k = e.key.toLowerCase(); if (k === 'i') { vao = Math.min(Math.round(v.currentTime * f) / f, ra - 1 / f); ve(); } else if (k === 'o') { ra = Math.max(Math.round(v.currentTime * f) / f, vao + 1 / f); ve(); } else if (k === ' ') choi.click(); else if (k === ',') c1.click(); else if (k === '.') c2.click(); else if (k === 'escape') dong(); else if (k === 'arrowleft' || k === 'arrowright') v.currentTime = Math.max(0, Math.min(G, v.currentTime + (k === 'arrowleft' ? -1 : 1) / f)); else return; e.preventDefault(); e.stopImmediatePropagation(); };
  const dong = () => { document.removeEventListener('keydown', phim, true); try { v.pause(); } catch { } h.remove(); };
  document.addEventListener('keydown', phim, true);
  h.append(hop); h.onclick = e => { if (e.target === h) dong(); }; $('#ed').append(h); v.onloadedmetadata = ve; ve();
}
function chenKhuc(s, vao, ra, ghiDe) {
  const moi = { src: s.id, bd: +vao.toFixed(4), kt: +ra.toFixed(4), ly_do: ghiDe ? 'ghi đè' : 'chèn' };
  if (khoaMuc('v', moi)) { baoKhoa(); return; }
  if (!ghiDe) { const bn = P.boNho; P.boNho = { k: 'v', d: moi }; dan(); P.boNho = bn; toast('Đã chèn ' + fmt1(ra - vao) + 's tại đầu phát'); return; }
  luuHoanTac(); P.gomUndo = true;
  try {
    const len = (ra - vao), t0 = khungGiay(P.t), t1 = khungGiay(t0 + len);
    const tachTai = t => { const { clip, bdTl } = viTri(t); if (clip < 0) return; const c = P.clips[clip], off = t - bdTl; if (off > 1 / fpsDuAn() - 1e-6 && off < daiC(c) - 1 / fpsDuAn() + 1e-6 && !c.trong && !c.cong) tachV1(clip, off); };
    tachTai(t1); tachTai(t0);
    let acc = 0, vt = P.clips.length; const giu = [];
    P.clips.forEach((c, i) => { const a = acc, b = acc + daiC(c); acc = b; if (a >= t0 - 1e-3 && b <= t1 + 1e-3) { if (vt === P.clips.length) vt = giu.length; return; } if (a >= t1 - 1e-3 && vt === P.clips.length) vt = giu.length; giu.push(c); });
    if (vt > giu.length) vt = giu.length; if (t0 > acc + 1e-3) giu.push({ trong: true, src: '', bd: 0, kt: +(t0 - acc).toFixed(4) }), vt = giu.length;
    giu.splice(vt, 0, { ...moi, id: uid() }); P.clips = giu; P.chon = { k: 'v', i: vt };
  } finally { P.gomUndo = false; }
  veTl(); veLoi(); veKhung(); toast('Đã ghi đè ' + fmt1(ra - vao) + 's tại đầu phát');
}

/* ── khởi tạo ── */
function khoiTao09() {
  const ed = $('#ed');
  // nút trên thanh công cụ dòng thời gian (máy tính)
  const sau = $('#btnLamLai');
  if (sau) {
    const ls = el('button', 'ic'); ls.type = 'button'; ls.id = 'btnLichSu'; ls.title = 'Lịch sử thao tác'; ls.innerHTML = ic('clock'); ls.onclick = () => moLichSu(ls); sau.after(ls);
  }
  const slip = $('#btnSlip');
  if (slip) { const t = el('button', 'ic nutTrim'); t.type = 'button'; t.title = 'Chế độ cắt: thường / dời điểm nối / trượt đoạn / trượt nội dung'; t.innerHTML = ic('trim'); t.onclick = () => moMenuTrim(t); slip.after(t); }
  const etool = $('.etl .etool');
  if (etool) { const tr = el('button', 'ic'); tr.type = 'button'; tr.id = 'btnTron'; tr.title = 'Bàn trộn âm thanh'; tr.innerHTML = ic('mixer'); tr.onclick = moTron; (slip ? slip.parentElement : etool).appendChild(tr); }
  // điện thoại: thêm "Cắt nối" vào thanh thao tác đoạn
  const tao = $('#mobTao'); if (tao) { const b = el('button', 'nutTrim'); b.type = 'button'; b.innerHTML = '<i>' + ic('trim') + '</i><span>Cắt nối</span>'; b.onclick = () => moMenuTrim(b); const tach = tao.children[1]; tach ? tach.after(b) : tao.appendChild(b); }
  // Menu chính: Lịch sử, Bàn trộn
  { const goc = moMenu; moMenu = function (x, y, ds) { if (Array.isArray(ds) && ds.some(o => o && o.t === 'Phím tắt')) { const i = ds.findIndex(o => o && o.t === 'Phím tắt'); ds = [...ds.slice(0, i), { ic: 'clock', t: 'Lịch sử thao tác', f: () => setTimeout(() => moLichSu($('#btnMenu') || ed), 30) }, { ic: 'mixer', t: 'Bàn trộn âm thanh', f: () => setTimeout(moTron, 30) }, ...ds.slice(i)]; } return goc.call(this, x, y, ds); }; }
  // footage: nút Chọn khúc
  { const veGoc = veSrcs; veSrcs = function () { const r = veGoc.apply(this, arguments); $$('#srcs .fsrc[data-id]').forEach(d => { const s = srcCua(d.dataset.id); if (!s || !(s.loai === 'video' || s.loai === 'ghep') || d.querySelector('.btnKhuc')) return; const tw = d.querySelector('.thWrap'), b = el('button', tw ? 'hhKhuc btnKhuc' : 'btn nho btnKhuc'); b.type = 'button'; b.innerHTML = ic('khuc') + (tw ? '' : '<span>Chọn khúc</span>'); b.title = 'Chọn khúc: xem footage, đặt đầu–cuối rồi chèn hoặc ghi đè vào dòng thời gian'; b.setAttribute('aria-label', 'Chọn khúc từ ' + (s.ten || 'footage')); b.onclick = e => { e.stopPropagation(); moChonKhuc(s); }; (tw || d.querySelector('.acts') || d).appendChild(b); /* giao diện CapCut: nút nằm trên ảnh thu nhỏ cạnh nút + */ }); return r; }; try { veSrcs(); } catch { } }
  // phím: Alt+← / Alt+→ nhích 1 khung theo chế độ cắt
  document.addEventListener('keydown', e => { const a = document.activeElement; if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return; if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && P.chon && P.chon.k === 'v') { e.preventDefault(); e.stopImmediatePropagation(); nhichKhung(e.key === 'ArrowLeft' ? -1 : 1); } }, true);
  // đồng hồ âm lượng cạnh khung xem
  const giua = $('.ecol.giua'); if (giua && !$('#fcMeter')) { const m = el('div'); m.id = 'fcMeter'; m.title = 'Đồng hồ âm lượng: đỉnh trái / phải và độ to tức thời (LUFS). Đăng TikTok nên quanh −14.'; m.innerHTML = '<div class="cot"><i class="cL"></i></div><div class="cot"><i class="cR"></i></div><span class="lufs">–</span>'; giua.appendChild(m); }
  (function vong() { try { veDongHo(); } catch { } requestAnimationFrame(vong); })();
}
khoiTao09();
