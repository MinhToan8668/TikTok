/* ═════════ dòng thời gian nhiều track ═════════ */
const PX = () => P.pxs;
function ruler() {
  const r = $('#ruler'); r.innerHTML = ''; const tong = Math.max(tongGiay(), 10) + 4, px = PX(), buoc = px >= 40 ? 1 : px >= 18 ? 2 : px >= 10 ? 5 : 10;
  for (let t = 0; t <= tong; t += buoc) { const i = el('i', null, fmt(t)); i.style.left = t * px + 'px'; r.appendChild(i); if (buoc >= 2) for (let k = 1; k < buoc; k++) { const n = el('i', 'nho'); n.style.left = (t + k) * px + 'px'; r.appendChild(n); } }
  P.beat.forEach(b => { if (b <= tong) { const d = el('b', 'beat'); d.style.left = b * px + 'px'; r.appendChild(d); } });
  (P.moc || []).forEach((m, k) => { const d = el('b', 'moc'); d.style.left = m.t * px + 'px'; if (m.mau) d.style.background = m.mau; if (m.ghi) d.classList.add('coGhi'); d.title = (m.ten || 'Mốc ' + (k + 1)) + ' · ' + fmt1(m.t) + 's' + (m.ghi ? '\n' + m.ghi : '') + '\nbấm để tới, chuột phải để đổi tên, màu, ghi chú, xoá'; d.onpointerdown = ev => { ev.stopPropagation(); }; d.onclick = ev => { ev.stopPropagation(); P.t = m.t; veKhung(); vePh(); }; d.oncontextmenu = ev => { ev.preventDefault(); ev.stopPropagation(); menuMoc(ev, k); }; r.appendChild(d); });
  const dau = el('b', 'phDau'); dau.id = 'phDau'; dau.style.left = P.t * px + 'px'; r.appendChild(dau);
  $('#tlIn').style.width = (tong * px + 80) + 'px'; if (typeof veVaoRa === 'function') veVaoRa();
}
function veTl() {
  dongBoBamLoi(); ruler(); xepLop(); if ($('#tlTren')) { hangLop(); hangAm(); }
  const px = PX(), tr = {}; $$('.track').forEach(t => { tr[t.dataset.track] = t; t.querySelectorAll('.item').forEach(i => i.remove()); });
  let acc = 0;
  P.clips.forEach((c, i) => {
    const s = srcCua(c.src), si = P.srcs.indexOf(s), dai = daiC(c);
    if (c.trong) { const d = el('div', 'item v trong' + (P.chon && P.chon.k === 'v' && P.chon.i === i ? ' chon' : '')); d.style.left = acc * px + 'px'; d.style.width = Math.max(4, dai * px - 2) + 'px'; d.title = 'Khoảng trống ' + fmt1(dai) + 's · chọn rồi Delete để đóng lại'; keoItem(d, 'v', i, acc, dai); tr.v1.appendChild(d); acc += dai; return; }
    const d = el('div', 'item v s' + (si % 6) + (P.chon && P.chon.k === 'v' && P.chon.i === i ? ' chon' : '')); d.style.left = acc * px + 'px'; d.style.width = Math.max(6, dai * px - 2) + 'px';
    if (s && s.thumb) d.style.setProperty('--thumb', 'url(' + s.thumb + ')');
    const cau = s ? s.cau.filter(x => x.kt > c.bd + 0.1 && x.bd < c.kt - 0.1) : [];
    d.appendChild(el('b', null, (s && s.dongBang ? '❄ ' : 'S' + (si + 1) + ' · ') + fmt1(dai) + 's' + (tocC(c) !== 1 ? ' · ' + tocC(c) + '×' : '') + (c.kf ? ' ◇' : '') + (c.loc && c.loc !== 'khong' ? ' 🎨' : ''))); d.appendChild(el('small', null, cau.length ? cau[0].text : (s && s.loai === 'anh' ? 'ảnh' : c.ly_do || '')));
    d.appendChild(el('span', 'h l')); d.appendChild(el('span', 'h r')); vePhimItem(d, s, c.bd, c.kt, dai * px); veSongItem(d, s, c.bd, c.kt, dai * px); mocKf(c).forEach(t => { const k = el('i', 'kfd'); k.dataset.t = t; k.title = 'Keyframe tại ' + fmt1(t) + 's của đoạn · bấm để nhảy tới'; k.style.left = t * px - 4 + 'px'; d.appendChild(k); }); if (c.anVao && c.anVao.id !== 'khong') { const a = el('i', 'anv'); a.style.width = (c.anVao.d || 0.5) * px + 'px'; d.appendChild(a); } if (c.anRa && c.anRa.id !== 'khong') { const a = el('i', 'anr'); a.style.width = (c.anRa.d || 0.5) * px + 'px'; d.appendChild(a); }
    if (c.chuyen && c.chuyen !== 'cat' && i < P.clips.length - 1) d.appendChild(el('span', 'cc', '⇢ ' + CHUYEN_TEN[c.chuyen]));
    keoItem(d, 'v', i, acc, dai); tr.v1.appendChild(d); acc += dai;
  });
  P.broll.forEach((b, i) => { const s = srcCua(b.src); if (!s) return; const d = el('div', 'item b ' + b.kieu + (P.chon && P.chon.k === 'b' && P.chon.i === i ? ' chon' : '')); d.style.left = b.t_bd * px + 'px'; d.style.width = Math.max(6, (b.kt - b.bd) / tocC(b) * px - 2) + 'px'; vePhimItem(d, s, b.bd, b.kt, (b.kt - b.bd) / tocC(b) * px); mocKf(b).forEach(t => { const k = el('i', 'kfd'); k.dataset.t = t; k.title = 'Keyframe · bấm để nhảy tới'; k.style.left = t * px - 4 + 'px'; d.appendChild(k); }); d.appendChild(el('b', null, (b.kieu === 'pip' ? '▣ ' : '▮ ') + 'S' + (P.srcs.indexOf(s) + 1) + ' · ' + fmt1(b.kt - b.bd) + 's')); d.appendChild(el('small', null, (s.canh.find(c => c.bd <= b.bd + 0.2 && c.kt >= b.kt - 0.2) || {}).mo_ta || s.ten)); d.appendChild(el('span', 'h l')); d.appendChild(el('span', 'h r')); d.dataset.i = i; keoItem(d, 'b', i, b.t_bd, (b.kt - b.bd) / tocC(b)); (hangCua(lopCua('b', b)) || tr.v1).appendChild(d); });
  P.tieng.forEach((t, i) => { const d = el('div', 'item t' + (P.chon && P.chon.k === 't' && P.chon.i === i ? ' chon' : '')); d.style.left = t.t_bd * px + 'px'; d.style.width = Math.max(6, t.giay * px - 2) + 'px'; d.appendChild(el('b', null, '🎙 ' + fmt1(t.giay) + 's · ' + (TIENG_GIONG[t.giong] || t.giong))); d.appendChild(el('small', null, t.text)); keoItem(d, 't', i, t.t_bd, t.giay); tr.a2.appendChild(d); });
  veAm3Tl(tr, px);
  P.gfx.forEach((g, i) => { const d = el('div', 'item g' + (g.kieu === 'ghep' ? ' ghep' : '') + (P.chon && P.chon.k === 'g' && P.chon.i === i ? ' chon' : '')); d.style.left = g.bd * px + 'px'; d.style.width = Math.max(6, (g.kt - g.bd) * px - 2) + 'px'; d.appendChild(el('b', null, g.mau_id ? ((mauDoHoa(g.mau_id) || {}).ic || '◈') + ' ' + (g.ten || '') : (GX[g.kieu] || {}).ic + ' ' + (GX[g.kieu] || {}).ten)); d.appendChild(el('small', null, g.text || g.phu || '')); d.appendChild(el('span', 'h l')); d.appendChild(el('span', 'h r')); mocKf(g).forEach(t => { const kd = el('i', 'kfd'); kd.dataset.t = t; kd.title = 'Keyframe tại ' + fmt1(t) + 's của mục · kéo để dời, chuột phải để đổi đường cong'; kd.style.left = t * px - 4 + 'px'; d.appendChild(kd); }); keoItem(d, 'g', i, g.bd, g.kt - g.bd); (hangCua(lopCua('g', g)) || tr.v1).appendChild(d); });
  if ($('#phuDe').checked && P.clips.length) { cumKey = ''; dsPd().forEach((c, i) => { const d = el('div', 'item c pdIt' + (P.chon && P.chon.k === 'pd' && P.chon.i === i ? ' chon' : '')); d.style.left = c.bd * px + 'px'; d.style.width = Math.max(4, (c.kt - c.bd) * px - 1) + 'px'; d.appendChild(el('small', null, c.tu.map(t => t.w).join(' '))); d.title = 'Bấm để chọn, bấm đúp để sửa chữ, kéo để dời, kéo mép để đổi độ dài'; keoPd(d, i); tr.o2.appendChild(d); }); }
  const hook = $('#hook').value.trim(); if (hook && P.clips.length) { const d = el('div', 'item c'); d.style.left = '0'; d.style.width = Math.max(6, 3 * px - 1) + 'px'; d.style.background = '#8a5a10'; d.style.cursor = 'default'; d.appendChild(el('b', null, '💥 Hook')); d.appendChild(el('small', null, hook)); tr.o2.appendChild(d); }
  if (P.nhac) { const d = el('div', 'item a'); d.style.left = '0'; d.style.width = Math.max(6, Math.max(tongGiay(), 1) * px - 2) + 'px'; d.appendChild(el('span', 'song')); d.appendChild(el('b', null, '🎵 ' + P.nhac.ten)); d.appendChild(el('small', null, P.beat.length + ' beat · ' + $('#duckNoi').value + '% khi nói · ' + $('#duckBroll').value + '% khi không lời')); veDuck(d, px); tr.a1.appendChild(d); }
  $('#tlTrong').style.display = P.clips.length ? 'none' : ''; $('#trong').hidden = !!(P.clips.length || tongGiay() > 0);
  $('#seek').max = Math.max(1, Math.round(tongGiay() * 100));
  const g = tongGiay(); if (P.t > g && !P.dang) P.t = khungGiay(g);   // dự án ngắn đi (xoá, cắt): kéo đầu phát về cuối, khỏi tạo chữ ngoài video
  datTg(g); veTc(g);
  vePh(); veProp(); dongBoTick();
}
function veDuck(d, px) { let acc = 0; P.clips.forEach(c => { const s = srcCua(c.src); if (s) s.cau.forEach(x => { const bd = Math.max(x.bd, c.bd), kt = Math.min(x.kt, c.kt); if (kt > bd) { const i = el('i', 'duck'); i.style.left = (acc + (bd - c.bd) / tocC(c)) * px + 'px'; i.style.width = (kt - bd) / tocC(c) * px + 'px'; d.appendChild(i); } }); acc += daiC(c); }); }
function dongBoTick() { $$('.cau').forEach(d => { const s = srcCua(d.dataset.src), c = s && s.cau[+d.dataset.i]; if (!c) return; const trong = cauTrongTl(s.id, c); const cb = d.querySelector('input'); if (cb) cb.checked = trong; d.classList.toggle('tat', !trong); }); $$('.nhom[data-src]').forEach(n => { const s = srcCua(n.dataset.src); if (s) n.querySelector('.dem').textContent = s.cau.filter(c => cauTrongTl(s.id, c)).length + '/' + s.cau.length; }); }
function vePh() { $('#ph').style.left = (LB + P.t * PX()) + 'px'; const pd = $('#phDau'); if (pd) pd.style.left = P.t * PX() + 'px'; const sc = $('#tlScroll'), x = P.t * PX(); if (P.dang && (x < sc.scrollLeft || x > sc.scrollLeft + sc.clientWidth * 0.9 - LB)) sc.scrollLeft = Math.max(0, x - sc.clientWidth * 0.05); }   /* spec 1.10: tới 90% bề rộng thì lật trang, không cuộn mượt */
$('#zoomTl').addEventListener('input', () => { P.pxs = +$('#zoomTl').value; veTl(); });
$('#btnSnap').onclick = () => { P.snap = !P.snap; $('#btnSnap').setAttribute('aria-pressed', String(P.snap)); };
$('#nenKieu').addEventListener('change', () => { const k = $('#nenKieu').value; $('#nenMauHang').hidden = k !== 'mau'; if (k !== 'giu') segNap(); else $('#nenTt').hidden = true; segNho = { khoa: '', cv: null }; if (!P.dang) veKhung(); });
$('#btnSlip').onclick = () => { P.slip = !P.slip; $('#btnSlip').setAttribute('aria-pressed', String(P.slip)); toast(P.slip ? 'Trượt: kéo đoạn V1 để đổi khúc lấy trong source, độ dài giữ nguyên' : 'Đã tắt Trượt'); };
$('#btnRipple').onclick = () => { P.ripple = !P.ripple; $('#btnRipple').setAttribute('aria-pressed', String(P.ripple)); };
$('#chuyenMacDinh').onchange = () => { luuHoanTac(); const v = $('#chuyenMacDinh').value; P.clips.forEach((c, i) => { if (i < P.clips.length - 1) c.chuyen = v; }); if (v !== 'cat') gltNap(); veTl(); veKhung(); };
$('#font').addEventListener('change', capNhatFont);
$('#pdViTri').addEventListener('change', () => { P.pdY = +$('#pdViTri').value; if (!P.dang) veKhung(); });
/* kéo phụ đề lên xuống ngay trên khung xem trước ("đưa phụ đề xuống dưới cằm") */
$('#cv').addEventListener('pointerdown', e => {
  if (keoChuTrenKhung(e)) return;
  const r = cv.getBoundingClientRect(), y = (e.clientY - r.top) / r.height; if (Math.abs(y - P.pdY) > 0.09 || !$('#phuDe').checked) return;
  e.preventDefault(); $('.khung').classList.add('keo-pd'); cv.setPointerCapture(e.pointerId);
  let daKeoPd = false; const y00 = e.clientY;
  const mv = ev => { if (!daKeoPd && Math.abs(ev.clientY - y00) < 3) return; daKeoPd = true; P.pdY = Math.max(0.15, Math.min(0.92, (ev.clientY - r.top) / r.height)); if (!P.dang) veKhung(); };
  const up = () => { if (!daKeoPd) { const c = cumHienTai(P.t), i = c ? dsPd().indexOf(c) : -1; if (i >= 0) { P.chon = { k: 'pd', i }; veTl(); veProp(); moPhaiNeuCan(); } } cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); $('.khung').classList.remove('keo-pd'); const o = [...$('#pdViTri').options].find(x => Math.abs(+x.value - P.pdY) < 0.03); $('#pdViTri').value = o ? o.value : $('#pdViTri').value; };
  cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', up);
});
/* lưu / mở dự án: dòng thời gian + cài đặt, footage nhận lại theo tên + cỡ file */
function duAnJson() { banLuuHienTai(); return { v: 4, am3: am3Nhe(), am3Kho: am3KhoLuu(), pdNgoai: P.pdNgoai || null, moc: P.moc, ban: P.ban.map(b => ({ ...b, tieng: undefined })), banDang: P.banDang, ten: $('#tenDuAn').value, srcs: P.srcs.map(s => ({ id: s.id, ten: s.ten, size: s.file.size, loai: s.loai, giay: s.giay, w: s.w, h: s.h, tu: s.tu, cau: s.cau, canh: s.canh, khoanh_khac: s.khoanh_khac, loai_canh: s.loai_canh, mo_ta: s.mo_ta, mat: s.mat, hook_goi_y: s.hook_goi_y, nhan_manh: s.nhan_manh })), clips: P.clips, gfx: P.gfx, broll: P.broll, tieng: P.tieng.map(t => ({ id: t.id, text: t.text, giong: t.giong, cach: t.cach, giay: t.giay, t_bd: t.t_bd, b64: t.b64 })), zoom: P.zoom, beat: P.beat, nhacTen: P.nhac && P.nhac.ten, pdY: P.pdY, lichSu: P.lichSu.slice(-10), cai: Object.fromEntries(['hook', 'phuDe', 'pdKieu', 'pdCum', 'pdNhan', 'khungKieu', 'nenKieu', 'nenMau', 'tiLe', 'nenKhung', 'nenKhungMau', 'zoomOn', 'duckNoi', 'duckBroll', 'font', 'doPhanGiai', 'xuatFps'].map(id => [id, $('#' + id).type === 'checkbox' ? $('#' + id).checked : $('#' + id).value])), mau: mauNhan(), tr: P.tr || {} }; }
$('#btnLuuDA').onclick = () => { const blob = new Blob([JSON.stringify(duAnJson())], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (($('#tenDuAn').value.trim() || 'du-an').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'du-an') + '.tmxk.json'; a.click(); toast('Đã lưu dự án. Mở lại thì thêm lại đúng các file footage.'); };
$('#btnMoDA').onclick = () => $('#moDAIn').click();
$('#moDAIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); P.duAnCho = o; $('#tenDuAn').value = o.ten || 'Video mới'; Object.keys(o.cai || {}).forEach(id => { const x = $('#' + id); if (!x) return; if (x.type === 'checkbox') x.checked = !!o.cai[id]; else x.value = o.cai[id]; }); apDuAnPhu(o); nhanDuAn(); toast('Đã mở dự án. Thêm lại ' + (o.srcs || []).length + ' file footage: ' + (o.srcs || []).map(x => x.ten).join(', ')); doiTab('footage'); } catch { toast('File dự án không đọc được'); } e.target.value = ''; };
/* phần dự án không phụ thuộc footage (lồng tiếng, A3, mốc, phụ đề nhập, vị trí phụ đề, màu nhấn, lịch sử AI): dùng chung cho mở file .json và mở từ Dự án của tôi */
function apDuAnPhu(o) { if (o.mau) $$('#pdMau button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === o.mau))); P.pdY = o.pdY || 0.78; P.lichSu = o.lichSu || []; P.tr = o.tr || P.tr || {}; try { veTrNut(); } catch { } P.tieng = (o.tieng || []).filter(t => t.b64).map(t => ({ ...t, url: URL.createObjectURL(new Blob([Uint8Array.from(atob(t.b64), c => c.charCodeAt(0))], { type: 'audio/wav' })) })); veTl(); veDs(); capNhatFont(); docTuNhan(); datTiLe($('#tiLe').value, true); P.moc = o.moc || []; P.pdNgoai = o.pdNgoai || null; am3KhoNap(o.am3Kho); P.am3 = am3Day(o.am3); cumKey = ''; $('#nenKhung').dispatchEvent(new Event('change')); $('#nenMauHang').hidden = $('#nenKieu').value !== 'mau'; if (segBat()) segNap(); }
/* footage thêm vào khớp tên + cỡ với dự án đang chờ → gắn lại id, lời thoại, dòng thời gian */
function nhanDuAn() { const o = P.duAnCho; if (!o) return; let du = 0; P.srcs.forEach(s => { const m = (o.srcs || []).find(x => x.ten === s.ten && (x.size == null || x.size === s.file.size) && !x.daGan) || (o.srcs || []).find(x => x.size == null && !x.daGan && x.ten.replace(/\.\w+$/, '').toLowerCase() === s.ten.replace(/\.\w+$/, '').toLowerCase()); if (!m) return; m.daGan = true; du++; const cu = s.id; if (typeof nutAm !== 'undefined' && nutAm[cu] && cu !== m.id) { nutAm[m.id] = nutAm[cu]; delete nutAm[cu]; }   /* nút âm lượng đã gắn vào thẻ video theo id cũ */ Object.assign(s, { id: m.id, tu: m.tu || [], cau: m.cau || [], canh: m.canh || [], khoanh_khac: m.khoanh_khac || [], loai_canh: m.loai_canh, mo_ta: m.mo_ta, mat: m.mat || [], hook_goi_y: m.hook_goi_y || [], nhan_manh: m.nhan_manh || [], tt: (m.cau && m.cau.length) || (m.canh && m.canh.length) ? 'xong' : s.tt }); }); const daCo = (o.srcs || []).filter(x => x.daGan).length; if (daCo && daCo === (o.srcs || []).length) { P.clips = o.clips || []; P.gfx = o.gfx || []; P.broll = o.broll || []; if (o.ban) { P.ban = o.ban; P.banDang = o.banDang || 0; veBan(); } P.zoom = o.zoom || []; if (!P.beat.length && o.beat) P.beat = o.beat; P.duAnCho = null; P.hoanTac = []; P.lamLai = []; P._llTruoc = null;   /* dự án khác: lịch sử hoàn tác của dự án trước không còn nghĩa */ veTl(); veLoi(); veKhung(); toast('Đã khôi phục dòng thời gian của dự án'); } else if (du) { veSrcs(); veLoi(); toast('Đã nhận ' + daCo + '/' + (o.srcs || []).length + ' footage, thêm nốt phần còn lại'); } }
/* mốc hít: beat, mép câu (trên dòng thời gian) */
/* spec ghi chú: mọi con số mặc định để một chỗ (tương đương src/config/defaults.ts) */
const MAC_DINH = { hutPx: 8, hutKhungPx: 5, chuGiay: 3, anhGiay: 5, chuyenGiay: 0.5, chuyenMin: 0.1, chuyenMax: 2, dongBangGiay: 3, fps: 30, buocXoay: 15, loiThoiGianXuat: 0.05, tuMoiCauToiDa: 8 };
function mocHit() { const m = [...P.beat]; let acc = 0; P.clips.forEach(c => { m.push(acc); const s = srcCua(c.src); if (s) s.cau.forEach(x => { if (x.bd > c.bd && x.bd < c.kt) m.push(acc + (x.bd - c.bd) / tocC(c)); if (x.kt > c.bd && x.kt < c.kt) m.push(acc + (x.kt - c.bd) / tocC(c)); }); acc += daiC(c); }); m.push(acc); m.push(P.t); P.broll.forEach(b => { if (b !== P.keoMuc) m.push(...khoangMuc('b', b)); }); P.gfx.forEach(g => { if (g !== P.keoMuc) m.push(g.bd, g.kt); }); (P.am3 || []).forEach(a => { if (a !== P.keoMuc) m.push(...khoangMuc('a', a)); }); return m; }
function hit(t) { t = khungGiay(t); if (!P.snap || P.giuCtrl) { if ($('#snapLine')) $('#snapLine').style.display = 'none'; return t; } const ng = MAC_DINH.hutPx / PX(); let best = t, dmin = ng; for (const m of mocHit()) { const d = Math.abs(m - t); if (d < dmin) { dmin = d; best = m; } } $('#snapLine').style.display = best !== t ? 'block' : 'none'; $('#snapLine').style.left = (LB + best * PX()) + 'px'; return best; }
function hitBeat() { if (!P.beat.length) return; let acc = 0; P.clips.forEach((c, i) => { const kt = acc + daiC(c); let best = null, dmin = 0.35; for (const b of P.beat) { const d = Math.abs(b - kt); if (d < dmin) { dmin = d; best = b; } } if (best != null) { const s = srcCua(c.src), moi = c.kt + (best - kt) * tocC(c); if (s && moi > c.bd + 0.3 && moi <= s.giay) c.kt = Math.round(moi * 100) / 100; } acc += daiC(c); }); }
/* kéo thả: thân = di chuyển, mép = cắt; V1 kéo ngang để đổi thứ tự.
   Trong lúc kéo KHÔNG vẽ lại dòng thời gian (vẽ lại là phần tử đang bắt con trỏ bị thay mới, mất kéo); chỉ chỉnh style tại chỗ. */
function layoutV1() { let acc = 0; const items = $$('.track.v1 .item'); P.clips.forEach((c, j) => { const it = items[j]; if (!it) return; it.style.left = acc * PX() + 'px'; it.style.width = Math.max(6, daiC(c) * PX() - 2) + 'px'; acc += daiC(c); }); }
function chonHien() { setTimeout(veTay, 0); $$('.track .item').forEach(x => x.classList.remove('chon')); if (P.chon) { const it0 = $$('.item[data-k="' + P.chon.k + '"]').find(x => +x.dataset.i === P.chon.i); if (it0) { it0.classList.add('chon'); return; } const it = $$({ v: '.track.v1 .item', g: '.track.o1 .item', b: '.item.b' }[P.chon.k]).find(x => P.chon.k !== 'b' || +x.dataset.i === P.chon.i); const it2 = P.chon.k === 'b' ? $$('.item.b').find(x => +x.dataset.i === P.chon.i) : $$({ v: '.track.v1 .item:not(.vungCat):not(.ngo)', g: '.track.o1 .item', a: '.track.a3 .item', t: '.track.a2 .item' }[P.chon.k] || '.none')[P.chon.i]; if (it2) it2.classList.add('chon'); } }
function keoItem(d, k, i, bd, dai) {
  d.dataset.k = k; d.dataset.i = i;
  d.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; e.stopPropagation();
    const trk = d.closest('.track'); if (trk && trKhoa(trk.dataset.track)) { P.chon = { k, i }; chonHien(); veProp(); toast('Track đang khoá 🔒 · bấm ổ khoá ở đầu track để mở'); return; }
    const mObj = MANG()[k][i]; if (!mObj) return;
    let altCp = false; if (e.altKey && 'bga'.includes(k)) { altCp = true; luuHoanTac(); const cp = JSON.parse(JSON.stringify(mObj)); cp.id = uid(); delete cp.nhom; MANG()[k].push(k === 'a' ? am3Day([cp])[0] : cp); toast('Alt + kéo: đã nhân bản, bản gốc ở lại chỗ cũ'); }
    const khoaTruc = e.shiftKey && !e.ctrlKey && !e.metaKey && (dangChon(mObj) || (P.chon && P.chon.k === k && P.chon.i === i));   /* spec 1.3: Shift + kéo mục đang chọn = khoá trục (chỉ đổi thời gian); Shift + bấm mục khác = thêm vào vùng chọn */
    if (!khoaTruc && (e.ctrlKey || e.metaKey || e.shiftKey)) { batChonNhieu(k, mObj); return; }
    if (!dangChon(mObj)) P.nhieu = mObj.nhom ? moiMuc().filter(o => o.m.nhom === mObj.nhom) : [];
    if (k === 'v' && mObj.trong) { P.chon = { k, i }; chonHien(); veProp(); return; }
    const mep = e.target.classList.contains('h') && d.offsetWidth >= 30 ? (e.target.classList.contains('l') ? 'l' : 'r') : '';   // mục quá hẹp: chỉ dời, không cắt mép
    P.chon = { k, i }; chonHien(); veProp(); moPhaiNeuCan();
    try { d.setPointerCapture(e.pointerId); } catch {}
    const y0 = e.clientY, hang0 = d.parentElement; let hangDich = null;
    const x0 = e.clientX, px = PX(), goc = JSON.parse(JSON.stringify(k === 'v' ? P.clips[i] : k === 'b' ? P.broll[i] : k === 't' ? { t_bd: P.tieng[i].t_bd } : k === 'a' ? P.am3[i] : P.gfx[i])); let daKeo = false, vtMoi = i, dxCuoi = 0;
    const gocTruoc = k === 'v' && i > 0 ? JSON.parse(JSON.stringify(P.clips[i - 1])) : null, gocSau = k === 'v' && P.clips[i + 1] ? JSON.parse(JSON.stringify(P.clips[i + 1])) : null; let dungCuon = false, dungTruot = false, dlCuoi = 0;   /* Alt + kéo mép = roll, Alt + kéo đoạn = slide (như Premiere/FilmCraft) */
    const nhom0 = k === 'v' ? [] : dsNhieu().filter(o => o.m !== mObj && o.k !== 'v').map(o => ({ o, t: batDau2(o.k, o.m) })), bd00 = k === 'v' ? 0 : batDau2(k, mObj);
    luuHoanTac(); P.dangKeo = true; P.keoMuc = { b: P.broll, g: P.gfx, v: P.clips, a: P.am3, t: P.tieng }[k][i];
    const move = ev => {
      const dx = lamTronKhung((ev.clientX - x0) / px); if (Math.abs(ev.clientX - x0) > 3 || Math.abs(ev.clientY - y0) > 6) daKeo = true; if (!daKeo) return;
      if (!mep && ['b', 'g', 'v', 'a'].includes(k) && !P.slip) { const mm = { b: P.broll, g: P.gfx, v: P.clips, a: P.am3 }[k][i]; let dt = null; if (Math.abs(ev.clientY - y0) > 14 && !khoaTruc && !ev.shiftKey) { dt = dichTha(ev.clientY, k, mm, k === 'v' ? [bd, bd + dai] : null); if (dt && !dt.moi && dt.hang === hang0) dt = null; } $$('#tlIn .dich, #tlIn .chen').forEach(x => x.classList.remove('dich', 'chen')); hangDich = dt; if (dt) dt.hang.classList.add(dt.moi ? 'chen' : 'dich'); if (k !== 'v') { d.style.transform = dt ? 'translateY(' + (dt.hang.getBoundingClientRect().top - hang0.getBoundingClientRect().top - (dt.moi ? 10 : 0)) + 'px)' : ''; d.style.zIndex = dt ? 6 : ''; } else d.style.opacity = dt ? '.45' : ''; }
      if (k === 't') { const t = P.tieng[i]; if (!mep) t.t_bd = Math.max(0, hit(goc.t_bd + dx)); d.style.left = t.t_bd * px + 'px'; }
      else if (k === 'a') { const a = P.am3[i]; if (mep === 'l') { const nb = Math.max(0, Math.min(goc.kt - 0.05, goc.bd + dx)); a.t_bd = Math.max(0, goc.t_bd + (nb - goc.bd)); a.bd = nb; } else if (mep === 'r') a.kt = Math.max(goc.bd + 0.05, Math.min(a.giay || 1e9, goc.kt + dx)); else a.t_bd = Math.max(0, hit(goc.t_bd + dx)); d.style.left = a.t_bd * px + 'px'; d.style.width = Math.max(6, (a.kt - a.bd) * px - 2) + 'px'; }
      else if (k === 'g') { const g = P.gfx[i]; if (mep === 'l') g.bd = Math.max(0, Math.min(goc.kt - 0.4, hit(goc.bd + dx))); else if (mep === 'r') g.kt = Math.max(goc.bd + 0.4, hit(goc.kt + dx)); else { const len = goc.kt - goc.bd; g.bd = Math.max(0, hit(goc.bd + dx)); g.kt = g.bd + len; } d.style.left = g.bd * px + 'px'; d.style.width = Math.max(6, (g.kt - g.bd) * px - 2) + 'px'; }
      else if (k === 'b') { const b = P.broll[i], s = srcCua(b.src), max = s && (s.loai === 'video' || s.loai === 'ghep') ? s.giay : 1e9; if (mep === 'l') { const t2 = tocC(goc), nb = Math.max(0, Math.min(goc.kt - 0.4, goc.bd + dx * t2)); b.t_bd = Math.max(0, goc.t_bd + (nb - goc.bd) / t2); b.bd = nb; } else if (mep === 'r') { const k2 = tocC(b), cuoi = hit(goc.t_bd + (goc.kt - goc.bd) / k2 + dx); b.kt = Math.max(goc.bd + 0.4, Math.min(max, goc.bd + (cuoi - goc.t_bd) * k2)); } else b.t_bd = Math.max(0, hit(goc.t_bd + dx)); d.style.left = b.t_bd * px + 'px'; d.style.width = Math.max(6, (b.kt - b.bd) / tocC(b) * px - 2) + 'px'; }
      else if (P.slip && !mep) { const c = P.clips[i], s = srcCua(c.src), len = goc.kt - goc.bd, nb = Math.max(0, Math.min((s ? s.giay : goc.kt) - len, goc.bd - dx)); c.bd = nb; c.kt = nb + len; d.querySelector('b').textContent = 'S' + (P.srcs.indexOf(s) + 1) + ' · ' + fmt1(len) + 's ↔ ' + fmt1(nb) + 's'; }
      else if (mep && (ev.altKey || P.cheDoTrim === 'roll') && (mep === 'r' ? gocSau : gocTruoc)) { dungCuon = true; dlCuoi = mep === 'r' ? cuonMep(i, dx, goc, gocSau) : cuonMep(i - 1, dx, gocTruoc, goc); layoutV1(); hienTip(ev, '⇄ Dời điểm nối ' + (dlCuoi >= 0 ? '+' : '') + fmt1(dlCuoi) + 's'); }
      else if (!mep && (ev.altKey || P.cheDoTrim === 'slide') && (gocTruoc || gocSau)) { dungTruot = true; dlCuoi = truotDoan(i, dx, gocTruoc, gocSau); layoutV1(); hienTip(ev, '⇆ Trượt đoạn ' + (dlCuoi >= 0 ? '+' : '') + fmt1(dlCuoi) + 's'); }
      else { const c = P.clips[i], s = srcCua(c.src);
        if (mep === 'l') { if (goc.dao) c.kt = Math.max(goc.bd + 0.3, Math.min(gioiHanNguon(s, 1e9), goc.kt - dx * tocC(goc))); else c.bd = Math.max(0, Math.min(goc.kt - 0.3, goc.bd + dx * tocC(goc))); layoutV1(); }
        else if (mep === 'r') { const dl = (hit(bd + daiC(goc) + dx) - bd) * tocC(goc); if (goc.dao) c.bd = Math.max(0, Math.min(goc.kt - 0.3, goc.kt - dl)); else { const nk = goc.bd + dl; c.kt = Math.max(goc.bd + 0.3, Math.min(gioiHanNguon(s, nk), nk)); } layoutV1(); }
        else { dxCuoi = dx; d.style.transform = 'translateX(' + (ev.clientX - x0) + 'px)'; d.style.zIndex = 5; const tam = bd + dx + dai / 2; let acc = 0; vtMoi = P.clips.length - 1; for (let j = 0; j < P.clips.length; j++) { const len = daiC(P.clips[j]); if (tam < acc + len) { vtMoi = j; break; } acc += len; } }
      }
      if (!mep && nhom0.length) { const dl = batDau2(k, mObj) - bd00; nhom0.forEach(x => { datBatDau(x.o.k, x.o.m, x.t + dl); const dd = $('#tlIn .item[data-k="' + x.o.k + '"][data-i="' + MANG()[x.o.k].indexOf(x.o.m) + '"]'); if (dd) dd.style.left = batDau2(x.o.k, x.o.m) * px + 'px'; }); }
      { const mm = { b: P.broll, g: P.gfx, v: P.clips, a: P.am3, t: P.tieng }[k][i]; if (mm) { if (mep) hienTip(ev, '⟷ ' + fmt1(k === 'v' ? daiC(mm) : k === 'g' ? mm.kt - mm.bd : k === 'b' ? (mm.kt - mm.bd) / tocC(mm) : mm.kt - mm.bd) + 's'); else if (k !== 'v') hienTip(ev, '▸ ' + fmt1(k === 'g' ? mm.bd : mm.t_bd) + 's'); } }
      if (!P.dang) veKhung();
    };
    const up = () => {
      d.removeEventListener('pointermove', move); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', up); $('#snapLine').style.display = 'none';
      const choVe = P.veTlCho; P.dangKeo = false; P.veTlCho = false; $$('#tlIn .dich, #tlIn .chen').forEach(x => x.classList.remove('dich', 'chen')); P.keoMuc = null; hienTip(null);
      if (!daKeo) { huyHoanTac(); if (altCp) { MANG()[k].pop(); huyHoanTac(); veTl(); } else if (choVe) veTl(); return; }
      if (dungCuon || dungTruot) { const B = dungCuon ? (mep === 'r' ? P.clips[i + 1] : P.clips[i]) : P.clips[i + 1]; if (B && dlCuoi) doiKf(B, -dlCuoi); veTl(); veLoi(); veKhung(); veProp(); toast(dungCuon ? 'Đã dời điểm nối ' + fmt1(dlCuoi) + 's, tổng độ dài giữ nguyên' : 'Đã trượt đoạn ' + fmt1(dlCuoi) + 's, đoạn trước và sau co giãn theo'); return; }
      if (hangDich) { const dt = hangDich; if (k === 'a') { P.am3[i].lop = dt.alop; datLopTha('a', P.am3[i]); } else if (dt.v1) lopXuongV1(i); else if (k === 'v') v1LenLop(i, dt.lop); else { const m = k === 'b' ? P.broll[i] : P.gfx[i]; m.lop = dt.lop; datLopTha(k, m); } veTl(); veLoi(); veKhung(); veProp(); toast(dt.v1 ? 'Đã đưa xuống track chính' : dt.moi ? 'Đã tạo line mới' : k === 'v' ? 'Đã đưa đoạn lên line phủ' : 'Đã chuyển line'); return; }
      P.keoMuc = null; hienTip(null);
      nhom0.forEach(x => { if (x.o.k === 'b' || x.o.k === 'g' || x.o.k === 'a') datLopTha(x.o.k, x.o.m); });
      if (k === 'b' || k === 'g' || k === 'a') { const m = { b: P.broll, g: P.gfx, a: P.am3 }[k][i]; if (m && datLopTha(k, m)) toast('Chồng giờ với mục khác trong hàng → đặt sang hàng ' + (k === 'a' ? 'âm thanh' : 'cùng loại') + ' khác'); }
      if (k === 'v' && !mep && !P.slip && (vtMoi !== i || P.namCham === false)) datLaiV1(i, vtMoi, P.namCham === false ? bd + dxCuoi : null);
      const v1Cu = k === 'v' && mep ? P.clips.reduce((a, c, j) => a + (j === i ? daiC(goc) : daiC(c)), 0) : 0;
      if (k === 'v' && mep === 'r') ripple(bd + daiC(goc), daiC(P.clips[i]) - daiC(goc), v1Cu);
      if (k === 'v' && mep === 'l') ripple(bd, -(goc.dao ? goc.kt - P.clips[i].kt : P.clips[i].bd - goc.bd) / tocC(goc), v1Cu);
      if (mep === 'l' && 'vbg'.includes(k)) { const m = MANG()[k][i], dl = k === 'g' ? m.bd - goc.bd : (goc.dao ? goc.kt - m.kt : m.bd - goc.bd) / tocC(goc); if (m && dl && m.kfs) doiKf(m, -dl); }
      veTl(); veLoi(); veKhung();
    };
    d.addEventListener('pointermove', move); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
  });
}
/* bấm vào ruler / track trống = đặt playhead; thả footage vào V1 */
$('#tlIn').addEventListener('pointerdown', e => { if (e.target.closest('.item') || e.target.closest('.lb')) return; const r = $('#tlIn').getBoundingClientRect(); const t = khungGiay(Math.max(0, Math.min(tongGiay(), (e.clientX - r.left - LB) / PX()))); if (P.dang) dung(); P.t = t; if (!e.target.closest('#ruler')) P.chon = null; veTl(); veKhung(); });
$('#ruler').addEventListener('pointerdown', e => { if (!e.shiftKey || e.button || e.target.closest('.vungVR')) return; e.preventDefault(); e.stopPropagation(); const r = $('#tlIn').getBoundingClientRect(), T = tongGiay(), tAt = x => Math.max(0, Math.min(T, (x - r.left - LB) / PX())), a0 = hit(tAt(e.clientX)); luuHoanTac(); let doi = false;   /* Shift + kéo trên thước = quét vùng In–Out */
  const mv = ev => { if (Math.abs(ev.clientX - e.clientX) < 3 && !doi) return; doi = true; const t = hit(tAt(ev.clientX)); P.vao = +Math.min(a0, t).toFixed(3); P.ra = +Math.max(a0, t).toFixed(3); veVaoRa(); hienTip(ev, 'In ' + fmt1(P.vao) + 's – Out ' + fmt1(P.ra) + 's'); };
  const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); $('#snapLine').style.display = 'none'; hienTip(null); if (!doi || P.ra - P.vao < 0.05) { huyHoanTac(); if (doi) { P.vao = P.ra = null; veVaoRa(); } } };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }, true);
$('#tlIn').addEventListener('dragover', e => { e.preventDefault(); });
$('#tlIn').addEventListener('drop', async e => { e.preventDefault(); try { const o = JSON.parse(e.dataTransfer.getData('text/plain')); if (o && o.src) { const r = $('#tlIn').getBoundingClientRect(); thaVaoTl(o, (e.clientX - r.left - LB) / PX(), e.clientY); return; } } catch { }   /* kéo từ thư viện: dùng nguồn có sẵn, bỏ qua file ảnh trình duyệt tự đính kèm */
  const fs = [...((e.dataTransfer && e.dataTransfer.files) || [])].filter(f => /^(video|image)\//.test(f.type)); if (fs.length) { const truoc = P.srcs.length, r0 = $('#tlIn').getBoundingClientRect(), t0 = Math.max(0, (e.clientX - r0.left - LB) / PX()), y0 = e.clientY; await themFile(fs); const moi = [...(themFile.trung || []), ...P.srcs.slice(truoc)]; let tt = t0; for (const s of moi) { thaVaoTl({ src: s.id, bd: 0, kt: s.loai === 'video' ? s.giay : (s.giay && s.giay < 60 ? s.giay : 3) }, tt, y0); tt += s.loai === 'video' ? s.giay : 3; } return; } try { const o = JSON.parse(e.dataTransfer.getData('text/plain')); if (!o.src) return; const r = $('#tlIn').getBoundingClientRect(), t = (e.clientX - r.left - LB) / PX(); thaVaoTl(o, t, e.clientY); } catch {} });
function thaVaoTl(o, t, clientY) { {
  const mTam = { t_bd: Math.max(0, hit(t)), bd: o.bd, kt: o.kt }, dt = dichTha(clientY, 'b', mTam); if (dt && !dt.v1 && dt.lop != null) { luuHoanTac(); P.broll.push({ id: uid(), src: o.src, bd: mTam.bd, kt: mTam.kt, t_bd: mTam.t_bd, kieu: 'full', lop: dt.lop }); veTl(); veKhung(); toast(dt.moi ? 'Đã đặt lên line mới' : 'Đã đặt lên line phủ. Chọn để đổi khung nhỏ, vừa khung.'); return; } let acc = 0, vt = P.clips.length; for (let j = 0; j < P.clips.length; j++) { const len = daiC(P.clips[j]); if (t < acc + len / 2) { vt = j; break; } acc += len; } luuHoanTac(); const cm = { src: o.src, bd: o.bd, kt: o.kt, ly_do: 'kéo vào' }, ch = chupChen(); P.clips.splice(vt, 0, cm); apChen(ch, acc, daiC(cm)); P.chon = { k: 'v', i: vt }; veTl(); veKhung(); veProp(); toast('Đã chèn ' + fmt1(daiC(cm)) + 's vào track chính'); } }
function viTri(t) { let acc = 0; for (let i = 0; i < P.clips.length; i++) { const c = P.clips[i], d = daiC(c); if (t < acc + d || i === P.clips.length - 1) return { clip: i, tSrc: c.dao ? Math.max(c.bd, c.kt - 0.001 - srcTuTl(c, Math.max(0, t - acc))) : Math.min(c.kt, c.bd + srcTuTl(c, Math.max(0, t - acc))), bdTl: acc }; acc += d; } return { clip: -1, tSrc: 0, bdTl: 0 }; }
function xemTai(sid, tSrc) { let acc = 0; for (const c of P.clips) { if (c.src === sid && tSrc >= c.bd && tSrc <= c.kt) { P.t = acc + (tSrc - c.bd) / tocC(c); veKhung(); vePh(); return; } acc += daiC(c); } toast('Câu này đang bị cắt, tick lại để đưa vào'); }
function lenh(act) {
  if (P.chon && P.chon.k === 'pd' && !(dsNhieu().length > 1)) { if (act === 'xoa') xoaPd(P.chon.i); else if (act === 'tach') tachPd(P.chon.i, P.t); else toast('Phụ đề: dùng Tách hoặc Xoá'); return; }
  if (dsNhieu().length > 1) { if (act === 'xoa') { xoaNhieu(); return; } if (act === 'nhan') { const ds = dsNhieu(); if (ds.some(o => khoaMuc(o.k, o.m))) { baoKhoa(); return; } const bn = P.boNho, t0 = P.t; P.t = khungGiay(Math.max(...ds.map(o => batDauMuc(o.k, o.m) + daiMuc(o.k, o.m)))); saoChepNhieu(); danNhieu(); P.boNho = bn; P.t = t0; veTl(); return; } }
  if (!P.chon) { if (act === 'tach') { const { clip, tSrc } = viTri(P.t); if (clip >= 0) { P.chon = { k: 'v', i: clip }; } else return; } else { toast('Chọn một đoạn trên dòng thời gian trước'); return; } }
  { const m0 = (MANG()[P.chon.k] || [])[P.chon.i]; if (khoaMuc(P.chon.k, m0)) { baoKhoa(); return; } }
  luuHoanTac(); const { k, i } = P.chon;
  if (k === 't') { const t = P.tieng[i]; if (act === 'xoa') { P.tieng.splice(i, 1); P.chon = null; } if (act === 'nhan') P.tieng.splice(i + 1, 0, { ...t, id: uid(), t_bd: t.t_bd + t.giay }); if (act === 'tach') toast('Lồng tiếng không tách được, tạo câu ngắn hơn'); veTl(); return; }
  if (k === 'a') { const a = P.am3[i]; if (act === 'xoa') { P.am3.splice(i, 1); P.chon = null; } if (act === 'nhan') { const cp = JSON.parse(JSON.stringify(a)); P.am3.splice(i + 1, 0, am3Day([{ ...cp, id: uid(), t_bd: khungGiay(a.t_bd + a.kt - a.bd) }])[0]); } if (act === 'tach') { const o = P.t - a.t_bd; if (o > 0.05 && o < a.kt - a.bd - 0.05) { const giua = +(a.bd + o).toFixed(4); P.am3.splice(i + 1, 0, am3Day([{ ...JSON.parse(JSON.stringify(a)), id: uid(), bd: giua, t_bd: khungGiay(P.t), fi: 0 }])[0]); a.kt = giua; a.fo = 0; } else toast('Đưa đầu phát vào giữa âm thanh đang chọn rồi bấm Tách'); } veTl(); return; }
  if (k === 'b') { const b = P.broll[i]; if (act === 'xoa') { P.broll.splice(i, 1); P.chon = null; } if (act === 'nhan') P.broll.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(b)), id: uid(), t_bd: khungGiay(b.t_bd + (b.kt - b.bd) / tocC(b)) }); if (act === 'tach') toast('B-roll không tách được, kéo mép để đổi độ dài'); veTl(); veKhung(); return; }
  if (k === 'v') { const c = P.clips[i]; if (act === 'xoa') { let acc = 0; for (let j = 0; j < i; j++) acc += daiC(P.clips[j]); ripple(acc + daiC(c), -daiC(c)); P.clips.splice(i, 1); P.chon = null; } if (act === 'nhan') { const ch = chupChen(), st = batDauC(c), cp = { ...JSON.parse(JSON.stringify(c)), ...(c.id ? { id: uid() } : {}) }; P.clips.splice(i + 1, 0, cp); apChen(ch, st + daiC(c), daiC(cp)); P.chon = { k: 'v', i: i + 1 }; } if (act === 'tach') { const { clip } = viTri(P.t), off = P.t - batDauC(c); if (clip === i && off > 1 / fpsDuAn() - 1e-6 && off < daiC(c) - 1 / fpsDuAn() + 1e-6) { if (tachV1(i, off)) P.chon = { k: 'v', i: i + 1 }; } else if (!(Math.abs(off) < 1e-3 || Math.abs(off - daiC(c)) < 1e-3)) toast('Đưa đầu phát vào giữa đoạn đang chọn rồi bấm Tách'); } }
  else { const g = P.gfx[i]; if (act === 'xoa') { P.gfx.splice(i, 1); P.chon = null; } if (act === 'nhan') P.gfx.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(g)), id: uid(), bd: g.kt, kt: khungGiay(g.kt + (g.kt - g.bd)) }); if (act === 'tach') toast('Đồ hoạ không tách được, kéo mép để đổi độ dài'); }
  veTl(); veLoi(); veKhung();
}
$$('.etool [data-act]').forEach(b => b.onclick = () => lenh(b.dataset.act));

/* ═════════ thuộc tính (cột phải) ═════════ */
function veProp() {
  const box = $('#propChon'); box.innerHTML = '';
  if (!P.chon) return;
  if (P.chon.k === 'pd') { veThuocTinhPd(box, P.chon.i); return; }
  if (P.chon.k === 'a') { veThuocTinhAm3(box, P.am3[P.chon.i]); return; }
  if (P.chon.k === 't') { const t = P.tieng[P.chon.i]; if (!t) return; box.appendChild(el('h3', null, 'Lồng tiếng A2 đang chọn')); box.appendChild(el('div', 'quota', (TIENG_GIONG[t.giong] || t.giong) + (t.cach ? ' · ' + t.cach : '') + ' · ' + fmt1(t.giay) + 's · từ ' + fmt1(t.t_bd) + 's')); box.appendChild(el('div', 'quota', '“' + t.text.slice(0, 220) + '”')); const row = el('div', 'row'); [['−0,3s', () => { t.t_bd = Math.max(0, t.t_bd - 0.3); }], ['+0,3s', () => { t.t_bd += 0.3; }], ['▶ Nghe', () => { const a = new Audio(t.url); a.play(); }], ['Sửa lại lời', () => { $('#tiengText').value = t.text; $('#tiengGiong').value = t.giong; $('#tiengCach').value = t.cach || ''; P.t = t.t_bd; veKhung(); toast('Sửa lời rồi bấm Tạo: bản mới đặt cùng chỗ, xoá bản cũ nếu không dùng'); }]].forEach(([tx, f]) => { const b = el('button', 'btn nho', tx); b.type = 'button'; b.onclick = () => { luuHoanTac(); f(); veTl(); }; row.appendChild(b); }); box.appendChild(row); return; }
  if (P.chon.k === 'b') { const b = P.broll[P.chon.i]; if (!b) return; const s = srcCua(b.src); box.appendChild(el('h3', null, 'B-roll V2 đang chọn')); box.appendChild(el('div', 'quota', 'S' + (P.srcs.indexOf(s) + 1) + ' · ' + fmt1(b.bd) + '–' + fmt1(b.kt) + 's · hiện từ ' + fmt1(b.t_bd) + 's')); const lk = el('label'); lk.appendChild(el('span', null, 'Kiểu')); const sk = el('select'); [['full', 'Che toàn khung'], ['pip', 'Khung nhỏ phía trên']].forEach(([v, t]) => { const o = el('option', null, t); o.value = v; sk.appendChild(o); }); sk.value = b.kieu; sk.onchange = () => { b.kieu = sk.value; veTl(); veKhung(); }; lk.appendChild(sk); box.appendChild(lk); veThuocTinhBroll(box, b); const x2 = el('button', 'btn nho', '🗑 Xoá'); x2.type = 'button'; x2.onclick = () => lenh('xoa'); box.appendChild(x2); return; }
  if (P.chon.k === 'v') { const c = P.clips[P.chon.i]; if (!c) return; const s = srcCua(c.src); box.appendChild(el('h3', null, 'Đoạn V1 đang chọn'));
    if (P.chon.i < P.clips.length - 1) { const lc = el('label'); lc.appendChild(el('span', null, 'Chuyển sang đoạn sau')); const sc = el('select'); Object.keys(CHUYEN_TEN).forEach(v => { const o = el('option', null, CHUYEN_TEN[v]); o.value = v; sc.appendChild(o); }); sc.value = c.chuyen || 'cat'; sc.onchange = () => { luuHoanTac(); c.chuyen = sc.value; if (sc.value !== 'cat') gltNap(); veTl(); veKhung(); }; lc.appendChild(sc); box.appendChild(lc); const ld = el('label'); ld.appendChild(el('span', null, 'Độ dài chuyển')); const rd = el('input'); rd.type = 'range'; rd.min = 1; rd.max = 20; rd.value = Math.round((c.chuyen_dai || (P.cai && P.cai.chuyen) || 0.5) * 10); rd.oninput = () => { if (!rd._luu) { luuHoanTac(); rd._luu = 1; } c.chuyen_dai = +rd.value / 10; veKhung(); }; rd.onchange = () => { rd._luu = 0; }; ld.appendChild(rd); box.appendChild(ld); } const p = el('div', 'quota', 'S' + (P.srcs.indexOf(s) + 1) + ' · ' + fmt1(c.bd) + '–' + fmt1(c.kt) + 's (' + fmt1(c.kt - c.bd) + 's)'); box.appendChild(p); const cau = s ? s.cau.filter(x => x.kt > c.bd + 0.1 && x.bd < c.kt - 0.1) : []; if (cau.length) box.appendChild(el('div', 'quota', '“' + cau.map(x => x.text).join(' ').slice(0, 220) + '”')); veThuocTinhDoan(box, c); }
  else { const g = P.gfx[P.chon.i]; if (!g) return; box.appendChild(el('h3', null, (GX[g.kieu] || {}).ic + ' ' + (GX[g.kieu] || {}).ten)); if (g.kieu === 'ghep') { box.lastChild.textContent = '▣ ' + (g.ten || 'Clip ghép'); veThuocTinhGhep(box, g); veThuocTinhBlend(box, g); const xg = el('button', 'btn nho', '🗑 Xoá'); xg.type = 'button'; xg.onclick = () => lenh('xoa'); box.appendChild(xg); return; } if (g.mau_id && mauDoHoa(g.mau_id)) { const mm = mauDoHoa(g.mau_id); box.lastChild.textContent = (mm.ic || '◈') + ' ' + mm.ten; veThuocTinhMau(box, g); const f0 = el('label'); f0.appendChild(el('span', null, 'Bắt đầu · độ dài')); f0.appendChild(el('span', 'quota', fmt1(g.bd) + 's · ' + fmt1(g.kt - g.bd) + 's')); box.appendChild(f0); veThuocTinhGfx3(box, g); veThuocTinhBlend(box, g); const xm = el('button', 'btn nho', '🗑 Xoá'); xm.type = 'button'; xm.onclick = () => lenh('xoa'); box.appendChild(xm); return; } const f1 = el('label', 'full'); f1.appendChild(el('span', null, NHAN_CHU[g.kieu] || 'Chữ')); const i1 = el('input'); i1.type = 'text'; i1.value = g.text; i1.addEventListener('blur', () => { i1._luu = 0; }); i1.oninput = () => { if (!i1._luu) { luuHoanTac(); i1._luu = 1; } g.text = i1.value; veTl(); veKhung(); }; f1.appendChild(i1); box.appendChild(f1); if (PHU_NHAN[g.kieu]) { const f2 = el('label', 'full'); f2.appendChild(el('span', null, PHU_NHAN[g.kieu])); const i2 = el('input'); i2.type = 'text'; i2.value = g.phu; i2.oninput = () => { g.phu = i2.value; veKhung(); }; f2.appendChild(i2); box.appendChild(f2); } const f3 = el('label'); f3.appendChild(el('span', null, 'Bắt đầu · độ dài')); f3.appendChild(el('span', 'quota', fmt1(g.bd) + 's · ' + fmt1(g.kt - g.bd) + 's')); box.appendChild(f3); veThuocTinhMG(box, g); if (g.kieu === 'chu' || g.kieu === 'sticker' || g.kieu === 'ghim_ban_do') veThuocTinhChu(box, g); }
  if (P.chon.k === 'g' && P.gfx[P.chon.i]) { veThuocTinhGfx3(box, P.gfx[P.chon.i]); veThuocTinhBlend(box, P.gfx[P.chon.i]); }
  const x = el('button', 'btn nho', '🗑 Xoá'); x.type = 'button'; x.onclick = () => lenh('xoa'); box.appendChild(x);
}
function moPhaiNeuCan() { if (typeof laMobi === 'function' && laMobi()) return; if (matchMedia('(max-width:1180px)').matches) $('#ed').classList.add('co-phai'); }   // điện thoại: chọn đoạn hiện thanh thao tác nhanh trước, bấm Thuộc tính mới mở bảng
$('#btnThuocTinh').onclick = () => $('#ed').classList.toggle('co-phai');
$('#btnDongPhai').onclick = () => $('#ed').classList.remove('co-phai');
Object.keys(GX).forEach(k => { if (k === 'ghep') return; const b = el('button'); b.type = 'button'; b.innerHTML = '<i>' + GX[k].ic + '</i>' + GX[k].ten; b.onclick = () => { if (k === 'ai') { moHopAI(); return; } luuHoanTac(); const dai = GX[k].dai || tongGiay(), bd = k === 'tien_do' ? 0 : P.t; const mau = { tieu_de: 'CHỮ ĐẬP', lower_third: 'Tên bạn', danh_sach: 'Mục 1|Mục 2|Mục 3', trich_dan: 'Câu đắt nhất trong video', dem_so: '80%', nhan_goc: 'Bước 1', chu: 'Chữ của bạn', sticker: '🔥', bieu_do_cot: 'Tháng 1:2|Tháng 2:5|Tháng 3:9', bieu_do_duong: 'T1:2|T2:5|T3:4|T4:9', bieu_do_vung: 'T1:3|T2:4|T3:7|T4:12', bieu_do_tron: '72%', truoc_sau: 'Làm thủ công|Dùng AI', so_sanh: 'CapCut|Vyra', checklist: 'Quay dọc|Ánh sáng tốt|Hook 3 giây', binh_luan: 'Làm sao để lên xu hướng vậy anh?', dang_ky: '@tuminhxaykenh', dem_nguoc: '3', ghim_ban_do: 'Đà Lạt', tim_kiem: 'cách lên xu hướng TikTok', thong_bao: 'Bạn có 1 đơn hàng mới' }; P.gfx.push({ id: uid(), ...(GX_MD[k] || {}), kieu: k, bd, kt: Math.min(Math.max(tongGiay(), bd + 1), bd + dai || tongGiay()), text: mau[k] || '', phu: k === 'lower_third' ? 'Tự Mình Xây Kênh' : '' }); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veKhung(); }; $('#gx').appendChild(b); });
$$('#pdMau button').forEach(b => b.onclick = () => { $$('#pdMau button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); veKhung(); });
const mauNhan = () => ($('#pdMau [aria-pressed="true"]') || {}).dataset?.m || '#99DF00';
function docTuNhan() { P.tuNhan = $('#pdNhan').value.split(/[,;]/).map(x => x.trim().toLowerCase()).filter(Boolean); }
['hook', 'phuDe', 'pdKieu', 'pdCum', 'pdNhan', 'khungKieu', 'nenMau', 'zoomOn', 'duckNoi', 'duckBroll', 'snapBeat'].forEach(id => $('#' + id).addEventListener('input', () => { docTuNhan(); veTl(); if (!P.dang) veKhung(); }));
$('#nhacIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('#nhacTt').textContent = 'Đang đo beat…'; try { const ab = await giaiMaAm(f); P.beat = doBeat(ab); P.nhac = { ten: f.name, url: URL.createObjectURL(f), giay: ab.duration }; if (nhacEl) { nhacEl.pause(); nhacEl = null; nhacGain = null; } $('#nhacTt').textContent = '✓ ' + f.name + ' · ' + fmt(ab.duration) + ' · ' + P.beat.length + ' beat' + (P.beat.length > 4 ? ' (~' + Math.round(60 / ((P.beat[P.beat.length - 1] - P.beat[0]) / (P.beat.length - 1))) + ' BPM)' : ''); veTl(); toast('Đã đo ' + P.beat.length + ' beat. Bật 🧲 Hít để mép đoạn bám beat, hoặc bảo trợ lý "cắt theo beat".'); } catch (err) { $('#nhacTt').textContent = 'Không đọc được file nhạc.'; } };

/* ═════════ phụ đề theo cụm từ ═════════ */
function cumTu() {
  if (P.pdNgoai && P.pdNgoai.length) return cumNgoai();
  const n = +$('#pdCum').value || 4, out = []; let acc = 0;
  P.clips.forEach(c => { const s = srcCua(c.src); if (s && s.tu.length) { const ws = s.tu.filter(t => !t.an && t.bd >= c.bd - 0.05 && t.kt <= c.kt + 0.05); for (let i = 0; i < ws.length; i += n) { const g = ws.slice(i, i + n); let cat = g.length; for (let k = 0; k < g.length - 1; k++) if (/[.!?…,]$/.test(g[k].w) && k >= 1) { cat = k + 1; break; } if (ws[i].nhom) { cat = 1; while (i + cat < ws.length && ws[i + cat].nhom === ws[i].nhom) cat++; } else for (let k = 1; k < cat; k++) if (ws[i + k] && ws[i + k].nhom) { cat = k; break; } const gg = ws.slice(i, i + cat); i += cat - n; const k = tocC(c); out.push({ s: s.id, ci: P.clips.indexOf(c), w: gg, bd: acc + tlTuSrc(c, gg[0].bd - c.bd), kt: acc + tlTuSrc(c, gg[gg.length - 1].kt - c.bd) + 0.12, tu: gg.map(t => ({ w: t.w, bd: acc + tlTuSrc(c, t.bd - c.bd), kt: acc + tlTuSrc(c, t.kt - c.bd) })) }); } } acc += daiC(c); });
  for (let k = 0; k < out.length - 1; k++) { const a = out[k], b = out[k + 1]; if (a.kt > b.bd) { a.kt = Math.max(a.bd + 0.05, b.bd); a.tu.forEach(t => { if (t.kt > a.kt) t.kt = a.kt; }); } }   // không cho hai câu chồng nhau
  return out;
}
let cumCache = null, cumKey = '';
function cumHienTai(t) { const k = P.clips.length + ':' + tongGiay().toFixed(2) + ':' + $('#pdCum').value + ':' + (P.pdNgoai || []).length; if (k !== cumKey) { cumCache = cumTu(); cumKey = k; } return cumCache.find(c => t >= c.bd - 0.03 && t <= c.kt) || null; }

/* ═════════ vẽ khung hình: V1 → zoom → O1 đồ hoạ → O2 phụ đề + hook ═════════ */
const cv = $('#cv'), cx = cv.getContext('2d');
let FONT = '"Be Vietnam Pro", system-ui, sans-serif';
function capNhatFont() { const f = FONT_CSS[$('#font').value] || FONT_CSS.be_vietnam; FONT = f + ', "Be Vietnam Pro", system-ui, sans-serif'; try { document.fonts.load('900 40px ' + f).then(() => { if (!P.dang) veKhung(); }).catch(() => {}); } catch {} }
function chuNhan(w) { const x = w.toLowerCase().replace(/[.,!?…:;"“”]/g, ''); return P.tuNhan.some(n => n && (x === n || (n.includes(' ') ? false : x === n))); }
function chiaDong(ctx, tu, maxW) { const dong = [[]]; tu.forEach(t => { const d = dong[dong.length - 1], thu = [...d, t].map(x => x.w).join(' '); if (ctx.measureText(thu).width > maxW && d.length) dong.push([t]); else d.push(t); }); return dong; }
function vePhuDe(ctx, W, H, t) {
  const c = cumHienTai(t); if (!c) return;
  const kr = (((c.w && c.w[0]) || c.tu[0] || {}).kieu) || {}, Wt = Math.min(W, H * 0.75), kieu = kr.kieu || $('#pdKieu').value, mau = kr.mau || mauNhan(), size = Math.round(Wt * (kieu === 'emoji' || kieu === 'pop' ? 0.066 : 0.052) * (kr.co || 1)), y = H * (kr.y != null ? kr.y : (P.pdY || 0.78)), F = kr.font && FONT_CSS[kr.font] ? FONT_CSS[kr.font] + ', "Be Vietnam Pro", system-ui, sans-serif' : FONT, trang = kr.chu || '#fff', dam = kr.dam || 800, tuVe = kr.hoa ? c.tu.map(w => ({ ...w, w: String(w.w).toUpperCase() })) : c.tu;
  ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = dam + ' ' + size + 'px ' + F;
  // từ nhấn to hơn: đo riêng
  const doW = w => { ctx.font = (chuNhan(w.w) ? '900 ' + Math.round(size * 1.18) : dam + ' ' + size) + 'px ' + F; return ctx.measureText(w.w).width; };
  const dong = chiaDong(ctx, tuVe, W * 0.84), lh = size * 1.35, sp = size * 0.28;
  dong.forEach((d, li) => {
    const widths = d.map(doW), tong = widths.reduce((a, b) => a + b, 0) + sp * (d.length - 1); let x = W / 2 - tong / 2; const yy = y - (dong.length - 1) * lh / 2 + li * lh;
    if (kieu === 'toi' || kieu === 'pill') { ctx.fillStyle = kieu === 'toi' ? 'rgba(15,15,15,.78)' : 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.roundRect(x - size * 0.45, yy - lh / 2, tong + size * 0.9, lh, size * 0.4); ctx.fill(); }
    d.forEach((w, k) => {
      const dang = t >= w.bd && t < w.kt + 0.03, nhan = chuNhan(w.w), ww = widths[k], daNoi = t >= w.bd;
      ctx.font = (nhan ? '900 ' + Math.round(size * 1.18) : dam + ' ' + size) + 'px ' + F;
      ctx.save();
      if (kieu === 'pop') { const p = Math.min(1, Math.max(0, (t - w.bd) / 0.18)), sc = daNoi ? 1 + 0.22 * Math.sin(p * Math.PI) : 0.92; ctx.translate(x + ww / 2, yy); ctx.scale(sc, sc); ctx.translate(-(x + ww / 2), -yy); ctx.globalAlpha = daNoi ? 1 : 0.55; }
      if (kieu === 'rise') { const p = Math.min(1, Math.max(0, (t - w.bd + 0.05) / 0.22)); ctx.globalAlpha = daNoi ? p : 0; ctx.translate(0, (1 - p) * size * 0.6); }
      if (kieu === 'highlight' && dang) { ctx.fillStyle = mau; ctx.beginPath(); ctx.roundRect(x - size * 0.18, yy - size * 0.68, ww + size * 0.36, size * 1.36, size * 0.2); ctx.fill(); }
      if (kieu === 'vien' || kieu === 'emoji' || kieu === 'highlight') { ctx.lineWidth = size * (kieu === 'emoji' ? 0.22 : 0.16); ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(w.w, x, yy); }
      ctx.fillStyle = kieu === 'pill' ? (dang ? mau : '#111') : kieu === 'toi' ? (dang ? mau : trang) : kieu === 'highlight' ? (dang ? '#101400' : (nhan ? mau : trang)) : (nhan || dang ? mau : trang);
      if (kieu === 'highlight' && dang) ctx.fillStyle = '#101400';
      if (kieu === 'pop' || kieu === 'rise') { ctx.lineWidth = size * 0.18; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(w.w, x, yy); ctx.fillStyle = nhan || dang ? mau : trang; }
      ctx.fillText(w.w, x, yy); ctx.restore(); x += ww + sp;
    });
  });
  ctx.restore(); vePhuDeDich(ctx, W, H, t, y + (dong.length - 0.5) * lh / 2 + (dong.length - 1) * lh / 4);
}
function veHook(ctx, text, W, H, t) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const size = Math.round(Math.min(W, H * 0.75) * 0.075); ctx.font = '900 ' + size + 'px ' + FONT;
  const vao = Math.min(1, t / 0.25), ra = t > 2.8 ? Math.max(0, 1 - (t - 2.8) / 0.4) : 1, sc = 0.85 + 0.15 * (1 - Math.pow(1 - vao, 3));
  ctx.globalAlpha = ra; ctx.translate(W / 2, H * 0.2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H * 0.2);
  const dong = []; text.split(/\n/).forEach(p => { let cur = ''; p.split(' ').forEach(w => { const th = cur ? cur + ' ' + w : w; if (ctx.measureText(th).width > W * 0.84 && cur) { dong.push(cur); cur = w; } else cur = th; }); dong.push(cur); });
  const lh = size * 1.3, y0 = H * 0.2 - lh * dong.length / 2;
  dong.forEach((d, i) => { const w = ctx.measureText(d).width, yy = y0 + lh * (i + 0.5); ctx.fillStyle = i === dong.length - 1 && dong.length > 1 ? mauNhan() : '#fff'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - size * 0.4, yy - lh / 2, w + size * 0.8, lh, size * 0.22); ctx.fill(); ctx.fillStyle = '#101400'; ctx.fillText(d, W / 2, yy); });
  ctx.restore();
}
const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
/* đồ hoạ "seekable": mỗi kiểu là hàm của (p = tiến độ 0..1, t giây trong item) như HyperFrames */
function veDoHoa(ctx, W, H, g, t) {
  const Wt = Math.min(W, H * 0.75), dai = g.kt - g.bd, tl = t - g.bd, p = tl / dai, mau = mauNhan(), tuAn = g.kieu === 'chu' || g.kieu === 'sticker', vao = g.boVao || tuAn ? 1 : ease(tl / 0.35), ra = !tuAn && !g.boRa && dai - tl < 0.35 ? ease((dai - tl) / 0.35) : 1;   /* chữ / nhãn dán tự lo hoạt ảnh Vào / Ra (chọn Không thì hiện ngay khung đầu) */
  ctx.save(); ctx.globalAlpha = Math.min(vao, ra); ctx.textBaseline = 'middle';
  if (g.kieu === 'hinh') veHinhGfx(ctx, W, H, g, tl, dai);
  else if (veMauMoi(ctx, W, H, g, tl, dai, mau)) { }
  else if (g.kieu === 'chu' || g.kieu === 'sticker') veChuTuDo(ctx, W, H, g, tl, dai);
  else if (g.kieu === 'tieu_de') { const size = Math.round(Wt * 0.11); ctx.font = '900 ' + size + 'px ' + FONT; ctx.textAlign = 'center'; const sc = 1.6 - 0.6 * ease(tl / 0.25); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); if (tl < 0.3) ctx.rotate((Math.random() - 0.5) * 0.01); ctx.lineWidth = size * 0.12; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; const dong = String(g.text).toUpperCase().split(/\s*\|\s*|\n/); dong.forEach((d, i) => { const y = (i - (dong.length - 1) / 2) * size * 1.15; ctx.strokeText(d, 0, y); ctx.fillStyle = i % 2 ? mau : '#fff'; ctx.fillText(d, 0, y); }); }
  else if (g.kieu === 'lower_third') { const size = Math.round(Wt * 0.05), x = W * 0.06 - (1 - vao) * W * 0.2, y = H * 0.7; ctx.font = '800 ' + size + 'px ' + FONT; ctx.textAlign = 'left'; const w = Math.max(ctx.measureText(g.text).width, ctx.measureText(g.phu || '').width * 0.75) + size; ctx.fillStyle = 'rgba(16,20,0,.85)'; ctx.beginPath(); ctx.roundRect(x, y - size * 0.9, w + size * 0.6, size * 2.4, size * 0.3); ctx.fill(); ctx.fillStyle = mau; ctx.fillRect(x, y - size * 0.9, size * 0.18, size * 2.4); ctx.fillStyle = '#fff'; ctx.fillText(g.text, x + size * 0.5, y - size * 0.15); ctx.font = '500 ' + Math.round(size * 0.72) + 'px ' + FONT; ctx.fillStyle = '#cfd6c3'; ctx.fillText(g.phu || '', x + size * 0.5, y + size * 0.75); }
  else if (g.kieu === 'danh_sach') { const muc = String(g.text).split('|').map(x => x.trim()).filter(Boolean), size = Math.round(Wt * 0.052); ctx.font = '800 ' + size + 'px ' + FONT; ctx.textAlign = 'left'; const n = muc.length || 1; muc.forEach((m, i) => { const moc = mocMuc(g, i, n, dai), a = ease((tl - moc) / 0.3); if (a <= 0) return; const y = H * 0.36 + i * size * 1.7, x = W * 0.1 - (1 - a) * W * 0.1; ctx.globalAlpha = Math.min(a, ra); ctx.fillStyle = 'rgba(16,20,0,.8)'; ctx.beginPath(); ctx.roundRect(x - size * 0.4, y - size * 0.7, ctx.measureText(m).width + size * 2.2, size * 1.4, size * 0.3); ctx.fill(); ctx.fillStyle = mau; ctx.beginPath(); ctx.arc(x + size * 0.3, y, size * 0.32, 0, 7); ctx.fill(); ctx.fillStyle = '#101400'; ctx.font = '900 ' + Math.round(size * 0.6) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x + size * 0.3, y + 1); ctx.textAlign = 'left'; ctx.font = '800 ' + size + 'px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText(m, x + size * 0.95, y); }); }
  else if (g.kieu === 'tien_do') { const h = Math.round(H * 0.008); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(0, 0, W, h); ctx.fillStyle = mau; ctx.fillRect(0, 0, W * Math.min(1, t / Math.max(tongGiay(), 0.1)), h); }
  else if (g.kieu === 'trich_dan') { const size = Math.round(Wt * 0.058); ctx.font = 'italic 700 ' + size + 'px ' + FONT; ctx.textAlign = 'center'; const dong = []; let cur = ''; String(g.text).split(' ').forEach(w => { const th = cur ? cur + ' ' + w : w; if (ctx.measureText(th).width > W * 0.7 && cur) { dong.push(cur); cur = w; } else cur = th; }); dong.push(cur); const lh = size * 1.35, bh = lh * dong.length + size * 2.2, y0 = H * 0.42 - bh / 2 + (1 - vao) * 30; ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.beginPath(); ctx.roundRect(W * 0.09, y0, W * 0.82, bh, size * 0.5); ctx.fill(); ctx.fillStyle = mau; ctx.font = '900 ' + size * 2.2 + 'px Georgia,serif'; ctx.fillText('“', W * 0.17, y0 + size * 1.1); ctx.font = 'italic 700 ' + size + 'px ' + FONT; ctx.fillStyle = '#111'; dong.forEach((d, i) => ctx.fillText(d, W / 2, y0 + size * 1.5 + i * lh)); if (g.phu) { ctx.font = '600 ' + Math.round(size * 0.65) + 'px ' + FONT; ctx.fillStyle = '#555'; ctx.fillText('— ' + g.phu, W / 2, y0 + bh - size * 0.6); } }
  else if (g.kieu === 'dem_so') { const m = String(g.text).match(/^([^\d]*)(\d[\d.,]*)(.*)$/), so = m ? parseFloat(m[2].replace(/\./g, '').replace(',', '.')) : 0, hien = Math.round(so * ease(tl / Math.max(0.8, dai * 0.6))), size = Math.round(Wt * 0.2); ctx.font = '900 ' + size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.lineWidth = size * 0.1; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; const chu = (m ? m[1] : '') + hien.toLocaleString('vi-VN') + (m ? m[3] : ''); ctx.strokeText(chu, W / 2, H * 0.4); ctx.fillStyle = mau; ctx.fillText(chu, W / 2, H * 0.4); }
  else if (g.kieu === 'khung_nhan') { const s = 1.15 - 0.15 * vao; ctx.strokeStyle = mau; ctx.lineWidth = Wt * 0.012; ctx.setLineDash([W * 0.05, W * 0.03]); ctx.lineDashOffset = -tl * W * 0.1; ctx.beginPath(); ctx.roundRect(W / 2 - W * 0.3 * s, H / 2 - H * 0.2 * s, W * 0.6 * s, H * 0.4 * s, W * 0.04); ctx.stroke(); }
  else if (g.kieu === 'mui_ten') { const y = H * 0.32 + Math.sin(tl * 9) * H * 0.012, s = Wt * 0.12; ctx.fillStyle = mau; ctx.strokeStyle = '#000'; ctx.lineWidth = s * 0.1; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(W / 2 - s * 0.3, y - s); ctx.lineTo(W / 2 + s * 0.3, y - s); ctx.lineTo(W / 2 + s * 0.3, y - s * 0.2); ctx.lineTo(W / 2 + s * 0.6, y - s * 0.2); ctx.lineTo(W / 2, y + s * 0.5); ctx.lineTo(W / 2 - s * 0.6, y - s * 0.2); ctx.lineTo(W / 2 - s * 0.3, y - s * 0.2); ctx.closePath(); ctx.stroke(); ctx.fill(); }
  else if (g.kieu === 'vong_xoay') { const r = Wt * 0.09, cxp = W * 0.84, cyp = H * 0.14 + (1 - vao) * -H * 0.2; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.strokeStyle = 'hsl(' + (i * 30) + ' 90% 55%)'; ctx.lineWidth = r * 0.45; ctx.arc(cxp, cyp, r, tl * 2.2 + i * Math.PI / 6, tl * 2.2 + (i + 0.8) * Math.PI / 6); ctx.stroke(); } ctx.fillStyle = '#101400'; ctx.beginPath(); ctx.arc(cxp, cyp, r * 0.55, 0, 7); ctx.fill(); }
  else if (g.kieu === 'nhan_goc') { const size = Math.round(Wt * 0.04); ctx.font = '900 ' + size + 'px ' + FONT; ctx.textAlign = 'left'; const w = ctx.measureText(String(g.text).toUpperCase()).width; ctx.fillStyle = mau; ctx.beginPath(); ctx.roundRect(W * 0.06 - (1 - vao) * 40, H * 0.09, w + size * 1.2, size * 1.7, size * 0.3); ctx.fill(); ctx.fillStyle = '#101400'; ctx.fillText(String(g.text).toUpperCase(), W * 0.06 + size * 0.6 - (1 - vao) * 40, H * 0.09 + size * 0.85); }
  ctx.restore();
}
/* ═════════ CHUYỂN CẢNH: lõi gl-transitions (MIT, 67 shader; HyperFrames cũng dùng họ này), chạy WebGL tại máy ═════════ */
const GLT = { json: null, dangNap: null, gl: null, cv: null, prog: {}, tex: null };
const GLT_MAP = { fade: ['fade', {}], slide: ['Directional', { direction: [1, 0] }], zoom: ['SimpleZoom', { zoom_quickness: 0.8 }], wipe: ['wipeLeft', {}], whip: ['LinearBlur', { intensity: 0.35 }], flash: ['fadecolor', { color: [1, 1, 1], colorPhase: 0.4 }], glitch: ['GlitchMemories', {}], circle: ['circleopen', { smoothness: 0.3, opening: true }], blur: ['CrossZoom', { strength: 0.4 }] };
function gltNap() { if (GLT.json || GLT.dangNap) return GLT.dangNap || Promise.resolve(GLT.json); GLT.dangNap = fetch('https://cdn.jsdelivr.net/npm/gl-transitions@1.43.0/gl-transitions.json').then(r => r.json()).then(j => { GLT.json = j; return j; }).catch(() => { GLT.dangNap = null; GLT.loi = (GLT.loi || 0) + 1; return []; }); return GLT.dangNap; }
function gltChuanBi(W, H) {
  if (!GLT.cv) { GLT.cv = document.createElement('canvas'); GLT.gl = GLT.cv.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false }); if (!GLT.gl) return false; const gl = GLT.gl; const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); GLT.tex = [gl.createTexture(), gl.createTexture()]; GLT.tex.forEach(tx => { gl.bindTexture(gl.TEXTURE_2D, tx); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); }); }
  if (GLT.cv.width !== W || GLT.cv.height !== H) { GLT.cv.width = W; GLT.cv.height = H; GLT.gl.viewport(0, 0, W, H); }
  return true;
}
function gltProg(ten) {
  if (GLT.prog[ten]) return GLT.prog[ten];
  const t = (GLT.json || []).find(x => x.name === ten); if (!t) return null;
  const gl = GLT.gl, vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p;varying vec2 _uv;void main(){_uv=(p+1.)/2.;gl_Position=vec4(p,0.,1.);}'); gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, 'precision highp float;varying vec2 _uv;uniform sampler2D from,to;uniform float progress,ratio;vec4 getFromColor(vec2 uv){return texture2D(from,uv);}vec4 getToColor(vec2 uv){return texture2D(to,uv);}\n' + t.glsl + '\nvoid main(){gl_FragColor=transition(_uv);}'); gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.warn('glsl', ten, gl.getShaderInfoLog(fs)); GLT.prog[ten] = null; return null; }
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  GLT.prog[ten] = { pr, t }; return GLT.prog[ten];
}
/* trộn hai khung (canvas) theo tiến độ 0..1; trả canvas WebGL để vẽ đè lên ctx chính, hoặc null nếu không dùng được */
function gltVe(kieu, tu, den, p, W, H) {
  const m = GLT_MAP[kieu]; if (!m || !GLT.json || !gltChuanBi(W, H)) return null;
  const o = gltProg(m[0]); if (!o) return null; const gl = GLT.gl, { pr, t } = o;
  gl.useProgram(pr); const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  [tu, den].forEach((c, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, GLT.tex[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); gl.uniform1i(gl.getUniformLocation(pr, i ? 'to' : 'from'), i); });
  gl.uniform1f(gl.getUniformLocation(pr, 'progress'), p); gl.uniform1f(gl.getUniformLocation(pr, 'ratio'), W / H);
  const params = Object.assign({}, t.defaultParams || {}, m[1]); Object.keys(params).forEach(k => { const ty = (t.paramsTypes || {})[k], v = params[k], u = gl.getUniformLocation(pr, k); if (!u || v == null) return; if (ty === 'float') gl.uniform1f(u, v); else if (ty === 'vec2') gl.uniform2fv(u, v); else if (ty === 'vec3') gl.uniform3fv(u, v); else if (ty === 'vec4') gl.uniform4fv(u, v); else if (ty === 'bool' || ty === 'int') gl.uniform1i(u, v ? (ty === 'int' ? v : 1) : 0); else if (ty === 'ivec2') gl.uniform2iv(u, v); });
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); return GLT.cv;
}
/* khung nền (V1 + b-roll V2) của một thời điểm; nguon = 'chinh' dùng s.el, 'phu' dùng s.el2 (đã tự seek) */
const nenCv = document.createElement('canvas'), snapCv = document.createElement('canvas');
/* ═════════ xoá nền người nói: MediaPipe Selfie Segmenter chạy trên máy, không tốn lượt ═════════
   Mặt nạ tính trên khung nhỏ (cạnh dài 256px) rồi áp lên người bằng destination-in theo đúng phép crop đang dùng,
   nên hoạt động với cả ba kiểu khung (cắt giữa, bám mặt, giữ nguyên). Không thấy người thì vẽ như thường. */
let segModel = null, segLoi = false, segDangNap = null, segNho = { khoa: '', cv: null };
const segCv = document.createElement('canvas'), maskCv = document.createElement('canvas'), fgCv = document.createElement('canvas');
function segBat() { return $('#nenKieu').value !== 'giu'; }
async function segNap() {
  if (segModel || segLoi) return segModel; if (segDangNap) return segDangNap;
  $('#nenTt').hidden = false; $('#nenTt').textContent = 'Đang tải mô hình xoá nền (~10MB, một lần)…';
  segDangNap = (async () => {
    try {
      const { m, vision } = await mpModule();
      const opt = d => ({ baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite', delegate: d }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true });
      try { segModel = await m.ImageSegmenter.createFromOptions(vision, opt('GPU')); } catch (e) { console.warn('segmenter GPU', e); segModel = await m.ImageSegmenter.createFromOptions(vision, opt('CPU')); }
      $('#nenTt').textContent = '✓ Xoá nền chạy trên máy này, không tốn lượt. Mép người đẹp nhất khi nền phẳng, ánh sáng đều. Xuất video sẽ chậm hơn bình thường.';
    } catch (e) { console.warn('segmenter', e); segLoi = true; $('#nenTt').textContent = '⚠ Máy này chưa tải được mô hình xoá nền (cần mạng và WebAssembly). Đang vẽ nền gốc.'; }
    segDangNap = null; if (!P.dang) veKhung(); return segModel;
  })();
  return segDangNap;
}
/* mặt nạ người của một khung hình: canvas cùng tỉ lệ với source, alpha = độ tin là người */
function segMask(s, im, tSrc) {
  const khoa = s.id + '|' + tSrc.toFixed(2); if (segNho.khoa === khoa) return segNho.cv;
  const iw = s.w || 1, ih = s.h || 1, sc = 256 / Math.max(iw, ih), w = Math.max(16, Math.round(iw * sc)), h = Math.max(16, Math.round(ih * sc));
  if (segCv.width !== w || segCv.height !== h) { segCv.width = w; segCv.height = h; maskCv.width = w; maskCv.height = h; }
  segCv.getContext('2d').drawImage(im, 0, 0, w, h);
  let r; try { r = segModel.segment(segCv); } catch (e) { console.warn('segment', e); return null; }
  try {
    const ms = r.confidenceMasks || []; if (!ms.length) return null;
    const m = ms.length >= 2 ? ms[1] : ms[0], mw = m.width, mh = m.height, a = m.getAsFloat32Array();
    // mô hình 1 lớp có thể trả độ tin của nền: người nói thường ở giữa khung, mép trên là nền → so để biết chiều
    let giua = 0, ng = 0, mep = 0, nm = 0;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const v = a[y * mw + x]; if (x > mw * 0.35 && x < mw * 0.65 && y > mh * 0.3 && y < mh * 0.8) { giua += v; ng++; } if (y < mh * 0.06) { mep += v; nm++; } }
    giua /= ng || 1; mep /= nm || 1; const dao = ms.length < 2 && mep > 0.6 && giua < 0.4;   // chỉ đảo khi rõ ràng mép là 'người' còn giữa là 'nền'
    let tong = 0; const g = maskCv.getContext('2d'), id = g.createImageData(mw, mh), d = id.data;
    for (let i = 0; i < a.length; i++) { let v = dao ? 1 - a[i] : a[i]; v = v < 0.25 ? 0 : v > 0.75 ? 1 : (v - 0.25) * 2; tong += v; d[i * 4 + 3] = v * 255; }
    if (tong / a.length < 0.02) { segNho = { khoa, cv: null }; return null; }   // không thấy người: vẽ như thường
    if (maskCv.width !== mw || maskCv.height !== mh) { maskCv.width = mw; maskCv.height = mh; }
    g.putImageData(id, 0, 0); segNho = { khoa, cv: maskCv }; return maskCv;
  } finally { try { r.close(); } catch {} }
}
function veNguon(ctx, W, H, s, im, tSrc, z) {
  const nen = $('#nenKieu').value;
  if (nen === 'giu' || s.loai !== 'video' || !segModel) { veNguonThuong(ctx, W, H, s, im, tSrc, z, im, false); return; }
  const mk = segMask(s, im, tSrc); if (!mk) { veNguonThuong(ctx, W, H, s, im, tSrc, z, im, false); return; }
  if (nen === 'mo') { ctx.save(); ctx.filter = 'blur(22px) brightness(.62)'; veNguonThuong(ctx, W, H, s, im, tSrc, z, im, true); ctx.restore(); }
  else if (nen === 'mau') { ctx.fillStyle = $('#nenMau').value || '#99DF00'; ctx.fillRect(0, 0, W, H); }
  else { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1b1f24'); gr.addColorStop(1, '#05060a'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (fgCv.width !== W || fgCv.height !== H) { fgCv.width = W; fgCv.height = H; }
  const g = fgCv.getContext('2d'); g.clearRect(0, 0, W, H); veNguonThuong(g, W, H, s, im, tSrc, z, im, true);
  g.save(); g.globalCompositeOperation = 'destination-in'; g.filter = 'blur(' + Math.max(1, W / 540) + 'px)'; veNguonThuong(g, W, H, s, im, tSrc, z, mk, true); g.restore();
  ctx.drawImage(fgCv, 0, 0);
}
/* vẽ source (hoặc mặt nạ cùng tỉ lệ) theo kiểu khung; khongNen = bỏ lớp nền mờ của kiểu 'mo' */
function veNguonThuong(ctx, W, H, s, im, tSrc, z, anh, khongNen) {
  const iw = s.w || 1, ih = s.h || 1, kieu = $('#khungKieu').value; im = anh; const k = ((anh.videoWidth || anh.naturalWidth || anh.width) || iw) / iw;   // mặt nạ nhỏ hơn source: đổi toạ độ cắt
  if (kieu === 'mo' && iw / ih > W / H) { if (!khongNen) { ctx.save(); ctx.filter = 'blur(28px) brightness(.55)'; const sc = H / ih; ctx.drawImage(im, W / 2 - iw * sc / 2, 0, iw * sc, H); ctx.restore(); } const sc2 = (W / iw) * z, hh = ih * sc2; ctx.drawImage(im, W / 2 - iw * sc2 / 2, H / 2 - hh / 2, iw * sc2, hh); return; }
  if (kieu === 'bam_mat' && s.mat && s.mat.length && iw / ih > W / H) { const cw = ih * W / H / z, ch = ih / z, cx0 = Math.max(cw / 2, Math.min(iw - cw / 2, cxTai(s, tSrc) * iw)), cy0 = ih / 2; ctx.drawImage(im, (cx0 - cw / 2) * k, (cy0 - ch / 2) * k, cw * k, ch * k, 0, 0, W, H); return; }
  const sc = Math.max(W / iw, H / ih) * z; ctx.drawImage(im, W / 2 - iw * sc / 2, H / 2 - ih * sc / 2, iw * sc, ih * sc);
}
function veNen(ctx, W, H, t, nguon) {
  const { clip, tSrc, bdTl } = viTri(t); if (clip < 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return null; }
  const c = mauTai(P.clips[clip], t - bdTl), s = srcCua(c.src); if (!s || !s.el) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return c.trong ? { clip, tSrc, s: null, bdTl, c } : null; }   // màu / bộ lọc / hiệu ứng có keyframe: lấy giá trị tại thời điểm này
  if (trAn('v1') || c.an) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); } else {
  veNenKhung(ctx, W, H, c, s, s.loai === 'video' && (nguon === 'phu' || nguon === 'ghep') ? elPhu(s, nguon === 'ghep' ? 'elG' : 'el2') : s.el);
  let z = 1; if ($('#zoomOn').checked) for (const zt of P.zoom) { const d = t - zt; if (d >= 0 && d < 3) { z = 1 + 0.06 * Math.min(1, d / 0.4) * (1 - Math.max(0, (d - 2.4) / 0.6)); break; } }
  apDoan(ctx, W, H, c, t - bdTl, g => { let [s2, im2] = catNguon(c, s, s.loai === 'video' && (nguon === 'phu' || nguon === 'ghep') ? elPhu(s, nguon === 'ghep' ? 'elG' : 'el2') : s.el, 0); [s2, im2] = chinhMau(c, s2, im2, t); veNguon(g, W, H, s2, im2, tSrc, z); });
  }
  return { clip, tSrc, s, bdTl, c };
}
/* thời điểm t có đang trong cửa sổ chuyển cảnh không (đầu đoạn clip>0, đoạn trước có chuyen ≠ cat) */
function chuyenTai(t) { const { clip, bdTl } = viTri(t); if (clip <= 0) return null; const tr = P.clips[clip - 1]; if (!tr.chuyen || tr.chuyen === 'cat') return null; const dai = tr.chuyen_dai || (P.cai && P.cai.chuyen) || 0.5; if (t - bdTl >= dai) return null; return { kieu: tr.chuyen, p: Math.max(0, Math.min(1, (t - bdTl) / dai)), truoc: clip - 1 }; }
function veFrame(ctx, W, H, t, snap) {
  if (nenCv.width !== W || nenCv.height !== H) { nenCv.width = W; nenCv.height = H; }
  const nctx = nenCv.getContext('2d');
  const tV1 = P.clips.reduce((a, c) => a + daiC(c), 0), quaV1 = P.clips.length > 0 && t > tV1 + 0.001;   /* chữ / đồ hoạ dài hơn footage: sau footage là nền trống, không đứng hình */
  let r = null; if (quaV1) { nctx.fillStyle = '#000'; nctx.fillRect(0, 0, W, H); } else r = veNen(nctx, W, H, t, 'chinh');
  const ch = chuyenTai(t);
  let daVe = false;
  if (ch && snap && snap.width === W) { const tu = ch.nua === 1 ? nenCv : snap, den = ch.nua === 1 ? snap : nenCv, g = gltVe(ch.kieu, tu, den, ch.p, W, H); if (g) { ctx.drawImage(g, 0, 0); daVe = true; } else { ctx.drawImage(tu, 0, 0); ctx.globalAlpha = ch.p; ctx.drawImage(den, 0, 0); ctx.globalAlpha = 1; daVe = true; } }   /* spec 5.1: nửa đầu (trước điểm nối) đoạn trước đang chạy, đoạn sau là ảnh; nửa sau ngược lại */
  if (!daVe) ctx.drawImage(nenCv, 0, 0);
  if (!r && !quaV1 && !(!P.clips.length && tongGiay() > 0)) return null;   // chưa có footage nhưng có chữ / sticker: vẫn vẽ các lớp trên nền đen
  veCacLop(ctx, W, H, t);   // b-roll, overlay, chữ, đồ hoạ: lớp thấp vẽ trước, lớp cao phủ lên
  if ($('#phuDe').checked && !trAn('o2')) vePhuDe(ctx, W, H, t);
  const hook = $('#hook').value.trim(); if (hook && t < 3.2 && !trAn('o2')) veHook(ctx, hook, W, H, t);
  return r;
}
/* khung cuối của đoạn trước (cho xem thử tĩnh trong cửa sổ chuyển cảnh): vẽ bằng phần tử phụ để không phá đoạn đang xem */
async function laySnapTruoc(W, H, iTruoc) {
  const c = P.clips[iTruoc], s = srcCua(c.src); if (!s) return null;
  if (snapCv.width !== W || snapCv.height !== H) { snapCv.width = W; snapCv.height = H; }
  const g = snapCv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (s.loai === 'video') await seekTo(elPhu(s, 'el2'), Math.max(c.bd, c.kt - 0.05));
  veNguon(g, W, H, s, s.loai === 'video' ? s.el2 : s.el, c.kt - 0.05, 1); return snapCv;
}
/* spec 2.1: đồng hồ trình phát dạng giờ:phút:giây:khung "vị trí / tổng", bấm vào để gõ thời điểm (12 · 1:05 · 00:00:12:15) */
const fpsDuAn = () => +(($('#xuatFps') || {}).value) || MAC_DINH.fps;
/* thời gian trên dòng thời gian luôn chốt vào lưới khung hình (như FilmCraft dùng tick nguyên): hết lệch 0,01s dồn dần sau nhiều lần cắt */
const lamTronKhung = t => { const f = fpsDuAn(); return Math.round(t * f) / f; };
const khungGiay = t => lamTronKhung(Math.max(0, t || 0));
/* roll: dời điểm nối giữa đoạn iA và iA+1 đi dl giây trên dòng thời gian, tổng độ dài giữ nguyên (gA, gB: bản gốc lúc bắt đầu kéo). Trả dl thật sự áp. */
function cuonMep(iA, dl, gA, gB) {
  const A = P.clips[iA], B = P.clips[iA + 1]; if (!A || !B || !gA || !gB || A.dao || B.dao || A.trong || B.trong) return 0;
  const tA = tocC(gA), tB = tocC(gB), sA = srcCua(A.src), sB = srcCua(B.src);
  const min = Math.max(-(gA.kt - gA.bd - 0.3) / tA, -gB.bd / tB), max = Math.min((gioiHanNguon(sA, 1e9) - gA.kt) / tA, (gB.kt - gB.bd - 0.3) / tB);
  if (!(max > min)) return 0;
  dl = Math.max(min, Math.min(max, lamTronKhung(Math.max(min, Math.min(max, dl)))));
  A.kt = +(gA.kt + dl * tA).toFixed(4); B.bd = +(gB.bd + dl * tB).toFixed(4); return dl;
}
/* slide: đoạn i giữ nguyên nội dung và độ dài, đoạn trước dài ra / ngắn lại và đoạn sau ngược lại */
function truotDoan(i, dl, gT, gS) {
  const T = i > 0 ? P.clips[i - 1] : null, S = P.clips[i + 1]; if ((!T || !gT) && (!S || !gS)) return 0;
  let min = -1e9, max = 1e9;
  if (T && gT) { if (T.dao || T.trong) return 0; const t = tocC(gT); min = Math.max(min, -(gT.kt - gT.bd - 0.3) / t); max = Math.min(max, (gioiHanNguon(srcCua(T.src), 1e9) - gT.kt) / t); }
  if (S && gS) { if (S.dao || S.trong) return 0; const t = tocC(gS); min = Math.max(min, -gS.bd / t); max = Math.min(max, (gS.kt - gS.bd - 0.3) / t); }
  if (!(max > min)) return 0;
  dl = Math.max(min, Math.min(max, lamTronKhung(Math.max(min, Math.min(max, dl)))));
  if (T && gT) T.kt = +(gT.kt + dl * tocC(gT)).toFixed(4); if (S && gS) S.bd = +(gS.bd + dl * tocC(gS)).toFixed(4); return dl;
}
function fmtTC(s) { const f = fpsDuAn(), n = Math.round(Math.max(0, s || 0) * f), fr = n % f, g = Math.floor(n / f), p2 = x => String(x).padStart(2, '0'); return p2(Math.floor(g / 3600)) + ':' + p2(Math.floor(g / 60) % 60) + ':' + p2(g % 60) + ':' + p2(fr); }
function docTC(v) { v = String(v).trim().replace(',', '.'); if (!v) return null; const p = v.split(':').map(Number); if (p.some(isNaN)) return null; const f = fpsDuAn(); if (p.length === 4) return p[0] * 3600 + p[1] * 60 + p[2] + p[3] / f; if (p.length === 3) return p[0] * 60 + p[1] + p[2] / f; if (p.length === 2) return p[0] * 60 + p[1]; return p[0]; }
function veTc(tong) { const o = $('#tg2'); if (!o || o.querySelector('input')) return; o.innerHTML = fmtTC(P.t) + ' <small>/ ' + fmtTC(tong) + '</small>'; o.title = 'Bấm để gõ thời điểm (vd 12 · 1:05 · 00:00:12:15)'; }
function moNhapTc(e) { const o = (e && e.currentTarget) || $('#tg2'); if (!o || o.querySelector('input')) return; if (P.dang) dung(); const i = el('input', 'tcIn'); i.value = fmtTC(P.t); o.innerHTML = ''; o.appendChild(i); i.focus(); i.select(); let xong = false; const ket = ok => { if (xong) return; xong = true; const t = ok ? docTC(i.value) : null; i.remove(); if (t != null) P.t = Math.max(0, Math.min(tongGiay(), t)); veTc(tongGiay()); datTg(tongGiay()); veKhung(); vePh(); }; i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') ket(true); if (e.key === 'Escape') ket(false); }; i.onblur = () => ket(true); }
async function veKhung() {
  const { clip, tSrc } = viTri(P.t);
  if (clip >= 0) { const s = srcCua(P.clips[clip].src); if (s && s.el && s.loai === 'video' && !P.dang) await seekTo(s.el, tSrc); }
  for (const b of P.broll) { const kb = tocC(b), dai = (b.kt - b.bd) / kb; if (P.t >= b.t_bd && P.t < b.t_bd + dai) { const sb = srcCua(b.src); if (sb && sb.loai === 'video' && !P.dang) await seekTo(elPhu(sb, 'elB'), b.bd + (P.t - b.t_bd) * kb); } }
  if (!P.dang && typeof ghepTuaVideo === 'function') await ghepTuaVideo();
  let snap = null; const ch = chuyenTai(P.t); if (ch && !P.dang) { await gltNap(); snap = await laySnapCh(cv.width, cv.height, ch, P.t); }
  veFrame(cx, cv.width, cv.height, P.t, snap); veTay();
  $('#seek').value = Math.round(P.t * 100); datTg(tongGiay()); veTc(tongGiay()); vePh();
}
$('#seek').addEventListener('input', () => { if (P.dang) dung(); P.t = +$('#seek').value / 100; veKhung(); });
$('#btnToanManHinh').onclick = () => { const k = $('.khung'); if (document.fullscreenElement) document.exitFullscreen(); else if (k.requestFullscreen) k.requestFullscreen(); };

/* ═════════ phát và xuất ═════════ */
let ac = null, dest = null, nutAm = {}, nhacEl = null, nhacGain = null;
function moAm() { if (ac) return; const AC = window.AudioContext || window.webkitAudioContext; ac = new AC(); dest = ac.createMediaStreamDestination(); }
function noiAm(s) { if (!s.el || s.loai !== 'video' || nutAm[s.id]) return; try { const src = ac.createMediaElementSource(s.el), g = ac.createGain(); src.connect(g); g.connect(raAc()); g.connect(dest); nutAm[s.id] = g; } catch (e) { } }
function noiTieng() { P.tieng.forEach(t => { if (t.el) return; t.el = new Audio(t.url); t.el.preload = 'auto'; try { const src = ac.createMediaElementSource(t.el); const g = ac.createGain(); g.gain.value = 1; src.connect(g); g.connect(raAc()); g.connect(dest); t.gain = g; } catch (e) { } TIENG_KHO[t.id] = { b64: t.b64, url: t.url, el: t.el, gain: t.gain }; }); }
const TIENG_GIONG = { nu_am: 'Nữ ấm', nu_tre: 'Nữ trẻ', nu_diu: 'Nữ dịu', nu_sang: 'Nữ sáng', nam_tram: 'Nam trầm', nam_tre: 'Nam trẻ', nam_am: 'Nam ấm', nam_manh: 'Nam mạnh' };
function noiNhac() { if (!P.nhac || nhacEl) return; nhacEl = new Audio(P.nhac.url); nhacEl.loop = true; nhacEl.crossOrigin = 'anonymous'; try { const src = ac.createMediaElementSource(nhacEl); nhacGain = ac.createGain(); nhacGain.gain.value = 0.15; src.connect(nhacGain); nhacGain.connect(raAc()); nhacGain.connect(dest); } catch (e) { } }
async function phat(xuat) {
  if (P.dang || !(P.clips.length || tongGiay() > 0)) return;
  moAm(); try { await ac.resume(); } catch {}
  P.srcs.forEach(s => { noiAm(s); try { if (s.el && s.el.play) s.el.muted = false; } catch {} }); noiNhac(); noiTieng(); if ((P.am3 || []).length) await am3NapThieu();
  P.dang = true; if ($('#tayCam')) $('#tayCam').innerHTML = ''; $('#btnPlay').textContent = '⏸'; $('#btnPlay2').textContent = '⏸';
  const { W, H } = xuat ? kichThuoc(+$('#doPhanGiai').value || 1080) : { W: cv.width, H: cv.height };
  const canvas = xuat ? Object.assign(document.createElement('canvas'), { width: W, height: H }) : cv, ctx = canvas.getContext('2d');
  let rec = null, khuc = [];
  try { await document.fonts.load('900 40px ' + (FONT_CSS[$('#font').value] || FONT_CSS.be_vietnam)); } catch {}
  if (segBat() && !segModel && !segLoi) { try { await segNap(); } catch {} }
  if (P.clips.some(c => c.chuyen && c.chuyen !== 'cat')) await gltNap();
  if (xuat) {
    const stream = canvas.captureStream(caiXuat().fps || 30); dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    const mimes = ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = mimes.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || '';
    rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: caiXuat().cl === 'tuy' ? caiXuat().mbps * 1e6 : Math.min(W, H) >= 2160 ? 35e6 : Math.min(W, H) >= 1440 ? 14e6 : Math.min(W, H) >= 1080 ? 8e6 : 4e6, audioBitsPerSecond: caiXuat().am * 1000 });
    rec.ondataavailable = e => { if (e.data && e.data.size) khuc.push(e.data); }; rec.start(500);
  }
  const kXuat = xuat ? khoangXuat(caiXuat()) : null;   // ghi thời gian thực cũng theo vùng In–Out như bộ mã hoá nhanh
  if (xuat) P.t = kXuat[0]; else if (P.t >= tongGiay() - 0.05) P.t = 0;
  let cur = -1, v = null, batDau = performance.now(), tlLuc = P.t; const tong = tongGiay(); let snap = null, brollDang = null;
  if (snapCv.width !== W || snapCv.height !== H) { snapCv.width = W; snapCv.height = H; }
  if (nhacEl) { try { nhacEl.currentTime = P.t % (P.nhac.giay || 1e9); await nhacEl.play(); } catch {} }
  am3BatDau(); let mocAm = ac ? { a: ac.currentTime, t: P.t } : null;
  // hình đứng lại một chút ở mỗi điểm cắt (tua, nạp đoạn) còn âm A3 chạy theo đồng hồ âm thanh: đo độ lệch rồi hẹn lại cho khớp
  const dongBoAm = () => { if (!ac || !mocAm) return; const tAm = mocAm.t + (ac.currentTime - mocAm.a) * (P.tocPhat || 1); if (Math.abs(tAm - P.t) > 0.04) { if ((P.am3 || []).length) am3BatDau(); P.tieng.forEach(t => { if (t.el && !t.el.paused) { try { t.el.currentTime = Math.max(0, P.t - t.t_bd); } catch { } } }); mocAm = { a: ac.currentTime, t: P.t }; } };
  const soO = (id, md) => { const v = parseFloat($(id).value); return (Number.isFinite(v) ? v : md) / 100; }, mucNoi = () => soO('#duckNoi', 12), mucBroll = () => soO('#duckBroll', 60); let mbDangVet = false, mbClipCu = -1;
  const buoc = async () => {
    if (!P.dang) return;
    const { clip, tSrc, bdTl } = viTri(P.t);
    if (clip !== cur) {
      // chụp khung nền cuối của đoạn cũ để làm 'from' cho chuyển cảnh
      if (cur >= 0 && P.clips[cur].chuyen && P.clips[cur].chuyen !== 'cat') { snapCv.getContext('2d').drawImage(nenCv, 0, 0); snap = snapCv; } else snap = null;
      if (v) { try { v.pause(); } catch {} } cur = clip; const c0 = P.clips[clip] || { bd: 0, kt: 0, src: null }, s0 = srcCua(c0.src); v = s0 && s0.loai === 'video' && !tuaTay(c0) ? s0.el : null; if (s0 && s0.el && tuaTay(c0)) { try { s0.el.pause(); } catch { } } if (rec && rec.state === 'recording') { try { rec.pause(); } catch { } } if (v) { await seekTo(v, c0.bd + srcTuTl(c0, P.t - bdTl)); try { v.playbackRate = Math.max(0.0625, Math.min(16, tocTai(c0, P.t - bdTl))); v.preservesPitch = !c0.doiCao; } catch (e) { } try { await v.play(); } catch (e) { } } snapSauSan = false; if (chuyenDai(clip)) napSnapSauPhat(clip, W, H); batDau = performance.now(); tlLuc = P.t; dongBoAm(); if (rec && rec.state === 'paused') { try { rec.resume(); } catch { } } }
    // b-roll V2: phần tử phụ (tắt tiếng) chạy song song
    const bNay = P.broll.find(b => P.t >= b.t_bd && P.t < b.t_bd + (b.kt - b.bd) / tocC(b)) || null;
    if ((bNay && bNay.id) !== (brollDang && brollDang.id)) { if (brollDang) { const sb0 = srcCua(brollDang.src); if (sb0 && sb0.elB) { try { sb0.elB.pause(); } catch {} } } brollDang = bNay; if (bNay) { const sb = srcCua(bNay.src); if (sb && sb.loai === 'video') { const eb = elPhu(sb, 'elB'), kb = tocC(bNay); await seekTo(eb, bNay.bd + (P.t - bNay.t_bd) * kb); try { eb.playbackRate = Math.max(0.0625, Math.min(16, kb)); } catch { } try { await eb.play(); } catch {} } } }
    const c = P.clips[cur] || { bd: 0, kt: 0, src: null }, s = srcCua(c.src);
    if (v && !v.paused && !v.ended) P.t = bdTl + tlTuSrc(c, v.currentTime - c.bd); else P.t = tlLuc + (performance.now() - batDau) / 1000;
    if (typeof ghepPhatVideo === 'function') ghepPhatVideo();
    if (v && (c.cong || (P.tocPhat || 1) !== 1)) { try { const r = Math.max(0.0625, Math.min(16, tocTai(c, P.t - bdTl) * (xuat ? 1 : (P.tocPhat || 1)))); if (Math.abs(v.playbackRate - r) > 0.01) v.playbackRate = r; } catch { } }   // đường cong tốc độ / tua J-K-L
    if (!xuat && P.lap && P.t >= Math.min(tong, P.ra == null ? tong : P.ra) - 0.03) { xong(); P.t = P.vao || 0; setTimeout(() => phat(false), 30); return; }   // phát lặp trong vùng In–Out
    // A2 lồng tiếng: phát đúng chỗ, tiếng gốc video hạ còn 25% khi có lồng tiếng
    let coLong = false; P.tieng.forEach(t => { if (t.el) t.el.muted = trTat('a2'); if (t.gain) t.gain.gain.value = trVol('a2'); const trong = P.t >= t.t_bd && P.t < t.t_bd + t.giay; if (trong && !trTat('a2')) coLong = true; if (!t.el) return; if (trong && t.el.paused) { try { t.el.currentTime = Math.max(0, P.t - t.t_bd); t.el.play(); } catch {} } else if (!trong && !t.el.paused) t.el.pause(); });
    if (s && nutAm[s.id]) apGiongXem(s, c);
    if (s && nutAm[s.id]) nutAm[s.id].gain.setTargetAtTime(giaTriKf(c, 'am', P.t - bdTl) * fadeHeSo(c, P.t - bdTl) * (coLong ? 0.25 : 1) * (trTat('v1') || c.an ? 0 : trVol('v1')), ac.currentTime, 0.05);   // âm lượng + fade của đoạn, hạ khi có lồng tiếng
    if (nhacGain) { const coTieng = coLong || (s && s.cau.some(x => tSrc >= x.bd && tSrc <= x.kt)); let m = coTieng ? mucNoi() : mucBroll(); if (tong - P.t < 1.5) m *= Math.max(0, (tong - P.t) / 1.5); nhacGain.gain.setTargetAtTime(trTat('a1') ? 0 : m * trVol('a1'), ac.currentTime, 0.2); }
    if (xuat && P.t >= kXuat[1] - 0.02) { P.t = kXuat[1]; xong(); return; }
    if (P.t >= bdTl + daiC(c) - 0.02) { if (cur >= P.clips.length - 1) { if (P.t >= tong - 0.02) { P.t = tong; xong(); return; } } else P.t = bdTl + daiC(c) + 0.001; }   /* hết footage mà chữ / đồ hoạ còn dài thì phát tiếp trên nền trống */
    if (!v && tuaTay(c) && s && s.loai === 'video') { try { await seekTo(s.el, viTri(Math.min(P.t, tong - 0.001)).tSrc); } catch { } if (!P.dang) return; }
    { const chL = chuyenTai(Math.min(P.t, tong)); veFrame(ctx, W, H, Math.min(P.t, tong), chL && chL.nua === 1 ? (snapSauSan ? snapSauCv : null) : snap); }
    if (!xuat) { const mbNay = mbTai(P.t); if (mbNay || mbDangVet) { mbVet(ctx, W, H, mbNay, clip !== mbClipCu); mbDangVet = !!mbNay; mbClipCu = clip; } }
    if (!xuat) { $('#seek').value = Math.round(P.t * 100); datTg(tong); veTc(tong); vePh(); }
    else { $('#xuatBar').style.width = Math.min(100, P.t / tong * 100) + '%'; $('#xuatTt').textContent = 'Đang dựng ' + fmt(P.t) + ' / ' + fmt(tong) + ' · đừng chuyển tab'; }
    requestAnimationFrame(buoc);
  };
  const xong = () => { P.dang = false; P.tocPhat = 1; $('#btnPlay').textContent = '▶'; $('#btnPlay2').textContent = '▶'; if (v) { try { v.pause(); } catch {} } if (nhacEl) nhacEl.pause(); am3Dung(); P.tieng.forEach(t => { if (t.el) { try { t.el.pause(); } catch {} } }); P.srcs.forEach(z => { if (z.elB) { try { z.elB.pause(); } catch {} } }); if (rec) { rec.onstop = () => { const blob = new Blob(khuc, { type: rec.mimeType || 'video/webm' }); luuFile(blob); }; rec.stop(); } else veKhung(); };
  P.dungHam = xong; requestAnimationFrame(buoc);
}
function dung() { if (P.dungHam) P.dungHam(); }
$('#btnPlay').onclick = $('#btnPlay2').onclick = () => { if (P.dang) dung(); else phat(false); };
$('#btnXuat').onclick = () => batDauXuat();
$('#xuatHuy').onclick = () => { P.huyXuat = true; dung(); try { if (P.wl) P.wl.release(); } catch { } P.wl = null; $('#xuatHop').classList.remove('mo'); };
$('#xuatDong').onclick = () => $('#xuatHop').classList.remove('mo');
function luuFile(blob, ghiChu) {
  try { if (P.wl) P.wl.release(); } catch {}
  if (P.huyXuat) return;
  const mp4 = /mp4/.test(blob.type), ten = ($('#tenDuAn').value.trim() || 'video').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase().replace(/^-|-$/g, '').slice(0, 40) + '-' + new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '') + (/wav/.test(blob.type) ? '.wav' : /gif/.test(blob.type) ? '.gif' : /mpeg/.test(blob.type) ? '.mp3' : /^audio\/mp4/.test(blob.type) ? '.m4a' : /quicktime/.test(blob.type) ? '.mov' : mp4 ? '.mp4' : '.webm');
  const u = URL.createObjectURL(blob); const a = $('#xuatTai'); a.href = u; a.download = ten; a.textContent = /^audio/.test(blob.type) ? '⬇️ Tải âm thanh' : /gif/.test(blob.type) ? '⬇️ Tải GIF' : '⬇️ Tải video';
  $('#xuatTieuDe').textContent = '✓ Xong · ' + ten + ' (' + (blob.size / 1048576).toFixed(1).replace('.', ',') + ' MB)'; $('#xuatBar').style.width = '100%'; $('#xuatTt').textContent = ghiChu ? ghiChu : mp4 ? 'Bấm Tải video rồi đăng, hoặc đưa sang Chấm video để AI chấm bản này.' : 'Máy này xuất WebM (không có bộ mã H.264). TikTok web vẫn nhận; cần MP4 thì mở lại bằng Chrome trên máy tính hoặc Safari.';
  $('#xuatXong').style.display = ''; $('#xuatHuy').style.display = 'none';
  a.click(); toast('Đã lưu ' + ten); if (typeof NTM !== 'undefined') NTM.ghiXuat(blob, ten); xuatPdKem(ten); P.t = 0; veKhung();
}

/* ═════════ tab, kéo thả, boot ═════════ */
function doiTab(t) { $$('.etabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t))); $$('[data-pane]').forEach(p => p.classList.toggle('on', p.dataset.pane === t)); }
$$('.etabs [data-tab]').forEach(b => b.onclick = () => doiTab(b.dataset.tab));
const drop = $('#drop');
drop.onclick = () => $('#fileIn').click(); drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#fileIn').click(); } };
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('hot'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('hot'); }));
drop.addEventListener('drop', e => themFile([...(e.dataTransfer.files || [])]));
['dragover', 'drop'].forEach(ev => window.addEventListener(ev, e => { if (!drop.contains(e.target) && !$('#tlIn').contains(e.target)) e.preventDefault(); }));
$('#fileIn').onchange = e => { themFile([...e.target.files]); e.target.value = ''; };
function veQuota() {
  const me = TK.me, q = $('#quota');
  if (!me) { q.textContent = 'Chưa đăng nhập'; $('#acctBtn').textContent = 'Đăng ký'; return; }
  $('#acctBtn').textContent = me.loai === 'hv' ? 'Học viên' : me.pro ? '✦ Pro' : 'Free';
  if (TK.laPro()) { q.textContent = (me.ten || '') + ' · AI không giới hạn'; return; }
  const con = TK.luotCon('dung'), han = (me.han || {}).dung; q.textContent = `${me.ten ? me.ten + ' · ' : ''}còn ${con == null ? '?' : con}/${han == null ? '?' : han} lượt hiểu footage`;
}
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme(ls.get('hook.theme'));
$('#themeBtn').onclick = () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; const t = dark ? 'light' : 'dark'; applyTheme(t); ls.set('hook.theme', t); };
$('#acctBtn').onclick = () => TK.mo();
TK.khoiDong({ api: API, tool: 'dung', onDoi: () => { veQuota(); $('#ttKetNoi').classList.toggle('off', !TK.me); $('#ttKetNoi span').textContent = TK.me ? 'Đã kết nối' : 'Chưa đăng nhập'; } });
window.addEventListener('beforeunload', e => { if (P.srcs.length) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('resize', () => { if (!P.dang) veTl(); });
capNhatFont(); veTl(); veKhung();
