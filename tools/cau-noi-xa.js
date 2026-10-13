/* ═══════════════════════════════════════════════════════════════
   CẦU NỐI XA: tab trình dựng ↔ Claude Code ở bất cứ đâu (máy khác, phiên cloud claude.ai) qua Apps Script.
   Bấm "📡 Nối với Claude Code" → tab hiện MÃ 6 ký tự. Người dùng nói mã cho Claude; Claude chạy
   `node tools/claude-noi/tmxk-xa.mjs --ma <MÃ> <lệnh>` (hoặc gọi thẳng API cc_*), tab nhận lệnh về
   chạy bằng đúng bộ lệnh của trang (NTM.cfg: trợ lý dựng của Dựng nhanh, fc_* của Dựng chuyên sâu).
   Không cần cài gì trên máy người dùng, không cần nối thư mục. Mã giữ trong localStorage để lần sau
   vẫn là mã cũ, khỏi báo lại cho Claude.
   Cần: API (hằng của trang), NTM (noi-thu-muc.js nạp trước), toast, $.
   ═══════════════════════════════════════════════════════════════ */
const CNX = (() => {
  const LS_MA = 'tmxk_cc_ma', NHANH_MS = 2500, CHAM_MS = 8000, RANH_MS = 15 * 60000, ANH_RONG = 640, TEXT_MAX = 12000;
  let ma = '', hen = null, dangChay = false, lanCuoiLenh = Date.now(), bat = false;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { } } };

  function taoMa() { const B = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let m = ''; for (let i = 0; i < 6; i++) m += B[Math.floor(Math.random() * B.length)]; return m; }
  async function goi(body) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    let j; try { j = await r.json(); } catch { throw Object.assign(new Error('mayChu'), { mayChu: true }); }
    return j;
  }
  /* ảnh khung thu nhỏ còn ≤640px JPEG để một kết quả nằm dưới 100 KB của CacheService */
  async function thuNhoAnh(img) {
    if (!img || !img.data) return undefined;
    try {
      const im = new Image(); im.src = 'data:' + (img.mime || 'image/png') + ';base64,' + img.data; await im.decode();
      const k = Math.min(1, ANH_RONG / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      return { mime: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.6).split(',')[1] };
    } catch { return undefined; }
  }
  async function chayLo(goi_) {
    const ds = Array.isArray(goi_.lenh) ? goi_.lenh.slice(0, 30) : [], ket = [];
    for (const g of ds) {
      const ten = String(g && g.ten || ''), nhan = NTM.cfg.nhan(ten);
      let res; try { res = await NTM.cfg.chay(ten, (g && g.a) || {}); } catch (e) { res = { isError: true, text: String(e && e.message || e) }; }
      const text = typeof res.text === 'string' ? res.text : JSON.stringify(res.text);
      ket.push({ ten, isError: !!res.isError, text: text && text.length > TEXT_MAX ? text.slice(0, TEXT_MAX) + '… (cắt bớt)' : text, image: await thuNhoAnh(res.image) });
      toast((res.isError ? '⚠ Claude: ' : '✓ Claude: ') + nhan);
      if (res.isError) break;
    }
    try { NTM.cfg.veSau(); } catch { }
    lanCuoiLenh = Date.now();
    try { const r = await goi({ action: 'cc_kq', ma, id: goi_.id, ket_qua: ket }); if (!r.ok) console.warn('[cầu nối xa] nộp kết quả', r.error); } catch (e) { console.warn('[cầu nối xa] nộp kết quả', e); }
  }
  async function vong() {
    if (!bat || dangChay) return; dangChay = true;
    try {
      let tt = null; try { tt = await NTM.cfg.tomTat(); } catch (e) { tt = { loi: String(e && e.message || e) }; }
      let s = JSON.stringify(tt); if (s.length > 80000) tt = { cat: true, ghi_chu: 'tóm tắt quá dài, dùng lệnh xem chi tiết', dau: s.slice(0, 60000) };
      const r = await goi({ action: 'cc_nhan', ma, trinh_dung: NTM.cfg.ten, tt });
      if (!r.ok) { veTt('⚠ Máy chủ chưa nhận cầu nối (' + r.error + '). Nhắc mentor deploy Apps Script bản mới.'); return; }
      veTt('');
      for (const lo of (r.lo || [])) await chayLo(lo);
    } catch (e) { veTt(e && e.mayChu ? '⚠ Máy chủ đang lỗi, thử lại sau…' : '⚠ Mất mạng, đang thử lại…'); }
    finally { dangChay = false; if (bat) hen = setTimeout(vong, Date.now() - lanCuoiLenh > RANH_MS ? CHAM_MS : NHANH_MS); }
  }
  function veTt(loi) {
    const b = $('#btnCauXa'), o = $('#cauXaTt'); if (!b) return;
    b.textContent = bat ? '📡 Đang nối · mã ' + ma : '📡 Nối với Claude Code';
    b.setAttribute('aria-pressed', String(bat));
    if (!o) return;
    if (!bat) { o.innerHTML = ''; o.textContent = 'Điều khiển trình dựng này bằng cách chat với Claude Code ở bất cứ đâu, không cần cài gì.'; return; }
    o.innerHTML = '';
    const m = document.createElement('b'); m.textContent = ma; m.style.cssText = 'font-size:20px;letter-spacing:.14em;font-family:ui-monospace,Menlo,monospace;user-select:all';
    o.append('Mã ghép nối: ', m, document.createElement('br'), loi || ('Nói với Claude Code: “nối trình dựng mã ' + ma + '” rồi ra lệnh. Giữ tab này mở.'));
  }
  function batDau() {
    if (!NTM || !NTM.cfg) { toast('Chưa nạp xong trang, thử lại'); return; }
    if (!NTM.cfg.sanSang()) { toast('Trình dựng chưa sẵn sàng, chờ tải xong rồi bấm lại'); return; }
    ma = (ls.get(LS_MA) || '').toUpperCase(); if (!/^[A-Z0-9]{6}$/.test(ma)) { ma = taoMa(); ls.set(LS_MA, ma); }
    bat = true; lanCuoiLenh = Date.now(); veTt(''); clearTimeout(hen); vong();
    try { navigator.clipboard.writeText(ma); toast('Đã nối, mã ' + ma + ' (đã chép vào clipboard). Nói mã này cho Claude Code.'); } catch { toast('Đã nối, mã ' + ma + '. Nói mã này cho Claude Code.'); }
  }
  function dung() { bat = false; clearTimeout(hen); veTt(''); toast('Đã tắt nối với Claude Code'); }
  function khoiTao() { const b = $('#btnCauXa'); if (!b) return; b.onclick = () => bat ? dung() : batDau(); veTt(''); }
  return { khoiTao, dangNoi: () => bat, ma: () => ma };
})();
CNX.khoiTao();
