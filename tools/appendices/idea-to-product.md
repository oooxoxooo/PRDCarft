## DSH 运行时适配（PRDCraft 注入）

- 产物（mvp.md / stories.md / ux-flow.md / checks.md / feedback.md）写入当前工作区 `prd-workspace/<项目>/`，与 prd-craft 的产物互通。
- 原子命令的详细规格在 `<skill-directory>/command/*.md`，按需加载。
- 浏览器检查：环境有 Playwright 时用 bash 直接执行生成的检查；没有则按命令文件中的手动步骤交付，并说明限制。
- **全局图规（DSH 约定）**：`ux-flow.md` 等 UX/操作流程图一律用 Mermaid `sequenceDiagram` 表达（人 `actor`、界面/系统 `participant`，分支 `alt/else`），不使用 `flowchart`/`graph`；详见 `prd-craft/references/dsh-enhancements.md`「时序图（全局图规）」。
