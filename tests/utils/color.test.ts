import { describe, it, expect } from 'vitest';
import { hexToRgbString, rgbStringToHex } from '../../src/utils/color';

describe('rgbStringToHex', () => {
  it('converts "R G B" to #RRGGBB', () => {
    expect(rgbStringToHex('14 165 233')).toBe('#0EA5E9');
    expect(rgbStringToHex('0 0 0')).toBe('#000000');
    expect(rgbStringToHex('255 255 255')).toBe('#FFFFFF');
  });

  it('falls back to default for invalid input', () => {
    expect(rgbStringToHex('')).toBe('#0EA5E9');
    expect(rgbStringToHex('1 2')).toBe('#0EA5E9');
    expect(rgbStringToHex('999 0 0')).toBe('#0EA5E9');
  });
});

describe('hexToRgbString', () => {
  it('converts #RRGGBB to "R G B"', () => {
    expect(hexToRgbString('#0EA5E9')).toBe('14 165 233');
    expect(hexToRgbString('#000000')).toBe('0 0 0');
    expect(hexToRgbString('FFFFFF')).toBe('255 255 255');
  });

  it('falls back for invalid input', () => {
    expect(hexToRgbString('nope')).toBe('14 165 233');
  });
});

describe('round-trip', () => {
  it('hex -> rgb -> hex is stable', () => {
    const hex = '#6366F1';
    expect(rgbStringToHex(hexToRgbString(hex))).toBe(hex.toUpperCase());
  });
});
