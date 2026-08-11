# Block-suite 實驗室結果（2026 年 7 月 6 日）

可丟棄的本機 WordPress site，啟用 minimal-admin 並安裝五個 suites：
**Kadence Blocks 3.7.8、Spectra 2.19.29、GenerateBlocks 2.3.0、Otter 3.2.0、
Essential Blocks 6.3.0**。Stackable 結果（參考整合）位於
[block-inspector.md](block-inspector.md) 和 `adapters/stackable.php`。

## 無需任何 adapter 程式碼即可運作的部分

已針對實際的 Otter pattern 頁面驗證：islands 保留 `atomic-wind`/suite 標記
經過兩次儲存仍逐位元相同，預覽會由伺服器 render，文字執行區可編輯，
且核心 editor suites 在實驗室網站上未經修改即可通過（markdown 20/20，全部五個
suites 啟用）。通用機制——islands、render probe、text runs、image swaps，
lazy-CSS 擷取——不需要任何 suite 專用程式碼。

## Registration models（從 server 角度看）

| Suite | Blocks | `is_dynamic` | 真實伺服器 attrs | Render-probe 通過 |
|---|---|---|---|---|
| Essential Blocks（基礎區塊） | 75 | 75 | 75 | 6 |
| Kadence（Kadence 區塊） | 59 | 59 | 59 | 0 |
| GenerateBlocks（生成區塊） | 16 | 16 | 16 | 0 |
| Spectra（uagb）| 13 | 12 | 13 | 9 |
| Otter（themeisle-blocks）| 40 | 11 | 40 | 6 |

重點：在此情境中，`is_dynamic` 作為「server-rendered」訊號幾乎沒有意義
生態系統。Kadence 和 GenerateBlocks 為每個 block 註冊帶有 render_callback 的
存在的目的在於*產生 CSS 或裝飾已儲存內容*，而非產生標記——單獨的
comment 會 render 為空。Essential Blocks 約 40 個「static」blocks 的 callbacks 只會
回傳 `$content`。render probe 是唯一誠實的 gate，而且確實通過：它所
passes（post grids、FAQs、maps、feeds、breadcrumbs）確實可從單獨的 comment 運作。

不同於 Stackable，五者都會在 server-side 註冊**真正的 attribute schemas**，因此
通用 inspector 有足夠素材可處理。但 Spectra 的 schemas 非常龐大
（uagb/post-grid：315 個 attributes，313 個可呈現於表單）— generic form 需要具備擴展
在可用之前先採用策略（請參閱 roadmap）。

## Template/pattern libraries — markup data 的所在位置

| Suite | Source | 標記作為資料？| 帳戶？|
|---|---|---|---|
| Otter | **61 個本地 PHP pattern files**，已註冊於 `WP_Block_Patterns_Registry` | 是，位於磁碟 | 否 |
| Essential Blocks | **12 個本地 JSON pattern files**（`patterns/*.json`），已註冊為 patterns | 是，位於磁碟 | 否（Templately packs 受限制且未接線） |
| Kadence | Cloud（`patterns.startertemplatecloud.com`），透過自有 `kb-design-library/v1` REST proxy；在 uploads 中進行檔案快取 | 是——`get_pattern_content` 會回傳序列化標記；免費 sections 使用空的 api_key 提供 | 免費層級否 |
| Spectra | Cloud（`websitedemos.net` REST），透過其 ajax proxy；catalog 已同步至 uploads 中的 JSON files | 是——template content endpoint 會回傳標記 | blocks/pages 否 |
| GenerateBlocks | Cloud（`patterns.generatepress.com`），plugin 中硬編碼了**公開金鑰**；自有 `generateblocks/v1` REST proxy，使用 transient 快取 | 是 | 否 |

五者都會將其 design markup 發布為可 fetch 的資料。Stackable
adapter 形狀（精簡清單端點＋可直接插入的 template 端點，含圖片 sideload）
直接傳遞；而 Otter＋Essential Blocks 甚至不需要這一步——它們的
patterns 已存在於核心 pattern registry 中。

## CSS 模型 — 為何 previews 可能呈現未套用樣式

經實證確認：`uagb/faq` 與 `essential-blocks/post-grid` 不會 enqueue **任何內容**
在單獨的 `do_blocks()` render 期間。每個 suite 都會從 attributes 產生 instance CSS
並透過僅限前端的機制輸出：

- **GenerateBlocks**：每個 block 的 `css` attribute；render_block path 會預先加入 inline
  僅在 `did_action('wp_head')` 或 **`generateblocks_do_inline_styles` 時使用 `<style>`
  filter** 為 true。提供單行 shim。
- **Kadence**：每個 block 的 base stylesheets 會在 render 時延遲註冊（queue-diff 位於
  render-blocks 會捕捉這些），另有由 `render_css()` 預先加上的 instance CSS——
  但在 block themes 上會被抑制，因為它會經過 `wp_enqueue_scripts` head pass
  需要真正的 `$post`。
- **Otter**：CSS 會在儲存時生成至 postmeta `_themeisle_gutenberg_block_styles` +
  一個 uploads 檔案；僅在 `wp`/`wp_head`/`wp_footer` 搭配 `is_singular()` 時輸出。
- **Spectra**：每篇文章的 CSS 由 `UAGB_Post_Assets` 在 `wp_enqueue_scripts` 上建立
  （預設 inline；`uploads/uag-plugin/` 中可選 file mode）。
- **Essential Blocks**：CSS 會嵌入每個 block 的 `blockMeta` attribute，位於已儲存的
  標記；儲存時 materialize 至 `uploads/eb-style/eb-style-{post}.min.css`，並
  以真正的 `$post` enqueue。

- **Gutenslider**（添加于 2026-08-10）：第六个模型，也是唯一一个没有服务器端
  收集器可以访问。其基础布局样式表（`build/vendor/gs-base.css`，即
  幻灯片所基于的内容由前端脚本作为 webpack 异步区块获取，因此它
  完全不会经过 `wp_styles()`。插件自身的
  `wp_enqueue_style('eedee-gutenslider-block-editor')` 指向一个仅注册为
  *script* 的句柄，因此即使如此也不会执行任何操作。没有该样式表，背景 div 和幻灯片
  内容堆栈按正常流排列，内容则被固定高度框架裁剪掉。

render-blocks 的 **style-queue diff** 覆盖延迟注册类（Stackable、Kadence
基础样式）。每篇文章生成的类需要每个套件的垫片——候选项按排名列于
路线图。**运行时加载**类（Gutenslider）由运行时 CSS
采集：`harvestRuntimeStyles()` 在隐藏的同源
iframe 中加载文章前端（Otter 预热已使用该 iframe），读取页面自身脚本的 `<link>` 样式表
被引入，并通过相同的作用域处理器发送新增内容。触发条件是几何关系，而不是
特定于库：预览内容在自身底部边缘处或超出该边缘。运行时 `<style>`
元素会被有意跳过（页面的内联 CSS 大多已经由服务器
已报告）。套件：`tests/runtime-css.test.js`，装置：`minimal-test/runtime-css`。

## Image attribute conventions（用於 `swapIslandImage` coverage）

- Flat `XxxUrl`/`XxxId` pairs（已處理）：Essential Blocks（`imageUrl`/`imageId`、
  有時為 `imageURL`）。
- **`bgImg` ↔ `bgImgID`**（Kadence rows/sections；也包括 `overlayBgImg`、responsive
  `tabletBackground`/`mobileBackground` arrays 中的 variants）：key＋`ID` 配對尚未
  已處理。
- **Media objects `{ url, id, alt }`** 位於單一 attribute 中（Spectra `image`、
  `backgroundImage`、`mediaGallery[]`；Otter `image`、`backgroundImage`；EB
  `image`、`sources[]`）：URL 置換可運作（字串取代），id 重新指向需要
  相同物件 heuristic。
- **GenerateBlocks**：完全沒有 URL attribute — `mediaId` + `htmlAttributes.src` +
  `data-media-id` 位於 `img` 上。URL 置換可運作；id 位於 `mediaId`/`data-media-id`。
- **Otter slider**：`img[data-id]` 儲存 attachment id。
- JSON-escaped `https:\/\/` URL forms 會出現在 server-authored markup 中 — 已處理，版本為
  這次掃描（Kadence 自己的 importer 也進行相同正規化，驗證了
  整體採用 string-surgery 方法）。

## Roadmap（排名）

1. ~~**Server-registered patterns in the slash menu**~~——**已交付**（同日）：
   `minimal-admin/v1/patterns`（精簡清單；以 blockTypes/templateTypes 為上下文的 patterns
   已排除、postTypes 限制由 client 篩選）＋`minimal-admin/v1/pattern?name=`
   （content；query arg，因為名稱包含斜線）。Multi-root patterns 會插入為
   每個頂層 block 一個 island，透過 `insertPatternIslands()`；重新載入時 load
   pipeline 會將簡單 blocks 升級為可編輯 prose。實驗室網站顯示 101 個 patterns
   （Otter 61 + theme 40）；suite：tests/patterns.test.js。
2. ~~**Preview CSS shims**~~——**已交付**（同日），四個中的三個：render-blocks
   會切換 `generateblocks_do_inline_styles`（GB blocks 會內嵌自己的 `<style>`），
   `adapters/essential-blocks.php` 從提交內容中擷取 `blockMeta` 桌面版 CSS
   標記，而 `adapters/otter.php` 會復原每篇文章的 CSS caches
   （`_themeisle_gutenberg_block_styles` + `_atomic_wind_css` — atomic-wind 是 Tailwind
   在首次前端檢視時於瀏覽器中編譯，因此從未檢視的區段沒有
   快取，直到有人檢視頁面一次）。管線：render-blocks 接受 `post`
   param 並套用 `minimal_admin_render_styles` filter；editor-styles 也會攜帶
   會直接處理已觸發且 enqueue 的 hooks（atomic-wind 的 base CSS）。client
   scoper 現在會解開 `@layer`（編譯後的 Tailwind），並保留 CSS nesting。
   REMAINING：Spectra 會在 request 時生成每篇文章的 CSS，沒有持久化儲存 —
   需要對編輯後的文章執行其 `UAGB_Post_Assets` generator；在
   提交。
3. **Library adapters** 採用 Stackable 結構 — **Kadence 已發布**
   （`adapters/kadence.php`：透過 `kb-design-library/v1` proxy 驅動外掛自身的
   `rest_do_request`，使其檔案快取生效；352 個免費區段，pro/鎖定
   已篩選；圖片透過共用的 `adapters/media-localize.php` helper 在本地化；
   client 將來源概括為 `DESIGN_SOURCES` 表格——新增來源只需一個 PHP
   adapter 加上一列表格）。**GenerateBlocks 已交付**（`adapters/generateblocks.php`：
   透過 rest_do_request 驅動其 `generateblocks/v1` proxy——注意其 responses
   攜帶含受保護 props 的物件，只有透過 JsonSerializable 才能攤平，因此
   透過 wp_json_encode/json_decode round-trip 正規化；listing 會攜帶
   完整標記內嵌，37 個免費 patterns，ids 在各處都是 `{libraryId}--{patternId}`
   所有已啟用的 library）。**Spectra 是已記錄的 DEAD END**：網站 demos
   cloud 已完全遷移至 `spectra/*` block system（v2/v3 entries，標記位於
   item response 的 `original_content` field），而正式發布的 wp.org plugin
   （2.19.x、`uagb/*`）不會註冊 — 插入它會建立
   Gutenberg unavailable blocks，正是 render probe 所辨識的 broken-insert 類型
   存在就是為了防止此情況。待 plugin 發布新的 block system 後再重新檢視。
4. ~~**Inspector form scaling**~~——**已交付**：明確設定在 block 上的 fields
   （或依 adapter 順序）會保持顯示；其餘收合至「More settings (N)」後方
   搭配 filter box（threshold 16）。設定值會提升該 field。Suite：
   tests/inspector-scaling.test.js，針對 minimal-test/big-schema fixture block。
5. ~~**Image-swap heuristic widening**~~——**已交付**：Img/Image keys 會配對
   Id/ID suffixes（Kadence bgImg→bgImgID），media objects 只會在攜帶 URL 的 comment 內重新定位 `id`
   攜帶已置換 URL 的物件，GB `mediaId` 受 comment scope 限制，以及 img-tag
   標記 data-media-id / data-id / wp-image-N，兩種 attribute 順序皆可。Suite：
   tests/image-swap.test.js（攜帶所有 convention 的 synthetic block）。

## 實驗室維護事項

多根 Otter pattern page 是 pattern-insert 的實用固定 fixture
以及 preview-CSS 檢查。Suite 工作完成後，拆除一次性實驗室。
