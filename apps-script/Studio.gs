/**
 * ═══════════════════════════════════════════════════════════════
 *  Studio.gs — tài khoản NGƯỜI DÙNG của Viral Studio (tools/hook-text.html)
 * ═══════════════════════════════════════════════════════════════
 *  Các loại người dùng:
 *   • Người dùng tự đăng ký (email + SĐT + mật khẩu): 10 lượt AI phân tích hook miễn phí.
 *     Các tính năng Pro khác (font, tuỳ biến sâu, AI chỉnh chữ, xuất sạch) cần mua Pro.
 *   • Người dùng đã mua Pro: dùng Pro tới ngày hết hạn, AI 20 lượt mỗi ngày.
 *   • Học viên Tự Mình Xây Kênh và tài khoản vai 'pro' (bảng HocVien trong Lich.gs): Pro không giới hạn.
 *   • Khách chưa có tài khoản: 3 lượt AI thử theo thiết bị (HookAI.gs, tab HookThu).
 *
 *  Mở Pro sau khi chuyển khoản:
 *   • Người dùng quét QR chuyển tiền, bấm "Tôi đã chuyển khoản".
 *   • Bot Telegram nhắn về kèm nút "Đã nhận tiền · mở Pro". Bấm là Pro mở,
 *     tool của người dùng tự nhận trong vài giây.
 *
 *  STK, giá, số lượt: chỉnh bằng bot Telegram, gõ /studio để xem lệnh.
 *  Bot lưu vào Script properties, nên không cần sửa code hay deploy lại.
 *
 *  Cần thêm 3 dòng vào Code.gs (xem HUONG-DAN.md, mục Viral Studio).
 * ═══════════════════════════════════════════════════════════════
 */

/* ═══════ CẤU HÌNH BÁN PRO ═══════
   Cách dễ nhất: nhắn bot /stk, /giapro, /luotthu... (bot ghi vào Script properties, ưu tiên hơn giá trị ở đây).
   Để trống ở đây cũng được.
   Mã ngân hàng theo VietQR: VCB, MB, TCB, ACB, BIDV, VPB, TPB, VIB, STB, OCB, ICB (VietinBank)... */
var ST_NGAN_HANG_MD    = '';   // vd 'MB'
var ST_STK_MD          = '';   // số tài khoản nhận tiền
var ST_CHU_TK_MD       = '';   // tên chủ tài khoản, IN HOA KHÔNG DẤU
var ST_GOI_MD = [
  {ma:'m1', ten:'Pro 1 tháng', gia:50000, ngay:30}
  // thêm gói dài hơn nếu muốn, ví dụ: ,{ma:'m3', ten:'Pro 3 tháng', gia:129000, ngay:90}
];
var ST_LUOT_THU_MD = 10;       // số lượt AI phân tích miễn phí cho mỗi tài khoản mới (bot: /luotthu)
var ST_LUOT_THU = stSo('ST_LUOT_THU', ST_LUOT_THU_MD);

/* Gói cho học viên khoá: mặc định Pro miễn phí 30 ngày kể từ lúc tài khoản học viên được tạo.
   Bot chỉnh: /ngayhv 30 (0 = suốt đời) · /uudaihv câu ưu đãi · /giahv 0 (0 = miễn phí; >0 chỉ là con số hiện trên landing cho gói riêng của học viên). */
var ST_HV_MD = {ngay:30, gia:0, uu_dai:''};   // uu_dai: câu mời học viên trong bảng Nâng cấp (bot /uudaihv)
function stHV(){
  try{ var v = cfgProp('ST_HV'); if (v){ var o = JSON.parse(v); return {ngay: Number(o.ngay) || 0, gia: Number(o.gia) || 0, uu_dai: String(o.uu_dai || '')}; } }catch(e){}
  return ST_HV_MD;
}
function stNgayTu(s){
  s = String(s || ''); var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  var d = new Date(s); return isNaN(d) ? null : d;
}
/* Học viên còn trong hạn Pro không? Mentor và tài khoản không rõ ngày tạo thì luôn còn. */
function stHVConHan(hv){
  var n = stHV().ngay; if (!n || !hv || hv.vaitro !== 'hv') return true;
  var t = stNgayTu(hv.tao); return !t || (Date.now() - t.getTime()) < n * 864e5;
}

var ST_SHEET       = 'NguoiDung';
var ST_HEADERS     = ['ma','email','sdt','ten','salt','hash','goi','pro_han','luot_dung',
                      'token','token_han','tao','dangnhap_cuoi','trangthai','ghichu',
                      'ho_so','luot_kb','luot_soi','thiet_bi','canh_bao','luot_cham','luot_tai','luot_chat'];

/* Hạn mức lượt AI cho tài khoản MIỄN PHÍ, tính theo từng tool (bot: /luotthu, /luotkb, /luotsoi).
   Pro và học viên không dùng mấy con số này, họ tính theo hạn mức ngày HOOK_AI_DAILY. */
var ST_LUOT_KB_MD  = 3;        // chấm kịch bản viral
var ST_LUOT_SOI_MD = 1;        // soi video viral (nặng nhất: AI phải nghe cả video)
var ST_LUOT_CHAM_MD = 1;       // chấm video của chính học viên (AI phải xem cả video)
var ST_LUOT_KB   = stSo('ST_LUOT_KB',   ST_LUOT_KB_MD);
var ST_LUOT_SOI  = stSo('ST_LUOT_SOI',  ST_LUOT_SOI_MD);
var ST_LUOT_CHAM = stSo('ST_LUOT_CHAM', ST_LUOT_CHAM_MD);
var ST_LUOT_TAI_MD = 10;       // tool Tải video (không tốn AI): khách được bấy nhiêu lần, học viên và Pro không giới hạn. Bot: /luottai
var ST_LUOT_TAI  = stSo('ST_LUOT_TAI', ST_LUOT_TAI_MD);
var ST_LUOT_CHAT_MD = 15;      // trò chuyện với Trợ lý AI: số tin miễn phí của tài khoản Free. Bot: /luotchat
var ST_LUOT_CHAT = stSo('ST_LUOT_CHAT', ST_LUOT_CHAT_MD);
/* Mỗi tool một cột đếm riêng. 'hook' giữ nguyên cột cũ luot_dung để không mất số liệu. */
var ST_TOOL = {
  hook:   {cot:'luot_dung', ten:'AI phân tích hook', han:function(){ return ST_LUOT_THU  }},
  script: {cot:'luot_kb',   ten:'chấm kịch bản',     han:function(){ return ST_LUOT_KB   }},
  soi:    {cot:'luot_soi',  ten:'soi video viral',   han:function(){ return ST_LUOT_SOI  }},
  cham:   {cot:'luot_cham', ten:'chấm video của bạn', han:function(){ return ST_LUOT_CHAM }},
  taive:  {cot:'luot_tai',  ten:'tải video',          han:function(){ return ST_LUOT_TAI  }},
  chat:   {cot:'luot_chat', ten:'trò chuyện với trợ lý', han:function(){ return ST_LUOT_CHAT }}
};
function stToolCua(mode){
  if (mode === 'script' || mode === 'viet') return 'script';
  if (mode === 'soi' || mode === 'link' || mode === 'apkhuon') return 'soi';
  if (mode === 'cham') return 'cham';
  if (mode === 'chat' || mode === 'bh_them') return 'chat';
  return 'hook';
}

/* Lịch sử dùng AI của từng tài khoản: để mentor soi được ai đang dùng hộ người khác. */
var ST_LOG_SHEET   = 'AiLichSu';
var ST_LOG_HEADERS = ['thoi_gian','ma','ten','goi','tool','thiet_bi','noi_dung','ket_qua'];
var ST_TB_NGAY     = 7;        // xét thiết bị trong bao nhiêu ngày gần đây
var ST_TB_TOI_DA   = 3;        // quá số thiết bị này trong cửa sổ trên thì báo bot
var ST_PAY_SHEET   = 'ThanhToan';
var ST_PAY_HEADERS = ['ma_ck','ma_nd','email','sdt','ten','goi','so_tien','ngay',
                      'trangthai','tao','xac_nhan','nguon'];

function stCfg(k){
  var v = cfgProp(k); if (v) return v;
  return ({ST_NGAN_HANG:ST_NGAN_HANG_MD, ST_STK:ST_STK_MD, ST_CHU_TK:ST_CHU_TK_MD})[k] || '';
}
function stSo(k, macDinh){ var v = parseInt(PropertiesService.getScriptProperties().getProperty(k), 10); return isNaN(v) ? macDinh : v; }
function stGoi(){
  try{ var v = cfgProp('ST_GOI'); if (v) return JSON.parse(v); }catch(e){}
  return ST_GOI_MD;
}

/* ═══════ BẢNG ═══════ */
/* bang() đổi tên bảng cũ thành bản lưu khi số cột không khớp — thêm cột mới mà không
   nối sẵn tiêu đề là mất sạch tài khoản đã có. Hàm này nối thêm cột ngay trên bảng đang chạy. */
function stNangCap(){
  try{
    var sh = ss().getSheetByName(ST_SHEET);
    if (!sh || sh.getLastRow() < 1) return;
    var n = sh.getLastColumn();
    if (n >= ST_HEADERS.length) return;
    var cu = sh.getRange(1, 1, 1, n).getValues()[0].map(function(x){ return String(x) });
    for (var i = 0; i < n; i++) if (cu[i] !== ST_HEADERS[i]) return;   // tiêu đề lạ: để nguyên cho người kiểm tra
    var them = ST_HEADERS.slice(n);
    sh.getRange(1, n + 1, 1, them.length).setValues([them]);
    sh.getRange(1, n + 1, sh.getMaxRows(), them.length).setNumberFormat('@');
  }catch(e){ ghiLoi('stNangCap', e); }
}
function moiND(){  stNangCap(); return docBang(ST_SHEET, ST_HEADERS, {token_han:oMoc, pro_han:oMoc}); }
function moiPay(){ return docBang(ST_PAY_SHEET, ST_PAY_HEADERS); }
function ndTheoEmail(e){ e = chuanEmail(e); var r = null; moiND().forEach(function(x){ if (!r && chuanEmail(x.email) === e) r = x }); return r; }
function ndTheoMa(ma){ ma = String(ma||'').toUpperCase(); var r = null; moiND().forEach(function(x){ if (!r && String(x.ma).toUpperCase() === ma) r = x }); return r; }
function sdtHopLe(s){ var d = String(s||'').replace(/\D/g,''); return d.length >= 9 && d.length <= 12; }
function ndLaPro(nd){ return !!(nd && nd.pro_han && new Date(nd.pro_han) > new Date()); }
function ndLuotCon(nd, tool){
  var t = ST_TOOL[tool || 'hook'] || ST_TOOL.hook;
  return Math.max(0, t.han() - (parseInt(nd[t.cot], 10) || 0));
}
/* Hồ sơ kênh học viên: tool đọc để cá nhân hoá, học viên tự sửa trong tài khoản. */
var ST_HS_TRUONG = ['kenh','nganh','dinh_vi','doi_tuong','muc_tieu','xung_ho','dang','do_dai',
                    'text_batbuoc','nhac','hashtag','khong_lam','pillar','san_pham','ghi_chu'];
function ndDocHs(nd){
  try{ var o = JSON.parse(nd.ho_so || '{}'); return (o && typeof o === 'object') ? o : {}; }catch(e){ return {}; }
}
function ndLamHs(raw){
  var o = {};
  if (!raw || typeof raw !== 'object') return o;
  ST_HS_TRUONG.forEach(function(k){ if (raw[k] != null) o[k] = String(raw[k]).slice(0, 600).trim(); });
  return o;
}
function ndCoHs(hs){ var c = 0; ST_HS_TRUONG.forEach(function(k){ if (hs[k]) c++ }); return c; }
function ndHoSo(nd){
  return {loai:'nd', ma:nd.ma, ten:nd.ten, email:nd.email, sdt:nd.sdt, pro:ndLaPro(nd),
          pro_han:nd.pro_han, luot_con:ndLuotCon(nd), luot_thu:ST_LUOT_THU,
          luot: {hook:ndLuotCon(nd,'hook'), script:ndLuotCon(nd,'script'), soi:ndLuotCon(nd,'soi'), cham:ndLuotCon(nd,'cham'), taive:ndLuotCon(nd,'taive'), chat:ndLuotCon(nd,'chat')},
          han:  {hook:ST_LUOT_THU, script:ST_LUOT_KB, soi:ST_LUOT_SOI, cham:ST_LUOT_CHAM, taive:ST_LUOT_TAI, chat:ST_LUOT_CHAT},
          ho_so: hsHienDung(nd.email, nd.sdt, nd), ho_so_nguon: hsNguon(nd.email, nd.sdt, nd)};
}

/* Token người dùng: "U" + mã + "." + 40 ký tự ngẫu nhiên. Sheet chỉ giữ bản băm. */
function ndCapToken(nd){
  var token = 'U' + nd.ma + '.' + chuoiNgauNhien(40);
  var han = new Date(); han.setDate(han.getDate() + PHIEN_NGAY);
  ghiDong(ST_SHEET, ST_HEADERS, nd, {token: bamNhanh(token), token_han: han.toISOString(), dangnhap_cuoi: nowVN()});
  return token;
}
function ndTuToken(token, ds){
  token = String(token||'');
  if (token.charAt(0) !== 'U') return null;
  var cham = token.indexOf('.'); if (cham < 3) return null;
  var ma = token.slice(1, cham).toUpperCase(), nd = null;
  (ds || moiND()).forEach(function(r){ if (!nd && String(r.ma).toUpperCase() === ma) nd = r });
  if (!nd || nd.trangthai === 'off' || !nd.token) return null;
  if (nd.token_han && new Date(nd.token_han) < new Date()) return null;
  return bangNhau(String(nd.token), bamNhanh(token)) ? nd : null;
}

/* ═══════ API ═══════ */
function studioApi(b){
  var act = String(b.action||'');
  try{
    if (act === 'st_cfg')    return stCauHinh();
    if (act === 'st_signup') return stDangKy(b);
    if (act === 'st_login')  return stDangNhap(b);
    if (act === 'st_me')     return stToi(b);
    if (act === 'st_use')    return stDungLuot(b);
    if (act === 'st_buy')    return stMua(b);
    if (act === 'st_paid')   return stDaChuyen(b);
    if (act === 'st_hoso')   return stLuuHoSo(b);         // học viên tự sửa hồ sơ kênh; mentor sửa hộ khi có 'ma'
    if (act === 'st_ds')     return stDanhSach(b);         // mentor xem danh sách tài khoản
    if (act === 'st_lichsu') return stLichSu(b);           // mentor xem lịch sử dùng AI của một tài khoản
    if (act === 'st_khoa')      return stKhoa(b);          // form đăng ký học viên: có nhận chuyển khoản không
    if (act === 'st_khoa_paid') return stKhoaDaChuyen(b);  // học viên bấm "Tôi đã chuyển khoản"
    return jsonOut({ok:false, error:'unknown_action'});
  }catch(err){
    ghiLoi('studioApi/'+act, err);
    return jsonOut({ok:false, error:'internal'});
  }
}

function stNganHang(){ return {ngan_hang: stCfg('ST_NGAN_HANG'), stk: stCfg('ST_STK'), chu_tk: stCfg('ST_CHU_TK')}; }
/* Link group Zalo do bot đặt bằng /zalo — mọi màn hình "chờ duyệt" và "đã chuyển khoản" đều dùng chung. */
function stZalo(){
  try{ var c = getConfig(); return (c && c.zalo && c.zalo.groupUrl) || ''; }catch(e){ return ''; }
}
function stCauHinh(){
  var gk = {}; try{ gk = (getConfig() || {}).pricing || {}; }catch(e){}   // học phí khoá (bot /giasom, /gia) để bảng Nâng cấp so sánh
  return jsonOut({ok:true, goi: stGoi(), bank: stNganHang(), zalo: stZalo(), hv: stHV(), khoa: {gia_som: Number(gk.earlyBird) || 0, gia_goc: Number(gk.regular) || 0},
    luot_thu: ST_LUOT_THU, luot: {hook: ST_LUOT_THU, script: ST_LUOT_KB, soi: ST_LUOT_SOI, cham: ST_LUOT_CHAM, taive: ST_LUOT_TAI, chat: ST_LUOT_CHAT}});
}

/* ── đăng ký: không cần duyệt, có ngay lượt AI miễn phí ── */
function stDangKy(b){
  if (b.website) return jsonOut({ok:false, error:'thieu'});        // ô bẫy bot
  var email = chuanEmail(b.email), pass = String(b.pass||''), ten = chuanTen(b.ten), sdt = String(b.sdt||'').trim();
  if (!email || !pass || !ten || !sdt) return jsonOut({ok:false, error:'thieu'});
  if (!emailHopLe(email))              return jsonOut({ok:false, error:'email_sai'});
  if (!sdtHopLe(sdt))                  return jsonOut({ok:false, error:'sdt_sai'});
  if (pass.length < MK_TOI_THIEU)      return jsonOut({ok:false, error:'mk_ngan'});
  if (hvTheoEmail(email))              return jsonOut({ok:false, error:'la_hoc_vien'});

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return jsonOut({ok:false, error:'busy'});
  var nd;
  try{
    var ds = moiND();
    if (ds.some(function(r){ return chuanEmail(r.email) === email })) return jsonOut({ok:false, error:'da_ton_tai'});
    var ma = maTaiKhoan(ds), salt = chuoiNgauNhien(16);
    bang(ST_SHEET, ST_HEADERS).appendRow([ma, email, sdt, ten, salt, bamMK(pass, salt),
      'free', '', '0', '', '', nowVN(), '', 'active', String(b.nguon||'viral-studio')]);
    nd = ndTheoMa(ma);
  } finally { lock.releaseLock(); }

  var token = ndCapToken(nd);
  try{ tgBroadcast(['🆕 *Người dùng Viral Studio mới*','','👤 *'+ten+'*','📧 `'+email+'`','📱 `'+sdt+'`','🎁 '+ST_LUOT_THU+' lượt AI phân tích miễn phí','🕐 '+nowVN()].join('\n')); }catch(e){}
  nd.luot_dung = '0';
  return jsonOut({ok:true, token:token, ho_so: ndHoSo(nd)});
}

/* ── đăng nhập chung: người dùng Viral Studio hoặc học viên khu học viên ── */
function stDangNhap(b){
  var email = chuanEmail(b.email), pass = String(b.pass||'');
  if (!email || !pass) return jsonOut({ok:false, error:'thieu'});
  var cache = CacheService.getScriptCache(), khoa = 'st_dn_'+email;
  var sai = Number(cache.get(khoa) || 0);
  if (sai >= DN_TOI_DA) return jsonOut({ok:false, error:'khoa_tam'});

  var nd = ndTheoEmail(email);
  if (nd && nd.trangthai !== 'off' && bangNhau(bamMK(pass, nd.salt), nd.hash)){
    cache.remove(khoa);
    return jsonOut({ok:true, loai:'nd', token: ndCapToken(nd), ho_so: ndHoSo(nd)});
  }
  var hv = hvTheoEmail(email);
  if (hv && hv.trangthai !== 'off' && bangNhau(bamMK(pass, hv.salt), hv.hash)){
    cache.remove(khoa);
    if (hv.vaitro !== 'hv' && hv.vaitro !== 'mentor' && hv.vaitro !== 'pro') return jsonOut({ok:false, error:'cho_duyet'});
    // cùng kiểu token với khu học viên (Lich.gs) để hai trang dùng chung phiên
    var token = hv.ma + '.' + chuoiNgauNhien(40);
    var han = new Date(); han.setDate(han.getDate() + PHIEN_NGAY);
    ghiDong(SHEET_HV, HV_HEADERS, hv, {token:'n1:'+bamNhanh(token), token_han:han.toISOString(), dangnhap_cuoi:nowVN()});
    return jsonOut({ok:true, loai:'hv', token:token, ten:hv.ten_goi||hv.ten, vaitro:hv.vaitro,
                    ho_so:{loai:'hv', ten:hv.ten_goi||hv.ten, email:hv.email, pro:true, vaitro:hv.vaitro}});
  }
  cache.put(khoa, String(sai+1), 600);
  return jsonOut({ok:false, error:'sai'});
}

/* ── hồ sơ hiện tại ── */
function stToi(b){
  var nd = ndTuToken(b.token);
  if (nd){
    var hs = ndHoSo(nd), cho = null;
    moiPay().forEach(function(p){ if (p.ma_nd === nd.ma && p.trangthai === 'cho') cho = {ma_ck:p.ma_ck, so_tien:Number(p.so_tien), goi:p.goi} });
    hs.cho_ck = cho;
    return jsonOut({ok:true, ho_so:hs});
  }
  var hv = aiDay(b.token);
  if (hv) return jsonOut({ok:true, ho_so:{loai:'hv', ten:hv.ten_goi||hv.ten, email:hv.email, pro:true, vaitro:hv.vaitro,
    mentor: hv.vaitro === 'mentor' || hv.vaitro === 'admin',
    ho_so: hsHienDung(hv.email, '', null), ho_so_nguon: hsNguon(hv.email, '', null)}});
  return jsonOut({ok:false, error:'het_phien'});
}

/* ── lượt dùng thử: tài khoản Free trừ 1 lượt của ĐÚNG tool đang gọi; Pro và học viên không trừ ── */
function stTruLuot(ma, tool){
  var t = ST_TOOL[tool] || ST_TOOL.hook;
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var nd = ndTheoMa(ma); if (!nd) return -1;
    var han = t.han(), da = parseInt(nd[t.cot], 10) || 0;
    if (da >= han) return -1;
    var sua = {}; sua[t.cot] = String(da + 1);
    ghiDong(ST_SHEET, ST_HEADERS, nd, sua);
    return han - da - 1;
  } finally { lock.releaseLock(); }
}
function stHoanLuot(ma, tool){
  var t = ST_TOOL[tool] || ST_TOOL.hook;
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var nd = ndTheoMa(ma); if (!nd) return;
    var da = parseInt(nd[t.cot], 10) || 0;
    if (da > 0){ var sua = {}; sua[t.cot] = String(da - 1); ghiDong(ST_SHEET, ST_HEADERS, nd, sua); }
  } finally { lock.releaseLock(); }
}
function stTruLuotThu(ma){ return stTruLuot(ma, 'hook'); }     // tên cũ, giữ cho phần gọi sẵn
function stHoanLuotThu(ma){ return stHoanLuot(ma, 'hook'); }

/* ── lịch sử dùng AI ── */
function stGhiLog(nd, tool, dev, noiDung, ok){
  try{
    bang(ST_LOG_SHEET, ST_LOG_HEADERS).appendRow([nowVN(), nd.ma, nd.ten,
      ndLaPro(nd) ? 'pro' : 'free', String(tool || ''), String(dev || ''),
      String(noiDung || '').slice(0, 200), ok ? 'ok' : 'loi']);
  }catch(e){ ghiLoi('stGhiLog', e); }
}
function stLogCua(ma, n){
  var ds = [];
  try{
    docBang(ST_LOG_SHEET, ST_LOG_HEADERS).forEach(function(r){ if (String(r.ma) === String(ma)) ds.push(r) });
  }catch(e){}
  return ds.slice(-(n || 30)).reverse();
}

/* ── phát hiện một tài khoản đang được nhiều người dùng chung ──
   Không chặn, không làm phiền học viên: chỉ nhắn riêng cho mentor để tự kiểm tra lịch sử. */
function stGhiThietBi(nd, dev){
  dev = String(dev || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  if (dev.length < 8) return;
  var lock = LockService.getScriptLock();
  try{ lock.waitLock(8000); }catch(e){ return; }
  try{
    var moi = ndTheoMa(nd.ma); if (!moi) return;
    var ds = []; try{ ds = JSON.parse(moi.thiet_bi || '[]') || []; }catch(e){ ds = []; }
    if (!Array.isArray(ds)) ds = [];
    var luc = new Date().getTime(), thay = false;
    ds.forEach(function(x){ if (x && x.d === dev){ x.l = luc; x.n = (x.n || 0) + 1; thay = true; } });
    if (!thay) ds.push({d: dev, l: luc, n: 1, dau: luc});
    var moc = luc - ST_TB_NGAY * 86400000;
    ds = ds.filter(function(x){ return x && x.l > moc }).slice(-12);
    var sua = {thiet_bi: JSON.stringify(ds)};
    var lanCuoi = Number(moi.canh_bao) || 0;
    if (ds.length > ST_TB_TOI_DA && luc - lanCuoi > 86400000){
      sua.canh_bao = String(luc);
      stBaoDungChung(moi, ds);
    }
    ghiDong(ST_SHEET, ST_HEADERS, moi, sua);
  }catch(e){ ghiLoi('stGhiThietBi', e); }
  finally { try{ lock.releaseLock(); }catch(e){} }
}
function stBaoDungChung(nd, ds){
  try{
    var t = ['⚠️ *Tài khoản có thể đang dùng chung*',
      '*' + nd.ten + '* · `' + nd.ma + '`',
      nd.email + ' · ' + nd.sdt,
      'Gói: ' + (ndLaPro(nd) ? 'Pro' : 'Free'),
      ds.length + ' thiết bị khác nhau trong ' + ST_TB_NGAY + ' ngày (ngưỡng ' + ST_TB_TOI_DA + ').',
      '', 'Xem lịch sử: `/lichsu ' + nd.email + '`'].join('\n');
    dsChat('ADMIN_CHAT_IDS').forEach(function(id){ tgSend(id, t) });
  }catch(e){ ghiLoi('stBaoDungChung', e); }
}

/* ── báo hồ sơ kênh mới về bot Telegram ──
   Tool tự lưu mỗi lần học viên rời một ô, nên phải chặn spam: mỗi người tối đa
   15 phút một tin, và chỉ báo khi đã điền được từ 3 mục trở lên. */
var ST_HS_NHAN = {kenh:'Tên kênh', nganh:'Ngách', dinh_vi:'Định vị', doi_tuong:'Nói với ai',
  muc_tieu:'Mục tiêu', xung_ho:'Xưng hô', dang:'Định dạng', do_dai:'Độ dài',
  text_batbuoc:'Chữ bắt buộc', nhac:'Nhạc', hashtag:'Hashtag', khong_lam:'Không làm',
  pillar:'Pillar', san_pham:'Sản phẩm', ghi_chu:'Ghi chú'};

function stBaoHoSo(ten, email, sdt, hs, nguon){
  try{
    var so = ndCoHs(hs); if (so < 3) return;
    var k = 'hsbao_' + String(hsKhoa(email, sdt) || ten).replace(/[^A-Za-z0-9]/g, '').slice(0, 80);
    var c = CacheService.getScriptCache();
    if (c.get(k)) return;
    c.put(k, String(so), 900);
    var d = ['📋 *Hồ sơ kênh vừa được điền*', '', '👤 *' + (ten || '(chưa có tên)') + '*'];
    if (email) d.push('📧 `' + email + '`');
    if (sdt)   d.push('📱 `' + sdt + '`');
    d.push('✍️ ' + so + '/' + ST_HS_TRUONG.length + ' mục · ' + (nguon || 'sua_tay'), '');
    ST_HS_TRUONG.forEach(function(f){
      if (hs[f]) d.push('*' + (ST_HS_NHAN[f] || f) + ':* ' + String(hs[f]).slice(0, 300));
    });
    if (email) d.push('', 'Lịch sử dùng AI: `/lichsu ' + email + '`');
    dsChat('ADMIN_CHAT_IDS').forEach(function(id){ tgSend(id, d.join('\n')); });
  }catch(e){ ghiLoi('stBaoHoSo', e); }
}

/* ── hồ sơ kênh: học viên tự sửa; mentor sửa hộ bằng cách gửi thêm 'ma' ── */
function stLuuHoSo(b){
  var nd = ndTuToken(b.token), hv = nd ? null : aiDay(b.token);
  if (!nd && !hv) return jsonOut({ok:false, error:'het_phien'});
  var laMentor = !!(hv && (hv.vaitro === 'mentor' || hv.vaitro === 'admin'));
  var hs = ndLamHs(b.ho_so);

  // mentor sửa hộ người khác: nhận mã tài khoản Studio hoặc email của học viên
  if (b.ma || b.email_dich){
    if (!laMentor) return jsonOut({ok:false, error:'khong_co_quyen'});
    var dich = b.ma ? ndTheoMa(b.ma) : null;
    var em = dich ? dich.email : chuanEmail(b.email_dich), st = dich ? dich.sdt : (b.sdt_dich || '');
    if (!em && !st) return jsonOut({ok:false, error:'khong_thay'});
    var tenD = b.ten_dich || (dich ? dich.ten : '');
    hsGhi(em, st, tenD, hs, 'mentor');
    if (dich) ghiDong(ST_SHEET, ST_HEADERS, dich, {ho_so: JSON.stringify(hs)});
    stBaoHoSo(tenD, em, st, hs, 'mentor điền hộ');
    return jsonOut({ok:true, ho_so: hs});
  }

  var email = nd ? nd.email : hv.email, sdt = nd ? nd.sdt : '', ten = nd ? nd.ten : (hv.ten_goi || hv.ten);
  hsGhi(email, sdt, ten, hs, 'sua_tay');
  if (nd) ghiDong(ST_SHEET, ST_HEADERS, nd, {ho_so: JSON.stringify(hs)});
  stBaoHoSo(ten, email, sdt, hs, nd ? (ndLaPro(nd) ? 'tài khoản Pro tự điền' : 'tài khoản Free tự điền') : 'học viên tự điền');
  return jsonOut({ok:true, ho_so: hs});
}
/* Mentor xem danh sách tài khoản để chạy thử tool bằng hồ sơ thật của học viên. */
function stDanhSach(b){
  var hv = aiDay(b.token);
  if (!hv || (hv.vaitro !== 'mentor' && hv.vaitro !== 'admin')) return jsonOut({ok:false, error:'khong_co_quyen'});
  var ds = [], daCo = {};
  moiND().forEach(function(nd){
    var hs = hsHienDung(nd.email, nd.sdt, nd), k = hsKhoa(nd.email, nd.sdt);
    if (k) daCo[k] = 1;
    ds.push({ma:nd.ma, ten:nd.ten, email:nd.email, sdt:nd.sdt, goi: ndLaPro(nd) ? 'pro' : 'free',
      nguon:'tai_khoan', ho_so_nguon: hsNguon(nd.email, nd.sdt, nd),
      tao:nd.tao, dangnhap_cuoi:nd.dangnhap_cuoi, so_truong: ndCoHs(hs),
      luot: {hook:ndLuotCon(nd,'hook'), script:ndLuotCon(nd,'script'), soi:ndLuotCon(nd,'soi'), cham:ndLuotCon(nd,'cham')}, ho_so: hs});
  });
  // học viên mới điền form đăng ký khoá, chưa tạo tài khoản Viral Studio
  try{
    allRegs().forEach(function(r){
      var k = hsKhoa(r.email, r.phone);
      if (!k || daCo[k]) return;
      daCo[k] = 1;
      var hs = hsHienDung(r.email, r.phone, null);
      ds.push({ma:'', ten:r.name, email:r.email || '', sdt:r.phone || '', goi:'dk', nguon:'form_dang_ky',
        ho_so_nguon: hsNguon(r.email, r.phone, null), tao:r.time, dangnhap_cuoi:'',
        so_truong: ndCoHs(hs), luot:null, ho_so:hs});
    });
  }catch(e){ ghiLoi('stDanhSach/regs', e); }
  return jsonOut({ok:true, ds:ds, han:{hook:ST_LUOT_THU, script:ST_LUOT_KB, soi:ST_LUOT_SOI, cham:ST_LUOT_CHAM, taive:ST_LUOT_TAI, chat:ST_LUOT_CHAT}});
}
function stLichSu(b){
  var hv = aiDay(b.token);
  if (!hv || (hv.vaitro !== 'mentor' && hv.vaitro !== 'admin')) return jsonOut({ok:false, error:'khong_co_quyen'});
  var nd = b.ma ? ndTheoMa(b.ma) : (b.email ? ndTheoEmail(b.email) : null);
  if (!nd) return jsonOut({ok:false, error:'khong_thay'});
  var tb = []; try{ tb = JSON.parse(nd.thiet_bi || '[]') || []; }catch(e){}
  return jsonOut({ok:true, ten:nd.ten, email:nd.email, so_thiet_bi: tb.length, lich_su: stLogCua(nd.ma, 50)});
}
function stDungLuot(b){
  var nd = ndTuToken(b.token);
  if (!nd){ return aiDay(b.token) ? jsonOut({ok:true, pro:true}) : jsonOut({ok:false, error:'het_phien'}); }
  if (ndLaPro(nd)) return jsonOut({ok:true, pro:true});
  var con = stTruLuot(nd.ma, ST_TOOL[b.tool] ? String(b.tool) : 'hook');   // tool Tải video gửi tool:'taive'
  if (con < 0) return jsonOut({ok:false, error:'het_luot_thu', luot_con:0});
  return jsonOut({ok:true, luot_con:con});
}

/* ── mua Pro: tạo mã chuyển khoản ── */
function stQr(bank, soTien, noiDung){
  if (!bank.ngan_hang || !bank.stk) return '';
  return 'https://img.vietqr.io/image/' + encodeURIComponent(bank.ngan_hang) + '-' + encodeURIComponent(bank.stk) +
    '-compact2.png?amount=' + soTien + '&addInfo=' + encodeURIComponent(noiDung) + '&accountName=' + encodeURIComponent(bank.chu_tk || '');
}
function stMua(b){
  var nd = ndTuToken(b.token); if (!nd) return jsonOut({ok:false, error:'het_phien'});
  var bank = stNganHang(); if (!bank.ngan_hang || !bank.stk) return jsonOut({ok:false, error:'chua_cai_stk'});
  var goi = null; stGoi().forEach(function(g){ if (g.ma === b.goi) goi = g }); if (!goi) return jsonOut({ok:false, error:'goi_sai'});

  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  var maCk;
  try{
    var ds = moiPay(), cu = null;
    ds.forEach(function(p){ if (p.ma_nd === nd.ma && p.trangthai === 'cho' && p.goi === goi.ma) cu = p });
    if (cu) maCk = cu.ma_ck;     // bấm lại thì dùng lại mã cũ, khỏi sinh nhiều mã
    else {
      maCk = 'VS' + nd.ma + chuoiNgauNhien(3, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
      bang(ST_PAY_SHEET, ST_PAY_HEADERS).appendRow([maCk, nd.ma, nd.email, nd.sdt, nd.ten, goi.ma, String(goi.gia), String(goi.ngay), 'cho', nowVN(), '', '']);
    }
  } finally { lock.releaseLock(); }
  return jsonOut({ok:true, ma_ck:maCk, so_tien:goi.gia, goi:goi, bank:bank, qr: stQr(bank, goi.gia, maCk)});
}

/* ── người dùng báo đã chuyển: nhắn bot kèm nút duyệt ── */
function stDaChuyen(b){
  var nd = ndTuToken(b.token); if (!nd) return jsonOut({ok:false, error:'het_phien'});
  var p = null; moiPay().forEach(function(x){ if (x.ma_ck === String(b.ma_ck||'') && x.ma_nd === nd.ma) p = x });
  if (!p) return jsonOut({ok:false, error:'khong_thay'});
  if (p.trangthai === 'da_nhan') return jsonOut({ok:true, da_mo:true});
  ghiDong(ST_PAY_SHEET, ST_PAY_HEADERS, p, {trangthai:'cho', nguon:'nguoi_dung_bao ' + nowVN()});   // báo lại sau khi admin bấm "chưa thấy" thì quay về chờ
  tgBroadcastKb(['💸 *Viral Studio: có người báo đã chuyển khoản*','',
    '👤 *'+nd.ten+'*','📧 `'+nd.email+'`','📱 `'+nd.sdt+'`',
    '📦 '+p.goi+' · *'+Number(p.so_tien).toLocaleString('vi-VN')+'đ*',
    '🧾 Nội dung CK: `'+p.ma_ck+'`','',
    'Kiểm tra tài khoản rồi bấm nút:'].join('\n'),
    [[{text:'✅ Đã nhận tiền · mở Pro', callback_data:'s:ok:'+p.ma_ck}],
     [{text:'❌ Chưa thấy tiền', callback_data:'s:no:'+p.ma_ck}]]);
  return jsonOut({ok:true});
}

/* ── mở Pro cho một giao dịch (nút bot Telegram) ── */
function stKichHoat(maCk, nguon){
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try{
    var p = null; moiPay().forEach(function(x){ if (String(x.ma_ck).toUpperCase() === String(maCk).toUpperCase()) p = x });
    if (!p) return {ok:false, loi:'khong_thay'};
    if (p.trangthai === 'da_nhan') return {ok:true, lap:true, p:p};
    var nd = ndTheoMa(p.ma_nd); if (!nd) return {ok:false, loi:'khong_thay_nguoi'};
    var goc = ndLaPro(nd) ? new Date(nd.pro_han) : new Date();
    goc.setDate(goc.getDate() + (parseInt(p.ngay,10) || 30));
    ghiDong(ST_SHEET, ST_HEADERS, nd, {goi:'pro', pro_han: goc.toISOString()});
    ghiDong(ST_PAY_SHEET, ST_PAY_HEADERS, p, {trangthai:'da_nhan', xac_nhan: nowVN(), nguon: nguon});
    return {ok:true, p:p, nd:nd, han:goc};
  } finally { lock.releaseLock(); }
}

/* ── nút Telegram "s:ok:MA" / "s:no:MA" ── */
function studioCallback(cb){
  var p = String(cb.data||'').split(':'), act = p[1], ma = p[2];
  if (act === 'k' || act === 'kn') return khoaCallback(cb, act, ma);
  var chatId = cb.message.chat.id, msgId = cb.message.message_id, nhan;
  if (act === 'ok'){
    var kq = stKichHoat(ma, 'admin');
    if (!kq.ok) return tgAnswer(cb.id, 'Không tìm thấy mã ' + ma);
    nhan = '✅ Đã mở Pro · ' + (kq.nd ? kq.nd.ten : ma) + (kq.han ? ' · tới ' + Utilities.formatDate(kq.han, 'GMT+7', 'dd/MM/yyyy') : '');
  } else {
    var px = null; moiPay().forEach(function(x){ if (x.ma_ck === ma) px = x });
    if (px && px.trangthai === 'cho') ghiDong(ST_PAY_SHEET, ST_PAY_HEADERS, px, {trangthai:'chua_thay', xac_nhan: nowVN()});
    nhan = '❌ Chưa thấy tiền · ' + ma;
  }
  tgAnswer(cb.id, nhan);
  tgApi('editMessageReplyMarkup', {chat_id:chatId, message_id:msgId, reply_markup:{inline_keyboard:[[{text:nhan, callback_data:'xong'}]]}});
}



/* ═══════ HỒ SƠ KÊNH: một kho duy nhất cho mọi kiểu tài khoản ═══════
   Ba nguồn, đọc theo thứ tự ưu tiên:
     1. bảng HoSoKenh — bản học viên hoặc mentor đã sửa tay, khoá theo email
     2. cột ho_so của tài khoản Viral Studio
     3. dựng tự động từ FORM ĐĂNG KÝ KHOÁ HỌC (bảng DangKy) — chỗ học viên đã kể hết
        ngách, tệp, nỗi đau, tone, định dạng lúc đăng ký với mentor
   Nhờ vậy học viên đăng nhập bằng tài khoản khu học viên (không có dòng trong NguoiDung)
   vẫn được cá nhân hoá, và người vừa đăng ký khoá là tool đã biết kênh họ. */
var ST_HS_SHEET   = 'HoSoKenh';
var ST_HS_HEADERS = ['khoa','ten','email','sdt','ho_so','nguon','cap_nhat'];

function hsKhoa(email, sdt){
  var e = chuanEmail(email);
  if (e) return e;
  var d = String(sdt || '').replace(/\D/g, '');
  return d ? 'sdt:' + d.slice(-9) : '';
}
function hsTim(email, sdt){
  var k = hsKhoa(email, sdt); if (!k) return null;
  var hit = null;
  try{ docBang(ST_HS_SHEET, ST_HS_HEADERS).forEach(function(r){ if (!hit && String(r.khoa) === k) hit = r }); }catch(e){}
  return hit;
}
function hsGhi(email, sdt, ten, hs, nguon){
  var k = hsKhoa(email, sdt); if (!k) return;
  var cu = hsTim(email, sdt), gt = JSON.stringify(hs || {});
  if (cu) ghiDong(ST_HS_SHEET, ST_HS_HEADERS, cu, {ten: ten || cu.ten, ho_so: gt, nguon: nguon || 'sua_tay', cap_nhat: nowVN()});
  else bang(ST_HS_SHEET, ST_HS_HEADERS).appendRow([k, ten || '', chuanEmail(email), "'" + String(sdt || ''), gt, nguon || 'sua_tay', nowVN()]);
}

/* ── dựng hồ sơ từ một dòng form đăng ký khoá học ── */
function dkGop(){ var a = []; for (var i = 0; i < arguments.length; i++){ var v = String(arguments[i] || '').trim(); if (v) a.push(v); } return a.join(' · '); }
var DK_TONE_XUNG = {
  'chị em thân mật':'mình – các chị', 'vui vẻ, hài hước':'mình – mấy bạn', 'kể chuyện':'mình – mấy bạn',
  'thẳng thắn, thực tế':'mình – mấy bạn', 'truyền cảm hứng':'mình – mấy bạn',
  'chuyên nghiệp, sắc bén':'tôi – các bạn', 'giáo dục, trầm tĩnh':'tôi – các bạn'
};
function dkHoSo(r){
  if (!r) return null;
  var hs = {};
  if (r.niche)   hs.nganh    = String(r.niche).slice(0, 600);
  hs.doi_tuong = dkGop(r.audience, r.aud_age, r.aud_gender && String(r.aud_gender) !== 'Đa dạng' ? r.aud_gender : '');
  hs.dinh_vi   = dkGop(r.unique, r.job ? 'Nghề: ' + r.job : '', r.strength ? 'Thế mạnh: ' + r.strength : '');
  hs.muc_tieu  = dkGop(r.goals, r.timeline);
  if (r.tone){
    var t0 = String(r.tone).split(/[,;·]/)[0].trim().toLowerCase();
    hs.xung_ho = DK_TONE_XUNG[t0] || '';
    hs.ghi_chu = dkGop('Tone: ' + r.tone);
  }
  if (r.format)  hs.dang     = String(r.format);
  hs.ghi_chu = dkGop(hs.ghi_chu, r.pain ? 'Nỗi đau của khán giả: ' + r.pain : '',
                     r.camera ? 'Thoải mái lên hình: ' + r.camera + '/5' : '',
                     r.time_week ? 'Thời gian mỗi tuần: ' + r.time_week : '',
                     r.tried ? 'Đã từng: ' + r.tried : '', r.channel ? 'Kênh: ' + r.channel : '',
                     r.refs ? 'Kênh tham khảo: ' + r.refs : '', r.fear ? 'Đang ngại: ' + r.fear : '');
  if (r.channel) hs.kenh = String(r.channel).slice(0, 200);
  var o = {}; ST_HS_TRUONG.forEach(function(k){ if (hs[k]) o[k] = String(hs[k]).slice(0, 600) });
  return o;
}
function dkTim(email, sdt){
  var e = chuanEmail(email), d = String(sdt || '').replace(/\D/g, '').slice(-9), hit = null;
  try{
    allRegs().forEach(function(r){
      if (hit) return;
      if (e && chuanEmail(r.email || '') === e) hit = r;
      else if (d && String(r.phone || '').replace(/\D/g, '').slice(-9) === d) hit = r;
    });
  }catch(err){}
  return hit;
}

/* Hồ sơ đang có hiệu lực của một người. nd có thể là null (học viên khu học viên). */
function hsHienDung(email, sdt, nd){
  var t = hsTim(email, sdt);
  if (t){ try{ var o = JSON.parse(t.ho_so || '{}'); if (ndCoHs(o)) return o; }catch(e){} }
  if (nd){ var a = ndDocHs(nd); if (ndCoHs(a)) return a; }
  var dk = dkHoSo(dkTim(email, sdt));
  return (dk && ndCoHs(dk)) ? dk : {};
}
function hsNguon(email, sdt, nd){
  var t = hsTim(email, sdt);
  if (t){ try{ if (ndCoHs(JSON.parse(t.ho_so || '{}'))) return 'sua_tay'; }catch(e){} }
  if (nd && ndCoHs(ndDocHs(nd))) return 'tai_khoan';
  return dkTim(email, sdt) ? 'form_dang_ky' : '';
}

/* ═══════ HỒ SƠ KÊNH MẪU — chốt trong buổi định hướng 08/09/2026 ═══════
   Nạp sẵn để học viên vào tool là tool đã biết kênh họ, khỏi điền lại từ đầu.
   Học viên sửa được trong mục Tài khoản; mentor gán bằng /naphoso email duong */
var ST_HS_MAU = {
  duong: { ten_goi:'Thùy Dương · Spa Từ Sơn', khop:['thuy duong','thuỳ dương','duong','dương'],
    kenh:'Spa Từ Sơn, Bắc Ninh',
    nganh:'Spa chăm sóc mụn và sắc tố da tại Từ Sơn, Bắc Ninh',
    dinh_vi:'Cô chủ spa người Đà Nẵng, 33 tuổi, bỏ nghề kế toán, vào lại Đà Nẵng học nghề 4 tháng rồi về Từ Sơn mở tiệm. Không phải bác sĩ, là người từng ngồi đúng chỗ khách đang ngồi. Giọng Đà Nẵng giữa đất Bắc Ninh, tuyệt đối không sửa giọng.',
    doi_tuong:'Phụ nữ 25–45 tuổi trong bán kính 20km: Từ Sơn, Đình Bảng, Bắc Ninh',
    muc_tieu:'Khách bước vào tiệm. Không đuổi view toàn quốc.',
    xung_ho:'mình – các chị',
    dang:'Vlog trong tiệm lồng tiếng (60%) · POV nói về dịch vụ da mặt cho khách (40%)',
    do_dai:'45–60 giây',
    text_batbuoc:'Chữ to 3–4 dòng mỗi video. Ít nhất một dòng phải có chữ "Từ Sơn - Bắc Ninh".',
    nhac:'Nhạc trend nhẹ cho video POV, ưu tiên Hoà Minzy (Bắc Bling)',
    hashtag:'Đúng một hashtag địa phương #tuson + 3 hashtag ngành (#spabacninh #nanmun #lamdep). Không nhồi thêm.',
    khong_lam:'Không hứa kết quả, không hứa thời gian, không dùng chữ điều trị / đặc trị / chữa khỏi theo nghĩa y tế. Tuyệt đối không bật filter làm đẹp, không làm mịn da.',
    pillar:'Hành trình mở tiệm 70% (vlog trong tiệm, kéo người Từ Sơn thành người quen trước khi thành khách) · Da thật ca thật 30% (ảnh so sánh, quay macro, cận tay)',
    san_pham:'Dịch vụ spa: chăm sóc da, nặn mụn, xử lý sắc tố',
    ghi_chu:'Mỗi video: gắn location tag, nói "Từ Sơn" ra miệng, chữ "Từ Sơn" trên màn hình. 2 video/tuần, đăng 12h–13h và 16h–20h. Ưu tiên ánh sáng tiệm, bớt đèn trắng. Lộ mặt, trừ nhóm soi da, lấy nhân mụn, gội đầu. Thước đo tuần đầu: trên 50% người xem ở Bắc Ninh.' },

  duy: { ten_goi:'Tùng Duy · Banker Gen Z', khop:['tung duy','tùng duy','duy'],
    kenh:'Banker Gen Z',
    nganh:'Tín dụng cá nhân: vay thế chấp, thẻ tín dụng, gửi tiết kiệm',
    dinh_vi:'Thằng em 22 tuổi ngồi ở ghế bên kia bàn vay. Thị trường đã có đàn anh 30+ kể chuyện nghề sales, chưa ai làm banker Gen Z. Năm ba đi bán thẻ tín dụng vì dễ apply, rồi làm trainee Shinhan 4 tháng rưỡi, chi nhánh hết headcount phải nghỉ, giờ quay lại sale khách hàng cá nhân.',
    doi_tuong:'Người 25–45 tuổi sắp đi vay, đang tìm hiểu thẻ tín dụng hoặc gửi tiết kiệm',
    muc_tieu:'Inbox hỏi hồ sơ vay. Khách đến qua bio, không qua lời chào mời trong video.',
    xung_ho:'mình – mấy bạn',
    dang:'Talking head ngồi bàn làm việc (70%) · POV một ngày làm việc (20%)',
    do_dai:'45–80 giây',
    text_batbuoc:'Hook lặp lại ở giây đầu, thêm 2–3 điểm nhấn giữa video',
    nhac:'Piano nhẹ khoảng 15% cho video kể chuyện, nhạc truyền cảm hứng',
    hashtag:'Một câu chốt + 4–5 hashtag, có #tindung và hashtag tên kênh',
    khong_lam:'Không nêu lãi suất hay hạn mức cụ thể của ngân hàng mình, không cam kết duyệt hồ sơ, không để lộ chi tiết nhận dạng của khách.',
    pillar:'22 tuổi đi làm ngân hàng 20% (POV, vlog lồng tiếng, kéo tệp bạn trẻ ngoài tài chính) · chuyện nghề tín dụng và kiến thức vay cho người sắp vay',
    san_pham:'Tư vấn hồ sơ vay khách hàng cá nhân',
    ghi_chu:'Luôn lộ mặt, đây là lợi thế lớn nhất. Trang phục đời thường nhất quán như đồng phục kênh. Ánh sáng cửa sổ bên trái, ngồi bàn làm việc. 2 video/tuần, đăng 12h–13h và 16h–20h. Thước đo tuần đầu: tỷ lệ xem hết trên 30%.' },

  phong: { ten_goi:'Phong · Tín dụng năm đầu', khop:['lam giai phong','giai phong','phong'],
    kenh:'Chuyện nghề tín dụng',
    nganh:'Chuyện nghề tín dụng, nói với người trong ngành. Nội dung là NGHỀ, không phải sản phẩm.',
    dinh_vi:'Người đang ở trong nghề năm đầu, kể đúng cái mình đang trải qua. Từ Đại học Cần Thơ lên Sài Gòn làm sales trainee. Không cần tỏ ra biết sâu, hình ảnh đời thường đi làm, tông vui vẻ và thẳng thắn.',
    doi_tuong:'Sinh viên tài chính ngân hàng, nhân viên mới vào nghề, người đang ứng tuyển',
    muc_tieu:'Độ phủ tích cực trong cộng đồng cùng ngành',
    xung_ho:'mình – mấy bạn',
    dang:'POV, vlog một ngày, lồng tiếng',
    do_dai:'40–60 giây',
    text_batbuoc:'Chữ trên màn hình bám theo nội dung vlog',
    nhac:'Nhẹ, tông vui. Không dùng nhạc buồn kể cả ở video kể chuyện.',
    hashtag:'Một câu chốt + 4–5 hashtag',
    khong_lam:'Không nêu tên ngân hàng đang làm, không so sánh sản phẩm giữa các ngân hàng, không nêu con số lương. Nói về áp lực thì được, than vãn về nơi làm việc thì không.',
    pillar:'Sống sót năm đầu 39% · Thực tế nghề 28% · Thứ trường không dạy 22% · Người ngoài hiểu sai 11%',
    san_pham:'',
    ghi_chu:'Voice-over thu riêng ở nhà buổi tối. 2 video/tuần, đăng 20h–22h. Ghi chú điện thoại mọi khoảnh khắc bất chợt trong ngày để làm chất liệu. Thước đo tuần đầu: có bình luận thật từ người cùng ngành.' },

  hai: { ten_goi:'Đại Hải · Vlog gia đình', khop:['dai hai','đại hải','hai','hải'],
    kenh:'Bếp nhà mình',
    nganh:'Vlog nấu ăn gia đình, cơm trưa cho vợ',
    dinh_vi:'Ông bố nấu ăn ngon. Vợ đi làm spa, chồng ở nhà chăm con và nấu cơm. Tinh thần đời thường, thật, hơi hài.',
    doi_tuong:'Phụ nữ chăm con, phụ nữ ở nhà',
    muc_tieu:'Lan toả, kéo view, làm affiliate đồ bếp',
    xung_ho:'mình – mọi người',
    dang:'POV, vlog một ngày, lồng tiếng. Nói chuyện với vợ khi ăn.',
    do_dai:'40–60 giây',
    text_batbuoc:'Chữ trên màn hình bám theo nội dung vlog',
    nhac:'Nhẹ, tông vui',
    hashtag:'Một câu chốt + 4–5 hashtag',
    khong_lam:'Không khoe, không dàn dựng quá chỉn chu. Giữ chất đời thường.',
    pillar:'Món ăn bất ngờ cho vợ 70% · Đàn ông nội trợ 20% · Đồ nhà bếp đang dùng 10%',
    san_pham:'Đồ dùng nhà bếp (affiliate)',
    ghi_chu:'2 video/tuần, đăng 20h–22h. Ghi chú điện thoại những khoảnh khắc bất chợt. Mục tiêu tuần đầu: trên 5000 view.' }
};
function stHsMau(k){
  var m = ST_HS_MAU[String(k || '').toLowerCase()];
  if (!m) return null;
  var o = {}; ST_HS_TRUONG.forEach(function(f){ if (m[f]) o[f] = m[f] });
  return o;
}
/* Tự gán hồ sơ cho tài khoản đã có, khớp theo tên. Chạy tay trong trình soạn Apps Script,
   hoặc dùng /naphoso email duong cho chắc tay. Không ghi đè hồ sơ học viên đã tự sửa. */
function stNapHoSoMau(){
  var ket = [];
  // người đã điền form đăng ký khoá: dựng hồ sơ thẳng từ câu trả lời của họ
  try{
    allRegs().forEach(function(r){
      var k = hsKhoa(r.email, r.phone); if (!k) return;
      var t = hsTim(r.email, r.phone);
      if (t){ try{ if (ndCoHs(JSON.parse(t.ho_so || '{}'))) { ket.push('bỏ qua (đã có hồ sơ): ' + r.name); return; } }catch(e){} }
      var hs = dkHoSo(r);
      if (!hs || !ndCoHs(hs)) { ket.push('form đăng ký thiếu dữ liệu: ' + r.name); return; }
      hsGhi(r.email, r.phone, r.name, hs, 'form_dang_ky');
      ket.push('✅ ' + r.name + ' ← form đăng ký khoá (' + ndCoHs(hs) + ' mục)');
    });
  }catch(e){ ket.push('không đọc được bảng đăng ký: ' + e); }
  moiND().forEach(function(nd){
    if (ndCoHs(hsHienDung(nd.email, nd.sdt, nd))) { ket.push('bỏ qua (đã có hồ sơ): ' + nd.ten); return; }
    var ten = khongDau(nd.ten || '');
    var key = null;
    Object.keys(ST_HS_MAU).forEach(function(k){
      if (key) return;
      ST_HS_MAU[k].khop.forEach(function(t){ if (!key && ten.indexOf(khongDau(t)) > -1) key = k });
    });
    if (!key) { ket.push('không khớp mẫu nào: ' + nd.ten); return; }
    ghiDong(ST_SHEET, ST_HEADERS, nd, {ho_so: JSON.stringify(stHsMau(key))});
    hsGhi(nd.email, nd.sdt, nd.ten, stHsMau(key), 'mau');
    ket.push('✅ ' + nd.ten + ' ← ' + ST_HS_MAU[key].ten_goi);
  });
  var t = ket.length ? ket.join('\n') : 'Chưa có ai trong bảng NguoiDung lẫn bảng đăng ký khoá.';
  Logger.log(t);
  return t;
}

/* ═══════ LỆNH BOT TELEGRAM (chỉ chat quản trị) ═══════
   Code.gs gọi:  if (quanTri && studioCoLenh(cmd)) return studioLenh(cmd, arg, chatId);  */
var LENH_STUDIO = ['studio','stk','giapro','ngaypro','ngayhv','giahv','uudaihv','luotthu','luotkb','luotsoi','luotcham','luottai','luotchat','luotai','baihoc','duyetbh','tatbh','xoabh','day','chatngay','tuvan','tonghop','mopro','tatpro','dsck','timnd','ckkhoa','tienkhoa','hoso','lichsu','dshv','naphoso'];
function studioCoLenh(cmd){ return LENH_STUDIO.indexOf(cmd) > -1; }

var ST_MA_NH = {vietcombank:'VCB', vcb:'VCB', mb:'MB', mbbank:'MB', quandoi:'MB', techcombank:'TCB', tcb:'TCB',
  acb:'ACB', bidv:'BIDV', vietinbank:'ICB', vietin:'ICB', ctg:'ICB', icb:'ICB', vpbank:'VPB', vpb:'VPB',
  tpbank:'TPB', tpb:'TPB', sacombank:'STB', stb:'STB', agribank:'VBA', vba:'VBA', vib:'VIB', ocb:'OCB',
  hdbank:'HDB', hdb:'HDB', shb:'SHB', msb:'MSB', maritimebank:'MSB', seabank:'SEAB', seab:'SEAB',
  eximbank:'EIB', eib:'EIB', lpbank:'LPB', lienvietpostbank:'LPB', lpb:'LPB', namabank:'NAB', nab:'NAB',
  shinhan:'SHBVN', shinhanbank:'SHBVN', cake:'CAKE', ubank:'UBANK', timo:'TIMO', abbank:'ABB', abb:'ABB',
  bacabank:'BAB', bab:'BAB', pvcombank:'PVCB', pvcb:'PVCB', kienlongbank:'KLB', klb:'KLB', vietabank:'VAB',
  scb:'SCB', ncb:'NCB', saigonbank:'SGICB', gpbank:'GPB', oceanbank:'Oceanbank', baovietbank:'BVB', vikki:'VIKKI'};
function stMaNganHang(s){
  var k = khongDau(s).replace(/[^a-z0-9]/g, '').replace(/^ngan?hang/, '');
  return ST_MA_NH[k] || ST_MA_NH[k.replace(/bank$/, '')] || String(s).trim().toUpperCase();
}
function stDatGoi(sua){
  var goi = stGoi(); if (!goi.length) goi = [{ma:'m1', ten:'Pro 1 tháng', gia:50000, ngay:30}];
  sua(goi[0]);
  goi[0].ten = goi[0].ngay % 30 === 0 ? 'Pro ' + (goi[0].ngay / 30) + ' tháng' : 'Pro ' + goi[0].ngay + ' ngày';
  props().setProperty('ST_GOI', JSON.stringify(goi));
  return goi[0];
}
function stTien(n){ return Number(n).toLocaleString('vi-VN') + 'đ'; }
function stHan(d){ return d ? Utilities.formatDate(new Date(d), 'GMT+7', 'dd/MM/yyyy') : ''; }

function studioLenh(cmd, arg, chatId){
  var P = props();
  var hoi = function(cau){ datCho(chatId, cmd); return tgSend(chatId, cau + '\n\n_Đổi ý thì /huy._'); };
  if (typeof tlLenh === 'function' && typeof TL_LENH !== 'undefined' && TL_LENH.indexOf(cmd) > -1) return tlLenh(cmd, arg, chatId, hoi);   // bộ nhớ AI (TroLy.gs)

  if (cmd === 'studio'){
    var bank = stNganHang(), g = stGoi()[0] || {}, ds = moiND(), pay = moiPay();
    var soPro = ds.filter(ndLaPro).length, cho = pay.filter(function(p){ return p.trangthai === 'cho' }).length;
    return tgSend(chatId, [
      '🎬 *Viral Studio · cài đặt bán Pro*','',
      '🏦 Nhận tiền: ' + (bank.stk ? '*' + bank.ngan_hang + '* · `' + bank.stk + '` · ' + bank.chu_tk : '⚠️ _chưa cài, người dùng chưa mua được_'),
      '💰 Gói: *' + (g.ten || '?') + '* · *' + stTien(g.gia || 0) + '*',
      '🎁 Tài khoản mới: *' + ST_LUOT_THU + '* lượt AI phân tích miễn phí',
      '🎓 Học viên khoá: Pro *' + (stHV().ngay ? stHV().ngay + ' ngày' : 'suốt đời') + '* · ' + (stHV().gia ? stTien(stHV().gia) : 'miễn phí'),
      '🤖 Pro và học viên: *' + (parseInt((typeof hookCfg === 'function' ? hookCfg('HOOK_AI_DAILY') : cfgProp('HOOK_AI_DAILY')) || '20', 10)) + '* lượt AI mỗi ngày',
      '👥 ' + ds.length + ' người dùng · ' + soPro + ' đang Pro · ' + cho + ' giao dịch chờ',
      '🎓 Chuyển khoản trong form học viên: ' + (khoaBat() ? '*BẬT* · ' + khoaNhan(khoaTien()).toLowerCase() + ' *' + stTien(khoaTien()) + '*' : '_tắt_'),'',
      '*Lệnh*',
      '🏦 /stk `MB | 0123456789 | NGUYEN VAN A` — tài khoản nhận tiền',
      '💰 /giapro `50000` — giá gói Pro',
      '📆 /ngaypro `30` — gói dùng bao nhiêu ngày',
      '🎓 /ngayhv `30` — học viên khoá được Pro mấy ngày (`0` = suốt đời)',
      '🎓 /giahv `0` — giá gói học viên hiện trên landing (`0` = miễn phí)',
      '🎁 /uudaihv `câu ưu đãi` — dòng mời đăng ký học viên trong bảng Nâng cấp Pro (`xoa` = về mặc định)',
      '🎁 /luotthu `10` — lượt AI phân tích hook cho tài khoản mới',
      '📝 /luotkb `3` — lượt chấm kịch bản cho tài khoản mới',
      '🔎 /luotsoi `1` — lượt soi video cho tài khoản mới',
      '🎯 /luotcham `1` — lượt chấm video của bạn cho tài khoản mới',
      '⬇️ /luottai `10` — lượt tải video miễn phí cho khách (học viên, Pro không giới hạn)',
      '💬 /luotchat `15` — tin chat với Trợ lý AI cho tài khoản Free · /chatngay `60` — mỗi ngày cho Pro, học viên',
      '🧠 /baihoc — bộ nhớ AI · /day `nội dung` — dạy AI · /duyetbh /tatbh /xoabh `id`',
      '💬 /tuvan — học viên đang hỏi trợ lý gì · /tonghop — AI tự rút bài học từ các lượt tư vấn mới',
      '🤖 /luotai `20` — lượt AI mỗi ngày của Pro và học viên',
      '🧾 /dsck — giao dịch đang chờ (Pro và học phí), bấm nút để xác nhận',
      '🎓 /ckkhoa `bat` · `tat` — hiện màn chuyển khoản sau khi học viên điền form',
      '💵 /tienkhoa `2000000` — số tiền chuyển (`auto` = theo giá ưu đãi của bot)',
      '🔎 /timnd `email` — xem một người dùng',
      '👥 /dshv — danh sách tài khoản và hồ sơ kênh đã điền',
      '🧾 /hoso `email` — xem hồ sơ kênh của một người',
      '📥 /naphoso `email duong` — nạp hồ sơ mẫu (duong · duy · phong · hai)',
      '🕵️ /lichsu `email` — lịch sử dùng AI, soi xem có dùng chung không',
      '✅ /mopro `email 30` — tự mở Pro cho ai đó (số ngày, bỏ trống = 1 gói)',
      '⛔ /tatpro `email` — tắt Pro'
    ].join('\n'));
  }

  if (cmd === 'stk'){
    if (!arg) return hoi('🏦 Gửi tài khoản nhận tiền theo mẫu:\n`Ngân hàng | Số tài khoản | Tên chủ tài khoản`\nVí dụ: `Vietcombank | 0123456789 | Nguyễn Văn A`');
    var x = arg.split(/\s*[|\n]\s*/).filter(function(t){ return t });
    if (x.length < 3) return hoi('Chưa đủ 3 phần. Gửi lại theo mẫu:\n`MB | 0123456789 | NGUYEN VAN A`');
    var nh = stMaNganHang(x[0]), so = x[1].replace(/\s/g, ''), chu = x.slice(2).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'D').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    if (!/^[0-9A-Za-z]{4,20}$/.test(so)) return hoi('Số tài khoản chỉ gồm chữ số (4–20 ký tự). Gửi lại nhé.');
    P.setProperties({ST_NGAN_HANG: nh, ST_STK: so, ST_CHU_TK: chu});
    var qr = stQr({ngan_hang:nh, stk:so, chu_tk:chu}, (stGoi()[0] || {}).gia || 50000, 'VSTHU');
    tgSend(chatId, '✅ Đã lưu tài khoản nhận tiền\n🏦 *' + nh + '* · `' + so + '`\n👤 ' + chu + '\n\nBot gửi QR thử bên dưới: quét bằng app ngân hàng, thấy đúng tên là ổn (đừng chuyển).');
    try { tgApi('sendPhoto', {chat_id: chatId, photo: qr, caption: 'QR thử · ' + nh + ' ' + so}); } catch(e){}
    return;
  }

  if (cmd === 'giapro'){
    if (!arg) return hoi('💰 Giá gói Pro bao nhiêu? Ví dụ `50000` hoặc `50k`');
    var tien = docTien(arg); if (!tien || tien < 1000) return hoi('Chưa hiểu số tiền. Gửi lại, ví dụ `50000`.');
    var g1 = stDatGoi(function(g){ g.gia = tien });
    return tgSend(chatId, '✅ Gói *' + g1.ten + '* giờ là *' + stTien(g1.gia) + '*. Tool cập nhật ngay lần mở sau.');
  }
  if (cmd === 'ngaypro'){
    if (!arg) return hoi('📆 Mỗi gói Pro dùng bao nhiêu ngày? Ví dụ `30`');
    var ngay = parseInt(arg, 10); if (!ngay || ngay < 1) return hoi('Gửi một con số, ví dụ `30`.');
    var g2 = stDatGoi(function(g){ g.ngay = ngay });
    return tgSend(chatId, '✅ Gói giờ là *' + g2.ten + '* (' + g2.ngay + ' ngày) · ' + stTien(g2.gia));
  }
  if (cmd === 'ngayhv'){
    if (!arg) return hoi('🎓 Học viên khoá được Pro bao nhiêu ngày kể từ lúc có tài khoản? Ví dụ `30` · gửi `0` = suốt đời');
    var nh = parseInt(arg, 10); if (isNaN(nh) || nh < 0) return hoi('Gửi một con số, ví dụ `30`.');
    var h1 = stHV(); h1.ngay = nh; P.setProperty('ST_HV', JSON.stringify(h1));
    return tgSend(chatId, '✅ Học viên khoá: Pro *' + (nh ? nh + ' ngày' : 'suốt đời') + '* · ' + (h1.gia ? 'gói học viên *' + stTien(h1.gia) + '*' : '*miễn phí*') + '. Landing và tool cập nhật ngay lần mở sau.');
  }
  if (cmd === 'giahv'){
    if (!arg) return hoi('🎓 Gói cho học viên khoá bao nhiêu tiền? Gửi `0` = miễn phí, hoặc ví dụ `20000`');
    var th = /^0+$/.test(arg.trim()) ? 0 : docTien(arg);
    if (th === 0 ? false : (!th || th < 1000)) return hoi('Chưa hiểu số tiền. Gửi `0` hoặc ví dụ `20000`.');
    var h2 = stHV(); h2.gia = th; P.setProperty('ST_HV', JSON.stringify(h2));
    return tgSend(chatId, '✅ Gói học viên khoá: *' + (h2.gia ? stTien(h2.gia) : 'miễn phí') + '* · ' + (h2.ngay ? h2.ngay + ' ngày' : 'suốt đời') + '. Landing cập nhật ngay lần mở sau.');
  }
  if (cmd === 'uudaihv'){
    if (!arg) return hoi('🎁 Gửi câu ưu đãi cho học viên, hiện trong bảng Nâng cấp Pro. Ví dụ `Tặng Pro suốt khoá + 1 buổi sửa kênh 1:1`. Gửi `xoa` để về câu mặc định.');
    var h3 = stHV(); h3.uu_dai = /^(xoa|xóa|0)$/i.test(arg.trim()) ? '' : String(arg).trim().slice(0, 300);
    P.setProperty('ST_HV', JSON.stringify(h3));
    return tgSend(chatId, h3.uu_dai ? '✅ Ưu đãi học viên: _' + h3.uu_dai + '_' : '✅ Đã về câu ưu đãi mặc định.');
  }
  if (cmd === 'luotthu'){
    if (!arg) return hoi('🎁 Mỗi tài khoản mới được bao nhiêu lượt AI phân tích miễn phí? Ví dụ `10`');
    var n = parseInt(arg, 10); if (isNaN(n) || n < 0 || n > 1000) return hoi('Gửi một con số từ 0 đến 1000.');
    P.setProperty('ST_LUOT_THU', String(n));
    return tgSend(chatId, '✅ Tài khoản Free giờ có *' + n + '* lượt AI phân tích miễn phí (áp dụng cho cả người đã đăng ký, tính theo số lượt họ đã dùng).');
  }
  if (cmd === 'luotkb'){
    if (!arg) return hoi('📝 Tài khoản mới được bao nhiêu lượt *chấm kịch bản*? Ví dụ `3`');
    var nkb = parseInt(arg, 10); if (isNaN(nkb) || nkb < 0 || nkb > 1000) return hoi('Gửi một con số từ 0 đến 1000.');
    P.setProperty('ST_LUOT_KB', String(nkb));
    return tgSend(chatId, '✅ Tài khoản Free giờ có *' + nkb + '* lượt chấm kịch bản.');
  }
  if (cmd === 'luotsoi'){
    if (!arg) return hoi('🔎 Tài khoản mới được bao nhiêu lượt *soi video viral*? Ví dụ `1`');
    var nsoi = parseInt(arg, 10); if (isNaN(nsoi) || nsoi < 0 || nsoi > 1000) return hoi('Gửi một con số từ 0 đến 1000.');
    P.setProperty('ST_LUOT_SOI', String(nsoi));
    return tgSend(chatId, '✅ Tài khoản Free giờ có *' + nsoi + '* lượt soi video viral.');
  }
  if (cmd === 'luotcham'){
    if (!arg) return hoi('🎯 Tài khoản mới được bao nhiêu lượt *chấm video của bạn*? Ví dụ `1`');
    var ncham = parseInt(arg, 10); if (isNaN(ncham) || ncham < 0 || ncham > 1000) return hoi('Gửi một con số từ 0 đến 1000.');
    P.setProperty('ST_LUOT_CHAM', String(ncham));
    return tgSend(chatId, '✅ Tài khoản Free giờ có *' + ncham + '* lượt chấm video của bạn.');
  }
  if (cmd === 'luotchat'){
    if (!arg) return hoi('💬 Tài khoản Free được chat với Trợ lý AI bao nhiêu tin? Ví dụ `15`');
    var nch = parseInt(arg, 10); if (isNaN(nch) || nch < 0 || nch > 100000) return hoi('Gửi một con số từ 0 đến 100000.');
    P.setProperty('ST_LUOT_CHAT', String(nch));
    return tgSend(chatId, '✅ Tài khoản Free giờ được chat *' + nch + '* tin với Trợ lý AI.');
  }
  if (cmd === 'luottai'){
    if (!arg) return hoi('⬇️ Khách được tải video miễn phí bao nhiêu lần? Ví dụ `10` (học viên và Pro luôn không giới hạn)');
    var ntai = parseInt(arg, 10); if (isNaN(ntai) || ntai < 0 || ntai > 100000) return hoi('Gửi một con số từ 0 đến 100000.');
    P.setProperty('ST_LUOT_TAI', String(ntai));
    return tgSend(chatId, '✅ Khách giờ được tải video miễn phí *' + ntai + '* lần. Học viên và Pro vẫn không giới hạn.');
  }
  if (cmd === 'dshv'){
    var dsAll = moiND();
    if (!dsAll.length) return tgSend(chatId, 'Chưa có tài khoản nào.');
    var dong = dsAll.slice(-25).reverse().map(function(x){
      var hsx = ndDocHs(x), so = ndCoHs(hsx);
      return (ndLaPro(x) ? '✦' : '🆓') + ' *' + x.ten + '* · `' + x.email + '`\n   ' +
        (so ? '📋 hồ sơ ' + so + '/' + ST_HS_TRUONG.length + ' mục' + (hsx.nganh ? ' · ' + hsx.nganh : '') : '📋 _chưa có hồ sơ kênh_') +
        ' · còn ' + ndLuotCon(x,'hook') + '/' + ndLuotCon(x,'script') + '/' + ndLuotCon(x,'soi') + '/' + ndLuotCon(x,'cham') + ' (hook/kb/soi/chấm)';
    });
    return tgSend(chatId, ['👥 *' + dsAll.length + ' tài khoản* (mới nhất trước)', ''].concat(dong).join('\n'));
  }
  if (cmd === 'luotai'){
    if (!arg) return hoi('🤖 Pro và học viên được bao nhiêu lượt AI mỗi ngày? Ví dụ `20`');
    var d = parseInt(arg, 10); if (!d || d < 1 || d > 1000) return hoi('Gửi một con số từ 1 đến 1000.');
    P.setProperty('HOOK_AI_DAILY', String(d));
    return tgSend(chatId, '✅ Pro và học viên giờ có *' + d + '* lượt AI mỗi ngày.');
  }

  if (cmd === 'ckkhoa'){
    var bat = /^(bat|bật|on|mo|mở|1|co|có)$/i.test(arg), tat = /^(tat|tắt|off|dong|đóng|0|khong|không)$/i.test(arg);
    if (!bat && !tat) return hoi('🎓 Chuyển khoản trong form học viên đang ' + (khoaBat() ? '*BẬT*' : '*tắt*') +
      '.\nNhắn `bat` để hiện màn chuyển khoản ngay sau khi học viên điền form xong, `tat` để tắt.');
    P.setProperty('KHOA_CK', bat ? '1' : '0');
    if (bat && !stNganHang().stk) return tgSend(chatId, '✅ Đã bật, nhưng ⚠️ chưa có tài khoản nhận tiền nên form chưa hiện màn chuyển khoản. Nhắn /stk trước nhé.');
    return tgSend(chatId, bat ? '✅ Đã *BẬT*. Học viên điền form xong sẽ thấy QR chuyển *' + stTien(khoaTien()) + '* (' + khoaNhan(khoaTien()).toLowerCase() + '), nội dung `TMXK <mã đăng ký>`. Bấm "Tôi đã chuyển khoản" là bot nhắn bạn kèm nút duyệt.'
                              : '✅ Đã *tắt*. Form đăng ký chỉ ghi nhận thông tin như cũ.');
  }
  if (cmd === 'tienkhoa'){
    if (!arg) return hoi('💵 Học viên chuyển bao nhiêu sau khi điền form? Ví dụ `2000000`, `500k` (đặt cọc), hoặc `auto` để lấy giá ưu đãi hiện tại (' + stTien(khoaTien()) + ').');
    if (/^auto$/i.test(arg)){ P.deleteProperty('KHOA_TIEN'); return tgSend(chatId, '✅ Số tiền chuyển theo giá ưu đãi: *' + stTien(khoaTien()) + '*. Đổi giá bằng /giasom là tự theo.'); }
    var tk = docTien(arg); if (!tk || tk < 1000) return hoi('Chưa hiểu số tiền. Gửi lại, ví dụ `2000000` hoặc `500k`.');
    P.setProperty('KHOA_TIEN', String(tk));
    return tgSend(chatId, '✅ Học viên sẽ chuyển *' + stTien(tk) + '* (' + khoaNhan(tk).toLowerCase() + ').');
  }

  if (cmd === 'dsck'){
    var chos = moiPay().filter(function(p){ return p.trangthai === 'cho' || p.trangthai === 'chua_thay' });
    if (!chos.length) return tgSend(chatId, '🧾 Không có giao dịch nào đang chờ.');
    tgSend(chatId, '🧾 *' + chos.length + ' giao dịch chưa xác nhận* (mới nhất ở dưới)');
    chos.slice(-10).forEach(function(p){
      tgSend(chatId, ['🧾 `' + p.ma_ck + '` · ' + (p.trangthai === 'cho' ? (String(p.nguon).indexOf('nguoi_dung_bao') === 0 ? '💸 đã báo chuyển' : '⏳ chưa báo') : '❌ đã bấm chưa thấy'),
        '👤 *' + p.ten + '*' + (p.email ? ' · `' + p.email + '`' : '') + ' · `' + p.sdt + '`', (p.goi === 'khoa' ? '🎓 ' : '✦ Pro · ') + stTien(p.so_tien) + ' · tạo ' + p.tao].join('\n'),
        p.goi === 'khoa' ? [[{text:'✅ Đã nhận học phí · duyệt học viên', callback_data:'s:k:' + String(p.ma_nd).replace(/^DK:/, '')}]]
                         : [[{text:'✅ Đã nhận tiền · mở Pro', callback_data:'s:ok:' + p.ma_ck}]]);
    });
    return;
  }

  // các lệnh theo email
  if (!arg) return hoi('Gửi email người dùng' + (cmd === 'mopro' ? ', kèm số ngày nếu muốn (ví dụ `ban@gmail.com 30`)' : '') + '.');
  var em = arg.split(/\s+/)[0], nd = ndTheoEmail(em);
  if (!nd) return tgSend(chatId, '🔎 Không thấy người dùng Viral Studio có email `' + em + '`.');
  if (cmd === 'hoso'){
    var hs1 = ndDocHs(nd);
    if (!ndCoHs(hs1)) return tgSend(chatId, '📋 *' + nd.ten + '* chưa điền hồ sơ kênh.\nHọ tự điền trong tool ở mục Tài khoản → Hồ sơ kênh.');
    var nhan = {kenh:'Tên kênh', nganh:'Ngách', dinh_vi:'Định vị', doi_tuong:'Nói với ai', muc_tieu:'Mục tiêu',
      xung_ho:'Xưng hô', dang:'Định dạng', do_dai:'Độ dài', text_batbuoc:'Chữ bắt buộc', nhac:'Nhạc',
      hashtag:'Hashtag', khong_lam:'Không làm', pillar:'Pillar', san_pham:'Sản phẩm', ghi_chu:'Ghi chú'};
    var dg = ST_HS_TRUONG.filter(function(k){ return hs1[k] }).map(function(k){ return '*' + nhan[k] + ':* ' + hs1[k] });
    return tgSend(chatId, ['📋 *Hồ sơ kênh · ' + nd.ten + '*', ''].concat(dg).join('\n'));
  }
  if (cmd === 'naphoso'){
    var khoaMau = (arg.split(/\s+/)[1] || '').toLowerCase();
    if (!ST_HS_MAU[khoaMau]) return hoi('📥 Gửi `email` kèm tên mẫu: `duong` · `duy` · `phong` · `hai`.\nVí dụ: `ban@gmail.com duong`');
    ghiDong(ST_SHEET, ST_HEADERS, nd, {ho_so: JSON.stringify(stHsMau(khoaMau))});
    hsGhi(nd.email, nd.sdt, nd.ten, stHsMau(khoaMau), 'mau');
    return tgSend(chatId, '✅ Đã nạp hồ sơ *' + ST_HS_MAU[khoaMau].ten_goi + '* cho *' + nd.ten + '*.\nHọ sửa lại được trong tool ở mục Tài khoản → Hồ sơ kênh.');
  }
  if (cmd === 'lichsu'){
    var tb2 = []; try{ tb2 = JSON.parse(nd.thiet_bi || '[]') || []; }catch(e){}
    var ls = stLogCua(nd.ma, 15);
    var dau = ['🕵️ *Lịch sử AI · ' + nd.ten + '*', '`' + nd.email + '` · ' + (ndLaPro(nd) ? 'Pro' : 'Free'),
      '📱 *' + tb2.length + ' thiết bị* trong ' + ST_TB_NGAY + ' ngày' + (tb2.length > ST_TB_TOI_DA ? ' ⚠️ _cao bất thường_' : ''), ''];
    if (!ls.length) return tgSend(chatId, dau.concat(['_Chưa có lượt AI nào._']).join('\n'));
    var dongLs = ls.map(function(r){
      return '`' + String(r.thoi_gian).slice(5, 16) + '` ' + r.tool + ' · `' + String(r.thiet_bi).slice(0, 8) + '` ' +
        (r.ket_qua === 'ok' ? '' : '❌ ') + String(r.noi_dung).slice(0, 60);
    });
    return tgSend(chatId, dau.concat(dongLs).join('\n'));
  }
  if (cmd === 'timnd'){
    return tgSend(chatId, ['👤 *' + nd.ten + '* · `' + nd.ma + '`', '📧 `' + nd.email + '` · 📱 `' + nd.sdt + '`',
      ndLaPro(nd) ? '✦ Pro tới ' + stHan(nd.pro_han)
        : '🆓 Free · còn ' + ndLuotCon(nd,'hook') + '/' + ST_LUOT_THU + ' hook · ' +
          ndLuotCon(nd,'script') + '/' + ST_LUOT_KB + ' kịch bản · ' + ndLuotCon(nd,'soi') + '/' + ST_LUOT_SOI + ' soi · ' + ndLuotCon(nd,'cham') + '/' + ST_LUOT_CHAM + ' chấm',
      '📋 Hồ sơ kênh: ' + (ndCoHs(ndDocHs(nd)) ? (ndDocHs(nd).nganh || 'đã điền') + ' — xem bằng /hoso' : '_chưa điền_'),
      '🕐 Tạo ' + nd.tao + (nd.dangnhap_cuoi ? ' · đăng nhập ' + nd.dangnhap_cuoi : '')].join('\n'));
  }
  if (cmd === 'mopro'){
    var so2 = parseInt(arg.split(/\s+/)[1], 10) || (stGoi()[0] || {}).ngay || 30;
    var goc = ndLaPro(nd) ? new Date(nd.pro_han) : new Date(); goc.setDate(goc.getDate() + so2);
    ghiDong(ST_SHEET, ST_HEADERS, nd, {goi:'pro', pro_han: goc.toISOString()});
    return tgSend(chatId, '✅ Đã mở Pro cho *' + nd.ten + '* thêm ' + so2 + ' ngày, tới *' + stHan(goc) + '*.');
  }
  if (cmd === 'tatpro'){
    ghiDong(ST_SHEET, ST_HEADERS, nd, {goi:'free', pro_han: ''});
    return tgSend(chatId, '⛔ Đã tắt Pro của *' + nd.ten + '*.');
  }
}

/* ═══════ NHẬN CHUYỂN KHOẢN HỌC PHÍ NGAY TRONG FORM ĐĂNG KÝ HỌC VIÊN ═══════
   Bật/tắt bằng bot: /ckkhoa bat · tat. Số tiền: /tienkhoa (mặc định = giá ưu đãi).
   Nội dung chuyển khoản: "TMXK <mã đăng ký>". Tiền về thì bấm nút trên bot là duyệt luôn học viên. */
function khoaBat(){ return cfgProp('KHOA_CK') === '1'; }
function khoaTien(){
  var v = parseInt(cfgProp('KHOA_TIEN'), 10); if (v > 0) return v;
  var c = getConfig(); return Number(c.pricing.earlyBird) || Number(c.pricing.regular) || 0;
}
function khoaNhan(tien){ var c = getConfig(); return tien < (Number(c.pricing.earlyBird) || 0) ? 'Đặt cọc giữ chỗ' : 'Học phí'; }
function khoaTimDK(phone){
  var d = String(phone||'').replace(/\D/g,''); if (d.length < 9) return null;
  var lbl = cohortLabel(getConfig()), hit = null;
  allRegs().forEach(function(r){ if (r.cohort === lbl && String(r.phone).replace(/\D/g,'') === d && r.status !== 'rejected') hit = r });
  return hit;
}
function khoaTimMa(ma){ var hit = null; allRegs().forEach(function(r){ if (String(r.id).toUpperCase() === String(ma).toUpperCase()) hit = r }); return hit; }
function khoaGD(ma){ var k = 'TMXK' + String(ma).toUpperCase(), p = null; moiPay().forEach(function(x){ if (String(x.ma_ck).toUpperCase() === k) p = x }); return p; }

function stKhoa(b){
  if (!khoaBat()) return jsonOut({ok:true, bat:false});
  var bank = stNganHang(); if (!bank.ngan_hang || !bank.stk) return jsonOut({ok:true, bat:false});
  var dk = khoaTimDK(b.phone); if (!dk) return jsonOut({ok:true, bat:false});
  var tien = khoaTien(); if (!tien) return jsonOut({ok:true, bat:false});
  var nd = 'TMXK ' + dk.id, gd = khoaGD(dk.id);
  return jsonOut({ok:true, bat:true, bank:bank, so_tien:tien, nhan:khoaNhan(tien), noi_dung:nd, ma:dk.id,
                  qr: stQr(bank, tien, nd), da_nhan: !!(gd && gd.trangthai === 'da_nhan')});
}

function stKhoaDaChuyen(b){
  var dk = khoaTimDK(b.phone); if (!dk) return jsonOut({ok:false, error:'khong_thay'});
  var gd = khoaGD(dk.id);
  if (gd && gd.trangthai === 'da_nhan') return jsonOut({ok:true, da_nhan:true});
  var cache = CacheService.getScriptCache(), khoa = 'kck_' + dk.id;
  if (cache.get(khoa)) return jsonOut({ok:true, lap:true});     // bấm liên tục thì chỉ nhắn bot một lần mỗi 2 phút
  cache.put(khoa, '1', 120);
  var tien = khoaTien();
  if (!gd) bang(ST_PAY_SHEET, ST_PAY_HEADERS).appendRow(['TMXK' + dk.id, 'DK:' + dk.id, '', "'" + dk.phone, dk.name, 'khoa', String(tien), '', 'cho', nowVN(), '', 'nguoi_dung_bao ' + nowVN()]);
  else ghiDong(ST_PAY_SHEET, ST_PAY_HEADERS, gd, {trangthai:'cho', nguon:'nguoi_dung_bao ' + nowVN()});
  tgBroadcastKb(['🎓💸 *Học viên báo đã chuyển khoản*','',
    '👤 *' + dk.name + '* · mã `' + dk.id + '`', '📱 `' + dk.phone + '`', '🏫 ' + dk.cohort,
    '💰 ' + khoaNhan(tien) + ': *' + stTien(tien) + '*', '🧾 Nội dung CK: `TMXK ' + dk.id + '`','',
    'Kiểm tra tài khoản rồi bấm nút:'].join('\n'),
    [[{text:'✅ Đã nhận học phí · duyệt học viên', callback_data:'s:k:' + dk.id}],
     [{text:'❌ Chưa thấy tiền', callback_data:'s:kn:' + dk.id}]]);
  return jsonOut({ok:true});
}

function khoaCallback(cb, act, ma){
  var chatId = cb.message.chat.id, msgId = cb.message.message_id, nhan;
  var dk = khoaTimMa(ma), gd = khoaGD(ma);
  if (!dk) return tgAnswer(cb.id, 'Không tìm thấy mã ' + ma);
  if (act === 'k'){
    if (gd) ghiDong(ST_PAY_SHEET, ST_PAY_HEADERS, gd, {trangthai:'da_nhan', xac_nhan: nowVN()});
    else bang(ST_PAY_SHEET, ST_PAY_HEADERS).appendRow(['TMXK' + dk.id, 'DK:' + dk.id, '', "'" + dk.phone, dk.name, 'khoa', String(khoaTien()), '', 'da_nhan', nowVN(), nowVN(), 'admin']);
    sheet().getRange(dk.row, HEADERS.indexOf('status') + 1).setValue('approved');
    nhan = '✅ Đã nhận học phí · đã duyệt ' + dk.name;
  } else {
    if (gd && gd.trangthai === 'cho') ghiDong(ST_PAY_SHEET, ST_PAY_HEADERS, gd, {trangthai:'chua_thay', xac_nhan: nowVN()});
    nhan = '❌ Chưa thấy tiền · ' + dk.name;
  }
  tgAnswer(cb.id, nhan);
  tgApi('editMessageReplyMarkup', {chat_id:chatId, message_id:msgId, reply_markup:{inline_keyboard:[[{text:nhan, callback_data:'xong'}]]}});
}
