# 念铭导航 Code Wiki

## 1. 项目概述

念铭导航是一个简洁高效的个人网站导航管理工具，使用Vue 3 + Element Plus + Pinia技术栈构建。该项目旨在为用户提供一个个性化的网站导航平台，支持分类管理、搜索功能、主题切换等特性。

### 核心功能
- 网站分类管理
- 自定义网站链接
- 多搜索引擎支持
- 响应式设计（适配桌面、平板和移动端）
- 明暗主题切换
- 网站图标自动获取

## 2. 技术栈

| 技术/框架 | 版本 | 用途 |
|---------|------|------|
| Vue 3 | ^3.5.31 | 前端框架 |
| Pinia | ^3.0.4 | 状态管理 |
| Vue Router | ^5.0.4 | 路由管理 |
| Element Plus | ^2.13.6 | UI组件库 |
| Tailwind CSS | ^4.2.2 | 实用工具CSS框架 |
| Vite | ^8.0.2 | 构建工具 |
| Vue Draggable Plus | ^0.6.1 | 拖拽功能 |

## 3. 项目结构

```
src/
├── assets/            # 静态资源
│   └── main.css       # 主样式文件
├── components/        # 组件
│   ├── layout/        # 布局组件
│   │   ├── MainHeader.vue  # 主头部组件
│   │   └── Sidebar.vue     # 侧边栏组件
│   └── ui/            # UI组件
│       ├── Dialog.vue      # 对话框组件
│       ├── Notification.vue # 通知组件
│       └── SiteCard.vue    # 网站卡片组件
├── hooks/             # 组合式函数
│   ├── useNotification.js  # 通知功能
│   └── useResponsive.js    # 响应式布局
├── router/            # 路由配置
│   └── index.js       # 路由定义
├── stores/            # Pinia状态管理
│   ├── data.js        # 数据管理
│   └── theme.js       # 主题管理
├── utils/             # 工具函数
│   ├── constants.js   # 常量定义
│   └── faviconService.js # 图标服务
├── views/             # 页面视图
│   └── HomeView.vue   # 主页面
├── App.vue            # 应用入口组件
└── main.js            # 应用初始化
```

## 4. 核心模块

### 4.1 数据管理（Data Store）

数据管理模块负责处理网站链接、分类、设置等数据的存储和管理。

**主要功能：**
- 数据加载与保存（使用localStorage）
- 网站链接管理（添加、编辑、删除、置顶）
- 分类管理
- 搜索配置管理
- 图标管理

**关键函数：**

| 函数名 | 说明 | 参数 | 返回值 |
|-------|------|------|-------|
| `loadData()` | 从localStorage加载数据 | 无 | 无 |
| `saveData()` | 保存数据到localStorage | 无 | 无 |
| `togglePin(id)` | 切换网站置顶状态 | id: 网站ID | 无 |
| `getLinkIcon(link)` | 获取网站图标 | link: 网站对象 | 图标URL |
| `syncLinkIcon(link)` | 同步网站图标 | link: 网站对象 | 无 |
| `fetchIconForDomain(domain)` | 获取域名图标 | domain: 域名 | 图标URL |

**数据结构：**
- `links`: 网站链接数组
- `categories`: 分类数组
- `settings`: 网站设置
- `searchConfig`: 搜索配置
- `iconMap`: 域名到图标URL的映射

### 4.2 主题管理（Theme Store）

主题管理模块负责处理网站的明暗主题切换功能。

**主要功能：**
- 初始化主题（从localStorage或系统偏好加载）
- 切换主题
- 应用主题

**关键函数：**

| 函数名 | 说明 | 参数 | 返回值 |
|-------|------|------|-------|
| `initTheme()` | 初始化主题 | 无 | 无 |
| `toggleTheme()` | 切换主题 | 无 | 无 |
| `applyTheme()` | 应用主题 | 无 | 无 |

### 4.3 路由管理

路由管理模块定义了应用的路由结构，目前只有一个主页面路由。

**路由配置：**
- `/`: 主页面（HomeView）

### 4.4 组件结构

**布局组件：**
- `MainHeader.vue`: 页面头部，包含标题和主题切换按钮
- `Sidebar.vue`: 侧边栏，包含分类导航

**UI组件：**
- `SiteCard.vue`: 网站卡片，显示网站信息和图标
- `Dialog.vue`: 对话框组件
- `Notification.vue`: 通知组件

**页面组件：**
- `HomeView.vue`: 主页面，包含搜索功能、网站列表等

## 5. 关键功能

### 5.1 网站导航

网站导航是核心功能，用户可以通过分类浏览和访问网站链接。

**实现方式：**
- 使用`getLinksByCategory`计算属性根据分类筛选网站
- 使用`SiteCard`组件展示网站信息
- 支持网站置顶功能

### 5.2 搜索功能

搜索功能支持多种搜索引擎，用户可以选择不同的搜索引擎进行搜索。

**实现方式：**
- 集成多个搜索引擎（Google、Bing、百度、GitHub）
- 使用下拉菜单切换搜索引擎
- 支持快捷键（Ctrl+K）聚焦搜索框

### 5.3 主题切换

主题切换功能允许用户在明暗主题之间切换，并记住用户偏好。

**实现方式：**
- 使用Pinia存储主题状态
- 应用主题到DOM
- 保存主题偏好到localStorage

### 5.4 响应式设计

响应式设计确保网站在不同设备上都能良好显示。

**实现方式：**
- 使用媒体查询适配不同屏幕尺寸
- 在移动端使用抽屉式侧边栏
- 调整布局和组件大小以适应不同设备

## 6. 工具函数

### 6.1 常量定义（constants.js）

定义了项目中使用的常量和默认数据。

**主要常量：**
- `DEFAULT_CATEGORIES`: 默认分类
- `INITIAL_LINKS`: 初始网站链接
- `DEFAULT_SEARCH_SOURCES`: 默认搜索引擎
- `DEFAULT_SITE_SETTINGS`: 默认网站设置
- `DEFAULT_SEARCH_CONFIG`: 默认搜索配置

### 6.2 图标服务（faviconService.js）

图标服务负责处理网站图标的获取和缓存。

**主要功能：**
- 从URL提取域名
- 生成favicon抓取URL
- 缓存图标到localStorage
- 批量预加载图标

**关键函数：**

| 函数名 | 说明 | 参数 | 返回值 |
|-------|------|------|-------|
| `extractDomain(url)` | 从URL提取域名 | url: 网站URL | 域名 |
| `getFaviconUrl(domain)` | 生成favicon URL | domain: 域名 | favicon URL |
| `getCachedIcon(domain)` | 获取缓存的图标 | domain: 域名 | 图标URL或null |
| `setCachedIcon(domain, iconUrl)` | 缓存图标 | domain: 域名, iconUrl: 图标URL | 无 |
| `fetchIcon(url)` | 抓取网站图标 | url: 网站URL | 图标URL |

## 7. 数据结构

### 7.1 网站链接（LinkItem）

```javascript
{
  id: '',           // 唯一标识符
  title: '',        // 网站标题
  url: '',          // 网站URL
  icon: '',         // 网站图标
  description: '',  // 网站描述
  categoryId: '',   // 分类ID
  createdAt: 0,     // 创建时间
  hidden: false,    // 是否隐藏
  pinned: false,    // 是否置顶
  pinnedOrder: 0,   // 置顶顺序
  order: 0          // 排序顺序
}
```

### 7.2 分类（Category）

```javascript
{
  id: '',           // 唯一标识符
  name: '',         // 分类名称
  icon: '',         // 分类图标
  hidden: false     // 是否隐藏
}
```

### 7.3 网站设置（SiteSettings）

```javascript
{
  title: 'nianming_nav',      // 网站标题
  navTitle: '我的导航',        // 导航栏标题
  favicon: '',                // 网站图标
  cardStyle: 'detailed',      // 卡片样式
  siteMode: 'personal',       // 网站模式
  accentColor: '14 165 233',  // 强调色
  grayScale: 'slate',         // 灰度
  closeOnBackdrop: true,      // 点击背景关闭
  backgroundImage: '',        // 背景图片
  backgroundImageEnabled: false, // 背景图片启用状态
  backgroundMotion: false     // 背景动效
}
```

### 7.4 搜索配置（SearchConfig）

```javascript
{
  mode: 'internal',       // 搜索模式
  externalSources: [],    // 外部搜索引擎
  selectedSourceId: ''    // 选中的搜索引擎ID
}
```

## 8. 项目运行与构建

### 8.1 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 8.2 构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 8.3 代码检查

```bash
# 运行ESLint
npm run lint
```

## 9. 部署

项目配置了GitHub Actions工作流，用于部署到Cloudflare Workers。部署配置位于`.github/workflows/deploy-workers.yml`。

## 10. 总结

念铭导航是一个功能完整、界面美观的个人导航网站，具有以下特点：

- **简洁现代的界面**：参考呼哈导航设计风格，采用简洁现代的UI设计
- **强大的功能**：支持网站分类管理、多搜索引擎、主题切换等功能
- **响应式设计**：适配桌面、平板和移动端
- **性能优化**：使用Vue 3的组合式API和Pinia状态管理，确保应用性能
- **用户友好**：支持快捷键、自动图标获取等用户友好功能

该项目使用了现代前端技术栈，代码结构清晰，易于维护和扩展。通过localStorage存储数据，确保用户数据的持久化，同时支持离线使用。

## 11. 未来扩展方向

- 支持数据同步到云端
- 添加更多自定义主题
- 增加网站标签功能
- 支持导入/导出数据
- 添加更多搜索选项和过滤功能
- 实现用户账户系统

## 12. 技术要点

1. **Vue 3 组合式API**：使用`setup`语法和组合式函数，提高代码复用性和可维护性
2. **Pinia 状态管理**：使用Pinia进行状态管理，替代传统的Vuex
3. **响应式设计**：使用媒体查询和灵活的布局，确保在不同设备上的良好体验
4. **LocalStorage 数据存储**：使用localStorage存储用户数据，实现数据持久化
5. **图标服务**：自动获取和缓存网站图标，提升用户体验
6. **搜索引擎集成**：支持多个搜索引擎，提供灵活的搜索选项
7. **主题系统**：实现明暗主题切换，适应不同使用场景

## 13. 依赖关系

| 模块 | 依赖模块 | 说明 |
|-----|---------|------|
| HomeView | Sidebar, MainHeader, SiteCard | 主页面组件 |
| Sidebar | dataStore | 分类数据管理 |
| MainHeader | themeStore | 主题切换功能 |
| SiteCard | faviconService | 图标获取功能 |
| dataStore | faviconService | 图标管理 |
| App | router, dataStore, themeStore | 应用初始化 |

## 14. 关键文件路径

| 文件 | 路径 | 说明 |
|-----|------|------|
| 主入口文件 | [main.js](file:///Users/tangwei/project/trae/nianming_nav/src/main.js) | 应用初始化 |
| 主页面 | [HomeView.vue](file:///Users/tangwei/project/trae/nianming_nav/src/views/HomeView.vue) | 主页面组件 |
| 数据管理 | [data.js](file:///Users/tangwei/project/trae/nianming_nav/src/stores/data.js) | 数据状态管理 |
| 主题管理 | [theme.js](file:///Users/tangwei/project/trae/nianming_nav/src/stores/theme.js) | 主题状态管理 |
| 图标服务 | [faviconService.js](file:///Users/tangwei/project/trae/nianming_nav/src/utils/faviconService.js) | 图标处理功能 |
| 常量定义 | [constants.js](file:///Users/tangwei/project/trae/nianming_nav/src/utils/constants.js) | 常量和默认数据 |
| 路由配置 | [router/index.js](file:///Users/tangwei/project/trae/nianming_nav/src/router/index.js) | 路由定义 |
