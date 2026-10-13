/* ═══════════════════════════════════════════════════════════════
   DỰNG CHUYÊN SÂU (tools/dung-pro.html): FilmCraft bọc trong khung Viral Studio, dành cho gói Pro.
   FilmCraft (storytold/filmcraft, MIT/Apache) là trình dựng kiểu Premiere chạy WebAssembly trong iframe
   cùng origin (filmcraft/index.html), điều khiển qua iframe.contentWindow.filmcraft.
   Trợ lý AI: cùng giao thức /agent của máy chủ Cloudflare như Dựng video, nhưng bo = 'filmcraft'
   (bộ lệnh fc_*: tìm lệnh, xem sequence, chạy lệnh, chụp khung). Lịch sử chat giữ ở localStorage.
   Dự án lưu theo FilmCraft (.fcproj + tự khôi phục trong OPFS), không dính tới dự án của Dựng video.
   ═══════════════════════════════════════════════════════════════ */
const API = 'https://script.google.com/macros/s/AKfycbyxe1nWupAl6VheDZHaU3Ojm-d6c8F_khhUMtkehNCLh5OnGW6f2uF0PKPYZ4eYUqyGjQ/exec';
const TICK = 254016000000;
const LS_PANEL = 'vs_pro_panel';
const $ = s => document.querySelector(s);
const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { } }, del(k) { try { localStorage.removeItem(k); } catch { } } };
function el(t, c, txt) { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3600); }

/* ── giao diện sáng/tối, dùng chung key với các tool khác ── */
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme(ls.get('hook.theme'));
$('#themeBtn').onclick = () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; const t = dark ? 'light' : 'dark'; applyTheme(t); ls.set('hook.theme', t); };

/* ── FilmCraft trong iframe ── */
let MC = { url: '', dich_vu: {} }, fcSan = false;
const F = () => { const w = $('#fc').contentWindow; return w && w.filmcraftLoad && w.filmcraftLoad.readyMs && w.filmcraft ? w.filmcraft : null; };
/* tải trước file wasm (13 MB nén) có thanh tiến độ và tự thử lại: lỗi hay gặp là mạng chập chờn làm
   WebAssembly "Response body loading was aborted". Tải xong thì iframe lấy từ cache của trình duyệt (cùng URL ?v=). */
async function buildFilmCraft() { const t = await (await fetch('filmcraft/index.html', { cache: 'no-cache' })).text(); const m = t.match(/const build = "([0-9a-f]+)"/); return m && !m[1].startsWith('__') ? '?v=' + m[1] : ''; }
async function taiTruoc(url, baoTienDo) {
  const r = await fetch(url); if (!r.ok) throw new Error('http ' + r.status);
  const tong = +r.headers.get('content-length') || 0, rd = r.body.getReader(); let da = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; da += value.length; baoTienDo(da, tong); }
}
async function napFilmCraft() {
  if ($('#fc').src || napFilmCraft.dang) return; napFilmCraft.dang = true;
  const tt = $('#fcTt'); tt.hidden = false;
  const MB = x => (x / 1048576).toFixed(1).replace('.', ',');
  let v = ''; try { v = await buildFilmCraft(); } catch { }
  /* nguồn file: máy chủ Cloudflare trước (có điểm nút ở VN, tự nén), github.io sau. Thử luân phiên tối đa 4 lần. */
  try { if (!MC.url) MC = await TK.mayChu(); } catch { }
  const nguon = []; if (MC.url) nguon.push(MC.url + '/fc/'); nguon.push(new URL('filmcraft/', location.href).href);
  let wasmUrl = '', glueUrl = '';
  for (let lan = 1; lan <= 4; lan++) {
    const goc = nguon[(lan - 1) % nguon.length], tenGoc = /workers\.dev|\/fc\/$/.test(goc) ? 'Cloudflare' : 'GitHub';
    try {
      tt.textContent = 'Đang tải trình dựng từ ' + tenGoc + (lan > 1 ? ' (thử lại lần ' + lan + ')' : '') + '…';
      await taiTruoc(goc + 'filmcraft_web_bg.wasm' + v, (da, tong) => { tt.textContent = 'Đang tải trình dựng từ ' + tenGoc + ': ' + MB(da) + (tong ? ' / ' + MB(tong) : '') + ' MB' + (lan > 1 ? ' (lần ' + lan + ')' : '') + '. Lần đầu lâu, lần sau mở ngay.'; });
      await taiTruoc(goc + 'filmcraft_web.js' + v, () => { });
      wasmUrl = goc + 'filmcraft_web_bg.wasm' + v; glueUrl = goc + 'filmcraft_web.js' + v;
      break;
    } catch (e) {
      console.warn('[tải wasm]', goc, e);
      if (lan === 4) { tt.textContent = 'Tải trình dựng 4 lần (cả Cloudflare lẫn GitHub) chưa xong. Thử tắt VPN/ad-block, đổi sang Wi-Fi hoặc 4G khác rồi bấm Tải lại.'; const b = el('button', 'btn', 'Tải lại'); b.type = 'button'; b.style.marginTop = '10px'; b.onclick = () => location.reload(); tt.appendChild(document.createElement('br')); tt.appendChild(b); napFilmCraft.dang = false; return; }
      tt.textContent = 'Mạng chập chờn, 3 giây nữa thử lại…'; await new Promise(r => setTimeout(r, 3000));
    }
  }
  tt.textContent = 'Đang khởi động trình dựng…';
  const themUrl = wasmUrl && !wasmUrl.startsWith(new URL('filmcraft/', location.href).href) ? '&wasm=' + encodeURIComponent(wasmUrl) + '&glue=' + encodeURIComponent(glueUrl) : '';
  $('#fc').src = 'filmcraft/index.html?empty' + themUrl;
  const t0 = Date.now(); let lanIframe = 0;
  const cho = setInterval(() => {
    const w = $('#fc').contentWindow, ld = w && w.filmcraftLoad;
    if (ld && (ld.fatal || ld.error)) {
      const chu = String(ld.fatal || ld.error);
      if (/Network error|aborted|Failed to fetch|NetworkError/i.test(chu) && lanIframe < 2) { lanIframe++; tt.textContent = 'Mạng chập chờn lúc khởi động, thử lại lần ' + (lanIframe + 1) + '…'; $('#fc').src = 'filmcraft/index.html?empty&r=' + lanIframe + themUrl; return; }
      clearInterval(cho); napFilmCraft.dang = false;
      tt.textContent = /Network error|aborted|Failed to fetch/i.test(chu) ? 'Mạng chập chờn, chưa tải xong trình dựng. Đổi sang Wi-Fi ổn định hơn rồi bấm Tải lại.' : 'FilmCraft không chạy được trên máy này: ' + chu.slice(0, 200) + '. Dùng Chrome hoặc Edge mới nhất trên máy tính.';
      const b = el('button', 'btn', 'Tải lại'); b.type = 'button'; b.style.marginTop = '10px'; b.onclick = () => location.reload(); tt.appendChild(document.createElement('br')); tt.appendChild(b); return;
    }
    if (F()) { clearInterval(cho); fcSan = true; tt.hidden = true; $('#btnThemFootage').disabled = false; window.filmcraft = F(); window.filmcraftLoad = w.filmcraftLoad; window.filmcraftWindow = w; toast('Trình dựng sẵn sàng · kéo video vào hoặc bấm Thêm footage'); return; }
    if (Date.now() - t0 > 180000) { clearInterval(cho); napFilmCraft.dang = false; tt.textContent = 'Khởi động quá lâu. Tải lại trang; vẫn vậy thì máy chưa hỗ trợ WebGPU/WebGL2.'; }
  }, 500);
}
async function themFootage(files) {
  const f = F(); if (!f) { toast('Trình dựng chưa sẵn sàng'); return; }
  const w = $('#fc').contentWindow;
  const ds = [...files].filter(x => /^(video|audio|image)\//.test(x.type) || /\.(mp4|mov|m4v|webm|mkv|mp3|wav|m4a|aac|jpe?g|png|webp|gif|srt|vtt|fcproj)$/i.test(x.name));
  if (!ds.length) { toast('Không có file video, ảnh hay âm thanh nào'); return; }
  /* File phải tạo trong window của iframe: wasm kiểm instanceof File theo window đó */
  const r = await f.importFiles(ds.map(x => new w.File([x], x.name, { type: x.type, lastModified: x.lastModified })));
  if (r.errors && r.errors.length) toast('Không nhập được: ' + r.errors.join('; ').slice(0, 160)); else toast('Đã thêm ' + (r.items || []).length + ' file · kéo từ Project xuống timeline, hoặc nhờ trợ lý');
}
$('#btnThemFootage').onclick = () => $('#fileIn').click();
$('#fileIn').onchange = e => { themFootage(e.target.files); e.target.value = ''; };
$('#btnToanMan').onclick = () => { const e = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (e.requestFullscreen) e.requestFullscreen(); };

/* ── chặn Pro: chỉ nạp 13 MB wasm khi đã là Pro hoặc học viên ── */
function duocDung() { return !!(TK.me && (TK.laPro() || TK.laMentor())); }
function veKhoa() {
  const k = $('#khoa'), me = TK.me;
  $('#acctBtn').textContent = !me ? 'Đăng ký' : me.loai === 'hv' ? 'Học viên' : me.pro ? '✦ Pro' : 'Free';
  $('#quota').textContent = !me ? 'Chưa đăng nhập' : duocDung() ? (me.ten || '') + ' · Dựng chuyên sâu' : (me.ten || '') + ' · gói Free';
  if (duocDung()) { k.hidden = true; window.filmcraftKhoa = ''; napFilmCraft(); return; }
  k.hidden = false;
  const dangTai = !me && !!TK.token() && !TK.napLoi;   // có token, đang hỏi máy chủ: chưa kết luận gì
  window.filmcraftKhoa = dangTai ? '' : me ? 'pro' : 'dang_nhap';
  $('#khoaTieuDe').textContent = dangTai ? 'Đang kiểm tra tài khoản…' : me ? 'Dựng chuyên sâu dành cho gói Pro' : 'Đăng nhập để dùng Dựng chuyên sâu';
  $('#khoaMoTa').textContent = me ? 'Tài khoản của bạn đang ở gói Free. Nâng cấp Pro để mở trình dựng kiểu Premiere kèm trợ lý AI; học viên khoá đăng nhập là có sẵn.' : 'Học viên khoá Tự Mình Xây Kênh đăng nhập là dùng ngay. Tài khoản Pro cũng được.';
  $('#khoaNut').textContent = me ? 'Nâng cấp Pro' : 'Đăng nhập';
}
$('#khoaNut').onclick = () => { if (TK.me) TK.mo('het'); else TK.mo('signup'); };
$('#acctBtn').onclick = () => TK.mo();
if (innerWidth < 900) $('#canMay').hidden = false;
TK.khoiDong({ api: API, tool: 'dung', onDoi: veKhoa });
veKhoa();
(async () => { try { MC = await TK.mayChu(); } catch { } })();

/* ── bảng bên phải: trợ lý / hướng dẫn ── */
function moPanel(t) { $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $$('.panel').forEach(p => p.hidden = p.dataset.t !== t); ls.set(LS_PANEL, t); }
const $$ = s => [...document.querySelectorAll(s)];
$$('.tab').forEach(b => b.onclick = () => moPanel(b.dataset.t));
{ const t = ls.get(LS_PANEL); moPanel(t === 'hd' ? 'hd' : 'cc'); }
$('#btnBen').onclick = () => { document.body.classList.toggle('anBen'); setTimeout(() => dispatchEvent(new Event('resize')), 50); };

/* ── tóm tắt sequence cho AI: tick → giây, cắt gọn ── */
const giay = t => t == null ? null : +(t / TICK).toFixed(3);
async function fcTomTat() {
  const f = F(); if (!f) return { loi: 'trình dựng chưa sẵn sàng' };
  let pr = {}, sq = {};
  try { pr = await f.execute('project.inspect', {}); } catch (e) { pr = { loi: String(e.message || e) }; }
  try { sq = await f.execute('sequence.inspect', {}); } catch (e) { sq = { loi: String(e.message || e) }; }
  /* project.inspect: root.children = [{item, name, type Movie|Sequence|Bin…, duration, children?}] */
  const duyet = (nut, out, bin) => { (nut.children || []).forEach(x => { if (x.type === 'Bin' || x.children) duyet(x, out, x.name); else out.push({ item: x.item, ten: x.name, loai: x.type, giay: giay(x.duration), bin: bin || undefined }); }); return out; };
  /* sequence.inspect: video/audio = [{id, name, items:[{clip, item, name, start, end, sourceIn, sourceOut, speed, enabled, effects}], transitions}] */
  const clip = c => ({ clip: c.clip, item: c.item, ten: c.name, bd: giay(c.start), kt: giay(c.end), src_bd: giay(c.sourceIn), src_kt: giay(c.sourceOut), toc: c.speed, dao: c.reverse || undefined, tat: c.enabled === false || undefined, am_db: c.gainDb || undefined, hieu_ung: (c.effects || []).filter(e => !/^(motion|opacity|time_remap|volume|channel_volume|panner)$/.test(e.effect)).map(e => e.effect) });
  const track = t => ({ id: t.id, ten: t.name, khoa: t.locked || undefined, tat: t.muted || undefined, clips: (t.items || []).map(clip), chuyen: (t.transitions || []).length || undefined });
  return {
    du_an: { ten: pr.name, items: pr.root ? duyet(pr.root, []) : [], sequence_dang_mo: pr.activeSequence },
    sequence: sq.id == null ? sq : { id: sq.id, ten: sq.name, dai: giay(sq.duration), fps: sq.settings && sq.settings.frame_rate, khung: sq.settings && (sq.settings.width + 'x' + sq.settings.height), playhead: giay(sq.playhead), video: (sq.video || []).map(track), audio: (sq.audio || []).map(track), caption: (sq.captions || []).map(t => ({ id: t.id, ten: t.name, so: (t.items || []).length })), moc: (sq.markers || []).map(m => ({ id: m.id, t: giay(m.start), ten: m.name })), chon: sq.selection, in_out: sq.in != null || sq.out != null ? [giay(sq.in), giay(sq.out)] : undefined }
  };
}
async function fcLenh(ten, a) {
  const f = F(); if (!f) throw new Error('Trình dựng chưa sẵn sàng');
  switch (ten) {
    case 'fc_ds': { const r = await f.commands(); const ds = r.commands || r, q = String(a.loc || '').toLowerCase(); const kq = ds.filter(x => (!q || (x.id + ' ' + x.label).toLowerCase().includes(q)) && (!a.chi_dang_bat || x.enabled)); return { text: kq.slice(0, 60).map(x => x.id + ' · ' + x.label + ' · ' + x.params + (x.enabled ? '' : ' · đang tắt')).join('\n') + (kq.length > 60 ? '\n… ' + (kq.length - 60) + ' lệnh nữa, thu hẹp loc' : '') || 'Không có lệnh nào khớp' }; }
    case 'fc_xem': return { text: await fcTomTat() };
    case 'fc_chay': { if (!a.lenh) throw new Error('Thiếu lenh'); return { text: await f.execute(String(a.lenh), a.tham_so || {}) }; }
    case 'fc_lo': { const kq = []; for (const b of a.buoc || []) { try { kq.push({ lenh: b.lenh, kq: await f.execute(String(b.lenh), b.tham_so || {}) }); } catch (e) { kq.push({ lenh: b.lenh, loi: String(e.message || e) }); return { isError: true, text: kq }; } } return { text: kq }; }
    case 'fc_khung': { const sq = await f.execute('sequence.inspect', {}); const cu = sq.playhead; if (a.t != null) await f.execute('playhead.set', { seconds: +a.t }); try { const r = await f.screenshot({ panel: 'Program' }); return { text: 'Khung tại ' + (a.t != null ? a.t : giay(cu)) + 's', image: { data: r.pngBase64, mime: 'image/png' } }; } finally { if (a.t != null && cu != null) await f.execute('playhead.set', { time: cu }).catch(() => { }); } }
    case 'fc_man_hinh': { const r = await f.screenshot(a.panel ? { panel: String(a.panel) } : {}); return { text: 'Ảnh ' + r.width + 'x' + r.height, image: { data: r.pngBase64, mime: 'image/png' } }; }
    default: throw new Error('Tab không biết lệnh ' + ten);
  }
}
const FC_TEN = { fc_ds: 'Tìm lệnh', fc_xem: 'Xem sequence', fc_chay: 'Chạy lệnh', fc_lo: 'Chạy nhiều lệnh', fc_khung: 'Xem khung hình', fc_man_hinh: 'Xem màn hình' };

/* ── cầu nối thư mục cho Claude Code (noi-thu-muc.js nạp sau, đọc cấu hình này) ── */
let dsDaNap = [];                                               // tên file đã đưa vào FilmCraft qua thư mục
window.NTM_CFG = {
  ten: 'Dựng chuyên sâu',
  claudeMd: 'claude-noi/CLAUDE-pro.md',
  sanSang: () => !!F(),
  coRoi: f => dsDaNap.includes(f.name),
  napFootage: async files => { await themFootage(files); dsDaNap = dsDaNap.concat(files.map(f => f.name)); },
  trong: () => false,                                           // dự án do FilmCraft tự lưu trong trình duyệt, không đọc du-an.*
  docDuAn: async () => { },
  luuDuAn: () => null,
  tomTat: fcTomTat,
  chay: fcLenh,
  nhan: ten => FC_TEN[ten] || ten,
  veSau: () => { },
  congCu: async () => {
    const f = F(); let ds = []; try { const r = await f.commands(); ds = r.commands || r; } catch { }
    return '# Lệnh cầu nối (chạy: `node .tmxk/tmxk.mjs <ten> \'<json>\'`)\n\n- `fc_ds` `{"loc":"lumetri","chi_dang_bat":false}`: tìm lệnh FilmCraft theo từ khoá\n- `fc_xem` `{}`: project + sequence đang mở\n- `fc_chay` `{"lenh":"<id>","tham_so":{...}}`: chạy một lệnh FilmCraft\n- `fc_lo` `{"buoc":[{"lenh":"...","tham_so":{...}}]}`: nhiều lệnh theo thứ tự, dừng ở lệnh lỗi\n- `fc_khung` `{"t":<giây>}`: ảnh Program monitor tại giây t (không đổi playhead)\n- `fc_man_hinh` `{"panel":"Timeline"}`: ảnh cửa sổ hoặc một panel\n\nThời gian: 254016000000 tick = 1 giây; nhiều lệnh nhận seconds/frame.\n\n# Toàn bộ lệnh FilmCraft (' + ds.length + ')\n\nCột: id · nhãn · menu · tham số. "đang tắt" = lúc ghi file chưa đủ điều kiện (chưa chọn clip, chưa có sequence), vẫn gọi được khi đủ.\n\n' + ds.map(x => '- `' + x.id + '` · ' + x.label + (x.menu && x.menu.length ? ' · ' + x.menu.join(' › ') : '') + ' · `' + x.params + '`' + (x.enabled ? '' : ' · đang tắt')).join('\n') + '\n';
  }
};
document.addEventListener('ntm', e => { const tt = $('#noiTMTt'); if (tt) tt.textContent = e.detail.noi ? 'Đã nối “' + e.detail.ten + '”. Mở Claude Code trong thư mục này rồi ra lệnh. Thêm footage vào footage/ thì bấm lại nút để nạp.' : ''; });
