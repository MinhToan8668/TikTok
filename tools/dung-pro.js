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
const LS_LS = 'vs_pro_ls', LS_PANEL = 'vs_pro_panel';
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
function napFilmCraft() {
  if ($('#fc').src) return;
  $('#fcTt').hidden = false; $('#fcTt').textContent = 'Đang tải trình dựng (13 MB, lần đầu mất 10–40 giây)…';
  $('#fc').src = 'filmcraft/index.html?empty';
  const t0 = Date.now();
  const cho = setInterval(() => {
    const w = $('#fc').contentWindow, ld = w && w.filmcraftLoad;
    if (ld && (ld.fatal || ld.error)) { clearInterval(cho); $('#fcTt').textContent = 'FilmCraft không chạy được trên máy này: ' + String(ld.fatal || ld.error).slice(0, 200) + '. Dùng Chrome hoặc Edge mới nhất trên máy tính.'; return; }
    if (F()) { clearInterval(cho); fcSan = true; $('#fcTt').hidden = true; $('#btnThemFootage').disabled = false; window.filmcraft = F(); window.filmcraftLoad = w.filmcraftLoad; window.filmcraftWindow = w; toast('Trình dựng sẵn sàng · kéo video vào hoặc bấm Thêm footage'); return; }
    if (Date.now() - t0 > 120000) { clearInterval(cho); $('#fcTt').textContent = 'Tải quá lâu. Kiểm tra mạng rồi tải lại trang.'; }
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
(async () => { try { MC = await TK.mayChu(); } catch { } $('#aiHop').classList.toggle('khong', !(MC.url && MC.dich_vu.agent)); })();

/* ── bảng bên phải: trợ lý / hướng dẫn ── */
function moPanel(t) { $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $$('.panel').forEach(p => p.hidden = p.dataset.t !== t); ls.set(LS_PANEL, t); }
const $$ = s => [...document.querySelectorAll(s)];
$$('.tab').forEach(b => b.onclick = () => moPanel(b.dataset.t));
moPanel(ls.get(LS_PANEL) || 'tl');
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

/* ── trợ lý: vòng lặp agent ── */
const AG = { ls: [], dang: false, hienThi: [] };
try { AG.hienThi = JSON.parse(ls.get(LS_LS) || '[]').slice(-40); } catch { }
function luuLs() { ls.set(LS_LS, JSON.stringify(AG.hienThi.slice(-40))); }
function veDs() {
  const box = $('#ds'); box.innerHTML = '';
  if (!AG.hienThi.length) { const g = el('div', 'goiy'); ['Xếp các clip trong Project lên timeline theo thứ tự', 'Chỉnh màu cho ấm hơn, da tự nhiên', 'Thêm phụ đề cho đoạn đang chọn', 'Tiếng nhỏ quá, đưa về -14 LUFS', 'Cắt 2 giây đầu của clip 1'].forEach(t => { const b = el('button', 'goiyNut', t); b.type = 'button'; b.onclick = () => { $('#yc').value = t; guiYc(); }; g.appendChild(b); }); box.appendChild(g); return; }
  AG.hienThi.forEach(m => { const d = el('div', 'm ' + m.vai); if (m.buoc) { m.dong.forEach(x => { const r = el('div', 'bc' + (x.loi ? ' loi' : ''), x.t); if (x.anh) { const im = el('img', 'khungnho'); im.src = x.anh; im.alt = 'khung'; r.appendChild(im); } d.appendChild(r); }); } else d.textContent = m.text; box.appendChild(d); });
  box.scrollTop = 1e9;
}
async function guiYc() {
  const yc = $('#yc').value.trim(); if (!yc || AG.dang) return;
  if (!F()) { toast('Trình dựng chưa sẵn sàng'); return; }
  if (!(await TK.canCo('chat'))) return;
  if (!MC.url || !MC.dich_vu.agent) { toast('Máy chủ trợ lý chưa bật'); return; }
  AG.dang = true; $('#btnGui').disabled = true; $('#yc').value = '';
  AG.hienThi.push({ vai: 'nd', text: yc }); AG.ls.push({ vai: 'nd', text: yc }); veDs();
  const dong = [], hop = el('div', 'm ai buoc'); $('#ds').appendChild(hop);
  const ghi = (t, cls) => { const d = el('div', 'bc' + (cls ? ' ' + cls : ''), t); hop.appendChild(d); $('#ds').scrollTop = 1e9; return d; };
  const cho = ghi('Đang đọc sequence và yêu cầu…', 'dang'); const t0 = Date.now(); let ve = '', buoc = 0;
  try {
    for (; buoc < 16; buoc++) {
      cho.textContent = (buoc ? 'Đang nghĩ bước tiếp… ' : 'Đang đọc sequence và yêu cầu… ') + Math.round((Date.now() - t0) / 1000) + 's';
      const r = await fetch(MC.url + '/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: TK.token(), bo: 'filmcraft', buoc, ve, lich_su: AG.ls.slice(-30), du_an: await fcTomTat(), ho_so: TK.hoSo() }) });
      let j = {}; try { j = await r.json(); } catch { }
      if (!j.ok) { const ma = j.error || ('http_' + r.status); if (ma === 'het_luot_thu') TK.moHet('chat'); AG.hienThi.push({ vai: 'ai', text: '⚠️ ' + (ma === 'het_luot_thu' ? 'Hết lượt chat miễn phí.' : ma === 'het_phien' ? 'Phiên hết hạn, đăng nhập lại.' : 'Trợ lý chưa trả lời (' + ma + (j.chi_tiet ? ': ' + j.chi_tiet : '') + ').') }); break; }
      if (j.ve) ve = j.ve;
      if (j.goi && j.goi.length) {
        AG.ls.push({ vai: 'ai', text: j.text || '', ky_text: j.ky_text, goi: j.goi }); const kq = [];
        for (const g of j.goi) {
          const nhan = (FC_TEN[g.ten] || g.ten) + ' · ' + (g.args && (g.args.lenh || g.args.loc || (g.args.t != null ? g.args.t + 's' : '') || (g.args.buoc ? g.args.buoc.length + ' bước' : '')) || '');
          const d = ghi('🔧 ' + nhan, 'lenh'); let res;
          try { res = await fcLenh(g.ten, g.args || {}); } catch (e) { res = { isError: true, text: String(e && e.message || e) }; }
          d.textContent = (res.isError ? '⚠ ' : '✓ ') + nhan; if (res.isError) { d.classList.add('loi'); d.title = typeof res.text === 'string' ? res.text : JSON.stringify(res.text).slice(0, 300); }
          let anh = ''; if (res.image && res.image.data) { anh = 'data:' + (res.image.mime || 'image/png') + ';base64,' + res.image.data; const im = el('img', 'khungnho'); im.src = anh; im.alt = 'khung'; d.appendChild(im); }
          dong.push({ t: d.textContent, anh, loi: !!res.isError });
          kq.push({ id: g.id, ten: g.ten, text: typeof res.text === 'string' ? res.text : JSON.stringify(res.text), image: res.image, isError: !!res.isError });
        }
        AG.ls.push({ vai: 'tool', kq }); continue;
      }
      const tl = (j.text || 'Xong.').trim(); AG.ls.push({ vai: 'ai', text: tl }); AG.hienThi.push({ vai: 'ai', text: tl }); break;
    }
    if (buoc >= 16) AG.hienThi.push({ vai: 'ai', text: 'Mình dừng sau 16 bước, bạn xem lại rồi ra lệnh tiếp nhé.' });
  } catch (e) { console.error('[agent pro]', e); AG.hienThi.push({ vai: 'ai', text: '⚠️ Mất kết nối máy chủ trợ lý.' }); }
  finally { hop.remove(); if (dong.length) AG.hienThi.splice(AG.hienThi.length - (AG.hienThi.length && AG.hienThi[AG.hienThi.length - 1].vai === 'ai' && !AG.hienThi[AG.hienThi.length - 1].buoc ? 1 : 0), 0, { vai: 'ai', buoc: true, dong: dong.map(x => ({ t: x.t, anh: '', loi: x.loi })) }); AG.dang = false; $('#btnGui').disabled = false; luuLs(); veDs(); }
}
$('#btnGui').onclick = guiYc;
$('#yc').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guiYc(); } });
$('#btnXoaLs').onclick = () => { AG.hienThi = []; AG.ls = []; luuLs(); veDs(); };
$('#btnHoanTac').onclick = async () => { const f = F(); if (!f) return; try { await f.execute('edit.undo', {}); toast('Đã hoàn tác trong FilmCraft'); } catch (e) { toast('Không hoàn tác được: ' + (e.message || e)); } };
veDs();
