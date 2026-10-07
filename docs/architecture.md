# PRDCraft 架构决策与实施设计 · v3.0.0

- **状态**：已执行（2026-10-07，8 项清单全部完成，verify 自检通过）
- **日期**：2026-10-07
- **决策人**：包所有者（两项裁决见「决策记录」）
- **本文档性质**：仓库级设计文档，不随分发包发布

## 1. 背景（v2.0.1 现状）

v2.0.0 起，包内存在两个主链路技能，职责重叠：

- `prd-craft`（自研）：约六成内容是 prd-workflow 资产的改写 digest（访谈指南←questions-template.json+SKILL.md；质检清单←check_items.py+quality_gates.js；迭代规则←version_manager.js；PRD 模板←PRD_TEMPLATE_v2.6.2 变体）
- `prd-workflow`（上游 v5.1.0 复刻）：权威资产所在地（代码、模板、检查项、5 个内置子技能）

已确认的问题（均有实证）：

1. **漂移已发生过一次**：基于 ClawHub 页面摘要写的 D1–D8 与原版 playbook 的 D1–D8 完全不同，靠整体替换才消除
2. **PRD 模板冲突**：两技能共享 `prd-workspace/<项目>/` 但章节结构不同，同项目先后处理会混格式
3. **interview.json schema 冲突**：prd-craft 的包装 schema 与上游裸结构不兼容，上游 interview_module 校验的是后者

## 2. 决策记录

| # | 问题 | 裁决 | 推论 |
|---|---|---|---|
| Q1 | 长期产品跟随上游，还是一次性复刻？ | **长期产品，跟随上游** | 排除方案 A（全合并：升级需人工重合并）与方案 B（以上游为唯一入口：DSH 概念纠正成本重复发生）；采用**方案 C：路由器化** |
| Q2 | PRD 模板以谁为准，定制增强放哪层？ | **上游基底 + 增量层，两入口同格式** | 增量层（Excalidraw/竞品节/persona）独立成唯一事实源文件，两技能共同引用 |

技术细节（digest 删除清单、跨技能引用方式、schema 细节）由实施者裁量，不属于决策记录。

## 3. 目标架构

| | prd-craft（默认入口） | prd-workflow（点名 / 完整工具链） |
|---|---|---|
| 定位 | 路由器 + DSH 约定 + 增量层入口 | 上游资产原样 + DSH 附注 |
| PRD 结构 | 上游 PRD_TEMPLATE_v2.6.2 **+ 同一份增量层** | 同左 |
| interview.json | 上游裸 schema（sharedUnderstanding / keyDecisions / questions） | 上游 schema |
| 产物目录 | 共享 `prd-workspace/<项目>/` | 同左 |
| 上游升级 | 经 `tools/bake.mjs --skill prd-workflow --src <新版>` 一条命令同步 | 同左 |

## 4. 实施清单（8 项）

1. **新建** `skills/prd-craft/references/dsh-enhancements.md` —— 增量层唯一事实源：
   - Excalidraw 手绘时序图规范（引用现有 excalidraw-guide.md，不复制内容）
   - PRD 附加节：1.5 竞品分析（联动 competitive-product-research 技能）、persona 卡、目标三分类（用户/业务/体验）
   - office-docx Word 导出集成
2. **删除** `skills/prd-craft/references/` 下三份 digest：`interview-guide.md`、`quality-checklist.md`、`prd-template.md`。验收：`grep -r` 无残留引用。
3. **重写** `skills/prd-craft/SKILL.md`：路由表（何时自己承接/何时转 prd-workflow 及其他三技能）+ 两阶段流程（各步骤指向上游资产相对路径 `../prd-workflow/...`）+ 增量层引用。frontmatter 描述保持不变（中文默认入口）。验收：正文不再包含访谈问题库/检查项/模板结构的内联复述。
4. **统一 interview.json schema** 为上游裸结构；项目名由目录名 `prd-workspace/<项目名>/` 承载。验收：prd-craft 文档中不再出现 `schemaVersion`/`mode` 包装层。
5. **prd-workflow 附注增加一行**：PRD 增量规则（手绘图/竞品节/persona）见 `prd-craft/references/dsh-enhancements.md`（用 `<skill-directory>/../prd-craft/...` 路径）。同时更新 `tools/appendices/prd-workflow.md`（附注唯一事实源）并重跑 bake。验收：两入口加载内容均含增量层指引。
6. **保留不动**：`decision-frameworks.md`、`excalidraw-guide.md`（独有内容）。
7. **工具与元数据**：`tools/verify.mjs` 增加断言——(a) 被引用的上游资产存在；(b) dsh-enhancements.md 存在且被两个 SKILL.md 引用；(c) 三份 digest 已不存在。版本号升 **3.0.0**（结构性变更）；README 架构说明与技能表更新。
8. **旧产物不迁移**：v2.x 生成的 prd-workspace 产物保持原样，新项目按上游 schema 生成。

## 5. 风险与限制（已明示）

- **跨技能路径耦合**：prd-craft 引用 `../prd-workflow/` 目录名。目录名由本仓库控制，上游升级不改名 → 可控；单独删除 prd-workflow 技能会破坏 prd-craft（verify.mjs 断言兜底检出）。
- **路由是软机制**：registry 无"仅点名可见"硬开关，路由靠描述措辞 + 双向分工条款（现状已具备）。误路由频率未观测，无法量化。
- **上游大改风险**：若上游重构目录结构（如 templates/ 改名），跨技能引用与 bake 均需跟进；verify.mjs 的资产断言会先失败提示。

## 6. 执行前注意

- 当前 v2.0.1 的 dist tarball 即执行前快照（回滚点）；执行完成后打 3.0.0 tarball
- `index.js` 若无改动则无需重装/重启；本次清单不涉及 index.js
- 执行顺序建议：1 → 2 → 3 → 4 → 5 → 7 → 8 → verify → 重装 bundle → 实测两个技能加载 → 打包
