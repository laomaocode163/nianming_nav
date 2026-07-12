import { describe, it, expect, afterEach, vi } from 'vitest';
import { useResponsive, destroyResponsive } from '../../src/hooks/useResponsive';

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

  it('registers a single resize listener and cleans up via destroyResponsive', () => {
    // 重置模块级状态：前序用例已注册监听且未卸载，refCount > 0 时不会再次 addEventListener
    destroyResponsive();
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    useResponsive();
    useResponsive();
    useResponsive();
    const addCount = addSpy.mock.calls.filter((c) => c[0] === 'resize').length;
    expect(addCount).toBe(1);
    destroyResponsive();
    const removeCount = removeSpy.mock.calls.filter((c) => c[0] === 'resize').length;
    expect(removeCount).toBe(1);
    addSpy.mockRestore();
    removeSpy.mockRestore();
    // 重新注册，保证后续用例仍可响应 resize
    useResponsive();
  });
});
