<script setup lang="ts">
  import { computed } from 'vue';
  import {
    Star,
    Bot,
    Terminal,
    BookOpen,
    Zap,
    Blocks,
    Rocket,
    FileCode,
    FileText,
    Coffee,
    Braces,
    Leaf,
    Link,
    Hammer,
    Palette,
    Newspaper,
    Gamepad2,
    Film,
    Clapperboard,
    Music,
    Library,
    Monitor,
    ShieldCheck,
    Globe,
    Wrench,
    Pencil,
    Image,
    Video,
    Rss,
    Puzzle,
    type LucideIcon,
  } from 'lucide-vue-next';

  const props = withDefaults(
    defineProps<{
      name: string;
      strokeWidth?: number;
    }>(),
    {
      strokeWidth: 2,
    }
  );

  // 名称 → Lucide 图标的映射；新增分类图标时在此登记即可。
  const iconMap: Record<string, LucideIcon> = {
    star: Star,
    bot: Bot,
    terminal: Terminal,
    'book-open': BookOpen,
    zap: Zap,
    blocks: Blocks,
    rocket: Rocket,
    'file-code': FileCode,
    'file-text': FileText,
    coffee: Coffee,
    braces: Braces,
    leaf: Leaf,
    link: Link,
    hammer: Hammer,
    palette: Palette,
    newspaper: Newspaper,
    'gamepad-2': Gamepad2,
    film: Film,
    clapperboard: Clapperboard,
    music: Music,
    library: Library,
    monitor: Monitor,
    'shield-check': ShieldCheck,
    globe: Globe,
    wrench: Wrench,
    pencil: Pencil,
    image: Image,
    video: Video,
    rss: Rss,
    puzzle: Puzzle,
  };

  const icon = computed(() => iconMap[props.name] ?? Star);
</script>

<template>
  <component :is="icon" class="cat-icon" :stroke-width="strokeWidth" />
</template>

<style scoped>
  .cat-icon {
    width: 1em;
    height: 1em;
    display: block;
  }
</style>
