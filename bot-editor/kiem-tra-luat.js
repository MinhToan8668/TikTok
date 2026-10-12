/* Kiểm tra quy tắc tính hạn của Bot Editor mà không cần Apps Script.
   Chạy: node bot-editor/kiem-tra-luat.js */
var assert = require('assert');
var L = require('./Luat.gs');
var H = L.GIO_MS;
var dat = 0, truot = 0;
function thu(ten, fn){
  try{ fn(); dat++; console.log('✔ ' + ten); }
  catch(e){ truot++; console.log('✘ ' + ten + '\n   ' + e.message); }
}

// 20:00 thứ Hai 12/10/2026 giờ VN = 13:00 UTC
var T = Date.UTC(2026, 9, 12, 13, 0);

thu('cài đặt trống → lấy mặc định, draft 48h', function(){
  var c = L.docCaiDat('');
  assert.strictEqual(c.gioDraft, 48);
  assert.strictEqual(c.soVideoTuan, 2);
});

thu('cài đặt đã lưu ghi đè mặc định, khóa thiếu vẫn có', function(){
  var c = L.docCaiDat('{"gioDraft":72}');
  assert.strictEqual(c.gioDraft, 72);
  assert.strictEqual(c.luotSua, 2);
});

thu('đổi cài đặt bằng từ gõ tắt, không sửa object cũ', function(){
  var c = L.docCaiDat('');
  var r = L.doiCaiDat(c, 'draft', '72');
  assert.ok(r.ok);
  assert.strictEqual(r.caiDat.gioDraft, 72);
  assert.strictEqual(c.gioDraft, 48);
  assert.strictEqual(r.cu, 48);
});

thu('đổi số video, tự duyệt bằng chữ bat/tat', function(){
  var c = L.docCaiDat('');
  assert.strictEqual(L.doiCaiDat(c, 'video', '3').caiDat.soVideoTuan, 3);
  assert.strictEqual(L.doiCaiDat(c, 'tuduyet', 'tat').caiDat.tuDuyet, 0);
  assert.strictEqual(L.doiCaiDat(c, 'tuduyet', 'bật').caiDat.tuDuyet, 1);
});

thu('giá trị sai hoặc ngoài khoảng bị từ chối', function(){
  var c = L.docCaiDat('');
  assert.strictEqual(L.doiCaiDat(c, 'xyz', '3').loi, 'khong_co_khoa');
  assert.strictEqual(L.doiCaiDat(c, 'draft', 'abc').loi, 'khong_doc_duoc');
  assert.strictEqual(L.doiCaiDat(c, 'draft', '0').loi, 'ngoai_khoang');
  assert.strictEqual(L.doiCaiDat(c, 'video', '99').loi, 'ngoai_khoang');
});

thu('hạn draft = lúc chốt + 48h, hiển thị giờ VN', function(){
  var han = L.congGio(T, 48);
  assert.strictEqual(L.gioVN(han), '20:00 14/10');
});

thu('đếm ngược và báo trễ', function(){
  assert.strictEqual(L.conLai(T + 5 * H + 20 * 60000, T), 'còn 5 giờ 20 phút');
  assert.strictEqual(L.conLai(T - 26 * H, T), 'trễ 1 ngày 2 giờ');
});

thu('đầu tuần là 00:00 thứ Hai giờ VN', function(){
  assert.strictEqual(L.gioVN(L.dauTuan(T)), '00:00 12/10');
  // 06:00 sáng Chủ nhật 18/10 VN vẫn thuộc tuần 12/10
  assert.strictEqual(L.gioVN(L.dauTuan(Date.UTC(2026, 9, 17, 23, 0))), '00:00 12/10');
});

thu('nhắc trước hạn draft một lần, rồi báo trễ một lần', function(){
  var c = L.docCaiDat('');
  var v = {trangThai:'dang_edit', hanDraft:T + 48 * H, daNhac:''};
  assert.deepStrictEqual(L.canNhac(v, T, c), []);
  assert.deepStrictEqual(L.canNhac(v, T + 43 * H, c), ['draft_sap']);
  v.daNhac = L.themCo(v.daNhac, 'draft_sap');
  assert.deepStrictEqual(L.canNhac(v, T + 44 * H, c), []);
  assert.deepStrictEqual(L.canNhac(v, T + 49 * H, c), ['draft_tre']);
  v.daNhac = L.themCo(v.daNhac, 'draft_tre');
  assert.deepStrictEqual(L.canNhac(v, T + 60 * H, c), []);
});

thu('hết hạn góp ý → gopy_het; video xong thì không nhắc', function(){
  var c = L.docCaiDat('');
  assert.deepStrictEqual(L.canNhac({trangThai:'cho_duyet', hanGopY:T}, T + H, c), ['gopy_het']);
  assert.deepStrictEqual(L.canNhac({trangThai:'hoan_thanh', hanDraft:T}, T + H, c), []);
  assert.deepStrictEqual(L.canNhac({trangThai:'kich_ban'}, T, c), []);
});

thu('vượt vòng sửa miễn phí', function(){
  var c = L.docCaiDat('');
  assert.strictEqual(L.vuotLuotSua(2, c), false);
  assert.strictEqual(L.vuotLuotSua(3, c), true);
});

thu('thống kê tuần: đúng hạn, trễ, hoàn thành, đổi kịch bản', function(){
  var c = L.docCaiDat('');
  var vs = [
    {chotLuc:T - 10 * H, nopDauLuc:T, dungHanDraft:'1', duyetLuc:T + H, soLanSua:'1'},
    {chotLuc:T, nopDauLuc:T + 50 * H, dungHanDraft:'0', duyetLuc:'', soLanSua:'0'},
    {chotLuc:T - 9 * 24 * H}   // tuần trước
  ];
  var tk = L.thongKeTuan(vs, T, c, [{suKien:'doi_kb_sau_chot', luc:T}]);
  assert.deepStrictEqual(tk, {mucTieu:2, daChot:2, daNop:2, dungHan:1, treHan:1, hoanThanh:1, vuotSua:0, doiKB:1});
});

thu('mã video kế tiếp', function(){
  assert.strictEqual(L.maKeTiep([]), 'V001');
  assert.strictEqual(L.maKeTiep([{ma:'V009'}, {ma:'V002'}]), 'V010');
});

console.log('\n' + dat + ' đạt, ' + truot + ' trượt');
process.exit(truot ? 1 : 0);
