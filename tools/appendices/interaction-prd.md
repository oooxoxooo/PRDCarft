## DSH 运行时适配（PRDCraft 注入）

> 本节由 PRDCraft 打包时注入,用于把原版技能映射到 DSH 运行环境;正文其余部分保持原版。

### 与其他技能的分工

- **默认入口是 `prd-craft`**:未点名技能的常规「写 PRD / 需求文档」请求由 `prd-craft` 承接(Markdown PRD 流程)。
- **本技能的定位**:① 交互式 PRD 工作台(可交互网页原型、气泡标注、页面跳转画布、本地底座);② 从已有 Demo 代码还原产品事实再成文。用户只要纯静态 Markdown 文档时不要使用本技能(原版边界,继续有效)。

### 工作区与运行时约定

- 工作区统一放在共享产物目录下:初始化脚本用 `--root prd-workspace/<项目名>/interaction` 指定位置,生成 `<产品名>-workspace/`(示例见 prd-workspace/saas-member-points/interaction/)。不要在插件目录或工作区根创建工作区。
- `<skill-root>` 即本技能目录(`skills/interaction-prd/`),初始化脚本、references 相对它解析。
- **底座代码路径注意**:上游布局存在 `assets/runtime/runtime/` 双层 `runtime` 嵌套(外层是模板分发根,内层 `server/`+`public/` 才是真正的 Node 底座)。这是上游原始结构,不做改名,引用底座文件时以 `<skill-root>/assets/runtime/runtime/` 为准。
- 首次运行底座需要在该工作区内执行 `npm install` 与 `npm run dev`(依赖 html2canvas/marked/mermaid)。**这与「PRDCraft bundle 本体零依赖」不冲突**:bundle 安装本身零依赖零脚本;此处的依赖按需装进用户工作区,安装前按正文规则征得用户同意。
- 会话 agent 亲自执行 G0–G5 门禁式流程并等待用户确认;`npm run validate` 在每次模块交付前运行。
