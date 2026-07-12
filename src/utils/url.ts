/**
 * URL 协议白名单
 * 仅允许 http(s): 协议，拦截 javascript: / data: 等危险协议，防止通过站点链接
 * 或搜索引擎跳转触发 XSS。数据虽来自本地可信 JSON，仍统一经此函数兜底。
 */

export const safeUrl = (url: string | undefined | null): string => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return '#';
  return trimmed;
};
