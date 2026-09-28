#!/usr/bin/env node
/* Render element templates to transparent PNGs (for Canva or for placing into other decks).
 *
 *   node render-elements.mjs <file-or-folder> [...more] [--out png-elements] [--scale 2]
 *
 * Every node with data-export="name" becomes <out>/<file>.png (one export) or <file>--<name>.png.
 * PNGs are @2x by default: PNG width ÷ 2 = natural size on a 1920×1080 slide.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, launch, openPage, warningsOf } from './lib.mjs';

const { opt, pos } = parseArgs(process.argv.slice(2));
if (!pos.length) { console.error('usage: node render-elements.mjs <file-or-folder> [...] [--out dir] [--scale 2]'); process.exit(1); }
const files = pos.flatMap(t => {
  const p = path.resolve(t);
  return fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter(f => f.endsWith('.html')).sort().map(f => path.join(p, f)) : [p];
});
const out = path.resolve(opt.out || 'png-elements');
fs.mkdirSync(out, { recursive: true });
const scale = +(opt.scale || 2);

const browser = await launch();
let total = 0, problems = 0;
for (const file of files) {
  const isSlide = fs.readFileSync(file, 'utf8').includes('class="slide-page"');
  const { ctx, page, errors } = await openPage(browser, file, { width: isSlide ? 1920 : 2400, scale: isSlide ? 1 : scale });
  const nodes = await page.$$('[data-export]');
  const base = path.basename(file, '.html');
  for (const n of nodes) {
    const box = await n.boundingBox();
    if (!box) continue;
    const pad = +((await n.getAttribute('data-pad')) ?? (isSlide ? 0 : 14));
    const name = nodes.length === 1 ? base : `${base}--${await n.getAttribute('data-export')}`;
    await page.screenshot({ path: path.join(out, name + '.png'), omitBackground: true, fullPage: true,
      clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + 2 * pad, height: box.height + 2 * pad } });
    total++;
  }
  const warns = [...errors, ...(await warningsOf(page))];
  warns.forEach(w => console.log(`  ⚠ ${base}: ${w}`));
  problems += warns.length;
  console.log(`${warns.length ? '✗' : '✓'} ${base} → ${nodes.length} png`);
  await ctx.close();
}
await browser.close();
console.log(`\n${total} PNGs in ${out}${problems ? ` · ${problems} problem(s)` : ''}`);
process.exit(problems ? 1 : 0);
