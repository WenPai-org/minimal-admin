# 郵件外掛——Email Log 家族

（2026-07-09）在 `family: mail` 介面背後進行的原始碼稽核。這些項目都不會
外掛為其記錄提供公開 REST，因此每個介接器都是唯讀
shim-tutorial.md 中的 shim 模式：具前綴範圍的預備 SELECT、`{items,
total}`，以 regex 採集序列化 blob，絕不進行反序列化。

## 已出貨的介接器

| 外掛 | 儲存 | 時間欄位 | 備註 |
|---|---|---|---|
| Gravity SMTP | `{prefix}gravitysmtp_events` | UTC 日期時間 | 深度介接器（v0.12.0＋v0.13.0＋v0.16 批次刪除）：透過其模型提供記錄＋豐富詳細資料，Settings 檢視依其 `settings_fields()` 結構對應（全部 21 個連線器）、Suppressions 檢視、**Debug log** 檢視（第一個 `views[]` 使用者）、狀態卡附 14 天 sent／failed **圖表**（第一個狀態卡圖表使用者）、傳送測試郵件、透過 `Event_Model::delete`（`DELETE_EMAIL_LOG`）執行單筆／批次 **Delete**、細緻的 `gravitysmtp_*` 權限；Resend 對應其自身端點（允許清單中的 Recipient 反序列化、原始標頭／附件），並以 regex 路徑作為備援 |
| FluentSMTP | `{prefix}fsmpt_email_logs` | `current_time('mysql')`——網站本機時間，原樣輸出 | 完整記錄，免費。`to`／`headers` 已序列化；狀態為 sent／failed；**透過其 `Logger::resendEmailFromLog($id,'resend',$recipients)` 重新傳送（2.3.0+）**（更新 `resent_count`，將軌跡記錄至 `extra['resends']`——誰／何處／何時／已傳送——還原標頭＋附件，在重新導向時移除 cc／bcc，定義 `FLUENTMAIL_LOG_OFF` 以避免重複列；受 `resent_count` 欄位存在與否控管，因此舊版本絕不會因更新失敗而部分傳送；`wp_mail` 作為 2.3.0 前的備援）。第二個參數化 **「重新傳送至⋯」** 操作接受以逗號分隔的覆寫地址（相當於其 Recipient Picker；每個地址都必須通過驗證，否則不會傳送任何內容）。詳細資料檢視會顯示 **Resends trail**（透過 `Logger::find`——其反序列化會拒絕物件）。**Connection health**（2.3.0+）：狀態卡列＋System health 列，取自其 `ConnectionHealth::getReport()/getFailing()` 每日報告（由選項提供、零網路；全部失敗＝fail，部分失敗＝warn）。Caps 透過其 `fluent_mail/manage_capability` 篩選器解析（2.3.0 helper `fluentMailManageCapability()`，預設 manage_options）。對寄件者／收件者／主旨啟用 **search**（對應 `Logger::$searchables`），並透過 `Logger::delete(ids)` 執行單筆／批次 **delete**，附具前綴範圍的 SQL 備援。**Settings tab**（v0.18.0）：預設／備援連線、log_emails、保留天數、透過 `Settings::getMisc()/updateMiscSettings()` 的 simulate_emails（其控制器的精確寫入；當 `FLUENTMAIL_SIMULATE_EMAILS` 常數強制啟用時，模擬功能會鎖定；連線精靈仍由其應用程式處理）。本機測試中的共用 ACTIVE 供應商（本機 SMTP 接收器＋種子化的 sent 列） |
| Post SMTP | `{prefix}post_smtp_logs`（＋`post_smtp_logmeta`） | `time` BIGINT＝`current_time('timestamp')`——WP 本機 epoch，依 gmt_offset 偏移（Aryo 陷阱） | 所有欄位皆為 longtext。傳送成功時，`success`＝`''`／`'1'`，否則為錯誤文字。`session_transcript` 刻意不公開（可能包含 AUTH 交換內容） |
| WP Mail SMTP（免費版） | `{prefix}wpmailsmtp_debug_events` | `CURRENT_TIMESTAMP`——資料庫時鐘，實務上為 UTC，輸出 ISO Z | 免費版不儲存完整電子郵件記錄（Pro 的 `wpmailsmtp_emails_log`）。Debug 事件可回答「我的郵件是否傳送失敗，以及原因為何」：event_type 0＝錯誤，1＝除錯。`initiator` 是 `{"file","line"}` JSON → basename:line。資料表只有在外掛的管理員內容遷移後才會存在 |
| WP Mail Logging | `{prefix}wpml_mails` | `current_time('mysql')`——網站本機時間，原樣輸出 | 僅記錄（無 SMTP）。透過其自身 DI 重新傳送器重新傳送；刪除為具前綴範圍。已出貨 v0.12.0 週期；SMTP 外掛輪替時，常與 Gravity SMTP 一起作為 ACTIVE 常駐項目 |

## 慣例

- 在多供應商測試中，同一時間只有一個 SMTP 供應商保持 ACTIVE
  （FluentSMTP 或 Gravity SMTP）；其他項目已安裝但停用，因此
  側邊欄顯示一個 **Email** 項目（與重新導向及
  活動記錄家族）。WP Mail Logging 可以共存，因為它僅負責記錄。
- Resend 會透過 `wp_mail()`（或外掛自身的重新傳送器）重新傳送，因此
  目前的郵件程式會處理並記錄為新的項目。
- SMTP 外掛會爭用 `phpmailer_init`——一次絕不啟用兩個
  預期兩者都會記錄。

## 稍後

- **WP Mail SMTP Pro／Easy WP SMTP Pro** 完整電子郵件記錄
  （`wpmailsmtp_emails_log`），當測試固定資料有可用授權時。
- **GoSMTP／SureMails／Site Mailer**（免費層級記錄；排名位於
  `docs/plugin-support.md` 波次 3）。
- **Mail Bank**，若需求出現（同一家族位置）。
