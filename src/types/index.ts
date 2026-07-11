// 二级分类类型
export interface SubCategory {
  id: string;
  name: string;
  icon?: string;
  order?: number;
}

// 网站链接类型
export interface Link {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  subCategoryId?: string;
  icon?: string;
  pinned?: boolean;
  pinnedOrder?: number;
  order?: number;
  hidden?: boolean;
  description?: string;
  createdAt?: number;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  icon: string;
  hidden?: boolean;
  order?: number;
  subCategories?: SubCategory[];
}

// 搜索模式（站内 / 外部搜索引擎）
export type SearchMode = 'internal' | 'external';

// 音乐曲目
export interface MusicTrack {
  name: string
  keyword: string
  kuwoId?: string
  neteaseId?: string
}

// 搜索配置类型
export interface SearchSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  icon?: string;
  createdAt?: number;
}

export interface SearchConfig {
  mode?: string;
  selectedSourceId: string;
  externalSources: SearchSource[];
}

// 网站设置类型
export interface SiteSettings {
  title?: string;
  navTitle?: string;
  favicon?: string;
  cardStyle?: string;
  siteMode?: string;
  accentColor?: string;
  grayScale?: string;
  closeOnBackdrop?: boolean;
  backgroundImage?: string;
  backgroundImageEnabled?: boolean;
  backgroundMotion?: boolean;
}

// 图标映射类型
export interface IconMap {
  [domain: string]: string;
}