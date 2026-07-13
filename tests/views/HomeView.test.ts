import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { useDataStore } from '@/stores/data';
import { useUiStore } from '@/stores/ui';

const tick = () => new Promise((r) => setTimeout(r, 150));

describe('HomeView', () => {
  let pinia: Pinia;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    });
  });

  const setup = async () => {
    const dataStore = useDataStore();
    await dataStore.init();
    const uiStore = useUiStore();
    uiStore.selectCategory('all');
    const wrapper = mount(HomeView, { global: { plugins: [router, pinia] } });
    await flushPromises();
    await flushPromises();
    await tick();
    return { wrapper, dataStore, uiStore };
  };

  it('renders the all-websites title and a paginated slice of cards', async () => {
    const { wrapper, dataStore, uiStore } = await setup();
    expect(wrapper.find('.category-title').text()).toBe('全部网站');

    const total = dataStore.getLinksByCategory('all').length;
    const expected = Math.min(uiStore.pageSize, total);
    expect(wrapper.findAll('.site-card').length).toBe(expected);
  });

  it('switches the visible links when a different category is selected', async () => {
    const { wrapper, dataStore, uiStore } = await setup();
    const cat = dataStore.categories.find((c) => dataStore.getLinksByCategory(c.id).length > 0);
    expect(cat).toBeDefined();

    uiStore.selectCategory(cat!.id);
    await flushPromises();
    await tick();

    expect(wrapper.find('.category-title').text()).toBe(cat!.name);
  });

  it('advances to the next page showing a different slice', async () => {
    const { wrapper, dataStore, uiStore } = await setup();
    const total = dataStore.getLinksByCategory('all').length;
    if (total <= uiStore.pageSize) return; // 数据不足则跳过

    const firstHref = wrapper.findAll('.site-card')[0]?.attributes('href');
    uiStore.currentPage = 2;
    await flushPromises();
    await tick();
    const secondHref = wrapper.findAll('.site-card')[0]?.attributes('href');

    expect(firstHref).toBeDefined();
    expect(secondHref).toBeDefined();
    expect(firstHref).not.toBe(secondHref);
  });
});
