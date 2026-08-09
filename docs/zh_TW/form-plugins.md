# 表單外掛 — Forms 家族對照圖

最初是 2026-07-09 的來源搜尋（「哪些表單外掛值得納入 Forms
家族成員？」）。於 2026-07-12 在 v0.13.0 週期期間完成過時檢查：
家族目前已加入**八**個提供者，介面卡階梯已在
Gravity Forms（項目 → 通知 → 表單設定），以及其餘
工作只剩少量遺留項目，以及一個需要
固定裝置授權。

**今天：** `family: 'forms'`，附提供者切換器。刻意**不**
表單建構器：深層連結至各外掛的編輯器，以建立／編輯
表單文件。未來「80% 表單編輯器」的範圍與界線
乾淨文件位於 `docs/native-editors.md`（暫停）。

## 涵蓋範圍（已推出）

| 外掛 | 配接器 | Minimal 提供的功能介面 |
|---|---|---|
| **Gravity Forms** | `gravity-forms.php` | 將項目作為聯絡人卡片，具備 Received／Spam／Trash、加星號／已讀、備註、重新傳送、批次操作；**Forms** 管理檢視（啟用／停用）；**Notifications** 檢視（切換＋每日欄位編輯）；**Form settings**（請求時從 GF Settings-framework schema 取得項目範圍設定）。完整工作流程深度。 |
| **Fluent Forms** | `fluent-forms.php` | 項目清單＋具標籤的詳細資料；Received／Spam／Trash 篩選；搜尋；開啟即標記為已讀；移至垃圾桶／永久刪除；表單管理檢視。套件 `fluent-forms`（24）。以 `fluentform_submissions`（＋表單欄位標籤）標準化。 |
| **Everest Forms** | `everest-forms.php` | 透過 EVF_Admin_Entries 處理具 Received／Spam／Trash 狀態的項目；表單分頁；搜尋；表單管理。套件 `everest-forms`。 |
| **Elementor Pro Forms** | `elementor-forms.php` | 透過 Elementor 自有 Query 類別處理提交內容；透過 `move_to_trash_submission` 移至垃圾桶。免費版 Elementor 沒有提交內容儲存區。 |
| **Contact Form 7＋Flamingo** | `cf7-flamingo.php` | 透過 Flamingo 自有模型處理收到的訊息（垃圾郵件／取消垃圾郵件／垃圾桶）；管理畫面中的 CF7 表單具備即時頻道計數。CF7 單獨不儲存任何內容。 |
| **CFDB7** | `cfdb7.php` | 來自 `{prefix}db7_forms` 的項目（以位元組長度標記掃描序列化對映，絕不反序列化）；開啟即標記為已讀；永久刪除。 |
| **Ninja Forms** | `ninja-forms.php` | 將項目作為 `nf_sub` postmeta 卡片，提供表單分頁、具標籤的詳細資料，透過自有模型移至垃圾桶，並在表單管理中顯示即時項目計數。 |
| **Forminator** | `forminator.php` | 從 Forminator 自有模型取得項目，執行時解析標籤，透過 `Forminator_API::delete_entry` 永久刪除，並提供表單管理。遵循 `forminator-entries` 權限模型。 |
| **Formidable** | `formidable.php` | 透過 `FrmEntry` 取得項目，執行時從欄位模型取得標籤，使用 UTC 時間戳，透過 `FrmEntry::destroy` 永久刪除，權限上限比照細粒度權限或管理員。 |

此家族位於 Workspace 底下。提供者偏好設定鍵：`minimal-sf-forms`。

## 版圖中的遺留項目（尚未調整）

| 外掛 | 免費安裝數（約） | 為何仍未完成 | 適配度 |
|---|---|---|---|
| **WPForms Pro** | 5M+ Lite 品牌 | Lite **不**儲存本機項目（僅限電子郵件／Lite Connect）。Pro 使用 `wpforms_entries`＋中繼資料／欄位。自 1.9.9 起的 Abilities API 不適合集合描述項；SQL／內部替代介面更簡潔。**需要 Pro 授權＋固定裝置。** | 尚未涵蓋且價值最高的品牌；需要購買授權。 |
| **SureForms** | 增長中 | 據信有免費層級項目儲存區，但尚未經來源驗證。 | 在承諾前先驗證儲存方式。 |
| **MetForm** | 約 100k+ | 相同：免費層級儲存區尚未經來源驗證。 | 請先驗證。 |
| JetFormBuilder | 約 90k | 涵蓋範圍較低；依儲存方式而異。 | 低優先級。 |

安裝數來源：wordpress.org 外掛 API（概略值；再次排名時重新整理）。

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

側邊欄：一個 **Forms** 項目。頂端列自動完成，當
`surfacesInFamily('forms').length > 1`.

## 建置歷程（供定位參考）

1. 以 `family: 'forms'` 標記 Gravity Forms — 已於 2026-07-09 完成。
2. Fluent Forms＋Elementor Pro Forms — 已於同一波次完成。
3. 透過 Flamingo＋CFDB7 整合 CF7 — 已於 v0.10.0 週期完成。
4. Ninja Forms — 已於 v0.12.0 週期完成。
5. Forminator＋Formidable — 已於 v0.13.0 週期完成。
6. GF 深度功能（狀態篩選、批次操作、通知檢視、表單設定）— 已完成
   跨越 v0.12.0–v0.13.0；請參閱 `docs/full-ui-adapters.md`。

## 固定裝置預期（供測試套件使用）

| 介面卡 | 測試網站需要的內容 |
|---|---|
| Gravity Forms | 已啟用；至少有一個填入種子項目的表單（最好另有一個未啟用的表單） |
| Fluent Forms | 已安裝，讓系列切換器多一個提供者 |
| Elementor Pro Forms | Elementor Pro，啟用 Collect Submissions，且至少有一筆表單提交 |
| Flamingo＋CFDB7 | 兩者皆啟用，並有幾筆現有的收到項目；測試套件可使用一次性種子選項 |
| Ninja Forms | 已啟用；`Ninja_Forms()->activation()` 執行後，使用預設表單即可 |
| Forminator | 啟用表單與項目；測試套件可以啟用 `minimal_test_seed_forminator` |
| Formidable | 在 `FrmAppController::install()` 後啟用表單與項目；測試套件可以啟用 `minimal_test_seed_formidable` |
| WPForms 項目 | **WPForms Pro** zip 與授權（Lite 沒有本機項目儲存區） |

## 範圍外（與第一天相同）

- 表單欄位建構器、條件邏輯規則建構器、付款串流、垃圾郵件
  屬於表單外掛自身產品的設定 UI。
- 在 Minimal 內建立表單（若最終推出，這個 80% 編輯器會是
  相較於乾淨文件的刻意產品押注：`docs/native-editors.md`）。
- 將各外掛的項目統一到一個合併收件匣（此家族
  切換器已足夠）。

## Gravity Forms 深度功能（參考介面卡）

- 門檻：`GFAPI`＋已啟用 REST API 設定＋
  `GFCommon::current_user_can_any(…)`（絕不使用原始的細粒度上限）。
- 項目：`gf/v2`＋狀態篩選＋批次操作＋備註＋重新傳送；詳細資料替代介面
  `minimal-admin/v1/gf/entries/{id}` 以取得具標籤的答案。
- Forms 管理：`minimal-admin/v1/gf/forms` 啟用／停用＋深層連結。
- 通知檢視：複合式列 ID `form:nid`；透過切換
  `GFFormsModel::update_notification_active`；編輯透過
  `save_form_notifications`.
- 表單設定：項目範圍設定，來自
  在請求時取得 `GFFormSettings::form_settings_fields()`；透過以下項目儲存
  `GFAPI::update_form`，搭配 GF 自有輔助函式處理複合項目。
- 確認項目編輯與全外掛設定（貨幣、記錄）仍然
  透過深層連結：一次設定／建立表單時的工作，而非日常工作。
