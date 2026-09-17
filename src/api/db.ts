import Dexie, { Table } from 'dexie'

export interface RecordItem {
  id?: number
  type: 'expense' | 'income'
  amount: number
  categoryId: number
  bookId: number
  date: string
  note?: string
  createdAt: number
  updatedAt: number
}

export interface Category {
  id?: number
  type: 'expense' | 'income'
  name: string
  icon: string
  sort: number
  parentId?: number
  defaultAmount?: number
  builtin?: boolean
}

export interface Book {
  id?: number
  name: string
  icon: string
  color: string
  sort: number
  isDefault: boolean
  hidden: boolean
  createdAt: number
}

class BookkeepingDB extends Dexie {
  records!: Table<RecordItem>
  records_history!: Table<RecordItem>
  categories!: Table<Category>
  books!: Table<Book>

  constructor() {
    super('BookkeepingDB')
    this.version(1).stores({
      records: '++id, type, categoryId, bookId, date, createdAt',
      categories: '++id, type, sort',
      books: '++id, sort, isDefault'
    })
    this.version(2).stores({
      records: '++id, type, categoryId, bookId, date, createdAt',
      categories: '++id, type, sort',
      books: '++id, sort, isDefault'
    }).upgrade(async tx => {
      const newExpenseCats = [
        { type: 'expense', name: '服饰', icon: '\uD83D\uDC54', sort: 9 },
        { type: 'expense', name: '美容', icon: '\uD83D\uDC85', sort: 10 },
        { type: 'expense', name: '社交', icon: '\uD83C\uDF89', sort: 11 },
        { type: 'expense', name: '旅行', icon: '✈️', sort: 12 },
        { type: 'expense', name: '数码', icon: '\uD83D\uDCBB', sort: 13 },
        { type: 'expense', name: '汽车', icon: '\uD83D\uDE99', sort: 14 },
        { type: 'expense', name: '宠物', icon: '\uD83D\uDC31', sort: 15 },
        { type: 'expense', name: '运动', icon: '\uD83C\uDFCB️', sort: 16 },
        { type: 'expense', name: '书籍', icon: '\uD83D\uDCD6', sort: 17 },
        { type: 'expense', name: '烟酒', icon: '\uD83D\uDEAC', sort: 18 },
        { type: 'expense', name: '礼金', icon: '\uD83E\uDDE7', sort: 19 },
        { type: 'expense', name: '维修', icon: '\uD83D\uDD27', sort: 20 },
        { type: 'expense', name: '捐赠', icon: '\uD83E\uDD1D', sort: 21 },
        { type: 'expense', name: '保险', icon: '\uD83D\uDEE1️', sort: 22 },
      ]
      const newIncomeCats = [
        { type: 'income', name: '红包', icon: '\uD83E\uDDE7', sort: 104 },
        { type: 'income', name: '报销', icon: '\uD83D\uDCCB', sort: 105 },
        { type: 'income', name: '退款', icon: '↩️', sort: 106 },
        { type: 'income', name: '租金', icon: '\uD83C\uDFD8️', sort: 107 },
        { type: 'income', name: '分红', icon: '\uD83C\uDF8A', sort: 108 },
        { type: 'income', name: '中奖', icon: '\uD83C\uDFC6', sort: 109 },
        { type: 'income', name: '二手', icon: '♻️', sort: 110 },
      ]
      for (const cat of [...newExpenseCats, ...newIncomeCats]) {
        const exists = await tx.table('categories').where({ type: cat.type, name: cat.name }).count()
        if (exists === 0) {
          await tx.table('categories').add(cat)
        }
      }
    })
    this.version(3).stores({
      records: '++id, type, categoryId, bookId, date, createdAt',
      categories: '++id, type, sort, parentId',
      books: '++id, sort, isDefault'
    }).upgrade(async tx => {
      const parentNames = ['餐饮', '交通', '购物', '居住', '娱乐', '医疗', '教育', '通讯']
      const parentChildMap: Record<string, { name: string; icon: string; defaultAmount?: number }[]> = {
        '餐饮': [
          { name: '外食', icon: '\uD83C\uDF5C' },
          { name: '买菜', icon: '\uD83E\uDD6C' },
          { name: '饮料', icon: '\uD83E\uDDCB' },
          { name: '杂项', icon: '\uD83D\uDCE6' },
        ],
        '交通': [
          { name: '充电', icon: '\uD83D\uDD0C' },
          { name: '加油', icon: '⛽' },
          { name: '打车', icon: '\uD83D\uDE95' },
          { name: '车贷', icon: '\uD83D\uDE97', defaultAmount: 3000 },
        ],
        '购物': [
          { name: '衣服', icon: '\uD83D\uDC54' },
          { name: '日用品', icon: '\uD83E\uDDF4' },
          { name: '零食', icon: '\uD83C\uDF6A' },
          { name: '杂项', icon: '\uD83D\uDCE6' },
        ],
        '居住': [
          { name: '房租', icon: '\uD83C\uDFD8️' },
          { name: '房贷', icon: '\uD83C\uDFE0', defaultAmount: 5000 },
        ],
        '娱乐': [
          { name: '游戏', icon: '\uD83C\uDFAE' },
          { name: '电影', icon: '\uD83C\uDFAC' },
          { name: '聚会', icon: '\uD83C\uDF89' },
          { name: '杂项', icon: '\uD83D\uDCE6' },
        ],
        '医疗': [
          { name: '药品', icon: '\uD83D\uDC8A' },
          { name: '挂号', icon: '\uD83C\uDFE5' },
          { name: '检查', icon: '\uD83D\uDD2C' },
          { name: '杂项', icon: '\uD83D\uDCE6' },
        ],
        '教育': [
          { name: '学费', icon: '\uD83C\uDF93' },
          { name: '书本', icon: '\uD83D\uDCD6' },
          { name: '培训', icon: '\uD83D\uDCDA' },
          { name: '杂项', icon: '\uD83D\uDCE6' },
        ],
        '通讯': [
          { name: '话费', icon: '\uD83D\uDCF1' },
          { name: '网费', icon: '\uD83C\uDF10' },
          { name: '其他', icon: '\uD83D\uDCE6' },
        ],
      }
      for (const parentName of parentNames) {
        const parent = await tx.table('categories').where({ type: 'expense', name: parentName }).first()
        if (parent && parent.id) {
          const children = parentChildMap[parentName]
          if (children) {
            let childSort = 1
            for (const child of children) {
              const exists = await tx.table('categories').where({ type: 'expense', name: child.name, parentId: parent.id }).count()
              if (exists === 0) {
                await tx.table('categories').add({
                  type: 'expense',
                  name: child.name,
                  icon: child.icon,
                  sort: childSort,
                  parentId: parent.id,
                  ...(child.defaultAmount ? { defaultAmount: yuanToCents(child.defaultAmount) } : {}),
                })
              }
              childSort++
            }
          }
        }
      }
    })
    this.version(5).stores({
      records: '++id, type, categoryId, bookId, date, createdAt',
      categories: '++id, type, sort, parentId',
      books: '++id, sort, isDefault'
    }).upgrade(async tx => {
      // 统一日期格式为零填充 YYYY-MM-DD
      const allRecords = await tx.table('records').toArray()
      for (const r of allRecords) {
        if (r.date) {
          const normalized = r.date.split('-').map((p: string, i: number) => i === 0 ? p : p.padStart(2, '0')).join('-')
          if (normalized !== r.date) {
            await tx.table('records').update(r.id!, { date: normalized })
          }
        }
      }
    })
    this.version(6).stores({
      records: '++id, type, categoryId, bookId, date, createdAt',
      records_history: '++id, type, categoryId, bookId, date, createdAt',
      categories: '++id, type, sort, parentId',
      books: '++id, sort, isDefault'
    })
    this.version(7).stores({
      records: '++id, type, categoryId, bookId, date, createdAt',
      records_history: '++id, type, categoryId, bookId, date, createdAt',
      categories: '++id, type, sort, parentId',
      books: '++id, name, sort, isDefault'
    })
  }

  /**
   * 归档早于 cutoffDate 的记录到历史表
   * 返回归档的记录数
   */
  async archiveOldRecords(cutoffDate: string): Promise<number> {
    const oldRecords = await this.records.where('date').below(cutoffDate).toArray()
    if (oldRecords.length === 0) return 0
    // 批量写入历史表
    await this.records_history.bulkAdd(oldRecords)
    // 从实时表删除
    const ids = oldRecords.map(r => r.id!)
    await this.records.bulkDelete(ids)
    return oldRecords.length
  }

  /**
   * 查询可归档的记录数量
   */
  async countArchivable(beforeDate: string): Promise<number> {
    return await this.records.where('date').below(beforeDate).count()
  }

  /**
   * 获取历史表记录
   */
  async getHistoryRecordsByMonth(year: number, month: number): Promise<RecordItem[]> {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return await this.records_history
      .where('date')
      .startsWith(prefix)
      .reverse()
      .sortBy('date')
  }
}

function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100)
}

export const db = new BookkeepingDB()
