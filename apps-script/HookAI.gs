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
 * Cài đặt (một lần):
 *   Project Settings → Script properties → thêm
 *     ANTHROPIC_API_KEY   sk-ant-...            (bắt buộc)
 *     HOOK_AI_DAILY       20                    (tuỳ chọn, mặc định 20)
 *     HOOK_AI_MODEL       claude-opus-5         (tuỳ chọn)
 *   Rồi Deploy → Manage deployments → Edit → New version → Deploy.
 */

var HOOK_SHEET     = 'HookAI';
var HOOK_HEADERS   = ['thoi_gian','ma','ten','vaitro','hook','ok','loi','input_tokens','output_tokens','model'];
var HOOK_TEMPLATES = ['highlight','editorial','glass','sticker','bubbles','timeline','chips',
                      'titlecard','list','knockout','lowerthird','quote','pov','outline'];

function hookAi(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});

  var key = cfgProp('ANTHROPIC_API_KEY');
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

  // ── gọi Claude ──
  var model = cfgProp('HOOK_AI_MODEL') || 'claude-opus-5';
  var noiDung = [];
  if (img) noiDung.push({type:'image', source:{type:'base64', media_type:'image/jpeg', data:img}});
  noiDung.push({type:'text', text: hookPrompt(text, b, !!img)});

  var req = {
    model: model,
    max_tokens: 6000,
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type:'json_schema', schema: HOOK_SCHEMA } },
    messages: [{ role:'user', content: noiDung }]
  };
  var res, ma, raw;
  try{
    res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method:'post', contentType:'application/json', muteHttpExceptions:true,
      headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01',
                'anthropic-beta':'server-side-fallback-2026-07-01' },
      payload: JSON.stringify(req)
    });
    ma = res.getResponseCode(); raw = res.getContentText();
  }catch(err){
    hookHoanLuot(me.ma, khongGioiHan);
    hookLog(me, text, false, 'mang: '+err, 0, 0, model);
    return jsonOut({ok:false, error:'loi_mang'});
  }

  if (ma !== 200){
    hookHoanLuot(me.ma, khongGioiHan);
    hookLog(me, text, false, 'http '+ma+': '+String(raw).slice(0,300), 0, 0, model);
    return jsonOut({ok:false, error: ma === 429 || ma === 529 ? 'ban_qua' : 'loi_ai'});
  }

  var j = JSON.parse(raw);
  var u = j.usage || {};
  if (j.stop_reason === 'refusal'){
    hookHoanLuot(me.ma, khongGioiHan);
    hookLog(me, text, false, 'refusal', u.input_tokens||0, u.output_tokens||0, model);
    return jsonOut({ok:false, error:'tu_choi'});
  }
  var chu = (j.content || []).filter(function(c){ return c.type === 'text' }).map(function(c){ return c.text }).join('');
  var data;
  try{ data = JSON.parse(chu); }catch(err){
    hookHoanLuot(me.ma, khongGioiHan);
    hookLog(me, text, false, 'json: '+chu.slice(0,200), u.input_tokens||0, u.output_tokens||0, model);
    return jsonOut({ok:false, error:'loi_ai'});
  }

  hookLog(me, text, true, '', u.input_tokens||0, u.output_tokens||0, model);
  return jsonOut({ok:true, data:data, con: khongGioiHan ? null : con, han:han, ten: me.ten_goi || me.ten});
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
    'Bạn là người dựng hook text cho video dọc 9:16 của học viên khóa "Tự Mình Xây Kênh". Người xem lướt nhanh, tắt tiếng, có 1 giây để hiểu hook.',
    coAnh ? 'Ảnh kèm theo là frame video đầu tiên.' : 'Không có ảnh. Người dùng báo mặt người ở ' + mat + '.',
    'Video sẽ đăng lên ' + nen + '. Vùng UI phải né trên khung 1080x1920: thanh trên 0-12%, caption và nút từ 75% trở xuống, cột icon bên phải rộng 13% trong dải 51-90%.',
    '',
    'Hook người dùng viết:',
    '"""' + text + '"""',
    '',
    'Trả về JSON đúng schema, tiếng Việt, giữ giọng của tác giả, không bịa số liệu mới:',
    '1. face: mặt người chiếm từ top_pct đến bottom_pct (% chiều cao, 0-100); background: mô tả vùng trống vài chữ (sáng/tối, đơn giản/rối).',
    '2. score: chấm hook gốc theo 4 tiêu chí mỗi cái 0-25 (hook = có gây tò mò hoặc chạm nỗi đau trong 1 giây không; clarity = đọc một lần là hiểu; length = đủ ngắn để đọc trên điện thoại, lý tưởng dưới 12 từ; keyword = có con số hoặc từ mạnh để nhấn màu), total là tổng; verdict một câu nhận xét thẳng.',
    '3. fixes: 2-4 việc cụ thể để hook gốc mạnh hơn, mỗi việc một câu ngắn.',
    '4. hooks: đúng 5 phiên bản viết lại, mỗi bản theo một công thức khác nhau trong: "Con số cụ thể", "Nỗi đau", "Phản trực giác", "POV", "Câu hỏi", "Kết quả trước, cách làm sau". text tối đa 2 dòng ngăn bằng \\n, đánh dấu 1-2 từ khóa bằng **...**.',
    '5. layouts: đúng 3 bố cục khác tinh thần nhau, chọn template trong: ' + HOOK_TEMPLATES.join(', ') + '. Ý nghĩa: highlight (vệt bút dạ, hook ngắn), editorial (cụm _..._ serif nghiêng to, kể chuyện), glass (thẻ kính mờ + kicker, nền rối), sticker (thẻ đen nghiêng, hài), bubbles (hộp chữ từng dòng, text dài), timeline (rows = [[mốc, nội dung]] 3 hàng), chips (chips = [A, B] + lead, nội dung từ A sang B), titlecard (phủ tối toàn khung, câu 5-8 từ, y_pct là tâm khối chữ, thường 40), list (dòng đầu kết thúc bằng dấu hai chấm, các dòng sau là ý), knockout (chữ khoét trên dải tối, 1-3 từ), lowerthird (thanh góc dưới trái + kicker), quote (trích dẫn, dòng cuối bắt đầu "- " là ký tên), pov (kicker là nhãn chip, khối 1 câu chính, khối 2 sau một dòng trống là dòng phụ), outline (chữ viền rỗng, từ khóa tô đặc). y_pct là mép trên khối chữ, phải né mặt và né vùng UI; size là px trên khung rộng 1080 (hook ngắn 60-84, text dài 40-48). text dùng \\n để xuống dòng, dòng trống để tách khối, **từ khóa**, _cụm chốt_. why một câu.',
    '6. caption: caption đăng kèm video, 1-2 câu, có lời kêu gọi comment hoặc lưu. hashtags: 5 hashtag tiếng Việt không dấu, có #tuminhxaykenh.'
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
      properties:{ formula:{type:'string'}, text:{type:'string'} } } },
    layouts:{ type:'array', items:{ type:'object', additionalProperties:false, required:['template','y_pct','size','text','why'],
      properties:{ template:{type:'string', enum:HOOK_TEMPLATES}, y_pct:{type:'number'}, size:{type:'number'}, text:{type:'string'}, why:{type:'string'},
        kicker:{type:'string'}, lead:{type:'string'}, chips:{type:'array', items:{type:'string'}},
        rows:{type:'array', items:{type:'array', items:{type:'string'}}} } } },
    caption:{type:'string'},
    hashtags:{ type:'array', items:{type:'string'} }
  }
};
