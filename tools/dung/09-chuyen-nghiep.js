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
function hexRgb(h) { h = String(h || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r) { return '#' + r.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
/* màu keyframe: nội suy từng kênh RGB theo đường cong của keyframe sau */
function mauKf(g, off) {
  const ds = g.kfs.mau; if (off <= ds[0].t) return ds[0].v; const cuoi = ds[ds.length - 1]; if (off >= cuoi.t) return cuoi.v;
  for (let i = 1; i < ds.length; i++) { const a = ds[i - 1], b = ds[i]; if (off <= b.t) { const p = (off - a.t) / Math.max(1e-4, b.t - a.t), e = (b.bz ? bezierFn(b.bz) : (EASE_KF[b.e] || EASE_KF.mem))(p), A = hexRgb(a.v), B = hexRgb(b.v); return rgbHex(A.map((x, j) => x + (B[j] - x) * e)); } }
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
