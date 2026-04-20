/**
 * 网站导航配置
 * 数据从 JSON 文件加载，便于独立维护
 */
import type { Link, Category, SearchSource, SiteSettings, SearchConfig } from '../types'

import categoriesData from './data/categories.json'
import linksData from './data/links.json'
import searchData from './data/search.json'
import settingsData from './data/settings.json'

export type { Link, Category, SearchSource, SiteSettings, SearchConfig }

export const CATEGORY_ICONS: string[] = ['📁', '⭐', '💻', '🎨', '📖', '🎮', '🤖', '🔧', '📱', '🌐', '💼', '🎵', '🎬', '📚', '🛒']

export const categories = categoriesData as Category[]
export const links = linksData as Link[]
export const searchConfig: SearchConfig = searchData as SearchConfig
export const settings = settingsData as SiteSettings

export const SITE_CONFIG = {
  categories,
  links,
  searchConfig,
  settings
}
