// Shared helpers for the icpc-bsu-slides scripts.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATES = path.join(SKILL, 'templates');

export function parseArgs(argv) {
  const opt = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) opt[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) opt[k] = argv[++i];
      else opt[k] = true;
    } else pos.push(a);
  }
  return { opt, pos };
}

export async function launch() {
  for (const t of [{ channel: 'chrome' }, { channel: 'msedge' }, {}]) {
    try { return await chromium.launch(t); } catch {}
  }
  throw new Error('No Chrome/Edge found. Install Google Chrome, or run: npx playwright install chromium');
}

/** Open an HTML file in export mode and wait until the kit has rendered. */
export async function openPage(browser, file, { width = 1920, height = 1080, scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('JS error: ' + e.message));
  page.on('requestfailed', r => { if (!r.url().includes('fonts.g')) errors.push('missing file: ' + decodeURI(r.url()).replace(/^file:\/\/\/?/, '')); });
  await page.goto(pathToFileURL(file).href + '?export=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__icpcReady === true, null, { timeout: 15000 })
    .catch(() => errors.push('kit/icpc.js did not load (check the ../kit/ path)'));
  await page.waitForTimeout(120);
  return { ctx, page, errors };
}

export const warningsOf = page => page.evaluate(() => window.__icpcWarnings || []);

export function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

export function templateList(kind) {
  const dir = path.join(TEMPLATES, kind);
  return fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort().map(f => {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = html.match(/<!--\s*(?:TEMPLATE|ELEMENT)\s+([\s\S]*?)-->/);
    const first = m ? m[1].split('\n').map(s => s.trim()).filter(Boolean).slice(0, 2).join(' — ') : '';
    return { name: f.replace(/\.html$/, ''), file: path.join(dir, f), about: first };
  });
}
