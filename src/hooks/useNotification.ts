import { ElMessage } from 'element-plus'

export function useNotification() {
  const success = (message: string, duration: number = 3000) => {
    return ElMessage.success({
      message,
      duration
    })
  }

  const error = (message: string, duration: number = 3000) => {
    return ElMessage.error({
      message,
      duration
    })
  }

  const info = (message: string, duration: number = 3000) => {
    return ElMessage.info({
      message,
      duration
    })
  }

  // 保持兼容性，返回空数组
  const notifications: never[] = []
  const removeNotification = (): void => {}
  const addNotification = (): void => {}

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info
  }
}