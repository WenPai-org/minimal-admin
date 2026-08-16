# License manager — 先提高可見性，再進行啟用

實際的 WordPress 網站會執行數個商業外掛，而其中每一個
單獨處理其授權：自己的 wp-admin 頁面、自己的提示橫幅、自己的
對「啟用」的定義。由此產生兩個不同的問題：

1. **零可見性。** 網站上沒有任何內容能回答「我的付費外掛中，哪些
   現在有有效授權嗎？" 過期金鑰通常代表會靜默地
   錯過更新（包括安全性版本），直到發生問題為止。
2. **啟用尋寶。** 設定網站意味著要造訪五個
   不同的設定頁面來貼上五組金鑰。

WordPress 中從未存在真正的跨供應商授權管理器。現有
沒有共用的授權 API；每個供應商都自行設計儲存方式、金鑰格式，
啟用呼叫與狀態語意。這正是它有價值的原因，而
為什麼必須謹慎建置。

2026-07-10 的研究階段（已與本機實驗室的實際
付費外掛）改變了計畫：**目前可以建置可見性，但僅限唯讀，
零風險**，同時啟用仍是各供應商專案中需謹慎處理的部分
本文件較早版本所描述的順序。請依此順序發布。

## Phase 0 — 授權狀態儀表板（唯讀）— 已於 2026-07-10 發布

已在 `includes/adapters/licenses.php` 中實作：Licenses 卡片位於
System 頁面、Licenses 健康檢查、`GET minimal-admin/v1/licenses`、
`minimal_admin_license_providers` 篩選器（記載於 for-plugin-authors.md）
以及整合卡片歸屬。使用真實授權驗證：WP Rocket
（有效、真實的到期日）、ACF PRO 和 Blocksy Companion Pro（有效，
生命週期）、透過一般 EDD 讀取器處理 Perfmatters，以及全部七個付費
建構器在實驗室中正確列舉。實作上的一項事實是
研究遺漏之處：Freemius 金鑰會依其產品 slug `sites`，而非依外掛
目錄（`blocksy-companion-pro/` 註冊為 `blocksy-companion`）；
儲存在 `file_slug_map` 內的 `fs_accounts`，連接外掛檔案 → 產品
slug。以下設計記錄了已建置的內容及其原因。

一個列舉網站上每個需要授權的元件並且
將每項分類為 **valid / expired / invalid / missing / unknown**，依據
僅限本機儲存的狀態。不進行網路呼叫、不執行供應商程式碼、不
寫入。它不可能消耗啟用席位，因為它從未啟用任何項目。

### 為何可行：儲存方式全貌（已在原始碼中驗證）

兩個通用 SDK 以一套
每個配接器：

- **Freemius**——偵測方式：外掛／佈景主題會附帶 `freemius/` 目錄。
  所有狀態都存在一個選項中，即 `fs_accounts`：每個 slug 的安裝物件都攜帶
  `license_id`/`plan_id`，而 `all_licenses` 儲存含有
  絕對 `expiration` 日期時間。有效／過期／缺少狀態皆可完整計算
  離線，而且由於到期日是絕對日期，分類會持續
  即使 Freemius 自身的同步資料已過時，仍能正確運作。表現最穩定的供應商
  全部。
- **EDD Software Licensing 用戶端**——偵測方式：外掛會捆綁
  `EDD_SL_Plugin_Updater` 類別（檔名可能不同；類別名稱是
  訊號）。儲存方式採用慣例，而非固定格式：`{prefix}_license_key` ＋
  `{prefix}_license_status` 選項配對（已驗證：perfmatters、BNFW、
  Breakdance）。*狀態詞彙*由 EDD 伺服器標準化：
  `valid`、`invalid`、`expired`、`disabled`、`site_inactive`。分類
  透過前綴配對金鑰／狀態選項運作；沒有可讀取狀態的金鑰
  是 `unknown`。

主要單一供應商，各自使用小型專用讀取器（全部已在原始碼中驗證）：

| 供應商 | 狀態＋到期日儲存 | 唯讀判定 |
|---|---|---|
| Elementor Pro | `elementor_pro_license_key` + `_elementor_pro_license_v2_data`（12h 快取；包含 `expired`/`site_inactive`/`disabled` 和 `expires`，或 `lifetime`） | 完整分類 + 到期日 |
| ACF Pro | `acf_pro_license` + `acf_pro_license_status`（狀態 + 到期日陣列） | 完整分類 + 到期日 |
| WP Rocket | 金鑰位於 `wp_rocket_settings`；無效旗標 `wp_rocket_no_licence`；到期日位於 1 天的 `wp_rocket_customer_data` 暫存資料 | 快取暖機時完整；金鑰＋無效旗標一律提供 |
| Astra / Brainstorm Force | `brainstrom_products` (sic), per-product `purchase_key` + `status === 'registered'`, plus `expires` (their bsf-core 1.29.14 and later stores it from the license-status call) | Full classification + expiry |
| Kadence（StellarWP Uplink） | 每個外掛的 `stellarwp_uplink_license_key_{slug}` + status options | 完整分類 |
| Bricks | `bricks_license_key` + `bricks_license_status` transient（7d TTL） | 快取有效期間的狀態，否則為 unknown-stale |
| Beaver Builder | `fl_themes_subscription_email` + `fl_get_subscription_info` transient（`active`、`expiration`） | 快取有效期間的狀態 |
| Divi / Elegant Themes | `et_automatic_updates_options`（username + API key）+ `et_account_status` | 狀態字串，無到期日 |
| Admin Columns / Advanced Ads / WP All Import | EDD 風格的金鑰＋狀態選項（各產品名稱不同） | 完整分類 |
| WPBakery | 僅限 `wpb_js_js_composer_purchase_code`；永遠不儲存狀態（永久授權模型） | 僅確認存在 |
| Brizy Pro | Brizy 專案文章上的 postmeta `brizy-license-key`，而非 wp_options | 僅存在性 |
| Etch / SureCart licensing SDK | `{name}_license_options` + activation-id 選項；SDK 共用，因此這也是一個小型通用轉接器 | 已啟用／缺失，無到期日 |
| Gravity Forms | `rg_gforms_key` 會以 md5 雜湊儲存金鑰 | 僅存在性 |

### 偵測器設計

兩個層級，均嚴格唯讀（讀取原始 option/postmeta；絕不呼叫
供應商類別，從未連線至網路）：

**第 1 層——列舉（「誰需要授權？」）。** 低成本、可快取的訊號
每個已安裝的外掛／佈景主題：嵌入式 SDK 指紋（`freemius/` 目錄，
`EDD_SL_Plugin_Updater` 字串、SureCart 授權目錄、`bsf-core/`、Uplink），
已知供應商 slug 登錄表，以及更新來源啟發式規則（位於
`update_plugins`/`update_themes` 暫存資料，而其套件 URL 並非
wordpress.org，而 plugin-meta 端點已經讀取該資料以進行反向
目的）。任何符合條件的項目都會成為一列，即使無法分類也一樣。

**第 2 層——分類。** 供應商轉接器宣告選項／中繼資料位置、一個
狀態對照表、到期欄位與供應商的快取 TTL；兩個 SDK 介接器
（Freemius、EDD）以通用方式涵蓋其完整產品系列。每個元件的輸出：

- `valid` — 儲存的狀態如此表示，在誠實範圍內
- `expired` — 儲存的狀態或絕對到期日期已經過期
- `invalid` — 已停用、site_inactive、disabled、金鑰／網域不相符
- `missing` — 元件需要授權，但未儲存金鑰（最醒目的一列）
- `unknown` — 有金鑰，但狀態無法讀取，或已超過供應商的 TTL 而過時

每個分類列都帶有從供應商的「截至」時間戳衍生而來的
自己的快取／檢查時間。**儲存的狀態是上次驗證的真實狀態，而非即時狀態**；
介面必須說明「截至 3 天前有效」，絕不能假裝是即時狀態。

### 誠實限制

- WPBakery、Gravity Forms、Brizy 和 Etch 最高只能判定為已啟用／缺少。
- Bricks、Beaver Builder 和 Divi 會在其暫存資料過期時失去狀態；
  這些列會以最後已知值及其存留時間標記為未知過期。
- 預期會有一批顯眼的長尾項目處於「已有金鑰，狀態未知」。
  這仍然有用：它證明金鑰存在，並指出外掛名稱。
- WooCommerce.com 訂閱和 Envato 購買代碼外掛完全使用
  不同模型；未驗證，延後處理。
- 在供應商自己的續約或遠端停用變得可見之前，
  再次執行檢查。Phase 2 會處理此問題；Phase 0 不會。

### 所在位置

從 **System 頁面上的 Licenses 卡片**開始（包含狀態標籤的列、
相同的健康檢查語言）加上健康檢查
（「2 個授權已過期，1 個遺失」）以及 Extensions 卡片上的授權徽章。
當 Phase 1 加入操作後，升級為專用介面。通知摘要
已經擷取供應商自己的提醒橫幅；此處的各列應連結至
相同的啟用深層連結。

該升級已完成：自 v0.12.0（2026-07-12）起，管理器以
第三個 Extensions 分頁（Plugins / Themes / Licenses），位於
其所描述的元件。System 頁面保留授權健康檢查。

## Phase 1 — 啟用（第 1 波已於 2026-07-10 發布）

以貼上金鑰啟用的方式發布於 Licenses 卡片上，並附上鎖定問題
透過不建立一個來解決：**絕不保留任何金鑰。** 貼上的機密值
只會向供應商自身的啟用程式碼發出一次請求，且永不儲存，
記錄或回傳。供應商合約增加了三個選用的可呼叫函式
（`activate( $secret )`、`deactivate()`、`verify()`；記錄於
for-plugin-authors.md），僅在供應商程式碼載入時附加，因此
卡片絕不會繪製無法運作的控制項。結果會正規化為
`{ ok, code, message }`，並將 `site_limit` 視為一級項目，且不會重試。

第 1 波供應商：**Elementor Pro**（透過
`API::activate_license` + `Admin::set_license_key` + `API::set_license_data`,
模仿其自身的 ajax 處理常式；`no_activations_left` 對應至 `site_limit`），
**ACF PRO**（透過 `acf_pro_activate_license`／
`acf_pro_deactivate_license`、靜默模式），以及 **WP Rocket**（僅重新驗證
透過 `rocket_check_key()`：其認證資料隨附於供應商的 zip 中，因此
沒有可貼上的金鑰；這也交付了 Phase 2 的第一部分）。
管線已使用刻意造假的
金鑰（顯示乾淨的 `invalid`，不寫入任何內容、不重試）；真實金鑰
啟用流程是擁有者手動執行的步驟，與自動更新程式相同
候選版本測試。

**第 2 波（2026-07-10 發布，當天）：** Beaver Builder（啟用 +
透過 `FLUpdater::save_subscription_license` / 重新驗證
`get_subscription_info`；不存在安全的停用方式，因此不提供此功能），
Brizy Pro（透過其 singleton 啟用 + 停用；其例外會攜帶
供應商訊息）、Etch（透過其 SureCart 包裝器啟用＋停用
單例，以及其 `etch_license_key` / 專用讀取器
`etch_license_status` 選項，而通用 SureCart 掃描遺漏了這些選項），以及
當 Bricks 是作用中的佈景主題時（透過公開的啟用 + 重新驗證
靜態金鑰與非 AJAX 的 `activate_license()` 路徑，只有在
實際的狀態回應；其停用處理常式一律執行 nonce 檢查，
因此停用仍會在 Bricks 畫面上進行）。契約也新增了
`activate_url`，適用於沒有可呼叫路徑的入口網站交握供應商：WPBakery
現在各列會帶有前往自身啟用畫面的「啟用 ↗」連結，而不是
可能無法運作的貼上欄位。全部四個可呼叫的供應商都
已使用錯誤金鑰針對其線上 API 驗證機制（乾淨的供應商
顯示訊息，沒有殘留狀態）。

**第 3 波（2026-07-10 發布，當天）：Divi**，第一個多祕密
供應商。契約新增了 `secret_fields`（每組認證資料包含 ID 與標籤；
`activate` 會接收以 id 為鍵的陣列）；Divi 採用 Elegant Themes
使用者名稱＋ API 金鑰，將其寫入網站選項，清除其
`et_update_themes` 快取，並執行核心佈景主題更新檢查，因此他們的
掛接的檢查器會驗證並寫入 `et_account_status`。失敗的嘗試
會還原先前儲存的認證資料（比 Divi 自身的設定更友善
頁面，會覆寫它們）。已在使用錯誤金鑰的 Divi 一次性實驗環境中驗證
憑證。Divi 沒有每個網站的席次，因此停用只會清除
已儲存的認證資料。

INACTIVE 元件的列會保留其唯讀授權狀態（儲存於
選項不需要供應商程式碼），但會以變暗樣式呈現，因此作用中的佈景主題閘控
會解讀為預期行為，而不是缺少按鈕。自 2026-07-10 起
（v0.11.0）變暗的列也帶有 **Turn on** 控制項：當
元件的檔案確實存在，且使用者持有 `activate_plugins`／
`switch_themes`，該列會提供「開啟外掛」／「開啟佈景主題」（位於
確認後），供應商程式碼載入，授權控制項會出現在
位置。自 v0.20.0 起，該啟用流程改走 admin-ajax（實際的管理員
內容），使假設 wp-admin 可用的供應商啟用 hook 正常運作。已由
tests/license-turnon.test.js。

**第 4 波（2026-07-10 發布）：Gravity 系列。** Gravity Forms 讀取
從 `gform_version_info` 取得有效性＋到期資訊，並透過
`GFFormsModel::save_key()`（其完整流程，包括自身的
拒絕時還原）；Gravity SMTP 會透過其容器的
授權連接器，再透過其自身資料儲存區進行儲存。兩者均已驗證
使用虛構金鑰對 Gravity 的即時 API。

**第 5 波（2026-07-10 發布）：依據整體排名發現的未涵蓋尾端。** 十一個
新的讀取器，已針對從
CaptainCore 快速儲存檔案，並已安裝但在主要測試網站上停用：

- **WPMU DEV**（`wpmudev`）：一個 Hub API 金鑰（網站選項 `wpmudev_apikey`
  或 `WPMUDEV_APIKEY` 常數）即可解鎖此系列。會員狀態
  會從 Hub 快取的 `wdp_un_membership_data`（`full`/`unit`/ 讀取
  `single`/`free` = 有效，`paused` = 無效，`expired`、空值／數字
  已處理）。啟用功能會模仿其自身的驗證端點，但省略重新導向：
  `set_key()`，接著強制執行 `hub_sync()`；無效或過期的金鑰會
  退回空的 `membership`（其自身同步會在
  該情況）。停用是 `logout( false )`。透過 wp-config
  常數表示沒有貼上欄位（下一次啟動時會覆寫 `set_key`）。
- **Smush Pro**（`smush-pro`）：使用 Dashboard 金鑰，但保留自己的
  24 小時有效性快取 `wp_smush_api_auth`（每個金鑰的 `{validity,`
  timestamp}` 對照表）。唯讀；沒有可獨立貼上的金鑰。
- **SearchWP**（`searchwp`）：一個選項 `searchwp_license`
  `{key,status,expires,type}`。其 EDD 更新程式已重新命名
  （`SearchWP\Updater`），因此通用檔名掃描永遠無法指紋辨識
  透過 `\SearchWP\License` 進行啟用／停用／驗證。
- **Gravity Perks**（`gravityperks`）：`gwp_settings` SITE 中的金鑰
  選項）；有效性會快取在帶有版本後綴、有效期 12 小時的網站暫存資料中
  `gwp_license_data_{version}`。不是 EDD 更新程式外掛（自訂 `GWAPI`）。
  透過 `GWPerks`/`GravityPerks` 啟用／停用／驗證。
- **Rank Math Pro**（`rank-math-pro`）：讀取免費外掛的
  `rank_math_connect_data`（`username`/`api_key`/`plan`）。註冊
  由免費外掛擁有的 rankmath.com 入口網站交握，因此該控制項
  是從 `activate_url` 到 `admin.php?page=rank-math&view=registration` 的
- **Perfmatters**（`perfmatters`）：純 `perfmatters_edd_license_*`
  選項組合（多網站中的網站選項）。不同建置版本對於是否會
  交付 SL 更新程式檔案，因此需要專用讀取器（該讀取器宣稱
  元件並取代通用掃描）是可靠的涵蓋方式。
  透過 `\Perfmatters\License` 啟用／停用／驗證。
- **GP Premium**（`gp-premium`）：其選項名稱會破壞通用掃描
  假設（`gen_premium_` 前綴與 `gp-premium` slug，以及狀態
  選項是 `..._license_key_status`），因此會取得專用讀取器。
  啟用會驅動其自己的 REST 路由（`/generatepress-pro/v1/license/`）
  透過 `rest_do_request`；空金鑰 = 停用，`***` = 重新驗證。
- **WP All Import Pro／WP All Export Pro**（`wp-all-import`／
  `wp-all-export`）：序列化的 `PMXI_Plugin_Options` 內的所有內容
  （以類別鍵控的 `licenses`/`statuses` 對映）／`PMXE_Plugin_Options`（扁平
  `license`/`license_status`）；金鑰以 salt 包裝。匯出會啟用
  透過其 `LicenseActivator`（先以其自身方式儲存金鑰）。
  Import 的控制器完全沒有公開可呼叫項目，因此其完整流程
  （啟用／停用／驗證，於 2026-07-11 從原始版本升級
  驗證加連結方案）會逐位元組對應其由 `$_POST` 驅動的 EDD 請求
  逐位元組比對外掛自身儲存的端點；verify 會解碼
  先使用加鹽包裝的已儲存金鑰（其自身的靜態 `check_license` 會傳送它
  仍會包裝，並一律回應無效）。Soflyy 授權沒有
  每個網站的席次（已於 2026-07-11 驗證線上行為），因此兩個外掛都要停用
  是真正的本機金鑰移除。
- **Slider Revolution**（`revslider`）：扁平的 `revslider-code` +
  `revslider-valid`（字串 `'true'`/`'false'`）；啟用／停用
  透過 `RevSliderLicense`（`'exist'` = 網站限制結果）。
- **LayerSlider**（`layerslider`）：`layerslider-purchase-code` +
  `layerslider-authorized-site`（1/0）。其更新器公開了
  `handleActivation( $code, ['skipRefererCheck'=>true,'returnData'=>true] )`
  這是他們自己的重新驗證路徑；verify 會搭配儲存的
  程式碼。其停用處理常式會在請求期間 `die()`s，因此釋放席次
  仍會停留在其自身的畫面。
- **Avada**（`avada`，佈景主題）：`fusion_registration_data['avada']` 會攜帶
  購買碼與嚴格的 `is_valid` 旗標；一組代碼涵蓋
  隨附的 Avada 外掛。儲存路徑與 nonce／WP-CLI 耦合，因此僅限唯讀。
- **Envato Market**（`envato-market`）：帳戶 OAuth token 是
  僅存在性（Envato 不記錄本機有效性 → `unknown`），以及任何
  每個項目只能使用一次的權杖，確實帶有 `authorized` 成功／失敗
  旗標；已購買項目數量會在外掛自己的每小時暫存資料中更新，當
  保持溫熱。Token 輸入是與 nonce 綁定的 Settings API 畫面，因此
  「Activate ↗」連結。
- **The Events Calendar 系列**（自 2026-07-11 起的專用提供者，
  已使用真实金鑰驗證）：PUE 會將金鑰儲存在
  `pue_install_key_{slug with underscores}` 以及記錄在
  `pue_key_status_{dashed slug}_{domain}`（以及一個 `_timeout` 同級項目和
  一個 md5 暫存資料）。透過每個
  外掛自身的 `Tribe__PUE__Checker`（使用外掛精確的
  參數；`validate_key()` 是其完整流程，且僅
  接受）。注意：具有 Uplink 資源的產品（Event
  Tickets Plus）使 `validate_key` 讀取 RESOURCE 金鑰，而不是
  參數，因此啟用會先建立資源，並在
  從 TEC 帳戶下載的建置版本可以嵌入金鑰
  （Uplink KeyFactory helper）；檢查器會從中重新植入選項，因此
  對這些項目而言，本機停用是暫時性的，訊息也會明確說明這點。
- **Kadence Blocks Pro**（自 2026-07-11 起的專用提供者，已證實
  （使用真實金鑰）：免費 kadence-blocks 下的 StellarWP Uplink
  供應商命名空間，slug `kadence-blocks-pro`；購買者的金鑰會隨附
  在外掛建置內（`includes/uplink/Helper.php` DATA 常數，
  WP Rocket 模式），其中 uplink 選項會覆寫檔案
  金鑰。啟用會先儲存，然後以 `validate_license()`s
  遭拒絕時還原快照；停用會對應其自身的 Clear
  按鈕（內建金鑰仍會作為備援）。
- **其他 StellarWP Uplink／PUE 產品**（`stellarwp`、
  註冊表風格的通用處理）：PUE 僅檢查存在性，狀態分類
  供 Uplink 使用；會跳過專用供應商宣告的 slug。

其中每一項的讀取分類都已由
tests/license-vendors.test.js（21 項檢查：為每種真實選項形狀建立種子，
確認狀態標籤，接著清除選項（純選項不會
可透過 Settings API 刪除，因此因當機中止的執行不會留下虛假的授權
位於後方）。

啟用管線已於 2026-07-10 驗證，方法是將造假的金鑰送至
透過實際動作端點，針對線上服務逐一測試每個可呼叫的供應商
供應商 API（與早期批次取得的相同無效金鑰測試）。每一個
回傳乾淨的 `{ok:false, code:'invalid'}`，並附有可讀的供應商
訊息，且未留下任何金鑰：SearchWP、Perfmatters、Gravity Perks，
GP Premium、LayerSlider、WP All Export 和 WPMU DEV 都會分類回
`missing`（拒絕金鑰後）。該輪次產生了三項修正：GP
Premium 的 REST 路由註冊時沒有結尾斜線（a `/license/`
請求回應 404）；Perfmatters、WP All Export 與 Gravity Perks 會儲存
在驗證前貼上的金鑰（其自身的啟用流程會從
選項），因此現在每次失敗時都會擷取並還原先前的金鑰
而不是保留遭拒絕的金鑰，而 GP Premium 的路由（其中
無條件地在最後寫入金鑰）也會進行相同的還原。Slider
Revolution 已降級為「Activate ↗」連結：其
`activate_plugin()` 與僅限管理員使用的類別緊密綁定（RevSliderTracking，
僅在管理期間於 RevSliderGlobals 中註冊的負載平衡器
init），這些內容不會在 REST 請求中載入，而重現該啟動順序
是供應商內部實作猜測，這正是防護規範所禁止的。（反向
2026-07-11：來自 `RS_PLUGIN_PATH` 的兩次 `include_once` 呼叫，恰好載入
這些類別置於 REST 下，不必猜測啟動順序，因此完整
啟用／停用／驗證循環已交付，並使用真實金鑰通過測試；
請參閱下方的測試表格。）
通用 EDD/Freemius 驗證流程現在對長尾項目已無必要：
稽核發現，僅依檔名判斷的 EDD 指紋會遺漏重新命名的更新程式
外掛（SearchWP、Soflyy），而選項組合掃描會漏掉 GP Premium 的
命名，因此專用讀取器可涵蓋全部；Perfmatters 可能屬於任一類
依建置版本區分，而其專用讀取器優先，以避免重複列出。

### Brainstorm Force family (SHIPPED 2026-08-12)

Astra Pro, the two Ultimate Addons, Convert Pro, Schema Pro, WP Portfolio,
Premium Starter Templates and Spectra Blocks Pro all share one licensing
core: bsf-core, internally "graupi", bundled inside every product under
`admin/bsf-core` (the newest copy on the site wins). One registry option
holds them all, but each product carries its own purchase key and its own
registration, so Minimal registers ONE PROVIDER PER PRODUCT
(`bsf-{product_id}`), built by walking the registry. A BSF product Minimal has
never heard of is covered the day it ships.

The vendor entry points, all public and all reachable outside wp-admin:

- **activate** — `BSF_License_Manager::instance()->bsf_process_license_activation( [ 'license_key' => …, 'product_id' => … ] )`.
  The nonce check lives in the `admin_init` wrapper (`bsf_activate_license`),
  not in this method, which is why their own WP-CLI command
  (`wp brainstormforce license`) can drive it too. On acceptance their code
  writes the key, status and message into the registry itself.
- **deactivate** — `process_license_deactivation( $product_id )`. A real
  API-side deregistration: the seat frees and the stored key, status and
  expiry are cleared.
- **verify** — `get_remote_license_status( $purchase_key, $product_id )`.

Facts worth keeping:

- **`product_id` is not the plugin slug.** It comes from each product's
  `admin/bsf.yml` — `uabb`, `uael`, `astra-addon`, `astra-pro-sites`,
  `wp-schema-pro`, `convertpro`, `astra-portfolio`, `spectra-blocks-pro`.
  Convert Pro's addon (`convertpro-addon`) ships no bsf.yml: it is licensed
  through Convert Pro and never appears as its own row.
- **Their registry only refreshes on `admin_init`.** `init_bsf_core()` is
  what discovers installed BSF products, and it is hooked to admin_init
  alone, so under REST the registry is whatever a wp-admin pageload last
  wrote. On a CLI-provisioned site (the whole CaptainCore fleet) a freshly
  installed product is simply absent. Minimal self-heals it behind a 12 hour
  transient on read and always before an activate; `init_bsf_core()` needs
  `wp-admin/includes/plugin.php` required first, the same trap perfmatters
  and Gravity Forms sprang.
- **Expiry only arrives from a verify.** Their activation response omits
  it; `get_remote_license_status()` is what stores `expires`, and it caches
  its answer for six hours, so a verify has to drop the
  `{product_id}_license_status` transient first or it replays a stale yes.
- **Their API answers in sentences, not codes.** A rejected key comes back
  as "License Key is not valid." with no machine-readable field, so the
  seat-limit case is recognized by wording. That mapping is the one part of
  this provider not proven against the live service: every one of Austin's
  BSF licenses is unlimited-activation, so there was no way to make their
  API refuse for seats.

## 下一批候選項目，按實際機群影響排名（2026-07-10）

在 CaptainCore 機群的 2,790 個正式網站上測量（
Manager DB inventory，並針對 wp.org 進行分類；完整來源路徑位於
2026-07-10 工作階段記錄）。已涵蓋集合位居整體排名榜首：
Gravity Forms 2,543 個網站、Gravity SMTP 1,440 個、Elementor Pro 1,191 個、ACF PRO
1,001、WP Rocket 286、Divi 259、WPBakery 129+、Beaver Builder 43+、Bricks
32. 未涵蓋的長尾項目；第 5 波（2026-07-10）發布了第 1–4 項，以及第 5–6 項中的大多數：

1. ~~**WPMU DEV**~~ 已出貨（Dashboard＋Smush Pro）：488＋425 個網站。
2. ~~**Envato Market**~~ 已出貨（權杖／購買碼）：459 個網站。The
   配接器讀取帳戶權杖與每個項目的權杖；Avada、Slider
   Revolution 和 LayerSlider 也取得了各自的專用讀取器（它們的
   程式碼獨立儲存，不依賴 Envato Market 外掛）。
3. ~~**StellarWP / The Events Calendar**~~ 已出貨並升級為 FULL
   啟用（2026-07-11，使用真實金鑰驗證：錯誤金鑰 → 乾淨的
   無效、真實金鑰 → 有效且含到期日、停用）：116 個網站。
   Kadence Blocks Pro 同日推出，並完成相同的驗證。
4. ~~**Gravity Wiz / Gravity Perks**~~ 已出貨（約 103 個網站）：與 GF 配對。
5. ~~**Rank Math Pro**~~ 已出貨（92）、~~**SearchWP**~~ 已出貨（87）、
   ~~**Soflyy WP All Import/Export Pro**~~ 已出貨（81+）、~~**Smash Balloon**~~
   已發布（2026-07-15：Instagram Feed 的完整 activate/deactivate/verify
   Pro、Custom Facebook Feed Pro、YouTube Feed Pro、Custom Twitter Feeds Pro、
   Social Wall、Reviews Feed Pro、TikTok Feeds Pro、Feed Analytics Pro，透過
   smashballoon.com 上的 EDD；「All Plugins」多產品金鑰會啟用每個
   擁有自己的 EDD item_name 的產品；真實金鑰測試 2026-07-15），~~**Yoast
   Premium**~~ 已發布（2026-07-15：MyYoast 入口網站讀取器 + Activate ↗ 以
   `wpseo_licenses` + 確認會重新整理 site_information；不貼上金鑰，
   Rank Math 的形式；需要免費的 wordpress-seo），~~**Admin Columns Pro**~~
   已發布（2026-07-19，v0.20.0：使用真實金鑰完成完整流程；無頭
   容器 bootstrap，已處理金鑰交換權杖；140 個網站）。
6. **低垂果實**：~~Perfmatters~~（142）和 ~~GP Premium~~ 都已獲得
   本輪未涵蓋專用讀取器（一般掃描不會涵蓋它們：
   已重新命名且為非標準的選項名稱）。~~Search & Filter Pro~~ 已發布
   （2026-07-19，v0.20.0：使用真實金鑰，透過他們自己的 REST
   控制器可呼叫項目）。供應商程式碼仍未處理：Unlimited
   Elements、Stackable Premium、Permalink Manager Pro（驗證
   Freemius/EDD 掃描會將這些項目點亮）。

剩餘按機群排名的待辦工作：長尾 Freemius/EDD 驗證
上方清單。

### 供應商系列清單（2026-08-06，未測量）

尚未有授權涵蓋的付費外掛，按類別列出的庫存，
依供應商系列分組，因為所使用的機制共用：第一個
系列中的產品都包含該通訊協定研究，其餘項目成本低廉
後續項目（TEC / Smash Balloon 模式）。安裝數與整個部署的數量
尚未針對這些項目進行測量；請重新執行 2026-07-10 Manager DB
在決定順序前，先對照上方清單檢查庫存。

| 系列 | 產品 | 備註 |
|---|---|---|
| **Awesome Motive** | ~~WPForms Pro~~（已於 2026-08-06 SHIPPED，已驗證錯誤金鑰；請參閱測試表）、AIOSEO Pro、MonsterInsights Pro、WP Mail SMTP Pro、Duplicator Pro、SeedProd Pro、OptinMonster、PushEngage | 最高優先級。WPForms Pro 證實了此系列協定：透過供應商 API 呼叫 tgm-updater 的 verify-key/deactivate-key/validate-key 三件組，金鑰位於一個選項中，另有狀態旗標。同系列產品應遵循相同結構（逐產品 verify；選項名稱不同）。WP Mail SMTP Pro 更能帶來雙重收益：其授權會解鎖真正的 `wpmailsmtp_emails_log` 表，將該轉接器從偵錯事件升級為真正的郵件記錄。Smash Balloon 與 SearchWP（皆屬 AM）已經出貨。 |
| **WooCommerce.com helper** | 所有官方 Woo 擴充功能（WC Subscriptions 是固定項目） | `WC_Helper` 連線狀態 + 訂閱清單，唯讀 + Activate ↗。這可能是代理商和商店網站最有價值的單一授權列。 |
| **SolidWP / iThemes updater** | Solid Security Pro、Solid Backups、Solid Central | 舊版 `ithemes-updater` 套件是獨立協定，沒有任何通用掃描涵蓋；免費版 Solid Security 介面轉接器已存在。 |
| **StellarWP beyond TEC** | LearnDash、GiveWP Pro、Restrict Content Pro、IconicWP | 以 Uplink 為基礎；Uplink catch-all reader 可能已部分涵蓋它們。先進行驗證（GiveWP Pro 的 zip 位於 quicksave 中）。 |
| **WPManageNinja** | Fluent Forms Pro、FluentCRM Pro、FluentBooking、Fluent Support | FluentSMTP 和 Fluent Forms free 已存在；共用一套供應商方案。 |
| **Delicious Brains / WP Engine** | WP Migrate、WP Offload Media、WP Offload SES | 三項產品，一個供應商。WP Offload SES 也有可納入郵件系列的電子郵件記錄。 |
| **Crocoblock** | JetEngine + Jet* 套件 | 約 20 個 Elementor 生態系外掛共用一份授權。 |
| **OTGS / multilingual** | WPML、Polylang Pro、TranslatePress | 介面在結構上暫存於語言維度，但授權列不需要這些。WPML 運行於大量客戶網站上。 |
| **Elementor addon packs** | Essential Addons Pro、Premium Addons Pro、ElementsKit、The Plus | 介面刻意加以隔離；授權仍可讀取。Unlimited Elements、Stackable Premium 和 Permalink Manager Pro 已列在上方的公開清單中。 |
| **Odds and ends** | MemberPress、Meta Box AIO、WCPDF Pro（WP Overnight）、WP Grid Builder、Smart Slider 3 Pro、WP Staging Pro、Barn2、YITH | Meta Box 和 WCPDF 已有介面轉接器，因此其授權列可低成本完成。YITH 是類似 Crocoblock 的多產品自有方案。 |

同一份清單中發現的類別層級介面缺口（流量
供應商、建構器偵測、狀態供應商、新類別）都位於
`docs/plugin-support.md` Waves E 和 F。

測試版本來源於 CaptainCore quicksave 儲存庫
（`captaincore quicksave archive` 從一個
快照而不觸碰狀態）。

防護措施是承重結構，但有一項誠實的修正：

- **絕不重新發明供應商的啟用 HTTP 呼叫。** 應透過
  外掛自身的方法。已測得兩個例外，其中供應商
  完全沒有可呼叫函式：WP All Import 與 Smash Balloon 系列
  其 EDD 請求會逐位元組鏡像自供應商自己的
  控制器程式碼（`minimal_admin_soflyy_edd`、`minimal_admin_smash_edd`；參數
  直接從其來源讀取，絕不自行編造）。沒有任何一項的供應商
  沒有可呼叫的方式，也沒有可鏡像的通訊協定，表示只能深度連結，不提供配接器。
- **「Site limit reached」是一級結果。** 絕不要自動重試失敗的
  啟用；重試可能消耗付費席次。
- **貼上即可啟用，絕不保留。** 不會提供金鑰保管庫，除非
  出現實際需求；若日後真的加入，將採選擇性啟用，並以靜態加密方式儲存。
- **僅限 manage_options。**

## Phase 2 — 隨需更新（大致已隨 Phase 1 完成）

Phase-1 合約中的 `verify` 可呼叫項目就是：每列一個「Re-verify」
觸發供應商自身的重新驗證。其涵蓋範圍遠超過
首先規劃：幾乎每個可呼叫的供應商都具備一個，包括
以最需要處理的暫時性供應商為主（Bricks、Beaver Builder 與
Divi 都會透過各自的重新驗證路徑再次驗證），此外還有 Elementor
Pro、WP Rocket、Gravity Forms、Gravity SMTP、WPMU DEV、SearchWP、Search &
Filter Pro、Admin Columns Pro、Gravity Perks、Perfmatters、GP Premium、
WP All Import/Export、Slider Revolution、LayerSlider、Kadence Blocks Pro、
TEC 系列、Smash Balloon 系列，以及 Yoast SEO Premium 的 MyYoast
重新整理狀態。仍未驗證：ACF PRO、Brizy Pro 與 Etch（啟用並
停用功能已接通，但目前沒有可安全獨立呼叫的重新驗證函式
已識別），以及入口網站連結與唯讀列。Minimal 也
會記住每個供應商自身的檢查結果（狀態文字＋時間戳記，
從不會有金鑰），並用它們升級供應商的「未知」列
不儲存本機有效性，並誠實標示「截至」時間。

## 已測試且確認可運作

驗證標準分為三個層級。**真實金鑰**表示完整流程
已使用真實授權在正式供應商服務上執行：使用
錯誤金鑰（乾淨拒絕，不寫入任何內容），使用真實金鑰啟用（有效
狀態膠囊（可用時顯示供應商到期日），然後停用。**錯誤金鑰**
表示已使用刻意設定的
僅限無效金鑰（乾淨拒絕，不寫入任何內容）；真實金鑰測試是
負責人的步驟。**讀取**表示讀取器已針對實際儲存的
實驗網站上的授權資料。

| 產品 | 操作 | 已驗證 | 日期 | 備註 |
|---|---|---|---|---|
| Slider Revolution | activate / deactivate / verify | 真實金鑰，完整流程，包含真實 ThemePunch deregistration | 2026-07-11 | 啟用也是解除其 updater 鎖定的必要條件 |
| The Events Calendar Pro | 啟用／停用／驗證 | 真實金鑰 | 2026-07-11 | PUE；僅限本機停用（在 theeventscalendar.com 管理網域） |
| Event Tickets Plus | activate / deactivate / verify | 真實金鑰 | 2026-07-11 | 金鑰內嵌於帳戶建置中，並會自行重新註冊 |
| TEC Filter Bar | activate / deactivate / verify | 真實金鑰 | 2026-07-11 | PUE |
| TEC Community | activate / deactivate / verify | 真實金鑰 | 2026-07-11 | PUE |
| Kadence Blocks Pro | activate / deactivate / verify | 真實金鑰 | 2026-07-11 | 金鑰內嵌於建置中；deactivate 會鏡像其 Clear |
| Gravity SMTP | activate / deactivate / verify | 真實金鑰（由擁有者在正式網站上執行） | 2026-07-10 | check-memory 會提升 unknown 狀態 |
| Elementor Pro | activate / deactivate / verify | 錯誤金鑰 | 2026-07-10 | reader 也已透過真實授權證實 |
| ACF PRO | activate / deactivate | 錯誤金鑰 | 2026-07-10 | 已透過真實永久授權證實 reader；尚未接入安全的 verify 路徑 |
| WP Rocket | 僅驗證 | 真實授權（快取實驗室） | 2026-07-10 | 憑證隨供應商 zip 提供；設計上不貼上 |
| Gravity Forms | activate / deactivate / verify | 錯誤金鑰 | 2026-07-10 | save_key 在遭拒後會自行還原 |
| Beaver Builder、Brizy Pro、Etch、Bricks、Divi | 各供應商（請參閱 Phase 1） | 錯誤金鑰／實驗室 | 2026-07-10 | Divi 已在一次性實驗室中證實 |
| WP All Export Pro | 啟用／停用／驗證 | 真實金鑰，完整流程 | 2026-07-11 | 永久授權、無限次啟用；停用為本機操作（不存在席位） |
| WP All Import Pro | 啟用／停用／驗證 | 真實金鑰，完整流程 | 2026-07-11 | 同上；儲存的金鑰以 salt 包裝，任何請求前都必須解碼 |
| Search & Filter Pro | activate / deactivate / verify | 真實金鑰，完整流程 | 2026-07-19 | 透過其自有 REST controller callables 使用 EDD（項目 526297）；狀態位於免費基礎版的 `{prefix}search_filter_options` 表中，JSON 列為 `license-data`；操作需要基礎版 + Pro 啟用；snapshot-restore 可避免遭拒的金鑰覆寫有效啟用（其自有 connect() 會如此） |
| Admin Columns Pro | activate / deactivate / verify | 真實金鑰，完整流程 | 2026-07-19 | 透過 DI-container 服務使用 admincolumns.com 上的自有 API；主檔案受 is_admin() 限制，因此 Minimal 以無頭模式啟動容器（autoloaders + api.php + 他們的六個 definition files，不含 Loader）；啟用會刪除貼上的金鑰，並儲存啟用權杖（`acp_activation_key`）+ `acp_subscription_details` {status active/cancelled/expired, expiry_date ts, null = lifetime}；完全依照其 handlers 套用權限規則 |
| WPMU DEV、SearchWP、Gravity Perks、Perfmatters、GP Premium | 啟用／停用／驗證 | 偽造金鑰 | 2026-07-10 | 已透過種子化的真實結構驗證讀取器 |
| LayerSlider | activate / verify | 錯誤金鑰 | 2026-07-10 | 無 deactivate：其 handler 會在請求中途 die()，席位釋放仍保留在其介面上 |
| Rank Math Pro、Envato、WPBakery | Activate ↗ 連結 | read | 2026-07-10 | 受入口網站或管理員情境綁定的啟用 |
| Yoast SEO Premium | Activate ↗＋驗證 | 讀取（在 MyYoast 前為 missing） | 2026-07-15 | 免費 Yoast `WPSEO_Addon_Manager`；頁面 `wpseo_licenses`；不貼上金鑰 |
| Smash Balloon family（8 項產品） | activate / deactivate / verify | 真實 All Plugins 金鑰 | 2026-07-15 | smashballoon.com 上的 EDD；每個 item_name 使用多產品金鑰 |
| WPForms Pro | 啟用／停用／驗證 | 偽造金鑰（即時 wpforms.com 拒絕、不寫入任何內容、不回顯密密） | 2026-08-06 | 選項 `wpforms_license` {key, type, is_* flags}；其停用操作會將其重設為 ''（字串）；WPFORMS_LICENSE_KEY 常數優先，並阻擋 Minimal 停用；class-license.php 受管理員／cron／CLI 閘控，因此操作需要手動執行；第一個 Awesome Motive 家族供應商 |
| Akismet | activate / deactivate / verify | 錯誤金鑰（即時 akismet.com 拒絕，未寫入任何內容；也透過 spam-card 貼上欄位驅動） | 2026-08-06 | SERVICE KEY，第一個連線中心列；`Akismet_Admin::save_key()` 是完整的 activate（verify + 訂閱檢查 + store），在 REST 下手動 require' admin class；警示選項是本機有效性訊號；predefined_api_key（constant/filter）以唯讀方式呈現 |
| WooCommerce.com, Site Kit, Jetpack, SureCart connections | read + Connect ↗ link-out | read (live states on minimaladmin: WC unconnected → missing, Site Kit half-connected → unknown, Jetpack off) | 2026-08-06 | connections-center brick 3; presence-only reads, tokens never decoded; no actions by design (OAuth stays on vendor screens). SureCart added 2026-08-12: its store token (`sc_api_token`) is read for PRESENCE only, never decrypted, and everything SureCart sells lives in their cloud behind it |
| Brainstorm Force family (Convert Pro, Schema Pro, WP Portfolio, Premium Starter Templates, Spectra Blocks Pro, UABB, UAEL) | activate / deactivate / verify | real keys, full loop on all seven | 2026-08-12 | one provider per product off their registry; Astra Pro shares the identical path but was not on hand to install. Seat-limit wording is unproven (every key is unlimited-activation) |
| Freemius / EDD / SureCart generics, Avada, Smush Pro, AnalyticsWP | read | real stored data on labs | 2026-07-10 | see the verification map above |
| StellarWP Uplink / PUE catch-all | read | 真實儲存資料（TEC six-pack） | 2026-07-11 | registry reader；略過已由專用 provider 宣告的 slug |

當供應商通過真實金鑰驗證或新增供應商時，請保持此表格更新
完成；擴充執行手冊位於 /dev-minimal-admin 技能中。

## Minimal 在此永遠不會做的事

各自的授權狀態，靜默保持外掛啟用、續訂或追加銷售、管理
跨網站共用席次，或在未選擇同意的情況下儲存機密資料。Minimal 只顯示狀態，並
若供應商提供安全路徑，則轉送金鑰。帳務邊界情況仍
供應商的產品。

## 狀態

Phase 0 已於 2026-07-10 發布（可見性：Licenses 卡片、健康檢查、
SDK 通用讀取器）。Phase 1 的第 1–5 波於同日發布：已記錄的
供應商動作契約、依設計不設鎖定機制，以及讀取器與動作的
Elementor Pro、ACF PRO、WP Rocket、Gravity Forms、Gravity SMTP、Beaver
Builder、Brizy Pro、Etch、Bricks、Divi，以及按機群排名的長尾項目（WPMU DEV、
Smush Pro、SearchWP、Gravity Perks、Rank Math Pro、Perfmatters、GP Premium、
WP All Import/Export Pro、Slider Revolution、LayerSlider、Avada、Envato
Market、The Events Calendar 系列 + StellarWP Uplink、Smash Balloon 系列、
Yoast SEO Premium MyYoast）。Search & Filter Pro 和 Admin Columns Pro 加入
2026-07-19（v0.20.0），兩者皆為真實金鑰的完整流程。

截至 v0.24.0、2026-08-06：WPForms Pro 於 2026-08-06 加入（
第一個 Awesome Motive 系列供應商；已驗證錯誤金鑰，真實金鑰測試仍
擁有者的步驟）。在此之前，自 v0.20.0 起沒有新的供應商。管理器位於 Extensions → Licenses（已從 System
v0.12.0 中的卡片；System 保留健康檢查），將非作用中的元件
各列都包含「開啟」控制項，而 v0.21.0 強化了卡片，使其
背景重建不再能在貼上金鑰期間中途消耗金鑰。剩餘項目：
真實金鑰／入口網站啟用流程由擁有者執行，任何仍處於
虛構金鑰等級；若其
程式碼曾公開安全方式的情況下，三個無供應商程式碼的候選項目
（Unlimited Elements、Stackable Premium、Permalink Manager Pro）等待
一般掃描檢查，接著是 Freemius/EDD 的長尾驗證清單。
