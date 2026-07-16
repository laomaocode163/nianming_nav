<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { linkSchema } from '../../config/schema';
  import { nextLinkId } from '../../config/linkId';
  import type { Category, Link, SubCategory } from '../../types';
  import { Link as LinkIcon, ChevronRight } from 'lucide-vue-next';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();
  const props = defineProps<{ categoryFilter?: string }>();

  const showForm = ref(false);
  const editingId = ref<string | null>(null);
  const search = ref('');

  const sortedCategories = computed<Category[]>(() =>
    [...adminStore.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );

  interface LinkSubGroup {
    sub: SubCategory;
    links: Link[];
  }
  interface LinkCatGroup {
    cat: Category;
    directLinks: Link[];
    subs: LinkSubGroup[];
  }

  const matchLink = (l: Link, q: string): boolean => {
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      categoryNameOf(l.categoryId).toLowerCase().includes(q) ||
      subNameOf(l.categoryId, l.subCategoryId).toLowerCase().includes(q)
    );
  };

  const treeGroups = computed<LinkCatGroup[]>(() => {
    const q = search.value.trim().toLowerCase();
    const cats = props.categoryFilter
      ? sortedCategories.value.filter((c) => c.id === props.categoryFilter)
      : sortedCategories.value;
    return cats
      .map((cat) => {
        const catLinks = adminStore.links.filter((l) => l.categoryId === cat.id);
        const directLinks = catLinks.filter((l) => !l.subCategoryId).filter((l) => matchLink(l, q));
        const subs: LinkSubGroup[] = (cat.subCategories ?? [])
          .map((sub) => ({
            sub,
            links: catLinks
              .filter((l) => l.subCategoryId === sub.id)
              .filter((l) => matchLink(l, q)),
          }))
          .filter((g) => g.links.length > 0);
        return { cat, directLinks, subs };
      })
      .filter((g) => g.directLinks.length > 0 || g.subs.length > 0);
  });

  const totalMatched = computed(() =>
    treeGroups.value.reduce(
      (sum, g) => sum + g.directLinks.length + g.subs.reduce((s, sg) => s + sg.links.length, 0),
      0
    )
  );

  const expanded = reactive<Record<string, boolean>>({});

  const isExpanded = (key: string): boolean => {
    // 搜索时自动展开所有含命中项的节点
    return !!search.value.trim() || !!expanded[key];
  };

  const toggleExpand = (key: string): void => {
    if (search.value.trim()) return;
    expanded[key] = !expanded[key];
  };

  const subCount = (g: LinkCatGroup): number =>
    g.directLinks.length + g.subs.reduce((s, sg) => s + sg.links.length, 0);

  const emptyForm = () => ({
    id: '',
    name: '',
    url: '',
    categoryId: adminStore.categories[0]?.id ?? '',
    subCategoryId: '',
    description: '',
    pinned: false,
    hidden: false,
  });

  const form = reactive(emptyForm());

  // 新增时按当前所选分类自动建议的段位 id（用户可手动覆盖）
  let suggestedId = '';
  const computeSuggestedId = (): string =>
    nextLinkId(adminStore.links, form.categoryId, adminStore.categories);

  const subOptions = computed(() => {
    const cat = adminStore.categories.find((c) => c.id === form.categoryId);
    return cat?.subCategories ?? [];
  });

  const categoryNameOf = (id: string): string =>
    adminStore.categories.find((c) => c.id === id)?.name ?? id;

  const subNameOf = (categoryId: string, subId?: string): string => {
    if (!subId) return '—';
    const cat = adminStore.categories.find((c) => c.id === categoryId);
    return cat?.subCategories?.find((s) => s.id === subId)?.name ?? subId;
  };

  const openCreate = (): void => {
    Object.assign(form, emptyForm());
    suggestedId = computeSuggestedId();
    form.id = suggestedId;
    editingId.value = null;
    showForm.value = true;
  };

  const openCreateAt = (categoryId: string, subId?: string): void => {
    Object.assign(form, emptyForm());
    form.categoryId = categoryId;
    form.subCategoryId = subId ?? '';
    suggestedId = computeSuggestedId();
    form.id = suggestedId;
    editingId.value = null;
    showForm.value = true;
  };

  const openEdit = (link: Link): void => {
    Object.assign(form, {
      id: link.id,
      name: link.name,
      url: link.url,
      categoryId: link.categoryId,
      subCategoryId: link.subCategoryId ?? '',
      description: link.description ?? '',
      pinned: link.pinned ?? false,
      hidden: link.hidden ?? false,
    });
    suggestedId = '';
    editingId.value = link.id;
    showForm.value = true;
  };

  const closeForm = (): void => {
    showForm.value = false;
  };

  const onCategoryChange = (): void => {
    form.subCategoryId = '';
    // 若 id 仍是用之前分类自动建议的（用户未手改），则刷新为新分类的建议值
    if (!form.id.trim() || form.id === suggestedId) {
      suggestedId = computeSuggestedId();
      form.id = suggestedId;
    }
  };

  const isValidUrl = (url: string): boolean => /^https?:\/\/.+/i.test(url.trim());

  const save = async (): Promise<void> => {
    if (!editingId.value && !form.id.trim()) {
      form.id = computeSuggestedId();
    }
    const link: Link = {
      id: (editingId.value ?? form.id.trim()) as string,
      name: form.name.trim(),
      url: form.url.trim(),
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId || undefined,
      description: form.description.trim() || undefined,
      pinned: form.pinned,
      hidden: form.hidden,
    };
    if (!isValidUrl(link.url)) {
      showToast('请输入合法的 http(s) 链接');
      return;
    }
    const parsed = linkSchema.safeParse(link);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? '校验失败', 2500);
      return;
    }
    try {
      if (editingId.value) {
        await adminStore.updateLink(editingId.value, link);
        showToast('已更新链接');
      } else {
        await adminStore.createLink(link);
        showToast('已添加链接');
      }
      showForm.value = false;
      if (adminStore.autoFetchFavicons) {
        await adminStore.runFetchFavicons(false);
        showToast('已抓取 favicon');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 2500);
    }
  };

  const remove = async (link: Link): Promise<void> => {
    if (!window.confirm(`确定删除「${link.name}」？`)) return;
    try {
      await adminStore.deleteLink(link.id);
      showToast('已删除链接');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', 2500);
    }
  };

  const manualFetch = async (): Promise<void> => {
    try {
      await adminStore.runFetchFavicons(false);
      showToast('已抓取 favicon');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '抓取失败', 2500);
    }
  };
</script>

<template>
  <section>
    <div class="admin-toolbar">
      <button class="admin-btn admin-btn-primary" @click="openCreate">＋ 新增链接</button>
      <label class="admin-check admin-fetch-toggle">
        <input v-model="adminStore.autoFetchFavicons" type="checkbox" />
        保存后自动抓取 favicon
      </label>
      <button class="admin-btn admin-btn-ghost" @click="manualFetch">抓取全部 favicon</button>
      <input
        v-model="search"
        class="admin-search"
        type="search"
        placeholder="搜索名称 / URL / 分类…"
      />
      <span class="admin-count">共 {{ totalMatched }} 条</span>
    </div>

    <div v-if="adminStore.loading && adminStore.links.length === 0" class="admin-hint">加载中…</div>
    <div v-else-if="adminStore.links.length === 0" class="admin-hint">
      暂无链接，点击上方「新增链接」创建
    </div>
    <div v-else-if="treeGroups.length === 0" class="admin-hint">无匹配结果</div>

    <ul v-else class="admin-tree">
      <li v-for="g in treeGroups" :key="g.cat.id" class="admin-tree-node">
        <div class="admin-tree-row admin-tree-row--cat">
          <button
            class="admin-tree-toggle"
            :class="{ open: isExpanded('c:' + g.cat.id) }"
            :aria-label="isExpanded('c:' + g.cat.id) ? '收起' : '展开'"
            @click="toggleExpand('c:' + g.cat.id)"
          >
            <ChevronRight :size="14" :stroke-width="1.5" />
          </button>
          <span class="admin-tree-name">{{ g.cat.name }}</span>
          <span class="admin-chip">{{ subCount(g) }} 链接</span>
          <span class="admin-spacer"></span>
          <button class="admin-link-btn" @click="openCreateAt(g.cat.id)">＋链接</button>
        </div>

        <ul v-if="isExpanded('c:' + g.cat.id)" class="admin-tree-children">
          <li v-for="l in g.directLinks" :key="l.id" class="admin-tree-node">
            <div class="admin-tree-row admin-tree-row--link">
              <span class="admin-tree-icon admin-tree-icon--link">
                <LinkIcon :size="14" :stroke-width="1.5" />
              </span>
              <span class="admin-tree-name">{{ l.name }}</span>
              <span class="admin-tree-url">
                <a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.url }}</a>
              </span>
              <span v-if="l.pinned" class="admin-chip">置顶</span>
              <span v-if="l.hidden" class="admin-chip muted">隐藏</span>
              <span class="admin-spacer"></span>
              <button class="admin-link-btn" @click="openEdit(l)">编辑</button>
              <button class="admin-link-btn danger" @click="remove(l)">删除</button>
            </div>
          </li>

          <li v-for="sg in g.subs" :key="sg.sub.id" class="admin-tree-node">
            <div class="admin-tree-row admin-tree-row--sub">
              <button
                class="admin-tree-toggle"
                :class="{ open: isExpanded('s:' + g.cat.id + ':' + sg.sub.id) }"
                :aria-label="isExpanded('s:' + g.cat.id + ':' + sg.sub.id) ? '收起' : '展开'"
                @click="toggleExpand('s:' + g.cat.id + ':' + sg.sub.id)"
              >
                <ChevronRight :size="14" :stroke-width="1.5" />
              </button>
              <span class="admin-tree-name">{{ sg.sub.name }}</span>
              <span class="admin-chip">{{ sg.links.length }} 链接</span>
              <span class="admin-spacer"></span>
              <button class="admin-link-btn" @click="openCreateAt(g.cat.id, sg.sub.id)">
                ＋链接
              </button>
            </div>

            <ul v-if="isExpanded('s:' + g.cat.id + ':' + sg.sub.id)" class="admin-tree-children">
              <li v-for="l in sg.links" :key="l.id" class="admin-tree-node">
                <div class="admin-tree-row admin-tree-row--link">
                  <span class="admin-tree-icon admin-tree-icon--link">
                    <LinkIcon :size="14" :stroke-width="1.5" />
                  </span>
                  <span class="admin-tree-name">{{ l.name }}</span>
                  <span class="admin-tree-url">
                    <a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.url }}</a>
                  </span>
                  <span v-if="l.pinned" class="admin-chip">置顶</span>
                  <span v-if="l.hidden" class="admin-chip muted">隐藏</span>
                  <span class="admin-spacer"></span>
                  <button class="admin-link-btn" @click="openEdit(l)">编辑</button>
                  <button class="admin-link-btn danger" @click="remove(l)">删除</button>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>

    <div v-if="showForm" class="admin-modal-mask" @click.self="closeForm">
      <div class="admin-modal">
        <h3 class="admin-modal-title">
          <span class="admin-modal-icon">
            <LinkIcon :size="18" :stroke-width="1.5" />
          </span>
          {{ editingId ? '编辑链接' : '新增链接' }}
        </h3>
        <div class="admin-section">
          <p class="admin-section-title">基本信息</p>
          <div class="admin-field">
            <label class="admin-label">名称 *</label>
            <input v-model="form.name" class="admin-input" type="text" placeholder="如 GitHub" />
          </div>
          <div class="admin-field">
            <label class="admin-label">URL *</label>
            <input v-model="form.url" class="admin-input" type="text" placeholder="https://..." />
          </div>
          <div class="admin-field-row">
            <div class="admin-field">
              <label class="admin-label">分类 *</label>
              <select v-model="form.categoryId" class="admin-select" @change="onCategoryChange">
                <option v-for="c in adminStore.categories" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div class="admin-field">
              <label class="admin-label">二级分类</label>
              <select v-model="form.subCategoryId" class="admin-select">
                <option value="">（无）</option>
                <option v-for="s in subOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div class="admin-field">
            <label class="admin-label">描述</label>
            <input v-model="form.description" class="admin-input" type="text" placeholder="可选" />
          </div>
        </div>
        <div class="admin-section">
          <p class="admin-section-title">高级选项</p>
          <div class="admin-field-row">
            <label class="admin-check"><input v-model="form.pinned" type="checkbox" /> 置顶</label>
            <label class="admin-check"><input v-model="form.hidden" type="checkbox" /> 隐藏</label>
          </div>
        </div>
        <div class="admin-modal-actions">
          <button class="admin-btn admin-btn-ghost" @click="closeForm">取消</button>
          <button class="admin-btn admin-btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .admin-fetch-toggle {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }
</style>
