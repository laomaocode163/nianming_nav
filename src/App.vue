<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useThemeStore } from './stores/theme';
  import { useSettingsStore } from './stores/settings';
  import { useDataStore } from './stores/data';
  import ToastHost from './components/ui/ToastHost.vue';

  const themeStore = useThemeStore();
  const settingsStore = useSettingsStore();
  const dataStore = useDataStore();
  const router = useRouter();

  const openAdmin = (): void => {
    router.push('/admin');
  };

  const ready = ref(false);
  const error = ref<string | null>(null);
  const isDev = ref(import.meta.env.DEV);

  onMounted(async () => {
    themeStore.initTheme();
    // 配置（含 Zod 校验）异步加载，期间展示骨架，不阻塞首屏绘制
    try {
      await dataStore.init();
      await settingsStore.init();
      settingsStore.apply();
      ready.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载配置失败，请检查数据文件';
      ready.value = true;
    }
  });
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
  <ToastHost />

  <!-- 管理后台入口：仅本地开发可见，生产构建被 tree-shake -->
  <button
    v-if="isDev"
    class="dev-admin-entry"
    title="管理后台（仅开发环境）"
    aria-label="打开管理后台"
    @click="openAdmin"
  >
    ⚙
  </button>

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

  .dev-admin-entry {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 9998;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dev-admin-entry:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    transform: scale(1.05);
  }
</style>
