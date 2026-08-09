# Minimal Admin 的外掛支援

Minimal 可在任何 WordPress 網站上運作；經典 wp-admin 始終只需按一下
對 Minimal 未呈現的任何內容保持距離。在此基準上，Minimal 提供
**介接器**，將特定外掛原生帶入 Minimal UI。每個
介面卡是精簡且以讀取為主的轉接層：它會透過以下方式存取外掛資料
外掛自身的 API 或限定前綴的查詢，絕不會在其中執行外部 PHP
Minimal 的 UI，且絕不對第三方資料 blob 進行反序列化。外掛作者可以新增
透過文件所述的 filters 實現自己的涵蓋範圍（請參閱 `for-plugin-authors.md`）
不需要 Minimal 發布程式碼。

本頁是目前涵蓋內容的地圖。「介面」= 導覽項目；
「面板」＝編輯器側邊欄中的卡片；「提供者」＝供應現有
共用檢視；「action」= 一個 ⌘K／選單指令。

## 概覽

| 區域 | 外掛 | 顯示方式 |
|---|---|---|
| **SEO** | Yoast、Rank Math、AIOSEO、SEOPress、SiteSEO | 編輯器面板（標題、meta description、focus keyword） |
| **活動** | The Events Calendar | 活動是 REST CPT，因此 Content 清單和 Minimal 編輯器已支援；**活動詳細資料**編輯器面板涵蓋開始／結束時間、全天、場地和主辦人（透過 TEC 自身記錄進行非同步搜尋選擇器）、費用和網站，所有內容都透過 TEC 自身的 saveEventMeta 寫入（持續時間、UTC 鏡像和關聯文章的管理仍由 TEC 負責）。多位主辦人、週期性活動、票券、時區及建立場地／主辦人仍在 TEC 中處理 |
| **工作** | WP Job Manager | 清單是 REST CPT，因此 Content 清單和 Minimal 編輯器已支援；**工作清單**編輯器面板新增詳細資料範圍（地點、公司欄位、申請電子郵件或 URL、薪資、遠端／已填補／精選標記、到期日），即時從 WPJM 自身欄位結構描述讀取，所有寫入均由 WPJM 自身的個別欄位清理器處理 |
| **Podcasting** | Seriously Simple Podcasting、PowerPress | SSP：單集是 REST CPT，因此 Content 清單與 Minimal 編輯器已包含這些內容；**Podcast episode** 編輯器面板會新增完整的單集詳細設定（檔案 URL、音訊／影片類型、時長、檔案大小、錄製日期、明確內容與封鎖標記、iTunes 欄位），即時從 SSP 自身的結構描述讀取，並依其自身慣例儲存（封面圖片與 Castos 託管同步仍由 SSP 管理）。PowerPress：預設頻道的普通文章也會使用相同面板（媒體 URL、大小、時長、副標題、Apple 單集欄位），以差異為基礎重建其 enclosure blob，確保託管、章節與美術圖鍵值原封不動；自訂頻道、美術圖、明確內容與章節仍保留在其 metabox 中 |
| **表單** | Gravity Forms、WPForms、Fluent Forms、Elementor Pro、Contact Form 7（透過 Flamingo）、CFDB7、Ninja Forms、Forminator、Formidable、Everest Forms、SureForms | **表單**介面 — 以聯絡人卡片顯示項目。具備狀態工作流程的提供者（Everest、Fluent、Ninja、Flamingo、Elementor Pro）共用已接收／垃圾郵件或未讀／垃圾桶篩選器，並支援還原和批次操作；CFDB7 提供全部／未讀／已讀篩選器。Fluent Forms、Ninja Forms、Forminator、Flamingo、Everest Forms、SureForms 和 WPForms 開啟時會顯示狀態卡（未讀或已接收數量、追蹤中的垃圾郵件和垃圾桶數量、表單數量、前往外掛項目畫面的連結）。WPForms（項目存放於 Pro）提供完整功能：每個表單的分頁、未讀／已讀／已加星號／垃圾郵件／垃圾桶篩選器、星號和已讀狀態、具備還原功能的垃圾郵件和垃圾桶流程、透過 WPForms 自身處理常式永久刪除，以及開啟時自動標記為已檢視的項目，全部受 WPForms 自身存取權限保護。Gravity Forms 透過自身端點新增完整項目工作流程：已接收／垃圾郵件／垃圾桶狀態檢視、加星號／取消星號及標記為已讀（開啟時會像 GF 自身畫面一樣標記為已讀）、適用時的還原和永久刪除、批次操作、卡片上的項目備註及新增備註，以及重新寄送通知。**通知**檢視（透過 GF 自身解析器，需具備 edit-forms 權限）會列出所有表單中的每則通知，並顯示具類型感知的收件者（地址／欄位標籤／路由規則數量），透過 GF 自身切換功能啟用／停用，並透過 GF 自身通知儲存區編輯每日欄位（名稱、寄送至、主旨、訊息）；路由規則、條件邏輯和事件仍在 GF 編輯器中，僅需一個深層連結即可前往。每個表單的列都會開啟 **表單設定**：完整表單設定範圍（基本設定、版面配置、儲存並繼續、限制、垃圾郵件偵測、選項）會在請求時從 GF 自身 Settings-framework 結構描述取得，並透過 `GFAPI::update_form` 以 GF 自身驗證語意儲存；排程日期時間仍由 GF 處理，並如實列為已鎖定。**Feeds**檢視（註冊 feed 外掛時顯示）會列出所有表單中的外掛整合，並透過 GF 自身模型啟用、停用和刪除；feed 設定會深層連結至外掛畫面。SureForms 項目使用其簡潔的 JSON 表格，提供每個表單的分頁、已讀／未讀／垃圾桶狀態操作、搜尋、刪除和狀態卡 |
| **電子郵件** | Gravity SMTP、FluentSMTP、WP Mail SMTP、Post SMTP、WP Mail Logging、SureMails、Site Mailer | **電子郵件**介面（功能擴充設定後，從 Email Log 重新命名）— 已寄出郵件、重新寄送、單筆／批次刪除記錄。FluentSMTP、Post SMTP 和 WP Mail Logging 都有狀態卡（14 天圖表）；FluentSMTP 另透過其 Logger 提供測試寄送、主旨／寄件者／收件者搜尋、單筆／批次刪除記錄，並在 2.3+ 透過自身的重新寄送流程重新寄送（保留原始標頭和附件、每筆記錄的重新寄送歷史，以及 **重新寄送至…** 收件者覆寫），在狀態卡及 System health 列中提供每日連線健康判定，透過其 `fluent_mail/manage_capability` 篩選器提供權限，並提供 **設定**檢視（預設和備援連線、記錄、保留期限、透過自身 Settings 模型進行電子郵件模擬；連線精靈仍由 FluentSMTP 提供）；Post SMTP 提供搜尋及單筆／批次刪除；WPML 可批次刪除記錄列。Gravity SMTP 的功能更深入：**設定**檢視會將其自身設定結構映射至 Minimal（全部 21 個連接器中的寄送服務、含遮罩密鑰的連接器設定、透過具備常數鎖定感知的儲存區處理一般／記錄設定），此介面遵循其細分的 `gravitysmtp_*` 權限（包括透過其自身 `Event_Model` 進行記錄刪除的 `DELETE_EMAIL_LOG`），事件詳細資料透過其自身模型讀取（寄件者／副本／密件副本／來源），重新寄送會透過已設定的連接器重播其自身的收件者處理流程，**抑制項目**檢視透過其自身模型列出／新增／重新啟用遭封鎖的地址，提供 **偵錯記錄**檢視、2.3+ 條件式寄送規則的 **路由**檢視（啟用／停用／刪除；條件編寫仍在 Gravity SMTP 中進行）、顯示部分寄送事件的 **已篩選**記錄分頁，以及包含啟用中的服務、測試模式、路由數量、14 天圖表和 **寄送測試電子郵件**的狀態卡。SureMails 和 Site Mailer 會針對其免費記錄表提供完整記錄功能（分頁、搜尋、刪除、狀態卡＋圖表、沙盒化 HTML 詳細資料；Site Mailer 是雲端寄件者，因此沒有本機重新寄送） |
| **重新導向** | Redirection、Safe Redirect Manager、Simple 301 Redirects、301 Redirects (WebFactory) | **Redirects** 介面——清單＋就地編輯＋批次刪除；Redirection 的首次安裝會透過設定閘門就地執行，其每日選項（監控、日誌保留、IP 記錄）透過其自己的 `red_set_options` 位於 Settings 檢視中，且狀態卡片會引導此介面（規則、命中數、服務／404 計數，以及根據其日誌資料表產生的 14 日堆疊圖表） |
| **活動記錄** | Simple History、WP Activity Log、Aryo、Stream、**Wordfence**、**Limit Login Attempts Reloaded**、**Solid Security**、**All-In-One Security** | **Activity Log** 介面 — 嚴重性／等級分頁（Simple History、WSAL、AIOS）、連接器分頁（Stream）、動作分頁（Aryo）；每個提供者都有一張 **狀態卡**（稽核記錄：24 小時／7 天／全部時間 + 最後事件與家族專屬混合資訊；Wordfence：24 小時登入 + 防火牆／掃描狀態；Limit Login Attempts 與 Solid Security：目前鎖定數 + 政策／防護，並可透過各外掛自身的儲存區一鍵解除鎖定／釋放）。AIOS 讀取其稽核記錄資料表，將 JSON 詳細資料展平為內容列，並回報 **失敗登入（24 小時）**、**目前已鎖定**及**永久封鎖**（系統健康度列也包含；深度連結至 AIOS 進行管理） |
| **安全性狀態** | Wordfence、Really Simple SSL、Solid Security | System 健康狀態列：Wordfence 防火牆模式（enabled／learning／off）＋上次掃描時間和未解決問題數；Really Simple SSL 強制執行狀態（兩者皆透過各外掛自己的公開 API 讀取）。System 頁面的 **Login URL** 列使用 `wp_login_url()`，因此會遵循登入隱藏外掛（WPS Hide Login 等），而不是假設使用 wp-login.php |
| **程式碼片段** | Code Snippets、WPCode、FluentSnippets、Simple Custom CSS and JS、Header Footer Code Manager | **Snippets** 介面——清單、切換、編輯、建立、批次操作（啟用多個提供者時顯示提供者切換器） |
| **分析** | Koko、WP Statistics、Burst、Independent Analytics、AnalyticsWP、**Matomo**、**Site Kit**、**Jetpack Stats** | 總覽 **流量**圖表（每日訪客／頁面瀏覽量）。點選日期進行深入分析（熱門頁面 + 透過 `minimal_admin_traffic_day` 取得的引薦來源）：**Koko**、**WP Statistics**（每個 URI 僅統計點擊數）、**Burst**（`page_url` + 工作階段引薦來源）、**Independent Analytics**（瀏覽量 × 資源 + 工作階段引薦來源）、**Matomo**（其自身的報告 API — Bootstrap + `doAsSuperUser`，受 `view_matomo` 控制；數字符合其 UI，包括其每小時封存週期）、**Jetpack Stats**（WPCOM_Stats blog-token client，受連線 + stats module + `view_stats` 控制；依 WPCOM 設計，每頁統計僅為瀏覽量） |
| **備份** | UpdraftPlus、Disembark、Duplicator、WPvivid、BackWPup、All-in-One WP Migration | **Backups** 介面；健康檢查 +「立即備份」（UpdraftPlus，否則 WPvivid）；狀態卡、CLI 指令、工作階段 + 清理，以及 Disembark 2.8+ 的 **還原備份**深度連結（Disembark）；套件清單含磁碟大小、狀態卡及透過自身清理功能刪除（Duplicator，不宣稱新鮮度：手動建立）；備份清單 + 狀態卡 + 排程 + 立即備份 + 透過自身清理功能刪除（WPvivid）；本機 FOLDER 封存 + 立即執行工作 + 透過其目的地刪除（BackWPup）；本機 .wpress 匯出清單 + 透過其 Backups 模型刪除，不宣稱新鮮度（All-in-One WP Migration；匯出／匯入仍為深度連結） |
| **快取** | Kinsta、LiteSpeed、WP Super Cache、W3TC、WP Rocket、WP Fastest Cache、SiteGround、Autoptimize、WP-Optimize、Cache Enabler、Hummingbird、Elementor CSS、SpeedyCache、Redis Object Cache、Breeze、Nginx Helper、Cloudflare | **清除網站快取**動作（⌘K）。Redis Object Cache 也會為 drop-in + 連線狀態新增系統健康度列 |
| **自訂欄位** | ACF（+ Pro）、Meta Box、Pods | 編輯器面板（文字、textarea、數字、select、radio、checkbox／switch／boolean）。ACF 需要在欄位群組中啟用「Show in REST API」；Meta Box 值透過 `minimal_meta_box` REST 欄位（`rwmb_set_meta`）；Pods 值透過 `minimal_pods`（擴充文章類型使用 `pods()->save()`）。進階類型（複製、檔案、關聯、多重選取……）會標記為鎖定，並提供 wp-admin 連結 |
| **電子商務** | WooCommerce、**WooCommerce Subscriptions** | **訂單**（完整頁面的訂單檢視，具有自身 URL 和快速檢視 modal；列出、搜尋、狀態、透過 `payment_complete` 手動 **記錄付款**、包含補貨且文案忠實反映 gateway 的單項退款、付款 URL、重新寄送／自訂電子郵件、訂單備註、該客戶的其他訂單、**新增訂單**、總覽中顯示需處理訂單的 **Store strip**、含營收圖表 + 透過 `wc-analytics` 取得熱門產品的 **Analytics** 檢視；WooCommerce 記錄頻道也會透過自身的 log controller 餵入系統記錄檢視器）+ **產品**（列出、搜尋、庫存分頁，包括低庫存、批次、每日欄位、**新增產品**）+ **優惠券**（列出／建立／編輯）+ **客戶**（列出／搜尋、個人資料 + 帳單、近期訂單；WCS 啟用時顯示 **Subscriptions** strip）+ 總覽統計。**訂閱**（WCS 啟用時）：狀態分頁、搜尋、下次付款、期間標籤、透過 `wc/v3/subscriptions` 儲存狀態、父訂單 + 相關訂單、檢視客戶，以及訂單 modal 的反向連結。產品、優惠券與訂閱 CPT 會從 Content 中隔離 |
| **垃圾郵件過濾** | Akismet、Antispam Bee、CleanTalk、WP Armour | Settings → Spam provider 卡片；透過 `minimal_admin_spam_providers` 開啟 |
| **授權** | Elementor Pro、ACF PRO、WP Rocket、Gravity Forms、Gravity SMTP、AnalyticsWP、Bricks、Divi、Beaver Builder、WPBakery、Brizy、Etch、Astra/Brainstorm 系列、WPMU DEV（Dashboard + Smush Pro）、SearchWP、Gravity Perks、Rank Math Pro、Perfmatters、GP Premium、WP All Import/Export Pro、Slider Revolution、LayerSlider、Avada、Envato Market、The Events Calendar 系列（Pro、Event Tickets Plus、Filter Bar、Community，各自為專用提供者）+ 任何其他 StellarWP Uplink 或 PUE 產品的一般支援、Kadence Blocks Pro、Smash Balloon（Instagram／Facebook／YouTube／Twitter／Social Wall／Reviews／TikTok／Feed Analytics Pro，包括 All Plugins 多產品金鑰）、Yoast SEO Premium（MyYoast 入口網站）、Search & Filter Pro、Admin Columns Pro，以及任何 Freemius、EDD Software Licensing 或 SureCart 外掛的一般支援 | Extensions → **授權**分頁（依狀態分組、停用元件收合、操作位於每列選單中；System health 檢查是可點擊的入口）：每個付費元件的有效／已過期／無效／缺少狀態；Elementor Pro、ACF PRO、Gravity Forms、Gravity SMTP、Beaver Builder、Brizy Pro、Etch、Bricks 和 Divi（作用中的佈景主題；Divi 需要使用者名稱＋API 金鑰）、WPMU DEV、SearchWP、Gravity Perks、Perfmatters、GP Premium、WP All Export Pro、LayerSlider、The Events Calendar 的全部四項產品、Kadence Blocks Pro、Search & Filter Pro 和 Admin Columns Pro 支援貼上啟用，並在各供應商程式碼允許時停用及重新驗證；對於受入口網站或管理員情境限制的供應商（WPBakery、Rank Math、Envato、WP All Import、Slider Revolution）提供「啟用 ↗」連結，全部透過各供應商自身程式碼處理；透過 `minimal_admin_license_providers` 開啟 |
| **網站可見性** | Maintenance (WebFactory)、SeedProd、Under Construction、LightStart (WP Maintenance Mode)、CMP Coming Soon & Maintenance、Minimal Coming Soon、Password Protected、WooCommerce coming soon（包括僅商店頁面的部分形態）、Elementor maintenance mode，以及 Minimal 自有的 maintenance mode 和 `blog_public`「discourage search engines」設定 | 網站隱藏、部分隱藏、受密碼保護或未編入索引時，顯示 Overview 橫幅＋持續顯示的琥珀色頂端列標籤（每個路由）＋System 健康檢查；Settings → Visibility 列出作用中的第三方限制器；每個內建提供者都能透過其自己的儲存方式就地關閉（含 Undo）；透過 `minimal_admin_visibility_providers` + `minimal_admin_visibility_toggles` 開啟 |
| **頁面建構器** | Elementor、Beaver Builder、Brizy、Divi、Bricks、WPBakery、Etch | 已偵測並加以隔離，「在 ⟨builder⟩ 中編輯」 |
| **區塊函式庫** | Stackable、Kadence、GenerateBlocks | 編輯器「瀏覽全部」中的設計函式庫；透過 `minimal_admin_design_sources` 開放給任何外掛 |
| **區塊預覽** | Otter、Essential Blocks、Spectra、Kadence、GenerateBlocks、Stackable | island 預覽中的實際前端樣式 |
| **效能** | Perfmatters、Autoptimize、Asset CleanUp、Performance Lab | 一個包含提供者切換器的 **Performance** Tools 項目。**Perfmatters**（僅設定）：透過其即時核心 Settings-API 註冊項目取得完整設定。**Autoptimize**（僅設定）：JS／CSS／HTML／CDN／Misc 切換項目會寫入其自身的 `on`／空值選項（Critical CSS、Extra 與 Image 仍維持深層連結；Clear site cache 仍會清除其快取）。**Asset CleanUp**（僅設定）：透過其 JSON 設定選項提供全域最小化／合併／清理／字型／測試模式切換項目；頁面層級的 CSS／JS 卸載管理器仍保留在 Asset CleanUp 中。**Performance Lab**：列出 WordPress Performance Team 的獨立功能（透過其自身的安裝輔助程式啟用，透過核心停用）；Server Timing 與各功能設定仍維持深層連結 |
| **開發者工具** | Query Monitor；**Diagnostics** 家族（Scrutoscope、WP Crontrol、Transients Manager、Rewrite Rules Inspector） | Minimal 頁面上的 QM 面板（本次請求）。一個 **Diagnostics** 工具項目，含提供者切換器：**Scrutoscope**（效能剖析 + Cron inventory；1.4+ 的 **Profile this hook** 會在其剖析器下執行該 hook 並儲存按需剖析結果）、**WP Crontrol**（事件 inventory、立即執行、暫停／恢復、刪除）、**Transients Manager**（列出／搜尋／刪除、清除過期項目，絕不反序列化 blobs）、**Rewrite Rules Inspector**（按來源列出已註冊規則、依路徑搜尋、flush、測試 URL）。擷取設定、PHP／URL cron 建立、深度 transient 編輯，以及完整的 RRI 畫面仍維持深度連結 |
| **使用者** | User Switching、One Time Login | 使用者列選單中的「Switch to this user」（外掛自己的 nonce URL），以及切換工作階段的切回列；「Copy one-time login link」透過 One Time Login 自己的 token 產生器建立一次性 login-as 連結（該 CLI-only 外掛的第一個 UI），並針對目標使用 `edit_user` 控制 |
| **公開預覽** | Public Post Preview | 編輯器 Publish 卡片：**Public preview link** 切換項目 + 複製 URL；內容列中的 **Copy public preview link**（必要時啟用）。可分享的匿名草稿連結使用外掛自身的限時 nonce 與 Reading 到期設定 |
| **媒體** | Regenerate Thumbnails、Force Regenerate Thumbnails、Safe SVG、SVG Support、Enable Media Replace、FileBird、Real Media Library、Folders by Premio | 媒體詳細資料模態視窗中的 ↻ 縮圖按鈕（每張圖片完整重建；當 RT 不存在時，Force Regenerate Thumbnails 會透過其自身的 admin-ajax 處理常式提供相同按鈕）。Safe SVG 或 SVG Support：**SVG** 篩選分頁；詳細資料備註會標示提供者（僅 Safe SVG 宣稱提供清理）；清理仍由外掛負責。Enable Media Replace：詳細資料模態視窗中的 **⇅ Replace file**，透過 EMR 自身的 ReplaceController（名稱相同、URL 相同；強制相同類型；重新命名及移動仍在 EMR 畫面中處理）。資料夾：FileBird、Real Media Library Lite 和 Folders by Premio 都透過 `minimal_admin_media_folders` 提供者合約，將資料夾選擇組合框提供給 Media 檢視（優先瀏覽；整理仍在各外掛的 UI 中進行） |
| **訂單文件** | PDF Invoices & Packing Slips for WooCommerce | 訂單詳細資料模態視窗中，會為每個已啟用的文件提供下載按鈕 |

除了已命名的外掛之外：任何外掛的獨立動態區塊與
已註冊的模式會自動出現在編輯器中（無需介面卡），並且
任何外掛的 **管理員通知** 都會被擷取至 Minimal 的通知
面板。第三方分析、快取、表單及其他外掛都可以註冊
透過 extension filters 自行實現。

## 備註與限制

- **每個家族同時只顯示一個提供者。** Email Log、Redirects、
  Activity Log 和 Snippets 介面將多個外掛整合至一個導覽
  當多個提供者啟用時，顯示帶有提供者切換器的項目。
- **SEO 一次只處理一個外掛**，依安裝基數排序（Yoast → Rank Math
  → AIOSEO → SEOPress）；第一個啟用者優先。SEO *分數* 和內容
  分析留在 wp-admin 中。
- **備份**：還原作業留在 wp-admin（手術，而非日常工作）；Minimal
  列出集合、回報新鮮度，並觸發新的備份。
- **Disembark 是連接器，不是排程器。** 備份會被拉取至站外
  透過其 CLI（或 disembark.host），而網站不會保留某次拉取
  已完成，因此 Minimal 絕不會宣稱其內容是最新的。此介面顯示
  備份設定檔（上次掃描、資料庫大小、磁碟上的工作檔案），交由
  使用確切的 `disembark connect` 指令（⌘K 中也稱為「Copy Disembark
  備份命令」）、列出掃描工作階段，並清理整個網站的
  封存的工作階段可能留在 uploads 中。掃描本身會從
  Disembark 自有的 UI 或 CLI。
- **Contact Form 7 本身不儲存任何資料** — 項目需要儲存外掛。
  Minimal 涵蓋其中兩個熱門選項：Flamingo（透過
  Flamingo 自有處理程式、Manage 檢視中的 CF7 表單）以及 CFDB7（項目
  從其序列化列中剖析，而完全不執行 `unserialize`，
  標記為已讀、永久刪除）。建立表單仍留在 CF7 的編輯器中。
- **Page builders** 將內容儲存在 `post_content` 之外（Elementor、
  Beaver、Brizy、Bricks、WPBakery）在 Minimal 的編輯器中以唯讀方式開啟，並具備
  「在⟨建構器⟩中編輯」按鈕；區塊原生建構器（Etch、Divi 5）保持
  可透過 island 系統編輯。
- **Minimal 刻意不重新實作的內容**：表單建構器、SEO 分數
  UI、防火牆／掃描設定、快取外掛設定頁面、建構器畫布。
  這些是各外掛自己的產品；Minimal 只提供連結。

## 路線圖候選項目

於 2026-08-06 重新整理，目前為 **v0.24.0**。自那之後已發布兩個版本
上次更新：v0.22.0（2026-07-30）帶來了唯讀資料庫
viewer，這是原生的開發者介面，而非 adapter，另加上 Matomo
與 Jetpack Stats 流量提供者；v0.23.0（2026-08-04），這些切換項
版本帶來可見性切換、每個擴充功能的自動更新膠囊、佈景主題
即時預覽與同步模式。涵蓋歷程位於表格
以上；持續維護的原始功能矩陣與掃描記錄位於 `docs/adapter-coverage.md`。

近期已結束的討論串：~~**WPForms Pro 項目**~~ ✅ 已於 2026-08-06 發布
（v0.24.0 週期；最後一個大型未涵蓋表單名稱，取得 Pro zip 後解除阻擋
使測試裝置成為可能），~~表單系列狀態卡片~~ ✅ 已於 2026-08-06 推出
（Fluent、Ninja、Forminator、Flamingo、Everest），~~Jetpack Stats / Matomo
流量提供者~~ ✅ 已於 2026-07-29 發布（v0.22.0 週期；Jetpack 已驗證
並於同一天在已連線的實際網站上完成端到端驗證）。

開放中的介面卡討論串，排名如下：**MetForm**（延後至
依賴 Elementor 的介接器已列入考量），狀態／圖表功能對等性則在
透過 `/dev-minimal-admin sweep` 處理表單以外剩餘的薄型系列子項，
更深入的 Really Simple SSL 9.7 狀態列（其強制執行列已經
已連接），以及授權的長尾工作。
最大的非介面卡執行緒是 v1 閘門 **G1**，外部測試者下午
測試（`docs/v1-readiness.md`）。

完整的未嘗試熱門外掛分類清單已於 2026-08-06 完成：
Wave E（介面與提供者缺口）以及 Wave F（Minimal 完全沒有的類別
完全沒有）如下，此外還有授權供應商系列清單
`docs/license-manager.md`。該輪次的重點包括：Awesome
先處理 Motive Pro 授權系列（WPForms Pro 已是有效的測試項目
沒有授權列，而 WP Mail SMTP Pro 的授權也會解鎖其真正的
電子郵件記錄表），WooCommerce.com 輔助程式的唯讀授權列則排在第二，
先列出 MonsterInsights 流量提供者，接著是 SiteOrigin / Oxygen /
Breakdance 建構器偵測批次。整體數量尚未重新測量
自 2026-07-10 起；針對這些候選項目重新執行 Manager DB inventory
在提交某個 Wave 前。

> **v0.17.0 註記（2026-07-16）：**介接器批次暫停一個週期。
> v0.17.0 的章程是外掛作者週期（開發者體驗與濫用
> 在邁向 v1.0 的阻力）。請參閱 `docs/v1-readiness.md`。這些波次
> 已於 2026-07-17 在 v0.18.0 週期中恢復，該週期完成了 Wave B 與 Wave D。

### Wave A — 開發者工具 ✅ 完成（v0.14.0）

Diagnostics 家族提供 Scrutoscope、WP Crontrol、Transients Manager，以及
將 Rewrite Rules Inspector 整合為一個 Tools 項目（提供者切換器）。**QM 仍是
面板，而不是介面。**第一個原生開發者介面是唯讀
資料庫檢視器，已在 v0.22.0 週期中推出（`/minimal-admin/database`，
已在 `docs/native-editors.md` 中界定）；檔案瀏覽器維持暫緩。

### Wave B — 剩餘提供者（現有系列）

來源驗證於 2026-07-17（已在 minimaladmin 上安裝全部四個）：

1. ~~**電子郵件日誌提供者**——SureMails + Site Mailer~~ **已出貨
   2026-07-17**：兩個郵件家族介接器已針對其免費記錄表
   （{prefix}suremails_email_log 和 site_mail_logs），完整處理
   （清單／分頁／搜尋／刪除／狀態＋圖表／區段詳細資料與
   沙盒化 HTML 預覽）。**GoSMTP 略過**：其 `\GOSMTP\Logger` 是
   僅限 Pro，免費版本不儲存記錄（WP Mail SMTP 免費版
   模式）。Easy WP SMTP 的完整記錄同樣僅限 Pro（免費版具有偵錯
   事件）。注意：兩個 created_at 欄位都採用資料庫工作階段時區
   （受管理主機使用 UTC，Cove 開發環境使用網站本地時間）；共用
   `minimal_admin_db_local_to_utc_iso()` 輔助工具會在執行階段進行標準化。
2. ~~**安全性剩餘項目**——All-In-One Security~~ **已於 2026-07-17 出貨**：
   活動記錄稽核摘要（{base_prefix}aiowps_audit_log；JSON 詳細資料
   已扁平化為 Context 列；層級分頁 + 搜尋 + 狀態卡片；
   依系列慣例以已安裝但未啟用處理）。失敗登入與
   永久封鎖狀態列 **已於 2026-07-27 推出**：失敗登入（24 小時）、
   目前已被鎖定，以及狀態卡片上的永久封鎖；系統健康
   透過 `minimal_admin_aios_checks()` 的列，以及連結至 AIOS 的深層連結
   已鎖定 IP 與永久封鎖分頁。
3. **表單遺留項目** — **SureForms 已於 2026-07-17 SHIPPED**（已驗證：
   {prefix}srfm_entries，form_data 是以欄位標籤為鍵的乾淨 JSON，
   已讀／未讀／垃圾桶狀態、用於分頁的 sureforms_form CPT；完整
   表單系列介面卡）。**MetForm 延後處理**：它會將項目儲存為
   `metform-entry` CPT，搭配各欄位的文章中繼資料，但欄位標籤來自
   從 Elementor 表單小工具剖析（需要 Elementor 啟用且
   widget-tree resolution）— 與 SureForms 的不同工作類別
   扁平 JSON。當 Elementor 相依的介面卡
   已列入考量。

### Wave C — 較大型的範圍規劃項目（獨立週期或半週期）

4. ~~**電子商務分析**~~ ✅ 已於 Orders 中出貨（v0.14.0），作為
   **分析** pill；Customers、New order、Add product、Subscriptions
   也已納入電子商務週期。
5. ~~**WPForms Pro 項目**~~ ✅ **已於 2026-08-06 出貨**（v0.24.0 週期）：
   完整的表單家族處理，透過 `{prefix}wpforms_entries` 並搭配
   每個表單分頁、未讀／已讀／已加星號／垃圾郵件／垃圾桶篩選器、加星號與已讀
   狀態、垃圾郵件與垃圾桶流程，包含還原、永久刪除功能，透過
   WPForms 自有的項目處理程式、open-marks-viewed，以及其
   `wpforms_current_user_can()` 權限模型。Lite 不註冊任何內容
   （項目是 Pro 功能，因此沒有可讀取的商店）。阻礙因素
   始終是 fixtures 而非程式碼：結果證實項目儲存得很好
   未授權，因為授權控制的是更新與 addons，而非儲存空間。
6. ~~**Meta Box** 編輯器面板~~ ✅ 已出貨（v0.15.0）。~~**The Events Calendar**
   編輯器面板~~ ✅ 已於 2026-07-17 推出（v0.18.0：事件詳細資料面板 +
   非同步 `suggest` 欄位 primitive）。~~**Jetpack Stats** / **Matomo**
   流量提供者~~ ✅ 已於 2026-07-29 發布（v0.22.0 週期）。

### Wave D — 媒體管理（研究於 2026-07-16，wp.org 安裝數量有效）

Minimal 的媒體核心已完成支援（標題／描述、批次刪除、
圖片編輯器、已接入 Regenerate Thumbnails + Safe SVG），因此此波次
介面卡加上一個新原始功能，排名如下：

7. ~~**Enable Media Replace**（600k）~~ **已於 2026-07-17 出貨**（v0.18.0）：
   ⇅ 透過 EMR 自己的媒體詳細資料 modal 取代媒體檔案
   ReplaceController，保留 URL、強制相同類型；重新命名並移動
   會停留在 EMR 的畫面上。
8. ~~**核心媒體優化**（無外掛）~~ **已於 2026-07-17 出貨**（v0.18.0）：
   未附加篩選器、月份組合方塊，以及詳細資料模態視窗的「附加至」
   帶有編輯器跳轉的列（請參閱 `docs/core-gaps.md`）。
9. **Media folders 提供者合約，優先瀏覽** — **已於 2026-07-17 SHIPPED**
   （v0.18.0 週期）：`minimal_admin_media_folders` 篩選器會供應資料夾
   媒體工具列中的組合框（資料夾 → attachment-ids shim → `include=`
   在 wp/v2/media 上，最多 500 個最新項目，保留 id 0 = Uncategorized），FileBird
   透過其自身模型整合（遵循每位使用者模式）、Real Media
   透過其 wp_rml_* API 使用 Library Lite，以及透過其
   media_folder 分類、套件 `media-folders`（20）。「Move to folder」
   動作於同日發布：契約上可選的 `move` 可呼叫項目
   會在媒體批次列中提供資料夾選擇器 + Move，並透過每個
   外掛自身的指派機制。原始排名：FileBird 第一（200k，
   自訂 `fbv` 資料表、乾淨的模型類別）；Real Media Library Lite（100k）
   以及 Folders by Premio（90k）加入相同契約，如 SEO 面板的
   提供者。這會修訂 core-gaps 的「資料夾：長尾，略過」：400k+
   合併安裝項目，並擴充現有的 Media 檢視，而不是
   需要新的介面。絕不是 Minimal 擁有的資料夾樹：第五個資料夾
   對 wp-admin 和頁面建構器選擇器不可見的標準，與
   主張（核心負責通用 primitives，外掛負責各自的觀點）。
10. **Parity crumbs** — **已於 2026-07-17 SHIPPED**：SVG Support（1M）加入
    SVG 篩選分頁的安全 SVG 閘門（`svgProvider` 啟動金鑰名稱了
    外掛；詳細資料註記僅聲稱 Safe SVG 會進行清理）；Force
    Regenerate Thumbnails（200k）透過其加入 ↻ Thumbnails 動作
    各自的 admin-ajax 處理常式與 nonce（啟動金鑰 `frt`；兩者皆存在時 RT 優先
    已啟用）。Wave D 已完成，僅剩最佳化工具的一行項目與
    以下刻意略過。

仍刻意略過：最佳化工具（Smush／EWWW／Imagify 1M
其中 Converter for Media 500k、ShortPixel 300k、Optimole 200k）
背景處理器與畫布儀表板（最多一行
「由 X 最佳化」註記）；Media Cleaner（90k）是
值得擁有完整專注介面的破壞性掃描工具；Media
Library Assistant（70k）與重新命名工具（50k 以下）是強力工具
長尾。

### Wave E — 各類別中尚未嘗試的熱門外掛（盤點於 2026-08-06）

針對行銷頁面函式庫分類的逐類檢查，對照
實際存在於磁碟上的 adapters。這些介面家族基本上
完成其分類；這些是剩餘名稱中數量最大的，
依安裝基數與每日操作適配度排名。安裝數為約略值
wp.org 數據，而非整個機群的數量；在
推出。

1. **MonsterInsights（~3M）＋ ExactMetrics（~1M）流量提供者** —
   此清單中任何位置最大的未涵蓋免費外掛。兩者都會代理
   Site Kit 等 GA 報告，因此可納入現有的
   `minimal_admin_traffic` 提供者層級（Site Kit 先例：其自有
   回報機制、其驗證，以及一個簡短的 Minimal 端暫存資料）。
2. **SiteOrigin Page Builder（~1M）偵測** — meta 儲存
   （`panels_data`），這就是建構器
   存在隔離機制。**Oxygen** 與 **Breakdance**（兩者皆使用中繼資料儲存）
   加入相同的偵測流程；Breakdance 隸屬 Soflyy，已是已知
   授權工作中的供應商。
3. **安全性狀態提供者** — SiteGround Security（~1M）、Loginizer
   （~1M；採用 LLA-R 形狀的鎖定記錄），WPS Hide Login（~1M；一個
   狀態列、登入 URL）、Sucuri（約 800k；其稽核記錄中的
   活動記錄系列）、Jetpack Protect。
4. **SEO 面板提供者** — The SEO Framework（~100k）和 Slim SEO
   （~100k）。提供者合約已成熟；S 各自處理。
5. **Easy Digital Downloads** — 目前唯一另一個真正的商店平台
   Awesome Motive 擁有（與 AM 授權家族配對於
   `docs/license-manager.md`）。訂單與客戶採用 Woo 模式。
6. **Redirects 家族加入者** — Rank Math 的內建重新導向
   模組與 Yoast Premium 的重新導向管理員；兩者都會加入現有
   系列，而不是新增外掛。
7. **垃圾郵件卡片** — hCaptcha 和 Simple Cloudflare Turnstile。
8. **Broken Link Checker（~600k）** — 真實資料表，收件匣形狀的日常作業；
   將建立內容健康度類別。
9. **WS Form** — 真實項目儲存，表單家族。

刻意跳過的項目仍維持跳過（最佳化工具、電子郵件行銷、彈出視窗、
遷移工具、遠端管理代理程式；請參閱本
檔案）。MetForm 依 Wave B 中的文件說明維持延後處理。

### Wave F — Minimal 完全沒有的類別（盤點於 2026-08-06）

依 Wave C 模式進行週期範圍內的明確規劃，而非全面掃描項目。依照系列
在開始任何一項之前。

1. **LMS** — LearnDash（付費，StellarWP）、Tutor LMS（~100k）、LifterLMS。
   註冊與測驗嘗試都符合收件匣形狀，正是工作區
   主張。
2. **預約** — Amelia、Bookly、FluentBooking、Simply Schedule
   Appointments。預約是最符合收件匣形狀的資料。
3. **會員／社群** — Ultimate Member（~200k）、Paid Memberships
   Pro、MemberPress、BuddyPress。成員清單擴充 Users 介面
   自然地。

### 授權系列（請參閱 `docs/license-manager.md`）

~~Smash Balloon~~ 和 ~~Yoast SEO Premium~~ 已於 2026-07-15 出貨；
~~Search & Filter Pro~~ 和 ~~Admin Columns Pro~~ 已於 2026-07-19 出貨
（v0.20.0，使用實際金鑰的完整啟用迴圈）。剩餘依整體佈署排名
目前未完成的工作是長尾 Freemius/EDD 驗證清單，此外還有
供應商家族 inventory 已於 2026-08-06 新增（Awesome Motive 家族，
WooCommerce.com 輔助工具、SolidWP、TEC 以外的 StellarWP、WPManageNinja、
Delicious Brains、Crocoblock、OTGS、Elementor 外掛套件，以及各種
並結束）；請參閱 `docs/license-manager.md` 中的「供應商系列盤點」。

### Axis A 遺留項目（介接器深度，而非新外掛）

來自 `docs/adapter-coverage.md` 與 `docs/full-ui-adapters.md`（2026-07-15）：

- ~~Gravity SMTP 批次刪除日誌~~ ✅ 已出貨（郵件參照與
  FluentSMTP／Post SMTP／WPML）。
- ~~活動日誌狀態卡片~~ ✅ 已出貨（Simple History、WSAL、Stream，
  Aryo；Solid／LLA-R／Wordfence 已經具備這些）。
- ~~更豐富的 `sectionsRoute` 列類型~~ ✅ 已於 2026-07-17 出貨（v0.18.0：
  `pill`、`code`、沙盒化的 `html-preview`、`kv-table`；整個郵件
  系列的記錄詳細資料已完成轉換）。
- ~~表單系列狀態卡片~~ ✅ 已於 2026-08-06 出貨（Fluent Forms、Ninja
  Forms、Forminator、Flamingo 與 Everest Forms 都符合 SureForms
  形狀；每個數字都來自外掛自身的儲存資料）。Gravity Forms
  刻意略過此卡片：其深度位於項目工作流程中。
- 表單系列以外其餘精簡介面卡的狀態／圖表對等性
  系列，當排程執行系列掃描時（`/dev-minimal-admin sweep`）。

列為結構性暫緩：**多語言**（WPML／Polylang／TranslatePress）
需要內容清單中的語言維度。也已暫緩，範圍與
`docs/native-editors.md` 中劃定的界線：**在乾淨的原生編輯器上
文件**（Gravity Forms 的「80% 表單編輯器」；前置管線
已在 v0.13.0 中推出；先以實際使用驗證表單管理深度，再作出承諾）。

明確跳過（連結出去或不處理才是誠實答案）：圖片最佳化工具
（Smush、EWWW、Imagify、ShortPixel：背景處理器）、同意／GDPR
橫幅、彈出視窗／滑動視窗／opt-in（畫布與 SaaS 儀表板；彈出視窗是 CPT
因此無論如何都會列出）、電子郵件行銷平台（MailPoet、MC4WP）、一次性
遷移工具（匯入器、Better Search Replace）、遠端管理代理程式
（ManageWP、MainWP）、檔案管理器、Elementor 外掛套件（已透過
Elementor adapter）、重複文章外掛（Minimal 原生的 Duplicate
取代它們）、Classic Editor/Widgets（Minimal 的傳統模式已經
處理儲存現況），以及 **Debug Bar** / P3 Profiler（QM 與
Scrutoscope 的替代方案）。

請參閱 `docs/for-plugin-authors.md`，了解介面／面板／提供者契約
以及新增來自你自己外掛的支援範圍（`docs/shim-tutorial.md` 以取得
自訂資料表導覽）。至於
依介面卡劃分的原始功能矩陣（狀態卡片、檢視、設定深度）由
介面卡掃描，請參閱 `docs/adapter-coverage.md`。
