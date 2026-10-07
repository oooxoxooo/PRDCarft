# PRDCraft

DSH（DeepSeek Harness）bundle · 产品管理专家技能包。安装后向会话技能目录注入 7 个技能，覆盖产品全生命周期：调研 → PRD → 评审 → MVP 验证。

## 技能清单

| 技能 | 来源 | 用途 | 触发示例 |
|---|---|---|---|
| `prd-craft` | PRDCraft 原创主入口 | 路由器 + DSH 增量层：中文默认入口，流程/模板/检查项/门禁统一指向上游资产，叠加 Excalidraw 手绘时序图、persona、竞品节、office-docx 导出；RICE/GTM/30-60-90 决策框架 | “帮我写一个会员积分功能的 PRD” |
| `prd-workflow` | prd-workflow v5.1.0 原版复刻 | 完整 10 步流水线（precheck→访谈→拆解→PRD→评审→流程图→设计→原型→导出→质检）+ 6 流程模板 + 版本管理 + 5 个内置子技能（ui-ux-pro-max / mermaid-flow / requirement-reviewer / prd-export / htmlPrototype）+ workflows 代码与模板 | “用 prd-workflow 生成产品准入功能的 PRD” |
| `prd-generator` | mpf0418/prd-generator v1.0.0 原版复刻 | UML 用例驱动 PRD：用例模型、用例规格、数据字典、交互设计、UI 规范；简单功能/紧急需求快速一次性成文（默认入口仍是 prd-craft） | “用 UML 用例建模写这份 PRD” |
| `interaction-prd` | comeonzhj/interaction-prd v0.8.0 复刻 | 门禁式（G0–G5）交互 PRD 工作台：可交互网页原型、气泡标注、页面跳转画布、本地底座；支持从 Demo 代码还原产品事实 | “把想法做成可交互的 PRD 工作台” |
| `competitive-product-research` | v1.4.8 原版复刻 | 双轨竞品调研：体验八维（D1–D8）+ 战略诊断（SWOT/五力/PESTLE），健康度确定性评分，SRC 证据溯源 HTML/Markdown 报告 | “小红书和我们比首帖链路差在哪” |
| `requirement-review-simulator` | v1.2.8 原版复刻 | 五角色评审攻防模拟：三级残酷度、确定性评分引擎（S/A/B/C + Go 结论）、存活率报告 + 会议资产四件套 | “模拟评审一下这份 PRD” |
| `idea-to-product` | v0.1.1 原版复刻 | idea → MVP → 故事卡 → UX 流程 → Playwright 检查 → 反馈闭环（5 原子命令） | “这个想法先收敛成 MVP” |

## 原版复刻说明

6 个原版技能完整保留其 SKILL.md 正文、references、assets、模板与脚本（MIT-0 许可）。打包时做了最小化适配，均清晰标注、不涉及能力语义：① frontmatter 规范化为单行描述（多行 `>-` 块改为等价单行，便于技能目录索引），并补充独立 `whenToUse`；② 在 SKILL.md 末尾追加标注为「DSH 运行时适配（PRDCraft 注入）」的章节，映射 OpenClaw 概念到 DSH（工作区路径、agent 驱动执行、采集表单与报告模板的使用方式、与其他技能的分工让位）。所有技能共享 `prd-workspace/<项目>/` 产物目录（`interaction-prd` 的工作区在其 `interaction/` 子目录下）。

## 安装

任选其一（效果等价）：

```sh
# npm 安装（发布后）
dsh plugin --profile <你的profile> add prdcraft

# tarball / 本地路径 / git
dsh plugin --profile <你的profile> add /path/to/prdcraft-3.1.1.tgz
dsh plugin --profile <你的profile> add github:<owner>/prdcraft
```

或打开 DSH Web 侧边栏 **Plugins** 页粘贴安装目标。零运行时依赖、无构建脚本，安装不需要任何脚本审批。

## 卸载

```sh
dsh plugin --profile <你的profile> remove prdcraft
```

## 技能内容维护

- **架构决策**：`docs/architecture.md` —— v3.0.0 路由器化设计（已执行）：prd-craft 为路由器 + DSH 增量层，权威流程/模板/检查项统一指向上游 prd-workflow 资产，两入口产出同一格式。
- `prd-craft`：`skills/prd-craft/SKILL.md` 与 `references/`，直接编辑即生效（下次加载重读）。
- 原版技能：对应 `skills/<名称>/` 目录；DSH 适配附注的唯一事实源在 `tools/appendices/<技能名>.md`。
- **上游升级流程**：下载新版技能包 → `node tools/bake.mjs --skill <技能名> --src <新版目录>`（`--src` 必须与 `--skill` 连用；整包覆盖 + 上游非功能资产自动裁剪 + frontmatter 规范化 + 附注重烘焙，幂等）→ **重放本地补丁**（见下）→ `node tools/verify.mjs` 自检 → 重装 bundle。
- **自动裁剪（PRUNE）**：bake 每次运行都会删除各技能的上游非功能资产（ClawHub 市场卡片 `skill-card.md`、发布脚本与配置、宣传截图 `docs/images/`、演示样例、过时文档 `SKILL_USAGE.md` 等，v3.1.1 实证约 1MB/20+ 文件）。裁剪清单唯一事实源在 `tools/bake.mjs` 的 `PRUNE`，`verify.mjs` 导入同一清单断言 tarball 不含这些路径——新增裁剪项只改 bake.mjs 一处。
- **本地补丁（bake 覆盖后必须重放）**：`prd-workflow` 相对上游 v5.1.0 有两处刻意偏离，`bake --src` 整包覆盖会将其冲掉：① 子包 `package.json`（`{"type":"commonjs"}`，使 workflows 代码可在本 ESM 包中被 `node` 直接运行）；② `workflows/quality_gates.js` 中标注「PRDCraft 补全」的 gate5-9 定义。重放后跑 `verify.mjs`——两者的存活均已被断言（commonjs 断言 + gate5-9 断言），缺失即红。（`interaction-prd` 的仓库维护资产重删已由 PRUNE 自动化，无需人工。）
- `index.js` 改动需重启 DSH 生效（模块缓存）；`tools/` 与技能内容改动即时生效（每次加载重读文件）。

## 已知设计决策

- **零依赖**：pnpm 对 `link:` 安装不装依赖，故 frontmatter 解析器内置（支持块标量/嵌套 map）；坏一个 SKILL.md 只跳过该技能（per-skill 容错），不影响其余技能。
- **直接运行 prd-workflow 代码**必须带 `CUSTOM_OUTPUT_DIR` 指向工作区，否则产物会写进插件目录（详见该技能的 DSH 适配附注）。`skills/prd-workflow/` 内置 `{"type":"commonjs"}` 的 package.json，使 workflows 代码可在本 ESM 包中被 `node` 直接运行。
- **上游技能目录中的 ClawHub 资产已被裁剪**：`skill-card.md`、`INSTALL.md`、`clawhub.json`、发布/测试脚本、宣传截图、演示样例、`SKILL_USAGE.md` 等不随 bundle 分发（运行时零作用，agent 也不读取）；`postinstall.js` 是唯一保留的上游安装资产（理由见下条）。上游 README 中的截图/示例链接因此可能断链，属预期。
- **interaction-prd 是唯一需要运行时依赖的技能**：其底座依赖（html2canvas/marked/mermaid）按需装进用户工作区（`npm install`），不随 bundle 安装。
- **postinstall.js 随包分发但不被 DSH 执行**：`skills/prd-workflow/scripts/postinstall.js` 是上游为 ClawHub 原生安装路径保留的资产（安装后自动装 mermaid-cli 等），内含 `npm install -g` 与 `pip3 --break-system-packages`。DSH 经 `link:`/tarball 安装 bundle 不会触发任何 lifecycle 脚本；仅当用户把 `skills/prd-workflow` 单独当 npm 包在 ClawHub 语境安装时才会执行，届时按其提示逐项确认即可。

## 致谢

- [prd-workflow](https://clawhub.ai/gotomanutd-dot/skills/prd-workflow) by gotomanutd + 红曼为帆（MIT-0）
- [prd-generator](https://clawhub.ai/user/mpf0418) by mpf0418（MIT-0）
- [interaction-prd](https://github.com/comeonzhj/interaction-prd) by comeonzhj
- [competitive-product-research](https://hub.openclaw.ai/chris1wang3/skills/competitive-product-research) by Chris Wang（MIT-0）
- [requirement-review-simulator](https://hub.openclaw.ai/chris1wang3/skills/requirement-review-simulator) by Chris Wang（MIT-0）
- [idea-to-product](https://hub.openclaw.ai/whyy9527/skills/idea-to-product) by whyy / ClawAether（MIT-0）

## License

MIT（PRDCraft 部分）；内置原版技能遵循各自 MIT-0 许可
