<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';

  const currentTime = ref('');
  const currentDate = ref('');
  const solarDate = ref('');
  const weekday = ref('');

  /** 将公历日期映射为中文月份与日期 */
  const getSolarDate = (date: Date): string => {
    const solarMonths = [
      '正月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ];
    const solarDays = [
      '初一',
      '初二',
      '初三',
      '初四',
      '初五',
      '初六',
      '初七',
      '初八',
      '初九',
      '初十',
      '十一',
      '十二',
      '十三',
      '十四',
      '十五',
      '十六',
      '十七',
      '十八',
      '十九',
      '二十',
      '廿一',
      '廿二',
      '廿三',
      '廿四',
      '廿五',
      '廿六',
      '廿七',
      '廿八',
      '廿九',
      '三十',
    ];

    const month = date.getMonth();
    const day = date.getDate();

    return `${solarMonths[month]}${solarDays[day - 1]}`;
  };

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // 日期 / 星期 / 农历仅在「分钟」变化时重算，避免每秒重建这些不变字符串
  let lastMinuteKey = '';
  const updateDateParts = (now: Date): void => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    currentDate.value = `${year}年${month}月${day}日`;
    weekday.value = weekdays[now.getDay()];
    solarDate.value = getSolarDate(now);
  };

  const updateDateTime = () => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    currentTime.value = `${hours}:${minutes}:${seconds}`;

    // 跨分钟（含跨天）才重算日期相关字段
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getMinutes()}`;
    if (minuteKey !== lastMinuteKey) {
      lastMinuteKey = minuteKey;
      updateDateParts(now);
    }
  };

  let timer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    updateDateTime();
    timer = setInterval(updateDateTime, 1000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });
</script>

<template>
  <div class="time-date-component">
    <div class="time-section">
      <div class="time-icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <div class="time-content">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }} {{ weekday }}</div>
      </div>
    </div>
    <div class="solar-section">
      <div class="solar-date">{{ solarDate }}</div>
    </div>
  </div>
</template>

<style scoped>
  .time-date-component {
    display: flex;
    align-items: center;
    gap: 1rem;
    height: 52px;
    padding: 0 1rem;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    min-width: 200px;
    transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .time-date-component:hover {
    box-shadow: var(--shadow-md);
  }

  .time-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .time-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .time-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .time {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1;
  }

  .date {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    line-height: 1;
  }

  .solar-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    padding-left: 1rem;
    border-left: 1px solid var(--color-border);
  }

  .solar-date {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1;
  }

  /* 平板适配 - 组件在移动端被隐藏，仅需处理平板尺寸 */
  @media (max-width: 1024px) and (min-width: 769px) {
    .time-date-component {
      padding: 0 0.875rem;
      gap: 0.75rem;
      min-width: 180px;
    }

    .time {
      font-size: 1rem;
    }

    .date {
      font-size: 0.7rem;
    }

    .solar-date {
      font-size: 0.8rem;
    }
  }
</style>
