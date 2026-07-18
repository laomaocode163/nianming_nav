<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import AdminSidebar from '../components/admin/AdminSidebar.vue';
  import AdminTopbar from '../components/admin/AdminTopbar.vue';
  import IntegrityCheck from '../components/admin/IntegrityCheck.vue';
  import { useAdminStore } from '../stores/admin';
  import '../components/admin/admin.css';
  import '../components/admin/adminLayout.css';
  import '../components/admin/adminTable.css';

  const adminStore = useAdminStore();
  const collapsed = ref(false);
  const mobileOpen = ref(false);
  const showCheck = ref(false);

  onMounted(() => {
    adminStore.loadAll();
  });
</script>

<template>
  <div class="adm-app" :class="{ 'is-collapsed': collapsed }">
    <AdminSidebar :collapsed="collapsed" :mobile-open="mobileOpen" @close="mobileOpen = false" />
    <div v-if="mobileOpen" class="adm-backdrop" @click="mobileOpen = false"></div>

    <div class="adm-content">
      <AdminTopbar
        @toggle-collapse="collapsed = !collapsed"
        @toggle-mobile="mobileOpen = !mobileOpen"
        @open-check="showCheck = true"
      />
      <main class="adm-main">
        <router-view v-slot="{ Component }">
          <transition name="adm-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <IntegrityCheck :show="showCheck" @close="showCheck = false" />
  </div>
</template>
