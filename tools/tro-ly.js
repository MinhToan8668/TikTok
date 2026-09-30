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

  /* biểu tượng vẽ tay (SVG), không dùng emoji để nhìn đồng đều trên mọi máy */
  var IC = {
    ai: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 9.5A5.5 5.5 0 0 1 10.5 4h11A5.5 5.5 0 0 1 27 9.5v7a5.5 5.5 0 0 1-5.5 5.5H15l-5.2 4.3c-.6.5-1.5.1-1.5-.7V22A5.5 5.5 0 0 1 5 16.5z" fill="#1c2600"/><circle cx="12.3" cy="12" r="1.7" fill="#99DF00"/><circle cx="19.7" cy="12" r="1.7" fill="#99DF00"/><path d="M12.2 16.1c1.1 1.2 2.4 1.8 3.8 1.8s2.7-.6 3.8-1.8" stroke="#99DF00" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M26.5 1.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#ff5a24"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    gui: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l15-7-4.5 15-3-6z" fill="currentColor"/><path d="M11.5 14l3-3" stroke="#1c2600" stroke-width="1.5" stroke-linecap="round"/></svg>',
    dung: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>',
    tai: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2" stroke="currentColor" stroke-width="2" fill="none"/><rect x="3" y="13" width="5" height="7" rx="2" fill="currentColor"/><rect x="16" y="13" width="5" height="7" rx="2" fill="currentColor"/></svg>',
    them: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>',
    dong: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    loa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    chep: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M5 15V6a2 2 0 0 1 2-2h8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    thich: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v10H4V10zM7 10l4-6c1.2 0 2 .9 1.8 2.1L12.3 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/></svg>',
    sua: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>'
  };
  IC.khong = IC.thich.replace('<svg ', '<svg style="transform:rotate(180deg)" ');

  var CSS = [
    /* nút mở */
    '.tl-fab{position:fixed;left:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);z-index:54;display:flex;align-items:center;gap:8px;border:0;background:#1c2600;color:#F3F0E4;font:inherit;font-weight:800;font-size:14.5px;border-radius:999px;padding:6px 16px 6px 6px;cursor:pointer;box-shadow:0 6px 18px rgba(28,38,0,.35);transition:transform .15s}',
    '.tl-fab:hover{transform:translateY(-2px)}',
    '.tl-fab .tl-av{width:38px;height:38px}',
    '.tl-fab .tl-on{position:absolute;left:37px;top:6px;width:10px;height:10px;border-radius:50%;background:#99DF00;border:2px solid #1c2600}',
    '.tl-fab.an{display:none}',
    '.tl-fab.co-moi .tl-on{background:#ff5a24;animation:tlNghe 1.2s infinite}',
    '.tl-av{width:36px;height:36px;border-radius:50%;background:#99DF00;display:grid;place-items:center;flex:none}',
    '.tl-av svg{width:70%;height:70%}',
    '.tl-av.nho{width:26px;height:26px}',
    /* khung */
    '.tl-nen{position:fixed;inset:0;background:rgba(20,18,8,.45);z-index:55;display:none}',
    '.tl-hop{position:fixed;left:16px;bottom:16px;z-index:56;width:min(400px,calc(100vw - 32px));height:min(640px,calc(100vh - 32px));background:var(--surface,#fff);color:var(--text,#222);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;font-size:14.5px}',
    '.tl-hop.mo{display:flex;animation:tlLen .22s ease-out}',
    '@keyframes tlLen{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}',
    '@media (max-width:560px){',
    '  .tl-fab{left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);font-size:14px;padding:5px 14px 5px 5px}',
    '  .tl-fab .tl-av{width:34px;height:34px}.tl-fab .tl-on{left:32px;top:5px}',
    '  .tl-nen.mo{display:block}',
    '  .tl-hop{left:0;right:0;bottom:0;width:100%;height:88vh;height:88dvh;border-radius:22px 22px 0 0;font-size:15px}',
    '  .tl-hop.mo{animation:tlTruot .25s ease-out}',
    '}',
    '@keyframes tlTruot{from{transform:translateY(40%)}to{transform:none}}',
    '@media (prefers-reduced-motion:reduce){.tl-hop.mo{animation:none}}',
    '.tl-keo{display:none;width:44px;height:5px!important;min-height:0!important;border-radius:3px;background:var(--line,#ccc);margin:8px auto 0;flex:none;border:0;padding:0;cursor:pointer}',
    '@media (max-width:560px){.tl-keo{display:block}}',
    '.tl-dau{display:flex;align-items:center;gap:10px;padding:10px 8px 10px 14px;border-bottom:1px solid var(--line,#e5e5e5)}',
    '.tl-dau b{display:block;font-size:15px;line-height:1.2}',
    '.tl-dau small{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted,#666);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.tl-dau small::before{content:"";width:7px;height:7px;border-radius:50%;background:#3E9D1F;flex:none}',
    '.tl-dau .tl-ten{min-width:0;flex:1}',
    '.tl-ic{min-height:0!important;border:0;background:transparent;color:var(--text,#222);border-radius:12px;width:40px;height:40px;cursor:pointer;display:grid;place-items:center;padding:0;flex:none}',
    '.tl-ic svg{width:21px;height:21px}',
    '.tl-ic:hover{background:var(--surface-2,#f1f1f1)}',
    '.tl-ic[aria-pressed="true"]{background:#1c2600;color:#99DF00}',
    /* menu ⋯ */
    '.tl-menu{position:absolute;right:10px;top:58px;z-index:3;background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:6px;min-width:220px;display:none}',
    '.tl-menu.mo{display:block}',
    '.tl-menu button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:transparent;color:var(--text,#222);font:inherit;font-size:14px;padding:11px 12px;border-radius:10px;cursor:pointer;text-align:left}',
    '.tl-menu button:hover{background:var(--surface-2,#f1f1f1)}',
    '.tl-menu button svg{width:19px;height:19px;flex:none}',
    '.tl-menu .tl-chk{margin-left:auto;font-weight:900;color:#3E9D1F}',
    /* mentor */
    '.tl-mentor{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;border-bottom:1px solid var(--line,#e5e5e5);align-items:center;scrollbar-width:none;flex:none}',
    '.tl-mentor button{flex:none;font:inherit;font-size:13px;font-weight:700;border:1.5px solid var(--line-strong,#5f8c00);border-radius:999px;padding:6px 12px;background:transparent;color:var(--text,#222);cursor:pointer}',
    '.tl-mentor button[aria-pressed="true"]{background:#ff5a24;border-color:#ff5a24;color:#fff}',
    '.tl-day-note{font-size:12.5px;color:#b4432a;font-weight:600;padding:6px 14px;background:#fff1ea;flex:none}',
    /* tin nhắn */
    '.tl-ds{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;background:var(--surface-2,#f6f7f0)}',
    '.tl-dong{display:flex;gap:8px;align-items:flex-end;max-width:92%}',
    '.tl-dong.nd{align-self:flex-end;flex-direction:row-reverse}',
    '.tl-m{padding:10px 13px;border-radius:18px;line-height:1.55;word-wrap:break-word;min-width:0}',
    '.tl-dong.nd .tl-m{background:#1c2600;color:#F3F0E4;border-bottom-right-radius:6px}',
    '.tl-dong.nd.day .tl-m{background:#ff5a24;color:#fff}',
    '.tl-dong.ai .tl-m{background:var(--surface,#fff);border:1px solid var(--line,#e5e5e5);border-bottom-left-radius:6px}',
    '.tl-m ul{margin:4px 0;padding-left:18px}.tl-m li{margin:2px 0}',
    '.tl-m p{margin:0 0 6px}.tl-m p:last-child{margin:0}',
    '.tl-m small.tl-ghi{display:block;font-size:11.5px;opacity:.7;margin-top:4px}',
    '.tl-hd{display:flex;gap:2px;margin:6px 0 -4px -6px}',
    '.tl-hd button{border:0;background:transparent;color:var(--muted,#777);width:34px;height:34px;border-radius:10px;cursor:pointer;display:grid;place-items:center;padding:0}',
    '.tl-hd button svg{width:18px;height:18px}',
    '.tl-hd button:hover{background:var(--surface-2,#f1f1f1);color:var(--text,#222)}',
    '.tl-hd button.on{color:#3E9D1F}',
    '.tl-hd button.gy{width:auto;padding:0 10px;gap:5px;display:flex;align-items:center;font:inherit;font-size:12.5px;font-weight:700;color:#b4432a}',
    '.tl-bh{align-self:center;font-size:12.5px;background:var(--accent-soft,#eef8d0);border-radius:12px;padding:8px 12px;max-width:95%;text-align:center}',
    '.tl-gy{margin-top:8px;display:grid;gap:6px}',
    '.tl-gy textarea{width:100%;font:inherit;font-size:15px;border:1.5px solid var(--line,#ddd);border-radius:12px;padding:9px;background:var(--surface-2,#f7f7f7);color:var(--text,#222);min-height:70px;resize:vertical}',
    '.tl-gy .tl-row{display:flex;gap:6px}.tl-gy .tl-row button{flex:1}',
    '.tl-nut{font:inherit;font-weight:800;font-size:14px;border:0;border-radius:12px;padding:10px 12px;cursor:pointer;background:#99DF00;color:#1c2600}',
    '.tl-nut.phu{background:var(--surface-2,#f1f1f1);color:var(--text,#222)}',
    '.tl-cho{display:inline-flex;gap:4px;padding:4px 2px}.tl-cho i{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.35;animation:tlCho 1s infinite}.tl-cho i:nth-child(2){animation-delay:.15s}.tl-cho i:nth-child(3){animation-delay:.3s}',
    '@keyframes tlCho{50%{opacity:1;transform:translateY(-3px)}}',
    /* gợi ý: một hàng cuộn ngang */
    '.tl-chips{display:flex;gap:8px;overflow-x:auto;padding:10px 12px 2px;scrollbar-width:none;flex:none;background:var(--surface,#fff)}',
    '.tl-chips::-webkit-scrollbar,.tl-mentor::-webkit-scrollbar{display:none}',
    '.tl-chips:empty{display:none}',
    '.tl-chips button{flex:none;font:inherit;font-size:13.5px;border:1.5px solid var(--line-strong,#5f8c00);background:var(--surface,#fff);color:var(--text,#222);border-radius:999px;padding:8px 14px;cursor:pointer;white-space:nowrap}',
    /* ô nhập: một nút chính đổi mic ↔ gửi */
    '.tl-nhap{display:flex;gap:8px;align-items:flex-end;padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);background:var(--surface,#fff);flex:none}',
    '.tl-o{flex:1;display:flex;align-items:flex-end;background:var(--surface-2,#f1f3ea);border:1.5px solid var(--line,#ddd);border-radius:24px;padding:4px 6px 4px 14px;min-width:0}',
    '.tl-o:focus-within{border-color:#1c2600}',
    '.tl-o textarea{flex:1;font:inherit;font-size:15px;border:0;outline:0;background:transparent;resize:none;max-height:120px;min-height:40px;padding:9px 0;color:var(--text,#222);line-height:1.4;min-width:0}',
    '@media (max-width:560px){.tl-o textarea{font-size:16px}}',
    '.tl-chinh{min-height:0!important;width:48px;height:48px;border-radius:50%;border:0;cursor:pointer;flex:none;display:grid;place-items:center;background:#99DF00;color:#1c2600;box-shadow:0 3px 10px rgba(28,38,0,.25);transition:background .15s}',
    '.tl-chinh svg{width:24px;height:24px}',
    '.tl-chinh.gui{background:#1c2600;color:#99DF00}',
    '.tl-chinh.nghe{background:#ff5a24;color:#fff;animation:tlNghe 1.2s ease-in-out infinite}',
    '.tl-chinh:disabled{opacity:.5;cursor:default}',
    '@keyframes tlNghe{0%,100%{box-shadow:0 0 0 0 rgba(255,90,36,.5)}50%{box-shadow:0 0 0 10px rgba(255,90,36,0)}}',
    '.tl-tt{font-size:12.5px;color:var(--muted,#666);padding:6px 16px 0;background:var(--surface,#fff);flex:none}',
    '.tl-tt:empty{display:none}',
    '.tl-noi{display:none;align-items:center;gap:10px;margin:8px 12px 0;padding:10px 12px;border-radius:14px;background:#1c2600;color:#F3F0E4;font-size:13.5px;flex:none}',
    '.tl-noi.mo{display:flex}',
    '.tl-noi button{margin-left:auto;border:0;border-radius:999px;background:#99DF00;color:#1c2600;font:inherit;font-weight:800;font-size:13px;padding:7px 14px;cursor:pointer}',
    '.tl-song{display:flex;gap:3px;align-items:center;height:18px}.tl-song i{width:3px;height:8px;border-radius:2px;background:#99DF00;animation:tlSong .9s ease-in-out infinite}.tl-song i:nth-child(2){animation-delay:.1s}.tl-song i:nth-child(3){animation-delay:.2s}.tl-song i:nth-child(4){animation-delay:.3s}',
    '@keyframes tlSong{0%,100%{height:5px}50%{height:18px}}',
    /* bộ nhớ AI */
    '.tl-bn{flex:1;overflow-y:auto;padding:12px;display:none;flex-direction:column;gap:8px;background:var(--surface-2,#f6f7f0)}',
    '.tl-hop.bo-nho .tl-bn,.tl-hop.tu-van .tl-bn{display:flex}.tl-hop.bo-nho .tl-ds,.tl-hop.bo-nho .tl-chips,.tl-hop.bo-nho .tl-nhap,.tl-hop.bo-nho .tl-tt,.tl-hop.bo-nho .tl-noi,.tl-hop.tu-van .tl-ds,.tl-hop.tu-van .tl-chips,.tl-hop.tu-van .tl-nhap,.tl-hop.tu-van .tl-tt,.tl-hop.tu-van .tl-noi{display:none}',
    '.tl-mentor button .tl-so{display:inline-block;min-width:18px;margin-left:5px;padding:0 5px;border-radius:999px;background:#ff5a24;color:#fff;font-size:11px;line-height:18px;text-align:center}',
    '.tl-loc{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;flex:none}',
    '.tl-loc button{flex:none;font:inherit;font-size:12.5px;font-weight:700;border:1px solid var(--line,#ddd);border-radius:999px;padding:6px 11px;background:var(--surface,#fff);color:var(--text,#222);cursor:pointer}',
    '.tl-loc button[aria-pressed="true"]{background:#1c2600;border-color:#1c2600;color:#99DF00}',
    '.tl-tim{display:flex;gap:6px}.tl-tim input{flex:1;min-width:0;font:inherit;font-size:15px;border:1.5px solid var(--line,#ddd);border-radius:12px;padding:9px 12px;background:var(--surface,#fff);color:var(--text,#222)}',
    '.tl-ca{background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:14px;padding:11px 12px;font-size:13.5px;line-height:1.5}',
    '.tl-ca.che{border:2px solid #ff5a24}.tl-ca.xong{opacity:.75}',
    '.tl-ca .tl-ca-dau{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--muted,#666);margin-bottom:6px}',
    '.tl-ca .tl-ca-dau b{color:var(--text,#222);font-size:13px}',
    '.tl-ca .tl-nhan{font-size:11px;font-weight:800;border-radius:999px;padding:1px 8px;background:var(--surface-2,#eee);color:var(--text,#222)}',
    '.tl-ca .tl-nhan.do{background:#ff5a24;color:#fff}.tl-ca .tl-nhan.xanh{background:#99DF00;color:#1c2600}',
    '.tl-ca .tl-hoi{font-weight:700;margin:0 0 6px}',
    '.tl-ca .tl-tl{background:var(--surface-2,#f4f5ee);border-radius:10px;padding:8px 10px;font-size:13px;max-height:88px;overflow:hidden;position:relative;cursor:pointer}',
    '.tl-ca .tl-tl.mo{max-height:none}',
    '.tl-ca .tl-tl p{margin:0 0 4px}.tl-ca .tl-tl p:last-child{margin:0}.tl-ca .tl-tl ul{margin:2px 0;padding-left:18px}',
    '.tl-ca .tl-tl:not(.mo)::after{content:"Xem đủ ▾";position:absolute;right:0;bottom:0;left:0;text-align:right;padding:18px 10px 4px;font-size:12px;font-weight:700;background:linear-gradient(transparent,var(--surface-2,#f4f5ee) 60%)}',
    '.tl-ca .tl-cg{margin-top:6px;font-size:12.5px;color:#b4432a}',
    '.tl-ca .tl-row{display:flex;gap:6px;margin-top:8px}.tl-ca .tl-row button{flex:1;font:inherit;font-size:13px;font-weight:800;border:0;border-radius:10px;padding:9px 8px;cursor:pointer;background:var(--surface-2,#f1f1f1);color:var(--text,#222)}',
    '.tl-ca .tl-row button.day{background:#ff5a24;color:#fff}.tl-ca .tl-row button.ok{background:#99DF00;color:#1c2600}',
    '.tl-ca .tl-gy{margin-top:8px}',
    '.tl-bn .tl-the{background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:14px;padding:10px 12px;font-size:13.5px;line-height:1.5}',
    '.tl-bn .tl-the.cho{border:2px solid #ff5a24}',
    '.tl-bn .tl-the.off{opacity:.55}',
    '.tl-bn .tl-the small{display:block;color:var(--muted,#666);font-size:12px;margin-top:3px}',
    '.tl-bn .tl-the .tl-row{display:flex;gap:6px;margin-top:8px}',
    '.tl-bn .tl-the .tl-row button{flex:1;font:inherit;font-size:13px;font-weight:700;border:0;background:var(--surface-2,#f1f1f1);color:var(--text,#222);border-radius:10px;padding:8px;cursor:pointer}',
    '.tl-bn .tl-the .tl-row button.ok{background:#99DF00;color:#1c2600}'
  ].join('');

  var st = { soChuaDay: 0,
    ls: json(LS_KEY, []), dang: false, doc: ls.get(DOC_KEY) === '1', day: ls.get(DAY_KEY) === '1',
    hoiThoai: false, nghe: false, rec: null, mr: null
  };
  var hop, nen, dsEl, nhap, chinhBtn, ttEl, chipsEl, bnEl, fab, menu, noiEl, dayEl;

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
  /* một nút chính: trống thì là mic, có chữ thì là gửi, đang nghe thì là dừng */
  function veMic() {
    if (!chinhBtn) return;
    var kieu = st.nghe ? 'nghe' : (nhap && nhap.value.trim()) ? 'gui' : 'mic';
    chinhBtn.className = 'tl-chinh' + (kieu === 'mic' ? '' : ' ' + kieu);
    chinhBtn.innerHTML = kieu === 'nghe' ? IC.dung : kieu === 'gui' ? IC.gui : IC.mic;
    var ten = kieu === 'nghe' ? 'Dừng và gửi' : kieu === 'gui' ? 'Gửi' : 'Bấm để nói';
    chinhBtn.title = ten; chinhBtn.setAttribute('aria-label', ten);
    if (noiEl) noiEl.classList.toggle('mo', !!st.hoiThoai);
  }
  function tt(t) { if (ttEl) ttEl.textContent = t || ''; }

  function bamMic(tuHoiThoai) {
    if (st.dang) return;
    if (st.nghe) { tatNghe(); return; }
    var coChu = false;
    batNghe(function (chu) { coChu = !!chu; nhap.value = chu; coGian(); }, function (r) { veMic();
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
    fab.innerHTML = '<span class="tl-av">' + IC.ai + '</span><i class="tl-on" aria-hidden="true"></i><span>Hỏi AI</span>';
    document.body.appendChild(fab);
    nen = el('div', 'tl-nen'); nen.onclick = dong; document.body.appendChild(nen);

    hop = el('div', 'tl-hop'); hop.setAttribute('role', 'dialog'); hop.setAttribute('aria-label', 'Trợ lý AI');
    hop.appendChild(nut('', 'tl-keo', dong, 'Thu gọn'));
    var dau = el('div', 'tl-dau');
    var av = el('span', 'tl-av'); av.innerHTML = IC.ai; dau.appendChild(av);
    var tx = el('div', 'tl-ten'); tx.appendChild(el('b', null, 'Trợ lý AI')); tx.appendChild(el('small', 'tl-phu', '')); dau.appendChild(tx);
    var bNoi = nut('', 'tl-ic', function () { batHoiThoai(!st.hoiThoai); }, 'Nói chuyện bằng giọng: nói, nghe trả lời, rồi nói tiếp');
    bNoi.innerHTML = IC.tai; bNoi.id = 'tlNoi'; bNoi.setAttribute('aria-pressed', 'false');
    var bThem = nut('', 'tl-ic', function (e) { e.stopPropagation(); veMenu(); menu.classList.toggle('mo'); }, 'Thêm');
    bThem.innerHTML = IC.them;
    var bDong = nut('', 'tl-ic', dong, 'Đóng'); bDong.innerHTML = IC.dong;
    dau.appendChild(bNoi); dau.appendChild(bThem); dau.appendChild(bDong);
    hop.appendChild(dau);
    menu = el('div', 'tl-menu'); hop.appendChild(menu);
    hop.addEventListener('click', function (e) { if (menu.classList.contains('mo') && !menu.contains(e.target)) menu.classList.remove('mo'); });

    var mt = el('div', 'tl-mentor'); mt.hidden = true; mt.id = 'tlMentor'; hop.appendChild(mt);
    dayEl = el('div', 'tl-day-note', 'Đang dạy AI: mỗi câu bạn nói hoặc gõ thành bài học, dùng ngay cho mọi tool.'); dayEl.hidden = true; hop.appendChild(dayEl);
    dsEl = el('div', 'tl-ds'); dsEl.setAttribute('aria-live', 'polite'); hop.appendChild(dsEl);
    bnEl = el('div', 'tl-bn'); hop.appendChild(bnEl);
    chipsEl = el('div', 'tl-chips'); hop.appendChild(chipsEl);
    noiEl = el('div', 'tl-noi');
    noiEl.innerHTML = '<span class="tl-song" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>Đang nói chuyện bằng giọng</span>';
    noiEl.appendChild(nut('Dừng', null, function () { batHoiThoai(false); }));
    hop.appendChild(noiEl);
    ttEl = el('div', 'tl-tt'); hop.appendChild(ttEl);
    var nh = el('div', 'tl-nhap'), o = el('div', 'tl-o');
    nhap = el('textarea'); nhap.rows = 1; nhap.placeholder = 'Nhắn cho trợ lý…'; nhap.setAttribute('aria-label', 'Tin nhắn');
    nhap.addEventListener('input', function () { coGian(); veMic(); });
    nhap.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && global.innerWidth > 560) { e.preventDefault(); gui(nhap.value); } });
    o.appendChild(nhap); nh.appendChild(o);
    chinhBtn = nut('', 'tl-chinh', function () { if (!st.nghe && nhap.value.trim()) gui(nhap.value); else bamMic(false); }, 'Bấm để nói');
    nh.appendChild(chinhBtn); hop.appendChild(nh);
    document.body.appendChild(hop);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hop.classList.contains('mo') && !document.querySelector('.tk-nen.mo')) dong(); });
    veMic(); veMentor(); veDs();
  }
  function veMenu() {
    menu.innerHTML = '';
    var bDoc = nut('', null, function () { st.doc = !st.doc; ls.set(DOC_KEY, st.doc ? '1' : '0'); if (!st.doc) ngungDoc(); menu.classList.remove('mo'); });
    bDoc.innerHTML = IC.loa + '<span>Tự đọc to câu trả lời</span>' + (st.doc ? '<span class="tl-chk">✓</span>' : '');
    var bMoi = nut('', null, function () { menu.classList.remove('mo'); if (!st.ls.length || confirm('Bắt đầu cuộc trò chuyện mới? Tin cũ sẽ được xoá khỏi máy này.')) { st.ls = []; luu(); veDs(); } });
    bMoi.innerHTML = IC.sua + '<span>Cuộc trò chuyện mới</span>';
    menu.appendChild(bDoc); menu.appendChild(bMoi);
  }
  function coGian() { nhap.style.height = 'auto'; nhap.style.height = Math.min(120, nhap.scrollHeight) + 'px'; }

  function mo() {
    dung(); hop.classList.add('mo'); nen.classList.add('mo'); fab.classList.add('an'); fab.classList.remove('co-moi');
    var t = toolHienTai();
    hop.querySelector('.tl-phu').textContent = t !== 'chung' ? 'Đang xem: ' + TEN_TOOL[t] : 'Tự Mình Xây Kênh · sẵn sàng tư vấn';
    if (global.innerWidth <= 560) { try { document.documentElement.style.overflow = 'hidden'; } catch (e) { } }
    veMentor(); veDs();
    if (TK.laMentor && TK.laMentor()) TK.goi({ action: 'hook_ai', mode: 'ca_ds', token: TK.token(), loc: 'chua_day', trang: 99 }).then(function (r) { if (r && r.ok) { st.soChuaDay = (r.dem || {}).chua_day || 0; veMentor(); } }).catch(function () { });   // số lượt chưa dạy trên nút
    if (global.innerWidth > 560) setTimeout(function () { nhap.focus(); }, 50);
  }
  function dong() {
    if (!hop) return; batHoiThoai(false); tatNghe(); ngungDoc();
    hop.classList.remove('mo'); hop.classList.remove('bo-nho'); hop.classList.remove('tu-van'); nen.classList.remove('mo'); fab.classList.remove('an'); menu.classList.remove('mo');
    try { document.documentElement.style.overflow = ''; } catch (e) { }
  }
  function batHoiThoai(b) {
    st.hoiThoai = b; var n = document.getElementById('tlNoi'); if (n) n.setAttribute('aria-pressed', String(b));
    veMic();
    if (b) { if (!st.nghe && !st.dang) bamMic(true); }
    else { tatNghe(); tt(''); }
  }

  /* ── mentor: chế độ dạy + bộ nhớ ── */
  function veMentor() {
    var mt = document.getElementById('tlMentor'); if (!mt) return;
    var la = TK.laMentor && TK.laMentor();
    mt.hidden = !la; if (dayEl) dayEl.hidden = !(la && st.day); if (!la) { st.day = false; return; }
    mt.innerHTML = '';
    var bDay = nut('🎓 Dạy AI', null, function () { st.day = !st.day; ls.set(DAY_KEY, st.day ? '1' : '0'); moTrang(''); veMentor(); });
    bDay.setAttribute('aria-pressed', String(st.day));
    var bTv = nut('💬 Tư vấn học viên', null, function () { moTrang(hop.classList.contains('tu-van') ? '' : 'tu-van'); });
    if (st.soChuaDay) { var so = el('span', 'tl-so', String(st.soChuaDay > 99 ? '99+' : st.soChuaDay)); bTv.appendChild(so); }
    bTv.setAttribute('aria-pressed', String(hop.classList.contains('tu-van')));
    var bBn = nut('🧠 Bộ nhớ AI', null, function () { moTrang(hop.classList.contains('bo-nho') ? '' : 'bo-nho'); });
    bBn.setAttribute('aria-pressed', String(hop.classList.contains('bo-nho')));
    mt.appendChild(bDay); mt.appendChild(bTv); mt.appendChild(bBn);
  }
  /* trang của mentor: '' = chat · 'tu-van' = lượt tư vấn của học viên · 'bo-nho' = bài học */
  function moTrang(t) {
    hop.classList.remove('tu-van'); hop.classList.remove('bo-nho');
    if (t) hop.classList.add(t);
    veMentor();
    if (t === 'bo-nho') veBoNho(); else if (t === 'tu-van') veTuVan();
    else if (dsEl) dsEl.scrollTop = dsEl.scrollHeight;
  }

  /* ── 💬 Tư vấn học viên: mentor đọc lại các lượt hỏi đáp rồi dạy AI ngay trên case ── */
  var tv = { loc: 'chua_day', q: '', trang: 0 };
  async function veTuVan(them) {
    if (!them) { tv.trang = 0; bnEl.innerHTML = ''; }
    var dau = bnEl.querySelector('.tl-tv-dau');
    if (!dau) {
      dau = el('div', 'tl-tv-dau'); dau.style.cssText = 'display:grid;gap:8px';
      var tim = el('div', 'tl-tim'), o = el('input'); o.type = 'search'; o.placeholder = 'Tìm tên, email hoặc nội dung…'; o.value = tv.q;
      var hen; o.addEventListener('input', function () { clearTimeout(hen); hen = setTimeout(function () { tv.q = o.value.trim(); veTuVan(); }, 450); });
      tim.appendChild(o); dau.appendChild(tim);
      var loc = el('div', 'tl-loc');
      [['chua_day', 'Chưa dạy'], ['che', '👎 Bị chê'], ['da_day', '🎓 Đã dạy'], ['tot', '✓ Tốt'], ['tat_ca', 'Tất cả'], ['cua_mentor', 'Của mentor']].forEach(function (p) {
        var b = nut(p[1], null, function () { tv.loc = p[0]; veTuVan(); }); b.setAttribute('aria-pressed', String(tv.loc === p[0])); loc.appendChild(b);
      });
      dau.appendChild(loc);
      var th = nut('🧠 Cho AI tự rút bài học từ các lượt mới', 'tl-nut', async function () {
        th.disabled = true; th.textContent = 'AI đang đọc các lượt tư vấn…';
        var r; try { r = await TK.goi({ action: 'hook_ai', mode: 'bh_tonghop', token: TK.token() }); } catch (e) { r = { ok: false, error: 'mang' }; }
        th.disabled = false; th.textContent = '🧠 Cho AI tự rút bài học từ các lượt mới';
        var kq = el('div', 'tl-bh');
        kq.textContent = r.ok ? (r.ds.length ? 'AI đọc ' + r.so_ca + ' lượt, rút ra ' + r.ds.length + ' bài học. Vào 🧠 Bộ nhớ AI để duyệt.' : 'AI đọc ' + r.so_ca + ' lượt nhưng chưa thấy điều gì mới đáng ghi nhớ.')
          : r.error === 'it_qua' ? 'Chưa đủ lượt tư vấn mới để tổng hợp (cần ít nhất 5).' : 'Chưa tổng hợp được (' + (LOI[r.error] || r.error) + ').';
        dau.appendChild(kq);
      });
      dau.appendChild(th);
      bnEl.appendChild(dau);
    }
    dau.querySelectorAll('.tl-loc button').forEach(function (b, i) { b.setAttribute('aria-pressed', String(['chua_day', 'che', 'da_day', 'tot', 'tat_ca', 'cua_mentor'][i] === tv.loc)); });
    bnEl.querySelectorAll('.tl-ca,.tl-tv-tt,.tl-tv-them').forEach(function (x) { if (!them || x.classList.contains('tl-tv-them') || x.classList.contains('tl-tv-tt')) x.remove(); });
    var cho = el('p', 'tl-tv-tt', 'Đang tải…'); cho.style.cssText = 'margin:0;font-size:13px;color:var(--muted,#666)'; bnEl.appendChild(cho);
    var r;
    try { r = await TK.goi({ action: 'hook_ai', mode: 'ca_ds', token: TK.token(), loc: tv.loc, q: tv.q, trang: tv.trang }); } catch (e) { r = { ok: false, error: 'mang' }; }
    cho.remove();
    if (!r.ok) { var l = el('p', 'tl-tv-tt', LOI[r.error] || 'Chưa tải được (' + (r.error || 'lỗi') + ').'); bnEl.appendChild(l); return; }
    st.soChuaDay = (r.dem || {}).chua_day || 0;
    var nutTv = hop.querySelector('#tlMentor button:nth-child(2)'); if (nutTv) { var sEl = nutTv.querySelector('.tl-so'); if (sEl) sEl.textContent = st.soChuaDay || ''; }
    if (!r.ds.length && !them) { var t0 = el('p', 'tl-tv-tt', tv.loc === 'chua_day' ? 'Không còn lượt nào chưa dạy 🎉' : 'Không có lượt nào.'); t0.style.cssText = 'margin:0;font-size:13px'; bnEl.appendChild(t0); }
    r.ds.forEach(function (c) { bnEl.appendChild(veCa(c)); });
    moNeuNgan();
    if (r.con_nua) { var bt = nut('Xem thêm', 'tl-nut phu tl-tv-them', function () { tv.trang++; veTuVan(true); }); bnEl.appendChild(bt); }
  }
  /* câu trả lời ngắn thì mở sẵn, khỏi hiện 'Xem đủ' */
  function moNeuNgan() { bnEl.querySelectorAll('.tl-tl:not(.mo)').forEach(function (t) { if (t.scrollHeight <= t.clientHeight + 4) t.classList.add('mo'); }); }
  function veCa(c) {
    var the = el('div', 'tl-ca' + (c.danh_gia === 'down' && c.trang_thai !== 'da_day' ? ' che' : '') + (c.trang_thai === 'da_day' || c.trang_thai === 'tot' ? ' xong' : ''));
    var dau = el('div', 'tl-ca-dau');
    dau.appendChild(el('b', null, c.ten || '(không tên)'));
    dau.appendChild(el('span', null, (TEN_TOOL[c.tool] || 'Trò chuyện') + ' · ' + c.thoi_gian));
    if (c.vai === 'mentor') dau.appendChild(el('span', 'tl-nhan', 'mentor'));
    if (c.danh_gia === 'down') dau.appendChild(el('span', 'tl-nhan do', '👎 chê'));
    if (c.danh_gia === 'up') dau.appendChild(el('span', 'tl-nhan', '👍'));
    if (c.trang_thai === 'da_day') dau.appendChild(el('span', 'tl-nhan xanh', '🎓 đã dạy'));
    if (c.trang_thai === 'tot') dau.appendChild(el('span', 'tl-nhan xanh', '✓ tốt'));
    the.appendChild(dau);
    the.appendChild(el('p', 'tl-hoi', '“' + c.hoi + '”'));
    var tl = el('div', 'tl-tl'); tl.innerHTML = veChu(c.tra_loi); tl.onclick = function () { tl.classList.toggle('mo'); };
    the.appendChild(tl);
    if (c.gop_y) the.appendChild(el('div', 'tl-cg', (c.trang_thai === 'da_day' ? '🎓 ' : 'Học viên chê: ') + c.gop_y));
    var row = el('div', 'tl-row');
    var bDay = nut(c.trang_thai === 'da_day' ? '🎓 Dạy thêm' : '🎓 Dạy AI case này', 'day', function () { moDayCa(the, c, row); });
    row.appendChild(bDay);
    if (c.trang_thai !== 'tot' && c.trang_thai !== 'da_day') row.appendChild(nut('✓ Trả lời tốt', 'ok', function () { guiDayCa(the, c, row, 'tot', ''); }));
    the.appendChild(row);
    return the;
  }
  function moDayCa(the, c, row) {
    if (the.querySelector('.tl-gy')) return;
    var f = el('div', 'tl-gy'), ta = el('textarea');
    ta.placeholder = 'AI trả lời sai hay thiếu chỗ nào? Với case này nên tư vấn thế nào? Nói như đang dạy học viên.';
    var r2 = el('div', 'tl-row');
    var bMic = nut('🎙️ Nói', 'tl-nut phu', function () {
      if (st.nghe) { tatNghe(); return; }
      var goc = ta.value ? ta.value + ' ' : '';
      batNghe(function (chu) { ta.value = goc + chu; }, function (r) { if (r.am_thanh) tt('Trình duyệt này chưa nhận giọng tại chỗ, gõ giúp mình nhé.'); });
    });
    var bGui = nut('Dạy AI', 'tl-nut', function () { guiDayCa(the, c, row, 'day', ta.value.trim(), bGui); });
    r2.appendChild(bMic); r2.appendChild(bGui);
    f.appendChild(ta); f.appendChild(r2); the.insertBefore(f, row); row.hidden = true; ta.focus();
  }
  async function guiDayCa(the, c, row, kieu, noiDung, btn) {
    if (kieu === 'day' && noiDung.length < 4) { tt('Gõ hoặc nói điều muốn dạy AI trước đã.'); return; }
    var b = btn || row.querySelector('button.ok'); if (b) { b.disabled = true; b.textContent = 'AI đang ghi nhớ…'; }
    var r; try { r = await TK.goi({ action: 'hook_ai', mode: 'ca_day', token: TK.token(), ca_id: c.id, kieu: kieu, noi_dung: noiDung }); } catch (e) { r = { ok: false, error: 'mang' }; }
    if (!r.ok) { if (b) { b.disabled = false; b.textContent = 'Gửi lại'; } tt(LOI[r.error] || 'Chưa gửi được, thử lại.'); return; }
    c.trang_thai = kieu === 'tot' ? 'tot' : 'da_day'; if (kieu === 'day') c.gop_y = noiDung;
    var moi = veCa(c); the.replaceWith(moi); moNeuNgan();
    moi.appendChild(el('div', 'tl-bh', '🧠 Đã ghi nhớ, dùng ngay cho mọi tool: ' + r.bai_hoc.noi_dung));
    if (st.soChuaDay) { st.soChuaDay--; }
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
      the.appendChild(el('small', null, '#' + x.id + ' · ' + (TEN_TOOL[x.tool] || 'mọi tool') + (x.nganh ? ' · ngách ' + x.nganh : '') + ' · ' + ({ mentor_day: 'mentor dạy', mentor_gopy: 'mentor góp ý', mentor_day_ca: 'mentor dạy trên case', mentor_tot: 'mentor chấm tốt', tele: 'Telegram', tu_van: 'AI rút từ tư vấn', tong_hop: 'AI tổng hợp', hv_gopy: 'học viên góp ý' }[x.nguon] || x.nguon) + (x.nguoi ? ' (' + x.nguoi + ')' : '') + ' · ' + x.thoi_gian));
      var row = el('div', 'tl-row');
      function doi(tt2) { return async function () { try { var k = await TK.goi({ action: 'hook_ai', mode: 'bh_sua', token: TK.token(), id: x.id, trang_thai: tt2 }); if (k.ok) veBoNho(); } catch (e) { } }; }
      if (x.trang_thai !== 'on') row.appendChild(nut(x.trang_thai === 'cho' ? '✓ Duyệt' : '▶ Bật lại', 'ok', doi('on')));
      if (x.trang_thai === 'on') row.appendChild(nut('⏸ Tắt', null, doi('off')));
      row.appendChild(nut('🗑 Xoá', null, function () { if (confirm('Xoá bài học này?')) doi('xoa')(); }));
      the.appendChild(row); bnEl.appendChild(the);
    });
  }

  /* ── vẽ tin nhắn ── */
  function veDs() {
    if (!dsEl) return;
    dsEl.innerHTML = '';
    if (!st.ls.length) dsEl.appendChild(boc('ai', veChu('Chào bạn 👋 Mình là trợ lý của **Tự Mình Xây Kênh**, xem được kết quả bạn đang mở và hồ sơ kênh của bạn.\nHỏi mình vì sao điểm thấp, nên sửa gì trước, hay nhờ viết hook, kịch bản. Bấm nút mic để **nói** thay vì gõ nhé.\n(Mentor có thể đọc lại các câu hỏi để dạy mình tư vấn tốt hơn.)'), true));
    st.ls.forEach(function (m, i) { dsEl.appendChild(veTin(m, i)); });
    veChips();
    dsEl.scrollTop = dsEl.scrollHeight;
  }
  /* một dòng tin: AI có avatar nhỏ bên trái */
  function boc(vai, html, laHtml, them) {
    var d = el('div', 'tl-dong ' + vai + (them || ''));
    if (vai === 'ai') { var a = el('span', 'tl-av nho'); a.innerHTML = IC.ai; d.appendChild(a); }
    var m = el('div', 'tl-m'); if (laHtml) m.innerHTML = html; else m.textContent = html;
    d.appendChild(m); return d;
  }
  function veTin(m, i) {
    if (m.vai === 'bh') return el('div', 'tl-bh', m.text);
    var dong = boc(m.vai === 'ai' ? 'ai' : 'nd', m.vai === 'ai' ? veChu(m.text) : m.text, m.vai === 'ai', m.day ? ' day' : '');
    var d = dong.querySelector('.tl-m');
    if (m.noi) d.appendChild(el('small', 'tl-ghi', '🎙️ nói'));
    if (m.day) d.appendChild(el('small', 'tl-ghi', 'dạy AI'));
    if (m.vai === 'ai' && !m.loi) {
      var hd = el('div', 'tl-hd');
      function icn(svg, ten, fn, c) { var b = nut('', c || null, fn, ten); b.innerHTML = svg; return b; }
      hd.appendChild(icn(IC.loa, 'Nghe', function () { docTo(m.text); }));
      hd.appendChild(icn(IC.chep, 'Chép', function () { try { navigator.clipboard.writeText(chuTron(m.text)); this.classList.add('on'); } catch (e) { } }));
      hd.appendChild(icn(IC.thich, 'Trả lời hay', function () { m.danhGia = 'up'; luu(); veDs(); if (m.ca) TK.goi({ action: 'hook_ai', mode: 'ca_danhgia', token: TK.token(), ca_id: m.ca, danh_gia: 'up' }).catch(function () { }); }, m.danhGia === 'up' ? 'on' : null));
      hd.appendChild(icn(IC.khong, 'Chưa đúng', function () { moGopY(d, m, i, false); }, m.danhGia === 'down' ? 'on' : null));
      if (TK.laMentor && TK.laMentor()) { var gy = nut('', 'gy', function () { moGopY(d, m, i, true); }, 'Góp ý cho AI'); gy.innerHTML = IC.sua + 'Góp ý'; hd.appendChild(gy); }
      d.appendChild(hd);
    }
    return dong;
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
      if (!gy) { if (m.ca && !laMentor) TK.goi({ action: 'hook_ai', mode: 'ca_danhgia', token: TK.token(), ca_id: m.ca, danh_gia: 'down' }).catch(function () { }); f.remove(); veDs(); return; }
      bGui.disabled = true; bGui.textContent = 'Đang ghi nhớ…';
      var hoi = ''; for (var k = i - 1; k >= 0; k--) { if (st.ls[k].vai === 'nd') { hoi = st.ls[k].text; break; } }
      var r;
      try { r = await TK.goi({ action: 'hook_ai', mode: 'bh_them', token: TK.token(), dev: TK.dev(), gop_y: gy, ca_id: m.ca || '', tool: toolHienTai(), ho_so: TK.hoSo(), ngu_canh: 'Người dùng hỏi: ' + hoi.slice(0, 800) + '\nAI đã trả lời: ' + String(m.text).slice(0, 1500) }); }
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
    st.dang = true; chinhBtn.disabled = true;
    var day = !!(st.day && TK.laMentor && TK.laMentor());
    var lichSu = st.ls.filter(function (m) { return m.vai === 'nd' || m.vai === 'ai'; }).slice(-12).map(function (m) { return { vai: m.vai, text: m.text }; });
    var tin = { vai: 'nd', text: chu || '🎙️ (đang nghe…)', noi: !!(them.noi || them.am_thanh), day: day };
    st.ls.push(tin); luu(); veDs(); nhap.value = ''; coGian(); veMic(); chipsEl.innerHTML = '';
    dsEl.appendChild(boc('ai', '<span class="tl-cho"><i></i><i></i><i></i></span>', true)); dsEl.scrollTop = dsEl.scrollHeight;
    tt(them.am_thanh ? 'Trợ lý đang nghe đoạn ghi âm…' : '');
    var r;
    try {
      r = await TK.goiNen({ action: 'hook_ai', mode: 'chat', token: TK.token(), dev: TK.dev(), tin: chu, am_thanh: them.am_thanh || '', am_mime: them.am_mime || '',
        lich_su: lichSu, ngu_canh: nguCanh(), ho_so: TK.hoSo(), noi: !!(them.noi || them.am_thanh || st.hoiThoai), day: day }, { tool: 'chat', nhan: 'Trợ lý trả lời' });
    } catch (e) { r = { ok: false, error: TK.loiMang(e) ? 'mang' : 'may_chu' }; }
    st.dang = false; chinhBtn.disabled = false; tt(''); veMic();
    if (r.ok) {
      if (them.am_thanh && r.nghe_duoc) tin.text = r.nghe_duoc;
      var m = { vai: 'ai', text: r.tra_loi || '…', goi_y: r.goi_y || [], ca: r.ca_id || '' };
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
    // trợ lý trả lời xong trong lúc bạn đã rời trang: thêm vào cuộc trò chuyện
    if (TK.nhanViec) TK.nhanViec('chat', function (r) {
      st.ls = json(LS_KEY, []);
      if (r.ok) st.ls.push({ vai: 'ai', text: r.tra_loi || '…', goi_y: r.goi_y || [], ca: r.ca_id || '' });
      else st.ls.push({ vai: 'ai', text: '⚠️ ' + (LOI[r.error] || 'Câu hỏi lúc nãy chưa được trả lời, gửi lại giúp mình.'), loi: true });
      luu(); veDs();
      if (!hop.classList.contains('mo')) { fab.classList.add('co-moi'); }
    });
    if (TK.nghe) TK.nghe(function () { veMentor(); if (hop && hop.classList.contains('mo')) veDs(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoi); else khoi();
  global.TroLy = { mo: mo, dong: dong, gui: function (t) { mo(); gui(t); } };
})(window);
