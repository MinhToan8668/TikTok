/* ═════════ LÕI THAO TÁC KIỂU CAPCUT (10/2026) ═════════
   hoàn tác/làm lại · keyframe nhiều điểm (◇) · hoạt ảnh vào/ra · lật · cắt khung · tay cầm trên khung xem trước ·
   Q/W cắt theo đầu phát · Ctrl+B/C/V · N bật/tắt hít · Ctrl+cuộn để zoom · dạng sóng âm */
const EASE_KF = { deu: p => p, vao: p => 1 - Math.pow(1 - p, 3), ra: p => p * p * p, mem: p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, nay: p => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2), dan_hoi: p => p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * 2.0944) + 1 };
const EASE_TEN = { mem: 'Mượt (vào–ra)', vao: 'Chậm dần', ra: 'Nhanh dần', deu: 'Đều', nay: 'Vượt rồi về', dan_hoi: 'Đàn hồi' };
const KF_TEN = { sc: 'Phóng to', scX: 'Rộng', scY: 'Cao', x: 'Vị trí ngang', y: 'Vị trí dọc', xoay: 'Xoay', mo: 'Độ mờ', am: 'Âm lượng' };
function batDauC(c) { let acc = 0; for (const k of P.clips) { if (k === c) return acc; acc += daiC(k); } return 0; }
function batDauMuc(k, m) { return k === 'v' ? batDauC(m) : k === 'b' ? m.t_bd : k === 'a' ? m.t_bd : m.bd; }
function daiMuc(k, m) { return k === 'v' ? daiC(m) : k === 'b' ? (m.kt - m.bd) / tocC(m) : k === 'a' ? (m.kt - m.bd) : m.kt - m.bd; }
function mucChon() { if (!P.chon) return null; const ds = { v: P.clips, b: P.broll, g: P.gfx, t: P.tieng, a: P.am3 }[P.chon.k]; return ds ? ds[P.chon.i] : null; }
function offMuc(k, m) { return Math.max(0, Math.min(daiMuc(k, m), P.t - batDauMuc(k, m))); }
function kfTai(c, ten, off) { const ds = c.kfs && c.kfs[ten]; return ds ? ds.findIndex(f => Math.abs(f.t - off) < 1 / 30) : -1; }
function datKf(c, ten, off, v, e) { c.kfs = c.kfs || {}; const ds = c.kfs[ten] = c.kfs[ten] || []; const i = kfTai(c, ten, off); if (i >= 0) { ds[i].v = v; if (e) ds[i].e = e; } else { ds.push({ t: +off.toFixed(3), v, e: e || 'deu' }); ds.sort((a, b) => a.t - b.t); } }
function xoaKf(c, ten, off) { const i = kfTai(c, ten, off); if (i >= 0) c.kfs[ten].splice(i, 1); if (c.kfs && c.kfs[ten] && !c.kfs[ten].length) delete c.kfs[ten]; }
function coKf(c) { return !!(c.kfs && Object.keys(c.kfs).some(k => c.kfs[k].length)); }
function mocKf(c) { const s = new Set(); if (c.kfs) Object.values(c.kfs).forEach(ds => ds.forEach(f => s.add(+f.t.toFixed(3)))); return [...s].sort((a, b) => a - b); }
/* giá trị thuộc tính tại off (giây tính từ đầu đoạn): keyframe nhiều điểm > keyframe cũ (đầu→cuối) > giá trị tĩnh */
function giaTriKf(c, ten, off) {
  const ds = c.kfs && c.kfs[ten];
  if (ds && ds.length) { if (off <= ds[0].t) return ds[0].v; const cuoi = ds[ds.length - 1]; if (off >= cuoi.t) return cuoi.v; for (let i = 1; i < ds.length; i++) { const a = ds[i - 1], b = ds[i]; if (off <= b.t) { const p = (off - a.t) / Math.max(1e-4, b.t - a.t); return a.v + (b.v - a.v) * (b.bz ? bezierFn(b.bz) : (EASE_KF[b.e] || EASE_KF.mem))(p); } } }
  const v0 = c[ten] == null ? PROP_MD[ten] : c[ten]; if (!c.kf || c[ten + '2'] == null) return v0;
  const p = easeIO(Math.max(0, Math.min(1, off / Math.max(0.01, daiC(c))))); return v0 + (c[ten + '2'] - v0) * p;
}
/* hoạt ảnh vào / ra (CapCut Animation In/Out) */
const AN = { khong: 'Không', mo: 'Hiện dần', phong: 'Phóng vào', thu: 'Thu vào', trai: 'Trượt từ trái', phai: 'Trượt từ phải', len: 'Trượt lên', xuong: 'Trượt xuống', xoay: 'Xoay vào', nay: 'Nảy', rung: 'Rung', mo_nhoe: 'Nhoè vào' };
function anTai(c, off, dai) {
  const o = { dx: 0, dy: 0, ds: 1, dr: 0, da: 1, blur: 0 };
  const ap = (an, p, ra) => { if (!an || !an.id || an.id === 'khong') return; const q = ra ? 1 - p : p, e = EASE_KF.vao(Math.max(0, Math.min(1, q)));
    if (an.id === 'mo') o.da *= e; else if (an.id === 'phong') { o.ds *= 1.35 - 0.35 * e; o.da *= Math.min(1, e * 2); } else if (an.id === 'thu') { o.ds *= 0.6 + 0.4 * e; o.da *= Math.min(1, e * 2); }
    else if (an.id === 'trai') o.dx += -(1 - e); else if (an.id === 'phai') o.dx += 1 - e; else if (an.id === 'len') o.dy += 1 - e; else if (an.id === 'xuong') o.dy += -(1 - e);
    else if (an.id === 'xoay') { o.dr += -35 * (1 - e); o.ds *= 0.7 + 0.3 * e; o.da *= Math.min(1, e * 1.5); } else if (an.id === 'nay') { const b = EASE_AI ? EASE_AI.nay(Math.max(0, Math.min(1, q))) : e; o.ds *= Math.max(0.01, b); }
    else if (an.id === 'rung') { const k = (1 - e); o.dx += Math.sin(off * 60) * 0.02 * k; o.dy += Math.cos(off * 47) * 0.015 * k; } else if (an.id === 'mo_nhoe') { o.blur += 18 * (1 - e); o.da *= Math.min(1, 0.3 + e); } };
  const coV = c.anVao && c.anVao.id && c.anVao.id !== 'khong', coR = c.anRa && c.anRa.id && c.anRa.id !== 'khong'; let dV = coV ? Math.max(0.1, c.anVao.d || 0.5) : 0, dR = coR ? Math.max(0.1, c.anRa.d || 0.5) : 0; if (dV + dR > dai && dai > 0) { const k = dai / (dV + dR); dV *= k; dR *= k; }   /* spec 3.6: Vào + Ra không vượt thời lượng đoạn */
  if (coV && off < dV) ap(c.anVao, off / dV, false);
  if (coR && dai - off < dR) ap(c.anRa, (dai - off) / dR, false);
  return o;
}
/* cắt khung (crop) theo % nguồn: trả về nguồn ảo đã cắt để mọi kiểu khung dọc vẫn đúng */
const catCvs = [document.createElement('canvas'), document.createElement('canvas')];
function catNguon(c, s, im, so) {
  const k = c && c.cat; if (!k || !(k.l || k.t || k.r || k.b) || !s.w) return [s, im];
  const sx = k.l * s.w, sy = k.t * s.h, sw = Math.max(8, s.w * (1 - k.l - k.r)), sh = Math.max(8, s.h * (1 - k.t - k.b)), sc = Math.min(1, 1920 / Math.max(sw, sh));
  const cvx = catCvs[so || 0], cw = Math.round(sw * sc), ch = Math.round(sh * sc); if (cvx.width !== cw || cvx.height !== ch) { cvx.width = cw; cvx.height = ch; }
  try { cvx.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch); } catch { return [s, im]; }
  return [{ ...s, w: cw, h: ch, mat: (s.mat || []).map(m => ({ ...m, cx: (m.cx * s.w - sx) / sw })) }, cvx];
}
/* ── hoàn tác / làm lại: chụp toàn bộ dòng thời gian ── */
function chupTT() { return JSON.stringify({ clips: P.clips, gfx: P.gfx, broll: P.broll, tieng: tiengNhe(), am3: am3Nhe(), moc: P.moc, zoom: P.zoom, hook: $('#hook').value, vr: [P.vao == null ? null : P.vao, P.ra == null ? null : P.ra] }); }
function apTT(s) { const o = JSON.parse(s); P.clips = o.clips; P.gfx = o.gfx; P.broll = o.broll || []; P.tieng = tiengDay(o.tieng); if (o.am3) P.am3 = am3Day(o.am3); if (o.moc) P.moc = o.moc; if (o.zoom) P.zoom = o.zoom; if (o.vr) { P.vao = o.vr[0]; P.ra = o.vr[1]; } $('#hook').value = o.hook; if (P.chon && !mucChon()) P.chon = null; veTl(); veLoi(); veKhung(); }
function luuHoanTac() { if (P.xemCat) boXemCat(); if (P.gomUndo) return; P.hoanTac.push(chupTT()); if (P.hoanTac.length > 60) P.hoanTac.shift(); P.lamLai = []; }
function hoanTac() { const s = P.hoanTac.pop(); if (!s) { toast('Không còn gì để hoàn tác'); return; } (P.lamLai = P.lamLai || []).push(chupTT()); apTT(s); }
function lamLai() { const s = (P.lamLai || []).pop(); if (!s) { toast('Không còn gì để làm lại'); return; } P.hoanTac.push(chupTT()); apTT(s); }
/* ── Q / W: xoá phần trước / sau đầu phát trong đoạn (thao tác cắt talking-head nhanh nhất của CapCut) ── */
function catDauPhat(truoc) {
  let k = P.chon && P.chon.k, m = mucChon();
  if (!m || !['v', 'b', 'g', 'a'].includes(k) || P.t < batDauMuc(k, m) || P.t > batDauMuc(k, m) + daiMuc(k, m)) { const { clip } = viTri(P.t); if (clip < 0) { toast('Chưa có đoạn nào'); return false; } k = 'v'; m = P.clips[clip]; }
  const st = batDauMuc(k, m), dai = daiMuc(k, m), off = P.t - st;
  if (off <= 0.04 || off >= dai - 0.04) { toast('Đưa đầu phát vào giữa đoạn rồi bấm ' + (truoc ? 'Q' : 'W')); return false; }
  luuHoanTac();
  if (k === 'v' && m.dao) { const toc = tocC(m); if (truoc) { m.kt = +(m.kt - off * toc).toFixed(3); ripple(st + off, -off); P.t = st; } else { m.bd = +(m.kt - off * toc).toFixed(3); ripple(st + dai, -(dai - off)); } doiKf(m, truoc ? -off : 0); }
  else if (k === 'v') { const toc = tocC(m); if (truoc) { m.bd = +(m.bd + off * toc).toFixed(3); ripple(st + off, -off); P.t = st; } else { m.kt = +(m.bd + off * toc).toFixed(3); ripple(st + dai, -(dai - off)); } doiKf(m, truoc ? -off : 0, truoc ? off : 0); }
  else if (k === 'b' || k === 'a') { const toc = k === 'b' ? tocC(m) : 1; if (truoc) { m.bd = +(m.bd + off * toc).toFixed(3); m.t_bd = +P.t.toFixed(3); } else m.kt = +(m.bd + off * toc).toFixed(3); }
  else { if (truoc) m.bd = +P.t.toFixed(3); else m.kt = +P.t.toFixed(3); }
  veTl(); veLoi(); veKhung(); vePh(); return true;
}
function doiKf(c, delta, bo) { if (!c.kfs) return; Object.keys(c.kfs).forEach(k => { c.kfs[k] = c.kfs[k].map(f => ({ ...f, t: +(f.t + delta).toFixed(3) })).filter(f => f.t >= -1e-3 && f.t <= daiC(c) + 1e-3); if (!c.kfs[k].length) delete c.kfs[k]; }); }
/* ── sao chép / dán (Ctrl+C / Ctrl+V): dán tại đầu phát ── */
function saoChep() { if (dsNhieu().length > 1) { saoChepNhieu(); return; } const m = mucChon(); if (!m) { toast('Chọn một mục để sao chép'); return; } P.boNho = { k: P.chon.k, d: JSON.parse(JSON.stringify({ ...m, el: undefined, gain: undefined })) }; toast('Đã sao chép'); }
function dan() {
  if (P.boNho && P.boNho.nhieu) { danNhieu(); return; }
  const b = P.boNho; if (!b) { toast('Chưa sao chép gì'); return; } luuHoanTac(); const d = JSON.parse(JSON.stringify(b.d));
  if (b.k === 'v') { d.id = uid(); const { clip, bdTl } = viTri(P.t); const v1 = P.clips.reduce((s, c) => s + daiC(c), 0); let vt = P.clips.length, diem = v1;
    if (clip >= 0 && P.t < v1 - 1e-3) { const c = P.clips[clip], off = P.t - bdTl;
      if (off < 1 / 30) { vt = clip; diem = bdTl; } else if (off > daiC(c) - 1 / 30) { vt = clip + 1; diem = bdTl + daiC(c); }
      else if (!c.trong && !c.cong && tachV1(clip, off)) { vt = clip + 1; diem = P.t; }   /* spec 1.8: dán giữa đoạn → tách đoạn rồi chèn bản dán vào giữa */
      else { vt = off < daiC(c) / 2 ? clip : clip + 1; diem = vt === clip ? bdTl : bdTl + daiC(c); } }
    { const ch = chupChen(); P.clips.splice(vt, 0, d); apChen(ch, diem, daiC(d)); } P.chon = { k: 'v', i: vt }; }
  else if (b.k === 'b') { d.id = uid(); d.t_bd = +P.t.toFixed(2); P.broll.push(d); P.chon = { k: 'b', i: P.broll.length - 1 }; }
  else if (b.k === 'g') { const dai = d.kt - d.bd; d.id = uid(); d.bd = +P.t.toFixed(2); d.kt = +(P.t + dai).toFixed(2); P.gfx.push(d); P.chon = { k: 'g', i: P.gfx.length - 1 }; }
  else if (b.k === 'a') { d.id = uid(); d.t_bd = +P.t.toFixed(2); P.am3.push(am3Day([d])[0]); P.chon = { k: 'a', i: P.am3.length - 1 }; }
  else if (b.k === 't') { const nguon = P.tieng.find(x => x.id === b.d.id); if (!nguon) { P.hoanTac.pop(); toast('Lồng tiếng gốc đã bị xoá'); return; } P.tieng.push({ ...nguon, el: null, gain: null, id: uid(), t_bd: +P.t.toFixed(2) }); P.chon = { k: 't', i: P.tieng.length - 1 }; }
  veTl(); veLoi(); veKhung(); toast('Đã dán tại ' + fmt1(P.t) + 's');
}
/* ── dạng sóng âm của source (vẽ trên đoạn V1 như CapCut) ── */
function tinhSong(ab) { const d = ab.getChannelData(0), buoc = Math.max(1, Math.floor(ab.sampleRate / 50)), n = Math.floor(d.length / buoc), out = new Uint8Array(n); let max = 1e-4; const tam = new Float32Array(n); for (let i = 0; i < n; i++) { let m = 0; for (let j = i * buoc, e = j + buoc; j < e; j += 4) { const v = Math.abs(d[j]); if (v > m) m = v; } tam[i] = m; if (m > max) max = m; } for (let i = 0; i < n; i++) out[i] = Math.round(255 * Math.min(1, tam[i] / max)); return out; }
async function laySong(s) { if (s.song || s.dangSong || s.loai !== 'video' || !s.file || s.file.size > 400 * 1048576) return; s.dangSong = true; try { const ab = await giaiMaAm(s.file); s.song = tinhSong(ab); s.nl = tinhNL(ab); if (!P.dang) veTl(); } catch { } s.dangSong = false; }
function veSongItem(d, s, bd, kt, wPx) { if (!s || !s.song || wPx < 8) return; const cvs = el('canvas', 'song'); const h = 16, w = Math.min(4000, Math.round(wPx)); cvs.width = w; cvs.height = h; const g = cvs.getContext('2d'); g.fillStyle = 'rgba(190,255,120,.55)'; const n = s.song.length; for (let x = 0; x < w; x++) { const t = bd + (kt - bd) * x / w, i = Math.min(n - 1, Math.floor(t * 50)), v = (s.song[i] || 0) / 255 * h; g.fillRect(x, h - v, 1, v); } d.appendChild(cvs); }
/* ── tay cầm trên khung xem trước: kéo để dời, góc để phóng, núm trên để xoay (đồng bộ 2 chiều với Thuộc tính) ── */
function hopMuc(k, m) { if (k === 'b' && m.kieu === 'pip') return { cx: 0.5, cy: 0.13 + 0.72 * 9 / 16 * (cv.width / cv.height) / 2, w: 0.72, h: 0.72 * 9 / 16 * cv.width / cv.height };
  /* khung của mục = đúng chỗ hình được vẽ (ảnh 4:5 phủ khung 9:16 thì rộng hơn khung) — để tay nắm, bo góc, bóng, mặt nạ ôm đúng hình khi thu nhỏ / dời */
  const s = m && srcCua(m.src), W = cv.width, H = cv.height; if (!s || !s.w || !s.h || s.loai === 'ghep' || (typeof m.src === 'string' && m.src.startsWith('ghep:'))) return { cx: 0.5, cy: 0.5, w: 1, h: 1 };
  const ct = m.cat || {}, iw = s.w * (1 - (ct.l || 0) - (ct.r || 0)), ih = s.h * (1 - (ct.t || 0) - (ct.b || 0)), kieu = $('#khungKieu') ? $('#khungKieu').value : 'cat';   // đã cắt khung: theo phần còn lại
  if (k === 'b' && m.vua === 'contain') { const q = Math.min(W / iw, H / ih); return { cx: 0.5, cy: 0.5, w: iw * q / W, h: ih * q / H }; }
  if (iw / ih > W / H && (kieu === 'mo' || (kieu === 'bam_mat' && s.mat && s.mat.length))) return kieu === 'mo' ? { cx: 0.5, cy: 0.5, w: 1, h: ih * W / iw / H } : { cx: 0.5, cy: 0.5, w: 1, h: 1 };
  const q = Math.max(W / iw, H / ih); return { cx: 0.5, cy: 0.5, w: iw * q / W, h: ih * q / H }; }
function tinhHop(k, m) { const off = offMuc(k, m), sc = giaTriKf(m, 'sc', off), x = giaTriKf(m, 'x', off), y = giaTriKf(m, 'y', off), xoay = giaTriKf(m, 'xoay', off), h0 = hopMuc(k, m); const sx = giaTriKf(m, 'scX', off), sy = giaTriKf(m, 'scY', off); return { off, sc, sx, sy, x, y, xoay, cx: 0.5 + (h0.cx - 0.5) * sc + x, cy: 0.5 + (h0.cy - 0.5) * sc + y, w: h0.w * sc * sx, h: h0.h * sc * sy }; }
function datHop(hop, b) { Object.assign(hop.style, { left: (b.cx - b.w / 2) * 100 + '%', top: (b.cy - b.h / 2) * 100 + '%', width: b.w * 100 + '%', height: b.h * 100 + '%', transform: 'rotate(' + b.xoay + 'deg)' }); }
function veTay() {
  const lop = $('#tayCam'); if (!lop || P.keoTay) return; lop.innerHTML = '';
  if (P.dang || !P.chon || !['v', 'b'].includes(P.chon.k)) return; const k = P.chon.k, m = mucChon(); if (!m) return;
  const st = batDauMuc(k, m), dai = daiMuc(k, m); if (P.t < st - 0.01 || P.t > st + dai + 0.01) return;
  const b0 = tinhHop(k, m), hop = el('div', 'tay'); datHop(hop, b0);
  ['tl', 'tr', 'bl', 'br'].forEach(g => hop.appendChild(el('i', 'goc ' + g))); if (m.khoaTiLe === false) ['t', 'b', 'l', 'r'].forEach(g => { const i = el('i', 'mepTay m_' + g); i.dataset.mep = g; hop.appendChild(i); }); hop.appendChild(el('i', 'xoay')); lop.appendChild(hop);   /* spec 2.4: 4 mép co giãn một chiều khi tắt khoá tỉ lệ */
  hop.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); const r = lop.getBoundingClientRect(), loai = e.target.classList.contains('goc') ? 'sc' : e.target.classList.contains('xoay') ? 'xoay' : e.target.dataset.mep ? 'mep' : 'dời', mep = e.target.dataset.mep;
    try { hop.setPointerCapture(e.pointerId); } catch { } luuHoanTac(); P.keoTay = true;
    const x0 = e.clientX, y0 = e.clientY, tamX = r.left + b0.cx * r.width, tamY = r.top + b0.cy * r.height, d0 = Math.hypot(x0 - tamX, y0 - tamY) || 1, a0 = Math.atan2(y0 - tamY, x0 - tamX), th = (b0.xoay || 0) * Math.PI / 180, cucBo = (px, py) => { const dx = px - tamX, dy = py - tamY; return [dx * Math.cos(th) + dy * Math.sin(th), -dx * Math.sin(th) + dy * Math.cos(th)]; }, [lx0, ly0] = cucBo(x0, y0), kep = v => +Math.max(0.01, Math.min(10, v)).toFixed(3);
    const dat = (ten, v) => { if (m.kfs && m.kfs[ten] && m.kfs[ten].length) datKf(m, ten, b0.off, v); else m[ten] = v; };
    let cho = false; const mv = ev => {
      if (loai === 'dời') { let vx = b0.x + (ev.clientX - x0) / r.width, vy = b0.y + (ev.clientY - y0) / r.height; const hx = !ev.altKey && Math.abs(b0.cx + vx - b0.x - 0.5) * r.width < MAC_DINH.hutKhungPx, hy = !ev.altKey && Math.abs(b0.cy + vy - b0.y - 0.5) * r.height < MAC_DINH.hutKhungPx; if (hx) vx = b0.x + 0.5 - b0.cx; if (hy) vy = b0.y + 0.5 - b0.cy; veVachTam(hx, hy); dat('x', +vx.toFixed(4)); dat('y', +vy.toFixed(4)); }   /* spec 2.4: hít tâm khung 5 px, vạch hồng; Alt tắt hít */
      else if (loai === 'sc' && ev.shiftKey) { const [lx, ly] = cucBo(ev.clientX, ev.clientY); m.khoaTiLe = false; if (Math.abs(lx0) > 2) dat('scX', kep(b0.sx * Math.abs(lx) / Math.abs(lx0))); if (Math.abs(ly0) > 2) dat('scY', kep(b0.sy * Math.abs(ly) / Math.abs(ly0))); }   /* spec 2.4: Shift + góc = không giữ tỉ lệ */
      else if (loai === 'sc') dat('sc', kep(b0.sc * Math.hypot(ev.clientX - tamX, ev.clientY - tamY) / d0));
      else if (loai === 'mep') { const [lx, ly] = cucBo(ev.clientX, ev.clientY); if (mep === 'l' || mep === 'r') { if (Math.abs(lx0) > 2) dat('scX', kep(b0.sx * Math.abs(lx) / Math.abs(lx0))); } else if (Math.abs(ly0) > 2) dat('scY', kep(b0.sy * Math.abs(ly) / Math.abs(ly0))); }
      else { let a = b0.xoay + (Math.atan2(ev.clientY - tamY, ev.clientX - tamX) - a0) * 180 / Math.PI; if (ev.shiftKey) a = Math.round(a / 15) * 15; else { const g = Math.round(a / 15) * 15; if (Math.abs(a - g) < 3) a = g; } dat('xoay', Math.round(a)); }   /* spec 2.4: giữ Shift khi xoay = bước 15° */
      datHop(hop, tinhHop(k, m)); if (!cho) { cho = true; requestAnimationFrame(() => { cho = false; veFrame(cx, cv.width, cv.height, P.t, null); }); } };
    const up = () => { veVachTam(false, false); hop.removeEventListener('pointermove', mv); hop.removeEventListener('pointerup', up); hop.removeEventListener('pointercancel', up); P.keoTay = false; veProp(); veTl(); veKhung(); };
    hop.addEventListener('pointermove', mv); hop.addEventListener('pointerup', up); hop.addEventListener('pointercancel', up);
  });
}
/* ô trượt có nút keyframe ◇ (CapCut: bấm ◇ cạnh thuộc tính để đặt keyframe tại đầu phát) */
function oTruotKf(box, nhan, min, max, buoc, k, m, ten, dinhDang) {
  const off = offMuc(k, m), coDs = m.kfs && m.kfs[ten] && m.kfs[ten].length, tai = kfTai(m, ten, off) >= 0;
  const r = oTruot(box, nhan, min, max, buoc, giaTriKf(m, ten, off), dinhDang, v => { if (coDs) datKf(m, ten, offMuc(k, m), v); else m[ten] = v; });
  const st = batDauMuc(k, m), ngoai = P.t < st - 0.01 || P.t > st + daiMuc(k, m) + 0.01;
  const nut = el('button', 'kfn' + (tai ? ' co' : coDs ? ' nua' : ''), tai ? '◆' : '◇'); nut.type = 'button'; nut.disabled = ngoai; nut.title = ngoai ? 'Đưa đầu phát vào trong đoạn để đặt keyframe' : tai ? 'Bỏ keyframe ' + KF_TEN[ten] + ' tại đầu phát' : coDs ? 'Thêm keyframe ' + KF_TEN[ten] + ' tại đầu phát (hoặc chỉ cần kéo thanh: tự thêm)' : 'Bật keyframe ' + KF_TEN[ten] + ' tại đầu phát';
  nut.onclick = () => { luuHoanTac(); const o2 = offMuc(k, m); if (kfTai(m, ten, o2) >= 0) xoaKf(m, ten, o2); else { if (!coDs && m[ten] != null) { /* lần đầu: giữ giá trị tĩnh làm keyframe */ } datKf(m, ten, o2, giaTriKf(m, ten, o2)); } veProp(); veTl(); veKhung(); };
  r.parentNode.insertBefore(nut, r); return r;
}
function veKeyframeDieuKhien(box, k, m) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Keyframe ◇')); box.appendChild(n); const moc = mocKf(m), off = offMuc(k, m), st = batDauMuc(k, m);
  const ngoaiKf = P.t < st - 0.01 || P.t > st + daiMuc(k, m) + 0.01;
  { const hd = el('span', 'kfHoi', 'ⓘ'); hd.title = 'Cách dùng keyframe:\n① Đưa đầu phát tới điểm bắt đầu\n② Bấm ◇ cạnh thuộc tính (thành ◆)\n③ Dời đầu phát tới điểm sau\n④ Đổi giá trị (kéo thanh hoặc kéo trên khung) → tự thêm ◆, máy nội suy ở giữa'; n.appendChild(hd); }
  if (ngoaiKf) n.appendChild(el('div', 'quota kfCanh', '⚠ Đầu phát đang ở ngoài đoạn này. Bấm vào thước thời gian trong khoảng của đoạn.'));
  n.appendChild(el('div', 'quota', moc.length ? moc.length + ' mốc ◆: ' + moc.map(t => fmt1(t) + 's').join(', ') + ' · bấm ◆ vàng trên dòng thời gian để nhảy tới' : 'Chưa có keyframe.'));
  { const rr = el('div', 'row'), b = el('button', 'btn nho xanh', '◆ Thêm keyframe tất cả tại đầu phát'); b.type = 'button'; b.disabled = ngoaiKf; b.onclick = () => { const o = offMuc(k, m); luuHoanTac(); ['sc', 'x', 'y', 'xoay', 'mo'].forEach(pp => datKf(m, pp, o, giaTriKf(m, pp, o))); veProp(); veTl(); veKhung(); }; rr.appendChild(b); n.appendChild(rr); }
  const r = el('div', 'row'); const nut = (t, f, dis) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.disabled = !!dis; b.onclick = f; r.appendChild(b); };
  nut('◀ ◇', () => { const t = [...moc].reverse().find(x => x < off - 0.02); if (t != null) { P.t = st + t; veKhung(); vePh(); veProp(); } }, !moc.some(x => x < off - 0.02));
  nut('◇ ▶', () => { const t = moc.find(x => x > off + 0.02); if (t != null) { P.t = st + t; veKhung(); vePh(); veProp(); } }, !moc.some(x => x > off + 0.02));
  nut('Xoá hết', () => { luuHoanTac(); delete m.kfs; m.kf = false; veProp(); veTl(); veKhung(); }, !moc.length && !m.kf);
  n.appendChild(r); veKfThem(n, k, m);
  if (moc.length) { const tai = Object.keys(m.kfs || {}).map(ten => (m.kfs[ten] || []).find(f => Math.abs(f.t - off) < 1 / 30)).filter(Boolean); if (tai.length) veChonCong(n, tai); }
  const r2 = el('div', 'row'); [['Zoom vào chậm', () => { const d = daiMuc(k, m), s0 = giaTriKf(m, 'sc', 0); m.kfs = { ...(m.kfs || {}), sc: [{ t: 0, v: s0, e: 'mem' }, { t: +d.toFixed(3), v: +(s0 * 1.15).toFixed(3), e: 'mem' }] }; }], ['Zoom ra', () => { const d = daiMuc(k, m), s0 = Math.max(1.18, giaTriKf(m, 'sc', 0)); m.kfs = { ...(m.kfs || {}), sc: [{ t: 0, v: s0, e: 'mem' }, { t: +d.toFixed(3), v: 1, e: 'mem' }] }; }], ['Lia trái → phải', () => { const d = daiMuc(k, m); m.sc = Math.max(m.sc || 1, 1.2); m.kfs = { ...(m.kfs || {}), x: [{ t: 0, v: -0.08, e: 'mem' }, { t: +d.toFixed(3), v: 0.08, e: 'mem' }] }; }], ['Đập vào (punch)', () => { const o = offMuc(k, m), s0 = giaTriKf(m, 'sc', o); m.kfs = { ...(m.kfs || {}), sc: [{ t: Math.max(0, +(o - 0.01).toFixed(3)), v: s0, e: 'deu' }, { t: +(o + 0.12).toFixed(3), v: +(s0 * 1.12).toFixed(3), e: 'vao' }, { t: +(o + 0.6).toFixed(3), v: +(s0 * 1.08).toFixed(3), e: 'mem' }] }; }]].forEach(([t, f]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.onclick = () => { luuHoanTac(); m.kf = false; f(); veProp(); veTl(); veKhung(); }; r2.appendChild(b); });
  n.appendChild(r2);
}
/* veHoatAnh: lưới Vào / Ra / Kết hợp, định nghĩa ở phần theo ảnh CapCut */
function veLatCat(box, m) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Lật & cắt khung')); box.appendChild(n);
  const r = el('div', 'row'); [['⇋ Lật ngang', 'latX'], ['⇵ Lật dọc', 'latY']].forEach(([t, p]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.setAttribute('aria-pressed', String(!!m[p])); b.onclick = () => { luuHoanTac(); m[p] = !m[p]; veProp(); veKhung(); }; r.appendChild(b); }); n.appendChild(r);
  const k = P.chon && P.chon.k === 'b' ? 'b' : 'v', bc = el('button', 'btn nho catMo', '✂ Cắt trên khung xem'); bc.type = 'button'; bc.title = 'Kéo góc / cạnh vùng cắt ngay trên khung xem · chọn tỉ lệ · Enter xong, Esc huỷ'; bc.onclick = () => batCheDoCat(); n.appendChild(bc);
  const c = catCua(m); [['l', 'Cắt trái'], ['r', 'Cắt phải'], ['t', 'Cắt trên'], ['b', 'Cắt dưới']].forEach(([p, t]) => oTruot(n, t, 0, 0.9, 0.01, c[p] || 0, pct, v => { apDoiCat(k, m, { ...catCua(m), [p]: v }); }));   /* cắt mà phần còn lại đứng yên, không tự phóng cho đầy khung */
}
/* ── Ctrl + cuộn trên dòng thời gian để zoom (giữ đầu phát đứng yên) ── */
$('#tlScroll').addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const sc = $('#tlScroll'), r = sc.getBoundingClientRect(), tChuot = (e.clientX - r.left + sc.scrollLeft - LB) / PX(); const z = Math.max(6, Math.min(80, P.pxs * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); P.pxs = Math.round(z); $('#zoomTl').value = P.pxs; veTl(); sc.scrollLeft = Math.max(0, tChuot * PX() + 64 - (e.clientX - r.left)); }, { passive: false });
$('#btnLamLai').onclick = lamLai;

function am3Nhe() { return (P.am3 || []).map(a => ({ ...a, el: undefined, gain: undefined })); }
function am3Day(ds) { return (ds || []).map(a => ({ ...a })); }

/* ═════════ PHẦN B (10/2026): chữ đầy đủ kiểu dáng + mẫu chữ · mẫu phụ đề + nhập SRT · sticker tải lên · lớp V3 ·
   nền khung (màu / mờ / ảnh) · chỉnh màu bằng shader WebGL · cường độ bộ lọc · hiệu ứng clip ═════════ */
const FONT_DS = [['be_vietnam', 'Be Vietnam Pro'], ['montserrat', 'Montserrat'], ['bricolage', 'Bricolage'], ['lexend', 'Lexend'], ['oswald', 'Oswald'], ['anton', 'Anton'], ['playfair', 'Playfair']];
const fontCua = g => (g.font && FONT_CSS[g.font] ? FONT_CSS[g.font] + ', ' : '') + FONT;
/* chữ tự do: kiểu dáng đầy đủ như CapCut (font, đậm, nghiêng, gạch chân, giãn chữ, giãn dòng, căn lề, viền, bóng, phát sáng, nền bo góc)
   + hoạt ảnh vào (hu), ra (ra), lặp (lap) */
function veChuTuDo(ctx, W, H, g, tl, dai) {
  const Wt = Math.min(W, H * 0.75), stk = g.kieu === 'sticker', size = Math.round(Wt * (g.co || (stk ? 0.16 : 0.075))), bb = bamTai(g, tl), x = ((g.x == null ? 0.5 : g.x) + (bb ? bb.dx : 0)) * W, y = ((g.y == null ? 0.32 : g.y) + (bb ? bb.dy : 0)) * H, hu = g.hu || 'pop', ra = g.ra || 'mo', lap = g.lap || 'khong';
  const dVao = g.dVao || 0.35, dRa = g.dRa || 0.3, vao = g.boVao ? 1 : ease(tl / dVao), conRa = !g.boRa && dai - tl < dRa ? ease((dai - tl) / dRa) : 1;
  ctx.save(); ctx.translate(x, y); let alpha = 1;
  if (hu === 'pop') { const s2 = tl < dVao ? 0.4 + 0.6 * vao + 0.12 * Math.sin(vao * Math.PI) : 1; ctx.scale(s2, s2); }
  if (hu === 'mo') alpha *= vao; if (hu === 'truot') ctx.translate((1 - vao) * -W * 0.6, 0); if (hu === 'len') { ctx.translate(0, (1 - vao) * H * 0.08); alpha *= vao; }
  if (hu === 'phong') { const s2 = 1.6 - 0.6 * vao; ctx.scale(s2, s2); alpha *= vao; } if (hu === 'xoay') { ctx.rotate((1 - vao) * -0.6); alpha *= vao; } if (hu === 'nhoe' && vao < 1) { ctx.filter = 'blur(' + ((1 - vao) * size * 0.3).toFixed(1) + 'px)'; alpha *= vao; }
  if (hu === 'nay') { const b = Math.abs(Math.sin(tl * 5)) * size * 0.12; ctx.translate(0, -b); ctx.rotate(Math.sin(tl * 3) * 0.08); }
  if (hu === 'lac') ctx.rotate(Math.sin(tl * 14) * 0.06 * Math.max(0, 1 - tl / 1.2));
  if (conRa < 1) { if (ra === 'mo') alpha *= conRa; else if (ra === 'thu') { ctx.scale(conRa, conRa); } else if (ra === 'truot') ctx.translate((1 - conRa) * W * 0.6, 0); else if (ra === 'roi') { ctx.translate(0, (1 - conRa) * H * 0.1); alpha *= conRa; } }
  if (lap === 'nhip') { const s2 = 1 + 0.06 * Math.sin(tl * Math.PI * 2 * 1.2); ctx.scale(s2, s2); } else if (lap === 'nay') ctx.translate(0, -Math.abs(Math.sin(tl * 4)) * size * 0.15); else if (lap === 'lac') ctx.rotate(Math.sin(tl * 6) * 0.05); else if (lap === 'nhap_nhay') alpha *= 0.65 + 0.35 * Math.abs(Math.sin(tl * 5));
  ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));
  let text = String(g.text || ''); if (g.hoa === 'hoa') text = text.toUpperCase(); else if (g.hoa === 'thuong') text = text.toLowerCase(); else if (g.hoa === 'dau') text = text.toLowerCase().replace(/(^|[\s|])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  if (hu === 'go') text = text.slice(0, Math.ceil(text.length * Math.min(1, tl / Math.max(0.4, dai * 0.5))));
  if (g.xoay) ctx.rotate(g.xoay * Math.PI / 180); if (g.mo != null) ctx.globalAlpha *= Math.max(0, Math.min(1, g.mo));
  const can = g.can || 'center'; ctx.textAlign = can; ctx.textBaseline = 'middle';
  ctx.font = stk ? size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' : (g.nghieng ? 'italic ' : '') + (g.dam || 900) + ' ' + size + 'px ' + fontCua(g);
  try { ctx.letterSpacing = stk ? '0px' : ((g.gianChu || 0) * size).toFixed(1) + 'px'; } catch { }
  let dong = text.split(/\n|\|/); if (g.rongMax > 0 && !stk) dong = dong.flatMap(d => ngatDong(ctx, d, g.rongMax * W));   /* spec 4.1: kéo mép khung chữ đặt độ rộng tối đa → tự xuống dòng */
  const lh = size * (g.dongCao || 1.22), y0 = -(dong.length - 1) * lh / 2, rong = Math.max(...dong.map(d => ctx.measureText(d).width), 1);
  const nen = stk ? 'khong' : (g.nen || 'vien'), vienMau = g.vien_mau || '#000', vienDay = g.vien_day == null ? 0.16 : g.vien_day;
  const macDinh = stk ? '#fff' : (nen === 'hop_mau' && !g.mau ? '#101400' : (g.mau === 'nhan' ? mauNhan() : (g.mau || '#fff')));
  if (!stk && (g.doc || g.cong)) { veChuDacBiet(ctx, g, dong, size, lh, { nen, vienMau, vienDay, mac: macDinh, rong }); ctx.restore(); return g.doc ? lh * dong.length : rong; }
  dong.forEach((d, i) => { const yy = y0 + i * lh, w = ctx.measureText(d).width, x0 = can === 'left' ? 0 : can === 'right' ? -w : -w / 2;
    if (nen === 'hop' || nen === 'hop_mau' || (g.nen_mau && nen !== 'khong')) { const pad = (g.nen_pad == null ? 0.35 : g.nen_pad) * size; ctx.save(); ctx.globalAlpha *= g.nen_mo == null ? 1 : g.nen_mo; ctx.fillStyle = g.nen_mau || (nen === 'hop' ? 'rgba(10,12,14,.82)' : mauNhan()); ctx.beginPath(); ctx.roundRect(x0 - pad, yy - lh / 2, w + pad * 2, lh, (g.nen_bo == null ? 0.25 : g.nen_bo) * size); ctx.fill(); ctx.restore(); }
    if (g.phat_sang) { ctx.save(); ctx.shadowColor = g.phat_sang; ctx.shadowBlur = size * 0.6; ctx.fillStyle = g.phat_sang; ctx.fillText(d, can === 'center' ? 0 : can === 'left' ? 0 : 0, yy); ctx.restore(); }
    if (nen === 'vien' || g.vien) { ctx.lineWidth = size * vienDay; ctx.strokeStyle = vienMau; ctx.lineJoin = 'round'; ctx.strokeText(d, 0, yy); }
    if (nen === 'bong' || g.bong) bongChu(ctx, g, size);
    ctx.fillStyle = g.mau2 && !stk ? gradChu(ctx, g, rong, lh * dong.length, can === 'left' ? rong / 2 : can === 'right' ? -rong / 2 : 0, 0) : macDinh; ctx.fillText(d, 0, yy); ctx.shadowColor = 'transparent';
    if (g.gach && !stk) { ctx.fillRect(x0, yy + size * 0.45, w, Math.max(1, size * 0.06)); } });
  ctx.restore(); return rong;
}
function veThuocTinhChu(box, g) {
  const stk = g.kieu === 'sticker', n = el('div', 'nhom2'); n.appendChild(el('b', null, stk ? 'Sticker' : 'Kiểu chữ')); box.appendChild(n);
  if (stk) { const r = el('div', 'row'); ['🔥', '💯', '👉', '⭐', '❤️', '😂', '😱', '✅', '❌', '💡', '🎯', '🚀', '💰', '👀', '🙌', '⚡'].forEach(em => { const b = el('button', 'btn nho', em); b.type = 'button'; b.onclick = () => { luuHoanTac(); g.text = em; veTl(); veKhung(); veProp(); }; r.appendChild(b); }); n.appendChild(r); }
  if (g.kieu === 'chu' || g.kieu === 'ghim_ban_do') {
    if (g.kieu === 'chu') {
      oChon(n, 'Font', FONT_DS, g.font || $('#font').value, v => { g.font = v; try { document.fonts.load('900 40px ' + FONT_CSS[v]).then(() => veKhung()); } catch { } });
      oChon(n, 'Độ đậm', [['500', 'Thường'], ['700', 'Đậm vừa'], ['800', 'Đậm'], ['900', 'Rất đậm']], String(g.dam || 900), v => { g.dam = +v; });
      const r = el('div', 'row'); [['I', 'nghieng', 'Nghiêng'], ['U', 'gach', 'Gạch chân']].forEach(([t, p, tt]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.title = tt; b.style.fontStyle = p === 'nghieng' ? 'italic' : ''; b.style.textDecoration = p === 'gach' ? 'underline' : ''; b.setAttribute('aria-pressed', String(!!g[p])); b.onclick = () => { luuHoanTac(); g[p] = !g[p]; veProp(); veKhung(); }; r.appendChild(b); });
      [['left', '⇤'], ['center', '↔'], ['right', '⇥']].forEach(([v, t]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.title = 'Căn ' + ({ left: 'trái', center: 'giữa', right: 'phải' })[v]; b.setAttribute('aria-pressed', String((g.can || 'center') === v)); b.onclick = () => { luuHoanTac(); g.can = v; veProp(); veKhung(); }; r.appendChild(b); }); n.appendChild(r);
      const mau = (nhan, p, md) => { const l = el('label'); l.appendChild(el('span', null, nhan)); const m = el('input'); m.type = 'color'; m.value = /^#/.test(g[p] || '') ? g[p] : md; m.oninput = () => { g[p] = m.value; veKhung(); }; m.onchange = () => luuHoanTac(); l.appendChild(m); n.appendChild(l); };
      mau('Màu chữ', 'mau', '#ffffff'); veChuThem(n, g, mau);
      oChon(n, 'Nền chữ', [['vien', 'Viền'], ['bong', 'Bóng đổ'], ['hop', 'Hộp tối'], ['hop_mau', 'Hộp màu nhấn'], ['khong', 'Không']], g.nen || 'vien', v => { g.nen = v; delete g.nen_mau; });
      veBongChuProp(n, g);
      if ((g.nen || 'vien') === 'vien') { mau('Màu viền', 'vien_mau', '#000000'); oTruot(n, 'Độ dày viền', 0, 0.4, 0.01, g.vien_day == null ? 0.16 : g.vien_day, v => Math.round(v * 100) + '%', v => { g.vien_day = v; }); }
      if (g.nen === 'hop' || g.nen === 'hop_mau') { mau('Màu hộp', 'nen_mau', g.nen === 'hop' ? '#0a0c0e' : '#99DF00'); oTruot(n, 'Bo góc', 0, 0.6, 0.01, g.nen_bo == null ? 0.25 : g.nen_bo, pct, v => { g.nen_bo = v; }); oTruot(n, 'Đệm', 0, 1, 0.01, g.nen_pad == null ? 0.35 : g.nen_pad, pct, v => { g.nen_pad = v; }); }
      const l = el('label'); l.appendChild(el('span', null, 'Phát sáng')); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!g.phat_sang; cb.onchange = () => { luuHoanTac(); g.phat_sang = cb.checked ? mauNhan() : ''; veKhung(); }; l.appendChild(cb); n.appendChild(l);
      oTruot(n, 'Giãn chữ', -0.05, 0.3, 0.005, g.gianChu || 0, v => Math.round(v * 100) + '%', v => { g.gianChu = v; });
      oTruot(n, 'Giãn dòng', 1, 2, 0.01, g.dongCao || 1.22, v => v.toFixed(2), v => { g.dongCao = v; });
    }
  }
  oTruot(n, 'Cỡ', 0.03, stk ? 0.4 : 0.2, 0.005, g.co || (stk ? 0.16 : 0.075), v => Math.round(v * 1000) / 10 + '', v => { g.co = v; });
  const n2 = el('div', 'nhom2'); n2.appendChild(el('b', null, 'Hoạt ảnh chữ')); box.appendChild(n2);
  oChon(n2, 'Vào', [['pop', 'Bật'], ['mo', 'Hiện dần'], ['truot', 'Trượt vào'], ['len', 'Nổi lên'], ['phong', 'Phóng to vào'], ['xoay', 'Xoay vào'], ['nhoe', 'Nhoè vào'], ['go', 'Gõ chữ'], ['nay', 'Nảy liên tục'], ['lac', 'Lắc'], ['khong', 'Không']], g.hu || 'pop', v => { g.hu = v; });
  oChon(n2, 'Ra', [['mo', 'Mờ dần'], ['thu', 'Thu nhỏ'], ['truot', 'Trượt ra'], ['roi', 'Rơi xuống'], ['khong', 'Không']], g.ra || 'mo', v => { g.ra = v; });
  oChon(n2, 'Lặp', [['khong', 'Không'], ['nhip', 'Nhịp to nhỏ'], ['nay', 'Nảy'], ['lac', 'Lắc nhẹ'], ['nhap_nhay', 'Nhấp nháy']], g.lap || 'khong', v => { g.lap = v; });
  oTruot(n2, 'Thời lượng vào', 0.1, 1.5, 0.05, g.dVao || 0.35, v => v.toFixed(2) + 's', v => { g.dVao = v; });
  oTruot(n2, 'Vị trí ngang', 0.02, 0.98, 0.01, g.x == null ? 0.5 : g.x, pct, v => { g.x = v; });
  oTruot(n2, 'Vị trí dọc', 0.03, 0.97, 0.01, g.y == null ? 0.32 : g.y, pct, v => { g.y = v; });
  n2.appendChild(el('div', 'quota', 'Kéo thẳng trên khung xem trước để đặt chỗ. Xuống dòng bằng dấu |'));
}
/* mẫu chữ (text template) có sẵn kiểu + hoạt ảnh */
const MAU_CHU = [
  ['Tiêu đề vàng', { text: 'TIÊU ĐỀ', co: 0.1, mau: '#FFD400', nen: 'vien', vien_day: 0.2, hu: 'pop', font: 'anton', y: 0.22 }],
  ['Hộp đen chữ trắng', { text: 'Điều quan trọng', co: 0.065, mau: '#ffffff', nen: 'hop', nen_mau: '#0a0c0e', nen_bo: 0.3, hu: 'len', y: 0.3 }],
  ['Nhãn màu nhấn', { text: 'MẸO HAY', co: 0.06, mau: '#101400', nen: 'hop_mau', nen_bo: 0.6, dam: 900, hu: 'truot', y: 0.18, x: 0.3 }],
  ['Neon phát sáng', { text: 'NEON', co: 0.1, mau: '#ffffff', nen: 'khong', phat_sang: '#00e5ff', hu: 'nhoe', lap: 'nhap_nhay', font: 'montserrat' }],
  ['Gõ chữ máy', { text: 'Đang gõ...', co: 0.06, mau: '#ffffff', nen: 'hop', nen_mau: '#111111', hu: 'go', font: 'lexend', dam: 700, can: 'left', x: 0.1 }],
  ['Chữ to 2 dòng', { text: 'NÓI ÍT|LÀM NHIỀU', co: 0.11, mau: '#ffffff', nen: 'vien', hu: 'phong', font: 'anton', dongCao: 1.05 }],
  ['Trích dẫn nghiêng', { text: '"Bắt đầu từ việc nhỏ"', co: 0.06, mau: '#ffffff', nen: 'bong', nghieng: true, hu: 'mo', font: 'playfair', dam: 700 }],
  ['Chú thích nhỏ', { text: '*Kết quả có thể khác nhau', co: 0.032, mau: '#e5e7eb', nen: 'bong', hu: 'mo', dam: 600, y: 0.9 }],
  ['Số liệu nổi bật', { text: '+250%', co: 0.16, mau: 'nhan', nen: 'vien', hu: 'phong', lap: 'nhip', font: 'anton' }],
  ['Kêu gọi follow', { text: 'FOLLOW ĐỂ XEM PHẦN 2 👉', co: 0.05, mau: '#ffffff', nen: 'hop', nen_mau: '#fe2c55', nen_bo: 0.6, hu: 'len', lap: 'nay', y: 0.8 }]
];
function themMauChu(i) { const [ten, st] = MAU_CHU[i]; luuHoanTac(); const g = { id: uid(), kieu: 'chu', bd: +P.t.toFixed(2), kt: +(P.t + 3).toFixed(2), phu: '', x: 0.5, y: 0.32, ...JSON.parse(JSON.stringify(st)) }; P.gfx.push(g); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veProp(); veKhung(); toast('Đã thêm "' + ten + '" tại ' + fmt1(P.t) + 's'); return g; }
/* mẫu phụ đề một chạm */
const MAU_PD = [
  ['Trắng viền đen', { pdKieu: 'vien', mau: '#FFD400', font: 'be_vietnam', cum: 4, y: 0.78 }],
  ['Vàng karaoke', { pdKieu: 'highlight', mau: '#FFD400', font: 'anton', cum: 3, y: 0.72 }],
  ['Hộp nền đen', { pdKieu: 'toi', mau: '#4bc3ff', font: 'be_vietnam', cum: 5, y: 0.8 }],
  ['Viên thuốc', { pdKieu: 'pill', mau: '#99DF00', font: 'montserrat', cum: 4, y: 0.78 }],
  ['Bật từng từ', { pdKieu: 'pop', mau: '#99DF00', font: 'montserrat', cum: 2, y: 0.65 }],
  ['Nổi lên nhẹ', { pdKieu: 'rise', mau: '#ffffff', font: 'lexend', cum: 4, y: 0.8 }]
];
function apMauPD(i) { const p = MAU_PD[i][1]; luuHoanTac(); $('#phuDe').checked = true; $('#pdKieu').value = p.pdKieu; $('#pdCum').value = p.cum; P.pdY = p.y; const o = [...$('#pdViTri').options].find(x => Math.abs(+x.value - p.y) < 0.03); if (o) $('#pdViTri').value = o.value; $('#font').value = p.font; capNhatFont(); const b = $$('#pdMau button').find(x => x.dataset.m.toLowerCase() === p.mau.toLowerCase()); if (b) { $$('#pdMau button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); } docTuNhan(); veTl(); veKhung(); toast('Phụ đề: ' + MAU_PD[i][0]); }
/* nhập phụ đề .srt: thay phụ đề tự sinh bằng phụ đề nhập (giờ trên dòng thời gian) */
function docSrt(txt) { const out = []; String(txt).replace(/\r/g, '').split(/\n\s*\n/).forEach(kh => { const m = kh.match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/); if (!m) return; const g = (a, b, c, d) => (+a) * 3600 + (+b) * 60 + (+c) + (+d) / 1000; const bd = g(m[1], m[2], m[3], m[4]), kt = g(m[5], m[6], m[7], m[8]); const text = kh.slice(kh.indexOf(m[0]) + m[0].length).trim().replace(/<[^>]+>/g, '').replace(/\n+/g, ' '); if (text && kt > bd) out.push({ bd: +bd.toFixed(3), kt: +kt.toFixed(3), text }); }); return out; }
function cumNgoai() { return (P.pdNgoai || []).map((c, ng) => { if (c.tu && c.tu.length) return { bd: c.bd, kt: c.kt, ng, tu: c.tu.map(t => ({ w: t.w, bd: t.bd, kt: t.kt })) }; const ws = c.text.split(/\s+/).filter(Boolean), d = (c.kt - c.bd) / Math.max(1, ws.length); return { bd: c.bd, kt: c.kt, ng, tu: ws.map((w, i) => ({ w, bd: c.bd + i * d, kt: c.bd + (i + 1) * d })) }; }); }
/* sticker tải lên (PNG/GIF/WebP) thành overlay V3 vừa trong khung */
async function themSticker(files) { for (const f of files) { await themFile([f]); const s = P.srcs.filter(z => z.ten === f.name).pop(); if (!s) continue; s.loai_canh = 'broll'; s.tt = 'xong'; s.mo_ta = 'Sticker ' + f.name; luuHoanTac(); P.broll.push({ id: uid(), src: s.id, bd: 0, kt: 3, t_bd: +P.t.toFixed(2), kieu: 'full', vua: 'contain', sc: 0.35, y: -0.22, anVao: { id: 'nay', d: 0.4 } }); P.chon = { k: 'b', i: P.broll.length - 1 }; } veSrcs(); veTl(); veProp(); veKhung(); }
/* nền khung khi hình không phủ kín (CapCut Canvas: màu / mờ / ảnh) */
let nenAnh = null;
function veNenKhung(ctx, W, H, c, s, im) {
  const k = $('#nenKhung') ? $('#nenKhung').value : 'den';
  if (k === 'mau') { ctx.fillStyle = $('#nenKhungMau').value || '#000'; ctx.fillRect(0, 0, W, H); return; }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (k === 'anh' && nenAnh) { const sc = Math.max(W / nenAnh.naturalWidth, H / nenAnh.naturalHeight); ctx.drawImage(nenAnh, W / 2 - nenAnh.naturalWidth * sc / 2, H / 2 - nenAnh.naturalHeight * sc / 2, nenAnh.naturalWidth * sc, nenAnh.naturalHeight * sc); return; }
  if (k === 'mo' && s && im && s.w) { ctx.save(); ctx.filter = 'blur(' + Math.round(W / 22) + 'px) brightness(.62)'; const sc = Math.max(W / s.w, H / s.h) * 1.15; ctx.drawImage(im, W / 2 - s.w * sc / 2, H / 2 - s.h * sc / 2, s.w * sc, s.h * sc); ctx.restore(); }
}
/* chỉnh màu nâng cao bằng shader WebGL: phơi sáng, nhiệt độ, tint, vùng sáng, vùng tối, vignette, hạt phim */
const MAU_GL = { cv: null, gl: null, pr: null, tex: null };
const MAU_KEYS = ['phoi', 'nhiet', 'tint', 'sang_cao', 'toi', 'vignette', 'hat', 'trang', 'den', 'hue', 'vib', 'phai', 'net', 'ro', 'lut', 'banh', 'cmau', 'hsl'];
function coChinhMau(c) { return MAU_KEYS.some(k => c[k]) || (c.hu2 === 'phim_cu'); }
function mauGL() {
  if (MAU_GL.gl !== null && MAU_GL.cv) return MAU_GL.gl; MAU_GL.cv = document.createElement('canvas'); const gl = MAU_GL.cv.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true }); MAU_GL.gl = gl || false; if (!gl) return false;
  const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p;varying vec2 uv;void main(){uv=(p+1.)/2.;gl_Position=vec4(p,0.,1.);}'); gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, 'precision mediump float;varying vec2 uv;uniform sampler2D t;uniform sampler2D lt;uniform float phoi,nhiet,tint,cao,toi,vig,hat,tg,trang,den,hue,vib,phai,net,ro,lutN,lutMuc;uniform vec2 res;uniform vec4 lift,gam,gain;uniform vec3 hsl[8];uniform float hc[8];uniform float coHsl,coCong;uniform sampler2D ct;vec3 lutS(vec3 c){float n=lutN;float b=c.b*(n-1.);float b0=floor(b);float b1=min(b0+1.,n-1.);vec2 o=vec2((c.r*(n-1.)+.5)/(n*n),(c.g*(n-1.)+.5)/n);return mix(texture2D(lt,o+vec2(b0/n,0.)).rgb,texture2D(lt,o+vec2(b1/n,0.)).rgb,b-b0);}vec3 hueR(vec3 c,float a){vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}void main(){vec4 s=texture2D(t,uv);vec3 c=s.rgb;vec2 px=1./res;if(net>0.){vec3 bl=(texture2D(t,uv+vec2(px.x,0.)).rgb+texture2D(t,uv-vec2(px.x,0.)).rgb+texture2D(t,uv+vec2(0.,px.y)).rgb+texture2D(t,uv-vec2(0.,px.y)).rgb)*.25;c+=(c-bl)*net*1.6;}if(ro!=0.){vec3 b4=(texture2D(t,uv+vec2(px.x*4.,0.)).rgb+texture2D(t,uv-vec2(px.x*4.,0.)).rgb+texture2D(t,uv+vec2(0.,px.y*4.)).rgb+texture2D(t,uv-vec2(0.,px.y*4.)).rgb)*.25;float lm=dot(s.rgb,vec3(.299,.587,.114));c+=(s.rgb-b4)*ro*1.2*(1.-abs(lm-.5)*1.6);}c=c*pow(2.,phoi);c.r+=nhiet*.08;c.b-=nhiet*.08;c.g+=tint*.06;float l=dot(c,vec3(.2126,.7152,.0722));c+=cao*smoothstep(.45,1.,l)*.3;c+=toi*(1.-smoothstep(0.,.55,l))*.3;c+=trang*smoothstep(.7,1.,l)*.25;c+=den*(1.-smoothstep(0.,.25,l))*.18;if(hue!=0.)c=hueR(c,hue);if(vib!=0.){float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));float l2=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l2),c,1.+vib*(1.-(mx-mn)));}c=c*(1.-phai*.22)+phai*.1;c=c+(lift.rgb*.25+vec3(lift.a*.2))*(1.-clamp(c,0.,1.));c=c*(1.+gain.rgb*.5+vec3(gain.a*.5));c=pow(max(c,vec3(0.)),exp(-(gam.rgb*.6+vec3(gam.a*.8))));if(coHsl>0.){vec3 q3=clamp(c,0.,1.);float mxh=max(q3.r,max(q3.g,q3.b)),mnh=min(q3.r,min(q3.g,q3.b)),dlh=mxh-mnh,hh=0.;if(dlh>1e-4){if(mxh==q3.r)hh=mod((q3.g-q3.b)/dlh,6.);else if(mxh==q3.g)hh=(q3.b-q3.r)/dlh+2.;else hh=(q3.r-q3.g)/dlh+4.;hh/=6.;}float sth=mxh>0.?dlh/mxh:0.;vec3 acc3=vec3(0.);for(int i=0;i<8;i++){float dd=abs(hh-hc[i]);dd=min(dd,1.-dd);acc3+=hsl[i]*max(0.,1.-dd/.09)*sth;}c=hueR(c,acc3.x*6.2832);float l3=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l3),c,1.+acc3.y);c+=acc3.z*.35;}if(coCong>0.){vec3 q4=clamp(c,0.,1.)*(255./256.)+.5/256.;c=vec3(texture2D(ct,vec2(q4.r,.5)).r,texture2D(ct,vec2(q4.g,.5)).g,texture2D(ct,vec2(q4.b,.5)).b);}if(lutN>1.){vec3 q=clamp(c,0.,1.);c=mix(q,lutS(q),lutMuc);}float d=distance(uv,vec2(.5));c*=1.-vig*smoothstep(.3,.85,d);float n=fract(sin(dot(floor(uv*res)+tg,vec2(12.9898,78.233)))*43758.5453);c+=(n-.5)*hat*.18;gl_FragColor=vec4(clamp(c,0.,1.),s.a);}'); gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { MAU_GL.gl = false; return false; }
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); gl.useProgram(pr); MAU_GL.pr = pr; gl.uniform1i(gl.getUniformLocation(pr, 't'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'lt'), 1); gl.uniform1i(gl.getUniformLocation(pr, 'ct'), 2); gl.uniform1fv(gl.getUniformLocation(pr, 'hc'), new Float32Array([0, 30, 60, 120, 180, 240, 275, 315].map(x => x / 360)));
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  MAU_GL.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, MAU_GL.tex); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)); [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR)); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  return gl;
}
const mauCv = document.createElement('canvas');
function chinhMau(c, s, im, tg) {
  if (!coChinhMau(c) || !s.w) return [s, im]; const gl = mauGL(); if (!gl) return [s, im];
  const k = Math.min(1, 1280 / Math.max(s.w, s.h)), w = Math.round(s.w * k), h = Math.round(s.h * k); if (MAU_GL.cv.width !== w || MAU_GL.cv.height !== h) { MAU_GL.cv.width = w; MAU_GL.cv.height = h; gl.viewport(0, 0, w, h); }
  const phim = c.hu2 === 'phim_cu', u = (n, v) => gl.uniform1f(gl.getUniformLocation(MAU_GL.pr, n), v);
  try { gl.bindTexture(gl.TEXTURE_2D, MAU_GL.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); } catch { return [s, im]; }
  u('phoi', (c.phoi || 0) / 100); u('nhiet', (c.nhiet || 0) / 100 + (phim ? 0.25 : 0)); u('tint', (c.tint || 0) / 100); u('cao', (c.sang_cao || 0) / 100); u('toi', (c.toi || 0) / 100); u('vig', (c.vignette || 0) / 100 + (phim ? 0.45 : 0)); u('hat', (c.hat || 0) / 100 + (phim ? 0.5 : 0)); u('tg', Math.floor((tg || 0) * 24)); u('trang', (c.trang || 0) / 100); u('den', (c.den || 0) / 100); u('hue', (c.hue || 0) * Math.PI / 180); u('vib', (c.vib || 0) / 100); u('phai', (c.phai || 0) / 100); u('net', (c.net || 0) / 100); u('ro', (c.ro || 0) / 100);
  const lut = c.lut && P.luts && P.luts[c.lut]; if (lut) { const tx = lutTex(gl, lut); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tx); gl.activeTexture(gl.TEXTURE0); u('lutN', lut.n); u('lutMuc', c.lutMuc == null ? 1 : c.lutMuc); } else u('lutN', 0); datUniformMauNangCao(gl, c); gl.uniform2f(gl.getUniformLocation(MAU_GL.pr, 'res'), w, h);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); if (mauCv.width !== w || mauCv.height !== h) { mauCv.width = w; mauCv.height = h; } const g = mauCv.getContext('2d'); g.clearRect(0, 0, w, h); g.drawImage(MAU_GL.cv, 0, 0);
  return [{ ...s, w, h }, mauCv];
}
/* hiệu ứng clip (CapCut Video effects) */
const HIEU_UNG = { khong: 'Không', rung: 'Rung máy quay', nhip: 'Nhịp phóng (theo beat)', chop: 'Chớp sáng đầu đoạn', ro_sang: 'Vệt sáng (light leak)', phim_cu: 'Phim cũ', nhoe_zoom: 'Phóng nhoè đầu đoạn' };
function hieuUngTruoc(c, off, o) {
  const h = c.hu2; if (!h || h === 'khong') return;
  if (h === 'rung') { o.dx += Math.sin(off * 37) * 0.008 + Math.sin(off * 23) * 0.006; o.dy += Math.cos(off * 31) * 0.007; o.dr += Math.sin(off * 19) * 0.6; o.ds *= 1.04; }
  else if (h === 'nhip') { const t = batDauC(c) + off; let gan = 1; if (P.beat.length) { for (const b of P.beat) { const d = t - b; if (d >= 0 && d < gan) gan = d; } } else gan = (off % 0.5); o.ds *= 1 + 0.06 * Math.max(0, 1 - gan / 0.25); }
  else if (h === 'nhoe_zoom' && off < 0.4) { const p = off / 0.4; o.ds *= 1.25 - 0.25 * EASE_KF.vao(p); o.blur += 14 * (1 - p); }
}
function hieuUngSau(ctx, W, H, c, off) {
  const h = c.hu2; if (!h || h === 'khong') return;
  if (h === 'chop' && off < 0.3) { ctx.save(); ctx.globalAlpha = (1 - off / 0.3) * 0.85; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  else if (h === 'ro_sang') { ctx.save(); ctx.globalCompositeOperation = 'screen'; const x = W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(off * 0.9))), gr = ctx.createRadialGradient(x, H * 0.15, 0, x, H * 0.15, W * 0.9); gr.addColorStop(0, 'rgba(255,170,60,.55)'); gr.addColorStop(0.5, 'rgba(255,80,40,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  else if (h === 'phim_cu') { ctx.save(); ctx.globalAlpha = 0.06 + 0.05 * Math.abs(Math.sin(off * 17)); ctx.fillStyle = '#fff3d6'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

function khoiTaoB() {
MAU_CHU.forEach(([ten, st], i) => { const b = el('button'); b.type = 'button'; b.textContent = ten; b.style.fontFamily = st.font ? FONT_CSS[st.font] : ''; b.style.color = st.mau && st.mau !== 'nhan' && st.nen !== 'hop_mau' ? st.mau : ''; if (st.nen === 'hop' || st.nen_mau) b.style.background = st.nen_mau || '#0a0c0e'; b.onclick = () => themMauChu(i); $('#mauChu').appendChild(b); });
$('#btnThemChu').onclick = () => { luuHoanTac(); P.gfx.push({ id: uid(), kieu: 'chu', bd: +P.t.toFixed(2), kt: +(P.t + 3).toFixed(2), text: 'Chữ của bạn', phu: '', ...GX_MD.chu }); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veProp(); veKhung(); moPhaiNeuCan(); };
['🔥', '💯', '👉', '⭐', '❤️', '😂', '😱', '✅', '💡', '🚀', '💰', '👀'].forEach(em => { const b = el('button', 'btn nho', em); b.type = 'button'; b.onclick = () => { luuHoanTac(); P.gfx.push({ id: uid(), kieu: 'sticker', bd: +P.t.toFixed(2), kt: +(P.t + 2).toFixed(2), text: em, phu: '', ...GX_MD.sticker }); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veProp(); veKhung(); }; $('#emojiNhanh').appendChild(b); });
$('#stickerIn').onchange = async e => { const fs = [...e.target.files]; if (fs.length) { await themSticker(fs); toast('Đã thêm ' + fs.length + ' sticker lên V3, kéo góc trên khung để chỉnh cỡ'); } e.target.value = ''; };
MAU_PD.forEach(([ten], i) => { const b = el('button'); b.type = 'button'; b.textContent = ten; b.onclick = () => apMauPD(i); $('#mauPd').appendChild(b); });
$('#srtIn').onchange = async e => { const f0 = e.target.files[0]; if (!f0) return; const ds = docSrt(await f0.text()); e.target.value = ''; if (!ds.length) { toast('File phụ đề không đọc được'); return; } luuHoanTac(); P.pdNgoai = ds; $('#phuDe').checked = true; cumKey = ''; $('#srtTt').textContent = ds.length + ' dòng từ ' + f0.name; $('#btnBoSrt').hidden = false; veTl(); veKhung(); toast('Đã nhập ' + ds.length + ' dòng phụ đề'); };
$('#btnBoSrt').onclick = () => { luuHoanTac(); P.pdNgoai = null; cumKey = ''; $('#srtTt').textContent = ''; $('#btnBoSrt').hidden = true; veTl(); veKhung(); };
$('#btnChuyenAll').onclick = () => { const v = $('#chuyenMacDinh').value; luuHoanTac(); P.clips.forEach((c, i) => { if (i < P.clips.length - 1) c.chuyen = v; }); if (v !== 'cat') gltNap(); veTl(); veKhung(); toast('Áp "' + CHUYEN_TEN[v] + '" cho ' + Math.max(0, P.clips.length - 1) + ' điểm cắt'); };
function apLocChung(k) { const tatCa = $('#locTatCa').checked || !(P.chon && P.chon.k === 'v'), ds = tatCa ? P.clips : [P.clips[P.chon.i]], muc = +$('#locMucChung').value; if (!ds.length) { toast('Chưa có đoạn nào'); return; } luuHoanTac(); ds.forEach(c => { c.loc = k; c.locMuc = muc; }); veTl(); veKhung(); veProp(); $$('#locLuoi button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k))); toast('Bộ lọc ' + LOC[k][0] + (tatCa ? ' cho mọi đoạn' : ' cho đoạn đang chọn')); }
Object.keys(LOC).forEach(k => { const b = el('button'); b.type = 'button'; b.dataset.k = k; b.textContent = LOC[k][0]; b.style.filter = LOC[k][1] || ''; b.onclick = () => apLocChung(k); $('#locLuoi').appendChild(b); });
$('#locMucChung').addEventListener('input', () => { const tatCa = $('#locTatCa').checked || !(P.chon && P.chon.k === 'v'); (tatCa ? P.clips : [P.clips[P.chon.i]]).forEach(c => { c.locMuc = +$('#locMucChung').value; }); if (!P.dang) veKhung(); });
Object.keys(HIEU_UNG).forEach(k => { const b = el('button'); b.type = 'button'; b.dataset.k = k; b.textContent = HIEU_UNG[k]; b.onclick = () => { const ds = P.chon && P.chon.k === 'v' ? [P.clips[P.chon.i]] : P.clips; if (!ds.length) { toast('Chưa có đoạn nào'); return; } luuHoanTac(); ds.forEach(c => { c.hu2 = k; }); veKhung(); veProp(); toast(HIEU_UNG[k] + (ds.length > 1 ? ' cho mọi đoạn' : ' cho đoạn đang chọn')); }; $('#huLuoi').appendChild(b); });
$('#nenKhung').addEventListener('change', () => { const k = $('#nenKhung').value; $('#nenKhungMauHang').hidden = k !== 'mau'; $('#nenKhungAnhHang').hidden = k !== 'anh'; if (!P.dang) veKhung(); });
$('#nenKhungMau').addEventListener('input', () => { if (!P.dang) veKhung(); });
$('#nenKhungAnh').onchange = e => { const f0 = e.target.files[0]; if (!f0) return; const im = new Image(); im.onload = () => { nenAnh = im; if (!P.dang) veKhung(); }; im.src = URL.createObjectURL(f0); };
}

/* ═════════ ÂM THANH KIỂU CAPCUT: A3 (SFX, ghi âm, tách tiếng) · âm lượng dB · chuẩn hoá · xem trước cắt lặng ═════════
   Mục A3: { id, kho, ten, loai: sfx|tach|thu|file, t_bd (giây trên dòng thời gian), bd/kt (khúc lấy trong âm gốc), giay, am (hệ số), fi, fo }
   kho: 'sfx:<loại>' tổng hợp lại được, 'src:<id footage>' giải mã lại từ footage, 'f:<id>' file/ghi âm lưu base64 trong dự án */
const AM3_KHO = {};
let am3Nguon = [], am3Ghi = null;
const LOAI_AM3 = { sfx: '🔊 Hiệu ứng', tach: '⤓ Tách từ video', thu: '🎙 Ghi âm', file: '📂 File' };
const SFX = { whoosh: ['💨 Whoosh', 0.6], pop: ['🫧 Pop', 0.18], ding: ['🔔 Ding', 1.1], click: ['🖱 Click', 0.06], boom: ['💥 Boom', 1.2], riser: ['📈 Riser', 1.6], tick: ['⏱ Tíc tắc', 1.0], chup: ['📸 Chụp ảnh', 0.35] };
function tinhNL(ab) { const d = ab.getChannelData(0), buoc = Math.max(1, Math.floor(ab.sampleRate / 50)), n = Math.floor(d.length / buoc), out = new Float32Array(n); for (let i = 0; i < n; i++) { let s = 0, m = 0; for (let j = i * buoc, e = j + buoc; j < e; j += 2) { s += d[j] * d[j]; m++; } out[i] = s / Math.max(1, m); } return out; }
const dbTu = v => 20 * Math.log10(Math.max(1e-5, v));
const dbChu = v => v <= -30 ? 'tắt' : (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + ' dB';
async function taoSfx(k) {
  const sr = 44100, dai = SFX[k][1], o = new OfflineAudioContext(1, Math.ceil(sr * dai), sr), g = o.createGain(); g.connect(o.destination);
  const nhieu = () => { const b = o.createBuffer(1, Math.ceil(sr * dai), sr), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = o.createBufferSource(); s.buffer = b; return s; };
  const loc = (kieu, f, q) => { const x = o.createBiquadFilter(); x.type = kieu; x.frequency.value = f; if (q) x.Q.value = q; return x; };
  const env = (len, dinh) => { g.gain.setValueAtTime(0.0001, 0); g.gain.linearRampToValueAtTime(dinh, len); g.gain.exponentialRampToValueAtTime(0.0001, dai); };
  if (k === 'whoosh') { const n = nhieu(), f = loc('bandpass', 300, 1.2); f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(4000, dai * 0.6); f.frequency.exponentialRampToValueAtTime(800, dai); n.connect(f); f.connect(g); env(dai * 0.45, 0.9); n.start(0); }
  else if (k === 'pop') { const s = o.createOscillator(); s.frequency.setValueAtTime(900, 0); s.frequency.exponentialRampToValueAtTime(180, dai); s.connect(g); env(0.005, 0.8); s.start(0); }
  else if (k === 'ding') { [1320, 2640, 3960].forEach((f, i) => { const s = o.createOscillator(), gg = o.createGain(); s.frequency.value = f; gg.gain.value = [0.6, 0.25, 0.1][i]; s.connect(gg); gg.connect(g); s.start(0); }); env(0.005, 0.7); }
  else if (k === 'click') { const n = nhieu(), f = loc('highpass', 2000); n.connect(f); f.connect(g); env(0.002, 0.9); n.start(0); }
  else if (k === 'boom') { const s = o.createOscillator(); s.frequency.setValueAtTime(110, 0); s.frequency.exponentialRampToValueAtTime(35, dai); s.connect(g); const n = nhieu(), f = loc('lowpass', 400), gn = o.createGain(); gn.gain.value = 0.5; n.connect(f); f.connect(gn); gn.connect(g); env(0.01, 1); s.start(0); n.start(0); }
  else if (k === 'riser') { const n = nhieu(), f = loc('bandpass', 200, 3); f.frequency.setValueAtTime(200, 0); f.frequency.exponentialRampToValueAtTime(6000, dai); const s = o.createOscillator(), gs = o.createGain(); s.type = 'sawtooth'; s.frequency.setValueAtTime(110, 0); s.frequency.exponentialRampToValueAtTime(880, dai); gs.gain.value = 0.15; s.connect(gs); gs.connect(g); n.connect(f); f.connect(g); g.gain.setValueAtTime(0.0001, 0); g.gain.exponentialRampToValueAtTime(0.8, dai * 0.95); g.gain.linearRampToValueAtTime(0, dai); n.start(0); s.start(0); }
  else if (k === 'tick') { for (let i = 0; i < 4; i++) { const s = o.createOscillator(), gg = o.createGain(); s.type = 'square'; s.frequency.value = i % 2 ? 1800 : 2400; gg.gain.setValueAtTime(0, 0); gg.gain.setValueAtTime(0.4, i * 0.25); gg.gain.exponentialRampToValueAtTime(0.001, i * 0.25 + 0.03); s.connect(gg); gg.connect(o.destination); s.start(0); } }
  else { const n = nhieu(), f = loc('bandpass', 3000); n.connect(f); f.connect(g); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.9, 0.005); g.gain.exponentialRampToValueAtTime(0.01, 0.06); g.gain.setValueAtTime(0.7, 0.16); g.gain.exponentialRampToValueAtTime(0.001, 0.3); n.start(0); }
  return await o.startRendering();
}
function blobB64(blob) { return new Promise((ok, loi) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = loi; r.readAsDataURL(blob); }); }
function datKho(kho, buf, them) { AM3_KHO[kho] = { ...(AM3_KHO[kho] || {}), ...(them || {}), buf, song: tinhSong(buf), nl: tinhNL(buf) }; return AM3_KHO[kho]; }
async function am3NapKho(kho) {
  const k = AM3_KHO[kho]; if (k && k.buf) return k; if (k && k.dang) return k.dang;
  const lam = (async () => {
    if (kho.startsWith('sfx:')) return datKho(kho, await taoSfx(kho.slice(4)));
    if (kho.startsWith('src:')) { const s = srcCua(kho.slice(4)); if (!s || !s.file) throw new Error('thiếu footage'); return datKho(kho, await giaiMaAm(s.file)); }
    if (k && k.b64) { const blob = new Blob([Uint8Array.from(atob(k.b64), c => c.charCodeAt(0))], { type: k.mime || 'audio/wav' }); return datKho(kho, await giaiMaAm(blob)); }
    throw new Error('không có dữ liệu âm thanh');
  })();
  AM3_KHO[kho] = { ...(k || {}), dang: lam }; try { return await lam; } finally { if (AM3_KHO[kho]) delete AM3_KHO[kho].dang; }
}
async function am3NapBlob(kho, blob) { const buf = await giaiMaAm(blob); return datKho(kho, buf, { b64: await blobB64(blob), mime: blob.type || 'audio/wav' }); }
async function am3NapThieu() { for (const a of P.am3 || []) { try { await am3NapKho(a.kho); } catch { } } }
function am3KhoLuu() { const o = {}; (P.am3 || []).forEach(a => { const k = AM3_KHO[a.kho]; if (a.kho.startsWith('f:') && k && k.b64) o[a.kho] = { b64: k.b64, mime: k.mime }; }); return o; }
function am3KhoNap(o) { Object.entries(o || {}).forEach(([kho, v]) => { if (!AM3_KHO[kho] || !AM3_KHO[kho].buf) AM3_KHO[kho] = { b64: v.b64, mime: v.mime }; }); }
function am3MoiItem(kho, ten, loai, dai) { return { id: uid(), kho, ten, loai, t_bd: +P.t.toFixed(2), bd: 0, kt: +dai.toFixed(3), giay: +dai.toFixed(3), am: 1, fi: 0, fo: 0 }; }
/* phát A3 bằng Web Audio, hẹn giờ theo đầu phát; nối cả vào luồng xuất */
function am3Lich(a, t0, now, raXuat) {
  if (a.an) return null;
  const k = AM3_KHO[a.kho]; if (!k || !k.buf) return null; const toc = a.toc || 1, dai = (a.kt - a.bd) / toc, cuoi = a.t_bd + dai; if (cuoi <= t0 + 0.01 || dai <= 0) return null;
  const tre = Math.max(0, a.t_bd - t0), vao = Math.max(0, t0 - a.t_bd), con = dai - vao, st = now + tre, vol = a.am == null ? 1 : a.am;
  const C = (raXuat && raXuat.ctx) || ac, src = C.createBufferSource(); src.buffer = k.buf; const g = C.createGain(); src.connect(g); if (raXuat && raXuat.ctx) g.connect(C.destination); else { g.connect(ac.destination); if (raXuat && dest) g.connect(dest); }
  const fi = Math.min(a.fi || 0, dai / 2), fo = Math.min(a.fo || 0, dai / 2);
  if (fi && vao < fi) { g.gain.setValueAtTime(vol * vao / fi, st); g.gain.linearRampToValueAtTime(vol, st + (fi - vao)); } else g.gain.setValueAtTime(vol, st);
  if (fo) { const bdFo = Math.max(vao, dai - fo); g.gain.setValueAtTime(vol * Math.min(1, (dai - bdFo) / fo), st + (bdFo - vao)); g.gain.linearRampToValueAtTime(0, st + con); }
  if (toc !== 1) src.playbackRate.value = toc; src.start(st, Math.min(k.buf.duration - 0.001, a.bd + vao * toc), con * toc); return src;
}
function am3BatDau() { am3Dung(); if (!ac) return; const t0 = P.t, now = ac.currentTime + 0.02; (P.am3 || []).forEach(a => { if (trTat(keyAm(a.lop))) return; const s = am3Lich(a, t0, now, true); if (s) am3Nguon.push(s); }); }
function am3Dung() { am3Nguon.forEach(s => { try { s.stop(); } catch { } }); am3Nguon = []; }
async function am3Nghe(a) { moAm(); try { await ac.resume(); } catch { } try { await am3NapKho(a.kho); } catch { toast('Chưa nạp được âm thanh này'); return; } const s = am3Lich({ ...a, t_bd: 0 }, 0, ac.currentTime + 0.02, false); if (s) am3Nguon.push(s); }
/* âm lượng trung bình (bỏ khoảng im) theo năng lượng 50 khung/giây → dB */
function doDb(nl, bd, kt) { if (!nl) return null; const i0 = Math.max(0, Math.floor(bd * 50)), i1 = Math.min(nl.length, Math.ceil(kt * 50)); let t = 0, n = 0; for (let i = i0; i < i1; i++) if (nl[i] > 1e-5) { t += nl[i]; n++; } return n ? 10 * Math.log10(t / n) : null; }
const DB_CHUAN = -19;
async function canNL(s) { if (!s || s.loai !== 'video') return null; if (s.nl) return s.nl; while (s.dangSong) await new Promise(r => setTimeout(r, 100)); if (!s.nl) { const cu = s.song; s.song = null; await laySong(s); if (!s.song) s.song = cu; } return s.nl || null; }
function chuanHoaAm3(a) { const k = AM3_KHO[a.kho], L = k && doDb(k.nl, a.bd, a.kt); if (L == null) return false; a.am = Math.max(0.1, Math.min(4, Math.pow(10, (DB_CHUAN - L) / 20))); return true; }
async function chuanHoaTatCa() {
  const tt = $('#am3Tt'); tt.textContent = 'Đang đo âm lượng…'; let so = 0;
  for (const s of new Set(P.clips.map(c => srcCua(c.src)))) await canNL(s);
  await am3NapThieu(); luuHoanTac();
  P.clips.forEach(c => { const s = srcCua(c.src), L = s && doDb(s.nl, c.bd, c.kt); if (L == null || !(c.am == null || c.am > 0)) return; const cu = c.am == null ? 1 : c.am, moi = Math.max(0.25, Math.min(2, Math.pow(10, (DB_CHUAN - L) / 20))); c.am = +moi.toFixed(3); if (c.kfs && c.kfs.am) c.kfs.am.forEach(k => { k.v = Math.max(0, Math.min(2, k.v * moi / (cu || 1))); }); so++; });
  (P.am3 || []).forEach(a => { if (a.loai !== 'sfx' && chuanHoaAm3(a)) so++; });
  tt.textContent = so ? 'Đã chuẩn hoá ' + so + ' đoạn về khoảng ' + DB_CHUAN + ' dB (to đều nhau). Ctrl+Z để hoàn tác.' : 'Chưa đo được âm thanh (cần footage có tiếng).'; veTl(); veProp(); veKhung();
}
/* ── cắt khoảng lặng có xem trước: vùng đỏ = sẽ cắt; vạch vàng = từ đệm cần nghe lại (thì, là, kiểu, à) ── */
const FILLER_NGO = /^(thì|là|kiểu|à+|ơ+)[,.!?…]*$/i;
function vungTieng(nl, bd, kt) {
  const i0 = Math.max(0, Math.floor(bd * 50)), i1 = Math.min(nl.length, Math.ceil(kt * 50)); if (i1 - i0 < 5) return [];
  const db = []; for (let i = i0; i < i1; i++) db.push(10 * Math.log10(nl[i] + 1e-10)); const so = [...db].sort((a, b) => a - b), p10 = so[Math.floor(so.length * 0.1)], dinh = so[Math.floor(so.length * 0.98)];
  const thr = Math.min(-20, Math.max(-50, Math.max(p10 + 10, dinh - 30))); if (dinh < thr + 3) return [];
  const ra = []; let a = -1; for (let i = 0; i <= db.length; i++) { const to = i < db.length && db[i] > thr; if (to && a < 0) a = i; if (!to && a >= 0) { ra.push({ w: '', bd: (i0 + a) / 50, kt: (i0 + i) / 50 }); a = -1; } }
  const g = []; ra.forEach(x => { const l = g[g.length - 1]; if (l && x.bd - l.kt < 0.15) l.kt = x.kt; else g.push({ ...x }); }); return g.filter(x => x.kt - x.bd >= 0.06);
}
function tinhCatLang(nguong, boDem) {
  nguong = nguong || 0.5; const moi = [], cat = [], ngo = []; let acc = 0, bot = 0, soDem = 0, theoAm = 0;
  P.clips.forEach(c => {
    const s = srcCua(c.src), dai = daiC(c), k = tocC(c);
    let tu = s && s.tu ? s.tu.filter(w => w.kt > c.bd + 0.02 && w.bd < c.kt - 0.02) : [];
    if (!tu.length && s && s.nl) { tu = vungTieng(s.nl, c.bd, c.kt); if (tu.length) theoAm++; }
    if (!tu.length) { moi.push(c); acc += dai; return; }
    tu.forEach((w, j) => { if (!w.w || !FILLER_NGO.test(String(w.w).trim())) return; const tr = j ? w.bd - tu[j - 1].kt : 1, sau = j < tu.length - 1 ? tu[j + 1].bd - w.kt : 1; if (tr > 0.25 || sau > 0.25 || (j && String(tu[j - 1].w).toLowerCase() === String(w.w).toLowerCase())) ngo.push({ t: acc + (w.bd - c.bd) / k, w: String(w.w) }); });
    const giu = tu.filter(w => { const la = boDem && w.w && FILLER.test(String(w.w).trim()); if (la) soDem++; return !la; });
    if (!giu.length) { cat.push([acc, dai]); acc += dai; bot += dai; return; }
    const doan = []; let a = Math.max(c.bd, giu[0].bd - 0.1), b = Math.min(c.kt, giu[0].kt + 0.12);
    for (let i = 1; i < giu.length; i++) { const w = giu[i]; if (w.bd - giu[i - 1].kt > nguong) { doan.push([a, b]); a = Math.max(c.bd, w.bd - 0.1); } b = Math.min(c.kt, w.kt + 0.12); }
    doan.push([a, b]);
    let truoc = c.bd; doan.forEach(([x, y]) => { if (x - truoc > 0.04) { cat.push([acc + (truoc - c.bd) / k, (x - truoc) / k]); bot += (x - truoc) / k; } moi.push({ ...c, bd: +x.toFixed(2), kt: +y.toFixed(2) }); truoc = y; });
    if (c.kt - truoc > 0.04) { cat.push([acc + (truoc - c.bd) / k, (c.kt - truoc) / k]); bot += (c.kt - truoc) / k; }
    acc += dai;
  });
  return { moi, cat, bot, soDem, ngo, theoAm };
}
function apCatLang(r) { if (r.bot < 0.05) return; luuHoanTac(); r.cat.slice().sort((a, b) => b[0] - a[0]).forEach(([diem, len]) => ripple(diem + len, -len)); P.clips = r.moi.filter(c => c.kt - c.bd > 0.12); veTl(); veLoi(); veKhung(); }
function catLang(nguong, boDem) { const r = tinhCatLang(nguong, boDem); if (r.bot < 0.05) return { bot: 0, soDem: r.soDem }; apCatLang(r); return { bot: r.bot, soDem: r.soDem, so: r.cat.length }; }
function boXemCat() { P.xemCat = null; const h = $('#langXem'); if (h) { h.hidden = true; h.innerHTML = ''; } }
function veLangXem() {
  const h = $('#langXem'), r = P.xemCat; h.innerHTML = ''; if (!r) { h.hidden = true; return; } h.hidden = false;
  const ng = $('#langNguong').value.replace('.', ',');
  if (r.bot < 0.05 && !r.ngo.length) { h.appendChild(el('div', null, 'Không còn khoảng lặng dài hơn ' + ng + 's.')); const b = el('button', 'btn nho ghost', 'Đóng'); b.type = 'button'; b.onclick = () => { boXemCat(); veTl(); }; h.appendChild(b); return; }
  h.appendChild(el('div', null, r.bot >= 0.05 ? 'Xem trước: cắt ' + r.cat.length + ' chỗ (vùng đỏ trên V1), bớt ' + fmt1(r.bot) + 's' + (r.soDem ? ', bỏ ' + r.soDem + ' tiếng ừ/ờ' : '') + (r.theoAm ? ' · ' + r.theoAm + ' đoạn đo theo âm lượng vì chưa có lời' : '') : 'Không có khoảng lặng cần cắt.'));
  if (r.ngo.length) { const dem = {}; r.ngo.forEach(n => { const w = n.w.toLowerCase().replace(/[,.!?…]/g, ''); dem[w] = (dem[w] || 0) + 1; }); h.appendChild(el('div', 'quota', '🟨 ' + r.ngo.length + ' từ đệm cần nghe lại, máy không tự cắt: ' + Object.entries(dem).map(([w, n]) => '“' + w + '” ×' + n).join(', '))); const ch = el('div', 'chips'); r.ngo.slice(0, 12).forEach(n => { const b = el('button', null, fmt1(n.t) + 's · ' + n.w); b.type = 'button'; b.onclick = () => { P.t = Math.max(0, n.t - 0.4); veTl(); veKhung(); }; ch.appendChild(b); }); h.appendChild(ch); }
  const row = el('div', 'row');
  if (r.bot >= 0.05) { const ok = el('button', 'btn xanh nho', '✓ Áp dụng cắt'); ok.type = 'button'; ok.id = 'btnLangOk'; ok.onclick = () => { const moi = tinhCatLang(+$('#langNguong').value, $('#langDem').checked); boXemCat(); apCatLang(moi); toast('Đã cắt ' + fmt1(moi.bot) + 's khoảng lặng' + (moi.soDem ? ', bỏ ' + moi.soDem + ' tiếng ừ/ờ' : '') + ' · Ctrl+Z để hoàn tác'); }; row.appendChild(ok); }
  const huy = el('button', 'btn nho ghost', 'Huỷ'); huy.type = 'button'; huy.id = 'btnLangHuy'; huy.onclick = () => { boXemCat(); veTl(); }; row.appendChild(huy); h.appendChild(row);
}
async function xemTruocCatLang() {
  if (!P.clips.length) { toast('Chưa có đoạn nào trên V1'); return; }
  const can = [...new Set(P.clips.map(c => srcCua(c.src)))].filter(s => s && !(s.tu && s.tu.length) && s.loai === 'video' && !s.nl);
  if (can.length) { $('#langXem').hidden = false; $('#langXem').textContent = 'Đang đo âm lượng để tìm khoảng lặng…'; for (const s of can) await canNL(s); }
  P.xemCat = tinhCatLang(+$('#langNguong').value, $('#langDem').checked); veTl(); veLangXem();
}
function veAm3Tl(tr, px) {
  (P.am3 || []).forEach((a, i) => { const k = AM3_KHO[a.kho] || {}, dai = a.kt - a.bd, d = el('div', 'item a3 ' + a.loai + (P.chon && P.chon.k === 'a' && P.chon.i === i ? ' chon' : '')); d.style.left = a.t_bd * px + 'px'; d.style.width = Math.max(6, dai * px - 2) + 'px'; d.dataset.i = i;
    veSongItem(d, k, a.bd, a.kt, dai * px); d.appendChild(el('b', null, (LOAI_AM3[a.loai] || '🔊').split(' ')[0] + ' ' + a.ten)); d.appendChild(el('small', null, fmt1(dai) + 's · ' + dbChu(Math.max(-30, dbTu(a.am == null ? 1 : a.am)))));
    if (a.fi) { const f = el('i', 'anv'); f.style.width = a.fi * px + 'px'; d.appendChild(f); } if (a.fo) { const f = el('i', 'anr'); f.style.width = a.fo * px + 'px'; d.appendChild(f); }
    d.appendChild(el('span', 'h l')); d.appendChild(el('span', 'h r')); keoItem(d, 'a', i, a.t_bd, dai); (hangAmCua(a.lop) || tr.a3).appendChild(d); });
  if (P.xemCat) { P.xemCat.cat.forEach(([t, len]) => { const d = el('div', 'item vungCat'); d.style.left = t * px + 'px'; d.style.width = Math.max(2, len * px) + 'px'; tr.v1.appendChild(d); }); P.xemCat.ngo.forEach(n => { const d = el('div', 'item ngo'); d.style.left = (n.t * px - 1) + 'px'; d.title = 'Từ đệm? “' + n.w + '”'; tr.v1.appendChild(d); }); }
}
function veThuocTinhAm3(box, a) {
  if (!a) return; box.appendChild(el('h3', null, 'Âm thanh A3 đang chọn'));
  box.appendChild(el('div', 'quota', (LOAI_AM3[a.loai] || '') + ' · ' + a.ten + ' · ' + fmt1(a.kt - a.bd) + 's tại ' + fmt1(a.t_bd) + 's'));
  oTruot(box, 'Âm lượng', -30, 12, 0.5, Math.max(-30, dbTu(a.am == null ? 1 : a.am)).toFixed(1), dbChu, v => { a.am = v <= -30 ? 0 : +Math.pow(10, v / 20).toFixed(4); });
  oTruot(box, 'Vào dần', 0, 3, 0.1, a.fi || 0, v => fmt1(v) + 's', v => { a.fi = v; });
  oTruot(box, 'Tắt dần', 0, 3, 0.1, a.fo || 0, v => fmt1(v) + 's', v => { a.fo = v; });
  const row = el('div', 'row'); [['▶ Nghe', () => am3Nghe(a)], ['📏 Chuẩn hoá', async () => { try { await am3NapKho(a.kho); } catch { } luuHoanTac(); if (!chuanHoaAm3(a)) toast('Chưa đo được âm lượng'); veTl(); }], ['🗑 Xoá', () => lenh('xoa')]].forEach(([tx, f]) => { const b = el('button', 'btn nho', tx); b.type = 'button'; b.onclick = f; row.appendChild(b); }); box.appendChild(row);
}
async function themAm3(kho, ten, loai) { try { const k = await am3NapKho(kho); luuHoanTac(); const a = am3MoiItem(kho, ten, loai, k.buf.duration); P.am3.push(a); P.chon = { k: 'a', i: P.am3.length - 1 }; veTl(); veProp(); return a; } catch (e) { toast('Không nạp được âm thanh: ' + (e.message || e)); return null; } }
async function tachAmClip(i) {
  const c = P.clips[i]; if (!c) { toast('Chọn một đoạn video trên V1 trước'); return null; } const s = srcCua(c.src); if (!s || s.loai !== 'video') { toast('Đoạn này không có âm thanh'); return null; }
  $('#am3Tt').textContent = 'Đang tách âm thanh…'; const kho = 'src:' + s.id; try { await am3NapKho(kho); } catch { $('#am3Tt').textContent = 'Không đọc được âm thanh của footage này'; return null; }
  luuHoanTac(); const a = { id: uid(), kho, ten: 'Tiếng S' + (P.srcs.indexOf(s) + 1), loai: 'tach', t_bd: +batDauC(c).toFixed(3), bd: c.bd, kt: c.kt, giay: +AM3_KHO[kho].buf.duration.toFixed(3), am: c.am == null ? 1 : c.am, fi: 0, fo: 0 };
  P.am3.push(a); c.am = 0; if (c.kfs) delete c.kfs.am; P.chon = { k: 'a', i: P.am3.length - 1 }; veTl(); veProp();
  $('#am3Tt').textContent = 'Đã tách âm thanh xuống A3 và tắt tiếng đoạn gốc' + (tocC(c) !== 1 ? ' (âm tách giữ tốc độ gốc)' : '') + '. Kéo lệch để làm J-cut / L-cut.'; return a;
}
function khoiTaoC() {
  $('#am3Hop').innerHTML = '<h3 class="pt">Hiệu ứng âm thanh</h3><div class="mauLuoi" id="sfxLuoi"></div><h3 class="pt">Ghi âm & tách tiếng</h3><div class="row"><label class="btn nho" style="cursor:pointer">📂 Thêm file âm thanh<input type="file" id="am3In" accept="audio/*" multiple hidden></label><button class="btn nho" id="btnThuAm" type="button">🎙 Ghi âm</button></div><div class="row"><button class="btn nho" id="btnTachAm" type="button" title="Chọn một đoạn trên V1 trước">⤓ Tách âm thanh đoạn đang chọn</button><button class="btn nho" id="btnChuanAm" type="button" title="Đưa các đoạn về cùng độ to (khoảng -19 dB, gần chuẩn -14 LUFS khi đăng)">📏 Chuẩn hoá âm lượng</button></div><div class="quota" id="am3Tt">Hiệu ứng âm thanh đặt tại đầu phát. Ghi âm: dòng thời gian phát để bạn nói theo hình.</div>';
  Object.entries(SFX).forEach(([k, [ten]]) => { const b = el('button'); b.type = 'button'; b.dataset.k = k; b.textContent = ten; b.onclick = () => themAm3('sfx:' + k, ten.replace(/^\S+\s/, ''), 'sfx'); $('#sfxLuoi').appendChild(b); });
  $('#am3In').onchange = async e => { for (const f of [...e.target.files]) { const kho = 'f:' + uid(); try { await am3NapBlob(kho, f); await themAm3(kho, f.name.replace(/\.[^.]+$/, ''), 'file'); } catch { toast('Không đọc được ' + f.name); } } e.target.value = ''; };
  $('#btnTachAm').onclick = () => tachAmClip(P.chon && P.chon.k === 'v' ? P.chon.i : -1);
  $('#btnChuanAm').onclick = chuanHoaTatCa;
  $('#btnThuAm').onclick = async () => {
    if (am3Ghi) { am3Ghi.rec.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Trình duyệt này chưa ghi âm được'); return; }
    let st; try { st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { toast('Không mở được micro. Cho phép micro trên trình duyệt rồi thử lại.'); return; }
    const khuc = [], rec = new MediaRecorder(st); am3Ghi = { rec, t0: P.t };
    rec.ondataavailable = e => { if (e.data && e.data.size) khuc.push(e.data); };
    rec.onstop = async () => { st.getTracks().forEach(t => t.stop()); const ghi = am3Ghi; am3Ghi = null; if (P.dang) dung(); const b = $('#btnThuAm'); b.textContent = '🎙 Ghi âm'; b.classList.remove('dangGhi');
      const blob = new Blob(khuc, { type: rec.mimeType || 'audio/webm' }); if (!blob.size) { toast('Chưa ghi được gì'); return; }
      try { const kho = 'f:' + uid(); await am3NapBlob(kho, blob); const tg = P.t; P.t = ghi.t0; const a = await themAm3(kho, 'Ghi âm ' + new Date().toTimeString().slice(0, 5), 'thu'); P.t = tg; if (a) toast('Đã thêm bản ghi ' + fmt1(a.kt) + 's lên A3'); } catch { toast('Bản ghi lỗi, thử lại'); } };
    rec.start(250); const b = $('#btnThuAm'); b.textContent = '⏹ Dừng ghi'; b.classList.add('dangGhi'); if (P.clips.length && !P.dang) phat(false);
  };
  $('#btnLang').onclick = xemTruocCatLang;
}

/* ═════════ XUẤT CHÍNH XÁC TỪNG KHUNG: WebCodecs + mediabunny ═════════
   Vẽ đúng bằng veFrame của xem trước ở từng mốc n/fps (tua đúng khung, không phụ thuộc máy nhanh/chậm),
   âm thanh trộn sẵn trong OfflineAudioContext. Máy không có WebCodecs thì quay về ghi thời gian thực (MediaRecorder). */
const MB_URL = 'https://cdn.jsdelivr.net/npm/mediabunny@1.61.0/+esm';
let MB = null;
async function napMB() { if (!MB) MB = await import(MB_URL); return MB; }
function coWebCodecs() { return typeof VideoEncoder === 'function' && typeof AudioEncoder === 'function'; }
const DD_XUAT = { mp4_avc: ['mp4', 'avc'], mp4_av1: ['mp4', 'av1'], mp4_hevc: ['mp4', 'hevc'], mov_avc: ['mov', 'avc'], webm_vp9: ['webm', 'vp9'] };
const TEN_CODEC = { avc: 'H.264', hevc: 'H.265', vp9: 'VP9', vp8: 'VP8', av1: 'AV1', aac: 'AAC', opus: 'Opus', mp3: 'MP3' };
function wavTuBuf(ab) {
  const nc = ab.numberOfChannels, sr = ab.sampleRate, n = ab.length, buf = new ArrayBuffer(44 + n * nc * 2), v = new DataView(buf), ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * nc * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true); v.setUint32(24, sr, true); v.setUint32(28, sr * nc * 2, true); v.setUint16(32, nc * 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * nc * 2, true);
  const ch = [...Array(nc)].map((_, i) => ab.getChannelData(i)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { const x = Math.max(-1, Math.min(1, ch[c][i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; }
  return new Blob([buf], { type: 'audio/wav' });
}
/* co giãn thời gian giữ nguyên cao độ (WSOLA) cho đoạn tua nhanh/chậm khi trộn âm xuất file */
function keoGian(ch, k, ref) {
  const N = 1024, Hs = 512, Ha = Hs * k, tol = 256, outLen = Math.floor(ch.length / k), out = new Float32Array(outLen + N), norm = new Float32Array(outLen + N), w = new Float32Array(N), viTriDung = ref ? null : [];
  for (let j = 0; j < N; j++) w[j] = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / N);
  let truoc = 0;
  for (let m = 0, so = 0; so < outLen; m++, so += Hs) {
    let pa = ref ? ref[m] : Math.round(m * Ha);
    if (pa == null || pa + N > ch.length) break;
    if (!ref && m > 0) { const tn = truoc + Hs; let tot = 0, bv = -Infinity; for (let d = -tol; d <= tol; d += 8) { const c = pa + d; if (c < 0 || c + N > ch.length || tn + N > ch.length) continue; let sum = 0; for (let j = 0; j < N; j += 4) sum += ch[tn + j] * ch[c + j]; if (sum > bv) { bv = sum; tot = d; } } pa += tot; }
    if (viTriDung) viTriDung.push(pa);
    for (let j = 0; j < N; j++) { out[so + j] += ch[pa + j] * w[j]; norm[so + j] += w[j]; }
    truoc = pa;
  }
  for (let i = 0; i < outLen; i++) out[i] = norm[i] > 1e-3 ? out[i] / norm[i] : 0;
  return { du_lieu: out.subarray(0, outLen), vi_tri: viTriDung };
}
function gianDoan(oc, buf, bd, kt, k) { const sr = buf.sampleRate, a = Math.max(0, Math.floor(bd * sr)), b = Math.min(buf.length, Math.floor(kt * sr)), nc = buf.numberOfChannels; const c0 = keoGian(buf.getChannelData(0).subarray(a, b), k), ra = oc.createBuffer(nc, Math.max(1, c0.du_lieu.length), sr); ra.copyToChannel(c0.du_lieu, 0); for (let c = 1; c < nc; c++) ra.copyToChannel(keoGian(buf.getChannelData(c).subarray(a, b), k, c0.vi_tri).du_lieu, c); return ra; }
async function bufTuUrl(url) { return await giaiMaAm(new Blob([await (await fetch(url)).arrayBuffer()])); }
/* trộn toàn bộ âm thanh dòng thời gian (V1 + A1 nhạc có duck + A2 lồng tiếng + A3) giống hệt lúc phát */
async function tronAmThanh(tong, sr) {
  sr = sr || 48000; const oc = new OfflineAudioContext(2, Math.max(1, Math.ceil(tong * sr)), sr), ra = oc.destination;
  const mucNoi = (+$('#duckNoi').value || 12) / 100, mucBroll = (+$('#duckBroll').value || 60) / 100;
  const coLongTai = x => P.tieng.some(t => x >= t.t_bd && x < t.t_bd + t.giay);
  for (const t of P.tieng) { if (t.t_bd >= tong || trTat('a2')) continue; try { const buf = t.b64 ? await giaiMaAm(new Blob([Uint8Array.from(atob(t.b64), c => c.charCodeAt(0))])) : await bufTuUrl(t.url); const s = oc.createBufferSource(); s.buffer = buf; s.connect(ra); s.start(t.t_bd, 0, Math.min(buf.duration, tong - t.t_bd)); } catch { } }
  let acc = 0;
  for (const c of P.clips) {
    const dai = daiC(c), s = srcCua(c.src), bd0 = acc; acc += dai; if (!s || s.loai !== 'video' || trTat('v1') || c.an) continue;
    let buf; try { buf = (await am3NapKho('src:' + s.id)).buf; } catch { continue; } if (c.bd >= buf.duration) continue; if (c.khuOn) buf = khuOnBuf(buf, c.khuOn, s.id);
    const k = tocC(c), src = oc.createBufferSource(), g = oc.createGain(), doiCao = !!c.doiCao && !c.cong && !c.dao && k !== 1; src.buffer = c.dao ? daoBuf(oc, buf, c, k) : c.cong ? gianCong(oc, buf, c) : (k === 1 || doiCao) ? buf : gianDoan(oc, buf, c.bd, Math.min(c.kt, buf.duration), k); if (doiCao) src.playbackRate.value = k; src.connect(g); { const ch = taoChuoiGiong(oc, c.giong || 'khong'), pn = oc.createStereoPanner(); pn.pan.value = c.pan || 0; g.connect(ch.vao); ch.ra.connect(pn); pn.connect(ra); }   // tua nhanh/chậm: giữ cao độ giọng như lúc xem trước
    let cu = -1; for (let o = 0; o <= dai + 1e-6; o += 0.02) { const v = Math.max(0, giaTriKf(c, 'am', o) * fadeHeSo(c, o) * (coLongTai(bd0 + o) ? 0.25 : 1)); if (cu < 0) g.gain.setValueAtTime(v, bd0); else if (Math.abs(v - cu) > 0.001) g.gain.linearRampToValueAtTime(v, bd0 + o); cu = v; }
    if ((k === 1 && !c.cong && !c.dao) || doiCao) src.start(bd0, c.bd, Math.max(0.01, Math.min(c.kt, buf.duration) - c.bd)); else src.start(bd0, 0, Math.min(dai, src.buffer.duration));
  }
  if (P.nhac && !trTat('a1')) { try { const buf = await bufTuUrl(P.nhac.url), s = oc.createBufferSource(), g = oc.createGain(); s.buffer = buf; s.loop = true; s.connect(g); g.connect(ra);
    let cu = -1; for (let x = 0; x <= tong; x += 0.05) { const { clip, tSrc } = viTri(x), c = P.clips[clip], sc = c && srcCua(c.src), coTieng = coLongTai(x) || (sc && sc.cau.some(q => tSrc >= q.bd && tSrc <= q.kt)); let m = coTieng ? mucNoi : mucBroll; if (tong - x < 1.5) m *= Math.max(0, (tong - x) / 1.5); if (cu < 0) g.gain.setValueAtTime(m, 0); else if (Math.abs(m - cu) > 0.001) g.gain.setTargetAtTime(m, x, tong - x < 1.5 ? 0.02 : 0.2); cu = m; }
    s.start(0); s.stop(tong); } catch { } }
  await am3NapThieu(); amTatCa().forEach(a => { if (!trTat(keyAm(a.lop))) am3Lich(a, 0, 0, { ctx: oc }); });
  return await oc.startRendering();
}
/* vẽ một khung tại t cho bản xuất: tua footage chính, b-roll và khung trước chuyển cảnh đúng giây rồi dùng chung veFrame */
async function veKhungXuat(ctx, W, H, t) {
  const { clip, tSrc } = viTri(t);
  if (clip >= 0) { const s = srcCua(P.clips[clip].src); if (s && s.el && s.loai === 'video') { await seekTo(s.el, tSrc); if (Math.abs(s.el.currentTime - tSrc) > 0.03) await seekTo(s.el, tSrc); } }   // máy bận làm lỡ lần tua → tua lại cho đúng khung
  for (const b of P.broll) { const k = tocC(b), dai = (b.kt - b.bd) / k; if (t >= b.t_bd && t < b.t_bd + dai) { const sb = srcCua(b.src); if (sb && sb.loai === 'video') await seekTo(elPhu(sb, 'elB'), b.bd + (t - b.t_bd) * k); } }
  const ch = chuyenTai(t), snap = ch ? await laySnapCh(W, H, ch, t) : null;
  veFrame(ctx, W, H, t, snap);
}
function caiXuat() { return { fps: +$('#xuatFps').value || 30, cl: $('#xuatCL').value || 'cao', dd: $('#xuatDD').value || 'mp4_avc', cach: $('#xuatCach').value || 'nhanh', res: +$('#doPhanGiai').value || 1080, gifFps: +($('#gifFps') || {}).value || 12, gifRong: +($('#gifRong') || {}).value || 360, khoang: ($('#xuatKhoang') || {}).value || 'tat', mbps: Math.max(1, Math.min(100, +($('#xuatMbps') || {}).value || 12)), am: +($('#xuatAm') || {}).value || 192, pd: ($('#xuatPd') || {}).value || 'khong' }; }
function khoangXuat(o) { const tong = tongGiay(); if (o && o.khoang === 'vr' && (P.vao != null || P.ra != null)) { const a = Math.max(0, Math.min(tong, P.vao || 0)), b = Math.max(a + 0.05, Math.min(tong, P.ra == null ? tong : P.ra)); return [a, b]; } return [0, tong]; }
function catBuf(buf, a, b) { if (a <= 0 && b >= buf.duration - 0.001) return buf; const sr = buf.sampleRate, i0 = Math.floor(a * sr), i1 = Math.min(buf.length, Math.ceil(b * sr)), n = Math.max(1, i1 - i0), o = new AudioBuffer({ numberOfChannels: buf.numberOfChannels, length: n, sampleRate: sr }); for (let ch = 0; ch < buf.numberOfChannels; ch++) o.copyToChannel(buf.getChannelData(ch).subarray(i0, i0 + n), ch); return o; }
async function chuanBiVe() { try { await document.fonts.load('900 40px ' + (FONT_CSS[$('#font').value] || FONT_CSS.be_vietnam)); } catch { } if (segBat() && !segModel && !segLoi) { try { await segNap(); } catch { } } if (P.clips.some(c => c.chuyen && c.chuyen !== 'cat')) await gltNap(); }
async function xuatWebCodecs(o) {
  const M = await napMB(), [ka, kb] = khoangXuat(o), tong = tongGiay(), fps = o.fps, N = Math.max(1, Math.round((kb - ka) * fps)), { W, H } = kichThuoc(o.res), [loai, muon] = DD_XUAT[o.dd] || DD_XUAT.mp4_avc;
  const fmt = loai === 'webm' ? new M.WebMOutputFormat() : loai === 'mov' && M.MovOutputFormat ? new M.MovOutputFormat({ fastStart: 'in-memory' }) : new M.Mp4OutputFormat({ fastStart: 'in-memory' });
  const hoTro = fmt.getSupportedVideoCodecs(), thu = [muon, ...['avc', 'hevc', 'vp9', 'av1', 'vp8'].filter(c => c !== muon)].filter(c => hoTro.includes(c));
  const vc = await M.getFirstEncodableVideoCodec(thu, { width: W, height: H }); if (!vc) throw new Error('máy không mã hoá được video ' + W + '×' + H);
  const acd = await M.getFirstEncodableAudioCodec(['aac', 'opus'].filter(c => fmt.getSupportedAudioCodecs().includes(c)), { numberOfChannels: 2, sampleRate: 48000 });
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H }), ctx = canvas.getContext('2d');
  const out = new M.Output({ format: fmt, target: new M.BufferTarget() }), cl = o.cl === 'tuy' ? Math.round(o.mbps * 1e6) : { vua: M.QUALITY_MEDIUM, cao: M.QUALITY_HIGH, rat_cao: M.QUALITY_VERY_HIGH }[o.cl] || M.QUALITY_HIGH;
  const vs = new M.CanvasSource(canvas, { codec: vc, bitrate: cl, keyFrameInterval: 2 }); out.addVideoTrack(vs, { frameRate: fps });
  let as = null; if (acd) { as = new M.AudioBufferSource({ codec: acd, bitrate: (o.am || 192) * 1000 }); out.addAudioTrack(as); }
  await out.start();
  if (as) { $('#xuatTt').textContent = 'Đang trộn âm thanh…'; const mix = catBuf(await tronAmThanh(tong), ka, kb); if (P.huyXuat) { await out.cancel(); return null; } await as.add(mix); as.close(); }
  await chuanBiVe(); const t0 = performance.now();
  for (let n = 0; n < N; n++) {
    if (P.huyXuat) { await out.cancel(); return null; }
    const t = n / fps; await veKhungXuat(ctx, W, H, Math.min(ka + t, kb - 0.001)); await vs.add(t, 1 / fps);
    if (n % 3 === 0 || n === N - 1) { $('#xuatBar').style.width = ((n + 1) / N * 100).toFixed(1) + '%'; const tg = (performance.now() - t0) / 1000, con = tg / (n + 1) * (N - n - 1); $('#xuatTt').textContent = Math.floor((n + 1) / N * 100) + '% · còn ~' + tgCon(con) + ' · khung ' + (n + 1) + '/' + N + ' · ' + fps + ' khung/giây · ' + TEN_CODEC[vc] + (acd ? ' + ' + TEN_CODEC[acd] : ''); }
  }
  vs.close(); $('#xuatTt').textContent = 'Đang đóng gói file…'; await out.finalize();
  return { blob: new Blob([out.target.buffer], { type: loai === 'webm' ? 'video/webm' : loai === 'mov' && M.MovOutputFormat ? 'video/quicktime' : 'video/mp4' }), vc, acd, muon };
}
async function batDauXuat() {
  if (!P.clips.length) { toast('Chưa có đoạn nào để xuất'); return; } if (P.dang) dung();
  const o = caiXuat();
  $('#xuatHop').classList.add('mo'); $('#xuatXong').style.display = 'none'; $('#xuatHuy').style.display = ''; $('#xuatBar').style.width = '0'; P.huyXuat = false;
  try { if ('wakeLock' in navigator) P.wl = await navigator.wakeLock.request('screen'); } catch { }
  if (o.dd === 'wav') { $('#xuatTieuDe').textContent = 'Đang xuất âm thanh…'; $('#xuatTt').textContent = 'Đang trộn lồng tiếng, nhạc, hiệu ứng…'; try { const [ka, kb] = khoangXuat(o), mix = catBuf(await tronAmThanh(tongGiay()), ka, kb); if (P.huyXuat) return; luuFile(wavTuBuf(mix), 'File WAV 48 kHz, đủ lồng tiếng, nhạc (đã hạ khi nói) và hiệu ứng. Dùng để làm podcast hoặc chỉnh tiếp ở phần mềm khác.'); } catch (e) { toast('Xuất âm thanh lỗi: ' + (e.message || e)); $('#xuatHop').classList.remove('mo'); } return; }
  if (o.dd === 'mp3') { $('#xuatTieuDe').textContent = 'Đang xuất MP3…'; $('#xuatTt').textContent = 'Đang trộn lồng tiếng, nhạc, hiệu ứng…'; try { const blob = await xuatMp3(o); if (!blob) return; luuFile(blob, 'File MP3 ' + o.am + ' kbps, đủ lồng tiếng, nhạc và hiệu ứng.'); } catch (e) { if (P.huyXuat) return; toast('MP3 lỗi (' + (e.message || e) + '), xuất WAV thay thế'); try { const [ka, kb] = khoangXuat(o); luuFile(wavTuBuf(catBuf(await tronAmThanh(tongGiay()), ka, kb)), 'Không mã hoá được MP3 nên đã xuất WAV.'); } catch (e2) { toast('Xuất âm thanh lỗi: ' + (e2.message || e2)); $('#xuatHop').classList.remove('mo'); } } return; }
  if (o.dd === 'm4a') { $('#xuatTieuDe').textContent = 'Đang xuất âm thanh…'; $('#xuatTt').textContent = 'Đang trộn lồng tiếng, nhạc, hiệu ứng…'; try { const blob = await xuatM4a(o); if (!blob) return; luuFile(blob, 'File M4A (AAC ' + o.am + ' kbps), đủ lồng tiếng, nhạc và hiệu ứng.'); } catch (e) { if (P.huyXuat) return; toast('M4A lỗi (' + (e.message || e) + '), xuất WAV thay thế'); try { const [ka, kb] = khoangXuat(o); luuFile(wavTuBuf(catBuf(await tronAmThanh(tongGiay()), ka, kb)), 'Máy này không mã hoá được AAC nên đã xuất WAV.'); } catch (e2) { toast('Xuất âm thanh lỗi: ' + (e2.message || e2)); $('#xuatHop').classList.remove('mo'); } } return; }
  if (o.dd === 'gif') { $('#xuatTieuDe').textContent = 'Đang xuất GIF…'; try { const [ka, kb] = khoangXuat(o), cu = [P.vao, P.ra]; P.vao = ka; P.ra = kb; let blob; try { blob = await xuatGif(o); } finally { [P.vao, P.ra] = cu; } if (!blob) return; luuFile(blob, 'GIF ' + o.gifRong + 'px · ' + o.gifFps + ' khung/giây, không có tiếng. Dùng làm ảnh động xem trước hoặc gửi tin nhắn.'); } catch (e) { toast('Xuất GIF lỗi: ' + (e.message || e)); $('#xuatHop').classList.remove('mo'); } return; }
  if (o.cach === 'nhanh' && coWebCodecs()) {
    $('#xuatTieuDe').textContent = 'Đang dựng video (chính xác từng khung)…'; $('#xuatTt').textContent = 'Đang nạp bộ mã hoá…';
    try { const r = await xuatWebCodecs(o); if (!r) return; const doi = r.vc !== r.muon; luuFile(r.blob, (doi ? 'Máy này không mã hoá được ' + TEN_CODEC[r.muon] + ' nên đã dùng ' + TEN_CODEC[r.vc] + '. ' : '') + (r.blob.type === 'video/mp4' ? 'Bấm Tải video rồi đăng, hoặc đưa sang Chấm video để AI chấm bản này.' : 'File WebM, TikTok web vẫn nhận.')); return; }
    catch (e) { console.warn('WebCodecs', e); if (P.huyXuat) return; toast('Bộ mã hoá nhanh lỗi (' + (e.message || e) + '), chuyển sang ghi thời gian thực'); }
  }
  if (!window.MediaRecorder || !cv.captureStream) { toast('Trình duyệt này chưa xuất được video, dùng Chrome hoặc Safari mới.'); $('#xuatHop').classList.remove('mo'); return; }
  $('#xuatTieuDe').textContent = 'Đang dựng video…'; P.t = 0; await phat(true);
}
