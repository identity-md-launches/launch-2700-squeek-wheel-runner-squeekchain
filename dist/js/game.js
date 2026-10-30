/*
 * The runner. Draws at 240 x 135 game pixels; CSS scales the canvas up with
 * `image-rendering: pixelated`. Live data enters only through setLive() and
 * blockBonus(), so the game keeps running on the last values when a fetch fails.
 */
(function () {
  "use strict";
  /** @type {Record<string, any>} */
  const SWR = (window.SWR = window.SWR || {});
  const px = SWR.pixel;

  const W = 240;
  const H = 135;
  const GROUND = 113;
  const HAM_X = 30;
  const JUMP_V = 272;
  const GRAVITY_HOLD = 900;
  const GRAVITY_FALL = 1900;
  const SEED_POINTS = 10;
  const BONUS_MS = 10000;

  /** Speed in game px/s from the live wheel. */
  function targetSpeed(live, elapsed) {
    if (live.sleeping) return 46 + Math.min(20, elapsed * 0.4);
    // measurement.rpmMilli / 1000 -> rpm. 0 rpm while "running" still gives a base pace.
    const rpm = Math.max(0, Math.min(120, live.rpm || 0));
    return 68 + rpm * 0.6 + Math.min(40, elapsed * 0.8);
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{onScore?: Function, onOver?: Function, onState?: Function, reducedMotion?: () => boolean}} hooks
   */
  function createGame(canvas, hooks) {
    const ctx = canvas.getContext("2d");
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    const live = { rpm: 0, sleeping: false };
    let gotLive = false;
    let state = "ready"; // ready | running | over
    let speed = 70;
    let night = 0; // 0 day .. 1 night, eased toward live.sleeping
    let elapsed = 0;
    let distance = 0;
    let seeds = 0;
    let seedPoints = 0;
    let score = 0;
    let obstacles = [];
    let pickups = [];
    let nextSpawn = 120;
    let ham = { y: GROUND - 12, vy: 0, grounded: true, holding: false, frameT: 0 };
    let bufferedJump = 0;
    let bonusUntil = 0;
    let flash = 0;
    let wheelAngle = 0;
    let scroll = 0;
    let last = performance.now();
    const stars = Array.from({ length: 28 }, (_, i) => ({ x: (i * 73) % W, y: (i * 37) % 64 + 5 }));

    function setState(s) {
      state = s;
      hooks.onState && hooks.onState(s);
    }

    function reset() {
      elapsed = 0;
      distance = 0;
      seeds = 0;
      seedPoints = 0;
      score = 0;
      obstacles = [];
      pickups = [];
      nextSpawn = 120;
      speed = targetSpeed(live, 0);
      ham = { y: GROUND - 12, vy: 0, grounded: true, holding: false, frameT: 0 };
      bufferedJump = 0;
    }

    function start() {
      reset();
      setState("running");
      emitScore();
    }

    function jumpPress() {
      if (state !== "running") return;
      ham.holding = true;
      if (ham.grounded) doJump();
      else bufferedJump = 0.12;
    }
    function jumpRelease() {
      ham.holding = false;
    }
    function doJump() {
      ham.vy = -JUMP_V;
      ham.grounded = false;
      bufferedJump = 0;
    }

    function bonusLeft() {
      return Math.max(0, bonusUntil - performance.now());
    }
    function blockBonus() {
      bonusUntil = performance.now() + BONUS_MS;
      flash = 1;
    }

    function emitScore() {
      hooks.onScore && hooks.onScore(score, bonusLeft());
    }

    function spawn() {
      const kinds = elapsed > 20 ? ["crate", "bottle", "stack"] : ["crate", "bottle"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const x = W + 8;
      if (kind === "stack") {
        obstacles.push({ x, y: GROUND - 12, w: 12, h: 12, sprite: "crate" });
        obstacles.push({ x, y: GROUND - 24, w: 12, h: 12, sprite: "crate" });
      } else {
        const s = px.size(kind);
        obstacles.push({ x, y: GROUND - s.h, w: s.w, h: s.h, sprite: kind });
      }
      // An arc of seeds over the obstacle rewards the jump.
      if (Math.random() < 0.7) {
        [-20, 4, 28].forEach((dx, i) => pickups.push({ x: x + dx, y: GROUND - (i === 1 ? 50 : 38), taken: false }));
      }
      // Seeds on the ground in the gap after it.
      const gap = speed * 0.72 + 70 + Math.random() * 120;
      if (Math.random() < 0.5) {
        for (let k = 0; k < 3; k++) pickups.push({ x: x + 40 + k * 12, y: GROUND - 10, taken: false });
      }
      nextSpawn = gap;
    }

    function hit(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function update(dt) {
      const sleepTarget = live.sleeping ? 1 : 0;
      night += (sleepTarget - night) * Math.min(1, dt * 1.5);
      // measurement.rpmMilli drives the background wheel: rpm/60 turns per second.
      if (!hooks.reducedMotion || !hooks.reducedMotion()) wheelAngle += ((live.rpm || 0) / 60) * Math.PI * 2 * dt;
      flash = Math.max(0, flash - dt * 1.2);

      if (state === "running") {
        elapsed += dt;
        const target = targetSpeed(live, elapsed);
        speed += (target - speed) * Math.min(1, dt * 0.8);
        const dx = speed * dt;
        distance += dx;
        scroll += dx;

        // hamster physics
        if (!ham.grounded) {
          const g = ham.holding && ham.vy < 0 ? GRAVITY_HOLD : GRAVITY_FALL;
          ham.vy += g * dt;
          ham.y += ham.vy * dt;
          if (ham.y >= GROUND - 12) {
            ham.y = GROUND - 12;
            ham.vy = 0;
            ham.grounded = true;
            if (bufferedJump > 0) doJump();
          }
        }
        bufferedJump = Math.max(0, bufferedJump - dt);
        ham.frameT += dt * (speed / 40);

        nextSpawn -= dx;
        if (nextSpawn <= 0) spawn();
        obstacles.forEach((o) => (o.x -= dx));
        pickups.forEach((p) => (p.x -= dx));
        obstacles = obstacles.filter((o) => o.x + o.w > -4);
        pickups = pickups.filter((p) => p.x > -8 && !p.taken);

        const box = { x: HAM_X + 3, y: ham.y + 3, w: 10, h: 8 };
        const bonus = bonusLeft() > 0;
        for (const p of pickups) {
          if (!p.taken && hit(box, { x: p.x - 1, y: p.y - 1, w: 7, h: 9 })) {
            p.taken = true;
            seeds++;
            seedPoints += bonus ? SEED_POINTS * 2 : SEED_POINTS;
          }
        }
        score = Math.floor(distance / 20) + seedPoints;
        for (const o of obstacles) {
          if (hit(box, { x: o.x + 1, y: o.y + 1, w: o.w - 2, h: o.h - 1 })) {
            setState("over");
            emitScore();
            hooks.onOver && hooks.onOver({ score, seeds, seconds: Math.round(elapsed) });
            return;
          }
        }
        emitScore();
      } else if (state === "ready") {
        const reduced = hooks.reducedMotion && hooks.reducedMotion();
        if (!reduced) {
          scroll += 30 * dt;
          ham.frameT += dt * 1.5;
        }
      }
    }

    function mix(a, b, t) {
      const pa = parseInt(a.slice(1), 16);
      const pb = parseInt(b.slice(1), 16);
      const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
      return "#" + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("");
    }

    function render() {
      const n = night;
      // sky in four flat bands
      const top = mix("#ffd95e", "#1b2246", n);
      const bottom = mix("#fff2c4", "#34407a", n);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = mix(top, bottom, i / 3);
        ctx.fillRect(0, i * 21, W, 21);
      }
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 84, W, GROUND - 84);

      // stars and moon / sun
      if (n > 0.05) {
        ctx.globalAlpha = n;
        ctx.fillStyle = "#fff6cf";
        stars.forEach((s) => ctx.fillRect(Math.round((s.x - scroll * 0.02 + W) % W), s.y, 1, 1));
        ctx.fillRect(196, 12, 12, 12);
        ctx.fillStyle = mix("#ffd95e", "#1b2246", n);
        ctx.fillRect(200, 10, 10, 10);
        ctx.globalAlpha = 1;
      }
      if (n < 0.95) {
        ctx.globalAlpha = 1 - n;
        ctx.fillStyle = "#fff8e0";
        ctx.fillRect(196, 12, 14, 14);
        ctx.globalAlpha = 1;
      }

      // the big wheel in the background turns at the real rpm
      px.wheel(ctx, 178, 70, 36, wheelAngle, mix("#e2b443", "#5161a3", n));

      // far blocky hills
      ctx.fillStyle = mix("#f2c75c", "#27305e", n);
      for (let x = 0; x < W; x += 8) {
        const wx = x + scroll * 0.25;
        const h = 14 + Math.round(Math.sin(wx / 37) * 6 + Math.sin(wx / 13) * 2);
        ctx.fillRect(x, GROUND - h, 8, h);
      }

      // bedding floor
      ctx.fillStyle = mix("#e9c27a", "#4b4265", n);
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = mix("#c99a4a", "#383150", n);
      ctx.fillRect(0, GROUND, W, 2);
      for (let i = 0; i < 30; i++) {
        const x = Math.round((((i * 47) % W) - scroll + W * 4) % W);
        ctx.fillRect(x, GROUND + 5 + ((i * 13) % 16), 3, 1);
      }

      // pickups
      const bonus = bonusLeft() > 0;
      pickups.forEach((p) => px.draw(ctx, bonus ? "seedGold" : "seed", p.x, p.y));
      // obstacles
      obstacles.forEach((o) => px.draw(ctx, o.sprite, o.x, o.y));

      // hamster
      let sprite = Math.floor(ham.frameT * 4) % 2 ? "hamsterB" : "hamsterA";
      if (!ham.grounded) sprite = "hamsterA";
      if (live.sleeping && state !== "over") sprite = "hamsterSleep";
      px.draw(ctx, sprite, HAM_X, Math.round(ham.y));
      if (live.sleeping && state !== "over") {
        ctx.fillStyle = "#fff6cf";
        const bob = Math.floor(ham.frameT * 2) % 2;
        ctx.fillRect(HAM_X + 15, ham.y - 6 - bob, 3, 1);
        ctx.fillRect(HAM_X + 17, ham.y - 5 - bob, 1, 1);
        ctx.fillRect(HAM_X + 15, ham.y - 4 - bob, 3, 1);
      }
      if (state === "over") {
        ctx.fillStyle = "#e5534b";
        ctx.fillRect(HAM_X + 6, ham.y - 6, 2, 2);
        ctx.fillRect(HAM_X + 10, ham.y - 8, 2, 2);
      }

      // block bonus: gold flash, then a gold frame while x2 lasts
      if (flash > 0) {
        ctx.fillStyle = "rgba(255, 210, 63," + (flash * 0.6).toFixed(3) + ")";
        ctx.fillRect(0, 0, W, H);
      }
      if (bonus) {
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(0, 0, W, 3);
        ctx.fillRect(0, H - 3, W, 3);
        ctx.fillRect(0, 0, 3, H);
        ctx.fillRect(W - 3, 0, 3, H);
      }
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      render();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame((t) => {
      last = t;
      requestAnimationFrame(frame);
    });
    render();

    return {
      start,
      jumpPress,
      jumpRelease,
      blockBonus,
      bonusLeft,
      /** @param {{rpm: number, sleeping: boolean}} next */
      setLive(next) {
        live.rpm = next.rpm;
        live.sleeping = next.sleeping;
        // first reading: show day or night at once instead of fading in
        if (!gotLive) night = next.sleeping ? 1 : 0;
        gotLive = true;
      },
      get state() {
        return state;
      },
      get score() {
        return score;
      },
      get speed() {
        return speed;
      },
    };
  }

  SWR.createGame = createGame;
})();
