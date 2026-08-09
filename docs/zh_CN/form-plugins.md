# 表单插件——Forms 家族地图

最初是 2026-07-09 的来源调研（「哪些表单插件值得纳入 Forms
家族成员？」）。在 v0.13.0 周期内于 2026-07-12 完成过时检查：
家族已由**八个**提供商上线，适配器阶梯已在以下方面得到验证
Gravity Forms（条目 → 通知 → 表单设置），以及其余
工作只剩少量遗留项，加上一个大品牌（WPForms Pro），它需要一个
用于 Fixture 的许可证。

**今天：** `family: 'forms'`，带提供商切换器。刻意**不**
表单构建器：深层链接到各插件的编辑器，以创建／编辑
表单文档。未来「80% 表单编辑器」的范围和边界
干净的文档位于 `docs/native-editors.md`（暂存）。

## 覆盖范围（已交付）

| 插件 | 适配器 | Minimal 提供的功能 |
|---|---|---|
| **Gravity Forms** | `gravity-forms.php` | 条目作为联系人卡片显示，支持 Received/Spam/Trash、星标／已读、备注、重新发送、批量操作；**Forms** 管理视图（激活／停用）；**Notifications** 视图（切换 + 每日字段编辑）；**Form settings**（请求时从 GF 的 Settings-framework 架构获取项目级设置）。完整工作流深度支持。 |
| **Fluent Forms** | `fluent-forms.php` | 条目列表 + 带标签的详情；Received/Spam/Trash 筛选器；搜索；打开即标记为已读；移至回收站／永久删除；表单管理视图。套件 `fluent-forms`（24）。基于 `fluentform_submissions`（+ 表单字段标签）进行规范化。 |
| **Everest Forms** | `everest-forms.php` | 通过 EVF_Admin_Entries 管理包含 Received/Spam/Trash 状态的条目；表单标签页；搜索；表单管理。套件 `everest-forms`。 |
| **Elementor Pro Forms** | `elementor-forms.php` | 通过 Elementor 自有 Query 类处理提交；通过 `move_to_trash_submission` 软删除。免费版 Elementor 没有提交存储。 |
| **Contact Form 7 + Flamingo** | `cf7-flamingo.php` | 通过 Flamingo 自有模型处理收到的消息（垃圾邮件／取消垃圾邮件／移至回收站）；在管理界面中显示 CF7 表单及实时频道计数。CF7 单独不存储任何内容。 |
| **CFDB7** | `cfdb7.php` | 来自 `{prefix}db7_forms` 的条目（通过字节长度标记扫描的序列化映射，绝不反序列化）；打开即标记为已读；永久删除。 |
| **Ninja Forms** | `ninja-forms.php` | 条目作为 `nf_sub` postmeta 卡片显示，包含表单标签页和带标签的详情，通过自身模型移至回收站，表单管理中显示实时条目计数。 |
| **Forminator** | `forminator.php` | 条目来自 Forminator 自有模型，运行时解析标签，通过 `Forminator_API::delete_entry` 永久删除，支持表单管理。遵循 `forminator-entries` 权限模型。 |
| **Formidable** | `formidable.php` | 通过 `FrmEntry` 获取条目，运行时从字段模型获取标签，使用 UTC 时间戳，通过 `FrmEntry::destroy` 永久删除，权限上限镜像细粒度权限或管理员权限。 |

该家族位于 Workspace 下。提供商偏好键：`minimal-sf-forms`。

## 全景图遗留项（尚未适配）

| 插件 | 免费安装量（约） | 仍待处理的原因 | 适配度 |
|---|---|---|---|
| **WPForms Pro** | 5M+ Lite brand | Lite **不**存储本地条目（仅支持电子邮件／Lite Connect）。Pro 使用 `wpforms_entries` + 元数据／字段。自 1.9.9 起的 Abilities API 不适合集合描述符；使用 SQL／内部 shim 更简洁。**需要 Pro 许可证 + Fixture。** | 尚未覆盖且价值最高的品牌；需要购买许可证。 |
| **SureForms** | growing | 据认为免费层存储存在，但未经来源验证。 | 在承诺前验证存储。 |
| **MetForm** | ~100k+ | 相同：免费层存储未经来源验证。 | 请先验证。 |
| JetFormBuilder | 约 9 万 | 覆盖范围较小；因存储方式而异。 | 低优先级。 |

安装量来源：wordpress.org 插件 API（大致数据；再次排名时刷新）。

## 家族模式

```php
$surfaces['gravity-forms'] = array(
  'label'  => 'Forms',
  'family' => 'forms',
  'group'  => 'workspace',   // inbox-shaped
  'sub'    => 'Gravity Forms',
  // collection / manage / views / settings …
);
// Every other forms adapter uses the same family + distinct sub.
```

侧边栏：一个 **Forms** 项目。顶栏自动完成在
`surfacesInFamily('forms').length > 1`.

## 构建历史（用于了解背景）

1. 为 Gravity Forms 添加标签 `family: 'forms'`——已于 2026-07-09 完成。
2. Fluent Forms + Elementor Pro Forms——已在同一波次完成。
3. 通过 Flamingo + CFDB7 实现 CF7——已完成于 v0.10.0 周期。
4. Ninja Forms——已完成于 v0.12.0 周期。
5. Forminator + Formidable——已完成于 v0.13.0 周期。
6. GF 深度支持（状态筛选器、批量操作、通知视图、表单设置）——已完成
   跨越 v0.12.0–v0.13.0；参见 `docs/full-ui-adapters.md`。

## Fixture 预期（用于测试套件）

| 适配器 | 测试站点所需内容 |
|---|---|
| Gravity Forms | 活动；至少有一个包含预置条目的表单（最好还有一个非活动表单） |
| Fluent Forms | 已安装，以便系列切换器拥有另一个提供程序 |
| Elementor Pro Forms | 安装 Elementor Pro，启用 Collect Submissions，并至少有一条表单提交记录 |
| Flamingo + CFDB7 | 两者均处于启用状态，并有几条现存的入站记录；测试套件可以使用一次性 seed 选项 |
| Ninja Forms | 活动；`Ninja_Forms()->activation()` 运行后使用默认表单即可 |
| Forminator | 活动表单和条目；套件可以启用 `minimal_test_seed_forminator` |
| Formidable | 在 `FrmAppController::install()` 后有活动表单和条目；套件可以启用 `minimal_test_seed_formidable` |
| WPForms 条目 | **WPForms Pro** zip 文件和许可证（Lite 没有本地条目存储） |

## 范围外（与第一天相同）

- 表单字段构建器、条件逻辑规则构建器、支付源、垃圾邮件
  属于表单插件自身产品的设置界面。
- 在 Minimal 内创建表单（如果最终发布，80% 编辑器是一个
  相较于干净文档的有意产品押注：`docs/native-editors.md`）。
- 将各插件中的条目统一到一个合并收件箱中（该家族
  切换器就足够了）。

## Gravity Forms 深度支持（参考适配器）

- 门控条件：`GFAPI` + 已启用 REST API 设置 +
  `GFCommon::current_user_can_any(…)`（绝不是原始的细粒度上限）。
- 条目：`gf/v2` + 状态筛选器 + 批量操作 + 备注 + 重新发送；详情 shim
  使用 `minimal-admin/v1/gf/entries/{id}` 获取带标签的答案。
- Forms 管理：`minimal-admin/v1/gf/forms` 激活／停用 + 深层链接。
- 通知视图：复合行 ID `form:nid`；通过以下方式切换
  `GFFormsModel::update_notification_active`；编辑通过以下方式进行
  `save_form_notifications`.
- 表单设置：来自以下位置的项目级设置
  在请求时使用 `GFFormSettings::form_settings_fields()`；通过以下方式保存
  将 `GFAPI::update_form` 与 GF 自身的复合项辅助函数结合。
- 确认编辑以及插件级设置（货币、日志记录）保持
  深层链接：一次设置／表单构建时的工作，而不是日常操作。
