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
  var ds = gemDsKey(key), loi = '';
  for (var mi = 0; mi < models.length; mi++){
    for (var ki = 0; ki < ds.length; ki++){
      var k = ds[ki], model = models[mi];
      if (gemConNghi(k, model).giay) continue;
      var body = { contents:[{role:'user', parts:[{text: prompt}]}], generationConfig:{ temperature: 0.4, maxOutputTokens: 8000 } };
      if (timKiem) body.tools = [{ google_search: {} }];
      var r;
      try{ r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {method:'post', contentType:'application/json', muteHttpExceptions:true, headers:{'x-goog-api-key': k}, payload: JSON.stringify(body)}); }
      catch(e){ loi = 'mang: ' + e; continue; }
      var ma = r.getResponseCode(), raw = r.getContentText();
      if (ma === 200){
        var j = {}; try{ j = JSON.parse(raw); }catch(e){}
        var cand = (j.candidates || [])[0] || {};
        var chu = ((cand.content || {}).parts || []).map(function(p){ return p.text || ''; }).join('').trim();
        if (!chu){ loi = model + ' tra ve rong'; continue; }
        var nguon = [], daCo = {};
        (((cand.groundingMetadata || {}).groundingChunks) || []).forEach(function(c){ var w = c.web || {}; if (w.uri && !daCo[w.uri] && nguon.length < 6){ daCo[w.uri] = 1; nguon.push({ten: String(w.title || '').slice(0, 80), uri: String(w.uri)}); } });
        return {ok:true, text: chu, nguon: nguon, model: model, tim: !!timKiem};
      }
      loi = model + ' http ' + ma + ': ' + String(raw).slice(0, 200);
      if (ma === 429){ var d4 = gemDoc429(raw); gemKeyNghi(k, d4.ngay ? gemGiayToiReset() : Math.max(20, d4.cho || 0), model, d4.ngay ? 'n' : 'p'); continue; }
      if (ma === 400 && timKiem) return {ok:false, loi: loi, khong_tim: true};   // model hoặc key không cho tra Google
      if (ma === 404) break;
    }
  }
  return {ok:false, loi: loi};
}

/* ── 4. tạo bản tin nháp và gửi bot ── */
function xhPrompt(tk){
  return [
    'Bạn là mentor của khóa "Tự Mình Xây Kênh" (dạy làm TikTok, Reels cho người Việt: chủ shop nhỏ, người đi làm, người bán dịch vụ, người kể chuyện nghề).',
    'Hãy viết BẢN TIN XU HƯỚNG TUẦN cho các công cụ AI của khoá dùng khi gợi ý format, hook, nhạc, chủ đề cho học viên.',
    '',
    'SỐ LIỆU NỘI BỘ (chắc chắn đúng, ưu tiên hàng đầu):',
    xhThongKeText(tk),
    '',
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
    'Luật: tổng 10–14 gạch đầu dòng, mỗi dòng dưới 30 chữ, cụ thể làm theo được (VD "Chữ story 15s một cảnh đời thường đang được lưu nhiều ở ngách nghề"). Cuối mỗi dòng ghi nguồn trong ngoặc: (nội bộ) nếu từ số liệu nội bộ, (Google) nếu từ kết quả tra. Không bịa tên bài hát, tên trend, con số; không chắc thì bỏ dòng đó. Số liệu nội bộ ít thì nói rõ là tín hiệu sớm.'
  ].join('\n');
}
function xhTaoBanTin(){
  var tk = xhThongKe(), p = xhPrompt(tk);
  var kq = xhGoiAi(p, true);
  if (!kq.ok) kq = xhGoiAi(p + '\n\nLần này KHÔNG tra được Google: chỉ dựa vào số liệu nội bộ và kiến thức nghề, ghi nguồn (nội bộ) hoặc (kinh nghiệm).', false);
  if (!kq.ok){ xhBaoAdmin('⚠️ Chưa tạo được bản tin xu hướng tuần: ' + String(kq.loi || '').slice(0, 200) + '\nThử lại: /xuhuong tao'); return {ok:false, loi: kq.loi}; }
  var nhap = { id: Utilities.formatDate(new Date(), 'GMT+7', 'yyMMddHHmm'), text: String(kq.text).slice(0, 3000), nguon: kq.nguon || [], tim: kq.tim,
    so_soi: tk.so_soi, so_cham: tk.so_cham, luc: nowVN() };
  PropertiesService.getScriptProperties().setProperty('XH_NHAP', JSON.stringify(nhap));
  xhGuiNhap(nhap);
  return {ok:true, nhap: nhap};
}
function xhGuiNhap(nhap, chatIds){
  var dau = '🗞 *Bản tin xu hướng tuần* (nháp ' + nhap.luc + ')\nDữ liệu: ' + nhap.so_soi + ' lượt soi, ' + nhap.so_cham + ' lượt chấm trong ' + XH_NGAY_DOC + ' ngày' + (nhap.tim ? ' + tra Google' : ' (không tra được Google)') + '\n';
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
function xhLenh(arg, chatId, hoi){
  arg = String(arg || '').trim();
  var c = CacheService.getScriptCache(), dangSua = c.get('xh_sua_' + chatId);
  var lenh = arg.toLowerCase();
  if (dangSua && arg && !/^(tao|tạo|sua|sửa|tat|tắt|lich|lịch|xem)$/.test(lenh)){
    c.remove('xh_sua_' + chatId);
    var nhapCu = xhDocP('XH_NHAP'), o = xhDuyet(arg, nhapCu && nhapCu.nguon);
    return tgSend(chatId, '✅ Đã duyệt bản bạn sửa · các tool AI dùng tới ' + Utilities.formatDate(new Date(o.het), 'GMT+7', 'dd/MM/yyyy') + '.');
  }
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
    '', 'Lệnh: `/xuhuong tao` tạo bản nháp ngay · `/xuhuong sua` tự viết hoặc sửa bản đang dùng · `/xuhuong tat` gỡ bản tin · `/xuhuong lich` bật tự chạy mỗi sáng thứ Hai');
  return tgSend(chatId, d.join('\n'));
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
