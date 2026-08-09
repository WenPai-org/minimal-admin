# 许可证管理器——先关注可见性，再进行激活

一个真实的 WordPress 站点运行着多个商业插件，而它们每一个
单独处理其许可证：自己的 wp-admin 页面、自己的提示横幅、自己的
对「活跃」含义的理解。由此产生两个不同的问题：

1. **零可见性。** 站点上没有任何内容可以回答「我的哪些付费插件
   现在有有效许可证吗？」过期密钥通常意味着会静默
   错过更新（包括安全版本），直到出现故障。
2. **激活寻宝。** 设置一个站点意味着要访问五个
   不同的设置页面来粘贴五个密钥。

WordPress 中从未存在真正的跨供应商许可证管理器。它
没有共享的许可证 API；每个供应商都自行设计存储方式、密钥格式、
激活调用和状态语义。这正是它有价值的原因，而且
为什么必须谨慎构建它。

2026-07-10 的研究轮次（已根据本地实验室的真实
付费插件）改变了计划：**现在可以构建可见性，但只能只读，
零风险**，同时激活仍然是每个供应商项目中需要谨慎处理的部分
本文早期草稿中所述的顺序。按此顺序发布。

## Phase 0——许可证状态仪表板（只读）——已于 2026-07-10 发布

已在 `includes/adapters/licenses.php` 中实现：Licenses 卡片位于
System 页面、Licenses 健康检查、`GET minimal-admin/v1/licenses`、
`minimal_admin_license_providers` 过滤器（记录于 for-plugin-authors.md）
以及 Integrations 卡片归属。使用真实许可证验证：WP Rocket
（有效，真实的到期日期），ACF PRO 和 Blocksy Companion Pro（有效，
生命周期），Perfmatters 通过通用 EDD 读取器，以及全部七个付费
构建器在实验室中能够正确枚举。一个实现事实是
研究遗漏之处：Freemius 密钥按其产品 slug 记录 `sites`，而不是按插件
目录（`blocksy-companion-pro/` 注册为 `blocksy-companion`）；
`fs_accounts` 中存储的 `file_slug_map` 连接了插件文件 → 产品
slug。下面的设计记录了构建内容及其原因。

一个枚举站点上所有需要许可证的组件并
将每项分类为 **有效 / 过期 / 无效 / 缺失 / 未知**，依据
仅限本地存储的状态。不发起网络调用，不执行供应商代码，不
写入。它无法消耗激活席位，因为它从未激活任何内容。

### 为什么可行：存储环境（已通过源代码验证）

两个通用 SDK 以一个
每个适配器：

- **Freemius**——检测方式：插件/主题带有一个 `freemius/` 目录。
  所有状态都存储在一个选项 `fs_accounts` 中：每个 slug 的安装对象携带
  `license_id`/`plan_id`，而 `all_licenses` 保存包含许可证实体的
  绝对 `expiration` 日期时间。有效/过期/缺失完全可计算
  离线，并且由于到期时间是绝对日期，分类会保持
  即使 Freemius 自己的同步已过时也能正确运行。行为最规范的供应商
  全部。
- **EDD Software Licensing 客户**——检测方式：插件捆绑了
  `EDD_SL_Plugin_Updater` 类（文件名各不相同；类名是
  信号）。存储方式是常规的，并非固定格式：`{prefix}_license_key` +
  `{prefix}_license_status` 选项对（已验证：perfmatters、BNFW、
  Breakdance）。*状态词汇*由 EDD 服务器标准化：
  `valid`、`invalid`、`expired`、`disabled`、`site_inactive`。分类
  通过为 key/status 选项匹配前缀对来工作；没有可读 status 的 key
  是 `unknown`。

主要的单一供应商，每个都有一个小型专用读取器（均已在源代码中验证）：

| 供应商 | 状态 + 到期时间存储 | 只读判定 |
|---|---|---|
| Elementor Pro | `elementor_pro_license_key` + `_elementor_pro_license_v2_data`（12h 缓存；包含 `expired`/`site_inactive`/`disabled` 和 `expires`，或 `lifetime`） | 完整分类 + 到期时间 |
| ACF Pro | `acf_pro_license` + `acf_pro_license_status`（状态 + 到期数组） | 完整分类 + 到期时间 |
| WP Rocket | 密钥位于 `wp_rocket_settings`；无效标志位于 `wp_rocket_no_licence`；到期时间位于 1 天的 `wp_rocket_customer_data` transient 中 | 缓存预热时完整；始终提供密钥 + 无效标志 |
| Astra / Brainstorm Force | `brainstrom_products`（原文如此）、每个产品的 `purchase_key` + `status === 'registered'`（涵盖 Astra Pro、UAE、Spectra Pro） | 完整分类 |
| Kadence（StellarWP Uplink） | 每个插件的 `stellarwp_uplink_license_key_{slug}` + status 选项 | 完整分类 |
| Bricks | `bricks_license_key` + `bricks_license_status` transient（7d TTL） | 缓存有效期间的状态，否则为 unknown-stale |
| Beaver Builder | `fl_themes_subscription_email` + `fl_get_subscription_info` transient（`active`、`expiration`） | 缓存有效期间的状态 |
| Divi / Elegant Themes | `et_automatic_updates_options`（用户名 + API key）+ `et_account_status` | 状态字符串，无到期时间 |
| Admin Columns / Advanced Ads / WP All Import | EDD 风格的 key+status 选项（每个产品名称不同） | 完整分类 |
| WPBakery | 仅 `wpb_js_js_composer_purchase_code`；永远不存储状态（永久授权模型） | 仅检查存在性 |
| Brizy Pro | Brizy 项目文章上的 postmeta `brizy-license-key`，而非 wp_options | 仅存在性 |
| Etch / SureCart licensing SDK | `{name}_license_options` + activation-id 选项；SDK 共享，因此这也是一个小型通用适配器 | 已激活/缺失，无到期时间 |
| Gravity Forms | `rg_gforms_key` 存储经过 md5 哈希的密钥 | 仅存在性 |

### 检测器设计

两层，均严格只读（读取原始 option/postmeta；绝不调用
供应商类，从未访问网络）：

**第 1 层——枚举（「谁需要许可证？」）。** 廉价、可缓存的信号
每个已安装的插件/主题：嵌入式 SDK 指纹（`freemius/` 目录，
`EDD_SL_Plugin_Updater` 字符串、SureCart licensing 目录、`bsf-core/`、Uplink），
已知供应商 slug 注册表，以及更新源启发式规则（位于
`update_plugins`/`update_themes` 临时数据，其软件包 URL 不是
wordpress.org，plugin-meta 端点已经从中读取反向
目的）。任何匹配项都会成为一行，即使无法分类。

**第 2 层——分类。** 厂商适配器声明选项/元数据位置，一个
状态映射、过期字段和供应商的缓存 TTL；两个 SDK 适配器
（Freemius、EDD）以通用方式覆盖其整个产品系列。每个组件的输出：

- `valid` — 存储的状态如此表示，且在诚实范围内
- `expired` — 存储的状态或绝对过期日期已在过去
- `invalid` — 已停用、site_inactive、disabled、密钥/域名不匹配
- `missing` — 组件需要许可证，但未存储密钥（最醒目的一行）
- `unknown` — 密钥存在，但状态不可读，或已超过供应商的 TTL

每个已分类行都带有一个「截至」时间戳，该时间戳源自供应商的
自己的缓存/检查时间。**存储的状态是上次验证时的事实，而不是实时事实**；
界面必须显示「截至 3 天前有效」，绝不能假装实时。

### 诚实的限制

- WPBakery、Gravity Forms、Brizy 和 Etch 的上限是已激活/缺失。
- Bricks、Beaver Builder 和 Divi 会在其瞬态过期后失去状态；
  这些行会变为未知-过期，并显示最后已知值及其存在时长。
- 预计会有相当一部分长尾项目处于「密钥存在，状态未知」状态。
  这仍然有用：它证明密钥存在，并标明插件名称。
- WooCommerce.com 订阅和 Envato 购买代码插件完全使用
  不同模型；未经验证，已延期。
- 续期或远程停用在厂商自己的
  再次运行检查。阶段 2 处理此问题；阶段 0 不处理。

### 所在位置

从 **System 页面上的 Licenses 卡片**开始（带状态标签的行，
页面已有的相同健康检查语言）以及一项健康检查
（「2 个许可证已过期，1 个缺失」）以及 Extensions 卡片上的许可证徽章。
当 Phase 1 增加操作后，再升级到专用界面。通知摘要
已经捕获了供应商自己的提示横幅；此处的行应链接到
相同的激活深层链接也会被摘要提取。

该升级已经完成：自 v0.12.0（2026-07-12）起，管理器以
第三个 Extensions 选项卡（Plugins / Themes / Licenses），位于
它所描述的组件。System 页面保留许可证健康检查。

## Phase 1——激活（第 1 波已于 2026-07-10 发布）

已作为粘贴密钥激活发布到 Licenses 卡片中，同时加入了锁定问题
通过不构建一个来解决：**绝不保留任何密钥。** 粘贴的秘密
通过一次请求调用供应商自身的激活代码，并且从不存储，
记录或回显。供应商契约新增了三个可选的可调用方法
（`activate( $secret )`、`deactivate()`、`verify()`；记录于
for-plugin-authors.md），仅在供应商代码已加载时附加，因此
卡片绝不会绘制无法工作的控件。结果统一为
`{ ok, code, message }`，其中 `site_limit` 是一等公民，并且不会重试。

第 1 波供应商：**Elementor Pro**（通过以下路径激活/停用/重新验证
`API::activate_license` + `Admin::set_license_key` + `API::set_license_data`,
镜像其自身的 ajax 处理程序；`no_activations_left` 映射到 `site_limit`），
**ACF PRO**（通过 `acf_pro_activate_license` / 激活/停用
`acf_pro_deactivate_license`、静默模式），以及 **WP Rocket**（仅重新验证
通过 `rocket_check_key()`：其凭据包含在供应商的 zip 中，因此
没有要粘贴的密钥；这也交付了 Phase 2 的第一个切片）。
该基础设施已通过真实 Elementor API 验证，并使用了一个刻意伪造的
密钥（干净的 `invalid` 已显示，不写入任何内容，不重试）；真实密钥
激活过程是所有者手动执行的步骤，与自更新器相同
候选版本测试。

**第 2 波（2026-07-10 发布，同日）：** Beaver Builder（激活 +
通过 `FLUpdater::save_subscription_license` / 重新验证
`get_subscription_info`；不存在安全的停用方式，因此不提供），
Brizy Pro（通过其单例激活 + 停用；其异常情况携带
供应商消息）、Etch（通过其 SureCart 包装器激活 + 停用
单例，以及一个用于其 `etch_license_key` / 的专用读取器
`etch_license_status` 通用 SureCart 扫描遗漏的选项），以及
当 Bricks 是活动主题时（通过公开的激活 + 重新验证
静态密钥和非 Ajax 的 `activate_license()` 路径，该路径只会在以下情况下持久化
真实状态响应；其停用处理程序始终执行 nonce 检查，
因此停用仍停留在 Bricks 页面上）。契约还新增了
`activate_url` 对于没有可调用路径的门户握手供应商：WPBakery
现在每行带有指向其自身激活页面的「激活 ↗」链接，而不是
一个无法工作的粘贴字段。四个可调用供应商均已
使用伪造密钥针对其在线 API 验证了管线（干净的供应商
已显示消息，且没有遗留状态）。

**第 3 波（2026-07-10 发布，同日）：Divi**，第一个多密钥
提供商。契约新增了 `secret_fields`（每个凭据对应 id + label；
`activate` 接收一个以 id 为键的数组）；Divi 使用 Elegant Themes
用户名 + API 密钥，将其写入站点选项，并清除其
`et_update_themes` 缓存，并运行核心主题更新检查，因此它们的
已挂接的检查器会验证并写入 `et_account_status`。一次失败的尝试
会恢复之前存储的凭据（比 Divi 自身的设置更友好
页面，会覆盖它们）。已在一次性 Divi 实验环境中使用伪造
凭据。Divi 没有按站点分配的席位，因此停用只会清除
存储的凭据。

INACTIVE 组件的行会保留其只读许可证状态（存储
选项无需供应商代码），但会以灰显方式呈现，因此活动主题门控
会被视为预期行为，而不是缺少按钮。自 2026-07-10 起
（v0.11.0）变暗的行还带有 **Turn on** 控件：当
组件文件确实存在，并且用户持有 `activate_plugins` /
`switch_themes`，该行会提供「开启插件」/「开启主题」（位于其后
确认后，供应商代码加载，许可证控件显示在
位置。由于 v0.20.0 起该激活通过 admin-ajax 执行（一个真实的管理员
上下文），以便供应商激活钩子能够正常假设 wp-admin 环境。已通过
tests/license-turnon.test.js。

**第 4 波（2026-07-10 发布）：Gravity 系列。** Gravity Forms 读取
来自 `gform_version_info` 的有效性 + 过期时间，并通过
`GFFormsModel::save_key()`（其完整流程，包括自身的
拒绝时恢复）；Gravity SMTP 通过其容器的
许可证连接器，然后通过其自身的数据存储进行保存。两者均已验证
使用伪造密钥对 Gravity 的实时 API 进行测试。

**第 5 波（2026-07-10 发布）：按产品规模排名的未覆盖尾部。** 十一个
新读取器，并根据从以下位置获取的真实构建进行源代码验证
CaptainCore 快速保存归档，并已安装但在主测试站点上处于停用状态：

- **WPMU DEV**（`wpmudev`）：一个 Hub API 密钥（站点选项 `wpmudev_apikey`
  或 `WPMUDEV_APIKEY` 常量）即可解锁该系列。会员状态
  从 Hub 缓存的 `wdp_un_membership_data`（`full`/`unit`/ 读取
  `single`/`free` = 有效，`paused` = 无效，`expired`、空值/数字
  已处理）。激活会镜像它们自己的身份验证端点，但去掉重定向：
  `set_key()` 然后强制执行 `hub_sync()`；无效或过期的密钥会导致
  返回一个空的 `membership`（其自身的同步会在
  该情况）。停用为 `logout( false )`。通过 wp-config 固定
  常量意味着没有粘贴字段（下次启动时 `set_key` 会被覆盖）。
- **Smush Pro**（`smush-pro`）：使用 Dashboard 密钥，但保留其自己的
  24 小时有效性缓存 `wp_smush_api_auth`（每个密钥的 `{validity，
  timestamp}` 映射）。只读；没有可独立粘贴的密钥。
- **SearchWP**（`searchwp`）：一个选项 `searchwp_license`
  `{key,status,expires,type}`。其 EDD 更新器被重命名为
  （`SearchWP\Updater`），因此通用文件名扫描永远无法指纹识别
  通过 `\SearchWP\License` 激活/停用/验证。
- **Gravity Perks**（`gravityperks`）：`gwp_settings` SITE 中的密钥
  选项）；有效性缓存在带版本后缀的 12 小时站点临时数据中
  `gwp_license_data_{version}`。不是 EDD 更新器插件（自定义 `GWAPI`）。
  通过 `GWPerks`/`GravityPerks` 激活/停用/验证。
- **Rank Math Pro**（`rank-math-pro`）：读取免费插件的
  `rank_math_connect_data`（`username`/`api_key`/`plan`）。注册
  一个由免费插件拥有的 rankmath.com 门户握手，因此该控件
  是从 `activate_url` 到 `admin.php?page=rank-math&view=registration` 的
- **Perfmatters**（`perfmatters`）：纯 `perfmatters_edd_license_*`
  选项对（多站点中的站点选项）。不同构建版本对它们是否
  交付 SL 更新器文件，因此需要一个专用读取器（该读取器声称
  组件并取代通用扫描）是可靠的覆盖方式。
  通过 `\Perfmatters\License` 激活/停用/验证。
- **GP Premium**（`gp-premium`）：其选项名称会破坏通用扫描
  假设（`gen_premium_` 前缀与 `gp-premium` slug，以及状态
  选项是 `..._license_key_status`），因此会获得专门的读取器。
  激活通过其专用 REST 路由（`/generatepress-pro/v1/license/`）驱动
  通过 `rest_do_request`；空密钥 = 停用，`***` = 重新验证。
- **WP All Import Pro / WP All Export Pro**（`wp-all-import` /
  `wp-all-export`）：序列化的 `PMXI_Plugin_Options` 中的所有内容
  （以类为键的 `licenses`/`statuses` 映射）/ `PMXE_Plugin_Options`（扁平
  `license`/`license_status`）；密钥经过盐值包装。导出会激活
  通过其 `LicenseActivator`（先按其自身方式存储密钥）。
  Import 的控制器完全没有公开可调用接口，因此其完整循环
  （激活/停用/验证，已于 2026-07-11 从原始版本升级
  验证加链接方案）会逐字镜像其由 `$_POST` 驱动的 EDD 请求
  逐字节比对插件自身存储的端点；verify 会解码
  先存储经 salt 封装的密钥（其自身的静态 `check_license` 会将其发送
  仍经过封装，并始终返回无效）。Soflyy 许可证没有
  按站点分配的席位（已于 2026-07-11 通过在线服务证明），因此要在两个插件中都停用
  是真正的本地密钥移除。
- **Slider Revolution**（`revslider`）：扁平的 `revslider-code` +
  `revslider-valid`（字符串 `'true'`/`'false'`）；激活/停用
  通过 `RevSliderLicense`（`'exist'` = 站点限制结果）。
- **LayerSlider**（`layerslider`）：`layerslider-purchase-code` +
  `layerslider-authorized-site`（1/0）。其更新器公开了
  `handleActivation( $code, ['skipRefererCheck'=>true,'returnData'=>true] )`
  这是其自身的重新验证路径；verify 会复用该路径，并使用已存储的
  代码。其停用处理程序在请求期间 `die()`s，因此释放席位
  仍停留在其页面上。
- **Avada**（`avada`，主题）：`fusion_registration_data['avada']` 携带
  购买代码和严格的 `is_valid` 标志；一个代码覆盖
  捆绑的 Avada 插件。存储路径与 nonce/WP-CLI 绑定，因此只能只读。
- **Envato Market**（`envato-market`）：账户 OAuth 令牌
  仅存在（Envato 不记录本地有效性 → `unknown`），以及任何
  每项一次性令牌，其中确实携带 `authorized` 成功/失败
  标志；已购买项目数量使用插件自己的每小时临时数据，当
  保持温热。令牌输入是与 nonce 绑定的 Settings API 页面，因此
  「Activate ↗」链接。
- **The Events Calendar 系列**（自 2026-07-11 起的专用提供商，
  已使用真实密钥验证）：PUE 将密钥存储在
  `pue_install_key_{slug with underscores}` 以及记录在其中的状态
  `pue_key_status_{dashed slug}_{domain}`（以及一个 `_timeout` 兄弟项和
  一个 md5 临时数据）。通过每个供应商完成完整的激活/停用/验证
  插件自身的 `Tribe__PUE__Checker`（使用插件精确构造的
  参数；`validate_key()` 是其完整流程，并仅
  接受时）。注意：带有 Uplink 资源的产品（Event
  Tickets Plus）会让 `validate_key` 读取 RESOURCE 密钥，而不是
  参数，因此激活会先植入资源，并在
  从 TEC 账户下载的构建版本可以嵌入密钥
  （Uplink KeyFactory helper）；检查器会从其中重新填充该选项，因此
  这些项目的本地停用是临时的，消息也会如此说明。
- **Kadence Blocks Pro**（自 2026-07-11 起的专用提供商，已验证
  （使用真实密钥）：免费 kadence-blocks 下的 StellarWP Uplink
  供应商命名空间，slug 为 `kadence-blocks-pro`；购买者的密钥随
  在插件构建中（`includes/uplink/Helper.php` DATA 常量，
  WP Rocket 模式），其中上行选项会覆盖文件
  密钥。激活会存储，然后通过 `validate_license()` 进行
  拒绝时恢复快照；停用操作镜像其自身的 Clear
  按钮（内置密钥仍作为回退）。
- **其他 StellarWP Uplink / PUE 产品**（`stellarwp`，
  注册表式兜底）：PUE 仅检查存在性，按状态分类
  用于 Uplink；跳过专门供应商声明的 slug。

其中每一项的读取分类均已通过
tests/license-vendors.test.js（21 项检查：为每种真实选项形态设置种子，
断言状态标签，然后清除选项（普通选项不会
可通过 Settings API 删除，因此因崩溃中止的运行不会留下虚假的许可证
位于其后）。

激活基础设施已于 2026-07-10 通过向以下对象发送伪造密钥完成验证
通过真实操作端点，针对在线服务逐一调用每个可调用供应商
供应商 API 激活（与前几轮使用的相同伪造密钥测试）。每一个
返回了一个干净的 `{ok:false, code:'invalid'}`，并带有可读的供应商
消息，并且没有留下密钥：SearchWP、Perfmatters、Gravity Perks、
GP Premium、LayerSlider、WP All Export 和 WPMU DEV 均分类回
`missing` 在密钥被拒绝后。该轮产生了三项修复：GP
Premium 的 REST 路由注册时没有尾随斜杠（一个 `/license/`
请求返回 404）；Perfmatters、WP All Export 和 Gravity Perks 存储
在验证前粘贴密钥（它们自己的激活流程会从
选项），因此现在每次失败都会先快照并恢复之前的密钥
而不是保留被拒绝的密钥；GP Premium 的路由（其中
最后无条件写入密钥）也会执行相同的恢复。Slider
Revolution 被降级为「Activate ↗」链接：其
`activate_plugin()` 与仅限管理员的类（RevSliderTracking，
仅在管理端注册于 RevSliderGlobals 中的负载均衡器
init）不会在 REST 请求中加载，而复现该启动顺序
是供应商内部逻辑猜测，而防护措施禁止这样做。（逆向
2026-07-11：来自 `RS_PLUGIN_PATH` 的两个 `include_once` 调用准确加载
这些类置于 REST 下，无需猜测启动顺序，因此完整的
激活/停用/验证循环已交付，并使用真实密钥通过测试；
参见下方的测试表格。）
通用 EDD/Freemius 验证现在对长尾项目已无关紧要：
审计发现，仅按文件名识别的 EDD 指纹会遗漏重命名的更新器
插件（SearchWP、Soflyy），而选项对扫描会漏掉 GP Premium 的
命名，因此专门读取器可以覆盖全部项目；Perfmatters 可能属于任一类
按构建版本处理，并由其专用读取器优先，以避免重复行。

## 下一批候选项，按实际舰队影响排名（2026-07-10）

在 CaptainCore 舰队的 2,790 个生产站点上进行测量（
管理器数据库清单，依据 wp.org 进行分类；完整来源路径见
2026-07-10 会话记录）。已覆盖集合位居产品规模排行榜首位：
Gravity Forms 2,543 个站点，Gravity SMTP 1,440 个，Elementor Pro 1,191 个，ACF PRO
1,001，WP Rocket 286，Divi 259，WPBakery 129+，Beaver Builder 43+，Bricks
32. 未覆盖的长尾项目；第 5 波（2026-07-10）交付了第 1-4 项以及第 5-6 项的大部分内容：

1. ~~**WPMU DEV**~~ 已交付（Dashboard + Smush Pro）：488 + 425 个站点。
2. ~~**Envato Market**~~ 已交付（令牌/购买代码）：459 个站点。The
   适配器读取账户令牌和每项令牌；Avada、Slider
   Revolution 和 LayerSlider 也各自获得了专用读取器（它们的
   代码独立存储，不依赖 Envato Market 插件）。
3. ~~**StellarWP / The Events Calendar**~~ 已交付并升级为 FULL
   激活（2026-07-11，使用真实密钥验证：错误密钥 → 干净
   无效，真实密钥 → 有效并带有到期时间，停用）：116 个站点。
   Kadence Blocks Pro 于同一天发布，并完成相同验证。
4. ~~**Gravity Wiz / Gravity Perks**~~ 已交付（约 103 个站点）：与 GF 配套。
5. ~~**Rank Math Pro**~~ 已交付（92），~~**SearchWP**~~ 已交付（87），
   ~~**Soflyy WP All Import/Export Pro**~~ 已交付（81+），~~**Smash Balloon**~~
   已发布（2026-07-15：Instagram Feed 的完整激活/停用/验证
   Pro、Custom Facebook Feed Pro、YouTube Feed Pro、Custom Twitter Feeds Pro，
   Social Wall、Reviews Feed Pro、TikTok Feeds Pro、Feed Analytics Pro，通过
   EDD（位于 smashballoon.com）；「All Plugins」多产品密钥会激活每个
   拥有自己的 EDD item_name 的产品；真实密钥测试 2026-07-15），~~**Yoast
   Premium**~~ 已发布（2026-07-15：MyYoast 门户读取器 + Activate ↗，用于
   `wpseo_licenses` + 验证会刷新 site_information；不粘贴密钥，
   Rank Math 的形态；需要免费的 wordpress-seo），~~**Admin Columns Pro**~~
   已发布（2026-07-19，v0.20.0：使用真实密钥完成完整循环；无头
   容器引导，已处理密钥到令牌的交换；140 个站点）。
6. **低成本收益**：~~Perfmatters~~（142）和 ~~GP Premium~~ 都获得了
   本轮没有专门的读取器（通用扫描不会覆盖它们：
   已重命名且选项名称不标准）。~~Search & Filter Pro~~ 已交付
   （2026-07-19，v0.20.0：通过他们自己的 REST 使用真实密钥完成完整闭环
   控制器可调用对象）。供应商代码仍未提供：Unlimited
   Elements、Stackable Premium、Permalink Manager Pro（验证
   Freemius/EDD 扫描会将这些项目点亮）。

剩余的按舰队排名的开放工作：长尾 Freemius/EDD 验证
上面的列表。

### 供应商系列清单（2026-08-06，未测量）

按类别列出尚无许可证覆盖的付费插件清单，
按供应商系列分组，因为机制是共享的：第一个
系列中的产品都包含协议研究，其余项目成本较低
后续项（TEC / Smash Balloon 模式）。安装量和站点群数量
尚未针对这些项目进行测量；重新运行 2026-07-10 Manager DB
在确定顺序前，对照此列表检查库存。

| 家族 | 产品 | 备注 |
|---|---|---|
| **Awesome Motive** | ~~WPForms Pro~~（已于 2026-08-06 交付，已验证伪造密钥；参见已测试表）、AIOSEO Pro、MonsterInsights Pro、WP Mail SMTP Pro、Duplicator Pro、SeedProd Pro、OptinMonster、PushEngage | 最高优先级。WPForms Pro 证明了该家族协议：通过供应商 API 使用 tgm-updater 的 verify-key/deactivate-key/validate-key 三元组，密钥位于一个选项中，状态由标志表示。兄弟产品应遵循相同结构（每个产品分别 verify；选项名称不同）。WP Mail SMTP Pro 还带来额外收益：其许可证解锁真正的 `wpmailsmtp_emails_log` 表，将该适配器从调试事件升级为真正的邮件日志。Smash Balloon 和 SearchWP（均属于 AM）已经交付。 |
| **WooCommerce.com helper** | 所有官方 Woo 扩展（WC Subscriptions 是固定项） | `WC_Helper` 连接状态 + 订阅列表，只读 + Activate ↗。这可能是代理站点和商店站点最有价值的单个许可证行。 |
| **SolidWP / iThemes updater** | Solid Security Pro、Solid Backups、Solid Central | 旧版 `ithemes-updater` 软件包是独立协议，任何通用扫描都无法覆盖；免费的 Solid Security 界面适配器已经存在。 |
| **StellarWP beyond TEC** | LearnDash、GiveWP Pro、Restrict Content Pro、IconicWP | 基于 Uplink；Uplink 通用读取器可能已经部分覆盖它们。先进行验证（quicksave 中存在 GiveWP Pro 压缩包）。 |
| **WPManageNinja** | Fluent Forms Pro、FluentCRM Pro、FluentBooking、Fluent Support | FluentSMTP 和 Fluent Forms 免费版已经接入；共享同一供应商方案。 |
| **Delicious Brains / WP Engine** | WP Migrate、WP Offload Media、WP Offload SES | 三个产品，一个供应商。WP Offload SES 还有一份可归入邮件家族的邮件日志。 |
| **Crocoblock** | JetEngine + Jet* 套件 | 面向约 20 个 Elementor 生态插件的一份许可证。 |
| **OTGS / multilingual** | WPML、Polylang Pro、TranslatePress | 界面在结构上已停放（语言维度），但许可证行不需要这些。WPML 运行在大量客户站点上。 |
| **Elementor addon packs** | Essential Addons Pro、Premium Addons Pro、ElementsKit、The Plus | 界面有意隔离；许可证仍可读取。Unlimited Elements、Stackable Premium 和 Permalink Manager Pro 已在上面的开放列表中。 |
| **Odds and ends** | MemberPress、Meta Box AIO、WCPDF Pro（WP Overnight）、WP Grid Builder、Smart Slider 3 Pro、WP Staging Pro、Barn2、YITH | Meta Box 和 WCPDF 已有界面适配器，因此其许可证行很容易补齐。YITH 是类似 Crocoblock 的独立多产品方案。 |

同一清单中发现的类别级界面缺口（流量
提供商、构建器检测、状态提供商、新类别）均位于
`docs/plugin-support.md` Waves E 和 F。

测试构建源自 CaptainCore 快速保存仓库
（`captaincore quicksave archive` 从一个
快照，而不触碰状态）。

这些承重护栏，其中有一项诚实的修订：

- **永远不要重新实现厂商的激活 HTTP 调用。** 应通过以下方式路由
  插件自身的方法。已测量到两个例外情况，即供应商
  完全没有可调用入口：WP All Import 和 Smash Balloon 系列，
  其 EDD 请求与供应商自身的请求逐字节镜像
  控制器代码（`minimal_admin_soflyy_edd`、`minimal_admin_smash_edd`；参数
  从其源代码读取，绝不臆造）。如果供应商既没有
  既不可调用，也没有可镜像的协议，因此只能深层链接，不提供适配器。
- **「Site limit reached」 是一项一等结果。** 永远不要自动重试失败的
  激活；重试可能消耗付费席位。
- **粘贴即可激活，永不保留。** 不提供密钥存储器，除非
  确实有需求时；如果将来出现，则默认选择加入，并在静态存储时加密。
- **仅 manage_options。**

## Phase 2——按需刷新（很大程度上已随 Phase 1 交付）

Phase-1 合约中的 `verify` 可调用项就是：每行一个「重新验证」
会触发供应商自身的重新验证。其覆盖范围远超
首个计划：几乎每个可调用供应商都带有一个，包括
最需要关注的基于 transient 的供应商（Bricks、Beaver Builder 和
Divi 均通过各自的重新验证路径再次验证），以及 Elementor
Pro、WP Rocket、Gravity Forms、Gravity SMTP、WPMU DEV、SearchWP、Search &
Filter Pro、Admin Columns Pro、Gravity Perks、Perfmatters、GP Premium，
WP All Import/Export、Slider Revolution、LayerSlider、Kadence Blocks Pro，
TEC 系列、Smash Balloon 系列以及 Yoast SEO Premium 的 MyYoast
刷新。仍未验证的有：ACF PRO、Brizy Pro 和 Etch（激活并
停用已接入，但没有可安全独立调用的重新验证入口
已确定），以及门户链接和只读行。Minimal 也
会记住其自身按供应商记录的检查结果（状态词 + 时间戳，
从不保存密钥），并使用这些信息将供应商的「未知」行升级为
不存储本地有效性，并以「截至」时间保持诚实。

## 已测试且确认正常工作

验证标准分为三个级别。**真实密钥**意味着完整循环
使用真实许可证对线上供应商服务运行：使用
错误密钥（干净拒绝，不写入任何内容），使用真实密钥激活（有效
供应商到期信息的标签），然后停用。**伪造密钥**
意味着通过刻意设计的方式，已针对在线服务验证了管线
仅无效密钥（干净地拒绝，不写入任何内容）；真实密钥测试是
所有者的步骤。**读取**意味着读取器已针对真实存储的内容完成验证
实验站点上的许可证数据。

| 产品 | 操作 | 已验证 | 日期 | 备注 |
|---|---|---|---|---|
| Slider Revolution | activate / deactivate / verify | 真实密钥，完整流程，包括真实 ThemePunch 注销 | 2026-07-11 | 激活也是解除其更新器锁定的条件 |
| The Events Calendar Pro | 激活 / 停用 / 验证 | 真实密钥 | 2026-07-11 | PUE；仅本地停用（在 theeventscalendar.com 管理域名） |
| Event Tickets Plus | activate / deactivate / verify | 真实密钥 | 2026-07-11 | 密钥随账户构建版本嵌入，并会自行重新注册 |
| TEC Filter Bar | activate / deactivate / verify | 真实密钥 | 2026-07-11 | PUE |
| TEC Community | activate / deactivate / verify | 真实密钥 | 2026-07-11 | PUE |
| Kadence Blocks Pro | activate / deactivate / verify | 真实密钥 | 2026-07-11 | 密钥随构建版本嵌入；deactivate 会镜像其 Clear |
| Gravity SMTP | activate / deactivate / verify | 真实密钥（站点所有者在实时站点上运行） | 2026-07-10 | check-memory 会提升 unknown 状态 |
| Elementor Pro | activate / deactivate / verify | 伪造密钥 | 2026-07-10 | 读取器也已通过真实许可证验证 |
| ACF PRO | activate / deactivate | 伪造密钥 | 2026-07-10 | 已通过真实永久许可证验证读取器；尚未接入安全的 verify 路径 |
| WP Rocket | 仅验证 | 真实许可证（缓存实验室） | 2026-07-10 | 凭据随供应商 zip 提供；按设计不粘贴 |
| Gravity Forms | activate / deactivate / verify | 伪造密钥 | 2026-07-10 | save_key 在遭拒后会自行还原 |
| Beaver Builder、Brizy Pro、Etch、Bricks、Divi | 每个供应商分别处理（见第 1 阶段） | 伪造密钥 / 实验室 | 2026-07-10 | Divi 已在一次性实验室环境中验证 |
| WP All Export Pro | 激活 / 停用 / 验证 | 真实密钥，完整流程 | 2026-07-11 | 永久授权，无限激活；停用为本地操作（不存在席位） |
| WP All Import Pro | 激活 / 停用 / 验证 | 真实密钥，完整流程 | 2026-07-11 | 同上；存储的密钥经过盐值包装，任何请求前都必须解码 |
| Search & Filter Pro | activate / deactivate / verify | 真实密钥，完整流程 | 2026-07-19 | EDD（条目 526297）通过其自有 REST 控制器可调用对象；状态位于免费基础版的 `{prefix}search_filter_options` 表中，JSON 行为 `license-data`；操作需要基础版 + Pro 均处于激活状态；快照恢复可防止被拒密钥覆盖有效激活（其自身的 connect() 会这样做） |
| Admin Columns Pro | activate / deactivate / verify | 真实密钥，完整流程 | 2026-07-19 | 通过 admincolumns.com 上由 DI-container 服务提供的自有 API；主文件受 is_admin() 限制，因此 Minimal 以无头方式引导容器（autoloaders + api.php + 其六个 definition 文件，不使用 Loader）；激活会删除粘贴的密钥，并存储激活令牌（`acp_activation_key`）+ `acp_subscription_details` {status active/cancelled/expired, expiry_date ts, null = lifetime}；完全按照其处理程序应用权限规则 |
| WPMU DEV、SearchWP、Gravity Perks、Perfmatters、GP Premium | 激活 / 停用 / 验证 | 虚假密钥 | 2026-07-10 | 已针对植入的真实结构验证读取器 |
| LayerSlider | activate / verify | 伪造密钥 | 2026-07-10 | 没有 deactivate：其处理程序会在请求中途 die()，席位释放仍需在其界面中完成 |
| Rank Math Pro、Envato、WPBakery | Activate ↗ 链接 | read | 2026-07-10 | 受门户或管理上下文限制的激活 |
| Yoast SEO Premium | Activate ↗ + 验证 | 读取（在 MyYoast 之前为缺失） | 2026-07-15 | 免费 Yoast `WPSEO_Addon_Manager`；页面 `wpseo_licenses`；不粘贴密钥 |
| Smash Balloon 家族（8 个产品） | activate / deactivate / verify | 真实 All Plugins 密钥 | 2026-07-15 | smashballoon.com 上的 EDD；按 item_name 区分多产品密钥 |
| WPForms Pro | 激活 / 停用 / 验证 | 虚假密钥（实时 wpforms.com 拒绝，不写入任何内容，且绝不回显密钥） | 2026-08-06 | 选项 `wpforms_license` {key, type, is_* flags}；其停用操作会将其重置为 ''（字符串）；WPFORMS_LICENSE_KEY 常量优先并阻止 Minimal 停用；class-license.php 受管理员/cron/CLI 门控，因此操作需要手动执行；首个 Awesome Motive 家族供应商 |
| Akismet | activate / deactivate / verify | 伪造密钥（实时 akismet.com 拒绝，未写入任何内容；也通过垃圾邮件卡片粘贴字段驱动） | 2026-08-06 | 服务密钥，第一个连接中心行；`Akismet_Admin::save_key()` 是完整的 activate（verify + 订阅检查 + 存储）；admin 类在 REST 下手动 require；alert 选项是本地有效性信号；predefined_api_key（常量/过滤器）以只读方式呈现 |
| WooCommerce.com、Site Kit、Jetpack 连接 | 读取 + Connect ↗ 外链 | 读取（minimaladmin 上的实时状态：WC 未连接 → 缺失，Site Kit 半连接 → 未知，Jetpack 关闭） | 2026-08-06 | connections-center brick 3；仅检查存在性，绝不解码令牌；按设计不提供操作（OAuth 保留在供应商页面） |
| Freemius / EDD / SureCart 通用项、Avada、Smush Pro、AnalyticsWP、BSF 家族 | read | 实验室中的真实已存储数据 | 2026-07-10 | 参见上面的验证图 |
| StellarWP Uplink / PUE 通用项 | read | 真实已存储数据（TEC 六件套） | 2026-07-11 | 注册表读取器；跳过已由专用提供商声明的 slug |

当供应商通过真实密钥验证或新增提供商时，保持此表为最新。
上线；扩展运行手册位于 /dev-minimal-admin skill 中。

## Minimal 在这里永远不会做什么

拥有自己的许可证状态，静默保持插件激活，续订或追加销售，管理
跨站点共享席位，或在未选择加入的情况下存储秘密。Minimal 只显示状态，并且
在供应商提供安全路径时转发密钥。计费边界情况仍
供应商的产品。

## 状态

Phase 0 于 2026-07-10 发布（可见性：Licenses 卡片、健康检查、
SDK 通用读取器）。Phase 1 的第 1-5 波于同一天发布：文档化的
提供商操作契约中，按设计不使用 locker，并为
Elementor Pro、ACF PRO、WP Rocket、Gravity Forms、Gravity SMTP、Beaver
Builder、Brizy Pro、Etch、Bricks、Divi 以及按舰队排名的长尾项目（WPMU DEV，
Smush Pro、SearchWP、Gravity Perks、Rank Math Pro、Perfmatters、GP Premium，
WP All Import/Export Pro、Slider Revolution、LayerSlider、Avada、Envato
Market、The Events Calendar 系列 + StellarWP Uplink、Smash Balloon 系列，
Yoast SEO Premium MyYoast）。Search & Filter Pro 和 Admin Columns Pro 加入了
2026-07-19（v0.20.0），两者都完成了真实密钥的完整闭环。

截至 v0.24.0、2026-08-06：WPForms Pro 于 2026-08-06 加入（
第一个 Awesome Motive 系列供应商；伪造密钥已验证，真实密钥测试为
所有者的步骤）。在此之前，自 v0.20.0 起没有新增供应商。管理器位于 Extensions → Licenses（已从 System
v0.12.0 中的卡片；System 保留健康检查），将非活动组件
每行带有「启用」控件，v0.21.0 加固了卡片，使其
后台重建不再能在粘贴过程中消耗密钥。剩余部分：一个
对于仍处于以下状态的项目，由所有者通过真实密钥 / 门户激活
伪造密钥级别；如果其
如果代码曾公开安全方式，三个无供应商代码候选项
（Unlimited Elements、Stackable Premium、Permalink Manager Pro）正在等待
通用扫描检查，然后是 Freemius/EDD 的长尾验证列表。
