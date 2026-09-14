/**
 * ═══════════════════════════════════════════════════════════════
 *  LỊCH KÈM 1:1 — file phụ, dán vào Apps Script thành file riêng
 * ═══════════════════════════════════════════════════════════════
 *  Mentor mở ca trong Telegram → học viên thấy trên web → tick đặt
 *  → bot báo về + nhắc lại trước giờ hẹn.
 *
 *  Cần sửa 4 chỗ nhỏ trong Code.gs (xem HUONG-DAN-LICH.md).
 * ═══════════════════════════════════════════════════════════════
 */

var SHEET_LICH = 'Lich';
var SHEET_HV   = 'HocVien';

var LICH_HEADERS = ['id','mentor','ngay','batdau','ketthuc','trangthai',
                    'hv_email','hv_ten','nhac_luc','da_nhac','ghichu','tao'];
var HV_HEADERS   = ['email','ten','salt','hash','trangthai','token','token_han',
                    'tao','dangnhap_cuoi'];

/* Ba ca mặc định — sửa ở đây là đổi cho cả bot lẫn web */
var CA = [
  {ma:'s', ten:'Sáng',  batdau:'09:00', ketthuc:'11:00'},
  {ma:'c', ten:'Chiều', batdau:'14:00', ketthuc:'16:00'},
  {ma:'t', ten:'Tối',   batdau:'20:00', ketthuc:'22:00'}
];

var NHAC_TRUOC_MD = 6;      // giờ — mặc định nhắc trước 6 tiếng
var PHIEN_NGAY    = 30;     // token đăng nhập sống bao nhiêu ngày
var BAM_VONG      = 1500;   // số vòng băm mật khẩu
var DN_TOI_DA     = 5;      // số lần đăng nhập sai cho phép trong 10 phút

/* ═══════════════ BẢNG TÍNH ═══════════════ */

function bang(ten, headers){
  var wb = ss();
  var sh = wb.getSheetByName(ten);
  if (sh && sh.getLastRow() >= 1 && sh.getLastColumn() !== headers.length){
    sh.setName(ten+'_cu_'+Utilities.formatDate(new Date(),'GMT+7','ddMMyy_HHmm'));
    sh = null;
  }
  if (!sh){
    sh = wb.insertSheet(ten);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function docBang(ten, headers){
  var sh = bang(ten, headers), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2,1,last-1,headers.length).getValues().map(function(r,i){
    var o = {row:i+2};
    headers.forEach(function(h,j){ o[h] = String(r[j]==null?'':r[j]); });
    return o;
  });
}

function moiLich(){ return docBang(SHEET_LICH, LICH_HEADERS); }
function moiHV(){   return docBang(SHEET_HV,   HV_HEADERS); }

function ghiO(tenBang, headers, row, cot, giaTri){
  bang(tenBang, headers).getRange(row, headers.indexOf(cot)+1).setValue(giaTri);
}

/* ═══════════════ NGÀY GIỜ (mọi thứ theo GMT+7) ═══════════════ */

function ngayISO(d){ return Utilities.formatDate(d,'GMT+7','yyyy-MM-dd'); }
function homNay(){ return ngayISO(new Date()); }

/** 'yyyy-MM-dd' + 'HH:mm' → Date thật (đã tính múi giờ VN) */
function mocGio(ngay, gio){ return new Date(ngay+'T'+gio+':00+07:00'); }

/** Thứ Hai của tuần chứa ngày này */
function thuHai(ngay){
  var d = mocGio(ngay,'12:00');
  var thu = Number(Utilities.formatDate(d,'GMT+7','u'));   // 1=T2 … 7=CN
  d.setDate(d.getDate() - (thu-1));
  return ngayISO(d);
}
function congNgay(ngay, n){
  var d = mocGio(ngay,'12:00');
  d.setDate(d.getDate()+n);
  return ngayISO(d);
}
function tenThu(ngay){
  return ['','T2','T3','T4','T5','T6','T7','CN']
    [Number(Utilities.formatDate(mocGio(ngay,'12:00'),'GMT+7','u'))];
}
function ngayGon(ngay){ return ngay.slice(8,10)+'/'+ngay.slice(5,7); }

/* ═══════════════ CẤU HÌNH LỊCH ═══════════════ */

function cfgLich(){
  var c = getConfig();
  return {
    nhacTruoc: Number((c.lich||{}).nhacTruoc || NHAC_TRUOC_MD)
  };
}
function luuNhacTruoc(gio){
  var c = getConfig();
  c.lich = c.lich || {};
  c.lich.nhacTruoc = gio;
  saveConfig(c);
}

/* ═══════════════ MẬT KHẨU ═══════════════ */

function chuoiNgauNhien(n, bang16){
  var B = bang16 || 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  var r = '';
  for (var i=0;i<n;i++) r += B.charAt(Math.floor(Math.random()*B.length));
  return r;
}

function bamMK(pass, salt){
  var tieu = cfgProp('PEPPER') || 'tmxk-pepper';
  var x = salt + '|' + pass + '|' + tieu;
  for (var i=0;i<BAM_VONG;i++){
    var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, x, Utilities.Charset.UTF_8);
    x = b.map(function(v){ return ('0'+(v & 0xFF).toString(16)).slice(-2) }).join('');
  }
  return x;
}

/** So sánh không lộ thời gian — tránh dò từng ký tự */
function bangNhau(a, b){
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var kh = 0;
  for (var i=0;i<a.length;i++) kh |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return kh === 0;
}

function chuanEmail(e){ return String(e||'').trim().toLowerCase(); }

/* ═══════════════ API CHO WEB ═══════════════ */

function lichApi(body){
  var act = String(body.action||'');
  try{
    if (act === 'hv_login')  return apiDangNhap(body);
    if (act === 'hv_slots')  return apiXemLich(body);
    if (act === 'hv_book')   return apiDatLich(body);
    if (act === 'hv_cancel') return apiHuyLich(body);
    return jsonOut({ok:false, error:'unknown_action'});
  }catch(err){
    ghiLoi('lichApi/'+act, err);
    return jsonOut({ok:false, error:'internal'});
  }
}

function apiDangNhap(b){
  var email = chuanEmail(b.email), pass = String(b.pass||'');
  if (!email || !pass) return jsonOut({ok:false, error:'thieu'});

  // chặn dò mật khẩu: 5 lần sai trong 10 phút là khoá tạm
  var cache = CacheService.getScriptCache(), khoa = 'dn_'+email;
  var sai = Number(cache.get(khoa) || 0);
  if (sai >= DN_TOI_DA) return jsonOut({ok:false, error:'khoa_tam'});

  var hv = null;
  moiHV().forEach(function(r){ if (chuanEmail(r.email)===email) hv = r; });

  if (!hv || hv.trangthai==='off' || !bangNhau(bamMK(pass, hv.salt), hv.hash)){
    cache.put(khoa, String(sai+1), 600);
    return jsonOut({ok:false, error:'sai'});
  }
  cache.remove(khoa);

  var token = chuoiNgauNhien(40);
  var han = new Date(); han.setDate(han.getDate() + PHIEN_NGAY);
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'token', bamMK(token, hv.salt));
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'token_han', han.toISOString());
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'dangnhap_cuoi', nowVN());

  return jsonOut({ok:true, token:token, email:hv.email, ten:hv.ten || hv.email});
}

/** Đổi token thành hồ sơ học viên, hết hạn hoặc sai thì trả null */
function aiDay(token){
  token = String(token||'');
  if (token.length < 20) return null;
  var ra = null;
  moiHV().forEach(function(r){
    if (ra || !r.token || r.trangthai==='off') return;
    if (!bangNhau(bamMK(token, r.salt), r.token)) return;
    if (r.token_han && new Date(r.token_han) < new Date()) return;
    ra = r;
  });
  return ra;
}

function apiXemLich(b){
  var hv = aiDay(b.token);
  if (!hv) return jsonOut({ok:false, error:'het_phien'});

  var dau = thuHai(String(b.tuan||'').match(/^\d{4}-\d{2}-\d{2}$/) ? b.tuan : homNay());
  var cuoi = congNgay(dau, 6);
  var bay = homNay();
  var email = chuanEmail(hv.email);

  var ngays = {};
  for (var i=0;i<7;i++){
    var n = congNgay(dau, i);
    ngays[n] = {ngay:n, thu:tenThu(n), gon:ngayGon(n), qua:(n < bay), slots:[]};
  }

  moiLich().forEach(function(r){
    if (r.ngay < dau || r.ngay > cuoi) return;
    if (r.trangthai === 'off') return;
    var cuaToi = chuanEmail(r.hv_email) === email;
    // ca người khác đã đặt thì giấu luôn, khỏi rối mắt
    if (r.trangthai === 'booked' && !cuaToi) return;
    ngays[r.ngay].slots.push({
      id: r.id, mentor: r.mentor, batdau: r.batdau, ketthuc: r.ketthuc,
      dat: r.trangthai === 'booked', cuaToi: cuaToi,
      qua: mocGio(r.ngay, r.batdau) < new Date()
    });
  });

  var ds = Object.keys(ngays).sort().map(function(k){
    ngays[k].slots.sort(function(a,c){ return a.batdau < c.batdau ? -1 : 1 });
    return ngays[k];
  });

  return jsonOut({ok:true, ten:hv.ten||hv.email, tuan:dau, ngays:ds,
                  nhacTruoc:cfgLich().nhacTruoc});
}

function apiDatLich(b){
  var hv = aiDay(b.token);
  if (!hv) return jsonOut({ok:false, error:'het_phien'});

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return jsonOut({ok:false, error:'busy'});
  try{
    var slot = null;
    moiLich().forEach(function(r){ if (r.id === String(b.slotId)) slot = r; });
    if (!slot) return jsonOut({ok:false, error:'khong_thay'});
    if (slot.trangthai === 'booked') return jsonOut({ok:false, error:'da_co_nguoi'});
    if (mocGio(slot.ngay, slot.batdau) < new Date())
      return jsonOut({ok:false, error:'da_qua'});

    var nhac = new Date(mocGio(slot.ngay, slot.batdau).getTime()
                        - cfgLich().nhacTruoc*3600*1000);

    ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'trangthai', 'booked');
    ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'hv_email', hv.email);
    ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'hv_ten', hv.ten||'');
    ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'nhac_luc', nhac.toISOString());
    ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'da_nhac', '');

    tgBroadcast([
      '📅 *Học viên vừa đặt lịch kèm 1:1*','',
      '👤 '+(hv.ten||hv.email),
      '📧 `'+hv.email+'`',
      '🗓 '+tenThu(slot.ngay)+' '+ngayGon(slot.ngay)+' · '+slot.batdau+'–'+slot.ketthuc,
      '🧑‍🏫 Mentor: '+(slot.mentor||'—'),'',
      '_Sẽ nhắc lại trước '+cfgLich().nhacTruoc+' tiếng._'
    ].join('\n'));

    return jsonOut({ok:true});
  } finally { lock.releaseLock(); }
}

function apiHuyLich(b){
  var hv = aiDay(b.token);
  if (!hv) return jsonOut({ok:false, error:'het_phien'});

  var slot = null;
  moiLich().forEach(function(r){ if (r.id === String(b.slotId)) slot = r; });
  if (!slot) return jsonOut({ok:false, error:'khong_thay'});
  if (chuanEmail(slot.hv_email) !== chuanEmail(hv.email))
    return jsonOut({ok:false, error:'khong_phai_cua_ban'});

  ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'trangthai', 'open');
  ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'hv_email', '');
  ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'hv_ten', '');
  ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'nhac_luc', '');
  ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'da_nhac', '');

  tgBroadcast('↩️ *'+(hv.ten||hv.email)+'* vừa huỷ lịch '+
    tenThu(slot.ngay)+' '+ngayGon(slot.ngay)+' · '+slot.batdau+'–'+slot.ketthuc+
    '\nCa này mở lại cho người khác đặt.');

  return jsonOut({ok:true});
}

/* ═══════════════ NHẮC HẸN ═══════════════ */

/** Chạy bằng lịch mỗi 15 phút. */
function nhacLich(){
  var bay = new Date();
  moiLich().forEach(function(r){
    if (r.trangthai !== 'booked' || r.da_nhac || !r.nhac_luc) return;
    if (new Date(r.nhac_luc) > bay) return;
    if (mocGio(r.ngay, r.batdau) < bay) return;   // đã qua giờ thì thôi

    var conLai = Math.round((mocGio(r.ngay,r.batdau) - bay)/3600000);
    tgBroadcast([
      '⏰ *Nhắc lịch kèm 1:1* — còn khoảng '+conLai+' tiếng','',
      '👤 '+(r.hv_ten||r.hv_email),
      '📧 `'+r.hv_email+'`',
      '🗓 '+tenThu(r.ngay)+' '+ngayGon(r.ngay)+' · '+r.batdau+'–'+r.ketthuc,
      '🧑‍🏫 Mentor: '+(r.mentor||'—')
    ].join('\n'));
    ghiO(SHEET_LICH, LICH_HEADERS, r.row, 'da_nhac', nowVN());
  });
}

/* ═══════════════ BOT — LỆNH LỊCH ═══════════════ */

var LENH_LICH = ['lich','lichtuan','themhv','dshv','xoahv','doimk',
                 'nhactruoc','tenmentor'];

function lichCoLenh(cmd){
  return LENH_LICH.indexOf(cmd) > -1 || String(cmd).indexOf('gionhap|') === 0;
}

function tenMentor(msg, chatId){
  var t = props().getProperty('MENTOR_'+chatId);
  if (t) return t;
  var f = (msg && msg.from) || {};
  return (f.first_name||'') + (f.last_name ? ' '+f.last_name : '') || 'Mentor';
}

function lichLenh(cmd, arg, chatId, msg){
  // đang chờ nhập giờ tự chọn cho một ngày cụ thể
  if (String(cmd).indexOf('gionhap|') === 0){
    var ngay = cmd.split('|')[1];
    return nhapGioTay(chatId, ngay, arg, tenMentor(msg, chatId));
  }

  switch(cmd){
    case 'lich':
      if (arg) return themCaBangChu(chatId, arg, tenMentor(msg, chatId));
      return tgSend(chatId, banTuanChu(thuHai(homNay())),
                    banTuanNut(thuHai(homNay())));

    case 'lichtuan':   return xemLichTuan(chatId, arg);
    case 'themhv':     return themHocVien(chatId, arg);
    case 'dshv':       return dsHocVien(chatId);
    case 'xoahv':      return xoaHocVien(chatId, arg);
    case 'doimk':      return doiMatKhau(chatId, arg);
    case 'tenmentor':  return datTenMentor(chatId, arg);

    case 'nhactruoc': {
      if (!arg){ datCho(chatId,'nhactruoc');
        return tgSend(chatId,'⏰ Đang nhắc trước *'+cfgLich().nhacTruoc+
          ' tiếng*.\n\n👉 Nhắn số giờ mới vào tin tiếp theo (VD `6`), hoặc /huy.'); }
      var g = Number(String(arg).replace(/[^\d.]/g,''));
      if (!g || g <= 0 || g > 72)
        return tgSend(chatId,'Nhập số giờ từ 1 đến 72 nhé.');
      luuNhacTruoc(g);
      return tgSend(chatId,'✅ Sẽ nhắc trước *'+g+' tiếng* cho các lịch đặt từ giờ.');
    }
  }
}

/* ── bảng tuần: mỗi ngày một nút, kèm số ca đang mở ── */

function demCa(ngay, ds){
  var mo=0, dat=0;
  (ds||moiLich()).forEach(function(r){
    if (r.ngay !== ngay || r.trangthai === 'off') return;
    if (r.trangthai === 'booked') dat++; else mo++;
  });
  return {mo:mo, dat:dat};
}

function banTuanChu(dau){
  return ['📅 *Lịch kèm 1:1* — tuần '+ngayGon(dau)+' → '+ngayGon(congNgay(dau,6)),'',
    'Bấm một ngày để bật/tắt ca.',
    '🟢 = đang mở cho học viên đặt   ·   🔒 = đã có người đặt'].join('\n');
}

function banTuanNut(dau){
  var ds = moiLich(), hang = [], bay = homNay();
  for (var i=0;i<7;i+=2){
    var cot = [];
    for (var j=i;j<Math.min(i+2,7);j++){
      var n = congNgay(dau,j), d = demCa(n, ds);
      var nhan = tenThu(n)+' '+ngayGon(n);
      if (d.mo)  nhan += ' ·'+d.mo+'🟢';
      if (d.dat) nhan += ' '+d.dat+'🔒';
      if (n < bay) nhan = '· '+nhan;
      cot.push({text:nhan, callback_data:'l:d:'+n});
    }
    hang.push(cot);
  }
  hang.push([
    {text:'‹ Tuần trước', callback_data:'l:w:'+congNgay(dau,-7)},
    {text:'Tuần sau ›',   callback_data:'l:w:'+congNgay(dau, 7)}
  ]);
  return hang;
}

/* ── bảng một ngày: ba ca + giờ tự nhập ── */

function banNgayChu(ngay){
  var ds = moiLich().filter(function(r){ return r.ngay===ngay && r.trangthai!=='off' });
  var dong = ['📅 *'+tenThu(ngay)+' '+ngayGon(ngay)+'*',''];
  if (!ds.length) dong.push('_Chưa mở ca nào._');
  else ds.sort(function(a,b){ return a.batdau<b.batdau?-1:1 }).forEach(function(r){
    dong.push((r.trangthai==='booked' ? '🔒 ' : '🟢 ')+r.batdau+'–'+r.ketthuc+
      ' · '+(r.mentor||'—')+
      (r.trangthai==='booked' ? '  ← '+(r.hv_ten||r.hv_email) : ''));
  });
  dong.push('', 'Bấm ca để bật/tắt. Ca đã có người đặt thì không tắt được.');
  return dong.join('\n');
}

function banNgayNut(ngay){
  var ds = moiLich().filter(function(r){ return r.ngay===ngay });
  var hang = CA.map(function(c){
    var co = null;
    ds.forEach(function(r){
      if (r.batdau===c.batdau && r.ketthuc===c.ketthuc && r.trangthai!=='off') co = r;
    });
    var dau = co ? (co.trangthai==='booked' ? '🔒' : '🟢') : '⚪';
    return [{text:dau+' '+c.ten+' '+c.batdau+'–'+c.ketthuc,
             callback_data:'l:t:'+ngay+':'+c.ma}];
  });
  hang.push([{text:'✍️ Giờ khác', callback_data:'l:x:'+ngay},
             {text:'← Cả tuần',   callback_data:'l:w:'+thuHai(ngay)}]);
  return hang;
}

/* ── bật/tắt một ca ── */

function batTatCa(ngay, maCa, mentor){
  var c = null;
  CA.forEach(function(x){ if (x.ma===maCa) c = x });
  if (!c) return 'Ca lạ';

  var co = null;
  moiLich().forEach(function(r){
    if (r.ngay===ngay && r.batdau===c.batdau && r.ketthuc===c.ketthuc
        && r.trangthai!=='off') co = r;
  });

  if (co && co.trangthai==='booked') return 'Ca này có người đặt rồi, không tắt được';
  if (co){
    ghiO(SHEET_LICH, LICH_HEADERS, co.row, 'trangthai', 'off');
    return 'Đã tắt ca '+c.ten;
  }
  themCa(ngay, c.batdau, c.ketthuc, mentor);
  return 'Đã mở ca '+c.ten;
}

function themCa(ngay, batdau, ketthuc, mentor){
  bang(SHEET_LICH, LICH_HEADERS).appendRow([
    'L'+chuoiNgauNhien(6), mentor||'', ngay, batdau, ketthuc,
    'open', '', '', '', '', '', nowVN()
  ]);
}

/* ── giờ tự nhập ── */

var RE_GIO = /^(\d{1,2})[:h](\d{2})\s*[-–~]\s*(\d{1,2})[:h](\d{2})$/;

function chuanGio(s){
  var m = String(s||'').trim().replace(/\s+/g,'').match(RE_GIO);
  if (!m) return null;
  var h1=Number(m[1]), p1=Number(m[2]), h2=Number(m[3]), p2=Number(m[4]);
  if (h1>23||h2>23||p1>59||p2>59) return null;
  var a = ('0'+h1).slice(-2)+':'+('0'+p1).slice(-2);
  var b = ('0'+h2).slice(-2)+':'+('0'+p2).slice(-2);
  if (a >= b) return null;
  return {batdau:a, ketthuc:b};
}

function nhapGioTay(chatId, ngay, arg, mentor){
  var g = chuanGio(arg);
  if (!g){
    datCho(chatId, 'gionhap|'+ngay);
    return tgSend(chatId,'Chưa đọc được giờ. Nhắn kiểu `19:30-21:00` nhé, hoặc /huy.');
  }
  themCa(ngay, g.batdau, g.ketthuc, mentor);
  return tgSend(chatId,'✅ Đã mở ca *'+g.batdau+'–'+g.ketthuc+'* '+
    tenThu(ngay)+' '+ngayGon(ngay)+'.\nGõ /lich để xem lại cả tuần.');
}

/** /lich 15/09 19:30-21:00 */
function themCaBangChu(chatId, arg, mentor){
  var p = String(arg).trim().split(/\s+/);
  var md = (p[0]||'').match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (!md || p.length < 2)
    return tgSend(chatId,'Cú pháp: `/lich 15/09 19:30-21:00`\nHoặc gõ /lich trơn để bấm nút.');
  var nam = md[3] || homNay().slice(0,4);
  var ngay = nam+'-'+('0'+md[2]).slice(-2)+'-'+('0'+md[1]).slice(-2);
  var g = chuanGio(p.slice(1).join(''));
  if (!g) return tgSend(chatId,'Giờ chưa đúng. Kiểu `19:30-21:00` nhé.');
  themCa(ngay, g.batdau, g.ketthuc, mentor);
  return tgSend(chatId,'✅ Đã mở ca *'+g.batdau+'–'+g.ketthuc+'* '+
    tenThu(ngay)+' '+ngayGon(ngay)+'.');
}

/* ── callback từ nút bấm ── */

function lichCallback(cb){
  var chatId = cb.message && cb.message.chat && cb.message.chat.id;
  if (!isAdmin(chatId)) return tgAnswer(cb.id, 'Không có quyền');

  var p = String(cb.data||'').split(':');   // l : loai : ...
  var loai = p[1];

  if (loai === 'w'){
    var dau = thuHai(p[2]);
    tgApi('editMessageText', {chat_id:chatId, message_id:cb.message.message_id,
      text:banTuanChu(dau), parse_mode:'Markdown',
      reply_markup:{inline_keyboard:banTuanNut(dau)}});
    return tgAnswer(cb.id);
  }

  if (loai === 'd'){
    tgApi('editMessageText', {chat_id:chatId, message_id:cb.message.message_id,
      text:banNgayChu(p[2]), parse_mode:'Markdown',
      reply_markup:{inline_keyboard:banNgayNut(p[2])}});
    return tgAnswer(cb.id);
  }

  if (loai === 't'){
    var tb = batTatCa(p[2], p[3], tenMentor(cb, chatId));
    tgApi('editMessageText', {chat_id:chatId, message_id:cb.message.message_id,
      text:banNgayChu(p[2]), parse_mode:'Markdown',
      reply_markup:{inline_keyboard:banNgayNut(p[2])}});
    return tgAnswer(cb.id, tb);
  }

  if (loai === 'x'){
    datCho(chatId, 'gionhap|'+p[2]);
    tgSend(chatId,'✍️ Nhắn giờ cho '+tenThu(p[2])+' '+ngayGon(p[2])+
      ' vào tin tiếp theo — kiểu `19:30-21:00`. /huy để thôi.');
    return tgAnswer(cb.id);
  }

  return tgAnswer(cb.id);
}

/* ── xem lịch tuần dạng chữ ── */

function xemLichTuan(chatId, arg){
  var dau = thuHai(String(arg||'').match(/^\d{4}-\d{2}-\d{2}$/) ? arg : homNay());
  var ds = moiLich().filter(function(r){
    return r.ngay >= dau && r.ngay <= congNgay(dau,6) && r.trangthai !== 'off';
  });
  if (!ds.length)
    return tgSend(chatId,'Tuần '+ngayGon(dau)+' → '+ngayGon(congNgay(dau,6))+
      ' chưa mở ca nào.\nGõ /lich để mở.');

  var dong = ['📅 *Tuần '+ngayGon(dau)+' → '+ngayGon(congNgay(dau,6))+'*'];
  for (var i=0;i<7;i++){
    var n = congNgay(dau,i);
    var caNgay = ds.filter(function(r){ return r.ngay===n })
                   .sort(function(a,b){ return a.batdau<b.batdau?-1:1 });
    if (!caNgay.length) continue;
    dong.push('', '*'+tenThu(n)+' '+ngayGon(n)+'*');
    caNgay.forEach(function(r){
      dong.push((r.trangthai==='booked'?'🔒 ':'🟢 ')+r.batdau+'–'+r.ketthuc+
        ' · '+(r.mentor||'—')+
        (r.trangthai==='booked'?'  ← '+(r.hv_ten||r.hv_email):''));
    });
  }
  return tgSend(chatId, dong.join('\n'));
}

/* ── tài khoản học viên ── */

function themHocVien(chatId, arg){
  if (!arg){ datCho(chatId,'themhv');
    return tgSend(chatId,'👤 Nhắn email học viên vào tin tiếp theo.\n'+
      'Kèm tên cũng được: `an@gmail.com Nguyễn An`'); }

  var p = String(arg).trim().split(/\s+/);
  var email = chuanEmail(p[0]);
  var ten = p.slice(1).join(' ');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return tgSend(chatId,'Email chưa đúng: `'+p[0]+'`');

  var da = null;
  moiHV().forEach(function(r){ if (chuanEmail(r.email)===email) da = r });

  var mk = chuoiNgauNhien(10);
  var salt = chuoiNgauNhien(16);

  if (da){
    ghiO(SHEET_HV, HV_HEADERS, da.row, 'salt', salt);
    ghiO(SHEET_HV, HV_HEADERS, da.row, 'hash', bamMK(mk, salt));
    ghiO(SHEET_HV, HV_HEADERS, da.row, 'token', '');
    ghiO(SHEET_HV, HV_HEADERS, da.row, 'trangthai', 'active');
    if (ten) ghiO(SHEET_HV, HV_HEADERS, da.row, 'ten', ten);
  } else {
    bang(SHEET_HV, HV_HEADERS).appendRow([
      email, ten, salt, bamMK(mk, salt), 'active', '', '', nowVN(), ''
    ]);
  }

  return tgSend(chatId, [
    (da ? '🔄 *Đã cấp lại mật khẩu*' : '✅ *Đã tạo tài khoản học viên*'),'',
    '📧 `'+email+'`',
    '🔑 `'+mk+'`','',
    'Gửi hai dòng trên cho học viên. Mật khẩu chỉ hiện ở đây một lần —',
    'quên thì gõ lại /themhv để cấp mật khẩu mới.'
  ].join('\n'));
}

function dsHocVien(chatId){
  var ds = moiHV();
  if (!ds.length) return tgSend(chatId,'Chưa có tài khoản học viên nào.\nTạo bằng /themhv');
  var dong = ['👥 *'+ds.length+' tài khoản học viên*',''];
  ds.forEach(function(r,i){
    dong.push((i+1)+'. '+(r.trangthai==='off'?'🚫 ':'✅ ')+
      (r.ten||'(chưa có tên)')+' — `'+r.email+'`'+
      (r.dangnhap_cuoi ? '\n    vào lần cuối: '+r.dangnhap_cuoi : '\n    _chưa đăng nhập lần nào_'));
  });
  return tgSend(chatId, dong.join('\n'));
}

function xoaHocVien(chatId, arg){
  if (!arg){ datCho(chatId,'xoahv');
    return tgSend(chatId,'Nhắn email cần khoá vào tin tiếp theo.'); }
  var email = chuanEmail(arg), hit = null;
  moiHV().forEach(function(r){ if (chuanEmail(r.email)===email) hit = r });
  if (!hit) return tgSend(chatId,'Không thấy `'+email+'` trong danh sách.');
  ghiO(SHEET_HV, HV_HEADERS, hit.row, 'trangthai', 'off');
  ghiO(SHEET_HV, HV_HEADERS, hit.row, 'token', '');
  return tgSend(chatId,'🚫 Đã khoá `'+email+'`. Mở lại bằng /themhv (cấp mật khẩu mới).');
}

function doiMatKhau(chatId, arg){
  return themHocVien(chatId, arg);   // cấp lại mật khẩu = tạo lại
}

function datTenMentor(chatId, arg){
  if (!arg){ datCho(chatId,'tenmentor');
    return tgSend(chatId,'Tên hiện tại: *'+tenMentor(null, chatId)+'*\n\n'+
      '👉 Nhắn tên mới vào tin tiếp theo (tên này hiện cho học viên thấy).'); }
  props().setProperty('MENTOR_'+chatId, String(arg).trim());
  return tgSend(chatId,'✅ Học viên sẽ thấy tên mentor là *'+String(arg).trim()+'*');
}

/* ═══════════════ CÀI ĐẶT ═══════════════ */

/** Gọi từ setup() trong Code.gs */
function lichSetup(){
  bang(SHEET_LICH, LICH_HEADERS);
  bang(SHEET_HV,   HV_HEADERS);
  if (!props().getProperty('PEPPER'))
    props().setProperty('PEPPER', chuoiNgauNhien(32));
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction()==='nhacLich') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('nhacLich').timeBased().everyMinutes(15).create();
  return 'Sheet Lich + HocVien sẵn sàng · lịch nhắc chạy mỗi 15 phút';
}

/** Chẩn đoán — chạy tay rồi đọc Execution log. */
function kiemTraLich(){
  var out = [];
  out.push('Ca đang có: '+moiLich().length+' dòng');
  out.push('Tài khoản học viên: '+moiHV().length);
  out.push('Nhắc trước: '+cfgLich().nhacTruoc+' tiếng');
  out.push('PEPPER: '+(props().getProperty('PEPPER') ? '✔ đã có' : '✘ CHƯA — chạy lichSetup'));
  var n = ScriptApp.getProjectTriggers().filter(function(t){
    return t.getHandlerFunction()==='nhacLich' }).length;
  out.push('Lịch nhắc: '+(n ? '✔ '+n+' trigger' : '✘ chưa có — chạy lichSetup'));
  out.push('Hôm nay: '+homNay()+' · Thứ Hai tuần này: '+thuHai(homNay()));
  Logger.log(out.join('\n'));
}
