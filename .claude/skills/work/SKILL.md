---
name: work
description: 持续自主开发循环。从 task.json 取任务，执行「编写→评审→编译→测试→提交」循环，更新进度，自动继续下一个任务直到全部完成。
argument-hint: <可选：指定任务ID>
user-invocable: true
---

# 持续自主开发循环

你现在进入持续开发模式。你将从 task.json 中取出任务，逐个完成，永不停止直到全部任务完成或用户中断。

**核心原则：task.json 是单一数据源，但不是每个 task 都值得一次重型外部评审或完整 QA。把最贵的验证留给真正跨边界、跨模块、用户可见或高成本的改动。**

## Startup 启动检查

1. 读取 `progress.json` — 确认项目已初始化（currentPhase 不为空）
2. 读取 `task.json` — 找到下一个 pending 任务（或使用 $ARGUMENTS 指定的任务 ID）
   - 跳过 status 为 `cancelled` 的任务
  - 同时读取当前任务的 `changeArea`、`doneWhen`、`verificationLevel`
   - 如果旧任务缺少这些字段，先基于 `spec.md` 补出最小验收契约再继续
3. 读取 `spec.md` — 理解完整项目上下文
4. 根据 progress.json 的 projectType 读取对应规则文件：
   - web → `.claude/rules/web.md`
   - game-engine → `.claude/rules/game-engine.md`
5. 检查 git 状态，确保工作区干净
6. 检查 `.claude/.work-stop` 是否存在：
   - 存在：读取并显示上次停止原因，删除该文件，继续工作
7. 更新 progress.json 的 currentPhase 为 "in_progress"

如果 progress.json 不存在，提示用户先运行 `/init-project`。

## 单任务循环（对每个任务重复执行）

### Step 1: Plan 规划
- 读取当前任务的 description、dependencies、`doneWhen`、`verificationLevel`
- 确认所有依赖任务已 completed
- 识别需要创建/修改的文件
- 使用 Context7 查询相关库/框架的最新文档（resolve-library-id → query-docs）
- 如遇不确定的技术问题，用 WebSearch 搜索
- 输出简要实施计划（< 10 行），必须包含：
  - 本任务的 `doneWhen`
  - 最便宜的第一验证动作
  - 是否需要外部 `code-reviewer` / `qa-verifier` 以及原因

### Step 2: Implement 实现
- 按 CLAUDE.md 通用编码规范编写代码
- 遵循项目类型对应的 rules 文件规则
- 保持变更聚焦于当前单一任务
- 组合优于继承，async/await，链式编程
- 对 UI / editor / runtime 任务，把可观察结果直接对齐到 `doneWhen`
- 不为未来假设提前抽象

### Step 3: Review 评审（按边界触发，不默认重型）
先做作者自检：
- 对照 `doneWhen` 检查实现是否真的覆盖了完成条件
- 扫描失败路径、边界条件、异常输入、资源释放和回滚路径
- 检查本任务是否引入了不必要的抽象或范围膨胀

仅在满足任一条件时启动 code-reviewer agent：
- `changeArea = api | infra | runtime | cross-cutting`
- 涉及并发、持久化、鉴权、安全、公开接口、数据迁移
- 修改跨多个核心模块，或显著改变公共边界

否则：
- 记录“已完成作者自检”，不启动外部评审

如启动 code-reviewer agent：
- 只传入当前任务变更文件
- 修复所有 critical 级别问题
- 修复置信度 ≥ 80 的 warning 级别问题
- info 级别记录但不阻塞
- 不因低风险微任务而扩大评审范围

### Step 4: Build 编译验证
**此步骤为硬性门禁，必须通过后才能继续。**

**Web 项目**：
1. 如果 node_modules 不存在，先运行 `npm install` 或 `pnpm install`
2. 先运行最窄的类型/编译检查：`npx tsc --noEmit`、`npm run typecheck` 或等价命令
3. 如存在 `build` script，再运行 `npm run build` 或 `pnpm build`
4. 如当前任务已有窄测试命令，优先跑当前 slice 的那一条
5. 必须零编译 error

**游戏项目**：
1. Unity：`Unity -batchmode -nographics -logFile - -quit -projectPath .`
2. Unreal：使用 UnrealBuildTool 编译
3. Cocos：`npm run build` 或 `cocos compile`
4. 如存在与当前 system / scene / editor 相关的单元测试，也优先运行最窄的一组
5. 必须零编译 error

**编译失败 → 立即修复代码，重新编译，循环直到通过。不得跳过此步骤。**

### Step 5: Test 验证（分层执行）
始终从最便宜、最能证伪当前假设的验证开始。验证层级只有四档：

- `local`：局部单测、类型检查、编译烟雾、纯逻辑验证
- `slice`：只验证当前任务对应的一条功能闭环
- `milestone`：多个连续任务组成一个完整模块后，再做一次模块级验收
- `release`：模块收口、合并、部署前的完整回归

按 `verificationLevel` 执行：

- `local`：不启动 qa-verifier；只做最窄的可执行验证
- `slice`：围绕 `doneWhen` 运行当前 slice 的测试 / 场景 / 路由闭环
- `milestone`：在完成这一组连续任务后，启动 qa-verifier 做模块级验证
- `release`：启动 qa-verifier 做完整回归

**Web 项目**：
- `local`：单测、服务层测试、类型检查
- `slice`：只验证当前路由 / 表单 / API / 状态切换闭环
- `milestone`：一个完整模块或多条连续任务共用的用户流
- `release`：完整用户路径回归 + 关键交互检查

**游戏项目**：
- `local`：system 逻辑单测、编译烟雾
- `slice`：受影响的 scene / editor tool / runtime loop
- `milestone`：子系统集成验收（如战斗、背包、关卡编辑器）
- `release`：构建 + 核心游玩 / 编辑器回归

当且仅当满足以下之一时启动 qa-verifier agent：
- `verificationLevel = milestone` 或 `release`
- 当前任务改变了主用户路径、跨边界集成、核心 runtime / editor 闭环
- 用户明确要求独立 QA

禁止：
- 为每个微任务都启动 qa-verifier
- QA 失败后立刻全量重跑；先只修当前报告对应 slice，再重跑同层级验证

### Step 6: Commit 提交
- `git add` 相关变更文件（不要用 git add -A）
- `git commit -m "feat/fix/refactor: [任务标题] - task #[id]"`
- 更新 task.json：将当前任务 status 改为 "completed"
- 更新 progress.json：
  - completedTasks += 1
  - currentTask = null
  - lastSession.date = 当前 ISO 时间
  - lastSession.tasksCompleted 追加当前任务 ID
- `git add task.json progress.json`
- `git commit -m "chore: update progress - task #[id] completed"`

### Step 6.5: Learn 经验提取
- 执行 /learn 逻辑，提取本任务开发中的经验
- 如有新内容写入 spec.md，在 Step 6 的进度 commit 中已包含或追加一次 commit：`git add spec.md && git commit -m "chore: update experience notes - task #[id]"`
- 如无新发现，不得输出任何文字，直接执行 Step 7 的第一个操作

### Step 7: Continue 继续
- 从 task.json 取下一个 pending 任务（尊重 dependencies 顺序，跳过 cancelled）
- 如果所有任务完成：
  - 更新 progress.json 的 currentPhase 为 "completed"
  - 输出完成摘要
  - 停止
- 如果还有任务：**立即**回到 Step 1

## 错误恢复

如果某个 Step 失败：
1. 在 progress.json 的 notes 中记录错误信息
2. 将任务 status 改为 "blocked"
3. 将任务 ID 加入 progress.json 的 blockedTasks 数组
4. git commit 当前状态
5. 跳到下一个不依赖此任务的 pending 任务
6. 如果无可用任务，输出阻塞报告并停止

## 重要原则

- **永不停止**：除非全部完成或全部阻塞，否则持续工作
- **绝对禁止提前停止**：完成一个任务后，你必须立即开始下一个任务。不要询问用户"是否继续"，不要输出"接下来我将..."然后等待。直接开始下一个任务的 Step 1。
- **每个 Step 7 必须直接跳转**：输出"→ 开始任务 #X"后立即执行 Step 1，不要在两个任务之间产生任何等待或确认。
- **禁止总结性停止**：绝不输出"接下来我将做 X、Y、Z"之类的展望后停止。如果 context 即将耗尽，完成当前 Step 后 commit（用 wip: 前缀），然后输出"⚡ 请运行 /compact 后重新 /work"。
- **单任务聚焦**：一次只做一个任务，做完再取下一个
- **搜索优先**：写代码前先用 Context7 查文档
- **编译门禁**：代码必须能编译通过才能提交
- **外部评审与 QA 是边界门禁**：公开接口、跨模块、runtime / infra 边界改动用 code-reviewer，模块/发布验收用 qa-verifier，不把它们变成每个微任务的固定税
- **审美与交互品味问题要前置**：把可观察的体验要求写进 `doneWhen` 和 spec，再实现；不要指望末端 QA 单独根治
- **增量提交**：每个任务完成立即提交，不累积
- **进度可恢复**：progress.json 保证 session 断开后可恢复
