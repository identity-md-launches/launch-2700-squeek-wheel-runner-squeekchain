# DESIGN.md: Squeek Wheel Runner

Taken from the final source: `site/css/app.css`, `site/css/overlay.css`, `site/js/pixel.js` and `site/js/game.js`.

## Overview

A one-page browser game for viewers and streamers of a real hamster wheel on Squeekchain. The visual idea is **a pixel hamster in a yellow cage, with square 3px outlines**: square corners, flat fills, no gradients or shadows on the page, and pixel art in the canvas. The order of importance is fixed:

1. The live chain data strip (block, rpm, SQK minted).
2. The game stage with its single primary action (**Start run** / **Run again**).
3. The result, leaderboard and explanation panels.

The density is that of a light game page. The canvas carries the character; the page chrome stays quiet around it. These rules apply to every page except the OBS overlay (`site/overlay/`), which is its own transparent surface with dark plates (see Components).

## Colors

Defined as custom properties on `:root` in `site/css/app.css`. Hex notation throughout. Primitives are named by hue and step; components only use the role tokens.

| Role token | Primitive / value | Use |
| --- | --- | --- |
| `--color-bg` | `--cream-50` `#fffaea` | Page background |
| `--color-surface` | `#ffffff` | Panels, live strip, inputs, secondary buttons |
| `--color-text` | `--brown-900` `#2e1f0b` | Body text, headings |
| `--color-text-secondary` | `--brown-700` `#5c4520` | Labels, notes, table headers, lede |
| `--color-outline` | `--brown-900` | The 3px outlines on every surface and control |
| `--color-track` | `--brown-200` `#ead9a4` | Progress track, table row rules |
| `--color-accent` | `--yellow-400` `#ffc93c` | The single filled primary action, progress fill, "running" chip |
| `--color-accent-strong` | `--yellow-300` `#ffd95e` | Header band, primary hover |
| `--color-on-accent` | `--brown-900` | Text on yellow |
| `--color-error-bg` / `--color-error-text` | `#ffe1d6` / `#8a2a0b` | Fetch-failure banner, counter-fault chip |
| `--color-night` / `--color-on-night` | `#1b2246` / `#fff2c4` | Sleep-mode chip and note (matches the canvas night sky) |
| `--color-gold` | `#ffd23f` | Block bonus only: x2 chip, toast |
| `--color-focus` | `#1f5fd1` | `:focus-visible` outline |

Contrast was computed from these declared pairs, not measured on screen:

| Pair | Ratio |
| --- | --- |
| text on bg | 15.27 |
| secondary on bg | 8.64 |
| on-accent on accent | 10.38 |
| error text on error bg | 7.03 |
| on-night on night | 13.75 |
| text on gold | 11.04 |
| focus ring on bg | 5.56 |
| focus ring on header yellow | 4.24 |

The taste probe's rendered contrast check passed. Text over the canvas is not measured; see VALIDATION.md.

Canvas palette (`PALETTE` in `site/js/pixel.js`): fur `#e89a3c`, shade `#c9772a`, belly `#fff4dc`, pink `#f59aa6`, outline `#3a2410`, wood `#8a5a2b`/`#5e3a17`, seeds `#2f2a26`/`#e9e2cf`, gold seeds `#ffd23f`/`#b8860b`. The sky and ground in `game.js` blend from day (`#ffd95e` → `#fff2c4`, floor `#e9c27a`) to night (`#1b2246` → `#34407a`, floor `#4b4265`).

## Typography

- Family `--font`: `system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`. There are no web fonts; the CJK fallbacks cover Chinese. `--font-mono` (`ui-monospace, …`) is used only for the overlay URL `<code>`.
- Weights: 400 (body) and 700 (brand, headings, values, buttons).
- Scale: four tokens, plus `1rem` for the input text (keeps iOS from zooming).

| Token | Size | Use |
| --- | --- | --- |
| `--text-sm` | 13px | Live labels, chips, help line, table, footer |
| `--text-body` | 15px | Body, buttons, line-height 1.5 |
| `--text-md` | 17px | Brand `h1`, panel `h2`/`h3`, live values, HUD numbers |
| `--text-lg` | 22px | Result score |

- Headings use `text-wrap: balance` and line-height 1.25; the lede uses `text-wrap: pretty`.
- Every changing number uses `font-variant-numeric: tabular-nums` (`.num`, `.live-value`).
- Long values such as SQK totals, the overlay URL and player names use `overflow-wrap: anywhere`; nothing is truncated.
- The canvas share card (`site/js/share-card.js`) uses the same family stack at 30–150px.

## Layout

- Spacing tokens: `--space-1` 4, `--space-2` 8, `--space-3` 12, `--space-4` 16, `--space-6` 24px.
- `.layout` (`main`) is a grid with a 16px gap, 16px inline padding (24px on desktop) and a 1200px max width, centred.
- **Mobile (default):** a single column in reading order: lede → live strip → game (`.col-game`: stage, help, fetch-error notice, result) → `.col-side` (leaderboard, how-it-works). On phones the live strip stacks one item per row (block bar, rpm with the wheel and status chip, minted SQK), so the status chip never runs into the SQK value. The fetch-error notice sits below the stage and controls, so a failed poll never moves the play surface.
- **≥ 40rem:** the live strip becomes one row `2fr 1fr 1fr` (block, rpm, minted); `.live-block` and `.live-stat` return to `grid-column: auto`.
- **≥ 62rem:** `main` becomes `minmax(0, 2fr) minmax(18rem, 1fr)`. The lede and live strip span both columns, with `.col-game` on the left and `.col-side` on the right. Each column is its own grid, so they don't share row heights.
- The stage is the canvas at `aspect-ratio: 16 / 9`, `width: 100%`. The game draws at 240×135 game pixels and is upscaled with `image-rendering: pixelated`. At 390 wide the stage is about 358×201 and fits on the first screen with the Start button. Measured on screen: the Start button's bottom edge sits at y ≈ 458 of 844.
- Checked: no horizontal scroll at 320, 390 and 1440.

## Elevation & Depth

The page is flat. Depth comes only from the 3px `--outline` border and from tonal layers: cream page, white surfaces, yellow header. There are no `box-shadow`s. Things that sit above the canvas:

- the `.stage-overlay` (start/run again)
- the `.toast` (block bonus)
- the canvas's own gold flash and gold frame drawn in `game.js`.

## Shapes

`border-radius: 0` everywhere. Corners are square on purpose, for the pixel look. Borders are 3px solid `--color-outline` on panels, the live strip, the stage, buttons, inputs and the progress bar, and 2px on chips. The progress fill has 2px pixel steps every 12px (`repeating-linear-gradient`).

## Components

| Component | Source | Notes |
| --- | --- | --- |
| Button `.btn` | `app.css` | 44px min height and width. Variants `.btn-primary` (yellow fill: one per view, the run action or "Download share card"), default (white) and `.btn-quiet` (transparent, header language toggle). Hover is gated by `@media (hover: hover)`. Press is `scale: 0.96`, 120ms ease-out, and is turned off under reduced motion. Also used on `<a>` (download, X, overlay link). |
| Chip `.chip` | `app.css` | Status label. `data-state="running"` (yellow), `"sleeping"` (night), `"fault"` (error), `"loading"` (white). `.chip-gold` is the x2 timer. |
| Live strip `.live` | `index.html`, `app.js renderLive()` | Block label and %, a `role="progressbar"` bar (fill is a `transform: scaleX` transition of 600ms), the rpm with an SVG wheel rotated per frame at the real rpm (static under reduced motion), and minted SQK. |
| Fetch-error notice `.feed-error` | `index.html` (in `.col-game`, after `.play`), `app.js renderLive()` | A stable `role="status"` region, empty and hidden until a fetch fails. It sits below the stage so it never shifts the game. |
| Stage `.stage` | `index.html`, `game.js` | Canvas plus `.stage-overlay` (title and primary button) plus `.toast` (`role="status"`, gold). Pointer down on the stage jumps while running. The keyboard handler is document-level (Space/↑/W), ignored while typing in inputs or on buttons. |
| Panel `.panel` | `app.css` | White surface with a 3px outline and 16px padding, grid gap 8px. Used for the result, leaderboard and how-it-works. |
| Leaderboard table `.board-table` | `app.js renderBoard()` | Rank is a `th scope=row`; numbers are right-aligned and tabular; the latest run row is `.is-latest`. The empty state is a sentence saying what fills it. |
| Field `.field` | `app.css` | A visible `<label for>` and a 44px input at 16px text. |
| Share card | `share-card.js` | 1200×630 PNG data URL: yellow background, pixel hamster in a wheel, score, rpm, block, date, @shimis_88. |
| Overlay | `site/overlay/index.html`, `overlay.css` | Transparent `html`/`body`. Items are dark plates `rgb(46 31 11 / 0.88)` with a 3px `#ffc93c` border, cream text, 26px yellow values. Flex-wrap row. |

## Do's and Don'ts

- Do use the role tokens; don't use primitives (`--yellow-400`) in components.
- Do keep exactly one `.btn-primary` per view. Everything else is a default `.btn` or a link.
- Do give every new surface the 3px `--outline` and square corners; don't add shadows or radii.
- Do add every string to both `zh` and `en` in `site/js/i18n.js` and mark the element with `data-i18n`. Don't hard-code copy in JS.
- Do comment the API field and conversion next to any new live value, as in `squeek-data.js`.
- Don't use colour as the only signal: sleep, fault and bonus states always carry text.
- Don't add `transition: all`; name the properties and add them to the reduced-motion block.

**Adding a page:** copy `site/index.html`'s head (title, description, OG tags, favicon, `css/app.css`) and the `site-header`/`site-footer` markup. Put content in a `main.layout` with `.panel` sections. Load `js/i18n.js` first and call `SWR.i18n.apply()`. Use only relative URLs, then run `npm run build`, which rejects absolute or missing local URLs.
