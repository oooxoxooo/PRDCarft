---
name: prd-craft
description: "Use when writing, iterating on, reviewing, or exporting a PRD (产品需求文档), or when the user says 写PRD / 生成PRD / 需求文档 / 产品需求 / 帮我梳理需求并输出文档. Two-phase workflow: 深度访谈 → 需求拆解 → PRD 生成 → 评审 → 时序图 → 质量检查 → 导出."
whenToUse: Writing or revising a product requirements document; exporting an existing PRD; the user has a feature idea or requirement that needs a structured document.
---

# PRDCraft · 主入口（路由器 + DSH 增量层）

中文 PRD 需求的默认入口。权威流程与全部资产在上游复刻 `prd-workflow`（v5.1.0）；本技能负责**路由、DSH 约定、输出增强**（`references/dsh-enhancements.md`）。两个入口产出同一格式，共享 `prd-workspace/` 产物目录。

## 硬约束（先读）

- **信息优先**：禁止编造业务规则、数据、指标；访谈未覆盖且无法推断的内容在 PRD 中标注 `[待确认]` 并汇总到附录。
- **一次一个问题**：访谈逐个提问、等回答、再追问，不得一次抛出全部问题清单。
- **访谈即交互**：由当前会话 agent 亲自访谈，不得委托子代理。
- **产物落盘**：全部写入当前工作区 `prd-workspace/<项目名>/`。
- **单一事实源**：流程、模板、检查项、门禁一律以上游资产为准（路径见下），本技能不维护第二套定义。

## 路由表

| 信号 | 去向 |
|---|---|
| 常规「写PRD / 需求文档 / 梳理需求」（未点名其他技能） | 本技能承接 |
| 点名 prd-workflow，或要 HTML 原型 / 设计系统 / 代码化流水线 | `prd-workflow` 技能 |
| 点名 prd-generator，或 UML 用例建模 / 用例规格 / 数据字典，或简单功能、紧急需求的快速一次性成文 | `prd-generator` 技能 |
| 交互式 PRD 工作台（可交互网页原型 / 气泡标注 / 跳转画布），或从已有 Demo 代码还原产品 | `interaction-prd` 技能 |
| 评审会预演、存活率、攻防 | `requirement-review-simulator` |
| 竞品对标、差异化 | `competitive-product-research` |
| 想法收敛成 MVP | `idea-to-product` |
| RICE / GTM / 30-60-90 / 技能联动 | `references/decision-frameworks.md` |

## 两阶段执行

### 阶段 0：访谈（agent 亲自交互）

方法论、6 维度、完成条件、输出 JSON 格式**以上游为准**：`../prd-workflow/SKILL.md` 阶段 0 部分；问题库（选项式问题 + followUp + 动态生成规则）在 `../prd-workflow/templates/questions-template.json`。

产出 `prd-workspace/<项目名>/interview.json`（上游裸结构：`sharedUnderstanding` / `keyDecisions` / `questions`；项目名由目录名承载）。已有 interview.json 时确认后复用（断点续跑）。

### 阶段 1：工作流（自动执行）

每步产物落盘即检查点：interview.json / decomposition / PRD.md 已存在先向用户确认，复用则跳过。

1. **需求拆解** — 模块结构与验证规则（每模块字段与最低数量）以 `../prd-workflow/workflows/decomposition_schema.js` 为准，写入 `decomposition.md`。
2. **PRD 生成** — 结构以 `../prd-workflow/SKILL.md` 的输出结构 + `../prd-workflow/templates/PRD_TEMPLATE_v2.6.2_FUNCTION_BASED.md` 为准；输出增强按 `references/dsh-enhancements.md`（时序图 + Excalidraw 手绘版、persona 卡、目标三分类、1.5 竞品分析、Word 导出规则）。逐段确认模式（概述→故事→功能表→GWT）参照 `../prd-workflow/workflows/modules/prd_segmented_module.js` 的分段设计。
3. **自评审** — 检查项（CORE/COMPLETE/OPTIMIZE 分层）以 `../prd-workflow/workflows/check_items.py`（详版 `../prd-workflow/docs/checker.md`）为准逐项执行，写入 `review-report.md`；温柔话术与修复追踪对齐上游 review 模块行为；压力测试转 `requirement-review-simulator`。
4. **质量检查** — 门禁名称、阈值与数量一律以 `../prd-workflow/workflows/quality_gates.js` 为准（访谈决策、每模块规则数、章节完整、评审分等），不在本文维护数值副本。
5. **导出** — 按 `references/dsh-enhancements.md` 的 Word 导出规则。

## 执行模式

| 用户意图 | 模式 | 行为 |
|---|---|---|
| 首次生成 | auto | 阶段 0 → 阶段 1 全流程 |
| 快速版 | lite | 简化访谈（3-5 问）→ 拆解 → PRD；只跑 CORE 检查项；门禁按 lite 口径降级（访谈决策数不足不阻断，`review-report.md` 标注 lite 模式） |
| 逐段确认 | segmented | 四段逐段生成确认（功能 ≥5 个时推荐） |
| 追加/修改 | iteration | 变更分类（追加/修改/删除，对齐 `../prd-workflow/workflows/requirement_diff.js`）→ `.versions/` 快照（对齐 `version_manager.js`，保留 5 版）→ 只改受影响章节 |
| 回滚 | rollback | 从 `.versions/` 恢复（先自动备份当前） |
| 推倒重来 | fresh | 清空项目目录重跑（删除前须用户确认） |
| 只评审 | review-only | 跳过访谈，自评审 + 质检 |
| 只导出 | export-only | 现有 PRD.md 转目标格式 |

## 输出布局

```text
prd-workspace/<项目名>/
├── interview.json      # 访谈共识（上游 schema）
├── decomposition.md    # 需求拆解（模块 + 规则 + 统计）
├── diagrams/           # Excalidraw 手绘时序图（.excalidraw，可导出 .png）
├── PRD.md              # 最终 PRD（可另导出 .docx）
├── review-report.md    # 评审/质检记录（含修复追踪）
└── .versions/          # 版本快照（v1, v2…含 .version.json，保留 5 个）
```

## 参考文件（按需加载）

| 文件 | 内容 |
|---|---|
| `references/dsh-enhancements.md` | 增量层唯一事实源：目录约定 · 时序图+Excalidraw · 模板小增强 · Word 导出 · 质检口径 |
| `references/excalidraw-guide.md` | .excalidraw 文件结构 · 元素字段 · 时序图布局公式 · 手绘参数 · 转写自检 |
| `references/decision-frameworks.md` | RICE · GTM 发布清单 · 30/60/90 度量 · 五技能联动 |
| `../prd-workflow/SKILL.md` | 访谈方法论 · 两阶段模式 · PRD 输出结构 · 上游全部用法 |
| `../prd-workflow/templates/questions-template.json` | 6 维度问题库（选项式 + followUp + 生成规则） |
| `../prd-workflow/templates/PRD_TEMPLATE_v2.6.2_FUNCTION_BASED.md` | PRD 结构模板（默认功能版；场景版同目录） |
| `../prd-workflow/workflows/check_items.py` · `docs/checker.md` | 13 检查项（CORE/COMPLETE/OPTIMIZE） |
| `../prd-workflow/workflows/quality_gates.js` | 四道门禁阈值 |
| `../prd-workflow/workflows/decomposition_schema.js` | 拆解结构与验证 |
| `../prd-workflow/workflows/version_manager.js` · `requirement_diff.js` | 版本快照与需求变更行为 |
