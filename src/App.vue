<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useThemeStore } from './stores/theme';
  import { useSettingsStore } from './stores/settings';
  import { useDataStore } from './stores/data';
  import { useUserPrefsStore } from './stores/userPrefs';
  import { extractDomain, prefetchUncachedFavicons } from './services/faviconService';
  import ToastHost from './components/ui/ToastHost.vue';

  const themeStore = useThemeStore();
  const settingsStore = useSettingsStore();
  const dataStore = useDataStore();
  const userPrefsStore = useUserPrefsStore();

  const ready = ref(false);
  const error = ref<string | null>(null);
  // 标签页不可见时暂停弥散光斑动画，避免后台空耗 GPU
  const bgPaused = ref(false);
  const onVisibilityChange = () => {
    bgPaused.value = document.hidden;
  };

  onMounted(async () => {
    // 触发 userPrefs 初始化（含旧版裸 localStorage 键的一次性迁移）
    void userPrefsStore;
    document.addEventListener('visibilitychange', onVisibilityChange);
    themeStore.initTheme();
    try {
      await dataStore.init();
      // 空闲时预取未缓存的站点图标，缓解首屏 favicon 请求瀑布
      const domains = [
        ...new Set(dataStore.links.map((l) => extractDomain(l.url)).filter(Boolean)),
      ];
      prefetchUncachedFavicons(domains);
      await settingsStore.init();
      settingsStore.apply();
      ready.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载配置失败，请检查数据文件';
      ready.value = true;
    }
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });
</script>

<template>
  <div class="app-container">
    <div class="app-bg" :class="{ 'is-paused': bgPaused }" aria-hidden="true">
      <span class="app-bg__blob app-bg__blob--1"></span>
      <span class="app-bg__blob app-bg__blob--2"></span>
      <span class="app-bg__blob app-bg__blob--3"></span>
    </div>
    <router-view />
  </div>
  <ToastHost />

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
    background-color: transparent;
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

  /* 弥散光斑背景层：固定全屏、置于内容之下，为玻璃拟态提供可透出的色彩 */
  .app-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
  }

  .app-bg__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(var(--blob-blur));
    opacity: var(--blob-opacity);
    will-change: transform;
  }

  /* 标签页不可见或用户偏好减少动效时暂停弥散光斑动画，释放 GPU */
  .app-bg.is-paused .app-bg__blob {
    animation-play-state: paused;
    will-change: auto;
  }

  .app-bg__blob--1 {
    width: 36vw;
    height: 36vw;
    background: var(--blob-1);
    top: -14%;
    left: -10%;
    animation: blobFloat1 24s ease-in-out infinite;
  }

  .app-bg__blob--2 {
    width: 32vw;
    height: 32vw;
    background: var(--blob-2);
    bottom: -16%;
    right: -12%;
    animation: blobFloat2 28s ease-in-out infinite;
  }

  .app-bg__blob--3 {
    width: 27vw;
    height: 27vw;
    background: var(--blob-3);
    top: 28%;
    left: 42%;
    animation: blobFloat3 32s ease-in-out infinite;
  }

  @keyframes blobFloat1 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(10%, 12%) scale(1.12);
    }
  }

  @keyframes blobFloat2 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(-12%, -8%) scale(1.1);
    }
  }

  @keyframes blobFloat3 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(-8%, 10%) scale(1.15);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .app-bg__blob {
      animation: none;
    }
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
