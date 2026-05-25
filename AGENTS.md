# Codex 万能工程模板

这是全局入口文档，只保留普通对话和所有技能都适用的稳定规则。持续开发状态、任务恢复、进度更新、经验提取和项目类型差异由对应 skill 负责，尤其是 `/work`。

## 搜索优先原则

写代码前先查证不确定的信息：
- 库 / 框架 API：使用 Context7 MCP（`resolve-library-id` → `query-docs`）。
- 通用技术问题：使用 WebSearch。
- 源码取证：先用 `rg -l` 定位候选文件，再用 `rg -n -C` 或窄范围读取确认实现。
- 同一库、同一版本、同一 API 结论在 session 内复用；除非版本、错误日志或源码证据变化，不重复查询。
- 禁止凭记忆编写不确定的 API 调用。

## 通用编码规范

- 组合优于继承：禁止超过 2 层继承链，用接口和组合替代。
- async/await：网络、I/O、定时器等异步操作必须用 async/await，禁止嵌套回调。
- 链式编程：UI 构建、配置对象、动画序列优先使用 fluent / builder 风格。
- 流式编程：不轻易拆分逻辑和新建函数，除非复用率超过 3 次或能明显降低复杂度。
- 不过度封装：三行相似代码优于过早抽象。
- 不添加投机性代码：只实现当前需求需要的功能。
- web项目可以参考agents/rules/web.md,游戏引擎agents/rules/game-engine.md

## 工具使用指南

| 场景 | 工具 |
|------|------|
| 查询库 / 框架文档 | Context7 MCP |
| Web UI / 编辑器闭环验证 | Playwright MCP |
| 通用搜索 | WebSearch |
| 高风险代码评审 | 执行独立评审流程，环境支持且用户允许时可委派 agent |
| 模块 / 发布验证 | 执行独立 QA 流程，环境支持且用户允许时可委派 agent |

## 核心工作流

```
/init-project → 第一性原理访谈，生成 spec.md + task.json + progress.json
/work         → 持续自主开发循环
/stopwork     → 用户主动停止并保存进度
/change       → 中途需求变更，同步更新 spec.md + task.json + progress.json
/review       → GAN 式代码评审
```
