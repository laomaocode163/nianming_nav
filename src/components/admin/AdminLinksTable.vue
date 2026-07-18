<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { handleAdminError } from '../../composables/useAdminToast';
  import { byOrder } from '@/utils/sort';
  import { nextLinkId } from '../../config/linkId';
  import { linkSchema } from '../../config/schema';
  import type { Link, SubCategory } from '../../types';
  import {
    Plus,
    Search,
    Pencil,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Link2,
  } from 'lucide-vue-next';
  import AdminModal from './ui/AdminModal.vue';
  import AdminBadge from './ui/AdminBadge.vue';
  import AdminEmpty from './ui/AdminEmpty.vue';
  import AdminSkeleton from './ui/AdminSkeleton.vue';
  import AdminPagination from './ui/AdminPagination.vue';

  const adminStore = useAdminStore();
  const route = useRoute();

  const search = ref(typeof route.query.q === 'string' ? route.query.q : '');
  const categoryFilter = ref('');
  const sortKey = ref<'name' | 'category' | null>(null);
  const sortDir = ref<'asc' | 'desc'>('asc');
  const page = ref(1);
  const pageSize = ref(10);
  const selected = ref<string[]>([]);

  watch(
    () => route.query.q,
    (q) => {
      if (typeof q === 'string') search.value = q;
    }
  );

  const catName = (id: string): string =>
    adminStore.categories.find((c) => c.id === id)?.name ?? id;
  const subName = (categoryId: string, subId?: string): string => {
    if (!subId) return '—';
    return (
      adminStore.categories
        .find((c) => c.id === categoryId)
        ?.subCategories?.find((s) => s.id === subId)?.name ?? subId
    );
  };
  const mono = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';

  const filtered = computed<Link[]>(() => {
    const q = search.value.trim().toLowerCase();
    let list = adminStore.links.filter((l) => {
      if (categoryFilter.value && l.categoryId !== categoryFilter.value) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        catName(l.categoryId).toLowerCase().includes(q) ||
        subName(l.categoryId, l.subCategoryId).toLowerCase().includes(q)
      );
    });
    if (sortKey.value) {
      const dir = sortDir.value === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const av = sortKey.value === 'name' ? a.name : catName(a.categoryId);
        const bv = sortKey.value === 'name' ? b.name : catName(b.categoryId);
        return av.localeCompare(bv, 'zh') * dir;
      });
    }
    return list;
  });

  const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
  const paged = computed<Link[]>(() => {
    const start = (page.value - 1) * pageSize.value;
    return filtered.value.slice(start, start + pageSize.value);
  });

  watch([filtered, pageSize], () => {
    if (page.value > totalPages.value) page.value = totalPages.value;
  });
  watch([search, categoryFilter], () => {
    page.value = 1;
    selected.value = [];
  });

  const toggleSort = (key: 'name' | 'category'): void => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey.value = key;
      sortDir.value = 'asc';
    }
  };

  const allOnPageSelected = computed(
    () => paged.value.length > 0 && paged.value.every((l) => selected.value.includes(l.id))
  );
  const toggleAll = (): void => {
    if (allOnPageSelected.value) {
      selected.value = selected.value.filter((id) => !paged.value.some((l) => l.id === id));
    } else {
      selected.value = [...new Set([...selected.value, ...paged.value.map((l) => l.id)])];
    }
  };
  const toggleOne = (id: string): void => {
    selected.value = selected.value.includes(id)
      ? selected.value.filter((x) => x !== id)
      : [...selected.value, id];
  };

  const bulkDelete = async (): Promise<void> => {
    if (selected.value.length === 0) return;
    if (!window.confirm(`确定删除选中的 ${selected.value.length} 条链接？`)) return;
    try {
      for (const id of selected.value) await adminStore.deleteLink(id);
      showToast(`已删除 ${selected.value.length} 条链接`);
      selected.value = [];
    } catch (e) {
      handleAdminError(e, '批量删除失败');
    }
  };

  /* ---------- 表单 ---------- */
  const showForm = ref(false);
  const editingId = ref<string | null>(null);
  const form = reactive({
    id: '',
    name: '',
    url: '',
    categoryId: '',
    subCategoryId: '',
    description: '',
    pinned: false,
    hidden: false,
  });

  const subOptions = computed<SubCategory[]>(() => {
    const cat = adminStore.categories.find((c) => c.id === form.categoryId);
    return cat?.subCategories ?? [];
  });

  let suggestedId = '';
  const computeSuggestedId = (): string =>
    nextLinkId(adminStore.links, form.categoryId, adminStore.categories);

  const openCreate = (): void => {
    Object.assign(form, {
      id: '',
      name: '',
      url: '',
      categoryId: adminStore.categories[0]?.id ?? '',
      subCategoryId: '',
      description: '',
      pinned: false,
      hidden: false,
    });
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

  const onCategoryChange = (): void => {
    form.subCategoryId = '';
    if (!form.id.trim() || form.id === suggestedId) {
      suggestedId = computeSuggestedId();
      form.id = suggestedId;
    }
  };

  const isValidUrl = (url: string): boolean => /^https?:\/\/.+/i.test(url.trim());

  const save = async (): Promise<void> => {
    if (!editingId.value && !form.id.trim()) form.id = computeSuggestedId();
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
      handleAdminError(e);
    }
  };

  const remove = async (link: Link): Promise<void> => {
    if (!window.confirm(`确定删除「${link.name}」？`)) return;
    try {
      await adminStore.deleteLink(link.id);
      showToast('已删除链接');
      selected.value = selected.value.filter((id) => id !== link.id);
    } catch (e) {
      handleAdminError(e, '删除失败');
    }
  };

  const loading = computed(() => adminStore.loading && adminStore.links.length === 0);

  onMounted(() => {
    if (!adminStore.links.length && !adminStore.loading) adminStore.loadAll();
  });
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">链接管理</h1>
        <p class="adm-page__subtitle">管理站点全部导航链接，支持筛选、排序与批量操作</p>
      </div>
    </div>

    <div class="adm-toolbar">
      <div class="adm-search" style="min-width: 220px; flex: 0 1 280px">
        <Search :size="16" :stroke-width="1.6" class="adm-search__icon" />
        <input
          v-model="search"
          type="search"
          class="adm-search__input"
          placeholder="搜索名称 / URL / 分类…"
        />
      </div>
      <select v-model="categoryFilter" class="admin-select" style="width: auto; min-width: 140px">
        <option value="">全部分类</option>
        <option v-for="c in [...adminStore.categories].sort(byOrder)" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
      <span class="adm-toolbar__spacer"></span>
      <button class="admin-btn admin-btn-primary" @click="openCreate">
        <Plus :size="16" :stroke-width="1.6" /> 新增链接
      </button>
    </div>

    <div v-if="selected.length" class="adm-bulkbar">
      <span
        >已选择 <span class="adm-bulkbar__count">{{ selected.length }}</span> 项</span
      >
      <span class="adm-toolbar__spacer"></span>
      <button class="admin-btn admin-btn-ghost" @click="selected = []">取消选择</button>
      <button
        class="admin-btn admin-btn-primary"
        style="background: var(--gradient-danger); border: none"
        @click="bulkDelete"
      >
        <Trash2 :size="16" :stroke-width="1.6" /> 批量删除
      </button>
    </div>

    <div v-if="loading" class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th class="adm-check-cell"></th>
            <th>名称</th>
            <th>分类</th>
            <th>二级分类</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in pageSize" :key="i">
            <td class="adm-check-cell">
              <AdminSkeleton variant="circle" width="17px" height="17px" />
            </td>
            <td><AdminSkeleton width="70%" /></td>
            <td><AdminSkeleton width="60%" /></td>
            <td><AdminSkeleton width="60%" /></td>
            <td><AdminSkeleton width="40%" /></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminEmpty
      v-else-if="filtered.length === 0"
      :icon="Link2"
      :title="search || categoryFilter ? '无匹配链接' : '暂无链接'"
      :description="
        search || categoryFilter ? '试试调整搜索或筛选条件' : '点击右上角「新增链接」创建第一条'
      "
    >
      <template #action>
        <button class="admin-btn admin-btn-primary" @click="openCreate">
          <Plus :size="16" :stroke-width="1.6" /> 新增链接
        </button>
      </template>
    </AdminEmpty>

    <template v-else>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th class="adm-check-cell">
                <input
                  type="checkbox"
                  class="adm-check"
                  :checked="allOnPageSelected"
                  @change="toggleAll"
                />
              </th>
              <th
                class="adm-th-sort"
                :class="{ 'is-active': sortKey === 'name' }"
                @click="toggleSort('name')"
              >
                名称
                <component
                  :is="sortKey === 'name' ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown"
                  :size="13"
                  :stroke-width="2"
                  class="adm-th-sort__arrow"
                />
              </th>
              <th
                class="adm-th-sort"
                :class="{ 'is-active': sortKey === 'category' }"
                @click="toggleSort('category')"
              >
                分类
                <component
                  :is="
                    sortKey === 'category' ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                  "
                  :size="13"
                  :stroke-width="2"
                  class="adm-th-sort__arrow"
                />
              </th>
              <th>二级分类</th>
              <th>状态</th>
              <th style="text-align: right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in paged" :key="l.id" :class="{ 'is-selected': selected.includes(l.id) }">
              <td class="adm-check-cell">
                <input
                  type="checkbox"
                  class="adm-check"
                  :checked="selected.includes(l.id)"
                  @change="toggleOne(l.id)"
                />
              </td>
              <td>
                <div class="adm-link-cell">
                  <span class="adm-link-cell__icon">{{ mono(l.name) }}</span>
                  <div style="min-width: 0">
                    <span class="adm-link-cell__name">{{ l.name }}</span>
                    <span class="adm-link-cell__url">{{ l.url }}</span>
                  </div>
                </div>
              </td>
              <td>{{ catName(l.categoryId) }}</td>
              <td class="adm-muted">{{ subName(l.categoryId, l.subCategoryId) }}</td>
              <td>
                <div style="display: flex; gap: 0.35rem; flex-wrap: wrap">
                  <AdminBadge v-if="l.pinned" variant="warning">置顶</AdminBadge>
                  <AdminBadge v-if="l.hidden" variant="muted">隐藏</AdminBadge>
                  <span v-if="!l.pinned && !l.hidden" class="adm-muted">—</span>
                </div>
              </td>
              <td>
                <div class="adm-row-actions">
                  <button class="admin-link-btn" @click="openEdit(l)">
                    <Pencil :size="14" :stroke-width="1.6" /> 编辑
                  </button>
                  <button class="admin-link-btn danger" @click="remove(l)">
                    <Trash2 :size="14" :stroke-width="1.6" /> 删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPagination
        v-model="page"
        v-model:page-size="pageSize"
        :total="filtered.length"
        :page-sizes="[10, 20, 50]"
      />
    </template>

    <AdminModal v-model="showForm" :title="editingId ? '编辑链接' : '新增链接'">
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
        <div class="adm-form-row">
          <div class="admin-field">
            <label class="admin-label">分类 *</label>
            <select v-model="form.categoryId" class="admin-select" @change="onCategoryChange">
              <option
                v-for="c in [...adminStore.categories].sort(byOrder)"
                :key="c.id"
                :value="c.id"
              >
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
        <div class="adm-form-row">
          <label class="admin-check"><input v-model="form.pinned" type="checkbox" /> 置顶</label>
          <label class="admin-check"><input v-model="form.hidden" type="checkbox" /> 隐藏</label>
        </div>
      </div>
      <template #actions>
        <button class="admin-btn admin-btn-ghost" @click="showForm = false">取消</button>
        <button class="admin-btn admin-btn-primary" @click="save">保存</button>
      </template>
    </AdminModal>
  </div>
</template>
