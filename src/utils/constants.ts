import type { Link, Category, SearchConfig, SiteSettings, SearchSource } from '../types'

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

export const DefaultSiteSettings: SiteSettings = {
  title: 'nianming_nav',
  navTitle: '我的导航',
  favicon: '',
  cardStyle: 'detailed',
  siteMode: 'personal',
  accentColor: '14 165 233',
  grayScale: 'slate',
  closeOnBackdrop: true,
  backgroundImage: '',
  backgroundImageEnabled: false,
  backgroundMotion: false
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

export const SyncMetadata = {
  updatedAt: 0,
  deviceId: '',
  version: 0,
  browser: '',
  os: ''
}

export const SyncStatus = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  PENDING: 'pending',
  ERROR: 'error',
  CONFLICT: 'conflict'
} as const

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'common', name: '常用推荐', icon: '⭐' },
  { id: 'dev', name: '开发工具', icon: '💻' },
  { id: 'design', name: '设计资源', icon: '🎨' },
  { id: 'read', name: '阅读资讯', icon: '📖' },
  { id: 'ent', name: '休闲娱乐', icon: '🎮' },
  { id: 'ai', name: '人工智能', icon: '🤖' },
]

export const CATEGORY_ICONS: string[] = ['📁', '⭐', '💻', '🎨', '📖', '🎮', '🤖', '🔧', '📱', '🌐', '💼', '🎵', '🎬', '📚', '🛒']

export const INITIAL_LINKS: Link[] = [
  { id: '1', name: 'GitHub', url: 'https://github.com', categoryId: 'dev', createdAt: Date.now(), description: '代码托管平台', pinned: true, icon: '' },
  { id: '2', name: 'Vue.js', url: 'https://vuejs.org', categoryId: 'dev', createdAt: Date.now(), description: '渐进式JavaScript框架', pinned: true, icon: '' },
  { id: '3', name: 'Tailwind CSS', url: 'https://tailwindcss.com', categoryId: 'design', createdAt: Date.now(), description: '原子化CSS框架', pinned: true, icon: '' },
  { id: '4', name: 'ChatGPT', url: 'https://chat.openai.com', categoryId: 'ai', createdAt: Date.now(), description: 'OpenAI聊天机器人', pinned: true, icon: '' },
  { id: '5', name: 'Claude', url: 'https://claude.ai', categoryId: 'ai', createdAt: Date.now(), description: 'Anthropic AI助手', pinned: false, icon: '' },
  { id: '6', name: 'Vercel', url: 'https://vercel.com', categoryId: 'dev', createdAt: Date.now(), description: '前端部署与托管平台', icon: '' },
  { id: '7', name: 'Figma', url: 'https://figma.com', categoryId: 'design', createdAt: Date.now(), description: '在线协作界面设计工具', icon: '' },
  { id: '8', name: 'Hacker News', url: 'https://news.ycombinator.com', categoryId: 'read', createdAt: Date.now(), description: '极客新闻聚合社区', icon: '' },
  { id: '9', name: 'YouTube', url: 'https://youtube.com', categoryId: 'ent', createdAt: Date.now(), description: '全球最大的视频分享网站', icon: '' },
  { id: '10', name: 'Dribbble', url: 'https://dribbble.com', categoryId: 'design', createdAt: Date.now(), description: '设计师作品分享社区', icon: '' },
  { id: '11', name: 'VS Code', url: 'https://code.visualstudio.com', categoryId: 'dev', createdAt: Date.now(), description: '微软开源代码编辑器', icon: '' },
  { id: '12', name: 'Midjourney', url: 'https://www.midjourney.com', categoryId: 'ai', createdAt: Date.now(), description: 'AI图像生成工具', icon: '' },
  { id: '13', name: 'Stack Overflow', url: 'https://stackoverflow.com', categoryId: 'dev', createdAt: Date.now(), description: '开发者问答社区', icon: '' },
  { id: '14', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', categoryId: 'dev', createdAt: Date.now(), description: 'Web开发者文档', icon: '' },
  { id: '15', name: 'Netflix', url: 'https://www.netflix.com', categoryId: 'ent', createdAt: Date.now(), description: '流媒体影视平台', icon: '' },
]

export const DEFAULT_SEARCH_SOURCES: SearchSource[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', enabled: true },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', enabled: true },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', enabled: true },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', enabled: true },
]

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  title: 'nianming_nav',
  navTitle: '我的导航',
  favicon: '',
  cardStyle: 'detailed',
  siteMode: 'personal',
  accentColor: '14 165 233',
  grayScale: 'slate',
  closeOnBackdrop: true,
  backgroundImage: '',
  backgroundImageEnabled: false,
  backgroundMotion: false
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  selectedSourceId: 'baidu',
  externalSources: DEFAULT_SEARCH_SOURCES
}

// Favicon cache key for localStorage
export const FAVICON_CACHE_KEY = 'nianming_nav_favicon_cache'

// Default icon placeholder (using a simple SVG data URL)
export const DEFAULT_ICON_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg=='

/**
 * 获取默认图标
 * @returns {string} 默认图标URL
 */
export const getDefaultIcon = (): string => {
  return DEFAULT_ICON_PLACEHOLDER
}
