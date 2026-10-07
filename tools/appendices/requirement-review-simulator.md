## DSH 运行时适配（PRDCraft 注入）

- 产物写入当前工作区 `prd-workspace/<项目>/`（存活率报告 HTML/Markdown、会议资产）。
- 信息采集表 `assets/intake-form.html`：复制到输出目录用浏览器打开，用户提交后把回传 JSON 粘贴回对话；或退回文本清单逐项确认。输出格式未经确认不得生成报告。
- 评分必须先读 `references/scoring-engine-deterministic.md` 并按其 9 步公式计算，禁止凭感觉打分；残酷度一旦确认不中途降级。
- HTML 报告严格使用 `references/report-template-pro.html`（深色卡片化布局，9 大分区固定）。
