# Adapter 涵蓋矩陣

**隨附** Adapter 的持續檢查清單：每個 Adapter 使用哪些 Minimal 介面原語
使用的項目、最後審核時間及刻意保留的深層連結。維護者為
`dev-minimal-admin` 技能中的 **Adapter sweep** 操作手冊（`/dev-minimal-admin sweep`）。

這**不是**行銷地圖。如需了解「哪些外掛會出現在 Minimal 中」，請參閱
`plugin-support.md`。如需描述元合約，請參閱 `for-plugin-authors.md`。
如需完整 UI 階梯（表單引擎、設定對應器、Rung 3），請參閱
`full-ui-adapters.md`.

## 如何閱讀矩陣

| 儲存格 | 意義 |
|---|---|
| **Y** | 已接線且對日常作業有用 |
| **—** | 不適用（外掛沒有此概念，或精簡 shim 已足夠） |
| **L** | 刻意連結至 wp-admin／供應商 UI（畫布、OAuth、條件建構器） |
| **·** | 可能的 Axis A 缺口：Minimal 有該原語，但此 Adapter 尚未使用 |

原語（欄）：

| 欄 | 介面原語 |
|---|---|
| **list** | `collection`（分頁清單＋欄） |
| **tabs** | 狀態／篩選分頁或清單搜尋 |
| **bulk** | 多選批次操作 |
| **detail** | 詳細資料彈出視窗／`sectionsRoute` |
| **manage** | 第二個集合（`manage`） |
| **status** | 狀態卡（`status.route`） |
| **chart** | 狀態卡圖表序列 |
| **settings** | 介面 `settings`（或僅設定） |
| **views** | 額外清單檢視（`views[]`） |
| **suite** | `tests/` 下的 Playwright 套件 |

**不要**將缺少的儲存格視為自動工作。將每個提供者與其
先以 **family reference** 為準。符合兄弟外掛的精簡記錄 shim 已完成。

## 家族（介面 Adapter）

於 2026-07-12 從 Adapter 來源與近期擴充輪次建立。重新檢查
每次掃描都要執行；當庫存發現漂移時，更新儲存格與 `Reviewed`。

### 郵件

參考深度：**Gravity SMTP**。家族文件：`mail-plugins.md`。

| 適配器 | 清單 | 分頁 | 批次 | 詳細資料 | 管理 | 狀態 | 圖表 | 設定 | 檢視 | 套件 | 已審查 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gravity-smtp | Y | Y | Y | Y | — | Y | Y | Y | Y | Y | 2026-07-15 | 設定、Suppressions、Debug log、Routing（切換/刪除）、Filtered 分頁；透過 Event_Model 進行**單筆 + 批次記錄刪除**；條件建立 = **L** |
| fluent-smtp | Y | Y | Y | Y | — | Y | Y | Y | · | Y | 2026-08-06 | 狀態 + 圖表 + 分頁；搜尋 + 刪除；**區段詳細資料**（pill、沙箱化 HTML 內文、供應商回覆 peek、**Resends trail**）；**設定分頁**（預設/備援連線、記錄、保留、透過其 Settings model 進行模擬；連線精靈 = **L**）；**2.3.0 追補**：透過其 `resendEmailFromLog` 重新傳送（trail + 不重複列）、「Resend to…」覆寫操作、ConnectionHealth 狀態卡 + System 列、權限透過 `fluent_mail/manage_capability` |
| post-smtp | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | 狀態 + 圖表 + 分頁；重新傳送；搜尋 + 刪除；**區段詳細資料**（pill、HTML 內文、失敗代碼列）；transcript 仍未公開 |
| wp-mail-smtp | Y | Y | · | Y | — | · | · | · | · | Y | 2026-07-14 | 免費版 = 僅 debug 事件；完整記錄是 Pro 功能 |
| wp-mail-logging | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | 僅記錄；批次刪除；狀態 + 圖表；**區段詳細資料**（pill、HTML 內文、原始標頭 + 錯誤代碼列） |
| suremails | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | Wave B：{prefix}suremails_email_log；sent/failed 分頁；搜尋；單筆+批次刪除；狀態+圖表；區段詳細資料；DB-tz→UTC helper；已安裝但未啟用 |
| site-mailer | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | Wave B：site_mail_logs（Elementor cloud sender）；delivered/failed 分頁；搜尋；刪除；狀態+圖表；區段詳細資料；沒有本地重新傳送（cloud）；已安裝但未啟用 |

### 表單

參考深度：**Gravity Forms**。

| 適配器 | 清單 | 分頁 | 批次 | 詳細資料 | 管理 | 狀態 | 圖表 | 設定 | 檢視 | 套件 | 已審查 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gravity-forms | Y | Y | Y | Y | Y | · | · | Y | Y | Y | 2026-07-17 | 表單設定（項目）、Notifications 檢視、**Feeds 檢視**（附加元件整合：切換/刪除/深層連結；設定對映器延後，見 full-ui-adapters）；表單 builder = **L**；GF 深度不需要狀態/圖表 |
| fluent-forms | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | Unread/spam/trash 分頁 + 批次；套件 `fluent-forms`（24）；啟用中的 fixture |
| elementor-forms | Y | Y | · | Y | · | · | · | · | · | · | 2026-07-14 | Elementor 畫布 = **L** |
| cf7-flamingo | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | CF7 builder = **L**；批次還原/刪除已接線（矩陣已過時） |
| cfdb7 | Y | Y | Y | Y | · | · | · | · | · | Y | 2026-07-15 | 批次刪除已接線（矩陣已過時） |
| ninja-forms | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | 批次移至垃圾桶/刪除已接線（矩陣已過時） |
| forminator | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | 分頁 + 批次 + 搜尋已存在（矩陣已過時） |
| formidable | Y | Y | Y | Y | Y | · | · | · | · | Y | 2026-07-14 | 分頁 + 批次 + 搜尋已存在（矩陣已過時） |
| everest-forms | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | Received/Spam/Trash + 批次；套件 `everest-forms` |
| sureforms | Y | Y | Y | Y | — | Y | · | · | · | Y | 2026-07-17 | Wave B：{prefix}srfm_entries（以 label 為鍵的 form_data JSON → 聯絡人卡片項目）；每個表單分頁；已讀/未讀/垃圾桶篩選 + 狀態操作；搜尋；刪除；狀態卡；已安裝但未啟用 |
| wpforms | Y | Y | Y | Y | — | Y | · | · | · | Y | 2026-08-06 | 僅限 Pro 的 entries（{prefix}wpforms_entries：fields JSON、`date` UTC、viewed/starred flags、''/spam/trash statuses）；每個表單分頁；unread/read/starred/spam/trash 篩選；搜尋 fields JSON；星號 + 已讀 + spam/trash/restore 操作（透過其 entry handler 寫入——hooks 會觸發，刪除會清理 entry_fields/entry_meta）；詳細資料會像其畫面一樣標記為已查看；權限透過 wpforms_current_user_can（已驗證編輯者 403）；狀態卡。啟用中的 fixture（Pro 2.0.0.2 dev zip，已驗證來源）；Lite 不註冊任何內容（沒有 entry handler） |

### 備份

| 適配器 | 清單 | 分頁 | 批次 | 詳細資料 | 管理 | 狀態 | 圖表 | 設定 | 檢視 | 套件 | 已審查 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| updraftplus | Y | — | — | — | — | Y | — | — | — | Y | | 立即備份 + 系統健康狀態；還原 = **L** |
| wpvivid | Y | — | — | Y | — | Y | — | — | — | Y | | 排程 + 立即備份；還原 = **L** |
| duplicator | Y | — | — | — | — | Y | — | — | — | Y | | 套件清單；不宣稱新鮮度 |
| disembark | Y | — | — | — | — | Y | — | — | — | Y | | Connector；CLI command + sessions；沒有新鮮度 |
| backwpup | Y | — | — | Y | — | Y | — | — | — | Y | 2026-07-12 | 本地 FOLDER 封存；立即執行工作；遠端目的地 = **L** |
| ai1wm | Y | — | — | Y | — | Y | — | — | — | Y | 2026-07-12 | .wpress 清單；匯出/匯入精靈 = **L**；沒有新鮮度 |

### 活動記錄

| 適配器 | 清單 | 分頁 | 批次 | 詳細資料 | 管理 | 狀態 | 圖表 | 設定 | 檢視 | 套件 | 已審查 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| simple-history | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | 真實 REST 清單；**狀態**卡（24 小時/7 天/總數/嚴重性） |
| wp-activity-log | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | 絕不 unserialize meta；**狀態**卡（24 小時/7 天/高+嚴重） |
| aryo-activity-log | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | 本地 epoch 陷阱；**狀態**卡（24 小時/7 天/頂級操作） |
| stream | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | **狀態**卡（24 小時/7 天/頂級 connector）；以 blog_id 限定範圍 |
| wordfence | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-14 | 登入記錄 + 安全態勢列；未啟用的 fixture（系列） |
| limit-login-attempts | Y | · | — | Y | — | Y | — | — | — | Y | 2026-07-14 | Unlock 操作；啟用中的常駐項目 |
| solid-security | Y | · | — | Y | — | Y | — | — | — | Y | 2026-07-14 | 發布 + 安全態勢；目前在 minimaladmin 上**啟用**（原先遵循未啟用慣例） |
| all-in-one-security | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-17 | Wave B：稽核摘要（{base_prefix}aiowps_audit_log，將 JSON details 展平為 Context 列，UTC epoch）；層級分頁 + 搜尋 + 狀態卡；已安裝但未啟用（WSAL/LLA 常駐）；套件 `aios-log` |

### 重新導向／片段

| 適配器 | 清單 | 分頁 | 批次 | 詳細資料 | 管理 | 狀態 | 圖表 | 設定 | 檢視 | 套件 | 已審查 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| redirection | Y | · | Y | Y | — | Y | Y | Y | — | Y | 2026-07-17 | 設定閘門 + options；**狀態卡**（規則、命中數、7 天已提供/404、雙 14 天圖表）；套件 `redirection-status` |
| safe-redirect-manager | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **狀態卡**（規則、狀態碼組成、regex 數量；SRM 不儲存命中數）；套件 `redirects-status` |
| simple-301-redirects | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **狀態卡**（規則數量 + wildcard 切換；儲存內容是單一 option array）；套件 `redirects-status` |
| eps-301-redirects | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | source 不加前導斜線；**狀態卡**（規則、生命週期命中數、頂級重新導向、404 記錄） |
| code-snippets | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **狀態卡**（啟用/停用/已移至垃圾桶、執行範圍、最後變更、安全模式警告）；系列中的第一張卡 |
| wpcode | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **狀態卡**（啟用/停用、執行類型、最後變更） |
| fluent-snippets | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **狀態卡**（啟用/停用 + 檔案儲存備註） |
| custom-css-js | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | CPT shim；寫入時重建樹；**狀態卡**（啟用中的程式碼、透過 regex peek 取得的執行語言） |
| hfcm | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | hfcm_scripts；頁面定位 = **L**；**狀態卡**（啟用/停用、執行類型、最後變更） |

### 僅設定／其他介面

| 適配器 | 形狀 | 套件 | 已審查 | 備註 |
|---|---|---|---|---|
| perfmatters | 僅設定（核心 Settings API）；系列 `performance` | Y | 2026-07-14 | Settings-API 對映器的參考 |
| autoptimize | 僅設定（精選 options）；系列 `performance` | Y | 2026-07-14 | Toggle 儲存 `on`/empty；purge 仍在 cache-purge 中 |
| asset-cleanup | 僅設定（JSON option）；系列 `performance` | Y | 2026-07-14 | 頁面層級 unload manager 深層連結 |
| performance-lab | 功能清單 + 狀態 + 啟用/停用；系列 `performance` | Y | 2026-07-14 | WP Performance Team 獨立外掛的中心 |
| licenses | Extensions → Licenses（篩選供應商） | Y | | 使用 license-manager skill loop 處理新供應商 |
| spam | 設定 → Spam cards | Y | | |
| seo | 編輯器面板（供應商） | Y | | |
| meta-box | 編輯器面板（簡單欄位） | Y | 2026-07-14 | Clone/media = 鎖定 + 深層連結 |
| seriously-simple-podcasting | 編輯器面板（ssp_post_types 上的單集詳細資料） | Y | 2026-07-17 | Schema 來自其 CPT_Podcast_Handler::custom_fields()（container service）；'on'/'' checkbox 慣例；封面圖片鎖定；Castos sync 未變更；啟用中的 fixture + 固定示範單集 |
| the-events-calendar | 編輯器面板（tribe_events 上的 Event details）+ `suggest` 面板原語 | Y | 2026-07-17 | 透過其自有 REST endpoint payload shape 中的 Tribe__Events__API::saveEventMeta 寫入；場地/主辦人透過新的 async-suggest 欄位（minimal-admin/v1/tec/suggest）；多主辦人活動會鎖定欄位；週期/票券/時區 = **L**。啟用中的 fixture（六件組） |
| powerpress | 編輯器面板（文章上的預設頻道單集） | Y | 2026-07-17 | Enclosure blob mirrored（已記錄的例外：沒有可呼叫的寫入 model）；以差異為基礎重建，未管理的額外內容以位元組保留；手動編輯時設定 set_duration/set_size flags；清除 URL = 其移除流程；已安裝但未啟用（SSP 是 podcasting 常駐項目） |
| wp-job-manager | 編輯器面板（job_listing 上的 Listing details） | Y | 2026-07-17 | Schema 來自其 get_job_listing_fields()（依網站/附加元件篩選）；依其 per-field sanitize_callbacks 規則寫入（application email-or-url、expiry Y-m-d）；checkbox 使用 1/0 整數；其儲存受 nonce 閘門保護，因此 REST 寫入安全；rest_base job-listings；啟用中的 fixture |
| pods | 編輯器面板（擴充類型上的簡單欄位） | Y | 2026-07-14 | 進階類型鎖定 + 深層連結 |
| safe-svg / svg-support | 媒體 SVG 篩選分頁 + 以供應商命名的詳細備註 | Y | 2026-07-17 | 清理仍由外掛負責；備註僅宣稱 Safe SVG 具備此功能；SVG Support 已安裝但未啟用 |
| regenerate-thumbnails / force-regenerate-thumbnails | 媒體詳細資料 ↻ Thumbnails | Y | 2026-07-17 | RT 透過其 Regenerator class；RT 不存在時，FRT 透過自己的 admin-ajax + nonce；FRT 已安裝但未啟用 |
| enable-media-replace | 媒體詳細資料「Replace file」（EMR 自己的 ReplaceController） | Y | 2026-07-17 | 僅限原地操作（同名/同 URL，強制相同類型）；重新命名/移動 = **L**，導向 EMR 的畫面；啟用中的 fixture |
| media-folders (FileBird / RML Lite / Premio Folders) | 媒體檢視資料夾 combobox（`minimal_admin_media_folders` 供應商合約） | Y | 2026-07-17 | 以瀏覽為先；三個內建供應商，第一個啟用者優先（FileBird 透過自己的 model，遵守每位使用者模式；RML 透過 wp_rml_* API，根目錄 -1「未分類」→ 保留 ID 0；Premio 透過其 REST 公開的 `media_folder` 分類法，include_children 符合其篩選器）。資料夾管理 = 對每個外掛 UI 均為 **L**。FileBird 啟用中的 fixture；RML + Premio 已安裝但未啟用（一次一個的慣例） |
| cache-purge | ⌘K 清理器（+ Redis System 列） | Y | 2026-07-12 | SpeedyCache、Redis、Breeze、Nginx Helper、Cloudflare 套件 |
| site-kit / koko / burst / ia / … | 流量供應商（+ 每日深入分析） | 部分 | 2026-07-29 | Koko、WP Statistics、Burst、Independent Analytics、Matomo、Jetpack Stats 的總覽圖表 + traffic_day |
| matomo | 流量供應商（+ 每日深入分析） | Y | 2026-07-29 | 透過 Bootstrap + `doAsSuperUser` 使用其 reporting API（其 Annotations 先例）；`view_matomo` 閘門；15 分鐘 transient（環境啟動約 300ms）；數字符合其 UI，包括每小時 cron-archive 延遲；已安裝但未啟用（Koko 常駐）；套件透過其 HTTP tracker + `minimal_test_matomo_archive` 建立 seed，執行其 archiver |
| jetpack-stats | 流量供應商（+ 每日深入分析） | Y | 2026-07-29 | WPCOM_Stats blog-token client（其 5 分鐘快取）；閘門：已連線 + stats module + `view_stats`；優先級 20（Site Kit 層級）；依頁面計數依 WPCOM 設計僅供檢視；2026-07-29 在即時連線網站上完成端到端驗證（造訪、熱門文章、引薦來源皆符合其 UI）；已安裝但未啟用 |
| query-monitor | 面板（不是介面） | — | 2026-07-13 | Footer arm + launcher chip；僅限本次請求 |
| scrutoscope | 診斷系列（清單 + 詳細資料 + 狀態 + Cron 檢視 + 1.4+ 的 Profile this hook） | Y | 2026-08-06 | 系列 `diagnostics`；擷取 UI = **L**；Profile 會在其 profiler 下觸發真實副作用；**1.5+ 完全沒有直接 SQL**（清單透過其 `/v1/profiles`，狀態透過 `Storage::get_table_stats()`）；保留欄位讀取作為 1.5 之前的 fallback |
| wp-crontrol | 診斷系列（清單 + 詳細資料 + 狀態；執行/暫停/恢復/刪除） | Y | 2026-07-13 | 系列 `diagnostics`；新增/編輯 PHP/URL 工作 = **L** |
| transients-manager | 診斷系列（清單 + 詳細資料 + 狀態；刪除 + 刪除已過期項目） | Y | 2026-07-13 | 系列 `diagnostics`；絕不 unserialize；編輯 UI = **L** |
| rewrite-rules-inspector | 診斷系列（清單 + 詳細資料 + 狀態；flush + 測試 URL） | Y | 2026-07-13 | 系列 `diagnostics`；透過其 RewriteRules / UrlTester；不提供強制 .htaccess flush |

## 刻意保留的深層連結（不要重新提議為 Axis B）

- 表單／頁面／條件 **建構器**與 OAuth 交握
- 備份 **還原**（手術式操作，不是日常作業）
- GSMTP **路由條件樹**編寫（列出／切換／刪除已接線）
- GF **通知**事件／條件邏輯／路由規則（日常欄位已接線）
- 沒有 fixtures 的 Pro 專用儲存區（WP Mail SMTP Pro 完整記錄、WPForms Pro entries）

## 掃描記錄

| 日期 | 範圍 | 結果 |
|---|---|---|
| 2026-07-12 | 建立 Skill 與此矩陣 | 將以報告為先的操作手冊加入 `dev-minimal-admin`；不自動發布 |
| 2026-07-13 | v0.14.0 開放／Dev tools 審查 | QM 歸類為僅面板；Scrutoscope＋WP Crontrol＋Transients Manager 列入外掛支援 Wave A；未發布 |
| 2026-07-13 | Scrutoscope Adapter | Profiler 介面已發布（設定檔、詳細資料、狀態、Cron 檢視、刪除）；套件 22 項檢查 |
| 2026-07-13 | WP Crontrol Adapter | Cron 介面已發布（清單、立即執行、暫停／繼續、刪除、狀態）；套件 20 項檢查 |
| 2026-07-13 | 診斷家族＋Transients | Scrutoscope＋Crontrol＋Transients Manager 合併為一個 Tools 項目；TM 套件 17 |
| 2026-07-13 | Rewrite Rules Inspector | Diagnostics → Rewrites（清單、立即清除、測試 URL）；套件 15 |
| 2026-07-14 | 聚焦報告：郵件 → 表單 → 活動記錄 | 下方為排名待辦事項；**未發布**（以報告為先）。郵件參考 = Gravity SMTP；fixtures：FluentSMTP＋WP Mail Logging＋Gravity SMTP 啟用 |
| 2026-07-14 | 發布最高項目 1：fluent-smtp 搜尋＋刪除／批次 | 與 GSMTP／WPML 的 Axis A 相等性；mail-log 套件 17 項檢查 |
| 2026-07-14 | 完整僅報告重新掃描（郵件 → 表單 → 活動記錄 → 重新導向／片段 → 備份；fixtures 庫存） | 已修正矩陣儲存格（forminator／formidable／everest／fluent-forms）；**未發布**。最高發布項目 = post-smtp 搜尋＋刪除／批次 |
| 2026-07-14 | 發布：post-smtp 搜尋＋單筆／批次刪除 | 與 WPML／FluentSMTP 的 Axis A 郵件相等性；mail-log 套件擴充 |
| 2026-07-14 | 發布：fluent-forms Playwright 套件 | Axis A 涵蓋缺口已關閉；24 項檢查（清單／分頁／篩選／搜尋／詳細資料／垃圾桶／刪除／管理）；Seeder `minimal_test_seed_fluent_forms` |
| 2026-07-15 | Axis A：gravity-smtp 批次刪除記錄 | 透過 Event_Model（DELETE_EMAIL_LOG）執行單筆＋批次刪除；mail-log 套件擴充；修正 cf7／cfdb7／ninja 批次的矩陣（程式碼原本已為 Y） |
| 2026-07-15 | Axis A：活動記錄狀態卡 | Simple History、WSAL、Stream、Aryo 狀態卡（24 小時／7 天／總計＋家族專屬組合）；套件 `activity-log-status` |
| 2026-07-17 | 發布最高項目 1：sectionsRoute 列類型 | sections 詳細資料轉譯器中的 `pill`／`code`／沙盒化 `html-preview`／`kv-table` 列；合約 fixture Log 檢視會使用惡意 payload 測試全部四種（套件 detail-rows，19 項檢查，包括沙盒與跳脫證明）；Gravity SMTP 記錄詳細資料作為第一個使用者完成轉換（狀態膠囊、HTML 內容預覽、標頭 kv-table）。Fluent／Post／WPML 轉換是自然的下一批切片 |
| 2026-07-17 | Wave B：SureMails + Site Mailer 郵件 adapters | 兩者皆使用已驗證的免費日誌資料表；完整郵件系列處理（list/tabs/search/delete/status+chart/sections detail，含沙盒化 HTML）。新增共用 helper minimal_admin_db_local_to_utc_iso()：DEFAULT current_timestamp() 會依 DB SESSION 時區運作（受管理主機為 UTC，Cove 的開發 MariaDB 為 LOCAL）——只向 DB 詢問一次其 offset 後進行位移，可在任何主機正確運作。測試套件 wave-b-mail 17。兩者皆已安裝但未啟用。SEED 陷阱：`wp eval "…$wpdb…"` 會讓 shell 展開 $wpdb；請使用 eval-file |
| 2026-07-17 | Wave B：安裝 + 來源驗證（AIOS、GoSMTP、SureMails、Site Mailer） | 四者全部安裝；已驗證免費層級的日誌儲存。AIOS 已提供（activity-log audit feed）。SureMails（{prefix}suremails_email_log）+ Site Mailer（site_mail_logs）已驗證可免費儲存完整日誌 → 排入郵件系列 adapters。GoSMTP 跳過：其 \GOSMTP\Logger 僅限 Pro，免費版本不儲存日誌（wp-mail-smtp-free 模式）。AIOS + 兩個郵件候選者均已安裝但未啟用；GoSMTP 保持已安裝但未啟用，並記錄為已說明的跳過項目 |
| 2026-07-17 | 重新導向兄弟外掛狀態卡（Axis A 相等性批次） | SRM（CPT＋狀態碼／regex meta；無命中資料，卡片如實停在規則）、Simple 301（選項陣列＋萬用字元切換）、EPS（自有資料表：規則、生命週期命中、熱門重新導向、404 記錄）。套件 `redirects-status`（7）會啟用每個停用的兄弟外掛並還原。狀態卡相等性章節完成：郵件、片段與重新導向中的每個介面現在都會以卡片開啟 |
| 2026-07-17 | Snippets 系列狀態卡（Axis A 對等批次） | wpcode（CPT publish=active + type meta）、fluent-snippets（已索引的檔案儲存區）、custom-css-js（CPT + _active meta；從序列化選項中以 regex 偷看 languages，絕不反序列化）、hfcm（自有資料表）。全部符合 code-snippets 卡片形狀；測試套件 snippets-adapters 19 / snippets-leftovers 15 |
| 2026-07-17 | 郵件家族 sections 詳細資料（Axis A） | fluent-smtp、post-smtp、wp-mail-logging 的記錄詳細資料已轉換為 sectionsRoute，使用新的列類型（GSMTP 模式）：狀態膠囊、沙盒化 HTML 預覽／程式碼內容、各儲存區額外資訊（供應商回覆預覽、失敗＋建議修正、原始標頭）。保留扁平路由供 API 消費者使用；mail-log 套件 30 |
| 2026-08-09 | v0.26.0 发布前检查（update-all + 冒烟测试） | 自昨天的检查以来提供了三项更新：metform 4.1.9 已更新（无适配器）；perfmatters 2.6.7 和 searchwp 4.6.1 下载失败（受许可证限制，这是已知模式——已记录，不阻塞发布）。已安装的 2.6.6 中，Perfmatters 设置路由冒烟测试返回 200。没有与适配器相关的变更，也没有破坏性变更 |
| 2026-08-08 | v0.25.0 發布前檢查（update-all + smoke） | **Gravity Forms 2.10.5 → 3.0.2（重大版本）**：完整路由 smoke 通過（gf/v2 forms/entries、shim 的 forms/notifications/entry detail/form settings；notes 路由依設計僅支援 POST），gf-notifications + gf-form-settings 套件也在發布前檢查中執行。Elementor 4.2.2 及其他修補版本更新沒有與適配器相關的差異。沒有破壞性差異 |
| 2026-07-17 | 下一個發布：code-snippets 狀態卡 | 來自其自有資料表的啟用／停用／已丟棄計數、執行範圍、最後變更，以及安全模式警告列（依其 class-db docblock，active -1 = trashed）；套件 code-snippets 26。掃描衛生註記：報告中片段／重新導向的「家族狀態相等性」宣稱是 grep 過度匹配；這兩張卡是家族中的 FIRSTS，兄弟外掛才是真正的相等性待辦事項 |
| 2026-07-17 | 可排序表面欄位（Austin 的要求） | 新的 collection primitive：column `sort` tokens + `sortQuery` template，可點擊標頭採用 users-list 的方向慣例（num/ago 起始為 desc）；validator + author guide + contract fixture 同步更新（contract 39）。先接入 Redirection（Source/Hits/Last hit 使用其 orderby 詞彙）；redirection-status 測試套件現為 14 |
| 2026-07-17 | 發布最高項目 1（第二切片）：redirection 狀態卡 | 來自 Redirection 自有記錄資料表的規則／命中／服務／404 列＋雙序列 14 天圖表（由 SHOW TABLES 控制、使用符合其記錄檢視的網站本機 DATE 分桶）；套件 redirection-status（10）。重新導向家族中的第一張狀態卡 |
| 2026-07-17 | PowerPress 面板（播客分類完成） | 一般文章上的單集面板，僅限 DEFAULT 頻道（一般 `enclosure` meta）。不存在可呼叫的寫入模型（其儲存是單一 $_POST['Powerpress'] handler，受 nonce／POST 控制 → REST-safe），因此鏡像 blob 格式——附帶防護措施的文件化例外：其精確的 allowed_classes=>false unserialize；以 DIFF 為基礎重建（未變更儲存 = 位元組完全相同的 blob，已由探測證明）；未管理的額外欄位（hosting、chapters、artwork、50+ keys）保留位元組；手動變更 duration／size 會設定其 set_duration／set_size「modify」旗標；清除 URL 會刪除 enclosure＋舊版 itunes:duration（其移除流程）；episode_type 列舉 ''／full／trailer／bonus；內容類型會在 URL 變更時透過 powerpress_get_contenttype 自動衍生。自訂頻道（_slug:enclosure）＋podcasting 文章類型＋artwork／explicit／chapters／transcripts = 其 metabox（鎖定 4）。套件 powerpress-panel（8，啟用＋還原）。已安裝但停用（SSP 常駐）。依兄弟外掛報告，播客分類已完成（Podlove／10up／Podcast Player = 文件化跳過） |
| 2026-07-17 | WP Job Manager 面板（SSP-siblings 報告後續） | job_listing 上的職缺列表面板（rest_base job-listings）：14 個欄位，0 個鎖定，於請求時從 WP_Job_Manager_Post_Types::get_job_listing_fields() 取得（已由 job_manager_job_listing_data_fields 篩選 → 外掛擴充功能可即時追蹤）。若欄位有宣告，寫入時會呼叫各欄位自己的 sanitize_callback（application email-or-url、expiry date → 垃圾值變為 ''），checkbox data_type 為 integer 1/0，select 會驗證 enum。其 save_post handler 受 job_manager_nonce 保護 → REST 安全。測試套件 wpjm-panel（6）。ACTIVE fixture。報告剩餘項目：PowerPress（enclosure-blob 特殊問題，M），完成 podcasting 類別後即可結案 |
| 2026-07-17 | TEC Event details 面板 + async-suggest primitive（Austin 從 SSP-siblings 報告中挑選） | 新增面板欄位類型 `suggest`（formControlHtml/formControlValue/bindSuggestField + 面板 binder）：非同步搜尋選擇器，欄位宣告 `route`，使用 &q= 取得資料，列格式為 [{value,label}]，Minimal 會加上「— None」，值以 {value,label}|'' 往返——已記錄於 author guide。TEC adapter：tribe_events 上的 Event details 面板（開始/結束為 'YYYY-MM-DD HH:MM' 文字、全天、透過 minimal-admin/v1/tec/suggest 進行場地+組織者建議、費用、網站），透過 Tribe__Events__API::saveEventMeta 寫入，並使用其 REST endpoint 的精確 payload 形狀（EventStartDate Y-m-d + EventStartTime H:i:s + venue.VenueID + organizer.OrganizerID）。艱難取得的結論：tribe_events() ORM 無法更新沒有日期的草稿（其查詢會連接 start-date meta——正是 Minimal 的 + New 輸出）；saveEventMeta 可以處理。開始時間晚於結束時間時，TEC 會自動修正（其管理介面行為），而非拒絕；真正無效的 meta → 其 false → 400。多組織者事件會鎖定組織者欄位（單選會捨棄其餘組織者）。測試套件 tec-panel（8，真實型別的建議選取 + 全天日期界線貼合） |
| 2026-07-17 | Seriously Simple Podcasting Adapter（Austin 的要求） | 審查判定：單集在 Minimal 中已是一級內容（`podcast` CPT show_in_rest，自訂 podcast 權限透過 edit_post 對應）——缺少的是單集詳細資料 metabox，現已以 **Podcast episode editor panel** 發布。Schema 直接從 ssp_app()->get_service('cpt_podcast_handler')->custom_fields() 讀取（radio→select、episode_file→url、checkbox→'on'/'' 儲存、hidden/sync_status 跳過、封面圖片鎖定）；在 ssp_post_types() 上使用專用 minimal_ssp REST 欄位（絕不使用一般 meta）；enum 寫入會依其選項驗證。安全性：沒有其 metabox nonce 時，其 save_post handler 會直接返回，因此 REST 儲存不會被覆寫；不會觸及 Castos podmotor 欄位。Feed／show 設定（系列 taxonomy＋ss_podcasting_* options framework）= 延後，terms manager 已涵蓋系列。套件 ssp-panel（7）。ACTIVE fixture＋固定的「Welcome to the Show」單集 |
| 2026-07-17 | GF Feeds 檢視（待辦排名 10 已解決） | 判定：發布 feeds 檢視，設定 MAPPER 延後。GF 介面新增 Feeds `views[]` 項目（僅在存在 GFFeedAddOn 時註冊）：每個表單中的所有附加元件整合，各表單分頁、啟用／停用（GFFormsModel::update_feed_property）、刪除（GFAPI::delete_feed）、深層連結至附加元件的 feed 畫面（subview={slug}&fid={id}）。重要發現：GFAPI::get_feeds 預設 $is_active=true——傳入 null，否則停用的 feed 會消失（建置期間踩到）；其「not_found」WP_Error 僅表示沒有 feed。設定對應器延後，完整 UI Adapter 文件中已有書面判定（需要第二個項目範圍設定原語，以及不含憑證的可對應附加元件 fixture）。FIXTURE：minimaladmin 上的 gravityformstwilio 已啟用（從 anchor 複製，符合 GF 慣例）。套件 gf-feeds（10）；gf-notifications 的固定切換器清單放寬為前三項（rule-52 類別） |
| 2026-07-17 | fluent-smtp 設定分頁（待辦排名 9 已解決） | 結論：接入雜項設定，為精靈建立深層連結。FluentSMTP Email surface 上新增 `settings` 分頁：預設 + fallback connection（其 connections 的 combobox，僅標題/寄件者——絕不包含認證資料；未知 key → 400）、log_emails toggle、retention select（其預設天數；非標準儲存值仍可選取）、simulate_emails toggle（當 FLUENTMAIL_SIMULATE_EMAILS 常數強制啟用時隱藏並鎖定）。透過 Settings::getMisc() 讀取，透過 Settings::updateMiscSettings() 寫入——與其自有 SettingsController 完全相同。每個 provider 的 connection wizard 仍留在 FluentSMTP app 中（深層連結）。測試套件 fsmtp-settings（8）；mail-log 仍為 30 |
| 2026-07-17 | 移至資料夾（媒體批次列） | 合約新增選用的 `move( $folder_id, $ids )`（0 = 不在任何資料夾中；啟動 mediaFolders.move 會控制 UI；路由 POST media/folders/move 僅在提供時註冊，並檢查 upload_files＋供應商自身條件）。批次列新增資料夾選擇器＋移動按鈕（選取前停用 Move；完成後清除計數快取）。三個供應商皆透過自身機制接線：FileBird 驗證 verifyAuthor＋Folder::assignFolder（其 hooks＋計數器會觸發）、RML wp_rml_move（其驗證，根目錄 -1 表示移出）、Premio wp_set_object_terms（空清單 = Unassigned）。三者皆已測試兩個方向；套件 media-folders 20 |
| 2026-07-17 | Wave D 對等補充：SVG Support + FRT | SVG Support 加入 Safe SVG gate（minimal_admin_svg_provider()：兩者皆啟用時 Safe SVG 優先；啟動 `svgProvider` 指定它；詳細資料備註僅對 Safe SVG 宣稱清理——其上傳時清理依角色設定）。Force Regenerate Thumbnails 透過其自己的 admin-ajax handler + boot 中的 'force-regenerate-attachment' nonce `frt` 加入 ↻ Thumbnails（wcpdf precedent；遵循其 cap property；兩者皆啟用時 RT 優先；套用 FRT 的 delete-stale-files 語意，如其 Tools 畫面）。測試套件：safe-svg 12（provider swap leg）、media-regen 10（真實 FRT ajax 重建）。兩者皆已安裝但未啟用（Safe SVG + RT 保持為常駐項目）。WAVE D 完成 |
| 2026-07-17 | Wave D：RML Lite + Premio Folders providers | 兩個同類 provider 加入 minimal_admin_media_folders。RML：公開的 wp_rml_* API（wp_rml_objects / wp_rml_get_attachments；每個資料夾使用 getCnt）；根 id -1「Unorganized」對應合約保留的 0；Lite 沒有子資料夾/每使用者模式。Premio：一般 WP taxonomy `media_folder`（僅在 option folders_settings 包含「attachment」時註冊——2026-07-17 已在 minimaladmin 設為 SET，請保留）；terms = 資料夾，ids 透過 tax_query include_children（其篩選語意），未指派（-1 檢視）= 保留的 0；taxonomy 為 show_in_rest，因此測試套件透過 CORE REST 建立資料。兩者皆以真實指派進行 E2E 探測；測試套件 media-folders 15（phase 2 = 即時 FileBird→Premio 交換，finally 中還原常駐項目）。RML 測試套件部分跳過：沒有 REST 建立資料路徑（改以探測驗證） |
| 2026-07-17 | Wave D：媒體資料夾合約 + FileBird | 新增 provider 篩選器 `minimal_admin_media_folders`（first-non-null、traffic-style；已記錄於 author guide + Integrations listeners）：folders() 平面列表，含 parent+count（id 0 保留 = Uncategorized），ids(folder)。核心路由 GET media/folders（依樹狀順序並含 depth）+ media/folders/{id}/ids（上限 newest-500，含 capped flag）→ client 透過 include= 以資料夾 combobox 進行篩選（空資料夾會短路——沒有 ids 的 include= 代表不篩選）。FileBird 使用其自己的 model（allFolders/countAttachments/verifyAuthor/getAttachmentIdsByFolderId；每使用者模式透過其 fbv_folder_created_by filter；未分類項目鏡像其作用域 NOT IN 子句）。測試套件透過 FileBird 自有 REST 建立資料（filebird/v1 new-folder/assign-folder/delete-folder、upload_files + nonce）：測試套件 media-folders（12）。FileBird ACTIVE fixture。移至資料夾 + RML/Premio providers = 後續工作 |
| 2026-07-17 | Wave D：核心媒體優化 | 未附加項目的靜默篩選（核心 parent=0）、月份 combobox（新的 GET minimal-admin/v1/media/months；client 建立包含首尾的本地 after/before 視窗）、「Attached to」媒體詳細資料 modal 欄位（附件上的延遲 REST 欄位 minimal_attached_to：parent title/type/rest_base/editable；點擊後跳轉至父項目的編輯器）。媒體工具列移至兩列 views/filters 慣例。測試套件 media-polish（15）。核心媒體缺口項目結案；Wave D 排名 6 全部完成 |
| 2026-07-17 | Wave D 開始：啟用 Media Replace adapter | 透過 EMR 的 ReplaceController，在媒體詳細資料 modal 中 ⇅ 替換檔案（MODE_REPLACE + TIME_UPDATEMODIFIED，使用其預設值）：移除舊檔案，新檔案使用相同路徑，重建 metadata + thumbnails，並觸發其 hooks。Caps 與 EMR 一致（upload_files + checkImagePermission，遵循 EMR_CAPABILITY）。伺服器端進行相同類型防護（原地替換會保留 URL，因此副檔名不得謊報）；重新命名與搜尋仍使用 EMR 的畫面。啟動旗標 `mediaReplace`；測試套件 media-replace（12，真實檔案選擇器 + served-bytes 證明）。minimaladmin 上的 EMR ACTIVE fixture |
| 2026-07-17 | v0.18.0-open 僅報告重新掃描（全部 73 個 adapters、primitive grep + fixture 狀態） | v0.17.0 暫停後恢復各 Wave。郵件圖表對等性確認完成（fluent-smtp、post-smtp、wp-mail-logging 全部帶有 `chart`）。Axis A 新發現：**redirection**（啟用中的常駐項目）與 **code-snippets**（啟用中的常駐項目）是唯一沒有 `status` 卡片的系列表面。sectionsRoute 列類型仍未建立（`pill` 僅存在於欄位格式中）。Fixture 備註：SearchWP 已停用（其 profile_update loopbacks 拖慢每次使用者儲存；授權讀取在停用狀態仍可運作）。Wave B/D 候選者（AIOS、GoSMTP/SureMails/Site Mailer、SureForms/MetForm、FileBird、Enable Media Replace）全部未安裝。**不發布。** |
| 2026-07-23 | v0.21.0 open 的 roadmap-doc 過時檢查 | v0.19.0（WooCommerce 深度）、v0.20.0（consent + Search & Filter Pro / Admin Columns Pro 授權）或尚未發布的 v0.21.0（優化：i18n、a11y、啟動整合、updater hash）週期中沒有 adapter 工作，因此矩陣維持不變。Ranked-backlog 第 4-5 列劃除（於 2026-07-17 出貨，正好是待辦建立的同一天稍晚）。目前開放待辦僅剩排名 7：WPForms Pro 項目（fixture 需要 Pro 授權） |
| 2026-07-24 | v0.22.0 open 的 roadmap 更新（v0.21.0 同日發布） | v0.22.0 週期以唯讀資料庫檢視器開始，這是 NATIVE surface（`class-minimal-admin-db.php` + bespoke view、`native-editors.md` case study 2）而非 adapter，因此矩陣未變更。本週期目前尚無 adapter 工作。開放待辦不變：WPForms Pro 項目（受授權阻擋），以及刻意保留的長尾項目（當 sweep 排程時處理系列狀態卡同類項目） |
| 2026-07-27 | v0.22.0 adapter 掃描（僅報告）：先 update-all，再盤點 | **外掛：** minimaladmin 上 21/22 已更新（見下方列表）。**Elementor Pro 4.1.2→4.2.0 更新失敗**（授權閘門）；免費版 Elementor 為 4.2.0，因此免費/Pro 版本不一致。Axis A 矩陣儲存格仍與程式碼一致（郵件圖表對等性、郵件/redirects/snippets/activity-log 的狀態卡、適用時的 forms manage）。根據變更日誌的 Axis B：**Scrutoscope 1.4** 的隨選 cron profiling 是唯一真正的出貨候選（admin-ajax + `Profiler::profile_cron_hook`；目前 Cron 檢視僅供盤點）。Disembark 2.8 restore 刻意保持 **L**（手術式修改）。Stream 4.3 / WSAL 5.6.5 / IA 2.15 / SVG Support 2.6 / Updraft 1.26.6 / Yoast 28.1：沒有 adapter 可見的日常營運差異。Smoke：elementor submissions、scrutoscope profiles+cron、disembark status 全部 200。**不發布。** |
| 2026-07-27 | 出貨排名 1：scrutoscope Profile this hook | Axis B：Cron 檢視列操作會 POST `minimal-admin/v1/scrutoscope/cron/{id}/profile` → `Profiler::profile_cron_hook`，並帶入該列的 scheduled args；確認名稱副作用；方法不存在時隱藏操作。Fixture no-op hook `minimal_scruto_profile_noop` 由既有 seeder 排程。測試套件 scrutoscope 已擴充。 |
| 2026-07-27 | 下一個排名 1 出貨：disembark Restore deep-link | Axis B：狀態卡 `Restore a backup` href → `tools.php?page=disembark`（當存在 `\Disembark\Import` 時，2.8+）；restore UI 保持 **L**。測試套件 disembark 已擴充。 |
| 2026-07-27 | 下一個出貨：AIOS 失敗登入 / 永久封鎖狀態 | Axis B：狀態卡從 `aiowps_login_lockdown`、`aiowps_permanent_block`、audit_log `failed_login` 新增 Failed logins (24h) / Locked out now / Permanent blocks；System `minimal_admin_aios_checks()` health row；深層連結至 AIOS locked-ip / permanent-block 分頁。測試套件 aios-log 已擴充。 |
| 2026-08-06 | scrutoscope：接入其 1.5 list API（供應商回報，GitHub issue #3） | 軸 B，由外掛作者提出。Scrutoscope 1.5.0 新增 `GET /scrutoscope/v1/profiles`，專門讓整合者停止讀取資料表；現在清單透過 `rest_do_request` 執行（以 `RestApi::shape_profile_list_item` 為閘門，即其合約命名的 shaper），狀態總數透過 `Storage::get_table_stats()` 取得。**成果不在於整潔：其輸出 Sanitizer 會在該路徑執行，而我們的路徑不會**（精簡後的 SQL + 僅主機的 HTTP URL 會在讀取時重新套用，作為舊版建立資料列的縱深防禦；直接 SELECT 會略過它）。同一輪也修正了一個自行造成的缺口：Minimal 自己的「Profile this hook」會寫入 `profile_type=on_demand`，但分頁固定在 pinned/session/background，因此 Minimal 的擷取內容只能在 All profiles 下找到。新增 On demand 分頁，以及來自 `route_class` 的 Context 欄位。保留欄位讀取以支援 1.5 之前的版本。套件 scrutoscope 29→34。 |
| 2026-08-06 | 出貨排名 1：FluentSMTP 2.3.0 追趕（全部三個切片） | Resend 現在使用其 `Logger::resendEmailFromLog($id,'resend',$recipients)`——`resent_count` + `extra['resends']` trail record，還原 headers/attachments，redirects 上捨棄 cc/bcc，不產生重複日誌列（`FLUENTMAIL_LOG_OFF`）；以 `resent_count` 欄位為閘門，因此 2.3.0 之前的版本會保留 `wp_mail` fallback，且絕不會在更新失敗時部分傳送。新增參數化「Resend to…」操作（逗號分隔的覆寫值，全有或全無驗證；僅限詳細資料 modal——列表列依設計呈現無欄位操作）。詳細資料 sections 新增 Resends trail（透過其 `Logger::find`；其 unserialize 會拒絕 objects）。ConnectionHealth（2.3.0）提供狀態卡列（All passing / N failing / Not checked yet）及 System health row（`minimal_admin_fluent_smtp_checks()`：全部失敗 = fail，部分失敗 = warn，插入 AIOS 後方）。Caps 透過 `fluent_mail/manage_capability` 解析（存在時使用其 helper）。測試套件：mail-log 30→36、fsmtp-settings 8 通過。E2E：真實 Mailpit 傳送、覆寫 + 400 路徑、針對即時 connection 執行其 checkAll()。 |
| 2026-08-06 | Residual-suite 通過（掃描收尾） | 更新波次中剩餘的 active-fixture adapters 已通過測試套件驗證：seo-mappers 11（**確認 AIOSEO 4.9.10→5.0.0.1 MAJOR 相容**——測試套件使用 AIOSEO 自有 model 驅動面板；Yoast 28.2 + SEOPress 10.1 也涵蓋）、media-folders 20（FileBird 6.5.7）、tec-panel 8（TEC 6.17.2）、cache-purge 11（Breeze 2.5.12）、activity-log-status 20（Simple History 5.30）、meta-box-panel 19（Meta Box 5.14）。全部通過，不需修正。掃描週期完全結束：待辦為空，fixture 欠款已清除。記錄中的未排名未來候選者：Really Simple SSL 9.7 posture provider（plugin-support waves）、GoSMTP 維持已說明的跳過項目（免費版本不儲存日誌）。 |
| 2026-08-06 | WPForms Pro entries 適配器（首批第 1 個，第四個切片——最後一個大型表單名稱） | adapters/wpforms.php：完整的表單系列處理。讀取 = 限定前綴的 SELECT（對 fields JSON 中的欄位使用 LIKE 搜尋）；寫入透過其 `wpforms()->obj('entry')` 處理常式（更新/刪除——hooks 會觸發，刪除會清理 entry_fields + entry_meta，已驗證剩餘列數=0）。權限交由 `wpforms_current_user_can()`（view_entries/edit_entries/delete_entries）；編輯者 = 403 + 隱藏介面，已實測確認。艱難取得的結果：`date` 欄位是 UTC（10:22 EDT 儲存為 14:22）→ 輸出 ISO Z + 欄位 utc:true；顯示狀態由 spam/trash-win-else-viewed 推導；開啟詳細資料會透過其更新操作標記為已查看（其畫面的行為；spam/trash 永不執行）；刻意不使用其 `get_entries()` 搜尋機制（進階搜尋複雜度；LIKE 符合其 fallback）。星號/取消星號是以時機為條件、作用於「★」項目鍵的操作。只有在項目處理常式存在時才註冊（Lite = 無任何內容）。測試套件陷阱：execSync + `wp eval` 搭配 JSON.stringify 後的參數，會讓 shell 將 `$wpdb`/`$f` 展開為空值——套件的 wp() helper 會寫入暫存檔 + `eval-file`；而表單系列的詳細資料 modal 是聯絡人卡片（renderEntryDetail——沒有「Answers」標題；應斷言卡片內容）。套件：wpforms 16、forms-status 14。 |
| 2026-08-06 | Forms 系列狀態卡（Axis A 對等批次，出貨排名 1 第三個切片） | 五張符合 SureForms 形狀的卡片：**fluent-forms**（從 fluentform_submissions 取得未讀 + 總數/垃圾郵件提示、表單數量）、**ninja-forms**（即時 nf-sub publish 計數 + 垃圾桶提示——不是 nf3_forms.subs，該資料會在刪除後保留；不存在讀取狀態，因此標題為 Submissions）、**forminator**（反映 entries list 精確範圍的 received/spam 計數：entry_type custom-forms，草稿/放棄項目仍留在其畫面）、**cf7-flamingo**（其 CPT 上的核心 wp_count_posts——publish/flamingo-spam/trash，不查詢任何 model）、**everest-forms**（未讀 = publish 減去 viewed=1、垃圾郵件提示——因系列一致性而在排名前四之外加入）。每張卡都連結至外掛真正的 entries 畫面（外掛來源已驗證 slugs：fluent_forms_all_entries / nf-submissions / forminator-entries / flamingo_inbound / evf-entries）。測試套件 forms-status（12）；回歸測試 fluent-forms 24 / ninja 13 / forminator 12 / cf7-flamingo 19 / everest 16 全部通過。Integrations validator 通過。 |
| 2026-08-06 | WC 11.0 深度通過（出貨排名 1，第二個切片） | 針對 WooCommerce 11.0.0 依序執行全部 10 個 ecommerce 測試套件：153/153 通過，零個主控台錯誤，WC Subscriptions 9.0.1 相容。11.0.0 區段的變更日誌稽核：移除的是產品區塊編輯器功能/路由（Gutenberg-side；Minimal 從未使用），以及數個移至 Site Health 的 WC 管理通知（其 nag 減少；無需接入）。沒有 wc/v3 或 Analytics API surface 變更。**無程式碼變更**——營運待辦項目以驗證完成結案。 |
| 2026-08-06 | Elementor Pro 4.2.1 檢視（Austin 已取得授權並在掃描期間更新） | 4.2.x 差異是新的 **Atomic Form** widget（Atomic Editor）。已從來源驗證：其 `Collect_Submissions_Action` 透過與傳統 form widget 相同的 `Modules\Forms\Submissions\Database\Query` + `Form_Snapshot_Repository` 寫入，因此 Atomic Form submissions 會進入 elementor-forms adapter 已列出的儲存區。**不需要 adapter 變更。** 4.2.1 本身：沒有 forms/submissions 差異。WC Subscriptions 仍受授權限制，停留在 9.0.1。 |
| 2026-08-06 | Adapter 掃描（僅報告）：update-all + 上游快速檢視 | **外掛：** minimaladmin 上 36/38 已更新。兩個失敗皆受授權限制：elementor-pro（仍為 4.1.2，目前目標為 4.2.1）+ woocommerce-subscriptions 9.0.1。**WooCommerce 10.9.4→11.0.0（主版本）順利完成**——wc/v3 orders/products smoke 200；下一次發布截點前執行 ecommerce 測試套件。Axis B 快速檢視：**FluentSMTP 2.3.0 是發現項目**（三個切片，見待辦）：其新增 `Logger::resendEmailFromLog()` 記錄 `resent_count` + `extra['resends']` trail，而 Minimal 的 bare-`wp_mail` resend 會繞過它；新的 `ConnectionHealth` service（`getReport()`/`getFailing()`、由 option 支援）可直接作為狀態卡/System row；新的 `fluent_mail/manage_capability` filter 取代 adapter 中三個硬編碼的 `manage_options`。非事件：CFDB7 1.4.0（僅設定頁，blob 格式未變——surface 200）、GenerateBlocks 2.4（dynamic-tag 強化；designs route 200、37 個 patterns）、Meta Box 5.14（Block Bindings = Gutenberg-side）、Forminator 1.56.x（安全修正）、Disable Comments 2.8（Abilities API；Minimal 直接讀取 options）、Simple History 5.30（未啟用 fixture，使用其 REST）。Smoke：10/10 路由 200（wc/v3、fluent-smtp ×3、cfdb7、gb + kadence designs、overview、plugin-updates）。**不發布。** |
| 2026-08-10 | 发布前检查（切出 v0.27.0） | **插件：** 1/3 已更新——fluentform 6.2.11→6.2.12；perfmatters 2.6.7 + searchwp 4.6.1 均受许可证限制（符合预期）。对 fluentform 6.2.12 进行 Axis B 快速检查：条目列表新增 **Spam status filter**（待办：在 fluent-forms 适配器的条目视图中镜像为选项卡）；可选 MCP 服务器默认关闭（无适配器界面）；输出转义/授权加固与 v0.26 安全检查一致。没有存储或 API 迁移。冒烟测试：更新后 fluent-forms 条目/表单/状态均返回 200。**不发布。** |

### 排名待辦事項（2026-08-06 掃描）

| 排名 | 適配器 | 軸 | 缺口 | 工作量 | 為何現在 |
|---|---|---|---|---|---|
| ~~1~~ | ~~**fluent-smtp**~~ | ~~B~~ | ~~透過其 `Logger::resendEmailFromLog()` 重新傳送 + resend-history 詳細資料 +「Resend to…」覆寫~~ | ~~S–M~~ | **已於 2026-08-06 發布**（mail-log 36） |
| ~~2~~ | ~~**fluent-smtp**~~ | ~~B~~ | ~~ConnectionHealth 狀態卡 + System 列~~ | ~~S~~ | **已於 2026-08-06 發布** |
| ~~3~~ | ~~**fluent-smtp**~~ | ~~B~~ | ~~遵循 `fluent_mail/manage_capability`~~ | ~~S~~ | **已於 2026-08-06 發布** |
| ~~1~~ | ~~**ecommerce suite 重新對照 WC 11.0 執行**~~ | ~~ops~~ | ~~重大版本深入檢查~~ | ~~S~~ | **已於 2026-08-06 驗證**：全部 10 個 WC 套件通過（orders、order-page、order-payment、order-refunds、products、coupons、customers、ecommerce-create、ecommerce-depth、wcs-subscriptions = 153/153），對照 WC 11.0.0，並使用 WC Subscriptions 9.0.1；11.0 變更日誌的移除項目是產品區塊編輯器 + 移至 Site Health 的管理通知，不涉及 wc/v3。沒有程式碼變更 |
| ~~1~~ | ~~表單狀態卡（fluent / ninja / forminator / flamingo）~~ | ~~A~~ | ~~與 SureForms 的狀態卡一致性~~ | ~~每個 S~~ | **已於 2026-08-06 發布**（加上 everest-forms 作為第五個；suite forms-status 12） |
| ~~1~~ | ~~WPForms Pro entries~~ | ~~B~~ | ~~表單系列~~ | ~~M–L~~ | **已於 2026-08-06 發布**（adapters/wpforms.php；suite wpforms 16；forms-status 14）。Fixture 歷史：**已解除阻塞 + fixture 已於 2026-08-06 就緒。** Austin 提供 WPForms Pro 2.0.0.2 zip（開發用途；GPL）。安裝前已完成來源驗證：823 個共用 PHP 檔案與 wp.org Lite 2.0.0.2 逐位元組相同，唯一差異是外掛標頭行；vendor 外沒有 eval/base64/異常主機模式；沒有破解浮水印；授權程式碼完整；唯一建置日期為 2026-07-22。在 minimaladmin 上啟用；啟用時建立全部 13 個資料表；已驗證 entries 可透過其自身的 `wpforms()->obj('entry')->add()` 在未授權狀態下儲存（授權限制更新/附加元件，不限制儲存）。固定 fixture：表單 5363 "Minimal Contact Form"（姓名/電子郵件/textarea）+ 2 筆 entries（Dana/Miguel）。儲存：wpforms CPT（表單 JSON 位於 post_content）、{prefix}wpforms_entries（status/viewed/starred + fields JSON）+ wpforms_entry_fields 每個答案一列 |
| — | ~~woocommerce-subscriptions update~~ | ~~ops~~ | ~~於 9.0.1 受授權限制~~ | — | **已於 2026-08-06 解決**：Austin 提供 9.1.0 zip；已完成來源掃描（模式乾淨、無破解標記、474 個檔案與已安裝的 9.0.1 相同、45 個檔案的次版本差異一致、變更記錄日期為 2026-08-05），手動更新，wcs-subscriptions 18/18 通過（其「強化的 REST 權限檢查」不影響 Minimal 的 admin cookie+nonce 路徑）。Elementor Pro 也在當天稍早解決（已授權，4.2.1）。所有 fixture 更新債務現已清除 |

排名 1–3（FluentSMTP 2.3.0 追趕工作）已於 2026-08-06 作為單一單元發布。

### 排名待辦事項（2026-07-27，v0.22.0 掃描）

| 排名 | 適配器 | 軸 | 缺口 | 工作量 | 為何現在 |
|---|---|---|---|---|---|
| ~~1~~ | ~~**scrutoscope**~~ | ~~B~~ | ~~Cron 檢視：「Profile this hook」~~ | ~~S~~ | **已於 2026-07-27 發布**（套件 scrutoscope；僅限 Scrutoscope 1.4+） |
| ~~2~~ | ~~**disembark**~~ | ~~B~~ | ~~狀態卡深層連結「還原備份 ↗」~~ | ~~S~~ | **已於 2026-07-27 發布**（suite disembark；僅限 Disembark 2.8+） |
| ~~3~~ | ~~**all-in-one-security**~~ | ~~B~~ | ~~登入失敗 / 永久封鎖狀態~~ | ~~S–M~~ | **已於 2026-07-27 發布**（狀態卡 + System health 列；suite aios-log） |
| 1 | **表單狀態卡**（fluent／ninja／forminator／flamingo） | A | 與 SureForms 的狀態卡相等性 | 各 S | 可選的精修；GF 刻意跳過圖表／狀態；只有 dogfooding 想快速查看收件匣數量時才發布 |
| 2 | **WPForms Pro entries** | B | 表單家族 | M–L | 仍需要 Pro 授權與 fixtures；最大的未涵蓋表單名稱 |
| — | elementor-pro update | ops | 授權封鎖 4.2.0 | — | Free Elementor 為 4.2.0；Pro 在取得授權更新前停留於 4.1.2；forms adapter 仍為 200 |

2026-07-17 的已取代開放項目（上方刪除線）仍已發布。本次未發現矩陣儲存格有 Axis A 漂移。

### 排名待辦事項（2026-07-17，v0.18.0 開放）

| 排名 | 適配器 | 軸 | 缺口 | 工作量 | 為何現在 |
|---|---|---|---|---|---|
| ~~1~~ | ~~sectionsRoute 列類型（`pill`、`code`、`html-preview` 已沙盒化、`kv-table`）~~ | ~~A~~ | ~~共用詳細資料原語~~ | ~~M~~ | **已於 2026-07-17 發布**（suite detail-rows，19；GSMTP log detail 是第一個使用者） |
| ~~2~~ | ~~redirection~~ | ~~A~~ | ~~`status` 卡~~ | ~~S~~ | **已於 2026-07-17 發布**（列 + dual redirects/404s chart；suite redirection-status，10） |
| ~~3~~ | ~~code-snippets~~ | ~~A~~ | ~~`status` 卡~~ | ~~S~~ | **已於 2026-07-17 發布**（啟用/停用/丟棄、執行範圍、最後變更、安全模式列；suite code-snippets 26）。更正：07-17 報告的「所有同系列都有一個」是對 status 一詞的 grep 過度匹配；Redirection 與 Code Snippets 是其系列中的 FIRST cards。Sibling cards（wpcode、fluent-snippets、custom-css-js、hfcm、SRM、S301、EPS）現在是合理的 S-effort 後續工作 |
| ~~4~~ | ~~All-In-One Security (AIOS)~~ | ~~B~~ | ~~活動記錄 + 狀態~~ | ~~M~~ | **已於 2026-07-17 發布**（稽核資訊流 + level tabs + 狀態卡；suite `aios-log`；登入失敗/永久封鎖狀態列仍是未來新增項目） |
| ~~5~~ | ~~GoSMTP / SureMails / Site Mailer~~ | ~~B~~ | ~~新郵件記錄提供者~~ | ~~M~~ | **已於 2026-07-17 解決**：SureMails + Site Mailer 已發布（完整郵件系列處理；suite `wave-b-mail`）；GoSMTP 為已記錄的跳過項目（免費版本不儲存記錄） |
| ~~6~~ | ~~Enable Media Replace + 核心媒體最佳化~~ | ~~B~~ | ~~Wave D 開端（未附加/日期篩選器、「附加至」、原位取代）~~ | ~~M~~ | **已於 2026-07-17 分兩部分發布**：EMR ⇅ Replace file（suite media-replace 12）+ 核心媒體最佳化（Unattached/月篩選器、Attached to；suite media-polish 15） |
| 7 | WPForms Pro entries | B | 表單系列 | M–L | 需要 Pro 授權以建立 fixtures；最大的未涵蓋表單名稱 |
| ~~8~~ | ~~媒體資料夾提供者合約（FileBird 優先）~~ | ~~B~~ | ~~Wave D，以瀏覽為優先~~ | ~~L~~ | **已於 2026-07-17 完整發布**（minimal_admin_media_folders + FileBird、RML Lite 和 Premio Folders 提供者 + Move to folder 批次動作；suite media-folders 20） |
| ~~9~~ | ~~fluent-smtp~~ | ~~B~~ | ~~設定對應器（連線）~~ | ~~M–L~~ | **已於 2026-07-17 解決**：misc settings 已接線（連線路由、記錄、保留、模擬；suite fsmtp-settings 8）；每個提供者的連線精靈是 canvas 部分，並維持為深層連結 |
| ~~10~~ | ~~GF 附加元件/Feed 設定~~ | ~~B~~ | ~~來自 full-ui-adapters 的 Schema 匯出倍增器~~ | ~~L~~ | **已於 2026-07-17 解決**：Feeds VIEW 已發布（清單/切換/刪除/深層連結；套件 gf-feeds 10）；設定對映器延後，並已有書面結論（full-ui-adapters.md） |

### 排名待辦事項（2026-07-15 Axis A 階段，已取代）

| 排名 | 適配器 | 軸 | 缺口 | 工作量 | 為何現在 |
|---|---|---|---|---|---|
| ~~1~~ | ~~**gravity-smtp**~~ | ~~A~~ | ~~批次記錄刪除~~ | ~~S~~ | **已於 2026-07-15 發布** |
| ~~1~~ | ~~**simple-history / wsal / stream / aryo**~~ | ~~A~~ | ~~**狀態**卡~~ | ~~S–M~~ | **已於 2026-07-15 發布** |
| 1 | sectionsRoute 列類型（`pill`、`code`、`html-preview`、`kv-table`） | A | 電子郵件記錄詳細資料完整性 | M | 共用原語；有益於 GSMTP／Fluent／Post 詳細資料 |
| 3 | All-In-One Security (AIOS) | B | 活動記錄 + 安全態勢（LLA-R/Solid 模式） | M | Wave B 遺留項目；在 minimaladmin 上**尚未安裝**——請先安裝 |
| 4 | GoSMTP / SureMails / Site Mailer | B | 新郵件記錄供應商 | M | **尚未安裝**；請先驗證免費記錄儲存功能 |
| 5 | WPForms Pro entries | B | 表單系列 | M–L | 需要 Pro 授權 + fixtures；缺少的最大表單名稱 |
| 6 | fluent-smtp | B | 設定對映器（連線） | M | GSMTP 有設定；Fluent 連線 UI 類似畫布 → 可能為 **L** |

**本次掃描的矩陣修正：** gravity-smtp bulk → **Y**；cf7-flamingo／cfdb7／ninja-forms bulk → **Y**（程式碼原本已有 bulk；儲存格內容過時）。

**刻意不涵蓋的目標：** GSMTP 路由樹編寫；GF 表單建構器／通知事件；備份還原；沒有 Pro 的 WP Mail SMTP Pro 記錄；forminator「狀態卡」（收件匣外掛不需要 GSMTP 風格的圖表）；電子商務（已於 v0.14 發布）；重新提出 forminator/formidable 分頁（已接線）。

**Fixtures 快照（minimaladmin）：** 郵件常駐外掛 FluentSMTP + WP Mail Logging + Gravity SMTP 啟用，Post SMTP + WP Mail SMTP 停用；表單套件啟用（grep 未列出 GF，但通常存在，另有 Fluent Forms、Ninja、Forminator、Formidable、Everest、Flamingo、CFDB7、Elementor Pro）；活動記錄 WSAL + LLA-R + **Solid 啟用**；重新導向 Redirection 啟用，SRM/S301/EPS 停用；備份 Updraft/WPvivid/Duplicator/Disembark/BackWPup 啟用。

當掃描更新儲存格或發布工作時，附加一列，並在其上設定 `Reviewed`
已觸及的 Adapter（或在 Adapter 標頭中標記 `// last-sweep: YYYY-MM-DD`）。
列為公開資訊：記錄與 Adapter 相關的事實（版本、差異、判定）
並將開發環境細節排除在外。
