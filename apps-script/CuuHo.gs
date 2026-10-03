/* ═══ CỨU HỘ TÀI KHOẢN — chạy tay trong trình soạn Apps Script, KHÔNG cần Deploy ═══
   Cách dùng: dán file này vào dự án Apps Script (File mới → CuuHo.gs), sửa EMAIL_CUU_HO và MAT_KHAU_MOI,
   chọn hàm ở thanh trên rồi bấm Run. Lần đầu Google hỏi quyền, cho phép rồi Run lại.
   - moKhoaDangNhap(): xoá khoá tạm 10 phút sau khi nhập sai mật khẩu 5 lần.
   - datLaiMatKhau():  đặt mật khẩu mới cho email (tìm ở cả bảng NguoiDung lẫn HocVien), đồng thời mở khoá.
   Nhật ký hiện ở khung Execution log phía dưới. */
var EMAIL_CUU_HO = 'minhtoantowork@gmail.com';
var MAT_KHAU_MOI = 'DoiMatKhauNay123';   // ít nhất 6 ký tự, đổi trước khi chạy

function moKhoaDangNhap(){
  var email = chuanEmail(EMAIL_CUU_HO);
  CacheService.getScriptCache().remove('st_dn_' + email);
  Logger.log('Đã mở khoá đăng nhập cho ' + email + '. Thử đăng nhập lại ngay.');
}

function datLaiMatKhau(){
  var email = chuanEmail(EMAIL_CUU_HO), pass = String(MAT_KHAU_MOI || '');
  if (pass.length < 6) throw new Error('Mật khẩu mới phải từ 6 ký tự');
  var salt = chuoiNgauNhien(16), hash = bamMK(pass, salt), dau = [];
  var nd = ndTheoEmail(email);
  if (nd){ ghiDong(ST_SHEET, ST_HEADERS, nd, {salt: salt, hash: hash}); dau.push('NguoiDung (Viral Studio)'); }
  var hv = hvTheoEmail(email);
  if (hv){ ghiDong(SHEET_HV, HV_HEADERS, hv, {salt: salt, hash: hash}); dau.push('HocVien (khu học viên)'); }
  if (!dau.length) throw new Error('Không thấy tài khoản nào có email ' + email + ' trong bảng NguoiDung lẫn HocVien. Kiểm tra lại email hoặc tạo tài khoản mới.');
  CacheService.getScriptCache().remove('st_dn_' + email);
  Logger.log('Đã đặt mật khẩu mới cho ' + email + ' ở: ' + dau.join(', ') + '. Đăng nhập bằng mật khẩu mới ngay được.');
}

function xemTaiKhoan(){
  var email = chuanEmail(EMAIL_CUU_HO), nd = ndTheoEmail(email), hv = hvTheoEmail(email);
  Logger.log(email + ' → NguoiDung: ' + (nd ? ('có, trạng thái ' + nd.trangthai + ', gói ' + nd.goi) : 'không') + ' · HocVien: ' + (hv ? ('có, vai trò ' + hv.vaitro + ', trạng thái ' + hv.trangthai) : 'không'));
  Logger.log('Đang khoá tạm? ' + (Number(CacheService.getScriptCache().get('st_dn_' + email) || 0) >= 5 ? 'CÓ' : 'không') + ' (số lần sai gần đây: ' + (CacheService.getScriptCache().get('st_dn_' + email) || 0) + ')');
}
