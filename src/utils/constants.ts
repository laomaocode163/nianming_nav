import type { Link, Category, SearchConfig, SearchSource } from '../types'

export const LinkItem: Partial<Link> = {
  id: '',
  name: '',
  url: '',
  icon: '',
  description: '',
  categoryId: '',
  createdAt: 0,
  hidden: false,
  pinned: false,
  pinnedOrder: 0,
  order: 0
}

export const CategoryItem: Partial<Category> = {
  id: '',
  name: '',
  icon: '',
  hidden: false
}

export const SearchMode = {
  INTERNAL: 'internal',
  EXTERNAL: 'external'
} as const

export const ExternalSearchSourceItem: Partial<SearchSource> = {
  id: '',
  name: '',
  url: '',
  enabled: true,
  createdAt: 0
}

export const SearchConfigItem: Partial<SearchConfig> = {
  mode: 'internal',
  externalSources: [],
  selectedSourceId: ''
}

// 默认图标占位符 (SVG data URL)
export const DEFAULT_ICON_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg=='

export const FAVICON_CACHE_KEY = 'nianming_nav_favicon_cache'

export const getDefaultIcon = (): string => {
  return DEFAULT_ICON_PLACEHOLDER
}
