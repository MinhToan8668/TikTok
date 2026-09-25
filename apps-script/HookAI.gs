/**
 * HookAI.gs — gói Pro của Hook Text Studio (tools/hook-text.html)
 *
 * Luồng:
 *   trang tool  ──POST {action:'hook_ai', token, text, image, ...}──▶  Apps Script (file này)
 *     1. aiDay(token)            → phải là học viên hoặc mentor đang đăng nhập (Lich.gs)
 *     2. trừ lượt trong ngày     → HOOK_AI_DAILY lượt / người / ngày (mentor không giới hạn)
 *     3. gọi Claude              → key nằm trong Script Properties, trình duyệt không bao giờ thấy
 *     4. ghi log vào tab HookAI  → biết ai dùng, dùng bao nhiêu, tốn bao nhiêu token
 *
 * Nhà cung cấp AI chọn bằng thuộc tính HOOK_AI_PROVIDER:
 *   gemini (mặc định)  → Google Gemini, có bậc miễn phí. Cần GEMINI_API_KEY (lấy ở aistudio.google.com).
 *   claude             → Anthropic Claude, trả tiền theo lượt. Cần ANTHROPIC_API_KEY.
 *
 * Cài đặt (một lần):
 *   Project Settings → Script properties → thêm
 *     GEMINI_API_KEY      AIza...               (bắt buộc khi dùng gemini)
 *     ANTHROPIC_API_KEY   sk-ant-...            (bắt buộc khi dùng claude)
 *     HOOK_AI_PROVIDER    gemini | claude       (tuỳ chọn, mặc định gemini)
 *     HOOK_AI_MODEL       tên model             (tuỳ chọn; gemini mặc định gemini-2.5-flash, claude mặc định claude-opus-5)
 *     HOOK_AI_DAILY       20                    (tuỳ chọn, số lượt mỗi học viên mỗi ngày)
 *   Rồi Deploy → Manage deployments → Edit → New version → Deploy.
 */


/* ── kiến thức nền cho AI: đúc kết từ tài liệu tổng hợp của Tự Mình Xây Kênh ── */
var HOOK_KIEN_THUC = "KIẾN THỨC NỀN VỀ HOOK (đúc kết từ tài liệu tổng hợp của Tự Mình Xây Kênh)\n\n1. LUẬT 1 GIÂY. Người lướt quyết định dừng hay không trong 1 giây, chỉ qua hai cửa: MẮT THẤY (dòng chữ to mở đầu, bối cảnh, nhân vật, biểu cảm) và TAI NGHE (nhạc, giọng). Hook text là thứ mắt thấy đầu tiên, nên nó cạnh tranh với mọi video khác trên bảng tin, không chỉ video cùng ngành. Nội dung hay mà thua ở 1 giây đầu thì không ai biết nó hay.\n\n2. PHƯƠNG TRÌNH HOOK = HÌNH THỨC gây chú ý + NỘI DUNG có giá trị. Hai lớp tách riêng, tối ưu riêng. Người mới thường chỉ lo nội dung mà quên hình thức, nên hook đúng mà không ai dừng. Muốn hình thức khác thì phải biết thị trường đang đặt tiêu đề kiểu gì rồi cố tình làm khác.\n\n3. NGUYÊN LÝ MỚI LẠ. Não bỏ qua thứ quen, dừng lại trước thứ lạ. Hai cách tạo lạ: biến bình thường thành bất thường (đổi góc nhìn, đổi ngữ điệu, text ngược mặt bằng chung) hoặc làm cái chưa ai làm. Cảnh báo: hook nào đang bị cả triệu kênh dùng thì hết tác dụng, không có công thức xài cả đời.\n\n4. BỐN CÁCH LÀM \"DỊ\" PHẦN HÌNH THỨC: đổi ngữ điệu (thị trường giảng dạy thì mình cợt nhả, nũng nịu, gắt); cố ý sai chính tả có kiểm soát; đổi xưng hô lạ (dì-bé, thần thiếp-bệ hạ, tao-mày với giới trẻ); thêm tính cá nhân, viết đúng kiểu mình nói với bạn thân rồi chuyển thành chữ. Cách 4 là cách bền nhất.\n\n5. ĐỔI GÓC TIẾP CẬN PHẦN NỘI DUNG: thị trường vỗ về thì mình nói mạnh; thị trường doạ dẫm thì mình đồng hành (\"hồi đó tui mà bỏ được 5 thói quen này thì giờ đã không...\"); thị trường kể thì mình hỏi.\n\n6. CÔNG THỨC TIÊU ĐỀ T = I + D + C + K: Insight (nỗi đau, mong muốn, sân si thật của tệp) + Đối tượng (nói rõ cho ai) + Concept truyền thông (chọn 1 đến 3 trong bộ concept bên dưới) + yếu tố khác (ngành, tình huống). Một tiêu đề tốt thường chồng 2-3 concept. Ví dụ cấu trúc: \"Bật mí 5 việc làm thêm giúp sinh viên năm nhất kiếm 10 triệu/tháng\" = bật mí + con số lớn + hữu ích thông dụng + đối tượng sinh viên năm nhất.\n\n7. CÁC CONCEPT HAY DÙNG NHẤT CHO HOOK TEXT: con số cụ thể; hữu ích thông dụng và \"lợi ích phút chót\" (nói ngay người xem được gì); bật mí bí mật, lén lút; cảnh báo; ngược đời nghịch lý; so sánh; tài sản lớn, con số to; hành trình (\"cùng tớ\", \"tớ sẽ tốt hơn\"); tốt đẹp bất ngờ (HỜI); phóng đại; game hoá, thử thách; gây tranh cãi có kiểm soát; chủ đề hot, realtime; đồng cảm với số đông; hài hước.\n\n8. NĂM CÁCH MỞ ĐẦU GIỮ NGƯỜI XEM: tạo đồng cảm; tạo mâu thuẫn; tạo bất ngờ; tạo khoảng trống thông tin (nói kết quả, giấu cách làm); gợi lại một niềm tin quen rồi lật nó.\n\n9. CÔNG THỨC HỜI (concept tốt đẹp bất ngờ): [GIÁ] cho [SỐ NGƯỜI hoặc SỐ LẦN] trong [SỐ NGÀY]. Tuyệt đối không viết chữ \"rẻ\", \"hời\", chỉ ném ra con số để người xem tự chia và tự tin gấp 10 lần lời người bán. Chuyển ngành bằng cách tìm 2 đơn vị để chia ra một số nhỏ hơn ly trà sữa.\n\n10. CÔNG THỨC PHÓNG ĐẠI CHỮ NHƯNG: [việc rất bình thường] + NHƯNG + [cách làm quá lố, trang trọng, sai ngữ cảnh]. Ví dụ cấu trúc: bán tạp hoá NHƯNG mặc vest; uống nước lọc NHƯNG phải có topping.\n\n11. HOOK \"XANH CHÍN\": câu khẳng định chắc nịch mang dáng chân lý phổ quát (\"có 3 nguyên lý bất di bất dịch... dù bạn ở level nào\"), mạnh hơn hẳn kiểu \"mình có vài tips muốn chia sẻ\".\n\n12. CÔNG THỨC CHỮA LÀNH: xưng hô như người thân + kiến thức đúng VÙNG VÀNG (tưởng ai cũng biết mà 4-7 trên 10 người không biết, đủ đơn giản để làm theo) + khen vô điều kiện ở cuối.\n\n13. TẢ THAY VÌ KỂ: \"áo này xịn lắm\" là kể, không ai hình dung; \"cotton mát, đen chống nắng, giặt máy cả tháng chưa bong\" là tả. Trong hook, một chi tiết cụ thể thắng một tính từ chung.\n\n14. LOẠI BỎ VÀ ĐƠN GIẢN HOÁ: bỏ từ trùng nghĩa (\"thực đơn\" và \"các món ăn\"), bỏ chi tiết chung chung không tạo uy tín (\"một cô gái miền Tây\"), tránh từ chuyên ngành, tiếng Anh, tiếng lóng nếu tệp không dùng; nói thẳng thay vì ẩn ý; viết như giải thích cho đứa trẻ 5 tuổi hiểu. Hook trên màn hình điện thoại lý tưởng dưới 12 từ, tối đa 2 dòng.\n\n15. LÀM CONTENT CHO NGƯỜI XEM, KHÔNG CHO MÌNH: câu hỏi đúng là \"người xem đang gặp vấn đề gì, tò mò gì, bức xúc gì\", không phải \"mình muốn nói gì\". Kiểm tra 30 giây trước khi đăng: nếu mình là người xem, mình có dừng lại không, nó giải quyết vấn đề gì của mình.\n\n16. MƯỢN KHUNG TIÊU ĐỀ, ĐỔI RUỘT: \"12 cách ngủ ngon | dành cho người khó ngủ\" thành \"12 cách làm content | dành cho người đang flop\". Khung đã được chứng minh ở ngành khác thì chuyển ngành vẫn chạy.\n\n17. CHUẨN 1 GIÂY CHO HOOK TEXT: 1 ý duy nhất; con số hoặc từ mạnh nằm ở đầu hoặc được nhấn màu; nói rõ hoặc ngầm rõ đối tượng; có một trong năm cách mở đầu ở mục 8; không dùng câu chào, không dùng \"hôm nay mình sẽ chia sẻ\".";

var HOOK_SHEET     = 'HookAI';
var HOOK_HEADERS   = ['thoi_gian','ma','ten','vaitro','hook','ok','loi','input_tokens','output_tokens','model'];
var HOOK_TEMPLATES = ['highlight','editorial','glass','sticker','bubbles','timeline','chips',
                      'titlecard','list','knockout','lowerthird','quote','pov','outline'];

function hookAi(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});

  var provider = (cfgProp('HOOK_AI_PROVIDER') || 'gemini').toLowerCase();
  var key = provider === 'claude' ? cfgProp('ANTHROPIC_API_KEY') : cfgProp('GEMINI_API_KEY');
  if (!key) return jsonOut({ok:false, error:'chua_cai_key'});

  var text = String(b.text || '').slice(0, 1500).trim();
  if (!text) return jsonOut({ok:false, error:'thieu_text'});
  var img = String(b.image || '');
  if (img.length > 1500000) return jsonOut({ok:false, error:'anh_qua_lon'});

  // ── lượt trong ngày ──
  var han = parseInt(cfgProp('HOOK_AI_DAILY') || '20', 10) || 20;
  var khongGioiHan = me.vaitro === 'mentor';
  var con = hookTruLuot(me.ma, han, khongGioiHan);
  if (con < 0) return jsonOut({ok:false, error:'het_luot', han:han});

  // ── gọi AI ──
  var prompt = hookPrompt(text, b, !!img);
  var kq = provider === 'claude' ? goiClaude(key, img, prompt) : goiGemini(key, img, prompt);
  if (!kq.ok){
    hookHoanLuot(me.ma, khongGioiHan);
    hookLog(me, text, false, kq.loi, kq.vin || 0, kq.vout || 0, kq.model);
    return jsonOut({ok:false, error: kq.error, chi_tiet: me.vaitro === 'mentor' ? String(kq.loi || '').slice(0, 400) : undefined});
  }
  var data = kq.data;

  hookLog(me, text, true, '', kq.vin || 0, kq.vout || 0, kq.model);
  return jsonOut({ok:true, data:data, con: khongGioiHan ? null : con, han:han, ten: me.ten_goi || me.ten});
}

/* ── Gemini: bậc miễn phí, dữ liệu có thể được Google dùng để cải thiện sản phẩm ──
   Tự thử lần lượt: schema JSON đầy đủ → schema rút gọn (responseSchema) → không schema.
   Model không có thì thử model kế tiếp. Lỗi cuối cùng được trả về nguyên văn để soi. */
var GEMINI_MODELS_DU_PHONG = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

function schemaRutGon(sc){
  // responseSchema của Gemini là tập con OpenAPI: bỏ additionalProperties, giữ type/properties/required/items/enum
  if (Array.isArray(sc)) return sc.map(schemaRutGon);
  if (!sc || typeof sc !== 'object') return sc;
  var o = {};
  Object.keys(sc).forEach(function(k){
    if (k === 'additionalProperties') return;
    o[k] = (k === 'properties') ? (function(p){ var q = {}; Object.keys(p).forEach(function(n){ q[n] = schemaRutGon(p[n]) }); return q; })(sc[k]) : schemaRutGon(sc[k]);
  });
  return o;
}

function goiGemini(key, img, prompt){
  var cauHinh = cfgProp('HOOK_AI_MODEL');
  var models = cauHinh ? [cauHinh].concat(GEMINI_MODELS_DU_PHONG.filter(function(m){ return m !== cauHinh })) : GEMINI_MODELS_DU_PHONG;
  var parts = [];
  if (img) parts.push({inline_data:{mime_type:'image/jpeg', data:img}});
  parts.push({text: prompt});
  var kieu = [
    {ten:'jsonschema', gc:{responseMimeType:'application/json', responseJsonSchema: HOOK_SCHEMA, maxOutputTokens: 6000, temperature: 0.7}},
    {ten:'schema',     gc:{responseMimeType:'application/json', responseSchema: schemaRutGon(HOOK_SCHEMA), maxOutputTokens: 6000, temperature: 0.7}},
    {ten:'tudo',       gc:{responseMimeType:'application/json', maxOutputTokens: 6000, temperature: 0.7}}
  ];
  var loiCuoi = '', modelCuoi = models[0];
  for (var mi = 0; mi < models.length; mi++){
    var model = models[mi]; modelCuoi = model;
    for (var ki = 0; ki < kieu.length; ki++){
      var req = { contents:[{role:'user', parts:parts}], generationConfig: kieu[ki].gc };
      var res, ma, raw;
      try{
        res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
          method:'post', contentType:'application/json', muteHttpExceptions:true,
          headers:{ 'x-goog-api-key': key }, payload: JSON.stringify(req)
        });
        ma = res.getResponseCode(); raw = res.getContentText();
      }catch(err){ return {ok:false, error:'loi_mang', loi:'mang: '+err, model:model}; }

      if (ma === 200){
        var j; try{ j = JSON.parse(raw); }catch(err){ loiCuoi = model+'/'+kieu[ki].ten+' json ngoai: '+String(raw).slice(0,200); continue; }
        var u = j.usageMetadata || {}; var vin = u.promptTokenCount || 0, vout = u.candidatesTokenCount || 0;
        var cand = (j.candidates || [])[0];
        if (!cand) return {ok:false, error:'tu_choi', loi:model+' khong co candidate: '+JSON.stringify(j.promptFeedback||{}).slice(0,200), vin:vin, vout:vout, model:model};
        if (cand.finishReason && cand.finishReason !== 'STOP' && cand.finishReason !== 'MAX_TOKENS')
          return {ok:false, error:'tu_choi', loi:model+' finish '+cand.finishReason, vin:vin, vout:vout, model:model};
        var chu = ((cand.content || {}).parts || []).map(function(p){ return p.text || '' }).join('');
        var data; try{ data = JSON.parse(chu.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')); }
        catch(err){ loiCuoi = model+'/'+kieu[ki].ten+' json: '+chu.slice(0,200); continue; }
        return {ok:true, data:data, vin:vin, vout:vout, model:model+'/'+kieu[ki].ten};
      }
      loiCuoi = model+'/'+kieu[ki].ten+' http '+ma+': '+String(raw).slice(0,400);
      if (ma === 429 || ma === 503) return {ok:false, error:'ban_qua', loi:loiCuoi, model:model};
      if (ma === 401 || ma === 403) return {ok:false, error:'loi_ai', loi:loiCuoi, model:model};   // key sai: thử tiếp vô ích
      if (ma === 404) break;                                                                       // model không có: sang model khác
      // 400: định dạng không hợp → thử kiểu kế tiếp
    }
  }
  return {ok:false, error:'loi_ai', loi:loiCuoi, model:modelCuoi};
}

/* ── Claude: trả tiền theo lượt, chất lượng tiếng Việt tốt hơn ── */
function goiClaude(key, img, prompt){
  var model = cfgProp('HOOK_AI_MODEL') || 'claude-opus-5';
  var noiDung = [];
  if (img) noiDung.push({type:'image', source:{type:'base64', media_type:'image/jpeg', data:img}});
  noiDung.push({type:'text', text: prompt});
  var req = {
    model: model, max_tokens: 6000, fallbacks: 'default',
    output_config: { effort: 'low', format: { type:'json_schema', schema: HOOK_SCHEMA } },
    messages: [{ role:'user', content: noiDung }]
  };
  var res, ma, raw;
  try{
    res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method:'post', contentType:'application/json', muteHttpExceptions:true,
      headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-beta':'server-side-fallback-2026-07-01' },
      payload: JSON.stringify(req)
    });
    ma = res.getResponseCode(); raw = res.getContentText();
  }catch(err){ return {ok:false, error:'loi_mang', loi:'mang: '+err, model:model}; }
  if (ma !== 200) return {ok:false, error: (ma === 429 || ma === 529) ? 'ban_qua' : 'loi_ai', loi:'http '+ma+': '+String(raw).slice(0,300), model:model};
  var j = JSON.parse(raw); var u = j.usage || {};
  if (j.stop_reason === 'refusal') return {ok:false, error:'tu_choi', loi:'refusal', vin:u.input_tokens||0, vout:u.output_tokens||0, model:model};
  var chu = (j.content || []).filter(function(c){ return c.type === 'text' }).map(function(c){ return c.text }).join('');
  var data; try{ data = JSON.parse(chu); }catch(err){ return {ok:false, error:'loi_ai', loi:'json: '+chu.slice(0,200), vin:u.input_tokens||0, vout:u.output_tokens||0, model:model}; }
  return {ok:true, data:data, vin:u.input_tokens||0, vout:u.output_tokens||0, model:model};
}

/* Xem còn bao nhiêu lượt mà không trừ — trang tool gọi lúc mở để hiện "còn N lượt" */
function hookTrangThai(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});
  var han = parseInt(cfgProp('HOOK_AI_DAILY') || '20', 10) || 20;
  if (me.vaitro === 'mentor') return jsonOut({ok:true, ten: me.ten_goi || me.ten, con:null, han:han});
  var dem = hookDemHomNay()[me.ma] || 0;
  return jsonOut({ok:true, ten: me.ten_goi || me.ten, con: Math.max(0, han - dem), han:han});
}

/* ── lượt: một thuộc tính mỗi ngày {ma: số lượt}, ngày cũ tự xoá ── */
function hookNgay(){ return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd'); }
function hookDemHomNay(){
  try{ return JSON.parse(props().getProperty('hq:' + hookNgay()) || '{}'); }catch(e){ return {}; }
}
function hookTruLuot(ma, han, khongGioiHan){
  if (khongGioiHan) return 9999;
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var k = 'hq:' + hookNgay(), p = props(), dem = hookDemHomNay();
    if ((dem[ma] || 0) >= han) return -1;
    dem[ma] = (dem[ma] || 0) + 1;
    p.setProperty(k, JSON.stringify(dem));
    p.getKeys().forEach(function(x){ if (x.indexOf('hq:') === 0 && x !== k) p.deleteProperty(x) });
    return han - dem[ma];
  } finally { lock.releaseLock(); }
}
function hookHoanLuot(ma, khongGioiHan){
  if (khongGioiHan) return;
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var k = 'hq:' + hookNgay(), dem = hookDemHomNay();
    if (dem[ma]) { dem[ma]--; props().setProperty(k, JSON.stringify(dem)); }
  } finally { lock.releaseLock(); }
}
function hookLog(me, text, ok, loi, vin, vout, model){
  try{
    var sh = ss().getSheetByName(HOOK_SHEET);
    if (!sh){ sh = ss().insertSheet(HOOK_SHEET); sh.appendRow(HOOK_HEADERS); sh.setFrozenRows(1); }
    sh.appendRow([nowVN(), me.ma, me.ten_goi || me.ten, me.vaitro, String(text).slice(0,120), ok ? 'ok' : 'loi', loi, vin, vout, model]);
  }catch(e){ ghiLoi('hookLog', e); }
}

/* ── lời nhắn cho Claude ── */
function hookPrompt(text, b, coAnh){
  var nen = {tiktok:'TikTok', meta:'Instagram/Facebook Reels', metaads:'quảng cáo Meta', shorts:'YouTube Shorts', all:'TikTok, Reels và Shorts cùng lúc'}[b.platform] || 'TikTok, Reels và Shorts cùng lúc';
  var mat = {top:'phần trên khung', mid:'giữa khung', low:'phần dưới khung'}[b.facePos] || 'giữa khung';
  return [
    'Bạn là mentor hook cho học viên khóa "Tự Mình Xây Kênh", làm video dọc 9:16. Bạn tư vấn theo đúng hệ kiến thức dưới đây, nói thẳng như mentor nói với học viên, không khen xã giao, không dùng giọng văn AI.',
    '',
    HOOK_KIEN_THUC,
    '',
    coAnh ? 'ẢNH KÈM THEO là frame đầu video. Đọc kỹ: mặt người ở đâu, nền sáng hay tối, rối hay đơn giản, nhân vật trông thế nào (điều này cũng là "hình thức" trong luật 1 giây).' : 'Không có ảnh. Người dùng báo mặt người ở ' + mat + '.',
    'Video sẽ đăng lên ' + nen + '. Vùng UI phải né trên khung 1080x1920: thanh trên 0-12%, caption và nút từ 75% trở xuống, cột icon bên phải rộng 13% trong dải 51-90%.',
    '',
    'HOOK HỌC VIÊN VIẾT (nằm giữa <<< và >>>):',
    '<<<' + text + '>>>',
    '',
    'Trả về JSON đúng schema, tiếng Việt, giữ giọng và xưng hô của tác giả, không bịa số liệu mới. Yêu cầu từng phần:',
    '1. face: top_pct, bottom_pct là vị trí mặt theo % chiều cao (0-100); background: vài chữ về vùng trống.',
    '2. score: chấm hook gốc theo luật 1 giây, 4 tiêu chí mỗi tiêu chí 0-25. hook = độ MỚI LẠ và lực dừng tay (có dùng một trong 5 cách mở đầu không, có dị về hình thức không, hay đang giống cả triệu kênh). clarity = đọc một lần là hiểu, có từ thừa, từ trùng nghĩa, từ chuyên ngành không. length = dưới 12 từ và tối đa 2 dòng thì điểm cao. keyword = có con số, từ mạnh hoặc insight cụ thể để nhấn màu không. total là tổng. verdict: 1 câu nhận xét thẳng, chỉ ra đúng chỗ yếu nhất.',
    '3. fixes: 2-4 việc cụ thể để hook gốc mạnh hơn, mỗi việc 1 câu, nêu rõ dùng nguyên tắc nào (ví dụ "tả thay vì kể", "bỏ từ trùng nghĩa", "đổi góc từ doạ sang đồng hành", "thêm con số theo T=I+D+C+K").',
    '4. hooks: đúng 5 phiên bản viết lại, MỖI BẢN một công thức khác nhau, chọn trong: "Con số cụ thể" (concept số + hữu ích thông dụng), "Nỗi đau / đồng cảm" (insight thật của tệp), "Ngược đời / lật niềm tin quen", "Khoảng trống thông tin" (nói kết quả, giấu cách làm), "Xanh chín" (khẳng định chắc nịch), "HỜI 3 con số" (chỉ khi có giá hoặc số lượng), "Phóng đại chữ NHƯNG", "Đổi góc đồng hành", "POV / mượn khung". Ghi formula là tên công thức đó, concept là 1-3 concept truyền thông đã dùng. text tối đa 2 dòng ngăn bằng \n, dưới 12 từ, đánh dấu 1-2 từ khóa bằng **...**. Viết như đang nói với bạn thân, không sáo rỗng.',
    '5. layouts: đúng 3 bố cục khác tinh thần nhau, chọn template trong: ' + HOOK_TEMPLATES.join(', ') + '. Ý nghĩa: highlight (vệt bút dạ, hook ngắn), editorial (cụm _..._ serif nghiêng to, kể chuyện), glass (thẻ kính mờ + kicker, nền rối), sticker (thẻ đen nghiêng, hài, cợt nhả), bubbles (hộp chữ từng dòng, text dài), timeline (rows = [[mốc, nội dung]] 3 hàng), chips (chips = [A, B] + lead, nội dung từ A sang B), titlecard (phủ tối toàn khung, câu 5-8 từ, y_pct là tâm khối chữ, thường 40), list (dòng đầu kết thúc bằng dấu hai chấm, các dòng sau là ý), knockout (chữ khoét trên dải tối, 1-3 từ), lowerthird (thanh góc dưới trái + kicker), quote (trích dẫn, dòng cuối bắt đầu "- " là ký tên), pov (kicker là nhãn chip, khối 1 câu chính, khối 2 sau một dòng trống là dòng phụ), outline (chữ viền rỗng, từ khóa tô đặc). Chọn hình thức theo luật 1 giây: nền rối thì cần nền chữ, hook cợt nhả thì sticker, hook xanh chín thì titlecard hoặc outline. Dùng hook đã viết lại tốt nhất làm text cho bố cục, không dùng lại nguyên văn hook gốc nếu nó yếu. y_pct là mép trên khối chữ, phải né mặt và né vùng UI; size là px trên khung rộng 1080 (hook ngắn 60-84, text dài 40-48). text dùng \n để xuống dòng, dòng trống để tách khối, **từ khóa**, _cụm chốt_. why 1 câu nêu rõ vì sao hợp frame này và tệp này.',
    '6. caption: caption đăng kèm, 1-2 câu, có câu hỏi hoặc lời kêu gọi comment cụ thể (kiểu "comment X để nhận Y"), không lặp lại hook. hashtags: 5 hashtag tiếng Việt không dấu, có #tuminhxaykenh.'
  ].join('\n');
}

var HOOK_SCHEMA = {
  type:'object', additionalProperties:false,
  required:['face','score','fixes','hooks','layouts','caption','hashtags'],
  properties:{
    face:{ type:'object', additionalProperties:false, required:['top_pct','bottom_pct','background'],
      properties:{ top_pct:{type:'number'}, bottom_pct:{type:'number'}, background:{type:'string'} } },
    score:{ type:'object', additionalProperties:false, required:['total','hook','clarity','length','keyword','verdict'],
      properties:{ total:{type:'number'}, hook:{type:'number'}, clarity:{type:'number'}, length:{type:'number'}, keyword:{type:'number'}, verdict:{type:'string'} } },
    fixes:{ type:'array', items:{type:'string'} },
    hooks:{ type:'array', items:{ type:'object', additionalProperties:false, required:['formula','text'],
      properties:{ formula:{type:'string'}, text:{type:'string'}, concept:{type:'string'} } } },
    layouts:{ type:'array', items:{ type:'object', additionalProperties:false, required:['template','y_pct','size','text','why'],
      properties:{ template:{type:'string', enum:HOOK_TEMPLATES}, y_pct:{type:'number'}, size:{type:'number'}, text:{type:'string'}, why:{type:'string'},
        kicker:{type:'string'}, lead:{type:'string'}, chips:{type:'array', items:{type:'string'}},
        rows:{type:'array', items:{type:'array', items:{type:'string'}}} } } },
    caption:{type:'string'},
    hashtags:{ type:'array', items:{type:'string'} }
  }
};
