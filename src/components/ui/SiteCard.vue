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

    <div v-if="site.pinned" class="pinned-badge">📌</div>
  </a>
</template>

<style scoped>
.site-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(145deg, var(--color-card), var(--color-bg));
  border: 2px solid var(--color-border);
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  user-select: none;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  min-height: 68px;
}

.site-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.site-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s ease;
  pointer-events: none;
}

.site-card:hover::before {
  opacity: 1;
}

.site-card:hover::after {
  left: 100%;
}

.site-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-6px) scale(1.02);
  box-shadow:
    0 16px 32px rgba(14, 165, 233, 0.2),
    0 8px 16px rgba(14, 165, 233, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.site-card:active {
  transform: translateY(-2px) scale(0.99);
  box-shadow:
    0 8px 16px rgba(14, 165, 233, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}



.site-icon-wrapper {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, var(--color-bg) 0%, rgba(14, 165, 233, 0.15) 100%);
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.site-icon-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.site-card:hover .site-icon-wrapper {
  transform: scale(1.12) rotate(8deg);
  box-shadow:
    0 8px 24px rgba(14, 165, 233, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.site-card:hover .site-icon-wrapper::before {
  opacity: 1;
}

.site-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.site-card:hover .site-icon {
  transform: scale(1.1);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: inline-block;
}

.site-name::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--gradient-primary);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-card:hover .site-name {
  color: var(--color-primary);
  transform: translateX(6px);
}

.site-card:hover .site-name::after {
  width: 100%;
}

.site-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  transition: all 0.3s ease;
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
  transition: all 0.3s ease;
}

.site-card:hover .site-url {
  opacity: 1;
  color: var(--color-primary);
}

.pinned-badge {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  font-size: 1rem;
  opacity: 0.9;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
  animation: pulse 2s ease-in-out infinite;
  z-index: 2;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
  }
  50% {
    transform: scale(1.15);
    filter: drop-shadow(0 4px 12px rgba(14, 165, 233, 0.3));
  }
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

  .pinned-badge {
    top: 0.75rem;
    right: 0.75rem;
    font-size: 1rem;
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

  .pinned-badge {
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.875rem;
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
