# 适配器覆盖矩阵

已捆绑适配器的持续清单：每个适配器使用哪些 Minimal 表面原语
使用的内容、上次审核时间以及刻意保留的深层链接。由以下人员维护
`dev-minimal-admin` 技能中的 **Adapter sweep** 运维手册（`/dev-minimal-admin sweep`）。

这**不是**营销地图。关于「Minimal 中会显示哪些插件」，请参阅
`plugin-support.md`。描述符契约请参阅 `for-plugin-authors.md`。
如需完整 UI 阶梯（表单引擎、设置映射器、Rung 3），请参阅
`full-ui-adapters.md`.

## 如何阅读矩阵

| 单元格 | 含义 |
|---|---|
| **Y** | 已接入，可用于日常运维 |
| **—** | 不适用（插件没有此概念，或精简 shim 已足够） |
| **L** | 刻意链接到 wp-admin / 提供方 UI（画布、OAuth、条件构建器） |
| **·** | 可能存在 Axis A 缺口：Minimal 具有该原语，但此适配器尚未使用 |

原语（列）：

| 列 | 界面原语 |
|---|---|
| **list** | `collection`（分页列表 + 列） |
| **tabs** | 状态/筛选标签页或列表搜索 |
| **bulk** | 多选批量操作 |
| **detail** | 详情模态框 / `sectionsRoute` |
| **manage** | 第二个集合（`manage`） |
| **status** | 状态卡（`status.route`） |
| **chart** | 状态卡图表序列 |
| **settings** | 展示 `settings`（或仅设置） |
| **views** | 额外列表视图（`views[]`） |
| **suite** | `tests/` 下的 Playwright 套件 |

不要把缺失单元格视为自动工作项。将每个提供方与其
先以 **family reference** 为准。匹配同族插件的精简日志 shim 已完成。

## 同族插件（表面适配器）

于 2026-07-12 根据适配器源和近期扩展轮次创建。重新检查
每次扫描；当清单发现漂移时更新单元格和 `Reviewed`。

### 邮件

参考深度：**Gravity SMTP**。族文档：`mail-plugins.md`。

| 适配器 | 列表 | 标签页 | 批量 | 详情 | 管理 | 状态 | 图表 | 设置 | 视图 | 套件 | 已审查 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gravity-smtp | Y | Y | Y | Y | — | Y | Y | Y | Y | Y | 2026-07-15 | 设置、抑制、调试日志、路由（切换/删除）、Filtered 标签页；通过 Event_Model 执行**单条 + 批量日志删除**；条件编写 = **L** |
| fluent-smtp | Y | Y | Y | Y | — | Y | Y | Y | · | Y | 2026-08-06 | 状态 + 图表 + 标签页；搜索 + 删除；**分区详情**（胶囊、沙箱 HTML 正文、提供方回复预览、**Resends trail**）；**设置标签页**（默认/回退连接、日志记录、保留期限、通过其 Settings 模型进行模拟；连接向导 = **L**）；**2.3.0 补齐**：通过其 `resendEmailFromLog` 重发（轨迹 + 不重复行）、「Resend to…」覆盖操作、ConnectionHealth 状态卡 + System 行、权限通过 `fluent_mail/manage_capability` |
| post-smtp | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | 状态 + 图表 + 标签页；重发；搜索 + 删除；**分区详情**（胶囊、HTML 正文、失败代码行）；仍未暴露传输记录 |
| wp-mail-smtp | Y | Y | · | Y | — | · | · | · | · | Y | 2026-07-14 | 免费版 = 仅调试事件；完整日志为 Pro 功能 |
| wp-mail-logging | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | 仅日志；批量删除；状态 + 图表；**分区详情**（胶囊、HTML 正文、原始标头 + 错误代码行） |
| suremails | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | Wave B：{prefix}suremails_email_log；已发送/失败标签页；搜索；单条+批量删除；状态+图表；分区详情；DB 时区→UTC 辅助函数；已安装但未启用 |
| site-mailer | Y | Y | Y | Y | — | Y | Y | · | · | Y | 2026-07-17 | Wave B：site_mail_logs（Elementor 云发送方）；已发送/失败标签页；搜索；删除；状态+图表；分区详情；不提供本地重发（云端）；已安装但未启用 |

### 表单

参考深度：**Gravity Forms**。

| 适配器 | 列表 | 标签页 | 批量 | 详情 | 管理 | 状态 | 图表 | 设置 | 视图 | 套件 | 已审查 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gravity-forms | Y | Y | Y | Y | Y | · | · | Y | Y | Y | 2026-07-17 | 表单设置（项目）、Notifications 视图、**Feeds 视图**（附加组件集成：切换/删除/深链接；配置映射器延期，见 full-ui-adapters）；表单构建器 = **L**；GF 深度不需要状态/图表 |
| fluent-forms | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | Unread/spam/trash 标签页 + 批量操作；套件 `fluent-forms`（24）；活动 fixture |
| elementor-forms | Y | Y | · | Y | · | · | · | · | · | · | 2026-07-14 | Elementor 画布 = **L** |
| cf7-flamingo | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | CF7 构建器 = **L**；批量恢复/删除已接入（矩阵已过时） |
| cfdb7 | Y | Y | Y | Y | · | · | · | · | · | Y | 2026-07-15 | 批量删除已接入（矩阵已过时） |
| ninja-forms | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | 批量移入回收站/删除已接入（矩阵已过时） |
| forminator | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | 已有标签页 + 批量操作 + 搜索（矩阵已过时） |
| formidable | Y | Y | Y | Y | Y | · | · | · | · | Y | 2026-07-14 | 已有标签页 + 批量操作 + 搜索（矩阵已过时） |
| everest-forms | Y | Y | Y | Y | Y | Y | · | · | · | Y | 2026-08-06 | Received/Spam/Trash + 批量操作；套件 `everest-forms` |
| sureforms | Y | Y | Y | Y | — | Y | · | · | · | Y | 2026-07-17 | Wave B：{prefix}srfm_entries（按标签键入的 form_data JSON → 联系人卡片条目）；按表单标签页；已读/未读/回收站筛选 + 状态操作；搜索；删除；状态卡；已安装但未启用 |
| wpforms | Y | Y | Y | Y | — | Y | · | · | · | Y | 2026-08-06 | 仅 Pro 提供条目（{prefix}wpforms_entries：fields JSON、`date` UTC、已查看/已加星标志、''/spam/trash 状态）；按表单标签页；未读/已读/已加星/spam/trash 筛选；对 fields JSON 搜索；加星 + 已读 + spam/trash/恢复操作（通过其条目处理器写入——钩子会触发，删除会清理 entry_fields/entry_meta）；详情会像其界面一样标记为已查看；通过 wpforms_current_user_can 执行权限控制（已验证编辑器 403）；状态卡。活动 fixture（Pro 2.0.0.2 开发 zip，来源已验证）；Lite 不注册任何内容（没有条目处理器） |

### 备份

| 适配器 | 列表 | 标签页 | 批量 | 详情 | 管理 | 状态 | 图表 | 设置 | 视图 | 套件 | 已审查 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| updraftplus | Y | — | — | — | — | Y | — | — | — | Y | | 立即备份 + 系统健康；恢复 = **L** |
| wpvivid | Y | — | — | Y | — | Y | — | — | — | Y | | 计划 + 立即备份；恢复 = **L** |
| duplicator | Y | — | — | — | — | Y | — | — | — | Y | | 包列表；不声明新鲜度 |
| disembark | Y | — | — | — | — | Y | — | — | — | Y | | 连接器；CLI 命令 + 会话；没有新鲜度 |
| backwpup | Y | — | — | Y | — | Y | — | — | — | Y | 2026-07-12 | 本地文件夹归档；立即运行任务；远程目标 = **L** |
| ai1wm | Y | — | — | Y | — | Y | — | — | — | Y | 2026-07-12 | .wpress 列表；导出/导入向导 = **L**；没有新鲜度 |

### 活动日志

| 适配器 | 列表 | 标签页 | 批量 | 详情 | 管理 | 状态 | 图表 | 设置 | 视图 | 套件 | 已审查 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| simple-history | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | 真实 REST 列表；**状态**卡（24 小时/7 天/总数/严重性） |
| wp-activity-log | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | 绝不反序列化 meta；**状态**卡（24 小时/7 天/高危+严重） |
| aryo-activity-log | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | 本地 epoch 陷阱；**状态**卡（24 小时/7 天/顶部操作） |
| stream | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-15 | **status** card (24h/7d/top connector); blog_id scoped **2026-08-12**: view_stream is only grantable in wp-admin — Stream registers its cap filter in Admin (never loaded over REST), and its REST-side equivalent sits inside Abilities::register(), which returns early unless the default-OFF `advanced_enable_abilities_api` flag is on. Verified inside a real REST request: administrator, role_access ['administrator'], no Stream callback on user_has_cap, view_stream false. minimal_admin_stream_can() now falls back to Stream's OWN general_role_access rule (never a manage_options backstop; suite proves an administrator is refused once administrator leaves Role Access). |
| wordfence | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-14 | 登录日志 + 安全状态行；未启用 fixture（系列） |
| limit-login-attempts | Y | · | — | Y | — | Y | — | — | — | Y | 2026-07-14 | 解锁操作；活动常驻项 |
| solid-security | Y | · | — | Y | — | Y | — | — | — | Y | 2026-07-14 | 发布 + 安全状态；当前在 minimaladmin 上**已启用**（此前采用停用约定） |
| all-in-one-security | Y | Y | — | Y | — | Y | — | — | — | Y | 2026-07-17 | Wave B：审计流（{base_prefix}aiowps_audit_log，JSON 详情扁平化为 Context 行，UTC epoch）；级别标签页 + 搜索 + 状态卡；已安装但未启用（WSAL/LLA 常驻）；套件 `aios-log` |

### 重定向 / 代码片段

| 适配器 | 列表 | 标签页 | 批量 | 详情 | 管理 | 状态 | 图表 | 设置 | 视图 | 套件 | 已审查 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| redirection | Y | · | Y | Y | — | Y | Y | Y | — | Y | 2026-07-17 | 设置门控 + 选项；**状态卡**（规则、命中、7 天已服务/404、双 14 天图表）；套件 `redirection-status` |
| safe-redirect-manager | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **状态卡**（规则、状态码分布、正则数量；SRM 不存储命中数据）；套件 `redirects-status` |
| simple-301-redirects | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **状态卡**（规则数量 + 通配符切换；存储是单个选项数组）；套件 `redirects-status` |
| eps-301-redirects | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | source 不带前导斜杠；**状态卡**（规则、累计命中、顶部重定向、404 日志） |
| code-snippets | Y | · | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **状态卡**（启用/停用/回收站、运行范围、最近变更、安全模式警告）；系列中的首张卡 |
| wpcode | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **状态卡**（启用/停用、运行类型、最近变更） |
| fluent-snippets | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | **状态卡**（启用/停用 + 文件存储说明） |
| custom-css-js | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | CPT shim；写入时重建树；**状态卡**（活动代码、通过正则预览运行中的语言） |
| hfcm | Y | Y | Y | Y | — | Y | — | · | — | Y | 2026-07-17 | hfcm_scripts；页面定位 = **L**；**状态卡**（启用/停用、运行类型、最近变更） |

### automation

| 适配器 | 列表 | 标签页 | 批量 | 详情 | 管理 | 状态 | 图表 | 设置 | 视图 | 套件 | 已审查 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ottokit | Y | Y | Y | Y | — | Y | · | · | · | Y | 2026-08-12 | Connector. Workflows, recipes and run history are CLOUD state with no local copy, so they stay **L** link-outs; their REST is machine-to-machine (`st_authorization` shared secret) and is never called. Local table `{prefix}suretriggers_webhook_requests`; retry through their `WebhookRequestsController::suretriggers_retry_trigger_request` (fires a real `wp_remote_post`, so fixtures point at 127.0.0.1:9 to stay offline); `created_at` is `current_time('mysql')` = site-local, emitted raw; installed-inactive |

### 仅设置 / 其他表面

| 适配器 | 形态 | 套件 | 已审查 | 备注 |
|---|---|---|---|---|
| perfmatters | 仅设置（核心 Settings API）；系列 `performance` | Y | 2026-07-14 | Settings-API 映射器参考 |
| autoptimize | 仅设置（精选选项）；系列 `performance` | Y | 2026-07-14 | 切换存储 `on`/空；清理仍在 cache-purge 中 |
| asset-cleanup | 仅设置（JSON 选项）；系列 `performance` | Y | 2026-07-14 | 页面级卸载管理器深链接 |
| performance-lab | 功能列表 + 状态 + 启用/停用；系列 `performance` | Y | 2026-07-14 | WordPress Performance Team 独立插件中心 |
| licenses | Extensions → Licenses（筛选提供方） | Y | | 新供应商使用 license-manager skill 循环 |
| spam | 设置 → Spam 卡片 | Y | | |
| seo | Editor panel (providers) | Y | 2026-08-12 | SureRank added (6th provider): GROUPED postmeta blobs read via their Get::all_post_meta() flatten + written via Post::update_post_meta_common(); empty values UNSET the key inside the group because their save path substitutes the site-wide template ('%title% - %site_name%') and would store it as the post's own; social thumbnail maps facebook_image_url/_id |
| meta-box | 编辑器面板（简单字段） | Y | 2026-07-14 | 克隆/媒体 = 锁定 + 深链接 |
| seriously-simple-podcasting | 编辑器面板（ssp_post_types 上的 episode 详情） | Y | 2026-07-17 | Schema 直接来自其 CPT_Podcast_Handler::custom_fields()（容器服务）；采用 'on'/'' 复选框约定；封面图锁定；Castos 同步未触碰；活动 fixture + 固定演示 episode |
| the-events-calendar | 编辑器面板（tribe_events 上的 Event 详情）+ `suggest` 面板原语 | Y | 2026-07-17 | 通过其自有 REST 端点 payload 形状中的 Tribe__Events__API::saveEventMeta 写入；场地/组织者使用新的异步建议字段（minimal-admin/v1/tec/suggest）；多组织者事件锁定该字段；重复事件/票务/时区 = **L**。活动 fixture（六件套） |
| powerpress | 编辑器面板（文章上的默认频道 episode） | Y | 2026-07-17 | Enclosure blob 镜像（已记录例外：没有可调用的写入模型）；基于差异重建，未管理的额外内容按字节保留；手动编辑时设置 set_duration/set_size 标志；清除 URL = 使用其移除流程；已安装但未启用（SSP 是播客常驻项） |
| wp-job-manager | 编辑器面板（job_listing 上的 Listing 详情） | Y | 2026-07-17 | Schema 直接来自其 get_job_listing_fields()（按站点/附加组件筛选）；其 per-field sanitize_callbacks 规则负责写入（application email-or-url、expiry Y-m-d）；复选框为 1/0 整数；其保存操作受 nonce 门控，因此 REST 写入安全；rest_base job-listings；活动 fixture |
| pods | 编辑器面板（扩展类型上的简单字段） | Y | 2026-07-14 | 高级类型锁定 + 深链接 |
| safe-svg / svg-support | 媒体 SVG 筛选标签页 + 以提供方命名的详情备注 | Y | 2026-07-17 | 清理仍由插件负责；备注仅针对 Safe SVG；SVG Support 已安装但未启用 |
| regenerate-thumbnails / force-regenerate-thumbnails | 媒体详情 ↻ 缩略图 | Y | 2026-07-17 | RT 通过其 Regenerator 类；RT 不存在时，FRT 通过自己的 admin-ajax + nonce；FRT 已安装但未启用 |
| enable-media-replace | 媒体详情「Replace file」（EMR 自有 ReplaceController） | Y | 2026-07-17 | 仅原位替换（名称/URL 不变，强制同类型）；重命名/移动 = **L**，转到 EMR 界面；活动 fixture |
| media-folders (FileBird / RML Lite / Premio Folders) | 媒体视图文件夹组合框（`minimal_admin_media_folders` 提供方契约） | Y | 2026-07-17 | 先浏览；三个内置提供方，优先使用第一个活动提供方（FileBird 通过自己的模型，遵循按用户模式；RML 通过 wp_rml_* API，根目录 -1 「Unorganized」 → 保留 id 0；Premio 通过其 REST 暴露的 `media_folder` 分类法，include_children 与其筛选器一致）。文件夹管理 = **L**，转到各插件界面。FileBird 为活动 fixture；RML + Premio 已安装但未启用（一次启用一个的约定） |
| cache-purge | ⌘K 清理器（+ Redis System 行） | Y | 2026-07-12 | SpeedyCache、Redis、Breeze、Nginx Helper、Cloudflare 组合包 |
| site-kit / koko / burst / ia / … | 流量提供方（+按天钻取） | 部分 | 2026-07-29 | Koko、WP Statistics、Burst、Independent Analytics、Matomo、Jetpack Stats 的概览图表 + traffic_day |
| matomo | 流量提供方（+按天钻取） | Y | 2026-07-29 | 通过 Bootstrap + `doAsSuperUser` 使用其报告 API（参照其 Annotations 先例）；`view_matomo` 门控；15 分钟 transient（环境启动约 300ms）；数字与其界面匹配，包括每小时 cron-archive 延迟；已安装但未启用（Koko 常驻）；套件通过其 HTTP tracker + `minimal_test_matomo_archive` 初始化，运行其归档器 |
| jetpack-stats | 流量提供方（+按天钻取） | Y | 2026-07-29 | WPCOM_Stats 博客令牌客户端（其 5 分钟缓存）；门控：已连接 + 统计模块 + `view_stats`；优先级 20（Site Kit 层级）；按页面计数仅为 views-only，符合 WPCOM 设计；2026-07-29 在实时连接站点端到端验证（访问量、热门文章、引荐来源均与其界面匹配）；已安装但未启用 |
| query-monitor | 面板（不是界面） | — | 2026-07-13 | 页脚启用 + 启动器芯片；仅限当前请求 |
| scrutoscope | 诊断系列（列表 + 详情 + 状态 + Cron 视图 + 1.4+ 的 Profile this hook） | Y | 2026-08-06 | 系列 `diagnostics`；采集界面 = **L**；Profile 会在其 profiler 下触发真实副作用；**1.5+ 完全不直接执行 SQL**（列表通过其 `/v1/profiles`，状态通过 `Storage::get_table_stats()`），保留列读取作为 1.5 之前的回退 |
| wp-crontrol | 诊断系列（列表 + 详情 + 状态；运行/暂停/恢复/删除） | Y | 2026-07-13 | 系列 `diagnostics`；添加/编辑 PHP/URL 任务 = **L** |
| transients-manager | 诊断系列（列表 + 详情 + 状态；删除 + 删除过期项） | Y | 2026-07-13 | 系列 `diagnostics`；绝不反序列化；编辑界面 = **L** |
| rewrite-rules-inspector | 诊断系列（列表 + 详情 + 状态；刷新 + 测试 URL） | Y | 2026-07-13 | 系列 `diagnostics`；通过其 RewriteRules / UrlTester；不提供强制 .htaccess 刷新 |

## 刻意保留的深层链接（不要作为 Axis B 重新提议）

- 表单 / 页面 / 条件 **构建器** 和 OAuth 握手
- 备份 **恢复**（手术操作，不是日常运维）
- GSMTP **路由条件树**编写（列表/切换/删除已接入）
- GF **通知**事件 / 条件逻辑 / 路由规则（日常字段已接入）
- 没有 fixture 的 Pro 专属存储（WP Mail SMTP Pro 完整日志、WPForms Pro 条目）

## 扫描日志

| 日期 | 范围 | 结果 |
|---|---|---|
| 2026-07-12 | 技能与本矩阵创建 | 已将仅报告优先的运维手册加入 `dev-minimal-admin`；不自动发布 |
| 2026-07-13 | v0.14.0 开放 / 开发工具审核 | QM 被归类为仅面板；Scrutoscope + WP Crontrol + Transients Manager 列入插件支持 Wave A；不发布 |
| 2026-07-13 | Scrutoscope 适配器 | Profiler 表面已发布（配置文件、详情、状态、Cron 视图、删除）；套件 22 项检查 |
| 2026-07-13 | WP Crontrol 适配器 | Cron 表面已发布（列表、立即运行、暂停/恢复、删除、状态）；套件 20 项检查 |
| 2026-07-13 | 诊断族 + Transients | Scrutoscope + Crontrol + Transients Manager 合并为一个 Tools 项；TM 套件 17 |
| 2026-07-13 | Rewrite Rules Inspector | Diagnostics → Rewrites（列表、刷新、测试 URL）；套件 15 |
| 2026-07-14 | 重点报告：邮件 → 表单 → 活动日志 | 下方为排名待办事项；**不发布**（报告优先）。邮件参考 = Gravity SMTP；fixtures：FluentSMTP + WP Mail Logging + Gravity SMTP 已激活 |
| 2026-07-14 | 发布第 1 项：fluent-smtp 搜索 + 删除/批量删除 | 与 GSMTP/WPML 的 Axis A 一致性；mail-log 套件 17 项检查 |
| 2026-07-14 | 完整的仅报告重新扫描（邮件 → 表单 → 活动日志 → 重定向/代码片段 → 备份；fixture 清单） | 已修正矩阵单元格（forminator/formidable/everest/fluent-forms）；**不发布**。首要发布项 = post-smtp 搜索 + 删除/批量删除 |
| 2026-07-14 | 发布：post-smtp 搜索 + 单个/批量删除 | 与 WPML/FluentSMTP 的 Axis A 邮件一致性；mail-log 套件已扩展 |
| 2026-07-14 | 发布：fluent-forms Playwright 套件 | Axis A 覆盖缺口已关闭；24 项检查（列表/标签页/筛选/搜索/详情/回收站/删除/管理）；seed `minimal_test_seed_fluent_forms` |
| 2026-07-15 | Axis A：gravity-smtp 批量删除日志 | 通过 Event_Model（DELETE_EMAIL_LOG）执行单个 + 批量删除；mail-log 套件已扩展；已修正 cf7/cfdb7/ninja 批量矩阵（代码中原本就是 Y） |
| 2026-07-15 | Axis A：活动日志状态卡 | Simple History、WSAL、Stream、Aryo 状态卡（24 小时/7 天/总计 + 族特定混合数据）；套件 `activity-log-status` |
| 2026-07-17 | 发布第 1 项：sectionsRoute 行类型 | 在 sections 详情渲染器中加入 `pill`/`code`/沙盒化 `html-preview`/`kv-table` 行；契约 fixture Log 视图使用恶意负载测试全部四种类型（套件 detail-rows，19 项检查，包括沙盒和转义证明）；Gravity SMTP 日志详情已转换为首个消费者（状态标记、HTML 正文预览、标头键值表）。Fluent/Post/WPML 转换是自然的后续切片 |
| 2026-07-17 | Wave B：SureMails + Site Mailer 邮件适配器 | 两者都基于已验证的免费日志表；完整邮件系列处理（列表/标签页/搜索/删除/状态+图表/分区详情，HTML 使用沙箱隔离）。新增共享辅助函数 minimal_admin_db_local_to_utc_iso()：DEFAULT current_timestamp() 使用数据库 SESSION 时区（托管主机为 UTC，Cove 的开发 MariaDB 为 LOCAL）——向数据库查询一次其偏移量并进行转换，可在任何主机上正确工作。测试套件 wave-b-mail 17。两者均已安装但未激活。SEED 注意事项：`wp eval "…$wpdb…"` 会让 shell 展开 $wpdb；请使用 eval-file |
| 2026-07-17 | Wave B：安装 + 源码验证（AIOS、GoSMTP、SureMails、Site Mailer） | 四者全部已安装；已验证免费层日志存储。AIOS 已交付（activity-log 审计信息流）。SureMails（{prefix}suremails_email_log）+ Site Mailer（site_mail_logs）已验证会免费存储完整日志→邮件系列适配器进入排队。GoSMTP 跳过：其 \GOSMTP\Logger 仅限 Pro 版，免费构建不存储日志（wp-mail-smtp-free 模式）。AIOS + 两个邮件候选插件均已安装但未激活；GoSMTP 保持安装但未激活，并记录为已说明的跳过项 |
| 2026-07-17 | 重定向同族状态卡（Axis A 一致性批次） | SRM（CPT + 状态码/正则元数据；无命中数据，卡片如实停留在规则），Simple 301（选项数组 + 通配符切换），EPS（自有表：规则、生命周期命中数、顶级重定向、404 日志）。套件 `redirects-status`（7）激活每个未激活的同族插件并恢复。状态卡一致性章节已完成：邮件、代码片段和重定向中的每个表面现在都会以卡片打开 |
| 2026-07-17 | Snippets 系列状态卡片（Axis A 对齐批次） | wpcode（CPT publish=active + type 元数据）、fluent-snippets（已索引的文件存储）、custom-css-js（CPT + _active 元数据；从序列化选项中通过正则快速读取语言，绝不反序列化）、hfcm（自有数据表）。全部匹配 code-snippets 卡片形状；测试套件 snippets-adapters 19 / snippets-leftovers 15 |
| 2026-07-17 | 邮件族 sections 详情（Axis A） | fluent-smtp、post-smtp、wp-mail-logging 日志详情已转换为 sectionsRoute，并采用新的行类型（GSMTP 模式）：状态标记、沙盒化 HTML 预览/代码正文、每个存储的额外信息（提供方回复预览、失败信息 + 建议修复、原始标头）。保留扁平路由供 API 消费者使用；mail-log 套件 30 |
| 2026-08-09 | v0.26.0 发布前检查（update-all + smoke） | 自昨天的检查以来提供了三项更新：metform 4.1.9 已更新（无适配器）；perfmatters 2.6.7 和 searchwp 4.6.1 下载失败（许可证限制，已知模式——已记录，不阻塞）。已安装的 2.6.6 中，Perfmatters 设置路由冒烟测试返回 200。无适配器相关变更，无破坏性变更 |
| 2026-08-08 | v0.25.0 预发布检查（update-all + smoke） | **Gravity Forms 2.10.5 → 3.0.2（主版本）**：完整路由冒烟测试通过（gf/v2 forms/entries、shim 的 forms/notifications/entry detail/form settings；notes 路由按设计仅支持 POST），gf-notifications + gf-form-settings 套件已在发布预检中运行。Elementor 4.2.2 及其他补丁级更新没有与适配器相关的变化。没有破坏性变化 |
| 2026-07-17 | 发布下一项：code-snippets 状态卡 | 来自其自有表的激活/未激活/回收站计数、运行范围、最后变更以及安全模式警告行（根据其 class-db 文档块，active -1 = 已移入回收站）；套件 code-snippets 26。扫描卫生说明：报告中代码片段/重定向「族状态一致性」的说法是 grep 过度匹配；这两张卡是各族首次实现，同族插件才是实际一致性待办事项 |
| 2026-07-17 | 可排序界面列（Austin 的要求） | 新集合原语：列 `sort` tokens + `sortQuery` 模板，支持点击的表头遵循 users-list 的排序方向约定（num/ago 初始为降序）；验证器、作者指南和契约 fixture 保持同步（契约 39）。首先接入 Redirection（Source/Hits/Last hit 使用其 orderby 词汇）；测试套件 redirection-status 现为 14 |
| 2026-07-17 | 发布第 1 项（第二切片）：redirection 状态卡 | 来自 Redirection 自有日志表的规则/命中/已提供/404 行 + 双序列 14 天图表（由 SHOW TABLES 控制，站点本地 DATE 分桶与其日志视图一致）；套件 redirection-status（10）。重定向族中的第一张状态卡 |
| 2026-07-17 | PowerPress 面板（播客分类已完成） | 普通文章上的单集面板，仅限 DEFAULT 频道（普通 `enclosure` 元数据）。不存在可调用的写入模型（其保存操作是一个由 $_POST['Powerpress'] 处理器、nonce/POST 门控的处理流程 → 不适合 REST），因此镜像 blob 格式——记录为带防护措施的例外：其精确的 allowed_classes=>false 反序列化；基于差异的重建（未改动保存 = 字节级相同 blob，已通过探测证明）；未管理的额外字段（托管、章节、封面、50+ 个键）按字节保留；手动修改时长/大小会设置其 set_duration/set_size 「modify」标志；清除 URL 会删除 enclosure + legacy itunes:duration（其移除流程）；episode_type 枚举 ''/full/trailer/bonus；URL 变更时通过 powerpress_get_contenttype 自动推导内容类型。自定义频道（_slug:enclosure）+ podcasting 文章类型 + 封面/显式内容/章节/文字稿 = 其 metabox（锁定 4 个）。套件 powerpress-panel（8，激活 + 恢复）。已安装但未激活（SSP 常驻）。播客分类已根据同族报告完成（Podlove/10up/Podcast Player = 已记录的跳过项） |
| 2026-07-17 | WP Job Manager 面板（SSP-siblings 报告后续） | job_listing 上的职位列表面板（rest_base job-listings）：14 个字段，0 个锁定字段，在请求时从 WP_Job_Manager_Post_Types::get_job_listing_fields() 获取（已由 job_manager_job_listing_data_fields 过滤——插件扩展会实时跟踪）。字段声明 sanitize_callback 时，写入会调用各字段自己的 sanitize_callback（申请邮箱或 URL、到期日期→垃圾值时变为 ''），checkbox 的 data_type 为 integer 1/0，select 会进行枚举验证。其 save_post 处理器受 job_manager_nonce 保护→REST 安全。测试套件 wpjm-panel（6）。ACTIVE fixture。报告剩余项：PowerPress（enclosure-blob 特殊问题，M），待 podcasting 类别关闭后处理 |
| 2026-07-17 | TEC 事件详情面板 + 异步建议原语（Austin 从 SSP-siblings 报告中选定） | 新面板字段类型 `suggest`（formControlHtml/formControlValue/bindSuggestField + 面板绑定器）：支持异步搜索的选择器，字段声明 `route`，使用 &q= 获取，行格式为 [{value,label}]，Minimal 会前置「— None」，值以 {value,label}|'' 往返——已记录在作者指南中。TEC 适配器：tribe_events 上的事件详情面板（开始/结束时间为「YYYY-MM-DD HH:MM」文本、全天、通过 minimal-admin/v1/tec/suggest 提供场地+组织者建议、费用、网站），通过 Tribe__Events__API::saveEventMeta 写入，并使用其 REST 端点的精确 payload 形状（EventStartDate Y-m-d + EventStartTime H:i:s + venue.VenueID + organizer.OrganizerID）。来之不易的结论：tribe_events() ORM 无法更新不带日期的草稿（其查询会连接开始日期元数据——这正是 Minimal 的 + New 输出）；saveEventMeta 可以处理。结束时间早于开始时间时，TEC 会自动修正（这是其后台行为），而不是拒绝；真正无效的元数据 → 其返回 false → 400。多组织者事件会锁定组织者字段（单选会丢失其余组织者）。测试套件 tec-panel（8，真实类型化建议选择 + 全天日期边界对齐） |
| 2026-07-17 | Seriously Simple Podcasting 适配器（Austin 的请求） | 审核结论：Minimal 中的单集已经是一等对象（`podcast` CPT show_in_rest，通过 edit_post 映射自定义 podcast 权限）——缺少的部分是单集详情 metabox，现已发布为 **Podcast 单集编辑器面板**。架构从 ssp_app()->get_service('cpt_podcast_handler')->custom_fields() 实时读取（radio→select、episode_file→url、checkbox→'on'/'' 存储，跳过 hidden/sync_status，封面图片锁定）；在 ssp_post_types() 上使用专用 minimal_ssp REST 字段（从不使用通用 meta）；枚举写入会根据其选项验证。安全性：其 save_post 处理器没有 metabox nonce 时会退出，因此 REST 保存不会被覆盖；不会触碰 Castos podmotor 字段。Feed/show 设置（series taxonomy + ss_podcasting_* 选项框架）= 延后，术语管理器已覆盖 series。套件 ssp-panel（7）。已激活 fixture + 常驻的 「Welcome to the Show」 单集 |
| 2026-07-17 | GF Feeds 视图（待办排名第 10 项已解决） | 结论：发布 feeds VIEW，配置 MAPPER 延后。GF 表面新增 Feeds `views[]` 条目（仅在存在 GFFeedAddOn 时注册）：每个表单中的所有扩展集成，带有每个表单的标签页、激活/停用（GFFormsModel::update_feed_property）、删除（GFAPI::delete_feed）、指向扩展 feed 页面（subview={slug}&fid={id}）的深层链接。艰难解决：GFAPI::get_feeds 默认 $is_active=true——必须传 null，否则停用的 feed 会消失（构建期间发现的问题）；其「not_found」 WP_Error 仅表示没有 feed。配置映射器已延后，full-ui-adapters.md 中记录了结论（需要第二个项目范围设置原语，以及无需凭据即可映射的扩展 fixture）。FIXTURE：minimaladmin 上的 gravityformstwilio 已激活（从锚点复制，遵循 GF 约定）。套件 gf-feeds（10）；gf-notifications 的固定切换器列表放宽为前三项（rule-52 class） |
| 2026-07-17 | fluent-smtp 设置标签页（待办排名第 9 项已解决） | 结论：接入杂项设置，并为向导添加深链接。FluentSMTP Email 界面新增 `settings` 标签页：默认 + fallback 连接（使用其连接的组合框，仅显示标题/发件人——绝不显示凭据；未知 key→400）、log_emails 开关、保留期限 select（使用其预设天数；非标准存储值仍可选）、simulate_emails 开关（当 FLUENTMAIL_SIMULATE_EMAILS 常量强制启用时隐藏并锁定）。通过 Settings::getMisc() 读取，通过 Settings::updateMiscSettings() 写入——与其自身 SettingsController 完全一致。每个 provider 的连接向导仍在 FluentSMTP 应用中（深链接）。测试套件 fsmtp-settings（8）；mail-log 仍为 30 |
| 2026-07-17 | 移入文件夹（媒体批量栏） | 契约新增可选 `move( $folder_id, $ids )`（0 = 不属于任何文件夹；启动时 mediaFolders.move 控制 UI；仅在提供时注册 POST media/folders/move，并执行 upload_files + 提供方自身检查）。批量栏新增文件夹选择器 + Move 按钮（选择前 Move 禁用；完成后清除计数缓存）。三个提供方均通过自身机制接入：FileBird 使用 verifyAuthor + Folder::assignFolder（其钩子和计数器会触发），RML 使用 wp_rml_move（其验证，移出时根目录为 -1），Premio 使用 wp_set_object_terms（空列表 = Unassigned）。三个提供方均双向完成移动探测；套件 media-folders 20 |
| 2026-07-17 | Wave D 对齐要点：SVG Support + FRT | SVG Support 加入 Safe SVG 门控（两者都激活时 Safe SVG 优先；启动 `svgProvider` 指明其名称；详情说明仅对 Safe SVG 声明清理——其上传时清理由每个角色的配置决定）。Force Regenerate Thumbnails 通过其自己的 admin-ajax 处理器 + 启动中的「force-regenerate-attachment」 nonce `frt` 加入 ↻ Thumbnails（参考 wcpdf；遵循其 cap 属性；两者都激活时 RT 优先；FRT 的删除过期文件语义与其 Tools 界面一致）。测试套件：safe-svg 12（provider swap 分支）、media-regen 10（真实 FRT ajax 重建）。两者均已安装但未激活（Safe SVG + RT 保持为常驻插件）。WAVE D 完成 |
| 2026-07-17 | Wave D：RML Lite + Premio Folders providers | 两个同系列插件均加入 minimal_admin_media_folders。RML：公开的 wp_rml_* API（wp_rml_objects / wp_rml_get_attachments；每个文件夹使用 getCnt）；根 id -1「Unorganized」映射到契约保留值 0；Lite 不支持子文件夹/按用户。Premio：普通 WP taxonomy `media_folder`（仅当选项 folders_settings 包含「attachment」时注册——2026-07-17 在 minimaladmin 上已 SET，请保留）；term=文件夹，通过 tax_query include_children 获取 ID（遵循其过滤语义），未分配（-1 视图）=保留值 0；taxonomy 启用 show_in_rest，因此测试套件通过 CORE REST 写入 fixture。两者均使用真实分配完成 E2E 探测；测试套件 media-folders 15（阶段 2 = 实时 FileBird→Premio 切换，finally 中恢复常驻插件）。RML 测试分支跳过：没有 REST 写入路径（已通过 probe 验证） |
| 2026-07-17 | Wave D：媒体文件夹契约 + FileBird | 新 provider 筛选器 `minimal_admin_media_folders`（first-non-null，traffic 风格；已记录在作者指南 + Integrations listeners 中）：folders() 返回带 parent+count 的扁平列表（id 0 保留为 Uncategorized），ids(folder)。核心路由 GET media/folders（按树排序并包含 depth）+ media/folders/{id}/ids（最多 500 个，带 capped 标志）→客户端通过 include= 使用文件夹组合框进行筛选（空文件夹直接结束——没有 ID 的 include= 表示不筛选）。FileBird provider 使用其自己的模型（allFolders/countAttachments/verifyAuthor/getAttachmentIdsByFolderId；通过其 fbv_folder_created_by filter 支持按用户模式；未分类项复刻其限定范围的 NOT IN 子句）。测试套件通过 FileBird 自己的 REST 写入 fixture（filebird/v1 new-folder/assign-folder/delete-folder，upload_files + nonce）：测试套件 media-folders（12）。FileBird ACTIVE fixture。移动到文件夹 + RML/Premio providers = 后续工作 |
| 2026-07-17 | Wave D：核心媒体优化 | 未关联的静默筛选器（核心 parent=0）、月份组合框（新增 GET minimal-admin/v1/media/months；客户端构建包含起止日期的本地窗口）、媒体详情模态框中的「Attached to」（附件上的惰性 REST 字段 minimal_attached_to：parent 标题/类型/rest_base/editable；点击跳转到父级编辑器）。媒体工具栏移动到两行视图/筛选器约定中。测试套件 media-polish（15）。关闭核心媒体缺口项；Wave D 排名第 6 项全部交付 |
| 2026-07-17 | Wave D 开篇：启用 Media Replace 适配器 | 通过 EMR 的 ReplaceController（MODE_REPLACE + TIME_UPDATEMODIFIED，其默认值）在媒体详情模态框中替换文件：删除旧文件，将新文件写入相同路径，重建元数据和缩略图，并触发其 hooks。权限与 EMR 保持一致（upload_files + checkImagePermission，遵循 EMR_CAPABILITY）。服务端执行同类型保护（原地替换会保留 URL，因此扩展不能谎报类型）；重命名并搜索仍使用 EMR 的界面。启动标志 `mediaReplace`；测试套件 media-replace（12，真实文件选择器 + 已提供服务的字节证明）。minimaladmin 上的 EMR ACTIVE fixture |
| 2026-07-17 | v0.18.0-open 仅报告重扫（全部 73 个适配器，原语 grep + fixture 状态） | v0.17.0 暂停后恢复各 Wave。邮件图表对齐已确认完成（fluent-smtp、post-smtp、wp-mail-logging 都包含 `chart`）。Axis A 新发现：**redirection**（活跃常驻）和 **code-snippets**（活跃常驻）是唯一没有 `status` 卡片的系列界面。sectionsRoute 行类型仍未构建（`pill` 仅作为列格式存在）。Fixture 备注：SearchWP 已停用（其 profile_update loopback 拖慢每次用户保存；许可证读取在停用状态下仍可用）。Wave B/D 候选（AIOS、GoSMTP/SureMails/Site Mailer、SureForms/MetForm、FileBird、Enable Media Replace）均已卸载。**不交付。** |
| 2026-07-23 | v0.21.0 open 时的路线图文档过期检查 | v0.19.0（WooCommerce 深度）、v0.20.0（同意机制 + Search & Filter Pro / Admin Columns Pro 许可证）以及未发布的 v0.21.0（优化：i18n、a11y、启动整合、更新器 hash）周期均没有适配器工作，因此矩阵保持不变。排名待办第 4-5 行已划除（2026-07-17 待办写下后当天晚些时候已交付）。当前开放待办仅剩排名第 7 项：WPForms Pro 条目（fixture 需要 Pro 许可证） |
| 2026-07-24 | v0.22.0 open 时的路线图刷新（v0.21.0 同日发布） | v0.22.0 周期以只读数据库查看器开场，这是一个 NATIVE 界面（`class-minimal-admin-db.php` + 专用 view，`native-editors.md` case study 2），而不是适配器，因此矩阵未变。本周期尚无适配器工作。开放待办不变：WPForms Pro 条目（受许可证阻塞），以及有意保留的长尾项目（当重扫安排时处理系列状态卡片同类插件） |
| 2026-07-27 | v0.22.0 适配器重扫（仅报告）：先 update-all，再盘点 | **插件：**minimaladmin 上 21/22 已更新（列表见下）。**Elementor Pro 4.1.2→4.2.0 更新失败**（许可证门控）；免费版 Elementor 为 4.2.0，因此免费版/Pro 版本不一致。Axis A 矩阵单元格仍与代码一致（邮件图表对齐、邮件/重定向/snippets/activity-log 状态卡片、适用时的表单管理）。根据变更日志，Axis B：**Scrutoscope 1.4** 的按需 cron 分析是真正的交付候选（admin-ajax + `Profiler::profile_cron_hook`）；Cron view 当前仅用于盘点。Disembark 2.8 restore 明确为 **L**（手术式操作）。Stream 4.3 / WSAL 5.6.5 / IA 2.15 / SVG Support 2.6 / Updraft 1.26.6 / Yoast 28.1：没有适配器可见的日常运维变化。Smoke：elementor submissions、scrutoscope profiles+cron、disembark status 均为 200。**不交付。** |
| 2026-07-27 | 交付排名第 1：scrutoscope Profile this hook | Axis B：Cron view 行操作 POST `minimal-admin/v1/scrutoscope/cron/{id}/profile` → `Profiler::profile_cron_hook`，并携带该行的 scheduled args；确认名称及副作用；方法不存在时隐藏操作。Fixture no-op hook 由现有 seeder 调度，使用 `minimal_scruto_profile_noop`。测试套件 scrutoscope 已扩展。 |
| 2026-07-27 | 下一项交付排名第 1：disembark Restore 深链接 | Axis B：当存在 `\Disembark\Import`（2.8+）时，状态卡片 `Restore a backup` href → `tools.php?page=disembark`；恢复 UI 仍为 **L**。测试套件 disembark 已扩展。 |
| 2026-07-27 | 下一项交付：AIOS 登录失败 / 永久封禁状态 | Axis B：状态卡片新增 Failed logins (24h) / Locked out now / Permanent blocks，数据来自 `aiowps_login_lockdown`、`aiowps_permanent_block`、audit_log `failed_login`；System `minimal_admin_aios_checks()` 健康行；深链接到 AIOS 的 locked-ip / permanent-block 标签页。测试套件 aios-log 已扩展。 |
| 2026-08-06 | scrutoscope：接入其 1.5 列表 API（供应商报告，GitHub issue #3） | 轴 B，由插件作者推动。Scrutoscope 1.5.0 特别新增了 `GET /scrutoscope/v1/profiles`，以便集成方停止读取数据表；列表现在通过 `rest_do_request` 使用该接口（以 `RestApi::shape_profile_list_item` 为门控，即其契约命名的整形器），状态总数通过 `Storage::get_table_stats()` 获取。**收益不在于整洁：其输出 Sanitizer 会在该路径运行，而我们的路径不会**（对于旧版本写入的行，缩减后的 SQL + 仅主机 HTTP URL 会在读取时重新应用，作为纵深防御；直接 SELECT 会跳过它）。同一轮还修复了一个 Minimal 自身造成的缺口：「Profile this hook」写入 `profile_type=on_demand`，但标签页固定为 pinned/session/background，因此 Minimal 的采集结果只能在「All profiles」下找到。新增 On demand 标签页，并从 `route_class` 添加 Context 列。保留列读取，以兼容 1.5 之前的版本。套件 scrutoscope 29→34。 |
| 2026-08-06 | 交付排名第 1：FluentSMTP 2.3.0 追赶更新（全部三个切片） | 重新发送现在使用其 `Logger::resendEmailFromLog($id,'resend',$recipients)`——`resent_count` + `extra['resends']` 轨迹记录，恢复 headers/attachments，重定向时丢弃 cc/bcc，不产生重复日志行（`FLUENTMAIL_LOG_OFF`）；受 `resent_count` 列门控，因此低于 2.3.0 的构建会保留 `wp_mail` fallback，绝不会在更新失败时部分发送。新增参数化「Resend to…」操作（逗号分隔的覆盖值，全量或全部验证；仅限详情模态框——列表行按设计渲染无字段操作）。详情分区新增 Resends 轨迹（通过其 `Logger::find`；其反序列化会拒绝对象）。ConnectionHealth（2.3.0）提供状态卡片行（All passing / N failing / Not checked yet）和 System 健康行（`minimal_admin_fluent_smtp_checks()`：全部失败 = fail，部分失败 = warn，插入 AIOS 之后）。权限通过 `fluent_mail/manage_capability` 解析（存在时使用其辅助函数）。测试套件：mail-log 30→36，fsmtp-settings 8 通过。E2E：真实 Mailpit 投递、覆盖值 + 400 路径、其针对实时连接的 checkAll()。 |
| 2026-08-06 | 残余测试套件通过（重扫收尾） | 本次更新波次剩余的活跃 fixture 适配器已完成测试套件验证：seo-mappers 11（**AIOSEO 4.9.10→5.0.0.1 大版本确认兼容**——测试套件使用 AIOSEO 自己的模型驱动面板；Yoast 28.2 + SEOPress 10.1 也已覆盖）、media-folders 20（FileBird 6.5.7）、tec-panel 8（TEC 6.17.2）、cache-purge 11（Breeze 2.5.12）、activity-log-status 20（Simple History 5.30）、meta-box-panel 19（Meta Box 5.14）。全部通过，无需修复。重扫周期全部关闭：待办为空，fixture 欠账已清。记录中的未排名未来候选：Really Simple SSL 9.7 状态 provider（plugin-support 波次）、GoSMTP 仍为已说明的跳过项（免费构建不存储日志）。 |
| 2026-08-06 | WPForms Pro 条目适配器（首发第 1 个、第四批——最后一个大型表单产品名） | adapters/wpforms.php：完整处理表单系列。读取 = 按前缀限定的 SELECT（对 fields JSON 使用 LIKE 搜索）；写入通过其 `wpforms()->obj('entry')` 处理器（更新/删除——钩子会触发，删除会清理 entry_fields + entry_meta，已验证剩余行数=0）。权限遵循 `wpforms_current_user_can()`（view_entries/edit_entries/delete_entries；编辑器 = 403 + 隐藏界面，已通过实测检查）。来之不易的发现：`date` 列使用 UTC（10:22 EDT 存储为 14:22）→ 输出 ISO Z + 列 utc:true；显示状态由 spam/trash，否则为 viewed；打开详情会通过其更新操作标记为已查看（其界面行为；spam/trash 永不执行）；其 `get_entries()` 搜索机制有意不使用（高级搜索复杂；LIKE 匹配其回退逻辑）。对带有「★」项目键的条目按网关条件执行加星/取消加星。仅在条目处理器存在时注册（Lite = 不注册）。测试套件注意事项：使用 execSync + `wp eval` 和 JSON.stringify 后的参数会让 shell 将 `$wpdb`/`$f` 展开为空——套件的 wp() 辅助函数会写入临时文件 + `eval-file`；表单系列详情模态框是联系人卡片（renderEntryDetail——没有「Answers」标题；断言卡片内容）。套件：wpforms 16，forms-status 14。 |
| 2026-08-06 | 表单系列状态卡片（Axis A 对齐批次，交付排名第 1 的第三个切片） | 五张匹配 SureForms 形状的卡片：**fluent-forms**（来自 fluentform_submissions 的未读数 + 总数/垃圾邮件提示、表单数）、**ninja-forms**（实时 nf_sub 发布数 + 垃圾箱提示——不是 nf3_forms.subs，后者在删除后仍会保留；不存在读取状态，因此标题为 Submissions）、**forminator**（与条目列表精确范围一致的已接收/垃圾邮件数：entry_type custom-forms，草稿/放弃项仍显示在其界面）、**cf7-flamingo**（其 CPT 的核心 wp_count_posts——publish/flamingo-spam/trash，不查询模型）、**everest-forms**（未读数 = publish 减去 viewed=1，带垃圾邮件提示——因系列一致性而在排名前四之外追加）。每张卡片都链接到插件真实的条目界面（从插件源码验证 slug：fluent_forms_all_entries / nf-submissions / forminator-entries / flamingo_inbound / evf-entries）。测试套件 forms-status（12）；回归测试 fluent-forms 24 / ninja 13 / forminator 12 / cf7-flamingo 19 / everest 16 全部通过。Integrations validator 无问题。 |
| 2026-08-06 | WC 11.0 深度验证（交付排名第 1，第二个切片） | 针对 WooCommerce 11.0.0 顺序运行全部 10 个电商测试套件：153/153 通过，控制台错误为 0，WC Subscriptions 9.0.1 兼容。对 11.0.0 章节的变更日志审计：移除项是产品区块编辑器功能/路由（Gutenberg 侧；Minimal 从未使用），以及若干移入 Site Health 的 WC 管理员通知（其减少提示；无需接入）。wc/v3 或 Analytics API 界面没有变化。**没有代码变更**——运维待办项在验证后关闭。 |
| 2026-08-06 | Elementor Pro 4.2.1 审查（Austin 已授权并在重扫期间更新） | 4.2.x 的变化是新增 **Atomic Form** 小工具（Atomic Editor）。从源码验证：其 `Collect_Submissions_Action` 通过与经典表单小工具相同的 `Modules\Forms\Submissions\Database\Query` + `Form_Snapshot_Repository` 写入，因此 Atomic Form 提交会进入 elementor-forms 适配器已列出的存储。**无需修改适配器。**4.2.1 本身：没有表单/提交变化。WC Subscriptions 仍受许可证阻塞，停留在 9.0.1。 |
| 2026-08-06 | 适配器重扫（仅报告）：update-all + 上游快速浏览 | **插件：**minimaladmin 上 36/38 已更新。两项失败均受许可证门控：elementor-pro（仍为 4.1.2，目标现为 4.2.1）+ woocommerce-subscriptions 9.0.1。**WooCommerce 10.9.4→11.0.0（大版本）已顺利完成**——wc/v3 orders/products smoke 200；下一次发布截点前运行电商测试套件。Axis B 快速浏览：**FluentSMTP 2.3.0 是发现项**（三个切片，见待办）：其新增 `Logger::resendEmailFromLog()` 记录 `resent_count` + 一条 `extra['resends']` 轨迹，绕过 Minimal 仅使用 `wp_mail` 的重新发送；新增 `ConnectionHealth` 服务（`getReport()`/`getFailing()`，由选项支持）可直接作为状态卡片/System 行；新增 `fluent_mail/manage_capability` filter，取代适配器中三个硬编码的 `manage_options`。非事件：CFDB7 1.4.0（仅设置页，blob 格式不变——界面 200）、GenerateBlocks 2.4（动态标签加固；designs 路由 200，37 个模式）、Meta Box 5.14（Block Bindings = Gutenberg 侧）、Forminator 1.56.x（安全修复）、Disable Comments 2.8（Abilities API；Minimal 直接读取选项）、Simple History 5.30（停用 fixture，使用其 REST）。Smoke：10/10 路由 200（wc/v3、fluent-smtp ×3、cfdb7、gb + kadence designs、overview、plugin-updates）。**不交付。** |
| 2026-08-10 | 发布前检查（切出 v0.27.0） | **插件：** 1/3 已更新——fluentform 6.2.11→6.2.12；perfmatters 2.6.7 + searchwp 4.6.1 均受许可证限制（符合预期）。快速检查 fluentform 6.2.12：条目列表新增 **Spam status filter**（待办：在 fluent-forms 适配器的条目视图中镜像为选项卡）；可选 MCP 服务器默认关闭（无适配器界面）；输出转义/授权加固与 v0.26 安全检查保持一致。无存储或 API 迁移。冒烟测试：更新后 fluent-forms 的条目/表单/状态均返回 200。**不发布。** |
| 2026-08-11 | **Multisite security axis** (v0.28.0 network cycle, lab minimalms.localhost) | Graded every table-shim adapter for network-shared storage. **Fixed (shipped):** four adapters read a `base_prefix` table holding the WHOLE network's data with only a per-site cap — Wordfence (wfLogins), Duplicator (duplicator_packages), Solid Security (itsec_lockouts, one table no site column), and LLA-R in its network-options mode. Each now denies non-super-admins on multisite (the AIOS v0.28.0 scoping pattern; where scoping by site is possible AIOS already does it, where it isn't the data is super-admin-only). **Verified safe (no change):** stream/wp-activity-log/aryo already carry a `blog_id`/`site_id` WHERE clause; simple-history/most log shims + all forms/mail adapters use per-site `$wpdb->prefix` by definition; transients-manager reads per-site `$wpdb->options`; code-snippets is REST-native and owns its own network scoping. **No greenfield ship.** Lab fixtures: wordfence/duplicator/better-wp-security/limit-login-attempts-reloaded copied in, activated on store subsite. |

### Ranked backlog (2026-08-06 sweep)

| Rank | Adapter | Axis | Gap | Effort | Why now |
|---|---|---|---|---|---|
| ~~1~~ | ~~**fluent-smtp**~~ | ~~B~~ | ~~Resend through their `Logger::resendEmailFromLog()` + resend-history detail + "Resend to…" override~~ | ~~S–M~~ | **Shipped 2026-08-06** (mail-log 36) |
| ~~2~~ | ~~**fluent-smtp**~~ | ~~B~~ | ~~ConnectionHealth status-card + System rows~~ | ~~S~~ | **Shipped 2026-08-06** |
| ~~3~~ | ~~**fluent-smtp**~~ | ~~B~~ | ~~Honor `fluent_mail/manage_capability`~~ | ~~S~~ | **Shipped 2026-08-06** |
| ~~1~~ | ~~表单状态卡（fluent / ninja / forminator / flamingo）~~ | ~~A~~ | ~~与 SureForms 的状态卡一致性~~ | ~~每项 S~~ | **已于 2026-08-06 发布**（新增 everest-forms 作为第五项；套件 forms-status 12） |
| ~~1~~ | ~~forms status cards (fluent / ninja / forminator / flamingo)~~ | ~~A~~ | ~~Status-card parity with SureForms~~ | ~~S each~~ | **Shipped 2026-08-06** (+ everest-forms as a fifth; suite forms-status 12) |
| ~~1~~ | ~~WPForms Pro entries~~ | ~~B~~ | ~~Forms family~~ | ~~M–L~~ | **SHIPPED 2026-08-06** (adapters/wpforms.php; suite wpforms 16; forms-status 14). Fixture history: **UNBLOCKED + fixture ready 2026-08-06.** Austin supplied a WPForms Pro 2.0.0.2 zip (dev use; GPL). Provenance-verified before install: 823 shared PHP files byte-identical to wp.org Lite 2.0.0.2, only diff = plugin header line; no eval/base64/odd-host patterns outside vendor; no nulled watermarks; license code intact; single build date 2026-07-22. ACTIVE on minimaladmin; all 13 tables created on activation; entries VERIFIED to store unlicensed through their own `wpforms()->obj('entry')->add()` (license gates updates/addons, not storage). Standing fixture: form 5363 "Minimal Contact Form" (name/email/textarea) + 2 entries (Dana/Miguel). Storage: wpforms CPT (form JSON in post_content), {prefix}wpforms_entries (status/viewed/starred + fields JSON) + wpforms_entry_fields per-answer rows |
| — | ~~woocommerce-subscriptions update~~ | ~~ops~~ | ~~License-gated at 9.0.1~~ | — | **Resolved 2026-08-06**: Austin supplied the 9.1.0 zip; provenance-scanned (pattern-clean, no nulled markers, 474 files identical to installed 9.0.1, coherent 45-file minor-release delta, changelog dated 2026-08-05), manually updated, wcs-subscriptions 18/18 green (their "hardened REST permission checks" don't affect Minimal's admin cookie+nonce path). Elementor Pro was resolved earlier the same day (licensed, 4.2.1). All fixture-update debt is now clear |

Ranks 1–3 (the FluentSMTP 2.3.0 catch-up) shipped as one unit on 2026-08-06.

### Ranked backlog (2026-07-27, v0.22.0 sweep)

| Rank | Adapter | Axis | Gap | Effort | Why now |
|---|---|---|---|---|---|
| ~~2~~ | ~~**disembark**~~ | ~~B~~ | ~~状态卡深链接「恢复备份 ↗」~~ | ~~S~~ | **已于 2026-07-27 发布**（套件 disembark；仅支持 Disembark 2.8+） |
| ~~3~~ | ~~**all-in-one-security**~~ | ~~B~~ | ~~登录失败/永久封禁状态~~ | ~~S–M~~ | **已于 2026-07-27 发布**（状态卡 + System 健康行；套件 aios-log） |
| 1 | **表单状态卡**（fluent / ninja / forminator / flamingo） | A | 与 SureForms 的状态卡一致性 | 每项 S | 可选优化；GF 有意跳过图表/状态；仅在 dogfooding 需要一眼查看收件箱数量时发布 |
| 2 | **WPForms Pro 条目** | B | 表单族 | M–L | 仍需要 Pro 许可证和 fixture；表单名称覆盖中最大的缺口 |
| — | elementor-pro 更新 | ops | 许可证阻塞 4.2.0 | — | 免费版 Elementor 为 4.2.0；Pro 因许可证更新受阻，停留在 4.1.2；表单适配器仍为 200 |
| — | elementor-pro update | ops | License-blocked 4.2.0 | — | Free Elementor is 4.2.0; Pro stuck on 4.1.2 until license updates; forms adapter still 200 |

Superseded open items from 2026-07-17 (struck above) remain shipped. Matrix cells: no Axis A drift found this pass.

### Ranked backlog (2026-07-17, v0.18.0 open)

| Rank | Adapter | Axis | Gap | Effort | Why now |
|---|---|---|---|---|---|
| ~~1~~ | ~~sectionsRoute row types (`pill`, `code`, `html-preview` sandboxed, `kv-table`)~~ | ~~A~~ | ~~Shared detail primitive~~ | ~~M~~ | **Shipped 2026-07-17** (suite detail-rows, 19; GSMTP log detail is the first consumer) |
| ~~3~~ | ~~code-snippets~~ | ~~A~~ | ~~`status` 卡~~ | ~~S~~ | **已于 2026-07-17 发布**（启用/停用/回收、运行范围、最近更改、安全模式行；套件 code-snippets 26）。更正：07-17 报告中「所有同系列项都有一个」的说法，是对 status 一词的 grep 误匹配；Redirection 和 Code Snippets 是各自系列中的首张卡。兄弟卡（wpcode、fluent-snippets、custom-css-js、hfcm、SRM、S301、EPS）现为合理的 S 工作量后续项 |
| ~~4~~ | ~~All-In-One Security (AIOS)~~ | ~~B~~ | ~~活动日志 + 状态~~ | ~~M~~ | **已于 2026-07-17 发布**（审计流 + 级别标签页 + 状态卡；套件 `status`；登录失败/永久封禁状态行留待后续添加） |
| ~~5~~ | ~~GoSMTP / SureMails / Site Mailer~~ | ~~B~~ | ~~新增邮件日志提供商~~ | ~~M~~ | **已于 2026-07-17 解决**：SureMails + Site Mailer 已发布（完整邮件系列处理，套件 `aios-log`）；GoSMTP 为有文档记录的跳过项（免费版本不存储日志） |
| ~~5~~ | ~~GoSMTP / SureMails / Site Mailer~~ | ~~B~~ | ~~New mail-log providers~~ | ~~M~~ | **Resolved 2026-07-17**: SureMails + Site Mailer shipped (full mail-family treatment, suite `wave-b-mail`); GoSMTP is a documented skip (free build stores no logs) |
| 7 | WPForms Pro 条目 | B | 表单系列 | M–L | fixtures 需要 Pro 许可证；最大未覆盖表单产品名 |
| ~~8~~ | ~~媒体文件夹提供商契约（首个为 FileBird）~~ | ~~B~~ | ~~Wave D，优先浏览~~ | ~~L~~ | **已于 2026-07-17 全部发布**（minimal_admin_media_folders + FileBird、RML Lite 和 Premio Folders 提供商 + Move to folder 批量操作；套件 media-folders 20） |
| ~~9~~ | ~~fluent-smtp~~ | ~~B~~ | ~~设置映射器（连接）~~ | ~~M–L~~ | **已于 2026-07-17 解决**：杂项设置已接入（连接路由、日志记录、保留、模拟；套件 fsmtp-settings 8）；按提供商划分的连接向导属于画布部分，仍使用深链接 |
| ~~10~~ | ~~GF 附加组件/Feed 设置~~ | ~~B~~ | ~~来自 full-ui-adapters 的 Schema 导出倍增器~~ | ~~L~~ | **已于 2026-07-17 解决**：Feeds 视图已发布（列表/切换/删除/深链接；套件 gf-feeds 10）；配置映射器延期，并已在书面结论中记录（full-ui-adapters.md） |
| ~~10~~ | ~~GF add-on/feed settings~~ | ~~B~~ | ~~Schema-export multiplier from full-ui-adapters~~ | ~~L~~ | **Resolved 2026-07-17**: Feeds VIEW shipped (list/toggle/delete/deep-link; suite gf-feeds 10); config mapper deferred with a written verdict (full-ui-adapters.md) |

### Ranked backlog (2026-07-15 Axis A pass, superseded)

| Rank | Adapter | Axis | Gap | Effort | Why now |
|---|---|---|---|---|---|
| ~~1~~ | ~~**simple-history / wsal / stream / aryo**~~ | ~~A~~ | ~~**状态**卡~~ | ~~S–M~~ | **已于 2026-07-15 发布** |
| ~~1~~ | ~~**simple-history / wsal / stream / aryo**~~ | ~~A~~ | ~~**status** cards~~ | ~~S–M~~ | **Shipped 2026-07-15** |
| 1 | sectionsRoute row types (`pill`, `code`, `html-preview`, `kv-table`) | A | Email-log detail fidelity | M | Shared primitive; benefits GSMTP/Fluent/Post detail |
| 4 | GoSMTP / SureMails / Site Mailer | B | 新邮件日志提供方 | M | **未安装**；先验证是否免费存储日志 |
| 5 | WPForms Pro 条目 | B | 表单系列 | M–L | 需要 Pro 许可证 + fixtures；缺失的最大表单产品名 |
| 6 | fluent-smtp | B | 设置映射器（连接） | M | GSMTP 有设置；Fluent 连接界面偏画布式 → 可能为 **L** |
| 6 | fluent-smtp | B | Settings mapper (connections) | M | GSMTP has settings; Fluent connection UI is canvas-ish → likely **L** |

**Matrix fixes this sweep:** gravity-smtp bulk → **Y**; cf7-flamingo / cfdb7 / ninja-forms bulk → **Y** (code already had bulk; cells were stale).

**Deliberate non-goals:** GSMTP routing tree authoring; GF form builder / notifications events; backup restores; WP Mail SMTP Pro log without Pro; forminator "status card" (inbox plugins don't need GSMTP-style charts); ecommerce (shipped v0.14); re-proposing forminator/formidable tabs (already wired).

**Fixtures snapshot (minimaladmin):** mail residents FluentSMTP + WP Mail Logging + Gravity SMTP active, Post SMTP + WP Mail SMTP inactive; forms pack active (GF not listed in grep but usually is, Fluent Forms, Ninja, Forminator, Formidable, Everest, Flamingo, CFDB7, Elementor Pro); activity-log WSAL + LLA-R + **Solid active**; redirects Redirection active, SRM/S301/EPS inactive; backups Updraft/WPvivid/Duplicator/Disembark/BackWPup active.

涉及的适配器（或在适配器头部标记 `Reviewed`）。
touched adapters (or stamp `// last-sweep: YYYY-MM-DD` in the adapter header).
并将开发环境细节排除在其中。
and keep development-environment details out of them.
| 2026-08-12 | v0.28.0 release pre-flight | Fixture set already current: only perfmatters (2.6.6→2.6.7) and searchwp (4.6.0→4.6.1) had updates, both license-gated and unavailable, both patch bumps. No adapter-relevant deltas to skim, no smoke needed. Audit-of-the-audit over the release own three security fix classes found the form-entry ownership sweep complete (the six peer form plugins have no own/others split, so no lower-privileged role to leak to) and the network-shared table sweep complete (all five base_prefix adapters guarded; Solid Security denies where its table has no site column, AIOS scopes by site_id where it has one). One gap: the DISALLOW_FILE_EDIT pass covered WPCode and Custom CSS and JS but not Code Snippets, which shares the same Snippets surface and authors PHP. Fixed. |
| 2026-08-13 | v0.29.0 release pre-flight | Twelve fixture updates applied; perfmatters (2.6.6→2.6.7) and searchwp (4.6.0→4.6.1) failed as license-gated, both patch bumps, same as the previous sweep. Four minor bumps back adapters and were skimmed: Formidable 6.34 (XSS hardening on submitted HTML, Address fields promoted to Lite; entry storage and the FrmEntry model unchanged), Forminator 1.57.0 (custom Submission ID and prefix, both display-level; entry model unchanged), Ninja Forms 3.15.0 (AI form builder, signature and rendering fixes; nf_sub postmeta unchanged), Seriously Simple Podcasting 3.17.0 (feed generation, episode duration, and removal of per-pageload tag lookups; episode meta unchanged). No storage moves, no API or capability changes, nothing breaking. Smoke: ten surfaces across the Forms, Email, Activity Log and Snippets families answered 200 with data; suites formidable 12/12, forminator 12/12, ninja-forms 13/13, mail-log 37/37, llar-log 15/15. Backlog unchanged. |
| 2026-08-14 | v0.30.0 release pre-flight | Nine fixture updates applied; perfmatters (2.6.7), searchwp (4.6.1) and wpforms (2.0.0.4) failed as license-gated, all patch-level. One minor bump backs an adapter and was skimmed: Everest Forms 3.6.0 (revamped Style Customizer plus integration and coupon-field fixes; evf_entries/evf_entrymeta storage and the evf()/EVF_Admin_Entries model unchanged). Patch bumps behind adapters verified by dependency grep: Pods 3.3.9.1 (pods_api present), Scrutoscope 1.6.1 (Profiler namespaces present), SiteSEO 1.4.1 (_siteseo_titles_* keys present, resident inactive), SeedProd 6.20.8 (enable_coming_soon_mode key present, resident inactive), PowerPress 11.17.4 (powerpress_get_contenttype present, inactive). Smoke: everest, pods and scrutoscope surfaces answered 200 with data. No storage moves, no API or capability changes, nothing breaking. Backlog unchanged. |
