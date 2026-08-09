# 区块检查器——无需 Gutenberg 即可编辑复杂区块

**状态：五个步骤均已发布（v0.4.0 周期）——代码语言属性（以及悬停/光标
可编辑代码区块上的 ⚙ 标签弹出层），以及属性/动态孤岛检查器
服务器渲染预览（`minimal-admin/v1/render-blocks` 替换了每个区块的
`block-renderer` 思路——它会渲染包括带动态内容的静态父级在内的完整孤岛
子项）、单层子项编辑、添加/移除/重排子项（以「结构」
InnerBlocks 形状：包装器 HTML 原样保留，子项之间仅保留空白），并且
使用 `minimal_admin_block_forms` 过滤器和 `wrapperText`——从中获得有用的子集
「父级编辑」：包装器内声明的文本（例如对话标题）可编辑
通过三捕获组模式，仅在发生更改时替换。适配器随同
集成插件（Anchor Blocks `app/MinimalAdmin.php` 是参考实现），不随 Minimal 捆绑。
静态 InnerBlocks 包装器的完整父级属性重新生成仍被有意
尚未构建——它需要区块的 JS `save()`，仍处于一致性
循环。**

**两个后续新增项（v0.5.x 周期）：** 位于 `core/embed` / `core/gallery` 上的检查器
孤岛提供 **「更改 URL…」/「替换图像…」**——这些操作会整体重新生成孤岛
通过创建嵌入和图库的相同模板（`embedTemplate()` /
`galleryTemplate()`），因为它们的内容位于已保存 HTML 中，仅编辑属性
无法重新指向它。Gutenberg 设置的标题/布局属性会按设计重置；弹出层
说明就是如此。现在孤岛预览还会使用网站**真实前端样式**渲染——
`minimal-admin/v1/editor-styles` 收集区块样式句柄 + 主题编辑器样式 +
全局样式表，客户端会先将每条规则限定到 `.minimal-island-preview`
注入（见 editor-direction.md，「写作界面」）。

**v0.8.0 之后的新增内容（自动注册插入项）：** 动态第三方区块不再
需要适配器才能插入。`Minimal_Admin::insertable_blocks()` 遍历区块类型
启动时的注册表（动态 + 顶层 + 插入器可见 + 非核心；适配器 `insert`
描述符优先，`insert => false` 抑制，`minimal_admin_insert_blocks` 过滤
结果），斜杠菜单将其作为**仅搜索**条目携带：默认列表保持
已筛选，并且输入内容与标题或命名空间匹配。自闭合注释是有效的已保存
仅当区块的 JS `save()` 为 null 时才是纯标记——`is_dynamic` 并不保证这一点
（stackable/posts 将 render_callback 与输出包装器 HTML 的 JS save 配对；一个裸
注释会渲染为空并且无法通过 Gutenberg 验证）。服务器看不到 JS `save()`，因此
已发布的判别器是**渲染探针**：裸注释渲染为
任何内容都不会被排除（缓存在以候选集为键的 transient 中）。静态保存区块
根据下方「真实限制」仍被排除——但参见 `adapters/stackable.php` 了解
反向绕过「抓取数据」：当插件将设计发布为序列化标记时
（Stackable 的 CDN 设计库）为前提；这些模板作为有效孤岛插入，且无运行时。

**通用文本运行（同一周期）：** 真实限制变得更窄。静态区块的
STRUCTURE 和 STYLING 仍无法脱离 Gutenberg 重新生成，但其 TEXT 只是
已保存 HTML 中的文本节点——因此检查器按偏移扫描孤岛原始标记
（`textRunsOf`：跳过区块注释、标签及 style/script/svg 子树），并渲染一个
每个文本节点一个字段，无论嵌套多深，即使区块没有注册
属性。更改后的运行从后向前拼接回去，仅转义文本节点；
未更改的运行永不重写，从而保持字节级一致。Gutenberg 仍然正常，因为
这些区块从同一 HTML 中获取其文本属性。子项已经由
单元素文本编辑器（`childTextOf`）会保留它——两条路径相互
每个子项互斥。

**图像替换（同一周期）：** 图片的同级移动。静态区块会镜像一个
图像 URL 位于注释 JSON（`imageUrl`、`blockBackgroundMediaUrl`）与已保存 HTML 之间
（`img src`、`background-image` 样式），因此 `swapIslandImage()` 会替换 URL 字符串
各处（以及其 serializeAttributes 转义形式），重新指向成对的 `XxxUrl`/`XxxId`
媒体 ID 限定在携带 URL 的注释内，并更新 `wp-image-N` 类
已替换的 `img` 标签。检查器的 Images 区域会列出孤岛中的每张图像，并带有
将 Replace 按钮接入媒体选择器；待处理的字段编辑会合并到原始的首个
（与 Apply 共用 `buildInspectorRaw`），因此不会丢失任何输入内容。Embed/gallery 保留
各自专用的重建流程——通用替换在此被抑制，因为核心图像
注释只携带裸的 `id`，URL 键启发式无法安全地重新指向。

区块孤岛让复杂内容变得*安全*（见 [editor-direction.md](editor-direction.md)）——
这就是让它们*可用*的方案。目标：点击孤岛，显示一个小型检查器
旁边的弹出层，在原位编辑区块配置，并观察预览更新。无需 React，
无需构建步骤，不改变安全模型。

## 为什么这完全可行

关键认识：对于**服务器注册的区块**，检查器所需的一切内容已经
作为核心 REST 端点存在——Minimal 驱动与 Gutenberg 相同的服务器端机制，
去掉 React 外壳。

| 需求 | 端点 | 已验证 |
|---|---|---|
| 此区块有哪些属性？ | `GET wp/v2/block-types/<namespace>/<name>` → 包含类型和默认值的完整属性架构 | ✓ 为 `anchor/conversation-message` 返回 `role` / `label` / `content` |
| 使用这些属性时它是什么样子？ | `GET wp/v2/block-renderer/<name>?context=edit&attributes={…}` → 服务器渲染的 HTML | ✓ 使用任意属性渲染 `anchor/stat-card` |

自闭合动态区块（`<!-- wp:anchor/stat-card {"value":"85","label":"…"} /-->`）是
**纯属性容器** — 不存在需要失效的已保存 HTML，因此编辑它们实际上就是
重写注释中的 JSON。孤岛原始标记已原样存储并拼接
保存时写回；检查器只修改已存储的字符串。字节级一致性不会
模型更改。

## 设计

1. **触发器** — 孤岛标签上的 ⚙ 操作入口（点击标签本身也可）。打开一个
   锚定在孤岛上的弹出层，与斜杠命令菜单属于同一视觉系列。
2. **架构驱动表单** — 获取一次区块类型（按会话缓存），根据以下内容生成字段
   属性架构：`string` → 输入框，`boolean` → 开关，`number` → 数字输入框，
   `enum` → 选择。跳过 `lock` / `metadata` / `style`（Gutenberg 管线）。
3. **Apply** — 重写孤岛已存储原始标记中的属性 JSON：对于自闭合
   区块中，重建整个注释；对于包装的动态区块，只重建开头
   注释，并保持内部 HTML 不变。
4. **预览刷新** — 将新属性 POST 到 `block-renderer`，并替换孤岛预览。
   没有 `render_callback` 的区块保留其静态预览。
5. **序列化** — 不变。孤岛仍从已存储的原始标记中原样传递。

### 嵌套孤岛（`anchor/conversation`）

对话区块是静态 InnerBlocks 包装器，其子项是自闭合动态
`conversation-message` 区块。`tokenizeBlocks()` 已经拆分嵌套内容，因此
检查器可以列出子项，并使用同一架构驱动表单编辑每一项，包括
添加/移除/重排，因为子项只是属性注释。父级自身的包装器
标记（`<div class="wp-block-anchor-conversation"><div class="ab-conv-header">…</div>`）是
可复现，但由区块的 JS `save()` 保存，因此重新生成它会有触发 Gutenberg
区块验证——**先发布子区块编辑，最后发布父级属性编辑，并置于
往返测试。**

### 代码区块（首个发布，与检查器无关）

`<!-- wp:code {"language":"sql"} -->` 孤岛目前可行，只因为 `language` 不在
`EDITABLE_ATTRS`。添加 `code: [ 'language' ]`，将属性映射到现有工具栏
加载时显示语言选择器，序列化时重新输出属性 + `language-*` 类。区块变为
完全可编辑，选择器（v0.2.0 内置）也能直接工作。小而高价值——最常见的
包含真实内容的孤岛。

## 真实限制

**静态第三方区块** — 其 `save()` 位于编辑器 JS bundle 中的区块仍然
原样孤岛。更改其属性需要仅重新生成 Gutenberg 运行时
能够生成；这就是 editor-direction.md 拒绝踏上的一致性循环。它们已经
显示并安全地保留编辑内容，而 WordPress 已将区块开发推向服务器端
多年，因此可达集合会自行增长。

希望获得一流 Minimal 编辑体验的作者，应遵循
[content-blocks.md](content-blocks.md)（动态叶节点、PHP 架构、可选
`minimal_admin_block_forms`）。这就是 Anchor Blocks 能在 Minimal 中保持可编辑、而无需 Minimal
变成布局运行时。

## 扩展点

仅靠架构类型无法表达意图：`role` 实际上是 user/assistant 枚举，`content`
需要 textarea，`color` 是固定调色板。`minimal_admin_block_forms` 过滤器（相同
声明式描述符模式作为界面和编辑器面板——参见
[for-plugin-authors.md](for-plugin-authors.md)）允许插件完善为其生成的表单
自有区块：标签、控件类型、选项列表、字段顺序。Anchor Blocks 成为
参考适配器，作用与 ACF 对编辑器面板相同。

## 执行顺序

1. 通过 `EDITABLE_ATTRS` 实现 `code.language`——规模很小。
2. 仅属性/动态孤岛的检查器（stat-card、callout、timeline-item……）——
   核心构建：架构获取、表单生成、注释重写、渲染器预览。
3. InnerBlocks 孤岛中的子区块编辑（对话消息）。
4. `minimal_admin_block_forms` 过滤器 + Anchor Blocks 描述符。
5. （可能是最后一项）简单 InnerBlocks 包装器的父级属性编辑，需以已验证的
   往返运行。
