# 页面构建器——共存，而非竞争

**问题：** 当网站使用 Divi、Elementor、Brizy、Etch 或
Beaver Builder？这些用户能否继续使用自己的构建器，同时完全不跳转到 wp-admin
界面——Minimal 能否在构建器所有的内容周围保持安全？

**答案（已于 2026-07-05 在实时实验室中验证）：** 两者都是肯定的。每个主要构建器都有一个
编辑界面完全没有 wp-admin 界面元素——大多数都是字面意义上的前端 URL。Minimal 的职责
是检测由构建器所有的文章，为其提供正确的入口，并拒绝让自身的
编辑器破坏构建器所拥有的内容。已作为 `includes/adapters/page-builders.php` 发布
（`minimal_builder` REST 字段），再加上 app.js 中的列表标签和编辑器处理。

## 实验室方法

启用了 minimal-admin 的一次性本地 WordPress 网站；已安装 Divi 5
（主题）、Etch 1.6.1、Beaver Builder agency + theme、Brizy 2.8.17 + Pro、Elementor free
（wp.org；该轮手头没有 Elementor Pro zip，但 Pro 基于 free 的
存储/URL）。对于每个构建器：在真实浏览器中打开其编辑器界面，
在可脚本化的地方保存，然后检查 `post_content`、postmeta 以及 Minimal 的
编辑器展示了同一篇文章。

## 每个构建器实际做了什么

| 构建器 | 规范内容所在位置 | post_content 保存内容 | 编辑界面（无 wp-admin 外壳） | 检测 |
|---|---|---|---|---|
| **Elementor** | `_elementor_data` postmeta（JSON） | 过时/装饰性副本 | `post.php?post=N&action=elementor` — wp-admin URL，渲染全屏应用 | `_elementor_edit_mode = builder` |
| **Beaver Builder** | `_fl_builder_data` / `_fl_builder_draft` postmeta（序列化 PHP） | 发布时的扁平化渲染 | `permalink?fl_builder` — 纯前端 | `_fl_builder_enabled = 1` |
| **Brizy** | `brizy` postmeta 存储（+ 已编译 HTML） | 已编译副本 | `post.php?action=in-front-editor&post=N` — 跳转到前端编辑器 | `Brizy_Editor_Entity::isBrizyEnabled()`（存在 `brizy_post_uid`） |
| **Divi 4 (legacy)** | `post_content` | `[et_pb_*]` shortcode 混合体 | `permalink?et_fb=1` — 纯前端 | `_et_pb_use_builder = on`，没有 `wp:divi/` |
| **Divi 5** | `post_content` | `<!-- wp:divi/* -->` 区块标记 | `permalink?et_fb=1` — 纯前端 | `_et_pb_use_builder = on` + `wp:divi/` |
| **Etch** | `post_content` | `<!-- wp:etch/* -->` 区块标记 | `home_url?etch=magic&post_id=N` — 位于**网站根目录**的前端应用（Etch 的 `AppRenderer` 受 `is_front_page()` 控制；固定链接 URL 会产生空白页），由 Etch 移除管理栏 | 内容中的 `wp:etch/` |
| **Bricks** | `_bricks_page_content_2` postmeta（元素树） | 原样保留 | `permalink?bricks=run` — 纯前端 | `_bricks_editor_mode = bricks`（或存在的内容 meta） |
| **WPBakery** | `post_content`，以 `[vc_row…]` 短代码形式存在 | shortcode 混合体 | `post.php?vc_action=vc_inline&post_id=N` — wp-admin URL，渲染前端内联编辑器 | `_wpb_vc_js_status = true`（或内容中的 `[vc_row`） |

由此分为两类：

### 原生区块构建器（Etch、Divi 5）——Minimal 已经与其互操作

它们的规范内容是 `post_content` 中原生 Gutenberg 区块标记。Minimal 的
岛屿机制将 `wp:etch/*` / `wp:divi/*` 视为原子岛屿：原样保留，
区块之间的文本可编辑，检查器可用。已验证：Minimal 保存后可往返还原
构建器标记保持字节级一致——在 WordPress **核心**进行一次 REST 保存之后
规范化（区块钩子机制会在每次操作时解析/重新序列化所有区块标记
REST 插入：`{}` 属性会变成 `[]`，属性中的 HTML 会经过 `<` 转义）。Gutenberg
保存会应用相同的规范化；已经处于规范格式的内容是固定的
这一点（已证明：第二次保存时字节级一致）。这正是业界的发展方向
正在迁移——Divi 5 的整个 `builder-5/` 服务模块都基于区块解析器。

Bricks 在概念上也属于原生区块列表，但它将元素树存储在**postmeta**中
（`_bricks_page_content_2`），因此像下面的元存储组一样被隔离——其
`post_content` 保持不变，Minimal 的编辑对 Bricks 不可见。WPBakery 则
shortcode-storage（如旧版 Divi 4）：内容是 `post_content` 中的 `[vc_row]` 混合体，
通过 `the_content` 渲染，但归构建器所有。

### 元存储构建器（Elementor、Beaver Builder、Brizy、Bricks）以及 shortcode Divi 4 / WPBakery——必须隔离

规范内容位于 *`post_content`* **之外**（或者对于 Divi 4，以 shortcode 的形式位于其中
Visual Builder 所拥有的混合体）。`post_content` 保存的是过时或已编译的副本。
已实时验证的陷阱：在 Minimal 中打开一个 Elementor 页面时，它看起来完全像一个
可编辑的经典模式文档——但对它的编辑将**悄无声息地永远无法渲染**
（Elementor 渲染 `_elementor_data`，而不是 `post_content`）。这是最糟糕的失败
Minimal 类具有：不是崩溃，而是无声的谎言。

## 集成（已发布）

`includes/adapters/page-builders.php` 会在所有内容上注册一个**`minimal_builder` REST 字段**
REST 可见的文章类型，仅在构建器处于激活状态时显示。对于每篇文章，它回答：
`{ id, name, edit_url, owns_content }`，第三方注册则通过
`minimal_admin_page_builders` 过滤器（与界面/面板采用相同理念：捆绑适配器
对于主要构建器使用过滤器，其他构建器则统一使用一个过滤器）。

客户端行为：

- **内容列表**：在状态标签旁显示一个低调的标签（「Elementor」、「Divi」、……），这样
  构建器页面在打开前即可被识别。
- **编辑器、`owns_content: true`**：文章会被强制进入**锁定模式**——这意味着
  让所有正确行为自然复用现有机制：正文是只读的
  预览（锁定模式会升级到 `content.rendered`，它会运行 `the_content`，然后
  意味着预览会显示*构建器的真实输出*），任何写入路径都不会发送
  `content` 时会跳过自动保存到修订版本。注释会说明画布由谁负责，并通过
  一个指向无管理界面前端的**在 ⟨Builder⟩ 中编辑**按钮。标题、状态、别名、
  排期、特色图片、标签和 SEO 面板仍然可以从 Minimal 保存——这就是
  真正的产品：Minimal 保持为构建器**周围**平静的管理界面。
- **编辑器、`owns_content: false`**（Etch、Divi 5）：像现在一样完全可编辑（岛屿会
  保护它），并在更浅色变体中加入相同提示，同时提供「在构建器中编辑」
  按钮。

## 「永不跳转到 /wp-admin/」的实际效果

- Beaver Builder、Divi、Etch：编辑界面是一个**前端 URL**——wp-admin 是
  甚至永远不会出现在地址栏中。
- Elementor、Brizy：URL 在技术上是 `post.php?action=…`，但它会渲染
  构建器自带的全屏应用，完全没有 wp-admin 界面元素（已通过截图验证）。该
  用户体验中没有 wp-admin；只有 URL 栏知道这一点。
- 围绕编辑的一切——列表、状态、搜索、评论、媒体、用户、SEO
  字段——这就是 Minimal。

## 在构建器中创建新页面（于 2026-07-05 发布，当天完成）

「+ 新建」菜单会在「页面（使用……」分隔项下列出每个已激活的构建器。
`POST minimal-admin/v1/builders/new {builder, type}` 会创建一个草稿（标题为「未命名」——
`wp_insert_post` 拒绝全为空的文章），运行构建器的 `prepare` 回调（该
与其新建文章流程预置的相同 meta），并返回编辑 URL；随后客户端将
标签页进入构建器。实时验证：Elementor 在准备好的
草稿，并且 Beaver Builder 会在草稿丑陋的 `?page_id=N&fl_builder` 固定链接上启动。
第三方构建器只需在其注册信息中包含 `prepare`，即可免费获得这套流程
`minimal_admin_page_builders` 描述符。

## 未构建的内容（有意为之，留待后续迭代）
- **构建器模板/库**（Elementor 库、Divi 库、BB 已保存行）：
  其 CPT 会从内容中隐藏（`elementor_library` 已经如此）；管理这些
  归构建器所有。
- **主题构建器界面**（Divi Theme Builder、Elementor Pro 网站部分）：超出
  范围——这是网站*构建*，而 Minimal 负责网站*运行*。
- Elementor Pro 未直接测试（手头没有 zip）；它与免费版共享存储方式，并且
  编辑器 URL，因此检测和路由都能正常工作。有许可证时值得抽查。
- Etch 的构建器在实验室中启动为空白应用（疑似 SureCart 许可证门控）；
  其存储格式和编辑 URL 已通过源代码及其自带测试夹具确认。

## Etch 的编辑 URL——那个造成问题的

Etch 是个例外：只有当 `is_front_page()` 为 true 时，其前端应用才会渲染
（`AppRenderer::should_render`），因此必须将文章作为 `?post_id=N` 传入，以针对
**网站根目录**，而不是 `permalink?etch=magic`。固定链接表单会加载 Etch 的空白构建器
模板，没有应用且没有控制台错误——一个无提示的白屏页面（已报告并修复
2026-07-05）。这正是 Etch 自带管理工具栏中的「使用 Etch 编辑」按钮生成的 URL。

## 实验室产物

一次性多构建器网站仅在构建器相关工作进行期间保留。
该实验室中的典型演示页面：每个构建器一个文章（Elementor、Beaver、Brizy、
Etch、Divi 4 shortcode、Divi 5 区块）。
