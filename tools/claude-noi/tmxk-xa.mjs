#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   tmxk-xa.mjs: Claude Code ở bất cứ đâu ra lệnh cho tab trình dựng TMXK đang mở, qua mã ghép nối.
   Người dùng bấm "📡 Nối với Claude Code" trên trình dựng (Dựng nhanh hoặc Dựng chuyên sâu) và đọc mã.

   node tools/claude-noi/tmxk-xa.mjs --ma ABC123 xem                 tab còn mở không + tóm tắt dự án
   node tools/claude-noi/tmxk-xa.mjs --ma ABC123 <lenh> '<json>'    một lệnh, ví dụ fc_chay '{"lenh":"edit.undo"}'
   node tools/claude-noi/tmxk-xa.mjs --ma ABC123 lo '<json mảng>'   nhiều lệnh: [{"ten":"...","a":{...}}]
   Đặt biến TMXK_MA=ABC123 thì khỏi --ma. --cho <giây> đổi thời gian chờ (mặc định 120, xuat_video 900).
   Ảnh khung (xem_khung / fc_khung) lưu vào .tmxk-xa/<id>-<lenh>.jpg trong thư mục hiện tại.

   Bộ lệnh: Dựng nhanh dùng lệnh của trợ lý dựng (them_doan, sua_doan, cat_khoang_lang…, xem
   https://flat-wave-6907.minhtoantowork.workers.dev/agent_tools). Dựng chuyên sâu dùng fc_ds, fc_xem,
   fc_chay, fc_lo, fc_khung, fc_man_hinh (FilmCraft, ~700 lệnh, tìm bằng fc_ds). Lệnh `xem` cho biết
   đang nối với trình dựng nào (trinh_dung).
   ═══════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const API = process.env.TMXK_API || 'https://script.google.com/macros/s/AKfycbyxe1nWupAl6VheDZHaU3Ojm-d6c8F_khhUMtkehNCLh5OnGW6f2uF0PKPYZ4eYUqyGjQ/exec';
const CHO_MAC_DINH = 120, CHO_XUAT = 900;

function thoat(loi) { console.error('⚠ ' + loi); process.exit(1); }
async function goi(body) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
  const t = await r.text(); try { return JSON.parse(t); } catch { throw new Error('máy chủ trả không phải JSON (http ' + r.status + '): ' + t.slice(0, 120)); }
}
const LOI = { ma_sai: 'Mã ghép nối phải 6 ký tự chữ/số', chua_co_tab: 'Chưa có tab trình dựng nào nối với mã này. Bảo người dùng mở trình dựng, bấm "📡 Nối với Claude Code" và đọc lại mã.', tab_khong_mo: 'Tab trình dựng đã đóng hoặc đã tắt nối. Bảo người dùng mở lại và bấm "📡 Nối với Claude Code".', hang_doi_day: 'Hàng đợi đầy (tab chưa chạy hết lệnh cũ), chờ rồi gửi lại', unknown_action: 'Apps Script chưa có CauNoi.gs: nhắc mentor deploy bản mới' };

function inKetQua(ds, id) {
  let loi = false;
  ds.forEach(r => {
    if (r.isError) loi = true;
    console.log((r.isError ? '⚠ ' : '✓ ') + (r.ten || '') + (r.text ? '\n' + r.text : '') + (r.cat ? '\n(kết quả bị cắt bớt vì quá dài)' : ''));
    if (r.image && r.image.data) { mkdirSync('.tmxk-xa', { recursive: true }); const p = join('.tmxk-xa', id + '-' + (r.ten || 'khung') + (/jpeg/.test(r.image.mime) ? '.jpg' : '.png')); writeFileSync(p, Buffer.from(r.image.data, 'base64')); console.log('🖼 Ảnh: ' + p); }
  });
  return loi;
}

async function main() {
  const args = process.argv.slice(2);
  const lay = co => { const i = args.indexOf(co); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
  const ma = String(lay('--ma') || process.env.TMXK_MA || '').toUpperCase(), cho = +lay('--cho') || 0;
  const [lenh, thamSo] = args;
  if (!lenh || lenh === 'help') { console.log('node tmxk-xa.mjs --ma <MÃ> xem | <lenh> \'<json>\' | lo \'[{"ten":..,"a":..}]\''); return; }
  if (!/^[A-Z0-9]{6,8}$/.test(ma)) thoat('Thiếu mã ghép nối: --ma ABC123 hoặc TMXK_MA=ABC123 (mã hiện trên trình dựng sau khi bấm "📡 Nối với Claude Code")');
  if (lenh === 'xem') { const r = await goi({ action: 'cc_xem', ma }); if (!r.ok) thoat(LOI[r.error] || r.error); if (!r.tab_mo) console.error('⚠ Tab trình dựng không phản hồi ' + Math.round(r.tre_ms / 1000) + 's rồi (đã đóng hoặc tắt nối?)'); console.log('Trình dựng: ' + (r.trinh_dung || '?')); console.log(JSON.stringify(r.du_an, null, 1)); return; }
  let a = {}; if (thamSo) { try { a = JSON.parse(thamSo); } catch (e) { thoat('Tham số không phải JSON hợp lệ: ' + e.message); } }
  const ds = lenh === 'lo' ? a : [{ ten: lenh, a }];
  if (!Array.isArray(ds) || !ds.length || ds.some(x => !x || typeof x.ten !== 'string')) thoat('lo cần mảng [{"ten":"...","a":{...}}]');
  const id = 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const g = await goi({ action: 'cc_gui', ma, id, lenh: ds }); if (!g.ok) thoat(LOI[g.error] || g.error);
  const choGiay = cho || (ds.some(x => x.ten === 'xuat_video') ? CHO_XUAT : CHO_MAC_DINH), t0 = Date.now(); let dem = 0;
  while (Date.now() - t0 < choGiay * 1000) {
    await new Promise(r => setTimeout(r, dem++ < 3 ? 1500 : 3000));
    const d = await goi({ action: 'cc_doc', ma, id }); if (!d.ok) thoat(LOI[d.error] || d.error);
    if (!d.cho) { process.exit(inKetQua(d.ket_qua || [], id) ? 2 : 0); }
    if (d.tab_mo === false) thoat('Tab trình dựng không phản hồi. Bảo người dùng kiểm tra tab còn mở và còn "Đang nối".');
  }
  thoat('Hết ' + choGiay + 's chưa có kết quả. Lệnh vẫn có thể đang chạy trong trình dựng; chạy "xem" để kiểm.');
}
main().catch(e => thoat(e.message || e));
