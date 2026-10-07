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

## 用例规格与数据字典附录（可选，新增节；吸收自 prd-generator v1.0.0）

**触发条件**（满足其一即在 PRD 末尾追加附录节，不满足则省略）：

- 功能涉及数据库表结构、接口字段或复杂状态流转（需要字段级定义）；
- 用户点名要 UML 用例建模 / 用例规格 / 数据字典；
- 核心业务规则的异常/备选路径复杂，功能表 + GWT 验收标准不足以表达。

**X.1 用例规格附录**：对触发复杂度的核心功能，每个用例一张规格表（并入 PRD.md 附录，不另建文件）：

```markdown
### UC-XX [用例名称]
| 项目 | 内容 |
|------|------|
| 用例编号 / 名称 | UC-XX / [名称] |
| 参与者 | [参与者列表] |
| 前置 / 后置条件 | [描述] |
| 基本事件流 | 1. [步骤]… |
| 备选事件流 | 1a. [异常]：系统[处理]… |
| 业务规则 | 1. [规则]… |
| 优先级 | 高/中/低 |
```

用例间关系（Include/Extend）与参与者定义在附录开头用一张简表说明，不要求绘制用例图。

**X.2 数据字典附录**：对涉及数据存储/传输的功能输出字段表与枚举表：

```markdown
**[表名]（table_name）**
| 字段名 | 字段中文名 | 数据类型 | 取值范围 | 是否必填 | 备注说明 |
|--------|-----------|----------|----------|----------|----------|

**状态字段枚举**：PENDING/PROCESSING/COMPLETED/ERROR…（按实际业务定义）
```

**边界**：本附录只做规格表达，不改变 PRD 主结构；自检与门禁仍按上游口径执行（附录不参与章节完整性统计，字段表不替代功能表的 GWT 验收标准）。轻量场景（lite 模式）默认不生成本附录。

## Word 导出

- 上游 `prd-export` 子技能之外：DSH 会话技能目录存在 `office-docx` 时，优先按该技能流程生成 .docx 并做结构校验；`office-docx` 与上游 `prd-export` 子技能都不可用时,交付 Markdown 并说明限制。

## 质检口径

- 门禁阈值与 13 检查项一律以上游为准：`../prd-workflow/workflows/quality_gates.js`、`../prd-workflow/workflows/check_items.py`、`../prd-workflow/docs/checker.md`。本层不另设阈值，避免第二套标准漂移。
