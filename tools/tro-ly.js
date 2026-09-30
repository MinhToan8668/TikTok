/* ═══════════════════════════════════════════════════════════════
   TRỢ LÝ AI — khung trò chuyện dùng chung cho 5 tool của Viral Studio.
   Gõ hoặc nói (mic), nghe trả lời đọc to, chế độ "Nói chuyện" rảnh tay.
   Trợ lý đọc được kết quả đang hiện ở tool và hồ sơ kênh, nên hỏi "giải thích giúp mình
   điểm hook này" là nó biết đang nói tới cái gì.
   Mentor có thêm: Chế độ dạy AI · Góp ý dưới từng câu trả lời · Bộ nhớ AI (duyệt, tắt, xoá bài học).
   Cần tai-khoan.js (window.TK) nạp trước. Máy chủ: TroLy.gs.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  var TK = global.TK; if (!TK) return;
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  function json(k, md) { try { var v = JSON.parse(ls.get(k) || 'null'); return v == null ? md : v; } catch (e) { return md; } }

  var LS_KEY = 'vs_tl_ls', DOC_KEY = 'vs_tl_doc', DAY_KEY = 'vs_tl_day';
  var TEN_TOOL = { soi: 'Soi video viral', script: 'Kịch bản viral', hook: 'Hook viral', cham: 'Chấm video của bạn', taive: 'Tải video' };
  var GOI_Y_DAU = {
    soi: ['Giải thích kết quả soi này dễ hiểu giúp mình', 'Video này mình mượn được gì cho kênh mình?', 'Tuần này mình nên quay gì?'],
    script: ['Kịch bản của mình yếu nhất ở đâu?', 'Viết lại giúp mình phần mở đầu', 'Làm sao để người xem ở lại tới cuối?'],
    hook: ['Hook này sao chưa dừng được người xem?', 'Cho mình 5 hook khác cùng ý', 'Chữ hook nên đặt chỗ nào?'],
    cham: ['Giải thích điểm chấm này giúp mình', 'Mình nên sửa gì trước tiên?', 'Lần quay sau mình cần nhớ gì?'],
    taive: ['Nên tìm video mẫu thế nào cho đúng ngách?', 'Tải về rồi mình soi video này ra sao?'],
    chung: ['Kênh mình nên bắt đầu từ đâu?', 'Làm sao để video đầu tiên có view?']
  };
  var LOI = {
    het_luot_chat: 'Hôm nay bạn đã chat hết số tin trong ngày, mai quay lại nhé.',
    het_luot: 'Hết lượt AI hôm nay, mai quay lại nhé.',
    het_phien: 'Phiên đăng nhập hết hạn. Đăng nhập lại giúp mình.',
    het_han_hv: 'Gói Pro dành cho học viên đã hết hạn. Nâng cấp Pro để dùng tiếp.',
    can_dangky: 'Tạo tài khoản miễn phí để trò chuyện với trợ lý.',
    ban_qua: 'AI của Google đang quá tải, đợi vài giây rồi gửi lại nhé.',
    het_gio: 'AI trả lời quá lâu, gửi lại giúp mình.',
    can_gemini: 'Máy chủ đang chạy Claude, phần nghe giọng nói cần GEMINI_API_KEY. Gõ chữ thay nhé.',
    am_thanh_dai: 'Đoạn ghi âm dài quá, nói ngắn hơn 1 phút nhé.',
    chua_cai_key: 'Máy chủ chưa cài khoá AI. Báo mentor.',
    sai_key: 'Khoá AI trên máy chủ không hợp lệ. Báo mentor.',
    tu_choi: 'AI không trả lời được câu này, thử hỏi cách khác.',
    thieu_text: 'Bạn chưa nói hoặc gõ gì.',
    unknown_action: 'Máy chủ chưa cập nhật phần Trợ lý. Mentor dán TroLy.gs và HookAI.gs mới rồi Deploy.',
    can_pro: 'Tính năng này dành cho Pro.'
  };

  var CSS = [
    '.tl-fab{position:fixed;left:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);z-index:54;display:flex;align-items:center;gap:8px;border:2px solid #1c2600;background:#99DF00;color:#1c2600;font:inherit;font-weight:800;font-size:14.5px;border-radius:999px;padding:11px 16px 11px 12px;cursor:pointer;box-shadow:0 4px 0 rgba(28,38,0,.55)}',
    '.tl-fab:hover{transform:translateY(-2px);box-shadow:0 6px 0 rgba(28,38,0,.55)}',
    '.tl-fab .tl-dot{width:28px;height:28px;border-radius:50%;background:#1c2600;color:#99DF00;display:grid;place-items:center;font-size:15px;position:relative}',
    '.tl-fab .tl-dot::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #1c2600;opacity:.5;animation:tlSong 2s ease-out infinite}',
    '@keyframes tlSong{0%{transform:scale(.8);opacity:.6}100%{transform:scale(1.35);opacity:0}}',
    '@media (prefers-reduced-motion:reduce){.tl-fab .tl-dot::after{animation:none}}',
    '.tl-fab.an{display:none}',
    '@media (max-width:560px){.tl-fab{padding:6px;gap:0}.tl-fab>span:last-child{display:none}.tl-fab .tl-dot{width:40px;height:40px;font-size:20px}}',   // điện thoại: chỉ còn nút tròn, đỡ che form
    '.tl-hop{position:fixed;left:16px;bottom:16px;z-index:56;width:min(420px,calc(100vw - 32px));height:min(680px,calc(100vh - 32px));background:var(--surface,#fff);color:var(--text,#222);border:2px solid var(--text,#222);border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;font-size:14px}',
    '.tl-hop.mo{display:flex}',
    '@media (max-width:560px){.tl-hop{left:0;right:0;top:0;bottom:0;width:100%;height:100%;height:100dvh;border-radius:0;border:0}}',
    '.tl-dau{display:flex;align-items:center;gap:8px;padding:12px 12px 10px 14px;border-bottom:1px solid var(--line,#ddd);background:var(--surface-2,#f5f5f5)}',
    '.tl-dau .tl-av{width:34px;height:34px;border-radius:50%;background:#1c2600;color:#99DF00;display:grid;place-items:center;font-size:17px;flex:none}',
    '.tl-dau b{display:block;font-size:14.5px;line-height:1.2}',
    '.tl-dau small{display:block;font-size:11.5px;color:var(--muted,#666);line-height:1.3}',
    '.tl-dau .tl-nuts{margin-left:auto;display:flex;gap:4px}',
    '.tl-ic{border:1px solid var(--line,#ddd);background:var(--surface,#fff);color:var(--text,#222);border-radius:10px;min-width:34px;height:34px;font:inherit;font-size:15px;cursor:pointer;display:grid;place-items:center;padding:0 6px}',
    '.tl-ic[aria-pressed="true"]{background:#1c2600;color:#99DF00;border-color:#1c2600}',
    '.tl-mentor{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px dashed var(--line,#ddd);font-size:12.5px;align-items:center}',
    '.tl-mentor button{font:inherit;font-size:12.5px;font-weight:700;border:1.5px solid var(--text,#222);border-radius:999px;padding:5px 11px;background:var(--surface,#fff);color:var(--text,#222);cursor:pointer}',
    '.tl-mentor button[aria-pressed="true"]{background:#ff4d1f;border-color:#ff4d1f;color:#fff}',
    '.tl-mentor .tl-day-note{flex-basis:100%;color:#b4432a;font-weight:600}',
    '.tl-ds{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}',
    '.tl-m{max-width:88%;padding:9px 12px;border-radius:14px;line-height:1.5;word-wrap:break-word}',
    '.tl-m.nd{align-self:flex-end;background:#1c2600;color:#F3F0E4;border-bottom-right-radius:4px}',
    '.tl-m.nd.day{background:#ff4d1f;color:#fff}',
    '.tl-m.ai{align-self:flex-start;background:var(--surface-2,#f1f1f1);border:1px solid var(--line,#ddd);border-bottom-left-radius:4px}',
    '.tl-m.ai ul{margin:4px 0;padding-left:18px}',
    '.tl-m.ai p{margin:0 0 6px}.tl-m.ai p:last-child{margin:0}',
    '.tl-m small.tl-ghi{display:block;font-size:11.5px;opacity:.75;margin-top:4px}',
    '.tl-hd{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}',
    '.tl-hd button{border:0;background:transparent;color:var(--muted,#666);font:inherit;font-size:12px;cursor:pointer;padding:2px 6px;border-radius:6px}',
    '.tl-hd button:hover{background:var(--line,#ddd);color:var(--text,#222)}',
    '.tl-hd button.on{color:var(--text,#222);font-weight:700}',
    '.tl-bh{align-self:stretch;font-size:12.5px;background:var(--accent-soft,#eef8d0);border:1px dashed var(--line-strong,#5f8c00);border-radius:10px;padding:7px 10px}',
    '.tl-gy{margin-top:8px;display:grid;gap:6px}',
    '.tl-gy textarea{width:100%;font:inherit;font-size:13.5px;border:1px solid var(--line,#ddd);border-radius:10px;padding:8px;background:var(--surface,#fff);color:var(--text,#222);min-height:64px;resize:vertical}',
    '.tl-gy .tl-row{display:flex;gap:6px}',
    '.tl-gy .tl-row button{flex:1}',
    '.tl-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 8px}',
    '.tl-chips button{font:inherit;font-size:12.5px;border:1px dashed var(--line-strong,#5f8c00);background:transparent;color:var(--text,#222);border-radius:999px;padding:5px 11px;cursor:pointer;text-align:left}',
    '.tl-nhap{display:flex;gap:6px;align-items:flex-end;padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);border-top:1px solid var(--line,#ddd);background:var(--surface,#fff)}',
    '.tl-nhap textarea{flex:1;font:inherit;font-size:15px;border:2px solid var(--text,#222);border-radius:14px;padding:9px 12px;resize:none;max-height:140px;min-height:44px;background:var(--surface-2,#f5f5f5);color:var(--text,#222);line-height:1.4}',
    '@media (max-width:560px){.tl-nhap textarea{font-size:16px}}',
    '.tl-mic,.tl-gui{width:44px;height:44px;border-radius:50%;border:2px solid #1c2600;font-size:18px;cursor:pointer;flex:none;display:grid;place-items:center;box-shadow:0 3px 0 rgba(28,38,0,.5)}',
    '.tl-mic{background:#99DF00;color:#1c2600}',
    '.tl-mic.nghe{background:#ff4d1f;color:#fff;border-color:#7a1e00;animation:tlNghe 1.2s ease-in-out infinite}',
    '@keyframes tlNghe{0%,100%{box-shadow:0 0 0 0 rgba(255,77,31,.55)}50%{box-shadow:0 0 0 9px rgba(255,77,31,0)}}',
    '.tl-gui{background:#1c2600;color:#99DF00}',
    '.tl-gui:disabled,.tl-mic:disabled{opacity:.5;cursor:default}',
    '.tl-tt{font-size:12px;color:var(--muted,#666);padding:0 14px 6px;min-height:0}',
    '.tl-tt:empty{display:none}',
    '.tl-cho{display:inline-flex;gap:4px}.tl-cho i{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.4;animation:tlCho 1s infinite}.tl-cho i:nth-child(2){animation-delay:.15s}.tl-cho i:nth-child(3){animation-delay:.3s}',
    '@keyframes tlCho{50%{opacity:1;transform:translateY(-3px)}}',
    '.tl-bn{flex:1;overflow-y:auto;padding:12px;display:none;flex-direction:column;gap:8px}',
    '.tl-hop.bo-nho .tl-bn{display:flex}.tl-hop.bo-nho .tl-ds,.tl-hop.bo-nho .tl-chips,.tl-hop.bo-nho .tl-nhap,.tl-hop.bo-nho .tl-tt{display:none}',
    '.tl-bn .tl-the{border:1px solid var(--line,#ddd);border-radius:12px;padding:9px 11px;font-size:13px;line-height:1.5}',
    '.tl-bn .tl-the.cho{border:2px solid #ff4d1f}',
    '.tl-bn .tl-the.off{opacity:.55}',
    '.tl-bn .tl-the small{display:block;color:var(--muted,#666);font-size:11.5px;margin-top:3px}',
    '.tl-bn .tl-the .tl-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}',
    '.tl-bn .tl-the .tl-row button{font:inherit;font-size:12px;font-weight:700;border:1px solid var(--line-strong,#5f8c00);background:var(--surface,#fff);color:var(--text,#222);border-radius:8px;padding:4px 10px;cursor:pointer}',
    '.tl-nut{font:inherit;font-weight:800;border:2px solid #1c2600;border-radius:10px;padding:8px 12px;cursor:pointer;background:#99DF00;color:#1c2600}',
    '.tl-nut.phu{background:var(--surface,#fff);color:var(--text,#222)}'
  ].join('');

  var st = {
    ls: json(LS_KEY, []), dang: false, doc: ls.get(DOC_KEY) === '1', day: ls.get(DAY_KEY) === '1',
    hoiThoai: false, nghe: false, rec: null, mr: null
  };
  var hop, dsEl, nhap, micBtn, guiBtn, ttEl, chipsEl, bnEl, fab;

  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function nut(txt, c, fn, tieuDe) { var b = el('button', c, txt); b.type = 'button'; if (tieuDe) { b.title = tieuDe; b.setAttribute('aria-label', tieuDe); } if (fn) b.onclick = fn; return b; }
  function luu() { st.ls = st.ls.slice(-40); ls.set(LS_KEY, JSON.stringify(st.ls)); }
  function toolHienTai() { return TK.tool === 'hook' || TK.tool === 'script' || TK.tool === 'soi' || TK.tool === 'cham' || TK.tool === 'taive' ? TK.tool : 'chung'; }

  /* kết quả đang hiện ở tool → ngữ cảnh cho trợ lý */
  function nguCanh() {
    var tool = toolHienTai(), kq = '';
    try {
      if (typeof global.VS_TRO_LY_NGU_CANH === 'function') kq = String(global.VS_TRO_LY_NGU_CANH() || '');
      else {
        var k = { soi: ['soi.kq', 'soi.draft'], cham: ['cham.kq', 'cham.draft'], script: ['kb.kq', 'kb.draft'], hook: ['hook.text'], taive: ['tv.lichsu'] }[tool] || [];
        kq = k.map(function (x) { var v = ls.get(x); return v ? x + ': ' + v : ''; }).filter(Boolean).join('\n');
        if (tool === 'hook') { var sh = document.querySelector('#aiSheet'); if (sh && sh.innerText) kq += '\nKết quả Trợ lý hook đang mở: ' + sh.innerText; }
      }
    } catch (e) { }
    return { tool: tool, ket_qua: kq.replace(/"data:[^"]{200,}"/g, '"(ảnh)"').slice(0, 7000) };
  }

  /* markdown tối giản → HTML an toàn */
  function veChu(t) {
    var esc = String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var dong = esc.split(/\n/), out = [], ul = false;
    dong.forEach(function (d) {
      var li = d.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (li) { if (!ul) { out.push('<ul>'); ul = true; } out.push('<li>' + li[1] + '</li>'); return; }
      if (ul) { out.push('</ul>'); ul = false; }
      if (d.trim()) out.push('<p>' + d + '</p>');
    });
    if (ul) out.push('</ul>');
    return out.join('').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  }
  function chuTron(t) { return String(t || '').replace(/\*\*/g, '').replace(/^\s*[-•*]\s+/gm, '').replace(/[#_`>]/g, ''); }

  /* ── đọc to ── */
  var giongVi = null;
  function timGiong() {
    try { var v = speechSynthesis.getVoices(); giongVi = v.filter(function (x) { return /^vi/i.test(x.lang); })[0] || null; } catch (e) { }
    return giongVi;
  }
  if (global.speechSynthesis) { timGiong(); try { speechSynthesis.onvoiceschanged = timGiong; } catch (e) { } }
  function docTo(t, xong) {
    if (!global.speechSynthesis) { if (xong) xong(); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(chuTron(t).slice(0, 1500));
      u.lang = 'vi-VN'; if (giongVi || timGiong()) u.voice = giongVi; u.rate = 1.05;
      u.onend = u.onerror = function () { if (xong) xong(); };
      speechSynthesis.speak(u);
    } catch (e) { if (xong) xong(); }
  }
  function ngungDoc() { try { speechSynthesis.cancel(); } catch (e) { } }

  /* ── nghe: SpeechRecognition nếu trình duyệt có, không thì ghi âm gửi AI nghe ── */
  var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
  function batNghe(onChu, onXong) {
    ngungDoc();
    if (SR) {
      var r = new SR(); r.lang = 'vi-VN'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
      var chot = '';
      r.onresult = function (e) {
        var tam = ''; chot = '';
        for (var i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) chot += e.results[i][0].transcript; else tam += e.results[i][0].transcript; }
        onChu((chot + ' ' + tam).trim());
      };
      r.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') tt('Trình duyệt chưa cho dùng micro. Bấm biểu tượng ổ khoá cạnh thanh địa chỉ → cho phép Micro.'); else if (e.error === 'no-speech') tt('Chưa nghe thấy gì, bấm mic nói lại nhé.'); };
      r.onend = function () { st.nghe = false; st.rec = null; veMic(); onXong({ chu: chot.trim() }); };
      try { r.start(); st.rec = r; st.nghe = true; veMic(); tt('🎙️ Đang nghe… nói xong tự gửi.'); } catch (e) { tt('Không bật được micro.'); }
      return;
    }
    if (!navigator.mediaDevices || !global.MediaRecorder) { tt('Trình duyệt này chưa hỗ trợ nói. Gõ chữ thay nhé.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (luong) {
      var mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].filter(function (m) { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } })[0] || '';
      var mr = new MediaRecorder(luong, mime ? { mimeType: mime } : undefined), khuc = [], t0 = Date.now(), dem;
      mr.ondataavailable = function (e) { if (e.data && e.data.size) khuc.push(e.data); };
      mr.onstop = function () {
        clearInterval(dem); luong.getTracks().forEach(function (x) { x.stop(); });
        st.nghe = false; st.mr = null; veMic();
        var blob = new Blob(khuc, { type: mr.mimeType || mime || 'audio/webm' });
        if (blob.size < 1500) { tt('Đoạn ghi âm ngắn quá, nói lại nhé.'); onXong({}); return; }
        var fr = new FileReader();
        fr.onload = function () { onXong({ am_thanh: String(fr.result).split(',')[1] || '', am_mime: blob.type }); };
        fr.readAsDataURL(blob);
      };
      mr.start(); st.mr = mr; st.nghe = true; veMic();
      dem = setInterval(function () { var g = Math.round((Date.now() - t0) / 1000); tt('🎙️ Đang ghi âm ' + g + 's · bấm mic lần nữa để gửi'); if (g >= 90) mr.stop(); }, 500);
    }).catch(function () { tt('Trình duyệt chưa cho dùng micro. Bấm biểu tượng ổ khoá cạnh thanh địa chỉ → cho phép Micro.'); });
  }
  function tatNghe() { try { if (st.rec) st.rec.stop(); } catch (e) { } try { if (st.mr && st.mr.state !== 'inactive') st.mr.stop(); } catch (e) { } }
  function veMic() { if (!micBtn) return; micBtn.classList.toggle('nghe', st.nghe); micBtn.textContent = st.nghe ? '■' : '🎙️'; micBtn.title = st.nghe ? 'Dừng và gửi' : 'Bấm để nói'; }
  function tt(t) { if (ttEl) ttEl.textContent = t || ''; }

  function bamMic(tuHoiThoai) {
    if (st.dang) return;
    if (st.nghe) { tatNghe(); return; }
    var coChu = false;
    batNghe(function (chu) { coChu = !!chu; nhap.value = chu; coGian(); }, function (r) {
      if (r.am_thanh) { gui('', r); return; }
      var chu = (r.chu || nhap.value || '').trim();
      if (chu) { nhap.value = chu; gui(chu, { noi: true }); }
      else { tt(''); if (tuHoiThoai && st.hoiThoai) setTimeout(function () { if (st.hoiThoai && !st.dang) bamMic(true); }, 400); }
    });
  }

  /* ── dựng khung ── */
  function dung() {
    if (hop) return;
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    fab = nut('', 'tl-fab', mo, 'Trò chuyện với Trợ lý AI');
    fab.innerHTML = '<span class="tl-dot" aria-hidden="true">🤖</span><span>Hỏi trợ lý AI</span>';
    document.body.appendChild(fab);

    hop = el('div', 'tl-hop'); hop.setAttribute('role', 'dialog'); hop.setAttribute('aria-label', 'Trợ lý AI');
    var dau = el('div', 'tl-dau');
    dau.appendChild(el('div', 'tl-av', '🤖'));
    var tx = el('div'); tx.appendChild(el('b', null, 'Trợ lý mentor AI')); var phu = el('small', 'tl-phu', ''); tx.appendChild(phu); dau.appendChild(tx);
    var nuts = el('div', 'tl-nuts');
    var bDoc = nut(st.doc ? '🔊' : '🔈', 'tl-ic', function () { st.doc = !st.doc; ls.set(DOC_KEY, st.doc ? '1' : '0'); bDoc.textContent = st.doc ? '🔊' : '🔈'; bDoc.setAttribute('aria-pressed', String(st.doc)); if (!st.doc) ngungDoc(); }, 'Đọc to câu trả lời');
    bDoc.setAttribute('aria-pressed', String(st.doc));
    var bNoi = nut('🗣️', 'tl-ic', function () { batHoiThoai(!st.hoiThoai); }, 'Nói chuyện rảnh tay: nói, nghe trả lời, rồi nói tiếp');
    bNoi.id = 'tlNoi'; bNoi.setAttribute('aria-pressed', 'false');
    var bMoi = nut('⟲', 'tl-ic', function () { if (!st.ls.length || confirm('Bắt đầu cuộc trò chuyện mới? Tin cũ sẽ được xoá khỏi máy này.')) { st.ls = []; luu(); veDs(); } }, 'Cuộc trò chuyện mới');
    var bDong = nut('✕', 'tl-ic', dong, 'Đóng');
    nuts.appendChild(bDoc); nuts.appendChild(bNoi); nuts.appendChild(bMoi); nuts.appendChild(bDong); dau.appendChild(nuts);
    hop.appendChild(dau);

    var mt = el('div', 'tl-mentor'); mt.hidden = true; mt.id = 'tlMentor'; hop.appendChild(mt);
    dsEl = el('div', 'tl-ds'); dsEl.setAttribute('aria-live', 'polite'); hop.appendChild(dsEl);
    bnEl = el('div', 'tl-bn'); hop.appendChild(bnEl);
    ttEl = el('div', 'tl-tt'); hop.appendChild(ttEl);
    chipsEl = el('div', 'tl-chips'); hop.appendChild(chipsEl);
    var nh = el('div', 'tl-nhap');
    nhap = el('textarea'); nhap.rows = 1; nhap.placeholder = 'Hỏi gì cũng được, hoặc bấm 🎙️ để nói…'; nhap.setAttribute('aria-label', 'Tin nhắn');
    nhap.addEventListener('input', coGian);
    nhap.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); gui(nhap.value); } });
    micBtn = nut('🎙️', 'tl-mic', function () { bamMic(false); }, 'Bấm để nói');
    guiBtn = nut('➤', 'tl-gui', function () { gui(nhap.value); }, 'Gửi');
    nh.appendChild(nhap); nh.appendChild(micBtn); nh.appendChild(guiBtn); hop.appendChild(nh);
    document.body.appendChild(hop);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hop.classList.contains('mo') && !document.querySelector('.tk-nen.mo')) dong(); });
    veMentor(); veDs();
  }
  function coGian() { nhap.style.height = 'auto'; nhap.style.height = Math.min(140, nhap.scrollHeight) + 'px'; }

  function mo() {
    dung(); hop.classList.add('mo'); fab.classList.add('an');
    var t = toolHienTai();
    hop.querySelector('.tl-phu').textContent = t !== 'chung' ? 'Đang xem cùng bạn: ' + TEN_TOOL[t] : 'Hỏi về kênh, kịch bản, quay dựng…';
    veMentor(); veDs();
    if (global.innerWidth > 560) setTimeout(function () { nhap.focus(); }, 50);
  }
  function dong() { if (!hop) return; batHoiThoai(false); tatNghe(); ngungDoc(); hop.classList.remove('mo'); hop.classList.remove('bo-nho'); fab.classList.remove('an'); }
  function batHoiThoai(b) {
    st.hoiThoai = b; var n = document.getElementById('tlNoi'); if (n) n.setAttribute('aria-pressed', String(b));
    if (b) { st.doc = true; ls.set(DOC_KEY, '1'); tt('🗣️ Chế độ nói chuyện: nói xong trợ lý trả lời bằng giọng rồi tự nghe tiếp. Bấm 🗣️ lần nữa để dừng.'); if (!st.nghe && !st.dang) bamMic(true); }
    else { tatNghe(); tt(''); }
  }

  /* ── mentor: chế độ dạy + bộ nhớ ── */
  function veMentor() {
    var mt = document.getElementById('tlMentor'); if (!mt) return;
    var la = TK.laMentor && TK.laMentor();
    mt.hidden = !la; if (!la) { st.day = false; return; }
    mt.innerHTML = '';
    var bDay = nut('🎓 Chế độ dạy AI', null, function () { st.day = !st.day; ls.set(DAY_KEY, st.day ? '1' : '0'); veMentor(); });
    bDay.setAttribute('aria-pressed', String(st.day));
    var bBn = nut('🧠 Bộ nhớ AI', null, function () { var bo = !hop.classList.contains('bo-nho'); hop.classList.toggle('bo-nho', bo); bBn.setAttribute('aria-pressed', String(bo)); if (bo) veBoNho(); });
    bBn.setAttribute('aria-pressed', String(hop.classList.contains('bo-nho')));
    mt.appendChild(bDay); mt.appendChild(bBn);
    if (st.day) mt.appendChild(el('span', 'tl-day-note', 'Đang dạy: mỗi câu bạn nói hoặc gõ sẽ thành bài học, AI dùng ngay cho mọi tool và mọi học viên.'));
  }
  async function veBoNho() {
    bnEl.innerHTML = ''; bnEl.appendChild(el('p', 'tl-tt', 'Đang tải bộ nhớ…'));
    var r;
    try { r = await TK.goi({ action: 'hook_ai', mode: 'bh_ds', token: TK.token(), dev: TK.dev() }); } catch (e) { r = { ok: false, error: 'mang' }; }
    bnEl.innerHTML = '';
    if (!r.ok) { bnEl.appendChild(el('p', null, LOI[r.error] || 'Chưa tải được bộ nhớ (' + (r.error || 'lỗi') + ').')); return; }
    var ds = r.ds || [];
    var cho = ds.filter(function (x) { return x.trang_thai === 'cho'; }).length, on = ds.filter(function (x) { return x.trang_thai === 'on'; }).length;
    bnEl.appendChild(el('p', null, '🧠 ' + on + ' bài học đang dùng · ' + cho + ' bài chờ bạn duyệt. AI chèn các bài hợp ngách vào mọi tool. Dạy thêm: bật Chế độ dạy rồi nói hoặc gõ, hoặc gửi /day trên Telegram.'));
    if (!ds.length) return;
    ds.sort(function (a, b) { return (a.trang_thai === 'cho' ? 0 : 1) - (b.trang_thai === 'cho' ? 0 : 1); });
    ds.forEach(function (x) {
      var the = el('div', 'tl-the' + (x.trang_thai === 'cho' ? ' cho' : x.trang_thai === 'off' ? ' off' : ''));
      the.appendChild(el('div', null, (x.trang_thai === 'cho' ? '⏳ ' : x.trang_thai === 'off' ? '⏸ ' : '✅ ') + x.bai_hoc));
      the.appendChild(el('small', null, '#' + x.id + ' · ' + (TEN_TOOL[x.tool] || 'mọi tool') + (x.nganh ? ' · ngách ' + x.nganh : '') + ' · ' + ({ mentor_day: 'mentor dạy', mentor_gopy: 'mentor góp ý', tele: 'Telegram', tu_van: 'AI rút từ tư vấn', hv_gopy: 'học viên góp ý' }[x.nguon] || x.nguon) + (x.nguoi ? ' (' + x.nguoi + ')' : '') + ' · ' + x.thoi_gian));
      var row = el('div', 'tl-row');
      function doi(tt2) { return async function () { try { var k = await TK.goi({ action: 'hook_ai', mode: 'bh_sua', token: TK.token(), id: x.id, trang_thai: tt2 }); if (k.ok) veBoNho(); } catch (e) { } }; }
      if (x.trang_thai !== 'on') row.appendChild(nut(x.trang_thai === 'cho' ? '✅ Duyệt' : '▶ Bật lại', null, doi('on')));
      if (x.trang_thai === 'on') row.appendChild(nut('⏸ Tắt', null, doi('off')));
      row.appendChild(nut('🗑 Xoá', null, function () { if (confirm('Xoá bài học này?')) doi('xoa')(); }));
      the.appendChild(row); bnEl.appendChild(the);
    });
  }

  /* ── vẽ tin nhắn ── */
  function veDs() {
    if (!dsEl) return;
    dsEl.innerHTML = '';
    if (!st.ls.length) {
      var chao = el('div', 'tl-m ai');
      chao.innerHTML = veChu('Chào bạn 👋 Mình là trợ lý mentor của **Tự Mình Xây Kênh**. Mình đọc được kết quả bạn đang xem ở tool này và hồ sơ kênh của bạn.\n- Hỏi vì sao điểm thấp, nên sửa gì trước\n- Nhờ viết hook, kịch bản, caption\n- Bấm 🎙️ để **nói** thay vì gõ, bấm 🗣️ để nói chuyện rảnh tay');
      dsEl.appendChild(chao);
    }
    st.ls.forEach(function (m, i) { dsEl.appendChild(veTin(m, i)); });
    veChips();
    dsEl.scrollTop = dsEl.scrollHeight;
  }
  function veTin(m, i) {
    if (m.vai === 'bh') { var b = el('div', 'tl-bh', m.text); return b; }
    var d = el('div', 'tl-m ' + (m.vai === 'ai' ? 'ai' : 'nd') + (m.day ? ' day' : ''));
    if (m.vai === 'ai') d.innerHTML = veChu(m.text); else d.textContent = m.text;
    if (m.noi) d.appendChild(el('small', 'tl-ghi', '🎙️ nói'));
    if (m.day) d.appendChild(el('small', 'tl-ghi', '🎓 dạy AI'));
    if (m.vai === 'ai' && !m.loi) {
      var hd = el('div', 'tl-hd');
      hd.appendChild(nut('🔊 Nghe', null, function () { docTo(m.text); }));
      hd.appendChild(nut('📋 Chép', null, function () { try { navigator.clipboard.writeText(chuTron(m.text)); this.textContent = '✓ Đã chép'; } catch (e) { } }));
      var up = nut('👍', m.danhGia === 'up' ? 'on' : null, function () { m.danhGia = 'up'; luu(); veDs(); }, 'Trả lời hay');
      var down = nut('👎', m.danhGia === 'down' ? 'on' : null, function () { moGopY(d, m, i, false); }, 'Chưa đúng');
      hd.appendChild(up); hd.appendChild(down);
      if (TK.laMentor && TK.laMentor()) hd.appendChild(nut('✍️ Góp ý cho AI', null, function () { moGopY(d, m, i, true); }));
      d.appendChild(hd);
    }
    return d;
  }
  function veChips() {
    chipsEl.innerHTML = '';
    var cuoi = st.ls[st.ls.length - 1], ds;
    if (cuoi && cuoi.vai === 'ai' && cuoi.goi_y && cuoi.goi_y.length) ds = cuoi.goi_y;
    else if (!st.ls.length) {
      ds = (GOI_Y_DAU[toolHienTai()] || GOI_Y_DAU.chung).slice();
      if (TK.laMentor && TK.laMentor()) ds.unshift('Mình góp ý kết quả đang xem nhé');
    }
    (ds || []).forEach(function (c) { chipsEl.appendChild(nut(c, null, function () { gui(c); })); });
  }

  /* ── góp ý: mentor có hiệu lực ngay, học viên chờ mentor duyệt ── */
  function moGopY(d, m, i, laMentor) {
    if (d.querySelector('.tl-gy')) return;
    var f = el('div', 'tl-gy');
    var ta = el('textarea'); ta.placeholder = laMentor ? 'AI sai hoặc thiếu chỗ nào? Nói như đang dạy học viên, AI sẽ ghi nhớ cho mọi lần sau.' : 'Chỗ nào chưa đúng hoặc chưa hợp với bạn? (không bắt buộc)';
    var row = el('div', 'tl-row');
    var bMic = nut('🎙️ Nói', 'tl-nut phu', function () {
      if (st.nghe) { tatNghe(); return; }
      batNghe(function (chu) { ta.value = chu; }, function (r) { if (r.am_thanh) tt('Trình duyệt này chỉ nghe được khi gửi tin, gõ góp ý giúp mình nhé.'); else tt(''); });
    });
    var bGui = nut(laMentor ? 'Dạy AI điều này' : 'Gửi', 'tl-nut', async function () {
      var gy = ta.value.trim();
      if (!laMentor) { m.danhGia = 'down'; luu(); }
      if (!gy) { f.remove(); veDs(); return; }
      bGui.disabled = true; bGui.textContent = 'Đang ghi nhớ…';
      var hoi = ''; for (var k = i - 1; k >= 0; k--) { if (st.ls[k].vai === 'nd') { hoi = st.ls[k].text; break; } }
      var r;
      try { r = await TK.goi({ action: 'hook_ai', mode: 'bh_them', token: TK.token(), dev: TK.dev(), gop_y: gy, tool: toolHienTai(), ho_so: TK.hoSo(), ngu_canh: 'Người dùng hỏi: ' + hoi.slice(0, 800) + '\nAI đã trả lời: ' + String(m.text).slice(0, 1500) }); }
      catch (e) { r = { ok: false, error: 'mang' }; }
      if (r.ok) {
        st.ls.splice(i + 1, 0, { vai: 'bh', text: r.bai_hoc ? (r.bai_hoc.trang_thai === 'on' ? '🧠 Đã ghi nhớ, dùng ngay cho mọi tool: ' + r.bai_hoc.noi_dung : '🙏 Cảm ơn bạn! Góp ý đã gửi tới mentor, được duyệt là AI sẽ học theo.') : '🙏 Cảm ơn bạn đã góp ý!' });
        luu(); veDs();
      } else { bGui.disabled = false; bGui.textContent = 'Gửi lại'; tt(LOI[r.error] || 'Chưa gửi được góp ý, thử lại.'); }
    });
    row.appendChild(bMic); row.appendChild(bGui);
    f.appendChild(ta); f.appendChild(row); d.appendChild(f); ta.focus();
  }

  /* ── gửi ── */
  async function gui(chu, them) {
    them = them || {};
    chu = String(chu || '').trim();
    if (st.dang || (!chu && !them.am_thanh)) return;
    if (!(await TK.canCo('chat'))) return;
    st.dang = true; guiBtn.disabled = true; micBtn.disabled = true;
    var day = !!(st.day && TK.laMentor && TK.laMentor());
    var lichSu = st.ls.filter(function (m) { return m.vai === 'nd' || m.vai === 'ai'; }).slice(-12).map(function (m) { return { vai: m.vai, text: m.text }; });
    var tin = { vai: 'nd', text: chu || '🎙️ (đang nghe…)', noi: !!(them.noi || them.am_thanh), day: day };
    st.ls.push(tin); luu(); veDs(); nhap.value = ''; coGian(); chipsEl.innerHTML = '';
    var cho = el('div', 'tl-m ai'); cho.innerHTML = '<span class="tl-cho"><i></i><i></i><i></i></span>'; dsEl.appendChild(cho); dsEl.scrollTop = dsEl.scrollHeight;
    tt(them.am_thanh ? 'Trợ lý đang nghe đoạn ghi âm…' : '');
    var r;
    try {
      r = await TK.goi({ action: 'hook_ai', mode: 'chat', token: TK.token(), dev: TK.dev(), tin: chu, am_thanh: them.am_thanh || '', am_mime: them.am_mime || '',
        lich_su: lichSu, ngu_canh: nguCanh(), ho_so: TK.hoSo(), noi: !!(them.noi || them.am_thanh || st.hoiThoai), day: day });
    } catch (e) { r = { ok: false, error: TK.loiMang(e) ? 'mang' : 'may_chu' }; }
    st.dang = false; guiBtn.disabled = false; micBtn.disabled = false; tt('');
    if (r.ok) {
      if (them.am_thanh && r.nghe_duoc) tin.text = r.nghe_duoc;
      var m = { vai: 'ai', text: r.tra_loi || '…', goi_y: r.goi_y || [] };
      st.ls.push(m);
      if (r.bai_hoc) st.ls.push({ vai: 'bh', text: r.bai_hoc.trang_thai === 'on' ? '🧠 Đã ghi nhớ: ' + r.bai_hoc.noi_dung : '🧠 Trợ lý vừa học được một điều mới từ cuộc trò chuyện, chờ mentor duyệt.' });
      if (TK.me && TK.me.luot && r.con != null && TK.me.loai !== 'hv' && !TK.me.pro) TK.me.luot.chat = r.con;
      luu(); veDs();
      if (st.doc || st.hoiThoai) docTo(m.text, function () { if (st.hoiThoai && hop.classList.contains('mo')) setTimeout(function () { if (st.hoiThoai && !st.dang && !st.nghe) bamMic(true); }, 300); });
    } else {
      if (tin.text === '🎙️ (đang nghe…)') tin.text = '🎙️ (ghi âm)';
      var loi = r.error === 'mang' ? 'Máy bạn đang mất mạng, kiểm tra rồi gửi lại nhé.' : r.error === 'may_chu' ? 'Máy chủ đang lỗi hoặc chưa cập nhật phần Trợ lý. Thử lại sau ít phút.' : (LOI[r.error] || 'Chưa trả lời được (' + (r.error || 'lỗi') + '), gửi lại giúp mình.');
      st.ls.push({ vai: 'ai', text: '⚠️ ' + loi, loi: true }); luu(); veDs();
      if (r.error === 'het_luot_thu') { batHoiThoai(false); if (TK.me && TK.me.luot) TK.me.luot.chat = 0; TK.moHet('chat'); }
      else if (r.error === 'het_phien' || r.error === 'can_dangky') TK.mo('signup', loi);
      if (st.hoiThoai) batHoiThoai(false);
    }
  }

  function khoi() {
    dung();
    if (TK.nghe) TK.nghe(function () { veMentor(); if (hop && hop.classList.contains('mo')) veDs(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoi); else khoi();
  global.TroLy = { mo: mo, dong: dong, gui: function (t) { mo(); gui(t); } };
})(window);
