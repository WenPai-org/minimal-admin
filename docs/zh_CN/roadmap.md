# 路线图 — 目标及衡量目标的数字

*原则位于 [goals.md](goals.md)。深入的技术计划位于各领域文档中
（[editor-roadmap.md](editor-roadmap.md) 和 [editor-direction.md](editor-direction.md) 中的编辑器，
[plugin-support.md](plugin-support.md) 和 [adapter-coverage.md](adapter-coverage.md) 中的适配器，
v1.0 章程（[wp-cli-roadmap.md](wp-cli-roadmap.md)））。本文档就是记分板：
[v1-readiness.md](v1-readiness.md)). This document is the scoreboard:
a short list of outcomes, each judged by a real-world number we can measure honestly.*

GitHub 的公开计数器、模式语料库探测、套件账本，以及有纪律的
内部试用。每次裁剪版本时刷新状态；功能检查清单位于
领域文档，并在交付后收缩为一行账本条目。
area docs and collapse to one-line ledger entries once shipped.

## Goal 1 — Minimal is someone's whole admin

证明这一点的诚实方式，就是亲自使用它。
honest way to prove it is to live it.

- Minimal。通过 Minimal 自己提供的链接打开 wp-admin（区块编辑器退出入口，
  插件自己的设置界面）算作 Minimal 正常工作；如果 Minimal
  无法完成任务就会打破连续记录并提交一个 issue。
  **现在：** 未跟踪。连续记录从 v0.26.0 的内部试用期开始。
- **目标：** 连续 30 天，达成两次。第一次跨越一个平静的月份，然后跨越一个
- 版本裁剪（版本本身通过 Minimal 管理）。
  release cut (the release itself managed through Minimal).

## Goal 2 — the editor writes real pages, not just posts

真实站点的构成。嵌套周期（2026-08-08/09）就是该目标的实现过程。
what real sites are made of. The nesting cycle (2026-08-08/09) was this goal's build-out.

- 494 个容器单元）会在 Minimal 中以可写状态打开，并且对未触碰的内容保持字节级一致性
  保存过程中的内容，由测试套件强制保证。
  **现在：** 每个可解析的组、列、封面和媒体与文本容器都会打开为
- 带有复杂子项的写入界面作为受保护卡片。2026-08-08 基线
  探测显示顶层容器中只有 2% 可写；该周期最终以门禁
  自身被删除。字节级一致性由测试套件固定保证（嵌套岛屿、容器槽位、
  属性传递、岛屿运行：119 项检查）。
  **目标：** 让语料库保持实际上 100% 可写，同时对未触碰的内容实现零字节级一致性
- 回归问题，逐个版本持续检查。这里的回归会阻止版本发布。
  regressions, release over release. A regression here blocks the release.

## Goal 3 — real people do real work in it

只命中真正完成工作的场景。
only hit doing real work.

- 过去 30 天内最大的一批完整闭环版本下载用户群。自动更新器
  只服务当前版本，因此已被取代版本的下载量会被
  在其生命周期内完成更新的不同站点，并且每个版本的数据都会饱和
  在两到三天内 — 最近最大的一批用户群是诚实的下限。
  再加上由作者以外的人提交的 issue。
  **当前（2026-08-09）：**≈69 个活跃站点 · 27 个版本共计 644 次下载 ·
- 43 个 star · 10 个外部 issue，其中有几个正是那种真正投入使用后才会出现的 issue
  （分组内容编辑、过时更新提示、实体渲染）。
  **目标：** 约 100 个活跃站点，然后约 500 个。营销站点的理念区展示
- 活跃站点的主张会自动从约 50 个开始增长。保留外部 issue
  接收流程保持健康：每个真实工作报告都得到回复，并且修复会在
  它到达时所在的发布周期。
  the release cycle it arrives in.

## Goal 4 — plugin authors wire in without us

当我们从未见过的作者发布他们自己的版本时得到证明。
proven when authors we have never met ship their own.

- Minimal 的仓库。
  **当前：**1 个（Anchor Blocks），且它与 Minimal 由同一作者开发，所以坦率地说：0
- 外部。
  **目标：** 前 3 个外部适配器。供给方：以快速入门为先的作者
- 指南、带有套件强制示例插件的 shim 教程，以及
  集成卡会标记契约问题，而不是静默失败。
  Integrations card flagging contract problems instead of failing silently.

## Goal 5 — v1.0 ships when the promises hold

v1.0 is not a feature count. The two promises and their gates live in
[v1-readiness.md](v1-readiness.md): authors enjoy wiring in, and authors cannot abuse
Minimal. The charter's eleven audit items all shipped at v0.17.0.

- （完成连续 30 天记录；活跃站点在真实外部使用中增长）。
  **当前：**架构和作者体验门禁保持通过；真实世界证据是
- 剩下的内容。
  **目标：** 当发布一个没有改变这两项内容的版本时，发布 v1.0
- 承诺告终，因为没有任何需要改变的内容。
  promises because nothing needed changing.

## What this file is not

（[editor-roadmap.md](editor-roadmap.md)）保持不变。这里没有任何功能承诺；某个目标的
([goals.md](goals.md)) stand unchanged. Nothing here is a feature commitment; a goal's
metric moving the wrong way is information, not an obligation to build.
