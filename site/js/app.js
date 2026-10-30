/* Wires the live feed, the game, the leaderboard and the share card to the page. */
(function () {
  "use strict";
  const SWR = window.SWR;
  const { t } = SWR.i18n;
  const $ = (id) => document.getElementById(id);

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => motionQuery.matches;

  const el = {
    blockLabel: $("block-label"),
    blockPct: $("block-pct"),
    blockBar: $("block-bar"),
    blockFill: $("block-fill"),
    rpm: $("rpm"),
    wheelState: $("wheel-state"),
    wheelSpokes: $("wheel-spokes"),
    minted: $("minted"),
    feedError: $("feed-error"),
    score: $("score"),
    best: $("best"),
    bonus: $("bonus"),
    stage: $("stage"),
    overlay: $("stage-overlay"),
    stageTitle: $("stage-title"),
    start: $("start"),
    toast: $("toast"),
    sleepNote: $("sleep-note"),
    play: $("play"),
    result: $("result"),
    resultScore: $("result-score"),
    resultMeta: $("result-meta"),
    name: /** @type {HTMLInputElement} */ ($("player-name")),
    cardImg: /** @type {HTMLImageElement} */ ($("card-img")),
    download: /** @type {HTMLAnchorElement} */ ($("download")),
    postX: /** @type {HTMLAnchorElement} */ ($("post-x")),
    boardEmpty: $("board-empty"),
    boardTable: $("board-table"),
    boardBody: $("board-body"),
    overlayUrl: $("overlay-url"),
  };

  let feed = null; // last snapshot from SWR.data
  let lastRun = null;
  let lastRunId = null;

  // ---------- live data ----------

  function rpmText(rpm) {
    return (Math.round(rpm * 10) / 10).toFixed(1);
  }
  function buildingBlock(s) {
    // builder.projected.blockHeight counts finished blocks; the one being built is +1.
    return s.blockHeight === null ? null : (s.blockHeight + 1n).toString();
  }

  function renderLive() {
    const s = feed;
    if (!s) return;
    const block = buildingBlock(s);
    if (block !== null) {
      el.blockLabel.textContent = t("blockLabel") + " " + t("blockValue", { n: block });
      el.blockPct.textContent = s.progressPct.toFixed(2) + "%";
      el.blockFill.style.transform = "scaleX(" + Math.min(1, s.progressPct / 100) + ")";
      el.blockBar.setAttribute("aria-valuenow", String(s.progressPct));
    } else {
      el.blockLabel.textContent = t("blockLabel");
      el.blockPct.textContent = s.error ? t("noData") : "…";
    }
    el.rpm.textContent = s.hasStatus ? rpmText(s.rpm) : s.error ? t("noData") : "…";
    el.minted.textContent =
      s.mintedWhole !== null
        ? SWR.i18n.num(s.mintedWhole) + "." + String(s.mintedCents).padStart(2, "0")
        : s.error
          ? t("noData")
          : "…";

    let state = "loading";
    if (s.hasStatus) state = s.coreStatus === "COUNTER_FAULT" ? "fault" : s.running ? "running" : "sleeping";
    el.wheelState.dataset.state = state;
    el.wheelState.textContent =
      state === "running" ? t("wheelRunning") : state === "sleeping" ? t("wheelSleeping") : state === "fault" ? t("wheelFault") : t("loading");
    el.sleepNote.hidden = !(s.hasStatus && !s.running);
    el.feedError.textContent = s.error ? t("fetchFailedKeep") : "";
  }

  function onFeed(snapshot, info) {
    feed = snapshot;
    if (snapshot.hasStatus) {
      game.setLive({ rpm: snapshot.rpm, sleeping: !snapshot.running });
    }
    if (info.newBlocks > 0) {
      game.blockBonus();
      showToast(t("bonusToast", { n: (snapshot.blockHeight).toString() }));
    }
    renderLive();
  }

  let toastTimer = 0;
  function showToast(text) {
    el.toast.textContent = text;
    el.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.toast.classList.remove("is-on");
      el.toast.textContent = "";
    }, 4000);
  }

  // The header wheel turns at the real rpm (measurement.rpmMilli / 1000).
  let wheelAngle = 0;
  let lastT = performance.now();
  function spin(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    if (feed && !reducedMotion()) {
      wheelAngle = (wheelAngle + (feed.rpm / 60) * 360 * dt) % 360;
      el.wheelSpokes.setAttribute("transform", "rotate(" + wheelAngle.toFixed(1) + " 16 16)");
    }
    requestAnimationFrame(spin);
  }
  requestAnimationFrame(spin);

  // ---------- game ----------

  const game = SWR.createGame(/** @type {HTMLCanvasElement} */ ($("game")), {
    reducedMotion,
    onScore(score, bonusMs) {
      el.score.textContent = SWR.i18n.num(score);
      if (bonusMs > 0) {
        el.bonus.hidden = false;
        el.bonus.textContent = t("bonusActive", { s: Math.ceil(bonusMs / 1000) });
      } else {
        el.bonus.hidden = true;
      }
    },
    onState(state) {
      el.overlay.hidden = state === "running";
      el.stage.classList.toggle("is-running", state === "running");
    },
    onOver(run) {
      finishRun(run);
    },
  });

  // keep the x2 timer ticking in the HUD while the menu is shown
  setInterval(() => {
    if (game.state !== "running") {
      const ms = game.bonusLeft();
      el.bonus.hidden = ms <= 0;
      if (ms > 0) el.bonus.textContent = t("bonusActive", { s: Math.ceil(ms / 1000) });
    }
  }, 250);

  function startRun() {
    el.stageTitle.hidden = true;
    game.start();
    el.play.focus({ preventScroll: true });
  }

  el.start.addEventListener("click", startRun);

  function isTyping(target) {
    return target instanceof HTMLElement && target.closest("input, textarea, select, button, a");
  }

  document.addEventListener("keydown", (e) => {
    if (!(e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")) return;
    if (isTyping(e.target)) return;
    if (game.state === "running") {
      e.preventDefault();
      if (!e.repeat) game.jumpPress();
    } else if (e.code === "Space" && document.activeElement === el.play) {
      e.preventDefault();
      startRun();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") game.jumpRelease();
  });
  el.stage.addEventListener("pointerdown", (e) => {
    if (game.state !== "running") return;
    e.preventDefault();
    game.jumpPress();
  });
  window.addEventListener("pointerup", () => game.jumpRelease());
  window.addEventListener("pointercancel", () => game.jumpRelease());

  // ---------- results, leaderboard, share card ----------

  function playerName() {
    const v = el.name.value.trim();
    return v || t("nameDefault");
  }

  function finishRun(run) {
    const block = feed ? buildingBlock(feed) : null;
    lastRun = {
      score: run.score,
      // the real wheel speed at the moment the run ended (measurement.rpmMilli / 1000);
      // null when no status measurement has arrived yet, never a made-up 0.0
      rpm: feed && feed.hasStatus ? rpmText(feed.rpm) : null,
      block: block || "?",
      progress: feed && feed.progressPct !== null ? feed.progressPct.toFixed(2) : null,
      at: Date.now(),
    };
    lastRunId = SWR.board.add({
      name: playerName(),
      score: lastRun.score,
      rpm: lastRun.rpm === null ? null : Number(lastRun.rpm),
      block: lastRun.block,
      at: lastRun.at,
    });
    renderBoard();
    renderResult();
    el.result.hidden = false;
    el.stageTitle.hidden = false;
    el.stageTitle.textContent = t("gameOver") + " · " + t("resultScore", { score: SWR.i18n.num(run.score) });
    el.start.textContent = t("runAgain");
    el.start.focus({ preventScroll: true });
  }

  function renderResult() {
    if (!lastRun) return;
    const wheel = lastRun.rpm === null ? t("noData") : lastRun.rpm + " rpm";
    const vars = { score: SWR.i18n.num(lastRun.score), rpm: lastRun.rpm, wheel, block: lastRun.block };
    el.resultScore.textContent = t("resultScore", vars);
    el.resultMeta.textContent = t("resultMeta", vars);
    const url = SWR.shareCard.render({
      score: lastRun.score,
      rpm: lastRun.rpm,
      block: lastRun.block,
      progress: lastRun.progress,
      date: new Date(lastRun.at).toISOString().slice(0, 10),
      labels: {
        score: t("score"),
        rpm: t("rpmLabel") + " " + wheel,
        block: t("blockLabel") + " #" + lastRun.block + (lastRun.progress ? " · " + lastRun.progress + "%" : ""),
      },
    });
    el.cardImg.src = url;
    el.cardImg.alt = t("cardAlt", vars);
    el.download.href = url;
    el.download.download = "squeek-wheel-runner-" + lastRun.score + ".png";
    el.postX.href =
      "https://x.com/intent/tweet?text=" + encodeURIComponent(t(lastRun.rpm === null ? "shareTextNoRpm" : "shareText", vars) + " @shimis_88");
  }

  el.name.addEventListener("change", () => {
    try {
      localStorage.setItem("swr.name", el.name.value.trim());
    } catch (_) {
      /* ignore */
    }
    if (lastRunId) {
      SWR.board.rename(lastRunId, playerName());
      renderBoard();
    }
  });

  function renderBoard() {
    const list = SWR.board.load();
    el.best.textContent = SWR.i18n.num(list.length ? list[0].score : 0);
    el.boardEmpty.hidden = list.length > 0;
    el.boardTable.hidden = list.length === 0;
    el.boardBody.textContent = "";
    list.forEach((e, i) => {
      const tr = document.createElement("tr");
      if (e.id === lastRunId) tr.className = "is-latest";
      const cells = [String(i + 1), e.name, SWR.i18n.num(e.score), typeof e.rpm === "number" ? rpmText(e.rpm) : t("noData"), "#" + e.block];
      cells.forEach((text, k) => {
        const td = document.createElement(k === 0 ? "th" : "td");
        if (k === 0) td.setAttribute("scope", "row");
        if (k >= 2) td.className = "r num";
        td.textContent = text;
        tr.appendChild(td);
      });
      el.boardBody.appendChild(tr);
    });
  }

  // ---------- language ----------

  $("lang-toggle").addEventListener("click", () => SWR.i18n.setLang(SWR.i18n.lang === "zh" ? "en" : "zh"));
  SWR.i18n.onChange(() => {
    document.title = t("docTitle");
    if (game.state === "over" && lastRun) {
      el.start.textContent = t("runAgain");
      el.stageTitle.textContent = t("gameOver") + " · " + t("resultScore", { score: SWR.i18n.num(lastRun.score) });
    }
    if (!el.name.value || el.name.value === "仓鼠" || el.name.value === "Hamster") el.name.value = t("nameDefault");
    renderLive();
    renderResult();
    renderBoard();
  });

  // ---------- boot ----------

  SWR.i18n.apply();
  document.title = t("docTitle");
  try {
    el.name.value = localStorage.getItem("swr.name") || t("nameDefault");
  } catch (_) {
    el.name.value = t("nameDefault");
  }
  el.overlayUrl.textContent = new URL("overlay/", location.href).href;
  renderBoard();
  SWR.data.startFeed(onFeed);
})();
