# 機率賭場 — 機率統計教學互動網站

純前端靜態網站（HTML / CSS / JavaScript），把機率統計概念用賭場主題的互動模擬呈現，部署於 GitHub Pages。

## 模組
| 代號 | 檔案 | 功能 |
|---|---|---|
| A | `modules/bell_curve.html` | 鐘形曲線：BigInt 精算 C(n,k)，對數縮放長條圖，>20 啟用 dense-mode |
| B | `modules/coin.html` | 二項分配：n≤10 窮舉所有排列、n>10 改用公式 C(n,k)/2ⁿ |
| D | `modules/sicbo.html` | 固定平注模擬：大/小 1:1，D3 v7 走勢圖（分 10 段動畫） |
| E | `modules/sicbo2.html` | 馬丁格爾策略：輸加倍/贏重置，含賭桌上限與策略失敗計數 |
| F | `modules/sicbo3.html` | 真實骰寶賭桌：完整賠率表、多區同時下注、90ms 擲骰動畫 |

## 目錄結構
```
index.html          統一導航入口
css/style.css       全域樣式（賭場主題）
js/main.js          導航動態注入 + 共用工具 + Sic Bo 引擎
modules/            五大模組頁面
.nojekyll           讓 GitHub Pages 不經 Jekyll 處理
```

## 本機預覽
直接以瀏覽器開啟 `index.html` 即可（純靜態，無需伺服器）。
或啟動簡易伺服器：
```bash
python -m http.server 8000
```

## 部署（GitHub Pages）
推送至 GitHub 後，於 repo 的 **Settings → Pages** 選擇 branch（如 `main`）與根目錄 `/`，即可發佈。所有路徑皆為相對路徑，支援子路徑部署。
