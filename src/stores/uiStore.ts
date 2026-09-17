import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const activeTab = ref('home')
  const filterMonth = ref('')
  const filterCategoryId = ref<number | null>(null)

  return {
    activeTab,
    filterMonth,
    filterCategoryId
  }
})
