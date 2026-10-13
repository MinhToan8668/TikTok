/* ═════════ Quét chọn nhiều gồm cả phụ đề · kiểu riêng từng câu phụ đề (Áp cho tất cả bật/tắt như CapCut) · bố cục video dọc + giao diện TikTok trên khung xem ═════════ */
P.nhieuPd = P.nhieuPd || [];
function tuGocPd(c) { return c ? ((c.w && c.w[0]) || (c.tu && c.tu[0]) || null) : null; }
function kieuPdCua(c) { const w = tuGocPd(c); return (w && w.kieu) || null; }
function dsPdDangChon(i) { const ds = (P.nhieuPd || []).filter(j => dsPd()[j]); return ds.length > 1 && ds.includes(i) ? ds : [i]; }
function datKieuPd(i, k, v) { const all = dsPd(); dsPdDangChon(i).forEach(j => { const w = tuGocPd(all[j]); if (!w) return; const o = { ...(w.kieu || {}) }; if (v == null || v === '') delete o[k]; else o[k] = v; if (Object.keys(o).length) w.kieu = o; else delete w.kieu; }); if (!P.dang) veKhung(); veTl(); }
function boKieuPd(i, tatCa) { luuHoanTac(); const all = dsPd(); (tatCa ? all.map((_, j) => j) : dsPdDangChon(i)).forEach(j => { const w = tuGocPd(all[j]); if (w) delete w.kieu; }); veKhung(); veTl(); veProp(); }
function nhomKieuRieng(box, i) {
  const c = dsPd()[i]; if (!c) return; const kr = kieuPdCua(c) || {}, n = el('div', 'nhom2 pdRieng'); n.appendChild(el('b', null, 'Kiểu riêng cho câu này'));
  n.appendChild(el('div', 'quota', (dsPdDangChon(i).length > 1 ? dsPdDangChon(i).length + ' câu đang chọn · ' : '') + 'Tắt “Áp cho tất cả” nên chỉnh ở đây chỉ đổi câu đang chọn. Ô để trống = theo kiểu chung.'));
  const dat = (k, v) => { luuHoanTac(); datKieuPd(i, k, v); };
  oChon(n, 'Kiểu chữ', [['', 'Theo chung'], ...[...$('#pdKieu').options].map(o => [o.value, o.textContent])], kr.kieu || '', v => dat('kieu', v));
  oChon(n, 'Font', [['', 'Theo chung'], ...Object.keys(FONT_CSS).map(k => [k, FONT_CSS[k].replace(/"/g, '')])], kr.font || '', v => dat('font', v));
  oTruot(n, 'Cỡ chữ', 0.5, 2, 0.05, kr.co || 1, v => Math.round(v * 100) + '%', v => datKieuPd(i, 'co', Math.abs(v - 1) < 0.01 ? null : v));
  oChon(n, 'Độ đậm', [['', 'Theo chung'], ['600', 'Vừa'], ['700', 'Đậm'], ['800', 'Rất đậm'], ['900', 'Đen']], kr.dam ? String(kr.dam) : '', v => dat('dam', v ? +v : null));
  const mauO = (nhan, k) => { const l = el('label'); l.appendChild(el('span', null, nhan)); const r = el('div', 'row', null); r.style.gap = '6px'; const inp = el('input'); inp.type = 'color'; inp.value = kr[k] || (k === 'mau' ? mauNhan() : '#ffffff'); let da = false; inp.oninput = () => { if (!da) { luuHoanTac(); da = true; } datKieuPd(i, k, inp.value); }; const x = el('button', 'btn nho ghost', '↺'); x.type = 'button'; x.title = 'Theo chung'; x.onclick = () => { dat(k, null); veProp(); }; r.appendChild(inp); r.appendChild(x); l.appendChild(r); n.appendChild(l); };
  mauO('Màu chữ', 'chu'); mauO('Màu nhấn', 'mau');
  const lh = el('label'); lh.appendChild(el('span', null, 'IN HOA')); const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!kr.hoa; cb.onchange = () => dat('hoa', cb.checked ? true : null); lh.appendChild(cb); n.appendChild(lh);
  oTruot(n, 'Vị trí dọc', 0.1, 0.95, 0.01, kr.y != null ? kr.y : (P.pdY || 0.78), v => Math.round(v * 100) + '%', v => datKieuPd(i, 'y', v));
  const r = el('div', 'row'); const nut = (t, f, tt) => { const b = el('button', 'btn nho ghost', t); b.type = 'button'; if (tt) b.title = tt; b.onclick = f; r.appendChild(b); };
  nut('↺ Bỏ kiểu riêng', () => boKieuPd(i, false), 'Câu này về theo kiểu chung'); nut('Bỏ hết kiểu riêng', () => boKieuPd(i, true));
  nut('Lấy làm kiểu chung', () => { luuHoanTac(); const k = kieuPdCua(c) || {}; if (k.kieu) { $('#pdKieu').value = k.kieu; $('#pdKieu').dispatchEvent(new Event('change', { bubbles: true })); } if (k.font && $('#font')) { $('#font').value = k.font; capNhatFont(); } if (k.y != null) { P.pdY = k.y; } boKieuPd(i, false); P.pdApTatCa = true; veProp(); }, 'Kiểu chữ, font, vị trí của câu này thành kiểu chung cho mọi câu');
  n.appendChild(r); box.appendChild(n);
}
/* bố cục video dọc: khung xem đứng bên phải cao hết màn, dòng thời gian + thư viện + thuộc tính bên trái */
function datBocDoc(bat, im) {
  const ed = $('#ed'), giua = $('.ecol.giua'), eb = $('.ebody'); if (!giua || !eb || !ed.classList.contains('ccw')) return; bat = !!bat;
  if (bat && giua.parentNode !== ed) ed.insertBefore(giua, $('.etl').nextSibling); else if (!bat && giua.parentNode === ed) eb.insertBefore(giua, eb.querySelector('.keo.k2') || null);
  ed.classList.toggle('bocDoc', bat); const b = $('#btnBoCucDoc'); if (b) b.setAttribute('aria-pressed', String(bat)); try { localStorage.setItem('dv_bocDoc', bat ? '1' : '0'); } catch { }
  if (bat && $('#lopPhuChon') && $('#lopPhuChon').value === 'khong' && !im) { $('#lopPhuChon').value = 'tiktok'; veLopPhu(); }
  setTimeout(() => { if (!P.dang) veKhung(); }, 60);
}
const TK_SVG = { tim: '<path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9z"/>', bl: '<path d="M4 4h16v11H9l-5 4z"/>', luu: '<path d="M6 3h12v18l-6-4-6 4z"/>', chia: '<path d="M14 4l8 7-8 7v-4C8 14 5 16 3 20c0-7 4-11 11-12z"/>', tim2: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>' };
function veLopPhuTikTok(o) {
  const ic = p => '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">' + p + '</svg>';
  o.insertAdjacentHTML('beforeend', '<div class="tk"><div class="tkTop"><span>Đang Follow</span><b>Dành cho bạn</b><i>' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' + TK_SVG.tim2 + '</svg></i></div>' +
    '<div class="tkPhai"><span class="tkAva"><i>+</i></span><span>' + ic(TK_SVG.tim) + '<small>2,8M</small></span><span>' + ic(TK_SVG.bl) + '<small>2,8M</small></span><span>' + ic(TK_SVG.luu) + '<small>2,8M</small></span><span>' + ic(TK_SVG.chia) + '<small>2,8M</small></span><span class="tkDia"></span></div>' +
    '<div class="tkDuoi"><b>@' + (($('#tenDuAn') && $('#tenDuAn').value) || 'ten_kenh').replace(/\s+/g, '_').toLowerCase().slice(0, 24) + '</b><span>Mô tả video của bạn #hashtag #xuhuong</span><span>♫ âm thanh gốc · ' + (($('#tenDuAn') && $('#tenDuAn').value) || 'tên kênh') + '</span></div></div>');
}
function khoiTaoDoc() {
  TAB_NHOM['Kiểu riêng cho câu này'] = 'Văn bản';
  // hoàn tác/làm lại nhớ cả phụ đề: đoạn chữ riêng, từ bị ẩn, kiểu riêng, nhóm từ
  const chupTTGoc = chupTT; chupTT = function () { const o = JSON.parse(chupTTGoc.apply(this, arguments)); o.pdNgoai = P.pdNgoai || null; o.tuTT = P.srcs.map(s => (s.tu || []).map(w => (w.an || w.kieu || w.nhom) ? [w.an ? 1 : 0, w.kieu || 0, w.nhom || 0] : 0)); return JSON.stringify(o); };
  const apTTGoc = apTT; apTT = function (s) { const o = JSON.parse(s); if (o.pdNgoai !== undefined) P.pdNgoai = o.pdNgoai; if (o.tuTT) P.srcs.forEach((src, i) => { const a = o.tuTT[i]; if (!a) return; (src.tu || []).forEach((w, j) => { const v = a[j]; if (!v) { delete w.an; delete w.kieu; delete w.nhom; return; } if (v[0]) w.an = true; else delete w.an; if (v[1]) w.kieu = v[1]; else delete w.kieu; if (v[2]) w.nhom = v[2]; else delete w.nhom; }); }); cumKey = ''; P.nhieuPd = []; return apTTGoc.apply(this, arguments); };
  // 1. quét chọn: đánh dấu chỉ số phụ đề lên chip + xoá nhiều phụ đề
  const veTlCu = veTl; veTl = function () { const r = veTlCu.apply(this, arguments); const all = dsPd(); $$('#tlIn .pdIt').forEach((d, i) => { d.dataset.pd = i; const c = all[i]; d.classList.toggle('rieng', !!kieuPdCua(c)); d.classList.toggle('nhieu', (P.nhieuPd || []).length + dsNhieu().length > 1 && (P.nhieuPd || []).includes(i)); }); return r; };
  const danhDauCu = danhDauNhieu; danhDauNhieu = function () { danhDauCu.apply(this, arguments); const tong = (P.nhieuPd || []).length + dsNhieu().length; $$('#tlIn .pdIt').forEach(d => d.classList.toggle('nhieu', tong > 1 && (P.nhieuPd || []).includes(+d.dataset.pd))); };
  const lenhCu = lenh; lenh = function (act) { const ds = (P.nhieuPd || []).filter(j => dsPd()[j]); if (act === 'xoa' && ds.length) { luuHoanTac(); const all = dsPd(), ngoai = []; ds.forEach(j => { const c = all[j]; if (!c) return; if (c.ng != null) ngoai.push(c.ng); else (c.w || []).forEach(w => { w.an = true; }); }); ngoai.sort((a, b) => b - a).forEach(n => P.pdNgoai.splice(n, 1)); const them = dsNhieu(); P.nhieuPd = []; if (them.length) { P.nhieu = them; xoaNhieu(true); } P.chon = null; P.nhieu = []; cumKey = ''; veTl(); if (typeof veLoi === 'function') veLoi(); veKhung(); veProp(); toast('Đã xoá ' + (ds.length + them.length) + ' mục'); return; } return lenhCu.apply(this, arguments); };
  const vePropCu = veProp; veProp = function () { const r = vePropCu.apply(this, arguments); const nPd = (P.nhieuPd || []).filter(j => dsPd()[j]).length, nK = dsNhieu().length; if (nPd && P.chon && P.chon.k !== 'pd') { const box = $('#propChon'); if (box) box.insertBefore(el('div', 'quota', nPd + ' câu phụ đề đang chọn' + (nK ? ' + ' + nK + ' mục khác' : '') + ' · Delete để xoá hết'), box.firstChild); } return r; };
  $('#tlIn').addEventListener('pointerdown', e => { if (e.target.closest('.pdIt') && !(e.ctrlKey || e.metaKey || e.shiftKey)) { const i = +e.target.closest('.pdIt').dataset.pd; if (!(P.nhieuPd || []).includes(i)) P.nhieuPd = []; } else if (e.target.closest('.item') && !(e.ctrlKey || e.metaKey || e.shiftKey)) P.nhieuPd = []; }, true);
  // 2. bảng thuộc tính phụ đề: Áp cho tất cả / kiểu riêng
  const veTtPdCu = veThuocTinhPd; veThuocTinhPd = function (box, i) { veTtPdCu.apply(this, arguments); const b = [...box.querySelectorAll('.nhom2 > b')].find(x => /Kiểu phụ đề \(cho tất cả câu\)/.test(x.textContent)); if (!b) return; const n2 = b.parentNode, ap = P.pdApTatCa !== false; const l = el('label', 'pdApHang'); l.appendChild(el('span', null, 'Áp cho tất cả phụ đề')); const cb = el('input'); cb.type = 'checkbox'; cb.id = 'pdApTatCa'; cb.checked = ap; cb.title = 'Bật: chỉnh kiểu là đổi mọi câu. Tắt: chỉnh riêng câu đang chọn'; cb.onchange = () => { P.pdApTatCa = cb.checked; veProp(); }; l.appendChild(cb); box.insertBefore(l, n2); const nPd = (P.nhieuPd || []).length; if (nPd > 1) box.insertBefore(el('div', 'quota', nPd + ' câu phụ đề đang chọn · Delete để xoá hết · chỉnh kiểu riêng áp cho cả ' + nPd + ' câu'), l); if (!ap) { n2.style.display = 'none'; nhomKieuRieng(box, i); } b.textContent = 'Kiểu phụ đề (cho tất cả câu)'; };
  // 3. nút bố cục dọc trên thanh trên + lớp phủ giao diện TikTok
  if ($('#ed').classList.contains('ccw')) {
    IC.phone = '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>';
    const b = el('button', 'btn ghost nho ic'); b.type = 'button'; b.id = 'btnBoCucDoc'; b.title = 'Bố cục video dọc: khung xem đứng bên phải như điện thoại, có giao diện TikTok'; b.innerHTML = ic('phone'); b.setAttribute('aria-pressed', 'false'); b.onclick = () => datBocDoc(!$('#ed').classList.contains('bocDoc')); $('.etop').insertBefore(b, $('#btnToanApp'));
    let luu = '0'; try { luu = localStorage.getItem('dv_bocDoc') || '0'; } catch { } if (luu === '1') datBocDoc(true, true);
  }
  const sel = $('#lopPhuChon'); if (sel && ![...sel.options].some(o => o.value === 'tiktok')) { const op = el('option', null, 'Giao diện TikTok'); op.value = 'tiktok'; sel.insertBefore(op, sel.options[1] || null); const op2 = el('option', null, 'TikTok + lưới'); op2.value = 'tiktok_luoi'; sel.insertBefore(op2, sel.options[2] || null); }
  const veLopPhuCu = veLopPhu; veLopPhu = function () { const k = $('#lopPhuChon') ? $('#lopPhuChon').value : 'khong'; if (k === 'tiktok' || k === 'tiktok_luoi') { const sel2 = $('#lopPhuChon'); sel2.value = k === 'tiktok_luoi' ? 'luoi' : 'khong'; veLopPhuCu.apply(this, arguments); sel2.value = k; veLopPhuTikTok($('#lopPhu')); return; } return veLopPhuCu.apply(this, arguments); };
  if (sel) sel.onchange = () => veLopPhu();   // onchange cũ trỏ thẳng hàm gốc
  if (window.ResizeObserver) { const kh = $('.khung'); if (kh) new ResizeObserver(() => { const o = $('#lopPhu'); if (o) o.style.setProperty('--kw', kh.clientWidth + 'px'); }).observe(kh); }
  $('#tenDuAn').addEventListener('input', () => { if (/tiktok/.test(($('#lopPhuChon') || {}).value || '')) veLopPhu(); });
  veLopPhu();
}


/* ═════════ Gọn hơn: thanh trên khung xem (Tỉ lệ + lớp phủ không đè canvas), cột giữa vừa đúng khung, viền ngoài bo góc, nút sáng/tối ═════════ */
function khungSang() { return $('#ed').classList.contains('sang'); }
function datKhungSang(bat) { $('#ed').classList.toggle('sang', !!bat); try { localStorage.setItem('dv_sang', bat ? '1' : '0'); } catch { } veNutSangToi(); if (!P.dang) setTimeout(veKhung, 0); }
function veNutSangToi() { const b = $('#btnSangToi'); if (!b) return; b.innerHTML = ic(khungSang() ? 'moon' : 'sun'); b.title = khungSang() ? 'Khung dựng: chuyển sang tông tối' : 'Khung dựng: chuyển sang tông sáng (không đổi màu trang ngoài)'; }
function canhGiua() { canhGiua0(); kepGiua(); }
/* chốt cuối: khung xem luôn còn ≥ 260 px — bớt thư viện trước, rồi tới bảng thuộc tính (cỡ đã lưu từ màn to hơn cũng không ép mất khung xem) */
function kepGiua() {
  const ed = $('#ed'), eb = $('.ebody'); if (!ed || !eb || !ed.classList.contains('ccw') || ed.classList.contains('mobi') || ed.classList.contains('bocDoc') || (typeof laMobi === 'function' && laMobi())) return;
  const coPhai = ed.classList.contains('coChon') || ed.classList.contains('co-phai'), gt = (v, md) => parseFloat(getComputedStyle(ed).getPropertyValue(v)) || md;
  const thuGon = ed.classList.contains('thuGon'), wT = thuGon ? 71 : gt('--wTrai', $('.ecol.trai').offsetWidth), wP = coPhai ? gt('--wPhai', 321) : 0;
  let thieu = 260 - (eb.clientWidth - wT - wP - (coPhai ? 12 : 6)); if (thieu <= 0) return;
  if (!thuGon) { const nt = Math.max(240, wT - thieu); thieu -= wT - nt; ed.style.setProperty('--wTrai', Math.round(nt) + 'px'); }
  if (thieu > 0 && coPhai) ed.style.setProperty('--wPhai', Math.round(Math.max(240, wP - thieu)) + 'px');
}
function canhGiua0() {
  const ed = $('#ed'); if (!ed || !ed.classList.contains('ccw') || (typeof laMobi === 'function' && laMobi())) return;
  if ($('.keo.dang')) return;   // đang kéo tay đổi cỡ thì không tự canh
  const vung = $('.khungVung'); if (!vung) return; const [a, b] = (typeof TI_LE === 'object' && TI_LE[$('#tiLe').value]) || [9, 16];
  const h = Math.max(200, vung.clientHeight - 28), can = Math.round(h * a / b) + 40;
  if (ed.classList.contains('bocDoc')) { ed.style.setProperty('--wXem', Math.max(360, Math.min(Math.round(innerWidth * 0.55), can - 10)) + 'px'); return; }   // khung vừa khít cột, không chừa mép thừa
  // chưa tự kéo cỡ cột trái → thư viện lấy hết phần dư, cột giữa chỉ rộng vừa khung hình
  const kc = typeof kichCo === 'function' ? kichCo() : {}; const eb = $('.ebody'); if (!eb) return; const coPhai = ed.classList.contains('coChon') || ed.classList.contains('co-phai');
  if (kc.trai || ed.classList.contains('thuGon')) {
    // người dùng đã tự kéo cỡ: vẫn kẹp lại để cột khung xem không bị ép mất và bảng thuộc tính không tràn ra ngoài màn hình
    if (kc.phai) ed.style.setProperty('--wPhai', Math.max(240, Math.min(kc.phai, Math.round(eb.clientWidth * 0.45))) + 'px'); else ed.style.setProperty('--wPhai', Math.round(Math.max(321, Math.min(400, eb.clientWidth * 0.28))) + 'px');
    if (kc.trai) { const wP = coPhai ? (parseFloat(getComputedStyle(ed).getPropertyValue('--wPhai')) || 321) + 6 : 0; ed.style.setProperty('--wTrai', Math.max(240, Math.min(kc.trai, eb.clientWidth - 12 - wP - 260)) + 'px'); }
    return;
  }
  // bảng thuộc tính rộng như CapCut (321–400px) khi chưa tự kéo, để nhãn không bị xuống dòng
  if (!kc.phai) ed.style.setProperty('--wPhai', Math.round(Math.max(eb.clientWidth < 1100 ? 280 : 321, Math.min(400, eb.clientWidth * 0.28))) + 'px');
  const wPhai = coPhai ? (parseFloat(getComputedStyle(ed).getPropertyValue('--wPhai')) || 321) + 6 : 0;
  const du = eb.clientWidth - 6 - wPhai - Math.max(420, can), san = Math.max(260, Math.min(398, eb.clientWidth - 12 - wPhai - 300)); ed.style.setProperty('--wTrai', Math.max(san, Math.min(du, Math.round(eb.clientWidth * 0.5))) + 'px');   /* màn hẹp: thư viện co lại để khung xem còn ≥ 300px */
}
function khoiTaoGon() {
  const ed = $('#ed'); if (!ed.classList.contains('ccw')) return;
  // nút sáng / tối
  const bt = $('#btnSangToi'); if (bt) { let luuSang = '0'; try { luuSang = localStorage.getItem('dv_sang') || '0'; } catch { } ed.classList.toggle('sang', luuSang === '1'); bt.onclick = () => datKhungSang(!khungSang()); veNutSangToi(); }
  // thanh trên khung xem: Tỉ lệ bên trái, cụm lớp phủ / lặp / scopes bên phải
  const giua = $('.ecol.giua'), vung = $('.khungVung'); if (giua && vung) { const top = el('div', 'ccTop'); giua.insertBefore(top, vung); const r = $('#ccRatio'), c = $('.ctlPhai.ccNoi'); if (r) top.appendChild(r); if (c) top.appendChild(c); }
  // cột giữa vừa đúng khung hình, phần dư dồn cho thư viện / thuộc tính
  canhGiua(); addEventListener('resize', canhGiua); $('#tiLe').addEventListener('change', () => setTimeout(canhGiua, 0)); if (window.ResizeObserver) new ResizeObserver(() => canhGiua()).observe($('.etl'));
  const datBocDocCu = datBocDoc; datBocDoc = function () { const r = datBocDocCu.apply(this, arguments); setTimeout(canhGiua, 0); return r; };
  const ccThuGonCu = ccThuGon; ccThuGon = function () { const r = ccThuGonCu.apply(this, arguments); setTimeout(canhGiua, 0); return r; };
  const ccAnTlCu = ccAnTl; ccAnTl = function () { const r = ccAnTlCu.apply(this, arguments); setTimeout(canhGiua, 80); return r; };
  let canhCho = 0; const henCanhGiua = () => { if (canhCho) return; canhCho = requestAnimationFrame(() => { canhCho = 0; canhGiua(); }); };   /* gom: canh giữa một lần mỗi khung hình (đọc bố cục ngay trong veProp làm vẽ dòng thời gian chậm) */
  const vePropGon = veProp; veProp = function () { const r = vePropGon.apply(this, arguments); henCanhGiua(); return r; };
  const datToanAppGon = datToanApp; datToanApp = function () { const r = datToanAppGon.apply(this, arguments); setTimeout(canhGiua, 0); return r; };
}


/* ═════════ Bảng Media kiểu CapCut: thẻ đều nhau, huy hiệu thời lượng + Đã dùng + AI, nút ＋ khi rê; thanh dưới khung xem ở bố cục dọc ═════════ */
function veHuyHieuSrc() {
  if (!$('#ed').classList.contains('ccw')) return; const dung = new Set([...P.clips.map(c => c.src), ...(P.broll || []).map(b => b.src)]);
  $$('#srcs .fsrc').forEach(d => { const s = P.srcs.find(x => x.id === d.dataset.id); const fh = d.querySelector('.fh'), im = d.querySelector('img.th'); if (!s || !fh || !im || fh.querySelector('.thWrap')) return;
    const w = el('div', 'thWrap'); fh.insertBefore(w, im); w.appendChild(im);
    if (s.giay) w.appendChild(el('span', 'hhTg', s.loai === 'anh' ? 'Ảnh' : fmt(s.giay)));
    if (dung.has(s.id)) w.appendChild(el('span', 'hhDung', 'Đã dùng'));
    if (s.tt === 'xong') w.appendChild(el('span', 'hhAi', '✦ AI')); else if (s.tt === 'dang') w.appendChild(el('span', 'hhAi dang', '…'));
    fh.querySelectorAll('.acts .btn').forEach(bt => { const t = bt.textContent.trim(); if (t === '＋ V1') bt.classList.add('anCC2'); else if (t === '🙂 Dò mặt') { bt.textContent = '🙂'; bt.title = 'Dò mặt để crop dọc bám theo (chạy trên máy, không tốn lượt)'; } });   // ô kiểu CapCut: ＋ đã có khi rê, Dò mặt chỉ còn icon
    const them = el('button', 'hhThem'); them.type = 'button'; them.title = 'Thêm vào dòng thời gian tại cuối V1'; them.textContent = '+'; them.onclick = e => { e.stopPropagation(); luuHoanTac(); P.clips.push({ src: s.id, bd: 0, kt: s.giay || 3, ly_do: 'thêm tay' }); veTl(); veSrcs(); toast('Đã thêm ' + s.ten + ' vào V1'); }; w.appendChild(them);
    w.ondblclick = () => { luuHoanTac(); P.clips.push({ src: s.id, bd: 0, kt: s.giay || 3, ly_do: 'thêm tay' }); veTl(); veSrcs(); };
  });
}
function khoiTaoMediaCC() {
  if (!$('#ed').classList.contains('ccw')) return;
  const veSrcsCu = veSrcs; veSrcs = function () { const r = veSrcsCu.apply(this, arguments); try { veHuyHieuSrc(); } catch { } return r; };
  const veTlMedia = veTl; veTl = function () { const r = veTlMedia.apply(this, arguments); $$('#srcs .fsrc').forEach(d => { const co = P.clips.some(c => c.src === d.dataset.id) || (P.broll || []).some(b => b.src === d.dataset.id); const h = d.querySelector('.hhDung'); if (co && !h) { const w = d.querySelector('.thWrap'); if (w) w.appendChild(el('span', 'hhDung', 'Đã dùng')); } else if (!co && h) h.remove(); }); return r; };
  veHuyHieuSrc();
  // thanh dưới khung xem (bố cục dọc): đồng hồ + vừa khung + toàn màn hình, như CapCut desktop
  const giua = $('.ecol.giua'); if (giua && !$('.ccBot')) { const bot = el('div', 'ccBot'); bot.innerHTML = '<span class="tg" id="tgXem">00:00:00 | 00:00:00</span><span class="gian"></span><button class="ic" id="btnVuaXem" type="button" title="Vừa khung (⇧F)">' + ic('ratio') + '</button><button class="ic" id="btnToanXem" type="button" title="Xem toàn màn hình">' + ic('full') + '</button>'; giua.appendChild(bot); $('#btnVuaXem').onclick = () => ccDatZoom('vua'); $('#btnToanXem').onclick = () => { const b = $('#btnToanManHinh'); if (b) b.click(); }; }
  const datTgMedia = datTg; datTg = function (tong) { const r = datTgMedia.apply(this, arguments); const g = $('#tgXem'); if (g && !g.querySelector('input')) { g.innerHTML = '<b>' + CC_TC(P.t) + '</b> / ' + CC_TC(tong); g.title = 'Bấm để gõ thời điểm (vd 12 · 1:05 · 00:00:12:15)'; } return r; };
}

/* ═════════ CC2 · Bảng chọn màu kiểu CapCut + bảng thuộc tính kiểu CapCut desktop (mục gập ↺ ◇, Kiểu có sẵn, số có nút tăng giảm) ═════════ */
function hslHex(h, s, l) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function cc2Rgb(h) { h = String(h || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); return isNaN(n) ? [255, 255, 255] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function rgbHsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; }
function hsvRgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; let r = 0, g = 0, b = 0; if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
const CC2_MAU_GOIY = (() => { const ds = ['#FFFFFF', '#D9D9D9', '#A6A6A6', '#737373', '#404040', '#000000', '#99DF00', '#22D3DF', '#FFD400', '#FF4D6D']; const hues = [0, 30, 50, 90, 140, 180, 210, 250, 290, 330]; [[90, 62], [85, 52], [75, 42], [60, 74], [95, 32]].forEach(([s, l]) => hues.forEach(h => ds.push(hslHex(h, s, l)))); return ds; })();
function mauToi() { try { return JSON.parse(localStorage.getItem('dv_mauToi') || '[]'); } catch { return []; } }
function luuMauToi(ds) { try { localStorage.setItem('dv_mauToi', JSON.stringify(ds.slice(0, 20))); } catch { } }
const IC_HUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>';
let BM = null;   // bảng màu đang mở
function dongBangMau() { if (BM) { BM.hop.remove(); BM = null; } }
function moBangMau(inp) {
  dongBangMau(); const hop = el('div', 'bangMau'); hop.innerHTML = '<div class="sv"><canvas width="220" height="130"></canvas><i class="nut"></i></div>'
    + '<div class="hang"><button type="button" class="hut" title="Ống hút: lấy màu từ bất kỳ đâu trên màn hình">' + IC_HUT + '</button><div class="hue"><input type="range" min="0" max="360" step="1" aria-label="Sắc độ"><i class="nut"></i></div></div>'
    + '<div class="hang"><span class="nhan">Hex</span><input type="text" class="hex" maxlength="7" spellcheck="false" aria-label="Mã màu Hex"></div>'
    + '<div class="hang tde"><span>Màu của tôi</span><button type="button" class="them" title="Lưu màu đang chọn vào Màu của tôi">+</button></div><div class="luoi toi"></div>'
    + '<div class="hang tde"><span>Gợi ý</span></div><div class="luoi goiy"></div>';
  $('#ed').appendChild(hop);
  let [h, s, v] = rgbHsv(...cc2Rgb(inp.value));
  const cv = hop.querySelector('canvas'), cx = cv.getContext('2d'), svBox = hop.querySelector('.sv'), nutSv = svBox.querySelector('.nut'), hue = hop.querySelector('.hue input'), nutHue = hop.querySelector('.hue .nut'), hex = hop.querySelector('.hex'), luoiToi = hop.querySelector('.luoi.toi'), luoiGoiY = hop.querySelector('.luoi.goiy');
  const hexNay = () => rgbHex(...hsvRgb(h, s, v));
  const veSv = () => { const [r1, g1, b1] = hsvRgb(h, 1, 1); cx.fillStyle = 'rgb(' + Math.round(r1) + ',' + Math.round(g1) + ',' + Math.round(b1) + ')'; cx.fillRect(0, 0, 220, 130); const ga = cx.createLinearGradient(0, 0, 220, 0); ga.addColorStop(0, '#fff'); ga.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = ga; cx.fillRect(0, 0, 220, 130); const gb = cx.createLinearGradient(0, 0, 0, 130); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, '#000'); cx.fillStyle = gb; cx.fillRect(0, 0, 220, 130); nutSv.style.left = (s * 100) + '%'; nutSv.style.top = ((1 - v) * 100) + '%'; nutSv.style.background = hexNay(); nutHue.style.left = (h / 360 * 100) + '%'; hex.value = hexNay(); luoiToi.querySelectorAll('.o').forEach(o => o.classList.toggle('on', o.dataset.m === hexNay())); luoiGoiY.querySelectorAll('.o').forEach(o => o.classList.toggle('on', o.dataset.m === hexNay())); };
  const ap = (xong) => { const x = hexNay(); if (inp.value.toUpperCase() !== x) { inp.value = x; inp.dispatchEvent(new Event('input', { bubbles: true })); } if (xong) inp.dispatchEvent(new Event('change', { bubbles: true })); };
  const datHex = (m, xong) => { [h, s, v] = rgbHsv(...cc2Rgb(m)); hue.value = h; veSv(); ap(xong); };
  svBox.onpointerdown = e => { e.preventDefault(); try { svBox.setPointerCapture(e.pointerId); } catch { } const mv = ev => { const r = svBox.getBoundingClientRect(); s = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)); v = 1 - Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)); veSv(); ap(false); }; mv(e); svBox.onpointermove = mv; svBox.onpointerup = svBox.onpointercancel = () => { svBox.onpointermove = null; ap(true); }; };
  hue.oninput = () => { h = +hue.value; veSv(); ap(false); }; hue.onchange = () => ap(true);
  hex.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') hex.blur(); }; hex.onchange = () => { let t = hex.value.trim(); if (!t.startsWith('#')) t = '#' + t; if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t)) { hex.value = hexNay(); return; } datHex(t, true); };
  const hut = hop.querySelector('.hut'); if (!window.EyeDropper) { hut.disabled = true; hut.title = 'Trình duyệt này chưa có ống hút màu (Chrome / Edge có)'; } else hut.onclick = async () => { try { const r = await new EyeDropper().open(); datHex(r.sRGBHex, true); } catch { } };
  const veLuoi = (box, ds, cuaToi) => { box.innerHTML = ''; ds.forEach(m => { const b = el('button', 'o'); b.type = 'button'; b.dataset.m = m.toUpperCase(); b.style.background = m; b.title = m + (cuaToi ? ' · chuột phải để xoá' : ''); if (m.toUpperCase() === hexNay()) b.classList.add('on'); b.onclick = () => datHex(m, true); if (cuaToi) b.oncontextmenu = e => { e.preventDefault(); const con = mauToi().filter(x => x !== m); luuMauToi(con); veLuoi(box, con, true); }; box.appendChild(b); }); if (!ds.length) box.appendChild(el('span', 'quota', 'Bấm + để lưu màu đang chọn')); };
  veLuoi(luoiToi, mauToi(), true); veLuoi(luoiGoiY, CC2_MAU_GOIY, false);
  hop.querySelector('.them').onclick = () => { const ds = [hexNay(), ...mauToi().filter(x => x !== hexNay())]; luuMauToi(ds); veLuoi(luoiToi, mauToi(), true); toast('Đã lưu ' + hexNay() + ' vào Màu của tôi'); };
  veSv();
  const r = inp.getBoundingClientRect(); hop.style.visibility = 'hidden'; requestAnimationFrame(() => { const hr = hop.getBoundingClientRect(); let x = r.left, y = r.bottom + 6; if (x + hr.width > innerWidth - 8) x = Math.max(8, innerWidth - 8 - hr.width); if (y + hr.height > innerHeight - 8) y = Math.max(8, r.top - hr.height - 6); hop.style.left = x + 'px'; hop.style.top = y + 'px'; hop.style.visibility = ''; });
  BM = { hop, inp };
}
function khoiTaoBangMau() {
  if (!$('#ed').classList.contains('ccw')) return;
  document.addEventListener('click', e => { const i = e.target && e.target.closest ? e.target.closest('input[type=color]') : null; if (!i || !i.closest('#ed')) return; e.preventDefault(); if (BM && BM.inp === i) dongBangMau(); else moBangMau(i); }, true);
  document.addEventListener('pointerdown', e => { if (BM && !e.target.closest('.bangMau') && e.target !== BM.inp) dongBangMau(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && BM) { dongBangMau(); } }, true);
}

/* ── bảng thuộc tính kiểu CapCut ── */
function dvGap() { try { return JSON.parse(localStorage.getItem('dv_gap') || '{}'); } catch { return {}; } }
const CC2_TEN_MUC = { 'Khung hình': 'Biến đổi', 'Khung hình (overlay)': 'Biến đổi', 'Keyframe ◇': 'Keyframe', 'Hoạt ảnh vào / ra': 'Hoạt ảnh' };
/* như CapCut: mục phụ thu gọn sẵn, chỉ mở khi cần — người dùng mở ra thì nhớ lựa chọn đó */
const CC2_GAP_MD = ['Hoà trộn', 'Keyframe ◇', 'Lật & cắt khung', 'Nhoè chuyển động', 'Ghép nền (chroma key) & độ mờ', 'Bánh xe màu', 'HSL', 'Đường cong', 'Bám vật thể', 'Hình vẽ', 'Lớp & khớp khung'];
function ccNhom(n, ten, opt) {
  if (n.querySelector(':scope > .ccHd')) return; const b = n.querySelector(':scope > b'); if (!ten) ten = b ? b.textContent.trim() : ''; if (!ten) return; if (b) b.classList.add('anCC');
  const hien = CC2_TEN_MUC[ten] || ten, hd = el('div', 'ccHd');
  if (opt && opt.cb != null) { const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!opt.cb; cb.title = 'Bật / tắt ' + hien.toLowerCase(); cb.onchange = () => opt.doi(cb.checked); hd.appendChild(cb); }
  const tenEl = el('span', 'ten', hien), caret = el('button', 'caret', '▾'); caret.type = 'button'; caret.title = 'Thu gọn / mở rộng'; hd.appendChild(tenEl); hd.appendChild(caret); hd.appendChild(el('span', 'gian'));
  if (n.querySelector(':scope > label input[type=range], :scope > div:not(.ccSec) input[type=range]')) { const rs = el('button', 'ic nho', '↺'); rs.type = 'button'; rs.title = 'Đặt lại các thanh trượt trong mục này'; rs.onclick = () => { n.querySelectorAll(':scope > label > span:first-child, :scope > div:not(.ccSec) label > span:first-child').forEach(sp => { if (sp.parentElement.querySelector('input[type=range]')) sp.dispatchEvent(new Event('dblclick')); }); }; hd.appendChild(rs); }
  if (n.querySelector(':scope > label .kfn, :scope > div:not(.ccSec) .kfn')) { const nav = el('span', 'kfNav'); const tim = t => [...$('#propChon').querySelectorAll('button')].find(x => x.textContent.trim() === t); const b1 = el('button', null, '‹'); b1.type = 'button'; b1.title = 'Keyframe trước'; b1.onclick = () => { const x = tim('◀ ◇'); if (x && !x.disabled) x.click(); }; const b2 = el('button', 'kf', n.querySelector('.kfn.co') ? '◆' : '◇'); b2.type = 'button'; b2.title = 'Thêm keyframe cho mọi thuộc tính trong mục tại đầu phát'; b2.onclick = () => { const ds = [...n.querySelectorAll(':scope > label .kfn:not(.co):not(:disabled), :scope > div:not(.ccSec) .kfn:not(.co):not(:disabled)')]; if (!ds.length) { toast('Mục này đã có keyframe tại đầu phát'); return; } ds.forEach(k => k.click()); }; const b3 = el('button', null, '›'); b3.type = 'button'; b3.title = 'Keyframe sau'; b3.onclick = () => { const x = tim('◇ ▶'); if (x && !x.disabled) x.click(); }; nav.append(b1, b2, b3); hd.appendChild(nav); }
  { const d0 = dvGap(); if (d0[ten] === undefined ? CC2_GAP_MD.includes(ten) : d0[ten]) n.classList.add('gap'); } const lat = () => { n.classList.toggle('gap'); const d = dvGap(); d[ten] = n.classList.contains('gap'); try { localStorage.setItem('dv_gap', JSON.stringify(d)); } catch { } }; caret.onclick = lat; tenEl.onclick = lat;
  n.insertBefore(hd, n.firstChild);
}
function ccSo(o) {
  const l = o.parentElement; if (!l || l.tagName !== 'LABEL' || o.closest('.ccSo')) return; const r = l.querySelector('input[type=range]'); if (!r) return;
  const w = el('span', 'ccSo'); o.replaceWith(w); w.appendChild(o); const st = el('span', 'buoc');
  [['▴', 1], ['▾', -1]].forEach(([t, d]) => { const b = el('button', null, t); b.type = 'button'; b.tabIndex = -1; b.title = d > 0 ? 'Tăng' : 'Giảm'; b.onpointerdown = e => e.preventDefault(); b.onclick = () => { if (d > 0) r.stepUp(); else r.stepDown(); r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); }; st.appendChild(b); }); w.appendChild(st);
}
function ccHang(n, nhan) { return n ? [...n.querySelectorAll(':scope > label')].find(l => l.firstElementChild && l.firstElementChild.tagName === 'SPAN' && l.firstElementChild.textContent.trim() === nhan) : null; }
function ccNhomTen(box, ten) { return [...box.querySelectorAll(':scope > .nhom2')].find(n => { const b = n.querySelector(':scope > b'); return b && b.textContent.trim() === ten; }); }
const CC2_KIEU_KEYS = ['nen', 'vien_mau', 'vien_day', 'nen_mau', 'nen_bo', 'nen_pad', 'phat_sang', 'mau2', 'gocMau', 'bongChu', 'bong', 'nghieng', 'gach', 'font', 'dam', 'mau', 'gianChu', 'dongCao', 'cong', 'hoa'];
function cc2Chu(box, g) {
  const kc = ccNhomTen(box, 'Kiểu chữ'); if (!kc || kc.querySelector('.ccBasic')) return; const ha = ccNhomTen(box, 'Hoạt ảnh chữ'), ht = ccNhomTen(box, 'Hoà trộn'), row = kc.querySelector(':scope > .row');
  const bas = el('div', 'ccBasic');
  // ô nhập chữ nhiều dòng (dấu | = xuống dòng, như trước)
  const f1 = [...box.children].find(x => x.tagName === 'LABEL' && x.classList.contains('full') && x.firstElementChild && x.firstElementChild.textContent.trim() === 'Chữ');
  if (f1) { const i1 = f1.querySelector('input'); const ta = el('textarea', 'ccChuNoi'); ta.rows = 3; ta.placeholder = 'Nhập chữ… (Enter để xuống dòng)'; ta.value = (i1.value || '').replace(/\s*\|\s*/g, '\n'); ta.oninput = () => { i1.value = ta.value.replace(/\n/g, '|'); if (i1.oninput) i1.oninput(); const it = document.querySelector('#tlIn .item.g.chon small'); if (it) it.textContent = i1.value; }; ta.onkeydown = e => e.stopPropagation(); f1.classList.add('anCC'); bas.appendChild(ta); }
  const fFont = ccHang(kc, 'Font'); if (fFont) { bas.appendChild(fFont); const sl = fFont.querySelector('select'); if (sl) { Object.keys(FONT_CSS).forEach(id => { if (![...sl.options].some(o => o.value === id)) { const op = el('option', null, tenFont(id)); op.value = id; sl.appendChild(op); } }); if (g.font && [...sl.options].some(o => o.value === g.font)) sl.value = g.font; ganBangFont(sl); } }
  const fCo = ccHang(kc, 'Cỡ'); if (fCo) { fCo.firstElementChild.textContent = 'Cỡ chữ'; bas.appendChild(fCo); }
  // Kiểu: B U I · TT tt Tt
  const fDam = ccHang(kc, 'Độ đậm'); if (fDam) fDam.classList.add('anCC');
  const kieu = el('label'); kieu.appendChild(el('span', null, 'Kiểu')); const grp = el('div', 'ccGrp');
  const bB = el('button', 'btn nho', 'B'); bB.type = 'button'; bB.title = 'Đậm'; bB.style.fontWeight = '900'; bB.setAttribute('aria-pressed', String((g.dam || 900) >= 800)); bB.onclick = () => { luuHoanTac(); g.dam = (g.dam || 900) >= 800 ? 500 : 900; veProp(); veKhung(); }; grp.appendChild(bB);
  if (row) [...row.children].forEach(b => { const t = b.textContent.trim(); if (t === 'U' || t === 'I') grp.appendChild(b); });
  const grp2 = el('div', 'ccGrp'); [['TT', 'hoa', 'IN HOA'], ['tt', 'thuong', 'chữ thường'], ['Tt', 'dau', 'Viết Hoa Đầu Từ']].forEach(([t, v, tt]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.title = tt; b.setAttribute('aria-pressed', String(g.hoa === v)); b.onclick = () => { luuHoanTac(); if (g.hoa === v) delete g.hoa; else g.hoa = v; veProp(); veKhung(); }; grp2.appendChild(b); });
  const wrap = el('div', 'ccGrps'); wrap.appendChild(grp); wrap.appendChild(grp2); kieu.appendChild(wrap); bas.appendChild(kieu);
  const fMau = ccHang(kc, 'Màu chữ'); if (fMau) bas.appendChild(fMau);
  ['Chuyển màu (gradient)', 'Màu thứ hai', 'Hướng chuyển màu'].forEach(t => { const f = ccHang(kc, t); if (f) bas.appendChild(f); });
  const gc = ccHang(kc, 'Giãn chữ'), gd = ccHang(kc, 'Giãn dòng'); if (gc) { gc.firstElementChild.textContent = 'Ký tự'; bas.appendChild(gc); } if (gd) { gd.firstElementChild.textContent = 'Dòng'; bas.appendChild(gd); }
  const can = el('label'); can.appendChild(el('span', null, 'Căn lề')); const cg = el('div', 'ccGrp'); if (row) [...row.children].forEach(b => { if (/[⇤↔⇥]/.test(b.textContent)) cg.appendChild(b); });
  const fDoc = ccHang(kc, 'Chữ dọc'); if (fDoc) { const cb = fDoc.querySelector('input'); const b = el('button', 'btn nho', '↕'); b.type = 'button'; b.title = 'Chữ dọc'; b.setAttribute('aria-pressed', String(cb.checked)); b.onclick = () => { cb.checked = !cb.checked; if (cb.onchange) cb.onchange(); b.setAttribute('aria-pressed', String(cb.checked)); }; cg.appendChild(b); fDoc.classList.add('anCC'); }
  can.appendChild(cg); bas.appendChild(can); if (row) row.remove();
  const bTde = kc.querySelector(':scope > b'); kc.insertBefore(bas, bTde ? bTde.nextSibling : kc.firstChild);
  // Kiểu có sẵn: Aa theo từng mẫu chữ (chỉ áp kiểu, không đổi nội dung / vị trí / hoạt ảnh)
  const ps = el('div', 'ccPreset'); ps.appendChild(el('b', 'ccTde', 'Kiểu có sẵn')); const luoi = el('div', 'luoi');
  const none = el('button', 'the0'); none.type = 'button'; none.title = 'Bỏ kiểu (chữ trắng, không viền)'; none.textContent = '⊘'; none.onclick = () => { luuHoanTac(); CC2_KIEU_KEYS.forEach(k => delete g[k]); g.mau = '#ffffff'; g.nen = 'khong'; veProp(); veKhung(); }; luoi.appendChild(none);
  (typeof MAU_CHU !== 'undefined' ? MAU_CHU : []).forEach(([ten, st]) => { if (!st) return; const b = el('button', 'the'); b.type = 'button'; b.title = ten; b.appendChild(theChuMau(Object.assign({}, st, { text: 'Aa' }))); b.onclick = () => { luuHoanTac(); const k2 = Object.assign({}, st); ['text', 'phu', 'x', 'y', 'bd', 'kt', 'kieu', 'co', 'hu', 'ra', 'lap', 'dVao', 'dRa', 'can'].forEach(k => delete k2[k]); CC2_KIEU_KEYS.forEach(k => delete g[k]); Object.assign(g, JSON.parse(JSON.stringify(k2))); veProp(); veKhung(); }; luoi.appendChild(b); });
  ps.appendChild(luoi); const them = el('button', 'them', 'Xem thêm ▾'); them.type = 'button'; them.onclick = () => { luoi.classList.toggle('mo'); them.textContent = luoi.classList.contains('mo') ? 'Thu gọn ▴' : 'Xem thêm ▾'; }; ps.appendChild(them); bas.after(ps);
  // các mục gập
  const sec = (ten, rows, opt) => { const d = el('div', 'ccSec'); rows.filter(Boolean).forEach(r => d.appendChild(r)); ccNhom(d, ten, opt); kc.appendChild(d); return d; };
  ['Vị trí ngang', 'Vị trí dọc'].forEach(t => { const f = ccHang(ha, t); if (f) f.classList.add('anCC'); });   // thay bằng hàng có keyframe bên dưới
  if (g.x == null) g.x = 0.5; if (g.y == null) g.y = 0.32;
  const tmp = el('div'); oTruotKf(tmp, 'Phóng to', 0.2, 3, 0.01, 'g', g, 'sc', v => Math.round(v * 100) + '%'); oTruotKf(tmp, 'Vị trí ngang', 0.02, 0.98, 0.005, 'g', g, 'x', pct); oTruotKf(tmp, 'Vị trí dọc', 0.03, 0.97, 0.005, 'g', g, 'y', pct); oTruotKf(tmp, 'Xoay', -180, 180, 1, 'g', g, 'xoay', v => Math.round(v) + '°'); const rMo = oTruotKf(tmp, 'Độ mờ', 0, 1, 0.01, 'g', g, 'mo', v => Math.round(v * 100) + '%'); rMo.dataset.md = 1;
  const [lSc, vx, vy, lXoay, lMo] = [...tmp.children]; lSc.firstElementChild.textContent = 'Tỉ lệ'; vx.firstElementChild.textContent = 'Vị trí X'; vy.firstElementChild.textContent = 'Vị trí Y';
  const tmpK = el('div'); veKeyframeDieuKhien(tmpK, 'g', g); const nk = tmpK.firstElementChild; if (nk) { nk.classList.remove('nhom2'); nk.classList.add('ccSec'); const bk = nk.querySelector(':scope > b'); if (bk) bk.remove(); }
  const canKhung = el('label'); canKhung.appendChild(el('span', null, 'Căn vào khung')); const ck = el('div', 'ccGrp'); [['⇤', () => { g.x = 0.12; }, 'Sát trái'], ['⇹', () => { g.x = 0.5; }, 'Giữa ngang'], ['⇥', () => { g.x = 0.88; }, 'Sát phải'], ['⤒', () => { g.y = 0.1; }, 'Sát trên'], ['⇳', () => { g.y = 0.5; }, 'Giữa dọc'], ['⤓', () => { g.y = 0.88; }, 'Sát dưới']].forEach(([t, f, tt]) => { const b = el('button', 'btn nho', t); b.type = 'button'; b.title = tt; b.onclick = () => { luuHoanTac(); f(); veKhung(); veProp(); }; ck.appendChild(b); }); canKhung.appendChild(ck);
  sec('Biến đổi', [lSc, vx, vy, lXoay, canKhung]); if (nk) { ccNhom(nk, 'Keyframe'); kc.appendChild(nk); }
  const htRows = ht ? [...ht.querySelectorAll(':scope > label, :scope > .row, :scope > .quota')] : []; sec('Hoà trộn', [...htRows, lMo]); if (ht) ht.remove();
  const nenSel = ccHang(kc, 'Nền chữ'); const nenV = g.nen || 'vien'; const datNen = v => { if (!nenSel) return; const sl = nenSel.querySelector('select'); sl.value = v; if (sl.onchange) sl.onchange(); }; if (nenSel) nenSel.classList.add('anCC');
  sec('Viền', [ccHang(kc, 'Màu viền'), ccHang(kc, 'Độ dày viền')], { cb: nenV === 'vien', doi: on => datNen(on ? 'vien' : 'khong') });
  let kieuNen = null; if (nenV === 'hop' || nenV === 'hop_mau') { kieuNen = el('label'); kieuNen.appendChild(el('span', null, 'Kiểu nền')); const sl = el('select'); [['hop', 'Hộp tối'], ['hop_mau', 'Hộp màu nhấn']].forEach(([v, t]) => { const o = el('option', null, t); o.value = v; sl.appendChild(o); }); sl.value = nenV; sl.onchange = () => datNen(sl.value); kieuNen.appendChild(sl); }
  sec('Nền', [kieuNen, ccHang(kc, 'Màu hộp'), ccHang(kc, 'Bo góc'), ccHang(kc, 'Đệm')], { cb: nenV === 'hop' || nenV === 'hop_mau', doi: on => datNen(on ? 'hop' : 'khong') });
  const fSang = ccHang(kc, 'Phát sáng'); let mauSang = null; if (fSang) { fSang.classList.add('anCC'); if (g.phat_sang) { mauSang = el('label'); mauSang.appendChild(el('span', null, 'Màu phát sáng')); const i = el('input'); i.type = 'color'; i.value = /^#/.test(g.phat_sang) ? g.phat_sang : mauNhan(); i.oninput = () => { g.phat_sang = i.value; veKhung(); }; i.onchange = () => luuHoanTac(); mauSang.appendChild(i); } }
  sec('Phát sáng', [mauSang], { cb: !!g.phat_sang, doi: on => { if (!fSang) return; const cb = fSang.querySelector('input'); cb.checked = on; if (cb.onchange) cb.onchange(); } });
  sec('Bóng', ['Màu bóng', 'Độ đậm bóng', 'Độ nhoè', 'Khoảng cách', 'Góc'].map(t => ccHang(kc, t)), { cb: nenV === 'bong', doi: on => datNen(on ? 'bong' : 'khong') });
  const fCong = ccHang(kc, 'Uốn cong'); sec('Uốn cong', [fCong]);
  // dòng gợi ý trong Hoạt ảnh chữ không còn đúng chỗ (vị trí đã dời sang Biến đổi)
  if (ha) ha.querySelectorAll(':scope > .quota').forEach(q => q.remove());
}
function ccSapXepProp() {
  const ed = $('#ed'); if (!ed || !ed.classList.contains('ccw')) return; const box = $('#propChon'); if (!box) return;
  if (BM && !document.contains(BM.inp)) dongBangMau();
  try { if (P.chon && P.chon.k === 'g') { const g = P.gfx[P.chon.i]; if (g && g.kieu === 'chu') cc2Chu(box, g); } } catch (e) { console.warn('cc2Chu', e); }
  box.querySelectorAll(':scope > .nhom2').forEach(n => { if (n.querySelector(':scope > b')) ccNhom(n); });
  box.querySelectorAll('label > output').forEach(o => ccSo(o));
}
function khoiTaoCC2() {
  if (!$('#ed').classList.contains('ccw')) return; khoiTaoBangMau();
  const vePropCC2 = veProp; veProp = function () { try { if (P.chon && P.chon.k === 'g') { const g = P.gfx[P.chon.i]; if (g && g.kieu === 'chu' && P._cc2Chon !== g.id) { P._cc2Chon = g.id; if (!P.propTab || P.propTab === 'Đồ hoạ' || P.propTab === 'Video') P.propTab = 'Văn bản'; } } } catch { }   // vừa chọn một chữ → mở thẳng tab Văn bản như CapCut
    const a = document.activeElement; if (a && a.closest && a.closest('#propChon') && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|number|search)$/.test(a.type)))) { P._propCho = true; return; }   // đang gõ: không vẽ lại (mất con trỏ → phím gõ thành phím tắt); vẽ lại khi rời ô
    P._propCho = false; const r = vePropCC2.apply(this, arguments); ccSapXepProp(); return r; };
  $('#propChon').addEventListener('focusout', () => { setTimeout(() => { if (P._propCho) { const a = document.activeElement; if (a && a.closest && a.closest('#propChon') && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT')) return; veProp(); } }, 0); });
  const tabHoaCC2 = tabHoaProp; tabHoaProp = function () { const r = tabHoaCC2.apply(this, arguments); ccSapXepProp(); return r; };
}

/* ═════════ thanh điều khiển khi xem toàn màn hình (phát, giờ, tua, thoát) — như trình phát CapCut ═════════ */
function khoiTaoFsBar() {
  const k = $('.khung'); if (!k) return; let bar = null, an = 0;
  const tong = () => (typeof tongGiay === 'function' ? tongGiay() : 0) || 0;
  const ve = () => { if (!bar) return; const t = tong(); bar.querySelector('.tg').innerHTML = '<b>' + CC_TC(P.t) + '</b> / ' + CC_TC(t); const sk = bar.querySelector('input'); if (document.activeElement !== sk) sk.value = t ? Math.round(P.t / t * 1000) : 0; bar.querySelector('.play').innerHTML = P.dang ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'; };
  const hien = () => { if (!bar) return; bar.classList.add('hien'); k.classList.remove('anTro'); clearTimeout(an); an = setTimeout(() => { if (P.dang) { bar.classList.remove('hien'); k.classList.add('anTro'); } }, 2600); };
  const tao = () => { bar = el('div', 'fsBar'); bar.id = 'fsBar'; bar.innerHTML = '<button type="button" class="play" title="Phát / dừng (Space)"></button><span class="tg"></span><input type="range" min="0" max="1000" step="1" aria-label="Tua"><button type="button" class="thoat" title="Thoát toàn màn hình (Esc)">' + ic('full') + '</button>';
    bar.querySelector('.play').onclick = () => { $('#btnPlay').click(); setTimeout(ve, 50); }; bar.querySelector('.thoat').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); };
    const sk = bar.querySelector('input'); sk.oninput = () => { if (P.dang) dung(); P.t = Math.max(0, Math.min(tong(), +sk.value / 1000 * tong())); veKhung(); }; sk.onkeydown = e => e.stopPropagation(); bar.onpointerdown = e => e.stopPropagation();
    k.appendChild(bar); k.addEventListener('pointermove', hien); k.addEventListener('click', e => { if (e.target === $('#cv')) { $('#btnPlay').click(); setTimeout(ve, 50); } }); ve(); hien(); };
  document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement === k) { if (!bar) tao(); else { ve(); hien(); } } else if (bar) { bar.remove(); bar = null; k.classList.remove('anTro'); clearTimeout(an); } });
  const datTgFs = datTg; datTg = function () { const r = datTgFs.apply(this, arguments); if (bar) ve(); return r; };
}

/* ═════════ keyframe cho chữ / sticker / đồ hoạ: nội suy sc · x · y · xoay · mo khi vẽ (xem trước, xuất, điện thoại dùng chung veDoHoa) ═════════ */
function khoiTaoKfGfx() {
  const veDoHoaKf = veDoHoa;
  veDoHoa = function (ctx, W, H, g, t) {
    const coKfs = g.kfs && Object.keys(g.kfs).some(k => g.kfs[k] && g.kfs[k].length), coSc = g.sc != null && g.sc !== 1;
    if (!coKfs && !coSc) return veDoHoaKf.apply(this, arguments);
    const off = t - g.bd, luu = { x: g.x, y: g.y, co: g.co, xoay: g.xoay, mo: g.mo };
    const kf = ten => g.kfs && g.kfs[ten] && g.kfs[ten].length;
    if (kf('x')) g.x = giaTriKf(g, 'x', off); if (kf('y')) g.y = giaTriKf(g, 'y', off);
    const sc = giaTriKf(g, 'sc', off); if (sc !== 1) g.co = (g.co || (g.kieu === 'sticker' ? 0.16 : 0.075)) * sc;
    if (kf('xoay')) g.xoay = giaTriKf(g, 'xoay', off); if (kf('mo')) g.mo = giaTriKf(g, 'mo', off);
    try { return veDoHoaKf.apply(this, arguments); } finally { Object.keys(luu).forEach(k => { if (luu[k] === undefined) delete g[k]; else g[k] = luu[k]; }); }
  };
}

/* ═════════ đầu phát bắt dính khi tua trên thước: mép đoạn, mép chữ / overlay / âm thanh, câu nói, beat, mốc, keyframe (giữ Alt để tắt) ═════════ */
function mocBatTua() { const tCu = P.t; P.t = -1; let ds; try { ds = mocHit(); } finally { P.t = tCu; } (P.moc || []).forEach(m => ds.push(m.t)); const kf = (k, m) => { const st = batDauMuc(k, m); Object.values(m.kfs || {}).forEach(l => l.forEach(f => ds.push(st + f.t))); }; P.clips.forEach(c => kf('v', c)); P.broll.forEach(b => kf('b', b)); P.gfx.forEach(g => kf('g', g)); return ds; }
function batDauPhat(t, tat) { const ph = $('#ph'); if (tat || P.namCham === false) { if (ph) ph.classList.remove('bat'); return t; } const ng = 7 / PX(); let best = null; for (const m of mocBatTua()) { const d = Math.abs(m - t); if (d < ng && (best == null || d < Math.abs(best - t))) best = m; } if (ph) ph.classList.toggle('bat', best != null); return best == null ? t : Math.max(0, Math.min(tongGiay(), best)); }

/* ═════════ Tab Văn bản kiểu CapCut: Thêm chữ · Của tôi · Hiệu ứng chữ · Mẫu chữ động · Phụ đề tự động · Phụ đề từ file (nhập / xuất) ═════════ */
const CHU_MUC = [['them', 'Thêm chữ'], ['toi', 'Của tôi'], ['hieu', 'Hiệu ứng chữ'], ['mau', 'Mẫu chữ động'], ['tudong', 'Phụ đề tự động'], ['tep', 'Phụ đề từ file']];
function moChuMuc(id) { const pane = $('[data-pane="chu"]'); if (!pane || !pane.querySelector('.snav')) return; P.chuMuc = id; pane.querySelectorAll('.snav button').forEach(b => b.classList.toggle('on', b.dataset.muc === id)); pane.querySelectorAll('.snoi > section').forEach(sx => { sx.hidden = sx.dataset.muc !== id; }); if (id === 'toi') veFontToi(); try { localStorage.setItem('dv_chuMuc', id); } catch { } }
function veFontToi() { const box = $('#fontToiDs'); if (!box) return; box.innerHTML = ''; const ds = Object.entries(FONT_CSS).filter(([id]) => id.startsWith('f_')); if (!ds.length) { box.appendChild(el('div', 'quota', 'Chưa có font riêng. Bấm "＋ Font" để thêm .ttf / .otf / .woff2 (lưu trong trình duyệt, dùng cho mọi dự án).')); return; } ds.forEach(([id, css]) => { const b = el('button', 'fontThe'); b.type = 'button'; b.style.fontFamily = css; b.textContent = css.replace(/"/g, ''); b.title = 'Thêm chữ dùng font này'; b.onclick = () => { $('#btnThemChu').click(); const g = P.gfx[P.gfx.length - 1]; if (g) { g.font = id; veKhung(); veProp(); } }; box.appendChild(b); }); }
function khoiTaoVanBanCC() {
  const pane = $('[data-pane="chu"]'); if (!pane || !$('#ed').classList.contains('ccw') || pane.querySelector('.snav')) return;
  const cu = [...pane.children]; const nav = el('div', 'snav'), noi = el('div', 'snoi'), sec = {};
  CHU_MUC.forEach(([id, ten]) => { const b = el('button', null, ten); b.type = 'button'; b.dataset.muc = id; b.onclick = () => moChuMuc(id); nav.appendChild(b); const sx = el('section'); sx.dataset.muc = id; sx.hidden = true; noi.appendChild(sx); sec[id] = sx; });
  pane.appendChild(nav); pane.appendChild(noi);   // gắn vào trang trước để $('#…') bên dưới tìm thấy
  // Thêm chữ
  const hangThem = cu.find(x => x.querySelector && x.querySelector('#btnThemChu')); const o = el('button', 'theChuMacDinh'); o.type = 'button'; o.innerHTML = '<span>Chữ mặc định</span>'; o.title = 'Thêm chữ tại đầu phát'; o.onclick = () => $('#btnThemChu').click(); sec.them.appendChild(o); if (hangThem) sec.them.appendChild(hangThem); sec.them.appendChild(el('div', 'quota', 'Bấm đúp chữ trên khung xem để sửa · kéo để đặt chỗ · Enter xuống dòng trong ô chữ.'));
  // Của tôi: font riêng
  const fontIn = $('#khoFontIn'); const lf = fontIn ? fontIn.closest('label') : null; sec.toi.appendChild(el('h3', 'pt', 'Font của bạn')); const hf = el('div', 'row'); if (lf) hf.appendChild(lf); sec.toi.appendChild(hf); const fd = el('div', 'fontToi'); fd.id = 'fontToiDs'; sec.toi.appendChild(fd);
  if (fontIn) { const cu2 = fontIn.onchange; fontIn.onchange = async e => { if (cu2) await cu2.call(fontIn, e); veFontToi(); }; }
  // Hiệu ứng chữ: tìm, nhóm, lưới mẫu chữ (mọi thứ còn lại của bảng cũ)
  cu.forEach(x => { if (x !== hangThem && x.parentNode === pane) sec.hieu.appendChild(x); });
  // Mẫu chữ động
  sec.mau.appendChild(el('h3', 'pt', 'Chữ có hoạt ảnh sẵn')); const lm = el('div', 'mauLuoi mauDong');
  [['Bật ra', { hu: 'pop' }], ['Gõ chữ', { hu: 'go' }], ['Trượt vào', { hu: 'truot' }], ['Nổi lên', { hu: 'len' }], ['Phóng to vào', { hu: 'phong' }], ['Xoay vào', { hu: 'xoay' }], ['Nhoè vào', { hu: 'nhoe' }], ['Hiện dần', { hu: 'mo' }], ['Nảy liên tục', { hu: 'nay' }], ['Lắc', { hu: 'lac' }], ['Nhịp to nhỏ', { hu: 'pop', lap: 'nhip' }], ['Nhấp nháy', { hu: 'mo', lap: 'nhap_nhay' }], ['Thu nhỏ khi ra', { hu: 'pop', ra: 'thu' }], ['Rơi xuống khi ra', { hu: 'len', ra: 'roi' }]].forEach(([ten, st]) => { const b = el('button'); b.type = 'button'; theHoa(b, '<span class="mau dong">Aa</span>', ten); b.onclick = () => { $('#btnThemChu').click(); const g = P.gfx[P.gfx.length - 1]; if (g) { Object.assign(g, st); veKhung(); veProp(); } }; lm.appendChild(b); });
  sec.mau.appendChild(lm); sec.mau.appendChild(el('div', 'quota', 'Chỉnh thêm ở tab Hoạt ảnh của bảng thuộc tính. Đồ hoạ động nhiều lớp nằm ở mục Đồ hoạ bên trái.'));
  // Phụ đề tự động (như CapCut Auto captions)
  const NN = [['vi', 'Tiếng Việt'], ['en', 'English'], ['zh', '中文'], ['ko', '한국어'], ['ja', '日本語'], ['th', 'ไทย'], ['id', 'Bahasa Indonesia'], ['auto', 'Tự nhận']];
  const td = sec.tudong; td.innerHTML = '<h3 class="pt">Ngôn ngữ nói</h3><select id="pdNgonNguNoi"></select><h3 class="pt">Phụ đề song ngữ</h3><select id="pdSongNguChon"><option value="">Không</option></select><div class="quota">AI nghe từng từ trong footage rồi tạo phụ đề karaoke; chọn ngôn ngữ dịch để có dòng thứ hai dưới phụ đề.</div><div class="quota" id="pdTuDongTt"></div><div class="snoiDay"><label class="pdXoa"><input type="checkbox" id="pdXoaCu"> Xoá phụ đề hiện có</label><span class="gian"></span><button class="btn xanh" id="btnTaoPd" type="button">Tạo phụ đề</button></div>';
  const sNN = $('#pdNgonNguNoi'); NN.forEach(([v, t]) => { const op = el('option', null, t); op.value = v; sNN.appendChild(op); }); sNN.value = P.pdNgonNguNoi || 'vi'; sNN.onchange = () => { P.pdNgonNguNoi = sNN.value; };
  const sSN = $('#pdSongNguChon'), goc = $('#pdNgonNgu'); if (goc) [...goc.options].forEach(op => { const o2 = el('option', null, op.textContent); o2.value = op.value; sSN.appendChild(o2); });
  $('#btnTaoPd').onclick = async () => { const bt = $('#btnTaoPd'), tt = $('#pdTuDongTt'); const vids = P.srcs.filter(z => z.loai === 'video'); if (!vids.length) { toast('Thêm footage trước đã'); return; } if ($('#pdXoaCu').checked && P.pdNgoai) { luuHoanTac(); P.pdNgoai = null; if ($('#btnBoSrt')) $('#btnBoSrt').hidden = true; } const chua = vids.filter(z => z.tt === 'san_sang' || (z.tt === 'loi' && z.giay)); bt.disabled = true; try { for (const z of chua) { tt.textContent = 'Đang nghe ' + z.ten + '…'; await hieu(z); } } finally { bt.disabled = false; } const pd = $('#phuDe'); if (pd && !pd.checked) { pd.checked = true; pd.dispatchEvent(new Event('change')); } if (sSN.value && goc) { goc.value = sSN.value; const bd = $('#btnDichPd'); if (bd) bd.click(); } const n = cumTu().length; tt.textContent = n ? 'Đã có ' + n + ' cụm phụ đề · chỉnh kiểu, sửa câu ở mục Phụ đề bên trái.' : 'Chưa nhận được lời nói: kiểm tra footage có tiếng, hoặc bấm Hiểu footage ở Media.'; veTl(); veKhung(); };
  // Phụ đề từ file: nhập + xuất
  const tp = sec.tep; tp.innerHTML = '<h3 class="pt">Nhập</h3><div class="row"><label class="btn nho" style="cursor:pointer">📥 Nhập .srt / .vtt / .lrc<input type="file" id="srtIn2" accept=".srt,.vtt,.lrc,text/plain" hidden></label><span class="quota" style="margin:0">Thay phụ đề tự sinh bằng file của bạn.</span></div><h3 class="pt">Xuất phụ đề</h3><div class="row"><button class="btn nho" id="btnXuatSrt2" type="button">.srt</button><button class="btn nho" id="btnXuatVtt" type="button">.vtt</button><button class="btn nho" id="btnXuatTxt" type="button">.txt lời thoại</button><button class="btn nho ghost" id="btnChepPd" type="button">Chép lời thoại</button></div><div class="quota">Mang sang CapCut, Premiere, YouTube hoặc dán vào mô tả video. Đang bật song ngữ thì .srt / .vtt kèm dòng dịch.</div>';
  $('#srtIn2').onchange = e => { const g0 = $('#srtIn'); if (!g0) return; const dt = new DataTransfer(); [...e.target.files].forEach(f => dt.items.add(f)); g0.files = dt.files; g0.dispatchEvent(new Event('change')); e.target.value = ''; };
  const canLoi = () => { if (!cumTu().length) { toast('Chưa có phụ đề: bấm Tạo phụ đề hoặc Hiểu footage trước'); return false; } return true; };
  const loiThoai = () => cumTu().map(c => c.tu.map(t => t.w).join(' ')).join('\n');
  $('#btnXuatSrt2').onclick = () => $('#btnSrt').click();
  $('#btnXuatVtt').onclick = () => { if (!canLoi()) return; luuText(tenAscii('phu-de') + '.vtt', 'WEBVTT\n\n' + taoSrt().replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2'), 'text/vtt;charset=utf-8'); toast('Đã xuất .vtt'); };
  $('#btnXuatTxt').onclick = () => { if (!canLoi()) return; luuText(tenAscii('loi-thoai') + '.txt', loiThoai()); toast('Đã xuất .txt'); };
  $('#btnChepPd').onclick = async () => { if (!canLoi()) return; try { await navigator.clipboard.writeText(loiThoai()); toast('Đã chép lời thoại'); } catch { toast('Trình duyệt chặn chép, dùng nút .txt'); } };
  let luu = 'them'; try { luu = localStorage.getItem('dv_chuMuc') || 'them'; } catch { } moChuMuc(CHU_MUC.some(([id]) => id === luu) ? luu : 'them');
}

/* ═════════ Bảng chọn font (thay <select> hệ điều hành): xem trước từng font, tìm, nhóm Mặc định · Kho · Của bạn ═════════ */
let BF = null;
function dongBangFont() { if (BF) { BF.hop.remove(); BF = null; } }
function tenFont(id) { return (FONT_CSS[id] || '').replace(/"/g, '') || id; }
function nhomFont(id) { if (id.startsWith('f_')) return 'Của bạn'; if (typeof FONT_DS !== 'undefined' && FONT_DS.some(([k]) => k === id)) return 'Mặc định'; return 'Kho'; }
function moBangFont(sel, nut) {
  dongBangFont(); const hop = el('div', 'bangFont'); hop.innerHTML = '<input type="search" class="tim" placeholder="Tìm font…" aria-label="Tìm font"><div class="ds"></div>'; $('#ed').appendChild(hop);
  const ds = hop.querySelector('.ds'), tim = hop.querySelector('.tim'); const chuan = x => (typeof khongDauKho === 'function' ? khongDauKho(x) : String(x || '').toLowerCase());
  const ve = () => { ds.innerHTML = ''; const qv = chuan(tim.value); let nhomCu = ''; Object.keys(FONT_CSS).forEach(id => { const ten = tenFont(id); if (qv && !chuan(ten).includes(qv)) return; const nh = nhomFont(id); if (nh !== nhomCu) { nhomCu = nh; ds.appendChild(el('b', 'nhom', nh)); } const b = el('button', 'f' + (sel.value === id ? ' on' : '')); b.type = 'button'; b.style.fontFamily = FONT_CSS[id]; b.innerHTML = '<span class="ten"></span><span class="mau">Aa Bb 123 · Tiếng Việt có dấu</span>'; b.querySelector('.ten').textContent = ten; b.onclick = () => { if (![...sel.options].some(o => o.value === id)) { const op = el('option', null, ten); op.value = id; sel.appendChild(op); } sel.value = id; if (sel.onchange) sel.onchange(); else sel.dispatchEvent(new Event('change')); if (nut) { nut.querySelector('span').textContent = ten; nut.style.fontFamily = FONT_CSS[id]; } dongBangFont(); }; ds.appendChild(b); }); if (!ds.children.length) ds.appendChild(el('div', 'quota', 'Không có font nào khớp')); };
  tim.oninput = ve; tim.onkeydown = e => { e.stopPropagation(); if (e.key === 'Escape') dongBangFont(); }; ve();
  const r = (nut || sel).getBoundingClientRect(); hop.style.visibility = 'hidden'; requestAnimationFrame(() => { const hr = hop.getBoundingClientRect(); let x = r.left, y = r.bottom + 6; if (x + hr.width > innerWidth - 8) x = Math.max(8, innerWidth - 8 - hr.width); if (y + hr.height > innerHeight - 8) y = Math.max(8, r.top - hr.height - 6); hop.style.left = x + 'px'; hop.style.top = y + 'px'; hop.style.visibility = ''; const on = ds.querySelector('.on'); if (on) on.scrollIntoView({ block: 'center' }); tim.focus(); });
  BF = { hop, sel };
}
function ganBangFont(sel) {
  if (!sel || sel.dataset.bangFont) return; sel.dataset.bangFont = 1; sel.classList.add('anCC');
  const nut = el('button', 'fontNut'); nut.type = 'button'; nut.title = 'Chọn font'; nut.innerHTML = '<span></span><i>▾</i>'; const cap = () => { nut.querySelector('span').textContent = tenFont(sel.value) || 'Font'; nut.style.fontFamily = FONT_CSS[sel.value] || ''; }; cap(); nut.onclick = e => { e.preventDefault(); if (BF && BF.sel === sel) dongBangFont(); else moBangFont(sel, nut); };
  sel.addEventListener('change', cap); sel.parentNode.insertBefore(nut, sel.nextSibling);
}
function khoiTaoBangFont() {
  if (!$('#ed').classList.contains('ccw')) return;
  document.addEventListener('pointerdown', e => { if (BF && !e.target.closest('.bangFont') && !e.target.closest('.fontNut')) dongBangFont(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && BF) dongBangFont(); }, true);
  const f0 = $('#font'); if (f0) ganBangFont(f0);
}

/* ═════════ Lớp hiệu ứng / bộ lọc trên dòng thời gian (kéo thả hoặc ＋ Lớp, như CapCut) + xem thử khi rê chuột lên ô hiệu ứng / bộ lọc / chuyển cảnh ═════════ */
GX.hieu_ung = { ic: '✨', ten: 'Lớp hiệu ứng', dai: 3 }; GX.bo_loc = { ic: '🎞', ten: 'Lớp bộ lọc', dai: 3 };
function laLopFx(g) { return !!g && (g.kieu === 'hieu_ung' || g.kieu === 'bo_loc'); }
function apHuKhung(ctx, W, H, k, off, muc) { try { const [, im] = apHuKho({ hu2: k, huMuc: muc }, { w: W, h: H }, ctx.canvas, off); if (im && im !== ctx.canvas) { ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.drawImage(im, 0, 0, W, H); ctx.restore(); } } catch (e) { } }
function apLocKhung(ctx, W, H, k, muc) { try { const id = 'kho:' + String(k).replace(/^kho:/, ''); if (!dangKyLutKho(id)) return; const [, im] = chinhMau({ lut: id, lutMuc: muc }, { w: W, h: H }, ctx.canvas, 0); if (im && im !== ctx.canvas) { ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.drawImage(im, 0, 0, W, H); ctx.restore(); } } catch (e) { } }
function tenFx(loai, k) { if (loai === 'bo_loc') { const m = KHO_OK && KHO.boLoc.find(x => x.id === String(k).replace(/^kho:/, '')); return m ? m.ten : String(k); } return HIEU_UNG[k] || String(k); }
function themLopHieuUng(k, t, loai) {
  loai = loai || 'hieu_ung'; if (t == null) t = P.t; const tong = Math.max(tongGiay(), 0.5), bd = Math.max(0, Math.min(t, tong - 0.5)), kt = Math.min(tong, bd + 3);
  luuHoanTac(); const g = { id: uid(), kieu: loai, bd: +bd.toFixed(2), kt: +kt.toFixed(2), text: tenFx(loai, k), phu: '', x: -5, y: -5, k, muc: 1, boVao: true, boRa: true };
  P.gfx.push(g); P.chon = { k: 'g', i: P.gfx.length - 1 }; veTl(); veKhung(); veProp(); toast('Đã thêm lớp “' + g.text + '” ' + fmt1(g.bd) + '–' + fmt1(g.kt) + 's · kéo hai đầu để đổi độ dài'); return g;
}
function veFxLop(ctx, W, H, g, t) { const tl = t - g.bd, muc = g.muc == null ? 1 : +g.muc; if (muc <= 0.001) return; /* không mờ dần hai đầu: hiệu ứng có mặt là áp đủ như CapCut */ if (g.kieu === 'bo_loc') apLocKhung(ctx, W, H, g.k, muc); else apHuKhung(ctx, W, H, g.k, tl, muc); }
/* xem thử khi rê: hiệu ứng / bộ lọc áp lên cả khung; chuyển cảnh chạy vòng lặp giữa 2 khung hình thu nhỏ */
let XT = { loai: null, k: null, vong: 0, chuyen: null, khoa: false };
function xemThuFx(loai, k) { XT.loai = loai; XT.k = k; if (!P.dang) veKhung(); }
function tatXemThu() { XT.loai = null; XT.k = null; if (XT.chuyen) { XT.chuyen = null; } if (!P.dang) veKhung(); }
function anhThumb(s) { return new Promise(ok => { if (!s || !s.thumb) return ok(null); if (s._thImg && s._thImg.complete) return ok(s._thImg); const im = new Image(); im.onload = () => { s._thImg = im; ok(im); }; im.onerror = () => ok(null); im.src = s.thumb; }); }
function khungPhu(im, W, H, lat) { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, W, H); if (im) { const k = Math.max(W / im.width, H / im.height), w = im.width * k, h = im.height * k; g.save(); if (lat) { g.translate(W, 0); g.scale(-1, 1); } g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); g.restore(); } return c; }
async function xemThuChuyen(kieu) {
  if (!P.clips.length) return; const { clip } = viTri(P.t), i = clip < 0 ? 0 : clip, c1 = P.clips[i], c2 = P.clips[i + 1] || null; const s1 = srcCua(c1.src), s2 = c2 ? srcCua(c2.src) : null;
  const vong = ++XT.vong; try { await gltNap(); } catch { } const [im1, im2] = await Promise.all([anhThumb(s1), anhThumb(s2 || s1)]); if (XT.vong !== vong) return;
  const W = cv.width, H = cv.height, tu = khungPhu(im1, W, H, false), den = khungPhu(im2, W, H, !c2); XT.chuyen = { kieu, t0: performance.now() };
  const buoc = () => { if (!XT.chuyen || XT.chuyen.kieu !== kieu || XT.vong !== vong) return; const p = ((performance.now() - XT.chuyen.t0) % 1600) / 1600; const pp = p < 0.15 ? 0 : p > 0.85 ? 1 : (p - 0.15) / 0.7; let g = null; try { g = gltVe(kieu, tu, den, pp, W, H); } catch { } cx.clearRect(0, 0, W, H); if (g) cx.drawImage(g, 0, 0, W, H); else { cx.drawImage(tu, 0, 0); cx.globalAlpha = pp; cx.drawImage(den, 0, 0); cx.globalAlpha = 1; } requestAnimationFrame(buoc); };
  requestAnimationFrame(buoc);
}
function ganXemThu(box, loai, lay) {
  if (!box || box.dataset.xemThu) return; box.dataset.xemThu = 1; box.classList.add('coXemThu');
  box.addEventListener('pointerover', e => { if (XT.khoa) return; const b = e.target.closest('button[data-k],button[data-kho]'); if (!b || !box.contains(b) || P.dang) return; const k = lay(b); if (!k) return; if (loai === 'chuyen') { if (!XT.chuyen || XT.chuyen.kieu !== k) { XT.chuyen = null; xemThuChuyen(k); } } else xemThuFx(loai, k); });
  box.addEventListener('pointerleave', () => { XT.khoa = false; tatXemThu(); });
  box.addEventListener('click', () => { XT.khoa = true; tatXemThu(); });   // bấm áp thật rồi thì khoá xem thử tới khi rời lưới, khung hiện đúng trạng thái dự án
  if (!document._xemThuDon) { document._xemThuDon = 1; document.addEventListener('pointerover', e => { const t = e.target; if (XT.loai || XT.chuyen) { if (!t || !t.closest || !t.closest('.coXemThu')) { XT.khoa = false; tatXemThu(); } } }, true); }   // con trỏ sang chỗ khác (hoặc lưới vẽ lại dưới con trỏ đứng yên) → bỏ xem thử
}
function ganKeoFx(box, loai, lay) {
  if (!box || box.dataset.keoFx) return; box.dataset.keoFx = 1;
  const trang = () => box.querySelectorAll('button[data-k],button[data-kho]').forEach(b => { if (b.dataset.fxOk) return; b.dataset.fxOk = 1; const k = lay(b); if (!k || k === 'khong') return; b.draggable = true; b.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', JSON.stringify({ fx: k, loai })); e.dataTransfer.effectAllowed = 'copy'; }); const them = el('span', 'fxThem'); them.textContent = '＋ Lớp'; them.title = 'Thêm lớp ' + (loai === 'bo_loc' ? 'bộ lọc' : 'hiệu ứng') + ' 3 giây tại đầu phát (hoặc kéo thả xuống dòng thời gian)'; them.onclick = ev => { ev.stopPropagation(); ev.preventDefault(); themLopHieuUng(k, P.t, loai); }; b.appendChild(them); });
  trang(); new MutationObserver(trang).observe(box, { childList: true });
}
function khoiTaoLopFx() {
  // vẽ: lớp hiệu ứng áp lên những gì đã vẽ bên dưới nó (đúng thứ tự lớp như CapCut)
  const veDoHoaFx = veDoHoa; veDoHoa = function (ctx, W, H, g, t) { if (laLopFx(g)) { veFxLop(ctx, W, H, g, t); return; } return veDoHoaFx.apply(this, arguments); };
  // xem thử: áp lên khung xem trước sau khi vẽ xong mọi thứ
  const veFrameFx = veFrame; veFrame = function (ctx, W, H, t, snap) { const r = veFrameFx.apply(this, arguments); if (XT.loai && ctx === cx) { if (XT.loai === 'bo_loc') apLocKhung(ctx, W, H, XT.k, 1); else apHuKhung(ctx, W, H, XT.k, t, 1); } return r; };
  // dòng thời gian: màu riêng cho lớp hiệu ứng
  const veTlFx = veTl; veTl = function () { const r = veTlFx.apply(this, arguments); $$('#tlIn .item.g').forEach(d => { const g = P.gfx[+d.dataset.i]; if (laLopFx(g)) d.classList.add('fx'); }); return r; };
  // thả từ bảng hiệu ứng / bộ lọc xuống dòng thời gian
  const tin = $('#tlIn'); tin.addEventListener('drop', e => { let o = null; try { o = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { } if (!o || !o.fx) return; e.preventDefault(); e.stopImmediatePropagation(); const r = tin.getBoundingClientRect(); themLopHieuUng(o.fx, Math.max(0, (e.clientX - r.left - LB) / PX()), o.loai); }, true);
  // bảng thuộc tính của lớp
  const vePropFx = veProp; veProp = function () { const r = vePropFx.apply(this, arguments); try { const g = P.chon && P.chon.k === 'g' ? P.gfx[P.chon.i] : null; if (!laLopFx(g)) return r; const box = $('#propChon'); if (!box || box.querySelector('.nhomFx')) return r;
    [...box.children].forEach(x => { if (x.tagName === 'LABEL' && x.classList.contains('full')) x.classList.add('anCC'); if (x.classList.contains('nhom2')) { const b = x.querySelector(':scope > b'); if (b && /Bám theo lời nói|Hoà trộn/.test(b.textContent)) x.remove(); } });
    const n = el('div', 'nhom2 nhomFx'); n.appendChild(el('b', null, g.kieu === 'bo_loc' ? 'Lớp bộ lọc' : 'Lớp hiệu ứng'));
    const ds = g.kieu === 'bo_loc' ? KHO.boLoc.map(m => [m.id, m.ten]) : Object.keys(HIEU_UNG).filter(k => k !== 'khong').map(k => [k, HIEU_UNG[k]]);
    oChon(n, g.kieu === 'bo_loc' ? 'Bộ lọc' : 'Hiệu ứng', ds, g.kieu === 'bo_loc' ? String(g.k).replace(/^kho:/, '') : g.k, v => { g.k = v; g.text = tenFx(g.kieu, v); });
    oTruot(n, 'Cường độ', 0, 1, 0.01, g.muc == null ? 1 : g.muc, pct, v => { g.muc = v; }).dataset.md = 1;
    n.appendChild(el('div', 'quota', 'Lớp này áp lên mọi thứ nằm dưới nó trên dòng thời gian. Kéo hai đầu để đổi độ dài, ⬆⬇ Lớp để đổi thứ tự.'));
    const neo = box.querySelector(':scope > .nhom2'); box.insertBefore(n, neo || null); if (typeof ccSapXepProp === 'function') ccSapXepProp(); } catch (e) { console.warn('propFx', e); } return r; };
  // gắn xem thử + kéo thả + ＋ Lớp cho các lưới
  const gan = () => { tatXemThu(); ganXemThu($('#huLuoi'), 'hieu_ung', b => b.dataset.k); ganKeoFx($('#huLuoi'), 'hieu_ung', b => b.dataset.k); ganXemThu($('#khoLocLuoi'), 'bo_loc', b => b.dataset.kho); ganKeoFx($('#khoLocLuoi'), 'bo_loc', b => b.dataset.kho); ganXemThu($('#chuyenLuoi'), 'chuyen', b => b.dataset.k); }; gan();
  // mở tab Hiệu ứng / Bộ lọc: ô xem trước vẽ lại theo khung hình hiện tại
  $$('.etabs button[data-tab]').forEach(b => { if (b.dataset.tab === 'hieu' || b.dataset.tab === 'loc') b.addEventListener('click', () => { khoAnhMau = null; try { if (b.dataset.tab === 'hieu') veKhoHieuUng(); else veKhoLoc(); } catch { } gan(); }); });
}

/* ═════════ Kho trực tuyến theo chủ đề (như CapCut): nhạc nền + hiệu ứng âm từ Openverse (CC, dùng thương mại), nhãn dán động Noto Emoji (Google, Apache 2.0) ═════════ */
const OV_API = 'https://api.openverse.org/v1/audio/';
function ovNhan(r) { return { ten: r.title || 'Không tên', tac_gia: r.creator || '', giay: Math.round((r.duration || 0) / 100) / 10, giay_phep: String(r.license || '').toUpperCase() + (r.license_version ? ' ' + r.license_version : ''), link: r.url, nguon: r.source || r.provider || 'openverse', trang: r.foreign_landing_url || '', thumb: r.thumbnail || '' }; }
async function ovTim(loai, q, trang) {
  const key = 'ov:' + loai + ':' + q + ':' + (trang || 1); try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.luc < 3600e3) return c.ds; } catch { }
  const u = OV_API + '?' + new URLSearchParams({ q, source: loai === 'nhac' ? 'jamendo' : 'freesound', license_type: 'commercial', page_size: '20', page: String(trang || 1) });   // Jamendo = nhạc, Freesound = hiệu ứng (trường category của Openverse thưa, lọc theo nguồn cho nhiều kết quả)
  const r = await fetch(u, { headers: { Accept: 'application/json' } }); if (r.status === 429) throw new Error('Openverse giới hạn 20 lượt/phút · chờ một lát'); if (!r.ok) throw new Error('Openverse ' + r.status);
  const j = await r.json(); const ds = (j.results || []).filter(x => x.url).map(ovNhan); try { sessionStorage.setItem(key, JSON.stringify({ luc: Date.now(), ds })); } catch { } return ds;
}
async function taiAmTrucTuyen(link, ten, mime, quaMc) { if (!quaMc) { try { const r = await fetch(link, { mode: 'cors' }); if (!r.ok) throw 0; const b = await r.blob(); if (b.size > 2000 && !/text\/html/.test(b.type)) return new File([b], ten, { type: b.type && b.type !== 'application/octet-stream' ? b.type : mime }); } catch { } } return taiQuaMc(link, ten, mime); }   // host có CORS (Freesound) tải thẳng; lỗi / bị chặn / trả HTML thì qua máy chủ Cloudflare
async function napAmTrucTuyen(s, ten) { let f = await taiAmTrucTuyen(s.link, ten, 'audio/mpeg'); const kho = 'f:' + uid(); try { await am3NapBlob(kho, f); } catch (e) { f = await taiAmTrucTuyen(s.link, ten, 'audio/mpeg', true); await am3NapBlob(kho, f); } return { f, kho }; }   // giải mã lỗi (file tải thẳng bị chặn trả rác) → tải lại qua máy chủ
function ghiNguon(s) { P.ghiNguon = P.ghiNguon || []; if (!P.ghiNguon.some(x => x.link === s.link)) P.ghiNguon.push({ ten: s.ten, tac_gia: s.tac_gia, giay_phep: s.giay_phep, nguon: s.nguon, link: s.trang || s.link }); }
function chepGhiNguon() { const ds = P.ghiNguon || []; if (!ds.length) { toast('Chưa dùng nhạc / âm thanh nào từ kho trực tuyến'); return; } const t = ds.map(x => '“' + x.ten + '” – ' + x.tac_gia + ' (' + x.giay_phep + ', ' + x.nguon + ') ' + x.link).join('\n'); navigator.clipboard.writeText(t).then(() => toast('Đã chép ' + ds.length + ' dòng ghi nguồn · dán vào mô tả video'), () => luuText('ghi-nguon.txt', t)); }
let ovDangPhat = null;
function veOvDs(box, loai, q) {
  box.innerHTML = '<div class="quota">Đang tải…</div>';
  ovTim(loai, q).then(ds => { box.innerHTML = ''; if (!ds.length) { box.appendChild(el('div', 'quota', 'Không thấy kết quả, thử chủ đề khác.')); return; }
    ds.forEach(s => { const b = el('div', 'sfxHang ov'); b.innerHTML = '<span class="ic">' + (loai === 'nhac' ? (s.thumb ? '<img alt="" loading="lazy">' : '🎵') : '🔊') + '</span><span class="ten"><b></b><small></small></span>'; const im = b.querySelector('img'); if (im) { im.src = s.thumb; im.onerror = () => { im.replaceWith(document.createTextNode('🎵')); }; } b.querySelector('b').textContent = s.ten; b.querySelector('small').textContent = (s.tac_gia || 'Khuyết danh') + ' · ' + (s.giay >= 60 ? Math.floor(s.giay / 60) + ':' + String(Math.round(s.giay % 60)).padStart(2, '0') : fmt1(s.giay) + 's') + ' · ' + s.giay_phep;
      const nghe = el('button', 'nut'); nghe.type = 'button'; nghe.textContent = '▶'; nghe.title = 'Nghe thử'; nghe.onclick = e => { e.stopPropagation(); if (ovDangPhat && ovDangPhat.nut === nghe) { ovDangPhat.a.pause(); ovDangPhat = null; nghe.textContent = '▶'; return; } if (ovDangPhat) { ovDangPhat.a.pause(); ovDangPhat.nut.textContent = '▶'; } const a = new Audio(s.link); a.volume = 0.8; a.play().catch(() => { a.src = MC.url + '/tai?xem=1&u=' + encodeURIComponent(s.link); a.play().catch(() => toast('Không phát được, thử bấm +')); }); nghe.textContent = '■'; ovDangPhat = { a, nut: nghe }; a.onended = () => { nghe.textContent = '▶'; ovDangPhat = null; }; };
      const them = el('button', 'nut them'); them.type = 'button'; them.textContent = '+'; them.title = loai === 'nhac' ? 'Dùng làm nhạc nền (đo beat, tự hạ khi có lời)' : 'Thêm vào dòng thời gian tại đầu phát';
      them.onclick = async e => { e.stopPropagation(); them.disabled = true; them.textContent = '…'; try { const ten = (s.ten || 'am-thanh').replace(/[^\w\s-]/g, '').slice(0, 40) + '.mp3'; if (loai === 'nhac') { const f = await taiAmTrucTuyen(s.link, ten, 'audio/mpeg'); const inp = $('#nhacIn'); const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('change')); toast('Đang đặt “' + s.ten + '” làm nhạc nền…'); } else { const { kho } = await napAmTrucTuyen(s, ten); await themAm3(kho, s.ten || 'Âm thanh', 'file'); toast('Đã thêm “' + s.ten + '” tại đầu phát'); } ghiNguon(s); } catch (er) { toast('Không tải được: ' + (er && er.message || er) + ' · máy chủ Cloudflare cần bản mới để tải nguồn này'); } them.disabled = false; them.textContent = '+'; };
      if (loai === 'nhac') { const a3 = el('button', 'nut'); a3.type = 'button'; a3.textContent = '⤓'; a3.title = 'Thêm vào track âm thanh A3 tại đầu phát (thay vì làm nhạc nền)'; a3.onclick = async e => { e.stopPropagation(); a3.disabled = true; try { const { kho } = await napAmTrucTuyen(s, (s.ten || 'nhac').replace(/[^\w\s-]/g, '').slice(0, 40) + '.mp3'); await themAm3(kho, s.ten || 'Nhạc', 'file'); ghiNguon(s); toast('Đã thêm “' + s.ten + '” vào A3'); } catch (er) { toast('Không tải được: ' + (er && er.message || er)); } a3.disabled = false; }; b.appendChild(nghe); b.appendChild(a3); b.appendChild(them); } else { b.appendChild(nghe); b.appendChild(them); }
      box.appendChild(b); });
    const gn = el('div', 'quota'); gn.innerHTML = 'Nguồn: Openverse (Freesound, Jamendo, Wikimedia…) · chỉ lấy giấy phép dùng thương mại. <b>CC0</b> dùng tự do; <b>CC BY</b> cần ghi tên tác giả → nút “Chép ghi nguồn” bên dưới. Giấy phép <b>ND</b>: dùng nguyên bản, không cắt ghép nhạc.'; box.appendChild(gn);
  }).catch(e => { box.innerHTML = ''; box.appendChild(el('div', 'quota', '⚠ ' + e.message)); });
}
function veKhuOv(loai, ds, tieuDe, goiY) {
  const khu = el('div', 'khuOv'); khu.dataset.loai = loai; khu.innerHTML = '<h3 class="pt"></h3><div class="row khoHang"><input type="search" class="ovTim" placeholder=""><button class="btn nho xanh ovNut" type="button">Tìm</button></div><div class="row khoChip ovChip"></div><div class="sfxDs ovDs"></div><div class="row"><button class="btn nho ghost ovNguon" type="button">📋 Chép ghi nguồn</button></div>';
  khu.querySelector('h3').textContent = tieuDe; const tim = khu.querySelector('.ovTim'); tim.placeholder = goiY; const chip = khu.querySelector('.ovChip'), kq = khu.querySelector('.ovDs');
  let dangChon = null; const veChip = () => { chip.innerHTML = ''; ds.forEach(([ten, q]) => { const b = el('button', 'btn nho' + (dangChon === q ? ' xanh' : ''), ten); b.type = 'button'; b.onclick = () => { dangChon = q; tim.value = ''; veChip(); veOvDs(kq, loai, q); }; chip.appendChild(b); }); }; veChip();
  const timDi = () => { const q = tim.value.trim(); if (!q) return; dangChon = null; veChip(); veOvDs(kq, loai, q); }; khu.querySelector('.ovNut').onclick = timDi; tim.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') timDi(); };
  khu.querySelector('.ovNguon').onclick = chepGhiNguon; kq.appendChild(el('div', 'quota', 'Chọn một chủ đề hoặc gõ từ khoá (tiếng Anh cho nhiều kết quả hơn).'));
  return khu;
}
/* nhãn dán động Noto (Google) */
const NOTO_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/';
function veNotoLuoi(box, ma, q) { box.innerHTML = ''; q = (q || '').trim().toLowerCase(); const ds = q ? Object.values(KHO.notoNhom).flat().filter(x => (x[1] || '').includes(q) || x[0] === q) : (KHO.notoNhom[ma] || []); ds.slice(0, 240).forEach(x => { const cp = Array.isArray(x) ? x[0] : x; const b = el('button'); b.type = 'button'; b.title = 'Thêm nhãn dán động lên V3'; const t = el('div', 'the'); const im = el('img'); im.loading = 'lazy'; im.alt = ''; im.src = NOTO_URL + cp + '/512.webp'; im.onerror = () => b.remove(); t.appendChild(im); b.appendChild(t);
  b.title = (Array.isArray(x) && x[1] ? x[1] + ' · ' : '') + 'Thêm nhãn dán động lên V3'; b.onclick = async () => { b.disabled = true; try { const r = await fetch(NOTO_URL + cp + '/512.gif'); if (!r.ok) throw new Error('tải ' + r.status); const f = new File([await r.blob()], 'noto-' + cp + '.gif', { type: 'image/gif' }); await themSticker([f]); const src = P.srcs.filter(z => z.ten === f.name).pop(); if (src) { await giaiMaDong(src); veKhung(); } toast('Đã thêm nhãn dán động lên V3'); } catch (e) { toast('Không tải được: ' + e.message); } b.disabled = false; }; box.appendChild(b); }); if (!box.children.length) box.appendChild(el('div', 'quota', q ? 'Không có nhãn dán nào khớp “' + q + '” (gõ tiếng Anh: fire, heart, cat…).' : 'Không tải được nhãn dán (cần mạng).')); }
function khoiTaoKhoTrucTuyen() {
  if (!KHO_OK || !KHO.ovNhac) return;
  // Âm thanh: nhạc theo chủ đề (trước mục Nhạc nền), hiệu ứng âm theo chủ đề (đầu hộp hiệu ứng)
  const amPane = $('[data-pane="am"]'); if (amPane) { const h3Nhac = [...amPane.querySelectorAll('h3.pt')].find(x => x.textContent.trim() === 'Nhạc nền'); const khuN = veKhuOv('nhac', KHO.ovNhac, 'Nhạc theo chủ đề (miễn phí, dùng thương mại)', 'Tìm nhạc: lofi, piano, upbeat…'); if (h3Nhac) h3Nhac.parentNode.insertBefore(khuN, h3Nhac); else amPane.appendChild(khuN);
    const am3 = $('#am3Hop'); if (am3) { const h3Sfx = [...am3.querySelectorAll('h3.pt')].find(x => /Hiệu ứng âm thanh/.test(x.textContent)); const khuA = veKhuOv('am', KHO.ovAm, 'Hiệu ứng âm theo chủ đề (trực tuyến)', 'Tìm hiệu ứng: whoosh, ding, pop…'); if (h3Sfx) am3.insertBefore(khuA, h3Sfx); else am3.appendChild(khuA); } }
  // Nhãn dán động Noto
  const stPane = $('[data-pane="sticker"]'); if (stPane && KHO.notoNhom) { const khu = el('div', 'khuNoto'); khu.innerHTML = '<h3 class="pt">Nhãn dán động (Noto Emoji · Google)</h3><div class="row khoHang"><input type="search" class="notoTim" id="notoTim" placeholder="Tìm nhãn dán (tiếng Anh): fire, heart, cat, money…"></div><div class="row khoChip notoChip"></div><div class="mauLuoi khoSticker notoLuoi"></div><div class="quota">Hoạt ảnh gif nền trong suốt, dùng tự do (Apache 2.0). Bấm để thêm lên V3, kéo trên khung để đặt chỗ.</div>'; const neo = $('#emojiNhanh'); (neo ? neo.parentNode : stPane).insertBefore(khu, neo ? neo.nextSibling : null); const chip = khu.querySelector('.notoChip'), luoi = khu.querySelector('.notoLuoi'), timN = khu.querySelector('.notoTim'); const dsNhom = Object.keys(KHO.notoNhom); let cur = dsNhom[0]; timN.oninput = () => { if (timN.value.trim()) { chip.querySelectorAll('.btn').forEach(x => x.classList.remove('xanh')); veNotoLuoi(luoi, cur, timN.value); } else { veChip(); veNotoLuoi(luoi, cur); } }; timN.onkeydown = e => e.stopPropagation(); const veChip = () => { chip.innerHTML = ''; dsNhom.forEach(k => { const b = el('button', 'btn nho' + (cur === k ? ' xanh' : ''), KHO.notoTen[k] || k); b.type = 'button'; b.onclick = () => { cur = k; timN.value = ''; veChip(); veNotoLuoi(luoi, k); }; chip.appendChild(b); }); }; veChip(); veNotoLuoi(luoi, cur); }
  // máy chủ không có key Freesound / Giphy thì ẩn hai mục tìm cũ (đã có Openverse + Noto thay thế), tránh bấm ra lỗi "chưa có key"
  const anKhuKey = () => { let doi = false; [['#khoAmTim', 'am_thanh'], ['#khoStickerTim', 'nhan_dan']].forEach(([sel, co]) => { const i = $(sel); if (!i) return; const khu = i.closest('.khoHang') && i.closest('.khoHang').parentNode; if (khu && !(MC.url && MC.dich_vu[co])) { khu.hidden = true; doi = true; } }); if (doi) ['am', 'sticker'].forEach(k => { const pane = $('[data-pane="' + k + '"]'); if (pane && pane._veBen) pane._veBen(); }); };
  const t0 = Date.now(); const cho = () => { if (MC.url || Date.now() - t0 > 8000) anKhuKey(); else setTimeout(cho, 300); }; setTimeout(cho, 300);
  // dựng lại cột danh mục bên trái của hai tab để có mục mới
  ['am', 'sticker'].forEach(k => { const pane = $('[data-pane="' + k + '"]'); if (!pane) return; const noi = pane.querySelector(':scope > .noi'), ben = pane.querySelector(':scope > .ben'); if (noi) { while (noi.firstChild) pane.appendChild(noi.firstChild); noi.remove(); } if (ben) ben.remove(); pane.classList.remove('coBen'); delete pane._veBen; try { taoBen(pane); } catch { } });
}

/* ═════════ Tab Media kiểu CapCut: Của bạn · Kho video · Kho ảnh (Pixabay / Pexels qua máy chủ, chủ đề sẵn) ═════════ */
const MEDIA_MUC = [['cuaban', 'Của bạn'], ['video', 'Kho video'], ['anh', 'Kho ảnh']];
const KHO_CHU_DE = [['Thành phố', 'city street'], ['Thiên nhiên', 'nature'], ['Văn phòng', 'office work'], ['Công nghệ', 'technology'], ['Tiền bạc', 'money'], ['Đồ ăn', 'food'], ['Thể thao', 'fitness'], ['Du lịch', 'travel'], ['Gia đình', 'family'], ['Học tập', 'study'], ['Gõ phím', 'typing keyboard'], ['Điện thoại', 'smartphone'], ['Bầu trời', 'sky clouds'], ['Biển', 'beach'], ['Cà phê', 'coffee'], ['Mua sắm', 'shopping'], ['Xe cộ', 'car driving'], ['Sức khoẻ', 'health'], ['Làm đẹp', 'beauty skincare'], ['Nông thôn', 'countryside']];
function moMediaMuc(id) { const pane = $('[data-pane="footage"]'); if (!pane || !pane.querySelector('.snav')) return; P.mediaMuc = id; pane.querySelectorAll('.snav button').forEach(b => b.classList.toggle('on', b.dataset.muc === id)); pane.querySelectorAll('.snoi > section').forEach(sx => { sx.hidden = sx.dataset.muc !== id; }); try { localStorage.setItem('dv_mediaMuc', id); } catch { } }
async function khoTimAnh() {
  const q = ($('#khoAnhQ').value || '').trim(); if (!q) { $('#khoAnhQ').focus(); return; } const tt = $('#khoAnhTt'), kq = $('#khoAnhKq'); tt.textContent = 'Đang tìm ảnh “' + q + '”…'; kq.innerHTML = '';
  try {
    const j = await timKho(q, true, $('#khoAnhHuong').value);
    if (!j.ok) { tt.textContent = 'Máy chủ chưa có key kho ảnh (PIXABAY_KEY hoặc PEXELS_KEY).'; return; }
    if (!j.items.length) { tt.textContent = j.loi && j.loi.length ? 'Kho báo lỗi: ' + j.loi.join(' · ') + ' — thử lại sau một lát.' : 'Không có ảnh hợp “' + q + '”, thử từ khác.'; return; }
    j.items.forEach(it => { const b = el('button'); b.type = 'button'; b.title = 'Thêm vào footage · ' + it.tac_gia; const im = el('img'); im.src = it.thumb; im.alt = ''; im.loading = 'lazy'; b.appendChild(im); b.appendChild(el('span', null, it.tac_gia)); b.onclick = () => themBrollAnh(it, q, b); kq.appendChild(b); });
    tt.textContent = j.items.length + ' ảnh' + (j.tu_khoa && j.tu_khoa !== q ? ' · tìm bằng “' + j.tu_khoa + '”' : '') + ' · ' + (j.nguon || 'kho miễn phí') + (j.truc_tiep ? ' · gọi thẳng' : '') + '. Bấm để thêm vào footage (đoạn ảnh 5 giây, kéo dài tuỳ ý).';
  } catch (e) { tt.textContent = 'Không gọi được máy chủ kho ảnh.'; }
}
async function themBrollAnh(it, q, nut) {
  const ten = it.id + '.jpg'; if (P.srcs.some(s => s.ten === ten)) { toast('Ảnh này đã có trong footage'); return; }
  const cu = nut.querySelector('span').textContent; nut.querySelector('span').textContent = 'Đang tải…'; nut.disabled = true;
  try {
    const r = await fetch(MC.url + it.url); if (!r.ok) throw new Error('http ' + r.status); const blob = await r.blob(); const f = new File([blob], ten, { type: blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg' });
    await themFile([f]); const s = P.srcs.find(z => z.ten === f.name); if (!s) throw new Error('khong_them_duoc');
    Object.assign(s, { loai_canh: 'broll', mo_ta: 'Ảnh kho: ' + q + ' (' + it.tac_gia + ')', tt: 'xong', canh: [{ bd: 0, kt: s.giay || 3, mo_ta: q, tags: ['broll', 'kho', 'anh'] }], cau: [], tu: [], khoanh_khac: [] }); if (s.thumbs) s.thumbs[0] = s.thumb;
    ghiNguon && ghiNguon({ ten: it.id, tac_gia: it.tac_gia, giay_phep: 'Pixabay/Pexels License', nguon: it.tac_gia.split('·').pop().trim(), link: it.goc || '' });
    veSrcs(); veLoi(); toast('Đã thêm ảnh vào footage. Kéo vào V2 làm hình minh hoạ hoặc bấm ＋ V1.');
  } catch (e) { toast('Không tải được ảnh: ' + e.message); }
  nut.disabled = false; nut.querySelector('span').textContent = cu;
}
function khoiTaoMediaKho() {
  const pane = $('[data-pane="footage"]'); if (!pane || !$('#ed').classList.contains('ccw') || pane.querySelector('.snav')) return;
  const cu = [...pane.children]; const nav = el('div', 'snav'), noi = el('div', 'snoi'), sec = {};
  MEDIA_MUC.forEach(([id, ten]) => { const b = el('button', null, ten); b.type = 'button'; b.dataset.muc = id; b.onclick = () => moMediaMuc(id); nav.appendChild(b); const sx = el('section'); sx.dataset.muc = id; sx.hidden = true; noi.appendChild(sx); sec[id] = sx; });
  pane.appendChild(nav); pane.appendChild(noi);
  // Của bạn: mọi thứ cũ trừ hộp kho video
  const kho = $('#kho'); cu.forEach(x => { if (x !== kho && x.parentNode === pane) sec.cuaban.appendChild(x); });
  // Kho video: hộp tìm cũ + chủ đề
  const chipV = el('div', 'row khoChip'); KHO_CHU_DE.forEach(([ten, q]) => { const b = el('button', 'btn nho', ten); b.type = 'button'; b.onclick = () => { $('#khoQ').value = q; khoTim(); chipV.querySelectorAll('.btn').forEach(x => x.classList.toggle('xanh', x === b)); }; chipV.appendChild(b); });
  sec.video.appendChild(el('h3', 'pt', 'Kho video B-roll (Pixabay · Pexels, miễn phí dùng thương mại)')); if (kho) { sec.video.appendChild(kho); kho.insertBefore(chipV, kho.children[1] || null); } const bv = el('div', 'quota khoBao'); bv.id = 'khoVideoBao'; bv.textContent = 'Máy chủ Cloudflare chưa có key kho video (PIXABAY_KEY / PEXELS_KEY).'; sec.video.appendChild(bv);
  // Kho ảnh
  const ka = el('div', 'kho'); ka.id = 'khoAnh'; ka.innerHTML = '<div class="hang"><input id="khoAnhQ" type="search" placeholder="Kho ảnh minh hoạ: văn phòng, bầu trời, tiền…"><select id="khoAnhHuong" title="Hướng ảnh"><option value="doc">Dọc</option><option value="ngang">Ngang</option></select><button class="btn nho xanh" id="khoAnhTim" type="button">Tìm</button></div><div class="row khoChip" id="khoAnhChip"></div><div class="kq" id="khoAnhKq"></div><div class="quota" id="khoAnhTt">Chọn chủ đề hoặc gõ từ khoá. Ảnh thêm vào footage như một đoạn 5 giây, kéo dài tuỳ ý.</div>';
  sec.anh.appendChild(el('h3', 'pt', 'Kho ảnh minh hoạ (Pixabay · Pexels, miễn phí dùng thương mại)')); sec.anh.appendChild(ka); const ba = el('div', 'quota khoBao'); ba.id = 'khoAnhBao'; ba.textContent = 'Máy chủ Cloudflare chưa có key kho ảnh (PIXABAY_KEY / PEXELS_KEY).'; sec.anh.appendChild(ba);
  const chipA = $('#khoAnhChip'); KHO_CHU_DE.forEach(([ten, q]) => { const b = el('button', 'btn nho', ten); b.type = 'button'; b.onclick = () => { $('#khoAnhQ').value = q; khoTimAnh(); chipA.querySelectorAll('.btn').forEach(x => x.classList.toggle('xanh', x === b)); }; chipA.appendChild(b); });
  $('#khoAnhTim').onclick = khoTimAnh; $('#khoAnhQ').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); khoTimAnh(); } });
  // theo máy chủ: có kho thì hiện hộp, không thì hiện thông báo
  const dongBo = () => { const co = !!(MC.url && MC.dich_vu.broll); if (kho) kho.hidden = !co; ka.hidden = !co; bv.hidden = co; ba.hidden = co; };
  const mcCu = mayChuKhoiDong; mayChuKhoiDong = async function () { const r = await mcCu.apply(this, arguments); dongBo(); return r; }; dongBo(); const t0 = Date.now(); const cho = () => { dongBo(); if (!MC.url && Date.now() - t0 < 8000) setTimeout(cho, 300); }; setTimeout(cho, 300);
  let luu = 'cuaban'; try { luu = localStorage.getItem('dv_mediaMuc') || 'cuaban'; } catch { } moMediaMuc(MEDIA_MUC.some(([id]) => id === luu) ? luu : 'cuaban');
}


/* ═════════ MẪU ĐỒ HOẠ DỰNG SẴN: cảnh keyframe có sẵn, người dùng chỉ thay chữ ═════════ */
function mauDoHoa(id) { return ((window.KHO && KHO.doHoa) || []).find(x => x.id === id) || null; }
/* dựng cảnh thật từ mẫu: thay chữ người dùng nhập, quy t âm về giây thật theo độ dài đang đặt */
function canhMau(g) {
  const m = mauDoHoa(g.mau_id); if (!m) return g.canh || { lop: [] };
  const dai = Math.max(0.3, (g.kt || 0) - (g.bd || 0));
  const key = m.id + '|' + dai.toFixed(2) + '|' + (g.text || '') + '|' + (g.phu || '');
  if (g._mc && g._mc.key === key) return g._mc.canh;
  const ds = String(g.text == null ? '' : g.text).split('|');
  const lay = t => t === 'phu' ? String(g.phu == null ? '' : g.phu) : /^text:\d+$/.test(t) ? (ds[+t.split(':')[1]] || '') : (ds[0] || '');
  const lop = m.lop.map(l => {
    const o = Object.assign({}, l); o.kf = (l.kf || [{ t: 0 }]).map(f => { const k = Object.assign({}, f); if (k.t < 0) k.t = Math.max(0, dai + k.t); return k; });
    if (l.tu) { const s = lay(l.tu); if (o.loai === 'so') { o.so_den = parseFloat(String(s).replace(/[^\d.\-]/g, '')) || 0; o.chu = s; } else o.chu = s; }
    return o;
  });
  const canh = chuanCanh({ lop }); g._mc = { key, canh }; return canh;
}
function veMauThu(cv2, m) {
  const ctx = cv2.getContext('2d'); const W = cv2.width, H = cv2.height;
  const h2 = H, w2 = Math.round(h2 * 9 / 16), x0 = Math.round((W - w2) / 2);   /* ô vuông nhưng vẽ nguyên khung 9:16 ở giữa */
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0d0e12'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#1b1d23'; ctx.fillRect(x0, 0, w2, h2);
  const dai = m.dai || 4, gg = { mau_id: m.id, text: m.text || '', phu: m.phu || '', bd: 0, kt: dai };
  ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, w2, h2); ctx.clip(); ctx.translate(x0, 0);
  try { veCanhAI(ctx, w2, h2, canhMau(gg), dai * 0.72, dai, mauNhan()); } catch (e) { }
  ctx.restore();
}
function themMauDoHoa(m) {
  luuHoanTac(); const dai = m.dai || 4, bd = +P.t.toFixed(2);
  const g = { id: uid(), kieu: 'ai', mau_id: m.id, ten: m.ten, bd, kt: +(bd + dai).toFixed(2), text: m.text || '', phu: m.phu || '', canh: null };
  g.canh = canhMau(g); P.gfx.push(g); P.chon = { k: 'g', i: P.gfx.length - 1 };
  veTl(); veKhung(); veProp(); moPhaiNeuCan(); toast('Đã thêm “' + m.ten + '”. Sửa chữ ở bảng phải, kéo trên dòng thời gian để dời.');
}
/* bảng thuộc tính: mỗi ô chữ của mẫu là một input, ghi lại vào g.text (ngăn bằng |) hoặc g.phu */
function veThuocTinhMau(box, g) {
  const m = mauDoHoa(g.mau_id); if (!m) return;
  box.appendChild(el('div', 'quota', 'Mẫu dựng sẵn · ' + (m.lop || []).length + ' lớp có keyframe · ' + (KHO.nhomDoHoa[m.nhom] || m.nhom)));
  (m.o || [{ nhan: 'Chữ', tu: 'text' }]).forEach(o => {
    const ds = String(g.text == null ? '' : g.text).split('|');
    const l = el('label', 'full'); l.appendChild(el('span', null, o.nhan)); const i = el('input'); i.type = 'text';
    i.value = o.tu === 'phu' ? (g.phu || '') : (/^text:\d+$/.test(o.tu) ? (ds[+o.tu.split(':')[1]] || '') : (ds[0] || ''));
    i.oninput = () => {
      if (o.tu === 'phu') g.phu = i.value;
      else { const a = String(g.text == null ? '' : g.text).split('|'); const n = /^text:\d+$/.test(o.tu) ? +o.tu.split(':')[1] : 0; while (a.length <= n) a.push(''); a[n] = i.value.replace(/\|/g, ' '); g.text = a.join('|'); }
      g.canh = canhMau(g); veTl(); veKhung();
    };
    l.appendChild(i); box.appendChild(l);
  });
  const r = el('div', 'row'); const b = el('button', 'btn nho', '↺ Chữ mặc định'); b.type = 'button';
  b.onclick = () => { luuHoanTac(); g.text = m.text || ''; g.phu = m.phu || ''; g.canh = canhMau(g); veTl(); veKhung(); veProp(); };
  const b2 = el('button', 'btn nho', '⏱ Dài chuẩn ' + fmt1(m.dai || 4) + 's'); b2.type = 'button';
  b2.onclick = () => { luuHoanTac(); g.kt = +(g.bd + (m.dai || 4)).toFixed(2); g.canh = canhMau(g); veTl(); veKhung(); veProp(); };
  r.appendChild(b); r.appendChild(b2); box.appendChild(r);
}
function khoiTaoMauDoHoa() {
  const pane = $('.epane[data-pane="dohoa"]'); if (!pane || !window.KHO || !KHO.doHoa) return;
  /* luôn dựng lại cảnh theo chữ + độ dài hiện tại trước khi vẽ */
  const veDhCu = veDoHoa;
  veDoHoa = function (ctx, W, H, g, t) { if (g && g.mau_id) g.canh = canhMau(g); return veDhCu.apply(this, arguments); };
  const h = el('h3', 'pt', 'Mẫu dựng sẵn'); h.style.marginTop = '0';
  const gt = el('div', 'quota', 'Bấm để chèn tại đầu phát, rồi chỉ thay chữ. Thiết kế dựa trên thư viện mở HyperFrames (HeyGen, Apache 2.0).');
  const luoi = el('div', 'mauLuoi'); luoi.id = 'mauDhLuoi';
  pane.insertBefore(luoi, pane.firstChild); pane.insertBefore(gt, luoi); pane.insertBefore(h, gt);   /* mẫu dựng sẵn lên đầu, các khối tự vẽ nằm dưới */
  const nhom = {}; KHO.doHoa.forEach(m => { (nhom[m.nhom] = nhom[m.nhom] || []).push(m); });
  Object.keys(nhom).forEach(k => {
    const tt = el('div', 'quota'); tt.style.gridColumn = '1/-1'; tt.style.margin = '4px 0 0'; tt.textContent = KHO.nhomDoHoa[k] || k; luoi.appendChild(tt);
    nhom[k].forEach(m => {
      const b = el('button'); b.type = 'button'; b.title = m.ten + ' · ' + fmt1(m.dai || 4) + 's';
      const the = el('span', 'the'); const c2 = el('canvas'); c2.width = 180; c2.height = 180;
      c2.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
      the.appendChild(c2); b.appendChild(the); const tn = el('span', 'ten', m.ten); tn.style.whiteSpace = 'normal'; tn.appendChild(el('small', null, fmt1(m.dai || 4) + 's')); b.appendChild(tn);
      b.onclick = () => themMauDoHoa(m); luoi.appendChild(b);
      requestAnimationFrame(() => veMauThu(c2, m));
    });
  });
}


/* ═════════ MẶT NẠ CHO ELEMENT (gfx) + TAY CẦM MẶT NẠ TRÊN KHUNG XEM TRƯỚC — kiểu CapCut ═════════ */
const mnCvs = [document.createElement('canvas'), document.createElement('canvas')];
const mnCua = m => m && m.mn && m.mn.kieu && m.mn.kieu !== 'khong' ? m.mn : null;
function khoiTaoMatNaEl() {
  /* đồ hoạ / chữ / sticker: vẽ ra lớp riêng rồi khoét theo hình mặt nạ (toạ độ tính theo khung) */
  const veDhCu = veDoHoa;
  veDoHoa = function (ctx, W, H, g, t) {
    const mn = mnCua(g); if (!mn) return veDhCu.apply(this, arguments);
    const [L, M] = mnCvs; [L, M].forEach(x => { if (x.width !== W || x.height !== H) { x.width = W; x.height = H; } });
    const gl = L.getContext('2d'); gl.clearRect(0, 0, W, H);
    const kq = veDhCu.call(this, gl, W, H, g, t);
    doiMnCu(g); hopChuMn(g, t, (c2, W2, H2, g2, t2) => veDhCu.call(this, c2, W2, H2, g2, t2)); veMatNaMuc(M, W, H, 'g', g, t - g.bd, cheMn(g));   /* mặt nạ chữ tính trên khung chữ */
    gl.save(); gl.globalCompositeOperation = 'destination-in'; gl.drawImage(M, 0, 0); gl.restore();
    ctx.drawImage(L, 0, 0); return kq;
  };
  /* bảng thuộc tính của element cũng có mục Mặt nạ */
  const vePropMn = veProp;
  veProp = function () { const r = vePropMn.apply(this, arguments); try { themMucMatNa(); } catch (e) { } return r; };
  /* tay cầm mặt nạ trên khung xem trước */
  const veTayMn = veTay;
  veTay = function () { const r = veTayMn.apply(this, arguments); try { veTayMatNa(); } catch (e) { } return r; };
}
function themMucMatNa() {
  const box = $('#propChon'); if (!box || !P.chon || P.chon.k !== 'g') return;
  const g = mucChon(); if (!g || box.querySelector('.mnMuc')) return;
  const moc = [...box.querySelectorAll('.nhom2')].find(n => { const b = n.querySelector('b'); return b && b.textContent === 'Hoà trộn'; });
  const tam = el('div'); box.appendChild(tam); veThuocTinhMatNa(tam, 'g', g);
  const n = tam.firstChild; if (!n) { tam.remove(); return; } n.classList.add('mnMuc');
  while (tam.firstChild) box.insertBefore(tam.firstChild, moc || null);
  tam.remove(); tabHoaProp();   /* vẽ lại tab để Mặt nạ vào đúng sub-tab, CC2 gắn tiêu đề thu gọn */
}
/* phép biến hình của element (V1/V2 có scale–xoay–dời; element đồ hoạ dùng thẳng toạ độ khung) */
function mnPhep(k, m) { if (k === 'g') return { x: 0, y: 0, sc: 1, xoay: 0 }; const h = tinhHop(k, m); return { x: h.x, y: h.y, sc: h.sc, xoay: h.xoay }; }
const cx2 = () => cx;


/* thanh trượt kiểu CapCut: tô phần bên trái theo giá trị (CSS đọc --pc) */
function truotTo(r) { const mn = r.min === '' ? 0 : +r.min, mx = r.max === '' ? 100 : +r.max, v = +r.value; r.style.setProperty('--pc', (mx > mn ? Math.max(0, Math.min(100, (v - mn) / (mx - mn) * 100)) : 0).toFixed(1) + '%'); }
function khoiTaoTruotTo() {
  const box = $('#prop'); if (!box) return;
  const quet = () => box.querySelectorAll('input[type=range]').forEach(truotTo);
  box.addEventListener('input', e => { if (e.target.type === 'range') truotTo(e.target); }, true);
  const vePropTt = veProp; veProp = function () { const r = vePropTt.apply(this, arguments); quet(); return r; };
  quet();
  const z = $('#zoomTl'); if (z) { truotTo(z); z.addEventListener('input', () => truotTo(z)); const veTlZ = veTl; veTl = function () { const r = veTlZ.apply(this, arguments); truotTo(z); return r; }; }   /* thanh zoom dòng thời gian cùng kiểu */
}

/* ═════════ KHO PIXABAY GỌI THẲNG TỪ TRÌNH DUYỆT: mỗi học viên dùng IP riêng (100 lượt/phút) nên không dính 429 của IP chung Cloudflare.
   Key chỉ phát cho trang của khoá khi đã đăng nhập (/kho-key). Không được / ít kết quả thì rơi về worker (dịch từ khoá bằng AI + Openverse). ═════════ */
async function khoKey() {
  if (P._khoKey !== undefined) return P._khoKey;
  try { const c = sessionStorage.getItem('dv_khoKey'); if (c) { P._khoKey = c; return c; } } catch { }
  P._khoKey = '';
  try { if (MC.url && MC.dich_vu.kho_truc_tiep && TK.token()) { const r = await fetch(MC.url + '/kho-key?token=' + encodeURIComponent(TK.token())); const j = await r.json(); if (j.ok && j.pixabay) { P._khoKey = j.pixabay; try { sessionStorage.setItem('dv_khoKey', j.pixabay); } catch { } } } } catch { }
  return P._khoKey;
}
async function pixabayTrucTiep(q, anh, doc, trang) {
  const key = await khoKey(); if (!key) return null;
  const kc = 'dv_pb:' + (anh ? 'a' : 'v') + (doc ? 'd' : 'n') + (trang || 1) + ':' + q.toLowerCase();
  try { const c = JSON.parse(sessionStorage.getItem(kc) || 'null'); if (c && Date.now() - c.t < 3600e3) return c.ds; } catch { }
  const goi = async vi => {
    const p = new URLSearchParams({ key, q: q.slice(0, 100), per_page: anh ? '40' : '60', page: String(trang || 1), safesearch: 'true' });
    if (anh) { p.set('image_type', 'photo'); p.set('orientation', doc ? 'vertical' : 'horizontal'); } else p.set('video_type', 'film');
    if (vi) p.set('lang', 'vi');
    const r = await fetch('https://pixabay.com/api/' + (anh ? '' : 'videos/') + '?' + p); if (!r.ok) throw new Error('pixabay ' + r.status);
    const hits = (await r.json()).hits || [];
    if (anh) return hits.map(h => ({ id: 'pbi' + h.id, anh: true, giay: 0, w: h.imageWidth, h: h.imageHeight, thumb: h.webformatURL, link: h.largeImageURL || h.webformatURL, goc: h.pageURL, tac_gia: (h.user || 'Pixabay') + ' · Pixabay' }));
    return hits.map(h => { const v = h.videos || {}, ds = ['medium', 'small', 'large', 'tiny'].map(k => v[k]).filter(x => x && x.url && x.width); const f = ds.find(x => Math.max(x.width, x.height) <= 1280) || ds[0]; if (!f) return null; return { id: 'pb' + h.id, giay: h.duration, w: f.width, h: f.height, thumb: f.thumbnail || (v.tiny || {}).thumbnail || '', link: f.url, goc: h.pageURL, tac_gia: (h.user || 'Pixabay') + ' · Pixabay' }; }).filter(Boolean);
  };
  const hop = it => doc ? it.h >= it.w : it.w > it.h;
  let ds = (await goi(true)).filter(hop);
  if (ds.length < 6) { const co = new Set(ds.map(x => x.id)); try { ds = ds.concat((await goi(false)).filter(x => hop(x) && !co.has(x.id))); } catch { } }
  ds = ds.slice(0, 18).map(({ link, ...it }) => ({ ...it, url: '/media?u=' + encodeURIComponent(link) }));
  try { sessionStorage.setItem(kc, JSON.stringify({ t: Date.now(), ds })); } catch { }
  return ds;
}
/* tìm kho: thẳng Pixabay trước, thiếu thì nhờ worker (dịch từ khoá + Openverse), gộp lại */
async function timKho(q, anh, huong, trang) {
  const doc = huong !== 'ngang'; let truc = null, loiTruc = '';
  try { truc = await pixabayTrucTiep(q, anh, doc, trang); } catch (e) { loiTruc = String(e.message || e); }
  if (truc && truc.length >= 6) return { ok: true, items: truc, tu_khoa: q, nguon: 'Pixabay · miễn phí dùng thương mại', truc_tiep: true };
  let j = null; try { const r = await fetch(MC.url + '/broll?' + (anh ? 'loai=anh&' : '') + 'q=' + encodeURIComponent(q) + '&huong=' + (doc ? 'doc' : 'ngang') + (trang ? '&trang=' + trang : '')); j = await r.json(); } catch (e) { j = { ok: false, error: String(e.message || e) }; }
  if (!j.ok) { if (truc && truc.length) return { ok: true, items: truc, tu_khoa: q, nguon: 'Pixabay · miễn phí dùng thương mại', truc_tiep: true }; return j; }
  if (truc && truc.length) { const co = new Set(truc.map(x => x.id)); j.items = truc.concat((j.items || []).filter(x => !co.has(x.id))).slice(0, 24); }
  if (loiTruc && (!j.items || !j.items.length)) j.loi = (j.loi || []).concat(['trực tiếp: ' + loiTruc]);
  return j;
}
