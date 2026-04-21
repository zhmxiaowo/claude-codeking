# Claude Code Web 工程模板

这是一个专注于 **Web 全栈开发** 的 Claude Code 起手式模板。前端基于 Vue 3 + Vite + TypeScript + Tailwind v4，后端基于 FastAPI + uv + SQLModel。

## Session 启动协议

每次对话开始时执行：

1. 检查项目根目录是否存在 `progress.json`
   - **存在**：读取它，恢复上次进度，报告当前状态（已完成/总数/当前任务/阻塞项）
   - **不存在**：提示用户运行 `/init-project` 初始化项目
2. 加载 `.claude/rules/web.md`
3. 如果 `DESIGN.md` 存在，读取其 Color Palette / Typography 摘要（所有 UI 工作都要对齐这份设计系统）
4. 检查 git 状态，报告未提交的变更

## 搜索优先原则

写代码前必须先查文档：
- **库/框架 API**：用 Context7（先 resolve-library-id 找库，再 query-docs 查文档）
- **通用技术问题**：用 WebSearch 搜索
- **禁止凭记忆写 API 调用**，必须查证最新文档后再写

## 通用编码规范

- **组合优于继承**：禁止超过 2 层继承链，用接口+组合替代
- **async/await**：所有异步操作（网络、I/O、定时器）必须用 async/await，禁止嵌套回调
- **链式编程**：UI 构建、配置对象、动画序列使用 fluent/builder 模式
- **流式编程**：不轻易拆分逻辑和新建函数，除非复用率 > 3 的逻辑可拆分；模块化划分文件，不轻易新增文件
- **不过度封装**：三行相似代码优于一个过早抽象
- **不添加投机性代码**：只实现当前任务需要的功能

## 设计系统单一源

- 项目根目录的 **`DESIGN.md`** 是所有 UI 决策的 source of truth
- 两条产出路径任选其一（或替换）：
  - `/ui-ux-pro-max` — AI 推理生成定制设计系统（默认推荐）
  - `/design-skill` — 68 套大厂品牌预设任选一款
- 构建 UI 时，始终先读 DESIGN.md 的 Color Palette / Typography / Component Stylings / Layout 章节，再动手
- 详细视觉规则见 `.claude/rules/web.md`

## 经验管理

- spec.md 的「经验与约束」章节是项目的隐性知识库
- /learn skill 负责提取经验，在以下节点自动调用：
  - /init-project 完成后
  - /change 完成后
  - /work 每个任务 commit 后
- 用户也可随时手动运行 /learn
- 每条经验格式：`- [日期 task#id] 内容描述`
- 在较长对话即将结束时，自检是否有未记录的用户偏好或技术发现

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
| 设计决策（默认） | /ui-ux-pro-max |
| 设计决策（预设） | /design-skill |

## 核心工作流

```
/init-project  → 7 轮 web 需求访谈 → 架构共识 → 内部调用 /init-web 搭脚手架 → 调用 /ui-ux-pro-max 或 /design-skill 产出 DESIGN.md → 生成 spec.md + task.json + progress.json
/work          → 持续自主开发循环（Plan→Implement→Review→Build→Test→Commit→Next）
/stopwork      → 优雅停止（以 task 为单位安全停止，保存进度）
/change        → 中途需求变更（同步更新 spec.md + task.json + progress.json）
/review        → GAN 式代码评审（外部评审者模式）
/learn         → 手动触发经验提炼
```

## Web 规则

详细的 Web 架构、异步模式、链式编程、目录组织、视觉设计规范见 `.claude/rules/web.md`，由 Session 启动协议自动加载。
