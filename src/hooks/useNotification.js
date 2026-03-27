import { ref } from 'vue'

export function useNotification() {
  const notifications = ref([])
  let notificationId = 0

  const addNotification = (message, type = 'success', duration = 3000) => {
    const id = notificationId++
    notifications.value.push({ id, message, type, duration })
    return id
  }

  const removeNotification = (id) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const success = (message, duration) => {
    return addNotification(message, 'success', duration)
  }

  const error = (message, duration) => {
    return addNotification(message, 'error', duration)
  }

  const info = (message, duration) => {
    return addNotification(message, 'info', duration)
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info
  }
}