import { describe, it, expect } from 'vitest';
import { highlightParts } from '../../src/utils/highlight';

describe('highlightParts', () => {
  it('returns a single non-match part when no term', () => {
    expect(highlightParts('<b>x', '')).toEqual([{ text: '<b>x', match: false }]);
  });

  it('marks the matched substring case-insensitively', () => {
    const parts = highlightParts('GitHub Copilot', 'git');
    expect(parts).toEqual([
      { text: 'Git', match: true },
      { text: 'Hub Copilot', match: false },
    ]);
  });

  it('highlights multiple occurrences', () => {
    const parts = highlightParts('react reactjs', 'react');
    expect(parts).toEqual([
      { text: 'react', match: true },
      { text: ' ', match: false },
      { text: 'react', match: true },
      { text: 'js', match: false },
    ]);
  });

  it('keeps raw HTML in text (no escaping needed, safe to render as text/mark)', () => {
    const parts = highlightParts('<img src=x>', 'img');
    expect(parts).toEqual([
      { text: '<', match: false },
      { text: 'img', match: true },
      { text: ' src=x>', match: false },
    ]);
  });

  it('handles regex-special characters in the term', () => {
    expect(highlightParts('a.b.c', '.')).toEqual([
      { text: 'a', match: false },
      { text: '.', match: true },
      { text: 'b', match: false },
      { text: '.', match: true },
      { text: 'c', match: false },
    ]);
  });
});
