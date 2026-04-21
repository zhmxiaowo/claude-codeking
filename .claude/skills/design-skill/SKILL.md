---
name: design-skill
description: 为项目选择和应用品牌级 DESIGN.md 设计系统。68 套离线设计模板，含 Light/Dark 预览，用户输入编号或名称即可应用。
user-invocable: true
---

# DESIGN.md 设计系统选择器

DESIGN.md 是纯文本设计系统文档，AI Agent 读取后即可生成风格一致的 UI。本 skill 提供 68 套完整离线模板。

## 资源结构

```
.claude/skills/design-skill/
├── SKILL.md
├── preview.html            # 总预览页（浏览器打开，可视化浏览 68 套样式）
├── design-md/              # 68 套 DESIGN.md 模板 + manifest.json
│   ├── manifest.json
│   ├── stripe.md
│   └── ...
└── previews/               # 136 个预览 HTML（light + dark）
    └── {brand}/
        ├── preview.html
        └── preview-dark.html
```

## 执行流程

### Step 1：打开预览页

用浏览器打开 `.claude/skills/design-skill/preview.html`，让用户可视化浏览全部 68 套设计系统。

页面功能：搜索过滤 / Light-Dark 切换 / 点击卡片查看完整预览 / 左右箭头翻页。

> 请在浏览器中打开预览页查看全部设计系统：
> `.claude/skills/design-skill/preview.html`
>
> 选好后告诉我 **编号**（如 53）或 **名称**（如 stripe）即可。

### Step 2：确认并安装

用户提供编号或名称后：

1. 读取 `design-md/{brand}.md` 第一章节（Visual Theme），展示颜色/字体摘要
2. 询问确认
3. 确认后复制到项目根目录：

```bash
cp .claude/skills/design-skill/design-md/{brand}.md ./DESIGN.md
```

如果根目录已有 DESIGN.md，询问是否覆盖。

### Step 3：完成

> DESIGN.md（{brand} 风格）已安装。
> 后续构建 UI 时，Agent 会自动读取 DESIGN.md 中的颜色、字体、组件规范。
> 文件是纯文本，可随时修改以适配你的品牌。

## 品牌索引（68 套）

| # | Brand | 风格描述 |
|---|-------|----------|
| 1 | airbnb | 旅行市场平台。暖珊瑚色强调，摄影驱动，圆角 UI |
| 2 | airtable | 电子表格数据库混合体。彩色友好，结构化数据美学 |
| 3 | apple | 消费电子。顶级留白，SF Pro 字体，电影感影像 |
| 4 | binance | 加密货币交易所。大胆黄色+单色，交易厅紧迫感 |
| 5 | bmw | 豪华汽车。暗色高端表面，精确德国工程美学 |
| 6 | bugatti | 超跑品牌。电影院黑底，单色肃穆，纪念碑式展示字体 |
| 7 | cal | 开源日程调度。干净中性 UI，开发者导向简洁 |
| 8 | claude | Anthropic AI 助手。暖赭石色强调，干净编辑式布局 |
| 9 | clay | 创意机构。有机形状，柔和渐变，艺术指导布局 |
| 10 | clickhouse | 高速分析数据库。黄色强调，技术文档风格 |
| 11 | cohere | 企业 AI 平台。鲜明渐变，数据丰富的仪表盘美学 |
| 12 | coinbase | 加密货币交易所。干净蓝色身份，信任聚焦，机构感 |
| 13 | composio | 工具集成平台。现代暗色，彩色集成图标 |
| 14 | cursor | AI 代码编辑器。流畅暗色界面，渐变强调色 |
| 15 | elevenlabs | AI 语音平台。暗色电影感 UI，声波美学 |
| 16 | expo | React Native 平台。暗色主题，紧凑字距，代码中心 |
| 17 | ferrari | 豪华汽车。明暗对照编辑风格，法拉利红强调，电影黑 |
| 18 | figma | 协作设计工具。鲜明多色，活泼且专业 |
| 19 | framer | 网站构建器。大胆黑蓝，动效优先，设计前沿 |
| 20 | hashicorp | 基础设施自动化。企业级简洁，黑白配色 |
| 21 | ibm | 企业科技。Carbon 设计系统，结构化蓝色调 |
| 22 | intercom | 客户消息平台。友好蓝色调，对话式 UI 模式 |
| 23 | kraken | 加密货币交易。紫色暗色 UI，数据密集仪表盘 |
| 24 | lamborghini | 超跑品牌。纯黑表面，金色强调，戏剧性大写排版 |
| 25 | linear.app | 项目管理。超级极简，精确，紫色强调 |
| 26 | lovable | AI 全栈构建器。活泼渐变，友好开发者美学 |
| 27 | mastercard | 全球支付网络。温暖奶油画布，轨道药丸形状，编辑式温暖 |
| 28 | meta | 科技零售店。摄影优先，二元明暗表面，Meta Blue CTA |
| 29 | minimax | AI 模型提供商。大胆暗色界面，霓虹强调 |
| 30 | mintlify | 文档平台。干净，绿色强调，阅读优化 |
| 31 | miro | 视觉协作。明亮黄色强调，无限画布美学 |
| 32 | mistral.ai | 开源大模型提供商。法式工程极简，紫色调 |
| 33 | mongodb | 文档数据库。绿叶品牌，开发者文档聚焦 |
| 34 | nike | 运动零售。单色 UI，巨型大写字体，全出血摄影 |
| 35 | notion | 全能工作空间。温暖极简，衬线标题，柔和表面 |
| 36 | nvidia | GPU 计算。绿黑能量，技术力量美学 |
| 37 | ollama | 本地运行大模型。终端优先，单色简约 |
| 38 | opencode.ai | AI 编程平台。开发者中心暗色主题 |
| 39 | pinterest | 视觉发现。红色强调，瀑布流网格，图片优先 |
| 40 | playstation | 游戏主机零售。三表面通道布局，安静权威展示字体，青色悬停 |
| 41 | posthog | 产品分析。趣味刺猬品牌，开发者友好暗色 UI |
| 42 | raycast | 效率启动器。暗色铬合金风，鲜明渐变强调 |
| 43 | renault | 法国汽车。鲜明极光渐变，NouvelR 字体，大胆能量 |
| 44 | replicate | 通过 API 运行 ML 模型。干净白底画布，代码优先 |
| 45 | resend | 邮件 API。极简暗色主题，等宽字体强调 |
| 46 | revolut | 数字银行。流畅暗色界面，渐变卡片，金融科技精确 |
| 47 | runwayml | AI 视频生成。电影感暗色 UI，富媒体布局 |
| 48 | sanity | 无头 CMS。红色强调，内容优先编辑式布局 |
| 49 | sentry | 错误监控。暗色仪表盘，数据密集，粉紫强调 |
| 50 | shopify | 电商平台。暗色优先电影感，霓虹绿强调，超轻字重 |
| 51 | spacex | 太空科技。纯黑白，全出血影像，未来感 |
| 52 | spotify | 音乐流媒体。鲜明绿色暗底，大胆排版，专辑封面驱动 |
| 53 | stripe | 支付基础设施。标志性紫色渐变，300 字重优雅 |
| 54 | supabase | 开源 Firebase 替代。暗翡翠主题，代码优先 |
| 55 | superhuman | 高速邮件客户端。高端暗色 UI，键盘优先，紫色光晕 |
| 56 | tesla | 电动汽车。极致减法，全视口摄影，近零 UI |
| 57 | theverge | 科技媒体。酸薄荷+紫外线强调，Manuka 展示字体，锐舞传单风格 |
| 58 | together.ai | 开源 AI 基础设施。技术蓝图风格设计 |
| 59 | uber | 出行平台。大胆黑白，紧凑字体，都市能量 |
| 60 | vercel | 前端部署。黑白精确，Geist 字体 |
| 61 | vodafone | 全球电信品牌。纪念碑式大写展示，沃达丰红章节带 |
| 62 | voltagent | AI Agent 框架。虚空黑底画布，翡翠绿强调，终端原生 |
| 63 | warp | 现代终端。暗色 IDE 风界面，块状命令 UI |
| 64 | webflow | 可视化网站构建器。蓝色强调，精致营销站美学 |
| 65 | wired | 科技杂志。纸白报刊密度，自定义衬线展示字体，等宽引导，墨蓝链接 |
| 66 | wise | 跨境汇款。明亮绿色强调，友好清晰 |
| 67 | x.ai | Elon Musk AI 实验室。纯粹单色，未来极简 |
| 68 | zapier | 自动化平台。温暖橙色，友好插画驱动 |

## DESIGN.md 内含章节

每套模板包含 9 个标准章节：
1. Visual Theme & Atmosphere — 氛围与设计哲学
2. Color Palette & Roles — 语义化颜色 + hex + 功能角色
3. Typography Rules — 字体家族与层级表
4. Component Stylings — 按钮/卡片/输入框/导航（含状态）
5. Layout Principles — 间距/网格/留白
6. Depth & Elevation — 阴影系统与表面层级
7. Do's and Don'ts — 设计护栏
8. Responsive Behavior — 断点与折叠策略
9. Agent Prompt Guide — 快速颜色参考与即用 prompt
