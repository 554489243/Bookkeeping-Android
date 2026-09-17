/**
 * 分 → 元，返回格式化字符串
 * 1088 → ￥10.88
 */
export function formatAmount(cents: number): string {
  const yuan = cents / 100
  return '￥' + yuan.toFixed(2)
}

/**
 * 分 → 元，返回数字
 * 1088 → 10.88
 */
export function centsToYuan(cents: number): number {
  return cents / 100
}

/**
 * 元 → 分
 * 10.88 → 1088
 */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100)
}

/**
 * 格式化金额显示（带千分位）
 * 284650 → ￥2,846.50
 */
export function formatAmountFull(cents: number): string {
  const yuan = cents / 100
  return '￥' + yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
