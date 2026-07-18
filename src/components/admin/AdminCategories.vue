<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { byOrder } from '@/utils/sort';
  import { exportJson, exportCsv } from '@/utils/exportData';
  import type { Category } from '../../types';
  import { ChevronRight, Folder, Layers, Download } from 'lucide-vue-next';
  import AdminBadge from './ui/AdminBadge.vue';
  import AdminEmpty from './ui/AdminEmpty.vue';
  import AdminSkeleton from './ui/AdminSkeleton.vue';

  const adminStore = useAdminStore();

  const search = ref('');
  const expanded = ref<Record<string, boolean>>({});

  const linkCount = (categoryId: string): number =>
    adminStore.links.filter((l) => l.categoryId === categoryId).length;
  const subLinkCount = (categoryId: string, subId: string): number =>
    adminStore.links.filter((l) => l.categoryId === categoryId && l.subCategoryId === subId).length;

  const filteredCats = computed<Category[]>(() => {
    const q = search.value.trim().toLowerCase();
    const cats = [...adminStore.categories].sort(byOrder);
    if (!q) return cats;
    return cats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.subCategories ?? []).some((s) => s.name.toLowerCase().includes(q))
    );
  });

  const toggle = (id: string): void => {
    expanded.value[id] = !expanded.value[id];
  };

  /* ---------- 只读导出（导出当前筛选结果） ---------- */
  const exportAsJson = (): void => {
    exportJson('categories', filteredCats.value);
  };
  const exportAsCsv = (): void => {
    interface CatCsvRow {
      分类ID: string;
      分类名称: string;
      链接数: number;
      排序: number;
      隐藏: string;
      二级分类ID: string;
      二级分类名称: string;
      二级分类链接数: number | string;
    }
    const rows: CatCsvRow[] = filteredCats.value.flatMap<CatCsvRow>((c) => {
      const base = {
        分类ID: c.id,
        分类名称: c.name,
        链接数: linkCount(c.id),
        排序: c.order ?? 0,
        隐藏: c.hidden ? '是' : '否',
      };
      const subs = [...(c.subCategories ?? [])].sort(byOrder);
      if (subs.length === 0) {
        return [{ ...base, 二级分类ID: '', 二级分类名称: '', 二级分类链接数: '' }];
      }
      return subs.map((s) => ({
        ...base,
        二级分类ID: s.id,
        二级分类名称: s.name,
        二级分类链接数: subLinkCount(c.id, s.id),
      }));
    });
    exportCsv('categories', rows, [
      { header: '分类ID', value: (r) => r.分类ID },
      { header: '分类名称', value: (r) => r.分类名称 },
      { header: '链接数', value: (r) => r.链接数 },
      { header: '排序', value: (r) => r.排序 },
      { header: '隐藏', value: (r) => r.隐藏 },
      { header: '二级分类ID', value: (r) => r.二级分类ID },
      { header: '二级分类名称', value: (r) => r.二级分类名称 },
      { header: '二级分类链接数', value: (r) => r.二级分类链接数 },
    ]);
  };

  const loading = computed(() => adminStore.loading && adminStore.categories.length === 0);
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">分类查看</h1>
        <p class="adm-page__subtitle">只读浏览一级分类与二级分类，可展开查看子分类与链接分布</p>
      </div>
    </div>

    <div class="adm-toolbar">
      <div class="adm-search" style="min-width: 220px; flex: 0 1 280px">
        <Folder :size="16" :stroke-width="1.6" class="adm-search__icon" />
        <input
          v-model="search"
          type="search"
          class="adm-search__input"
          placeholder="搜索分类 / 子分类…"
        />
      </div>
      <span class="adm-toolbar__spacer"></span>
      <span class="adm-toolbar__count">共 {{ filteredCats.length }} 个分类</span>
      <button class="admin-btn" :disabled="!filteredCats.length" @click="exportAsCsv">
        <Download :size="16" :stroke-width="1.6" /> 导出 CSV
      </button>
      <button
        class="admin-btn admin-btn-primary"
        :disabled="!filteredCats.length"
        @click="exportAsJson"
      >
        <Download :size="16" :stroke-width="1.6" /> 导出 JSON
      </button>
    </div>

    <div v-if="loading" class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>分类</th>
            <th>链接数</th>
            <th>二级分类</th>
            <th>排序</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 5" :key="i">
            <td><AdminSkeleton width="60%" /></td>
            <td><AdminSkeleton width="40%" /></td>
            <td><AdminSkeleton width="40%" /></td>
            <td><AdminSkeleton width="30%" /></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminEmpty
      v-else-if="filteredCats.length === 0"
      :icon="Folder"
      title="暂无分类"
      :description="search ? '试试调整搜索条件' : '当前没有可展示的分类'"
    />

    <div v-else class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th style="width: 44px"></th>
            <th>分类</th>
            <th>链接数</th>
            <th>二级分类</th>
            <th>排序</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="cat in filteredCats" :key="cat.id">
            <tr>
              <td class="adm-check-cell">
                <button
                  class="adm-expand"
                  :class="{ 'is-open': expanded[cat.id] }"
                  :aria-label="expanded[cat.id] ? '收起' : '展开'"
                  @click="toggle(cat.id)"
                >
                  <ChevronRight :size="15" :stroke-width="2" />
                </button>
              </td>
              <td>
                <div class="adm-link-cell">
                  <span class="adm-link-cell__icon"
                    ><CategoryIcon :name="cat.icon" :size="16"
                  /></span>
                  <span class="adm-link-cell__name">{{ cat.name }}</span>
                </div>
              </td>
              <td>{{ linkCount(cat.id) }}</td>
              <td>{{ cat.subCategories?.length ?? 0 }}</td>
              <td class="adm-muted mono">{{ cat.order ?? 0 }}</td>
              <td>
                <AdminBadge v-if="cat.hidden" variant="muted">隐藏</AdminBadge>
                <span v-else class="adm-muted">—</span>
              </td>
            </tr>
            <tr v-if="expanded[cat.id]">
              <td></td>
              <td colspan="5" class="adm-subcell">
                <div v-if="(cat.subCategories ?? []).length === 0" class="adm-subempty">
                  暂无二级分类
                </div>
                <table v-else class="adm-subtable">
                  <tbody>
                    <tr v-for="sub in [...(cat.subCategories ?? [])].sort(byOrder)" :key="sub.id">
                      <td style="width: 36px">
                        <span class="adm-link-cell__icon" style="width: 26px; height: 26px">
                          <Layers :size="13" :stroke-width="1.6" />
                        </span>
                      </td>
                      <td class="adm-link-cell__name">{{ sub.name }}</td>
                      <td class="adm-muted">{{ subLinkCount(cat.id, sub.id) }} 链接</td>
                      <td class="adm-muted mono">{{ sub.order ?? 0 }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
  .adm-expand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition:
      transform var(--transition-fast),
      color var(--transition-fast),
      background var(--transition-fast);
  }
  .adm-expand:hover {
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 80%, 55%, 0.1);
  }
  .adm-expand.is-open {
    transform: rotate(90deg);
    color: var(--color-primary);
  }
  .adm-subcell {
    background: var(--color-bg);
    padding: 0.5rem 1rem 0.75rem 2.5rem !important;
  }
  .adm-subtable {
    width: 100%;
    border-collapse: collapse;
  }
  .adm-subtable td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px dashed var(--color-border);
    font-size: 0.85rem;
    vertical-align: middle;
  }
  .adm-subtable tr:last-child td {
    border-bottom: none;
  }
  .adm-subempty {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
</style>
