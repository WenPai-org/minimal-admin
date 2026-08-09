# 代码片段插件——源码审计

于 2026-07-09 针对一次性环境中运行的免费插件实时安装进行审计
运行 minimal-admin 的本地 WordPress 站点。目标：为 Minimal 的适配器候选项排序
界面（与审计日志适配器的模式相同）。

## 已审计的插件

| 插件 | Slug | 版本 | 审计期间状态 |
|---|---|---|---|
| Code Snippets | `code-snippets` | 3.9.6 | 激活 |
| WPCode | `insert-headers-and-footers` | 2.3.7 | 激活 |
| FluentSnippets | `easy-code-manager` | 10.55 | 激活 |
| Header Footer Code Manager | `header-footer-code-manager` | 1.1.45 | 激活 |
| Woody | `insert-php` | 2.7.5 | **安装正常；激活时出现致命错误**（在该 WP/CLI 堆栈中，`class.plugin.php:168` 的 null 上调用 `add_capabilities()`） |

已创建 fixture：Code Snippets #5/#6、WPCode 文章 82、Fluent `1-minimal-audit-fluent.php`、HFCM 行 1。

---

## Minimal 适配器排名

### 1. Code Snippets——**首选适配器**

| 关注点 | 发现 |
|---|---|
| 存储 | 自定义表 `{prefix}snippets`（多站点时还包括 `{base}ms_snippets`）。列：`id, name, description, code, tags, scope, condition_id, priority, active, modified, revision, cloud_id`。 |
| Cap | 可过滤的 `code_snippets_cap`（默认 **`manage_options`**）；网络权限 `manage_network_options`。 |
| REST | **一等支持。**命名空间 `code-snippets/v1`。 |
| 路由 | `GET/POST /snippets`、`GET/PUT/DELETE /snippets/{id}`、`POST …/activate`、`POST …/deactivate`、`GET …/export`、`GET …/export-code`、schema，以及导入器。 |
| 分页 | `page` / `per_page` + `X-WP-Total` / `X-WP-TotalPages`。 |
| 列表结构 | `{ id, name, desc, code, tags[], scope, condition_id, active, priority, network, shared_network, modified, code_error }` |
| 切换 | `PUT /snippets/{id}` 搭配 `{ "active": true\|false }` 可正常工作（200）。存在专用激活/停用路由；为获得可预测的 JSON，优先使用 PUT。 |
| 作用域 | 至少包括 `global`、`front-end`、`content`（示例数据）。 |
| 管理深层链接 | `snippets` 下的 Snippets 管理菜单（管理 + 编辑界面）。 |
| 安全模式 | 已记录用于白屏恢复的查询变量安全模式。 |

**Minimal 界面结构：**纯 REST，cookie + nonce。列表列：名称、作用域、激活切换、标签、修改时间。详情：代码（第一版只读）+ 元数据 +「在 Code Snippets 中编辑 ↗」。操作：激活/停用/移至回收站。v1 无需 shim。

另一个有趣之处：它已经拥有针对 WPCode、HFCM 和 Insert PHP Code Snippet 的**导入器**——迁移用户可以进入 Code Snippets，而 Minimal 只需一个界面。

---

### 2. WPCode——**扩大覆盖面必需（300 万+），需要 shim**

| 关注点 | 发现 |
|---|---|
| 存储 | CPT **`wpcode`**（`public=false`、`show_ui=false`、**`show_in_rest=false`**）。代码位于 `post_content`。激活状态 = `post_status` **publish** 与 **draft** 的区别。 |
| 分类法 | `wpcode_type`（php/js/css/html/text……）、`wpcode_location`（everywhere、header、after_paragraph……）、`wpcode_tags`。 |
| 元数据（前缀 `_wpcode_`） | `_wpcode_auto_insert`、`_wpcode_auto_insert_number`、`_wpcode_conditional_logic(_enabled)`、`_wpcode_priority`、`_wpcode_note`、`_wpcode_device_type`、`_wpcode_custom_shortcode`、`_wpcode_last_error`、库/云端字段等。 |
| Cap | 自定义：`wpcode_edit_snippets`、`wpcode_activate_snippets`，以及通过 `map_meta_cap` 映射的类型作用域权限（`wpcode_edit_php_snippets`、……）。管理员拥有这些权限。 |
| REST | 代码片段**无** REST。没有 `wp/v2/wpcode`。Abilities API 钩子存在（WP 6.9+），但并非完整 CRUD 界面。 |
| 写入路径 | `WPCode_Snippet` 类：`save()`、`activate()`、`deactivate()`。管理端切换为 AJAX `wp_ajax_wpcode_update_snippet_status`。 |
| 管理深层链接 | `admin.php?page=wpcode-snippet-manager&snippet_id={id}` · 列表 `admin.php?page=wpcode`。 |

**Minimal 界面结构：**捆绑 shim `minimal-admin/v1/wpcode/snippets`（列表 + 状态切换），调用 `WPCode_Snippet` / `get_posts`，并受 `wpcode_edit_snippets` / `wpcode_activate_snippets` 控制。与 Stream/Aryo 审计 shim 的模式相同。不要在 Minimal 中启用其 CPT 上的 `show_in_rest`。

---

### 3. FluentSnippets——**强力第三名（REST + 免费/OSS）**

| 关注点 | 发现 |
|---|---|
| 存储 | `WP_CONTENT_DIR/fluent-snippet-storage/` 下的**平面文件**（覆盖项：`FLUENT_SNIPPETS_STORAGE_DIR`）。索引缓存 `index.php`。文件名类似 `1-minimal-audit-fluent.php`。 |
| Cap | REST 权限 = **`install_plugins`**（限制严格；门控时请注意）。 |
| REST | 命名空间 **`fluent-snippets`**（无版本号）。 |
| 路由 | `GET snippets`、`POST snippets/create`、`POST snippets/update`、`POST snippets/update_status`、`POST snippets/delete_snippet`、`GET snippets/find`、设置路由。 |
| 列表结构 | `{ snippets: { data: [...], page, per_page, total, last_page }, tags, groups, time }`。条目：名称、描述、类型、状态（`draft`/`published`）、标签、run_at、优先级、file_name、condition…… |
| 切换 | `POST …/update_status`，带有 `fluent_saving_snippet_name` + `status`（`published` / `draft`）。已验证返回 200。 |
| 类型 | PHP、Content（PHP+HTML）、CSS、JS。 |

**注意事项：**创建载荷要求严格（嵌套的 `condition` 对象形状错误时，可能在其清理器中触发 TypeError）。没有经典整数 ID——key 是 `file_name`。Cap `install_plugins` 对只读列表界面而言范围过宽；如果 Minimal 更倾向于此，shim 可以重新检查 `manage_options`。

---

### 4. HFCM——**更窄的产品（脚本，而非 PHP 函数）**

| 关注点 | 发现 |
|---|---|
| 存储 | 表 `{prefix}hfcm_scripts`——`script_id, name, snippet, snippet_type (html/js/css), device_type, location, display_on, status (active/inactive), …`。**无 PHP 类型。** |
| Cap | 菜单和变更操作上的 `manage_options`。 |
| REST | **无。**管理界面 + `wp_ajax_hfcm-request`。 |
| 用例 | 注入页眉/页脚/内容中的跟踪代码/CSS/JS——不是 `functions.php` 替代品。 |

只有当 Minimal 希望支持「所有脚本管理器」，而不仅是「代码片段」时，才值得使用 shim。其功能与 WPCode 的页眉/页脚传统重叠。

---

### 5. Woody——**暂时降低优先级**

- 代码片段是一个**CPT**（`WINP_SNIPPETS_POST_TYPE`），带有丰富的文章元数据（`wbcr_inp_*`）。
- REST 命名空间 `woody/v1` 仅公开**许可证 + 设置**，不提供代码片段 CRUD。
- 实验环境中的免费激活致命错误（`add_capabilities()` 为 null）——在上游修复前视为不稳定。
- Themeisle 收购；产品仍在变化中。

---

## 共享 Minimal 界面草图（审计日志风格）

当任一受支持插件处于激活状态时显示一个导航项 **「Snippets」**（多个插件时取第一个匹配项，或显示标签页——与 Redirects / Activity Log 的约定相同：一次只使用一个激活插件进行 dogfood）。

| 列 | Code Snippets | WPCode | Fluent |
|---|---|---|---|
| 标题 | `name` | `post_title` | `name` |
| 类型/作用域 | `scope` | `wpcode_type` + location | `type` + `run_at` |
| 状态 | `active` 布尔值 | 发布/草稿 | 已发布/草稿 |
| 标签 | `tags[]` | taxonomy | string |
| 修改时间 | `modified` | `post_modified` | `updated_at` |
| 切换 | PUT active | shim → 激活/停用 | update_status |
| 深层链接 | CS 编辑界面 | `wpcode-snippet-manager&snippet_id=` | Fluent 管理 SPA |

**v1 范围建议：**列表 + 切换 + 深层链接编辑。Minimal 内置代码编辑器属于后续阶段（安全性 + 验证 + 致命错误恢复）。由于 PHP 执行风险，Minimal 绝不应自行执行代码片段——只能由宿主插件执行。

---

## 已交付的适配器（相同的「Snippets」导航标签，插件徽章为 `sub`）

与 Redirects / Activity Log 的约定相同：每个插件注册自己的界面
ID；多个插件同时激活时，侧边栏会显示多个 Snippets 条目，并
不同徽章（Code Snippets / WPCode / FluentSnippets）。一次只进行一个 dogfood
如果希望在生产站点上使用单一导航项。

1. ~~**Code Snippets**~~——**已交付**（`adapters/code-snippets.php`，纯
   `code-snippets/v1`）。Suite：`tests/code-snippets.test.js`。
2. ~~**WPCode**~~——**已交付**（`adapters/wpcode.php`，shim
   `minimal-admin/v1/wpcode/snippets` 覆盖 `WPCode_Snippet`）。列表/创建/编辑/切换/删除。
3. ~~**FluentSnippets**~~——**已交付**（`adapters/fluent-snippets.php`，shim
   `minimal-admin/v1/fluent-snippets` 规范化 file_name → `id` 以及草稿/已发布 →
   `active`）。Suite：`tests/snippets-adapters.test.js` 覆盖两个 shim。
4. **HFCM / Woody**——尚未接入。HFCM 仅处理脚本（html/js/css）；Woody 激活
   当前实验环境中的致命错误。

共享 UX：名称、作用域列、激活状态、优先级、修改时间；宽版详情表单
（name/desc/code/scope 或 type·location/priority/tags）；激活/停用；删除；
编辑 ↗，进入插件自己的管理界面。

## 实验环境清理

审计后 Woody 保持未激活状态（激活时出现致命错误）。拆除
代码片段工作完成后，拆除一次性实验环境。
