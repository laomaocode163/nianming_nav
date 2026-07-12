import { describe, it, expect, afterEach } from 'vitest';
import { useResponsive } from '../../src/hooks/useResponsive';

const setInnerWidth = (w: number): void => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: w });
};

describe('useResponsive', () => {
  afterEach(() => {
    setInnerWidth(1024);
    window.dispatchEvent(new Event('resize'));
  });

  const tick = () => new Promise((r) => setTimeout(r, 20));

  it('treats >= md (768) as not mobile', async () => {
    setInnerWidth(1024);
    window.dispatchEvent(new Event('resize'));
    await tick();
    const { isMobile, windowWidth } = useResponsive();
    expect(isMobile.value).toBe(false);
    expect(windowWidth.value).toBe(1024);
  });

  it('treats < md as mobile', async () => {
    setInnerWidth(500);
    window.dispatchEvent(new Event('resize'));
    await tick();
    const { isMobile } = useResponsive();
    expect(isMobile.value).toBe(true);
  });
});
