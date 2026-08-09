# 邮件插件——Email Log 系列

源代码审计（2026-07-09）位于 `family: mail` 界面之后。这些项目均不
插件为其日志提供公开 REST，因此每个适配器都是 shim-tutorial.md 中的只读
shim 模式：按前缀限定的预处理 SELECT、`{items,
total}`，使用正则表达式提取序列化数据块，绝不进行反序列化。

## 已交付适配器

| 插件 | 存储 | 时间列 | 备注 |
|---|---|---|---|
| Gravity SMTP | `{prefix}gravitysmtp_events` | UTC 日期时间 | 深度适配器（v0.12.0 + v0.13.0 + v0.16 批量删除）：通过其模型提供日志和增强详情，从其 `settings_fields()` 架构映射 Settings 视图（全部 21 个连接器）、Suppressions 视图、**Debug log** 视图（首个 `views[]` 使用者）、带 14 天 sent/failed **chart** 的状态卡（首个状态卡图表使用者）、发送测试邮件、通过 `Event_Model::delete`（`DELETE_EMAIL_LOG`）执行单个/批量 **Delete**、细粒度 `gravitysmtp_*` 权限；Resend 对应其自有端点（允许名单中的 Recipient 反序列化、原始标头/附件），并以正则路径作为回退 |
| FluentSMTP | `{prefix}fsmpt_email_logs` | `current_time('mysql')` — 站点本地，原样输出 | 完整日志，免费。`to`/`headers` 已序列化；状态为 sent/failed；**在 2.3.0+ 中通过其 `Logger::resendEmailFromLog($id,'resend',$recipients)` 重新发送**（递增 `resent_count`，在 `extra['resends']` 中记录轨迹——谁/何处/何时/已发送——恢复标头和附件，在重定向时丢弃 cc/bcc，定义 `FLUENTMAIL_LOG_OFF` 以避免重复行；仅当 `resent_count` 列存在时启用，因此旧版本永远不会因失败更新而部分发送；2.3.0 之前使用 `wp_mail` 回退）。第二个参数化 **「重新发送至……」** 操作接受逗号分隔的覆盖地址（相当于其 Recipient Picker；每个地址都必须验证通过，否则不发送任何内容）。详情视图显示 **Resends trail**（通过 `Logger::find`——其反序列化器拒绝对象）。**Connection health**（2.3.0+）：状态卡行 + System health 行，来自其 `ConnectionHealth::getReport()/getFailing()` 每日报告（由选项支持，不联网；全部失败 = fail，部分失败 = warn）。容量通过其 `fluent_mail/manage_capability` 过滤器解析（2.3.0 辅助函数 `fluentMailManageCapability()`，默认 manage_options）。对发件人/收件人/主题启用 **search**（对应 `Logger::$searchables`），并通过 `Logger::delete(ids)` 执行单个/批量 **delete**，带按前缀限定的 SQL 回退。**Settings tab**（v0.18.0）：默认/回退连接、log_emails、保留天数、通过 `Settings::getMisc()/updateMiscSettings()` 设置 simulate_emails（其控制器的精确写入；当 `FLUENTMAIL_SIMULATE_EMAILS` 常量强制启用时锁定模拟；连接向导仍由其应用负责）。本地测试中的常用 ACTIVE 供应商（本地 SMTP 接收器 + 植入的 sent 行） |
| Post SMTP | `{prefix}post_smtp_logs`（+ `post_smtp_logmeta`） | `time` BIGINT = `current_time('timestamp')` — WP 本地纪元时间，根据 gmt_offset 调整（Aryo 陷阱） | 所有列均为长文本。`success` = 送达时为 `''`/`'1'`，否则为错误文本。`session_transcript` 特意不公开（可能包含 AUTH 交换） |
| WP Mail SMTP（免费版） | `{prefix}wpmailsmtp_debug_events` | `CURRENT_TIMESTAMP` — 数据库时钟，实际为 UTC，输出 ISO Z | 免费版不存储完整邮件日志（Pro 的 `wpmailsmtp_emails_log`）。调试事件回答「我的邮件是否发送失败，以及原因是什么」：event_type 0 = error，1 = debug。`initiator` 是 `{"file","line"}` JSON → basename:line。只有插件在管理员上下文中完成迁移后，表才会存在 |
| WP Mail Logging | `{prefix}wpml_mails` | `current_time('mysql')` — 站点本地，原样输出 | 仅日志（无 SMTP）。通过其 DI 重新发送器重新发送；删除按前缀限定。已交付 v0.12.0 周期；SMTP 插件轮换时经常与 Gravity SMTP 一起作为 ACTIVE 常驻插件 |

## 约定

- 多供应商测试中同一时间只有一个 SMTP 供应商保持 ACTIVE
  （FluentSMTP 或 Gravity SMTP）；其他插件已安装但停用，因此
  侧边栏显示一个 **Email** 条目（与重定向和
  活动日志系列）。WP Mail Logging 可以共存，因为它仅负责日志记录。
- Resend 通过 `wp_mail()`（或插件自带的重新发送器）重新发送，因此
  当前邮件程序处理并记录为一条新条目。
- SMTP 插件会争用 `phpmailer_init`——绝不要同时激活两个
  期望两者都记录日志。

## 后续

- **WP Mail SMTP Pro / Easy WP SMTP Pro** 完整邮件日志
  （`wpmailsmtp_emails_log`），前提是测试装置有可用许可证。
- **GoSMTP / SureMails / Site Mailer**（免费层日志；排名在
  `docs/plugin-support.md` 第 3 波）。
- **Mail Bank**，如需求出现（同一系列名额）。
