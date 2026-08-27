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
var HEADERS = ['id','time','cohort','name','phone','year','job',
               'channel','stage','time_week','topic','target','goal',
               'source','status'];

/* ─────────────── CONFIG mặc định (bot ghi đè dần) ─────────────── */
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
  var sh = ss().getSheetByName(SHEET_NAME);
  if (!sh){
    sh = ss().insertSheet(SHEET_NAME);
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
  cfg.slots.registered = countRegistered(cfg, preloaded);
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
function tgSend(chatId, text){
  if (!chatId) return;
  var manh = catNho(String(text), 3800);
  for (var i=0;i<manh.length;i++){
    var p = {chat_id:chatId, text:manh[i], parse_mode:'Markdown',
             disable_web_page_preview:true};
    var r = tgApi('sendMessage', p);
    if (r && r.ok===false){
      delete p.parse_mode;
      p.text = manh[i].replace(/[`*_]/g,'');
      tgApi('sendMessage', p);
    }
  }
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
    var time = nowVN();

    sheet().appendRow([id, time, label, name, "'"+phone,
      String(d.year||''), String(d.job||''), String(d.channel||''),
      String(d.stage||''), String(d.time||''), String(d.topic||''),
      String(d.target||''), String(d.goal||''), String(d.source||'web'), 'pending']);

    var cfg2 = publicConfig();
    var total = (Number(cfg2.slots.base)||0) + (Number(cfg2.slots.registered)||0);
    var remaining = Math.max(0,(Number(cfg2.slots.max)||0)-total);

    tgBroadcast([
      '🌱 *Đăng ký mới — Tự Mình Xây Kênh*','',
      '👤 *'+name+'*  ·  `'+id+'`',
      '📱 `'+phone+'`',
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
  var msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;
  var chatId = msg.chat.id;
  var text = msg.text.trim();

  if (!isAdmin(chatId)){
    tgSend(chatId,'⛔ Bot này chỉ dành cho quản trị Tự Mình Xây Kênh.\nChat ID của bạn: `'+chatId+'`');
    return;
  }

  var m = text.match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/);
  if (!m){ tgSend(chatId,'Gõ /menu để xem danh sách lệnh nhé.'); return; }
  var cmd = m[1].toLowerCase(), arg = (m[2]||'').trim();
  var cfg = getConfig();

  switch(cmd){

    case 'start': case 'menu': case 'help':
      tgSend(chatId,[
        '🌱 *Bot quản lý — Tự Mình Xây Kênh*',
        '_Đổi gì ở đây web cũng tự cập nhật trong ~1 phút._','',
        '👉 Lệnh có số/chữ phía sau thì phải gõ kèm giá trị.',
        'Bấm lệnh trơn (VD /giasom) bot sẽ hiện giá trị đang dùng.','',
        '*Xem nhanh*',
        '/trangthai — toàn bộ cấu hình hiện tại',
        '/danhsach — danh sách đăng ký lớp hiện tại','',
        '*Giá & lớp học*',
        '/giasom `2000000` — giá ưu đãi đăng ký sớm',
        '/gia `3000000` — giá gốc',
        '/solop `3` — số thứ tự lớp (đổi lớp mới)',
        '/siso `15` — sĩ số tối đa',
        '/ngoaihethong `2` — số HV đăng ký ngoài web','',
        '*Lịch học*',
        '/khaigiang `05/09/2026` — ngày khai giảng',
        '/lichhoc `Tối Thứ 5 | 20:00–22:00` — lịch buổi live',
        '/sotuan `4` — số tuần  ·  /sobuoi `4` — số buổi live','',
        '*Liên kết & thông báo*',
        '/zalo `https://zalo.me/g/...` — link group Zalo',
        '/tiktok `https://tiktok.com/@...` — link kênh',
        '/thongbao `nội dung` — bật banner  ·  /tatthongbao','',
        '*Trạng thái*',
        '/mo — mở đăng ký  ·  /du — đủ chỗ  ·  /dong — đóng','',
        '*Duyệt học viên*',
        '/duyet `TMXK...`  ·  /tuchoi `TMXK...`','',
        '*Khác*',
        '/sokhoa `2` — số khóa đã dạy  ·  /hocvien `30+` — số học viên'
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
        '👥 '+tot+'/'+c2.slots.max+'  (web '+c2.slots.registered+' + ngoài '+c2.slots.base+
          ' · ⏳ '+pend+' chờ duyệt)',
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

    case 'giasom': return setNum(chatId,cfg,arg,'pricing.earlyBird','Giá ưu đãi',true);
    case 'gia':    return setNum(chatId,cfg,arg,'pricing.regular','Giá gốc',true);
    case 'solop':  return setNum(chatId,cfg,arg,'cohort.number','Số lớp',false);
    case 'siso':   return setNum(chatId,cfg,arg,'slots.max','Sĩ số tối đa',false);
    case 'ngoaihethong': return setNum(chatId,cfg,arg,'slots.base','HV ngoài hệ thống',false);
    case 'sotuan': return setNum(chatId,cfg,arg,'schedule.weeks','Số tuần',false);
    case 'sobuoi': return setNum(chatId,cfg,arg,'schedule.sessions','Số buổi live',false);
    case 'sokhoa': return setNum(chatId,cfg,arg,'stats.cohortsDone','Số khóa đã dạy',false);

    case 'hocvien':
      if(!arg) return tgSend(chatId,'Đang hiện: *'+cfg.stats.students+'*\nĐổi: `/hocvien 30+`');
      cfg.stats.students=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Số học viên hiển thị: *'+arg+'*');

    case 'khaigiang':
      if(!arg) return tgSend(chatId,'Đang là: *'+cfg.cohort.startDate+'*\nĐổi: `/khaigiang 05/09/2026`');
      cfg.cohort.startDate=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Ngày khai giảng: *'+arg+'*');

    case 'lichhoc': {
      if(!arg || arg.indexOf('|')<0)
        return tgSend(chatId,'Đang là: *'+cfg.schedule.days+' · '+cfg.schedule.time+
          '*\nĐổi: `/lichhoc Tối Thứ 5 | 20:00–22:00`');
      var parts=arg.split('|');
      cfg.schedule.days=parts[0].trim();
      cfg.schedule.time=parts[1].trim();
      saveConfig(cfg);
      return tgSend(chatId,'✅ Lịch học: *'+cfg.schedule.days+' · '+cfg.schedule.time+'*');
    }

    case 'zalo':
      if(!arg) return tgSend(chatId,'Đang là: '+(cfg.zalo.groupUrl||'(chưa đặt)')+
        '\nĐổi: `/zalo https://zalo.me/g/...`\nXóa: `/zalo xoa`');
      cfg.zalo.groupUrl = (arg.toLowerCase()==='xoa') ? '' : arg;
      saveConfig(cfg);
      return tgSend(chatId, cfg.zalo.groupUrl
        ? '✅ Link Zalo đã cập nhật — học viên điền form xong sẽ thấy nút tham gia.'
        : '✅ Đã xóa link Zalo — nút tham gia sẽ ẩn.');

    case 'tiktok':
      if(!arg) return tgSend(chatId,'Đang là: '+(cfg.contact.tiktokUrl||'(chưa đặt)')+
        '\nĐổi: `/tiktok https://www.tiktok.com/@tenkenh`');
      cfg.contact.tiktokUrl=arg; saveConfig(cfg);
      return tgSend(chatId,'✅ Link TikTok đã cập nhật.');

    case 'thongbao':
      if(!arg) return tgSend(chatId, cfg.announcement.show
        ? 'Banner đang BẬT: "'+cfg.announcement.text+'"\nĐổi: `/thongbao nội dung mới`\nTắt: /tatthongbao'
        : 'Banner đang tắt.\nBật: `/thongbao Lớp 03 khai giảng 05/09!`');
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
        lines.push((i+1)+'. '+st+' *'+r.name+'* — `'+r.phone+'`\n    `'+r.id+'` · '+
                   (r.stage||'')+(r.topic?' · '+r.topic:''));
      });
      return tgSend(chatId,lines.join('\n'));
    }

    case 'duyet':  return setStatus(chatId,arg,'approved','✅ Đã duyệt');
    case 'tuchoi': return setStatus(chatId,arg,'rejected','❌ Đã từ chối');

    case 'sheet': return tgSend(chatId,'📄 '+ss().getUrl());
    case 'id':    return tgSend(chatId,'Chat ID: `'+chatId+'`');

    default:
      tgSend(chatId,'Không hiểu lệnh /'+cmd+' — gõ /menu để xem danh sách.');
  }
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

function setNum(chatId,cfg,arg,path,label,isMoney){
  if(!String(arg).trim()){
    var cur=getPath(cfg,path);
    return tgSend(chatId,label+' đang là *'+(isMoney?money(cur):cur)+'*\n'+
      'Đổi bằng cách gõ lệnh kèm số'+(isMoney?' (gõ tắt `2tr` `500k` cũng được)':'')+'.');
  }
  var n = isMoney ? docTien(arg) : parseInt(String(arg).replace(/\D/g,''),10);
  if(isNaN(n)||n<0) return tgSend(chatId,'Không đọc được giá trị `'+arg+'`.');
  setPath(cfg,path,n); saveConfig(cfg);
  tgSend(chatId,'✅ '+label+' = *'+(isMoney?money(n):n)+'*\n\nWeb sẽ cập nhật trong ~1 phút.');
}

function setStatus(chatId,id,status,prefix){
  if(!id){
    tgSend(chatId,'Cần kèm mã đăng ký, VD `/duyet TMXK...` — gõ /danhsach để xem mã.');
    return;
  }
  var hit=null;
  allRegs().forEach(function(r){ if(r.id.toLowerCase()===id.toLowerCase()) hit=r; });
  if(!hit) return tgSend(chatId,'Không tìm thấy mã `'+id+'`. Gõ /danhsach để xem mã.');
  sheet().getRange(hit.row, HEADERS.indexOf('status')+1).setValue(status);
  tgSend(chatId,prefix+' *'+hit.name+'* ('+hit.phone+').');
}

/* ═══════════════ CÀI ĐẶT — chạy tay trong editor ═══════════════ */

/**
 * setup — CHẠY MỘT LẦN sau khi điền SETUP và deploy.
 * Tự làm hết: tạo sheet, kiểm tra token, nạp menu lệnh, tự thử /exec
 * rồi mới nối webhook (kèm drop_pending_updates để xả sạch hàng chờ cũ
 * — chính hàng chờ này gây spam liên tục). Chạy lại nhiều lần vẫn an toàn.
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
    {command:'zalo',       description:'💬 Link group Zalo'},
    {command:'thongbao',   description:'📢 Bật banner thông báo'},
    {command:'tatthongbao',description:'🔕 Tắt banner'},
    {command:'mo',         description:'🟢 Mở đăng ký'},
    {command:'du',         description:'🟡 Báo đủ chỗ'},
    {command:'dong',       description:'🔴 Đóng đăng ký'},
    {command:'duyet',      description:'✅ Duyệt — /duyet TMXK...'},
    {command:'tuchoi',     description:'❌ Từ chối — /tuchoi TMXK...'},
    {command:'sheet',      description:'📄 Link Google Sheet'},
    {command:'menu',       description:'⚙️ Danh sách đầy đủ lệnh'}
  ]});
  out.push(cmds && cmds.ok
    ? '✔ Đã nạp menu lệnh — nút Menu xanh hiện cạnh ô chat'
    : '• Không nạp được menu lệnh (gõ tay vẫn chạy bình thường)');

  // Chỉ nối webhook khi tự thử thấy /exec dùng được — nối bừa thì Telegram
  // nhận 302 rồi gửi lại update mãi (chính là vụ spam không ngừng).
  if (webhookDungDuoc()){
    var hook = tgApi('setWebhook',{
      url: String(cfgProp('EXEC_URL')).trim(),
      allowed_updates: ['message'],
      drop_pending_updates: true        // xả sạch hàng chờ cũ — hết spam ngay
    });
    if (hook && hook.ok){
      out.push('✔ Đã nối webhook (đã xả hàng chờ cũ) — bot trả lời tức thì');
      out.push('  Bot có nhắn điên loạn lần nữa → chạy hàm  dungBot');
    } else {
      out.push('✘ Không nối được webhook: '+JSON.stringify(hook));
    }
  } else {
    out.push('✘ /exec chưa trả về nội dung hợp lệ → KHÔNG nối webhook.');
    out.push('  Thường do: (1) chưa deploy New version sau khi dán code,');
    out.push('  (2) Who has access chưa để "Anyone".');
    out.push('  Sửa xong deploy lại rồi chạy setup lần nữa.');
  }

  out.push('');
  out.push('Xong. Vào Telegram nhắn /menu cho bot để kiểm tra.');
  Logger.log(out.join('\n'));
  tgSend(cfgProp('ADMIN_CHAT_IDS').split(',')[0].trim(),
    '✅ *Backend Tự Mình Xây Kênh đã sẵn sàng*\n\nBot: @'+me.result.username+
    '\n\nGõ /menu để xem danh sách lệnh.');
}

/**
 * DỪNG KHẨN CẤP — bot đang nhắn liên tục thì chọn hàm này bấm Run.
 * Ngắt webhook + xóa sạch hàng chờ, bot im ngay lập tức.
 * Sửa xong chạy lại  setup  để nối lại.
 */
function dungBot(){
  var r = tgApi('deleteWebhook',{drop_pending_updates:true});
  Logger.log(r && r.ok
    ? '✔ Đã ngắt webhook và xóa hàng chờ. Bot im ngay lập tức.\n  Chạy lại setup khi muốn bật lại.'
    : '✘ Lỗi: '+JSON.stringify(r));
}

/**
 * Tự gọi /exec đúng kiểu Telegram gọi để xem webhook có dùng được không.
 * Apps Script LUÔN trả 302 sang script.googleusercontent.com — đó là đường
 * phục vụ nội dung bình thường, Telegram đi theo được. Hỏng thật là khi
 * chuyển hướng dẫn về trang đăng nhập Google (quyền truy cập đặt sai).
 */
function webhookDungDuoc(){
  var url = String(cfgProp('EXEC_URL')).trim();
  if (url.slice(-5) !== '/exec') return false;
  try{
    var res = UrlFetchApp.fetch(url,{
      method:'post', contentType:'application/json',
      payload: JSON.stringify({ping:true}),
      followRedirects:false, muteHttpExceptions:true
    });
    if (res.getResponseCode() === 200) return true;
    var h = res.getAllHeaders();
    var loc = String(h.Location || h.location || '');
    return loc.indexOf('script.googleusercontent.com/macros/echo') > -1;
  }catch(err){ return false; }
}

/** Chẩn đoán khi bot im hoặc lỗi — chạy rồi đọc Execution log. */
function kiemTra(){
  var out = [];
  var me = tgApi('getMe',{});
  out.push('Bot: '+(me && me.ok ? '@'+me.result.username : '✘ token sai hoặc mạng lỗi'));
  var wh = tgApi('getWebhookInfo',{});
  if (wh && wh.ok){
    var w = wh.result;
    out.push('Webhook: '+(w.url||'(chưa nối)'));
    if (w.pending_update_count) out.push('Tin đang chờ: '+w.pending_update_count);
    if (w.last_error_message)
      out.push('Lỗi gần nhất: '+w.last_error_message+' lúc '+new Date(w.last_error_date*1000));
  }
  out.push('/exec tự thử: '+(webhookDungDuoc() ? '✔ dùng được' : '✘ chưa dùng được'));
  out.push('Đăng ký trong sheet: '+allRegs().length+' dòng');
  out.push('ADMIN_KEY: '+cfgProp('ADMIN_KEY'));
  Logger.log(out.join('\n'));
}
