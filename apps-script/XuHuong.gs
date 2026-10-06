/* ═══════════════════════════════════════════════════════════════════════════
   BẢN TIN XU HƯỚNG TUẦN (XuHuong.gs)
   ─────────────────────────────────────────────────────────────────────────
   1. Mỗi lượt Soi video / Chấm video ghi một dòng vào sheet "XuHuong" (khung, dạng, kiểu hook, concept, số view…).
      Video học viên đem soi là video đang viral ngoài thị trường, nên đây là dữ liệu thị trường Việt có thật.
   2. Mỗi tuần (hoặc khi gõ /xuhuong tao) AI đọc số liệu 14 ngày + tra Google, viết bản tin 10–14 dòng.
   3. Bot gửi bản nháp cho admin kèm nút ✅ Duyệt / ✏️ Sửa / 🗑 Bỏ. Chưa duyệt thì không tool nào dùng.
   4. Bản đã duyệt được chèn vào prompt của các tool AI trong 21 ngày (HOOK_XH, giống bài học mentor HOOK_BH).

   Chi phí: tạo bản tin 1–2 lượt gọi AI mỗi tuần. Chèn vào tool: thêm tối đa ~1.500 ký tự (vài trăm token đầu vào)
   mỗi lượt, không làm câu trả lời dài hơn.
   Bot: /xuhuong · /xuhuong tao · /xuhuong sua · /xuhuong tat · /xuhuong lich
   ═══════════════════════════════════════════════════════════════════════════ */

var XH_SHEET = 'XuHuong';
var XH_HEADERS = ['t','luc','tool','nganh','dang','khung','hook_kieu','concept','cong_thuc','view','view_gio','diem','tac_gia','nen','muon'];
var XH_NGAY_DUNG = 21;          // bản tin đã duyệt dùng trong bao nhiêu ngày
var XH_NGAY_DOC = 14;           // tạo bản tin từ dữ liệu bao nhiêu ngày gần nhất
var XH_TOI_DA_CHEN = 1500;      // ký tự tối đa chèn vào mỗi lượt AI
var HOOK_XH = '';

/* ── 1. ghi dữ liệu (gọi từ hookSoi / hookChamVideo, không bao giờ làm hỏng lượt chính) ── */
function xhGhi(o){
  try{
    var sh = bang(XH_SHEET, XH_HEADERS);
    var dong = Object.assign({ t: Date.now(), luc: nowVN() }, o || {});
    sh.appendRow(XH_HEADERS.map(function(h){ var v = dong[h]; return v == null ? '' : (typeof v === 'string' ? v.slice(0, 300) : v); }));
  }catch(e){}
}
function xhGhiSoi(d, so, b){
  d = d || {}; so = so || {}; b = b || {};
  var tt = d.tom_tat || {}, c1 = d.cua1 || {}, c2 = d.cua2 || {}, c3 = d.cua3 || {}, mk = d.muon_khuon || {};
  xhGhi({ tool:'soi', nganh: tt.nganh, dang: tt.dang, khung: c2.khung, hook_kieu: c1.hook_kieu,
    concept: (c1.concept || []).map(function(c){ return c && c.ten; }).filter(Boolean).join(', '),
    cong_thuc: c3.cong_thuc, view: Number(so.view) || '', tac_gia: b.tac_gia, nen: b.nen,
    muon: [b.dang_muon, mk.khung ? 'khung đề xuất ' + mk.khung : ''].filter(Boolean).join(' · ') });
}
function xhGhiCham(d, b){
  d = d || {}; b = b || {};
  var tt = d.tom_tat || {}, meta = d.meta || {}, bd = d.ban_dung || {};
  xhGhi({ tool:'cham', nganh: b.chu_de || tt.chu_de, dang: tt.dang, khung: bd.format, diem: Number(d.tong) || '',
    view: (meta.so_lieu && Number(meta.so_lieu.view)) || '', view_gio: Number(meta.view_gio) || '', nen: b.nen });
}

/* ── 2. thống kê 14 ngày ── */
function xhDem(ds, truong, tach){
  var dem = {};
  ds.forEach(function(x){
    var v = String(x[truong] || '').trim(); if (!v) return;
    (tach ? v.split(/\s*,\s*/) : [v]).forEach(function(y){ y = y.toLowerCase().slice(0, 60); if (y) dem[y] = (dem[y] || 0) + 1; });
  });
  return Object.keys(dem).sort(function(a, b){ return dem[b] - dem[a]; }).slice(0, 6).map(function(k){ return k + ' (' + dem[k] + ')'; });
}
function xhThongKe(){
  var moc = Date.now() - XH_NGAY_DOC * 86400000, ds = [];
  try{ ds = docBang(XH_SHEET, XH_HEADERS).filter(function(x){ return Number(x.t) >= moc; }); }catch(e){}
  var soi = ds.filter(function(x){ return x.tool === 'soi'; }), cham = ds.filter(function(x){ return x.tool === 'cham'; });
  var topView = soi.filter(function(x){ return Number(x.view) > 0 && x.cong_thuc; }).sort(function(a, b){ return Number(b.view) - Number(a.view); }).slice(0, 5)
    .map(function(x){ return (x.nganh || '?') + ' · ' + Math.round(Number(x.view) / 1000) + 'K view · ' + x.cong_thuc; });
  var theoFormat = {};
  cham.forEach(function(x){ var f = x.khung || '?'; if (!theoFormat[f]) theoFormat[f] = {n:0, d:0, vg:0, nvg:0}; theoFormat[f].n++; theoFormat[f].d += Number(x.diem) || 0; if (Number(x.view_gio) > 0){ theoFormat[f].vg += Number(x.view_gio); theoFormat[f].nvg++; } });
  var chamFormat = Object.keys(theoFormat).map(function(f){ var o = theoFormat[f]; return f + ': ' + o.n + ' video, điểm TB ' + Math.round(o.d / o.n) + (o.nvg ? ', ' + Math.round(o.vg / o.nvg) + ' view/giờ' : ''); });
  return { so_soi: soi.length, so_cham: cham.length,
    khung: xhDem(soi, 'khung'), dang: xhDem(soi, 'dang'), hook: xhDem(soi, 'hook_kieu'), concept: xhDem(soi, 'concept', true), nganh: xhDem(soi, 'nganh'),
    top_view: topView, cham_format: chamFormat };
}
function xhThongKeText(tk){
  if (!tk.so_soi && !tk.so_cham) return 'Chưa có lượt soi hay chấm nào trong ' + XH_NGAY_DOC + ' ngày qua.';
  return [
    'Trong ' + XH_NGAY_DOC + ' ngày: ' + tk.so_soi + ' video viral được học viên đem soi, ' + tk.so_cham + ' video của học viên được chấm.',
    tk.khung.length ? '- Khung kịch bản của video viral: ' + tk.khung.join(', ') : '',
    tk.dang.length ? '- Dạng video viral: ' + tk.dang.join(', ') : '',
    tk.hook.length ? '- Kiểu hook: ' + tk.hook.join(', ') : '',
    tk.concept.length ? '- Concept: ' + tk.concept.join(', ') : '',
    tk.nganh.length ? '- Ngách: ' + tk.nganh.join(', ') : '',
    tk.top_view.length ? '- Video view cao nhất và công thức: ' + tk.top_view.join(' | ') : '',
    tk.cham_format.length ? '- Video học viên theo format: ' + tk.cham_format.join(' | ') : ''
  ].filter(Boolean).join('\n');
}

/* ── 3. gọi Gemini trả chữ thường, có thể bật tra Google (google_search) ── */
function xhGoiAi(prompt, timKiem){
  var key = hookCfg('GEMINI_API_KEY'); if (!key) return {ok:false, loi:'chua_co_key'};
  var models = (geminiModels(key) || []).filter(function(m){ return !/lite/.test(m); }).slice(0, 3);
  if (!models.length) models = ['gemini-2.5-flash'];
  var ds = gemDsKey(key), loi = '', nghiIt = 0, daGoi = false;
  for (var mi = 0; mi < models.length; mi++){
    for (var ki = 0; ki < ds.length; ki++){
      var k = ds[ki], model = models[mi], nghi = gemConNghi(k, model).giay;
      if (nghi){ nghiIt = nghiIt ? Math.min(nghiIt, nghi) : nghi; continue; }
      daGoi = true;
      var body = { contents:[{role:'user', parts:[{text: prompt}]}], generationConfig:{ temperature: 0.4, maxOutputTokens: 16000 } };
      if (timKiem) body.tools = [{ google_search: {} }];
      var r;
      try{ r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {method:'post', contentType:'application/json', muteHttpExceptions:true, headers:{'x-goog-api-key': k}, payload: JSON.stringify(body)}); }
      catch(e){ loi = 'mang: ' + e; continue; }
      var ma = r.getResponseCode(), raw = r.getContentText();
      if (ma === 200){
        var j = {}; try{ j = JSON.parse(raw); }catch(e){}
        var cand = (j.candidates || [])[0] || {};
        var chu = ((cand.content || {}).parts || []).map(function(p){ return p.text || ''; }).join('').trim();
        if (!chu){ loi = model + ' tra ve rong (' + (cand.finishReason || (j.promptFeedback || {}).blockReason || '?') + ')'; continue; }
        var nguon = [], daCo = {};
        (((cand.groundingMetadata || {}).groundingChunks) || []).forEach(function(c){ var w = c.web || {}; if (w.uri && !daCo[w.uri] && nguon.length < 6){ daCo[w.uri] = 1; nguon.push({ten: String(w.title || '').slice(0, 80), uri: String(w.uri)}); } });
        return {ok:true, text: chu, nguon: nguon, model: model, tim: !!timKiem};
      }
      loi = model + ' http ' + ma + ': ' + String(raw).slice(0, 200);
      if (ma === 429){
        // Có tra Google thì 429 có thể chỉ là hết lượt tra Google: không cho key nghỉ, để lượt không tra vẫn chạy và tool của học viên không bị ảnh hưởng
        if (timKiem) continue;
        var d4 = gemDoc429(raw); gemKeyNghi(k, d4.ngay ? gemGiayToiReset() : Math.max(20, d4.cho || 0), model, d4.ngay ? 'n' : 'p'); continue;
      }
      if (ma === 400 && timKiem && !/API_KEY_INVALID|API key not valid/i.test(raw)) return {ok:false, loi: loi, khong_tim: true};   // model hoặc key không cho tra Google
      if (ma === 404) break;
    }
  }
  if (!daGoi && nghiIt) return {ok:false, loi: 'het_luot:' + nghiIt};
  return {ok:false, loi: loi || 'khong_ro'};
}
/* lỗi tạo bản tin → câu dễ hiểu + việc cần làm */
function xhLoiDe(loi){
  loi = String(loi || '');
  var m = loi.match(/^het_luot:(\d+)/);
  if (loi === 'chua_co_key') return '🔑 Máy chủ chưa có key Gemini. Bấm /keygemini rồi dán key, xong bấm /xhtao lại.';
  if (m) return '⏳ Các key Gemini đang hết lượt, mở lại sau khoảng ' + hookThoiGian(Number(m[1])) + '. Muốn chạy ngay: thêm key tạo ở project Google khác bằng /keygemini.';
  if (/http 429/.test(loi)) return '⏳ Key Gemini hết hạn mức. Đợi một lúc rồi bấm /xhtao, hoặc thêm key ở project khác bằng /keygemini.';
  if (/API_KEY_INVALID|API key not valid|http 401/i.test(loi)) return '🔑 Key Gemini sai hoặc đã bị xoá. Xem /keygemini, xoá key hỏng và thêm key mới.';
  if (/http 403/.test(loi)) return '🔑 Key Gemini bị chặn (project chưa bật Generative Language API hoặc key giới hạn API). Tạo key mới ở aistudio.google.com rồi thêm bằng /keygemini.';
  if (/^mang|Timeout|timed out/i.test(loi)) return '📶 Máy chủ gọi Gemini bị lỗi mạng. Bấm /xhtao lại sau 1 phút.';
  if (/tra ve rong/.test(loi)) return '🤔 AI trả về rỗng. Bấm /xhtao lại.';
  return '⚠️ Lỗi chưa rõ. Bấm /xhtao lại; vẫn lỗi thì chụp tin này gửi người làm kỹ thuật.';
}

/* ── 4. tạo bản tin nháp và gửi bot ── */
function xhPrompt(tk, ngoai){
  return [
    'Bạn là mentor của khóa "Tự Mình Xây Kênh" (dạy làm TikTok, Reels cho người Việt: chủ shop nhỏ, người đi làm, người bán dịch vụ, người kể chuyện nghề).',
    'Hãy viết BẢN TIN XU HƯỚNG TUẦN cho các công cụ AI của khoá dùng khi gợi ý format, hook, nhạc, chủ đề cho học viên.',
    '',
    'SỐ LIỆU NỘI BỘ (chắc chắn đúng, ưu tiên hàng đầu):',
    xhThongKeText(tk),
    '',
    ngoai ? 'NGUỒN NGOÀI ĐÃ LẤY TỰ ĐỘNG (dữ liệu thật, dùng để bắt chủ đề và kiểu nội dung đang nóng; video thịnh hành YouTube có nhiều nhạc, phim, game: chỉ rút điều áp dụng được cho video ngắn của học viên, không chép tên bài):\n' + ngoai + '\n' : '',
    'Nếu được tra Google, hãy tìm xu hướng nội dung TikTok và Reels ở Việt Nam trong khoảng 2–3 tuần gần đây: format đang lên, kiểu hook, kiểu nhạc và nhịp dựng, chủ đề nóng ở các ngách giáo dục, nghề nghiệp, kinh doanh nhỏ, ẩm thực, làm đẹp, đời sống. Chỉ lấy điều có nguồn đáng tin, không lấy tin đồn.',
    '',
    'TRẢ VỀ CHỮ THƯỜNG, ĐÚNG KHUÔN SAU, không thêm lời mở đầu hay kết:',
    'FORMAT ĐANG LÊN:',
    '- ...',
    'KIỂU HOOK ĐANG CHẠY:',
    '- ...',
    'NHẠC VÀ NHỊP DỰNG:',
    '- ...',
    'CHỦ ĐỀ NÓNG THEO NGÁCH:',
    '- ...',
    'NÊN TRÁNH:',
    '- ...',
    'Luật: tổng 10–14 gạch đầu dòng, mỗi dòng dưới 30 chữ, cụ thể làm theo được (VD "Chữ story 15s một cảnh đời thường đang được lưu nhiều ở ngách nghề"). Cuối mỗi dòng ghi nguồn trong ngoặc: (nội bộ) nếu từ số liệu nội bộ, (YouTube) nếu từ danh sách thịnh hành, (RSS) nếu từ tin RSS, (Google) nếu từ kết quả tra. Không bịa tên bài hát, tên trend, con số; không chắc thì bỏ dòng đó. Số liệu nội bộ ít thì nói rõ là tín hiệu sớm.'
  ].join('\n');
}
function xhTaoBanTin(){
  var tk = xhThongKe(), yt = { ok:false }, rss = { tin: [], so_nguon: 0, loi: [] };
  try{ yt = xhLayYoutube(); }catch(e){ yt = { ok:false, loi: String(e).slice(0, 100) }; }
  try{ rss = xhLayRss(); }catch(e){ rss = { tin: [], so_nguon: 0, loi: [String(e).slice(0, 100)] }; }
  var p = xhPrompt(tk, xhNguonText(yt, rss));
  var kq = xhGoiAi(p, true);
  if (!kq.ok) kq = xhGoiAi(p + '\n\nLần này KHÔNG tra được Google: chỉ dựa vào số liệu nội bộ và kiến thức nghề, ghi nguồn (nội bộ) hoặc (kinh nghiệm).', false);
  if (!kq.ok){ xhBaoAdmin('⚠️ Chưa tạo được bản tin xu hướng tuần.\n' + xhLoiDe(kq.loi) + '\n\nChi tiết: `' + String(kq.loi || '').replace(/`/g, "'").slice(0, 200) + '`'); return {ok:false, loi: kq.loi}; }
  var nhap = { id: Utilities.formatDate(new Date(), 'GMT+7', 'yyMMddHHmm'), text: String(kq.text).slice(0, 3000), nguon: kq.nguon || [], tim: kq.tim,
    so_soi: tk.so_soi, so_cham: tk.so_cham, luc: nowVN(),
    yt: yt.ok ? yt.so + ' video thịnh hành (' + yt.so_shorts + ' video ngắn)' : 'không lấy được (' + String(yt.loi || '').slice(0, 80) + ')',
    rss: rss.tin.length + ' tin từ ' + rss.so_nguon + ' nguồn' + (rss.loi.length ? ', lỗi: ' + rss.loi.slice(0, 3).join('; ') : '') };
  PropertiesService.getScriptProperties().setProperty('XH_NHAP', JSON.stringify(nhap));
  xhGuiNhap(nhap);
  return {ok:true, nhap: nhap};
}
function xhGuiNhap(nhap, chatIds){
  var dau = '🗞 *Bản tin xu hướng tuần* (nháp ' + nhap.luc + ')\nDữ liệu: ' + nhap.so_soi + ' lượt soi, ' + nhap.so_cham + ' lượt chấm trong ' + XH_NGAY_DOC + ' ngày' + (nhap.tim ? ' + tra Google' : ' (không tra được Google)') +
    (nhap.yt ? '\nYouTube: ' + nhap.yt : '') + (nhap.rss ? '\nRSS: ' + nhap.rss : '') + '\n';
  var nguon = (nhap.nguon || []).length ? '\n\nNguồn Google: ' + nhap.nguon.map(function(x, i){ return (i + 1) + '. ' + (x.ten || 'link'); }).join(' · ') : '';
  var cuoi = '\n\nDuyệt thì các tool AI dùng bản tin này ' + XH_NGAY_DUNG + ' ngày. Sửa: bấm ✏️ rồi gửi bản đã sửa.';
  var nut = [[{text:'✅ Duyệt', callback_data:'x:ok:' + nhap.id}, {text:'✏️ Sửa', callback_data:'x:sua:' + nhap.id}, {text:'🗑 Bỏ', callback_data:'x:bo:' + nhap.id}]];
  (chatIds || dsChat('ADMIN_CHAT_IDS')).forEach(function(id){ tgSend(id, dau + '\n' + nhap.text + nguon + cuoi, nut); });
}
function xhBaoAdmin(t){ try{ dsChat('ADMIN_CHAT_IDS').forEach(function(id){ tgSend(id, t); }); }catch(e){} }

/* ── 5. duyệt / sửa / bỏ ── */
function xhDocP(k){ try{ return JSON.parse(PropertiesService.getScriptProperties().getProperty(k) || 'null'); }catch(e){ return null; } }
function xhDuyet(text, nguon){
  var o = { text: String(text).trim().slice(0, 3000), luc: nowVN(), het: Date.now() + XH_NGAY_DUNG * 86400000, nguon: nguon || [] };
  var P = PropertiesService.getScriptProperties(); P.setProperty('XH_DUYET', JSON.stringify(o)); P.deleteProperty('XH_NHAP');
  try{ CacheService.getScriptCache().remove('xh_khoi'); }catch(e){}
  return o;
}
function xhCallback(cb){
  var p = String(cb.data || '').split(':'), act = p[1], id = p[2];
  var chatId = cb.message.chat.id, msgId = cb.message.message_id, nhap = xhDocP('XH_NHAP'), nhan;
  if (act === 'l'){ tgAnswer(cb.id); return XH_LENH_TAT['xh' + id] ? xhLenhTat('xh' + id, '', chatId, null) : null; }   // nút dưới /xuhuong
  if (!nhap || String(nhap.id) !== String(id)) return tgAnswer(cb.id, 'Bản nháp này đã cũ hoặc đã xử lý');
  if (act === 'ok'){ var o = xhDuyet(nhap.text, nhap.nguon); nhan = '✅ Đã duyệt · dùng tới ' + Utilities.formatDate(new Date(o.het), 'GMT+7', 'dd/MM'); }
  else if (act === 'bo'){ PropertiesService.getScriptProperties().deleteProperty('XH_NHAP'); nhan = '🗑 Đã bỏ bản nháp'; }
  else if (act === 'sua'){
    datCho(chatId, 'xuhuong'); try{ CacheService.getScriptCache().put('xh_sua_' + chatId, String(id), 3600); }catch(e){}
    tgAnswer(cb.id, 'Gửi bản đã sửa');
    tgApi('sendMessage', {chat_id: chatId, text: nhap.text});
    return tgSend(chatId, '✏️ Mình vừa gửi lại bản nháp ở trên dạng chữ thường. Chép, sửa chỗ bạn muốn rồi gửi lại nguyên bản vào đây, bot sẽ duyệt luôn bản đó.\n\n_Đổi ý thì /huy._');
  } else return tgAnswer(cb.id);
  tgAnswer(cb.id, nhan);
  tgApi('editMessageReplyMarkup', {chat_id: chatId, message_id: msgId, reply_markup:{inline_keyboard:[[{text: nhan, callback_data:'xong'}]]}});
}

/* ── 6. lệnh bot /xuhuong (Studio.gs chuyển sang) ── */
/* Lệnh tắt trong menu bot, bấm là chạy không cần gõ chữ phía sau: /xhtao /xhsua /xhyoutube /xhrss /xhlich */
var XH_LENH_TAT = { xhtao: 'tao', xhsua: 'sua', xhyoutube: 'youtube', xhrss: 'rss', xhlich: 'lich' };
function xhLenhTat(cmd, arg, chatId, msg){
  var con = XH_LENH_TAT[cmd], coThem = con === 'youtube' || con === 'rss';
  var choLai = con === 'sua' ? 'xuhuong' : cmd;   // câu trả lời sau khi bot hỏi quay về đúng lệnh này
  var hoi = function(cau){ datCho(chatId, choLai); return tgSend(chatId, cau + '\n\n_Đổi ý thì /huy._'); };
  return xhLenh(coThem ? (con + ' ' + String(arg || '')).trim() : con, chatId, hoi, msg);
}
var XH_NUT = [
  [{text: '🔄 Tạo bản tin mới', callback_data: 'x:l:tao'}, {text: '✏️ Tự viết / sửa', callback_data: 'x:l:sua'}],
  [{text: '▶️ Key YouTube', callback_data: 'x:l:youtube'}, {text: '📰 Nguồn RSS', callback_data: 'x:l:rss'}],
  [{text: '⏰ Tự chạy mỗi thứ Hai', callback_data: 'x:l:lich'}]
];
function xhLenh(arg, chatId, hoi, msg){
  arg = String(arg || '').trim();
  var c = CacheService.getScriptCache(), dangSua = c.get('xh_sua_' + chatId);
  var lenh = arg.toLowerCase();
  var dau1 = lenh.split(/\s+/)[0], conLai = arg.replace(/^\S+\s*/, '');
  if (dangSua && arg && !/^(tao|tạo|sua|sửa|tat|tắt|lich|lịch|xem|youtube|yt|rss)$/.test(dau1)){
    c.remove('xh_sua_' + chatId);
    var nhapCu = xhDocP('XH_NHAP'), o = xhDuyet(arg, nhapCu && nhapCu.nguon);
    return tgSend(chatId, '✅ Đã duyệt bản bạn sửa · các tool AI dùng tới ' + Utilities.formatDate(new Date(o.het), 'GMT+7', 'dd/MM/yyyy') + '.');
  }
  if (/^(AIza|AQ\.)/.test(arg) && !dangSua) return xhLenhYoutube(arg, chatId, hoi, msg);   // dán key sau câu bot hỏi
  if (/^https?:\/\//i.test(arg) && !dangSua) return xhLenhRss(arg, chatId, hoi);           // dán link RSS sau câu bot hỏi
  if (dau1 === 'youtube' || dau1 === 'yt') return xhLenhYoutube(conLai, chatId, hoi, msg);
  if (dau1 === 'rss') return xhLenhRss(conLai, chatId, hoi);
  if (lenh === 'tao' || lenh === 'tạo'){
    tgSend(chatId, '⏳ Đang đọc số liệu ' + XH_NGAY_DOC + ' ngày và tra xu hướng, khoảng 1 phút…');
    xhTaoBanTin(); return;   // bản nháp có nút duyệt, hoặc báo lỗi, đã được gửi trong xhTaoBanTin
  }
  if (lenh === 'sua' || lenh === 'sửa'){
    var dang = xhDocP('XH_DUYET'); c.put('xh_sua_' + chatId, 'tay', 3600);
    if (dang && dang.text) tgApi('sendMessage', {chat_id: chatId, text: dang.text});
    return hoi('✏️ Gửi nguyên bản tin bạn muốn các tool AI dùng (mỗi ý một dòng bắt đầu bằng "- "). ' + (dang ? 'Bản đang dùng mình vừa gửi ở trên để bạn chép sửa.' : ''));
  }
  if (lenh === 'tat' || lenh === 'tắt'){
    PropertiesService.getScriptProperties().deleteProperty('XH_DUYET'); try{ c.remove('xh_khoi'); }catch(e){}
    return tgSend(chatId, '✅ Đã gỡ bản tin. Các tool AI không dùng xu hướng tuần nữa cho tới khi duyệt bản mới.');
  }
  if (lenh === 'lich' || lenh === 'lịch'){
    try{ xhCaiLich(); return tgSend(chatId, '✅ Bot sẽ tự tạo bản tin mỗi sáng thứ Hai lúc 8 giờ và gửi bạn duyệt.'); }
    catch(e){ return tgSend(chatId, '⚠️ Chưa đặt được lịch (' + String(e).slice(0, 120) + '). Mở Apps Script, chọn hàm xhCaiLich rồi bấm Run một lần.'); }
  }
  // xem tình trạng
  var duyet = xhDocP('XH_DUYET'), nhap = xhDocP('XH_NHAP'), tk = xhThongKe();
  var d = ['🗞 *Bản tin xu hướng tuần*', ''];
  if (duyet && duyet.het > Date.now()) d.push('✅ Đang dùng bản duyệt ' + duyet.luc + ', còn hiệu lực tới ' + Utilities.formatDate(new Date(duyet.het), 'GMT+7', 'dd/MM') + '.', '', duyet.text.slice(0, 1500));
  else d.push(duyet ? '⌛ Bản tin cũ đã hết hạn, các tool đang không dùng xu hướng.' : '⛔ Chưa có bản tin nào được duyệt.');
  if (nhap) d.push('', '📝 Có bản nháp ' + nhap.luc + ' đang chờ duyệt (xem lại tin nhắn có nút Duyệt).');
  d.push('', '📊 Số liệu ' + XH_NGAY_DOC + ' ngày: ' + tk.so_soi + ' lượt soi, ' + tk.so_cham + ' lượt chấm.',
    '▶️ YouTube: ' + (cfgProp('YOUTUBE_API_KEY') ? 'có key riêng' : 'chưa có key riêng, thử bằng key Gemini') + ' · 📰 RSS: ' + xhDsRss().length + ' nguồn',
    '', 'Bấm nút bên dưới, hoặc chọn trong Menu: /xhtao tạo bản nháp ngay · /xhsua tự viết, sửa · /xhyoutube key YouTube · /xhrss nguồn RSS · /xhlich tự chạy thứ Hai · `/xuhuong tat` gỡ bản tin');
  return tgSend(chatId, d.join('\n'), XH_NUT);
}

/* Lịch tự chạy mỗi thứ Hai 8 giờ sáng giờ Việt Nam. Chạy tay một lần trong Apps Script nếu bot báo chưa đặt được. */
function xhCaiLich(){
  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getHandlerFunction() === 'xhTaoBanTin') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('xhTaoBanTin').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).inTimezone('Asia/Ho_Chi_Minh').create();
  Logger.log('✔ Đã đặt lịch tạo bản tin mỗi thứ Hai 8 giờ (giờ Việt Nam).');
}

/* ── 7. khối chèn vào prompt các tool AI (đọc 1 lần, nhớ 10 phút) ── */
function xhKhoi(){
  var c = CacheService.getScriptCache(), nho = null;
  try{ nho = c.get('xh_khoi'); }catch(e){}
  if (nho != null) return nho === '-' ? '' : nho;
  var o = xhDocP('XH_DUYET'), khoi = '';
  if (o && o.text && Number(o.het) > Date.now())
    khoi = 'XU HƯỚNG THỊ TRƯỜNG GẦN ĐÂY (mentor đã duyệt ngày ' + o.luc + '). Dùng để gợi ý format, hook, nhạc, chủ đề cho hợp thời khi phù hợp với kênh học viên; không bịa thêm xu hướng ngoài danh sách; xu hướng không thay được chất liệu thật của học viên và các luật của khoá:\n' + String(o.text).slice(0, XH_TOI_DA_CHEN);
  try{ c.put('xh_khoi', khoi || '-', 600); }catch(e){}
  return khoi;
}

/* ═══════ NGUỒN NGOÀI: YOUTUBE THỊNH HÀNH VIỆT NAM + RSS ═══════
   YouTube Data API v3 (videos.list chart=mostPopular regionCode=VN, tốn 1 đơn vị hạn mức mỗi lần, hạn mức mặc định
   rất dư cho 1 lần mỗi tuần). Cần key Google Cloud đã bật "YouTube Data API v3": bot /xuhuong youtube AIza...
   Không cài key riêng thì thử key Gemini chính (chỉ chạy được nếu project của key đó đã bật YouTube Data API).
   RSS: mặc định là vài truy vấn Google News tiếng Việt về TikTok, Reels; thêm nguồn khác bằng /xuhuong rss them <link>.
   Kênh YouTube muốn theo dõi cũng thêm được dạng RSS: https://www.youtube.com/feeds/videos.xml?channel_id=UC... */
var XH_RSS_MD = [
  'https://news.google.com/rss/search?q=xu+h%C6%B0%E1%BB%9Bng+TikTok&hl=vi&gl=VN&ceid=VN:vi',
  'https://news.google.com/rss/search?q=trend+TikTok+Vi%E1%BB%87t+Nam&hl=vi&gl=VN&ceid=VN:vi',
  'https://news.google.com/rss/search?q=TikTok+Shop+Vi%E1%BB%87t+Nam&hl=vi&gl=VN&ceid=VN:vi',
  'https://news.google.com/rss/search?q=Reels+xu+h%C6%B0%E1%BB%9Bng+n%E1%BB%99i+dung&hl=vi&gl=VN&ceid=VN:vi'
];
var XH_RSS_TOI_DA = 8;          // số nguồn RSS tối đa
var XH_RSS_MOI_NGUON = 6;       // số tin lấy mỗi nguồn
function xhDsRss(){ var ds = xhDocP('XH_RSS'); return Array.isArray(ds) ? ds : XH_RSS_MD.slice(); }
function xhLuuRss(ds){ PropertiesService.getScriptProperties().setProperty('XH_RSS', JSON.stringify(ds.slice(0, XH_RSS_TOI_DA))); }
function xhBoThe(s){
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, function(m, n){ return String.fromCharCode(Number(n)); }).replace(/\s+/g, ' ').trim();
}
/* Đọc RSS 2.0 hoặc Atom bằng biểu thức thường (chịu được feed lỗi nhẹ hơn XmlService). Trả [{tieu_de, link, t}] */
function xhDocRss(xml){
  xml = String(xml || '');
  var khoi = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return khoi.map(function(k){
    var lay = function(the){ var m = k.match(new RegExp('<' + the + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + the + '>', 'i')); return m ? xhBoThe(m[1]) : ''; };
    var link = lay('link'); if (!link){ var mh = k.match(/<link[^>]*href="([^"]+)"/i); link = mh ? mh[1] : ''; }
    var ngay = lay('pubDate') || lay('published') || lay('updated') || lay('dc:date');
    var t = ngay ? Date.parse(ngay) : NaN;
    return { tieu_de: lay('title').slice(0, 160), link: link.slice(0, 300), t: isNaN(t) ? 0 : t };
  }).filter(function(x){ return x.tieu_de; });
}
function xhTenNguon(url){ var m = String(url).match(/[?&]q=([^&]+)/); if (/news\.google\./.test(url) && m) return 'Google News: ' + decodeURIComponent(m[1].replace(/\+/g, ' ')); var h = String(url).match(/^https?:\/\/([^\/]+)/); return h ? h[1].replace(/^www\./, '') : String(url).slice(0, 40); }
function xhLayRss(){
  var ds = xhDsRss(); if (!ds.length) return { tin: [], so_nguon: 0, loi: [] };
  var moc = Date.now() - XH_NGAY_DOC * 86400000, tin = [], loi = [], daCo = {};
  var tl = [];
  try{ tl = UrlFetchApp.fetchAll(ds.map(function(u){ return { url: u, muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0 (TMXK Viral Studio)' } }; })); }
  catch(e){ return { tin: [], so_nguon: ds.length, loi: ['tai rss: ' + String(e).slice(0, 80)] }; }
  tl.forEach(function(r, i){
    if (r.getResponseCode() !== 200){ loi.push(xhTenNguon(ds[i]) + ' http ' + r.getResponseCode()); return; }
    xhDocRss(r.getContentText()).filter(function(x){ return !x.t || x.t >= moc; }).slice(0, XH_RSS_MOI_NGUON).forEach(function(x){
      var khoa = x.tieu_de.toLowerCase().slice(0, 60); if (daCo[khoa]) return; daCo[khoa] = 1;
      tin.push({ tieu_de: x.tieu_de, link: x.link, nguon: xhTenNguon(ds[i]) });
    });
  });
  return { tin: tin.slice(0, 30), so_nguon: ds.length, loi: loi };
}
/* thời lượng ISO 8601 (PT1M5S) → giây */
function xhGiayIso(s){ var m = String(s || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : 0; }
var XH_YT_LOAI = { '1':'Phim, hoạt hình', '2':'Xe', '10':'Âm nhạc', '15':'Thú cưng', '17':'Thể thao', '19':'Du lịch', '20':'Game', '22':'Đời sống, vlog', '23':'Hài', '24':'Giải trí', '25':'Tin tức', '26':'Hướng dẫn, phong cách', '27':'Giáo dục', '28':'Khoa học, công nghệ' };
function xhLayYoutube(){
  var key = cfgProp('YOUTUBE_API_KEY') || hookCfg('GEMINI_API_KEY');
  if (!key) return { ok:false, loi:'chua_co_key' };
  var r;
  try{ r = UrlFetchApp.fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=VN&hl=vi&maxResults=50', { muteHttpExceptions: true, headers: { 'x-goog-api-key': key } }); }
  catch(e){ return { ok:false, loi:'mang: ' + String(e).slice(0, 80) }; }
  var ma = r.getResponseCode(), raw = r.getContentText();
  if (ma !== 200){ var ly = ''; try{ ly = ((JSON.parse(raw).error || {}).message) || ''; }catch(e){} return { ok:false, loi:'http ' + ma + (ly ? ': ' + String(ly).slice(0, 140) : '') }; }
  var ds = []; try{ ds = JSON.parse(raw).items || []; }catch(e){}
  var vids = ds.map(function(v){ var sn = v.snippet || {}, st = v.statistics || {}; return { tieu_de: String(sn.title || '').slice(0, 120), kenh: String(sn.channelTitle || '').slice(0, 60), view: Number(st.viewCount) || 0, giay: xhGiayIso((v.contentDetails || {}).duration), loai: XH_YT_LOAI[sn.categoryId] || 'Khác', the: (sn.tags || []).slice(0, 4).join(', ') }; });
  var shorts = vids.filter(function(v){ return v.giay > 0 && v.giay <= 180; });
  var demLoai = {}; vids.forEach(function(v){ demLoai[v.loai] = (demLoai[v.loai] || 0) + 1; });
  return { ok:true, so: vids.length, so_shorts: shorts.length, vids: vids, shorts: shorts,
    loai: Object.keys(demLoai).sort(function(a, b){ return demLoai[b] - demLoai[a]; }).slice(0, 6).map(function(k){ return k + ' (' + demLoai[k] + ')'; }) };
}
function xhNguonText(yt, rss){
  var d = [];
  if (yt && yt.ok){
    var dong = function(v){ return '"' + v.tieu_de + '" · ' + v.kenh + ' · ' + (v.view >= 1e6 ? (v.view / 1e6).toFixed(1) + 'M' : Math.round(v.view / 1000) + 'K') + ' view' + (v.giay ? ' · ' + v.giay + 's' : '') + (v.the ? ' · tag: ' + v.the : ''); };
    d.push('VIDEO THỊNH HÀNH YOUTUBE VIỆT NAM HÔM NAY (' + yt.so + ' video, ' + yt.so_shorts + ' video ngắn dưới 3 phút; nhóm: ' + yt.loai.join(', ') + '):');
    (yt.shorts.length ? yt.shorts : yt.vids).slice(0, 12).forEach(function(v){ d.push('- ' + dong(v)); });
    if (yt.shorts.length) yt.vids.filter(function(v){ return yt.shorts.indexOf(v) < 0; }).slice(0, 6).forEach(function(v){ d.push('- (video dài) ' + dong(v)); });
  }
  if (rss && rss.tin.length){
    d.push('', 'TIN MỚI ' + XH_NGAY_DOC + ' NGÀY TỪ RSS (' + rss.so_nguon + ' nguồn):');
    rss.tin.slice(0, 25).forEach(function(x){ d.push('- ' + x.tieu_de + ' [' + x.nguon + ']'); });
  }
  return d.join('\n');
}

/* /xuhuong youtube [AIza... | tat | thu] */
function xhLenhYoutube(arg, chatId, hoi, msg){
  arg = String(arg || '').trim(); var P = PropertiesService.getScriptProperties();
  if (/^(tat|tắt|xoa|xóa)$/i.test(arg)){ P.deleteProperty('YOUTUBE_API_KEY'); return tgSend(chatId, '✅ Đã xoá key YouTube riêng. Bản tin sẽ thử bằng key Gemini, không được thì bỏ qua YouTube.'); }
  if (/^(AIza|AQ\.)/.test(arg)){
    if (msg && msg.message_id) try{ tgApi('deleteMessage', {chat_id: chatId, message_id: msg.message_id}); }catch(e){}   // không để key nằm lại trong chat
    var cu = P.getProperty('YOUTUBE_API_KEY'); P.setProperty('YOUTUBE_API_KEY', arg.split(/\s+/)[0]);
    var t = xhLayYoutube();
    if (!t.ok){ if (cu) P.setProperty('YOUTUBE_API_KEY', cu); else P.deleteProperty('YOUTUBE_API_KEY');
      return tgSend(chatId, '❌ Key này chưa gọi được YouTube (' + t.loi + '). Vào Google Cloud của project tạo key, bật "YouTube Data API v3" rồi gửi lại.'); }
    return tgSend(chatId, '✅ Đã lưu key YouTube. Thử lấy được ' + t.so + ' video thịnh hành Việt Nam, ' + t.so_shorts + ' video ngắn. Nhóm nhiều nhất: ' + t.loai.slice(0, 3).join(', ') + '.');
  }
  if (/^(thu|thử)$/i.test(arg)){
    var r = xhLayYoutube();
    if (!r.ok) return tgSend(chatId, '❌ Chưa lấy được YouTube: ' + r.loi + '\nCài key: `/xuhuong youtube AIza...` (key Google Cloud đã bật YouTube Data API v3).');
    return tgSend(chatId, '▶️ YouTube thịnh hành Việt Nam: ' + r.so + ' video, ' + r.so_shorts + ' video ngắn.\n' + (r.shorts.length ? r.shorts : r.vids).slice(0, 8).map(function(v, i){ return (i + 1) + '. ' + v.tieu_de + ' · ' + v.kenh; }).join('\n'));
  }
  return hoi((cfgProp('YOUTUBE_API_KEY') ? '✅ Đang có key YouTube riêng. Gửi key mới nếu muốn thay.\n\n' : '') + '▶️ Gửi key Google Cloud đã bật *YouTube Data API v3* để bản tin đọc video thịnh hành Việt Nam (mỗi tuần tốn 1 đơn vị hạn mức, miễn phí). Có thể dùng chính key Gemini nếu bật API này trong cùng project.\n\n`thu` để thử lấy ngay · `tat` để xoá key. Tin chứa key sẽ được xoá khỏi chat.');
}
/* /xuhuong rss [them <link> | xoa <số> | macdinh | thu] */
function xhLenhRss(arg, chatId, hoi){
  arg = String(arg || '').trim(); var m = arg.match(/^(\S+)\s*([\s\S]*)$/), lenh = m ? m[1].toLowerCase() : '', con = m ? m[2].trim() : '';
  var ds = xhDsRss();
  if (/^https?:\/\//i.test(lenh)){ con = arg; lenh = 'them'; }
  if (lenh === 'them' || lenh === 'thêm'){
    var url = con.split(/\s+/)[0];
    if (!/^https?:\/\/[^\s]+$/i.test(url)) return hoi('📰 Gửi link RSS (bắt đầu bằng https://). VD kênh YouTube: `https://www.youtube.com/feeds/videos.xml?channel_id=UC...`');
    if (ds.indexOf(url) > -1) return tgSend(chatId, 'Nguồn này đã có rồi.');
    if (ds.length >= XH_RSS_TOI_DA) return tgSend(chatId, '⚠️ Đã đủ ' + XH_RSS_TOI_DA + ' nguồn. Xoá bớt: `/xuhuong rss xoa 1`.');
    var r = null; try{ r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true }); }catch(e){}
    var tin = r && r.getResponseCode() === 200 ? xhDocRss(r.getContentText()) : [];
    if (!tin.length) return tgSend(chatId, '❌ Link này không đọc được như RSS' + (r ? ' (http ' + r.getResponseCode() + ')' : '') + '. Kiểm tra lại link feed.');
    ds.push(url); xhLuuRss(ds);
    return tgSend(chatId, '✅ Đã thêm ' + xhTenNguon(url) + ' · đọc được ' + tin.length + ' tin, mới nhất: "' + tin[0].tieu_de + '"');
  }
  if (lenh === 'xoa' || lenh === 'xóa'){
    var so = parseInt(con, 10); if (!(so >= 1 && so <= ds.length)) return tgSend(chatId, 'Gửi `/xuhuong rss xoa 2` (số thứ tự trong `/xuhuong rss`).');
    var bo = ds.splice(so - 1, 1)[0]; xhLuuRss(ds); return tgSend(chatId, '✅ Đã xoá ' + xhTenNguon(bo) + '. Còn ' + ds.length + ' nguồn.');
  }
  if (lenh === 'macdinh' || lenh === 'mặcđịnh'){ PropertiesService.getScriptProperties().deleteProperty('XH_RSS'); return tgSend(chatId, '✅ Đã về ' + XH_RSS_MD.length + ' nguồn mặc định (Google News về TikTok, Reels).'); }
  if (lenh === 'thu' || lenh === 'thử'){
    var kq = xhLayRss();
    return tgSend(chatId, '📰 Lấy được ' + kq.tin.length + ' tin ' + XH_NGAY_DOC + ' ngày từ ' + kq.so_nguon + ' nguồn' + (kq.loi.length ? '\n⚠️ ' + kq.loi.join('; ') : '') + '\n' + kq.tin.slice(0, 8).map(function(x, i){ return (i + 1) + '. ' + x.tieu_de; }).join('\n'));
  }
  return tgSend(chatId, ['📰 *Nguồn RSS của bản tin* · ' + ds.length + '/' + XH_RSS_TOI_DA, ''].concat(ds.map(function(u, i){ return (i + 1) + '. ' + xhTenNguon(u); })).concat(['',
    'Thêm: gửi /xhrss rồi dán link, hoặc `/xuhuong rss them https://...` (trang tin, blog marketing, kênh YouTube dạng `https://www.youtube.com/feeds/videos.xml?channel_id=UC...`)',
    'Xoá: `/xuhuong rss xoa 2` · Về mặc định: `/xuhuong rss macdinh` · Thử đọc: `/xuhuong rss thu`']).join('\n'));
}
