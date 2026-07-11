<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus/es'
import { useDataStore } from '../../stores/data'
import { getDefaultIcon } from '../../utils/constants'
import { extractDomain, getFaviconFallbacks, cacheFavicon } from '../../services/faviconService'
import type { Link } from '../../types'

const props = defineProps<{
  site: Link
}>()

const dataStore = useDataStore()
const isCopied = ref(false)
const failedIndex = ref(-1)

const siteIcon = computed(() => {
  return dataStore.getLinkIcon(props.site)
})

const onIconLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  const domain = extractDomain(props.site.url)
  if (domain) {
    cacheFavicon(domain, img.src)
  }
}

const onIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const domain = extractDomain(props.site.url)
  const fallbacks = getFaviconFallbacks(domain)
  const next = failedIndex.value + 1
  if (next < fallbacks.length) {
    failedIndex.value = next
    img.src = fallbacks[next]
  } else {
    img.src = getDefaultIcon()
    img.onerror = null
  }
}

/** 复制网站地址到剪贴板，降级兼容不支持 Clipboard API 的环境 */
const copyName = async () => {
  try {
    await navigator.clipboard.writeText(props.site.url)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.site.url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  isCopied.value = true
  ElMessage.success({ message: `已复制「${props.site.url}」`, duration: 1500, grouping: true })
  setTimeout(() => { isCopied.value = false }, 1500)
}
</script>

<template>
  <a
    :href="site.url"
    target="_blank"
    rel="noopener noreferrer"
    class="site-card"
  >
    <div class="site-icon-wrapper">
        <img
          :src="siteIcon"
          :alt="site.name"
          class="site-icon"
          loading="lazy"
          @load="onIconLoad"
          @error="onIconError"
        />
    </div>

    <div class="site-info">
      <div class="site-name-row">
        <span class="site-name">{{ site.name }}</span>
        <button
          class="copy-btn"
          :class="{ copied: isCopied }"
          title="复制名称"
          @click.prevent.stop="copyName"
        >
          <svg v-if="!isCopied" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>
      <div v-if="site.description" class="site-desc">{{ site.description }}</div>
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
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-decoration: none;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-height: 80px;
}

.dark .site-card {
  background: #1f2937;
  border-color: #374151;
}

.site-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(59, 130, 246, 0.1);
  background: linear-gradient(180deg, var(--color-card) 0%, hsl(var(--hue-primary), 30%, 98%) 100%);
}

.dark .site-card:hover {
  background: linear-gradient(180deg, var(--color-card) 0%, hsl(var(--hue-primary), 25%, 18%) 100%);
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
  background: #f3f4f6;
  border-radius: 50%;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.dark .site-icon-wrapper {
  background: #374151;
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
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
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
    border-radius: 8px;
    min-height: 60px;
  }

  .site-icon-wrapper {
    width: 38px;
    height: 38px;
    border-radius: 8px;
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
