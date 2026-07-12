/**
 * 本地开发期管理后台 API（仅 dev server 注册，生产构建不含）。
 * 提供 categories / links / subcategories 的 CRUD，以及触发 favicon 抓取。
 * 校验复用 src/config/schema 的 Zod schema 与 loadConfig 的 validateReferentialIntegrity，
 * 保证与运行时一致、无逻辑漂移。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ZodError } from 'zod';
import {
  categorySchema,
  linkSchema,
  subCategorySchema,
  type Category,
  type Link,
  type SubCategory,
} from '../src/config/schema';
import { validateReferentialIntegrity } from '../src/config/loadConfig';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const CATEGORIES_PATH = resolve(ROOT, 'src/config/data/categories.json');
const LINKS_PATH = resolve(ROOT, 'src/config/data/links.json');
const FAVICONS_SCRIPT = resolve(ROOT, 'scripts/fetch-favicons.mjs');

const readJson = async <T>(p: string): Promise<T> => JSON.parse(await readFile(p, 'utf8')) as T;
const repValue = (v: unknown, indent: string): string => {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[ ]';
    const child = indent + '  ';
    const items = v.map((it) => child + repValue(it, child)).join(',\n');
    return `[\n${items}\n${indent}]`;
  }
  if (v && typeof v === 'object') {
    return repObj(v as Record<string, unknown>, indent);
  }
  return JSON.stringify(v);
};

const repObj = (obj: Record<string, unknown>, indent: string): string => {
  const inner = indent + '  ';
  const parts = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${repValue(v, inner)}`);
  return `{ ${parts.join(', ')} }`;
};

// 序列化时复刻仓库既有 JSON 风格（顶层 2 空格缩进、对象单行紧凑、
// 对象数组多行），从而整文件重写也只产生最小 diff。
const repoStringify = (data: unknown): string => {
  if (Array.isArray(data)) {
    if (data.length === 0) return '[ ]';
    const items = data.map((it) => '  ' + repValue(it, '  ')).join(',\n');
    return `[\n${items}\n]`;
  }
  return repObj(data as Record<string, unknown>, '');
};

const writeJson = async (p: string, data: unknown): Promise<void> => {
  await writeFile(p, repoStringify(data) + '\n', 'utf8');
};

const flattenSubs = (
  categories: Category[]
): Array<SubCategory & { categoryId: string; categoryName: string }> =>
  categories.flatMap((c) =>
    (c.subCategories ?? []).map((s) => ({ categoryId: c.id, categoryName: c.name, ...s }))
  );

const nextLinkId = (links: Link[]): string => {
  let max = 0;
  for (const l of links) {
    const n = Number(l.id);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return String(max + 1);
};

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

const readBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data) as Record<string, unknown>);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });

const runFetchFavicons = (force: boolean): Promise<{ ok: boolean; code: number; output: string }> =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [FAVICONS_SCRIPT, ...(force ? ['--force'] : [])], {
      cwd: ROOT,
    });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('error', (err) => resolve({ ok: false, code: -1, output: String(err) }));
    child.on('close', (code) => resolve({ ok: code === 0, code: code ?? -1, output }));
  });

type Body = Record<string, unknown>;

const asObject = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const isLocalRequest = (req: IncomingMessage): boolean => {
  const addr = req.socket.remoteAddress ?? '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
};

const route = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const path = url.pathname;
  const method = req.method ?? 'GET';

  // 仅允许本地访问写操作（dev server 默认即本地）
  if (method !== 'GET' && !isLocalRequest(req)) {
    return sendJson(res, 403, { error: '仅允许本地访问管理接口' });
  }

  if (method === 'GET' && path === '/api/admin/categories') {
    return sendJson(res, 200, await readJson<Category[]>(CATEGORIES_PATH));
  }
  if (method === 'GET' && path === '/api/admin/links') {
    return sendJson(res, 200, await readJson<Link[]>(LINKS_PATH));
  }
  if (method === 'GET' && path === '/api/admin/subcategories') {
    return sendJson(res, 200, flattenSubs(await readJson<Category[]>(CATEGORIES_PATH)));
  }

  // categories
  if (path === '/api/admin/categories' && method === 'POST') {
    const body = (await readBody(req)) as Category;
    const cat = categorySchema.parse(body);
    const categories = await readJson<Category[]>(CATEGORIES_PATH);
    if (categories.some((c) => c.id === cat.id)) {
      throw new HttpError(409, `分类 ID「${cat.id}」已存在`);
    }
    categories.push(cat);
    await writeJson(CATEGORIES_PATH, categories);
    return sendJson(res, 201, cat);
  }
  {
    const m = path.match(/^\/api\/admin\/categories\/([^/]+)$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      if (method === 'PUT') {
        const body = (await readBody(req)) as Category;
        const updated = categorySchema.parse({ ...body, id });
        const categories = await readJson<Category[]>(CATEGORIES_PATH);
        const idx = categories.findIndex((c) => c.id === id);
        if (idx < 0) throw new HttpError(404, '分类不存在');
        categories[idx] = updated;
        const links = await readJson<Link[]>(LINKS_PATH);
        validateReferentialIntegrity(categories, links);
        await writeJson(CATEGORIES_PATH, categories);
        return sendJson(res, 200, updated);
      }
      if (method === 'DELETE') {
        const categories = await readJson<Category[]>(CATEGORIES_PATH);
        const cat = categories.find((c) => c.id === id);
        if (!cat) throw new HttpError(404, '分类不存在');
        const links = await readJson<Link[]>(LINKS_PATH);
        const subIds = new Set((cat.subCategories ?? []).map((s) => s.id));
        if (
          links.some((l) => l.categoryId === id || (l.subCategoryId && subIds.has(l.subCategoryId)))
        ) {
          throw new HttpError(400, '该分类下仍有链接，请先迁移或删除这些链接');
        }
        await writeJson(
          CATEGORIES_PATH,
          categories.filter((c) => c.id !== id)
        );
        return sendJson(res, 200, { ok: true });
      }
    }
  }

  // links
  if (path === '/api/admin/links' && method === 'POST') {
    const links = await readJson<Link[]>(LINKS_PATH);
    const body = (await readBody(req)) as Link;
    const next: Link = body.id ? body : { ...body, id: nextLinkId(links) };
    const link = linkSchema.parse(next);
    if (links.some((l) => l.id === link.id)) {
      throw new HttpError(409, `链接 ID「${link.id}」已存在`);
    }
    links.push(link);
    const categories = await readJson<Category[]>(CATEGORIES_PATH);
    validateReferentialIntegrity(categories, links);
    await writeJson(LINKS_PATH, links);
    return sendJson(res, 201, link);
  }
  {
    const m = path.match(/^\/api\/admin\/links\/([^/]+)$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      if (method === 'PUT') {
        const body = (await readBody(req)) as Link;
        const updated = linkSchema.parse({ ...body, id });
        const links = await readJson<Link[]>(LINKS_PATH);
        const idx = links.findIndex((l) => l.id === id);
        if (idx < 0) throw new HttpError(404, '链接不存在');
        links[idx] = updated;
        const categories = await readJson<Category[]>(CATEGORIES_PATH);
        validateReferentialIntegrity(categories, links);
        await writeJson(LINKS_PATH, links);
        return sendJson(res, 200, updated);
      }
      if (method === 'DELETE') {
        const links = await readJson<Link[]>(LINKS_PATH);
        if (!links.some((l) => l.id === id)) throw new HttpError(404, '链接不存在');
        await writeJson(
          LINKS_PATH,
          links.filter((l) => l.id !== id)
        );
        return sendJson(res, 200, { ok: true });
      }
    }
  }

  // subcategories（独立管理；数据仍存于 category.subCategories）
  if (path === '/api/admin/subcategories' && method === 'POST') {
    const raw = (await readBody(req)) as Body;
    const categoryId = String(raw.categoryId ?? '');
    if (!categoryId) throw new HttpError(400, '缺少 categoryId');
    const sub = subCategorySchema.parse(asObject(raw.subCategory ?? raw));
    const categories = await readJson<Category[]>(CATEGORIES_PATH);
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) throw new HttpError(404, '父分类不存在');
    cat.subCategories = cat.subCategories ?? [];
    if (cat.subCategories.some((s) => s.id === sub.id)) {
      throw new HttpError(409, `二级分类 ID「${sub.id}」已存在`);
    }
    cat.subCategories.push(sub);
    await writeJson(CATEGORIES_PATH, categories);
    return sendJson(res, 201, { categoryId, ...sub });
  }
  {
    const m = path.match(/^\/api\/admin\/subcategories\/([^/]+)\/([^/]+)$/);
    if (m) {
      const categoryId = decodeURIComponent(m[1]);
      const subId = decodeURIComponent(m[2]);
      if (method === 'PUT') {
        const raw = (await readBody(req)) as Body;
        const updated = subCategorySchema.parse({ ...asObject(raw.subCategory ?? raw), id: subId });
        const categories = await readJson<Category[]>(CATEGORIES_PATH);
        const cat = categories.find((c) => c.id === categoryId);
        if (!cat) throw new HttpError(404, '父分类不存在');
        const idx = (cat.subCategories ?? []).findIndex((s) => s.id === subId);
        if (idx < 0) throw new HttpError(404, '二级分类不存在');
        cat.subCategories = cat.subCategories ?? [];
        cat.subCategories[idx] = updated;
        await writeJson(CATEGORIES_PATH, categories);
        return sendJson(res, 200, { categoryId, ...updated });
      }
      if (method === 'DELETE') {
        const categories = await readJson<Category[]>(CATEGORIES_PATH);
        const cat = categories.find((c) => c.id === categoryId);
        if (!cat) throw new HttpError(404, '父分类不存在');
        if (!(cat.subCategories ?? []).some((s) => s.id === subId)) {
          throw new HttpError(404, '二级分类不存在');
        }
        const links = await readJson<Link[]>(LINKS_PATH);
        if (links.some((l) => l.categoryId === categoryId && l.subCategoryId === subId)) {
          throw new HttpError(400, '该二级分类下仍有链接，请先迁移或删除');
        }
        cat.subCategories = (cat.subCategories ?? []).filter((s) => s.id !== subId);
        await writeJson(CATEGORIES_PATH, categories);
        return sendJson(res, 200, { ok: true });
      }
    }
  }

  // fetch-favicons
  if (path === '/api/admin/fetch-favicons' && method === 'POST') {
    const raw = (await readBody(req)) as Body;
    const force = Boolean(raw.force);
    return sendJson(res, 200, await runFetchFavicons(force));
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
            if (e instanceof ZodError) {
              const detail = e.issues
                .map((i) => `${i.path.join('.') || '(root)'} ${i.message}`)
                .join('; ');
              return sendJson(res, 400, { error: `校验失败：${detail}` });
            }
            console.error('[devAdminApi]', e);
            sendJson(res, 500, { error: '服务器错误' });
          }
        })();
      });
    },
  };
}
