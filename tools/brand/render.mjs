// Renders PWA icons + social image from tools/brand (requires `npm run dev` on :5173 and Playwright).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH || 'playwright');
const out = new URL('../../public/icons/', import.meta.url).pathname;
const base = process.env.BASE || 'http://localhost:5173/tools/brand/index.html';
const jobs = [
  ['og', 1200, 630, 'og.png'],
  ['icon', 192, 192, 'icon-192.png'],
  ['icon', 512, 512, 'icon-512.png'],
  ['maskable', 512, 512, 'icon-maskable-512.png'],
  ['icon', 180, 180, 'apple-touch-icon.png'],
];
const browser = await chromium.launch();
for (const [asset, w, h, file] of jobs) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`${base}?asset=${asset}&size=${w}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + file, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('✓', file);
  await page.close();
}
await browser.close();
