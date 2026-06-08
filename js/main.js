/* =====================================================================
   main.js — 共用互動邏輯 + 導航欄動態注入
   - 導航欄只在這裡定義，改一處全站同步
   - 自動依頁面層級處理相對路徑（首頁不加前綴、模組頁加 ../）
   ===================================================================== */

(function () {
  "use strict";

  // ---- 站台模組清單（單一資料來源） ----
  // href 一律以「首頁為基準」的相對路徑撰寫，注入時再依層級補前綴。
  var SITE = {
    brand: "機率賭場",
    home: "index.html",
    links: [
      { id: "home", label: "首頁", href: "index.html" },
      { id: "A", label: "A·鐘形曲線", href: "modules/bell_curve.html" },
      { id: "B", label: "B·二項分配", href: "modules/coin.html" },
      { id: "D", label: "D·固定平注", href: "modules/sicbo.html" },
      { id: "E", label: "E·馬丁格爾", href: "modules/sicbo2.html" },
      { id: "F", label: "F·真實賭桌", href: "modules/sicbo3.html" }
    ]
  };

  // ---- 判斷頁面層級 ----
  // 部署於 GitHub Pages 子路徑時 pathname 形如
  // /repo/modules/xxx.html → 含 /modules/ 即為模組頁，需補 ../
  function pagePrefix() {
    return /\/modules\//.test(window.location.pathname) ? "../" : "";
  }

  // ---- 取得目前頁面 id（標記 active） ----
  function currentId() {
    var p = window.location.pathname;
    var file = p.substring(p.lastIndexOf("/") + 1) || "index.html";
    if (file === "" || file === "index.html") return "home";
    for (var i = 0; i < SITE.links.length; i++) {
      var lf = SITE.links[i].href.split("/").pop();
      if (lf === file) return SITE.links[i].id;
    }
    return "home";
  }

  // ---- 注入導航欄 ----
  function injectNav() {
    var prefix = pagePrefix();
    var active = currentId();

    var nav = document.createElement("nav");
    nav.className = "site-nav";

    var brand = document.createElement("a");
    brand.className = "brand";
    brand.href = prefix + SITE.home;
    brand.innerHTML = '<span class="chip-ico"></span>' + SITE.brand;
    nav.appendChild(brand);

    SITE.links.forEach(function (link) {
      var a = document.createElement("a");
      a.className = "nav-link" + (link.id === active ? " active" : "");
      a.href = prefix + link.href;
      a.textContent = link.label;
      nav.appendChild(a);
    });

    document.body.insertBefore(nav, document.body.firstChild);
  }

  // 在 DOM 就緒後注入
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectNav);
  } else {
    injectNav();
  }

  /* ===================================================================
     共用工具函式（掛在 window.App 命名空間）
     =================================================================== */
  var App = {};

  // ---- 數字格式化：金額 ----
  App.money = function (n) {
    var sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
  };

  // ---- 大數字縮寫（一般 Number） ----
  App.abbr = function (n) {
    var abs = Math.abs(n);
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (abs >= 1e3) return (n / 1e3).toFixed(2) + "K";
    return String(n);
  };

  // ---- BigInt 的 log10（用位數 + 前導數字估算） ----
  App.bigLog10 = function (b) {
    if (b <= 0n) return 0;
    var s = b.toString();
    var digits = s.length;
    // 取前 15 位有效數字做小數部分
    var lead = Number(s.slice(0, 15));
    return Math.log10(lead) + (digits - Math.min(15, digits));
  };

  // ---- BigInt 格式化：小數值原樣、大數值用科學記號 / K-M-B ----
  App.formatBig = function (b) {
    if (b < 1000n) return b.toString();
    var s = b.toString();
    var digits = s.length;
    // 1e3 ~ 1e14：用 K/M/B/T 縮寫
    if (digits <= 15) {
      var num = Number(b);
      return App.abbr(num);
    }
    // 更大：科學記號  d.dddde+NN
    var exp = digits - 1;
    var mantissa = s[0] + "." + s.slice(1, 4);
    return mantissa + "e+" + exp;
  };

  // ---- 組合數 C(n, k)，BigInt 精確 ----
  App.combination = function (n, k) {
    n = BigInt(n);
    k = BigInt(k);
    if (k < 0n || k > n) return 0n;
    if (k > n - k) k = n - k;
    var result = 1n;
    for (var i = 0n; i < k; i++) {
      result = (result * (n - i)) / (i + 1n);
    }
    return result;
  };

  /* ===================================================================
     Sic Bo（骰寶）共用引擎 — D / E / F 共用
     =================================================================== */
  var Sic = {};

  // ---- 擲三顆骰（1~6） ----
  Sic.roll = function () {
    return [
      1 + Math.floor(Math.random() * 6),
      1 + Math.floor(Math.random() * 6),
      1 + Math.floor(Math.random() * 6)
    ];
  };

  // ---- 是否為豹子（三顆同點） ----
  Sic.isTriple = function (d) {
    return d[0] === d[1] && d[1] === d[2];
  };

  Sic.sum = function (d) {
    return d[0] + d[1] + d[2];
  };

  // ---- 大/小判定（豹子兩邊皆輸）----
  // 回傳 'big' | 'small' | 'triple'
  Sic.bigSmall = function (d) {
    if (Sic.isTriple(d)) return "triple";
    var s = Sic.sum(d);
    return s >= 11 ? "big" : "small"; // 4~10 小、11~17 大
  };

  // ---- 完整賠率表（F 使用；D/E 只用大/小） ----
  // 賠率為「淨賠率」，押注 bet 中獎可得 bet*odds（本金保留另計）
  Sic.SUM_ODDS = { 4:60, 5:30, 6:18, 7:12, 8:8, 9:6, 10:6, 11:6, 12:6, 13:8, 14:12, 15:18, 16:30, 17:60 };

  // domino（兩點組合）15 種
  Sic.DOMINOES = (function () {
    var arr = [];
    for (var a = 1; a <= 6; a++)
      for (var b = a + 1; b <= 6; b++) arr.push([a, b]);
    return arr; // [[1,2],[1,3]...[5,6]]
  })();

  // ---- 結算單一注（F 用） ----
  // bet = { type, value, amount }
  // 回傳淨損益（不含本金的盈虧）：贏 → +amount*odds；輸 → -amount
  Sic.settleBet = function (bet, dice) {
    var amt = bet.amount;
    var counts = [0, 0, 0, 0, 0, 0, 0]; // index 1~6
    dice.forEach(function (v) { counts[v]++; });
    var sum = Sic.sum(dice);
    var triple = Sic.isTriple(dice);

    switch (bet.type) {
      case "big":
        if (triple) return -amt;
        return sum >= 11 ? amt : -amt;
      case "small":
        if (triple) return -amt;
        return sum <= 10 ? amt : -amt;
      case "single": // value=點數，1:1 / 2:1 / 3:1
        var c = counts[bet.value];
        return c > 0 ? amt * c : -amt;
      case "pair": // 指定對子，至少兩顆，10:1
        return counts[bet.value] >= 2 ? amt * 10 : -amt;
      case "anyTriple": // 任意豹子 30:1
        return triple ? amt * 30 : -amt;
      case "specificTriple": // 指定豹子 180:1
        return triple && dice[0] === bet.value ? amt * 180 : -amt;
      case "domino": // value=[a,b]，5:1
        return counts[bet.value[0]] >= 1 && counts[bet.value[1]] >= 1 ? amt * 5 : -amt;
      case "sum": // value=總和
        if (sum === bet.value) return amt * Sic.SUM_ODDS[bet.value];
        return -amt;
      default:
        return -amt;
    }
  };

  App.Sic = Sic;
  window.App = App;
})();
