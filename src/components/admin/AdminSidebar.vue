<script setup lang="ts">
  import { RouterLink, useRoute } from 'vue-router';
  import { ADMIN_NAV, ADMIN_GROUP_LABELS, type AdminGroup } from './adminNav';
  import { useAdminStore } from '../../stores/admin';
  import { ArrowLeft } from 'lucide-vue-next';

  defineProps<{ collapsed: boolean; mobileOpen: boolean }>();
  const emit = defineEmits<{ (e: 'close'): void }>();

  const route = useRoute();
  const adminStore = useAdminStore();

  const groups: AdminGroup[] = ['overview', 'content', 'system'];

  const itemsOf = (group: AdminGroup) => ADMIN_NAV.filter((i) => i.group === group);

  const isActive = (to: string): boolean => route.path === to || route.path.startsWith(to + '/');

  const badgeFor = (to: string): string | null => {
    if (to === '/admin/links') return String(adminStore.links.length);
    if (to === '/admin/categories') return String(adminStore.categories.length);
    return null;
  };
</script>

<template>
  <aside class="adm-sidebar" :class="{ 'is-collapsed': collapsed, 'is-open': mobileOpen }">
    <div class="adm-sidebar__brand">
      <div class="adm-brand__badge">念</div>
      <div v-if="!collapsed" class="adm-brand__text">
        <p class="adm-brand__title">念导航</p>
        <p class="adm-brand__sub">管理后台</p>
      </div>
    </div>

    <nav class="adm-nav">
      <template v-for="g in groups" :key="g">
        <p v-if="!collapsed" class="adm-nav__group">{{ ADMIN_GROUP_LABELS[g] }}</p>
        <RouterLink
          v-for="item in itemsOf(g)"
          :key="item.to"
          :to="item.to"
          class="adm-nav__item"
          :class="{ active: isActive(item.to) }"
          :title="collapsed ? item.title : undefined"
          @click="emit('close')"
        >
          <component :is="item.icon" class="adm-nav__icon" :size="20" :stroke-width="1.6" />
          <span v-if="!collapsed" class="adm-nav__label">{{ item.title }}</span>
          <span v-if="!collapsed && badgeFor(item.to)" class="adm-nav__badge">{{
            badgeFor(item.to)
          }}</span>
          <span v-if="collapsed && badgeFor(item.to)" class="adm-nav__dot"></span>
        </RouterLink>
      </template>
    </nav>

    <RouterLink to="/" class="adm-sidebar__back" :title="collapsed ? '返回首页' : undefined">
      <ArrowLeft :size="18" :stroke-width="1.6" />
      <span v-if="!collapsed">返回首页</span>
    </RouterLink>
  </aside>
</template>
