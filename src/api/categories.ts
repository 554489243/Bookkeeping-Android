import { db, Category } from './db'

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // 支出
  { type: 'expense', name: '餐饮', icon: '🍜', sort: 1 },
  { type: 'expense', name: '交通', icon: '🚗', sort: 2 },
  { type: 'expense', name: '购物', icon: '🛒', sort: 3 },
  { type: 'expense', name: '居住', icon: '🏠', sort: 4 },
  { type: 'expense', name: '娱乐', icon: '🎮', sort: 5 },
  { type: 'expense', name: '医疗', icon: '💊', sort: 6 },
  { type: 'expense', name: '教育', icon: '📚', sort: 7 },
  { type: 'expense', name: '其他', icon: '📦', sort: 99 },
  // 收入
  { type: 'income', name: '薪资', icon: '💰', sort: 100 },
  { type: 'income', name: '理财', icon: '📈', sort: 101 },
  { type: 'income', name: '其他', icon: '💵', sort: 199 },
]

export const DEFAULT_CHILDREN: { parentName: string; type: 'expense' | 'income'; children: { name: string; icon: string; defaultAmount?: number }[] }[] = [
  {
    parentName: '餐饮', type: 'expense',
    children: [
      { name: '外食', icon: '🍜' },
      { name: '买菜', icon: '🥬' },
      { name: '饮料', icon: '🧋' },
      { name: '杂项', icon: '🍽️' },
    ],
  },
  {
    parentName: '交通', type: 'expense',
    children: [
      { name: '充电', icon: '🔌' },
      { name: '加油', icon: '⛽' },
      { name: '打车', icon: '🚕' },
      { name: '车贷', icon: '🚙', defaultAmount: 300000 },
      { name: '车险', icon: '🛡️' },
      { name: '停车费', icon: '🅿️' },
      { name: '杂项', icon: '🔧' },
    ],
  },
  {
    parentName: '购物', type: 'expense',
    children: [
      { name: '衣服', icon: '👔' },
      { name: '鞋子', icon: '👟' },
      { name: '日用品', icon: '🧴' },
      { name: '美妆', icon: '💅' },
      { name: '零食', icon: '🍪' },
      { name: '杂项', icon: '📦' },
    ],
  },
  {
    parentName: '居住', type: 'expense',
    children: [
      { name: '房租', icon: '🏘️' },
      { name: '房贷', icon: '🏠', defaultAmount: 500000 },
      { name: '水电', icon: '💧' },
      { name: '物业', icon: '🏢' },
      { name: '维修', icon: '🔧' },
    ],
  },
  {
    parentName: '娱乐', type: 'expense',
    children: [
      { name: '游戏', icon: '🕹️' },
      { name: '电影', icon: '🎬' },
      { name: '聚会', icon: '🎉' },
      { name: '运动', icon: '🏋️' },
      { name: '宠物', icon: '🐱' },
    ],
  },
  {
    parentName: '医疗', type: 'expense',
    children: [
      { name: '药品', icon: '💊' },
      { name: '挂号', icon: '🏥' },
      { name: '检查', icon: '🔬' },
      { name: '保险', icon: '🩺' },
    ],
  },
  {
    parentName: '教育', type: 'expense',
    children: [
      { name: '学费', icon: '🎓' },
      { name: '书本', icon: '📖' },
      { name: '培训', icon: '📝' },
      { name: '杂项', icon: '🗂️' },
    ],
  },
  {
    parentName: '其他', type: 'expense',
    children: [
      { name: '礼金', icon: '🧧' },
      { name: '捐赠', icon: '🤝' },
      { name: '通讯', icon: '📱' },
      { name: '数码', icon: '💻' },
      { name: '旅行', icon: '✈️' },
      { name: '烟酒', icon: '🚬' },
      { name: '杂项', icon: '🗂️' },
    ],
  },
  {
    parentName: '薪资', type: 'income',
    children: [
      { name: '工资', icon: '💰' },
      { name: '奖金', icon: '🎁' },
      { name: '兼职', icon: '💼' },
    ],
  },
  {
    parentName: '理财', type: 'income',
    children: [
      { name: '利息', icon: '📈' },
      { name: '分红', icon: '🎊' },
      { name: '租金', icon: '🏘️' },
    ],
  },
  {
    parentName: '其他', type: 'income',
    children: [
      { name: '红包', icon: '🧧' },
      { name: '报销', icon: '📋' },
      { name: '退款', icon: '↩️' },
      { name: '中奖', icon: '🏆' },
      { name: '二手', icon: '♻️' },
      { name: '其他', icon: '💵' },
    ],
  },
]

export async function initCategories() {
  const count = await db.categories.count()
  if (count === 0) {
    // 先插入父分类
    const parentIds: Record<string, number> = {}
    for (const cat of DEFAULT_CATEGORIES) {
      const id = await db.categories.add({ ...cat, builtin: true })
      parentIds[cat.name + '_' + cat.type] = id
    }
    // 再插入子分类
    for (const group of DEFAULT_CHILDREN) {
      const parentId = parentIds[group.parentName + '_' + group.type]
      if (parentId) {
        let sort = 1
        for (const child of group.children) {
          await db.categories.add({
            type: group.type,
            name: child.name,
            icon: child.icon,
            sort: sort++,
            parentId,
            builtin: true,
            ...(child.defaultAmount ? { defaultAmount: child.defaultAmount } : {}),
          })
        }
      }
    }
  } else {
    // 首次引入 builtin 字段：将所有没有 builtin 标记的分类设为内置
    const allCats = await db.categories.toArray()
    const needsMark = allCats.filter(c => c.builtin === undefined)
    if (needsMark.length > 0 && needsMark.length === allCats.length) {
      for (const cat of needsMark) {
        await db.categories.update(cat.id!, { builtin: true })
      }
    }
  }
}

export async function getAllCategories() {
  return await db.categories.orderBy('sort').toArray()
}

export async function getExpenseCategories() {
  return await db.categories.where('type').equals('expense').sortBy('sort')
}

export async function getIncomeCategories() {
  return await db.categories.where('type').equals('income').sortBy('sort')
}

export async function getCategoryById(id: number) {
  return await db.categories.get(id)
}

export async function addCategory(data: Omit<Category, 'id'>) {
  return await db.categories.add(data)
}

export async function updateCategory(id: number, data: Partial<Category>) {
  return await db.categories.update(id, data)
}

export async function deleteCategory(id: number) {
  return await db.categories.delete(id)
}

export async function getChildCategories(parentId: number) {
  return await db.categories.where('parentId').equals(parentId).sortBy('sort')
}
