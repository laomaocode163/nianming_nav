<script setup lang="ts">
  import { computed, ref, watch } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      placeholder?: string;
    }>(),
    { placeholder: '选择图标' }
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  // 内置常用 emoji（含名称以支持搜索）；如现有数据用到 </> 这类符号，
  // 选择器提供「自定义」输入框兜底。
  const EMOJIS: Array<{ char: string; name: string }> = [
    { char: '⭐', name: 'star star' },
    { char: '☆', name: 'star outline' },
    { char: '🔥', name: 'fire hot' },
    { char: '💡', name: 'idea light bulb' },
    { char: '⚙️', name: 'gear settings config' },
    { char: '</>', name: 'code tag' },
    { char: '📘', name: 'book blue doc' },
    { char: '📗', name: 'book green doc' },
    { char: '📙', name: 'book orange doc' },
    { char: '📚', name: 'books library' },
    { char: '📖', name: 'book open read' },
    { char: '📝', name: 'memo note write' },
    { char: '📌', name: 'pin push' },
    { char: '📎', name: 'paperclip attach' },
    { char: '✂️', name: 'scissors cut' },
    { char: '🔖', name: 'bookmark tag' },
    { char: '🏷️', name: 'label tag price' },
    { char: '🗂️', name: 'folder tabs' },
    { char: '📁', name: 'folder open' },
    { char: '📂', name: 'folder closed' },
    { char: '🗃️', name: 'card file box' },
    { char: '💼', name: 'briefcase work' },
    { char: '🧩', name: 'puzzle game' },
    { char: '🎮', name: 'game controller' },
    { char: '🕹️', name: 'joystick' },
    { char: '🎯', name: 'target dart' },
    { char: '🎲', name: 'dice' },
    { char: '🎨', name: 'art palette paint' },
    { char: '🖌️', name: 'paintbrush design' },
    { char: '🎬', name: 'movie clapper film' },
    { char: '🎭', name: 'theater masks drama' },
    { char: '🎵', name: 'music note' },
    { char: '🎶', name: 'music notes' },
    { char: '🎧', name: 'headphones listen' },
    { char: '🎤', name: 'microphone sing' },
    { char: '📺', name: 'tv television' },
    { char: '📷', name: 'camera photo' },
    { char: '🖥️', name: 'desktop computer' },
    { char: '💻', name: 'laptop computer' },
    { char: '⌨️', name: 'keyboard' },
    { char: '🖱️', name: 'mouse' },
    { char: '📱', name: 'phone mobile' },
    { char: '📡', name: 'satellite signal' },
    { char: '🔋', name: 'battery' },
    { char: '🔌', name: 'plug power' },
    { char: '💡', name: 'bulb idea' },
    { char: '🌐', name: 'globe web internet' },
    { char: '🔗', name: 'link chain' },
    { char: '🛰️', name: 'satellite' },
    { char: '🤖', name: 'robot ai' },
    { char: '🧠', name: 'brain ai think' },
    { char: '👾', name: 'alien monster' },
    { char: '⚡', name: 'lightning bolt fast' },
    { char: '🚀', name: 'rocket launch deploy' },
    { char: '🏗️', name: 'build scaffold construction' },
    { char: '🔧', name: 'wrench tool fix' },
    { char: '🔨', name: 'hammer tool' },
    { char: '🛠️', name: 'tools hammer wrench' },
    { char: '🧰', name: 'toolbox' },
    { char: '☕', name: 'coffee java' },
    { char: '🐍', name: 'snake python' },
    { char: '🌱', name: 'seedling spring plant' },
    { char: '🌟', name: 'glowing star' },
    { char: '💎', name: 'gem diamond' },
    { char: '🧪', name: 'test tube science' },
    { char: '🔬', name: 'microscope science' },
    { char: '🩺', name: 'stethoscope health' },
    { char: '📊', name: 'chart bar data' },
    { char: '📈', name: 'chart up growth' },
    { char: '📉', name: 'chart down' },
    { char: '🧮', name: 'abacus calc' },
    { char: '🔢', name: 'numbers' },
    { char: '🧬', name: 'dna biology' },
    { char: '🎓', name: 'graduation school' },
    { char: '✏️', name: 'pencil write' },
    { char: '🖊️', name: 'pen write' },
    { char: '🔍', name: 'search magnifier' },
    { char: '🔎', name: 'search zoom' },
    { char: '🗺️', name: 'map travel' },
    { char: '🌍', name: 'earth globe' },
    { char: '✈️', name: 'plane travel' },
    { char: '🚗', name: 'car drive' },
    { char: '🏠', name: 'home house' },
    { char: '🏢', name: 'office building' },
    { char: '🏪', name: 'convenience store' },
    { char: '🛒', name: 'cart shopping' },
    { char: '💰', name: 'money bag' },
    { char: '💳', name: 'card credit' },
    { char: '📦', name: 'package box' },
    { char: '🚚', name: 'truck delivery' },
    { char: '⚖️', name: 'balance law scale' },
    { char: '🏆', name: 'trophy win' },
    { char: '🥇', name: 'medal gold' },
    { char: '❤️', name: 'heart love' },
    { char: '💬', name: 'speech bubble chat' },
    { char: '👥', name: 'people group users' },
    { char: '👤', name: 'user person' },
    { char: '🔔', name: 'bell notification' },
    { char: '⏰', name: 'clock alarm time' },
    { char: '📅', name: 'calendar date' },
    { char: '🗓️', name: 'calendar spiral' },
    { char: '💬', name: 'comment' },
    { char: '📰', name: 'news newspaper' },
    { char: '📻', name: 'radio' },
    { char: '🍔', name: 'burger food' },
    { char: '☕', name: 'coffee drink' },
    { char: '🍵', name: 'tea drink' },
    { char: '🎁', name: 'gift present' },
    { char: '✅', name: 'check done' },
    { char: '❌', name: 'cross no error' },
    { char: '⚠️', name: 'warning caution' },
    { char: '❓', name: 'question help' },
    { char: '💡', name: 'bulb' },
    { char: '🔒', name: 'lock secure' },
    { char: '🔑', name: 'key' },
    { char: '🌈', name: 'rainbow' },
    { char: '☀️', name: 'sun weather' },
    { char: '🌙', name: 'moon night' },
    { char: '⭕', name: 'circle' },
    { char: '🔵', name: 'blue circle' },
    { char: '🟢', name: 'green circle' },
    { char: '🟡', name: 'yellow circle' },
    { char: '🔴', name: 'red circle' },
    { char: '⚪', name: 'white circle' },
    { char: '🆗', name: 'ok' },
    { char: '🆕', name: 'new' },
    { char: '🅰️', name: 'a' },
    { char: '🅱️', name: 'b' },
    { char: '🌀', name: 'cyclone swirl' },
  ];

  const open = ref(false);
  const query = ref('');
  const custom = ref('');

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return EMOJIS;
    return EMOJIS.filter((e) => e.name.toLowerCase().includes(q));
  });

  watch(
    () => props.modelValue,
    (v) => {
      custom.value = v;
    },
    { immediate: true }
  );

  const toggle = (): void => {
    open.value = !open.value;
    if (open.value) query.value = '';
  };

  const close = (): void => {
    open.value = false;
  };

  const select = (char: string): void => {
    emit('update:modelValue', char);
    custom.value = char;
    close();
  };

  const applyCustom = (): void => {
    const v = custom.value.trim();
    emit('update:modelValue', v);
    if (v) close();
  };
</script>

<template>
  <div class="emoji-picker">
    <button type="button" class="emoji-trigger" :class="{ active: open }" @click="toggle">
      <span v-if="modelValue" class="emoji-current">{{ modelValue }}</span>
      <span v-else class="emoji-placeholder">{{ placeholder }}</span>
    </button>

    <div v-if="open" class="emoji-catcher" @click="close"></div>

    <div v-if="open" class="emoji-popover" role="dialog" aria-label="选择图标">
      <input
        v-model="query"
        class="emoji-search"
        type="search"
        placeholder="搜索图标…"
        autocomplete="off"
      />
      <div class="emoji-grid">
        <button
          v-for="e in filtered"
          :key="e.char"
          type="button"
          class="emoji-cell"
          :title="e.name"
          @click="select(e.char)"
        >
          {{ e.char }}
        </button>
        <p v-if="filtered.length === 0" class="emoji-empty">无匹配，可下方自定义</p>
      </div>
      <div class="emoji-custom">
        <input
          v-model="custom"
          class="emoji-custom-input"
          type="text"
          placeholder="自定义符号，如 </>"
          @keyup.enter="applyCustom"
        />
        <button type="button" class="emoji-custom-btn" @click="applyCustom">使用</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .emoji-picker {
    position: relative;
  }

  .emoji-trigger {
    width: 100%;
    min-height: 40px;
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-family: inherit;
    transition:
      border-color 150ms var(--ease-out-expo),
      box-shadow 150ms var(--ease-out-expo);
  }

  .emoji-trigger.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px hsl(var(--hue-primary), 80%, 55%, 0.15);
  }

  .emoji-placeholder {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .emoji-catcher {
    position: fixed;
    inset: 0;
    z-index: 10000;
  }

  .emoji-popover {
    position: absolute;
    top: calc(100% + 0.375rem);
    left: 0;
    z-index: 10001;
    width: min(320px, 90vw);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-float);
    padding: 0.625rem;
    animation: admin-pop 180ms var(--ease-out-expo);
  }

  .emoji-search {
    width: 100%;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    font-family: inherit;
  }

  .emoji-search:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.15rem;
    max-height: 200px;
    overflow-y: auto;
    padding: 0.1rem;
  }

  .emoji-cell {
    aspect-ratio: 1;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    font-size: 1.15rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 120ms var(--ease-out-expo);
  }

  .emoji-cell:hover {
    background: hsl(var(--hue-primary), 80%, 55%, 0.12);
  }

  .emoji-empty {
    grid-column: 1 / -1;
    text-align: center;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    padding: 0.5rem;
  }

  .emoji-custom {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .emoji-custom-input {
    flex: 1;
    padding: 0.4rem 0.55rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
  }

  .emoji-custom-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .emoji-custom-btn {
    border: none;
    background: var(--gradient-primary);
    color: #fff;
    border-radius: var(--radius-md);
    padding: 0 0.85rem;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
</style>
