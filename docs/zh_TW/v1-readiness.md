# v1.0 charter

*The two promises a v1.0 has to make, and the gates that decide when it can.
Written 2026-07-16 at v0.16.0 from a full audit of the plugin and its docs; the
audit's own findings and the cycle that cleared them have been folded into
[changelog.md](../changelog.md) rather than kept here. Forward-looking work lives
in [roadmap.md](roadmap.md).*

v1.0 的門檻不在於功能數量，而在於 Minimal 必須能夠履行兩項承諾
大聲說出來：

1. **外掛作者享受串接體驗。** 稱職的 WordPress 開發者可以將其
   外掛在一個下午內整合到 Minimal，而不必閱讀 Minimal 的原始碼，並且知道
   契約不會在這些情況下遭到破壞。
2. **外掛作者無法濫用 Minimal。** 外掛註冊的任何內容都無法取得
   使用者未要求的注意力，而外掛註冊的所有內容都可能
   被使用者靜音。WordPress 在通知系統上輸掉了這場戰鬥；Minimal
   必須靠架構與使用者控制取勝，而不是靠政策文件。

## 目前已正常運作的部分（保留，並且更大聲地說出來）

- **此架構天生具備抗濫用能力。** 第三方 PHP 永遠不會掛鉤
  進入 Minimal 的呈現路徑，第三方 HTML/CSS/JS 永遠不會抵達 SPA。
  整合是純資料 descriptor；Minimal 會在邊界處跳脫所有值。
  整類 wp-admin 濫用（任意管理員 HTML、巨型橫幅、虛假
  按鈕）在此不存在。這是目標 #5，而且它成立。
- **通知已經解決。** 外掛無法將任何內容注入 Minimal 的
  通知面板。他們的 wp-admin 通知只會透過擷取抵達：
  縮減為文字、嚴重性與最多三個連結，並歸因於其擁有者，
  使用者可透過 Undo 隱藏，動作連結在背景執行。這
  正是 WordPress 通知問題的確切答案，而且它應該是一項
  標題級主張，而不是變更日誌的註腳。
- **快速入門的效益比例。** 二十行宣告式程式碼即可產生分頁、
  可搜尋、具能力閘控的管理檢視，零 JavaScript 且無需建置步驟。
- **Integrations 卡片。** 顯示所有已註冊項目的即時登錄，並標示
  依外掛處理，並標記契約問題，而不是靜默失敗。大多數
  生態系統永遠不會建立這個。
- **書面相容性承諾**（僅新增、棄用期限、「按鍵
  不在此頁面上是內部項目」），以及真正
  易讀。五十多個隨附介面卡證明這些原語能跨越不同場景泛化
  四種不同的設定結構框架。
- **品質標準**：約 150 個瀏覽器測試套件，在乾淨環境與
  生產規模網站，零主控台錯誤閘門。

## v1.0 閘門

*2026-08-06 狀態檢查（樹狀目錄中為 v0.24.0，尚未發布；v0.23.0 已發布
2026-08-04）：G2 至 G6 仍已在 v0.24.0 發布，並由測試套件涵蓋
(tests/hide-integrations.test.js、hide-slash-designs.test.js、
design-sources.test.js、attention-budgets.test.js、offsite-links.test.js、
contract.test.js 加上 example-adapter.test.js；名冊已從
在稽核時約有 150 個套件，增加至 206 個）。自上次檢查以來的週期（
資料庫檢視器、可見性切換開關、每個擴充功能的自動更新
標籤、同步模式、i18n、隨附的使用者指南、經校驗和驗證的
更新、WPForms 項目）沒有在該項目之外新增注意力介面
受條件控制的詞彙；自 v0.22.0 以來唯一的新擴充點，
`minimal_admin_visibility_toggles` 是伺服器端寫入器回呼，而不是
UI 放置位置。G1，即與真實外部測試者進行的午後測試，仍然
唯一開啟的閘門。其材料全部就緒（docs/shim-tutorial.md、
測試套件強制執行的 docs/examples/minimal-example-adapter、Playground
藍圖）；找到該測試者仍屬於排程工作，而非工程
工作。*

v1.0 會在以下條件全部成立時發布：

- [ ] **G1 — 午後測試。** 一名從未見過 Minimal 的開發者接上了
      將 custom-table plugin 擴充為完整表面（清單、詳細資料、動作、狀態
      卡片）僅使用文件，在不到半天內完成。已由真實
      外部測試人員，而不只是內部測試。
- [x] **G2 — 使用者自主權。** 每個已註冊的整合點（表面、
      面板、指令、設計來源）都能從 UI 中依使用者隱藏，而且
      隱藏設定會在更新後保留。*（介面與編輯器面板已於 2026-07-16 上線，
      v0.17.0 週期：`minimal_admin_hidden_integrations` 使用者中繼資料，
      `minimal-admin/v1/integrations/hide|unhide`、導覽／入口右鍵、復原
      在 Your profile 上。設計來源（`design:<id>`）與斜線命名空間
      (`slash:<ns>`，涵蓋自動區塊 + 插入範本 + 模式 +
      命名空間指令一併完成）並在同一天稍後通過了閘門：
      在區塊選擇器群組標題上按右鍵；隱藏的項目會離開
      伺服器 payload，內嵌斜線選單會就地刪減。調色盤列
      沿用其介面的隱藏設定。)*
- [x] **G3 — 注意力預算。** 放置位置與數量限制由
      驗證器與用戶端，而不是依靠慣例。外掛程式不能新增超過
      將其預算分配給導覽、調色盤或預設斜線選單；溢出時會降級
      以正常方式處理（僅搜尋、群組收合），而不是直接捨棄。
      *（已於 2026-07-16 發布，v0.17.0 週期。Workspace 需要類似收件匣的
      集合（包含一個 `ago` 欄）或降級為 Tools，並由驗證器
      旗標。單一擁有者最多持有 3 個導覽位置：超過後，無所屬系列的
      介面會折疊成一個合成系列（一個導覽項目、一個調色盤
      列、現有的切換器機制；Minimal 隨附的介面卡則豁免，因為
      每個僅在其主旨外掛啟用時註冊，而 Unknown
      豁免擁有者，因此歸因失敗絕不會合併陌生項目）。一個
      命名空間最多保留 3 個預設斜線項目；超出的會降級為
      僅供搜尋。Integrations 卡片會標記工作區問題，並
      以資訊方式提醒超出預算的擁有者。)*
- [x] **G4 — 外部連結誠實性。** 每個由外掛提供、離開
      網站都會以外部連結提示呈現。沒有任何描述項能讓一個
      讓加購看起來像應用程式動作。*（已於 2026-07-16 上線，v0.17.0 週期：
      共用的 `hrefLabel()` 渲染器在每次渲染時標記外部 href ↗
      網站（狀態卡片動作、詳細資料模態視窗動作、列選單、每個
      openMinimalMenu 連結），而驗證器會列出描述項攜帶的
      每個介面上的外部 href，僅在 Integrations 卡片中提供資訊。
      狀態卡片連結會在執行階段出現在路由回應中，因此它們會取得
      渲染時標記，但沒有靜態旗標。作者指南的
      Integration etiquette 區段說明了這項保證。）*
- [x] **G5 — 契約凍結。** 文件化的描述元詞彙已完整
      （沒有未記錄且不可或缺的按鍵），加上引入版本註記，並
      由一套契約測試涵蓋，該測試會驅動第三方外掛的固定裝置
      涵蓋每個已記錄的索引鍵。*（已於 2026-07-16 上線，v0.17.0 週期：
      tests/contract.test.js，36 項檢查。第一部分的一半是 DOC LOCKSTEP——每個
      驗證器詞彙常數中的鍵必須出現在
      for-plugin-authors.md，因此新鍵無法在未記錄的情況下加入。第二半
      驅動 minimal_test_contract_surface kitchen-sink fixture（路由
      索引標籤＋allRoute、query/pageQuery、每個欄格式＋altKey/utc/
      寬度、包含 labels/messageKey/skip/edit 的詳細資訊 + preserve + 完整
      欄位詞彙、每個動作鍵、受條件控制的批次、篩選、建立
      包含預設值、manage、views[]、status rows/chart/command/actions，
      透過 settingsItem 的項目範圍設定）端到端地搭配伺服器狀態
      驗證；同一個描述元在以下項目上驗證時，沒有任何問題
      Integrations 卡片本身就是契約檢查。設定閘門、純文字
      設定檢視、編輯器面板與設計來源都由其各自的
      各自專用的 fixture 測試套件。)*
- [x] **G6 — 單一文件入口。** 單一作者指南，從
      快速入門，包含 shim 教學與螢幕截圖，且沒有過時的
      與其相矛盾的同級項目。*（重構已於 2026-07-16 上線：快速入門
      優先、shim 教學 + 套件強制執行的範例外掛、測試你的 adapter
      以及 AI 代理區段、已記錄的能力模式、規範圖示
      清單、拆分連續儲存格、since-versions、extension-api.md 已刪除。
      螢幕截圖於同日稍後完成：九張深色主題的 2x 擷取圖，位於
      docs/img，涵蓋每個原語（表面清單、狀態卡片、詳細
      模態視窗、聯絡卡片項目、設定閘門、設定檢視、側邊欄入口＋
      已開啟的面板、斜線命名空間項目），從即時應用程式擷取
      以 Campfire 範例介面卡為主題，讓教學及其
      圖片不會分歧；行銷網站的指南模態視窗會呈現它們
      透過 GitHub raw。）*
