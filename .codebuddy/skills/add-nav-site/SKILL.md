---
name: add-nav-site
description: This skill should be used when adding a new website/link to the nianming_nav navigation site, or when creating/modifying categories and sub-categories. It guides the agent through editing links.json, categories.json, and CategoryIcon.vue, then running favicon fetch and typecheck.
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

### 2. Compute the next link id

Run the bundled script to get a collision-free id (ids are non-sequential, so never use
"last entry + 1"):

```bash
node .codebuddy/skills/add-nav-site/scripts/next_link_id.mjs
```

It prints the next id (e.g. `361`) to stdout. Use it as the new link's `id` (string).

### 3. Edit `src/config/data/links.json`

Append an object after the last entry (keep the trailing comma style already used):

```json
{ "id": "<next_id>", "name": "站点名", "url": "https://example.com/", "categoryId": "ai", "subCategoryId": "ai-benchmark", "description": "一句话简介" }
```

- `subCategoryId` is optional (omit for top-level-only categories like 常用推荐).
- `pinned: true` only when the user asks to pin it.
- Field rules and referential constraints: see `references/schema.md`.

### 4. Edit `src/config/data/categories.json` (only if creating categories)

- Top-level: `{ "id": "interview", "name": "招聘面试", "icon": "briefcase" }`
  (add `subCategories: [...]` if it has children).
- Sub-category: `{ "id": "interview-ai", "name": "人工智能", "icon": "bot", "order": 2 }`
  — `order` controls display order within its parent (start at 1, increment).

### 5. Register icons (only if a NEW icon name is used)

All icon names resolve through `src/components/ui/CategoryIcon.vue`:

1. Check `references/icons.md` for already-registered names. If the name is listed, skip.
2. If new: import the Lucide icon at the top of `CategoryIcon.vue` and add it to `iconMap`
   (see `references/icons.md` for the exact pattern). Unregistered names silently fall back
   to the `Star` icon — avoid that by registering.
3. Pick an icon name from the Lucide set; prefer one already registered to avoid edits.

### 6. Fetch favicons

```bash
npm run fetch-favicons
```

Downloads new site icons into `public/favicons/` and regenerates
`src/config/faviconManifest.json`. Run after any link addition.

### 7. Typecheck

```bash
npm run typecheck
```

Strict `vue-tsc --noEmit`. Fix any referential-integrity or type errors before reporting done.

## Checklist before finishing

- [ ] Link id is unique and collision-free (from the script).
- [ ] `categoryId` exists in `categories.json`.
- [ ] `subCategoryId` (if present) exists under that `categoryId`.
- [ ] New icons registered in `CategoryIcon.vue` (or reused an existing name).
- [ ] `npm run fetch-favicons` ran.
- [ ] `npm run typecheck` passed.
