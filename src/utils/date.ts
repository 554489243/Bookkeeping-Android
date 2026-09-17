import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function currentMonth(): string {
  return dayjs().format('YYYY-MM')
}

export function formatDate(date: string): string {
  return dayjs(date).format('M月D日')
}

export function formatDateWeekday(date: string): string {
  return dayjs(date).format('M月D日 dddd')
}

export function formatMonth(month: string): string {
  return dayjs(month + '-01').format('YYYY年M月')
}

export function getMonthRange(month: string) {
  const start = dayjs(month + '-01')
  return {
    start: start.format('YYYY-MM-DD'),
    end: start.endOf('month').format('YYYY-MM-DD')
  }
}

export function getWeekRange() {
  const now = dayjs()
  return {
    start: now.startOf('week').format('YYYY-MM-DD'),
    end: now.endOf('week').format('YYYY-MM-DD')
  }
}

export function getYearRange() {
  const now = dayjs()
  return {
    start: now.startOf('year').format('YYYY-MM-DD'),
    end: now.endOf('year').format('YYYY-MM-DD')
  }
}
