# 数据库设计

基于 Dexie.js（IndexedDB 封装），版本化管理 schema。

## 数据库定义

```ts
import Dexie, { Table } from 'dexie'

export interface RecordItem {
  id?: number
  type: 'expense' | 'income'
  amount: number           // 金额，单位：分
  categoryId: number       // 关联分类 id
  bookId: number           // 关联账本 id
  date: string             // YYYY-MM-DD
  note?: string            // 备注，可选
  createdAt: number        // 创建时间戳
}

export interface Category {
  id?: number
  type: 'expense' | 'income'
  name: string             // 分类名称
  icon: string             // emoji 图标
  sort: number             // 排序值
  parentId?: number        // 父分类 ID（子分类）
  defaultAmount?: number   // 默认金额（分）
  builtin?: boolean        // 是否内置
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
    this.version(1).stores({...})
    // ... v2~v5 略 ...
    this.version(6).stores({
      records: '++id, type, categoryId, bookId, date, createdAt',
      records_history: '++id, type, categoryId, bookId, date, createdAt',
      categories: '++id, type, sort, parentId',
      books: '++id, sort, isDefault'
    })
  }
}
```

## 表结构

### records（实时账单表，近 1 年数据）

| 字段 | 类型 | 索引 | 说明 |
|------|------|------|------|
| id | number (自增) | 主键 | 唯一标识 |
| type | string | ✓ | expense / income |
| amount | number | - | 金额（分） |
| categoryId | number | ✓ | 关联 categories.id |
| bookId | number | ✓ | 关联 books.id |
| date | string | ✓ | 日期 YYYY-MM-DD |
| note | string | - | 备注 |
| createdAt | number | ✓ | 创建时间戳 |

### records_history（历史归档表，1 年前数据）

结构同 records，仅索引完全一致。

### categories（分类表）

| 字段 | 类型 | 索引 | 说明 |
|------|------|------|------|
| id | number (自增) | 主键 | 唯一标识 |
| type | string | ✓ | expense / income |
| name | string | - | 分类名称 |
| icon | string | - | emoji 图标 |
| sort | number | ✓ | 排序值 |
| parentId | number | ✓ | 父分类 ID（子分类） |
| defaultAmount | number | - | 默认金额（分） |
| builtin | boolean | - | 是否内置 |

### books（账本表）

| 字段 | 类型 | 索引 | 说明 |
|------|------|------|------|
| id | number (自增) | 主键 | 唯一标识 |
| name | string | - | 账本名称 |
| icon | string | - | 图标 |
| color | string | - | 主题色 |
| sort | number | ✓ | 排序值 |
| isDefault | boolean | ✓ | 是否默认 |
| hidden | boolean | - | 是否隐藏 |
| createdAt | number | - | 创建时间 |

## 归档设计

```
┌─────────────────────────────────────────────────────────┐
│                    归档触发逻辑                           │
│                                                          │
│  1. 每周启动检查（main.ts → maintainArchive）            │
│  2. Profile 页手动触发（确认弹窗）                       │
│                                                          │
│  ┌──────────┐    归档截止线     ┌──────────────────┐    │
│  │ records  │ ───────────────→ │ records_history  │    │
│  │ (实时表) │  当前日期 - 1年   │ (历史表)          │    │
│  └──────────┘                  └──────────────────┘    │
│                                                          │
│  归档操作：                                               │
│  1. countArchivable() → 查实时表 date < cutoff 的数量     │
│  2. archiveOldRecords(cutoff) → bulkAdd + bulkDelete     │
│  3. 归档后实时表瘦身，统计查询自动合并两表                 │
└─────────────────────────────────────────────────────────┘
```

### 关键 API

| 函数 | 作用 |
|------|------|
| `archiveOldRecords(cutoffDate)` | 将 date < cutoff 的记录移到历史表，返回数量 |
| `countArchivable(beforeDate)` | 查询可归档记录数 |
| `getHistoryRecordsByMonth(y, m)` | 按月查历史表 |
| `getCategoryStatsByDateRange()` | 查统计时自动合并两表 |
| `getTrendByDateRange()` | 查趋势时自动合并两表 |

## 版本历史

| 版本 | 变更 |
|------|------|
| v1 | 初始表结构（records + categories） |
| v2 | records 增加 bookId |
| v3 | categories 增加 parentId + defaultAmount，8 个支出父类获得子类 |
| v4 | 清除所有分类，重建为 8 支出 + 3 收入的两级分类体系 |
| v5 | records 日期格式统一为零填充 YYYY-MM-DD |
| v6 | 新增 records_history 表，结构与 records 一致 |

## 数据约束

| 约束 | 说明 |
|------|------|
| 金额用「分」存储 | 避免 JS 浮点精度问题，显示时 ÷100 转「元」 |
| 内置分类不可删/改名 | `builtin = true` 的分类只允许改默认金额 |
| 金额 > 0 | 保存前校验 |
| 分类默认"其他" | 不选分类时自动归入 |
| 日期格式 | 统一 YYYY-MM-DD（dayjs 格式化） |
| 归档不可逆 | 归档后只读，不可编辑/删除 |
