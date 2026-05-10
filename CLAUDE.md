# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nianming_nav (念铭导航) is a personal navigation/start-page site built with Vue 3. It organizes links into categories with search, pinning, theming, and responsive layout support. Site data (links, categories, search engines, settings) is loaded from static JSON files in `src/config/data/` via the aggregator `src/config/sites.ts`. localStorage is only used for theme preference, favicon cache, and keyboard hint dismissal — not for core data.

## Commands

```bash
npm run dev          # Start dev server (port 5173, auto-opens browser)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run test         # Run tests (Vitest, also runs as pre-commit hook)
npm run test:coverage
npm run lint         # Lint + auto-fix (ESLint + Prettier)
npm run lint:check   # Lint without fixing
npm run format       # Format with Prettier
npm run commit       # Commitizen conventional commit prompt
```

Single test file: `npx vitest run tests/path/to/file.test.ts`

## Architecture

**Single-page app** with one route (`/` → `HomeView`). The page combines a sidebar (category navigation), a header (search bar, time widget, music player, theme toggle), and a grid of site cards.

### Data Flow

Static JSON config lives in `src/config/data/` (categories.json, links.json, search.json, settings.json, music.json). These are aggregated by `src/config/sites.ts` into a single `SITE_CONFIG` object, which the Pinia data store (`src/stores/data.ts`) loads at startup. The store exposes computed getters for filtered/sorted links by category, pinned links, and search results. No backend API calls for navigation data.

One exception: the `MiniPlayer` component streams music from an external API (`music-api.gdstudio.xyz`).

### Key Directories

- `src/config/data/` — Static JSON data files. Edit these to modify site content (no admin UI):
  - `categories.json` — Category definitions (id, name, icon, hidden, order)
  - `links.json` — Website link entries (name, url, categoryId, description, order)
  - `search.json` — External search engine configuration (Bing, Baidu, GitHub)
  - `settings.json` — Site-wide settings (title, accent color, card style)
  - `music.json` — Music playlist for the built-in player (Jay Chou songs)
- `src/config/sites.ts` — Aggregates all JSON data into a single `SITE_CONFIG` export
- `src/stores/` — Pinia stores: `data.ts` (links, categories, search, settings) and `theme.ts` (light/dark mode with system preference detection and localStorage persistence)
- `src/components/layout/` — `Sidebar.vue` (category nav, collapsible on desktop, drawer on mobile) and `MainHeader.vue` (search, time widget, music player, theme toggle)
- `src/components/MusicPlayer/` — `MiniPlayer.vue` (inline music player streaming Jay Chou songs via external API)
- `src/components/ui/` — Reusable components: `SiteCard.vue`, `EmptyState.vue`, `ScrollToTop.vue`, `TimeDateComponent.vue`
- `src/hooks/` — `useResponsive.ts` (singleton breakpoint detection with shared resize listener)
- `src/utils/` — `faviconService.ts` (favicon URL via faviconextractor.com), `constants.ts` (defaults)
- `src/types/` — TypeScript interfaces: `Link`, `Category`, `SearchSource`, `SearchConfig`, `SiteSettings`, `IconMap`
- `tests/` — Unit tests (stores/, utils/)

### Conventions

- **Path alias**: `@` maps to `src/` (configured in vite.config.ts)
- **Styling**: Tailwind CSS v4 with custom theme (primary purple, secondary cyan) in `tailwind.config.js`. Global CSS variables and dark mode definitions in `src/assets/main.css`. Use scoped styles in SFCs.
- **Component style**: Composition API with `<script setup>`, TypeScript throughout
- **UI library**: Element Plus with auto-import via `unplugin-vue-components` and `unplugin-auto-import` (tree-shaken, no global import needed)
- **Auto-import**: Vue APIs (`ref`, `computed`, etc.) and Element Plus components are auto-imported; see `src/auto-imports.d.ts` and `src/components.d.ts`
- **Commit style**: Conventional Commits enforced via commitizen and husky pre-commit hook (runs `npm test`)
- **Data editing**: Edit JSON files in `src/config/data/` to modify navigation content

## Deployment

Recommended: **Cloudflare Pages** — build command `npm run build`, output directory `dist`. The `functions/api/` directory exists for potential Cloudflare Functions (currently empty).
