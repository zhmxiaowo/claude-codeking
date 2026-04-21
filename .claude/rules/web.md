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

前端代码放在项目根 `frontend/`，后端代码放在项目根 `backend/`。

```
frontend/src/
├── components/    # UI 组件（一个文件一个组件）
├── services/      # API 调用 / 业务逻辑
├── stores/        # 状态管理（Pinia，T2+）
├── composables/   # VueUse 风格的组合式函数
├── router/        # 路由（T2+）
├── views/         # 页面（T2+）
├── lib/           # 工具函数（utils.ts, request.ts）
├── types/         # TypeScript 接口/类型定义
└── assets/        # 静态资源

backend/app/
├── api/           # 路由层（含 v1/）
├── core/          # 配置与安全
├── models/        # SQLModel 持久化模型
├── schemas/       # Pydantic 请求/响应模型
├── services/      # 业务逻辑
└── db/            # session / engine
```

## 代码规范
- 组件 props 必须有类型定义
- API 返回值必须有类型定义
- 禁止 any 类型（除非有注释说明原因）
- 后端所有路由必须有 `response_model`
- SQLModel 与 Pydantic schema 分层，不让持久化模型直接出现在 API 响应里

## 测试
- 使用 Playwright 进行 E2E 测试
- 关键用户流程必须有视觉验证（截图对比）
- 测试期间监控浏览器控制台，零 error 策略
- API 集成测试使用真实请求，禁止 mock 数据库

## 视觉设计规范
- 所有 UI 决策必须先读项目根 `DESIGN.md`（由 `/ui-ux-pro-max` 或 `/design-skill` 产出）
- 禁止在组件中硬编码 hex 颜色；所有颜色走 Tailwind `@theme` 变量（映射自 DESIGN.md 的 Color Palette）
- 字体家族与字号走 DESIGN.md 的 Typography Rules
- 图标只能用 `@iconify/vue`（通用）或 `lucide-vue-next`（仅 T3 shadcn-vue 场景）。禁止安装其他独立图标包（`@heroicons/vue`、`phosphor-vue`、`@fortawesome/*` 等），其他风格统一走 iconify
- 每个页面/组件首次实现必须包含合理视觉元素（图标 / 配图），不允许纯文字 UI
- 配图规则：
  - 固定尺寸占位图用 `https://picsum.photos/{width}/{height}`
  - 所有 `<img>` 必须设置 width/height 或 aspect-ratio
- 如需更换设计方案：`/ui-ux-pro-max` 重跑推理，或 `/design-skill` 换预设，二者都会覆盖项目根 `DESIGN.md`

## 版本锁定
- 后端：`uv.lock` 必须提交；禁止使用 `requirements.txt`
- 前端：`package-lock.json` 必须提交
- 环境变量：`.env.example` 必须提交；`.env` 必须进 `.gitignore`；后端配置走 `pydantic-settings`，不直接读 `os.environ`
