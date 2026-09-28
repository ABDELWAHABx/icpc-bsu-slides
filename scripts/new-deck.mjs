#!/usr/bin/env node
/* Create a deck folder from templates.
 *
 *   node new-deck.mjs <deck-dir> --slides title,agenda,section,content,code,problem,closing
 *   node new-deck.mjs <deck-dir> --from-example graph-theory     (copy the full worked example)
 *   node new-deck.mjs --list                                     (show slide + element templates)
 *
 * Result:
 *   <deck>/kit/        brand CSS/JS (do not edit)
 *   <deck>/slides/     01-title.html, 02-agenda.html, …  ← edit these
 *   <deck>/assets/     put images here, reference as ../assets/file.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { SKILL, TEMPLATES, parseArgs, copyDir, templateList } from './lib.mjs';

const { opt, pos } = parseArgs(process.argv.slice(2));

if (opt.list) {
  for (const kind of ['slides', 'elements']) {
    console.log(`\n${kind.toUpperCase()} (templates/${kind}/)`);
    for (const t of templateList(kind)) console.log(`  ${t.name.padEnd(16)} ${t.about}`);
  }
  process.exit(0);
}

const deck = pos[0] && path.resolve(pos[0]);
if (!deck) { console.error('usage: node new-deck.mjs <deck-dir> --slides title,content,closing   |   --list'); process.exit(1); }
if (fs.existsSync(path.join(deck, 'slides')) && fs.readdirSync(path.join(deck, 'slides')).length && !opt.force) {
  console.error(`✗ ${deck}/slides already has files. Use add-slide.mjs, or --force to overwrite.`); process.exit(1);
}

if (opt['from-example']) {
  copyDir(path.join(SKILL, 'examples', opt['from-example']), deck);
} else {
  const names = String(opt.slides || 'title,content,closing').split(',').map(s => s.trim()).filter(Boolean);
  fs.mkdirSync(path.join(deck, 'slides'), { recursive: true });
  names.forEach((n, i) => {
    const src = path.join(TEMPLATES, 'slides', n + '.html');
    if (!fs.existsSync(src)) { console.error(`✗ unknown slide template "${n}". Run with --list.`); process.exit(1); }
    fs.copyFileSync(src, path.join(deck, 'slides', `${String(i + 1).padStart(2, '0')}-${n}.html`));
  });
}
copyDir(path.join(TEMPLATES, 'kit'), path.join(deck, 'kit'));
fs.mkdirSync(path.join(deck, 'assets'), { recursive: true });

console.log(`✓ deck ready: ${deck}`);
for (const f of fs.readdirSync(path.join(deck, 'slides')).sort()) console.log('  slides/' + f);
console.log('Next: edit the slides, then  node build.mjs "' + deck + '"');

