# nianming_nav

简洁高效的个人导航站，基于 Vue 3 + Vite + Tailwind CSS + Pinia

## 功能特性

- 📁 **分类管理** - 支持创建、编辑、删除分类，自定义图标
- 🔗 **网站管理** - 支持添加、编辑、删除网站，自动获取图标
- 🔍 **多引擎搜索** - 支持 Google、Bing、百度、GitHub 等搜索引擎
- 🌓 **主题切换** - 支持亮色/暗色模式，自动检测系统偏好
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ☁️ **云端同步** - 支持 Cloudflare KV 数据同步
- 📤 **数据导入导出** - 支持 JSON 格式数据备份恢复

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Tailwind CSS v4** - 原子化 CSS 框架
- **Pinia** - Vue 状态管理
- **Vue Router** - Vue.js 官方路由

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
ianming_nav/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 组件
│   │   ├── admin/       # 管理后台组件
│   │   ├── layout/      # 布局组件
│   │   └── ui/          # UI 组件
│   ├── hooks/           # 自定义钩子
│   ├── stores/          # Pinia 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── views/           # 页面视图
│   ├── utils/           # 工具函数
│   ├── App.vue
│   └── main.ts
├── functions/           # Cloudflare Pages Functions
│   └── api/
│       └── sync.js      # 同步 API
├── tests/               # 单元测试
│   ├── stores/          # Store 测试
│   └── utils/           # 工具函数测试
├── .github/workflows/   # GitHub Actions
├── wrangler.toml        # Workers 配置
├── vite.config.ts       # Vite 配置
└── package.json
```

### 核心模块

1. **数据管理模块** (`src/stores/`)
   - `data.ts`: 管理链接、分类、搜索配置等核心数据
   - `theme.ts`: 管理主题相关配置

2. **工具函数模块** (`src/utils/`)
   - `faviconService.ts`: 处理网站图标加载和缓存
   - `constants.ts`: 定义常量和默认值

3. **组件模块** (`src/components/`)
   - `layout/`: 布局组件，如侧边栏、头部
   - `ui/`: 通用 UI 组件，如网站卡片
   - `admin/`: 管理后台组件

4. **页面模块** (`src/views/`)
   - `HomeView.vue`: 主页面

5. **自定义钩子** (`src/hooks/`)
   - `useNotification.ts`: 通知相关功能
   - `useResponsive.ts`: 响应式布局相关功能

### 数据流程图

1. **数据加载**：应用启动时从 localStorage 加载数据
2. **数据存储**：数据变更时自动保存到 localStorage
3. **数据同步**：可选的 Cloudflare KV 数据同步
4. **状态管理**：使用 Pinia 管理全局状态
5. **组件渲染**：基于状态渲染 UI 组件

## License

MIT
