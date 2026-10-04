/* Xuất từng poster trong poster.html ra PNG 2160×2700 (gấp đôi 1080×1350, Facebook giữ nét chữ).
   Chạy từ gốc repo:  NODE_PATH=$(npm root -g) node poster-fb/xuat.js
   Chỉ xuất một vài poster: thêm id, ví dụ  node poster-fb/xuat.js 02-soi-video 02b-soi-video-cach-dung */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');

const RA = path.join(__dirname, 'xuat');
const chi = process.argv.slice(2);

(async () => {
  fs.mkdirSync(RA, { recursive: true });
  const b = await chromium.launch();
  try {
    const c = await b.newContext({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 2 });
    if (process.env.KHONG_FONT_MANG) await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const pg = await c.newPage();
    await pg.goto('file://' + path.join(__dirname, 'poster.html'), { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const ids = await pg.$$eval('section.poster', ds => ds.map(d => d.id));
    for (const id of ids) {
      if (chi.length && !chi.includes(id)) continue;
      await pg.locator(`[id="${id}"]`).screenshot({ path: path.join(RA, id + '.png') });
      console.log('✓', id);
    }
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
