/**
 * ═══════════════════════════════════════════════════════════════
 *  TỰ MÌNH XÂY KÊNH — Backend Google Apps Script
 * ═══════════════════════════════════════════════════════════════
 *  Một file này làm 3 việc:
 *   1. GET  ?action=config  → trả config cho landing page
 *   2. POST {action:register} → lưu đăng ký vào Google Sheet
 *      + báo về Telegram cho admin
 *   3. POST từ Telegram (webhook) → bot admin: đổi giá, lịch,
 *      sĩ số, ngày khai giảng, link Zalo, thông báo, duyệt học viên…
 *
 *  BẢO MẬT: token Telegram nằm trong Script Properties (server),
 *  KHÔNG nằm trong file HTML. Xem HUONG-DAN.md để cài đặt.
 *
 *  Script Properties cần có:
 *   BOT_TOKEN       = token bot Telegram (tạo MỚI qua @BotFather —
 *                     token cũ đã lộ trên GitHub, phải /revoke)
 *   ADMIN_CHAT_IDS  = các chat id được phép điều khiển bot,
 *                     cách nhau dấu phẩy. VD: 5116087301,123456789
 *   ADMIN_KEY       = mật khẩu xem trang admin (?admin=...)
 * ═══════════════════════════════════════════════════════════════
 */

var SHEET_NAME = 'DangKy';
var HEADERS = ['id','time','cohort','name','phone','year','job',
               'channel','stage','time_week','topic','target','goal',
               'source','status'];

/* ─────────────── CONFIG mặc định (bot sẽ ghi đè) ─────────────── */
var DEFAULT_CONFIG = {
  cohort:{number:3,status:'open',openText:'Đang mở đăng ký',startDate:'Đang chốt lịch'},
  slots:{max:15,base:0},
  pricing:{earlyBird:2000000,regular:3000000},
  schedule:{days:'Tối Thứ 5',time:'20:00–22:00',platform:'MS Teams',weeks:4,sessions:4},
  zalo:{groupUrl:''},
  stats:{cohortsDone:2,students:'30+'},
  contact:{tiktok:'Tự Mình Xây Kênh',tiktokUrl:'https://www.tiktok.com/'},
  announcement:{show:false,text:''}
};

/* ═══════════════ HELPERS ═══════════════ */
function props(){ return PropertiesService.getScriptProperties(); }

function getConfig(){
  var raw = props().getProperty('CONFIG');
  var cfg = raw ? JSON.parse(raw) : {};
  return deepMerge(DEFAULT_CONFIG, cfg);
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

function sheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh){
    sh = ss.insertSheet(SHEET_NAME);
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

/* Số đăng ký hợp lệ (không bị từ chối) của lớp hiện tại */
function countRegistered(cfg){
  var label = cohortLabel(cfg);
  return allRegs().filter(function(r){
    return r.cohort===label && r.status!=='rejected';
  }).length;
}

/* Config công khai trả cho landing page (kèm số đã đăng ký) */
function publicConfig(){
  var cfg = getConfig();
  cfg.slots.registered = countRegistered(cfg);
  return cfg;
}

function jsonOut(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ═══════════════ TELEGRAM ═══════════════ */
function tgSend(chatId, text){
  var token = props().getProperty('BOT_TOKEN');
  if (!token || !chatId) return;
  try{
    UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
      method:'post', contentType:'application/json', muteHttpExceptions:true,
      payload: JSON.stringify({chat_id:chatId, text:text, parse_mode:'Markdown',
                               disable_web_page_preview:true})
    });
  }catch(e){}
}
function tgBroadcast(text){
  var ids = (props().getProperty('ADMIN_CHAT_IDS')||'').split(',');
  ids.forEach(function(id){ id=id.trim(); if(id) tgSend(id,text); });
}
function isAdmin(chatId){
  var ids = (props().getProperty('ADMIN_CHAT_IDS')||'').split(',').map(function(s){return s.trim()});
  return ids.indexOf(String(chatId)) > -1;
}

/* ═══════════════ ENTRY: GET ═══════════════ */
function doGet(e){
  var action = e && e.parameter && e.parameter.action;

  if (action === 'config'){
    return jsonOut({ok:true, config: publicConfig()});
  }

  if (action === 'regs'){
    var key = e.parameter.key || '';
    if (!key || key !== props().getProperty('ADMIN_KEY'))
      return jsonOut({ok:false, error:'unauthorized'});
    var cfg = publicConfig();
    var max = Math.max(1, Number(cfg.slots.max)||1);
    var total = (Number(cfg.slots.base)||0) + (Number(cfg.slots.registered)||0);
    cfg.computed = {
      cohortLabel: cohortLabel(cfg),
      remaining: Math.max(0, max-total)
    };
    return jsonOut({ok:true, config:cfg, regs:allRegs()});
  }

  return jsonOut({ok:true, service:'tuminhxaykenh', hint:'?action=config'});
}

/* ═══════════════ ENTRY: POST ═══════════════ */
function doPost(e){
  var body = {};
  try{ body = JSON.parse(e.postData.contents); }catch(err){ return jsonOut({ok:false,error:'bad_json'}); }

  // Update từ Telegram webhook
  if (body.message || body.callback_query || body.edited_message){
    handleTelegram(body);
    return jsonOut({ok:true});
  }

  // Đăng ký từ landing page
  if (body.action === 'register') return handleRegister(body);

  return jsonOut({ok:false, error:'unknown_action'});
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

    var id = 'TMXK'+ new Date().getTime().toString(36).toUpperCase();
    var time = Utilities.formatDate(new Date(),'GMT+7','dd/MM/yyyy HH:mm');

    sheet().appendRow([id, time, label, name, phone,
      String(d.year||''), String(d.job||''), String(d.channel||''),
      String(d.stage||''), String(d.time||''), String(d.topic||''),
      String(d.target||''), String(d.goal||''), String(d.source||'web'), 'pending']);

    var cfg2 = publicConfig();
    var total = (Number(cfg2.slots.base)||0) + (Number(cfg2.slots.registered)||0);
    var remaining = Math.max(0,(Number(cfg2.slots.max)||0)-total);

    tgBroadcast([
      '🌱 *Đăng ký mới — Tự Mình Xây Kênh*','',
      '👤 *'+name+'*  ·  `'+id+'`',
      '📱 '+phone,
      '🎂 '+(d.year||'—')+'   💼 '+(d.job||'—'),
      d.channel ? '🎵 Kênh: '+d.channel : '🎵 Chưa có kênh',
      '📊 '+(d.stage||'—'),
      '⏰ '+(d.time||'—'),
      '🏷 Ngách: '+(d.topic||'—'),
      '🎯 '+(d.target||'—'),
      '💭 _"'+(d.goal||'')+'"_','',
      '🕐 '+time+' · '+label,
      '📈 Tổng: '+total+'/'+cfg2.slots.max+' — còn '+remaining+' suất','',
      'Duyệt: `/duyet '+id+'`  ·  Từ chối: `/tuchoi '+id+'`'
    ].join('\n'));

    return jsonOut({ok:true, config: cfg2});
  } finally {
    lock.releaseLock();
  }
}

/* ═══════════════ BOT TELEGRAM ═══════════════ */
function handleTelegram(update){
  var msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;
  var chatId = msg.chat.id;
  var text = msg.text.trim();

  if (!isAdmin(chatId)){
    // Trả lời chat id để lần đầu cài đặt biết id cần thêm vào ADMIN_CHAT_IDS
    tgSend(chatId,'⛔ Bạn không có quyền dùng bot này.\nChat ID của bạn: `'+chatId+'`');
    return;
  }

  var m = text.match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/);
  if (!m){ tgSend(chatId,'Gõ /menu để xem danh sách lệnh nhé.'); return; }
  var cmd = m[1].toLowerCase(), arg = (m[2]||'').trim();
  var cfg = getConfig();

  switch(cmd){

    case 'start': case 'menu': case 'help':
      tgSend(chatId,[
        '🌱 *Bot quản lý — Tự Mình Xây Kênh*','',
        '*Xem nhanh*',
        '/trangthai — toàn bộ cấu hình hiện tại',
        '/danhsach — danh sách đăng ký lớp hiện tại','',
        '*Giá & lớp học*',
        '/giasom `2000000` — giá Early Bird',
        '/gia `3000000` — giá gốc',
        '/solop `3` — số thứ tự lớp (đổi lớp mới)',
        '/siso `15` — sĩ số tối đa',
        '/ngoaihethong `2` — số HV đăng ký ngoài web','',
        '*Lịch học*',
        '/khaigiang `05/09/2026` — ngày khai giảng dự kiến',
        '/lichhoc `Tối Thứ 5 | 20:00–22:00` — lịch buổi live',
        '/sotuan `4` — số tuần  ·  /sobuoi `4` — số buổi live','',
        '*Liên kết & thông báo*',
        '/zalo `https://zalo.me/g/...` — link group Zalo',
        '/tiktok `https://tiktok.com/@...` — link kênh',
        '/thongbao `nội dung` — bật banner thông báo',
        '/tatthongbao — tắt banner','',
        '*Trạng thái đăng ký*',
        '/mo — mở đăng ký  ·  /du — báo đủ chỗ  ·  /dong — đóng hẳn','',
        '*Duyệt học viên*',
        '/duyet `TMXK...`  ·  /tuchoi `TMXK...`','',
        '*Khác*',
        '/sokhoa `2` — số khóa đã dạy  ·  /hocvien `30+` — số học viên'
      ].join('\n'));
      return;

    case 'trangthai': {
      var c2 = publicConfig();
      var tot = (Number(c2.slots.base)||0)+(Number(c2.slots.registered)||0);
      tgSend(chatId,[
        '📋 *'+cohortLabel(c2)+' — trạng thái: '+c2.cohort.status+'*','',
        '💰 Early Bird: '+money(c2.pricing.earlyBird)+'  (gốc '+money(c2.pricing.regular)+')',
        '👥 Sĩ số: '+tot+'/'+c2.slots.max+'  (web '+c2.slots.registered+' + ngoài '+c2.slots.base+')',
        '📅 Khai giảng: '+c2.cohort.startDate,
        '🕗 Lịch: '+c2.schedule.days+' · '+c2.schedule.time+' · '+c2.schedule.platform,
        '📆 '+c2.schedule.weeks+' tuần · '+c2.schedule.sessions+' buổi live',
        '💬 Zalo: '+(c2.zalo.groupUrl||'(chưa đặt)'),
        '🎵 TikTok: '+(c2.contact.tiktokUrl||'(chưa đặt)'),
        '📢 Thông báo: '+(c2.announcement.show?('BẬT — "'+c2.announcement.text+'"'):'tắt'),
        '🏫 Đã dạy: '+c2.stats.cohortsDone+' khóa · '+c2.stats.students+' học viên'
      ].join('\n'));
      return;
    }

    case 'giasom': return setNum(chatId,cfg,arg,function(n){cfg.pricing.earlyBird=n},
      function(){return '✅ Giá Early Bird: *'+money(cfg.pricing.earlyBird)+'*'});
    case 'gia': return setNum(chatId,cfg,arg,function(n){cfg.pricing.regular=n},
      function(){return '✅ Giá gốc: *'+money(cfg.pricing.regular)+'*'});
    case 'solop': return setNum(chatId,cfg,arg,function(n){cfg.cohort.number=n},
      function(){return '✅ Đã chuyển sang *'+cohortLabel(cfg)+'* (đếm đăng ký tính theo lớp mới)'});
    case 'siso': return setNum(chatId,cfg,arg,function(n){cfg.slots.max=n},
      function(){return '✅ Sĩ số tối đa: *'+cfg.slots.max+'*'});
    case 'ngoaihethong': return setNum(chatId,cfg,arg,function(n){cfg.slots.base=n},
      function(){return '✅ Số HV ngoài hệ thống: *'+cfg.slots.base+'*'});
    case 'sotuan': return setNum(chatId,cfg,arg,function(n){cfg.schedule.weeks=n},
      function(){return '✅ Số tuần: *'+cfg.schedule.weeks+'*'});
    case 'sobuoi': return setNum(chatId,cfg,arg,function(n){cfg.schedule.sessions=n},
      function(){return '✅ Số buổi live: *'+cfg.schedule.sessions+'*'});
    case 'sokhoa': return setNum(chatId,cfg,arg,function(n){cfg.stats.cohortsDone=n},
      function(){return '✅ Số khóa đã dạy: *'+cfg.stats.cohortsDone+'*'});

    case 'hocvien':
      if(!arg) return tgSend(chatId,'Cách dùng: /hocvien `30+`');
      cfg.stats.students=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Số học viên hiển thị: *'+arg+'*');

    case 'khaigiang':
      if(!arg) return tgSend(chatId,'Cách dùng: /khaigiang `05/09/2026`');
      cfg.cohort.startDate=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Ngày khai giảng: *'+arg+'*');

    case 'lichhoc': {
      if(!arg || arg.indexOf('|')<0)
        return tgSend(chatId,'Cách dùng: /lichhoc `Tối Thứ 5 | 20:00–22:00`');
      var parts=arg.split('|');
      cfg.schedule.days=parts[0].trim();
      cfg.schedule.time=parts[1].trim();
      saveConfig(cfg);
      return tgSend(chatId,'✅ Lịch học: *'+cfg.schedule.days+' · '+cfg.schedule.time+'*');
    }

    case 'zalo':
      if(!arg) return tgSend(chatId,'Cách dùng: /zalo `https://zalo.me/g/...`\nXóa link: /zalo `xoa`');
      cfg.zalo.groupUrl = (arg.toLowerCase()==='xoa') ? '' : arg;
      saveConfig(cfg);
      return tgSend(chatId, cfg.zalo.groupUrl
        ? '✅ Link group Zalo đã cập nhật — học viên điền form xong sẽ thấy nút tham gia.'
        : '✅ Đã xóa link Zalo — nút tham gia sẽ ẩn.');

    case 'tiktok':
      if(!arg) return tgSend(chatId,'Cách dùng: /tiktok `https://www.tiktok.com/@tenkenh`');
      cfg.contact.tiktokUrl=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Link TikTok đã cập nhật.');

    case 'thongbao':
      if(!arg) return tgSend(chatId,'Cách dùng: /thongbao `Lớp 03 khai giảng 05/09 — còn 5 suất Early Bird!`');
      cfg.announcement={show:true,text:arg}; saveConfig(cfg);
      return tgSend(chatId,'📢 Banner thông báo đã BẬT:\n"'+arg+'"');
    case 'tatthongbao':
      cfg.announcement.show=false; saveConfig(cfg);
      return tgSend(chatId,'🔕 Banner thông báo đã tắt.');

    case 'mo':
      cfg.cohort.status='open'; saveConfig(cfg);
      return tgSend(chatId,'✅ Đã MỞ đăng ký '+cohortLabel(cfg)+'.');
    case 'du':
      cfg.cohort.status='full'; saveConfig(cfg);
      return tgSend(chatId,'✅ Đã báo ĐỦ CHỖ — nút trên web chuyển thành "vào danh sách chờ".');
    case 'dong':
      cfg.cohort.status='closed'; saveConfig(cfg);
      return tgSend(chatId,'✅ Đã ĐÓNG đăng ký — form trên web bị khóa.');

    case 'danhsach': {
      var label2=cohortLabel(cfg);
      var regs=allRegs().filter(function(r){return r.cohort===label2});
      if(!regs.length) return tgSend(chatId,'Chưa có đăng ký nào cho '+label2+'.');
      var lines=['📋 *'+label2+' — '+regs.length+' đăng ký*',''];
      regs.forEach(function(r,i){
        var st={pending:'⏳',approved:'✅',rejected:'❌'}[r.status]||'·';
        lines.push((i+1)+'. '+st+' *'+r.name+'* — '+r.phone+'\n    `'+r.id+'` · '+(r.stage||'')+
                   (r.topic?' · '+r.topic:''));
      });
      return tgSend(chatId,lines.join('\n'));
    }

    case 'duyet': return setStatus(chatId,arg,'approved','✅ Đã duyệt');
    case 'tuchoi': return setStatus(chatId,arg,'rejected','❌ Đã từ chối');

    default:
      tgSend(chatId,'Không hiểu lệnh /'+cmd+' — gõ /menu để xem danh sách.');
  }
}

function setNum(chatId,cfg,arg,apply,doneMsg){
  var n=Number(String(arg).replace(/[^\d]/g,''));
  if(!arg || isNaN(n)) return tgSend(chatId,'Cần một con số. VD: `2000000`');
  apply(n); saveConfig(cfg);
  tgSend(chatId,doneMsg());
}

function setStatus(chatId,id,status,prefix){
  if(!id) return tgSend(chatId,'Cách dùng: kèm mã đăng ký. VD: `/duyet TMXK...`');
  var regs=allRegs();
  var hit=null;
  regs.forEach(function(r){ if(r.id.toLowerCase()===id.toLowerCase()) hit=r; });
  if(!hit) return tgSend(chatId,'Không tìm thấy mã `'+id+'`. Gõ /danhsach để xem mã.');
  sheet().getRange(hit.row, HEADERS.indexOf('status')+1).setValue(status);
  tgSend(chatId,prefix+' *'+hit.name+'* ('+hit.phone+').');
}

/**
 * Chạy MỘT LẦN sau khi dán BOT_TOKEN vào Script Properties và deploy:
 * chọn hàm setWebhook trong editor rồi bấm Run — bot sẽ trỏ về web app này.
 * Dán URL /exec của bản deploy hiện tại vào biến EXEC_URL bên dưới trước khi chạy.
 */
function setWebhook(){
  var EXEC_URL = 'PASTE_APPS_SCRIPT_URL_HERE'; // URL kết thúc bằng /exec
  var token = props().getProperty('BOT_TOKEN');
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot'+token+
    '/setWebhook?url='+encodeURIComponent(EXEC_URL),{muteHttpExceptions:true});
  Logger.log(res.getContentText());
}
