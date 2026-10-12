/**
 * ═══════════════════════════════════════════════════════════════
 *  BOT EDITOR — LUẬT CHỐT (hàm thuần, không gọi Sheet/Telegram)
 * ═══════════════════════════════════════════════════════════════
 *  Toàn bộ quy tắc tính hạn, nhắc hạn, đếm lượt sửa nằm ở đây để
 *  kiểm tra được bằng Node mà không cần Apps Script:
 *    node bot-editor/kiem-tra-luat.js
 *  Thời gian lưu dạng mili-giây (số), hiển thị theo giờ Việt Nam.
 * ═══════════════════════════════════════════════════════════════
 */

/* Các con số thỏa thuận — sửa bằng lệnh /caidat trong Telegram,
   không cần sửa code. Đây chỉ là giá trị lúc mới cài. */
var CAI_DAT_MAC_DINH = {
  soVideoTuan:  2,    // mục tiêu số video mỗi tuần
  gioDraft:     48,   // từ lúc CẢ HAI chốt kịch bản → có bản draft
  gioGopY:      24,   // từ lúc nộp draft → khách góp ý
  gioSua:       24,   // từ lúc nhận góp ý → nộp bản sửa
  luotSua:      2,    // số vòng sửa miễn phí mỗi video
  gioNhacTruoc: 6,    // nhắc trước hạn bao nhiêu giờ
  tuDuyet:      1     // 1: hết hạn góp ý mà im lặng thì coi như duyệt · 0: chỉ nhắc
};

/* Thứ tự hiển thị + tên gọi + giới hạn hợp lệ + từ khóa gõ tắt */
var CAI_DAT_MO_TA = [
  {khoa:'soVideoTuan',  tat:['video','sovideo'],        ten:'Mục tiêu mỗi tuần',          donVi:'video', min:1, max:30},
  {khoa:'gioDraft',     tat:['draft','gioDraft'],       ten:'Có draft sau khi chốt KB',   donVi:'giờ',   min:1, max:720},
  {khoa:'gioGopY',      tat:['gopy','gioGopY'],         ten:'Khách góp ý sau khi nhận draft', donVi:'giờ', min:1, max:720},
  {khoa:'gioSua',       tat:['sua','gioSua'],           ten:'Nộp bản sửa sau khi nhận góp ý', donVi:'giờ', min:1, max:720},
  {khoa:'luotSua',      tat:['luotsua','luot'],         ten:'Vòng sửa miễn phí mỗi video', donVi:'vòng', min:0, max:20},
  {khoa:'gioNhacTruoc', tat:['nhac','gioNhacTruoc'],    ten:'Nhắc trước hạn',             donVi:'giờ',   min:0, max:72},
  {khoa:'tuDuyet',      tat:['tuduyet','duyet'],        ten:'Im lặng quá hạn góp ý = duyệt', donVi:'',  min:0, max:1}
];

var GIO_MS = 3600 * 1000;
var LECH_VN_MS = 7 * GIO_MS;   // GMT+7

var TRANG_THAI = {
  kich_ban:   '📝 chờ chốt kịch bản',
  dang_edit:  '🎬 đang edit draft',
  cho_duyet:  '👀 chờ khách xem',
  dang_sua:   '✏️ đang sửa',
  hoan_thanh: '✅ hoàn thành'
};

/* ───────────── Cài đặt ───────────── */

/** Đọc cài đặt đã lưu (chuỗi JSON), thiếu khóa nào lấy mặc định. Trả bản mới. */
function docCaiDat(chuoiJson){
  var da = {};
  try{ da = JSON.parse(chuoiJson || '{}') || {}; }catch(e){ da = {}; }
  var ra = {};
  Object.keys(CAI_DAT_MAC_DINH).forEach(function(k){
    var v = Number(da[k]);
    ra[k] = isFinite(v) && da[k] !== '' && da[k] !== null ? v : CAI_DAT_MAC_DINH[k];
  });
  return ra;
}

/** Tìm mô tả theo tên khóa hoặc từ gõ tắt, không phân biệt hoa thường. */
function timMoTa(tu){
  var t = String(tu || '').trim().toLowerCase();
  if (!t) return null;
  for (var i = 0; i < CAI_DAT_MO_TA.length; i++){
    var m = CAI_DAT_MO_TA[i];
    if (m.khoa.toLowerCase() === t) return m;
    for (var j = 0; j < m.tat.length; j++) if (m.tat[j].toLowerCase() === t) return m;
  }
  return null;
}

/**
 * Đổi một giá trị cài đặt. Không sửa object cũ.
 * → {ok:true, caiDat, moTa, cu, moi}  hoặc  {ok:false, loi}
 */
function doiCaiDat(caiDat, tu, giaTriChu){
  var moTa = timMoTa(tu);
  if (!moTa) return {ok:false, loi:'khong_co_khoa'};
  var chu = String(giaTriChu == null ? '' : giaTriChu).trim().toLowerCase();
  var so;
  if (moTa.khoa === 'tuDuyet' && /^(bat|bật|on|co|có)$/.test(chu)) so = 1;
  else if (moTa.khoa === 'tuDuyet' && /^(tat|tắt|off|khong|không)$/.test(chu)) so = 0;
  else so = /\d/.test(chu) ? Number(chu.replace(',', '.').replace(/[^\d.]/g, '')) : NaN;
  if (!isFinite(so)) return {ok:false, loi:'khong_doc_duoc', moTa:moTa};
  if (moTa.khoa !== 'gioDraft' && moTa.khoa !== 'gioGopY' && moTa.khoa !== 'gioSua') so = Math.round(so);
  if (so < moTa.min || so > moTa.max) return {ok:false, loi:'ngoai_khoang', moTa:moTa};
  var moi = {};
  Object.keys(caiDat).forEach(function(k){ moi[k] = caiDat[k]; });
  moi[moTa.khoa] = so;
  return {ok:true, caiDat:moi, moTa:moTa, cu:caiDat[moTa.khoa], moi:so};
}

function giaTriDep(moTa, v){
  if (moTa.khoa === 'tuDuyet') return Number(v) ? 'bật' : 'tắt';
  return v + (moTa.donVi ? ' ' + moTa.donVi : '');
}

/* ───────────── Thời gian ───────────── */

function congGio(ms, gio){ return Number(ms) + Number(gio) * GIO_MS; }

function pad2(n){ n = Number(n) || 0; return n < 10 ? '0' + n : '' + n; }

/** 20:00 14/10 — giờ Việt Nam */
function gioVN(ms){
  if (!ms) return '—';
  var d = new Date(Number(ms) + LECH_VN_MS);
  return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ' ' +
         pad2(d.getUTCDate()) + '/' + pad2(d.getUTCMonth() + 1);
}

/** "còn 5 giờ 20 phút" / "trễ 1 ngày 2 giờ" */
function conLai(hanMs, nowMs){
  if (!hanMs) return '';
  var lech = Number(hanMs) - Number(nowMs);
  var tre = lech < 0;
  var phut = Math.round(Math.abs(lech) / 60000);
  var ngay = Math.floor(phut / 1440), gio = Math.floor((phut % 1440) / 60), p = phut % 60;
  var chu = ngay ? ngay + ' ngày' + (gio ? ' ' + gio + ' giờ' : '')
          : gio ? gio + ' giờ' + (p ? ' ' + p + ' phút' : '')
          : p + ' phút';
  return (tre ? 'trễ ' : 'còn ') + chu;
}

/** Mốc 00:00 thứ Hai (giờ VN) của tuần chứa nowMs, trả mili-giây UTC */
function dauTuan(nowMs){
  var d = new Date(Number(nowMs) + LECH_VN_MS);
  var thu = (d.getUTCDay() + 6) % 7;          // thứ Hai = 0
  var nuaDem = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return nuaDem - thu * 24 * GIO_MS - LECH_VN_MS;
}

/** Thứ (0 = CN … 6 = T7) và giờ theo giờ VN, dùng cho lịch nhắc tuần */
function thuGioVN(nowMs){
  var d = new Date(Number(nowMs) + LECH_VN_MS);
  return {thu:d.getUTCDay(), gio:d.getUTCHours()};
}

/* ───────────── Video ───────────── */

/** Hạn đang áp dụng cho trạng thái hiện tại của video */
function hanHienTai(v){
  if (v.trangThai === 'dang_edit') return Number(v.hanDraft) || 0;
  if (v.trangThai === 'cho_duyet') return Number(v.hanGopY) || 0;
  if (v.trangThai === 'dang_sua')  return Number(v.hanSua) || 0;
  return 0;
}

function dongVideo(v, nowMs){
  var han = hanHienTai(v);
  return '*' + v.ma + '* · ' + v.ten + '\n   ' + (TRANG_THAI[v.trangThai] || v.trangThai) +
    (han ? ' — hạn ' + gioVN(han) + ' (' + conLai(han, nowMs) + ')' : '');
}

/** Lần sửa thứ n có vượt số vòng miễn phí không */
function vuotLuotSua(soLanSua, caiDat){ return Number(soLanSua) > Number(caiDat.luotSua); }

/**
 * Video này cần nhắc gì lúc nowMs. Mỗi loại chỉ nhắc một lần cho mỗi
 * chặng (cờ đã nhắc được xóa khi video sang chặng mới).
 * → mảng mã: draft_sap, draft_tre, gopy_sap, gopy_het, sua_sap, sua_tre
 */
function canNhac(v, nowMs, caiDat){
  var chang = {dang_edit:'draft', cho_duyet:'gopy', dang_sua:'sua'}[v.trangThai];
  if (!chang) return [];
  var han = hanHienTai(v);
  if (!han) return [];
  var da = String(v.daNhac || '').split(',');
  var ra = [];
  var truoc = Number(caiDat.gioNhacTruoc) * GIO_MS;
  var hetMa = chang === 'gopy' ? 'gopy_het' : chang + '_tre';
  if (nowMs >= han){
    if (da.indexOf(hetMa) < 0) ra.push(hetMa);
  } else if (truoc > 0 && nowMs >= han - truoc && da.indexOf(chang + '_sap') < 0){
    ra.push(chang + '_sap');
  }
  return ra;
}

function themCo(daNhac, ma){
  var ds = String(daNhac || '').split(',').filter(String);
  if (ds.indexOf(ma) < 0) ds.push(ma);
  return ds.join(',');
}

/**
 * Thống kê một tuần (tính theo lúc chốt kịch bản).
 * → {mucTieu, daChot, daNop, dungHan, treHan, hoanThanh, vuotSua, doiKB}
 */
function thongKeTuan(videos, nowMs, caiDat, nhatKy){
  var tu = dauTuan(nowMs), den = tu + 7 * 24 * GIO_MS;
  var trongTuan = function(ms){ ms = Number(ms); return ms >= tu && ms < den; };
  var tk = {mucTieu:Number(caiDat.soVideoTuan), daChot:0, daNop:0, dungHan:0, treHan:0,
            hoanThanh:0, vuotSua:0, doiKB:0};
  videos.forEach(function(v){
    if (trongTuan(v.chotLuc)) tk.daChot++;
    if (trongTuan(v.nopDauLuc)){
      tk.daNop++;
      if (String(v.dungHanDraft) === '1') tk.dungHan++; else tk.treHan++;
    }
    if (trongTuan(v.duyetLuc)) tk.hoanThanh++;
    if (trongTuan(v.duyetLuc) && vuotLuotSua(v.soLanSua, caiDat)) tk.vuotSua++;
  });
  (nhatKy || []).forEach(function(n){
    if (n.suKien === 'doi_kb_sau_chot' && trongTuan(n.luc)) tk.doiKB++;
  });
  return tk;
}

/** Mã video kế tiếp: V001, V002… */
function maKeTiep(videos){
  var lon = 0;
  videos.forEach(function(v){
    var n = parseInt(String(v.ma).replace(/\D/g, ''), 10);
    if (n > lon) lon = n;
  });
  var s = String(lon + 1);
  while (s.length < 3) s = '0' + s;
  return 'V' + s;
}

/* Cho Node đọc khi kiểm tra; trong Apps Script biến module không tồn tại */
if (typeof module !== 'undefined') module.exports = {
  CAI_DAT_MAC_DINH:CAI_DAT_MAC_DINH, CAI_DAT_MO_TA:CAI_DAT_MO_TA, docCaiDat:docCaiDat,
  doiCaiDat:doiCaiDat, timMoTa:timMoTa, giaTriDep:giaTriDep, congGio:congGio, gioVN:gioVN,
  conLai:conLai, dauTuan:dauTuan, thuGioVN:thuGioVN, hanHienTai:hanHienTai, dongVideo:dongVideo,
  vuotLuotSua:vuotLuotSua, canNhac:canNhac, themCo:themCo, thongKeTuan:thongKeTuan,
  maKeTiep:maKeTiep, GIO_MS:GIO_MS
};
