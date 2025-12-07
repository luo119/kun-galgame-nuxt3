import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GalgameResourceStoreTemp } from '~/store/types/galgame/resource'

export const useTempGalgameResourceStore = defineStore(
  'tempGalgameResource',
  () => {
    const resources = ref<GalgameResourceStoreTemp[]>([])
    const isShowPublish = ref(false)
    const rewriteResourceId = ref(0)
    const commentToUid = ref(0)

    return {
      resources,
      isShowPublish,
      rewriteResourceId,
      commentToUid
    }
  },
  {
    persist: false
  }
)
