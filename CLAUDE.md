# Claude Code 万能工程模板

## Session 启动协议

每次对话开始时执行：

1. 检查项目根目录是否存在 `progress.json`
   - **存在**：读取它，恢复上次进度，报告当前状态（已完成/总数/当前任务/阻塞项）
   - **不存在**：提示用户运行 `/init-project` 初始化项目
2. `spec.md` / `DESIGN.md` / `experience.md` / `.claude/rules/*.md` 都已通过本文件末尾的 `@import` 一次性加载到 system prompt，**禁止再次 Read**
3. 检查 git 状态，报告未提交的变更

## 搜索优先原则

写代码前必须先查文档：
- **库/框架 API**：用 Context7（先 resolve-library-id 找库，再 query-docs 查文档）
- **通用技术问题**：用 WebSearch 搜索
- **禁止凭记忆写 API 调用**，必须查证最新文档后再写

## 通用编码规范

- **组合优于继承**：禁止超过 2 层继承链，用接口+组合替代,Entity+Component(带逻辑)或标准Entity+Component+System的方案适用于任何编程.
- **async/await**：所有异步操作（网络、I/O、定时器）必须用 async/await，禁止嵌套回调
- **链式编程**：UI 构建、配置对象、动画序列使用 fluent/builder 模式
- **流式编程**：不轻易拆分逻辑和新建函数,除非复用率>3的逻辑可拆分,,模块化划分文件,不轻易新增文件.
- **不过度封装**：三行相似代码优于一个过早抽象
- **不添加投机性代码**：只实现当前任务需要的功能

## 经验管理

- 项目根目录 `experience.md`（与 CLAUDE.md 同级）是项目的隐性知识库
- session 启动时通过 `@experience.md` 一次性挂载到 system prompt，所有 skill / agent 共享，**禁止 Read**
- /learn skill 负责提取经验（追加到 experience.md，**不写 spec.md**），在以下节点自动调用：
  - /init-project 完成后（Phase 6.5）
  - /change 完成后（Step 4.5）
  - /work 每个任务 commit 后（Step 6.5）
- 用户也可随时手动运行 /learn
- 每条经验格式：`- [日期 task#id] 内容描述`
- 在较长对话即将结束时，自检是否有未记录的用户偏好或技术发现

## 进度跟踪

- 每完成一个任务：更新 task.json（status→completed）+ progress.json + git commit
- 提交信息格式：`feat/fix/refactor: [描述] - task #[id]`
- 进度更新单独提交：`chore: update progress - task #[id] completed`

## 验证分层原则

- task.json 中的每个任务应尽量补齐：`changeArea`、`doneWhen`、`verificationLevel`
- **local**：最便宜的窄验证，适合纯内部逻辑、局部重构、单一 system/组件修改
- **slice**：只验证当前任务涉及的那条闭环，例如一个 API 流程、一个页面状态、一个 scene/editor 路径
- **milestone**：多个连续任务组成一个完整模块后再做模块验收；这是 qa-verifier 的默认主战场
- **release**：模块收口、合并、部署前的完整回归
- code-reviewer 只用于高风险、跨模块、公开接口、安全/数据一致性等变更，不是每个微任务必跑
- qa-verifier 只用于 milestone/release，或用户明确要求的关键用户路径 / 核心运行时闭环
- 细微 UI 不雅观、本质上属于设计约束和验收标准问题，要前置写进 spec.md 和 `doneWhen`，不要只靠末端 QA 反复兜底

## 工具使用指南

| 场景 | 工具 |
|------|------|
| 查询库/框架文档 | Context7 MCP（resolve-library-id → query-docs） |
| Web UI / 编辑器闭环验证 | Playwright MCP（browser_navigate → browser_snapshot → browser_console_messages） |
| 通用搜索 | WebSearch |
| 高风险代码评审 | 启动 code-reviewer agent |
| 模块/发布验证 | 启动 qa-verifier agent |

## 核心工作流

```
/init-project → 第一性原理访谈 → 架构共识 → 生成 spec.md + task.json + progress.json
/work         → 持续自主开发循环（Plan→Implement→Review?→Build→Validate→Commit→Next）
/stopwork     → 优雅停止（以 task 为单位安全停止，保存进度）
/change       → 中途需求变更（同步更新 spec.md + task.json + progress.json）
/review       → GAN 式代码评审（外部评审者模式）
```

## 项目类型特定规则

以下规则在 session 启动时通过 @import 一次性加载到 system prompt，所有 skill / agent 共享，无需任何 Read。
Claude 根据 spec.md 的 projectType 自动选用对应那一套，另一套作为闲置占位。

@.claude/rules/web.md
@.claude/rules/game-engine.md

## 项目级文档（一次性挂载，禁止重复 Read）

下列文件**只在 session 启动时通过 @import 加载到 system prompt 一次**。所有 skill / agent / 任务循环中**严禁再次 Read** 它们 —— 否则会导致同一份内容在 system prompt + messages 双重占用 token。

文件不存在时 @import 会被忽略，不影响新项目初始化前的 session。

@spec.md
@DESIGN.md
@experience.md
