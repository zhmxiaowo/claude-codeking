---
name: work
description: 持续自主开发循环。从 task.json 取任务，执行「编写→评审→测试→提交」循环，更新进度，自动继续下一个任务直到全部完成。
argument-hint: [可选：指定任务ID]
user-invocable: true
---

# 持续自主开发循环

你现在进入持续开发模式。你将从 task.json 中取出任务，逐个完成，永不停止直到全部任务完成或用户中断。

## Startup 启动检查

1. 读取 `progress.json` — 确认项目已初始化（currentPhase 不为空）
2. 读取 `task.json` — 找到下一个 pending 任务（或使用 $ARGUMENTS 指定的任务 ID）
3. 读取 `spec.md` — 理解完整项目上下文
4. 根据 progress.json 的 projectType 读取对应规则文件：
   - web → `.claude/rules/web.md`
   - game-engine → `.claude/rules/game-engine.md`
5. 检查 git 状态，确保工作区干净

如果 progress.json 不存在，提示用户先运行 `/init-project`。

## 单任务循环（对每个任务重复执行）

### Step 1: Plan 规划
- 读取当前任务的 description 和 dependencies
- 确认所有依赖任务已 completed
- 识别需要创建/修改的文件
- 使用 Context7 查询相关库/框架的最新文档（resolve-library-id → query-docs）
- 如遇不确定的技术问题，用 WebSearch 搜索
- 输出简要实施计划（< 10 行）

### Step 2: Implement 实现
- 按 CLAUDE.md 通用编码规范编写代码
- 遵循项目类型对应的 rules 文件规则
- 保持变更聚焦于当前单一任务
- 组合优于继承，async/await，链式编程

### Step 3: Review 评审（GAN 模式）
启动 code-reviewer agent 对变更进行评审：
- 传入变更文件列表
- 等待评审结果
- 修复所有 critical 级别问题
- 修复置信度 ≥ 80 的 warning 级别问题
- info 级别记录但不阻塞

### Step 4: Test 测试
根据项目类型选择验证方式：

**Web 项目**：
- 运行已有测试套件（npm test / pnpm test）
- 使用 Playwright MCP 进行视觉验证：
  1. browser_navigate 到目标页面
  2. browser_snapshot 检查渲染
  3. browser_console_messages 检查零 error
  4. browser_click 测试关键交互

**游戏项目**：
- 执行编译检查
- 运行单元测试（如存在）

### Step 5: Commit 提交
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

### Step 6: Continue 继续
- 从 task.json 取下一个 pending 任务（尊重 dependencies 顺序）
- 如果所有任务完成：
  - 更新 progress.json 的 currentPhase 为 "completed"
  - 输出完成摘要
  - 停止
- 如果还有任务：回到 Step 1

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
- **单任务聚焦**：一次只做一个任务，做完再取下一个
- **搜索优先**：写代码前先用 Context7 查文档
- **增量提交**：每个任务完成立即提交，不累积
- **进度可恢复**：progress.json 保证 session 断开后可恢复
