# 编辑器方向

> 未来方向：[editor-roadmap.md](editor-roadmap.md)——编辑器作为
> 销售功能、发展方向和永不构建清单。
>
> **北极星：** Minimal 是 WordPress 的写作编辑器。Gutenberg 是布局工具。
> 欢迎构建在 Minimal 中保持可编辑的文档组件；请参阅
> [content-blocks.md](content-blocks.md).

**决定：保留并深化 Minimal 自有编辑器。将 Gutenberg 作为逃生舱，而非基础。**

## 考虑过的选项

1. **嵌入区块编辑器**（`@wordpress/edit-post` 或 `post.php` 的 iframe）。完整区块
   保真度，但会引入 React、构建工具链，以及 Minimal 存在正是为了
   移除。在 Minimal 中嵌入 iframe 的 wp-admin，相当于两个管理员在同一个窗口中争斗。
2. **在自定义编辑器中逐步重建区块支持。** 追求与 Gutenberg 完全一致
   （嵌套布局、模式、动态区块）是一台我们永远无法摆脱的跑步机。
3. **混合模式（已选择）。** Minimal 的编辑器负责*写作*场景——占编辑总量 90% 的
   段落、标题、列表、引文、拉引文、details、code 和图像。它读取并
   为该子集写入原生 Gutenberg 区块标记，因此没有任何专有格式，并且每个
   文章始终可以随时在 Gutenberg 中完整编辑。超出安全子集的任何内容
   （`SIMPLE_BLOCKS` 位于 `app.js` 中）会成为一个原子岛（或历史上的锁定模式），并且
   一键交给真正的区块编辑器。

## 为什么混合模式胜出

- **互操作性由存储格式保证。** Minimal 写入 `<!-- wp:paragraph -->` 风格的
  经过 `parse_blocks()` 验证的标记。不存在锁定，也无需迁移。
- **锁定是安全阀。** `editorModeFor()` 将内容分类为 `classic` / `blocks` /
  `locked`。锁定的文章永远不会在保存时发送其内容，因此复杂布局不会
  被 Minimal 损坏——最坏情况下只需单击跳转到 Gutenberg。
- **无需构建步骤。** 整个应用保持为单个原生 JavaScript 文件，这是插件的核心
  架构押注。

## 区块岛——复杂内容如何变得可安全编辑

原始设计会在出现任何复杂区块时锁定整个正文。现在已替换为
通过**原子区块岛**：

1. `tokenizeBlocks()` 将原始内容拆分为顶层片段，并验证这些片段
   逐字节重组原文（失败 → 旧的锁定模式，如今已很少见）。
2. 简单且安全携带属性的区块会变成可编辑 HTML。携带属性的简单区块
   序列化器无法复现（`{"fontSize":"large"}`、图像 `{"id":…}`）的内容不会以有损方式编辑——
   它也会成为一个岛（`segmentEditable()` / `EDITABLE_ATTRS`）。
3. 其他所有内容都会渲染为一个 `contenteditable="false"` 岛——带边框的卡片，其中包含区块
   名称芯片和静态预览——其原始标记会逐字存储并拼接回
   在保存时保持不变。删除一个岛会删除该区块；不会对它发生其他操作。

结果是：文本编辑可以在复杂布局*周围*流动，对布局本身零风险。已通过
在完整编辑和保存周期中逐字节比较嵌套 group/columns 和 shortcode 区块。
已知的外观影响：Minimal 首次保存会将区块间空白规范化为 Gutenberg
标准空行。

## 写作界面

混合模型决定哪些内容*可安全编辑*；以下是使其
编辑本身很快（全部在 v0.5.x 周期落地）：

- **Markdown 输入规则。** 内联包装在闭合分隔符处触发——`` `code` ``，
  `**bold**`、`*italic*`、`__bold__` / `_italic_`（仅限单词边界，因此 `snake_case`
  仍然有效）、`~~strike~~`、`[text](url)`（仅限 URL 形状的目标地址）。区块前缀会触发
  段落开头的空格——`#`–`######`、`-`/`*`/`+`、`1.`、`>`——以及 ``` → code
  区块和 `---` → 分隔线。包装通过 `execCommand` 完成，因此 ⌘Z 会恢复字面文本。
  来之不易的 Blink 事实以注释形式保存在 `bindMarkdown()` 中：`insertHTML` 重写 `<code>`
  进入样式化 span（代码包装手动构建），它会将相邻空格重新平衡到
  nbsp（插入后修正；`cleanBoundaryNbsp()` 也会在序列化时清理），以及新列表
  会嵌套在段落内，直到被提升。
- **内联代码边界逃逸。** contenteditable 不提供可输入的插入符位置
  在内联元素的边缘*外部*——Chrome 会扩展格式。在一处可打印按键
  `<code>` 边缘会被拦截并插入到元素旁边（代码情况下无条件
  芯片；对刚由 Markdown 包装创建的元素执行一次，因此工具栏先加粗再输入
  仍会扩展）。
- **平稳、感知状态的自动保存。** 空闲 15 秒 / 输入期间最长 60 秒。草稿原地保存；
  已发布/已计划/私密文章**永远不会**由自动保存写入——编辑会备份到一个
  WP 自动保存修订版（类似 Gutenberg），仅在更新/⌘S 时应用。保存草稿按钮、
  ⌘S、未保存更改指示器、导航时立即刷新以及卸载警告完善了整体体验。
- **斜杠菜单会随输入进行筛选**（`/co` → Code）；第二个 `/`（字面路径）会关闭它。
- **字数 · 阅读时间**显示在正文下方的固定胶囊中。
- **预览使用站点的真实样式。** `minimal-admin/v1/editor-styles` 收集每个
  已注册区块的样式句柄、主题的编辑器样式和全局样式表；
  客户端将每条规则限定于 `.minimal-island-preview`（html/body/:root 映射到
  容器）并注入一次。岛的渲染类似前端；输入界面
  刻意保留 Minimal 自有的排版。

## 边界如何随时间移动

谨慎扩展 `SIMPLE_BLOCKS` 和 `EDITABLE_ATTRS`，一次处理一个区块/属性，仅当
往返已证明安全。之后有两种机制大幅移动了边界：**区块
检查器**（docs/block-inspector.md）使岛可配置，但不使其可编辑，
以及**属性透传**（`PASSTHROUGH_BLOCKS`）允许携带属性的实例
非文本流简单区块——带有 `{"id":…}` 的图像、样式化表格/引文/分隔线——保持
可编辑：将评论 JSON 停放在元素上（`data-minimal-attrs`），并重新输出它
在保存时保持逐字节一致。文本流区块（段落、标题、列表）已被有意
目前排除：contenteditable 会拆分克隆元素属性，导致
标记。下面的嵌套内容计划重新审视这一排除，因为 Gutenberg 自己的拆分
将属性复制到两半，使重复成为正确的语义，而不是
损坏。岛让*不支持*某个区块的代价变小——它仍然
会显示并保留——因此无需追求一致性。如果站点内容主要
复杂布局而言，Gutenberg 显然是正确的工具，而 Minimal 应该擅长所有
编辑器*周围*。

希望获得一流 Minimal 编辑体验的作者，应构建**内容区块**（动态、架构
首先是属性中的单词），而非布局套件）。契约和 Anchor Blocks 参考位于
[content-blocks.md](content-blocks.md).

## 嵌套内容计划（记录计划，2026-08-08）

针对 [GH #4](https://feicode.com/WenPai-org/minimal-admin/issues/4) 编写：在一个
完全 FSE、仅核心区块的站点、分组内容锁定。缺口现在已经量化，而非
只是个别现象。对 Twenty Twenty-Four/Five 模式语料库进行分类探测（
最接近普通用户在 FSE 中构建的内容替代物）发现，实际上**100% 的
顶层片段岛**，由 `group` 包装器主导，并且核心文本的 **63%
任何位置的区块都会仅因属性而成为岛**，即使容器
递归。问题项排名为：`fontSize`（165）、`style`（121）、`className`（38）、`textColor`
（22）、`fontFamily`（16）。由此得出两个结论。对于 FSE 站点，容器是主要
问题，而不是属性；属性支持必须是逐字的*携带*，而不是更长的
白名单，因为 `style` 是任意 JSON Blob，任何序列化器都无法从 DOM 复现它。

承重先例已经发布：**details 岛**会渲染一个
`contenteditable="false"` 外壳，内部包含 `contenteditable="true"` 正文，提交编辑
进入 `ed.islands[idx]`，Blink 遵守该边界，因此在可编辑内部输入
永远不会合并到或破坏保留的外壳中。容器支持将这一点推广
模式，而不是重建编辑器。

三个阶段，每个阶段都可单独发布，依次为：

1. **文本流区块的属性传递**（中等）。扩展 `data-minimal-attrs`
   将属性透传给段落、标题和列表，属性位于
   `EDITABLE_ATTRS`：将评论 JSON 原样停放在元素上，保留元素已保存的
   DOM 中的类和内联样式保持原样，并在以下位置重新输出存储的 JSON
   进行序列化。Enter 拆分会将标记复制到两半，这与 Gutenberg 的行为一致
   自身的拆分行为。构建必须通过一个脚本完成的 Blink 拆分/合并/撤销探测，覆盖
   标记。仅此一项就解锁了 63%。
   ✅ *已于 2026-08-08 发布（v0.26.0 周期）* — `TEXTFLOW_CARRY_BLOCKS`（段落、标题、
   列表）连接 `segmentEditable`；加载路径会将完整的 attrs JSON 放置到元素上
   （对于列表，还包括每个列表项自身在其 `<li>` 上的属性——填补了一个既有漏洞
   其中列表项属性在保存时无声消失）。序列化器会发出携带的 JSON
   逐字保留，仅将 DOM 可编辑的键合并回去（段落 `align`、标题
   `textAlign`、列表编号——表格 `hasFixedLayout` 的先例），保留 marker
   元素的内联样式（已保存内容，不受 chrome 样式条影响），并保持
   空标记段落作为真实区块。探测到的 Blink 事实（`scratchpad/probe-attr-carry.*`）：
   中间拆分会将 class+style+marker 复制到两半（符合 Gutenberg 语义）；合并
   保留第一个区块的 attrs（同样正确）；末端拆分会将 marker 复制到空的
   一半，因此 keydown 观察器会从空的同标记兄弟节点中移除 marker+class+style
   晚一帧（栈外 ATTR 变更经过探测可安全撤销——已验证；文本变更则不行）；
   `formatBlock` 丢弃一半 attrs（class+marker 消失，style 保留），这就是为什么 block-TYPE
   转换（Markdown `#`/`-`/`1.`/`>`/```` ``` ````/`---` 前缀、工具栏区块 +
   列表按钮）会在 marker 区块上被拒绝，并显示 toast。内联标记仍完全允许。
   套件：`tests/attr-carry.test.js`（20 项检查，对保存的 JSON 进行字节级一致性断言）。
2. **岛预览中的可编辑文本**（中等，日常收益最高）。文本运行
   机制（`textRunsOf` / `spliceTextRuns`）已经可以通过检查器编辑岛文本
   通过字节偏移拼接处理 textarea。将该编辑移到原位：预览的文本运行
   变为可直接编辑，并且每次编辑都会拼接回存储的原始标记，其中
   其他内容保持逐字不变。序列化保真度由构造自然保证，并且它能工作
   适用于每个岛，包括核心容器和第三方区块。已接受的约束，
   界面中已明确说明：仅支持文本和内联编辑，不支持通过 Enter 拆分为新区块。
   ✅ *已于 2026-08-08 发布（v0.26.0 周期）* — `armIslandTextRuns()` 包裹预览文本
   每次预览渲染后，嵌套 `contenteditable` 跨度中的节点，受 STRICT 门控
   对齐（每个原始文本片段都必须与其预览文本节点逐字节匹配，空白
   包含 padding；任何不匹配都会使该 island 变为只读，并将 ⚙ 检查器作为
   之前——这是动态渲染重写文本时的回退方案）。编辑会拼接到
   `ed.islands[idx]` 从每个输入的 arm-time 基准获取，因此 serialize 无需任何
   变更。构建所依赖的事实（已探测，`scratchpad/probe-nested-span.*`）：
   边界：嵌套可编辑区域内的 Backspace/Delete 是原生空操作，⌘Z 会跟踪跨度内
   输入时，箭头键在运行之间流转——但 ⌘A 会逃逸到外层正文（受限），Enter
   插入 `<br><br>`（被阻止），而 `stopPropagation` 不会阻止同节点监听器，
   因此运行 keydown 分支会使用 `stopImmediatePropagation`，或者使用 Markdown 包裹，并且
   在运行内部触发斜杠菜单。`bindIslandGuards` 需要显式的运行退出：其
   否则插入符遍历会解析到 island 本身，而运行片段中的 Backspace 会启用，然后
   会删除整个块。嵌入/图库岛会被排除（它们的 URL 本身就是
   文本节点）。套件：`tests/island-runs.test.js`（20 项检查，已保存标记断言）。
3. **容器插槽**（大型）。`group` / `columns` / `column` / `cover` / `media-text`
   将它们真实的包装标记渲染为保留外壳（details-island 模式），
   其内部标记会标记化为子片段，简单子项会成为可编辑插槽，
   复杂子项保持嵌套的迷你岛。序列化会将每个插槽的输出拼接回
   在容器逐字节范围之间，是文本运行概念的片段级版本
   今天即可完成。首次保存可能会规范化被触及容器内的空白，这是
   既定的固定点约定。插槽内的功能对等性（Markdown 规则、
   工具栏、斜杠菜单）会按功能逐步加入，从不作为前置条件。深度可以
   仍应局限于真实内容所需的范围；在更深层递归前先测量语料库。
   ✅ *切片 1 已于 2026-08-08 发布（v0.26.0 周期）* — `SLOT_BLOCKS = ['group']`，单个
   深度，仅限全部为简单子项（任何复杂子项 → 整个容器保持为
   阶段 2 岛；目前还没有嵌套迷你岛）。`slotParseContainer()` 会拆分原始
   分为 head/open/inner/tail，并进行标签深度扫描和重组门控；子项渲染
   通过与顶层相同的 `editableSegmentHtml()`（包括阶段 1 标记），
   在逐字包装器内的 `<div class="minimal-slot" contenteditable="true">` 中
   开放标签。序列化：`flushSlotIsland()` 会将 `serializeToBlocks(slot)` 拼接到
   仅当插槽为脏时才写入包装器字节（由输入标记的 `data-minimal-slot-dirty`）；
   未修改的组会发出字节级相同的已存储原始内容。在插槽中工作时无需额外
   代码：输入、按 Enter 拆分、合并、行内 Markdown、撤销、第一阶段属性
   携带。受保护：island-guard 退出（插槽内的 Backspace，否则已启用且
   删除了容器——即 run-bail 类），⌘A 会限制在 slot 内，纯文本
   粘贴（富文本管线的区块拼接针对顶层进行了调优），按每个 slot 的尾部
   交互提示，检查器会在建模前刷新有脏数据的插槽。同一天，后续
   该切片在插槽内禁止创建区块：Markdown 区块前缀（`#`…、`-`、`1.`、
   `>`，`---`），工具栏的 block/list 按钮以及斜杠菜单都会将
   最近的 `.minimal-slot` 作为其区块根（通过 `blockRootOf`/`topBlockIn`，因为
   整合流程，并且每个根都有 `liftNestedLists`）。插槽内的斜杠菜单仅提供
   对正文安全的基础操作——带有 `minimalSlotSafe` 标记的操作（标题、引述、拉引号、
   代码、列表、分隔线）；island 插入、媒体流、表格和 Browse-all 保持
   顶层。由此发现的根因修复：Minimal 从未设置
   `defaultParagraphSeparator`，因此 Blink 在 list-exit/insertParagraph 时创建了 `<div>`s
   （序列化器曾掩盖这些问题；前缀处理器拒绝了它们）——现在设置为
   `p` 整个文档执行。COLUMNS 于同一天发布：
   一个全为简单内容的 `columns` 区块会成为 MULTI-slot island — 每个插槽一个可编辑
   `column`，两个嵌套层级的 wrapper 字节（columns 注释/开始标签以及每个
   列的）原样保留；刷新操作遍历存储的原始内容各段，并拼接每个
   列的序列化子元素位于其自身字节之间，重新输出列间空白
   未修改。编辑器端的 flex CSS 镜像前端形状（某列自身的
   flex-basis 内联样式会生效，因为开放标签是逐字匹配的）；虚线分隔线
   标记每一列的区域。任何列中的复杂子项 → 整个区块保持为
   第二阶段 island。仍不在插槽中：多区块粘贴、表格/代码 chips（顶层
   chrome）、cover/media-text、嵌套。套件：`tests/container-slots.test.js`
   （包括未触碰组的字节级一致性、slot 斜杠菜单内容，共 34 项检查，
   按列拼接定位和插槽内部复制）。

### 写作上下文契约（整合阶段，2026-08-08）

slot 和运行段意味着编辑器现在拥有 FOUR 个编辑上下文——正文、容器
插槽（迷你正文）、岛文本运行（纯文本）和实时字段岛——每个
每个未来的编辑器功能都必须回答这些问题。两件事防止其腐化：

- **一个规范解析器。** `blockRootOf( node, body )` 返回节点的
  内容容器，否则为正文；`topBlockIn( node, body )` 返回其顶层
  该根节点内的区块。所有应该将其视为顶层区块的「遍历到顶层区块」操作
  插槽作为迷你正文会经过这些流程（Markdown 前缀、工具栏的区块
  以及对齐按钮、行内代码、斜杠菜单、焦点模式分带、
  代码块间距启发式）。使用它们的新功能会继承插槽支持
  免费完成；新的 CONTEXT 只需教授一个函数。
- **有意保留的例外需要标注。** 必须保持以正文为锚点的遍历
  附带一条 `body-root by design` 注释，说明原因：island 插入（仅限 island
  存在于顶层），图像 figure 落地、区块选择器、区块级
  复制/剪切语义，以及 island 的启用/删除保护（对插槽和
  在其正文检查运行前运行内部）。任何未来基于正文锚点的遍历
  应该迁移，或者说明不迁移的原因。

该轮次发现的错误：slot 或 run 内的部分文本选择解析为
通过正文遍历到整个岛，因此复制两个单词会复制整个
区块。当选区包含在其中时，复制/剪切现在会退出并交由原生处理
一个 slot 或一次运行（套件：`container-slots`、`island-runs`）。

### 剩余事项（交接，截至 2026-08-08）

以下所有内容都已限定范围，但尚未构建。按建议顺序排列，先从成本最低的开始。
这里没有任何内容是计划有用所必需的：每个关口的回退机制都是一个
阶段 2 岛，支持原地文本编辑，这是可用的体验，而不是损坏的
一个。修改任何内容前，请先阅读上面的写作上下文契约。

**准备构建（小型，每项约半天）：**

1. **slot 内的表格和代码芯片。** `syncTableChips()` 使用
   仅针对正文检查 `:scope > table` / `:scope > figure … img` / `:scope > pre`，因此会
   组内的表格或代码块不会获得 ⚙ 芯片（因此也没有行/列操作或
   语言选择器）。定位已经支持任意深度——芯片位于
   `#minimal-table-chips` 位于滚动容器内的内容坐标处。修复方法是在编辑器绑定时对
   按每个区块根收集（正文 + 每个 `.minimal-slot`），即 `liftNestedLists` 形状。
   关注点：结构高度复杂的页面上的芯片数量（下文的视觉噪声问题）。
   ✅ *已于 2026-08-09 发布* — 按根收集已作为限定范围落地。真正的工作是
   DIRTY-STAMP 半部：直接修改 DOM 的芯片操作（`setCodeLang`、image-popover
   apply/replace）永远不会触发 `input`，因此 `flushSlotIsland` 会在
   保存——`stampSlotDirtyFor( el )` 现在会手动在这些元素上标记所属岛
   路径。execCommand 路径（所有表格操作、图像移除）无需调用：已探测
   （`scratchpad/probe-slot-chips.js`），Blink 会在某个元素的 slot 宿主上触发 `input`
   嵌套可编辑区域中的选区，正文现有的输入处理器会为其标记。
   附加内容：现在 table-delete 会通过 `blockRootOf` 放置插入符，因此删除 slot 表格
   落入其 slot，而不是文档顶层。套件：`container-slots` 增长到 39
   （芯片存在性、代码语言 + 行操作往返于保存的原始内容、删除落点）。
2. **向 slot 中粘贴多块富文本。** 当前 slot 粘贴有意设计为纯文本
   （`body.addEventListener('paste', …)` 捕获分支）。`pasteBlocksInsert()` 括号
   带有 `<p data-minimal-bkt>` 标记的负载会在顶层重建 island；
   泛化方式仍是相同的根替换，并拒绝 slot 内的 island 类负载
   （它们需要嵌套岛，第 5 项）。套件应覆盖 Word/Docs 多段落
   粘贴结果作为组内的独立区块落地。
   ✅ *已于 2026-08-09 发布* — 捕获阶段的纯文本拦截已移除；插槽会进入
   主流程。`pasteInsert`/`pasteBlocksInsert` 获取光标所在的区块根
   （`blockRootOf`，每个根执行括号标记扫描 + 列表提升），因此经过清理的 Docs/Word
   负载会作为组内独立的真实区块落地，并在保存时拼接。守卫条件、
   全部以 SELECTION 的插槽为键（`selSlot` — 对合成事件而言 e.target 毫无用处
   ClipboardEvents（在 body 上分发）：嵌入 URL 快速路径和剪贴板
   图像 FILES 保持在顶层（slot 中的媒体流转是未来工作；仅文件粘贴
   在 slot 中空操作），而 `text/x-minimal-blocks` 负载仅在以下情况下才会拼接到 slot 中
   每个片段都可编辑——island 类 payload 会回退到 html/text
   flavor 中并作为 prose 落地。套件：container-slots 44（多区块 HTML 粘贴已保存
   在组内部，多行文本 → 段落，拒绝 island 负载）；这两个
   旧的普通粘贴检查已改为断言富文本行为。相邻项均通过：粘贴
   37，island-runs 21，media-flow 14，undo-toast 22，island-copy 14，attr-carry 20。

**准备构建（中型，每项 1–2 天）：**

3. **Cover 和 media-text slot。** 这些会破坏 `slotParseContainer()` 关于
   子元素直接位于包装器的开始标签内：`cover` 是
   `wrapper → background span/img → inner-container div → children`，`media-text` 是
   `wrapper → figure → div.wp-block-media-text__content → children`。为每个区块添加一个
   「content container」 定位器，因此解析结果为 head/open/**preamble**/inner/tail，其中
   背景/媒体字节逐字保留，就像其他所有内容一样。重新组装门
   仍由它决定：无法实现字节级相同的解析，就没有插槽。保持相同的脏刷新契约。

**最后一个大块（大型，3–5 天，最后处理）：**

4. **嵌套容器**（组内嵌套组）和 **5. 嵌套岛**（图像、
   嵌入块或第三方区块放入组中）是一个项目，而不是两个。今天
   `slotChildSegments()` 对任何非简单子项返回 null，这正是保持
   保护机制保持简单：`bindIslandGuards` 会整体退出插槽内部，
   island 插入按设计固定在 body 上，且 `ed.islands` 是扁平的顶层数组。
   允许 slot 内嵌套岛意味着必须按根重新限定所有这些内容，而不是直接退出：
   启用/删除防护和每个插槽的撤销提示、插入流程（斜杠菜单/选择器/粘贴/图像
   上传）定位到某个插槽，而位于容器已存储原始内容中的岛索引
   而不是扁平数组。嵌套容器随后自然形成（组子项是
   只是另一个 slot island），而 `SLOT_BLOCKS` + 全部简单门控可以被删除——
   每个组/列都变为可写区域，复杂子项作为其中受保护的卡片。
   这就是该计划的真正最终状态。

   **构建前先测量。** 重新运行语料探针，询问一个不同的问题
   比上次更重要：*真实容器中有多大比例是混合型*（同时包含简单和复杂子项）？
   如果混合容器很少见，那么当前回退机制已经覆盖真实内容，而这
   item 可以无限期保持未构建状态——这是合理的停止点，而不是妥协。该
   更早的探测测量的是哪些区块属于 island，而不是哪些容器是混合的。

   ✅ *已于 2026-08-09 完成测量*（`scratchpad/probe-container-mix.php` + `-names.php`，TT4+TT5
   patterns、155 个 patterns / 494 个容器单元）。**混合是常态，而非例外——
   「保持未构建」的退出条件并不成立。** 在 494 个单元中（列按其
   列作为一个单元）：20% 全部为简单结构，39% 仅因嵌套容器而混合，41% 携带一个
   复杂叶节点。在顶层，当前 131 个容器中有 3 个支持插槽（2%）；仅嵌套
   （第 4 项）将其提升到 26（20%）；其余 105 个需要嵌套岛（第 5 项）——因此
   这两项已确认属于同一个项目，而这就是剩余的全部工作。
   复杂叶节点的分布令人鼓舞：模板构造（pattern、query、
   post-*/site-*/query-*、导航、模板部件）占据了语料库的大部分，但从未出现
   在 POST 内容中——对于 post 形状的内容，叶节点问题基本上会归结为
   **spacer（122）+ buttons（31）**，两者都已经能够作为表现良好的岛进行渲染。
   重新排序：**第 3 项（cover/media-text）不再作为独立切片处理**——
   media-text 在语料库中出现次数为零，cover 出现 21 次，但几乎总是嵌套
   在组内部（本语料库的顶层覆盖增益：零）。将连接作为嵌套
   在第 4 项落地时的单元。需要保留的注意事项：该语料库偏重 FSE 模板；它是
   与原始 63% 探针使用相同的替身，因此数字具有可比性，但它们
   相对于作者文章中实际存在的内容，过度强调模板构造。

   ✅ *切片 1 已于 2026-08-09 发布——嵌套岛 + 嵌套容器已上线。*
   已删除 all-simple 门控：所有内部标记可解析的 group/columns 都会成为一个
   插槽岛；复杂子项会渲染为受保护的嵌套岛（预览、运行、
   实时字段、检查器、⚙ 芯片都通过现有的按根机制正常工作）
   并递归处理容器子项（group 嵌套 group、columns 嵌套 group，任意深度）。什么
   该切片实际包含：(a) `slotChildSegments` 保留复杂片段；
   `slotIslandHtml`/`islandHtml` 接受 `ed` 并注册子 islands（在某个位置没有 `ed`
   插入站点 → 普通 island，重新加载后升级——这是既有的不对称性）；
   (b) `flushSlotIsland` 过滤到自有 slot（`closest('.minimal-slot-island') === el`——
   后代查询会导致列遍历错位（插槽嵌套后只遍历一次）；嵌套插槽
   island 通过 `serializeToBlocks` 现有的递归机制刷新；(c) 承重的
   不变量：对嵌套 island 的 `ed.islands[idx]` 的任何写入，或任何直接 DOM 编辑
   slot 内部必须将每个祖先 slot island 标记为脏（`stampSlotDirtyFor` 会遍历
   向上；由输入处理器调用，两个撤销辅助函数以及 `replaceIsland`，
   `applyInspector` 以及三个 live-field 提交）——未加标记的祖先会发出其
   过期的已存储原始内容，并静默丢弃嵌套编辑；(d) `bindIslandGuards` 是
   限定于根（SELECTION 中的 `blockRootOf`；`isRootChild` = body 的直接子项
   或 slot），而不是针对 slot 直接退出——Backspace 会启动/移除嵌套 island，并带有
   相同的两次按键 + 撤销提示模型；`.minimal-island-run` 退出仍然保留；
   （e）可编辑性检查的「最近包装器」规则（图像点击、链接点击、表格
   上下文菜单）：`.minimal-block-island, .minimal-slot` 中距离最近的一个——插槽意味着写入
   表面，一个岛意味着预览界面；(f) 针对插槽的 CSS 双胞胎用于
   表格/图像切块和单元格网格线（`.minimal-slot > …` 位于
   `.minimal-editor-body > …`）；(g) `armIslandTextRuns` 明确跳过 slot islands
   （否则，其后代预览查询会遍历嵌套岛的预览
   针对容器的原始内容）。测试套件：新增 `tests/nested-islands.test.js`（16 —
   间隔块+按钮叶节点、组内嵌套的双重包装拼接、字节级一致性（模
   按钮实时字段的首次保存固定点、嵌套的启用/移除/撤销/保存）；
   `container-slots` 44 重新固定到新模型（复杂子项不再下沉
   容器——acme columns 是一个带嵌套徽章的插槽岛）；
   `island-runs` 21 重新固定到 FOREIGN 包装器区块上（容器始终使用 slot
   现在，因此各次运行都属于非容器 island）。

   ✅ *插入流程已于 2026-08-09 发布（同日完成后续切片）。* 插槽会接收
   现在已覆盖完整的插入界面：斜杠菜单的 slot 过滤器和 `slotOk`/`minimalSlotSafe`
   机制已删除（每个项，包括仅搜索的设计/模式条目以及
   Browse all 在 slot 中也能正常工作）、⌘/ 块选择器会定位插入符所在根，嵌入 URL
   将 island 粘贴到 slot 中，Minimal-blocks 粘贴负载会拼接嵌套的 island，并且
   媒体流（粘贴/拖放图像文件、选择器插入）会落入插入点所在的 slot。
   机制：`insertIsland`/`insertPatternIslands` 具备根感知能力，会传递 `ed`（一个
   立即插入组 slot），并标记祖先 slot（insertAdjacentHTML 会触发
   无输入——⌘/ 路径从不输入「/」，因此不能依赖输入标记）；
   `runSlashAction` 的 direct-DOM 分支（action.html、action.block、command r.html）
   标记其落点段落；`insertImageFiles` 的受限光标跳转会落在
   在 slot 内。套件：nested-islands 20（斜杠表格插入 + embed 粘贴往返
   触发），container-slots 重新固定 44 项（完整插槽菜单；岛粘贴现在进行拼接），
   patterns 9、block-picker 10、stackable-designs 19/20。两个套件延迟幽灵
   顺手修复：patterns 和 stackable-designs 都使用了扁平的 ⌘S 后等待
   （rule-77 类）并读取过期的原始内容——现在两者都会轮询预期内容。
   可堆叠项剩余的失败（「添加会克隆静态列」，2 列中出现 1
   预期）是预先存在的（已二分确认：在嵌套前的 adec8ba 中完全相同），看起来像
   类似上游 CDN 设计漂移——在下一次设计套件巡检时重新固定，不要
   将其视为嵌套回归问题处理。

   ✅ *插槽评论容错已于 2026-08-09 发布（Austin 的换行报告）。*
   AI 生成的标记使用普通 HTML 注释标记各个部分
   （`<!-- Testimonial 1 -->`）；这些自由格式块过去会将容器下沉到
   阶段 2 运行岛——Enter 按设计被阻止，这会被理解为「我无法
   生成换行符。」仅注释的自由格式（`slotIgnorableHtml`）现在通过了
   插槽门：它会以 DOM 注释节点的形式进入插槽，`serializeToBlocks`
   重新发出 COMMENT_NODE（仅普通注释——绝不包含 `wp:`），列
   刷新会从存储的原始内容中重新发出列间注释片段。修复方案是
   「运行中 Enter 不起作用」始终表示 MORE SLOTTING，绝不是运行中的 Enter——
   按字节偏移拼接文本，而结构键会导致损坏。套件：
   nested-islands 30（带注释标签的组 slot；在注释旁按 Enter；
   脏刷新会重新发出它）。

   ✅ *原始标记粘贴已于 2026-08-09 发布（Austin 的请求）。* 作为区块的纯文本
   标记（以区块注释开头，可干净地进行分词）会重建为真实区块
   粘贴——可编辑区域与 island 的分界，与 `text/x-minimal-blocks` flavor 相同。代码
   上下文会保留字面粘贴内容（编写 ABOUT 标记不会转换），而 html
   对于这些粘贴会忽略 flavor（code-viewer 复制内容会将标记包装在带样式的
   HTML；text flavor 保存真实内容）。套件：paste 40。

   ✅ *封面 + 媒体文本插槽已于 2026-08-09 发布（同日完成最终切片）。*
   `SLOT_CONTENT` 将区块映射到其内容容器类
   （cover → `wp-block-cover__inner-container`，media-text →
   `wp-block-media-text__content`）；`slotParseContent( raw, short )` 包裹
   `slotParseContainer`，并产生 head/open/**preamble**/inner/tail —— preamble
   是从包装器的开放标签开始，到内容容器的开放
   标签（背景、媒体图），像包装器字节一样逐字保留；
   内容容器必须是最后一个子元素（其结束标签之后只能有空白），否则
   门失败，区块保持为岛，而重新组装的一致性现在
   包含前导内容。REGEX 经验：content-open 匹配器必须是普通的
   `<div[^>]*\\bCLASS\\b[^>]*>` —— attr-alternation 形式
   （`[^>"']|"[^"]*"|'[^']*'`）会使引用内容无法被该类访问
   匹配（带引号的字符串只匹配完整 token），因此它从未找到该 class
   在 `class="…"` 内。编辑器 CSS 仅近似前端 SHAPE
   （`.minimal-media-slot-island`：封面背景绝对定位于 z-index 提升的 slot 后方，
   media-text 作为 2 列网格）。SLOT_BLOCKS 现在是 group/columns/cover/media-text。
   套件：nested-islands 27（cover + media-text 字节级一致性、前导内容逐字
   两者的编辑）。剩余部分：芯片密度设计阶段；完整试用
   在 anchor.localhost 上完成嵌套循环，然后再进入发布版本。

**关注项（不在范围内，但应在发布上述内容前决定）：**

- **Chip 和提示密度。** Slot + 嵌套岛会使 ⚙ 芯片和悬停提示在一个
  结构化页面。悬停显示已存在；深度嵌套的页面仍需要设计方案
  在第 5 项发布之前，而不是之后。
- **`defaultParagraphSeparator`。** 整合阶段的修复会将其设置为 `p`，覆盖整个文档
  在编辑器绑定时，修正一个已有问题（Blink 在退出列表时会生成 `<div>`s；
  序列化器掩盖了这些问题）。所有套件均通过，但这类变更
  边界会在实际写作中出现，而不是测试中——在 anchor.localhost 上试用一周
  在发布版本前完成。
- **`code-trap.test.js` 为 11/12**，并且在本轮之前就是如此（已通过暂存
  这些变更）——这是已知的负载下保存竞态问题，而不是嵌套内容回归。
  不要把它当作一个整体来追踪。

**负责这些工作的套件：** `tests/attr-carry.test.js`（20）、`tests/island-runs.test.js`
(21)、`tests/container-slots.test.js` (34)。对 slot/run/carry 机制的任何更改
应保持三项均为绿色，并保留 `markdown`、`paste`、`undo-toast`、`island-copy` 以及
`media-flow`（对 Enter/剪贴板敏感的相邻项）。

此计划未改变永不构建清单。插槽编辑布局内的**内容**；
布局本身（间距、变体、查询循环、区块插入器的完整目录）仍然
Gutenberg 的工作，一键即可访问。所有未触及内容的字节一致性仍然
每个阶段都必须遵守的不可妥协不变量。
