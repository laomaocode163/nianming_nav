<script setup>
import { computed } from 'vue'
import { useDataStore } from '../../stores/data'
import { getDefaultIcon } from '../../utils/constants'

const props = defineProps({
  site: {
    type: Object,
    required: true
  }
})

const dataStore = useDataStore()

const siteIcon = computed(() => {
  return dataStore.getLinkIcon(props.site)
})

const onIconError = (event) => {
  const img = event.target
  img.src = getDefaultIcon()
  img.onerror = null
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
        :alt="site.title"
        class="site-icon"
        loading="lazy"
        @error="onIconError"
      />
    </div>

    <div class="site-info">
      <div class="site-name">{{ site.title }}</div>
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
  padding: 1rem 1.25rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-decoration: none;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-height: 68px;
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
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--hue-primary), 15%, 96%);
  border-radius: 10px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.dark .site-icon-wrapper {
  background: hsl(var(--hue-primary), 20%, 20%);
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

.site-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.site-card:hover .site-name {
  color: var(--color-primary);
}

.site-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  opacity: 0.8;
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
