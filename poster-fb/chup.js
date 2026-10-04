/* Chụp giao diện Viral Studio để ghép poster Facebook.
   Chạy từ gốc repo:  NODE_PATH=$(npm root -g) node poster-fb/chup.js
   Cần Playwright (npm i -g playwright) và Chromium của nó.
   Tool chạy ở chế độ demo (#demo, #demo-pro) nên không gọi Apps Script, không tốn lượt AI.
   Tải video và dựng video dùng dữ liệu mẫu trong poster-fb/mau (ảnh bìa, 3 cảnh webm),
   link tikwm được giả lập ngay trong trình duyệt nên không tải gì từ TikTok thật.
   Máy không vào được Google Fonts: đặt KHONG_FONT_MANG=1 và cài sẵn Be Vietnam Pro, Bricolage Grotesque. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const GOC = path.resolve(__dirname, '..'), RA = path.join(__dirname, 'anh'), MAU = path.join(__dirname, 'mau');
const CONG = 8765;
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.json': 'application/json', '.css': 'text/css' };
const AN = '.tl-fab{display:none!important} *{caret-color:transparent!important;scroll-behavior:auto!important}';

function moMayChu() {
  return http.createServer((req, res) => {
    const p = path.join(GOC, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
    if (!p.startsWith(GOC) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': LOAI[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  }).listen(CONG);
}

async function taoNgCanh(b, w, h, dpr) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: 'light', locale: 'vi-VN' });
  if (process.env.KHONG_FONT_MANG) await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await c.route(/script\.google(usercontent)?\.com/, r => r.abort());   // không bao giờ gọi máy chủ thật
  return c;
}
async function mo(c, trang) {
  const pg = await c.newPage();
  pg.on('pageerror', e => console.log(trang, 'lỗi trang:', e.message));
  await pg.goto(`http://localhost:${CONG}/tools/${trang}`, { waitUntil: 'load' });
  await pg.addStyleTag({ content: AN }); await pg.waitForTimeout(900);
  return pg;
}
const nghi = (pg, ms) => pg.waitForTimeout(ms);
async function chup(pg, ten) { await pg.screenshot({ path: path.join(RA, ten + '.jpg'), type: 'jpeg', quality: 90 }); console.log('✓', ten); }
async function chupKhoi(pg, sel, ten, dem = 6) {
  const l = pg.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await nghi(pg, 200);
  const r = await l.boundingBox(), w = pg.viewportSize().width;
  await pg.screenshot({ path: path.join(RA, ten + '.jpg'), type: 'jpeg', quality: 92, fullPage: true,
    clip: { x: Math.max(0, r.x - dem), y: r.y + await pg.evaluate(() => scrollY) - dem, width: Math.min(w, r.width + dem * 2), height: r.height + dem * 2 } });
  console.log('✓', ten);
}
async function cuonToi(pg, sel, lech = 0) {
  await pg.evaluate(([s, d]) => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - d); }, [sel, lech]);
  await nghi(pg, 300);
}

async function taiVideo(c) {
  const bia = fs.readFileSync(path.join(MAU, 'bia.jpg'));
  await c.route(/tikwm\.com\/api/, r => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: 0, data: {
    id: '7412345678901234567', title: '3 lỗi khiến video của bạn bị lướt ngay giây đầu #xaykenh #tiktoktips', duration: 47,
    play_count: 128400, digg_count: 9620, comment_count: 412, share_count: 1530, author: { nickname: 'Kênh Mẫu', unique_id: 'kenhmau' },
    cover: 'https://www.tikwm.com/bia.jpg', origin_cover: 'https://www.tikwm.com/bia.jpg',
    hdplay: 'https://www.tikwm.com/v-hd.mp4', hd_size: 18234567, play: 'https://www.tikwm.com/v.mp4', size: 12345678,
    wmplay: 'https://www.tikwm.com/v-wm.mp4', wm_size: 13345678, music: 'https://www.tikwm.com/m.mp3', music_info: { title: 'âm thanh gốc', author: 'Kênh Mẫu' } } }) }));
  await c.route(/tikwm\.com\/bia\.jpg/, r => r.fulfill({ contentType: 'image/jpeg', body: bia }));
  const pg = await mo(c, 'tai-ve.html');
  await pg.fill('#link', 'https://vt.tiktok.com/ZSkXy7a9b/'); await chup(pg, 'tai-1');
  await pg.click('#btnLay'); await nghi(pg, 2500);
  await cuonToi(pg, '#st', 90); await chup(pg, 'tai-2');
  await cuonToi(pg, '#kq .grp', 10); await chup(pg, 'tai-3');
  await pg.close();
}

async function soiVideo(c) {
  const pg = await mo(c, 'soi-video.html#demo');
  await pg.screenshot({ path: path.join(RA, 'luoi.jpg'), type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 390, height: 300 } });
  await pg.fill('#link', 'https://www.tiktok.com/@kenhmau/video/7412345678901234567'); await pg.click('#btnLink'); await nghi(pg, 1500);
  await cuonToi(pg, 'main section, .card', 12); await chup(pg, 'soi-1');
  await pg.click('#btnSoi'); await nghi(pg, 2600);
  await cuonToi(pg, '#kq', 10); await chup(pg, 'soi-2');
  await cuonToi(pg, '#kqBody .door', 10); await chup(pg, 'soi-3');
  await chupKhoi(pg, '#kqBody .door >> nth=1', 'soi-cua2');
  await chupKhoi(pg, '#kqBody .door >> nth=2', 'soi-cua3');
  await pg.close();
}

async function hookViral(c) {
  const pg = await mo(c, 'hook-text.html#demo-pro');
  await chup(pg, 'hook-1');
  await pg.evaluate(() => scrollTo(0, 360)); await nghi(pg, 300); await chup(pg, 'hook-2');
  await pg.evaluate(() => scrollTo(0, 0));
  await pg.click('#btnAI'); await nghi(pg, 2600); await chup(pg, 'hook-3');
  await pg.close();
}

async function kichBan(c) {
  const pg = await mo(c, 'kich-ban.html#demo');
  const loi = ['Mẹ chồng mình chưa từng nói câu này với mẹ đẻ mình.', 'Hôm đó mẹ mình lên chơi, cả nhà ăn cơm chung lần đầu sau Tết.',
    'Mẹ chồng gắp con tôm to nhất, bóc vỏ rồi để vào bát mẹ mình. Hai bà không nói gì, chỉ cười.',
    'Mình ngồi đó nhai cơm mà mắt cay xè, sợ ai nhìn thấy.', 'Mình chỉ mong hai bà khoẻ, để còn nhiều bữa cơm như vậy.', 'Bạn có từng thấy cảnh này chưa? Kể mình nghe với.'];
  const o = await pg.$$('textarea[data-k]');
  for (let i = 0; i < o.length; i++) { await o[i].fill(loi[i % loi.length]); await o[i].dispatchEvent('input'); }
  await cuonToi(pg, 'section.card:nth-of-type(2)', 12); await chup(pg, 'kb-1');
  await cuonToi(pg, 'textarea[data-k]', 150); await chup(pg, 'kb-2');
  await pg.click('#btnCham'); await nghi(pg, 2600);
  await cuonToi(pg, '#kq', 10); await chup(pg, 'kb-3');
  await pg.close();
}

async function dungVideo(b) {
  const c = await taoNgCanh(b, 1440, 900, 2);
  const pg = await mo(c, 'dung-video.html');
  await pg.setInputFiles('#fileIn', ['canh1.webm', 'canh2.webm', 'canh3.webm'].map(f => path.join(MAU, f)));
  await nghi(pg, 3500);
  const n = await pg.locator('button.hhThem').count();
  for (let i = 0; i < n; i++) await pg.locator('button.hhThem').nth(i).click({ force: true });
  await nghi(pg, 1500); await chup(pg, 'dung-1');
  await pg.click('button[data-tab="chu"]'); await nghi(pg, 800);
  await pg.locator('#mauChu button').nth(2).click(); await nghi(pg, 4500); await chup(pg, 'dung-2');
  await pg.click('button[data-tab="ai"]'); await nghi(pg, 800); await chup(pg, 'dung-3');
  await c.close();
}

async function chamVideo(c) {
  const pg = await mo(c, 'cham-video.html#demo');
  await pg.fill('#link', 'https://www.tiktok.com/@kenhcuaban/video/7412345678901234567'); await pg.click('#btnLink'); await nghi(pg, 1500);
  await cuonToi(pg, 'main section, .card', 12); await chup(pg, 'cv-1');
  await pg.click('#btnCham'); await nghi(pg, 2600);
  await cuonToi(pg, '#kq', 10); await chup(pg, 'cv-2');
  await cuonToi(pg, '#kqBody .map', 60); await chup(pg, 'cv-3');
  await cuonToi(pg, '#kqBody .idea', 120); await chup(pg, 'cv-4');
  await chupKhoi(pg, '#kqBody .thang', 'cv-7thang');
  await pg.close();
}

(async () => {
  fs.mkdirSync(RA, { recursive: true });
  const mc = moMayChu(), b = await chromium.launch();
  try {
    const c = await taoNgCanh(b, 390, 844, 3);
    await taiVideo(c); await soiVideo(c); await hookViral(c); await kichBan(c); await chamVideo(c);
    await c.close();
    await dungVideo(b);
  } finally { await b.close(); mc.close(); }
})().catch(e => { console.error(e); process.exit(1); });
