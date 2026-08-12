# 核心覆盖审计 — 与经典 wp-admin 的差距

于 2026-07-10 针对 v0.10.0 审计；2026-07-12 在
v0.13.0 周期（WP 7.0.1）；2026-07-13 在 v0.14.0 重新检查，仍开放；轻量
2026-07-15 在 v0.16.0 重新检查，仍开放；2026-07-23 在 v0.21.0 重新检查，仍开放
（评论编辑和评论者屏蔽、站点徽标及站点语言全部
已在 v0.20.0 周期发布；下方章节已更新）；重新检查
2026-07-24，v0.22.0 开放（只读数据库查看器作为
原生开发者界面，归入下方 Tools；不新增日常工作
缺口）：每个
已发布的排序优先级保持不变，核心区域没有新增日常工作缺口。
于 2026-07-30 在 v0.23.0 开放状态下重新审计，重点关注主题集成（见
下方的新章节）：剩余的 wp-admin 领域由主题决定
（区块主题 Site Editor 工件、构建器主题模板）以及另外四个
较小的运营缺口（每个扩展的自动更新开关、主题实时
预览、批量编辑分类/作者、同步模式可见性）。开发工具 Wave A 已完成
（Diagnostics 系列）；进一步的清单工作属于适配器深度或暂缓项目
原生界面（`plugin-support.md`、`native-editors.md`）。重新检查
2026-08-06，v0.24.0 开放（未发布）：四个较小缺口中的三个
已在 v0.23.0 周期发布（自动更新开关、主题实时预览、
同步模式；下方已标记），以及 Media 部分的文件夹结论
已过时：优先浏览的提供商契约（Wave D）早已
已在 v0.18.0 周期发布，已在下文修正。v0.24.0 周期目前
属于适配器深度（WPForms 条目、表单状态卡片、FluentSMTP），并且
不会改变任何核心缺口状态。仍未完成：区块主题界面、构建器
主题模板、批量编辑分类/作者。Minimal 的
定位等级如下：日常工作归入 Minimal，长尾需求则保留
在 wp-admin 中只需单击一次即可访问。下面每个区域都会获得状态以及对其
该缺口是否会阻碍日常工作。
positioning grades these: daily work belongs in Minimal, the long tail stays
优先级排名（重要缺口）
whether the gap blocks daily work.

## Priority ranking (the gaps that matter)

1. 创建/编辑（名称、别名、父级、描述），删除时提供诚实的
   (Manage → Terms, `/minimal-admin/terms`) covers every REST-enabled taxonomy
   （文章通过核心自身的重新分配机制移至保留的术语）
   机制，然后删除源文件）。编辑者通过
   confirms, count links into the filtered content list, and **merge**
   REST 路由。
   **媒体标题和描述** — ✅ 已发布（v0.11.0 周期）：媒体
   `manage_categories`; per-taxonomy capabilities are enforced by core's
   携带编辑上下文的原始值（延迟获取，以保持列表
2. 浅色）并通过 wp/v2/media 保存。
   **媒体批量选择/删除** — ✅ 已发布（v0.11.0 周期）：网格磁贴和
   列表行带有复选框（按住 Shift 选择范围、全选），并带有删除操作栏
   与内容列表模式一致；force=true，逐项处理。
3. **评论批量审核** — ✅ 已发布（v0.11.0 周期）：评论行获得
   复选框 + Select-page，以及一个操作栏，其动词取决于当前选项卡自身
   操作（Pending 中的 Approve/Spam/Trash，Trash 中的 Restore/Delete，以及
4. 上），按项目应用。
   **批量更改用户角色** — ✅ 已发布（v0.11.0 周期）：用户表
   增加复选框列（以 edit-users 为门控）和一个可更改所有用户的操作栏
   一次性更改所选用户的角色；当前用户会被跳过（避免自我锁定
5. 守卫）。
   **单篇文章格式选择器** — ✅ 已发布（v0.11.0 周期）：编辑器侧边栏
   具有 Format 选择器，前提是活动主题声明了 post-format
   guard).
6. 字段。启动载荷携带受支持的格式。
   has a Format select, gated on the active theme declaring post-format
   support (matching wp-admin), saving through wp/v2's native `format`
   field. Boot payload carries the supported formats.

## 已覆盖：站点身份位于 Settings → General（标题、副标题、站点图标

### Settings → Reading（最新文章与静态页面，可选择页面）；截至
Covered: site identity lives in Settings → General (title, tagline, site icon
通过 Settings → Design 中的「Additional CSS」编辑
Settings → Reading (latest posts vs static page, with page pickers); and as of
the v0.11.0 cycle, **Custom CSS** (`wp_custom_css_post`, the Customizer's
语言已在 v0.20.0 周期发布（Settings → Site：徽标受控于
通过 `minimal-admin/v1/custom-css` 支持主题自定义徽标，语言
validation mirroring the Customizer's refusal). Custom logo and site
主题 mod、FSE 全局样式。结论：身份信息 + 主页 + Custom CSS +
theme custom-logo support via `minimal-admin/v1/site-logo`, the language over
`minimal-admin/v1/site/language`, downloading packs on save). Missing: other
theme mods, FSE global styles. Judgment: identity + homepage + Custom CSS +
Appearance — 在关键位置已覆盖
Menus（支持拖动排序）和经典小工具已完整构建；主题

### 背景图和页眉图：按设计不在范围内。
Menus (with drag reorder) and classic widgets are fully built; themes
主题集成 — 已审计前沿（2026-07-30）
对于 CLASSIC 主题，日常所需已覆盖：Menus、Widgets、徽标、图标、

### 已在 v0.23.0 通过实证验证：
On a CLASSIC theme, the daily slice is covered: Menus, Widgets, logo, icon,
**没有替代方案时，区块主题会失去优势（L，需要设计）。**
verified empirically at v0.23.0:

1. **Block themes lose ground with no replacement (L, needs design).**
   Minimal correctly hides Menus and Widgets when `wp_is_block_theme()`
   (`B.site.blockTheme`), but nothing steps in: no navigation editing
   (`wp_navigation` posts have REST parity with what the Menus manager
   在此项目中排序：导航优先（真实的日常工作、现有
   Menus UX 转移），然后是只读 Design 卡片（活动主题及其
   模板/部件显示为「在站点编辑器中编辑 ↗」行，以及当前调色板）。
   Site Editor 画布本身是永久外部链接（理由与
   表单构建器）。
   templates/parts as "Edit in Site Editor ↗" rows, current palette). The
   Site Editor canvas itself is a permanent link-out (same reasoning as
   会跳过它，这意味着页眉/页脚位于 Elementor Theme 中的站点
2. **Builder theme templates are invisible (M).** `elementor_library` IS
   REST-exposed but not `viewable`, so the content switcher (rightly)
   核心观点：列出并标注类型（页眉/页脚/弹窗/存档），显示
   显示条件为只读，并深层链接到构建器画布。
   ~~**每个扩展的自动更新开关（S）。**~~ **已于 2026-08-04 发布**
   （v0.23.0 周期）：插件卡片和主题卡片均通过
   display conditions read-only, deep-link into the builder canvas.
3. ~~**Per-extension auto-update toggles (S).**~~ **SHIPPED 2026-08-04**
   (v0.23.0 cycle): Auto pills on plugin AND theme cards through
   `minimal-admin/v1/auto-updates` (the same option writes as
   `wp_ajax_toggle_auto_updates`, stale entries pruned; gated on
   `wp_is_auto_update_enabled_for_type` server- and client-side). Suite
   `tests/auto-updates.test.js`.
4. ~~**Theme live preview (S).**~~ **SHIPPED 2026-08-04** (v0.23.0
   **超出状态的批量编辑（M）。** 内容批量操作栏支持状态/
   classic themes, `site-editor.php?wp_theme_preview=` for block themes
   (the `block` flag now rides `minimal-admin/v1/themes`).
5. ~~**同步模式（S-M）。**~~ **已于 2026-08-04 发布**（v0.23.0 周期）：
   trash / restore / delete but not wp-admin bulk-edit's "add these
   Content 切换器中的 Patterns 入口，使用标准行机制
6. （前端查看/预览被抑制，不可公开查询）；斜杠
   菜单 + ⌘/ 选择器「Your patterns」（已同步 → `slimContentTypes`
   参考岛、静默插入；未同步 → 通过
   (front-end view/preview suppressed, not publicly queryable); slash
   menu + ⌘/ picker "Your patterns" (synced → `wp:block {"ref":N}`
   reference island, quiet insert; unsynced → detached copy via
   `insertPatternIslands`); editor opens `/editor/blocks/{id}` natively
   with a synced-edit note and self-slimmed sidebar; + New → Pattern.
   GOTCHA: `wp_pattern_sync_status` is top-level READ-only in REST;
   writes ride `meta.wp_pattern_sync_status`. Suite
   `tests/user-patterns.test.js`.
7. 诚实的答案，与之前结论相同。
   theme mods (colors, header/background images, per-theme sections) are
   Taxonomies — 已覆盖
   Terms 管理器已于 2026-07-10 发布（见优先级 #1）。唯一的服务器

### 从 v0.11.0 周期开始，Terms 已并入 **Structure** 页面（Post
Types / Taxonomies / Terms 选项卡，而不是独立导航项，以保持
addition was `minimal-admin/v1/terms/merge`; everything else rides core REST.
As of the v0.11.0 cycle, Terms is folded into the **Structure** page (Post
编辑器的 Structure 项目只显示 Terms 选项卡（标记为「Terms」，用于
the MANAGE group short. The tabs gate individually: Post Types and
Taxonomies need `manage_options`, Terms needs only `manage_categories`, so
an editor's Structure item shows just the Terms tab (labeled "Terms" for
them), while an admin sees all three. The `/minimal-admin/terms` route and the
System 页面完善覆盖诊断功能（健康检查、数据库表、自动加载

### 扩展清单、复制为 Markdown 的报告）。Loopback 和 REST 自检
健康状态行已于 2026-07-10 发布（核心自身的 Site Health 测试，缓存 15
分钟），Tools 卡片深层链接到一次性任务（Site Health、
导出/导入、GDPR 导出/擦除）：偶发性操作仍保留在 wp-admin 中，一个
点击离开，按设计如此。截至 v0.22.0 周期，Database 卡片也成为
入口：其最大表格的行以及「browse all」链接会打开只读
export/import, GDPR export/erase): episodic surgery stays in wp-admin, one
项目）。写入操作和 SQL 控制台在此处始终不在目标范围内
doorway: its largest-table rows and a "browse all" link open the read-only
database viewer (`/minimal-admin/database`, also in ⌘K; deliberately not a nav
Settings — 日常选项已覆盖，两个屏幕较薄弱
(`native-editors.md`).

### admin）、Writing（默认分类/格式、表情符号）、Reading（首页、
每页文章数、搜索可见性）、Discussion（默认评论/引用状态、
审核、必须注册、头像开关），Permalinks（结构 +
基础）、Spam（提供商卡片 + 禁止的键）、Connectors（WP 7.0 的
连接器注册表：提供商键由核心端进行遮蔽和验证，
对于 wp-config/env 键保持来源诚实，配套插件安装位于
位置），此外自 v0.20.0 起，Site 标签页还包含站点徽标和站点语言
周期。缺少：整个 Media
设置屏幕（缩略图尺寸、月份/年份文件夹），
place), plus site logo and site language on the Site tab since the v0.20.0
深度、每页数量、之前批准的快捷方式、关闭后天数、通知
电子邮件、头像评级/默认值）。判断：缺少的是一次性配置；
`posts_per_rss` / feed excerpt, and most of the Discussion matrix (threading
depth, per-page, previously-approved shortcut, close-after-days, notification
Users — 达到或优于对等水平
列表、搜索、角色、添加/编辑、删除并重新分配内容、密码

### 应用程序密码（「AI Access」，附带生成的代理指南）。
所有长期尾部个人资料字段已于 v0.17.0 在 /minimal-admin/profile 发布
页面（名、姓、个人简介、网站、每个用户的语言，并自动
包安装、前端工具栏偏好）。应用程序密码
比经典界面更清晰地呈现，并支持删除时重新分配。
page (first/last name, bio, website, per-user language with automatic
Media — 网格功能完善，编辑功能已跟上
支持类型筛选/搜索/分页的网格、多文件上传、拖放、图像

### 标题/描述编辑和批量删除（均已在 v0.11.0 发布）。
未附加筛选器（核心 parent=0）、月份筛选器（minimal-admin/v1/media/months
组合框 → 前后时间窗口）以及详情模态框中的「Attached to」行
带编辑器跳转的功能已于 2026-07-17 全部发布（v0.18.0 周期，套件
media-polish）。文件夹：不是
核心功能（Minimal 自有的树会成为不可见的第五种文件夹标准
到 wp-admin 和构建器选择器），但此前「长尾、跳过」的结论
已于 2026-07-16 修订：FileBird + Real Media Library + Folders 总计超过 400k
安装后，优先浏览的提供商契约成为 Wave D 的一部分
to wp-admin and builder pickers), but the earlier "long-tail, skip" verdict
was revised 2026-07-16: FileBird + Real Media Library + Folders total 400k+
installs, so a browse-first provider contract became Wave D in
`docs/plugin-support.md`. Wave D shipped 2026-07-17 (v0.18.0 cycle): the
`minimal_admin_media_folders` provider filter
(`includes/adapters/media-folders.php`) with bundled FileBird, Real Media
Library and Folders by Premio providers; a folder picker on the Media view
filters the normal wp/v2/media query (search, type tabs, Unattached and
自己的文件夹树。
action rides each provider's optional `move` callable. Suite
`tests/media-folders.test.js`. Moving stays browse-first: Minimal never owns
待审核/已批准/垃圾邮件/回收站选项卡，完整的逐行审核，批量

### （像核心一样自动批准）、上下文菜单。最后两个缺口已在
v0.20.0 周期：内联评论编辑（文本始终支持；作者姓名/邮箱支持
访客评论）和 Block commenter（将作者的电子邮件或 IP 添加到
核心的禁止列表，在 Settings → Comments 下可见，并支持 Undo）。
v0.20.0 cycle: inline comment editing (text always; author name/email for
Multisite — 非目标，但会合理降级
core's disallowed list, visible under Settings → Comments, with Undo).

### 子站点。
Minimal boots on main sites and subsites, heals routes after network activation,
结构性观察 — 仅 REST 是硬边界
任何未暴露给 REST 的内容，根据设计对 Minimal 不可见：CPT 和
changes, add-existing-account and remove-membership actions; network
自定义状态。这是有意为之，值得保留；这条界线

Network administrators get first-class Sites, Network users and Network
settings surfaces. The daily slice covers site creation and lifecycle,
network-administrator promotion and revocation, registration, uploads, site
administrator permissions and network mail. Extensions adds network-wide
plugin activation and theme availability, and a core update runs the required
database migration across each subsite.

The boundary is deliberate: network account creation/deletion, welcome
emails, first-post text, reserved names, language defaults, restores, exports
and network setup stay in WordPress Network Admin. Very large networks use
WordPress's Upgrade Network screen rather than a request-bound site walk.
Network-shared logs, database tables and plugin data are either scoped by site
or restricted to super administrators; a per-site `manage_options` check is
never treated as permission to read the whole network.

### Structural observation — REST-only is a hard boundary
Anything not exposed to REST is invisible to Minimal by construction: CPTs and
taxonomies without `show_in_rest` (the UI flags them), meta not registered,
custom statuses. This is deliberate and worth keeping; it's the line that
keeps list views fast and safe.
