import { ElMessage } from 'element-plus'

export function useNotification() {
  const success = (message, duration = 3000) => {
    return ElMessage.success({
      message,
      duration,
      center: true
    })
  }

  const error = (message, duration = 3000) => {
    return ElMessage.error({
      message,
      duration,
      center: true
    })
  }

  const info = (message, duration = 3000) => {
    return ElMessage.info({
      message,
      duration,
      center: true
    })
  }

  // 保持兼容性，返回空数组
  const notifications = []
  const removeNotification = () => {}
  const addNotification = () => {}

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info
  }
}