# Web 开发规则

## 架构模式
- 组件式架构（组合优于继承）：每个 UI 元素 = 独立组件，通过 props/slots 组合
- 禁止超过 2 层的类继承链；使用接口/类型约束代替抽象基类
- 状态管理：优先使用 signals/stores/atoms，避免 prop drilling

## 异步模式
- 所有网络请求、I/O 操作必须使用 async/await
- 并行请求使用 Promise.all / Promise.allSettled
- 禁止嵌套回调（超过 2 层即违规）
- 所有外部调用必须设置超时和错误边界

## 链式编程
- 复杂 UI 构建使用 Builder 模式
- 配置对象使用链式 setter：`config.setA(x).setB(y).build()`
- Fluent API 风格：`element.style({...}).on('click', handler).appendTo(parent)`

## 目录组织
```
src/
├── components/    # UI 组件（一个文件一个组件）
├── services/      # API 调用 / 业务逻辑
├── stores/        # 状态管理
├── utils/         # 纯工具函数
├── types/         # TypeScript 接口/类型定义
├── hooks/         # 自定义 hooks（React）/ composables（Vue）
└── assets/        # 静态资源
```

## 代码规范
- 组件 props 必须有类型定义
- API 返回值必须有类型定义
- 禁止 any 类型（除非有注释说明原因）

## 测试
- 使用 Playwright 进行 E2E 测试
- 关键用户流程必须有视觉验证（截图对比）
- 测试期间监控浏览器控制台，零 error 策略
- API 集成测试使用真实请求，禁止 mock 数据库
