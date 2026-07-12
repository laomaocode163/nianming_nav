<script setup lang="ts">
  import { onMounted, ref, shallowRef, type Component } from 'vue';
  import { useThemeStore } from './stores/theme';
  import { useSettingsStore } from './stores/settings';
  import { useDataStore } from './stores/data';
  import ToastHost from './components/ui/ToastHost.vue';

  const themeStore = useThemeStore();
  const settingsStore = useSettingsStore();
  const dataStore = useDataStore();

  // 管理后台入口：仅本地开发动态加载，生产构建中该 import() 被
  // 死代码消除，对应 chunk 不会进入产物 → 对外完全不可见。
  const DevAdminEntry = shallowRef<Component | null>(null);

  const ready = ref(false);
  const error = ref<string | null>(null);

  onMounted(async () => {
    themeStore.initTheme();
    try {
      await dataStore.init();
      await settingsStore.init();
      settingsStore.apply();
      ready.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载配置失败，请检查数据文件';
      ready.value = true;
    }
    if (import.meta.env.DEV) {
      DevAdminEntry.value = (await import('./components/admin/DevAdminEntry.vue')).default;
    }
  });
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
  <ToastHost />

  <component :is="DevAdminEntry" v-if="DevAdminEntry" />

  <div v-if="!ready" class="app-splash" aria-hidden="true">
    <div class="app-splash__logo">念</div>
    <div v-if="error" class="app-splash__error">
      <p class="app-splash__error-title">加载失败</p>
      <p class="app-splash__error-msg">{{ error }}</p>
    </div>
    <template v-else>
      <div class="app-splash__spinner"></div>
      <p class="app-splash__text">正在加载导航站…</p>
    </template>
  </div>
</template>

<style scoped>
  .app-container {
    min-height: 100vh;
    background-color: var(--color-bg);
    background-image: var(--app-bg-image, none);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: var(--app-bg-attachment, scroll);
    color: var(--color-text);
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
  }

  .app-splash {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: var(--color-bg, #ffffff);
    color: var(--color-text, #0f172a);
    z-index: 9999;
  }

  .app-splash__logo {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
  }

  .app-splash__spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: app-splash-spin 0.8s linear infinite;
  }

  .app-splash__text {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .app-splash__error {
    max-width: 28rem;
    padding: 0 1.5rem;
    text-align: center;
  }

  .app-splash__error-title {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: #ef4444;
  }

  .app-splash__error-msg {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.7;
    word-break: break-word;
  }

  @keyframes app-splash-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
