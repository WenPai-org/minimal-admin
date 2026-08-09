# 区块套件实验室发现（2026 年 7 月 6 日）

临时本地 WordPress 站点，已启用 minimal-admin 并安装五个套件：
**Kadence Blocks 3.7.8、Spectra 2.19.29、GenerateBlocks 2.3.0、Otter 3.2.0、
Essential Blocks 6.3.0**。Stackable 发现（参考集成）位于
[block-inspector.md](block-inspector.md) 和 `adapters/stackable.php`。

## 无需适配器代码即可正常工作的内容

已针对真实的 Otter 图案页面验证：islands 保留 `atomic-wind`/suite 标记
经过两次保存后仍保持字节级一致，预览会在服务器端渲染，文本运行可编辑，
并且核心编辑器 suite 在实验站点上未经修改即可通过（Markdown 20/20，全部五个
suite 已启用）。通用机制——islands、渲染探针、文本运行、图像替换、
延迟 CSS 获取——无需任何 suite 专用逻辑。

## 注册模型（从服务器视角看）

| Suite | 区块 | `is_dynamic` | 真实服务器属性 | 渲染探针通过 |
|---|---|---|---|---|
| Essential Blocks（基础区块） | 75 | 75 | 75 | 6 |
| Kadence（Kadence 区块） | 59 | 59 | 59 | 0 |
| GenerateBlocks（生成区块） | 16 | 16 | 16 | 0 |
| Spectra（uagb） | 13 | 12 | 13 | 9 |
| Otter（themeisle-blocks） | 40 | 11 | 40 | 6 |

核心结论：在此语境下，将 `is_dynamic` 作为「服务器渲染」信号几乎没有意义
生态系统。Kadence 和 GenerateBlocks 为每个区块注册带有 render_callback 的
存在的目的在于*生成 CSS 或装饰已保存内容*，而不是生成标记——纯
评论会渲染为空。Essential Blocks 的约 40 个「静态」区块，其回调仅会
返回 `$content`。渲染探针是唯一可靠的门槛，并且它通过了：它所
通过纯评论即可真正运行（文章网格、FAQ、地图、订阅源、面包屑）。

与 Stackable 不同，五者都会在服务器端注册**真实属性架构**，因此
通用检查器已有可处理的材料。但 Spectra 的 schema 非常庞大
（uagb/post-grid：315 个属性，其中 313 个可渲染表单）——通用表单需要扩展
在其可用之前先确定策略（参见路线图）。

## 模板/模式库——标记数据所在位置

| Suite | 来源 | 标记作为数据？ | 账户？ |
|---|---|---|---|
| Otter | **61 个本地 PHP 图案文件**，注册于 `WP_Block_Patterns_Registry` | 是，位于磁盘 | 否 |
| Essential Blocks | **12 个本地 JSON 图案文件**（`patterns/*.json`），注册为图案 | 是，位于磁盘 | 否（Templately 包受限且未接入） |
| Kadence | Cloud（`patterns.startertemplatecloud.com`），通过自有 `kb-design-library/v1` REST 代理；文件缓存在 uploads 中 | 是——`get_pattern_content` 返回序列化标记；免费区段使用空 api_key 提供 | 免费层级不支持 |
| Spectra | Cloud（`websitedemos.net` REST），通过 ajax 代理；目录同步到 uploads 中的 JSON 文件 | 是——模板内容端点返回标记 | 区块/页面不支持 |
| GenerateBlocks | Cloud（`patterns.generatepress.com`），插件中硬编码了**公开密钥**；自有 `generateblocks/v1` REST 代理，使用 transient 缓存 | 是 | 否 |

五者都会将设计标记发布为可获取的数据。Stackable
适配器结构（精简列表端点 + 带图像 sideload 的可插入模板端点）
直接传输；而 Otter + Essential Blocks 甚至不需要这样做——它们的
图案已经位于核心图案注册表中。

## CSS 模型——预览为何可能无样式

实证确认：`uagb/faq` 和 `essential-blocks/post-grid` **不会**入队任何内容
在纯 `do_blocks()` 渲染期间。每个 suite 都会根据属性生成实例 CSS
并通过仅前端机制输出：

- **GenerateBlocks**：每个区块的 `css` 属性；render_block 路径会前置内联
  仅当 `did_action('wp_head')` 或 **`generateblocks_do_inline_styles` 时才使用 `<style>`
  filter** 为 true。可使用单行 shim。
- **Kadence**：每个区块的基础样式表在渲染时延迟注册（队列差异位于
  render-blocks 会捕获这些内容），此外还有由 `render_css()` 预置的内联实例 CSS——
  但在区块主题上会被抑制，此时它会经过一次 `wp_enqueue_scripts` head 处理
  需要真实的 `$post`。
- **Otter**：CSS 在保存时生成到 postmeta `_themeisle_gutenberg_block_styles` +
  上传文件；仅在 `wp`/`wp_head`/`wp_footer` 上通过 `is_singular()` 发出。
- **Spectra**：每篇文章的 CSS 由 `UAGB_Post_Assets` 在 `wp_enqueue_scripts` 上构建
  （默认内联；`uploads/uag-plugin/` 中可选文件模式）。
- **Essential Blocks**：CSS 嵌入每个区块的 `blockMeta` 属性中，并写入
  标记；保存时物化为 `uploads/eb-style/eb-style-{post}.min.css`，并且
  使用真实的 `$post` 入队。

渲染区块的**样式队列差异**（本周期已发布）覆盖延迟注册
类（Stackable、Kadence 基础样式）。每篇文章生成的类需要按 suite
shim——路线图中已对候选项排序。

## 图像属性约定（用于 `swapIslandImage` 覆盖范围）

- 扁平的 `XxxUrl`/`XxxId` 对（已处理）：Essential Blocks（`imageUrl`/`imageId`、
  有时为 `imageURL`）。
- **`bgImg` ↔ `bgImgID`**（Kadence 行/区段；也包括 `overlayBgImg`、响应式
  `tabletBackground`/`mobileBackground` 数组中的变体）：key + `ID` 配对尚未
  已处理。
- **媒体对象 `{ url, id, alt }`** 位于一个属性中（Spectra `image`、
  `backgroundImage`、`mediaGallery[]`）；Otter `image`、`backgroundImage`；EB
  `image`、`sources[]`）：URL 替换有效（字符串替换），ID 重定向需要
  同对象启发式。
- **GenerateBlocks**：完全没有 URL 属性——`mediaId` + `htmlAttributes.src` +
  `data-media-id` 位于 `img` 上。URL 替换有效；ID 位于 `mediaId`/`data-media-id`。
- **Otter 滑块**：`img[data-id]` 携带附件 ID。
- 服务器生成的标记中会出现 JSON 转义的 `https:\/\/` URL 形式——已在
  本轮检查（Kadence 自己的导入器也进行了相同的规范化，这验证了该
  整体采用字符串手术方式）。

## 路线图（按优先级排序）

1. ~~**斜杠菜单中的服务器注册图案**~~——**已交付**（当天）：
   `minimal-admin/v1/patterns`（精简列表；与 blockTypes/templateTypes-contextual patterns 相关
   已排除，postTypes 限制由客户端过滤）+ `minimal-admin/v1/pattern?name=`
   （内容；因为名称包含斜杠，所以使用 query 参数）。多根模式会插入为
   每个顶层区块一个 island，通过 `insertPatternIslands()`；重新加载时 load
   管线会将简单区块升级为可编辑的正文。实验站点显示 101 个图案
   （Otter 61 + 主题 40）；套件：tests/patterns.test.js。
2. ~~**预览 CSS shim**~~——**已交付**（当天）四项中的三项：render-blocks
   会切换 `generateblocks_do_inline_styles`（GB 区块会内联自己的 `<style>`），
   `adapters/essential-blocks.php` 从提交内容中提取 `blockMeta` 桌面端 CSS
   标记，并且 `adapters/otter.php` 会恢复每篇文章的 CSS 缓存
   （`_themeisle_gutenberg_block_styles` + `_atomic_wind_css`——atomic-wind 是 Tailwind
   在首次前端查看时于浏览器中编译，因此从未查看过的区段没有
   缓存，直到有人查看页面一次）。管线：render-blocks 接受一个 `post`
   参数并应用 `minimal_admin_render_styles` 过滤器；editor-styles 也携带
   直接处理已触发且已入队的钩子（atomic-wind 的基础 CSS）。客户端
   作用域处理器现在会解包 `@layer`（已编译的 Tailwind），并保留 CSS 嵌套。
   剩余：Spectra 在请求时生成每篇文章的 CSS，没有持久化存储——
   需要对编辑后的文章运行其 `UAGB_Post_Assets` 生成器；在提交前调查
   提交。
3. **库适配器**采用 Stackable 形态——**Kadence 已发布**
   （`adapters/kadence.php`：通过以下内容驱动插件自身的 `kb-design-library/v1` 代理
   `rest_do_request`，使其文件缓存生效；352 个免费区块，专业版/锁定
   已过滤；图像通过共享的 `adapters/media-localize.php` 辅助函数本地化；
   客户端将其推广为一个 `DESIGN_SOURCES` 表格——添加一个来源只需一处 PHP
   适配器 + 一行表格记录）。**GenerateBlocks 已交付**（`adapters/generateblocks.php`：
   通过 rest_do_request 驱动其 `generateblocks/v1` 代理——注意其响应
   携带具有受保护属性的对象，这些属性只能通过 JsonSerializable 展平，因此
   通过 wp_json_encode/json_decode 往返进行规范化；列表携带
   完整标记内联，37 个免费图案，ID 在 `{libraryId}--{patternId}` 中
   所有已启用的库）。**Spectra 是有文档记录的死路**：网站演示
   云端已完全迁移到 `spectra/*` 区块系统（v2/v3 条目，标记位于
   条目响应的 `original_content` 字段），而发布中的 wp.org 插件
   （2.19.x，`uagb/*`）未注册——插入它会创建
   Gutenberg 不可用的区块，即渲染探针所识别的确切错误插入类别
   其目的就是阻止该情况。待插件发布新的区块系统后再重新评估。
4. ~~**检查器表单扩展**~~——**已交付**：区块上显式设置的字段
   （或按适配器排序）保持显示；其余内容折叠到「更多设置（N）」后
   带有过滤框（阈值 16）。设置值会提升字段。Suite：
   针对 minimal-test/big-schema fixture 区块运行 tests/inspector-scaling.test.js。
5. ~~**图像替换启发式扩展**~~——**已交付**：Img/Image 键与
   ID/ID 后缀（Kadence bgImg→bgImgID），媒体对象仅在携带 URL 的注释内部重新指向 `id`
   携带替换后 URL 的对象，GB 的 `mediaId` 作用域限定于评论，img 标签
   标记 data-media-id / data-id / wp-image-N，属性顺序任意。Suite：
   tests/image-swap.test.js（携带每种约定的合成区块）。

## 实验室维护

多根 Otter 模式页面是模式插入的实用固定夹具
以及预览 CSS 检查。suite 工作完成后，拆除一次性实验环境。
