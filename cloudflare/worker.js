/* ═══════════════════════════════════════════════════════════════════════════
   Viral Studio · máy chủ phụ trên Cloudflare Workers (gói Free)
   ─────────────────────────────────────────────────────────────────────────
   Làm những việc Apps Script không làm được hoặc làm chậm:
     GET  /            → tình trạng máy chủ (tool tự dò để bật tính năng)
     GET  /broll       → tìm kho B-roll miễn phí (Pexels), trả link đã qua /media để vẽ lên canvas
     GET  /media?u=    → phát lại file Pexels có CORS + Range (xem trước, xuất video)
     GET  /tai?u=&ten= → tải hộ file video/ảnh/nhạc từ CDN các nền tảng, không giới hạn 35MB, có tên file
     POST /tts         → lồng tiếng AI tiếng Việt (Gemini TTS), trả WAV; trừ lượt qua Apps Script

   Biến môi trường (Settings → Variables and Secrets):
     GEMINI_API_KEYS   một hoặc nhiều key Gemini, cách nhau dấu phẩy (Secret)
     PEXELS_KEY        key miễn phí tại pexels.com/api (Secret)
     APPS_SCRIPT_URL   link /exec của Apps Script (để kiểm đăng nhập + trừ lượt khi lồng tiếng)
     ORIGINS           (tuỳ chọn) các trang được gọi, cách nhau dấu phẩy. Mặc định: GitHub Pages của khoá
   ═══════════════════════════════════════════════════════════════════════════ */

const PHIEN_BAN = '2026.10.01';
const ORIGIN_MD = 'https://minhtoan8668.github.io,http://localhost:8765,http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const TTS_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts'];
const TTS_GIONG = { nu_am: 'Kore', nu_tre: 'Leda', nu_diu: 'Aoede', nu_sang: 'Zephyr', nam_tram: 'Charon', nam_tre: 'Puck', nam_am: 'Orus', nam_manh: 'Fenrir' };
/* CDN được tải hộ: chỉ tên miền chứa file của các nền tảng, để máy chủ không thành proxy mở */
const HOST_TAI = /(^|\.)(tiktokcdn(-us|-eu)?\.com|tiktokcdn-us\.com|tikwm\.com|byteoversea\.com|ibyteimg\.com|byteimg\.com|douyinvod\.com|douyinpic\.com|douyinstatic\.com|twimg\.com|fxtwitter\.com|cdninstagram\.com|fbcdn\.net|bsky\.app|bsky\.network|pexels\.com|ytimg\.com|googlevideo\.com|xhscdn\.com|akamaized\.net|redd\.it|redditmedia\.com|pinimg\.com|vimeocdn\.com|threads\.net)$/i;
const HOST_MEDIA = /(^|\.)(pexels\.com)$/i;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, '') || '/';
    const cors = corsCho(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-max-age': '86400' } });
    try {
      if (path === '/') return json({ ok: true, ten: 'Viral Studio · máy chủ Cloudflare', phien_ban: PHIEN_BAN, dich_vu: { broll: !!env.PEXELS_KEY, tts: !!dsKey(env).length, tai: true, kiem_luot: !!env.APPS_SCRIPT_URL } }, cors);
      if (path === '/broll' && req.method === 'GET') return json(await timBroll(url, env, ctx), cors);
      if (path === '/media' && req.method === 'GET') return media(req, url, cors);
      if (path === '/tai' && req.method === 'GET') return taiHo(req, url, cors);
      if (path === '/tts' && req.method === 'POST') { if (!cors['access-control-allow-origin']) return json({ ok: false, error: 'origin' }, cors, 403); return tts(req, env, cors); }
      return json({ ok: false, error: 'khong_co' }, cors, 404);
    } catch (e) { return json({ ok: false, error: 'loi_may_chu', chi_tiet: String(e && e.message || e).slice(0, 200) }, cors, 500); }
  }
};

/* ── tiện ích ── */
function dsKey(env) { return String(env.GEMINI_API_KEYS || env.GEMINI_KEY || '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean); }
function corsCho(req, env) {
  const o = req.headers.get('origin') || '', ds = String(env.ORIGINS || ORIGIN_MD).split(/[,\s]+/).filter(Boolean);
  const h = { 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,range', 'access-control-expose-headers': 'content-length,content-range,accept-ranges,content-disposition', vary: 'origin' };
  if (!o || ds.includes('*') || ds.some(d => d === o || d.replace(/\/+$/, '') === o.replace(/\/+$/, ''))) h['access-control-allow-origin'] = o || '*';
  return h;
}
function json(o, cors, status) { return new Response(JSON.stringify(o), { status: status || 200, headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }); }
function hostHopLe(u, re) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && re.test(x.hostname) ? x : null; } catch { return null; } }
function tenAscii(s, macDinh) { return (String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)) || macDinh; }

/* ── Gemini: xoay key khi 429/403 ── */
async function goiGemini(env, model, body) {
  const keys = dsKey(env); if (!keys.length) throw new Error('chua_co_key');
  let loi = '';
  for (let i = 0; i < keys.length; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys[i]}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    loi = `${r.status} ${(await r.text()).slice(0, 200)}`;
    if (r.status !== 429 && r.status !== 403 && r.status < 500) break;
  }
  throw new Error(loi || 'gemini');
}

/* ── kho B-roll (Pexels): tìm tiếng Việt trước, ít kết quả thì nhờ Gemini dịch từ khoá ── */
async function timBroll(url, env, ctx) {
  if (!env.PEXELS_KEY) return { ok: false, error: 'chua_co_pexels' };
  const q = String(url.searchParams.get('q') || '').trim().slice(0, 120); if (!q) return { ok: false, error: 'thieu_q' };
  const doc = url.searchParams.get('huong') !== 'ngang', trang = Math.max(1, Math.min(5, +url.searchParams.get('trang') || 1));
  const khoa = `broll:${doc ? 'd' : 'n'}:${trang}:${q.toLowerCase()}`;
  const cache = globalThis.caches && caches.default, cKey = cache && new Request('https://cache.viral-studio/' + encodeURIComponent(khoa));
  if (cache) { const c = await cache.match(cKey); if (c) return c.json(); }
  const tim = async (query, locale) => {
    const p = new URLSearchParams({ query, per_page: '15', page: String(trang), orientation: doc ? 'portrait' : 'landscape', size: 'medium' }); if (locale) p.set('locale', locale);
    const r = await fetch('https://api.pexels.com/videos/search?' + p, { headers: { authorization: env.PEXELS_KEY } });
    if (!r.ok) throw new Error('pexels ' + r.status);
    return (await r.json()).videos || [];
  };
  let vids = await tim(q, 'vi-VN'), tuKhoa = q;
  if (vids.length < 4 && dsKey(env).length) {
    try {
      const j = await goiGemini(env, 'gemini-3.5-flash-lite', { contents: [{ parts: [{ text: 'Dịch cụm tìm kiếm stock video sau sang 2–4 từ khoá tiếng Anh ngắn gọn, chỉ trả về từ khoá, không giải thích: ' + q }] }], generationConfig: { maxOutputTokens: 30, temperature: 0.2 } });
      const en = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || '').join(' ').replace(/["\n]/g, ' ').trim().slice(0, 80);
      if (en) { tuKhoa = en; const them = await tim(en, ''); const co = new Set(vids.map(v => v.id)); vids = vids.concat(them.filter(v => !co.has(v.id))); }
    } catch { }
  }
  const items = vids.slice(0, 18).map(v => {
    const fs = (v.video_files || []).filter(f => /mp4/.test(f.file_type || '') && f.width && f.height).sort((a, b) => b.width * b.height - a.width * a.height);
    const f = fs.find(x => Math.max(x.width, x.height) <= 1280) || fs[fs.length - 1]; if (!f) return null;
    return { id: 'px' + v.id, giay: v.duration, w: f.width, h: f.height, thumb: v.image, url: `/media?u=${encodeURIComponent(f.link)}`, goc: v.url, tac_gia: (v.user || {}).name || 'Pexels' };
  }).filter(Boolean);
  const kq = { ok: true, items, tu_khoa: tuKhoa, nguon: 'Pexels · miễn phí, không cần ghi nguồn' };
  if (cache && ctx) ctx.waitUntil(cache.put(cKey, new Response(JSON.stringify(kq), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } })));
  return kq;
}

/* ── phát lại file Pexels có CORS (canvas cần) và Range (video tua được) ── */
async function media(req, url, cors) {
  const x = hostHopLe(url.searchParams.get('u') || '', HOST_MEDIA); if (!x) return json({ ok: false, error: 'link_khong_ho_tro' }, cors, 400);
  const h = { 'user-agent': UA }; const rg = req.headers.get('range'); if (rg) h.range = rg;
  const r = await fetch(x.href, { headers: h, cf: { cacheEverything: true, cacheTtl: 86400 } });
  const out = new Headers(cors); ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag'].forEach(k => { const v = r.headers.get(k); if (v) out.set(k, v); });
  if (!out.has('accept-ranges')) out.set('accept-ranges', 'bytes'); out.set('cache-control', 'public, max-age=86400');
  return new Response(r.body, { status: r.status, headers: out });
}

/* ── tải hộ: stream thẳng từ CDN về máy người dùng, kèm tên file để trình duyệt lưu ── */
async function taiHo(req, url, cors) {
  const x = hostHopLe(url.searchParams.get('u') || '', HOST_TAI); if (!x) return json({ ok: false, error: 'link_khong_ho_tro' }, cors, 400);
  const h = { 'user-agent': UA, accept: '*/*' }; const rg = req.headers.get('range'); if (rg) h.range = rg;
  if (/douyin|byteimg|ibyteimg/.test(x.hostname)) h.referer = 'https://www.douyin.com/';
  if (/xhscdn/.test(x.hostname)) h.referer = 'https://www.xiaohongshu.com/';
  if (/pinimg/.test(x.hostname)) h.referer = 'https://www.pinterest.com/';
  const r = await fetch(x.href, { headers: h, redirect: 'follow' });
  if (!r.ok && r.status !== 206) return json({ ok: false, error: 'cdn_' + r.status }, cors, 502);
  const ct = r.headers.get('content-type') || 'application/octet-stream';
  const duoi = (ct.match(/\/(mp4|webm|quicktime|jpeg|png|webp|gif|mpeg|mp3|mp4a|ogg|wav|aac)/i) || [])[1] || (x.pathname.match(/\.(mp4|mov|webm|jpe?g|png|webp|gif|mp3|m4a|wav)$/i) || [])[1] || 'bin';
  const ten = tenAscii(url.searchParams.get('ten'), 'viral-studio').replace(/\.[a-z0-9]{2,4}$/i, '') + '.' + ({ quicktime: 'mov', jpeg: 'jpg', mpeg: 'mp3', mp4a: 'm4a' }[duoi.toLowerCase()] || duoi.toLowerCase());
  const out = new Headers(cors); ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(k => { const v = r.headers.get(k); if (v) out.set(k, v); });
  out.set('content-disposition', (url.searchParams.get('xem') ? 'inline' : 'attachment') + '; filename="' + ten + '"'); out.set('cache-control', 'private, max-age=600');
  return new Response(r.body, { status: r.status, headers: out });
}

/* ── lồng tiếng AI: kiểm đăng nhập + trừ 1 lượt "dung" qua Apps Script, rồi gọi Gemini TTS ── */
async function tts(req, env, cors) {
  let b = {}; try { b = await req.json(); } catch { }
  const text = String(b.text || '').trim().slice(0, 1200); if (!text) return json({ ok: false, error: 'thieu_text' }, cors, 400);
  if (!dsKey(env).length) return json({ ok: false, error: 'chua_co_key' }, cors, 503);
  if (!env.APPS_SCRIPT_URL) return json({ ok: false, error: 'chua_noi_apps_script' }, cors, 503);
  // Apps Script: học viên/Pro trả ok, tài khoản Free trừ 1 lượt Dựng video, hết lượt trả het_luot_thu
  let kiem = {};
  try { const r = await fetch(env.APPS_SCRIPT_URL, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'st_use', token: String(b.token || ''), tool: 'dung' }), redirect: 'follow' }); kiem = await r.json(); }
  catch (e) { return json({ ok: false, error: 'khong_noi_duoc_apps_script' }, cors, 502); }
  if (!kiem.ok) return json({ ok: false, error: kiem.error || 'het_phien' }, cors, 402);
  const giong = TTS_GIONG[b.giong] || (Object.values(TTS_GIONG).includes(b.giong) ? b.giong : 'Kore');
  const cach = String(b.cach || '').trim().slice(0, 160);
  const prompt = (cach ? `Đọc đoạn sau bằng tiếng Việt, ${cach}: ` : 'Đọc đoạn sau bằng tiếng Việt tự nhiên, rõ ràng như người dẫn video ngắn: ') + '\n\n' + text;
  let loi = '';
  for (const model of TTS_MODELS) {
    try {
      const j = await goiGemini(env, model, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: giong } } } } });
      const part = ((((j.candidates || [])[0] || {}).content || {}).parts || []).find(p => p.inlineData);
      if (!part) { loi = 'khong_co_am_thanh'; continue; }
      const rate = +((part.inlineData.mimeType || '').match(/rate=(\d+)/) || [])[1] || 24000;
      const pcm = Uint8Array.from(atob(part.inlineData.data), c => c.charCodeAt(0));
      const wav = pcmSangWav(pcm, rate);
      return new Response(wav, { headers: { ...cors, 'content-type': 'audio/wav', 'x-giay': String((pcm.length / 2 / rate).toFixed(2)), 'x-model': model, 'x-luot-con': kiem.luot_con == null ? '' : String(kiem.luot_con), 'access-control-expose-headers': 'x-giay,x-model,x-luot-con', 'cache-control': 'no-store' } });
    } catch (e) { loi = String(e.message || e); if (/chua_co_key/.test(loi)) break; }
  }
  return json({ ok: false, error: 'tts_loi', chi_tiet: loi.slice(0, 200) }, cors, 502);
}
function pcmSangWav(pcm, rate) {
  const h = new ArrayBuffer(44), v = new DataView(h), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length, true);
  const out = new Uint8Array(44 + pcm.length); out.set(new Uint8Array(h), 0); out.set(pcm, 44); return out;
}
