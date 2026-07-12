<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useAdminStore } from '../stores/admin';
  import AdminLinks from '../components/admin/AdminLinks.vue';
  import CategoryTree from '../components/admin/CategoryTree.vue';
  import '../components/admin/admin.css';

  const adminStore = useAdminStore();
  const tab = ref<'links' | 'categories'>('links');

  const tabs: Array<{ key: typeof tab.value; label: string; icon: string }> = [
    { key: 'links', label: '网址', icon: '🔗' },
    { key: 'categories', label: '分类', icon: '🗂️' },
  ];

  onMounted(() => {
    adminStore.loadAll();
  });
</script>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div class="admin-title-wrap">
        <div class="admin-title-badge">⚙</div>
        <div>
          <h1 class="admin-title">管理后台</h1>
          <p class="admin-sub">本地开发工具 · 改动直接写入 src/config/data/*.json</p>
        </div>
      </div>
      <RouterLink to="/" class="admin-back">← 返回首页</RouterLink>
    </header>

    <nav class="admin-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="admin-tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        <span class="admin-tab-icon">{{ t.icon }}</span>
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
  .admin-tab-icon {
    margin-right: 0.3rem;
  }
</style>
