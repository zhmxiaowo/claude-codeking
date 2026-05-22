# 游戏引擎开发规则

## 业务优先 ECS
- **Entity**：对应 Actor / GameObject / Node，是场景中的业务对象，允许保留 Transform、层级、生命周期等引擎基础属性。
- **Component**：数据容器，可包含只修改自身数据或自身 Entity 的小方法；特殊交互能力可用临时 Component 表达。
- **System**：模块中心，`<ModuleName>System` 管理本模块业务逻辑，组合模块内 Component 和原子方法。
- System 不直接互调；跨模块流程交给 Flow 编排。
- 禁止 MonoBehaviour 万能类、臃肿 Actor、臃肿 Node 脚本。
- 禁止超过 1 层组件继承，优先用组合和接口。

## Flow 编排
- Flow 是跨模块的可读代码版蓝图，也是业务流程中枢。
- Flow 可以调用任何 Module、Shared、System、原子方法、Component 方法。
- Flow 耦合度最高，负责排列组合、数据传输、分支、等待和必要的 transaction / 回滚。
- 模块不能依赖 Flow；删除 `Flows/` 不应影响任一模块自身逻辑。
- 写得好的 Flow 优先调用 ModuleSystem 和原子方法，避免深入修改模块内部细节。

## 异步模式
- Unity：使用 UniTask / async-await，禁止嵌套协程回调。
- Unreal：使用 UE5Coro / AsyncTask，禁止回调地狱。
- Cocos：使用 Promise / async-await。
- 网络请求、资源加载、场景切换必须异步，并包含超时和错误处理。

## 链式编程
- 允许返回对象自身的链式操作，用于提升流程性和可读性。

## 目录组织

```text
Assets|Content/
└── <ProjectName>/
    ├── Modules/
    │   └── <ModuleName>/
    │       ├── Components/
    │       ├── Systems/
    │       ├── Data/
    │       └── Tests/
    ├── Flows/
    ├── Shared/
    │   ├── Components/
    │   ├── Services/
    │   └── Utils/
    ├── UI/
    └── Config/
```

- 项目名目录是唯一 root，方便整体迁移和作为插件导入时不污染宿主工程。
- 模块内部 ECS 按模块聚合，不按 Components / Systems 全局分层拆散。
- 跨模块编排只放 `Flows/`。
- 跨模块共享代码放 `Shared/`；通用临时能力 Component 可放 `Shared/Components/`。

## 代码规范
- System 类只处理一种模块职责。
- 禁止在 Update/Tick 中分配内存，使用对象池或重复引用对象。
- 数据结构驱动设计，避免过度封装。
- 资源路径、Prefab、Asset ID 放在 Config/Data，不散落在逻辑里。
- 公开原子操作放在 BPLibrary、Static Method 或等价工具层。

## 测试
- System 和 Flow 逻辑必须可单元测试，并尽量与引擎运行时解耦。
- 编译检查执行零 warning 策略。
- 关键路径必须有帧时间预算。
