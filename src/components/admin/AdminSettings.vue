<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { useSettingsStore } from '../../stores/settings';
  import { showToast } from '../../composables/useToast';
  import { handleAdminError } from '../../composables/useAdminToast';
  import { ACCENT_PRESETS, hexToRgbString, rgbStringToHex } from '../../utils/color';
  import { Image, Palette, Search, ShieldCheck } from 'lucide-vue-next';
  import type { BackgroundConfig, SiteSettings } from '../../types';
  import AdminSearch from './AdminSearch.vue';
  import IntegrityCheck from './IntegrityCheck.vue';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();
  const settingsStore = useSettingsStore();

  type Tab = 'appearance' | 'background' | 'search' | 'integrity';
  const tab = ref<Tab>('appearance');
  const tabs: { key: Tab; label: string; icon: unknown }[] = [
    { key: 'appearance', label: '外观', icon: Palette },
    { key: 'background', label: '背景', icon: Image },
    { key: 'search', label: '搜索源', icon: Search },
    { key: 'integrity', label: '数据检查', icon: ShieldCheck },
  ];

  /* ---------- 外观：主题色 ---------- */
  const DEFAULT_HEX = '#0EA5E9';
  const hex = ref(rgbStringToHex(adminStore.settings.accentColor));
  const savedRgb = ref(adminStore.settings.accentColor ?? '');
  const dirty = computed(() => hexToRgbString(hex.value) !== savedRgb.value);

  const applyPreview = (value: string): void => {
    settingsStore.settings.accentColor = hexToRgbString(value);
  };
  const onInput = (value: string): void => {
    hex.value = value;
    applyPreview(value);
  };
  const selectPreset = (value: string): void => onInput(value);
  const restoreDefault = (): void => onInput(DEFAULT_HEX);
  const buildSettings = (): SiteSettings => ({
    ...adminStore.settings,
    accentColor: hexToRgbString(hex.value),
    background: { ...bg },
  });

  const save = async (): Promise<void> => {
    try {
      await adminStore.saveSettings(buildSettings());
      savedRgb.value = hexToRgbString(hex.value);
      showToast('已保存主题色');
    } catch (e) {
      handleAdminError(e, '保存失败');
    }
  };
  watch(
    () => adminStore.settings.accentColor,
    (v) => {
      if (!dirty.value) hex.value = rgbStringToHex(v);
    }
  );

  /* ---------- 数据检查 ---------- */
  const checkShow = ref(false);
  const openCheck = (): void => {
    checkShow.value = true;
  };

  /* ---------- 背景：导航页自定义 ---------- */
  const BG_TYPES = [
    { value: 'default', label: '默认' },
    { value: 'solid', label: '纯色' },
    { value: 'gradient', label: '渐变' },
    { value: 'image', label: '图片' },
  ] as const;

  const GRADIENT_PRESETS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ];

  const defaultBg = (): BackgroundConfig => ({
    type: 'default',
    value: '',
    fit: 'cover',
    showBlobs: true,
  });

  const bg = reactive<BackgroundConfig>({
    ...defaultBg(),
    ...(adminStore.settings.background ?? {}),
  });
  const savedBg = ref<BackgroundConfig>({ ...bg });

  const bgDirty = computed(() => JSON.stringify(bg) !== JSON.stringify(savedBg.value));

  // 实时预览：同步到 settingsStore，由其 watch 触发 apply() 即时反映到导航页
  watch(
    bg,
    () => {
      settingsStore.settings.background = { ...bg };
    },
    { deep: true }
  );

  const previewStyle = computed<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    if (bg.type === 'solid' || bg.type === 'gradient') {
      s.background = bg.value || 'var(--color-bg)';
    } else if (bg.type === 'image') {
      s.backgroundImage = bg.value ? `url("${bg.value}")` : 'var(--color-bg)';
      s.backgroundSize = bg.fit;
      s.backgroundPosition = 'center';
      s.backgroundRepeat = bg.fit === 'repeat' ? 'repeat' : 'no-repeat';
    } else {
      s.background = 'var(--color-bg)';
    }
    return s;
  });

  const saveBg = async (): Promise<void> => {
    try {
      await adminStore.saveSettings(buildSettings());
      savedBg.value = { ...bg };
      showToast('已保存背景设置');
    } catch (e) {
      handleAdminError(e, '保存失败');
    }
  };
  const resetBg = (): void => {
    Object.assign(bg, savedBg.value);
  };
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">设置</h1>
        <p class="adm-page__subtitle">站点外观、搜索引擎与数据完整性配置</p>
      </div>
    </div>

    <div class="adm-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="adm-tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        <component :is="t.icon" :size="16" :stroke-width="1.6" />
        {{ t.label }}
      </button>
    </div>

    <div v-show="tab === 'appearance'">
      <div class="adm-toolbar">
        <div class="admin-preview" :style="{ background: hex }">
          <Palette :size="18" :stroke-width="1.6" />
          <span>主色预览</span>
        </div>
        <span class="adm-toolbar__spacer"></span>
        <span class="adm-toolbar__count">RGB：{{ hexToRgbString(hex) }}</span>
      </div>
      <div class="admin-card">
        <p class="admin-section-title">选择主色</p>
        <div class="admin-color-row">
          <input
            class="admin-color-input"
            type="color"
            :value="hex"
            aria-label="选择主色"
            @input="onInput(($event.target as HTMLInputElement).value)"
          />
          <input
            class="admin-input admin-hex-input"
            type="text"
            :value="hex"
            aria-label="十六进制颜色值"
            @change="onInput(($event.target as HTMLInputElement).value)"
          />
        </div>
        <p class="admin-section-title">预设色板</p>
        <div class="admin-swatches">
          <button
            v-for="c in ACCENT_PRESETS"
            :key="c"
            class="admin-swatch"
            :class="{ active: hex.toLowerCase() === c.toLowerCase() }"
            :style="{ background: c }"
            :aria-label="`选择 ${c}`"
            @click="selectPreset(c)"
          ></button>
        </div>
        <div class="admin-modal-actions">
          <button class="admin-btn admin-btn-ghost" :disabled="!dirty" @click="restoreDefault">
            恢复默认
          </button>
          <button class="admin-btn admin-btn-primary" :disabled="!dirty" @click="save">
            保存主题色
          </button>
        </div>
      </div>
      <p class="admin-hint">改动会实时预览，保存后写入 <code>settings.json</code> 并应用到前台。</p>
    </div>

    <div v-show="tab === 'background'">
      <div class="adm-toolbar">
        <div class="admin-bg-preview" :style="previewStyle">
          <span class="admin-bg-preview__label">
            {{ bg.type === 'default' ? '默认弥散光斑' : '实时预览' }}
          </span>
        </div>
        <span class="adm-toolbar__spacer"></span>
        <span class="adm-toolbar__count">
          类型：{{ BG_TYPES.find((t) => t.value === bg.type)?.label }}
        </span>
      </div>

      <div class="admin-card">
        <p class="admin-section-title">背景类型</p>
        <div class="adm-seg">
          <button
            v-for="opt in BG_TYPES"
            :key="opt.value"
            class="adm-seg__item"
            :class="{ active: bg.type === opt.value }"
            @click="bg.type = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <template v-if="bg.type === 'solid'">
          <p class="admin-section-title">纯色</p>
          <div class="admin-color-row">
            <input
              class="admin-color-input"
              type="color"
              :value="bg.value || '#0ea5e9'"
              aria-label="选择背景色"
              @input="bg.value = ($event.target as HTMLInputElement).value"
            />
            <input
              class="admin-input admin-hex-input"
              type="text"
              :value="bg.value"
              aria-label="背景色十六进制值"
              @change="bg.value = ($event.target as HTMLInputElement).value"
            />
          </div>
        </template>

        <template v-else-if="bg.type === 'gradient'">
          <p class="admin-section-title">渐变（CSS）</p>
          <input
            class="admin-input"
            type="text"
            :value="bg.value"
            aria-label="渐变 CSS"
            placeholder="linear-gradient(...)"
            @change="bg.value = ($event.target as HTMLInputElement).value"
          />
          <p class="admin-section-title">预设渐变</p>
          <div class="admin-swatches admin-gradients">
            <button
              v-for="g in GRADIENT_PRESETS"
              :key="g"
              class="admin-gradient"
              :class="{ active: bg.value === g }"
              :style="{ background: g }"
              :aria-label="`使用渐变 ${g}`"
              @click="bg.value = g"
            ></button>
          </div>
        </template>

        <template v-else-if="bg.type === 'image'">
          <p class="admin-section-title">图片地址（URL）</p>
          <input
            class="admin-input"
            type="text"
            :value="bg.value"
            aria-label="背景图片 URL"
            placeholder="https://..."
            autocomplete="off"
            @change="bg.value = ($event.target as HTMLInputElement).value"
          />
          <p class="admin-section-title">填充方式</p>
          <div class="adm-seg adm-seg--sm">
            <button
              class="adm-seg__item"
              :class="{ active: bg.fit === 'cover' }"
              @click="bg.fit = 'cover'"
            >
              覆盖
            </button>
            <button
              class="adm-seg__item"
              :class="{ active: bg.fit === 'contain' }"
              @click="bg.fit = 'contain'"
            >
              包含
            </button>
            <button
              class="adm-seg__item"
              :class="{ active: bg.fit === 'repeat' }"
              @click="bg.fit = 'repeat'"
            >
              平铺
            </button>
          </div>
        </template>

        <template v-else>
          <p class="adm-muted" style="font-size: 0.875rem; margin: 0">
            使用站点默认的弥散光斑背景。可在下方开关控制是否显示光斑。
          </p>
        </template>

        <p class="admin-section-title">弥散光斑</p>
        <div class="admin-switch-row">
          <span>显示弥散光斑层</span>
          <AdminSwitch v-model="bg.showBlobs" />
        </div>

        <div class="admin-modal-actions">
          <button class="admin-btn admin-btn-ghost" :disabled="!bgDirty" @click="resetBg">
            撤销
          </button>
          <button class="admin-btn admin-btn-primary" :disabled="!bgDirty" @click="saveBg">
            保存背景
          </button>
        </div>
      </div>
      <p class="admin-hint">
        改动会实时预览，保存后写入 <code>settings.json</code> 并应用到导航页。
      </p>
    </div>

    <div v-show="tab === 'search'">
      <AdminSearch />
    </div>

    <div v-show="tab === 'integrity'">
      <div class="admin-card">
        <p class="admin-section-title">数据完整性</p>
        <p class="adm-muted" style="font-size: 0.875rem; margin: 0 0 1rem">
          检查链接与分类的引用完整性（如悬空的分类 / 子分类引用、重复 ID 等），确保前台渲染正常。
        </p>
        <button class="admin-btn admin-btn-primary" @click="openCheck">
          <ShieldCheck :size="16" :stroke-width="1.6" /> 运行数据检查
        </button>
      </div>
    </div>

    <IntegrityCheck :show="checkShow" @close="checkShow = false" />
  </div>
</template>

<style scoped>
  .adm-tabs {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }
  .adm-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.65rem 1rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: -1px;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast);
    font-family: inherit;
  }
  .adm-tab:hover {
    color: var(--color-primary);
  }
  .adm-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
  .admin-preview {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: 0.5rem;
    color: #fff;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .admin-card {
    margin-top: 0.25rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background: var(--color-card);
  }
  .admin-color-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .admin-color-input {
    width: 48px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: none;
    cursor: pointer;
  }
  .admin-hex-input {
    flex: 1;
    max-width: 160px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    text-transform: uppercase;
  }
  .admin-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  .admin-swatch {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .admin-swatch:hover {
    transform: scale(1.08);
  }
  .admin-swatch.active {
    border-color: var(--color-text);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6) inset;
  }
  .admin-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  /* ---------- 背景配置 ---------- */
  .admin-bg-preview {
    flex: 1;
    min-height: 140px;
    border-radius: 0.75rem;
    border: 1px solid var(--color-border);
    display: flex;
    align-items: flex-end;
    padding: 0.75rem;
    overflow: hidden;
    transition: background 0.25s ease;
  }
  .admin-bg-preview__label {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    color: #0f172a;
    backdrop-filter: blur(4px);
  }
  .adm-seg {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 0.6rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }
  .adm-seg__item {
    padding: 0.45rem 0.95rem;
    border: none;
    border-radius: 0.45rem;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }
  .adm-seg__item:hover {
    color: var(--color-primary);
  }
  .adm-seg__item.active {
    background: var(--gradient-primary);
    color: #fff;
  }
  .adm-seg--sm .adm-seg__item {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
  }
  .admin-gradients {
    gap: 0.6rem;
  }
  .admin-gradient {
    width: 56px;
    height: 36px;
    border-radius: 0.5rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .admin-gradient:hover {
    transform: scale(1.06);
  }
  .admin-gradient.active {
    border-color: var(--color-text);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6) inset;
  }
  .admin-switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
  }
</style>
