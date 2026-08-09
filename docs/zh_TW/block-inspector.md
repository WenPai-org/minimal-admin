# Block inspector — 不使用 Gutenberg 編輯複雜 blocks

**狀態：五個步驟全部已發布（v0.4.0 週期）— code language attribute（加上 hover/caret
可編輯 code blocks 上的 ⚙ chip popout），以及 attribute/dynamic islands 的 inspector
server-rendered previews（`minimal-admin/v1/render-blocks` 取代每個 block 的
`block-renderer` idea — 它會呈現完整 islands，包括含 dynamic 的靜態 parents
children）、單層 child editing、add/remove/reorder children（須以「structural」
InnerBlocks 結構：wrapper HTML 原樣保留，children 之間僅允許空白），並且
`minimal_admin_block_forms` filter 搭配 `wrapperText` — 這提供了有用的子集
「parent editing」：wrapper 內宣告的文字（例如 conversation header）可編輯
透過三個 capture groups 的 pattern，僅在變更時替換。Adapters 會內建於
整合式外掛（Anchor Blocks `app/MinimalAdmin.php` 是參考實作），不會內建於 Minimal。
靜態 InnerBlocks wrappers 的完整 parent-attribute regeneration 仍刻意
尚未建置 — 需要 block 的 JS `save()`，並留在 parity
treadmill。**

**後續兩項新增（v0.5.x 週期）：** `core/embed` / `core/gallery` 上的 inspector
island 提供 **「Change URL…」/「Replace images…」** — 這些操作會整體重新生成 island
透過建立 embeds 與 galleries 的相同 templates（`embedTemplate()` /
`galleryTemplate()`），因為其內容存在於已儲存的 HTML 中，單獨編輯 attributes
無法重新定位它。Gutenberg 設定的 captions/layout attributes 會依設計重設；popover
note 已如此說明。而 island previews 現在會以網站的**實際前端樣式**呈現 —
`minimal-admin/v1/editor-styles` 收集 block style handles + theme editor styles +
全域 stylesheet，而 client 會在套用前將每條規則限定於 `.minimal-island-preview`
注入（見 editor-direction.md，「The writing surface」）。

**v0.8.0 後新增（自動註冊 inserts）：** 動態第三方 blocks 不再
需要 adapter 才能插入。`Minimal_Admin::insertable_blocks()` 會遍歷 block-type
啟動時的 registry（dynamic + top-level + inserter-visible + non-core；adapter `insert`
descriptors 具有優先權，`insert => false` 會抑制，`minimal_admin_insert_blocks` 會篩選
結果），而 slash menu 會將其作為 **僅供搜尋**的項目：預設清單仍然
已整理，且輸入內容會比對 title 或 namespace。Self-closing comment 是有效的已儲存
僅在 block 的 JS `save()` 為 null 時才是 markup — `is_dynamic` 並不保證這一點
（stackable/posts 將 render_callback 與會輸出 wrapper HTML 的 JS save 配對；一個單獨的
comment 會呈現空白並且無法通過 Gutenberg validation）。Server 無法看見 JS `save()`，因此
已發布的 discriminator 是 **render probe**：其裸 comment 會呈現
沒有任何項目會被排除（快取於以 candidate set 為鍵的 transient 中）。Static-save blocks
依據下方「誠實的限制」仍會排除 — 但請參閱 `adapters/stackable.php` 以了解
scrape-the-data counter-move：當外掛將其設計以序列化 markup 發布時
（Stackable 的 CDN design library），這些模板會以無 runtime 的有效 islands 插入。

**一般文字 runs（同一週期）：** 誠實的限制變得更窄。靜態 block 的
STRUCTURE 與 STYLING 仍無法在 Gutenberg 外重新生成，但其 TEXT 只是
saved HTML 中的 text nodes — 因此 inspector 會依 offset 掃描 island 的 raw markup
（`textRunsOf`：跳過 block comments、tags 及 style/script/svg 子樹），並呈現一個
每個 text node 一個 field，無論巢狀多深，即使是沒有已註冊
attributes。變更的 runs 會以 last-to-first 方式插回，僅進行 text-node escaping；
未變更的 runs 永不重寫，以保留 byte-identity。Gutenberg 仍能正常運作，因為
這些 blocks 會從相同 HTML 取得其文字 attributes。Children 已由
單一元素文字編輯器（`childTextOf`）會保留 — 兩條路徑彼此互斥
每個 child 僅限一個。

**Image swaps（同一週期）：** 圖片的 sibling move。靜態 blocks 會鏡像一個
在 comment JSON（`imageUrl`、`blockBackgroundMediaUrl`）與已儲存 HTML 之間的 image URL
（`img src`、`background-image` 樣式），因此 `swapIslandImage()` 會取代 URL 字串
到處（加上其 serializeAttributes-escaped 形式），重新定位成對的 `XxxUrl`/`XxxId`
以 URL 所在的 comment 為範圍處理 media ids，並更新 `wp-image-N` classes
已替換的 `img` tags。Inspector 的 Images 區段會列出 island 中的每張圖片，並附有
將 Replace button 放入 media picker；待處理的欄位編輯會合併至 raw 的第一個
（`buildInspectorRaw`，與 Apply 共用），因此不會遺失任何輸入內容。Embed/gallery 保留
其專用 rebuild flows — generic swap 會在此抑制，因為 core image
comments 會攜帶裸的 `id`，URL-key heuristic 無法安全地重新定位。

Block islands 讓複雜內容變得*安全*（見 [editor-direction.md](editor-direction.md)）—
這是讓它們*可用*的計畫。目標是：點擊 island，取得一個小型 inspector
在旁邊開啟 popover，直接編輯 block 設定，並觀察 preview 更新。不使用 React，
不需要 build step，也不會改變 safety model。

## 為何這完全可行

關鍵認知：對 **server-registered blocks** 而言，inspector 所需的一切已經
以 core REST endpoints 形式存在 — Minimal 驅動與 Gutenberg 相同的 server-side machinery，
不含 React shell。

| 需求 | Endpoint | 已驗證 |
|---|---|---|
| 此 block 有哪些 attributes？ | `GET wp/v2/block-types/<namespace>/<name>` → 完整 attribute schema，含類型與預設值 | ✓ 對 `anchor/conversation-message` 回傳 `role` / `label` / `content` |
| 使用這些 attributes 時看起來如何？ | `GET wp/v2/block-renderer/<name>?context=edit&attributes={…}` → server-rendered HTML | ✓ 使用任意 attrs 呈現 `anchor/stat-card` |

Self-closing dynamic blocks（`<!-- wp:anchor/stat-card {"value":"85","label":"…"} /-->`）是
**純 attribute containers** — 沒有已儲存的 HTML 可失效，因此編輯它們實際上就是
重寫 comment 內的 JSON。Island 的 raw markup 已逐字儲存並插回
在儲存時恢復；inspector 只會修改該儲存字串。byte-identity 的任何部分
model 變更。

## 設計

1. **Trigger** — island chip 上的 ⚙ 操作項（以及直接點擊 chip）。開啟一個
   錨定於 island 的 popover，與 slash-command menu 同屬一套視覺系列。
2. **Schema-driven form** — 取得一次 block type（每個 session 快取），從其生成欄位
   attribute schema：`string` → input、`boolean` → switch、`number` → number input
   `enum` → 選取。跳過 `lock` / `metadata` / `style`（Gutenberg plumbing）。
3. **Apply** — 重寫 island 儲存之 raw markup 中的 attributes JSON：對於 self-closing
   blocks，重建整個 comment；對 wrapped dynamic blocks，只重建 opening
   comment，並保持 inner HTML 不變。
4. **Preview refresh** — 將新 attrs POST 至 `block-renderer`，並替換 island preview。
   沒有 `render_callback` 的 blocks 保留其靜態 preview。
5. **Serialize** — 不變。Islands 仍會從儲存的 raw markup 原樣傳遞。

### 巢狀 islands（`anchor/conversation`）

Conversation block 是靜態 InnerBlocks wrapper，其 children 是 self-closing dynamic
`conversation-message` blocks。`tokenizeBlocks()` 已經分割巢狀內容，因此
inspector 可列出 children，並以相同的 schema-driven form 編輯每個 child — 包括
add / remove / reorder，因為 children 是 attribute-only comments。Parent 自身的 wrapper
markup（`<div class="wp-block-anchor-conversation"><div class="ab-conv-header">…</div>`）是
可重現，但由 block 的 JS `save()` 儲存，因此重新生成它可能導致 Gutenberg 的
block validation — **先發布 child editing，最後才發布 parent-attribute editing，並置於
round-trip 測試。**

### Code block（最先發布，獨立於 inspector）

`<!-- wp:code {"language":"sql"} -->` islands 目前之所以只能運作，是因為 `language` 不在
`EDITABLE_ATTRS`。加入 `code: [ 'language' ]`，將 attribute 對應至現有 toolbar
載入時的 language picker，序列化時重新輸出 attribute + `language-*` class。Block 會變成
完全可編輯，而 picker（於 v0.2.0 內建）可直接運作。小而高價值 — 最常見的
在真實內容上的 island。

## 誠實的限制

**靜態第三方 blocks** — 其 `save()` 位於 editor JS bundle 中者 — 仍然
verbatim islands。變更其 attributes 需要重新生成 HTML，而只有 Gutenberg runtime
能產生的內容；這就是 editor-direction.md 拒絕加入的 parity treadmill。他們已經
顯示並安全地保留編輯，而 WordPress 已將 block development 推向 server-side，
多年來，因此可達集合會自行持續增長。

希望獲得一級 Minimal editing 的作者，應遵循 **content-block contract**，位於
[content-blocks.md](content-blocks.md)（dynamic leaves、PHP schema、選用的
`minimal_admin_block_forms`）。這就是 Anchor Blocks 能在 Minimal 中保持可編輯，而不必讓 Minimal
變成 layout runtime。

## 擴充點

僅靠 Schema types 無法表達意圖：`role` 實際上是 user/assistant enum，`content`
應有 textarea，`color` 是固定色盤。`minimal_admin_block_forms` filter（相同
declarative-descriptor pattern 作為 surfaces 與 editor panels — 見
[for-plugin-authors.md](for-plugin-authors.md)）讓外掛可為其生成的表單進行微調
自有 blocks：labels、control types、option lists、field order。Anchor Blocks 成為
reference adapter，角色與 ACF 在 editor panels 中相同。

## 排序

1. `code.language` 透過 `EDITABLE_ATTRS` — 很小。
2. attribute-only / dynamic islands 的 Inspector（stat-card、callout、timeline-item…）—
   核心建置：schema fetch、form generation、comment rewrite、renderer preview。
3. InnerBlocks islands 內的 child-block editing（conversation messages）。
4. `minimal_admin_block_forms` filter + Anchor Blocks descriptors。
5. （也許是最後一項）簡單 InnerBlocks wrapper 的 parent-attribute editing，須以已驗證結果為門檻
   往返。
