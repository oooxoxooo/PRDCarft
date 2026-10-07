# 配套决策框架 · Decision Frameworks

产品管理专家方案中的跨技能配套框架：优先级排序、发布清单、发布后度量与技能联动场景。

## RICE 优先级

需求/功能排序统一公式：

```text
RICE 分数 = (Reach × Impact × Confidence) ÷ Effort
```

| 因子 | 含义 | 量纲 |
|---|---|---|
| Reach | 一个周期内触达的用户数 | 人/季度 |
| Impact | 对单个用户的体验提升 | 3=大 2=高 1=中 0.5=低 0=无 |
| Confidence | 对以上估计的信心 | 100% 高 / 80% 中 / 50% 低 |
| Effort | 投入 | 人·月 |

用法：PRD 1.4 功能列表与 backlog 排序时计算 RICE 并列出算式；分数高者先做；信心 < 80% 的条目标注需要先验证（联动 idea-to-product 出 MVP）。

## GTM 发布清单

上线前逐项确认（全部 ✓ 才能发）：

1. **产品文档** — PRD 定稿、用户帮助、变更说明。
2. **内部培训** — 客服/运营/销售的话术与培训完成。
3. **灰度方案** — 灰度比例、放量节奏、观察指标。
4. **回滚标准** — 什么信号出现即回滚、回滚操作人与步骤。
5. **度量指标** — 核心指标与看板就绪（对齐 PRD 1.3 业务目标）。
6. **客户沟通计划** — 公告、通知文案、触达渠道。

## 30/60/90 天发布后度量

上线不是终点，验证需求假设才是：

| 时点 | 看什么 | 动作 |
|---|---|---|
| 30 天 | 核心指标是否朝目标方向移动；早期用户反馈与投诉主题 | 偏离明显 → 定位原因，小步修正 |
| 60 天 | 指标趋势是否稳固；次级指标（留存/满意度）是否受损 | 趋势确立 → 固化运营配置；受损 → 权衡取舍上报 |
| 90 天 | 对照 PRD 1.3 业务目标做假设验证结论 | 成立 → 加注下一迭代（iteration 模式）；不成立 → 回到竞品调研/idea-to-product 重新收敛 |

## 技能联动场景（PRDCraft 全家桶）

> **权威路由以 `../SKILL.md` 的路由表为准**；本节是场景视角的补充说明，两者不一致时以路由表为准。

四个技能覆盖产品全生命周期，按以下链路协同（中间产物都在 `prd-workspace/<项目>/` 互通）：

```text
新功能规划
→ competitive-product-research（竞品对标，提供差异化依据）
→ prd-craft / prd-workflow（访谈 → 拆解 → PRD → 评审 → 流程图 → 原型 → 导出）
→ requirement-review-simulator（评审会前攻防预演 + 存活率体检）
→ 上线 GTM 清单 → 30/60/90 天度量
→ 需要快速验证的想法 → idea-to-product（MVP 闭环）
```

| 场景 | 用哪个技能 | 衔接点 |
|---|---|---|
| 不知道该学谁、差在哪 | competitive-product-research | 报告的 P0 建议 → PRD 1.5 竞品分析；落地建议可直接进功能列表 |
| 写 PRD（轻量、DSH 原生、Excalidraw 手绘时序图） | prd-craft | interview.json 可被 prd-workflow 复用 |
| 写 PRD（完整工具链：代码化流水线 + HTML 原型 + 设计系统） | prd-workflow | 10 步流水线 + 6 流程模板 + 版本管理 + 5 内置子技能 |
| 评审会前预演、跨部门博弈 | requirement-review-simulator | 行动清单的 P0 项补齐后回到 prd-craft 复核质检 |
| 想法太快太大，先收敛 | idea-to-product | 闭环跑通后把 mvp.md/stories.md 喂给 prd-craft 生成正式 PRD（简化访谈） |
| 优先级打架 | 本文件 RICE | 算式写进 PRD 1.4 |
| 要上线了 | 本文件 GTM + 30/60/90 | 回滚标准与度量指标对齐 PRD 1.3 |

## 三套评审机制对照（防误用）

PRDCraft 内有三套评审能力，定位正交、不可互相替代：

| 机制 | 所在位置 | 什么时候用 |
|---|---|---|
| 静态自检（check_items.py 14 项，CORE/COMPLETE/OPTIMIZE） | prd-workflow 资产，prd-craft / prd-workflow 流程内步骤 3 | PRD 成文后的常规自评审，写 `review-report.md` |
| 确定性检查引擎（requirement-reviewer 子技能） | prd-workflow 内嵌 `skills/requirement-reviewer/`，仅被其 10 步流水线调用 | 走 prd-workflow 完整流水线时的自动质检，不独立使用 |
| 五角色攻防模拟（requirement-review-simulator 技能） | 独立技能 | 评审会前预演、跨部门博弈压力测试；P0 行动项补齐后回 prd-craft 复核质检 |
