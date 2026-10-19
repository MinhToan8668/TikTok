/* ═════════ ĐẶC TẢ CAPCUT 9.1 · ĐỢT 2: đảo ngược, thay đoạn, dán thuộc tính, tách mọi track, lớp trên/dưới cùng, Alt+kéo nhân bản, tốc độ 0,1–100×, giữ cao độ, keyframe chép/dán/đảo, mốc màu + ghi chú, track đổi tên + solo, chữ chuyển màu/uốn cong/dọc ═════════ */
/* ── dán thuộc tính (Ctrl+Alt+V): lấy từ mục đã Ctrl+C ── */
const KHONG_DAN = new Set(['id', 'src', 'bd', 'kt', 't_bd', 'lop', 'nhom', 'text', 'phu', 'kieu', 'ly_do', 'trong', 'dongBang', 'el', 'gain', 'toc', 'cong', 'giay', 'url', 'b64', 'ten', 'chuyen', 'chuyen_dai', 'dao', 'boVao', 'boRa']);
const THUOC_HINH = ['x', 'y', 'sc', 'xoay', 'mo', 'latX', 'latY', 'mn', 'blend', 'kfs', 'hu2', 'loc', 'locMuc', 'sang', 'tuong_phan', 'bao_hoa', 'lutMuc', ...MAU_KEYS];
function danThuocTinh() {
  const b = P.boNho; if (!b || b.nhieu) { toast('Sao chép (Ctrl+C) một mục trước, rồi chọn mục khác và dán thuộc tính'); return; }
  const ds = dsNhieu().length > 1 ? dsNhieu() : (P.chon && mucChon() ? [{ k: P.chon.k, m: mucChon() }] : []); if (!ds.length) { toast('Chọn mục cần dán thuộc tính'); return; }
  const hinh = k => k === 'v' || k === 'b'; let n = 0; luuHoanTac();
  ds.forEach(({ k, m }) => { if (!(k === b.k || (hinh(k) && hinh(b.k)))) return; if (hinh(k)) THUOC_HINH.forEach(p => { if (!(p in b.d)) delete m[p]; }); Object.keys(b.d).forEach(p => { if (!KHONG_DAN.has(p) && b.d[p] !== undefined) m[p] = JSON.parse(JSON.stringify(b.d[p])); }); n++; });
  veTl(); veKhung(); veProp(); toast(n ? 'Đã dán thuộc tính cho ' + n + ' mục' : 'Thuộc tính này không dán được sang loại mục đang chọn');
}
/* ── tách V1 đúng cả khi đảo ngược, giữ keyframe từng phần ── */
function tachV1(i, off) {
  const c = P.clips[i]; if (!c) return false; const tSrc = +(c.dao ? c.kt - srcTuTl(c, off) : c.bd + srcTuTl(c, off)).toFixed(3), c2 = JSON.parse(JSON.stringify(c));
  if (c.dao) { c2.kt = tSrc; c.bd = tSrc; } else { c2.bd = tSrc; c.kt = tSrc; }   // đảo ngược: phần đầu trên dòng thời gian là khúc cuối của nguồn
  c2.id = uid();
  if (c.kfs) Object.keys(c.kfs).forEach(k => { if (!c.kfs[k] || !c.kfs[k].length || kfTai(c, k, off) >= 0) return; const v = giaTriKf(c, k, off); [c, c2].forEach(x => { x.kfs[k].push({ t: +off.toFixed(3), v, e: 'deu' }); x.kfs[k].sort((a, b) => a.t - b.t); }); });   /* spec 1.5: thêm keyframe nội suy tại điểm cắt để animation không nhảy */
  delete c.chuyen; delete c.chuyen_dai; delete c.chuyenSau;   /* spec 1.5: chuyển cảnh mép phải đi theo nửa phải */
  P.clips.splice(i + 1, 0, c2); doiKf(c, 0); doiKf(c2, -off); return true;
}
/* ── tách mọi track tại đầu phát ── */
function tachTatCa() {
  const t = P.t; luuHoanTac(); let n = 0;
  const { clip, bdTl } = viTri(t); if (clip >= 0 && !trKhoa('v1')) { const c = P.clips[clip], off = t - bdTl; if (!c.trong && off > 0.05 && off < daiC(c) - 0.05 && tachV1(clip, off)) n++; }
  P.broll.slice().forEach(b => { const toc = tocC(b), off = t - b.t_bd, len = (b.kt - b.bd) / toc; if (trKhoa(keyLop(lopCua('b', b))) || off <= 0.05 || off >= len - 0.05) return; const cat = +(b.bd + off * toc).toFixed(3), b2 = JSON.parse(JSON.stringify(b)); b2.id = uid(); b2.bd = cat; b2.t_bd = +t.toFixed(3); delete b2.nhom; b.kt = cat; doiKf(b, 0); doiKf(b2, -off); P.broll.push(b2); n++; });
  P.gfx.slice().forEach(g => { if (trKhoa(keyLop(lopCua('g', g))) || t <= g.bd + 0.05 || t >= g.kt - 0.05) return; const off = t - g.bd, g2 = JSON.parse(JSON.stringify(g)); g2.id = uid(); g2.bd = +t.toFixed(3); g2.boVao = true; delete g2.nhom; g.kt = +t.toFixed(3); g.boRa = true; doiKf(g, 0); doiKf(g2, -off); P.gfx.push(g2); n++; });
  P.am3.slice().forEach(a => { const off = t - a.t_bd; if (trKhoa(keyAm(a.lop)) || off <= 0.05 || off >= a.kt - a.bd - 0.05) return; const giua = +(a.bd + off).toFixed(3); P.am3.push({ ...a, id: uid(), bd: giua, t_bd: +t.toFixed(3), fi: 0 }); a.kt = giua; a.fo = 0; n++; });
  if (!n) { huyHoanTac(); toast('Không có mục nào đi qua đầu phát'); return; } veTl(); veLoi(); veKhung(); toast('Đã tách ' + n + ' mục trên mọi track tại ' + fmt1(t) + 's');
}
/* ── lớp trên cùng / dưới cùng ── */
function lopCuc(k, i, len) { const m = (k === 'b' ? P.broll : k === 'g' ? P.gfx : [])[i]; if (!m) return; const hs = cacLop(); luuHoanTac(); m.lop = len ? (hs.length ? hs[0] : 0) + 1 : (hs.length ? hs[hs.length - 1] : 1) - 1; veTl(); veKhung(); veProp(); toast(len ? 'Đưa lên trên cùng' : 'Đưa xuống dưới cùng'); }
/* ── thay đoạn (Replace clip): giữ vị trí, độ dài, hiệu ứng ── */
function thayDoan(k, i, sid) {
  const m = (k === 'v' ? P.clips : P.broll)[i], s = srcCua(sid); if (!m || !s) return; luuHoanTac(); const dai = daiMuc(k, m), toc = tocC(m), can = dai * toc, co = s.loai === 'video' ? (s.giay || can) : 1e4;
  m.src = sid; m.bd = 0; m.kt = +Math.min(co, can).toFixed(3); if (k === 'v') { const st = batDauC(m), moi = daiC(m); if (Math.abs(moi - dai) > 0.01) ripple(st + dai, moi - dai); }
  veTl(); veKhung(); veProp(); toast(Math.min(co, can) < can - 0.01 ? 'Đã thay đoạn · footage mới ngắn hơn nên đoạn ngắn lại ' + fmt1(dai - daiMuc(k, m)) + 's' : 'Đã thay đoạn, giữ nguyên độ dài và hiệu ứng');
}
function menuThay(k, i) { const m = (k === 'v' ? P.clips : P.broll)[i]; if (!m) return []; return [{ ic: 'media', t: 'Thay bằng file mới…', f: () => { P.thayCho = { k, i }; $('#thayIn').click(); } }, ...P.srcs.filter(s => s.id !== m.src).slice(0, 6).map(s => ({ ic: 'media', t: 'Thay bằng S' + (P.srcs.indexOf(s) + 1) + ' · ' + String(s.ten).slice(0, 22), f: () => thayDoan(k, i, s.id) }))]; }
/* ── đảo ngược đoạn: phát lùi (tua từng khung), âm thanh đảo khi xuất ── */
const tuaTay = c => !!c && (!!c.dao || tocC(c) > 16);
function daoBuf(oc, buf, c, k) { const sr = buf.sampleRate, a = Math.max(0, Math.floor(c.bd * sr)), b = Math.min(buf.length, Math.floor(Math.min(c.kt, buf.duration) * sr)), n = Math.max(1, b - a), r = oc.createBuffer(buf.numberOfChannels, n, sr); for (let ch = 0; ch < buf.numberOfChannels; ch++) { const s = buf.getChannelData(ch).subarray(a, b), d = r.getChannelData(ch); for (let j = 0; j < n; j++) d[j] = s[n - 1 - j] || 0; } return k === 1 ? r : gianDoan(oc, r, 0, r.duration, k); }
function doiDao(i) { const c = P.clips[i]; if (!c) return; luuHoanTac(); c.dao = !c.dao; if (!c.dao) delete c.dao; veTl(); veKhung(); veProp(); toast(c.dao ? 'Đã đảo ngược đoạn (phát lùi)' : 'Bỏ đảo ngược'); }
/* ── tốc độ 0,1–100× ── */
const fmtToc = x => (x < 1 ? x.toFixed(2) : x < 10 ? x.toFixed(1) : String(Math.round(x))).replace('.', ',') + '×';
function datToc(c, v) { let acc = 0; for (const k of P.clips) { if (k === c) break; acc += daiC(k); } const cu = daiC(c); delete c.cong; c.toc = Math.max(0.1, Math.min(100, +v)); if (c.toc === 1) delete c.toc; coKf(c, daiC(c) / cu); ripple(acc + cu, daiC(c) - cu); }
/* đổi tốc độ: keyframe co giãn theo để vẫn rơi đúng khung hình nguồn cũ */
function coKf(c, k) { if (!c.kfs || !(k > 0) || Math.abs(k - 1) < 1e-6) return; Object.keys(c.kfs).forEach(p => { c.kfs[p] = c.kfs[p].map(f => ({ ...f, t: +(f.t * k).toFixed(4) })); }); }
function veTocDoan(n3, c) {
  oTruot(n3, 'Tốc độ', -1, 2, 0.005, Math.log10(tocC(c)), v => fmtToc(Math.pow(10, v)), v => { datToc(c, +Math.pow(10, v).toPrecision(2)); });
  const r = el('div', 'row'); [0.1, 0.5, 1, 2, 5, 10, 100].forEach(x => { const b = el('button', 'btn nho', fmtToc(x)); b.type = 'button'; b.setAttribute('aria-pressed', String(Math.abs(tocC(c) - x) < 0.001 && !c.cong)); b.onclick = () => { luuHoanTac(); datToc(c, x); veTl(); veKhung(); veProp(); }; r.appendChild(b); }); n3.appendChild(r);
  const hop = (nhan, bat, f, goiY) => { const l = el('label'); l.appendChild(el('span', null, nhan)); const cb = el('input'); cb.type = 'checkbox'; cb.checked = bat; cb.onchange = () => f(cb.checked); l.appendChild(cb); if (goiY) l.title = goiY; n3.appendChild(l); };
  hop('Giữ cao độ giọng', !c.doiCao, v => { luuHoanTac(); if (v) delete c.doiCao; else c.doiCao = true; veKhung(); }, 'Bật: tua nhanh/chậm vẫn giữ giọng tự nhiên. Tắt: giọng cao lên khi nhanh, trầm xuống khi chậm (kiểu chipmunk).');
  hop('Đảo ngược (phát lùi)', !!c.dao, () => doiDao(P.clips.indexOf(c)));
  if (tocC(c) > 16 || c.dao) n3.appendChild(el('div', 'quota', 'Xem trước tua từng khung nên có thể giật; bản xuất vẫn mượt đúng từng khung.'));
  /* 'Áp cho tất cả' của tốc độ nằm ở cuối tab (tabCuoi, có dồn dòng thời gian); nút cũ ở đây không dồn nên bỏ */
}
/* ── keyframe: chép, dán, đảo ngược ── */
const PROP_KF_CHEP = ['sc', 'x', 'y', 'xoay', 'mo'];
function chepKf(k, m) { const off = offMuc(k, m), tai = Object.keys(m.kfs || {}).filter(p => kfTai(m, p, off) >= 0), ds = tai.length ? tai : [...new Set([...PROP_KF_CHEP, ...Object.keys(m.kfs || {})])]; P.kfNho = {}; ds.forEach(p => { P.kfNho[p] = giaTriKf(m, p, off); }); toast('Đã chép ' + ds.length + ' thuộc tính keyframe tại ' + fmt1(off) + 's'); veProp(); }
function danKf(k, m) { if (!P.kfNho) { toast('Chưa chép keyframe'); return; } const off = offMuc(k, m); luuHoanTac(); Object.keys(P.kfNho).forEach(p => datKf(m, p, off, P.kfNho[p])); veProp(); veTl(); veKhung(); toast('Đã dán keyframe tại ' + fmt1(off) + 's'); }
function daoKf(k, m) { if (!m.kfs) return; const d = daiMuc(k, m), doi = { vao: 'ra', ra: 'vao' }; luuHoanTac(); Object.keys(m.kfs).forEach(p => { const f = m.kfs[p], n = f.length - 1; m.kfs[p] = f.map((_, j) => { const goc = f[n - j], truoc = f[n - j + 1], o = { t: +(d - goc.t).toFixed(3), v: goc.v, e: 'mem' }; if (truoc) { o.e = doi[truoc.e] || truoc.e || 'mem'; if (truoc.bz) o.bz = [1 - truoc.bz[2], 1 - truoc.bz[3], 1 - truoc.bz[0], 1 - truoc.bz[1]]; } return o; }); }); veProp(); veTl(); veKhung(); toast('Đã đảo ngược keyframe'); }
function veKfThem(n, k, m) { const r = el('div', 'row'), off = offMuc(k, m), ngoai = P.t < batDauMuc(k, m) - 0.01 || P.t > batDauMuc(k, m) + daiMuc(k, m) + 0.01; [['⧉ Chép ◆', () => chepKf(k, m), ngoai, 'Chép giá trị keyframe tại đầu phát'], ['📋 Dán ◆', () => danKf(k, m), ngoai || !P.kfNho, 'Dán giá trị đã chép thành keyframe tại đầu phát'], ['⇄ Đảo ngược', () => daoKf(k, m), !m.kfs || !Object.keys(m.kfs).length, 'Lật thứ tự keyframe: chuyển động chạy ngược lại']].forEach(([t, f, dis, tt]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.disabled = !!dis; b.title = tt; b.onclick = f; r.appendChild(b); }); n.appendChild(r); }
/* ── mốc: màu + ghi chú ── */
const MAU_MOC = [['#ffb020', 'Cam'], ['#ff4d6d', 'Đỏ'], ['#22d3df', 'Xanh ngọc'], ['#7cdf00', 'Xanh lá'], ['#a78bfa', 'Tím'], ['#ffffff', 'Trắng']];
function menuMoc(e, k) { const m = P.moc[k]; if (!m) return; moMenu(e.clientX, e.clientY, [{ ic: 'mark', t: 'Đổi tên / ghi chú…', f: () => { const t = prompt('Tên mốc', m.ten || ''); if (t == null) return; const g = prompt('Ghi chú (để trống nếu không cần)', m.ghi || ''); m.ten = t.slice(0, 60) || m.ten; if (g) m.ghi = g.slice(0, 300); else delete m.ghi; veTl(); henLuu(); } }, '-', ...MAU_MOC.map(([c, t]) => ({ ic: 'mark', t: (m.mau || '#ffb020') === c ? '● ' + t : t, f: () => { m.mau = c; veTl(); henLuu(); } })), '-', { ic: 'trash', t: 'Xoá mốc', do: true, f: () => { P.moc.splice(k, 1); veTl(); } }]); }
/* ── track: đổi tên + solo ── */
const LA_HINH = k => /^(v1|v2|v3|o1|o2|L[\d.]+)$/.test(k), LA_AM = k => /^(v1|a1|a2|a3|A[\d.]+)$/.test(k);
function coSolo(f) { return Object.keys(P.tr || {}).some(k => P.tr[k] && P.tr[k].solo && f(k)); }
function soloAn(k) { return LA_HINH(k) && !trO(k).solo && coSolo(LA_HINH); }
function soloTat(k) { return LA_AM(k) && !trO(k).solo && coSolo(LA_AM); }
function doiTenTr(k) { const o = trO(k), t = prompt('Tên track (để trống để bỏ tên)', o.ten || ''); if (t == null) return; P.tr = P.tr || {}; const x = P.tr[k] = P.tr[k] || {}; if (t.trim()) x.ten = t.trim().slice(0, 24); else delete x.ten; veTrNut(); }
function doiSolo(k) { P.tr = P.tr || {}; const x = P.tr[k] = P.tr[k] || {}; x.solo = !x.solo; if (!x.solo) delete x.solo; veTrNut(); if (P.dang) { am3BatDau(); P.tieng.forEach(t => { if (t.el) t.el.muted = trTat('a2'); }); } else veKhung(); toast(x.solo ? 'Solo track: chỉ hiện/nghe track này' : 'Bỏ solo'); }
/* ── chữ: chuyển màu, uốn cong, chữ dọc ── */
function gradChu(ctx, g, w, h, dx, dy) { const a = (g.gocMau || 0) * Math.PI / 180, L = Math.max(w, h) / 2, cx = Math.cos(a) * L, cy = Math.sin(a) * L, gr = ctx.createLinearGradient(dx - cx, dy - cy, dx + cx, dy + cy); gr.addColorStop(0, g.mau === 'nhan' ? mauNhan() : (g.mau || '#ffffff')); gr.addColorStop(1, g.mau2); return gr; }
function veChuDacBiet(ctx, g, dong, size, lh, o) {
  try { ctx.letterSpacing = '0px'; } catch { } ctx.textAlign = 'center'; const gian = (g.gianChu || 0) * size;
  const W0 = g.doc ? lh * dong.length : o.rong, H0 = g.doc ? Math.max(...dong.map(d => [...d].length), 1) * size * 1.08 : lh * dong.length;
  const ve1 = (ch, x, y, r) => { ctx.save(); ctx.translate(x, y); if (r) ctx.rotate(r);
    if (g.phat_sang) { ctx.save(); ctx.shadowColor = g.phat_sang; ctx.shadowBlur = size * 0.6; ctx.fillStyle = g.phat_sang; ctx.fillText(ch, 0, 0); ctx.restore(); }
    if (o.nen === 'vien' || g.vien) { ctx.lineWidth = size * o.vienDay; ctx.strokeStyle = o.vienMau; ctx.lineJoin = 'round'; ctx.strokeText(ch, 0, 0); }
    if (o.nen === 'bong' || g.bong) bongChu(ctx, g, size);
    ctx.fillStyle = g.mau2 ? gradChu(ctx, g, W0, H0, -x, -y) : o.mac; ctx.fillText(ch, 0, 0); ctx.restore(); };
  if (g.doc) { const n = dong.length, buoc = size * 1.08 + gian; dong.forEach((d, i) => { const chs = [...d]; chs.forEach((ch, j) => ve1(ch, (i - (n - 1) / 2) * lh, (j - (chs.length - 1) / 2) * buoc)); }); return; }
  const k = Math.max(-1, Math.min(1, (g.cong || 0) / 100)), y0 = -(dong.length - 1) * lh / 2;
  dong.forEach((d, i) => { const chs = [...d], ws = chs.map(ch => ctx.measureText(ch).width + gian), w = Math.max(1, ws.reduce((a, b) => a + b, 0) - gian), R = Math.max(w / (Math.PI * Math.abs(k)), size), yy = y0 + i * lh; let pos = -w / 2;
    chs.forEach((ch, j) => { const c0 = pos + (ws[j] - gian) / 2; pos += ws[j]; const a = c0 / R; if (k > 0) ve1(ch, R * Math.sin(a), yy + R - R * Math.cos(a), a); else ve1(ch, R * Math.sin(a), yy - R + R * Math.cos(a), -a); }); });
}
function veChuThem(n, g, mau) {
  const l = el('label'); l.appendChild(el('span', null, 'Chuyển màu (gradient)')); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!g.mau2; cb.onchange = () => { luuHoanTac(); if (cb.checked) g.mau2 = '#22d3df'; else delete g.mau2; veKhung(); veProp(); }; l.appendChild(cb); n.appendChild(l);
  if (g.mau2) { mau('Màu thứ hai', 'mau2', '#22d3df'); oTruot(n, 'Hướng chuyển màu', 0, 360, 1, g.gocMau || 0, v => Math.round(v) + '°', v => { g.gocMau = v; }); }
  oTruot(n, 'Uốn cong', -100, 100, 1, g.cong || 0, v => (v > 0 ? '∩ ' : v < 0 ? '∪ ' : '') + Math.abs(Math.round(v)), v => { if (v) g.cong = v; else delete g.cong; });
  const l2 = el('label'); l2.appendChild(el('span', null, 'Chữ dọc')); const c2 = el('input'); c2.type = 'checkbox'; c2.checked = !!g.doc; c2.onchange = () => { luuHoanTac(); if (c2.checked) g.doc = true; else delete g.doc; veKhung(); }; l2.appendChild(c2); n.appendChild(l2);
}
function khoiTaoDot2() {
  // thay đoạn bằng file mới
  const tin = el('input'); tin.type = 'file'; tin.id = 'thayIn'; tin.accept = 'video/*,image/*'; tin.hidden = true; document.body.appendChild(tin);
  tin.onchange = async e => { const f = e.target.files[0]; e.target.value = ''; const tc = P.thayCho; P.thayCho = null; if (!f || !tc) return; await themFile([f]); const s = [...P.srcs].reverse().find(z => z.ten === f.name); if (s) thayDoan(tc.k, tc.i, s.id); };
  // track: tên + solo
  const veTrNutCu = veTrNut; veTrNut = function () { veTrNutCu(); $$('.track').forEach(tr => { const k = tr.dataset.track, o = trO(k), lb = tr.querySelector('.lb'); tr.classList.toggle('solo', !!o.solo); tr.classList.toggle('anSolo', !o.an && !o.tat && (soloAn(k) || soloTat(k))); if (!lb) return; let s = lb.querySelector('.trTen'); if (o.ten) { if (!s) { s = el('span', 'trTen'); lb.insertBefore(s, lb.firstChild); } s.textContent = o.ten; s.title = o.ten; } else if (s) s.remove(); if (!lb.dataset.dk) { lb.dataset.dk = 1; lb.addEventListener('dblclick', ev => { ev.stopPropagation(); doiTenTr(tr.dataset.track); }); } }); };
  veTrNut();
}

/* ═════════ ĐẶC TẢ CAPCUT 9.1 · ĐỢT 3 (chạy trên máy): cắt theo cảnh, bám vật thể, hình vẽ, giảm tiếng ồn, biểu đồ đường/vùng + CSV, phụ đề song ngữ, scopes, bánh xe màu, đường cong, HSL ═════════ */
/* ── 2.2 Cắt theo cảnh: so sánh biểu đồ màu + điểm ảnh giữa các khung nhỏ ── */
async function doCanhSrc(s, nhay) {
  if (!s || s.loai !== 'video' || !s.el) return []; nhay = nhay || 1; const khoa = 'canh' + nhay; if (s[khoa]) return s[khoa];
  const v = elPhu(s, 'elCanh'), c = document.createElement('canvas'); c.width = 48; c.height = 27; const g = c.getContext('2d', { willReadFrequently: true });
  const dai = s.giay || v.duration || 0, buoc = dai > 300 ? 1 : dai > 90 ? 0.5 : 0.2, ds = []; let truoc = null, anhTruoc = null;
  for (let t = 0; t < dai - 0.05; t += buoc) {
    await seekTo(v, t); g.drawImage(v, 0, 0, 48, 27); const d = g.getImageData(0, 0, 48, 27).data, h = new Float32Array(48), n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { h[d[i] >> 4] += 1 / n; h[16 + (d[i + 1] >> 4)] += 1 / n; h[32 + (d[i + 2] >> 4)] += 1 / n; }
    if (truoc) { let a = 0, b = 0; for (let k = 0; k < 48; k++) a += Math.abs(h[k] - truoc[k]); for (let i = 0; i < d.length; i += 4) b += Math.abs(d[i] - anhTruoc[i]) + Math.abs(d[i + 1] - anhTruoc[i + 1]) + Math.abs(d[i + 2] - anhTruoc[i + 2]); ds.push([t, a / 6 + b / (n * 765)]); }
    truoc = h; anhTruoc = d; if (ds.length % 20 === 0) { const tt = $('#srcStatus'); if (tt) tt.textContent = 'Đang dò cảnh ' + s.ten + ' · ' + Math.round(t / dai * 100) + '%'; await new Promise(r => setTimeout(r, 0)); }
  }
  const vs = ds.map(x => x[1]).sort((a, b) => a - b), med = vs[Math.floor(vs.length / 2)] || 0, nguong = Math.max(0.12, med * 5) / nhay, cat = [];
  ds.forEach(([t, v2], i) => { const ln = Math.max(ds[i - 1] ? ds[i - 1][1] : 0, ds[i + 1] ? ds[i + 1][1] : 0); if (v2 > nguong && v2 > ln * 1.3 && (!cat.length || t - cat[cat.length - 1] > 0.6)) cat.push(+(t - buoc / 2).toFixed(2)); });
  const tt = $('#srcStatus'); if (tt) tt.textContent = ''; s[khoa] = cat; return cat;
}
async function catTheoCanh(i) {
  const c = P.clips[i], s = c && srcCua(c.src); if (!s || s.loai !== 'video') { toast('Chỉ dò cảnh được đoạn video'); return 0; } if (c.cong) { toast('Bỏ đường cong tốc độ trước khi cắt theo cảnh'); return 0; }
  toast('Đang dò cảnh trong ' + s.ten + '…'); const cat = (await doCanhSrc(s)).filter(t => t > c.bd + 0.3 && t < c.kt - 0.3); if (!cat.length) { toast('Không thấy chỗ đổi cảnh rõ trong đoạn này'); return 0; }
  luuHoanTac(); const toc = tocC(c), dsOff = cat.map(t => c.dao ? (c.kt - t) / toc : (t - c.bd) / toc).sort((a, b) => b - a); dsOff.forEach(off => tachV1(i, off));
  veTl(); veLoi(); veKhung(); toast('Đã tách thành ' + (cat.length + 1) + ' cảnh'); return cat.length;
}
/* ── 5.1 Bám vật thể (motion tracking): khớp mẫu trên khung đã dựng, chữ/sticker đi theo ── */
async function bamVatThe(g) {
  const W = 180, H = Math.round(180 * cv.height / cv.width), c2 = Object.assign(document.createElement('canvas'), { width: W, height: H }), gx = c2.getContext('2d', { willReadFrequently: true });
  const fps = 10, N = Math.max(2, Math.ceil((g.kt - g.bd) * fps)), R = 9, S = 12, dX = g.bamX == null ? (g.x == null ? 0.5 : g.x) : g.bamX, dY = g.bamY == null ? (g.y == null ? 0.32 : g.y) : g.bamY;
  const xam = () => { const d = gx.getImageData(0, 0, W, H).data, o = new Float32Array(W * H); for (let i = 0; i < o.length; i++) o[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114; return o; };
  const vi = P.gfx.indexOf(g), luuAn = P.gfx.slice(); P.gfx = P.gfx.filter(x => x !== g && !(x.kieu === 'chu' || x.kieu === 'sticker')); const pdCu = $('#phuDe').checked; $('#phuDe').checked = false;
  let x = dX * W, y = dY * H, mau = null; const duong = [{ t: 0, dx: 0, dy: 0 }];
  try {
    await chuanBiVe();
    for (let n = 0; n < N; n++) {
      if (P.huyBam) break; await veKhungXuat(gx, W, H, Math.min(g.kt - 0.001, g.bd + n / fps)); const a = xam();
      const lay = (cx, cy) => { const o = new Float32Array((2 * R + 1) ** 2); let k = 0, tb = 0; for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const xx = Math.max(0, Math.min(W - 1, Math.round(cx + i))), yy = Math.max(0, Math.min(H - 1, Math.round(cy + j))); o[k] = a[yy * W + xx]; tb += o[k++]; } tb /= o.length; for (let q = 0; q < o.length; q++) o[q] -= tb; return o; };
      if (!mau) { mau = lay(x, y); continue; }
      let tot = 1e18, bx = x, by = y; for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) { const p = lay(x + dx, y + dy); let sad = 0; for (let q = 0; q < p.length; q++) sad += Math.abs(p[q] - mau[q]); sad += (dx * dx + dy * dy) * 2; if (sad < tot) { tot = sad; bx = x + dx; by = y + dy; } }
      x = bx; y = by; const moi = lay(x, y); for (let q = 0; q < mau.length; q++) mau[q] = mau[q] * 0.8 + moi[q] * 0.2;
      duong.push({ t: +(n / fps).toFixed(3), dx: +(x / W - dX).toFixed(4), dy: +(y / H - dY).toFixed(4) });
      if (n % 5 === 0) { toast('Đang bám vật thể ' + Math.round(n / N * 100) + '%'); await new Promise(r => setTimeout(r, 0)); }
    }
  } finally { P.gfx = luuAn; $('#phuDe').checked = pdCu; }
  if (vi >= 0) { luuHoanTac(); g.bam = duong; g.bamX = dX; g.bamY = dY; } veTl(); veKhung(); veProp(); toast('Đã bám ' + duong.length + ' điểm · chữ đi theo vật thể'); return duong;
}
function bamTai(g, tl) { const d = g.bam; if (!d || !d.length) return null; if (tl <= d[0].t) return d[0]; for (let i = 1; i < d.length; i++) if (tl <= d[i].t) { const a = d[i - 1], b = d[i], p = (tl - a.t) / Math.max(1e-4, b.t - a.t); return { dx: a.dx + (b.dx - a.dx) * p, dy: a.dy + (b.dy - a.dy) * p }; } return d[d.length - 1]; }
/* ── 4.3 Hình vẽ (shape) ── */
const HINH = { chu_nhat: 'Chữ nhật', tron: 'Tròn / elip', tam_giac: 'Tam giác', sao: 'Ngôi sao', tim: 'Trái tim', luc_giac: 'Lục giác', mui_ten: 'Mũi tên', duong: 'Đường thẳng' };
function duongHinh(c, kieu, w, h, bo) {
  c.beginPath();
  if (kieu === 'tron') c.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (kieu === 'tam_giac') { c.moveTo(0, -h / 2); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.closePath(); }
  else if (kieu === 'sao') { const r1 = Math.min(w, h) / 2, r2 = r1 * 0.45; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; i ? c.lineTo(Math.cos(a) * r * w / Math.min(w, h), Math.sin(a) * r * h / Math.min(w, h)) : c.moveTo(Math.cos(a) * r * w / Math.min(w, h), Math.sin(a) * r * h / Math.min(w, h)); } c.closePath(); }
  else if (kieu === 'tim') { const sx = w / 2, sy = h / 2; c.moveTo(0, sy * 0.9); c.bezierCurveTo(-sx * 1.5, -sy * 0.1, -sx * 0.6, -sy * 1.1, 0, -sy * 0.45); c.bezierCurveTo(sx * 0.6, -sy * 1.1, sx * 1.5, -sy * 0.1, 0, sy * 0.9); c.closePath(); }
  else if (kieu === 'luc_giac') { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; i ? c.lineTo(Math.cos(a) * w / 2, Math.sin(a) * h / 2) : c.moveTo(Math.cos(a) * w / 2, Math.sin(a) * h / 2); } c.closePath(); }
  else if (kieu === 'mui_ten') { const t = h * 0.36; c.moveTo(-w / 2, -t / 2); c.lineTo(w / 2 - h / 2, -t / 2); c.lineTo(w / 2 - h / 2, -h / 2); c.lineTo(w / 2, 0); c.lineTo(w / 2 - h / 2, h / 2); c.lineTo(w / 2 - h / 2, t / 2); c.lineTo(-w / 2, t / 2); c.closePath(); }
  else if (kieu === 'duong') { c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); }
  else c.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2 * (bo || 0));
}
function veHinhGfx(ctx, W, H, g, tl, dai) {
  const w = (g.w || 0.4) * W, h = (g.h || 0.25) * H, b = bamTai(g, tl), x = ((g.x == null ? 0.5 : g.x) + (b ? b.dx : 0)) * W, y = ((g.y == null ? 0.5 : g.y) + (b ? b.dy : 0)) * H, kieu = g.hinh || 'chu_nhat', ve = Math.min(1, ease(tl / Math.max(0.05, g.dVao || 0.35)));
  ctx.save(); ctx.translate(x, y); if (g.xoay) ctx.rotate(g.xoay * Math.PI / 180); ctx.globalAlpha *= g.mo == null ? 1 : g.mo; if (g.hu === 'phong') ctx.scale(ve, ve);
  duongHinh(ctx, kieu, w, h, g.bo); const day = (g.vien_day || 0) * Math.min(W, H);
  if (kieu === 'duong') { ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, day || Math.min(W, H) * 0.012); ctx.strokeStyle = g.mau === 'nhan' ? mauNhan() : (g.mau || '#22d3df'); if (g.hu === 've') { ctx.setLineDash([w * ve, w]); } ctx.stroke(); }
  else { if (g.mau !== 'khong') { ctx.fillStyle = g.mau2 ? (() => { const gr = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, g.mau || '#22d3df'); gr.addColorStop(1, g.mau2); return gr; })() : (g.mau === 'nhan' ? mauNhan() : (g.mau || '#22d3df')); ctx.fill(); } if (day > 0.3) { ctx.lineJoin = 'round'; ctx.lineWidth = day; ctx.strokeStyle = g.vien_mau || '#ffffff'; ctx.stroke(); } }
  ctx.restore(); return true;
}
/* ── 4.5 Biểu đồ đường / vùng + nhập CSV ── */
function veBieuDoDuong(ctx, W, H, g, tl, dai, mau, vung) {
  const Wt = Math.min(W, H * 0.75), muc = mucCua(g).map(x => { const m = x.match(/^(.*?)[:=]\s*(-?[\d.,]+)\s*(.*)$/); return m ? { ten: m[1].trim(), so: parseFloat(m[2].replace(',', '.')), dv: m[3] || g.phu || '' } : { ten: x, so: 0, dv: '' }; });
  const n = Math.max(1, muc.length), max = Math.max(...muc.map(m => m.so), 1), min = Math.min(0, ...muc.map(m => m.so)), x0 = W * 0.12, w = W * 0.76, h = H * 0.26, y0 = H * 0.64, size = Math.round(Wt * 0.038), p = ease(tl / Math.max(0.6, dai * 0.55));
  const X = i => x0 + (n === 1 ? w / 2 : i * w / (n - 1)), Y = v => y0 - (v - min) / Math.max(1e-6, max - min) * h;
  ctx.fillStyle = 'rgba(10,12,14,.72)'; ctx.beginPath(); ctx.roundRect(x0 - W * 0.06, y0 - h - size * 3, w + W * 0.12, h + size * 5.2, Wt * 0.04); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1; for (let k = 0; k <= 3; k++) { const yy = y0 - h * k / 3; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke(); }
  const het = p * (n - 1), pts = []; muc.forEach((m, i) => { if (i <= het + 1e-6) pts.push([X(i), Y(m.so)]); else if (i - 1 < het) { const f = het - (i - 1), a = muc[i - 1]; pts.push([X(i - 1) + (X(i) - X(i - 1)) * f, Y(a.so + (m.so - a.so) * f)]); } });
  if (vung && pts.length > 1) { const gr = ctx.createLinearGradient(0, y0 - h, 0, y0); gr.addColorStop(0, mau + 'aa'); gr.addColorStop(1, mau + '10'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(pts[0][0], y0); pts.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(pts[pts.length - 1][0], y0); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = mau; ctx.lineWidth = Wt * 0.012; ctx.lineJoin = ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; muc.forEach((m, i) => { const xx = X(i); ctx.font = '700 ' + Math.round(size * 0.78) + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(m.ten, xx, y0 + size * 1.1); if (i <= het + 1e-6) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xx, Y(m.so), Wt * 0.012, 0, 7); ctx.fill(); ctx.font = '900 ' + size + 'px ' + FONT; ctx.fillText(fmtSo(m.so, m.so) + m.dv, xx, Y(m.so) - size * 0.95); } });
  return true;
}
function docCsv(txt) { const dong = String(txt).replace(/^﻿/, '').split(/\r?\n/).map(d => d.trim()).filter(Boolean), sep = /\t/.test(dong[0]) ? '\t' : (dong[0].split(';').length > dong[0].split(',').length ? ';' : ','); const ds = dong.map(d => d.split(sep).map(x => x.trim().replace(/^"|"$/g, ''))).filter(r => r.length >= 2); const so = x => parseFloat(String(x).replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')); const ra = ds.filter(r => !isNaN(so(r[1]))).map(r => r[0] + ':' + so(r[1])); if (!ra.length) throw new Error('cần 2 cột: nhãn, số'); return ra.slice(0, 24).join('|'); }
/* ── 6.x Phụ đề song ngữ: dịch qua máy chủ AI, hiện dòng dịch dưới phụ đề ── */
const NN_DICH = { en: 'Tiếng Anh', zh: 'Tiếng Trung', ko: 'Tiếng Hàn', ja: 'Tiếng Nhật', th: 'Tiếng Thái', id: 'Tiếng Indonesia', fr: 'Tiếng Pháp', es: 'Tiếng Tây Ban Nha' };
const cauCum = c => c.tu.map(w => w.w).join(' ');
async function dichPhuDe() {
  const ds = [...new Set(cumTu().map(cauCum))].filter(Boolean); if (!ds.length) { toast('Chưa có lời thoại: bấm Hiểu footage trước'); return; }
  if (!MC.url) { toast('Cần máy chủ Cloudflare để dịch'); return; } if (!TK.token()) { TK.canCo && TK.canCo('chat'); return; }
  const nn = $('#pdNgonNgu').value, b = $('#btnDichPd'); b.disabled = true; b.textContent = 'Đang dịch…'; P.pdDich = P.pdDich && P.pdDich.nn === nn ? P.pdDich : { nn, cau: {} };
  try { const can = ds.filter(x => !P.pdDich.cau[x]); for (let i = 0; i < can.length; i += 60) { const lo = can.slice(i, i + 60), r = await (await fetch(MC.url + '/dich', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: TK.token(), dong: lo, ngon_ngu: nn }) })).json(); if (!r.ok) throw new Error(ERR[r.error] || r.error || 'lỗi'); lo.forEach((x, k) => { if (r.dich[k]) P.pdDich.cau[x] = r.dich[k]; }); }
    $('#pdSongNgu').checked = true; veKhung(); henLuu(); toast('Đã dịch ' + ds.length + ' câu sang ' + NN_DICH[nn]); }
  catch (e) { toast('Dịch lỗi: ' + (e.message || e)); } b.disabled = false; b.textContent = '🌐 Dịch phụ đề';
}
function vePhuDeDich(ctx, W, H, t, yDuoi) {
  if (!$('#pdSongNgu') || !$('#pdSongNgu').checked || !P.pdDich) return; const c = cumHienTai(t); if (!c) return; const d = P.pdDich.cau[cauCum(c)]; if (!d) return;
  const Wt = Math.min(W, H * 0.75), size = Math.round(Wt * 0.036), y = (yDuoi || H * (P.pdY || 0.78) + Wt * 0.03) + size * 1.15; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 ' + size + 'px ' + FONT;
  const dong = chiaDong(ctx, d.split(/\s+/).map(w => ({ w })), W * 0.84); dong.forEach((dd, i) => { const s = dd.map(x => x.w).join(' '), yy = y + i * size * 1.3; ctx.lineWidth = size * 0.2; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineJoin = 'round'; ctx.strokeText(s, W / 2, yy); ctx.fillStyle = '#fff'; ctx.fillText(s, W / 2, yy); }); ctx.restore();
}
/* ── 3.4 Giảm tiếng ồn: trừ phổ (spectral subtraction) theo hồ sơ ồn tự đo ── */
function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } } for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const ur = re[i + j], ui = im[i + j], vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr; re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } }
function khuOnKenh(x, muc) {
  const N = 1024, Hp = 256, win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = Math.sqrt(0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
  const F = Math.max(1, Math.ceil(x.length / Hp)), nl = new Float32Array(F), re = new Float32Array(N), im = new Float32Array(N), B = N / 2 + 1;
  const khung = f => { re.fill(0); im.fill(0); const o = f * Hp - N / 2; for (let i = 0; i < N; i++) { const k = o + i; re[i] = k >= 0 && k < x.length ? x[k] * win[i] : 0; } fft(re, im); };
  for (let f = 0; f < F; f++) { let e = 0; const o = f * Hp; for (let i = 0; i < N && o + i < x.length; i += 4) e += x[o + i] * x[o + i]; nl[f] = e; }
  const xep = [...nl.keys()].sort((a, b) => nl[a] - nl[b]), it = xep.slice(0, Math.max(3, Math.floor(F * 0.1))), on = new Float32Array(B);
  it.forEach(f => { khung(f); for (let k = 0; k < B; k++) on[k] += Math.hypot(re[k], im[k]) / it.length; });
  const a = 1 + muc * 2.5, sau = 0.04 + (1 - muc) * 0.2, y = new Float32Array(x.length);
  for (let f = 0; f < F; f++) { khung(f); for (let k = 0; k < B; k++) { const m = Math.hypot(re[k], im[k]), m2 = Math.max(m - a * on[k], sau * m), g = m > 1e-9 ? m2 / m : 0; re[k] *= g; im[k] *= g; if (k > 0 && k < N / 2) { re[N - k] = re[k]; im[N - k] = -im[k]; } }
    for (let i = 0; i < N; i++) im[i] = -im[i]; fft(re, im); const o = f * Hp - N / 2; for (let i = 0; i < N; i++) { const k = o + i; if (k >= 0 && k < y.length) y[k] += re[i] / N * win[i] / 2; } }
  return y;
}
const KHU_ON = {};
function khuOnBuf(buf, muc, khoa) { const k = khoa + ':' + muc.toFixed(2); if (KHU_ON[k]) return KHU_ON[k]; const r = new AudioBuffer({ numberOfChannels: buf.numberOfChannels, length: buf.length, sampleRate: buf.sampleRate }); for (let ch = 0; ch < buf.numberOfChannels; ch++) r.copyToChannel(khuOnKenh(buf.getChannelData(ch), muc), ch); KHU_ON[k] = r; return r; }
async function ngheKhuOn(c) { const s = srcCua(c.src); if (!s || s.loai !== 'video') return; let buf; try { buf = (await am3NapKho('src:' + s.id)).buf; } catch { toast('Chưa giải mã được âm thanh'); return; } moAm(); try { await ac.resume(); } catch { } const sr = buf.sampleRate, a = Math.floor(c.bd * sr), n = Math.min(buf.length - a, Math.floor(6 * sr)); if (n <= 0) return; const doan = new AudioBuffer({ numberOfChannels: buf.numberOfChannels, length: n, sampleRate: sr }); for (let ch = 0; ch < buf.numberOfChannels; ch++) doan.copyToChannel(buf.getChannelData(ch).subarray(a, a + n), ch); toast('Đang xử lý…'); const xl = c.khuOn ? khuOnBuf(doan, c.khuOn, 'nghe' + c.src + c.bd) : doan, nd = ac.createBufferSource(); nd.buffer = xl; nd.connect(raAc()); nd.start(); toast(c.khuOn ? 'Đang nghe 6 giây đầu đã giảm ồn' : 'Đang nghe 6 giây đầu (chưa giảm ồn)'); }
/* ── 8.x Scopes: biểu đồ màu, dạng sóng độ sáng, vectorscope ── */
let scopeT = null;
function veScope() {
  const box = $('#scopeHop'); if (!box || box.hidden) return; const nho = document.createElement('canvas'); nho.width = 120; nho.height = Math.round(120 * cv.height / cv.width); const g = nho.getContext('2d', { willReadFrequently: true }); g.drawImage(cv, 0, 0, nho.width, nho.height); const d = g.getImageData(0, 0, nho.width, nho.height).data, W = nho.width, Hn = nho.height;
  const [c1, c2, c3] = ['#scHist', '#scWave', '#scVec'].map(s => $(s)), h1 = c1.getContext('2d'), h2 = c2.getContext('2d'), h3 = c3.getContext('2d');
  const hr = new Float32Array(64), hg = new Float32Array(64), hb = new Float32Array(64); for (let i = 0; i < d.length; i += 4) { hr[d[i] >> 2]++; hg[d[i + 1] >> 2]++; hb[d[i + 2] >> 2]++; } const mx = Math.max(...hr, ...hg, ...hb, 1);
  h1.clearRect(0, 0, 160, 80); h1.fillStyle = '#0b0d10'; h1.fillRect(0, 0, 160, 80); h1.globalCompositeOperation = 'lighter'; [[hr, '#ff3b3b'], [hg, '#3bff6a'], [hb, '#3b8bff']].forEach(([h, m]) => { h1.fillStyle = m; h1.globalAlpha = 0.7; for (let k = 0; k < 64; k++) { const v = Math.sqrt(h[k] / mx) * 78; h1.fillRect(k * 2.5, 80 - v, 2.5, v); } }); h1.globalCompositeOperation = 'source-over'; h1.globalAlpha = 1;
  h2.fillStyle = '#0b0d10'; h2.fillRect(0, 0, 160, 80); h2.fillStyle = 'rgba(160,255,190,.18)'; for (let y = 0; y < Hn; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, l = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722; h2.fillRect(x / W * 160, 79 - l / 255 * 78, 1.4, 1.4); } h2.strokeStyle = 'rgba(255,255,255,.15)'; [0.1, 0.5, 0.9].forEach(f => { h2.beginPath(); h2.moveTo(0, 80 - f * 78); h2.lineTo(160, 80 - f * 78); h2.stroke(); });
  h3.fillStyle = '#0b0d10'; h3.fillRect(0, 0, 80, 80); h3.strokeStyle = 'rgba(255,255,255,.18)'; h3.beginPath(); h3.arc(40, 40, 38, 0, 7); h3.stroke(); h3.beginPath(); h3.moveTo(40, 40); h3.lineTo(40 - 38 * 0.63, 40 - 38 * 0.77); h3.stroke();   // vạch màu da
  for (let i = 0; i < d.length; i += 8) { const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255, u = -0.147 * r - 0.289 * gg + 0.436 * b, v = 0.615 * r - 0.515 * gg - 0.1 * b; h3.fillStyle = 'rgba(' + d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ',.5)'; h3.fillRect(40 + u * 80, 40 - v * 62, 1.3, 1.3); }
}
/* ── 3.2 Bánh xe màu (lift/gamma/gain), đường cong RGB, HSL 8 dải ── */
const DAI_HSL = [['do', 'Đỏ', 0, '#ff3b3b'], ['cam', 'Cam', 30, '#ff8a1f'], ['vang', 'Vàng', 60, '#ffd400'], ['xanh_la', 'Xanh lá', 120, '#3bd16f'], ['xanh_ngoc', 'Xanh ngọc', 180, '#22d3df'], ['xanh_duong', 'Xanh dương', 240, '#3b6bff'], ['tim', 'Tím', 275, '#9b5bff'], ['hong', 'Hồng', 315, '#ff4fb8']];
function monoCubic(pts) { const p = pts.slice().sort((a, b) => a[0] - b[0]), n = p.length; if (n < 2) return x => x; const dx = [], m = [], t = []; for (let i = 0; i < n - 1; i++) { dx.push(p[i + 1][0] - p[i][0]); m.push((p[i + 1][1] - p[i][1]) / Math.max(1e-6, dx[i])); } t[0] = m[0]; t[n - 1] = m[n - 2]; for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2; for (let i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; } const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; } }
  return x => { if (x <= p[0][0]) return p[0][1]; if (x >= p[n - 1][0]) return p[n - 1][1]; let i = 0; while (x > p[i + 1][0]) i++; const h = dx[i], s = (x - p[i][0]) / h, s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * p[i][1] + (s3 - 2 * s2 + s) * h * t[i] + (-2 * s3 + 3 * s2) * p[i + 1][1] + (s3 - s2) * h * t[i + 1]; }; }
const CONG_MD = [[0, 0], [1, 1]];
function congTex(gl, cm) { const khoa = JSON.stringify(cm); MAU_GL.cong = MAU_GL.cong || {}; if (MAU_GL.cong[khoa]) return MAU_GL.cong[khoa]; const f = ['m', 'r', 'g', 'b'].map(k => monoCubic(cm[k] && cm[k].length >= 2 ? cm[k] : CONG_MD)), px = new Uint8Array(256 * 4); for (let i = 0; i < 256; i++) { const v = f[0](i / 255); px[i * 4] = Math.round(Math.max(0, Math.min(1, f[1](Math.max(0, Math.min(1, v))))) * 255); px[i * 4 + 1] = Math.round(Math.max(0, Math.min(1, f[2](Math.max(0, Math.min(1, v))))) * 255); px[i * 4 + 2] = Math.round(Math.max(0, Math.min(1, f[3](Math.max(0, Math.min(1, v))))) * 255); px[i * 4 + 3] = 255; }
  const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, px); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)); [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR)); gl.activeTexture(gl.TEXTURE0);
  const ks = Object.keys(MAU_GL.cong); if (ks.length > 30) { gl.deleteTexture(MAU_GL.cong[ks[0]]); delete MAU_GL.cong[ks[0]]; } MAU_GL.cong[khoa] = t; return t; }
const mauBanh = o => { if (!o) return [0, 0, 0, 0]; const h = (o.h || 0) * Math.PI / 180, r = Math.cos(h), gg = Math.cos(h - 2.0944), b = Math.cos(h + 2.0944), s = o.s || 0; return [r * s, gg * s, b * s, o.l || 0]; };
function datUniformMauNangCao(gl, c) {
  const pr = MAU_GL.pr, u4 = (n, v) => gl.uniform4fv(gl.getUniformLocation(pr, n), v); const bx = c.banh || {}; u4('lift', mauBanh(bx.toi)); u4('gam', mauBanh(bx.giua)); u4('gain', mauBanh(bx.sang));
  const h = new Float32Array(24); DAI_HSL.forEach(([k], i) => { const o = (c.hsl || {})[k] || {}; h[i * 3] = (o.h || 0) / 360; h[i * 3 + 1] = (o.s || 0) / 100; h[i * 3 + 2] = (o.l || 0) / 100; }); gl.uniform3fv(gl.getUniformLocation(pr, 'hsl'), h); gl.uniform1f(gl.getUniformLocation(pr, 'coHsl'), c.hsl && Object.keys(c.hsl).length ? 1 : 0);
  if (c.cmau && Object.keys(c.cmau).some(k => c.cmau[k] && c.cmau[k].length > 2 || JSON.stringify(c.cmau[k]) !== JSON.stringify(CONG_MD))) { const t = congTex(gl, c.cmau); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, t); gl.activeTexture(gl.TEXTURE0); gl.uniform1f(gl.getUniformLocation(pr, 'coCong'), 1); } else gl.uniform1f(gl.getUniformLocation(pr, 'coCong'), 0);
}
function veBanhXe(box, c) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Bánh xe màu')); box.appendChild(n); const hang = el('div', 'banhHang'); n.appendChild(hang); const BX = () => (c.banh = c.banh || {});
  [['toi', 'Vùng tối (lift)'], ['giua', 'Trung tính (gamma)'], ['sang', 'Vùng sáng (gain)']].forEach(([k, ten]) => {
    const o = (c.banh || {})[k] || { h: 0, s: 0, l: 0 }, cot = el('div', 'banh'), cvx = el('canvas'); cvx.width = cvx.height = 84; cot.appendChild(cvx); cot.appendChild(el('small', null, ten)); hang.appendChild(cot);
    const ve = () => { const g = cvx.getContext('2d'), im = g.createImageData(84, 84); for (let y = 0; y < 84; y++) for (let x = 0; x < 84; x++) { const dx = (x - 42) / 40, dy = (y - 42) / 40, r = Math.hypot(dx, dy), i = (y * 84 + x) * 4; if (r > 1) { im.data[i + 3] = 0; continue; } const a = Math.atan2(-dy, dx), q = [Math.cos(a), Math.cos(a - 2.0944), Math.cos(a + 2.0944)]; for (let j = 0; j < 3; j++) im.data[i + j] = 128 + q[j] * r * 110; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); const cur = (c.banh || {})[k] || o, a = (cur.h || 0) * Math.PI / 180; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(42 + Math.cos(a) * (cur.s || 0) * 40, 42 - Math.sin(a) * (cur.s || 0) * 40, 5, 0, 7); g.stroke(); };
    ve(); let keo = false; const dat = e => { const r = cvx.getBoundingClientRect(), dx = (e.clientX - r.left - r.width / 2) / (r.width / 2 * 40 / 42), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2 * 40 / 42), s = Math.min(1, Math.hypot(dx, dy)); BX()[k] = { ...(BX()[k] || {}), h: Math.round(Math.atan2(-dy, dx) * 180 / Math.PI), s: +s.toFixed(3) }; ve(); if (!P.dang) veKhung(); };
    cvx.onpointerdown = e => { luuHoanTac(); keo = true; try { cvx.setPointerCapture(e.pointerId); } catch { } dat(e); }; cvx.onpointermove = e => { if (keo) dat(e); }; cvx.onpointerup = () => { keo = false; }; cvx.ondblclick = () => { luuHoanTac(); if (c.banh) { delete c.banh[k]; if (!Object.keys(c.banh).length) delete c.banh; } ve(); veKhung(); veProp(); }; cvx.title = 'Kéo để đẩy màu · bấm đúp để đặt lại';
    const r = el('input'); r.type = 'range'; r.min = -1; r.max = 1; r.step = 0.01; r.value = o.l || 0; r.title = 'Độ sáng vùng'; r.oninput = () => { if (!r._luu) { luuHoanTac(); r._luu = 1; } BX()[k] = { ...(BX()[k] || { h: 0, s: 0 }), l: +r.value }; if (!P.dang) veKhung(); }; r.onchange = () => { r._luu = 0; }; cot.appendChild(r);
  });
}
function veDuongCong(box, c) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Đường cong')); box.appendChild(n); let kenh = P.kenhCong || 'm';
  const r = el('div', 'row'); [['m', 'Tổng', '#fff'], ['r', 'R', '#ff3b3b'], ['g', 'G', '#3bd16f'], ['b', 'B', '#3b8bff']].forEach(([k, t, m]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.style.color = m; b.setAttribute('aria-pressed', String(k === kenh)); b.onclick = () => { P.kenhCong = k; veProp(); }; r.appendChild(b); }); n.appendChild(r);
  const cvx = el('canvas', 'congCv'); cvx.width = cvx.height = 200; n.appendChild(cvx); n.appendChild(el('div', 'quota', 'Bấm để thêm điểm, kéo để chỉnh, bấm đúp vào điểm để xoá.'));
  const ds = () => ((c.cmau || {})[kenh] && c.cmau[kenh].length >= 2 ? c.cmau[kenh] : CONG_MD.map(p => p.slice()));
  const ve = () => { const g = cvx.getContext('2d'); g.fillStyle = '#101216'; g.fillRect(0, 0, 200, 200); g.strokeStyle = 'rgba(255,255,255,.1)'; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * 50, 0); g.lineTo(i * 50, 200); g.moveTo(0, i * 50); g.lineTo(200, i * 50); g.stroke(); } const p = ds(), f = monoCubic(p); g.strokeStyle = { m: '#fff', r: '#ff3b3b', g: '#3bd16f', b: '#3b8bff' }[kenh]; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 200; x++) { const y = 200 - Math.max(0, Math.min(1, f(x / 200))) * 200; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.fillStyle = '#fff'; p.forEach(([x, y]) => { g.beginPath(); g.arc(x * 200, 200 - y * 200, 4, 0, 7); g.fill(); }); };
  ve(); let keo = -1; const toaDo = e => { const r2 = cvx.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r2.left) / r2.width)), Math.max(0, Math.min(1, 1 - (e.clientY - r2.top) / r2.height))]; };
  cvx.onpointerdown = e => { const [x, y] = toaDo(e), p = ds(); luuHoanTac(); let i = p.findIndex(q => Math.abs(q[0] - x) < 0.04 && Math.abs(q[1] - y) < 0.06); if (i < 0) { p.push([+x.toFixed(3), +y.toFixed(3)]); p.sort((a, b) => a[0] - b[0]); i = p.findIndex(q => q[0] === +x.toFixed(3)); } (c.cmau = c.cmau || {})[kenh] = p; keo = i; try { cvx.setPointerCapture(e.pointerId); } catch { } ve(); if (!P.dang) veKhung(); };
  cvx.onpointermove = e => { if (keo < 0) return; const [x, y] = toaDo(e), p = c.cmau[kenh], lo = keo > 0 ? p[keo - 1][0] + 0.01 : 0, hi = keo < p.length - 1 ? p[keo + 1][0] - 0.01 : 1; p[keo] = [+(keo === 0 ? 0 : keo === p.length - 1 ? 1 : Math.max(lo, Math.min(hi, x))).toFixed(3), +y.toFixed(3)]; ve(); if (!P.dang) veKhung(); };
  cvx.onpointerup = () => { keo = -1; }; cvx.ondblclick = e => { const [x, y] = toaDo(e), p = ds(), i = p.findIndex(q => Math.abs(q[0] - x) < 0.04 && Math.abs(q[1] - y) < 0.08); if (i > 0 && i < p.length - 1) { luuHoanTac(); p.splice(i, 1); (c.cmau = c.cmau || {})[kenh] = p; ve(); veKhung(); } };
  const dl = el('button', 'btn nho ghost', 'Đặt lại đường cong'); dl.type = 'button'; dl.onclick = () => { luuHoanTac(); delete c.cmau; veProp(); veKhung(); }; n.appendChild(dl);
}
function veHsl(box, c) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'HSL')); box.appendChild(n); const chon = P.daiHsl || 'do', r = el('div', 'row hslChip');
  DAI_HSL.forEach(([k, t, , m]) => { const b = el('button', 'btn nho'); b.type = 'button'; b.title = t; b.style.background = m; b.setAttribute('aria-pressed', String(k === chon)); if ((c.hsl || {})[k]) b.textContent = '•'; b.onclick = () => { P.daiHsl = k; veProp(); }; r.appendChild(b); }); n.appendChild(r);
  const o = () => { c.hsl = c.hsl || {}; return (c.hsl[chon] = c.hsl[chon] || {}); }, don = () => { const x = c.hsl && c.hsl[chon]; if (x && !x.h && !x.s && !x.l) delete c.hsl[chon]; if (c.hsl && !Object.keys(c.hsl).length) delete c.hsl; };
  oTruot(n, 'Sắc độ', -60, 60, 1, ((c.hsl || {})[chon] || {}).h || 0, v => Math.round(v) + '°', v => { o().h = v; don(); });
  oTruot(n, 'Bão hoà', -100, 100, 1, ((c.hsl || {})[chon] || {}).s || 0, sgn, v => { o().s = v; don(); });
  oTruot(n, 'Độ sáng', -100, 100, 1, ((c.hsl || {})[chon] || {}).l || 0, sgn, v => { o().l = v; don(); });
}
/* thuộc tính đồ hoạ: hình vẽ, biểu đồ CSV, bám vật thể */
function veThuocTinhGfx3(box, g) {
  if (!g) return; const n = el('div', 'nhom2');
  if (g.kieu === 'hinh') { n.appendChild(el('b', null, 'Hình vẽ')); box.appendChild(n);
    oChon(n, 'Hình', Object.keys(HINH).map(k => [k, HINH[k]]), g.hinh || 'chu_nhat', v => { g.hinh = v; });
    const mau = (nhan, p, md) => { const l = el('label'); l.appendChild(el('span', null, nhan)); const m = el('input'); m.type = 'color'; m.value = /^#/.test(g[p] || '') ? g[p] : md; m.oninput = () => { if (!m._luu) { luuHoanTac(); m._luu = 1; } g[p] = m.value; veKhung(); }; m.onchange = () => { m._luu = 0; }; l.appendChild(m); n.appendChild(l); };
    mau('Màu tô', 'mau', '#22d3df'); { const l = el('label'); l.appendChild(el('span', null, 'Không tô (chỉ viền)')); const cb = el('input'); cb.type = 'checkbox'; cb.checked = g.mau === 'khong'; cb.onchange = () => { luuHoanTac(); g.mau = cb.checked ? 'khong' : '#22d3df'; if (cb.checked && !g.vien_day) g.vien_day = 0.01; veKhung(); veProp(); }; l.appendChild(cb); n.appendChild(l); }
    mau('Màu viền', 'vien_mau', '#ffffff'); oTruot(n, 'Độ dày viền', 0, 0.05, 0.001, g.vien_day || 0, v => (v * 100).toFixed(1) + '%', v => { g.vien_day = v; });
    oTruot(n, 'Rộng', 0.02, 1.2, 0.005, g.w || 0.4, pct, v => { g.w = v; }); oTruot(n, 'Cao', 0.01, 1.2, 0.005, g.h || 0.25, pct, v => { g.h = v; });
    oTruot(n, 'Vị trí ngang', 0, 1, 0.005, g.x == null ? 0.5 : g.x, pct, v => { g.x = v; }); oTruot(n, 'Vị trí dọc', 0, 1, 0.005, g.y == null ? 0.5 : g.y, pct, v => { g.y = v; });
    oTruot(n, 'Xoay', -180, 180, 1, g.xoay || 0, v => Math.round(v) + '°', v => { g.xoay = v; }); if ((g.hinh || 'chu_nhat') === 'chu_nhat') oTruot(n, 'Bo góc', 0, 1, 0.01, g.bo || 0, pct, v => { g.bo = v; }); oTruot(n, 'Độ mờ', 0, 1, 0.01, g.mo == null ? 1 : g.mo, pct, v => { g.mo = v; });
    oChon(n, 'Hiện ra', [['mo', 'Mờ dần'], ['phong', 'Phóng to'], ['ve', 'Vẽ dần (đường thẳng)']], g.hu || 'mo', v => { g.hu = v; }); }
  if (/^bieu_do_(cot|duong|vung)$/.test(g.kieu)) { n.appendChild(el('b', null, 'Dữ liệu biểu đồ')); box.appendChild(n); const l = el('label', 'btn nho'); l.style.cursor = 'pointer'; l.textContent = '📄 Nhập CSV (nhãn, số)'; const f = el('input'); f.type = 'file'; f.accept = '.csv,.tsv,.txt,text/csv'; f.hidden = true; f.onchange = async () => { const x = f.files[0]; if (!x) return; try { const t = docCsv(await x.text()); luuHoanTac(); g.text = t; veTl(); veKhung(); veProp(); toast('Đã nhập ' + t.split('|').length + ' dòng từ CSV'); } catch (e) { toast('CSV lỗi: ' + e.message); } }; l.appendChild(f); n.appendChild(l);
    oChon(n, 'Kiểu biểu đồ', [['bieu_do_cot', 'Cột'], ['bieu_do_duong', 'Đường'], ['bieu_do_vung', 'Vùng']], g.kieu, v => { g.kieu = v; }); }
  if (g.kieu === 'chu' || g.kieu === 'sticker' || g.kieu === 'hinh') { const m = el('div', 'nhom2'); m.appendChild(el('b', null, 'Bám vật thể')); box.appendChild(m);
    m.appendChild(el('div', 'quota', g.bam ? '✓ Đang bám ' + g.bam.length + ' điểm. Dời chữ thì vẫn giữ khoảng cách với vật thể.' : 'Đặt điểm bám lên vật thể (mặc định là tâm chữ/hình), rồi bấm Bám. Máy dò trên khung đã dựng, 10 điểm/giây.'));
    oTruot(m, 'Điểm bám ngang', 0, 1, 0.005, g.bamX == null ? (g.x == null ? 0.5 : g.x) : g.bamX, pct, v => { g.bamX = v; }); oTruot(m, 'Điểm bám dọc', 0, 1, 0.005, g.bamY == null ? (g.y == null ? 0.5 : g.y) : g.bamY, pct, v => { g.bamY = v; });
    const r = el('div', 'row'), b = el('button', 'btn nho xanh', '🎯 Bám theo vật thể'); b.type = 'button'; b.onclick = async () => { b.disabled = true; P.huyBam = false; try { await bamVatThe(g); } catch (e) { toast('Bám lỗi: ' + (e.message || e)); } b.disabled = false; }; r.appendChild(b);
    if (g.bam) { const x = el('button', 'btn nho ghost', 'Bỏ bám'); x.type = 'button'; x.onclick = () => { luuHoanTac(); delete g.bam; veKhung(); veProp(); }; r.appendChild(x); } m.appendChild(r); }
}
function veKhuOn(n3, c) {
  oTruot(n3, 'Giảm tiếng ồn', 0, 1, 0.05, c.khuOn || 0, v => v ? Math.round(v * 100) + '%' : 'tắt', v => { if (v) c.khuOn = v; else delete c.khuOn; });
  const r = el('div', 'row'), b = el('button', 'btn nho', '🎧 Nghe thử 6 giây'); b.type = 'button'; b.title = 'Nghe đoạn đầu sau khi giảm ồn (áp khi xuất video và WAV)'; b.onclick = () => ngheKhuOn(c); r.appendChild(b); n3.appendChild(r);
}
function khoiTaoDot3() {
  $('#btnDichPd').onclick = dichPhuDe; $('#pdSongNgu').onchange = () => veKhung();
  $('#btnScope').onclick = () => { const h = $('#scopeHop'); h.hidden = !h.hidden; $('#btnScope').setAttribute('aria-pressed', String(!h.hidden)); clearInterval(scopeT); if (!h.hidden) { veScope(); scopeT = setInterval(veScope, 300); } };
}

/* ═════════ PHỤ ĐỀ LÀ ĐOẠN CHỮ NHƯ CAPCUT: chọn, sửa chữ, kéo dời, kéo mép, xoá, tách ═════════ */
function dsPd() { cumHienTai(0); return cumCache || []; }
function lamMoiPd() { cumKey = ''; veTl(); if (!P.dang) veKhung(); }
function chuyenPdDocLap(im) {
  if (P.pdNgoai && P.pdNgoai.length) return false; const ds = cumTu(); if (!ds.length) return false;
  P.pdNgoai = ds.map((c, i) => { const kt = Math.min(c.kt, ds[i + 1] ? ds[i + 1].bd : c.kt); return { bd: +c.bd.toFixed(3), kt: +Math.max(c.bd + 0.1, kt).toFixed(3), text: c.tu.map(t => t.w).join(' '), tu: c.tu.map(t => ({ w: t.w, bd: +t.bd.toFixed(3), kt: +Math.min(t.kt, kt).toFixed(3) })) }; });
  $('#srtTt').textContent = 'Phụ đề đã tách thành đoạn chữ riêng (không còn bám theo cắt ghép V1).'; $('#btnBoSrt').hidden = false; cumKey = '';
  if (!im) toast('Phụ đề đã tách thành đoạn chữ riêng: kéo, cắt mép tự do như CapCut'); return true;
}
function chuanTu(o) { const ws = String(o.text || '').trim().split(/\s+/).filter(Boolean), tl = chiaTheoKyTu(ws), d = o.kt - o.bd; o.tu = ws.map((w, k) => ({ w, bd: +(o.bd + tl[k] * d).toFixed(3), kt: +(o.bd + tl[k + 1] * d).toFixed(3) })); }
/* sửa chữ: chia lại mốc từng từ theo số ký tự (từ dài đọc lâu hơn) → trả về mốc tỉ lệ 0..1, dài ws.length + 1 */
function chiaTheoKyTu(ws) { const n = ws.map(w => Math.max(1, [...String(w).replace(/[.,!?…:;"“”]/g, '')].length)), tong = n.reduce((a, b) => a + b, 0) || 1; let a = 0; return [0, ...n.map(x => (a += x) / tong)]; }
function suaPd(i, text) {
  const c = dsPd()[i]; if (!c) return; text = String(text).replace(/\s+/g, ' ').trim();
  if (c.ng != null) { const o = P.pdNgoai[c.ng]; o.text = text; chuanTu(o); }
  else { const s = srcCua(c.s), w = c.w || []; if (!s || !w.length || !text) return; const i0 = s.tu.indexOf(w[0]), i1 = s.tu.indexOf(w[w.length - 1]); if (i0 < 0 || i1 < i0) return; const cu = { text, bd: w[0].bd, kt: w[w.length - 1].kt, i0, i1 }; suaTu(s, cu); const nh = w[0].nhom || 'n' + uid(); for (let k = i0; k <= cu.i1; k++) s.tu[k].nhom = nh; }
  cumKey = ''; veTl(); if (!P.dang) veKhung();
}
function xoaPd(i) {
  const c = dsPd()[i]; if (!c) return; luuHoanTac();
  if (c.ng != null) P.pdNgoai.splice(c.ng, 1); else (c.w || []).forEach(w => { w.an = true; });
  P.chon = null; lamMoiPd(); veProp(); toast('Đã xoá câu phụ đề');
}
function tachPd(i, t) {
  const c = dsPd()[i]; if (!c || t <= c.bd + 0.1 || t >= c.kt - 0.1) { toast('Đưa đầu phát vào giữa câu phụ đề rồi bấm Tách'); return; }
  luuHoanTac(); chuyenPdDocLap(true); const ds = dsPd(), c2 = ds[i], o = P.pdNgoai[c2.ng], truoc = o.tu.filter(w => (w.bd + w.kt) / 2 < t), sau = o.tu.filter(w => (w.bd + w.kt) / 2 >= t);
  const a = { bd: o.bd, kt: +t.toFixed(3), text: truoc.map(w => w.w).join(' ') || '…' }, b = { bd: +t.toFixed(3), kt: o.kt, text: sau.map(w => w.w).join(' ') || '…' };
  a.tu = truoc.length ? truoc : null; b.tu = sau.length ? sau : null; if (!a.tu) chuanTu(a); if (!b.tu) chuanTu(b);
  P.pdNgoai.splice(c2.ng, 1, a, b); lamMoiPd(); P.chon = { k: 'pd', i: i + 1 }; veProp(); toast('Đã tách câu phụ đề');
}
function keoPd(d, i) {
  d.dataset.k = 'pd'; d.dataset.i = i;
  d.addEventListener('dblclick', e => { e.stopPropagation(); P.chon = { k: 'pd', i }; veProp(); moPhaiNeuCan(); const ta = $('#pdSuaChu'); if (ta) { ta.focus(); ta.select(); } });
  d.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; e.stopPropagation(); if (trKhoa('o2')) { toast('Track đang khoá 🔒'); return; }
    if (P.dang) dung(); P.chon = { k: 'pd', i }; P.nhieu = []; $$('.track .item').forEach(x => x.classList.remove('chon')); d.classList.add('chon'); veProp(); moPhaiNeuCan();
    const r = d.getBoundingClientRect(), ox = e.clientX - r.left, mep = r.width >= 18 ? (ox < 6 ? 'l' : ox > r.width - 6 ? 'r' : '') : '', x0 = e.clientX, px = PX(); let goc = null, daKeo = false, ng = -1;
    try { d.setPointerCapture(e.pointerId); } catch { } P.dangKeo = true;
    const mv = ev => {
      const dx = (ev.clientX - x0) / px; if (!daKeo) { if (Math.abs(ev.clientX - x0) < 4) return; daKeo = true; luuHoanTac(); chuyenPdDocLap(); ng = dsPd()[i] ? dsPd()[i].ng : -1; if (ng == null || ng < 0) return; goc = JSON.parse(JSON.stringify(P.pdNgoai[ng])); }
      if (!goc) return; const o = P.pdNgoai[ng], tr = P.pdNgoai[ng - 1], sa = P.pdNgoai[ng + 1], lo = tr ? tr.bd + 0.2 : 0, hi = sa ? sa.kt - 0.2 : Math.max(tongGiay(), goc.kt) + 30;
      if (!goc.tr && tr) goc.tr = JSON.parse(JSON.stringify(tr)); if (!goc.sa && sa) goc.sa = JSON.parse(JSON.stringify(sa));
      if (mep === 'l') { o.bd = +Math.max(lo, Math.min(goc.kt - 0.2, hit(goc.bd + dx))).toFixed(3); }
      else if (mep === 'r') { o.kt = +Math.min(hi, Math.max(goc.bd + 0.2, hit(goc.kt + dx))).toFixed(3); }
      else { const len = goc.kt - goc.bd; let b = hit(goc.bd + dx); b = Math.max(lo, Math.min(hi - len, b)); o.bd = +b.toFixed(3); o.kt = +(b + len).toFixed(3); }
      const coGian = (x, g0) => { const k = (x.kt - x.bd) / Math.max(1e-3, g0.kt - g0.bd); x.tu = (g0.tu || []).map(w => ({ w: w.w, bd: +(x.bd + (w.bd - g0.bd) * k).toFixed(3), kt: +(x.bd + (w.kt - g0.bd) * k).toFixed(3) })); if (!x.tu.length) chuanTu(x); };
      coGian(o, goc);   // đè lên câu bên cạnh thì câu đó tự ngắn lại (như CapCut ghi đè)
      if (tr && goc.tr) { Object.assign(tr, JSON.parse(JSON.stringify(goc.tr))); if (tr.kt > o.bd) { tr.kt = o.bd; coGian(tr, goc.tr); } }
      if (sa && goc.sa) { Object.assign(sa, JSON.parse(JSON.stringify(goc.sa))); if (sa.bd < o.kt) { sa.bd = o.kt; coGian(sa, goc.sa); } }
      d.style.left = o.bd * px + 'px'; d.style.width = Math.max(4, (o.kt - o.bd) * px - 1) + 'px'; hienTip(ev, mep ? '⟷ ' + fmt1(o.kt - o.bd) + 's' : '▸ ' + fmt1(o.bd) + 's'); cumKey = '';
    };
    const up = () => { d.removeEventListener('pointermove', mv); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', up); P.dangKeo = false; if (typeof donKeo === 'function') donKeo(); if (daKeo) { lamMoiPd(); veProp(); } else { P.t = Math.max(P.t, 0); } };
    d.addEventListener('pointermove', mv); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
  });
}
function veThuocTinhPd(box, i) {
  const ds = dsPd(), c = ds[i]; if (!c) { P.chon = null; return; }
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Phụ đề')); box.appendChild(n);
  n.appendChild(el('div', 'quota', 'Câu ' + (i + 1) + '/' + ds.length + ' · ' + fmt1(c.bd) + '–' + fmt1(c.kt) + 's' + (c.ng == null ? ' · theo lời nói trong footage (sửa chữ ở đây là sửa luôn lời thoại)' : ' · đoạn chữ riêng')));
  const ta = el('textarea'); ta.id = 'pdSuaChu'; ta.rows = 3; ta.value = c.tu.map(t => t.w).join(' '); ta.spellcheck = false; let daLuu = false;
  ta.oninput = () => { if (!daLuu) { luuHoanTac(); daLuu = true; } suaPd(i, ta.value); }; ta.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ta.blur(); } if (e.key === 'Escape') ta.blur(); }; ta.onblur = () => { daLuu = false; veProp(); };
  const l = el('label', 'full'); l.appendChild(el('span', null, 'Nội dung (Enter để xong)')); l.appendChild(ta); n.appendChild(l);
  const r = el('div', 'row'), nut = (t, f, dis, tt) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.disabled = !!dis; if (tt) b.title = tt; b.onclick = f; r.appendChild(b); };
  nut('◀ Câu trước', () => { P.chon = { k: 'pd', i: i - 1 }; P.t = ds[i - 1].bd + 0.01; veKhung(); vePh(); veTl(); veProp(); }, i === 0);
  nut('Câu sau ▶', () => { P.chon = { k: 'pd', i: i + 1 }; P.t = ds[i + 1].bd + 0.01; veKhung(); vePh(); veTl(); veProp(); }, i >= ds.length - 1);
  nut('✂ Tách tại đầu phát', () => tachPd(i, P.t), P.t <= c.bd + 0.1 || P.t >= c.kt - 0.1);
  nut('🗑 Xoá câu', () => xoaPd(i)); n.appendChild(r);
  if (c.ng == null) { const r2 = el('div', 'row'); const b = el('button', 'btn nho ghost', 'Tách thành đoạn chữ riêng'); b.type = 'button'; b.title = 'Để kéo dời, cắt mép từng câu tự do (phụ đề không còn bám theo khi cắt ghép V1)'; b.onclick = () => { luuHoanTac(); chuyenPdDocLap(); lamMoiPd(); veProp(); }; r2.appendChild(b); n.appendChild(r2); }
  const n2 = el('div', 'nhom2'); n2.appendChild(el('b', null, 'Kiểu phụ đề (cho tất cả câu)')); box.appendChild(n2);
  const sao = (id, nhan) => { const goc = $('#' + id); if (!goc) return; oChon(n2, nhan, [...goc.options].map(o => [o.value, o.textContent]), goc.value, v => { goc.value = v; goc.dispatchEvent(new Event('change', { bubbles: true })); goc.dispatchEvent(new Event('input', { bubbles: true })); cumKey = ''; }); };
  sao('pdKieu', 'Kiểu chữ'); sao('pdViTri', 'Vị trí'); sao('font', 'Font');
  oTruot(n2, 'Số từ mỗi câu', 2, 6, 1, +$('#pdCum').value || 4, v => String(Math.round(v)), v => { $('#pdCum').value = Math.round(v); cumKey = ''; });
  const r3 = el('div', 'row'), b3 = el('button', 'btn nho ghost', 'Mẫu, màu nhấn, song ngữ… → tab Phụ đề'); b3.type = 'button'; b3.onclick = () => doiTab('loi'); r3.appendChild(b3); n2.appendChild(r3);
}

/* ═════════ CAPCUT 9.1 CHI TIẾT · M1: chế độ Chọn/Cắt, tách theo vùng chọn, phím Custom1, menu chuột phải đầy đủ, track, keyframe Hold ═════════ */
EASE_KF.giu = p => (p >= 1 ? 1 : 0); EASE_TEN.giu = 'Giữ (Hold)';
IC.cursor = '<path d="M5 3l13 7.5-5.5 1.5L10 18z"/>';
P.cai = Object.assign({ anh: MAC_DINH.anhGiay, dongBang: MAC_DINH.dongBangGiay, chuyen: MAC_DINH.chuyenGiay, tuLuu: true, xemTruoc: 'chat_luong' }, (() => { try { return JSON.parse(localStorage.getItem('dv_cai') || '{}'); } catch { return {}; } })());
const MAU_TAG = [['#ff4d6d', 'Đỏ'], ['#ffb020', 'Cam'], ['#ffd400', 'Vàng'], ['#3bd16f', 'Xanh lá'], ['#22d3df', 'Xanh ngọc'], ['#9b5bff', 'Tím']];
/* ── chế độ Chọn (V) / Cắt (C) ── */
function datCheDo(m, im) { P.cheDo = m; $('#tlIn').classList.toggle('cheDoCat', m === 'cat'); $('#btnCheChon').setAttribute('aria-pressed', String(m !== 'cat')); $('#btnCheCat').setAttribute('aria-pressed', String(m === 'cat')); if (!im) toast(m === 'cat' ? 'Chế độ Cắt (C): bấm lên đoạn để tách đúng chỗ bấm · V để về Chọn' : 'Chế độ Chọn (V)'); if (m !== 'cat' && $('#catLine')) $('#catLine').style.display = 'none'; }
/* tách một mục tại t (giây trên dòng thời gian) */
/* thêm keyframe nội suy tại điểm cắt (lớp phủ, chữ) để hai nửa không nhảy giá trị, giống tách V1 */
function ghimKfCat(m, off) { if (m.kfs) Object.keys(m.kfs).forEach(p => { const ds = m.kfs[p]; if (!ds || !ds.length || kfTai(m, p, off) >= 0) return; ds.push({ t: +off.toFixed(3), v: giaTriKf(m, p, off), e: 'deu' }); ds.sort((a, b) => a.t - b.t); }); }
function tachMot(k, m, t) {
  if (!m || khoaMuc(k, m)) return false;
  if (k === 'v') { const i = P.clips.indexOf(m), off = t - batDauC(m); if (m.trong || m.cong || off < 1 / fpsDuAn() - 1e-6 || off > daiC(m) - 1 / fpsDuAn() + 1e-6) return false; return tachV1(i, off); }
  if (k === 'b') { const toc = tocC(m), off = t - m.t_bd, len = (m.kt - m.bd) / toc; if (off <= 0.05 || off >= len - 0.05) return false; ghimKfCat(m, off); const cat = +(m.bd + off * toc).toFixed(3), m2 = JSON.parse(JSON.stringify(m)); m2.id = uid(); m2.bd = cat; m2.t_bd = khungGiay(t); delete m2.nhom; m.kt = cat; doiKf(m, 0); doiKf(m2, -off); P.broll.push(m2); return true; }
  if (k === 'g') { if (t <= m.bd + 0.05 || t >= m.kt - 0.05) return false; const off = t - m.bd; ghimKfCat(m, off); const m2 = JSON.parse(JSON.stringify(m)); m2.id = uid(); m2.bd = khungGiay(t); m2.boVao = true; delete m2.nhom; m.kt = khungGiay(t); m.boRa = true; doiKf(m, 0); doiKf(m2, -off); P.gfx.push(m2); return true; }
  if (k === 'a') { const off = t - m.t_bd; if (off <= 0.05 || off >= m.kt - m.bd - 0.05) return false; const giua = +(m.bd + off).toFixed(3); P.am3.push(am3Day([{ ...JSON.parse(JSON.stringify(m)), id: uid(), bd: giua, t_bd: khungGiay(t), fi: 0 }])[0]); m.kt = giua; m.fo = 0; return true; }
  return false;
}
/* Ctrl+K / Ctrl+B: tách mọi mục đang chọn tại đầu phát; không chọn gì → tách đoạn track chính dưới đầu phát */
function tachChon() {
  if (P.chon && P.chon.k === 'pd' && dsNhieu().length <= 1) { tachPd(P.chon.i, P.t); return; }
  const ds = dsNhieu().length > 1 ? dsNhieu() : (P.chon && mucChon() ? [{ k: P.chon.k, m: mucChon() }] : []);
  if (!ds.length) { P.chon = null; tachTatCa(); return; }   /* spec 1.5: không chọn gì → tách mọi track tại đầu phát */
  luuHoanTac(); let n = 0, phai = null; ds.forEach(o => { const arr = MANG()[o.k], dai0 = arr.length; if (tachMot(o.k, o.m, P.t)) { n++; phai = { k: o.k, i: arr.length > dai0 && o.k !== 'v' ? arr.length - 1 : arr.indexOf(o.m) + 1 }; } });
  if (!n) { huyHoanTac(); if (!ds.some(o => { const st = batDauMuc(o.k, o.m), d = daiMuc(o.k, o.m); return Math.abs(P.t - st) < 1e-3 || Math.abs(P.t - st - d) < 1e-3; })) toast('Đưa đầu phát vào giữa mục đang chọn rồi tách'); return; }
  P.nhieu = []; if (ds.length === 1 && phai) P.chon = phai;   /* spec 1.5: sau khi tách, nửa phải được chọn */
  veTl(); veLoi(); veKhung(); veProp(); toast('Đã tách ' + n + ' mục tại ' + fmt1(P.t) + 's');
}
/* A / Shift+A: chọn mọi mục bên trái / bên phải đầu phát */
function chonTheoDauPhat(benPhai) { const ds = moiMuc().filter(o => { const st = batDauMuc(o.k, o.m), kt = st + daiMuc(o.k, o.m); return benPhai ? kt > P.t + 0.01 : st < P.t - 0.01; }); if (!ds.length) { toast('Không có mục nào ' + (benPhai ? 'sau' : 'trước') + ' đầu phát'); return; } P.nhieu = ds; const f = ds[0]; P.chon = { k: f.k, i: MANG()[f.k].indexOf(f.m) }; veTl(); veProp(); toast('Đã chọn ' + ds.length + ' mục ' + (benPhai ? 'bên phải' : 'bên trái') + ' đầu phát'); }
function dsDangChon() { return dsNhieu().length > 1 ? dsNhieu() : (P.chon && mucChon() ? [{ k: P.chon.k, m: mucChon() }] : []); }
/* Shift+X: vùng In–Out theo mục đang chọn */
function vungTheoChon() { const ds = dsDangChon(); if (!ds.length) { toast('Chọn đoạn trước'); return; } P.vao = +Math.min(...ds.map(o => batDauMuc(o.k, o.m))).toFixed(3); P.ra = +Math.max(...ds.map(o => batDauMuc(o.k, o.m) + daiMuc(o.k, o.m))).toFixed(3); veVaoRa(); toast('Vùng In–Out ' + fmt1(P.vao) + '–' + fmt1(P.ra) + 's'); }
/* Shift+E: ẩn / hiện đoạn */
function anHienChon() { const ds = dsDangChon().filter(o => 'vbga'.includes(o.k)); if (!ds.length) { toast('Chọn đoạn trước'); return; } luuHoanTac(); const an = !ds[0].m.an; ds.forEach(o => { if (an) o.m.an = true; else delete o.m.an; }); veTl(); veKhung(); toast(an ? 'Đã ẩn ' + ds.length + ' đoạn (không hiện, không xuất)' : 'Đã hiện lại'); }
function tatTiengChon() { const ds = dsDangChon().filter(o => o.k === 'v' || o.k === 'a' || o.k === 'b'); if (!ds.length) return; luuHoanTac(); const tat = (ds[0].m.am == null ? 1 : ds[0].m.am) > 0; ds.forEach(o => { if (tat) { o.m.amCu = o.m.am == null ? 1 : o.m.am; o.m.am = 0; } else { o.m.am = o.m.amCu || 1; delete o.m.amCu; } }); veTl(); veProp(); toast(tat ? 'Đã tắt tiếng' : 'Đã bật tiếng'); }
function amLuongChon(db) { const ds = dsDangChon().filter(o => o.k === 'v' || o.k === 'a'); if (!ds.length) { toast('Chọn đoạn có âm thanh'); return; } luuHoanTac(); let cuoi = 0; ds.forEach(o => { const v = (o.m.am == null ? 1 : o.m.am) || 0.001; o.m.am = +Math.min(3.1623, Math.max(0, v * Math.pow(10, db / 20))).toFixed(4); cuoi = o.m.am; }); veProp(); toast('Âm lượng ' + (20 * Math.log10(cuoi || 1e-4)).toFixed(1) + ' dB'); }
/* xoá dồn (Ripple delete) */
function xoaDon(k, i) {
  const m = MANG()[k][i]; if (!m) return; if (k === 'v') { const rp = P.ripple; P.ripple = true; P.chon = { k, i }; lenh('xoa'); P.ripple = rp; return; }
  luuHoanTac(); const st = batDauMuc(k, m), dai = daiMuc(k, m), lop = k === 'a' ? m.lop : lopCua(k, m), cung = o => (k === 'a' ? o.k === 'a' && o.m.lop === lop : (o.k === 'b' || o.k === 'g') && lopCua(o.k, o.m) === lop);
  MANG()[k].splice(i, 1); moiMuc().filter(o => cung(o) && batDauMuc(o.k, o.m) > st - 0.01).forEach(o => datBatDau(o.k, o.m, batDauMuc(o.k, o.m) - dai)); P.chon = null; veTl(); veKhung(); veProp(); toast('Đã xoá và dồn phần sau lên ' + fmt1(dai) + 's');
}
/* đánh dấu: màu khác, mốc trước/sau, beat */
let mauMocTiep = 1;
function themMocMau() { const n = (P.moc || []).length; themMoc(); if ((P.moc || []).length > n) { const m = P.moc.find(x => Math.abs(x.t - +P.t.toFixed(2)) < 0.06); if (m) { m.mau = MAU_MOC[mauMocTiep % MAU_MOC.length][0]; mauMocTiep++; veTl(); } } }
function nhayMoc(huong) { const ds = (P.moc || []).map(m => m.t).sort((a, b) => a - b), t = huong > 0 ? ds.find(x => x > P.t + 0.02) : [...ds].reverse().find(x => x < P.t - 0.02); if (t == null) { toast('Không còn mốc ' + (huong > 0 ? 'phía sau' : 'phía trước')); return; } if (P.dang) dung(); P.t = t; veKhung(); vePh(); }
function themBeatTay() { P.beat = P.beat || []; if (P.beat.some(b => Math.abs(b - P.t) < 0.05)) { toast('Đã có beat ở đây'); return; } luuHoanTac(); P.beat.push(+P.t.toFixed(3)); P.beat.sort((a, b) => a - b); veTl(); toast('Đã đánh dấu beat tại ' + fmt1(P.t) + 's'); }
/* thêm keyframe cơ bản (vị trí, cỡ, xoay, độ mờ) */
function kfCoBan() { const k = P.chon && P.chon.k, m = mucChon(); if (!m || !'vbg'.includes(k)) { toast('Chọn đoạn video / lớp phủ trước'); return; } const o = offMuc(k, m); luuHoanTac(); ['sc', 'x', 'y', 'xoay', 'mo'].forEach(p => datKf(m, p, o, giaTriKf(m, p, o))); veProp(); veTl(); veKhung(); toast('Đã thêm keyframe cơ bản tại ' + fmt1(o) + 's của đoạn'); }
/* sao chép thuộc tính (Ctrl+Alt+C) / dán có chọn nhóm (Ctrl+Alt+V) */
const NHOM_TT = [
  ['bien_doi', 'Biến đổi (vị trí, cỡ, xoay, lật, độ mờ)', ['x', 'y', 'sc', 'xoay', 'latX', 'latY', 'mo', 'crop', 'cat']],
  ['dieu_chinh', 'Điều chỉnh màu', ['sang', 'tuong_phan', 'bao_hoa', 'lutMuc', ...MAU_KEYS]],
  ['bo_loc', 'Bộ lọc', ['loc', 'locMuc']],
  ['toc_do', 'Tốc độ', ['toc', 'cong', 'doiCao']],
  ['hoat_anh', 'Hoạt ảnh', ['anVao', 'anRa', 'anLap', 'hu', 'ra', 'lap', 'dVao', 'dRa']],
  ['mat_na', 'Mặt nạ', ['mn']],
  ['am_luong', 'Âm lượng, hiện/mờ dần, âm thanh', ['am', 'fi', 'fo', 'khuOn', 'pan', 'caoDo', 'giong']],
  ['hoa_tron', 'Hoà trộn, bo góc, viền, bóng', ['blend', 'boGoc', 'vienDay', 'vienMau', 'vienMo', 'bongMo', 'bongKieu', 'bongNhoe', 'bongKc', 'bongGoc', 'bongMau', 'bongLan']],
  ['keyframe', 'Keyframe', ['kfs']],
  ['kieu_chu', 'Kiểu chữ', ['font', 'dam', 'nghieng', 'gach', 'can', 'mau', 'mau2', 'gocMau', 'nen', 'nen_mau', 'nen_mo', 'nen_bo', 'nen_pad', 'vien_mau', 'vien_day', 'phat_sang', 'gianChu', 'dongCao', 'co', 'cong', 'doc', 'bong', 'bongChu']]];
function chepThuocTinh() { const m = mucChon(); if (!m || !P.chon) { toast('Chọn một mục để sao chép thuộc tính'); return; } P.ttNho = { k: P.chon.k, d: JSON.parse(JSON.stringify({ ...m, el: undefined, gain: undefined })) }; toast('Đã sao chép thuộc tính · chọn mục khác rồi Ctrl+Alt+V'); }
function hopDanThuocTinh() {
  const nguon = P.ttNho || P.boNho; if (!nguon || nguon.nhieu) { toast('Chưa sao chép thuộc tính (Ctrl+Alt+C)'); return; } const ds = dsDangChon(); if (!ds.length) { toast('Chọn mục cần dán thuộc tính'); return; }
  const hop = $('#ttHop'), box = $('#ttDs'); box.innerHTML = '';
  NHOM_TT.forEach(([id, ten, keys]) => { if (!keys.some(p => nguon.d[p] !== undefined) && !['bien_doi', 'dieu_chinh'].includes(id)) return; const l = el('label', 'hang'); const cb = el('input'); cb.type = 'checkbox'; cb.value = id; cb.checked = id !== 'toc_do'; l.appendChild(cb); l.appendChild(el('span', null, ten)); box.appendChild(l); });
  hop.classList.add('mo'); $('#ttOk').onclick = () => { const chon = [...box.querySelectorAll('input:checked')].map(x => x.value); hop.classList.remove('mo'); danTheoNhom(nguon, ds, chon); };
}
function danTheoNhom(nguon, ds, nhom) {
  const keys = NHOM_TT.filter(x => nhom.includes(x[0])).flatMap(x => x[2]); if (!keys.length) return; luuHoanTac(); let n = 0;
  ds.forEach(({ k, m }) => { if (m === nguon.d) return; const hinh = x => x === 'v' || x === 'b'; if (!(k === nguon.k || (hinh(k) && hinh(nguon.k)))) return; let doiToc = false, cu = 0, st = 0; if (k === 'v') { cu = daiC(m); st = batDauC(m); }
    keys.forEach(p => { if (nguon.d[p] === undefined) { if (p in m && p !== 'toc') delete m[p]; } else m[p] = JSON.parse(JSON.stringify(nguon.d[p])); if (p === 'toc' || p === 'cong') doiToc = true; }); if (k === 'v' && doiToc) ripple(st + cu, daiC(m) - cu); n++; });
  veTl(); veKhung(); veProp(); toast(n ? 'Đã dán ' + nhom.length + ' nhóm thuộc tính cho ' + n + ' mục' : 'Không dán được sang loại mục này');
}
/* trang trí mục trên dòng thời gian: tên, nhãn màu, ẩn; chiều cao track */
function trangTriTl() {
  $$('#tlIn .item[data-k][data-i]').forEach(d => { const k = d.dataset.k; if (!'vbga'.includes(k)) return; const m = (MANG()[k] || [])[+d.dataset.i]; if (!m) return; d.classList.toggle('anClip', !!m.an); d.style.borderTop = m.mauTag ? '3px solid ' + m.mauTag : ''; if (m.ten && k !== 'a') { const b = d.querySelector('b'); if (b && !b.dataset.ten) { b.dataset.ten = 1; b.textContent = m.ten + ' · ' + fmt1(daiMuc(k, m)) + 's'; } } });
  $$('#tlIn .track').forEach(tr => { const c = (P.trCao || {})[tr.dataset.track]; tr.classList.toggle('trThap', c === 'thap'); tr.classList.toggle('trCao', c === 'cao'); });
  $$('#tlIn .kfd').forEach(kd => { if (kd.dataset.mn) return; kd.dataset.mn = 1; kd.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); menuKf(ev, kd); }); });
}
function menuKf(ev, kd) {
  const it = kd.closest('.item'), k = it.dataset.k, i = +it.dataset.i, m = (MANG()[k] || [])[i]; if (!m) return; const t = +kd.dataset.t, tai = Object.keys(m.kfs || {}).map(p => (m.kfs[p] || []).find(f => Math.abs(f.t - t) < 1 / 30)).filter(Boolean);
  const datE = e => { luuHoanTac(); tai.forEach(f => { f.e = e; delete f.bz; }); veProp(); veKhung(); toast('Đường cong: ' + EASE_TEN[e]); };
  moMenu(ev.clientX, ev.clientY, [{ ic: 'kf', t: 'Tuyến tính (Linear)', f: () => datE('deu') }, { ic: 'kf', t: 'Chậm đầu (Ease in)', f: () => datE('ra') }, { ic: 'kf', t: 'Chậm cuối (Ease out)', f: () => datE('vao') }, { ic: 'kf', t: 'Mượt hai đầu (Ease in-out)', f: () => datE('mem') }, { ic: 'kf', t: 'Giữ (Hold)', f: () => datE('giu') }, '-',
    { ic: 'copy', t: 'Chép ◆', f: () => { P.chon = { k, i }; P.t = batDauMuc(k, m) + t; chepKf(k, m); } }, { ic: 'paste', t: 'Dán ◆ tại đầu phát', f: () => { P.chon = { k, i }; danKf(k, m); } }, { ic: 'trash', t: 'Xoá ◆ này', do: true, f: () => { luuHoanTac(); Object.keys(m.kfs || {}).forEach(p => { m.kfs[p] = m.kfs[p].filter(f => Math.abs(f.t - t) >= 1 / 30); if (!m.kfs[p].length) delete m.kfs[p]; }); veTl(); veProp(); veKhung(); } }]);
}
function menuNhanMau(x, y, k, i) { const m = MANG()[k][i]; moMenu(x, y, [...MAU_TAG.map(([c, t]) => ({ ic: 'mark', t: (m.mauTag === c ? '● ' : '') + t, f: () => { luuHoanTac(); m.mauTag = c; veTl(); } })), '-', { ic: 'trash', t: 'Bỏ nhãn màu', f: () => { delete m.mauTag; veTl(); } }]); }
function doiTenMuc(k, i) { const m = MANG()[k][i]; if (!m) return; const t = prompt('Tên đoạn (để trống để bỏ)', m.ten || ''); if (t == null) return; luuHoanTac(); if (t.trim()) m.ten = t.trim().slice(0, 40); else delete m.ten; veTl(); }
function xoaTrack(key) { const ds = moiMuc().filter(o => (o.k === 'b' || o.k === 'g') ? keyLop(lopCua(o.k, o.m)) === key : o.k === 'a' ? keyAm(o.m.lop) === key : false); if (!ds.length) { toast('Track này không xoá được (track chính hoặc trống)'); return; } luuHoanTac(); ds.forEach(o => { const a = MANG()[o.k]; a.splice(a.indexOf(o.m), 1); }); P.chon = null; P.nhieu = []; veTl(); veKhung(); veProp(); toast('Đã xoá track (' + ds.length + ' mục)'); }
/* phím tắt CapCut Custom1 (bắt trước bộ phím cũ) */
function phimCapCut(e) {
  const a = document.activeElement; if (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable) return; if ($('.xuat.mo') && e.key !== 'Escape') return;
  const ctrl = e.ctrlKey || e.metaKey, c = e.code, sh = e.shiftKey, alt = e.altKey, xong = f => { e.preventDefault(); e.stopImmediatePropagation(); f(); };
  if (e.key === 'Escape') { if ($('.cmenu')) { dongMenu(); return; } if ($('.xuat.mo')) return xong(() => $$('.xuat.mo').forEach(x => x.classList.remove('mo'))); if (P.cheDo === 'cat') return xong(() => datCheDo('chon')); return; }
  if (ctrl && !alt && !sh && c === 'KeyT') return xong(() => { luuHoanTac(); P.gfx.push({ id: uid(), kieu: 'chu', bd: khungGiay(P.t), kt: khungGiay(P.t + MAC_DINH.chuGiay), text: 'Chữ của bạn', phu: '', ...GX_MD.chu }); P.chon = { k: 'g', i: P.gfx.length - 1 }; P.nhieu = []; P.propTab = 'Văn bản'; veTl(); veKhung(); veProp(); moPhaiNeuCan(); setTimeout(() => { const o = $('#propChon textarea.ccChuNoi') || $('#propChon textarea') || $('#propChon input[type="text"]'); if (o) { o.focus(); o.select(); } }, 30); });   /* spec 6: Ctrl+T thêm chữ mặc định tại đầu phát */
  if (ctrl && !alt && (c === 'KeyK' || c === 'KeyB')) return xong(() => { if (!sh) return tachChon(); const m = mucChon(); if (m && m.kfs && Object.keys(m.kfs).some(p => kfTai(m, p, offMuc(P.chon.k, m)) >= 0)) xoaKfDauPhat(); else tachTatCa(); });   // Ctrl+Shift+K: đang đứng trên ◆ của mục đang chọn thì xoá ◆, không thì tách mọi track
  if (ctrl && !sh && !alt && c === 'KeyL') return xong(() => { $('#btnLienKet').click(); toast(P.lienKet !== false ? 'Bật liên kết' : 'Tắt liên kết'); });
  if (ctrl && !sh && !alt && c === 'KeyR') return xong(() => { const m = mucChon(); if (!m || !'vb'.includes(P.chon.k)) { toast('Chọn đoạn video trước'); return; } moTabProp('Tốc độ'); moPhaiNeuCan(); });
  if (ctrl && !sh && !alt && (c === 'Period' || c === 'Comma')) return xong(() => amLuongChon(c === 'Period' ? 1 : -1));
  if (ctrl && !sh && !alt && c === 'KeyJ') return xong(themBeatTay);
  if (ctrl && !sh && !alt && (c === 'KeyM' || c === 'KeyE')) return xong(() => $('#btnXuat').click());
  if (ctrl && !sh && !alt && c === 'KeyN') return xong(() => { if (confirm('Tạo dự án mới? Dự án hiện tại đã được tự lưu.')) duAnMoi(); });
  if (ctrl && !sh && !alt && c === 'KeyF') return xong(() => $('#btnToanManHinh').click());
  if (ctrl && alt && c === 'KeyC') return xong(chepThuocTinh);
  if (ctrl && alt && c === 'KeyV') return xong(hopDanThuocTinh);
  if (ctrl && !alt && c === 'Semicolon') return xong(() => { const s = $('#lopPhuChon'); s.value = s.value === 'luoi' ? 'khong' : 'luoi'; veLopPhu(); });
  if (!ctrl && alt && c === 'KeyG') return xong(() => sh ? boGopNhom() : gopNhom());
  if (!ctrl && alt && sh && c === 'KeyK') return xong(kfCoBan);
  if (!ctrl && alt && !sh && c === 'KeyK') return xong(() => { if (!P.chon) return; moTabProp('Video'); moPhaiNeuCan(); const n = [...$$('#propChon .nhom2')].find(x => /Keyframe/.test(x.textContent)); if (n) n.scrollIntoView({ block: 'start' }); });
  if (!ctrl && alt && c === 'KeyM') return xong(() => sh ? nhayMoc(-1) : themMocMau());
  if (!ctrl && alt && sh && (c === 'Equal' || c === 'Minus' || c === 'KeyZ')) return xong(() => { const s = $('#zoomKhung'), ds = [...s.options].map(o => o.value), j = ds.indexOf(s.value); s.value = c === 'KeyZ' ? 'vua' : ds[Math.max(0, Math.min(ds.length - 1, j + (c === 'Equal' ? 1 : -1)))]; datZoomKhung(); });
  if (ctrl || alt) return;
  if (c === 'Backquote') return xong(() => $('#btnToanManHinh').click());
  if (sh && c === 'Backspace') return xong(() => { doiNamCham(); toast(P.namCham !== false ? 'Bật nam châm track chính' : 'Tắt nam châm track chính'); });
  if (!sh && c === 'KeyV') return xong(() => datCheDo('chon'));
  if (!sh && c === 'KeyC') return xong(() => datCheDo('cat'));
  if (!sh && c === 'KeyS') return xong(() => { $('#btnSnap').click(); toast(P.snap ? 'Bật hít (snap)' : 'Tắt hít (snap)'); });
  if (sh && c === 'KeyS') return xong(tachTatCa);
  if (c === 'KeyA') return xong(() => chonTheoDauPhat(sh));
  if (sh && c === 'KeyX') return xong(vungTheoChon);
  if (sh && c === 'KeyE') return xong(anHienChon);
  if (sh && c === 'KeyM') return xong(() => nhayMoc(1));
  if (sh && (c === 'ArrowLeft' || c === 'ArrowRight')) return xong(() => { if (P.dang) dung(); P.t = khungGiay(Math.min(tongGiay(), P.t + (c === 'ArrowRight' ? 10 : -10) / fpsDuAn())); veKhung(); vePh(); });
}
function khoiTaoM1() {
  window.addEventListener('keydown', phimCapCut, true);
  window.addEventListener('keydown', e => { if (e.key === 'Control' || e.key === 'Meta') P.giuCtrl = true; }); window.addEventListener('keyup', e => { if (e.key === 'Control' || e.key === 'Meta') P.giuCtrl = false; }); window.addEventListener('blur', () => { P.giuCtrl = false; });
  const cl = el('div'); cl.id = 'catLine'; $('#tlIn').appendChild(cl);
  $('#btnCheChon').onclick = () => datCheDo('chon'); $('#btnCheCat').onclick = () => datCheDo('cat'); datCheDo('chon', true);
  $('#tlIn').addEventListener('pointermove', e => { if (P.cheDo !== 'cat') return; const it = e.target.closest('.item[data-k]'), r = $('#tlIn').getBoundingClientRect(); cl.style.display = it ? 'block' : 'none'; if (it) { const ri = it.getBoundingClientRect(); Object.assign(cl.style, { left: (e.clientX - r.left) + 'px', top: (ri.top - r.top) + 'px', height: ri.height + 'px' }); } });
  $('#tlIn').addEventListener('pointerdown', e => { if (P.cheDo !== 'cat' || e.button !== 0) return; const it = e.target.closest('.item[data-k]'); if (!it || e.target.closest('.kfd')) return; e.preventDefault(); e.stopPropagation(); const r = $('#tlIn').getBoundingClientRect(), t = Math.max(0, (e.clientX - r.left - LB) / PX()), k = it.dataset.k, i = +it.dataset.i; if (P.dang) dung();
    if (k === 'pd') { P.t = t; tachPd(i, t); return; } const m = (MANG()[k] || [])[i]; luuHoanTac(); if (!tachMot(k, m, t)) { huyHoanTac(); toast('Bấm xa mép đoạn hơn để tách'); return; } P.t = t; P.chon = null; veTl(); veLoi(); veKhung(); vePh(); }, true);
  $('#tlScroll').addEventListener('wheel', e => { if (!e.altKey || e.ctrlKey) return; e.preventDefault(); $('#tlScroll').scrollLeft += e.deltaY || e.deltaX; }, { passive: false });
  const veTlCu = veTl; veTl = function () { const r = veTlCu.apply(this, arguments); try { trangTriTl(); } catch { } return r; }; trangTriTl();
}

/* ═════════ CAPCUT 9.1 CHI TIẾT · M2: hộp Xuất, Cài đặt, danh sách phụ đề, bo góc/viền/bóng video, bóng chữ, pan + bộ lọc giọng, tỉ lệ khung đủ ═════════ */
Object.assign(TI_LE, { '4:3': [4, 3], '3:4': [3, 4], '2.35:1': [47, 20], '1.85:1': [37, 20], '21:9': [21, 9] });
function luuCai() { try { localStorage.setItem('dv_cai', JSON.stringify(P.cai)); } catch { } }
/* ── Cài đặt (Settings) ── */
function moCaiDat() {
  const h = $('#caiHop'); h.classList.add('mo'); $('#caiAnh').value = P.cai.anh; $('#caiDongBang').value = P.cai.dongBang; $('#caiChuyen').value = P.cai.chuyen; $('#caiTuLuu').checked = P.cai.tuLuu !== false; $('#caiXemTruoc').value = P.cai.xemTruoc || 'chat_luong';
  $('#caiDungLuong').textContent = 'Đang tính…'; (async () => { try { const e = await navigator.storage.estimate(); const ben = navigator.storage.persisted ? await navigator.storage.persisted().catch(() => false) : false; $('#caiDungLuong').innerHTML = 'Bộ nhớ trình duyệt đang dùng <b>' + (e.usage / 1048576).toFixed(0) + ' MB</b> trong hạn mức <b>' + (e.quota / 1073741824).toFixed(1) + ' GB</b> mà trình duyệt cấp cho trang này (Chrome/Edge cấp theo ổ đĩa còn trống, thường 10–60% dung lượng trống; ổ gần đầy hoặc chế độ ẩn danh thì ít). ' + (ben ? 'Đã bật lưu bền: trình duyệt không tự xoá khi thiếu chỗ.' : '<button class="btn nho" type="button" id="caiLuuBen">Bật lưu bền</button> để trình duyệt không tự dọn footage khi ổ đầy.'); const nb = $('#caiLuuBen'); if (nb) nb.onclick = async () => { let ok = false; try { ok = await navigator.storage.persist(); } catch { } toast(ok ? 'Đã bật lưu bền' : 'Trình duyệt chưa cho phép (cần dùng trang thường xuyên hoặc thêm vào màn hình chính)'); if (ok) nb.remove(); }; } catch { $('#caiDungLuong').textContent = ''; } })();
}
async function xoaCache() { if (!confirm('Xoá footage đã lưu trong trình duyệt của các dự án KHÔNG còn trong danh sách? Dự án đang có vẫn giữ.')) return; try { const ds = await dsDuAn(), giu = new Set(); ds.forEach(r => (r.media || []).forEach(m => giu.add(tenOpfs({ name: m.ten, size: m.size })))); const d = await opfsThu(); let n = 0; for await (const [ten] of d.entries()) if (!giu.has(ten)) { await d.removeEntry(ten); n++; } toast('Đã xoá ' + n + ' file không còn dùng'); moCaiDat(); } catch (e) { toast('Không xoá được: ' + (e.message || e)); } }
/* ── hộp Xuất kiểu CapCut ── */
/* ── hộp Xuất: 3 phần tick riêng — Video (có tiếng), Âm thanh riêng, Phụ đề riêng — mỗi phần ra một file ── */
const DD_AM = ['wav', 'm4a', 'mp3'];
function moHopXuat() {
  if (!P.clips.length) { toast('Chưa có đoạn nào để xuất'); return; } const h = $('#xuatCaiHop'); h.classList.add('mo');
  $('#xcTen').value = $('#tenDuAn').value; ['xuatDD', 'xuatFps', 'xuatCL', 'doPhanGiai', 'xuatKhoang', 'gifFps', 'gifRong', 'xuatMbps', 'xuatAm'].forEach(id => { const a = $('#' + id), b = $('#xc_' + id); if (a && b) { b.innerHTML = a.innerHTML; b.value = a.value; } });
  [...$('#xc_xuatDD').options].forEach(o => { if (DD_AM.includes(o.value)) o.remove(); });
  let nho = {}; try { nho = JSON.parse(localStorage.getItem('dv_xuatChon') || '{}') || {}; } catch { }
  const dd = $('#xuatDD').value, laAm = DD_AM.includes(dd);
  P.xuatBen = dd; const doiBen = nho.ben != null && nho.ben !== dd;   /* đổi định dạng ở bảng bên từ lần trước → theo định dạng mới, không theo lựa chọn cũ */
  $('#xcCoVideo').checked = laAm ? false : doiBen || nho.video !== false; $('#xcCoAm').checked = laAm || (!!nho.am && !(doiBen && nho.video === false)); $('#xcCoPd').checked = !!nho.pd || ($('#xuatPd').value !== 'khong' && !laAm);
  if (laAm) $('#xcAmDD').value = dd; else if (nho.amDD) $('#xcAmDD').value = nho.amDD; $('#xcAmKbps').value = String(laAm ? $('#xuatAm').value : (nho.amKbps || 192)); $('#xcPdDD').value = $('#xuatPd').value !== 'khong' ? $('#xuatPd').value : (nho.pdDD || 'srt');
  if (laAm) $('#xc_xuatDD').value = nho.videoDD && [...$('#xc_xuatDD').options].some(o => o.value === nho.videoDD) ? nho.videoDD : 'mp4_avc';
  $('#xcTuyChinh').checked = $('#xuatCach').value === 'ghi'; capNhatHopXuat();
}
function capNhatHopXuat() {
  const dd = $('#xc_xuatDD').value, coV = $('#xcCoVideo').checked, coA = $('#xcCoAm').checked, coP = $('#xcCoPd').checked;
  $('#xcKhoiVideo').classList.toggle('tat', !coV); $('#xcKhoiAm').classList.toggle('tat', !coA); $('#xcKhoiPd').classList.toggle('tat', !coP); $('#xcAmKbpsHang').hidden = $('#xcAmDD').value === 'wav';
  $('#xcGif').hidden = dd !== 'gif'; $('#xcVideo').hidden = dd === 'gif'; $('#xcAm').hidden = dd === 'gif'; $('#xcMbpsHang').hidden = $('#xc_xuatCL').value !== 'tuy'; $('#xuatMbpsHang').hidden = $('#xc_xuatCL').value !== 'tuy';
  ['xuatDD', 'xuatFps', 'xuatCL', 'doPhanGiai', 'xuatKhoang', 'gifFps', 'gifRong', 'xuatMbps', 'xuatAm'].forEach(id => { const a = $('#' + id), b = $('#xc_' + id); if (a && b) a.value = b.value; });
  const o = caiXuat(), [ka, kb] = khoangXuat(o), { W, H } = kichThuoc(o.res), dai = kb - ka, ds = [];
  if (coV) ds.push((dd === 'gif' ? 'GIF ' + o.gifRong + 'px · ' + o.gifFps + ' khung/giây' : W + '×' + H + ' · ' + o.fps + ' khung/giây · ' + (o.cl === 'tuy' ? o.mbps + ' Mbps' : $('#xuatCL').selectedOptions[0].textContent.replace(/ \(.*/, '')) + ' · AAC ' + o.am + ' kbps') + ' · ~' + (uocTinh() / 1048576).toFixed(1).replace('.', ',') + ' MB');
  if (coA) { const ad = $('#xcAmDD').value, kb2 = +$('#xcAmKbps').value; ds.push(ad.toUpperCase() + (ad === 'wav' ? ' 48 kHz · ~' + (dai * 48000 * 4 / 1048576).toFixed(1) : ' ' + kb2 + ' kbps · ~' + (dai * kb2 * 125 / 1048576).toFixed(1)).replace('.', ',') + ' MB'); }
  if (coP) ds.push('Phụ đề .' + $('#xcPdDD').value);
  veUocTinh(); $('#xcTomTat').textContent = (ds.length ? ds.join(' + ') : 'Chọn ít nhất một phần để xuất') + ' · ' + fmt1(dai) + 's';
  try { localStorage.setItem('dv_xuatChon', JSON.stringify({ video: coV, am: coA, pd: coP, amDD: $('#xcAmDD').value, amKbps: +$('#xcAmKbps').value, pdDD: $('#xcPdDD').value, videoDD: dd, ben: P.xuatBen })); } catch { }
}
function tenFileXuat(duoi) { return ($('#tenDuAn').value.trim() || 'video').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase().replace(/^-|-$/g, '').slice(0, 40) + '-' + new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '') + duoi; }
function choXuatXong() { return new Promise(ok => { const id = setInterval(() => { const xong = getComputedStyle($('#xuatXong')).display !== 'none', dong = !$('#xuatHop').classList.contains('mo'); if (xong || dong || P.huyXuat) { clearInterval(id); ok(xong && !P.huyXuat); } }, 120); }); }
async function xacNhanXuat() {
  const coV = $('#xcCoVideo').checked, coA = $('#xcCoAm').checked, coP = $('#xcCoPd').checked; if (!coV && !coA && !coP) { toast('Tick ít nhất một phần: Video, Âm thanh hoặc Phụ đề'); return; }
  $('#tenDuAn').value = $('#xcTen').value.trim() || $('#tenDuAn').value; capNhatHopXuat(); $('#xuatCach').value = $('#xcTuyChinh').checked ? 'ghi' : 'nhanh'; $('#xuatCaiHop').classList.remove('mo');
  const vDD = $('#xc_xuatDD').value, kbCu = $('#xuatAm').value, pdCu = $('#xuatPd').value, file = []; P.xuatHang = true;
  try {
    if (coV) { $('#xuatDD').value = vDD; $('#xuatPd').value = 'khong'; batDauXuat(); const ok = await choXuatXong(); if (!ok) return; file.push($('#xuatTai').download); }
    if (coA) { $('#xuatDD').value = $('#xcAmDD').value; $('#xuatAm').value = $('#xcAmKbps').value; $('#xuatPd').value = 'khong'; batDauXuat(); const ok = await choXuatXong(); if (!ok) return; file.push($('#xuatTai').download); }
    if (coP) { const o = caiXuat(), [ka, kb] = khoangXuat(o), ds = pdTrongKhoang(ka, kb), fmt = $('#xcPdDD').value; if (!ds.length) toast('Không có phụ đề trong khoảng xuất'); else { const ten = tenFileXuat('.' + fmt); luuText(ten, fmt === 'srt' ? ds.map((c, i) => (i + 1) + '\n' + srtTg(c.bd) + ' --> ' + srtTg(c.kt) + '\n' + c.text + '\n').join('\n') : ds.map(c => c.text).join('\n') + '\n'); file.push(ten); P.pdRiengTen = ten; } }
  } finally { $('#xuatDD').value = vDD; $('#xuatAm').value = kbCu; $('#xuatPd').value = pdCu; P.xuatHang = false; P.xuatFile = file; }
  if (file.length > 1 || (!coV && !coA)) { if (!coV && !coA) toast('Đã lưu ' + file.join(', ')); else { $('#xuatTieuDe').textContent = '✓ Xong ' + file.length + ' file'; $('#xuatTt').textContent = 'Đã lưu: ' + file.join(' · '); } }
}
/* ── danh sách phụ đề (Enter tách, Backspace gộp, tìm & thay) ── */
function veDsPd() {
  const box = $('#pdDs'); if (!box) return; const ds = dsPd(), q = ($('#pdTim').value || '').toLowerCase(); box.innerHTML = '';
  if (!ds.length) { box.appendChild(el('div', 'quota', 'Chưa có phụ đề. Bấm Hiểu footage, hoặc nhập .srt.')); return; }
  ds.forEach((c, i) => { const t = c.tu.map(w => w.w).join(' '); if (q && !t.toLowerCase().includes(q)) return; const d = el('div', 'pdHang' + (P.chon && P.chon.k === 'pd' && P.chon.i === i ? ' chon' : '')); d.dataset.i = i;
    const g = el('span', 'g', fmt1(c.bd)); g.onclick = () => { if (P.dang) dung(); P.t = c.bd + 0.01; P.chon = { k: 'pd', i }; veTl(); veKhung(); vePh(); veProp(); veDsPd(); }; d.appendChild(g);
    const ta = el('span', 't', t); ta.contentEditable = 'true'; ta.spellcheck = false; let daLuu = false;
    ta.oninput = () => { if (!daLuu) { luuHoanTac(); daLuu = true; } suaPdYen(i, ta.textContent); }; ta.onblur = () => { daLuu = false; cumKey = ''; veTl(); veDsPd(); };
    ta.onkeydown = e => { e.stopPropagation(); const sel = getSelection(), pos = sel && sel.anchorNode && ta.contains(sel.anchorNode) ? viTriCon(ta, sel) : -1;
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); ta.blur(); tachPdTaiChu(i, pos); return; }
      if (e.key === 'Backspace' && pos === 0 && i > 0) { e.preventDefault(); ta.blur(); gopPd(i); return; }
      if (e.key === 'Escape') ta.blur(); };
    d.appendChild(ta); const x = el('button', 'btn nho ghost', '✕'); x.type = 'button'; x.title = 'Xoá câu'; x.onclick = () => { xoaPd(i); veDsPd(); }; d.appendChild(x); box.appendChild(d); });
}
function viTriCon(ta, sel) { const r = sel.getRangeAt(0).cloneRange(); r.selectNodeContents(ta); r.setEnd(sel.anchorNode, sel.anchorOffset); return r.toString().length; }
function suaPdYen(i, text) { const c = dsPd()[i]; if (!c) return; text = String(text).replace(/\s+/g, ' ').trim(); if (c.ng != null) { const o = P.pdNgoai[c.ng]; o.text = text; chuanTu(o); } else { const s = srcCua(c.s), w = c.w || []; if (!s || !w.length || !text) return; const i0 = s.tu.indexOf(w[0]), i1 = s.tu.indexOf(w[w.length - 1]); if (i0 < 0 || i1 < i0) return; const cu = { text, bd: w[0].bd, kt: w[w.length - 1].kt, i0, i1 }; suaTu(s, cu); const nh = w[0].nhom || 'n' + uid(); for (let k = i0; k <= cu.i1; k++) s.tu[k].nhom = nh; } if (!P.dang) veKhung(); }
function tachPdTaiChu(i, pos) {
  const c = dsPd()[i]; if (!c) return; const text = c.tu.map(w => w.w).join(' '); if (pos <= 0 || pos >= text.length) { toast('Đặt con trỏ vào giữa câu rồi Enter để tách'); return; }
  const truoc = text.slice(0, pos).trim().split(/\s+/).filter(Boolean).length; if (!truoc || truoc >= c.tu.length) { toast('Đặt con trỏ giữa hai từ'); return; }
  luuHoanTac(); chuyenPdDocLap(true); const c2 = dsPd()[i], o = P.pdNgoai[c2.ng], t = +((o.tu[truoc - 1].kt + o.tu[truoc].bd) / 2).toFixed(3);
  const a = { bd: o.bd, kt: t, text: o.tu.slice(0, truoc).map(w => w.w).join(' '), tu: o.tu.slice(0, truoc) }, b = { bd: t, kt: o.kt, text: o.tu.slice(truoc).map(w => w.w).join(' '), tu: o.tu.slice(truoc) };
  P.pdNgoai.splice(c2.ng, 1, a, b); lamMoiPd(); P.chon = { k: 'pd', i: i + 1 }; veProp(); veDsPd(); toast('Đã tách câu');
}
function gopPd(i) { if (i <= 0) return; luuHoanTac(); chuyenPdDocLap(true); const ds = dsPd(), a = P.pdNgoai[ds[i - 1].ng], b = P.pdNgoai[ds[i].ng]; a.kt = b.kt; a.tu = [...(a.tu || []), ...(b.tu || [])]; a.text = a.tu.map(w => w.w).join(' '); P.pdNgoai.splice(ds[i].ng, 1); lamMoiPd(); P.chon = { k: 'pd', i: i - 1 }; veProp(); veDsPd(); toast('Đã gộp với câu trước'); }
function thayPd() { const tim = $('#pdTim').value, thay = $('#pdThay').value; if (!tim) { toast('Nhập chữ cần tìm'); return; } luuHoanTac(); let n = 0; const re = new RegExp(tim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); dsPd().forEach((c, i) => { const t = c.tu.map(w => w.w).join(' '); if (re.test(t)) { suaPdYen(i, t.replace(re, thay)); n++; } re.lastIndex = 0; }); lamMoiPd(); veDsPd(); toast(n ? 'Đã thay trong ' + n + ' câu' : 'Không thấy “' + tim + '”'); }
/* ── bo góc, viền, bóng cho video / lớp phủ ── */
Object.assign(KF_TEN, { boGoc: 'Bo góc', vienDay: 'Viền', bongMo: 'Độ đậm bóng', bongNhoe: 'Độ nhoè bóng', bongKc: 'Khoảng cách bóng', bongGoc: 'Góc bóng', bongLan: 'Độ lan bóng' });
const coKfTT = (c, k) => !!(c.kfs && c.kfs[k] && c.kfs[k].length);
const gtTT = (c, k, off, md) => coKfTT(c, k) ? giaTriKf(c, k, off) : (c[k] == null ? md : c[k]);   /* bo góc / viền / bóng: có keyframe thì nội suy, không thì giá trị tĩnh */
function coTrangTri(c) { return !!(c.boGoc || c.vienDay || c.bongMo || ['boGoc', 'vienDay', 'bongMo'].some(k => coKfTT(c, k))); }
/* bo góc + viền + đổ bóng cho video / ảnh / video phủ / clip ghép: bóng lấy theo ĐÚNG hình của mục (sau mặt nạ, bo góc, phần trong suốt của ảnh) */
const BONG_KIEU = { ngoai: ['Bóng đổ', { nhoe: 0.3, kc: 0.05, goc: -45, lan: 0, mau: '#000000', mo: 0.6 }], mem: ['Bóng mềm', { nhoe: 0.8, kc: 0.08, goc: -60, lan: 0.1, mau: '#000000', mo: 0.45 }], cung: ['Bóng cứng', { nhoe: 0, kc: 0.06, goc: -45, lan: 0, mau: '#000000', mo: 0.85 }], trong: ['Bóng trong', { nhoe: 0.35, kc: 0.04, goc: -45, lan: 0, mau: '#000000', mo: 0.7 }], sang: ['Phát sáng', { nhoe: 0.6, kc: 0, goc: 0, lan: 0.15, mau: '#ffd400', mo: 0.9 }] };
const bongCvs = [document.createElement('canvas'), document.createElement('canvas')];
function veTrangTri(ctx, W, H, c, off, L) {
  const sc = giaTriKf(c, 'sc', off), x = giaTriKf(c, 'x', off), y = giaTriKf(c, 'y', off), xoay = giaTriKf(c, 'xoay', off), h0 = hopMuc(c.t_bd != null ? 'b' : 'v', c), rw = h0.w * W, rh = h0.h * H, boG = Math.max(0, gtTT(c, 'boGoc', off, 0)), r = Math.min(rw, rh) / 2 * boG, mn = Math.min(W, H);
  const khung = g => { g.translate(W / 2 + x * W, H / 2 + y * H); if (xoay) g.rotate(xoay * Math.PI / 180); g.scale(sc * giaTriKf(c, 'scX', off), sc * giaTriKf(c, 'scY', off)); g.translate((h0.cx - 0.5) * W, (h0.cy - 0.5) * H); g.beginPath(); g.roundRect(-rw / 2, -rh / 2, rw, rh, r); };
  if (boG > 0.001) { const g = L.getContext('2d'); g.save(); g.globalCompositeOperation = 'destination-in'; khung(g); g.fillStyle = '#fff'; g.fill(); g.restore(); }
  const mo = c.bongMo || coKfTT(c, 'bongMo') ? Math.max(0, Math.min(1, gtTT(c, 'bongMo', off, 0))) : 0, kieu = BONG_KIEU[c.bongKieu] ? c.bongKieu : 'ngoai', md = BONG_KIEU[kieu][1], gt = (k, v) => gtTT(c, k, off, v);
  const nhoe = gt('bongNhoe', md.nhoe) * mn * 0.12, kc = (kieu === 'sang' ? 0 : gt('bongKc', md.kc)) * mn * 0.5, a = gt('bongGoc', md.goc) * Math.PI / 180, dx = Math.cos(a) * kc, dy = -Math.sin(a) * kc, lan = gt('bongLan', md.lan), mau = c.bongMau || md.mau;
  const [T] = bongCvs; if (T.width !== W || T.height !== H) { T.width = W; T.height = H; } const tg = T.getContext('2d');
  if (mo && kieu !== 'trong') {   // bóng ngoài / mềm / cứng / phát sáng: bóng mờ theo hình của mục, lan rộng quanh tâm
    tg.clearRect(0, 0, W, H); tg.globalCompositeOperation = 'source-over'; tg.drawImage(L, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = mau; tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha *= mo; if (nhoe > 0.4) ctx.filter = 'blur(' + nhoe.toFixed(1) + 'px)'; const cx0 = W / 2 + x * W, cy0 = H / 2 + y * H, k = 1 + lan * 0.3; ctx.translate(cx0 + dx, cy0 + dy); ctx.scale(k, k); ctx.translate(-cx0, -cy0); ctx.drawImage(T, 0, 0); if (kieu === 'sang' && nhoe > 0.4) ctx.drawImage(T, 0, 0); ctx.restore();
  }
  ctx.drawImage(L, 0, 0);
  if (mo && kieu === 'trong') {   // bóng trong: phần tối mép bên trong hình
    tg.clearRect(0, 0, W, H); tg.globalCompositeOperation = 'source-over'; tg.fillStyle = mau; tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'destination-out'; if (nhoe > 0.4) tg.filter = 'blur(' + nhoe.toFixed(1) + 'px)'; tg.drawImage(L, dx, dy); tg.filter = 'none'; tg.globalCompositeOperation = 'destination-in'; tg.drawImage(L, 0, 0); tg.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha *= mo; ctx.drawImage(T, 0, 0); ctx.restore();
  }
  const vd = gtTT(c, 'vienDay', off, 0); if (vd > 0.001) { ctx.save(); khung(ctx); ctx.lineWidth = vd * mn * 0.1 / sc; ctx.strokeStyle = c.vienMau || '#ffffff'; ctx.globalAlpha = c.vienMo == null ? 1 : c.vienMo; ctx.stroke(); ctx.restore(); }
}
function veThuocTinhTrangTri(box, m) {
  const n = el('div', 'nhom2'); n.appendChild(el('b', null, 'Bo góc & đổ bóng')); box.appendChild(n);
  const mau = (nhan, p, md) => { const l = el('label'); l.appendChild(el('span', null, nhan)); const i = el('input'); i.type = 'color'; i.value = /^#/.test(m[p] || '') ? m[p] : md; i.oninput = () => { if (!i._luu) { luuHoanTac(); i._luu = 1; } m[p] = i.value; veKhung(); }; i.onchange = () => { i._luu = 0; }; l.appendChild(i); n.appendChild(l); };
  const k = m.t_bd != null ? 'b' : 'v', oKf = (nhan, min, max, buoc, ten, md, dd, dat) => {   /* thanh có ◇ keyframe riêng như Biến đổi */
    const off = offMuc(k, m), co = coKfTT(m, ten), tai = co && kfTai(m, ten, off) >= 0;
    const r = oTruot(n, nhan, min, max, buoc, gtTT(m, ten, off, md), dd, v => { if (coKfTT(m, ten)) datKf(m, ten, offMuc(k, m), v); else dat(v); });
    const st = batDauMuc(k, m), ngoai = P.t < st - 0.01 || P.t > st + daiMuc(k, m) + 0.01, nut = el('button', 'kfn' + (tai ? ' co' : co ? ' nua' : ''), tai ? '◆' : '◇'); nut.type = 'button'; nut.disabled = ngoai; nut.dataset.kenh = ten;
    nut.title = ngoai ? 'Đưa đầu phát vào trong đoạn để đặt keyframe' : (tai ? 'Bỏ keyframe ' : 'Thêm keyframe ') + KF_TEN[ten] + ' tại đầu phát';
    nut.onclick = () => { luuHoanTac(); const o2 = offMuc(k, m); if (kfTai(m, ten, o2) >= 0) xoaKf(m, ten, o2); else datKf(m, ten, o2, gtTT(m, ten, o2, md)); veProp(); veTl(); veKhung(); };
    r.parentNode.insertBefore(nut, r); return r; };
  oKf('Bo góc', 0, 1, 0.01, 'boGoc', 0, pct, v => { if (v) m.boGoc = v; else delete m.boGoc; });
  oKf('Viền', 0, 1, 0.01, 'vienDay', 0, pct, v => { if (v) m.vienDay = v; else delete m.vienDay; }); if (m.vienDay || coKfTT(m, 'vienDay')) { mau('Màu viền', 'vienMau', '#ffffff'); oTruot(n, 'Độ đậm viền', 0, 1, 0.01, m.vienMo == null ? 1 : m.vienMo, pct, v => { m.vienMo = v; }); }
  const lb = el('label'); lb.appendChild(el('span', null, 'Đổ bóng')); const cb = el('input'); cb.type = 'checkbox'; cb.className = 'bongBat'; cb.checked = !!m.bongMo || coKfTT(m, 'bongMo'); cb.onchange = () => { luuHoanTac(); if (cb.checked) { const md = BONG_KIEU[m.bongKieu] || BONG_KIEU.ngoai; m.bongMo = md[1].mo; } else { delete m.bongMo; if (m.kfs) ['bongMo', 'bongNhoe', 'bongKc', 'bongGoc', 'bongLan'].forEach(x => delete m.kfs[x]); } veProp(); veTl(); veKhung(); }; lb.appendChild(cb); n.appendChild(lb);
  if (!cb.checked) return;
  const chip = el('div', 'chips bongKieu'); Object.keys(BONG_KIEU).forEach(k => { const b = el('button', null, BONG_KIEU[k][0]); b.type = 'button'; b.dataset.bong = k; b.setAttribute('aria-pressed', String((m.bongKieu || 'ngoai') === k)); b.onclick = () => { luuHoanTac(); const md = BONG_KIEU[k][1]; m.bongKieu = k; m.bongMo = md.mo; m.bongNhoe = md.nhoe; m.bongKc = md.kc; m.bongGoc = md.goc; m.bongLan = md.lan; m.bongMau = md.mau; veProp(); veKhung(); }; chip.appendChild(b); }); n.appendChild(chip);
  const md = (BONG_KIEU[m.bongKieu] || BONG_KIEU.ngoai)[1], gt = (k, v) => m[k] == null ? v : m[k];
  mau('Màu bóng', 'bongMau', md.mau);
  oKf('Độ đậm', 0, 1, 0.01, 'bongMo', md.mo, pct, v => { m.bongMo = Math.max(0.01, v); });
  oKf('Độ nhoè', 0, 1, 0.01, 'bongNhoe', md.nhoe, pct, v => { m.bongNhoe = v; });
  if (m.bongKieu !== 'sang') { oKf('Khoảng cách', 0, 1, 0.01, 'bongKc', md.kc, pct, v => { m.bongKc = v; }); oKf('Góc bóng', -180, 180, 1, 'bongGoc', md.goc, v => Math.round(v) + '°', v => { m.bongGoc = v; }); }
  oKf('Độ lan', 0, 1, 0.01, 'bongLan', md.lan, pct, v => { m.bongLan = v; });
}
/* ── bóng chữ chi tiết ── */
function bongChu(ctx, g, size) { const b = g.bongChu || {}; ctx.shadowColor = hexAlpha(b.mau || '#000000', b.mo == null ? 0.9 : b.mo); ctx.shadowBlur = size * (b.nhoe == null ? 0.45 : b.nhoe) * 0.6; const a = ((b.goc == null ? -45 : b.goc) * Math.PI) / 180, d = size * (b.kc == null ? 0.05 : b.kc) * 1.2; ctx.shadowOffsetX = Math.cos(a) * d; ctx.shadowOffsetY = -Math.sin(a) * d; }
function hexAlpha(h, a) { const m = String(h).match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i); return m ? 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a + ')' : 'rgba(0,0,0,' + a + ')'; }
function veBongChuProp(n, g) { if ((g.nen || 'vien') !== 'bong' && !g.bong) return; g.bongChu = g.bongChu || {}; const b = g.bongChu; const l = el('label'); l.appendChild(el('span', null, 'Màu bóng')); const i = el('input'); i.type = 'color'; i.value = b.mau || '#000000'; i.oninput = () => { if (!i._luu) { luuHoanTac(); i._luu = 1; } b.mau = i.value; veKhung(); }; i.onchange = () => { i._luu = 0; }; l.appendChild(i); n.appendChild(l); oTruot(n, 'Độ đậm bóng', 0, 1, 0.01, b.mo == null ? 0.9 : b.mo, pct, v => { b.mo = v; }); oTruot(n, 'Độ nhoè', 0, 1, 0.01, b.nhoe == null ? 0.45 : b.nhoe, pct, v => { b.nhoe = v; }); oTruot(n, 'Khoảng cách', 0, 0.3, 0.005, b.kc == null ? 0.05 : b.kc, v => Math.round(v * 100) + '', v => { b.kc = v; }); oTruot(n, 'Góc', -180, 180, 1, b.goc == null ? -45 : b.goc, v => Math.round(v) + '°', v => { b.goc = v; }); }
/* ── âm thanh: pan trái/phải, bộ lọc giọng ── */
const GIONG = { khong: 'Không', dien_thoai: 'Điện thoại', radio: 'Radio cũ', tram: 'Trầm ấm', sang: 'Sáng rõ', vang: 'Vang (hội trường)', echo: 'Echo', nho: 'Thì thầm' };
function taoChuoiGiong(C, giong, nen) {
  const vao = C.createGain(), ra = C.createGain(); let cuoi = vao;
  /* nén giọng (như Dynamics của FilmCraft/Premiere, mức dành cho talking-head): ngưỡng −18 dB, tỉ lệ 3:1, knee mềm, bù +4 dB → tiếng đều, câu nói nhỏ không bị chìm */
  if (nen) { const cp = C.createDynamicsCompressor(); cp.threshold.value = -18; cp.knee.value = 8; cp.ratio.value = 3; cp.attack.value = 0.005; cp.release.value = 0.12; const bu = C.createGain(); bu.gain.value = Math.pow(10, 4 / 20); cuoi.connect(cp); cp.connect(bu); cuoi = bu; }
  const bq = (type, f, q, gain) => { const b = C.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; if (gain) b.gain.value = gain; cuoi.connect(b); cuoi = b; };
  if (giong === 'dien_thoai') { bq('highpass', 400, 0.8); bq('lowpass', 3000, 0.8); bq('peaking', 1500, 1, 6); }
  else if (giong === 'radio') { bq('highpass', 250); bq('lowpass', 4500); bq('peaking', 900, 1.2, 5); const w = C.createWaveShaper(); const cur = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 127.5 - 1; cur[i] = Math.tanh(x * 2.2); } w.curve = cur; cuoi.connect(w); cuoi = w; }
  else if (giong === 'tram') { bq('lowshelf', 220, 0, 7); bq('highshelf', 5000, 0, -4); }
  else if (giong === 'sang') { bq('highshelf', 3000, 0, 6); bq('peaking', 6500, 1, 3); bq('lowshelf', 150, 0, -3); }
  else if (giong === 'nho') { bq('highpass', 300); bq('lowpass', 6000); }
  if (giong === 'vang' || giong === 'echo') { const kho = C.createGain(); cuoi.connect(kho); kho.connect(ra); if (giong === 'echo') { const d = C.createDelay(1); d.delayTime.value = 0.26; const fb = C.createGain(); fb.gain.value = 0.38; const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500; cuoi.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); const uot = C.createGain(); uot.gain.value = 0.55; lp.connect(uot); uot.connect(ra); } else { const cv2 = C.createConvolver(), sr = C.sampleRate, n = Math.floor(sr * 1.6), ir = C.createBuffer(2, n, sr); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.8); } cv2.buffer = ir; const uot = C.createGain(); uot.gain.value = 0.42; cuoi.connect(cv2); cv2.connect(uot); uot.connect(ra); } }
  else cuoi.connect(ra);
  return { vao, ra };
}
const nutGiong = {};
function apGiongXem(s, c) { const g = nutAm[s.id]; if (!g) return; const khoa = (c.giong || 'khong') + ':' + (c.pan || 0) + ':' + (c.nen ? 1 : 0); const cu = nutGiong[s.id]; if (cu && cu.khoa === khoa) return; if (cu) { try { g.disconnect(); cu.ra.disconnect(); } catch { } } else { try { g.disconnect(); } catch { } }
  const ch = taoChuoiGiong(ac, c.giong || 'khong', !!c.nen), pan = ac.createStereoPanner(); pan.pan.value = c.pan || 0; g.connect(ch.vao); ch.ra.connect(pan); pan.connect(raAc()); if (dest) pan.connect(dest); nutGiong[s.id] = { khoa, ra: pan }; }
function veAmThanhThem(n3, c) {
  oChon(n3, 'Nén giọng (đều tiếng)', [['0', 'Tắt'], ['1', 'Bật · câu nhỏ không bị chìm']], c.nen ? '1' : '0', v => { if (v === '1') c.nen = true; else delete c.nen; });
  oChon(n3, 'Bộ lọc giọng', Object.keys(GIONG).map(k => [k, GIONG[k]]), c.giong || 'khong', v => { if (v === 'khong') delete c.giong; else c.giong = v; });
  oTruot(n3, 'Cân bằng trái / phải', -1, 1, 0.01, c.pan || 0, v => Math.abs(v) < 0.005 ? 'giữa' : (v < 0 ? 'Trái ' : 'Phải ') + Math.round(Math.abs(v) * 100), v => { if (Math.abs(v) < 0.005) delete c.pan; else c.pan = v; });
}
/* ── bấm đúp chữ trên khung xem trước → sửa ngay ── */
function suaChuTrenKhung(e) {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; let best = null, dm = 0.14;
  P.gfx.forEach((g, i) => { if (P.t < g.bd || P.t >= g.kt) return; const gx = g.x == null ? 0.5 : g.x, gy = g.y == null ? (g.kieu === 'chu' ? 0.32 : 0.5) : g.y, d = Math.hypot(x - gx, (y - gy) * 1.4); if (d < dm) { dm = d; best = i; } });
  if (best == null) { const c = cumHienTai(P.t); if (c && Math.abs(y - (P.pdY || 0.78)) < 0.09) { P.chon = { k: 'pd', i: dsPd().indexOf(c) }; veTl(); veProp(); moPhaiNeuCan(); const ta = $('#pdSuaChu'); if (ta) { ta.focus(); ta.select(); } return true; } return false; }
  P.chon = { k: 'g', i: best }; P.propTab = 'Văn bản'; veTl(); veProp(); moPhaiNeuCan(); const inp = $('#propChon textarea.ccChuNoi') || $('#propChon input[type="text"]'); if (inp) { inp.focus(); inp.select(); } return true;
}
function khoiTaoM2() {
  const t2 = $('#tiLe2'); if (t2) { t2.innerHTML = ''; [...$('#tiLe').options].forEach(o => { const n = el('option', null, o.value); n.value = o.value; t2.appendChild(n); }); t2.value = $('#tiLe').value; }
  $('#btnCaiDat').onclick = moCaiDat; $('#caiDong').onclick = () => $('#caiHop').classList.remove('mo'); $('#caiXoaCache').onclick = xoaCache;
  $('#caiLuu').onclick = () => { P.cai.anh = Math.max(0.5, Math.min(60, +$('#caiAnh').value || 5)); P.cai.dongBang = Math.max(0.3, Math.min(10, +$('#caiDongBang').value || 3)); P.cai.chuyen = Math.max(0.1, Math.min(2, +$('#caiChuyen').value || 0.5)); P.cai.tuLuu = $('#caiTuLuu').checked; P.cai.xemTruoc = $('#caiXemTruoc').value; luuCai(); $('#caiHop').classList.remove('mo'); toast('Đã lưu cài đặt'); };
  $('#btnXuat').onclick = moHopXuat; $('#xcDong').onclick = () => $('#xuatCaiHop').classList.remove('mo'); $('#xcOk').onclick = xacNhanXuat; $('#xcAnhTinh').onclick = () => { $('#xuatCaiHop').classList.remove('mo'); xuatAnhTinh(); }; $$('#xuatCaiHop select, #xuatCaiHop input').forEach(x => x.addEventListener('change', capNhatHopXuat));   // gồm cả 3 ô tick Video / Âm thanh / Phụ đề
  $('#pdTim').oninput = veDsPd; $('#btnPdThay').onclick = thayPd; const doiTabCu2 = doiTab; doiTab = function (t) { doiTabCu2(t); if (t === 'loi') veDsPd(); };
  const veTlCu2 = veTl; veTl = function () { const r = veTlCu2.apply(this, arguments); if ($('[data-pane="loi"]').classList.contains('on')) veDsPd(); return r; };
  cv.addEventListener('dblclick', e => { if (suaChuTrenKhung(e)) e.preventDefault(); });
}
