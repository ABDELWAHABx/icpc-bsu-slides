/* ==========================================================================
   ICPC-FCAI-BSU · Slide Kit runtime
   - ?export=1 → transparent background, no scaling (used by export.mjs)
   - Renders: .ide code blocks, .terminal, .arr, .gridviz, .graph, .diamonds,
     <icpc-mascot>, <icpc-logo>
   - Reports overflow in window.__icpcWarnings and sets window.__icpcReady
   ========================================================================== */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const EXPORTING = params.has('export');
  if (EXPORTING) document.documentElement.classList.add('exporting');

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const q = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function dedent(text) {
    const lines = text.replace(/\r/g, '').replace(/\t/g, '    ').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const ind = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    return lines.map(l => l.slice(isFinite(ind) ? ind : 0));
  }

  function parseRanges(str) {
    const set = new Set();
    (str || '').split(',').map(s => s.trim()).filter(Boolean).forEach(p => {
      const [a, b] = p.split('-').map(Number);
      for (let i = a; i <= (b || a); i++) set.add(i);
    });
    return set;
  }

  /* ---------------- Syntax highlighting ---------------- */
  const LANGS = {
    cpp: {
      kw: 'if else for while do return break continue switch case default goto new delete this true false nullptr const constexpr static inline struct class public private protected template typename using namespace operator sizeof auto virtual friend enum union typedef mutable explicit noexcept throw try catch and or not',
      typ: 'int long short char bool double float unsigned signed void size_t string vector pair map set unordered_map unordered_set multiset multimap priority_queue queue stack deque array bitset tuple greater less pii pll ll ull ld vi vll vvi std int64_t uint64_t int32_t',
      re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(#[ \t]*include)([ \t]*<[^>\n]*>)?|(#[ \t]*[a-z]+)|(\b(?:0x[\da-fA-F]+|\d[\d']*(?:\.\d+)?(?:e[+-]?\d+)?)(?:ull|ULL|ll|LL|u|U|f|F|l|L)?\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_0-9])/g
    },
    py: {
      kw: 'def return if elif else for while in not and or is None True False import from as class with try except finally raise lambda yield pass break continue global nonlocal assert del async await',
      typ: 'int str list dict set tuple float bool bytes object deque heapq defaultdict Counter',
      re: /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\u0000)(\u0000)?|(\u0000)|(\b(?:0x[\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_0-9])/g
    }
  };
  LANGS.c = LANGS.cpp; LANGS.python = LANGS.py; LANGS['c++'] = LANGS.cpp;
  for (const k in LANGS) { if (typeof LANGS[k].kw === 'string') { LANGS[k].kw = new Set(LANGS[k].kw.split(' ')); LANGS[k].typ = new Set(LANGS[k].typ.split(' ')); } }

  function tokenize(code, lang) {
    const L = LANGS[lang];
    if (!L) return [{ c: '', t: code }];
    const out = [];
    const re = new RegExp(L.re.source, 'g');
    let m;
    while ((m = re.exec(code))) {
      if (m[1]) out.push({ c: 'cmt', t: m[1] });
      else if (m[2]) out.push({ c: 'str', t: m[2] });
      else if (m[3]) { out.push({ c: 'pre', t: m[3] }); if (m[4]) out.push({ c: 'str', t: m[4] }); }
      else if (m[5]) out.push({ c: 'pre', t: m[5] });
      else if (m[6]) out.push({ c: 'num', t: m[6] });
      else if (m[7]) {
        const w = m[7];
        let c = '';
        if (L.kw.has(w)) c = 'kw';
        else if (/^\s*\(/.test(code.slice(re.lastIndex))) c = 'fn';
        else if (L.typ.has(w)) c = 'typ';
        else if (/^[A-Z][A-Z0-9_]+$/.test(w)) c = 'const';
        out.push({ c, t: w });
      }
      else if (m[8]) out.push({ c: '', t: m[8] });
      else if (m[9]) out.push({ c: 'op', t: m[9] });
    }
    return out;
  }

  function toLines(tokens) {
    const lines = [[]];
    tokens.forEach(tk => {
      tk.t.split('\n').forEach((part, i) => {
        if (i > 0) lines.push([]);
        if (part) lines[lines.length - 1].push({ c: tk.c, t: part });
      });
    });
    return lines;
  }

  function renderIde(el) {
    const src = el.querySelector('script[type="text/x-code"]');
    if (!src) return;
    const lang = (el.dataset.lang || 'cpp').toLowerCase();
    const lines = toLines(tokenize(dedent(src.textContent).join('\n'), lang));
    const start = +(el.dataset.start || 1);
    const sets = { hl: parseRanges(el.dataset.highlight), add: parseRanges(el.dataset.add), del: parseRanges(el.dataset.del), dim: parseRanges(el.dataset.dim) };
    const marks = {};
    (el.dataset.mark || '').split(',').filter(Boolean).forEach(p => { const i = p.indexOf(':'); marks[+p.slice(0, i)] = p.slice(i + 1).trim(); });

    const body = lines.map((toks, i) => {
      const n = start + i;
      const cls = ['line'];
      for (const k in sets) if (sets[k].has(n)) cls.push(k);
      let marked = false;
      const html = toks.map(tk => {
        let c = tk.c ? 'tk-' + tk.c : '';
        if (!marked && marks[n] && tk.t === marks[n]) { c += ' tk-mark'; marked = true; }
        return c ? `<span class="${c.trim()}">${esc(tk.t)}</span>` : esc(tk.t);
      }).join('');
      return `<span class="${cls.join(' ')}"><span class="gutter">${n}</span><span class="src">${html || ' '}</span></span>`;
    }).join('');

    const file = el.dataset.file;
    const bar = el.dataset.bar === 'none' ? '' :
      `<div class="ide-bar"><i></i><i></i><i></i>${file ? `<span class="file">${esc(file)}</span>` : ''}<span class="lang">${esc(el.dataset.langLabel || (lang === 'py' ? 'python' : lang === 'cpp' ? 'c++' : lang))}</span></div>`;
    src.remove();
    el.insertAdjacentHTML('afterbegin', bar + `<div class="ide-code">${body}</div>`);
  }

  /* ---------------- Terminal ---------------- */
  const VERDICT_RE = /(Accepted|\bAC\b|✓|\bOK\b)|(Wrong Answer(?: on test \d+)?|\bWA\b|✗)|((?:Time|Memory) Limit Exceeded(?: on test \d+)?|\bTLE\b|\bMLE\b)|(Runtime Error(?: on test \d+)?|\bRE\b)|(Compilation Error|\bCE\b)|(\{cursor\})/g;
  function termColor(text) {
    return esc(text).replace(VERDICT_RE, (m, ac, wa, tle, re, ce, cur) =>
      cur ? '<span class="term-cursor"></span>' :
      `<span class="term-${ac ? 'ac' : wa ? 'wa' : tle ? 'tle' : re ? 're' : 'ce'}">${m}</span>`);
  }
  function renderTerminal(el) {
    const src = el.querySelector('script[type="text/x-term"]');
    if (!src) return;
    const prompt = el.dataset.prompt || 'icpc@bsu:~$';
    const html = dedent(src.textContent).map(line => {
      if (/^\$ ?/.test(line)) return `<span class="term-prompt">${esc(prompt)}</span> ${termColor(line.replace(/^\$ ?/, ''))}`;
      if (/^\s*(#|\/\/)/.test(line)) return `<span class="term-cmt">${esc(line)}</span>`;
      return termColor(line);
    }).join('\n');
    const title = el.dataset.title;
    src.remove();
    el.insertAdjacentHTML('afterbegin',
      (el.dataset.bar === 'none' ? '' : `<div class="ide-bar"><i></i><i></i><i></i><span class="file">${esc(title || 'bash')}</span><span class="lang">term</span></div>`) +
      `<div class="term-body">${html}</div>`);
  }

  /* ---------------- Array ---------------- */
  function renderArray(el) {
    const vals = (el.dataset.values || '').split(',').map(s => s.trim());
    const tops = (el.dataset.labels || '').split(',').map(s => s.trim());
    const start = +(el.dataset.startIndex || 0);
    const sets = {};
    ['hl', 'act', 'done', 'dim'].forEach(k => sets[k] = parseRanges(el.dataset[k]));
    const ptr = {};
    (el.dataset.ptr || '').split(',').filter(Boolean).forEach(p => { const [i, l] = p.split(':'); ptr[+i] = (ptr[+i] ? ptr[+i] + ' ' : '') + l; });
    if (el.dataset.cell) el.style.setProperty('--cw', el.dataset.cell + 'px');
    const cells = vals.map((v, i) => {
      const idx = start + i;
      const cls = ['cell'].concat(Object.keys(sets).filter(k => sets[k].has(idx)));
      return `<div class="${cls.join(' ')}"><div class="top">${esc(tops[i] || '')}</div><div class="box">${esc(v)}</div>` +
        (el.dataset.noIndex !== undefined ? '' : `<div class="idx">${idx}</div>`) +
        (ptr[idx] ? `<div class="ptr">${esc(ptr[idx])}</div>` : '') + `</div>`;
    }).join('');
    el.innerHTML = (el.dataset.name ? `<div class="arr-name">${esc(el.dataset.name)}</div>` : '') + `<div class="cells">${cells}</div>`;
  }

  /* ---------------- Grid / DP table ---------------- */
  function renderGrid(el) {
    const src = el.querySelector('script[type="application/json"]');
    if (!src) return;
    const d = JSON.parse(src.textContent);
    let h = `<table class="gridviz"><thead><tr>${d.corner !== undefined ? `<th class="rowh">${esc(d.corner)}</th>` : ''}${d.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`;
    d.rows.forEach(r => {
      h += `<tr>${r.h !== undefined ? `<th class="rowh">${esc(r.h)}</th>` : ''}`;
      r.cells.forEach(c => {
        const o = typeof c === 'object' && c !== null ? c : { v: c };
        h += `<td class="${esc(o.c || '')}">${esc(o.v)}</td>`;
      });
      h += '</tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  /* ---------------- Graph ---------------- */
  const NODE = {
    default: ['#FFF8F0', '#2D2D2D'], source: ['#5B8DB8', '#FFF8F0'], target: ['#C45C5C', '#FFF8F0'],
    visited: ['#D4A843', '#1A1A1A'], done: ['#D2E9D8', '#1F7A45'], active: ['#FFF8F0', '#2D2D2D'], dim: ['#EDE3D3', '#B8A88A']
  };
  function renderGraph(el) {
    const src = el.querySelector('script[type="application/json"]');
    if (!src) return;
    const d = JSON.parse(src.textContent);
    const W = d.width || 800, H = d.height || 560, R = d.r || 40;
    const byId = {};
    d.nodes.forEach(n => byId[n.id] = n);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>${['#B8A88A', '#C45C5C', '#D4C5A9'].map((c, i) => `<marker id="ah${i}-${el.__gid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>`;
    const labels = [];
    (d.edges || []).forEach(e => {
      const a = byId[e.a], b = byId[e.b];
      if (!a || !b) return;
      const st = e.style || 'default';
      const col = st === 'path' ? '#C45C5C' : st === 'dim' ? '#D4C5A9' : '#B8A88A';
      const mi = st === 'path' ? 1 : st === 'dim' ? 2 : 0;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const pad = d.directed ? R + 8 : R;
      const x1 = a.x + ux * R, y1 = a.y + uy * R, x2 = b.x - ux * pad, y2 = b.y - uy * pad;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${st === 'path' ? 9 : 6}" stroke-linecap="round"${st === 'dim' ? ' stroke-dasharray="4 14"' : ''}${d.directed ? ` marker-end="url(#ah${mi}-${el.__gid})"` : ''}/>`;
      if (e.w !== undefined && e.w !== '') {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const w = String(e.w), bw = 22 + w.length * 17;
        labels.push(`<g><rect x="${mx - bw / 2}" y="${my - 21}" width="${bw}" height="42" rx="10" fill="${st === 'path' ? '#C45C5C' : '#FFF8F0'}" stroke="#1A1A1A" stroke-width="3"/><text x="${mx}" y="${my + 9}" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="${st === 'path' ? '#FFF8F0' : '#2D2D2D'}">${esc(w)}</text></g>`);
      }
    });
    s += labels.join('');
    d.nodes.forEach(n => {
      const [bg, fg] = NODE[n.style || 'default'] || NODE.default;
      s += `<circle cx="${n.x + 5}" cy="${n.y + 5}" r="${R}" fill="#1A1A1A"/>`;
      s += `<circle cx="${n.x}" cy="${n.y}" r="${R}" fill="${bg}" stroke="#1A1A1A" stroke-width="5"/>`;
      if (n.style === 'active') s += `<circle cx="${n.x}" cy="${n.y}" r="${R + 12}" fill="none" stroke="#D4A843" stroke-width="5" stroke-dasharray="10 8"/>`;
      s += `<text x="${n.x}" y="${n.y + 11}" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="32" fill="${fg}">${esc(n.label ?? n.id)}</text>`;
      if (n.note) {
        const nw = 20 + String(n.note).length * 14;
        const ny = n.y + R + (n.noteAbove ? -2 * R - 46 : 12);
        s += `<rect x="${n.x - nw / 2}" y="${ny}" width="${nw}" height="34" rx="8" fill="#1E1E2E"/><text x="${n.x}" y="${ny + 24}" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="21" fill="#E5C07B">${esc(n.note)}</text>`;
      }
    });
    s += '</svg>';
    el.innerHTML = s + (d.caption ? `<div class="hand" style="font-size:36px;color:var(--muted);text-align:center;margin-top:10px">${esc(d.caption)}</div>` : '');
  }

  /* ---------------- Mascot ---------------- */
  const C = { frame: '#1A1A1A', paper: '#FFF8F0', crimson: '#C45C5C', gold: '#D4A843', blue: '#5B8DB8', tan: '#D4C5A9', ink: '#A43F3F' };
  const eye = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="10" fill="${C.frame}"/><circle cx="${x + 3}" cy="${y - 4}" r="3" fill="#fff"/>`;
  const hand = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="${C.paper}" stroke="${C.frame}" stroke-width="4"/>`;
  const arm = (d, hx, hy) => `<path d="${d}" fill="none" stroke="${C.frame}" stroke-width="6" stroke-linecap="round"/>` + hand(hx, hy);
  const ARMS = {
    downL: arm('M35 140 Q18 152 16 174', 16, 176), downR: arm('M165 140 Q182 152 184 174', 184, 176),
    upL: arm('M35 132 Q14 118 12 92', 12, 88), upR: arm('M165 132 Q186 118 188 92', 188, 88),
    chinR: arm('M165 148 Q160 176 128 156', 126, 154),
    lensR: arm('M165 142 Q182 146 188 132', 188, 130)
  };
  const cheeks = `<ellipse cx="62" cy="128" rx="11" ry="6" fill="${C.crimson}" opacity=".4"/><ellipse cx="138" cy="128" rx="11" ry="6" fill="${C.crimson}" opacity=".4"/>`;
  const drop = (x, y) => `<path d="M${x} ${y} q-9 14 0 20 q9 -6 0 -20z" fill="#9CC3E6" stroke="${C.frame}" stroke-width="3"/>`;
  const star = (x, y, r) => `<path d="M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y} L${x + r * .3} ${y + r * .3} L${x} ${y + r} L${x - r * .3} ${y + r * .3} L${x - r} ${y} L${x - r * .3} ${y - r * .3}Z" fill="${C.gold}" stroke="${C.frame}" stroke-width="3" stroke-linejoin="round"/>`;
  const badge = (txt, fill, fg) => `<rect x="${100 - (txt.length * 10 + 18)}" y="164" width="${txt.length * 20 + 36}" height="34" rx="7" fill="${fill}" stroke="${C.frame}" stroke-width="4"/><text x="100" y="189" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="22" fill="${fg}">${txt}</text>`;
  const belly = `<text x="100" y="190" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="28" fill="${C.crimson}">&lt;/&gt;</text>`;
  const smile = `<path d="M86 130 Q100 146 114 130" fill="none" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/>`;
  const openSmile = `<path d="M84 128 Q100 154 116 128 Z" fill="${C.ink}" stroke="${C.frame}" stroke-width="4.5" stroke-linejoin="round"/>`;
  const happyEyes = `<path d="M69 112 Q78 98 87 112 M113 112 Q122 98 131 112" fill="none" stroke="${C.frame}" stroke-width="5.5" stroke-linecap="round"/>`;

  const MOODS = {
    focused: () => `<path d="M64 88 L88 94 M136 88 L112 94" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/>${eye(78, 110)}${eye(122, 110)}<path d="M88 138 H112" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/>${belly}${ARMS.downL}${ARMS.downR}`,
    happy: () => `${happyEyes}${cheeks}${openSmile}${belly}${ARMS.upL}${ARMS.upR}`,
    waving: () => `${eye(78, 108)}${eye(122, 108)}${cheeks}${smile}${belly}${ARMS.downL}${ARMS.upR}<path d="M200 70 q10 -4 14 6 M206 56 q14 -6 20 8" fill="none" stroke="${C.gold}" stroke-width="5" stroke-linecap="round"/>`,
    thinking: () => `<ellipse cx="82" cy="104" rx="7" ry="9" fill="${C.frame}"/><ellipse cx="126" cy="104" rx="7" ry="9" fill="${C.frame}"/><path d="M68 86 L88 84 M114 80 L134 86" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/><path d="M92 138 Q102 133 112 138" fill="none" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/>${belly}${ARMS.downL}${ARMS.chinR}<circle cx="176" cy="36" r="6" fill="${C.paper}" stroke="${C.frame}" stroke-width="3.5"/><circle cx="190" cy="16" r="9" fill="${C.paper}" stroke="${C.frame}" stroke-width="3.5"/><circle cx="204" cy="-14" r="22" fill="${C.paper}" stroke="${C.frame}" stroke-width="4"/><text x="204" y="-3" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="30" fill="${C.blue}">?</text>`,
    debugging: () => `<circle cx="78" cy="108" r="12" fill="#fff" stroke="${C.frame}" stroke-width="4"/><circle cx="122" cy="108" r="12" fill="#fff" stroke="${C.frame}" stroke-width="4"/><circle cx="80" cy="110" r="5" fill="${C.frame}"/><circle cx="124" cy="110" r="5" fill="${C.frame}"/><path d="M84 140 q6 -7 12 0 t12 0 t12 0" fill="none" stroke="${C.frame}" stroke-width="4.5" stroke-linecap="round"/>${drop(150, 76)}${belly}${ARMS.downL}${ARMS.lensR}<path d="M190 124 L182 136" stroke="${C.frame}" stroke-width="8" stroke-linecap="round"/><circle cx="203" cy="104" r="20" fill="#CFE0EF" fill-opacity=".7" stroke="${C.frame}" stroke-width="5"/><path d="M195 96 q5 -5 12 -3" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
    accepted: () => `${happyEyes}${cheeks}${openSmile}${badge('AC', '#50FA7B', C.frame)}${ARMS.upL}${ARMS.upR}${star(-8, 40, 13)}${star(212, 40, 11)}${star(196, -18, 9)}`,
    'wrong-answer': () => `<path d="M64 98 L86 90 M136 98 L114 90" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/>${eye(78, 112)}${eye(122, 112)}<path d="M88 144 Q100 132 112 144" fill="none" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/>${drop(152, 80)}${badge('WA', '#FF5555', C.paper)}${ARMS.downL}${ARMS.downR}`,
    tle: () => `<path d="M69 108 Q78 116 87 108 M113 108 Q122 116 131 108" fill="none" stroke="${C.frame}" stroke-width="5" stroke-linecap="round"/><ellipse cx="100" cy="140" rx="7" ry="8" fill="none" stroke="${C.frame}" stroke-width="4.5"/>${badge('TLE', '#FFB86C', C.frame)}${ARMS.downL}${ARMS.downR}<text x="176" y="24" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="${C.blue}">z</text><text x="194" y="0" font-family="JetBrains Mono" font-weight="700" font-size="36" fill="${C.blue}">Z</text>`
  };
  MOODS.wa = MOODS['wrong-answer']; MOODS.ac = MOODS.accepted; MOODS.sleepy = MOODS.tle;

  function mascotSVG(mood, w) {
    const f = MOODS[mood] || MOODS.focused;
    const h = Math.round(w * 300 / 260);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="-30 -40 260 300">
      <path d="M78 210 V232 H64 M122 210 V232 H136" fill="none" stroke="${C.frame}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M56 26 H141 L171 56 V200 Q171 216 155 216 H56 Q40 216 40 200 V42 Q40 26 56 26Z" fill="${C.frame}"/>
      <path d="M51 20 H135 L165 50 V194 Q165 210 149 210 H51 Q35 210 35 194 V36 Q35 20 51 20Z" fill="${C.paper}" stroke="${C.frame}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M135 20 V42 Q135 50 143 50 H165 Z" fill="${C.tan}" stroke="${C.frame}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="52" y="38" width="34" height="9" rx="4.5" fill="${C.crimson}"/><rect x="92" y="38" width="26" height="9" rx="4.5" fill="${C.gold}"/>
      <rect x="64" y="55" width="48" height="9" rx="4.5" fill="${C.blue}"/><rect x="118" y="55" width="12" height="9" rx="4.5" fill="${C.tan}"/>
      ${f()}
    </svg>`;
  }

  class IcpcMascot extends HTMLElement {
    connectedCallback() {
      const w = +(this.getAttribute('size') || 200);
      const label = this.getAttribute('label');
      this.innerHTML = `<span class="mascot-wrap">${mascotSVG(this.getAttribute('mood') || 'focused', w)}${label ? `<span class="m-label" style="font-size:${Math.max(20, w * .15)}px">${esc(label)}</span>` : ''}</span>`;
    }
  }

  /* ---------------- Logo mark (placeholder; set src="…" to use the official PNG/SVG) ---------------- */
  class IcpcLogo extends HTMLElement {
    connectedCallback() {
      const s = +(this.getAttribute('size') || 120);
      const src = this.getAttribute('src');
      if (src) { this.innerHTML = `<img src="${esc(src)}" alt="ICPC-FCAI-BSU" style="width:${s}px;height:auto">`; return; }
      const mono = this.hasAttribute('mono');
      const r = mono ? '#1A1A1A' : '#8B1A1A', g = mono ? '#1A1A1A' : '#DAA520', b = mono ? '#1A1A1A' : '#4A90D9';
      this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 120 120">
        <path d="M60 10 L106 88 H14 Z" fill="${r}"/>
        <path d="M60 10 L74 88 H106 Z" fill="#000" opacity=".22"/>
        <path d="M44 88 Q42 60 56 40" fill="none" stroke="${g}" stroke-width="4" stroke-linecap="round"/>
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${47 + i * 2.6}" cy="${76 - i * 10}" rx="3.4" ry="7" transform="rotate(${-35 + i * 4} ${47 + i * 2.6} ${76 - i * 10})" fill="${g}"/><ellipse cx="${53 + i * 2.6}" cy="${78 - i * 10}" rx="3.4" ry="7" transform="rotate(${35 - i * 2} ${53 + i * 2.6} ${78 - i * 10})" fill="${g}"/>`).join('')}
        <path d="M10 99 q12 -8 25 0 t25 0 t25 0 t25 0" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round"/>
        <path d="M18 111 q10 -7 21 0 t21 0 t21 0 t21 0" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round" opacity=".7"/>
      </svg>`;
    }
  }
  customElements.define('icpc-mascot', IcpcMascot);
  customElements.define('icpc-logo', IcpcLogo);

  /* ---------------- Boot ---------------- */
  function fit() {
    if (EXPORTING) return;
    const k = Math.min(innerWidth / 1920, innerHeight / 1080) * (window.top === window ? .96 : 1);
    document.documentElement.style.setProperty('--fit', k);
  }

  function checkOverflow() {
    const warnings = [];
    const marks = q('.watermark');
    marks.forEach(w => w.style.display = 'none');   // watermarks bleed on purpose
    const check = (el, what) => {
      const dh = el.scrollHeight - el.clientHeight, dw = el.scrollWidth - el.clientWidth;
      if (dh > 2 || dw > 2) {
        el.classList.add('icpc-overflow');
        warnings.push(`${what} overflows by ${Math.max(dh, 0)}px vertically / ${Math.max(dw, 0)}px horizontally`);
      }
    };
    q('.slide .content').forEach(el => check(el, 'slide content area'));
    q('.ide-code').forEach(el => check(el, `code block "${el.closest('.ide')?.dataset.file || ''}"`));
    q('.slide').forEach(slide => {
      const box = slide.getBoundingClientRect();
      q('.window .content > *', slide).forEach(ch => {
        const r = ch.getBoundingClientRect();
        if (r.right > box.right + 1 || r.bottom > box.bottom + 1) warnings.push(`element <${ch.tagName.toLowerCase()} class="${ch.className}"> extends past the slide`);
      });
    });
    marks.forEach(w => w.style.display = '');
    window.__icpcWarnings = warnings;
    warnings.forEach(w => console.warn('[icpc] ' + w));
  }

  let gid = 0;
  function boot() {
    q('.ide').forEach(renderIde);
    q('.terminal').forEach(renderTerminal);
    q('.arr').forEach(renderArray);
    q('.gridviz-host').forEach(renderGrid);
    q('.graph').forEach(el => { el.__gid = gid++; renderGraph(el); });
    q('.diamonds[data-count]').forEach(el => { el.innerHTML = '<i></i>'.repeat(+el.dataset.count); });
    if (document.body.classList.contains('element-page') && !document.body.hasAttribute('data-no-labels')) {
      q('[data-export]').forEach(el => el.insertAdjacentHTML('beforebegin', `<div class="el-label">export → <b>${esc(el.dataset.export)}</b></div>`));
    }
    fit();
    addEventListener('resize', fit);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      requestAnimationFrame(() => { checkOverflow(); window.__icpcReady = true; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
