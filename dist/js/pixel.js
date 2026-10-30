/* Pixel-art sprites drawn from character maps. One character = one pixel. */
(function () {
  "use strict";
  /** @type {Record<string, any>} */
  const SWR = (window.SWR = window.SWR || {});

  const PALETTE = {
    o: "#3a2410", // outline
    b: "#e89a3c", // fur
    d: "#c9772a", // fur shade
    w: "#fff4dc", // belly
    p: "#f59aa6", // ears, nose, cheek
    e: "#1a1008", // eye
    h: "#ffffff", // eye highlight
    k: "#8a5a2b", // wood
    K: "#5e3a17", // wood dark
    s: "#2f2a26", // seed dark
    S: "#e9e2cf", // seed stripe
    g: "#ffd23f", // gold
    G: "#b8860b", // gold dark
    c: "#bfe3f2", // bottle
    C: "#5aa7c9", // bottle dark
    r: "#e5534b", // bottle cap
  };

  // 16 x 12 hamster facing right. Three frames: run A, run B, sleep.
  const BODY = [
    "....oo....oo....",
    "...opbo..obpo...",
    "..obbbbbbbbbbo..",
    ".obbbbbbbbbbbbo.",
    "obdbbbbbbbbehbo.",
    "obdbbbbbbbbeebpo",
    "obdbbbbbbwwwwbo.",
    "obddbbbbwwwwpwo.",
    ".obdbbbwwwwwwo..",
    "..oobbbbbbbboo..",
  ];
  const FEET_A = ["...oo.....oo....", "..........o....."];
  const FEET_B = ["..oo.......oo...", "...o............"];
  const SLEEP_EYES = { 4: "obdbbbbbbbbbbbo.", 5: "obdbbbbbbbboobpo" };

  const SPRITES = {
    hamsterA: BODY.concat(FEET_A),
    hamsterB: BODY.concat(FEET_B),
    hamsterSleep: BODY.map((row, i) => SLEEP_EYES[i] || row).concat(FEET_A),
    crate: [
      "KKKKKKKKKKKK",
      "KkkkkkkkkkkK",
      "KkKkkkkkkKkK",
      "KkkKkkkkKkkK",
      "KkkkKkkKkkkK",
      "KkkkkKKkkkkK",
      "KkkkkKKkkkkK",
      "KkkkKkkKkkkK",
      "KkkKkkkkKkkK",
      "KkKkkkkkkKkK",
      "KkkkkkkkkkkK",
      "KKKKKKKKKKKK",
    ],
    bottle: [
      "..rrrr..",
      "..rrrr..",
      "...CC...",
      "..CccC..",
      ".CccccC.",
      ".CccccC.",
      ".CccccC.",
      ".CcCccC.",
      ".CcCccC.",
      ".CccccC.",
      ".CccccC.",
      ".CcCccC.",
      ".CcCccC.",
      ".CccccC.",
      ".CccccC.",
      ".CCCCCC.",
    ],
    seed: ["..s..", ".sSs.", ".sSs.", "ssSss", "sSsSs", ".sSs.", "..s.."],
    seedGold: ["..G..", ".GgG.", ".GgG.", "GGgGG", "GgGgG", ".GgG.", "..G.."],
  };

  /**
   * Draws a sprite with its top-left at (x, y), each pixel `scale` units wide.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} name
   * @param {number} x
   * @param {number} y
   * @param {number} [scale]
   */
  function draw(ctx, name, x, y, scale) {
    const s = scale || 1;
    const rows = SPRITES[name];
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const col = PALETTE[row[i]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + i * s), Math.round(y + j * s), s, s);
      }
    }
  }

  /** @param {string} name */
  function size(name) {
    const rows = SPRITES[name];
    return { w: rows[0].length, h: rows.length };
  }

  /**
   * Hamster wheel ring with spokes, rotated by `angle` radians.
   * @param {CanvasRenderingContext2D} ctx
   */
  function wheel(ctx, cx, cy, r, angle, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, r / 8);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, r / 14);
    for (let k = 0; k < 6; k++) {
      const a = angle + (k * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  SWR.pixel = { draw, size, wheel, PALETTE, SPRITES };
})();
