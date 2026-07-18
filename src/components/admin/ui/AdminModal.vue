<script setup lang="ts">
  import { onBeforeUnmount, onMounted, watch } from 'vue';

  const show = defineModel<boolean>({ required: true });
  withDefaults(defineProps<{ title?: string; size?: 'sm' | 'md' | 'lg' }>(), {
    title: '',
    size: 'md',
  });

  const close = (): void => {
    show.value = false;
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && show.value) close();
  };

  onMounted(() => document.addEventListener('keydown', onKey));
  onBeforeUnmount(() => document.removeEventListener('keydown', onKey));

  watch(show, (v) => {
    document.body.style.overflow = v ? 'hidden' : '';
  });
</script>

<template>
  <Teleport to="body">
    <Transition name="adm-modal">
      <div v-if="show" class="adm-modal-mask" @click.self="close">
        <div class="adm-modal" :class="`is-${size}`" role="dialog" aria-modal="true">
          <header v-if="title || $slots.actions" class="adm-modal__head">
            <h3 class="adm-modal__title">{{ title }}</h3>
            <div v-if="$slots.actions" class="adm-modal__actions">
              <slot name="actions" />
            </div>
          </header>
          <div class="adm-modal__body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .adm-modal-mask {
    position: fixed;
    inset: 0;
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
  }
  .adm-modal {
    width: min(540px, 94vw);
    max-height: 90vh;
    overflow-y: auto;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-float);
  }
  .adm-modal.is-sm {
    width: min(420px, 94vw);
  }
  .adm-modal.is-lg {
    width: min(720px, 94vw);
  }
  .adm-modal__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }
  .adm-modal__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
  }
  .adm-modal__body {
    padding: 1.5rem;
  }
  .adm-modal-enter-active,
  .adm-modal-leave-active {
    transition: opacity var(--transition-fast);
  }
  .adm-modal-enter-active .adm-modal,
  .adm-modal-leave-active .adm-modal {
    transition:
      transform var(--transition-fast),
      opacity var(--transition-fast);
  }
  .adm-modal-enter-from,
  .adm-modal-leave-to {
    opacity: 0;
  }
  .adm-modal-enter-from .adm-modal,
  .adm-modal-leave-to .adm-modal {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
</style>
