/** 按 order 字段升序排序的比较器（order 缺失或为 0 时视为 0） */
export const byOrder = <T extends { order?: number | null }>(a: T, b: T): number =>
  (a.order ?? 0) - (b.order ?? 0);
