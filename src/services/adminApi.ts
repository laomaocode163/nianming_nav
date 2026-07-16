/**
 * 管理后台 API 客户端（仅本地开发可用，对应 plugins/devAdminApi.ts 的 dev 中间件）。
 * 所有方法在失败时抛出带中文信息的 Error。
 */
import type { Category, Link, SiteConfig, SubCategory } from '@/types';

export interface SubCategoryView extends SubCategory {
  categoryId: string;
  categoryName: string;
}

export interface FetchResult {
  ok: boolean;
  code: number;
  output: string;
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

const request = async <T>(path: string, method: string, body?: unknown): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
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

  createCategory: (category: Category): Promise<Category> =>
    request<Category>('/categories', 'POST', category),

  updateCategory: (id: string, category: Category): Promise<Category> =>
    request<Category>(`/categories/${encodeURIComponent(id)}`, 'PUT', category),

  deleteCategory: (id: string): Promise<{ ok: true }> =>
    request<{ ok: true }>(`/categories/${encodeURIComponent(id)}`, 'DELETE'),

  getLinks: (): Promise<Link[]> => request<Link[]>('/links', 'GET'),

  createLink: (link: Link): Promise<Link> => request<Link>('/links', 'POST', link),

  updateLink: (id: string, link: Link): Promise<Link> =>
    request<Link>(`/links/${encodeURIComponent(id)}`, 'PUT', link),

  deleteLink: (id: string): Promise<{ ok: true }> =>
    request<{ ok: true }>(`/links/${encodeURIComponent(id)}`, 'DELETE'),

  getSubCategories: (): Promise<SubCategoryView[]> =>
    request<SubCategoryView[]>('/subcategories', 'GET'),

  createSubCategory: (categoryId: string, sub: SubCategory): Promise<SubCategoryView> =>
    request<SubCategoryView>('/subcategories', 'POST', { categoryId, ...sub }),

  updateSubCategory: (
    categoryId: string,
    subId: string,
    sub: SubCategory
  ): Promise<SubCategoryView> =>
    request<SubCategoryView>(
      `/subcategories/${encodeURIComponent(categoryId)}/${encodeURIComponent(subId)}`,
      'PUT',
      { categoryId, ...sub }
    ),

  deleteSubCategory: (categoryId: string, subId: string): Promise<{ ok: true }> =>
    request<{ ok: true }>(
      `/subcategories/${encodeURIComponent(categoryId)}/${encodeURIComponent(subId)}`,
      'DELETE'
    ),

  fetchFavicons: (force = false): Promise<FetchResult> =>
    request<FetchResult>('/fetch-favicons', 'POST', { force }),

  restoreAll: (config: SiteConfig): Promise<{ ok: true }> =>
    request<{ ok: true }>('/restore', 'POST', config),
};
