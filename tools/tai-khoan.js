/* ═══════ TÀI KHOẢN VIRAL STUDIO — dùng chung cho cả ba tool ═══════
   Không còn chế độ khách: muốn chạy AI thì tạo tài khoản miễn phí (email + số điện thoại).
   Đổi lại, tool đọc được hồ sơ kênh của học viên nên mọi góp ý bám đúng ngách, đúng tệp,
   đúng xưng hô và không phạm điều cấm mà họ đã chốt với mentor.

   Cách dùng trong trang tool:
     <script src="tai-khoan.js"></script>
     TK.khoiDong({ api: API, tool: 'soi', onDoi: capNhatGiaoDien });
     if (!await TK.canCo('soi')) return;          // chặn trước khi gọi AI, tự mở bảng đăng ký
     body.ho_so = TK.hoSo(); body.dev = TK.dev(); body.token = TK.token();
*/
(function (global) {
  'use strict';

  var ND_KEY = 'vs_user', HV_KEY = 'tmxk_hv', DEV_KEY = 'vs_dev', HS_KEY = 'vs_hoso_tam';
  var TOOL_TEN = { hook: 'AI phân tích hook', script: 'chấm kịch bản', soi: 'soi video viral' };

  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  function json(k) { try { return JSON.parse(ls.get(k) || 'null'); } catch (e) { return null; } }

  var TK = {
    api: '', tool: 'hook', onDoi: null, cfg: null,
    me: null,          // hồ sơ tài khoản trả từ st_me
    vaiHoSo: null      // mentor đang mượn hồ sơ của học viên nào để chạy thử
  };

  /* ── nền tảng ── */
  function token() { var h = json(HV_KEY), n = json(ND_KEY); return (h && h.token) || (n && n.token) || ''; }
  function dev() {
    var d = ls.get(DEV_KEY);
    if (!d || d.length < 8) { d = 'd' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls.set(DEV_KEY, d); }
    return d;
  }
  async function goi(body) {
    var r = await fetch(TK.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    return r.json();
  }

  /* ── hồ sơ kênh: của chính mình, hoặc của học viên mà mentor đang mượn để chạy thử ── */
  function hoSo() {
    if (TK.vaiHoSo && TK.vaiHoSo.ho_so) return TK.vaiHoSo.ho_so;
    if (TK.me && TK.me.ho_so) return TK.me.ho_so;
    return json(HS_KEY) || {};       // người chưa đăng nhập vẫn điền tay được, lưu tạm trong máy
  }
  function luuHoSoTam(hs) { ls.set(HS_KEY, JSON.stringify(hs || {})); }
  function laMentor() { return !!(TK.me && (TK.me.vaitro === 'mentor' || TK.me.mentor)); }
  function laPro() { return !!(TK.me && (TK.me.pro || TK.me.loai === 'hv')); }
  function luotCon(tool) {
    if (!TK.me || laPro()) return null;
    var l = TK.me.luot || {};
    return l[tool || TK.tool];
  }

  /* ── giao diện: một bảng duy nhất cho đăng ký, đăng nhập, hồ sơ kênh ── */
  var CSS = [
    '.tk-nen{position:fixed;inset:0;background:rgba(20,18,8,.62);display:none;place-items:center;padding:16px;z-index:60;overflow:auto}',
    '.tk-nen.mo{display:grid}',
    '.tk-hop{background:var(--surface,#fff);color:var(--text,#222);border-radius:18px;padding:20px;max-width:440px;width:100%;box-shadow:0 18px 50px rgba(0,0,0,.28);max-height:92vh;overflow:auto}',
    '.tk-hop h3{margin:0 0 4px;font-family:var(--font-display,inherit);font-size:19px}',
    '.tk-hop .tk-phu{margin:0 0 12px;color:var(--muted,#777);font-size:13px;line-height:1.5}',
    '.tk-tab{display:inline-flex;border:1px solid var(--line,#ddd);border-radius:10px;overflow:hidden;margin-bottom:12px}',
    '.tk-tab button{font:inherit;font-size:13px;border:0;background:var(--surface-2,#f3f3f3);color:var(--muted,#777);padding:7px 14px;cursor:pointer}',
    '.tk-tab button[aria-pressed="true"]{background:var(--accent,#99DF00);color:var(--accent-ink,#222);font-weight:700}',
    '.tk-hop label{display:block;font-size:12px;color:var(--muted,#777);font-weight:600;margin:10px 0 4px}',
    '.tk-hop input,.tk-hop textarea,.tk-hop select{width:100%;font:inherit;font-size:14px;color:var(--text,#222);background:var(--surface-2,#f7f7f7);border:1px solid var(--line,#ddd);border-radius:10px;padding:9px 11px}',
    '.tk-hop textarea{min-height:52px;resize:vertical;line-height:1.5}',
    '.tk-nut{font:inherit;font-weight:700;border:1px solid var(--line-strong,#bbb);background:var(--surface,#fff);color:var(--text,#222);border-radius:10px;padding:10px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}',
    '.tk-nut.chinh{background:var(--pro,#26210F);color:var(--pro-text,#fff);border-color:transparent}',
    '.tk-nut.rong{width:100%;justify-content:center;margin-top:14px}',
    '.tk-nut:disabled{opacity:.55;cursor:default}',
    '.tk-hang{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}',
    '.tk-tt{font-size:13px;margin:10px 0 0;min-height:1.2em;color:var(--muted,#777)}',
    '.tk-tt.loi{color:var(--danger,#B4432A)} .tk-tt.ok{color:var(--ok,#3E7D1F)}',
    '.tk-qua{background:var(--accent-soft,#eef8d8);border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.5;margin-bottom:12px}',
    '.tk-the{border:1px solid var(--line,#ddd);border-radius:12px;padding:10px 12px;margin-bottom:10px;display:flex;gap:10px;align-items:center}',
    '.tk-the b{font-size:14px} .tk-the small{display:block;color:var(--muted,#777);font-size:12px}',
    '.tk-goi{margin-left:auto;font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;background:var(--surface-2,#eee)}',
    '.tk-goi.pro{background:var(--pro,#26210F);color:var(--pro-text,#fff)}',
    '.tk-luot{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0}',
    '.tk-luot span{font-size:12px;border:1px solid var(--line,#ddd);border-radius:999px;padding:3px 9px}',
    '.tk-luot span.het{border-color:var(--danger,#B4432A);color:var(--danger,#B4432A)}',
    '.tk-ds{max-height:230px;overflow:auto;border:1px solid var(--line,#ddd);border-radius:12px;margin-top:8px}',
    '.tk-ds button{display:block;width:100%;text-align:left;border:0;border-top:1px solid var(--line,#ddd);background:none;font:inherit;padding:8px 11px;cursor:pointer;color:var(--text,#222)}',
    '.tk-ds button:first-child{border-top:0}',
    '.tk-ds button:hover{background:var(--surface-2,#f3f3f3)}',
    '.tk-ds small{display:block;color:var(--muted,#777);font-size:12px}',
    '.tk-moi{border:1px dashed var(--line-strong,#bbb);border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.55;margin-top:10px}',
    '.tk-moi b{display:block;margin-bottom:2px}',
    '.tk-moi button{margin-top:8px}',
    '.tk-dong{border:0;background:none;font-size:18px;line-height:1;cursor:pointer;color:var(--muted,#777);float:right;padding:0 0 0 8px}'
  ].join('');

  var HS_TRUONG = [
    ['kenh', 'Tên kênh', 'VD: Spa Từ Sơn, Bắc Ninh', 0],
    ['nganh', 'Ngách của kênh', 'VD: Spa chăm sóc mụn và sắc tố da tại Từ Sơn', 1],
    ['doi_tuong', 'Nói với ai', 'VD: Phụ nữ 25–45 trong bán kính 20km quanh Từ Sơn', 1],
    ['dinh_vi', 'Định vị, điều khiến bạn khác người ta', 'VD: Cô chủ spa người Đà Nẵng mở tiệm ở Bắc Ninh, giữ nguyên giọng Đà Nẵng', 1],
    ['muc_tieu', 'Mục tiêu thật của kênh', 'VD: Khách bước vào tiệm, không đuổi view toàn quốc', 0],
    ['xung_ho', 'Xưng hô, giọng kênh', 'VD: mình – các chị', 0],
    ['dang', 'Định dạng video hay quay', 'VD: Vlog trong tiệm lồng tiếng 60%, POV nói về dịch vụ 40%', 0],
    ['do_dai', 'Độ dài video', 'VD: 45–60 giây', 0],
    ['text_batbuoc', 'Chữ bắt buộc trên màn hình', 'VD: Ít nhất một dòng phải có chữ Từ Sơn - Bắc Ninh', 0],
    ['nhac', 'Nhạc hay dùng', 'VD: Nhạc trend nhẹ, ưu tiên Hoà Minzy', 0],
    ['hashtag', 'Caption và hashtag', 'VD: #tuson + 3 hashtag ngành, không nhồi thêm', 0],
    ['khong_lam', 'Tuyệt đối KHÔNG làm', 'VD: Không hứa kết quả, không dùng chữ điều trị, không bật filter làm đẹp', 1],
    ['pillar', 'Cấu trúc pillar', 'VD: Hành trình mở tiệm 70%, da thật ca thật 30%', 0],
    ['san_pham', 'Sản phẩm hoặc dịch vụ', 'VD: Chăm sóc da, nặn mụn, xử lý sắc tố', 0],
    ['ghi_chu', 'Ghi chú vận hành khác', 'VD: 2 video/tuần, đăng 12h–13h và 16h–20h, gắn location tag', 0]
  ];

  var hop = null, oTrang = null, tab = 'signup', dsHv = null;

  function dung() {
    if (hop) return hop;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    hop = document.createElement('div'); hop.className = 'tk-nen'; hop.setAttribute('role', 'dialog'); hop.setAttribute('aria-modal', 'true');
    hop.innerHTML = '<div class="tk-hop" id="tkHop"></div>';
    hop.addEventListener('click', function (e) { if (e.target === hop) dong(); });
    document.body.appendChild(hop);
    oTrang = hop.querySelector('#tkHop');
    return hop;
  }
  function mo(trang, loiNhan) { dung(); ve(trang || (TK.me ? 'home' : 'signup'), loiNhan); hop.classList.add('mo'); }
  function dong() { if (hop) hop.classList.remove('mo'); }

  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function nut(nhan, chinh) { var b = el('button', 'tk-nut' + (chinh ? ' chinh' : ''), nhan); b.type = 'button'; return b; }

  function ve(trang, loiNhan) {
    dung(); oTrang.innerHTML = '';
    var x = el('button', 'tk-dong', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Đóng'); x.onclick = dong; oTrang.appendChild(x);
    if (trang === 'hoso') return veHoSo();
    if (trang === 'pro') return vePro();
    if (trang === 'hv') return veDsHv();
    if (TK.me) return veHome(loiNhan);
    return veDangKy(loiNhan);
  }

  /* ── đăng ký / đăng nhập ── */
  var vai = 'khach';   // khách dùng thử · học viên khoá Tự Mình Xây Kênh
  function veDangKy(loiNhan) {
    oTrang.appendChild(el('h3', null, tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'));
    if (loiNhan) oTrang.appendChild(el('p', 'tk-phu', loiNhan));

    var tabs = el('div', 'tk-tab');
    [['signup', 'Tạo tài khoản'], ['login', 'Đăng nhập']].forEach(function (p) {
      var b = el('button', null, p[1]); b.type = 'button'; b.setAttribute('aria-pressed', String(tab === p[0]));
      b.onclick = function () { tab = p[0]; ve('signup', loiNhan); };
      tabs.appendChild(b);
    });
    oTrang.appendChild(tabs);

    if (tab === 'login') {
      oTrang.appendChild(el('p', 'tk-phu', 'Dùng đúng email và mật khẩu bạn đã đặt. Học viên khoá Tự Mình Xây Kênh đăng nhập ở đây luôn, tài khoản khu học viên dùng được cho cả ba tool.'));
    } else {
      // chọn vai trước, mọi thứ phía dưới đổi theo
      oTrang.appendChild(el('p', 'tk-phu', 'Bạn là ai? Chọn đúng để mình mở đúng quyền.'));
      var chon = el('div', 'tk-tab'); chon.style.display = 'flex'; chon.style.width = '100%';
      [['khach', 'Khách dùng thử'], ['hv', 'Học viên khoá học']].forEach(function (p) {
        var b = el('button', null, p[1]); b.type = 'button'; b.style.flex = '1';
        b.setAttribute('aria-pressed', String(vai === p[0]));
        b.onclick = function () { vai = p[0]; ve('signup', loiNhan); };
        chon.appendChild(b);
      });
      oTrang.appendChild(chon);

      var qua = el('div', 'tk-qua');
      if (vai === 'khach') {
        qua.innerHTML = '🎁 Miễn phí, dùng thử ngay: <b>10 lượt AI phân tích hook</b>, <b>3 lượt chấm kịch bản</b>, <b>1 lượt soi video viral</b>.' +
          '<br>Hết lượt thì nâng cấp Pro' + (nhanGia() ? ' <b>' + nhanGia() + '</b>' : '') + ', hoặc đăng ký khoá học để dùng không giới hạn.';
      } else {
        qua.innerHTML = '🎓 Học viên khoá <b>Tự Mình Xây Kênh</b> dùng cả ba tool không giới hạn, và hồ sơ kênh đã được mentor chốt sẵn nên AI chấm đúng kênh bạn ngay từ lượt đầu.';
      }
      oTrang.appendChild(qua);

      if (vai === 'hv') {
        var h = el('div', 'tk-moi');
        h.appendChild(el('b', null, 'Đã đăng ký khoá rồi?'));
        h.appendChild(document.createTextNode('Mentor duyệt xong là bạn đăng nhập được bằng email đã đăng ký. Chưa có mật khẩu thì tạo ở trang khoá học.'));
        var b1 = nut('Tôi đã có tài khoản, đăng nhập', true); b1.onclick = function () { tab = 'login'; ve('signup'); };
        var b2 = el('a', 'tk-nut', 'Đăng ký khoá học'); b2.href = '../index.html#dangky'; b2.style.textDecoration = 'none';
        var hang0 = el('div', 'tk-hang'); hang0.appendChild(b1); hang0.appendChild(b2);
        h.appendChild(hang0); oTrang.appendChild(h);
        var z0 = zalo();
        if (z0) { var za = el('a', 'tk-phu', 'Cần hỗ trợ? Nhắn mentor trong group Zalo.'); za.href = z0; za.target = '_blank'; za.style.display = 'block'; oTrang.appendChild(za); }
        return;   // vai học viên không có form tạo tài khoản khách
      }
    }

    var f = document.createElement('form'); f.noValidate = true;
    function o(ten, nhan, kieu, tuDien) {
      var l = el('label', null, nhan), i = document.createElement('input');
      i.name = ten; i.type = kieu || 'text'; i.required = true; if (tuDien) i.autocomplete = tuDien;
      if (kieu === 'tel') i.inputMode = 'tel'; if (kieu === 'email') i.inputMode = 'email';
      if (ten === 'pass') i.minLength = 6;
      l.appendChild(i); f.appendChild(l); return i;
    }
    if (tab === 'signup') { o('ten', 'Họ và tên', 'text', 'name'); }
    o('email', 'Email', 'email', 'email');
    if (tab === 'signup') { o('sdt', 'Số điện thoại (Zalo)', 'tel', 'tel'); }
    o('pass', tab === 'signup' ? 'Mật khẩu, ít nhất 6 ký tự' : 'Mật khẩu', 'password', tab === 'signup' ? 'new-password' : 'current-password');

    var gui = nut(tab === 'signup' ? 'Tạo tài khoản và dùng ngay' : 'Đăng nhập', true); gui.className += ' rong'; gui.type = 'submit';
    f.appendChild(gui);
    var tt = el('p', 'tk-tt'); f.appendChild(tt);
    f.onsubmit = async function (e) {
      e.preventDefault();
      var d = {}; ['ten', 'email', 'sdt', 'pass'].forEach(function (k) { var i = f.elements[k]; if (i) d[k] = i.value.trim(); });
      if (tab === 'signup' && (!d.ten || !d.sdt)) { tt.className = 'tk-tt loi'; tt.textContent = 'Điền đủ tên và số điện thoại giúp mình.'; return; }
      if (!d.email || (d.pass || '').length < 6) { tt.className = 'tk-tt loi'; tt.textContent = 'Email và mật khẩu ít nhất 6 ký tự.'; return; }
      gui.disabled = true; tt.className = 'tk-tt'; tt.textContent = 'Đang gửi…';
      try {
        var r = tab === 'signup'
          ? await goi({ action: 'st_signup', ten: d.ten, email: d.email, sdt: d.sdt, pass: d.pass, nguon: 'viral-studio' })
          : await goi({ action: 'st_login', email: d.email, pass: d.pass });
        if (!r.ok) {
          tt.className = 'tk-tt loi';
          tt.textContent = { trung_email: 'Email này đã có tài khoản, chuyển sang tab Đăng nhập nhé.', sai_mk: 'Email hoặc mật khẩu chưa đúng.', thieu: 'Còn thiếu thông tin.', email_sai: 'Email chưa đúng định dạng.', sdt_sai: 'Số điện thoại chưa đúng.' }[r.error] || 'Chưa xong, thử lại giúp mình.';
          return;
        }
        ls.set(ND_KEY, JSON.stringify({ token: r.token }));
        await nap();
        var tam = json(HS_KEY);
        if (tam && Object.keys(tam).length && TK.me && !(TK.me.ho_so && Object.keys(TK.me.ho_so).length)) await luuHoSo(tam);
        tt.className = 'tk-tt ok'; tt.textContent = 'Xong. Chào ' + ((TK.me && TK.me.ten) || '') + '!';
        ve(tab === 'signup' ? 'hoso' : 'home');
      } catch (err) { tt.className = 'tk-tt loi'; tt.textContent = 'Không kết nối được máy chủ.'; }
      finally { gui.disabled = false; }
    };
    oTrang.appendChild(f);
  }

  /* ── trang chính của tài khoản ── */
  function veHome(loiNhan) {
    var a = TK.me;
    oTrang.appendChild(el('h3', null, 'Tài khoản'));
    if (loiNhan) oTrang.appendChild(el('p', 'tk-phu', loiNhan));
    var the = el('div', 'tk-the'), tt = el('div');
    tt.appendChild(el('b', null, a.ten || a.email || ''));
    tt.appendChild(el('small', null, [a.email, a.sdt].filter(Boolean).join(' · ')));
    the.appendChild(tt);
    the.appendChild(el('span', 'tk-goi' + (laPro() ? ' pro' : ''), a.loai === 'hv' ? 'Học viên' : (a.pro ? '✦ Pro' : 'Free')));
    oTrang.appendChild(the);

    if (!laPro()) {
      var lu = el('div', 'tk-luot'), l = a.luot || {}, h = a.han || {};
      [['hook', 'Hook'], ['script', 'Kịch bản'], ['soi', 'Soi video']].forEach(function (p) {
        var con = l[p[0]], sp = el('span', con === 0 ? 'het' : null, p[1] + ': còn ' + (con == null ? '?' : con) + '/' + (h[p[0]] == null ? '?' : h[p[0]]));
        lu.appendChild(sp);
      });
      oTrang.appendChild(lu);
      var up = el('div', 'tk-moi');
      up.appendChild(el('b', null, '✦ Nâng cấp Pro' + (nhanGia() ? ' · ' + nhanGia() : '')));
      up.appendChild(document.createTextNode('Dùng cả ba tool thoải mái theo hạn mức ngày, không còn đếm lượt. Chuyển khoản xong mentor mở trong ngày.'));
      var bu = nut('Xem cách chuyển khoản', true); bu.onclick = function () { ve('pro'); };
      up.appendChild(bu); oTrang.appendChild(up);
    }

    var hs = (a.ho_so && Object.keys(a.ho_so).length) ? a.ho_so : null;
    var moi = el('div', 'tk-moi');
    moi.appendChild(el('b', null, hs ? '📋 Hồ sơ kênh: ' + (hs.nganh || hs.kenh || 'đã điền') : '📋 Chưa có hồ sơ kênh'));
    moi.appendChild(document.createTextNode(hs
      ? 'Ba tool đang bám theo hồ sơ này. Sửa lại bất cứ lúc nào.'
      : 'Điền một lần, cả ba tool sẽ chấm đúng ngách, đúng tệp, đúng xưng hô và tránh mấy điều kênh bạn không được nói.'));
    var sua = nut(hs ? 'Xem và sửa hồ sơ kênh' : 'Điền hồ sơ kênh', !hs); sua.onclick = function () { ve('hoso'); };
    moi.appendChild(sua); oTrang.appendChild(moi);

    if (laMentor()) {
      var m = el('div', 'tk-moi');
      m.appendChild(el('b', null, '🎓 Mentor'));
      m.appendChild(document.createTextNode('Xem tài khoản học viên, mượn hồ sơ của họ để chạy thử tool.'));
      var b = nut('Danh sách học viên'); b.onclick = function () { ve('hv'); };
      m.appendChild(b); oTrang.appendChild(m);
    }
    if (TK.vaiHoSo) {
      var v = el('p', 'tk-tt ok'); v.textContent = '▶ Đang chạy thử bằng hồ sơ của ' + TK.vaiHoSo.ten + '.';
      oTrang.appendChild(v);
      var bo = nut('Thôi, dùng hồ sơ của mình'); bo.onclick = function () { TK.vaiHoSo = null; bao(); ve('home'); };
      oTrang.appendChild(bo);
    }

    var hang = el('div', 'tk-hang');
    var ra = nut('Đăng xuất'); ra.onclick = function () { ls.del(ND_KEY); ls.del(HV_KEY); TK.me = null; TK.vaiHoSo = null; bao(); ve('signup'); };
    hang.appendChild(ra); oTrang.appendChild(hang);
  }

  /* ── nâng cấp Pro: tạo mã chuyển khoản rồi hiện số tài khoản ── */
  async function vePro() {
    oTrang.appendChild(el('h3', null, 'Nâng cấp Pro'));
    var g = goiPro();
    oTrang.appendChild(el('p', 'tk-phu', g.gia
      ? 'Gói ' + g.ten + ' · ' + tien(g.gia) + '. Chuyển khoản đúng nội dung bên dưới, mentor xác nhận là Pro mở ngay.'
      : 'Mentor chưa cài giá gói Pro. Nhắn mentor giúp mình.'));
    var o = el('div'); oTrang.appendChild(o);
    o.appendChild(el('p', 'tk-tt', 'Đang tạo mã chuyển khoản…'));
    try {
      var r = await goi({ action: 'st_buy', token: token() });
      o.innerHTML = '';
      if (!r.ok) {
        o.appendChild(el('p', 'tk-tt loi', r.error === 'chua_cai_bank'
          ? 'Mentor chưa cài tài khoản nhận tiền. Nhắn mentor giúp mình.' : 'Chưa tạo được mã, thử lại sau.'));
      } else {
        var b = r.bank || {};
        if (r.qr) { var im = new Image(); im.src = r.qr; im.alt = 'Mã QR chuyển khoản'; im.style.cssText = 'width:100%;max-width:230px;display:block;margin:0 auto 10px;border-radius:12px'; o.appendChild(im); }
        [['Ngân hàng', b.ngan_hang], ['Số tài khoản', b.stk], ['Chủ tài khoản', b.chu_tk], ['Số tiền', tien(r.so_tien)], ['Nội dung', r.ma_ck]].forEach(function (d) {
          if (!d[1]) return;
          var row = el('div', 'tk-the'); var t2 = el('div');
          t2.appendChild(el('small', null, d[0])); t2.appendChild(el('b', null, String(d[1])));
          row.appendChild(t2);
          var c = nut('Chép'); c.style.marginLeft = 'auto';
          c.onclick = function () { try { navigator.clipboard.writeText(String(d[1])); c.textContent = 'Đã chép'; setTimeout(function () { c.textContent = 'Chép'; }, 1200); } catch (e) { } };
          row.appendChild(c); o.appendChild(row);
        });
        o.appendChild(el('p', 'tk-phu', 'Quét QR bằng app ngân hàng là tự điền đủ. Ghi đúng nội dung để mentor đối chiếu.'));
        var xong = nut('Tôi đã chuyển khoản', true); xong.className += ' rong';
        var tt2 = el('p', 'tk-tt');
        xong.onclick = async function () {
          xong.disabled = true; tt2.className = 'tk-tt'; tt2.textContent = 'Đang báo cho mentor…';
          try {
            var r2 = await goi({ action: 'st_paid', token: token(), ma_ck: r.ma_ck });
            tt2.className = 'tk-tt ok';
            tt2.innerHTML = r2.ok
              ? 'Đã báo mentor. Thường trong ngày là xong.' + (zalo() ? ' Lâu quá thì nhắn trong <a href="' + zalo() + '" target="_blank" rel="noopener"><b>group Zalo</b></a> nhé.' : '')
              : 'Chưa gửi được, thử lại giúp mình.';
          } catch (e) { tt2.className = 'tk-tt loi'; tt2.textContent = 'Không kết nối được máy chủ.'; }
          finally { xong.disabled = false; }
        };
        o.appendChild(xong); o.appendChild(tt2);
      }
    } catch (e) { o.innerHTML = ''; o.appendChild(el('p', 'tk-tt loi', 'Không kết nối được máy chủ.')); }
    var q = nut('Quay lại'); q.onclick = function () { ve('home'); }; oTrang.appendChild(q);
  }

  /* ── hồ sơ kênh ── */
  function veHoSo() {
    var v = TK.vaiHoSo;
    oTrang.appendChild(el('h3', null, v ? 'Hồ sơ kênh · ' + v.ten : 'Hồ sơ kênh'));
    if (v) oTrang.appendChild(el('p', 'tk-phu', 'Bạn đang điền hộ ' + v.ten + (v.email ? ' (' + v.email + ')' : '') + '. Lưu xong, học viên đăng nhập là tool đã bám theo hồ sơ này.'));
    oTrang.appendChild(el('p', 'tk-phu', TK.me
      ? 'Điền được tới đâu hay tới đó. Tool đọc hồ sơ này để chấm đúng kênh bạn, không góp ý chung chung.'
      : 'Bạn chưa đăng nhập nên hồ sơ chỉ lưu trong máy này. Tạo tài khoản để lưu lại và dùng trên máy khác.'));
    var hs = hoSo(), o = {};
    var f = document.createElement('form'); f.noValidate = true;
    HS_TRUONG.forEach(function (t) {
      var l = el('label', null, t[1] + (t[3] ? ' ★' : ''));
      var i = document.createElement(t[3] || t[0] === 'pillar' || t[0] === 'ghi_chu' ? 'textarea' : 'input');
      i.placeholder = t[2]; i.value = hs[t[0]] || ''; o[t[0]] = i;
      l.appendChild(i); f.appendChild(l);
    });
    var tt = el('p', 'tk-tt');
    var luu = nut('Lưu hồ sơ', true); luu.className += ' rong'; luu.type = 'submit';
    f.appendChild(luu); f.appendChild(tt);
    f.onsubmit = async function (e) {
      e.preventDefault();
      var m = {}; Object.keys(o).forEach(function (k) { var v = o[k].value.trim(); if (v) m[k] = v; });
      luu.disabled = true; tt.className = 'tk-tt'; tt.textContent = 'Đang lưu…';
      try {
        if (TK.me) { var r = await luuHoSo(m); if (!r) { tt.className = 'tk-tt loi'; tt.textContent = 'Chưa lưu được, thử lại.'; return; } }
        else luuHoSoTam(m);
        tt.className = 'tk-tt ok'; tt.textContent = 'Đã lưu. Các tool sẽ dùng hồ sơ này ngay.';
        bao();
        setTimeout(dong, 700);   // đóng hẳn để học viên quay lại việc đang làm
      } catch (err) { tt.className = 'tk-tt loi'; tt.textContent = 'Không kết nối được máy chủ.'; }
      finally { luu.disabled = false; }
    };
    oTrang.appendChild(f);
    var q = nut('Quay lại'); q.onclick = function () { ve(TK.me ? 'home' : 'signup'); };
    oTrang.appendChild(q);
  }
  async function luuHoSo(hs) {
    var v = TK.vaiHoSo;
    var r = await goi({ action: 'st_hoso', token: token(), ho_so: hs,
      ma: v && v.ma ? v.ma : undefined,
      email_dich: v && !v.ma ? v.email : undefined,
      sdt_dich: v && !v.ma ? v.sdt : undefined,
      ten_dich: v ? v.ten : undefined });
    if (!r.ok) return null;
    if (TK.vaiHoSo) TK.vaiHoSo.ho_so = r.ho_so; else if (TK.me) TK.me.ho_so = r.ho_so;
    bao(); return r.ho_so;
  }

  /* ── mentor: danh sách học viên ── */
  var NGUON_TEN = { tai_khoan: 'tài khoản Studio', form_dang_ky: 'form đăng ký khoá', sua_tay: 'đã sửa tay', mentor: 'mentor điền', mau: 'hồ sơ mẫu' };
  async function veDsHv(loi) {
    oTrang.appendChild(el('h3', null, 'Học viên'));
    oTrang.appendChild(el('p', 'tk-phu', 'Gồm cả người mới điền form đăng ký khoá, chưa tạo tài khoản Viral Studio. Bấm một người để mượn hồ sơ kênh của họ rồi chạy thử tool y như họ đang dùng.'));
    var box = el('div', 'tk-ds'); oTrang.appendChild(box);
    box.appendChild(el('p', 'tk-tt', 'Đang tải…'));
    try {
      if (!dsHv) {
        var r = await goi({ action: 'st_ds', token: token() });
        if (!r.ok) {
          box.innerHTML = '';
          box.appendChild(el('p', 'tk-tt loi', r.error === 'unknown_action'
            ? 'Máy chủ đang chạy Studio.gs bản cũ nên chưa có danh sách này. Dán Studio.gs mới vào Apps Script rồi Deploy, nhớ chọn New version.'
            : r.error === 'khong_co_quyen' ? 'Tài khoản này không phải mentor.' : 'Không tải được danh sách.'));
          var q0 = nut('Quay lại'); q0.onclick = function () { ve('home'); }; oTrang.appendChild(q0);
          return;
        }
        dsHv = r.ds || [];
      }
      box.innerHTML = '';
      if (!dsHv.length) box.appendChild(el('p', 'tk-tt', 'Chưa có ai trong bảng tài khoản lẫn bảng đăng ký khoá.'));
      dsHv.slice().reverse().forEach(function (x) {
        var b = document.createElement('button'); b.type = 'button';
        b.appendChild(el('b', null, (x.goi === 'pro' ? '✦ ' : x.goi === 'dk' ? '📝 ' : '') + x.ten));
        var mo = x.so_truong
          ? 'hồ sơ ' + x.so_truong + ' mục' + (NGUON_TEN[x.ho_so_nguon] ? ' (' + NGUON_TEN[x.ho_so_nguon] + ')' : '') + (x.ho_so.nganh ? ' · ' + x.ho_so.nganh : '')
          : 'chưa có hồ sơ kênh';
        b.appendChild(el('small', null, [x.email || x.sdt, x.goi === 'dk' ? 'chưa có tài khoản Studio' : '', mo].filter(Boolean).join(' · ')));
        b.onclick = function () {
          if (!x.so_truong) { TK.vaiHoSo = null; bao(); moSuaHo(x); return; }
          TK.vaiHoSo = x; bao(); ve('home');
        };
        box.appendChild(b);
      });
    } catch (e) { box.innerHTML = ''; box.appendChild(el('p', 'tk-tt loi', 'Không kết nối được máy chủ.')); }
    var hang = el('div', 'tk-hang');
    var lam = nut('Tải lại'); lam.onclick = function () { dsHv = null; ve('hv'); };
    var q = nut('Quay lại'); q.onclick = function () { ve('home'); };
    hang.appendChild(lam); hang.appendChild(q); oTrang.appendChild(hang);
  }
  /* Mentor điền hộ hồ sơ cho người chưa có: mở đúng form hồ sơ, lưu theo email của họ. */
  function moSuaHo(x) {
    TK.vaiHoSo = { ma: x.ma || '', ten: x.ten, email: x.email, sdt: x.sdt, ho_so: x.ho_so || {}, dienHo: true };
    bao(); ve('hoso');
  }

  /* ── cấu hình bán Pro: giá, số ngày, link Zalo. Mentor đổi bằng bot: /giapro /ngaypro /zalo ── */
  async function napCfg() {
    if (TK.cfg) return TK.cfg;
    try { var r = await goi({ action: 'st_cfg' }); if (r.ok) TK.cfg = r; } catch (e) { }
    return TK.cfg;
  }
  function goiPro() { return (TK.cfg && TK.cfg.goi && TK.cfg.goi[0]) || { ten: 'Pro', gia: 0, ngay: 0 }; }
  function tien(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
  function nhanGia() { var g = goiPro(); return g.gia ? tien(g.gia) + (g.ten ? ' · ' + g.ten.replace(/^Pro /, '') : '') : ''; }
  function zalo() { return (TK.cfg && TK.cfg.zalo) || ''; }

  /* ── nạp hồ sơ tài khoản ── */
  async function nap() {
    var t = token();
    if (!t) { TK.me = null; bao(); return null; }
    try {
      var r = await goi({ action: 'st_me', token: t });
      if (r.ok && r.ho_so) { TK.me = r.ho_so; } else { TK.me = null; if (r.error === 'het_phien') { ls.del(ND_KEY); ls.del(HV_KEY); } }
    } catch (e) { }
    bao(); return TK.me;
  }
  function bao() { if (typeof TK.onDoi === 'function') { try { TK.onDoi(TK.me); } catch (e) { } } }

  /* ── cổng chặn trước khi gọi AI ── */
  async function canCo(tool) {
    tool = tool || TK.tool;
    if (!token()) {
      mo('signup', 'Tạo tài khoản miễn phí để dùng ' + (TOOL_TEN[tool] || 'AI') + '. Mất 30 giây, có ngay lượt dùng thử và AI sẽ bám đúng kênh của bạn.');
      return false;
    }
    if (!TK.me) await nap();
    if (!TK.me) { mo('signup', 'Phiên đăng nhập đã hết hạn, đăng nhập lại giúp mình.'); return false; }
    if (!laPro()) {
      var con = luotCon(tool);
      if (con === 0) { mo('home', 'Bạn đã dùng hết lượt ' + (TOOL_TEN[tool] || '') + ' miễn phí. Đăng ký học viên để dùng không giới hạn.'); return false; }
    }
    return true;
  }

  /* ── ô mời điền hồ sơ, gắn vào form của tool ── */
  function oMoiHoSo(dich) {
    if (!dich) return;
    var v = el('div', 'tk-moi'); v.id = 'tkMoiHoSo';
    function ve2() {
      v.innerHTML = '';
      var hs = hoSo(), co = Object.keys(hs).length;
      if (TK.vaiHoSo) {
        v.appendChild(el('b', null, '🎓 Đang chạy thử bằng hồ sơ của ' + TK.vaiHoSo.ten));
        v.appendChild(document.createTextNode('Mọi góp ý của AI sẽ bám theo kênh của học viên này.'));
        var b0 = nut('Đổi lại hồ sơ của mình'); b0.onclick = function () { TK.vaiHoSo = null; bao(); ve2(); }; v.appendChild(b0);
        return;
      }
      if (co) {
        var ng = TK.me && TK.me.ho_so_nguon === 'form_dang_ky' ? ' · lấy từ form đăng ký khoá của bạn' : '';
        v.appendChild(el('b', null, '📋 Đang cá nhân hoá theo kênh của bạn' + (hs.nganh ? ': ' + hs.nganh : '') + ng));
        v.appendChild(document.createTextNode('AI chấm theo đúng ngách, tệp, xưng hô và mấy điều kênh bạn không được nói.'));
        var b1 = nut('Sửa hồ sơ kênh'); b1.onclick = function () { mo('hoso'); }; v.appendChild(b1);
      } else {
        v.appendChild(el('b', null, '📋 Bạn là học viên? Hồ sơ kênh của bạn sẽ được điền sẵn ở đây'));
        v.appendChild(document.createTextNode('Điền một lần ngách, tệp, xưng hô và điều cấm của kênh, cả ba tool sẽ góp ý đúng kênh bạn thay vì nói chung chung. Học viên khoá Tự Mình Xây Kênh đã được mentor chốt sẵn, chỉ cần đăng nhập.'));
        var b2 = nut(TK.me ? 'Điền hồ sơ kênh' : 'Tạo tài khoản, điền hồ sơ', true); b2.onclick = function () { mo(TK.me ? 'hoso' : 'signup'); }; v.appendChild(b2);
      }
    }
    ve2(); dich.appendChild(v);
    TK._veMoi = ve2;
    return v;
  }

  /* ── khởi động ── */
  function khoiDong(opt) {
    opt = opt || {};
    TK.api = opt.api || TK.api; TK.tool = opt.tool || TK.tool;
    var cu = opt.onDoi;
    TK.onDoi = function (me) { if (TK._veMoi) { try { TK._veMoi(); } catch (e) { } } veNutPro(); if (cu) cu(me); };
    napCfg().then(veNutPro);
    nap();
    return TK;
  }

  /* Nút Nâng cấp Pro ở góc màn hình, chỉ hiện với tài khoản đang dùng thử. */
  var nutPro = null;
  function veNutPro() {
    var can = TK.me && !laPro();
    if (!can) { if (nutPro) nutPro.remove(), nutPro = null; return; }
    if (!nutPro) {
      nutPro = document.createElement('button'); nutPro.type = 'button'; nutPro.id = 'tkNutPro';
      nutPro.style.cssText = 'position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:40;' +
        'border:0;border-radius:999px;padding:11px 16px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;' +
        'background:var(--pro,#26210F);color:var(--pro-text,#F9E8DD);box-shadow:0 8px 22px rgba(0,0,0,.22)';
      nutPro.onclick = function () { mo('pro'); };
      document.body.appendChild(nutPro);
    }
    nutPro.textContent = '✦ Nâng cấp Pro' + (nhanGia() ? ' · ' + nhanGia() : '');
  }

  global.TK = {
    khoiDong: khoiDong, nap: nap, mo: mo, dong: dong, canCo: canCo,
    token: token, dev: dev, hoSo: hoSo, luuHoSoTam: luuHoSoTam,
    laPro: laPro, laMentor: laMentor, luotCon: luotCon, oMoiHoSo: oMoiHoSo, zalo: zalo, giaPro: nhanGia,
    get me() { return TK.me; }, get vai() { return TK.vaiHoSo; },
    dat: function (k, v) { TK[k] = v; }
  };
})(window);
