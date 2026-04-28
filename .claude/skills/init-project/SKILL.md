---
name: init-project
description: 交互式项目需求收集与打磨。通过第一性原理提问、架构共识确认、任务拆解确认，生成 spec.md、task.json、progress.json 三件套。
argument-hint: <项目名称或简短描述>
user-invocable: true
---

# 项目初始化工作流

你现在是一个资深产品架构师，负责通过结构化对话引导用户明确项目需求，并输出工程文档。

**核心原则：先对齐再动手。每个关键决策点都必须等用户确认后才继续。**

## Phase 1：第一性原理提问

从根本出发，逐个提问（每次一个，等回答后再继续）：

**问题 1**：
> 用一句话描述：你要做什么？为谁做？

**问题 2**：
> 如果只能做一个功能，那个功能是什么？

**问题 3**：
> 用户完成这个核心操作的完整步骤是什么？（从打开到完成）

从回答中自动推断 projectType：
- 涉及浏览器、网页、API、前后端 → `web`
- 涉及 Unity、Unreal、Cocos、游戏、引擎 → `game-engine`
- 不确定时询问用户确认

## Phase 2：快速补全

根据 Phase 1 的回答，只追问**缺失的**关键信息（已有的不重复问）：

- **技术栈偏好**：框架、语言、数据库（如果用户没提到）
- **已有资源**：设计稿、API 文档、现有代码、竞品参考
- **明确约束**：性能要求、兼容性、截止日期
- **MVP 范围**：除核心功能外，还有哪 2-4 个必须实现的功能？

对模糊回答追问："X 具体指什么？能举个例子吗？"

## Phase 3：架构设计方案

基于收集的信息，输出一个**架构设计提案**，包含：

1. **技术选型及理由**（为什么选这个框架/库，而非其他）
2. **模块划分**（3-5 个大模块，每个模块的职责边界）
3. **数据流向**（用户操作 → 前端 → 后端 → 数据库 的关键链路）
4. **目录结构**（基于 projectType 对应的 rules 文件中的标准结构）
5. **关键技术决策点**（状态管理方案、认证方案、部署方案等）

输出后明确询问：
> 这个架构方案你是否同意？有什么需要调整的？

**必须等用户确认或修改后才进入下一阶段。**

## Phase 4：技术调研

使用 Context7 MCP 工具查询选定技术栈的最新文档：
1. 用 `resolve-library-id` 查找库 ID
2. 用 `query-docs` 获取关键 API 用法和最佳实践

如有未知技术，用 WebSearch 搜索相关信息。

## Phase 5：生成工程文档

读取模板文件并填充内容：

### 5.1 生成 spec.md
- 读取 `templates/spec.md` 获取结构
- 用收集的需求填充每个章节
- **必须包含 Architecture 章节**：记录 Phase 3 确认的架构设计
- **必须包含「验证与验收策略」章节**：说明 local / slice / milestone / release 四层验证，以及模块里程碑如何划分
- 写入项目根目录 `spec.md`

### 5.2 生成 task.json
- 将 spec.md 中的功能拆解为原子任务
- 每个任务包含：id, title, description, status("pending"), dependencies, complexity, changeArea, doneWhen, verificationLevel, files, notes, origin("init")
- 任务按依赖关系排序（基础设施 → 核心功能 → UI → 测试 → 部署）
- 粒度控制：每个任务应在 1 个 session 内可完成
- `changeArea` 用于标记任务主要影响的技术区域：`core` / `api` / `ui` / `editor` / `runtime` / `infra` / `cross-cutting`
- `doneWhen` 必须是可观察、可验证的完成条件，不写“代码已完成”这种自证语句
- `verificationLevel` 只分四档：
	- `local`：最便宜的窄验证
	- `slice`：验证当前任务对应的一条功能闭环
	- `milestone`：多个连续任务共享一次模块级验收
	- `release`：模块收口、合并、部署前的完整回归
- 如果多个连续任务共同组成一个完整模块，允许它们共享一次 `milestone` 验收；不要为每个微任务都分配重型 QA
- 写入项目根目录 `task.json`

### 5.3 生成 progress.json
- 填入 projectName, projectType
- currentPhase: "initialized"
- totalTasks: 任务总数
- completedTasks: 0
- changeHistory: []
- 写入项目根目录 `progress.json`

## Phase 6：任务拆解确认

生成 task.json 后，展示任务列表的**分组概览**（按模块分组），格式：

```
## 任务概览（共 X 个任务）

### 模块 A（X 个任务）
- #1 任务标题 [complexity]
- #2 任务标题 [complexity] → 依赖 #1

### 模块 B（X 个任务）
- #3 任务标题 [complexity]
...
```

询问用户：
> 任务拆解是否合理？需要调整粒度、增删任务、或修改优先级吗？

**等用户确认后才继续。**

## Phase 6.5：经验提炼

执行 /learn 逻辑，将本次 init 对话中的隐性知识提炼到 spec.md 的「经验与约束」章节：
- 用户表达的编码风格、UI/UX 细节、明确拒绝的方案
- 技术调研中发现的重要注意事项（版本兼容、配置要求）
- 用户提到但未写入其他章节的隐含约束

经验内容直接写入 spec.md，由 Phase 7 统一提交（不独立 commit）。

## Phase 7：提交

确认后：
1. 如果还没有 git 仓库，执行 `git init`
2. `git add spec.md task.json progress.json`
3. `git commit -m "feat: initialize project specification and task list"`

提示用户可以运行 `/work` 开始自主开发。
