# 管理后台设计方案（dev-only）

> 目标：在本地开发期提供一个用于**增删改查**导航数据的管理页面（网址 / 导航分类 / 网址分类），
> 改动直接落盘到 `src/config/data/*.json` 并可随 git 提交；该页面**仅本地开发可见**，生产构建不含此链路。

## 一、总体架构

```
AdminView（仅 import.meta.env.DEV 可见）
   │  fetch  /api/admin/*
   ▼
Vite dev 中间件（configureServer，仅 dev 注册）
   │  fs 读写 src/config/data/{categories,links}.json
   │  + Zod 校验 + 引用完整性校验 + 可选 spawn fetch-favicons 脚本
   ▼
源码 JSON（可提交；生产构建无此链路 → 对外不可见）
```

核心约束：**保留项目"无后端"的运行时架构**。管理后台只在 `vite dev` 期通过 Vite 中间件提供写能力，
`vite build` / `vite preview` 均不注册该中间件，也不打包 `/admin` 路由与组件。

## 二、Dev 后端（`plugins/devAdminApi.ts`，Vite 插件）

仅在 `configureServer` 挂载，**不挂** `configurePreviewServer`。通过相对路径复用
`src/config/schema.ts` 的 Zod schema 与 `src/config/loadConfig.ts` 的
`validateReferentialIntegrity`，保证与运行时校验完全一致、无逻辑漂移。

### 分类 categories
- `GET    /api/admin/categories`
- `POST   /api/admin/categories`
- `PUT    /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- 删除分类时若其下仍有链接（或仍有 subCategories）→ 返回 400 拒绝，提示先迁移。

### 链接 links
- `GET    /api/admin/links`
- `POST   /api/admin/links`
- `PUT    /api/admin/links/:id`
- `DELETE /api/admin/links/:id`
- 写盘后（若请求体带 `fetchFavicon` 或管理页开启自动抓取）→ 触发 favicon 抓取（见第四节）。

### 网址分类 subcategories（独立管理）
数据仍物理存储于 `category.subCategories[]`，但提供独立端点与独立标签页：
- `GET    /api/admin/subcategories` → 扁平化返回 `[{ categoryId, categoryName, ...sub }]`
- `POST   /api/admin/subcategories` → body `{ categoryId, id, name, icon?, order? }`
- `PUT    /api/admin/subcategories/:categoryId/:subId`
- `DELETE /api/admin/subcategories/:categoryId/:subId`
- 删除时若 `links.json` 中存在 `categoryId + subCategoryId` 引用 → 返回 400 拒绝。

### favicon 抓取
- `POST /api/admin/fetch-favicons`（body `{ force?: boolean }`）
  → 通过 `child_process` spawn `node scripts/fetch-favicons.mjs [--force]`，捕获 stdout/stderr 与退出码后返回结果。

### 通用约定
- 写盘统一 `JSON.stringify(data, null, 2)` 保持现有格式。
- 任一写操作读取 → 校验（Zod + `validateReferentialIntegrity`）→ 写回，校验失败返回 400 + 中文错误信息。
- 可选加固：校验 `req.socket.remoteAddress` 为 `127.0.0.1/::1`（dev server 默认即本地）。

## 三、前端

### 路由与入口
- `src/router/index.ts`：在 `if (import.meta.env.DEV) routes.push({ path:'/admin', component: () => import('../views/AdminView.vue') })`。
  构建期 `import.meta.env.DEV` 被替换为 `false`，动态 import 被 tree-shake。
  另加生产兜底：`/admin` 在生产环境重定向到 `/`。
- `src/App.vue`：渲染 `v-if="import.meta.env.DEV"` 的浮动"⚙ 管理"按钮，点击跳 `/admin`。

### 页面与组件
- `src/views/AdminView.vue`：三个标签页 —— **链接 / 分类 / 网址分类**，复用现有 CSS 变量、`useToast`、`EmptyState`。
- `src/components/admin/AdminLinks.vue`：链接表格 + 新增/编辑弹窗（名称 / URL / 分类 / 二级分类 / 置顶 / 隐藏 / 描述）；分类与二级分类下拉由数据派生；提交 POST/PUT 后按开关触发抓取。
- `src/components/admin/AdminCategories.vue`：分类表格 + 表单（id / name / icon / hidden / order）。
- `src/components/admin/AdminSubCategories.vue`：网址分类独立管理——表格列出全部 sub（带父分类名），下拉选父分类后增改，删除带确认；客户端用 `subCategorySchema` 预校验。

### 服务与状态
- `src/services/adminApi.ts`：类型化 fetch 封装（含 subcategories 与 fetch-favicons 端点）。
- `src/stores/admin.ts`（轻量 Pinia）：持有三类列表 + loading，封装 `adminApi`；写盘成功后调用 `dataStore.reload()`。

## 四、自动抓取 favicon（已确认）

- `AdminLinks` 内一个开关「保存后自动抓取 favicon」（默认开）。
- 链接 `POST/PUT/DELETE` 成功后：若开关开 → `POST /api/admin/fetch-favicons` → 中间件 spawn 脚本读取最新 `links.json` 下载新域名 → 更新 `public/favicons/` 与 `faviconManifest.json`。
- 另提供手动「抓取全部 favicon」按钮（`--force` 可选）。
- 抓取后：dev 下 `faviconManifest.json` 变更触发 Vite HMR 重载 `faviconService` 模块，新图标即时生效。

## 五、校验 & 实时刷新（复用优先）

- 表单提交前客户端用 `src/config/schema.ts` 的 Zod 预校验，错误即时高亮。
- `src/config/loadConfig.ts` 新增 `invalidateSiteConfigCache()`（`cached = null`）。
- `src/stores/data.ts` 新增 `reload()`：`ready = false` → `invalidateSiteConfigCache()` → `init()`。
- admin 任一写盘成功后调用，首页即时反映新数据（dev 下 Vite 也会因 JSON 变更 HMR 重载相关模块作为兜底）。

## 六、文件清单

### 新建
- `plugins/devAdminApi.ts`
- `src/services/adminApi.ts`
- `src/stores/admin.ts`
- `src/views/AdminView.vue`
- `src/components/admin/AdminLinks.vue`
- `src/components/admin/AdminCategories.vue`
- `src/components/admin/AdminSubCategories.vue`
- `tests/services/adminApi.test.ts`

### 修改
- `vite.config.ts`（注册 `devAdminApi` 插件）
- `src/router/index.ts`（DEV 路由 + 生产兜底）
- `src/App.vue`（DEV 管理按钮）
- `src/config/loadConfig.ts`（导出 `invalidateSiteConfigCache`）
- `src/stores/data.ts`（新增 `reload`）

## 七、测试

- `adminApi` 单测：`vi.stubGlobal('fetch', ...)` 覆盖三类增删改查成功/失败（沿用 `tests/services/musicApi.test.ts` 写法）。
- `loadConfig` 增 `invalidateSiteConfigCache` 单测（失效后再次 `loadSiteConfig` 返回新数据）。
- 中间件 Node 级集成测试较重，先覆盖前端 + 缓存失效；后续可补 `createServer` 集成测试。

## 八、风险 / 取舍

- dev 中间件 spawn 子进程需开发机能直连目标站点；受限网络下部分失败属可容忍（脚本已有兜底）。
- 二级分类写盘会重写整个 `categories.json`，采用"读取-修改-写回"；dev 单用户，并发覆盖风险低。
- 严格保持"生产零后端、零管理代码"：路由 / 按钮 / 组件均 `import.meta.env.DEV` 守卫并被 tree-shake。
