/**
 * 网站导航配置
 * 数据从 JSON 文件加载，经 Zod Schema 校验后聚合，便于独立维护与尽早暴露配置错误。
 */
import type { Link, Category, SearchSource, SiteSettings, SearchConfig } from '../types'
import {
  categoriesSchema,
  linksSchema,
  searchConfigSchema,
  siteSettingsSchema,
} from './schema'

import categoriesData from './data/categories.json'
import linksData from './data/links.json'
import searchData from './data/search.json'
import settingsData from './data/settings.json'

export type { Link, Category, SearchSource, SiteSettings, SearchConfig }

export const CATEGORY_ICONS: string[] = ['📁', '⭐', '💻', '🎨', '📖', '🎮', '🤖', '🔧', '📱', '🌐', '💼', '🎵', '🎬', '📚', '🛒']

export const categories = categoriesSchema.parse(categoriesData) as Category[]
export const links = linksSchema.parse(linksData) as Link[]
export const searchConfig = searchConfigSchema.parse(searchData) as SearchConfig
export const settings = siteSettingsSchema.parse(settingsData) as SiteSettings

export const SITE_CONFIG = {
  categories,
  links,
  searchConfig,
  settings,
}
