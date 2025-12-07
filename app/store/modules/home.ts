import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { HomeStorePersist } from '../types/home'

export const usePersistKUNGalgameHomeStore = defineStore(
  'KUNGalgameHome',
  () => {
    const fold = reactive<HomeStorePersist['fold']>({
      updates: true,
      topics: true,
      galgames: true,
      resources: true,
      sitemaps: true
    })

    return { fold }
  },
  {
    persist: true
  }
)
