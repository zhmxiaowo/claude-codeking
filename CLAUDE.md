# Claude Code 万能工程模板

## Session 启动协议

每次对话开始时执行：

1. 检查项目根目录是否存在 `progress.json`
   - **存在**：读取它，恢复上次进度，报告当前状态（已完成/总数/当前任务/阻塞项）
   - **不存在**：提示用户运行 `/init-project` 初始化项目
2. 如果 `spec.md` 存在，读取 `projectType` 字段
   - `web` → 加载 `.claude/rules/web.md`
   - `game-engine` → 加载 `.claude/rules/game-engine.md`
3. 检查 git 状态，报告未提交的变更

## 搜索优先原则

写代码前必须先查文档：
- **库/框架 API**：用 Context7（先 resolve-library-id 找库，再 query-docs 查文档）
- **通用技术问题**：用 WebSearch 搜索
- **禁止凭记忆写 API 调用**，必须查证最新文档后再写

## 通用编码规范

- **组合优于继承**：禁止超过 2 层继承链，用接口+组合替代
- **async/await**：所有异步操作（网络、I/O、定时器）必须用 async/await，禁止嵌套回调
- **链式编程**：UI 构建、配置对象、动画序列使用 fluent/builder 模式
- **流式编程**：不轻易拆分逻辑和新建函数,除非复用率>3的逻辑可拆分,,模块化划分文件,不轻易新增文件.
- **不过度封装**：三行相似代码优于一个过早抽象
- **不添加投机性代码**：只实现当前任务需要的功能

## 进度跟踪

- 每完成一个任务：更新 task.json（status→completed）+ progress.json + git commit
- 提交信息格式：`feat/fix/refactor: [描述] - task #[id]`
- 进度更新单独提交：`chore: update progress - task #[id] completed`

## 工具使用指南

| 场景 | 工具 |
|------|------|
| 查询库/框架文档 | Context7 MCP（resolve-library-id → query-docs） |
| Web UI 测试 | Playwright MCP（browser_navigate → browser_snapshot → browser_console_messages） |
| 通用搜索 | WebSearch |
| 代码评审 | 启动 code-reviewer agent |
| 测试验证 | 启动 qa-verifier agent |

## 核心工作流

```
/init-project → 交互式需求收集 → 生成 spec.md + task.json + progress.json
/work         → 持续自主开发循环（Plan→Implement→Review→Test→Commit→Next）
/review       → GAN 式代码评审（外部评审者模式）
```

## 项目类型特定规则

项目类型特定规则在 `.claude/rules/` 目录下，根据 spec.md 的 projectType 自动加载。
不要在本文件中重复这些规则。
