<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const currentDate = ref('')
const lunarDate = ref('')
const weekday = ref('')

// 农历转换函数
const getLunarDate = (date) => {
  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
  
  // 这里使用简化的农历计算，实际应用中可以使用更精确的库
  // 注意：这只是一个示例，实际农历计算需要更复杂的算法
  const month = date.getMonth()
  const day = date.getDate()
  
  return `${lunarMonths[month]}${lunarDays[day - 1]}`
}

const updateDateTime = () => {
  const now = new Date()
  
  // 更新时间
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`
  
  // 更新日期
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  currentDate.value = `${year}年${month}月${day}日`
  
  // 更新星期
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  weekday.value = weekdays[now.getDay()]
  
  // 更新农历
  lunarDate.value = getLunarDate(now)
}

let timer = null

onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="time-date-component">
    <div class="time-section">
      <div class="time-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    <div class="lunar-section">
      <div class="lunar-date">{{ lunarDate }}</div>
      <div class="lunar-label">农历</div>
    </div>
  </div>
</template>

<style scoped>
.time-date-component {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-width: 200px;
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

.lunar-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  padding-left: 1rem;
  border-left: 1px solid var(--color-border);
}

.lunar-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1;
}

.lunar-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .time-date-component {
    padding: 0.625rem 0.875rem;
    gap: 0.75rem;
    min-width: 180px;
  }
  
  .time {
    font-size: 1rem;
  }
  
  .date {
    font-size: 0.7rem;
  }
  
  .lunar-date {
    font-size: 0.8rem;
  }
  
  .lunar-label {
    font-size: 0.7rem;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 480px) {
  .time-date-component {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
    min-width: 160px;
  }
  
  .time-icon {
    width: 20px;
    height: 20px;
  }
  
  .time {
    font-size: 0.9rem;
  }
  
  .date {
    font-size: 0.65rem;
  }
  
  .lunar-date {
    font-size: 0.75rem;
  }
  
  .lunar-label {
    font-size: 0.65rem;
  }
}
</style>