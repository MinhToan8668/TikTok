/**
 * ═══════════════════════════════════════════════════════════════
 *  BOT EDITOR — chốt kịch bản, hạn draft, góp ý, nhắc lịch
 * ═══════════════════════════════════════════════════════════════
 *  Project Apps Script RIÊNG (không dán chung với apps-script/ của khóa
 *  học). Gồm 2 file: Luat.gs (quy tắc, hàm thuần) + Bot.gs (file này).
 *
 *  Luồng một video:
 *    /moi  → gửi kịch bản → CẢ HAI bấm "Đồng ý chốt"
 *          → đồng hồ draft bắt đầu chạy (mặc định 48h, đổi bằng /caidat)
 *    /nop  → khách bấm Duyệt hoặc Cần sửa (góp ý theo mẫu)
 *          → mỗi lần sửa được đếm, vượt số vòng miễn phí thì bot báo
 *  Mọi bước ghi vào tab NhatKy, không sửa không xóa — khi có hiểu lầm
 *  thì gõ /xem <mã> để cả hai cùng nhìn lại dòng thời gian.
 *
 *  Cài đặt: xem bot-editor/HUONG-DAN.md
 * ═══════════════════════════════════════════════════════════════
 */

/* Bí mật chỉ đặt trong Script Properties, không ghi vào đây:
   BOT_TOKEN · EDITOR_IDS · KHACH_IDS · GROUP_ID · GEMINI_API_KEY (tuỳ chọn) */
function cfgProp(name){
  return PropertiesService.getScriptProperties().getProperty(name) || '';
}
function props(){ return PropertiesService.getScriptProperties(); }

var VIDEO_HEADERS = ['ma','ten','trangThai','taoLuc','taoBoi','kbPhienBan','chotLuc','hanDraft',
  'nopDauLuc','dungHanDraft','soLanNop','nopLuc','linkDraft','hanGopY','soLanSua','hanSua',
  'duyetLuc','duyetKieu','daNhac'];
var KB_HEADERS = ['ma','phienBan','noiDung','guiBoi','guiLuc','editorChot','khachChot','chotLuc'];
var NK_HEADERS = ['luc','gio','ma','nguoi','vaiTro','suKien','chiTiet'];

var HOI_TRAN_GIAY = 40;     // mỗi lượt chạy bám Telegram tối đa chừng này giây
var KIEM_HAN_PHUT = 10;     // bao lâu rà hạn một lần
var MAU_GOP_Y = 'giây – vấn đề – mong muốn\nVD: 0:05 – chữ hook nhỏ – to gấp đôi';

/* ═══════════════ SHEET ═══════════════ */
function ss(){
  var id = cfgProp('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var moi = SpreadsheetApp.create('Bot Editor — chốt kịch bản & lịch draft');
  props().setProperty('SHEET_ID', moi.getId());
  return moi;
}

function bang(ten, headers){
  var file = ss();
  var sh = file.getSheetByName(ten);
  if (!sh){
    sh = file.insertSheet(ten);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.getRange('A:Z').setNumberFormat('@');   // giữ nguyên chữ, Sheet không tự đổi kiểu
    sh.setFrozenRows(1);
  }
  return sh;
}

function docBang(ten, headers){
  var sh = bang(ten, headers);
  var n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, headers.length).getValues().map(function(r, i){
    var o = {_row: i + 2};
    headers.forEach(function(h, j){ o[h] = r[j]; });
    return o;
  });
}

function themDong(ten, headers, obj){
  bang(ten, headers).appendRow(headers.map(function(h){
    return obj[h] === undefined || obj[h] === null ? '' : String(obj[h]);
  }));
}

function ghiDong(ten, headers, obj){
  bang(ten, headers).getRange(obj._row, 1, 1, headers.length).setValues([headers.map(function(h){
    return obj[h] === undefined || obj[h] === null ? '' : String(obj[h]);
  })]);
}

function dsVideo(){ return docBang('Video', VIDEO_HEADERS); }
function timVideo(ma){
  var m = String(ma || '').trim().toUpperCase();
  if (/^\d+$/.test(m)) m = 'V' + ('00' + m).slice(-3);   // gõ /nop 3 cũng hiểu là V003
  return dsVideo().filter(function(v){ return String(v.ma).toUpperCase() === m; })[0] || null;
}
function kbMoiNhat(ma){
  var ds = docBang('KichBan', KB_HEADERS).filter(function(k){ return k.ma === ma; });
  return ds.length ? ds[ds.length - 1] : null;
}
function kbDaChot(ma){
  var ds = docBang('KichBan', KB_HEADERS).filter(function(k){ return k.ma === ma && k.chotLuc; });
  return ds.length ? ds[ds.length - 1] : null;
}

function ghiNhatKy(ma, nguoi, suKien, chiTiet){
  try{
    var luc = Date.now();
    themDong('NhatKy', NK_HEADERS, {luc:luc, gio:gioVN(luc), ma:ma || '—',
      nguoi:nguoi ? nguoi.ten : 'bot', vaiTro:nguoi ? nguoi.vaiTro : 'bot',
      suKien:suKien, chiTiet:chiTiet || ''});
  }catch(err){ ghiLoi('ghiNhatKy', err); }
}

function ghiLoi(cho, err){
  try{ Logger.log(cho + ': ' + err); }catch(e){}
  try{ themDong('Loi', ['gio','cho','loi'], {gio:gioVN(Date.now()), cho:cho, loi:String(err && err.stack || err)}); }catch(e){}
}

function layCaiDat(){ return docCaiDat(props().getProperty('CAI_DAT')); }

/* ═══════════════ TELEGRAM ═══════════════ */
function tgApi(method, payload){
  var token = cfgProp('BOT_TOKEN');
  if (!token) return null;
  try{
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
      method:'post', contentType:'application/json',
      payload:JSON.stringify(payload), muteHttpExceptions:true
    });
    return JSON.parse(res.getContentText());
  }catch(err){ return null; }
}

/* Markdown lệch (kịch bản có dấu _ * …) thì gửi lại dạng chữ thường */
function tgSend(chatId, text, markup){
  if (!chatId) return null;
  var p = {chat_id:chatId, text:String(text).slice(0, 4000), parse_mode:'Markdown',
           disable_web_page_preview:true};
  if (markup) p.reply_markup = markup;
  var r = tgApi('sendMessage', p);
  if (r && r.ok === false){
    delete p.parse_mode;
    p.text = p.text.replace(/[`*_]/g, '');
    r = tgApi('sendMessage', p);
  }
  return r;
}
function nutBam(hang){ return {inline_keyboard:hang}; }
function tgAnswer(cbId, text, canhBao){
  tgApi('answerCallbackQuery', {callback_query_id:cbId, text:text || '', show_alert:!!canhBao});
}

/* Nơi bot báo tin chung: group làm việc; chưa có group thì nhắn riêng cả hai */
function baoChung(text, markup){
  var g = cfgProp('GROUP_ID');
  if (g) return tgSend(g, text, markup);
  dsId('EDITOR_IDS').concat(dsId('KHACH_IDS')).forEach(function(id){ tgSend(id, text, markup); });
}

/* ═══ VAI TRÒ — nhận diện theo user id, không theo tên hiển thị ═══ */
function dsId(key){
  return cfgProp(key).split(',').map(function(s){ return s.trim(); }).filter(String);
}
function vaiTro(userId){
  if (dsId('EDITOR_IDS').indexOf(String(userId)) > -1) return 'editor';
  if (dsId('KHACH_IDS').indexOf(String(userId)) > -1) return 'khach';
  return '';
}
function nguoiTu(from){
  return {id:from.id, ten:[from.first_name, from.last_name].filter(Boolean).join(' ') || ('#' + from.id),
          vaiTro:vaiTro(from.id)};
}
function chatHopLe(chatId, nguoi){
  var g = cfgProp('GROUP_ID');
  if (g && String(chatId) === g) return true;
  return String(chatId) === String(nguoi.id) && !!nguoi.vaiTro;   // chat riêng của editor/khách
}

/* ═══ CÂU HỎI ĐANG CHỜ — bấm lệnh trơn thì bot hỏi, người đó trả lời tin của bot ═══ */
function datCho(chatId, userId, viec){
  try{ CacheService.getScriptCache().put('cho_' + chatId + '_' + userId, JSON.stringify(viec), 3600); }catch(e){}
}
function layCho(chatId, userId){
  try{
    var c = CacheService.getScriptCache(), k = 'cho_' + chatId + '_' + userId;
    var v = c.get(k);
    if (v) c.remove(k);
    return v ? JSON.parse(v) : null;
  }catch(e){ return null; }
}
/* force_reply: trong group bật privacy, bot chỉ đọc được tin trả lời chính nó */
function hoi(chatId, nguoi, viec, cauHoi, goiY){
  datCho(chatId, nguoi.id, viec);
  tgSend(chatId, '[' + nguoi.ten.replace(/[\[\]]/g, '') + '](tg://user?id=' + nguoi.id + ') ' + cauHoi +
    '\n\n_Trả lời ngay tin này. Đổi ý thì /huy._',
    {force_reply:true, selective:true, input_field_placeholder:goiY || ''});
}

/* ═══════════════ NHẬN TIN ═══════════════ */
function xuLyUpdate(u){
  if (u.callback_query) return xuLyNut(u.callback_query);
  var msg = u.message;
  if (!msg || !msg.text || !msg.from) return;
  var chatId = msg.chat.id, text = msg.text.trim();
  var nguoi = nguoiTu(msg.from);

  var m = text.match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/);
  if (m && m[1].toLowerCase() === 'id'){
    return tgSend(chatId, 'Chat ID: `' + chatId + '`\nUser ID của bạn: `' + nguoi.id + '`\n' +
      'Vai trò: ' + (nguoi.vaiTro || 'chưa được thêm'));
  }
  if (!chatHopLe(chatId, nguoi)){
    if (m) tgSend(chatId, '⛔ Bot này chỉ làm việc trong group đã cài. Gõ /id để lấy mã gửi cho editor.');
    return;
  }

  var cmd, arg;
  if (m){
    cmd = m[1].toLowerCase(); arg = (m[2] || '').trim();
    layCho(chatId, nguoi.id);   // gõ lệnh mới thì bỏ câu hỏi cũ
  } else {
    var cho = layCho(chatId, nguoi.id);
    if (!cho){                   // chuyện riêng trong group, bot không chen vào
      if (String(chatId) === String(nguoi.id)) tgSend(chatId, 'Gõ /menu để xem danh sách lệnh nhé.');
      return;
    }
    cmd = cho.cmd; arg = (cho.ma ? cho.ma + ' ' : '') + text;
  }
  if (!nguoi.vaiTro) return tgSend(chatId, '⛔ Bạn chưa có vai trò. Gõ /id rồi gửi User ID cho editor thêm vào.');
  return chayLenh(cmd, arg, chatId, nguoi);
}

function chayLenh(cmd, arg, chatId, nguoi){
  switch(cmd){
    case 'start': case 'menu': case 'help': return lenhMenu(chatId);
    case 'huy':     return tgSend(chatId, '👌 Đã hủy.');
    case 'moi':     return lenhMoi(arg, chatId, nguoi);
    case 'kichban': case 'kb': return lenhKichBan(arg, chatId, nguoi);
    case 'nop':     return lenhNop(arg, chatId, nguoi);
    case 'sua':     return lenhSua(arg, chatId, nguoi);
    case 'duyet':   return lenhDuyet(arg, chatId, nguoi);
    case 'ds':      return lenhDs(chatId);
    case 'xem':     return lenhXem(arg, chatId);
    case 'tuan':    return tgSend(chatId, baoCaoTuan(Date.now()));
    case 'caidat':  return lenhCaiDat(arg, chatId, nguoi);
  }
  tgSend(chatId, 'Chưa hiểu lệnh này. Gõ /menu để xem danh sách.');
}

/* Tách "V001 phần còn lại" — thiếu mã mà chỉ có 1 video đang mở thì tự hiểu */
function tachMa(arg, locTrangThai){
  // Mã phải có chữ V (V003), hoặc là số đứng một mình — tránh hiểu "3 bước…" là V003
  var m = String(arg || '').match(/^\s*(V\d{1,4}|\d{1,4}(?=\s*$))\b\s*([\s\S]*)$/i);
  if (m) return {video:timVideo(m[1]), con:m[2].trim(), coMa:true};
  var mo = dsVideo().filter(function(v){ return locTrangThai.indexOf(v.trangThai) > -1; });
  return {video:mo.length === 1 ? mo[0] : null, con:String(arg || '').trim(), coMa:false, nhieu:mo.length > 1};
}

/* ═══════════════ LỆNH ═══════════════ */
function lenhMenu(chatId){
  var c = layCaiDat();
  tgSend(chatId, [
    '🎬 *Bot Editor — chốt rõ, làm đúng, khỏi hiểu lầm*', '',
    '*Một video đi qua 4 bước*',
    '1️⃣ /moi `Tên video` — tạo video, bot xin kịch bản',
    '2️⃣ Cả hai bấm *Đồng ý chốt* → đồng hồ ' + c.gioDraft + 'h có draft bắt đầu chạy',
    '3️⃣ /nop `V001 link` — editor nộp draft',
    '4️⃣ Khách bấm *Duyệt* hoặc *Cần sửa* (góp ý theo mẫu)', '',
    '*Lệnh khác*',
    '📝 /kichban `V001` — gửi bản kịch bản mới (phải chốt lại)',
    '✏️ /sua `V001` — khách gửi góp ý',
    '✅ /duyet `V001` — khách duyệt',
    '📋 /ds — video đang làm và hạn',
    '🔎 /xem `V001` — toàn bộ dòng thời gian của video',
    '📊 /tuan — báo cáo tuần này',
    '⚙️ /caidat — xem/đổi số video, số giờ, số vòng sửa',
    '🆔 /id — lấy mã chat'
  ].join('\n'));
}

function lenhMoi(arg, chatId, nguoi){
  if (!arg) return hoi(chatId, nguoi, {cmd:'moi'}, 'tên video là gì?', 'VD: 3 lỗi khi mở shop online');
  var ma = maKeTiep(dsVideo());
  var luc = Date.now();
  themDong('Video', VIDEO_HEADERS, {ma:ma, ten:arg.slice(0, 120), trangThai:'kich_ban', taoLuc:luc,
    taoBoi:nguoi.ten, kbPhienBan:0, soLanNop:0, soLanSua:0});
  ghiNhatKy(ma, nguoi, 'tao_video', arg);
  hoi(chatId, nguoi, {cmd:'kichban', ma:ma},
    'đã tạo *' + ma + '* · ' + arg + '.\nGửi kịch bản (hook, nội dung, CTA, link video mẫu nếu có):',
    'Dán kịch bản vào đây');
}

function lenhKichBan(arg, chatId, nguoi){
  var t = tachMa(arg, ['kich_ban', 'dang_edit', 'cho_duyet', 'dang_sua']);
  var v = t.video;
  if (!v) return tgSend(chatId, t.nhieu ? 'Ghi rõ mã video, VD `/kichban V002`. Xem mã bằng /ds.'
                                        : 'Không thấy video. Tạo bằng /moi hoặc xem mã bằng /ds.');
  if (v.trangThai === 'hoan_thanh') return tgSend(chatId, '*' + v.ma + '* đã hoàn thành. Làm tiếp thì tạo video mới bằng /moi.');
  if (!t.con) return hoi(chatId, nguoi, {cmd:'kichban', ma:v.ma}, 'gửi kịch bản cho *' + v.ma + '*:', 'Dán kịch bản vào đây');

  var luc = Date.now();
  var daChot = v.trangThai !== 'kich_ban';
  var phienBan = Number(v.kbPhienBan || 0) + 1;
  themDong('KichBan', KB_HEADERS, {ma:v.ma, phienBan:phienBan, noiDung:t.con, guiBoi:nguoi.ten + ' (' + nguoi.vaiTro + ')', guiLuc:luc});
  v.kbPhienBan = phienBan;
  var canhBao = '';
  if (daChot){
    // Đổi kịch bản sau khi đã chốt: hạn cũ hết hiệu lực, chờ chốt lại
    canhBao = '\n\n⚠️ Kịch bản đã chốt lúc ' + gioVN(v.chotLuc) + ' được thay bằng bản ' + phienBan +
      '. Hạn draft cũ hủy, tính lại từ lúc cả hai chốt bản mới.';
    ghiNhatKy(v.ma, nguoi, 'doi_kb_sau_chot', 'bản ' + phienBan + ', trạng thái trước: ' + v.trangThai);
    v.trangThai = 'kich_ban'; v.hanDraft = ''; v.hanGopY = ''; v.hanSua = ''; v.daNhac = '';
  } else {
    ghiNhatKy(v.ma, nguoi, 'gui_kb', 'bản ' + phienBan);
  }
  ghiDong('Video', VIDEO_HEADERS, v);
  guiKichBanChoChot(v, phienBan, t.con, canhBao);
}

function guiKichBanChoChot(v, phienBan, noiDung, canhBao){
  var c = layCaiDat();
  baoChung('📝 *Kịch bản ' + v.ma + ' · bản ' + phienBan + '* — ' + v.ten + '\n\n' + noiDung + (canhBao || '') +
    '\n\n━━━━━━━━━━\nEditor và khách *mỗi người bấm một lần*. Đủ hai người thì kịch bản bị khóa và editor có ' +
    c.gioDraft + ' giờ để ra draft. Muốn đổi gì thì gửi bản mới bằng /kichban ' + v.ma + ' trước khi bấm.',
    nutBam([[{text:'✅ Đồng ý chốt bản ' + phienBan, callback_data:'c|' + v.ma + '|' + phienBan}]]));
}

function lenhNop(arg, chatId, nguoi){
  if (nguoi.vaiTro !== 'editor') return tgSend(chatId, 'Chỉ editor nộp draft.');
  var t = tachMa(arg, ['dang_edit', 'dang_sua']);
  var v = t.video;
  if (!v) return tgSend(chatId, t.nhieu ? 'Ghi rõ mã video, VD `/nop V002 link`.' : 'Không có video nào đang chờ nộp. Xem /ds.');
  if (v.trangThai !== 'dang_edit' && v.trangThai !== 'dang_sua')
    return tgSend(chatId, '*' + v.ma + '* đang ở bước ' + TRANG_THAI[v.trangThai] + ', chưa nộp được.' +
      (v.trangThai === 'kich_ban' ? ' Kịch bản cần cả hai chốt trước.' : ''));
  if (!t.con) return hoi(chatId, nguoi, {cmd:'nop', ma:v.ma}, 'gửi link draft *' + v.ma + '*:', 'Link Drive / CapCut / TikTok');

  var c = layCaiDat(), luc = Date.now();
  var laDraftDau = v.trangThai === 'dang_edit';
  var han = laDraftDau ? Number(v.hanDraft) : Number(v.hanSua);
  var dung = luc <= han;
  if (laDraftDau){ v.nopDauLuc = luc; v.dungHanDraft = dung ? 1 : 0; }
  v.soLanNop = Number(v.soLanNop || 0) + 1;
  v.nopLuc = luc; v.linkDraft = t.con;
  v.trangThai = 'cho_duyet'; v.hanGopY = congGio(luc, c.gioGopY); v.daNhac = '';
  ghiDong('Video', VIDEO_HEADERS, v);
  ghiNhatKy(v.ma, nguoi, laDraftDau ? 'nop_draft' : 'nop_ban_sua',
    (dung ? 'đúng hạn' : 'trễ hạn') + ' (' + conLai(han, luc) + ') · ' + t.con);

  baoChung('🎞 *' + v.ma + ' · ' + (laDraftDau ? 'Draft' : 'Bản sửa lần ' + v.soLanSua) + '* — ' + v.ten + '\n' +
    t.con + '\n\n' + (dung ? '🟢 Nộp đúng hạn' : '🔴 Nộp trễ — ' + conLai(han, luc)) + '\n' +
    '⏳ Khách xem và phản hồi trước *' + gioVN(v.hanGopY) + '*' +
    (c.tuDuyet ? ' — quá hạn mà chưa phản hồi thì bot coi như đã duyệt.' : '.') +
    '\nGóp ý theo mẫu: _' + MAU_GOP_Y.split('\n')[0] + '_ để editor sửa đúng chỗ.',
    nutBam([[{text:'✅ Duyệt', callback_data:'d|' + v.ma}, {text:'✏️ Cần sửa', callback_data:'s|' + v.ma}]]));
}

function lenhSua(arg, chatId, nguoi){
  if (nguoi.vaiTro !== 'khach') return tgSend(chatId, 'Góp ý sửa do khách gửi. Editor muốn ghi chú thì nhắn bình thường trong group.');
  var t = tachMa(arg, ['cho_duyet']);
  var v = t.video;
  if (!v) return tgSend(chatId, t.nhieu ? 'Ghi rõ mã video, VD `/sua V002`.' : 'Chưa có video nào chờ xem. Xem /ds.');
  if (v.trangThai !== 'cho_duyet') return tgSend(chatId, '*' + v.ma + '* đang ' + TRANG_THAI[v.trangThai] + ', chưa có bản để góp ý.');
  if (!t.con) return hoi(chatId, nguoi, {cmd:'sua', ma:v.ma},
    'góp ý cho *' + v.ma + '*, mỗi ý một dòng theo mẫu:\n`' + MAU_GOP_Y + '`', '0:05 – chữ nhỏ – to gấp đôi');

  var c = layCaiDat(), luc = Date.now();
  v.soLanSua = Number(v.soLanSua || 0) + 1;
  v.trangThai = 'dang_sua'; v.hanSua = congGio(luc, c.gioSua); v.daNhac = '';
  ghiDong('Video', VIDEO_HEADERS, v);
  ghiNhatKy(v.ma, nguoi, 'gop_y', 'lần ' + v.soLanSua + ': ' + t.con);

  var vuot = vuotLuotSua(v.soLanSua, c);
  var kb = kbDaChot(v.ma);
  var ai = kb ? doiChieuAI(kb.noiDung, t.con) : '';
  baoChung('✏️ *Góp ý ' + v.ma + ' · lần ' + v.soLanSua + '/' + c.luotSua + ' miễn phí*\n\n' + t.con +
    (ai ? '\n\n🤖 *Đối chiếu với kịch bản đã chốt* (AI gợi ý, hai bên tự quyết):\n' + ai : '') +
    (vuot ? '\n\n⚠️ Đã quá ' + c.luotSua + ' vòng sửa miễn phí. Hai bên thống nhất thêm thời gian hoặc chi phí cho vòng này.' : '') +
    '\n\n⏳ Editor nộp bản sửa trước *' + gioVN(v.hanSua) + '*.');
}

function lenhDuyet(arg, chatId, nguoi){
  if (nguoi.vaiTro !== 'khach') return tgSend(chatId, 'Chỉ khách duyệt video.');
  var t = tachMa(arg, ['cho_duyet']);
  if (!t.video) return tgSend(chatId, t.nhieu ? 'Ghi rõ mã video, VD `/duyet V002`.' : 'Chưa có video nào chờ duyệt.');
  duyetVideo(t.video, nguoi, 'khach');
}

function duyetVideo(v, nguoi, kieu){
  if (v.trangThai !== 'cho_duyet') return false;
  var luc = Date.now();
  v.trangThai = 'hoan_thanh'; v.duyetLuc = luc; v.duyetKieu = kieu; v.daNhac = '';
  ghiDong('Video', VIDEO_HEADERS, v);
  ghiNhatKy(v.ma, nguoi, kieu === 'khach' ? 'duyet' : 'tu_duyet', 'sau ' + v.soLanSua + ' vòng sửa');
  baoChung(kieu === 'khach'
    ? '✅ *' + v.ma + '* · ' + v.ten + ' — khách đã duyệt. Cảm ơn hai bên! 🎉'
    : '✅ *' + v.ma + '* · ' + v.ten + ' — hết hạn góp ý mà chưa có phản hồi, bot ghi nhận *đã duyệt* theo thỏa thuận.');
  return true;
}

function lenhDs(chatId){
  var now = Date.now(), tu = dauTuan(now);
  var ds = dsVideo();
  var dang = ds.filter(function(v){ return v.trangThai !== 'hoan_thanh'; });
  var xong = ds.filter(function(v){ return v.trangThai === 'hoan_thanh' && Number(v.duyetLuc) >= tu; });
  if (!dang.length && !xong.length) return tgSend(chatId, 'Chưa có video nào. Tạo bằng /moi `Tên video`.');
  tgSend(chatId, '📋 *Video đang làm*\n' + (dang.length ? dang.map(function(v){ return dongVideo(v, now); }).join('\n') : '_không có_') +
    (xong.length ? '\n\n✅ *Xong tuần này*\n' + xong.map(function(v){ return v.ma + ' · ' + v.ten; }).join('\n') : ''));
}

function lenhXem(arg, chatId){
  var v = timVideo(String(arg || '').split(/\s+/)[0]);
  if (!v) return tgSend(chatId, 'Gõ kèm mã, VD `/xem V001`. Xem mã bằng /ds.');
  var nk = docBang('NhatKy', NK_HEADERS).filter(function(n){ return n.ma === v.ma; });
  var kb = kbDaChot(v.ma) || kbMoiNhat(v.ma);
  var TEN = {tao_video:'Tạo video', gui_kb:'Gửi kịch bản', chot_kb:'Bấm chốt', kb_khoa:'🔒 Kịch bản khóa',
    doi_kb_sau_chot:'⚠️ Đổi kịch bản sau chốt', nop_draft:'Nộp draft', nop_ban_sua:'Nộp bản sửa',
    gop_y:'Góp ý', duyet:'✅ Duyệt', tu_duyet:'✅ Tự duyệt', nhac:'🔔 Nhắc'};
  tgSend(chatId, '🔎 ' + dongVideo(v, Date.now()) + '\n' +
    (kb ? '\n📝 *Kịch bản ' + (kb.chotLuc ? 'đã chốt' : 'chưa chốt') + ' · bản ' + kb.phienBan + '*\n' +
          String(kb.noiDung).slice(0, 1500) + '\n' : '') +
    '\n🕒 *Dòng thời gian*\n' + nk.map(function(n){
      return '`' + n.gio + '` ' + (TEN[n.suKien] || n.suKien) + ' — ' + n.nguoi +
        (n.chiTiet ? ': ' + String(n.chiTiet).slice(0, 200) : '');
    }).join('\n'));
}

function lenhCaiDat(arg, chatId, nguoi){
  var c = layCaiDat();
  if (!arg){
    return tgSend(chatId, '⚙️ *Thỏa thuận đang áp dụng*\n' + CAI_DAT_MO_TA.map(function(m){
      return '• ' + m.ten + ': *' + giaTriDep(m, c[m.khoa]) + '*  →  `/caidat ' + m.tat[0] + ' …`';
    }).join('\n') + '\n\nVD: `/caidat draft 72` · `/caidat video 3` · `/caidat tuduyet tat`' +
    '\n_Chỉ editor đổi được. Mỗi lần đổi bot báo vào group để khách cùng biết._');
  }
  if (nguoi.vaiTro !== 'editor') return tgSend(chatId, 'Chỉ editor đổi được cài đặt. Khách muốn đổi thì nhắn editor nhé.');
  var p = arg.split(/\s+/);
  var r = doiCaiDat(c, p[0], p.slice(1).join(' '));
  if (!r.ok){
    if (r.loi === 'khong_co_khoa') return tgSend(chatId, 'Không có mục `' + p[0] + '`. Gõ /caidat để xem tên các mục.');
    return tgSend(chatId, r.moTa.ten + ' nhận từ ' + r.moTa.min + ' đến ' + r.moTa.max +
      (r.moTa.khoa === 'tuDuyet' ? ' (hoặc bat/tat)' : '') + '. VD `/caidat ' + r.moTa.tat[0] + ' ' + CAI_DAT_MAC_DINH[r.moTa.khoa] + '`.');
  }
  props().setProperty('CAI_DAT', JSON.stringify(r.caiDat));
  ghiNhatKy('—', nguoi, 'doi_cai_dat', r.moTa.ten + ': ' + giaTriDep(r.moTa, r.cu) + ' → ' + giaTriDep(r.moTa, r.moi));
  baoChung('⚙️ ' + nguoi.ten + ' đổi *' + r.moTa.ten + '*: ' + giaTriDep(r.moTa, r.cu) + ' → *' + giaTriDep(r.moTa, r.moi) + '*' +
    (/^gio/.test(r.moTa.khoa) ? '\n_Áp dụng cho bước bắt đầu từ bây giờ. Video đang chạy giữ hạn cũ._' : ''));
}

/* ═══════════════ NÚT BẤM ═══════════════ */
function xuLyNut(cb){
  var chatId = cb.message && cb.message.chat.id;
  var nguoi = nguoiTu(cb.from);
  if (!chatHopLe(chatId, nguoi) || !nguoi.vaiTro) return tgAnswer(cb.id, 'Bạn chưa có vai trò trong bot này.', true);
  var p = String(cb.data || '').split('|');
  var v = timVideo(p[1]);
  if (!v) return tgAnswer(cb.id, 'Không thấy video ' + p[1]);

  if (p[0] === 'c') return bamChot(cb, v, Number(p[2]), nguoi);
  if (p[0] === 'd' || p[0] === 's'){
    if (nguoi.vaiTro !== 'khach') return tgAnswer(cb.id, 'Nút này dành cho khách.', true);
    if (v.trangThai !== 'cho_duyet') return tgAnswer(cb.id, v.ma + ' đang ' + TRANG_THAI[v.trangThai]);
    if (p[0] === 'd'){
      duyetVideo(v, nguoi, 'khach');
      tgApi('editMessageReplyMarkup', {chat_id:chatId, message_id:cb.message.message_id,
        reply_markup:nutBam([[{text:'✅ Đã duyệt', callback_data:'xong'}]])});
      return tgAnswer(cb.id, 'Đã duyệt ' + v.ma);
    }
    tgAnswer(cb.id);
    return hoi(chatId, nguoi, {cmd:'sua', ma:v.ma},
      'góp ý cho *' + v.ma + '*, mỗi ý một dòng theo mẫu:\n`' + MAU_GOP_Y + '`', '0:05 – chữ nhỏ – to gấp đôi');
  }
  tgAnswer(cb.id);
}

function bamChot(cb, v, phienBan, nguoi){
  var lock = LockService.getScriptLock();
  try{ lock.waitLock(10000); }catch(e){ return tgAnswer(cb.id, 'Đang bận, bấm lại sau vài giây nhé.'); }
  try{
    var kb = kbMoiNhat(v.ma);
    if (!kb || Number(kb.phienBan) !== phienBan) return tgAnswer(cb.id, 'Đã có kịch bản mới hơn (bản ' + (kb && kb.phienBan) + '). Bấm chốt ở tin của bản mới.', true);
    if (kb.chotLuc) return tgAnswer(cb.id, 'Bản này đã chốt rồi.');
    var cot = nguoi.vaiTro === 'editor' ? 'editorChot' : 'khachChot';
    if (kb[cot]) return tgAnswer(cb.id, 'Bạn đã bấm chốt rồi, đang chờ bên kia.');

    var luc = Date.now();
    kb[cot] = nguoi.ten + ' · ' + gioVN(luc);
    ghiNhatKy(v.ma, nguoi, 'chot_kb', 'bản ' + phienBan);
    var du = kb.editorChot && kb.khachChot;
    var c = layCaiDat();
    if (du){
      kb.chotLuc = luc;
      v.chotLuc = luc; v.hanDraft = congGio(luc, c.gioDraft);
      v.trangThai = 'dang_edit'; v.daNhac = '';
      ghiDong('Video', VIDEO_HEADERS, v);
      ghiNhatKy(v.ma, null, 'kb_khoa', 'bản ' + phienBan + ', hạn draft ' + gioVN(v.hanDraft) + ' (' + c.gioDraft + 'h)');
    }
    ghiDong('KichBan', KB_HEADERS, kb);

    var nhan = du ? '🔒 Đã chốt — ' + gioVN(luc)
      : (kb.editorChot ? '✅ Editor' : '⏳ Editor') + '  ·  ' + (kb.khachChot ? '✅ Khách' : '⏳ Khách');
    tgApi('editMessageReplyMarkup', {chat_id:cb.message.chat.id, message_id:cb.message.message_id,
      reply_markup:nutBam(du ? [[{text:nhan, callback_data:'xong'}]]
        : [[{text:nhan, callback_data:'c|' + v.ma + '|' + phienBan}]])});
    tgAnswer(cb.id, du ? 'Đã chốt!' : 'Đã ghi nhận, chờ bên kia bấm.');
    if (du) baoChung('🔒 *Kịch bản ' + v.ma + ' (bản ' + phienBan + ') đã chốt* lúc ' + gioVN(luc) + '\n' +
      '⏳ Hạn có draft: *' + gioVN(v.hanDraft) + '* (' + c.gioDraft + ' giờ).\n' +
      '_Từ giờ đổi nội dung là yêu cầu mới: gửi /kichban ' + v.ma + ', chốt lại, và hạn tính lại từ lúc chốt._');
  } finally {
    lock.releaseLock();
  }
}

/* ═══════════════ AI ĐỐI CHIẾU (tuỳ chọn) ═══════════════
   Có GEMINI_API_KEY thì mỗi góp ý được xếp loại so với kịch bản đã chốt.
   AI chỉ gợi ý — quyết định vẫn là hai người, bot ghi rõ điều đó. */
var AI_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

function doiChieuAI(kichBan, gopY){
  var key = cfgProp('GEMINI_API_KEY');
  if (!key) return '';
  var prompt = [
    'Bạn là người trung gian công bằng giữa editor video và khách hàng.',
    'Dưới đây là KỊCH BẢN ĐÃ CHỐT (cả hai đã bấm đồng ý) và GÓP Ý của khách về bản dựng.',
    'Với mỗi ý góp ý, xếp vào đúng một nhóm:',
    '🔴 Chưa đúng kịch bản đã chốt — editor sửa, không tính lượt',
    '🟡 Chỉnh theo gu, vẫn trong kịch bản — tính một vòng sửa',
    '⚪ Ngoài kịch bản đã chốt — yêu cầu mới, hai bên thống nhất thêm',
    '❓ Chưa rõ — viết lại thành một câu hỏi cụ thể để khách trả lời',
    'Mỗi ý một dòng: nhãn + tóm tắt ý ≤ 15 chữ + lý do ngắn dẫn đúng câu trong kịch bản nếu có.',
    'Giọng trung lập, không trách ai. Tối đa 8 dòng. Chỉ trả về các dòng đó.',
    '', 'KỊCH BẢN ĐÃ CHỐT:', String(kichBan).slice(0, 6000), '', 'GÓP Ý:', String(gopY).slice(0, 3000)
  ].join('\n');
  for (var i = 0; i < AI_MODELS.length; i++){
    try{
      var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + AI_MODELS[i] + ':generateContent', {
        method:'post', contentType:'application/json', muteHttpExceptions:true,
        headers:{'x-goog-api-key':key},
        payload:JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.2}})
      });
      if (res.getResponseCode() !== 200) continue;
      var j = JSON.parse(res.getContentText());
      var txt = (((j.candidates || [])[0] || {}).content || {}).parts;
      txt = (txt || []).map(function(x){ return x.text || ''; }).join('').trim();
      if (txt) return txt.slice(0, 1800);
    }catch(err){ ghiLoi('doiChieuAI ' + AI_MODELS[i], err); }
  }
  return '';
}

/* ═══════════════ NHẮC HẠN + BÁO CÁO TUẦN ═══════════════ */
function kiemTraHan(){
  var now = Date.now();
  var lan = Number(props().getProperty('LAN_KIEM_HAN') || 0);
  if (now - lan < KIEM_HAN_PHUT * 60000) return;
  props().setProperty('LAN_KIEM_HAN', String(now));

  var c = layCaiDat();
  dsVideo().forEach(function(v){
    canNhac(v, now, c).forEach(function(ma){
      v.daNhac = themCo(v.daNhac, ma);
      ghiDong('Video', VIDEO_HEADERS, v);   // ghi cờ trước: lỡ gửi lỗi cũng không nhắn đôi
      if (ma === 'gopy_het' && c.tuDuyet){ duyetVideo(v, null, 'tu_dong'); return; }
      var tin = {
        draft_sap:'🔔 *' + v.ma + '* — còn ' + conLai(v.hanDraft, now).replace('còn ', '') + ' tới hạn draft (' + gioVN(v.hanDraft) + '). Editor nhớ nộp bằng /nop ' + v.ma,
        draft_tre:'⏰ *' + v.ma + '* — đã quá hạn draft (' + gioVN(v.hanDraft) + '). Editor báo khách thời gian nộp mới nhé.',
        gopy_sap: '🔔 *' + v.ma + '* — khách còn ' + conLai(v.hanGopY, now).replace('còn ', '') + ' để phản hồi draft (hạn ' + gioVN(v.hanGopY) + ').',
        gopy_het: '⏰ *' + v.ma + '* — đã quá hạn góp ý (' + gioVN(v.hanGopY) + '). Khách bấm Duyệt hoặc Cần sửa giúp editor nhé.',
        sua_sap:  '🔔 *' + v.ma + '* — còn ' + conLai(v.hanSua, now).replace('còn ', '') + ' tới hạn nộp bản sửa (' + gioVN(v.hanSua) + ').',
        sua_tre:  '⏰ *' + v.ma + '* — đã quá hạn nộp bản sửa (' + gioVN(v.hanSua) + ').'
      }[ma];
      ghiNhatKy(v.ma, null, 'nhac', ma);
      baoChung(tin);
    });
  });

  // Thứ Hai 8h: kế hoạch tuần · Chủ nhật 20h: báo cáo
  var tg = thuGioVN(now), tuan = String(dauTuan(now));
  if (tg.thu === 1 && tg.gio >= 8 && props().getProperty('DA_GUI_KH') !== tuan){
    props().setProperty('DA_GUI_KH', tuan);
    var dang = dsVideo().filter(function(v){ return v.trangThai !== 'hoan_thanh'; });
    baoChung('📅 *Tuần mới — mục tiêu ' + c.soVideoTuan + ' video*\n' +
      (dang.length ? 'Đang dở:\n' + dang.map(function(v){ return dongVideo(v, now); }).join('\n') + '\n\n' : '') +
      'Chốt kịch bản sớm để editor đủ ' + c.gioDraft + ' giờ cho mỗi draft. Tạo video bằng /moi.');
  }
  if (tg.thu === 0 && tg.gio >= 20 && props().getProperty('DA_GUI_BC') !== tuan){
    props().setProperty('DA_GUI_BC', tuan);
    baoChung(baoCaoTuan(now));
  }
}

function baoCaoTuan(now){
  var c = layCaiDat();
  var tk = thongKeTuan(dsVideo(), now, c, docBang('NhatKy', NK_HEADERS));
  var tu = dauTuan(now);
  return '📊 *Tuần ' + gioVN(tu).slice(6) + ' – ' + gioVN(tu + 6 * 24 * GIO_MS).slice(6) + '*\n' +
    '• Mục tiêu: ' + tk.mucTieu + ' video\n' +
    '• Kịch bản đã chốt: ' + tk.daChot + '\n' +
    '• Draft đã nộp: ' + tk.daNop + ' (🟢 đúng hạn ' + tk.dungHan + ' · 🔴 trễ ' + tk.treHan + ')\n' +
    '• Hoàn thành: ' + tk.hoanThanh + '/' + tk.mucTieu +
    (tk.vuotSua ? '\n• Video quá vòng sửa miễn phí: ' + tk.vuotSua : '') +
    (tk.doiKB ? '\n• Lần đổi kịch bản sau khi chốt: ' + tk.doiKB : '') +
    (tk.daChot < tk.mucTieu ? '\n\n_Thiếu kịch bản đã chốt thì chưa thể có đủ video — chốt sớm giúp cả hai._' : '');
}

/* ═══════════════ VÒNG HỎI TELEGRAM (lịch chạy mỗi phút) ═══════════════
   Dùng getUpdates thay cho webhook như bot khóa học: Apps Script trả 302
   làm Telegram gửi lại mãi. Cờ cache chặn hai lượt chồng nhau. */
function hoiTelegram(){
  var cache = CacheService.getScriptCache();
  try{ if (cache.get('dang_hoi')) return; cache.put('dang_hoi', '1', HOI_TRAN_GIAY + 30); }catch(e){}
  try{
    try{ kiemTraHan(); }catch(err){ ghiLoi('kiemTraHan', err); }
    if (motLuotHoi(0) <= 0) return;
    var het = Date.now() + HOI_TRAN_GIAY * 1000, rong = 0;
    while (Date.now() < het && rong < 2){
      var n = motLuotHoi(10);
      if (n < 0) break;
      rong = n === 0 ? rong + 1 : 0;
    }
  } finally {
    try{ cache.remove('dang_hoi'); }catch(e){}
  }
}

function motLuotHoi(choGiay){
  var off = Number(props().getProperty('TG_OFFSET') || 0);
  var r = tgApi('getUpdates', {offset:off, timeout:choGiay, limit:20, allowed_updates:['message', 'callback_query']});
  if (!r || !r.ok || !r.result) return -1;
  if (!r.result.length) return 0;
  var maxId = off;
  r.result.forEach(function(u){ if (u.update_id >= maxId) maxId = u.update_id + 1; });
  props().setProperty('TG_OFFSET', String(maxId));   // dời mốc trước: một tin lỗi không làm kẹt hàng chờ
  r.result.forEach(function(u){
    try{ xuLyUpdate(u); }catch(err){ ghiLoi('xuLyUpdate', err); }
  });
  return r.result.length;
}

/* ═══════════════ CÀI ĐẶT / DỪNG ═══════════════ */
var MENU_BOT = [
  {command:'moi',     description:'🆕 Tạo video mới'},
  {command:'kichban', description:'📝 Gửi kịch bản (bản mới phải chốt lại)'},
  {command:'nop',     description:'🎞 Editor nộp draft / bản sửa'},
  {command:'sua',     description:'✏️ Khách gửi góp ý'},
  {command:'duyet',   description:'✅ Khách duyệt video'},
  {command:'ds',      description:'📋 Video đang làm và hạn'},
  {command:'xem',     description:'🔎 Dòng thời gian một video'},
  {command:'tuan',    description:'📊 Báo cáo tuần'},
  {command:'caidat',  description:'⚙️ Số video, số giờ, vòng sửa'},
  {command:'id',      description:'🆔 Lấy mã chat'},
  {command:'menu',    description:'📖 Hướng dẫn'}
];

function setup(){
  var out = [];
  if (!cfgProp('BOT_TOKEN')) throw new Error('Chưa đặt BOT_TOKEN trong Script Properties.');
  bang('Video', VIDEO_HEADERS); bang('KichBan', KB_HEADERS); bang('NhatKy', NK_HEADERS);
  out.push('✔ Sheet: ' + ss().getUrl());
  var me = tgApi('getMe', {});
  if (!me || !me.ok){ Logger.log('✘ Token sai — kiểm tra lại với @BotFather'); return; }
  out.push('✔ Bot: @' + me.result.username);
  tgApi('setMyCommands', {commands:MENU_BOT});
  tgApi('deleteWebhook', {drop_pending_updates:true});
  var r = tgApi('getUpdates', {offset:-1, timeout:0, limit:1});
  if (r && r.ok && r.result && r.result.length) props().setProperty('TG_OFFSET', String(r.result[0].update_id + 1));
  dungLich();
  ScriptApp.newTrigger('hoiTelegram').timeBased().everyMinutes(1).create();
  out.push('✔ Đã đặt lịch chạy mỗi phút (nhận lệnh + nhắc hạn)');
  out.push('Editor: ' + (dsId('EDITOR_IDS').join(', ') || '✘ chưa có EDITOR_IDS'));
  out.push('Khách: ' + (dsId('KHACH_IDS').join(', ') || '✘ chưa có KHACH_IDS'));
  out.push('Group: ' + (cfgProp('GROUP_ID') || '• chưa có GROUP_ID — bot nhắn riêng từng người'));
  out.push('AI đối chiếu góp ý: ' + (cfgProp('GEMINI_API_KEY') ? 'bật' : 'tắt (không có GEMINI_API_KEY)'));
  Logger.log(out.join('\n'));
  baoChung('✅ *Bot Editor đã sẵn sàng.* Gõ /menu để xem cách dùng, /caidat để xem thỏa thuận đang áp dụng.');
}

/* Bot nhắn liên tục hoặc muốn tạm nghỉ → chạy hàm này. Bật lại: setup */
function dungBot(){
  tgApi('deleteWebhook', {drop_pending_updates:true});
  Logger.log('✔ Đã gỡ ' + dungLich() + ' lịch chạy. Bot im. Chạy setup để bật lại.');
}
function dungLich(){
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === 'hoiTelegram'){ ScriptApp.deleteTrigger(t); n++; }
  });
  return n;
}
