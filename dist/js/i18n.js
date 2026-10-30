/* Chinese / English strings. Elements carry data-i18n="key"; dynamic text uses SWR.i18n.t(key, vars). */
(function () {
  "use strict";
  /** @type {Record<string, any>} */
  const SWR = (window.SWR = window.SWR || {});
  const STORE_KEY = "swr.lang";

  const STRINGS = {
    zh: {
      docTitle: "Squeek Wheel Runner｜真仓鼠驱动的像素跑酷",
      lede: "像素仓鼠跑酷，速度来自一只真实仓鼠的转轮。",
      switchLang: "EN",
      switchLangLabel: "Switch to English",
      liveData: "实时链上数据",
      blockLabel: "区块",
      blockValue: "#{n} 构建中",
      blockProgressLabel: "区块 #{n} 完成度",
      rpmLabel: "真实转速",
      rpmUnit: "rpm",
      mintedLabel: "已挖出",
      wheelRunning: "仓鼠在跑",
      wheelSleeping: "仓鼠在睡觉",
      wheelFault: "计数器故障",
      loading: "读取中…",
      fetchFailed: "数据拉取失败，10 秒后重试",
      fetchFailedKeep: "数据拉取失败，10 秒后重试。游戏继续使用上一次的数据。",
      score: "分数",
      best: "最高",
      bonusActive: "瓜子 x2 · {s} 秒",
      startRun: "开始奔跑",
      runAgain: "再跑一次",
      jumpHelp: "空格、↑ 或点按画面跳跃，按住跳得更高",
      gameAria: "仓鼠跑酷游戏画面。按空格或点按跳跃。",
      sleepNote: "转轮停了：仓鼠睡觉模式，速度变慢",
      bonusToast: "区块 #{n} 产出！瓜子 x2，持续 10 秒",
      gameOver: "撞到了",
      resultTitle: "本局成绩",
      resultScore: "{score} 分",
      resultMeta: "转速 {rpm} rpm · 区块 #{block}",
      nameLabel: "排行榜名字",
      nameDefault: "仓鼠",
      cardAlt: "分享卡片：{score} 分，转速 {rpm} rpm，区块 #{block}",
      downloadCard: "下载分享卡片",
      postX: "分享到 X",
      shareText: "我在 Squeek Wheel Runner 跑了 {score} 分！当时真实仓鼠转轮 {rpm} rpm，Squeekchain 区块 #{block}。",
      leaderboard: "本机排行榜",
      leaderboardNote: "前 10 名只保存在这个浏览器里。",
      leaderEmpty: "还没有成绩。跑一局，分数会出现在这里。",
      colRank: "名次",
      colName: "名字",
      colScore: "分数",
      colRpm: "转速",
      colBlock: "区块",
      howTitle: "数据怎么影响游戏",
      howRpm: "真实转速越快，仓鼠跑得越快，障碍越密。",
      howIdle: "转轮停下（IDLE）时进入夜晚睡觉模式，速度变慢。",
      howBlock: "真实区块完成度跨过 100% 时，屏幕金光，瓜子分数 x2 持续 10 秒。",
      howSource: "数据每 10 秒从 Squeekchain 公共接口刷新一次。",
      overlayTitle: "OBS 直播叠加层",
      overlayText: "在 OBS 添加「浏览器」来源，填入下面的地址，背景是透明的。",
      overlayOpen: "打开直播叠加层",
      footerBy: "作者",
      footerData: "数据来源",
      noData: "暂无",
      updatedAgo: "已更新",
      ovRpm: "转速",
      ovBlock: "区块 #{n}",
      ovBest: "最高分",
    },
    en: {
      docTitle: "Squeek Wheel Runner | A pixel runner powered by a real hamster",
      lede: "A pixel hamster runner whose speed comes from a real hamster wheel.",
      switchLang: "中文",
      switchLangLabel: "切换到中文",
      liveData: "Live chain data",
      blockLabel: "Block",
      blockValue: "#{n} building",
      blockProgressLabel: "Block #{n} progress",
      rpmLabel: "Real wheel",
      rpmUnit: "rpm",
      mintedLabel: "Mined",
      wheelRunning: "Hamster running",
      wheelSleeping: "Hamster sleeping",
      wheelFault: "Counter fault",
      loading: "Loading…",
      fetchFailed: "Data fetch failed, retrying in 10 s",
      fetchFailedKeep: "Data fetch failed, retrying in 10 s. The game keeps using the last data.",
      score: "Score",
      best: "Best",
      bonusActive: "Seeds x2 · {s} s",
      startRun: "Start run",
      runAgain: "Run again",
      jumpHelp: "Space, ↑ or tap the scene to jump. Hold to jump higher.",
      gameAria: "Hamster runner game. Press Space or tap to jump.",
      sleepNote: "Wheel stopped: sleepy night mode, slower run",
      bonusToast: "Block #{n} is out! Seeds x2 for 10 s",
      gameOver: "Bonk",
      resultTitle: "Your run",
      resultScore: "{score} points",
      resultMeta: "Wheel {rpm} rpm · Block #{block}",
      nameLabel: "Leaderboard name",
      nameDefault: "Hamster",
      cardAlt: "Share card: {score} points, wheel {rpm} rpm, block #{block}",
      downloadCard: "Download share card",
      postX: "Post on X",
      shareText: "I scored {score} in Squeek Wheel Runner! The real hamster wheel was at {rpm} rpm, Squeekchain block #{block}.",
      leaderboard: "Leaderboard on this device",
      leaderboardNote: "The top 10 runs are saved in this browser only.",
      leaderEmpty: "No runs yet. Finish a run and it shows up here.",
      colRank: "Rank",
      colName: "Name",
      colScore: "Score",
      colRpm: "Wheel",
      colBlock: "Block",
      howTitle: "How the live data drives the game",
      howRpm: "The faster the real wheel spins, the faster the hamster runs and the closer the obstacles.",
      howIdle: "When the wheel is IDLE the scene turns to night and the run slows down.",
      howBlock: "When real block progress passes 100%, the screen flashes gold and seeds score x2 for 10 s.",
      howSource: "Data refreshes from the public Squeekchain API every 10 s.",
      overlayTitle: "OBS stream overlay",
      overlayText: "Add a Browser source in OBS with the address below. The background is transparent.",
      overlayOpen: "Open the stream overlay",
      footerBy: "Made by",
      footerData: "Data",
      noData: "n/a",
      updatedAgo: "Updated",
      ovRpm: "Wheel",
      ovBlock: "Block #{n}",
      ovBest: "Best",
    },
  };

  function initialLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "zh" || q === "en") return q;
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (_) {
      /* storage blocked: fall through */
    }
    return /^zh/i.test(navigator.language || "") ? "zh" : "en";
  }

  let lang = initialLang();
  const listeners = [];

  /**
   * @param {string} key
   * @param {Record<string, string|number>} [vars]
   */
  function t(key, vars) {
    let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    if (vars) for (const k in vars) s = s.split("{" + k + "}").join(String(vars[k]));
    return s;
  }

  function apply(root) {
    const scope = root || document;
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
  }

  /** @param {"zh"|"en"} next */
  function setLang(next) {
    lang = next;
    try {
      localStorage.setItem(STORE_KEY, next);
    } catch (_) {
      /* ignore */
    }
    apply();
    listeners.forEach((fn) => fn(lang));
  }

  SWR.i18n = {
    t,
    apply,
    setLang,
    get lang() {
      return lang;
    },
    onChange: (fn) => listeners.push(fn),
    /** @param {number|bigint} n */
    num: (n) => (typeof n === "bigint" ? n.toLocaleString("en-US") : Number(n).toLocaleString("en-US")),
  };
})();
