---
name: renumber-links
description: Maintain the navigation site's per-category segmented link-id scheme. Use when links.json has drifted out of grouping, ids collide/clash across categories, a renumber is needed after bulk edits, or you need to understand how link ids are allocated. Triggers on "重排 links", "重编号", "renumber links", "整理 links.json", "link id 段位", or questions about why/where a link id should go.
---

# renumber-links — 维护按分类段位的链接 id 方案

本导航站（nianming_nav）的链接 `id` **不是全局自增**，而是**每个分类独占一个 1000 宽数值区间**（段位），便于按分类维护、互不挤压。

## 段位规则（单一事实来源：`src/config/linkId.ts`）

| 分类 categoryId | id 区间        |
| --------------- | -------------- |
| `ai`            | `1001`–`1999`  |
| `dev`           | `2001`–`2999`  |
| `frontend-dev`  | `3001`–`3999`  |
| `backend-dev`   | `4001`–`4999`  |
| `interview`     | `5001`–`5999`  |
| `design`        | `6001`–`6999`  |
| `read`          | `7001`–`7999`  |
| `ent`           | `8001`–`8999`  |
| `software`      | `9001`–`9999`  |

- `nextLinkId(links, categoryId, categories)` 取该分类段位内**最大 id + 1**；段位满则退回全局 `max+1` 兜底。
- **新增分类时**：在 `linkId.ts` 的 `CATEGORY_ID_RANGES` 里**追加** `base = 当前最大 base + 1000`，**不要改动已有分类的 base**（否则旧 id 段位错位、收藏按 id 失效）。
- `links.json` 物理上按「分类 → 二级分类」聚合，段内从 `base+1` 连续自增。

## 何时需要重排/重编号

- 手动改了 `links.json` 后条目未按分类聚合、或 id 出现跨分类异常（如 ai 段混入了 `2/3/15`）。
- 批量新增后段位不连续、或插入位置错乱。
- 你只是想统一规整数据。

## 操作步骤

### 1. 一键重排 + 重编号（按分类聚合、段内自增、保留同二级分类相对顺序）

```bash
node scripts/renumber-links.mjs
```

脚本会就地改写 `src/config/data/links.json`，并输出各分类计数与越界检查。

### 2. 单条新增时取段位 id（写盘前用）

```bash
node .codebuddy/skills/add-nav-site/scripts/next_link_id.mjs <categoryId>
# 例：node .codebuddy/skills/add-nav-site/scripts/next_link_id.mjs ai  → 1001
```
省略参数仅用于未知/遗留分类（退回全局 max+1）。新增条目应插入到「同分类（同二级分类）末尾」以保持聚合，而非追加到文件尾。

### 3. 改完后必须跑全量校验（husky 提交也会跑，但本地先确认）

```bash
npm run typecheck && npm run lint:check && npx vitest run && npm run build
```

### 4. 若改动了 `linkId.ts` 的段位映射或 `links.json` 结构

- 运行 `npm run fetch-favicons`（仅当新增/编辑了站点 URL 时才需要刷新图标；纯重编号不影响图标）。
- 注意：**收藏（favorites）与最近访问（recentVisits）按 `link.id` 存于 localStorage**，重编号会改变 id，导致旧收藏失效。这是已知行为——见下方"与收藏的关系"。

## 与收藏的关系（重要）

`src/stores/userPrefs.ts` 的 `favorites` / `recentVisits` 以 `link.id` 为主键。重编号后旧 id 失效，用户侧表现为"收藏消失"。当前约定是：让用户清空 localStorage（重启服务）后重新收藏。

> **已优化**：收藏（favorites）与最近访问（recentVisits）现已改为以稳定的 `url` 为主键（见 `src/stores/userPrefs.ts` 的 `migrateFromIds`），重编号改变 `link.id` 不会再令用户收藏失效。旧版以 id 存储的收藏会在数据加载后自动映射为 url。

## 关键文件

- `src/config/linkId.ts` — 段位映射 `CATEGORY_ID_RANGES` 与 `nextLinkId()`（唯一事实来源）
- `scripts/renumber-links.mjs` — 重排 + 重编号脚本
- `.codebuddy/skills/add-nav-site/scripts/next_link_id.mjs` — 单条段位 id 计算
- `src/config/data/links.json` — 被改写的数据源
- `plugins/devAdminApi.ts` — dev 后台 POST 链接时按段位生成 id 并插入到同分类块末尾
