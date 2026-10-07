## DSH 运行时适配（PRDCraft 注入）

- 产物写入当前工作区 `prd-workspace/<项目>/`（HTML/Markdown 报告、Source Index）。
- 信息采集表 `assets/intake-form.html`：宿主无法内嵌时，把该文件复制到输出目录并用浏览器打开，用户提交后将回传 JSON 粘贴回对话；无浏览器环境则退回文本清单逐项确认（格式未确认不得生成报告）。
- 公开信息采集用会话的 web_search / web_fetch 工具完成，URL 逐条登记进 Source Index；遵守 playbook 的合规边界（只取公开信息与用户材料）。
- HTML 报告严格使用 `references/report-template-pro.html` 模板；Markdown 版使用同一分区结构。
