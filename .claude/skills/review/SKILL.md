---
name: review
description: 代码评审。使用 GAN 式外部评审模式检查代码质量，支持指定文件或评审全部变更。
argument-hint: [可选：文件路径，或 "all" 评审全部变更]
user-invocable: true
---

# 代码评审工作流

你现在执行代码评审，使用外部评审者模式（生成者与评估者分离）来确保评审质量。

## 确定评审范围

- 无参数：评审 `git diff` 中的未暂存变更
- `$ARGUMENTS` 为文件路径：评审指定文件
- `$ARGUMENTS` 为 "all"：评审 `git diff HEAD` 所有变更（含已暂存）
- `$ARGUMENTS` 为 "staged"：评审 `git diff --cached` 已暂存变更

## 执行评审

启动 code-reviewer agent，传入评审范围。

Agent 将按以下维度检查：

### 1. Bug 检测
- 空指针/未定义引用
- 未处理的异常路径
- 逻辑错误和边界条件
- 资源泄漏（未关闭的连接、文件等）

### 2. 规范合规
- 读取 CLAUDE.md 和对应的 rules 文件
- 检查：函数长度、文件长度、继承层级、异步模式、链式编程

### 3. 架构设计
- 是否存在 god class / god function？
- 职责是否单一？
- 是否有过度封装或不必要的抽象？
- 依赖关系是否合理？

### 4. 安全检查
- SQL 注入
- XSS（跨站脚本）
- 命令注入
- 敏感信息硬编码

## 呈现结果

按严重程度排序展示所有发现（仅 ≥ 80 置信度）：

```
## 评审报告

### 📊 摘要
- 检查文件数：X
- 发现问题数：X（critical: X, warning: X, info: X）

### 🔴 Critical
[问题列表]

### 🟡 Warning
[问题列表]

### 🔵 Info
[问题列表]
```

## 自动修复

评审完成后询问用户：
> 发现 X 个可自动修复的问题，是否立即修复？

如用户同意，逐个修复 critical 和 warning 级别的问题，每次修复后重新验证。
