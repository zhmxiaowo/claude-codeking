# UI 视觉方案知识库

本文件是 CSS 框架、图标库和图片服务的完整参考手册。供 ui-setup 流程选型时展示，也供 /work 开发时查阅具体导入方式和用法。

---

## CSS 框架

### 1. Tailwind CSS
- **定位**：原子化 CSS 框架，高度定制，目前生态最强
- **CDN**：`<script src="https://cdn.tailwindcss.com"></script>`
- **npm**：`npm install tailwindcss @tailwindcss/vite`
- **用法示例**：
```html
<div class="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <h1 class="text-2xl font-bold text-gray-900">Hello</h1>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Click</button>
</div>
```

### 2. Bootstrap 5
- **定位**：老牌经典，自带大量现成组件，极速搭建企业后台
- **CDN**：
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```
- **npm**：`npm install bootstrap`
- **用法示例**：
```html
<div class="container">
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Title</h5>
      <button class="btn btn-primary">Click</button>
    </div>
  </div>
</div>
```

### 3. Bulma
- **定位**：纯 CSS 框架（无 JS），基于 Flexbox，代码极其干净优雅
- **CDN**：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">`
- **npm**：`npm install bulma`
- **用法示例**：
```html
<div class="columns">
  <div class="column">
    <div class="box">
      <h1 class="title">Title</h1>
      <button class="button is-primary">Click</button>
    </div>
  </div>
</div>
```

### 4. Pico.css
- **定位**：Classless 无类框架，纯 HTML 自动美化，内置暗色模式
- **CDN**：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">`
- **npm**：`npm install @picocss/pico`
- **用法示例**：
```html
<!-- 不需要任何 class，纯 HTML 即可 -->
<main class="container">
  <article>
    <h1>Title</h1>
    <p>Content here.</p>
    <button>Click</button>
  </article>
</main>
```

### 5. UIkit
- **定位**：组件极其丰富且带有酷炫动画特效的轻量级框架
- **CDN**：
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.21.13/dist/css/uikit.min.css">
<script src="https://cdn.jsdelivr.net/npm/uikit@3.21.13/dist/js/uikit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/uikit@3.21.13/dist/js/uikit-icons.min.js"></script>
```
- **npm**：`npm install uikit`
- **用法示例**：
```html
<div class="uk-card uk-card-default uk-card-body">
  <h3 class="uk-card-title">Title</h3>
  <button class="uk-button uk-button-primary">Click</button>
</div>
```

### 6. Open Props
- **定位**：基于 CSS 变量的设计系统，极其轻量、现代
- **CDN**：`<link rel="stylesheet" href="https://unpkg.com/open-props">`
- **npm**：`npm install open-props`
- **用法示例**：
```html
<style>
  .card {
    padding: var(--size-fluid-3);
    border-radius: var(--radius-2);
    box-shadow: var(--shadow-2);
    background: var(--surface-1);
  }
</style>
<div class="card">
  <h1>Title</h1>
</div>
```

### 7. shadcn/ui
- **定位**：React/Next.js 生态最火 UI 组件库，**不是独立 CSS 框架**，而是基于 Tailwind CSS + Radix UI 的预制组件集合
- **⚠️ 前置依赖**：必须同时安装 Tailwind CSS（选择 shadcn/ui = Tailwind CSS + shadcn 组件）
- **CSS 层**：`<script src="https://cdn.tailwindcss.com"></script>`（CDN）/ `npm install tailwindcss @tailwindcss/vite`（npm）
- **组件安装**：通过 CLI 按需引入（代码复制到项目中，非 node_modules 依赖）
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog table
```
- **用法示例**：
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Click</Button>
  </CardContent>
</Card>
```
- **生成 ui-config.json 时**：cssFramework.name 填 `"shadcn/ui"`，cdn/npm 填 Tailwind 的值，额外加 `"componentLib": "npx shadcn@latest"`

---

## 图标库

### 1. Lucide
- **定位**：最火的现代化精简图标，Feather Icons 的社区继承者
- **CDN**：`<script src="https://unpkg.com/lucide@latest"></script>`
- **npm**：`npm install lucide-react`（React）/ `npm install lucide-vue-next`（Vue）
- **用法**：
```html
<!-- CDN 方式 -->
<i data-lucide="home"></i>
<i data-lucide="settings"></i>
<script>lucide.createIcons();</script>

<!-- React 方式 -->
import { Home, Settings } from 'lucide-react'
<Home size={24} /> <Settings size={24} />
```

### 2. Phosphor Icons
- **定位**：支持 6 种风格（thin/light/regular/bold/fill/duotone），金融/数据面板首选
- **CDN**：`<script src="https://unpkg.com/@phosphor-icons/web"></script>`
- **npm**：`npm install @phosphor-icons/react`
- **用法**：
```html
<!-- CDN -->
<i class="ph ph-house"></i>
<i class="ph-fill ph-heart"></i>

<!-- React -->
import { House, Heart } from '@phosphor-icons/react'
<House size={24} weight="regular" />
```

### 3. Heroicons
- **定位**：Tailwind 官方团队出品，极度贴合现代 UI
- **CDN**：无官方 CDN，推荐 npm 安装
- **npm**：`npm install @heroicons/react`
- **用法**：
```tsx
import { HomeIcon, CogIcon } from '@heroicons/react/24/outline'  // 描边
import { HomeIcon } from '@heroicons/react/24/solid'  // 实心

<HomeIcon className="h-6 w-6" />
```

### 4. Tabler Icons
- **定位**：5000+ 个图标，尺寸一致性极高，覆盖面广
- **CDN**：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">`
- **npm**：`npm install @tabler/icons-react`
- **用法**：
```html
<!-- CDN -->
<i class="ti ti-home"></i>

<!-- React -->
import { IconHome, IconSettings } from '@tabler/icons-react'
<IconHome size={24} stroke={1.5} />
```

### 5. Iconoir
- **定位**：最大的开源图标库之一，极简且优雅
- **CDN**：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/iconoir-icons/iconoir@main/css/iconoir.css">`
- **npm**：`npm install iconoir-react`
- **用法**：
```html
<!-- CDN -->
<i class="iconoir-home"></i>

<!-- React -->
import { Home } from 'iconoir-react'
<Home width={24} height={24} />
```

### 6. Bootstrap Icons
- **定位**：2000+ 图标，不仅限 Bootstrap 框架，普适性强
- **CDN**：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">`
- **npm**：`npm install bootstrap-icons`
- **用法**：
```html
<i class="bi bi-house"></i>
<i class="bi bi-gear-fill"></i>
```

### 7. Ionicons
- **定位**：苹果/安卓原生风格，移动端 UI 绝佳
- **CDN**：`<script type="module" src="https://unpkg.com/ionicons@7.4.0/dist/ionicons/ionicons.esm.js"></script>`
- **npm**：`npm install ionicons`
- **用法**：
```html
<ion-icon name="home-outline"></ion-icon>
<ion-icon name="heart"></ion-icon>
```

### 8. Remix Icon
- **定位**：中性风格，所有图标都有实心和描边两种，适合商业项目
- **CDN**：`<link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet">`
- **npm**：`npm install remixicon`
- **用法**：
```html
<i class="ri-home-line"></i>      <!-- 描边 -->
<i class="ri-home-fill"></i>      <!-- 实心 -->
```

### 9. Boxicons
- **定位**：专为 Web 开发设计，分类非常细致
- **CDN**：`<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">`
- **npm**：`npm install boxicons`
- **用法**：
```html
<i class="bx bx-home"></i>        <!-- 常规 -->
<i class="bx bxs-home"></i>       <!-- 实心 -->
<i class="bx bxl-github"></i>     <!-- 品牌 Logo -->
```

### 10. Font Awesome
- **定位**：全球最知名的图标库，免费版已非常强大，品牌 Logo 找它准没错
- **CDN**：`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">`
- **npm**：`npm install @fortawesome/fontawesome-free`
- **用法**：
```html
<i class="fa-solid fa-house"></i>
<i class="fa-regular fa-heart"></i>
<i class="fa-brands fa-github"></i>
```

### 11. Iconify
- **定位**：图标聚合平台，**不是单一图标集**，而是通过统一 API 整合 150+ 个图标库、20 万+ 图标，按需加载
- **⚠️ 特殊说明**：选择 Iconify = 获得所有图标库的访问权。可以在同一项目中使用 Material Design、Lucide、Phosphor 等任意图标，但建议项目内统一使用 1-2 个图标集前缀以保持视觉一致性
- **CDN**：`<script src="https://code.iconify.design/3/3.1.1/iconify.min.js"></script>`
- **npm**：`npm install @iconify/react`
- **常用图标集前缀**：
  - `mdi` — Material Design Icons（7000+，最全面）
  - `lucide` — Lucide Icons（现代精简）
  - `ph` — Phosphor Icons（6 种粗细）
  - `heroicons` — Heroicons（Tailwind 风格）
  - `tabler` — Tabler Icons（5000+）
  - `ri` — Remix Icon（实心+描边）
  - `fa6-solid` / `fa6-regular` — Font Awesome 6
- **用法**：
```html
<!-- CDN（data-icon 格式：{图标集前缀}:{图标名}） -->
<span class="iconify" data-icon="mdi:home"></span>
<span class="iconify" data-icon="lucide:settings"></span>
<span class="iconify" data-icon="ph:heart-bold"></span>

<!-- React -->
import { Icon } from '@iconify/react'
<Icon icon="mdi:home" width={24} />
<Icon icon="lucide:check" width={24} />
```
- **生成 ui-config.json 时**：iconLibrary.name 填 `"Iconify"`，额外加 `"availableSets": ["mdi", "lucide"]`（列出项目推荐使用的图标集前缀）

---

## 图片服务

### Lorem Picsum（固定尺寸占位图）
- **定位**：图片界的 Lorem Ipsum，URL 直接指定尺寸即可获取高清摄影图
- **无需 API Key**，直接使用

**URL 模式**：
```
基础用法：     https://picsum.photos/{width}/{height}
指定图片：     https://picsum.photos/id/{image_id}/{width}/{height}
高斯模糊：     https://picsum.photos/{width}/{height}?blur=2
灰度图：       https://picsum.photos/{width}/{height}?grayscale
固定随机种子：  https://picsum.photos/seed/{seed}/{width}/{height}
```

**常用尺寸示例**：
```html
<!-- Hero 区域大图 -->
<img src="https://picsum.photos/1200/600" alt="hero" width="1200" height="600">

<!-- 卡片配图 -->
<img src="https://picsum.photos/400/300" alt="card" width="400" height="300">

<!-- 用户头像 -->
<img src="https://picsum.photos/80/80" alt="avatar" width="80" height="80" style="border-radius: 50%;">

<!-- 缩略图列表 -->
<img src="https://picsum.photos/200/200" alt="thumb" width="200" height="200">
```

### Pexels API（真实高清配图）
- **定位**：全球顶级免费商用图库，通过 API 按关键词搜索真实照片
- **需要 API Key**：前往 https://www.pexels.com/api/ 免费申请

**API 调用方式**：
```python
import requests

headers = {"Authorization": "YOUR_PEXELS_API_KEY"}
params = {"query": "technology", "per_page": 5, "size": "medium"}
response = requests.get("https://api.pexels.com/v1/search", headers=headers, params=params)
photos = response.json()["photos"]

# 每张图片的可用尺寸
for photo in photos:
    print(photo["src"]["original"])   # 原图
    print(photo["src"]["large2x"])    # 1880px
    print(photo["src"]["large"])      # 940px
    print(photo["src"]["medium"])     # 350px
    print(photo["src"]["small"])      # 130px
```

**使用 fetch_image.py 脚本**：
```bash
python .claude/skills/ui-setup/scripts/fetch_image.py --query "office" --count 3 --width 800 --height 400
```
