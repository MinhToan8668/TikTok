/* ═══════════════════════════════════════════════════════════════
   CẦU NỐI XA: Claude Code (trên máy khác, hoặc phiên cloud claude.ai) ↔ tab trình dựng đang mở.
   Hộp thư trung gian trên CacheService (không cần Sheet, không cần KV), ghép đôi bằng MÃ 6 ký tự
   hiện trên tab trình dựng. Người dùng nói mã cho Claude; Claude gửi lệnh lên đây, tab lấy về chạy
   (bộ lệnh của trợ lý dựng hoặc fc_* của FilmCraft), rồi gửi kết quả lên để Claude đọc.

   Tab gọi:     cc_nhan {ma, tt}            mỗi 2–8 giây: ghi nhịp + tóm tắt dự án, nhận lệnh đang chờ
                cc_kq   {ma, id, ket_qua}   nộp kết quả một lô lệnh
   Claude gọi:  cc_xem  {ma}                tóm tắt dự án + tab còn mở không
                cc_gui  {ma, id, lenh:[{ten,a}]}   xếp một lô lệnh vào hàng đợi
                cc_doc  {ma, id}            đọc kết quả (cho:true nếu chưa có)
   Mọi mục cache sống 6 giờ, mỗi giá trị tối đa ~100 KB nên tab phải tự thu nhỏ ảnh và cắt text.
   ═══════════════════════════════════════════════════════════════ */
var CC_TTL = 21600, CC_NHIP_MAX = 20000, CC_HANG_DOI_MAX = 20, CC_KB_MAX = 95 * 1024;

function ccApi(b){
  var act = String(b.action || ''), ma = String(b.ma || '').toUpperCase();
  if (!/^[A-Z0-9]{6,8}$/.test(ma)) return {ok:false, error:'ma_sai'};
  if (act === 'cc_nhan') return ccNhan(ma, b);
  if (act === 'cc_kq')   return ccKq(ma, b);
  if (act === 'cc_xem')  return ccXem(ma);
  if (act === 'cc_gui')  return ccGui(ma, b);
  if (act === 'cc_doc')  return ccDoc(ma, b);
  return {ok:false, error:'unknown_action'};
}
function ccCache(){ return CacheService.getScriptCache(); }
function ccDocJson(k){ try{ var v = ccCache().get(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
function ccGhiJson(k, o){ var s = JSON.stringify(o); if (s.length > CC_KB_MAX) return false; ccCache().put(k, s, CC_TTL); return true; }
function ccKhoa(fn){ var l = LockService.getScriptLock(); l.waitLock(5000); try{ return fn(); } finally { l.releaseLock(); } }
function ccId(v){ return String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); }

/* tab: ghi nhịp + tóm tắt, lấy lệnh đang chờ */
function ccNhan(ma, b){
  var tt = {nhip: Date.now(), trinh_dung: String(b.trinh_dung || '').slice(0, 40), du_an: b.tt == null ? null : b.tt};
  if (!ccGhiJson('cc:' + ma + ':tt', tt)) ccGhiJson('cc:' + ma + ':tt', {nhip: tt.nhip, trinh_dung: tt.trinh_dung, du_an: {loi: 'tom_tat_qua_dai'}});
  var lo = ccKhoa(function(){ var q = ccDocJson('cc:' + ma + ':lenh') || []; if (q.length) ccCache().remove('cc:' + ma + ':lenh'); return q; });
  return {ok:true, lo: lo};
}
/* tab: nộp kết quả */
function ccKq(ma, b){
  var id = ccId(b.id); if (!id) return {ok:false, error:'thieu_id'};
  var kq = {id: id, luc: Date.now(), ket_qua: Array.isArray(b.ket_qua) ? b.ket_qua : []};
  if (!ccGhiJson('cc:' + ma + ':kq:' + id, kq)){
    kq.ket_qua = kq.ket_qua.map(function(r){ return {ten: r.ten, isError: r.isError, text: String(typeof r.text === 'string' ? r.text : JSON.stringify(r.text)).slice(0, 4000), image: undefined, cat: true}; });
    if (!ccGhiJson('cc:' + ma + ':kq:' + id, kq)) return {ok:false, error:'ket_qua_qua_dai'};
  }
  return {ok:true};
}
/* Claude: tab còn mở không + tóm tắt dự án */
function ccXem(ma){
  var tt = ccDocJson('cc:' + ma + ':tt');
  if (!tt) return {ok:false, error:'chua_co_tab', goi_y:'Mở trình dựng, bấm "Nối với Claude Code" và kiểm tra lại mã'};
  var tre = Date.now() - (tt.nhip || 0);
  return {ok:true, tab_mo: tre < CC_NHIP_MAX, tre_ms: tre, trinh_dung: tt.trinh_dung, du_an: tt.du_an};
}
/* Claude: xếp lô lệnh vào hàng đợi */
function ccGui(ma, b){
  var tt = ccDocJson('cc:' + ma + ':tt');
  if (!tt) return {ok:false, error:'chua_co_tab'};
  if (Date.now() - (tt.nhip || 0) > CC_NHIP_MAX) return {ok:false, error:'tab_khong_mo', tre_ms: Date.now() - tt.nhip, goi_y:'Tab trình dựng đã đóng hoặc tắt nối. Bảo người dùng mở lại và bấm "Nối với Claude Code".'};
  var id = ccId(b.id) || ('l' + Date.now().toString(36)), lenh = Array.isArray(b.lenh) ? b.lenh.slice(0, 30) : null;
  if (!lenh || !lenh.length) return {ok:false, error:'thieu_lenh'};
  var ok = ccKhoa(function(){
    var q = ccDocJson('cc:' + ma + ':lenh') || [];
    if (q.length >= CC_HANG_DOI_MAX) return false;
    q.push({id: id, lenh: lenh});
    return ccGhiJson('cc:' + ma + ':lenh', q);
  });
  if (!ok) return {ok:false, error:'hang_doi_day'};
  return {ok:true, id: id, trinh_dung: tt.trinh_dung};
}
/* Claude: đọc kết quả, đọc xong thì xoá */
function ccDoc(ma, b){
  var id = ccId(b.id); if (!id) return {ok:false, error:'thieu_id'};
  var kq = ccDocJson('cc:' + ma + ':kq:' + id);
  if (!kq){ var tt = ccDocJson('cc:' + ma + ':tt'); var tre = tt ? Date.now() - (tt.nhip || 0) : null; return {ok:true, cho:true, tab_mo: tre != null && tre < CC_NHIP_MAX}; }
  ccCache().remove('cc:' + ma + ':kq:' + id);
  return {ok:true, cho:false, id: id, ket_qua: kq.ket_qua};
}
