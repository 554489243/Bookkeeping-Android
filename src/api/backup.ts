/**
 * APK 版备份模块 —— 使用 Capacitor 原生能力，不依赖浏览器下载行为。
 *
 * 与网页版的区别：
 *   - 导出：写入应用缓存目录 → 调系统分享面板（可发微信/QQ/存文件管理器）
 *   - 导入：调系统文件选择器选文件 → 读取内容 → 合并导入
 *
 * 为什么导出先写 Cache 目录：
 *   Android 10+ 的分区存储（Scoped Storage）下，直接写公共 Download 目录需要
 *   MANAGE_EXTERNAL_STORAGE 权限（应用商店会拒审），而 Documents 目录在
 *   Android 11+ 也受限。写 Cache 目录无需任何权限，配合系统分享面板，
 *   用户可以自由选择保存位置（文件管理器/微信/网盘），体验反而更好。
 */
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { FilePicker } from '@capawesome/capacitor-file-picker'
import { db, RecordItem, Category, Book } from './db'

export interface BackupData {
  version: number
  exportedAt: string
  records: RecordItem[]
  records_history: RecordItem[]
  categories: Category[]
  books: Book[]
}

/** 是否运行在原生 App（APK）环境 */
export const isNative = Capacitor.isNativePlatform()

/**
 * 导出所有数据为 JSON 对象
 */
export async function exportData(): Promise<BackupData> {
  const [records, records_history, categories, books] = await Promise.all([
    db.records.toArray(),
    db.records_history.toArray(),
    db.categories.toArray(),
    db.books.toArray()
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    records_history,
    categories,
    books
  }
}

/**
 * 智能合并导入（不重复、不丢数据）
 * - 分类/账本：相同 ID 跳过，只补新的
 * - 记录：按 ID 合并，有则更新，无则添加
 */
export async function mergeData(data: BackupData): Promise<{ records: number; categories: number; books: number }> {
  if (!data || !data.version) {
    throw new Error('无效的备份文件')
  }

  const result = { records: 0, categories: 0, books: 0 }

  await db.transaction('rw', db.records, db.records_history, db.categories, db.books, async () => {
    // 分类：跳过已存在的
    if (data.categories?.length) {
      const existing = await db.categories.toArray()
      const existingIds = new Set(existing.map(c => c.id))
      const newCats = data.categories.filter(c => !existingIds.has(c.id))
      if (newCats.length) {
        await db.categories.bulkAdd(newCats)
        result.categories = newCats.length
      }
    }

    // 账本：跳过已存在的
    if (data.books?.length) {
      const existing = await db.books.toArray()
      const existingIds = new Set(existing.map(b => b.id))
      const newBooks = data.books.filter(b => !existingIds.has(b.id))
      if (newBooks.length) {
        await db.books.bulkAdd(newBooks)
        result.books = newBooks.length
      }
    }

    // 记录：按 ID 合并（有则更新，无则添加）
    if (data.records?.length) {
      await db.records.bulkPut(data.records)
      result.records = data.records.length
    }
    if (data.records_history?.length) {
      await db.records_history.bulkPut(data.records_history)
    }
  })

  return result
}

/**
 * 全量导入（清空后恢复）
 */
export async function importData(data: BackupData): Promise<void> {
  if (!data || !data.version) {
    throw new Error('无效的备份文件')
  }

  await db.transaction('rw', db.records, db.records_history, db.categories, db.books, async () => {
    await db.records.clear()
    await db.records_history.clear()
    await db.categories.clear()
    await db.books.clear()

    if (data.records?.length) await db.records.bulkAdd(data.records)
    if (data.records_history?.length) await db.records_history.bulkAdd(data.records_history)
    if (data.categories?.length) await db.categories.bulkAdd(data.categories)
    if (data.books?.length) await db.books.bulkAdd(data.books)
  })
}

/**
 * 自动备份（月初/月半检测，同一天只备一次）
 * 静默保存到 localStorage，不弹窗不分享
 */
export async function autoBackup(): Promise<boolean> {
  const day = new Date().getDate()
  if (day !== 1 && day !== 15) return false

  const today = new Date().toISOString().slice(0, 10)
  const lastBackup = localStorage.getItem('lastAutoBackup')
  if (lastBackup === today) return false

  try {
    const data = await exportData()
    localStorage.setItem('autoBackup_' + today, JSON.stringify(data))
    localStorage.setItem('lastAutoBackup', today)
    return true
  } catch {
    return false
  }
}

/** 导出结果类型 */
export type ExportResult = 'shared' | 'shared-fallback' | 'saved' | 'shown' | 'failed'

/** 生成备份文件名 */
function backupFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `记账本备份_${date}.json`
}

/**
 * 导出备份文件
 *
 * APK 环境：写入 Cache 目录 → 尝试系统分享（用户可选微信/QQ/文件管理器）
 * 网页环境：沿用浏览器方案（分享 API → 文件保存 API → 新窗口展示）
 */
export async function downloadBackup(data: BackupData): Promise<ExportResult> {
  const json = JSON.stringify(data, null, 2)
  const filename = backupFilename()

  // ---------- APK 原生环境 ----------
  if (isNative) {
    try {
      // 写入应用缓存目录（无需任何存储权限）
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      })

      // 优先尝试系统分享面板（用户可发微信/QQ/存到文件管理器）
      try {
        const canShare = await Share.canShare()
        if (canShare.value) {
          await Share.share({
            title: '记账本数据备份',
            text: `导出时间：${new Date(data.exportedAt).toLocaleString('zh-CN')}`,
            url: writeResult.uri,
            dialogTitle: '保存或分享备份文件'
          })
          return 'shared'
        }
      } catch {
        // 分享失败或被取消，不视为致命错误 —— 文件已经写成功了
      }

      // 分享不可用时，至少文件已落盘，返回 fallback 让页面提示用户
      return 'shared-fallback'
    } catch (err: any) {
      console.error('导出失败', err)
      return 'failed'
    }
  }

  // ---------- 网页环境（保持原有逻辑） ----------
  const blob = new Blob([json], { type: 'application/json' })

  // 方式1：系统分享面板
  if (navigator.share && navigator.canShare?.({
    files: [new File([blob], filename, { type: 'application/json' })]
  })) {
    try {
      await navigator.share({
        title: '记账本数据备份',
        text: `导出时间：${data.exportedAt}`,
        files: [new File([blob], filename, { type: 'application/json' })]
      })
      return 'shared'
    } catch {
      // 降级
    }
  }

  // 方式2：文件保存 API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON 备份文件', accept: { 'application/json': ['.json'] } }]
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch {
      // 降级
    }
  }

  // 方式3：新窗口展示，用户手动保存
  const url = URL.createObjectURL(blob)
  const win = window.open()
  if (win) {
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${filename}</title><style>body{font-family:monospace;padding:20px;white-space:pre-wrap;word-break:break-all;background:#f5f5f5;}pre{background:#fff;padding:16px;border-radius:8px;overflow:auto;}</style></head><body><h3>${filename}</h3><p>请按 Ctrl+S（或长按 → 保存）保存此文件</p><pre>${json.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`)
    win.document.close()
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  URL.revokeObjectURL(url)
  return 'shown'
}

/**
 * 选择备份文件并读取内容
 *
 * APK 环境：调系统文件选择器，返回文件文本内容
 * 网页环境：返回 null，由调用方走原有 import.html 弹窗方案
 */
export async function pickBackupFile(): Promise<string | null> {
  if (!isNative) return null

  const result = await FilePicker.pickFiles({
    types: ['application/json'],
    readData: true,
    limit: 1
  })

  const file = result.files?.[0]
  if (!file) return null

  // readData 为 true 时，插件直接返回 base64 编码的文件内容
  if (file.data) {
    return base64ToUtf8(file.data)
  }

  // 兜底：没有 data 时用 path 自行读取
  if (file.path) {
    const readResult = await Filesystem.readFile({
      path: file.path,
      encoding: Encoding.UTF8
    })
    return typeof readResult.data === 'string'
      ? readResult.data
      : base64ToUtf8(readResult.data as string)
  }

  throw new Error('无法读取所选文件')
}

/** base64 → UTF-8 字符串（正确处理中文） */
function base64ToUtf8(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}
