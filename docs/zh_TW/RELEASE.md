# 發布流程

## 自動化上游發布

`.forgejo/workflows/upstream-sync.yml` 每六小時檢查一次 FeiCode 拉取鏡像
小時，也可以手動執行。新的上游穩定標籤會轉換為
在下游版本後附加 `.1`（例如 `0.25.0` 會變成
`0.25.0.1`）。工作流程會驗證轉換後的來源，建立一個
可重現的 ZIP，更新 `manifest.json`，提交固定的來源追蹤資訊、標記
該提交，並建立包含 ZIP 與 SHA-256 資產的 FeiCode 發布版本。

When a prepared release commit is merged through protected-branch review, the
next `main` push run detects that its downstream tag is missing. It rebuilds and
verifies the exact merged commit before creating the tag. This recovery path
does not rewrite `main`; the tag push then starts the normal release workflow.

在發布資產之前，發布工作流程會啟動 WordPress Playground，
installs the locally built ZIP plus the Simplified and Traditional Chinese
language packs, verifies that `minimal-admin` is active, and checks the runtime
version, locale, translation registration, and a translated runtime string.

上游同步不会联系 GlotPress，而是打包最新
已提交至代码库的翻译目录（如有）。翻译
同步独立运行；不可用或不完整的翻译
生成英文备用文本，且绝不会阻止上游发布。请参阅
`docs/TRANSLATIONS.md`，用于项目路径、审批规则、依赖项以及
回滚。

上游來源視為不受信任：排除上游工作流程，
且工作中不會執行任何上游指令碼或測試。只有受信任的本機工具，
`php -l`，且 `node --check` 會在使用發布權杖之前執行。

## 回復

停用儲存庫的排程 Actions 工作流程並封存產品
儲存庫。請勿刪除鏡像、產品儲存庫、標籤或發布版本。
已安裝的副本可以使用先前發布且經核對總和驗證的版本回復
ZIP。鏡像可以獨立暫停，因為它從不發布版本。
