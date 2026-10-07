# PRDCraft 架构设计 · 全业务流程 · 技能体系(v3.1.0)

> 基于 2026-10-07 全面评审与修复后的 v3.1.0 实际代码整理。

## 一、架构设计

### 1.1 总体形态:DSH bundle + 技能提供器

PRDCraft 是一个 **DSH(DeepSeek Harness)bundle 包**(`@local/prdcraft`),安装后向会话技能目录注入 **7 个技能**。本体零运行时依赖、零安装脚本(唯一例外:`interaction-prd` 的底座依赖按需装进用户工作区)。

```text
prdcraft/
├── package.json          # dsh.bundle.patch → cordis.patch.yml;files 白名单
├── cordis.patch.yml      # 向 profile 插入插件行(id: prdcraft)
├── index.js              # Host 半体:技能提供器(扫描 skills/ 并注册)
├── locale/{en,zh}.json   # 包级双语描述
├── skills/               # 7 个技能,一目录一技能
│   ├── prd-craft/            # 自研:路由器 + DSH 增量层(默认入口)
│   ├── prd-workflow/         # 上游复刻 v5.1.0(含 5 个内置子技能 + workflows 代码)
│   │   └── package.json      # {"type":"commonjs"} 使 workflows 可直接 node 运行
│   ├── prd-generator/        # 上游复刻 v1.0.0(UML 用例驱动)
│   ├── interaction-prd/      # 上游复刻 v0.8.0(交互式 PRD 工作台)
│   ├── competitive-product-research/  # 上游复刻 v1.4.8
│   ├── requirement-review-simulator/  # 上游复刻 v1.2.8
│   └── idea-to-product/      # 上游复刻 v0.1.1
├── tools/
│   ├── appendices/       # 6 份 DSH 适配附注(复刻技能的唯一事实源)
│   ├── bake.mjs          # 上游升级流水线:整包覆盖+frontmatter 规范化+附注重烘焙(幂等)
│   └── verify.mjs        # 安装前自检:EXPECTED_SKILLS 精确清单+资产+打包健康
└── docs/                 # 架构决策与评审文档(不随分发)
```

### 1.2 加载机制(index.js)

- 启动时扫描 `skills/` 全部子目录,解析每个 SKILL.md 的 frontmatter(内置 YAML 子集解析器,支持块标量/嵌套 map,零依赖)
- **per-skill 容错**:坏一个 SKILL.md 只跳过该技能并告警,不影响其余
- 注册为 `provider: prdcraft`、`rank: 600` 的技能候选,`modelInvocable + userInvocable`
- `verify.mjs` 用相同方式 mock 驱动 index.js,并以 `EXPECTED_SKILLS` 精确清单断言「README 说几个就注册几个」

### 1.3 核心架构决策:路由器化(v3.0.0 起)

历史上包内曾有**两套 PRD 主链路**(自研 digest vs 上游复刻)导致三重漂移(D1-D8 语义、PRD 模板、interview.json schema)。裁决为**方案 C:路由器 + 增量层**:

| 层 | 职责 | 原则 |
|---|---|---|
| **prd-workflow(上游资产层)** | 权威流程、模板、检查项、门禁、5 个内置子技能、workflows 代码 | 原样复刻 + DSH 附注,单一事实源 |
| **prd-craft(路由器/增量层)** | 中文默认入口、路由表、DSH 约定、输出增强 | **不维护第二套定义**,一切阈值/模板/检查项用相对路径 `../prd-workflow/...` 指向上游 |
| **dsh-enhancements.md** | 增量层唯一事实源:Excalidraw 手绘时序图、persona 卡、目标三分类、1.5 竞品分析、Word 导出规则 | 两个入口共同引用,同一格式 |

配套机制:
- **上游升级一条命令**:`bake.mjs --skill X --src <新版>` 整包覆盖 + 规范化 + 附注重烘焙,幂等
- **防漂移断言**:verify 检查被引用的上游资产存在、两入口都引用增量层、旧 digest 不复存在、gate/CJS/locale/patch 等打包健康项

### 1.4 工作区约定

所有技能共享 `prd-workspace/<项目名>/`(在会话工作区根):

```text
prd-workspace/<项目名>/
├── interview.json       # 访谈共识(上游裸 schema,断点续跑)
├── decomposition.md     # 需求拆解
├── PRD.md / PRD-uml.md  # 最终 PRD(prd-generator 产物为后者)
├── diagrams/            # Excalidraw 手绘时序图
├── review-report.md     # 评审/质检记录
├── .versions/           # 版本快照(保留 5 版)
└── interaction/         # interaction-prd 的工作台工作区(<产品名>-workspace/)
```

## 二、全业务流程

### 2.1 主链路:prd-craft 两阶段(常规「写 PRD」默认走此)

```text
用户请求(未点名技能)
   │
   ▼
┌─ 路由表判定 ─────────────────────────────────────────────┐
│ 常规写PRD → prd-craft 承接                                 │
│ 点名/HTML原型/设计系统/流水线 → prd-workflow               │
│ UML用例/简单功能快速成文 → prd-generator                   │
│ 交互工作台/Demo还原 → interaction-prd                      │
│ 评审预演/攻防 → requirement-review-simulator               │
│ 竞品对标 → competitive-product-research                    │
│ 想法→MVP → idea-to-product                                 │
└───────────────────────────────────────────────────────────┘
   │
阶段 0:深度访谈(agent 亲自,一次一问)
   │  方法论/问题库 ← ../prd-workflow/SKILL.md + questions-template.json
   ▼ 产出 interview.json(sharedUnderstanding/keyDecisions/questions)
阶段 1:工作流(每步落盘即检查点,已有产物确认后复用)
   1. 需求拆解 → decomposition.md        (schema: decomposition_schema.js)
   2. PRD 生成 → PRD.md                  (模板: FUNCTION_BASED;增强: dsh-enhancements.md)
   3. 自评审   → review-report.md        (检查项: check_items.py 14 项 CORE/COMPLETE/OPTIMIZE)
   4. 质量门禁                          (阈值: quality_gates.js gate1-4,lite 模式降级)
   5. 导出     → .docx                   (office-docx 优先,回退 prd-export)
```

8 种执行模式:auto / lite(3-5 问+CORE 检查+门禁降级)/ segmented(逐段确认)/ iteration(变更分类+版本快照)/ rollback / fresh / review-only / export-only。

### 2.2 prd-workflow:代码化 10 步流水线

precheck → wiki_search → interview → decomposition → PRD(可分段) → review → flowchart → design → prototype → export,末端 quality 终检。两种驱动方式:① agent 按定义亲自执行(默认);② 直接运行代码 `CUSTOM_OUTPUT_DIR=<工作区> node workflows/main.js`(v3.1.0 已修复 CJS/ESM 冲突与 gate5-9 断裂,可正常运行),门禁 gate1-9 全链生效,版本管理快照保留 5 版。

### 2.3 周边技能流程(各自独立,共享工作区)

- **prd-generator**:需求收集 → UML 用例建模(参与者/Include/Extend)→ 用例规格(前置/后置/事件流/业务规则/数据字典)→ 交互设计(流程/状态机/时序)→ UI 规范 → 非功能需求 → 整合成文 → `PRD-uml.md`
- **interaction-prd**:想法/Demo 双入口 → 初始化工作区(`--root prd-workspace/<项目>/interaction`,底座需工作区内 npm install)→ G0 产品定型 → G1 板块计划 → G2 PRD 基础分析 → G3 设计参考基线 → G4 逐模块交付(PRD+可交互原型+气泡标注+跳转画布,每门禁等用户确认)→ G5 全局收口;`npm run validate` 校验
- **competitive-product-research**:采集表单(HTML)→ 双轨调研(体验八维 D1–D8 / 战略 SWOT·五力·PESTLE)→ 健康度确定性评分 → SRC 证据溯源 HTML/Markdown 报告
- **requirement-review-simulator**:五角色评审攻防模拟(三级残酷度)→ 确定性评分引擎(S/A/B/C + Go/No-Go)→ 存活率报告 + 会议资产四件套
- **idea-to-product**:idea → MVP 收敛 → 故事卡 → UX 流程 → Playwright 检查 → 反馈闭环(5 个原子命令)

### 2.4 技能联动全景

```text
        想法 ──→ idea-to-product(MVP 收敛)
          │
          ├─→ competitive-product-research(竞品对标)──┐
          │                                          ├── 喂给 prd-craft 的 1.5 竞品节
          ▼                                          │
      prd-craft(默认入口)◄──路由── 用户请求           │
          │  产出 PRD.md + review-report.md           │
          ├─→ requirement-review-simulator(压力评审)  │
          ├─→ prd-workflow(要 HTML 原型/设计系统时)   │
          ├─→ prd-generator(UML 快速成文)            │
          └─→ interaction-prd(交互工作台/Demo 还原)   │
```

## 三、技能体系(7 个)

| # | 技能 | 来源/版本 | 定位 | 关键资产 |
|---|---|---|---|---|
| 1 | `prd-craft` | 自研 | **路由器 + DSH 增量层**,中文默认入口 | dsh-enhancements.md、excalidraw-guide.md、decision-frameworks.md(RICE/GTM/30-60-90) |
| 2 | `prd-workflow` | 上游 v5.1.0 | 完整 10 步代码化流水线 | workflows/ 22 个 JS 模块、6 流程模板、check_items.py 14 项、quality_gates gate1-9、5 个内置子技能 |
| 3 | `prd-generator` | 上游 v1.0.0 | UML 用例驱动 PRD,简单/紧急需求快速成文 | 用例规格/数据字典/时序图模板 |
| 4 | `interaction-prd` | 上游 v0.8.0 | G0–G5 门禁式交互 PRD 工作台 | init 脚本、Node 底座(原型/标注/画布) |
| 5 | `competitive-product-research` | 上游 v1.4.8 | 双轨竞品调研 + 确定性健康度评分 | 采集表单、research-playbook、报告模板 |
| 6 | `requirement-review-simulator` | 上游 v1.2.8 | 五角色评审攻防 + S/A/B/C 评分 | 评分引擎、会议资产模板 |
| 7 | `idea-to-product` | 上游 v0.1.1 | idea→MVP→故事→UX→验证闭环 | 5 个原子命令规格 |

**prd-workflow 的 5 个内置子技能**(只被其流水线调用,不独立注册):`ui-ux-pro-max`(设计系统数据+检索)、`mermaid-flow`(流程图/C4 渲染)、`requirement-reviewer`(确定性检查引擎:完整性/一致性/术语/验收标准/GWT)、`prd-export`(Word 导出)、`htmlPrototype`(HTML 原型生成)。

**分工让位规则**(全部烘焙在各技能 DSH 附注中):任何未点名的 PRD 类请求默认 `prd-craft`;各复刻技能只在被点名或命中专属信号(原型/用例/工作台/竞品/评审/MVP)时接管;prd-workflow 同时把「简单功能/紧急需求」导流给 prd-generator。
