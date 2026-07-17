/**
 * 颜色工具：settings.json 的 accentColor 以「R G B」空格分隔字符串存储
 * （如 "14 165 233"），而原生 <input type="color"> 使用 #RRGGBB。
 * 提供两者互转的纯函数，便于后台主题色设置与单测。
 */

/** 将 "R G B" 字符串转为 "#RRGGBB"；非法输入回退默认天蓝 */
export const rgbStringToHex = (rgb: string | undefined): string => {
  const parts = (rgb ?? '').trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return '#0EA5E9';
  }
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`.toUpperCase();
};

/** 将 "#RRGGBB" 转为 "R G B" 空格分隔字符串 */
export const hexToRgbString = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '14 165 233';
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r} ${g} ${b}`;
};

/** 常用主色预设（hex），供后台色板快速选择 */
export const ACCENT_PRESETS: string[] = [
  '#0EA5E9', // 天蓝（默认）
  '#6366F1', // 靛紫
  '#8B5CF6', // 紫
  '#EC4899', // 粉
  '#EF4444', // 红
  '#F59E0B', // 琥珀
  '#10B981', // 翠绿
  '#14B8A6', // 青
  '#0F172A', // 石墨
];
