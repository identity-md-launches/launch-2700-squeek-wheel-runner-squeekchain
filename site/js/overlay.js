/*
 * OBS overlay (/overlay/). Transparent page with only: live rpm, block progress
 * and the best score from the local leaderboard. ?lang=en switches language.
 */
(function () {
  "use strict";
  const SWR = window.SWR;
  const { t } = SWR.i18n;
  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let feed = null;

  function render() {
    if (!feed) return;
    // measurement.rpmMilli / 1000
    $("rpm").textContent = feed.hasStatus ? (Math.round(feed.rpm * 10) / 10).toFixed(1) : t("noData");
    if (feed.blockHeight !== null) {
      // builder.projected.blockHeight + 1 is the block being built, as on sepolia.squeekchain.com
      $("block-label").textContent = t("ovBlock", { n: (feed.blockHeight + 1n).toString() });
      $("block-pct").textContent = feed.progressPct.toFixed(2) + "%";
      $("block-fill").style.transform = "scaleX(" + Math.min(1, feed.progressPct / 100) + ")";
    }
    $("feed-error").textContent = feed.error ? t("fetchFailed") : "";
  }

  function renderBest() {
    $("best").textContent = SWR.i18n.num(SWR.board.best());
  }

  // the game tab writes scores; the overlay picks them up live
  window.addEventListener("storage", (e) => {
    if (e.key === SWR.board.KEY) renderBest();
  });
  setInterval(renderBest, 5000);

  let angle = 0;
  let last = performance.now();
  function spin(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (feed && !reduced.matches) {
      angle = (angle + (feed.rpm / 60) * 360 * dt) % 360;
      $("wheel-spokes").setAttribute("transform", "rotate(" + angle.toFixed(1) + " 16 16)");
    }
    requestAnimationFrame(spin);
  }
  requestAnimationFrame(spin);

  SWR.i18n.apply();
  renderBest();
  SWR.data.startFeed((s) => {
    feed = s;
    render();
  });
})();
