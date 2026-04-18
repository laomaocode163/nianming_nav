// 网站链接类型
export interface Link {
  id: string;
  name: string;
  url: string;
  categoryId: string;
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
  siteName?: string;
  enableAnimations?: boolean;
  [key: string]: string | boolean | undefined;
}

// 图标映射类型
export interface IconMap {
  [domain: string]: string;
}