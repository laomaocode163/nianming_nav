<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useAdminStore } from '../../stores/admin';
  import { byOrder } from '@/utils/sort';
  import { exportJson, exportCsv } from '@/utils/exportData';
  import type { Link } from '../../types';
  import { Search, ArrowUpDown, ArrowUp, ArrowDown, Link2, Download } from 'lucide-vue-next';
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
  });

  const toggleSort = (key: 'name' | 'category'): void => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey.value = key;
      sortDir.value = 'asc';
    }
  };

  /* ---------- 只读导出（导出当前筛选结果） ---------- */
  const exportAsJson = (): void => {
    exportJson('links', filtered.value);
  };
  const exportAsCsv = (): void => {
    exportCsv('links', filtered.value, [
      { header: 'ID', value: (l) => l.id },
      { header: '名称', value: (l) => l.name },
      { header: 'URL', value: (l) => l.url },
      { header: '分类', value: (l) => catName(l.categoryId) },
      { header: '二级分类', value: (l) => subName(l.categoryId, l.subCategoryId) },
      { header: '描述', value: (l) => l.description ?? '' },
      { header: '置顶', value: (l) => (l.pinned ? '是' : '否') },
      { header: '隐藏', value: (l) => (l.hidden ? '是' : '否') },
    ]);
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
        <h1 class="adm-page__title">链接查看</h1>
        <p class="adm-page__subtitle">只读浏览站点全部导航链接，支持筛选、排序与导出</p>
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
      <span class="adm-toolbar__count">共 {{ filtered.length }} 条</span>
      <button class="admin-btn" :disabled="!filtered.length" @click="exportAsCsv">
        <Download :size="16" :stroke-width="1.6" /> 导出 CSV
      </button>
      <button
        class="admin-btn admin-btn-primary"
        :disabled="!filtered.length"
        @click="exportAsJson"
      >
        <Download :size="16" :stroke-width="1.6" /> 导出 JSON
      </button>
    </div>

    <div v-if="loading" class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>分类</th>
            <th>二级分类</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in pageSize" :key="i">
            <td><AdminSkeleton width="70%" /></td>
            <td><AdminSkeleton width="60%" /></td>
            <td><AdminSkeleton width="60%" /></td>
            <td><AdminSkeleton width="40%" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminEmpty
      v-else-if="filtered.length === 0"
      :icon="Link2"
      :title="search || categoryFilter ? '无匹配链接' : '暂无链接'"
      :description="search || categoryFilter ? '试试调整搜索或筛选条件' : '当前没有可展示的链接'"
    />

    <template v-else>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in paged" :key="l.id">
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
  </div>
</template>
