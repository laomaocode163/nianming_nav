---
name: add-nav-site
description: This skill should be used when adding a new website/link to the nianming_nav navigation site, or when creating/modifying categories and sub-categories. It guides the agent through a mandatory duplicate check (check-duplicate-link), then editing links.json, categories.json, and CategoryIcon.vue, then running favicon fetch and typecheck.
---

# Add Nav Site

Add websites, links, and categories to the `nianming_nav` navigation SPA. The site data is
static JSON (no backend); this skill encodes the conventions verified against the live
codebase so repeated edits stay consistent.

## When to use

- "添加网站 https://example.com 到 人工智能 → 模型评测"
- "新增一个分类/二级分类"
- "编辑导航内容 / 给某分类加链接"
- Any request to insert or restructure navigation entries.

## Workflow

### 1. Parse intent

Determine which of these the user wants:

- **New link** → needs `categoryId` (+ optional `subCategoryId`). If the target
  category/sub-category does not exist, create it first (step 3).
- **New top-level category** → append to `categories.json` array.
- **New sub-category** → add to an existing category's `subCategories` array.

If the user only gives a URL, infer `name`/`description` from the page (use firecrawl/web
scrape if needed) and ask which category it belongs to before writing.

### 2. Check for duplicates (新增前必做)

**在任何写入之前**，先确认该网址未被添加过，避免像「Chrome 下载页被同时加到官方软件与其他工具」那样的重复事故。运行配套脚本（或手动搜索 `links.json`）：

```bash
node scripts/check-duplicate-link.mjs "https://example.com/"
# 或：npm run check-duplicate-link -- "https://example.com/"
```

脚本输出三种结果，按结果处理：

- **`DUPLICATE-EXACT`** → 完整 URL 已存在。**立即中止新增**，向用户说明已存在条目（id/名称/所属分类），询问是否改用已有条目或移动到目标分类（用 `renumber-links`/直接改 `subCategoryId`），**不要**新建重复链接。
- **`WARN-SAME-HOST`** → 同域名但路径不同（可能是同一站点的不同页面，如首页 vs 下载页）。向用户确认是否真重复；若重复则复用，否则可继续。
- **`OK`** → 未发现重复，进入下一步正常添加。

> 手动核对兜底：若无法运行脚本，用 `search_content` 在 `src/config/data/links.json` 中按域名/URL 片段检索，确认无既有条目。

### 3. Compute the next link id

Run the bundled script to get a collision-free id. Ids are allocated per **category
segment** (each category owns a 1000-wide numeric range, e.g. `ai` → `1001..1999`,
`dev` → `2001..2999`, …), so always pass the target `categoryId` and never use
"last entry + 1":

```bash
node scripts/next-link-id.mjs ai
# 或：npm run next-link-id -- ai
```

It prints the next id for that category segment (e.g. `1001`) to stdout. Use it as the
new link's `id` (string). Omit the argument only for unknown/legacy categories (falls
back to global max+1).

### 4. Edit `src/config/data/links.json`

Insert the new object **right after the last existing link of the same `categoryId`
(and same `subCategoryId` when applicable)** — links are grouped by category, not
appended at the end. Keep the existing single-line object + trailing-comma style:

```json
{ "id": "<next_id>", "name": "站点名", "url": "https://example.com/", "categoryId": "ai", "subCategoryId": "ai-benchmark", "description": "一句话简介" }
```

If you have appended several links and the file drifted out of grouping, re-run the
maintainer script to re-group and re-number everything by category:

```bash
node scripts/renumber-links.mjs
```

- `subCategoryId` is optional (omit for top-level-only categories like 常用推荐).
- `pinned: true` only when the user asks to pin it.
- Field rules and referential constraints: see `references/schema.md`.

### 5. Edit `src/config/data/categories.json` (only if creating categories)

- Top-level: `{ "id": "interview", "name": "招聘面试", "icon": "briefcase" }`
  (add `subCategories: [...]` if it has children).
- Sub-category: `{ "id": "interview-ai", "name": "人工智能", "icon": "bot", "order": 2 }`
  — `order` controls display order within its parent (start at 1, increment).

### 6. Register icons (only if a NEW icon name is used)

All icon names resolve through `src/components/ui/CategoryIcon.vue`:

1. Check `references/icons.md` for already-registered names. If the name is listed, skip.
2. If new: import the Lucide icon at the top of `CategoryIcon.vue` and add it to `iconMap`
   (see `references/icons.md` for the exact pattern). Unregistered names silently fall back
   to the `Star` icon — avoid that by registering.
3. Pick an icon name from the Lucide set; prefer one already registered to avoid edits.

### 7. Fetch favicons

```bash
npm run fetch-favicons
```

Downloads new site icons into `public/favicons/` and regenerates
`src/config/faviconManifest.json`. Run after any link addition.

### 8. Typecheck

```bash
npm run typecheck
```

Strict `vue-tsc --noEmit`. Fix any referential-integrity or type errors before reporting done.

## Checklist before finishing

- [ ] **Duplicate check ran first** (`check-duplicate-link.mjs`) and returned `OK` or a confirmed non-duplicate `WARN-SAME-HOST` — no `DUPLICATE-EXACT`.
- [ ] Link id is unique and collision-free (from the script).
- [ ] `categoryId` exists in `categories.json`.
- [ ] `subCategoryId` (if present) exists under that `categoryId`.
- [ ] New icons registered in `CategoryIcon.vue` (or reused an existing name).
- [ ] `npm run fetch-favicons` ran.
- [ ] `npm run typecheck` passed.

## Related

- **`renumber-links`** skill — 当 `links.json` 经过多次手动编辑后分组错乱、id 跨分类异常，或你需要统一重排/重编号时，用它一键规整（按分类段位聚合、段内自增）。新增单条站点仍用本 skill 的 `next_link_id.mjs`。
