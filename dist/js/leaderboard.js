/* Local leaderboard: top 10 runs in localStorage under "swr.scores". Nothing leaves the browser. */
(function () {
  "use strict";
  /** @type {Record<string, any>} */
  const SWR = (window.SWR = window.SWR || {});
  const KEY = "swr.scores";
  const MAX = 10;

  /** @returns {{id: string, name: string, score: number, rpm: number | null, block: string, at: number}[]} */
  function load() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(list) ? list.filter((e) => e && typeof e.score === "number").slice(0, MAX) : [];
    } catch (_) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (_) {
      /* storage full or blocked: the run still shows on screen */
    }
  }

  /** Adds a run; returns its id when it made the top 10, otherwise null. */
  function add(entry) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const list = load();
    list.push(Object.assign({ id }, entry));
    list.sort((a, b) => b.score - a.score || a.at - b.at);
    const top = list.slice(0, MAX);
    save(top);
    return top.some((e) => e.id === id) ? id : null;
  }

  function rename(id, name) {
    const list = load();
    const e = list.find((x) => x.id === id);
    if (e) {
      e.name = name;
      save(list);
    }
  }

  function best() {
    const list = load();
    return list.length ? list[0].score : 0;
  }

  SWR.board = { load, add, rename, best, KEY };
})();
