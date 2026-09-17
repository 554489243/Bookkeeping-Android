/**
 * 分类色彩系统 — 低饱和度色系
 * 每个分类有固定的 bg（图标背景）、text（文字颜色）、light（浅色背景）
 */

export interface CategoryColor {
  bg: string
  text: string
  light: string
}

// 低饱和度调色板
const PALETTE = {
  green:  { bg: '#86D560', text: '#5A8F3C', light: '#EDF8E5' },
  purple: { bg: '#AF89D6', text: '#7B5EA0', light: '#F2ECF8' },
  blue:   { bg: '#59ADF3', text: '#3D7DB8', light: '#E8F3FD' },
  red:    { bg: '#FF999A', text: '#C45A5B', light: '#FFEAEA' },
  orange: { bg: '#FFCC67', text: '#C49A3D', light: '#FFF5E0' },
  teal:   { bg: '#5CC9B8', text: '#3D8F80', light: '#E5F5F1' },
  indigo: { bg: '#7B8BC7', text: '#53608F', light: '#EBEEF7' },
  brown:  { bg: '#B89E8A', text: '#7E6A5A', light: '#F3EDE8' },
  gray:   { bg: '#9EABB8', text: '#6B7B87', light: '#EDF1F4' },
}

// 父分类色彩映射
export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  // 支出
  '餐饮': PALETTE.orange,
  '交通': PALETTE.blue,
  '购物': PALETTE.red,
  '居住': PALETTE.brown,
  '娱乐': PALETTE.purple,
  '医疗': PALETTE.red,
  '教育': PALETTE.teal,
  '其他': PALETTE.gray,
  // 收入
  '薪资': PALETTE.green,
  '理财': PALETTE.teal,
}

// 子分类色彩 — 继承或近似父分类
export const CHILD_COLORS: Record<string, CategoryColor> = {
  // 餐饮
  '外食': PALETTE.orange,
  '买菜': PALETTE.green,
  '饮料': PALETTE.orange,
  // 交通
  '充电': PALETTE.teal,
  '加油': PALETTE.blue,
  '打车': PALETTE.orange,
  '车贷': PALETTE.indigo,
  '车险': PALETTE.teal,
  '停车费': PALETTE.gray,
  // 购物
  '衣服': PALETTE.red,
  '鞋子': PALETTE.purple,
  '日用品': PALETTE.brown,
  '美妆': PALETTE.red,
  '零食': PALETTE.orange,
  // 居住
  '房租': PALETTE.brown,
  '房贷': PALETTE.indigo,
  '水电': PALETTE.teal,
  '物业': PALETTE.gray,
  '维修': PALETTE.orange,
  // 娱乐
  '游戏': PALETTE.purple,
  '电影': PALETTE.red,
  '聚会': PALETTE.orange,
  '运动': PALETTE.green,
  '宠物': PALETTE.green,
  // 医疗
  '药品': PALETTE.red,
  '挂号': PALETTE.blue,
  '检查': PALETTE.teal,
  '保险': PALETTE.teal,
  // 教育
  '学费': PALETTE.teal,
  '书本': PALETTE.brown,
  '培训': PALETTE.teal,
  // 其他（支出）
  '礼金': PALETTE.red,
  '捐赠': PALETTE.green,
  '通讯': PALETTE.blue,
  '数码': PALETTE.purple,
  '旅行': PALETTE.orange,
  '烟酒': PALETTE.gray,
  // 薪资
  '工资': PALETTE.green,
  '奖金': PALETTE.orange,
  '兼职': PALETTE.teal,
  // 理财
  '利息': PALETTE.teal,
  '分红': PALETTE.orange,
  '租金': PALETTE.brown,
  // 其他（收入）
  '红包': PALETTE.red,
  '报销': PALETTE.blue,
  '退款': PALETTE.teal,
  '中奖': PALETTE.orange,
  '二手': PALETTE.green,
}

// 通用杂项颜色
const MISC_COLOR: CategoryColor = PALETTE.gray

/**
 * 获取分类颜色（优先匹配子分类，再匹配父分类，最后返回默认）
 */
export function getCategoryColor(name: string): CategoryColor {
  return CHILD_COLORS[name] || CATEGORY_COLORS[name] || MISC_COLOR
}

/**
 * 账本颜色预设
 */
export const BOOK_COLOR_PRESETS = [
  '#1989fa', '#07c160', '#ff976a', '#7232dd',
  '#ee0a24', '#00bcd4', '#795548', '#607d8b',
]
