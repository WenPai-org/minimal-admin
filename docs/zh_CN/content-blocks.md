# Minimal Admin 的内容区块

**北极星：**Minimal 是 WordPress 的写作编辑器。Gutenberg 是布局工具。

本文档面向希望**构建能够在 Minimal 中保持完全可用的区块的人，
Minimal**。这并不意味着每个站点上的每个区块都获得完整编辑器。布局套件
应属于区块编辑器。文档组件应属于此处。

API 细节（过滤器、描述符键、岛 CSS 钩子）位于
[for-plugin-authors.md](for-plugin-authors.md)。编辑器安全模型：
[editor-direction.md](editor-direction.md)。检查器历史：
[block-inspector.md](block-inspector.md).

## 为什么欢迎自定义区块

作者无需让 Minimal 变成 Gutenberg，也能扩展它。它需要的是**文档
类型**：提示框、对话、时间线、统计条、报告卡片、FAQ、重点统计。
它们与标题和引文的作用相同，只是更加丰富。

构建区块插件，让作者可以继续在 Minimal 中编辑文章，这是正确且预期的做法。
[Anchor Blocks](https://github.com/anchorhost/anchor-blocks) 是参考：服务器渲染
叶节点、PHP 属性架构、用于插入模板和标签的精简 `app/MinimalAdmin.php`，没有
在 Minimal 中使用第三方 JavaScript。

错误之处在于承诺每个静态保存设计系统都具有完整保真度，或者
不断扩展 Minimal 的 SPA 来重新实现插件 React UI。内容区块保真度才是产品。
布局区块的保真度就是交接点。

## 两类区块

| | **内容区块（用于 Minimal）** | **布局区块（用于 Gutenberg）** |
|---|---|---|
| 任务 | 在文章中表达含义 | 组合视觉布局 |
| 事实来源 | 属性 + 服务器渲染（或简单、已知的标记）| 客户端 `save()` + 设计 UI |
| 在 Minimal 中编辑 | 检查器、子项列表、文本/图像工具、实时字段 | Island +「Block editor ↗」|
| 作者目标 |「我可以在 Minimal 中撰写这篇文章」|「我可以无需代码设计此页面」|
| 示例 | 提示框、对话消息、统计卡片、FAQ 项 | 列系统、封面布局试验场、设备可见性树 |

两类都属于有效的 WordPress。Minimal 针对左栏进行优化，并让右栏
**安全**（字节级一致的岛、真实预览，以及在标记允许时编辑岛内内容）。

**试金石：**如果修改*文案*需要打开区块编辑器，它就不是 Minimal 内容
还不是区块。如果更改*间距、列或绝对布局*需要区块编辑器，那么
是正确且永久的。

## Minimal 永远不会重新实现的内容

为写作产品冻结（见 [editor-roadmap.md](editor-roadmap.md)）：

- 将嵌套布局作为一等画布（组、列、封面作为拖放目标）
- 在 Minimal 中承载第三方区块编辑器 JavaScript
- 重新生成只有插件的 JS `save()` 才知道如何生成的静态 HTML
- 将完整站点编辑 / 模板部件 / 全局样式作为 Minimal 界面
- 将"区块一致性"作为路线图 KPI

Minimal **可以**将完成的序列化标记（模式、设计库）作为岛插入，并且
**可以**编辑这些岛中的文本和图像内容。这不是布局创作，而是
插入 + 写入。

## 内容区块契约

针对这条路径进行设计，大多数区块无需任何 Minimal 专用代码。

### 优先

1. **`render_callback`（或 block.json `render`）+ `save: null`**，用于叶节点。  
   单独的 `<!-- wp:namespace/name {"attr":"…"} /-->` 是有效的已保存标记，也是有效预览。
2. **真正构成内容的属性。**标题、正文、标签、枚举样式、数值。  
   不是前端会忽略的并行设计令牌树。
3. **在 PHP 或 `block.json` 中注册架构。**类型、枚举、默认值、标题、`parent` /
   `ancestor`。Minimal 的检查器和自动插入都读取服务器注册表。
4. **默认值应产生有意义的输出。**空或默认 attrs 仍应渲染出一些内容
   在 `do_blocks` 中保持诚实，或发布带有起始内容的 `insert.template`。
5. **注册前端样式，以便 `do_blocks` 可以将其加入队列**（而不只在
   `has_block()` 会在已保存文章中找到它们）。岛预览运行真实渲染路径。
6. **作为内容单元的子项**（消息、行、卡片、项目），而不是自由布局单元格。

### 谨慎使用（仍受支持）

1. **静态 InnerBlocks wrapper**，当需要固定外壳时（对话、时间线）。  
   发布一个包含真实 wrapper HTML + 起始子项的 `insert.template`。不要依赖单独的
   自闭合注释。Minimal 可以重新排序、添加或删除 **content** 子项；但不会
   为设计属性重新生成任意父级 `save()` 输出。
2. **`minimal_admin_block_forms`**，用于标签、控件类型、选项措辞、字段顺序，以及
   插入种子数据。用于完善架构，而不是建立第二套注册系统。
3. **`wrapperText`**，用于静态父 wrapper 中的单个声明文本区域（例如
   对话标题）。参见 for-plugin-authors.md。

### 如果 Minimal 编辑是目标，应避免

1. **静态 `save()`，从复杂属性生成大量 HTML/CSS**（布局套件）。
2. **混合区块**（render_callback *和* JS `save()` wrapper），但没有已知的插入
   模板。裸注释通常会渲染为空，并导致 Gutenberg 验证失败。
3. **空的服务器架构**，所有真实信息仅存在于编辑器 JavaScript 中。
4. **以设计控件为产品本身**（间距刻度、绝对位置、断点树）。
5. **要求使用区块编辑器**来修改读者看到的文字。

## Minimal 如何对待你的区块（按类别）

| 你的区块 | 插入 | 编辑内容 | 编辑设计/结构 |
|---|---|---|---|
| 动态叶节点、良好架构 | 通过 `insert` 自动插入（搜索）或使用斜杠命令 | 检查器表单 | 如果属性*就是*内容则不适用 |
| 动态子项的动态父级 | 模板，或空白后添加子项 | 子项列表 + 表单 | 结构需要时添加/删除/重新排序内容子项 |
| 静态 InnerBlocks 内容父级 | **必需** `insert.template` | 子项 + `wrapperText` | 父级设计保留在区块编辑器中 |
| 静态保存设计套件 | 设计库/区块样式标记，或从 Gutenberg 粘贴 | 标记允许时支持文本片段 + 图像替换 | 仅限区块编辑器 |
| 无模板的混合模式 | 不自动插入 | 如果已在文章中则使用 Island | Block editor |

无需适配器即可应用的通用工具：

- **岛 HTML 上的文本运行**（编辑文本节点而不重新生成结构）
- **图像替换**，当 URL 和媒体 id 约定在 attrs + markup 中保持一致时
- **架构检查器**，用于已注册属性（非来源属性）
- **通过 `minimal-admin/v1/render-blocks` 实现真实前端预览**

## 在*你的*插件中发布集成

与界面约定相同：一个文件、无条件过滤器，以及 Minimal 不存在时的免费 no-op。

```
my-plugin/
└── includes/minimal-admin.php   ← minimal_admin_block_forms, optional insert_blocks tweaks
```

参考：Anchor Blocks `app/MinimalAdmin.php`。

Minimal 动态叶节点（通常单独就足够）：

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

可选优化：

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

完整描述符词汇：[for-plugin-authors.md](for-plugin-authors.md)
（`minimal_admin_block_forms`、`minimal_admin_insert_blocks`、岛预览钩子）。

## 设计库和模式

如果你的产品是**成品组合目录**（而不是自由设计画布），
公开序列化标记，而不是要求 Minimal 重建你的 React 编辑器：

- 过滤器 `minimal_admin_design_sources`（按 id 列出并获取模板），或
- 通过核心的模式注册表注册 Minimal 可以列出的区块模式

Minimal 将顶层片段作为岛插入。作者随后使用文本运行、图像替换，以及
在标记允许的地方提供子项检查器。间距和布局控件保留在 Gutenberg 中。

该路径用于内容套件。这并不是邀请你重新实现完整构建器 UI
在 Minimal 中。

## 成功标准

当满足以下条件时，Minimal 的内容区块即为"完成"：

1. 作者可以从 `/` 或 Browse 插入它，而无需打开区块编辑器。
2. 文字（以及内容 attrs）在 Minimal 中修改，并可干净地往返转换。
3. 在 Gutenberg 中打开同一篇文章时，不会显示无效区块恢复界面。
4. 如果有纯设计变更，应明确标为"区块编辑器 ↗"，而不是 Minimal 中缺少 UI。

如果（1）至（3）成立，你就扩展了写作编辑器。如果需要 Minimal 来拖拽
列并重建 `save()` HTML，你需要的是布局工具。使用 Gutenberg 来
完成这些操作，并让 Minimal 负责写作。

## 相关内容

| 文档 | 角色 |
|---|---|
| [editor-direction.md](editor-direction.md) | 混合编辑器决策、Island、允许列表 |
| [editor-roadmap.md](editor-roadmap.md) | 发展方向 + 永不构建列表 |
| [block-inspector.md](block-inspector.md) | Island 如何变得可配置 |
| [for-plugin-authors.md](for-plugin-authors.md) | Hook 和描述符参考 |
| [block-suites.md](block-suites.md) | 面向布局的区块插件实验笔记 |
| [page-builders.md](page-builders.md) | 全画布构建器（深层链接，而非内容区块）|
