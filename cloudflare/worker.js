/* ═══════════════════════════════════════════════════════════════════════════
   Viral Studio · máy chủ phụ trên Cloudflare Workers (gói Free)
   ─────────────────────────────────────────────────────────────────────────
   Làm những việc Apps Script không làm được hoặc làm chậm:
     GET  /            → tình trạng máy chủ (tool tự dò để bật tính năng)
     GET  /broll       → tìm kho B-roll miễn phí (Pixabay và/hoặc Pexels), trả link đã qua /media để vẽ lên canvas
     GET  /media?u=    → phát lại file Pixabay/Pexels có CORS + Range (xem trước, xuất video)
     GET  /tai?u=&ten= → tải hộ file video/ảnh/nhạc từ CDN các nền tảng, không giới hạn 35MB, có tên file
     POST /tts         → lồng tiếng AI tiếng Việt (Gemini TTS), trả WAV; trừ lượt qua Apps Script
     POST /agent       → Trợ lý dựng kiểu agent: nhận yêu cầu + trạng thái dự án, hỏi LLM có tool-calling
                         (bộ lệnh học theo Vyra MCP), trả về lệnh để tab chạy lên dòng thời gian; lặp tới khi xong.
                         Đổi nhà cung cấp AI bằng biến LLM_PROVIDER = gemini | claude | openai (+ key tương ứng).

   Biến môi trường (Settings → Variables and Secrets):
     GEMINI_API_KEYS   một hoặc nhiều key Gemini, cách nhau dấu phẩy (Secret)
     PIXABAY_KEY       key miễn phí tại pixabay.com/api/docs (đăng nhập là thấy) (Secret)
     PEXELS_KEY        (tuỳ chọn) key Pexels nếu có; có cả hai thì gộp kết quả (Secret)
     APPS_SCRIPT_URL   link /exec của Apps Script (để kiểm đăng nhập + trừ lượt khi lồng tiếng)
     ORIGINS           (tuỳ chọn) các trang được gọi, cách nhau dấu phẩy. Mặc định: GitHub Pages của khoá
     LLM_PROVIDER      (tuỳ chọn) gemini (mặc định) | claude | openai — AI cho Trợ lý dựng agent
     LLM_MODEL         (tuỳ chọn) tên model; mặc định gemini-3.5-flash / claude-sonnet-4-5 / gpt-4.1
     ANTHROPIC_API_KEY, OPENAI_API_KEY   (Secret) key khi chọn claude / openai
   ═══════════════════════════════════════════════════════════════════════════ */

const PHIEN_BAN = '2026.10.03';
const ORIGIN_MD = 'https://minhtoan8668.github.io,http://localhost:8765,http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const TTS_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts'];
const TTS_GIONG = { nu_am: 'Kore', nu_tre: 'Leda', nu_diu: 'Aoede', nu_sang: 'Zephyr', nam_tram: 'Charon', nam_tre: 'Puck', nam_am: 'Orus', nam_manh: 'Fenrir' };
/* CDN được tải hộ: chỉ tên miền chứa file của các nền tảng, để máy chủ không thành proxy mở */
const HOST_TAI = /(^|\.)(pixabay\.com|tiktokcdn(-us|-eu)?\.com|tiktokcdn-us\.com|tikwm\.com|byteoversea\.com|ibyteimg\.com|byteimg\.com|douyinvod\.com|douyinpic\.com|douyinstatic\.com|twimg\.com|fxtwitter\.com|cdninstagram\.com|fbcdn\.net|bsky\.app|bsky\.network|pexels\.com|ytimg\.com|googlevideo\.com|xhscdn\.com|akamaized\.net|redd\.it|redditmedia\.com|pinimg\.com|vimeocdn\.com|threads\.net)$/i;
const HOST_MEDIA = /(^|\.)(pexels\.com|pixabay\.com)$/i;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, '') || '/';
    const cors = corsCho(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-max-age': '86400' } });
    try {
      if (path === '/') return json({ ok: true, ten: 'Viral Studio · máy chủ Cloudflare', phien_ban: PHIEN_BAN, dich_vu: { broll: coKho(env), tts: !!dsKey(env).length, tai: true, kiem_luot: !!env.APPS_SCRIPT_URL, agent: !!llmCoKey(env), agent_ncc: llmNcc(env) } }, cors);
      if (path === '/broll' && req.method === 'GET') return json(await timBroll(url, env, ctx), cors);
      if (path === '/media' && req.method === 'GET') return media(req, url, cors);
      if (path === '/tai' && req.method === 'GET') return taiHo(req, url, cors);
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
  ['sua_doan', 'Sửa đoạn V1 thứ i: bd/kt (giây trong source), chuyen, chuyen_dai (0.2–1.2s), truot (trượt khúc lấy trong source ±giây, giữ độ dài).', { i: { type: 'integer' }, bd: { type: 'number' }, kt: { type: 'number' }, chuyen: { type: 'string' }, chuyen_dai: { type: 'number' }, truot: { type: 'number' } }, ['i']],
  ['xoa_doan', 'Xoá đoạn V1 thứ i (ripple: chữ, đồ hoạ, b-roll sau dồn lên).', { i: { type: 'integer' } }, ['i']],
  ['tach_doan', 'Tách đoạn V1 tại giây tl trên dòng thời gian.', { tl: { type: 'number' } }, ['tl']],
  ['sap_xep_doan', 'Đổi thứ tự V1: thu_tu là mảng chỉ số cũ theo thứ tự mới, ví dụ [2,0,1].', { thu_tu: { type: 'array', items: { type: 'integer' } } }, ['thu_tu']],
  ['bo_vap', 'Cắt bỏ mọi câu vấp, lặp, lạc đề khỏi V1.', {}],
  ['hit_beat', 'Kéo mép các đoạn về beat nhạc gần nhất (cần có nhạc nền).', {}],
  ['dat_broll', 'Đặt b-roll lên V2: src_id, bd→kt trong source, t_bd giây bắt đầu trên dòng thời gian, kieu = full | pip.', { src_id: { type: 'string' }, bd: { type: 'number' }, kt: { type: 'number' }, t_bd: { type: 'number' }, kieu: { type: 'string' } }, ['src_id', 'bd', 'kt', 't_bd']],
  ['xoa_broll', 'Xoá b-roll theo id.', { id: { type: 'string' } }, ['id']],
  ['them_do_hoa', 'Thêm đồ hoạ O1: kieu = tieu_de|lower_third|danh_sach|tien_do|trich_dan|dem_so|khung_nhan|mui_ten|vong_xoay|nhan_goc; bd, kt giây trên dòng thời gian; text, phu.', { kieu: { type: 'string' }, bd: { type: 'number' }, kt: { type: 'number' }, text: { type: 'string' }, phu: { type: 'string' } }, ['kieu', 'bd', 'kt']],
  ['sua_do_hoa', 'Sửa đồ hoạ theo id: bd, kt, text, phu.', { id: { type: 'string' }, bd: { type: 'number' }, kt: { type: 'number' }, text: { type: 'string' }, phu: { type: 'string' } }, ['id']],
  ['xoa_do_hoa', 'Xoá đồ hoạ theo id.', { id: { type: 'string' } }, ['id']],
  ['cai_dat', 'Đổi cài đặt chung. hook: chữ 3 giây đầu. phu_de: {bat, kieu highlight|pill|vien|emoji|toi|pop|rise, cum 2–6, nhan_manh "từ, từ", mau xanh|vang|cam|lam|hong, vi_tri 0.62|0.78|0.86}. khung: cat|bam_mat|mo. nen: {kieu giu|mo|mau|toi, mau #hex}. font: be_vietnam|montserrat|bricolage|lexend|oswald|anton|playfair. zoom_nhan. chuyen_mac_dinh. ten_du_an.', { hook: { type: 'string' }, phu_de: { type: 'object' }, khung: { type: 'string' }, nen: { type: 'object' }, font: { type: 'string' }, zoom_nhan: { type: 'boolean' }, chuyen_mac_dinh: { type: 'string' }, ten_du_an: { type: 'string' } }],
  ['hieu_footage', 'Cho AI hiểu một footage chưa hiểu (chép lời từng từ, cảnh, khoảnh khắc). Tốn 1 lượt Dựng video của người dùng, chờ 10–60s.', { src_id: { type: 'string' } }, ['src_id']],
  ['tro_ly_dung', 'Dựng bản nháp toàn bộ một phát theo yêu cầu (xếp câu, phụ đề, đồ hoạ, chuyển cảnh, b-roll) khi dòng thời gian còn trống. che_do = ky|nhanh.', { yeu_cau: { type: 'string' }, che_do: { type: 'string' } }, ['yeu_cau']],
  ['tim_broll_kho', 'Tìm kho B-roll miễn phí (Pexels). huong = doc|ngang. Trả id, giây, tác giả.', { q: { type: 'string' }, huong: { type: 'string' } }, ['q']],
  ['them_broll_kho', 'Tải một video từ kết quả tim_broll_kho (id) vào footage, rồi dùng dat_broll để đặt lên V2.', { id: { type: 'string' } }, ['id']],
  ['long_tieng', 'Tạo lồng tiếng AI tiếng Việt đặt lên A2 tại t_bd. giong: nu_am|nu_tre|nu_diu|nu_sang|nam_tram|nam_tre|nam_am|nam_manh. Tốn 1 lượt Dựng video.', { text: { type: 'string' }, giong: { type: 'string' }, cach: { type: 'string' }, t_bd: { type: 'number' } }, ['text']],
  ['xem_khung', 'Xem ảnh khung hình tại giây t trên dòng thời gian để tự kiểm bố cục, phụ đề, đồ hoạ trước khi kết luận.', { t: { type: 'number' } }, ['t']],
  ['xuat_phu_de', 'Trả phụ đề SRT theo dòng thời gian.', {}],
  ['xuat_video', 'Dựng và lưu video xuống máy người dùng. Chỉ gọi khi người dùng yêu cầu xuất. do_phan_giai = 720|1080|1440.', { do_phan_giai: { type: 'integer' } }],
  ['luu_du_an', 'Trả JSON dự án.', {}],
  ['hoan_tac', 'Hoàn tác thao tác gần nhất.', {}]
];
const AGENT_HE_THONG = `Bạn là Trợ lý dựng của Viral Studio (khoá Tự Mình Xây Kênh), làm việc ngay trên dòng thời gian của người dùng bằng các tool. Nói tiếng Việt có dấu, ngắn gọn.
Quy tắc:
- Trạng thái dự án mới nhất được đính kèm trong tin nhắn (JSON). Đơn vị: giây. bd/kt của đoạn là giây trong source; tl, t_bd, bd/kt của đồ hoạ là giây trên dòng thời gian. Footage chỉ dùng được khi trang_thai = "xong" (nếu chưa, gọi hieu_footage, báo tốn lượt).
- Làm đúng yêu cầu, không tự ý làm quá. Sửa nhỏ thì dùng từng lệnh (sua_doan, tach_doan, them_do_hoa…); dựng mới từ dòng thời gian trống thì có thể dùng tro_ly_dung rồi tinh chỉnh.
- Video ngắn: 3 giây đầu phải mạnh, mỗi ý 3–5 giây, bỏ vấp/lặp/lạc, phụ đề bật, đồ hoạ vừa đủ (tiêu đề 2s đầu, nhãn góc cho bước, thanh tiến độ).
- Sau khi đặt đồ hoạ hoặc đổi khung/nền, gọi xem_khung ở thời điểm liên quan để tự kiểm rồi sửa nếu chữ chồng mặt hay lệch. Tối đa ~12 lệnh một lượt.
- Không gọi xuat_video, long_tieng, hieu_footage nếu người dùng không yêu cầu hoặc chưa cần. Không bịa lời thoại.
- Kết thúc bằng 1–3 câu tóm tắt đã làm gì và gợi ý bước tiếp (không liệt kê lại từng lệnh).`;
function llmNcc(env) { const p = String(env.LLM_PROVIDER || 'gemini').toLowerCase(); return /claude|anthropic/.test(p) ? 'claude' : /openai|gpt/.test(p) ? 'openai' : 'gemini'; }
function llmCoKey(env) { const n = llmNcc(env); return n === 'claude' ? !!env.ANTHROPIC_API_KEY : n === 'openai' ? !!env.OPENAI_API_KEY : dsKey(env).length > 0; }
function llmModel(env) { return env.LLM_MODEL || { gemini: 'gemini-3.5-flash', claude: 'claude-sonnet-4-5', openai: 'gpt-4.1' }[llmNcc(env)]; }
async function agent(req, env, cors) {
  let b = {}; try { b = await req.json(); } catch { }
  const ls = Array.isArray(b.lich_su) ? b.lich_su : []; if (!ls.length) return json({ ok: false, error: 'thieu_lich_su' }, cors, 400);
  if (!llmCoKey(env)) return json({ ok: false, error: 'chua_co_key_' + llmNcc(env) }, cors, 503);
  if (!env.APPS_SCRIPT_URL) return json({ ok: false, error: 'chua_noi_apps_script' }, cors, 503);
  let luotCon = null;
  if (!(+b.buoc)) {   // bước đầu của một lượt: trừ 1 lượt chat (Free), Pro/học viên trả ok
    let kiem = {}; try { const r = await fetch(env.APPS_SCRIPT_URL, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'st_use', token: String(b.token || ''), tool: 'chat' }), redirect: 'follow' }); kiem = await r.json(); } catch { return json({ ok: false, error: 'khong_noi_duoc_apps_script' }, cors, 502); }
    if (!kiem.ok) return json({ ok: false, error: kiem.error || 'het_phien' }, cors, 402);
    luotCon = kiem.luot_con == null ? null : kiem.luot_con;
  }
  const hs = b.ho_so && typeof b.ho_so === 'object' ? Object.entries(b.ho_so).filter(([k, v]) => v).map(([k, v]) => k + ': ' + String(v).slice(0, 200)).join('; ') : '';
  const heThong = AGENT_HE_THONG + (hs ? '\nHồ sơ kênh người dùng: ' + hs : '');
  const duAn = 'Trạng thái dự án hiện tại:\n' + JSON.stringify(b.du_an || {}).slice(0, 60000);
  try {
    const kq = await ({ gemini: goiGeminiAgent, claude: goiClaudeAgent, openai: goiOpenAIAgent })[llmNcc(env)](env, heThong, ls, duAn);
    return json({ ok: true, text: kq.text || '', ky_text: kq.ky_text, goi: kq.goi || [], luot_con: luotCon, ncc: llmNcc(env), model: llmModel(env) }, cors);
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
