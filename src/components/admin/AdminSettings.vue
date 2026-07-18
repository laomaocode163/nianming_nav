<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { hexToRgbString, rgbStringToHex } from '../../utils/color';
  import { Image, Palette, Search, ShieldCheck } from 'lucide-vue-next';
  import type { BackgroundConfig } from '../../types';
  import AdminSearch from './AdminSearch.vue';
  import IntegrityCheck from './IntegrityCheck.vue';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();

  type Tab = 'appearance' | 'background' | 'search' | 'integrity';
  const tab = ref<Tab>('appearance');
  const tabs: { key: Tab; label: string; icon: unknown }[] = [
    { key: 'appearance', label: '外观', icon: Palette },
    { key: 'background', label: '背景', icon: Image },
    { key: 'search', label: '搜索源', icon: Search },
    { key: 'integrity', label: '数据检查', icon: ShieldCheck },
  ];

  /* ---------- 外观：主题色（只读展示） ---------- */
  const accentRgb = computed(() => adminStore.settings.accentColor ?? '');
  const accentHex = computed(() => rgbStringToHex(accentRgb.value));

  /* ---------- 数据检查 ---------- */
  const checkShow = ref(false);
  const openCheck = (): void => {
    checkShow.value = true;
  };

  /* ---------- 背景：只读展示 ---------- */
  const BG_TYPES = [
    { value: 'default', label: '默认' },
    { value: 'solid', label: '纯色' },
    { value: 'gradient', label: '渐变' },
    { value: 'image', label: '图片' },
  ] as const;

  const FIT_LABELS: Record<string, string> = {
    cover: '覆盖',
    contain: '包含',
    repeat: '平铺',
  };

  const defaultBg = (): BackgroundConfig => ({
    type: 'default',
    value: '',
    fit: 'cover',
    showBlobs: true,
  });

  const bg = computed<BackgroundConfig>(() => ({
    ...defaultBg(),
    ...(adminStore.settings.background ?? {}),
  }));

  const bgTypeLabel = computed(
    () => BG_TYPES.find((t) => t.value === bg.value.type)?.label ?? '默认'
  );

  const previewStyle = computed<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    const v = bg.value;
    if (v.type === 'solid' || v.type === 'gradient') {
      s.background = v.value || 'var(--color-bg)';
    } else if (v.type === 'image') {
      s.backgroundImage = v.value ? `url("${v.value}")` : 'var(--color-bg)';
      s.backgroundSize = v.fit ?? 'cover';
      s.backgroundPosition = 'center';
      s.backgroundRepeat = v.fit === 'repeat' ? 'repeat' : 'no-repeat';
    } else {
      s.background = 'var(--color-bg)';
    }
    return s;
  });
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">设置查看</h1>
        <p class="adm-page__subtitle">只读查看站点外观、搜索引擎与数据完整性配置</p>
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
        <div class="admin-preview" :style="{ background: accentHex }">
          <Palette :size="18" :stroke-width="1.6" />
          <span>主色预览</span>
        </div>
        <span class="adm-toolbar__spacer"></span>
        <span class="adm-toolbar__count">RGB：{{ accentRgb || '未设置' }}</span>
      </div>
      <div class="admin-card">
        <p class="admin-section-title">当前主色</p>
        <div class="adm-readonly-row">
          <span class="adm-color-chip" :style="{ background: accentHex }"></span>
          <span class="mono">{{ accentHex }}</span>
          <span class="adm-muted mono">RGB {{ hexToRgbString(accentHex) }}</span>
        </div>
      </div>
      <p class="admin-hint">主题色来自 <code>settings.json</code>，此面板仅供只读查看。</p>
    </div>

    <div v-show="tab === 'background'">
      <div class="adm-toolbar">
        <div class="admin-bg-preview" :style="previewStyle">
          <span class="admin-bg-preview__label">
            {{ bg.type === 'default' ? '默认弥散光斑' : '当前背景' }}
          </span>
        </div>
        <span class="adm-toolbar__spacer"></span>
        <span class="adm-toolbar__count">类型：{{ bgTypeLabel }}</span>
      </div>

      <div class="admin-card">
        <p class="admin-section-title">背景配置</p>
        <dl class="adm-desc">
          <div class="adm-desc__row">
            <dt>类型</dt>
            <dd>{{ bgTypeLabel }}</dd>
          </div>
          <div
            v-if="bg.type === 'solid' || bg.type === 'gradient' || bg.type === 'image'"
            class="adm-desc__row"
          >
            <dt>{{ bg.type === 'image' ? '图片地址' : '值' }}</dt>
            <dd class="mono adm-desc__value">{{ bg.value || '—' }}</dd>
          </div>
          <div v-if="bg.type === 'image'" class="adm-desc__row">
            <dt>填充方式</dt>
            <dd>{{ FIT_LABELS[bg.fit ?? 'cover'] ?? bg.fit }}</dd>
          </div>
          <div class="adm-desc__row">
            <dt>弥散光斑</dt>
            <dd>{{ bg.showBlobs ? '显示' : '隐藏' }}</dd>
          </div>
        </dl>
      </div>
      <p class="admin-hint">背景配置来自 <code>settings.json</code>，此面板仅供只读查看。</p>
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
  .adm-readonly-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .adm-color-chip {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
  }
  .adm-desc {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .adm-desc__row {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
  }
  .adm-desc__row dt {
    flex: 0 0 96px;
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }
  .adm-desc__row dd {
    margin: 0;
    flex: 1;
    min-width: 0;
    font-size: 0.875rem;
    word-break: break-all;
  }
  .adm-desc__value {
    word-break: break-all;
  }
  /* ---------- 背景预览 ---------- */
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
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
</style>
