# AGENTS.md — nianming_nav

Personal navigation/start-page SPA (Vue 3 + Vite). Navigation content is static JSON; there is **no backend** for site data.

## Commands

- `npm run dev` — dev server on port 5173, auto-opens browser
- `npm run build` — production build → `dist/`
- `npm run lint` — ESLint + Prettier with `--fix`; `npm run lint:check` for check-only
- `npm run test` — Vitest in watch mode; `npm run test:coverage` for coverage
- `npx vitest run tests/<path>` — run a single test file
- `npm run commit` — Commitizen conventional-commit prompt (use this instead of plain `git commit`)

**CI** (`.github/workflows/ci.yml`, Node 20) runs in order: `npm ci` → `npm run lint:check` → `npm run test` → `npm run build`, then deploys `dist/` to Cloudflare Pages from `main`.
The husky pre-commit hook runs `npm test`, so **every commit triggers the full Vitest suite** — keep tests green before committing.

## Conventions / gotchas

- **Auto-imports**: Vue APIs (`ref`, `computed`, …) and Element Plus components are auto-imported via `unplugin-auto-import` / `unplugin-vue-components`. Do **not** add explicit imports for them — declarations live in `src/auto-imports.d.ts` and `src/components.d.ts`.
- **Path alias** `@` → `src/` (configured in `vite.config.ts`).
- **Styling**: Tailwind CSS **v4** with **CSS-based config** in `src/assets/main.css`. Theme colors are HSL CSS variables (`--color-primary`, `--color-secondary`). There is **no `tailwind.config.js`** — do not create one. Use scoped styles in SFCs.
- **TypeScript is strict** (`noUnusedLocals`, `noUnusedParameters` in `tsconfig.json`): unused vars break `build`/`tsc`. ESLint warns on `any` and unused vars.
- **Edit site content** by changing JSON in `src/config/data/` (categories, links, search, settings, music); `src/config/sites.ts` aggregates them into `SITE_CONFIG`. There is no admin UI and no database.
- **localStorage** holds theme preference and a favicon URL cache (used to skip known-broken icon sources) — never core navigation data.
- Component style: Composition API `<script setup>` + TypeScript throughout.

## Architecture

- Single route `/` → `HomeView`. Layout = Sidebar (category nav) + MainHeader (search, time, music player, theme toggle) + site-card grid.
- Data flow: JSON → `src/config/sites.ts` (`SITE_CONFIG`, validated by `src/config/schema.ts` Zod schemas) → Pinia `data` store (`src/stores/data.ts`, static data + getters) and `ui` store (`src/stores/ui.ts`, interaction state: selected category, search query/mode, sidebar, pagination) → components. Theme is managed by `src/stores/theme.ts`.
- Favicons are resolved by `src/services/faviconService.ts` with an in-memory + localStorage cache and a fallback chain (faviconextractor → Google S2 → DuckDuckGo).
- Runtime settings are applied by `src/stores/settings.ts`: `settings.json` `accentColor` → primary HSL CSS variables, `backgroundImage`/`backgroundMotion` → app background, `cardStyle` → `data-card-style` attribute. This closes the config → UI loop.
- Music: `MiniPlayer` logic lives in `src/composables/useMusicPlayer.ts`, backed by `src/services/musicApi.ts` (external `music-api.gdstudio.xyz`); the `MiniPlayer.vue` component is a thin view. Playlist comes from `src/config/music.ts` (validated).

## Deployment

Cloudflare Pages: build command `npm run build`, output directory `dist/`, deployed automatically from `main` via CI. (`functions/api/` exists for Cloudflare Functions but is currently empty.)
