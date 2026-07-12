// 领域类型统一由 zod schema 派生（src/config/schema.ts），避免手写接口与校验漂移
export type {
  SubCategory,
  Category,
  Link,
  SearchSource,
  SearchConfig,
  SiteSettings,
} from '../config/schema';

// 搜索模式（站内 / 外部搜索引擎）
export type SearchMode = 'internal' | 'external';
