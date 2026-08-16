# Shim 教學 — 為虛構的自訂資料表外掛程式接線到 Minimal

大多數能受益於 Minimal 介面的外掛，都會將資料保存在
自訂資料庫資料表：表單項目、電子郵件記錄、重新導向、佇列資料列。核心
REST 對那些資料表一無所知，因此整合分為兩個部分：

1. **REST shim**——幾個將「我資料表中的列」轉換為
   轉換為 JSON，以及
2. **surface descriptor**——純資料，告訴 Minimal 如何呈現它。

本教學會為一個虛構的外掛程式從頭到尾建立兩者。
完成的程式碼是一個真實可運作、可以複製的外掛程式：
[`docs/examples/minimal-example-adapter/`](examples/minimal-example-adapter/minimal-example-adapter.php).
將其放入 `wp-content/plugins/`，在 Minimal Admin 旁啟用它，然後
**Feedback** 檢視會出現在側邊欄，包含狀態卡片、分頁、搜尋、
詳細資料對話框和資料列操作。以下每個章節都編號以對應
該檔案中的註解。（Minimal 自己的測試套件也會測試它，
`tests/example-adapter.test.js`，因此如果契約日後變更，
範例會在你受到影響前，先在 CI 中失敗。）

故事背景：**Campfire** 將訪客意見收集到
`{prefix}campfire_feedback`：id、name、email、message，以及 status
（`new`／`read`／`archived`），以及 UTC `created_at`。

## 步驟 0 — 程式碼所在位置

你自己的外掛內的一個檔案，無條件載入：

```php
require_once __DIR__ . '/includes/minimal-admin.php';
```

其中所有內容都是 `add_filter`／`register_rest_route` 呼叫：使用 Minimal
若缺少篩選器，它永遠不會觸發，路由就只是閒置著：一個免費的無操作。
不需要 `class_exists( 'Minimal_Admin' )` guard。（範例外掛
僅使用單一檔案，因為這是教學。）

## 步驟 1 — 資料（需要注意的一個決策）

資料表本身就是你的外掛程式現有的資料表。唯一值得做的選擇
刻意採用的做法：**以 UTC 儲存時間戳記**（`gmdate`，而不是
`current_time`）。Minimal 會在
訪客的時區，而且它需要知道自己正在解析什麼。沒有時區的日期時間
都假設為網站本機時間；欄位上的 `utc: true` 旗標（步驟 4）會宣告
否則會如此。經典的 shim 錯誤是儲存 UTC，卻讓它呈現為
網站本機時間：每個時間戳記都會依網站的時區偏移，而且沒有人注意到
直到日誌項目看起來像是來自未來。

## 步驟 2 — 一個功能輔助函式

```php
function campfire_can() {
	return current_user_can( 'moderate_comments' );
}
```

Pick the capability for the **data**, not for the screen. These rows hold
visitor names, email addresses and message bodies, so the bar is the one you
would set for reading comments. `edit_posts` would have handed the whole
inbox to every Contributor. A surface is only ever as private as its
capability, and the default in an example is what gets copied.

Minimal 會在介面中建立該介面之前，先檢查描述元的 `cap`
全部如此，但那是 UI 閘控，只是便利功能。**你路由本身的
`permission_callback` 就是邊界。** 將答案集中在一個
函式，讓兩者永遠不會不一致，並將主體替換成你的外掛程式
真正的功能模型（一個細粒度 cap、由選項驅動的角色檢查、你的
自己的 resolver）。如果你的外掛程式有自己的存取設定（「只有這些
可能查看提交內容的角色」），請在此處透過它們，就像內建的
WP Activity Log adapter 會透過該外掛程式自身的
`Settings_Helper::current_user_can()`.

## 步驟 3 — REST shim

五個小型路由。Minimal 會使用的形狀：

| 路由 | 回傳內容 |
|---|---|
| `GET /feedback` | `{ "items": [...], "total": 123 }` — 清單 |
| `GET /feedback/{id}` | 一個項目 — 詳細資料彈出視窗 |
| `POST /feedback/{id}/read` | `{ "message": "Marked as read" }` — 一個動作 |
| `POST /feedback/{id}/archive` | 相同結構 — 第二個動作 |
| `GET /feedback/status` | 狀態卡片模型 |

讓 shim 保持安全的規則，範例檔中全都清楚可見：

- **每個路由都宣告 `permission_callback`。** 絕不能將 `__return_true` 用於
  私有資料。（Minimal 的 System 頁面會標記略過此步驟的外掛程式。）
- **每個查詢都會經過 `$wpdb->prepare`。** 搜尋輸入欄是一個
  訪客輸入、即將進入 SQL 的字串：`esc_like` + 佔位符，不要
  例外。
- **上限為 `per_page`。** Minimal 要求 25；手工建立的請求不應
  能夠要求一百萬筆。
- **絕不 `unserialize()` 已儲存的 blob。** Campfire 不需要，但
  會影響實際記錄資料表的一項規則：如果舊資料列包含 PHP 序列化的
  值，請使用正規表示式或 `json_decode` 解析；精心製作的資料絕不能
  到達 `unserialize()`。

清單路由會讀取 Minimal 傳送的三個輸入：`page`（以及你的
`pageQuery` 範本名稱，此處為 `per_page`）、目前分頁的值（此處為
`status` 參數（在步驟 4 中宣告），以及經過防抖處理的 `search` 詞彙。
它會回答 `{ items, total }`；描述元的 `itemsKey`／`totalKey`
讓 Minimal 同時指向兩者。標準 WP 風格的集合（純陣列加上
`X-WP-Total` 標頭）會完全略過這兩個金鑰。

在一個函式中整理每一列（範例中的 `campfire_item()`），如此
清單路由和詳細資料路由永遠不會彼此偏離。

Action 路由透過外掛自己的程式碼路徑執行一次寫入，並
可能會回傳 `{ "message": "…" }`；該字串會取代 Minimal 的預設
「⟨label⟩——完成」toast，當結果需要時，這是誠實的回報管道
比按鈕標籤承諾的內容多出更多文字。

狀態路由會回傳 **可直接顯示的字串**：Minimal 會呈現卡片，
由你的伺服器負責格式化（數量、`human_time_diff`、貨幣、
等等）。選用的 `chart` 索引鍵會以相同的方式繪製每日長條序列
與 Minimal 的「概覽」圖表一致的視覺語言。

## 步驟 4 — 描述元件

單一篩選器上的純資料。沒有回呼會傳到用戶端（`setup` 個可呼叫項目
都會在伺服器端評估），不會傳送 JavaScript，而且 Minimal 會逸出每個
它呈現的值；絕不要預先跳脫。

```php
add_filter( 'minimal_admin_surfaces', 'campfire_surface' );
```

依照範例描述元件逐一檢視這些選擇：

- **`cap`**——映射 `campfire_can()`（步驟 2）。
- **`group: 'workspace'`**——Campfire 呈現收件匣形態：新項目會到達並
  需要人工處理。這就是 Workspace 放置的標準。記錄、重新導向
  以及相關管線屬於預設的 Tools 群組；使用者可以隱藏任何
  與其不一致的介面（而且沒有 API 可以抵抗它）。
- **`tabs`**——靜態形式：一個 `param` 加上 `[value, label]` 組。Minimal
  會在 New 分頁的清單請求中附加 `status=new`，並省略
  All 的參數。（針對 Gravity 等 API，存在 `{tab}`-in-route 形式
  其分頁為路徑區段的表單。）
- **`search: 'search={q}'`**——查詢字串範本。物件形式的
  `search` 僅適用於接受 JSON 條件字串的 API；如果你的路由
  讀取一般參數時，請使用範本。
- **`columns`**——注意狀態上的 `format: 'pill'`，以及搭配 `format: 'ago'` 的
  時間戳上的 **`utc: true`**（步驟 1 的決策，已宣告）。
- **`detail`**——`detailRoute` 取得完整項目；`messageKey` 進行呈現
  將一個欄位作為大型訊息區塊；`skip` 會隱藏簿記金鑰。
  剩餘的金鑰會以資料列呈現，snake_case 會顯示為一般單字；請為你的
  供人員使用的回應金鑰，而你不需要其他內容。（`labels` 的存在是為了
  其鍵為數字欄位 ID，並指向一個可解析
  它們；`sectionsRoute` 會交給 Minimal 一個完全由伺服器建構的檢視畫面。）
- **`actions`**——「Mark read」會攜帶 `when: { key: 'status', equals: 'new' }`
  因此只有在項目確實為新項目時才會提供；「Archive」會攜帶
  `confirm` 和 `danger`。兩者都會透過步驟 3 的 shim 路由執行，並且
  出現在詳細資料對話框以及資料列的 ⋯／右鍵選單中。

## 步驟 5 — 驗證

1. 啟用兩個外掛。**Feedback** 會出現在 Minimal 側邊欄的
   Workspace。
2. 開啟 `/minimal-admin/system` 並找到 **Integrations** 卡片：你的
   介面會列出並標註為你的外掛程式，且不會有任何標記問題。
   這張卡片就是你的建置時除錯器：描述元件金鑰拼寫錯誤或
   缺少路由時，這裡會說明原因，而不是靜默失敗。
3. 逐一點擊：分頁會在伺服器端縮小範圍，搜尋會縮小範圍，詳細資料 modal
   顯示訊息；項目一旦使用後，「Mark read」就會消失（
   `when` gate），狀態卡片中的計數也會移動。

如果介面完全沒有出現：目前使用者未通過你的 `cap`，或
描述元未註冊（你的檔案是否無條件載入？）。如果
清單為空但介面有呈現：直接造訪你的清單路由
（`/wp-json/campfire/v1/feedback`），已登入；一個 `permission_callback` 拼字錯誤
回應 401，Minimal 會顯示空清單，而不是其他人的錯誤
頁面。

完成後的介面，全部在步驟 3 中宣告：

![The finished Campfire Feedback surface: status card with chart, tabs, search, pill and time columns](img/surface-list.png)

## 接下來可以做什麼

[for-plugin-authors.md](for-plugin-authors.md) 中的其他所有內容都是
在這個確切結構之上加以擴充：大量操作、第二個集合
（`manage`）、額外清單檢視（`views`）、由結構驅動的設定、設定
閘控、建立表單、行內詳細資料編輯。內建的 adapters 位於
`includes/adapters/` 都是本教學在實際世界中的
針對 Gravity SMTP、Duplicator 和 Limit Login 等外掛程式的模式
嘗試。當參考內容中的形狀看起來抽象時，其中一個
具體版本。
