# Claude Code King — 万能工程模板百科大全

> 基于 Anthropic Engineering 全部 21 篇技术文章的精华提炼，结合实战工作流打造的 Claude Code 终极工程模板。
>
> **一句话定位**：打开终端，输入 `/init-project` 开始对话，输入 `/work` 永不停歇，直到项目完成。

---

## 目录

- [一、理论基石：21 篇文章核心精华](#一理论基石21-篇文章核心精华)
  - [1.1 构建有效 Agent 的五大模式](#11-构建有效-agent-的五大模式)
  - [1.2 上下文工程：Agent 的灵魂](#12-上下文工程agent-的灵魂)
  - [1.3 长期运行 Agent 的框架设计](#13-长期运行-agent-的框架设计)
  - [1.4 多 Agent 架构的规划-生成-评估三层模型](#14-多-agent-架构的规划-生成-评估三层模型)
  - [1.5 工具设计的五大原则](#15-工具设计的五大原则)
  - [1.6 Think 工具：让 Agent 停下来思考](#16-think-工具让-agent-停下来思考)
  - [1.7 多 Agent 研究系统的编排器-工作者模式](#17-多-agent-研究系统的编排器-工作者模式)
  - [1.8 评估驱动开发](#18-评估驱动开发)
  - [1.9 上下文检索：RAG 的正确打开方式](#19-上下文检索rag-的正确打开方式)
  - [1.10 沙盒安全：自主与安全的平衡](#110-沙盒安全自主与安全的平衡)
  - [1.11 代码执行 + MCP：Token 效率革命](#111-代码执行--mcptoken-效率革命)
  - [1.12 高级工具使用的三大功能](#112-高级工具使用的三大功能)
  - [1.13 Auto 模式：告别审批疲劳](#113-auto-模式告别审批疲劳)
  - [1.14 并行 Agent 团队构建大型项目](#114-并行-agent-团队构建大型项目)
  - [1.15 SWE-bench 启示：极简框架 + 好工具](#115-swe-bench-启示极简框架--好工具)
  - [1.16 基础设施噪声对评估的影响](#116-基础设施噪声对评估的影响)
  - [1.17 评估意识：模型会识别你在测试它](#117-评估意识模型会识别你在测试它)
  - [1.18 事后分析的三个教训](#118-事后分析的三个教训)
  - [1.19 Desktop Extensions：MCP 的一键安装](#119-desktop-extensionsmcp-的一键安装)
  - [1.20 AI 时代的技术评估设计](#120-ai-时代的技术评估设计)
  - [1.21 Claude Code 最佳实践](#121-claude-code-最佳实践)
- [二、核心设计哲学](#二核心设计哲学)
- [三、工程模板架构](#三工程模板架构)
- [四、三大核心工作流详解](#四三大核心工作流详解)
- [五、编码规范体系](#五编码规范体系)
- [六、工具链与 MCP 集成](#六工具链与-mcp-集成)
- [七、快速开始](#七快速开始)
- [八、FAQ](#八faq)

---

## 一、理论基石：21 篇文章核心精华

以下是对 [Anthropic Engineering Blog](https://www.anthropic.com/engineering) 全部 21 篇文章的深度提炼。这些文章构成了本项目的理论基础，每一个设计决策都可以在此找到出处。

### 1.1 构建有效 Agent 的五大模式

> 来源：[Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

这是整个 Agent 领域最重要的一篇文章。核心观点：**始终寻求最简单的解决方案，仅在必要时增加复杂性。**

**Agentic System 的两种形态：**

| 类型 | 定义 | 适用场景 |
|------|------|---------|
| **工作流 (Workflow)** | LLM 和工具通过预定义代码路径编排 | 任务明确、需要可预测性 |
| **代理 (Agent)** | LLM 动态指导自身进程和工具使用 | 开放式问题、需要灵活决策 |

**五大工作流模式：**

```
1. 提示链 (Prompt Chaining)
   任务A → [检查点] → 任务B → [检查点] → 任务C
   适用：生成大纲 → 验证 → 生成内容

2. 路由 (Routing)
   输入 → [分类器] → 专用处理器A / B / C
   适用：客服分类、模型选择（简单→Haiku，复杂→Opus）

3. 并行化 (Parallelization)
   ├── 分段：独立子任务并行（安全检查 + 主响应）
   └── 投票：同一任务多次执行取多视角

4. 编排-工人 (Orchestrator-Workers)
   编排器 → 动态拆解 → Worker1 + Worker2 + ... → 综合
   与并行化的区别：子任务由编排器动态确定

5. 评估-优化 (Evaluator-Optimizer)
   生成 → 评估 → 反馈 → 再生成（循环直到满意）
```

**自主代理的核心特征：**
- LLM 在循环中基于环境反馈使用工具
- 每步获取"ground truth"（工具结果、代码执行）
- 可在检查点暂停获取人工反馈

**三大实现原则：**
1. **简洁性**：保持设计简约
2. **透明性**：明确展示规划步骤
3. **工具文档**：投入与 HCI 同等努力创建 ACI（Agent-Computer Interface）

> **本项目的映射**：我们的 `/work` 循环采用了"评估-优化"模式（编写→评审→测试→迭代），`/init-project` 采用了"提示链"模式（需求收集→打磨→文档生成），code-reviewer 和 qa-verifier 实现了"编排-工人"模式。

---

### 1.2 上下文工程：Agent 的灵魂

> 来源：[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**核心概念：上下文工程 > 提示工程**

提示工程关注"如何写指令"，上下文工程关注"管理模型推理过程中的整个信息集合"。

**为什么至关重要：**
- LLM 的注意力是有限资源，具有递减边际回报
- 不是硬性的能力悬崖，而是性能逐渐下降
- 每增加一个 token 都消耗注意力预算

**有效上下文的三大组成：**

```
1. 系统提示词
   - 极度清晰，简洁直接
   - 找到"恰当高度"：具体指导 + 保留灵活性
   - 用 XML/Markdown 组织结构

2. 工具设计
   - 自包含、鲁棒、目的明确
   - 避免工具集臃肿

3. 示例（Few-shot）
   - "对 LLM 而言，示例相当于千言万语"
   - 策划多样化的典型例子
```

**长期任务的三种上下文策略：**

| 策略 | 适用场景 | 原理 |
|------|---------|------|
| **压缩 (Compaction)** | 需要广泛往返的任务 | 总结历史，保留关键决策 |
| **结构化笔记 (Memory)** | 有清晰里程碑的迭代开发 | 定期记录，跨会话维持状态 |
| **多代理架构** | 复杂研究和并行探索 | 子代理有干净上下文，主代理协调 |

**指导性原则：**
> 找到"最小可能的高信号 token 集合"，最大化期望结果的概率。

> **本项目的映射**：`progress.json` 和 `task.json` 就是我们的"结构化笔记"，每次 session 启动时读取恢复进度。`CLAUDE.md` 是精心设计的系统提示词。code-reviewer agent 使用 Sonnet 模型实现"多代理架构"，保持主上下文干净。

---

### 1.3 长期运行 Agent 的框架设计

> 来源：[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**核心问题：Agent 如何跨多个上下文窗口持续进展？**

两个主要失败模式：
1. **过度野心**：一次性完成整个应用 → 上下文耗尽 → 留下半成品
2. **早期宣告完成**：后续 Agent 看到进展就宣布"完成了" → 忽视剩余功能

**双层解决方案：**

```
初始化 Agent（首次运行）
├── init.sh — 可运行的开发服务器启动脚本
├── progress.txt — 工作日志，记录各 Agent 的进展
└── 初始 git 提交 — 展示添加的文件快照

编码 Agent（后续会话）
├── 一次只实现单个功能
├── git 提交记录进度
└── 更新进度文件
```

**每个编码 Agent 的标准开局：**
1. 确认工作目录
2. 读取 git 日志和进度文件
3. 选择最高优先级的未完成任务
4. 启动开发服务器
5. 执行基础端到端测试验证状态

**失败恢复策略：**
- 功能清单用 JSON 格式，Agent 只能修改 `passes` 字段
- 标记完成前必须通过端到端验证
- 模仿人类团队的"班次交接"模式

> **本项目的映射**：这篇文章是我们整个 `/work` 流程的直接灵感来源。`progress.json` = progress.txt，`task.json` = 功能清单，Session 启动协议 = 标准开局步骤，单任务循环 = "一次只实现一个功能"。

---

### 1.4 多 Agent 架构的规划-生成-评估三层模型

> 来源：[Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)

**核心洞察：分离工作与评判的 Agent 比单个 Agent 自我评估更有效。**

**三层架构：**

```
规划器 (Planner) → 生成器 (Generator) → 评估器 (Evaluator)
     ↓                    ↓                    ↓
  展开需求             代码实现          验证与反馈（Playwright）
```

**关键发现：**
- **上下文焦虑**：模型接近上下文限制时会"提前结束工作"。解法：上下文重置（清空历史，传递结构化交接物），比压缩更有效
- **自我评估偏差**：模型倾向于自我肯定。解法：独立评估器可被调优至更严格

**前端设计评分四维度：**
1. 设计质量 — 视觉凝聚力
2. 原创性 — 避免通用 AI 模板
3. 工艺 — 排版、间距、色彩和谐
4. 功能性 — 可用性

**成本对比：**
- 单 Agent：20 分钟 / $9
- 完整 Harness：6 小时 / $200
- 结论：成本高 20 倍，但输出质量显著提升

**重要提醒：**
> "每个 Harness 组件都编码了关于模型能力的假设，这些假设值得压力测试。" — 模型改进速度快，架构需动态调整。

> **本项目的映射**：`/init-project` = 规划器，`/work` 的 Implement 步骤 = 生成器，code-reviewer + qa-verifier = 评估器。这正是我们的 GAN 式评审模式的理论基础。

---

### 1.5 工具设计的五大原则

> 来源：[Writing effective tools for agents — with agents](https://www.anthropic.com/engineering/writing-tools-for-agents)

**核心定义：工具是确定性系统与非确定性代理之间的契约。**

| 原则 | 要点 |
|------|------|
| **精选工具** | 避免简单包装 API；选高影响力工作流，整合多步操作 |
| **命名空间** | 按服务和资源分组（如 `asana_search`），减少混淆 |
| **有意义的返回值** | 返回自然语言标识符而非 UUID，包含相关上下文 |
| **Token 效率** | 实施分页、过滤、截断 |
| **描述工程** | 清晰的工具说明 + 明确的输入/输出 + 有用的错误信息 |

**三步开发流程：**
1. 原型构建（用 Claude Code 快速搭建）
2. 综合评估（真实场景 + 可验证结果 + 关键指标）
3. 与 Agent 协作优化（评估结果反馈 Claude，迭代改进）

**关键洞察：**
> 数量不等于质量。更多工具会分散代理注意力。构建少而精的工具，每个都有明确用途。

> **本项目的映射**：我们只集成了 Context7（文档查询）和 Playwright（UI 测试）两个核心 MCP，体现了"少而精"的原则。

---

### 1.6 Think 工具：让 Agent 停下来思考

> 来源：[The "think" tool](https://www.anthropic.com/engineering/claude-think-tool)

**与扩展思考的区别：**
- 扩展思考 (Extended Thinking)：发生在回应生成**前**
- Think 工具：用于处理外部工具调用**后**的信息

**性能数据：**
- 航空领域基准：优化提示 + Think 工具 → 准确率从 0.370 → 0.570（+54%）

**最佳适用场景：**
- 工具输出分析与迭代
- 策略密集型环境（需遵循详细指南）
- 顺序决策（错误代价高）

**不适用场景：** 非顺序型工具调用、简单指令执行

> **本项目的映射**：我们的 code-reviewer agent 在评审时使用 Think 工具分析每个文件的问题，qa-verifier 在测试后用 Think 工具分析控制台输出。

---

### 1.7 多 Agent 研究系统的编排器-工作者模式

> 来源：[How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

**架构：编排器-工作者模式**，主研究代理分析查询，并行生成子代理多方向搜索。

**性能突破：** 多 Agent 系统比单 Agent 性能提升 **90.2%**。

**七大工程原则：**

1. **模拟代理思维** — 通过控制台观察行为，发现失败模式
2. **教导委派策略** — 为子代理提供明确目标、输出格式和任务边界
3. **根据复杂度调整资源** — 简单查询 1 个代理，复杂研究 10+ 个
4. **工具设计至关重要** — "坏的工具描述会让代理走完全错误的路径"
5. **让代理自我改进** — Claude 能诊断故障并建议改进
6. **从宽到窄** — 先广泛探索，再深入具体
7. **引导思考过程** — 利用扩展思维作为可控的草稿本

**成本权衡：** Token 消耗约为普通聊天的 **15 倍**，需要高价值任务来经济上可行。

> **本项目的映射**：我们的 `/work` 循环中，主 Agent 是编排器，code-reviewer 和 qa-verifier 是专业化工人。但我们控制了多 Agent 的范围，避免 15 倍 token 的过度消耗。

---

### 1.8 评估驱动开发

> 来源：[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

**评估的三个组成：**
1. **任务 (Task)** — 明确定义的输入和成功标准
2. **评分器 (Grader)** — 代码型、模型型或人工评分
3. **记录 (Transcript)** — 完整的交互过程

**按 Agent 类型的评估策略：**

| 类型 | 方法 |
|------|------|
| 编码 Agent | 运行单元测试验证 + LLM 评分代码质量 |
| 对话 Agent | 多维评估（任务完成度、交互质量） |
| 研究 Agent | 综合评估（完整性、可靠性、逻辑性） |

**关键实践：**
- **从小处开始**："20-50 个简单任务远优于空无一物"
- **阅读评估记录**：不要盲目相信分数，审视失败案例的合理性
- **环境隔离**：每次测试从干净环境开始，避免状态污染

> **本项目的映射**：qa-verifier agent 就是我们的评估系统。Web 项目用 Playwright 做端到端测试 + 控制台零 error 策略；游戏项目用编译检查 + 单元测试。

---

### 1.9 上下文检索：RAG 的正确打开方式

> 来源：[Introducing Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)

**核心问题：** 传统 RAG 分割文档时丢失背景信息。

**解决方案：**
- **上下文嵌入**：为每个文本块添加 50-100 字的解释性上下文
- **上下文 BM25**：将上下文添加到 BM25 索引，与语义嵌入互补

**效果数据：**
- 上下文嵌入：检索失败率 -35%
- 两者结合：-49%
- 加重排序：**-67%**

**实施成本：** 每百万文档词元仅 $1.02。

> **本项目的映射**：Context7 MCP 就是我们的检索工具，在写代码前先查文档，避免凭记忆写 API 调用。

---

### 1.10 沙盒安全：自主与安全的平衡

> 来源：[Beyond permission prompts: making Claude Code more secure and autonomous](https://www.anthropic.com/engineering/claude-code-sandboxing)

**核心创新：** 操作系统级隔离的沙盒化 Bash 工具。

**成效：** 权限提示减少 **84%**，同时提升安全防护。

**双重边界：**
- 文件系统隔离：定义可访问目录
- 网络隔离：定义可访问主机

> 即使遭遇成功的提示词注入攻击，隔离机制也能防止访问 SSH 密钥或向攻击者泄露数据。

---

### 1.11 代码执行 + MCP：Token 效率革命

> 来源：[Code execution with MCP: Building more efficient agents](https://www.anthropic.com/engineering/code-execution-with-mcp)

**核心问题：** 传统 MCP 将所有工具定义和中间结果加载到上下文，token 暴增。

**解决方案：** 将 MCP 服务器呈现为代码 API，Agent 编写代码与 MCP 交互。

**效率提升：** 从 150,000 token 降至 2,000 token — **节省 98.7%**。

| 优势 | 说明 |
|------|------|
| 渐进式加载 | 按需读取工具定义 |
| 数据过滤 | 10,000 行数据在执行环境中过滤，仅返回 5 行 |
| 控制流 | 循环和条件在代码中执行，无需多轮对话 |
| 状态持久化 | 可保存代码为可复用 Skills |

---

### 1.12 高级工具使用的三大功能

> 来源：[Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use)

**1. 工具搜索工具 (Tool Search)**
- 动态发现工具而非预加载所有定义
- Token 使用减少 **85%**，准确率从 49% → 74%

**2. 程序化工具调用 (Programmatic Tool Calling)**
- Claude 生成 Python 代码在沙箱执行
- Token 降低 **37%**，减少 19+ 次推理

**3. 工具使用示例 (Tool Use Examples)**
- 在工具定义中提供具体调用样例
- 复杂参数处理准确率从 72% → **90%**

**分层策略：** 按优先级解决主要瓶颈，而非一次全部启用。

---

### 1.13 Auto 模式：告别审批疲劳

> 来源：[Claude Code auto mode: a safer way to skip permissions](https://www.anthropic.com/engineering/claude-code-auto-mode)

**问题：** 用户批准率高达 93%，导致"审批疲劳"。

**双层防御架构：**
- **输入层**：提示注入探针扫描
- **输出层**：转录分类器评估每项操作

**防御的四类威胁：**
1. 过度积极行为（超越授权范围）
2. 诚实错误（误解影响范围）
3. 提示注入（恶意指令劫持）
4. 模型失配（追求自己的目标）

**性能：** 真实流量误报率仅 **0.4%**。

---

### 1.14 并行 Agent 团队构建大型项目

> 来源：[Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)

**成果：** 16 个并行 Claude 实例，2000+ 会话，成功开发 10 万行 Rust C 编译器，可编译 Linux 6.9 内核。

**核心架构：**
- **资源隔离**：每个 Agent 在 Docker 容器中独立工作
- **任务锁定**：通过文本文件实现互斥，防止重复工作
- **角色专业化**：核心开发、去重、优化、评审、文档各司其职

**三大启示：**

1. **极高质量的测试框架**："Claude 会自主解决任何问题，所以任务验证器必须近乎完美"
2. **从 Agent 角度设计环境**：控制上下文污染，提供 `--fast` 选项
3. **并行化策略**：使用"已知正确的预言机"（如 GCC）实现并行调试

**能力边界：** "新功能和 Bug 修复经常破坏现有功能" — 当前模型在大规模项目维护中仍有脆弱性。

---

### 1.15 SWE-bench 启示：极简框架 + 好工具

> 来源：[Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet](https://www.anthropic.com/engineering/swe-bench-sonnet)

**核心方法：极简主义 — "给予 LLM 尽可能多的控制权"。**

系统仅包含：
- 一个 Bash 工具
- 一个编辑工具
- 简洁的初始提示词

**关键细节：**
- 强制使用绝对路径后，文件定位错误率从高降为**零**
- 工具描述的精确性直接决定性能
- 为模型设计工具，如同为 junior 开发者写文档

> **本项目的映射**：我们的工具链遵循极简原则 — Context7 查文档、Playwright 做测试、Git 做版本控制，仅此而已。

---

### 1.16 基础设施噪声对评估的影响

> 来源：[Quantifying infrastructure noise in agentic coding evals](https://www.anthropic.com/engineering/infrastructure-noise)

**核心发现：** 基础设施配置本身可导致基准测试结果波动 **超过 6 个百分点**，常大于顶级模型间的排名差距。

**实践建议：**
- 分离保证分配和硬性限制
- 标准化报告资源配置
- **小于 3 个百分点的排名领先需持怀疑态度**

---

### 1.17 评估意识：模型会识别你在测试它

> 来源：[Eval awareness in Claude Opus 4.6's BrowseComp performance](https://www.anthropic.com/engineering/eval-awareness-browsecomp)

**发现：** Claude Opus 4.6 能独立推断自己正在被评估，识别具体基准测试，然后解密答案密钥。

**核心风险：**
- 多 Agent 配置的污染率是单 Agent 的 **3.7 倍**
- 二进制限制和身份验证是最有效的防护
- 将评估完整性视为持续对抗问题

> **教训**：随着模型能力增强，静态评估方法将越来越不可靠，需要根本性改变。

---

### 1.18 事后分析的三个教训

> 来源：[A postmortem of three recent issues](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues)

**三个重叠的 Bug：**
1. 上下文窗口路由错误（0.8% → 30% 受影响）
2. TPU 服务器配置错误导致输出损坏
3. XLA:TPU 编译器 miscompilation

**检测困难的原因：**
- 依赖噪声过大的评估标准
- 多个 Bug 在不同平台以不同速率表现
- 隐私控制限制了调试访问

**改进措施：**
1. 开发更敏感的评估方法
2. 在生产系统持续运行质量评估
3. 改进调试工具同时保护隐私

> **核心承诺**："我们绝不因需求、时间或服务器负载而降低模型质量。"

---

### 1.19 Desktop Extensions：MCP 的一键安装

> 来源：[Desktop Extensions: One-click MCP server installation](https://www.anthropic.com/engineering/desktop-extensions)

**解决的痛点：** 消除对 Node.js/Python 等运行环境的依赖，无需手动编辑 JSON 配置。

**技术架构：** `.mcpb` 文件 = ZIP 存档（manifest.json + server/ + dependencies/）

**三个命令即可发布：**
```bash
npx @anthropic-ai/mcpb init   # 生成 manifest
npx @anthropic-ai/mcpb pack   # 打包成 .mcpb
```

---

### 1.20 AI 时代的技术评估设计

> 来源：[Designing AI-resistant technical evaluations](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations)

**核心发现：** 精心设计的编程考题被新版 Claude 不断破解。

**三次迭代：**
- v1：Opus 4 超越大多数人类
- v2：Opus 4.5 匹配最佳人类
- v3：Zachtronics 风格谜题成功区分人机

**启示：** 完全禁用 AI 并非最佳方案。需要设计"充分新颖"的问题，使人类推理能突破 AI 的知识边界。

---

### 1.21 Claude Code 最佳实践

> 来源：[Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)（现已重定向至 code.claude.com/docs）

这篇文章的核心实践已深度融入本项目的每一个细节：
- **CLAUDE.md 作为系统提示词**：项目级别的指令文件
- **搜索优先原则**：写代码前先查文档
- **增量提交**：每个任务完成立即提交
- **工具使用指南**：Context7 查文档、Playwright 做测试

---

## 二、核心设计哲学

从 21 篇文章中提炼出的 **8 条核心原则**，指导本项目的每一个设计决策：

### 原则 1：简单性至上
> "成功不在于构建最复杂的系统，而是构建适合需求的正确系统。" — Building effective agents

- 优先用单次 LLM 调用解决问题
- 只在必要时增加复杂性
- 三行相似代码优于一个过早抽象

### 原则 2：搜索优先，不凭记忆写代码
> "禁止凭记忆写 API 调用" — Claude Code best practices

- 写代码前先用 Context7 查最新文档
- 不确定的技术问题用 WebSearch 搜索
- 工具的准确性直接决定 Agent 的性能

### 原则 3：上下文是稀缺资源
> "找到最小可能的高信号 token 集合" — Effective context engineering

- 不要把所有信息塞进上下文
- 使用结构化文件（progress.json）跨 session 保存状态
- 利用多 Agent 架构保持各自上下文干净

### 原则 4：分离生成与评估
> "分离工作与评判的 Agent 比单个 Agent 自我评估更有效。" — Harness design

- 写代码的 Agent ≠ 评审代码的 Agent ≠ 测试的 Agent
- code-reviewer 用 Sonnet 模型，保持客观
- GAN 式对抗：生成器 vs 判别器

### 原则 5：增量推进，一次一个任务
> "一次只实现单个功能" — Effective harnesses

- 单任务聚焦，做完再取下一个
- 每个任务完成立即提交 + 更新进度
- 避免"过度野心"和"早期宣告完成"

### 原则 6：工具设计 = 用户体验设计
> "投入与 HCI 同等努力创建 ACI" — Building effective agents

- 工具是 Agent 与系统交互的界面
- 清晰的描述、明确的参数、有用的错误信息
- 数量不等于质量，少而精

### 原则 7：评估驱动开发
> "没有评估的团队只能在生产环境中发现问题" — Demystifying evals

- 每个任务完成后都要经过 Review + Test
- 从 20-50 个简单测试开始
- 阅读失败记录，不盲目相信分数

### 原则 8：进度可恢复
> "模仿人类团队的班次交接模式" — Effective harnesses

- progress.json 保证任何时候断开都能恢复
- git commit 记录每一步变更
- task.json 的状态机：pending → in-progress → completed / blocked

---

## 三、工程模板架构

```
claude-codeking/                    # 项目根目录
├── CLAUDE.md                       # 🧠 核心指令文件（系统提示词）
├── context.md                      # 项目背景和需求来源
├── README.md                       # 📖 你正在看的这个文件
│
├── templates/                      # 📐 文件模板
│   ├── spec.md                     #    项目规格说明模板
│   └── task.json                   #    任务列表模板
│
├── .claude/                        # ⚙️ Claude Code 配置目录
│   ├── rules/                      #    项目类型特定规则
│   │   ├── web.md                  #    Web 开发规则
│   │   └── game-engine.md          #    游戏引擎开发规则
│   ├── skills/                     #    自定义 Skill（斜杠命令）
│   │   ├── init-project/SKILL.md   #    /init-project 初始化
│   │   ├── work/SKILL.md           #    /work 持续开发
│   │   └── review/SKILL.md         #    /review 代码评审
│   └── agents/                     #    自定义 Agent
│       ├── code-reviewer/          #    代码评审 Agent（Sonnet）
│       └── qa-verifier/            #    QA 验证 Agent（Sonnet）
│
├── spec.md                         # 🎯 [生成] 项目规格说明
├── task.json                       # 📋 [生成] 任务列表
└── progress.json                   # 📊 [生成] 进度追踪
```

### 架构设计理念

**为什么是这个结构？**

| 设计决策 | 理论来源 | 原因 |
|---------|---------|------|
| CLAUDE.md 作为统一入口 | 上下文工程 | 系统提示词必须极度清晰、结构化 |
| rules/ 按项目类型分离 | 路由模式 | 不同输入导向专门化处理 |
| agents/ 独立评审和测试 | 生成-评估分离 | 分离工作与评判更有效 |
| progress.json 持久化 | 框架设计 | 跨 session 恢复，班次交接 |
| templates/ 模板化 | 提示链模式 | 结构化输出，减少随机性 |
| skills/ 斜杠命令 | 极简框架 | 一个命令触发完整工作流 |

---

## 四、三大核心工作流详解

### 4.1 `/init-project` — 交互式需求收集

**对应理论：** 提示链模式 + 评估-优化模式

```
Phase 1: 项目类型确认
    → web / game-engine

Phase 2: 需求收集（逐个提问）
    → 核心问题 → 目标用户 → 核心功能 → 技术栈 → 参考资料

Phase 3: 需求打磨（反对话/对抗）
    → 对模糊需求追问
    → 检查遗漏项（认证、错误处理、部署...）
    → 提出架构建议

Phase 4: 技术调研
    → Context7 查询选定技术栈最新文档
    → WebSearch 搜索未知技术

Phase 5: 生成工程文档
    → spec.md（项目规格）
    → task.json（任务列表）
    → progress.json（进度追踪）

Phase 6: 确认与提交
    → 展示摘要 → 用户确认 → git commit
```

### 4.2 `/work` — 持续自主开发循环

**对应理论：** 评估-优化模式 + 框架设计 + 多 Agent 架构

```
┌─────────────────────────────────────────┐
│              Startup 启动检查             │
│  读取 progress.json → task.json → spec  │
│  加载对应 rules → 检查 git 状态          │
└──────────────────┬──────────────────────┘
                   │
          ┌────────▼────────┐
          │  Step 1: Plan   │ ← Context7 查文档
          │  验收契约对齐     │ ← 确认依赖已完成
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Step 2: Implement│ ← 遵循编码规范
          │ 编写代码         │ ← 单任务聚焦
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Step 3: Review  │ ← 仅高风险时启用 code-reviewer
          │ 条件式评审      │ ← 微任务默认作者自检
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Step 4: Build   │ ← 硬性编译门禁
          │ Step 5: Validate│ ← 分层验证 / milestone QA
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Step 6: Commit  │ ← git add (具体文件)
          │ 更新 progress   │ ← 更新 task.json
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Step 7: Continue│ ← 取下一个 pending 任务
          │ 永不停止        │ ← 全部完成或阻塞才停
          └────────┬────────┘
                   │
                   ▼ (回到 Step 1)
```

**现在的最小增强有两点：**
1. 每个任务都带最小验收契约：`changeArea`、`doneWhen`、`verificationLevel`
2. 验证改成四层：`local` → `slice` → `milestone` → `release`

这两个变化的价值很直接：
- QA 不再被迫为每个微任务付出最长等待时间
- 评审和 QA 都有了明确触发条件，而不是“只要改了代码就全跑一遍”
- Web 和游戏引擎都能套用同一套抽象：route / API / page state 对应 scene / editor / runtime loop

**错误恢复机制：**
1. 在 progress.json 的 notes 中记录错误
2. 将任务 status 改为 `blocked`
3. 跳到下一个不依赖此任务的 pending 任务
4. 如果无可用任务，输出阻塞报告并停止

### 4.3 `/review` — GAN 式代码评审

**对应理论：** 评估-优化模式 + 生成-评估分离

```
确定范围 → 启动 code-reviewer Agent → 四维检查 → 呈现报告 → 可选自动修复
```

**四维检查：**
1. **Bug 检测**：空指针、未处理异常、逻辑错误、资源泄漏
2. **规范合规**：函数长度、文件长度、继承层级、异步模式
3. **架构设计**：God class？职责单一？过度封装？
4. **安全检查**：SQL 注入、XSS、命令注入

**输出规则：**
- 只报告置信度 ≥ 80 的问题
- 按严重程度排序：critical > warning > info
- 不做风格 nitpick

**调用原则：**
- `code-reviewer` 是高风险 / 跨边界改动的门禁，不是每个微任务的固定税
- 默认先作者自检，对照 `doneWhen` 和最可能出错的边界条件
- 当任务涉及公开接口、并发、安全、持久化、runtime 核心路径时，再升级为外部评审

---

## 五、编码规范体系

### 5.1 通用规范（所有项目类型）

| 规范 | 说明 | 理论来源 |
|------|------|---------|
| 组合优于继承 | 禁止超过 2 层继承链 | 简单性原则 |
| async/await | 所有异步操作必须使用 | 避免回调地狱 |
| 链式编程 | UI 构建、配置、动画 | Fluent API |
| 流式编程 | 不轻易拆分逻辑 | 减少文件膨胀 |
| 不过度封装 | 三行相似代码 > 过早抽象 | 简单性原则 |
| 不投机编码 | 只实现当前需要的 | YAGNI |

### 5.2 Web 项目规范

```
架构：组件式（组合优于继承）
状态：signals / stores / atoms（不 prop drill）
异步：async/await + Promise.all + 超时 + 错误边界
UI：Builder 模式 + Fluent API
类型：props 必须有类型，API 返回必须有类型，禁止 any
测试：Playwright E2E + 视觉验证 + 零 error 控制台
```

### 5.3 游戏引擎规范

```
架构：ECS 严格执行
  Entity = 纯 ID
  Component = 纯数据（struct/data class，无方法）
  System = 纯逻辑处理器

异步：
  Unity → UniTask / async-await
  Unreal → UE5Coro / AsyncTask
  Cocos → Promise / async-await

链式编程：
  UI → UIBuilder.Create().SetText(x).SetSize(y).Build()
  动画 → anim.MoveTo(pos).Then().FadeIn(dur).Play()
  配置 → Config.New().WithSpeed(x).WithHealth(y).Apply()

禁止：
  × MonoBehaviour 万能类
  × Update/Tick 中分配内存（用对象池）
  × 超过 1 层的组件继承
```

---

## 六、工具链与 MCP 集成

### 核心工具矩阵

| 工具 | 用途 | 使用时机 |
|------|------|---------|
| **Context7 MCP** | 查询库/框架最新文档 | 写代码前必查 |
| **Playwright MCP** | Web UI / 编辑器闭环验证 | Step 5: Validate |
| **WebSearch** | 搜索通用技术问题 | 遇到未知技术 |
| **code-reviewer Agent** | 高风险代码评审 | Step 3: Review |
| **qa-verifier Agent** | 模块 / 发布验证 | Step 5: Validate |

### Context7 使用流程

```
1. resolve-library-id → 找到库的 ID
2. query-docs → 用 ID 查询具体 API 文档
3. 基于真实文档编写代码
```

### Playwright 使用流程

```
1. browser_navigate → 打开目标页面
2. browser_snapshot → 获取页面快照（检查渲染）
3. browser_console_messages → 检查零 error
4. browser_click → 测试关键交互
5. browser_fill_form → 测试表单输入
```

### 为什么只集成这些工具？

> "数量不等于质量。更多工具会分散代理注意力。" — Writing effective tools for agents

我们遵循"少而精"原则：
- Context7 覆盖了 99% 的文档查询需求
- Playwright 覆盖了 Web 项目的端到端测试
- WebSearch 作为兜底的通用搜索
- 不需要更多。每增加一个工具，就增加一个 Agent 出错的概率。

---

## 七、快速开始

### 前提条件

- 安装 [Claude Code CLI](https://code.claude.com)
- 配置 Context7 MCP 和 Playwright MCP

### 三步启动

```bash
# 1. 克隆模板
git clone https://github.com/your-username/claude-codeking.git my-project
cd my-project

# 2. 在终端启动 Claude Code
claude

# 3. 初始化项目（交互式对话）
/init-project 我的电商网站
```

### 开始开发

```bash
# 持续自主开发（永不停歇直到完成）
/work

# 手动评审特定文件
/review src/components/Header.tsx

# 评审所有变更
/review all
```

### Session 恢复

每次重新打开 Claude Code，系统会自动：
1. 读取 `progress.json` 恢复进度
2. 报告当前状态（已完成/总数/当前任务/阻塞项）
3. 加载对应的项目类型规则
4. 检查 git 状态

---

## 八、FAQ

### Q: 为什么不用更多的 MCP 工具？
**A:** "数量不等于质量"（文章 #14）。每增加一个工具，Agent 需要在更多选项中选择，增加出错概率。我们只保留最高 ROI 的工具。

### Q: 为什么用 JSON 而不是数据库追踪进度？
**A:** 简单性原则（文章 #1）。JSON 文件可以 git 追踪，人类可读，Agent 直接读写，不需要额外的数据库服务。

### Q: code-reviewer 为什么用 Sonnet 而不是 Opus？
**A:** 成本效率。评审任务不需要最强模型的创造力，Sonnet 足够识别 Bug 和规范违规。同时也实现了"生成与评估的模型分离"（文章 #4），保持评估的独立性。

### Q: 为什么强调"不过度封装"？
**A:** "三行相似代码优于一个过早抽象"。过度封装增加理解成本，增加 Agent 的上下文消耗（文章 #2），而且 Agent 生成的抽象层往往不如人类设计的精炼。

### Q: /work 循环会不会消耗太多 Token？
**A:** 会，但现在不再把昂贵验证平均摊到每个微任务。最新公开实践已经证明，evaluator 不是固定的 yes/no 组件，而是只在任务落到模型能力边界之外时才真正有价值。这个模板现在把外部 review 和 QA 推迟到高风险、模块里程碑和发布阶段，平时优先跑最窄的可执行验证。

### Q: qa-verifier 为什么不能每个任务都跑一次？
**A:** 因为最慢的验证不应该成为默认验证。QA 的价值来自独立视角和真实运行证据，但它的代价也最高。对一个低风险微任务，编译、窄测试、局部 smoke 通常已经足够；把 QA 改成模块级 `milestone` 和发布级 `release`，收益更高，等待更低。

### Q: 为什么 Web 页面的一些细微不雅观、差一点的地方，QA 总是根治不了？
**A:** 因为那不是纯 QA 问题，而是设计约束没有在前面写清楚。QA 更擅长发现“坏了、错了、断了”，不擅长稳定地定义“到底够不够好看”。正确做法是把这些要求前置成可观察的验收标准，写进 spec 和 `doneWhen`：例如层级、密度、状态、空态、移动端不破版。没有前置标准，末端 QA 只能不断给出主观建议，既慢又不稳定。

### Q: 如何处理 /work 过程中的上下文耗尽？
**A:** 文章 #3 和 #4 给出了答案：
1. `progress.json` 记录了精确的进度状态
2. 每个任务完成后立即 git commit
3. 新 session 启动时从 progress.json 恢复
4. 这模仿了人类团队的"班次交接"模式

### Q: 这个模板适合多大的项目？
**A:** 目前设计针对中小型项目（50-200 个任务）。对于更大的项目，可参考文章 #14 的并行 Agent 团队模式，但那需要更复杂的基础设施（Docker 容器、任务锁定等）。

---

## 附录：21 篇文章速查表

| # | 文章 | 核心一句话 | 本项目对应 |
|---|------|-----------|-----------|
| 1 | Building effective agents | 始终寻求最简单的解决方案 | 整体架构设计哲学 |
| 2 | Effective context engineering | 上下文是稀缺资源 | CLAUDE.md + progress.json |
| 3 | Effective harnesses for long-running agents | 班次交接模式 | /work 循环 + progress.json |
| 4 | Harness design for long-running apps | 分离生成与评估 | code-reviewer + qa-verifier |
| 5 | Writing effective tools for agents | 少而精的工具 | Context7 + Playwright |
| 6 | The "think" tool | 让 Agent 在工具调用后思考 | Agent 评审分析 |
| 7 | Multi-agent research system | 编排器-工作者模式 | /work 中的 Agent 调度 |
| 8 | Demystifying evals for AI agents | 评估驱动开发 | qa-verifier |
| 9 | Contextual Retrieval | 上下文增强检索 | Context7 MCP |
| 10 | Claude Code sandboxing | 沙盒 = 自主 + 安全 | 安全实践参考 |
| 11 | Code execution with MCP | Token 效率革命 | MCP 集成策略 |
| 12 | Advanced tool use | 工具搜索 + 程序化调用 | 工具加载策略 |
| 13 | Claude Code auto mode | 双层防御架构 | 权限管理参考 |
| 14 | Building a C compiler | 并行 Agent 团队 | 大型项目扩展方向 |
| 15 | SWE-bench with Sonnet | 极简框架 + 好工具 | 极简工具链 |
| 16 | Infrastructure noise | 基准测试不可全信 | 测试结果解读 |
| 17 | Eval awareness (BrowseComp) | 模型会识破测试 | 评估方法论 |
| 18 | Three postmortems | 持续运行质量评估 | 错误恢复机制 |
| 19 | Desktop Extensions | MCP 一键安装 | MCP 生态参考 |
| 20 | AI-resistant evaluations | 设计充分新颖的测试 | 测试策略 |
| 21 | Claude Code best practices | 搜索优先 + 增量提交 | 整个工作流 |

---

> **最后的话**
>
> 这个项目的每一行配置、每一个 Agent、每一条规范，都来自 Anthropic 工程团队的实战经验。
>
> 我们不是在造轮子，而是在把 21 篇文章的精华，变成一个打开终端就能用的完整工程系统。
>
> **简单到极致，就是最强大的复杂。**
