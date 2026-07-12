import { describe, it, expect } from 'vitest';
import { safeUrl } from '../../src/utils/url';

describe('safeUrl', () => {
  it('allows http and https URLs unchanged', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com');
    expect(safeUrl('http://example.com/path?q=1')).toBe('http://example.com/path?q=1');
  });

  it('trims surrounding whitespace before validating', () => {
    expect(safeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('blocks dangerous protocols', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(safeUrl('JAVASCRIPT:alert(1)')).toBe('#');
  });

  it('returns "#" for empty / nullish input', () => {
    expect(safeUrl('')).toBe('#');
    expect(safeUrl(undefined)).toBe('#');
    expect(safeUrl(null)).toBe('#');
  });
});
