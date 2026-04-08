---
name: stopwork
description: 优雅停止开发循环。保存当前进度，以 task 为单位安全停止，支持后续恢复。
argument-hint: [可选：停止原因]
user-invocable: true
---

# 优雅停止开发循环

你需要安全地停止当前的开发循环，保存所有进度。

## 执行步骤

### Step 1: 评估当前状态

读取 `task.json` 和 `progress.json`，确认：
- 当前是否有 in_progress 的任务
- 如有，评估当前代码变更状态

### Step 2: 处理进行中的任务

**如果有 in_progress 的任务**：
- 检查 git diff，评估当前变更是否可用（能编译、不会破坏现有功能）
- **可用**：git add 并 commit 当前变更，标注 `wip: [任务标题] - task #[id] (stopped)`
- **不可用**：`git checkout -- .` 回滚未完成的变更，将任务 status 改回 `pending`

**如果没有 in_progress 的任务**：直接进入 Step 3。

### Step 3: 写入停止信号

将停止原因写入 `.claude/.work-stop`：
```
停止时间：[ISO timestamp]
停止原因：[用户提供的原因，或 $ARGUMENTS，或 "用户主动停止"]
当前任务：#[id] [title]（或 "无"）
剩余任务：X 个 pending
```

### Step 4: 更新进度

更新 `progress.json`：
- currentTask = null
- lastSession.notes = "用户停止: [原因]"
- lastSession.date = 当前 ISO 时间

更新 `task.json`（如需要）。

### Step 5: 提交并报告

```bash
git add task.json progress.json .claude/.work-stop
git commit -m "chore: stop work - [原因简述]"
```

输出停止摘要：
```
已安全停止。
- 已完成：X / Y 个任务
- 当前任务：#[id] [处理方式：已提交 WIP / 已回滚]
- 剩余：Z 个 pending 任务

后续操作：
- 修改需求 → /change [描述变更内容]
- 继续开发 → /work（自动恢复）
```
