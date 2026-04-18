<script setup>
defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1rem'
  },
  rounded: {
    type: Boolean,
    default: false
  },
  circle: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div
    class="skeleton"
    :class="{ 'skeleton-rounded': rounded, 'skeleton-circle': circle }"
    :style="{ width, height }"
  />
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--hue-primary), 10%, 92%) 0%,
    hsl(var(--hue-primary), 10%, 88%) 50%,
    hsl(var(--hue-primary), 10%, 92%) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.dark .skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--hue-primary), 10%, 18%) 0%,
    hsl(var(--hue-primary), 10%, 22%) 50%,
    hsl(var(--hue-primary), 10%, 18%) 100%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-rounded {
  border-radius: var(--radius-md);
}

.skeleton-circle {
  border-radius: 50%;
}
</style>
