/* ═══════════════════════════════════════════════════════════════
   TẢI VỀ — tool thứ 5 của Viral Studio (tools/tai-ve.html)
   Dán link bài đăng → lấy link video / ảnh / âm thanh để tải.
   Không cần đăng nhập, không tốn lượt AI. Router: hookAi() trong HookAI.gs gọi taiVe(b)
   khi b.mode là 'taive' (lấy danh sách file) hoặc 'taive_file' (tải hộ một file cho trình duyệt).

   Trang web tự gọi tikwm (TikTok, Douyin) và fxtwitter (X) trực tiếp; máy chủ chỉ là đường dự phòng
   cho hai nguồn đó, và là đường chính cho nền tảng khác:
   · COBALT_URL (+ COBALT_KEY) trong Script properties: máy tải riêng của khoá (thư mục may-tai/ trong repo,
     chạy yt-dlp trên Railway, nói đúng giao thức cobalt) hoặc một máy cobalt (github.com/imputnet/cobalt).
     Có máy này thì YouTube, Instagram, Facebook, Threads, Reddit… tải được đầy đủ. Cài bằng bot: /maytai.
   · Không có cobalt: đọc thẻ og:video / og:image / og:audio của trang (Pinterest, một số bài Facebook,
     Threads, Instagram công khai…). Được bao nhiêu trả bấy nhiêu, không hứa.
   ═══════════════════════════════════════════════════════════════ */

var TV_FILE_TOI_DA = 35 * 1024 * 1024;   // tải hộ tối đa 35MB (base64 ~47MB, dưới trần 50MB trả về của Apps Script)
var TV_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function taiVe(b){
  try{
    var url = String(b.link || b.url || '').trim().slice(0, 1000);
    if (!/^https?:\/\/[^\s]+$/i.test(url)) return jsonOut({ok:false, error:'link_sai'});
    if (b.mode === 'taive_file') return tvTaiHo(url);
    var nen = tvNen(url);
    if (nen === 'tiktok' || nen === 'douyin'){
      var tw = tvTikwm(url);
      if (tw) return jsonOut({ok:true, nen:nen, nguon:'tikwm', raw:tw});
    }
    if (nen === 'x'){
      var fx = tvFx(url);
      if (fx) return jsonOut({ok:true, nen:nen, nguon:'fx', raw:fx});
    }
    var cb = tvCobalt(url);
    if (cb && cb.ok) return jsonOut(cb);
    var og = tvOg(url);
    if (og && og.items.length) return jsonOut({ok:true, nen:nen, nguon:'og', tieu_de:og.tieu_de, tac_gia:og.tac_gia, items:og.items, co_cobalt: !!cfgProp('COBALT_URL')});
    return jsonOut({ok:false, error:'khong_lay_duoc', nen:nen, co_cobalt: !!cfgProp('COBALT_URL'), loi: cb && cb.loi ? cb.loi : ''});
  }catch(err){ return jsonOut({ok:false, error:'internal', loi:String(err).slice(0, 200)}); }
}

/* Bot /maytai: cài máy tải riêng (may-tai trên Railway hoặc cobalt). /maytai <link> <key> · /maytai tat · /maytai (xem) */
function tvLenhMayTai(arg, chatId, hoi, msg){
  arg = String(arg || '').trim(); var P = PropertiesService.getScriptProperties(), cu = cfgProp('COBALT_URL');
  if (/^(tat|tắt|xoa|xóa)$/i.test(arg)){ P.deleteProperty('COBALT_URL'); P.deleteProperty('COBALT_KEY'); return tgSend(chatId, '✅ Đã tắt máy tải riêng. Tải video vẫn chạy cho TikTok, Douyin, X; YouTube chỉ lấy ảnh bìa.'); }
  var m = arg.match(/^(https:\/\/[^\s]+)\s*([^\s]*)$/);
  if (!m) return hoi((cu ? '✅ Đang dùng máy tải: `' + cu + '`\n\n' : '') + '⬇️ Gửi link máy tải và key, cách nhau một dấu cách. Ví dụ:\n`https://may-tai-production.up.railway.app keycuaban`\n\nCách dựng máy trên Railway: xem `may-tai/README.md` trong repo. Gửi `tat` để tắt. Tin chứa key sẽ được xoá khỏi chat.');
  if (msg && msg.message_id) try{ tgApi('deleteMessage', {chat_id: chatId, message_id: msg.message_id}); }catch(e){}   // không để key nằm lại trong chat
  var goc = m[1].replace(/\/+$/, ''), key = m[2] || '', h = {'Accept':'application/json'};
  if (key) h['Authorization'] = 'Api-Key ' + key;
  var tt = '', ma = 0, j = {};
  try{ var r = UrlFetchApp.fetch(goc + '/', {method:'post', contentType:'application/json', payload: JSON.stringify({url:'khong-phai-link'}), headers:h, muteHttpExceptions:true}); ma = r.getResponseCode(); try{ j = JSON.parse(r.getContentText()); }catch(e){} }
  catch(e){ return tgSend(chatId, '❌ Không gọi được `' + goc + '` (' + String(e).slice(0, 120) + '). Kiểm tra máy đã chạy và đã bật Public domain trên Railway chưa.'); }
  if (ma === 401 || /auth/.test(JSON.stringify(j))) return tgSend(chatId, '❌ Máy tải trả lời nhưng key sai. Gửi lại `/maytai ' + goc + ' <key đúng>` (key là biến API_KEY trên Railway).');
  if (!j || !j.status) return tgSend(chatId, '❌ Link này không phải máy tải (http ' + ma + '). Kiểm tra lại link.');
  P.setProperty('COBALT_URL', goc); if (key) P.setProperty('COBALT_KEY', key); else P.deleteProperty('COBALT_KEY');
  try{ var hh = JSON.parse(UrlFetchApp.fetch(goc + '/', {muteHttpExceptions:true}).getContentText()); if (hh.name) tt = '\nMáy: ' + hh.name + (hh.yt_dlp ? ' · yt-dlp ' + hh.yt_dlp : '') + (hh.ffmpeg === false ? ' · ⚠️ thiếu ffmpeg (không ghép được 1080p, không ra mp3)' : ''); }catch(e){}
  return tgSend(chatId, '✅ Đã lưu máy tải riêng: `' + goc + '`' + tt + '\nThử: mở tab Tải video, dán link YouTube / Facebook / Instagram.');
}

function tvNen(url){
  return /tiktok\.com/i.test(url) ? 'tiktok' : /douyin\.com|iesdouyin\.com/i.test(url) ? 'douyin'
    : /(^|\.|\/)(x|twitter)\.com\//i.test(url) ? 'x' : /youtu\.?be/i.test(url) ? 'youtube'
    : /instagram\.com/i.test(url) ? 'instagram' : /facebook\.com|fb\.watch|fb\.com/i.test(url) ? 'facebook'
    : /threads\.(net|com)/i.test(url) ? 'threads' : /pinterest\.|pin\.it/i.test(url) ? 'pinterest'
    : /reddit\.com|redd\.it/i.test(url) ? 'reddit' : 'khac';
}

function tvTikwm(url){
  var duong = [
    {url:'https://www.tikwm.com/api/', opt:{method:'post', payload:{url:url, hd:'1'}}},
    {url:'https://www.tikwm.com/api/?hd=1&url=' + encodeURIComponent(url), opt:{method:'get'}}
  ];
  for (var i = 0; i < duong.length; i++){
    try{
      var o = {muteHttpExceptions:true, followRedirects:true, method:duong[i].opt.method, headers:{'Accept':'application/json'}};
      if (duong[i].opt.payload) o.payload = duong[i].opt.payload;
      var r = UrlFetchApp.fetch(duong[i].url, o);
      if (r.getResponseCode() !== 200) continue;
      var j = JSON.parse(r.getContentText());
      if (j && j.code === 0 && j.data) return j.data;
      if (j && /limit|1 request/i.test(String(j.msg || ''))) Utilities.sleep(1200);
    }catch(e){}
  }
  return null;
}

function tvFx(url){
  var m = String(url).match(/status(?:es)?\/(\d+)/i);
  if (!m) return null;
  try{
    var r = UrlFetchApp.fetch('https://api.fxtwitter.com/status/' + m[1], {muteHttpExceptions:true, headers:{'User-Agent':TV_UA}});
    if (r.getResponseCode() !== 200) return null;
    var j = JSON.parse(r.getContentText());
    return j && j.tweet ? j.tweet : null;
  }catch(e){ return null; }
}

/* cobalt API v10+: POST / {url, ...} → status tunnel|redirect {url, filename} · picker {picker:[{type,url,thumb}], audio} */
function tvCobalt(url){
  var goc = String(cfgProp('COBALT_URL') || '').trim().replace(/\/+$/, '');
  if (!goc) return null;
  var key = String(cfgProp('COBALT_KEY') || '').trim();
  var h = {'Accept':'application/json'};
  if (key) h['Authorization'] = 'Api-Key ' + key;
  function hoi(them){
    var body = {url:url, videoQuality:'1080', filenameStyle:'basic'};
    for (var k in them) body[k] = them[k];
    var r = UrlFetchApp.fetch(goc + '/', {method:'post', contentType:'application/json', payload:JSON.stringify(body), headers:h, muteHttpExceptions:true});
    try{ return JSON.parse(r.getContentText()); }catch(e){ return {status:'error', error:{code:'http ' + r.getResponseCode()}}; }
  }
  try{
    var j = hoi({}), items = [];
    if (Array.isArray(j.items) && j.items.length){   // máy tải riêng (may-tai) trả sẵn nhiều bản: 1080p, 360p, mp3, ảnh bìa
      j.items.slice(0, 8).forEach(function(it){ if (it && it.url) items.push({loai: it.loai || 'video', url: String(it.url), ten: it.ten || '', nhan: it.nhan || 'File'}); });
      return {ok:true, nen:tvNen(url), nguon:'may_tai', tieu_de: String(j.title || '').slice(0, 200), tac_gia: String(j.author || '').slice(0, 80), items:items};
    }
    if (j.status === 'tunnel' || j.status === 'redirect'){
      items.push({loai: /\.(mp3|m4a|ogg|opus|wav)$/i.test(j.filename || '') ? 'am_thanh' : /\.(jpe?g|png|webp|gif)$/i.test(j.filename || '') ? 'anh' : 'video', url:j.url, ten:j.filename || '', nhan:'File gốc'});
      var a = hoi({downloadMode:'audio', audioFormat:'mp3'});   // thêm bản chỉ tiếng
      if (a && (a.status === 'tunnel' || a.status === 'redirect')) items.push({loai:'am_thanh', url:a.url, ten:a.filename || '', nhan:'Chỉ âm thanh (mp3)'});
    } else if (j.status === 'picker'){
      (j.picker || []).forEach(function(p, i){ items.push({loai: p.type === 'photo' ? 'anh' : 'video', url:p.url, thumb:p.thumb || '', nhan:(p.type === 'photo' ? 'Ảnh ' : 'Video ') + (i + 1)}); });
      if (j.audio) items.push({loai:'am_thanh', url:j.audio, ten:j.audioFilename || '', nhan:'Nhạc nền'});
    } else return {ok:false, loi:'cobalt: ' + ((j.error || {}).code || j.status || 'loi')};
    return {ok:true, nen:tvNen(url), nguon:'cobalt', items:items};
  }catch(e){ return {ok:false, loi:'cobalt nga: ' + String(e).slice(0, 120)}; }
}

/* Đọc thẻ meta của trang. UA facebookexternalhit giúp nhiều trang trả sẵn og:video thay vì trang bắt đăng nhập. */
function tvOg(url){
  var html = '', uas = ['facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', TV_UA];
  for (var i = 0; i < uas.length && !/og:(video|image)/i.test(html); i++){
    try{
      var r = UrlFetchApp.fetch(url, {muteHttpExceptions:true, followRedirects:true, headers:{'User-Agent':uas[i], 'Accept-Language':'vi,en;q=0.8'}});
      if (r.getResponseCode() === 200) html = r.getContentText().slice(0, 2000000);
    }catch(e){}
  }
  if (!html) return null;
  function meta(ten){
    var out = [], re = new RegExp('<meta[^>]+(?:property|name)=["\']' + ten.replace(/[.:]/g, '\\$&') + '["\'][^>]*>', 'ig'), m;
    while ((m = re.exec(html))){ var c = m[0].match(/content=["']([^"']+)["']/i); if (c) out.push(tvGiaiMa(c[1])); }
    var re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + ten.replace(/[.:]/g, '\\$&') + '["\']', 'ig');
    while ((m = re2.exec(html))) out.push(tvGiaiMa(m[1]));
    return out;
  }
  var items = [], da = {};
  function them(loai, u, nhan){
    if (!u || !/^https?:\/\//i.test(u) || da[u]) return;
    da[u] = 1; items.push({loai:loai, url:u, nhan:nhan});
  }
  meta('og:video:secure_url').concat(meta('og:video:url'), meta('og:video'), meta('twitter:player:stream')).forEach(function(u){ if (!/\.(swf)(\?|$)/i.test(u) && !/\/embed\//i.test(u)) them('video', u, 'Video'); });
  (html.match(/"contentUrl"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/ig) || []).forEach(function(s){ them('video', tvGiaiMa(s.replace(/^"contentUrl"\s*:\s*"/i, '').replace(/"$/, '')), 'Video'); });
  meta('og:audio').concat(meta('og:audio:secure_url')).forEach(function(u){ them('am_thanh', u, 'Âm thanh'); });
  meta('og:image').concat(meta('og:image:secure_url'), meta('twitter:image')).forEach(function(u){
    them('anh', u.replace(/i\.pinimg\.com\/\d+x\//, 'i.pinimg.com/originals/'), 'Ảnh');   // Pinterest: lấy ảnh gốc thay vì bản 736px
  });
  var t = meta('og:title')[0] || ((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '');
  return {items:items.slice(0, 30), tieu_de:tvGiaiMa(t).slice(0, 300), tac_gia:(meta('og:site_name')[0] || '').slice(0, 80)};
}
function tvGiaiMa(s){
  return String(s || '').replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/* Tải hộ một file khi trình duyệt bị chặn CORS: trả base64 để trang tự lưu thành file. */
function tvTaiHo(url){
  try{
    var r = UrlFetchApp.fetch(url, {muteHttpExceptions:true, followRedirects:true, headers:{'User-Agent':TV_UA, 'Referer': /tiktok|tikwm/i.test(url) ? 'https://www.tiktok.com/' : ''}});
    if (r.getResponseCode() !== 200) return jsonOut({ok:false, error:'khong_tai_duoc', loi:'http ' + r.getResponseCode()});
    var blob = r.getBlob(), ct = String(blob.getContentType() || 'application/octet-stream').split(';')[0];
    if (!/^(video|image|audio)\/|octet-stream/i.test(ct)) return jsonOut({ok:false, error:'khong_phai_media', loi:ct});
    var bytes = blob.getBytes();
    if (bytes.length > TV_FILE_TOI_DA) return jsonOut({ok:false, error:'file_qua_lon', size:bytes.length});
    return jsonOut({ok:true, mime:ct, size:bytes.length, b64:Utilities.base64Encode(bytes)});
  }catch(err){ return jsonOut({ok:false, error:'khong_tai_duoc', loi:String(err).slice(0, 160)}); }
}
