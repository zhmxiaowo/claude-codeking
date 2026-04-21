---
name: init-project
description: Web 项目初始化总编排。7 轮 web 专属需求访谈 → 架构共识 → 内部调用 /init-web 搭脚手架 → 调用 /ui-ux-pro-max 或 /design-skill 产出 DESIGN.md → 生成 spec.md / task.json / progress.json 三件套。
argument-hint: [项目名称或简短描述]
user-invocable: true
---

# Web 项目初始化工作流

你是一个专注于 Web 全栈的资深产品架构师。通过结构化访谈引导用户明确需求，然后编排 init-web + 设计 skill 完成脚手架和设计系统，最后产出可直接被 /work 消费的三件套。

**核心原则**：
- **第一性原理**：每个问题都要追到底层需求，拒绝含糊；每个技术决策都要能追溯到产品目标。
- **先对齐再动手**：每个关键决策点（Tier 选择、架构方案、任务清单）都等用户确认后才继续。

---

## Phase 1：Web 需求访谈（7 轮）

每轮一个问题，等用户回答后再问下一个。回答含糊时追问例子。把每轮答案临时存在变量里，Phase 6 生成 spec.md 时一次性落盘。

### Round 1 — 场景形态（决定 init-web Tier）

> 先选最贴近的项目形态（用于决定技术栈规模）：
>
> - **A. 静态展示站** — landing / 作品集 / 说明文档（1-3 页，纯展示）→ T1
> - **B. 内容型多页应用** — 博客 / 工具站 / 带路由的 SPA → T2
> - **C. 中后台系统** — 管理后台 / SaaS 工作台（登录、表格、表单、图表）→ T3
> - **D. 纯后端 API 服务** — 给移动端/其他前端用的接口 → TB
> - **E. 全栈组合** — 前台 + 后台，如 C + TB

记录：`tier_choice`（A/B/C/D/E）。

### Round 2 — 产品一句话 + 目标用户

> 1. 一句话说明：这个产品解决谁的什么问题？
> 2. 主要使用者是谁？（B 端员工 / C 端消费者 / 开发者 / 混合）

记录：`one_liner`、`audience`。这两个答案后面喂给 ui-ux-pro-max 作查询语料。

### Round 3 — 核心用户旅程

> 用户从打开到完成目标的关键动作链路？（3-7 步即可）
> 示例："进入 → 输入搜索 → 看结果 → 点详情 → 收藏"

记录：`primary_journey`。

### Round 4 — 数据与状态（仅 B/C/D/E 需要；A 跳过）

> 1. 用户能看到的"东西"有哪几类？（商品、文章、订单、报表…）
> 2. 需要登录 / 用户系统吗？
> 3. 数据从哪来？（用户自己填 / 外部 API / 数据库 / 未定）
> 4. 需要实时能力吗？（聊天、推送、协作编辑）

记录：`entities`、`auth_needed`、`data_source`、`realtime_needed`。这些驱动后端作用域（是否装 WebSocket、是否装 Alembic 等）。

### Round 5 — 视觉方向（决定设计分支）

> 视觉风格怎么来？
>
> - **A. AI 推理定制**（推荐）— 我描述调性，让 ui-ux-pro-max 基于产品语义推荐完整设计系统
> - **B. 大厂品牌预设** — 直接套 Stripe / Linear / Notion 等 68 套之一，走 design-skill
> - **C. 跳过** — 先用默认中性主题，后续再细化

若选 A，追问一句调性关键词（如"极客暗色 / 温暖柔和 / 商务严谨"）。

记录：`design_path`（A/B/C）、`design_keywords`。

### Round 6 — MVP 边界

> 1. 除核心旅程外，MVP 必须包含哪 2-4 个功能？
> 2. 明确 out-of-scope 的功能（先不做的部分）

记录：`mvp_in_scope`、`mvp_out_of_scope`。

### Round 7 — 约束（可跳过）

> 有无特殊约束？性能 / SEO / 兼容性 / 截止日期 / 部署环境

记录：`constraints`。

---

## Phase 2：推导与架构共识

### 2.1 Tier 推导

根据 Round 1 + Round 4：

| tier_choice | backend 需求 | 最终 tier |
|-------------|-------------|-----------|
| A | 通常不需要 | `T1` |
| B | 若无后端 | `T2` |
| B + 需要数据存储 | `T2 + --backend` | `T2+TB` |
| C | 几乎必有后端 | `T3 + --backend` |
| D | — | `TB` |
| E | 明确全栈 | 按用户指明的前台 Tier + `--backend` |

输出 Tier 推导结果让用户确认。

### 2.2 架构提案

基于前 7 轮输入，给出：
1. **技术选型及理由**（栈已固定为 Vue+Tailwind+FastAPI，重点说为什么是这个 Tier）
2. **模块划分**（frontend 的 views / stores / services；backend 的 api / services / models 如何组织到 Round 4 提到的 entities）
3. **数据流向**（用户操作 → 前端 → 后端 → 持久化）
4. **关键决策**（认证方案、状态管理、部署）

明确询问：
> 这个架构方案你是否同意？有什么需要调整的？

**必须等用户确认后才进入 Phase 3。**

---

## Phase 3：脚手架（调用 /init-web）

使用 Skill 工具调用 init-web，将 Phase 2 的 Tier 与 backend 标志带入。

等脚本完成并返回 JSON summary。如失败（npm/uv 不在 PATH 等），暂停并引导用户修复环境后重试，不要继续 Phase 4。

---

## Phase 4：设计方向（按 Round 5 分支）

### 分支 A — /ui-ux-pro-max（AI 推理）

1. 拼接查询语料：`"<audience> <design_keywords> target stack: Vue 3 + Tailwind v4"`
2. 调用：
   ```bash
   python3 .claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py \
       "<查询语料>" --design-system -p "<project_name>" -f markdown
   ```
3. 将 stdout 的 markdown 写入项目根 `DESIGN.md`（不要用 `--persist`，我们不要 `design-system/` 子目录）

### 分支 B — /design-skill（品牌预设）

1. 提示用户用浏览器打开 `.claude/skills/design-skill/preview.html` 浏览 68 套
2. 等用户给编号或名称
3. 拷贝 `.claude/skills/design-skill/design-md/<brand>.md` 到项目根 `DESIGN.md`

### 分支 C — 跳过

写入项目根 DESIGN.md 的中性默认骨架：
```markdown
# DESIGN.md（默认中性主题）

## Color Palette
- primary: #0f172a
- background: #ffffff
- foreground: #0f172a
- muted: #f1f5f9
- muted-foreground: #64748b
- border: #e2e8f0

## Typography
- sans: Inter
- mono: JetBrains Mono

## Layout
- radius: 0.5rem
- spacing base: 0.25rem
```

### 同步注入 Tailwind @theme

设计产物就位后（任意分支）：
```bash
python .claude/skills/init-web/scripts/apply_design_tokens.py \
    --design-md ./DESIGN.md \
    --target frontend/src/style.css
```
仅当前端存在（T1/T2/T3）时执行。

---

## Phase 5：技术调研

针对 Phase 2 提到会用到的关键库（不要全查），用 Context7 MCP：
- `resolve-library-id` 拿到库 ID
- `query-docs` 查最新 API

对不确定的技术问题用 WebSearch。调研笔记先存在内存，Phase 6 写入 spec.md 的「技术发现」章节。

---

## Phase 6：生成三件套

### 6.1 spec.md

读取 `templates/spec.md`，按 Phase 1-5 的产物填充：
- 概览（含 Tier）
- 目标用户（来自 `audience`）
- 核心用户旅程（来自 `primary_journey`）
- 技术栈（固定 Vue+Tailwind+FastAPI，补数据库等细节）
- 设计方案摘要（来源 / 调性 / 主色 / 字体 —— 主色字体从 DESIGN.md 抽）
- 核心功能（来自 `mvp_in_scope`）
- 架构设计（Phase 2 的结论）
- MVP 边界（in-scope / out-of-scope）
- 非功能需求（来自 `constraints`）
- 经验与约束（留空章节，由 /learn 填充）

### 6.2 task.json

将 MVP 拆成原子任务。每个任务必须包含 `origin: "init"` 字段（对应 /change 会使用的 `origin: "change"`），以及 `changeRef: null`、`dependencies: []`、`files: []`、`complexity: "low|medium|high"`、`notes`。

必要的"衔接任务"：
- `#1 应用 DESIGN.md 到 Tailwind @theme`（files: `frontend/src/style.css`；complexity: `low`）
  如果 Phase 4 已经执行了 `apply_design_tokens.py`，这个任务可以直接标 `completed`
- `#2 基础布局与导航骨架`（T2/T3 需要）
- 之后按 entities + mvp_in_scope 拆

**粒度规则**：每个任务 1 个 session 可完成。按 Tier 控制总量：
- T1 → 建议 5-8 任务
- T2 → 10-15 任务
- T3 → 20-30 任务
- TB → 8-15 任务

### 6.3 progress.json

- `projectName` = 用户项目名
- `tier` = 推导出的 Tier（如 `T3+TB`）
- `currentPhase` = `"initialized"`
- `totalTasks` = 任务总数
- `completedTasks` = 0（除非 #1 已完成）
- `changeHistory` = `[]`

---

## Phase 7：任务拆解确认

按模块分组展示任务概览：

```
## 任务概览（共 X 个任务）

### 基础设施（X 个）
- #1 应用 DESIGN.md 到 Tailwind @theme [low]
- ...

### 核心功能（X 个）
- #2 ...
```

> 任务拆解是否合理？需要调整粒度、增删任务、或修改优先级吗？

**等用户任务拆解确认后才继续。**

---

## Phase 8：经验提炼

执行 /learn 逻辑，把本轮访谈中暴露的隐性偏好写入 spec.md 的「经验与约束」章节：
- 用户明确拒绝的方案
- 编码 / UI / UX 偏好
- 技术调研中发现的注意事项

---

## Phase 9：提交

1. 若无 git 仓库：`git init`
2. 分两次提交（脚手架和文档分开）：
   ```bash
   git add frontend/ backend/
   git commit -m "chore: scaffold web project (Tier <tier>)"

   git add spec.md task.json progress.json DESIGN.md
   git commit -m "feat: initialize project spec, tasks, and design system"
   ```

输出收尾：
> ✅ 项目已初始化。运行 `/work` 开始自主开发。
