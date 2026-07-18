<script setup lang="ts">
  import { onBeforeUnmount, onMounted, watch } from 'vue';

  const show = defineModel<boolean>({ required: true });
  withDefaults(defineProps<{ title?: string; width?: string }>(), {
    title: '',
    width: '480px',
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
    <Transition name="adm-drawer">
      <div v-if="show" class="adm-drawer-mask" @click.self="close">
        <aside class="adm-drawer" :style="{ width }" role="dialog" aria-modal="true">
          <header class="adm-drawer__head">
            <h3 class="adm-drawer__title">{{ title }}</h3>
            <button class="adm-drawer__close" type="button" aria-label="关闭" @click="close">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div class="adm-drawer__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="adm-drawer__footer">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .adm-drawer-mask {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(3px);
    display: flex;
    justify-content: flex-end;
  }
  .adm-drawer {
    height: 100vh;
    max-width: 94vw;
    display: flex;
    flex-direction: column;
    background: var(--color-card);
    border-left: 1px solid var(--color-border);
    box-shadow: var(--shadow-float);
  }
  .adm-drawer__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid var(--color-border);
  }
  .adm-drawer__title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
  }
  .adm-drawer__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .adm-drawer__close:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
  .adm-drawer__body {
    flex: 1;
    overflow-y: auto;
    padding: 1.4rem;
  }
  .adm-drawer__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.4rem;
    border-top: 1px solid var(--color-border);
  }
  .adm-drawer-enter-active,
  .adm-drawer-leave-active {
    transition: opacity var(--transition-fast);
  }
  .adm-drawer-enter-active .adm-drawer,
  .adm-drawer-leave-active .adm-drawer {
    transition: transform var(--transition-normal);
  }
  .adm-drawer-enter-from,
  .adm-drawer-leave-to {
    opacity: 0;
  }
  .adm-drawer-enter-from .adm-drawer,
  .adm-drawer-leave-to .adm-drawer {
    transform: translateX(100%);
  }
</style>
