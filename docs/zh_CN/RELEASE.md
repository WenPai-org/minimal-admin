# 发布流程

## 自动上游发布

`.forgejo/workflows/upstream-sync.yml` 每六小时检查一次 FeiCode 拉取镜像
小时，也可以手动运行。新的上游稳定标签会被转换为
通过追加 `.1` 生成下游版本（例如 `0.25.0` 会变成
`0.25.0.1`）。工作流会验证转换后的源代码，创建一个
可复现的 ZIP，更新 `manifest.json`，提交固定的来源信息，打标签
该提交，并创建包含 ZIP 和 SHA-256 资源的 FeiCode 版本。

When a prepared release commit is merged through protected-branch review, the
next `main` push run detects that its downstream tag is missing. It rebuilds and
verifies the exact merged commit before creating the tag. This recovery path
does not rewrite `main`; the tag push then starts the normal release workflow.

在发布资源之前，发布工作流会启动 WordPress Playground，
installs the locally built ZIP plus the Simplified and Traditional Chinese
language packs, verifies that `minimal-admin` is active, and checks the runtime
version, locale, translation registration, and a translated runtime string.

上游同步不会联系 GlotPress。它会打包最新
已提交到仓库的翻译目录（如有）。翻译
同步独立运行；不可用或不完整的翻译
生成英文回退内容，并且绝不会阻塞上游发布。请参阅
`docs/TRANSLATIONS.md`，用于项目路径、审批规则、依赖项和
回滚。

上游源被视为不可信：上游工作流会被排除，
并且作业中不会执行任何上游脚本或测试。只有受信任的本地工具，
`php -l`，并且 `node --check` 会在使用发布令牌之前运行。

## 回滚

禁用仓库的计划 Actions 工作流并归档产品
仓库。不要删除镜像、产品仓库、标签或版本。
已安装的副本可以回滚到之前发布且通过校验和验证的
ZIP。镜像可以独立暂停，因为它从不发布版本。
