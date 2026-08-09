# Minimal Admin 中的插件支持

Minimal 可在任何 WordPress 网站上运行；经典 wp-admin 始终只需点击一次
对 Minimal 不提供界面的任何内容都不予处理。在此基础上，Minimal 提供
将特定插件原生接入 Minimal UI 的**适配器**。每个
适配器是一个轻量、以读取为主的 shim：它通过以下方式访问插件数据
插件自身的 API 或限定前缀的查询，绝不会在其中运行外部 PHP
Minimal 的界面，并且绝不会反序列化第三方数据块。插件作者可以添加
通过文档化过滤器实现各自的覆盖范围（参见 `for-plugin-authors.md`）
无需 Minimal 发布代码。

本页面是当前已覆盖内容的地图。「Surface」 = 一个导航项；
「面板」= 编辑器侧边栏中的卡片；「提供方」= 为现有
共享视图；「action」 = ⌘K / 菜单命令。

## 覆盖范围概览

| 区域 | 插件 | 展现方式 |
|---|---|---|
| **SEO** | Yoast、Rank Math、AIOSEO、SEOPress、SiteSEO | 编辑器面板（标题、元描述、焦点关键词） |
| **事件** | The Events Calendar | 事件属于 REST CPT，因此 Content 列表和 Minimal 编辑器已经支持它们；**事件详情**编辑器面板涵盖开始/结束时间、全天、场地和组织者（通过 TEC 自身记录进行异步搜索选择）、费用和网站，全部通过 TEC 自身的 saveEventMeta 写入（时长、UTC 镜像和关联文章维护仍由 TEC 负责）。多个组织者、重复事件、票务、时区以及场地/组织者创建仍在 TEC 中处理 |
| **职位** | WP Job Manager | 列表属于 REST CPT，因此 Content 列表和 Minimal 编辑器已经支持它们；**职位列表**编辑器面板增加详情设置范围（位置、公司字段、申请邮箱或 URL、薪资、远程/已填补/精选标记、到期时间），实时从 WPJM 自身字段架构读取，并由 WPJM 自身的逐字段清理器控制所有写入 |
| **播客** | Seriously Simple Podcasting、PowerPress | SSP：剧集是 REST CPT，因此内容列表和 Minimal 编辑器已支持这些内容；**Podcast episode** 编辑器面板添加完整的剧集详情设置（文件 URL、音频/视频类型、时长、文件大小、录制日期、显式内容和屏蔽标记、iTunes 字段），实时读取 SSP 自身的架构并按其自身约定存储（封面图和 Castos 托管同步仍由 SSP 负责）。PowerPress：默认频道的普通文章使用相同面板（媒体 URL、大小、时长、副标题、Apple 剧集字段），基于差异重建其 enclosure 数据块，确保托管、章节和 artwork 键保持不变；自定义频道、artwork、显式内容和章节仍保留在其 metabox 中 |
| **表单** | Gravity Forms、WPForms、Fluent Forms、Elementor Pro、Contact Form 7（通过 Flamingo）、CFDB7、Ninja Forms、Forminator、Formidable、Everest Forms、SureForms | **表单**界面 — 将条目显示为联系人卡片。具有状态工作流的提供商（Everest、Fluent、Ninja、Flamingo、Elementor Pro）共享「已收到/垃圾邮件或未读/回收站」筛选器，并支持恢复和批量操作；CFDB7 提供「全部/未读/已读」筛选器。Fluent Forms、Ninja Forms、Forminator、Flamingo、Everest Forms、SureForms 和 WPForms 打开时显示状态卡片（未读或已收到数量、已跟踪的垃圾邮件和回收站数量、表单数量，以及指向插件条目屏幕的链接）。WPForms（Pro 版本，条目存放于此）提供完整功能：按表单划分的标签页、未读/已读/已加星标/垃圾邮件/回收站筛选器、加星标和已读状态、带恢复功能的垃圾邮件和回收站流程、通过 WPForms 自身处理程序永久删除，以及打开时自动标记为已查看的条目；所有功能均受 WPForms 自身访问权限控制。Gravity Forms 通过其自身端点增加完整条目工作流：已收到/垃圾邮件/回收站状态视图、加星标/取消星标和标记为已读（打开时像 GF 自身屏幕一样标记为已读）、适用时的恢复和永久删除、批量操作、卡片上的条目备注及添加备注，以及重新发送通知。**通知**视图（通过 GF 自身解析器使用 edit-forms 功能权限）列出所有表单中的每条通知，并显示类型感知的收件人（地址/字段标签/路由规则数量），通过 GF 自身切换功能启用或停用，并通过 GF 自身通知存储编辑每日字段（名称、发送至、主题、消息）；路由规则、条件逻辑和事件仍在 GF 编辑器中处理，可通过一个深层链接访问。每个表单行都能打开 **表单设置**：完整的表单设置范围（基础、布局、保存并继续、限制、垃圾邮件检测、选项）在请求时从 GF 自身 Settings-framework 架构中获取，并通过 `GFAPI::update_form` 按照 GF 自身验证语义保存；计划日期和时间仍由 GF 管理，并如实计为锁定项。**Feeds** 视图（注册了 feed add-on 时显示）列出所有表单中的每个 add-on 集成，并通过 GF 自身模型启用、停用和删除；feed 配置通过深层链接跳转到 add-on 的屏幕。SureForms 条目使用其简洁的 JSON 表，并提供按表单划分的标签页、已读/未读/回收站状态操作、搜索、删除和状态卡片 |
| **电子邮件** | Gravity SMTP、FluentSMTP、WP Mail SMTP、Post SMTP、WP Mail Logging、SureMails、Site Mailer | **电子邮件**界面（从 Email Log 重命名而来，因为后来增加了设置）— 已发送邮件、重新发送、单条/批量删除日志。FluentSMTP、Post SMTP 和 WP Mail Logging 都有状态卡片（14 天图表）；FluentSMTP 还通过其 Logger 提供测试发送、按主题/发件人/收件人搜索、单条/批量删除日志，通过 2.3+ 版本的专用重新发送流程重新发送（保留原始标头和附件、每条记录的重新发送历史，以及 **重新发送至…** 收件人覆盖），在状态卡片和 System health 行中提供每日连接健康判定，通过其 `fluent_mail/manage_capability` 过滤器提供功能权限，并提供 **设置**视图（默认和备用连接、日志记录、保留策略、通过其自身 Settings 模型实现的邮件模拟；连接向导仍由 FluentSMTP 提供）；Post SMTP 提供搜索和单条/批量删除；WPML 可批量删除日志行。Gravity SMTP 的功能更深入：**设置**视图将其自身的设置架构映射到 Minimal（涵盖全部 21 个连接器的发送服务、带掩码密钥的连接器配置，以及通过了解常量锁定的存储实现的常规/日志设置），该界面遵循其细粒度的 `gravitysmtp_*` 功能权限（包括通过其自身 `Event_Model` 删除日志所需的 `DELETE_EMAIL_LOG`），事件详情通过其自身模型读取（发件人/抄送/密送/来源），重新发送通过已配置的连接器重放其自身的收件人处理流程，**抑制**视图通过其自身模型列出、添加和重新激活被阻止的地址，提供 **调试日志**视图、2.3+ 版本条件发送规则的 **路由**视图（启用/禁用/删除；条件编写仍在 Gravity SMTP 中进行）、用于部分发送事件的 **已筛选**日志标签页，以及显示当前服务、测试模式、路由数量、14 天图表和 **发送测试邮件**的状态卡片。SureMails 和 Site Mailer 基于其免费的日志表提供完整日志功能（标签页、搜索、删除、状态卡片和图表、沙盒化 HTML 详情；Site Mailer 是云端发件服务，因此不提供本地重新发送） |
| **重定向** | Redirection、Safe Redirect Manager、Simple 301 Redirects、301 Redirects (WebFactory) | **Redirects** 界面——列表 + 就地编辑 + 批量删除；Redirection 的首次安装通过设置门控在当前界面中运行，其每日选项（监控、日志保留、IP 记录）通过其自身的 `red_set_options` 位于 Settings 视图中，并由状态卡片引导进入该界面（规则、命中次数、已服务/404 计数，以及根据其日志表生成的 14 天堆叠图表） |
| **活动日志** | Simple History、WP Activity Log、Aryo、Stream、**Wordfence**、**Limit Login Attempts Reloaded**、**Solid Security**、**All-In-One Security** | **Activity Log** 界面——严重性/级别选项卡（Simple History、WSAL、AIOS）、连接器选项卡（Stream）、操作选项卡（Aryo）；每个提供商都有一个**状态卡片**（审计日志：24 小时 / 7 天 / 全部时间 + 最近事件及类别特定的组合；Wordfence：24 小时登录 + 防火墙/扫描状态；Limit Login Attempts 和 Solid Security：当前锁定数 + 策略/保护，并通过各插件自身的存储提供一键解锁/释放）。AIOS 读取其审计日志表，并将 JSON 详情扁平化为上下文行，同时报告**失败登录（24 小时）**、**当前锁定**和**永久阻止**（系统健康行也会显示；深层链接进入 AIOS 进行管理） |
| **安全状况** | Wordfence、Really Simple SSL、Solid Security | 系统健康状态行：Wordfence 防火墙模式（已启用 / 学习中 / 关闭）+ 上次扫描时间和未解决问题数；Really Simple SSL 强制状态（均通过各插件自身的公共 API 读取）。System 页的 **Login URL** 行使用 `wp_login_url()`，因此会遵循登录隐藏插件（WPS Hide Login 及同类插件），而不是假定使用 wp-login.php |
| **代码片段** | Code Snippets、WPCode、FluentSnippets、Simple Custom CSS and JS、Header Footer Code Manager | **Snippets** 界面——列表、切换、编辑、创建、批量操作（启用多个提供商时显示提供商切换器） |
| **分析** | Koko、WP Statistics、Burst、Independent Analytics、AnalyticsWP、**Matomo**、**Site Kit**、**Jetpack Stats** | 概览**流量**图表（每日访客数/页面浏览量）。点击日期进行下钻（热门页面 + 通过 `minimal_admin_traffic_day` 获取的来源）：**Koko**、**WP Statistics**（每个 URI 仅统计点击数）、**Burst**（`page_url` + 会话来源）、**Independent Analytics**（浏览量 × 资源 + 会话来源）、**Matomo**（其自身的报告 API——Bootstrap + `doAsSuperUser`，由 `view_matomo` 控制；数字与其界面一致，包括其每小时归档节奏）、**Jetpack Stats**（WPCOM_Stats 博客令牌客户端，由连接 + stats 模块 + `view_stats` 控制；按页面统计仅包含浏览量，这是 WPCOM 的设计） |
| **备份** | UpdraftPlus、Disembark、Duplicator、WPvivid、BackWPup、All-in-One WP Migration | **Backups** 界面；健康检查 + 「立即备份」（UpdraftPlus，否则 WPvivid）；状态卡片、CLI 命令、会话 + 清理，以及 Disembark 2.8+ 中的**恢复备份**深层链接（Disembark）；软件包列表及磁盘大小、状态卡片和通过自身清理功能删除（Duplicator，不声明新鲜度：手动构建）；备份列表 + 状态卡片 + 计划 + 立即备份 + 通过自身清理功能删除（WPvivid）；本地 FOLDER 归档 + 立即运行任务 + 通过其目标位置删除（BackWPup）；本地 .wpress 导出列表 + 通过其 Backups 模型删除，不声明新鲜度（All-in-One WP Migration；导出/导入仍使用深层链接） |
| **缓存** | Kinsta、LiteSpeed、WP Super Cache、W3TC、WP Rocket、WP Fastest Cache、SiteGround、Autoptimize、WP-Optimize、Cache Enabler、Hummingbird、Elementor CSS、SpeedyCache、Redis Object Cache、Breeze、Nginx Helper、Cloudflare | **清除站点缓存**操作（⌘K）。Redis Object Cache 还会添加一个系统健康行，用于显示 drop-in + 连接状态 |
| **自定义字段** | ACF（+ Pro）、Meta Box、Pods | 编辑器面板（文本、textarea、数字、select、radio、checkbox/switch/boolean）。ACF 需要在字段组中启用「Show in REST API」；Meta Box 值通过 `minimal_meta_box` REST 字段（`rwmb_set_meta`）传递；Pods 值通过 `minimal_pods`（扩展文章类型使用 `pods()->save()`）传递。高级类型（克隆、文件、关系、多选……）视为锁定，并提供 wp-admin 链接 |
| **电子商务** | WooCommerce、**WooCommerce Subscriptions** | **订单**（全页面订单视图，带自身 URL 和快速查看模态框；列表、搜索、状态、通过 `payment_complete` 手动**记录付款**、带重新入库的订单项退款及符合网关实际情况的文案、支付 URL、重新发送/自定义电子邮件、订单备注、客户的其他订单、**新建订单**、显示待处理订单的概览**商店条**、通过 `wc-analytics` 获取收入图表 + 热门产品的**分析**视图；WooCommerce 日志频道还会通过自身的日志控制器馈入系统日志查看器）+ **产品**（列表、搜索、库存选项卡，包括库存不足、批量、每日字段、**添加产品**）+ **优惠券**（列表/创建/编辑）+ **客户**（列表/搜索、个人资料 + 账单、最近订单；WCS 激活时显示**订阅**条）+ 概览统计。**订阅**（WCS 激活时）：状态选项卡、搜索、下次付款、周期标签、通过 `wc/v3/subscriptions` 保存状态、父订单 + 相关订单、查看客户，以及订单模态框中的反向链接。产品、优惠券和订阅 CPT 均被排除在 Content 之外 |
| **垃圾邮件过滤** | Akismet、Antispam Bee、CleanTalk、WP Armour | Settings → Spam 提供商卡片；通过 `minimal_admin_spam_providers` 打开 |
| **许可证** | Elementor Pro、ACF PRO、WP Rocket、Gravity Forms、Gravity SMTP、AnalyticsWP、Bricks、Divi、Beaver Builder、WPBakery、Brizy、Etch、Astra/Brainstorm 系列、WPMU DEV（Dashboard + Smush Pro）、SearchWP、Gravity Perks、Rank Math Pro、Perfmatters、GP Premium、WP All Import/Export Pro、Slider Revolution、LayerSlider、Avada、Envato Market、The Events Calendar 系列（Pro、Event Tickets Plus、Filter Bar、Community，每个都是专用提供商）以及其他任何 StellarWP Uplink 或 PUE 产品（通用方式）、Kadence Blocks Pro、Smash Balloon（Instagram / Facebook / YouTube / Twitter / Social Wall / Reviews / TikTok / Feed Analytics Pro，包括 All Plugins 多产品密钥）、Yoast SEO Premium（MyYoast 门户）、Search & Filter Pro、Admin Columns Pro，以及任何 Freemius、EDD Software Licensing 或 SureCart 插件（通用方式） | Extensions → **许可证**标签页（按状态分组，不活跃组件折叠，操作位于每行菜单中；System health 检查是可点击的入口）：每个付费组件显示有效/已过期/无效/缺失状态；Elementor Pro、ACF PRO、Gravity Forms、Gravity SMTP、Beaver Builder、Brizy Pro、Etch、Bricks 和 Divi（当前主题；Divi 需要用户名和 API 密钥）、WPMU DEV、SearchWP、Gravity Perks、Perfmatters、GP Premium、WP All Export Pro、LayerSlider、The Events Calendar 的全部四款产品、Kadence Blocks Pro、Search & Filter Pro 和 Admin Columns Pro 支持粘贴激活，并可在各供应商代码允许的情况下停用和重新验证；对于受门户或管理上下文约束的供应商（WPBakery、Rank Math、Envato、WP All Import、Slider Revolution），提供「Activate ↗」链接；所有操作均通过各供应商自身代码完成；通过 `minimal_admin_license_providers` 打开 |
| **站点可见性** | Maintenance (WebFactory)、SeedProd、Under Construction、LightStart (WP Maintenance Mode)、CMP Coming Soon & Maintenance、Minimal Coming Soon、Password Protected、WooCommerce coming soon（包括仅商店页面的部分形态）、Elementor maintenance mode，以及 Minimal 自带的维护模式和 `blog_public` 「discourage search engines」 设置 | 当站点被隐藏、部分隐藏、受密码保护或未编入索引时，显示概览横幅 + 持续显示的琥珀色顶部栏标记（每个路由均显示）+ 系统健康检查；Settings → Visibility 列出已启用的第三方限制器；每个内置提供商都可通过其自身存储在当前界面中关闭（支持 Undo）；通过 `minimal_admin_visibility_providers` + `minimal_admin_visibility_toggles` 打开 |
| **页面构建器** | Elementor、Beaver Builder、Brizy、Divi、Bricks、WPBakery、Etch | 检测到后单独隔离显示，并提供「在⟨builder⟩中编辑」 |
| **区块库** | Stackable、Kadence、GenerateBlocks | 编辑器「浏览全部」中的设计库；通过 `minimal_admin_design_sources` 对任何插件开放 |
| **区块预览** | Otter、Essential Blocks、Spectra、Kadence、GenerateBlocks、Stackable | 岛屿预览中的真实前端样式 |
| **性能** | Perfmatters、Autoptimize、Asset CleanUp、Performance Lab | 一个带提供商切换器的 **Performance** 工具项。**Perfmatters**（仅设置）：从其实时的核心 Settings API 注册信息中获取完整设置。**Autoptimize**（仅设置）：JS / CSS / HTML / CDN / Misc 开关以其自身的 `on`/空选项写入（Critical CSS、Extra 和 Image 仍保留深层链接；「清除站点缓存」仍会清理其缓存）。**Asset CleanUp**（仅设置）：通过其 JSON 设置选项管理全局压缩/合并/清理/字体/测试模式开关；页面级 CSS/JS 卸载管理器仍位于 Asset CleanUp 中。**Performance Lab**：列出 WordPress Performance Team 的独立功能（通过其自身的安装助手启用，通过核心停用）；Server Timing 和各功能设置仍保留深层链接 |
| **开发者工具** | Query Monitor；**Diagnostics** 类别（Scrutoscope、WP Crontrol、Transients Manager、Rewrite Rules Inspector） | Minimal 页面上的 QM 面板（本次请求）。Tools 中有一个**Diagnostics**项目，带提供商切换器：**Scrutoscope**（性能分析 + Cron 清单；1.4+ 中的**分析此钩子**会在其分析器下运行该钩子并保存按需分析结果）、**WP Crontrol**（事件清单、立即运行、暂停/恢复、删除）、**Transients Manager**（列出/搜索/删除、清理已过期项目，从不反序列化 blob）、**Rewrite Rules Inspector**（按来源列出已注册规则、按路径搜索、刷新、测试 URL）。捕获设置、PHP/URL Cron 编写、深层 transient 编辑和完整 RRI 界面仍使用深层链接 |
| **用户** | User Switching、One Time Login | 在用户行菜单中提供「切换到此用户」（使用插件自身的 nonce URL），切换会话期间显示返回切换栏；「复制一次性登录链接」通过 One Time Login 自身的令牌生成器创建单次使用的登录链接（该仅支持 CLI 的插件首次提供 UI），并针对目标用户受 `edit_user` 控制 |
| **公开预览** | Public Post Preview | 编辑器发布卡片：**Public preview link** 开关 + 复制 URL；内容行提供 **Copy public preview link**（需要时启用）。可分享的匿名草稿链接使用插件自身的过期 nonce 和 Reading 过期设置 |
| **媒体** | Regenerate Thumbnails、Force Regenerate Thumbnails、Safe SVG、SVG Support、Enable Media Replace、FileBird、Real Media Library、Folders by Premio | 媒体详情模态框中的 ↻ 缩略图按钮（逐图完整重建；当 RT 不存在时，Force Regenerate Thumbnails 通过其自身的 admin-ajax 处理程序提供相同按钮）。Safe SVG 或 SVG Support：**SVG** 筛选标签页；详情备注会标明提供商（仅 Safe SVG 声称提供清理）；清理由插件自身负责。Enable Media Replace：详情模态框中的 **⇅ 替换文件**，通过 EMR 自身的 ReplaceController 实现（名称相同、URL 相同；强制使用相同类型；重命名和移动仍在 EMR 屏幕中进行）。文件夹：FileBird、Real Media Library Lite 和 Folders by Premio 都通过 `minimal_admin_media_folders` 提供商契约向 Media 视图的文件夹组合框提供数据（优先浏览；整理仍在各插件自己的界面中进行） |
| **订单文档** | PDF Invoices & Packing Slips for WooCommerce | 订单详情模态框中为每个已启用文档提供下载按钮 |

除了列出的插件之外：任何插件的独立动态区块以及
已注册的图案会自动出现在编辑器中（无需适配器），并且
任何插件的**管理通知**都会被提取到 Minimal 的通知
面板。第三方分析、缓存、表单和其他插件可以注册
通过扩展过滤器自行实现。

## 备注和限制

- **每个类别一次只显示一个提供方。**邮件日志、重定向、
  Activity Log 和 Snippets 界面将多个插件合并到一个导航项中
  当有多个服务处于活动状态时，显示带提供商切换器的项目。
- **SEO 一次只支持一个插件**，按安装量顺序（Yoast → Rank Math
  → AIOSEO → SEOPress）；优先使用第一个处于活动状态的插件。SEO *评分* 和内容
  分析保留在 wp-admin 中。
- **备份**：恢复操作保留在 wp-admin 中（属于手术操作，而非日常工作）；Minimal
  列出集合、报告新鲜度，并触发新的备份。
- **Disembark 是连接器，不是调度器。**备份会被拉取到站外
  通过其 CLI（或 disembark.host），并且站点不会记录某次拉取
  已完成，因此 Minimal 从不声称其内容是最新的。该界面显示
  备份配置文件（上次扫描、数据库大小、磁盘上的工作文件），交给
  通过确切的 `disembark connect` 命令（也可在 ⌘K 中使用「Copy Disembark
  备份命令」），列出扫描会话，并清理整个站点的
  归档会话可能留在 uploads 中。扫描本身从
  Disembark 自有 UI 或 CLI。
- **Contact Form 7 本身不存储任何内容** — 条目需要存储插件。
  Minimal 覆盖了两个最常用的：Flamingo（通过
  Flamingo 自身的处理程序、Manage 视图中的 CF7 表单）以及 CFDB7（条目
  从其序列化行中解析，而无需运行 `unserialize`，
  打开即标记为已读、永久删除）。构建表单仍在 CF7 的编辑器中。
- **页面构建器**将内容存储在 `post_content` 之外（Elementor、
  Beaver、Brizy、Bricks、WPBakery）在 Minimal 的编辑器中以只读方式打开，并带有
  「在⟨构建器⟩中编辑」按钮；原生区块构建器（Etch、Divi 5）保持
  可通过岛式系统编辑。
- **Minimal 刻意不重新实现的内容**：表单构建器、SEO 分数
  界面、防火墙/扫描配置、缓存插件设置页面、构建器画布。
  这些都是各插件自己的产品；Minimal 提供外链。

## 路线图候选项

于 2026-08-06 更新，当前 **v0.24.0** 开放。自那以后已经发布了两个版本
上次刷新：v0.22.0（2026-07-30）带来了只读数据库
查看器，这是原生开发者界面而非适配器，此外还有 Matomo
以及 Jetpack Stats 流量提供程序；v0.23.0（2026-08-04），这些开关
发布，带来可见性切换、每个扩展的自动更新状态胶囊、主题
实时预览和已同步的图案。覆盖历史位于表格中
上文所述；持续更新的基础能力矩阵 + 扫描日志位于 `docs/adapter-coverage.md`。

最近关闭的线程：~~**WPForms Pro 条目**~~ ✅ 已于 2026-08-06 发布
（v0.24.0 周期；最后一个尚未覆盖的大型表单名称，在 Pro zip
使夹具成为可能），~~表单系列状态卡片~~ ✅ 已于 2026-08-06 发布
（Fluent、Ninja、Forminator、Flamingo、Everest），~~Jetpack Stats / Matomo
流量提供商~~ ✅ 已于 2026-07-29 发布（v0.22.0 周期；Jetpack 已验证
并于同日在实时连接的网站上端到端完成）。

开放的适配器线程，排名如下：**MetForm**（推迟到
依赖 Elementor 的适配器已列入考虑范围），状态/图表对等功能位于
通过 `/dev-minimal-admin sweep` 处理表单之外剩余的精简系列兄弟插件，
更深入的 Really Simple SSL 9.7 状态行（其强制执行行已经
已接入），以及许可证的长期遗留问题。该
最大的非适配器线程是 v1 门禁 **G1**，即外部测试人员下午
测试（`docs/v1-readiness.md`）。

一份完整的、按类别整理的未尝试热门插件清单于 2026-08-06 发布：
Wave E（界面和提供程序缺口）以及 Wave F（Minimal 完全没有的类别
完全没有）如下，另外还有许可证供应商系列清单
`docs/license-manager.md`。该轮次的重点选择：Awesome
先处理 Motive Pro 许可证系列（WPForms Pro 已经是一个活跃的 fixture
没有许可证行，而 WP Mail SMTP Pro 的许可证也会解锁其真正的
电子邮件日志表），WooCommerce.com 辅助程序的只读许可证行排在第二位，
第三个是 MonsterInsights 流量提供商，然后是 SiteOrigin / Oxygen /
Breakdance 构建器检测轮次。插件群数量尚未重新测量
自 2026-07-10 起；针对这些候选项重新运行 Manager DB 清单
在提交一个 wave 之前。

> **v0.17.0 说明（2026-07-16）：**适配器迭代暂停一个周期。
> v0.17.0 章程是插件作者周期（开发者体验和滥用
> 在通往 v1.0 的道路上持续抵抗）。请参见 `docs/v1-readiness.md`。这些波次
> 于 2026-07-17 在 v0.18.0 周期恢复，该周期关闭了 Wave B 和 Wave D。

### Wave A — 开发工具 ✅ 已完成（v0.14.0）

诊断类别包含 Scrutoscope、WP Crontrol、Transients Manager，以及
将 Rewrite Rules Inspector 作为一个 Tools 项目（提供程序切换器）。**QM 仍然是一个
面板，而不是界面。**第一个原生开发者界面是只读
数据库查看器，随 v0.22.0 周期发布（`/minimal-admin/database`，
在 `docs/native-editors.md` 中定义范围）；文件浏览器仍停留在那里。

### Wave B — 剩余提供程序（现有系列）

源代码验证于 2026-07-17（已在 minimaladmin 上安装全部四个）：

1. ~~**电子邮件日志提供商** — SureMails + Site Mailer~~ **已交付
   2026-07-17**：两个邮件类别适配器均基于其免费日志表
   （{prefix}suremails_email_log 和 site_mail_logs），完整处理
   （列表/选项卡/搜索/删除/状态+图表/分区详情，包含
   沙盒化 HTML 预览）。**GoSMTP SKIPPED**：其 `\GOSMTP\Logger` 已
   仅限 Pro，免费版本不存储日志（不含 WP Mail SMTP 的
   模式）。Easy WP SMTP 的完整日志也仅限 Pro 版（免费版提供调试
   事件）。注意：两个 created_at 列都采用数据库会话时区
   （托管主机使用 UTC，Cove 开发环境使用站点本地时间）；共享
   `minimal_admin_db_local_to_utc_iso()` helper 在运行时进行规范化。
2. ~~**安全遗留项** — All-In-One Security~~ **已交付 2026-07-17**：
   activity-log 审计源（{base_prefix}aiowps_audit_log；JSON 详情
   已扁平化为 Context 行；级别标签页 + 搜索 + 状态卡片；
   按系列约定为已安装但未激活）。失败登录和
   永久阻止状态行 **已于 2026-07-27 发布**：失败登录（24 小时），
   当前已锁定，以及状态卡片上的永久阻止项、系统健康
   通过 `minimal_admin_aios_checks()` 显示该行，并深入链接到 AIOS
   已锁定 IP 和永久阻止标签页。
3. **表单遗留项** — **SureForms 已于 2026-07-17 发布**（已验证：
   {prefix}srfm_entries，form_data 是按字段标签键控的干净 JSON，
   已读/未读/回收站状态，使用 sureforms_form CPT 作为标签页；完整
   表单系列适配器）。**MetForm DEFERRED**：它将条目存储为
   `metform-entry` CPT 使用各字段的文章元数据，但字段标签来自
   来自解析 Elementor 表单小工具（需要 Elementor 处于活动状态并且
   小工具树解析）——这与 SureForms 的工作类别不同
   扁平 JSON。当依赖 Elementor 的适配器
   已列入考虑范围。

### Wave C — 更大型的限定范围投入（一个周期或半个周期）

4. ~~**电商分析**~~ ✅ 已在 Orders 中作为
   **分析**标签；客户、新订单、添加产品、订阅
   也在商业周期中完成。
5. ~~**WPForms Pro 条目**~~ ✅ **已交付 2026-08-06**（v0.24.0 周期）：
   对 `{prefix}wpforms_entries` 进行完整的表单类别处理，并且
   每个表单的标签页、未读/已读/已加星标/垃圾邮件/回收站筛选器，以及加星标和已读
   状态、垃圾邮件和回收站流程，支持恢复，以及通过
   WPForms 自己的条目处理程序、open-marks-viewed，以及它们的
   `wpforms_current_user_can()` capability 模型。Lite 不注册任何内容
   （条目属于 Pro 功能，因此没有可读取的商店）。阻塞项
   始终是 fixtures 而非代码：结果证明条目可以正常存储
   未授权，因为许可证控制更新和附加组件，而不是存储。
6. ~~**Meta Box** 编辑器面板~~ ✅ 已交付（v0.15.0）。~~**The Events Calendar**
   编辑器面板~~ ✅ 已于 2026-07-17 发布（v0.18.0：事件详情面板 +
   异步 `suggest` 字段原语）。~~**Jetpack Stats** / **Matomo**
   流量提供商~~ ✅ 已于 2026-07-29 发布（v0.22.0 周期）。

### Wave D — 媒体管理（研究于 2026-07-16，wp.org 安装量为实时数据）

Minimal 的媒体核心已经跟上（标题/描述、批量删除，
图像编辑器、Regenerate Thumbnails + Safe SVG 已接入），因此本波次
适配器，以及一个新的基础能力，排名如下：

7. ~~**Enable Media Replace**（60 万）~~ **已交付 2026-07-17**（v0.18.0）：
   ⇅ 通过 EMR 自身的……替换媒体详情模态框中的文件
   ReplaceController，保留 URL，强制使用相同类型；重命名并移动
   仍停留在 EMR 的界面上。
8. ~~**核心媒体优化**（无插件）~~ **已交付 2026-07-17**（v0.18.0）：
   未附加筛选器、月份组合框，以及详情模态框中的「附加到」
   该行带有编辑器跳转（请参见 `docs/core-gaps.md`）。
9. **媒体文件夹提供方契约，优先浏览** — **已于 2026-07-17 发布**
   （v0.18.0 周期）：`minimal_admin_media_folders` 筛选器为文件夹提供
   媒体工具栏中的组合框（文件夹 → 附件 ID shim → `include=`
   基于 wp/v2/media，最多 500 条，保留 ID 0 = Uncategorized），FileBird
   通过其自身的模型进行捆绑（遵循每用户模式），Real Media
   Library Lite 通过其 wp_rml_* API，以及 Folders by Premio 通过其
   media_folder 分类法，套件 `media-folders`（20）。 「移动到文件夹」
   操作于当天发布：契约中提供一个可选的 `move` callable
   通过文件夹选择器和媒体批量操作栏驱动移动操作，并通过每个
   插件自身的分配机制。原始排名：FileBird 第一（20 万，
   自定义 `fbv` 表、整洁的模型类）；Real Media Library Lite（10 万）
   以及 Folders by Premio（90k）加入同一契约，就像 SEO 面板的
   提供商。这修订了 core-gaps 中的「文件夹：长尾，跳过」：40 万+
   合并后的安装，并且扩展现有的 Media 视图，而不是
   需要新的界面。绝不是 Minimal 所拥有的文件夹树：第五个文件夹
   使其对 wp-admin 和页面构建器选择器不可见的标准与
   论点（核心负责通用原语，插件负责各自的观点）。
10. **对等支持** — **已于 2026-07-17 发布**：SVG Support（1M）加入
    SVG 过滤器标签页的安全 SVG 闸门（`svgProvider` 启动密钥命名了
    插件；详情说明仅声称 Safe SVG 具有清理功能）；Force
    Regenerate Thumbnails（200k）通过其加入 ↻ Thumbnails 操作
    自己的 admin-ajax 处理程序和 nonce（启动密钥 `frt`；两者都存在时 RT 优先
    处于活跃状态）。Wave D 已完成，优化器的一行说明和
    以下是有意跳过的项目。

仍然有意跳过：优化器（Smush / EWWW / Imagify 1M
其中，Converter for Media 50 万、ShortPixel 30 万、Optimole 20 万）
带画布仪表板的后台处理程序（最多一行
以后再添加「由 X 优化」的媒体详情提示）；Media Cleaner（90k）是
值得使用独立的全注意力界面的破坏性扫描工具；媒体
Library Assistant（70k）和重命名工具（50k 及以下）属于高级工具
长尾。

### Wave E — 各类别中尚未尝试的热门插件（盘点于 2026-08-06）

针对营销页面库中各类别的逐类别检查，对照
实际存在于磁盘上的适配器。界面类别基本上
完成其类别；这些是剩余名称中最大的部分，
按安装基数和日常操作适配度排名。安装数量为近似值
wp.org 数据，而不是整体数量；在此之前根据 Manager DB 重新排序
发布。

1. **MonsterInsights（约 3M）+ ExactMetrics（约 1M）流量提供方** — 该
   整个清单中覆盖范围最大的未覆盖免费插件。两者都代理
   Site Kit 等 GA 报告，因此可以接入现有的
   `minimal_admin_traffic` 提供程序层级（参考 Site Kit：其自身的
   报告机制、其身份验证，以及 Minimal 侧的短暂缓存）。
2. **SiteOrigin Page Builder（约 1M）检测** — 元数据存储
   （`panels_data`），这是构建器
   存在适用于 **Oxygen** 和 **Breakdance** 的隔离机制（两者都使用元数据存储）
   加入同一检测器扫描；Breakdance 属于 Soflyy，已经是已知
   来自许可证工作的供应商。
3. **安全状况提供方** — SiteGround Security（约 1M）、Loginizer
   （约 1M；采用 LLA-R 形状的锁定日志）、WPS Hide Login（约 1M；一个
   状态行、登录 URL），Sucuri（约 80 万；针对该功能的审计日志
   activity-log 系列）、Jetpack Protect。
4. **SEO 面板提供方** — The SEO Framework（约 100k）和 Slim SEO
   （约 100k）。提供方契约已成熟；逐一处理 S。
5. **Easy Digital Downloads** — 目前唯一另一个真正的商店平台，现在
   Awesome Motive 所有（与 AM 许可系列中的对应项配对
   `docs/license-manager.md`）。订单和客户遵循 Woo 模式。
6. **重定向类别加入者** — Rank Math 内置的重定向
   模块和 Yoast Premium 的重定向管理器；两者都加入现有
   系列，而不是添加插件。
7. **垃圾信息卡片** — hCaptcha 和 Simple Cloudflare Turnstile。
8. **Broken Link Checker（约 600k）** — 真实表格，类似收件箱的日常操作；
   将建立一个内容健康类别。
9. **WS Form** — 真实条目存储，属于表单类别。

有意跳过的内容继续跳过（优化器、电子邮件营销、弹窗、
迁移工具、远程管理代理；请参见本文末尾的列表
文件）。MetForm 按 Wave B 中的文档说明继续延期。

### Wave F — Minimal 完全没有的类别（盘点于 2026-08-06）

按照 Wave C 模式进行周期内限定范围的投入，而不是全面扫描项目。按产品群排名
在开始任何一个 wave 之前。

1. **LMS** — LearnDash（付费，StellarWP）、Tutor LMS（约 100k）、LifterLMS。
   注册和答题尝试都像收件箱，正是工作区
   论点。
2. **预订** — Amelia、Bookly、FluentBooking、Simply Schedule
   预约。预约是那里最像收件箱的数据。
3. **会员/社区** — Ultimate Member（约 200k）、Paid Memberships
   Pro、MemberPress、BuddyPress。成员列表扩展了 Users 界面
   自然地。

### Licenses 系列（参见 `docs/license-manager.md`）

~~Smash Balloon~~ 和 ~~Yoast SEO Premium~~ 已于 2026-07-15 交付；
~~Search & Filter Pro~~ 和 ~~Admin Columns Pro~~ 已于 2026-07-19 交付
（v0.20.0，使用真实密钥完成完整激活循环）。剩余按整个插件群排名的
未完成的工作是长尾 Freemius/EDD 验证列表，以及
供应商类别清单于 2026-08-06 添加（Awesome Motive 系列，
WooCommerce.com helper、SolidWP、TEC 之外的 StellarWP、WPManageNinja、
Delicious Brains、Crocoblock、OTGS、Elementor 插件包，以及各种
并结束）；参见 `docs/license-manager.md` 中的「Vendor-family inventory」。

### Axis A 遗留项（适配器深度，而非新插件）

来自 `docs/adapter-coverage.md` 和 `docs/full-ui-adapters.md`（2026-07-15）：

- ~~Gravity SMTP 批量日志删除~~ ✅ 已交付（与……的邮件引用保持一致
  FluentSMTP / Post SMTP / WPML）。
- ~~活动日志状态卡片~~ ✅ 已交付（Simple History、WSAL、Stream、
  Aryo；Solid / LLA-R / Wordfence 已经包含它们）。
- ~~更丰富的 `sectionsRoute` 行类型~~ ✅ 已于 2026-07-17 交付（v0.18.0：
  `pill`、`code`、沙箱化的 `html-preview`、`kv-table`；整个邮件
  系列的日志详情已转换）。
- ~~表单系列状态卡片~~ ✅ 已于 2026-08-06 交付（Fluent Forms、Ninja
  Forms、Forminator、Flamingo 和 Everest Forms 都与 SureForms 匹配
  形状；每个数字都来自插件自身的存储）。Gravity Forms
  有意跳过该卡片：其深度位于条目工作流中。
- 表单之外其余轻量适配器的状态/图表一致性
  系列（当安排系列扫描时（`/dev-minimal-admin sweep`）。

作为结构性项目搁置：**多语言**（WPML / Polylang / TranslatePress）
需要内容列表中的语言维度。也已搁置，并附带范围和
`docs/native-editors.md` 中划定的边界：**原生编辑器基于干净
文档**（Gravity Forms 的「80% 表单编辑器」；前置基础设施
已在 v0.13.0 中发布；先在内部试用表单管理深度，再做出承诺）。

明确跳过（跳转链接或不提供功能才是诚实答案）：图像优化器
（Smush、EWWW、Imagify、ShortPixel：后台处理器）、同意/GDPR
横幅、弹窗/滑块/optin（画布和 SaaS 仪表板；弹窗是 CPT
因此无论如何都会列出）、电子邮件营销平台（MailPoet、MC4WP）、一次性
迁移工具（导入器、Better Search Replace）、远程管理代理
（ManageWP、MainWP）、文件管理器、Elementor 插件包（已通过
Elementor 适配器）、重复文章插件（Minimal 的原生 Duplicate
取代它们）、Classic Editor/Widgets（Minimal 的经典模式已经
处理存储现实），以及 **Debug Bar** / P3 Profiler（QM 和
Scrutoscope 的替代方案）。

参见 `docs/for-plugin-authors.md`，了解界面/面板/提供程序契约
并从你自己的插件添加覆盖范围（`docs/shim-tutorial.md` 用于
自定义表演练）。对于
按适配器划分的原语矩阵（状态卡片、视图、设置深度），用于
适配器扫描，参见 `docs/adapter-coverage.md`。
