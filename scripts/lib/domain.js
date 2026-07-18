/**
 * 共享的域名提取工具（供 Node ESM 脚本复用，避免与 src/services/faviconService.ts
 * 中的 extractDomain 出现两份副本漂移）。
 */
export const extractDomain = (url) => {
  try {
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname;
  } catch {
    return '';
  }
};
