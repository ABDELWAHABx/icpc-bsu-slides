# Component reference

All classes come from `kit/icpc.css`; `kit/icpc.js` renders the dynamic ones. Design space is 1920×1080 px.

## Slide skeleton
```html
<main class="slide" data-export="slide">
  <div class="window">
    <div class="titlebar">
      <div class="lights"><i></i><i></i><i></i></div>
      <div class="tabs"><div class="tab">other.md</div><div class="tab active">current.cpp</div></div>
      <div class="winbtns"><span>─</span><span>□</span><span>×</span></div>
    </div>
    <div class="content"> … </div>            <!-- add class "center" to centre everything -->
    <div class="statusbar">
      <span class="mode">LABEL</span>          <!-- mode colours: (crimson) gold blue, or style="background:…" -->
      <span class="mid brand">ICPC-FCAI-BSU</span>
      <span class="page">1 / 1</span>          <!-- auto-renumbered by build.mjs -->
    </div>
  </div>
  <aside class="notes">speaker notes</aside>
</main>
```
Content area ≈ 1580 × 720 px of usable space. Layout: `.row` (flex row, gap 64) · `.col` (flex column) · `.grow` (fills free space) · `.center-y` · `.abs` + `.br/.bl/.tr/.tl` (corners) · `.watermark` (huge faded number).

## Text
| markup | result |
|---|---|
| `.eyebrow` | mono crimson kicker, e.g. `// 02.1 intuition` |
| `.display` / `.h1` / `.h2` / `.h3` | 128 / 76 / 54 / 36 px titles |
| `.lead` / `.body` / `.small` | 36 / 30 / 24 px paragraphs |
| `.accent-bar` + `tri gold blue wa` | underline bar under headings |
| `<code>` (`.blue` `.gold`) | inline code chip |
| `<span class="hl">` | gold marker highlight |
| `.hand` | Caveat handwriting |
| `.include` | `#include <icpc_bsu.h>` line (see title template) |

## Lists
- `ul.bullets > li > span` — diamond bullets cycling crimson/gold/blue. Variants: `.check`, `.cross`, `.compact`. Nested: `<ul>` after the span.
- `ol.steps > li > span.t + span.d` — numbered steps (01, 02…).
- `ol.agenda > li(.now|.done) > span.n + span.t(<small>) + span.time`.

## Code & terminal
```html
<div class="ide sm" data-file="a.cpp" data-lang="cpp" data-highlight="3,5-7" data-add="4" data-del="2" data-dim="1" data-mark="9:continue" data-start="1">
<script type="text/x-code">
raw code here
</script>
</div>
```
Sizes: `ide sm` 22px · `ide` 26px · `ide lg` 30px. Extras: `no-gutter`, `data-bar="none"`, `data-lang="py|cpp|text"`.
```html
<div class="terminal" data-title="judge" data-prompt="icpc@bsu:~$">
<script type="text/x-term">
$ command
# comment
test 4   Wrong Answer
{cursor}
</script>
</div>
```
Automatically coloured: Accepted/AC/✓, Wrong Answer/WA/✗, Time/Memory Limit Exceeded/TLE/MLE, Runtime Error/RE, Compilation Error/CE.
Judge table: `table.judge` with verdict cells `td.v-ac|v-wa|v-tle|v-re|v-skip` and optional `tfoot`.

## Boxes
- Callout: `div.callout(.warn|.info|.note|.def|.ok) > div.tag + div.msg(span.title?)`.
- Card: `div.card` (parchment, hard shadow) · `div.card.flat`.
- Verdict badge: `span.verdict.(ac|wa|tle|mle|re|ce) > span.ico + text`.
- Chips: `div.chips > span.chip.(easy|medium|hard|topic|outline|solid|crimson|gold|blue)`.
- Stats: `div.stats > div.stat > div.num(<small>unit</small>) + div.lbl`.
- Compare: `div.compare > div.side.bad|.good > span.side-head + any content + p`.
- Quiz: `div.quiz(.reveal) > div.opt(.correct) > span.k + span`.
- Presenter: `div.whoami > div.avatar(initials|<img>) + div.who > span.cmd + span.name + span.role`.
- Socials: `div.socials(.compact) > span.social > span.k + handle`.
- Quote: `blockquote.quote` + `<cite>`. Annotation: `span.annot(.gold|.blue|.down)` + svg arrow (copy from `annotations.html`).

## Problem statement
`div.problem > div.problem-head(span.letter + h1.h2 + chips) + div.limits(span×2) + p.statement + div(div.sec + p)`.
Sample: `div.sample-io > div.in(div.io-head + pre) + div.out(div.io-head + pre)`.

## Data visualisations (attributes / JSON only)
- **Array:** `<div class="arr" data-name="a[]" data-values="1,2,3" data-labels="S,A,B" data-hl="1" data-act="2" data-done="0" data-dim="" data-ptr="0:L,2:R" data-start-index="0" data-cell="104" data-no-index></div>`
- **Table / DP:** `<div class="gridviz-host"><script type="application/json">{"corner":"i","cols":[…],"rows":[{"h":"0","cells":["1",{"v":"2","c":"hl|act|done|dim|chg"}]}]}</script></div>`
- **Graph:** `<div class="graph"><script type="application/json">{"width":640,"height":440,"r":38,"directed":false,"nodes":[{"id":"S","x":60,"y":220,"style":"source|target|visited|done|active|dim","note":"d=0","noteAbove":false,"label":"S"}],"edges":[{"a":"S","b":"A","w":4,"style":"path|dim"}],"caption":"…"}</script></div>` — keep nodes ≥ r+10 px from the edges.
- **Table:** `table.table` with `tr.best`, `span.o.o-good|o-ok|o-bad`, `span.yes|no`, `td.mono`.

## Images
```html
<figure class="figure grow">                       <!-- add "contain" to show the whole image -->
  <div class="fig-bar"><i></i><i></i><i></i><span>file.png</span></div>
  <div class="fig-img"><img src="../assets/file.png" alt=""></div>
  <figcaption>optional caption</figcaption>
</figure>
<img class="photo" src="../assets/team.jpg" style="width:700px;height:460px">
<div class="polaroid"><img src="../assets/team.jpg" style="width:520px;height:380px"><span>caption</span></div>
```
Give a `.figure` a size: either `grow` inside a `.row`/`.col`, or explicit `style="width:…;height:…"`.

## Brand pieces
- `<icpc-mascot mood="focused|happy|waving|thinking|debugging|accepted|wrong-answer|tle" size="170" label="optional">`
- `<icpc-logo size="64" [mono] [src="../kit/logo.png"]>`
- `div.diamonds[data-count="8"][style="--n:4"]` · `div.stars > i×3` · `span.cursor`
