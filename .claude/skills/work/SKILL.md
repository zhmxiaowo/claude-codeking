---
name: work
description: 持续自主开发循环。从 task.json 取任务，执行「规划→实现→评审→编译→验证→提交」循环，直到全部完成、全部阻塞或用户停止。
argument-hint: <可选：指定任务ID>
user-invocable: true
---

# 持续自主开发循环

你现在进入持续开发模式。`task.json` 是任务状态源，`progress.json` 是恢复点。你一次只做一个 task，完成后立即进入下一个可执行 task。

**永不停止**：除非全部任务完成、全部可执行任务阻塞、用户运行 `/stopwork`，或遇到不可恢复错误。

## Startup 启动检查（仅 session 内首次执行）

### 上下文来源

`CLAUDE.md` 是稳定入口。需要项目细节时按需读取 `spec.md`、`DESIGN.md`、`experience.md`、`task.json`；按 `projectType` 读取 `.claude/rules/web.md` 或 `.claude/rules/game-engine.md`。

### 首次/后续判断

读取 `progress.json` 的 `currentPhase` 和 `currentTask`：
- = `completed`：输出完成摘要并停止
- 存在 `task.status = "in_progress"` 或 `progress.currentTask`：优先恢复该任务
- 其他情况：定位下一个可执行 pending 任务

### 首次启动流程

1. 读取 `progress.json`，确认项目已初始化
2. 从 `task.json` 定位当前可恢复任务或下一个可执行 pending 任务，提取 id / title / description / dependencies / doneWhen / verificationLevel / files
   - 跳过 status 为 `cancelled` 的任务
   - 跳过 status 为 `blocked` 或依赖未完成的 pending 任务
   - 旧任务缺少 `doneWhen` / `verificationLevel` 时，根据项目上下文补出最小验收契约
3. 检查 git 状态，确认当前工作区风险
4. 若存在 `.claude/.work-stop`，读取原因后删除并继续
5. 如果选中的是 pending 任务，更新该 task 的 `status = "in_progress"`
6. 更新 `progress.json`：`currentPhase = "in_progress"`，`currentTask = { id, title }`

如果 `progress.json` 不存在，提示用户先运行 `/init-project`。

### 循环读取原则

- 每轮只读取当前任务需要的条目和文件
- Edit 成功后以工具返回为准；仅在编译/测试报错指向具体位置时再读取定位
- 不重复读取未变化的大文档

## 单任务循环（对每个任务重复执行）

### Step 1: Plan 规划
- 读取当前任务的 description、dependencies、`doneWhen`、`verificationLevel`
- 确认所有依赖任务已 completed
- 识别需要创建/修改的文件
- 使用 Context7 查询相关库/框架最新文档（resolve-library-id → query-docs）
- 如遇不确定的技术问题，用 WebSearch 搜索
- 输出简要实施计划（< 10 行），包含：
  - 本任务的 `doneWhen`
  - 最便宜的第一验证动作
  - 是否需要 code-reviewer / qa-verifier 以及原因

### Step 2: Implement 实现
- 按 CLAUDE.md 通用编码规范编写代码
- 遵循项目类型对应 rules
- 保持变更聚焦于当前单一任务
- 组合优于继承，async/await，链式编程
- 对 UI / editor / runtime 任务，把可观察结果直接对齐到 `doneWhen`
- 不为未来假设提前抽象

### Step 3: Review 评审
先做作者自检：
- 对照 `doneWhen` 检查完成条件
- 扫描失败路径、异常输入、资源释放和回滚路径
- 检查是否引入不必要抽象或范围膨胀

满足任一条件时启动 code-reviewer agent：
- 涉及公开接口、跨模块契约、并发、持久化、鉴权、安全、数据迁移
- 修改多个核心模块或核心 runtime/editor 路径
- 实际 diff 显示风险高于普通局部任务

否则记录“已完成作者自检”，不启动外部评审。

如启动 code-reviewer agent：
- 只传入当前任务变更文件
- 修复所有 critical 级别问题
- 修复置信度 >= 80 的 warning 级别问题
- info 级别记录但不阻塞

### Step 4: Build 编译验证
**此步骤为硬性门禁，必须通过后才能继续。**

**Web 项目**：
1. 如果 node_modules 不存在，先运行 `npm install` 或 `pnpm install`
2. 先运行最窄的类型/编译检查：`npx tsc --noEmit`、`npm run typecheck` 或等价命令
3. 如存在 build script，再运行 `npm run build` 或 `pnpm build`
4. 如当前任务已有窄测试命令，优先跑当前 slice 的那一条
5. 必须零编译 error

**游戏项目**：
1. Unity：`Unity -batchmode -nographics -logFile - -quit -projectPath .`
2. Unreal：使用 UnrealBuildTool 编译
3. Cocos：`npm run build` 或 `cocos compile`
4. 如存在当前 system / scene / editor 相关单元测试，也优先运行最窄的一组
5. 必须零编译 error

编译失败则修复代码并重新编译，直到通过。

### Step 5: Test 验证
始终从最便宜、最能证伪当前假设的验证开始。

- `local`：局部单测、类型检查、编译烟雾、纯逻辑验证
- `slice`：只验证当前任务对应的一条功能闭环
- `milestone`：验证一个完整模块或一组连续任务的主路径
- `release`：完整回归

按 `verificationLevel` 执行：
- `local`：不启动 qa-verifier；只做最窄验证
- `slice`：围绕 `doneWhen` 运行当前 slice 测试 / 场景 / 路由闭环
- `milestone`：启动 qa-verifier 做模块级验证
- `release`：启动 qa-verifier 做完整回归

当且仅当满足以下之一时启动 qa-verifier agent：
- `verificationLevel = milestone` 或 `release`
- 当前任务改变主用户路径、跨模块集成、核心 runtime/editor 闭环
- 用户明确要求独立 QA

视觉相关 task 必须启动 Playwright：
1. `browser_navigate` 打开目标页面
2. `browser_snapshot` 抓 a11y tree 验证渲染
3. `browser_console_messages` 检查零 error
4. `browser_click` / `browser_type` 跑一遍 `doneWhen` 闭环

### Step 6: Commit 提交
- `git add` 相关变更文件（不要用 git add -A）
- `git commit -m "feat/fix/refactor: [任务标题] - task #[id]"`
- 更新 task.json：将当前任务 status 从 "in_progress" 改为 "completed"
- 更新 progress.json：
  - completedTasks += 1
  - currentTask = null
  - lastSession.date = 当前 ISO 时间
  - lastSession.tasksCompleted 追加当前任务 ID
- `git add task.json progress.json`
- `git commit -m "chore: update progress - task #[id] completed"`

### Step 6.5: Learn 经验提取
- 执行 /learn 逻辑，把本任务的新经验追加到项目根目录 `experience.md`，不写入 `spec.md`
- 只记录对未来 session 有价值的偏好、技术发现或踩坑记录
- 如有新内容：`git add experience.md && git commit -m "chore: update experience notes - task #[id]"`
- 如无新发现，直接进入 Step 7

### Step 7: Continue 继续
1. 检查 task.json 是否还有依赖已满足的 pending 任务
2. 无 pending 且无 blocked 任务 → 更新 progress.json 的 `currentPhase = "completed"`，输出完成摘要，停止
3. 无可执行 pending 但存在 blocked/依赖未满足任务 → 输出阻塞报告，停止
4. 有可执行 pending → 立即回到 Step 1，进入下一个任务

## 错误恢复

如果某个 Step 失败：
1. 在 progress.json 的 notes 中记录错误信息
2. 将任务 status 改为 "blocked"
3. 将任务 ID 加入 progress.json 的 blockedTasks 数组
4. git commit 当前状态
5. 跳到下一个不依赖此任务的 pending 任务
6. 如果无可用任务，输出阻塞报告并停止

## 重要原则

- **永不停止**：除非全部完成、全部阻塞、用户停止或不可恢复错误
- **绝对禁止提前停止**：完成一个任务后直接进入下一个任务 Step 1
- **单任务聚焦**：一次只做一个任务，做完再取下一个
- **搜索优先**：写代码前先用 Context7 查文档
- **编译门禁**：代码必须能编译通过才能提交
- **增量提交**：每个任务完成立即提交，不累积
- **进度可恢复**：progress.json 保证 session 断开后可恢复
