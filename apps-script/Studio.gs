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

var ST_SHEET       = 'NguoiDung';
var ST_HEADERS     = ['ma','email','sdt','ten','salt','hash','goi','pro_han','luot_dung',
                      'token','token_han','tao','dangnhap_cuoi','trangthai','ghichu'];
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

/* ═══════ LỆNH BOT TELEGRAM (chỉ chat quản trị) ═══════
   Code.gs gọi:  if (quanTri && studioCoLenh(cmd)) return studioLenh(cmd, arg, chatId);  */
var LENH_STUDIO = ['studio','stk','giapro','ngaypro','luotthu','luotai','mopro','tatpro','dsck','timnd'];
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

  if (cmd === 'studio'){
    var bank = stNganHang(), g = stGoi()[0] || {}, ds = moiND(), pay = moiPay();
    var soPro = ds.filter(ndLaPro).length, cho = pay.filter(function(p){ return p.trangthai === 'cho' }).length;
    return tgSend(chatId, [
      '🎬 *Viral Studio · cài đặt bán Pro*','',
      '🏦 Nhận tiền: ' + (bank.stk ? '*' + bank.ngan_hang + '* · `' + bank.stk + '` · ' + bank.chu_tk : '⚠️ _chưa cài, người dùng chưa mua được_'),
      '💰 Gói: *' + (g.ten || '?') + '* · *' + stTien(g.gia || 0) + '*',
      '🎁 Tài khoản mới: *' + ST_LUOT_THU + '* lượt AI phân tích miễn phí',
      '🤖 Pro và học viên: *' + (parseInt((typeof hookCfg === 'function' ? hookCfg('HOOK_AI_DAILY') : cfgProp('HOOK_AI_DAILY')) || '20', 10)) + '* lượt AI mỗi ngày',
      '👥 ' + ds.length + ' người dùng · ' + soPro + ' đang Pro · ' + cho + ' giao dịch chờ','',
      '*Lệnh*',
      '🏦 /stk `MB | 0123456789 | NGUYEN VAN A` — tài khoản nhận tiền',
      '💰 /giapro `50000` — giá gói Pro',
      '📆 /ngaypro `30` — gói dùng bao nhiêu ngày',
      '🎁 /luotthu `10` — số lượt AI miễn phí cho tài khoản mới',
      '🤖 /luotai `20` — lượt AI mỗi ngày của Pro và học viên',
      '🧾 /dsck — giao dịch đang chờ, bấm nút để mở Pro',
      '🔎 /timnd `email` — xem một người dùng',
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
  if (cmd === 'luotthu'){
    if (!arg) return hoi('🎁 Mỗi tài khoản mới được bao nhiêu lượt AI phân tích miễn phí? Ví dụ `10`');
    var n = parseInt(arg, 10); if (isNaN(n) || n < 0 || n > 1000) return hoi('Gửi một con số từ 0 đến 1000.');
    P.setProperty('ST_LUOT_THU', String(n));
    return tgSend(chatId, '✅ Tài khoản Free giờ có *' + n + '* lượt AI phân tích miễn phí (áp dụng cho cả người đã đăng ký, tính theo số lượt họ đã dùng).');
  }
  if (cmd === 'luotai'){
    if (!arg) return hoi('🤖 Pro và học viên được bao nhiêu lượt AI mỗi ngày? Ví dụ `20`');
    var d = parseInt(arg, 10); if (!d || d < 1 || d > 1000) return hoi('Gửi một con số từ 1 đến 1000.');
    P.setProperty('HOOK_AI_DAILY', String(d));
    return tgSend(chatId, '✅ Pro và học viên giờ có *' + d + '* lượt AI mỗi ngày.');
  }

  if (cmd === 'dsck'){
    var chos = moiPay().filter(function(p){ return p.trangthai === 'cho' || p.trangthai === 'chua_thay' });
    if (!chos.length) return tgSend(chatId, '🧾 Không có giao dịch nào đang chờ.');
    tgSend(chatId, '🧾 *' + chos.length + ' giao dịch chưa mở Pro* (mới nhất ở dưới)');
    chos.slice(-10).forEach(function(p){
      tgSend(chatId, ['🧾 `' + p.ma_ck + '` · ' + (p.trangthai === 'cho' ? (String(p.nguon).indexOf('nguoi_dung_bao') === 0 ? '💸 đã báo chuyển' : '⏳ chưa báo') : '❌ đã bấm chưa thấy'),
        '👤 *' + p.ten + '* · `' + p.email + '` · `' + p.sdt + '`', '💰 ' + stTien(p.so_tien) + ' · tạo ' + p.tao].join('\n'),
        [[{text:'✅ Đã nhận tiền · mở Pro', callback_data:'s:ok:' + p.ma_ck}]]);
    });
    return;
  }

  // các lệnh theo email
  if (!arg) return hoi('Gửi email người dùng' + (cmd === 'mopro' ? ', kèm số ngày nếu muốn (ví dụ `ban@gmail.com 30`)' : '') + '.');
  var em = arg.split(/\s+/)[0], nd = ndTheoEmail(em);
  if (!nd) return tgSend(chatId, '🔎 Không thấy người dùng Viral Studio có email `' + em + '`.');
  if (cmd === 'timnd'){
    return tgSend(chatId, ['👤 *' + nd.ten + '* · `' + nd.ma + '`', '📧 `' + nd.email + '` · 📱 `' + nd.sdt + '`',
      ndLaPro(nd) ? '✦ Pro tới ' + stHan(nd.pro_han) : '🆓 Free · còn ' + ndLuotCon(nd) + '/' + ST_LUOT_THU + ' lượt AI',
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
