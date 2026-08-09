# 頁面建構器——共存，而非競爭

**問題：** 當網站使用 Divi、Elementor、Brizy、Etch 或
Beaver Builder？這些使用者能否繼續使用自己的建構器，同時永遠不跳轉到 wp-admin
畫面——而 Minimal 能否在建構器擁有的內容周圍保持安全？

**答案（已於 2026-07-05 在現場實驗室驗證）：** 兩者皆是。每個主要建構器都有
完全沒有 wp-admin 介面元素的編輯介面——大多數是字面上的前端 URL。Minimal 的工作
就是偵測由建構器擁有的文章，為它們提供正確入口，並拒絕讓自身
編輯器破壞建構器擁有的內容。已以 `includes/adapters/page-builders.php` 上線
（`minimal_builder` REST 欄位），再加上 app.js 中的清單標籤與編輯器處理。

## 實驗室方法

啟用 minimal-admin 的一次性本機 WordPress 網站；已安裝 Divi 5
（theme）、Etch 1.6.1、Beaver Builder agency + theme、Brizy 2.8.17 + Pro、Elementor free
（wp.org；該次測試手邊沒有 Elementor Pro zip，但 Pro 沿用 free 的
儲存／URL）。對每個建構器：在實際瀏覽器中開啟其編輯器介面，
在可編寫的情況下儲存，然後檢查 `post_content`、文章中繼資料，以及 Minimal 的
編輯器呈現相同的文章。

## 每個建構器實際上做了什麼

| 建構器 | 權威內容所在位置 | post_content 儲存內容 | 編輯介面（沒有 wp-admin 外框） | 偵測 |
|---|---|---|---|---|
| **Elementor** | `_elementor_data` postmeta（JSON） | 過時／裝飾性副本 | `post.php?post=N&action=elementor` — wp-admin URL，渲染全螢幕 app | `_elementor_edit_mode = builder` |
| **Beaver Builder** | `_fl_builder_data` / `_fl_builder_draft` postmeta（序列化 PHP） | 扁平化渲染（發佈時） | `permalink?fl_builder` — 純前端 | `_fl_builder_enabled = 1` |
| **Brizy** | `brizy` postmeta 儲存（+ 已編譯 HTML） | 已編譯副本 | `post.php?action=in-front-editor&post=N` — 跳轉至前端編輯器 | `Brizy_Editor_Entity::isBrizyEnabled()`（存在 `brizy_post_uid`） |
| **Divi 4（舊版）** | `post_content` | `[et_pb_*]` shortcode soup | `permalink?et_fb=1` — 純前端 | `_et_pb_use_builder = on`，沒有 `wp:divi/` |
| **Divi 5** | `post_content` | `<!-- wp:divi/* -->` 區塊標記 | `permalink?et_fb=1` — 純前端 | `_et_pb_use_builder = on` + `wp:divi/` |
| **Etch** | `post_content` | `<!-- wp:etch/* -->` 區塊標記 | `home_url?etch=magic&post_id=N` — 位於**網站根目錄**的前端 app（Etch 的 `AppRenderer` 會根據 `is_front_page()` 進行閘控；固定連結 URL 會產生空白頁），管理列由 Etch 移除 | 內容中的 `wp:etch/` |
| **Bricks** | `_bricks_page_content_2` postmeta（元素樹） | 未觸碰 | `permalink?bricks=run` — 純前端 | `_bricks_editor_mode = bricks`（或現有的 content meta） |
| **WPBakery** | `post_content`，作為 `[vc_row…]` 短代碼 | shortcode soup | `post.php?vc_action=vc_inline&post_id=N` — wp-admin URL，渲染前端內嵌編輯器 | `_wpb_vc_js_status = true`（或內容中的 `[vc_row`） |

由此產生兩種類型：

### 原生區塊建構器（Etch、Divi 5）——Minimal 已經可以互通

其標準內容是 `post_content` 中的原生 Gutenberg 區塊標記。Minimal 的
island 機制會將 `wp:etch/*`／`wp:divi/*` 視為原子 island：完整保留，
區塊之間的文字可編輯，檢查器可用。已驗證：Minimal 儲存後可往返處理
建構器標記逐位元組一致——在 WordPress **核心**進行一次 REST 儲存
正規化（block-hooks 機制會在每次
REST 插入：`{}` attrs 會變成 `[]`，attrs 中的 HTML 會經過 `<`-跳脫）。Gutenberg
儲存會套用完全相同的正規化；已處於標準格式的內容則是固定的
次儲存都套用完全相同的正規化；已處於標準格式的內容則是固定的
正在轉變——Divi 5 的整個 `builder-5/` 伺服器模組都以區塊解析器為基礎。

Bricks 在概念上加入原生區塊清單，但會將其元素樹儲存在**文章中繼資料**
（`_bricks_page_content_2`），因此它像下方的 meta-storage 群組一樣受到隔離——其
`post_content` 未受影響，而 Minimal 的編輯對 Bricks 將不可見。WPBakery 則
shortcode-storage（如舊版 Divi 4）：內容是 `[vc_row]` soup，位於 `post_content`，
透過 `the_content` 渲染，但由建構器自行擁有。

### 中繼資料儲存型建構器（Elementor、Beaver Builder、Brizy、Bricks）＋簡碼型 Divi 4／WPBakery——必須加以隔離

標準內容位於 *`post_content`* **之外**（或對 Divi 4 而言，以簡碼形式位於其中
soup（Visual Builder 所擁有）。`post_content` 所儲存的是過時或已編譯的副本。
已在線上驗證的陷阱：在 Minimal 中開啟 Elementor 頁面時，呈現為一個看似完美的
可編輯的傳統模式文件——但對它的編輯將**永遠不會無聲地呈現**
（Elementor 會呈現 `_elementor_data`，而不是 `post_content`）。這是最糟糕的失敗
Minimal 類別具備的是：不是崩潰，而是一個無聲的謊言。

## 整合功能（已上線）

`includes/adapters/page-builders.php` 會在所有項目上註冊一個 **`minimal_builder` REST 欄位**
REST 可見的文章類型，僅在建構器啟用時提供。對每篇文章，它會回答：
`{ id, name, edit_url, owns_content }`，第三方則透過
`minimal_admin_page_builders` 篩選器（與 surfaces/panels 相同理念：內建介面卡
針對主要品牌使用篩選器，其他品牌則使用通用處理方式）。

用戶端行為：

- **內容清單**：在狀態標籤旁顯示一個低調的標籤（「Elementor」、「Divi」……），以便
  建構器頁面在開啟前即可辨識。
- **編輯器、`owns_content: true`**：文章會被強制進入**鎖定模式**——這表示
  讓所有正確行為自然沿用現有機制：本文是唯讀的
  預覽（鎖定模式會升級至 `content.rendered`，其會執行 `the_content`，而該
  表示預覽會顯示*建構器的實際輸出*），任何寫入路徑都不會傳送
  `content` 時，會略過自動儲存至修訂版本。附註會說明畫布由誰擁有，並以
  一個**在 ⟨Builder⟩ 中編輯**按鈕，連至無介面元素的編輯介面。標題、狀態、代稱、
  排程、特色圖片、標籤與 SEO 面板仍可從 Minimal 儲存——這就是
  實際產品：Minimal 保持為建構器「周圍」沉穩的管理介面。
- **編輯器、`owns_content: false`**（Etch、Divi 5）：如目前一樣完全可編輯（islands do
  保護），並在較淺色的變體中加入相同註記，以及「在建構器中編輯」
  按鈕。

## 「永遠不跳轉到 /wp-admin/」的實際效果

- Beaver Builder、Divi、Etch：編輯介面是**前端 URL**——wp-admin 是
  即使在網址列中也絕不會出現。
- Elementor、Brizy：URL 在技術上是 `post.php?action=…`，但它會呈現
  建構器自己的全螢幕應用程式，完全沒有 wp-admin 介面元素（已透過螢幕截圖驗證）。該
  使用者體驗中沒有 wp-admin；只有網址列知道。
- 所有編輯周邊功能——清單、狀態、搜尋、留言、媒體、使用者、SEO
  欄位——就是 Minimal。

## 在建構器中建立新頁面（於 2026-07-05 上線，同日）

「+ New」選單會在「Page in…」分隔線下列出每個啟用中的建構器。
`POST minimal-admin/v1/builders/new {builder, type}` 會建立草稿（標題為「Untitled」——
`wp_insert_post` 拒絕完全空白的文章），執行建構器的 `prepare` 回呼（該
相同的中繼資料），並回傳編輯 URL；接著用戶端會交給
分頁前往建構器。即時驗證：Elementor 在準備好的
草稿，而 Beaver Builder 會在草稿難看的 `?page_id=N&fl_builder` 固定連結上啟動。
第三方建構器只要在其內容中加入 `prepare`，即可免費取得這套流程
`minimal_admin_page_builders` 描述元。

## 未建置（刻意保留，列為後續階段候選項目）
- **建構器範本／程式庫**（Elementor library、Divi library、BB saved rows）：
  其 CPT 會保持在 Content 中隱藏（`elementor_library` 本來就是如此）；管理這些
  屬於各建構器。
- **佈景主題建構器介面**（Divi Theme Builder、Elementor Pro site parts）：超出
  範圍——網站**建置**屬於網站本身，Minimal 負責網站**運作**。
- Elementor Pro 未直接測試（手邊沒有 zip）；它與免費版共用儲存方式，並且
  編輯器 URL，因此偵測與路由都能正常運作。取得授權後值得進行一次抽查。
- Etch 的建構器在實驗室中啟動為空白應用程式（推測受到 SureCart 授權閘門限制）；
  其儲存格式與編輯 URL 已從原始碼及其自身測試固定資料中確認。

## Etch 的編輯 URL——造成問題的那個

Etch 是唯一的例外：只有在 `is_front_page()` 為 true 時，其前端應用程式才會呈現
（`AppRenderer::should_render`），因此文章必須以 `?post_id=N` 的形式傳入，對著
**網站根目錄**，而不是 `permalink?etch=magic`。固定連結表單會載入 Etch 的空白建構器
範本，沒有 app，也沒有主控台錯誤——一個無聲的白頁（已回報並修正
2026-07-05）。這正是 Etch 自己的管理工具列「Edit with Etch」按鈕所建立的 URL。

## 實驗室產物

一次性多建構器網站僅在進行建構器工作時保留。
該實驗室中的典型示範頁面：每個建構器各一篇文章（Elementor、Beaver、Brizy、
Etch、Divi 4 簡碼、Divi 5 區塊）。
