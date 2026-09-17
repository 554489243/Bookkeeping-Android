import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RecordItem } from '@/api/db'
import * as recordsApi from '@/api/records'
import { useBookStore } from './bookStore'

export const useRecordStore = defineStore('record', () => {
  const records = ref<RecordItem[]>([])
  const historyRecords = ref<RecordItem[]>([])

  const totalExpense = computed(() =>
    records.value.filter(r => r.type === 'expense').reduce((sum: number, r: RecordItem) => sum + r.amount, 0)
  )

  const totalIncome = computed(() =>
    records.value.filter(r => r.type === 'income').reduce((sum: number, r: RecordItem) => sum + r.amount, 0)
  )

  async function loadRecords() {
    records.value = await recordsApi.getAllRecords()
  }

  async function loadHistoryRecordsByMonth(year: number, month: number) {
    historyRecords.value = await recordsApi.getHistoryRecordsByMonth(year, month)
  }

  async function addRecord(data: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = await recordsApi.addRecord(data)
    await loadRecords()
    return id
  }

  async function updateRecord(id: number, data: Partial<RecordItem>) {
    await recordsApi.updateRecord(id, data)
    await loadRecords()
  }

  async function deleteRecord(id: number) {
    await recordsApi.deleteRecord(id)
    await loadRecords()
  }

  // 归档相关
  async function countArchivable(): Promise<number> {
    return await recordsApi.countArchivable()
  }

  async function doArchive(): Promise<number> {
    const count = await recordsApi.archiveOldRecords()
    await loadRecords()
    return count
  }

  return {
    records,
    historyRecords,
    totalExpense,
    totalIncome,
    loadRecords,
    loadHistoryRecordsByMonth,
    addRecord,
    updateRecord,
    deleteRecord,
    countArchivable,
    doArchive
  }
})
