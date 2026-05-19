# 游戏引擎开发规则

## ECS 架构（严格执行）
- **Entity**：纯 ID，无逻辑无数据
- **Component**：数据容器，可容纳专属方法逻辑
- **System**：逻辑处理器，Entity集合器，操作 Component 数据,控制整体逻辑
- 禁止 MonoBehaviour 万能类（Unity）/ 臃肿 Node 脚本（Cocos）
- 禁止超过 1 层的组件继承
- 

## 异步模式
- **Unity**：使用 UniTask / async-await，禁止嵌套协程回调
- **Unreal**：使用 UE5Coro / AsyncTask，禁止回调地狱
- **Cocos**：使用 Promise / async-await
- 网络请求、资源加载、场景切换必须异步
- 所有异步操作必须有超时和取消机制

## 链式编程
- UI 构建器使用链式 API：`UIBuilder.Create().SetText(x).SetSize(y).Build()`
- 动画序列使用链式：`anim.MoveTo(pos).Then().FadeIn(dur).Play()`
- 配置链：`Config.New().WithSpeed(x).WithHealth(y).Apply()`


## 代码规范
- System 类只处理一种模块职责
- Component 不包含任何方法（纯 struct/data class）
- 禁止在 Update/Tick 中分配内存（使用对象池）
- 公开的原子操作规范编写,BPLibrary(UE) / Static Method(Unity)
- 数据结构驱动设计，禁止过度封装,Structure(UE) / Data Class(Unity)


## 测试
- System 逻辑必须可单元测试（与引擎解耦）
- 编译检查：零 warning 策略
- 性能测试：关键路径的帧时间预算