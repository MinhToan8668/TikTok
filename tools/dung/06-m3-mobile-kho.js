/* ═════════ CAPCUT 9.1 CHI TIẾT · M3: mở dự án CapCut (draft_info.json / draft_content.json) ═════════ */
const laDuAnCapCut = o => !!(o && o.materials && Array.isArray(o.tracks));
function ccTen(p) { return String(p || '').split(/[\\/]/).pop(); }
function ccMau(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : (/^#[0-9a-f]{8}$/i.test(c || '') ? '#' + c.slice(3) : null); }
function ccKf(seg, dai) {
  const ra = {}, MAP = { KFTypePositionX: ['x', v => v / 2], KFTypePositionY: ['y', v => -v / 2], KFTypeScaleX: ['sc', v => v], KFTypeScale: ['sc', v => v], KFTypeRotation: ['xoay', v => v], KFTypeAlpha: ['mo', v => v], KFTypeVolume: ['am', v => v] };
  (seg.common_keyframes || []).forEach(k => { const m = MAP[k.property_type]; if (!m) return; const ds = (k.keyframe_list || []).map(f => ({ t: +Math.max(0, Math.min(dai, (f.time_offset || 0) / 1e6)).toFixed(3), v: +m[1](+(f.values || [0])[0] || 0).toFixed(4), e: f.curveType === 'Hold' ? 'giu' : f.curveType === 'Bezier' ? 'mem' : 'deu' })).sort((a, b) => a.t - b.t); if (ds.length) ra[m[0]] = ds; });
  return Object.keys(ra).length ? ra : null;
}
function ccBienDoi(seg, m) { const c = seg.clip || {}, sc = c.scale ? +c.scale.x || 1 : 1, tf = c.transform || {}; if (Math.abs(sc - 1) > 1e-4) m.sc = +sc.toFixed(4); if (tf.x) m.x = +(tf.x / 2).toFixed(4); if (tf.y) m.y = +(-tf.y / 2).toFixed(4); if (c.rotation) m.xoay = +c.rotation; if (c.alpha != null && c.alpha < 1) m.mo = +c.alpha; if (c.flip && c.flip.horizontal) m.latX = true; if (c.flip && c.flip.vertical) m.latY = true; if (seg.speed && Math.abs(seg.speed - 1) > 1e-4) m.toc = +(+seg.speed).toFixed(3); if (seg.volume != null && Math.abs(seg.volume - 1) > 1e-4) m.am = +(+seg.volume).toFixed(3); if (seg.reverse) m.dao = true; }
function ccChu(t, seg) {
  let noi = ''; try { const c = typeof t.content === 'string' ? JSON.parse(t.content) : t.content; noi = c && c.text != null ? c.text : ''; } catch { } if (!noi) noi = t.base_content || t.recognize_text || t.text || '';
  const g = { id: uid(), kieu: 'chu', bd: 0, kt: 0, text: String(noi), phu: '', x: 0.5, y: 0.5, co: +Math.max(0.03, Math.min(0.2, (t.font_size || 15) * 0.005)).toFixed(3), mau: ccMau(t.text_color) || '#ffffff', nen: 'khong', hu: 'khong', ra: 'khong' };
  if (t.bold_width > 0) g.dam = 900; else g.dam = 700; if (t.italic_degree > 0) g.nghieng = true; if (t.underline) g.gach = true;
  if (t.border_width > 0) { g.nen = 'vien'; g.vien_mau = ccMau(t.border_color) || '#000000'; g.vien_day = +Math.min(0.4, t.border_width * 2).toFixed(3); }
  if (t.background_alpha > 0 && t.background_color) { g.nen = 'hop'; g.nen_mau = ccMau(t.background_color) || '#0a0c0e'; g.nen_mo = +t.background_alpha; g.nen_bo = +(t.background_round_radius || 0); }
  if (t.has_shadow) { g.bong = true; g.bongChu = { mau: ccMau(t.shadow_color) || '#000000', mo: t.shadow_alpha == null ? 0.9 : +t.shadow_alpha, nhoe: t.shadow_smoothing == null ? 0.45 : +t.shadow_smoothing, kc: (t.shadow_distance || 5) / 100, goc: t.shadow_angle == null ? -45 : +t.shadow_angle }; }
  if (t.alignment === 0) g.can = 'left'; else if (t.alignment === 2) g.can = 'right'; if (t.typesetting === 1) g.doc = true; if (t.letter_spacing) g.gianChu = +t.letter_spacing / 100; if (t.text_curve && t.text_curve.angle) g.cong = +Math.max(-100, Math.min(100, t.text_curve.angle / 3.6)).toFixed(0);
  const tf = (seg.clip || {}).transform || {}; g.x = +(0.5 + (tf.x || 0) / 2).toFixed(4); g.y = +(0.5 - (tf.y || 0) / 2).toFixed(4); if (seg.clip && seg.clip.rotation) g.xoay = +seg.clip.rotation; if (seg.clip && seg.clip.alpha != null && seg.clip.alpha < 1) g.mo = +seg.clip.alpha;
  if (t.text_alpha != null && t.text_alpha < 1) g.mo = +t.text_alpha; return g;
}
function nhapCapCut(o, tenGoiY) {
  const M = o.materials || {}, byId = {}; ['videos', 'audios', 'texts', 'stickers', 'images', 'speeds', 'shapes'].forEach(k => (M[k] || []).forEach(x => { byId[x.id] = Object.assign({ _loai: k }, x); }));
  const srcs = [], thieuAm = [], boQua = {}, cli = [], broll = [], gfx = [], pdNgoai = [], srcCua2 = {};
  const laySrc = v => { if (srcCua2[v.id]) return srcCua2[v.id]; const anh = v.type === 'photo' || /\.(png|jpe?g|webp|gif)$/i.test(ccTen(v.path)); const s = { id: v.id, ten: v.material_name && /\.\w{2,4}$/.test(v.material_name) ? v.material_name : ccTen(v.path) || (v.material_name || 'media'), size: null, loai: anh ? 'anh' : 'video', giay: anh ? Math.max(1, (v.duration || 5e6) / 1e6) : +((v.duration || 0) / 1e6).toFixed(3), w: v.width || 0, h: v.height || 0, tu: [], cau: [], canh: [], khoanh_khac: [], loai_canh: anh ? 'broll' : '', mo_ta: '', mat: [], hook_goi_y: [], nhan_manh: [] }; srcCua2[v.id] = s; srcs.push(s); return s; };
  const videoTracks = (o.tracks || []).filter(t => t.type === 'video' && (t.segments || []).length);
  videoTracks.forEach((tr, ti) => {
    const segs = (tr.segments || []).slice().sort((a, b) => a.target_timerange.start - b.target_timerange.start);
    if (ti === 0) { let acc = 0; segs.forEach(seg => { const v = byId[seg.material_id]; if (!v || v._loai !== 'videos') { boQua[seg.material_id] = 1; return; } const s = laySrc(v), ts = seg.target_timerange.start / 1e6, td = seg.target_timerange.duration / 1e6, ss = (seg.source_timerange || { start: 0, duration: seg.target_timerange.duration }).start / 1e6, sd = (seg.source_timerange || { duration: seg.target_timerange.duration }).duration / 1e6; if (ts - acc > 0.04) cli.push({ trong: true, src: '', bd: 0, kt: +(ts - acc).toFixed(3) }); const c = { src: s.id, bd: +ss.toFixed(3), kt: +(ss + sd).toFixed(3), ly_do: 'CapCut' }; if (s.loai === 'anh') { c.bd = 0; c.kt = +td.toFixed(3); if (td > s.giay) s.giay = +td.toFixed(3); } ccBienDoi(seg, c); const kf = ccKf(seg, td); if (kf) c.kfs = kf; cli.push(c); acc = ts + td; }); }
    else segs.forEach(seg => { const v = byId[seg.material_id]; if (!v || v._loai !== 'videos') { boQua[seg.material_id] = 1; return; } const s = laySrc(v), ts = seg.target_timerange.start / 1e6, td = seg.target_timerange.duration / 1e6, ss = (seg.source_timerange || { start: 0 }).start / 1e6, sd = (seg.source_timerange || { duration: seg.target_timerange.duration }).duration / 1e6; const b = { id: uid(), src: s.id, bd: s.loai === 'anh' ? 0 : +ss.toFixed(3), kt: s.loai === 'anh' ? +td.toFixed(3) : +(ss + sd).toFixed(3), t_bd: +ts.toFixed(3), kieu: 'full', lop: ti }; if (s.loai === 'anh' && td > s.giay) s.giay = +td.toFixed(3); ccBienDoi(seg, b); const kf = ccKf(seg, td); if (kf) b.kfs = kf; broll.push(b); });
  });
  let lopChu = videoTracks.length + 1;
  (o.tracks || []).filter(t => t.type === 'text' || t.type === 'sticker').forEach(tr => { let coChu = false; (tr.segments || []).forEach(seg => { const t = byId[seg.material_id]; if (!t) return; const ts = seg.target_timerange.start / 1e6, td = seg.target_timerange.duration / 1e6;
      if (t._loai === 'texts' && t.type === 'subtitle') { let noi = ''; try { noi = JSON.parse(t.content).text; } catch { noi = t.recognize_text || ''; } const c = { bd: +ts.toFixed(3), kt: +(ts + td).toFixed(3), text: String(noi || '').replace(/\n/g, ' ') }; if (t.words && t.words.text && t.words.text.length) c.tu = t.words.text.map((w, i) => ({ w, bd: +((t.words.start_time[i] || 0) / 1e6).toFixed(3), kt: +((t.words.end_time[i] || 0) / 1e6).toFixed(3) })); pdNgoai.push(c); return; }
      if (t._loai === 'texts') { const g = ccChu(t, seg); g.bd = +ts.toFixed(3); g.kt = +(ts + td).toFixed(3); g.lop = lopChu; const kf = ccKf(seg, td); if (kf) g.kfs = kf; gfx.push(g); coChu = true; return; }
      if (t._loai === 'stickers') { const tf = (seg.clip || {}).transform || {}; gfx.push({ id: uid(), kieu: 'sticker', bd: +ts.toFixed(3), kt: +(ts + td).toFixed(3), text: '✨', phu: '', x: +(0.5 + (tf.x || 0) / 2).toFixed(4), y: +(0.5 - (tf.y || 0) / 2).toFixed(4), co: 0.16, hu: 'khong', lop: lopChu, ghi: 'sticker CapCut: ' + (t.name || t.sticker_id || '') }); coChu = true; } }); if (coChu) lopChu++; });
  (o.tracks || []).filter(t => t.type === 'audio').forEach(tr => (tr.segments || []).forEach(seg => { const a = byId[seg.material_id]; if (a) thieuAm.push(ccTen(a.path) || a.name || a.material_name || 'âm thanh'); }));
  const cc = o.canvas_config || {}, ratio = cc.width && cc.height ? cc.width / cc.height : 9 / 16; let tiLe = '9:16', dmin = 1e9; Object.keys(TI_LE).forEach(k => { const [a, b] = TI_LE[k], d = Math.abs(a / b - ratio); if (d < dmin) { dmin = d; tiLe = k; } });
  pdNgoai.sort((a, b) => a.bd - b.bd); const ten = (o.name && o.name !== 'undefined' ? o.name : tenGoiY || 'Dự án CapCut').slice(0, 80);
  const duAn = { v: 4, ten, srcs, clips: cli, gfx, broll, pdNgoai: pdNgoai.length ? pdNgoai : null, moc: (o.time_marks || []).map(m => ({ t: +((m.time || m.start || 0) / 1e6).toFixed(2), ten: m.name || m.text || 'Mốc' })), cai: { tiLe } };
  return { duAn, thieuAm: [...new Set(thieuAm)], soBoQua: Object.keys(boQua).length };
}
async function moCapCut(f) {
  let o; try { o = JSON.parse(await f.text()); } catch { toast('File không phải JSON'); return; } if (!laDuAnCapCut(o)) { toast('Không phải dự án CapCut (cần draft_info.json hoặc draft_content.json có materials + tracks)'); return; }
  const { duAn, thieuAm, soBoQua } = nhapCapCut(o, f.name.replace(/\.json$/i, '')); if (!duAn.clips.length && !duAn.broll.length && !duAn.gfx.length) { toast('Dự án CapCut này không có đoạn nào đọc được'); return; }
  await tuLuu(true).catch(() => { }); P.duAnId = 'da_' + uid(); P.duAnCho = duAn; $('#tenDuAn').value = duAn.ten; $('#tiLe').value = duAn.cai.tiLe; $('#tiLe').dispatchEvent(new Event('change')); $('#qlHop').classList.remove('mo');
  P.pdNgoai = duAn.pdNgoai; P.moc = duAn.moc || []; cumKey = ''; if (duAn.pdNgoai) { $('#phuDe').checked = true; $('#srtTt').textContent = 'Phụ đề lấy từ dự án CapCut (' + duAn.pdNgoai.length + ' câu)'; $('#btnBoSrt').hidden = false; }
  const can = duAn.srcs.map(s => s.ten); P.ccCho = { can, thieuAm }; veBaoCapCut();
  nhanDuAn(); veTl(); veKhung(); toast('Đã đọc dự án CapCut: ' + duAn.clips.filter(c => !c.trong).length + ' đoạn chính, ' + duAn.broll.length + ' lớp phủ, ' + duAn.gfx.length + ' chữ/sticker' + (duAn.pdNgoai ? ', ' + duAn.pdNgoai.length + ' câu phụ đề' : '') + (soBoQua ? ' · bỏ qua ' + soBoQua + ' mục không hỗ trợ' : ''));
}
function veBaoCapCut() { const tt = $('#srcStatus'); if (!tt || !P.ccCho) return; const con = P.ccCho.can.filter(t => !P.srcs.some(s => s.ten === t)); tt.innerHTML = con.length ? '📥 Dự án CapCut cần thêm ' + con.length + ' file footage: <b>' + con.slice(0, 6).map(x => x.replace(/</g, '&lt;')).join(', ') + (con.length > 6 ? '…' : '') + '</b> (kéo vào ô Thêm footage, máy tự khớp theo tên)' + (P.ccCho.thieuAm.length ? '<br>🔈 Âm thanh không mang sang được, thêm lại ở tab Âm thanh: ' + P.ccCho.thieuAm.slice(0, 4).join(', ') : '') : (P.ccCho.thieuAm.length ? '🔈 Âm thanh của dự án CapCut cần thêm lại: ' + P.ccCho.thieuAm.slice(0, 4).join(', ') : ''); if (!con.length && !P.ccCho.thieuAm.length) P.ccCho = null; }
function khoiTaoM3() {
  $('#qlCapCutIn').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) moCapCut(f); };
  const cu = $('#moDAIn').onchange; $('#moDAIn').onchange = async e => { const f = e.target.files[0]; if (f) { let o = null; try { o = JSON.parse(await f.text()); } catch { } if (o && laDuAnCapCut(o)) { e.target.value = ''; moCapCut(f); return; } } return cu.call(this, e); };
  const _them = themFile; themFile = async function (files) { const r = await _them(files); if (P.ccCho) veBaoCapCut(); return r; };
}

/* ═════════ THEO ẢNH CAPCUT: nhoè chuyển động, lưới hoạt ảnh Vào/Ra/Kết hợp, Menu, Phím tắt, ảnh bìa, danh sách hiệu ứng âm thanh, Áp cho tất cả ═════════ */
/* ── Nhoè chuyển động (Motion blur): xuất và xem (dừng) lấy nhiều mẫu quanh thời điểm rồi trộn; khi phát dùng vệt khung trước ── */
const MB_MAU = { 1: 4, 2: 6 };
function mbTai(t) { const { clip } = viTri(t), c = P.clips[clip]; if (c && c.mb && c.mb.bat) return c.mb; const b = P.broll.find(x => x.mb && x.mb.bat && t >= x.t_bd && t < x.t_bd + (x.kt - x.bd) / tocC(x)); return b ? b.mb : null; }
const mbCv = document.createElement('canvas'), mbAcc = document.createElement('canvas');
async function veKhungMb(ctx, W, H, t, veGoc) {
  const mb = mbTai(t); if (!mb) return false; const N = MB_MAU[mb.lan] || 4, r = (mb.blur || 0) / 100 * 0.05, tong = tongGiay(); if (r <= 0) return false;
  const lo = mb.huong === 'toi' ? 0 : -r, hi = mb.huong === 'lui' ? 0 : r; if (mbAcc.width !== W || mbAcc.height !== H) { mbAcc.width = W; mbAcc.height = H; } const g = mbAcc.getContext('2d'); g.clearRect(0, 0, W, H);
  for (let i = 0; i < N; i++) { const tt = Math.max(0, Math.min(tong - 0.001, t + lo + (hi - lo) * (N === 1 ? 0 : i / (N - 1)))); await veGoc(ctx, W, H, tt); g.globalAlpha = 1 / (i + 1); g.drawImage(ctx.canvas, 0, 0); }
  g.globalAlpha = 1; if (mb.blend > 0) { await veGoc(ctx, W, H, t); g.globalAlpha = mb.blend / 100; g.drawImage(ctx.canvas, 0, 0); g.globalAlpha = 1; }
  ctx.clearRect(0, 0, W, H); ctx.drawImage(mbAcc, 0, 0); return true;
}
function mbVet(ctx, W, H, mb, moi) { if (mbCv.width !== W || mbCv.height !== H) { mbCv.width = W; mbCv.height = H; moi = true; } if (!moi && mb) { ctx.save(); ctx.globalAlpha = 0.25 + 0.5 * (mb.blur || 0) / 100 * (1 - (mb.blend || 0) / 100); ctx.drawImage(mbCv, 0, 0); ctx.restore(); } const g = mbCv.getContext('2d'); g.clearRect(0, 0, W, H); g.drawImage(ctx.canvas, 0, 0); }
function veThuocTinhMb(box, k, m) {
  const n = el('div', 'nhom2'); const b = el('b', null, 'Nhoè chuyển động'); n.appendChild(b); box.appendChild(n); m.mb = m.mb || { bat: false, blur: 50, blend: 0, huong: 'ca_hai', lan: 1 };
  const l = el('label'); l.appendChild(el('span', null, 'Bật nhoè chuyển động')); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!m.mb.bat; cb.onchange = () => { luuHoanTac(); m.mb.bat = cb.checked; veProp(); veKhung(); }; l.appendChild(cb); n.appendChild(l);
  if (!m.mb.bat) return; oTruot(n, 'Độ nhoè', 0, 100, 1, m.mb.blur, v => Math.round(v) + '', v => { m.mb.blur = v; }); oTruot(n, 'Trộn với khung gốc', 0, 100, 1, m.mb.blend, v => Math.round(v) + '', v => { m.mb.blend = v; });
  oChon(n, 'Hướng', [['ca_hai', 'Cả hai'], ['toi', 'Tới'], ['lui', 'Lùi']], m.mb.huong || 'ca_hai', v => { m.mb.huong = v; }); oChon(n, 'Số lần lấy mẫu', [['1', '4 mẫu (nhanh)'], ['2', '6 mẫu (mượt)']], String(m.mb.lan || 1), v => { m.mb.lan = +v; });
  n.appendChild(el('div', 'quota', 'Khi phát: nhoè xấp xỉ bằng vệt khung trước. Khi dừng và khi xuất: lấy nhiều mẫu quanh thời điểm nên chậm hơn.')); nutApTatCa(n, k, ['mb']);
}
/* ── Áp cho tất cả (mục cùng loại) ── */
function nutApTatCa(n, k, keys, ten) { const r = el('div', 'row'); r.style.justifyContent = 'flex-end'; const b = el('button', 'btn nho ghost', ten || 'Áp cho tất cả'); b.type = 'button'; b.title = 'Áp các thiết lập này cho mọi mục cùng loại'; b.onclick = () => { const m = mucChon(); if (!m) return; const ds = MANG()[k] || []; luuHoanTac(); let so = 0; ds.forEach(x => { if (x === m || x.trong) return; keys.forEach(p => { if (m[p] === undefined) delete x[p]; else x[p] = JSON.parse(JSON.stringify(m[p])); }); so++; }); veTl(); veKhung(); toast('Đã áp cho ' + so + ' mục khác'); }; r.appendChild(b); n.appendChild(r); }
/* ── Hoạt ảnh: lưới Vào / Ra / Kết hợp có xem trước ── */
const AN_KET_HOP = { phong_thu: ['phong', 'thu', 'Phóng vào · thu ra'], mo_mo: ['mo', 'mo', 'Hiện · mờ dần'], trai_phai: ['trai', 'phai', 'Trượt ngang'], len_xuong: ['len', 'xuong', 'Trượt dọc'], xoay_xoay: ['xoay', 'xoay', 'Xoay vào · ra'], nay_mo: ['nay', 'mo', 'Nảy · mờ'], nhoe_nhoe: ['mo_nhoe', 'mo_nhoe', 'Nhoè vào · ra'], rung_thu: ['rung', 'thu', 'Rung · thu'] };
function veHoatAnh(box, m) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Hoạt ảnh vào / ra')); box.appendChild(n); const tab = P.anTab || 'vao';
  const r = el('div', 'row anTab'); [['vao', 'Vào'], ['ra', 'Ra'], ['ket_hop', 'Kết hợp']].forEach(([k, t]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.setAttribute('aria-pressed', String(tab === k)); b.onclick = () => { P.anTab = k; veProp(); }; r.appendChild(b); }); n.appendChild(r);
  const luoi = el('div', 'mauCong anLuoi'), hien = tab === 'vao' ? (m.anVao || {}).id || 'khong' : tab === 'ra' ? (m.anRa || {}).id || 'khong' : (Object.keys(AN_KET_HOP).find(k => m.anVao && m.anRa && m.anVao.id === AN_KET_HOP[k][0] && m.anRa.id === AN_KET_HOP[k][1]) || 'khong');
  const ds = tab === 'ket_hop' ? [['khong', 'Không', 'khong'], ...Object.entries(AN_KET_HOP).map(([k, v]) => [k, v[2], v[0]])] : Object.keys(AN).map(k => [k, AN[k], k]);
  ds.forEach(([id, ten, xem]) => { const b = el('button', hien === id ? 'on' : null); b.type = 'button'; b.dataset.an = id; const x = el('div', 'anXem'); x.appendChild(el('i', 'an-' + xem + (tab === 'ra' ? ' nguoc' : ''))); b.appendChild(x); b.appendChild(el('span', null, ten));
    b.onclick = () => { luuHoanTac(); if (tab === 'vao') m.anVao = { id, d: (m.anVao || {}).d || 0.5 }; else if (tab === 'ra') m.anRa = { id, d: (m.anRa || {}).d || 0.5 }; else if (id === 'khong') { m.anVao = { id: 'khong' }; m.anRa = { id: 'khong' }; } else { m.anVao = { id: AN_KET_HOP[id][0], d: (m.anVao || {}).d || 0.5 }; m.anRa = { id: AN_KET_HOP[id][1], d: (m.anRa || {}).d || 0.5 }; } veProp(); veKhung(); }; luoi.appendChild(b); }); n.appendChild(luoi);
  const dai = daiMuc(P.chon ? P.chon.k : 'v', m);
  if (tab !== 'ra' && m.anVao && m.anVao.id !== 'khong') oTruot(n, 'Thời lượng vào', 0.1, Math.max(0.2, Math.min(3, dai)), 0.05, m.anVao.d || 0.5, v => v.toFixed(2) + 's', v => { m.anVao.d = v; });
  if (tab !== 'vao' && m.anRa && m.anRa.id !== 'khong') oTruot(n, 'Thời lượng ra', 0.1, Math.max(0.2, Math.min(3, dai)), 0.05, m.anRa.d || 0.5, v => v.toFixed(2) + 's', v => { m.anRa.d = v; });
  if (P.chon) nutApTatCa(n, P.chon.k, ['anVao', 'anRa']);
}
/* ── Menu, Phím tắt, ảnh bìa ── */
function moMenuChinh(e) { const r = e.currentTarget.getBoundingClientRect(); moMenu(r.left, r.bottom + 4, [{ ic: 'media', t: 'Dự án mới', k: 'Ctrl+N', f: () => { if (confirm('Tạo dự án mới? Dự án hiện tại đã được tự lưu.')) duAnMoi(); } }, { ic: 'grid', t: 'Dự án của tôi…', f: () => veQuanLy('ds') }, { ic: 'copy', t: 'Mở dự án / CapCut (.json)…', f: () => $('#moDAIn').click() }, { ic: 'copy', t: 'Lưu dự án ra file', k: 'Ctrl+S', f: () => $('#btnLuuDA').click() }, '-', { ic: 'media', t: 'Nhập footage…', k: 'Ctrl+I', f: () => $('#fileIn').click() }, { ic: 'export', t: 'Xuất…', k: 'Ctrl+M', f: () => $('#btnXuat').click() }, '-', { ic: 'gear', t: 'Cài đặt…', f: () => moCaiDat() }, { ic: 'kbd', t: 'Phím tắt', k: '?', f: () => $('#phimHop').classList.add('mo') }, { ic: 'full', t: 'Toàn màn hình làm việc', f: () => $('#btnToanApp').click() }]); }
function datBia() { P.bia = anhBia(); if (!P.bia) { toast('Chưa có khung hình'); return; } henLuu(); toast('Đã đặt khung này làm ảnh bìa dự án'); }
/* ── Hiệu ứng âm thanh: danh sách có nghe thử, yêu thích, thêm ── */
function sfxYeu() { try { return JSON.parse(localStorage.getItem('dv_sfx_yeu') || '[]'); } catch { return []; } }
function veSfxDs() {
  const box = $('#sfxLuoi'); if (!box) return; box.classList.remove('mauLuoi'); box.classList.add('sfxDs'); box.innerHTML = ''; const yeu = sfxYeu(), loc = P.sfxLoc || 'tat';
  const th = el('div', 'row sfxLoc'); [['tat', 'Tất cả'], ['yeu', '⭐ Yêu thích']].forEach(([k, t]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.setAttribute('aria-pressed', String(loc === k)); b.onclick = () => { P.sfxLoc = k; veSfxDs(); }; th.appendChild(b); }); box.appendChild(th);
  Object.entries(SFX).forEach(([k, [ten, dai]]) => { if (loc === 'yeu' && !yeu.includes(k)) return; const m = ten.match(/^(\S+)\s+(.*)$/); const b = el('button', 'sfxHang'); b.type = 'button'; b.dataset.k = k; b.title = 'Thêm tại đầu phát';
    b.innerHTML = '<span class="ic">' + (m ? m[1] : '🔊') + '</span><span class="ten"><b>' + (m ? m[2] : ten) + '</b><small>' + fmt1(dai) + 's</small></span>';
    const nghe = el('span', 'nut'); nghe.textContent = '▶'; nghe.title = 'Nghe thử'; nghe.onclick = e => { e.stopPropagation(); am3Nghe({ kho: 'sfx:' + k, bd: 0, kt: dai, am: 1, fi: 0, fo: 0 }); };
    const sao = el('span', 'nut' + (yeu.includes(k) ? ' on' : '')); sao.textContent = yeu.includes(k) ? '★' : '☆'; sao.title = 'Yêu thích'; sao.onclick = e => { e.stopPropagation(); const y = sfxYeu(), i = y.indexOf(k); if (i >= 0) y.splice(i, 1); else y.push(k); try { localStorage.setItem('dv_sfx_yeu', JSON.stringify(y)); } catch { } veSfxDs(); };
    const them = el('span', 'nut them'); them.textContent = '+'; them.title = 'Thêm vào dòng thời gian tại đầu phát';
    b.appendChild(nghe); b.appendChild(sao); b.appendChild(them); b.onclick = () => themAm3('sfx:' + k, m ? m[2] : ten, 'sfx'); box.appendChild(b); });
  if (box.children.length === 1) box.appendChild(el('div', 'quota', 'Chưa có hiệu ứng yêu thích. Bấm ☆ ở hiệu ứng để lưu.'));
}
function khoiTaoN() {
  $('#btnMenu').onclick = moMenuChinh; $('#btnPhimTat').onclick = () => $('#phimHop').classList.add('mo');
  const lb = $('.track.v1 .lb'); if (lb) { const b = el('button', 'btnBia'); b.type = 'button'; b.textContent = 'Bìa'; b.title = 'Đặt khung tại đầu phát làm ảnh bìa dự án'; b.onclick = e => { e.stopPropagation(); datBia(); }; lb.appendChild(b); }
  veSfxDs();
  const veKhungXuatGoc = veKhungXuat; veKhungXuat = async function (ctx, W, H, t) { if (mbTai(t) && await veKhungMb(ctx, W, H, t, veKhungXuatGoc)) return; return veKhungXuatGoc(ctx, W, H, t); };
  let mbXemBan = false; const veKhungGoc = veKhung; veKhung = async function () { const r = await veKhungGoc.apply(this, arguments); if (!P.dang && !mbXemBan && mbTai(P.t)) { mbXemBan = true; const t0 = P.t; try { await veKhungMb(cx, cv.width, cv.height, t0, veKhungXuatGoc); } catch { } mbXemBan = false; if (P.t === t0 && !P.dang) veTay(); } return r; };
}

/* ═════════ BỐ CỤC ĐIỆN THOẠI KIỂU CAPCUT MOBILE: trình phát trên, dòng thời gian giữa, thanh công cụ dưới, bảng trượt lên ═════════ */
const laMobi = () => matchMedia('(max-width:760px)').matches;
function doHBar() { const e = $('.ecol.trai .etabs'); if (e) $('#ed').style.setProperty('--hBar', e.offsetHeight + 'px'); }
function datMobi() { const ed = $('#ed'), m = laMobi(); ed.classList.toggle('mobi', m); setTimeout(doHBar, 0); if (m) { ed.classList.add('full'); document.body.classList.add('edFull'); if (ed.classList.contains('co-phai')) ed.classList.remove('sheet'); } else { ed.classList.remove('sheet', 'coChonM'); } if (!P.dang) setTimeout(veKhung, 60); }
function moSheet(bat) { const ed = $('#ed'); if (!laMobi()) return; ed.classList.toggle('sheet', bat); if (bat) { ed.classList.remove('co-phai'); const t = $('.etabs [data-tab][aria-selected="true"]'); $('#sheetTen').textContent = t ? t.textContent.replace(/\d+$/, '').trim() : ''; } }
function veTaoMobi() { const ed = $('#ed'); if (laMobi()) doHBar(); ed.classList.toggle('coChonM', laMobi() && !!P.chon && !ed.classList.contains('sheet')); if (laMobi() && !P.chon && dsNhieu().length < 2) ed.classList.remove('co-phai'); }
function khoiTaoMobi() {
  const trai = $('.ecol.trai'); const dau = el('div', 'sheetDau'); dau.innerHTML = '<span id="sheetTen"></span>'; const x = el('button', 'btn nho xanh'); x.type = 'button'; x.id = 'sheetDong'; x.textContent = '✓'; x.title = 'Xong'; x.onclick = () => moSheet(false); dau.appendChild(x); trai.appendChild(dau);
  const tao = el('div'); tao.id = 'mobTao'; const nut = (ic, t, f) => { const b = el('button'); b.type = 'button'; b.innerHTML = '<i>' + ic + '</i><span>' + t + '</span>'; b.onclick = f; tao.appendChild(b); };
  nut('✂', 'Tách', () => lenh('tach')); nut('⏱', 'Tốc độ', () => { P.propTab = 'Tốc độ'; moSheet(false); $('#ed').classList.add('co-phai'); veProp(); moTabProp('Tốc độ'); }); nut('🔊', 'Âm lượng', () => { moSheet(false); $('#ed').classList.add('co-phai'); veProp(); moTabProp('Âm thanh'); });
  nut('✨', 'Hoạt ảnh', () => { moSheet(false); $('#ed').classList.add('co-phai'); veProp(); moTabProp('Hoạt ảnh'); }); nut('⧉', 'Nhân đôi', () => lenh('nhan')); nut('⚙', 'Thuộc tính', () => { moSheet(false); $('#ed').classList.add('co-phai'); veProp(); }); nut('🗑', 'Xoá', () => lenh('xoa')); nut('✕', 'Bỏ chọn', () => { P.chon = null; P.nhieu = []; chonHien(); veProp(); $('#ed').classList.remove('co-phai'); });
  $('#ed').appendChild(tao);
  const chonHienCu = chonHien; chonHien = function () { chonHienCu.apply(this, arguments); veTaoMobi(); };
  const doiTabCu = doiTab; doiTab = function (t) { const cung = laMobi() && $('#ed').classList.contains('sheet') && $('[data-pane="' + t + '"]').classList.contains('on'); doiTabCu(t); if (laMobi()) moSheet(!cung); };
  $('#btnDongPhai').addEventListener('click', () => veTaoMobi());
  // dòng thời gian: ngón tay cuộn, hai ngón phóng to / thu nhỏ
  const sc = $('#tlScroll'); let pinch = null;
  sc.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), px: P.pxs }; } }, { passive: true });
  sc.addEventListener('touchmove', e => { if (!pinch || e.touches.length !== 2) return; e.preventDefault(); const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), px = Math.round(Math.max(6, Math.min(80, pinch.px * d / pinch.d))); if (px !== P.pxs) { P.pxs = px; $('#zoomTl').value = px; veTl(); } }, { passive: false });
  sc.addEventListener('touchend', () => { pinch = null; }, { passive: true });
  datMobi(); addEventListener('resize', datMobi);
}

/* ===== Bố cục CapCut Web (capcut-clone-spec/SPEC.md): rail 71 + thư viện 327, thanh trên 56 kính mờ, nút Tỉ lệ, bảng thuộc tính nổi, timeline toolbar giữa, Hand (H), zoom khung, ẩn timeline ===== */
const CC_TC = t => fmtTC(t);   /* spec 2.1: giờ:phút:giây:khung theo fps dự án */
function ccwBat() { return $('#ed').classList.contains('ccw'); }
function ccDatTay(bat) { const ed = $('#ed'); P.ccTay = !!bat; ed.classList.toggle('tay', P.ccTay); const h = $('#btnTayCT'), c = $('#btnChonCT'); if (h) h.setAttribute('aria-pressed', String(P.ccTay)); if (c) c.setAttribute('aria-pressed', String(!P.ccTay)); if (P.ccTay && P.cheDo === 'cat') { P.ccDangTay = true; datCheDo('chon', true); P.ccDangTay = false; } }
function ccNhanZoom() { const z = $('#zoomKhung'); if (!z) return 'Vừa'; return z.value === 'vua' ? 'Vừa' : Math.round(+z.value * 100) + '%'; }
function ccDatZoom(v) { const z = $('#zoomKhung'); if (!z) return; z.value = String(v); z.dispatchEvent(new Event('change')); }
function ccThuGon(bat) { const ed = $('#ed'); ed.classList.toggle('thuGon', bat == null ? !ed.classList.contains('thuGon') : !!bat); const t = $('#ccThu'); if (t) { t.textContent = ed.classList.contains('thuGon') ? '›' : '‹'; t.title = ed.classList.contains('thuGon') ? 'Mở bảng thư viện (Ctrl+/)' : 'Thu gọn bảng thư viện (Ctrl+/)'; } try { localStorage.setItem('dv_thuGon', ed.classList.contains('thuGon') ? '1' : '0'); } catch { } if (!P.dang) setTimeout(veKhung, 60); }
function ccAnTl(bat) { const ed = $('#ed'); ed.classList.toggle('anTl', bat == null ? !ed.classList.contains('anTl') : !!bat); const b = $('#btnAnTl'); if (b) b.setAttribute('aria-pressed', String(ed.classList.contains('anTl'))); if (!P.dang) setTimeout(veKhung, 60); }
function ccMenuTen(e) { const r = e.currentTarget.getBoundingClientRect(); moMenu(r.left, r.bottom + 6, [{ ic: 'text', t: 'Đổi tên', f: () => { const i = $('#tenDuAn'); i.focus(); i.select(); } }, { ic: 'copy', t: 'Nhân bản dự án', f: () => { $('#btnDuAn').click(); toast('Bấm ⧉ cạnh dự án để nhân bản'); } }, { ic: 'media', t: 'Dự án của tôi', k: 'Ctrl+O', f: () => $('#btnDuAn').click() }]); }
function khoiTaoCCW() {
  if (typeof laMobi === 'function' && laMobi()) return;
  const ed = $('#ed'); ed.classList.add('ccw'); P.ccwInit = true; LB = 110;
  IC.hand = '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>';
  IC.ratio = '<path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><rect x="8" y="8" width="8" height="8" rx="1"/>';
  IC.dots = '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>';
  IC.tlOff = '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/>';
  // thanh trên: nhóm giữa Select / Hand / zoom / hoàn tác / làm lại
  const top = $('.etop'), mid = el('div', 'ccMid'); mid.innerHTML = '<button class="ccIc" id="btnChonCT" type="button" title="Chọn (V)" aria-pressed="true">' + ic('cursor') + '</button><button class="ccIc" id="btnTayCT" type="button" title="Bàn tay: kéo để dời khung xem (H)" aria-pressed="false">' + ic('hand') + '</button><span class="sep"></span>';
  const zk = $('#zoomKhung'); zk.title = 'Phóng khung xem · ⇧F vừa, ⇧0 100%, ⇧1 50%, ⇧2 200%'; const bHt = $('#btnHoanTac'), bLl = $('#btnLamLai'); mid.insertBefore(zk, mid.lastChild); bHt.className = 'ccIc'; bLl.className = 'ccIc'; mid.appendChild(bHt); mid.appendChild(bLl);
  const gian = top.querySelector('.gian'); top.insertBefore(mid, gian.nextSibling);
  const tm = el('button', null, '▾'); tm.type = 'button'; tm.id = 'tenMenu'; tm.title = 'Đổi tên, nhân bản, dự án của tôi'; top.insertBefore(tm, $('#tenDuAn').nextSibling); tm.onclick = ccMenuTen;
  $('#btnChonCT').onclick = () => { ccDatTay(false); datCheDo('chon', true); }; $('#btnTayCT').onclick = () => ccDatTay(!P.ccTay);
  const bm = $('#btnMenu'); bm.innerHTML = ic('dots'); bm.title = 'Menu';
  const lt = $('#luuTt'); if (lt && !lt.textContent) lt.title = 'Tự lưu vào trình duyệt mỗi vài giây';
  // rail trái: nút phím tắt dưới cùng + tay thu gọn
  const tabs = $('.ecol.trai .etabs'); const kb = el('button', 'ccKbd'); kb.type = 'button'; kb.title = 'Phím tắt (?)'; kb.innerHTML = ic('kbd'); kb.onclick = () => $('#btnPhimTat').click(); tabs.appendChild(kb);
  const thu = el('button', null, '‹'); thu.type = 'button'; thu.id = 'ccThu'; thu.onclick = () => ccThuGon(); $('.ecol.trai').appendChild(thu);
  let thuLuu = '0'; try { thuLuu = localStorage.getItem('dv_thuGon') || '0'; } catch { } ccThuGon(thuLuu === '1');
  // vùng canvas: nút Tỉ lệ góc trái, cụm điều khiển trình phát nổi góc phải, lớp bàn tay
  const vung = $('.khungVung'); const rb = el('div'); rb.id = 'ccRatio'; rb.title = 'Tỉ lệ khung'; rb.innerHTML = ic('ratio'); const t2 = $('#tiLe2'); if (t2) rb.appendChild(t2); vung.appendChild(rb);
  const cp = $('.ctl .ctlPhai'); if (cp) { cp.classList.add('ccNoi'); vung.appendChild(cp); }
  const tl = el('div'); tl.id = 'ccTayLop'; vung.appendChild(tl);
  tl.onpointerdown = e => { if (e.button !== 0) return; const sx = e.clientX, sy = e.clientY, l0 = vung.scrollLeft, t0 = vung.scrollTop; tl.setPointerCapture(e.pointerId); ed.classList.add('dangTay'); tl.onpointermove = ev => { vung.scrollLeft = l0 - (ev.clientX - sx); vung.scrollTop = t0 - (ev.clientY - sy); }; tl.onpointerup = tl.onpointercancel = () => { tl.onpointermove = null; ed.classList.remove('dangTay'); }; };
  // thanh công cụ timeline: ▶ + đồng hồ ở giữa; toàn màn hình + ẩn timeline bên phải
  const tool = $('.etool'), cums = tool.querySelectorAll(':scope > .cum'); const giua = el('div', 'cum ccGiua'); giua.appendChild($('#btnPlay')); giua.appendChild($('#tg')); tool.insertBefore(giua, cums[1]);
  const phai = cums[1]; const tm2 = $('#btnToanManHinh'); const anTl = el('button', 'ic'); anTl.type = 'button'; anTl.id = 'btnAnTl'; anTl.title = 'Ẩn / hiện dòng thời gian (Ctrl+Shift+.)'; anTl.setAttribute('aria-pressed', 'false'); anTl.innerHTML = ic('tlOff'); anTl.onclick = () => ccAnTl();
  if (tm2) { tm2.className = 'ic'; tm2.innerHTML = ic('full'); phai.appendChild(tm2); } phai.appendChild(anTl);
  // đồng hồ MM:SS:FF | tổng, thước mm:ss
  const datTgCu = datTg; datTg = function (tong) { datTgCu.apply(this, arguments); const g = $('#tg'); if (g && ccwBat() && !g.querySelector('input')) g.innerHTML = '<b>' + CC_TC(P.t) + '</b> <span style="opacity:.5">/</span> ' + CC_TC(tong); };
  const rulerCu = ruler; ruler = function () { rulerCu.apply(this, arguments); if (!ccwBat()) return; $$('#ruler > i:not(.nho)').forEach(i => { if (/^\d:\d\d$/.test(i.textContent)) i.textContent = '0' + i.textContent; }); };
  datTg(tongGiay()); ruler();
  // V (chọn) hay C (cắt) ở bất kỳ đâu → tắt bàn tay
  const datCheDoCu = datCheDo; datCheDo = function (m) { datCheDoCu.apply(this, arguments); if (P.ccTay && !P.ccDangTay) ccDatTay(false); };
  // zoom khung đổi từ chỗ khác → cập nhật nhãn
  // #seek thành thanh tiến độ khi ẩn timeline (như CapCut)
  const sk = $('#seek'); if (sk) $('.etl').insertBefore(sk, $('#tlScroll'));
  // phím: H bàn tay, V chọn, Ctrl+/ thu gọn thư viện, Ctrl+Shift+. ẩn timeline, ⇧F vừa khung, ⇧0 100%, ⇧1 50%, ⇧2 200%
  addEventListener('keydown', e => {
    const a = document.activeElement; if (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable) return; if ($('.xuat.mo')) return;
    const ctrl = e.ctrlKey || e.metaKey, sh = e.shiftKey, alt = e.altKey, c = e.code; const xong = f => { e.preventDefault(); e.stopImmediatePropagation(); f(); };
    if (!ctrl && !alt && !sh && c === 'KeyH') return xong(() => ccDatTay(true));
    if (!ctrl && !alt && !sh && c === 'KeyV') { ccDatTay(false); return; }
    if (ctrl && !sh && !alt && c === 'Slash') return xong(() => ccThuGon());
    if (ctrl && sh && !alt && c === 'Period') return xong(() => ccAnTl());
    if (sh && !ctrl && !alt && c === 'KeyF') return xong(() => ccDatZoom('vua'));
    if (sh && !ctrl && !alt && c === 'Digit0') return xong(() => ccDatZoom('1'));
    if (sh && !ctrl && !alt && c === 'Digit1') return xong(() => ccDatZoom('0.5'));
    if (sh && !ctrl && !alt && c === 'Digit2') return xong(() => ccDatZoom('2'));
  }, true);
  // hộp thoại dời ra ngoài cột khung xem (cột có backdrop-filter + overflow hidden sẽ cắt mất nút); nằm cố định toàn màn hình
  $$('.ecol.giua > .xuat').forEach(x => ed.appendChild(x));
  // bấm vào nền mờ ngoài hộp thoại thì đóng (trừ lúc đang xuất dở)
  document.addEventListener('pointerdown', e => { const h = e.target.closest('.xuat.mo'); if (!h || e.target !== h) return; if (h.id === 'xuatHop' && $('#xuatXong') && $('#xuatXong').style.display === 'none') return; h.classList.remove('mo'); }, true);
  // bảng Xuất thả xuống: bấm ra ngoài thì đóng
  document.addEventListener('pointerdown', e => { const h = $('#xuatCaiHop'); if (!h || !h.classList.contains('mo')) return; if (e.target.closest('#xuatCaiHop .box') || e.target.closest('#btnXuat')) return; h.classList.remove('mo'); }, true);
  // bỏ chọn khi bấm vào nền vùng canvas (như CapCut: bảng thuộc tính tự ẩn)
  vung.addEventListener('pointerdown', e => { if (e.target !== vung) return; if (P.chon || (P.nhieu && P.nhieu.length)) { P.chon = null; P.nhieu = []; chonHien(); veProp(); } });
}

/* ═════════ KHO TÀI NGUYÊN (tools/kho/kho.js): bộ lọc tham số → LUT, mẫu chữ + font, hiệu ứng shader, chuyển cảnh thêm, âm thanh tổng hợp, nhập font/.zip, sticker & âm thanh trực tuyến ═════════ */
const KHO_OK = typeof KHO === 'object' && KHO && Array.isArray(KHO.boLoc);
const KHO_CHU_NHOM = {};   // chỉ số MAU_CHU → nhóm
if (KHO_OK) {
  // font
  Object.entries(KHO.font).forEach(([id, [ten]]) => { FONT_CSS[id] = '"' + ten + '"'; });
  // mẫu chữ nối vào MAU_CHU (AI và themMauChu dùng chung)
  KHO.mauChu.forEach(([ten, st, nhom]) => { KHO_CHU_NHOM[MAU_CHU.length] = nhom; MAU_CHU.push([ten, st]); });
  // hiệu ứng shader
  KHO.hieuUng.forEach(h => { HIEU_UNG['kho:' + h.id] = h.ten; HU_IC['kho:' + h.id] = h.ic; });
  // chuyển cảnh
  KHO.chuyenCanh.forEach(c => { CHUYEN_TEN[c.id] = c.ten; CH_IC[c.id] = c.ic; GLT_MAP[c.id] = [c.id, {}]; });
  // âm thanh
  KHO.amThanh.forEach(a => { SFX[a.id] = [a.ic + ' ' + a.ten, a.dai]; });
}
const KHO_AM = {}; if (KHO_OK) KHO.amThanh.forEach(a => { KHO_AM[a.id] = a; });
const khongDauKho = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/* ── bộ lọc tham số → LUT 17³ ── */
function hexRgb(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }
function mauKho(p, r, g, b) {
  const cl = v => Math.max(0, Math.min(1, v)); let c = [r, g, b];
  if (p.sang) c = c.map(v => v + p.sang);
  if (p.tp) { const k = 1 + p.tp; c = c.map(v => (v - 0.5) * k + 0.5); }
  if (p.scurve) c = c.map(v => { const s = v * v * (3 - 2 * v); return v + (s - v) * p.scurve; });
  if (p.gamma && p.gamma !== 1) c = c.map(v => Math.pow(cl(v), p.gamma));
  if (p.lift || p.gain) { const L = p.lift || [0, 0, 0], G = p.gain || [1, 1, 1]; c = c.map((v, i) => v * G[i] + L[i] * (1 - v)); }
  if (p.nhiet) { c[0] += p.nhiet * 0.12; c[2] -= p.nhiet * 0.12; }
  if (p.tint) { c[1] -= p.tint * 0.1; c[0] += p.tint * 0.04; c[2] += p.tint * 0.04; }
  if (p.hue) { const a = p.hue * Math.PI / 180, k = 0.57735, ca = Math.cos(a), sa = Math.sin(a), d = k * (c[0] + c[1] + c[2]); const cr = [k * (c[2] - c[1]), k * (c[0] - c[2]), k * (c[1] - c[0])]; c = c.map((v, i) => v * ca + cr[i] * sa + k * d * (1 - ca)); }
  const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  if (p.bh != null && p.bh !== 1) c = c.map(v => lum + (v - lum) * p.bh);
  if (p.vib) { const mx = Math.max(...c), mn = Math.min(...c), s = mx - mn, k = 1 + p.vib * (1 - s); c = c.map(v => lum + (v - lum) * k); }
  if (p.bong) { const m = hexRgb(p.bong[0]), w = p.bong[1] * Math.pow(1 - cl(lum), 2); c = c.map((v, i) => v + (m[i] - 0.5) * w); }
  if (p.cao) { const m = hexRgb(p.cao[0]), w = p.cao[1] * Math.pow(cl(lum), 2); c = c.map((v, i) => v + (m[i] - 0.5) * w); }
  if (p.phai) c = c.map(v => v * (1 - p.phai) + p.phai * 0.6);
  if (p.mono) { const g2 = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; c = c.map(v => v + (g2 - v) * p.mono); }
  if (p.duo) { const a = hexRgb(p.duo[0]), b2 = hexRgb(p.duo[1]), g2 = cl(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]); c = c.map((v, i) => v + (a[i] + (b2[i] - a[i]) * g2 - v) * p.duo[2]); }
  return c.map(cl);
}
function taoLutKho(m) { const n = 17, data = new Array(n * n * n * 3); let i = 0; for (let b = 0; b < n; b++) for (let g = 0; g < n; g++) for (let r = 0; r < n; r++) { const c = mauKho(m.p, r / (n - 1), g / (n - 1), b / (n - 1)); data[i++] = c[0]; data[i++] = c[1]; data[i++] = c[2]; } return { id: 'kho:' + m.id, ten: m.ten, n, data, kho: true }; }
function dangKyLutKho(id) { const k = String(id).replace(/^kho:/, ''); if (P.luts['kho:' + k]) return P.luts['kho:' + k]; const m = KHO_OK && KHO.boLoc.find(x => x.id === k); if (!m) return null; return (P.luts['kho:' + k] = taoLutKho(m)); }
function khoLocTuTen(ten) { if (!KHO_OK) return null; const q = khongDauKho(ten); return KHO.boLoc.find(x => x.id === q || khongDauKho(x.ten) === q) || KHO.boLoc.find(x => khongDauKho(x.ten).includes(q)) || null; }
let khoAnhMau = null;
function anhMauKho() {   // ảnh mẫu 56×56: khung hiện tại nếu có, không thì dải màu
  const c = document.createElement('canvas'); c.width = 56; c.height = 56; const g = c.getContext('2d');
  if (P.clips.length && cv.width) { const sc = Math.max(56 / cv.width, 56 / cv.height); try { g.drawImage(cv, 28 - cv.width * sc / 2, 28 - cv.height * sc / 2, cv.width * sc, cv.height * sc); return g.getImageData(0, 0, 56, 56); } catch { } }
  const gr = g.createLinearGradient(0, 0, 56, 0); ['#ff4d4d', '#ffb020', '#99df00', '#22d3df', '#8b7cf6', '#ff5fb2'].forEach((m, i, a) => gr.addColorStop(i / (a.length - 1), m)); g.fillStyle = gr; g.fillRect(0, 0, 56, 56);
  const gv = g.createLinearGradient(0, 0, 0, 56); gv.addColorStop(0, 'rgba(255,255,255,.9)'); gv.addColorStop(0.5, 'rgba(255,255,255,0)'); gv.addColorStop(1, 'rgba(0,0,0,.9)'); g.fillStyle = gv; g.fillRect(0, 0, 56, 56); g.fillStyle = '#d9a066'; g.fillRect(16, 20, 24, 24); return g.getImageData(0, 0, 56, 56);
}
function theLocKho(m) { const c = document.createElement('canvas'); c.width = 56; c.height = 56; const g = c.getContext('2d'); const src = khoAnhMau || (khoAnhMau = anhMauKho()), out = g.createImageData(56, 56), d = src.data, o = out.data; for (let i = 0; i < d.length; i += 4) { const v = mauKho(m.p, d[i] / 255, d[i + 1] / 255, d[i + 2] / 255); o[i] = v[0] * 255; o[i + 1] = v[1] * 255; o[i + 2] = v[2] * 255; o[i + 3] = 255; } g.putImageData(out, 0, 0); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; return c; }
function veKhoLoc() {
  const box = $('#khoLocLuoi'); if (!box || !KHO_OK) return; box.innerHTML = ''; khoAnhMau = null; const nhom = P.khoLocNhom || 'tat', q = khongDauKho($('#khoLocTim') && $('#khoLocTim').value);
  KHO.boLoc.forEach(m => { if (nhom !== 'tat' && m.nhom !== nhom) return; if (q && !khongDauKho(m.ten).includes(q) && !khongDauKho(KHO.nhomBoLoc[m.nhom]).includes(q)) return; const b = el('button'); b.type = 'button'; b.dataset.kho = m.id; theHoa(b, theLocKho(m), m.ten, KHO.nhomBoLoc[m.nhom]); b.onclick = () => { dangKyLutKho(m.id); apLutChon('kho:' + m.id); }; box.appendChild(b); });
  if (!box.children.length) box.appendChild(el('div', 'quota', 'Không có bộ lọc nào khớp.'));
}
function veChipNhom(hop, ds, hien, doi) { hop.innerHTML = ''; [['tat', 'Tất cả'], ...Object.entries(ds)].forEach(([k, t]) => { const b = el('button', 'btn nho' + (hien === k ? ' xanh' : ''), t); b.type = 'button'; b.onclick = () => doi(k); hop.appendChild(b); }); }

/* ── mẫu chữ: lưới có nhóm + tìm ── */
function theChuMau(st) { const s = el('span', 'mau', String(st.text).split('|')[0].slice(0, 14)); s.style.fontFamily = st.font ? FONT_CSS[st.font] : ''; s.style.fontWeight = st.dam || 900; s.style.fontStyle = st.nghieng ? 'italic' : ''; s.style.color = st.nen === 'hop_mau' ? '#062226' : st.mau === 'nhan' ? 'var(--ea)' : (st.mau || '#fff'); if (st.nen === 'hop' || st.nen === 'hop_mau') { s.style.background = st.nen === 'hop_mau' ? 'var(--ea)' : (st.nen_mau || '#0a0c0e'); s.style.padding = '2px 6px'; s.style.borderRadius = (st.nen_bo || 0) >= 0.9 ? '999px' : '4px'; } if (st.nen === 'vien') s.style.webkitTextStroke = '1px #000'; if (st.nen === 'bong') s.style.textShadow = '0 2px 6px #000'; if (st.phat_sang) s.style.textShadow = '0 0 8px ' + st.phat_sang + ',0 0 16px ' + st.phat_sang; return s; }
function veKhoChu() {
  const box = $('#mauChu'); if (!box) return; box.innerHTML = ''; const nhom = P.khoChuNhom || 'tat', q = khongDauKho($('#khoChuTim') && $('#khoChuTim').value);
  MAU_CHU.forEach(([ten, st], i) => { const nh = KHO_CHU_NHOM[i] || 'co_ban'; if (nhom !== 'tat' && nh !== nhom) return; if (q && !khongDauKho(ten).includes(q) && !khongDauKho(st.text).includes(q)) return; const b = el('button'); b.type = 'button'; b.dataset.i = i; theHoa(b, theChuMau(st), ten); b.onclick = () => themMauChu(i); box.appendChild(b); });
  if (!box.children.length) box.appendChild(el('div', 'quota', 'Không có mẫu nào khớp.'));
}

/* ── hiệu ứng shader WebGL (sau chỉnh màu) ── */
const HU_GL = { cv: null, gl: null, prog: {}, tex: null, buf: null };
const huCv = document.createElement('canvas');
function huGL() {
  if (HU_GL.gl !== null && HU_GL.cv) return HU_GL.gl; HU_GL.cv = document.createElement('canvas'); const gl = HU_GL.cv.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true }); HU_GL.gl = gl || false; if (!gl) return false;
  HU_GL.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, HU_GL.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  HU_GL.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, HU_GL.tex); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)); [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR)); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  return gl;
}
const HU_DAU = 'precision mediump float;varying vec2 uv;uniform sampler2D s;uniform float t,muc;uniform vec2 res;const float PI=3.14159265;float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float nse(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1.,0.)),f.x),mix(rnd(i+vec2(0.,1.)),rnd(i+vec2(1.,1.)),f.x),f.y);}vec4 tx(vec2 p){return texture2D(s,clamp(p,0.,1.));}';
function huProg(id) {
  if (id in HU_GL.prog) return HU_GL.prog[id]; const h = KHO_OK && KHO.hieuUng.find(x => x.id === id); const gl = huGL(); if (!h || !gl) return (HU_GL.prog[id] = null);
  const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p;varying vec2 uv;void main(){uv=(p+1.)/2.;gl_Position=vec4(p,0.,1.);}'); gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, HU_DAU + 'vec4 hu(vec2 uv){' + h.glsl + '}void main(){vec4 c=hu(uv);gl_FragColor=vec4(c.rgb,1.);}'); gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.warn('hiệu ứng', id, gl.getShaderInfoLog(fs)); return (HU_GL.prog[id] = null); }
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); return (HU_GL.prog[id] = pr);
}
function apHuKho(c, s, im, off) {
  const id = String(c.hu2).slice(4), pr = huProg(id); const gl = HU_GL.gl; if (!pr || !gl || !s.w) return [s, im];
  const k = Math.min(1, 1280 / Math.max(s.w, s.h)), w = Math.round(s.w * k), h = Math.round(s.h * k); if (HU_GL.cv.width !== w || HU_GL.cv.height !== h) { HU_GL.cv.width = w; HU_GL.cv.height = h; gl.viewport(0, 0, w, h); }
  gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, HU_GL.buf); const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, HU_GL.tex); try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); } catch { return [s, im]; }
  gl.uniform1i(gl.getUniformLocation(pr, 's'), 0); gl.uniform1f(gl.getUniformLocation(pr, 't'), off || 0); gl.uniform1f(gl.getUniformLocation(pr, 'muc'), c.huMuc == null ? 1 : +c.huMuc); gl.uniform2f(gl.getUniformLocation(pr, 'res'), w, h);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); if (huCv.width !== w || huCv.height !== h) { huCv.width = w; huCv.height = h; } const g = huCv.getContext('2d'); g.clearRect(0, 0, w, h); g.drawImage(HU_GL.cv, 0, 0);
  return [{ ...s, w, h }, huCv];
}
function laHuKho(c) { return !!(c && typeof c.hu2 === 'string' && c.hu2.startsWith('kho:')); }
function offCua(c, t) { if (c.t_bd != null) return t - c.t_bd; try { return t - batDauC(c); } catch { return t; } }
function theHuKho(h) {   // ảnh xem trước: dải màu qua shader tại t = 0.35
  const c = document.createElement('canvas'); c.width = 56; c.height = 56; const g = c.getContext('2d'); const src = document.createElement('canvas'); src.width = 56; src.height = 56; const sg = src.getContext('2d'); const d = khoAnhMau || (khoAnhMau = anhMauKho()); sg.putImageData(d, 0, 0);
  const pr = huProg(h.id); if (pr) { const [, im] = apHuKho({ hu2: 'kho:' + h.id, huMuc: 1 }, { w: 56, h: 56 }, src, 0.35); g.drawImage(im, 0, 0, 56, 56); } else g.drawImage(src, 0, 0);
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; return c;
}
function apHieuUngKho(k) { const ds = P.chon && (P.chon.k === 'v' || P.chon.k === 'b') ? [P.chon.k === 'v' ? P.clips[P.chon.i] : P.broll[P.chon.i]] : P.clips; if (!ds.length || !ds[0]) { toast('Chưa có đoạn nào'); return; } luuHoanTac(); ds.forEach(c => { c.hu2 = k; if (k === 'khong') delete c.huMuc; }); veTl(); veKhung(); veProp(); toast(k === 'khong' ? 'Bỏ hiệu ứng' : 'Áp “' + HIEU_UNG[k] + '” cho ' + ds.length + ' đoạn'); }
function veKhoHieuUng() {
  const box = $('#huLuoi'); if (!box) return; box.innerHTML = ''; khoAnhMau = null; const nhom = P.khoHuNhom || 'tat', q = khongDauKho($('#khoHuTim') && $('#khoHuTim').value);
  const them = (k, ten, noi, phu) => { const b = el('button'); b.type = 'button'; b.dataset.k = k; theHoa(b, noi, ten, phu); b.onclick = () => apHieuUngKho(k); box.appendChild(b); };
  if (nhom === 'tat' || nhom === 'co_ban') Object.keys(HIEU_UNG).filter(k => !k.startsWith('kho:')).forEach(k => { if (q && !khongDauKho(HIEU_UNG[k]).includes(q)) return; them(k, HIEU_UNG[k], '<span>' + (HU_IC[k] || '✨') + '</span>', 'Cơ bản'); });
  if (KHO_OK) KHO.hieuUng.forEach(h => { if (nhom !== 'tat' && h.nhom !== nhom) return; if (q && !khongDauKho(h.ten).includes(q)) return; them('kho:' + h.id, h.ten, theHuKho(h), KHO.nhomHieuUng[h.nhom]); });
  if (!box.children.length) box.appendChild(el('div', 'quota', 'Không có hiệu ứng nào khớp.'));
}

/* ── âm thanh tổng hợp theo công thức ── */
async function tongHopKho(r) {
  const sr = 44100, dai = r.dai, o = new OfflineAudioContext(1, Math.ceil(sr * dai) + 1, sr), ra = o.createGain(); ra.gain.value = 0.9; ra.connect(o.destination);
  const lop = (l, t0) => {
    const g = o.createGain(); g.connect(ra); const d = Math.min(l.dai || dai, dai - t0), a = Math.min(l.a == null ? 0.01 : l.a, d * 0.9), dinh = l.g == null ? 0.6 : l.g;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(dinh, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    if (l.k === 'osc') { const s = o.createOscillator(); s.type = l.w || 'sine'; const [f0, f1] = l.f; s.frequency.setValueAtTime(Math.max(1, f0), t0); if (f1 !== f0) { if (l.ramp === 'lin') s.frequency.linearRampToValueAtTime(Math.max(1, f1), t0 + d); else s.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + d); } s.connect(g); s.start(t0); s.stop(t0 + d + 0.01); }
    else { const b = o.createBuffer(1, Math.ceil(sr * d) + 1, sr), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; const s = o.createBufferSource(); s.buffer = b; const [kieu, f0, f1, Q] = l.loc || ['bandpass', 1000, 1000, 1]; const f = o.createBiquadFilter(); f.type = kieu; f.frequency.setValueAtTime(Math.max(10, f0), t0); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t0 + d); if (Q) f.Q.value = Q; s.connect(f); f.connect(g); s.start(t0); }
  };
  const lan = r.lap ? r.lap.n : 1, moi = r.lap ? r.lap.moi : 0;
  for (let i = 0; i < lan; i++) { const ng = r.lap && r.lap.ngau ? (Math.random() - 0.5) * r.lap.ngau : 0; r.cong.forEach(l => { const t0 = Math.max(0, i * moi + ng + (l.tre || 0)); if (t0 < dai) lop(l, t0); }); }
  return o.startRendering();
}

/* ── sticker GIF/WebP động: giải mã khung bằng ImageDecoder, vẽ theo thời gian ── */
async function giaiMaDong(s) {
  if (!('ImageDecoder' in window) || !s.file || !/gif|webp|apng|png/i.test(s.file.type)) return;
  try {
    const dec = new ImageDecoder({ data: await s.file.arrayBuffer(), type: s.file.type }); await dec.tracks.ready; const tr = dec.tracks.selectedTrack; if (!tr || !tr.animated || tr.frameCount < 2) return;
    const khung = []; let tong = 0; for (let i = 0; i < Math.min(tr.frameCount, 300); i++) { const { image } = await dec.decode({ frameIndex: i }); const d = Math.max(0.02, (image.duration || 80000) / 1e6); khung.push({ t: tong, d, bmp: await createImageBitmap(image) }); image.close(); tong += d; }
    const c = document.createElement('canvas'); c.width = khung[0].bmp.width; c.height = khung[0].bmp.height; c.naturalWidth = c.width; c.naturalHeight = c.height; c.getContext('2d').drawImage(khung[0].bmp, 0, 0);
    s.el = c; s.w = c.width; s.h = c.height; s.khung = { ds: khung, tong, hien: 0 };
  } catch (e) { console.warn('gif', e); }
}
function khungDongTai(s, off) { const k = s.khung; if (!k || !k.tong) return; const t = ((off % k.tong) + k.tong) % k.tong; let i = 0; while (i < k.ds.length - 1 && k.ds[i + 1].t <= t) i++; if (i === k.hien) return; k.hien = i; const g = s.el.getContext('2d'); g.clearRect(0, 0, s.el.width, s.el.height); g.drawImage(k.ds[i].bmp, 0, 0); }

/* ── kho của tôi: font, âm thanh (IndexedDB) ── */
const KHO_FONT = 'font', KHO_AM_TOI = 'am';
async function themFontFile(f) {
  const ten = f.name.replace(/\.[^.]+$/, ''), id = 'f_' + ten.replace(/[^a-z0-9]+/gi, '_').toLowerCase(); try { const buf = await f.arrayBuffer(); const ff = new FontFace(ten, buf); await ff.load(); document.fonts.add(ff); FONT_CSS[id] = '"' + ten + '"'; const sel = $('#font'); if (sel && ![...sel.options].some(o => o.value === id)) { const op = el('option', null, ten + ' (của bạn)'); op.value = id; sel.appendChild(op); } try { await dbGhi(KHO_FONT, { id, ten, b64: await blobB64(f), mime: f.type || 'font/ttf' }); } catch { } toast('Đã thêm font “' + ten + '”'); return id; } catch (e) { toast('Không đọc được font ' + f.name); return null; }
}
async function napFontKho() { try { const ds = await dbTatCa(KHO_FONT); for (const r of ds) { try { const bin = Uint8Array.from(atob(r.b64.split(',').pop()), c => c.charCodeAt(0)); const ff = new FontFace(r.ten, bin.buffer); await ff.load(); document.fonts.add(ff); FONT_CSS[r.id] = '"' + r.ten + '"'; const sel = $('#font'); if (sel && ![...sel.options].some(o => o.value === r.id)) { const op = el('option', null, r.ten + ' (của bạn)'); op.value = r.id; sel.appendChild(op); } } catch { } } } catch { } }
async function themAmToi(f) { const id = 'my_' + uid(); let giay = 0; try { giay = (await giaiMaAm(f)).duration; } catch { toast('Không đọc được ' + f.name); return null; } const r = { id, ten: f.name.replace(/\.[^.]+$/, ''), b64: await blobB64(f), mime: f.type || 'audio/mpeg', giay }; try { await dbGhi(KHO_AM_TOI, r); } catch { } SFX[id] = ['📂 ' + r.ten, giay]; KHO_AM[id] = { tep: r }; veSfxDs(); return id; }
async function napAmToi() { try { (await dbTatCa(KHO_AM_TOI)).forEach(r => { SFX[r.id] = ['📂 ' + r.ten, r.giay || 1]; KHO_AM[r.id] = { tep: r }; }); } catch { } }
async function nhapGoiKho(f) {
  let ds; try { ds = await docZip(f); } catch { toast('Không đọc được file .zip'); return; } let n = 0; const anh = [];
  for (const [ten, blob] of ds) { const duoi = (ten.split('.').pop() || '').toLowerCase(), tenTep = ten.split('/').pop(); if (!tenTep || tenTep.startsWith('.')) continue; const file = new File([blob], tenTep, { type: blob.type || ({ cube: 'text/plain', ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', png: 'image/png', gif: 'image/gif', webp: 'image/webp' })[duoi] || '' });
    if (duoi === 'cube') { if (await themLut(file)) n++; } else if (/^(ttf|otf|woff2?)$/.test(duoi)) { if (await themFontFile(file)) n++; } else if (/^(mp3|wav|ogg|m4a|aac|flac)$/.test(duoi)) { if (await themAmToi(file)) n++; } else if (/^(png|gif|webp)$/.test(duoi)) anh.push(file); }
  if (anh.length) { await themSticker(anh); n += anh.length; }
  toast('Đã nhập ' + n + ' mục từ gói ' + f.name);
}

/* ── trực tuyến qua Cloudflare: sticker (Giphy/Tenor), âm thanh (Freesound) ── */
async function timTrucTuyen(loai, q) { const r = await fetch(MC.url + (loai === 'sticker' ? '/nhan-dan' : '/am-thanh') + '?q=' + encodeURIComponent(q)); const j = await r.json(); if (!j.ok) throw new Error(j.error === 'chua_co_key' ? 'Máy chủ chưa có key ' + (loai === 'sticker' ? 'Giphy/Tenor' : 'Freesound') + ' (xem HUONG-DAN.md)' : (j.error || 'lỗi')); return j.ds || []; }
async function taiQuaMc(link, ten, mime) { const r = await fetch(MC.url + '/tai?xem=1&u=' + encodeURIComponent(link)); if (!r.ok) throw new Error('tải ' + r.status); const b = await r.blob(); return new File([b], ten, { type: b.type && b.type !== 'application/octet-stream' ? b.type : mime }); }
function veTimSticker() {
  const box = $('#khoStickerKq'); if (!box) return; const q = ($('#khoStickerTim').value || '').trim(); if (!q) return; box.innerHTML = '<div class="quota">Đang tìm…</div>';
  timTrucTuyen('sticker', q).then(ds => { box.innerHTML = ''; if (!ds.length) { box.appendChild(el('div', 'quota', 'Không thấy sticker nào.')); return; } ds.forEach(s => { const b = el('button'); b.type = 'button'; b.title = s.ten || 'sticker'; const im = el('img'); im.loading = 'lazy'; im.src = MC.url + '/tai?xem=1&u=' + encodeURIComponent(s.thumb || s.link); im.alt = s.ten || ''; const t = el('div', 'the'); t.appendChild(im); b.appendChild(t); b.onclick = async () => { b.disabled = true; try { const f = await taiQuaMc(s.link, (s.ten || 'sticker').replace(/[^\w\s-]/g, '').slice(0, 30) + '.' + (s.duoi || 'gif'), s.duoi === 'webp' ? 'image/webp' : 'image/gif'); await themSticker([f]); const src = P.srcs.filter(z => z.ten === f.name).pop(); if (src) { await giaiMaDong(src); veKhung(); } toast('Đã thêm sticker lên V3'); } catch (e) { toast('Không tải được sticker: ' + e.message); } b.disabled = false; }; box.appendChild(b); }); const q2 = el('div', 'quota', 'Nguồn: ' + (ds[0].nguon || 'Giphy') + ' · dùng theo điều khoản của họ.'); box.appendChild(q2); }).catch(e => { box.innerHTML = ''; box.appendChild(el('div', 'quota', '⚠ ' + e.message)); });
}
function veTimAm() {
  const box = $('#khoAmKq'); if (!box) return; const q = ($('#khoAmTim').value || '').trim(); if (!q) return; box.innerHTML = '<div class="quota">Đang tìm…</div>';
  timTrucTuyen('am', q).then(ds => { box.innerHTML = ''; if (!ds.length) { box.appendChild(el('div', 'quota', 'Không thấy âm thanh nào.')); return; } let dangPhat = null; ds.forEach(s => { const b = el('button', 'sfxHang'); b.type = 'button'; b.innerHTML = '<span class="ic">🎵</span><span class="ten"><b>' + (s.ten || '').replace(/</g, '&lt;') + '</b><small>' + fmt1(s.giay || 0) + 's · ' + (s.tac_gia || '') + ' · ' + (s.giay_phep || '') + '</small></span>'; const nghe = el('span', 'nut'); nghe.textContent = '▶'; nghe.title = 'Nghe thử'; nghe.onclick = e => { e.stopPropagation(); if (dangPhat) { dangPhat.pause(); dangPhat = null; nghe.textContent = '▶'; return; } dangPhat = new Audio(MC.url + '/tai?xem=1&u=' + encodeURIComponent(s.link)); dangPhat.play().catch(() => { }); nghe.textContent = '■'; dangPhat.onended = () => { nghe.textContent = '▶'; dangPhat = null; }; }; const them = el('span', 'nut them'); them.textContent = '+'; b.appendChild(nghe); b.appendChild(them); b.onclick = async () => { b.disabled = true; try { const f = await taiQuaMc(s.link, (s.ten || 'am-thanh').replace(/[^\w\s-]/g, '').slice(0, 40) + '.mp3', 'audio/mpeg'); const kho = 'f:' + uid(); await am3NapBlob(kho, f); await themAm3(kho, s.ten || 'Âm thanh', 'file'); toast('Đã thêm “' + s.ten + '” tại đầu phát'); } catch (e) { toast('Không tải được: ' + e.message); } b.disabled = false; }; box.appendChild(b); }); box.appendChild(el('div', 'quota', 'Nguồn: Freesound · giấy phép ghi trên từng dòng (CC0 dùng tự do; CC BY cần ghi tên tác giả).')); }).catch(e => { box.innerHTML = ''; box.appendChild(el('div', 'quota', '⚠ ' + e.message)); });
}

function khoiTaoKho() {
  if (!KHO_OK) { console.warn('Chưa tải được tools/kho/kho.js'); return; }
  // Google Fonts cho font mới
  { const qs = Object.values(KHO.font).map(([, q]) => 'family=' + q); for (let i = 0; i < qs.length; i += 10) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + qs.slice(i, i + 10).join('&') + '&display=swap'; document.head.appendChild(l); } }   // từng cụm 10 họ: một họ sai tham số không kéo cả danh sách sập
  const sel = $('#font'); if (sel) Object.entries(KHO.font).forEach(([id, [ten]]) => { if (![...sel.options].some(o => o.value === id)) { const op = el('option', null, ten); op.value = id; sel.appendChild(op); } });
  // bộ lọc
  const locPane = $('[data-pane="loc"]'); if (locPane) { const h3 = [...locPane.querySelectorAll('h3.pt')].find(x => /^Bộ lọc/.test(x.textContent)); if (h3) h3.textContent = 'Bộ lọc nhanh'; const khu = el('div'); khu.id = 'khoLocKhu'; khu.innerHTML = '<h3 class="pt">Bộ lọc</h3><div class="quota" style="margin:0 0 4px">' + KHO.boLoc.length + ' màu, máy dựng LUT tại chỗ, không tải gì thêm. Bấm thẻ để áp cho đoạn đang chọn (hoặc mọi đoạn).</div><div class="row khoHang"><input type="search" id="khoLocTim" placeholder="Tìm bộ lọc: teal, phim, đen trắng…"></div><div class="row khoChip" id="khoLocChip"></div><div class="mauLuoi" id="khoLocLuoi"></div>'; (h3 ? h3.parentNode : locPane).insertBefore(khu, h3 || null); khoiTaoKhoChipLoc('tat'); $('#khoLocTim').oninput = () => veKhoLoc();
    const goi = el('div'); ((h3 ? h3.parentNode : locPane)).appendChild(goi); goi.innerHTML = '<h3 class="pt">Nhập gói tài nguyên</h3><label class="btn nho" style="display:inline-flex;cursor:pointer">📦 Nhập gói .zip (LUT, font, âm thanh, sticker)<input type="file" id="khoGoiIn" accept=".zip" hidden></label><div class="quota">Gói .zip gồm file .cube, .ttf/.otf/.woff2, .mp3/.wav, .png/.gif/.webp. Font và âm thanh lưu trong trình duyệt, dùng cho mọi dự án.</div>'; $('#khoGoiIn').onchange = async e => { for (const f of [...e.target.files]) await nhapGoiKho(f); e.target.value = ''; }; }
  // mẫu chữ
  const chuPane = $('[data-pane="chu"]'); if (chuPane) { const grid = $('#mauChu'); const ctl = el('div'); ctl.innerHTML = '<div class="row khoHang"><input type="search" id="khoChuTim" placeholder="Tìm mẫu chữ: hook, giá, follow…"><label class="btn nho" style="display:inline-flex;cursor:pointer;flex:none" title="Thêm font .ttf/.otf/.woff2 của bạn">＋ Font<input type="file" id="khoFontIn" accept=".ttf,.otf,.woff,.woff2" multiple hidden></label></div><div class="row khoChip" id="khoChuChip"></div>'; grid.parentNode.insertBefore(ctl, grid); const nhomChu = { co_ban: 'Cơ bản', ...KHO.nhomMauChu }; const datChip = k => { P.khoChuNhom = k; veChipNhom($('#khoChuChip'), nhomChu, k, datChip); veKhoChu(); }; veChipNhom($('#khoChuChip'), nhomChu, 'tat', datChip); $('#khoChuTim').oninput = () => veKhoChu(); $('#khoFontIn').onchange = async e => { for (const f of [...e.target.files]) await themFontFile(f); e.target.value = ''; }; veKhoChu(); }
  // hiệu ứng
  const huPane = $('[data-pane="hieu"]'); if (huPane) { const grid = $('#huLuoi'); const ctl = el('div'); ctl.innerHTML = '<div class="row khoHang"><input type="search" id="khoHuTim" placeholder="Tìm hiệu ứng: glitch, vhs, tuyết…"></div><div class="row khoChip" id="khoHuChip"></div>'; grid.parentNode.insertBefore(ctl, grid); const nhomHu = { co_ban: 'Cơ bản', ...KHO.nhomHieuUng }; const datChip = k => { P.khoHuNhom = k; veChipNhom($('#khoHuChip'), nhomHu, k, datChip); veKhoHieuUng(); }; veChipNhom($('#khoHuChip'), nhomHu, 'tat', datChip); $('#khoHuTim').oninput = () => veKhoHieuUng(); veKhoHieuUng(); }
  // sticker trực tuyến
  const stPane = $('[data-pane="sticker"]'); if (stPane) { const khu = el('div'); khu.innerHTML = '<h3 class="pt">Tìm sticker động (Giphy / Tenor)</h3><div class="row khoHang"><input type="search" id="khoStickerTim" placeholder="Ví dụ: fire, wow, arrow, money…"><button class="btn nho xanh" id="khoStickerNut" type="button">Tìm</button></div><div class="mauLuoi khoSticker" id="khoStickerKq"></div>'; { const neo = $('#emojiNhanh'); (neo ? neo.parentNode : stPane).insertBefore(khu, neo ? neo.nextSibling : null); } $('#khoStickerNut').onclick = veTimSticker; $('#khoStickerTim').onkeydown = e => { if (e.key === 'Enter') veTimSticker(); }; }
  // âm thanh: nhóm cho danh sách hiệu ứng + tìm trực tuyến
  const am3 = $('#am3Hop'); if (am3) { const sfx = $('#sfxLuoi'); if (sfx) { const ctl = el('div'); ctl.innerHTML = '<div class="row khoHang"><input type="search" id="khoAmLoc" placeholder="Tìm hiệu ứng âm: whoosh, ding, boom…"></div><div class="row khoChip" id="khoAmChip"></div>'; sfx.parentNode.insertBefore(ctl, sfx); const nhomAm = { co_ban: 'Cơ bản', ...KHO.nhomAmThanh, cua_toi: '📂 Của tôi' }; const datChip = k => { P.khoAmNhom = k; veChipNhom($('#khoAmChip'), nhomAm, k, datChip); veSfxDs(); }; veChipNhom($('#khoAmChip'), nhomAm, 'tat', datChip); $('#khoAmLoc').oninput = () => veSfxDs(); }
    const khu = el('div'); khu.innerHTML = '<h3 class="pt">Tìm âm thanh miễn phí (Freesound)</h3><div class="row khoHang"><input type="search" id="khoAmTim" placeholder="Ví dụ: whoosh, applause, rain, notification…"><button class="btn nho xanh" id="khoAmNut" type="button">Tìm</button></div><div class="sfxDs" id="khoAmKq"></div>'; const h3 = [...am3.querySelectorAll('h3.pt')].find(x => /Ghi âm/.test(x.textContent)); (h3 ? h3.parentNode : am3).insertBefore(khu, h3 || null); $('#khoAmNut').onclick = veTimAm; $('#khoAmTim').onkeydown = e => { if (e.key === 'Enter') veTimAm(); }; }
  // chuyển cảnh thêm vào kho gl-transitions (kể cả khi CDN không tải được)
  const gltNapGoc = gltNap; const tron = () => { if (!GLT.json) GLT.json = []; KHO.chuyenCanh.forEach(c => { if (!GLT.json.find(x => x.name === c.id)) GLT.json.push({ name: c.id, glsl: c.glsl, defaultParams: {}, paramsTypes: {}, author: 'Viral Studio', license: 'MIT' }); }); return GLT.json; };
  gltNap = function () { if (GLT.json && GLT.json.some(x => x.name === KHO.chuyenCanh[0].id)) return Promise.resolve(GLT.json); return Promise.resolve(gltNapGoc()).then(tron, tron); };
  // hiệu ứng shader sau chỉnh màu
  const chinhMauGoc = chinhMau; chinhMau = function (c, s, im, tg) { if (c && c.lut && typeof c.lut === 'string' && c.lut.startsWith('kho:') && !P.luts[c.lut]) dangKyLutKho(c.lut); let r = chinhMauGoc.apply(this, arguments); if (laHuKho(c)) r = apHuKho(c, r[0], r[1], offCua(c, tg)); return r; };
  const coChinhMauGoc = coChinhMau; coChinhMau = function (c) { if (c && c.lut && typeof c.lut === 'string' && c.lut.startsWith('kho:') && !P.luts[c.lut]) dangKyLutKho(c.lut); return coChinhMauGoc.apply(this, arguments); };
  // âm thanh theo công thức / file của tôi
  const taoSfxGoc = taoSfx; taoSfx = async function (k) { const r = KHO_AM[k]; if (!r) return taoSfxGoc.apply(this, arguments); if (r.tep) { const bin = Uint8Array.from(atob(r.tep.b64.split(',').pop()), c => c.charCodeAt(0)); return giaiMaAm(new Blob([bin], { type: r.tep.mime })); } return tongHopKho(r); };
  const veSfxDsGoc = veSfxDs; veSfxDs = function () { veSfxDsGoc.apply(this, arguments); const nhom = P.khoAmNhom || 'tat', q = khongDauKho($('#khoAmLoc') && $('#khoAmLoc').value); $$('#sfxLuoi .sfxHang').forEach(b => { const k = b.dataset.k, r = KHO_AM[k]; const nh = r ? (r.tep ? 'cua_toi' : r.nhom) : 'co_ban'; const ten = SFX[k] ? SFX[k][0] : ''; b.hidden = (nhom !== 'tat' && nh !== nhom) || (q && !khongDauKho(ten).includes(q)); }); };
  // sticker động: cập nhật khung theo thời gian
  const veMotBrollGoc = veMotBroll; veMotBroll = function (ctx, W, H, t, b) { const sb = b && srcCua(b.src); if (sb && sb.khung) khungDongTai(sb, (t - b.t_bd) * (tocC(b) || 1)); return veMotBrollGoc.apply(this, arguments); };
  const themStickerGoc = themSticker; themSticker = async function (files) { await themStickerGoc.apply(this, arguments); for (const f of files) { if (/gif|webp|png/i.test(f.type)) { const s = P.srcs.filter(z => z.ten === f.name).pop(); if (s && !s.khung) await giaiMaDong(s); } } if (!P.dang) veKhung(); };
  // kho của tôi
  napFontKho(); napAmToi().then(() => veSfxDs());
  // dựng lại thanh mục lục bên trái của các tab có thêm mục
  ['loc', 'am', 'sticker', 'chu', 'hieu'].forEach(k => { const pane = $('[data-pane="' + k + '"]'); if (!pane) return; const noi = pane.querySelector(':scope > .noi'), ben = pane.querySelector(':scope > .ben'); if (noi) { while (noi.firstChild) pane.appendChild(noi.firstChild); noi.remove(); } if (ben) ben.remove(); pane.classList.remove('coBen'); delete pane._veBen; try { taoBen(pane); } catch { } });
  // vẽ lại ảnh xem trước bộ lọc khi mở tab (lấy khung hiện tại)
  $$('.etabs [data-tab="loc"],.etabs [data-tab="hieu"]').forEach(b => b.addEventListener('click', () => setTimeout(() => { khoAnhMau = null; if (b.dataset.tab === 'loc') veKhoLoc(); else veKhoHieuUng(); }, 50)));
}
function khoChuyenTuTen(ten) { const q = khongDauKho(ten); return KHO.chuyenCanh.find(x => x.id === q || khongDauKho(x.ten) === q) || KHO.chuyenCanh.find(x => khongDauKho(x.ten).includes(q)) || null; }
function khoHieuUngTuTen(ten) { const q = khongDauKho(ten).replace(/^kho:/, ''); return KHO.hieuUng.find(x => x.id === q || khongDauKho(x.ten) === q) || KHO.hieuUng.find(x => khongDauKho(x.ten).includes(q)) || null; }
function khoiTaoKhoChipLoc(k) { veChipNhom($('#khoLocChip'), KHO.nhomBoLoc, k, kk => { P.khoLocNhom = kk; khoiTaoKhoChipLoc(kk); }); veKhoLoc(); }

/* Trợ lý AI: chấp nhận tên trong kho cho loc (→ LUT kho), hieu_ung, chuyen */
if (KHO_OK) { const agentXuLyGoc = agentXuLy; agentXuLy = async function (ten, a) {
  let lutKho = null; if (a && typeof a === 'object') {
    if (a.loc != null && !LOC[a.loc]) { const m = khoLocTuTen(a.loc); if (m) { lutKho = 'kho:' + m.id; delete a.loc; } }
    if (a.hieu_ung != null && !HIEU_UNG[a.hieu_ung]) { const h = khoHieuUngTuTen(a.hieu_ung); if (h) a.hieu_ung = 'kho:' + h.id; }
    if (a.chuyen != null && !CHUYEN_TEN[a.chuyen]) { const c = khoChuyenTuTen(a.chuyen); if (c) a.chuyen = c.id; }
  }
  const r = await agentXuLyGoc.call(this, ten, a);
  if (lutKho) { dangKyLutKho(lutKho); const ds = ten === 'ap_tat_ca' ? P.clips : ten === 'sua_doan' ? [P.clips[agentKiemI(a.i)]] : []; ds.forEach(c => { if (c) { c.lut = lutKho; c.lutMuc = a.loc_muc != null ? Math.max(0, Math.min(1, +a.loc_muc)) : 1; } }); if (ds.length) { veTl(); veKhung(); veProp(); } }
  return r;
}; }
