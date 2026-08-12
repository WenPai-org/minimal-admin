# 路線圖 — 目標與評判它們的數字

*原則位於 [goals.md](goals.md)。深入的技術計畫位於各領域文件中
（位於 [editor-roadmap.md](editor-roadmap.md) 與 [editor-direction.md](editor-direction.md) 中的編輯器，
[plugin-support.md](plugin-support.md) 與 [adapter-coverage.md](adapter-coverage.md) 中的介接器，
[wp-cli-roadmap.md](wp-cli-roadmap.md) 中的 v1.0 章程）。這份文件就是評分板：
[v1-readiness.md](v1-readiness.md)). This document is the scoreboard:
a short list of outcomes, each judged by a real-world number we can measure honestly.*

GitHub 的公開計數器、模式語料庫探測、套件帳冊，以及嚴謹的
dogfooding。每次切出版本時更新狀態；功能檢查清單位於
各領域文件，交付後收斂為一行的帳冊項目。
area docs and collapse to one-line ledger entries once shipped.

## Goal 1 — Minimal is someone's whole admin

證明這一點的誠實方式，就是親自實踐。
honest way to prove it is to live it.

- Minimal。透過 Minimal 本身提供的連結開啟 wp-admin（區塊編輯器離開
  外掛自己的設定畫面）就算是 Minimal 正常運作；因為 Minimal
  無法完成工作的內容會中斷連續紀錄並提交問題。
  **現在：**尚未追蹤。連續紀錄從 v0.26.0 的 dogfood soak 開始。
- **目標：**連續 30 天，執行兩次。第一次跨越平靜的一個月，接著跨越一
- 版本切出（版本本身透過 Minimal 管理）。
  release cut (the release itself managed through Minimal).

## Goal 2 — the editor writes real pages, not just posts

真實網站的組成。巢狀週期（2026-08-08/09）就是此目標的建置階段。
what real sites are made of. The nesting cycle (2026-08-08/09) was this goal's build-out.

- 494 個容器單位），在 Minimal 中以可寫入狀態開啟；對未變更的
  在儲存過程中保留內容，由測試套件強制驗證。
  **現在：**每個可解析的群組、欄、封面與媒體文字容器都會以
- 將具有複雜子項目的寫入介面作為受保護卡片。2026-08-08 基線
  探測顯示頂層容器中僅 2% 可寫入；週期結束時，閘門
  本身刪除。位元組識別性由測試套件固定驗證（nested-islands、container-slots、
  attr-carry、island-runs：119 項檢查）。
  **目標：**讓語料庫維持實際上 100% 可寫入，且位元組識別性為零
- 回歸問題，逐次發布。此處的回歸會阻擋發布。
  regressions, release over release. A regression here blocks the release.

## Goal 3 — real people do real work in it

只命中真正完成工作的內容。
only hit doing real work.

- 過去 30 天中最大的一批已關閉版本下載量。自動更新程式
  只提供目前版本，因此已被取代版本的下載量會
  在其任期內完成更新的不同網站，而每個發布版本的資料都飽和
  在兩到三天內 — 最近最大的一批是誠實的下限。
  再加上由作者以外的人提交的問題。
  **目前（2026-08-09）：**≈69 個活躍網站 · 27 個發布版本共 644 次下載 ·
- 43 顆星 · 10 個外部問題，其中有幾個正是實際投入工作的那種
  （群組內容編輯、過時的更新提示、實體渲染）。
  **目標：**約 100 個活躍網站，接著約 500 個。行銷網站的理念區塊顯示
- 自動將活躍網站主張從約 50 個往上推進。保持外部問題
  維持健康：每份真正工作的回報都得到回覆，且修正會在
  它所到達的發布週期。
  the release cycle it arrives in.

## Goal 4 — plugin authors wire in without us

當我們從未見過的作者交付他們自己的內容時，就證明了
proven when authors we have never met ship their own.

- Minimal 的儲存庫。
  **目前：**1 個（Anchor Blocks），且它與 Minimal 由同一位作者維護，所以坦白說：0
- 外部。
  **目標：**前 3 個外部介接器。供應者：以快速入門為優先的作者
- 指南、附有測試套件強制驗證範例外掛的 shim 教學，以及
  整合功能卡片會標示合約問題，而不是靜默失敗。
  Integrations card flagging contract problems instead of failing silently.

## Goal 5 — v1.0 ships when the promises hold

v1.0 is not a feature count. The two promises and their gates live in
[v1-readiness.md](v1-readiness.md): authors enjoy wiring in, and authors cannot abuse
Minimal. The charter's eleven audit items all shipped at v0.17.0.

- （完成 30 天連續使用；活躍網站在真實外部使用下持續成長）。
  **目前：**架構與作者體驗閘門均維持；真實世界的證據是
- 剩下的內容。
  **目標：**當某個發布版本對這兩項內容毫無改變時，就發布 v1.0
- 承諾，因為沒有任何需要變更的內容。
  promises because nothing needed changing.

## What this file is not

（[editor-roadmap.md](editor-roadmap.md)）維持不變。這裡沒有任何功能承諾；目標的
([goals.md](goals.md)) stand unchanged. Nothing here is a feature commitment; a goal's
metric moving the wrong way is information, not an obligation to build.
