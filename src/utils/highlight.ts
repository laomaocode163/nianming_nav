/**
 * 搜索命中高亮工具
 * 返回带「是否命中」标记的文本片段，由模板用 <mark> 渲染，
 * 完全避免 v-html / XSS 风险，也无需手动转义 HTML。
 */

export interface HighlightPart {
  text: string;
  match: boolean;
}

export const highlightParts = (text: string, term: string): HighlightPart[] => {
  const safeTerm = term.trim();
  if (!safeTerm) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const lowerTerm = safeTerm.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const idx = lower.indexOf(lowerTerm, cursor);
    if (idx === -1) {
      parts.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (idx > cursor) {
      parts.push({ text: text.slice(cursor, idx), match: false });
    }
    parts.push({ text: text.slice(idx, idx + safeTerm.length), match: true });
    cursor = idx + safeTerm.length;
  }

  return parts;
};
