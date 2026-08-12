# 專案目標

Minimal Admin 的存在，是因為 WordPress 管理介面將日常工作埋在二十年的
累積的介面雜訊。這些原則決定要建構什麼，以及如何建構。
這些原則所服務的可衡量成果——以及評判它們的數字——
位於 [roadmap.md](roadmap.md)。

## 目標

1. **讓路。** 日常工作——撰寫、審核、查看網站、管理
   檔案和使用者——都應該只需點擊一次即可到達，且視覺上保持平靜。密度服務於讀者，而非
   工具列。
2. **真正的替代品，而非展示品。** Minimal 必須能在擁有數十萬個
   列（它是針對生產規模資料集開發的）。分頁、`_fields` 白名單
   與能力閘控不可妥協，也不是最佳化選項。
3. **零綁定。** Minimal 寫入的所有內容都是原生 WordPress：Gutenberg 區塊標記、核心
   選項、核心 REST 呼叫。停用外掛後，不會遺失或破壞任何內容。Classic
   wp-admin 始終完全可用——Minimal 是附加式的。
4. **無建置步驟。** 一個原生 JavaScript 檔案、一個樣式表，以及由上到下讀取的 PHP。任何人
   一個下午就能讀完整個程式碼庫。框架會讓人陷入依賴套件的跑步機，而這
   專案刻意不納入。
5. **以架構防禦。** 列表情境中絕不執行其他外掛的呈現路徑（
   行為異常的外掛不得使 Minimal 停擺），永不反序列化外部 blob，
   在伺服器端檢查能力，在邊界處全部進行跳脫。
6. **生態系邀請。** 第三方外掛透過單一宣告式篩選器整合——
   請參閱 `for-plugin-authors.md`。Minimal 為熱門外掛提供轉接器；外掛作者可以提供
   無需撰寫 JavaScript 即可自行完成。
7. **使用者高於所有整合。** 外掛註冊的任何內容都不得搶走注意力
   使用者未要求的內容，以及外掛註冊的任何內容，都可以由使用者隱藏或靜音。
   WordPress 在其通知系統中敗下陣來；Minimal 以架構強制落實
   （僅描述項目，不負責擷取），預算與每位使用者控制項——永遠不會與
   對外掛作者自制力的信任。請參閱 `v1-readiness.md`。

## 非目標

- **Gutenberg 對等性。** 複雜的區塊版面屬於區塊編輯器；Minimal 會連結至它
  乾淨地（`editor-direction.md`）。
- **設定頁對等性。** Minimal 呈現人們實際會修改的設定。長尾
  留在 wp-admin 中。
- **目前僅限多網站網路管理員。**
  **成為頁面建構器。**
  in WordPress Network Admin.
- 品質標準

## 每項功能都必須包含：在乾淨網站上的瀏覽器層級驗證，*以及*生產規模

Emoji-Log 提交。如果一項功能無法端到端驗證，就代表尚未完成。
site, zero console errors, capability checks proven by the UI hiding/showing correctly, and an
Emoji-Log commit. If a feature can't be verified end-to-end, it isn't done.
