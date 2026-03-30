#最重要的事:
1.阅读:https://www.anthropic.com/engineering 的全部文章,仔细提炼他们的观点和核心内容.
2.上述文章的内容是我们参考的绝对重点,非常重要!

#我希望做的事
我现在希望组建一个完整的编程链路,但是不能复杂,要高效,省token和万能.
1.通过superpowers的功能(不一定是它,只是举例),先提炼完整的项目需求,并列出spec.md,task.json,progress.json等,参考:https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
2.通过search-first的原则,搜索足够有用的,正确的信息,例如通过contex7搜索最新最正确的API信息,exa搜索全量信息,kimi serach mpc搜索中文或者中国内容的信息,Tavily Search等.还有一个skill是可以没配置的情况下搜索信息的(备选,就像我们平时打开bing搜索一样,是不需要apikey的)
3.其他优化方式:
搜索压缩 Jina Reader压缩web内容
UI/观察	Stagehand, Playwright, Context7	网页自动化与视觉反馈
架构管理	Memory-MCP (SQLite), Plan.md (模式)	保证长周期运行不迷路
游戏引擎	Documentation-Crawler, C# Helper	专门针对 Unity/Cocos 的代码补全

我们目前的功能基本只有前后端应用开发,游戏引擎开发两者!

我希望通过上述重要的文章提炼,然后组建一个真正意义上的claude code工作流.它可以实现一下功能
1. 通过对话,反对话不断打磨完整的项目细节
2. 通过上述细节输出工程文档,任务文档
3. 通过一个命令调用,永不停止的进行工作,同时生成progres.json等必要的进度文件,防止下次再进入丢失了进度.
这个类似一个agent综合体,有开发,有验证的QA?我不清楚怎么样是最好的,但是一定是参考上述最重要的全部文章进行提炼的精华.
大概是通过不断的编写,review和测试,进行验证,验证通过后再继续下一个任务,保证正确和可用和高效.

4. 通过不同的工程类型引用不同的工作流辅助工具.比如前端开发
我们可以在clawhub.ai上找到非常多优质的skill和mpc引入,帮助开发agent把项目做到最好.比如
UIUX Pro max SKill,Playwright等等,我需要你认真去搜索全网找到对应的合理的skill和mpc辅助.

5. 通过rules规范不同代码的生成方式,比如我希望使用组合代替聚合的ECS模式,防止过渡的封装和继承.比如我希望使用UE5coro,async等技术实现多线程,网络请求等的异步调用,防止回调地狱.比如我希望使用链式编程在UI和一些特定的模块上,保证他们可以全量的获取到关键信息并修改等等等等

现在,请你先阅读最重要的事里面的全部文章,提炼出精华和核心,然后结合我希望做的事,给我一个完整的"万能"工程claude code解决方案,要记住,所有的配置和skill,mpc等源文件,如果能放在当前目录的统一都放在当前目录,我希望他是一个完整的工程模版,任何环境下回来并在终端打开claude code,就能开始工作!
请你一定要认真思考,这个对工具的一个提炼和整合!任何功能的取舍都异常重要!如果很难泛化,你可以以网站前后端开发为我们要做的事出发,去构思这件事.