<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAdminStore } from '../../stores/admin';
  import AdminCard from './ui/AdminCard.vue';
  import AdminStatCard from './ui/AdminStatCard.vue';
  import AdminBarChart from './ui/AdminBarChart.vue';
  import AdminSkeleton from './ui/AdminSkeleton.vue';
  import AdminEmpty from './ui/AdminEmpty.vue';
  import {
    Link2,
    FolderTree,
    Layers,
    Star,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Link as LinkIcon,
  } from 'lucide-vue-next';

  const adminStore = useAdminStore();
  const router = useRouter();

  const loading = computed(() => adminStore.loading && adminStore.links.length === 0);

  const totalLinks = computed(() => adminStore.links.length);
  const totalCategories = computed(() => adminStore.categories.length);
  const totalSubs = computed(() =>
    adminStore.categories.reduce((n, c) => n + (c.subCategories?.length ?? 0), 0)
  );
  const pinned = computed(() => adminStore.links.filter((l) => l.pinned).length);
  const hidden = computed(() => adminStore.links.filter((l) => l.hidden).length);

  const chartData = computed(() =>
    [...adminStore.categories]
      .map((c) => ({
        label: c.name,
        value: adminStore.links.filter((l) => l.categoryId === c.id).length,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  );

  const recent = computed(() => [...adminStore.links].slice(-6).reverse());

  const catName = (id: string): string =>
    adminStore.categories.find((c) => c.id === id)?.name ?? id;

  const health = computed(() => {
    const emptyCats = adminStore.categories.filter(
      (c) => !adminStore.links.some((l) => l.categoryId === c.id)
    ).length;
    const emptySubs = adminStore.categories.reduce(
      (n, c) =>
        n +
        (c.subCategories ?? []).filter(
          (s) => !adminStore.links.some((l) => l.categoryId === c.id && l.subCategoryId === s.id)
        ).length,
      0
    );
    return [
      { label: '空分类（无链接）', value: emptyCats, warn: emptyCats > 0 },
      { label: '空二级分类（无链接）', value: emptySubs, warn: emptySubs > 0 },
      { label: '隐藏链接', value: hidden.value, warn: false },
      { label: '置顶链接', value: pinned.value, warn: false },
    ];
  });

  const monogram = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">数据看板</h1>
        <p class="adm-page__subtitle">站点内容总览与运行状态一览</p>
      </div>
    </div>

    <!-- 指标卡 -->
    <div v-if="loading" class="adm-stats">
      <div v-for="i in 4" :key="i" class="adm-stat">
        <AdminSkeleton variant="circle" width="48px" height="48px" radius="14px" />
        <div style="flex: 1">
          <AdminSkeleton width="60%" />
          <AdminSkeleton width="40%" height="1.4rem" style="margin-top: 0.5rem" />
        </div>
      </div>
    </div>
    <div v-else class="adm-stats">
      <AdminStatCard
        :icon="Link2"
        label="链接总数"
        :value="totalLinks"
        delta="实时统计"
        trend="flat"
        accent="var(--color-primary)"
      />
      <AdminStatCard
        :icon="FolderTree"
        label="分类数"
        :value="totalCategories"
        accent="var(--color-secondary)"
      />
      <AdminStatCard :icon="Layers" label="二级分类" :value="totalSubs" accent="#7c3aed" />
      <AdminStatCard
        :icon="Star"
        label="置顶 / 隐藏"
        :value="`${pinned} / ${hidden}`"
        accent="var(--color-warning)"
      />
    </div>

    <!-- 图表 + 健康 -->
    <div class="adm-grid-2">
      <AdminCard title="各分类链接数" subtitle="按链接数量降序取前 10">
        <AdminBarChart v-if="!loading && chartData.length" :data="chartData" />
        <AdminEmpty v-else-if="!loading" title="暂无分类数据" />
        <div v-else class="adm-chart-skeleton">
          <AdminSkeleton
            v-for="i in 6"
            :key="i"
            variant="rect"
            height="160px"
            radius="12px"
            style="flex: 1"
          />
        </div>
      </AdminCard>

      <AdminCard title="数据健康检查" subtitle="异常项会高亮提示">
        <ul v-if="!loading" class="adm-health">
          <li v-for="h in health" :key="h.label" class="adm-health__row">
            <span class="adm-health__icon" :class="h.warn ? 'is-warn' : 'is-ok'">
              <component
                :is="h.warn ? AlertTriangle : CheckCircle2"
                :size="16"
                :stroke-width="1.8"
              />
            </span>
            <span class="adm-health__label">{{ h.label }}</span>
            <span class="adm-spacer"></span>
            <span class="adm-health__value" :class="{ 'is-warn': h.warn }">{{ h.value }}</span>
          </li>
        </ul>
        <div v-else class="adm-health">
          <div v-for="i in 4" :key="i" class="adm-health__row">
            <AdminSkeleton width="100%" height="1.1rem" />
          </div>
        </div>
      </AdminCard>
    </div>

    <!-- 最近新增 + 快捷 -->
    <div class="adm-grid-2">
      <AdminCard title="最近链接" subtitle="最新加入的 6 条">
        <ul v-if="!loading && recent.length" class="adm-recent">
          <li
            v-for="l in recent"
            :key="l.id"
            class="adm-recent__row"
            @click="router.push('/admin/links')"
          >
            <span class="adm-recent__avatar">{{ monogram(l.name) }}</span>
            <div class="adm-recent__meta">
              <p class="adm-recent__name">{{ l.name }}</p>
              <p class="adm-recent__sub">{{ catName(l.categoryId) }} · {{ l.url }}</p>
            </div>
            <ArrowRight :size="16" :stroke-width="1.6" class="adm-recent__arrow" />
          </li>
        </ul>
        <AdminEmpty v-else-if="!loading" title="暂无链接" description="前往链接管理添加第一条" />
        <div v-else class="adm-recent">
          <div v-for="i in 6" :key="i" class="adm-recent__row">
            <AdminSkeleton variant="circle" width="34px" height="34px" radius="10px" />
            <div style="flex: 1">
              <AdminSkeleton width="50%" />
              <AdminSkeleton width="70%" height="0.7rem" style="margin-top: 0.35rem" />
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="快捷导航" subtitle="快速跳转查看">
        <div class="adm-quick">
          <button class="adm-quick__item" @click="router.push('/admin/links')">
            <span class="adm-quick__icon"><LinkIcon :size="18" :stroke-width="1.6" /></span>
            查看链接
          </button>
          <button class="adm-quick__item" @click="router.push('/admin/categories')">
            <span class="adm-quick__icon"><FolderTree :size="18" :stroke-width="1.6" /></span>
            查看分类
          </button>
        </div>
      </AdminCard>
    </div>
  </div>
</template>

<style scoped>
  .adm-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
  .adm-grid-2 {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }
  .adm-chart-skeleton {
    display: flex;
    gap: 0.75rem;
    height: 220px;
    align-items: flex-end;
    padding-top: 1.25rem;
  }
  .adm-health {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .adm-health__row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-md);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
  }
  .adm-health__icon {
    display: inline-flex;
  }
  .adm-health__icon.is-ok {
    color: var(--color-success);
  }
  .adm-health__icon.is-warn {
    color: var(--color-warning);
  }
  .adm-health__label {
    font-size: 0.875rem;
  }
  .adm-health__value {
    font-weight: 700;
    font-size: 0.95rem;
  }
  .adm-health__value.is-warn {
    color: var(--color-warning);
  }
  .adm-recent {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .adm-recent__row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.6rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .adm-recent__row:hover {
    background: hsl(var(--hue-primary), 80%, 55%, 0.06);
  }
  .adm-recent__avatar {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: #fff;
    background: var(--gradient-primary);
  }
  .adm-recent__meta {
    min-width: 0;
    flex: 1;
  }
  .adm-recent__name {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .adm-recent__sub {
    margin: 0.1rem 0 0;
    font-size: 0.72rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .adm-recent__arrow {
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
  .adm-quick {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .adm-quick__item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .adm-quick__item:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
  .adm-quick__item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .adm-quick__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    background: hsl(var(--hue-primary), 80%, 55%, 0.12);
    color: var(--color-primary);
  }
  .adm-quick__icon .is-spinning {
    animation: adm-spin 0.9s linear infinite;
  }
  @keyframes adm-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 1100px) {
    .adm-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    .adm-grid-2 {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 520px) {
    .adm-stats {
      grid-template-columns: 1fr;
    }
    .adm-quick {
      grid-template-columns: 1fr;
    }
  }
</style>
