# nianming_nav

简洁高效的个人导航站，基于 Vue 3 + Vite + Tailwind CSS + Pinia

## 功能特性

- 📁 **分类管理** - 支持按分类组织网站，每个分类显示网站数量统计
- 🔗 **网站导航** - 支持网站链接管理，自动获取网站图标
- ⭐ **网站置顶** - 支持将常用网站置顶显示，优先访问
- 🔍 **多引擎搜索** - 支持站内搜索和外部搜索引擎（Bing、百度、GitHub）快速切换
- ⌨️ **键盘快捷键** - 支持 ⌘/Ctrl + K 快速聚焦搜索框，ESC 关闭移动端侧边栏
- 🌓 **主题切换** - 支持亮色/暗色模式切换，跟随系统偏好并自动记忆
- 📱 **响应式设计** - 完美适配桌面端和移动端，移动端侧边栏为抽屉式
- 🎨 **个性化设置** - 支持自定义网站标题、强调色等个性化配置
- 🔌 **图标智能管理** - 自动获取网站图标，图标加载失败时显示默认占位符
- 📦 **静态配置管理** - 所有数据存储在 JSON 文件中，无需数据库，编辑即生效
- 🎵 **音乐播放器** - 内置迷你音乐播放器，支持在线播放和切歌
- 🕐 **时间日期组件** - 显示当前时间、公历日期和农历日期
- ✨ **流畅动画** - 分类切换动画、网站卡片入场动画、侧边栏展开动画等丰富动效
- 🔄 **侧边栏折叠** - 桌面端支持侧边栏折叠/展开，适配不同屏幕空间需求

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架（Composition API）
- **Vite** - 下一代前端构建工具
- **Tailwind CSS v4** - 原子化 CSS 框架
- **Element Plus** - Vue 3 UI 组件库
- **Pinia** - Vue 状态管理
- **Vue Router** - Vue.js 官方路由（版本 5）
- **Vitest** - 单元测试框架

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 5173，自动打开浏览器）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行测试（Vitest）
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 代码检查并自动修复
npm run lint

# 代码检查（不自动修复）
npm run lint:check

# 代码格式化
npm run format

# 规范化提交（Commitizen）
npm run commit
```

## 部署

### Cloudflare Pages（推荐）

1. Fork 本仓库到你的 GitHub 账号
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
4. 选择你 Fork 的仓库
5. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
6. 点击 **Save and Deploy**

## 项目架构

### 目录结构

```
nianming_nav/
├── src/
│   ├── assets/          # 静态资源（全局样式）
│   ├── components/      # 组件
│   │   ├── layout/      # 布局组件（Sidebar、MainHeader）
│   │   ├── ui/          # UI 组件（SiteCard、EmptyState、ScrollToTop、TimeDateComponent）
│   │   └── MusicPlayer/ # 音乐播放器组件（MiniPlayer）
│   ├── config/          # 配置
│   │   ├── data/        # 静态数据文件（categories、links、search、settings、music）
│   │   ├── schema.ts    # Zod 配置校验 Schema
│   │   ├── sites.ts     # 数据聚合入口（经 Schema 校验）
│   │   └── music.ts     # 音乐播放列表聚合（经 Schema 校验）
│   ├── hooks/           # 自定义钩子（useResponsive）
│   ├── router/          # 路由配置
│   ├── services/        # 外部依赖抽象（faviconService、musicApi）
│   ├── stores/          # Pinia 状态管理（data、ui、theme、settings）
│   ├── composables/     # 组合式逻辑（useMusicPlayer）
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数（constants）
│   ├── views/           # 页面视图（HomeView）
│   ├── App.vue
│   └── main.ts
├── tests/               # 单元测试
├── vite.config.ts       # Vite 配置
└── package.json
```

### 核心模块

1. **静态数据模块** (`src/config/data/`)
   - `categories.json`: 网站分类定义
   - `links.json`: 网站链接数据
   - `search.json`: 搜索引擎配置
   - `settings.json`: 站点设置（标题、主题色等）
   - `music.json`: 音乐播放列表
   - `sites.ts`: 聚合以上数据为统一的 `SITE_CONFIG` 对象

2. **状态管理模块** (`src/stores/`)
    - `data.ts`: 静态导航数据（链接、分类、搜索引擎等）与派生 getter
    - `ui.ts`: 交互态（选中分类、搜索词/模式、侧边栏、分页）
    - `theme.ts`: 管理亮色/暗色主题切换，支持跟随系统偏好
    - `settings.ts`: 将 `settings.json` 应用到运行时（主题色、背景、卡片样式）

3. **服务模块** (`src/services/`)
    - `faviconService.ts`: 网站图标解析，含内存 + localStorage 缓存与降级链
    - `musicApi.ts`: 外部音乐 API 封装（获取直链 / 搜索）

4. **组合式逻辑** (`src/composables/`)
    - `useMusicPlayer.ts`: 音乐播放器状态与逻辑，组件仅做视图

4. **组件模块** (`src/components/`)
   - `layout/`: 布局组件（Sidebar 侧边栏、MainHeader 头部）
   - `ui/`: 通用 UI 组件（SiteCard 网站卡片、EmptyState 空状态、ScrollToTop 回到顶部、TimeDateComponent 时间日期）
   - `MusicPlayer/`: 音乐播放器（MiniPlayer 迷你播放器）

5. **自定义钩子** (`src/hooks/`)
   - `useResponsive.ts`: 响应式布局检测，提供移动端/桌面端/平板等断点判断

## License

MIT
