# 翻译工作流

Minimal Admin 使用 WenPai 的 GlotPress 实例作为中文审核源
翻译。源字符串仍保留在产品仓库中；只有
GlotPress 状态为 `current` 的翻译会被发布。

## 项目和语言区域

- 项目：`hosting/minimal-admin`
- 插件字符串：`hosting/minimal-admin/body`
- Readme 字符串：`hosting/minimal-admin/readme`
- 简体中文：`zh-cn/default`，打包为 WordPress 语言区域 `zh_CN`
- 繁体中文：`zh-tw/default`，打包为 WordPress 语言区域 `zh_TW`

Minimal Admin 托管在独立的 `hosting` 树下，而不是
WordPress 插件目录树。项目使用 `body` 和 `readme` 子项。
发布版本由 POT 头部、Git 标签以及
`upstream-lock.json`；独立的 Stable 和 Development 项目分支不会
使用。

## 数据流

1. 生产导入器从 FeiCode 获取 `languages/minimal-admin.pot`，
   检查其 SHA-256 摘要，并将更改后的原文导入 `body`
   项目。它每六小时在锁定机制下运行一次。
2. 生产环境中按项目限定的预翻译作业会处理有界批次
   针对 zh-cn 和 zh-tw，并且仅作为 `waiting` 提交。它会跳过包含
   包含运行时占位符、标记、短代码、大括号或 URL。一个
   审核者会将已接受的字符串提升到 `current`。
3. `.forgejo/workflows/translations.yml` 仅下载 `current` 翻译
   每六小时运行一次，验证 PO 目录，编译 MO 和 JavaScript JSON
   目录，验证发布包，并提交发生变化的目录。
4. 上游版本同步不会访问 GlotPress，而是打包已经提交的最新翻译
   目录（如果存在）。翻译同步失败或语言区域不完整时不会阻止
   上游版本发布；缺失的字符串会回退到源英文字符串。

`readme` 子项包含从 Markdown 文档中提取的内容
`docs/*.md`。行内代码、链接、URL、HTML 标签、printf 占位符和代码
防护区域受保护，不会被翻译。已批准的条目会渲染为
`docs/zh_CN/` 和 `docs/zh_TW/`；未翻译条目会保留英文，而不是
而不是在构建期间猜测。只有在以下情况下才会创建本地化 Markdown 文件
在该文件至少包含一条已审核翻译后；每个语言区域目录的
`translation-status.json` 报告已审核和字符串总数，以便
纯英文文案不能被误认为已翻译的文档。

使用以下命令在本地运行下载：

```bash
tools/pull_translations.sh
```

该命令需要 `curl`、GNU gettext `msgfmt` 和 Python 3。其输出为
写入 `languages/minimal-admin-zh_CN.*` 并
`languages/minimal-admin-zh_TW.*`。审核后的文档目录会写入
到 `docs/languages/`，并且本地化 Markdown 会渲染在 `docs/zh_CN/` 下方
以及 `docs/zh_TW/`。

修改源 Markdown 后重新生成文档 POT：

```bash
python3 tools/docs_i18n.py extract \
  --version "$(jq -r .version manifest.json)" \
  --output languages/minimal-admin-docs.pot
```

## 机器翻译边界

不要运行现有的 `wp platform machine_translate translate --slug=body`
此项目的命令。已安装的实现会搜索所有项目
其 slug 为 `body`，选择不限制语言区域的翻译集，
并且仅针对简体中文。这可能会写入无关项目，并且
无法安全地同时维护两种语言区域。

Minimal Admin 替换作业固定使用正文项目 ID 450462，Readme
项目 ID 450463，以及翻译集 ID 318136–318139。它要求精确的
项目/语言区域/目标映射，忽略任何已经拥有
该集合中的翻译，并且只写入 `waiting`。人工审批仍然
翻译进入发布版本前必须完成。请参阅运维手册
用于部署路径和诊断。

## 发布和回滚

发布 ZIP 会包含可用的 PO/MO 目录和生成的 Jed JSON 目录，但目录
缺失或翻译覆盖不完整都不是发布门禁。WordPress Playground 发布
冒烟测试会安装该精确 ZIP 两次，并验证在 `zh_CN` 和 `zh_TW` 下
插件处于激活状态；未翻译字符串使用源英文文本。这是运行时门禁，
而不是语言质量审核。审核者必须分别检查每个语言区域中的已批准
标记字符串，然后才能宣布翻译覆盖完成。

要停止同步，请禁用翻译工作流和生产环境
cron 独立运行。之前提交的目录和发布 ZIP 会继续
可用；不要删除 GlotPress 历史记录。
