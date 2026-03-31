import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 响应式断点配置
 * 遵循 Tailwind CSS 默认断点规范
 * sm: 640px - 小屏幕手机
 * md: 768px - 平板/大屏手机
 * lg: 1024px - 小型桌面/平板横屏
 * xl: 1280px - 标准桌面
 * 2xl: 1536px - 大屏桌面
 */
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

/**
 * 检测是否为触摸设备
 * 通过检查 touch 事件支持和 max-touch-points 来判断
 * 这样可以区分触摸设备和纯鼠标设备
 */
const isTouchDevice = () => {
  return 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
}

/**
 * 响应式管理 Hook
 * 提供统一的响应式状态管理，避免多个组件重复监听窗口大小变化
 * 使用 resize 事件监听，在组件卸载时自动清理
 */
export function useResponsive() {
  // 当前窗口宽度
  const windowWidth = ref(window.innerWidth)
  // 当前窗口高度
  const windowHeight = ref(window.innerHeight)
  // 是否为触摸设备
  const isTouch = ref(false)

  /**
   * 更新窗口尺寸状态
   * 在 resize 事件触发时调用
   */
  const updateWindowSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  /**
   * 响应式断点状态计算属性
   * 这些属性基于当前窗口宽度动态计算
   */
  // 是否大于等于 sm 断点 (>= 640px)
  const isSm = computed(() => windowWidth.value >= breakpoints.sm)
  // 是否大于等于 md 断点 (>= 768px)
  const isMd = computed(() => windowWidth.value >= breakpoints.md)
  // 是否大于等于 lg 断点 (>= 1024px)
  const isLg = computed(() => windowWidth.value >= breakpoints.lg)
  // 是否大于等于 xl 断点 (>= 1280px)
  const isXl = computed(() => windowWidth.value >= breakpoints.xl)
  // 是否大于等于 2xl 断点 (>= 1536px)
  const is2xl = computed(() => windowWidth.value >= breakpoints['2xl'])

  /**
   * 设备类型判断
   * 基于断点组合判断当前设备类型
   */
  // 移动端：< 768px
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  // 平板：768px - 1023px
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  // 桌面端：>= 1024px
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
  // 小屏幕手机：< 640px
  const isSmallMobile = computed(() => windowWidth.value < breakpoints.sm)

  /**
   * 屏幕方向判断
   */
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)
  const isPortrait = computed(() => windowWidth.value <= windowHeight.value)

  onMounted(() => {
    // 初始化触摸设备检测
    isTouch.value = isTouchDevice()
    // 添加 resize 事件监听
    window.addEventListener('resize', updateWindowSize)
  })

  onUnmounted(() => {
    // 清理 resize 事件监听，避免内存泄漏
    window.removeEventListener('resize', updateWindowSize)
  })

  return {
    // 原始尺寸
    windowWidth,
    windowHeight,
    // 断点状态
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    // 设备类型
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    // 屏幕方向
    isLandscape,
    isPortrait,
    // 触摸设备
    isTouch
  }
}

export default useResponsive
