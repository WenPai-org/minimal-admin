# 翻譯工作流程

Minimal Admin 使用 WenPai 的 GlotPress 執行個體作為中文審核來源
翻譯。來源字串仍保留在產品儲存庫中；只有
具有 GlotPress 狀態 `current` 的翻譯才會發布。

## 專案與語系

- 專案：`hosting/minimal-admin`
- 外掛字串：`hosting/minimal-admin/body`
- Readme 字串：`hosting/minimal-admin/readme`
- 簡體中文：`zh-cn/default`，封裝為 WordPress 語系 `zh_CN`
- 繁體中文：`zh-tw/default`，封裝為 WordPress 語系 `zh_TW`

Minimal Admin 位於獨立的 `hosting` 樹狀結構下，而不是
WordPress 外掛目錄樹。專案使用 `body` 和 `readme` 子項。
發布版本由 POT 標頭、Git 標籤以及
`upstream-lock.json`；獨立的 Stable 與 Development 專案分支不會
已使用。

## 資料流程

1. 生產環境匯入器會從 FeiCode 擷取 `languages/minimal-admin.pot`，
   檢查其 SHA-256 摘要，並將變更的原始字串匯入 `body`
   專案。它在鎖定機制下每六小時執行。
2. 生產環境的專案範圍預翻譯工作會處理有界批次
   針對 zh-cn 與 zh-tw，並僅以 `waiting` 提交。它會跳過含有
   包含執行階段佔位符、標記、短碼、大括號或 URL。A
   審核者會將接受的字串提升至 `current`。
3. `.forgejo/workflows/translations.yml` 僅下載 `current` 翻譯
   每六小時驗證 PO 目錄，編譯 MO 與 JavaScript JSON
   目錄、驗證發布套件，並提交變更的目錄。
4. 上游版本同步不會存取 GlotPress，而是封裝已提交的最新翻譯
   目錄（若有）。翻譯同步失敗或語系不完整時不會阻止上游版本
   發布；缺少的字串會回退至來源英文字串。

`readme` 子項包含從 Markdown 文件擷取的內容
`docs/*.md`。行內程式碼、連結、URL、HTML 標籤、printf 佔位符和程式碼
圍欄會受到保護，不會被翻譯。已核准的項目會轉換為
`docs/zh_CN/` 和 `docs/zh_TW/`；未翻譯項目會保留英文，而不是
而是在建置期間猜測。只有在
在該檔案至少有一個已審核翻譯後；每個語系目錄的
`translation-status.json` 回報已審核與字串總數，讓
僅英文的文字不會被誤認為已翻譯的文件。

使用以下指令在本機執行下載：

```bash
tools/pull_translations.sh
```

此指令需要 `curl`、GNU gettext `msgfmt` 和 Python 3。其輸出為
寫入 `languages/minimal-admin-zh_CN.*` 並
`languages/minimal-admin-zh_TW.*`。已審核的文件目錄會寫入
至 `docs/languages/`，且本地化 Markdown 會在 `docs/zh_CN/` 下方呈現
以及 `docs/zh_TW/`。

變更來源 Markdown 後，重新產生文件 POT：

```bash
python3 tools/docs_i18n.py extract \
  --version "$(jq -r .version manifest.json)" \
  --output languages/minimal-admin-docs.pot
```

## 機器翻譯邊界

請勿執行現有的 `wp platform machine_translate translate --slug=body`
此專案的指令。已安裝的實作會搜尋所有專案
其 slug 為 `body`，選取不受語系限制的翻譯集，
並且只針對簡體中文。這可能會寫入無關的專案，並且
無法安全地維護兩種語系。

Minimal Admin 替換工作固定使用本文專案 ID 450462，Readme
專案 ID 450463，以及翻譯集 ID 318136–318139。它要求完全
專案／語系／目標對應，忽略任何已經有
該集合中的翻譯，且只寫入 `waiting`。人工核准仍然
翻譯到達發布版本之前必須完成。請參閱操作手冊
用於部署路徑與診斷。

## 發布與回復

發布 ZIP 會包含可用的 PO/MO 目錄與產生的 Jed JSON 目錄，但目錄
缺少或翻譯涵蓋不完整都不是發布閘門。WordPress Playground 發布
冒煙測試會安裝該確切 ZIP 兩次，並在 `zh_CN` 與 `zh_TW` 下驗證
外掛啟用；未翻譯字串使用來源英文文字。這是執行階段閘門，而不是
語言審核。審核者必須另外檢查每個語系中已核准的標記字串，然後
才能宣告翻譯涵蓋率完整。

若要停止同步，請停用翻譯工作流程和生產環境
cron 獨立執行。先前提交的目錄與發布 ZIP 仍然
可用；請勿刪除 GlotPress 歷史記錄。
