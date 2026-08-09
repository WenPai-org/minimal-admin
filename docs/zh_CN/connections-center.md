# 连接中心 — 审计与指引

撰写于 2026-08-06 的 v0.24.0 周期，源自 Austin 的提示：
许可证管理器可能会发展为许可证/连接器中心。这个
本文档审计 Minimal 当前接触端点的每个界面。套件：spam-settings + license-vendors 扩展、伪造密钥
外部服务凭据或连接，以及后来偏离的分阶段计划
补充。配套文档：`license-manager.md`（许可证提供者和
防护栏）、`plugin-support.md` Waves E/F（类别清单
已将 WooCommerce.com 连接作为首要缺失项呈现）。

## 审计：目前存在五个接触点，而不是三个

提示假定有三个（许可证密钥、垃圾邮件许可证、AI 连接器）。
扫描发现五个，分别采用四种不同的处理模型。那
这种分散正是建立中心的实际理由。

| # | 界面 | 其中内容 | 处理模型 |
|---|---|---|---|
| 1 | **Extensions → Licenses**（`adapters/licenses.php`，约 40 个提供者） | 购买许可证（Elementor Pro、ACF PRO、GF、TEC……），但也包括已经超出该名称范围的连接行：Envato Market 账户令牌、WPMU DEV 的 Hub 连接（停用操作实际上是 `logout`）、MyYoast 门户链接、WP Rocket 的嵌入式凭据、Divi 的用户名 + API 密钥对 | `minimal-admin/v1/licenses/action`：粘贴一次，Minimal 永不存储，不自动重试，site_limit 一等公民化，无状态供应商的检查记忆 |
| 2 | **Settings → Comments，SPAM cards**（`adapters/spam.php`） | Akismet API 密钥（掩码显示 `715e…`，当前只读）、CleanTalk 云密钥（按设计只读）、Antispam Bee 和 WP Armour（无密钥） | 仅显示 + 深层链接；不可编辑 |
| 3 | **Settings → Connectors**（WP 7.0 `wp_get_connectors()` 注册表） | AI 提供者及其他注册核心连接器的内容，包含 `authentication.setting_name` | 核心自身的模型：密钥来源解析器 env → 常量 → 数据库，通过核心 `wp/v2/settings` 保存，核心会掩码响应并实时验证 AI 密钥；为伴随插件提供安装/激活控件 |
| 4 | **Email surface settings**（邮件系列） | Gravity SMTP 映射真实凭据字段，使用掩码密钥哨兵和常量锁（密钥编辑已在此处发布）；FluentSMTP 刻意排除凭据（其连接列表为只读，"凭据保留在 FluentSMTP 中"） | 通过插件自身的清理器写入的供应商设置映射器 |
| 5 | **Backups → Disembark status card** | 站点令牌，按需获取，用于可复制的 `disembark connect` 命令（绝不随页面加载获取），以及重新生成令牌操作 | 上下文界面上的令牌生命周期 |

相邻但尚未作为可管理状态呈现：Site Kit 的 Google
连接和 Jetpack 的 WPCOM 博客令牌（两者均由
流量提供者），以及 WooCommerce.com 辅助连接（未接入；
许可证供应商系列清单中的首要项目）。

## 审计结论

1. **许可证卡片已经是一个尚未
   承认了这一点。**其中四行不是许可证。更名和分组
   这是如实反映，而不是新增范围。
2. **不要统一写入路径。**四种处理模型各自
   根据其真实来源（供应商许可证 API、核心连接器
   注册表、插件设置清理器、令牌生命周期）。缺少的是
   是一个 INVENTORY：单一视图回答"哪些外部服务与
   此站点连接哪些服务、以谁的身份连接，以及每项是否健康。"
3. **保留上下文界面，并继续驱动相同的端点。**垃圾邮件卡片
   应当在原地编辑 Akismet 密钥；中心显示相同的行。
   中心 = 审计视图，上下文卡片 = 在此修复视图。Gravity SMTP
   设置映射器和 Disembark 卡片已经证明了这一模式。

## 分阶段计划

**砖块 1 — Akismet（S）。已于 2026-08-06 发布**（与本文档同日；
通过两个入口针对实时 akismet.com 验证的伪造密钥；垃圾邮件
提供者契约新增可选的 `keyProvider` 状态键，已在文档中说明
在 for-plugin-authors.md 中）。按范围：Akismet 作为提供者加入 `licenses.php`：
从 `wordpress_api_key` + `akismet_alert_code`/`akismet_alert_msg` 读取
（其提醒系统是本地有效性信号），遵循
`Akismet::predefined_api_key()`（WPCOM_API_KEY 常量和
`akismet_get_api_key` 过滤器渲染只读行），操作通过其
自己的代码：`Akismet_Admin::save_key()`（验证 + 订阅检查 + 存储，
遵循完整流程；管理类由 is_admin()/WP_CLI 控制，因此 REST
需要手动完成，采用 WPForms 模式）和 `Akismet::deactivate_key()`
+ 选项清理（沿用其自身的断开连接先例）。垃圾邮件卡片增加一个
粘贴/更改密钥控件，提交到相同的 `licenses/action`
外部服务凭据或连接，以及后来偏离的分阶段计划
针对其实时 API。

**砖块 2 — 重新定义（M）。已于 2026-08-06 发布。**实施说明：
分类字段是 `category`（`kind` 已被
条目形态的插件/主题轴）；分组仍采用 STATE-FIRST，以便分诊
（Needs attention → Valid → Not set up），每行芯片携带
类别，而不是优先按类型分组；核心连接器仅在
已配置或其伴随插件处于激活状态（未安装的目录
保持在外部），按设计从健康摘要中排除，而卡片
页脚是进入 Settings → Connectors 的入口。健康检查行
携带服务端 `goto`。
命名决定（Austin，2026-08-06，同日）：标签页保持朴素
**「Licenses」**——复合名称「Licenses & connections」已恢复。它
打破了 Plugins/Themes 标签页行的一词节奏，使计数
这一行读起来别扭，掩盖了旗舰许可证管理器的肌肉记忆
这个词，并与核心自身的"Connectors"词汇发生冲突，一个页脚
移除。重新定义本身成立：标签、"未设置"分组，以及
带有按类别区分的标签（连接读取为"已连接" / "未
连接"，密钥读取为"无密钥"）在卡片内部携带分类。
不要重新提议更名。
按最初范围：Provider contract 增加
`kind: license | key | connection`；标签页更名（工作名称
「Licenses & connections」）；行按类型分组；现有
形似连接的行（Envato、WPMU DEV、MyYoast）重新分类。营销
文案、用户指南，以及站点的 Licenses 类别卡片将在下一次
发布。核心连接器（接触点 3）以只读行形式出现，链接
进入 Settings → Connectors；该部分目前仍保留在 Settings 中
（刚刚针对 WP 7.0 注册表发布；纳入它属于单独的
决定）。

**砖块 3 — 站点连接（M–L）。已于 2026-08-06 发布。** WooCommerce.com
辅助连接状态（"以 X 身份连接，N 个订阅"，来自
`woocommerce_helper_data` 身份验证 + `_woocommerce_helper_subscriptions`
临时的、它们自己的 `is_site_connected()` 规则），Site Kit
（存在 `googlesitekit_credentials`，绝不解码，+
`googlesitekit_has_connected_admins`；半连接读取 `unknown`）以及
Jetpack（`jetpack_private_options` blog_token + `jetpack_options`
id/master_user，仅表示存在）作为只读连接提供者。一个
未连接的 ACTIVE 行提供 **Connect ↗**，进入供应商自己的界面
（href 标签会根据类别变化）；关闭状态的行只提供 Turn on，因为
已停用插件的连接界面不存在。健康状态：这些行
沿用正常摘要，因此半连接的 Site Kit 会像任何
未知许可证。OAuth 流程和断开连接仍由供应商
界面，按范围执行。

## 非目标

- 一种通用写入路径（见上文；以供应商自己的机制为准）。
- 在 Minimal 侧存储任何密钥（沿用 license-manager.md 中的防护栏）。
- 重建 OAuth 流程（Site Kit、Jetpack、WooCommerce.com 连接
  仪式保留在各自界面；Minimal 显示状态并提供链接）。
- 将邮件凭据编辑移出 Email 界面（它位于
  该功能按设计所在的位置）。
