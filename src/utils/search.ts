import type { Link } from '@/types';

/**
 * 判断链接是否匹配站内搜索词（名称 / 描述 / URL，大小写不敏感）。
 * 空词视为匹配全部，便于在统一入口处直接调用。
 */
export const matchesLinkQuery = (link: Link, q: string): boolean => {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  return (
    link.name.toLowerCase().includes(term) ||
    (!!link.description && link.description.toLowerCase().includes(term)) ||
    link.url.toLowerCase().includes(term)
  );
};

/** 按搜索词过滤链接列表；空词原样返回（不过滤） */
export const filterLinksByQuery = (links: Link[], q: string): Link[] =>
  q.trim() ? links.filter((l) => matchesLinkQuery(l, q)) : links;
