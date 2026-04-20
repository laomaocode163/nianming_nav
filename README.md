# nianming_nav

简洁高效的个人导航站，基于 Vue 3 + Vite + Tailwind CSS + Pinia

## 功能特性

- 📁 **分类管理** - 支持按分类组织网站，每个分类显示网站数量统计
- 🔗 **网站管理** - 支持添加、编辑、删除网站，自动获取网站图标
- ⭐ **网站置顶** - 支持将常用网站置顶显示，优先访问
- 🔍 **多引擎搜索** - 支持 Bing、百度、GitHub 等多个搜索引擎快速切换，搜索引擎图标自动加载
- ⌨️ **键盘快捷键** - 支持 ⌘/Ctrl + K 快速聚焦搜索框，ESC 关闭移动端侧边栏
- 🌓 **主题切换** - 支持亮色/暗色模式切换，自动记忆用户偏好
- 📱 **响应式设计** - 完美适配桌面端和移动端，移动端侧边栏为抽屉式
- 🎨 **个性化设置** - 支持自定义网站标题、强调色等个性化配置
- 🔌 **图标智能管理** - 自动获取网站图标，图标加载失败时显示默认占位符
- 💾 **本地数据持久化** - 所有数据自动保存到 localStorage
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

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行测试
npm run test

# 代码检查
npm run lint
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
│   ├── assets/          # 静态资源
│   ├── components/      # 组件
│   │   ├── layout/      # 布局组件（Sidebar、MainHeader）
│   │   └── ui/          # UI 组件（SiteCard、Dialog、Notification 等）
│   ├── hooks/           # 自定义钩子（useNotification、useResponsive）
│   ├── router/          # 路由配置
│   ├── stores/          # Pinia 状态管理（data、theme）
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数（faviconService、constants）
│   ├── views/           # 页面视图（HomeView）
│   ├── App.vue
│   └── main.ts
├── tests/               # 单元测试
├── vite.config.ts       # Vite 配置
└── package.json
```

### 核心模块

1. **数据管理模块** (`src/stores/`)
   - `data.ts`: 管理链接、分类、搜索引擎配置、站点设置等核心数据，支持 localStorage 持久化
   - `theme.ts`: 管理主题相关配置（亮色/暗色模式切换）

2. **工具函数模块** (`src/utils/`)
   - `faviconService.ts`: 处理网站图标加载、域名提取和缓存管理
   - `constants.ts`: 定义常量、默认值和初始数据

3. **组件模块** (`src/components/`)
   - `layout/`: 布局组件（Sidebar 侧边栏、MainHeader 头部）
   - `ui/`: 通用 UI 组件（SiteCard 网站卡片、Dialog 对话框、Notification 通知、EmptyState 空状态、Skeleton 骨架屏、ScrollToTop 滚动到顶、KeyboardHint 键盘提示）

4. **页面模块** (`src/views/`)
   - `HomeView.vue`: 主页面，整合搜索、分类筛选和网站展示

5. **自定义钩子** (`src/hooks/`)
   - `useNotification.ts`: 通知相关功能
   - `useResponsive.ts`: 响应式布局检测（移动端/桌面端）

## License

MIT
