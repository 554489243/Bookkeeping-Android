<template>
  <div class="page">
    <!-- 账本选择 -->
    <div class="book-row">
      <BookSelector />
      <img src="/bubu.jpg" class="book-row-img" />
    </div>

    <div v-if="loading" class="loading-state">
      <van-loading size="24px" color="var(--primary)" />
      <span>加载中...</span>
    </div>

    <template v-else>
      <div class="page-content">
        <!-- 概览卡片 -->
        <div class="overview-card">
          <div class="overview-row">
            <div class="overview-item">
              <div class="label">支出</div>
              <div class="amount expense"><small>￥</small>{{ expenseYuan }}</div>
            </div>
            <div class="divider"></div>
            <div class="overview-item">
              <div class="label">收入</div>
              <div class="amount income"><small>￥</small>{{ incomeYuan }}</div>
            </div>
          </div>
          <div class="view-toggle">
            <span :class="{ active: view === 'week' }" @click="view = 'week'">本周</span>
            <span :class="{ active: view === 'month' }" @click="view = 'month'">本月</span>
            <span :class="{ active: view === 'year' }" @click="view = 'year'">本年</span>
          </div>
        </div>

        <!-- 趋势图 -->
        <div class="stats-card">
          <div class="stats-title">{{ trendTitle }}收支趋势</div>
          <div class="stats-subtitle">单位：元</div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>

        <!-- 支出饼图 -->
        <div class="stats-card">
          <div class="stats-title">{{ trendTitle }}支出分类占比</div>
          <div class="stats-subtitle">共 {{ expenseYuan }} 元</div>
          <div class="chart-wrapper">
            <div ref="pieChartRef" class="chart-container"></div>
            <div v-if="expenseCategoryStats.length === 0" class="chart-empty">暂无支出数据</div>
          </div>
          <div v-if="expenseCategoryStats.length > 0" class="pie-legend">
            <div v-for="item in expenseCategoryStats" :key="item.categoryId" class="legend-item">
              <div class="legend-dot" :style="{ background: item.color }"></div>
              <span class="legend-name" :style="{ background: item.color + '15', color: item.color }">{{ item.name }}</span>
              <span class="legend-value">{{ formatAmount(item.amount) }}</span>
              <span class="legend-percent">{{ item.percent }}%</span>
            </div>
          </div>
        </div>

        <!-- 收入饼图 -->
        <div class="stats-card">
          <div class="stats-title">{{ trendTitle }}收入分类占比</div>
          <div class="stats-subtitle">共 {{ incomeYuan }} 元</div>
          <div class="chart-wrapper">
            <div ref="incomePieChartRef" class="chart-container"></div>
            <div v-if="incomeCategoryStats.length === 0" class="chart-empty">暂无收入数据</div>
          </div>
          <div v-if="incomeCategoryStats.length > 0" class="pie-legend">
            <div v-for="item in incomeCategoryStats" :key="item.categoryId" class="legend-item">
              <div class="legend-dot" :style="{ background: item.color }"></div>
              <span class="legend-name" :style="{ background: item.color + '15', color: item.color }">{{ item.name }}</span>
              <span class="legend-value">{{ formatAmount(item.amount) }}</span>
              <span class="legend-percent">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { Loading } from 'vant'
import { useRecordStore } from '@/stores/recordStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useBookStore } from '@/stores/bookStore'
import { formatAmount } from '@/utils/format'
import { getCategoryColor } from '@/utils/colors'
import { getWeekRange, getYearRange } from '@/utils/date'
import { getCategoryStatsByDateRange, getTrendByDateRange } from '@/api/records'
import TabBar from '@/components/TabBar.vue'
import BookSelector from '@/components/BookSelector.vue'

const recordStore = useRecordStore()
const categoryStore = useCategoryStore()
const bookStore = useBookStore()
const view = ref('month')
const loading = ref(true)

// 图表引用
const trendChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
const incomePieChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let incomePieChart: echarts.ECharts | null = null

const expenseCategoryStats = ref<{
  categoryId: number; name: string; amount: number; percent: number; color: string
}[]>([])
const incomeCategoryStats = ref<{
  categoryId: number; name: string; amount: number; percent: number; color: string
}[]>([])



// 按账本筛选的记录
const filteredRecords = computed(() => {
  if (bookStore.isAllBooks) return recordStore.records
  return recordStore.records.filter((r: any) => r.bookId === bookStore.currentBookId)
})

function getRecordsByView() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  switch (view.value) {
    case 'week': {
      const { start, end } = getWeekRange()
      return filteredRecords.value.filter((r: any) => r.date >= start && r.date <= end)
    }
    case 'year': {
      const { start, end } = getYearRange()
      return filteredRecords.value.filter((r: any) => r.date >= start && r.date <= end)
    }
    case 'month':
    default:
      return filteredRecords.value.filter((r: any) => r.date.startsWith(monthPrefix))
  }
}

const expenseYuan = computed(() => {
  const total = getRecordsByView().filter(r => r.type === 'expense').reduce((sum: number, r: any) => sum + r.amount, 0)
  return (total / 100).toFixed(2)
})

const incomeYuan = computed(() => {
  const total = getRecordsByView().filter((r: any) => r.type === 'income').reduce((sum: number, r: any) => sum + r.amount, 0)
  return (total / 100).toFixed(2)
})

const trendTitle = computed(() => {
  switch (view.value) {
    case 'week': return '本周'
    case 'year': return '本年'
    case 'month':
    default: return '本月'
  }
})

function getDateRange(): { start: string; end: string; trendGroup: 'day' | 'month'; trendLabel: (d: string) => string } {
  const now = new Date()
  switch (view.value) {
    case 'week': {
      const { start, end } = getWeekRange()
      return {
        start, end,
        trendGroup: 'day',
        trendLabel: (d: string) => dayjs(d).format('M/D')
      }
    }
    case 'year': {
      const { start, end } = getYearRange()
      return {
        start, end,
        trendGroup: 'month',
        trendLabel: (d: string) => dayjs(d + '-01').format('M月')
      }
    }
    case 'month':
    default: {
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end = dayjs(start).endOf('month').format('YYYY-MM-DD')
      return {
        start, end,
        trendGroup: 'day',
        trendLabel: (d: string) => dayjs(d).format('M/D')
      }
    }
  }
}

async function renderCharts() {
  loading.value = true
  await recordStore.loadRecords()
  loading.value = false
  await nextTick()

  const bookId = bookStore.isAllBooks ? undefined : bookStore.currentBookId!
  const { start, end, trendGroup, trendLabel } = getDateRange()

  // 趋势图 - 柱状 + 收支差折线
  if (trendChartRef.value) {
    const trendData = await getTrendByDateRange(start, end, bookId, trendGroup)
    const filledData = fillDateGaps(trendData, start, end, trendGroup, trendLabel)
    if (trendChart) { trendChart.dispose(); trendChart = null }
    trendChart = echarts.init(trendChartRef.value, null, { renderer: 'canvas' })
    const barW = trendGroup === 'day' ? Math.max(4, Math.min(12, 200 / filledData.length)) : 12
    trendChart.setOption({
      grid: { top: 28, right: 16, bottom: 28, left: 16 },
      legend: { data: ['支出', '收入'], top: 0, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11, color: '#666' } },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e8e8e8', borderWidth: 1,
        textStyle: { color: '#333', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
      },
      xAxis: {
        type: 'category',
        data: filledData.map(d => d.label),
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#888' }
      },
      yAxis: { type: 'value', show: false, min: 0 },
      series: [
        { name: '支出', type: 'bar', data: filledData.map(d => d.expense), barWidth: barW, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#40a9ff' }, { offset: 1, color: '#1989fa' }]), borderRadius: [3, 3, 0, 0] } },
        { name: '收入', type: 'bar', data: filledData.map(d => d.income), barWidth: barW, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#6dd480' }, { offset: 1, color: '#07c160' }]), borderRadius: [3, 3, 0, 0] } }
      ]
    })
  }

  // 支出饼图
  if (pieChartRef.value) {
    const stats = await getCategoryStatsByDateRange(start, end, 'expense', bookId)
    let total = 0
    stats.forEach(v => total += v)
    const pieData: { name: string; value: number; itemStyle: { color: string } }[] = []
    const legendData: typeof expenseCategoryStats.value = []
    // 按父分类聚合
    const parentMap = new Map<number, number>()
    stats.forEach((amount, categoryId) => {
      const parentId = categoryStore.getParentId(categoryId)
      parentMap.set(parentId, (parentMap.get(parentId) || 0) + amount)
    })
    parentMap.forEach((amount, parentId) => {
      const cat = categoryStore.getById(parentId)
      if (cat && amount > 0) {
        const color = getCategoryColor(cat.name).bg
        pieData.push({ name: cat.name, value: amount, itemStyle: { color } })
        legendData.push({ categoryId: parentId, name: `${cat.icon} ${cat.name}`, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0, color })
      }
    })
    expenseCategoryStats.value = legendData.sort((a, b) => b.amount - a.amount)
    if (pieChart) { pieChart.dispose(); pieChart = null }
    if (pieData.length > 0) {
      pieChart = echarts.init(pieChartRef.value, null, { renderer: 'canvas' })
      pieChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            return `${params.name}<br/>${(params.value / 100).toFixed(2)} 熊熊币<br/>占比 ${params.percent}%`
          },
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          textStyle: { color: '#333', fontSize: 12 },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
        },
        series: [{
          type: 'pie',
          roseType: 'radius',
          radius: ['40%', '85%'],
          center: ['50%', '50%'],
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scaleSize: 10,
            label: { show: true, position: 'inner', formatter: '{d}%', textStyle: { color: '#fff', fontWeight: 'bold', fontSize: 12 } },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
          },
          data: pieData
        }]
      })
    }
  }

  // 收入饼图
  if (incomePieChartRef.value) {
    const stats = await getCategoryStatsByDateRange(start, end, 'income', bookId)
    let total = 0
    stats.forEach(v => total += v)
    const pieData: { name: string; value: number; itemStyle: { color: string } }[] = []
    const legendData: typeof incomeCategoryStats.value = []
    // 按父分类聚合
    const parentMap = new Map<number, number>()
    stats.forEach((amount, categoryId) => {
      const parentId = categoryStore.getParentId(categoryId)
      parentMap.set(parentId, (parentMap.get(parentId) || 0) + amount)
    })
    parentMap.forEach((amount, parentId) => {
      const cat = categoryStore.getById(parentId)
      if (cat && amount > 0) {
        const color = getCategoryColor(cat.name).bg
        pieData.push({ name: cat.name, value: amount, itemStyle: { color } })
        legendData.push({ categoryId: parentId, name: `${cat.icon} ${cat.name}`, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0, color })
      }
    })
    incomeCategoryStats.value = legendData.sort((a, b) => b.amount - a.amount)
    if (incomePieChart) { incomePieChart.dispose(); incomePieChart = null }
    if (pieData.length > 0) {
      incomePieChart = echarts.init(incomePieChartRef.value, null, { renderer: 'canvas' })
      incomePieChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            return `${params.name}<br/>${(params.value / 100).toFixed(2)} 熊熊币<br/>占比 ${params.percent}%`
          },
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          textStyle: { color: '#333', fontSize: 12 },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
        },
        series: [{
          type: 'pie',
          roseType: 'radius',
          radius: ['40%', '85%'],
          center: ['50%', '50%'],
          label: {
            show: true,
            position: 'inner',
            formatter: '{d}%',
            textStyle: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
          },
          labelLine: { show: false },
          emphasis: { scaleSize: 10, itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
          data: pieData
        }]
      })
    }
  }

  loading.value = false
}

function fillDateGaps(
  data: { label: string; expense: number; income: number }[],
  start: string, end: string,
  groupBy: 'day' | 'month',
  labelFn: (d: string) => string
): { label: string; expense: number; income: number }[] {
  const result: { label: string; expense: number; income: number }[] = []
  const dataMap = new Map(data.map(d => [d.label, d]))
  if (groupBy === 'day') {
    let current = dayjs(start)
    const endDate = dayjs(end)
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const key = current.format('YYYY-MM-DD')
      const existing = dataMap.get(key)
      result.push({ label: labelFn(key), expense: existing?.expense || 0, income: existing?.income || 0 })
      current = current.add(1, 'day')
    }
  } else {
    let current = dayjs(start).startOf('month')
    const endDate = dayjs(end).startOf('month')
    while (current.isBefore(endDate) || current.isSame(endDate, 'month')) {
      const key = current.format('YYYY-MM')
      const existing = dataMap.get(key)
      result.push({ label: labelFn(key), expense: existing?.expense || 0, income: existing?.income || 0 })
      current = current.add(1, 'month')
    }
  }
  return result
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
  incomePieChart?.resize()
}

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
  incomePieChart?.dispose()
})

watch(() => bookStore.currentBookId, () => {
  renderCharts()
})

watch(view, () => {
  renderCharts()
})
</script>

<style scoped>
.overview-card {
  background: linear-gradient(135deg, var(--primary), #40a9ff);
  border-radius: var(--radius-lg);
  padding: 20px;
  color: #fff;
  margin: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.book-row { padding: 12px 12px 8px; display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.book-row-img { width: 33px; height: 33px; border-radius: 6px; object-fit: cover; }
.overview-row { display: flex; align-items: center; gap: 16px; flex: 1; }
.overview-item .label { font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
.overview-item .amount { font-size: 24px; font-weight: 700; letter-spacing: -1px; }
.overview-item .amount small { font-size: 14px; font-weight: 500; }
.overview-item .amount.income { color: #b7eb8f; }
.divider { width: 1px; height: 40px; background: rgba(255,255,255,0.3); }
.view-toggle { display: flex; background: rgba(255,255,255,0.2); border-radius: 10px; padding: 3px; margin-top: 12px; width: fit-content; }
.view-toggle span { padding: 5px 10px; border-radius: 8px; font-size: 12px; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.view-toggle span.active { background: #fff; color: var(--primary); font-weight: 600; }

.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; font-size: 14px; color: var(--text-secondary); }

.stats-card { background: var(--card); border-radius: var(--radius-lg); padding: 20px; margin: 0 12px 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.stats-subtitle { font-size: 11px; color: #999; margin-bottom: 12px; }
.stats-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.chart-wrapper { position: relative; }
.chart-container { width: 100%; aspect-ratio: 16 / 10; min-height: 160px; }
.chart-empty { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 13px; }
.pie-legend { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 4px 0; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.legend-name { flex: 1; padding: 2px 8px; border-radius: 4px; font-weight: 500; font-size: 11px; }
.legend-value { font-weight: 600; }
.legend-percent { color: var(--text-secondary); width: 36px; text-align: right; }
</style>
