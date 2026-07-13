# 架构优化实施记录

> 低风险整理与边界修复，重构内部结构、补充健壮性（业务行为不变）。

## 实施清单

### 1. 配置加载加 Zod 运行时校验
- 新增 `src/config/schema.ts`：用 Zod 定义 `category / subCategory / link / searchSource / searchConfig / siteSettings` 的 Schema。
- `src/config/loadConfig.ts` 改为用 `*.parse(...)` 校验后聚合为 `SITE_CONFIG`，不再用 `as` 强转。
- 新增依赖：`zod`。

### 2. 收紧类型（types/index.ts）
- 新增 `SearchMode = 'internal' | 'external'` 联合类型。
- `SiteSettings` 去掉宽松的索引签名，改为显式可选字段，提升类型安全。

### 3. 拆分 Data Store（职责分离）
- 拆分为 `stores/data.ts`（静态数据 + 派生 getter）与 `stores/ui.ts`（交互态）。

### 4. Favicon 服务：缓存 + 降级链
- `src/services/faviconService.ts`：内存 `Map` + `localStorage` 二级缓存。
- 降级链：本地同源文件 → 站点 `/favicon.ico` → favicon.im → icon.horse → faviconextractor → DuckDuckGo → Google S2。
- `SiteCard.vue`：加载成功写入缓存，失败走 fallback 链。

### 5. HomeView 去除 DOM 直接操作
- `document.querySelector` 改为模板 ref `sitesSectionRef`。

### 6. 文档对齐
- 删除过时的 `CLAUDE.md`。
- `AGENTS.md` 与 `README.md` 更新至当前架构。

## 验证结果
- `npm run lint:check`：0 error / 0 warning。
- `npx vitest run`：全部通过。
- `npm run build`：成功。

## 目录结构
```
src/
├── config/{ data/*.json, schema.ts, loadConfig.ts }
├── services/{ faviconService.ts, adminApi.ts }
├── stores/{ data.ts, ui.ts, theme.ts, settings.ts, admin.ts }
├── composables/{ useToast.ts }
├── hooks/{ useResponsive.ts }
└── components/... (layout/, ui/, admin/)
```

### 7. settings 配置闭环（stores/settings.ts）
- `src/stores/settings.ts`：`apply()` 将 `settings.json` 的 `accentColor`（RGB）转为 HSL 写入 CSS 变量 `--hue-primary` / `--sat-primary` / `--lig-primary`。
- `App.vue` `onMounted` 调用 `apply()` 应用初始配置，`watch` 保持 admin 修改后自动生效。

### 8. Dev-only Admin UI
- `plugins/devAdminApi.ts`：Vite dev 中间件，CRUD categories/links/subcategories + 触发 favicon 抓取。
- `src/views/AdminView.vue` + 管理组件：仅 `import.meta.env.DEV` 可见，生产 tree-shake。

