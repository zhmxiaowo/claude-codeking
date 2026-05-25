---
name: work
description: 持续自主开发循环。从 task.json 取任务，执行「规划→实现→评审→编译→验证→提交」循环，直到全部完成、全部阻塞或用户停止。
argument-hint: <可选：指定任务ID>
user-invocable: true
---

# 持续自主开发循环

`/work` 是持续开发的唯一状态机。一次只做一个 task，完成后立即取下一个可执行 task。

**永不停止**：除非全部任务完成、全部可执行任务阻塞、用户运行 `/stopwork`，或遇到不可恢复错误。

## Startup 启动

Startup 是项目核心上下文装载：进入 `/work` 时，必须确保当前上下文已经完整包含最新的 `spec.md`、`task.json`、`progress.json`、可选 `experience.md`，以及当前 `projectType` 对应 rules。

1. 检查项目根目录是否同时存在 `spec.md`、`task.json`、`progress.json`；任一缺失则提示用户先运行 `/init-project` 并停止。
2. 如果这些核心文件在当前上下文中完整、可信、未过期，则不重复读取。
3. 如果核心文件缺失、不确定、压缩后只剩摘要，或相关文件发生变化，则全量读取 `spec.md`、`task.json`、`progress.json`；若存在 `experience.md`，也全量读取。
4. 如果无法可靠判断核心上下文是否完整，按缺失处理并全量读取。
5. 根据 `progress.json.projectType` 读取唯一对应规则：
   - `web` → `.agents/rules/web.md`
   - `game-engine` → `.agents/rules/game-engine.md`
6. 若存在 `.codex/.work-stop`，读取停止原因，删除该文件，然后继续恢复。
7. 运行 `node .codex/hooks/scripts/next-task.js` 获取当前任务；脚本会跳过 `completed`、`blocked`、`cancelled` 和依赖未完成的 pending 任务。
8. 若无输出且 `progress.currentPhase = "completed"`，输出完成摘要并停止。
9. 若输出 blocked 摘要，报告阻塞任务并停止。
10. 若选中 pending 任务，将 `status = "in_progress"`，并更新 `progress.currentPhase = "in_progress"`、`progress.currentTask = { id, title }`。
11. 检查 `git status --short`，确认工作区风险。

Startup 后，任务选择只通过 `next-task.js`；不要为了找下一个任务反复全量读取 `task.json`。只有核心上下文不完整、状态更新后需要确认、脚本异常或文件变化时，才补读相关文件。

## Step 1: Plan 规划

- 使用 Startup 已读全局上下文和 `next-task.js` 输出作为当前任务上下文。
- 读取当前任务的 `description`、`dependencies`、`doneWhen`、`verificationLevel`、`files`。
- 只补读当前任务需要的源码、设计片段和错误定位上下文。
- 使用 Context7 查询新增或不确定的库 / 框架 API；同一 API 已查证过则复用结论。
- 源码取证先用 `rg -l` 定位候选文件，再用 `rg -n -C` 或窄范围读取确认。
- 输出简短实施计划：实现点、`doneWhen`、第一验证动作、是否需要 code-reviewer 或 qa-verifier；不要写冗长设计文档。

## Step 2: Implement 实现

- 按 `AGENTS.md`、Startup 已加载项目规则和当前 task 实现。
- 保持变更聚焦于当前 task 的 `files` 和必要邻近文件。
- 不添加投机性代码，不为未来任务提前抽象。
- 多条 shell、HTTP/RPC、Editor 操作优先沉淀为项目脚本后运行。

## Step 3: Review 评审

先做作者自检：
- 对照 `doneWhen` 检查完成条件。
- 检查失败路径、异常输入、资源释放和回滚路径。
- 检查是否引入不必要抽象或范围膨胀。

满足任一条件时执行独立评审流程：
- 涉及公开接口、跨模块契约、并发、持久化、鉴权、安全、数据迁移。
- 修改多个核心模块或核心 runtime/editor 路径。
- 实际 diff 显示风险高于普通局部任务。

如执行独立评审：
- 只传入当前任务变更文件。
- 修复所有 critical 问题和置信度 >= 80 的 warning 问题。

## Step 4: Build 编译验证

编译验证是硬门禁，必须零 error。

Web 项目：
- 依赖缺失时先安装依赖。
- 优先运行最窄类型 / 编译检查：`npx tsc --noEmit`、`npm run typecheck` 或等价命令。
- 如存在 build script，再运行 `npm run build` 或 `pnpm build`。

游戏项目：
- Unity：`Unity -batchmode -nographics -logFile - -quit -projectPath .`
- Unreal：使用 UnrealBuildTool 编译。
- Cocos：`npm run build` 或 `cocos compile`。

编译日志写入文件或限制为错误摘要；只回读 error、warning 和必要尾部上下文。编译失败则修复后重跑。

## Step 5: Test 验证

按 `verificationLevel` 执行：
- `local`：局部单测、类型检查、编译烟雾、纯逻辑验证。
- `slice`：只验证当前任务的一条功能闭环。
- `milestone`：执行独立 QA 流程，验证完整模块或连续任务主路径。
- `release`：执行独立 QA 流程，做完整回归。

当且仅当满足以下之一时升级为独立 QA：
- `verificationLevel = milestone` 或 `release`。
- 当前任务改变主用户路径、跨模块集成、核心 runtime/editor 闭环。
- 用户明确要求独立 QA。

视觉相关 task 使用 Playwright 验证渲染、控制台错误和 `doneWhen` 闭环。

## Step 6: Commit 提交

1. `git add` 当前任务功能变更文件，不使用 `git add -A`。
2. `git commit -m "feat/fix/refactor: [任务标题] - task #[id]"`。
3. 将任务从 "in_progress" 改为 "completed"。
4. 更新 `progress.json`：
   - `completedTasks += 1`
   - `currentTask = null`
   - `lastSession.date = 当前 ISO 时间`
   - `lastSession.tasksCompleted` 追加当前任务 ID
5. 执行 `/learn` 逻辑；如有长期经验，追加到 `experience.md`。
6. `git add task.json progress.json experience.md`（如 `experience.md` 不存在或无变化则不添加）。
7. `git commit -m "chore: update task state - task #[id]"`。

## Step 7: Continue 继续

1. 运行 `node .codex/hooks/scripts/next-task.js`。
2. 无输出且全部完成：更新 `progress.currentPhase = "completed"`，输出摘要并停止。
3. 返回 blocked 摘要：输出阻塞报告并停止。
4. 返回 task：进入 Step 1。

## 错误恢复

如果某个 Step 失败：
1. 在 `progress.json` notes 中记录错误。
2. 将任务设为 `blocked`，并加入 `blockedTasks`。
3. 提交当前状态。
4. 运行 `next-task.js`，继续下一个不依赖此任务的 pending task。

## 并行工具调用

- 多个互不依赖的读取、搜索、状态检查、轻量验证，应在同一轮工具调用中一起发出。
- 有先后依赖的动作分轮执行，例如先读错误摘要，再按错误位置读取源码。
- 编辑、格式化、状态更新、提交等会改变仓库状态的动作，不和探索 / 检查混在同一轮。

## 运行规则

- 永不停止：除非全部完成、全部阻塞、用户停止或不可恢复错误。
- 绝对禁止提前停止：完成一个 task 后必须进入 Step 7。
- 单任务聚焦：一次只做一个 task。
- 搜索优先：写代码前先查证 API。
- 编译门禁：代码必须编译通过才能提交。
