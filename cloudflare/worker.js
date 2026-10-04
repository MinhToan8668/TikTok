/* ═══════════════════════════════════════════════════════════════════════════
   Viral Studio · máy chủ phụ trên Cloudflare Workers (gói Free)
   ─────────────────────────────────────────────────────────────────────────
   Làm những việc Apps Script không làm được hoặc làm chậm:
     GET  /            → tình trạng máy chủ (tool tự dò để bật tính năng)
     GET  /broll       → tìm kho B-roll miễn phí (Pixabay và/hoặc Pexels), trả link đã qua /media để vẽ lên canvas
     GET  /media?u=    → phát lại file Pixabay/Pexels có CORS + Range (xem trước, xuất video)
     GET  /tai?u=&ten= → tải hộ file video/ảnh/nhạc từ CDN các nền tảng, không giới hạn 35MB, có tên file
     POST /tts         → lồng tiếng AI tiếng Việt (Gemini TTS), trả WAV; trừ lượt qua Apps Script
     POST /do_hoa      → AI tạo motion graphic mới theo mô tả: trả cảnh JSON (lớp hộp/tròn/chữ/đường/vòng/số + keyframe),
                         trình dựng tự vẽ, không chạy code lạ; trừ 1 lượt chat
     POST /agent       → Trợ lý dựng kiểu agent: nhận yêu cầu + trạng thái dự án, hỏi LLM có tool-calling
                         (bộ lệnh học theo Vyra MCP), trả về lệnh để tab chạy lên dòng thời gian; lặp tới khi xong.
                         Đổi nhà cung cấp AI bằng biến LLM_PROVIDER = gemini | claude | openai (+ key tương ứng).

   Biến môi trường (Settings → Variables and Secrets):
     GEMINI_API_KEYS   một hoặc nhiều key Gemini, cách nhau dấu phẩy (Secret)
     PIXABAY_KEY       key miễn phí tại pixabay.com/api/docs (đăng nhập là thấy) (Secret)
     PEXELS_KEY        (tuỳ chọn) key Pexels nếu có; có cả hai thì gộp kết quả (Secret)
     GIPHY_KEY         (tuỳ chọn) key miễn phí tại developers.giphy.com → tìm sticker động trong Dựng video (Secret)
     TENOR_KEY         (tuỳ chọn) key Tenor (Google Cloud → Tenor API) thay cho Giphy (Secret)
     FREESOUND_KEY     (tuỳ chọn) key miễn phí tại freesound.org/apiv2/apply → tìm hiệu ứng âm thanh (Secret)
     APPS_SCRIPT_URL   link /exec của Apps Script (để kiểm đăng nhập + trừ lượt khi lồng tiếng)
     ORIGINS           (tuỳ chọn) các trang được gọi, cách nhau dấu phẩy. Mặc định: GitHub Pages của khoá
     LLM_PROVIDER      (tuỳ chọn) gemini (mặc định) | claude | openai — AI cho Trợ lý dựng agent
     LLM_MODEL         (tuỳ chọn) tên model; mặc định gemini-3.5-flash / claude-sonnet-4-5 / gpt-4.1
     ANTHROPIC_API_KEY, OPENAI_API_KEY   (Secret) key khi chọn claude / openai
   ═══════════════════════════════════════════════════════════════════════════ */

const PHIEN_BAN = '2026.10.16';
/* link /exec của Apps Script đang dùng trong tool (công khai sẵn trong tools/*.html). Biến APPS_SCRIPT_URL trên Cloudflare, nếu có, sẽ được ưu tiên. */
const APPS_SCRIPT_MD = 'https://script.google.com/macros/s/AKfycbyxe1nWupAl6VheDZHaU3Ojm-d6c8F_khhUMtkehNCLh5OnGW6f2uF0PKPYZ4eYUqyGjQ/exec';
const asUrl = env => String(env.APPS_SCRIPT_URL || env.APPS_SCRIPT || APPS_SCRIPT_MD).trim();
const ORIGIN_MD = 'https://minhtoan8668.github.io,http://localhost:8765,http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const TTS_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts'];
const TTS_GIONG = { nu_am: 'Kore', nu_tre: 'Leda', nu_diu: 'Aoede', nu_sang: 'Zephyr', nam_tram: 'Charon', nam_tre: 'Puck', nam_am: 'Orus', nam_manh: 'Fenrir' };
/* CDN được tải hộ: chỉ tên miền chứa file của các nền tảng, để máy chủ không thành proxy mở */
const HOST_TAI = /(^|\.)(pixabay\.com|tiktokcdn(-us|-eu)?\.com|tiktokcdn-us\.com|tikwm\.com|byteoversea\.com|ibyteimg\.com|byteimg\.com|douyinvod\.com|douyinpic\.com|douyinstatic\.com|twimg\.com|fxtwitter\.com|cdninstagram\.com|fbcdn\.net|bsky\.app|bsky\.network|pexels\.com|ytimg\.com|googlevideo\.com|xhscdn\.com|akamaized\.net|redd\.it|redditmedia\.com|pinimg\.com|vimeocdn\.com|threads\.net|giphy\.com|tenor\.com|freesound\.org|gstatic\.com|googleusercontent\.com)$/i;
const HOST_MEDIA = /(^|\.)(pexels\.com|pixabay\.com)$/i;

export default {
  async fetch(req, env, ctx) {
    CTX = ctx;
    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, '') || '/';
    const cors = corsCho(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-max-age': '86400' } });
    try {
      if (path === '/suc-khoe') return sucKhoe(env, cors);
      if (path === '/') return json({ ok: true, ten: 'Viral Studio · máy chủ Cloudflare', phien_ban: PHIEN_BAN, dich_vu: { broll: coKho(env), nhan_dan: !!(env.GIPHY_KEY || env.TENOR_KEY), am_thanh: !!env.FREESOUND_KEY, tts: !!dsKey(env).length, tai: true, kiem_luot: !!asUrl(env), agent: !!llmCoKey(env), agent_ncc: llmNcc(env) } }, cors);
      if (path === '/broll' && req.method === 'GET') return json(await timBroll(url, env, ctx), cors);
      if (path === '/nhan-dan' && req.method === 'GET') return json(await timSticker(url, env), cors);
      if (path === '/am-thanh' && req.method === 'GET') return json(await timAmThanh(url, env), cors);
      if (path === '/media' && req.method === 'GET') return media(req, url, cors);
      if (path === '/tai' && req.method === 'GET') return taiHo(req, url, cors);
      if (path === '/dich' && req.method === 'POST') { if (!cors['access-control-allow-origin']) return json({ ok: false, error: 'origin' }, cors, 403); return dichPhuDe(req, env, cors); }
      if (path === '/do_hoa' && req.method === 'POST') { if (!cors['access-control-allow-origin']) return json({ ok: false, error: 'origin' }, cors, 403); return doHoaAI(req, env, cors); }
      if (path === '/agent' && req.method === 'POST') { if (!cors['access-control-allow-origin']) return json({ ok: false, error: 'origin' }, cors, 403); return agent(req, env, cors); }
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
/* Lỗi hết hạn mức / quá tải của Gemini: trang chỉ nhận ban_qua + số giây nên chờ, không thấy chi tiết thô */
const RE_HAN_MUC = /qua_tai:|quota|exceeded your|RESOURCE_EXHAUSTED|\b429\b|overloaded|UNAVAILABLE/i;
function json(o, cors, status) {
  if (o && o.ok === false && typeof o.chi_tiet === 'string' && RE_HAN_MUC.test(o.chi_tiet)) {
    const m = o.chi_tiet.match(/qua_tai:(\w+):(\d+)/);
    console.warn('qua tai:', o.error, o.chi_tiet.slice(0, 300));   // xem ở Worker → Logs
    o = { ...o, error: 'ban_qua', cho: m ? +m[2] : 60 }; delete o.chi_tiet;
  }
  return new Response(JSON.stringify(o), { status: status || 200, headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }); }
function hostHopLe(u, re) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && re.test(x.hostname) ? x : null; } catch { return null; } }
function tenAscii(s, macDinh) { return (String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)) || macDinh; }

/* ── Gemini: xoay key, bắt đầu ở key ngẫu nhiên để chia đều; key bị 429 thì nghỉ riêng model đó đúng số giây
   Google báo (nhớ trong bộ nhớ của Worker). Mọi key đều 429/503 thì ném lỗi có dấu "qua_tai:<lý do>:<giây chờ>",
   json() đổi thành ban_qua cho trang (học viên không thấy chữ hạn mức), và báo Apps Script → bot cho admin. ── */
const NGHI = new Map();   // key|model → hết nghỉ lúc (ms)
let CTX = null;
function doc429(t) {
  let ngay = /PerDay|per day/i.test(t), cho = 0;
  try { const e = (JSON.parse(t) || {}).error || {}; (e.details || []).forEach(d => { if (/RetryInfo/.test(d['@type'] || '')) cho = parseFloat(String(d.retryDelay || '0')) || 0; if (/QuotaFailure/.test(d['@type'] || '')) (d.violations || []).forEach(v => { if (/PerDay/i.test(v.quotaId || '')) ngay = true; }); }); } catch { }
  return { ngay, cho };
}
function giayToiReset() {   // hạn mức ngày đặt lại lúc 0 giờ giờ Thái Bình Dương
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date());
  const g = k => +((p.find(x => x.type === k) || {}).value || 0);
  return Math.max(60, 86400 - ((g('hour') % 24) * 3600 + g('minute') * 60 + g('second')));
}
async function goiGemini(env, model, body) {
  const keys = dsKey(env); if (!keys.length) throw new Error('chua_co_key');
  let loi = '', soPhut = 0, soNgay = 0, google = 0, cho = 0;
  const ghiCho = g => { if (g > 0 && (!cho || g < cho)) cho = g; };
  const bd = Math.floor(Math.random() * keys.length);
  for (let q = 0; q < keys.length; q++) {
    const k = keys[(bd + q) % keys.length], nk = k.slice(-8) + '|' + model, het = NGHI.get(nk) || 0;
    if (het > Date.now()) { ghiCho(Math.ceil((het - Date.now()) / 1000)); soPhut++; continue; }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': k }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    const t = await r.text();
    loi = `${r.status} ${t.slice(0, 200)}`;
    if (r.status === 429) { const d = doc429(t), g = d.ngay ? giayToiReset() : Math.max(20, Math.ceil(d.cho)); NGHI.set(nk, Date.now() + g * 1000); ghiCho(g); d.ngay ? soNgay++ : soPhut++; continue; }
    if (r.status >= 500) { google++; ghiCho(60); continue; }
    if (r.status === 403) continue;
    break;
  }
  if (soPhut || soNgay || google) {
    const lyDo = (soPhut || soNgay) ? (soNgay && !soPhut ? 'han_muc_ngay' : 'han_muc_phut') : 'google_qua_tai';
    cho = Math.max(30, cho || 60);
    baoQuaTai(env, { ly_do: lyDo, cho, so_key: keys.length, key_ngay: soNgay, key_phut: soPhut, models: model });
    throw new Error(`qua_tai:${lyDo}:${cho}| ${lyDo === 'google_qua_tai' ? 503 : 429} ${loi}`);   // giữ mã 429/503 để chỗ gọi còn lùi về model nhẹ
  }
  throw new Error(loi || 'gemini');
}
/* báo Apps Script (gửi bot cho admin, Apps Script tự chặn mỗi loại 1 tin / 30 phút); Worker chặn thêm 10 phút */
const DA_BAO = new Map();
function baoQuaTai(env, o) {
  const url = asUrl(env); if (!url || (DA_BAO.get(o.ly_do) || 0) > Date.now()) return;
  DA_BAO.set(o.ly_do, Date.now() + 600000);
  const p = fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'hook_ai', mode: 'cf_qua_tai', ...o }), redirect: 'follow' }).catch(() => { });
  if (CTX) try { CTX.waitUntil(p); } catch { }
}

/* ── kho B-roll (Pexels): tìm tiếng Việt trước, ít kết quả thì nhờ Gemini dịch từ khoá ── */

/* ── sticker động (Giphy hoặc Tenor) và âm thanh miễn phí (Freesound) cho Dựng video ── */
async function khoCache(khoa, lam) { const cache = globalThis.caches && caches.default, k = cache && new Request('https://cache.viral-studio/' + encodeURIComponent(khoa)); if (cache) { const c = await cache.match(k); if (c) return c.json(); } const kq = await lam(); if (cache && kq.ok) { try { await cache.put(k, new Response(JSON.stringify(kq), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } })); } catch { } } return kq; }
async function timSticker(url, env) {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80); if (!q) return { ok: false, error: 'thieu_q' };
  if (!env.GIPHY_KEY && !env.TENOR_KEY) return { ok: false, error: 'chua_co_key' };
  return khoCache('sticker:' + q, async () => {
    if (env.GIPHY_KEY) { const r = await fetch('https://api.giphy.com/v1/stickers/search?' + new URLSearchParams({ api_key: env.GIPHY_KEY, q, limit: '30', rating: 'g', lang: 'vi' })); if (!r.ok) return { ok: false, error: 'giphy_' + r.status }; const j = await r.json(); return { ok: true, nguon: 'Giphy', ds: (j.data || []).map(d => { const im = d.images || {}, g = im.fixed_width || im.original || {}; return { id: d.id, ten: d.title || q, thumb: (im.fixed_width_small || im.preview_gif || g).url || '', link: (im.original || g).webp || g.url, duoi: (im.original || g).webp ? 'webp' : 'gif', nguon: 'Giphy' }; }).filter(x => x.link) }; }
    const r = await fetch('https://tenor.googleapis.com/v2/search?' + new URLSearchParams({ key: env.TENOR_KEY, q, searchfilter: 'sticker', media_filter: 'gif,tinygif,webp_transparent', limit: '30', contentfilter: 'high' })); if (!r.ok) return { ok: false, error: 'tenor_' + r.status }; const j = await r.json();
    return { ok: true, nguon: 'Tenor', ds: (j.results || []).map(d => { const m = d.media_formats || {}, w = m.webp_transparent || m.gif || m.tinygif; if (!w) return null; return { id: d.id, ten: d.content_description || q, thumb: (m.tinygif || w).url, link: w.url, duoi: m.webp_transparent ? 'webp' : 'gif', nguon: 'Tenor' }; }).filter(Boolean) };
  });
}
async function timAmThanh(url, env) {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80); if (!q) return { ok: false, error: 'thieu_q' };
  if (!env.FREESOUND_KEY) return { ok: false, error: 'chua_co_key' };
  return khoCache('am:' + q, async () => {
    const r = await fetch('https://freesound.org/apiv2/search/text/?' + new URLSearchParams({ query: q, token: env.FREESOUND_KEY, fields: 'id,name,previews,duration,license,username', filter: 'duration:[0.1 TO 90]', page_size: '30', sort: 'rating_desc' })); if (!r.ok) return { ok: false, error: 'freesound_' + r.status }; const j = await r.json();
    const gp = l => /zero|cc0/i.test(l) ? 'CC0' : /by-nc/i.test(l) ? 'CC BY-NC' : /by/i.test(l) ? 'CC BY' : 'CC';
    return { ok: true, nguon: 'Freesound', ds: (j.results || []).map(x => ({ id: x.id, ten: x.name, giay: x.duration, tac_gia: x.username, giay_phep: gp(x.license || ''), link: (x.previews || {})['preview-hq-mp3'] || (x.previews || {})['preview-lq-mp3'] || '' })).filter(x => x.link) };
  });
}
async function timBroll(url, env, ctx) {
  if (!coKho(env)) return { ok: false, error: 'chua_co_kho' };
  const q = String(url.searchParams.get('q') || '').trim().slice(0, 100); if (!q) return { ok: false, error: 'thieu_q' };
  const doc = url.searchParams.get('huong') !== 'ngang', trang = Math.max(1, Math.min(5, +url.searchParams.get('trang') || 1));
  const khoa = `broll2:${doc ? 'd' : 'n'}:${trang}:${q.toLowerCase()}`;
  const cache = globalThis.caches && caches.default, cKey = cache && new Request('https://cache.viral-studio/' + encodeURIComponent(khoa));
  if (cache) { const c = await cache.match(cKey); if (c) return c.json(); }
  // Pixabay: không có lọc hướng cho video → lấy nhiều rồi lọc dọc/ngang; tìm được tiếng Việt (lang=vi)
  const pixabay = async (query, vi) => {
    if (!env.PIXABAY_KEY) return [];
    const p = new URLSearchParams({ key: env.PIXABAY_KEY, q: query.slice(0, 100), per_page: '60', page: String(trang), safesearch: 'true', video_type: 'film' }); if (vi) p.set('lang', 'vi');
    const r = await fetch('https://pixabay.com/api/videos/?' + p); if (!r.ok) throw new Error('pixabay ' + r.status);
    return ((await r.json()).hits || []).map(h => {
      const v = h.videos || {}, ds = ['medium', 'small', 'large', 'tiny'].map(k => v[k]).filter(x => x && x.url && x.width);
      const f = ds.find(x => Math.max(x.width, x.height) <= 1280) || ds[0]; if (!f) return null;
      return { id: 'pb' + h.id, giay: h.duration, w: f.width, h: f.height, thumb: f.thumbnail || (v.tiny || {}).thumbnail || '', link: f.url, goc: h.pageURL, tac_gia: (h.user || 'Pixabay') + ' · Pixabay' };
    }).filter(Boolean);
  };
  const pexels = async (query, vi) => {
    if (!env.PEXELS_KEY) return [];
    const p = new URLSearchParams({ query, per_page: '15', page: String(trang), orientation: doc ? 'portrait' : 'landscape', size: 'medium' }); if (vi) p.set('locale', 'vi-VN');
    const r = await fetch('https://api.pexels.com/videos/search?' + p, { headers: { authorization: env.PEXELS_KEY } }); if (!r.ok) throw new Error('pexels ' + r.status);
    return ((await r.json()).videos || []).map(v => {
      const fs = (v.video_files || []).filter(f => /mp4/.test(f.file_type || '') && f.width && f.height).sort((a, b) => b.width * b.height - a.width * a.height);
      const f = fs.find(x => Math.max(x.width, x.height) <= 1280) || fs[fs.length - 1]; if (!f) return null;
      return { id: 'px' + v.id, giay: v.duration, w: f.width, h: f.height, thumb: v.image, link: f.link, goc: v.url, tac_gia: ((v.user || {}).name || 'Pexels') + ' · Pexels' };
    }).filter(Boolean);
  };
  const hopHuong = it => doc ? it.h >= it.w : it.w > it.h;
  const tim = async (query, vi) => { const kq = await Promise.allSettled([pexels(query, vi), pixabay(query, vi)]); const ds = kq.flatMap(x => x.status === 'fulfilled' ? x.value : []); if (!ds.length && kq.every(x => x.status === 'rejected')) throw kq[0].reason; return ds; };
  let vids = (await tim(q, true)).filter(hopHuong), tuKhoa = q;
  if (vids.length < 6 && dsKey(env).length) {
    try {
      const j = await goiGemini(env, 'gemini-3.5-flash-lite', { contents: [{ parts: [{ text: 'Dịch cụm tìm kiếm stock video sau sang 2–4 từ khoá tiếng Anh ngắn gọn, chỉ trả về từ khoá, không giải thích: ' + q }] }], generationConfig: { maxOutputTokens: 30, temperature: 0.2 } });
      const en = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || '').join(' ').replace(/["\n]/g, ' ').trim().slice(0, 80);
      if (en) { tuKhoa = en; const co = new Set(vids.map(v => v.id)); vids = vids.concat((await tim(en, false)).filter(v => hopHuong(v) && !co.has(v.id))); }
    } catch { }
  }
  const items = vids.slice(0, 18).map(({ link, ...it }) => ({ ...it, url: `/media?u=${encodeURIComponent(link)}` }));
  const nguon = [env.PIXABAY_KEY && 'Pixabay', env.PEXELS_KEY && 'Pexels'].filter(Boolean).join(' + ');
  const kq = { ok: true, items, tu_khoa: tuKhoa, nguon: nguon + ' · miễn phí dùng thương mại' };
  if (cache && ctx) ctx.waitUntil(cache.put(cKey, new Response(JSON.stringify(kq), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } })));   // Pixabay yêu cầu cache 24h
  return kq;
}
function coKho(env) { return !!(env.PIXABAY_KEY || env.PEXELS_KEY); }

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
  if (!asUrl(env)) return json({ ok: false, error: 'chua_noi_apps_script' }, cors, 503);
  // Apps Script: học viên/Pro trả ok, tài khoản Free trừ 1 lượt Dựng video, hết lượt trả het_luot_thu
  let kiem = {};
  try { const r = await fetch(asUrl(env), { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'st_use', token: String(b.token || ''), tool: 'dung' }), redirect: 'follow' }); kiem = await r.json(); }
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


/* ═══════════════════════════════════════════════════════════════════════════
   Trợ lý dựng kiểu agent. Bộ lệnh (tool) học theo Vyra MCP; tab trình dựng là nơi chạy lệnh,
   máy chủ chỉ hỏi LLM. Đổi AI: LLM_PROVIDER = gemini | claude | openai, key tương ứng, LLM_MODEL tuỳ chọn.
   Lịch sử (lich_su) do tab giữ, dạng trung lập: {vai:'nd',text} · {vai:'ai',text,goi:[{id,ten,args}]} · {vai:'tool',kq:[{id,ten,text,image?,isError}]}
   ═══════════════════════════════════════════════════════════════════════════ */
const AGENT_TOOLS = [
  ['xem_du_an', 'Xem toàn bộ dự án: footage (src_id, tên, giây, loại, mô tả, số câu, cảnh), V1 (i, src_id, bd, kt, chuyển cảnh, lời), b-roll V2, đồ hoạ O1, lồng tiếng A2, cài đặt, tổng giây. Trạng thái mới nhất đã đính kèm mỗi lượt, chỉ gọi khi cần xem lại sau nhiều thay đổi.', {}],
  ['xem_loi_thoai', 'Lời thoại đã chép của một footage: từng câu (bd, kt giây trong source, text, loại noi|hay|vap|lap|lac) và câu nào đang trên V1. tu=true trả cả từng từ.', { src_id: { type: 'string' }, tu: { type: 'boolean' } }],
  ['tim_footage', 'Tìm trong footage theo câu nói, mô tả cảnh hoặc tag. Trả cảnh/câu khớp kèm src_id, bd, kt.', { q: { type: 'string' } }, ['q']],
  ['them_doan', 'Thêm một đoạn (src_id, bd→kt giây trong source) vào V1. vi_tri = chỉ số chèn (mặc định cuối). chuyen = cat|fade|slide|zoom|wipe|whip|flash|glitch|circle|blur.', { src_id: { type: 'string' }, bd: { type: 'number' }, kt: { type: 'number' }, vi_tri: { type: 'integer' }, chuyen: { type: 'string' } }, ['src_id', 'bd', 'kt']],
  ['sua_doan', 'Sửa đoạn V1 thứ i. Cắt: bd/kt (giây trong source), truot (±giây, giữ độ dài). Chuyển: chuyen, chuyen_dai (0.2–1.2s). Khung: sc (phóng 0.3–3), x, y (lệch -0.6..0.6 theo khung), xoay (độ), mo (độ mờ 0–1). Chuyển động keyframe đầu→cuối: kf=true kèm sc2, x2, y2 (giá trị cuối đoạn; zoom vào chậm: sc 1 → sc2 1.15). Tốc độ toc: 0.1–100 (CapCut). dao=true: đảo ngược (phát lùi). giu_cao_do=false: giọng đổi cao độ theo tốc độ. Mặt nạ mat_na: {kieu tuyen|guong|tron|chu_nhat|tim|sao|khong, x, y (-1..1), w, h (0–1.5), xoay, mem (0–1 mềm viền), dao (đảo)}. Đường cong tốc độ duong_cong_toc: khong|montage|hero|bullet|jump|flash_in|flash_out (mẫu đường cong như CapCut). Âm: am (0–2), fi/fo (giây hiện dần/mờ dần). Màu: loc khong|am|lanh|sang|dien_anh|ruc_ro|co_dien|trang_den, sang, tuong_phan (-50..50), bao_hoa (-100..100). Màu nâng cao: phoi, nhiet, tint, sang_cao, toi, trang (whites), den (blacks), vib (vibrance), ro (clarity) (-100..100), hue (-180..180), phai (fade), net (sharpen), vignette, hat (0..100), loc_muc (0–1 cường độ bộ lọc). hieu_ung: khong|rung|nhip|chop|ro_sang|phim_cu|nhoe_zoom. lat_x, lat_y: lật. an_vao, an_ra: {id mo|phong|thu|trai|phai|len|xuong|xoay|nay|rung|mo_nhoe, d giây}.', { trang: { type: 'number' }, den: { type: 'number' }, hue: { type: 'number' }, vib: { type: 'number' }, phai: { type: 'number' }, net: { type: 'number' }, ro: { type: 'number' }, dao: { type: 'boolean' }, giu_cao_do: { type: 'boolean' }, mat_na: { type: 'object' }, phoi: { type: 'number' }, nhiet: { type: 'number' }, tint: { type: 'number' }, sang_cao: { type: 'number' }, toi: { type: 'number' }, vignette: { type: 'number' }, hat: { type: 'number' }, loc_muc: { type: 'number' }, hieu_ung: { type: 'string', description: 'khong|rung|nhip|chop|ro_sang|phim_cu|nhoe_zoom hoặc tên trong kho: Glitch, VHS, TV cũ, Pixel hoá, Kính vạn hoa, Xoáy ốc, Sóng, Bừng sáng, Rò sáng, Tia sáng, Hai tông hồng, Âm bản, Phác hoạ, Ảnh nhiệt, Tuyết rơi, Mưa, Bụi sáng, Sương mù…' }, lat_x: { type: 'boolean' }, lat_y: { type: 'boolean' }, an_vao: { type: 'object' }, an_ra: { type: 'object' }, i: { type: 'integer' }, bd: { type: 'number' }, kt: { type: 'number' }, chuyen: { type: 'string' }, chuyen_dai: { type: 'number' }, truot: { type: 'number' }, sc: { type: 'number' }, x: { type: 'number' }, y: { type: 'number' }, xoay: { type: 'number' }, mo: { type: 'number' }, kf: { type: 'boolean' }, sc2: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' }, toc: { type: 'number' }, am: { type: 'number' }, fi: { type: 'number' }, fo: { type: 'number' }, loc: { type: 'string', description: 'bộ lọc cơ bản (khong|am|lanh|…) hoặc tên trong kho bộ lọc: Teal & Orange, Bom tấn, Phim Hàn, Phim Nhật, Hoàng hôn, Đen trắng, Nâu cổ, Rực rỡ, Hai tông hồng, Da đẹp, Đồ ăn…' }, sang: { type: 'number' }, tuong_phan: { type: 'number' }, bao_hoa: { type: 'number' }, duong_cong_toc: { type: 'string' } }, ['i']],
  ['xoa_doan', 'Xoá đoạn V1 thứ i (ripple: chữ, đồ hoạ, b-roll sau dồn lên).', { i: { type: 'integer' } }, ['i']],
  ['tach_doan', 'Tách đoạn V1 tại giây tl trên dòng thời gian.', { tl: { type: 'number' } }, ['tl']],
  ['sap_xep_doan', 'Đổi thứ tự V1: thu_tu là mảng chỉ số cũ theo thứ tự mới, ví dụ [2,0,1].', { thu_tu: { type: 'array', items: { type: 'integer' } } }, ['thu_tu']],
  ['bo_vap', 'Cắt bỏ mọi câu vấp, lặp, lạc đề khỏi V1.', {}],
  ['hit_beat', 'Kéo mép các đoạn về beat nhạc gần nhất (cần có nhạc nền).', {}],
  ['dat_broll', 'Đặt b-roll lên V2: src_id, bd→kt trong source, t_bd giây bắt đầu trên dòng thời gian, kieu = full | pip.', { src_id: { type: 'string' }, bd: { type: 'number' }, kt: { type: 'number' }, t_bd: { type: 'number' }, kieu: { type: 'string' } }, ['src_id', 'bd', 'kt', 't_bd']],
  ['xoa_broll', 'Xoá b-roll theo id.', { id: { type: 'string' } }, ['id']],
  ['them_do_hoa', 'Thêm đồ hoạ O1: kieu = tieu_de|lower_third|danh_sach|tien_do|trich_dan|dem_so|khung_nhan|mui_ten|vong_xoay|nhan_goc|chu (chữ tự do)|sticker (emoji); bd, kt giây trên dòng thời gian; text, phu. Mẫu mới: bieu_do_cot / bieu_do_duong / bieu_do_vung (cột / đường / vùng; text "Nhãn:số|Nhãn:số", phu đơn vị), hinh (hình vẽ: hinh chu_nhat|tron|tam_giac|sao|tim|luc_giac|mui_ten|duong, mau #hex hoặc khong, x, y tâm 0–1, w, h 0–1.2, xoay độ), bieu_do_tron (text "72%", phu chú thích), truoc_sau / so_sanh (text "A|B"), checklist (text "a|b|c"), binh_luan (text bình luận, phu tên), dang_ky (text @kênh), dem_nguoc (text số giây), ghim_ban_do (text địa điểm, x, y), tim_kiem (text từ khoá), thong_bao (text tiêu đề, phu nội dung). Riêng chu/sticker: x, y (0–1 theo khung), co (cỡ 0.03–0.2, sticker tới 0.4), mau (#hex), nen vien|bong|hop|hop_mau|khong, hu (hiệu ứng) pop|mo|truot|len|go|nay|lac|khong. Xuống dòng bằng |. bam_loi=true: các mục (danh_sach, checklist, bieu_do_cot, truoc_sau, so_sanh) hiện đúng lúc người nói nhắc tới. dat_theo_loi=true: tự dời đồ hoạ tới lúc chữ của nó được nói. kieu ai = đồ hoạ tự thiết kế khi không có mẫu hợp: truyền canh = {lop:[{loai hop|tron|chu|duong|vong|so, mau "#hex" hoặc "nhan" (màu nhấn) hoặc "khong", vien, day (độ dày theo cạnh ngắn 0.004–0.03), bo_goc 0–1, chu, co (cỡ chữ 0.03–0.2), dam 600|800|900, can center|left|right, so_tu, so_den, dinh_dang "{}%", kf:[{t giây từ lúc đồ hoạ bắt đầu, x, y (tâm 0–1), w, h (0–1 theo khung; tron/vong: w là đường kính; duong: w,h là vector), s (scale), xoay (độ), mo (0–1), tien_do (0–1: vẽ dần đường/vòng, gõ chữ, đếm số), ease vao|ra|mem|nay|deu}]}]} (lớp sau vẽ đè lớp trước, tối đa 40 lớp).', { hinh: { type: 'string' }, w: { type: 'number' }, h: { type: 'number' }, xoay: { type: 'number' }, kieu: { type: 'string' }, bam_loi: { type: 'boolean' }, dat_theo_loi: { type: 'boolean' }, canh: { type: 'object' }, mo_ta: { type: 'string' }, bd: { type: 'number' }, kt: { type: 'number' }, text: { type: 'string' }, phu: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, co: { type: 'number' }, mau: { type: 'string' }, nen: { type: 'string' }, hu: { type: 'string' } }, ['kieu', 'bd', 'kt']],
  ['sua_do_hoa', 'Sửa đồ hoạ theo id: bd, kt, text, phu; với chu/sticker thêm x, y, co, mau, nen, hu (vào: pop|mo|truot|len|phong|xoay|nhoe|go|nay|lac|khong), ra (mo|thu|truot|roi|khong), lap (khong|nhip|nay|lac|nhap_nhay); kiểu chữ: font be_vietnam|montserrat|bricolage|lexend|oswald|anton|playfair, dam 400–900, nghieng, gach, can left|center|right, vien_mau, vien_day (0–0.4), nen_mau, nen_bo (bo góc 0–1), phat_sang (#hex, rỗng = tắt), gian_chu (-0.05..0.4), dong_cao (0.8–2); lop (số lớp, như sua_broll); bam_loi, dat_theo_loi; với kieu ai truyền canh mới (đủ lớp).', { lop: { type: 'integer' }, ra: { type: 'string' }, lap: { type: 'string' }, font: { type: 'string' }, dam: { type: 'number' }, nghieng: { type: 'boolean' }, gach: { type: 'boolean' }, can: { type: 'string' }, vien_mau: { type: 'string' }, vien_day: { type: 'number' }, nen_mau: { type: 'string' }, nen_bo: { type: 'number' }, phat_sang: { type: 'string' }, gian_chu: { type: 'number' }, dong_cao: { type: 'number' }, id: { type: 'string' }, bam_loi: { type: 'boolean' }, dat_theo_loi: { type: 'boolean' }, canh: { type: 'object' }, bd: { type: 'number' }, kt: { type: 'number' }, text: { type: 'string' }, phu: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, co: { type: 'number' }, mau: { type: 'string' }, nen: { type: 'string' }, hu: { type: 'string' } }, ['id']],
  ['xoa_do_hoa', 'Xoá đồ hoạ theo id.', { id: { type: 'string' } }, ['id']],
  ['cai_dat', 'Đổi cài đặt chung. hook: chữ 3 giây đầu. phu_de: {bat, kieu highlight|pill|vien|emoji|toi|pop|rise, cum 2–6, nhan_manh "từ, từ", mau xanh|vang|cam|lam|hong, vi_tri 0.62|0.78|0.86}. khung: cat|bam_mat|mo. nen: {kieu giu|mo|mau|toi, mau #hex}. font: be_vietnam|montserrat|bricolage|lexend|oswald|anton|playfair. zoom_nhan. chuyen_mac_dinh. ten_du_an. ti_le: 9:16|1:1|4:5|16:9. phong_cach: tên trong danh sách phong_cach của dự án (hormozi, vlog, tin_tuc, dien_anh, nang_dong, toi_gian…).', { ti_le: { type: 'string' }, phong_cach: { type: 'string' }, hook: { type: 'string' }, phu_de: { type: 'object' }, khung: { type: 'string' }, nen: { type: 'object' }, font: { type: 'string' }, zoom_nhan: { type: 'boolean' }, chuyen_mac_dinh: { type: 'string' }, ten_du_an: { type: 'string' } }],
  ['hieu_footage', 'Cho AI hiểu một footage chưa hiểu (chép lời từng từ, cảnh, khoảnh khắc). Tốn 1 lượt Dựng video của người dùng, chờ 10–60s.', { src_id: { type: 'string' } }, ['src_id']],
  ['tro_ly_dung', 'Dựng bản nháp toàn bộ một phát theo yêu cầu (xếp câu, phụ đề, đồ hoạ, chuyển cảnh, b-roll) khi dòng thời gian còn trống. che_do = ky|nhanh.', { yeu_cau: { type: 'string' }, che_do: { type: 'string' } }, ['yeu_cau']],
  ['tim_broll_kho', 'Tìm kho B-roll miễn phí (Pexels). huong = doc|ngang. Trả id, giây, tác giả.', { q: { type: 'string' }, huong: { type: 'string' } }, ['q']],
  ['them_broll_kho', 'Tải một video từ kết quả tim_broll_kho (id) vào footage, rồi dùng dat_broll để đặt lên V2.', { id: { type: 'string' } }, ['id']],
  ['long_tieng', 'Tạo lồng tiếng AI tiếng Việt đặt lên A2 tại t_bd. giong: nu_am|nu_tre|nu_diu|nu_sang|nam_tram|nam_tre|nam_am|nam_manh. Tốn 1 lượt Dựng video.', { text: { type: 'string' }, giong: { type: 'string' }, cach: { type: 'string' }, t_bd: { type: 'number' } }, ['text']],
  ['xem_khung', 'Xem ảnh khung hình tại giây t trên dòng thời gian để tự kiểm bố cục, phụ đề, đồ hoạ trước khi kết luận.', { t: { type: 'number' } }, ['t']],
  ['xuat_phu_de', 'Trả phụ đề SRT theo dòng thời gian.', {}],
  ['xuat_video', 'Dựng và lưu video xuống máy người dùng (chính xác từng khung). Chỉ gọi khi người dùng yêu cầu xuất. do_phan_giai = 720|1080|1440|2160. fps 24|25|30|60. dinh_dang mp4_avc|mp4_av1|webm_vp9|wav (chỉ âm thanh). chat_luong vua|cao|rat_cao.', { do_phan_giai: { type: 'integer' }, fps: { type: 'integer' }, dinh_dang: { type: 'string' }, chat_luong: { type: 'string' } }],
  ['luu_du_an', 'Trả JSON dự án.', {}],
  ['hoan_tac', 'Hoàn tác thao tác gần nhất.', {}],
  ['tim_loi', 'Tìm một cụm từ trong lời đang dùng trên V1, trả các giây trên dòng thời gian (để đặt đồ hoạ đúng lúc nói).', { q: { type: 'string' } }, ['q']],
  ['cat_khoang_lang', 'Cắt khoảng im dài hơn nguong giây (mặc định 0.5) và tiếng ừ/ờ/ừm (bo_dem, mặc định true) trên V1 theo lời đã chép từng từ; footage chưa chép thì đo theo âm lượng. Thì/là/kiểu/à không tự cắt, chỉ trả trong tu_dem_can_nghe để báo người dùng nghe lại. Đồ hoạ, b-roll, A3 phía sau tự dồn theo.', { nguong: { type: 'number' }, bo_dem: { type: 'boolean' } }],
  ['dong_bang', 'Đóng băng khung hình (freeze frame) tại giây tl trên dòng thời gian, giữ trong giay giây (mặc định 1.5).', { tl: { type: 'number' }, giay: { type: 'number' } }],
  ['them_moc', 'Đặt mốc (marker) tại giây t trên dòng thời gian, kèm tên.', { t: { type: 'number' }, ten: { type: 'string' } }],
  ['tao_shorts', 'Cắt footage dài thành nhiều short (so_luong 1–5, do_dai 15–90 giây mỗi short), mỗi short thành một phiên bản và mở short đầu. Tốn 1 lượt chat của người dùng; chỉ gọi khi người dùng muốn nhiều short.', { so_luong: { type: 'integer' }, do_dai: { type: 'integer' } }],
  ['keyframe', 'Đặt hoặc xoá keyframe. muc v (đoạn V1, dùng i) | b (b-roll, id) | g (đồ hoạ, id); prop sc|x|y|xoay|mo|am (am chỉ cho v); t = giây trên dòng thời gian (nằm trong mục); v = giá trị; e = mem|deu|vao|ra|nay. xoa=true để xoá keyframe tại t. Ví dụ zoom chậm: sc 1 ở đầu đoạn, sc 1.2 ở cuối.', { muc: { type: 'string' }, i: { type: 'integer' }, id: { type: 'string' }, prop: { type: 'string' }, t: { type: 'number' }, v: { type: 'number' }, e: { type: 'string' }, xoa: { type: 'boolean' } }, ['muc', 'prop', 't']],
  ['sua_broll', 'Sửa b-roll/overlay theo id: lop = số line (line số lớn vẽ phủ line số nhỏ; máy tự đánh số lại 1..n; mỗi line một loại và không chồng giờ, sai thì tự mở line mới; số lớn hơn mọi line = lên trên cùng; xem lop trong tóm tắt dự án), vua cover (phủ kín) | contain (vừa khung, giữ nguyên ảnh), kieu full|pip, sc, x, y, xoay, mo, bd, kt, t_bd, toc; cùng các khoá màu, hieu_ung, an_vao/an_ra như sua_doan.', { id: { type: 'string' }, lop: { type: 'integer' }, vua: { type: 'string' }, kieu: { type: 'string' }, sc: { type: 'number' }, x: { type: 'number' }, y: { type: 'number' }, xoay: { type: 'number' }, mo: { type: 'number' }, bd: { type: 'number' }, kt: { type: 'number' }, t_bd: { type: 'number' }, toc: { type: 'number' }, loc: { type: 'string', description: 'bộ lọc cơ bản (khong|am|lanh|…) hoặc tên trong kho bộ lọc: Teal & Orange, Bom tấn, Phim Hàn, Phim Nhật, Hoàng hôn, Đen trắng, Nâu cổ, Rực rỡ, Hai tông hồng, Da đẹp, Đồ ăn…' }, loc_muc: { type: 'number' }, phoi: { type: 'number' }, nhiet: { type: 'number' }, tint: { type: 'number' }, sang_cao: { type: 'number' }, toi: { type: 'number' }, vignette: { type: 'number' }, hat: { type: 'number' }, sang: { type: 'number' }, tuong_phan: { type: 'number' }, bao_hoa: { type: 'number' }, hieu_ung: { type: 'string', description: 'khong|rung|nhip|chop|ro_sang|phim_cu|nhoe_zoom hoặc tên trong kho: Glitch, VHS, TV cũ, Pixel hoá, Kính vạn hoa, Xoáy ốc, Sóng, Bừng sáng, Rò sáng, Tia sáng, Hai tông hồng, Âm bản, Phác hoạ, Ảnh nhiệt, Tuyết rơi, Mưa, Bụi sáng, Sương mù…' }, an_vao: { type: 'object' }, an_ra: { type: 'object' } }, ['id']],
  ['ap_tat_ca', 'Áp cho mọi đoạn V1 một lúc: loc + loc_muc (0–1), hieu_ung, chuyen (đặt cho mọi điểm cắt), chuyen_dai.', { loc: { type: 'string', description: 'bộ lọc cơ bản (khong|am|lanh|…) hoặc tên trong kho bộ lọc: Teal & Orange, Bom tấn, Phim Hàn, Phim Nhật, Hoàng hôn, Đen trắng, Nâu cổ, Rực rỡ, Hai tông hồng, Da đẹp, Đồ ăn…' }, loc_muc: { type: 'number' }, hieu_ung: { type: 'string', description: 'khong|rung|nhip|chop|ro_sang|phim_cu|nhoe_zoom hoặc tên trong kho: Glitch, VHS, TV cũ, Pixel hoá, Kính vạn hoa, Xoáy ốc, Sóng, Bừng sáng, Rò sáng, Tia sáng, Hai tông hồng, Âm bản, Phác hoạ, Ảnh nhiệt, Tuyết rơi, Mưa, Bụi sáng, Sương mù…' }, chuyen: { type: 'string' }, chuyen_dai: { type: 'number' } }],
  ['cat_dau_phat', 'Cắt nhanh kiểu CapCut Q/W tại giây tl trên dòng thời gian: phia truoc = bỏ phần của đoạn nằm trước tl, sau = bỏ phần sau tl (ripple, phần sau dồn lên).', { tl: { type: 'number' }, phia: { type: 'string' } }, ['tl', 'phia']],
  ['nhan_doi', 'Nhân đôi một mục: muc v (i) | b | g | a (id), dán tại giây t (mặc định ngay sau mục gốc).', { muc: { type: 'string' }, i: { type: 'integer' }, id: { type: 'string' }, t: { type: 'number' } }, ['muc']],
  ['mau_chu', 'Thêm chữ từ mẫu có sẵn tại giây bd: mau = Tiêu đề vàng|Hộp đen chữ trắng|Nhãn màu nhấn|Neon phát sáng|Gõ chữ máy|Chữ to 2 dòng|Trích dẫn nghiêng|Chú thích nhỏ|Số liệu nổi bật|Kêu gọi follow; text để thay chữ mẫu (xuống dòng bằng |).', { mau: { type: 'string' }, bd: { type: 'number' }, text: { type: 'string' } }, ['mau']],
  ['phu_de_mau', 'Áp mẫu phụ đề một chạm: ten = Trắng viền đen|Vàng karaoke|Hộp nền đen|Viên thuốc|Bật từng từ|Nổi lên nhẹ.', { ten: { type: 'string' } }, ['ten']],
  ['nhap_srt', 'Dùng phụ đề SRT người dùng đưa (srt = nội dung file .srt, giờ theo dòng thời gian) thay phụ đề tự sinh. bo=true để bỏ phụ đề nhập.', { srt: { type: 'string' }, bo: { type: 'boolean' } }],
  ['nen_khung', 'Nền khung khi hình không phủ kín (thu nhỏ, video ngang trong khung dọc): kieu den|mau|mo (mờ chính video), mau #hex khi kieu mau.', { kieu: { type: 'string' }, mau: { type: 'string' } }, ['kieu']],
  ['them_am_thanh', 'Thêm hiệu ứng âm thanh lên A3 tại giây t: loai whoosh|pop|ding|click|boom|riser|tick|chup. Hợp: whoosh ở chuyển cảnh, pop khi chữ bật, ding khi nêu ý chính, riser trước cao trào. Vừa phải, đừng rải khắp video.', { loai: { type: 'string' }, t: { type: 'number' } }, ['loai']],
  ['sua_am_thanh', 'Sửa mục A3 theo id: t_bd, bd, kt (khúc lấy trong âm gốc), am_db (-30..12), fi, fo (giây vào/tắt dần). xoa=true để xoá.', { id: { type: 'string' }, t_bd: { type: 'number' }, bd: { type: 'number' }, kt: { type: 'number' }, am_db: { type: 'number' }, fi: { type: 'number' }, fo: { type: 'number' }, xoa: { type: 'boolean' } }, ['id']],
  ['tach_am_thanh', 'Tách âm thanh đoạn V1 thứ i xuống A3 (đoạn gốc tắt tiếng) để kéo lệch làm J-cut / L-cut.', { i: { type: 'integer' } }, ['i']],
  ['chuan_hoa_am', 'Đưa âm lượng các đoạn V1 và A3 về cùng độ to (khoảng -19 dB), hợp khi footage quay nhiều lần to nhỏ khác nhau.', {}],
  ['mo_phien_ban', 'Mở phiên bản thứ i (xem danh sách phien_ban trong dự án).', { i: { type: 'integer' } }, ['i']]
];
const AGENT_HE_THONG = `Bạn là Trợ lý dựng của Viral Studio (khoá Tự Mình Xây Kênh), làm việc ngay trên dòng thời gian của người dùng bằng các tool. Nói tiếng Việt có dấu, ngắn gọn.
Quy tắc:
- Trạng thái dự án mới nhất được đính kèm trong tin nhắn (JSON). Đơn vị: giây. bd/kt của đoạn là giây trong source; tl, t_bd, bd/kt của đồ hoạ là giây trên dòng thời gian. Footage chỉ dùng được khi trang_thai = "xong" (nếu chưa, gọi hieu_footage, báo tốn lượt).
- Làm đúng yêu cầu, không tự ý làm quá. Sửa nhỏ thì dùng từng lệnh (sua_doan, tach_doan, them_do_hoa…); dựng mới từ dòng thời gian trống thì có thể dùng tro_ly_dung rồi tinh chỉnh.
- Video ngắn: 3 giây đầu phải mạnh, mỗi ý 3–5 giây, bỏ vấp/lặp/lạc, phụ đề bật, đồ hoạ vừa đủ (tiêu đề 2s đầu, nhãn góc cho bước, thanh tiến độ).
- Sau khi đặt đồ hoạ hoặc đổi khung/nền, gọi xem_khung ở thời điểm liên quan để tự kiểm rồi sửa nếu chữ chồng mặt hay lệch. Tối đa ~12 lệnh một lượt.
- Không gọi xuat_video, long_tieng, hieu_footage nếu người dùng không yêu cầu hoặc chưa cần. Không bịa lời thoại.
- Motion graphics: ưu tiên mẫu có sẵn (điền props), đặt đúng lúc nói bằng tim_loi hoặc dat_theo_loi/bam_loi. Chỉ dùng kieu ai (tự thiết kế cảnh có keyframe) khi không mẫu nào hợp; sau đó xem_khung ở 2–3 thời điểm để tự kiểm.
- Mỗi lệnh chỉ gọi MỘT lần: kết quả lệnh và trạng thái dự án đính kèm đã phản ánh thay đổi, không gọi lại lệnh đã thành công. Gọi được nhiều lệnh cùng lúc khi chúng độc lập.
- Keyframe từng thuộc tính: keyframe. Overlay/sticker nằm trên: sua_broll lop 3, vua contain. Màu/hiệu ứng cả video: ap_tat_ca. Cắt nhanh đầu/cuối đoạn: cat_dau_phat. Chữ đẹp nhanh: mau_chu rồi sua_do_hoa để chỉnh kiểu chữ. Âm thanh: them_am_thanh (SFX, vừa phải), tach_am_thanh (J/L-cut), chuan_hoa_am.
- Cắt dead air: dùng cat_khoang_lang. Chữ tự do/emoji: them_do_hoa kieu chu/sticker. Tốc độ, zoom chậm, màu, âm lượng: sua_doan. Khung vuông/ngang, phong cách: cai_dat. Nhiều short từ video dài: tao_shorts (tốn lượt, chỉ khi được yêu cầu).
- Kết thúc bằng 1–3 câu tóm tắt đã làm gì và gợi ý bước tiếp (không liệt kê lại từng lệnh).`;
/* vé cho một lượt agent: HMAC(token người dùng + hạn 10 phút) ký bằng khoá bí mật của máy chủ.
   Bước đầu đã kiểm đăng nhập và trừ lượt qua Apps Script, các bước sau chỉ cần vé, không gọi Apps Script lại. */
async function khoaVe(env) { const bi = String(env.VE_SECRET || dsKey(env)[0] || env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY || ''); return crypto.subtle.importKey('raw', new TextEncoder().encode('viral-studio-ve|' + bi), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); }
async function kyVe(env, noiDung) { const sig = await crypto.subtle.sign('HMAC', await khoaVe(env), new TextEncoder().encode(noiDung)); return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c])); }
async function taoVe(env, token) { const han = Date.now() + 600000; return han + '.' + await kyVe(env, han + '|' + String(token || '')); }
async function veHopLe(env, ve, token) { const [han, ky] = String(ve).split('.'); if (!han || !ky || +han < Date.now()) return false; return (await kyVe(env, han + '|' + String(token || ''))) === ky; }
function llmNcc(env) { const p = String(env.LLM_PROVIDER || 'gemini').toLowerCase(); return /claude|anthropic/.test(p) ? 'claude' : /openai|gpt/.test(p) ? 'openai' : 'gemini'; }
function llmCoKey(env) { const n = llmNcc(env); return n === 'claude' ? !!env.ANTHROPIC_API_KEY : n === 'openai' ? !!env.OPENAI_API_KEY : dsKey(env).length > 0; }
function llmModel(env) { return env.LLM_MODEL || { gemini: 'gemini-3.5-flash', claude: 'claude-sonnet-4-5', openai: 'gpt-4.1' }[llmNcc(env)]; }
async function agent(req, env, cors) {
  let b = {}; try { b = await req.json(); } catch { }
  const ls = Array.isArray(b.lich_su) ? b.lich_su : []; if (!ls.length) return json({ ok: false, error: 'thieu_lich_su' }, cors, 400);
  if (!llmCoKey(env)) return json({ ok: false, error: 'chua_co_key_' + llmNcc(env) }, cors, 503);
  if (!asUrl(env)) return json({ ok: false, error: 'chua_noi_apps_script' }, cors, 503);
  let luotCon = null, ve = String(b.ve || '');
  if (+b.buoc) { if (!(await veHopLe(env, ve, b.token))) return json({ ok: false, error: 'het_phien' }, cors, 402); }   // bước sau phải có vé từ bước đầu
  else {   // bước đầu của một lượt: trừ 1 lượt chat (Free), Pro/học viên trả ok
    let kiem = {}; try { const r = await fetch(asUrl(env), { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'st_use', token: String(b.token || ''), tool: 'chat' }), redirect: 'follow' }); kiem = await r.json(); } catch { return json({ ok: false, error: 'khong_noi_duoc_apps_script' }, cors, 502); }
    if (!kiem.ok) return json({ ok: false, error: kiem.error || 'het_phien' }, cors, 402);
    luotCon = kiem.luot_con == null ? null : kiem.luot_con;
    ve = await taoVe(env, b.token);
  }
  const hs = b.ho_so && typeof b.ho_so === 'object' ? Object.entries(b.ho_so).filter(([k, v]) => v).map(([k, v]) => k + ': ' + String(v).slice(0, 200)).join('; ') : '';
  const heThong = AGENT_HE_THONG + (hs ? '\nHồ sơ kênh người dùng: ' + hs : '');
  const duAn = 'Trạng thái dự án hiện tại:\n' + JSON.stringify(b.du_an || {}).slice(0, 60000);
  try {
    const kq = await ({ gemini: goiGeminiAgent, claude: goiClaudeAgent, openai: goiOpenAIAgent })[llmNcc(env)](env, heThong, ls, duAn);
    return json({ ok: true, text: kq.text || '', ky_text: kq.ky_text, goi: kq.goi || [], luot_con: luotCon, ve, ncc: llmNcc(env), model: llmModel(env) }, cors);
  } catch (e) { return json({ ok: false, error: 'llm_loi', chi_tiet: String(e && e.message || e).slice(0, 300), luot_con: luotCon }, cors, 502); }
}
/* ── Gemini: functionDeclarations, functionCall / functionResponse ── */
async function goiGeminiAgent(env, heThong, ls, duAn) {
  const contents = []; const cuoiNd = ls.map(m => m.vai).lastIndexOf('nd');
  ls.forEach((m, i) => {
    if (m.vai === 'nd') contents.push({ role: 'user', parts: [{ text: m.text + (i === cuoiNd ? '\n\n' + duAn : '') }] });
    else if (m.vai === 'ai') { const parts = []; if (m.text) { const p = { text: m.text }; if (m.ky_text) p.thoughtSignature = m.ky_text; parts.push(p); } (m.goi || []).forEach(g => { const p = { functionCall: { name: g.ten, args: g.args || {} } }; if (g.ky) p.thoughtSignature = g.ky; parts.push(p); }); if (parts.length) contents.push({ role: 'model', parts }); }   // Gemini 3: phải gửi lại thoughtSignature của từng part
    else if (m.vai === 'tool') { const parts = []; (m.kq || []).forEach(k => { parts.push({ functionResponse: { name: k.ten, response: { ket_qua: (k.text || '').slice(0, 30000), loi: !!k.isError } } }); if (k.image && k.image.data) parts.push({ inlineData: { mimeType: k.image.mime || 'image/png', data: k.image.data } }); }); contents.push({ role: 'user', parts }); }
  });
  // trạng thái mới nhất luôn đi kèm lượt tool gần nhất để model không dùng số cũ
  const last = contents[contents.length - 1]; if (last && last.role === 'user' && !/Trạng thái dự án/.test(JSON.stringify(last.parts).slice(0, 200))) last.parts.push({ text: duAn });
  const body = { systemInstruction: { parts: [{ text: heThong }] }, contents, tools: [{ functionDeclarations: AGENT_TOOLS.map(([name, description, props, required]) => ({ name, description, parameters: { type: 'object', properties: props, required: required || [] } })) }], generationConfig: { temperature: 0.4, maxOutputTokens: 2000 } };
  let j, model = llmModel(env);
  try { j = await goiGemini(env, model, body); }
  catch (e) { if (!/429|503|RESOURCE_EXHAUSTED|overloaded/i.test(String(e.message)) || model === 'gemini-3.5-flash-lite') throw e; model = 'gemini-3.5-flash-lite'; j = await goiGemini(env, model, body); }   // hết hạn mức model chính → lùi về flash-lite
  const parts = ((((j.candidates || [])[0] || {}).content || {}).parts || []);
  const tp = parts.find(p => p.text && p.thoughtSignature);
  return { text: parts.filter(p => p.text).map(p => p.text).join('\n').trim(), ky_text: tp ? tp.thoughtSignature : undefined, goi: parts.filter(p => p.functionCall).map((p, k) => ({ id: 'g' + Date.now().toString(36) + k, ten: p.functionCall.name, args: p.functionCall.args || {}, ky: p.thoughtSignature })) };
}
/* ── Claude (Anthropic Messages API): tools, tool_use / tool_result (ảnh nằm trong tool_result) ── */
async function goiClaudeAgent(env, heThong, ls, duAn) {
  const messages = []; const cuoiNd = ls.map(m => m.vai).lastIndexOf('nd');
  ls.forEach((m, i) => {
    if (m.vai === 'nd') messages.push({ role: 'user', content: m.text + (i === cuoiNd ? '\n\n' + duAn : '') });
    else if (m.vai === 'ai') { const c = []; if (m.text) c.push({ type: 'text', text: m.text }); (m.goi || []).forEach(g => c.push({ type: 'tool_use', id: g.id, name: g.ten, input: g.args || {} })); if (c.length) messages.push({ role: 'assistant', content: c }); }
    else if (m.vai === 'tool') { const c = (m.kq || []).map(k => { const content = [{ type: 'text', text: (k.text || '').slice(0, 30000) }]; if (k.image && k.image.data) content.push({ type: 'image', source: { type: 'base64', media_type: k.image.mime || 'image/png', data: k.image.data } }); return { type: 'tool_result', tool_use_id: k.id, content, is_error: !!k.isError }; }); c.push({ type: 'text', text: duAn }); messages.push({ role: 'user', content: c }); }
  });
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: llmModel(env), max_tokens: 2000, system: heThong, messages, tools: AGENT_TOOLS.map(([name, description, props, required]) => ({ name, description, input_schema: { type: 'object', properties: props, required: required || [] } })) }) });
  if (!r.ok) throw new Error('claude ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json(); const c = j.content || [];
  return { text: c.filter(x => x.type === 'text').map(x => x.text).join('\n').trim(), goi: c.filter(x => x.type === 'tool_use').map(x => ({ id: x.id, ten: x.name, args: x.input || {} })) };
}
/* ── OpenAI Chat Completions: tools/function, tool_calls, role tool (ảnh gửi thêm bằng image_url) ── */
async function goiOpenAIAgent(env, heThong, ls, duAn) {
  const messages = [{ role: 'system', content: heThong }]; const cuoiNd = ls.map(m => m.vai).lastIndexOf('nd');
  ls.forEach((m, i) => {
    if (m.vai === 'nd') messages.push({ role: 'user', content: m.text + (i === cuoiNd ? '\n\n' + duAn : '') });
    else if (m.vai === 'ai') { const msg = { role: 'assistant', content: m.text || null }; if (m.goi && m.goi.length) msg.tool_calls = m.goi.map(g => ({ id: g.id, type: 'function', function: { name: g.ten, arguments: JSON.stringify(g.args || {}) } })); messages.push(msg); }
    else if (m.vai === 'tool') { const anh = []; (m.kq || []).forEach(k => { messages.push({ role: 'tool', tool_call_id: k.id, content: (k.isError ? 'LỖI: ' : '') + (k.text || '').slice(0, 30000) }); if (k.image && k.image.data) anh.push({ type: 'image_url', image_url: { url: 'data:' + (k.image.mime || 'image/png') + ';base64,' + k.image.data } }); }); messages.push({ role: 'user', content: [{ type: 'text', text: (anh.length ? 'Ảnh khung hình vừa xem ở trên.\n' : '') + duAn }, ...anh] }); }
  });
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.OPENAI_API_KEY }, body: JSON.stringify({ model: llmModel(env), messages, tools: AGENT_TOOLS.map(([name, description, props, required]) => ({ type: 'function', function: { name, description, parameters: { type: 'object', properties: props, required: required || [] } } })), temperature: 0.4 }) });
  if (!r.ok) throw new Error('openai ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json(); const m = (((j.choices || [])[0] || {}).message) || {};
  return { text: (m.content || '').trim(), goi: (m.tool_calls || []).map(t => { let a = {}; try { a = JSON.parse(t.function.arguments || '{}'); } catch { } return { id: t.id, ten: t.function.name, args: a }; }) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Đồ hoạ AI: mô tả tiếng Việt → cảnh JSON có keyframe (giống Vyra sinh motion graphics, nhưng là dữ liệu
   thay vì code, nên trình dựng vẽ an toàn và tua tới giây nào cũng đúng hình).
   ═══════════════════════════════════════════════════════════════════════════ */
const CANH_SCHEMA = { type: 'object', properties: { lop: { type: 'array', items: { type: 'object', properties: {
  loai: { type: 'string', enum: ['hop', 'tron', 'chu', 'duong', 'vong', 'so'] }, mau: { type: 'string' }, vien: { type: 'string' }, day: { type: 'number' }, bo_goc: { type: 'number' },
  chu: { type: 'string' }, co: { type: 'number' }, dam: { type: 'number' }, can: { type: 'string' }, so_tu: { type: 'number' }, so_den: { type: 'number' }, dinh_dang: { type: 'string' },
  kf: { type: 'array', items: { type: 'object', properties: { t: { type: 'number' }, x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' }, s: { type: 'number' }, xoay: { type: 'number' }, mo: { type: 'number' }, tien_do: { type: 'number' }, ease: { type: 'string', enum: ['vao', 'ra', 'mem', 'nay', 'deu'] } }, required: ['t'] } } },
  required: ['loai', 'kf'] } } }, required: ['lop'] };
/* ── kiểm tra sức khoẻ trước buổi demo: Apps Script trả lời không, key Gemini còn chạy không (một câu hỏi rất ngắn) ── */
async function sucKhoe(env, cors) {
  const kq = { ok: true, phien_ban: PHIEN_BAN, luc: new Date().toISOString(), apps_script: { ok: false }, gemini: { ok: false, so_key: dsKey(env).length }, broll: coKho(env) };
  const t1 = Date.now(); try { const r = await fetch(asUrl(env), { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'st_cfg' }), redirect: 'follow' }); const j = await r.json(); kq.apps_script = { ok: !!j.ok, ms: Date.now() - t1, luot: j.luot || null }; } catch (e) { kq.apps_script = { ok: false, ms: Date.now() - t1, loi: String(e.message || e).slice(0, 120) }; }
  const t2 = Date.now(); try { const j = await goiGemini(env, 'gemini-3.5-flash-lite', { contents: [{ parts: [{ text: 'Trả lời đúng một chữ: OK' }] }], generationConfig: { maxOutputTokens: 5 } }); const txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join(''); kq.gemini = { ok: !!txt, ms: Date.now() - t2, so_key: dsKey(env).length, tra_loi: txt.slice(0, 20) }; } catch (e) { kq.gemini = { ok: false, ms: Date.now() - t2, so_key: dsKey(env).length, loi: String(e.message || e).slice(0, 160) }; }
  kq.ok = kq.apps_script.ok && kq.gemini.ok; return json(kq, cors, 200);
}
/* ── dịch phụ đề song ngữ (trình dựng video): một lượt dịch tối đa 60 câu ── */
const NN_DICH = { en: 'tiếng Anh', zh: 'tiếng Trung giản thể', ko: 'tiếng Hàn', ja: 'tiếng Nhật', th: 'tiếng Thái', id: 'tiếng Indonesia', fr: 'tiếng Pháp', es: 'tiếng Tây Ban Nha' };
async function dichPhuDe(req, env, cors) {
  let b = {}; try { b = await req.json(); } catch { }
  const dong = Array.isArray(b.dong) ? b.dong.slice(0, 60).map(x => String(x || '').slice(0, 300)) : [], nn = NN_DICH[b.ngon_ngu] ? b.ngon_ngu : 'en';
  if (!dong.length) return json({ ok: false, error: 'thieu_text' }, cors, 400);
  if (!dsKey(env).length) return json({ ok: false, error: 'chua_co_key' }, cors, 503);
  let kiem = {}; try { const r = await fetch(asUrl(env), { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'st_use', token: String(b.token || ''), tool: 'chat' }), redirect: 'follow' }); kiem = await r.json(); } catch { return json({ ok: false, error: 'khong_noi_duoc_apps_script' }, cors, 502); }
  if (!kiem.ok) return json({ ok: false, error: kiem.error || 'het_phien' }, cors, 402);
  const prompt = 'Dịch từng dòng phụ đề video TikTok tiếng Việt sau sang ' + NN_DICH[nn] + '. Giữ nghĩa và giọng nói chuyện tự nhiên, ngắn gọn như phụ đề; giữ nguyên tên riêng, số, emoji. Các dòng là các cụm liên tiếp của cùng một câu nói, dịch sao cho đọc liền mạch. Trả về DUY NHẤT JSON {"dich":[...]} có đúng ' + dong.length + ' phần tử, cùng thứ tự.\n' + JSON.stringify(dong);
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 6000, responseMimeType: 'application/json' } };
  let j; try { j = await goiGemini(env, env.LLM_DICH || 'gemini-3.5-flash-lite', body); } catch (e) { return json({ ok: false, error: 'llm_loi', chi_tiet: String(e.message).slice(0, 200) }, cors, 502); }
  const txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join(''); let o = null; try { o = JSON.parse(txt); } catch { }
  const dich = o && Array.isArray(o.dich) ? o.dich.slice(0, dong.length).map(x => String(x || '').slice(0, 400)) : null; if (!dich) return json({ ok: false, error: 'llm_loi', chi_tiet: 'không đọc được kết quả dịch' }, cors, 502);
  while (dich.length < dong.length) dich.push('');
  return json({ ok: true, dich, ngon_ngu: nn }, cors);
}
async function doHoaAI(req, env, cors) {
  let b = {}; try { b = await req.json(); } catch { }
  const moTa = String(b.mo_ta || '').trim().slice(0, 800); if (!moTa) return json({ ok: false, error: 'thieu_text' }, cors, 400);
  if (!dsKey(env).length) return json({ ok: false, error: 'chua_co_key' }, cors, 503);
  let kiem = {}; try { const r = await fetch(asUrl(env), { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'st_use', token: String(b.token || ''), tool: 'chat' }), redirect: 'follow' }); kiem = await r.json(); } catch { return json({ ok: false, error: 'khong_noi_duoc_apps_script' }, cors, 502); }
  if (!kiem.ok) return json({ ok: false, error: kiem.error || 'het_phien' }, cors, 402);
  const dai = Math.max(0.8, Math.min(20, +b.dai || 3)), tiLe = /^(9:16|1:1|4:5|16:9)$/.test(b.ti_le) ? b.ti_le : '9:16', mau = /^#[0-9a-f]{3,8}$/i.test(b.mau_nhan || '') ? b.mau_nhan : '#99DF00';
  const loi = Array.isArray(b.loi) ? b.loi.slice(0, 80).map(w => String(w.w || '').slice(0, 30) + '@' + (+w.t || 0).toFixed(2)).join(' ') : '';
  const prompt = [
    'Bạn là motion designer cho video TikTok tiếng Việt. Thiết kế MỘT motion graphic theo mô tả, dưới dạng cảnh gồm các lớp có keyframe.',
    'Trả về DUY NHẤT một JSON dạng {"lop":[{"loai":...,"kf":[...]}]}, các trường như ví dụ cuối. Mọi số là tỉ lệ 0–1 (KHÔNG dùng pixel), tối đa 2 chữ số thập phân.',
    'Khung ' + tiLe + '. Toạ độ x,y là TÂM của lớp, 0–1 theo chiều ngang/dọc khung. w,h là kích thước 0–1 theo chiều ngang/dọc khung (tron/vong: w là đường kính theo chiều ngang; duong: (w,h) là vector từ điểm đầu). co = cỡ chữ theo cạnh ngắn (0.04–0.12 là vừa đọc trên điện thoại). day = độ dày nét theo cạnh ngắn.',
    'Thời lượng ' + dai + ' giây, t tính từ 0 tới ' + dai + '. Mỗi lớp có kf sắp theo t; thuộc tính không ghi ở keyframe thì giữ giá trị gần nhất. ease của keyframe là kiểu chuyển động đi TỚI keyframe đó: vao (nhanh rồi chậm, hợp xuất hiện), nay (vọt quá rồi về, hợp bật), mem, ra, deu.',
    'tien_do 0→1 dùng để: vẽ dần đường (duong), vẽ dần vòng (vong), gõ chữ (chu), đếm số (so: so_tu→so_den, dinh_dang có {} chỗ đặt số, ví dụ "{} triệu").',
    'mau dùng mã #hex, "nhan" là màu nhấn của kênh (' + mau + '), "khong" là không tô (chỉ viền). Chữ tiếng Việt CÓ DẤU, ngắn, đậm (dam 800–900), nên có lớp nền tối (#0b0d10, mo 0.75) hoặc viền đen để đọc rõ trên video.',
    'Nguyên tắc đẹp: vào trong 0.3–0.5s bằng ease vao/nay, giữ yên phần giữa, ra trong 0.3s cuối (mo về 0). Các phần xuất hiện lệch nhau 0.15–0.4s. Không che vùng giữa mặt người nói (y 0.3–0.6, x 0.3–0.7) trừ khi mô tả yêu cầu. Tối đa 25 lớp.',
    loi ? 'Lời người nói trong khoảng này (từ@giây tính từ đầu đồ hoạ), dùng để canh các phần xuất hiện đúng lúc được nhắc: ' + loi : '',
    b.cu ? 'Bản trước (sửa theo yêu cầu, giữ phần không nhắc tới): ' + JSON.stringify(b.cu).slice(0, 6000) : '',
    'BẮT BUỘC: keyframe ĐẦU TIÊN của mỗi lớp ghi đủ x, y, w, h (hình học đầy đủ). Lớp chu phải có "chu" (nội dung). Lớp so phải có so_tu, so_den, dinh_dang. Lớp duong phải có w,h khác 0 (hướng vẽ). Không bỏ trống.',
    'VÍ DỤ (2 giây, nhãn bật lên rồi số đếm): {"lop":[{"loai":"hop","mau":"#0b0d10","bo_goc":0.4,"kf":[{"t":0,"x":0.5,"y":0.78,"w":0.7,"h":0.12,"mo":0,"s":0.8},{"t":0.35,"mo":0.8,"s":1,"ease":"nay"},{"t":1.7,"mo":0.8},{"t":2,"mo":0}]},{"loai":"so","mau":"nhan","co":0.08,"dam":900,"so_tu":0,"so_den":120,"dinh_dang":"{} học viên","kf":[{"t":0.2,"x":0.5,"y":0.78,"w":0.6,"h":0.1,"mo":0,"tien_do":0},{"t":0.4,"mo":1},{"t":1.4,"tien_do":1,"ease":"mem"},{"t":1.7,"mo":1},{"t":2,"mo":0}]}]}',
    'MÔ TẢ: ' + moTa
  ].filter(Boolean).join('\n');
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 7000, responseMimeType: 'application/json' } };   // không ép responseSchema: thử thật cho thấy khuôn cứng làm model bỏ trường hoặc kẹt số
  let j, model = env.LLM_DO_HOA || 'gemini-3.5-flash-lite';   // flash-lite: 2–7 giây, đủ tốt với ví dụ + tự kiểm; đổi bằng biến LLM_DO_HOA
  try { j = await goiGemini(env, model, body); } catch (e) { if (!/429|503|RESOURCE_EXHAUSTED/i.test(String(e.message))) return json({ ok: false, error: 'llm_loi', chi_tiet: String(e.message).slice(0, 200) }, cors, 502); model = 'gemini-3.5-flash-lite'; try { j = await goiGemini(env, model, body); } catch (e2) { return json({ ok: false, error: 'llm_loi', chi_tiet: String(e2.message).slice(0, 200) }, cors, 502); } }
  const docCanh = j2 => { const txt = ((((j2.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join(''); try { return JSON.parse(txt); } catch { return null; } };
  let canh = docCanh(j), loiCanh = kiemCanh(canh);
  if (loiCanh.length) {   // tự kiểm: thiếu trường thì bắt AI sửa một lần
    const body2 = { ...body, contents: [{ role: 'user', parts: [{ text: prompt }] }, { role: 'model', parts: [{ text: JSON.stringify(canh || {}) }] }, { role: 'user', parts: [{ text: 'Cảnh trên có lỗi, sửa và trả lại TOÀN BỘ cảnh: ' + loiCanh.join('; ') }] }] };
    try { const j2 = await goiGemini(env, model, body2); const c2 = docCanh(j2); if (c2 && kiemCanh(c2).length < loiCanh.length) { canh = c2; loiCanh = kiemCanh(c2); } } catch { }
  }
  if (canh && Array.isArray(canh.lop)) canh.lop = canh.lop.filter(l => !loiLop(l));   // bỏ lớp còn hỏng thay vì vẽ sai
  if (!canh || !Array.isArray(canh.lop) || !canh.lop.length) return json({ ok: false, error: 'llm_loi', chi_tiet: 'cảnh trống' }, cors, 502);
  return json({ ok: true, canh, model, luot_con: kiem.luot_con == null ? null : kiem.luot_con }, cors);
}

function loiLop(l) {
  if (!l || !Array.isArray(l.kf) || !l.kf.length) return 'thiếu kf';
  const f0 = l.kf[0] || {};
  if (l.loai === 'chu' && !String(l.chu || '').trim()) return 'lớp chu thiếu "chu"';
  if (l.loai === 'so' && (l.so_den == null || !isFinite(+l.so_den))) return 'lớp so thiếu so_den';
  if (l.loai === 'duong' && !l.kf.some(f => (+f.w || 0) !== 0 || (+f.h || 0) !== 0)) return 'lớp duong thiếu w,h (hướng)';
  if ((l.loai === 'hop') && !l.kf.some(f => f.w != null) ) return 'lớp hop thiếu w';
  if ((l.loai === 'hop') && !l.kf.some(f => f.h != null)) return 'lớp hop thiếu h';
  if (['tron', 'vong'].includes(l.loai) && !l.kf.some(f => (+f.w || 0) > 0)) return 'lớp ' + l.loai + ' thiếu w (đường kính)';
  if (f0.x == null || f0.y == null) return 'keyframe đầu thiếu x,y';
  return '';
}
function kiemCanh(c) { if (!c || !Array.isArray(c.lop) || !c.lop.length) return ['cảnh trống']; return c.lop.map((l, i) => { const e = loiLop(l); return e ? 'lớp ' + (i + 1) + ': ' + e : ''; }).filter(Boolean).slice(0, 12); }
