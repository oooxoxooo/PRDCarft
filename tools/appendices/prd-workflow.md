## DSH 运行时适配（PRDCraft 注入）

本技能原为 OpenClaw 技能，此处**原样内置**其全部工作流代码、模板与 5 个内置子技能。在 DSH 中按以下映射执行：

- **与 prd-craft 的分工** — 用户未点名 prd-workflow 时，默认由 `prd-craft` 承接常规 PRD 需求；用户点名本技能、或需要完整工具链（代码化流水线、HTML 原型、设计系统、Word 引擎）时用本技能。两者共享 `prd-workspace/` 产物目录。
- **工作目录** — agent 驱动执行时，原文的 `~/.openclaw/workspace/output/{用户}/{项目}/` 一律映射为当前工作区 `prd-workspace/<项目>/`（interview.json、decomposition、PRD.md、.versions/ 版本目录都在其下）。
- **阶段 0 访谈** — 不存在 `executeForAI`；由当前会话的 agent 按 SKILL.md 的访谈方法论亲自逐题访谈（一次一问、设计树探索、能查文档/代码就不问），完成后写入 `prd-workspace/<项目>/interview.json`。
- **阶段 1 工作流** — 两种执行方式，优先前者：
  1. **agent 驱动**：按 SKILL.md 与 `workflows/` 内的定义亲自执行各阶段——流程编排以 `smart_router.js`（流程模板与依赖）为准，门禁阈值以 `quality_gates.js` 为准，检查项(CORE/COMPLETE/OPTIMIZE)以 `check_items.py` / `docs/checker.md` 为准(单一权威源)，PRD 结构以 `templates/PRD_TEMPLATE_v2.6.2_FUNCTION_BASED.md` 与 `prd_template.js` 为准(`PRD_TEMPLATE_v2.6.2.md` 为旧版参考)，版本管理按 `version_manager.js` 的行为（快照、.version.json、保留最近 5 版）。
  2. **直接运行代码**：必须设置输出目录环境变量，否则产物会写进插件包内部：
     `CUSTOM_OUTPUT_DIR="$PWD/prd-workspace/<项目>" node <skill-directory>/workflows/main.js "<需求>"`
     （`require.main` CLI 入口；`openclaw`/`adm-zip` 缺失时对应能力自动降级：原型子代理跳过、DOCX 图片质检标记不可用）；Python 工具（`workflows/check_items.py`、`skills/requirement-reviewer/engines/`）用会话可用的 python3 运行。
- **Wiki 增强** — 依赖 `~/.openclaw/workspace/wiki-ai/` 知识库目录；该目录不存在时 `wiki_search_module` 自动返回 `enabled: false` 并按标准方式执行，无需处理。
- **输出增强（DSH 增量层）** — 两个入口产出同一 PRD 格式：时序图（Mermaid `sequenceDiagram` 源 + Excalidraw 手绘版 `diagrams/*.excalidraw`）、persona 卡、目标三分类、1.5 竞品分析、Word 导出规则，见 `<skill-directory>/../prd-craft/references/dsh-enhancements.md`（Excalidraw 转写细节在同目录 `excalidraw-guide.md`）。状态流转图保持 Mermaid `stateDiagram-v2`。
- **全局图规（DSH 约定，优先于上游正文）** — 本技能一切**流程类**图（第 6 步流程图产物、`mermaid-flow` 子技能的流程图输出、PRD 内 2.1/3.X.3 等流程节）在 DSH 会话中一律改用 Mermaid `sequenceDiagram` 表达，不使用 `flowchart`/`graph`；写法（actor/participant、alt/else、loop、par 等）与 Excalidraw 转写规则见增量层「时序图（全局图规）」节。`mermaid-flow` 仍用于其**非流程**产物（C4 架构/上下文图、状态机），不受影响。
- **内置子技能** — 位于 `<skill-directory>/skills/`：`ui-ux-pro-max`（设计系统）、`mermaid-flow`（流程图渲染）、`requirement-reviewer`（评审引擎）、`prd-export`（Word 导出）、`htmlPrototype`（HTML 原型）。按各自 SKILL.md 使用；生成 HTML 原型时遵循其 Chart.js + JS 校验要求。
- **Word 导出** — 会话技能目录存在 `office-docx` 时，优先按该技能流程完成 .docx 交付与结构校验。
