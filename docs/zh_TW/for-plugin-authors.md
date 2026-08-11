# 將你的外掛加入 Minimal Admin

Minimal Admin 透過 **surface** 呈現第三方外掛資料：宣告式描述元
以 PHP 註冊。一個篩選器，不需要 JavaScript，也不需要建置步驟。大多數外掛管理畫面都
三種形狀之一（清單、單一項目的詳細檢視、幾個統計數字），而 Minimal 會繪製
全部三者皆使用相同的清單／分頁／詳細資料模態視窗／動作原語，這些原語驅動其
內建檢視。

## 快速入門

```php
add_filter( 'minimal_admin_surfaces', function ( $surfaces ) {
    $surfaces['my-plugin'] = array(
        'label'      => 'Submissions',          // sidebar + page title
        'sub'        => 'My Plugin',            // small badge next to the title
        'icon'       => 'inbox',                // one of Minimal's icon names
        'cap'        => 'manage_options',       // checked server-side before the surface is exposed
        'collection' => array(
            'route'     => 'my-plugin/v1/submissions',   // any REST route, called with cookie + nonce
            'pageQuery' => 'per_page=25&page={page}',    // {page} is filled in by Minimal
            'itemsKey'  => 'items',   // key of the item array in the response (omit if the response IS the array)
            'totalKey'  => 'total',   // key of the total count (omit to use the X-WP-Total header)
            'columns'   => array(
                array( 'key' => 'title',  'label' => 'Title',  'format' => 'title' ),
                array( 'key' => 'email',  'label' => 'Email' ),
                array( 'key' => 'status', 'label' => 'Status', 'format' => 'pill' ),
                array( 'key' => 'date',   'label' => 'Date',   'format' => 'ago' ),
            ),
        ),
    );
    return $surfaces;
} );
```

這就是 Minimal 側邊欄中可運作、具分頁功能且受功能權限控管的檢視畫面。

**你的資料位於沒有 REST 路由的自訂資料表中？** 這是最常見的情況，而且它
擁有自己的端到端操作指南：[the shim tutorial](shim-tutorial.md)，其中會建立
一個小型 REST shim 加上這個虛構外掛程式的描述元。完成的程式碼會以
可供你複製的實際可運作外掛（[`docs/examples/minimal-example-adapter/`](examples/minimal-example-adapter/minimal-example-adapter.php)），
而 Minimal 自己的測試套件會端到端驅動它，因此範例永遠不會偏離
契約。這就是該教學完成後的介面，完全由
本頁記錄的宣告式索引鍵：

![The shim tutorial's finished Campfire surface: a status card with chart, tabs, search, pill and time columns](img/surface-list.png)

**正在建置表單外掛？** 完成教學後，
[first-class Forms provider recipe](#make-your-forms-plugin-a-first-class-forms-provider)
涵蓋表單專用機制：每個表單的索引標籤、`entry-summary` 欄、
聯絡卡項目詳細資料、Entries/Forms 切換器和 `forms` 系列。

## 測試你的整合

- **Integrations 卡片就是你的建置時期偵錯工具。** 開啟 Minimal 的系統頁面
  （`/minimal-admin/system`），並尋找 **Integrations**：它會列出每個已註冊的介面，
  編輯器面板、設計來源、快取清除器、頁面建構器和 hook 監聽器、屬性
  各自對註冊它的外掛，並標示契約問題（未知索引鍵、
  缺少路由、沒有索引鍵的欄位）。應用程式無法安靜地呈現的描述項
  在那裡自我說明，而卡片的複製報告會帶上該區段，方便提交錯誤報告。
- **在一次性 WordPress 環境中試用。** Minimal 的 readme 提供一鍵
  [WordPress Playground](https://playground.wordpress.net/) 徽章，可啟動示範網站
  在已安装 Minimal 的情况下：在那里上传您的插件 zip，即可测试您的界面，而无需
  接觸實際網站。啟動流程也會預先啟用 shim 教學的範例外掛
  （**Feedback** 介面，預先填入示範列），因此此 API 的可運作實例是
  在你寫入任何內容前，只需點擊一次即可。
- **以非管理員身分測試。** 你的 descriptor 中的 `cap` 會對沒有
  它，但你路由的 `permission_callback` 才是真正的邊界：以編輯者身分登入
  或由作者確認兩層是否一致。

## 將介面卡隨附於你自己的外掛程式中

將你的 `add_filter()` / `add_action()` 呼叫放在**你的**外掛內的單一檔案中，並
無條件要求：

```
my-plugin/
└── includes/minimal-admin.php   ← all your minimal_admin_* filters live here
```

不需要 `class_exists( 'Minimal_Admin' )` 防護：未安裝 Minimal 時，篩選器會
根本不會套用，因此整合功能可免費停用。安裝兩個外掛的使用者會獲得
整合會自動完成：不需設定，也不需發布配套外掛。

Minimal 僅在 `includes/adapters/` 中為不知悉相關資訊的熱門外掛綁定介面卡
Minimal：Gravity Forms、ACF、Redirection 以及分析提供者。如果您是
整合外掛時，改為隨外掛一併提供轉接器；[Anchor Blocks](https://github.com/anchorhost/anchor-blocks)
會在 `app/MinimalAdmin.php` 中完全做到這件事。

描述器中的標籤與說明字串由你負責：請透過 `__()`，並使用你自己的
文字網域（若你的外掛已翻譯）。Minimal 會原樣渲染它們（已跳脫，絕不解析）。

## 使用 AI agent 建置

描述元契約特別適合代理式編碼：它是宣告式的，經過驗證
即時，並可在瀏覽器中驗證。如果你要使用 AI 編碼工具整合外掛，
提供三樣東西給它（本文件、[the shim tutorial](shim-tutorial.md)，以及
[example plugin](examples/minimal-example-adapter/minimal-example-adapter.php)），並告訴它
完成后，根据 Integrations 卡（`/minimal-admin/system`）进行验证。该
範例外掛也可作為已知正確的參考，讓代理程式能與其比對工作成果。

## 相容性

下方 [hook reference](#hook-reference) 中的 hooks，以及描述元鍵
本頁記錄的內容，就是 Minimal 的整合契約。其目的是讓它變更
很少見，而且是附加式的：

- 新的 hooks 與描述元索引鍵可能會在任何版本中出現；已記錄的索引鍵會保留其
  意義。
- 如果已記錄的 hook 或 key 必須變更，舊形式仍會持續運作一段
  棄用期間，而變更會在變更日誌中註明。
- 你在 Minimal 內建 adapters 中找到、但本頁未列出的 key 均屬內部項目，可能會
  恕不另行通知。如果你需要一個，請提出議題，以便將其記錄並
  在此穩定下來。
- 宣告已安裝的 Minimal 尚未認識的金鑰是安全的：呈現器會忽略
  未知的鍵（該功能在該安裝環境中會直接缺席），以及 Integrations 卡片
  可能會將其標示為未知。不需要版本偵測：降級就是設計的一部分。

## 整合禮儀

WordPress 管理介面在注意力競爭中敗下陣來：通知變成橫幅，選單變成
看板，而且每個外掛都學會大聲喊叫，因為喊叫有效。Minimal 的答案是
架構，而不是要求你遵守的政策文件。值得了解
完整的执行机制集中在一处，因为它改变了良好整合应有的样貌
例如：

- **驗證器會阻擋或降級位置抓取。** 沒有
  收件匣形狀的集合會出現在 Tools 中。超過 3 個導覽位置會合併為一個。更多
  每個命名空間超過 3 個預設斜線項目後會變成僅供搜尋。每次介入都
  显示在 Integrations 卡上，并归属于您的插件。
- **由 Minimal 負責呈現。** Descriptor 是資料；你的 HTML、CSS 和 JS 絕不會抵達
  文件。沒有要注入的橫幅、沒有要重新設定樣式的按鈕，也沒有要固定的通知。
  站外連結一律會以 ↗ 顯示，並列在 Integrations 卡片上，因此
  追加销售绝不能看起来像应用程式操作。
- **使用者擁有最終決定權。** 每個介面、面板、設計程式庫和斜線
  命名空間可依使用者隱藏；重新註冊後，隱藏狀態仍會保留，而且
  沒有 API 可以偵測或抵抗它。

結果是：標籤用於命名，而非行銷。以其功能命名的介面
這樣做，一張回報狀態的狀態卡，以及一個精心選擇的預設插入項目，就會
保留；促銷標籤、像催促般的介面和注意力氾濫會被降級，
已摺疊，或被你想聯絡的人隱藏。這裡的注意力是靠贏得的，
而且每個人的預算都相同。

## 使用者可以隱藏你的整合

自 v0.17.0 起，每個整合點都可以由使用者在 Minimal 自有介面中隱藏，並且
還原功能位於你的個人檔案：

- **介面**：以滑鼠右鍵按一下側邊欄列 → **對你隱藏**。
- **編輯器面板**：在編輯器側邊欄中，以滑鼠右鍵按一下該面板的入口。
- **設計程式庫**：在區塊選擇器中，以滑鼠右鍵按一下程式庫的群組標題。
- **斜線命名空間**：在區塊選擇器中，以滑鼠右鍵按一下命名空間的群組標題。
  這會在所有供編輯器選單使用的地方隱藏命名空間：可自動插入的
  區塊、`insert` 範本、區塊樣板和命名空間編輯器指令都會
  一起完成。檢查器表單仍會保留，因此現有區塊仍可編輯。

隱藏是每位使用者的選擇：重新載入頁面及外掛程式重新註冊後，仍會保留此設定，
而且沒有 API 可以偵測或抵抗它。請據此設計。某個整合若
值得保留其位置；任何搶奪注意力的內容都會被隱藏，而該
描述元模型沒有任何方法可以要求取回它。

## 注意力預算

自 v0.17.0 起，放置與數量限制由驗證器強制執行，並且
用戶端，而不是依慣例處理。任何內容都不會被捨棄；溢位會降級為較安靜的
表單：

- **工作區位置**需要類似收件匣的集合（至少一個 `ago`
  欄）。宣稱有 `group: 'workspace'` 卻沒有一個的介面會顯示在 Tools 下，
  而 Integrations 卡片會標示它。
- **導覽插槽**：單一外掛最多只能擁有 **3** 個。超過後，你的無系列介面
  合併為單一導覽項目（以及單一 ⌘K 調色盤資料列），並使用相同的切換器
  用户已经从提供者系列中熟知的内容。声明真实 `family` 的界面
  保留它；一個系列已經是一個折疊位置。
- **預設斜線選單**：未篩選的
  `/` 選單，依註冊順序計算（先是編輯器命令，接著是區塊 `insert`
  範本）。溢出的項目會變成僅供搜尋：使用者一
  類型，完全如同可自動插入的區塊，而區塊選擇器（Browse all）始終
  會顯示所有內容。

如果你的整合需求超出預算限制，這就是應該
整合：一個包含 `views` 的介面、一個開啟你自己畫面的指令、一個
精心选择的默认插入内容。无论哪种方式，预算都是按插件计算；注册更多
不會換來更多注意力。

## 外部連結一律會標示

自 v0.17.0 起，描述元提供的每個連結（動作 `href`、狀態卡動作、
`setup.href`）會在新分頁開啟，且任何主機與網站本身不同的連結
會以 ↗ 功能提示呈現。Minimal 會在呈現時加入標記；你無法選擇停用，
而已經以 ↗ 結尾的標籤會保持原樣。同網站連結（wp-admin 深層連結，
您自己的 REST endpoints）保持未标记：它们是诚实的应用程式跳转，而不是退出点。

描述元本身所帶的站外 href 也會按介面列在
系統頁面的整合項卡片，標示為你的外掛程式。該清單
僅供資訊參考，不是契約問題：連結至你自己的文件或供應商畫面
是合理的模式。它的存在是為了讓站外連結絕不會隱藏在介面中
未被注意到。您的路由在运行时返回的链接（状态卡响应）无法被标记
那裡，但渲染時同樣會套用 ↗ 處理。

簡單說：標籤用於命名，而非行銷。離開該
網站看起來始終像一個整體。

## Descriptor 參考

只有三項內容不可或缺：`label`、`collection.route` 和 `collection.columns`
（每個欄位都需要 `key` 與 `label`）。此頁面的其他內容都是選用的，並且
具附加性：從 quick start 的結構開始，再逐步擴充。標示版本的鍵
在該版本中加入；未標記的索引鍵自 API 發布以來一直保持穩定。

### 頂層

| Key | 含义 |
|---|---|
| `label` | 側邊欄標籤和頁面標題 |
| `sub` | 副標題徽章（通常是您的外掛程式名稱） |
| `icon` | Minimal 圖示集中的圖示名稱 — 完整清單位於下方的 [Icons](#icons)。未知名稱會呈現空白圖示，因此請從清單中複製 |
| `cap` | 所需的功能權限。在伺服器端檢查；沒有該權限的使用者不會在應用程式中看到此介面。具有自行存取模型的外掛程式則在 shim 內進行存取控管 — 請參閱 [Capability patterns](#capability-patterns) |
| `collection` | 清單定義（如下）。當介面宣告 `settings` 時可省略：僅設定介面會將其設定檢視呈現為整個頁面（適合沒有清單可顯示的設定型外掛程式；隨附的 Perfmatters 介面卡就是範例） |
| `family` | 用於執行相同工作的介面群組 ID（`forms`、`mail`、`redirects`、`activity-log`、`snippets`、`backups` 或您自訂的群組）。同一家族的介面會共用一個側邊欄項目，頂端列徽章中提供提供者切換器；系統會依家族記住使用者的選擇 |
| `group` | 側邊欄位置。接受兩個值：預設的 **`"tools"`**（日誌、重新導向、程式碼片段：網站基礎功能）和 `"workspace"` — 用於收件匣形式的介面，使用者每天都會檢查，因為新項目需要人工處理（表單項目是隨附範例）。自 v0.17.0 起，這項規則會強制執行，而非僅提出要求：workspace 需要包含具有 `ago` 欄位的集合（按時間排序的資料流）；其他內容會放在工具下方，Integrations 卡片也會如此說明 |
| `manage` | 可選的**第二個**集合（形狀與 `collection` 相同）。在清單上方新增檢視切換器；每個集合的 `viewLabel` 會命名其分頁。當您的介面恰好有一個自然的搭配檢視時使用，例如項目及產生項目的事物（Gravity Forms：Entries／Forms）。需要超過兩個？這就是 `views` 的用途 |
| `views` *（v0.13）* | 可选的、超出 `collection` 和 `manage` 的**更多**列表 view：一个集合的**array**（形状与 `collection` 相同），每个集合都需要一个 `viewLabel` 来命名其 switcher tab。条目可以带有自己的 `cap`，以比界面更严格地限制该 view（真正的闸门仍是您路由的 `permission_callback`）；用户看不到的条目，或缺少 `route`／`viewLabel` 的条目，会在服务器端被丢弃。View 会在 switcher 中的 `manage` 之后渲染，并支持完整的集合词汇（tabs、search、filter、detail、actions、bulk、create）。内置的 Gravity SMTP adapter 使用其中一个来显示其 Debug log |
| `status` *（v0.10；`chart` v0.13）* | 列表上方的可选状态卡：`{ "route": "your/v1/status" }`。该路由返回服务器构建的显示模型（如下），因此您的 adapter 在服务器端格式化值，而客户端保持通用 |
| `setup` *（v0.12）* | 可选的一次性设定闸门（如下）。当您的插件仍需要自己的首次运行安装时，界面会显示设定卡而非集合，而 "Set up now" 会在服务器端运行您的安装程式 |
| `settings` *（v0.12）* | 可选的设定 view（如下）：由 schema 驱动的 tabs 通过您自己的路由提供，由 Minimal 的 form engine 渲染，并通过您插件自己的 settings APIs 保存回去。在 view switcher 中新增 Settings 项目 |

### 圖示

標準集合（未知名稱會呈現空白；沒有備用字形）：

`activity` `arrow-up-right` `bell` `block` `bold` `braces` `bug` `cart` `chat` `check`
`chev` `clipboard` `clock` `code` `columns` `copy` `cpu` `database` `doc` `eraser` `file`
`focus` `gallery` `gear` `globe` `grid` `grip` `h2` `h3` `help` `img` `inbox` `italic`
`key` `link` `list` `logout` `minus` `monitor` `moon` `olist` `php` `pilcrow` `play`
`plug` `plus` `power` `quote` `refresh` `search` `send` `server` `shield` `shuffle`
`strike` `sun` `table` `tag` `toc` `trash` `undo` `upload` `users` `warn` `wp` `wrench` `x`

此清單與 `assets/js/app.js` 中的 `icon()` 對應；編輯器斜線命令接受
相同的名稱（或單純的短字形字串）。

### Capability 模式

所有隨附介面卡都涵蓋在兩種模式中：

1. **一般 capability。** `cap` 會指定 WordPress capability，而你的路由
   `permission_callback` 會檢查相同的項目（透過一個共用 helper，因此它們無法
   偏移）。當核心上限確實建模出誰可以查看資料時，才使用 Right。
2. **介面卡端閘控。** 某些外掛有自己的存取模型，沒有任何單一
   權限所表達的是：Gravity Forms 管理員擁有 `gform_full_access`，而不是
   更細緻的權限，WP Activity Log 有「僅自己／僅管理員」設定。在那裡，宣告一個
   刻意寬鬆的 `cap`（`'read'`），讓介面能觸及應用程式，並讓你的
   路由的 `permission_callback` 呼叫外掛自己的解析器
   (`GFCommon::current_user_can_any( … )`, `Settings_Helper::current_user_can( 'view' )`).
   路由是邊界；描述元上限僅負責 UI 控制。

切勿檢查外掛實際上透過某個功能授予的原始細粒度權限
解析器：使用者可以透過解析器持有存取權，即使未通過原始檢查。

### `setup` — 一次性設定閘門

![A setup gate: icon, title, note, option switches and a Set up now button in place of the list](img/setup-gate.png)

某些外掛程式需要首次執行安裝後才能運作（Redirection
會在設定精靈中建立其資料表和預設群組；在此之前每個
写入失败）。声明 `setup` 可让界面保持诚实：在设定过程中
需要時，集合、建立和動作都無法存取，使用者會看到
在其流程中提供設定卡片，而不是顯示原始的外掛程式錯誤。

```php
'setup' => array(
    'needed'  => function () {                       // truthy = gate the surface
        return my_plugin_needs_install();            // keep it cheap: runs on app boot
    },
    'title'   => 'My Plugin needs its one-time setup',
    'note'    => 'What the setup does, in a sentence or two.',
    'options' => array(                              // optional: your wizard's questions
        array( 'id' => 'monitor', 'label' => 'Monitor permalink changes', 'default' => true ),
        array( 'id' => 'ip',      'label' => 'Store IP addresses',        'default' => false ),
    ),
    'run'     => function ( $choices ) {             // $choices: id => bool
        return my_plugin_install( $choices );        // true or WP_Error
    },
),
```

規則：

- `needed` 會在每次載入應用程式時執行，因此請限制其用途為讀取選項。擲出例外的
  檢查會顯示為不需要：損壞的閘門永遠不會使正常運作的介面失效。
- `run` 必須經由**您外掛程式自己的安裝程式**處理，絕不能使用重新建置的
  它的副本。它會以布林值接收切換選項（未宣告的 id 會
  被捨棄，缺少的項目會取得你宣告的預設值），並在背後執行
  介面自身的 `cap`，透過 `POST minimal-admin/v1/surfaces/{id}/setup`。
- Options 是設定精靈提問內容的地方。預設的隱私相關
  選項（IP 記錄、遙測）設為關閉；Minimal 不會替你做出這些選擇
  靜默地。
- Minimal 確實無法直接執行的設定（例如外部驗證流程）可以
  宣告 `href` 而不是 `run`；卡片會呈現誠實的外連，並
  當你的設定將自身標記為完成後，介面就會開始運作。

### `status` — 清單上方的卡片

![A status card: three stat rows with hints and a 14-day bar chart](img/status-card.png)

對於僅查看清單無法完整說明情況的介面（Disembark 的 Backups
view 是参考实现），声明 `status.route` 并返回：

```json
{
    "rows": [
        { "label": "Last scan", "value": "3 hours ago", "hint": "142,318 files · 2.1 GB" }
    ],
    "command": {
        "label": "Back up from any terminal",
        "text": "disembark connect https://example.com abc123…",
        "hint": "Requires the Disembark CLI."
    },
    "actions": [
        { "label": "Clean up working files", "route": "your/v1/cleanup", "method": "POST", "confirm": "Really?", "danger": true },
        { "label": "Open Disembark ↗", "href": "https://example.com/wp-admin/tools.php?page=disembark" }
    ]
}
```

`rows` 會呈現為統計列（傳送可直接顯示的字串；在伺服器端格式化）。
`command` 會呈現為可點擊複製的等寬字型方框；若沒有則省略
沒有任何可複製的內容。`actions` 會呈現為按鈕：搭配 `route` 時會 POST（或
`method`），並在成功時重新擷取狀態和清單，`confirm`
會先顯示原生確認提示，`danger` 會將按鈕設為紅色，而 `href`
會呈現普通的新分頁連結，而不是請求。動作可以宣告
`fields`（建立欄位詞彙）變為參數化：按鈕
會替換為內嵌表單，並將值合併至請求本文
（「Send a test email」搭配地址欄位的是內建的 Gravity SMTP
參考）。省略任何不需要的索引鍵；條件式動作只是
您的路由未放入回應中的動作。

選用的 `chart` 會在各列下方繪製精簡的長條序列（相同的視覺
語言，例如 Overview 流量／活動圖表）。形狀：

```json
{
    "title": "Last 14 days",
    "primary": "Sent",
    "secondary": "Failed",
    "points": [
        { "label": "Jul 1", "value": 5, "secondary": 1 },
        { "label": "Jul 2", "value": 3, "secondary": 0 }
    ]
}
```

`points` 為必要項目（為空時略過此鍵）。`label` 已可直接顯示；
`value` 是實心列和第一個提示列。當存在 `secondary` 時
在圖表上（或任何資料點上），列會變成雙重列：柔和的總計列
（`value + secondary`）位於實心主要列後方，提示列則以其名稱命名
`primary` / `secondary`（預設為「Count」／「Other」）。單序列圖表
省略 `secondary`，每個資料點呈現一條強調色列。內建的 Gravity
SMTP 介面卡是參考實作（每日寄送／失敗資料來自其事件資料表）。

### `settings` — 由結構描述驅動的設定檢視

![A settings view: schema tabs, text/number/select fields with help text, a toggle revealing a dependent field, and a locked count with the wp-admin escape](img/settings-view.png)

你的外掛程式設定由 Minimal 根據你的路由在以下位置提供的結構描述呈現
執行階段。宣告分頁和一個路由；Minimal 會使用相同的方式繪製表單
支援建立／編輯表單與編輯器面板的欄位引擎，因此當你的
外掛新增欄位後，涵蓋範圍會自行更新，無需 Minimal 發行新版本：

```php
'settings' => array(
    'label' => 'Settings',                 // view-switcher label (default "Settings")
    'cap'   => 'manage_options',           // optional: hides the VIEW from users
                                           // without the capability (the surface
                                           // itself may be readable more widely);
                                           // your route's permission_callback is
                                           // the real write gate
    'tabs'  => array(
        array( 'id' => 'general', 'label' => 'General' ),
        array( 'id' => 'logging', 'label' => 'Logging' ),
    ),
    'route' => 'my-plugin/v1/minimal-settings/{tab}',
),
```

此路由為每個分頁實作一份契約：

- `GET {route}` 在一個回應中傳回結構描述和目前值：

```json
{
    "groups": [
        {
            "title":  "Sending",
            "fields": [
                { "key": "from_name", "label": "From name", "help": "Shown on outgoing mail." },
                { "key": "retention", "label": "Retention (days)", "type": "number", "min": 1 },
                { "key": "mode",      "label": "Mode", "type": "select", "options": [ ["digest", "Daily digest"], ["instant", "Instant"] ] },
                { "key": "enabled",   "label": "Advanced routing", "type": "toggle" },
                { "key": "route_url", "label": "Routing URL", "mono": true, "showWhen": { "key": "enabled", "equals": true } }
            ],
            "locked": 2
        }
    ],
    "values":   { "from_name": "Minimalow", "retention": 30, "mode": "digest", "enabled": false },
    "adminUrl": "https://example.com/wp-admin/admin.php?page=my-settings"
}
```

- `POST {route}` 會接收包含**僅有那些鍵**的 `{ "values": { … } }`
  用户实际编辑过**，并返回相同结构的新鲜数据。返回一个
  `WP_Error` 來拒絕儲存；訊息會顯示為 toast，而表單
  保留已輸入的內容。

欄位使用共用的表單詞彙：`key`、`label`、`type`（`text` 預設 ·
`textarea` · `number` · `select`（呈現為 Minimal 主題化、可搜尋的
下拉式選單，絕不使用原生選取彈出視窗）· `combobox`（主題化的自動完成元件，基於
`options`，長目錄靠右）· `toggle` · `email` · `url`），`options`
（`[value, label]` 配對）、`placeholder`、`help`（呈現在控制項下方），
`rows`、`min`/`max`、`mono`，以及 `showWhen: { "key": …, "equals": … }`（
行只會在控制欄位持有該值時顯示，並即時評估
使用者編輯時）。群組的 `locked` 計數會顯示「N 個進階設定 —
對於過於客製化而無法呈現的內容，請透過 `adminUrl` 使用「在 wp-admin 中編輯 ↗」
以通用方式。

使用規則：

- 由於只有編輯過的金鑰會隨儲存操作傳送，未變更的值永遠不會往返
  透過你的清理器。
- **機密資訊**：以可辨識的替代值遮罩提供，並跳過
  当 sentinel 随响应返回时写入（Gravity SMTP 的 `****************`
  語意）。使用者碰過但保持遮罩的欄位絕不能覆寫
  儲存的密鑰。
- 透過外掛程式的**自有**設定 API 進行讀取與寫入，位於
  路由，因此常數鎖定、加密和驗證語意都由你負責。
- 介面可以是**僅限設定**：完全省略 `collection`，而
  設定檢視呈現為完整頁面，不含檢視切換器。如果你的
  外掛透過核心 WP Settings API 註冊其選項，內建
  Perfmatters adapter 是讀取該 registry 的參考實作，作為
  在執行階段使用結構描述，而不是手動複製欄位。
- 設定可以是**項目範圍**：包含 `{id}` 的 `route` 會呈現
  每個項目各自的設定檢視，而不是全域設定檢視。Settings 分頁會讓
  view switcher（目前还没有可渲染的项目），并且从一个入口进入
  行改為宣告動作 `{ "label": "Form settings",
  在其列項擁有設定的清單上使用 `"settingsItem": true }`，並且
  點擊它會開啟該資料列的設定檢視（{id} 和 {tab} 都
  代入路由；工具列會以該名稱顯示項目）。內建的
  Gravity Forms 介面卡是參考實作：其 Forms 檢視中的資料列會開啟每個
  表單本身的設定，結構描述則從 Gravity Forms 的 Settings
  在請求時執行的框架。

### `collection`

| Key | 含义 |
|---|---|
| `route` | 清單的 REST 路由。可包含 `{tab}`（替換為目前使用中的分頁值） |
| `allRoute` | 當 `route` 包含 `{tab}` 時，用於「All」分頁的路由 |
| `query` | 附加到每個請求的額外查詢字串（排序等） |
| `pageQuery` | 分頁範本，預設為 `per_page=25&page={page}`。`{page}` 為從 1 開始；對使用從 0 開始 API 的情況（Redirection）使用 `{page0}`。使用您 API 自有的樣式，例如 Gravity Forms 的 `paging[page_size]=25&paging[current_page]={page}` |
| `itemsKey`／`totalKey` | response body 中 items／total 所在的位置。标准 WP 集合（纯 array + `X-WP-Total` header）可省略两者 |
| `tabs` | 可以是 `{ "route": "...", "valueKey": "id", "labelKey": "title" }`，透過 REST 呼叫建立分頁；也可以是 `{ "param": "status", "static": [["sent","Sent"],["failed","Failed"]] }`，用於作為查詢參數傳送的固定分頁。`allLabel` 指定第一個分頁 |
| `viewLabel` | 在檢視切換器中（搭配 `manage`）以及搜尋提示文字中為此集合命名 |
| `columns` | `{ key, label, format, altKey, width, utc }` 的陣列。`key` 支援點號路徑（`initiator_data.user_login`）；`altKey` 是主要鍵為空時讀取的備用鍵。格式：`title`、`text`（預設）、`pill`、`ago`、`mono`、`num`（數值靠右對齊）、`entry-summary`（適用於答案位於數字欄位 ID 鍵下的表單輸入列：將前幾個答案值呈現為該列摘要 — 請參閱任何隨附表單介面卡的清單）。`width` 會覆寫欄位的網格寬度；預設值依格式決定。對於 `ago`，未指定時區的日期時間會以網站本地時間解析：對儲存為 UTC 的時間戳記設定 `utc: true`（或使用以 `_gmt` 結尾的鍵，或輸出尾隨的 `Z`）。自 v0.18.0 起，欄位也可以包含 `sort`：您的路由針對該欄位所理解的 `{by}` token（請參閱下方的 `sortQuery`）。沒有 `sort` 的欄位會保留純文字標頭；若沒有任何排序選項，清單順序會維持您的路由回傳的順序，因此請在 `query` 中宣告預設值（慣例為最新項目優先） |
| `detail` | 詳細資料彈出視窗設定：`detailRoute`（依 `{id}` 擷取完整項目）、`sectionsRoute`（由伺服器建立的顯示模型，是下方 `detailRoute` + `labels` 的替代方案）、`labels`（將數字欄位 ID 鍵解析為人類可讀標籤 — 每個表單欄位的情況：`{ "route": "your/v1/forms/{form_id}/fields", "valueKey": "id", "labelKey": "label", "itemsKey": "fields" }`。路由中的 `{placeholders}` 會從項目填入，Minimal 將回應陣列中的 `valueKey` → `labelKey` 進行對映 — 或對其中的 `itemsKey` 進行對映 — 並依路由 URL 快取對映。固定結構項目會完全略過 `labels`：蛇形命名回應鍵已可直接呈現為文字）、`messageKey`（將單一欄位呈現為大型文字區塊 — HTML 訊息會在沙盒 iframe 中呈現，純文字則在 `<pre>` 中呈現）、`skip`（要隱藏的鍵）、`edit`（內嵌編輯，見下文） |
| `actions` | 詳細資料彈出視窗中的按鈕，以及清單列的 ⋯／右鍵選單：`{ label, method, route, body, confirm, danger, when, href, fields, settingsItem, list }` — 下方的 [the `actions` section](#collectionactions--verbs-on-rows-and-in-the-detail-modal) 會逐一說明每個鍵 |
| `sortQuery` | *（自 v0.18.0 起）* 包含 `{by}` 和 `{dir}` 的 query-string 模板（例如 `orderby={by}&direction={dir}`）。带有 `sort` token 的栏位会渲染为可点击标题：第一次点击进行排序（numeric 和 `ago` 栏位从降序开始，其余均为升序），再次点击会反转方向，并将模板附加到列表请求中。省略该项后，标题会保持为纯文字 |
| `search` | 包含 `{q}` 的 query-string 模板（例如 `filterBy[url]={q}` 或 `search={q}`）。在工具列新增 filter box；该词组会进行 debounce，并附加到列表请求中。对于将搜寻条件作为 JSON 字串的 API（Gravity Forms），请使用 object form：`array( 'param' => 'search', 'json' => <criteria array with '{q}' where the term goes> )`——该词组会进行 JSON-escape，而 criteria 会进行双重 URL 编码，以符合会自行 `urldecode()` 该参数的 API |
| `filter` *（v0.12）* | `tabs` 旁边的第二个列表维度，以 segmented control 呈现——形状及 json-merge 规则见下方的 [the `filter` section](#collectionfilter--a-second-dimension-beside-tabs) |
| `bulk` | 批次操作：形狀與 `actions` 相同，但不含 `href`（批次操作一律需要 `route`）。宣告任何批次操作後，會新增核取方塊欄（支援 Shift 範圍選取及「Select page」）和選取工具列。每個操作都會**針對每個選取的項目分別執行**（替換 `{id}`；單一失敗不會中止其餘操作），`when` 會逐項評估，因此混合選取時會略過不符合資格的列；若按鈕的 `when` 在目前頁面沒有任何符合項目，按鈕將完全不顯示；結果提示會回報已完成／已略過／失敗 |
| `create` | 新增「Add」按鈕及表單彈出視窗。`{ label, route, method, fields, defaults }` — `fields` 是 `{ key, label, mono, type, value, placeholder, rows, options, required }`（支援點號路徑鍵，例如 `action_data.url`）；`defaults` 會合併到輸入值下方，因此固定欄位（群組、比對類型）也會一併傳送。欄位類型：`text`（預設）、`number`、`textarea`（`rows` 可設定其高度）、`select`（以 `options` 作為 `[value, label]` 配對）、`tags`（以逗號分隔輸入，提交為陣列）、`email`、`url`。除非欄位宣告 `required: false`，否則所有欄位皆為必填。建立失敗時（您的路由回傳 `WP_Error`），會顯示您的錯誤訊息，並保留表單中的輸入內容 |

![A detail modal from detailRoute: key/value rows, the messageKey block, prev/next stepping and action buttons (the off-site one marked ↗)](img/detail-modal.png)

### `collection.actions` — 列上和詳細資料模態視窗中的動詞

每個動作都是 `{ label, method, route, body, confirm, danger, when, href, fields,
settingsItem, list }`：

- **`route`** — `{id}` 會替換為項目 ID；`method` 預設為 POST（DELETE 為
  即可；多個內建轉接器使用它進行永久移除）；`body`
  合併至請求中。該路由可能回傳 `{ "message": "…" }` 以取代
  預設的「⟨label⟩ — 完成」提示，是標籤無法
  承諾（內建的 Gravity SMTP 測試傳送功能會回報另一個使用中的郵件程式
  實際執行傳送）。
- **`confirm`** 會先顯示原生確認提示；**`danger`** 會將按鈕設為紅色。
- **`when: { key, equals }`** 只會在項目的欄位符合
  （Activate 與 Deactivate；Mark-read 僅在未讀時顯示）。
- **`href`** 會呈現一般連結，而不是觸發請求；`{field}` 預留位置
  從項目填入。連結會在新分頁中開啟，而 href 只要離開網站就一定
  會以 ↗ 功能提示呈現（請參閱 [External links are always marked](#external-links-are-always-marked)）。
- **`fields`** *(v0.12)* 會使動作**參數化**：按一下即可替換按鈕
  行，用於內嵌表單（建立欄位的詞彙；除非
  `required: false`），且類型化的值會在此之前合併至 `body`（支援點路徑）
  請求觸發：「新增備註」和「傳送至 ⟨address⟩」形狀。參數化動作會保持
  **僅限詳細資料**（需要 modal 的表單外框）。狀態卡片動作接受
  `fields` 以相同方式。
- **`settingsItem: true`** *(v0.13)* 不會發送請求：它會開啟介面的
  針對列的項目範圍設定檢視（需要包含 `{id}` 的 `settings.route`；
  請參閱設定章節）。
- 每個非參數化動作也會出現在清單列的 ⋯／右鍵選單中
  （Open 一律位於第一個）；設定 **`list: false`** 以保留僅詳細動詞的形式。

### `collection.filter` — 分頁旁的第二個維度

呈現為分段控制項：`{ label, options, query }` 或
`{ label, options, param, json }`。`options` 是 `[value, label]` 組，而 FIRST 是
預設值，始終會傳送。

- 純文字形式會附加 `query`，並以 `{v}` 取代（`status={v}`）。
- json 形式會合併至與物件形式 `search` 相同的條件物件中，當
  它們共用 `param`。這正是合併的目的：Gravity Forms 會取得狀態和欄位
  將篩選器放在單一 JSON `search` 參數中，兩個獨立的寫入器會互相覆寫
  彼此。
- 將篩選器與受 `when` 控制的動作配對，讓每個篩選器檢視都能提供實用的操作
  那裡的意義（Received：Spam / Trash · Trash：Restore / Delete permanently）。

### 頁面與模態視窗

Minimal 的規則：決定記錄何時取得詳細資料對話框，以及何時獲得包含其
自己的 URL：模態視窗用於快速查看（讀取記錄、執行快速動詞、關閉）；記錄
當它擁有自己的子資源或工作流程，或有值得分享的 URL 時，就應擁有一個頁面
与团队成员一起。WooCommerce 订单就是先例：位于 `/orders/{id}` 的订单页面
承載完整的操作介面（項目、付款、退款、電子郵件、備註、相關訂單）
而 Quick view 仍作为 modal，用于从列表中一键查看。两种呈现方式
共用一個詳細內容區塊，因此兩者不會產生偏差。

Plugin surfaces 預設會使用模態視窗。項目、日誌列和套件會
以概覽為導向，而 `sectionsRoute` 詳情及列動作涵蓋這些內容；一個介面
其记录确实包含子资源的，应链接到自己的画面（该
`href` 動作），而不是在模態視窗中模擬頁面。如果 Minimal 之後提升一個
將介面細節呈現給實際頁面時，依據的會是相同測試，而不是受歡迎程度。

### `detail.edit` — 詳細資料模態視窗中的行內編輯

讓使用者直接編輯項目的欄位，並透過你外掛程式自己的更新端點儲存：

```php
'detail' => array(
    'edit' => array(
        'route'    => 'redirection/v1/redirect/{id}',   // update endpoint; {id} replaced
        'method'   => 'POST',                            // default POST
        'preserve' => array( 'match_type', 'group_id' ), // untouched fields sent along so
                                                         // your sanitizer doesn't reset them
        'fields'   => array(
            array( 'key' => 'url', 'label' => 'Source URL', 'mono' => true ),
            array( 'key' => 'action_data.url', 'label' => 'Target URL', 'mono' => true ),
            array( 'key' => 'action_code', 'label' => 'HTTP status', 'type' => 'number' ),
        ),
    ),
),
```

每個欄位都是 `{ key, label, mono, type }`：`key` 支援點號路徑（`action_data.url`
讀取及寫入 `{ "action_data": { "url": … } }`），`mono` 會呈現等寬字型輸入欄位，並
`type: "number"` 傳送數值。編輯欄位接受與 `create` 相同的詞彙
欄位（`textarea`、`select` 搭配 `options`、`tags`、`rows`、`placeholder`）：兩者都會呈現
透過相同的表單引擎。以輸入欄位顯示的欄位會從靜態
詳細資料列。內建的 Redirection 配接器是參考實作。

### `detail.sectionsRoute` — 由伺服器建置的詳細資料檢視

除了 `detailRoute` + `labels`，你的端點也可以在
一個回應，標籤已在伺服器端解析完成。`sectionsRoute`（搭配 `{id}`）
必須回傳：

```json
{
    "kind": "entry",
    "sections": [
        { "title": "Response",   "rows": [ { "label": "Email", "value": "dana@example.com", "type": "email" } ] },
        { "title": "Submission", "rows": [ { "label": "Date",  "value": "2026-07-09 14:02" } ] }
    ],
    "adminUrl": "https://example.com/wp-admin/admin.php?page=…"
}
```

`kind` 選擇版面配置：`"entry"` 呈現聯絡人樣式的表單輸入檢視（姓名和
電子郵件主視覺、訊息本文、低調中繼資料），`"activity"` 會呈現稽核事件檢視（執行者、
事件訊息、內容標籤）。若只是單純的群組索引鍵／值檢視，請省略它。`adminUrl`
連結至項目的 wp-admin 畫面，並抑制任何指向該畫面的 `href` 動作
相同位置。內建的 Gravity Forms 配接器（entries）和 WP Activity Log 配接器
（events）是參考。

資料列的 `type` 會決定其值的呈現方式（僅限一般群組配置；`entry`
而 `activity` 卡片有自己的結構）。自 v0.18.0 起，詞彙如下：

| `type` | 呈現為 |
|---|---|
| *（省略）* | 一般值；多行或较长值会堆叠在标签下方 |
| `url` | 在新分页开启的 link（仅限 `https?://` values） |
| `email` | 一个 `mailto:` link |
| `pill` | 使用 Minimal 共用状态词汇的 status pill（`sent`、`failed`、`active`、`locked`、……） |
| `code` | 經跳脫處理的等寬字型區塊（標頭、原始負載、堆疊追蹤）；超過約 14 行後可捲動檢視 |
| `html-preview` | 您的 HTML 會在完全沙盒化的 iframe 中呈現（無腳本、來源不透明）— 這是顯示電子郵件本文或已呈現範本的可靠方式。HTML 絕不會接觸 Minimal 的 DOM |
| `kv-table` | 雙欄鍵值表格。`value` 可以是物件對映、由 `[key, value]` 配對組成的陣列，或由 `{ "label", "value" }` 物件組成的陣列；上限為 60 列 |

值一律經過轉義；`html-preview` 是標記語法呈現的唯一位置，並且
僅在沙盒內。

## 讓您的表單外掛成為一級 Forms 提供者

表單外掛程式正是此 API 的設計對象，因此它們會獲得額外的機制，以便
免費。以下是內建表單轉接器使用的確切結構（Gravity Forms、
Ninja Forms、Forminator、Formidable、Fluent Forms、透過 Flamingo 和 CFDB7 的 CF7）：

![The contact-card entry detail: sender hero, message block, labeled answers, submission meta line and entry actions](img/entry-detail.png)

```php
$surfaces['driftwood'] = array(
    'label'      => 'Forms',
    'sub'        => 'Driftwood',
    'icon'       => 'inbox',
    'cap'        => 'read',            // adapter-side gating: your routes check your own access model
    'family'     => 'forms',           // join the Forms provider switcher
    'group'      => 'workspace',       // entries are inbox-shaped
    'collection' => array(
        'viewLabel' => 'Entries',
        // Dynamic per-form tabs: {tab} in the route + an All route.
        'route'     => 'driftwood/v1/forms/{tab}/entries',
        'allRoute'  => 'driftwood/v1/entries',
        'tabs'      => array(
            'route'    => 'driftwood/v1/forms',   // one tab per form
            'valueKey' => 'id',
            'labelKey' => 'title',
            'allLabel' => 'All forms',
        ),
        'itemsKey'  => 'items',
        'totalKey'  => 'total',
        'search'    => 'search={q}',
        'columns'   => array(
            // Answers live under numeric field-id keys → entry-summary.
            array( 'key' => 'id', 'label' => 'Entry', 'format' => 'entry-summary' ),
            array( 'key' => 'form_title', 'label' => 'Form' ),
            array( 'key' => 'created', 'label' => 'Date', 'format' => 'ago', 'utc' => true ),
        ),
        'detail'    => array( 'sectionsRoute' => 'driftwood/v1/entries/{id}/view' ),
        'actions'   => array(
            array( 'label' => 'Mark as spam', 'route' => 'driftwood/v1/entries/{id}/spam', 'when' => array( 'key' => 'status', 'equals' => 'active' ) ),
            array( 'label' => 'Export CSV ↗', 'href' => 'https://example.com/wp-json/driftwood/v1/forms/{form_id}/export?token={export_token}' ),
            array( 'label' => 'Delete', 'route' => 'driftwood/v1/entries/{id}', 'method' => 'DELETE', 'confirm' => 'Delete permanently?', 'danger' => true ),
        ),
    ),
    'manage'     => array(
        'viewLabel' => 'Forms',
        'route'     => 'driftwood/v1/forms',
        'columns'   => array(
            array( 'key' => 'title', 'label' => 'Form', 'format' => 'title' ),
            array( 'key' => 'entry_count', 'label' => 'Entries', 'format' => 'num' ),
        ),
    ),
);
```

逐項說明：

- **`family: 'forms'`** — 請宣告它。同系列介面會共用一個側邊欄項目，並
  頂端列徽章中的 provider switcher，且會依系列記住使用者的選擇。
  與 Gravity Forms（或任何其他外掛）共存就是如此：你的外掛會成為其中一個
  單一 **Forms** 導覽項目下的提供者，絕不新增第二列側邊欄項目。
  系列也會自動將項目詳細資料切換為聯絡人卡片版面（如下）。
- **動態分頁**會在路由中搭配 `{tab}`：分頁路由會回傳你的表單
  （陣列，或任何值為表單的物件），`valueKey` 會填入 `{tab}`，
  `labelKey` 命名分頁，而 `allRoute` 提供 All 分頁。（靜態 `param` 分頁和
  動態路由索引標籤是 `tabs` 的兩種形式；請擇一。一個狀態維度旁邊
  表單分頁正是 `filter` 的用途。）
- **`entry-summary`** 是每個表單欄位形狀的清單欄位：它會收集
  項目的值置於**數字索引鍵**下（欄位 ID：`"1"`、`"2.3"`），並將其排序
  依數值排序，並顯示前三個較短的項目（≤ 60 個字元、單行），以連接
  搭配 `·`。较长及多行答案保留在详细资料中。如果您的 id 不是数字，
  改為在每個項目上傳送現成的 `summary` 字串；它的優先級高於啟發式判斷。
- **項目詳細資料**應該是回傳 `kind: "entry"` 的 `sectionsRoute`，
  聯絡卡版面：姓名與電子郵件主視覺、訊息本文、低調的中繼資料。Minimal 選擇
  從你的區段建立主視覺與本文列：**答案**是標題類似於
  「Response」（否則使用第一個區段），**meta** 是標題類似「Submission」的那個
  （否則使用第二個）。在回答中，列的選用 `type` 是最強的提示
  （訊息本文使用 `name`、`email`、`textarea` 或 `post_content`）；沒有型別時，
  標籤（「Name」、「Email」、「Message…」）和值的形狀（看起來像電子郵件的字串、一個
  多行或 120 個以上字元的值）來決定。在項目上傳送 `form_name`，模態視窗便會
  以此命名，副標題為「Entry #id」。
- **`manage`** 是 Forms 的搭配檢視：每個表單都會使用的 Entries/Forms 切換器
  外掛所需。維持為清單（標題、項目數量，也許可透過一個啟用切換開關
  `when` 組動作）；表單**建構器**仍是您自己的 UI，並以誠實的方式連結
  一個 `href` 動作（`'label' => 'Edit form ↗'`）。Minimal 不會重新實作它。
- **Export** 是一個指向你自己的下載端點的 `href` 動作，並附有
  `{field}` 會從項目填入的預留位置（將 nonce 或簽署的 token 放入項目
  讓連結可自行授權；動作 `href`s 會以一般的新分頁連結開啟，並
  不攜帶 REST 標頭）。Minimal 沒有串流下載原語；誠實的連結是
  該模式。

[shim tutorial](shim-tutorial.md) 的 Campfire 範例就是這個配方，減去
每個表單的機制：先從表格／shim 機制開始，再加入各個部分
上述內容。若要取得完整結構的正式參考，隨附的
`includes/adapters/gravity-forms.php` 是最深層的實例。

## Hook 參考

介面是入口，但 Minimal 的完整擴充介面是這組公開
hooks，每個 hook 都有自己的下方區段或契約備註：

| Hook | 类型 | 用途 |
|---|---|---|
| `minimal_admin_surfaces` | filter | 側邊欄檢視（清單、分頁、詳細資料對話框）—上述描述項參考 |
| `minimal_admin_editor_panels` | filter | 編輯器側邊欄中的每篇文章欄位或狀態／操作面板 |
| `minimal_admin_traffic` | filter | Overview 圖表流量提供者 |
| `minimal_admin_traffic_day` | filter | 概覽流量列下鑽（指定日期範圍的熱門頁面／引薦來源） |
| `minimal_admin_block_forms` | filter | 封鎖檢查器標籤／控制項 + 斜線插入範本 |
| `minimal_admin_insert_blocks` | filter | 精簡或擴充自動插入的斜線清單 |
| `minimal_admin_page_builders` | filter | 註冊全畫布頁面建構器 |
| `minimal_admin_design_sources` | filter | 為斜線選單＋區塊選擇器註冊設計／範本庫 |
| `minimal_admin_editor_commands` | filter | 註冊自由格式的斜線選單／區塊選擇器指令（樣板 HTML、island 範本、非同步路由） |
| `minimal_admin_before_render_blocks` | action | 在 island `do_blocks` 之前註冊資源 |
| `minimal_admin_render_styles` | filter | island 預覽的額外 CSS URL／內嵌 CSS |
| `minimal_admin_rendered_html` | filter | 重寫一個 island 的轉譯 HTML（地圖、備援內容） |
| `minimal_admin_template_footer` | action | Minimal 應用程式文件的結尾（沒有 `wp_head`／`wp_footer`） |
| `minimal_admin_cache_purgers` | filter | 加入「Clear site cache」選用區指令 |
| `minimal_admin_spam_providers` | filter | 將提供者卡片新增至 Settings → Spam |
| `minimal_admin_license_providers` | filter | 在授權卡片上回報您的授權狀態，可選擇啟用／停用／重新驗證 |
| `minimal_admin_comments_enabled` | filter | 覆寫留言偵測（導覽、選用區、徽章） |
| `minimal_admin_respect_removed_menus` | filter | 回傳 false 以停止 Minimal 導覽鏡像的 `remove_menu_page()` 移除（自 0.26.0 起） |
| `minimal_admin_watched_admin_menus` | filter | 調整哪些管理選單 slug 對應到哪些 Minimal 導覽項目，以進行移除鏡像（自 0.26.0 起） |
| `minimal_admin_visibility_providers` | filter | 回報作用中的維護／即將推出／密碼模式（概覽橫幅、頂端列標籤、系統檢查） |
| `minimal_admin_media_folders` | filter | 從您的資料夾外掛程式提供 Media 檢視的資料夾篩選器（自 0.18.0 起） |
| `minimal_admin_log_sources` | filter | 將日誌新增至 System 的日誌檢視器（自 0.19.0 起） |

Minimal 刻意不觸發 `wp_head`/`wp_footer`（其文件保持整潔），因此開發者
想要渲染至頁面的工具會附加在 `minimal_admin_template_footer`；
內建的 Query Monitor 配接器是參考實作。

## 區塊檢查器表單 — `minimal_admin_block_forms`

> **正在為 Minimal 建置區塊？** 從 [content-blocks.md](content-blocks.md) 開始：北
> 星號（寫作編輯器與版面配置工具）、內容區塊契約，以及何時使用 islands
> 与完整 schema 的区别。本节是该契约的 filter/descriptor 参考。
> [Anchor Blocks](https://github.com/anchorhost/anchor-blocks) `app/MinimalAdmin.php` 是
> 參考轉接器。

Minimal 的編輯器會將複雜區塊呈現為唯讀島，而 **區塊檢查器**（⚙
每個島嶼上的晶片）會根據每個區塊已註冊的屬性結構描述產生設定表單。
結構描述本身就能完成許多工作：帶有 `enum` 的屬性會呈現為選取框，而
名為 `content` 的屬性（或包含長文字）會取得文字區域，而標籤會被人性化
根據索引鍵取得。結構描述無法表達其餘意圖：比起
鍵名、人類可讀的選項標籤，以及保證存在的文字區域。此篩選器會疊加這些內容：

```php
add_filter( 'minimal_admin_block_forms', function ( $forms ) {
    $forms['my-plugin/testimonial'] = array(
        'order'      => array( 'author', 'quote', 'tone' ),   // field order
        'attributes' => array(
            'author' => array( 'label' => 'Author' ),
            'quote'  => array( 'label' => 'Quote', 'control' => 'textarea' ),
            'tone'   => array(
                'label'   => 'Tone',
                'control' => 'select',
                'options' => array( array( 'light', 'Light' ), array( 'dark', 'Dark' ) ),
            ),
            'legacy' => array( 'hide' => true ),              // keep out of the form
        ),
    );
    return $forms;
} );
```

每個屬性：`label`、`control`（`text` · `textarea` · `select` · `number` · `checkbox`）、
`options`（`[value, label]` 配對，表示 `select`）、`hide`。沒有描述元時
檢查器會退回使用根據結構描述產生的控制項，因此這是改進項目，而非必要條件。
帶有 `source` 的屬性（儲存在已儲存的 HTML 中）永遠不會透過表單編輯。

優先在 attribute schema 本身表達可表達的內容：在上面宣告 `enum`
固定選項屬性，而通用表單會呈現完全沒有描述項的 select
（其他所有 schema 使用者也同樣受益）。`options` 僅用於原始
值需要人类可读的标签。

### 動態區塊會自動插入 — 不需要 descriptor

如果你的區塊是**完全由伺服器呈現**（由 `render_callback` 或 `render` 檔案負責
正常运作且您的 JS `save()` 为 null），它已经可以在 Minimal 中插入，无需任何 adapter code。
對於這些區塊，自閉合註解是有效的已儲存標記，因此 Minimal 會自動註冊每個
動態、頂層、可在插入器中看見的非核心區塊，會從純粹的
comment** 作為僅搜尋的斜線選單項目：它不會弄亂預設選單，但輸入
其標題的一部分（或其命名空間，因此 `/my-plugin` 會列出你提供的所有內容）便會顯示它。
插入會將 `<!-- wp:your/block /-->` 作為島嶼加入、呈現實際預覽，並開啟
由結構描述驅動的檢查器。

呈現探測是誠實性閘門。僅有 `is_dynamic` 並不代表單純的留言會
有效：混合区块（一个 render_callback **加上** 一个会输出包装 HTML 的 JS `save()`，或
僅處理已儲存內部區塊的呈現）不會獨立呈現任何內容，並會失敗
如果是由 Minimal 插入，Gutenberg 的區塊驗證會排除它們。因此，如果你的區塊
若沒有屬性便會呈現空白，請提供合理的預設值，或提供一個 `insert.template`。

若要充分利用自動插入功能，請在伺服器端正確註冊你的區塊：

- **在 PHP 註冊中使用 `title`**（或 `block.json`）— 否則 Minimal 會退回至
  人性化 slug（「report-card」→「Report Card」）。
- **子區塊使用 `parent` / `ancestor`，並在伺服器端宣告** — 已宣告的子區塊會
  排除在頂層插入之外，與 Gutenberg 的插入器完全相同。`parent` 會
  只存在於你的編輯器 JS 中的內容，對 Minimal（以及其他所有伺服器端
  消費者），因此你的子區塊會以獨立插入項目的形式顯示。
- **`supports.inserter = false`** 會完全隱藏區塊。
- **PHP 中的屬性 schema**——檢查器產生的表單就是根據它們建立
  根據取得；`enum` 屬性會變成選取框，預設值會預先填入。

靜態儲存區塊（由你的編輯器 JS `save()` 產生的 HTML）絕不會自動插入；只有你的
JS 可以產生其標記。請為這些內容提供明確的 `insert.template`。

若要在不提供範本的情況下抑制自動項目，請在中設定 `'insert' => false`
區塊的描述元。網站也可以透過以下項目裁剪或擴充整個清單
`minimal_admin_insert_blocks` filter。

### `insert` — 在編輯器的 `/` 選單中提供此區塊

宣告起始標記後，你的區塊就會出現在 Minimal 的斜線選單中（明確的範本
始終優先於自動項目）。它會作為可設定的 island 插入（實際
伺服器渲染的預覽、立即開啟檢查器）：

```php
$forms['my-plugin/testimonial'] = array(
    'insert' => array(
        'label'    => 'Testimonial',                    // slash-menu entry
        'icon'     => '❖',                              // optional, one glyph
        'template' => '<!-- wp:my-plugin/testimonial {"author":"…"} /-->',
    ),
    // …attribute refinements as above
);
```

`template` 是完整的原始區塊標記：您知道區塊的標準結構（wrapper HTML、
初始子項目、預設 attrs）；Minimal 會原樣插入。只在區塊上宣告 `insert`
在頂層有意義的項目（父項目和獨立區塊，而不是子項目）。

### `wrapperText` — InnerBlocks wrapper 中的可編輯文字

靜態 InnerBlocks 父區塊通常會將標題嵌入其已儲存的包裝 HTML 中（例如
對話區塊的標頭）。使用**恰好三個擷取
群組**，`(prefix)(text)(suffix)`：

```php
$forms['my-plugin/panel'] = array(
    'wrapperText' => array(
        array( 'label' => 'Heading', 'pattern' => '(<div class="panel-head">)([^<]*)(</div>)' ),
    ),
);
```

只有在文字實際變更時才會原地取代；未變更的包裝器會保持
位元組完全相同。不相符的樣板只是不會呈現欄位，而通用
文字執行欄位不會讓相符模式重複兩次（標籤欄位優先）。請注意 Minimal 的
通用文字已讓包裝文字可編輯，無需描述項；`wrapperText` 是
当您想要一个有标签的单一用途字段，而不是通用的 "Text" 时，值得声明
執行。若要參考區塊外掛自行提供描述器並實際發布的範例，
[Anchor Blocks](https://github.com/anchorhost/anchor-blocks) 註冊插入範本
以及其外掛自身的語意標籤（`app/MinimalAdmin.php`）；當
Minimal 尚未安裝，因此區塊外掛可以無條件地隨附它。

## 島嶼預覽 — 優先使用免費路徑，卡住時才使用 adapter

複雜區塊會以**島嶼**形式載入 Minimal：已儲存的標記會逐位元組保留，
而 ⚙ 晶片會開啟檢查器。預覽不是第二個編輯器畫布。Minimal 會 POST
原始標記至 `minimal-admin/v1/render-blocks`，在伺服器端執行 `do_blocks()`，比較樣式
佇列，將任何新 CSS 限定在 `.minimal-island-preview` 中，並設定結果為
`innerHTML`。此設計是刻意的：island 保持可安全序列化，絕不重新實作
您的 React UI，并且当资源载入后仍看起来像前端。

**針對該路徑設計，大多數區塊都不需要任何 Minimal 專用程式碼。** 當某些功能仍然
看起來空白、巨大或沒有樣式時，以下檢查清單與 Minimal 自有轉接器使用的相同
接續。

### 免費路徑（無介面卡）：讓 `do_blocks` 名副其實

1. **在伺服器端呈現有意義的 HTML。** 一個空白的 `<!-- wp:your/block /-->`（或帶有預設
   attrs）應產生可見標記。如果沒有 attrs 時輸出為空，請設定屬性
   `block.json` / PHP 註冊中的預設值，或提供一個帶有起始內容的 `insert.template`
   標記。
2. **在 `init` 註冊前端樣式，而不只是等到 `has_block()` 在某個位置找到它們時才註冊。**
   單數文章。** 優先使用 `block.json` `"style": "file:./style.css"`，讓核心註冊
   在註冊區塊時使用的 handle。如果你使用具名 handle（`"style": "my-block-style"`），
   在你 `register_block_type()` 的相同位置呼叫 `wp_register_style()`。Minimal（以及任何
   其他無頭 `do_blocks` 使用者）接著會在呈現時自動加入佇列。
3. **請勿以 `is_admin()` 或僅限編輯器的 hook 作為前端樣式表的條件。**
   編輯器樣式（`editorStyle`）僅限編輯器使用；**style** 控制代碼是預覽和
   公開網站分享。
4. **在 CSS 中調整圖示與 SVG 的大小**（在 SVG 或包裝元素上使用 `max-width` / `width` / `height`
   類別）。不受限制的 SVG 在任何無 CSS 的環境中看起來都像「破損的巨大圖示」，而不是
   僅限 Minimal。
5. **可能的話，地圖／圖表／輪播請優先使用靜態或伺服器 HTML**，否則請接受
   純用戶端外殼在預覽中會看起來是空的，直到你加入備援
   （如下）。
6. **將文字與圖片 URL 放入已儲存的 HTML 中（或放入與該 HTML 對應的 attrs）。** Minimal 可以
   已可編輯一般文字執行內容，並在 island 內替換圖片，而不需要每個區塊的程式碼
   当内容存在于标记中时。

Minimal 已免費提供的功能（無需介面卡）：

| 行为 | 机制 |
|---|---|
| 动态区块 slash-insert | 对空白 comment 进行 render probe；仅供搜索的条目 |
| Schema inspector | 来自 `register_block_type`／`block.json` 的 Attr schema |
| Live preview HTML | 通过 `render-blocks` 的 `do_blocks` |
| render 期间 enqueue 的样式 | `do_blocks` 之后的 style-queue 差异 |
| 网站 + 区块库 CSS | `editor-styles` + 在 `.minimal-island-preview` 上使用 client scoper |
| island 中的文字／图像编辑 | 通用文字运行 + 图像 URL 替换 |
| 设计库／patterns | 已注册的区块 patterns 会自动处理；库通过下方的 `minimal_admin_design_sources` |
| 写作快捷方式／样板 | 通过下方 `minimal_admin_editor_commands` 使用自由格式 slash commands |

### 免費路徑失敗時：診斷 → 隨插即用介面卡

| Minimal 中的症状 | 可能原因 | 不修改 Minimal 代码的修复方式 | 无法更改时的即插即用 adapter |
|---|---|---|---|
| 空白 island，区块编辑器中完整显示 | 混合模式：JS `save()` 拥有标记；空白 comment 不渲染任何内容 | 完全由服务器渲染，或随真实 save markup 提供 `insert.template` | `minimal_admin_block_forms` → `insert.template` |
| 内容存在但 SVG 过大／布局损坏 | 前端 CSS 从未在 REST render 时注册 | 在 `init`（`file:./style.css` 或 `wp_register_style`）注册 `style` | `minimal_admin_before_render_blocks` + `minimal_admin_render_styles` |
| 访问后前端显示正确，但 Minimal 中为空 | CSS 仅存在于 postmeta／浏览器编译的缓存中 | 从 `do_blocks` 输出 CSS，或 enqueue 一个真正的 stylesheet | `minimal_admin_render_styles`（postmeta／warm URL）；请参阅 Otter |
| 空白地图／slider／Lottie shell | 服务器输出 div + script；`innerHTML` 从不执行 scripts | 服务器渲染静态 fallback（image、iframe、noscript） | `minimal_admin_rendered_html` 替换为 iframe／static |
| 插入成功，inspector 为空 | 服务器端没有 attr schema | 在 PHP／`block.json` 中注册 attributes | `minimal_admin_block_forms` 仅用于细化 schema 的标签 |
| 静态保存的设计库 | 只有 editor JS 能够编写完整设计 | 发布可序列化的模板（JSON/CDN），供 Minimal 获取 | 设计来源（下方的 `minimal_admin_design_sources`） |

### 預覽 hooks（複製到 `includes/minimal-admin.php`）

Minimal 未安裝時，以上所有項目都不會執行任何操作。

**1. 在 render 前註冊樣式**（命名控制代碼，否則核心無法看見）：

```php
add_action( 'minimal_admin_before_render_blocks', function ( $blocks, $post_id ) {
	// $blocks is an array of raw markup strings for the islands being previewed.
	if ( ! minimal_admin_markup_has( $blocks, 'my-plugin/' ) ) {
		return;
	}
	wp_register_style(
		'my-block-style',
		plugins_url( 'build/style.css', MY_PLUGIN_FILE ),
		array(),
		MY_PLUGIN_VERSION
	);
}, 10, 2 );

function minimal_admin_markup_has( $blocks, $needle ) {
	foreach ( (array) $blocks as $raw ) {
		if ( is_string( $raw ) && false !== strpos( $raw, $needle ) ) {
			return true;
		}
	}
	return false;
}
```

註冊 handle 後，Minimal 的 `do_blocks` + queue-diff 路徑會以相同方式將其加入佇列
前端會採用的方式。

**2. 直接交付 CSS URL 或行內 CSS**（postmeta 快取、嵌入 attrs 的 CSS 等）：

```php
add_filter( 'minimal_admin_render_styles', function ( $styles, $blocks, $post_id ) {
	// $styles = [ 'urls' => string[], 'inline' => string, optional 'warm' => url ]
	$styles['urls'][] = plugins_url( 'build/style.css', MY_PLUGIN_FILE );
	if ( $post_id ) {
		$cached = get_post_meta( $post_id, '_my_plugin_generated_css', true );
		if ( is_string( $cached ) && $cached !== '' ) {
			$styles['inline'] .= "\n" . $cached;
		}
	}
	return $styles;
}, 10, 3 );
```

選用的 `'warm' => $front_end_url`：Minimal 會在一次載入該 URL 至隱藏 iframe，讓
僅限瀏覽器的編譯器可以填入快取，然後重新擷取樣式（Otter atomic-wind）。

**3. 為僅限 JS 的 shell 重寫 HTML**（地圖、需要指令碼執行器的小工具）：

```php
add_filter( 'minimal_admin_rendered_html', function ( $html, $raw, $post_id ) {
	if ( false === strpos( $raw, 'my-plugin/map' ) ) {
		return $html;
	}
	// Parse attrs from $raw or scrape them from $html; return a static preview.
	return '<iframe src="…" style="width:100%;height:400px;border:0" loading="lazy" title="Map"></iframe>';
}, 10, 3 );
```

在可行時，優先在你的外掛中修正免費路徑。Adapters 用於你
無法變更（第三方託管的 CSS、JIT 編譯器、舊版註冊順序）。

### Minimal 中的參考介面卡（請先閱讀這些）

| Adapter | 教导内容 |
|---|---|
| `includes/adapters/otter.php` | 延遲載入的命名樣式 + postmeta CSS + 對映 HTML 備援 + 預熱 URL |
| `includes/adapters/essential-blocks.php` | 隨提交的區塊屬性一併傳送的 CSS |
| `includes/adapters/stackable.php` | 靜態儲存區塊無法自動插入時，插入設計庫 |
| `includes/adapters/kadence.php`／`generateblocks.php` | 在插件自己的 REST/cache 上使用相同的库模式 |
| Anchor Blocks `app/MinimalAdmin.php`（外部） | 由区块插件本身拥有的 `minimal_admin_block_forms` |

內部實驗室筆記（CSS 模型、混合陷阱）：`docs/block-suites.md`。

## 設計程式庫 — `minimal_admin_design_sources`

如果你的外掛程式提供範本庫（整個區段的序列化區塊標記，使用者
若要將其作為單一單元插入，請註冊為**設計來源**。設計只會以搜尋方式出現
編輯器斜線選單中的項目，以及區塊選擇器（⌘/）中的具名群組：

```php
add_filter( 'minimal_admin_design_sources', function ( $sources ) {
    $sources['my-plugin'] = array(
        'label' => 'My Library',                 // block-picker group name
        'route' => 'my-plugin/v1/minimal-designs',  // implements the pair contract below
    );
    return $sources;
} );
```

此路由實作雙端點契約：

- `GET {route}` 傳回精簡清單：
  `{ "designs": [ { "id": "hero-1", "label": "Hero 1", "category": "Heroes" } ] }`
  （`category` 為選用項目，會以項目的 meta 顯示）。Minimal 會在
  第一次開啟斜線選單時載入並在工作階段中快取，因此請保持快速且精簡。
- `POST {route}/{id}` 傳回插入承載內容：
  `{ "template": "<!-- wp:… -->…", "block": "my-plugin/hero" }`。`template` 是完整的
  序列化的區塊標記（你的標準儲存輸出，依結構必定符合 Gutenberg；
  單一頂層區塊會作為一個 island 插入），而可選的 `block` 會命名
  島狀介面的標籤。

提供網站實際能使用的內容（只有在你的程式庫受限時才提供免費方案），並
在插入時將遠端圖片本地化：安裝 Minimal 後，
`minimal_admin_localize_images( $template )`（請參閱 `includes/adapters/media-localize.php`）
會將它們側載至媒體庫並重寫 URL，依檔案名稱去除重複項目。
使用 `function_exists` 防護此呼叫，因為即使 Minimal
不是。為路由提供 `permission_callback`（`edit_posts` 與編輯器相符）。該
內建的 Stackable、Kadence 和 GenerateBlocks 配接器會透過相同的方式註冊
篩選器，並作為參考。

## 編輯器斜線指令 — `minimal_admin_editor_commands`

當你的外掛程式需要的是**寫入動作**而非區塊（樣板段落、
預先建置的 island 範本，或從您的 REST API 擷取的標記）時，請註冊一個
斜線選單命令。命令會出現在編輯器的 `/` 選單和區塊選擇器（⌘/）中，
在 Minimal 文件中不包含第三方 JavaScript：

![The slash menu filtered to one plugin's entries, each carrying its namespace badge](img/slash-menu.png)

```php
add_filter( 'minimal_admin_editor_commands', function ( $commands ) {
    // 1. Synchronous prose HTML (paragraphs, simple markup the serializers keep).
    $commands[] = array(
        'id'         => 'my-plugin/cta',
        'label'      => 'CTA boilerplate',
        'icon'       => 'send',              // lucide key or a short glyph
        'ns'         => 'my-plugin',         // badge in the slash menu; picker group
        'keywords'   => array( 'cta', 'convert' ),
        'searchOnly' => true,               // hide until the writer types a match
        'html'       => '<p><strong>Ready?</strong> Book a call this week.</p>',
    );

    // 2. Synchronous island template (serialized block markup).
    $commands[] = array(
        'id'       => 'my-plugin/callout',
        'label'    => 'Callout',
        'icon'     => 'block',
        'ns'       => 'my-plugin',
        'block'    => 'my-plugin/callout',  // island chip name; defaults to core/group
        'template' => '<!-- wp:my-plugin/callout -->…<!-- /wp:my-plugin/callout -->',
    );

    // 3. Async route: Minimal POSTs/GETs and inserts the response.
    $commands[] = array(
        'id'     => 'my-plugin/latest',
        'label'  => 'Latest announcement',
        'icon'   => 'file',
        'ns'     => 'my-plugin',
        'route'  => 'my-plugin/v1/minimal-command/latest',
        'method' => 'POST',                 // GET or POST; default POST
        'body'   => array( 'tone' => 'short' ), // optional JSON body (scalars only)
    );
    return $commands;
} );
```

**必須且只能有一個** `html`、`template` 或 `route`。沒有任何一個或
多於一個的會被捨棄。索引鍵：

| Key | 必需 | 备注 |
|---|---|---|
| `id` | yes | 穩定的 slug（`a-z0-9_-/`） |
| `label` | yes | 斜線選單／選擇器標題 |
| `html` *或* `template` *或* `route` | 一个 | 插入形状 |
| `block` | with `template` | Island 區塊名稱（預設為 `core/group`） |
| `method` | with `route` | `GET` 或 `POST`（預設為 `POST`） |
| `body` | with `route` | 用於 POST 的純量值淺層對映 |
| `icon` | no | Minimal 已內建的 Lucide key，或簡短字形 |
| `ns` | no | 命名空間標籤＋選擇器群組（`{Ns} · commands`） |
| `keywords` | no | 額外搜尋詞（斜線選單與選擇器） |
| `searchOnly` | no | 為 true 時，直到查詢相符才顯示（維持 `/` 的精選內容） |

路由回應必須是以下其中一種：

- `{ "html": "<p>…</p>" }` — 以文字內容插入（與靜態 `html` command 使用相同路徑）
- `{ "template": "<!-- wp:… -->…", "block": "my-plugin/x" }` — 以 island 形式插入

為路由提供一個 `permission_callback`（`edit_posts` 與編輯器相符）。該指令
清單會隨啟動載荷及工作階段中的 `editor-blocks` 重新輪詢一起傳遞（外掛切換
重新整理，而不必完整重新載入）。

## 編輯器面板 — 編輯器側邊欄中的每篇文章欄位

對於資料位於*文章內部*的外掛程式（自訂欄位、SEO 中繼資料），請註冊一個**編輯器
**面板**，而不是介面。同樣的理念：宣告式描述項，由 Minimal 呈現。
你的面板是編輯器側邊欄中的低調入口列（標籤、徽章、一行摘要），可
會開啟包含你欄位的模態視窗：

![The editor sidebar door stack, ending with a plugin panel door: Custom fields · ACF, 4 fields · 1 advanced](img/editor-side-doors.png)

![The opened panel: text, select, toggle and textarea fields plus the advanced-fields count with its wp-admin escape](img/editor-panel.png)

```php
add_filter( 'minimal_admin_editor_panels', function ( $panels ) {
    $panels['my-fields'] = array(
        'label'       => 'My fields',
        'sub'         => 'My Plugin',
        'cap'         => 'edit_posts',
        // Returns { groups: [ { group, fields: [ {name,label,type,choices,min,max} ], locked } ] }
        // for the post being edited. {id} = post ID (0 for new), {type} = REST base.
        'fieldsRoute' => 'my-plugin/v1/fields?post_id={id}&post_type={type}',
        'valuesKey'   => 'myplugin',   // key on the wp/v2 post response holding current values
        'writeKey'    => 'myplugin',   // key Minimal writes changed values back under on save
    );
    return $panels;
} );
```

支援的欄位類型：`text`、`textarea`、`number`、`range`、`email`、`url`、`select`、`radio`、
`true_false`、`suggest`。其他內容請在 `locked` 計數中回報；Minimal 會顯示「N 個進階
欄位——使用「在 wp-admin 中編輯 ↗」，而不是呈現不安全的內容。值會沿用一般的
文章儲存（包含自動儲存），因此你的外掛只需讓其值可在
文章 REST 回應（`register_rest_field`，或對於 ACF 而言，欄位群組的「Show in REST API」
切換開關）。

**`suggest`（自 0.18.0 起）** 是一個用於連結記錄的非同步搜尋選擇器，其選項
對於 `select` 而言，清單太大或變動太頻繁（場地、主辦者、相關文章）。欄位
宣告一個 `route`；Minimal 會在使用者輸入時以 `&q=` 擷取它，並預期一個純陣列，內容為
`{ value, label }` 列（Minimal 會在前面加上自己的「— None」清除列）。欄位目前的
您的 `valuesKey` payload 中的值是 `{ value, label }`（无值时为 `''`），并且相同
形狀會在儲存時傳回，因此請從 `value` 讀取 id。內建的 Events Calendar 配接器的
场地选择器是参考实现。

隨附的 ACF 介面卡（`includes/adapters/acf.php`）是參考實作。

### 狀態面板 — 文章範圍的狀態與動作（自 0.25.0 起）

某些文章範圍功能根本不是欄位：它們回報狀態並提供動作（傳送此
將文章發布為電子報、從 CDN 清除此頁面、分享到社群）。對於這些情況，註冊
面板搭配 `statusRoute`，而不是欄位索引鍵。入口會顯示你的摘要列及
開啟後會呈現你的狀態列及動作按鈕；所有 UI 都由 Minimal 提供。

```php
add_filter( 'minimal_admin_editor_panels', function ( $panels ) {
    $panels['newsletter'] = array(
        'label'       => 'Newsletter',
        'sub'         => 'My Plugin',
        'cap'         => 'manage_options',
        // GET; {id} = post ID, {type} = REST base. Only fetched for saved posts.
        'statusRoute' => 'my-plugin/v1/newsletter/{id}',
    );
    return $panels;
} );
```

狀態路由會回傳面板顯示的所有內容：

```json
{
    "summary": "Not sent · 57 subscribers",
    "tone":    "amber",
    "note":    "Optional paragraph shown above the rows.",
    "rows":    [ { "label": "Status", "value": "Not sent", "tone": "amber", "hint": "…" } ],
    "actions": [
        { "label": "Send preview to me", "route": "my-plugin/v1/newsletter/123/send",
          "body": { "send_to": "preview" }, "hint": "Sends to you@example.com" },
        { "label": "Send to all subscribers (57)", "route": "…", "body": { "send_to": "all" },
          "confirm": "This sends immediately to all subscribers.", "danger": true },
        { "label": "Send to email", "route": "…", "body": { "send_to": "custom" },
          "fields": [ { "key": "email", "label": "Email address", "type": "email" } ] },
        { "label": "Open in wp-admin", "href": "…" }
    ]
}
```

`summary` 是門口的一行狀態；`tone`（`green`／`amber`／`red`）會為其著色。動作
路由是你在伺服器端建立的字串（自行嵌入文章 ID），會以 POST 搭配
動作的 `body`。具有 `confirm` 的動作會經由 Minimal 主題化的確認對話方塊
（`danger` 會將其設為紅色）；帶有 `fields` 的動作會將其按鈕替換為行內表單，並且
將收集到的值合併至本文（欄位詞彙與建立表單相同）。
`href` 動作會改為呈現為連結。動作回應可能攜帶
`{ "message": "…", "status": { … } }`：`message` 會取代預設 toast，而傳回的
`status` 會在同一個往返中重新繪製面板和門口（否則 Minimal 會重新擷取
您的状态路由）。未保存的文章不会渲染面板，因为没有文章可供报告
尚未。面板要嘛是欄位面板，要嘛是狀態面板；`statusRoute` 會使這三個
欄位索引鍵可選。

如需完整的實際應用實作（狀態建構器、動作端點、發佈閘門
在危險動詞上），請參閱
[CaptainCore Manager](https://github.com/CaptainCore/captaincore-manager/blob/master/captaincore.php)
（搜尋 `captaincore_newsletter_panel_status`）。整個整合都位於該處
外掛；Minimal 不提供任何相關內容。

## 流量提供者 — 驅動總覽圖表

Analytics 外掛可以透過回應以下內容，使用實際流量取代 Overview 的「Activity」圖表
`minimal_admin_traffic` filter。針對要求的範圍傳回每日訪客／頁面瀏覽次數，以及
上一期間的訪客總數（用於 Visitors 統計卡片的差異值）：

```php
add_filter( 'minimal_admin_traffic', function ( $traffic, $days ) {
    if ( null !== $traffic ) {
        return $traffic; // another provider already answered
    }
    return array(
        'source'        => 'My Analytics',
        'days'          => array( // 'Y-m-d' => counts, covering the last $days days
            '2026-07-02' => array( 'visitors' => 120, 'pageviews' => 310 ),
            '2026-07-03' => array( 'visitors' => 141, 'pageviews' => 355 ),
        ),
        'prev_visitors' => 2210,  // visitor total for the $days before that
    );
}, 10, 2 );
```

Minimal 會將天數分組以符合所選範圍（每日最多 45 天，超過則按週），並呈現
流量圖表，並以你的外掛名稱作為來源徽章，且以統計卡片開頭，
訪客數與期間對期間的變化。隨附介面卡涵蓋**Koko Analytics**（
參考實作）、**WP Statistics**、**Burst Statistics** 和 **Independent
Analytics**。由第一個啟用的提供者回應，因此註冊自有 adapter 的外掛
當 `$traffic` 已經不是 null 時應提早返回。

### 每日深入分析 — 圖表列的熱門頁面

按一下流量列會開啟 modal，顯示熱門頁面（以及選用的 referrer）
針對該列的日期範圍。提供者會回答第二個篩選器：

```php
add_filter( 'minimal_admin_traffic_day', function ( $data, $from, $to ) {
    if ( null !== $data ) {
        return $data; // another provider already answered
    }
    // $from / $to are inclusive Y-m-d calendar dates for the bar (one day
    // on the 7/30d chart; up to a week on 90d).
    return array(
        'source'    => 'My Analytics',
        'pages'     => array(
            array(
                'title'     => 'Homepage',
                'path'      => '/',
                'url'       => home_url( '/' ),
                'postId'    => 0,      // optional; >0 when the hit maps to a post
                'visitors'  => 120,
                'pageviews' => 310,
            ),
        ),
        'referrers' => array(  // optional
            array( 'label' => 'google.com', 'visitors' => 40, 'pageviews' => 55 ),
        ),
        'adminUrl'  => admin_url( 'admin.php?page=my-analytics' ), // optional footer link
    );
}, 10, 3 );
```

當你沒有頁面分解資料可提供給時，回傳 `null`（或讓 `$data` 保持不變）
window；modal 显示空状态，并且在已设置时仍提供 `adminUrl`。
內建的每日 adapter：**Koko Analytics**（`post_stats` + `paths` + referrer
表格），**WP Statistics**（`statistics_pages` 用於點擊次數 +
`statistics_visitor.referred` 用於來源網站；WPS 沒有按 URI 統計的不重複訪客，因此
兩個欄位都回報命中總數）、**Burst Statistics**（`burst_statistics`
page_url/page_id + `burst_sessions.referrer`），以及 **Independent Analytics**
（views × resources + session referrers）。與以下相同的第一個非 null 規則
`minimal_admin_traffic`.

## 媒體資料夾 — 提供 Media 檢視中的資料夾篩選器

如果你的外掛程式將媒體庫整理成資料夾，請回答
`minimal_admin_media_folders` filter，Minimal 的 Media 檢視會取得資料夾
由你的資料提供的組合框。瀏覽優先：Minimal 會縮小其一般媒體查詢
連結至你資料夾的附件 id，因此搜尋、類型分頁和分頁功能都
持續運作，而 Minimal 永遠不會建立自己的資料夾樹。第一個非 null
供應商勝出（與 `minimal_admin_traffic` 相同的規則）。

```php
add_filter( 'minimal_admin_media_folders', function ( $provider ) {
    if ( null !== $provider || ! defined( 'MY_FOLDERS_VERSION' ) ) {
        return $provider; // someone else answered, or we're not active
    }
    return array(
        'name'    => 'My Folders',      // named in the combobox tooltip
        'folders' => function () {
            // Flat list; parent 0 = root (Minimal indents children for you).
            // id 0 is reserved: an optional "Uncategorized" row for files in
            // no folder, never treated as a parent. count is optional.
            return array(
                array( 'id' => 12, 'label' => 'Logos', 'parent' => 0, 'count' => 8 ),
                array( 'id' => 13, 'label' => 'Dark',  'parent' => 12, 'count' => 3 ),
            );
        },
        'ids'     => function ( $folder_id ) {
            // The folder's attachment ids (any order), or a WP_Error for a
            // folder this user may not browse. Minimal re-orders newest-first
            // and caps at 500 before querying.
            return my_folders_attachment_ids( $folder_id );
        },
        'move'    => function ( $folder_id, array $attachment_ids ) {
            // Optional. When present, the media bulk bar gains a folder
            // picker and a Move button. Put the attachments in the folder
            // through your own machinery (0 = remove from every folder);
            // true or WP_Error. Callers hold upload_files; run your own
            // finer checks here. Omit it and Minimal shows no Move control.
            return my_folders_move( $folder_id, $attachment_ids );
        },
    );
} );
```

兩個 callable 都會以瀏覽使用者的身分在伺服器端執行（`edit_posts` floor），因此
每位使用者的資料夾模式只需讀取你自己的限定範圍狀態即可運作。內建
供應商位於 `includes/adapters/media-folders.php`（FileBird、Real Media
Library、Folders by Premio）是參考實作；複製你需要的儲存結構
符合你的需求（自訂資料表、API 或純分類法）。自 0.18.0 起。

## 快取清除器 — 加入「清除網站快取」

Minimal 的 ⌘K 指令面板包含「清除網站快取」指令，可清除所有偵測到的快取
層，每個提供者一個請求。快取與最佳化外掛會透過以下方式註冊清除器
`minimal_admin_cache_purgers` 篩選器：

```php
add_filter( 'minimal_admin_cache_purgers', function ( $purgers ) {
    $purgers[] = array(
        'id'    => 'my-cache',   // stable slug
        'name'  => 'My Cache',   // shown in the palette entry and the result toast
        'purge' => function () {
            my_cache_flush_everything();
        },
    );
    return $purgers;
} );
```

此命令只會對具有 `manage_options` 的使用者公開，而你的 `purge` 回呼
會在該請求的伺服器端執行；對於常見的
案例。`includes/adapters/cache-purge.php` 中的內建提供者包括 LiteSpeed，
WP Rocket、W3 Total Cache、SpeedyCache、Redis Object Cache、Breeze、Nginx Helper、
Cloudflare 等等；複製其中任何一個。

## 日誌來源 — 系統的日誌檢視器

系統頁面的偵錯工具卡片會列出網站記錄（WordPress 偵錯記錄、PHP
錯誤記錄（若為獨立檔案），以及每個 WooCommerce 記錄頻道各一個來源），每個
開啟全螢幕尾端檢視器並提供來源選擇器。保留自身記錄的外掛
或是知道網頁伺服器記錄檔位置的主機 mu-plugin，可以註冊來源
通过 `minimal_admin_log_sources` filter。从 0.19.0 起。

```php
add_filter( 'minimal_admin_log_sources', function ( $sources ) {
    $sources['my-plugin'] = array(
        'label' => 'My Plugin log',
        'group' => 'My Plugin',      // shown as "My Plugin · My Plugin log"
        'stat'  => function () {     // cheap: powers lists, never reads content
            $path = my_plugin_log_path();
            return array(
                'exists'   => file_exists( $path ),
                'size'     => file_exists( $path ) ? filesize( $path ) : 0,
                'modified' => file_exists( $path ) ? filemtime( $path ) : 0,
            );
        },
        'read'  => function () {     // the tail payload
            return Minimal_Admin_Logs::tail_file( my_plugin_log_path() );
        },
        'clear' => function () {     // optional; omit for read-only sources
            return my_plugin_truncate_log() ? true
                : new WP_Error( 'clear_failed', 'Could not clear the log.' );
        },
    );
    return $sources;
} );
```

來源 ID 可使用字母、數字、`:`、`_`、`.` 和 `-`。`Minimal_Admin_Logs::tail_file()`
提供最後 256 KB，並捨棄第一個不完整的行；一個會自行建立其 `read` 的
承載資料應回傳相同形狀（`exists`、`path`、`size`、`size_human`、
`truncated`、`content`，可選的 `note`）。檢視器僅限 `manage_options`。Minimal 絕不
猜測網頁伺服器記錄路徑：這些路徑取決於主機，通常位於
`open_basedir`，因此註冊它們的工作刻意留給控制主機的人員。

## 垃圾郵件提供者 — 設定 → 垃圾郵件

垃圾郵件過濾外掛程式會在 Minimal 的**設定 → 垃圾郵件**頁面上取得一張卡片：已設定狀態、
累計封鎖次數、幾個透過您自己的選項結構寫入的安全切換設定，以及
連結至完整的 wp-admin 畫面。透過 `minimal_admin_spam_providers` 篩選器註冊：

```php
add_filter( 'minimal_admin_spam_providers', function ( $providers ) {
    if ( ! defined( 'MY_SPAM_PLUGIN_VERSION' ) ) {
        return $providers; // register only while your plugin is active
    }
    $providers[] = array(
        'id'     => 'my-spam',
        'name'   => 'My Spam Filter',
        'status' => function () {
            return array(
                'configured' => (bool) get_option( 'my_spam_key' ),
                'note'       => 'One-line status shown under the name',
                'blocked'    => (int) get_option( 'my_spam_blocked_total', 0 ),
                'toggles'    => array(
                    array(
                        'id'    => 'notify',
                        'label' => 'Email me about new spam',
                        'desc'  => 'What the switch does, in one sentence.',
                        'on'    => (bool) get_option( 'my_spam_notify' ),
                    ),
                ),
                'adminUrl'   => admin_url( 'options-general.php?page=my-spam' ),
            );
        },
        'set'    => function ( $toggle_id, $on ) {
            if ( 'notify' === $toggle_id ) {
                update_option( 'my_spam_notify', $on ? 1 : 0 );
            }
        },
    );
    return $providers;
} );
```

切換會透過 `minimal-admin/v1/spam` 儲存（受 `manage_options` 控制）；`set` 會執行
在伺服器端搭配切換開關 id 和新的布林值。將切換開關限制為兩到三個
切換網站擁有者實際會操作的選項；深度設定應放在你自己的畫面中，
卡片链接到的内容。捆绑提供者（Akismet、Antispam Bee、CleanTalk）位于
`includes/adapters/spam.php` 以及是參照。

**直接貼上金鑰（選用）。** 如果你的篩選器需要 API 金鑰，而你也
註冊授權提供者（下一節），並提供可呼叫的 `activate`，回傳其
供應商 ID 從 `status()` 取得為 `keyProvider`。接著卡片會呈現一個顯示索引鍵的欄位
文章中使用 `minimal-admin/v1/licenses/action`，因此相同的防護規則仍然適用：索引鍵會隨著
一個請求，由你的程式碼驗證並儲存，且 Minimal 絕不保留。
當該金鑰在程式碼中提供（常數或篩選器），或由系統管理時，請省略 `keyProvider`
雲端端。Akismet 是參考：其卡片欄位和 Licenses 資料列會驅動
相同的提供者。

## 授權狀態 — `minimal_admin_license_providers`

Extensions 提供一張 **Licenses** 卡片：每個付費元件以及
網站上已連線的服務及其狀態（valid / expired / invalid /
缺少／未知），僅從已儲存的選項讀取。讀取絕不會呼叫授權
API；如果你的外掛是商業外掛（或持有服務金鑰或帳戶
連線），提供者會在網站擁有者已經
看起來如此。提供者上的選用 `category` 索引鍵（`license`——預設值——
`key` 或 `connection`）會設定列上的小型標籤；服務請使用 `key`
像 Akismet 的憑證和用於帳戶或網站連結的 `connection`：

```php
add_filter( 'minimal_admin_license_providers', function ( $providers ) {
    $providers['my-plugin'] = array(
        'name'   => 'My Plugin Pro',
        'detect' => function () {
            return defined( 'MY_PLUGIN_VERSION' ); // installed, even if inactive
        },
        'read'   => function () {
            $status = get_option( 'my_plugin_license_status' );
            return array( array(
                'name'    => 'My Plugin Pro',
                'kind'    => 'plugin',           // or 'theme'
                'state'   => $status ? $status : 'missing',
                'key'     => (bool) get_option( 'my_plugin_license_key' ),
                'expires' => '2027-01-01',       // or 'lifetime' or ''
                'note'    => '',                 // optional one-line detail
                'stale'   => false,              // true when your cached status lapsed
            ) );
        },
    );
    return $providers;
} );
```

`read` 可能會傳回多列（每個產品一列），並在 Throwable 防護區塊內執行，
因此故障的提供者會退出，而不會破壞卡片。嚴格保持 `read`
本機：僅讀取選項，不進行 HTTP。狀態會納入 Licenses 健康檢查（已過期
或無效則失敗，缺少或未知則發出警告），以及複製為 Markdown 的報告。
內建 reader，包括通用 Freemius 和 EDD Software Licensing 支援，
位於 `includes/adapters/licenses.php`；端點是
`GET minimal-admin/v1/licenses`（受 `manage_options` 控制）。

### 動作：啟用、停用、重新驗證（選用）

提供者也可以宣告 `secret_label`，再加上三個動作 callable 中的任意一個，並
卡片會展開相符的控制項（貼上以啟用的欄位、Deactivate 搭配一個
確認、重新驗證）：

```php
'secret_label' => 'My Plugin license key',
'activate'     => function ( $secret ) {
    $res = my_plugin_activate_license( $secret ); // YOUR activation code
    return array(
        'ok'      => $res->ok,
        'code'    => $res->seats_exhausted ? 'site_limit' : ( $res->ok ? '' : 'invalid' ),
        'message' => $res->message,
    );
},
'deactivate'   => function () { /* your deactivation */ return array( 'ok' => true ); },
'verify'       => function () { /* re-check stored credentials */ return array( 'ok' => true ); },
```

這些規則由 Minimal 呼叫你的方式強制執行，並且是你應遵循的安全規則
可呼叫項目：動作只會在你的外掛自身程式碼載入時執行（將它們附加
條件式地，就像內建的 Elementor Pro 配接器一樣），貼上的密鑰
隨附於一個請求，Minimal 絕不會儲存、記錄或回傳；失敗的
啟用絕不會自動重試（重試可能會消耗付費席位），並且
`site_limit` 是一級結果代碼，因此會明確指出席位問題，而不是
被埋在通用錯誤中。動作會透過
`POST minimal-admin/v1/licenses/action`（`{provider, action, secret?}`，受其控制
`manage_options`）；傳回的 `WP_Error` 或擲出的例外會以純文字顯示
錯誤結果。任何操作後，最新分類會透過相同的
回應，因此卡片會根據你儲存的狀態重新繪製。

如果啟用是透過你自己的入口網站或 OAuth 類型的握手完成（沒有
可呼叫的路徑，用於貼上的金鑰），宣告 `activate_url`（URL 字串或
會回傳它的可呼叫項目），而不是 `activate`：未授權的資料列會攜帶
「Activate ↗」連結會帶到你的畫面。內建的 WPBakery 項目是參考實作。

如果啟用需要多個憑證，請宣告 `secret_fields` 並
`activate` 會接收以 id 為鍵的陣列，而不是字串（每個欄位
必要）；卡片會為每個密鑰呈現一個帶標籤的欄位。內建的 Divi
adapter（Elegant Themes 使用者名稱 + API key）是參考實作：

```php
'secret_fields' => array(
    array( 'id' => 'username', 'label' => 'Account username' ),
    array( 'id' => 'api_key', 'label' => 'API key' ),
),
'activate'      => function ( $secrets ) { /* $secrets['username'], $secrets['api_key'] */ },
```

## 留言偵測 — `minimal_admin_comments_enabled`

當留言功能實際上處於
關閉（沒有文章類型支援留言，也不存在任何留言）。管理留言的外掛可以
覆寫偵測：

```php
add_filter( 'minimal_admin_comments_enabled', function ( $enabled, $types ) {
    // $types = post types that still support comments.
    return false; // force-hide (or true to force-show)
}, 10, 2 );
```

## 網站可見性 — `minimal_admin_visibility_providers`

當你的外掛程式隱藏網站時（維護模式、即將推出頁面或整個網站
密碼），告知 Minimal，讓擁有者看到持續顯示的「網站已隱藏」標籤、概覽
橫幅和 System health check，而不是困惑於流量去了哪裡。只有
僅在模式實際為 ACTIVE 時註冊（此篩選器會在每次 Minimal 頁面載入時執行）：

```php
add_filter( 'minimal_admin_visibility_providers', function ( $providers ) {
    if ( my_plugin_maintenance_is_on() ) {
        $providers[] = array(
            'name'    => 'My Maintenance Mode',
            'id'      => 'my-plugin',   // optional: pairs the row with a toggle writer (below)
            'kind'    => 'maintenance', // or 'coming-soon' | 'password'
            'note'    => 'Visitors see the holding page',          // optional
            'url'     => admin_url( 'admin.php?page=my-settings' ), // where to turn it off
            'partial' => false, // true when only SOME pages are covered
                                // (WooCommerce's store-pages-only shape) —
                                // Minimal then says "part of the site" instead
                                // of claiming the whole site is dark
        );
    }
    return $providers;
} );
```

希望擁有者能直接從關閉你的模式（並透過復原重新開啟）
Minimal 的橫幅、標籤快顯視窗與「設定 → 可見性」？請在以下位置註冊切換開關寫入器
相同的 `id`。Minimal 只會透過外掛註冊的 writer 切換模式；
沒有提供者的項目，則維持為誠實的外部連結，指向 `url`。

```php
add_filter( 'minimal_admin_visibility_toggles', function ( $toggles ) {
    // Register whenever your plugin is loaded (not only while the mode is on):
    // an Undo must be able to re-arm a mode that is currently off.
    $toggles['my-plugin'] = array(
        'set' => function ( $on, $ctx ) {
            // $ctx['kind'] is the mode that was on before Minimal turned it off
            // ('maintenance' | 'coming-soon' | 'password') — use it to restore
            // the right mode if your plugin has more than one.
            my_plugin_set_maintenance( $on );
        },
    );
    return $toggles;
} );
```

切換端點（`POST minimal-admin/v1/visibility/toggle`）需要 `manage_options`。
內建 detector 涵蓋 Maintenance（WebFactory）、SeedProd、Under Construction，
LightStart（WP Maintenance Mode）、CMP Coming Soon & Maintenance、Minimal Coming Soon，
Password Protected、WooCommerce coming soon 和 Elementor maintenance mode — 全部都具備
透過每個外掛自己的儲存機制切換 writer。

## 沒有 REST API？提供 shim

如果你的資料位於自訂資料表中，請註冊一個小型唯讀 REST 集合，並將
描述元。Minimal 內建的 Gravity SMTP 配接器
（`includes/adapters/gravity-smtp.php`）是參考實作：約 60 行 SQL 至 REST
以及描述項。規則如下：在 `permission_callback` 中檢查功能，使用
`$wpdb->prepare`，絕不使用 `unserialize()` 儲存的 blob（使用 regex 或
`json_decode`).

## 注意事項

- 所有請求都使用登入使用者的 cookie + `X-WP-Nonce`，並與同一來源互動；你現有的
  REST 權限檢查會持續運作。
- 請勿自行跳脫任何內容；Minimal 會跳脫它所呈現的每個值。
- 內建 adapter 位於 `includes/adapters/`，並由 `class_exists`/`defined` 保護
  檢查；歡迎提交為廣泛使用的外掛新增配接器的 PR。優先提供
  adapter **置於您的外掛程式內**，當您擁有該產品時；Minimal 僅為外掛程式提供捆綁
  那永遠不會知道它的存在。
