# 使用 Minimal Admin

*为使用 Minimal 管理网站的人员编写的指南：撰写、审核、
检查各项内容并保持插件最新。这里没有代码。如果你要构建
插件时，你需要 [for-plugin-authors.md](for-plugin-authors.md)，而不是这样。*

*截至 v0.27.0 的当前状态。此文件随插件一起发布，因此其中的文案你
你阅读的内容始终与已安装的版本一致。*

## Minimal 是什么（以及不是什么）

Minimal Admin 是进入 WordPress 网站的第二个入口。它位于
`yoursite.com/minimal-admin/`，涵盖日常工作：内容、媒体、
评论、订单、用户、插件、更新和设置，都集中在一个简洁的界面中
没有典型仪表盘中常见的横幅和升级推销干扰。

首先需要了解三件事：

1. **wp-admin 仍然存在。** Minimal 不会替换任何内容。经典管理
   会在 `/wp-admin/` 继续运行；每当任务开始时，Minimal 都会将你链接到那里
   在那里完成会更好。你可以永远并排使用两者。
2. **Minimal 写入的所有内容都是原生 WordPress 数据。** 文章是普通的区块
   标记和设置都是普通选项。停用插件后，你的网站
   完全保持原样，无需迁移，也不会丢失任何内容。
3. **你只能看到帐户有权执行的操作。** Minimal 使用相同的
   WordPress 权限作为 wp-admin。作者可以看到写作工具；而
   扩展和设置区域只会对获准使用它们的帐户显示
   它们。

## 开始浏览

**侧边栏**包含三个分组：

- **工作区**——日常工作内容：概览、内容、媒体、评论、
  以及（使用 WooCommerce 时的）订单、产品、优惠券、客户。带有
  自己的收件箱（例如表单提交记录）也可以显示在这里。
- **工具**——由插件提供的网站基础功能：表单条目、邮件
  日志、活动日志、重定向、备份、代码片段。
- **管理**——网站本身：扩展、用户、菜单和小工具（在
  经典主题）、结构、系统、设置。

点击分组标题即可折叠，侧边栏会记住你的
排列方式。「内容」「评论」和「订单」上的数字表示待处理的工作。
点击当前所在视图的侧边栏项目会刷新其
原地显示列表，因此整天保持打开的标签页无需刷新页面也能保持最新
重新加载。

**命令面板**是前往任何位置的最快方式。按下 **⌘K**
（Windows 和 Linux 上为 Ctrl+K），开始输入，然后跳转到任意视图、任意
文章，或直接运行命令：「清除网站缓存」「立即备份网站」，
「创建新页面」。如果你只从本指南中记住一件事，那就记住 ⌘K。

**Minimal 中的右键菜单是真实可用的。** 这是其中最不容易发现的功能
该应用，因此这里用简单的话说明：Content 和 Media 中的行包含
右键菜单（打开、复制、发布、移至回收站），评论也有这些菜单，
主题切换开关有一个，侧边栏条目无论是插件添加的
还是 Minimal 添加的，都会有一个（这就是隐藏它们的方式）；而分组标题在
编辑器的区块库也有一个。遇到不确定的情况时，试试右键点击。

**一个视图，多个插件。** 当多个插件执行相同的工作（三个
表单插件、两个备份插件），Minimal 会在侧边栏中显示一个条目，并带有
其中的切换器，而不是三个看起来相同的菜单。视图保持不变；
提供商发生变化。

**顶部栏**显示页面标题，以及一个用于显示或隐藏的按钮
侧边栏（⌘. 也有相同作用）、版本徽章（点击它可查看更新内容），
一个「查看网站」链接、主题切换（跟随系统、浅色、深色）、通知、
以及「新建」按钮。只有在某些事项需要处理时，琥珀色标签才会出现在这里
你：有待处理的 WordPress 更新，或网站尚未完全公开。
and network setup stay with WordPress. The palette knows the sites too: press
写作
not appear when you belong to only one site. Its menu opens with search already
点击 **新建**（或按 ⌘K，选择「创建新文章」）并开始写作。编辑器采用
用于写作，从快速发布文章到使用组和

离开：
lists every site with its address, members and state, filters for archived
and spam sites, and search; from a row you can open a site in Minimal, visit it,
archive or restore it, mark it as spam, or delete it. Adding a site asks for
分隔线、三个反引号表示代码块。输入时全部立即应用。
Network users lists every account on the network, shows how many sites each
图片、嵌入内容、表格等。**⌘/** 会打开完整的区块库，
包括你的插件区块，以及你可以
直接放入。
**随处粘贴。** 从 Word、Google Docs 和网页粘贴时会保持整洁。
粘贴的图像或单独的推文或视频 URL 会变成真正的内容，
以及原始区块标记（来自 AI 工具或教程）会作为真实内容粘贴进来，
可编辑区块中。
**你的模式也会随之保留。** 你在 WordPress 中保存的模式（已同步或
是否显示）在斜杠菜单和区块库中，以及一个模式

实时引用：只需编辑一次模式，所有使用它的文章都会随之更新，
并且 Minimal 会在你保存前提醒你这种影响。未同步的
模式会以一个分离副本插入，你可以自由编辑。
**布局区块会打开以供编辑。** 组、列、封面和

并输入内容，Markdown、斜杠菜单和粘贴功能都能正常工作
其中，每一列都有自己的编辑区域，布局与前端一致。
布局本身（宽度、颜色、间距）会被完整保留，并且
你未触碰的任何内容都会逐字节保存回去，因此该区块
编辑器总能干净地重新打开页面。

## Minimal 的编辑器无法原生编辑（插件的特殊区块、间隔区块、

网站的真实样式，就在其实际所在位置，即使是在组内也是如此。
将鼠标悬停在卡片上会显示一条简短说明，解释它为何受保护，以及
编辑所在的位置。其文本和图像通常可以直接在原处编辑，
而且 ⚙ 芯片包含其设置以及复制和移动箭头，因此

- **Type markdown, get formatting.** `#` for a heading, `-` for a list,
  `>` for a quote, `**bold**`, `` `code` ``, `[link](url)`, `---` for a
  点击「Block editor ↗」后，只要你
- **The slash menu**: type `/` on an empty line for headings, lists,
  Bricks、Divi 及同类工具）会以只读方式打开，并显示「在你的构建器中编辑」
  按钮，因为构建器拥有该内容。
  **图库和滑块会打开图像编辑器。** 将鼠标悬停在图库形状的
- 区块，而卡片会标明操作：点击其任意位置即可打开一个平铺
  网格中重新排序（拖动或使用箭头）、替换（点击磁贴）、添加，
  移除、复制照片并添加标题。将图像文件拖放到网格上
  并将其上传到该区块中。每张照片都会作为精确的独立单元移动，因此其
- 标题和设置会随之保留，这也适用于滑块和
  轮播、具有固定开口集合的布局，以及会保留
  在设置中管理它们的图片。图库的 ⚙ 芯片还提供列数、
  裁剪和随机顺序；链接、尺寸和灯箱选项仍保留在
  区块编辑器，弹出窗口也会如此说明。
  **样式化文本组会打开「编辑内容」窗口。** 一个容器
- 容纳多个样式化区块（例如由标签和值组成的统计信息条
  段落等）会在宽敞的窗口中编辑：每个区块对应一张卡片，其中包含其
  将文本置于最前面，其他设置则收纳在切换开关后面，
  还可以重新排序、移除和添加。通过容器的 ⚙ 芯片进入
  （「内容 · N 个区块」），或者在受保护卡片上点击卡片
  本身；你点击的区块会以高亮状态打开。
  **保存具有状态感知能力。** 草稿会在你编辑时自动保存。已发布
- 文章不会在你操作时悄悄发生变化：编辑会静默备份，而实时文章
  只有按下「更新」后才会更新。崩溃保护机制会在本地保存一份
  浏览器中的未保存工作，并提供恢复选项。
  **历史记录**显示带并排对比的修订版本；恢复需要
  一键完成。如果其他人正打开这篇文章（在 Minimal 或 wp-admin 中），你
  在你们都可以编辑它之前，会先通知你。
  **专注模式：**⌘⇧D 会淡化除你正在编写的段落之外的所有内容；
  ⌘⇧O 将屏幕缩减为文本和大纲。⌘⇧F 用于查找和
  替换。右下角有一个字数统计标签；点击它可设置
  本次会话的写作目标。
  click on "Block editor ↗" opens the same post in Gutenberg whenever you
  每日站点维护
  Bricks, Divi and friends) open read-only with an "Edit in your builder"
  **评论**：批准、回复、就地编辑、标记为垃圾评论，或屏蔽某个
- 评论者（来自该地址的未来评论会直接进入垃圾箱，
  以及撤销）。批量选择可跨列表使用。
  grid where you reorder (drag or arrows), replace (click a tile), add,
  **媒体**：将文件拖到应用中的任意位置即可上传。图片可以
  可以直接在 Minimal 中裁剪和旋转，而重新生成缩略图只需
  如果已安装该插件，按钮就会出现。
  carousels, layouts with a fixed set of openings, and blocks that keep
  **通知**（铃铛）会汇总真正需要关注的事项：
  待审核评论、可用更新和通知。
  block editor and the popover says so.
- **关于通知**：其他插件的 wp-admin 横幅不会渲染在
  Minimal。相反，Minimal 会在后台读取它们，并将每个项目简化为
  保留按钮的纯文本，并注明发布它的插件
  它。无需离开面板即可执行其中一项（「不用了」「允许」），或按下
  **隐藏**后，它会对你保持隐藏，并提供撤销功能。这是更平静的
  通知墙，而且这是永久政策：插件不能购买其中的空间
  Minimal 的界面。
- **Saving is status-aware.** Drafts autosave as you write. Published
  **更新**：更新标签页会显示所有待处理事项，而 **更新
  **所有内容**会依次运行插件、主题，然后运行 WordPress 核心，并告诉你
  开始前会明确说明哪些内容将发生变化、哪些内容保持不变。在某个
- 运行期间，顶部栏的进度标签会显示当前阶段，并
  在每个屏幕上都保持可见，因此你可以关闭面板或四处移动
  Minimal，同时仍可看到更新正在正常运行；点击它即可返回
- 面板。Minimal 也以同样方式自行更新：每个版本都会从
  项目的 GitHub releases，并在安装前与已发布的校验和进行核对
  允许安装。
  session writing goal.

## Matomo、Independent Analytics、Jetpack Stats、Site Kit 等），

数字。点击某一天可查看其热门页面和引荐来源，然后逐步浏览
使用方向键浏览数天的内容，而无需关闭对话框。
with Undo). Bulk-select works across the list.

「清除站点缓存」会一次性清除所有缓存。如果备份插件
已安装，还会显示「立即备份网站」，系统页面则会报告
上次备份距今多久。

界面由你掌控
pending comments, available updates, and Notices.

网站本身：
Minimal. Instead, Minimal reads them in the background and reduces each one to
右键点击任意侧边栏条目，无论它是插件添加的，还是它本来就是
Minimal 自有视图（从不使用评论的网站上的「评论」、小工具
你永远不会接触到），然后选择 **Hide for you**。隐藏只是视觉上的：
每个屏幕都可以通过命令面板访问，也可以通过其
地址。

从菜单中添加区块或设计。
在通知标签页中隐藏任意通知。
如果开发者已经通过代码在 wp-admin 中隐藏了管理菜单（这是常见的
客户端站点设置），Minimal 会发出通知，并将这些条目排除在其
侧边栏也会自动显示。与原始 wp-admin 一样，这里
裁剪和随机排序；链接、尺寸和灯箱选项仍保留在
panel. Minimal updates itself the same way: each release is fetched from the
所有隐藏的内容都会列在**你的个人资料**下，只需点击一次
将其恢复，管理员也可以从你的
用户页面上的条目。隐藏设置仅对个人生效：你的共同编辑者会看到他们自己的
自己的布局。

侧边栏、配色方案和菜单，因此即使安装
更多此类内容。
Overview chart shows daily visitors and pageviews from that plugin's own
管理网站
days with the arrow keys without closing the dialog.

搜索、上传，或将 zip 文件拖到对话框中。切换、更新并
使用简单的确认提示进行删除。每张插件和主题卡片都带有一个
WordPress 自动更新的自动切换按钮，与 wp-admin 中的相同设置
管理，而未启用的主题提供「实时预览」，你可以浏览

## 将所有外部服务关系集中到一处：付费插件的

每个插件的设置页面）、Akismet 等服务的密钥、账户
Envato Market 和 WPMU DEV 等连接，以及 AI 连接器密钥

- 编辑。小标签会标记哪些行是服务密钥或连接
  而不是许可证。
  **用户**——创建、编辑、批量更改角色、重置密码、登录
  注销会话，以及（配合 User Switching 插件）切换到某个
  账户，查看他们所看到的内容。打开用户后会进入完整页面：身份信息、
- 公开个人资料、语言、密码和会话，以及它们在 Minimal 中的
  外观。管理员可以设置其他用户的配色方案，并
- 默认值就在这里设置，因此客户的 Minimal 在他们第一次使用前就能正确显示
- 登录，并恢复用户从自己的菜单中隐藏的任何内容。
  浅色或深色模式是唯一会对每个用户保持个性化的设置
  个人的设备。
  **设置**——人们实际会更改的设置：站点标识和徽标、

维护模式，以及一个开关，可原地关闭检测到的即将上线或
维护插件的模式，并提供「撤销」），网站语言、垃圾邮件
保护（配合 Akismet，可直接在其卡片上粘贴或更改密钥），
自定义 CSS。较长的
很少触碰的选项仍有一部分特意保留在 wp-admin 中，一个
点击即可离开。如果你查找某项设置却找不到，这就是
原因，而不是错误。

## 已安装内容的活动视图，以及有人需要时可用的调试工具

- **结构**——文章类型、分类法和术语：重命名、合并并
  安全地重新设置分类目录和标签的父级。
  **数据库**——了解你的网站实际将内容存储在哪里。
  大多数网站都不需要它，因此它不会显示在侧边栏中：你可以从
  系统页面的「数据库」卡片、命令面板（「浏览数据库」），
  或 /minimal-admin/database 地址。它由三部分组成。**Tables** 列出
  每张表及其大小和大致行数，打开表后会显示其
  行，支持排序、按列筛选，以及查看任意单条
  行。**Structure**（任何已打开表格中的一个标签页）显示该表格的列
  以及索引，这些正是技术人员在页面出现问题时会要求提供的内容
  变慢。**Health** 会运行一组存储检查：指向
  不再存在的文章或用户、缺失的索引、使用某个
  旧存储引擎、可回收的空间，以及诸如
- 已过期的商店会话。
  out sessions, and (with the User Switching plugin) switch into an
  有两点适用于所有功能。它是**只读的**：Minimal 绝不会
  更改或删除数据库中的任何内容，因为在幕后这样做会
  插件的后台是网站以无法追踪的方式损坏的原因。而当一个
  健康检查发现需要清理的问题时，Minimal 会提供确切的
  要运行的命令，而不是会执行它的按钮：复制它、备份，然后
  自行运行，或交给负责维护网站的人。如果你需要
  真正编辑数据库，这项工作应交给主机提供商的工具或
  WP-CLI 命令行，而 Minimal 会直白说明这一点，不会假装
  否则。
  protected from per-site role and removal controls.
- 你的个人资料
  reading and discussion, permalinks, visibility (search engines,
  你的账户页面涵盖姓名和头像、密码与会话，
  界面语言（每位用户都可以选择自己的语言）、外观，以及一切设置
  你已隐藏的内容，以及 **AI Access**：用于连接的应用程序密码
  通过标准 WordPress 将 AI 助手或其他工具接入你的网站
  API，按工具分别创建和撤销。
  click away. If you look for a setting and don't find it, that is the
  键盘快捷键
- **System** — a health check (PHP, HTTPS, caching, backups, loopback),
  | 按键 | 功能 |
  technical asks you to turn on logging.
- | **⌘K** | 命令面板（编辑器中选中文本时：链接） |
  | **⌘S** | 保存，同时保留当前状态 |
- | **⌘⏎** | 发布、更新或安排发布 |
  | **⌘/** | 区块库 |
  | **⌘⇧F** | 在文章中查找和替换 |
  | **⌘⇧D** | 专注模式 |
  | **⌘⇧O** | 大纲模式 |
  | **⌘.** | 显示或隐藏导航 |
  | **← →** | 媒体或条目对话框中的上一个 / 下一个项目；流量对话框中的前一天 / 后一天 |
  | **Esc** | 关闭菜单和对话框 |
  slow. **Health** runs a set of storage checks: leftover rows pointing at
  在 Windows 和 Linux 上，⌘ 出现的位置请使用 Ctrl。
  old storage engine, space that could be reclaimed, and backlogs like
  坦诚说明的安全性

  **我的内容会被锁定吗？** 不会。Minimal 写入标准 WordPress 数据
  而已。停用或删除插件不会改变任何内容
  关于你的内容、用户或设置。
  **更新如何到达？** 来自项目的 GitHub releases，通过
  常规 WordPress 更新页面。自 v0.21.0 起，每次下载都会
  在发布前根据随版本发布的校验和进行验证
  安装；被篡改或损坏的下载文件将拒绝安装。
  **插件可以在 Minimal 中出现异常吗？** 不会以你所熟悉的方式
  到。插件以纯数据的形式向 Minimal 描述其界面；它们自己的

## 随之关闭整个界面，或让界面布满横幅。

信任其编辑内容，并且每个人只能看到其角色
允许的操作。每次操作都会在服务器上重新检查。
**多站点？** 尚不支持；Minimal 专为单站点构建。
**看起来不对？** 先执行强制刷新（可能是缓存的样式表
更新后（这是最常见的原因），请检查「系统」页面的健康

## Keyboard shortcuts

| Keys | Does |
|---|---|
| **⌘K** | Command palette (with text selected in the editor: link) |
| **⌘S** | Save, keeping the current status |
| **⌘⏎** | Publish, Update or Schedule |
| **⌘/** | Block library |
| **⌘⇧F** | Find and replace in the post |
| **⌘⇧D** | Focus mode |
| **⌘⇧O** | Outline mode |
| **⌘.** | Show or hide the navigation |
| **← →** | Previous / next item in a media or entry dialog; previous / next day in the traffic dialog |
| **Esc** | Close menus and dialogs |

On Windows and Linux, use Ctrl wherever ⌘ appears.

## Safety, honestly stated

- **Is my content locked in?** No. Minimal writes standard WordPress data
  and nothing else. Deactivating or deleting the plugin changes nothing
  about your content, users or settings.
- **How do updates arrive?** From the project's GitHub releases, through
  the normal WordPress updates screen. Since v0.21.0 every download is
  verified against a checksum published with the release before it
  installs; a tampered or broken download refuses to install.
- **Can a plugin misbehave inside Minimal?** Not in the ways you are used
  to. Plugins describe their screens to Minimal as plain data; their own
  code never draws inside the app, so a broken or pushy plugin cannot
  take the interface down with it or plaster it with banners.
- **Who can open `/minimal-admin/`?** Only logged-in users your site already
  trusts to edit content, and each person sees only what their role
  allows. Everything is re-checked on the server on every action.
- **Multisite?** Yes. Site members can switch among the sites they may use,
  subsite administrators can manage local membership, and network
  administrators get daily Sites, Users, Settings, plugin and theme controls.
  Account creation and deletion, the long settings tail and very-large-network
  database upgrades stay in Network Admin.
- **Something looks wrong?** Hard-refresh first (a cached stylesheet
  after an update is the usual cause), check the System page's health
  strip second, and report bugs at
  [feicode.com/WenPai-org/minimal-admin/issues](https://feicode.com/WenPai-org/minimal-admin/issues).
  wp-admin always remains as the fallback while anything is sorted out.
