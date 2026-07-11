# 架构优化实施记录（阶段一 + 阶段二）

> 阶段一：低风险整理与边界修复，重构内部结构、补充健壮性（业务行为不变）。
> 阶段二：功能性修复——打通 settings 配置闭环、重构 MiniPlayer。

## 实施清单

### 1. 配置加载加 Zod 运行时校验
- 新增 `src/config/schema.ts`：用 Zod 定义 `category / subCategory / link / searchSource / searchConfig / siteSettings` 的 Schema，以及 `categoriesSchema = z.array(categorySchema)`、`linksSchema = z.array(linkSchema)`。
- `src/config/sites.ts` 改为用 `*.parse(...)` 校验后聚合为 `SITE_CONFIG`，不再用 `as` 强转。
- 新增依赖：`zod`。
- **校验即时收益**：首次运行即发现 `categories.json` / `links.json` 顶层是数组（原 `as` 强转会静默接受错误结构），已据实修正 Schema。

### 2. 收紧类型（types/index.ts）
- 新增 `SearchMode = 'internal' | 'external'` 联合类型；运行时 `searchMode` 改为该联合类型（原 `string`）。
- `SiteSettings` 去掉宽松的索引签名 `[key: string]: string | boolean | undefined`，改为显式可选字段，提升类型安全。

### 3. 拆分 Data Store（职责分离）
- 原 `stores/data.ts` 同时持有「静态数据」与「交互态」，现拆分为：
  - `stores/data.ts`（`useDataStore`）：仅静态数据（links / categories / settings / searchConfig）+ 派生 getter（`getLinksByCategory`、`getSubCategories`、`visibleCategories`、`getLinkIcon`、`updateSearchConfig`）。站内搜索过滤改为读取 `useUiStore` 的 `searchMode` / `searchQuery`。
  - `stores/ui.ts`（`useUiStore`）：集中交互态——选中分类、搜索词/模式、侧边栏开合与折叠、分页。`HomeView` 与 `MainHeader` 改为消费 `useUiStore`。

### 4. Favicon 服务：缓存 + 降级链
- `src/utils/faviconService.ts` 移至 `src/services/faviconService.ts`，并增强：
  - `getCachedFavicon` / `cacheFavicon`：内存 `Map` + `localStorage`（key `favicon-cache`）二级缓存，跳过已知坏链。
  - `getFaviconFallbacks(domain)`：主源（faviconextractor）→ Google S2 → DuckDuckGo 降级链。
  - `SiteCard.vue`：加载成功时写入缓存；图标 `onerror` 时按顺序切换降级源，全部失败才回退默认占位图。
- 更新了 `stores/data.ts` 与 `tests/utils/faviconService.test.ts` 的导入路径，并补充 `getFaviconFallbacks` 单测。

### 5. HomeView 去除 DOM 直接操作
- `document.querySelector('.sites-section')` 改为模板 ref `sitesSectionRef`（`ref="sitesSectionRef"`），翻页滚动逻辑更安全、符合 Vue 习惯。

### 6. 文档对齐
- 删除已过时的 `CLAUDE.md`（与 `AGENTS.md` 重复且含错误声明）。
- `AGENTS.md`：补充 `useUiStore`、`src/config/schema.ts` 校验、`services/faviconService.ts` 缓存/降级；修正 localStorage 用途描述。
- `README.md`：目录树与「核心模块」更新为 `stores/{data,ui,theme}`、`services/`、`config/schema.ts`，移除 `utils/faviconService` 旧引用。

## 验证结果
- `npm run lint:check`：0 error / 0 warning。
- `npx vitest run`：15 passed（2 文件）。
- `npm run build`：成功（1734 modules transformed）。

## 目录结构变化
```
src/
├── config/{ data/*.json, schema.ts(新增), sites.ts(校验), music.ts(新增,校验) }
├── services/{ faviconService.ts(由 utils/ 迁入并增强), musicApi.ts(新增) }
├── stores/{ data.ts(仅静态+getter), ui.ts(新增), theme.ts, settings.ts(新增) }
├── composables/useMusicPlayer.ts (新增)
└── components/... (HomeView / MainHeader / SiteCard / MiniPlayer 适配)
```

## 阶段二（已实施）

### 7. 打通 settings 配置闭环（stores/settings.ts）
- 新增 `src/stores/settings.ts`（`useSettingsStore`）：在 `App.vue` 启动时调用 `apply()`，将 `settings.json` 真正应用到运行时：
  - `accentColor`（RGB，如 `"14 165 233"`）经 `rgbToHsl` 转为 HSL，写入 `--hue-primary` / `--sat-primary` / `--lig-primary`，主色调由配置驱动（原写死在 `main.css`）。
  - `backgroundImage` + `backgroundImageEnabled` → `--app-bg-image`；`backgroundMotion` → `--app-bg-attachment`（`fixed`/`scroll`）。`App.vue` 的 `.app-container` 消费这些变量。
  - `cardStyle` → 写入 `documentElement` 的 `data-card-style` 属性，供 CSS 定向样式。
- 至此 `settings.json` 不再是死配置，配置闭环成立。

### 8. MiniPlayer 重构（逻辑与视图分离）
- 新增 `src/services/musicApi.ts`：封装外部 `music-api.gdstudio.xyz`（获取直链 / 搜索），统一超时与错误处理，网络失败不再静默吞掉（返回 `null`）。
- 新增 `src/composables/useMusicPlayer.ts`：承载原本散落在 `MiniPlayer.vue` 中的全部播放逻辑（加载、播放/暂停、上一首/下一首、进度、错误）。音频元素通过 `audioRef` 由组件传入。
- `src/config/music.ts`：聚合 `music.json` 并经 Zod 校验（新增 `musicSchema`）。
- `MiniPlayer.vue` 瘦身为纯视图：仅绑定事件、渲染状态。
- **行为修正**：`playPrev` 原实现是「随机下一首」，现改为真正的上一首（按播放列表顺序，循环）。

### 9. 测试补充
- 新增 `tests/services/musicApi.test.ts`：用 `vi.stubGlobal('fetch', ...)` 覆盖直链获取、搜索、网络失败与空结果。

## 验证结果（阶段二）
- `npm run lint:check`：0 error / 0 warning。
- `npx vitest run`：全部通过（含新增 musicApi 测试）。
- `npm run build`：成功。
