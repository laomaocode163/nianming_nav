/**
 * 管理后台 API 客户端（仅本地开发可用，对应 plugins/devAdminApi.ts 的 dev 中间件）。
 * 只读面板：仅提供 GET 读取方法，失败时抛出带中文信息的 Error。
 */
import type { Category, Link, SearchConfig, SiteSettings, SubCategory } from '@/types';

export interface SubCategoryView extends SubCategory {
  categoryId: string;
  categoryName: string;
}

const BASE = '/api/admin';

class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const request = async <T>(path: string, method: string): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, { method });
  const text = await res.text();
  const data: Record<string, unknown> = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!res.ok) {
    const message = 'error' in data ? String(data.error) : `请求失败(${res.status})`;
    throw new AdminApiError(res.status, message);
  }
  return data as T;
};

export const adminApi = {
  getCategories: (): Promise<Category[]> => request<Category[]>('/categories', 'GET'),

  getLinks: (): Promise<Link[]> => request<Link[]>('/links', 'GET'),

  getSubCategories: (): Promise<SubCategoryView[]> =>
    request<SubCategoryView[]>('/subcategories', 'GET'),

  getSettings: (): Promise<SiteSettings> => request<SiteSettings>('/settings', 'GET'),

  getSearchConfig: (): Promise<SearchConfig> => request<SearchConfig>('/search', 'GET'),
};
