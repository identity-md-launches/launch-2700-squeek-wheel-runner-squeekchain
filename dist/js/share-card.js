/* Share card: a 1200 x 630 PNG drawn on a canvas, offered as a download. */
(function () {
  "use strict";
  /** @type {Record<string, any>} */
  const SWR = (window.SWR = window.SWR || {});

  /**
   * @param {{score: number, rpm: string, block: string, progress: string, date: string, labels: {score: string, rpm: string, block: string}}} run
   * @returns {string} PNG data URL
   */
  function render(run) {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 630;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#ffd95e";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#fff2c4";
    ctx.fillRect(0, 470, 1200, 160);
    ctx.fillStyle = "#3a2410";
    ctx.fillRect(0, 470, 1200, 8);

    SWR.pixel.wheel(ctx, 900, 300, 200, 0.3, "#e2b443");
    SWR.pixel.draw(ctx, "hamsterA", 760, 230, 15);

    const font = 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.fillStyle = "#2e1f0b";
    ctx.textBaseline = "alphabetic";
    ctx.font = "700 44px " + font;
    ctx.fillText("Squeek Wheel Runner", 64, 100);
    ctx.font = "400 34px " + font;
    ctx.fillText(run.labels.score, 64, 190);
    ctx.font = "700 150px " + font;
    ctx.fillText(SWR.i18n.num(run.score), 56, 330);
    ctx.font = "700 36px " + font;
    ctx.fillText(run.labels.rpm, 64, 410);
    ctx.fillText(run.labels.block, 64, 456);
    ctx.font = "400 30px " + font;
    ctx.fillText(run.date + "  ·  @shimis_88", 64, 560);
    return c.toDataURL("image/png");
  }

  SWR.shareCard = { render };
})();
