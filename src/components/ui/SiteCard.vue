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
    </div>
    <div v-if="site.pinned" class="pinned-badge">📌</div>
  </a>
</template>

<style scoped>
.site-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.site-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.site-icon-wrapper {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border-radius: 8px;
}

.site-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.site-icon-placeholder {
  font-size: 1.125rem;
}

.site-info {
  flex: 1;
  min-width: 0;
}

.site-name {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-desc {
  font-size: 0.75rem;
  color: var(--color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pinned-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.6;
}

@media (max-width: 640px) {
  .site-card {
    padding: 0.875rem 1rem;
  }

  .site-icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .site-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
