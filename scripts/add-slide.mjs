#!/usr/bin/env node
/* Add one slide from a template to an existing deck.
 *
 *   node add-slide.mjs <deck-dir> <template> [--as bfs-code] [--after 04]
 *
 * Without --after the slide is appended (next number). With --after NN the new slide
 * is inserted after slide NN and the following files are renumbered.
 */
import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATES, parseArgs } from './lib.mjs';

const { opt, pos } = parseArgs(process.argv.slice(2));
const [deckArg, tpl] = pos;
if (!deckArg || !tpl) { console.error('usage: node add-slide.mjs <deck-dir> <template> [--as name] [--after NN]'); process.exit(1); }
const dir = path.join(path.resolve(deckArg), 'slides');
const src = path.join(TEMPLATES, 'slides', tpl + '.html');
if (!fs.existsSync(src)) { console.error(`✗ unknown template "${tpl}" (see: node new-deck.mjs --list)`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });

const files = fs.readdirSync(dir).filter(f => /^\d+-.*\.html$/.test(f)).sort();
const num = f => parseInt(f, 10);
let at = files.length ? num(files[files.length - 1]) + 1 : 1;
if (opt.after !== undefined) {
  at = parseInt(opt.after, 10) + 1;
  for (const f of [...files].reverse()) if (num(f) >= at) {
    fs.renameSync(path.join(dir, f), path.join(dir, f.replace(/^\d+/, String(num(f) + 1).padStart(2, '0'))));
  }
}
const name = `${String(at).padStart(2, '0')}-${opt.as || tpl}.html`;
fs.copyFileSync(src, path.join(dir, name));
console.log(`✓ added slides/${name}`);
