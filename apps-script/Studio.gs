/**
 * ═══════════════════════════════════════════════════════════════
 *  Studio.gs — tài khoản NGƯỜI DÙNG của Viral Studio (tools/hook-text.html)
 * ═══════════════════════════════════════════════════════════════
 *  Ba loại người dùng Pro:
 *   • Người dùng tự đăng ký (email + SĐT + mật khẩu): có ngay 5 lượt dùng thử Pro.
 *     Hết lượt thì mua Pro bằng chuyển khoản.
 *   • Người dùng đã mua Pro: dùng Pro tới ngày hết hạn, AI 20 lượt mỗi ngày.
 *   • Học viên Tự Mình Xây Kênh (bảng HocVien trong Lich.gs): Pro không giới hạn.
 *
 *  Mở Pro sau khi chuyển khoản, hai cách chạy song song:
 *   • Tự động: nối webhook SePay hoặc Casso vào  <URL web app>?pay=<ST_WEBHOOK_KEY>
 *     Tiền vào có nội dung đúng mã "VS..." và đủ số tiền là mở Pro ngay.
 *   • Bằng tay: người dùng bấm "Tôi đã chuyển khoản", bot Telegram nhắn về
 *     kèm nút "Đã nhận tiền · mở Pro". Bấm là xong.
 *
 *  Cần thêm 3 dòng vào Code.gs (xem HUONG-DAN.md, mục Viral Studio).
 * ═══════════════════════════════════════════════════════════════
 */

/* ═══════ CẤU HÌNH BÁN PRO ═══════
   Điền thẳng vào đây, hoặc đặt Script properties cùng tên (ưu tiên Script properties).
   Mã ngân hàng theo VietQR: VCB, MB, TCB, ACB, BIDV, VPB, TPB, VIB, STB, OCB, ICB (VietinBank)... */
var ST_NGAN_HANG_MD    = '';   // vd 'MB'
var ST_STK_MD          = '';   // số tài khoản nhận tiền
var ST_CHU_TK_MD       = '';   // tên chủ tài khoản, IN HOA KHÔNG DẤU
var ST_WEBHOOK_KEY_MD  = '';   // chuỗi bí mật tự đặt (20 ký tự trở lên) cho webhook SePay/Casso
var ST_GOI_MD = [
  {ma:'m1', ten:'Pro 1 tháng', gia:99000,  ngay:30},
  {ma:'m3', ten:'Pro 3 tháng', gia:249000, ngay:90}
];
var ST_LUOT_THU = 5;           // số lượt dùng thử Pro cho mỗi tài khoản mới

var ST_SHEET       = 'NguoiDung';
var ST_HEADERS     = ['ma','email','sdt','ten','salt','hash','goi','pro_han','luot_dung',
                      'token','token_han','tao','dangnhap_cuoi','trangthai','ghichu'];
var ST_PAY_SHEET   = 'ThanhToan';
var ST_PAY_HEADERS = ['ma_ck','ma_nd','email','sdt','ten','goi','so_tien','ngay',
                      'trangthai','tao','xac_nhan','nguon'];

function stCfg(k){
  var v = cfgProp(k); if (v) return v;
  return ({ST_NGAN_HANG:ST_NGAN_HANG_MD, ST_STK:ST_STK_MD, ST_CHU_TK:ST_CHU_TK_MD,
           ST_WEBHOOK_KEY:ST_WEBHOOK_KEY_MD})[k] || '';
}
function stGoi(){
  try{ var v = cfgProp('ST_GOI'); if (v) return JSON.parse(v); }catch(e){}
  return ST_GOI_MD;
}

/* ═══════ BẢNG ═══════ */
function moiND(){  return docBang(ST_SHEET, ST_HEADERS, {token_han:oMoc, pro_han:oMoc}); }
function moiPay(){ return docBang(ST_PAY_SHEET, ST_PAY_HEADERS); }
function ndTheoEmail(e){ e = chuanEmail(e); var r = null; moiND().forEach(function(x){ if (!r && chuanEmail(x.email) === e) r = x }); return r; }
function ndTheoMa(ma){ ma = String(ma||'').toUpperCase(); var r = null; moiND().forEach(function(x){ if (!r && String(x.ma).toUpperCase() === ma) r = x }); return r; }
function sdtHopLe(s){ var d = String(s||'').replace(/\D/g,''); return d.length >= 9 && d.length <= 12; }
function ndLaPro(nd){ return !!(nd && nd.pro_han && new Date(nd.pro_han) > new Date()); }
function ndLuotCon(nd){ return Math.max(0, ST_LUOT_THU - (parseInt(nd.luot_dung,10) || 0)); }
function ndHoSo(nd){
  return {loai:'nd', ma:nd.ma, ten:nd.ten, email:nd.email, sdt:nd.sdt, pro:ndLaPro(nd),
          pro_han:nd.pro_han, luot_con:ndLuotCon(nd), luot_thu:ST_LUOT_THU};
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
    return jsonOut({ok:false, error:'unknown_action'});
  }catch(err){
    ghiLoi('studioApi/'+act, err);
    return jsonOut({ok:false, error:'internal'});
  }
}

function stNganHang(){ return {ngan_hang: stCfg('ST_NGAN_HANG'), stk: stCfg('ST_STK'), chu_tk: stCfg('ST_CHU_TK')}; }
function stCauHinh(){ return jsonOut({ok:true, goi: stGoi(), bank: stNganHang(), luot_thu: ST_LUOT_THU}); }

/* ── đăng ký: không cần duyệt, có ngay 5 lượt thử ── */
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
  try{ tgBroadcast(['🆕 *Người dùng Viral Studio mới*','','👤 *'+ten+'*','📧 `'+email+'`','📱 `'+sdt+'`','🎁 '+ST_LUOT_THU+' lượt Pro dùng thử','🕐 '+nowVN()].join('\n')); }catch(e){}
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
    if (hv.vaitro !== 'hv' && hv.vaitro !== 'mentor') return jsonOut({ok:false, error:'cho_duyet'});
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
  if (hv) return jsonOut({ok:true, ho_so:{loai:'hv', ten:hv.ten_goi||hv.ten, email:hv.email, pro:true, vaitro:hv.vaitro}});
  return jsonOut({ok:false, error:'het_phien'});
}

/* ── lượt dùng thử: người dùng Free trừ 1 lượt; Pro và học viên không trừ ── */
function stTruLuotThu(ma){
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var nd = ndTheoMa(ma); if (!nd) return -1;
    var da = parseInt(nd.luot_dung,10) || 0;
    if (da >= ST_LUOT_THU) return -1;
    ghiDong(ST_SHEET, ST_HEADERS, nd, {luot_dung: String(da + 1)});
    return ST_LUOT_THU - da - 1;
  } finally { lock.releaseLock(); }
}
function stHoanLuotThu(ma){
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try{
    var nd = ndTheoMa(ma); if (!nd) return;
    var da = parseInt(nd.luot_dung,10) || 0;
    if (da > 0) ghiDong(ST_SHEET, ST_HEADERS, nd, {luot_dung: String(da - 1)});
  } finally { lock.releaseLock(); }
}
function stDungLuot(b){
  var nd = ndTuToken(b.token);
  if (!nd){ return aiDay(b.token) ? jsonOut({ok:true, pro:true}) : jsonOut({ok:false, error:'het_phien'}); }
  if (ndLaPro(nd)) return jsonOut({ok:true, pro:true});
  var con = stTruLuotThu(nd.ma);
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
  ghiDong(ST_PAY_SHEET, ST_PAY_HEADERS, p, {nguon:'nguoi_dung_bao ' + nowVN()});
  tgBroadcastKb(['💸 *Viral Studio: có người báo đã chuyển khoản*','',
    '👤 *'+nd.ten+'*','📧 `'+nd.email+'`','📱 `'+nd.sdt+'`',
    '📦 '+p.goi+' · *'+Number(p.so_tien).toLocaleString('vi-VN')+'đ*',
    '🧾 Nội dung CK: `'+p.ma_ck+'`','',
    'Kiểm tra tài khoản rồi bấm nút:'].join('\n'),
    [[{text:'✅ Đã nhận tiền · mở Pro', callback_data:'s:ok:'+p.ma_ck}],
     [{text:'❌ Chưa thấy tiền', callback_data:'s:no:'+p.ma_ck}]]);
  return jsonOut({ok:true});
}

/* ── mở Pro cho một giao dịch (dùng chung cho nút bot và webhook) ── */
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

/* ── webhook ngân hàng: SePay hoặc Casso gọi vào <URL>?pay=<ST_WEBHOOK_KEY> ── */
function studioWebhook(e, body){
  var key = stCfg('ST_WEBHOOK_KEY');
  if (!key || String(e.parameter.pay) !== key) return jsonOut({success:false});
  var ds = [];
  if (body && Array.isArray(body.data)) body.data.forEach(function(t){ ds.push({nd: t.description || t.content || '', tien: Number(t.amount) || 0}) });  // Casso
  else if (body) ds.push({nd: body.content || body.description || '', tien: Number(body.transferAmount || body.amount) || 0, vao: body.transferType !== 'out'});  // SePay
  ds.forEach(function(t){
    if (t.vao === false) return;
    var m = String(t.nd).toUpperCase().replace(/\s+/g, '').match(/VS[A-Z0-9]{8}/);
    if (!m) return;
    var p = null; moiPay().forEach(function(x){ if (String(x.ma_ck).toUpperCase() === m[0]) p = x });
    if (!p || p.trangthai === 'da_nhan') return;
    if (t.tien < Number(p.so_tien)){
      tgBroadcast('⚠️ *Viral Studio:* tiền vào mã `'+p.ma_ck+'` là '+t.tien.toLocaleString('vi-VN')+'đ, thiếu so với '+Number(p.so_tien).toLocaleString('vi-VN')+'đ. Chưa mở Pro, kiểm tra giúp.');
      return;
    }
    var kq = stKichHoat(p.ma_ck, 'tu_dong');
    if (kq.ok && !kq.lap) tgBroadcast('💰 *Viral Studio: tự mở Pro*\n\n👤 *'+p.ten+'* · `'+p.email+'`\n📦 '+p.goi+' · '+t.tien.toLocaleString('vi-VN')+'đ\n🧾 `'+p.ma_ck+'`');
  });
  return jsonOut({success:true});
}
