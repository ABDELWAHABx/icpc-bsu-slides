# icpc-bsu-slides

An agent skill that turns content into **ICPC-FCAI-BSU branded PowerPoint decks**.

The agent fills HTML slide templates with your content. They use the club's warm retro-window + dark-IDE style and include highlighted code, terminals, problem statements, verdicts, graphs, arrays, DP tables, quizzes, a mascot and images. A script then renders the slides with headless Chrome and packs them into a 16:9 `.pptx` with speaker notes. Single elements can also be exported as transparent PNGs for Canva.

**Input:** notes, code, problems or images. **Output:** `deck.pptx`.

## Install

Requirements: **git**, **Node.js 18+**, and **Google Chrome or Microsoft Edge**.

**macOS / Linux**
```bash
curl -fsSL https://raw.githubusercontent.com/ABDELWAHABx/icpc-bsu-slides/main/install.sh | bash -s -- claude
```
**Windows (PowerShell)**
```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/ABDELWAHABx/icpc-bsu-slides/main/install.ps1))) claude
```
Replace `claude` with the agent you use:

| agent | argument | installs to |
|---|---|---|
| Claude Code | `claude` | `~/.claude/skills/icpc-bsu-slides` |
| OpenAI Codex | `codex` | `~/.codex/skills/icpc-bsu-slides` |
| Google Antigravity | `antigravity` | `~/.gemini/antigravity/skills/icpc-bsu-slides` |
| all three | `all` | all of the above |
| anything else | a folder path | `<path>/icpc-bsu-slides` |

Run the same command again to update.

**Manual install** (any agent that reads `SKILL.md` skills):
```bash
git clone https://github.com/ABDELWAHABx/icpc-bsu-slides.git <your-agent-skills-dir>/icpc-bsu-slides
cd <your-agent-skills-dir>/icpc-bsu-slides && npm install
```
If your agent doesn't load skills automatically, point it at the folder: *"Read `<path>/icpc-bsu-slides/SKILL.md` and follow it."*

## Use

Ask your agent something like:

> Make an ICPC session deck on BFS and 0-1 BFS from these notes: …

The agent follows `SKILL.md`:
```bash
node scripts/new-deck.mjs my-deck --slides title,agenda,section,content,code,problem,quiz,quiz-answer,takeaways,closing
#   …edits my-deck/slides/*.html, puts images in my-deck/assets/…
node scripts/build.mjs my-deck          # → my-deck/my-deck.pptx + my-deck/png/_contact-sheet.png
```
The build stops and reports any slide whose text overflows or whose image is missing, so the agent fixes it before producing the PPTX.

To see a full 13-slide example, run `node scripts/new-deck.mjs demo --from-example graph-theory` and then `node scripts/build.mjs demo`.

## What's inside
```
SKILL.md                 instructions for the agent
reference/components.md  every component and attribute
templates/slides/        14 slide layouts (title, agenda, section, content, code, trace, problem,
                         verdict, table, image, quiz, quiz-answer, takeaways, closing)
templates/elements/      27 element templates (code block, terminal, bullets, callouts, verdicts,
                         graph, array, dp-table, mascot, images, …)
templates/kit/           brand CSS + JS (highlighter, mascot, renderers, overflow checks)
scripts/                 new-deck · add-slide · build (→ PPTX) · render-elements (→ PNG)
examples/graph-theory/   worked example deck
```

## Notes
- Each PPTX slide is a single full-bleed image, which keeps the design exact. To change a slide, edit its HTML and rebuild. Speaker notes stay editable text.
- The logo and mascot are code-drawn stand-ins. To use the official logo, put it at `<deck>/kit/logo.png` and write `<icpc-logo src="../kit/logo.png">`.
