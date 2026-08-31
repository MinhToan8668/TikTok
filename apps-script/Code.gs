/**
 * ═══════════════════════════════════════════════════════════════
 *  TỰ MÌNH XÂY KÊNH — Backend Google Apps Script
 * ═══════════════════════════════════════════════════════════════
 *  Một file làm 3 việc:
 *   1. GET  ?action=config      → trả config cho landing page
 *   2. POST {action:'register'} → lưu đăng ký vào Sheet + báo Telegram
 *   3. POST từ Telegram webhook → bot admin đổi giá / lịch / sĩ số /
 *      link Zalo / thông báo / duyệt học viên
 *
 *  CHỐNG SPAM: Telegram gửi lại cùng một update nếu không nhận được
 *  phản hồi kịp (Apps Script chậm + trả 302). Mỗi update chỉ được xử
 *  lý MỘT lần nhờ cache update_id, và doPost bọc try/catch toàn bộ
 *  để không bao giờ trả trang lỗi về cho Telegram.
 *
 *  CÀI ĐẶT (3 bước):
 *   1. Dán cả file vào Apps Script (tạo từ Google Sheet:
 *      Extensions → Apps Script), điền SETUP bên dưới → Lưu
 *   2. Deploy → Manage deployments → ✏️ → Version: New version
 *      · Execute as: Me  · Who has access: Anyone   ← bắt buộc
 *   3. Chọn hàm  setup  → Run → đọc Execution log
 *
 *  Bot đang nhắn điên loạn? → chạy hàm  dungBot  là im ngay.
 * ═══════════════════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────────────────────
   SETUP — điền 4 giá trị này. KHÔNG commit file đã điền lên GitHub.
   (Có thể để trống và đặt trong Script Properties với cùng tên key.)
   ───────────────────────────────────────────────────────────── */
var SETUP = {
  BOT_TOKEN:      '',   // token bot Telegram từ @BotFather
  ADMIN_CHAT_IDS: '',   // chat id điều khiển bot, cách nhau dấu phẩy
  ADMIN_KEY:      '',   // mật khẩu xem trang admin (?admin=...)
  EXEC_URL:       '',   // URL /exec của bản deploy hiện tại
  SHEET_ID:       ''    // ID Google Sheet lưu đăng ký — để trống thì
                        // setup tự tạo Sheet mới và tự nhớ ID
};
function cfgProp(name){
  return PropertiesService.getScriptProperties().getProperty(name) || SETUP[name] || '';
}

var SHEET_NAME = 'DangKy';
var LOG_SHEET  = 'Log';
var HEADERS = ['id','time','cohort','name','phone','age','gender','job','strength',
               'goals','timeline','audience','aud_age','aud_gender','pain',
               'niche','tone','format','refs','time_week','camera','gear','fear',
               'tried','unique','expect','channel','source','status'];

/* ─────────────── CONFIG mặc định (bot ghi đè dần) ─────────────── */
var DEFAULT_CONFIG = {
  cohort:{number:3,status:'open',openText:'Đang mở đăng ký',startDate:'Đang chốt lịch'},
  slots:{max:15,base:0,fixed:''},   // fixed = '' → tự đếm; là số → đặt tay
  pricing:{earlyBird:2000000,regular:3000000},
  schedule:{days:'Tối Thứ 5',time:'20:00–22:00',platform:'MS Teams',weeks:4,sessions:4},
  zalo:{groupUrl:''},
  stats:{cohortsDone:2,students:'30+'},
  contact:{tiktok:'Tự Mình Xây Kênh',tiktokUrl:'https://www.tiktok.com/'},
  announcement:{show:false,text:''}
};

/* ═══════════════ CONFIG ═══════════════ */
function props(){ return PropertiesService.getScriptProperties(); }

function getConfig(){
  var raw = props().getProperty('CONFIG');
  var cfg;
  try{ cfg = raw ? JSON.parse(raw) : null; }catch(e){ cfg = null; }
  return deepMerge(DEFAULT_CONFIG, cfg || {});
}
function saveConfig(cfg){ props().setProperty('CONFIG', JSON.stringify(cfg)); }

function deepMerge(base, over){
  var out = {};
  for (var k in base){
    if (base[k] && typeof base[k]==='object' && !Array.isArray(base[k]))
      out[k] = deepMerge(base[k], (over && typeof over[k]==='object') ? over[k] : {});
    else out[k] = (over && over[k]!==undefined && over[k]!==null) ? over[k] : base[k];
  }
  if (over) for (var k2 in over){ if (!(k2 in out)) out[k2] = over[k2]; }
  return out;
}

function pad2(n){ n=Number(n)||0; return n<10 ? '0'+n : ''+n; }
function cohortLabel(cfg){ return 'Lớp '+pad2(cfg.cohort.number); }
function money(n){
  n=Number(n)||0;
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+'đ';
}
function nowVN(){ return Utilities.formatDate(new Date(),'GMT+7','dd/MM/yyyy HH:mm'); }

/* ═══════════════ SHEET ═══════════════
   Chạy được cả khi project KHÔNG gắn với Sheet nào (tạo rời từ
   script.google.com): mở theo SHEET_ID, chưa có thì tự tạo Sheet
   mới rồi nhớ ID trong Script Properties.                        */
var _ss = null;
function ss(){
  if (_ss) return _ss;

  var bound = SpreadsheetApp.getActiveSpreadsheet();   // project gắn Sheet
  if (bound){ _ss = bound; return _ss; }

  var id = cfgProp('SHEET_ID');
  if (id){
    _ss = SpreadsheetApp.openById(id);
    return _ss;
  }

  // Lần đầu: tự tạo Sheet mới và lưu ID lại để các lần sau dùng đúng file
  _ss = SpreadsheetApp.create('TMXK - Đăng ký');
  props().setProperty('SHEET_ID', _ss.getId());
  return _ss;
}

function sheet(){
  var wb = ss();
  var sh = wb.getSheetByName(SHEET_NAME);
  // form đổi cấu trúc → tab cũ sai số cột thì đổi tên giữ lại, tạo tab mới đúng cột
  if (sh && sh.getLastRow() >= 1 && sh.getLastColumn() !== HEADERS.length){
    sh.setName(SHEET_NAME + '_cu_' + Utilities.formatDate(new Date(),'GMT+7','ddMMyy_HHmm'));
    sh = null;
  }
  if (!sh){
    sh = wb.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function allRegs(){
  var sh = sheet();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2,1,last-1,HEADERS.length).getValues();
  return vals.map(function(r,i){
    var o = {row:i+2};
    HEADERS.forEach(function(h,j){ o[h] = String(r[j]==null?'':r[j]); });
    return o;
  });
}

function countRegistered(cfg, preloaded){
  var label = cohortLabel(cfg);
  return (preloaded||allRegs()).filter(function(r){
    return r.cohort===label && r.status!=='rejected';
  }).length;
}

function publicConfig(preloaded){
  var cfg = getConfig();
  var thuc = countRegistered(cfg, preloaded);
  cfg.slots.web = thuc;                       // số đếm thật từ Sheet
  var dat = cfg.slots.fixed;
  if (dat !== '' && dat !== null && dat !== undefined && !isNaN(Number(dat))){
    cfg.slots.registered = Math.max(0, Number(dat));   // admin đặt tay
    cfg.slots.base = 0;                                // đã đặt tay thì không cộng thêm
    cfg.slots.manual = true;
  } else {
    cfg.slots.registered = thuc;
    cfg.slots.manual = false;
  }
  return cfg;
}

function jsonOut(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Ghi lỗi ra sheet Log để lần ra được, thay vì mất hút */
function ghiLoi(cho, err){
  try{ Logger.log(cho+': '+err); }catch(e2){}
  try{
    var sh = ss().getSheetByName(LOG_SHEET) || ss().insertSheet(LOG_SHEET);
    sh.appendRow([nowVN(), cho, String(err), String(err && err.stack || '')]);
  }catch(e3){}
}

/* ═══════════════ TELEGRAM — HẠ TẦNG ═══════════════ */
function tgApi(method, payload){
  var token = cfgProp('BOT_TOKEN');
  if (!token) return null;
  try{
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/'+method,{
      method:'post', contentType:'application/json',
      payload: JSON.stringify(payload), muteHttpExceptions:true
    });
    return JSON.parse(res.getContentText());
  }catch(err){ return null; }
}

/* Gửi tin: cắt tin dài quá 4096 ký tự, và nếu Markdown lệch làm
   Telegram từ chối thì gửi lại dạng chữ thường — không tin nào mất trắng */
function tgSend(chatId, text, keyboard){
  if (!chatId) return;
  var manh = catNho(String(text), 3800);
  for (var i=0;i<manh.length;i++){
    var p = {chat_id:chatId, text:manh[i], parse_mode:'Markdown',
             disable_web_page_preview:true};
    // nút bấm chỉ gắn vào mảnh cuối
    if (keyboard && i===manh.length-1) p.reply_markup = {inline_keyboard:keyboard};
    var r = tgApi('sendMessage', p);
    if (r && r.ok===false){
      delete p.parse_mode;
      p.text = manh[i].replace(/[`*_]/g,'');
      tgApi('sendMessage', p);
    }
  }
}
function tgBroadcastKb(text, keyboard){
  cfgProp('ADMIN_CHAT_IDS').split(',').forEach(function(id){
    id=id.trim(); if(id) tgSend(id,text,keyboard);
  });
}
function tgAnswer(cbId, text){
  return tgApi('answerCallbackQuery',{callback_query_id:cbId, text:text||''});
}
function catNho(s, max){
  if (s.length<=max) return [s];
  var out=[], cur='';
  s.split('\n').forEach(function(d){
    while (d.length>max){
      if (cur){ out.push(cur); cur=''; }
      out.push(d.slice(0,max)); d=d.slice(max);
    }
    if (cur && cur.length+d.length+1>max){ out.push(cur); cur=d; }
    else cur = cur ? cur+'\n'+d : d;
  });
  if (cur) out.push(cur);
  return out;
}
function tgBroadcast(text){
  cfgProp('ADMIN_CHAT_IDS').split(',').forEach(function(id){
    id=id.trim(); if(id) tgSend(id,text);
  });
}
/* ═══ CHẾ ĐỘ HỎI–ĐÁP ═══
   Bấm lệnh trơn (VD /giasom) → bot hỏi và nhớ lại trong 5 phút;
   tin nhắn thường kế tiếp được hiểu là giá trị cho lệnh đó.      */
function datCho(chatId, cmd){
  try{ CacheService.getScriptCache().put('cho_'+chatId, cmd, 300); }catch(e){}
}
function layCho(chatId){
  try{
    var c = CacheService.getScriptCache();
    var v = c.get('cho_'+chatId);
    if (v) c.remove('cho_'+chatId);
    return v;
  }catch(e){ return null; }
}
function xoaCho(chatId){
  try{ CacheService.getScriptCache().remove('cho_'+chatId); }catch(e){}
}

function isAdmin(chatId){
  var ids = cfgProp('ADMIN_CHAT_IDS').split(',').map(function(s){return s.trim()});
  return ids.indexOf(String(chatId)) > -1;
}

/* ═══════════════ CHỐNG XỬ LÝ TRÙNG ═══════════════
   Telegram gửi lại đúng update đó nếu không nhận được phản hồi kịp.
   Apps Script chạy chậm (mở Sheet, gọi API) nên chuyện này xảy ra
   thường xuyên — mỗi lần gửi lại là bot nhắn thêm một tin, thành
   vòng lặp spam. Nhớ update_id đã xử lý trong cache 6 tiếng.        */
function daXuLy(updateId){
  try{
    var cache = CacheService.getScriptCache();
    var key = 'tgu_'+updateId;
    if (cache.get(key)) return true;
    cache.put(key,'1',21600);   // 6 giờ — mức tối đa của CacheService
    return false;
  }catch(err){
    return false;               // cache lỗi thì vẫn xử lý, thà trùng còn hơn mất
  }
}

/* ═══════════════ ENTRY: GET ═══════════════ */
function doGet(e){
  try{
    var p = (e && e.parameter) || {};
    var action = p.action || 'config';

    if (action === 'config') return jsonOut({ok:true, config: publicConfig()});

    if (action === 'regs'){
      if (!p.key || p.key !== cfgProp('ADMIN_KEY'))
        return jsonOut({ok:false, error:'unauthorized'});
      var all = allRegs();
      var cfg = publicConfig(all);
      var max = Math.max(1, Number(cfg.slots.max)||1);
      var total = (Number(cfg.slots.base)||0) + (Number(cfg.slots.registered)||0);
      cfg.computed = { cohortLabel: cohortLabel(cfg), remaining: Math.max(0, max-total) };
      return jsonOut({ok:true, config:cfg, regs:all});
    }

    return jsonOut({ok:true, service:'tuminhxaykenh', hint:'?action=config'});
  }catch(err){
    ghiLoi('doGet', err);
    return jsonOut({ok:false, error:'internal'});
  }
}

/* ═══════════════ ENTRY: POST ═══════════════
   Bọc TOÀN BỘ try/catch: một lỗi ném ra ngoài doPost là Apps Script
   trả trang báo lỗi qua chuyển hướng — Telegram nhận 302, kết luận
   webhook hỏng rồi gửi lại mãi. Luôn trả 200 tử tế.                 */
function doPost(e){
  try{
    var body = {};
    try{ body = JSON.parse(e.postData.contents); }catch(err){ body = {}; }

    // Update từ Telegram webhook — mỗi update chỉ xử lý MỘT lần
    if (body.update_id !== undefined){
      if (!daXuLy(body.update_id)){
        try{ handleTelegram(body); }catch(err){ ghiLoi('handleTelegram', err); }
      }
      return jsonOut({ok:true});
    }

    if (body.action === 'register') return handleRegister(body);

    return jsonOut({ok:false, error:'unknown_action'});
  }catch(err){
    ghiLoi('doPost', err);
    return jsonOut({ok:false, error:'internal'});
  }
}

/* Mã đăng ký ngắn 4 ký tự (bỏ chữ dễ nhầm O/0/I/1) — dễ gõ tay */
function maNgan(daCo){
  var BANG='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var dung={}; (daCo||[]).forEach(function(r){ dung[String(r.id).toUpperCase()]=1 });
  for (var lan=0; lan<50; lan++){
    var m='';
    for (var i=0;i<4;i++) m += BANG.charAt(Math.floor(Math.random()*BANG.length));
    if (!dung[m]) return m;
  }
  return String(new Date().getTime()).slice(-5);   // dự phòng, gần như không tới
}

/* ═══════════════ ĐĂNG KÝ ═══════════════ */
function handleRegister(d){
  // honeypot: bot spam điền cả ô ẩn → giả vờ thành công
  if (d.website) return jsonOut({ok:true, config: publicConfig()});

  var name  = String(d.name||'').trim();
  var phone = String(d.phone||'').trim();
  if (!name || !phone) return jsonOut({ok:false, error:'missing_fields'});
  var digits = phone.replace(/\D/g,'');
  if (digits.length < 9 || digits.length > 12) return jsonOut({ok:false, error:'invalid_phone'});

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return jsonOut({ok:false, error:'busy'});

  try{
    var cfg = getConfig();
    var label = cohortLabel(cfg);

    // chống đăng ký trùng SĐT trong cùng một lớp
    var dup = allRegs().some(function(r){
      return r.cohort===label && r.phone.replace(/\D/g,'')===digits && r.status!=='rejected';
    });
    if (dup) return jsonOut({ok:true, duplicate:true, config: publicConfig()});

    var id = maNgan(allRegs());
    var time = nowVN();

    var f = function(k){ return String(d[k]||'') };
    sheet().appendRow([id, time, label, name, "'"+phone,
      f('age'), f('gender'), f('job'), f('strength'),
      f('goals'), f('timeline'), f('audience'), f('aud_age'), f('aud_gender'), f('pain'),
      f('niche'), f('tone'), f('format'), f('refs'), f('time'), f('camera'), f('gear'), f('fear'),
      f('tried'), f('unique'), f('expect'), f('channel'), f('source')||'web', 'pending']);

    var cfg2 = publicConfig();
    var total = (Number(cfg2.slots.base)||0) + (Number(cfg2.slots.registered)||0);
    var remaining = Math.max(0,(Number(cfg2.slots.max)||0)-total);

    var dong = function(icon, nhan, k){
      var v = String(d[k]||'').trim();
      return v ? icon+' '+nhan+': '+v : '';
    };
    // chỉ in tiêu đề nhóm khi nhóm đó thật sự có nội dung
    var nhom = function(tieude, dongs){
      var co = dongs.filter(function(x){return x});
      return co.length ? ['', tieude].concat(co) : [];
    };
    var tin = [
      '🌱 *Đăng ký mới — Tự Mình Xây Kênh*','',
      '👤 *'+name+'*   ·   mã `'+id+'`',
      '📱 `'+phone+'`',
      [d.age?'🎂 '+d.age+' tuổi':'', d.gender||''].filter(String).join('  ·  '),
      dong('💼','Nghề','job'),
      dong('💪','Thế mạnh','strength')
    ]
    .concat(nhom('*🎯 Mục tiêu*', [dong('🏁','Xây kênh để','goals'), dong('⏳','Muốn đạt trong','timeline')]))
    .concat(nhom('*👥 Khán giả*', [dong('🗣','Nói với','audience'),
             [String(d.aud_age||''), String(d.aud_gender||'')].filter(String).join(' · '),
             dong('🩹','Nỗi đau','pain')]))
    .concat(nhom('*🎬 Nội dung*', [dong('🏷','Ngách','niche'), dong('🎙','Tone','tone'),
             dong('📐','Định dạng','format'), dong('⭐','Tham khảo','refs')]))
    .concat(nhom('*🔋 Nguồn lực*', [dong('⏰','Thời gian/tuần','time'), dong('🎥','Tự tin camera','camera'),
             dong('🧰','Thiết bị','gear'), dong('😰','Lo ngại','fear')]))
    .concat(nhom('*🤝 Kỳ vọng*', [dong('📊','Từng thử TikTok','tried'), dong('🎵','Kênh hiện có','channel'),
             dong('✨','Khác biệt','unique'),
             d.expect ? '💭 Muốn được định hướng nhất:\n_"'+d.expect+'"_' : '']))
    .concat(['',
      '🕐 '+time+' · '+label,
      '📈 Tổng: '+total+'/'+cfg2.slots.max+' — còn '+remaining+' suất'])
    .filter(function(x){return x!==undefined && x!==null})
    .join('\n');

    tgBroadcastKb(tin, [[
      {text:'✅ Duyệt',   callback_data:'ok:'+id},
      {text:'❌ Từ chối', callback_data:'no:'+id}
    ]]);

    // đủ chỗ → tự chuyển trạng thái và báo admin
    if (remaining<=0 && cfg.cohort.status==='open'){
      cfg.cohort.status='full';
      saveConfig(cfg);
      tgBroadcast('🎉 *'+label+' đã đủ '+cfg.slots.max+' người!* Web tự chuyển sang '+
                  '"đã đủ chỗ". Mở lớp mới: /solop '+(Number(cfg.cohort.number)+1));
    }

    return jsonOut({ok:true, config: cfg2});
  } finally {
    lock.releaseLock();
  }
}

/* ═══════════════ BOT TELEGRAM — ROUTER ═══════════════ */
function handleTelegram(update){
  if (update.callback_query) return handleCallback(update.callback_query);
  var msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;
  var chatId = msg.chat.id;
  var text = msg.text.trim();

  if (!isAdmin(chatId)){
    tgSend(chatId,'⛔ Bot này chỉ dành cho quản trị Tự Mình Xây Kênh.\nChat ID của bạn: `'+chatId+'`');
    return;
  }

  var m = text.match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/);
  if (!m){
    // không phải lệnh — có đang chờ trả lời cho lệnh nào không?
    var choCmd = layCho(chatId);
    if (!choCmd){ tgSend(chatId,'Gõ /menu để xem danh sách lệnh nhé.'); return; }
    m = [null, choCmd, text];
  } else {
    xoaCho(chatId);   // gõ lệnh mới thì bỏ câu hỏi đang chờ
  }
  var cmd = m[1].toLowerCase(), arg = (m[2]||'').trim();
  var cfg = getConfig();

  if (cmd==='huy' || cmd==='cancel'){
    tgSend(chatId,'👌 Đã hủy, không đổi gì cả.');
    return;
  }

  switch(cmd){

    case 'start': case 'menu': case 'help':
      tgSend(chatId,[
        '🌱 *Bot quản lý — Tự Mình Xây Kênh*',
        '_Đổi gì ở đây web cũng tự cập nhật trong ~1 phút._','',
        '👉 Bấm lệnh trơn (VD /giasom) → bot hỏi → bạn chỉ cần',
        'nhắn con số/nội dung ở tin tiếp theo. Đổi ý thì /huy.','',
        '*👀 Xem nhanh*',
        '📋 /trangthai — toàn bộ cấu hình hiện tại',
        '👥 /danhsach — danh sách đăng ký lớp hiện tại',
        '📄 /sheet — link Google Sheet','',
        '*💰 Giá & lớp học*',
        '💰 /giasom `2000000` — giá ưu đãi đăng ký sớm',
        '💸 /gia `3000000` — giá gốc',
        '🔢 /solop `3` — số thứ tự lớp (đổi lớp mới)',
        '🪑 /siso `15` — sĩ số tối đa',
        '👤 /ngoaihethong `2` — số HV đăng ký ngoài web',
        '👥 /dadangky `12` — đặt tay số người đã đăng ký (`auto` để tự đếm)','',
        '*📅 Lịch học*',
        '📅 /khaigiang `05/09/2026` — ngày khai giảng',
        '🕗 /lichhoc `Tối Thứ 5 | 20:00–22:00` — lịch buổi live',
        '📆 /sotuan `4` — số tuần',
        '📚 /sobuoi `4` — số buổi live','',
        '*🔗 Liên kết & thông báo*',
        '💬 /zalo `https://zalo.me/g/...` — link group Zalo',
        '🎵 /tiktok `https://tiktok.com/@...` — link kênh',
        '📢 /thongbao `nội dung` — bật banner đầu trang',
        '🔕 /tatthongbao — tắt banner','',
        '*🚦 Trạng thái đăng ký*',
        '🟢 /mo — mở đăng ký',
        '🟡 /du — báo đủ chỗ (chuyển sang danh sách chờ)',
        '🔴 /dong — đóng đăng ký','',
        '*✅ Duyệt học viên*',
        '✅ /duyet `AB12` — duyệt (hoặc bấm nút trên tin báo)',
        '❌ /tuchoi `AB12` — từ chối','',
        '*⚙️ Khác*',
        '🏫 /sokhoa `2` — số khóa đã dạy',
        '🎓 /hocvien `30+` — số học viên hiển thị'
      ].join('\n'));
      return;

    case 'trangthai': case 'status': {
      var all = allRegs();
      var c2 = publicConfig(all);
      var lbl = cohortLabel(c2);
      var regs = all.filter(function(r){return r.cohort===lbl});
      var pend = regs.filter(function(r){return r.status==='pending'}).length;
      var tot = (Number(c2.slots.base)||0)+(Number(c2.slots.registered)||0);
      var stTxt = {open:'🟢 đang mở',full:'🟡 đủ chỗ',closed:'🔴 đã đóng'}[c2.cohort.status]||c2.cohort.status;
      tgSend(chatId,[
        '📋 *'+lbl+'* · '+stTxt,'',
        '👥 '+tot+'/'+c2.slots.max+'  '+(c2.slots.manual
          ? '(đặt tay · Sheet đang có '+c2.slots.web+' · ⏳ '+pend+' chờ duyệt)'
          : '(web '+c2.slots.web+' + ngoài '+c2.slots.base+' · ⏳ '+pend+' chờ duyệt)'),
        '💰 Ưu đãi: '+money(c2.pricing.earlyBird)+'  (gốc '+money(c2.pricing.regular)+')',
        '📅 Khai giảng: '+c2.cohort.startDate,
        '🕗 Lịch: '+c2.schedule.days+' · '+c2.schedule.time+' · '+c2.schedule.platform,
        '📆 '+c2.schedule.weeks+' tuần · '+c2.schedule.sessions+' buổi live',
        '💬 Zalo: '+(c2.zalo.groupUrl||'(chưa đặt)'),
        '🎵 TikTok: '+(c2.contact.tiktokUrl||'(chưa đặt)'),
        '📢 Banner: '+(c2.announcement.show?('BẬT — "'+c2.announcement.text+'"'):'tắt'),
        '🏫 Đã dạy: '+c2.stats.cohortsDone+' khóa · '+c2.stats.students+' học viên'
      ].join('\n'));
      return;
    }

    case 'giasom': return setNum(chatId,cfg,arg,'pricing.earlyBird','Giá ưu đãi',true,'giasom');
    case 'gia':    return setNum(chatId,cfg,arg,'pricing.regular','Giá gốc',true,'gia');
    case 'solop':  return setNum(chatId,cfg,arg,'cohort.number','Số lớp',false,'solop');
    case 'siso':   return setNum(chatId,cfg,arg,'slots.max','Sĩ số tối đa',false,'siso');
    case 'ngoaihethong': return setNum(chatId,cfg,arg,'slots.base','HV ngoài hệ thống',false,'ngoaihethong');
    case 'dadangky': case 'sodangky': {
      var c5 = publicConfig();
      var dangHien = (Number(c5.slots.base)||0) + (Number(c5.slots.registered)||0);
      if (!arg){
        datCho(chatId,'dadangky');
        return tgSend(chatId,[
          '👥 Đang hiện trên web: *'+dangHien+'/'+c5.slots.max+'*'+
            (c5.slots.manual ? '  _(đặt tay)_' : '  _(tự đếm)_'),
          'Đếm thật trong Sheet: '+c5.slots.web+' người','',
          '👉 Nhắn số muốn hiện vào tin tiếp theo (VD `12`),',
          'nhắn `auto` để tự đếm lại, hoặc /huy.'
        ].join('\n'));
      }
      if (/^(auto|tu|tự|tudong|off)$/i.test(arg)){
        cfg.slots.fixed = ''; saveConfig(cfg);
        var c6 = publicConfig();
        var t6 = (Number(c6.slots.base)||0) + (Number(c6.slots.registered)||0);
        return tgSend(chatId,'✅ Về chế độ *tự đếm* — web hiện '+t6+'/'+c6.slots.max+' người.');
      }
      var n5 = Number(String(arg).replace(/[^\d]/g,''));
      if (!arg.match(/\d/) || isNaN(n5))
        return tgSend(chatId,'Cần một con số. VD: `/dadangky 12`  ·  về tự đếm: `/dadangky auto`');
      cfg.slots.fixed = n5; saveConfig(cfg);
      return tgSend(chatId,[
        '✅ Đã đặt *'+n5+'/'+cfg.slots.max+'* người đăng ký — còn '+
          Math.max(0,(Number(cfg.slots.max)||0)-n5)+' suất.',
        '_Số này giữ nguyên kể cả khi có người đăng ký mới._',
        'Quay lại tự đếm: `/dadangky auto`'
      ].join('\n'));
    }

    case 'sotuan': return setNum(chatId,cfg,arg,'schedule.weeks','Số tuần',false,'sotuan');
    case 'sobuoi': return setNum(chatId,cfg,arg,'schedule.sessions','Số buổi live',false,'sobuoi');
    case 'sokhoa': return setNum(chatId,cfg,arg,'stats.cohortsDone','Số khóa đã dạy',false,'sokhoa');

    case 'hocvien':
      if(!arg){ datCho(chatId,'hocvien');
        return tgSend(chatId,'Đang hiện: *'+cfg.stats.students+'*\n\n👉 Nhắn số mới vào tin tiếp theo (VD `30+`), hoặc /huy.'); }
      cfg.stats.students=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Số học viên hiển thị: *'+arg+'*');

    case 'khaigiang':
      if(!arg){ datCho(chatId,'khaigiang');
        return tgSend(chatId,'Đang là: *'+cfg.cohort.startDate+'*\n\n👉 Nhắn ngày mới vào tin tiếp theo (VD `05/09/2026`), hoặc /huy.'); }
      cfg.cohort.startDate=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Ngày khai giảng: *'+arg+'*');

    case 'lichhoc': {
      if(!arg || arg.indexOf('|')<0){
        datCho(chatId,'lichhoc');
        return tgSend(chatId,'Đang là: *'+cfg.schedule.days+' · '+cfg.schedule.time+'*\n\n'+
          '👉 Nhắn lịch mới vào tin tiếp theo, nhớ có dấu | ngăn giữa ngày và giờ:\n'+
          '`Tối Thứ 5 | 20:00–22:00`  ·  /huy để thôi.');
      }
      var parts=arg.split('|');
      cfg.schedule.days=parts[0].trim();
      cfg.schedule.time=parts[1].trim();
      saveConfig(cfg);
      return tgSend(chatId,'✅ Lịch học: *'+cfg.schedule.days+' · '+cfg.schedule.time+'*');
    }

    case 'zalo':
      if(!arg){ datCho(chatId,'zalo');
        return tgSend(chatId,'Đang là: '+(cfg.zalo.groupUrl||'(chưa đặt)')+
          '\n\n👉 Nhắn link group mới vào tin tiếp theo (nhắn `xoa` để gỡ link), hoặc /huy.'); }
      cfg.zalo.groupUrl = (arg.toLowerCase()==='xoa') ? '' : arg;
      saveConfig(cfg);
      return tgSend(chatId, cfg.zalo.groupUrl
        ? '✅ Link Zalo đã cập nhật — học viên điền form xong sẽ thấy nút tham gia.'
        : '✅ Đã xóa link Zalo — nút tham gia sẽ ẩn.');

    case 'tiktok':
      if(!arg){ datCho(chatId,'tiktok');
        return tgSend(chatId,'Đang là: '+(cfg.contact.tiktokUrl||'(chưa đặt)')+
          '\n\n👉 Nhắn link kênh mới vào tin tiếp theo, hoặc /huy.'); }
      cfg.contact.tiktokUrl=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Link TikTok đã cập nhật.');

    case 'thongbao':
      if(!arg){ datCho(chatId,'thongbao');
        return tgSend(chatId,(cfg.announcement.show
          ? 'Banner đang BẬT: "'+cfg.announcement.text+'"'
          : 'Banner đang tắt.')+
          '\n\n👉 Nhắn nội dung banner vào tin tiếp theo, hoặc /huy. Tắt hẳn: /tatthongbao'); }
      cfg.announcement={show:true,text:arg}; saveConfig(cfg);
      return tgSend(chatId,'📢 Banner đã BẬT:\n"'+arg+'"');
    case 'tatthongbao':
      cfg.announcement.show=false; saveConfig(cfg);
      return tgSend(chatId,'🔕 Banner đã tắt.');

    case 'mo':
      cfg.cohort.status='open'; saveConfig(cfg);
      return tgSend(chatId,'🟢 Đã MỞ đăng ký '+cohortLabel(cfg)+'.');
    case 'du':
      cfg.cohort.status='full'; saveConfig(cfg);
      return tgSend(chatId,'🟡 Đã báo ĐỦ CHỖ — nút trên web chuyển thành "vào danh sách chờ".');
    case 'dong':
      cfg.cohort.status='closed'; saveConfig(cfg);
      return tgSend(chatId,'🔴 Đã ĐÓNG đăng ký — form trên web bị khóa.');

    case 'danhsach': case 'ds': {
      var label2=cohortLabel(cfg);
      var regs2=allRegs().filter(function(r){return r.cohort===label2});
      if(!regs2.length) return tgSend(chatId,'Chưa có đăng ký nào cho '+label2+'.');
      var lines=['📋 *'+label2+' — '+regs2.length+' đăng ký*',''];
      regs2.forEach(function(r,i){
        var st={pending:'⏳',approved:'✅',rejected:'❌'}[r.status]||'·';
        lines.push((i+1)+'. '+st+' *'+r.name+'* — `'+r.phone+'`  ·  mã `'+r.id+'`'+
                   (r.niche?'\n    '+r.niche:''));
      });
      // nút duyệt nhanh cho tối đa 5 bạn đang chờ
      var cho = regs2.filter(function(r){return r.status==='pending'}).slice(0,5);
      var kb = cho.map(function(r){ return [
        {text:'✅ '+r.name, callback_data:'ok:'+r.id},
        {text:'❌', callback_data:'no:'+r.id}
      ]});
      return tgSend(chatId, lines.join('\n'), kb.length?kb:null);
    }

    case 'duyet':  return setStatus(chatId,arg,'approved','✅ Đã duyệt');
    case 'tuchoi': return setStatus(chatId,arg,'rejected','❌ Đã từ chối');

    case 'sheet': return tgSend(chatId,'📄 '+ss().getUrl());
    case 'id':    return tgSend(chatId,'Chat ID: `'+chatId+'`');

    default:
      tgSend(chatId,'Không hiểu lệnh /'+cmd+' — gõ /menu để xem danh sách.');
  }
}

/* Bấm nút ✅ Duyệt / ❌ Từ chối ngay trên tin báo đăng ký */
function handleCallback(cb){
  var chatId = cb.message && cb.message.chat && cb.message.chat.id;
  if (!isAdmin(chatId)) return tgAnswer(cb.id, 'Không có quyền');

  var p = String(cb.data||'').split(':');
  var act = p[0], ma = p[1];
  if (act!=='ok' && act!=='no') return tgAnswer(cb.id);

  var hit=null;
  allRegs().forEach(function(r){ if(String(r.id).toUpperCase()===String(ma).toUpperCase()) hit=r; });
  if (!hit) return tgAnswer(cb.id, 'Không tìm thấy mã '+ma);

  var trangThai = (act==='ok') ? 'approved' : 'rejected';
  sheet().getRange(hit.row, HEADERS.indexOf('status')+1).setValue(trangThai);
  tgAnswer(cb.id, act==='ok' ? 'Đã duyệt '+hit.name : 'Đã từ chối '+hit.name);

  // đổi nút thành nhãn kết quả để khỏi bấm nhầm lần nữa
  tgApi('editMessageReplyMarkup',{
    chat_id: chatId, message_id: cb.message.message_id,
    reply_markup:{inline_keyboard:[[{
      text:(act==='ok' ? '✅ Đã duyệt — ' : '❌ Đã từ chối — ')+hit.name,
      callback_data:'xong'
    }]]}
  });
}

function getPath(o,path){ return path.split('.').reduce(function(a,k){return a?a[k]:undefined},o); }
function setPath(o,path,v){
  var ks=path.split('.'), last=ks.pop();
  ks.reduce(function(a,k){return a[k]},o)[last]=v;
}

/* Nhận 2000000, 2.000.000, 2tr, 2M, 500k */
function docTien(s){
  var raw=String(s).toLowerCase().replace(/[.,\s]/g,'');
  if(/^\d+(\.\d+)?(tr|m)$/.test(raw)) return parseFloat(raw)*1000000;
  if(/^\d+k$/.test(raw)) return parseFloat(raw)*1000;
  return parseInt(raw.replace(/\D/g,''),10);
}

function setNum(chatId,cfg,arg,path,label,isMoney,cmd){
  if(!String(arg).trim()){
    var cur=getPath(cfg,path);
    if (cmd) datCho(chatId, cmd);
    return tgSend(chatId,label+' đang là *'+(isMoney?money(cur):cur)+'*\n\n'+
      '👉 Nhắn giá trị mới vào tin tiếp theo là xong'+
      (isMoney?' (`2tr` `1500k` `2000000` đều hiểu)':'')+', hoặc /huy để thôi.');
  }
  var n = isMoney ? docTien(arg) : parseInt(String(arg).replace(/\D/g,''),10);
  if(isNaN(n)||n<0){
    if (cmd) datCho(chatId, cmd);   // hỏi lại, khỏi phải bấm lệnh lần nữa
    return tgSend(chatId,'Không đọc được `'+arg+'` — nhắn lại một con số nhé, hoặc /huy.');
  }
  setPath(cfg,path,n); saveConfig(cfg);
  tgSend(chatId,'✅ '+label+' = *'+(isMoney?money(n):n)+'*\n\nWeb sẽ cập nhật trong ~1 phút.');
}

function setStatus(chatId,id,status,prefix){
  if(!id){
    datCho(chatId, status==='approved' ? 'duyet' : 'tuchoi');
    tgSend(chatId,'👉 Nhắn mã học viên vào tin tiếp theo (VD `AB12`) — gõ /danhsach để xem mã, /huy để thôi.');
    return;
  }
  var hit=null;
  allRegs().forEach(function(r){ if(r.id.toLowerCase()===id.toLowerCase()) hit=r; });
  if(!hit) return tgSend(chatId,'Không tìm thấy mã `'+id+'`. Gõ /danhsach để xem mã.');
  sheet().getRange(hit.row, HEADERS.indexOf('status')+1).setValue(status);
  tgSend(chatId,prefix+' *'+hit.name+'* ('+hit.phone+').');
}
/* ═══════════════ CÀI ĐẶT — chạy tay trong editor ═══════════════
   Bot chạy bằng CHẾ ĐỘ HỎI ĐỊNH KỲ (polling): script tự hỏi Telegram
   mỗi phút thay vì để Telegram gọi ngược vào /exec. Lý do: Apps Script
   LUÔN trả 302 cho POST, Telegram đòi 200 thẳng → webhook báo
   "Wrong response from the webhook: 302 Found" rồi bot chết câm.
   Polling đi chiều ngược lại nên không có URL nào để hỏng.
   Đổi lại: tin đầu tiên chờ tối đa ~1 phút, các tin sau gần như tức thì
   (khi có lệnh, script bám lại long-poll thêm một lúc).                */

var HOI_TRAN_GIAY = 30;   // trần thời gian một lượt chạy được phép bám
var HOI_CHO_GIAY  = 10;   // mỗi lần hỏi nằm chờ bao lâu khi đang có việc
var HOI_RONG_TOI  = 2;    // im lặng mấy lượt liền thì nhường lượt sau

/**
 * setup — CHẠY MỘT LẦN sau khi dán code.
 * Tự làm hết: tạo/mở sheet, kiểm tra token, nạp menu lệnh, NGẮT webhook
 * (kèm xả hàng chờ — nguồn spam), bỏ qua tin tồn cũ, rồi đặt lịch hỏi
 * Telegram mỗi phút. Chạy lại nhiều lần vẫn an toàn.
 */
function setup(){
  var out = [];

  if (!cfgProp('BOT_TOKEN') || !cfgProp('ADMIN_CHAT_IDS'))
    throw new Error('Chưa điền BOT_TOKEN / ADMIN_CHAT_IDS trong SETUP ở đầu file.');

  sheet();
  out.push('✔ Sheet "'+SHEET_NAME+'" sẵn sàng: '+ss().getUrl());

  var me = tgApi('getMe', {});
  if (!me || !me.ok){
    out.push('✘ Token không hợp lệ — kiểm tra lại với @BotFather rồi chạy lại setup');
    Logger.log(out.join('\n'));
    return;
  }
  out.push('✔ Bot: @'+me.result.username);

  var cmds = tgApi('setMyCommands',{commands:[
    {command:'trangthai',  description:'📋 Tình trạng lớp hiện tại'},
    {command:'danhsach',   description:'👥 Danh sách đăng ký'},
    {command:'giasom',     description:'💰 Giá ưu đãi — /giasom 2000000'},
    {command:'gia',        description:'💰 Giá gốc — /gia 3000000'},
    {command:'khaigiang',  description:'📅 Ngày khai giảng — /khaigiang 05/09'},
    {command:'lichhoc',    description:'🕗 Lịch live — /lichhoc Tối T5 | 20:00–22:00'},
    {command:'solop',      description:'🔢 Đổi số lớp — /solop 4'},
    {command:'siso',       description:'🪑 Sĩ số tối đa — /siso 15'},
    {command:'ngoaihethong',description:'👤 HV ngoài web — /ngoaihethong 2'},
    {command:'dadangky',   description:'👥 Đặt số đã đăng ký — /dadangky 12 · auto'},
    {command:'zalo',       description:'💬 Link group Zalo'},
    {command:'thongbao',   description:'📢 Bật banner thông báo'},
    {command:'tatthongbao',description:'🔕 Tắt banner'},
    {command:'mo',         description:'🟢 Mở đăng ký'},
    {command:'du',         description:'🟡 Báo đủ chỗ'},
    {command:'dong',       description:'🔴 Đóng đăng ký'},
    {command:'duyet',      description:'✅ Duyệt — /duyet AB12'},
    {command:'tuchoi',     description:'❌ Từ chối — /tuchoi AB12'},
    {command:'nen',        description:'🖼 Vẽ nền Teams — /nen Minh Toàn'},
    {command:'huy',        description:'👌 Hủy câu hỏi đang chờ'},
    {command:'sheet',      description:'📄 Link Google Sheet'},
    {command:'menu',       description:'⚙️ Danh sách đầy đủ lệnh'}
  ]});
  out.push(cmds && cmds.ok
    ? '✔ Đã nạp menu lệnh — nút Menu xanh hiện cạnh ô chat'
    : '• Không nạp được menu lệnh (gõ tay vẫn chạy bình thường)');

  try{
    datLichHoi();
    out.push('✔ Đã ngắt webhook + đặt lịch hỏi Telegram mỗi phút');
    out.push('  Tin đầu chờ tối đa 1 phút, các tin sau gần như tức thì.');
    out.push('  Bot có nhắn điên loạn → chạy hàm  dungBot');
  }catch(err){
    out.push('✘ Không tự đặt được lịch chạy: '+err);
    out.push('');
    out.push('ĐẶT TAY (1 phút là xong):');
    out.push('  1. Cột trái Apps Script → biểu tượng đồng hồ (Triggers)');
    out.push('  2. Add Trigger (góc dưới phải)');
    out.push('  3. Chọn hàm: hoiTelegram · Event source: Time-driven');
    out.push('     · Type: Minutes timer · Interval: Every minute');
    out.push('  4. Save, cấp quyền khi Google hỏi');
  }

  out.push('');
  out.push('Xong. Vào Telegram nhắn /menu cho bot (tin đầu chờ tối đa 1 phút).');
  Logger.log(out.join('\n'));
  tgSend(cfgProp('ADMIN_CHAT_IDS').split(',')[0].trim(),
    '✅ *Backend Tự Mình Xây Kênh đã sẵn sàng*\n\nBot: @'+me.result.username+
    '\n\nGõ /menu để xem danh sách lệnh.');
}

/**
 * DỪNG KHẨN CẤP — bot đang nhắn liên tục thì chọn hàm này bấm Run.
 * Ngắt webhook, xóa hàng chờ, gỡ lịch hỏi. Bot im ngay lập tức.
 * Muốn bật lại: chạy  setup.
 */
function dungBot(){
  var out = [];
  var r = tgApi('deleteWebhook',{drop_pending_updates:true});
  out.push('✔ Đã ngắt webhook + xóa hàng chờ ('+(r && r.ok ? 'ok' : JSON.stringify(r))+')');
  try{ out.push('✔ Đã gỡ '+goLichHoi()+' lịch chạy. Bot im ngay lập tức.'); }
  catch(err){
    out.push('✘ Không gỡ được lịch bằng code — gỡ tay: cột trái → đồng hồ →');
    out.push('  ba chấm ở dòng hoiTelegram → Delete trigger.');
  }
  out.push('  Chạy lại  setup  khi muốn bật bot.');
  Logger.log(out.join('\n'));
}

/* Ngắt webhook, bỏ qua tin tồn cũ, dựng lại lịch hỏi mỗi phút */
function datLichHoi(){
  tgApi('deleteWebhook',{drop_pending_updates:true});
  datMocMoiNhat();
  goLichHoi();
  ScriptApp.newTrigger('hoiTelegram').timeBased().everyMinutes(1).create();
}

function goLichHoi(){
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction()==='hoiTelegram'){ ScriptApp.deleteTrigger(t); n++; }
  });
  return n;
}

/**
 * Dời mốc đọc qua hết các tin đang tồn mà không xử lý chúng.
 * Không có bước này, bật bot lên là nó trả lời dồn cả loạt lệnh cũ.
 */
function datMocMoiNhat(){
  var r = tgApi('getUpdates',{offset:-1, timeout:0, limit:1});
  if (r && r.ok && r.result && r.result.length){
    props().setProperty('TG_OFFSET', String(r.result[0].update_id + 1));
  }
}

/**
 * Lịch chạy gọi hàm này mỗi phút. Lúc rảnh chỉ tốn ~1 giây; hễ có lệnh
 * thật thì bám lại long-poll thêm một lúc để các lệnh tiếp theo trong
 * cùng phiên được trả lời gần như tức thì.
 */
function hoiTelegram(){
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;          // lượt trước còn đang bám
  try{
    if (motLuotHoi(0) <= 0) return;         // rảnh hoặc lỗi mạng — thoát ngay
    var het = Date.now() + HOI_TRAN_GIAY*1000;
    var rong = 0;
    while (Date.now() < het && rong < HOI_RONG_TOI){
      var n = motLuotHoi(HOI_CHO_GIAY);
      if (n < 0) break;
      rong = (n===0) ? rong+1 : 0;
    }
  } finally {
    lock.releaseLock();
  }
}

/** Trả về số update đã xử lý, 0 nếu không có, -1 nếu gọi Telegram lỗi. */
function motLuotHoi(choGiay){
  var off = Number(props().getProperty('TG_OFFSET') || 0);
  var r = tgApi('getUpdates',{
    offset:off, timeout:choGiay, limit:20, allowed_updates:['message','callback_query']
  });
  if (!r || !r.ok || !r.result) return -1;
  if (!r.result.length) return 0;

  // Dời mốc TRƯỚC khi xử lý: một tin gây lỗi cũng không làm kẹt hàng chờ mãi
  var maxId = off;
  r.result.forEach(function(u){ if(u.update_id >= maxId) maxId = u.update_id+1; });
  props().setProperty('TG_OFFSET', String(maxId));

  r.result.forEach(function(u){
    try{ handleTelegram(u); }catch(err){ ghiLoi('hoiTelegram', err); }
  });
  return r.result.length;
}

/** Chẩn đoán khi bot im hoặc lỗi — chạy rồi đọc Execution log. */
function kiemTra(){
  var out = [];
  var me = tgApi('getMe',{});
  out.push('Bot: '+(me && me.ok ? '@'+me.result.username : '✘ token sai hoặc mạng lỗi'));

  var soLich = -1;
  try{
    soLich = ScriptApp.getProjectTriggers().filter(function(t){
      return t.getHandlerFunction()==='hoiTelegram';
    }).length;
  }catch(err){}
  out.push('Lịch hỏi mỗi phút: '+(
    soLich>0 ? '✔ đang chạy ('+soLich+' lịch)' :
    soLich===0 ? '✘ CHƯA CÓ — bot sẽ không nhận lệnh. Chạy setup hoặc đặt tay.' :
    '? không đọc được (thiếu quyền)'));
  out.push('Đã đọc tới update: '+(props().getProperty('TG_OFFSET')||'chưa có'));

  var wh = tgApi('getWebhookInfo',{});
  if (wh && wh.ok){
    var w = wh.result;
    out.push('Webhook: '+(w.url||'(không nối — đúng, chế độ hỏi không cần webhook)'));
    if (w.url) out.push('  ⚠ Webhook đang nối sẽ tranh tin với chế độ hỏi — chạy setup để gỡ.');
  }
  out.push('Đăng ký trong sheet: '+allRegs().length+' dòng');
  out.push('ADMIN_KEY: '+cfgProp('ADMIN_KEY'));
  Logger.log(out.join('\n'));
}
