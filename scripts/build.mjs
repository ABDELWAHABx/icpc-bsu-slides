#!/usr/bin/env node
/* Build a deck folder into PNGs + a PowerPoint file.
 *
 *   node build.mjs <deck-dir> [--out talk.pptx] [--scale 2] [--only 3,5-7] [--force] [--no-pptx]
 *
 *   <deck>/slides/*.html  →  <deck>/png/NN-name.png   (1920×1080 × scale)
 *                         →  <deck>/png/_contact-sheet.png  (all slides, for a quick visual check)
 *                         →  <deck>/<deck-name>.pptx   (16:9, one full-bleed image per slide,
 *                                                       <aside class="notes"> → speaker notes)
 * Page counters "N / M" in the statusbar are renumbered automatically.
 * Overflow / missing-image / JS problems are printed; the PPTX is NOT written while any exist
 * unless you pass --force. Exit code 1 when problems were found.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import pptxgen from 'pptxgenjs';
import { parseArgs, launch, openPage, warningsOf } from './lib.mjs';

const { opt, pos } = parseArgs(process.argv.slice(2));
if (!pos[0]) { console.error('usage: node build.mjs <deck-dir> [--out file.pptx] [--scale 2] [--only 3,5-7] [--force]'); process.exit(1); }
const deck = path.resolve(pos[0]);
const slideDir = path.join(deck, 'slides');
if (!fs.existsSync(slideDir)) { console.error(`✗ no slides/ folder in ${deck}`); process.exit(1); }
const scale = +(opt.scale || 2);
const pngDir = path.join(deck, 'png');
fs.mkdirSync(pngDir, { recursive: true });

const files = fs.readdirSync(slideDir).filter(f => f.endsWith('.html')).sort();
if (!files.length) { console.error('✗ slides/ is empty'); process.exit(1); }
const only = new Set();
String(opt.only || '').split(',').filter(Boolean).forEach(p => { const [a, b] = p.split('-').map(Number); for (let i = a; i <= (b || a); i++) only.add(i); });

const browser = await launch();
const results = [];
let problems = 0;
for (let i = 0; i < files.length; i++) {
  const f = files[i], n = i + 1;
  const png = path.join(pngDir, f.replace(/\.html$/, '.png'));
  let notes = '';
  const html = fs.readFileSync(path.join(slideDir, f), 'utf8');
  const nm = html.match(/<aside class="notes">([\s\S]*?)<\/aside>/);
  if (nm) notes = nm[1].replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim();
  if (only.size && !only.has(n)) { results.push({ f, png, notes }); continue; }

  const { ctx, page, errors } = await openPage(browser, path.join(slideDir, f), { scale });
  await page.evaluate(([n, total]) => {
    document.querySelectorAll('.statusbar .page').forEach(el => {
      if (/^\s*\d+\s*\/\s*\d+\s*$/.test(el.textContent)) el.textContent = `${n} / ${total}`;
    });
  }, [n, files.length]);
  const slide = await page.$('.slide');
  if (!slide) errors.push('no <main class="slide"> found');
  else await slide.screenshot({ path: png });
  const warns = [...errors, ...(await warningsOf(page))];
  warns.forEach(w => console.log(`  ⚠ ${f}: ${w}`));
  problems += warns.length;
  console.log(`${warns.length ? '✗' : '✓'} ${String(n).padStart(2)} ${f}`);
  results.push({ f, png, notes });
  await ctx.close();
}

// contact sheet for quick visual review
const existing = results.filter(r => fs.existsSync(r.png));
if (existing.length) {
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 800 } });
  const page = await ctx.newPage();
  const tmp = path.join(pngDir, '_contact-sheet.html');
  fs.writeFileSync(tmp, `<!DOCTYPE html><body style="margin:0;padding:24px;background:#1C1916;font:600 18px monospace;color:#D4A843;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${existing.map(r => `<div><div style="margin-bottom:6px">${results.indexOf(r) + 1} · ${r.f}</div><img style="width:100%;display:block;border:2px solid #4A423A" src="${encodeURIComponent(path.basename(r.png))}?${Date.now()}"></div>`).join('')}</body>`);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(pngDir, '_contact-sheet.png'), fullPage: true });
  await ctx.close();
  fs.rmSync(tmp);
}
await browser.close();

if (problems && !opt.force) {
  console.log(`\n✗ ${problems} problem(s). Fix them (shorten text / smaller size class / correct image path) and rebuild, or pass --force.`);
  console.log(`  PNGs so far: ${pngDir}`);
  process.exit(1);
}
if (opt['no-pptx']) { console.log(`\n✓ PNGs in ${pngDir}`); process.exit(0); }

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';                      // 13.333 × 7.5 in = 16:9
pptx.author = 'ICPC-FCAI-BSU';
pptx.company = 'ICPC-FCAI-BSU';
pptx.title = opt.title || path.basename(deck);
for (const r of results) {
  const s = pptx.addSlide();
  if (fs.existsSync(r.png)) s.addImage({ path: r.png, x: 0, y: 0, w: 13.333, h: 7.5 });
  if (r.notes) s.addNotes(r.notes);
}
const out = path.resolve(opt.out || path.join(deck, path.basename(deck) + '.pptx'));
await pptx.writeFile({ fileName: out });
console.log(`\n✓ ${results.length} slides → ${out}${problems ? `  (forced with ${problems} problem(s))` : ''}`);
console.log(`  contact sheet: ${path.join(pngDir, '_contact-sheet.png')}`);
