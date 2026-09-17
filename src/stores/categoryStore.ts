import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Category } from '@/api/db'
import * as categoriesApi from '@/api/categories'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])

  const expenseCategories = computed(() => categories.value.filter(c => c.type === 'expense'))
  const incomeCategories = computed(() => categories.value.filter(c => c.type === 'income'))

  const expenseParentCategories = computed(() =>
    categories.value.filter((c: Category) => c.type === 'expense' && !c.parentId)
      .sort((a: Category, b: Category) => a.sort - b.sort)
  )
  const incomeParentCategories = computed(() =>
    categories.value.filter((c: Category) => c.type === 'income' && !c.parentId)
      .sort((a: Category, b: Category) => a.sort - b.sort)
  )

  function getChildCategories(parentId: number) {
    return categories.value
      .filter((c: Category) => c.parentId === parentId)
      .sort((a: Category, b: Category) => a.sort - b.sort)
  }

  async function init() {
    await categoriesApi.initCategories()
    await loadCategories()
  }

  async function loadCategories() {
    categories.value = await categoriesApi.getAllCategories()
  }

  function getById(id: number) {
    return categories.value.find(c => c.id === id)
  }

  function getParentId(categoryId: number): number {
    const cat = categories.value.find(c => c.id === categoryId)
    if (!cat || !cat.id) return categoryId
    return cat.parentId || cat.id
  }

  async function addCategory(data: Omit<Category, 'id'>) {
    const id = await categoriesApi.addCategory(data)
    await loadCategories()
    return id
  }

  async function updateCategory(id: number, data: Partial<Category>) {
    await categoriesApi.updateCategory(id, data)
    await loadCategories()
  }

  async function deleteCategory(id: number) {
    await categoriesApi.deleteCategory(id)
    await loadCategories()
  }

  return {
    categories,
    expenseCategories,
    incomeCategories,
    expenseParentCategories,
    incomeParentCategories,
    getChildCategories,
    init,
    loadCategories,
    getById,
    getParentId,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
