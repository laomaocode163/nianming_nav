<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useAdminStore } from '../stores/admin';
  import AdminLinks from '../components/admin/AdminLinks.vue';
  import CategoryTree from '../components/admin/CategoryTree.vue';
  import { Link, Folder } from 'lucide-vue-next';
  import '../components/admin/admin.css';

  const adminStore = useAdminStore();
  const tab = ref<'links' | 'categories'>('links');
  const selectedCategoryId = ref('');

  const filterCats = computed(() =>
    [...adminStore.categories]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        count: adminStore.links.filter((l) => l.categoryId === c.id).length,
      }))
  );

  // 切到「分类」页时清空网址筛选，回到「网址」从「全部」开始
  watch(tab, (t) => {
    if (t !== 'links') selectedCategoryId.value = '';
  });

  onMounted(() => {
    adminStore.loadAll();
  });
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <div class="admin-title-badge">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </div>
        <div>
          <h1 class="admin-title">管理后台</h1>
          <p class="admin-sub">本地开发工具 · 改动写入 data/*.json</p>
        </div>
      </div>

      <nav class="admin-nav">
        <button class="admin-nav-item" :class="{ active: tab === 'links' }" @click="tab = 'links'">
          <Link :size="18" :stroke-width="1.5" />
          网址
        </button>
        <button
          class="admin-nav-item"
          :class="{ active: tab === 'categories' }"
          @click="tab = 'categories'"
        >
          <Folder :size="18" :stroke-width="1.5" />
          分类
        </button>
      </nav>

      <div v-if="tab === 'links'" class="admin-filter">
        <p class="admin-section-title">分类筛选</p>
        <button
          class="admin-filter-item"
          :class="{ active: !selectedCategoryId }"
          @click="selectedCategoryId = ''"
        >
          <span class="admin-filter-name">全部网址</span>
          <span class="admin-chip">{{ adminStore.links.length }}</span>
        </button>
        <button
          v-for="c in filterCats"
          :key="c.id"
          class="admin-filter-item"
          :class="{ active: selectedCategoryId === c.id }"
          @click="selectedCategoryId = c.id"
        >
          <CategoryIcon :name="c.icon" :stroke-width="1.5" class="admin-filter-icon" />
          <span class="admin-filter-name">{{ c.name }}</span>
          <span class="admin-chip">{{ c.count }}</span>
        </button>
      </div>

      <RouterLink to="/" class="admin-back">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="admin-back-icon"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回首页
      </RouterLink>
    </aside>

    <main class="admin-main">
      <AdminLinks v-if="tab === 'links'" :category-filter="selectedCategoryId" />
      <CategoryTree v-else-if="tab === 'categories'" />
    </main>
  </div>
</template>

<style scoped>
  .admin-back-icon {
    margin-right: 0.35rem;
    flex-shrink: 0;
  }
</style>
