---
name: change
description: 中途需求变更。分析影响范围，同步更新 spec.md、task.json、progress.json，确保变更可追溯。
argument-hint: <变更描述>
user-invocable: true
---

# 中途需求变更

你需要处理用户的需求变更，并将变更同步到所有项目文档中。

**核心原则：task.json 是单一数据源，所有变更都必须反映在 task.json 中。**

## Step 1: 理解变更

读取用户的变更描述（$ARGUMENTS 或对话内容）。

如果描述不够清晰，追问：
- "具体要改什么行为？从 X 改成 Y？"
- "这个变更影响哪些页面/模块？"

## Step 2: 分析影响

读取 `spec.md` 和 `task.json`，分析：
- 变更涉及哪些已完成的功能
- 变更涉及哪些未开始的任务
- 是否需要新增任务
- 是否有任务需要取消
- 是否需要重划 `doneWhen`、`verificationLevel` 或模块里程碑边界

## Step 3: 输出变更方案

按以下格式输出：

```
## 变更分析

### 变更描述
[用户的变更内容]

### 影响评估

**修改已完成功能**（需新增 fix/change task）：
- #[已完成task id] [标题] → 新增 #[新id] "[修改描述]"

**修改未开始任务**（直接修改 pending task）：
- #[pending task id] [原标题] → [新描述]

**新增任务**：
- #[新id] "[新任务标题]" [complexity] 依赖: [deps]

**取消任务**：
- #[task id] [标题] → cancelled

**spec.md 更新**：
- [章节名] → [变更内容概述]
- 如果影响验收方式，明确指出「验证与验收策略」如何调整
```

询问用户：
> 这个变更方案是否正确？需要调整吗？

**等用户确认后才执行。**

## Step 4: 执行变更

按确认的方案依次操作：

### 4.1 更新 spec.md
- 修改对应章节内容
- 保持文档结构不变

### 4.2 更新 task.json

根据变更类型执行对应策略：

| 变更类型 | 操作 |
|----------|------|
| 修改已完成功能 | 新增 task，`origin: "change"`，`changeRef: "变更描述"` |
| 修改未开始功能 | 直接修改 pending task 的 description/title/files |
| 新增全新功能 | 新增 task，设置正确的 dependencies，`origin: "change"` |
| 删除功能 | 将 pending task 的 status 改为 `cancelled` |

**新增 task 的 ID 规则**：取当前最大 id + 1。

无论是新增还是修改任务，都要同步维护：
- `changeArea`
- `doneWhen`
- `verificationLevel`

如果变更导致多个连续任务更适合共享一次模块验收，直接调整这些任务的 `verificationLevel` 为 `milestone`，而不是保留“每任务一次重型 QA”的默认假设。

### 4.3 更新 progress.json

- 更新 totalTasks（排除 cancelled 的任务）
- 在 changeHistory 数组追加记录：
  ```json
  {
    "date": "[ISO timestamp]",
    "description": "[变更描述]",
    "tasksAdded": [新增的 task id 数组],
    "tasksModified": [修改的 task id 数组],
    "tasksCancelled": [取消的 task id 数组]
  }
  ```

## Step 4.5: 经验提炼

执行 /learn 逻辑，将本次变更讨论中的新发现提炼到 spec.md 的「经验与约束」章节。
经验内容直接写入 spec.md，由 Step 5 统一提交（不独立 commit）。

## Step 5: 提交

```bash
git add spec.md task.json progress.json
git commit -m "change: [变更描述简述]"
```

## Step 6: 报告

输出变更摘要：
```
变更已应用。
- 新增任务：X 个
- 修改任务：X 个
- 取消任务：X 个
- 当前总任务：X 个（已完成 Y，剩余 Z）

运行 /work 继续开发。
```
