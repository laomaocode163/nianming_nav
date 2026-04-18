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
  padding: var(--space-md) var(--space-lg);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  user-select: none;
  box-shadow: var(--shadow-sm);
  min-height: 72px;
}

.site-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, hsl(var(--hue-primary), 20%, 96%) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-normal);
  pointer-events: none;
}

.dark .site-card::before {
  background: linear-gradient(135deg, hsl(var(--hue-primary), 20%, 14%) 0%, transparent 100%);
}

.site-card:hover::before {
  opacity: 1;
}

.site-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow), var(--shadow-lg);
}

.site-card:active {
  transform: translateY(-2px) scale(0.99);
  box-shadow: var(--shadow-md);
}



.site-icon-wrapper {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--hue-primary), 20%, 96%);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.dark .site-icon-wrapper {
  background: hsl(var(--hue-primary), 20%, 16%);
}

.site-card:hover .site-icon-wrapper {
  transform: scale(1.05) rotate(-5deg);
  background: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.site-card:hover .site-icon-wrapper .site-icon {
  filter: brightness(0) invert(1);
}

.site-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  transition: all var(--transition-normal);
  position: relative;
  z-index: 1;
}

.site-info {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.site-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--color-text);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  transition: all var(--transition-fast);
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
  transition: all var(--transition-fast);
}

.site-card:hover .site-desc {
  color: var(--color-text);
}

.site-url {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all var(--transition-fast);
}

.site-card:hover .site-url {
  opacity: 1;
  color: var(--color-primary);
}

/* 平板适配 */
@media (max-width: 768px) {
  .site-card {
    padding: 1rem 1.25rem;
    gap: 0.875rem;
    border-radius: 16px;
    min-height: 72px;
  }

  .site-card:hover {
    transform: translateY(-4px) scale(1.01);
  }

  .site-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .site-icon {
    width: 26px;
    height: 26px;
  }

  .site-name {
    font-size: 0.9375rem;
    margin-bottom: 0.25rem;
  }

  .site-desc {
    font-size: 0.8125rem;
  }

  .site-url {
    font-size: 0.75rem;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 480px) {
  .site-card {
    padding: 0.875rem 1rem;
    gap: 0.75rem;
    border-radius: 14px;
    min-height: 64px;
  }

  .site-card:hover {
    transform: translateY(-2px) scale(1.01);
  }

  .site-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .site-icon {
    width: 22px;
    height: 22px;
  }

  .site-name {
    font-size: 0.875rem;
    margin-bottom: 0.125rem;
  }

  .site-desc {
    font-size: 0.75rem;
  }

  .site-url {
    font-size: 0.6875rem;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .site-card:hover {
    transform: none;
  }

  .site-card:hover .site-icon-wrapper {
    transform: none;
  }

  .site-card:hover .site-name {
    transform: none;
  }

  .site-card:active {
    transform: scale(0.98);
    background: rgba(14, 165, 233, 0.05);
  }
}
</style>
