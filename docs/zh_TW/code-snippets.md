# Code-snippet plugins——來源稽核

已於 2026-07-09 針對一次性
已啟用 minimal-admin 的本地 WordPress site。目標：為 Minimal 排定候選項目的
surface（與 audit-log adapters 相同模式）。

## 已稽核的 plugins

| Plugin | Slug | Version | 稽核期間狀態 |
|---|---|---|---|
| Code Snippets | `code-snippets` | 3.9.6 | 啟用 |
| WPCode | `insert-headers-and-footers` | 2.3.7 | 啟用 |
| FluentSnippets | `easy-code-manager` | 10.55 | 啟用 |
| Header Footer Code Manager | `header-footer-code-manager` | 1.1.45 | 啟用 |
| Woody | `insert-php` | 2.7.5 | **安裝正常；啟用會 fatal**（該 WP/CLI stack 中 `class.plugin.php:168` 的 null 上發生 `add_capabilities()`）|

已建立 fixtures：Code Snippets #5/#6、WPCode post 82、Fluent `1-minimal-audit-fluent.php`、HFCM row 1。

---

## Minimal adapters 排名

### 1. Code Snippets——**最佳第一個 adapter**

| 考量 | 發現 |
|---|---|
| Storage | Custom table `{prefix}snippets`（multisite 上另有 `{base}ms_snippets`）。欄位：`id, name, description, code, tags, scope, condition_id, priority, active, modified, revision, cloud_id`。|
| Caps | 可篩選的 `code_snippets_cap`（預設為 **`manage_options`**）；network cap `manage_network_options`。|
| REST | **一等公民。** Namespace `code-snippets/v1`。|
| Routes | `GET/POST /snippets`、`GET/PUT/DELETE /snippets/{id}`、`POST …/activate`、`POST …/deactivate`、`GET …/export`、`GET …/export-code`、schema，以及 importers。|
| Pagination | `page` / `per_page`＋`X-WP-Total` / `X-WP-TotalPages`。|
| 清單結構 | `{ id, name, desc, code, tags[], scope, condition_id, active, priority, network, shared_network, modified, code_error }` |
| Toggle | `PUT /snippets/{id}` 搭配 `{ "active": true\|false }` 可正常運作（200）。存在專用的 activate/deactivate routes；為取得可預期的 JSON，偏好 PUT。|
| Scopes | 至少有 `global`、`front-end`、`content`（sample data）。|
| Admin deep link | `snippets` 下的 Snippets admin menu（manage＋edit screens）。|
| Safe mode | 已記錄 query-var safe mode，可用於 white-screen recovery。|

**Minimal surface shape：** 純 REST，cookie＋nonce。List 欄位：name、scope、active toggle、tags、modified。Detail：code（第一階段唯讀）＋meta＋「Edit in Code Snippets ↗」。Actions：activate/deactivate/trash。v1 不需要 shim。

另外值得注意：它已經具備 WPCode、HFCM 和 Insert PHP Code Snippet 的 **importers**，因此遷移使用者可以進入 Code Snippets，而 Minimal 只需要一個 surface。

---

### 2. WPCode——**擴大觸及率的必備項目（3M+），需要 shim**

| 考量 | 發現 |
|---|---|
| Storage | CPT **`wpcode`**（`public=false`、`show_ui=false`、**`show_in_rest=false`**）。Code 位於 `post_content`。Active＝`post_status` **publish** 對上 **draft**。|
| Taxonomies | `wpcode_type`（php/js/css/html/text…）、`wpcode_location`（everywhere、header、after_paragraph…）、`wpcode_tags`。|
| Meta（prefix `_wpcode_`）| `_wpcode_auto_insert`、`_wpcode_auto_insert_number`、`_wpcode_conditional_logic(_enabled)`、`_wpcode_priority`、`_wpcode_note`、`_wpcode_device_type`、`_wpcode_custom_shortcode`、`_wpcode_last_error`、library/cloud fields 等。|
| Caps | Custom：`wpcode_edit_snippets`、`wpcode_activate_snippets`，以及透過 `map_meta_cap` 對應的 type-scoped（`wpcode_edit_php_snippets`、…）。Admins 可取得這些權限。|
| REST | snippets **無**。沒有 `wp/v2/wpcode`。Abilities API hooks 存在（WP 6.9+），但不是完整的 CRUD surface。|
| Write path | `WPCode_Snippet` class：`save()`、`activate()`、`deactivate()`。Admin toggle 是 AJAX `wp_ajax_wpcode_update_snippet_status`。|
| Admin deep link | `admin.php?page=wpcode-snippet-manager&snippet_id={id}` · list `admin.php?page=wpcode`。|

**Minimal surface shape：** bundled shim `minimal-admin/v1/wpcode/snippets`（list＋status toggle），呼叫 `WPCode_Snippet` / `get_posts`，並受 `wpcode_edit_snippets` / `wpcode_activate_snippets` 限制。與 Stream/Aryo audit shims 相同模式。請勿在 Minimal 中啟用其 CPT 的 `show_in_rest`。

---

### 3. FluentSnippets——**強力第三名（REST＋free/OSS）**

| 考量 | 發現 |
|---|---|
| Storage | `WP_CONTENT_DIR/fluent-snippet-storage/` 下的**扁平檔案**（覆寫：`FLUENT_SNIPPETS_STORAGE_DIR`）。Index cache `index.php`。檔名如 `1-minimal-audit-fluent.php`。|
| Caps | REST permission＝**`install_plugins`**（積極；gate 時請注意）。|
| REST | Namespace **`fluent-snippets`**（無版本）。|
| Routes | `GET snippets`、`POST snippets/create`、`POST snippets/update`、`POST snippets/update_status`、`POST snippets/delete_snippet`、`GET snippets/find`、settings routes。|
| List shape | `{ snippets: { data: [...], page, per_page, total, last_page }, tags, groups, time }`。Item：name、description、type、status（`draft`/`published`）、tags、run_at、priority、file_name、condition… |
| Toggle | `POST …/update_status` 搭配 `fluent_saving_snippet_name`＋`status`（`published` / `draft`）。已驗證 200。|
| Types | PHP、Content（PHP+HTML）、CSS、JS。|

**注意事項：** create payload 很挑剔（巢狀的 `condition` objects 若形狀錯誤，可能在其 sanitizer 中觸發 TypeError）。沒有 classic integer IDs——key 是 `file_name`。Cap `install_plugins` 對唯讀 list surface 而言過於寬泛；若 Minimal 偏好，可由 shim 重新檢查 `manage_options`。

---

### 4. HFCM——**較窄的產品（scripts，而非 PHP functions）**

| 考量 | 發現 |
|---|---|
| Storage | Table `{prefix}hfcm_scripts`——`script_id, name, snippet, snippet_type (html/js/css), device_type, location, display_on, status (active/inactive), …`。**沒有 PHP type。**|
| Caps | 在 menus 和 mutations 上使用 `manage_options`。|
| REST | **無。** Admin＋`wp_ajax_hfcm-request`。|
| Use case | Header/footer/content 注入 tracking/CSS/JS——不是 `functions.php` replacement。|

只有在 Minimal 想支援「所有 script managers」，而不只是「code snippets」時才值得使用 shim。與 WPCode 的 header/footer 傳統重疊。

---

### 5. Woody——**目前降低優先級**

- Snippets 是 **CPT**（`WINP_SNIPPETS_POST_TYPE`），具有豐富的 postmeta（`wbcr_inp_*`）。
- REST namespace `woody/v1` 僅公開 **license＋settings**，不提供 snippet CRUD。
- 此實驗室的免費啟用會 fatal（`add_capabilities()` 為 null）——在上游修正前視為不穩定。
- Themeisle 收購；產品仍在變動中。

---

## 共用 Minimal surface 草圖（audit-log 樣式）

任何支援的 plugin 啟用時顯示一個 nav item **「Snippets」**（第一個符合者優先，或多個時使用 tabs——與 Redirects / Activity Log 相同 convention：dogfood 一個已啟用項目）。

| 欄位 | Code Snippets | WPCode | Fluent |
|---|---|---|---|
| 標題 | `name` | `post_title` | `name` |
| Type/scope | `scope` | `wpcode_type`＋location | `type`＋`run_at` |
| 狀態 | `active` 布林值 | 已發布／草稿 | 已發布／草稿 |
| 標籤 | `tags[]` | 分類法 | 字串 |
| 已修改 | `modified` | `post_modified` | `updated_at` |
| 切換 | PUT 啟用狀態 | shim → 啟用／停用 | 更新狀態 |
| 深層連結 | CS 編輯畫面 | `wpcode-snippet-manager&snippet_id=` | Fluent 管理 SPA |

**v1 scope 建議：** list＋toggle＋deep-link edit。Minimal 內建 code editor 留待後續階段（security＋validation＋fatal recovery）。PHP execution risk 表示 Minimal 絕不能自行評估 snippet code——只能由 host plugin 執行。

---

## 已交付的 adapters（相同「Snippets」nav label，plugin badge 為 `sub`）

與 Redirects / Activity Log 相同 convention：每個 plugin 註冊自己的 surface
id；啟用多個時，sidebar 會顯示多個 Snippets entries，並
不同的 badges（Code Snippets / WPCode / FluentSnippets）。一次只 dogfood 一個
若希望在 production sites 上使用單一 nav item。

1. ~~**Code Snippets**~~——**已交付**（`adapters/code-snippets.php`，純
   `code-snippets/v1`）。Suite：`tests/code-snippets.test.js`。
2. ~~**WPCode**~~——**已交付**（`adapters/wpcode.php`，shim
   `minimal-admin/v1/wpcode/snippets` over `WPCode_Snippet`）。List/create/edit/toggle/delete。
3. ~~**FluentSnippets**~~——**已交付**（`adapters/fluent-snippets.php`，shim
   `minimal-admin/v1/fluent-snippets` 將 file_name 正規化為 `id`，並將 draft/published 正規化為
   `active`）。Suite：`tests/snippets-adapters.test.js` 涵蓋兩個 shims。
4. **HFCM / Woody**——尚未。HFCM 僅支援 scripts（html/js/css）；Woody 啟用
   目前實驗室的 fatals。

共用 UX：name、scope 欄位、active pill、priority、modified；寬版 detail form
（name/desc/code/scope 或 type·location/priority/tags）；Activate/Deactivate；Delete；
Edit ↗ 至 plugin 自有的 admin。

## 實驗室維護

稽核後 Woody 保持未啟用（activate fatals）。完成 snippet 工作後拆除
snippet 工作完成後拆除一次性實驗室。
