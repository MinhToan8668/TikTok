/* ═══════════════════════════════════════════════════════════════
   NẠP TRÌNH DỰNG: phần JS của dung-video.html được tách thành dung/*.js để dễ sửa, nhưng code
   dựa vào hoisting của một script duy nhất (hàm ở file sau được gọi lúc file trước khởi động).
   Nên nạp: tải cả 9 file, ghép lại theo đúng thứ tự thành MỘT script rồi chạy, sau đó mới nạp
   các script phụ (sang-filmcraft, noi-thu-muc, tro-ly) vì chúng cần P, agentXuLy… đã có.
   Không có bước build: GitHub Pages phục vụ file tĩnh, fetch cùng origin.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var me = document.currentScript, v = (me && me.src.split('?v=')[1]) || '';
  var DS = ['00-loi', '01-dong-thoi-gian', '02-thao-tac', '03-giao-dien-capcut', '04-day-du', '05-dac-ta-2-3', '06-m3-mobile-kho', '07-chi-tiet', '08-clip-ghep-spec', '09-chuyen-nghiep'];
  var PHU = (me && me.dataset.phu ? me.dataset.phu.split(',') : []);
  function loi(chu) {
    var k = document.createElement('div');
    k.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#ff4d6d;color:#fff;padding:12px 14px;border-radius:12px;font:14px system-ui;display:flex;gap:10px;align-items:center;justify-content:space-between';
    k.textContent = chu + ' ';
    var b = document.createElement('button'); b.textContent = 'Tải lại trang'; b.style.cssText = 'background:#fff;color:#000;border:0;border-radius:8px;padding:6px 12px;font-weight:700'; b.onclick = function () { location.reload(); };
    k.appendChild(b); document.body.appendChild(k);
  }
  function napPhu(i) {
    if (i >= PHU.length) return;
    var s = document.createElement('script'); s.src = PHU[i]; s.onload = function () { napPhu(i + 1); }; s.onerror = function () { console.warn('không nạp được', PHU[i]); napPhu(i + 1); };
    document.body.appendChild(s);
  }
  Promise.all(DS.map(function (t) { return fetch('dung/' + t + '.js' + (v ? '?v=' + v : ''), { cache: 'force-cache' }).then(function (r) { if (!r.ok) throw new Error(t + ' http ' + r.status); return r.text(); }); }))
    .then(function (ds) {
      var s = document.createElement('script');
      s.textContent = ds.join('\n;\n') + '\n//# sourceURL=dung-video-ghep.js';
      document.body.appendChild(s);
      napPhu(0);
    })
    .catch(function (e) { console.error('[nạp trình dựng]', e); loi('Trang tải thiếu một phần (mạng chập chờn) nên trình dựng chưa chạy được.'); });
})();
