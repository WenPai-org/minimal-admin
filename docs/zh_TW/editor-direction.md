# 編輯器方向

> 未來方向：[editor-roadmap.md](editor-roadmap.md)——編輯器作為
> 銷售功能、發展方向，以及永不建置清單。
>
> **北極星：** Minimal 是 WordPress 的寫作編輯器。Gutenberg 是版面配置工具。
> 歡迎建立可在 Minimal 中保持可編輯的文件元件；請參閱
> [content-blocks.md](content-blocks.md).

**決策：保留並深化 Minimal 自有的編輯器。將 Gutenberg 作為逃生門，而非基礎。**

## 考慮過的選項

1. **嵌入區塊編輯器**（`@wordpress/edit-post` 或以 iframe 載入 `post.php`）。完整區塊
   保真度，但會引入 React、建置工具鏈，以及 Minimal 存在所要避免的精確視覺雜訊
   移除。在 Minimal 內嵌入 iframe 的 wp-admin，就像兩位管理員在同一個視窗中爭執。
2. **在自訂編輯器中逐步重建區塊支援。** 追求與 Gutenberg 完全一致
   （巢狀版面配置、模式、動態區塊）是一場永遠無法結束的無限循環。
3. **混合模式（已選定）。** Minimal 的編輯器負責*寫作*使用情境——也就是 90% 的編輯
   段落、標題、清單、引文、拉引用、details、程式碼與圖片。它會讀取並
   為該子集寫入原生 Gutenberg 區塊標記，因此沒有任何專有格式，而且每個
   文章隨時都能在 Gutenberg 中完整編輯。任何超出安全子集的內容
   （`SIMPLE_BLOCKS` 位於 `app.js` 中）會成為原子區塊（或歷史上的鎖定模式），而
   一鍵交由真正的區塊編輯器處理。

## 為何混合模式勝出

- **儲存格式保證互通性。** Minimal 寫入 `<!-- wp:paragraph -->`-風格
  由 `parse_blocks()` 驗證的標記。沒有鎖定，也不需要遷移。
- **鎖定是安全閥。** `editorModeFor()` 將內容分類為 `classic`／`blocks`／
  `locked`。鎖定的文章永遠不會在儲存時傳送其內容，因此複雜版面配置無法
  被 Minimal 損壞——最壞情況是點擊跳轉至 Gutenberg。
- **無建置步驟。** 整個應用程式維持為單一 vanilla-JS 檔案，這是外掛的核心
  架構上的押注。

## 區塊島——複雜內容如何安全地編輯

原始設計在出現任何複雜區塊時鎖定整個內文。現在已改為
透過**原子區塊島**：

1. `tokenizeBlocks()` 將原始內容拆分為頂層區段，並驗證這些區段
   逐字節重組原始內容（失敗 → 舊的鎖定模式，現在已很少見）。
2. 簡單且安全承載屬性的區塊會變成可編輯 HTML。帶有屬性的簡單區塊
   序列化器無法重現（`{"fontSize":"large"}`、圖片 `{"id":…}`）的內容，*不會*以有損方式編輯——
   它也會成為島（`segmentEditable()`／`EDITABLE_ATTRS`）。
3. 其餘內容會呈現為 `contenteditable="false"` 島——帶有邊框的卡片，其中包含區塊
   名稱標籤與靜態預覽——其原始標記會逐字儲存並拼接回
   儲存時保持不變。刪除島嶼會刪除區塊；不會對它發生其他任何操作。

結果：文字編輯可在複雜版面配置*周圍*流動，且完全不會影響它們。已透過
在完整編輯與儲存週期中逐位元組比較巢狀群組／欄與 shortcode 區塊。
已知的外觀效果：第一次 Minimal 儲存會將區塊間空白正規化為 Gutenberg
標準空白行。

## 寫作區域

混合模式決定哪些內容*可安全*編輯；以下是讓其成為可能的操作介面
編輯本身保持快速（全部已在 v0.5.x 週期完成）：

- **Markdown 輸入規則。** 內嵌包覆會在結束分隔符上觸發——`` `code` ``，
  `**bold**`、`*italic*`、`__bold__`／`_italic_`（僅限字詞邊界，因此 `snake_case`
  仍會存續）、`~~strike~~`、`[text](url)`（僅限 URL 形式的目的地）。區塊前綴會觸發
  段落開頭的空格——`#`–`######`、`-`／`*`／`+`、`1.`、`>`——以及 ``` → 程式碼
  區塊與 `---` → 分隔線。包覆會經由 `execCommand`，因此 ⌘Z 會還原字面文字。
  來之不易的 Blink 事實以註解形式存在於 `bindMarkdown()`：`insertHTML` 重寫 `<code>`
  進入樣式化 span（程式碼包覆是手動建立），會將相鄰空格重新平衡
  nbsp（插入後修正；`cleanBoundaryNbsp()` 也會在序列化時清理），新清單
  會巢狀在段落內，直到被提升。
- **內嵌程式碼邊界逃生。** contenteditable 不提供可輸入的游標位置
  在內嵌元素的邊緣*外側*——Chrome 會延伸格式。列印鍵在
  `<code>` 邊緣會被攔截並插入元素旁（程式碼一律如此
  標籤；對 Markdown 包覆剛建立的元素只執行一次，因此工具列先粗體後輸入
  仍會延伸）。
- **平穩且感知狀態的自動儲存。** 閒置 15 秒／輸入時最長 60 秒。草稿原地儲存；
  已發布／已排程／私人文章**永遠不會**由自動儲存寫入——編輯會備份至
  WP 自動儲存修訂版本（如 Gutenberg），且僅在更新／⌘S 時套用。儲存草稿按鈕、
  ⌘S、未儲存變更指示器、導覽時立即寫入，以及離開頁面警告，讓功能更加完整。
- **斜線選單會隨輸入篩選**（`/co` → Code）；第二個 `/`（字面路徑）會關閉它。
- **字數 · 閱讀時間**顯示在內文下方的固定膠囊中。
- **預覽使用網站的實際樣式。** `minimal-admin/v1/editor-styles` 收集所有
  已註冊區塊的樣式控制、佈景主題的編輯器樣式與全域樣式表；
  客戶端將每條規則限定於 `.minimal-island-preview`（html/body/:root 對應至
  容器）並注入一次。島的呈現方式如同前端；輸入表面
  刻意保留 Minimal 自有的排版。

## 界線如何隨時間移動

刻意逐一擴充 `SIMPLE_BLOCKS` 與 `EDITABLE_ATTRS`，一次處理一個區塊／屬性，僅在
往返已證明安全。後續兩項機制大幅移動了界線：**區塊
檢查器**（docs/block-inspector.md）讓島可設定，但不會讓它們可編輯，
以及**屬性直通**（`PASSTHROUGH_BLOCKS`）讓帶有屬性的
非文字流的簡單區塊——帶有 `{"id":…}` 的圖片、樣式化表格／引文／分隔線——維持
可透過將留言 JSON 停放在元素上（`data-minimal-attrs`）並重新輸出而編輯
在儲存時忠實保留位元組。文字流區塊（段落、標題、清單）經刻意
目前排除：contenteditable 會拆分複製的元素屬性，導致重複
標記。巢狀內容計畫將重新審視此排除，因為 Gutenberg 自己的拆分
將屬性複製到兩半，使重複成為正確語義，而非
損毀。島讓*不*支援某個區塊的成本變小——它仍會
會顯示並存續——因此沒有追求一致性的壓力。如果網站內容主要
複雜版面配置，Gutenberg 確實是正確工具，而 Minimal 應該擅長所有
編輯器*周圍*。

希望享有一流 Minimal 編輯體驗的作者，應建立**內容區塊**（動態、結構描述
優先處理文字、屬性），而非版面配置套件。契約與 Anchor Blocks 參考位於
[content-blocks.md](content-blocks.md).

## 巢狀內容計畫（正式計畫，2026-08-08）

回應 [GH #4](https://feicode.com/WenPai-org/minimal-admin/issues/4) 而撰寫：在一個
完整 FSE、僅核心區塊網站、群組內容鎖定。缺口現在已有測量，而非
只是軼聞。針對 Twenty Twenty-Four/Five 模式語料庫的分類探測（
（最接近一般使用者在 FSE 中建立的內容替代品）發現實際上**100% 的
頂層區段島嶼**，由 `group` 包裝器主導，且核心文字的 **63%
該標記中的任何區塊都會僅因屬性而變成島**，即使容器
已遞迴。問題項目排名：`fontSize`（165）、`style`（121）、`className`（38）、`textColor`
（22）、`fontFamily`（16）。可得出兩項結論。對 FSE 網站而言，容器是主要
問題，而不是屬性；屬性支援必須是逐字的*承載*，而非更長的
白名單，因為 `style` 是任意 JSON blob，沒有任何序列化器能從 DOM 重現它。

承載性先例已經發布：**details 島**會呈現一個
`contenteditable="false"` 外殼，內含 `contenteditable="true"` 內容，提交編輯
進入 `ed.islands[idx]`，而 Blink 會遵守邊界，因此在可編輯內部輸入
永遠無法合併進或破壞保留的外殼。容器支援將此概念一般化
模式，而不是重新建置編輯器。

三個階段，每個階段都能獨立發布，依序如下：

1. **文字流區塊的屬性承載**（中型）。擴充 `data-minimal-attrs`
   將屬性直通至段落、標題與清單，這些屬性位於
   `EDITABLE_ATTRS`：將留言 JSON 原樣停放在元素上，保留元素已儲存的
   DOM 中的類別與內嵌樣式照現狀保留，並在
   序列化。按 Enter 拆分會將標記複製到兩半，這符合 Gutenberg 的
   自身的拆分行為。以單一指令的 Blink 探測驗證拆分／合併／復原周邊建置
   標記。僅此便可解鎖 63%。
   ✅ *已於 2026-08-08 上線（v0.26.0 週期）*——`TEXTFLOW_CARRY_BLOCKS`（paragraph、heading，
   list）加入 `segmentEditable`；load path 會將完整的 attrs JSON 停放在元素上
   （对于列表，还包括每个列表项在其 `<li>` 上的自身属性——修复了一个既有漏洞
   其中 list-item attrs 在儲存時靜默消失）。serializer 會輸出攜帶的 JSON
   原封不動，只將 DOM 可編輯的鍵合併回去（paragraph `align`、heading
   `textAlign`，列表编号——表格 `hasFixedLayout` 的先例），保留 marker
   元素的 inline style（已儲存內容，豁免於 chrome style-strip），並維持
   空的標記段落視為真實區塊。已探測 Blink 事實（`scratchpad/probe-attr-carry.*`）：
   mid-split 會將 class+style+marker 複製到兩個部分（符合 Gutenberg 語意）；merge
   保留第一個區塊的 attrs（同樣正確）；end-split 會將 marker 複製到空的
   一半，因此 keydown observer 會從空的相同標記兄弟項移除 marker+class+style
   晚一個 frame（stack 外的 ATTR mutation 可安全復原——已探測；text mutation 則不可）；
   `formatBlock` HALF-丢弃属性（class+marker 消失，style 保留），这就是 block-TYPE
   轉換（Markdown `#`/`-`/`1.`/`>`/```` ``` ````/`---` 前綴、工具列區塊及
   list buttons）會在 marker blocks 上被拒絕，並顯示 toast。Inline marks 仍完全允許。
   測試套件：`tests/attr-carry.test.js`（20 項檢查，對已儲存 JSON 進行位元組一致性斷言）。
2. **島狀預覽中的可編輯文字**（中型，最高日常效益）。文字執行段
   機制（`textRunsOf`／`spliceTextRuns`）已能透過檢查器編輯島文字
   文字區域以位元組偏移拼接。將該編輯移至原位：預覽的文字執行段
   變成可直接編輯的內容，且每次編輯都會拼接回儲存的原始標記，這
   其他內容則維持原樣。序列化保真度由設計自然取得，而且能運作
   適用於每個島，包括核心容器與第三方區塊。已接受的限制，
   介面中已說明：僅限文字與內嵌編輯，不會按 Enter 拆分成新區塊。
   ✅ *已於 2026-08-08 上線（v0.26.0 週期）*——`armIslandTextRuns()` 會包裹預覽文字
   每次 preview render 後，在巢狀 `contenteditable` spans 中的 nodes，受 STRICT 條件限制
   对齐（每个原始文本运行都必须与其预览文本节点逐字节匹配，空白
   包含 padding；任何不一致都會使該 island 保持唯讀，並以 ⚙ inspector 作為
   之前——这是针对会重写文本的动态渲染的回退方案）。编辑会拼接到
   `ed.islands[idx]` 从每个输入的 arm-time 基础开始，因此 serialize 无需任何
   變更。建置所依據的閃現事實（已探測，`scratchpad/probe-nested-span.*`）：
   邊界：巢狀可編輯區中的 Backspace/Delete 是原生無操作，⌘Z 會追蹤跨範圍
   輸入時，箭頭鍵會在 runs 之間移動——但 ⌘A 會跳出到外部 body（受限），Enter
   插入 `<br><br>`（遭封鎖），而 `stopPropagation` 不會停止相同節點的 listeners，
   因此 run keydown 分支會使用 `stopImmediatePropagation` 或 markdown 包裹，而
   在 runs 內觸發 slash menu。`bindIslandGuards` 需要明確的 run bail：其
   否则插入符遍历会解析到岛屿本身，而运行内退格键会先启用，然后
   删除整个区块。嵌入/图库岛会被排除（它们的 URL 本身就是
   文字節點）。測試套件：`tests/island-runs.test.js`（20 項檢查、已儲存標記斷言）。
3. **容器插槽**（大型）。`group`／`columns`／`column`／`cover`／`media-text`
   將其實際包裝標記呈現為保留外殼（details-island 模式），
   其內部標記會標記化為子區段，簡單子項目會成為可編輯插槽，
   而複雜子項目維持為巢狀迷你島。序列化會將每個插槽的輸出重新拼接
   位於容器逐字節範圍之間，是文字執行段內容的區段級版本
   今天就能完成。第一次儲存可能會將受觸碰容器內的空白正規化，這
   既定的固定點慣例。插槽內的功能對等（Markdown 規則、
   工具列、斜線選單）會依功能逐步加入，絕不作為先決條件。深度可以
   仍限定於實際內容所需；在更深入遞迴前先測量語料庫。
   ✅ *Slice 1 已於 2026-08-08 上線（v0.26.0 週期）*——`SLOT_BLOCKS = ['group']`，單一
   深度，仅限 ALL-simple 子項（任何複雜子項 → 整個容器維持
   phase-2 island；目前還沒有巢狀 mini-island）。`slotParseContainer()` 會分隔原始
   分成 head/open/inner/tail，並透過 tag-depth scan 與 reassembly gate；children 會呈現
   透過與頂層相同的 `editableSegmentHtml()`（包含 phase-1 markers），
   位於逐字 wrapper 中的 `<div class="minimal-slot" contenteditable="true">` 內部
   open tag。序列化：`flushSlotIsland()` 將 `serializeToBlocks(slot)` 拼接到兩者之間
   僅在 slot 為 dirty 時輸出 wrapper 位元組（由 input 標記的 `data-minimal-slot-dirty`）；
   未變更的群組會輸出已儲存且位元組完全相同的原始內容。在 slots 中工作時，額外
   程式碼：輸入、Enter 分割、合併、行內 Markdown、復原、第一階段屬性
   攜帶。防護：island-guard 退出（插槽內的 Backspace，否則已啟用且
   删除了容器——即 run-bail 类），⌘A 被限制在 slot 内，纯文本
   paste（rich pipeline 的 block splicing 針對頂層調校），按每個 slot 的尾端
   功能提示，检查器会在建模前刷新脏插槽。同日，后续的
   slice 會在 slots 內禁止建立 BLOCK：markdown 區塊前綴（`#`…、`-`、`1.`，
   `>`，`---`)、工具栏的区块/列表按钮以及斜线菜单都会将该
   以最近的 `.minimal-slot` 作為其 block root（透過 `blockRootOf`/`topBlockIn`，因為
   整合流程，另加每個根的 `liftNestedLists`）。slot 內的 slash menu 僅提供
   適合 prose 的基本項目——標記為 `minimalSlotSafe` 的動作（標題、引文、pullquote，
   程式碼、清單、分隔線）；island 插入、媒體流程、表格和 Browse-all 仍會
   頂層。由此得到的根本原因修正：Minimal 從未設定
   `defaultParagraphSeparator`，因此 Blink 在 list-exit/insertParagraph 时创建了 `<div>`s
   （序列化器曾经掩盖了这些问题；前缀处理器拒绝了它们）——现在设为
   `p` 整个文档范围。COLUMNS 于同一天发布：
   一个全简单的 `columns` 区块会变成多插槽岛屿——每个插槽对应一个可编辑的
   `column`，两个嵌套层级的 wrapper 字节（columns 注释/开放标签以及每个
   欄的）原封不動保留；flush 會遍歷儲存的原始內容區段，並將每個區段拼接
   欄的序列化子項位元組位於其自身位元組之間，欄間空白會重新輸出
   未變更。編輯器端的 flex CSS 會映射前端形狀（某個欄位自己的
   flex-basis inline style 會套用，因為 open tag 是逐字內容）；虛線分隔線
   標記每個欄位的區域。任何欄位中的複雜子項 → 整個區塊維持
   第二阶段的岛屿。仍然不在插槽中：多区块粘贴、表格／代码芯片（顶层
   chrome）、cover/media-text、巢狀結構。套件組合：`tests/container-slots.test.js`
   （包括未更改组的字节级一致性、slot 斜杠菜单内容，
   逐欄拼接定位與插槽內部複製）。

### 寫作內容合約（整合階段，2026-08-08）

Slots 和 runs 表示編輯器現在有四種編輯內容：本文、容器
slot（mini-body）、island 文字 run（僅文字）與 live-field island——而每個
每個未來的 editor feature 都必須回答這些問題。兩件事防止它腐化：

- **单一规范解析器。** `blockRootOf( node, body )` 返回节点的
  容器插槽，否則使用本文；`topBlockIn( node, body )` 回傳其頂層
  该根节点中的区块。所有「遍历到顶层区块」的逻辑，只要应将
  slots 作為 mini-bodies 都會經過這些流程（markdown 前綴、工具列的區塊
  以及对齐按钮、行内代码、斜杠菜单、专注模式条带、
  程式碼片段空間啟發式）。使用這些功能的新功能會繼承插槽支援
  免費完成；新的 CONTEXT 只需教會一個函式。
- **有意保留的例外必须标注。** 必须保持以正文为锚点的遍历
  附带一条 `body-root by design` 注释，说明原因：岛屿插入（仅岛屿
  存在於頂層）、圖片 figure landing、區塊選擇器、區塊層級
  複製／剪下語意，以及 island 啟用／刪除防護（對插槽和
  在其 body 檢查執行前，先執行內部區段）。任何未來以 body 為錨點的走訪
  應該遷移，或說明不遷移的原因。

该流程发现的错误：slot 或 run 内的部分文本选择被解析为
透過 body walk 走訪到整個 island，因此複製兩個字會複製整個
区块。当选区包含在其中时，复制／剪切现在会退出并交由原生处理
一個 slot 或一個 run（suites：`container-slots`、`island-runs`）。

### 剩餘事項（交接，截至 2026-08-08）

以下所有內容都已限定範圍，但尚未建置。依建議順序排列，先從成本最低的開始。
這裡沒有任何內容是計畫要發揮作用所必需的：每個閘門的 fallback 都是
phase-2 island，支援就地文字編輯，這是可運作的體驗，而不是損壞的
一個。修改任何內容前，請先閱讀上方的 writing-context contract。

**可开始构建（小规模，每项约半天）：**

1. **slot 内的表格和代码芯片。** `syncTableChips()` 使用以下方式收集其目标
   `:scope > table` / `:scope > figure … img` / `:scope > pre` 僅針對本文，因此
   群組內的 table 或 code block 不會取得 ⚙ chip（因此也沒有列／欄操作或
   語言選擇器）。定位已可在任何深度運作——chips 位於
   `#minimal-table-chips` 位于滚动容器内的内容坐标处。修复方法是在编辑器绑定时运行
   依每個區塊根節點收集（本文及每個 `.minimal-slot`），即 `liftNestedLists` 結構。
   注意：結構高度複雜的頁面上的晶片數量（以下的視覺雜訊問題）。
   ✅ *已於 2026-08-09 上線*——每個根的 collection 已以範圍限定方式完成。真正的工作是
   DIRTY-STAMP 半部：直接變更 DOM 的晶片操作（`setCodeLang`、image-popover
   （应用／替换）从不触发 `input`，因此 `flushSlotIsland` 会在
   save——`stampSlotDirtyFor( el )` 現在會在這些項目上手動標記包含它們的 island
   paths。execCommand paths（所有 table 操作、image remove）不需要呼叫：已探測
   （`scratchpad/probe-slot-chips.js`），Blink 会在 slot 宿主上触发 `input`，以
   巢狀可編輯項目中的 selection，而 body 現有的 input handler 會標記它。
   另外：table-delete 现在通过 `blockRootOf` 放置插入点，因此删除 slot 表格
   落在其 slot 中，而不是文件頂層。Suite：`container-slots` 增長到 39
   （芯片存在性、代码语言 + 行操作往返经过保存的原始内容、删除落点）。
2. **将多区块富文本粘贴到 slot 中。** 目前 slot 粘贴有意处理为纯文本
   （`body.addEventListener('paste', …)` 捕获分支）。`pasteBlocksInsert()` 括号
   payloads 帶有 `<p data-minimal-bkt>` markers，並在頂層重建 islands；
   泛化方式是相同的根節點替換，再拒絕 slot 內的 island-class payload
   （它们需要嵌套岛，第 5 项）。套件应覆盖包含多个段落的 Word/Docs
   paste 會以群組內的獨立區塊落地。
   ✅ *已於 2026-08-09 上線*——capture-phase 純文字攔截已移除；slots 會透過
   主流程。`pasteInsert`/`pasteBlocksInsert` 會取得游標所在的 block root
   （`blockRootOf`，每个根执行括号标记扫描 + 列表提升），因此经过清理的 Docs/Word
   payloads 會在群組內以獨立真實區塊落地，並在儲存時拼接。Guards、
   全部以 SELECTION 的插槽为依据（`selSlot` — 对合成事件而言，e.target 毫无用处
   ClipboardEvents（在 body 上分派）：嵌入 URL 快速路径和剪贴板
   image FILES 維持在頂層（slot 中的 media flow 是未來工作；僅檔案貼上
   在 slot 中是無操作），而 `text/x-minimal-blocks` payload 只有在以下情況才會拼接到 slot 中
   每個區段都可編輯——island 類別的 payload 會落入 html/text
   flavor 中並以 prose 落地。Suite：container-slots 44（多區塊 html 貼上已儲存
   群組內部，多行文字 → 段落，拒絕 island payload）；這兩個
   舊有的 plain-paste 檢查已翻轉為驗證 rich 行為。鄰近項目為綠色：paste
   37、island-runs 21、media-flow 14、undo-toast 22、island-copy 14、attr-carry 20。

**可开始构建（中等规模，每项 1–2 天）：**

3. **Cover 和 media-text slot。** 这些会破坏 `slotParseContainer()` 关于
   子項直接位於 wrapper 的開頭標籤內：`cover` 是
   `wrapper → background span/img → inner-container div → children`，`media-text` 是
   `wrapper → figure → div.wp-block-media-text__content → children`。为每个区块添加
   「content container」 定位器，使解析结果包含 head/open/**preamble**/inner/tail，其中
   背景／媒體位元組與其他內容一樣原封不動保留。重新組裝 gate
   仍由它決定：沒有位元組完全相同的解析結果，就沒有 slot。維持相同的 dirty-flush 合約。

**最后一大块（大规模，3–5 天，最后执行）：**

4. **嵌套容器**（组内嵌套组）和 **5. 嵌套岛**（图像、
   群組中的 embed 或第三方區塊）是同一個專案，而不是兩個。今天
   `slotChildSegments()` 对任何非简单子项返回 null，这正是保持其
   保護機制很簡單：`bindIslandGuards` 對 slot 內部整體中止，
   island inserts 依設計以 body 為錨點，而 `ed.islands` 是扁平的頂層陣列。
   允许 slot 内存在岛意味着必须按每个根重新限定所有这些内容，而不是直接退出：
   每个插槽的启用／删除防护和撤销提示、插入流程（斜杠菜单／选择器／粘贴／图像
   上傳）以 slot 為目標，而 island 索引位於容器已儲存的原始內容
   而不是扁平陣列。巢狀容器因此自然產生（群組子項是
   只是另一個 slot island），而 `SLOT_BLOCKS` + all-simple gates 可以被刪除——
   每個群組／欄位都會變為可寫入，其中複雜子項會作為受保護卡片保留在內部。
   這就是計畫的真正最終狀態。

   **在构建之前先测量。** 重新运行语料探针，提出一个不同的问题
   比上次更重要：*真實容器中有多少比例是 MIXED*（簡單與複雜子項混合）？
   如果混合容器很少見，目前的 fallback 已涵蓋實際內容，而這
   item 可以無限期維持未建置——這是合理的停止點，而不是妥協。
   先前的探測測量的是哪些區塊形成 island，而不是哪些容器是混合的。

   ✅ *已於 2026-08-09 測量*（`scratchpad/probe-container-mix.php` + `-names.php`，TT4+TT5
   patterns、155 個 patterns／494 個 container units）。**Mixed 是常態，而非例外——
   「stay unbuilt」退出條件並未成立。** 在 494 個單元中（欄位以其
   欄作為一個單位）：20% 全部為簡單項目，39% 僅因巢狀容器而混合，41% 攜帶一個
   複雜葉節點。在頂層，131 個容器中目前有 3 個支援插槽（2%）；僅由巢狀結構造成的
   （第 4 项）将其提升至 26（20%）；其余 105 项需要嵌套岛（第 5 项）——因此
   兩個項目已確認為同一個專案，而這就是剩下的全部工作。該
   複雜葉節點分布是令人鼓舞的部分：範本結構（pattern、query、
   post-*/site-*/query-*、導覽、template-part）主導整個語料庫，卻從未出現
   在 POST content 中——對 post-shaped content 而言，leaf 問題基本上會縮減為
   **间隔块（122）+ 按钮（31）**，两者目前都能作为行为正常的岛渲染。
   重新排序優先級：**項目 3（cover/media-text）不作為獨立切片處理**——
   media-text 在語料中出現零次，cover 出現 21 次，但幾乎總是巢狀
   群組內部（此語料在頂層的覆蓋率增益：零）。將 cover 加入作為巢狀
   當 item 4 到位時的單元。需要保留的注意事項：此語料庫以 FSE-template 為主；它是
   與原始 63% probe 使用相同的 stand-in，因此數字可以比較，但它們
   相較於 writer 的 post 中實際存在的內容，過度描述 template constructs。

   ✅ *Slice 1 已於 2026-08-09 上線——巢狀 islands + 巢狀容器已啟用。* 該
   「全简单」门槛已删除：所有内部标记能够解析的 group／columns 都会变成一个
   slot island；複雜子項會以受保護的巢狀 islands 渲染（預覽、runs、
   live fields、inspector、⚙ chips 都能透過既有的 per-root machinery 運作）
   并且容器子项会递归处理（group 嵌套 group、columns 嵌套 group，以及任意深度）。哪些
   該 slice 實際包含：(a) `slotChildSegments` 保留複雜區段；
   `slotIslandHtml`/`islandHtml` 采用 `ed` 并注册子 islands（在一个位置不使用 `ed`
   insert site → plain island，重新載入時升級——這是既有的不對稱性）；
   (b) `flushSlotIsland` 过滤为自有 slot（`closest('.minimal-slot-island') === el`——
   后代查询会导致列遍历错位，因为插槽会嵌套）；嵌套插槽
   islands 會透過 `serializeToBlocks` 既有的遞迴進行 flush；(c) THE LOAD-BEARING
   不變條件：任何對巢狀 island 的 `ed.islands[idx]` 寫入，或任何直接 DOM 編輯
   slot 內部必須將每個祖先 slot island 標記為 dirty（`stampSlotDirtyFor` 會遍歷
   向上；由 input handler、兩個 undo helper、`replaceIsland` 呼叫，
   `applyInspector` 以及三个 live-field 提交）——未加戳的祖先会发出其
   過時的已儲存原始內容，並靜默捨棄巢狀編輯；(d) `bindIslandGuards` 是
   根範圍（SELECTION 中的 `blockRootOf`；`isRootChild` = body 的直接子項
   或 slot），而不是因為 slots 就退出——Backspace 會啟動／移除巢狀 islands，並且
   相同的兩次按鍵 + undo-toast 模型；`.minimal-island-run` 的中止仍保留；
   （e）用于可编辑性检查的「最近包装器」规则（图像点击、链接点击、表格
   上下文選單）：`.minimal-block-island, .minimal-slot` 中最接近的項目——插槽表示正在寫入
   surface，island 代表預覽 chrome；(f) 針對 slot 範圍的 CSS twins，用於
   table/image cutouts 與儲存格格線（`.minimal-slot > …` 旁邊
   `.minimal-editor-body > …`）；(g) `armIslandTextRuns` 明确跳过 slot islands
   （否则其后代预览查询会遍历嵌套岛的预览
   针对容器的原始内容）。测试套件：新增 `tests/nested-islands.test.js`（16 —
   spacer+buttons leaves、group-in-group 雙包裝器拼接、除以外
   buttons live-field 的首次儲存 fixed point、巢狀 arm/remove/undo/save）；
   `container-slots` 44 重新固定到新模型（复杂子项不再下沉
   該容器——acme columns 是一個帶有巢狀 badge 的 slot island）；
   `island-runs` 21 重新修正至 FOREIGN wrapper 區塊（容器一律使用 slot
   現在，因此 runs 屬於非容器 islands）。

   ✅ *Insert flows 已於 2026-08-09 上線（同日，後續 slice）。* Slots 會接受
   目前完整的插入介面：slash 選單的 slot 篩選器與 `slotOk`/`minimalSlotSafe`
   機制已刪除（每個項目，包括僅供搜尋的 design／pattern 項目以及
   （在 slot 中浏览全部内容），⌘/ 区块选择器以插入点所在根为目标，嵌入 URL
   paste islands 位於 slot 中，Minimal-blocks paste payloads 會拼接巢狀 islands，而
   media flow（貼上／拖放 image files、picker inserts）會落在游標所在的 slot。
   機制：`insertIsland`/`insertPatternIslands` 具備根節點感知能力，傳遞 `ed`（一
   立即插入 group slots）並標記祖先 slots（insertAdjacentHTML 會觸發
   沒有輸入——⌘/ 路徑從未輸入「/」，因此不能依賴 typing stamp）；
   `runSlashAction` 的 direct-DOM 分支（action.html、action.block、command r.html）
   標記其落點段落；`insertImageFiles` 的受限游標跳轉會落在
   slot 內部。Suites：nested-islands 20（slash table 插入＋embed 貼上往返
   次觸發），container-slots 重新固定 44 項（完整 slot menu；island 貼上現在會 SPLICES），
   patterns 9、block-picker 10、stackable-designs 19/20。TWO SUITE-LATENCY PHANTOMS
   順帶修正：patterns 和 stackable-designs 都使用扁平的 post-⌘S 等待
   （rule-77 类）并读取过时的原始内容——现在两者都会轮询预期内容。
   stackable 的剩餘失敗案例（「add 會複製靜態欄」、2 個欄位中有 1 個
   預期）是 PRE-EXISTING（已二分確認：在預巢狀 adec8ba 中完全相同），看起來
   如同 upstream CDN 設計漂移——在下一次 design-suite sweep 時重新固定，不要
   將其視為巢狀回歸問題追查。

   ✅ *Comment-tolerant slotting 已於 2026-08-09 上線（Austin 的換行回報）。*
   AI 生成的标记会使用普通 HTML 注释标记各个区段
   （`<!-- Testimonial 1 -->`）；这些自由格式区块过去会使容器下沉到
   phase-2 runs island——其中 Enter 按鍵是 BY DESIGN 被阻擋的，這會被理解為「我無法
   讓換行返回。」僅 comment 的 freeform（`slotIgnorableHtml`）現在通過
   slot gate：它會以 DOM comment nodes 的形式進入 slot，`serializeToBlocks`
   重新輸出 COMMENT_NODE（僅限一般註解——絕不包含 `wp:`），而欄
   flush 會從儲存的 raw 重新輸出欄間 comment segs。修正方式是
   「在运行中按 Enter 不起作用」始终意味着 MORE SLOTTING，绝不是 Enter-in-runs——
   會依位元組偏移拼接文字，而結構鍵會造成損毀。測試套件：
   nested-islands 30（comment-labeled group slots；在 comment 旁按 Enter；
   髒狀態，重新 flush 時會重新輸出）。

   ✅ *Raw-markup paste 已於 2026-08-09 上線（Austin 的要求）。* IS block 的純文字
   markup（以 block comment 開頭，可乾淨 tokenize）會在以下情況重建為真實區塊
   paste——可編輯區與 island 的分離，與 `text/x-minimal-blocks` flavor 相同。Code
   上下文會保留原始貼上內容（寫入 ABOUT 標記不會進行轉換），而 html
   這些貼上操作會忽略 flavor（code-viewer 複製內容會將標記包在樣式化
   html；text flavor 才包含真正內容）。Suite：paste 40。

   ✅ *Cover + media-text slots 已於 2026-08-09 上線（同日，最終 slice）。*
   `SLOT_CONTENT` 将区块映射到其内容容器类
   （cover → `wp-block-cover__inner-container`，media-text →
   `wp-block-media-text__content`）；`slotParseContent( raw, short )` 包裹
   `slotParseContainer` 并产生 head/open/**preamble**/inner/tail——preamble
   就是從 wrapper 的 open tag 到 content container 的 open
   tag（背景、media figure），像 wrapper 位元組一樣原封不動保留；該
   內容容器必須是最後一個子項（其關閉標籤之後只能有空白），否則
   gate 失敗時，區塊會維持為 island，而重新組裝的識別性現在
   包含前導內容。REGEX LESSON：content-open matcher 必須是純粹的
   `<div[^>]*\\bCLASS\\b[^>]*>` ——属性交替形式
   （`[^>"']|"[^"]*"|'[^']*'`）会使该类的带引号内容无法访问
   match（帶引號的字串只會匹配完整 token），因此它絕不會找到該 class
   位於 `class="…"` 內部。Editor CSS 僅近似前端 SHAPE
   （`.minimal-media-slot-island`：封面背景绝对定位于 z-index 提升的 slot 后方，
   media-text 作為 2 欄網格）。SLOT_BLOCKS 現在是 group/columns/cover/media-text。
   測試套件：nested-islands 27（cover + media-text 位元組一致性、前導內容逐字保留
   兩者的編輯）。剩餘工作：chip 密度設計階段；對整個
   在 anchor.localhost 上進行巢狀循環測試，然後再納入 release。

**关注事项（不在范围内，但应在交付上述内容前决定）：**

- **芯片和提示密度。** Slot + 嵌套岛会使 ⚙ 芯片和悬停提示在一个
  結構化頁面。Hover-reveal 已存在；深度巢狀頁面仍需要設計層面的解答
  在第 5 项发布之前，而不是之后。
- **`defaultParagraphSeparator`。** 整合阶段的修复将其设置为整个文档的 `p`
  在编辑器绑定时修正了一个既有问题（Blink 在退出列表时会创建 `<div>`s；
  serializer 掩蓋了這些問題）。所有測試套件都通過，但這類變更
  邊界會在實際寫作中出現，而不是測試中——在 anchor.localhost 上進行一週 dogfood
  在发布版本前完成。
- **`code-trap.test.js` 为 11/12**，且在本周期之前就已如此（通过暂存验证
  這些變更）——這是已知的高負載儲存競態類別，而不是巢狀內容回歸。
  不要把它當成一件事來追查。

**负责此工作的套件：** `tests/attr-carry.test.js` (20)、`tests/island-runs.test.js`
(21)、`tests/container-slots.test.js` (34)。对 slot/run/carry 机制的任何变更
應維持三項全數通過，並加上 `markdown`、`paste`、`undo-toast`、`island-copy`，以及
`media-flow`（對 Enter/剪貼簿敏感的相鄰項目）。

這項計畫不會改變永不建置清單。插槽會編輯版面配置內的**內容**；
版面配置本身（間距、變體、查詢迴圈、區塊插入器的完整目錄）仍然
Gutenberg 的工作，一鍵即可使用。所有未變更內容的位元組識別保持
每個階段都不可妥協的不變條件。
