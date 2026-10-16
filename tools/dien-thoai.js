/* Viral Studio trên điện thoại: đỡ cuộn, đỡ rối. Đi cùng dien-thoai.css, chỉ chạy khi màn hẹp.
   - Đoạn giải thích dài (.hint) thu còn 2 dòng, chạm "Xem thêm" mới mở.
   - Nút chính của trang (gắn data-nut-noi) có bản nổi phía trên thanh tab khi nút thật đã trôi khỏi màn hình.
   - Đang gõ phím thì ẩn thanh tab và nút nổi để không che ô đang điền. */
(function () {
  var hep = matchMedia('(max-width:640px)');

  function gonHint() {
    document.querySelectorAll('.card p.hint').forEach(function (p) {
      if (p.dataset.gon || p.offsetParent === null) return;   // đang ẩn (tab khác, mục thu gọn): đo sau
      p.dataset.gon = '1'; p.classList.add('gon');
      if (p.scrollHeight <= p.clientHeight + 2) { p.classList.remove('gon'); return; }
      var b = document.createElement('button'); b.type = 'button'; b.className = 'xem-them'; b.textContent = 'Xem thêm ▾';
      b.onclick = function () { var mo = p.classList.toggle('gon'); b.textContent = mo ? 'Xem thêm ▾' : 'Thu gọn ▴'; };
      p.after(b);
    });
  }

  function nutNoi() {
    var goc = document.querySelector('[data-nut-noi]'); if (!goc) return;
    var noi = document.createElement('button'); noi.type = 'button'; noi.className = 'nut-noi'; noi.hidden = true;
    noi.onclick = function () { goc.click(); };
    document.body.appendChild(noi);
    var thay = true;
    function ve() {
      var chu = goc.childNodes[0] ? String(goc.childNodes[0].textContent || '').trim() : '';
      noi.textContent = chu || goc.textContent.trim();
      noi.disabled = goc.disabled;
      noi.hidden = !hep.matches || thay || goc.offsetParent === null;
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (ds) { thay = ds[0].isIntersecting; ve(); }).observe(goc);
    new MutationObserver(ve).observe(goc, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
    addEventListener('scroll', ve, { passive: true });
    hep.addEventListener ? hep.addEventListener('change', ve) : hep.addListener(ve);
    ve();
  }

  // bàn phím ảo mở: ẩn đồ nổi ở đáy
  var LA_GO = /^(INPUT|TEXTAREA|SELECT)$/;
  function laO(e) { return e && (LA_GO.test(e.tagName) && !/^(button|checkbox|radio|range|file|submit|color)$/.test(e.type || '')) || (e && e.isContentEditable); }
  document.addEventListener('focusin', function (e) { if (hep.matches && laO(e.target)) document.body.classList.add('dang-go'); });
  document.addEventListener('focusout', function () { setTimeout(function () { if (!laO(document.activeElement)) document.body.classList.remove('dang-go'); }, 60); });

  function chay() { if (hep.matches) gonHint(); }
  function batDau() { chay(); nutNoi(); document.addEventListener('click', function () { setTimeout(chay, 80); }); hep.addEventListener ? hep.addEventListener('change', chay) : hep.addListener(chay); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', batDau); else batDau();
})();
