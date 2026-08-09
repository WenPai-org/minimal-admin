# Minimal Admin 的內容區塊

**北極星：**Minimal 是 WordPress 的寫作編輯器。Gutenberg 是版面工具。

本文是提供給希望**建立可在 Minimal 中持續完整運作的區塊**之人士的合約
Minimal**。這並不承諾每個網站上的每個區塊都具備完整編輯器。版面套件
應屬於區塊編輯器。文件元件則屬於此處。

API 詳細資訊（篩選器、描述器鍵、島嶼 CSS hooks）位於
[for-plugin-authors.md](for-plugin-authors.md)。編輯器安全模型：
[editor-direction.md](editor-direction.md)。檢查器歷史：
[block-inspector.md](block-inspector.md).

## 為什麼歡迎自訂區塊

Minimal 不必變成 Gutenberg，作者也能擴充它。它需要**文件
類型**：提示框、對話、時間軸、統計列、報告卡、常見問題、重點統計。
它們與標題和引文區塊是同一類工作，只是更豐富。

建立區塊外掛，讓作者能在 Minimal 中持續編輯文章，是正確且預期的做法。
[Anchor Blocks](https://github.com/anchorhost/anchor-blocks) 是參考：伺服器呈現
離開 PHP 屬性結構描述、用於插入範本與標籤的精簡 `app/MinimalAdmin.php`，不
Minimal 內的第三方 JavaScript。

錯誤做法是承諾所有靜態儲存設計系統都具備完整保真度，或
讓 Minimal 的 SPA 成長為重新實作外掛 React UI。內容區塊保真度就是產品。
版面區塊的保真度就是交接點。

## 兩種區塊

| | **內容區塊（供 Minimal 使用）** | **版面區塊（供 Gutenberg 使用）** |
|---|---|---|
| 工作 | 在文章中表達意義 | 組合視覺版面 |
| 真實來源 | 屬性＋伺服器呈現（或簡單、已知的標記）| 用戶端 `save()`＋設計 UI |
| 在 Minimal 中編輯 | 檢查器、子項目清單、文字／圖片工具、即時欄位 | Island＋「Block editor ↗」|
| 作者目標 |「我可以在 Minimal 中撰寫這篇文章」|「我可以不用程式碼設計這個頁面」|
| 範例 | 提示框、對話訊息、統計卡、常見問題項目 | 欄系統、封面遊樂場、裝置可見性樹狀結構 |

兩種類型在 WordPress 中都有效。Minimal 針對左欄最佳化，並讓右欄
**安全**（島嶼位元組完全相同、真實預覽，以及在標記允許時進行島內內容編輯）。

**試金石：**如果修改*文案*需要開啟區塊編輯器，就不是 Minimal 內容
尚未有區塊。如果修改*間距、欄或絕對版面*需要區塊編輯器，那
是正確且永久的。

## Minimal 永遠不會重新實作的內容

為寫作產品凍結（見 [editor-roadmap.md](editor-roadmap.md)）：

- 將巢狀版面作為一級畫布（群組、欄、封面作為拖曳目標）
- 在 Minimal 內承載第三方區塊編輯器 JavaScript
- 重新產生只有外掛的 JS `save()` 才知道如何產生的靜態 HTML
- 將完整網站編輯／範本部分／全域樣式作為 Minimal 介面
- 「區塊一致性」作為路線圖 KPI

Minimal **可以**將完成的序列化標記（模式、設計函式庫）作為島嶼插入，並
**可以**編輯這些島嶼內的文字與圖片。這不是版面編輯，而是
插入 + 寫入。

## 內容區塊合約

針對此路徑設計，大多數區塊不需要任何 Minimal 專用程式碼。

### 優先使用

1. **`render_callback`（或 block.json `render`）+ `save: null`**，用於葉節點。  
   單獨的 `<!-- wp:namespace/name {"attr":"…"} /-->` 是有效的已儲存標記，也是有效的預覽。
2. **作為內容的屬性。**標題、本文、標籤、列舉樣式、數值。  
   不是前端會忽略的平行設計權杖樹。
3. **在 PHP 或 `block.json` 中註冊結構描述。**類型、列舉、預設值、標題、`parent`／
   `ancestor`。Minimal 的檢查器與自動插入都讀取伺服器登錄。
4. **預設值也能產生有意義的輸出。**空白或預設 attrs 仍應呈現某些內容
   在 `do_blocks` 中保持誠實，或提供一個帶有起始內容的 `insert.template`。
5. **註冊前端樣式，讓 `do_blocks` 可以加入佇列**（不只在
   `has_block()` 會在已儲存文章中找到它們）。島嶼預覽會執行真正的 render 路徑。
6. **子項目作為內容單位**（訊息、列、卡片、項目），而不是自由版面儲存格。

### 謹慎使用（仍受支援）

1. **靜態 InnerBlocks wrapper**，需要固定外殼時使用（對話、時間軸）。  
   提供一個包含真實 wrapper HTML + 起始子項目的 `insert.template`。不要依賴單獨的
   自閉合註解。Minimal 可以重新排序／新增／移除 **內容**子項目；但不會
   為設計屬性重新產生任意父層 `save()` 輸出。
2. **`minimal_admin_block_forms`**，用於標籤、控制項類型、選項文字、欄位順序，以及
   插入種子資料。這是結構描述的精修，而不是第二套註冊系統。
3. **`wrapperText`**，用於靜態父 wrapper 中的單一宣告文字區域（例如
   對話標題）。請參閱 for-plugin-authors.md。

### 若 Minimal 的目標是編輯，請避免

1. **靜態 `save()`**，從複雜屬性產生大量 HTML/CSS（版面套件）。
2. **混合區塊**（render_callback *與* JS `save()` wrapper），但沒有已知的插入
   範本。單獨的註解通常會呈現為空白，並導致 Gutenberg 驗證失敗。
3. **空的伺服器結構描述**，所有真實資訊只存在於編輯器 JavaScript。
4. **設計控制項就是產品**（間距尺度、絕對位置、斷點樹）。
5. **要求使用區塊編輯器**才能修改讀者看到的文字。

## Minimal 如何對待你的區塊（按類別）

| 您的區塊 | 插入 | 編輯內容 | 編輯設計／結構 |
|---|---|---|---|
| 動態葉節點、良好結構描述 | 透過 `insert` 自動（搜尋）或斜線指令 | 檢查器表單 | 若屬性本身就是內容，則不適用 |
| 動態子項目的動態父節點 | 範本，或空白並新增子項目 | 子項目清單＋表單 | 結構需要時新增／移除／重新排序內容子項目 |
| 靜態 InnerBlocks 內容父節點 | **必要** `insert.template` | 子項目＋`wrapperText` | 父節點設計留在區塊編輯器中 |
| 靜態儲存設計工具包 | 設計庫／樣式標記，或從 Gutenberg 貼上 | 標記允許時可替換文字執行內容＋圖片 | 僅限區塊編輯器 |
| 無範本的混合模式 | 排除自動插入 | 若已在文章中則使用 Island | Block editor |

無需 adapter 即可套用的通用工具：

- **文字執行段**位於島嶼 HTML 上（編輯文字節點而不重新產生結構）
- **圖片替換**，前提是 URL 與媒體 id 慣例在 attrs + 標記中保持一致
- **結構描述檢查器**，用於已註冊的屬性（非來源）
- **透過 `minimal-admin/v1/render-blocks` 實現真正的前端預覽**

## 在*你的*外掛中提供整合

與介面相同的慣例：單一檔案、無條件篩選器，Minimal 不存在時免費 no-op。

```
my-plugin/
└── includes/minimal-admin.php   ← minimal_admin_block_forms, optional insert_blocks tweaks
```

參考：Anchor Blocks `app/MinimalAdmin.php`。

Minimal 動態葉節點（通常單獨就足夠）：

```php
register_block_type( 'my-plugin/pull-stat', array(
	'title'           => 'Pull stat',
	'attributes'      => array(
		'value' => array( 'type' => 'string', 'default' => '0' ),
		'label' => array( 'type' => 'string', 'default' => 'Label' ),
		'color' => array(
			'type'    => 'string',
			'default' => 'blue',
			'enum'    => array( 'blue', 'green', 'red' ),
		),
	),
	'render_callback' => 'my_plugin_render_pull_stat',
) );
```

可選的細節打磨：

```php
add_filter( 'minimal_admin_block_forms', function ( $forms ) {
	$forms['my-plugin/pull-stat'] = array(
		'insert' => array(
			'label'    => 'Pull stat',
			'template' => '<!-- wp:my-plugin/pull-stat {"value":"42","label":"Uptime"} /-->',
		),
		'attributes' => array(
			'value' => array( 'label' => 'Value' ),
			'label' => array( 'label' => 'Caption' ),
			'color' => array(
				'label'   => 'Accent',
				'control' => 'select',
				'options' => array(
					array( 'blue', 'Blue' ),
					array( 'green', 'Green' ),
					array( 'red', 'Red' ),
				),
			),
		),
	);
	return $forms;
} );
```

完整描述器詞彙：[for-plugin-authors.md](for-plugin-authors.md)
（`minimal_admin_block_forms`、`minimal_admin_insert_blocks`、島嶼預覽 hooks）。

## 設計函式庫與模式

如果你的產品是**完成構成的目錄**（而不是自由形式的設計畫布），
公開序列化標記，而不是要求 Minimal 重建你的 React 編輯器：

- 篩選器 `minimal_admin_design_sources`（依 id 列出 + 取得範本），或
- 註冊 Minimal 可以透過核心模式登錄列出的區塊模式

Minimal 將頂層區段作為島嶼插入。接著作者使用文字執行段、圖片替換，以及
在標記允許時提供子項檢查器。間距與版面控制項留在 Gutenberg。

這條路徑適用於內容套件，不是邀請你重新實作完整的 builder UI
在 Minimal 中。

## 成功標準

對 Minimal 而言，內容區塊在以下情況算是「完成」：

1. 作者可以從 `/` 或 Browse 插入它，而不必開啟區塊編輯器。
2. 文字（及內容 attrs）在 Minimal 中變更，並能乾淨地往返轉換。
3. 在 Gutenberg 中開啟同一篇文章，不會顯示無效區塊復原。
4. 如有僅限設計的變更，應明確標示為「Block editor ↗」，而不是 Minimal 中缺少 UI。

如果（1）至（3）成立，你就擴充了寫作編輯器。若你需要 Minimal 來拖曳
欄並重建 `save()` HTML，就是在要求版面工具。請使用 Gutenberg 來
保留這項功能，並讓 Minimal 負責撰寫內容。

## 相關內容

| 文件 | 角色 |
|---|---|
| [editor-direction.md](editor-direction.md) | 混合編輯器決策、Island、允許清單 |
| [editor-roadmap.md](editor-roadmap.md) | 發展方向＋永不建置清單 |
| [block-inspector.md](block-inspector.md) | Island 如何變得可設定 |
| [for-plugin-authors.md](for-plugin-authors.md) | Hook 與描述器參考 |
| [block-suites.md](block-suites.md) | 以版面為導向的區塊外掛實驗筆記 |
| [page-builders.md](page-builders.md) | 全畫布建構器（深層連結，而非內容區塊）|
