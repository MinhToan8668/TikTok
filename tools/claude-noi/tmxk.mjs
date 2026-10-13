#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   tmxk.mjs: Claude (hoặc bạn) ra lệnh cho trình Dựng video TMXK đang mở trong Chrome.
   Trình dựng ghi file này vào <thư mục dự án>/.tmxk/ khi bấm "Nối thư mục". Không cần cài gì ngoài Node.

   node .tmxk/tmxk.mjs xem                         tóm tắt dự án (footage, V1, b-roll, đồ hoạ, âm thanh, cài đặt)
   node .tmxk/tmxk.mjs cong-cu                     danh sách lệnh và tham số
   node .tmxk/tmxk.mjs <lenh> '<json tham số>'     chạy một lệnh, ví dụ: cat_khoang_lang '{"nguong":0.4}'
   node .tmxk/tmxk.mjs lo '<json mảng>'            chạy nhiều lệnh theo thứ tự: [{"ten":"bo_vap"},{"ten":"cai_dat","a":{...}}]
   Thêm --cho <giây> để chờ lâu hơn (mặc định 120s, xuat_video tự chờ 900s).

   Cách chạy: tạo .tmxk/lenh/<id>.json → trình dựng đọc, xoá, chạy → ghi .tmxk/ket-qua/<id>.json.
   Ảnh khung (xem_khung) được lưu thành .tmxk/khung/<id>.png để mở xem.
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = dirname(fileURLToPath(import.meta.url));          // .tmxk/
const NHIP_TOI_DA = 12000;                                     // trình dựng ghi nhịp mỗi 2s; quá 12s coi như tab đã đóng
const CHO_MAC_DINH = 120, CHO_XUAT = 900;
const HUONG_DAN = `node .tmxk/tmxk.mjs xem                       tóm tắt dự án
node .tmxk/tmxk.mjs cong-cu                   danh sách lệnh và tham số
node .tmxk/tmxk.mjs <lenh> '<json>'           chạy một lệnh
node .tmxk/tmxk.mjs lo '[{"ten":..,"a":..}]'  chạy nhiều lệnh theo thứ tự
Thêm --cho <giây> để chờ lâu hơn.`;

function docJson(p) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } }
function thoat(loi) { console.error('⚠ ' + loi); process.exit(1); }

function kiemTrinhDung() {
  const tt = docJson(join(GOC, 'trang-thai.json'));
  if (!tt) thoat('Chưa thấy trình dựng. Mở tools/dung-video.html trên Chrome máy tính, bấm "Nối thư mục" và chọn thư mục này.');
  if (Date.now() - (tt.nhip || 0) > NHIP_TOI_DA) thoat('Trình dựng không phản hồi (tab đã đóng hoặc mất quyền thư mục). Mở lại trình dựng, bấm "Nối lại thư mục".');
  return tt;
}

function inKetQua(kq, id) {
  const ds = Array.isArray(kq.ket_qua) ? kq.ket_qua : [kq];
  let loi = false;
  ds.forEach(r => {
    const dau = r.isError ? '⚠ ' : '✓ ';
    if (r.isError) loi = true;
    const text = typeof r.text === 'string' ? r.text : JSON.stringify(r.text, null, 1);
    console.log(dau + (r.ten || '') + (text ? '\n' + text : ''));
    if (r.image && r.image.data) {
      mkdirSync(join(GOC, 'khung'), { recursive: true });
      const p = join(GOC, 'khung', id + '-' + (r.ten || 'khung') + '.png');
      writeFileSync(p, Buffer.from(r.image.data, 'base64'));
      console.log('🖼 Ảnh khung: ' + p);
    }
  });
  return loi;
}

async function guiLenh(ds, choGiay) {
  kiemTrinhDung();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const thuMucLenh = join(GOC, 'lenh'), thuMucKq = join(GOC, 'ket-qua');
  mkdirSync(thuMucLenh, { recursive: true }); mkdirSync(thuMucKq, { recursive: true });
  /* ghi ra file tạm rồi đổi tên, để trình dựng không đọc phải file đang ghi dở */
  const tam = join(thuMucLenh, id + '.tam');
  writeFileSync(tam, JSON.stringify({ id, lenh: ds }));
  renameSync(tam, join(thuMucLenh, id + '.json'));
  const pKq = join(thuMucKq, id + '.json'), t0 = Date.now();
  while (Date.now() - t0 < choGiay * 1000) {
    await new Promise(r => setTimeout(r, 400));
    if (!existsSync(pKq)) continue;
    const kq = docJson(pKq);
    if (!kq) continue;                                        // đang ghi dở, đọc lại vòng sau
    try { unlinkSync(pKq); } catch { }
    return inKetQua(kq, id);
  }
  thoat('Hết ' + choGiay + 's chưa có kết quả. Lệnh vẫn có thể đang chạy trong trình dựng; xem trên tab rồi chạy "xem".');
}

function inCongCu() {
  const p = join(GOC, 'CONG-CU.md');
  if (existsSync(p)) { console.log(readFileSync(p, 'utf8')); return; }
  thoat('Chưa có CONG-CU.md. Bấm "Nối lại thư mục" trong trình dựng để ghi danh sách lệnh.');
}

async function main() {
  const args = process.argv.slice(2);
  let cho = null; const i = args.indexOf('--cho');
  if (i >= 0) { cho = +args[i + 1]; args.splice(i, 2); }
  const [lenh, thamSo] = args;
  if (!lenh || lenh === 'help' || lenh === '-h') { console.log(HUONG_DAN); return; }
  if (lenh === 'xem') { console.log(JSON.stringify(kiemTrinhDung().du_an, null, 1)); return; }
  if (lenh === 'cong-cu') { inCongCu(); return; }
  let a = {};
  if (thamSo) { try { a = JSON.parse(thamSo); } catch (e) { thoat('Tham số không phải JSON hợp lệ: ' + e.message); } }
  const ds = lenh === 'lo' ? a : [{ ten: lenh, a }];
  if (!Array.isArray(ds) || !ds.length || ds.some(x => !x || typeof x.ten !== 'string')) thoat('lo cần mảng [{"ten":"...","a":{...}}]');
  const choGiay = cho || (ds.some(x => x.ten === 'xuat_video') ? CHO_XUAT : CHO_MAC_DINH);
  const loi = await guiLenh(ds, choGiay);
  process.exit(loi ? 2 : 0);
}
main();
