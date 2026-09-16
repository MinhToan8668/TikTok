/**
 * ═══════════════════════════════════════════════════════════════
 *  LỊCH KÈM 1:1 — file phụ, dán vào Apps Script thành file riêng
 * ═══════════════════════════════════════════════════════════════
 *  Mọi thao tác lịch nằm TRÊN TRANG WEB, không tick trong bot:
 *
 *   • Ai cũng tự đăng ký tài khoản ở khu học viên (email, mật khẩu,
 *     họ tên). Tài khoản mới ở trạng thái "chờ" — chưa vào được.
 *   • Bot nhắn về cho Toàn kèm 3 nút: Học viên · Mentor · Từ chối.
 *     Toàn bấm một nút là xong, người đó đăng nhập được ngay.
 *   • Vai trò quyết định giao diện: mentor thấy bảng mở ca của mình,
 *     học viên thấy bảng đặt ca. Trang không hỏi ai là ai cả.
 *   • Đặt / huỷ lịch đều nhắn về bot kèm TÊN người đặt (tên đệm +
 *     tên, cắt từ họ tên), và nhắc lại trước giờ hẹn.
 *
 *  Cần sửa 4 chỗ nhỏ trong Code.gs (xem HUONG-DAN-LICH.md).
 * ═══════════════════════════════════════════════════════════════
 */

var SHEET_LICH = 'Lich';
var SHEET_HV   = 'HocVien';

var LICH_HEADERS = ['id','mentor_ma','mentor_ten','ngay','batdau','ketthuc','trangthai',
                    'hv_ma','hv_ten','hv_email','nhac_luc','da_nhac','tao'];
var HV_HEADERS   = ['ma','email','ten','ten_goi','salt','hash','vaitro','trangthai',
                    'token','token_han','tao','dangnhap_cuoi'];

/* Ba ca mặc định — sửa ở đây là đổi cho cả web lẫn bot */
var CA = [
  {ma:'s', ten:'Sáng',  batdau:'09:00', ketthuc:'11:00'},
  {ma:'c', ten:'Chiều', batdau:'14:00', ketthuc:'16:00'},
  {ma:'t', ten:'Tối',   batdau:'20:00', ketthuc:'22:00'}
];

var NHAC_TRUOC_MD = 6;      // giờ — mặc định nhắc trước 6 tiếng
var TOI_DA_MD     = 2;      // mỗi học viên đặt tối đa mấy ca MỘT TUẦN
var PHIEN_NGAY    = 30;     // token đăng nhập sống bao nhiêu ngày
var BAM_VONG      = 1500;   // số vòng băm mật khẩu
var DN_TOI_DA     = 5;      // số lần đăng nhập sai cho phép trong 10 phút
var MK_TOI_THIEU  = 6;      // độ dài mật khẩu tối thiểu khi tự đăng ký

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
    // Ép TOÀN BỘ cột về văn bản thuần. Không có dòng này, Sheets tự đổi
    // '2026-09-15' thành Date và '09:00' thành giá trị giờ — đọc ra là
    // "Mon Sep 15 2026 ..." rồi mọi phép so sánh ngày đều sai.
    sh.getRange(1, 1, sh.getMaxRows(), headers.length).setNumberFormat('@');
  }
  return sh;
}

function docBang(ten, headers, chuan){
  var sh = bang(ten, headers), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2,1,last-1,headers.length).getValues().map(function(r,i){
    var o = {row:i+2};
    headers.forEach(function(h,j){
      var v = r[j];
      o[h] = (chuan && chuan[h]) ? chuan[h](v) : String(v==null?'':v);
    });
    return o;
  });
}

/* ── Chữa dữ liệu đã lỡ bị Sheets đổi kiểu ──────────────────────────
   Sheet cũ (tạo trước khi ép định dạng văn bản) có thể đang giữ ngày
   dưới dạng Date và giờ dưới dạng số thời gian. Đọc ra phải nắn lại,
   không thì so sánh ngày sai bét và ca biến mất khỏi lịch.

   PHẢI đọc lại bằng ĐÚNG múi giờ của bảng tính — chính múi giờ mà
   Sheets đã dùng khi cất giá trị. Đọc bằng 'GMT+7' cứng là sai 7 phút:
   ô giờ thuần được cất trên ngày gốc 1899-12-30, mà năm 1899 Việt Nam
   chưa có múi giờ chuẩn, còn dùng giờ mặt trời +07:06:30. Ca 20:00 đọc
   ra thành 19:53, 14:00 thành 13:53. Lệch đó không chỉ hiện sai giờ:
   nút bấm lại không khớp được ca cũ nên mỗi lần bấm là đẻ thêm một
   dòng mới thay vì đóng ca — đó là mấy ca trùng lặp trong lịch.       */
var _tzBang = null;
function muiGioBang(){
  if (_tzBang) return _tzBang;
  try{ _tzBang = ss().getSpreadsheetTimeZone() || 'GMT+7'; }
  catch(e){ _tzBang = 'GMT+7'; }
  return _tzBang;
}
/** Làm tròn về phút gần nhất — nuốt mấy giây lẻ do lệch múi giờ cũ */
function tronPhut(d){ return new Date(Math.round(d.getTime()/60000)*60000); }

function oNgay(v){
  if (v instanceof Date) return Utilities.formatDate(tronPhut(v), muiGioBang(), 'yyyy-MM-dd');
  var s = String(v==null?'':v).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : s;
}
function oGio(v){
  if (v instanceof Date) return Utilities.formatDate(tronPhut(v), muiGioBang(), 'HH:mm');
  var s = String(v==null?'':v).trim();
  var m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? ('0'+m[1]).slice(-2)+':'+m[2] : s;
}
function oMoc(v){   // mốc thời gian ISO — giữ để new Date() đọc lại được
  if (v instanceof Date) return v.toISOString();
  return String(v==null?'':v).trim();
}

var CHUAN_LICH = {ngay:oNgay, batdau:oGio, ketthuc:oGio, nhac_luc:oMoc};
var CHUAN_HV   = {token_han:oMoc};

function moiLich(){ return docBang(SHEET_LICH, LICH_HEADERS, CHUAN_LICH); }
function moiHV(){   return docBang(SHEET_HV,   HV_HEADERS,   CHUAN_HV); }

function ghiO(tenBang, headers, row, cot, giaTri){
  bang(tenBang, headers).getRange(row, headers.indexOf(cot)+1).setValue(giaTri);
}

/**
 * Ghi nhiều cột của MỘT dòng bằng một lượt gọi Sheets.
 * Mỗi setValue là một lần đi–về với Google; đặt một ca phải sửa 6 ô, tức
 * 6 lần chờ liên tiếp. Gộp lại thành một dải ô thì chỉ còn một lần.
 * `cu` là dòng đã đọc sẵn — các cột không đổi lấy nguyên giá trị cũ.
 */
function ghiDong(tenBang, headers, cu, capNhat){
  var idx = [];
  for (var k in capNhat) idx.push(headers.indexOf(k));
  var dau = Math.min.apply(null, idx), cuoi = Math.max.apply(null, idx);
  var hang = [];
  for (var i = dau; i <= cuoi; i++){
    var h = headers[i];
    hang.push(capNhat.hasOwnProperty(h) ? capNhat[h] : cu[h]);
  }
  bang(tenBang, headers).getRange(cu.row, dau+1, 1, hang.length).setValues([hang]);
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

// Đọc cấu hình là một lần gọi PropertiesService + JSON.parse. Một lượt đặt
// ca hỏi tới 3 lần cùng một thứ — nhớ lại trong lượt đó là xong.
var _cfgLich = null;
function cfgLich(){
  if (_cfgLich) return _cfgLich;
  var c = getConfig();
  var l = c.lich || {};
  _cfgLich = {
    nhacTruoc: Number(l.nhacTruoc || NHAC_TRUOC_MD),
    toiDa:     Number(l.toiDa != null && l.toiDa !== '' ? l.toiDa : TOI_DA_MD)
  };
  return _cfgLich;
}
function luuLich(khoa, giaTri){
  var c = getConfig();
  c.lich = c.lich || {};
  c.lich[khoa] = giaTri;
  saveConfig(c);
  _cfgLich = null;
}

/**
 * Gộp các dòng trùng nhau khi HIỂN THỊ (cùng mentor, cùng ngày, cùng giờ).
 * Lỗi đọc giờ lệch 7 phút hồi trước đã đẻ ra mấy dòng như vậy: bấm ba lần
 * là ba dòng y hệt. Code đã sửa nên không đẻ thêm nữa, nhưng dòng cũ vẫn
 * nằm trong Sheet — gộp ở đây để không ai phải đi dọn tay mới xem đúng.
 * Giữ lại dòng đã có người đặt; không ai đặt thì giữ dòng đầu tiên.
 * KHÔNG dùng trong /donlich — chỗ đó cần nhìn thấy đủ dòng trùng để xoá.
 *
 * Dòng đã đóng ('off') phải bỏ qua HẲN, không tính vào nhóm: mở ca rồi
 * đóng rồi mở lại là chuyện bình thường, để lại một dòng 'off' cũ cùng
 * khung giờ — gom nhầm nó vào là nó che mất ca đang mở.
 */
function gomTrung(ds){
  var giu = {}, ra = [];
  ds.forEach(function(r){
    if (r.trangthai === 'off') return;
    var k = r.mentor_ma+'|'+r.ngay+'|'+r.batdau+'|'+r.ketthuc;
    var cu = giu[k];
    if (!cu){ giu[k] = r; ra.push(r); return; }
    // đã có dòng cùng khung giờ: chỉ thay nếu dòng mới có người đặt còn dòng cũ thì không
    if (r.trangthai === 'booked' && cu.trangthai !== 'booked'){
      ra[ra.indexOf(cu)] = r;
      giu[k] = r;
    }
  });
  return ra;
}

/** Học viên này đã giữ mấy ca trong tuần chứa ngày đó */
function demCaTuan(hvMa, ngayTrongTuan, ds){
  var dau = thuHai(ngayTrongTuan), cuoi = congNgay(dau, 6), n = 0;
  (ds || moiLich()).forEach(function(r){
    if (r.trangthai !== 'booked') return;
    if (String(r.hv_ma) !== String(hvMa)) return;
    if (r.ngay < dau || r.ngay > cuoi) return;
    n++;
  });
  return n;
}

/* ═══════════════ TÊN & MẬT KHẨU ═══════════════ */

/**
 * Cắt họ ra, giữ tên đệm + tên — để tin báo về bot gọi đúng tên người.
 * "Nguyễn Văn An"        → "Văn An"
 * "Trần Thị Ngọc Hương"  → "Thị Ngọc Hương"
 * "An"                   → "An"
 */
function tenGoi(hoTen){
  var p = String(hoTen||'').trim().replace(/\s+/g,' ').split(' ');
  if (p.length <= 1) return p[0] || '';
  return p.slice(1).join(' ');
}

/** Viết hoa đầu mỗi chữ, bỏ khoảng trắng thừa */
function chuanTen(s){
  return String(s||'').trim().replace(/\s+/g,' ').split(' ').map(function(w){
    return w ? w.charAt(0).toUpperCase()+w.slice(1) : w;
  }).join(' ');
}

function chuoiNgauNhien(n, bangChu){
  var B = bangChu || 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  var r = '';
  for (var i=0;i<n;i++) r += B.charAt(Math.floor(Math.random()*B.length));
  return r;
}

/** Mã ngắn 5 ký tự cho mỗi tài khoản — dùng làm callback_data của nút bot */
function maTaiKhoan(daCo){
  var B = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var dung = {};
  (daCo||[]).forEach(function(r){ dung[String(r.ma).toUpperCase()] = 1 });
  for (var lan=0; lan<60; lan++){
    var m = '';
    for (var i=0;i<5;i++) m += B.charAt(Math.floor(Math.random()*B.length));
    if (!dung[m]) return m;
  }
  return 'T'+String(new Date().getTime()).slice(-6);
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

/**
 * Băm NHANH — đúng một vòng SHA-256. Chỉ dùng cho token phiên.
 * Mật khẩu cần 1500 vòng vì người ta đặt mật khẩu đoán được; token thì
 * là 40 ký tự ngẫu nhiên (~230 bit), dò cả đời không ra, nên một vòng là đủ.
 * Đây chính là chỗ từng làm mỗi lần bấm mất vài giây: aiDay() băm chậm
 * cho TỪNG tài khoản đang đăng nhập, lớp 16 người là 24.000 vòng một lượt.
 */
function bamNhanh(x){
  var tieu = cfgProp('PEPPER') || 'tmxk-pepper';
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
            String(x)+'|'+tieu, Utilities.Charset.UTF_8);
  return b.map(function(v){ return ('0'+(v & 0xFF).toString(16)).slice(-2) }).join('');
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
function emailHopLe(e){ return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e); }

function timHV(dieuKien){
  var ra = null;
  moiHV().forEach(function(r){ if (!ra && dieuKien(r)) ra = r });
  return ra;
}
function hvTheoEmail(email){
  var e = chuanEmail(email);
  return timHV(function(r){ return chuanEmail(r.email) === e });
}
function hvTheoMa(ma){
  var m = String(ma||'').toUpperCase();
  return timHV(function(r){ return String(r.ma).toUpperCase() === m });
}

/* ═══════════════ API CHO WEB ═══════════════ */

function lichApi(body){
  var act = String(body.action||'');
  _cfgLich = null;              // mỗi lượt gọi đọc cấu hình lại đúng một lần
  try{
    if (act === 'hv_signup')  return apiDangKy(body);
    if (act === 'hv_login')   return apiDangNhap(body);
    if (act === 'hv_slots')   return apiXemLich(body);
    if (act === 'hv_book')    return apiDatLich(body);
    if (act === 'hv_cancel')  return apiHuyLich(body);
    if (act === 'hv_mo_ca')   return apiMoCa(body);
    if (act === 'hv_luu_ca')  return apiLuuCa(body);
    if (act === 'hv_xoa_ca')  return apiXoaCa(body);
    if (act === 'hv_tongquan')return apiTongQuan(body);
    return jsonOut({ok:false, error:'unknown_action'});
  }catch(err){
    ghiLoi('lichApi/'+act, err);
    return jsonOut({ok:false, error:'internal'});
  }
}

/* ── tự đăng ký tài khoản ── */
function apiDangKy(b){
  var email = chuanEmail(b.email);
  var pass  = String(b.pass||'');
  var ten   = chuanTen(b.ten);

  if (!email || !pass || !ten)   return jsonOut({ok:false, error:'thieu'});
  if (!emailHopLe(email))        return jsonOut({ok:false, error:'email_sai'});
  if (pass.length < MK_TOI_THIEU)return jsonOut({ok:false, error:'mk_ngan'});
  if (ten.split(' ').length < 2) return jsonOut({ok:false, error:'ten_ngan'});

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return jsonOut({ok:false, error:'busy'});
  try{
    var ds = moiHV(), da = null;
    ds.forEach(function(r){ if (chuanEmail(r.email)===email) da = r });
    if (da) return jsonOut({ok:false, error:'da_ton_tai'});

    var ma = maTaiKhoan(ds);
    var salt = chuoiNgauNhien(16);
    var goi = tenGoi(ten);

    bang(SHEET_HV, HV_HEADERS).appendRow([
      ma, email, ten, goi, salt, bamMK(pass, salt),
      'cho', 'active', '', '', nowVN(), ''
    ]);

    tgBroadcastKb([
      '🙋 *Có người vừa đăng ký tài khoản*','',
      '👤 *'+ten+'*   _(gọi là '+goi+')_',
      '📧 `'+email+'`',
      '🕐 '+nowVN(),'',
      'Chọn vai trò để mở khoá tài khoản này:'
    ].join('\n'), [[
      {text:'🎓 Học viên', callback_data:'l:v:h:'+ma},
      {text:'🧑‍🏫 Mentor',  callback_data:'l:v:m:'+ma}
    ],[
      {text:'🚫 Từ chối · xoá', callback_data:'l:v:x:'+ma}
    ]]);

    return jsonOut({ok:true, cho:true});
  } finally { lock.releaseLock(); }
}

/* ── đăng nhập ── */
function apiDangNhap(b){
  var email = chuanEmail(b.email), pass = String(b.pass||'');
  if (!email || !pass) return jsonOut({ok:false, error:'thieu'});

  // chặn dò mật khẩu: 5 lần sai trong 10 phút là khoá tạm
  var cache = CacheService.getScriptCache(), khoa = 'dn_'+email;
  var sai = Number(cache.get(khoa) || 0);
  if (sai >= DN_TOI_DA) return jsonOut({ok:false, error:'khoa_tam'});

  var hv = hvTheoEmail(email);

  if (!hv || hv.trangthai==='off' || !bangNhau(bamMK(pass, hv.salt), hv.hash)){
    cache.put(khoa, String(sai+1), 600);
    return jsonOut({ok:false, error:'sai'});
  }
  cache.remove(khoa);

  // đã đúng mật khẩu nhưng Toàn chưa phân vai
  if (hv.vaitro !== 'hv' && hv.vaitro !== 'mentor')
    return jsonOut({ok:false, error:'cho_duyet'});

  // Token mang sẵn mã tài khoản ở đầu: "A7K3M.<40 ký tự ngẫu nhiên>".
  // Nhờ vậy aiDay() tìm thẳng đúng dòng thay vì băm thử từng người.
  // Phần bí mật vẫn là 40 ký tự ngẫu nhiên, mã ở đầu không giúp đoán được gì.
  var token = hv.ma + '.' + chuoiNgauNhien(40);
  var han = new Date(); han.setDate(han.getDate() + PHIEN_NGAY);
  ghiDong(SHEET_HV, HV_HEADERS, hv, {
    token: 'n1:' + bamNhanh(token),
    token_han: han.toISOString(),
    dangnhap_cuoi: nowVN()
  });

  return jsonOut({ok:true, token:token, ten:hv.ten_goi||hv.ten, vaitro:hv.vaitro});
}

/** Đổi token thành hồ sơ, hết hạn / chưa duyệt / bị khoá thì trả null */
function aiDay(token, dsHV){
  token = String(token||'');
  if (token.length < 20) return null;
  var ds = dsHV || moiHV();

  function dungPhien(r){
    if (!r.token || r.trangthai === 'off') return false;
    if (r.vaitro !== 'hv' && r.vaitro !== 'mentor') return false;
    if (r.token_han && new Date(r.token_han) < new Date()) return false;
    return true;
  }

  // Token kiểu mới ("MA.<ngẫu nhiên>") → nhảy thẳng tới đúng dòng, băm
  // đúng MỘT lần. Đây là chỗ đổi vài giây chờ thành vài mili giây.
  var cham = token.indexOf('.');
  if (cham > 0){
    var ma = token.slice(0, cham).toUpperCase(), hs = null;
    ds.forEach(function(r){ if (!hs && String(r.ma).toUpperCase() === ma) hs = r });
    if (!hs || !dungPhien(hs)) return null;
    if (String(hs.token).slice(0,3) !== 'n1:') return null;
    return bangNhau(String(hs.token).slice(3), bamNhanh(token)) ? hs : null;
  }

  // Token cũ (cấp trước bản này) — vẫn dò như trước để không ai bị đá ra
  // giữa chừng. Lần đăng nhập tới là tự chuyển sang kiểu mới.
  var ra = null;
  ds.forEach(function(r){
    if (ra || !dungPhien(r)) return;
    if (String(r.token).slice(0,3) === 'n1:') return;
    if (!bangNhau(bamMK(token, r.salt), r.token)) return;
    ra = r;
  });
  return ra;
}

/* ── xem lịch tuần: học viên và mentor thấy hai thứ khác nhau ── */
function apiXemLich(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});
  var d = duLieuTuan(me, b.tuan);
  d.ok = true;
  return jsonOut(d);
}

/**
 * Dựng dữ liệu một tuần cho đúng vai của người đang xem.
 * Tách riêng để đặt / huỷ / mở ca trả luôn lịch mới trong CÙNG một lượt —
 * trước đây trang phải gọi thêm một lượt nữa chỉ để tải lại, tức là chờ hai lần.
 */
function duLieuTuan(me, tuanXin, dsLich){
  var dau  = thuHai(String(tuanXin||'').match(/^\d{4}-\d{2}-\d{2}$/) ? tuanXin : homNay());
  var cuoi = congNgay(dau, 6);
  var bay  = homNay();
  var giờNay = new Date();
  var laMentor = me.vaitro === 'mentor';

  var ngays = {};
  for (var i=0;i<7;i++){
    var n = congNgay(dau, i);
    ngays[n] = {ngay:n, thu:tenThu(n), gon:ngayGon(n), qua:(n < bay), slots:[]};
  }

  var tatCa = gomTrung(dsLich || moiLich());
  tatCa.forEach(function(r){
    if (r.ngay < dau || r.ngay > cuoi) return;
    if (r.trangthai === 'off') return;
    var daDat = r.trangthai === 'booked';

    if (laMentor){
      // mentor chỉ thấy ca của chính mình, kèm tên người đã đặt
      if (String(r.mentor_ma) !== String(me.ma)) return;
      ngays[r.ngay].slots.push({
        id:r.id, batdau:r.batdau, ketthuc:r.ketthuc, dat:daDat,
        hvTen: daDat ? (r.hv_ten||'') : '',
        hvEmail: daDat ? (r.hv_email||'') : '',
        qua: mocGio(r.ngay, r.batdau) < giờNay
      });
    } else {
      // học viên: ca người khác đã đặt thì giấu, ca của mình thì hiện rõ
      var cuaToi = daDat && String(r.hv_ma) === String(me.ma);
      if (daDat && !cuaToi) return;
      ngays[r.ngay].slots.push({
        id:r.id, mentor:r.mentor_ten, batdau:r.batdau, ketthuc:r.ketthuc,
        dat:daDat, cuaToi:cuaToi,
        qua: mocGio(r.ngay, r.batdau) < giờNay
      });
    }
  });

  var ds = Object.keys(ngays).sort().map(function(k){
    ngays[k].slots.sort(function(a,c){ return a.batdau < c.batdau ? -1 : 1 });
    return ngays[k];
  });

  var cf = cfgLich();
  return {ten:me.ten_goi||me.ten, vaitro:me.vaitro,
          tuan:dau, ngays:ds, ca:CA, nhacTruoc:cf.nhacTruoc,
          toiDa: laMentor ? 0 : cf.toiDa,
          daDat: laMentor ? 0 : demCaTuan(me.ma, dau, tatCa)};
}

/* ── học viên đặt ca ── */
function apiDatLich(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});
  if (me.vaitro !== 'hv') return jsonOut({ok:false, error:'khong_phai_hv'});

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return jsonOut({ok:false, error:'busy'});
  try{
    var tatCa = moiLich(), slot = null;
    tatCa.forEach(function(r){ if (r.id === String(b.slotId)) slot = r; });
    if (!slot) return jsonOut({ok:false, error:'khong_thay'});
    if (slot.trangthai === 'booked') return jsonOut({ok:false, error:'da_co_nguoi'});
    if (slot.trangthai === 'off')    return jsonOut({ok:false, error:'khong_thay'});
    if (mocGio(slot.ngay, slot.batdau) < new Date())
      return jsonOut({ok:false, error:'da_qua'});

    // mỗi tuần chỉ giữ được tối đa mấy ca, để còn chỗ cho bạn khác
    var cf = cfgLich();
    if (cf.toiDa > 0){
      var da = demCaTuan(me.ma, slot.ngay, tatCa);
      if (da >= cf.toiDa)
        return jsonOut({ok:false, error:'qua_nhieu', toiDa:cf.toiDa, daDat:da,
                        tuan:thuHai(slot.ngay)});
    }

    var nhac = new Date(mocGio(slot.ngay, slot.batdau).getTime()
                        - cfgLich().nhacTruoc*3600*1000);
    var goi = me.ten_goi || me.ten;

    // sáu cột này nằm liền nhau → một lượt ghi thay vì sáu lần chờ
    var moi = {trangthai:'booked', hv_ma:me.ma, hv_ten:goi, hv_email:me.email,
               nhac_luc:nhac.toISOString(), da_nhac:''};
    ghiDong(SHEET_LICH, LICH_HEADERS, slot, moi);
    for (var c in moi) slot[c] = moi[c];   // giữ bản trong bộ nhớ khớp với sheet

    tgBroadcast([
      '📅 *'+goi+' vừa đặt lịch kèm 1:1*','',
      '👤 '+me.ten+'   _(gọi là '+goi+')_',
      '📧 `'+me.email+'`',
      '🗓 '+tenThu(slot.ngay)+' '+ngayGon(slot.ngay)+' · '+slot.batdau+'–'+slot.ketthuc,
      '🧑‍🏫 Mentor: '+(slot.mentor_ten||'—'),'',
      '_Sẽ nhắc lại trước '+cfgLich().nhacTruoc+' tiếng._'
    ].join('\n'));

    return jsonOut({ok:true, lich: duLieuTuan(me, slot.ngay, tatCa)});
  } finally { lock.releaseLock(); }
}

/* ── huỷ ca: học viên huỷ ca mình đặt, mentor huỷ ca trên lịch mình ── */
function apiHuyLich(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});

  var tatCa = moiLich(), slot = null;
  tatCa.forEach(function(r){ if (r.id === String(b.slotId)) slot = r; });
  if (!slot) return jsonOut({ok:false, error:'khong_thay'});

  var laChu = (me.vaitro === 'hv'     && String(slot.hv_ma)     === String(me.ma)) ||
              (me.vaitro === 'mentor' && String(slot.mentor_ma) === String(me.ma));
  if (!laChu) return jsonOut({ok:false, error:'khong_phai_cua_ban'});

  var aiHuy = me.ten_goi || me.ten;
  var hvCu  = slot.hv_ten || slot.hv_email || 'học viên';

  var moi = {trangthai:'open', hv_ma:'', hv_ten:'', hv_email:'', nhac_luc:'', da_nhac:''};
  ghiDong(SHEET_LICH, LICH_HEADERS, slot, moi);
  for (var c in moi) slot[c] = moi[c];

  tgBroadcast('↩️ *'+aiHuy+'* vừa huỷ buổi '+
    tenThu(slot.ngay)+' '+ngayGon(slot.ngay)+' · '+slot.batdau+'–'+slot.ketthuc+
    (me.vaitro==='mentor' ? '\nNgười đã đặt: '+hvCu+' — nhớ báo lại giúp họ.'
                          : '\nMentor: '+(slot.mentor_ten||'—')+' · ca mở lại cho bạn khác.'));

  return jsonOut({ok:true, lich: duLieuTuan(me, slot.ngay, tatCa)});
}

/* ── mentor mở / đóng ca ngay trên trang ── */
function apiMoCa(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});
  if (me.vaitro !== 'mentor') return jsonOut({ok:false, error:'khong_phai_mentor'});

  var ngay = String(b.ngay||'');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return jsonOut({ok:false, error:'ngay_sai'});
  if (ngay < homNay()) return jsonOut({ok:false, error:'da_qua'});

  var g;
  if (b.caMa){
    CA.forEach(function(c){ if (c.ma === String(b.caMa)) g = {batdau:c.batdau, ketthuc:c.ketthuc} });
    if (!g) return jsonOut({ok:false, error:'ca_la'});
  } else {
    g = chuanGio(String(b.batdau||'')+'-'+String(b.ketthuc||''));
    if (!g) return jsonOut({ok:false, error:'gio_sai'});
  }
  if (mocGio(ngay, g.batdau) < new Date()) return jsonOut({ok:false, error:'da_qua'});

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return jsonOut({ok:false, error:'busy'});
  try{
    var co = null;
    moiLich().forEach(function(r){
      if (String(r.mentor_ma)===String(me.ma) && r.ngay===ngay &&
          r.batdau===g.batdau && r.ketthuc===g.ketthuc && r.trangthai!=='off') co = r;
    });

    // bấm lại ca đang mở = đóng ca; ca đã có người đặt thì không đóng được
    if (co){
      if (co.trangthai === 'booked') return jsonOut({ok:false, error:'da_co_nguoi'});
      ghiO(SHEET_LICH, LICH_HEADERS, co.row, 'trangthai', 'off');
      return jsonOut({ok:true, mo:false, lich: duLieuTuan(me, ngay)});
    }

    bang(SHEET_LICH, LICH_HEADERS).appendRow([
      'L'+chuoiNgauNhien(6), me.ma, me.ten_goi||me.ten, ngay, g.batdau, g.ketthuc,
      'open', '', '', '', '', '', nowVN()
    ]);
    return jsonOut({ok:true, mo:true, lich: duLieuTuan(me, ngay)});
  } finally { lock.releaseLock(); }
}

/**
 * Lưu NHIỀU thay đổi ca trong MỘT lượt gọi.
 * Mentor tick qua tick lại trên trang bao nhiêu cũng được — không đụng
 * máy chủ lần nào — rồi bấm Lưu một cái là gửi hết lên đây. Trước đây
 * mỗi cái tick là một lượt đi–về, mở lịch cả tuần là mười mấy lượt chờ.
 * Nhận: ca = [{ngay, batdau, ketthuc, mo:true|false}, …]
 */
var LUU_CA_TOI_DA = 60;

function apiLuuCa(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});
  if (me.vaitro !== 'mentor') return jsonOut({ok:false, error:'khong_phai_mentor'});

  var xin = b.ca;
  if (!xin || !xin.length) return jsonOut({ok:false, error:'trong'});
  if (xin.length > LUU_CA_TOI_DA)
    return jsonOut({ok:false, error:'qua_nhieu_ca', toiDa:LUU_CA_TOI_DA});

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return jsonOut({ok:false, error:'busy'});
  try{
    var tatCa = moiLich(), bay = new Date();

    // tra nhanh ca đang mở của chính mình
    var dangCo = {};
    tatCa.forEach(function(r){
      if (String(r.mentor_ma) !== String(me.ma) || r.trangthai === 'off') return;
      dangCo[r.ngay+'|'+r.batdau+'|'+r.ketthuc] = r;
    });

    var themVao = [], dong = [], boQua = [], tuan = null;

    xin.forEach(function(x){
      var ngay = String(x.ngay||'');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return;
      var g = chuanGio(String(x.batdau||'')+'-'+String(x.ketthuc||''));
      if (!g) return;
      if (!tuan) tuan = ngay;

      var khoa = ngay+'|'+g.batdau+'|'+g.ketthuc;
      var co = dangCo[khoa];
      var nhan = tenThu(ngay)+' '+ngayGon(ngay)+' '+g.batdau+'–'+g.ketthuc;

      if (x.mo){
        if (co) return;                                   // đã mở sẵn
        if (mocGio(ngay, g.batdau) < bay) return boQua.push(nhan+' — đã qua giờ');
        themVao.push(['L'+chuoiNgauNhien(6), me.ma, me.ten_goi||me.ten,
                      ngay, g.batdau, g.ketthuc, 'open', '', '', '', '', '', nowVN()]);
        dangCo[khoa] = {moiThem:true};   // chặn trùng ngay trong cùng một lượt gửi
      } else {
        if (!co || co.moiThem) return;                    // vốn đã đóng
        if (co.trangthai === 'booked')
          return boQua.push(nhan+' — '+(co.hv_ten||'có người')+' đã đặt, không đóng được');
        dong.push(co);
        delete dangCo[khoa];
      }
    });

    // ghi thành khối: thêm bao nhiêu ca cũng chỉ một lượt ghi
    if (themVao.length){
      var sh = bang(SHEET_LICH, LICH_HEADERS);
      sh.getRange(sh.getLastRow()+1, 1, themVao.length, LICH_HEADERS.length)
        .setValues(themVao);
    }
    dong.forEach(function(r){
      ghiO(SHEET_LICH, LICH_HEADERS, r.row, 'trangthai', 'off');
    });

    return jsonOut({ok:true, them:themVao.length, dong:dong.length, boQua:boQua,
                    lich: duLieuTuan(me, tuan)});
  } finally { lock.releaseLock(); }
}

/** Mentor gỡ hẳn một ca trống khỏi lịch */
function apiXoaCa(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});
  if (me.vaitro !== 'mentor') return jsonOut({ok:false, error:'khong_phai_mentor'});

  var slot = null;
  moiLich().forEach(function(r){ if (r.id === String(b.slotId)) slot = r; });
  if (!slot) return jsonOut({ok:false, error:'khong_thay'});
  if (String(slot.mentor_ma) !== String(me.ma))
    return jsonOut({ok:false, error:'khong_phai_cua_ban'});
  if (slot.trangthai === 'booked') return jsonOut({ok:false, error:'da_co_nguoi'});

  ghiO(SHEET_LICH, LICH_HEADERS, slot.row, 'trangthai', 'off');
  return jsonOut({ok:true, lich: duLieuTuan(me, slot.ngay)});
}

/* ── tổng quan lớp: mentor nào cũng thấy lịch của nhau + tình hình học viên ── */
function apiTongQuan(b){
  var me = aiDay(b.token);
  if (!me) return jsonOut({ok:false, error:'het_phien'});
  if (me.vaitro !== 'mentor') return jsonOut({ok:false, error:'khong_phai_mentor'});

  var dau  = thuHai(String(b.tuan||'').match(/^\d{4}-\d{2}-\d{2}$/) ? b.tuan : homNay());
  var cuoi = congNgay(dau, 6);
  var bay  = homNay();
  var gioNay = new Date();

  var ngays = {};
  for (var i=0;i<7;i++){
    var n = congNgay(dau, i);
    ngays[n] = {ngay:n, thu:tenThu(n), gon:ngayGon(n), qua:(n < bay), slots:[]};
  }

  // gom theo mentor và theo học viên trong tuần này
  var mentors = {}, datCua = {};
  var caMo = 0, caDat = 0;
  gomTrung(moiLich()).forEach(function(r){
    if (r.ngay < dau || r.ngay > cuoi || r.trangthai === 'off') return;
    var daDat = r.trangthai === 'booked';
    ngays[r.ngay].slots.push({
      id:r.id, mentor:r.mentor_ten||'—', mentorMa:r.mentor_ma,
      cuaToi: String(r.mentor_ma) === String(me.ma),
      batdau:r.batdau, ketthuc:r.ketthuc, dat:daDat,
      hvTen: daDat ? (r.hv_ten||'') : '',
      qua: mocGio(r.ngay, r.batdau) < gioNay
    });
    var k = String(r.mentor_ma);
    mentors[k] = mentors[k] || {ma:k, ten:r.mentor_ten||'—', mo:0, dat:0};
    mentors[k].mo++;
    if (daDat){ mentors[k].dat++; caDat++; datCua[String(r.hv_ma)] = (datCua[String(r.hv_ma)]||0)+1; }
    else caMo++;
  });

  // mentor đã được duyệt nhưng tuần này chưa mở ca nào cũng hiện, để biết ai đang vắng
  var dsHV = moiHV();
  dsHV.forEach(function(r){
    if (r.vaitro !== 'mentor' || r.trangthai === 'off') return;
    var k = String(r.ma);
    if (!mentors[k]) mentors[k] = {ma:k, ten:r.ten_goi||r.ten, mo:0, dat:0};
  });

  var hocvien = dsHV.filter(function(r){ return r.vaitro==='hv' && r.trangthai!=='off' })
    .map(function(r){
      return {ten:r.ten_goi||r.ten, email:r.email, daDat:datCua[String(r.ma)]||0,
              vao: r.dangnhap_cuoi || ''};
    })
    .sort(function(a,c){ return a.daDat - c.daDat || (a.ten < c.ten ? -1 : 1) });

  var dsMentor = Object.keys(mentors).map(function(k){ return mentors[k] })
    .sort(function(a,c){ return c.mo - a.mo || (a.ten < c.ten ? -1 : 1) });

  var ds = Object.keys(ngays).sort().map(function(k){
    ngays[k].slots.sort(function(a,c){
      return a.batdau < c.batdau ? -1 : a.batdau > c.batdau ? 1 : (a.mentor < c.mentor ? -1 : 1) });
    return ngays[k];
  });

  var hvDaDat = hocvien.filter(function(h){ return h.daDat > 0 }).length;
  var mentorMoCa = dsMentor.filter(function(m){ return m.mo > 0 }).length;
  return jsonOut({ok:true, tuan:dau, ngays:ds, mentors:dsMentor, hocvien:hocvien,
    toiDa: cfgLich().toiDa,
    tong:{ mentor:dsMentor.length, mentorMoCa:mentorMoCa, caMo:caMo, caDat:caDat,
           hvTong:hocvien.length, hvDaDat:hvDaDat, hvChua:hocvien.length - hvDaDat }});
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
      '⏰ *Nhắc buổi kèm 1:1* — còn khoảng '+conLai+' tiếng','',
      '👤 '+(r.hv_ten||r.hv_email),
      '📧 `'+r.hv_email+'`',
      '🗓 '+tenThu(r.ngay)+' '+ngayGon(r.ngay)+' · '+r.batdau+'–'+r.ketthuc,
      '🧑‍🏫 Mentor: '+(r.mentor_ten||'—')
    ].join('\n'));
    ghiO(SHEET_LICH, LICH_HEADERS, r.row, 'da_nhac', nowVN());
  });
}

/* ═══════════════ ĐỌC GIỜ TỰ NHẬP ═══════════════ */

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

/* ═══════════════ BOT — CHỈ QUẢN LÝ NGƯỜI DÙNG ═══════════════ */

var LENH_LICH = ['lich','lichtuan','dstk','vaitro','xoatk','doimk',
                 'nhactruoc','toida','donlich'];

function lichCoLenh(cmd){
  return LENH_LICH.indexOf(cmd) > -1;
}

function lichLenh(cmd, arg, chatId, msg){
  switch(cmd){
    case 'lich': case 'lichtuan': return xemLichTuan(chatId, arg);
    case 'dstk':      return dsTaiKhoan(chatId);
    case 'vaitro':    return doiVaiTro(chatId, arg);
    case 'xoatk':     return xoaTaiKhoan(chatId, arg);
    case 'doimk':     return capLaiMatKhau(chatId, arg);

    case 'nhactruoc': {
      if (!arg){ datCho(chatId,'nhactruoc');
        return tgSend(chatId,'⏰ Đang nhắc trước *'+cfgLich().nhacTruoc+
          ' tiếng*.\n\n👉 Nhắn số giờ mới vào tin tiếp theo (VD `6`), hoặc /huy.'); }
      var g = Number(String(arg).replace(/[^\d.]/g,''));
      if (!g || g <= 0 || g > 72)
        return tgSend(chatId,'Nhập số giờ từ 1 đến 72 nhé.');
      luuLich('nhacTruoc', g);
      return tgSend(chatId,'✅ Sẽ nhắc trước *'+g+' tiếng* cho các lịch đặt từ giờ.');
    }

    case 'toida':   return datToiDa(chatId, arg);
    case 'donlich': return donLich(chatId, arg);
  }
}

/* ── dọn lịch: gỡ ca trùng, hoặc xoá sạch ca chưa ai đặt ──────────────
   Ca trùng là di chứng của lỗi đọc giờ lệch 7 phút: nút bấm lại không
   khớp được ca cũ nên mỗi lần bấm đẻ thêm một dòng. Code đã sửa, nhưng
   dòng lỡ tạo thì vẫn nằm đó, phải dọn tay một lần.                  */
function donLich(chatId, arg){
  var ds = moiLich().filter(function(r){ return r.trangthai !== 'off' });
  var a = String(arg||'').trim().toLowerCase();

  // gom nhóm theo mentor + ngày + giờ để tìm ca trùng
  var nhom = {};
  ds.forEach(function(r){
    var k = r.mentor_ma+'|'+r.ngay+'|'+r.batdau+'|'+r.ketthuc;
    (nhom[k] = nhom[k] || []).push(r);
  });
  var thua = [];
  Object.keys(nhom).forEach(function(k){
    var g = nhom[k];
    if (g.length < 2) return;
    // giữ lại ca đã có người đặt; không có ai đặt thì giữ ca đầu tiên
    var giu = null;
    g.forEach(function(r){ if (!giu && r.trangthai === 'booked') giu = r });
    if (!giu) giu = g[0];
    g.forEach(function(r){ if (r !== giu && r.trangthai !== 'booked') thua.push(r) });
  });
  var trong = ds.filter(function(r){ return r.trangthai !== 'booked' });
  var daDat = ds.length - trong.length;

  if (!a){
    datCho(chatId,'donlich');
    return tgSend(chatId, [
      '🧹 *Dọn lịch*','',
      'Đang có *'+ds.length+' ca* trên lịch:',
      '· '+trong.length+' ca trống',
      '· '+daDat+' ca đã có người đặt',
      thua.length ? '· ⚠️ *'+thua.length+' ca bị trùng* (cùng mentor, cùng ngày giờ)' : '· không có ca nào trùng',
      '',
      'Nhắn vào tin tiếp theo:',
      '`trung` — chỉ gỡ '+thua.length+' ca trùng, giữ nguyên phần còn lại',
      '`tatca` — xoá sạch *'+trong.length+' ca trống* (ca đã có người đặt vẫn giữ)',
      '/huy — thôi, không đụng gì',
      '',
      '_Ca xoá chỉ bị ẩn khỏi lịch, dòng vẫn nằm trong Sheet để đối chiếu._'
    ].join('\n'));
  }

  if (a === 'trung'){
    if (!thua.length) return tgSend(chatId,'Không có ca nào trùng. Lịch sạch rồi.');
    thua.forEach(function(r){ ghiO(SHEET_LICH, LICH_HEADERS, r.row, 'trangthai', 'off') });
    return tgSend(chatId,'🧹 Đã gỡ *'+thua.length+' ca trùng*. Gõ /lichtuan để xem lại.');
  }

  if (/^(tatca|tat ca|tất cả|xoahet|xoa het)$/.test(a)){
    if (!trong.length) return tgSend(chatId,'Không còn ca trống nào để xoá.');
    trong.forEach(function(r){ ghiO(SHEET_LICH, LICH_HEADERS, r.row, 'trangthai', 'off') });
    return tgSend(chatId, '🧹 Đã xoá sạch *'+trong.length+' ca trống*.'+
      (daDat ? '\nGiữ nguyên '+daDat+' ca đã có người đặt.' : '')+
      '\n\nMentor vào khu học viên tick lại lịch rảnh rồi bấm *Lưu* nhé.');
  }

  return tgSend(chatId,'Nhắn `trung` hoặc `tatca` nhé. Gõ /donlich để xem lại số liệu.');
}

/* ── nút bấm: phân vai / xoá tài khoản ── */
function lichCallback(cb){
  var chatId = cb.message && cb.message.chat && cb.message.chat.id;
  if (!isAdmin(chatId)) return tgAnswer(cb.id, 'Không có quyền');

  var p = String(cb.data||'').split(':');   // l : v : h|m|x : <ma>
  if (p[1] !== 'v') return tgAnswer(cb.id);

  var loai = p[2], ma = p[3];
  var hv = hvTheoMa(ma);
  if (!hv) return tgAnswer(cb.id, 'Tài khoản này không còn');

  var nhan, tomTat;
  if (loai === 'h'){
    ghiO(SHEET_HV, HV_HEADERS, hv.row, 'vaitro', 'hv');
    ghiO(SHEET_HV, HV_HEADERS, hv.row, 'trangthai', 'active');
    nhan = '🎓 '+hv.ten+' — học viên';
    tomTat = 'Đã mở quyền học viên';
  } else if (loai === 'm'){
    ghiO(SHEET_HV, HV_HEADERS, hv.row, 'vaitro', 'mentor');
    ghiO(SHEET_HV, HV_HEADERS, hv.row, 'trangthai', 'active');
    nhan = '🧑‍🏫 '+hv.ten+' — mentor';
    tomTat = 'Đã mở quyền mentor';
  } else if (loai === 'x'){
    bang(SHEET_HV, HV_HEADERS).deleteRow(hv.row);
    nhan = '🚫 '+hv.ten+' — đã từ chối';
    tomTat = 'Đã xoá tài khoản';
  } else {
    return tgAnswer(cb.id);
  }

  tgApi('editMessageReplyMarkup',{
    chat_id: chatId, message_id: cb.message.message_id,
    reply_markup:{inline_keyboard:[[{text:nhan, callback_data:'xong'}]]}
  });
  return tgAnswer(cb.id, tomTat);
}

/* ── giới hạn mỗi học viên đặt mấy ca một tuần ── */
function datToiDa(chatId, arg){
  var dang = cfgLich().toiDa;
  if (!arg){
    datCho(chatId,'toida');
    return tgSend(chatId,[
      '🎫 Mỗi học viên đang đặt được tối đa *'+
        (dang>0 ? dang+' ca một tuần' : 'không giới hạn')+'*.','',
      '👉 Nhắn số mới vào tin tiếp theo (VD `2`),',
      'nhắn `0` để bỏ giới hạn, hoặc /huy.'
    ].join('\n'));
  }
  var n = Number(String(arg).replace(/[^\d]/g,''));
  if (String(arg).replace(/[^\d]/g,'') === '' || isNaN(n) || n > 20)
    return tgSend(chatId,'Nhập một con số từ 0 đến 20 nhé. `0` là bỏ giới hạn.');

  luuLich('toiDa', n);

  // đếm xem tuần này ai đang giữ quá số mới, để biết mà xử lý
  var ds = moiLich(), dem = {};
  ds.forEach(function(r){
    if (r.trangthai !== 'booked' || !r.hv_ma) return;
    if (r.ngay < thuHai(homNay())) return;
    var k = r.hv_ma+'|'+thuHai(r.ngay);
    dem[k] = (dem[k]||0) + 1;
  });
  var qua = [];
  Object.keys(dem).forEach(function(k){
    if (n > 0 && dem[k] > n){
      var hv = hvTheoMa(k.split('|')[0]);
      qua.push((hv ? (hv.ten_goi||hv.ten) : k.split('|')[0])+
               ' — tuần '+ngayGon(k.split('|')[1])+': '+dem[k]+' ca');
    }
  });

  return tgSend(chatId, [
    n > 0
      ? '✅ Mỗi học viên đặt tối đa *'+n+' ca một tuần*.'
      : '✅ Đã *bỏ giới hạn* — học viên đặt bao nhiêu ca cũng được.',
    n > 0 ? '_Đặt quá số sẽ bị chặn ngay trên trang._' : ''
  ].concat(qua.length ? ['', '⚠️ Đang có người giữ nhiều hơn số vừa đặt:']
                        .concat(qua)
                        .concat(['', '_Lịch cũ vẫn giữ nguyên, chỉ lần đặt mới bị chặn._'])
                      : [])
   .filter(String).join('\n'));
}

/* ── xem lịch cả tuần trong bot (chỉ đọc) ── */
function xemLichTuan(chatId, arg){
  var dau = thuHai(String(arg||'').match(/^\d{4}-\d{2}-\d{2}$/) ? arg : homNay());
  var ds = gomTrung(moiLich()).filter(function(r){
    return r.ngay >= dau && r.ngay <= congNgay(dau,6) && r.trangthai !== 'off';
  });
  if (!ds.length)
    return tgSend(chatId,'Tuần '+ngayGon(dau)+' → '+ngayGon(congNgay(dau,6))+
      ' chưa mentor nào mở ca.\n_Mentor mở ca trong khu học viên trên web._');

  var dong = ['📅 *Tuần '+ngayGon(dau)+' → '+ngayGon(congNgay(dau,6))+'*'];
  for (var i=0;i<7;i++){
    var n = congNgay(dau,i);
    var caNgay = ds.filter(function(r){ return r.ngay===n })
                   .sort(function(a,b){ return a.batdau<b.batdau?-1:1 });
    if (!caNgay.length) continue;
    dong.push('', '*'+tenThu(n)+' '+ngayGon(n)+'*');
    caNgay.forEach(function(r){
      dong.push((r.trangthai==='booked'?'🔒 ':'🟢 ')+r.batdau+'–'+r.ketthuc+
        ' · '+(r.mentor_ten||'—')+
        (r.trangthai==='booked'?'  ← '+(r.hv_ten||r.hv_email):''));
    });
  }
  dong.push('', '🟢 còn trống · 🔒 đã có người đặt');
  return tgSend(chatId, dong.join('\n'));
}

/* ── danh sách tài khoản ── */
function dsTaiKhoan(chatId){
  var ds = moiHV();
  if (!ds.length) return tgSend(chatId,
    'Chưa ai đăng ký tài khoản.\n_Mọi người tự đăng ký ở khu học viên trên web._');

  var cho = ds.filter(function(r){ return r.vaitro!=='hv' && r.vaitro!=='mentor' });
  var men = ds.filter(function(r){ return r.vaitro==='mentor' });
  var hvs = ds.filter(function(r){ return r.vaitro==='hv' });

  var dong = ['👥 *'+ds.length+' tài khoản*'];
  function khoi(tieude, list, icon){
    if (!list.length) return;
    dong.push('', '*'+tieude+' ('+list.length+')*');
    list.forEach(function(r){
      dong.push(icon+' '+r.ten+' — `'+r.email+'`'+
        (r.trangthai==='off' ? '  _(đang khoá)_' : '')+
        (r.dangnhap_cuoi ? '\n    vào lần cuối: '+r.dangnhap_cuoi : '\n    _chưa đăng nhập lần nào_'));
    });
  }
  khoi('Đang chờ phân vai', cho, '⏳');
  khoi('Mentor', men, '🧑‍🏫');
  khoi('Học viên', hvs, '🎓');

  dong.push('', '_Đổi vai: /vaitro mail hv · /vaitro mail mentor_');
  dong.push('_Xoá: /xoatk mail  ·  Cấp lại mật khẩu: /doimk mail_');

  // nút phân vai nhanh cho tối đa 4 người đang chờ
  var kb = cho.slice(0,4).map(function(r){ return [
    {text:'🎓 '+ (r.ten_goi||r.ten), callback_data:'l:v:h:'+r.ma},
    {text:'🧑‍🏫',                    callback_data:'l:v:m:'+r.ma},
    {text:'🚫',                      callback_data:'l:v:x:'+r.ma}
  ]});
  return tgSend(chatId, dong.join('\n'), kb.length ? kb : null);
}

/* ── đổi vai trò bằng lệnh ── */
function doiVaiTro(chatId, arg){
  if (!arg){ datCho(chatId,'vaitro');
    return tgSend(chatId,'Nhắn vào tin tiếp theo: `email hv` hoặc `email mentor`\n'+
      'VD: `an@gmail.com mentor`  ·  Gõ /dstk để xem danh sách.'); }

  var p = String(arg).trim().split(/\s+/);
  var hv = hvTheoEmail(p[0]);
  if (!hv) return tgSend(chatId,'Không thấy `'+p[0]+'`. Gõ /dstk để xem danh sách.');

  var v = String(p[1]||'').toLowerCase();
  var vai = /^(mentor|m|gv)$/.test(v) ? 'mentor'
          : /^(hv|h|hocvien|học viên)$/.test(v) ? 'hv' : '';
  if (!vai) return tgSend(chatId,'Vai trò phải là `hv` hoặc `mentor`.\nVD: `/vaitro '+hv.email+' mentor`');

  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'vaitro', vai);
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'trangthai', 'active');
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'token', '');   // đá phiên cũ để nạp lại đúng giao diện

  return tgSend(chatId,'✅ *'+hv.ten+'* giờ là *'+(vai==='mentor'?'mentor':'học viên')+'*.\n'+
    '_Họ cần đăng nhập lại để thấy đúng giao diện._');
}

/* ── xoá tài khoản ── */
function xoaTaiKhoan(chatId, arg){
  if (!arg){ datCho(chatId,'xoatk');
    return tgSend(chatId,'Nhắn email cần xoá vào tin tiếp theo. Gõ /dstk để xem danh sách.'); }
  var hv = hvTheoEmail(arg);
  if (!hv) return tgSend(chatId,'Không thấy `'+chuanEmail(arg)+'` trong danh sách.');

  var ten = hv.ten, vai = hv.vaitro;

  // trả lại các ca liên quan trước khi xoá, khỏi để lịch treo tên người đã đi
  var moLai = 0, goCa = 0;
  moiLich().forEach(function(r){
    if (vai === 'hv' && String(r.hv_ma) === String(hv.ma) && r.trangthai === 'booked'){
      ghiO(SHEET_LICH, LICH_HEADERS, r.row, 'trangthai', 'open');
      ['hv_ma','hv_ten','hv_email','nhac_luc','da_nhac'].forEach(function(c){
        ghiO(SHEET_LICH, LICH_HEADERS, r.row, c, '');
      });
      moLai++;
    }
    if (vai === 'mentor' && String(r.mentor_ma) === String(hv.ma) && r.trangthai !== 'off'){
      ghiO(SHEET_LICH, LICH_HEADERS, r.row, 'trangthai', 'off');
      goCa++;
    }
  });

  bang(SHEET_HV, HV_HEADERS).deleteRow(hv.row);

  return tgSend(chatId,'🗑 Đã xoá *'+ten+'*.'+
    (moLai ? '\n'+moLai+' ca họ đang giữ đã mở lại cho người khác.' : '')+
    (goCa  ? '\n'+goCa+' ca họ mở đã gỡ khỏi lịch.' : ''));
}

/* ── cấp lại mật khẩu ── */
function capLaiMatKhau(chatId, arg){
  if (!arg){ datCho(chatId,'doimk');
    return tgSend(chatId,'Nhắn email cần cấp lại mật khẩu vào tin tiếp theo.'); }
  var hv = hvTheoEmail(arg);
  if (!hv) return tgSend(chatId,'Không thấy `'+chuanEmail(arg)+'` trong danh sách.');

  var mk = chuoiNgauNhien(10);
  var salt = chuoiNgauNhien(16);
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'salt', salt);
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'hash', bamMK(mk, salt));
  ghiO(SHEET_HV, HV_HEADERS, hv.row, 'token', '');

  return tgSend(chatId, [
    '🔄 *Đã cấp lại mật khẩu cho '+hv.ten+'*','',
    '📧 `'+hv.email+'`',
    '🔑 `'+mk+'`','',
    'Gửi hai dòng trên cho họ. Mật khẩu chỉ hiện ở đây một lần.'
  ].join('\n'));
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
  var ds = moiHV();
  out.push('Tài khoản: '+ds.length+
    ' (chờ '+ds.filter(function(r){return r.vaitro!=='hv'&&r.vaitro!=='mentor'}).length+
    ' · mentor '+ds.filter(function(r){return r.vaitro==='mentor'}).length+
    ' · học viên '+ds.filter(function(r){return r.vaitro==='hv'}).length+')');
  out.push('Ca trong lịch: '+moiLich().filter(function(r){return r.trangthai!=='off'}).length+' đang mở');
  out.push('Nhắc trước: '+cfgLich().nhacTruoc+' tiếng');
  out.push('Tối đa mỗi học viên: '+(cfgLich().toiDa>0 ? cfgLich().toiDa+' ca/tuần' : 'không giới hạn'));
  out.push('PEPPER: '+(props().getProperty('PEPPER') ? '✔ đã có' : '✘ CHƯA — chạy lichSetup'));
  var n = ScriptApp.getProjectTriggers().filter(function(t){
    return t.getHandlerFunction()==='nhacLich' }).length;
  out.push('Lịch nhắc: '+(n ? '✔ '+n+' trigger' : '✘ chưa có — chạy lichSetup'));
  out.push('Hôm nay: '+homNay()+' · Thứ Hai tuần này: '+thuHai(homNay()));

  // Soi kiểu ô thật trong sheet — nguồn gốc của lỗi "mở ca rồi mà không thấy"
  var shL = bang(SHEET_LICH, LICH_HEADERS);
  if (shL.getLastRow() > 1){
    var o = shL.getRange(2, LICH_HEADERS.indexOf('ngay')+1).getValue();
    out.push('Ô ngày dòng 2: '+(o instanceof Date
      ? '⚠️ đang là Date — sheet cũ chưa ép văn bản (code mới vẫn đọc đúng)'
      : '✔ văn bản "'+o+'"'));
    var ds = moiLich().filter(function(r){
      return r.ngay >= thuHai(homNay()) && r.ngay <= congNgay(thuHai(homNay()),6)
             && r.trangthai !== 'off' });
    out.push('Ca đọc được trong tuần này: '+ds.length);
    ds.slice(0,5).forEach(function(r){
      out.push('  · '+r.ngay+' '+r.batdau+'–'+r.ketthuc+' · '+(r.mentor_ten||'—')+' · '+r.trangthai);
    });
  }
  Logger.log(out.join('\n'));
}
