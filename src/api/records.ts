import { db, RecordItem } from './db'
import dayjs from 'dayjs'

/** 归档截止日期：当前日期 - 1 年 */
export function getArchiveCutoffDate(): string {
  return dayjs().subtract(1, 'year').format('YYYY-MM-DD')
}

/** 执行归档：将 1 年前的记录移到历史表 */
export async function archiveOldRecords(): Promise<number> {
  const cutoff = getArchiveCutoffDate()
  return await db.archiveOldRecords(cutoff)
}

/** 查询可归档记录数 */
export async function countArchivable(): Promise<number> {
  return await db.countArchivable(getArchiveCutoffDate())
}

/** 获取历史表月度记录 */
export async function getHistoryRecordsByMonth(year: number, month: number) {
  return await db.getHistoryRecordsByMonth(year, month)
}

/** 启动时自动归档（静默） */
export async function maintainArchive(): Promise<void> {
  try {
    const count = await countArchivable()
    if (count > 0) {
      await archiveOldRecords()
    }
  } catch {
    // 归档失败不影响正常使用
  }
}

export async function addRecord(data: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now()
  return await db.records.add({
    ...data,
    createdAt: now,
    updatedAt: now
  })
}

export async function updateRecord(id: number, data: Partial<RecordItem>) {
  return await db.records.update(id, {
    ...data,
    updatedAt: Date.now()
  })
}

export async function deleteRecord(id: number) {
  return await db.records.delete(id)
}

export async function getRecordById(id: number) {
  return await db.records.get(id)
}

export async function getAllRecords() {
  return await db.records.orderBy('createdAt').reverse().toArray()
}

export async function getRecordsByBook(bookId: number) {
  return await db.records.where('bookId').equals(bookId).reverse().sortBy('date')
}

export async function getAllRecordsByMonth(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return await db.records
    .where('date')
    .startsWith(prefix)
    .reverse()
    .sortBy('date')
}

export async function getRecordsByMonth(year: number, month: number) {
  return await getAllRecordsByMonth(year, month)
}

export async function getRecordsByDate(date: string) {
  return await db.records.where('date').equals(date).toArray()
}

export async function getCategoryStatsByDateRange(startDate: string, endDate: string, type?: 'expense' | 'income', bookId?: number) {
  let records = await db.records.where('date').between(startDate, endDate).toArray()
  // 同时查询历史表
  const historyRecords = await db.records_history.where('date').between(startDate, endDate).toArray()
  records = records.concat(historyRecords)
  if (type) records = records.filter(r => r.type === type)
  if (bookId) records = records.filter(r => r.bookId === bookId)
  const map = new Map<number, number>()
  records.forEach(r => map.set(r.categoryId, (map.get(r.categoryId) || 0) + r.amount))
  return map
}

export async function getTrendByDateRange(startDate: string, endDate: string, bookId?: number, groupBy: 'day' | 'month' = 'day') {
  let records = await db.records.where('date').between(startDate, endDate).toArray()
  // 同时查询历史表
  const historyRecords = await db.records_history.where('date').between(startDate, endDate).toArray()
  records = records.concat(historyRecords)
  if (bookId) records = records.filter(r => r.bookId === bookId)
  const map = new Map<string, { expense: number; income: number }>()
  records.forEach(r => {
    const key = groupBy === 'month' ? r.date.substring(0, 7) : r.date
    const entry = map.get(key) || { expense: 0, income: 0 }
    if (r.type === 'expense') entry.expense += r.amount
    else entry.income += r.amount
    map.set(key, entry)
  })
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, data]) => ({ label, ...data }))
}

export async function getMonthTotal(year: number, month: number) {
  const records = await getAllRecordsByMonth(year, month)
  return records.reduce((sum, r) => sum + r.amount, 0)
}

export async function getDayTotal(date: string) {
  const records = await getRecordsByDate(date)
  return records.reduce((sum, r) => sum + r.amount, 0)
}

export async function getLast6MonthsData(bookId?: number) {
  const result: { label: string; expense: number; income: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = dayjs().subtract(i, 'month')
    let records = await getAllRecordsByMonth(d.year(), d.month() + 1)
    if (bookId) {
      records = records.filter(r => r.bookId === bookId)
    }
    const expense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
    result.push({ label: `${d.month() + 1}月`, expense, income })
  }
  return result
}

export async function getCategoryStats(year: number, month: number, type?: 'expense' | 'income', bookId?: number) {
  let records = await getAllRecordsByMonth(year, month)
  if (type) {
    records = records.filter(r => r.type === type)
  }
  if (bookId) {
    records = records.filter(r => r.bookId === bookId)
  }
  const map = new Map<number, number>()
  records.forEach(r => {
    map.set(r.categoryId, (map.get(r.categoryId) || 0) + r.amount)
  })
  return map
}
