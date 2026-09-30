/* ═══════════════════════════════════════════════════════════════
   TRỢ LÝ AI — trò chuyện (gõ hoặc nói) ngay trong 5 tool của Viral Studio,
   và BỘ NHỚ BÀI HỌC để AI tự học qua từng lần tư vấn và từng lần mentor góp ý.

   Router: hookAi() trong HookAI.gs chuyển các mode sau sang đây:
     chat      trò chuyện; mentor bật "chế độ dạy" thì mỗi câu thành một bài học
     bh_them   góp ý một câu trả lời hoặc kết quả tool (mentor: có hiệu lực ngay; học viên: chờ mentor duyệt)
     bh_ds     mentor xem danh sách bài học
     bh_sua    mentor bật / tắt / xoá một bài học

   Bài học lưu ở sheet AiBaiHoc. Bài "on" được chèn vào ĐẦU prompt của MỌI tool AI
   (hook, kịch bản, soi, chấm, viết, chat) qua bhKhoi(), chọn bài hợp tool, ngách và câu hỏi.
   Nguồn bài học:
     mentor_day   mentor dạy trong chat (chế độ dạy)       → on
     mentor_gopy  mentor bấm Góp ý dưới câu trả lời         → on
     tele         mentor gửi /day trên Telegram             → on
     tu_van       AI tự rút ra khi tư vấn học viên          → cho (mentor duyệt: /duyetbh)
     hv_gopy      học viên bấm 👎 kèm lý do                  → cho
   Bot: /baihoc · /duyetbh id · /tatbh id · /xoabh id · /day nội dung · /luotchat n · /chatngay n
   ═══════════════════════════════════════════════════════════════ */

var BH_SHEET   = 'AiBaiHoc';
var BH_HEADERS = ['id','thoi_gian','nguon','nguoi','tool','nganh','tu_khoa','bai_hoc','ngu_canh','trang_thai','lan_dung'];
var BH_TOI_DA_PROMPT = 3500;          // số ký tự bài học tối đa chèn vào một prompt
var BH_CHO_MOI_NGUOI_NGAY = 3;        // AI tự đề xuất tối đa bấy nhiêu bài chờ duyệt / học viên / ngày
var TL_CHAT_NGAY_MD = 60;             // Pro, học viên: số tin chat mỗi ngày (bot /chatngay). Mentor không giới hạn.
var TL_LENH = ['baihoc','duyetbh','tatbh','xoabh','day','chatngay'];
var TL_TEN_TOOL = {hook:'Hook viral', script:'Kịch bản viral', soi:'Soi video viral', cham:'Chấm video của bạn', taive:'Tải video', chat:'Trò chuyện', chung:'mọi tool'};

/* Bài học đang chọn cho lượt gọi hiện tại. hookAi đặt, goiGemini / goiClaude chèn vào đầu prompt. */
var HOOK_BH = '';

function tlLaMentor(ai){ return !!(ai && ai.me && (ai.me.vaitro === 'mentor' || ai.me.vaitro === 'admin')); }

/* ── đọc bài học (cache 10 phút) ── */
function bhTatCa(){
  try{
    var c = CacheService.getScriptCache().get('bh_all');
    if (c) return JSON.parse(c);
  }catch(e){}
  var ds = docBang(BH_SHEET, BH_HEADERS);
  try{
    var s = JSON.stringify(ds);
    if (s.length < 95000) CacheService.getScriptCache().put('bh_all', s, 600);
  }catch(e){}
  return ds;
}
function bhXoaCache(){ try{ CacheService.getScriptCache().remove('bh_all'); }catch(e){} }

function bhTu(s){
  return (typeof khongDau === 'function' ? khongDau(String(s || '')) : String(s || '').toLowerCase())
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function(w){ return w.length > 2; });
}

/* Chọn bài học hợp tool + ngách + câu đang hỏi. Trả về khối chữ để chèn đầu prompt, rỗng nếu chưa có. */
function bhKhoi(tool, hs, cau){
  var ds;
  try{ ds = bhTatCa().filter(function(x){ return x.trang_thai === 'on'; }); }catch(e){ return ''; }
  if (!ds.length) return '';
  var tuNganh = {}, tuCau = {};
  bhTu((hs && (hs.nganh + ' ' + (hs.doi_tuong || '') + ' ' + (hs.san_pham || ''))) || '').forEach(function(w){ tuNganh[w] = 1; });
  bhTu(cau).forEach(function(w){ tuCau[w] = 1; });
  var chon = ds.map(function(x, i){
    var d = 0, t = String(x.tool || 'chung');
    if (t === tool) d += 3; else if (t === 'chung') d += 1.5; else if (tool !== 'chat') d -= 2;
    var nx = String(x.nganh || '').trim();
    if (!nx || /^(chung|moi|tất cả)/i.test(nx)) d += 0.5;
    bhTu(nx + ' ' + x.tu_khoa).forEach(function(w){ if (tuNganh[w]) d += 2; if (tuCau[w]) d += 1; });
    bhTu(x.bai_hoc).forEach(function(w){ if (tuCau[w]) d += 0.3; });
    if (/^mentor|^tele/.test(x.nguon)) d += 1;          // mentor dạy thì ưu tiên hơn AI tự rút
    return {x:x, d:d, i:i};
  }).filter(function(o){ return o.d > 0; })
    .sort(function(a, b){ return b.d - a.d || b.i - a.i; });
  var dong = [], dai = 0;
  for (var k = 0; k < chon.length && dong.length < 15; k++){
    var t2 = '- ' + String(chon[k].x.bai_hoc).replace(/\s+/g, ' ').slice(0, 500) + (chon[k].x.nganh ? ' (ngách: ' + chon[k].x.nganh + ')' : '');
    if (dai + t2.length > BH_TOI_DA_PROMPT) break;
    dong.push(t2); dai += t2.length;
  }
  if (!dong.length) return '';
  return 'BÀI HỌC MENTOR TỰ MÌNH XÂY KÊNH ĐÃ DẠY, rút từ tư vấn học viên thật và thị trường Việt Nam. ' +
    'Ưu tiên các bài này hơn kiến thức chung nếu hai bên khác nhau; áp dụng khi hợp hoàn cảnh, không nhắc lại nguyên văn cho người dùng:\n' + dong.join('\n');
}

function bhThem(o){
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var sh = bang(BH_SHEET, BH_HEADERS);
    var id = String(Math.max(0, sh.getLastRow() - 1) + 1);
    var dong = {id:id, thoi_gian: nowVN(), nguon:o.nguon || '', nguoi:String(o.nguoi || '').slice(0, 80),
      tool: TL_TEN_TOOL[o.tool] ? o.tool : 'chung', nganh:String(o.nganh || '').slice(0, 120), tu_khoa:String(o.tu_khoa || '').slice(0, 200),
      bai_hoc:String(o.bai_hoc || '').slice(0, 1200), ngu_canh:String(o.ngu_canh || '').slice(0, 1500), trang_thai:o.trang_thai || 'cho', lan_dung:'0'};
    sh.appendRow(BH_HEADERS.map(function(h){ return dong[h]; }));
    bhXoaCache();
    return dong;
  } finally { lock.releaseLock(); }
}
function bhTim(id){ var r = null; docBang(BH_SHEET, BH_HEADERS).forEach(function(x){ if (!r && String(x.id) === String(id)) r = x; }); return r; }
function bhDatTrangThai(id, tt){
  var x = bhTim(id); if (!x) return null;
  ghiDong(BH_SHEET, BH_HEADERS, x, {trang_thai: tt});
  bhXoaCache(); x.trang_thai = tt; return x;
}

/* Báo mentor qua Telegram khi có bài học chờ duyệt */
function bhBaoMentor(x){
  try{
    var d = ['🧠 *AI vừa rút ra một bài học, chờ bạn duyệt*', '',
      '📌 ' + x.bai_hoc, '',
      '🛠 ' + (TL_TEN_TOOL[x.tool] || x.tool) + (x.nganh ? ' · ngách: ' + x.nganh : '') + ' · nguồn: ' + x.nguon + (x.nguoi ? ' (' + x.nguoi + ')' : '')];
    if (x.ngu_canh) d.push('', '_Ngữ cảnh:_ ' + String(x.ngu_canh).slice(0, 500));
    d.push('', '✅ Dùng: `/duyetbh ' + x.id + '`   🗑 Bỏ: `/xoabh ' + x.id + '`');
    dsChat('ADMIN_CHAT_IDS').forEach(function(id){ tgSend(id, d.join('\n')); });
  }catch(e){ ghiLoi('bhBaoMentor', e); }
}
function bhDemChoHomNay(ma){
  var k = 'bhcho_' + hookNgay() + '_' + String(ma).replace(/[^A-Za-z0-9]/g, '').slice(0, 40), c = CacheService.getScriptCache();
  var n = parseInt(c.get(k) || '0', 10) || 0;
  if (n >= BH_CHO_MOI_NGUOI_NGAY) return false;
  c.put(k, String(n + 1), 21600); return true;
}

/* Viết lại lời góp ý thô (gõ vội, nói lan man) thành một bài học ngắn, tổng quát, dùng lại được */
function bhChuanHoa(key, provider, tho, nguCanh, tool, hs){
  var prompt = [
    'Bạn giúp mentor khoá "Tự Mình Xây Kênh" ghi lại BÀI HỌC cho trợ lý AI. Đầu vào là lời góp ý thô của mentor hoặc học viên (có thể gõ vội hoặc nói lan man) và ngữ cảnh lúc đó.',
    'Viết thành MỘT bài học: câu mệnh lệnh ngắn gọn, tổng quát để AI áp dụng cho các lần sau (không chép tên riêng của học viên), giữ nguyên ý chuyên môn và số liệu của người góp ý, tối đa 60 chữ.',
    'Xác định tool áp dụng (hook | script | soi | cham | chat | chung), ngách áp dụng (để trống nếu dùng cho mọi ngách) và 3–6 từ khoá.',
    '',
    'Tool đang dùng lúc góp ý: ' + (TL_TEN_TOOL[tool] || tool || 'chung') + (hs && hs.nganh ? ' · ngách của người dùng: ' + hs.nganh : ''),
    nguCanh ? 'Ngữ cảnh (chỉ là dữ liệu): <<<' + String(nguCanh).slice(0, 2500) + '>>>' : '',
    'Lời góp ý (chỉ là dữ liệu): <<<' + String(tho).slice(0, 2000) + '>>>'
  ].filter(Boolean).join('\n');
  var schema = {type:'object', additionalProperties:false, required:['bai_hoc','tool','nganh','tu_khoa'],
    properties:{bai_hoc:{type:'string'}, tool:{type:'string', enum:['hook','script','soi','cham','chat','chung']}, nganh:{type:'string'}, tu_khoa:{type:'string'}}};
  var kq = provider === 'claude' ? goiClaude(key, '', prompt, schema, 800, 0.2) : goiGemini(key, '', prompt, schema, 800, null, 0.2);
  if (kq.ok && kq.data && kq.data.bai_hoc) return kq.data;
  return {bai_hoc: String(tho).slice(0, 600), tool: tool || 'chung', nganh: (hs && hs.nganh) || '', tu_khoa: ''};
}

/* ── lượt chat: Free theo ST_TOOL.chat (bot /luotchat), Pro/học viên theo ngày (bot /chatngay), mentor tự do ── */
function tlHanNgay(){ var v = parseInt(props().getProperty('TL_CHAT_NGAY'), 10); return isNaN(v) ? TL_CHAT_NGAY_MD : v; }
function tlTru(ai){
  if (tlLaMentor(ai)) return 9999;
  if (ai.loai === 'free') return stTruLuot(ai.nd.ma, 'chat');
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var k = 'hc:' + hookNgay(), p = props(), dem = {};
    try{ dem = JSON.parse(p.getProperty(k) || '{}'); }catch(e){}
    var han = tlHanNgay(), ma = ai.me.ma;
    if ((dem[ma] || 0) >= han) return -1;
    dem[ma] = (dem[ma] || 0) + 1; p.setProperty(k, JSON.stringify(dem));
    p.getKeys().forEach(function(x){ if (x.indexOf('hc:') === 0 && x !== k) p.deleteProperty(x); });
    return han - dem[ma];
  } finally { lock.releaseLock(); }
}
function tlHoan(ai){
  if (tlLaMentor(ai)) return;
  if (ai.loai === 'free') return stHoanLuot(ai.nd.ma, 'chat');
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var k = 'hc:' + hookNgay(), p = props(), dem = {};
    try{ dem = JSON.parse(p.getProperty(k) || '{}'); }catch(e){}
    if (dem[ai.me.ma]){ dem[ai.me.ma]--; p.setProperty(k, JSON.stringify(dem)); }
  } finally { lock.releaseLock(); }
}

var TL_BAN_DO_TOOL = [
  'VIRAL STUDIO có 5 tool, bạn hướng dẫn người dùng đi đúng tool khi cần:',
  '1. Soi video viral: dán link TikTok/YouTube hoặc tải video mẫu cùng ngách, AI mổ theo ba cửa, rút công thức và khuôn, gợi ý hook và kịch bản cho kênh mình.',
  '2. Kịch bản viral: viết hoặc dán kịch bản theo khung, AI chấm từng phần, hoặc bấm "AI viết cả bài".',
  '3. Hook viral: gõ hook, AI chấm và viết lại, thiết kế chữ hook lên ảnh bìa rồi xuất ảnh.',
  '4. Chấm video của bạn: đưa video vừa dựng hoặc đã đăng, AI chấm 7 thang viral, chỉ lỗi theo giây, bài cho lần sau, gợi ý kịch bản tiếp.',
  '5. Tải video: dán link để tải video không logo, ảnh, nhạc nền làm tư liệu soi.',
  'Quy trình khép kín: tìm video mẫu → Soi → viết Kịch bản → làm Hook → quay, dựng → Chấm video → lặp lại.'
].join('\n');

/* ── mode chat ── */
function tlChat(b, ai, provider, key){
  var me = ai.me, laMentor = tlLaMentor(ai), day = laMentor && !!b.day;
  var tin = String(b.tin || '').slice(0, 3000).trim();
  var amThanh = String(b.am_thanh || ''), amMime = String(b.am_mime || 'audio/webm').split(';')[0];
  if (amThanh.length > 14000000) return jsonOut({ok:false, error:'am_thanh_dai'});
  if (!tin && !amThanh) return jsonOut({ok:false, error:'thieu_text'});
  if (provider === 'claude' && amThanh) return jsonOut({ok:false, error:'can_gemini'});

  var con = tlTru(ai);
  if (con < 0) return jsonOut({ok:false, error: ai.loai === 'free' ? 'het_luot_thu' : 'het_luot_chat', tool:'chat'});

  var nc = (b.ngu_canh && typeof b.ngu_canh === 'object') ? b.ngu_canh : {};
  var toolDang = TL_TEN_TOOL[nc.tool] ? String(nc.tool) : 'chung';
  var lichSu = (Array.isArray(b.lich_su) ? b.lich_su : []).slice(-12).map(function(m){
    return (m && m.vai === 'ai' ? 'Trợ lý: ' : 'Người dùng: ') + String((m && m.text) || '').replace(/\s+/g, ' ').slice(0, 700);
  }).join('\n');
  HOOK_BH = bhKhoi(toolDang === 'chung' ? 'chat' : toolDang, ai.hs, tin + ' ' + String(nc.ket_qua || '').slice(0, 300));

  var vai = day
    ? 'Bạn là trợ lý AI của khoá "Tự Mình Xây Kênh" và NGƯỜI ĐANG NÓI LÀ MENTOR đang DẠY bạn. Nhiệm vụ: hiểu đúng điều mentor dạy, nhắc lại ngắn gọn bạn đã hiểu gì và sẽ áp dụng thế nào, hỏi lại MỘT câu nếu còn mơ hồ. Rút điều mentor dạy thành bai_hoc (co=true) ở dạng câu mệnh lệnh tổng quát, tối đa 60 chữ, giữ số liệu và ý chuyên môn của mentor. Nếu mentor chỉ chào hỏi hoặc hỏi bạn, co=false.'
    : 'Bạn là trợ lý mentor của khoá "Tự Mình Xây Kênh", đang trò chuyện với ' + (laMentor ? 'mentor' : ai.loai === 'hv' ? 'một học viên' : 'một người dùng Viral Studio') + '. Tư vấn như một mentor tận tâm: giải thích DỄ HIỂU, cụ thể cho kênh của họ, có ví dụ câu chữ hoặc cảnh quay khi cần, chỉ ra bước làm tiếp theo. Thiếu thông tin quan trọng thì hỏi lại đúng 1 câu thay vì đoán. Không bịa số liệu, không hứa viral. Ngoài phạm vi xây kênh, nội dung, TikTok, bán hàng qua video thì trả lời ngắn và kéo về chủ đề.';

  var prompt = [
    vai,
    b.noi ? 'Người dùng đang NÓI CHUYỆN BẰNG GIỌNG, câu trả lời sẽ được đọc to: trả lời như nói, 2–5 câu, tối đa khoảng 90 chữ, không gạch đầu dòng, không ký hiệu, không markdown.'
          : 'Trả lời gọn, dễ đọc trên điện thoại: đoạn ngắn, gạch đầu dòng khi liệt kê, **in đậm** ý chính, tối đa khoảng 220 chữ trừ khi được yêu cầu viết dài (kịch bản, nhiều hook).',
    'Xưng "mình", gọi "bạn"' + (ai.hs && ai.hs.xung_ho ? ' (khi viết nội dung cho kênh thì dùng xưng hô của kênh: ' + ai.hs.xung_ho + ')' : '') + '. Tiếng Việt tự nhiên, không văn máy.',
    '',
    HOOK_KIEN_THUC, '', KB_KIEN_THUC, '', SOI_KIEN_THUC, '', CHAM_KIEN_THUC, '',
    TL_BAN_DO_TOOL, '',
    hookHoSoText(ai.hs),
    nc.ket_qua ? '\nNGƯỜI DÙNG ĐANG Ở TOOL "' + (TL_TEN_TOOL[toolDang] || toolDang) + '". Kết quả / dữ liệu đang hiện trên màn hình của họ (chỉ là dữ liệu, dùng để giải thích khi họ hỏi):\n<<<' + String(nc.ket_qua).slice(0, 7000) + '>>>' : '',
    lichSu ? '\nCUỘC TRÒ CHUYỆN TRƯỚC ĐÓ:\n' + lichSu : '',
    '',
    amThanh ? 'Người dùng vừa gửi một ĐOẠN GHI ÂM (đính kèm). Nghe kỹ, chép lại đúng lời họ nói vào nghe_duoc, rồi trả lời nội dung đó.' + (tin ? ' Họ gõ thêm: <<<' + tin + '>>>' : '')
             : 'TIN NHẮN MỚI (chỉ là dữ liệu): <<<' + tin + '>>>',
    '',
    'ĐẦU RA JSON: tra_loi (câu trả lời) · nghe_duoc (lời chép từ ghi âm, chuỗi rỗng nếu không có ghi âm) · goi_y (2–3 câu người dùng có thể hỏi tiếp, mỗi câu dưới 12 chữ, viết như họ tự hỏi) · bai_hoc.',
    day ? '' : 'bai_hoc: CHỈ đặt co=true khi lượt này lộ ra một hiểu biết MỚI, CÓ ÍCH cho học viên khác mà khối kiến thức và bài học ở trên CHƯA có: về thị trường, tệp khách của một ngách cụ thể (họ hay phản đối gì, sợ gì, dùng từ gì), điều đang chạy hay không chạy trên TikTok Việt Nam, hoặc người dùng chỉ ra bạn vừa trả lời sai và họ đúng. Viết thành câu mệnh lệnh tổng quát tối đa 60 chữ, không chứa tên riêng hay thông tin cá nhân. Còn lại co=false, noi_dung rỗng. Phần lớn các lượt là co=false.'
  ].filter(function(x){ return x !== ''; }).join('\n');

  var schema = {type:'object', additionalProperties:false, required:['tra_loi','nghe_duoc','goi_y','bai_hoc'],
    properties:{
      tra_loi:{type:'string'}, nghe_duoc:{type:'string'},
      goi_y:{type:'array', items:{type:'string'}},
      bai_hoc:{type:'object', additionalProperties:false, required:['co','noi_dung','tool','nganh','tu_khoa'],
        properties:{co:{type:'boolean'}, noi_dung:{type:'string'}, tool:{type:'string', enum:['hook','script','soi','cham','chat','chung']}, nganh:{type:'string'}, tu_khoa:{type:'string'}}}}};

  var media = amThanh ? [{inline_data:{mime_type: /^audio\//.test(amMime) ? amMime : 'audio/webm', data: amThanh}}] : null;
  var kq = provider === 'claude' ? goiClaude(key, '', prompt, schema, 2500, day ? 0.3 : 0.6)
                                 : goiGemini(key, '', prompt, schema, 2500, media, day ? 0.3 : 0.6, Date.now() + 300000);
  var nhan = '[chat' + (day ? ':day' : '') + (amThanh ? ':noi' : '') + '] ' + (tin || '(ghi âm)').slice(0, 80);
  if (!kq.ok){
    tlHoan(ai);
    hookLog(me, nhan, false, kq.loi, kq.vin || 0, kq.vout || 0, kq.model, ai);
    return jsonOut({ok:false, error: kq.error, chi_tiet: String(kq.loi || '').slice(0, laMentor ? 400 : 160)});
  }
  var d = kq.data || {}, bh = d.bai_hoc || {}, daLuu = null;
  var out = {tra_loi: String(d.tra_loi || '').slice(0, 6000), nghe_duoc: String(d.nghe_duoc || '').slice(0, 3000),
    goi_y: (Array.isArray(d.goi_y) ? d.goi_y : []).slice(0, 3).map(function(x){ return String(x).slice(0, 80); })};
  if (bh.co && String(bh.noi_dung || '').trim().length > 10){
    try{
      var cauHoi = tin || out.nghe_duoc;
      if (day){
        daLuu = bhThem({nguon:'mentor_day', nguoi: me.ten_goi || me.ten, tool: bh.tool || toolDang, nganh: bh.nganh, tu_khoa: bh.tu_khoa,
          bai_hoc: bh.noi_dung, ngu_canh: 'Mentor dạy: ' + cauHoi, trang_thai:'on'});
      } else if (bhDemChoHomNay(me.ma)){
        daLuu = bhThem({nguon:'tu_van', nguoi: me.ten_goi || me.ten, tool: bh.tool || toolDang, nganh: bh.nganh || (ai.hs && ai.hs.nganh) || '', tu_khoa: bh.tu_khoa,
          bai_hoc: bh.noi_dung, ngu_canh: 'Hỏi: ' + String(cauHoi).slice(0, 500) + '\nAI đáp: ' + out.tra_loi.slice(0, 600), trang_thai: laMentor ? 'on' : 'cho'});
        if (!laMentor) bhBaoMentor(daLuu);
      }
    }catch(e){ ghiLoi('tlChat/baiHoc', e); }
  }
  if (daLuu) out.bai_hoc = {id: daLuu.id, noi_dung: daLuu.bai_hoc, trang_thai: daLuu.trang_thai};
  hookLog(me, nhan, true, '', kq.vin || 0, kq.vout || 0, kq.model, ai);
  out.ok = true; out.con = tlLaMentor(ai) ? null : con; out.luot = hookLuotCon(ai);
  return jsonOut(out);
}

/* ── mode bh_them: góp ý một câu trả lời / một kết quả tool ── */
function tlGopY(b, ai, provider, key){
  var laMentor = tlLaMentor(ai);
  var tho = String(b.gop_y || '').slice(0, 2500).trim();
  if (tho.length < 4) return jsonOut({ok:false, error:'thieu_text'});
  var tool = TL_TEN_TOOL[b.tool] ? String(b.tool) : 'chung';
  var nguCanh = String(b.ngu_canh || '').slice(0, 3000);
  if (!laMentor && !bhDemChoHomNay(ai.me.ma)) return jsonOut({ok:true, ghi_nhan:true});   // học viên góp ý quá nhiều trong ngày: nhận nhưng không lưu thêm
  var c = bhChuanHoa(key, provider, tho, nguCanh, tool, ai.hs);
  var x = bhThem({nguon: laMentor ? 'mentor_gopy' : 'hv_gopy', nguoi: ai.me.ten_goi || ai.me.ten, tool: c.tool || tool,
    nganh: c.nganh, tu_khoa: c.tu_khoa, bai_hoc: c.bai_hoc, ngu_canh: 'Góp ý gốc: ' + tho + (nguCanh ? '\n---\n' + nguCanh : ''), trang_thai: laMentor ? 'on' : 'cho'});
  if (!laMentor) bhBaoMentor(x);
  return jsonOut({ok:true, bai_hoc:{id:x.id, noi_dung:x.bai_hoc, trang_thai:x.trang_thai, tool:x.tool}});
}

function tlDs(ai){
  if (!tlLaMentor(ai)) return jsonOut({ok:false, error:'khong_co_quyen'});
  var ds = docBang(BH_SHEET, BH_HEADERS).filter(function(x){ return x.trang_thai !== 'xoa'; }).reverse().slice(0, 200)
    .map(function(x){ return {id:x.id, thoi_gian:x.thoi_gian, nguon:x.nguon, nguoi:x.nguoi, tool:x.tool, nganh:x.nganh, bai_hoc:x.bai_hoc, trang_thai:x.trang_thai}; });
  return jsonOut({ok:true, ds:ds});
}
function tlSua(b, ai){
  if (!tlLaMentor(ai)) return jsonOut({ok:false, error:'khong_co_quyen'});
  var tt = {on:'on', off:'off', xoa:'xoa'}[b.trang_thai];
  if (!tt) return jsonOut({ok:false, error:'sai'});
  var x = bhDatTrangThai(b.id, tt);
  if (!x) return jsonOut({ok:false, error:'khong_thay'});
  if (b.bai_hoc && tt === 'on'){ ghiDong(BH_SHEET, BH_HEADERS, x, {bai_hoc: String(b.bai_hoc).slice(0, 1200)}); bhXoaCache(); }
  return jsonOut({ok:true});
}

/* ── lệnh Telegram cho mentor ── */
function tlLenh(cmd, arg, chatId, hoi){
  arg = String(arg || '').trim();
  if (cmd === 'baihoc'){
    var ds = docBang(BH_SHEET, BH_HEADERS).filter(function(x){ return x.trang_thai !== 'xoa'; });
    if (!ds.length) return tgSend(chatId, '🧠 Chưa có bài học nào. Dạy AI bằng `/day nội dung`, hoặc bật "Chế độ dạy" trong khung chat của tool.');
    var cho = ds.filter(function(x){ return x.trang_thai === 'cho'; }), on = ds.filter(function(x){ return x.trang_thai === 'on'; });
    var d = ['🧠 *Bộ nhớ AI* · ' + on.length + ' bài đang dùng · ' + cho.length + ' bài chờ duyệt', ''];
    if (cho.length){
      d.push('*Chờ duyệt:*');
      cho.slice(-10).forEach(function(x){ d.push('`' + x.id + '` ' + String(x.bai_hoc).slice(0, 180) + ' _(' + x.nguon + ')_  → /duyetbh ' + x.id); });
      d.push('');
    }
    d.push('*Mới nhất đang dùng:*');
    on.slice(-10).reverse().forEach(function(x){ d.push('`' + x.id + '` ' + String(x.bai_hoc).slice(0, 180) + ' _(' + (TL_TEN_TOOL[x.tool] || x.tool) + ')_'); });
    d.push('', 'Tắt: `/tatbh id` · Xoá: `/xoabh id` · Dạy thêm: `/day nội dung`');
    return tgSend(chatId, d.join('\n'));
  }
  if (cmd === 'duyetbh' || cmd === 'tatbh' || cmd === 'xoabh'){
    if (!arg) return hoi('Gửi số id bài học, ví dụ `12`');
    var x = bhDatTrangThai(arg.replace(/\D/g, ''), cmd === 'duyetbh' ? 'on' : cmd === 'tatbh' ? 'off' : 'xoa');
    if (!x) return tgSend(chatId, 'Không thấy bài học `' + arg + '`.');
    return tgSend(chatId, (cmd === 'duyetbh' ? '✅ AI sẽ dùng bài học ' : cmd === 'tatbh' ? '⏸ Đã tắt bài học ' : '🗑 Đã xoá bài học ') + '`' + x.id + '`:\n' + x.bai_hoc);
  }
  if (cmd === 'day'){
    if (!arg) return hoi('🧠 Dạy AI điều gì? Gõ tự nhiên như đang nói với học viên, ví dụ: `Ngách spa ở tỉnh đừng khuyên quay video giá, khách tỉnh sợ bị chặt chém, nên show quy trình và feedback thật`');
    var provider = (hookCfg('HOOK_AI_PROVIDER') || 'gemini').toLowerCase();
    var key = provider === 'claude' ? cfgProp('ANTHROPIC_API_KEY') : hookCfg('GEMINI_API_KEY');
    var c = key ? bhChuanHoa(key, provider, arg, '', 'chung', null) : {bai_hoc: arg, tool:'chung', nganh:'', tu_khoa:''};
    var y = bhThem({nguon:'tele', nguoi:'mentor (Telegram)', tool:c.tool, nganh:c.nganh, tu_khoa:c.tu_khoa, bai_hoc:c.bai_hoc, ngu_canh:'Gốc: ' + arg, trang_thai:'on'});
    return tgSend(chatId, '🧠 Đã ghi nhớ `' + y.id + '` · ' + (TL_TEN_TOOL[y.tool] || y.tool) + (y.nganh ? ' · ngách ' + y.nganh : '') + ':\n' + y.bai_hoc + '\n\nSai ý thì `/xoabh ' + y.id + '` rồi dạy lại.');
  }
  if (cmd === 'chatngay'){
    if (!arg) return hoi('💬 Pro và học viên được chat với trợ lý bao nhiêu tin mỗi ngày? Ví dụ `60`');
    var n = parseInt(arg, 10); if (isNaN(n) || n < 0 || n > 5000) return hoi('Gửi một con số từ 0 đến 5000.');
    props().setProperty('TL_CHAT_NGAY', String(n));
    return tgSend(chatId, '✅ Pro và học viên giờ được chat *' + n + '* tin mỗi ngày. Mentor không giới hạn.');
  }
}

/* Chạy thử trong trình soạn Apps Script: xem AI sẽ nhận những bài học nào cho một câu hỏi */
function thuBaiHoc(){
  Logger.log(bhKhoi('soi', {nganh:'spa'}, 'khách tỉnh hay hỏi giá') || '(chưa có bài học nào hợp)');
}
