# DSH 增量层 · PRD 输出增强规则

在 prd-workflow 的 PRD 结构（`../prd-workflow/SKILL.md` 输出结构 + `../prd-workflow/templates/PRD_TEMPLATE_v2.6.2_FUNCTION_BASED.md`）之上叠加的 DSH 侧增强。**本文件是增量规则的唯一事实源；未提及的部分一律以上游结构为准，此处不得重复定义。**

## 目录与产物约定

- 所有产物写入当前工作区 `prd-workspace/<项目名>/`（上游 `output/{用户}/{项目}/` 的 DSH 映射）。
- `interview.json` 以上游 SKILL.md 的输出格式为准（`sharedUnderstanding` / `keyDecisions` / `questions` 裸结构）；项目名由目录名承载，不自建包装层。
- 迭代版本快照 `.versions/v<N>/`（含 `.version.json` 元数据），保留最近 5 个；行为对齐 `../prd-workflow/workflows/version_manager.js`。

## 时序图（业务流程图增强）

- 2.1 主业务流程图与 3.X.3 业务流程用 Mermaid `sequenceDiagram` 表达（替代 flowchart）：人用 `actor`、系统用 `participant`；分支用 `alt/else`、`opt`、`loop`、`par`、`critical` 交互块；异常分支必须画出并落到明确的结束或回退消息。
- 每个 Mermaid 源转写一份 Excalidraw 手绘版：`diagrams/<名称>.excalidraw`。转写规范（文件结构、元素字段、布局公式、手绘参数、自检清单）见 `<skill-directory>/references/excalidraw-guide.md`；从 prd-workflow 侧引用时路径为 `<skill-directory>/../prd-craft/references/excalidraw-guide.md`。
- PRD 正文中：Mermaid 源代码块 + 下一行 `**手绘版**：[diagrams/xxx.excalidraw](diagrams/xxx.excalidraw)`。
- 状态流转图保持 Mermaid `stateDiagram-v2`，不做 Excalidraw 转写。

## 模板小增强（对功能版模板）

- **1.2 目标用户**：表格外，为主要用户补一张 persona 卡（姓名化代号、年龄/职业、特征 3-4 条、使用目标 2-3 条）。
- **1.3 业务目标**：目标类型行补全三类——用户目标 / 业务目标 / 体验目标（效率、步骤、耗时改善）。
- **1.5 竞品分析（可选，新增节）**：竞品对照表（竞品 | 核心功能 | 优势 | 劣势 | 我们的差异化）；深度调研用 `competitive-product-research` 技能出报告，此处只放结论摘要与报告链接。
- 体验/场景权重高的项目可参考场景版模板 `../prd-workflow/templates/PRD_TEMPLATE_v2.6.2.md`（含用户旅程地图、persona 内置）；默认仍用功能版。

## Word 导出

- 上游 `prd-export` 子技能之外：DSH 会话技能目录存在 `office-docx` 时，优先按该技能流程生成 .docx 并做结构校验；`office-docx` 与上游 `prd-export` 子技能都不可用时,交付 Markdown 并说明限制。

## 质检口径

- 门禁阈值与 13 检查项一律以上游为准：`../prd-workflow/workflows/quality_gates.js`、`../prd-workflow/workflows/check_items.py`、`../prd-workflow/docs/checker.md`。本层不另设阈值，避免第二套标准漂移。
