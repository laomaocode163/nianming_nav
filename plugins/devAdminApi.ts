/**
 * 本地开发期管理后台 API（仅 dev server 注册，生产构建不含）。
 * 只读面板：仅提供 categories / links / subcategories / settings / search 的 GET 读取，
 * 不含任何写操作。JSON 读取与路径常量见 ./lib/configIo。
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Category, Link, SearchConfig, SiteSettings } from '../src/config/schema';
import {
  CATEGORIES_PATH,
  LINKS_PATH,
  SEARCH_PATH,
  SETTINGS_PATH,
  readJson,
  flattenSubs,
} from './lib/configIo';

class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const sendJson = (res: ServerResponse, status: number, data: unknown): void => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

const route = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const path = url.pathname;
  const method = req.method ?? 'GET';

  // 只读面板：仅接受 GET
  if (method !== 'GET') {
    throw new HttpError(405, '只读面板不支持写操作');
  }

  if (path === '/api/admin/categories') {
    return sendJson(res, 200, await readJson<Category[]>(CATEGORIES_PATH));
  }
  if (path === '/api/admin/links') {
    return sendJson(res, 200, await readJson<Link[]>(LINKS_PATH));
  }
  if (path === '/api/admin/subcategories') {
    return sendJson(res, 200, flattenSubs(await readJson<Category[]>(CATEGORIES_PATH)));
  }
  if (path === '/api/admin/settings') {
    return sendJson(res, 200, await readJson<SiteSettings>(SETTINGS_PATH));
  }
  if (path === '/api/admin/search') {
    return sendJson(res, 200, await readJson<SearchConfig>(SEARCH_PATH));
  }

  throw new HttpError(404, 'Not Found');
};

export function devAdminApi() {
  return {
    name: 'dev-admin-api',
    apply: 'serve' as const,
    configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/api/admin')) return next();
        void (async () => {
          try {
            await route(req, res);
          } catch (e) {
            if (e instanceof HttpError) return sendJson(res, e.status, { error: e.message });
            console.error('[devAdminApi]', e);
            sendJson(res, 500, { error: '服务器错误' });
          }
        })();
      });
    },
  };
}
