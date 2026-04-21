---
name: init-web
description: Web 项目脚手架（Tier T1/T2/T3/TB）。编排调用 scripts/scaffold.py 生成 frontend/ 和/或 backend/ 骨架，再用 scripts/apply_design_tokens.py 将 DESIGN.md 的 tokens 注入 Tailwind @theme。被 /init-project 内部调用，也可独立运行以重装脚手架。
user-invocable: true
---

# Web 脚手架搭建

职责边界：**只搭脚手架**，不做需求访谈（那是 /init-project 的事），不做设计决策（那是 /ui-ux-pro-max 或 /design-skill 的事）。

技术栈锁定：前端 Vue 3 + Vite + TS + Tailwind v4；后端 FastAPI + uv + SQLModel + pydantic-settings。

## Tier 矩阵

| Tier | 场景 | 含内容 |
|------|------|--------|
| **T1** | 静态单页 / landing / 作品集 | Vue + Vite + Tailwind + iconify + vueuse |
| **T2** | 多页 SPA / 博客 / 工具站 | T1 + vue-router + pinia |
| **T3** | 中后台 / SaaS 工作台 | T2 + shadcn-vue + lucide-vue-next |
| **TB** | 纯后端 API | FastAPI + SQLModel + pydantic-settings（`[standard]`） |

前台 + 后端组合：`--tier T1/T2/T3 --backend`，后端按 TB 叠加。

## Step 1：确认 Tier

若 `/init-project` 已通过 `$ARGUMENTS` 或上下文带入 `tier` 和 `backend` 标志 → 跳过问询。

否则交互问用户：
- A. 静态展示站 → T1
- B. 多页应用 / 博客 → T2
- C. 中后台 / SaaS → T3
- D. 纯后端 API → TB
- 是否同时需要后端？（A/B/C 场景下追问）

## Step 2：运行脚手架脚本

```bash
python .claude/skills/init-web/scripts/scaffold.py \
  --tier <T1|T2|T3|TB> \
  --name "<项目名>" \
  [--backend] \
  [--root .]
```

脚本内部完成：
- npm create vite + npm install + tailwind v4 安装
- 写入 `vite.config.ts` / `src/style.css` / `src/main.ts`（Tier 差异化）
- 补全 `tsconfig.app.json` 的 `@/*` paths
- T3 额外提示调用方运行 shadcn-vue init（需要交互式 TTY，不适合放进脚本）
- 后端：`uv init backend --app` + `uv add fastapi[standard] sqlmodel pydantic-settings`，生成 `app/{api,core,db,models,schemas,services}` 骨架 + `.env.example`

最后一行 stdout 是 JSON 摘要，读取它拿到 frontend_path / backend_path / deps / next_steps。

## Step 3：应用 DESIGN.md（若存在）

```bash
python .claude/skills/init-web/scripts/apply_design_tokens.py \
  --design-md ./DESIGN.md \
  --target frontend/src/style.css
```

脚本解析 DESIGN.md 的 Color Palette / Typography / Layout 章节，覆写 `@theme` 块。若 DESIGN.md 尚未就绪，**跳过这一步** —— /init-project 会把"应用 DESIGN.md 到 @theme"放进 task.json 作为首个 /work 任务。

T3 项目额外：如 `frontend/components.json` 存在，同步 `baseColor` 字段（手动编辑即可）。

## Step 4：验证

- 前端：`cd frontend && npm run build` 必须零 error
- 后端：`cd backend && uv run python -c "from app.main import app"` 必须零 error
- 任一失败 → 修复后重试，不要跳过

## Step 5：汇报

固定格式输出：

```
✅ 脚手架完成（Tier: T<n>[+ backend]）

【已装】
前端：<frontend_deps>
后端：<backend_deps>

【启动命令】
前端：cd frontend && npm run dev
后端：cp backend/.env.example backend/.env && cd backend && uv run fastapi dev app/main.py

【下一步】
<next_steps from JSON>
```

## 防幻觉原则

- **图标唯一来源**：`@iconify/vue`（通用） + `lucide-vue-next`（仅 T3 shadcn-vue）。禁止安装其他独立图标包。
- **版本锁定**：`package-lock.json` 和 `uv.lock` 必须提交。禁止生成 `requirements.txt`。
- **类型至上**：TS strict 模式；后端所有路由必须有 `response_model`；SQLModel 与 Pydantic schema 分层。
- **环境变量**：`.env.example` 提交，`.env` 进 `.gitignore`，配置走 pydantic-settings。
