import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataStore } from './data'

const SYNC_API = '/api/sync'
const DEVICE_ID_KEY = 'nianming_nav_device_id'

export const useSyncStore = defineStore('sync', () => {
  const syncStatus = ref('idle')
  const lastSyncTime = ref(null)
  const syncError = ref(null)
  const deviceId = ref('')

  const dataStore = useDataStore()

  const getDeviceId = () => {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id
  }

  const getSyncMetadata = () => {
    return {
      updatedAt: Date.now(),
      deviceId: deviceId.value,
      version: Date.now(),
      browser: navigator.userAgent,
      os: navigator.platform
    }
  }

  const pushToCloud = async (password) => {
    if (!password) {
      syncError.value = '请输入同步密码'
      return false
    }

    syncStatus.value = 'syncing'
    syncError.value = null

    try {
      const data = dataStore.exportData()
      data.meta = getSyncMetadata()

      const response = await fetch(SYNC_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Password': password
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '同步失败')
      }

      lastSyncTime.value = Date.now()
      syncStatus.value = 'synced'
      return true
    } catch (error) {
      syncStatus.value = 'error'
      syncError.value = error.message
      return false
    }
  }

  const pullFromCloud = async (password) => {
    if (!password) {
      syncError.value = '请输入同步密码'
      return false
    }

    syncStatus.value = 'syncing'
    syncError.value = null

    try {
      const response = await fetch(SYNC_API, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Password': password
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '获取数据失败')
      }

      const data = await response.json()

      if (data.links && data.categories) {
        dataStore.links = data.links
        dataStore.categories = data.categories
        if (data.settings) {
          dataStore.settings = { ...dataStore.settings, ...data.settings }
        }
        if (data.searchConfig) {
          dataStore.searchConfig = { ...dataStore.searchConfig, ...data.searchConfig }
        }
        dataStore.saveData()
      }

      lastSyncTime.value = Date.now()
      syncStatus.value = 'synced'
      return true
    } catch (error) {
      syncStatus.value = 'error'
      syncError.value = error.message
      return false
    }
  }

  const init = () => {
    deviceId.value = getDeviceId()
    const lastSync = localStorage.getItem('nianming_nav_last_sync')
    if (lastSync) {
      lastSyncTime.value = parseInt(lastSync)
    }
  }

  return {
    syncStatus,
    lastSyncTime,
    syncError,
    deviceId,
    pushToCloud,
    pullFromCloud,
    init
  }
})
