---
name: ui-setup
description: Web UI 视觉方案选型与更换。选定 CSS 框架 + 图标库，生成 ui-config.json。init-project 自动调用，也可随时手动运行更换方案。
user-invocable: true
---

# UI 视觉方案选型

你现在负责为 Web 项目选定统一的 CSS 框架和图标库，并生成配置文件供开发阶段使用。

**双入口**：
- **自动触发**：init-project Phase 2 检测到 web 项目且无 `ui-config.json` 时自动执行本流程
- **手动调用**：用户随时运行 `/ui-setup` 重新选择方案，覆盖现有 `ui-config.json`

## Step 1：选择 CSS 框架

读取同目录下 `ui-stacks.md` 的「CSS 框架」章节，向用户展示列表：

> 请选择 CSS 框架：
> 1. **Tailwind CSS** — 原子化 CSS，高度定制，当前最流行
> 2. **Bootstrap 5** — 老牌经典，自带大量组件，快速搭建
> 3. **Bulma** — 纯 CSS，基于 Flexbox，代码干净
> 4. **Pico.css** — 无类框架，纯 HTML 自动美化
> 5. **UIkit** — 组件丰富，自带动画特效
> 6. **Open Props** — CSS 变量设计系统，极轻量
> 7. **shadcn/ui** — React/Next.js 生态，Tailwind + Radix UI

等待用户回答后继续。

## Step 2：选择图标库

读取 `ui-stacks.md` 的「图标库」章节，向用户展示列表：

> 请选择图标库：
> 1. **Lucide** — 现代精简，Feather 继承者
> 2. **Phosphor Icons** — 6 种风格粗细，数据面板首选
> 3. **Heroicons** — Tailwind 官方出品
> 4. **Tabler Icons** — 5000+ 图标，尺寸一致
> 5. **Iconoir** — 极简优雅
> 6. **Bootstrap Icons** — 2000+，普适性强
> 7. **Ionicons** — 苹果/安卓原生风
> 8. **Remix Icon** — 中性商业风，实心+描边
> 9. **Boxicons** — Web 专用，分类细致
> 10. **Font Awesome** — 最知名，品牌 Logo 全
> 11. **Iconify** — 终极方案，10 万+ 图标统一 API

等待用户回答后继续。

## Step 3：生成 ui-config.json

根据用户的选择，从 `ui-stacks.md` 中提取对应的 CDN 链接、npm 安装命令和使用方式。

在**项目根目录**生成 `ui-config.json`：

```json
{
  "cssFramework": {
    "name": "用户选择的 CSS 框架名称",
    "cdn": "对应的 CDN 标签（从 ui-stacks.md 获取）",
    "npm": "对应的 npm install 命令"
  },
  "iconLibrary": {
    "name": "用户选择的图标库名称",
    "cdn": "对应的 CDN 标签（从 ui-stacks.md 获取）",
    "npm": "对应的 npm install 命令",
    "usage": "基本使用示例"
  },
  "imageService": {
    "pexels_key": "从 .claude/skills/ui-setup/api-config.json 读取，无则为空",
    "pexels_endpoint": "https://api.pexels.com/v1/search",
    "picsum_pattern": "https://picsum.photos/{width}/{height}"
  }
}
```

**图片策略**（无需用户选择，自动处理）：
- `pexels_key` 有值 → 需要真实配图时运行 `.claude/skills/ui-setup/scripts/fetch_image.py` 获取
- 需要固定尺寸占位图 → 始终用 Lorem Picsum（`https://picsum.photos/{width}/{height}`）
- `pexels_key` 为空 → 所有图片都用 Lorem Picsum

## Step 4：写入 spec.md

如果项目根目录存在 `spec.md`，在「技术栈」章节下方追加或更新「视觉设计方案」章节：

```markdown
## 视觉设计方案
- **CSS 框架**：[用户选择的框架名]
- **图标库**：[用户选择的图标库名]
- **图片方案**：Pexels（真实配图，需 API key）+ Lorem Picsum（固定尺寸占位图）
```

如果是手动调用（更换方案），同步更新 spec.md 和 ui-config.json。

## Step 5：提交

```bash
git add ui-config.json spec.md
git commit -m "feat: setup UI visual stack - [CSS框架名] + [图标库名]"
```
