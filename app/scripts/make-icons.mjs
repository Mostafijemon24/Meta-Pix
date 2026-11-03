// Renders public/icon.svg to the PNG sizes the web manifest needs.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // pre-installed globally
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const shots = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-512-maskable.png', 512, true],
];
for (const [file, size, maskable] of shots) {
  await page.setViewportSize({ width: size, height: size });
  // Maskable: full-bleed background, logo inside the 80% safe zone.
  const inner = maskable
    ? `<div style="width:100%;height:100%;background:linear-gradient(135deg,#635BFF,#8B5CF6);display:flex;align-items:center;justify-content:center"><div style="width:62%;height:62%">${svg.replace('<rect', '<rect fill-opacity="0"')}</div></div>`
    : svg;
  await page.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${inner}</div></body></html>`);
  await page.addStyleTag({ content: 'svg{width:100%;height:100%;display:block}' });
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
console.log('icons written');
