# 連線中心 — 稽核與導引

撰寫於 2026-08-06 的 v0.24.0 週期，來自 Austin 的提示：
license manager 可能想演變成授權／連線中心。這
本文是對 Minimal 目前接觸端點的所有介面的稽核。
外部服務憑證或連線，以及後來擱置的分階段計畫
其中。配套文件：`license-manager.md`（授權提供者與
防護規則）、`plugin-support.md` Waves E/F（分類清單
將 WooCommerce.com connect 呈現為最優先缺少的項目）。

## 稽核：目前有五個接觸點，而不是三個

提示猜測有三個（授權金鑰、垃圾郵件授權、AI 連接器）。
盤查發現五個，採用四種不同的處理模型。這
分散情況正是建立中心的實際理由。

| # | 介面 | 其中內容 | 處理模型 |
|---|---|---|---|
| 1 | **Extensions → Licenses**（`adapters/licenses.php`，約 40 個提供者） | 購買授權（Elementor Pro、ACF PRO、GF、TEC…），但也包含已經超出名稱範圍的連線形狀列：Envato Market 帳戶權杖、WPMU DEV 的 Hub 連線（停用動作實際上就是 `logout`）、MyYoast 入口連結、WP Rocket 的內嵌憑證、Divi 的使用者名稱 + API 金鑰配對 | `minimal-admin/v1/licenses/action`：貼上一次、Minimal 永不儲存、不自動重試、site_limit 為一級欄位、無狀態供應商使用檢查記憶 |
| 2 | **Settings → Comments、SPAM 卡片**（`adapters/spam.php`） | Akismet API 金鑰（遮罩顯示 `715e…`，目前唯讀）、CleanTalk 雲端金鑰（設計上唯讀）、Antispam Bee 與 WP Armour（無金鑰） | 僅顯示 + 深層連結；不可編輯 |
| 3 | **Settings → Connectors**（WP 7.0 `wp_get_connectors()` 登錄） | AI 提供者及任何註冊核心連接器的其他項目，包含 `authentication.setting_name` | 核心自身模型：金鑰來源解析器 env → 常數 → 資料庫，透過核心 `wp/v2/settings` 儲存，由核心遮罩回應並即時驗證 AI 金鑰；提供安裝／啟用伴隨外掛的操作 |
| 4 | **Email 介面設定**（郵件家族） | Gravity SMTP 對應真實憑證欄位，具備遮罩密鑰哨兵與常數鎖定（此處已支援金鑰編輯）；FluentSMTP 刻意排除憑證（其連線清單為唯讀，「憑證留在 FluentSMTP」） | 由各供應商設定對應器透過外掛自身的清理器寫入 |
| 5 | **Backups → Disembark 狀態卡片** | 網站權杖，按需取得以供可複製的 `disembark connect` 指令使用（不會隨頁面載入），以及重新產生權杖動作 | 情境介面上的權杖生命週期 |

相鄰但尚未呈現為可管理狀態：Site Kit 的 Google
連線與 Jetpack 的 WPCOM blog token（兩者都由
流量提供者），以及 WooCommerce.com 輔助連線（尚未接線；
授權供應商家族清單中的頂端項目）。

## 稽核結果

1. **Licenses 卡片已經是連線中心，只是尚未
   承認了這點。**其中四列並不是授權。重新命名與分組
   這是在說明真實狀態，而不是新增範圍。
2. **不要統一寫入路徑。**四種處理模型各自為政
   依其真實來源正確顯示（供應商授權 API、核心連接器
   登錄、外掛設定清理器、權杖生命週期）。缺少的是
   就是一份 INVENTORY：單一檢視回答「哪些外部服務會與
   此網站連接哪些服務、以誰的身分連接，以及每項是否健康。」
3. **保留情境介面，並使用相同的端點。**垃圾郵件卡片
   應該能直接編輯 Akismet 金鑰；中心顯示相同的列。
   中心＝稽核檢視，情境卡片＝在此修復檢視。Gravity SMTP
   settings mapper 與 Disembark 卡片已證明此模式。

## 分階段計畫

**區塊 1 — Akismet（S）。已於 2026-08-06 發佈**（與本文同日；
已透過兩個入口對即時 akismet.com 驗證的虛假金鑰；垃圾郵件
提供者合約新增可選的 `keyProvider` 狀態鍵，文件已
在 for-plugin-authors.md 中）。按照範圍：Akismet 以提供者身分加入 `licenses.php`：
從 `wordpress_api_key` + `akismet_alert_code`/`akismet_alert_msg` 讀取
（其 alert system 是本地 validity signal），遵循
`Akismet::predefined_api_key()`（WPCOM_API_KEY 常數與
`akismet_get_api_key` 篩選器呈現唯讀列），動作則透過其
自身程式碼：`Akismet_Admin::save_key()`（驗證 + 訂閱檢查 + 儲存，
其完整流程；管理員類別受 is_admin()/WP_CLI 閘控，因此 REST
需要時手動處理，即 WPForms 模式）以及 `Akismet::deactivate_key()`
+ 選項清理（沿用其自身的中斷連線先例）。垃圾郵件卡片新增
貼上／變更金鑰的操作，發佈至相同的 `licenses/action`
套件：spam-settings + license-vendors 擴充功能、虛假金鑰
針對其即時 API。

**區塊 2 — 重新定位（M）。已於 2026-08-06 發佈。**實作備註：
分類欄位是 `category`（`kind` 已被
項目形狀的 plugin/theme 軸）；分組維持以 STATE-FIRST 為主，便於分類
（Needs attention → Valid → Not set up），每列 chips 帶有
分類，而不是優先按類型分組；核心連接器只在
已設定或其伴隨外掛啟用時才列出（未安裝的目錄
維持在外）、設計上排除於健康摘要之外，而卡片
頁尾是前往 Settings → Connectors 的入口。健康檢查列
帶有伺服器端的 `goto`。
命名決策（Austin，2026-08-06，同日）：分頁維持簡潔
**「Licenses」**——複合項目「Licenses & connections」已還原。它
打破 Plugins/Themes 分頁列的一字節奏，使計數
那行文字讀起來不自然，掩蓋了旗艦授權管理器的肌肉記憶
這個詞，並與核心自身的「Connectors」詞彙在一個頁尾
移除。重新定位本身仍成立：標籤、「尚未設定」群組，以及
具備分類感知的膠囊標籤（連線顯示「已連線」／「未
連線」、「金鑰顯示『沒有金鑰』」）將分類放在卡片內。
不要重新提議更名。
按照原始範圍：Provider 合約新增
`kind: license | key | connection`；分頁重新命名（工作名稱
「Licenses & connections」）；rows 依 kind 分組；現有
連線形狀的列（Envato、WPMU DEV、MyYoast）重新分類。行銷
文案、使用者指南，以及網站的 Licenses 分類卡片會在下一次
版本發佈。核心連接器（接觸點 3）會以唯讀列顯示並連結
進入 Settings → Connectors；目前該區段仍保留在 Settings
（它才剛針對 WP 7.0 registry 交付；納入其中是另一項
決策）。

**區塊 3 — 網站連線（M–L）。已於 2026-08-06 發佈。** WooCommerce.com
輔助連線狀態（「以 X 身分連線，N 個訂閱」，來自
`woocommerce_helper_data` 驗證，以及 `_woocommerce_helper_subscriptions`
暫時性，其自身的 `is_site_connected()` 規則）、Site Kit
（存在 `googlesitekit_credentials`，從不解碼，＋
`googlesitekit_has_connected_admins`；半連線讀取 `unknown`），以及
Jetpack（`jetpack_private_options` blog_token + `jetpack_options`
id/master_user，僅存在性）作為唯讀連線提供者。一個
未連線的 ACTIVE 列提供 **Connect ↗**，進入供應商自身的畫面
（href label 會依 category 調整）；off rows 僅提供 Turn on，因為
已停用外掛的連線畫面不存在。健康狀態：這些列
加入一般摘要，因此半連線的 Site Kit 會像任何
未知授權。OAuth 儀式與中斷連線仍留在供應商
畫面，依照範圍處理。

## 非目標

- 單一通用寫入路徑（見上文；以供應商自身機制為準）。
- 在 Minimal 端儲存任何密鑰（沿用 license-manager.md 的防護規則）。
- 重建 OAuth 流程（Site Kit、Jetpack、WooCommerce.com connect
  設定儀式仍留在各自畫面；Minimal 顯示狀態並提供連結）。
- 將郵件憑證編輯移出 Email 介面（它位於
  該功能所在之處，這是設計如此）。
