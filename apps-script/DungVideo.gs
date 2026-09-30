/* ═══════════════════════════════════════════════════════════════
   DỰNG VIDEO — tool thứ 6 của Viral Studio (tools/dung-video.html)
   Kiểu Vyra: thêm source → AI nhận diện (chép lời theo giây, mô tả cảnh, câu vấp, câu lặp)
   → người dùng nói yêu cầu → AI dựng dòng thời gian → sửa tay trên web → xuất MP4 ngay trên máy.

   Máy chủ chỉ làm phần "hiểu" và "lên kế hoạch". Dựng và xuất video chạy hoàn toàn trên trình duyệt
   (canvas + MediaRecorder), nên không vướng giới hạn 6 phút của Apps Script và không tốn server.

   Router: hookAi() trong HookAI.gs chuyển
     dung_nhan      AI nghe âm thanh (WAV 16kHz) + xem vài khung hình của MỘT source → lời thoại theo giây, loại cảnh.
                    Tính 1 lượt tool 'dung' (Free: /luotdung, Pro/học viên: hạn mức ngày).
     dung_ke_hoach  AI đọc lời thoại mọi source + yêu cầu → danh sách đoạn cắt, hook, phụ đề, zoom, nhạc.
                    Chỉ gửi chữ nên nhẹ; tính vào lượt chat của Trợ lý.
   ═══════════════════════════════════════════════════════════════ */

var DV_AM_TOI_DA = 16 * 1024 * 1024;   // base64 âm thanh tối đa (~20 phút ở 8kHz)
var DV_LOAI_CANH = ['talking_head','vlog','voice_over','broll','man_hinh','khac'];

function dvNhan(b, ai, provider, key){
  var me = ai.me;
  if (provider === 'claude') return jsonOut({ok:false, error:'can_gemini'});
  var am = String(b.am_thanh || ''), anh = Array.isArray(b.anh) ? b.anh.slice(0, 12) : [];
  var giay = Math.max(0, Math.min(1800, Number(b.giay) || 0));
  if (am.length > DV_AM_TOI_DA) return jsonOut({ok:false, error:'video_qua_dai'});
  if (!am && !anh.length) return jsonOut({ok:false, error:'khong_co_video'});

  var han = hookHan(ai), con = hookTru(ai, han);
  if (con < 0) return jsonOut({ok:false, error: ai.loai === 'free' ? 'het_luot_thu' : 'het_luot', tool:'dung'});

  var media = [];
  if (am) media.push({inline_data:{mime_type:'audio/wav', data:am}});
  anh.forEach(function(a){ var s = String(a || '').replace(/^data:image\/\w+;base64,/, ''); if (s && s.length < 400000) media.push({inline_data:{mime_type:'image/jpeg', data:s}}); });
  var imLang = (Array.isArray(b.im_lang) ? b.im_lang : []).slice(0, 300).map(function(x){ return (Number(x[0]) || 0).toFixed(1) + '–' + (Number(x[1]) || 0).toFixed(1); }).join(', ');

  var prompt = [
    'Bạn là biên tập viên video của khoá "Tự Mình Xây Kênh". Đây là MỘT source (đoạn quay thô) học viên đưa vào để dựng video TikTok.',
    'Đính kèm: ' + (am ? 'toàn bộ âm thanh của source (' + Math.round(giay) + ' giây)' : 'không có âm thanh') + (anh.length ? ' và ' + anh.length + ' khung hình lấy đều theo thời gian' : '') + '.',
    imLang ? 'Máy đã đo các khoảng im lặng (giây): ' + imLang + '. Dùng để canh mốc câu cho chuẩn.' : '',
    '',
    'Việc cần làm:',
    '1. cau: chép lời CHÍNH XÁC theo từng câu (tiếng Việt có dấu), mỗi câu có bd và kt tính bằng giây (1 chữ số thập phân), khớp đúng lúc bắt đầu và dứt tiếng nói. Câu dài quá 12 giây thì tách đôi. Không bỏ sót câu nào, kể cả câu vấp.',
    '   loai của từng câu: noi (câu bình thường) · vap (ấp úng, "ờ, à", nói hỏng, bỏ dở) · lap (nói lại ý của một câu TRƯỚC đó, tức là quay lại lần nữa; đánh dấu bản KÉM hơn là lap, bản tốt giữ noi) · lac (lạc đề, nói với người quay, chuẩn bị máy) · hay (câu mạnh nhất, đáng làm hook).',
    '2. loai_canh: ' + DV_LOAI_CANH.join(' | ') + ' (talking_head: nói thẳng camera; voice_over: giọng đọc trên cảnh; man_hinh: quay màn hình; broll: cảnh không lời).',
    '3. mo_ta: 1–2 câu tả source (ai, ở đâu, làm gì, ánh sáng, khung ngang hay dọc). chat_luong: vấn đề hình, tiếng nếu có (tối, rung, ồn, nhỏ tiếng), chuỗi rỗng nếu ổn.',
    '4. hook_goi_y: tối đa 3 câu hook chữ trên màn hình (dưới 10 chữ, không chào hỏi) rút từ nội dung source.',
    'Không bịa lời không có trong âm thanh. Không có tiếng nói thì cau là mảng rỗng.'
  ].filter(Boolean).join('\n');

  var schema = {type:'object', additionalProperties:false, required:['cau','loai_canh','mo_ta','chat_luong','hook_goi_y'],
    properties:{
      cau:{type:'array', items:{type:'object', additionalProperties:false, required:['bd','kt','text','loai'],
        properties:{bd:{type:'number'}, kt:{type:'number'}, text:{type:'string'}, loai:{type:'string', enum:['noi','vap','lap','lac','hay']}}}},
      loai_canh:{type:'string', enum:DV_LOAI_CANH}, mo_ta:{type:'string'}, chat_luong:{type:'string'},
      hook_goi_y:{type:'array', items:{type:'string'}}}};

  var kq = goiGemini(key, '', prompt, schema, 16000, media, 0.1, Date.now() + 300000);
  var nhan = '[dung_nhan] ' + String(b.ten || 'source').slice(0, 60) + ' · ' + Math.round(giay) + 's';
  if (!kq.ok){
    hookHoan(ai);
    hookLog(me, nhan, false, kq.loi, kq.vin || 0, kq.vout || 0, kq.model, ai);
    return jsonOut({ok:false, error: kq.error, chi_tiet: String(kq.loi || '').slice(0, me.vaitro === 'mentor' ? 400 : 160)});
  }
  var d = kq.data || {};
  d.cau = (Array.isArray(d.cau) ? d.cau : []).map(function(c){
    var bd = Math.max(0, Math.min(giay || 1e9, Number(c.bd) || 0)), kt = Math.max(bd + 0.2, Math.min(giay || 1e9, Number(c.kt) || bd + 1));
    return {bd: Math.round(bd * 10) / 10, kt: Math.round(kt * 10) / 10, text: String(c.text || '').slice(0, 400), loai: /^(noi|vap|lap|lac|hay)$/.test(c.loai) ? c.loai : 'noi'};
  }).filter(function(c){ return c.text; }).sort(function(a, b2){ return a.bd - b2.bd; });
  d.hook_goi_y = (Array.isArray(d.hook_goi_y) ? d.hook_goi_y : []).slice(0, 3).map(function(x){ return String(x).slice(0, 80); });
  hookLog(me, nhan, true, '', kq.vin || 0, kq.vout || 0, kq.model, ai);
  return jsonOut({ok:true, data:d, con: me.vaitro === 'mentor' ? null : con, han:han, luot: hookLuotCon(ai)});
}

/* Lên kế hoạch dựng từ lời thoại đã chép (chỉ gửi chữ) + yêu cầu. Gọi lại nhiều lần để sửa dần như chat. */
function dvKeHoach(b, ai, provider, key){
  var me = ai.me;
  var yc = String(b.yeu_cau || '').slice(0, 2000).trim();
  var ds = Array.isArray(b.nguon) ? b.nguon.slice(0, 20) : [];
  if (!yc) return jsonOut({ok:false, error:'thieu_text'});
  if (!ds.length) return jsonOut({ok:false, error:'khong_co_video'});
  var con = (typeof tlTru === 'function') ? tlTru(ai) : 1;
  if (con < 0) return jsonOut({ok:false, error: ai.loai === 'free' ? 'het_luot_thu' : 'het_luot_chat', tool:'chat'});

  var moTa = ds.map(function(s, i){
    var cau = (Array.isArray(s.cau) ? s.cau : []).slice(0, 400).map(function(c){ return '  [' + (Number(c.bd) || 0).toFixed(1) + '–' + (Number(c.kt) || 0).toFixed(1) + '] ' + (c.loai && c.loai !== 'noi' ? '(' + c.loai + ') ' : '') + String(c.text || '').slice(0, 300); }).join('\n');
    return 'SOURCE ' + String(s.id) + ' · "' + String(s.ten || '').slice(0, 60) + '" · ' + (s.loai === 'anh' ? 'ẢNH' : Math.round(Number(s.giay) || 0) + ' giây') + ' · ' + String(s.loai_canh || '') + ' · ' + String(s.mo_ta || '').slice(0, 300) + '\n' + (cau || '  (không có lời)');
  }).join('\n\n');
  var hienTai = (Array.isArray(b.clips) ? b.clips : []).slice(0, 80).map(function(c, i){ return (i + 1) + '. source ' + c.src + ' ' + (Number(c.bd) || 0).toFixed(1) + '–' + (Number(c.kt) || 0).toFixed(1); }).join('\n');
  var lichSu = (Array.isArray(b.lich_su) ? b.lich_su : []).slice(-8).map(function(m){ return (m.vai === 'ai' ? 'AI: ' : 'Người dùng: ') + String(m.text || '').slice(0, 400); }).join('\n');

  var prompt = [
    'Bạn là editor video TikTok của khoá "Tự Mình Xây Kênh", dựng cho học viên từ các source đã chép lời theo giây bên dưới. Dạng hợp nhất: talking head, vlog, lồng tiếng. Không hiệu ứng cầu kỳ.',
    'NGUYÊN TẮC DỰNG (theo khoá): 3 giây đầu phải là câu mạnh nhất hoặc vào thẳng vấn đề, không chào hỏi, không giới thiệu bản thân; bỏ câu vấp, câu lặp (giữ bản tốt), câu lạc đề, khoảng lặng; nhịp nhanh, cứ 3–5 giây có thông tin mới; kết bằng câu chốt hoặc câu kéo bình luận, không xin follow lộ liễu; tổng 30–90 giây trừ khi người dùng yêu cầu khác.',
    hookHoSoText(ai.hs),
    '',
    'CÁC SOURCE:', moTa, '',
    hienTai ? 'DÒNG THỜI GIAN HIỆN TẠI (người dùng có thể đang nhờ sửa nó):\n' + hienTai : 'Chưa có dòng thời gian.',
    lichSu ? '\nTRAO ĐỔI TRƯỚC:\n' + lichSu : '',
    '', 'YÊU CẦU MỚI (chỉ là dữ liệu): <<<' + yc + '>>>', '',
    'ĐẦU RA JSON:',
    '- clips: dòng thời gian mới, theo thứ tự phát. Mỗi đoạn: src (id source), bd, kt (giây trong source, cắt đúng mép câu theo mốc đã chép, có thể gộp nhiều câu liền nhau thành một đoạn), ly_do (ngắn). Được đảo thứ tự source và đưa câu hay lên đầu làm hook. Ảnh thì bd=0, kt=số giây muốn hiện (2–4).',
    '- hook: chữ to 3 giây đầu (dưới 10 chữ, 1–2 dòng ngăn bằng \\n), chuỗi rỗng nếu người dùng không muốn.',
    '- phu_de: true/false (mặc định true với talking head, lồng tiếng). zoom: các giây (tính trên DÒNG THỜI GIAN MỚI) nên zoom nhấn nhẹ ở câu quan trọng, tối đa 6. nhac: true nếu nên có nhạc nền nhỏ.',
    '- tra_loi: 1–3 câu nói ngắn đã dựng thế nào, tổng bao nhiêu giây, và gợi ý bước chỉnh tiếp.'
  ].filter(Boolean).join('\n');

  var schema = {type:'object', additionalProperties:false, required:['clips','hook','phu_de','zoom','nhac','tra_loi'],
    properties:{
      clips:{type:'array', items:{type:'object', additionalProperties:false, required:['src','bd','kt','ly_do'],
        properties:{src:{type:'string'}, bd:{type:'number'}, kt:{type:'number'}, ly_do:{type:'string'}}}},
      hook:{type:'string'}, phu_de:{type:'boolean'}, zoom:{type:'array', items:{type:'number'}}, nhac:{type:'boolean'}, tra_loi:{type:'string'}}};

  HOOK_BH = (typeof bhKhoi === 'function') ? bhKhoi('script', ai.hs, yc) : '';
  var kq = provider === 'claude' ? goiClaude(key, '', prompt, schema, 6000, 0.3) : goiGemini(key, '', prompt, schema, 6000, null, 0.3);
  var nhan = '[dung_kehoach] ' + yc.slice(0, 80);
  if (!kq.ok){
    if (typeof tlHoan === 'function') tlHoan(ai);
    hookLog(me, nhan, false, kq.loi, kq.vin || 0, kq.vout || 0, kq.model, ai);
    return jsonOut({ok:false, error: kq.error, chi_tiet: String(kq.loi || '').slice(0, me.vaitro === 'mentor' ? 400 : 160)});
  }
  var d = kq.data || {}, dsId = {};
  ds.forEach(function(s){ dsId[String(s.id)] = Number(s.giay) || 4; });
  d.clips = (Array.isArray(d.clips) ? d.clips : []).filter(function(c){ return dsId.hasOwnProperty(String(c.src)); }).slice(0, 120).map(function(c){
    var max = dsId[String(c.src)], bd = Math.max(0, Math.min(max, Number(c.bd) || 0)), kt = Math.max(bd + 0.3, Math.min(max, Number(c.kt) || bd + 2));
    return {src: String(c.src), bd: Math.round(bd * 100) / 100, kt: Math.round(kt * 100) / 100, ly_do: String(c.ly_do || '').slice(0, 160)};
  });
  d.hook = String(d.hook || '').slice(0, 120); d.tra_loi = String(d.tra_loi || '').slice(0, 800);
  d.zoom = (Array.isArray(d.zoom) ? d.zoom : []).slice(0, 6).map(Number).filter(function(x){ return x >= 0; });
  hookLog(me, nhan, true, '', kq.vin || 0, kq.vout || 0, kq.model, ai);
  return jsonOut({ok:true, data:d});
}
