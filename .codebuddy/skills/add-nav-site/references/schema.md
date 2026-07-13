# Data Schema & Validation Rules

Navigation data lives in `src/config/data/`. At runtime it is Zod-validated and checked for
referential integrity by `validateReferentialIntegrity` in `src/config/loadConfig.ts`. These
rules MUST hold or the app throws at load time.

## links.json

JSON array of link objects.

| Field           | Type     | Required | Notes                                                        |
| --------------- | -------- | -------- | ------------------------------------------------------------ |
| `id`            | string   | yes      | Globally unique. Numeric string, e.g. `"361"`.               |
| `name`          | string   | yes      | Display name.                                                |
| `url`           | string   | yes      | Full URL including scheme.                                   |
| `categoryId`    | string   | yes      | Must exist as a category `id` in `categories.json`.           |
| `subCategoryId` | string   | no       | If present, must exist under that `categoryId`.              |
| `description`   | string   | yes      | One-line intro.                                              |
| `pinned`        | boolean  | no       | `true` to pin to top of its category.                        |

Example:

```json
{ "id": "361", "name": "Example", "url": "https://example.com/", "categoryId": "ai", "subCategoryId": "ai-benchmark", "description": "示例站点" }
```

## categories.json

JSON array of category objects.

Top-level category:

```json
{ "id": "interview", "name": "招聘面试", "icon": "briefcase" }
```

With sub-categories:

```json
{ "id": "design", "name": "设计资源", "icon": "palette", "subCategories": [
    { "id": "design-ui", "name": "UI设计", "icon": "paintbrush", "order": 1 }
  ] }
```

| Field          | Type            | Required | Notes                                              |
| -------------- | --------------- | -------- | -------------------------------------------------- |
| `id`           | string          | yes      | Globally unique category id.                       |
| `name`         | string          | yes      | Display name.                                      |
| `icon`         | string          | yes      | Must be a key in `CategoryIcon.vue` `iconMap`.     |
| `subCategories`| array (optional)| no       | Each: `{ id, name, icon, order }`.                 |

Sub-category fields:

| Field   | Type   | Required | Notes                                                  |
| ------- | ------ | -------- | ------------------------------------------------------ |
| `id`    | string | yes      | Unique within its parent (and globally).               |
| `name`  | string | yes      | Display name.                                          |
| `icon`  | string | yes      | Must be a key in `CategoryIcon.vue` `iconMap`.         |
| `order` | number | yes      | Sort order within the parent (1 = first).             |

## Referential integrity (enforced at runtime)

- Category ids, sub-category ids, and link ids must each be globally unique.
- A link's `categoryId` must reference an existing category.
- If a link has `subCategoryId`, it must exist under that exact `categoryId`.
- Duplicate ids of any kind throw `配置校验失败：存在重复的…ID`.

## JSON style conventions

- The files use pretty-printed JSON, one object per line, 2-space indent for nested arrays.
- Preserve the existing trailing-comma-free, one-entry-per-line format when appending.
- Keep `id` values as strings even when numeric.
