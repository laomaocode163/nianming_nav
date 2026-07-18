<script setup lang="ts">
  withDefaults(
    defineProps<{
      title?: string;
      subtitle?: string;
      padded?: boolean;
    }>(),
    { title: '', subtitle: '', padded: true }
  );
</script>

<template>
  <section class="adm-card" :class="{ 'adm-card--padded': padded }">
    <header v-if="title || $slots.actions" class="adm-card__head">
      <div class="adm-card__titles">
        <h3 v-if="title" class="adm-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="adm-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="adm-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>

<style scoped>
  .adm-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }
  .adm-card--padded {
    padding: clamp(1rem, 2.2vw, 1.4rem);
  }
  .adm-card__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .adm-card__title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .adm-card__subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }
  .adm-card__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
</style>
