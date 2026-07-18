<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRoute, useRouter, RouterLink } from 'vue-router';
  import { useThemeStore } from '../../stores/theme';
  import { useAdminStore } from '../../stores/admin';
  import { ADMIN_GROUP_LABELS } from './adminNav';
  import {
    Search,
    Sun,
    Moon,
    PanelLeft,
    Menu,
    ShieldCheck,
    Home,
    ChevronRight,
    LoaderCircle,
  } from 'lucide-vue-next';

  const emit = defineEmits<{
    (e: 'toggle-collapse'): void;
    (e: 'toggle-mobile'): void;
    (e: 'open-check'): void;
  }>();

  const route = useRoute();
  const router = useRouter();
  const themeStore = useThemeStore();
  const adminStore = useAdminStore();

  const crumb = computed(() => {
    const group = (route.meta.group as keyof typeof ADMIN_GROUP_LABELS) ?? 'overview';
    return {
      group: ADMIN_GROUP_LABELS[group] ?? '',
      title: (route.meta.title as string) ?? '',
    };
  });

  const globalSearch = ref('');
  const onSearch = (): void => {
    const q = globalSearch.value.trim();
    router.push({ path: '/admin/links', query: q ? { q } : {} });
  };
</script>

<template>
  <header class="adm-topbar glass-surface">
    <button class="adm-icon-btn adm-topbar__menu" title="菜单" @click="emit('toggle-mobile')">
      <Menu :size="20" :stroke-width="1.6" />
    </button>
    <button
      class="adm-icon-btn adm-topbar__collapse"
      title="折叠侧栏"
      @click="emit('toggle-collapse')"
    >
      <PanelLeft :size="20" :stroke-width="1.6" />
    </button>

    <nav class="adm-breadcrumb">
      <span class="adm-breadcrumb__group">{{ crumb.group }}</span>
      <ChevronRight :size="15" :stroke-width="2" class="adm-breadcrumb__sep" />
      <span class="adm-breadcrumb__title">{{ crumb.title }}</span>
    </nav>

    <span class="adm-spacer"></span>

    <form class="adm-search" @submit.prevent="onSearch">
      <Search :size="16" :stroke-width="1.6" class="adm-search__icon" />
      <input
        v-model="globalSearch"
        type="search"
        class="adm-search__input"
        placeholder="搜索链接…"
        aria-label="全局搜索"
      />
    </form>

    <button
      class="adm-icon-btn"
      :class="{ 'is-spinning': adminStore.loading }"
      :title="adminStore.loading ? '数据同步中' : '数据已同步'"
    >
      <LoaderCircle :size="18" :stroke-width="1.6" />
    </button>
    <button class="adm-icon-btn" title="切换主题" @click="themeStore.toggleTheme()">
      <component :is="themeStore.isDark ? Sun : Moon" :size="18" :stroke-width="1.6" />
    </button>
    <button class="adm-icon-btn" title="数据检查" @click="emit('open-check')">
      <ShieldCheck :size="18" :stroke-width="1.6" />
    </button>
    <RouterLink to="/" class="adm-icon-btn" title="返回首页">
      <Home :size="18" :stroke-width="1.6" />
    </RouterLink>
  </header>
</template>
