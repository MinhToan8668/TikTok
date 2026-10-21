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
  { const goc = moMenu; moMenu = function (x, y, ds) { if (Array.isArray(ds) && ds.some(o => o && o.t === 'Phím tắt')) { let i = ds.findIndex(o => o && o.t === 'Đồ thị keyframe'); if (i < 0) i = ds.findIndex(o => o && o.t === 'Phím tắt'); ds = [...ds.slice(0, i), { ic: 'clock', t: 'Lịch sử thao tác', f: () => setTimeout(() => moLichSu($('#btnMenu') || ed), 30) }, { ic: 'mixer', t: 'Bàn trộn âm thanh', f: () => setTimeout(moTron, 30) }, ...ds.slice(i)]; } return goc.call(this, x, y, ds); }; }
  // footage: nút Chọn khúc
  { const veGoc = veSrcs; veSrcs = function () { const r = veGoc.apply(this, arguments); $$('#srcs .fsrc[data-id]').forEach(d => { const s = srcCua(d.dataset.id); if (!s || !(s.loai === 'video' || s.loai === 'ghep') || d.querySelector('.btnKhuc')) return; const tw = d.querySelector('.thWrap'), b = el('button', tw ? 'hhKhuc btnKhuc' : 'btn nho btnKhuc'); b.type = 'button'; b.innerHTML = ic('khuc') + (tw ? '' : '<span>Chọn khúc</span>'); b.title = 'Chọn khúc: xem footage, đặt đầu–cuối rồi chèn hoặc ghi đè vào dòng thời gian'; b.setAttribute('aria-label', 'Chọn khúc từ ' + (s.ten || 'footage')); b.onclick = e => { e.stopPropagation(); moChonKhuc(s); }; (tw || d.querySelector('.acts') || d).appendChild(b); /* giao diện CapCut: nút nằm trên ảnh thu nhỏ cạnh nút + */ }); return r; }; try { veSrcs(); } catch { } }
  // phím: Alt+← / Alt+→ nhích 1 khung theo chế độ cắt
  document.addEventListener('keydown', e => { const a = document.activeElement; if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return; if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && P.chon && P.chon.k === 'v') { e.preventDefault(); e.stopImmediatePropagation(); nhichKhung(e.key === 'ArrowLeft' ? -1 : 1); } }, true);
  // đồng hồ âm lượng cạnh khung xem
  const giua = $('.ecol.giua'); if (giua && !$('#fcMeter')) { const m = el('div'); m.id = 'fcMeter'; m.title = 'Đồng hồ âm lượng: đỉnh trái / phải và độ to tức thời (LUFS). Đăng TikTok nên quanh −14.'; m.innerHTML = '<div class="cot"><i class="cL"></i></div><div class="cot"><i class="cR"></i></div><span class="lufs">–</span>'; giua.appendChild(m); }
  (function vong() { try { veDongHo(); } catch { } requestAnimationFrame(vong); })();
}
khoiTao09();

/* ═════════ ĐỢT 3: keyframe cỡ / màu chữ · đồ thị keyframe dạng làn + đường chuyển động · bản xem nhẹ cho footage nặng ═════════ */
Object.assign(KF_TEN, { co: 'Cỡ chữ', mau: 'Màu chữ' });
function hexRgb255(h) { h = String(h || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex255(r) { return '#' + r.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
/* màu keyframe: nội suy từng kênh RGB theo đường cong của keyframe sau */
function mauKf(g, off) {
  const ds = g.kfs.mau; if (off <= ds[0].t) return ds[0].v; const cuoi = ds[ds.length - 1]; if (off >= cuoi.t) return cuoi.v;
  for (let i = 1; i < ds.length; i++) { const a = ds[i - 1], b = ds[i]; if (off <= b.t) { const p = (off - a.t) / Math.max(1e-4, b.t - a.t), e = (b.bz ? bezierFn(b.bz) : (EASE_KF[b.e] || EASE_KF.mem))(p), A = hexRgb255(a.v), B = hexRgb255(b.v); return rgbHex255(A.map((x, j) => x + (B[j] - x) * e)); } }
  return cuoi.v;
}
{ const goc = veDoHoa; veDoHoa = function (ctx, W, H, g, t) {
    const k = g && g.kfs, coCo = k && k.co && k.co.length, coMau = k && k.mau && k.mau.length; if (!coCo && !coMau) return goc.apply(this, arguments);
    const off = t - g.bd, luu = { co: g.co, mau: g.mau }; if (coCo) g.co = giaTriKf(g, 'co', off); if (coMau) g.mau = mauKf(g, off);
    try { return goc.apply(this, arguments); } finally { ['co', 'mau'].forEach(p => { if (luu[p] === undefined) delete g[p]; else g[p] = luu[p]; }); }
  }; }
/* ô Màu chữ: thêm ◇ keyframe; đã có keyframe màu thì đổi màu = đặt keyframe tại đầu phát */
function ganKfMauChu() {
  const ch = P.chon, g = ch && ch.k === 'g' ? P.gfx[ch.i] : null; if (!g || !(g.kieu === 'chu' || g.kieu === 'sticker')) return;
  const l = [...$$('#propChon label')].find(x => { const s = x.querySelector(':scope > span'); return s && s.textContent.trim() === 'Màu chữ'; }); if (!l || l.querySelector('.kfn')) return;
  const inp = l.querySelector('input[type=color]'); if (!inp) return;
  const off = () => P.t - g.bd, ngoai = P.t < g.bd - 0.01 || P.t > g.kt + 0.01, coDs = g.kfs && g.kfs.mau && g.kfs.mau.length, tai = coDs && g.kfs.mau.some(f => Math.abs(f.t - off()) < 1 / fpsDuAn() / 2);
  if (coDs) inp.value = mauKf(g, Math.max(0, off()));
  const nut = el('button', 'kfn' + (tai ? ' co' : coDs ? ' nua' : ''), tai ? '◆' : '◇'); nut.type = 'button'; nut.disabled = ngoai;
  nut.title = ngoai ? 'Đưa đầu phát vào trong chữ để đặt keyframe màu' : tai ? 'Bỏ keyframe màu tại đầu phát' : 'Đặt keyframe màu tại đầu phát (chữ đổi màu dần)';
  nut.onclick = () => { luuHoanTac(); const o = khungGiay(off()); g.kfs = g.kfs || {}; const ds = g.kfs.mau || []; const i = ds.findIndex(f => Math.abs(f.t - o) < 1 / fpsDuAn() / 2);
    if (i >= 0) ds.splice(i, 1); else { ds.push({ t: o, v: inp.value, e: 'mem' }); ds.sort((a, b) => a.t - b.t); } if (ds.length) g.kfs.mau = ds; else delete g.kfs.mau; veProp(); veTl(); veKhung(); };
  inp.addEventListener('input', () => { if (!(g.kfs && g.kfs.mau && g.kfs.mau.length) || ngoai) return; const o = khungGiay(off()), ds = g.kfs.mau, f = ds.find(x => Math.abs(x.t - o) < 1 / fpsDuAn() / 2); if (f) f.v = inp.value; else { ds.push({ t: o, v: inp.value, e: 'mem' }); ds.sort((a, b) => a.t - b.t); } veKhung(); });
  l.insertBefore(nut, inp);
}

/* ── đồ thị keyframe dạng làn ── */
const KF_KHOANG = { sc: [0.3, 3], scX: [0.1, 3], scY: [0.1, 3], xoay: [-180, 180], mo: [0, 1], am: [0, 3.16], co: [0.03, 0.4], locMuc: [0, 1], huMuc: [0, 1], sang: [-50, 50], tuong_phan: [-50, 50], bao_hoa: [-100, 100], hue: [-180, 180], vignette: [0, 100], hat: [0, 100], phai: [0, 100], net: [0, 100] };
function khoangKf(k, ten, ds) { if (ten === 'x' || ten === 'y') return k === 'g' ? [0, 1] : [-0.6, 0.6]; const md = KF_KHOANG[ten] || [-100, 100]; const vs = ds.map(f => f.v); return [Math.min(md[0], ...vs), Math.max(md[1], ...vs)]; }
const DT_LE = 10;   // lề hai bên đồ thị (px) để chấm ở mép không bị cắt
let DT = null;   // { k, m } mục đang vẽ đồ thị
function mucDoThi() { const ch = P.chon; if (!ch || !['v', 'b', 'g'].includes(ch.k)) return null; const m = (MANG()[ch.k] || [])[ch.i]; return m ? { k: ch.k, m } : null; }
function moDoThi() { let h = $('#fcDoThi'); if (h) { h.remove(); veQuyDao(); return; } h = el('div'); h.id = 'fcDoThi'; h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', 'Đồ thị keyframe'); $('#ed').append(h); veDoThi(); }
function veDoThi() {
  const h = $('#fcDoThi'); if (!h) return; const o = mucDoThi(); DT = o; h.innerHTML = '';
  const dau = el('div', 'dau'); dau.append(el('b', null, 'Đồ thị keyframe' + (o ? ' · ' + (o.k === 'g' ? 'chữ / đồ hoạ' : o.k === 'b' ? 'lớp phủ' : 'đoạn V1') : ''))); const x = el('button', 'btn nho'); x.type = 'button'; x.textContent = 'Đóng'; x.onclick = moDoThi; dau.append(x); h.append(dau);
  if (!o) { h.append(el('p', 'ghi', 'Chọn một đoạn, lớp phủ hoặc chữ trên dòng thời gian để xem đường keyframe.')); veQuyDao(); return; }
  const ds = Object.keys(o.m.kfs || {}).filter(t => (o.m.kfs[t] || []).length && t !== 'mau' && typeof o.m.kfs[t][0].v === 'number');
  if (!ds.length) { h.append(el('p', 'ghi', 'Mục này chưa có keyframe. Bấm ◇ cạnh thanh Phóng to, Vị trí, Độ mờ, Màu… trong Thuộc tính để thêm.')); veQuyDao(); return; }
  const hep = innerWidth <= 760, dai = daiMuc(o.k, o.m), W0 = Math.max(240, Math.round(h.clientWidth - (hep ? 26 : 156))), H0 = hep ? 76 : 90; o.W0 = W0;   // viewBox theo đúng kích thước thật để chấm tròn không bị méo
  ds.forEach(ten => {
    const kf = o.m.kfs[ten], [lo, hi] = khoangKf(o.k, ten, kf), X = t => DT_LE + t / Math.max(1e-3, dai) * (W0 - 2 * DT_LE), Y = v => H0 - 8 - (v - lo) / Math.max(1e-6, hi - lo) * (H0 - 16), V = y => lo + (H0 - 8 - y) / (H0 - 16) * (hi - lo);
    const lan = el('div', 'lan'), nhan = el('div', 'nhan'); nhan.innerHTML = '<b>' + (KF_TEN[ten] || ten) + '</b><span class="gt"></span>'; lan.append(nhan);
    const NS = 'http://www.w3.org/2000/svg', sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 ' + W0 + ' ' + H0); sv.setAttribute('preserveAspectRatio', 'none'); sv.classList.add('do');
    let d = ''; for (let i = 0; i <= 120; i++) { const t = dai * i / 120; d += (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(giaTriKf(o.m, ten, t)).toFixed(1); }
    const duong = document.createElementNS(NS, 'path'); duong.setAttribute('d', d); duong.classList.add('duong'); sv.append(duong);
    const ph = document.createElementNS(NS, 'line'); ph.classList.add('ph'); ph.setAttribute('y1', 0); ph.setAttribute('y2', H0); sv.append(ph);
    kf.forEach((f, i) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', X(f.t)); c.setAttribute('cy', Y(f.v)); c.setAttribute('r', 6); c.classList.add('diem'); c.dataset.i = i; sv.append(c); });
    // kéo chấm: ngang = thời điểm (kẹp giữa hai chấm kề), dọc = giá trị; bấm nền = tua đầu phát
    sv.onpointerdown = e => {
      const r = sv.getBoundingClientRect(), toaDo = ev => [(ev.clientX - r.left) / r.width * W0, (ev.clientY - r.top) / r.height * H0];
      const c = e.target.closest('.diem'); if (!c) { const [xx] = toaDo(e); P.t = khungGiay(batDauMuc(o.k, o.m) + Math.max(0, Math.min(1, (xx - DT_LE) / (W0 - 2 * DT_LE))) * dai); veKhung(); vePh(); return; }
      e.preventDefault(); sv.setPointerCapture(e.pointerId); luuHoanTac(); let daKeo = false; const i = +c.dataset.i, f = kf[i];
      const mv = ev => { daKeo = true; const [xx, yy] = toaDo(ev), tMin = i > 0 ? kf[i - 1].t + 1 / fpsDuAn() : 0, tMax = i < kf.length - 1 ? kf[i + 1].t - 1 / fpsDuAn() : dai; f.t = Math.max(tMin, Math.min(tMax, lamTronKhung((xx - DT_LE) / (W0 - 2 * DT_LE) * dai))); f.v = +Math.max(lo, Math.min(hi, V(yy))).toFixed(4); c.setAttribute('cx', X(f.t)); c.setAttribute('cy', Y(f.v)); nhan.querySelector('.gt').textContent = f.v.toFixed(2) + ' @ ' + fmt1(f.t) + 's'; if (!P.dang) veKhung(); veQuyDao(); };
      const up = () => { sv.onpointermove = null; sv.onpointerup = null; if (!daKeo) { huyHoanTac(); P.t = khungGiay(batDauMuc(o.k, o.m) + f.t); veKhung(); vePh(); } veTl(); veProp(); veDoThi(); };
      sv.onpointermove = mv; sv.onpointerup = up; sv.onpointercancel = up;
    };
    lan.append(sv); h.append(lan);
  });
  h.append(el('p', 'ghi', 'Kéo chấm: ngang đổi thời điểm, dọc đổi giá trị. Bấm vào nền để tua tới đó.'));
  veQuyDao();
}
/* đường chuyển động trên khung xem (vị trí x/y có keyframe), kéo chấm để dời */
function veQuyDao() {
  let sv = $('#fcQuyDao'); const kh = $('.khung'), cv = $('#cv'), o = $('#fcDoThi') ? mucDoThi() : null;
  const co = o && o.m.kfs && ((o.m.kfs.x || []).length || (o.m.kfs.y || []).length);
  if (!co || !kh || !cv) { if (sv) sv.remove(); return; }
  const NS = 'http://www.w3.org/2000/svg'; if (!sv) { sv = document.createElementNS(NS, 'svg'); sv.id = 'fcQuyDao'; kh.append(sv); }
  const W = cv.width, H = cv.height; sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sv.innerHTML = '';
  const dai = daiMuc(o.k, o.m), dd = (x, y) => o.k === 'g' ? [x * W, y * H] : [W / 2 + x * W, H / 2 + y * H];
  let d = ''; for (let i = 0; i <= 80; i++) { const t = dai * i / 80, [px, py] = dd(giaTriKf(o.m, 'x', t), giaTriKf(o.m, 'y', t)); d += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1); }
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.classList.add('duong'); sv.append(p);
  const moc = [...new Set([...(o.m.kfs.x || []), ...(o.m.kfs.y || [])].map(f => f.t))].sort((a, b) => a - b);
  moc.forEach(t => { const [px, py] = dd(giaTriKf(o.m, 'x', t), giaTriKf(o.m, 'y', t)), c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', px); c.setAttribute('cy', py); c.setAttribute('r', Math.max(5, W / 90)); c.classList.add('diem'); c.dataset.t = t; sv.append(c); });
  sv.onpointerdown = e => { const c = e.target.closest('.diem'); if (!c) return; e.preventDefault(); e.stopPropagation(); sv.setPointerCapture(e.pointerId); luuHoanTac(); const t = +c.dataset.t, r = sv.getBoundingClientRect(); let daKeo = false;
    const mv = ev => { daKeo = true; const px = (ev.clientX - r.left) / r.width * W, py = (ev.clientY - r.top) / r.height * H, x = o.k === 'g' ? px / W : (px - W / 2) / W, y = o.k === 'g' ? py / H : (py - H / 2) / H; ['x', 'y'].forEach(p2 => { const ds = o.m.kfs[p2]; const v = +(p2 === 'x' ? x : y).toFixed(4); if (ds && ds.length) { const f = ds.find(z => Math.abs(z.t - t) < 1e-3); if (f) f.v = v; else datKf(o.m, p2, t, v); } else datKf(o.m, p2, t, v); }); veKhung(); veQuyDao(); };
    const up = () => { sv.onpointermove = null; sv.onpointerup = null; if (!daKeo) huyHoanTac(); veTl(); veProp(); veDoThi(); };
    sv.onpointermove = mv; sv.onpointerup = up; sv.onpointercancel = up; };
}
function khoiTao09b() {
  // nút Đồ thị keyframe cạnh nút keyframe trên thanh công cụ
  const kfn = $('#btnKfNhanh'); if (kfn) { const b = el('button', 'ic'); b.type = 'button'; b.id = 'btnDoThi'; b.title = 'Đồ thị keyframe: kéo đường giá trị và đường chuyển động'; b.innerHTML = ic('kf'); b.classList.add('nutDoThi'); b.onclick = moDoThi; kfn.after(b); }
  { const goc = moMenu; moMenu = function (x, y, ds) { if (Array.isArray(ds) && ds.some(o => o && o.t === 'Phím tắt')) { const i = ds.findIndex(o => o && o.t === 'Phím tắt'); ds = [...ds.slice(0, i), { ic: 'kf', t: 'Đồ thị keyframe', f: () => setTimeout(moDoThi, 30) }, { ic: 'film', t: 'Bản xem nhẹ cho footage nặng', f: () => setTimeout(moXemNhe, 30) }, ...ds.slice(i)]; } return goc.call(this, x, y, ds); }; }
  // vẽ lại đồ thị khi đổi mục chọn / sửa thuộc tính; gắn ◇ cho Màu chữ
  { const g1 = veProp; veProp = function () { const r = g1.apply(this, arguments); try { ganKfMauChu(); } catch { } if ($('#fcDoThi')) { const o = mucDoThi(); if (!DT || !o || DT.m !== o.m) veDoThi(); } return r; }; }
  { const g2 = veTl; veTl = function () { const r = g2.apply(this, arguments); if ($('#fcDoThi') && !document.querySelector('#fcDoThi .diem:active')) { try { veQuyDao(); } catch { } } return r; }; }
  (function vongPh() { const h = $('#fcDoThi'); if (h && DT) { const st = batDauMuc(DT.k, DT.m), dai = daiMuc(DT.k, DT.m), W0 = DT.W0 || 1000, x = DT_LE + (P.t - st) / Math.max(1e-3, dai) * (W0 - 2 * DT_LE); h.querySelectorAll('line.ph').forEach(l => { l.setAttribute('x1', x); l.setAttribute('x2', x); l.style.display = x >= DT_LE && x <= W0 - DT_LE ? '' : 'none'; }); } requestAnimationFrame(vongPh); })();
}
/* giá trị keyframe màu là chuỗi #rrggbb: mọi chỗ nội suy chung (tách đoạn, chép, cắt khúc) đi qua mauKf */
{ const g0 = giaTriKf; giaTriKf = function (c, ten, off) { if (ten === 'mau' && c && c.kfs && c.kfs.mau && c.kfs.mau.length) return mauKf(c, off); return g0.apply(this, arguments); }; }

/* ── bản xem nhẹ (proxy): footage nặng (4K, bitrate cao) được mã lại cạnh dài 1280, lưu trong máy (OPFS).
   Chỉ dùng khi xem và tua; xuất video luôn đọc file gốc nên chất lượng không đổi. ── */
const NHE_CANH = 1280, NHE_EL = ['el', 'el2', 'elB', 'elG', 'elGs', 'elP', 'elCanh'];
P.xemNhe = (() => { try { return localStorage.getItem('dv_xemNhe') !== '0'; } catch { return true; } })();
function laNang(s) { if (!s || s.loai !== 'video' || !s.file) return false; const mbps = s.giay ? s.file.size * 8 / s.giay / 1e6 : 0; return Math.max(s.w || 0, s.h || 0) > 1920 || mbps > 25; }
async function nheThuMuc() { try { return await (await navigator.storage.getDirectory()).getDirectoryHandle('nhe', { create: true }); } catch { return null; } }
const tenNhe = s => tenOpfs(s.file) + '.mp4';
async function nheDoc(s) { try { const d = await nheThuMuc(); if (!d) return null; const f = await (await d.getFileHandle(tenNhe(s))).getFile(); return f.size ? f : null; } catch { return null; } }
async function nheGhi(s, blob) { try { const d = await nheThuMuc(); if (!d) return false; const h = await d.getFileHandle(tenNhe(s), { create: true }), w = await h.createWritable(); await w.write(blob); await w.close(); return true; } catch (e) { console.warn('nhe', e); return false; } }
async function nheXoa(s) { try { const d = await nheThuMuc(); if (d) await d.removeEntry(tenNhe(s)); } catch { } }
/* đổi nguồn mọi thẻ video của source, giữ nguyên thời điểm và trạng thái phát (cùng thẻ nên đường âm thanh vẫn nối) */
function doiNguonVideo(s, url) {
  s.url = url;
  return Promise.all(NHE_EL.map(k => { const v = s[k]; if (!v || v.tagName !== 'VIDEO' || v.src === url) return null; const t = v.currentTime, dangPhat = !v.paused;
    return new Promise(ok => { const xong = () => { v.removeEventListener('loadeddata', xong); try { v.currentTime = t; } catch { } if (dangPhat) v.play().catch(() => { }); ok(); }; v.addEventListener('loadeddata', xong); setTimeout(xong, 4000); v.src = url; v.load(); }); }));
}
function apNhe(s, bat) { if (!s.urlGoc) s.urlGoc = s.url; return doiNguonVideo(s, bat && s.urlNhe ? s.urlNhe : s.urlGoc); }
async function apNheTatCa() { await Promise.all(P.srcs.filter(s => s.urlNhe).map(s => apNhe(s, P.xemNhe))); if (!P.dang) veKhung(); }
function ganNhe(s, blob) { if (s.urlNhe) URL.revokeObjectURL(s.urlNhe); s.urlNhe = URL.createObjectURL(blob); s.nhe = { size: blob.size }; return apNhe(s, P.xemNhe); }
/* mã lại bằng mediabunny: khung hình chính mỗi 0,5 giây để tua mượt, giữ tiếng (thẻ video còn phát âm thanh) */
async function taoNhe(s, tienDo, giu) {
  const M = await napMB(), lon = Math.max(s.w, s.h), vo = { keyFrameInterval: 0.5, forceTranscode: true, quality: M.QUALITY_MEDIUM };
  if (lon > NHE_CANH) { if (s.w >= s.h) vo.width = NHE_CANH; else vo.height = NHE_CANH; }
  const input = new M.Input({ source: new M.BlobSource(s.file), formats: M.ALL_FORMATS }), output = new M.Output({ format: new M.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new M.BufferTarget() });
  const conv = await M.Conversion.init({ input, output, video: vo });
  if (!conv.isValid || conv.discardedTracks.some(d => d.track && d.track.type === 'audio')) throw new Error('Trình duyệt này chưa mã lại được file này');
  if (giu) giu.conv = conv; conv.onProgress = p => tienDo && tienDo(p);
  await conv.execute();
  const blob = new Blob([output.target.buffer], { type: 'video/mp4' }); await nheGhi(s, blob); await ganNhe(s, blob); return blob;
}
/* thêm footage: có sẵn bản nhẹ trong máy thì gắn luôn; footage nặng chưa có thì gợi ý một lần */
{ const goc = themFile; themFile = async function () { const truoc = new Set(P.srcs); const r = await goc.apply(this, arguments); const moi = P.srcs.filter(s => !truoc.has(s) && s.loai === 'video' && s.file);
    for (const s of moi) { const f = await nheDoc(s); if (f) await ganNhe(s, f); }
    if (moi.some(s => laNang(s) && !s.urlNhe) && !P._goiYNhe) { P._goiYNhe = true; toast('Footage nặng (4K / bitrate cao) dễ giật khi xem. Menu ⋯ → Bản xem nhẹ cho footage nặng để xem mượt hơn, xuất vẫn dùng file gốc.'); }
    return r; }; }
/* xuất: trả mọi thẻ về file gốc, xong mới dùng lại bản nhẹ (xuất thời gian thực thì chờ phát xong) */
{ const goc = batDauXuat; batDauXuat = async function () {
    const ds = P.srcs.filter(s => s.urlNhe && s.url === s.urlNhe); if (!ds.length) return goc.apply(this, arguments);
    await Promise.all(ds.map(s => apNhe(s, false)));
    try { const r = await goc.apply(this, arguments); while (P.dang) await new Promise(ok => setTimeout(ok, 300)); return r; }
    finally { await Promise.all(ds.map(s => apNhe(s, P.xemNhe))); }
  }; }
function moXemNhe() {
  let h = $('#fcNhe'); if (h) { h.remove(); return; }
  h = el('div'); h.id = 'fcNhe'; h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', 'Bản xem nhẹ cho footage nặng');
  const hop = el('div', 'hop'), dau = el('div', 'dau'); dau.append(el('b', null, 'Bản xem nhẹ')); const x = el('button', 'btn nho'); x.type = 'button'; x.textContent = 'Xong'; x.onclick = () => h.remove(); dau.append(x); hop.append(dau);
  hop.append(el('p', 'ghi', 'Tạo bản nhẹ (cạnh dài 1280px) để xem và tua mượt khi footage 4K hoặc quay bitrate cao. Xuất video vẫn dùng file gốc nên chất lượng không đổi. Bản nhẹ lưu trong máy, mở lại dự án là tự dùng.'));
  const bat = el('label', 'batNhe'), cb = el('input'); cb.type = 'checkbox'; cb.checked = P.xemNhe; bat.append(cb, el('span', null, 'Xem bằng bản nhẹ khi có'));
  cb.onchange = async () => { P.xemNhe = cb.checked; try { localStorage.setItem('dv_xemNhe', cb.checked ? '1' : '0'); } catch { } await apNheTatCa(); ve(); }; hop.append(bat);
  const ds = el('div', 'ds'); hop.append(ds); h.append(hop); h.onclick = e => { if (e.target === h) h.remove(); }; document.body.append(h);
  function ve() {
    ds.innerHTML = ''; const vids = P.srcs.filter(s => s.loai === 'video' && s.file);
    if (!vids.length) { ds.append(el('p', 'ghi', 'Chưa có footage video nào.')); return; }
    vids.forEach(s => {
      const d = el('div', 'hang'), mb = (s.file.size / 1048576).toFixed(s.file.size < 1048576 * 10 ? 1 : 0).replace('.', ','), tt = el('div', 'tt');
      tt.append(el('span', 'ten', 'S' + (P.srcs.indexOf(s) + 1) + ' · ' + s.ten), el('small', null, s.w + '×' + s.h + ' · ' + mb + ' MB' + (laNang(s) ? ' · nặng' : '') + (s.urlNhe ? ' · đã có bản nhẹ' + (s.url === s.urlNhe ? ' (đang dùng)' : '') : '')));
      const thanh = el('div', 'tien'), vach = el('i'); thanh.append(vach); thanh.hidden = true; tt.append(thanh); d.append(tt);
      const nut = el('button', 'btn nho'); nut.type = 'button';
      if (s.urlNhe) { nut.textContent = 'Xoá bản nhẹ'; nut.onclick = async () => { await apNhe(s, false); URL.revokeObjectURL(s.urlNhe); s.urlNhe = null; s.nhe = null; await nheXoa(s); if (!P.dang) veKhung(); ve(); }; }
      else if (s._dangNhe) { nut.textContent = 'Huỷ'; nut.onclick = () => { s._dangNhe.huy = true; if (s._dangNhe.conv) s._dangNhe.conv.cancel(); }; thanh.hidden = false; vach.style.width = Math.round((s._dangNhe.p || 0) * 100) + '%'; }
      else { nut.textContent = 'Tạo bản nhẹ'; nut.onclick = () => chayNhe(s); }
      d.append(nut); ds.append(d);
    });
  }
  async function chayNhe(s) {
    const giu = s._dangNhe = { p: 0 }; ve();
    try { await taoNhe(s, p => { giu.p = p; const r = $('#fcNhe'); if (r) { const i = [...r.querySelectorAll('.hang')][P.srcs.filter(z => z.loai === 'video' && z.file).indexOf(s)]; const v = i && i.querySelector('.tien i'); if (v) v.style.width = Math.round(p * 100) + '%'; } }, giu); toast('Đã có bản xem nhẹ cho ' + s.ten); }
    catch (e) { if (!giu.huy) toast('Không tạo được bản nhẹ: ' + (e.message || e) + '. Thử Chrome hoặc Edge bản mới trên máy tính.'); }
    finally { s._dangNhe = null; if ($('#fcNhe')) ve(); }
  }
  ve();
}
khoiTao09b();

/* ═════════ ĐỢT 4: làm mờ / khảm vùng (che mặt, biển số, thông tin riêng) · ổn định hình (chống rung) ═════════ */
/* hình vẽ tô bằng "Làm mờ" hoặc "Khảm": lấy chính khung đã dựng bên dưới, chỉ trong hình (chữ nhật, elip…). Dùng chung Bám vật thể, keyframe, tay cầm của hình */
const TO_HINH = { mau: 'Màu', mo: 'Làm mờ', kham: 'Khảm (ô vuông)' }, toCvs = [document.createElement('canvas'), document.createElement('canvas')];
{ const goc = veHinhGfx; veHinhGfx = function (ctx, W, H, g, tl, dai) {
    if (g.to !== 'mo' && g.to !== 'kham') return goc.apply(this, arguments);
    const cvs = ctx.canvas; if (!cvs || !cvs.width) return true;
    const w = (g.w || 0.4) * W, h = (g.h || 0.25) * H, b = bamTai(g, tl), x = ((g.x == null ? 0.5 : g.x) + (b ? b.dx : 0)) * W, y = ((g.y == null ? 0.5 : g.y) + (b ? b.dy : 0)) * H, kieu = g.hinh === 'duong' ? 'chu_nhat' : (g.hinh || 'chu_nhat'), muc = g.muc == null ? 0.5 : g.muc;
    const [tam, nho] = toCvs; if (tam.width !== cvs.width || tam.height !== cvs.height) { tam.width = cvs.width; tam.height = cvs.height; }
    const tg = tam.getContext('2d'); tg.clearRect(0, 0, tam.width, tam.height); tg.drawImage(cvs, 0, 0);
    ctx.save(); ctx.translate(x, y); if (g.xoay) ctx.rotate(g.xoay * Math.PI / 180); ctx.globalAlpha *= g.mo == null ? 1 : g.mo; duongHinh(ctx, kieu, w, h, g.bo); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (g.to === 'mo') { ctx.filter = 'blur(' + Math.max(1, cvs.width * (0.008 + muc * 0.06)).toFixed(1) + 'px)'; ctx.drawImage(tam, 0, 0); }
    else { const o = Math.max(3, cvs.width * (0.012 + muc * 0.05)), nw = Math.max(1, Math.ceil(cvs.width / o)), nh = Math.max(1, Math.ceil(cvs.height / o)); if (nho.width !== nw || nho.height !== nh) { nho.width = nw; nho.height = nh; } const ng = nho.getContext('2d'); ng.imageSmoothingEnabled = true; ng.drawImage(tam, 0, 0, nw, nh); ctx.imageSmoothingEnabled = false; ctx.drawImage(nho, 0, 0, nw, nh, 0, 0, nw * o, nh * o); }
    ctx.restore(); return true;
  }; }
{ const goc = veThuocTinhGfx3; veThuocTinhGfx3 = function (box, g) {
    const r = goc.apply(this, arguments); if (!g || g.kieu !== 'hinh') return r;
    const n = [...box.querySelectorAll('.nhom2')].find(x => { const b = x.querySelector(':scope > b'); return b && b.textContent === 'Hình vẽ'; }); if (!n) return r;
    const truoc = n.children[2] || null, tam = el('div'); oChon(tam, 'Tô bằng', Object.keys(TO_HINH).map(k => [k, TO_HINH[k]]), g.to || 'mau', v => { if (v === 'mau') delete g.to; else g.to = v; setTimeout(veProp, 0); });
    if (g.to) oTruot(tam, 'Độ mạnh', 0, 1, 0.05, g.muc == null ? 0.5 : g.muc, v => Math.round(v * 100) + '%', v => { g.muc = v; });
    [...tam.children].forEach(c => n.insertBefore(c, truoc)); return r;
  }; }
/* thêm nhanh vùng làm mờ ở đầu phát (mặc định elip giữa khung, 3 giây hoặc tới hết đoạn đang chọn) */
function themVungMo(to) {
  luuHoanTac(); const m = mucChon(), k = P.chon && P.chon.k, bd = khungGiay(P.t), kt = m && ['v', 'b'].includes(k) ? khungGiay(batDauMuc(k, m) + daiMuc(k, m)) : khungGiay(P.t + 3);
  const g = { id: uid(), kieu: 'hinh', ...GX_MD.hinh, hinh: 'tron', to: to || 'mo', muc: 0.6, w: 0.34, h: 0.2, x: 0.5, y: 0.38, mau: 'khong', vien_day: 0, hu: 'khong', boVao: true, boRa: true, text: '', phu: '', bd, kt: Math.max(kt, bd + 1) };
  P.gfx.push(g); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veProp(); veKhung(); if (typeof moPhaiNeuCan === 'function') moPhaiNeuCan();
  toast('Kéo vùng mờ lên chỗ cần che. Muốn che theo người/vật đang chạy: Thuộc tính → Bám theo vật thể.');
}

/* ── ổn định hình: đo dịch chuyển cả khung giữa các khung hình (so khối, ảnh xám 128px), làm mượt quỹ đạo,
   bù phần rung bằng dời + phóng nhẹ. Lưu theo thời gian nguồn nên cắt / tách đoạn vẫn đúng ── */
const OD_FPS = 15, OD_RONG = 128, OD_MUC = { nhe: 'Nhẹ', vua: 'Vừa', manh: 'Mạnh' }, OD_CUA = { nhe: 0.35, vua: 0.8, manh: 1.6 };
function xamNho(v, cw, ch, g) { g.drawImage(v, 0, 0, cw, ch); const d = g.getImageData(0, 0, cw, ch).data, o = new Float32Array(cw * ch); let tb = 0; for (let i = 0; i < o.length; i++) { o[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114; tb += o[i]; } tb /= o.length; for (let i = 0; i < o.length; i++) o[i] -= tb; return o; }
/* độ dời (dx, dy) của b so với a: thử mọi độ dời trong ±R, lấy sai khác nhỏ nhất (lấy mẫu cách 2 điểm) rồi tinh chỉnh dưới điểm ảnh */
function doDoi(a, b, cw, ch, R) {
  let tot = [0, 0], min = Infinity; const sai = (dx, dy) => { let s = 0, n = 0; for (let y = R; y < ch - R; y += 2) { const ra = y * cw, rb = (y + dy) * cw + dx; for (let x = R; x < cw - R; x += 2) { s += Math.abs(a[ra + x] - b[rb + x]); n++; } } return s / n; };
  const bang = {}; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const s = sai(dx, dy); bang[dx + ',' + dy] = s; if (s < min) { min = s; tot = [dx, dy]; } }
  const tinh = (c, l, r) => { const m = l + r - 2 * c; return m > 1e-6 ? 0.5 * (l - r) / m : 0; }, [X, Y] = tot, q = (dx, dy) => bang[dx + ',' + dy];
  const fx = Math.abs(X) < R ? tinh(min, q(X - 1, Y), q(X + 1, Y)) : 0, fy = Math.abs(Y) < R ? tinh(min, q(X, Y - 1), q(X, Y + 1)) : 0;
  return [X + Math.max(-0.5, Math.min(0.5, fx)), Y + Math.max(-0.5, Math.min(0.5, fy))];
}
/* quỹ đạo thô → đường mượt (trung bình có trọng số tam giác) → phần bù = mượt − thô */
function lamMuotQD(ds, cua) { const n = ds.length, r = Math.max(1, Math.round(cua)), kq = new Array(n); for (let i = 0; i < n; i++) { let s = 0, w = 0; for (let j = Math.max(0, i - r); j <= Math.min(n - 1, i + r); j++) { const k = r + 1 - Math.abs(i - j); s += ds[j] * k; w += k; } kq[i] = s / w; } return kq; }
async function phanTichOnDinh(c, muc, tienDo, giu) {
  const s = srcCua(c.src); if (!s || s.loai !== 'video') throw new Error('Chỉ ổn định được đoạn video');
  const v = elPhu(s, 'elOD'), cw = OD_RONG, ch = Math.max(16, Math.round(OD_RONG * (s.h || 9) / (s.w || 16))), R = 10, cv2 = document.createElement('canvas'); cv2.width = cw; cv2.height = ch; const g = cv2.getContext('2d', { willReadFrequently: true });
  const bd0 = Math.max(0, c.bd), kt0 = Math.min(s.giay || c.kt, c.kt), n = Math.max(2, Math.round((kt0 - bd0) * OD_FPS) + 1), tx = [0], ty = [0]; let truoc = null;
  for (let i = 0; i < n; i++) {
    if (giu && giu.huy) throw new Error('huy');
    await seekTo(v, Math.min(kt0 - 0.001, bd0 + i / OD_FPS)); const nay = xamNho(v, cw, ch, g);
    if (truoc) { const [dx, dy] = doDoi(truoc, nay, cw, ch, R); tx.push(tx[tx.length - 1] + dx); ty.push(ty[ty.length - 1] + dy); }
    truoc = nay; if (tienDo) tienDo((i + 1) / n);
  }
  const cua = OD_CUA[muc] * OD_FPS, mx = lamMuotQD(tx, cua), my = lamMuotQD(ty, cua);
  // ảnh dời theo vật (dx dương = khung sau trượt sang phải) → bù ngược lại về đường mượt
  const u = tx.map((x, i) => +((mx[i] - x) / cw).toFixed(4)), w = ty.map((y, i) => +((my[i] - y) / ch).toFixed(4));
  const lon = Math.max(...u.map(Math.abs), ...w.map(Math.abs)), z = +Math.min(1.25, 1 + 2 * lon).toFixed(3);
  return { muc, fps: OD_FPS, bd0: +bd0.toFixed(3), u, v: w, z };
}
function onDinhTai(c, off) {
  const o = c.onDinh; if (!o || !o.u || !o.u.length) return null;
  const tSrc = c.dao ? c.kt - srcTuTl(c, off) : c.bd + srcTuTl(c, off), f = Math.max(0, Math.min(o.u.length - 1, (tSrc - o.bd0) * o.fps)), i = Math.floor(f), j = Math.min(o.u.length - 1, i + 1), p = f - i;
  return { u: o.u[i] + (o.u[j] - o.u[i]) * p, v: o.v[i] + (o.v[j] - o.v[i]) * p, z: o.z || 1 };
}
/* áp khi vẽ: trong lúc apDoanGoc vẽ đoạn có onDinh, x/y/sc của chính đoạn đó cộng phần bù (chỉ khi vẽ, thuộc tính lưu không đổi) */
let OD_DANG = null;
{ const g0 = giaTriKf; giaTriKf = function (c, ten, off) { const v = g0.apply(this, arguments); const o = OD_DANG; if (!o || o.c !== c || !(ten === 'x' || ten === 'y' || ten === 'sc')) return v;
    if (ten === 'sc') return v * o.b.z; const sc = g0.call(this, c, 'sc', off) * o.b.z; return v + (ten === 'x' ? o.b.u * o.hop.w : o.b.v * o.hop.h) * sc; }; }
{ const goc = apDoanGoc; apDoanGoc = function (ctx, W, H, c, off, ve) {
    const b = c && c.onDinh && !c.onDinh.tat ? onDinhTai(c, off) : null; if (!b) return goc.apply(this, arguments);
    const cu = OD_DANG; OD_DANG = { c, b, hop: hopMuc(P.clips.includes(c) ? 'v' : 'b', c) }; try { return goc.apply(this, arguments); } finally { OD_DANG = cu; }
  }; }
function veOnDinh(box, k, c) {
  const n = el('div', 'nhom2 odNhom'); n.appendChild(el('b', null, 'Ổn định hình (chống rung)')); box.appendChild(n);
  const s = srcCua(c.src); if (!s || s.loai !== 'video') { n.appendChild(el('div', 'quota', 'Chỉ dùng cho đoạn video.')); return; }
  const o = c.onDinh;
  n.appendChild(el('div', 'quota', o ? '✓ Đã ổn định mức ' + (OD_MUC[o.muc] || o.muc) + (o.tat ? ' (đang tắt)' : '') + ' · phóng ' + Math.round(((o.z || 1) - 1) * 100) + '% để giấu mép.' : 'Máy đo độ rung của cả khung rồi bù lại, khung hơi phóng to để không lộ mép. Quay cầm tay, đi bộ dùng Vừa; chạy, xe máy dùng Mạnh.'));
  const tam = el('div'); oChon(tam, 'Mức', Object.keys(OD_MUC).map(x => [x, OD_MUC[x]]), (o && o.muc) || 'vua', v => { c._odMuc = v; }); [...tam.children].forEach(x => n.appendChild(x));
  const sl = n.querySelector('select'); if (sl) sl.onchange = () => { c._odMuc = sl.value; };
  const r = el('div', 'row'), b = el('button', 'btn nho xanh', o ? 'Phân tích lại' : 'Ổn định'); b.type = 'button'; const tt = el('div', 'quota odTt'); tt.hidden = true;
  b.onclick = async () => {
    if (c._odGiu) { c._odGiu.huy = true; return; } const giu = c._odGiu = {}; b.textContent = 'Huỷ'; tt.hidden = false; tt.textContent = 'Đang đo độ rung… 0%';
    try { const kq = await phanTichOnDinh(c, (sl && sl.value) || c._odMuc || 'vua', p => { tt.textContent = 'Đang đo độ rung… ' + Math.round(p * 100) + '%'; }, giu); luuHoanTac(); c.onDinh = kq; toast('Đã ổn định hình đoạn này'); }
    catch (e) { if (!giu.huy) toast('Chưa ổn định được: ' + (e.message || e)); }
    finally { c._odGiu = null; delete c._odMuc; veProp(); veKhung(); }
  }; r.appendChild(b);
  if (o) { const t = el('button', 'btn nho ghost', o.tat ? 'Bật lại' : 'Tắt thử'); t.type = 'button'; t.onclick = () => { luuHoanTac(); if (o.tat) delete o.tat; else o.tat = true; veProp(); veKhung(); }; r.appendChild(t);
    const x = el('button', 'btn nho ghost', 'Bỏ ổn định'); x.type = 'button'; x.onclick = () => { luuHoanTac(); delete c.onDinh; veProp(); veKhung(); }; r.appendChild(x); }
  n.appendChild(r); n.appendChild(tt);
}
function khoiTao09c() {
  { const goc = veProp; veProp = function () { const r = goc.apply(this, arguments); try { const ch = P.chon, box = $('#propChon'); if (ch && (ch.k === 'v' || ch.k === 'b') && box && !box.querySelector('.odNhom')) { const m = mucChon(); if (m && !m.trong && !(typeof laGhep === 'function' && laGhep(m))) veOnDinh(box, ch.k, m); } } catch (e) { console.warn('onDinh', e); } return r; }; }
  { const goc = moMenu; moMenu = function (x, y, ds) { if (Array.isArray(ds) && ds.some(o => o && o.t === 'Phím tắt')) { const i = ds.findIndex(o => o && o.t === 'Phím tắt'); ds = [...ds.slice(0, i), { ic: 'target', t: 'Làm mờ / che một vùng', f: () => setTimeout(() => themVungMo('mo'), 30) }, ...ds.slice(i)]; } return goc.call(this, x, y, ds); }; }
}
khoiTao09c();

/* ═════════ ĐỢT 5: thư viện kiểu FilmCraft dễ dùng · tick chọn đoạn để áp · chồng nhiều hiệu ứng · tuỳ chỉnh bộ lọc / hiệu ứng · nhạc nền tự tạo ═════════ */
const HU_TOI_DA = 5;   // số hiệu ứng chồng tối đa trên một đoạn
/* ảnh mẫu cho ô xem trước khi khung hiện tại trống / một màu: trời, mặt trời, đồi, da người */
function anhMauDung() {
  const c = document.createElement('canvas'); c.width = 56; c.height = 56; const g = c.getContext('2d');
  const tr = g.createLinearGradient(0, 0, 0, 34); tr.addColorStop(0, '#3a7bd5'); tr.addColorStop(1, '#f6c27a'); g.fillStyle = tr; g.fillRect(0, 0, 56, 56);
  g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(40, 16, 6, 0, 7); g.fill();
  g.fillStyle = '#2f7d4a'; g.beginPath(); g.moveTo(0, 38); g.quadraticCurveTo(20, 26, 56, 36); g.lineTo(56, 56); g.lineTo(0, 56); g.fill();
  g.fillStyle = '#d9a37a'; g.beginPath(); g.arc(18, 40, 9, 0, 7); g.fill(); g.fillStyle = '#3b2a20'; g.beginPath(); g.arc(18, 35, 8, Math.PI, 0); g.fill();
  return g.getImageData(0, 0, 56, 56);
}
{ const goc = anhMauKho; anhMauKho = function () { let d = null; try { d = goc.apply(this, arguments); } catch { } if (!d) return anhMauDung(); let mn = 1e9, mx = -1, trong = 0; for (let i = 0; i < d.data.length; i += 16) { const v = d.data[i] + d.data[i + 1] + d.data[i + 2]; if (v < mn) mn = v; if (v > mx) mx = v; if (d.data[i + 3] < 20) trong++; } return mx - mn < 60 || trong > d.data.length / 32 ? anhMauDung() : d; }; }

/* ── tick chọn đoạn để áp (chung cho Hiệu ứng, Bộ lọc, Chuyển cảnh) ── */
P.tick = []; P.tickTay = false;
function dsTick() { P.tick = P.tick.filter(c => P.clips.includes(c)); return P.tick; }
function dongBoTickAp() { const ch = P.chon; if (P.tickTay) return; P.tick = ch && ch.k === 'v' && P.clips[ch.i] ? [P.clips[ch.i]] : []; }
/* mục sẽ nhận: lớp phủ đang chọn > các đoạn đã tick > (không tick gì) mọi đoạn */
function dsApDung() { const ch = P.chon; if (ch && ch.k === 'b' && P.broll[ch.i]) return [P.broll[ch.i]]; const t = dsTick(); return t.length ? t : P.clips.slice(); }
function mucMau() { const ds = dsApDung(); return ds[0] || null; }
function veThanhTick(hop, loai) {
  const noi = hop.querySelector(':scope > .noi') || hop; let bar = hop.querySelector('.tickBar'); if (bar && bar.parentNode !== noi) bar.remove(), bar = null; if (!bar) { bar = el('div', 'tickBar'); noi.insertBefore(bar, noi.firstChild); }
  bar.innerHTML = ''; const ch = P.chon;
  if (ch && ch.k === 'b' && P.broll[ch.i]) { bar.append(el('span', 'nhan', 'Áp cho: lớp phủ đang chọn')); const bo = el('button', 'chip'); bo.type = 'button'; bo.textContent = 'Chọn đoạn V1'; bo.onclick = () => { P.chon = null; veProp(); capNhatTick(); }; bar.append(bo); return; }
  if (!P.clips.length) { bar.append(el('span', 'nhan', 'Thêm footage vào dòng thời gian để áp.')); return; }
  const chon = new Set(dsTick()), n = loai === 'chuyen' ? P.clips.length - 1 : P.clips.length;
  bar.append(el('span', 'nhan', loai === 'chuyen' ? 'Áp cho điểm cắt:' : 'Áp cho đoạn:'));
  const tatCa = el('label', 'chip tat' + (chon.size && [...Array(n).keys()].every(i => chon.has(P.clips[i])) ? ' on' : '')), cbT = el('input'); cbT.type = 'checkbox'; cbT.checked = tatCa.classList.contains('on'); tatCa.append(cbT, el('span', null, 'Tất cả'));
  cbT.onchange = () => { P.tickTay = true; P.tick = cbT.checked ? P.clips.slice(0, n) : []; capNhatTick(); }; bar.append(tatCa);
  for (let i = 0; i < n; i++) { const c = P.clips[i], l = el('label', 'chip' + (chon.has(c) ? ' on' : '')), cb = el('input'); cb.type = 'checkbox'; cb.checked = chon.has(c); l.title = loai === 'chuyen' ? 'Điểm cắt giữa đoạn ' + (i + 1) + ' và ' + (i + 2) : 'Đoạn ' + (i + 1);
    l.append(cb, el('span', null, loai === 'chuyen' ? (i + 1) + '→' + (i + 2) : String(i + 1)));
    cb.onchange = () => { P.tickTay = true; const s = new Set(dsTick()); if (cb.checked) s.add(c); else s.delete(c); P.tick = P.clips.filter(x => s.has(x)); capNhatTick(); }; bar.append(l); }
  if (!chon.size) bar.append(el('span', 'goi', loai === 'chuyen' ? 'Chưa tick: áp cho mọi điểm cắt' : 'Chưa tick: áp cho mọi đoạn'));
}
function capNhatTick() {
  const h = $('[data-pane="hieu"]'), l = $('[data-pane="loc"]'), c = $('[data-pane="chuyen"]');
  try { if (h) { veThanhTick(h, 'hieu'); danhDauHu(); veDangApHu(); } if (l) { veThanhTick(l, 'loc'); danhDauLoc(); veTuyLoc(); } if (c) { veThanhTick(c, 'chuyen'); danhDauChuyen(); veTuyChuyen(); } } catch (e) { console.warn('tick', e); }
}

/* ── chồng hiệu ứng: c.huDs = [{id, muc, toc, p}] ; c.hu2 / c.huMuc / c.huP luôn là phần tử đầu để code cũ (kéo thả, trợ lý, xuất) vẫn đúng ──
   Hiệu ứng cơ bản (rung, nhịp…) không phải shader: tối đa một cái và luôn đứng đầu. */
const laHuShader = id => String(id || '').startsWith('kho:'), huDef = id => KHO_OK ? KHO.hieuUng.find(x => 'kho:' + x.id === id) : null;
function huDsCua(c) { if (Array.isArray(c.huDs) && c.huDs.length) { if (!c.hu2 || c.hu2 === 'khong') return []; if (c.huDs[0].id !== c.hu2) return [{ id: c.hu2, muc: c.huMuc == null ? 1 : c.huMuc, toc: 1, p: c.huP || {} }, ...c.huDs.slice(1).filter(e => e.id !== c.hu2)]; return c.huDs; }   /* hu2 bị đổi ở chỗ khác (ô chọn trong Thuộc tính, trợ lý) thì hu2 làm đầu chồng */ return c.hu2 && c.hu2 !== 'khong' ? [{ id: c.hu2, muc: c.huMuc == null ? 1 : c.huMuc, toc: 1, p: c.huP || {} }] : []; }
function ganHuDs(c, ds) {
  ds = ds.slice(0, HU_TOI_DA); const co = ds.findIndex(e => !laHuShader(e.id)); if (co > 0) ds.unshift(ds.splice(co, 1)[0]);
  if (!ds.length) { ['huDs', 'huMuc', 'huP'].forEach(k => delete c[k]); c.hu2 = 'khong'; return; }
  c.huDs = ds; c.hu2 = ds[0].id; c.huMuc = ds[0].muc; if (Object.keys(ds[0].p || {}).length) c.huP = ds[0].p; else delete c.huP;
}
{ const g0 = laHuKho; laHuKho = function (c) { return g0.apply(this, arguments) || !!(c && Array.isArray(c.huDs) && c.huDs.some(e => laHuShader(e.id))); }; }
{ const goc = apHuKho; apHuKho = function (c, s, im, off) {
    if (!c || !Array.isArray(c.huDs) || !c.huDs.length) return goc.apply(this, arguments);
    let r = [s, im]; huDsCua(c).forEach((e, i) => { if (!laHuShader(e.id)) return; const o = i === 0 ? c : { hu2: e.id, huMuc: e.muc, huP: e.p }; r = goc.call(this, o, r[0], r[1], (off || 0) * (e.toc || 1)); }); return r;
  }; }
/* bấm thẻ hiệu ứng: chưa có thì tick thêm vào chồng, có rồi thì bỏ; "Không" xoá hết */
apHieuUngKho = function (k) {
  const ds = dsApDung(); if (!ds.length || !ds[0]) { toast('Chưa có đoạn nào'); return; } luuHoanTac();
  if (k === 'khong') { ds.forEach(c => ganHuDs(c, [])); toast('Đã bỏ mọi hiệu ứng của ' + ds.length + ' đoạn'); }
  else { const dang = huDsCua(ds[0]).some(e => e.id === k);
    if (!dang) P.huMo = k; ds.forEach(c => { let cur = huDsCua(c).map(e => ({ ...e })); if (dang) cur = cur.filter(e => e.id !== k); else if (!cur.some(e => e.id === k)) { if (!laHuShader(k)) cur = cur.filter(e => laHuShader(e.id)); cur.push({ id: k, muc: 1, toc: 1, p: {} }); } ganHuDs(c, cur); });
    const n = huDsCua(ds[0]).length; toast((dang ? 'Bỏ “' : 'Thêm “') + HIEU_UNG[k] + '” · ' + ds.length + ' đoạn' + (n > 1 ? ' · đang chồng ' + n + ' hiệu ứng' : '') + (!dang && n >= HU_TOI_DA ? ' (tối đa ' + HU_TOI_DA + ')' : '')); }
  veTl(); veKhung(); veProp(); capNhatTick();
};
function danhDauHu() { const m = mucMau(), ds = m ? huDsCua(m).map(e => e.id) : []; $$('#huLuoi > button').forEach(b => { const k = b.dataset.k, i = ds.indexOf(k); b.classList.toggle('daTick', i >= 0 || (k === 'khong' && !ds.length)); b.dataset.thuTu = i >= 0 && ds.length > 1 ? String(i + 1) : ''; }); }
/* bảng "Đang áp": chỉnh cường độ, tốc độ, tham số riêng từng hiệu ứng; đổi thứ tự; bỏ */
function veDangApHu() {
  const pane = $('[data-pane="hieu"]'), luoi = $('#huLuoi'); if (!pane || !luoi) return; let h = pane.querySelector('.dangAp'); if (!h) { h = el('div', 'dangAp'); luoi.before(h); }
  h.innerHTML = ''; const m = mucMau(), ds = m ? huDsCua(m) : []; if (!ds.length) { h.hidden = true; return; } h.hidden = false; const moId = P.huMo === '' ? '' : ds.some(e => e.id === P.huMo) ? P.huMo : ds[ds.length - 1].id;
  const dau = el('div', 'dau'); dau.append(el('b', null, 'Đang áp (' + ds.length + ')'), el('small', null, 'Hiệu ứng trên áp sau, chồng lên hiệu ứng dưới')); h.append(dau);
  const ganTat = (id, f) => { luuHoanTac(); dsApDung().forEach(c => { const cur = huDsCua(c).map(e => ({ ...e, p: { ...(e.p || {}) } })); const e = cur.find(x => x.id === id); if (e) { f(e, cur); ganHuDs(c, cur); } }); veKhung(); };
  ds.forEach((e, i) => {
    const def = huDef(e.id), the = el('div', 'muc'), hang = el('div', 'hang1'), mo = e.id === moId, ten = el('button', 'ten'); ten.type = 'button'; ten.textContent = (mo ? '▾ ' : '▸ ') + (def ? def.ic + ' ' : '') + (HIEU_UNG[e.id] || e.id); ten.title = mo ? 'Thu gọn' : 'Mở để chỉnh'; ten.onclick = () => { P.huMo = mo ? '' : e.id; veDangApHu(); }; hang.append(ten);
    const len = el('button', 'nut'); len.type = 'button'; len.textContent = '↑'; len.title = 'Đưa lên trước'; len.disabled = i === 0 || !laHuShader(e.id) || !laHuShader(ds[i - 1].id); len.onclick = () => { ganTat(e.id, (x, cur) => { const j = cur.indexOf(x); if (j > 0) { cur.splice(j, 1); cur.splice(j - 1, 0, x); } }); capNhatTick(); };
    const bo = el('button', 'nut'); bo.type = 'button'; bo.textContent = '✕'; bo.title = 'Bỏ hiệu ứng này'; bo.onclick = () => apHieuUngKho(e.id); hang.append(len, bo); the.append(hang); if (!mo) { h.append(the); return; }
    const truot = (nhan, min, max, buoc, gt, dv, f) => { const l = el('label', 'tr'); l.append(el('span', null, nhan)); const r = el('input'); r.type = 'range'; r.min = min; r.max = max; r.step = buoc; r.value = gt; const o = el('output'), viet = () => { o.textContent = dv === '%' ? Math.round(+r.value * 100) + '%' : dv === 'x' ? (+r.value).toFixed(2).replace('.', ',') + '×' : Math.round(+r.value * 100) / 100 + (dv || ''); }; viet(); let luu = false;
      r.oninput = () => { if (!luu) { luuHoanTac(); luu = true; } viet(); dsApDung().forEach(c => { const cur = huDsCua(c).map(z => ({ ...z, p: { ...(z.p || {}) } })); const z = cur.find(q => q.id === e.id); if (z) { f(z, +r.value); ganHuDs(c, cur); } }); veKhung(); }; r.onchange = () => { luu = false; veTl(); };
      l.append(r, o); the.append(l); };
    truot('Cường độ', 0, 1.5, 0.01, e.muc == null ? 1 : e.muc, '%', (z, v) => { z.muc = v; });
    if (laHuShader(e.id)) truot('Tốc độ', 0.25, 3, 0.05, e.toc || 1, 'x', (z, v) => { z.toc = v; });
    (def && def.ts || []).forEach(([k, nhan, min, max, buoc, md, dv]) => truot(nhan, min, max, buoc, (e.p || {})[k] != null ? e.p[k] : md, dv === '%' ? '%' : dv, (z, v) => { z.p = { ...(z.p || {}), [k]: v }; }));
    h.append(the);
  });
}

/* ── bộ lọc: tick chọn đoạn + tuỳ chỉnh từng thông số (sinh LUT riêng 'tuy:<gốc>:<json>') ── */
const TUY_LOC = [['sang', 'Độ sáng', -0.3, 0.3, 0.01], ['tp', 'Tương phản', -0.5, 0.6, 0.01], ['nhiet', 'Nhiệt độ', -1, 1, 0.02], ['tint', 'Sắc xanh ↔ hồng', -1, 1, 0.02], ['bh', 'Bão hoà', -1, 1, 0.02], ['vib', 'Độ rực', -0.5, 1, 0.02], ['phai', 'Phai', 0, 0.4, 0.01], ['mono', 'Đen trắng', 0, 1, 0.02]];
function locGoc(c) { const l = String(c.lut || ''); if (l.startsWith('tuy:')) return l.split(':')[1] || ''; return l.startsWith('kho:') ? l.slice(4) : ''; }
function thamSoTuy(goc, d) { const b = goc && KHO_OK ? (KHO.boLoc.find(x => x.id === goc) || {}).p || {} : {}, p = JSON.parse(JSON.stringify(b));
  Object.keys(d || {}).forEach(k => { const v = +d[k]; if (!v) return; if (k === 'bh') p.bh = (p.bh == null ? 1 : p.bh) * (1 + v); else p[k] = (p[k] || 0) + v; }); return p; }
function dangKyLutTuy(id) { if (P.luts[id]) return P.luts[id]; const m = /^tuy:([^:]*):(.*)$/.exec(id); if (!m) return null; let d = {}; try { d = JSON.parse(m[2]); } catch { return null; } const ten = m[1] ? ((KHO.boLoc.find(x => x.id === m[1]) || {}).ten || m[1]) : 'Chỉnh tay';
  const lut = taoLutKho({ id: 'tuy', ten, p: thamSoTuy(m[1], d) }); lut.id = id; lut.ten = ten + ' (tuỳ chỉnh)'; return (P.luts[id] = lut); }
{ const g1 = chinhMau; chinhMau = function (c) { if (c && typeof c.lut === 'string' && c.lut.startsWith('tuy:') && !P.luts[c.lut]) dangKyLutTuy(c.lut); return g1.apply(this, arguments); };
  const g2 = coChinhMau; coChinhMau = function (c) { if (c && typeof c.lut === 'string' && c.lut.startsWith('tuy:') && !P.luts[c.lut]) dangKyLutTuy(c.lut); return g2.apply(this, arguments); }; }
function donLutTuy() { const dung = new Set([...P.clips, ...P.broll].map(c => c.lut)); Object.keys(P.luts || {}).forEach(id => { if (id.startsWith('tuy:') && !dung.has(id)) { delete P.luts[id]; if (typeof MAU_GL === 'object' && MAU_GL.luts && MAU_GL.luts[id]) { try { MAU_GL.gl && MAU_GL.gl.deleteTexture(MAU_GL.luts[id]); } catch { } delete MAU_GL.luts[id]; } } }); }
function apLutTuy(c) { const goc = c.locGoc != null ? c.locGoc : locGoc(c), d = c.locTuy || {}, co = Object.keys(d).some(k => +d[k]); if (!co) { if (goc) { dangKyLutKho(goc); c.lut = 'kho:' + goc; } else delete c.lut; return; } const sach = {}; Object.keys(d).sort().forEach(k => { if (+d[k]) sach[k] = +(+d[k]).toFixed(3); }); const id = 'tuy:' + goc + ':' + JSON.stringify(sach); dangKyLutTuy(id); c.lut = id; }
apLutChon = function (id) {
  const ds = dsApDung(); if (!ds.length) { toast('Chưa có đoạn nào'); return; } luuHoanTac(); const mu = $('#locMucChung') ? +$('#locMucChung').value : 1;
  ds.forEach(c => { if (id) { c.lut = id; if (c.lutMuc == null) c.lutMuc = mu; c.locGoc = String(id).startsWith('kho:') ? id.slice(4) : ''; if (c.locTuy && Object.keys(c.locTuy).length && String(id).startsWith('kho:')) apLutTuy(c); } else { delete c.lut; delete c.locGoc; delete c.locTuy; } });
  donLutTuy(); veTl(); veKhung(); veProp(); capNhatTick(); toast(id ? 'Áp “' + ((P.luts[id] || {}).ten || id) + '” cho ' + ds.length + (P.chon && P.chon.k === 'b' ? ' lớp phủ' : ' đoạn') : 'Bỏ bộ lọc');
};
function danhDauLoc() { const m = mucMau(), g = m ? locGoc(m) : ''; $$('#khoLocLuoi > button').forEach(b => b.classList.toggle('daTick', !!g && b.dataset.kho === g)); $$('#locLuoi > button, #lutLuoi > button').forEach(b => b.classList.toggle('daTick', !!m && !!m.lut && (b.dataset.id === m.lut || b.dataset.k === m.lut))); }
function veTuyLoc() {
  const pane = $('[data-pane="loc"]'); if (!pane) return; let h = pane.querySelector('.tuyLoc'); const neo = $('#khoLocLuoi') || $('#locLuoi'); if (!h) { h = el('div', 'dangAp tuyLoc'); if (neo) neo.before(h); else pane.append(h); }
  h.innerHTML = ''; const m = mucMau(); if (!m || !m.lut) { h.hidden = true; return; } h.hidden = false;
  const goc = locGoc(m), ten = goc ? ((KHO.boLoc.find(x => x.id === goc) || {}).ten || goc) : ((P.luts[m.lut] || {}).ten || 'LUT');
  const dau = el('div', 'dau'); dau.append(el('b', null, 'Đang áp: ' + ten)); const bo = el('button', 'nut'); bo.type = 'button'; bo.textContent = 'Bỏ'; bo.onclick = () => apLutChon(''); dau.append(bo); h.append(dau);
  const ds = () => dsApDung().filter(c => c.lut);
  const truot = (nhan, min, max, buoc, gt, viet, f) => { const l = el('label', 'tr'); l.append(el('span', null, nhan)); const r = el('input'); r.type = 'range'; r.min = min; r.max = max; r.step = buoc; r.value = gt; const o = el('output'); o.textContent = viet(+r.value); let luu = false;
    r.oninput = () => { if (!luu) { luuHoanTac(); luu = true; } o.textContent = viet(+r.value); ds().forEach(c => f(c, +r.value)); veKhung(); }; r.onchange = () => { luu = false; donLutTuy(); veTl(); }; l.append(r, o); h.append(l); };
  truot('Cường độ', 0, 1, 0.01, m.lutMuc == null ? 1 : m.lutMuc, v => Math.round(v * 100) + '%', (c, v) => { c.lutMuc = v; });
  if (String(m.lut).startsWith('kho:') || String(m.lut).startsWith('tuy:')) {
    h.append(el('small', 'ghiTuy', 'Tuỳ chỉnh thêm trên nền bộ lọc này:'));
    TUY_LOC.forEach(([k, nhan, min, max, buoc]) => truot(nhan, min, max, buoc, (m.locTuy || {})[k] || 0, v => (v > 0 ? '+' : '') + Math.round(v * 100), (c, v) => { c.locTuy = { ...(c.locTuy || {}), [k]: v }; if (!v) delete c.locTuy[k]; if (c.locGoc == null) c.locGoc = locGoc(c); apLutTuy(c); }));
    const dl = el('button', 'nut rong'); dl.type = 'button'; dl.textContent = 'Đặt lại tuỳ chỉnh'; dl.onclick = () => { luuHoanTac(); ds().forEach(c => { delete c.locTuy; apLutTuy(c); }); donLutTuy(); veKhung(); capNhatTick(); }; h.append(dl);
  }
}

/* ── chuyển cảnh: áp cho các điểm cắt đã tick, ngẫu nhiên, thời lượng ── */
datChuyen = function (k) {
  if (P.clips.length < 2) { toast('Cần ít nhất 2 đoạn trên V1'); return; }
  let ds = dsTick().filter(c => P.clips.indexOf(c) < P.clips.length - 1);
  if (!ds.length) { let i = P.chon && P.chon.k === 'v' ? P.chon.i : -1; if (i < 0 || i >= P.clips.length - 1) { let acc = 0, gan = 1e9; P.clips.forEach((c, j) => { acc += daiC(c); if (j < P.clips.length - 1 && Math.abs(acc - P.t) < gan) { gan = Math.abs(acc - P.t); i = j; } }); } ds = [P.clips[i]]; }
  luuHoanTac(); const dai = +$('#chuyenDai').value; ds.forEach(c => { if (k === 'cat') { delete c.chuyen; delete c.chuyen_dai; } else { c.chuyen = k; c.chuyen_dai = dai; } }); if (k !== 'cat') gltNap(); veTl(); veKhung(); capNhatTick();
  toast((k === 'cat' ? 'Bỏ chuyển cảnh ở ' : 'Chuyển cảnh “' + CHUYEN_TEN[k] + '” cho ') + ds.length + ' điểm cắt');
};
function danhDauChuyen() { const t = dsTick(), m = t.find(c => P.clips.indexOf(c) < P.clips.length - 1) || (P.chon && P.chon.k === 'v' ? P.clips[P.chon.i] : null), k = m ? (m.chuyen || 'cat') : null; $$('#chuyenLuoi > button').forEach(b => { b.classList.toggle('daTick', b.dataset.k === k); b.setAttribute('aria-pressed', String(b.dataset.k === k)); }); }
function veTuyChuyen() {
  const pane = $('[data-pane="chuyen"]'), luoi = $('#chuyenLuoi'); if (!pane || !luoi) return; let h = pane.querySelector('.tuyChuyen'); if (!h) { h = el('div', 'dangAp tuyChuyen'); luoi.before(h); } h.innerHTML = '';
  const r = el('div', 'hang1'); const ng = el('button', 'nut rong'); ng.type = 'button'; ng.textContent = '🎲 Ngẫu nhiên cho điểm cắt đã tick'; ng.title = 'Mỗi điểm cắt một chuyển cảnh khác nhau';
  ng.onclick = () => { let ds = dsTick().filter(c => P.clips.indexOf(c) < P.clips.length - 1); if (!ds.length) ds = P.clips.slice(0, -1); if (!ds.length) { toast('Cần ít nhất 2 đoạn'); return; } const ten = Object.keys(CHUYEN_TEN).filter(k => k !== 'cat'); luuHoanTac(); let truoc = ''; ds.forEach(c => { let k; do { k = ten[Math.floor(Math.random() * ten.length)]; } while (k === truoc && ten.length > 1); truoc = k; c.chuyen = k; c.chuyen_dai = +$('#chuyenDai').value; }); gltNap(); veTl(); veKhung(); capNhatTick(); toast('Đã đặt ngẫu nhiên cho ' + ds.length + ' điểm cắt'); };
  const bo = el('button', 'nut'); bo.type = 'button'; bo.textContent = 'Bỏ hết'; bo.onclick = () => datChuyen('cat'); r.append(ng, bo); h.append(r);
}
/* ô xem trước chuyển cảnh: vẽ khung giữa chừng (A → B) bằng chính shader */
function anhAB(chu, m1, m2) { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, m1); gr.addColorStop(1, m2); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '800 34px Inter,system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(chu, 32, 34); return c; }
let anhChuyen = null;
function veAnhChuyen() {
  const luoi = $('#chuyenLuoi'); if (!luoi || !GLT.json) return; anhChuyen = anhChuyen || [anhAB('A', '#ff7a59', '#ffcc4d'), anhAB('B', '#3b82f6', '#22d3df')];
  $$('#chuyenLuoi > button').forEach(b => { const k = b.dataset.k, the = b.querySelector('.the'); if (!the || the.dataset.anh || !GLT_MAP[k]) return; try { const cv2 = gltVe(k, anhChuyen[0], anhChuyen[1], 0.5, 64, 64); if (!cv2) return; const o = document.createElement('canvas'); o.width = 64; o.height = 64; o.getContext('2d').drawImage(cv2, 0, 0); o.className = 'anhCC'; the.dataset.anh = 1; the.innerHTML = ''; the.append(o); } catch { } });
}
function danhDauMoi() { const moi = new Set(KHO_OK ? [...KHO.chuyenCanh.filter(x => x.fc).map(x => x.id), ...KHO.hieuUng.filter(x => x.fc).map(x => 'kho:' + x.id)] : []), moiLoc = new Set(KHO_OK ? KHO.boLoc.filter(x => x.fc).map(x => x.id) : []);
  $$('#chuyenLuoi > button, #huLuoi > button').forEach(b => b.classList.toggle('moi', moi.has(b.dataset.k))); $$('#khoLocLuoi > button').forEach(b => b.classList.toggle('moi', moiLoc.has(b.dataset.kho))); }

/* ── nhạc nền tự tạo: tổng hợp ngay trên máy (hợp âm, bass, trống, giai điệu), không bản quyền ── */
const NHAC_TU = {
  vui: { ten: 'Vui tươi', bpm: 118, khoa: 0, thu: 'truong', vong: [0, 5, 3, 4], trong: 'pop', giai: 'pluck' },
  chill: { ten: 'Chill lofi', bpm: 80, khoa: 5, thu: 'truong', vong: [0, 5, 1, 4], trong: 'lofi', giai: 'ep', bay: 1 },
  dien_anh: { ten: 'Điện ảnh', bpm: 70, khoa: 2, thu: 'thu', vong: [0, 5, 2, 6], trong: 'dien_anh', giai: 'pad' },
  nang_dong: { ten: 'Năng động', bpm: 126, khoa: 9, thu: 'thu', vong: [0, 5, 2, 6], trong: 'edm', giai: 'arp' },
  hoi_hop: { ten: 'Hồi hộp', bpm: 92, khoa: 4, thu: 'thu', vong: [0, 0, 5, 4], trong: 'hoi_hop', giai: 'ost' },
  doanh_nghiep: { ten: 'Doanh nghiệp', bpm: 104, khoa: 7, thu: 'truong', vong: [0, 4, 5, 3], trong: 'clap', giai: 'marimba' },
  hiphop: { ten: 'Hip-hop', bpm: 88, khoa: 1, thu: 'thu', vong: [0, 5, 3, 4], trong: 'boombap', giai: 'ep' }
};
const THANG = { truong: [0, 2, 4, 5, 7, 9, 11], thu: [0, 2, 3, 5, 7, 8, 10] };
function soNgau(h) { let x = h >>> 0 || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; }
async function taoNhacTu(kieu, giay, giong) {
  const m = NHAC_TU[kieu] || NHAC_TU.vui, sr = 44100, o = new OfflineAudioContext(2, Math.ceil(sr * giay), sr), rnd = soNgau(giong || 7), nhip = 60 / m.bpm, o4 = nhip * 4, soO = Math.ceil(giay / o4);
  const nen = o.createDynamicsCompressor(); nen.threshold.value = -16; nen.ratio.value = 3; nen.attack.value = 0.01; nen.release.value = 0.2; const tong = o.createGain(); tong.gain.setValueAtTime(0, 0); tong.gain.linearRampToValueAtTime(0.9, 0.8); tong.gain.setValueAtTime(0.9, Math.max(1, giay - 2.5)); tong.gain.linearRampToValueAtTime(0, giay); nen.connect(tong); tong.connect(o.destination);
  const bus = o.createGain(); bus.connect(nen); const tre = o.createDelay(1); tre.delayTime.value = nhip * 0.75; const hoi = o.createGain(); hoi.gain.value = 0.22; const vang = o.createGain(); vang.gain.value = 0.18; bus.connect(tre); tre.connect(hoi); hoi.connect(tre); hoi.connect(vang); vang.connect(nen);
  const nb = o.createBuffer(1, sr, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const hz = n => 440 * Math.pow(2, (n - 69) / 12), tl = THANG[m.thu], goc = 48 + m.khoa;
  const not = (bac, qd) => { const b = ((bac % 7) + 7) % 7; return goc + tl[b] + 12 * Math.floor(bac / 7) + 12 * (qd || 0); };
  const env = (g, t, a, d, dinh) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(dinh, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const ton = (f, t, dai, kieuSong, dinh, a, loc, ra) => { if (t >= giay) return; const s = o.createOscillator(); s.type = kieuSong; s.frequency.value = f; const g = o.createGain(); env(g, t, a || 0.005, dai, dinh); let cuoi = s; if (loc) { const fl = o.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = loc; s.connect(fl); cuoi = fl; } cuoi.connect(g); g.connect(ra || bus); s.start(t); s.stop(Math.min(giay, t + (a || 0.005) + dai + 0.05)); };
  const on = (t, dai, kieuLoc, f, q, dinh, ra) => { if (t >= giay) return; const s = o.createBufferSource(); s.buffer = nb; const fl = o.createBiquadFilter(); fl.type = kieuLoc; fl.frequency.value = f; fl.Q.value = q || 1; const g = o.createGain(); env(g, t, 0.002, dai, dinh); s.connect(fl); fl.connect(g); g.connect(ra || nen); s.start(t, rnd() * 0.5); s.stop(Math.min(giay, t + dai + 0.05)); };
  const kick = (t, dinh) => { if (t >= giay) return; const s = o.createOscillator(); s.frequency.setValueAtTime(150, t); s.frequency.exponentialRampToValueAtTime(42, t + 0.12); const g = o.createGain(); env(g, t, 0.002, 0.32, dinh || 0.9); s.connect(g); g.connect(nen); s.start(t); s.stop(Math.min(giay, t + 0.4)); };
  const snare = (t, dinh) => { on(t, 0.16, 'bandpass', 1800, 0.8, (dinh || 0.5)); ton(185, t, 0.08, 'triangle', 0.25 * (dinh || 0.5) / 0.5, 0.002, 0, nen); };
  const hat = (t, mo, dinh) => on(t, mo ? 0.22 : 0.04, 'highpass', 7500, 0.7, dinh || 0.18);
  const clap = t => { [0, 0.012, 0.025].forEach(d => on(t + d, 0.09, 'bandpass', 1300, 1.2, 0.35)); };
  const giaiNhip = Array.from({ length: 8 }, () => rnd());
  for (let b = 0; b < soO; b++) {
    const t0 = b * o4, bac = m.vong[b % m.vong.length], dau = b < 2, cuoi = b >= soO - 1, ch = [bac, bac + 2, bac + 4, bac + 6];
    // hợp âm (pad): hai lớp sóng răng cưa lệch nhẹ qua lọc thấp
    ch.slice(0, m.giai === 'pad' || m.trong === 'lofi' || m.giai === 'ep' ? 4 : 3).forEach(n => [-4, 4].forEach(lech => { const s = o.createOscillator(); s.type = m.giai === 'ep' ? 'sine' : 'sawtooth'; s.frequency.value = hz(not(n, 1)); s.detune.value = lech; const fl = o.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = m.giai === 'pad' ? 900 : 1500; const g = o.createGain(); const dinh = m.giai === 'ep' ? 0.05 : 0.035; g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(dinh, t0 + (m.giai === 'pad' ? 0.8 : 0.08)); g.gain.setValueAtTime(dinh, t0 + o4 - 0.15); g.gain.linearRampToValueAtTime(0.0001, t0 + o4 + 0.25);
      if (m.trong === 'edm') for (let q = 0; q < 4; q++) { const tq = t0 + q * nhip; g.gain.setValueAtTime(dinh * 0.25, tq); g.gain.linearRampToValueAtTime(dinh, tq + nhip * 0.6); }
      s.connect(fl); fl.connect(g); g.connect(bus); s.start(t0); s.stop(Math.min(giay, t0 + o4 + 0.3)); }));
    // bass
    if (!dau || m.trong === 'dien_anh') { const nb2 = hz(not(bac, -1)); if (m.trong === 'edm') for (let q = 0; q < 8; q++) ton(nb2, t0 + q * nhip / 2 + nhip / 4, nhip * 0.35, 'sawtooth', 0.16, 0.005, 400, nen); else if (m.giai === 'ost') for (let q = 0; q < 16; q++) ton(nb2 * (q % 4 === 3 ? 1.5 : 1), t0 + q * nhip / 4, nhip * 0.2, 'sawtooth', 0.12, 0.003, 700, nen); else [0, 2].concat(m.trong === 'pop' || m.trong === 'clap' ? [2.5, 3] : m.trong === 'boombap' ? [1.5] : []).forEach(q => ton(nb2, t0 + q * nhip, nhip * (m.trong === 'dien_anh' ? 3.5 : 0.9), m.trong === 'dien_anh' ? 'sine' : 'triangle', 0.32, 0.01, 0, nen)); }
    // trống
    if (!dau && !cuoi) for (let q = 0; q < 4; q++) { const tq = t0 + q * nhip, lech = m.bay ? nhip * 0.08 : 0;
      if (m.trong === 'edm') { kick(tq); hat(tq + nhip / 2, true, 0.12); if (q % 2) clap(tq); }
      else if (m.trong === 'pop') { if (q % 2 === 0) kick(tq); else snare(tq); hat(tq, false); hat(tq + nhip / 2, false, 0.12); }
      else if (m.trong === 'lofi') { if (q === 0 || (q === 2 && rnd() < 0.7)) kick(tq, 0.7); if (q % 2) snare(tq, 0.35); hat(tq, false, 0.1); hat(tq + nhip / 2 + lech, false, 0.07); }
      else if (m.trong === 'boombap') { if (q === 0 || q === 2) kick(tq); if (q === 2) kick(tq + nhip * 0.75, 0.6); if (q % 2) snare(tq, 0.6); hat(tq, false, 0.12); hat(tq + nhip / 2 + nhip * 0.06, false, 0.08); }
      else if (m.trong === 'clap') { if (q % 2 === 0) kick(tq, 0.7); else clap(tq); hat(tq + nhip / 2, false, 0.1); }
      else if (m.trong === 'hoi_hop') { if (q === 0 || q === 1) kick(tq + (q ? 0.18 : 0), 0.75); hat(tq + nhip / 2, false, 0.06); }
      else if (m.trong === 'dien_anh' && q === 0 && b % 2 === 0) { kick(tq, 1); on(tq, 1.2, 'lowpass', 300, 0.7, 0.35); } }
    // giai điệu / rải hợp âm
    if (!dau && !cuoi) { const buoc = m.giai === 'arp' ? 8 : m.giai === 'pad' || m.giai === 'ost' ? 0 : 8;
      for (let q = 0; q < buoc; q++) { if (m.giai !== 'arp' && giaiNhip[q] < 0.45) continue; const n = m.giai === 'arp' ? ch[[0, 1, 2, 1, 3, 2, 1, 2][q]] : ch[Math.floor(giaiNhip[(q + b) % 8] * 3)] + (q % 4 === 0 ? 7 : 0); const tq = t0 + q * nhip / 2;
        if (m.giai === 'marimba') ton(hz(not(n, 2)), tq, 0.25, 'sine', 0.14, 0.002, 0, bus); else if (m.giai === 'ep') ton(hz(not(n, 2)), tq, 0.6, 'triangle', 0.08, 0.01, 2200, bus); else ton(hz(not(n, 2)), tq, m.giai === 'arp' ? 0.16 : 0.3, m.giai === 'arp' ? 'sawtooth' : 'triangle', m.giai === 'arp' ? 0.07 : 0.12, 0.003, m.giai === 'arp' ? 2600 : 3200, bus); } }
    if (m.trong === 'lofi' || m.bay) on(t0, o4, 'highpass', 4000, 0.5, 0.012);   // tiếng xè đĩa than nhẹ
  }
  return o.startRendering();
}
let nhacThu = null;
function veNhacTu() {
  const pane = $('[data-pane="am"]'); if (!pane || pane.querySelector('.nhacTu')) return; const h3 = [...pane.querySelectorAll('h3.pt')].find(x => x.textContent.trim() === 'Nhạc nền'); if (!h3) return;
  const box = el('section', 'nhacTu'); box.append(el('h3', 'pt', 'Nhạc tự tạo (không bản quyền)'), el('div', 'quota', 'Máy tự soạn nhạc nền theo không khí bạn chọn. Không cần mạng, đăng TikTok không lo bản quyền. Bấm “Bài khác” để nghe phiên bản mới.'));
  const chip = el('div', 'chipNhac'); let kieu = 'vui', hat = 1 + Math.floor(Math.random() * 1e6), buf = null;
  Object.entries(NHAC_TU).forEach(([k, m]) => { const b = el('button', 'chip' + (k === kieu ? ' on' : '')); b.type = 'button'; b.textContent = m.ten; b.onclick = () => { kieu = k; buf = null; dungThu(); chip.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); }; chip.append(b); }); box.append(chip);
  const l = el('label'); l.append(el('span', null, 'Độ dài')); const sl = el('select'); [['auto', 'Bằng video'], ['15', '15 giây'], ['30', '30 giây'], ['60', '60 giây'], ['90', '90 giây']].forEach(([v, t]) => { const op = el('option', null, t); op.value = v; sl.append(op); }); sl.onchange = () => { buf = null; dungThu(); }; l.append(sl); box.append(l);
  const r = el('div', 'row'), nghe = el('button', 'btn nho', '▶ Nghe thử'), khac = el('button', 'btn nho ghost', '🎲 Bài khác'), dat = el('button', 'btn nho xanh', 'Đặt làm nhạc nền'), tt = el('div', 'quota'); [nghe, khac, dat].forEach(b => { b.type = 'button'; r.append(b); }); box.append(r, tt);
  const dai = () => sl.value === 'auto' ? Math.max(10, Math.min(180, Math.ceil(tongGiay() || 30))) : +sl.value;
  const tao = async () => { if (buf && buf._k === kieu + ':' + hat + ':' + dai()) return buf; tt.textContent = 'Đang soạn nhạc…'; const t0 = performance.now(); buf = await taoNhacTu(kieu, dai(), hat); buf._k = kieu + ':' + hat + ':' + dai(); tt.textContent = NHAC_TU[kieu].ten + ' · ' + NHAC_TU[kieu].bpm + ' BPM · ' + Math.round(dai()) + ' giây (soạn trong ' + ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',') + 's)'; return buf; };
  function dungThu() { if (nhacThu) { try { nhacThu.stop(); } catch { } nhacThu = null; } nghe.textContent = '▶ Nghe thử'; }
  nghe.onclick = async () => { if (nhacThu) { dungThu(); return; } nghe.disabled = true; try { const b = await tao(); moAm(); await ac.resume(); const s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.onended = () => { if (nhacThu === s) dungThu(); }; s.start(); nhacThu = s; nghe.textContent = '■ Dừng'; } catch (e) { tt.textContent = 'Không soạn được: ' + (e.message || e); } nghe.disabled = false; };
  khac.onclick = () => { hat = 1 + Math.floor(Math.random() * 1e6); buf = null; const dang = !!nhacThu; dungThu(); if (dang) nghe.onclick(); else tt.textContent = 'Đã đổi bài, bấm Nghe thử'; };
  dat.onclick = async () => { dat.disabled = true; try { const b = await tao(); dungThu(); const f = new File([wavTuBuf(b)], 'nhac-' + kieu + '-' + hat + '.wav', { type: 'audio/wav' }); const inp = $('#nhacIn'), dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('change')); toast('Đã đặt nhạc “' + NHAC_TU[kieu].ten + '” làm nhạc nền'); } catch (e) { toast('Không đặt được nhạc: ' + (e.message || e)); } dat.disabled = false; };
  h3.before(box);
}

function khoiTao09d() {
  ['loc'].forEach(() => { const l = $('#locTatCa'); if (l && l.closest('label')) l.closest('label').hidden = true; });   // thay bằng thanh tick chọn đoạn
  const q = $('[data-pane="chuyen"] .quota'); if (q) q.textContent = 'Tick các điểm cắt cần áp rồi bấm một chuyển cảnh. Không tick: áp ở điểm cắt đang chọn / gần đầu phát.';
  // lưới vẽ lại (đổi nhóm, tìm, mở tab) thì gắn lại dấu tick, nhãn Mới, ảnh chuyển cảnh
  const theo = (sel, f) => { const n = $(sel); if (!n) return; let cho = 0; new MutationObserver(() => { if (cho) return; cho = requestAnimationFrame(() => { cho = 0; try { f(); } catch (e) { console.warn(e); } }); }).observe(n, { childList: true }); };
  theo('#huLuoi', () => { danhDauHu(); danhDauMoi(); }); theo('#khoLocLuoi', () => { danhDauLoc(); danhDauMoi(); }); theo('#chuyenLuoi', () => { danhDauChuyen(); danhDauMoi(); gltNap().then(veAnhChuyen); });
  { const goc = veProp; veProp = function () { const r = goc.apply(this, arguments); const ch = P.chon, kh = ch ? ch.k + ':' + ch.i : ''; if (kh !== P._tickChon) { P._tickChon = kh; if (ch && ch.k === 'v') P.tickTay = false; dongBoTickAp(); } capNhatTick(); return r; }; }
  { const goc = veTl; let cho = 0; veTl = function () { const r = goc.apply(this, arguments); if (!cho) cho = requestAnimationFrame(() => { cho = 0; capNhatTick(); }); return r; }; }
  $$('.etabs button[data-tab]').forEach(b => { if (['hieu', 'loc', 'chuyen'].includes(b.dataset.tab)) b.addEventListener('click', () => setTimeout(() => { capNhatTick(); danhDauMoi(); if (b.dataset.tab === 'chuyen') gltNap().then(veAnhChuyen); }, 30)); });
  veNhacTu(); danhDauMoi(); capNhatTick(); gltNap().then(veAnhChuyen);
}
khoiTao09d();

/* ═════════ ĐỢT 6: chỉnh âm lượng và fade ngay trên lớp (như CapCut) ═════════
   Rê chuột vào đoạn có tiếng (V1, A3): đường âm lượng kéo lên / xuống, hai núm ở mép trên kéo vào để fade.
   Dạng sóng vẽ theo mức thật × âm lượng: phần vượt −1 dB (sắp vỡ tiếng) tô đỏ, có vạch ngưỡng. */
const AM_MIN = -30, AM_NGUONG = 0.891, AM_CANH = 0.708;   // −1 dBFS vỡ tiếng · −3 dBFS sắp chạm
function amLopTT(k, m) { const v = m.am == null ? 1 : m.am; return { db: v <= 0.0005 ? AM_MIN : Math.max(AM_MIN, 20 * Math.log10(v)), max: k === 'v' ? 10 : 12, coKf: !!(m.kfs && m.kfs.am && m.kfs.am.length) }; }
function datAmLop(m, db) { m.am = db <= AM_MIN + 0.01 ? 0 : +Math.pow(10, db / 20).toFixed(4); }
const dbYLop = (db, max, H) => Math.max(2, Math.min(H - 2, H * (1 - (db - AM_MIN) / (max - AM_MIN))));
function nguonSong(k, m) { if (k === 'a') { const kk = AM3_KHO[m.kho]; return kk && kk.song ? kk : null; } const s = srcCua(m.src); return s && s.song ? s : null; }
function daiLop(k, m) { return k === 'a' ? m.kt - m.bd : daiC(m); }
/* hệ số âm lượng tại off (giây trong đoạn): âm lượng (kể cả keyframe) × fade */
function heSoLop(k, m, off) { const dai = daiLop(k, m), v = k === 'v' ? giaTriKf(m, 'am', off) : (m.am == null ? 1 : m.am); let f = 1; if (m.fi > 0) f = Math.min(f, Math.max(0, off / m.fi)); if (m.fo > 0) f = Math.min(f, Math.max(0, (dai - off) / m.fo)); return v * f; }
function veSongLop(d, k, m, W, H) {
  const src = nguonSong(k, m); d.querySelectorAll(':scope > canvas.song, :scope > canvas.songAm').forEach(x => x.remove()); if (!src || W < 8) return 0;
  const cvs = el('canvas', 'songAm' + (k === 'v' ? ' v' : '')), h = k === 'v' ? Math.min(22, Math.round(H * 0.42)) : H, w = Math.min(4000, Math.round(W)); cvs.width = w; cvs.height = h; const g = cvs.getContext('2d');
  const song = src.song, n = song.length, dinh = song.max || 1, bd = m.bd, kt = m.kt, dai = daiLop(k, m); let lon = 0;
  for (let x = 0; x < w; x++) { const t = bd + (kt - bd) * x / w, i = Math.min(n - 1, Math.floor(t * 50)), a = (song[i] || 0) / 255 * dinh * heSoLop(k, m, dai * x / w); if (a > lon) lon = a; const v = Math.min(1, a) * h;
    g.fillStyle = a >= AM_NGUONG ? '#ff4d4f' : a >= AM_CANH ? '#ffb020' : 'rgba(190,255,120,.6)'; g.fillRect(x, h - v, 1, v); }
  const yN = h * (1 - AM_NGUONG); g.strokeStyle = 'rgba(255,90,90,.85)'; g.setLineDash([4, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(0, yN + 0.5); g.lineTo(w, yN + 0.5); g.stroke();
  const hop = d.querySelector(':scope > .amLop'); if (k === 'v') d.insertBefore(cvs, hop); else d.insertBefore(cvs, d.firstChild); return lon;   /* V1: nằm trên dải ảnh thu nhỏ */
}
function veLopAm(d, k, m) {
  d.querySelectorAll(':scope > .amLop').forEach(x => x.remove()); const W = d.clientWidth, H = d.clientHeight; if (W < 24 || H < 14) return;
  const tt = amLopTT(k, m), dai = daiLop(k, m), pxs = W / Math.max(0.01, dai), NS = 'http://www.w3.org/2000/svg';
  const hop = el('div', 'amLop' + (tt.coKf ? ' coKf' : '')), sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sv.setAttribute('preserveAspectRatio', 'none');
  const toi = document.createElementNS(NS, 'path'), duong = document.createElementNS(NS, 'path'); toi.setAttribute('class', 'toi'); duong.setAttribute('class', 'bao'); sv.append(toi, duong); hop.append(sv);
  const nhan = el('span', 'amNhan'), quaTo = el('span', 'amQuaTo', '⚠ Quá to'); quaTo.title = 'Có chỗ vượt −1 dB, dễ bị vỡ tiếng khi đăng. Kéo đường âm lượng xuống tới khi hết đỏ.'; hop.append(nhan, quaTo);
  const o = { d, k, m, W, H, pxs, dai, max: tt.max, toi, duong, nhan, quaTo };
  if (!tt.coKf) { o.tay = el('div', 'amTay'); o.tay.title = 'Kéo lên / xuống để chỉnh âm lượng · bấm đúp: về 0 dB'; hop.append(o.tay); keoAmLop(o); }
  o.fl = el('i', 'fdK l'); o.fr = el('i', 'fdK r'); hop.append(o.fl, o.fr); keoFadeLop(o, 'l'); keoFadeLop(o, 'r');
  d.classList.add('coAmLop'); d.append(hop); capNhatLopAm(o);
}
/* cập nhật tại chỗ (không tạo lại phần tử nên kéo không bị ngắt) */
function capNhatLopAm(o) {
  const { d, k, m, W, H, pxs, dai, max } = o, tt = amLopTT(k, m), fi = Math.min(m.fi || 0, dai), fo = Math.min(m.fo || 0, dai), lon = veSongLop(d, k, m, W, H);
  const y = off => { const v = k === 'v' ? giaTriKf(m, 'am', off) : (m.am == null ? 1 : m.am); return dbYLop(v <= 0.0005 ? AM_MIN : Math.max(AM_MIN, 20 * Math.log10(v)), max, H); };
  // đường bao: từ đáy lên mức âm lượng sau fade vào, ngang (theo keyframe nếu có), xuống đáy ở fade ra
  let dd = 'M0 ' + H + ' L' + (fi * pxs).toFixed(1) + ' ' + y(fi).toFixed(1); const N = tt.coKf ? 40 : 1; for (let i = 1; i <= N; i++) { const t = fi + (dai - fi - fo) * i / N; dd += ' L' + (t * pxs).toFixed(1) + ' ' + y(t).toFixed(1); } dd += ' L' + W + ' ' + H;
  o.toi.setAttribute('d', dd + ' L' + W + ' 0 L0 0 Z'); o.duong.setAttribute('d', dd);
  const yv = dbYLop(tt.db, max, H); o.nhan.textContent = o.chu || (tt.coKf ? 'Âm lượng có keyframe' : dbChu(tt.db)); o.nhan.style.top = Math.max(0, Math.min(H - 16, yv - 18)) + 'px'; o.nhan.style.left = Math.max(2, fi * pxs + 4) + 'px';
  o.quaTo.hidden = lon < AM_NGUONG || W < 90;   // đoạn hẹp: chỉ tô đỏ, không chen nhãn
  if (o.tay) Object.assign(o.tay.style, { left: fi * pxs + 'px', width: Math.max(6, W - (fi + fo) * pxs) + 'px', top: (yv - 6) + 'px' });
  [[o.fl, 'l', fi], [o.fr, 'r', fo]].forEach(([n, ben, v]) => { n.classList.toggle('co', v > 0); n.title = (ben === 'l' ? 'Kéo vào để fade in' : 'Kéo vào để fade out') + (v > 0 ? ' · ' + fmt1(v) + 's' : '') + ' · bấm đúp: bỏ'; n.style.left = (ben === 'l' ? Math.max(9, fi * pxs) : Math.min(W - 9, W - fo * pxs)) + 'px'; });
}
function chanKeo(e) { if (e.button !== 0) return false; e.stopPropagation(); e.preventDefault(); return true; }
function keoAmLop(o) {
  const { tay, d, k, m, H, max } = o;
  tay.ondblclick = e => { e.stopPropagation(); luuHoanTac(); datAmLop(m, 0); veTl(); veProp(); toast('Âm lượng về 0 dB'); };
  tay.onpointerdown = e => { if (!chanKeo(e)) return; if (khoaMuc(k, m)) { baoKhoa(); return; } try { tay.setPointerCapture(e.pointerId); } catch { } luuHoanTac(); const y0 = e.clientY, db0 = amLopTT(k, m).db; let doi = false; d.classList.add('dangKeoAm');
    tay.onpointermove = ev => { doi = true; let db = db0 - (ev.clientY - y0) * (max - AM_MIN) / H * (ev.shiftKey ? 0.25 : 1); if (Math.abs(db) < 0.6) db = 0; db = Math.max(AM_MIN, Math.min(max, Math.round(db * 2) / 2)); datAmLop(m, db); o.chu = ''; capNhatLopAm(o); const sm = d.querySelector(':scope > small'); if (sm && k === 'a') sm.textContent = fmt1(m.kt - m.bd) + 's · ' + dbChu(db); };
    tay.onpointerup = tay.onpointercancel = () => { tay.onpointermove = tay.onpointerup = tay.onpointercancel = null; d.classList.remove('dangKeoAm'); if (!doi) { huyHoanTac(); return; } veTl(); veProp(); }; };
}
function keoFadeLop(o, ben) {
  const { d, k, m, pxs, dai } = o, n = ben === 'l' ? o.fl : o.fr, key = ben === 'l' ? 'fi' : 'fo', khac = ben === 'l' ? 'fo' : 'fi';
  n.ondblclick = e => { e.stopPropagation(); luuHoanTac(); delete m[key]; veTl(); veProp(); };
  n.onpointerdown = e => { if (!chanKeo(e)) return; if (khoaMuc(k, m)) { baoKhoa(); return; } try { n.setPointerCapture(e.pointerId); } catch { } luuHoanTac(); const x0 = e.clientX, v0 = m[key] || 0; let doi = false; d.classList.add('dangKeoAm');
    n.onpointermove = ev => { doi = true; const dx = (ev.clientX - x0) * (ben === 'l' ? 1 : -1); let v = Math.max(0, Math.min(dai - (m[khac] || 0) - 0.05, v0 + dx / pxs)); v = Math.round(v * 20) / 20; if (v < 0.05) delete m[key]; else m[key] = v; o.chu = (ben === 'l' ? 'Fade in ' : 'Fade out ') + fmt1(v) + 's'; capNhatLopAm(o); };
    n.onpointerup = n.onpointercancel = () => { n.onpointermove = n.onpointerup = n.onpointercancel = null; o.chu = ''; d.classList.remove('dangKeoAm'); if (!doi) { huyHoanTac(); return; } veTl(); veProp(); }; };
}
function veMoiLopAm() {
  $$('.item[data-k="a"]').forEach(d => { const m = (P.am3 || [])[+d.dataset.i]; if (m) try { veLopAm(d, 'a', m); } catch (e) { console.warn('amLop', e); } });
  $$('.item[data-k="v"]').forEach(d => { const m = P.clips[+d.dataset.i]; if (!m || m.trong || d.classList.contains('trong')) return; const s = srcCua(m.src); if (!s || s.loai !== 'video' || (typeof laGhep === 'function' && laGhep(m))) return; try { veLopAm(d, 'v', m); } catch (e) { console.warn('amLop', e); } });
}
function khoiTao09e() { const goc = veTl; veTl = function () { const r = goc.apply(this, arguments); try { veMoiLopAm(); } catch (e) { console.warn(e); } return r; }; if (!P.dang) veTl(); }
khoiTao09e();

/* ═════════ ĐỢT 7: bảng Thuộc tính gọn kiểu FilmCraft / CapCut · chỉnh màu chuyên nghiệp · tay cầm khung xem mảnh · thêm footage thẳng vào dòng thời gian ═════════ */
Object.assign(TAB_NHOM, { 'Ổn định hình (chống rung)': 'Video', 'Đoạn': '*' });   // '*': về tab chính của loại mục (Video / Văn bản / Đồ hoạ…) Object.assign(SUB_NHOM, { 'Ổn định hình (chống rung)': 'Ổn định' });
/* thanh tab cuộn ngang: lăn chuột cuộn ngang, mũi tên ‹ › khi còn tab bị che, tab đang mở luôn nằm trong tầm nhìn */
function ganCuonNgang(bar) {
  if (!bar || bar._cuon) return; bar._cuon = 1; bar.classList.add('cuonNgang');
  const mep = () => { bar.classList.toggle('conTrai', bar.scrollLeft > 2); bar.classList.toggle('conPhai', bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 2); };
  bar.addEventListener('wheel', e => { if (bar.scrollWidth <= bar.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; e.preventDefault(); bar.scrollLeft += e.deltaY; }, { passive: false });
  bar.addEventListener('scroll', mep, { passive: true });
  [['trai', -1, '‹'], ['phai', 1, '›']].forEach(([c, h, t]) => { const b = el('button', 'cuonMui ' + c, t); b.type = 'button'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); b.onclick = e => { e.stopPropagation(); bar.scrollBy({ left: h * bar.clientWidth * 0.7, behavior: 'smooth' }); }; bar.appendChild(b); });
  const on = bar.querySelector('button.on'); if (on) { const l = on.offsetLeft, r = l + on.offsetWidth; if (l < bar.scrollLeft || r > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = l - 24; }
  requestAnimationFrame(mep);
}
/* gom các ô lẻ (chuyển cảnh, thông tin đoạn, nút xoá…) vào nhóm "Đoạn" của Video › Cơ bản để không hiện ở mọi tab */
function gomOLe(box) {
  const ch = P.chon; if (!ch || (typeof dsNhieu === 'function' && dsNhieu().length > 1)) return; if (box.querySelector(':scope > .nhomRoi')) return;
  const le = [...box.children].filter(x => !x.classList.contains('nhom2') && !x.classList.contains('ptabs') && !x.classList.contains('psub') && !x.classList.contains('lopHang') && !x.classList.contains('tabCuoi') && x.tagName !== 'H3'); if (!le.length || !box.querySelector(':scope > .nhom2')) return;
  const n = el('div', 'nhom2 nhomRoi'); n.appendChild(el('b', null, 'Đoạn')); box.insertBefore(n, le[0]); le.forEach(x => n.appendChild(x));
}
{ const goc = tabHoaProp; tabHoaProp = function () {
    const box = $('#propChon'); try { if (box) gomOLe(box); } catch (e) { console.warn(e); }
    const r = goc.apply(this, arguments);
    try { if (box) { box.querySelectorAll(':scope > .ptabs, :scope > .psub').forEach(ganCuonNgang);
      const hien = [...box.querySelectorAll(':scope > .nhom2:not(.an)')], sub = box.querySelector(':scope > .psub button.on');
      box.querySelectorAll(':scope > .nhom2.mot').forEach(x => x.classList.remove('mot'));
      if (hien.length === 1 && sub && sub.textContent.trim() !== 'Cơ bản') { hien[0].classList.add('mot'); hien[0].classList.remove('gap'); } } } catch (e) { console.warn(e); }
    return r; }; }

/* ── bánh xe màu kiểu CapCut: ba bánh (tối · trung tính · sáng), vòng sắc độ, núm kéo, độ sáng, số đọc ── */
const BANH_TEN = [['toi', 'Vùng tối', 'Lift'], ['giua', 'Trung tính', 'Gamma'], ['sang', 'Vùng sáng', 'Gain']];
function veDia(cvx, o) {
  const N = cvx.width, R = N / 2, g = cvx.getContext('2d'), im = g.createImageData(N, N), rv = R - N * 0.07;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (x - R) / rv, dy = (y - R) / rv, r = Math.hypot(dx, dy), i = (y * N + x) * 4; if (r > 1) { im.data[i + 3] = 0; continue; } const a = Math.atan2(-dy, dx), q = [Math.cos(a), Math.cos(a - 2.0944), Math.cos(a + 2.0944)], k = Math.pow(r, 0.85); for (let j = 0; j < 3; j++) im.data[i + j] = 46 + 70 * k + q[j] * k * 92; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  // vòng sắc độ bên ngoài
  for (let d = 0; d < 360; d += 2) { const a = d * Math.PI / 180, q = [Math.cos(a), Math.cos(a - 2.0944), Math.cos(a + 2.0944)].map(v => Math.round(128 + v * 127)); g.strokeStyle = 'rgb(' + q.join(',') + ')'; g.lineWidth = N * 0.035; g.beginPath(); g.arc(R, R, R - N * 0.025, -a - 0.03, -a + 0.04); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.beginPath(); g.arc(R, R, rv, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(R - rv, R); g.lineTo(R + rv, R); g.moveTo(R, R - rv); g.lineTo(R, R + rv); g.stroke();
  const a = (o.h || 0) * Math.PI / 180, px = R + Math.cos(a) * (o.s || 0) * rv, py = R - Math.sin(a) * (o.s || 0) * rv;
  g.lineWidth = N * 0.022; g.strokeStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(px, py, N * 0.06, 0, 7); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = N * 0.014; g.beginPath(); g.arc(px, py, N * 0.06, 0, 7); g.stroke();
  return rv;
}
veBanhXe = function (box, c) {
  const n = el('div', 'nhom2 banhFc'); n.appendChild(el('b', null, 'Bánh xe màu')); box.appendChild(n); const BX = () => (c.banh = c.banh || {}), hang = el('div', 'banhLuoi'); n.appendChild(hang);
  BANH_TEN.forEach(([k, ten, en]) => {
    const cot = el('div', 'banhO'), dau = el('div', 'banhDau'), o0 = () => (c.banh || {})[k] || { h: 0, s: 0, l: 0 }; dau.append(el('span', null, ten), el('small', null, en));
    const dl = el('button', 'banhDl', '↺'); dl.type = 'button'; dl.title = 'Đặt lại ' + ten.toLowerCase(); dau.append(dl); cot.append(dau);
    const cvx = el('canvas', 'banhCv'); cvx.width = cvx.height = 192; cot.append(cvx);
    const so = el('div', 'banhSo'), ve = () => { const o = o0(); veDia(cvx, o); so.innerHTML = '<span>H <b>' + Math.round(((o.h || 0) + 360) % 360) + '°</b></span><span>S <b>' + Math.round((o.s || 0) * 100) + '</b></span><span>L <b>' + ((o.l || 0) > 0 ? '+' : '') + Math.round((o.l || 0) * 100) + '</b></span>'; cot.classList.toggle('doi', !!((c.banh || {})[k])); };
    let keo = false, luu = false; const dat = e => { const r = cvx.getBoundingClientRect(), rv = r.width / 2 * (1 - 0.14), dx = (e.clientX - r.left - r.width / 2) / rv, dy = (e.clientY - r.top - r.height / 2) / rv; let s = Math.min(1, Math.hypot(dx, dy)); if (s < 0.04) s = 0; if (e.shiftKey) s *= 0.5; BX()[k] = { ...(BX()[k] || { l: 0 }), h: Math.round(Math.atan2(-dy, dx) * 180 / Math.PI), s: +s.toFixed(3) }; ve(); if (!P.dang) veKhung(); };
    cvx.onpointerdown = e => { e.preventDefault(); if (!luu) { luuHoanTac(); luu = true; } keo = true; try { cvx.setPointerCapture(e.pointerId); } catch { } dat(e); }; cvx.onpointermove = e => { if (keo) dat(e); }; cvx.onpointerup = cvx.onpointercancel = () => { keo = false; luu = false; };
    const boDi = () => { luuHoanTac(); if (c.banh) { delete c.banh[k]; if (!Object.keys(c.banh).length) delete c.banh; } ve(); veKhung(); }; cvx.ondblclick = boDi; dl.onclick = boDi; cvx.title = 'Kéo núm để đẩy màu · Shift: mịn · bấm đúp: đặt lại';
    const r = el('input', 'banhL'); r.type = 'range'; r.min = -1; r.max = 1; r.step = 0.01; r.value = o0().l || 0; r.title = 'Độ sáng ' + ten.toLowerCase(); r.setAttribute('aria-label', r.title); let lr = false;
    r.oninput = () => { if (!lr) { luuHoanTac(); lr = true; } BX()[k] = { ...(BX()[k] || { h: 0, s: 0 }), l: +r.value }; ve(); if (!P.dang) veKhung(); }; r.onchange = () => { lr = false; }; r.ondblclick = () => { r.value = 0; r.oninput(); r.onchange(); };
    cot.append(r, so); hang.append(cot); ve();
  });
  n.appendChild(el('div', 'quota', 'Kéo núm trong bánh xe về phía màu muốn đẩy. Thanh dưới chỉnh độ sáng vùng đó. Bấm đúp để đặt lại.'));
};
/* ── đường cong: kênh dạng nút có chấm màu, khung lớn theo bề ngang, các kênh khác hiện mờ phía sau ── */
const KENH_CONG = [['m', 'Tổng', '#ffffff'], ['r', 'Đỏ', '#ff4d4d'], ['g', 'Xanh lá', '#3bd16f'], ['b', 'Xanh dương', '#4d8bff']];
veDuongCong = function (box, c) {
  const n = el('div', 'nhom2 congFc'); n.appendChild(el('b', null, 'Đường cong')); box.appendChild(n); let kenh = P.kenhCong || 'm';
  const r = el('div', 'kenhChon'); KENH_CONG.forEach(([k, t, m]) => { const b = el('button', k === kenh ? 'on' : null); b.type = 'button'; b.innerHTML = '<i style="background:' + m + '"></i>' + t; if (c.cmau && c.cmau[k] && JSON.stringify(c.cmau[k]) !== JSON.stringify(CONG_MD)) b.classList.add('doi'); b.onclick = () => { P.kenhCong = k; veProp(); }; r.appendChild(b); }); n.appendChild(r);
  const S = 400, cvx = el('canvas', 'congCv'); cvx.width = cvx.height = S; n.appendChild(cvx);
  const ds = k => ((c.cmau || {})[k] && c.cmau[k].length >= 2 ? c.cmau[k] : CONG_MD.map(p => p.slice())), mau = Object.fromEntries(KENH_CONG.map(x => [x[0], x[2]]));
  const ve = () => { const g = cvx.getContext('2d'); g.fillStyle = '#0e0f12'; g.fillRect(0, 0, S, S); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * S / 4, 0); g.lineTo(i * S / 4, S); g.moveTo(0, i * S / 4); g.lineTo(S, i * S / 4); g.stroke(); }
    g.setLineDash([5, 5]); g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(0, S); g.lineTo(S, 0); g.stroke(); g.setLineDash([]);
    KENH_CONG.forEach(([k]) => { if (k === kenh || !(c.cmau && c.cmau[k])) return; const f = monoCubic(ds(k)); g.strokeStyle = mau[k]; g.globalAlpha = 0.35; g.lineWidth = 1.5; g.beginPath(); for (let x = 0; x <= S; x += 2) { const y = S - Math.max(0, Math.min(1, f(x / S))) * S; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.globalAlpha = 1; });
    const p = ds(kenh), f = monoCubic(p); g.strokeStyle = mau[kenh]; g.lineWidth = 3; g.shadowColor = mau[kenh]; g.shadowBlur = 6; g.beginPath(); for (let x = 0; x <= S; x++) { const y = S - Math.max(0, Math.min(1, f(x / S))) * S; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.shadowBlur = 0;
    p.forEach(([x, y]) => { g.fillStyle = '#0e0f12'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x * S, S - y * S, 9, 0, 7); g.fill(); g.stroke(); }); };
  ve(); let keo = -1; const toaDo = e => { const r2 = cvx.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r2.left) / r2.width)), Math.max(0, Math.min(1, 1 - (e.clientY - r2.top) / r2.height))]; };
  cvx.onpointerdown = e => { e.preventDefault(); const [x, y] = toaDo(e), p = ds(kenh); luuHoanTac(); let i = p.findIndex(q => Math.abs(q[0] - x) < 0.04 && Math.abs(q[1] - y) < 0.06); if (i < 0) { p.push([+x.toFixed(3), +y.toFixed(3)]); p.sort((a, b) => a[0] - b[0]); i = p.findIndex(q => q[0] === +x.toFixed(3)); } (c.cmau = c.cmau || {})[kenh] = p; keo = i; try { cvx.setPointerCapture(e.pointerId); } catch { } ve(); if (!P.dang) veKhung(); };
  cvx.onpointermove = e => { if (keo < 0) return; const [x, y] = toaDo(e), p = c.cmau[kenh], lo = keo > 0 ? p[keo - 1][0] + 0.01 : 0, hi = keo < p.length - 1 ? p[keo + 1][0] - 0.01 : 1; p[keo] = [+(keo === 0 ? 0 : keo === p.length - 1 ? 1 : Math.max(lo, Math.min(hi, x))).toFixed(3), +y.toFixed(3)]; ve(); if (!P.dang) veKhung(); };
  cvx.onpointerup = cvx.onpointercancel = () => { if (keo >= 0) { keo = -1; veProp(); } };
  cvx.ondblclick = e => { const [x, y] = toaDo(e), p = ds(kenh), i = p.findIndex(q => Math.abs(q[0] - x) < 0.04 && Math.abs(q[1] - y) < 0.08); if (i > 0 && i < p.length - 1) { luuHoanTac(); p.splice(i, 1); (c.cmau = c.cmau || {})[kenh] = p; ve(); veKhung(); } };
  const cuoi = el('div', 'congCuoi'); cuoi.append(el('span', 'quota', 'Bấm để thêm điểm · kéo để chỉnh · bấm đúp vào điểm để xoá')); const dl = el('button', 'btn nho ghost', 'Đặt lại'); dl.type = 'button'; dl.onclick = () => { luuHoanTac(); if (c.cmau) { delete c.cmau[kenh]; if (!Object.keys(c.cmau).length) delete c.cmau; } veProp(); veKhung(); }; cuoi.append(dl); n.appendChild(cuoi);
};
/* ── HSL: chấm màu chọn dải, ba thanh có nền màu đúng ý nghĩa ── */
function truotMau(n, nhan, min, max, buoc, gt, nen, viet, f) {
  const l = el('label', 'trMau'); l.append(el('span', null, nhan)); const r = el('input'); r.type = 'range'; r.min = min; r.max = max; r.step = buoc; r.value = gt; r.style.setProperty('--nen', nen); const o = el('output'); o.textContent = viet(+gt); let luu = false;
  r.oninput = () => { if (!luu) { luuHoanTac(); luu = true; } o.textContent = viet(+r.value); f(+r.value); if (!P.dang) veKhung(); }; r.onchange = () => { luu = false; }; l.ondblclick = () => { r.value = 0; r.oninput(); r.onchange(); };
  l.append(r, o); n.append(l); return r;
}
veHsl = function (box, c) {
  const n = el('div', 'nhom2 hslFc'); n.appendChild(el('b', null, 'HSL')); box.appendChild(n); const chon = P.daiHsl || 'do', r = el('div', 'hslCham');
  DAI_HSL.forEach(([k, t, , m]) => { const b = el('button', k === chon ? 'on' : null); b.type = 'button'; b.title = t; b.style.setProperty('--m', m); if ((c.hsl || {})[k]) b.classList.add('doi'); b.setAttribute('aria-label', t); b.onclick = () => { P.daiHsl = k; veProp(); }; r.appendChild(b); }); n.appendChild(r);
  const d = DAI_HSL.find(x => x[0] === chon), hue = d[2], ten = el('div', 'hslTen'); ten.innerHTML = '<i style="background:' + d[3] + '"></i>' + d[1]; n.appendChild(ten);
  const o = () => { c.hsl = c.hsl || {}; return (c.hsl[chon] = c.hsl[chon] || {}); }, don = () => { const x = c.hsl && c.hsl[chon]; if (x && !x.h && !x.s && !x.l) delete c.hsl[chon]; if (c.hsl && !Object.keys(c.hsl).length) delete c.hsl; }, cur = (c.hsl || {})[chon] || {};
  const hsl = (h, s, l) => 'hsl(' + h + ',' + s + '%,' + l + '%)';
  truotMau(n, 'Sắc độ', -60, 60, 1, cur.h || 0, 'linear-gradient(90deg,' + hsl(hue - 60, 85, 55) + ',' + hsl(hue, 85, 55) + ',' + hsl(hue + 60, 85, 55) + ')', v => (v > 0 ? '+' : '') + Math.round(v) + '°', v => { o().h = v; don(); });
  truotMau(n, 'Bão hoà', -100, 100, 1, cur.s || 0, 'linear-gradient(90deg,' + hsl(hue, 0, 50) + ',' + hsl(hue, 100, 50) + ')', v => (v > 0 ? '+' : '') + Math.round(v), v => { o().s = v; don(); });
  truotMau(n, 'Độ sáng', -100, 100, 1, cur.l || 0, 'linear-gradient(90deg,#000,' + hsl(hue, 80, 50) + ',#fff)', v => (v > 0 ? '+' : '') + Math.round(v), v => { o().l = v; don(); });
  const dl = el('button', 'btn nho ghost', 'Đặt lại mọi dải'); dl.type = 'button'; dl.onclick = () => { luuHoanTac(); delete c.hsl; veProp(); veKhung(); }; n.appendChild(dl);
};

/* ── thêm footage thẳng vào dòng thời gian (điện thoại: nút ＋ Thêm video, và nút ＋ cuối track chính như CapCut) ── */
async function themVaoTl(files) {
  files = [...(files || [])].filter(f => /^(video|image)\//.test(f.type) || /\.(mp4|mov|webm|m4v|jpe?g|png|webp)$/i.test(f.name)); if (!files.length) return;
  const truoc = P.srcs.length; await themFile(files); const moi = [...(themFile.trung || []), ...P.srcs.slice(truoc)].filter(s => s.tt !== 'loi'); if (!moi.length) return;
  const dauTien = !P.clips.length; luuHoanTac(); let i = P.clips.length; if (P.clips.length && P.t < tongGiay() - 0.05) { const v = viTri(P.t); if (v.clip >= 0) i = v.clip + 1; }
  const doan = moi.map(s => ({ src: s.id, bd: 0, kt: s.loai === 'video' ? ktKhung(s.giay) : khungGiay(s.giay && s.giay < 60 ? s.giay : 3) }));
  P.clips.splice(i, 0, ...doan); P.chon = { k: 'v', i }; P.t = khungGiay(batDauC(P.clips[i])); veTl(); veLoi(); veKhung(); veProp(); if (typeof chonHien === 'function') chonHien();
  if (dauTien && typeof zoomVua === 'function') { try { zoomVua(); } catch { } }   // lần đầu: phóng dòng thời gian vừa màn hình
  const tr = $('#trong'); if (tr) tr.hidden = true; toast('Đã thêm ' + doan.length + ' đoạn vào dòng thời gian');
}
function moChonFileTl() { let inp = $('#themTlIn'); if (!inp) { inp = el('input'); inp.type = 'file'; inp.id = 'themTlIn'; inp.accept = 'video/*,image/*'; inp.multiple = true; inp.hidden = true; inp.onchange = () => { const f = [...inp.files]; inp.value = ''; themVaoTl(f); }; document.body.appendChild(inp); } inp.click(); }
function veNutThemCuoi() {
  const hang = $('.track[data-track="v1"]'); if (!hang) return; hang.querySelectorAll(':scope > .themCuoi').forEach(x => x.remove()); if (!P.clips.length) return;
  const b = el('button', 'themCuoi'); b.type = 'button'; b.title = 'Thêm video / ảnh vào cuối dòng thời gian'; b.setAttribute('aria-label', b.title); b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  let acc = 0; P.clips.forEach(c => { acc += daiC(c); }); b.style.left = (acc * PX() + 10) + 'px'; b.onpointerdown = e => e.stopPropagation(); b.onclick = e => { e.stopPropagation(); P.t = tongGiay(); moChonFileTl(); }; hang.appendChild(b);
}
/* mũi tên › nổi ở mép phải một thanh cuộn ngang trên điện thoại (thanh công cụ, thanh tab dưới) khi còn nút bị che */
function ganMuiCuon(mt, id) {
  const mui = el('button'); mui.id = id; mui.className = 'muiCuon'; mui.type = 'button'; mui.textContent = '›'; mui.setAttribute('aria-label', 'Xem thêm'); document.body.appendChild(mui);
  const dat = () => { const r = mt.getBoundingClientRect(), co = innerWidth <= 760 && r.width > 0 && getComputedStyle(mt).display !== 'none' && getComputedStyle(mt).flexDirection !== 'column' && mt.scrollLeft + mt.clientWidth < mt.scrollWidth - 4; mui.classList.toggle('hien', co); if (co) { mui.style.top = r.top + 'px'; mui.style.height = r.height + 'px'; } };
  mui.onclick = () => { mt.scrollBy({ left: mt.clientWidth * 0.6, behavior: 'smooth' }); }; mt.addEventListener('scroll', dat, { passive: true }); addEventListener('resize', dat);
  new MutationObserver(() => requestAnimationFrame(dat)).observe(mt, { childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); new MutationObserver(() => requestAnimationFrame(dat)).observe($('#ed') || document.body, { attributes: true, attributeFilter: ['class'] }); setInterval(dat, 1500); dat();
}
function khoiTao09f() {
  // nút "＋ Thêm video" trên điện thoại: mở chọn file và đặt thẳng vào dòng thời gian (trước đây chỉ mở thư viện)
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#tlTrong [data-mo-tab="footage"]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); moChonFileTl(); }, true);
  const tr = $('#trong .chiDt'); if (tr) tr.innerHTML = 'Bấm <b>＋ Thêm video</b> bên dưới,<br>hoặc <b>Trợ lý AI</b> để AI dựng giúp.';
  { const goc = veTl; veTl = function () { const r = goc.apply(this, arguments); try { veNutThemCuoi(); } catch (e) { console.warn(e); } return r; }; }
  // đang kéo trong bảng Thuộc tính (bánh xe, đường cong, thanh trượt): việc nền xong (dải ảnh, dạng sóng) không được vẽ lại bảng giữa chừng
  { const box = $('#propChon'); if (box) { box.addEventListener('pointerdown', () => { P._keoProp = true; }, true); const tha = () => { if (!P._keoProp) return; P._keoProp = false; if (P._propHoan) { P._propHoan = false; setTimeout(() => veProp(), 0); } }; addEventListener('pointerup', tha, true); addEventListener('pointercancel', tha, true); }
    const goc = veProp; veProp = function () { if (P._keoProp) { P._propHoan = true; return; } return goc.apply(this, arguments); }; }
  // thanh công cụ dưới trên điện thoại: mũi tên › khi còn nút bị che, chạm để cuộn tiếp
  [$('#mobTao'), $('.ecol.trai .etabs')].forEach((mt, k) => { if (mt) ganMuiCuon(mt, k ? 'mobMui2' : 'mobMui'); });
  if (!P.dang) veTl();
}
khoiTao09f();

/* ═════════ ĐỢT 8: rà soát giao diện — hoạt ảnh chữ dạng lưới thẻ, chữ đang chọn hiện đủ khi dừng, nút trùng, ô chọn file, nhãn dán đang tải ═════════ */
/* chữ / nhãn dán đang chọn và đang dừng: vẽ trạng thái đầy đủ (bỏ hoạt ảnh vào / ra) để chỉnh cho dễ; khi phát và khi xuất vẫn đủ hoạt ảnh */
{ const goc = veDoHoa; veDoHoa = function (ctx, W, H, g, t) {
    const ch = P.chon; if (!g || P.dang || (typeof dangXuat === 'function' && dangXuat()) || !ch || ch.k !== 'g' || P.gfx[ch.i] !== g || !(g.kieu === 'chu' || g.kieu === 'sticker')) return goc.apply(this, arguments);
    const luu = { boVao: g.boVao, boRa: g.boRa }; g.boVao = true; g.boRa = true;
    try { return goc.apply(this, arguments); } finally { ['boVao', 'boRa'].forEach(k => { if (luu[k] === undefined) delete g[k]; else g[k] = luu[k]; }); }
  }; }
/* hoạt ảnh chữ: Vào / Ra / Lặp thành lưới thẻ có hình động khi rê (như hoạt ảnh của video), thay cho ô thả xuống */
const AN_CHU_LOP = { pop: 'anPop', mo: 'anMo', truot: 'anTruot', len: 'anLen', phong: 'anPhong', xoay: 'anXoay', nhoe: 'anNhoe', go: 'anGo', nay: 'anNay', lac: 'anLac', thu: 'anThu', roi: 'anRoi', nhip: 'anNhip', nhap_nhay: 'anNhay', khong: '' };
function luoiAnChu(box) {
  const n = [...box.querySelectorAll(':scope > .nhom2')].find(x => { const b = x.querySelector(':scope > b'); return b && b.textContent.trim() === 'Hoạt ảnh chữ'; }); if (!n || n.querySelector('.anChuLuoi')) return;
  const hang = ['Vào', 'Ra', 'Lặp'].map(t => [...n.querySelectorAll(':scope > label')].find(l => { const s = l.querySelector(':scope > span'); return s && s.textContent.trim() === t && l.querySelector('select'); })).filter(Boolean); if (hang.length < 2) return;
  P.anChuTab = P.anChuTab || 'Vào'; const seg = el('div', 'anChuSeg'), luoi = el('div', 'anChuLuoi');
  const ve = () => { seg.innerHTML = ''; luoi.innerHTML = ''; hang.forEach(l => { const t = l.querySelector('span').textContent.trim(), b = el('button', t === P.anChuTab ? 'on' : null, t); b.type = 'button'; b.onclick = () => { P.anChuTab = t; ve(); }; seg.append(b); });
    const l = hang.find(x => x.querySelector('span').textContent.trim() === P.anChuTab) || hang[0], sl = l.querySelector('select');
    [...sl.options].forEach(o => { const the = el('button', 'anThe' + (o.value === sl.value ? ' on' : '')); the.type = 'button'; the.title = o.textContent; const hinh = el('span', 'anHinh'), chu = el('i', AN_CHU_LOP[o.value] || '', o.value === 'khong' ? '⦸' : 'Aa'); hinh.append(chu); the.append(hinh, el('span', 'anTen', o.textContent));
      the.onclick = () => { sl.value = o.value; sl.dispatchEvent(new Event('change')); }; luoi.append(the); }); };
  hang.forEach(l => l.classList.add('anCC')); const dau = hang[0]; n.insertBefore(seg, dau); n.insertBefore(luoi, dau); ve();
}
function khoiTao09g() {
  { const goc = veProp; veProp = function () { const r = goc.apply(this, arguments); try { const box = $('#propChon'); if (box) luoiAnChu(box); } catch (e) { console.warn(e); } return r; }; }
  // nhãn dán động đang tải: ô nhấp nháy, tải xong thì thôi (lỗi thì ô tự bỏ như cũ)
  if (typeof veNotoLuoi === 'function') { const goc = veNotoLuoi; veNotoLuoi = function (box) { const r = goc.apply(this, arguments); try { box.querySelectorAll('.the').forEach(t => { const im = t.querySelector('img'); if (!im || im.complete) return; t.classList.add('dangTai'); im.addEventListener('load', () => t.classList.remove('dangTai'), { once: true }); }); } catch { } return r; }; }
  // nút "Áp cho tất cả" trong từng nhóm trùng với nút cuối tab → giữ nút cuối tab
  { const goc = nutApTatCa; nutApTatCa = function () { const r = goc.apply(this, arguments); try { const n = arguments[0], hang = n && n.lastElementChild; if (hang && hang.classList.contains('row')) hang.classList.add('apTatCaCu'); } catch { } return r; }; }
  // ô chọn video tham chiếu ở Trợ lý AI: nút tiếng Việt thay cho "Choose File"
  const tc = $('#thamChieuIn'); if (tc && !tc._dep) { tc._dep = 1; tc.hidden = true; const b = el('button', 'btn nho ghost', '＋ Chọn video mẫu'); b.type = 'button'; b.id = 'thamChieuNut'; b.onclick = () => tc.click(); tc.after(b); tc.addEventListener('change', () => { b.textContent = tc.files && tc.files[0] ? '✓ ' + tc.files[0].name.slice(0, 24) : '＋ Chọn video mẫu'; }); }
  // nút chỉ có biểu tượng mà chưa có tên: lấy tên từ title / nội dung gần nhất cho trình đọc màn hình
  const danTen = () => $$('#ed button').forEach(b => { if (b.textContent.trim() || b.title || b.getAttribute('aria-label')) return; const t = b.closest('[title]'); if (t && t.title) b.setAttribute('aria-label', t.title); });
  danTen(); new MutationObserver(() => { clearTimeout(danTen._h); danTen._h = setTimeout(danTen, 400); }).observe($('#ed') || document.body, { childList: true, subtree: true });
  if (!P.dang) veProp();
}
khoiTao09g();

/* ═════════ ĐỢT 9: giao diện kiểu Concat (học bố cục / thao tác, không dùng code của họ) ═════════
   - khung xem có đầu đề (Xem trước · độ phân giải · fps) và thanh phát riêng ngay dưới (mã thời gian, lùi / tới từng khung, về đầu / cuối, phóng khung, toàn màn hình)
   - khung chọn trên khung xem ghi "cỡ % · góc °"
   - thanh tab cột trái nằm ngang (biểu tượng trên, chữ dưới), cuộn được */
function veDauXem() {
  const g = $('.ecol.giua'); if (!g || g.querySelector(':scope > .xemDau')) return;
  const dau = el('div', 'xemDau'), ten = el('b', null, 'Xem trước'), tt = el('span', 'xemTt'); dau.append(ten, tt); g.insertBefore(dau, g.firstChild);
  const top = g.querySelector(':scope > .ccTop'); if (top) dau.append(top);
  const ve = () => { const c = $('#cv'); if (c) tt.textContent = c.width + ' × ' + c.height + ' · ' + (typeof fpsDuAn === 'function' ? fpsDuAn() : 30) + ' fps'; }; ve(); setInterval(ve, 2000);
}
function vePhatXem() {
  const g = $('.ecol.giua'); if (!g || g.querySelector(':scope > .xemPhat')) return;
  const bar = el('div', 'xemPhat'), tc0 = el('span', 'xemTc'), tong = el('span', 'xemTong');
  const nut = (tenIc, title, f, lop) => { const b = el('button', 'ic' + (lop ? ' ' + lop : '')); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = tenIc; b.onclick = f; return b; };
  const SVG = d => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const buoc = k => { if (P.dang) dung(); const f = 1 / (typeof fpsDuAn === 'function' ? fpsDuAn() : 30); P.t = Math.max(0, Math.min(tongGiay(), khungGiay(P.t + k * f))); veKhung(); vePh(); if (typeof datTg === 'function') datTg(tongGiay()); };
  const den = t => { if (P.dang) dung(); P.t = t; veKhung(); vePh(); if (typeof datTg === 'function') datTg(tongGiay()); };
  const play = nut(SVG('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>'), 'Phát / dừng (Space)', () => $('#btnPlay').click(), 'xemPlay');
  const giua = el('div', 'xemGiua'); giua.append(
    nut(SVG('<path d="M6 5v14M18 6l-9 6 9 6z"/>'), 'Về đầu (Home)', () => den(0)),
    nut(SVG('<path d="M15 6l-6 6 6 6"/>'), 'Lùi 1 khung (←)', () => buoc(-1)), play,
    nut(SVG('<path d="M9 6l6 6-6 6"/>'), 'Tới 1 khung (→)', () => buoc(1)),
    nut(SVG('<path d="M18 5v14M6 6l9 6-9 6z"/>'), 'Về cuối (End)', () => den(Math.max(0, tongGiay() - 0.001))));
  const trai = el('div', 'xemTrai'); trai.append(tc0, tong);
  const phai = el('div', 'xemPhai'); const zk = $('#zoomKhung'); if (zk) phai.append(zk);
  phai.append(nut(SVG('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'), 'Xem toàn màn hình', () => { const b = $('#btnToanManHinh'); if (b) b.click(); }));
  bar.append(trai, giua, phai); g.append(bar);
  const ve = () => { tc0.textContent = typeof tc === 'function' ? tc(P.t) : fmt1(P.t); tong.textContent = '/ ' + (typeof tc === 'function' ? tc(tongGiay()) : fmt1(tongGiay())); play.innerHTML = P.dang ? SVG('<rect x="6" y="5" width="4" height="14" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" fill="currentColor" stroke="none"/>') : SVG('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>'); };
  { const goc = datTg; datTg = function () { const r = goc.apply(this, arguments); try { ve(); } catch { } return r; }; } ve(); setInterval(() => { if (!P.dang) ve(); }, 700);
  (function vong() { if (P.dang) ve(); requestAnimationFrame(vong); })();
}
/* khung chọn: nhãn "cỡ % · góc °" dưới khung như Concat */
{ const goc = datHop; datHop = function (hop, b) { const r = goc.apply(this, arguments); try { if (hop && hop.classList && hop.classList.contains('tay') && b) { let n = hop.querySelector(':scope > .tayNhan'); if (!n) { n = el('span', 'tayNhan'); hop.appendChild(n); } n.textContent = Math.round((b.sc || 1) * 100) + '% · ' + Math.round(b.xoay || 0) + '°'; n.classList.toggle('trongKhung', (b.cy || 0.5) + (b.h || 1) / 2 > 0.92); }   /* khung chạm đáy: nhãn vào trong, sát mép trên */ } catch { } return r; }; }
/* tỉ lệ cột như Concat: thư viện ~30%, khung xem rộng ở giữa (chỉ khi người dùng chưa tự kéo cỡ) */
{ const goc = canhGiua0; canhGiua0 = function () { const r = goc.apply(this, arguments); try { const ed = $('#ed'), eb = $('.ebody'); const kc = typeof kichCo === 'function' ? kichCo() : {}; if (ed && eb && ed.classList.contains('ccw') && !ed.classList.contains('mobi') && !ed.classList.contains('bocDoc') && !ed.classList.contains('thuGon') && !kc.trai && !$('.keo.dang')) ed.style.setProperty('--wTrai', Math.round(Math.max(320, Math.min(470, eb.clientWidth * 0.3))) + 'px'); } catch { } return r; }; }
function khoiTao09h() {
  if (!$('#ed') || !$('#ed').classList.contains('ccw')) return;
  veDauXem(); vePhatXem(); try { canhGiua0(); } catch { }
  const et = $('.ecol.trai .etabs'); if (et) ganCuonNgang(et);
}
khoiTao09h();

/* ═════════ ĐỢT 10: khung Media kiểu Concat — cây mục có đếm số (Media: Tất cả / Video / Ảnh · Kho miễn phí), nút Nhập gọn, lưới thẻ sạch ═════════ */
const CHEVRON = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function veCayMedia() {
  const pane = $('[data-pane="footage"]'), nav = pane && pane.querySelector(':scope > .snav'); if (!nav) return;
  let cay = nav.querySelector(':scope > .cay'); if (!cay) { cay = el('div', 'cay'); nav.prepend(cay); nav.classList.add('coCay'); }
  const goc = [...nav.querySelectorAll(':scope > button')], loc = $('#locMedia'), cur = loc ? loc.value : 'tat', o0 = goc[0] && goc[0].classList.contains('on');
  const dem = k => P.srcs.filter(s => k === 'tat' || s.loai === k).length;
  const loc0 = k => () => { if (goc[0] && !goc[0].classList.contains('on')) goc[0].click(); if (loc) { loc.value = k; if (typeof locMedia === 'function') locMedia(); } veCayMedia(); };
  const mo = i => () => { if (goc[i]) goc[i].click(); veCayMedia(); };
  cay.innerHTML = '';
  const nhom = (ten, ds) => { const h = el('div', 'cayDau'); h.innerHTML = CHEVRON + '<span>' + ten + '</span>'; cay.append(h); ds.forEach(([nhan, so, on, f]) => { const b = el('button', on ? 'on' : null); b.type = 'button'; b.append(el('span', null, nhan)); if (so != null) b.append(el('small', null, String(so))); b.onclick = f; cay.append(b); }); };
  nhom('Media', [['Tất cả', dem('tat'), o0 && cur === 'tat', loc0('tat')], ['Video', dem('video'), o0 && cur === 'video', loc0('video')], ['Ảnh', dem('anh'), o0 && cur === 'anh', loc0('anh')]]);
  nhom('Kho miễn phí', [['Video B-roll', null, !!(goc[1] && goc[1].classList.contains('on')), mo(1)], ['Ảnh minh hoạ', null, !!(goc[2] && goc[2].classList.contains('on')), mo(2)]]);
}
function khoiTao09i() {
  const d = $('#drop'); if (d && !d._gon) { d._gon = 1; d.title = 'Nhập video, ảnh (hoặc kéo thả vào đây). AI sẽ chép lời từng từ, nhận diện cảnh và khoảnh khắc đáng giữ.'; const b = d.querySelector('b'); if (b) b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg><span>Nhập</span>'; }
  { const goc = veSrcs; veSrcs = function () { const r = goc.apply(this, arguments); try { veCayMedia(); } catch (e) { console.warn(e); } return r; }; }
  veCayMedia();
}
khoiTao09i();

/* ═════════ ĐỢT 11: kéo thả kiểu Concat ═════════
   Kéo từ thư viện: chip nhỏ đi theo con trỏ (màu theo loại), thẻ nguồn mờ đi, trên dòng thời gian hiện bóng đúng độ dài
   ở đúng lane sẽ rơi vào (V1: vạch chèn + bóng; line phủ: bóng; line mới: vạch), vạch hít như khi kéo đoạn.
   Kéo sát mép trái / phải dòng thời gian thì tự cuộn, cả khi kéo đoạn có sẵn (bù phần đã cuộn để đoạn vẫn dưới con trỏ). */
const KEO_MEP = 40, KEO_BUOC = 12;
let KEO_TV = null;
function moTaKeo(o) {
  if (!o) return null;
  if (o.src) { const i = P.srcs.findIndex(s => s.id === o.src), s = P.srcs[i]; if (!s) return null; const ten = 'S' + (i + 1) + ' · ' + String(s.ten || '').replace(/\.[a-z0-9]{2,5}$/i, ''); return { loai: s.loai === 'anh' ? 'anh' : 'video', ten, dai: Math.max(1 / fpsDuAn(), (o.kt || s.giay || 3) - (o.bd || 0)) }; }
  if (o.fx) return { loai: 'fx', ten: o.loai === 'bo_loc' ? 'Bộ lọc' : 'Hiệu ứng', dai: 3 };
  if (o.chu != null) return { loai: 'chu', ten: 'Chữ', dai: 3 };
  return null;
}
function chipKeo(mt) {
  let c = $('#chipKeo'); if (!c) { c = el('div'); c.id = 'chipKeo'; document.body.appendChild(c); }
  c.className = 'chipKeo ' + mt.loai; c.innerHTML = ''; c.appendChild(el('i')); c.appendChild(el('b', null, mt.ten)); c.appendChild(el('span', null, fmt1(mt.dai) + 's'));
  return c;
}
function boBongKeo() {
  $$('#tlIn .bongKeo, #tlIn .vachChen').forEach(x => x.remove()); $$('#tlIn .chen, #tlIn .dich').forEach(x => x.classList.remove('chen', 'dich'));
  const t = $('#tlTren'); if (t) t.classList.remove('chen'); const sl = $('#snapLine'); if (sl) sl.style.display = 'none';
}
function oBong(tin, x, top, h, w, lop, nhan) {
  const g = el('div', 'bongKeo ' + lop); g.style.left = x + 'px'; g.style.top = top + 'px'; g.style.height = h + 'px'; g.style.width = Math.max(6, w) + 'px';
  if (nhan) g.appendChild(el('b', null, nhan)); tin.appendChild(g); return g;
}
function veBongKeo(e) {
  const tin = $('#tlIn'), o = KEO_TV; boBongKeo(); if (!tin || !o) return;
  const mt = moTaKeo(o); if (!mt) return;
  const r = tin.getBoundingClientRect(), t = Math.max(0, (e.clientX - r.left - LB) / PX()), xT = tg => LB + tg * PX(), yT = el2 => el2.getBoundingClientRect().top - r.top;
  if (o.fx || o.chu != null) {
    const it = e.target.closest && e.target.closest('.item[data-k="v"],.item[data-k="b"]'); if (it && o.fx) return;   /* thả lên đoạn: đoạn đã sáng viền (dropHot) */
    const v = el('div', 'vachChen'); v.style.left = xT(t) + 'px'; tin.appendChild(v); oBong(tin, xT(t), Math.max(0, yT($('#ruler') || tin) + 22), 20, mt.dai * PX(), mt.loai, (mt.loai === 'chu' ? 'Chữ mới' : mt.ten) + ' · ' + fmt1(mt.dai) + 's'); return;
  }
  const mTam = { t_bd: Math.max(0, hit(t)), bd: o.bd || 0, kt: o.kt }, dt = dichTha(e.clientY, 'b', mTam);
  if (dt && !dt.v1 && dt.lop != null) {
    dt.hang.classList.add(dt.moi ? 'chen' : 'dich'); const hr = dt.hang.getBoundingClientRect();
    if (dt.moi) oBong(tin, xT(mTam.t_bd), yT(dt.hang) - 9, 18, mt.dai * PX(), mt.loai + ' moi', 'Line mới · ' + fmt1(mt.dai) + 's');
    else oBong(tin, xT(mTam.t_bd), yT(dt.hang) + 3, hr.height - 6, mt.dai * PX(), mt.loai, mt.ten + ' · ' + fmt1(mt.dai) + 's');
    return;
  }
  const v1 = $('#tlIn .track.v1'); if (!v1) return;
  let acc = 0; for (let j = 0; j < P.clips.length; j++) { const len = daiC(P.clips[j]); if (t < acc + len / 2) break; acc += len; }
  const v = el('div', 'vachChen'); v.style.left = xT(acc) + 'px'; tin.appendChild(v);
  const hr = v1.getBoundingClientRect(); oBong(tin, xT(acc), yT(v1) + 3, hr.height - 6, mt.dai * PX(), mt.loai + ' chenV1', 'Chèn · ' + fmt1(mt.dai) + 's');
}
function cuonKhiKeo(clientX) {
  const sc = $('#tlScroll'); if (!sc) return 0; const r = sc.getBoundingClientRect();
  if (clientX > r.right - KEO_MEP && sc.scrollLeft < sc.scrollWidth - sc.clientWidth) return KEO_BUOC;
  if (clientX < r.left + LB + KEO_MEP && sc.scrollLeft > 0) return -KEO_BUOC;
  return 0;
}
function khoiTao09j() {
  const tin = $('#tlIn'), sc = $('#tlScroll'); if (!tin || !sc) return;
  /* kéo từ thư viện / bảng hiệu ứng / mẫu chữ: các nút đã setData ở bộ xử lý riêng, ở đây (pha nổi) đọc lại để vẽ chip + bóng */
  document.addEventListener('dragstart', e => {
    let o = null; try { o = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { }
    const mt = moTaKeo(o); KEO_TV = mt ? o : null; if (!mt) return; document.body.classList.add('keoTv');
    const ng = e.target.closest && e.target.closest('.fsrc, .canh, button'); if (ng) { ng.classList.add('keoNguon'); KEO_TV._ng = ng; }
    try { e.dataTransfer.setDragImage(chipKeo(mt), -10, -6); } catch { }
  });
  const xong = () => { if (KEO_TV && KEO_TV._ng) KEO_TV._ng.classList.remove('keoNguon'); document.body.classList.remove('keoTv'); KEO_TV = null; boBongKeo(); };
  document.addEventListener('dragend', xong); document.addEventListener('drop', () => setTimeout(boBongKeo, 0));
  tin.addEventListener('dragover', e => { if (KEO_TV) veBongKeo(e); });
  tin.addEventListener('dragleave', e => { if (!tin.contains(e.relatedTarget)) boBongKeo(); });
  document.addEventListener('dragover', e => { if (!KEO_TV) return; const r = sc.getBoundingClientRect(); if (e.clientY < r.top || e.clientY > r.bottom) return; const d = cuonKhiKeo(e.clientX); if (d) sc.scrollLeft += d * 2; });
  /* kéo đoạn có sẵn (P.dangKeo): sát mép thì cuộn; gửi lại pointermove đã cộng phần cuộn để keoItem tính đúng vị trí */
  const gia = new WeakSet(); let bu = 0, cuoi = null, chay = false;
  const phat = () => { if (!cuoi || !cuoi.tg || !document.contains(cuoi.tg)) return; const ev = new PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: cuoi.id, pointerType: cuoi.pt, clientX: cuoi.x + bu, clientY: cuoi.y, buttons: 1, altKey: cuoi.alt, shiftKey: cuoi.sh, ctrlKey: cuoi.ct, metaKey: cuoi.me }); gia.add(ev); cuoi.tg.dispatchEvent(ev); };
  const tick = () => { if (!P.dangKeo || !cuoi) { chay = false; return; } const d = cuonKhiKeo(cuoi.x); if (!d) { chay = false; return; } const s0 = sc.scrollLeft; sc.scrollLeft += d; bu += sc.scrollLeft - s0; phat(); requestAnimationFrame(tick); };
  window.addEventListener('pointerdown', () => { bu = 0; cuoi = null; }, true);
  window.addEventListener('pointermove', e => {
    if (gia.has(e) || !P.dangKeo || !(e.buttons & 1)) return;
    cuoi = { tg: e.target, id: e.pointerId, pt: e.pointerType, x: e.clientX, y: e.clientY, alt: e.altKey, sh: e.shiftKey, ct: e.ctrlKey, me: e.metaKey };
    if (!bu) { if (cuonKhiKeo(e.clientX) && !chay) { chay = true; requestAnimationFrame(tick); } return; }
    e.stopImmediatePropagation(); phat(); if (cuonKhiKeo(e.clientX) && !chay) { chay = true; requestAnimationFrame(tick); }
  }, true);
}
khoiTao09j();

/* ═════════ ĐỢT 12: khung xem trước gọn như Concat ═════════
   Nút lặp / scopes thành icon nét như các nút khác, ô lớp phủ có icon lưới,
   đồng hồ âm lượng nằm sát mép phải vùng xem (không còn là hộp nổi), có vạch thang dB. */
const IC_LAP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>';
const IC_SCOPE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>';
const IC_LUOI = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>';
const DB_THANG = [0, -6, -12, -24, -48];
function khoiTao09k() {
  [['#btnLap', IC_LAP, 'Phát lặp'], ['#btnScope', IC_SCOPE, 'Scopes màu']].forEach(([s, ic, ten]) => { const b = $(s); if (!b || b.dataset.ic12) return; b.dataset.ic12 = 1; b.innerHTML = ic; b.classList.add('ic12'); b.setAttribute('aria-label', ten); });
  if (!$('#ed') || !$('#ed').classList.contains('ccw')) return;
  const lp = $('#lopPhuChon'); if (lp && !lp.parentElement.classList.contains('lopPhuO')) { const o = el('label', 'lopPhuO'); o.title = lp.title; o.innerHTML = IC_LUOI; lp.before(o); o.appendChild(lp); }
  const m = $('#fcMeter'), kv = $('.ecol.giua .khungVung');
  if (m && kv && m.parentElement !== kv) {
    kv.appendChild(m); m.classList.add('docMep');
    if (!m.querySelector('.thang')) { const th = el('div', 'thang'); DB_THANG.forEach(d => { const v = el('span', null, String(d)); v.style.bottom = (100 * (1 + d / 60)) + '%'; th.appendChild(v); }); m.prepend(th); }
  }
}
khoiTao09k();

/* ═════════ ĐỢT 13: điện thoại ═════════
   Hàng công cụ dòng thời gian chỉ giữ nút hay dùng (to cỡ ngón tay, không phải vuốt); thanh thao tác đoạn thêm
   Lật / Xoay / Cắt khung / Đóng băng / Tách âm (bấm hộ nút gốc trên hàng công cụ); dưới V1 có làn gợi ý
   "Thêm âm thanh" / "Thêm chữ" như CapCut, chạm là mở đúng bảng. */
const DT_GIU = ['#btnHoanTac', '#btnLamLai', '#btnLichSu', '#btnKfNhanh', '#btnSnap'];
const DT_THEM = [['#btnLat', 'Lật'], ['#btnXoay90', 'Xoay'], ['#btnCrop', 'Cắt khung'], ['#btnDongBang', 'Đóng băng'], ['#btnTachAmTl', 'Tách âm']];
function gonCongCuDt() {
  const et = $('.etl .etool'); if (!et || et.dataset.dt13) return; et.dataset.dt13 = 1;
  const giu = new Set(DT_GIU.map(s => $(s)).filter(Boolean));
  et.querySelectorAll('button, .sep, input, select, label').forEach(x => { if (!giu.has(x)) x.classList.add('anDt'); });
  const kf = $('#btnKfNhanh'); if (kf) kf.classList.add('dtPhai');
}
function themNutDoanDt() {
  const tao = $('#mobTao'); if (!tao || tao.dataset.dt13) return; tao.dataset.dt13 = 1;
  const xoa = [...tao.children].find(b => /Xoá/.test(b.textContent));
  DT_THEM.forEach(([s, ten]) => { const g = $(s); if (!g) return; const b = el('button'); b.type = 'button'; b.innerHTML = '<i>' + ic(g.dataset.ic || 'panel') + '</i><span>' + ten + '</span>'; b.onclick = () => g.click(); xoa ? xoa.before(b) : tao.appendChild(b); });
}
function veLanGoiY() {
  const tin = $('#tlIn'); if (!tin) return; tin.querySelectorAll('.lanGoiY').forEach(x => x.remove());
  if (!laMobi() || !P.clips.length) return;
  const lan = el('div', 'lanGoiY'); lan.style.marginLeft = LB + 'px';
  [['am', 'audio', 'Thêm âm thanh', (P.am3 || []).length], ['chu', 'text', 'Thêm chữ', (P.gfx || []).length]].forEach(([tab, icn, ten, co]) => {
    if (co) return; const b = el('button', 'goiY'); b.type = 'button'; b.innerHTML = ic(icn) + '<span>' + ten + '</span>';
    b.onclick = () => { const t = $('.etabs [data-tab="' + tab + '"]'); if (t) t.click(); }; lan.appendChild(b);
  });
  lan.addEventListener('pointerdown', e => e.stopPropagation());   /* chạm nút gợi ý không tua đầu phát */
  if (lan.children.length) tin.appendChild(lan);
}
function khoiTao09l() {
  if (!$('#ed')) return;
  const lam = () => { if (!laMobi()) return; gonCongCuDt(); themNutDoanDt(); veLanGoiY(); };
  const veTlGoc = veTl; veTl = function () { const r = veTlGoc.apply(this, arguments); try { veLanGoiY(); } catch { } return r; };
  lam(); window.addEventListener('resize', () => setTimeout(lam, 80));
}
khoiTao09l();
