# 将你的插件添加到 Minimal Admin

Minimal Admin 通过**界面**渲染第三方插件数据：声明式描述符
从 PHP 注册。一个筛选器，无 JavaScript，无构建步骤。大多数插件管理页面都
三种形态之一（列表、单个项目的详情视图、几个统计数字），Minimal 会绘制
全部三个都使用相同的列表 / 选项卡 / 详情模态框 / 操作原语，为其提供支持
内置视图。

## 快速开始

```php
add_filter( 'minimal_admin_surfaces', function ( $surfaces ) {
    $surfaces['my-plugin'] = array(
        'label'      => 'Submissions',          // sidebar + page title
        'sub'        => 'My Plugin',            // small badge next to the title
        'icon'       => 'inbox',                // one of Minimal's icon names
        'cap'        => 'manage_options',       // checked server-side before the surface is exposed
        'collection' => array(
            'route'     => 'my-plugin/v1/submissions',   // any REST route, called with cookie + nonce
            'pageQuery' => 'per_page=25&page={page}',    // {page} is filled in by Minimal
            'itemsKey'  => 'items',   // key of the item array in the response (omit if the response IS the array)
            'totalKey'  => 'total',   // key of the total count (omit to use the X-WP-Total header)
            'columns'   => array(
                array( 'key' => 'title',  'label' => 'Title',  'format' => 'title' ),
                array( 'key' => 'email',  'label' => 'Email' ),
                array( 'key' => 'status', 'label' => 'Status', 'format' => 'pill' ),
                array( 'key' => 'date',   'label' => 'Date',   'format' => 'ago' ),
            ),
        ),
    );
    return $surfaces;
} );
```

这是 Minimal 侧边栏中一个可正常运行、支持分页且经过能力限制的视图。

**你的数据位于没有 REST 路由的自定义表中？** 这是最常见的情况，而且它
有自己的端到端演练：[the shim tutorial](shim-tutorial.md)，它会构建
一个小型 REST 适配层以及这个虚构插件的描述符。完成后的代码以
可直接复制的真实可用插件（[`docs/examples/minimal-example-adapter/`](examples/minimal-example-adapter/minimal-example-adapter.php)），
并且 Minimal 自己的测试套件会端到端驱动它，因此示例永远不会偏离
契约。这就是该教程完成后的界面，完全由以下内容构建
本页记录的声明式键：

![The shim tutorial's finished Campfire surface: a status card with chart, tabs, search, pill and time columns](img/surface-list.png)

**正在构建表单插件？** 完成本教程后，
[first-class Forms provider recipe](#make-your-forms-plugin-a-first-class-forms-provider)
涵盖表单专用机制：每个表单的选项卡、`entry-summary` 列、
联系卡片条目详情、Entries/Forms 切换器以及 `forms` 系列。

## 测试你的集成

- **Integrations 卡片是你的构建时调试器。** 打开 Minimal 的系统页面
  （`/minimal-admin/system`），然后找到 **Integrations**：其中列出了每个已注册的界面，
  编辑器面板、设计源、缓存清理器、页面构建器和钩子监听器，属性
  分别交给注册它的插件，并标记契约问题（未知键、
  缺失的路由、没有键的列）。应用无法静默渲染的描述符
  在那里自我说明，卡片的复制报告还会包含用于提交错误报告的部分。
- **在一次性 WordPress 环境中试用。** Minimal 的 readme 提供一键
  [WordPress Playground](https://playground.wordpress.net/)徽章，用于启动演示站点
  安装了 Minimal：在那里上传你的插件 zip 包，即可测试你的界面，无需
  接触真实网站。启动过程还会预先激活 shim 教程中的示例插件
  （**Feedback** 界面，已填充演示行），因此该 API 的可运行实例
  在你写入任何内容前只需点击一次。
- **以非管理员身份测试。** 你的描述符中的 `cap` 会对没有相应权限的用户隐藏该界面
  它，但你路由的 `permission_callback` 才是真正的边界：以编辑者身份登录
  或者作者，并确认两层保持一致。

## 将适配器集成到你自己的插件中

将你的 `add_filter()` / `add_action()` 调用放在**你的**插件中的一个文件内，并
无条件要求它：

```
my-plugin/
└── includes/minimal-admin.php   ← all your minimal_admin_* filters live here
```

无需 `class_exists( 'Minimal_Admin' )` 保护：Minimal 未安装时，这些过滤器会
实际上从未应用，因此集成是免费的空操作。安装了两个插件的用户会获得
自动完成集成：无需配置，也无需发布配套插件。

Minimal 仅在 `includes/adapters/` 中为不了解 Minimal 的热门插件内置适配器
Minimal：Gravity Forms、ACF、Redirection 以及分析提供商。如果你是
正在集成的插件，改为随插件一起提供适配器；[Anchor Blocks](https://github.com/anchorhost/anchor-blocks)
正是在 `app/MinimalAdmin.php` 中执行此操作。

描述符中的标签和描述字符串由你负责：请在你自己的代码中通过 `__()` 处理它们
文本域（如果你的插件已翻译）。Minimal 会原样渲染它们（已转义，绝不解析）。

## 使用 AI 代理构建

描述符契约特别适合代理式编码：它是声明式的，经过验证
实时的，并且可以在浏览器中验证。如果你正在使用 AI 编码工具接入插件，
向它提供三样东西（本文档、[the shim tutorial](shim-tutorial.md)，以及
[example plugin](examples/minimal-example-adapter/minimal-example-adapter.php)），并让它
完成后通过 Integrations 卡片（`/minimal-admin/system`）进行验证。该
示例插件还可作为已知良好的参考，代理可以将其工作成果与之进行差异比较。

## 兼容性

下面的 [hook reference](#hook-reference) 中的钩子，以及描述符键
本页记录的内容，正是 Minimal 的集成契约。其意图是使它发生变化
很少使用，并且以增量方式：

- 任何版本都可能新增钩子和描述符键；有文档记录的键会保持其
  含义。
- 如果记录在文档中的钩子或键必须更改，旧形式仍会在一段时间内继续工作
  弃用窗口，并在变更日志中明确说明该变更。
- 你在 Minimal 内置适配器中找到、但本页未列出的键均为内部键，可能会
  恕不另行通知地更改。如果你需要一个，请提交 issue，以便记录并
  已在此处稳定下来。
- 声明已安装的 Minimal 尚不了解的键是安全的：渲染器会忽略
  未知键（该功能在该安装中 simply 不存在），以及集成卡片
  可能会将它们标记为未知。无需进行版本检测：降级就是设计的一部分。

## 集成规范

WordPress 管理界面在争夺注意力的战斗中败下阵来：通知变成了横幅，菜单变成了
广告牌，而且每个插件都学会了大声喧哗，因为喧哗确实有效。Minimal 的答案是
架构，而不是要求你遵守的策略文档。值得了解
完整的强制执行说明集中在一处，因为它改变了良好集成的样子
例如：

- **验证器会阻止或降级位置抓取。** 没有相应权限的工作区放置
  类似收件箱的集合会进入 Tools。导航槽位超过 3 个时会合并为一个。更多
  每个命名空间超过 3 个默认斜杠菜单项后会变为仅可搜索。每次干预都
  显示在 Integrations 卡片上，并归属于你的插件。
- **由 Minimal 负责渲染。** 描述符是数据；你的 HTML、CSS 和 JS 永远不会到达
  文档。没有要注入的横幅、要重新设置样式的按钮，也没有要置顶的通知。
  站外链接始终以 ↗ 渲染，并列在 Integrations 卡片中，因此
  追加销售绝不能看起来像应用操作。
- **用户拥有最终决定权。** 每个界面、面板、设计库和斜杠菜单
  命名空间可以按用户隐藏，隐藏状态会在重新注册后保留，并且
  没有 API 可以检测或抵御它。

结果是：标签用于命名，而不是营销。一个界面如果以其实际
一个报告状态的状态卡片，以及一个精心选择的默认插入项，就会
保留；促销标签、催促式界面和注意力泛滥会被降级，
已折叠，或被你试图联系的人隐藏。这里的注意力需要赢得，
并且每个人的预算都相同。

## 用户可以隐藏你的集成

自 v0.17.0 起，每个集成点都可以由用户在 Minimal 自带的界面中隐藏，并且
恢复功能位于「你的个人资料」中：

- **界面**：右键点击侧边栏行 → **对你隐藏**。
- **编辑器面板**：在编辑器侧边栏中右键点击面板入口。
- **设计库**：在区块选择器中右键点击库的组标题。
- **斜杠命名空间**：在区块选择器中右键点击命名空间的组标题。
  这会在所有会馈入编辑器菜单的位置隐藏命名空间：可自动插入的
  区块、`insert` 模板、区块样式以及命名空间编辑器命令都会
  一起保留。检查器表单仍然存在，因此现有区块仍可编辑。

隐藏是按用户设置的：重新加载页面以及你的插件重新注册后，该设置仍会保留，
并且没有 API 可以检测或抵抗它。请据此设计。一个集成如果
有价值的内容会被保留；任何抢夺注意力的内容都会被隐藏，而
描述符模型没有提供要求它返回的方法。

## 注意力预算

自 v0.17.0 起，位置和数量限制由验证器强制执行，并且
客户端，而不是依靠约定。任何内容都不会被丢弃；溢出会降级为更安静的
表单：

- **工作区放置**需要一个收件箱形状的集合（至少一个 `ago`
  列）。声称具有 `group: 'workspace'` 但没有对应项的界面会显示在 Tools 下，
  并且 Integrations 卡片会标记它。
- **导航槽位**：一个插件最多持有 **3** 个。超过此数量后，你的无族系界面
  折叠为一个导航项（以及一个 ⌘K 调色板行），并使用相同的切换器
  用户已经从提供商系列中了解的内容。声明真实 `family` 的界面
  保留它；一个系列已经是一个折叠槽位。
- **默认斜杠菜单**：未筛选的菜单中，一个命名空间最多容纳 **3** 个条目
  `/`菜单，按注册顺序计数（先是编辑器命令，然后是区块 `insert`
  模板）。溢出内容仅可通过搜索访问：当用户
  类型，完全类似于可自动插入的区块；区块选择器（浏览全部）始终
  显示全部内容。

如果你的集成所需空间超过预算，这就是应当
整合：一个包含 `views` 的界面，一个打开你自己界面的命令，一个
精心选择的默认插入项。无论采用哪种方式，预算都是按插件计算的；注册更多
并不会换来更多关注。

## 外部链接始终会标记

自 v0.17.0 起，描述符提供的每个链接（操作 `href`、状态卡片操作、
`setup.href`）会在新选项卡中打开，任何主机与站点自身不同的链接
使用 ↗ 标识渲染。Minimal 会在渲染时添加该标记；你无法选择退出，
并且已经以 ↗ 结尾的标签会保持不变。同站链接（wp-admin 深层链接、
你自己的 REST 端点）保持不标记：它们是诚实的应用跳转，而不是退出。

描述符本身携带的站外 href 也会按界面列在
系统页面的集成卡片，归属于你的插件。该列表
这是信息提示，而不是契约问题：链接到你自己的文档或供应商界面
这是一个合理的模式。它的存在确保站外链接永远不会隐藏在界面
未被注意到。你的路由在运行时返回的链接（状态卡片响应）无法被标记
那里，但渲染时会获得相同的 ↗ 处理。

明确来说：标签用于命名，而不是营销。一个离开
网站始终看起来像一个整体。

## 描述符参考

真正起关键作用的只有三项：`label`、`collection.route` 和 `collection.columns`
（每列都需要 `key` 和 `label`）。此页面上的其他内容都是可选的，并且
具有增量性：从快速入门的形状开始并逐步扩展。标有版本的键
在该版本中加入；未标记的键自 API 发布以来一直保持稳定。

### 顶层

| 键 | 含义 |
|---|---|
| `label` | 侧边栏标签和页面标题 |
| `sub` | 副标题徽章（通常是你的插件名称） |
| `icon` | 来自 Minimal 图标集的图标名称——完整列表见下方的 [Icons](#icons)。未知名称会渲染为空图标，因此请从列表中复制 |
| `cap` | 所需的功能权限。在服务器端检查；没有该权限的用户在应用中看不到此界面。拥有自定义访问模型的插件则在 shim 内部进行权限控制——参见 [Capability patterns](#capability-patterns) |
| `collection` | 列表定义（见下文）。当界面声明了 `settings` 时可选：仅设置界面会将其设置视图渲染为整个页面（适用于没有列表可显示的设置型插件；捆绑的 Perfmatters 适配器就是示例） |
| `family` | 对执行相同工作的界面进行分组的 ID（`forms`、`mail`、`redirects`、`activity-log`、`snippets`、`backups` 或你自己的界面）。同一系列的界面共享一个侧边栏条目，并在顶栏徽章中显示提供方切换器；用户的选择会按系列记住 |
| `group` | 侧边栏位置。支持两个值：默认的 **`"tools"`**（日志、重定向、代码片段：站点基础功能）和 **`"workspace"`**——用于收件箱形态的界面，即用户每天都会查看、因为新条目需要人工处理的界面（表单条目是捆绑示例）。自 v0.17.0 起，这项规则会被强制执行，而不是仅作提示：工作区要求集合包含一个 `ago` 列（按时间排序的流）；其他内容都会放在 Tools 下，Integrations 卡片也会对此进行说明 |
| `manage` | 可选的**第二个**集合（形状与 `collection` 相同）。在列表上方添加视图切换器；每个集合的 `viewLabel` 指定其标签页名称。当你的界面恰好有一个自然配套视图时使用它——条目及其生成对象（Gravity Forms：Entries / Forms）。需要超过两个？请使用 `views` |
| `views` *（v0.13）* | 超出 `collection` 和 `manage` 的可选**更多**列表视图：一个集合数组（形状与 `collection` 相同），每个集合都需要一个 `viewLabel` 来命名其切换器选项卡。条目可以带有自己的 `cap`，以便仅对该视图施加比界面更严格的门槛（实际门槛仍是你的路由的 `permission_callback`）；用户不可见的条目，或缺少 `route`/`viewLabel` 的条目，会在服务器端被丢弃。视图在切换器中的 `manage` 之后渲染，并支持完整的集合词汇（选项卡、搜索、筛选、详情、操作、批量、新建）。捆绑的 Gravity SMTP 适配器使用其中一个来显示其 Debug 日志 |
| `status` *（v0.10；`chart` v0.13）* | 列表上方的可选状态卡片：`{ "route": "your/v1/status" }`。该路由返回服务器构建的显示模型（见下文），因此你的适配器在服务器端格式化值，客户端保持通用 |
| `setup` *（v0.12）* | 可选的一次性设置门槛（见下文）。当你的插件仍需要自己的首次运行安装时，该界面会渲染设置卡片而不是集合，「Set up now」会在服务器端运行你的安装程序 |
| `settings` *（v0.12）* | 可选设置视图（见下文）：由 schema 驱动的选项卡通过你自己的路由提供，由 Minimal 的表单引擎渲染，并通过插件自己的设置 API 写回。在视图切换器中添加 Settings 入口 |

### 图标

规范集合（未知名称会渲染为空；不存在备用字形）：

`activity` `arrow-up-right` `bell` `block` `bold` `braces` `bug` `cart` `chat` `check`
`chev` `clipboard` `clock` `code` `columns` `copy` `cpu` `database` `doc` `eraser` `file`
`focus` `gallery` `gear` `globe` `grid` `grip` `h2` `h3` `help` `img` `inbox` `italic`
`key` `link` `list` `logout` `minus` `monitor` `moon` `olist` `php` `pilcrow` `play`
`plug` `plus` `power` `quote` `refresh` `search` `send` `server` `shield` `shuffle`
`strike` `sun` `table` `tag` `toc` `trash` `undo` `upload` `users` `warn` `wp` `wrench` `x`

此列表对应 `assets/js/app.js` 中的 `icon()` 映射；编辑器斜杠命令接受
相同的名称（或字面量短字形字符串）。

### 权限模式

所有随附适配器都涵盖在两种模式中：

1. **普通权限。** `cap` 指定一个 WordPress 权限，而你的路由
   `permission_callback`检查相同的项（通过一个共享辅助函数，因此它们无法
   偏离）。只要核心 cap 确实建模了谁可以查看数据，就应当右对齐。
2. **适配器侧门控。** 某些插件有自己的访问模型，没有任何单一
   权限所表达的含义：Gravity Forms 管理员拥有 `gform_full_access`，而不是
   更细粒度的权限，WP Activity Log 提供「仅我 / 仅管理员」的设置。在那里，声明一个
   有意放宽 `cap`（`'read'`），使界面能够触达应用，并让你的
   路由的 `permission_callback` 调用插件自己的解析器
   (`GFCommon::current_user_can_any( … )`, `Settings_Helper::current_user_can( 'view' )`).
   路由是边界；描述符上限仅用于界面限制。

切勿检查插件实际上通过某个功能授予的原始细粒度权限
解析器：用户可以通过解析器持有访问权限，即使未通过原始检查。

### `setup` — 一次性设置门

![A setup gate: icon, title, note, option switches and a Set up now button in place of the list](img/setup-gate.png)

某些插件需要首次运行安装后才能工作（Redirection
会在其设置向导中创建表和默认组；在此之前，每个
写入失败）。声明 `setup` 可以保持界面诚实：在设置过程中
需要时，集合、创建和操作均无法访问，用户会看到
在其流程中放置设置卡片，而不是显示原始插件错误。

```php
'setup' => array(
    'needed'  => function () {                       // truthy = gate the surface
        return my_plugin_needs_install();            // keep it cheap: runs on app boot
    },
    'title'   => 'My Plugin needs its one-time setup',
    'note'    => 'What the setup does, in a sentence or two.',
    'options' => array(                              // optional: your wizard's questions
        array( 'id' => 'monitor', 'label' => 'Monitor permalink changes', 'default' => true ),
        array( 'id' => 'ip',      'label' => 'Store IP addresses',        'default' => false ),
    ),
    'run'     => function ( $choices ) {             // $choices: id => bool
        return my_plugin_install( $choices );        // true or WP_Error
    },
),
```

规则：

- `needed`会在每次应用加载时运行，因此应仅用于读取选项。抛出异常的
  检查显示为无需执行：损坏的门控永远不能让正常工作的界面失效。
- `run`必须通过**你自己的插件安装器**处理，绝不能使用重新构建的
  它的副本。它会接收布尔值形式的切换项（未声明的 id 会
  被删除，缺失的项会获得你声明的默认值），并在后台运行
  界面自身的 `cap`，通过 `POST minimal-admin/v1/surfaces/{id}/setup`。
- Options 用于设置向导中的问题。默认的隐私相关
  选项（IP 记录、遥测）默认关闭；Minimal 不会替你做出这些选择
  静默地。
- Minimal 确实无法内联运行的设置（例如外部身份验证流程）可以
  声明 `href`，而不是 `run`；卡片会渲染一个诚实的外链，并且
  当你的设置标记为完成后，该界面就会生效。

### `status` — 列表上方的一张卡片

![A status card: three stat rows with hints and a 14-day bar chart](img/status-card.png)

对于仅凭列表无法完整表达信息的界面（Disembark 的 Backups
视图是参考实现），声明 `status.route` 并返回：

```json
{
    "rows": [
        { "label": "Last scan", "value": "3 hours ago", "hint": "142,318 files · 2.1 GB" }
    ],
    "command": {
        "label": "Back up from any terminal",
        "text": "disembark connect https://example.com abc123…",
        "hint": "Requires the Disembark CLI."
    },
    "actions": [
        { "label": "Clean up working files", "route": "your/v1/cleanup", "method": "POST", "confirm": "Really?", "danger": true },
        { "label": "Open Disembark ↗", "href": "https://example.com/wp-admin/tools.php?page=disembark" }
    ]
}
```

`rows`渲染为统计条（发送可直接显示的字符串；在服务器端格式化）。
`command`渲染为可点击复制的等宽字体框；没有内容时将其省略
没有可复制的内容。`actions` 会渲染为按钮：使用 `route` 时，它们会 POST（或
`method`），并在成功后重新获取状态和列表，`confirm`
会先显示原生确认框，`danger` 会将按钮设为红色，而 `href`
渲染一个普通的新标签页链接，而不是请求。操作可以声明
`fields`（创建字段词汇）实现参数化：按钮
替换为内联表单，并将值合并到请求正文中
（带地址字段的「Send a test email」是捆绑的 Gravity SMTP
参考）。省略不需要的任何键；条件操作只是
你的路由未包含在响应中的操作。

可选的 `chart` 会在行下方绘制紧凑的柱状序列（具有相同的视觉
语言，就像 Overview 流量/活动图表一样）。形状：

```json
{
    "title": "Last 14 days",
    "primary": "Sent",
    "secondary": "Failed",
    "points": [
        { "label": "Jul 1", "value": 5, "secondary": 1 },
        { "label": "Jul 2", "value": 3, "secondary": 0 }
    ]
}
```

`points`是必需的（为空时跳过该键）。`label`已可直接显示；
`value`是实心条和第一条提示行。当存在 `secondary` 时
在图表上（或任意点上），条形图会变为双层：一条柔和的总计条
（`value + secondary`）位于实心主栏后方，提示行按以下名称命名
`primary` / `secondary`（默认值为「Count」/「Other」）。单序列图表
省略 `secondary`，每个点渲染一条强调色条。内置的 Gravity
SMTP 适配器是参考实现（每日发送/失败数据来自其事件表）。

### `settings` — 架构驱动的设置视图

![A settings view: schema tabs, text/number/select fields with help text, a toggle revealing a dependent field, and a locked count with the wp-admin escape](img/settings-view.png)

你的插件设置由 Minimal 根据模式渲染，该模式由你的路由在以下地址提供
运行时。声明选项卡和一个路由；Minimal 使用相同的
为创建/编辑表单和编辑器面板提供支持的字段引擎，因此当你的
插件添加一个字段，覆盖率会自行更新，无需发布 Minimal 版本：

```php
'settings' => array(
    'label' => 'Settings',                 // view-switcher label (default "Settings")
    'cap'   => 'manage_options',           // optional: hides the VIEW from users
                                           // without the capability (the surface
                                           // itself may be readable more widely);
                                           // your route's permission_callback is
                                           // the real write gate
    'tabs'  => array(
        array( 'id' => 'general', 'label' => 'General' ),
        array( 'id' => 'logging', 'label' => 'Logging' ),
    ),
    'route' => 'my-plugin/v1/minimal-settings/{tab}',
),
```

该路由为每个选项卡实现一个契约：

- `GET {route}`在一个响应中返回架构和当前值：

```json
{
    "groups": [
        {
            "title":  "Sending",
            "fields": [
                { "key": "from_name", "label": "From name", "help": "Shown on outgoing mail." },
                { "key": "retention", "label": "Retention (days)", "type": "number", "min": 1 },
                { "key": "mode",      "label": "Mode", "type": "select", "options": [ ["digest", "Daily digest"], ["instant", "Instant"] ] },
                { "key": "enabled",   "label": "Advanced routing", "type": "toggle" },
                { "key": "route_url", "label": "Routing URL", "mono": true, "showWhen": { "key": "enabled", "equals": true } }
            ],
            "locked": 2
        }
    ],
    "values":   { "from_name": "Minimalow", "retention": 30, "mode": "digest", "enabled": false },
    "adminUrl": "https://example.com/wp-admin/admin.php?page=my-settings"
}
```

- `POST {route}`接收包含**仅限这些键**的 `{ "values": { … } }`
  用户实际编辑的内容**，并返回相同且最新的结构。返回一个
  `WP_Error`拒绝保存；消息会显示为 Toast，表单
  保留已输入的内容。

字段使用共享的表单词汇：`key`、`label`、`type`（`text` 默认 ·
`textarea` · `number` · `select`（渲染为 Minimal 主题化的可搜索
下拉框，绝不使用原生 select 弹窗）· `combobox`（主题化自动完成，基于
`options`，长目录靠右） · `toggle` · `email` · `url`），`options`
（`[value, label]` 对），`placeholder`、`help`（在该控件下方渲染），
`rows`、`min`/`max`、`mono` 和 `showWhen: { "key": …, "equals": … }`（
行仅在控制字段具有该值时显示，并进行实时评估
（用户编辑时）。组的 `locked` 数量表示「‪N 个高级设置 —
对于过于定制、无法渲染的内容，通过 `adminUrl` 编辑 wp-admin ↗"
以通用方式。

使用规则：

- 由于只有已编辑的键会随保存请求发送，未修改的值永远不会往返传输
  通过你的清理器。
- **密钥**：使用可识别的哨兵值进行掩码提供，并跳过
  当哨兵值返回时写入（Gravity SMTP 的 `****************`
  语义）。用户触碰过但仍处于遮罩状态的字段绝不能覆盖
  存储的密钥。
- 通过插件的**自有**设置 API 进行读写，在
  路由，因此恒定锁定、加密和验证语义仍由你负责。
- 界面可以是**仅设置**：完全省略 `collection`，并且
  设置视图会渲染为整个页面，不带视图切换器。如果你的
  插件通过核心 WP Settings API 注册其选项，内置的
  Perfmatters 适配器是读取该注册表的参考实现
  在运行时使用架构，而不是手动复制字段。
- 设置可以是**项目级**的：包含 `{id}` 的 `route` 会渲染
  每个项目的设置视图，而不是全局视图。设置选项卡会保留
  视图切换器（目前还没有可渲染的项目），并且入口来自一个
  行改为：声明一个操作 `{ "label": "表单设置",
  `"settingsItem": true }`，位于其行拥有设置的列表中，并且
  点击它会打开该行的设置视图（{id} 和 {tab} 都
  替换到路由中；工具栏会显示项目名称）。内置的
  Gravity Forms 适配器是参考实现：其 Forms 视图中的行会打开每个
  表单自身的设置，其中架构从 Gravity Forms 的 Settings 中读取
  请求时的框架。

### `collection`

| 键 | 含义 |
|---|---|
| `route` | 列表使用的 REST 路由。可以包含 `{tab}`（替换为当前标签页的值） |
| `allRoute` | 当 `route` 包含 `{tab}` 时，「All」标签页使用的路由 |
| `query` | 附加到每个请求末尾的额外查询字符串（排序等） |
| `pageQuery` | 分页模板，默认值为 `per_page=25&page={page}`。`{page}` 从 1 开始计数；对于从 0 开始的 API，请使用 `{page0}`（Redirection）。使用你的 API 自身的样式，例如 Gravity Forms 的 `paging[page_size]=25&paging[current_page]={page}` |
| `itemsKey` / `totalKey` | 响应正文中项目/总数所在的位置。对于标准 WP 集合（普通数组 + `X-WP-Total` 标头），两者都省略 |
| `tabs` | 可以是 `{ "route": "...", "valueKey": "id", "labelKey": "title" }`，通过 REST 调用构建标签页；也可以是 `{ "param": "status", "static": [["sent","Sent"],["failed","Failed"]] }`，用于将固定标签页作为查询参数传递。`allLabel` 指定第一个标签页 |
| `viewLabel` | 在视图切换器中（使用 `manage`）以及搜索占位符中为此集合命名 |
| `columns` | `{ key, label, format, altKey, width, utc }` 数组。`key` 支持点路径（`initiator_data.user_login`）；当主键为空时，`altKey` 是读取的备用键。格式：`title`、`text`（默认）、`pill`、`ago`、`mono`、`num`（数字右对齐）、`entry-summary`（用于表单条目行，这些行的答案存储在数字字段 ID 键下：将前几个答案值渲染为该行的摘要——请参阅任意捆绑表单适配器的列表）。`width` 可覆盖列的网格宽度；默认值根据格式确定。对于 `ago`，裸日期时间按站点本地时间解析：对于以 UTC 存储的时间戳，请设置 `utc: true`（或使用以 `_gmt` 结尾的键，或输出尾随的 `Z`）。自 v0.18.0 起，列还可以包含 `sort`：你的路由为该列理解的 `{by}` 令牌（见下方的 `sortQuery`）。没有 `sort` 的列保留普通标题；如果没有任何排序选项，列表顺序将保持路由返回的顺序，因此请在 `query` 中声明默认顺序（约定为最新优先） |
| `detail` | 详情模态框配置：`detailRoute`（通过 `{id}` 获取完整条目）、`sectionsRoute`（服务器构建的显示模型，是下方 `detailRoute` + `labels` 的替代方案）、`labels`（将数字字段 ID 键解析为人类可读标签——表单字段场景：`{ "route": "your/v1/forms/{form_id}/fields", "valueKey": "id", "labelKey": "label", "itemsKey": "fields" }`。路由中的 `{placeholders}` 会从条目填充，Minimal 将响应数组中的 `valueKey` → `labelKey` 映射——或映射其内部的 `itemsKey`——并按路由 URL 缓存该映射。固定架构条目完全跳过 `labels`：snake_case 响应键已经会渲染为单词）、`messageKey`（将一个字段渲染为大型文本块——HTML 消息在沙盒 iframe 中渲染，纯文本在 `<pre>` 中渲染）、`skip`（要隐藏的键）、`edit`（内联编辑，见下文） |
| `actions` | 详情模态框中的按钮，以及列表行 ⋯ / 右键菜单中的按钮：`{ label, method, route, body, confirm, danger, when, href, fields, settingsItem, list }` — 每个键的详细说明见下方的 [the `actions` section](#collectionactions--verbs-on-rows-and-in-the-detail-modal) |
| `sortQuery` | *（自 v0.18.0 起）* 包含 `{by}` 和 `{dir}` 的查询字符串模板（例如 `orderby={by}&direction={dir}`）。带有 `sort` 令牌的列会渲染为可点击的表头：首次点击排序（数字列和 `ago` 列按降序开始，其余按升序），再次点击会反转方向，并将模板追加到列表请求中。省略该项后，表头保持为普通文本 |
| `search` | 包含 `{q}` 的查询字符串模板（例如 `filterBy[url]={q}` 或 `search={q}`）。向工具栏添加筛选框；输入词会进行防抖处理并追加到列表请求中。对于将搜索条件作为 JSON 字符串接收的 API（Gravity Forms），使用对象形式：`array( 'param' => 'search', 'json' => <criteria array with '{q}' where the term goes> )`——输入词会进行 JSON 转义，条件会进行双重 URL 编码，以匹配会自行 `urldecode()` 参数的 API |
| `filter` *（v0.12）* | `tabs` 旁边的第二个列表维度，以分段控件呈现——形状和 json-merge 规则见下方的 [the `filter` section](#collectionfilter--a-second-dimension-beside-tabs) |
| `bulk` | 批量操作：形状与 `actions` 相同，但不包含 `href`（批处理始终需要 `route`）。声明任意操作后都会添加复选框列（支持按住 Shift 选择范围、选择页面）和选择栏。每个操作都会**针对每个选中项分别执行**（替换 `{id}`；单个失败不会中止其余操作），`when` 会针对每个条目进行计算，因此混合选择会跳过不符合条件的行；如果按钮的 `when` 与当前页面上的任何内容都不匹配，则完全不会显示；结果提示会报告已完成 / 已跳过 / 已失败 |
| `create` | 添加「Add」按钮和表单模态框。`{ label, route, method, fields, defaults }` — `fields` 是 `{ key, label, mono, type, value, placeholder, rows, options, required }`（支持点路径键，例如 `action_data.url`）；`defaults` 会合并到输入值下方，因此固定字段（分组、匹配类型）会一并提交。字段类型：`text`（默认）、`number`、`textarea`（`rows` 设置其高度）、`select`（以 `[value, label]` 对的形式使用 `options`）、`tags`（逗号分隔输入，提交为数组）、`email`、`url`。除非声明了 `required: false`，否则每个字段都是必填项。创建失败（你的路由返回 `WP_Error`）时会弹出错误消息，并保留表单中的已输入内容 |

![A detail modal from detailRoute: key/value rows, the messageKey block, prev/next stepping and action buttons (the off-site one marked ↗)](img/detail-modal.png)

### `collection.actions` — 行上和详情模态框中的操作动词

每个操作都是 `{ label, method, route, body, confirm, danger, when, href, fields,`
settingsItem, list }`：

- **`route`** — `{id}` 会替换为条目 ID；`method` 默认为 POST（DELETE 是
  没问题；多个内置适配器使用它进行永久删除）；`body`
  合并到请求中。该路由可能返回 `{ "message": "…" }` 以替换
  默认的「⟨label⟩ — 完成」提示，这是标签无法
  承诺（内置的 Gravity SMTP 发送测试功能会报告另一个活动邮件程序
  实际执行发送的）。
- **`confirm`** 会先显示原生确认提示；**`danger`** 会将按钮设置为红色。
- **`when: { key, equals }`** 仅在条目的字段匹配时提供按钮
  （Activate 与 Deactivate；Mark-read 仅在未读时显示）。
- **`href`** 会渲染普通链接，而不是发出请求；`{field}` 占位符
  从条目中填充。链接会在新标签页中打开，而离开站点的 href 始终
  使用 ↗ 标识渲染（请参阅 [External links are always marked](#external-links-are-always-marked)）。
- **`fields`** *(v0.12)* 使操作变为**参数化**：点击后会替换按钮
  内联表单的行（创建字段词汇；除非
  `required: false`），类型化值会在此之前合并到 `body`（支持点路径）
  请求触发：「添加备注」和「发送至 ⟨address⟩」形态。参数化操作会保持
  **仅详情**（需要模态框的表单界面）。状态卡片操作接受
  `fields`以相同方式。
- **`settingsItem: true`** *(v0.13)* 不会发出请求：它会打开界面的
  针对行的条目级设置视图（需要一个包含 `{id}` 的 `settings.route`；
  请参见设置部分）。
- 每个无需参数的操作也会显示在列表行的 ⋯ / 右键菜单中
  （Open 始终位于第一位）；设置 **`list: false`** 以保留仅显示动词的详情。

### `collection.filter` — 选项卡旁的第二个维度

渲染为分段控件：`{ label, options, query }` 或
`{ label, options, param, json }`。`options` 是 `[value, label]` 对，且 FIRST 是
默认值始终会被发送。

- 普通形式会追加 `query`，并将 `{v}` 替换为 `status={v}`。
- 当 `search` 采用对象形式时，json 形式会合并到同一个条件对象中
  它们共享 `param`。这就是合并的意义：Gravity Forms 接管状态和字段
  将过滤器放在一个 JSON `search` 参数中，两个独立的写入者会相互覆盖
  彼此。
- 将筛选器与受 `when` 保护的操作配对，使每个筛选视图都能提供相应的操作
  在那里具有相应含义（已接收：垃圾邮件 / 回收站 · 回收站：恢复 / 永久删除）。

### 页面与模态框

Minimal 的规则是：何时为记录显示详情模态框，何时为其提供带有自身内容的完整页面
自己的 URL：模态框用于快速查看（读取记录、运行快速操作、关闭）；记录
当它拥有自己的子资源或工作流，或拥有值得分享的 URL 时，才值得拥有一个页面
与团队成员协作。WooCommerce 订单是先例：订单页面位于 `/orders/{id}`
承载完整的工作界面（条目、付款、退款、电子邮件、备注、相关订单）
而 Quick view 仍作为模态框，用于从列表中进行单击查看。两种呈现方式
共享一个详情主体，因此两者不会产生偏差。

插件界面按设计使用模态框。条目、日志行和软件包都是
适合快速浏览，`sectionsRoute` 详情和行操作可以覆盖它们；一个界面
其记录确实包含子资源的插件，应链接到自己的界面（该
`href` 操作），而不是在模态框中模拟页面。如果 Minimal 之后推广一个
将界面细节展示到真实页面时，也会依据这一相同测试，而不是依据受欢迎程度。

### `detail.edit` — 详情模态框中的内联编辑

允许用户就地编辑条目的字段，并通过插件自己的更新端点保存：

```php
'detail' => array(
    'edit' => array(
        'route'    => 'redirection/v1/redirect/{id}',   // update endpoint; {id} replaced
        'method'   => 'POST',                            // default POST
        'preserve' => array( 'match_type', 'group_id' ), // untouched fields sent along so
                                                         // your sanitizer doesn't reset them
        'fields'   => array(
            array( 'key' => 'url', 'label' => 'Source URL', 'mono' => true ),
            array( 'key' => 'action_data.url', 'label' => 'Target URL', 'mono' => true ),
            array( 'key' => 'action_code', 'label' => 'HTTP status', 'type' => 'number' ),
        ),
    ),
),
```

每个字段都是 `{ key, label, mono, type }`：`key` 支持点路径（`action_data.url`
读取和写入 `{ "action_data": { "url": … } }`），`mono` 会渲染一个等宽字体输入框，并且
`type: "number"`发送数值。编辑字段接受与 `create` 相同的词汇
字段（`textarea`、`select`，以及 `options`、`tags`、`rows`、`placeholder`）：两者都会渲染
通过相同的表单引擎。显示为输入框的字段会从静态内容中隐藏
自动生成详细信息行。内置的 Redirection 适配器就是参考实现。

### `detail.sectionsRoute` — 服务器构建的详情视图

你的端点也可以返回完整的显示模型，而不是 `detailRoute` + `labels`
一个响应，标签已在服务器端解析完成。`sectionsRoute`（使用 `{id}`）
必须返回：

```json
{
    "kind": "entry",
    "sections": [
        { "title": "Response",   "rows": [ { "label": "Email", "value": "dana@example.com", "type": "email" } ] },
        { "title": "Submission", "rows": [ { "label": "Date",  "value": "2026-07-09 14:02" } ] }
    ],
    "adminUrl": "https://example.com/wp-admin/admin.php?page=…"
}
```

`kind`选择布局：`"entry"`渲染联系式表单录入视图（姓名和
电子邮件主视觉、消息正文、安静的元数据），`"activity"` 会渲染审计事件视图（谁、
事件消息、上下文标签）。对于普通的分组键值视图，请省略它。`adminUrl`
链接到条目的 wp-admin 页面，并抑制任何指向该页面的 `href` 操作
相同的位置。内置的 Gravity Forms 适配器（条目）和 WP Activity Log 适配器
（事件）就是参考。

行的 `type` 决定其值的渲染方式（仅限普通分组布局；`entry`
并且 `activity` 卡片有自己的结构）。自 v0.18.0 起，词汇如下：

| `type` | 渲染为 |
|---|---|
| *（省略）* | 普通值；多行或较长的值会堆叠在标签下方 |
| `url` | 在新标签页中打开的链接（仅限 `https?://` 值） |
| `email` | 一个 `mailto:` 链接 |
| `pill` | 使用 Minimal 共享状态词汇（`sent`、`failed`、`active`、`locked`、……）的状态标记 |
| `code` | 转义后的等宽字体块（标头、原始负载、堆栈跟踪）；超过约 14 行后可滚动 |
| `html-preview` | 在完全沙盒化的 iframe 中显示你的 HTML（无脚本、不透明源）——这是展示邮件正文或渲染模板的可靠方式。HTML 永远不会接触 Minimal 的 DOM |
| `kv-table` | 双列表格，用于显示键和值。`value` 可以是对象映射、由 `[key, value]` 对组成的数组，或由 `{ "label", "value" }` 对象组成的数组；最多 60 行 |

值始终会被转义；`html-preview` 是唯一会渲染你的标记的位置，并且
仅在沙箱内部。

## 让你的表单插件成为一等 Forms 提供者

表单插件正是此 API 的适用对象，并且会获得额外的机制来
免费。以下是内置表单适配器使用的精确结构（Gravity Forms、
Ninja Forms、Forminator、Formidable、Fluent Forms、通过 Flamingo 和 CFDB7 支持的 CF7）：

![The contact-card entry detail: sender hero, message block, labeled answers, submission meta line and entry actions](img/entry-detail.png)

```php
$surfaces['driftwood'] = array(
    'label'      => 'Forms',
    'sub'        => 'Driftwood',
    'icon'       => 'inbox',
    'cap'        => 'read',            // adapter-side gating: your routes check your own access model
    'family'     => 'forms',           // join the Forms provider switcher
    'group'      => 'workspace',       // entries are inbox-shaped
    'collection' => array(
        'viewLabel' => 'Entries',
        // Dynamic per-form tabs: {tab} in the route + an All route.
        'route'     => 'driftwood/v1/forms/{tab}/entries',
        'allRoute'  => 'driftwood/v1/entries',
        'tabs'      => array(
            'route'    => 'driftwood/v1/forms',   // one tab per form
            'valueKey' => 'id',
            'labelKey' => 'title',
            'allLabel' => 'All forms',
        ),
        'itemsKey'  => 'items',
        'totalKey'  => 'total',
        'search'    => 'search={q}',
        'columns'   => array(
            // Answers live under numeric field-id keys → entry-summary.
            array( 'key' => 'id', 'label' => 'Entry', 'format' => 'entry-summary' ),
            array( 'key' => 'form_title', 'label' => 'Form' ),
            array( 'key' => 'created', 'label' => 'Date', 'format' => 'ago', 'utc' => true ),
        ),
        'detail'    => array( 'sectionsRoute' => 'driftwood/v1/entries/{id}/view' ),
        'actions'   => array(
            array( 'label' => 'Mark as spam', 'route' => 'driftwood/v1/entries/{id}/spam', 'when' => array( 'key' => 'status', 'equals' => 'active' ) ),
            array( 'label' => 'Export CSV ↗', 'href' => 'https://example.com/wp-json/driftwood/v1/forms/{form_id}/export?token={export_token}' ),
            array( 'label' => 'Delete', 'route' => 'driftwood/v1/entries/{id}', 'method' => 'DELETE', 'confirm' => 'Delete permanently?', 'danger' => true ),
        ),
    ),
    'manage'     => array(
        'viewLabel' => 'Forms',
        'route'     => 'driftwood/v1/forms',
        'columns'   => array(
            array( 'key' => 'title', 'label' => 'Form', 'format' => 'title' ),
            array( 'key' => 'entry_count', 'label' => 'Entries', 'format' => 'num' ),
        ),
    ),
);
```

逐项说明：

- **`family: 'forms'`** — 声明它。同一族系的界面共享一个侧边栏条目，并且
  顶部栏徽章中的提供商切换器，并且会按系列记住用户的选择。
  与 Gravity Forms（或任何其他插件）共存就是字面意义上的共存：你的插件会成为其中一个
  单个 **Forms** 导航项下的提供程序，绝不添加第二行侧边栏项。
  系列还会自动将条目详情切换为联系人卡片布局（如下）。
- **动态选项卡**与路由中的 `{tab}` 配合使用：选项卡路由返回你的表单
  （数组，或值为这些表单的任意对象），`valueKey` 会填充 `{tab}`，
  `labelKey`命名选项卡，`allRoute`用于 All 选项卡。（静态 `param` 选项卡和
  动态路由选项卡是 `tabs` 的两种形式；请选择一种。旁边的状态维度
  表单选项卡的用途就是 `filter`。）
- **`entry-summary`** 是用于显示每个表单字段形状的列表列：它会收集
  条目的值放在**数字键**下（字段 ID：`"1"`、`"2.3"`），并对其排序
  按数值排序，并显示前三条较短的内容（≤ 60 个字符、单行），以连接
  使用 `·`。较长和多行的答案会保留在详情中。如果你的 id 不是数字，
  改为在每个项目上发送现成的 `summary` 字符串；它的优先级高于启发式判断。
- **条目详情**应为一个返回 `kind: "entry"` 的 `sectionsRoute`，即
  联系卡片布局：姓名和电子邮件主区域、消息正文、简洁的元数据。Minimal 选择
  根据你的分组生成主视觉行和正文行：**答案**是标题类似于
  「Response」（否则使用第一个区段），**meta** 是标题类似于「Submission」的那个
  （否则为第二个）。在答案中，某行的可选 `type` 是最强的提示
  （`name`、`email`、`textarea` 或 `post_content` 用于消息正文）；没有类型时，
  标签（「姓名」、「电子邮件」、「消息……」）和数值形状（类似电子邮件的字符串、一个
  多行或 120 个以上字符的值）来决定。在项目上发送 `form_name`，模态框将
  使用它作为标题，并以「条目 #id」作为副标题。
- **`manage`** 是 Forms 的配套视图：每个表单插件都会使用的 Entries/Forms 切换器
  插件需要什么。保持为列表（标题、条目数，也可以通过一个激活切换开关
  `when`-操作对）；表单**构建器**仍是你自己的界面，并与其诚实地链接
  一个 `href` 操作（`'label' => 'Edit form ↗'`）。Minimal 不会重新实现它。
- **导出**是一个指向你自己下载端点的 `href` 操作，并且
  `{field}`占位符从项目中填充（将 nonce 或签名令牌放入项目的
  这样链接就能自行授权；操作 `href`s 会作为普通的新标签页链接打开，并且
  不携带 REST 标头）。Minimal 没有流式下载原语；诚实的链接是
  模式。

[shim tutorial](shim-tutorial.md) 的 Campfire 示例就是这个方案，减去了
每个表单的机制：从这里开始了解表格/shim 机制，然后添加所需部分
上述内容为基础。完整形态的生产级参考实现见随附的
`includes/adapters/gravity-forms.php`是最深层的实例。

## 钩子参考

界面是入口，但 Minimal 的完整扩展面是这组公开
钩子，每个钩子在下面都有自己的部分，或有自己的契约说明：

| 钩子 | 类型 | 用途 |
|---|---|---|
| `minimal_admin_surfaces` | filter | 侧边栏视图（列表、标签页、详情模态框）——上述描述符参考 |
| `minimal_admin_editor_panels` | filter | 编辑器侧边栏中的单篇文章字段或状态／操作面板 |
| `minimal_admin_traffic` | filter | Overview 图表流量提供方 |
| `minimal_admin_traffic_day` | filter | 概览流量栏下钻（指定日期范围内的热门页面／引荐来源） |
| `minimal_admin_block_forms` | filter | 阻止检查器标签/控件 + 斜杠插入模板 |
| `minimal_admin_insert_blocks` | filter | 精简或扩展自动插入的斜杠列表 |
| `minimal_admin_page_builders` | filter | 注册全画布页面构建器 |
| `minimal_admin_design_sources` | filter | 为斜杠菜单 + 区块选择器注册设计／模板库 |
| `minimal_admin_editor_commands` | filter | 注册自由格式的斜杠菜单／区块选择器命令（样板 HTML、岛屿模板、异步路由） |
| `minimal_admin_before_render_blocks` | action | 在 island `do_blocks` 之前注册资源 |
| `minimal_admin_render_styles` | filter | 为 island 预览添加额外 CSS URL / 内联 CSS |
| `minimal_admin_rendered_html` | filter | 重写一个岛屿渲染后的 HTML（地图、回退内容） |
| `minimal_admin_template_footer` | action | Minimal 应用文档的末尾（没有 `wp_head`/`wp_footer`） |
| `minimal_admin_cache_purgers` | filter | 加入「Clear site cache」调色板命令 |
| `minimal_admin_spam_providers` | filter | 向 Settings → Spam 添加提供方卡片 |
| `minimal_admin_license_providers` | filter | 在许可证卡片上报告许可证状态，可选择激活／停用／重新验证 |
| `minimal_admin_comments_enabled` | filter | 覆盖评论检测（导航、调色板、徽章） |
| `minimal_admin_visibility_providers` | filter | 报告活跃的维护／即将上线／密码模式（概览横幅、顶栏标签、系统检查） |
| `minimal_admin_media_folders` | filter | 使用你的文件夹插件为 Media 视图的文件夹筛选器提供数据（自 0.18.0 起） |
| `minimal_admin_log_sources` | filter | 向 System 的日志查看器添加日志（自 0.19.0 起） |

Minimal 刻意不会触发 `wp_head`/`wp_footer`（保持文档干净），因此开发者
希望渲染到页面中的工具会附加到 `minimal_admin_template_footer`；该
内置的 Query Monitor 适配器就是参考实现。

## 区块检查器表单 — `minimal_admin_block_forms`

> **正在为 Minimal 构建区块？** 从 [content-blocks.md](content-blocks.md) 开始：北
> 星标（写作编辑器与布局工具）、内容区块契约，以及何时使用 islands
> 而不是完整 schema。本节是该契约的过滤器/描述符参考。
> [Anchor Blocks](https://github.com/anchorhost/anchor-blocks) `app/MinimalAdmin.php` 是
> 参考适配器。

Minimal 的编辑器会将复杂区块渲染为只读岛屿，而**区块检查器**（⚙
每个岛上的芯片）都会根据每个区块已注册的属性架构生成配置表单。
模式本身已经能完成很多工作：带有 `enum` 的属性会渲染为选择框，
名为 `content` 的属性（或包含长文本的属性）会获得一个 textarea，标签也会进行人性化处理
根据键生成。架构无法表达其余意图：比
键名、面向用户的选项标签以及一个有保证的文本区域。此筛选器会叠加这些内容：

```php
add_filter( 'minimal_admin_block_forms', function ( $forms ) {
    $forms['my-plugin/testimonial'] = array(
        'order'      => array( 'author', 'quote', 'tone' ),   // field order
        'attributes' => array(
            'author' => array( 'label' => 'Author' ),
            'quote'  => array( 'label' => 'Quote', 'control' => 'textarea' ),
            'tone'   => array(
                'label'   => 'Tone',
                'control' => 'select',
                'options' => array( array( 'light', 'Light' ), array( 'dark', 'Dark' ) ),
            ),
            'legacy' => array( 'hide' => true ),              // keep out of the form
        ),
    );
    return $forms;
} );
```

每个属性：`label`、`control`（`text` · `textarea` · `select` · `number` · `checkbox`），
`options`（`[value, label]` 对，表示 `select`）、`hide`。没有描述符时，
检查器会回退到由架构派生的控件，因此这是完善项，而非要求。
带有 `source` 的属性（存储在已保存的 HTML 中）永远不会通过表单编辑。

优先在属性架构本身中表达你能表达的内容：在其上声明 `enum`
固定选项属性，通用表单会渲染出一个完全没有描述符的选择框
（其他所有 schema 使用者也会受益）。只有当原始内容为 时，才使用 `options`
值需要人类可读的标签。

### 动态区块会自动插入 — 无需描述符

如果你的区块是**完全由服务器渲染**的（某个 `render_callback` 或 `render` 文件负责
并且你的 JS `save()` 为 null），那么它已经可以在 Minimal 中插入，无需任何适配器代码。
对于这些区块，自闭合注释是有效的已保存标记，因此 Minimal 会自动注册每个
动态的顶层、在插入器中可见的非核心区块，用于**渲染来自一个裸
comment** 作为仅搜索的斜杠菜单项：它不会弄乱默认菜单，但输入
其标题的一部分（或其命名空间，因此 `/my-plugin` 会列出你提供的所有内容）即可显示它。
插入操作会将 `<!-- wp:your/block /-->` 作为岛屿插入，渲染真实预览，并打开
架构驱动的检查器。

渲染探针是诚实性门槛。仅有 `is_dynamic` 并不意味着一个空白评论会
有效：混合区块（包含 render_callback **以及** 一个会输出包装器 HTML 的 JS `save()`，或
只处理已保存内部区块的渲染）无法独立渲染，并且会失败
如果是 Minimal 插入的，Gutenberg 的区块验证会处理它们，因此会将其排除。如果你的区块
如果没有属性就会渲染为空，请提供合理的默认值或提供一个 `insert.template`。

要充分利用自动插入功能，请在服务器端正确注册你的区块：

- **在 PHP 注册中使用 `title`**（或 `block.json`）— 否则 Minimal 会回退到
  人性化的 slug（「report-card」 → 「Report Card」）。
- **用于子区块的 `parent` / `ancestor`，在服务器端声明** — 已声明的子区块
  从顶层插入中排除，与 Gutenberg 的插入器完全一致。一个 `parent` 会
  仅存在于你的编辑器 JS 中的内容，对 Minimal（以及所有其他服务端
  消费者），这样你的子区块就会显示为独立插入项。
- **`supports.inserter = false`** 会完全隐藏一个区块。
- **PHP 中的属性 schema**——检查器生成的表单就是基于它们构建的
  来自；`enum` 属性会变成选择框，默认值会预先填充。

静态保存块（由你的编辑器 JS `save()` 生成的 HTML）不会自动插入；只有你的
JS 可以生成它们的标记。请为这些内容在下方提供明确的 `insert.template`。

要在不提供模板的情况下抑制自动条目，请在中设置 `'insert' => false`
区块的描述符。网站还可以通过以下方式裁剪或扩展整个列表
`minimal_admin_insert_blocks`筛选器。

### `insert` — 在编辑器的 `/` 菜单中提供该区块

声明起始标记后，你的区块就会出现在 Minimal 的斜杠菜单中（一个明确的模板
始终优先于自动条目）。它作为可配置岛插入（真实
服务器渲染的预览，检查器立即打开）：

```php
$forms['my-plugin/testimonial'] = array(
    'insert' => array(
        'label'    => 'Testimonial',                    // slash-menu entry
        'icon'     => '❖',                              // optional, one glyph
        'template' => '<!-- wp:my-plugin/testimonial {"author":"…"} /-->',
    ),
    // …attribute refinements as above
);
```

`template`是完整的原始区块标记：你知道区块的规范形状（包装器 HTML、
起始子项、默认属性）；Minimal 会原样插入。仅在区块上声明 `insert`
在顶层有意义的内容（父区块和独立区块，而不是子项）。

### `wrapperText` — InnerBlocks 包装器中的可编辑文本

静态 InnerBlocks 父级通常会将标题写入其保存的包装器 HTML 中（例如
conversation 区块的标题）。使用一个**恰好包含三个捕获组的**正则表达式声明它可编辑
组**，`(prefix)(text)(suffix)`：

```php
$forms['my-plugin/panel'] = array(
    'wrapperText' => array(
        array( 'label' => 'Heading', 'pattern' => '(<div class="panel-head">)([^<]*)(</div>)' ),
    ),
);
```

仅当文本确实发生变化时才会原地替换；未修改的包装器会保持
字节级完全一致。不匹配的模式只会不渲染字段，而通用
文本运行字段不会让匹配的模式重复两次（带标签的字段优先）。请注意，Minimal 的
通用文本已经可以在没有描述符的情况下让包装文本可编辑；`wrapperText` 是
当你想要一个带标签的单一用途字段，而不是通用的「Text」时，值得声明
运行。有关区块插件发布自身描述符的实际示例，
[Anchor Blocks](https://github.com/anchorhost/anchor-blocks)注册插入模板
以及其插件自身的语义标签（`app/MinimalAdmin.php`）；当
Minimal 未安装，因此区块插件可以无条件地提供它。

## 岛屿预览 — 优先使用免费路径，仅在受阻时使用适配器

复杂区块以**孤岛**形式进入 Minimal：已保存的标记会逐字节保留，
并且 ⚙ 芯片会打开检查器。预览不是第二个编辑器画布。Minimal 会 POST
原始标记到 `minimal-admin/v1/render-blocks`，在服务端运行 `do_blocks()`，对比样式
队列，将所有新 CSS 限定在 `.minimal-island-preview` 中，并使用
`innerHTML`。这种设计是有意为之：岛可以安全地序列化，绝不重新实现
你的 React UI，并且当资源出现时仍然看起来像前端。

**针对该路径进行设计，大多数区块无需任何 Minimal 专用代码。** 如果仍有某些内容
看起来为空、巨大或没有样式时，下面的检查清单与 Minimal 自带适配器使用的清单相同
跟进。

### 免费路径（无适配器）：让 `do_blocks` 保持诚实

1. **生成有意义的服务器端 HTML。** 一个空的 `<!-- wp:your/block /-->`（或带有默认
   attrs）应生成可见标记。如果没有 attrs 时输出为空，请设置属性
   在 `block.json` / PHP 注册中设置默认值，或提供一个带有初始内容的 `insert.template`
   标记。
2. **在 `init` 注册前端样式，而不是仅在 `has_block()` 于某处找到它们时注册**
   单数帖子。** 优先使用 `block.json` `"style": "file:./style.css"`，以便核心注册
   注册区块时使用的句柄。如果你使用命名句柄（`"style": "my-block-style"`），
   在同一位置调用 `wp_register_style()`，你在该位置 `register_block_type()`。Minimal（以及任何
   其他无头 `do_blocks` 消费者）随后会在渲染时自动入队。
3. **不要在 `is_admin()` 或仅限编辑器的钩子上设置样式限制**，前端样式表不应如此处理。
   编辑器样式（`editorStyle`）仅在编辑器中生效；预览所使用的是 **style** 句柄，并且
   公共网站的共享内容。
4. **在 CSS 中调整图标和 SVG 的大小**（在 SVG 或包装器上使用 `max-width` / `width` / `height`
   类）。不受约束的 SVG 在任何无 CSS 的上下文中看起来都像「损坏的巨大图标」，而不是
   仅限 Minimal。
5. **尽可能为地图 / 图表 / 轮播图使用静态 HTML 或服务器生成的 HTML**，否则请接受
   纯客户端外壳在预览中会显示为空，直到你添加回退
   （下方）。
6. **将文本和图片 URL 放入已保存的 HTML 中（或放入与该 HTML 对应的 attrs 中）。** Minimal 可以
   已经可以编辑通用文本运行并在岛内替换图像，无需针对每个区块编写代码
   当内容位于标记中时。

Minimal 已免费提供的功能（无需适配器）：

| 行为 | 机制 |
|---|---|
| 动态区块斜杠插入 | 对空注释进行渲染探测；仅搜索条目 |
| Schema 检查器 | 来自 `register_block_type` / `block.json` 的属性 schema |
| 实时预览 HTML | 通过 `render-blocks` 使用 `do_blocks` |
| 渲染期间加入队列的样式 | `do_blocks` 之后的样式队列差异 |
| 站点 + 区块库 CSS | `editor-styles` + 在 `.minimal-island-preview` 上使用客户端作用域限定器 |
| 岛屿中的文本 / 图像编辑 | 通用文本运行 + 图像 URL 替换 |
| 设计库 / 模式 | 已注册的区块模式会自动处理；通过 `minimal_admin_design_sources` 使用库（见下文） |
| 写作快捷方式 / 样板代码 | 通过 `minimal_admin_editor_commands` 使用自由格式斜杠命令（见下文） |

### 免费路径失败时：诊断 → 即插即用适配器

| Minimal 中的症状 | 可能原因 | 不修改 Minimal 代码的修复方法 | 无法修改时的即插即用适配器 |
|---|---|---|---|
| 空岛屿，区块编辑器中完整显示 | 混合模式：JS `save()` 负责标记；空注释不渲染任何内容 | 完全由服务器渲染，或提供带有真实保存标记的 `insert.template` | `minimal_admin_block_forms` → `insert.template` |
| 内容存在但 SVG 过大 / 布局损坏 | 前端 CSS 从未在 REST 渲染时注册 | 在 `init`（`file:./style.css` 或 `wp_register_style`）处注册 `style` | `minimal_admin_before_render_blocks` + `minimal_admin_render_styles` |
| 访问后前端显示正常，但 Minimal 中为空 | CSS 仅存在于 postmeta / 浏览器编译缓存中 | 从 `do_blocks` 输出 CSS，或加入真实样式表 | `minimal_admin_render_styles`（postmeta / 预热 URL）；参见 Otter |
| 空地图 / 滑块 / Lottie 外壳 | 服务器输出一个 div + script；`innerHTML` 从不运行脚本 | 服务器渲染静态后备内容（图像、iframe、noscript） | `minimal_admin_rendered_html` 切换到 iframe/静态内容 |
| 插入有效，检查器为空 | 服务端没有属性 schema | 在 PHP / `block.json` 中注册属性 | `minimal_admin_block_forms` 仅细化标签 schema |
| 静态保存的设计库 | 只有编辑器 JS 能够编写完整设计 | 发布序列化模板（JSON/CDN），供 Minimal 获取 | 设计源（`minimal_admin_design_sources`，见下文） |

### 预览钩子（复制到 `includes/minimal-admin.php` 中）

Minimal 未安装时，所有这些操作都不会执行。

**1. 在渲染前注册样式**（命名句柄，否则核心将无法看到）：

```php
add_action( 'minimal_admin_before_render_blocks', function ( $blocks, $post_id ) {
	// $blocks is an array of raw markup strings for the islands being previewed.
	if ( ! minimal_admin_markup_has( $blocks, 'my-plugin/' ) ) {
		return;
	}
	wp_register_style(
		'my-block-style',
		plugins_url( 'build/style.css', MY_PLUGIN_FILE ),
		array(),
		MY_PLUGIN_VERSION
	);
}, 10, 2 );

function minimal_admin_markup_has( $blocks, $needle ) {
	foreach ( (array) $blocks as $raw ) {
		if ( is_string( $raw ) && false !== strpos( $raw, $needle ) ) {
			return true;
		}
	}
	return false;
}
```

注册句柄后，Minimal 的 `do_blocks` + queue-diff 路径会以相同方式将其加入队列
前端会执行的操作。

**2. 直接传入 CSS URL 或内联 CSS**（postmeta 缓存、嵌入 attrs 中的 CSS 等）：

```php
add_filter( 'minimal_admin_render_styles', function ( $styles, $blocks, $post_id ) {
	// $styles = [ 'urls' => string[], 'inline' => string, optional 'warm' => url ]
	$styles['urls'][] = plugins_url( 'build/style.css', MY_PLUGIN_FILE );
	if ( $post_id ) {
		$cached = get_post_meta( $post_id, '_my_plugin_generated_css', true );
		if ( is_string( $cached ) && $cached !== '' ) {
			$styles['inline'] .= "\n" . $cached;
		}
	}
	return $styles;
}, 10, 3 );
```

可选的 `'warm' => $front_end_url`：Minimal 会将该 URL 加载到隐藏的 iframe 中一次，以便
仅限浏览器的编译器可以填充缓存，然后重新获取样式（Otter atomic-wind）。

**3. 为仅 JS 外壳重写 HTML**（地图、需要脚本运行器的小组件）：

```php
add_filter( 'minimal_admin_rendered_html', function ( $html, $raw, $post_id ) {
	if ( false === strpos( $raw, 'my-plugin/map' ) ) {
		return $html;
	}
	// Parse attrs from $raw or scrape them from $html; return a static preview.
	return '<iframe src="…" style="width:100%;height:400px;border:0" loading="lazy" title="Map"></iframe>';
}, 10, 3 );
```

在可以的时候，优先在你的插件中修复免费路径。适配器用于你
无法更改（第三方托管 CSS、JIT 编译器、旧版注册顺序）。

### Minimal 中的参考适配器（请先阅读这些）

| 适配器 | 教会什么 |
|---|---|
| `includes/adapters/otter.php` | 延迟加载的命名样式 + postmeta CSS + HTML 映射回退 + 预热 URL |
| `includes/adapters/essential-blocks.php` | 包含在已提交区块属性中的 CSS |
| `includes/adapters/stackable.php` | 静态保存区块无法自动插入时使用的设计库插入项 |
| `includes/adapters/kadence.php` / `generateblocks.php` | 在插件自己的 REST/缓存上使用相同的库模式 |
| Anchor Blocks `app/MinimalAdmin.php`（外部） | 由区块插件自身拥有的 `minimal_admin_block_forms` |

内部实验室笔记（CSS 模型、混合陷阱）：`docs/block-suites.md`。

## 设计库 — `minimal_admin_design_sources`

如果你的插件提供模板库（由用户可用的完整区块序列化标记组成
作为一个整体插入），将其注册为**设计源**。设计只会作为搜索结果出现
编辑器的斜杠菜单中的条目，以及区块选择器（⌘/）中的带标签分组：

```php
add_filter( 'minimal_admin_design_sources', function ( $sources ) {
    $sources['my-plugin'] = array(
        'label' => 'My Library',                 // block-picker group name
        'route' => 'my-plugin/v1/minimal-designs',  // implements the pair contract below
    );
    return $sources;
} );
```

该路由实现双端点契约：

- `GET {route}`返回精简列表：
  `{ "designs": [ { "id": "hero-1", "label": "Hero 1", "category": "Heroes" } ] }`
  （`category` 是可选的，显示为条目的 meta）。Minimal 会在以下位置延迟获取它
  首次打开斜杠菜单时，并在会话期间缓存它，因此要保持快速和精简。
- `POST {route}/{id}`返回插入载荷：
  `{ "template": "<!-- wp:… -->…", "block": "my-plugin/hero" }`。`template` 是完整的
  序列化的区块标记（你的规范保存输出，从构造上即符合 Gutenberg；
  单个顶层区块作为一个岛插入），可选的 `block` 用于命名
  孤岛的标签。

提供网站实际可用的内容（如果你的库受限，则仅提供免费层），并
在插入时将远程图像本地化：安装 Minimal 后，
`minimal_admin_localize_images( $template )`（参见 `includes/adapters/media-localize.php`）
将它们旁加载到媒体库并重写 URL，按文件名去重。
使用 `function_exists` 保护调用，因为即使 Minimal
并不是。为路由提供一个 `permission_callback`（`edit_posts` 与编辑器匹配）。
内置的 Stackable、Kadence 和 GenerateBlocks 适配器通过同一个
过滤器，并作为引用。

## 编辑器斜杠命令 — `minimal_admin_editor_commands`

当你的插件需要的是**写入操作**而不是区块时（模板段落、
预构建的岛模板，或从你的 REST API 获取的标记），注册一个
斜杠菜单命令。命令会出现在编辑器的 `/` 菜单和区块选择器（⌘/）中，
Minimal 文档中不包含第三方 JavaScript：

![The slash menu filtered to one plugin's entries, each carrying its namespace badge](img/slash-menu.png)

```php
add_filter( 'minimal_admin_editor_commands', function ( $commands ) {
    // 1. Synchronous prose HTML (paragraphs, simple markup the serializers keep).
    $commands[] = array(
        'id'         => 'my-plugin/cta',
        'label'      => 'CTA boilerplate',
        'icon'       => 'send',              // lucide key or a short glyph
        'ns'         => 'my-plugin',         // badge in the slash menu; picker group
        'keywords'   => array( 'cta', 'convert' ),
        'searchOnly' => true,               // hide until the writer types a match
        'html'       => '<p><strong>Ready?</strong> Book a call this week.</p>',
    );

    // 2. Synchronous island template (serialized block markup).
    $commands[] = array(
        'id'       => 'my-plugin/callout',
        'label'    => 'Callout',
        'icon'     => 'block',
        'ns'       => 'my-plugin',
        'block'    => 'my-plugin/callout',  // island chip name; defaults to core/group
        'template' => '<!-- wp:my-plugin/callout -->…<!-- /wp:my-plugin/callout -->',
    );

    // 3. Async route: Minimal POSTs/GETs and inserts the response.
    $commands[] = array(
        'id'     => 'my-plugin/latest',
        'label'  => 'Latest announcement',
        'icon'   => 'file',
        'ns'     => 'my-plugin',
        'route'  => 'my-plugin/v1/minimal-command/latest',
        'method' => 'POST',                 // GET or POST; default POST
        'body'   => array( 'tone' => 'short' ), // optional JSON body (scalars only)
    );
    return $commands;
} );
```

必须提供 `html`、`template` 或 `route` 中的**恰好一个**。一个都没有或
超过一个的会被丢弃。键：

| 键 | 必需 | 备注 |
|---|---|---|
| `id` | yes | 稳定 slug（`a-z0-9_-/`） |
| `label` | yes | 斜杠菜单／选择器标题 |
| `html` *或* `template` *或* `route` | 一个 | 插入形状 |
| `block` | with `template` | 岛屿区块名称（默认 `core/group`） |
| `method` | with `route` | `GET` 或 `POST`（默认 `POST`） |
| `body` | with `route` | 用于 POST 的标量值浅层映射 |
| `icon` | no | Minimal 已提供的 Lucide 键，或短字形 |
| `ns` | no | 命名空间徽章 + 选择器分组（`{Ns} · commands`） |
| `keywords` | no | 额外搜索词（斜杠菜单和选择器） |
| `searchOnly` | no | 为 true 时，在查询匹配前隐藏（保持 `/` 精选） |

路由响应必须是以下形式之一：

- `{ "html": "<p>…</p>" }` — 作为正文插入（与静态 `html` 命令使用相同路径）
- `{ "template": "<!-- wp:… -->…", "block": "my-plugin/x" }` — 作为岛插入

为路由提供一个 `permission_callback`（`edit_posts` 与编辑器保持一致）。该命令
列表会随启动载荷提供，中途会通过 `editor-blocks` 重新轮询（插件切换
无需硬刷新即可更新它）。

## 编辑器面板 — 编辑器侧边栏中的每篇文章字段

对于数据位于*文章内部*的插件（自定义字段、SEO 元数据），请注册一个 **editor
面板**，而不是表面。理念相同：声明式描述符，由 Minimal 渲染。
你的面板是编辑器侧边栏中的一行安静入口（标签、徽章、一行摘要），它
打开一个包含你字段的模态框：

![The editor sidebar door stack, ending with a plugin panel door: Custom fields · ACF, 4 fields · 1 advanced](img/editor-side-doors.png)

![The opened panel: text, select, toggle and textarea fields plus the advanced-fields count with its wp-admin escape](img/editor-panel.png)

```php
add_filter( 'minimal_admin_editor_panels', function ( $panels ) {
    $panels['my-fields'] = array(
        'label'       => 'My fields',
        'sub'         => 'My Plugin',
        'cap'         => 'edit_posts',
        // Returns { groups: [ { group, fields: [ {name,label,type,choices,min,max} ], locked } ] }
        // for the post being edited. {id} = post ID (0 for new), {type} = REST base.
        'fieldsRoute' => 'my-plugin/v1/fields?post_id={id}&post_type={type}',
        'valuesKey'   => 'myplugin',   // key on the wp/v2 post response holding current values
        'writeKey'    => 'myplugin',   // key Minimal writes changed values back under on save
    );
    return $panels;
} );
```

支持的字段类型：`text`、`textarea`、`number`、`range`、`email`、`url`、`select`、`radio`、
`true_false`、`suggest`。其他内容请计入 `locked` 数量；Minimal 显示「有 N 项高级
字段——编辑 wp-admin ↗"，而不是渲染不安全的内容。值会沿用正常的
文章保存（包括自动保存），因此你的插件只需确保其值可在
文章 REST 响应（`register_rest_field`，或对于 ACF，字段组的「Show in REST API」
切换开关）。

**`suggest`（自 0.18.0 起）**是一个用于关联记录的异步搜索选择器，其选项
列表对于 `select` 来说过于庞大或实时性过高（场馆、组织者、相关文章）。字段
声明一个 `route`；Minimal 会在用户输入时使用 `&q=` 获取它，并期望一个普通数组，其中
`{ value, label }`行（Minimal 会在前面添加自己的「— None」清除行）。该字段的当前
你的 `valuesKey` 负载中的值为 `{ value, label }`（无值时为 `''`），并且相同的
保存时会返回该结构，因此请从 `value` 读取 ID。内置的 Events Calendar 适配器的
场地选择器是参考实现。

随附的 ACF 适配器（`includes/adapters/acf.php`）是参考实现。

### 状态面板 — 文章级状态和操作（自 0.25.0 起）

某些文章级功能根本不是字段：它们报告状态并提供操作动词（发送此
将文章发布为新闻通讯、从 CDN 清除此页面、分享到社交平台）。对于这些操作，请注册
面板，并使用 `statusRoute` 而不是字段键。入口会显示你的摘要行，并且
打开后会渲染你的状态行和操作按钮；Minimal 提供全部 UI。

```php
add_filter( 'minimal_admin_editor_panels', function ( $panels ) {
    $panels['newsletter'] = array(
        'label'       => 'Newsletter',
        'sub'         => 'My Plugin',
        'cap'         => 'manage_options',
        // GET; {id} = post ID, {type} = REST base. Only fetched for saved posts.
        'statusRoute' => 'my-plugin/v1/newsletter/{id}',
    );
    return $panels;
} );
```

状态路由返回面板显示的所有内容：

```json
{
    "summary": "Not sent · 57 subscribers",
    "tone":    "amber",
    "note":    "Optional paragraph shown above the rows.",
    "rows":    [ { "label": "Status", "value": "Not sent", "tone": "amber", "hint": "…" } ],
    "actions": [
        { "label": "Send preview to me", "route": "my-plugin/v1/newsletter/123/send",
          "body": { "send_to": "preview" }, "hint": "Sends to you@example.com" },
        { "label": "Send to all subscribers (57)", "route": "…", "body": { "send_to": "all" },
          "confirm": "This sends immediately to all subscribers.", "danger": true },
        { "label": "Send to email", "route": "…", "body": { "send_to": "custom" },
          "fields": [ { "key": "email", "label": "Email address", "type": "email" } ] },
        { "label": "Open in wp-admin", "href": "…" }
    ]
}
```

`summary`是门的一行状态；`tone`（`green` / `amber` / `red`）为其着色。操作
路由是你在服务端构建的字符串（自行嵌入文章 ID），通过 POST 发送，并使用
操作的 `body`。带有 `confirm` 的操作会经过 Minimal 的主题化确认对话框
（`danger` 将其设为红色）；带有 `fields` 的操作会将其按钮替换为内联表单，并
将收集到的值合并到正文中（字段词汇与创建表单相同）。
`href` 操作会改为渲染为链接。操作响应可以携带
`{ "message": "…", "status": { … } }`：`message` 会替换默认 Toast，而返回的
`status`在同一往返中重新绘制面板和门（否则 Minimal 会重新获取
你的状态路由）。未保存的文章不会渲染面板，因为没有可报告的文章
尚未启用。面板分为字段面板或状态面板；`statusRoute` 会使这三个
字段键是可选的。

完整的真实世界实现（状态构建器、操作端点、发布门控
在危险动词上），请参阅
[CaptainCore Manager](https://github.com/CaptainCore/captaincore-manager/blob/master/captaincore.php)
（搜索 `captaincore_newsletter_panel_status`）。整个集成都位于该
插件；Minimal 不提供任何相关内容。

## 流量提供商 — 为概览图表提供数据

分析插件可以通过响应以下内容，将 Overview 的「Activity」图表替换为真实流量
`minimal_admin_traffic`筛选器。返回请求范围内每天的访客数/页面浏览量，以及
上一周期的访客总数（用于访客统计卡片中的增量）：

```php
add_filter( 'minimal_admin_traffic', function ( $traffic, $days ) {
    if ( null !== $traffic ) {
        return $traffic; // another provider already answered
    }
    return array(
        'source'        => 'My Analytics',
        'days'          => array( // 'Y-m-d' => counts, covering the last $days days
            '2026-07-02' => array( 'visitors' => 120, 'pageviews' => 310 ),
            '2026-07-03' => array( 'visitors' => 141, 'pageviews' => 355 ),
        ),
        'prev_visitors' => 2210,  // visitor total for the $days before that
    );
}, 10, 2 );
```

Minimal 会将天数分桶以匹配所选范围（最多 45 天按日，超过则按周），并渲染
流量图表以你的插件名称作为来源徽章，并使用以下内容引导统计卡片：
访客数及同比变化。随附适配器涵盖**Koko Analytics**（
参考实现）、**WP Statistics**、**Burst Statistics** 和 **Independent
分析**。由第一个活动提供者响应，因此注册自有适配器的插件
当 `$traffic` 已经为非 null 时应提前返回。

### 每日下钻 — 图表条对应的热门页面

点击流量条会打开一个模态框，显示热门页面（以及可选的引荐来源）
针对该栏的日期范围。提供程序会回答第二个过滤器：

```php
add_filter( 'minimal_admin_traffic_day', function ( $data, $from, $to ) {
    if ( null !== $data ) {
        return $data; // another provider already answered
    }
    // $from / $to are inclusive Y-m-d calendar dates for the bar (one day
    // on the 7/30d chart; up to a week on 90d).
    return array(
        'source'    => 'My Analytics',
        'pages'     => array(
            array(
                'title'     => 'Homepage',
                'path'      => '/',
                'url'       => home_url( '/' ),
                'postId'    => 0,      // optional; >0 when the hit maps to a post
                'visitors'  => 120,
                'pageviews' => 310,
            ),
        ),
        'referrers' => array(  // optional
            array( 'label' => 'google.com', 'visitors' => 40, 'pageviews' => 55 ),
        ),
        'adminUrl'  => admin_url( 'admin.php?page=my-analytics' ), // optional footer link
    );
}, 10, 3 );
```

当没有页面分解信息时，返回 `null`（或保持 `$data` 不变），用于
窗口；模态框显示空状态，并且在设置了 `adminUrl` 时仍提供它。
内置的日适配器：**Koko Analytics**（`post_stats` + `paths` + 引荐来源
表格），**WP Statistics**（用于点击量的 `statistics_pages` +
`statistics_visitor.referred`用于引荐来源；WPS 不提供按 URI 统计的独立访客数，因此
两列都会报告命中总数）、**Burst Statistics**（`burst_statistics`
page_url/page_id + `burst_sessions.referrer`），以及 **Independent Analytics**
（浏览量 × 资源数 + 会话引荐者）。与 相同的首个非空规则
`minimal_admin_traffic`.

## 媒体文件夹 — 为 Media 视图的文件夹筛选器提供数据

如果你的插件将媒体库整理到文件夹中，请回答
`minimal_admin_media_folders`筛选器，Minimal 的媒体视图会获得一个文件夹
由你的数据提供的组合框。浏览优先：Minimal 会收窄其常规媒体查询
添加到你的文件夹附件 ID 中，因此搜索、类型选项卡和分页都会
继续工作，而 Minimal 永远不会建立自己的文件夹树。第一个非空
提供商优先（规则与 `minimal_admin_traffic` 相同）。

```php
add_filter( 'minimal_admin_media_folders', function ( $provider ) {
    if ( null !== $provider || ! defined( 'MY_FOLDERS_VERSION' ) ) {
        return $provider; // someone else answered, or we're not active
    }
    return array(
        'name'    => 'My Folders',      // named in the combobox tooltip
        'folders' => function () {
            // Flat list; parent 0 = root (Minimal indents children for you).
            // id 0 is reserved: an optional "Uncategorized" row for files in
            // no folder, never treated as a parent. count is optional.
            return array(
                array( 'id' => 12, 'label' => 'Logos', 'parent' => 0, 'count' => 8 ),
                array( 'id' => 13, 'label' => 'Dark',  'parent' => 12, 'count' => 3 ),
            );
        },
        'ids'     => function ( $folder_id ) {
            // The folder's attachment ids (any order), or a WP_Error for a
            // folder this user may not browse. Minimal re-orders newest-first
            // and caps at 500 before querying.
            return my_folders_attachment_ids( $folder_id );
        },
        'move'    => function ( $folder_id, array $attachment_ids ) {
            // Optional. When present, the media bulk bar gains a folder
            // picker and a Move button. Put the attachments in the folder
            // through your own machinery (0 = remove from every folder);
            // true or WP_Error. Callers hold upload_files; run your own
            // finer checks here. Omit it and Minimal shows no Move control.
            return my_folders_move( $folder_id, $attachment_ids );
        },
    );
} );
```

两个可调用对象都会以浏览用户的身份在服务器端运行（最低需要 `edit_posts`），因此
每用户文件夹模式只需读取你自己的作用域状态即可运行。内置的
`includes/adapters/media-folders.php` 中的提供商（FileBird、Real Media
Library、Folders by Premio）是参考实现；复制你需要的存储结构
与你的一致（自定义表、API 或普通分类法）。自 0.18.0 起。

## 缓存清理器 — 加入「清除站点缓存」

Minimal 的 ⌘K 调色板包含「清除站点缓存」命令，可清除检测到的每个缓存
层，每个提供程序一个请求。缓存和优化插件通过以下方式注册清理器
`minimal_admin_cache_purgers` 筛选器：

```php
add_filter( 'minimal_admin_cache_purgers', function ( $purgers ) {
    $purgers[] = array(
        'id'    => 'my-cache',   // stable slug
        'name'  => 'My Cache',   // shown in the palette entry and the result toast
        'purge' => function () {
            my_cache_flush_everything();
        },
    );
    return $purgers;
} );
```

该命令仅向拥有 `manage_options` 的用户公开，并且你的 `purge` 回调
会在该请求中于服务器端运行；对于常见情况，无需额外的能力检查
情况下。`includes/adapters/cache-purge.php` 中的内置提供商包括 LiteSpeed、
WP Rocket、W3 Total Cache、SpeedyCache、Redis Object Cache、Breeze、Nginx Helper、
Cloudflare 等；任意复制其中一个。

## 日志来源 — System 的日志查看器

系统页面的调试工具卡片会列出网站日志（WordPress 调试日志、PHP
错误日志（如果它是独立文件），以及每个 WooCommerce 日志频道一个源），每个
打开全屏尾部查看器，并提供源选择器。保留自有日志的插件
或者，了解 Web 服务器日志位置的主 mu-plugin，可以注册一个源
通过 `minimal_admin_log_sources` 过滤器。自 0.19.0 起。

```php
add_filter( 'minimal_admin_log_sources', function ( $sources ) {
    $sources['my-plugin'] = array(
        'label' => 'My Plugin log',
        'group' => 'My Plugin',      // shown as "My Plugin · My Plugin log"
        'stat'  => function () {     // cheap: powers lists, never reads content
            $path = my_plugin_log_path();
            return array(
                'exists'   => file_exists( $path ),
                'size'     => file_exists( $path ) ? filesize( $path ) : 0,
                'modified' => file_exists( $path ) ? filemtime( $path ) : 0,
            );
        },
        'read'  => function () {     // the tail payload
            return Minimal_Admin_Logs::tail_file( my_plugin_log_path() );
        },
        'clear' => function () {     // optional; omit for read-only sources
            return my_plugin_truncate_log() ? true
                : new WP_Error( 'clear_failed', 'Could not clear the log.' );
        },
    );
    return $sources;
} );
```

源 ID 可使用字母、数字、`:`、`_`、`.` 和 `-`。`Minimal_Admin_Logs::tail_file()`
提供最后 256 KB，并丢弃开头不完整的行；一个 `read`，它会构建自己的
有效载荷应返回相同的结构（`exists`、`path`、`size`、`size_human`、
`truncated`、`content`，可选的 `note`）。查看器仅支持 `manage_options`。Minimal 从不
猜测 Web 服务器日志路径：它们取决于主机，通常位于
`open_basedir`，因此注册它们有意留给控制主机的一方。

## 垃圾邮件提供商 — 设置 → 垃圾邮件

垃圾邮件过滤插件会在 Minimal 的**设置 → 垃圾邮件**页面显示一张卡片：已配置状态、
累计阻止数、通过你自己的选项结构写入的几个安全开关，以及
链接到完整的 wp-admin 页面。通过 `minimal_admin_spam_providers` 过滤器注册：

```php
add_filter( 'minimal_admin_spam_providers', function ( $providers ) {
    if ( ! defined( 'MY_SPAM_PLUGIN_VERSION' ) ) {
        return $providers; // register only while your plugin is active
    }
    $providers[] = array(
        'id'     => 'my-spam',
        'name'   => 'My Spam Filter',
        'status' => function () {
            return array(
                'configured' => (bool) get_option( 'my_spam_key' ),
                'note'       => 'One-line status shown under the name',
                'blocked'    => (int) get_option( 'my_spam_blocked_total', 0 ),
                'toggles'    => array(
                    array(
                        'id'    => 'notify',
                        'label' => 'Email me about new spam',
                        'desc'  => 'What the switch does, in one sentence.',
                        'on'    => (bool) get_option( 'my_spam_notify' ),
                    ),
                ),
                'adminUrl'   => admin_url( 'options-general.php?page=my-spam' ),
            );
        },
        'set'    => function ( $toggle_id, $on ) {
            if ( 'notify' === $toggle_id ) {
                update_option( 'my_spam_notify', $on ? 1 : 0 );
            }
        },
    );
    return $providers;
} );
```

切换项通过 `minimal-admin/v1/spam` 保存（受 `manage_options` 限制）；`set` 运行
在服务器端使用切换开关 ID 和新的布尔值。切换开关保持为两个或三个
网站所有者实际会切换的选项；深层配置应归属于你自己的页面，
卡片链接到的页面。捆绑的提供商（Akismet、Antispam Bee、CleanTalk）位于
`includes/adapters/spam.php`以及相关引用。

**可选：在原位置粘贴密钥。** 如果你的筛选器需要 API 密钥，同时你还
注册许可提供商（下一节），使用一个 `activate` 可调用对象，返回其
将提供商 ID 从 `status()` 作为 `keyProvider`。然后卡片会渲染一个键字段，其中
文章使用 `minimal-admin/v1/licenses/action`，因此相同的防护规则仍然适用：键会随
一个请求，由你的代码验证并存储，Minimal 永远不会保留。
当键由代码（常量或过滤器）提供，或由系统管理时，请省略 `keyProvider`
云端。Akismet 是参考：其卡片字段和 Licenses 行会驱动
相同的提供程序。

## 许可证状态 — `minimal_admin_license_providers`

Extensions 包含一个 **Licenses** 卡片：每个付费组件和
网站上已连接的服务及其状态（有效 / 已过期 / 无效 /
缺失/未知），仅从已存储的选项中读取。读取操作不会调用许可
API；如果你的插件是商业插件（或持有服务密钥或账户
连接），提供商会在网站所有者已经
看起来如此。提供程序上可选的 `category` 键（`license` — 默认值 —
`key` 或 `connection`）会设置行上的小标签；使用 `key` 表示服务
凭据（例如 Akismet 的凭据）以及用于账户或网站链接的 `connection`：

```php
add_filter( 'minimal_admin_license_providers', function ( $providers ) {
    $providers['my-plugin'] = array(
        'name'   => 'My Plugin Pro',
        'detect' => function () {
            return defined( 'MY_PLUGIN_VERSION' ); // installed, even if inactive
        },
        'read'   => function () {
            $status = get_option( 'my_plugin_license_status' );
            return array( array(
                'name'    => 'My Plugin Pro',
                'kind'    => 'plugin',           // or 'theme'
                'state'   => $status ? $status : 'missing',
                'key'     => (bool) get_option( 'my_plugin_license_key' ),
                'expires' => '2027-01-01',       // or 'lifetime' or ''
                'note'    => '',                 // optional one-line detail
                'stale'   => false,              // true when your cached status lapsed
            ) );
        },
    );
    return $providers;
} );
```

`read`可能返回多行（每个产品一行），并在 Throwable 保护中运行，
这样损坏的提供程序会退出，而不会破坏卡片。严格保持 `read`
本地：只读取选项，不发送 HTTP。状态会汇总到 Licenses 健康检查中（已过期
或无效则失败，缺失或未知则发出警告），以及复制为 Markdown 的报告。
内置读取器包括通用 Freemius 和 EDD Software Licensing 支持，
位于 `includes/adapters/licenses.php` 中；端点是
`GET minimal-admin/v1/licenses`（受 `manage_options` 限制）。

### 操作：激活、停用、重新验证（可选）

提供者还可以声明 `secret_label` 以及三个操作可调用对象中的任意一个，并且
卡片会扩展出匹配的控件（粘贴以激活字段、带有「停用」的
确认、重新验证）：

```php
'secret_label' => 'My Plugin license key',
'activate'     => function ( $secret ) {
    $res = my_plugin_activate_license( $secret ); // YOUR activation code
    return array(
        'ok'      => $res->ok,
        'code'    => $res->seats_exhausted ? 'site_limit' : ( $res->ok ? '' : 'invalid' ),
        'message' => $res->message,
    );
},
'deactivate'   => function () { /* your deactivation */ return array( 'ok' => true ); },
'verify'       => function () { /* re-check stored credentials */ return array( 'ok' => true ); },
```

这些规则确保安全，由 Minimal 调用你的方式强制执行，也是你的
可调用对象：操作仅在你插件自身的代码已加载时运行（将它们附加
有条件地执行，完全类似内置的 Elementor Pro 适配器），粘贴的密钥
通过一个请求完成，Minimal 永远不会存储、记录或回显它；失败的
激活不会自动重试（重试可能会消耗付费座席），并且
`site_limit`是一等结果代码，这样座席问题会被明确指出，而不是
被隐藏在通用错误中。操作会通过
`POST minimal-admin/v1/licenses/action`（`{provider, action, secret?}`，受限于
`manage_options`）；返回的 `WP_Error` 或抛出的异常会以纯文本形式显示
错误结果。执行任何操作后，最新分类会通过相同的
响应，因此卡片会根据你存储的状态重新绘制。

如果激活通过你自己的门户或 OAuth 风格的握手完成（没有
对于粘贴的密钥可调用的路径），声明 `activate_url`（URL 字符串或
返回 URL 的可调用对象），而不是 `activate`：未授权的行随后会携带一个
「Activate ↗」链接可跳转到你的界面。捆绑的 WPBakery 条目是参考实现。

如果激活需要多个凭据，请声明 `secret_fields` 和
`activate`接收按 ID 键控的数组，而不是字符串（每个字段
必需）；卡片会为每个密钥渲染一个带标签的字段。内置的 Divi
适配器（Elegant Themes 用户名 + API 密钥）是参考实现：

```php
'secret_fields' => array(
    array( 'id' => 'username', 'label' => 'Account username' ),
    array( 'id' => 'api_key', 'label' => 'API key' ),
),
'activate'      => function ( $secrets ) { /* $secrets['username'], $secrets['api_key'] */ },
```

## 评论检测 — `minimal_admin_comments_enabled`

当评论功能实际上处于禁用状态时，Minimal 会隐藏 Comments 视图、调色板命令和徽章
关闭（没有文章类型支持评论，也不存在评论）。管理评论的插件可以
覆盖检测：

```php
add_filter( 'minimal_admin_comments_enabled', function ( $enabled, $types ) {
    // $types = post types that still support comments.
    return false; // force-hide (or true to force-show)
}, 10, 2 );
```

## 网站可见性 — `minimal_admin_visibility_providers`

当你的插件隐藏网站时（维护模式、即将上线页面或整个网站
密码），告知 Minimal，这样所有者会看到持久显示的「站点已隐藏」标记，概览
横幅和 System health check，而不是疑惑流量去了哪里。只有
仅在模式实际为 ACTIVE 时注册（该筛选器会在每次 Minimal 页面加载时运行）：

```php
add_filter( 'minimal_admin_visibility_providers', function ( $providers ) {
    if ( my_plugin_maintenance_is_on() ) {
        $providers[] = array(
            'name'    => 'My Maintenance Mode',
            'id'      => 'my-plugin',   // optional: pairs the row with a toggle writer (below)
            'kind'    => 'maintenance', // or 'coming-soon' | 'password'
            'note'    => 'Visitors see the holding page',          // optional
            'url'     => admin_url( 'admin.php?page=my-settings' ), // where to turn it off
            'partial' => false, // true when only SOME pages are covered
                                // (WooCommerce's store-pages-only shape) —
                                // Minimal then says "part of the site" instead
                                // of claiming the whole site is dark
        );
    }
    return $providers;
} );
```

希望所有者能够直接从中关闭你的模式（并通过撤销重新开启）吗
Minimal 的横幅、芯片弹出框和 Settings → Visibility？请在以下位置注册一个切换写入器
相同的 `id`。Minimal 只会通过插件注册的写入器切换模式；
没有提供商的则保持诚实，链接到 `url`。

```php
add_filter( 'minimal_admin_visibility_toggles', function ( $toggles ) {
    // Register whenever your plugin is loaded (not only while the mode is on):
    // an Undo must be able to re-arm a mode that is currently off.
    $toggles['my-plugin'] = array(
        'set' => function ( $on, $ctx ) {
            // $ctx['kind'] is the mode that was on before Minimal turned it off
            // ('maintenance' | 'coming-soon' | 'password') — use it to restore
            // the right mode if your plugin has more than one.
            my_plugin_set_maintenance( $on );
        },
    );
    return $toggles;
} );
```

切换端点（`POST minimal-admin/v1/visibility/toggle`）要求 `manage_options`。
内置检测器涵盖 Maintenance（WebFactory）、SeedProd、Under Construction，
LightStart（WP Maintenance Mode）、CMP Coming Soon & Maintenance、Minimal Coming Soon、
Password Protected、WooCommerce coming soon 和 Elementor maintenance mode — 均配有
通过每个插件自己的存储来切换写入器。

## 没有 REST API？提供一个垫片

如果你的数据位于自定义表中，请注册一个小型的只读 REST 集合，并将
描述符。Minimal 内置的 Gravity SMTP 适配器
（`includes/adapters/gravity-smtp.php`）是参考实现：约 60 行 SQL 到 REST 的
以及一个描述符。使用规则：在 `permission_callback` 中检查功能权限，使用
`$wpdb->prepare`，绝不存储 `unserialize()` 二进制块（使用正则表达式提取所需内容或
`json_decode`).

## 备注

- 所有请求都使用当前登录用户的 Cookie + `X-WP-Nonce`，并且与你现有的
  REST 权限检查仍可正常工作。
- 无需自行转义任何内容；Minimal 会转义它渲染的每个值。
- 内置适配器位于 `includes/adapters/` 中，并由 `class_exists`/`defined` 保护
  检查；欢迎提交为广泛使用的插件添加适配器的 PR。优先发布
  适配器**位于你的插件内部**，当你拥有该产品时；Minimal 仅为插件捆绑
  永远不会了解它。
