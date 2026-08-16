# shim 教程——一个接入 Minimal 的自定义表插件

大多数能从 Minimal 界面受益的插件都会将其数据保存在
自定义数据库表：表单条目、电子邮件日志、重定向、队列行。核心
REST 对这些表一无所知，因此集成分为两部分：

1. **REST 适配层** — 少量小型路由，将「我表中的行」转换为
   转换为 JSON，并且
2. **界面描述符** — 纯数据，告诉 Minimal 如何渲染它。

本演练将从头到尾为一个虚构插件构建两者。
完整代码是一个真实可用、可以复制的插件：
[`docs/examples/minimal-example-adapter/`](examples/minimal-example-adapter/minimal-example-adapter.php).
将其放入 `wp-content/plugins/`，在 Minimal Admin 旁启用它，然后一个
**Feedback** 视图出现在侧边栏中，包含状态卡片、标签页、搜索、一个
详情模态框和行操作。下面的每个部分都按编号排列，以匹配
该文件中的注释。（Minimal 自己的测试套件也会执行它，
`tests/example-adapter.test.js` 中，因此如果契约发生变化，
示例会在 CI 中先于在你手下出问题。）

虚构场景：**Campfire** 将访客反馈收集到
`{prefix}campfire_feedback`：id、name、email、message，以及一个 status
（`new` / `read` / `archived`），以及 UTC `created_at`。

## 步骤 0 — 代码所在位置

你自己的插件中一个无条件加载的文件：

```php
require_once __DIR__ . '/includes/minimal-admin.php';
```

其中的所有内容都是 `add_filter` / `register_rest_route` 调用：使用 Minimal
如果缺失，筛选器永远不会触发，路由就这样闲置着：免费无操作。
不需要 `class_exists( 'Minimal_Admin' )` 守卫。（示例插件
仅使用单文件，因为这是一个教程。）

## 步骤 1 — 数据（一个重要决策）

表本身就是你的插件已有的表。唯一值得考虑的选择是
刻意做出的选择：**将时间戳存储为 UTC**（`gmdate`，而不是
`current_time`）。Minimal 会在
访问者的时区，而且需要知道自己正在解析什么。没有时区的日期时间
默认认为是站点本地的；列上的 `utc: true` 标志（步骤 4）会声明
否则。经典 shim bug 是存储 UTC，却让它呈现为
站点本地：每个时间戳都会随站点偏移量变化，却没人注意到
直到日志条目看起来像是来自未来。

## 步骤 2 — 一个功能辅助函数

```php
function campfire_can() {
	return current_user_can( 'moderate_comments' );
}
```

Pick the capability for the **data**, not for the screen. These rows hold
visitor names, email addresses and message bodies, so the bar is the one you
would set for reading comments. `edit_posts` would have handed the whole
inbox to every Contributor. A surface is only ever as private as its
capability, and the default in an example is what gets copied.

Minimal 会在界面存在于应用中之前检查描述符的 `cap`
全部如此，但那是 UI 门控，只是便利功能。**你的路由自身
`permission_callback` 是边界。** 将答案集中在一个
函数，这样两者永远不会产生分歧，并将函数体替换为你的插件
真实的功能模型（细粒度权限、由选项驱动的角色检查、你的
自己的解析器）。如果你的插件有自己的访问设置（「只有这些
可能查看提交内容的角色」），在这里通过它们处理，就像捆绑的
WP Activity Log 适配器会通过该插件自己的
`Settings_Helper::current_user_can()`.

## 步骤 3 — REST shim

五个小型路由。Minimal 消费的形态：

| 路由 | 返回值 |
|---|---|
| `GET /feedback` | `{ "items": [...], "total": 123 }` — 列表 |
| `GET /feedback/{id}` | 一项内容 — 详情弹窗 |
| `POST /feedback/{id}/read` | `{ "message": "Marked as read" }` — 一个操作 |
| `POST /feedback/{id}/archive` | 相同结构 — 第二个操作 |
| `GET /feedback/status` | 状态卡片模型 |

确保 shim 安全的规则，示例文件中全部可见：

- **每个路由都声明 `permission_callback`。** 切勿 `__return_true`，因为
  私有数据。（Minimal 的 System 页面会标记跳过此步骤的插件。）
- **每个查询都经过 `$wpdb->prepare`。** 搜索输入框是一个
  用户输入、即将进入 SQL 的字符串：`esc_like` + 占位符，不要
  例外情况。
- **上限为 `per_page`。** Minimal 请求 25 个；手工构造的请求不应
  能够请求一百万条。
- **绝不 `unserialize()` 已存储的数据块。** Campfire 不需要这样做，但
  适用于真实日志表的规则：如果旧行保存了 PHP 序列化的
  值，请使用正则表达式或 `json_decode` 进行解析；精心构造的数据块绝不能
  到达 `unserialize()`。

列表路由会读取 Minimal 发送的三个输入：`page`（以及你的
`pageQuery` 模板名称，这里是 `per_page`）、当前选项卡的值（这里是
`status` 参数（在步骤 4 中声明），以及经过防抖处理的 `search` 术语。
它回答 `{ items, total }`；描述符的 `itemsKey` / `totalKey`
将 Minimal 指向两者。标准 WP 风格集合（普通数组 +
`X-WP-Total` 标头）会完全跳过这两个键。

在一个函数中构造每一行（示例中的 `campfire_item()`），这样
列表和详情路由永远不会彼此偏离。

操作路由通过插件自身的代码路径执行唯一一次写入，并且
可能返回 `{ "message": "…" }`；该字符串会替换 Minimal 的默认
「⟨label⟩ — 完成」提示，这是结果需要……时诚实的反馈渠道
比按钮标签承诺的字数更多。

状态路由返回**可直接显示的字符串**：Minimal 会渲染卡片，
由服务器完成格式化（计数、`human_time_diff`、货币、
等等）。可选的 `chart` 键会以相同的方式绘制每日柱状图序列
与 Minimal 概览图表一致的视觉语言。

## 步骤 4 — 描述符

单个筛选器上的纯数据。没有回调到达客户端（`setup` 个可调用对象
会在服务器端进行评估），不会发送 JavaScript，并且 Minimal 会转义每个
它所渲染的值；切勿预先转义。

```php
add_filter( 'minimal_admin_surfaces', 'campfire_surface' );
```

示例描述符中的选择说明：

- **`cap`** — 与 `campfire_can()`（第 2 步）保持一致。
- **`group: 'workspace'`** — Campfire 采用收件箱形态：新项目到达后
  需要人工处理。这就是 Workspace 放置的标准。日志、重定向
  以及管线应归入默认的 Tools 组；用户可以隐藏任何
  与之意见不一致的界面（也没有 API 可以抵抗它）。
- **`tabs`** — 静态形式：一个 `param` 加上 `[value, label]` 对。Minimal
  会为 New 选项卡将 `status=new` 附加到列表请求中，并省略
  All 的参数。（`{tab}`-in-route 形式适用于 Gravity 等 API
  表单的标签页是路径段。）
- **`search: 'search={q}'`** — 查询字符串模板。对象形式的
  `search` 仅适用于接收 JSON 条件字符串的 API；如果你的路由
  读取普通参数时，请使用该模板。
- **`columns`** — 注意状态上的 `format: 'pill'`，以及带有……的 `format: 'ago'`
  时间戳上的 **`utc: true`**（第 1 步的决策，已声明）。
- **`detail`** — `detailRoute` 获取完整项目；`messageKey` 负责渲染
  将一个字段作为大型消息块；`skip` 会隐藏记录用的键。
  其余键会呈现为行，并将 snake_case 显示为单词；请为你的
  面向用户的响应键，而不需要其他内容。（`labels` 用于
  其键为数字字段 ID，并指向一个负责解析的路由的 API
  它们；`sectionsRoute` 会直接向 Minimal 提供完全由服务器构建的视图。）
- **`actions`** — 「标记为已读」携带 `when: { key: 'status', equals: 'new' }`
  因此仅在项目确实是新的时候提供；「Archive」会携带
  `confirm` 和 `danger`。两者都通过步骤 3 中的 shim 路由运行，并且
  会出现在详情模态框和行的 ⋯ / 右键菜单中。

## 步骤 5 — 验证

1. 启用两个插件。**Feedback** 会出现在 Minimal 侧边栏的
   Workspace。
2. 打开 `/minimal-admin/system`，找到 **Integrations** 卡片：你的
   界面会被列出，标明归属于你的插件，且没有发现任何问题。
   此卡片是你的构建时调试器：描述符键拼写错误或
   缺失的路由会在这里自我说明，而不是静默失败。
3. 点击查看：标签页在服务器端缩小范围，搜索进一步缩小范围，详情模态框
   会显示消息；某项使用后，「标记为已读」会消失（
   `when` 门控），状态卡片中的计数也会移动。

如果界面完全没有出现：当前用户不满足你的 `cap`，或者
描述符未注册（你的文件是否无条件加载？）。如果
列表为空但界面已渲染：直接访问你的列表路由
（`/wp-json/campfire/v1/feedback`），已登录；一个 `permission_callback` 拼写错误
返回 401，Minimal 会显示空列表，而不是显示其他人的错误
页面。

完整的界面，全部在步骤 3 中声明：

![The finished Campfire Feedback surface: status card with chart, tabs, search, pill and time columns](img/surface-list.png)

## 接下来去哪里

[for-plugin-authors.md](for-plugin-authors.md) 中的其他所有内容都是
在这一确切形状之上进行增量扩展：批量操作、第二个集合
（`manage`）、额外列表视图（`views`）、架构驱动的设置、设置
门控、创建表单、内联详情编辑。捆绑的适配器位于
`includes/adapters/` 都是本教程在现实中的实例
针对 Gravity SMTP、Duplicator 和 Limit Login 等插件的模式
尝试。当参考资料中的某种形态看起来很抽象时，其中一个
具体版本。
