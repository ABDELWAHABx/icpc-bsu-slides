---
name: icpc-bsu-slides
description: Build ICPC-FCAI-BSU (ICPC Beni Suef Community) branded presentations as a .pptx file from any content — lecture notes, an outline, code, problems, images. Uses HTML slide/element templates in the club's warm-retro-window + dark-IDE style (code blocks with syntax highlighting, terminals, bullets, problem statements, verdicts, graphs, arrays, DP tables, quizzes, mascot, images), renders them with headless Chrome and packs them into PowerPoint with speaker notes. Also exports single elements as transparent PNGs for Canva. Use whenever the user wants an ICPC / competitive-programming session deck, training slides, or branded slide elements.
---

# ICPC-FCAI-BSU slides → PPTX

**Input:** the user's content (a topic, notes, code, problems, images).
**Output:** `<deck>/<deck-name>.pptx`, a 16:9 PowerPoint with one full-bleed slide image per slide and speaker notes, plus `<deck>/png/*.png`.

`SKILL` below means this skill's folder (the directory containing this file). Scripts need Node 18+ and Chrome or Edge.
On the first run in a new environment, run `npm install --prefix "SKILL"` if `SKILL/node_modules` is missing.

## Workflow

1. **Plan the deck.** Turn the content into a slide list, one idea per slide, using the catalog below. A typical session is title → agenda → (section → content/code/trace/problem …) × topics → quiz → takeaways → closing. Show the outline to the user if the content is ambiguous.
2. **Create the deck folder** (in the user's project or working directory):
   ```
   node "SKILL/scripts/new-deck.mjs" <deck-dir> --slides title,agenda,section,content,code,problem,quiz,quiz-answer,takeaways,closing
   ```
   Templates may repeat (`content,content,code`). `--list` prints all templates. `--from-example graph-theory` copies a complete 13-slide worked example to learn from.
   Add slides later with `node "SKILL/scripts/add-slide.mjs" <deck-dir> <template> [--as name] [--after NN]`.
3. **Fill every slide.** Open each `slides/NN-*.html` and replace the sample content (marked `<!-- EDIT -->`) with the user's content. Read the comment at the top of each template; it documents that template's attributes. Rules:
   - Change content, not design. Never edit `kit/`, never add `<style>` blocks or new classes. Inline `style=` is only for sizes/widths already used in the templates.
   - Raw code goes inside `<script type="text/x-code">` (no escaping). Terminal output goes in `<script type="text/x-term">`. Everywhere else, escape `<` as `&lt;` and `&` as `&amp;`.
   - Keep it projector-sized: ≤ 6 one-line bullets, code ≤ 17 lines (`ide sm`) / 14 (`ide`) / 12 (`ide lg`), ≤ 5 table rows.
   - Put speaker notes in `<aside class="notes">…</aside>` inside `<main class="slide">`. They go to the PPTX notes.
   - Update the active tab filename, eyebrow and statusbar texts to match the slide. Page counters `N / M` are renumbered automatically.
   - Edit files with your file-editing tools and save as UTF-8. On Windows, PowerShell `Get-Content`/`Set-Content` without `-Encoding utf8` corrupts characters like →, ≤, ✓ and “ ”.
4. **Images.** Copy the user's images into `<deck>/assets/` and reference them as `../assets/name.png` (an `https://` URL also works). Use the `image` slide template, or drop a `<figure class="figure">…</figure>` / `<img class="photo">` / `.polaroid` (see `templates/elements/images.html`) into any slide.
5. **Build:**
   ```
   node "SKILL/scripts/build.mjs" <deck-dir> [--out path/talk.pptx] [--scale 2]
   ```
   The build stops at the first problem: text overflow, a missing image, or a JS error. Fix each `⚠` (shorten text, split the slide, use a smaller size class like `ide sm` / `bullets compact`, correct the path) and rebuild. Use `--only 3,5` to re-render only some slides while iterating. Use `--force` only if the user accepts the problem.
6. **Check visually.** Read `<deck>/png/_contact-sheet.png` (all slides in one image), then the full-size PNG of any slide that looks off. Look for cramped or empty layouts and fix them. Then give the user the `.pptx` path.

## Slide templates (`templates/slides/`)

| template | use for |
|---|---|
| `title` | session opener: title, subtitle, presenter badge, waving mascot |
| `agenda` | roadmap list with durations; `now` / `done` row states |
| `section` | topic divider: big title + terminal "compiling" animation |
| `content` | bullets + a graph diagram (or swap the right card for any element) + callout |
| `code` | explanation column + large highlighted code block |
| `trace` | step-by-step dry run: DP/trace table + graph with distance notes |
| `problem` | Codeforces-style statement, limits, sample I/O, hint |
| `verdict` | wrong vs right: two code snippets + judge terminals |
| `table` | comparison / cheat-sheet table + rule callout |
| `image` | text + framed image (screenshots, photos, diagrams) |
| `quiz` / `quiz-answer` | 4-option question, then the reveal (`reveal` + `correct`) |
| `takeaways` | 3 stat cards + checklist |
| `closing` | Questions?, homework terminal, social handles |

## Elements (`templates/elements/`) — mix into any slide

Every element template is also a snippet library. To build a custom layout, copy the markup of any element into a slide's `<div class="content">`, using `.row` (horizontal), `.col` (vertical) and `.grow` (fill space) for layout.
Available: `headings`, `bullets` (bullets / nested / check / cross), `steps`, `code-block` (cpp, python, diff), `terminal`, `judge-table`, `verdicts` (AC WA TLE MLE RE CE), `callouts` (tip warn info note def ok), `chips`, `problem`, `sample-io`, `array` (plain / two-pointers / prefix / labelled), `dp-table`, `graph` (weighted / directed / tree), `table`, `compare`, `stats`, `quiz`, `agenda`, `presenter`, `mascot` (8 moods), `logo`, `socials`, `annotations` (handwritten arrows, quote), `decorations`, `images`, `frame` (blank branded slide background).
The full attribute reference is in `reference/components.md`.

**Canva instead of PPTX:** `node "SKILL/scripts/render-elements.mjs" <file-or-folder> --out <dir>` renders every `[data-export]` node to a transparent PNG at 2×. Point it at edited copies of element templates; keep the `../kit/` path valid by placing them in a folder next to a `kit/` copy (e.g. inside the deck folder).

## Brand rules (already built into the templates)
- Warm cream/parchment backgrounds; dark IDE blocks only for code and terminals. Never pure white or black.
- Accents: crimson `#C45C5C`, gold `#D4A843`, blue `#5B8DB8`. Fonts: Space Grotesk (titles), Inter (body), JetBrains Mono (code), Caveat (handwritten notes).
- Decoration budget: title slide 3–4 decorations, content slide 1–2, code slide 0–1. The mascot sits in corners and never covers content.
- Names: `ICPC-FCAI-BSU` (formal), `ICPC Beni Suef Community` (casual). Slogan: "Better Logic, Bigger Dreams". English only.
- The logo and mascot are code-drawn placeholders. If the user has the official logo, save it as `<deck>/kit/logo.png` and use `<icpc-logo src="../kit/logo.png" size="64">`.

## Limits to tell the user
PPTX slides are images, so text is not editable inside PowerPoint. To change a slide, edit its HTML and rebuild; this is what keeps every slide on-brand. Speaker notes are editable text.
