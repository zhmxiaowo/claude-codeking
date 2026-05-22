# Claude Code King

一个面向 Claude Code 和 Codex 的最小编程 harness 模板。

目标很简单：先把项目需求变成 `spec.md`、`task.json`、`progress.json`，再用 `/work` 按任务持续开发，直到全部完成、全部阻塞或用户主动 `/stopwork`。

## 设计原则

- **稳定前缀优先**：入口指令、工具规则、长期约束保持稳定，减少缓存失效。
- **状态文件驱动**：动态状态只写入 `progress.json` 和 `task.json`，不反复注入上下文。
- **无限 work**：`/work` 完成一个 task 后立即取下一个可执行 task。
- **原生压缩**：Claude Code 使用官方 auto-compact；Codex 依赖自身自动压缩。
- **搜索优先**：写代码前用 Context7 / WebSearch 查证，不凭记忆写 API。
- **最小工具面**：只保留危险命令阻断、Context7 查询提醒、Playwright 验证等高价值护栏。

## 目录结构

```text
claude-codeking/
├── CLAUDE.md
├── AGENTS.md
├── templates/
│   ├── spec.md
│   ├── task.json
│   └── progress.json
├── .claude/
│   ├── settings.json
│   ├── rules/
│   ├── skills/
│   ├── agents/
│   └── hooks/scripts/
├── .agents/
│   ├── rules/
│   └── skills/
├── .codex/
│   ├── config.toml
│   ├── hooks.json
│   └── hooks/scripts/
└── tests/
```

## 工作流

```text
/init-project  → 需求访谈 → 架构确认 → 生成 spec/task/progress
/work          → Plan → Implement → Review? → Build → Validate → Commit → Next
/stopwork      → 用户主动停止并保存进度
/change        → 同步需求变更到 spec/task/progress
/review        → 高风险变更评审
```

## 上下文策略

Claude 和 GPT 系列都会从稳定前缀缓存中受益。模板默认把长期不变的规则放在入口文档和 rules/skills 中，把会变化的任务状态放在 JSON 文件里。运行时按需读取当前任务相关内容，不重复读取大文档。

Claude Code 侧通过 `.claude/settings.json` 配置官方自动压缩：

```json
{
  "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000",
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "40"
}
```

Codex 侧不添加自制压缩 hook，只保留原生上下文管理。

## 任务契约

`task.json` 中每个任务包含：

- `id`
- `title`
- `description`
- `status`
- `dependencies`
- `complexity`
- `doneWhen`
- `verificationLevel`
- `files`
- `notes`
- `origin`
- `changeRef`

`verificationLevel` 只表示验收深度：

- `local`：局部单测、类型检查、编译烟雾
- `slice`：当前任务的一条功能闭环
- `milestone`：完整模块或连续任务的主路径
- `release`：完整回归

## Hooks

保留的 hook 只做轻量护栏：

- `block-dangerous-cmd.js`：阻断危险 shell/git 命令
- `pre-write-context7-check.js`：写入第三方 import 前提醒查文档
- `track-context7-query.js`：记录 Context7 查询缓存

不使用 SessionStart/Stop hook 驱动 `/work` 或压缩。

## 快速开始

```bash
git clone https://github.com/your-username/claude-codeking.git my-project
cd my-project
claude
/init-project 我的项目
/work
```

Codex 中打开同一目录后也使用 `/init-project` 和 `/work`。

## 验证

```bash
node tests/run-all.js
```
