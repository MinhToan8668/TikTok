/* ═════════ BẢN ĐẦY ĐỦ (10/2026): thuộc tính đoạn kiểu CapCut/Vyra · keyframe · màu · chữ tự do · chroma key ·
   cắt khoảng lặng · đóng băng · mốc · tỉ lệ khung · phong cách · phiên bản & tạo short ═════════ */
const PROP_MD = { x: 0, y: 0, sc: 1, xoay: 0, mo: 1, am: 1, toc: 1, fi: 0, fo: 0, loc: 'khong', locMuc: 1, sang: 0, tuong_phan: 0, bao_hoa: 0, phoi: 0, nhiet: 0, tint: 0, sang_cao: 0, toi: 0, vignette: 0, hat: 0, hu2: 'khong', latX: false, latY: false, cat: null, kfs: null, anVao: null, anRa: null, kf: false, sc2: null, x2: null, y2: null };
Object.assign(PROP_MD, { scX: 1, scY: 1 });   /* spec 2.4: co giãn rộng / cao riêng (bỏ khoá tỉ lệ) */
function propsC(c) { const o = {}; Object.keys(PROP_MD).forEach(k => { if (c[k] != null && c[k] !== PROP_MD[k]) o[k] = c[k]; }); return o; }
function fadeHeSo(c, off) { const dai = daiC(c); let a = 1; if (c.fi > 0) a = Math.min(a, Math.max(0, off / c.fi)); if (c.fo > 0) a = Math.min(a, Math.max(0, (dai - off) / c.fo)); return a; }
const easeIO = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const LOC = { khong: ['Không', ''], am: ['Ấm', 'sepia(.18) saturate(1.18) hue-rotate(-8deg)'], lanh: ['Lạnh', 'saturate(1.08) hue-rotate(12deg) brightness(1.03)'], sang: ['Sáng trong', 'brightness(1.1) contrast(1.05) saturate(1.1)'], dien_anh: ['Điện ảnh', 'contrast(1.18) saturate(.82) brightness(.96)'], ruc_ro: ['Rực rỡ', 'saturate(1.45) contrast(1.08)'], co_dien: ['Cổ điển', 'sepia(.42) contrast(1.06) brightness(.98)'], trang_den: ['Trắng đen', 'grayscale(1) contrast(1.12)'] };
function giamCss(str, k) { if (k >= 0.999) return str; const md = { brightness: 1, contrast: 1, saturate: 1, sepia: 0, grayscale: 0, 'hue-rotate': 0, invert: 0 }; return str.replace(/([a-z-]+)\(([-\d.]+)(deg)?\)/g, (m, fn, v, dv) => md[fn] == null ? m : fn + '(' + (md[fn] + (parseFloat(v) - md[fn]) * k).toFixed(3) + (dv || '') + ')'); }
function locCss(c) { const p = []; const b = (LOC[c.loc] || LOC.khong)[1]; if (b) p.push(giamCss(b, c.locMuc == null ? 1 : c.locMuc)); if (c.sang) p.push('brightness(' + (1 + c.sang / 100).toFixed(2) + ')'); if (c.tuong_phan) p.push('contrast(' + (1 + c.tuong_phan / 100).toFixed(2) + ')'); if (c.bao_hoa) p.push('saturate(' + (1 + c.bao_hoa / 100).toFixed(2) + ')'); if (c.hu2 === 'phim_cu') p.push('sepia(.35) contrast(1.08)'); return p.join(' '); }
function apDoan(ctx, W, H, c, off, ve) { return apMatNaBlend(ctx, W, H, c, off, ve); }
function apDoanGoc(ctx, W, H, c, off, ve) {
  const dai = daiC(c), an = anTai(c, off, dai); hieuUngTruoc(c, off, an);
  const sc = giaTriKf(c, 'sc', off) * an.ds, sx = giaTriKf(c, 'scX', off), sy = giaTriKf(c, 'scY', off), x = giaTriKf(c, 'x', off) + an.dx, y = giaTriKf(c, 'y', off) + an.dy, xoay = giaTriKf(c, 'xoay', off) + an.dr, f = locCss(c) + (an.blur > 0.3 ? ' blur(' + (an.blur * W / 1080).toFixed(1) + 'px)' : '');
  const a = giaTriKf(c, 'mo', off) * fadeHeSo(c, off) * an.da;
  if (sc === 1 && sx === 1 && sy === 1 && !x && !y && !xoay && a >= 1 && !f.trim() && !c.latX && !c.latY) { ve(ctx); hieuUngSau(ctx, W, H, c, off); return; }
  ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a)); if (f.trim()) ctx.filter = f.trim();
  ctx.translate(W / 2 + x * W, H / 2 + y * H); if (xoay) ctx.rotate(xoay * Math.PI / 180); ctx.scale(sc * sx * (c.latX ? -1 : 1), sc * sy * (c.latY ? -1 : 1)); ctx.translate(-W / 2, -H / 2);
  ve(ctx); ctx.restore(); hieuUngSau(ctx, W, H, c, off);
}
/* chroma key (xanh lá / xanh dương / màu tuỳ chọn) cho b-roll V2, xử lý ở ảnh tối đa 720px */
const ckCv = document.createElement('canvas');
function chromaKey(im, sb, b) {
  try {
    const iw = sb.w || im.videoWidth || im.width, ih = sb.h || im.videoHeight || im.height; if (!iw || !ih) return null;
    const k = Math.min(1, 720 / Math.max(iw, ih)), w = Math.round(iw * k), h = Math.round(ih * k);
    if (ckCv.width !== w || ckCv.height !== h) { ckCv.width = w; ckCv.height = h; }
    const g = ckCv.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h), px = d.data, hex = (b.chroma_mau || '#00ff00').replace('#', ''), kr = parseInt(hex.slice(0, 2), 16), kg = parseInt(hex.slice(2, 4), 16), kb = parseInt(hex.slice(4, 6), 16);
    const ng = (b.chroma_nguong == null ? 0.35 : b.chroma_nguong) * 441, mem = 60;
    for (let i = 0; i < px.length; i += 4) { const dr = px[i] - kr, dg = px[i + 1] - kg, db = px[i + 2] - kb, dist = Math.sqrt(dr * dr + dg * dg + db * db); if (dist < ng) px[i + 3] = 0; else if (dist < ng + mem) { px[i + 3] = Math.round(255 * (dist - ng) / mem); if (kg > kr && kg > kb) px[i + 1] = Math.min(px[i + 1], Math.max(px[i], px[i + 2])); } }
    g.putImageData(d, 0, 0); return ckCv;
  } catch (e) { return null; }
}
/* chữ tự do + sticker trên O1 (kéo được trên khung, nhiều hiệu ứng vào) */
function keoChuTrenKhung(e) {
  if (!P.chon || P.chon.k !== 'g') return false; const g = P.gfx[P.chon.i]; if (!g || (g.kieu !== 'chu' && g.kieu !== 'sticker')) return false;
  const r = cv.getBoundingClientRect(); e.preventDefault(); cv.setPointerCapture(e.pointerId); luuHoanTac();
  const mv = ev => { let nx = Math.max(0.02, Math.min(0.98, (ev.clientX - r.left) / r.width)), ny = Math.max(0.03, Math.min(0.97, (ev.clientY - r.top) / r.height)); const off = offMuc('g', g), hx = !ev.altKey && Math.abs(nx - 0.5) * r.width < MAC_DINH.hutKhungPx, hy = !ev.altKey && Math.abs(ny - 0.5) * r.height < MAC_DINH.hutKhungPx; if (hx) nx = 0.5; if (hy) ny = 0.5; veVachTam(hx, hy); if (g.kfs && g.kfs.x && g.kfs.x.length) datKf(g, 'x', off, +nx.toFixed(4)); else g.x = nx; if (g.kfs && g.kfs.y && g.kfs.y.length) datKf(g, 'y', off, +ny.toFixed(4)); else g.y = ny; if (!P.dang) veKhung(); };   // có keyframe vị trí thì kéo = đặt keyframe tại đầu phát (như CapCut)
  mv(e); const up = () => { veVachTam(false, false); cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); veProp(); }; cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', up); return true;
}
/* ô điều khiển dùng chung trong cột Thuộc tính */
function oTruot(box, nhan, min, max, buoc, giaTri, dinhDang, doi) {
  const l = el('label'); l.appendChild(el('span', null, nhan)); const r = el('input'); r.type = 'range'; r.min = min; r.max = max; r.step = buoc; r.value = giaTri; const o = el('output', null, dinhDang(+giaTri));
  let daLuu = false; r.oninput = () => { if (!daLuu) { luuHoanTac(); daLuu = true; } o.textContent = dinhDang(+r.value); doi(+r.value); if (!P.dang) veKhung(); };
  r.onchange = () => { daLuu = false; veTl(); }; l.appendChild(r); l.appendChild(o); box.appendChild(l);
  o.title = 'Bấm để gõ số · kéo ngang để đổi nhanh · Enter xong, Esc huỷ';
  o.onpointerdown = e => { if (e.button) return; const x0 = e.clientX, v0 = +r.value, buocPx = (max - min) / 240; let keo = false; try { o.setPointerCapture(e.pointerId); } catch { }   /* kéo ngang trên ô số đổi giá trị (Shift = nhanh ×10, Alt = chậm) */
    const mv = ev => { const dx = ev.clientX - x0; if (!keo && Math.abs(dx) < 3) return; keo = true; const he = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1; let v = v0 + dx * buocPx * he; v = Math.max(min, Math.min(max, Math.round(v / buoc) * buoc)); if (+r.value !== v) { r.value = v; r.oninput(); } };
    const up = () => { o.removeEventListener('pointermove', mv); o.removeEventListener('pointerup', up); o.removeEventListener('pointercancel', up); if (keo) { r.onchange(); o.dataset.vuaKeo = '1'; setTimeout(() => { delete o.dataset.vuaKeo; }, 0); } };
    o.addEventListener('pointermove', mv); o.addEventListener('pointerup', up); o.addEventListener('pointercancel', up); };
  o.onclick = e => { e.preventDefault(); if (o.dataset.vuaKeo) return; const so = el('input', 'soTruot'); so.type = 'number'; so.min = min; so.max = max; so.step = buoc; so.value = r.value; o.replaceWith(so); so.focus(); so.select(); const xong = () => { let v = +so.value; if (isNaN(v)) v = +r.value; v = Math.max(min, Math.min(max, v)); r.value = v; r.oninput(); r.onchange(); o.textContent = dinhDang(+r.value); so.replaceWith(o); }; so.onblur = xong; so.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') so.blur(); if (e.key === 'Escape') { so.value = r.value; so.blur(); } }; };
  l.firstChild.title = 'Bấm đúp để đặt lại'; l.firstChild.onclick = e => e.preventDefault();   // nhãn không kích hoạt nút ◇ keyframe
  l.firstChild.ondblclick = () => { const md = r.dataset.md != null ? +r.dataset.md : (/Phóng to|Độ mờ|Cường độ|Âm lượng|Giãn dòng|Độ đậm/.test(nhan) && min <= 1 && max >= 1 ? 1 : (min <= 0 && max >= 0 ? 0 : min)); r.value = md; r.oninput(); r.onchange(); };
  r.ondblclick = () => l.firstChild.ondblclick();   /* bấm đúp thanh trượt cũng đặt lại */
  return r;
}
function oChon(box, nhan, ds, giaTri, doi) { const l = el('label'); l.appendChild(el('span', null, nhan)); const sl = el('select'); ds.forEach(([v, t]) => { const o = el('option', null, t); o.value = v; sl.appendChild(o); }); sl.value = giaTri; sl.onchange = () => { luuHoanTac(); doi(sl.value); veTl(); if (!P.dang) veKhung(); }; l.appendChild(sl); box.appendChild(l); return sl; }
const pct = v => Math.round(v * 100) + '%', sgn = v => (v > 0 ? '+' : '') + Math.round(v);
/* khoá tỉ lệ: bật (mặc định) = phóng đều; tắt = hiện thanh Rộng / Cao và 4 tay nắm mép trên khung xem trước */
function veKhoaTiLe(box, k, m) {
  const l = el('label'); l.appendChild(el('span', null, 'Khoá tỉ lệ')); const cb = el('input'); cb.type = 'checkbox'; cb.className = 'khoaTiLe'; cb.checked = m.khoaTiLe !== false; l.appendChild(cb); box.appendChild(l);
  cb.onchange = () => { luuHoanTac(); if (cb.checked) { const s2 = Math.sqrt(giaTriKf(m, 'scX', offMuc(k, m)) * giaTriKf(m, 'scY', offMuc(k, m))); delete m.khoaTiLe; if (Math.abs(s2 - 1) > 1e-3) m.sc = +((m.sc || 1) * s2).toFixed(3); delete m.scX; delete m.scY; if (m.kfs) { delete m.kfs.scX; delete m.kfs.scY; } } else m.khoaTiLe = false; veProp(); veKhung(); veTl(); };
  if (m.khoaTiLe === false) { oTruotKf(box, 'Rộng', 0.05, 10, 0.01, k, m, 'scX', v => Math.round(v * 100) + '%'); oTruotKf(box, 'Cao', 0.05, 10, 0.01, k, m, 'scY', v => Math.round(v * 100) + '%'); }
}
function veThuocTinhDoan(box, c) {
  const n1 = el('div', 'nhom2'); n1.appendChild(el('b', null, 'Khung hình')); box.appendChild(n1);
  n1.appendChild(el('div', 'quota', 'Kéo trực tiếp trên khung xem trước: thân để dời, góc để phóng, núm tròn để xoay.'));
  oTruotKf(n1, 'Phóng to', 0.01, 10, 0.01, 'v', c, 'sc', pct); veKhoaTiLe(n1, 'v', c);
  oTruotKf(n1, 'Vị trí ngang', -1, 1, 0.005, 'v', c, 'x', v => sgn(v * 100));
  oTruotKf(n1, 'Vị trí dọc', -1, 1, 0.005, 'v', c, 'y', v => sgn(v * 100));
  oTruotKf(n1, 'Xoay', -720, 720, 1, 'v', c, 'xoay', v => Math.round(v) + '°');
  oTruotKf(n1, 'Độ mờ', 0, 1, 0.01, 'v', c, 'mo', pct);
  veKeyframeDieuKhien(box, 'v', c); veHoatAnh(box, c); veLatCat(box, c);
  const sN = srcCua(c.src), laAnhC = !!(sN && sN.loai === 'anh');   /* ảnh tĩnh: không có tab Âm thanh, Tốc độ */
  const n3t = el('div', 'nhom2'); n3t.appendChild(el('b', null, 'Tốc độ')); if (!laAnhC) box.appendChild(n3t);
  veTocDoan(n3t, c);
  veCongToc(n3t, c);
  const n3 = el('div', 'nhom2'); n3.appendChild(el('b', null, 'Âm thanh')); if (!laAnhC) box.appendChild(n3);
  oTruotKf(n3, 'Âm lượng', 0, 3.1623, 0.01, 'v', c, 'am', v => v <= 0.001 ? 'tắt' : (20 * Math.log10(v) >= 0 ? '+' : '') + (20 * Math.log10(v)).toFixed(1) + 'dB');
  oTruot(n3, 'Hiện dần vào', 0, 2, 0.1, c.fi || 0, v => v ? v.toFixed(1) + 's' : 'không', v => { c.fi = v; });
  oTruot(n3, 'Mờ dần ra', 0, 2, 0.1, c.fo || 0, v => v ? v.toFixed(1) + 's' : 'không', v => { c.fo = v; });
  veKhuOn(n3, c); veAmThanhThem(n3, c);
  const n4 = el('div', 'nhom2'); n4.appendChild(el('b', null, 'Màu')); box.appendChild(n4);
  oChon(n4, 'Bộ lọc', Object.keys(LOC).map(k => [k, LOC[k][0]]), c.loc || 'khong', v => { c.loc = v; });
  oTruot(n4, 'Độ sáng', -50, 50, 1, c.sang || 0, sgn, v => { c.sang = v; });
  oTruot(n4, 'Tương phản', -50, 50, 1, c.tuong_phan || 0, sgn, v => { c.tuong_phan = v; });
  oTruot(n4, 'Bão hoà', -100, 100, 1, c.bao_hoa || 0, sgn, v => { c.bao_hoa = v; });
  if (c.loc && c.loc !== 'khong') oTruot(n4, 'Cường độ bộ lọc', 0, 1, 0.01, c.locMuc == null ? 1 : c.locMuc, pct, v => { c.locMuc = v; });
  [['phoi', 'Phơi sáng'], ['nhiet', 'Nhiệt độ (ấm/lạnh)'], ['tint', 'Tint (xanh/hồng)'], ['sang_cao', 'Vùng sáng'], ['toi', 'Vùng tối']].forEach(([k, t]) => oTruot(n4, t, -100, 100, 1, c[k] || 0, sgn, v => { c[k] = v; }));
  [['vignette', 'Viền tối (vignette)'], ['hat', 'Hạt phim']].forEach(([k, t]) => oTruot(n4, t, 0, 100, 1, c[k] || 0, v => Math.round(v) + '', v => { c[k] = v; }));
  [['trang', 'Trắng (whites)', -100, 100], ['den', 'Đen (blacks)', -100, 100], ['hue', 'Sắc độ (hue)', -180, 180], ['vib', 'Độ rực (vibrance)', -100, 100], ['phai', 'Phai màu (fade)', 0, 100], ['net', 'Độ nét (sharpen)', 0, 100], ['ro', 'Độ trong (clarity)', -100, 100]].forEach(([k, t, a, b]) => oTruot(n4, t, a, b, 1, c[k] || 0, k === 'hue' ? v => Math.round(v) + '°' : sgn, v => { c[k] = v; }));
  oChon(n4, 'LUT', [['', 'Không'], ...Object.values(P.luts || {}).map(l => [l.id, l.ten + ' (' + l.n + '³)'])], c.lut && P.luts[c.lut] ? c.lut : '', v => { if (v) c.lut = v; else delete c.lut; veProp(); });
  if (c.lut && P.luts[c.lut]) oTruot(n4, 'Cường độ LUT', 0, 1, 0.01, c.lutMuc == null ? 1 : c.lutMuc, pct, v => { c.lutMuc = v; });
  oChon(n4, 'Hiệu ứng', Object.keys(HIEU_UNG).map(k => [k, HIEU_UNG[k]]), c.hu2 || 'khong', v => { c.hu2 = v; veProp(); }); if (typeof laHuKho === 'function' && laHuKho(c)) oTruot(n4, 'Cường độ hiệu ứng', 0, 1, 0.01, c.huMuc == null ? 1 : c.huMuc, pct, v => { c.huMuc = v; });
  const r2 = el('div', 'row'); const ap = el('button', 'btn nho', 'Áp màu cho mọi đoạn'); ap.type = 'button'; ap.onclick = () => { luuHoanTac(); P.clips.forEach(k => { ['loc', 'locMuc', 'sang', 'tuong_phan', 'bao_hoa', 'phoi', 'nhiet', 'tint', 'sang_cao', 'toi', 'vignette', 'hat', 'trang', 'den', 'hue', 'vib', 'phai', 'net', 'ro', 'lut', 'lutMuc', 'banh', 'cmau', 'hsl'].forEach(p => { if (c[p] == null) delete k[p]; else k[p] = JSON.parse(JSON.stringify(c[p])); }); }); veTl(); veKhung(); toast('Đã áp màu cho ' + P.clips.length + ' đoạn'); }; r2.appendChild(ap);
  const dl = el('button', 'btn nho ghost', 'Đặt lại thuộc tính'); dl.type = 'button'; dl.onclick = () => { luuHoanTac(); let acc = 0; for (const k of P.clips) { if (k === c) break; acc += daiC(k); } const cu = daiC(c); [...Object.keys(PROP_MD), 'trang', 'den', 'hue', 'vib', 'phai', 'net', 'ro', 'lut', 'lutMuc', 'mn', 'banh', 'cmau', 'hsl', 'khuOn'].forEach(k => { delete c[k]; }); ripple(acc + cu, daiC(c) - cu); veTl(); veProp(); veKhung(); }; r2.appendChild(dl); n4.appendChild(r2);
  veBanhXe(box, c); veDuongCong(box, c); veHsl(box, c); veThuocTinhTrangTri(box, c); veThuocTinhMb(box, 'v', c); veThuocTinhMatNa(box, 'v', c);
}
function veThuocTinhBroll(box, b) {
  const n0 = el('div', 'nhom2'); n0.appendChild(el('b', null, 'Lớp & khớp khung')); box.appendChild(n0); oChon(n0, 'Lớp', [['2', 'V2 (dưới)'], ['3', 'V3 (trên cùng)']], String(b.lop || 2), v => { b.lop = +v; }); oChon(n0, 'Khớp khung', [['cover', 'Phủ kín (cắt mép)'], ['contain', 'Vừa trong khung (giữ nguyên hình)']], b.vua || 'cover', v => { b.vua = v; });
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Ghép nền (chroma key) & độ mờ')); box.appendChild(n);
  const l = el('label'); l.appendChild(el('span', null, 'Xoá phông xanh')); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!b.chroma; cb.onchange = () => { luuHoanTac(); b.chroma = cb.checked; veKhung(); veProp(); }; l.appendChild(cb); n.appendChild(l);
  if (b.chroma) { oChon(n, 'Màu cần xoá', [['#00ff00', 'Xanh lá'], ['#0047ff', 'Xanh dương'], ['#ffffff', 'Trắng'], ['#000000', 'Đen']], b.chroma_mau || '#00ff00', v => { b.chroma_mau = v; }); oTruot(n, 'Độ mạnh', 0.1, 0.7, 0.01, b.chroma_nguong == null ? 0.35 : b.chroma_nguong, pct, v => { b.chroma_nguong = v; }); }
  const n2 = el('div', 'nhom2'); n2.appendChild(el('b', null, 'Khung hình (overlay)')); box.appendChild(n2);
  oTruotKf(n2, 'Phóng to', 0.01, 10, 0.01, 'b', b, 'sc', pct); veKhoaTiLe(n2, 'b', b); oTruotKf(n2, 'Vị trí ngang', -1, 1, 0.005, 'b', b, 'x', v => sgn(v * 100)); oTruotKf(n2, 'Vị trí dọc', -1, 1, 0.005, 'b', b, 'y', v => sgn(v * 100));
  oTruotKf(n2, 'Xoay', -720, 720, 1, 'b', b, 'xoay', v => Math.round(v) + '°'); oTruotKf(n2, 'Độ mờ', 0, 1, 0.01, 'b', b, 'mo', pct);
  veKeyframeDieuKhien(box, 'b', b); veHoatAnh(box, b); veLatCat(box, b); veThuocTinhBlend(box, b); veThuocTinhTrangTri(box, b); veThuocTinhMb(box, 'b', b); veThuocTinhMatNa(box, 'b', b);
}
/* ── mốc (marker) ── */
function themMoc(t, ten) { t = t == null ? P.t : t; P.moc = P.moc || []; if (P.moc.some(m => Math.abs(m.t - t) < 0.05)) { toast('Đã có mốc ở đây'); return; } P.moc.push({ t: +t.toFixed(2), ten: ten || 'Mốc ' + (P.moc.length + 1) }); P.moc.sort((a, b) => a.t - b.t); veTl(); toast('Đặt mốc tại ' + fmt1(t) + 's'); }
$('#btnMoc').onclick = () => themMoc();
/* ── đóng băng khung (freeze frame): chụp khung tại đầu phát thành ảnh, chèn vào giữa đoạn ── */
async function dongBang(giay, tl) {
  if (tl != null) { P.t = tl; await veKhung(); }
  const { clip, tSrc, bdTl } = viTri(P.t); if (clip < 0) { toast('Chưa có đoạn nào'); return false; }
  const c = P.clips[clip], s = srcCua(c.src); if (!s || s.loai !== 'video') { toast('Chỉ đóng băng được đoạn video'); return false; }
  await seekTo(s.el, tSrc); const k = document.createElement('canvas'); k.width = s.w; k.height = s.h; k.getContext('2d').drawImage(s.el, 0, 0, s.w, s.h);
  const blob = await new Promise(ok => k.toBlob(ok, 'image/jpeg', 0.92)); const ten = 'dong-bang-' + (P.srcs.filter(z => z.dongBang).length + 1) + '.jpg';
  await themFile([new File([blob], ten, { type: 'image/jpeg' })]); const a = P.srcs.find(z => z.ten === ten); if (!a) return false;
  a.dongBang = true; a.loai_canh = 'broll'; a.mo_ta = 'Khung đóng băng tại ' + fmt1(tSrc) + 's của ' + s.ten; a.tt = 'xong'; a.giay = 10;
  luuHoanTac(); const dai = Math.max(0.3, Math.min(10, giay || (P.cai && P.cai.dongBang) || 3)), moi = { ...c, src: a.id, bd: 0, kt: dai, ly_do: 'đóng băng', toc: 1, kf: false, chuyen: 'cat' };
  const giua = tSrc > c.bd + 0.05 && tSrc < c.kt - 0.05;
  if (giua) { P.clips.splice(clip + 1, 0, moi, { ...c, bd: tSrc }); c.kt = tSrc; } else P.clips.splice(tSrc <= c.bd + 0.05 ? clip : clip + 1, 0, moi);
  ripple(bdTl + (tSrc - c.bd) / tocC(c), dai); veSrcs(); veTl(); veKhung(); toast('Đã đóng băng ' + fmt1(dai) + 's'); return true;
}
$('#btnDongBang').onclick = () => dongBang();
/* ── cắt khoảng lặng & tiếng ờ/ừm theo lời đã chép từng từ (như auto-editor / Vyra "bỏ pause") ── */
const FILLER = /^(ờ+|ừ+|ừm+|ưm+|ửm+|ờm+|ừa|uhm+|um+|hmm+)[,.!?…]*$/i;   // chắc chắn là tiếng đệm → tự cắt; thì/là/kiểu/à chỉ đánh dấu (xem FILLER_NGO)
/* ── tỉ lệ khung: 9:16, 1:1, 4:5, 16:9; độ phân giải xuất tính theo cạnh ngắn ── */
const TI_LE = { '9:16': [9, 16], '1:1': [1, 1], '4:5': [4, 5], '16:9': [16, 9] };
function kichThuoc(res) { const [a, b] = TI_LE[$('#tiLe').value] || TI_LE['9:16']; const chan = v => Math.round(v / 2) * 2; return a <= b ? { W: res, H: chan(res * b / a) } : { W: chan(res * a / b), H: res }; }
function datTiLe(v, yen) {
  const [a, b] = TI_LE[v] || TI_LE['9:16']; $('#tiLe').value = TI_LE[v] ? v : '9:16';
  const W = a <= b ? 540 : 960, H = Math.round(W * b / a); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const kh = $('.khung'); kh.style.aspectRatio = a + '/' + b; if (a > b) { kh.style.height = 'auto'; kh.style.width = 'min(100%, 760px)'; } else { kh.style.height = ''; kh.style.width = ''; }
  if (a > b && $('#khungKieu').value === 'bam_mat') $('#khungKieu').value = 'cat';
  if (!yen) toast('Khung ' + v + (a > b ? ' · xuất ngang cho YouTube' : ''));
  if (!P.dang) veKhung();
}
$('#tiLe').addEventListener('change', () => datTiLe($('#tiLe').value));
/* ── phong cách (style preset): có sẵn + của bạn (lưu trên máy) ── */
const PHONG_CACH = {
  hormozi: { ten: '🔥 Podcast bùng nổ', pdKieu: 'highlight', mau: '#FFD400', font: 'anton', pdCum: 2, chuyen: 'cat', zoomOn: true, loc: 'ruc_ro' },
  vlog: { ten: '🌿 Vlog nhẹ nhàng', pdKieu: 'rise', mau: '#ffffff', font: 'lexend', pdCum: 4, chuyen: 'fade', zoomOn: false, loc: 'am' },
  tin_tuc: { ten: '📰 Tin nhanh', pdKieu: 'toi', mau: '#4bc3ff', font: 'be_vietnam', pdCum: 5, chuyen: 'wipe', zoomOn: true, loc: 'sang' },
  dien_anh: { ten: '🎬 Điện ảnh', pdKieu: 'vien', mau: '#ffffff', font: 'playfair', pdCum: 4, chuyen: 'fade', zoomOn: false, loc: 'dien_anh' },
  nang_dong: { ten: '⚡ Năng động', pdKieu: 'pop', mau: '#99DF00', font: 'montserrat', pdCum: 3, chuyen: 'whip', zoomOn: true, loc: 'ruc_ro' },
  toi_gian: { ten: '◻ Tối giản', pdKieu: 'pill', mau: '#111111', font: 'bricolage', pdCum: 4, chuyen: 'cat', zoomOn: false, loc: 'khong' }
};
function pcCuaToi() { try { return JSON.parse(ls.get('dv_phong_cach') || '{}') || {}; } catch { return {}; } }
function vePhongCach() { const sl = $('#phongCach'), cu = sl.value; sl.innerHTML = ''; const all = { ...PHONG_CACH, ...pcCuaToi() }; Object.keys(all).forEach(k => { const o = el('option', null, all[k].ten); o.value = k; sl.appendChild(o); }); if (cu && all[cu]) sl.value = cu; }
function apPhongCach(k) {
  const p = { ...PHONG_CACH, ...pcCuaToi() }[k]; if (!p) return false; luuHoanTac();
  if (p.pdKieu) $('#pdKieu').value = p.pdKieu; if (p.pdCum) $('#pdCum').value = p.pdCum; if (p.font && FONT_CSS[p.font]) { $('#font').value = p.font; capNhatFont(); } if (p.zoomOn != null) $('#zoomOn').checked = p.zoomOn;
  if (p.mau) { const b = $$('#pdMau button').find(x => x.dataset.m.toLowerCase() === p.mau.toLowerCase()); $$('#pdMau button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); if (!b && $$('#pdMau button')[0]) $$('#pdMau button')[0].setAttribute('aria-pressed', 'true'); }
  if (p.chuyen) { $('#chuyenMacDinh').value = p.chuyen; P.clips.forEach((c, i) => { if (i < P.clips.length - 1) c.chuyen = p.chuyen; }); if (p.chuyen !== 'cat') gltNap(); }
  if (p.loc) P.clips.forEach(c => { c.loc = p.loc; });
  if (p.pdY) P.pdY = p.pdY; if (p.khung && (p.khung !== 'bam_mat' || P.srcs.some(z => z.mat && z.mat.length))) $('#khungKieu').value = p.khung;
  docTuNhan(); veTl(); veKhung(); return true;
}
$('#btnApPC').onclick = () => { if (apPhongCach($('#phongCach').value)) toast('Đã áp phong cách ' + $('#phongCach').selectedOptions[0].textContent); };
$('#btnLuuPC').onclick = () => { const ten = prompt('Tên phong cách', 'Phong cách của tôi'); if (!ten) return; const ds = pcCuaToi(), k = 'cua_toi_' + Date.now().toString(36); ds[k] = { ten: '⭐ ' + ten.slice(0, 40), pdKieu: $('#pdKieu').value, mau: mauNhan(), font: $('#font').value, pdCum: +$('#pdCum').value, chuyen: $('#chuyenMacDinh').value, zoomOn: $('#zoomOn').checked, loc: (P.clips[0] || {}).loc || 'khong', pdY: P.pdY, khung: $('#khungKieu').value }; ls.set('dv_phong_cach', JSON.stringify(ds)); vePhongCach(); $('#phongCach').value = k; toast('Đã lưu phong cách, dùng lại ở mọi dự án trên máy này'); };
vePhongCach();
/* ── phiên bản dòng thời gian & tạo nhiều short từ video dài (AutoCut) ── */
function banChup() { return JSON.parse(JSON.stringify({ clips: P.clips, gfx: P.gfx, broll: P.broll, zoom: P.zoom, moc: P.moc, hook: $('#hook').value, tieng: tiengNhe() })); }
function banLuuHienTai() { if (P.banDang >= 0 && P.ban[P.banDang]) Object.assign(P.ban[P.banDang], banChup()); }
function veBan() { const sl = $('#phienBan'); sl.innerHTML = ''; if (!P.ban.length) { const o = el('option', null, 'Bản chính (chưa lưu phiên bản)'); o.value = '-1'; sl.appendChild(o); return; } P.ban.forEach((b, i) => { const o = el('option', null, (i + 1) + '. ' + b.ten + ' · ' + fmt(b.clips.reduce((a, c) => a + daiC(c), 0))); o.value = i; sl.appendChild(o); }); sl.value = String(P.banDang); }
function moBan(i) { banLuuHienTai(); const b = P.ban[i]; if (!b) return; luuHoanTac(); P.banDang = i; P.clips = JSON.parse(JSON.stringify(b.clips)); P.gfx = JSON.parse(JSON.stringify(b.gfx || [])); P.broll = JSON.parse(JSON.stringify(b.broll || [])); P.zoom = (b.zoom || []).slice(); P.moc = (b.moc || []).slice(); P.tieng = tiengDay(b.tieng || []); $('#hook').value = b.hook || ''; P.t = 0; veBan(); veTl(); veLoi(); veKhung(); }
function themBan(ten, du) { banLuuHienTai(); if (!P.ban.length && P.clips.length && !du) { P.ban.push({ ten: 'Bản chính', ...banChup() }); } P.ban.push({ ten, ...(du || banChup()) }); P.banDang = P.ban.length - 1; veBan(); return P.banDang; }
$('#btnLuuBan').onclick = () => { if (!P.clips.length) { toast('Chưa có gì để lưu'); return; } const ten = prompt('Tên phiên bản', 'Bản ' + (P.ban.length + 1)); if (!ten) return; if (!P.ban.length) { P.ban.push({ ten: ten.slice(0, 40), ...banChup() }); P.banDang = 0; } else { banLuuHienTai(); P.ban.push({ ten: ten.slice(0, 40), ...banChup() }); P.banDang = P.ban.length - 1; } veBan(); toast('Đã lưu phiên bản. Sửa tiếp không làm mất bản cũ.'); };
$('#phienBan').onchange = () => { const i = +$('#phienBan').value; if (i >= 0) moBan(i); };
async function taoShorts(soLuong, doDai) {
  const co = P.srcs.filter(s => s.tt === 'xong' && s.cau.length); if (!co.length) { toast('Cần "Hiểu footage" trước để AI đọc lời'); doiTab('footage'); return null; }
  if (!(await TK.canCo('chat'))) return null;
  const nut = $('#btnShorts'), cu = nut.textContent; nut.disabled = true; nut.textContent = 'AI đang chọn đoạn…';
  try {
    const r = await TK.goiNen({ action: 'hook_ai', mode: 'dung_shorts', token: TK.token(), dev: TK.dev(), ho_so: TK.hoSo(), so_luong: soLuong, do_dai: doDai,
      nguon: co.map(s => ({ id: s.id, giay: s.giay, mo_ta: s.mo_ta, cau: s.cau.map(c => ({ bd: c.bd, kt: c.kt, text: c.text, loai: c.loai })), khoanh_khac: s.khoanh_khac })) }, { tool: 'dung_shorts', nhan: 'Tạo short' });
    if (!r.ok) { if (r.error === 'het_luot_thu') TK.moHet('chat'); toast(ERR[r.error] || 'AI chưa cắt được, thử lại.'); return null; }
    const ds = (r.data.shorts || []).filter(x => x.clips.every(c => srcCua(c.src)));
    if (!ds.length) { toast('AI chưa tìm được đoạn hợp lệ'); return null; }
    banLuuHienTai(); if (!P.ban.length && P.clips.length) P.ban.push({ ten: 'Bản chính', ...banChup() });
    const dau = P.ban.length; ds.forEach(x => P.ban.push({ ten: '✂ ' + x.ten + (x.diem ? ' · ' + x.diem + '/10' : ''), clips: x.clips.map(c => ({ ...c, ly_do: 'short' })), gfx: [], broll: [], zoom: [], moc: [], hook: x.hook, tieng: [] }));
    P.banDang = -1; moBan(dau);
    P.lichSu.push({ vai: 'ai', text: 'Đã cắt ' + ds.length + ' short: ' + ds.map((x, i) => (i + 1) + ') ' + x.ten + ' (' + fmt(x.clips.reduce((a, c) => a + c.kt - c.bd, 0)) + (x.diem ? ', ' + x.diem + '/10' : '') + ')' + (x.ly_do ? ': ' + x.ly_do : '')).join(' · ') + '. Chọn ở ô Phiên bản để xem từng short.' }); veDs();
    toast('Đã tạo ' + ds.length + ' short, đang mở short 1'); return ds.length;
  } catch (e) { console.error('[shorts]', e); toast('Mất kết nối, thử lại.'); return null; }
  finally { nut.disabled = false; nut.textContent = cu; }
}
$('#btnShorts').onclick = () => taoShorts(+$('#shortSo').value, +$('#shortDai').value);
$('#btnPhim').onclick = () => $('#phimHop').classList.add('mo'); $('#phimDong').onclick = () => $('#phimHop').classList.remove('mo');
veBan();

/* ═════════ xuất phụ đề SRT và dự án FCPXML (mang sang CapCut, Premiere, DaVinci, Final Cut) ═════════ */
function srtTg(t) { t = Math.max(0, t); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), se = Math.floor(t % 60), ms = Math.round((t - Math.floor(t)) * 1000); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(se).padStart(2, '0') + ',' + String(ms).padStart(3, '0'); }
function taoSrt() { const dich = $('#pdSongNgu') && $('#pdSongNgu').checked && P.pdDich ? P.pdDich.cau : null; return cumTu().map((c, i) => (i + 1) + '\n' + srtTg(c.bd) + ' --> ' + srtTg(c.kt) + '\n' + c.tu.map(t => t.w).join(' ') + (dich && dich[cauCum(c)] ? '\n' + dich[cauCum(c)] : '') + '\n').join('\n'); }
function tenAscii(mac) { return (($('#tenDuAn').value.trim() || mac).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || mac); }
function luuText(ten, text, mime) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain;charset=utf-8' })); a.download = ten; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
function xmlAn(x) { return String(x).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c])); }
function taoFcpxml() {
  const FPS = 30, fr = t => Math.round(t * FPS) + '/' + FPS + 's', tong = tongGiay();
  const srcs = P.srcs.filter(s => P.clips.some(c => c.src === s.id) || P.broll.some(b => b.src === s.id));
  const assets = srcs.map((s, i) => `      <asset id="a${i + 1}" name="${xmlAn(s.ten)}" start="0s" duration="${fr(s.giay || 3)}" hasVideo="1" hasAudio="${s.loai === 'video' ? 1 : 0}" format="r1"><media-rep kind="original-media" src="file://./${encodeURIComponent(s.ten)}"/></asset>`).join('\n');
  const idCua = s => 'a' + (srcs.indexOf(s) + 1); let acc = 0;
  const spine = P.clips.map((c, i) => { const s = srcCua(c.src); const dai = daiC(c), x = `        <asset-clip name="${xmlAn((s ? s.ten : 'clip') + ' ' + (i + 1))}" ref="${idCua(s)}" offset="${fr(acc)}" start="${fr(c.bd)}" duration="${fr(dai)}"${c.chuyen && c.chuyen !== 'cat' ? ` note="chuyển cảnh: ${c.chuyen}"` : ''}/>`; acc += dai; return x; }).join('\n');
  const broll = P.broll.map((b, i) => { const s = srcCua(b.src); return `        <asset-clip name="${xmlAn('B-roll ' + (i + 1))}" lane="1" ref="${idCua(s)}" offset="${fr(b.t_bd)}" start="${fr(b.bd)}" duration="${fr(b.kt - b.bd)}"/>`; }).join('\n');
  const titles = P.gfx.map(g => `        <title name="${xmlAn((GX[g.kieu] || {}).ten || g.kieu)}" lane="2" offset="${fr(g.bd)}" duration="${fr(Math.max(0.3, g.kt - g.bd))}" ref="fx1"><text><text-style ref="ts1">${xmlAn([g.text, g.phu].filter(Boolean).join(' · '))}</text-style></text></title>`).join('\n');
  const pd = cumTu().map(c => `        <title name="Phụ đề" lane="3" offset="${fr(c.bd)}" duration="${fr(Math.max(0.2, c.kt - c.bd))}" ref="fx1"><text><text-style ref="ts1">${xmlAn(c.tu.map(t => t.w).join(' '))}</text-style></text></title>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="1/${FPS}s" width="1080" height="1920"/>
    <effect id="fx1" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
${assets}
  </resources>
  <library><event name="Viral Studio"><project name="${xmlAn($('#tenDuAn').value || 'Video moi')}">
    <sequence format="r1" duration="${fr(tong)}" tcStart="0s" tcFormat="NDF">
      <spine>
${spine}
${broll}
${titles}
${pd}
      </spine>
    </sequence>
  </project></event></library>
</fcpxml>
`;
}
$('#btnSrt').onclick = () => { if (!P.clips.length) { toast('Chưa có đoạn nào'); return; } const t = taoSrt(); if (!t.trim()) { toast('Chưa có lời thoại: bấm Hiểu footage trước'); return; } luuText(tenAscii('phu-de') + '.srt', t); toast('Đã lưu phụ đề .srt (CapCut: Text → Phụ đề → Nhập)'); };
$('#btnFcp').onclick = () => { if (!P.clips.length) { toast('Chưa có đoạn nào'); return; } luuText(tenAscii('du-an') + '.fcpxml', taoFcpxml(), 'application/xml'); toast('Đã lưu .fcpxml: mở trong Premiere (File → Import), DaVinci (Timeline → Import → AAF/EDL/XML) rồi nối lại file gốc'); };

/* ═════════ Trợ lý dựng kiểu agent: AI gọi từng lệnh lên dòng thời gian (bộ lệnh học theo Vyra MCP) ═════════ */
const AG = { kho: [], khoQ: '', ls: [], dang: false };
function khongDau(x) { return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
/* bộ lệnh: mỗi tool trả {text, image?, isError?} */
function agentSrc(id) { if (id == null) return null; id = String(id); return P.srcs.find(s => s.id === id) || (/^S\d+$/i.test(id) ? P.srcs[+id.slice(1) - 1] : null) || P.srcs.find(s => s.ten === id) || null; }
function agentTomTat() {
  let acc = 0;
  return {
    ten_du_an: $('#tenDuAn').value, tong_giay: +tongGiay().toFixed(2),
    footage: P.srcs.map((s, i) => ({ src_id: s.id, nhan: 'S' + (i + 1), ten: s.ten, loai: s.loai, giay: +(s.giay || 0).toFixed(2), kich_thuoc: s.w + 'x' + s.h, trang_thai: s.tt, loai_canh: s.loai_canh, mo_ta: s.mo_ta, so_cau: s.cau.length, so_canh: s.canh.length, khoanh_khac: s.khoanh_khac, hook_goi_y: s.hook_goi_y, co_mat: !!(s.mat && s.mat.length) })),
    v1: P.clips.map((c, i) => { const s = srcCua(c.src), o = { i, src_id: c.src, bd: c.bd, kt: c.kt, tl_bd: +acc.toFixed(2), dai: +daiC(c).toFixed(2), toc: tocC(c), props: propsC(c), chuyen: c.chuyen || 'cat', ly_do: c.ly_do, loi: s ? s.cau.filter(x => x.kt > c.bd + 0.1 && x.bd < c.kt - 0.1).map(x => x.text).join(' ').slice(0, 160) : '' }; acc += daiC(c); return o; }),
    v2_broll: P.broll.map(b => ({ id: b.id, src_id: b.src, bd: b.bd, kt: b.kt, t_bd: b.t_bd, kieu: b.kieu, lop: b.lop || 2, vua: b.vua || 'cover', ...propsC(b) })),
    a3_am_thanh: (P.am3 || []).map(m => ({ id: m.id, loai: m.loai, ten: m.ten, t_bd: m.t_bd, bd: m.bd, kt: m.kt, am_db: +dbTu(m.am == null ? 1 : m.am).toFixed(1), fi: m.fi || 0, fo: m.fo || 0 })),
    o1_do_hoa: P.gfx.map(g => ({ id: g.id, kieu: g.kieu, bd: g.bd, kt: g.kt, text: g.text, phu: g.phu, ...(g.kieu === 'chu' || g.kieu === 'sticker' ? { x: g.x, y: g.y, co: g.co, mau: g.mau, nen: g.nen, hu: g.hu, ...Object.fromEntries(['ra', 'lap', 'font', 'dam', 'nghieng', 'gach', 'can', 'vien_mau', 'vien_day', 'nen_mau', 'nen_bo', 'phat_sang', 'gianChu', 'dongCao'].filter(k => g[k] != null).map(k => [k, g[k]])) } : {}), ...(g.kfs ? { keyframe: g.kfs } : {}), ...(g.bam_loi ? { bam_loi: true, moc_tu: g.moc_tu } : {}), ...(g.canh ? { so_lop: g.canh.lop.length } : {}) })),
    moc: P.moc, ti_le: $('#tiLe').value, phong_cach: Object.keys({ ...PHONG_CACH, ...pcCuaToi() }), phien_ban: P.ban.map((b, i) => ({ i, ten: b.ten })), phien_ban_dang_mo: P.banDang,
    a2_long_tieng: P.tieng.map(t => ({ id: t.id, t_bd: t.t_bd, giay: t.giay, giong: t.giong, text: t.text })),
    nhac: P.nhac ? { ten: P.nhac.ten, beat: P.beat.length } : null,
    cai_dat: { hook: $('#hook').value, phu_de: { bat: $('#phuDe').checked, kieu: $('#pdKieu').value, cum: +$('#pdCum').value, nhan_manh: $('#pdNhan').value, mau: mauNhan(), vi_tri: P.pdY }, khung: $('#khungKieu').value, nen: { kieu: $('#nenKieu').value, mau: $('#nenMau').value }, font: $('#font').value, zoom_nhan: $('#zoomOn').checked, chuyen_mac_dinh: $('#chuyenMacDinh').value, do_phan_giai: $('#doPhanGiai').value, xuat: caiXuat(), nen_khung: $('#nenKhung').value, phu_de_nhap: P.pdNgoai ? P.pdNgoai.length + ' dòng' : null },
    may_chu: { broll_kho: !!MC.dich_vu.broll, long_tieng: !!MC.dich_vu.tts }
  };
}
function agentKiemI(i) { i = +i; if (!Number.isInteger(i) || i < 0 || i >= P.clips.length) throw new Error('Chỉ số đoạn i phải từ 0 đến ' + (P.clips.length - 1)); return i; }
async function agentXuLy(ten, a) {
  const xong = (text) => ({ text: text || agentTomTat() });
  switch (ten) {
    case 'xem_du_an': return xong();
    case 'xem_loi_thoai': { const ds = a.src_id ? [agentSrc(a.src_id)].filter(Boolean) : P.srcs; if (!ds.length) throw new Error('Không thấy footage ' + a.src_id); return { text: ds.map(s => ({ src_id: s.id, ten: s.ten, cau: s.cau.map(c => ({ bd: c.bd, kt: c.kt, text: c.text, loai: c.loai, tren_v1: cauTrongTl(s.id, c) })), tu: a.tu ? s.tu : undefined })) }; }
    case 'tim_footage': { const q = khongDau(String(a.q || '')); if (!q) throw new Error('Thiếu q'); const kq = []; P.srcs.forEach(s => { s.canh.forEach(c => { if (khongDau(c.mo_ta + ' ' + (c.tags || []).join(' ')).includes(q)) kq.push({ loai: 'canh', src_id: s.id, bd: c.bd, kt: c.kt, mo_ta: c.mo_ta, tags: c.tags }); }); s.cau.forEach(c => { if (khongDau(c.text).includes(q)) kq.push({ loai: 'cau', src_id: s.id, bd: c.bd, kt: c.kt, text: c.text, loai_cau: c.loai }); }); }); return { text: { q: a.q, ket_qua: kq } }; }
    case 'them_doan': { const s = agentSrc(a.src_id); if (!s) throw new Error('Không thấy footage ' + a.src_id); const bd = Math.max(0, +a.bd || 0), kt = Math.min(gioiHanNguon(s, 1e9), +a.kt); if (!(kt > bd + 0.1)) throw new Error('kt phải lớn hơn bd'); luuHoanTac(); const c = { src: s.id, bd, kt, ly_do: 'agent', chuyen: DV_CH(a.chuyen) }; const vt = a.vi_tri == null ? P.clips.length : Math.max(0, Math.min(P.clips.length, +a.vi_tri)); P.clips.splice(vt, 0, c); veTl(); veLoi(); veKhung(); return xong(); }
    case 'sua_doan': { const i = agentKiemI(a.i), c = P.clips[i], s = srcCua(c.src); luuHoanTac(); if (a.truot != null) { const len = c.kt - c.bd, nb = Math.max(0, Math.min((s ? s.giay : c.kt) - len, c.bd + +a.truot)); c.bd = nb; c.kt = nb + len; } if (a.bd != null) c.bd = Math.max(0, +a.bd); if (a.kt != null) c.kt = Math.min(s ? s.giay : +a.kt, +a.kt); if (!(c.kt > c.bd + 0.1)) throw new Error('kt phải lớn hơn bd'); if (a.chuyen != null) c.chuyen = DV_CH(a.chuyen); if (a.chuyen_dai != null) c.chuyen_dai = Math.max(0.2, Math.min(1.2, +a.chuyen_dai)); datPropsAgent(c, a); veTl(); veLoi(); veKhung(); return xong(); }
    case 'xoa_doan': { const i = agentKiemI(a.i); P.chon = { k: 'v', i }; lenh('xoa'); return xong(); }
    case 'tach_doan': { const tl = +a.tl; if (!(tl > 0)) throw new Error('tl phải > 0'); P.t = tl; const { clip } = viTri(tl); P.chon = { k: 'v', i: clip }; const n = P.clips.length; lenh('tach'); if (P.clips.length === n) throw new Error('Không tách được tại ' + tl + 's (cần cách mép đoạn ≥0,25s)'); return xong(); }
    case 'sap_xep_doan': { const tt = (a.thu_tu || []).map(Number); if (tt.length !== P.clips.length || [...tt].sort((x, y) => x - y).some((v, k) => v !== k)) throw new Error('thu_tu phải là hoán vị của 0..' + (P.clips.length - 1)); luuHoanTac(); P.clips = tt.map(k => P.clips[k]); veTl(); veLoi(); veKhung(); return xong(); }
    case 'bo_vap': { $('#btnBoVap').click(); return xong(); }
    case 'hit_beat': { if (!P.beat.length) throw new Error('Chưa có nhạc nền để lấy beat'); luuHoanTac(); hitBeat(); veTl(); return xong(); }
    case 'dat_broll': { const s = agentSrc(a.src_id); if (!s) throw new Error('Không thấy footage ' + a.src_id); luuHoanTac(); P.broll.push({ id: uid(), src: s.id, bd: Math.max(0, +a.bd || 0), kt: Math.min(s.giay || 1e9, +a.kt), t_bd: Math.max(0, +a.t_bd || 0), kieu: a.kieu === 'pip' ? 'pip' : 'full' }); veTl(); veKhung(); return xong(); }
    case 'xoa_broll': { const k = P.broll.findIndex(b => b.id === a.id); if (k < 0) throw new Error('Không thấy b-roll ' + a.id); luuHoanTac(); P.broll.splice(k, 1); veTl(); veKhung(); return xong(); }
    case 'them_do_hoa': { if (!GX[a.kieu]) throw new Error('kieu phải là một trong: ' + Object.keys(GX).join(', ')); luuHoanTac(); const g = { id: uid(), ...(GX_MD[a.kieu] || {}), kieu: a.kieu, bd: Math.max(0, +a.bd || 0), kt: +a.kt, text: String(a.text || ''), phu: a.phu != null ? String(a.phu) : ((GX_MD[a.kieu] || {}).phu || '') }; if (a.kieu === 'ai') { if (a.canh) g.canh = chuanCanh(a.canh); else if (a.mo_ta || a.text) { const kq = await taoDoHoaAI(a.mo_ta || a.text, g.bd, (+a.kt || g.bd + 3) - g.bd); g.canh = kq.canh; } if (!g.canh || !g.canh.lop.length) throw new Error('kieu ai cần canh {lop:[...]} hoặc mo_ta'); } if (a.bam_loi) g.bam_loi = true; ['x', 'y', 'co', 'w', 'h', 'xoay'].forEach(k => { if (a[k] != null) g[k] = +a[k]; }); ['mau', 'nen', 'hu'].forEach(k => { if (a[k] != null) g[k] = String(a[k]); }); if (a.hinh != null) { if (!HINH[a.hinh]) throw new Error('hinh phải là: ' + Object.keys(HINH).join(', ')); g.hinh = a.hinh; } if (!(g.kt > g.bd + 0.2)) g.kt = g.bd + (GX[a.kieu].dai || 2); if (a.dat_theo_loi && datDungLucNoi(g) == null) throw new Error('Không thấy "' + (mucCua(g)[0] || g.text) + '" trong lời trên dòng thời gian'); P.gfx.push(g); veTl(); veKhung(); return { text: { id: g.id, bd: g.bd, kt: g.kt, moc_tu: g.moc_tu, so_lop: g.canh ? g.canh.lop.length : undefined } }; }
    case 'sua_do_hoa': { const g = P.gfx.find(x => x.id === a.id); if (!g) throw new Error('Không thấy đồ hoạ ' + a.id); luuHoanTac(); ['bd', 'kt'].forEach(k => { if (a[k] != null) g[k] = Math.max(0, +a[k]); }); ['text', 'phu', 'mau', 'nen', 'hu'].forEach(k => { if (a[k] != null) g[k] = String(a[k]); }); ['x', 'y', 'co'].forEach(k => { if (a[k] != null) g[k] = +a[k]; }); if (a.lop != null) g.lop = Math.round(+a.lop); kieuChuAgent(g, a); if (a.canh) g.canh = chuanCanh(a.canh); if (a.bam_loi != null) g.bam_loi = !!a.bam_loi; if (a.dat_theo_loi) datDungLucNoi(g); veTl(); veKhung(); return xong(); }
    case 'xoa_do_hoa': { const k = P.gfx.findIndex(x => x.id === a.id); if (k < 0) throw new Error('Không thấy đồ hoạ ' + a.id); luuHoanTac(); P.gfx.splice(k, 1); veTl(); veKhung(); return xong(); }
    case 'cai_dat': {
      luuHoanTac(); const dat = (id, v) => { const x = $('#' + id); if (!x || v == null) return; if (x.type === 'checkbox') x.checked = !!v; else if ([...x.options || []].length && ![...x.options].some(o => o.value === String(v))) throw new Error(id + ' không nhận giá trị ' + v); else x.value = v; };
      if (a.ten_du_an != null) $('#tenDuAn').value = String(a.ten_du_an).slice(0, 80); if (a.hook != null) $('#hook').value = String(a.hook).slice(0, 80);
      const pd = a.phu_de || {}; dat('phuDe', pd.bat); dat('pdKieu', pd.kieu); if (pd.cum != null) $('#pdCum').value = Math.max(2, Math.min(6, +pd.cum)); if (pd.nhan_manh != null) $('#pdNhan').value = Array.isArray(pd.nhan_manh) ? pd.nhan_manh.join(', ') : String(pd.nhan_manh); if (pd.mau) { const TEN_MAU = { xanh: '#99DF00', vang: '#FFD400', cam: '#ff5a24', lam: '#4bc3ff', hong: '#ff4fa3' }; const hex = (TEN_MAU[String(pd.mau).toLowerCase()] || String(pd.mau)).toLowerCase(); const b = $$('#pdMau button').find(x => x.dataset.m.toLowerCase() === hex) || $$('#pdMau button')[Object.keys(TEN_MAU).indexOf(String(pd.mau).toLowerCase())]; if (!b) throw new Error('mau phải là: xanh, vang, cam, lam, hong'); $$('#pdMau button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); } if (pd.vi_tri != null) { P.pdY = Math.max(0.15, Math.min(0.92, +pd.vi_tri)); const o = [...$('#pdViTri').options].find(x => Math.abs(+x.value - P.pdY) < 0.03); if (o) $('#pdViTri').value = o.value; }
      dat('khungKieu', a.khung); if (a.nen) { dat('nenKieu', a.nen.kieu); if (a.nen.mau) $('#nenMau').value = a.nen.mau; $('#nenKieu').dispatchEvent(new Event('change')); }
      if (a.font != null) { dat('font', a.font); capNhatFont(); } dat('zoomOn', a.zoom_nhan); if (a.chuyen_mac_dinh != null) { dat('chuyenMacDinh', a.chuyen_mac_dinh); $('#chuyenMacDinh').dispatchEvent(new Event('change')); }
      if (a.ti_le != null) { if (!TI_LE[a.ti_le]) throw new Error('ti_le phải là: ' + Object.keys(TI_LE).join(', ')); datTiLe(a.ti_le, true); }
      if (a.phong_cach != null && !apPhongCach(a.phong_cach)) throw new Error('phong_cach phải là: ' + Object.keys({ ...PHONG_CACH, ...pcCuaToi() }).join(', '));
      docTuNhan(); veTl(); await veKhung(); return xong();
    }
    case 'hieu_footage': { const s = agentSrc(a.src_id); if (!s) throw new Error('Không thấy footage ' + a.src_id); if (s.loai !== 'video') throw new Error('Chỉ hiểu được video'); if (s.tt !== 'xong') { await hieu(s); } if (s.tt !== 'xong') return { isError: true, text: 'Chưa hiểu được: ' + (s.loi || s.tt) }; return { text: { src_id: s.id, loai_canh: s.loai_canh, mo_ta: s.mo_ta, so_cau: s.cau.length, so_canh: s.canh.length, canh: s.canh, khoanh_khac: s.khoanh_khac, hook_goi_y: s.hook_goi_y, nhan_manh: s.nhan_manh, cau: s.cau.map(c => ({ bd: c.bd, kt: c.kt, text: c.text, loai: c.loai })) } }; }
    case 'tro_ly_dung': { if (a.che_do) $('#cheDo').value = a.che_do === 'nhanh' ? 'nhanh' : 'ky'; const n = P.lichSu.length; await aiDung(String(a.yeu_cau || ''), true); const moi = P.lichSu.slice(n).filter(x => x.vai === 'ai').map(x => x.text).join('\n'); if (/^⚠️/.test(moi) || !moi) return { isError: true, text: moi || 'Trợ lý không trả lời (cần footage đã hiểu và còn lượt)' }; return { text: { tra_loi: moi, du_an: agentTomTat() } }; }
    case 'tim_broll_kho': { if (!MC.dich_vu.broll) throw new Error('Máy chủ chưa có kho B-roll (PIXABAY_KEY)'); const r = await fetch(MC.url + '/broll?q=' + encodeURIComponent(String(a.q || '')) + '&huong=' + (a.huong === 'ngang' ? 'ngang' : 'doc')); const j = await r.json(); if (!j.ok) throw new Error(j.error || 'kho lỗi'); AG.kho = j.items; AG.khoQ = String(a.q || ''); return { text: { tu_khoa: j.tu_khoa, items: j.items.map(it => ({ id: it.id, giay: it.giay, kich_thuoc: it.w + 'x' + it.h, tac_gia: it.tac_gia })) } }; }
    case 'them_broll_kho': { const it = AG.kho.find(x => x.id === a.id); if (!it) throw new Error('Gọi tim_broll_kho trước, rồi đưa id trong kết quả'); const nut = document.createElement('button'); nut.appendChild(document.createElement('span')); await themBroll(it, AG.khoQ || 'b-roll', nut); const s = P.srcs.find(z => z.ten === it.id + '.mp4'); if (!s) throw new Error('Không tải được video ' + it.id); return { text: { src_id: s.id, ten: s.ten, giay: s.giay } }; }
    case 'long_tieng': { if (!MC.dich_vu.tts) throw new Error('Máy chủ chưa có lồng tiếng (GEMINI_API_KEYS)'); $('#tiengText').value = String(a.text || ''); if (a.giong && TIENG_GIONG[a.giong]) $('#tiengGiong').value = a.giong; $('#tiengCach').value = String(a.cach || ''); if (a.t_bd != null) { P.t = Math.max(0, +a.t_bd); veKhung(); } const n = P.tieng.length; await taoTieng(); if (P.tieng.length === n) return { isError: true, text: $('#tiengTt').textContent }; const t = P.tieng[P.tieng.length - 1]; return { text: { id: t.id, t_bd: t.t_bd, giay: t.giay, giong: t.giong } }; }
    case 'xem_khung': { P.t = Math.max(0, Math.min(tongGiay(), +a.t || 0)); await veKhung(); vePh(); const d = cv.toDataURL('image/png'); return { text: 'Khung tại ' + fmt1(P.t) + 's / ' + fmt1(tongGiay()) + 's', image: { data: d.split(',')[1], mime: 'image/png' } }; }
    case 'xuat_phu_de': { const t = taoSrt(); if (!t.trim()) throw new Error('Chưa có lời thoại trên dòng thời gian'); return { text: t }; }
    case 'xuat_video': { if (!P.clips.length) throw new Error('Chưa có đoạn nào trên V1'); const chon = (id, v) => { if (v == null) return; v = String(v); if (![...$(id).options].some(o => o.value === v)) throw new Error(id.slice(1) + ' không hợp lệ: ' + v); $(id).value = v; }; chon('#doPhanGiai', a.do_phan_giai); chon('#xuatFps', a.fps); chon('#xuatDD', a.dinh_dang); chon('#xuatCL', a.chat_luong); $('#btnXuat').click(); const t0 = Date.now(); while (Date.now() - t0 < 900000) { await new Promise(z => setTimeout(z, 500)); if ($('#xuatXong').style.display !== 'none') return { text: 'Đã lưu ' + $('#xuatTai').download + ' vào thư mục Tải xuống của người dùng. ' + $('#xuatTieuDe').textContent }; if (P.huyXuat) return { isError: true, text: 'Người dùng đã huỷ xuất' }; if (!P.dang && Date.now() - t0 > 3000 && $('#xuatXong').style.display === 'none' && !$('#xuatHop').classList.contains('mo')) return { isError: true, text: 'Không xuất được: ' + $('#xuatTt').textContent }; } return { isError: true, text: 'Xuất quá lâu, xem lại trong tab' }; }
    case 'luu_du_an': { const o = duAnJson(); o.tieng = (o.tieng || []).map(t => ({ ...t, b64: undefined })); return { text: o }; }
    case 'hoan_tac': { hoanTac(); return xong(); }
    case 'tim_loi': { const t = timLoi(String(a.q || '')); return { text: { q: a.q, thoi_diem_tren_dong_thoi_gian: t, ghi_chu: t.length ? 'giây trên dòng thời gian, lấy làm bd cho đồ hoạ' : 'không thấy trong lời đang dùng trên V1' } }; }
    case 'cat_khoang_lang': { const ng = Math.max(0.2, Math.min(3, +a.nguong || 0.5)), bo = a.bo_dem !== false; for (const s of new Set(P.clips.map(c => srcCua(c.src)))) if (s && !(s.tu && s.tu.length)) await canNL(s); const r0 = tinhCatLang(ng, bo), r = catLang(ng, bo); return { text: { da_cat_giay: +r.bot.toFixed(2), so_cho_cat: r.so || 0, bo_tieng_dem: r.soDem, doan_do_theo_am_luong: r0.theoAm, tu_dem_can_nghe: r0.ngo.slice(0, 20).map(n => ({ giay_truoc_khi_cat: +n.t.toFixed(2), tu: n.w })), du_an: agentTomTat() } }; }
    case 'dong_bang': { const ok = await dongBang(+a.giay || 1.5, a.tl == null ? null : +a.tl); if (!ok) throw new Error('Không đóng băng được (cần đoạn video tại thời điểm đó)'); return xong(); }
    case 'them_moc': { themMoc(a.t == null ? P.t : +a.t, a.ten ? String(a.ten).slice(0, 40) : ''); return xong(); }
    case 'tao_shorts': { const n = await taoShorts(Math.max(1, Math.min(5, +a.so_luong || 3)), Math.max(15, Math.min(90, +a.do_dai || 40))); if (!n) throw new Error('Chưa tạo được short (cần footage đã hiểu và còn lượt)'); return { text: { phien_ban: P.ban.map((b, i) => ({ i, ten: b.ten })), dang_mo: P.banDang, du_an: agentTomTat() } }; }
    case 'mo_phien_ban': { const i = +a.i; if (!P.ban[i]) throw new Error('Không có phiên bản ' + a.i); moBan(i); return xong(); }
    case 'keyframe': { const { k, m } = agentMuc(a); const prop = String(a.prop || ''); if (!KF_TEN[prop] || (prop === 'am' && k !== 'v')) throw new Error('prop phải là sc|x|y|xoay|mo' + (k === 'v' ? '|am' : '')); const st = batDauMuc(k, m), off = +a.t - st; if (!(off >= -0.01 && off <= daiMuc(k, m) + 0.01)) throw new Error('t phải nằm trong mục: ' + fmt1(st) + '–' + fmt1(st + daiMuc(k, m)) + 's'); luuHoanTac(); const o = Math.max(0, Math.min(daiMuc(k, m), off)); if (a.xoa) xoaKf(m, prop, o); else { if (a.v == null) throw new Error('Thiếu v'); if (a.e && !EASE_KF[a.e]) throw new Error('e phải là: ' + Object.keys(EASE_KF).join('|')); datKf(m, prop, o, +a.v, a.e); } veTl(); veKhung(); return { text: { keyframe: (m.kfs && m.kfs[prop]) || [], du_an: agentTomTat() } }; }
    case 'sua_broll': { const b = P.broll.find(x => x.id === a.id); if (!b) throw new Error('Không thấy b-roll ' + a.id); luuHoanTac(); if (a.lop != null) b.lop = Math.round(+a.lop) || 2; if (a.vua != null) { if (!['cover', 'contain'].includes(a.vua)) throw new Error('vua phải là cover|contain'); b.vua = a.vua === 'contain' ? 'contain' : undefined; } if (a.kieu != null) b.kieu = a.kieu === 'pip' ? 'pip' : 'full'; const so = (kk, min, max) => { if (a[kk] != null) b[kk] = Math.max(min, Math.min(max, +a[kk])); }; so('sc', 0.05, 5); so('x', -1, 1); so('y', -1, 1); so('xoay', -180, 180); so('mo', 0, 1); so('t_bd', 0, 1e5); so('bd', 0, 1e5); so('kt', 0.1, 1e5); if (a.toc != null) b.toc = Math.max(0.25, Math.min(3, +a.toc)); so('sang', -50, 50); so('tuong_phan', -50, 50); so('bao_hoa', -100, 100); if (a.loc != null) { if (!LOC[a.loc]) throw new Error('loc phải là: ' + Object.keys(LOC).join(', ')); b.loc = a.loc; } mauAgent(b, a); veTl(); veKhung(); return xong(); }
    case 'ap_tat_ca': { if (!P.clips.length) throw new Error('Chưa có đoạn nào'); if (a.loc != null && !LOC[a.loc]) throw new Error('loc phải là: ' + Object.keys(LOC).join(', ')); if (a.hieu_ung != null && !HIEU_UNG[a.hieu_ung]) throw new Error('hieu_ung phải là: ' + Object.keys(HIEU_UNG).join('|')); if (a.chuyen != null && !CHUYEN_TEN[a.chuyen]) throw new Error('chuyen phải là: ' + Object.keys(CHUYEN_TEN).join('|')); luuHoanTac(); P.clips.forEach((c, i) => { if (a.loc != null) c.loc = a.loc; if (a.loc_muc != null) c.locMuc = Math.max(0, Math.min(1, +a.loc_muc)); if (a.hieu_ung != null) c.hu2 = a.hieu_ung; if (a.chuyen != null && i < P.clips.length - 1) { c.chuyen = a.chuyen; if (a.chuyen_dai != null) c.chuyen_dai = Math.max(0.2, Math.min(1.2, +a.chuyen_dai)); } }); if (a.chuyen && a.chuyen !== 'cat') await gltNap(); veTl(); await veKhung(); return xong(); }
    case 'cat_dau_phat': { const tl = +a.tl; if (!(tl > 0 && tl < tongGiay())) throw new Error('tl phải trong 0–' + fmt1(tongGiay())); P.t = tl; P.chon = null; if (!catDauPhat(a.phia === 'truoc')) throw new Error('tl phải nằm giữa một đoạn (cách mép > 0,04s)'); return xong(); }
    case 'nhan_doi': { const { k, m } = agentMuc(a); const ds = { v: P.clips, b: P.broll, g: P.gfx, a: P.am3 }[k]; P.chon = { k, i: ds.indexOf(m) }; P.t = a.t != null ? Math.max(0, +a.t) : batDauMuc(k, m) + daiMuc(k, m); saoChep(); dan(); const moi = mucChon(); return { text: { id_moi: moi && moi.id, du_an: agentTomTat() } }; }
    case 'mau_chu': { const q = khongDau(String(a.mau || '')), i = MAU_CHU.findIndex(([ten]) => khongDau(ten) === q || khongDau(ten).includes(q)); if (i < 0) throw new Error('mau phải là: ' + MAU_CHU.map(x => x[0]).join('|')); if (a.bd != null) P.t = Math.max(0, +a.bd); themMauChu(i); const g = P.gfx[P.gfx.length - 1]; if (a.text) g.text = String(a.text).slice(0, 120); veTl(); veKhung(); return { text: { id: g.id, du_an: agentTomTat() } }; }
    case 'phu_de_mau': { const q = khongDau(String(a.ten || '')), i = MAU_PD.findIndex(([ten]) => khongDau(ten) === q || khongDau(ten).includes(q)); if (i < 0) throw new Error('ten phải là: ' + MAU_PD.map(x => x[0]).join('|')); apMauPD(i); return xong(); }
    case 'nhap_srt': { luuHoanTac(); if (a.bo) { P.pdNgoai = null; $('#srtTt').textContent = ''; $('#btnBoSrt').hidden = true; } else { const ds = docSrt(String(a.srt || '')); if (!ds.length) throw new Error('Không đọc được SRT (cần dạng 00:00:01,000 --> 00:00:02,500)'); P.pdNgoai = ds; $('#phuDe').checked = true; $('#srtTt').textContent = ds.length + ' dòng từ trợ lý'; $('#btnBoSrt').hidden = false; } cumKey = ''; veTl(); await veKhung(); return xong(); }
    case 'nen_khung': { if (![...$('#nenKhung').options].some(o => o.value === a.kieu)) throw new Error('kieu phải là: ' + [...$('#nenKhung').options].map(o => o.value).join('|')); $('#nenKhung').value = a.kieu; if (a.mau) $('#nenKhungMau').value = String(a.mau); $('#nenKhung').dispatchEvent(new Event('change')); await veKhung(); return xong(); }
    case 'them_am_thanh': { if (!SFX[a.loai]) throw new Error('loai phải là: ' + Object.keys(SFX).join('|')); if (a.t != null) P.t = Math.max(0, +a.t); const m = await themAm3('sfx:' + a.loai, SFX[a.loai][0].replace(/^\S+\s/, ''), 'sfx'); if (!m) throw new Error('Không tạo được âm thanh'); return { text: { id: m.id, t_bd: m.t_bd, giay: m.kt, du_an: agentTomTat() } }; }
    case 'sua_am_thanh': { const k = (P.am3 || []).findIndex(x => x.id === a.id); if (k < 0) throw new Error('Không thấy âm thanh A3 ' + a.id); const m = P.am3[k]; luuHoanTac(); if (a.xoa) { P.am3.splice(k, 1); P.chon = null; } else { if (a.t_bd != null) m.t_bd = Math.max(0, +a.t_bd); if (a.bd != null) m.bd = Math.max(0, Math.min(m.kt - 0.05, +a.bd)); if (a.kt != null) m.kt = Math.max(m.bd + 0.05, Math.min(m.giay || 1e9, +a.kt)); if (a.am_db != null) { const v = Math.max(-30, Math.min(12, +a.am_db)); m.am = v <= -30 ? 0 : +Math.pow(10, v / 20).toFixed(4); } if (a.fi != null) m.fi = Math.max(0, Math.min(3, +a.fi)); if (a.fo != null) m.fo = Math.max(0, Math.min(3, +a.fo)); } veTl(); veProp(); return xong(); }
    case 'tach_am_thanh': { const m = await tachAmClip(agentKiemI(a.i)); if (!m) throw new Error($('#am3Tt').textContent || 'Không tách được'); return { text: { id: m.id, du_an: agentTomTat() } }; }
    case 'chuan_hoa_am': { await chuanHoaTatCa(); return { text: { ket_qua: $('#am3Tt').textContent, du_an: agentTomTat() } }; }
    default: throw new Error('Tab không biết lệnh ' + ten);
  }
}
function agentMuc(a) { const k = String(a.muc || ''); if (k === 'v') return { k, m: P.clips[agentKiemI(a.i)] }; const ds = { b: P.broll, g: P.gfx, a: P.am3 }[k]; if (!ds) throw new Error('muc phải là v|b|g|a'); const m = ds.find(x => x.id === a.id); if (!m) throw new Error('Không thấy ' + { b: 'b-roll', g: 'đồ hoạ', a: 'âm thanh A3' }[k] + ' ' + a.id); return { k, m }; }
function mauAgent(c, a) {
  const so = (k, min, max, ten) => { if (a[k] != null) c[ten || k] = Math.max(min, Math.min(max, +a[k])); };
  ['phoi', 'nhiet', 'tint', 'sang_cao', 'toi'].forEach(k => so(k, -100, 100)); so('vignette', 0, 100); so('hat', 0, 100); so('loc_muc', 0, 1, 'locMuc');
  if (a.hieu_ung != null) { if (!HIEU_UNG[a.hieu_ung]) throw new Error('hieu_ung phải là: ' + Object.keys(HIEU_UNG).join('|')); c.hu2 = a.hieu_ung; }
  if (a.lat_x != null) c.latX = !!a.lat_x; if (a.lat_y != null) c.latY = !!a.lat_y;
  [['an_vao', 'anVao'], ['an_ra', 'anRa']].forEach(([k, ten]) => { if (a[k] == null) return; const o = typeof a[k] === 'string' ? { id: a[k] } : a[k]; if (!AN[o.id]) throw new Error(k + '.id phải là: ' + Object.keys(AN).join('|')); c[ten] = { id: o.id, d: Math.max(0.1, Math.min(3, +o.d || 0.5)) }; });
}
function kieuChuAgent(g, a) {
  if (a.font != null) { if (!FONT_CSS[a.font]) throw new Error('font phải là: ' + Object.keys(FONT_CSS).join('|')); g.font = a.font; }
  ['ra', 'lap', 'can', 'vien_mau', 'nen_mau', 'phat_sang'].forEach(k => { if (a[k] != null) g[k] = String(a[k]); });
  ['nghieng', 'gach'].forEach(k => { if (a[k] != null) g[k] = !!a[k]; });
  const so = (k, min, max, ten) => { if (a[k] != null) g[ten || k] = Math.max(min, Math.min(max, +a[k])); };
  so('dam', 300, 900); so('vien_day', 0, 0.4); so('nen_bo', 0, 1); so('gian_chu', -0.05, 0.4, 'gianChu'); so('dong_cao', 0.8, 2, 'dongCao');
}
function DV_CH(v) { return v && CHUYEN_TEN[v] ? v : 'cat'; }
function datPropsAgent(c, a) {
  const so = (k, min, max) => { if (a[k] != null) c[k] = Math.max(min, Math.min(max, +a[k])); };
  let acc = 0; for (const k of P.clips) { if (k === c) break; acc += daiC(k); } const cu = daiC(c);
  so('sc', 0.3, 3); so('x', -0.6, 0.6); so('y', -0.6, 0.6); so('xoay', -180, 180); so('mo', 0, 1); so('am', 0, 2); so('fi', 0, 3); so('fo', 0, 3); so('sang', -50, 50); so('tuong_phan', -50, 50); so('bao_hoa', -100, 100);
  if (a.toc != null) { const v = +a.toc; if (!(v >= 0.1 && v <= 100)) throw new Error('toc phải trong 0.1–100'); delete c.cong; c.toc = v; }
  if (a.dao != null) { if (a.dao) c.dao = true; else delete c.dao; } if (a.giu_cao_do != null) { if (a.giu_cao_do) delete c.doiCao; else c.doiCao = true; }
  so('trang', -100, 100); so('den', -100, 100); so('hue', -180, 180); so('vib', -100, 100); so('phai', 0, 100); so('net', 0, 100); so('ro', -100, 100);
  if (a.mat_na != null) { const m = a.mat_na; if (!m || m.kieu === 'khong') delete c.mn; else { if (!MAT_NA[m.kieu]) throw new Error('mat_na.kieu phải là: ' + Object.keys(MAT_NA).join(', ')); c.mn = { x: 0, y: 0, w: 0.6, h: 0.6, xoay: 0, mem: 0.1, bo: 0.2, dao: false, ...c.mn, ...m }; } }
  if (a.loc != null) { if (!LOC[a.loc]) throw new Error('loc phải là: ' + Object.keys(LOC).join(', ')); c.loc = a.loc; }
  if (a.kf != null) c.kf = !!a.kf; so('sc2', 0.3, 3); so('x2', -0.6, 0.6); so('y2', -0.6, 0.6); mauAgent(c, a);
  if (a.duong_cong_toc != null) { const v = a.duong_cong_toc; if (v === 'khong') delete c.cong; else if (CONG_MAU[v]) c.cong = CONG_MAU[v][1].slice(); else if (Array.isArray(v) && v.length === 5) c.cong = v.map(x => Math.max(0.1, Math.min(10, +x))); else throw new Error('duong_cong_toc phải là: khong|' + Object.keys(CONG_MAU).join('|') + ' hoặc mảng 5 tốc độ'); }
  if (daiC(c) !== cu) ripple(acc + cu, daiC(c) - cu);
}

/* ═════════ máy chủ phụ Cloudflare (mentor cài, bot /maychu): kho B-roll Pixabay/Pexels + lồng tiếng AI ═════════ */
let MC = { url: '', dich_vu: {} };
async function mayChuKhoiDong() { try { MC = await TK.mayChu(); } catch { } $('#kho').hidden = !(MC.url && MC.dich_vu.broll); $('#tiengHop').hidden = !(MC.url && MC.dich_vu.tts);  $('#aiChon').hidden = !(MC.url && MC.dich_vu.agent); }
mayChuKhoiDong();
async function khoTim() {
  const q = $('#khoQ').value.trim(); if (!q) { $('#khoQ').focus(); return; }
  $('#khoTt').textContent = 'Đang tìm “' + q + '”…'; $('#khoKq').innerHTML = '';
  try {
    const j = await timKho(q, false, $('#khoHuong').value);
    if (!j.ok) { $('#khoTt').textContent = j.error === 'chua_co_kho' || j.error === 'chua_co_pexels' ? 'Máy chủ chưa có key kho video (PIXABAY_KEY, mentor thêm ở Cloudflare).' : 'Kho chưa trả lời, thử lại.'; return; }
    if (!j.items.length) { $('#khoTt').textContent = j.loi && j.loi.length ? 'Kho báo lỗi: ' + j.loi.join(' · ') + ' — thử lại sau một lát.' : 'Không có video hợp “' + q + '”, thử từ khác ngắn hơn.'; return; }
    j.items.forEach(it => { const b = el('button'); b.type = 'button'; b.title = 'Thêm vào footage · ' + it.tac_gia + ' · ' + fmt1(it.giay) + 's'; const im = el('img'); im.src = it.thumb; im.alt = ''; im.loading = 'lazy'; b.appendChild(im); b.appendChild(el('span', null, fmt1(it.giay) + 's · ' + it.tac_gia)); b.onclick = () => themBroll(it, q, b); $('#khoKq').appendChild(b); });
    $('#khoTt').textContent = j.items.length + ' video' + (j.tu_khoa && j.tu_khoa !== q ? ' · tìm bằng “' + j.tu_khoa + '”' : '') + ' · ' + (j.nguon || 'kho miễn phí') + (j.truc_tiep ? ' · gọi thẳng' : '') + '. Bấm để thêm vào footage, rồi kéo cảnh vào V2.';
  } catch (e) { $('#khoTt').textContent = 'Không gọi được máy chủ B-roll.'; }
}
async function themBroll(it, q, nut) {
  if (P.srcs.some(s => s.ten === it.id + '.mp4')) { toast('Video này đã có trong footage'); return; }
  const cu = nut.querySelector('span').textContent; nut.querySelector('span').textContent = 'Đang tải…'; nut.disabled = true;
  try {
    const r = await fetch(MC.url + it.url); if (!r.ok) throw new Error('http ' + r.status);
    const blob = await r.blob(); const f = new File([blob], it.id + '.mp4', { type: 'video/mp4' });
    await themFile([f]);
    const s = P.srcs.find(z => z.ten === f.name); if (!s) throw new Error('khong_them_duoc');
    Object.assign(s, { loai_canh: 'broll', mo_ta: 'B-roll kho: ' + q + ' (' + it.tac_gia + ')', tt: 'xong', canh: [{ bd: 0, kt: s.giay || it.giay, mo_ta: q, tags: ['broll', 'kho'] }], cau: [], tu: [], khoanh_khac: [] });
    s.thumbs[0] = s.thumb; veSrcs(); veLoi(); toast('Đã thêm B-roll từ kho. Kéo cảnh vào V2 (che nhỏ góc hoặc toàn khung), hoặc bấm ＋ V1.');
    nut.querySelector('span').textContent = '✓ Đã thêm';
  } catch (e) { console.error('[kho]', e); toast('Không tải được video này, chọn video khác.'); nut.querySelector('span').textContent = cu; nut.disabled = false; }
}
$('#khoTim').onclick = khoTim; $('#khoQ').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); khoTim(); } });
async function taoTieng() {
  let text = $('#tiengText').value.trim();
  if (!text) { const { clip, tSrc } = viTri(P.t); const s0 = clip >= 0 ? srcCua(P.clips[clip].src) : null; const c0 = s0 && s0.cau.find(x => tSrc >= x.bd && tSrc <= x.kt); text = (c0 && c0.text) || $('#hook').value.trim(); }
  if (!text) { toast('Gõ lời cần đọc trước'); $('#tiengText').focus(); return; }
  if (!TK.token()) { TK.canCo && TK.canCo(); return; }
  const nut = $('#btnTieng'), cu = nut.textContent; nut.disabled = true; nut.textContent = 'Đang tạo giọng…'; $('#tiengTt').textContent = 'AI đang đọc ' + text.length + ' ký tự…';
  try {
    const r = await fetch(MC.url + '/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: TK.token(), text: text.slice(0, 1200), giong: $('#tiengGiong').value, cach: $('#tiengCach').value.trim() }) });
    if (!r.ok) { let j = {}; try { j = await r.json(); } catch { } const ma = j.error || ('http_' + r.status); if (ma === 'het_luot_thu') { TK.moHet('dung'); $('#tiengTt').textContent = 'Hết lượt Dựng video miễn phí.'; } else if (ma === 'het_phien') { $('#tiengTt').textContent = 'Phiên hết hạn, đăng nhập lại.'; TK.canCo && TK.canCo(); } else $('#tiengTt').textContent = ma === 'ban_qua' ? TK.cauQuaTai(j) : 'Chưa tạo được giọng (' + ma + '), thử lại.'; return; }
    const buf = await r.arrayBuffer(); const blob = new Blob([buf], { type: 'audio/wav' });
    let giay = +r.headers.get('x-giay') || 0; if (!giay) { try { const ab = await giaiMaAm(blob); giay = ab.duration; } catch { giay = Math.max(1, text.length / 14); } }
    let b64 = ''; { const u8 = new Uint8Array(buf); let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); b64 = btoa(bin); }
    luuHoanTac(); const t = { id: uid(), text, giong: $('#tiengGiong').value, cach: $('#tiengCach').value.trim(), giay: +giay.toFixed(2), t_bd: +P.t.toFixed(2), url: URL.createObjectURL(blob), b64 };
    P.tieng.push(t); TIENG_KHO[t.id] = { b64, url: t.url }; P.chon = { k: 't', i: P.tieng.length - 1 }; veTl(); veProp();
    const con = r.headers.get('x-luot-con'); $('#tiengTt').textContent = '✓ Đã đặt ' + fmt1(giay) + 's lồng tiếng tại ' + fmt1(t.t_bd) + 's trên A2.' + (con ? ' Còn ' + con + ' lượt Dựng video.' : '');
    if (!MC.dich_vu.kiem_luot) $('#tiengTt').textContent += ' Máy chủ chưa nối Apps Script.';
    TK.luotCon && TK.luotCon();
  } catch (e) { console.error('[tts]', e); $('#tiengTt').textContent = 'Không gọi được máy chủ lồng tiếng.'; }
  finally { nut.disabled = false; nut.textContent = cu; }
}
$('#btnTieng').onclick = taoTieng;
/* ═════════ ĐẶC TẢ CAPCUT 9.1 · ĐỢT 1: dự án tự lưu, mặt nạ, blend, LUT, vùng an toàn, In/Out, J/K/L, xuất GIF/PNG ═════════ */
/* ── 1.1 Quản lý dự án: tự lưu vào IndexedDB, footage giữ trong OPFS của trình duyệt, thùng rác 30 ngày ── */
const DB_TEN = 'viral_dung_video', KHO_DA = 'du_an', KHO_LUT = 'lut';
function moDB() { return new Promise((ok, loi) => { const r = indexedDB.open(DB_TEN, 2); r.onupgradeneeded = () => { const db = r.result; ['du_an', 'lut', 'font', 'am'].forEach(k => { if (!db.objectStoreNames.contains(k)) db.createObjectStore(k, { keyPath: 'id' }); }); }; r.onsuccess = () => ok(r.result); r.onerror = () => loi(r.error); }); }
async function dbLam(kho, kieu, f) { const db = await moDB(); return new Promise((ok, loi) => { const tx = db.transaction(kho, kieu), st = tx.objectStore(kho), r = f(st); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => loi(tx.error); }); }
const dbLay = (kho, id) => dbLam(kho, 'readonly', st => st.get(id)), dbTatCa = kho => dbLam(kho, 'readonly', st => st.getAll()), dbGhi = (kho, o) => dbLam(kho, 'readwrite', st => st.put(o)), dbXoa = (kho, id) => dbLam(kho, 'readwrite', st => st.delete(id));
const tenOpfs = f => (f.size + '_' + f.name).replace(/[^\w.\-]+/g, '_').slice(0, 180);
async function opfsThu() { try { return await (await navigator.storage.getDirectory()).getDirectoryHandle('footage', { create: true }); } catch { return null; } }
async function opfsGhi(f) { try { const d = await opfsThu(); if (!d) return false; const ten = tenOpfs(f); try { const h0 = await d.getFileHandle(ten); const f0 = await h0.getFile(); if (f0.size === f.size) return true; } catch { } const h = await d.getFileHandle(ten, { create: true }), w = await h.createWritable(); await w.write(f); await w.close(); return true; } catch (e) { console.warn('opfs', e); return false; } }
async function opfsDoc(ten, size) { try { const d = await opfsThu(); const h = await d.getFileHandle(tenOpfs({ name: ten, size })); const f = await h.getFile(); return new File([f], ten, { type: f.type || (/\.(png|jpe?g|webp|gif)$/i.test(ten) ? 'image/' + ten.split('.').pop().replace('jpg', 'jpeg') : 'video/mp4') }); } catch { return null; } }
function anhBia() { try { const c = document.createElement('canvas'); c.width = 180; c.height = 320; const g = c.getContext('2d'); const k = Math.max(180 / cv.width, 320 / cv.height); g.fillStyle = '#000'; g.fillRect(0, 0, 180, 320); g.drawImage(cv, 90 - cv.width * k / 2, 160 - cv.height * k / 2, cv.width * k, cv.height * k); return c.toDataURL('image/jpeg', 0.7); } catch { return ''; } }
let luuDangCho = null, luuKhoa = '';
async function tuLuu(ngay) {
  if (!window.indexedDB || (!P.clips.length && !P.srcs.length)) return;
  const j = duAnJson(), khoa = JSON.stringify([j.clips, j.gfx, j.broll, j.am3, j.ten, j.moc, j.cai, P.srcs.length]); if (!ngay && khoa === luuKhoa) return;
  P.duAnId = P.duAnId || 'da_' + uid(); const cu = await dbLay(KHO_DA, P.duAnId).catch(() => null);
  const rec = { id: P.duAnId, ten: j.ten || 'Video mới', tao: (cu && cu.tao) || Date.now(), sua: Date.now(), xoa: null, bia: P.bia || anhBia() || (cu && cu.bia) || '', biaTay: P.bia || '', giay: +tongGiay().toFixed(2), dungLuong: P.srcs.reduce((s, x) => s + (x.file ? x.file.size : 0), 0), media: P.srcs.filter(s => s.file).map(s => ({ ten: s.ten, size: s.file.size })), json: j };
  try { await dbGhi(KHO_DA, rec); luuKhoa = khoa; const tt = $('#luuTt'); if (tt) tt.textContent = '✓ Tự lưu ' + new Date().toTimeString().slice(0, 8); } catch (e) { console.warn('tự lưu', e); }
}
function henLuu() { clearTimeout(luuDangCho); luuDangCho = setTimeout(() => tuLuu(), 1500); }
async function moDuAnTuKho(id) {
  const rec = await dbLay(KHO_DA, id); if (!rec) { toast('Không thấy dự án'); return; }
  P.duAnId = rec.id; P.duAnCho = rec.json; P.bia = rec.biaTay || ''; $('#tenDuAn').value = rec.ten; const thieu = [], files = [];
  for (const m of rec.media || []) { const f = await opfsDoc(m.ten, m.size); if (f) files.push(f); else thieu.push(m.ten); }
  const o = rec.json; Object.keys(o.cai || {}).forEach(k => { const x = $('#' + k); if (!x) return; if (x.type === 'checkbox') x.checked = !!o.cai[k]; else x.value = o.cai[k]; });
  if (files.length) await themFile(files); else nhanDuAn();
  toast(thieu.length ? 'Đã mở “' + rec.ten + '” · thiếu ' + thieu.length + ' file (' + thieu.slice(0, 2).join(', ') + '), bấm Thêm footage để gắn lại' : 'Đã mở dự án “' + rec.ten + '”');
}
async function dsDuAn() { const all = await dbTatCa(KHO_DA).catch(() => []); const now = Date.now(); for (const r of all) if (r.xoa && now - r.xoa > 30 * 864e5) { await dbXoa(KHO_DA, r.id); r.boQua = true; } return all.filter(r => !r.boQua); }
async function veQuanLy(tab) {
  const hop = $('#qlHop'); hop.classList.add('mo'); tab = tab || hop.dataset.tab || 'ds'; hop.dataset.tab = tab;
  const q = ($('#qlTim').value || '').toLowerCase(), xep = $('#qlXep').value, all = await dsDuAn(), ds = all.filter(r => (tab === 'rac' ? r.xoa : !r.xoa) && (!q || r.ten.toLowerCase().includes(q)));
  ds.sort((a, b) => xep === 'ten' ? a.ten.localeCompare(b.ten) : xep === 'dl' ? b.dungLuong - a.dungLuong : b.sua - a.sua);
  $$('#qlHop .qlTab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const box = $('#qlDs'); box.innerHTML = ''; if (!ds.length) box.appendChild(el('div', 'quota', tab === 'rac' ? 'Thùng rác trống. Dự án xoá được giữ 30 ngày.' : 'Chưa có dự án nào. Thêm footage là trình dựng tự lưu.'));
  ds.forEach(r => { const d = el('div', 'qlThe' + (r.id === P.duAnId ? ' dang' : '')); d.dataset.id = r.id; const im = el('div', 'qlBia'); if (r.bia) im.style.backgroundImage = 'url(' + r.bia + ')'; im.appendChild(el('span', null, fmt(r.giay || 0))); d.appendChild(im);
    d.appendChild(el('b', null, r.ten)); d.appendChild(el('small', null, tab === 'rac' ? 'Còn ' + Math.max(0, 30 - Math.floor((Date.now() - r.xoa) / 864e5)) + ' ngày trong thùng rác' : new Date(r.sua).toLocaleString('vi-VN') + ' · ' + (r.dungLuong / 1048576).toFixed(1).replace('.', ',') + ' MB'));
    const row = el('div', 'row'), nut = (t, f, lop) => { const b = el('button', 'btn nho ' + (lop || ''), t); b.type = 'button'; b.onclick = e => { e.stopPropagation(); f(); }; row.appendChild(b); };
    if (tab === 'rac') { nut('Khôi phục', async () => { r.xoa = null; await dbGhi(KHO_DA, r); veQuanLy(); }); nut('Xoá vĩnh viễn', async () => { if (!confirm('Xoá vĩnh viễn “' + r.ten + '”?')) return; await dbXoa(KHO_DA, r.id); veQuanLy(); }, 'ghost'); }
    else { nut('Mở', () => moDuAn(r.id), 'xanh'); nut('Đổi tên', async () => { const t = prompt('Tên dự án', r.ten); if (!t) return; r.ten = t.slice(0, 80); r.json.ten = r.ten; await dbGhi(KHO_DA, r); if (r.id === P.duAnId) $('#tenDuAn').value = r.ten; veQuanLy(); }); nut('Nhân bản', async () => { const n = JSON.parse(JSON.stringify(r)); n.id = 'da_' + uid(); n.ten = r.ten + ' (bản sao)'; n.json.ten = n.ten; n.tao = n.sua = Date.now(); await dbGhi(KHO_DA, n); veQuanLy(); }); nut('🗑', async () => { r.xoa = Date.now(); await dbGhi(KHO_DA, r); veQuanLy(); }, 'ghost'); }
    d.appendChild(row); if (tab !== 'rac') d.ondblclick = () => moDuAn(r.id); box.appendChild(d); });
}
async function moDuAn(id) { if (id === P.duAnId) { $('#qlHop').classList.remove('mo'); return; } await tuLuu(true); location.href = location.pathname + '?duan=' + encodeURIComponent(id); }
async function duAnMoi() { await tuLuu(true); location.href = location.pathname + '?moi=1'; }
/* gói dự án .zip (kèm footage) để chuyển máy: zip không nén */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function taoZip(tep) { const enc = new TextEncoder(), phan = [], tt = []; let off = 0; for (const [ten, blob] of tep) { const u8 = new Uint8Array(await blob.arrayBuffer()), tn = enc.encode(ten), crc = crc32(u8), h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true); h.setUint32(18, u8.length, true); h.setUint32(22, u8.length, true); h.setUint16(26, tn.length, true); phan.push(h.buffer, tn, u8); tt.push({ tn, crc, n: u8.length, off }); off += 30 + tn.length + u8.length; }
  let cd = 0; const dau = off; tt.forEach(x => { const h = new DataView(new ArrayBuffer(46)); h.setUint32(0, 0x02014b50, true); h.setUint16(4, 20, true); h.setUint16(6, 20, true); h.setUint16(8, 0x0800, true); h.setUint32(16, x.crc, true); h.setUint32(20, x.n, true); h.setUint32(24, x.n, true); h.setUint16(28, x.tn.length, true); h.setUint32(42, x.off, true); phan.push(h.buffer, x.tn); cd += 46 + x.tn.length; });
  const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, tt.length, true); e.setUint16(10, tt.length, true); e.setUint32(12, cd, true); e.setUint32(16, dau, true); phan.push(e.buffer); return new Blob(phan, { type: 'application/zip' }); }
async function docZip(blob) { const u8 = new Uint8Array(await blob.arrayBuffer()), dv = new DataView(u8.buffer), dec = new TextDecoder(), ra = []; let p = 0; while (p + 30 <= u8.length && dv.getUint32(p, true) === 0x04034b50) { const nen = dv.getUint16(p + 8, true), n = dv.getUint32(p + 18, true), tl = dv.getUint16(p + 26, true), xl = dv.getUint16(p + 28, true), ten = dec.decode(u8.subarray(p + 30, p + 30 + tl)); if (nen !== 0) throw new Error('chỉ đọc được gói tạo từ trình dựng này'); ra.push([ten, new Blob([u8.subarray(p + 30 + tl + xl, p + 30 + tl + xl + n)])]); p += 30 + tl + xl + n; } return ra; }
async function xuatGoi() { const tep = [['du_an.json', new Blob([JSON.stringify(duAnJson())], { type: 'application/json' })]]; P.srcs.forEach(s => { if (s.file) tep.push(['footage/' + s.ten, s.file]); }); toast('Đang đóng gói ' + (tep.length - 1) + ' file…'); const z = await taoZip(tep), a = document.createElement('a'); a.href = URL.createObjectURL(z); a.download = tenSlug('du-an') + '.vsproj.zip'; document.body.appendChild(a); a.click(); a.remove(); toast('Đã xuất gói dự án (' + (z.size / 1048576).toFixed(1).replace('.', ',') + ' MB) · mở trên máy khác bằng Nhập gói'); }
async function nhapGoi(f) { try { const ds = await docZip(f), j = ds.find(x => x[0] === 'du_an.json'); if (!j) throw new Error('gói thiếu du_an.json'); const o = JSON.parse(await j[1].text()); const files = ds.filter(x => x[0].startsWith('footage/')).map(([ten, b]) => new File([b], ten.slice(8), { type: /\.(png|jpe?g|webp|gif)$/i.test(ten) ? 'image/' + ten.split('.').pop().replace('jpg', 'jpeg') : 'video/mp4' })); P.duAnId = 'da_' + uid(); P.duAnCho = o; $('#tenDuAn').value = o.ten || 'Video mới'; Object.keys(o.cai || {}).forEach(k => { const x = $('#' + k); if (!x) return; if (x.type === 'checkbox') x.checked = !!o.cai[k]; else x.value = o.cai[k]; }); $('#qlHop').classList.remove('mo'); await themFile(files); toast('Đã nhập gói “' + (o.ten || '') + '” với ' + files.length + ' file'); } catch (e) { toast('Không mở được gói: ' + (e.message || e)); } }
/* ── 2.5 Mặt nạ (Linear, Mirror, Circle, Rectangle, Heart, Star) · 2.3 Blend mode ── */
const MAT_NA = { khong: 'Không', tuyen: 'Đường thẳng', guong: 'Gương', tron: 'Tròn', chu_nhat: 'Chữ nhật', tim: 'Trái tim', sao: 'Ngôi sao' };
const BLEND = { normal: ['Bình thường', 'source-over'], darken: ['Làm tối', 'darken'], multiply: ['Nhân (Multiply)', 'multiply'], color_burn: ['Color burn', 'color-burn'], lighten: ['Làm sáng', 'lighten'], screen: ['Screen', 'screen'], color_dodge: ['Color dodge', 'color-dodge'], overlay: ['Overlay', 'overlay'], soft_light: ['Soft light', 'soft-light'], hard_light: ['Hard light', 'hard-light'], difference: ['Difference', 'difference'], exclusion: ['Exclusion', 'exclusion'], hue: ['Hue', 'hue'], saturation: ['Saturation', 'saturation'], color: ['Color', 'color'], luminosity: ['Luminosity', 'luminosity'] };
const lopCvs = [document.createElement('canvas'), document.createElement('canvas')];
function veHinhMatNa(g, W, H, mn) {
  const cx = W / 2 + (mn.x || 0) * W / 2, cy = H / 2 + (mn.y || 0) * H / 2, w = (mn.w == null ? 0.6 : mn.w) * W, h = (mn.h == null ? 0.6 : mn.h) * H, R = Math.max(W, H) * 3;
  g.save(); g.translate(cx, cy); g.rotate((mn.xoay || 0) * Math.PI / 180); g.beginPath();
  if (mn.kieu === 'tuyen') g.rect(-R, 0, 2 * R, R);
  else if (mn.kieu === 'guong') g.rect(-R, -h / 2, 2 * R, h);
  else if (mn.kieu === 'tron') g.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (mn.kieu === 'chu_nhat') g.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2 * (mn.bo || 0));
  else if (mn.kieu === 'tim') { const s = Math.min(w, h) / 2; g.moveTo(0, s * 0.85); g.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.55, -s * 1.05, 0, -s * 0.45); g.bezierCurveTo(s * 0.55, -s * 1.05, s * 1.4, -s * 0.1, 0, s * 0.85); }
  else if (mn.kieu === 'sao') { const r1 = Math.min(w, h) / 2, r2 = r1 * 0.45; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }
  g.fill(); g.restore();
}
function apMatNaBlend(ctx, W, H, c, off, ve) {
  const mn = c.mn && c.mn.kieu && c.mn.kieu !== 'khong' ? c.mn : null, bl = c.blend && c.blend !== 'normal' && BLEND[c.blend] ? BLEND[c.blend][1] : null;
  if (!mn && !bl && !coTrangTri(c)) return apDoanGoc(ctx, W, H, c, off, ve);
  const [L, M] = lopCvs; [L, M].forEach(x => { if (x.width !== W || x.height !== H) { x.width = W; x.height = H; } }); const g = L.getContext('2d'); g.clearRect(0, 0, W, H);
  apDoanGoc(g, W, H, c, off, ve);
  if (mn) { veMatNaMuc(M, W, H, c.t_bd != null ? 'b' : 'v', c, off, cheMn(c)); g.save(); g.globalCompositeOperation = 'destination-in'; g.drawImage(M, 0, 0); g.restore(); }   /* mặt nạ v2: không gian mục, SDF + mềm viền theo px của mục */
  ctx.save(); if (bl) ctx.globalCompositeOperation = bl; if (coTrangTri(c)) veTrangTri(ctx, W, H, c, off, L); else ctx.drawImage(L, 0, 0); ctx.restore();
}
/* spec 9.2: mọi thông số mặt nạ keyframe được (kênh mn_x, mn_y, mn_w, mn_h, mn_xoay, mn_mem, mn_bo dùng chung cơ chế keyframe 3.2) */
const MN_KENH = ['x', 'y', 'w', 'h', 'xoay', 'mem', 'bo'];
Object.assign(KF_TEN, { mn_x: 'Vị trí ngang mặt nạ', mn_y: 'Vị trí dọc mặt nạ', mn_w: 'Rộng mặt nạ', mn_h: 'Cao mặt nạ', mn_xoay: 'Xoay mặt nạ', mn_mem: 'Mềm viền mặt nạ', mn_bo: 'Bo góc mặt nạ' });
const coKenhMn = (m, x) => !!(m && m.kfs && m.kfs['mn_' + x] && m.kfs['mn_' + x].length);
function mnTai(m, off) { const mn = mnCua(m); if (!mn) return null; const o = { ...mn }; MN_KENH.forEach(x => { if (coKenhMn(m, x)) o[x] = giaTriKf(m, 'mn_' + x, off); }); return o; }
function oTruotMn(box, nhan, min, max, buoc, k, m, x, dinhDang) {
  const ten = 'mn_' + x, off = offMuc(k, m), co = coKenhMn(m, x), tai = co && kfTai(m, ten, off) >= 0, md = mnMacDinh(m.mn.kieu)[x];
  const r = oTruot(box, nhan, min, max, buoc, co ? giaTriKf(m, ten, off) : (m.mn[x] == null ? md : m.mn[x]), dinhDang, v => { if (coKenhMn(m, x)) datKf(m, ten, offMuc(k, m), v); else m.mn[x] = v; });
  r.dataset.md = md; const st = batDauMuc(k, m), ngoai = P.t < st - 0.01 || P.t > st + daiMuc(k, m) + 0.01;
  const nut = el('button', 'kfn' + (tai ? ' co' : co ? ' nua' : ''), tai ? '◆' : '◇'); nut.type = 'button'; nut.disabled = ngoai; nut.dataset.kenh = ten; nut.title = ngoai ? 'Đưa đầu phát vào trong mục để đặt keyframe' : (tai ? 'Bỏ keyframe ' : 'Thêm keyframe ') + KF_TEN[ten] + ' tại đầu phát';
  nut.onclick = () => { luuHoanTac(); const o2 = offMuc(k, m); if (kfTai(m, ten, o2) >= 0) xoaKf(m, ten, o2); else datKf(m, ten, o2, coKenhMn(m, x) ? giaTriKf(m, ten, o2) : (m.mn[x] == null ? md : m.mn[x])); veProp(); veTl(); veKhung(); };
  r.parentNode.insertBefore(nut, r); return r;
}
/* tay cầm mặt nạ: hiện đúng giá trị tại đầu phát; kéo khi kênh đã có keyframe → tự thêm keyframe tại đầu phát; giữ Shift khi kéo mép = co giãn đều hai chiều */
function mnGhiKf(m, k, shift, loai, mn0) { const mn = mnCua(m); if (!mn) return; if (shift && /^e_/.test(loai) && mn0) { if (loai === 'e_t' || loai === 'e_b') { const r = mn.h / (mn0.h || 0.6); mn.w = +Math.max(0.02, Math.min(1.5, (mn0.w == null ? 0.6 : mn0.w) * r)).toFixed(3); } else { const r = mn.w / (mn0.w || 0.6); mn.h = +Math.max(0.02, Math.min(1.5, (mn0.h == null ? 0.6 : mn0.h) * r)).toFixed(3); } } const off = offMuc(k, m); MN_KENH.forEach(x => { if (coKenhMn(m, x) && mn[x] != null) datKf(m, 'mn_' + x, off, mn[x]); }); }
function veThuocTinhBlend(box, m) { const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Hoà trộn')); box.appendChild(n); oChon(n, 'Chế độ hoà trộn', Object.keys(BLEND).map(k => [k, BLEND[k][0]]), m.blend || 'normal', v => { if (v === 'normal') delete m.blend; else m.blend = v; }); }
/* ── 3.3 LUT (.cube, tối đa 20 MB) ── */
P.luts = P.luts || {};
function docCube(txt) { let n = 0; const ds = []; String(txt).split(/\r?\n/).forEach(d => { d = d.trim(); if (!d || d[0] === '#') return; const m = d.match(/^LUT_3D_SIZE\s+(\d+)/i); if (m) { n = +m[1]; return; } if (/^[A-Z_]/i.test(d)) return; const v = d.split(/\s+/).map(Number); if (v.length >= 3 && v.every(x => !isNaN(x))) ds.push(v[0], v[1], v[2]); }); if (!n || n < 2 || n > 65 || ds.length < n * n * n * 3) throw new Error('file .cube không hợp lệ (cần LUT_3D_SIZE và đủ ' + n * n * n + ' dòng màu)'); return { n, data: ds.slice(0, n * n * n * 3) }; }
async function themLut(f) { if (f.size > 20 * 1048576) { toast('LUT tối đa 20 MB'); return null; } try { const { n, data } = docCube(await f.text()); const id = 'lut_' + uid(), lut = { id, ten: f.name.replace(/\.cube$/i, ''), n, data }; P.luts[id] = lut; try { await dbGhi(KHO_LUT, lut); } catch { } veLutLuoi(); toast('Đã thêm LUT “' + lut.ten + '” (' + n + '³)'); return lut; } catch (e) { toast('Không đọc được LUT: ' + (e.message || e)); return null; } }
async function napLutKho() { try { (await dbTatCa(KHO_LUT)).forEach(l => { P.luts[l.id] = l; }); } catch { } veLutLuoi(); }
function apLutChon(id) { const tatCa = $('#locTatCa').checked || !(P.chon && P.chon.k === 'v'), ds = tatCa ? P.clips : [P.clips[P.chon.i]]; if (!ds.length) { toast('Chưa có đoạn nào'); return; } luuHoanTac(); ds.forEach(c => { if (id) { c.lut = id; c.lutMuc = +$('#locMucChung').value; } else delete c.lut; }); veTl(); veKhung(); veProp(); toast(id ? 'Áp LUT “' + P.luts[id].ten + '” cho ' + ds.length + ' đoạn' : 'Bỏ LUT'); }
function veLutLuoi() { const box = $('#lutLuoi'); if (!box) return; box.innerHTML = ''; const b0 = el('button'); b0.type = 'button'; theHoa(b0, '<span style="font-size:18px">⦸</span>', 'Không LUT'); b0.onclick = () => apLutChon(null); box.appendChild(b0); Object.values(P.luts).forEach(l => { const b = el('button'); b.type = 'button'; b.dataset.lut = l.id; theHoa(b, '<span style="font-size:14px;font-weight:800">LUT</span>', l.ten, l.n + '³'); b.onclick = () => apLutChon(l.id); b.oncontextmenu = async e => { e.preventDefault(); if (!confirm('Xoá LUT “' + l.ten + '” khỏi máy?')) return; delete P.luts[l.id]; try { await dbXoa(KHO_LUT, l.id); } catch { } veLutLuoi(); }; box.appendChild(b); }); }
function lutTex(gl, lut) { MAU_GL.luts = MAU_GL.luts || {}; if (MAU_GL.luts[lut.id]) return MAU_GL.luts[lut.id]; const n = lut.n, px = new Uint8Array(n * n * n * 4); for (let b = 0; b < n; b++) for (let g = 0; g < n; g++) for (let r = 0; r < n; r++) { const i = (r + g * n + b * n * n) * 3, o = (g * n * n + b * n + r) * 4; px[o] = Math.round(Math.max(0, Math.min(1, lut.data[i])) * 255); px[o + 1] = Math.round(Math.max(0, Math.min(1, lut.data[i + 1])) * 255); px[o + 2] = Math.round(Math.max(0, Math.min(1, lut.data[i + 2])) * 255); px[o + 3] = 255; }
  const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n * n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, px); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)); [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR)); gl.activeTexture(gl.TEXTURE0); MAU_GL.luts[lut.id] = t; return t; }
/* ── 2.8 Trình phát: lưới, vùng an toàn TikTok, phóng to khung; In/Out + lặp; J/K/L ── */
function veLopPhu() { const k = $('#lopPhuChon') ? $('#lopPhuChon').value : 'khong', o = $('#lopPhu'); if (!o) return; o.innerHTML = ''; if (k === 'khong') return;
  let s = '<svg viewBox="0 0 100 100" preserveAspectRatio="none">';
  if (k === 'luoi' || k === 'ca_hai') s += '<path d="M33.33 0V100M66.67 0V100M0 33.33H100M0 66.67H100" stroke="rgba(255,255,255,.45)" stroke-width=".3" vector-effect="non-scaling-stroke" fill="none"/>';
  if (k === 'an_toan' || k === 'ca_hai') s += '<rect x="0" y="0" width="100" height="9" fill="rgba(255,60,90,.22)"/><rect x="84" y="38" width="16" height="45" fill="rgba(255,60,90,.22)"/><rect x="0" y="81" width="100" height="19" fill="rgba(255,60,90,.22)"/><rect x="6" y="9" width="78" height="72" fill="none" stroke="rgba(34,211,223,.9)" stroke-width=".4" stroke-dasharray="2 1.5" vector-effect="non-scaling-stroke"/>';
  s += '</svg>'; o.innerHTML = s + (k === 'an_toan' || k === 'ca_hai' ? '<span class="lpNhan" style="top:2%">thanh trên TikTok</span><span class="lpNhan" style="top:60%;right:1%;left:auto">nút</span><span class="lpNhan" style="top:88%">tên, mô tả, nhạc</span>' : ''); }
function datZoomKhung() { const z = $('#zoomKhung').value, kh = $('.khung'), vung = $('.khungVung'); if (z === 'vua') { kh.style.removeProperty('--zk'); kh.classList.remove('zoomTay'); vung.classList.remove('cuon'); datTiLe($('#tiLe').value, true); return; } kh.classList.add('zoomTay'); vung.classList.add('cuon'); kh.style.height = Math.round(cv.height * +z) + 'px'; kh.style.width = Math.round(cv.width * +z) + 'px'; }
function veVaoRa() { $$('#ruler .vungVR').forEach(x => x.remove()); if (P.vao == null && P.ra == null) return; const px = PX(), a = P.vao || 0, b = P.ra == null ? tongGiay() : P.ra, d = el('i', 'vungVR'); d.style.left = a * px + 'px'; d.style.width = Math.max(2, (b - a) * px) + 'px'; d.title = 'Vùng In–Out ' + fmt1(a) + '–' + fmt1(b) + 's · kéo hai mép để nới / thu, kéo giữa để dời · bấm đúp hoặc Alt+X để bỏ'; d.appendChild(el('b', 'vrM l')); d.appendChild(el('b', 'vrM r')); $('#ruler').appendChild(d);
  d.ondblclick = e => { e.stopPropagation(); datVao('bo'); };
  d.onpointerdown = e => { if (e.button) return; e.preventDefault(); e.stopPropagation(); const mep = e.target.classList.contains('l') ? 'l' : e.target.classList.contains('r') ? 'r' : 'giua', x0 = e.clientX, a0 = P.vao || 0, b0 = P.ra == null ? tongGiay() : P.ra, T = tongGiay(); try { d.setPointerCapture(e.pointerId); } catch { } luuHoanTac(); let doi = false;
    const mv = ev => { const dt = (ev.clientX - x0) / PX(); if (Math.abs(ev.clientX - x0) > 2) doi = true; if (!doi) return; let a = a0, b = b0;
      if (mep === 'l') a = Math.max(0, Math.min(b0 - 0.1, hit(a0 + dt))); else if (mep === 'r') b = Math.min(T, Math.max(a0 + 0.1, hit(b0 + dt))); else { const w = b0 - a0; a = Math.max(0, Math.min(T - w, a0 + dt)); const a2 = hit(a); if (a2 !== a && a2 + w <= T) a = a2; else { const b2 = hit(a + w); if (b2 !== a + w && b2 - w >= 0) a = b2 - w; } b = a + w; }
      P.vao = +a.toFixed(3); P.ra = +b.toFixed(3); d.style.left = a * PX() + 'px'; d.style.width = Math.max(2, (b - a) * PX()) + 'px'; hienTip(ev, 'In ' + fmt1(a) + 's – Out ' + fmt1(b) + 's · ' + fmt1(b - a) + 's'); };
    const up = () => { d.removeEventListener('pointermove', mv); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', up); $('#snapLine').style.display = 'none'; hienTip(null); if (!doi) { P.hoanTac.pop(); return; } veVaoRa(); };
    d.addEventListener('pointermove', mv); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up); }; }
function datVao(loai) { if (loai === 'bo') { P.vao = P.ra = null; toast('Bỏ vùng In–Out'); } else if (loai === 'vao') { P.vao = +P.t.toFixed(3); if (P.ra != null && P.ra <= P.vao) P.ra = null; toast('Điểm In: ' + fmt1(P.vao) + 's'); } else { P.ra = +P.t.toFixed(3); if (P.vao != null && P.vao >= P.ra) P.vao = null; toast('Điểm Out: ' + fmt1(P.ra) + 's'); } veVaoRa(); }
let shuttleT = null;
function shuttle(huong) { if (huong === 0) { P.tocPhat = 1; clearInterval(shuttleT); shuttleT = null; if (P.dang) dung(); return; }
  if (huong > 0) { clearInterval(shuttleT); shuttleT = null; if (!P.dang) { P.tocPhat = 1; phat(false); } else { P.tocPhat = Math.min(8, (P.tocPhat || 1) * 2); toast('Tua tới ' + P.tocPhat + '×'); } return; }
  if (P.dang) dung(); const toc = shuttleT ? Math.min(8, (P.tocLui || 1) * 2) : 1; P.tocLui = toc; clearInterval(shuttleT); toast('Tua lùi ' + toc + '×'); let ban = false;
  shuttleT = setInterval(async () => { if (ban) return; if (P.t <= 0) { clearInterval(shuttleT); shuttleT = null; return; } P.t = Math.max(0, P.t - 0.1 * toc); vePh(); datTg(tongGiay()); ban = true; try { await veKhung(); } catch { } ban = false; }, 100); }
/* ── 9.1 Xuất ảnh tĩnh (PNG), GIF, ước tính dung lượng ── */
const tenSlug = md => ($('#tenDuAn').value.trim() || md).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase().replace(/^-|-$/g, '').slice(0, 40) || md;
async function xuatAnhTinh() { const { W, H } = kichThuoc(+$('#doPhanGiai').value || 1080), c = Object.assign(document.createElement('canvas'), { width: W, height: H }); await veKhungXuat(c.getContext('2d'), W, H, Math.min(P.t, Math.max(0, tongGiay() - 0.001))); c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = tenSlug('khung') + '-' + fmt1(P.t).replace(',', 'm') + 's.png'; document.body.appendChild(a); a.click(); a.remove(); toast('Đã xuất ảnh ' + W + '×' + H + ' tại ' + fmt1(P.t) + 's'); }, 'image/png'); }
function bangMauGif() { const p = []; for (let r = 0; r < 6; r++) for (let g = 0; g < 7; g++) for (let b = 0; b < 6; b++) p.push([Math.round(r * 255 / 5), Math.round(g * 255 / 6), Math.round(b * 255 / 5)]); while (p.length < 256) p.push([0, 0, 0]); return p; }
function lzwGif(idx, minBit) { const out = []; let cur = 0, nb = 0; const ghi = (code, n) => { cur |= code << nb; nb += n; while (nb >= 8) { out.push(cur & 255); cur >>= 8; nb -= 8; } }; const clr = 1 << minBit, eoi = clr + 1; let dict = new Map(), next = eoi + 1, sz = minBit + 1; ghi(clr, sz); let w = idx[0];
  for (let i = 1; i < idx.length; i++) { const k = idx[i], key = w * 4096 + k; if (dict.has(key)) { w = dict.get(key); continue; } ghi(w, sz); if (next < 4096) { dict.set(key, next++); if (next > (1 << sz) && sz < 12) sz++; } else { ghi(clr, sz); dict = new Map(); next = eoi + 1; sz = minBit + 1; } w = k; }
  ghi(w, sz); ghi(eoi, sz); if (nb > 0) out.push(cur & 255); return out; }
async function xuatGif(o) {
  const tong = tongGiay(), a = P.vao || 0, b = Math.min(tong, P.ra == null ? tong : P.ra), fps = o.gifFps || 12, Wg = o.gifRong || 360, { W, H } = kichThuoc(1080), Hg = Math.round(Wg * H / W / 2) * 2, N = Math.max(1, Math.round((b - a) * fps));
  if (N > 900) throw new Error('GIF tối đa ~900 khung, chọn vùng In–Out ngắn hơn');
  const c = Object.assign(document.createElement('canvas'), { width: Wg, height: Hg }), g = c.getContext('2d', { willReadFrequently: true }), pal = bangMauGif(), bytes = [];
  const w16 = v => bytes.push(v & 255, (v >> 8) & 255); 'GIF89a'.split('').forEach(ch => bytes.push(ch.charCodeAt(0))); w16(Wg); w16(Hg); bytes.push(0xF7, 0, 0); pal.forEach(([r, gg, bb]) => bytes.push(r, gg, bb));
  bytes.push(0x21, 0xFF, 11, ...'NETSCAPE2.0'.split('').map(x => x.charCodeAt(0)), 3, 1, 0, 0, 0);
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], tre = Math.round(100 / fps), idx = new Uint8Array(Wg * Hg);
  await chuanBiVe();
  for (let n = 0; n < N; n++) { if (P.huyXuat) return null; await veKhungXuat(g, Wg, Hg, Math.min(b - 0.001, a + n / fps)); const d = g.getImageData(0, 0, Wg, Hg).data;
    for (let y = 0, i = 0; y < Hg; y++) for (let x = 0; x < Wg; x++, i++) { const t = (bayer[(y & 3) * 4 + (x & 3)] / 16 - 0.5), r = Math.max(0, Math.min(5, Math.round(d[i * 4] / 51 + t))), gg = Math.max(0, Math.min(6, Math.round(d[i * 4 + 1] / 42.5 + t))), bb = Math.max(0, Math.min(5, Math.round(d[i * 4 + 2] / 51 + t))); idx[i] = r * 42 + gg * 6 + bb; }
    bytes.push(0x21, 0xF9, 4, 4); w16(tre); bytes.push(0, 0); bytes.push(0x2C); w16(0); w16(0); w16(Wg); w16(Hg); bytes.push(0); bytes.push(8); const lz = lzwGif(idx, 8); for (let p = 0; p < lz.length; p += 255) { const k = lz.slice(p, p + 255); bytes.push(k.length, ...k); } bytes.push(0);
    if (n % 3 === 0) { $('#xuatBar').style.width = ((n + 1) / N * 100).toFixed(1) + '%'; $('#xuatTt').textContent = 'GIF khung ' + (n + 1) + '/' + N; await new Promise(r => setTimeout(r, 0)); } }
  bytes.push(0x3B); return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}
function uocTinh() { const o = caiXuat(), tong = (P.ra == null ? tongGiay() : P.ra) - (P.vao || 0), { W, H } = kichThuoc(o.res); if (o.dd === 'wav') return tong * 48000 * 4; if (o.dd === 'm4a' || o.dd === 'mp3') return tong * o.am * 1000 / 8; if (o.dd === 'gif') return tong * (o.gifFps || 12) * (o.gifRong || 360) * (o.gifRong || 360) * 1.6 * 0.35; const bpp = { vua: 0.05, cao: 0.09, rat_cao: 0.15 }[o.cl] || 0.09, vb = o.cl === 'tuy' ? o.mbps * 1e6 : W * H * o.fps * bpp * (o.dd === 'mp4_av1' ? 0.7 : o.dd === 'mp4_hevc' ? 0.6 : 1); return tong * (vb + o.am * 1000) / 8; }
function veUocTinh() { const t = $('#uocTinh'); if (!t) return; const n = uocTinh(), tong = (P.ra == null ? tongGiay() : P.ra) - (P.vao || 0); t.textContent = 'Ước tính: ~' + (n / 1048576).toFixed(1).replace('.', ',') + ' MB · ' + fmt1(Math.max(0, tong)) + 's' + (P.vao != null || P.ra != null ? ' (vùng In–Out)' : ''); }
/* ── 1.2 Media: lọc theo loại, rê chuột xem trước trên thẻ ── */
function locMedia() { const k = $('#locMedia') ? $('#locMedia').value : 'tat'; $$('#srcs .fsrc').forEach(d => { const s = P.srcs.find(x => x.id === d.dataset.id); d.hidden = !!(s && k !== 'tat' && s.loai !== k); }); }
function khoiTaoDot1() {
  // dự án
  $('#btnDuAn').onclick = () => veQuanLy('ds'); $('#qlDong').onclick = () => $('#qlHop').classList.remove('mo'); $('#qlMoi').onclick = duAnMoi; $('#qlTim').oninput = () => veQuanLy(); $('#qlXep').onchange = () => veQuanLy();
  $$('#qlHop .qlTab').forEach(b => b.onclick = () => veQuanLy(b.dataset.tab)); $('#qlXuatGoi').onclick = xuatGoi; $('#qlGoiIn').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) nhapGoi(f); };
  setInterval(() => { if (!P.dang && !P.dangKeo) tuLuu(); }, 4000); window.addEventListener('beforeunload', () => { tuLuu(); });
  const _them = themFile; themFile = async function (files) { const r = await _them(files); for (const f of files || []) opfsGhi(f); henLuu(); return r; };
  const q = new URLSearchParams(location.search); if (q.get('duan')) { history.replaceState(null, '', location.pathname); moDuAnTuKho(q.get('duan')); } else if (q.get('moi')) history.replaceState(null, '', location.pathname);
  // LUT
  $('#lutIn').onchange = async e => { for (const f of [...e.target.files]) await themLut(f); e.target.value = ''; }; napLutKho();
  // trình phát
  $('#lopPhuChon').onchange = veLopPhu; $('#zoomKhung').onchange = datZoomKhung; $('#btnLap').onclick = () => { P.lap = !P.lap; $('#btnLap').setAttribute('aria-pressed', String(P.lap)); toast(P.lap ? 'Phát lặp: BẬT (lặp trong vùng In–Out nếu có)' : 'Phát lặp: TẮT'); };
  // xuất
  $('#btnAnhTinh').onclick = xuatAnhTinh; ['xuatDD', 'xuatFps', 'xuatCL', 'doPhanGiai', 'gifFps', 'gifRong', 'xuatMbps', 'xuatAm'].forEach(id => { const x = $('#' + id); if (x) x.addEventListener('change', () => { $('#gifCai').hidden = $('#xuatDD').value !== 'gif'; $('#xuatMbpsHang').hidden = $('#xuatCL').value !== 'tuy'; veUocTinh(); }); }); setInterval(veUocTinh, 2000); veUocTinh();
  // media
  $('#locMedia').onchange = locMedia;
  $('#srcs').addEventListener('pointermove', e => { const im = e.target.closest('img.th'); if (!im) return; const d = im.closest('.fsrc'), s = d && P.srcs.find(x => x.id === d.dataset.id); if (!s || !s.phim || s.loai !== 'video') return; const r = im.getBoundingClientRect(), f = Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width)), k = Math.floor(f * s.phim.n); let cvx = d.querySelector('canvas.xemThe'); if (!cvx) { cvx = el('canvas', 'xemThe'); im.parentNode.insertBefore(cvx, im.nextSibling); } cvx.width = s.phim.fw; cvx.height = s.phim.fh; cvx.getContext('2d').drawImage(s.phim.cv, k * s.phim.fw, 0, s.phim.fw, s.phim.fh, 0, 0, s.phim.fw, s.phim.fh); Object.assign(cvx.style, { left: im.offsetLeft + 'px', top: im.offsetTop + 'px', width: im.offsetWidth + 'px', height: im.offsetHeight + 'px', display: 'block' }); });
  $('#srcs').addEventListener('pointerout', e => { const im = e.target.closest('img.th'); if (!im) return; const cvx = im.parentNode.querySelector('canvas.xemThe'); if (cvx) cvx.style.display = 'none'; });
  P.srcs.forEach(s => taoPhim(s));
}
