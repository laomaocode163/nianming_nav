import { ElMessage } from 'element-plus'

export function useNotification() {
  const success = (message: string, duration: number = 3000) => {
    return ElMessage.success({ message, duration })
  }

  const error = (message: string, duration: number = 3000) => {
    return ElMessage.error({ message, duration })
  }

  const info = (message: string, duration: number = 3000) => {
    return ElMessage.info({ message, duration })
  }

  return { success, error, info }
}