<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { useDataStore } from '../../stores/data';
  import { useUserPrefsStore } from '../../stores/userPrefs';
  import { getDefaultIcon } from '../../utils/constants';
  import {
    extractDomain,
    getFaviconUrl,
    isFaviconCached,
    requestFavicon,
    validateAndCacheFavicon,
  } from '../../services/faviconService';
  import { safeUrl } from '../../utils/url';
  import { showToast } from '../../composables/useToast';
  import { highlightParts } from '../../utils/highlight';
  import type { Link } from '../../types';

  const props = withDefaults(
    defineProps<{
      site: Link;
      highlight?: string;
    }>(),
    {
      highlight: '',
    }
  );

  const dataStore = useDataStore();
  const userPrefs = useUserPrefsStore();
  const isCopied = ref(false);
  const iconLoaded = ref(false);
  // 图标地址由统一调度器解析（缓存命中同步、未命中异步竞速）
  const iconUrl = ref('');
  // 卸载守卫：异步请求完成前组件可能被卸载（翻页/切换路由），用于放弃写状态
  const cancelled = ref(false);

  onMounted(async () => {
    const domain = extractDomain(props.site.url);
    if (!domain) {
      iconUrl.value = getDefaultIcon();
      iconLoaded.value = true;
      return;
    }
    // 同步首屏：命中缓存直接显示；未命中先给主源占位，再由调度器竞速验证最终可用图标
    if (isFaviconCached(domain)) {
      iconUrl.value = dataStore.getLinkIcon(props.site);
    } else {
      iconUrl.value = getFaviconUrl(domain);
      try {
        const url = await requestFavicon(domain);
        // 组件可能在请求完成前被卸载，此时放弃写状态，避免写入已销毁实例
        if (cancelled.value) return;
        iconUrl.value = url;
      } catch {
        if (cancelled.value) return;
        iconUrl.value = getDefaultIcon();
      }
    }
  });

  onUnmounted(() => {
    cancelled.value = true;
  });

  const siteIcon = computed(() => {
    return iconUrl.value || dataStore.getLinkIcon(props.site);
  });

  const isFav = computed(() => userPrefs.isFavorite(props.site.url));

  const nameParts = computed(() => highlightParts(props.site.name, props.highlight));
  const descParts = computed(() =>
    props.site.description ? highlightParts(props.site.description, props.highlight) : []
  );

  // 点击卡片：先记录访问（用于「最近访问」），随后由原生 <a> 正常跳转
  const onCardClick = (): void => {
    userPrefs.recordVisit(props.site.url);
  };

  const toggleFav = (): void => {
    const added = userPrefs.toggleFavorite(props.site.url);
    showToast(added ? `已收藏「${props.site.name}」` : `已取消收藏「${props.site.name}」`, 1500);
  };

  const onIconLoad = (event: Event) => {
    iconLoaded.value = true;
    const img = event.target as HTMLImageElement;
    const domain = extractDomain(props.site.url);
    if (domain) {
      // 兜底校验尺寸并写入缓存（调度器通常已验证，此处幂等）
      validateAndCacheFavicon(domain, img);
    }
  };

  // 图标加载失败（通常为瞬时主源错误）：仅标记已加载，交由调度器解析的可用地址覆盖，
  // 不再在此做顺序回退链（回退由 faviconService 统一调度处理）。
  const onIconError = () => {
    iconLoaded.value = true;
  };

  /** 复制网站链接到剪贴板，降级兼容不支持 Clipboard API 的环境 */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(props.site.url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = props.site.url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    isCopied.value = true;
    showToast(`已复制「${props.site.url}」`, 1500);
    setTimeout(() => {
      isCopied.value = false;
    }, 1500);
  };
</script>

<template>
  <a
    :href="safeUrl(site.url)"
    target="_blank"
    rel="noopener noreferrer"
    class="site-card"
    @click="onCardClick"
  >
    <div class="site-icon-wrapper">
      <img
        :src="siteIcon"
        :alt="site.name"
        class="site-icon"
        :class="{ loaded: iconLoaded }"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        @load="onIconLoad"
        @error="onIconError"
      />
    </div>

    <div class="site-info">
      <div class="site-name-row">
        <span class="site-name" :title="site.name"
          ><template v-for="(part, i) in nameParts" :key="i"
            ><mark v-if="part.match">{{ part.text }}</mark
            ><template v-else>{{ part.text }}</template></template
          ></span
        >
        <button
          class="fav-btn"
          :class="{ active: isFav }"
          :title="isFav ? '取消收藏' : '收藏'"
          :aria-pressed="isFav"
          @click.prevent.stop="toggleFav"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            :fill="isFav ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            />
          </svg>
        </button>
        <button
          class="copy-btn"
          :class="{ copied: isCopied }"
          :title="isCopied ? '已复制链接' : '复制链接'"
          aria-label="复制链接"
          @click.prevent.stop="copyLink"
        >
          <svg
            v-if="!isCopied"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
      <div v-if="site.description" class="site-desc">
        <template v-for="(part, i) in descParts" :key="i"
          ><mark v-if="part.match">{{ part.text }}</mark
          ><template v-else>{{ part.text }}</template></template
        >
      </div>
      <div v-if="!site.description" class="site-url">{{ site.url }}</div>
    </div>
  </a>
</template>

<style scoped>
  .site-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: 1.25rem 1.5rem;
    /* 常态使用较高不透明度的纯色玻璃底色，避免对每张卡片持续做 backdrop-filter 模糊合成 */
    background: var(--glass-bg-static);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    user-select: none;
    box-shadow: var(--glass-shadow);
    /* 隔离单卡重绘/布局范围，避免 hover 触发整页合成 */
    contain: layout style paint;
    min-height: 80px;
  }

  .dark .site-card {
    background: var(--glass-bg-static);
    border-color: var(--glass-border);
  }

  /* 仅在 hover/聚焦态启用模糊玻璃质感，交互时才有景深，常态零模糊合成开销 */
  @media (hover: hover) and (pointer: fine) {
    .site-card:hover,
    .site-card:focus-within {
      -webkit-backdrop-filter: blur(var(--glass-blur));
      backdrop-filter: blur(var(--glass-blur));
    }
  }

  .site-card:hover {
    border-color: hsl(var(--hue-primary), var(--sat-primary), var(--lig-primary), 0.4);
    transform: translateY(-3px);
    background: var(--glass-bg-strong);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      0 0 0 1px hsl(var(--hue-primary), var(--sat-primary), var(--lig-primary), 0.15);
  }

  .dark .site-card:hover {
    background: var(--glass-bg-strong);
    border-color: hsl(var(--hue-primary), var(--sat-primary), var(--lig-primary), 0.45);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .site-card:active {
    transform: translateY(0px) scale(0.98);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  .site-icon-wrapper {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    border-radius: 50%;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .dark .site-icon-wrapper {
    background: var(--glass-bg-strong);
  }

  .site-card:hover .site-icon-wrapper {
    transform: scale(1.03);
    background: hsl(var(--hue-primary), 20%, 92%);
  }

  .dark .site-card:hover .site-icon-wrapper {
    background: hsl(var(--hue-primary), 25%, 25%);
  }

  .site-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
    opacity: 0;
    transition:
      opacity 240ms ease,
      transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 图标加载完成后淡入，避免多源 fallback 切换时的尺寸跳动 */
  .site-icon.loaded {
    opacity: 1;
  }

  .site-info {
    flex: 1;
    min-width: 0;
  }

  .site-name-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.25rem;
  }

  .site-name {
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .site-card:hover .site-name {
    color: var(--color-primary);
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    color: var(--color-text-secondary);
    transition:
      opacity 0.15s ease,
      color 0.15s ease,
      background 0.15s ease;
    padding: 0;
  }

  .site-card:hover .copy-btn {
    opacity: 0.6;
  }

  .copy-btn:hover {
    opacity: 1 !important;
    background: rgba(0, 0, 0, 0.06);
    color: var(--color-primary);
  }

  .dark .copy-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .copy-btn.copied {
    opacity: 1 !important;
    color: #10b981;
  }

  .fav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    color: var(--color-text-secondary);
    transition:
      opacity 0.15s ease,
      color 0.15s ease,
      background 0.15s ease,
      transform 0.15s ease;
    padding: 0;
  }

  .site-card:hover .fav-btn {
    opacity: 0.6;
  }

  .fav-btn:hover {
    opacity: 1 !important;
    background: rgba(0, 0, 0, 0.06);
    color: #f59e0b;
    transform: scale(1.1);
  }

  .dark .fav-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .fav-btn.active {
    opacity: 1 !important;
    color: #f59e0b;
  }

  .site-name mark,
  .site-desc mark {
    background: transparent;
    color: var(--color-primary);
    font-weight: 700;
    padding: 0;
  }

  .site-desc {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    font-weight: 400;
  }

  .site-url {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 平板适配 */
  @media (max-width: 768px) {
    .site-card {
      padding: 0.875rem 1rem;
      gap: 0.875rem;
      border-radius: 10px;
      min-height: 64px;
    }

    .site-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 8px;
    }

    .site-icon {
      width: 22px;
      height: 22px;
    }

    .site-name {
      font-size: 0.9rem;
    }

    .copy-btn {
      opacity: 0.5;
    }

    .site-desc {
      font-size: 0.78rem;
    }
  }

  /* 小屏幕手机适配 */
  @media (max-width: 480px) {
    .site-card {
      padding: 0.75rem 0.875rem;
      gap: 0.75rem;
      border-radius: var(--radius-sm);
      min-height: 60px;
    }

    .site-icon-wrapper {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
    }

    .site-icon {
      width: 20px;
      height: 20px;
    }

    .site-name {
      font-size: 0.875rem;
    }

    .site-desc {
      font-size: 0.75rem;
    }
  }

  /* 触摸设备优化 */
  @media (hover: none) and (pointer: coarse) {
    .site-card:hover {
      transform: none;
      border-color: var(--color-border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      background: var(--color-card);
    }

    .site-card:hover .site-name {
      color: var(--color-text);
    }

    .copy-btn {
      opacity: 0.5;
    }

    .site-card:hover .copy-btn {
      opacity: 0.5;
    }

    .site-card:active {
      transform: scale(0.98);
      background: hsl(var(--hue-primary), 15%, 96%);
    }

    .dark .site-card:active {
      background: hsl(var(--hue-primary), 20%, 20%);
    }
  }

  /* 增强移动端触摸反馈 */
  @media (max-width: 768px) {
    .site-card {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
  }
</style>
