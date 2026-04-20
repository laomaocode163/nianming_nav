# nianming_nav

简洁高效的个人导航站，基于 Vue 3 + Vite + Tailwind CSS + Pinia

## 功能特性

- 📁 **分类管理** - 支持创建、编辑、删除分类，自定义图标和排序
- 🔗 **网站管理** - 支持添加、编辑、删除网站，自动获取网站图标
- � **网站置顶** - 支持将常用网站置顶显示，优先访问
- � **多引擎搜索** - 支持 Bing、百度、GitHub 等搜索引擎快速切换
- ⌨️ **键盘快捷键** - 支持 ⌘/Ctrl + K 快速聚焦搜索框
- 🌓 **主题切换** - 支持亮色/暗色模式，主题按钮一键切换
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **个性化设置** - 支持自定义站点名称、强调色、背景图片等

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
# 克隆仓库
git clone https://github.com/laomaocode163/nianming_nav.git
cd nianming_nav

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署

### 方式一：Cloudflare Pages（推荐）

1. Fork 本仓库到你的 GitHub 账号
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
4. 选择你 Fork 的仓库
5. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
6. 点击 **Save and Deploy**

#### 绑定 KV（必须）

1. Cloudflare Dashboard → **Workers & Pages** → **KV** → **Create a namespace**
2. 命名：`NAV_DB`
3. 打开 Pages 项目 → **Settings** → **Functions** → **KV namespace bindings**
4. 新增绑定：
   - Variable name: `NAV_KV`
   - KV namespace: 选择刚创建的 KV
5. 保存后 **重新部署**

#### 设置同步密码（可选）

Pages 项目 → **Settings** → **Environment variables** 添加：

- `SYNC_PASSWORD`: 你的同步密码

### 方式二：Cloudflare Workers

支持自定义域名 + 优选 IP，国内访问更快。

#### 前置要求

- GitHub 账号
- Cloudflare 账号（免费）
- 一个托管在 Cloudflare 的域名（可选）

#### 步骤

1. Fork 本仓库
2. 创建 Cloudflare API Token（权限：Edit Cloudflare Workers）
3. 获取 Cloudflare Account ID
4. 在你 Fork 的仓库中配置 GitHub Secrets：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `SYNC_PASSWORD`（可选）
5. 创建 KV 命名空间，更新 `wrangler.toml` 中的 KV ID
6. 推送代码到 main 分支，GitHub Actions 自动部署

## 项目架构

### 核心架构

- **前端框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **样式方案**: Tailwind CSS v4
- **构建工具**: Vite
- **测试框架**: Vitest

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
│   ├── stores/          # Store 测试
│   └── utils/          # 工具函数测试
├── .github/workflows/   # GitHub Actions
├── wrangler.toml        # Workers 配置
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

### 数据流程

1. **数据加载**：应用启动时从 localStorage 加载数据，初始化默认值
2. **数据存储**：数据变更时自动保存到 localStorage
3. **状态管理**：使用 Pinia 管理全局状态
4. **组件渲染**：基于响应式状态渲染 UI 组件

## License

MIT
