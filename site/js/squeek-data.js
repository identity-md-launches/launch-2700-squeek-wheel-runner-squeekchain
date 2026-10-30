/*
 * Live Squeekchain data feed.
 *
 * Both endpoints are public and send `Access-Control-Allow-Origin: *`, so the
 * browser fetches them directly; there is no backend.
 *
 *   GET https://api.squeekchain.com/v1/status
 *   GET https://api.squeekchain.com/v1/economy/state
 *
 * Every 10 seconds both are fetched again. If a request fails, the last good
 * values stay in place, the game keeps running on them, and `error` is set so
 * the page can say "data fetch failed, retrying in 10 s".
 */
(function () {
  "use strict";
  /** @type {Record<string, any>} */
  const SWR = (window.SWR = window.SWR || {});

  const API = "https://api.squeekchain.com/v1";
  const REFRESH_MS = 10000;
  const TIMEOUT_MS = 8000;
  // Core V3 constant `blockUnitsPerBlock`: one block = 1e9 block units, so
  // blockProgress / 1e9 is the fraction of the block that is built.
  const BLOCK_UNITS = 1000000000n;
  // economy/state `asset.decimals` is 18 for SQK: base units / 1e18 = SQK.
  const SQK_DECIMALS = 18n;

  /**
   * Reads GET /v1/status.
   * @param {any} json
   */
  function parseStatus(json) {
    // measurement.* comes from the wheel counter (provenance "hardware").
    const m = json && json.measurement ? json.measurement : {};
    // Without a numeric rpmMilli there is no wheel reading in this response;
    // the feed then keeps the previous measurement instead of inventing 0 rpm.
    const hasMeasurement = Number.isFinite(m.rpmMilli);
    // measurement.rpmMilli: wheel revolutions per minute x 1000 (integer).
    const rpm = Number.isFinite(m.rpmMilli) ? m.rpmMilli / 1000 : 0;
    // measurement.speedMmPerSecond: rim speed of the wheel in mm/s.
    const speedMmPerSecond = Number.isFinite(m.speedMmPerSecond) ? m.speedMmPerSecond : 0;
    // measurement.coreStatus: "ACTIVE" (the brief calls it SPINNING), "IDLE" or
    // "COUNTER_FAULT". Like sepolia.squeekchain.com, any non-zero rpm or speed
    // also counts as running, so a late status flag never puts the hamster to
    // sleep while the wheel is turning.
    const coreStatus = typeof m.coreStatus === "string" ? m.coreStatus : "IDLE";
    const running =
      coreStatus === "ACTIVE" || coreStatus === "SPINNING" || rpm > 0 || speedMmPerSecond > 0;
    // measurement.freshness: "online" while the counter reports in time.
    const freshness = typeof m.freshness === "string" ? m.freshness : "unknown";

    // builder.status === "available" means the block builder data is valid.
    // builder.anchor is the last state confirmed on Sepolia; builder.projected
    // adds rounds the oracle accepted but not yet settled. sepolia.squeekchain.com
    // shows builder.projected (falling back to anchor here when it is missing),
    // so the game shows the same numbers:
    //   building block = projected.blockHeight + 1
    //   progress %     = floor(projected.blockProgress * 10000 / 1e9) / 100
    let blockHeight = null;
    let progressPct = null;
    const b = json && json.builder;
    if (b && b.status === "available") {
      const head = b.projected || b.anchor;
      if (head && /^\d+$/.test(String(head.blockHeight)) && /^\d+$/.test(String(head.blockProgress))) {
        // builder.projected.blockHeight: number of completed blocks (string uint64).
        blockHeight = BigInt(head.blockHeight);
        // builder.projected.blockProgress: block units built into the next block (0 .. 1e9-1).
        progressPct = Number((BigInt(head.blockProgress) * 10000n) / BLOCK_UNITS) / 100;
      }
    }
    return { hasMeasurement, rpm, speedMmPerSecond, coreStatus, running, freshness, blockHeight, progressPct };
  }

  /**
   * Reads GET /v1/economy/state.
   * @param {any} json
   */
  function parseEconomy(json) {
    // supply.totalMintedBaseUnits: every SQK ever minted (premint + mining),
    // as a decimal string of base units. Divide by 1e18 for SQK.
    const raw = json && json.supply ? json.supply.totalMintedBaseUnits : null;
    if (!/^\d+$/.test(String(raw))) return { mintedWhole: null, mintedCents: null };
    const units = BigInt(raw);
    const one = 10n ** SQK_DECIMALS;
    return {
      mintedWhole: units / one,
      // two decimals, rounded down
      mintedCents: Number(((units % one) * 100n) / one),
    };
  }

  /** @param {string} url */
  async function getJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Starts polling. `onUpdate(snapshot, info)` runs after every attempt.
   * `info.newBlocks` > 0 when the block height went up since the last
   * successful read, i.e. the real block progress crossed 100%.
   * @param {(snapshot: any, info: {newBlocks: number}) => void} onUpdate
   */
  function startFeed(onUpdate) {
    const snapshot = {
      hasStatus: false,
      hasEconomy: false,
      rpm: 0,
      speedMmPerSecond: 0,
      coreStatus: "IDLE",
      running: false,
      freshness: "unknown",
      blockHeight: null,
      progressPct: null,
      mintedWhole: null,
      mintedCents: null,
      error: false,
      updatedAt: null,
    };
    let timer = 0;

    async function tick() {
      clearTimeout(timer);
      const [status, economy] = await Promise.allSettled([
        getJson(API + "/status"),
        getJson(API + "/economy/state"),
      ]);
      let newBlocks = 0;
      let failed = false;

      if (status.status === "fulfilled") {
        const { hasMeasurement, blockHeight, progressPct, ...measurement } = parseStatus(status.value);
        // measurement.* and builder.* are kept separately: an unusable half
        // (e.g. builder.status "unavailable") leaves the last good values of
        // that half in place, so the block label, bar, bonus detector and
        // share card keep agreeing on the last valid block.
        if (hasMeasurement) Object.assign(snapshot, measurement, { hasStatus: true });
        else failed = true;
        if (blockHeight !== null) {
          // compared against the last valid height, so blocks finished while
          // the builder was unavailable still trigger the bonus on recovery
          if (snapshot.blockHeight !== null && blockHeight > snapshot.blockHeight) {
            newBlocks = Number(blockHeight - snapshot.blockHeight);
          }
          snapshot.blockHeight = blockHeight;
          snapshot.progressPct = progressPct;
        } else {
          failed = true;
        }
      } else {
        failed = true;
      }

      if (economy.status === "fulfilled") {
        const e = parseEconomy(economy.value);
        if (e.mintedWhole !== null) Object.assign(snapshot, e, { hasEconomy: true });
        else failed = true;
      } else {
        failed = true;
      }

      snapshot.error = failed;
      if (!failed) snapshot.updatedAt = new Date();
      try {
        onUpdate(snapshot, { newBlocks });
      } finally {
        timer = window.setTimeout(tick, REFRESH_MS);
      }
    }

    tick();
    return { snapshot, refresh: tick };
  }

  SWR.data = { startFeed, parseStatus, parseEconomy, REFRESH_MS };
})();
