import { db, Book } from './db'

/**
 * 清理重复的「日常」账本（修复历史 bug 导致的重复创建）
 * 保留有 isDefault 的那个，其余的记录合并后删除
 */
export async function cleanupDuplicateDailyBooks() {
  const all = await db.books.toArray()
  const dailyBooks = all.filter(b => b.name === '日常')
  if (dailyBooks.length <= 1) return

  // 优先保留有 isDefault 的，否则保留第一个
  const kept = dailyBooks.find(b => b.isDefault) || dailyBooks[0]
  const duplicates = dailyBooks.filter(b => b.id !== kept.id)

  // 把重复账本的记录合并到保留的账本
  for (const dup of duplicates) {
    const records = await db.records.where('bookId').equals(dup.id!).toArray()
    if (records.length > 0) {
      await db.records.bulkPut(records.map(r => ({ ...r, bookId: kept.id! })))
    }
    await db.books.delete(dup.id!)
  }

  // 确保保留的账本有 isDefault
  if (!kept.isDefault) {
    await db.books.update(kept.id!, { isDefault: true })
  }
}

export async function initDefaultBook() {
  // 0. 先清理重复的「日常」账本
  await cleanupDuplicateDailyBooks()

  // 1. 按 isDefault 查找
  const existing = await db.books.where('isDefault').equals(1).first()
  if (existing) return

  // 2. 按书名"日常"查找（兼容旧版本创建的账本，不用 name 索引也能查）
  const allBooks = await db.books.toArray()
  const oldDaily = allBooks.find(b => b.name === '日常')
  if (oldDaily) {
    await db.books.update(oldDaily.id!, { isDefault: true })
    return
  }

  // 3. 没有任何默认账本时创建
  await db.books.add({
    name: '日常',
    icon: '📱',
    color: '#1989fa',
    sort: 1,
    isDefault: true,
    hidden: false,
    createdAt: Date.now()
  })
}

export async function getAllBooks() {
  return await db.books.orderBy('sort').toArray()
}

export async function getBookById(id: number) {
  return await db.books.get(id)
}

export async function getDefaultBook() {
  return await db.books.where('isDefault').equals(1).first()
}

export async function addBook(data: Omit<Book, 'id'>) {
  return await db.books.add(data)
}

export async function updateBook(id: number, data: Partial<Book>) {
  return await db.books.update(id, data)
}

export async function deleteBook(id: number) {
  // 删除账本及其全部记录
  await db.records.where('bookId').equals(id).delete()
  await db.books.delete(id)
}

export async function setDefaultBook(id: number) {
  await db.books.where('isDefault').equals(1).modify({ isDefault: false })
  await db.books.update(id, { isDefault: true })
}
