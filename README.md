# Squeek Wheel Runner

像素仓鼠跑酷网页小游戏。游戏速度和难度由 Squeekchain 真实仓鼠转轮的实时数据驱动。
A pixel hamster runner whose speed and difficulty come from a real hamster wheel on Squeekchain.

纯静态 HTML + 原生 JS + canvas，运行时零依赖、零构建。没有钱包、交易、后端或登录。
Plain HTML + vanilla JS + canvas: no runtime dependencies, no build needed to run it. No wallet, transactions, backend or login.

页脚署名 / Footer credit: [@shimis_88](https://x.com/shimis_88)

## 玩法 / How to play

- 点 **开始奔跑**，然后按 **空格**、**↑**（或 W），或点按画面跳跃。按住跳得更高。
  Press **Start run**, then **Space**, **↑** (or W), or tap the scene to jump. Hold to jump higher.
- 躲开木块和水瓶，吃瓜子得分：每颗瓜子 10 分，跑的距离每 20 游戏像素 1 分。
  Dodge crates and water bottles and collect sunflower seeds: 10 points per seed, plus 1 point per 20 game pixels run.
- **真实转速越快，仓鼠跑得越快**，障碍越密（基础速度 68 px/s，每 1 rpm 加 0.6 px/s，最多按 120 rpm 计，再随时间加速）。
  **The faster the real wheel spins, the faster the run** (base 68 px/s, +0.6 px/s per rpm up to 120 rpm, plus a slow ramp over time).
- **转轮 IDLE**（没在转）时，画面变成夜晚，仓鼠闭眼打 Z，速度变慢（46 px/s 起）。
  **Wheel IDLE:** the scene turns to night, the hamster dozes and the run slows (from 46 px/s).
- **区块奖励**：真实区块完成度跨过 100%（新区块产出，即区块高度增加）时，屏幕金光一闪，10 秒内所有瓜子 x2（金色瓜子）。
  **Block bonus:** when real block progress passes 100% (the block height goes up), the screen flashes gold and seeds score x2 for 10 s.
- 结束后自动存入**本机排行榜**（localStorage，前 10 名，只在这个浏览器里）。可以改排行榜名字。
  Each finished run goes into the **local leaderboard** (localStorage, top 10, this browser only). The name is editable.
- 结束后生成**分享卡片**（1200×630 PNG：分数、当时真实转速、区块号和完成度、日期），可下载，再点 **分享到 X** 发帖（X 的发帖链接不能附图，请手动附上下载的卡片）。
  A **share card** (1200×630 PNG with score, the real rpm at that moment, block number and progress, date) can be downloaded; **Post on X** opens a prefilled post (X intents cannot attach images, so attach the downloaded card).
- 右上角按钮切换 **中文 / English**（默认跟随浏览器语言，选择会被记住）。
  The top-right button switches **中文 / English** (defaults to the browser language, choice is remembered).

### OBS 直播模式 / OBS overlay

`overlay/`（例如 `https://<your-host>/overlay/`）是透明背景页面，只显示实时转速（转轮图标按真实 rpm 旋转）、区块进度和本机最高分。
OBS 里添加 **浏览器** 来源，填入这个地址，宽 800、高 160 左右即可。加 `?lang=en` 显示英文。

`overlay/` is a transparent page with only the live rpm (the wheel icon turns at the real rpm), block progress and the best local score. In OBS add a **Browser** source with that URL (about 800×160). Add `?lang=en` for English.

最高分来自同一浏览器的 localStorage：OBS 的浏览器来源有自己的存储，所以要在 OBS 里显示你的最高分，请在同一个浏览器配置里玩，或在 OBS 的「交互」窗口里打开主页面玩。
The best score is read from localStorage of the same browser profile. OBS browser sources keep their own storage, so play in that profile (for example through OBS's "Interact" window) for the overlay to show your best score.

## 数据源 / Data sources

两个公开接口都带 `Access-Control-Allow-Origin: *`，前端直接 `fetch`，每 10 秒刷新一次。字段来源在 `site/js/squeek-data.js` 的注释里逐条写明。
Both endpoints are public with CORS; the page fetches them directly every 10 s. Every field's source is commented in `site/js/squeek-data.js`.

| 显示 / Shown | 接口 / Endpoint | 字段 / Field | 换算 / Conversion | 用途 / Used for |
| --- | --- | --- | --- | --- |
| 真实转速 rpm | `GET https://api.squeekchain.com/v1/status` | `measurement.rpmMilli` | ÷ 1000 | 奔跑速度、转轮旋转动画、分享卡片 / run speed, wheel animation, share card |
| 转轮状态 | `/v1/status` | `measurement.coreStatus` (`ACTIVE` / `IDLE` / `COUNTER_FAULT`), `measurement.speedMmPerSecond` | `ACTIVE`（brief 里叫 SPINNING，也接受）或 rpm/速度 > 0 = 在跑，否则睡觉模式 / running if ACTIVE (or SPINNING) or rpm/speed > 0, else sleep mode | 白天/夜晚、速度 / day/night, speed |
| 区块号 | `/v1/status` | `builder.projected.blockHeight`（缺失时用 `builder.anchor.blockHeight`） | 显示正在构建的区块 = blockHeight + 1 / shows the block being built = blockHeight + 1 | 顶部、分享卡片、区块奖励检测 / header, card, bonus trigger |
| 区块完成度 | `/v1/status` | `builder.projected.blockProgress`（缺失时用 anchor） | ÷ 1e9 得比例，×100 向下取两位小数 / ÷ 1e9, shown as % floored to 2 decimals | 顶部进度条 / progress bar |
| 已挖出 SQK | `GET https://api.squeekchain.com/v1/economy/state` | `supply.totalMintedBaseUnits` | ÷ 1e18（BigInt，保留两位小数向下取整）/ ÷ 1e18 with BigInt, 2 decimals floored | 顶部 / header |

**为什么用 `projected` 而不是 `anchor`：** 验收要求区块完成度与 https://sepolia.squeekchain.com 一致。该站点（`/assets/index-*.js` 里的 `progressPercent`）显示的是 `builder.projected.blockProgress × 10000 / 1e9 / 100`，区块号是 `builder.projected.blockHeight + 1`。`anchor` 是已在 Sepolia 上确认的状态，`projected` 再加上预言机已接受、尚未结算的轮次；两者平时相同，结算排队时 `projected` 更新。这里完全照抄该站点的算法。

**Why `projected`, not `anchor`:** acceptance asks for the same progress as sepolia.squeekchain.com, whose bundle computes `progressPercent` from `builder.projected.blockProgress` (×10000/1e9/100) and the block number as `builder.projected.blockHeight + 1`. `anchor` is the state confirmed on Sepolia; `projected` adds accepted but unsettled rounds. They are usually equal. The game uses the site's exact formula, falling back to `anchor` if `projected` is missing.

**接口失败时：** 顶部显示「数据拉取失败，10 秒后重试」，游戏继续用上一次成功的数据；首次就失败时显示「暂无」，游戏用默认速度照常可玩，不会白屏。
**On failure:** the page shows "Data fetch failed, retrying in 10 s" and keeps playing on the last good values; if the very first fetch fails, values show "n/a" and the game still runs at its default pace.

## 运行 / Run

不需要安装任何东西 / Nothing to install:

```bash
# 直接双击打开 / open directly
open site/index.html        # or dist/index.html

# 或者用任意静态服务器 / or any static server
python3 -m http.server -d dist 8080   # then visit http://localhost:8080/ and /overlay/
```

脚本都是普通 `<script>`（不是 ES module），所以 `file://` 直接打开也能玩。
Scripts are classic `<script>` tags (not ES modules), so opening the file from disk works.

## 开发、检查与重建 / Install, check, rebuild

`site/` 是源码，`dist/` 是提交进仓库的静态导出（`site/` 的拷贝，去掉 `.d.ts`）。TypeScript 只是开发依赖，用来对 JS 做类型检查（`checkJs`）；网站本身没有任何依赖。
`site/` is the source; `dist/` is the committed static export (a copy of `site/` without `.d.ts`). TypeScript is a dev-only dependency for type-checking the JS; the site has none.

```bash
npm ci               # installs the TypeScript dev dependency only
npm run typecheck    # tsc --noEmit with checkJs over site/js
npm run build        # node scripts/build.mjs: copies site/ -> dist/ and fails on absolute or missing local URLs
npm run check        # both
```

编辑 `site/` 下的文件后运行 `npm run build`，再提交 `dist/`。
After editing anything in `site/`, run `npm run build` and commit `dist/`.

## 部署 / Deploy

`dist/` 可以直接放到任何静态托管（IPFS、GitHub Pages、Netlify、S3 等）。所有资源 URL 都是相对路径，放在子路径下也能用；`overlay/` 是真实的静态目录 `dist/overlay/index.html`，不需要服务器重写。`og:image` 是相对路径 `og-image.png`；有了正式域名后可以改成绝对地址，让分享预览更稳。
Upload `dist/` to any static host. All asset URLs are relative, so it works under a subpath or gateway; `overlay/` is a real static folder, no rewrites needed. `og:image` is the relative `og-image.png`; switch it to an absolute URL once the site has its final address.

## 文件结构 / Layout

```
site/index.html          game page
site/overlay/index.html  OBS overlay (/overlay/)
site/css/app.css         page tokens and components
site/css/overlay.css     overlay styles
site/js/squeek-data.js   API polling + field parsing (field sources commented)
site/js/game.js          canvas runner (240x135 game pixels, scaled up pixelated)
site/js/pixel.js         pixel-art sprites (hamster, crate, bottle, seeds, wheel)
site/js/leaderboard.js   localStorage top 10
site/js/share-card.js    1200x630 PNG share card
site/js/i18n.js          中文 / English strings
site/js/app.js           page wiring
site/js/overlay.js       overlay wiring
site/favicon.svg, site/og-image.png
scripts/build.mjs        site/ -> dist/ copy + URL check
dist/                    committed static export
DESIGN.md                design system as implemented
VALIDATION.md            checks run, design review, limitations
```

## 验证结果 / Validation

完整记录见 [VALIDATION.md](VALIDATION.md)。摘要 / Summary (run on 2026-10-30):

- `npm run typecheck`: exit 0, no errors.
- `npm run build`: `dist/ built: 14 files, all local URLs relative and present`.
- Playwright (Chromium) interaction test against the served `dist/` under a `/preview/` subpath: 31/31 checks passed. Live data arrived in under 1 s at 320, 390 and 1440 wide. No console errors and no horizontal scroll. The block number and progress matched the formula used by sepolia.squeekchain.com, computed from a separate API call. The test also covered: sleep mode on IDLE, the x2 block bonus on a height increase, the failure banner keeping the last data and then recovering, start/jump/game over, the share card and PNG download, the X link, leaderboard rename, keyboard restart, the language toggle, and the overlay with a transparent background.
- Design probe `taste.mjs`: 16/16 checks passed.
- Not performed: WebKit/Safari, because the machine lacks WebKit's system libraries. Also not performed: real-device tests, screen-reader sessions, and watching a real block cross 100% live (that was simulated with mocked API responses).
