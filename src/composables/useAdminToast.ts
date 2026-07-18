import { showToast } from './useToast';

/**
 * 统一的后台操作错误处理：从 unknown 错误中提取 message 展示 toast，
 * 收敛各 admin 组件中重复的 `showToast(e instanceof Error ? e.message : '...', 2500)` 模式。
 * @param e 捕获到的错误
 * @param fallback 非 Error 类型时的兜底文案（保留原有上下文语义，如「删除失败」）
 */
export const handleAdminError = (e: unknown, fallback = '操作失败'): void => {
  showToast(e instanceof Error ? e.message : fallback, 2500);
};
