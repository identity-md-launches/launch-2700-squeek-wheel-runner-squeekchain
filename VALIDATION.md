# Validation: Squeek Wheel Runner

Worker's own record, 2026-10-30. Nothing here is independently certified.

## Scope and assumptions

- Surfaces covered:
  - `dist/index.html`: game page with the live strip, game, result and share card, leaderboard, how-it-works and footer.
  - `dist/overlay/index.html`: OBS overlay.
- Stack: the brief asks for "纯静态 index.html + 原生 JS + canvas，零依赖零构建". The site runs straight from `site/` with no build. `dist/` is a checked copy, and TypeScript is dev-only for the type check.
- **Block data source:**
  - The brief names `builder.anchor.*`, but acceptance asks for consistency with sepolia.squeekchain.com.
  - That site's bundle computes progress from `builder.projected.blockProgress` and shows block `projected.blockHeight + 1`.
  - The game uses that exact formula, falling back to anchor when projected is missing.
- **Wheel status:** the brief's `SPINNING` value does not exist in the live API, which returns `ACTIVE`/`IDLE`/`COUNTER_FAULT`. `ACTIVE`, `SPINNING`, or any rpm/speed above 0 counts as running.
- **New block:** detected as a rise in block height between two successful reads. That is the moment progress passes 100%.
- **Leaderboard:** localStorage, this browser only. The page says so next to the table.
- **No wallet:** no wallet, transactions, backend, login or token trading.

## Commands and results

| Command | Result |
| --- | --- |
| `npm install` | TypeScript 5.9.3 dev dependency, `package-lock.json` written |
| `npm run typecheck` (`tsc --noEmit`, `checkJs`) | exit 0, no errors (after typing the shared `SWR` namespace) |
| `npm run build` | `dist/ built: 14 files, 162404 bytes, all local URLs relative and present` |
| Playwright Chromium e2e (`test/scratch/e2e.mjs`, serves `dist/` under `/preview/`) | 31/31 PASS, listed below |
| Chinese locale run at 320 and 390 (`test/scratch/zh.mjs`, `file://`) | `lang=zh-CN`, Chinese labels, scrollWidth = viewport, 0 console errors |
| Design probe `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | 16/16 passed (render, layout, targets, contrast, casing, tracking, eyebrows, type-sizes, type-faces, glyphs, slogans, repetition, copy-budget, chrome, motion, share) |
| Playwright WebKit | **Not run**: the host lacks WebKit system libraries (libgtk-4, gstreamer, …) |

E2E checks, all PASS:

- **Live API** at 390, 320 and 1440:
  - block, %, rpm and SQK filled within 0.2–0.5 s (limit 10 s)
  - 0 console errors
  - scrollWidth equals the viewport (390/390, 320/320, 1440/1440)
  - Start button inside the first screen (390: y 414–458 of 844)
- **Block matches the site's formula:** the page showed `Block #4136 building 3.58%`, and a separate API call gave `#4136 3.58%`.
- **Mocked API** (Playwright route plus clock):
  - `IDLE` → sleep chip and note
  - minted `16455437093891105632782689` → `16,455,437.09`
  - height 4135 → 4136 → toast "Block #4136 is out! Seeds x2 for 10 s" and the x2 chip
  - `ACTIVE` 60000 rpmMilli → "60.0" rpm, running
  - HTTP 503 → "Data fetch failed, retrying in 10 s…" with the old values kept, then recovery on the next poll
- **Gameplay:**
  - Start hides the overlay, Space jumps and the score rises.
  - A crash shows the result with a PNG card and a download link; the download event filename is `squeek-wheel-runner-21.png`.
  - The X intent link is prefilled, focus moves to "Run again", and renaming updates the leaderboard row.
  - Enter on "Run again" restarts, and pointerdown on the stage jumps. The language toggle works.
- **Overlay:** `html` and `body` backgrounds are `rgba(0, 0, 0, 0)`, rpm, block and best are filled, and there are 0 console errors.

Screenshots were viewed by the worker (in `test/scratch/shots/`, not submitted): Chromium 390, 1440 full page, the mocked idle, bonus, failure and game-over states, and Chinese at 320.

## Better Interface review (six domains)

| Domain | Coverage | Evidence |
| --- | --- | --- |
| Accessibility | Checked (partial) | Native `<button>`/`<a>` only, a visible `<label for>` on the name input, a skip link, one `h1` (brand) with `h2`/`h3` below, `role="progressbar"` with `aria-valuenow`, stable `role="status"` regions (fetch error, bonus toast), canvas `role="img"` with an aria-label, `:focus-visible` 3px `#1f5fd1`, focus moved to "Run again" after a crash, targets ≥ 44px. Reduced motion stops the wheel rotation and idle scroll and removes CSS transitions. **Not verified:** screen-reader session, forced-colors mode, 200% browser zoom (only 320px reflow). |
| Layout | Checked | Single column on mobile in order of importance, with live data and the game first. Breakpoints at 40rem/62rem where the content stops fitting; logical properties for inline padding and margins. **Not verified:** RTL (not a supported locale). |
| Writing | Checked (source) | Verb-first buttons ("Start run", "Run again", "Download share card", "Post on X"). The error states the fix ("retrying in 10 s, the game keeps using the last data"). The empty leaderboard says how it fills. Directions sit next to the stage. Sentence case. |
| Typography | Checked | 4 sizes plus 16px input, 2 weights, tabular numbers on changing values, `text-wrap` balance/pretty, no truncation. The headless Linux fonts in the screenshots render without a distinct bold face, so weight hierarchy was **not visually verified**. |
| Colors | Checked | Primitive → role tokens. Declared-pair contrast computed (DESIGN.md); the probe's rendered contrast check passed. Text over the canvas (stage title, toast) sits on opaque white or gold plates. **Not measured:** canvas pixel art against the sky. |
| UI | Checked | Square 3px outlines and no shadows (probe: 0 border+shadow surfaces). Transitions name their properties (`scale, background-color`, `transform`, `opacity`). Press scale is 0.96. Every animated state also has text (sleep note, x2 chip, toast). |

### Findings and fixes

| # | Severity | Source | Finding | Fix and recheck |
| --- | --- | --- | --- | --- |
| 1 | Medium | `site/css/app.css:99` | The hidden x2 chip rendered as a black dash in the HUD, because `.chip { display:inline-block }` beat the `hidden` attribute (seen in the 390 screenshot). | Added `[hidden] { display: none !important }`. Rechecked: the HUD shows only Score/Best until a bonus. |
| 2 | Medium | `site/css/app.css:312`, `site/index.html` | At 1440 the leaderboard spanning two grid rows left a ~500px empty gap under the game. | Split into `.col-game` and `.col-side` column grids. Rechecked at 1440. |
| 3 | Medium | `site/js/game.js:12` | At 390 the hamster was ~18 CSS px tall at 320×180 game pixels, hard to see. | Game resolution changed to 240×135, which gives a ~24px hamster. Speeds rescaled. Rechecked in screenshots. |
| 4 | Low | `site/js/game.js:325` | Night mode faded in over ~2 s after load, so an IDLE wheel briefly looked like day. | The first live reading sets day/night at once; later changes still ease. |
| 5 | Low | `site/js/app.js:63`, `site/js/overlay.js:19` | Block numbers were formatted two ways (`#4,136` vs `#4137`). | Plain `#4136` everywhere. |
| 6 | Low | `site/css/app.css:520` | The probe reported 2 controls under the comfortable 44px size (footer links). | Footer links now have a 44px min-height. |
| 7 | Low | `site/js/*.js` | `tsc` reported `SWR` typed as `{}`. | Added a JSDoc type on the shared namespace; typecheck exit 0. |

### Remaining limitations

- Safari/WebKit and real phones were not tested. The CSS used (`scale`, `aspect-ratio`, `text-wrap`, `inset`) is supported in current Safari, and `text-wrap` degrades gracefully. That is a source review only.
- A real block crossing 100% was not observed live, because the wheel was IDLE during the session. The trigger was tested with mocked responses.
- The overlay's best score comes from the same browser profile's localStorage. OBS sources have separate storage (documented in the README).
- X intent links cannot attach the card image; the user attaches the downloaded PNG.
- `og:image` is a relative URL until the site has a fixed address.

## Completion

Complete for the stated scope, except for the browser coverage listed above (no WebKit, real devices or screen reader).
