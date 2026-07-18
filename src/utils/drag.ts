/**
 * 列表拖拽重排的纯函数：将 fromId 从 id 序列中移除并插入到 targetId 之前。
 * 返回新数组（不修改入参）。若 fromId/targetId 无效或二者相同，返回原序列副本。
 * 统一 AdminLinks 与 CategoryTree 中「过滤 → 找索引 → splice」的重复逻辑。
 */
export const reorderById = (ids: string[], fromId: string, targetId: string): string[] => {
  if (!fromId || fromId === targetId) return [...ids];
  const next = ids.filter((id) => id !== fromId);
  const idx = next.indexOf(targetId);
  if (idx < 0) return [...ids];
  next.splice(idx, 0, fromId);
  return next;
};
