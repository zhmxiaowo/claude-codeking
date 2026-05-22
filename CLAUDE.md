# Claude Code 万能工程模板

## Session 启动协议

每次对话开始时：

1. 检查项目根目录是否存在 `progress.json`
   - 存在：读取它，恢复上次进度，报告已完成/总数/当前任务/阻塞项
   - 不存在：提示用户运行 `/init-project` 初始化项目
2. 检查 `git status`，报告未提交变更
3. 需要项目细节时按需读取 `spec.md`、`DESIGN.md`、`experience.md`、`task.json`
4. 按 `projectType` 读取对应规则：
   - `web` → `.claude/rules/web.md`
   - `game-engine` → `.claude/rules/game-engine.md`

## 上下文原则

- 稳定前缀优先：核心规则、工具说明、长期约束保持稳定，不在运行中反复改写。
- 动态状态只来自 `progress.json` 和 `task.json`，不要把进度摘要重复注入上下文。
- 已读且不变的指令和文档可以利用模型缓存；长任务依靠 Claude Code 官方 auto-compact 保持可持续。
- 读取文件必须按需、窄范围、可验证；不要为了“完整上下文”重复读取大文档。

## 搜索优先原则

写代码前必须先查文档：
- **库/框架 API**：用 Context7（先 `resolve-library-id`，再 `query-docs`）
- **通用技术问题**：用 WebSearch 搜索
- **禁止凭记忆写 API 调用**，必须查证最新文档后再写

## 通用编码规范

- **组合优于继承**：禁止超过 2 层继承链，用接口+组合替代
- **async/await**：网络、I/O、定时器等异步操作必须用 async/await，禁止嵌套回调
- **链式编程**：UI 构建、配置对象、动画序列使用 fluent/builder 模式
- **流式编程**：不轻易拆分逻辑和新建函数，除非复用率超过 3 次
- **不过度封装**：三行相似代码优于一个过早抽象
- **不添加投机性代码**：只实现当前任务需要的功能

## 经验管理

- `experience.md` 是项目隐性知识库，与 `spec.md` 分离维护
- `/learn` 只追加对未来 session 有价值的新经验，不把经验写入 `spec.md`
- 自动调用节点：`/init-project` Phase 6.5、`/change` Step 4.5、`/work` Step 6.5
- 每条经验格式：`- [日期 task#id] 内容描述`
- 长对话结束前，自检是否有未记录的用户偏好或技术发现

## 进度跟踪

- 每完成一个任务：更新 task.json（status→completed）+ progress.json + git commit
- 提交信息格式：`feat/fix/refactor: [描述] - task #[id]`
- 进度更新单独提交：`chore: update progress - task #[id] completed`

## 验证分层原则

- task.json 中的每个任务应包含：`doneWhen`、`verificationLevel`
- **local**：最便宜的窄验证，适合纯内部逻辑、局部重构、单一 system/组件修改
- **slice**：只验证当前任务涉及的一条闭环，例如一个 API 流程、页面状态、scene/editor 路径
- **milestone**：验证一个完整模块或一组连续任务的主路径
- **release**：合并、部署、发布前的完整回归
- code-reviewer 只用于高风险、跨模块、公开接口、安全/数据一致性等变更，不是每个微任务必跑
- qa-verifier 只用于 milestone/release，或用户明确要求的关键用户路径 / 核心运行时闭环
- 细微 UI 品质要求要前置写进 spec.md 和 `doneWhen`，不要只靠末端 QA 兜底

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
/stopwork     → 用户主动停止并保存进度
/change       → 中途需求变更（同步更新 spec.md + task.json + progress.json）
/review       → GAN 式代码评审
```

## 项目类型规则

按 `spec.md` 或 `progress.json` 的 `projectType` 读取对应规则文件。只读取当前任务需要的规则和源码，不做全量上下文预加载。
