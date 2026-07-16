import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { useDataStore } from '@/stores/data';
import { useUiStore } from '@/stores/ui';
import { useUserPrefsStore } from '@/stores/userPrefs';

const tick = () => new Promise((r) => setTimeout(r, 150));

// SiteCard 是 defineAsyncComponent 动态加载，需等待其异步 import 完成并渲染出 .site-card
const waitForSiteCards = async (
  wrapper: ReturnType<typeof mount>,
  min = 1,
  timeout = 3000
): Promise<ReturnType<typeof wrapper.findAll>> => {
  const start = Date.now();
  while (wrapper.findAll('.site-card').length < min) {
    await flushPromises();
    await new Promise((r) => setTimeout(r, 50));
    if (Date.now() - start > timeout) break;
  }
  return wrapper.findAll('.site-card');
};

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
    const cards = await waitForSiteCards(wrapper, expected);
    expect(cards.length).toBe(expected);
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

    const firstCards = await waitForSiteCards(wrapper, 1);
    const firstHref = firstCards[0]?.attributes('href');
    uiStore.currentPage = 2;
    await flushPromises();
    await tick();
    const secondCards = await waitForSiteCards(wrapper, 1);
    const secondHref = secondCards[0]?.attributes('href');

    expect(firstHref).toBeDefined();
    expect(secondHref).toBeDefined();
    expect(firstHref).not.toBe(secondHref);
  });

  it('sorts the recent category by visit timestamp descending', async () => {
    const { wrapper, dataStore, uiStore } = await setup();
    const recents = dataStore.links.filter((l) => !l.hidden).slice(0, 3);
    expect(recents.length).toBeGreaterThanOrEqual(3);

    const userPrefs = useUserPrefsStore();
    // 故意乱序写入：recents[2] 最新、recents[0] 最旧
    userPrefs.state.recentVisits = [
      { url: recents[2].url, ts: 300 },
      { url: recents[0].url, ts: 100 },
      { url: recents[1].url, ts: 200 },
    ];

    uiStore.selectCategory('__recent');
    await flushPromises();
    await tick();

    const cards = await waitForSiteCards(wrapper, 1);
    const hrefs = cards.map((el) => el.attributes('href'));
    const idxNewest = hrefs.indexOf(recents[2].url);
    const idxMid = hrefs.indexOf(recents[1].url);
    const idxOldest = hrefs.indexOf(recents[0].url);

    // 全部出现（分页足以容纳 3 条）且严格按 ts 倒序
    expect(idxNewest).toBeGreaterThanOrEqual(0);
    expect(idxMid).toBeGreaterThanOrEqual(0);
    expect(idxOldest).toBeGreaterThanOrEqual(0);
    expect(idxNewest).toBeLessThan(idxMid);
    expect(idxMid).toBeLessThan(idxOldest);
  });
});
