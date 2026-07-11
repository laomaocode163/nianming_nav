import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ScrollToTop from '../../src/components/ui/ScrollToTop.vue';

describe('ScrollToTop', () => {
  it('binds to the provided scroll container, not window', async () => {
    const container = {
      scrollTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
    };

    const wrapper = mount(ScrollToTop, {
      props: { target: () => container as unknown as HTMLElement },
    });

    // 初始隐藏
    expect((wrapper.vm as unknown as { visible: boolean }).visible).toBe(false);

    // 容器内滚动超过阈值 -> 显示
    container.scrollTop = 500;
    const scrollHandler = container.addEventListener.mock.calls.find((c) => c[0] === 'scroll')?.[1];
    expect(scrollHandler).toBeTypeOf('function');
    scrollHandler();
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as { visible: boolean }).visible).toBe(true);

    // 滚回顶部 -> 隐藏
    container.scrollTop = 0;
    scrollHandler();
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as { visible: boolean }).visible).toBe(false);
  });

  it('scrollToTop scrolls the provided container to top', async () => {
    const container = {
      scrollTop: 800,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
    };
    const wrapper = mount(ScrollToTop, {
      props: { target: () => container as unknown as HTMLElement },
    });
    const vm = wrapper.vm as unknown as { scrollToTop: () => void };
    vm.scrollToTop();
    expect(container.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
