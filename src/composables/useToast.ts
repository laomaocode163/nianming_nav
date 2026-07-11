import { ref } from 'vue';

export interface ToastState {
  id: number;
  text: string;
}

export const toast = ref<ToastState | null>(null);

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(text: string, duration = 1500): void {
  if (hideTimer) clearTimeout(hideTimer);
  toast.value = { id: Date.now(), text };
  hideTimer = setTimeout(() => {
    toast.value = null;
  }, duration);
}
