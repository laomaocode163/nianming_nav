/**
 * 链接 id 的「按分类段位自增」规则（单一事实来源）。
 *
 * 每个分类独占一个 1000 宽的数值区间（段位），段内从 base+1 起自增：
 *   ai=1000, dev=2000, frontend-dev=3000, backend-dev=4000, interview=5000,
 *   design=6000, read=7000, ent=8000, software=9000
 * 每个分类最多容纳 999 条链接，足够个人导航站长期使用。
 *
 * 维护约定（务必与 scripts/renumber-links.mjs、
 * .codebuddy/skills/add-nav-site/scripts/next_link_id.mjs 保持一致）：
 * - 新增分类时，在 CATEGORY_ID_RANGES 末尾追加「当前最大 base + 1000」，
 *   不要改动已有 base，否则已存在链接的 id 段位会错位。
 * - 不要对已有区间重新排序。
 */
import type { Category, Link } from './schema';

export const CATEGORY_ID_RANGE_SIZE = 1000;

export const CATEGORY_ID_RANGES: Record<string, number> = {
  ai: 1000,
  dev: 2000,
  'frontend-dev': 3000,
  'backend-dev': 4000,
  interview: 5000,
  design: 6000,
  read: 7000,
  ent: 8000,
  software: 9000,
};

/** 返回某分类的段位基数；固定表外或未知分类按其当前顺序兜底，避免冲突。 */
export const categoryBase = (categoryId: string | undefined, categories: Category[]): number => {
  if (categoryId && Object.prototype.hasOwnProperty.call(CATEGORY_ID_RANGES, categoryId)) {
    return CATEGORY_ID_RANGES[categoryId];
  }
  const idx = categories.findIndex((c) => c.id === categoryId);
  if (idx >= 0) return (idx + 1) * CATEGORY_ID_RANGE_SIZE;
  return (categories.length + 1) * CATEGORY_ID_RANGE_SIZE;
};

/**
 * 计算下一个不冲突的链接 id（字符串）。
 * 优先落在目标分类的段位 [base+1, base+999] 内、取该段位已有最大 id + 1；
 * 段位为空则从 base+1 起；段位首选值意外被占用时退回全局最大 id + 1。
 */
export const nextLinkId = (
  links: Link[],
  categoryId: string | undefined,
  categories: Category[]
): string => {
  const base = categoryBase(categoryId, categories);
  const lo = base + 1;
  const hi = base + CATEGORY_ID_RANGE_SIZE - 1;
  let maxInSegment = 0;
  let globalMax = 0;
  for (const l of links) {
    const n = Number(l.id);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (n > globalMax) globalMax = n;
    if (n >= lo && n <= hi && n > maxInSegment) maxInSegment = n;
  }
  const used = new Set(links.map((l) => l.id));
  const candidate = maxInSegment > 0 ? maxInSegment + 1 : lo;
  if (!used.has(String(candidate))) return String(candidate);
  return String(globalMax + 1);
};
