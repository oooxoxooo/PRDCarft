# Excalidraw 时序图转写规范

把 PRD 中的 Mermaid `sequenceDiagram` 源转写为 Excalidraw 手绘风格文件（`.excalidraw`）。Excalidraw 天然手绘：线条由 rough.js 绘制，`roughness` 控制抖动，无需任何额外样式设置即可获得手绘外观。

## 文件骨架

每个 `.excalidraw` 文件是一个 JSON：

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [],
  "appState": { "viewBackgroundColor": "#ffffff", "gridSize": null },
  "files": {}
}
```

## 元素通用字段

每种元素都携带以下字段；`seed`、`versionNonce` 用互不重复的随机正整数（seed 决定手绘抖动的随机形状），`updated` 用当前毫秒时间戳：

```json
{
  "id": "唯一id",
  "type": "rectangle | text | line | arrow",
  "x": 0, "y": 0, "width": 0, "height": 0,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "hachure",
  "strokeWidth": 2,
  "strokeStyle": "solid | dashed",
  "roughness": 1,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": null,
  "seed": 1001,
  "version": 1,
  "versionNonce": 1002,
  "isDeleted": false,
  "boundElements": null,
  "updated": 1760000000000,
  "link": null,
  "locked": false
}
```

专有字段：

- **rectangle**：`"roundness": { "type": 3 }`（圆角手绘矩形）
- **text**：`text`、`originalText`（同 `text`）、`fontSize`、`fontFamily: 1`（Virgil 手绘字体；中文自动回退系统字体，正常显示）、`textAlign: "center"`、`verticalAlign: "middle"`、`containerId`（绑定容器 id 或 null）、`autoResize: true`、`lineHeight: 1.25`
- **line / arrow**：`points`（相对坐标数组，首点恒为 `[0,0]`；`x`/`y` 是绝对起点）；arrow 加 `startArrowhead: null`、`endArrowhead: "arrow"`、`startBinding`/`endBinding`（本规范固定用 `null`，靠坐标对齐生命线）

## 布局公式（时序图）

按下列公式布点，一张 4 参与方、12 条消息的图约 60-80 个元素，全部机械生成：

| 对象 | 坐标 |
|---|---|
| 参与方框 | `w=160, h=48`；第 i 个（0 起）`x = 40 + i*260`，`y = 40`；生命线 x = `x + 80` |
| 参与方标签 | text 绑定到框（`containerId` = 框 id，框的 `boundElements` 含该 text id） |
| 生命线 | dashed `line`，从 `(生命线x, 96)` 向下 `points: [[0,0],[0, 图高-96]]` |
| 消息行 | 第 j 条（0 起）`y = 140 + j*56` |
| 消息箭头 | solid `arrow`，起点 `(源生命线x, 行y)`，`points: [[0,0],[目标生命线x - 源生命线x, 0]]` |
| 消息标签 | text 放箭头上方：`x = 两生命线中点 - 40, y = 行y - 30`，`fontSize 16`，`textAlign: "center"` |
| 自回环消息 | `points: [[0,0],[36,0],[36,28],[0,28]]`，标签放回环右侧 `x+48` |
| 交互框（alt/opt/loop/par/critical） | dashed `rectangle`：`x = 覆盖的最左生命线 - 100`，`y = 首行 - 36`，`w = 最右生命线 - x + 100`，`h = (末行 - 首行) + 72`；左上角 text 标签（`x+12, y+8`，`fontSize 16`），内容如 `alt 权重不足100%`、`loop 每日循环` |
| else 分隔 | 交互框内水平 dashed `line`，`y = 分支首行 - 28`，附 `else <条件>` 小标签 |
| 图高 | `140 + 消息数*56 + 80` |

## 手绘风格参数

- `roughness: 1`（手绘标准档；0 是规整，2 是夸张涂鸦）
- `fillStyle: "hachure"`（手绘排线填充）
- `strokeWidth: 2`（元素主线）、`1`（文本）
- 参与方底色区分类型：人 `#ffec99`（黄），系统 `#a5d8ff`（蓝），第三方 `#b2f2bb`（绿）；`backgroundColor: "transparent"` 用于消息箭头与生命线
- 生命线与交互框 `strokeStyle: "dashed"`，其余 `solid`

## 转写流程

1. 从 PRD 对应章节取 Mermaid 源，先校验：参与方、消息、交互块齐全。
2. 按布局公式计算全部元素坐标，生成 JSON。
3. 自检（见下）通过后写入 `diagrams/<名称>.excalidraw`。
4. PRD.md 中 Mermaid 块下一行加链接：`**手绘版**：[diagrams/xxx.excalidraw](diagrams/xxx.excalidraw)`。

## 自检清单

- JSON 可解析；`type: "excalidraw"`、`version: 2` 齐全。
- 所有 `id` 全局唯一；所有 `seed`/`versionNonce` 互不相同。
- 坐标无负值；箭头 `points[0]` 为 `[0,0]` 且 `x/y` 为绝对起点。
- 绑定关系双向一致：text 的 `containerId` ↔ 容器 `boundElements`。
- 每个 Mermaid 参与方都有框 + 生命线；每条消息都有箭头 + 标签；每个交互块都有框 + 标签（+ else 分隔线）。
- 与 Mermaid 源逐条对应：消息数、交互块数一致。

## 兜底与人工路径

- **粘贴转换**：excalidraw.com → 更多工具 → Mermaid to Excalidraw，粘贴 Mermaid 源直接转成手绘元素（官方转换器支持时序图全部语法含交互块），适合人工微调排版。
- **导出 PNG**：Excalidraw 打开 → Export → PNG（2x），存 `diagrams/` 同名 `.png`，用于 Word 导出与汇报材料嵌入。
- 生成的 `.excalidraw` 可在 excalidraw.com、VS Code Excalidraw 扩展、Obsidian Excalidraw 插件中打开编辑。
