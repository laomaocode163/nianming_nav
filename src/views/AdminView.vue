<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useAdminStore } from '../stores/admin';
  import AdminLinks from '../components/admin/AdminLinks.vue';
  import CategoryTree from '../components/admin/CategoryTree.vue';
  import '../components/admin/admin.css';

  const adminStore = useAdminStore();
  const tab = ref<'links' | 'categories'>('links');

  const tabs: Array<{ key: typeof tab.value; label: string; icon: 'link' | 'folder' }> = [
    { key: 'links', label: '网址', icon: 'link' },
    { key: 'categories', label: '分类', icon: 'folder' },
  ];

  onMounted(() => {
    adminStore.loadAll();
  });
</script>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div class="admin-title-wrap">
        <div class="admin-title-badge">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
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
          <p class="admin-sub">本地开发工具 · 改动直接写入 src/config/data/*.json</p>
        </div>
      </div>
      <RouterLink to="/" class="admin-back">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="admin-back-icon"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回首页
      </RouterLink>
    </header>

    <nav class="admin-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="admin-tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        <svg
          v-if="t.icon === 'link'"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="admin-tab-svg"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="admin-tab-svg"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        {{ t.label }}
      </button>
    </nav>

    <main class="admin-card">
      <AdminLinks v-if="tab === 'links'" />
      <CategoryTree v-else-if="tab === 'categories'" />
    </main>
  </div>
</template>

<style scoped>
  .admin-tab-svg {
    margin-right: 0.35rem;
    flex-shrink: 0;
  }

  .admin-back-icon {
    margin-right: 0.35rem;
    flex-shrink: 0;
  }
</style>
