<template>
  <div class="page">
    <!-- 账本选择 -->
    <div class="book-row">
      <BookSelector />
      <img src="/bubu.jpg" class="book-row-img" />
    </div>

    <!-- 概览卡片 -->
    <div class="overview-card">
      <div class="overview-top">
        <div class="overview-expense">
          <div class="label">总支出</div>
          <div class="amount">{{ formatAmount(periodSummary.expense) }}</div>
        </div>
        <div class="period-controls">
          <div class="period-row">
            <button class="period-arrow" @click="prevMonth">‹</button>
            <button class="period-label" :class="{ all: !hasActivePeriod }" @click="showMonthPicker = true">
              {{ selectedYear && selectedMonth ? `${selectedYear}年${String(selectedMonth).padStart(2, '0')}月` : '全部' }}
            </button>
            <button class="period-arrow" @click="nextMonth">›</button>
          </div>
          <div class="period-row" v-if="hasActivePeriod">
            <button class="period-reset" @click="resetPeriod">全部</button>
          </div>
        </div>
      </div>
      <div class="overview-bottom">
        <div class="overview-income">
          <span class="label">总收入</span>
          <span class="value">{{ formatAmount(periodSummary.income) }}</span>
        </div>
        <div class="record-count">共 {{ periodFilteredRecords.length }} 笔</div>
      </div>
    </div>

    <!-- 历史数据提示 -->
    <div v-if="isHistorical" class="historical-banner">
      📦 历史数据（只读）
    </div>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showMonthPicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择月份"
        type="year-month"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onMonthConfirm"
        @cancel="showMonthPicker = false"
      />
    </van-popup>

    <!-- 分类筛选 — 父分类一行横滑 -->
    <div class="cat-filter-section">
      <div class="cat-row parent-row">
        <div
          v-for="chip in filterChips"
          :key="chip.value"
          class="cat-chip"
          :class="{ active: filterCategoryId === chip.value || selectedParentId === chip.value }"
          @click="onParentClick(chip.value)"
        >
          {{ chip.label }}
        </div>
      </div>
      <div class="cat-row sub-row" v-if="subFilterChips.length > 0">
        <div
          v-for="chip in subFilterChips"
          :key="chip.value"
          class="cat-chip small"
          :class="{ active: filterCategoryId === chip.value }"
          @click="filterCategoryId = chip.value"
        >
          {{ chip.label }}
        </div>
      </div>
    </div>

    <!-- 明细列表 -->
    <div class="page-content">
      <div v-if="loading" class="loading-state">
        <van-loading size="24px" color="var(--primary)" />
        <span>加载中...</span>
      </div>

      <div v-else-if="groupedRecords.length === 0" class="empty-state">
        <div class="icon">📋</div>
        <div class="text">{{ hasActivePeriod ? '本月暂无记录' : '暂无账单记录' }}</div>
        <button v-if="hasActivePeriod" class="empty-btn" @click="resetPeriod">查看全部</button>
        <button v-else class="empty-btn" @click="$router.push('/edit')">记一笔</button>
      </div>

      <div v-for="group in groupedRecords" :key="group.date" class="date-group">
        <div class="date-group-header">
          <span class="date-text">{{ formatDateWeekday(group.date) }}</span>
          <span class="date-subtotal">
            <span v-if="group.expenseTotal > 0" class="expense">支出 {{ formatAmount(group.expenseTotal) }}</span>
            <span v-if="group.expenseTotal > 0 && group.incomeTotal > 0" class="sep"> · </span>
            <span v-if="group.incomeTotal > 0" class="income">收入 {{ formatAmount(group.incomeTotal) }}</span>
          </span>
        </div>
        <van-swipe-cell v-for="record in group.records" :key="record.id">
          <div class="record-card" :class="{ historical: isHistorical }" @click="!isHistorical && $router.push(`/edit/${record.id}`)">
            <div class="record-icon" :style="{ background: categoryColor(record.categoryId).light }">
              {{ categoryIcon(record.categoryId) }}
            </div>
            <div class="record-info">
              <div class="record-name">{{ displayName(record.categoryId) }}</div>
              <div class="record-meta">
                <span v-if="secondaryName(record.categoryId)" class="record-parent" :style="{ color: categoryColor(record.categoryId).text }">
                  {{ secondaryName(record.categoryId) }}
                </span>
                <span v-if="record.note" class="record-note">{{ record.note }}</span>
              </div>
            </div>
            <div class="record-amount" :class="record.type">
              {{ record.type === 'income' ? '+' : '-' }}{{ formatAmount(record.amount) }}
            </div>
          </div>
          <template #right v-if="!isHistorical">
            <button class="delete-btn" @click="handleDelete(record.id!)">删除</button>
          </template>
        </van-swipe-cell>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useRecordStore } from '@/stores/recordStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useBookStore } from '@/stores/bookStore'
import { formatAmount } from '@/utils/format'
import { getCategoryColor } from '@/utils/colors'
import { formatDate, formatDateWeekday } from '@/utils/date'
import TabBar from '@/components/TabBar.vue'
import BookSelector from '@/components/BookSelector.vue'

const router = useRouter()
const recordStore = useRecordStore()
const categoryStore = useCategoryStore()
const bookStore = useBookStore()
const filterCategoryId = ref<number | null>(null)
const selectedParentId = ref<number | null>(null)
const loading = ref(true)
const isHistorical = ref(false)

// 月份筛选
const showMonthPicker = ref(false)
const selectedYear = ref<number | null>(null)
const selectedMonth = ref<number | null>(null)
const datePickerValue = ref<string[]>([])
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

const hasActivePeriod = computed(() => selectedYear.value !== null && selectedMonth.value !== null)
const periodText = computed(() => {
  if (selectedYear.value && selectedMonth.value) return `${selectedYear.value}年${selectedMonth.value}月`
  return '全部账单'
})

function prevMonth() {
  if (!selectedYear.value || !selectedMonth.value) {
    const now = new Date()
    selectedYear.value = now.getFullYear()
    selectedMonth.value = now.getMonth() + 1
    return
  }
  if (selectedMonth.value === 1) { selectedYear.value--; selectedMonth.value = 12 }
  else { selectedMonth.value-- }
}

function nextMonth() {
  if (!selectedYear.value || !selectedMonth.value) {
    const now = new Date()
    selectedYear.value = now.getFullYear()
    selectedMonth.value = now.getMonth() + 1
    return
  }
  if (selectedMonth.value === 12) { selectedYear.value++; selectedMonth.value = 1 }
  else { selectedMonth.value++ }
}

function resetPeriod() {
  selectedYear.value = null
  selectedMonth.value = null
}

function isMonthHistorical(year: number, month: number): boolean {
  const cutoff = dayjs().subtract(1, 'year').startOf('month')
  const monthDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
  return monthDate.isBefore(cutoff)
}

async function onMonthConfirm({ selectedValues }: { selectedValues: string[] }) {
  selectedYear.value = parseInt(selectedValues[0])
  selectedMonth.value = parseInt(selectedValues[1])
  showMonthPicker.value = false
  if (isMonthHistorical(selectedYear.value, selectedMonth.value)) {
    isHistorical.value = true
    await recordStore.loadHistoryRecordsByMonth(selectedYear.value, selectedMonth.value)
  } else {
    isHistorical.value = false
  }
}

watch([selectedYear, selectedMonth], async () => {
  if (selectedYear.value && selectedMonth.value && isMonthHistorical(selectedYear.value, selectedMonth.value)) {
    isHistorical.value = true
    await recordStore.loadHistoryRecordsByMonth(selectedYear.value, selectedMonth.value)
  } else {
    isHistorical.value = false
  }
})

watch(showMonthPicker, (val) => {
  if (val) {
    const y = selectedYear.value || new Date().getFullYear()
    const m = selectedMonth.value || new Date().getMonth() + 1
    datePickerValue.value = [String(y), String(m).padStart(2, '0')]
  }
})

const filterChips = computed(() => [
  { label: '全部', value: null },
  ...categoryStore.expenseParentCategories.map((c: any) => ({ label: `${c.icon} ${c.name}`, value: c.id })),
  ...categoryStore.incomeParentCategories.map((c: any) => ({ label: `${c.icon} ${c.name}`, value: c.id }))
])

const subFilterChips = computed(() => {
  if (!selectedParentId.value) return []
  return categoryStore.getChildCategories(selectedParentId.value).map((c: any) => ({
    label: `${c.icon} ${c.name}`,
    value: c.id!
  }))
})

function onParentClick(parentId: number | null) {
  filterCategoryId.value = parentId
  selectedParentId.value = parentId
}

const bookFilteredRecords = computed(() => {
  const source: any[] = isHistorical.value ? recordStore.historyRecords : recordStore.records
  if (bookStore.isAllBooks) return source
  return source.filter((r: any) => r.bookId === bookStore.currentBookId)
})

const periodFilteredRecords = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return bookFilteredRecords.value
  return bookFilteredRecords.value.filter((r: any) => {
    const d = new Date(r.date + 'T00:00:00')
    return d.getFullYear() === selectedYear.value && (d.getMonth() + 1) === selectedMonth.value
  })
})

const periodSummary = computed(() => {
  const records = periodFilteredRecords.value
  const expense = records.filter(r => r.type === 'expense').reduce((sum: number, r: any) => sum + r.amount, 0)
  const income = records.filter(r => r.type === 'income').reduce((sum: number, r: any) => sum + r.amount, 0)
  return { expense, income, net: income - expense }
})

const filteredRecords = computed(() => {
  if (!filterCategoryId.value) return periodFilteredRecords.value
  const childIds = categoryStore.getChildCategories(filterCategoryId.value).map((c: any) => c.id!)
  const ids = [filterCategoryId.value, ...childIds]
  return periodFilteredRecords.value.filter((r: any) => ids.includes(r.categoryId))
})

const groupedRecords = computed(() => {
  const groups: { date: string; records: typeof recordStore.records; expenseTotal: number; incomeTotal: number }[] = []
  const map = new Map<string, typeof recordStore.records>()

  filteredRecords.value.forEach((r: any) => {
    if (!map.has(r.date)) map.set(r.date, [])
    map.get(r.date)!.push(r)
  })

  map.forEach((records, date) => {
    groups.push({
      date,
      records,
      expenseTotal: records.filter((r: any) => r.type === 'expense').reduce((sum: number, r: any) => sum + r.amount, 0),
      incomeTotal: records.filter((r: any) => r.type === 'income').reduce((sum: number, r: any) => sum + r.amount, 0)
    })
  })

  return groups.sort((a, b) => b.date.localeCompare(a.date))
})

function categoryIcon(id: number) {
  return categoryStore.getById(id)?.icon || '📦'
}

function displayName(id: number) {
  const cat = categoryStore.getById(id)
  if (!cat) return '其他'
  if (cat.parentId) {
    const parent = categoryStore.getById(cat.parentId)
    return parent ? `${parent.icon} ${parent.name}` : cat.name
  }
  return `${cat.icon} ${cat.name}`
}

function secondaryName(id: number) {
  const cat = categoryStore.getById(id)
  if (cat?.parentId) {
    return cat.name
  }
  return ''
}

function categoryColor(id: number) {
  const cat = categoryStore.getById(id)
  return cat ? getCategoryColor(cat.name) : getCategoryColor('其他')
}

async function handleDelete(id: number) {
  await showConfirmDialog({
    title: '删除账单',
    message: '确定要删除这条账单吗？',
    confirmButtonText: '删除',
    confirmButtonColor: '#ee0a24'
  })
  await recordStore.deleteRecord(id)
  showToast('已删除')
}

onMounted(async () => {
  await bookStore.init()
  await recordStore.loadRecords()
  loading.value = false
})
</script>

<style scoped>
/* ===== 账本选择（与统计页一致） ===== */
.book-row {
  padding: 12px 12px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}
.book-row-img {
  width: 33px;
  height: 33px;
  border-radius: 6px;
  object-fit: cover;
}

/* ===== 概览卡片 ===== */
.overview-card {
  background: linear-gradient(135deg, var(--primary), #40a9ff);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  color: #fff;
  margin: 0 12px 12px;
  box-shadow: 0 4px 20px rgba(25, 137, 250, 0.3);
}

/* ===== 顶部：支出 + 日期选择 ===== */
.overview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.overview-expense .label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 2px;
}
.overview-expense .amount {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -1px;
}

.period-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.period-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.period-arrow {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.period-arrow:active { background: rgba(255, 255, 255, 0.35); }
.period-label {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.period-label.all {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 3px 10px;
}
.period-label.all:active { background: rgba(255, 255, 255, 0.35); }
.period-label:active { background: rgba(255, 255, 255, 0.15); }
.period-reset {
  font-size: 11px;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}
.period-reset:active { background: rgba(255, 255, 255, 0.35); }

/* ===== 底部：收入 + 笔数 ===== */
.overview-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}
.overview-income {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.overview-income .label {
  font-size: 12px;
  opacity: 0.8;
}
.overview-income .value {
  font-size: 14px;
  font-weight: 600;
  color: #b7eb8f;
}
.record-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* ===== 分类筛选 — 横滑 ===== */
.cat-filter-section {
  padding: 0 12px 8px;
}
.cat-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0;
}
.cat-row::-webkit-scrollbar { display: none; }
.cat-row.sub-row {
  margin-top: 4px;
}
.cat-chip {
  padding: 6px 14px;
  border-radius: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.cat-chip:active { transform: scale(0.95); }
.cat-chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  font-weight: 600;
}
.cat-chip.small {
  padding: 4px 10px;
  font-size: 11px;
  background: var(--primary-light);
  border-color: transparent;
}
.cat-chip.small.active {
  background: var(--primary);
  color: #fff;
}

/* ===== 明细列表 ===== */
.page-content {
  padding: 0 12px;
}
.date-group {
  margin-bottom: 12px;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.date-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px 0 8px;
}
.date-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.date-subtotal {
  font-size: 11px;
}
.date-subtotal .expense { color: var(--text-secondary); }
.date-subtotal .income { color: var(--success); }
.date-subtotal .sep { color: var(--text-secondary); margin: 0 4px; }

.record-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  /* border-bottom: 1px solid var(--border); */
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.record-card:active {transform: scale(0.98);box-shadow: none;}
.record-card:last-child {
  border-bottom: none;
}
.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.record-info {
  flex: 1;
  min-width: 0;
}
.record-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}
.record-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.record-parent {
  font-size: 11px;
  font-weight: 500;
}
.record-note {
  font-size: 11px;
  color: var(--text-secondary);
  flex: 1;
  word-break: break-all;
  white-space: normal;
}
.record-amount {
  font-size: 16px;
  font-weight: 700;
  color: var(--danger);
  white-space: nowrap;
}
.record-amount.income { color: var(--success); }
.record-card.historical { cursor: default; opacity: 0.85; }
.record-card.historical:active { transform: none; }

.historical-banner {
  margin: 8px 12px;
  padding: 8px 14px;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: var(--radius);
  font-size: 12px;
  color: #f57c00;
  font-weight: 600;
  text-align: center;
}

.delete-btn {
  height: 100%;
  padding: 0 20px;
  background: var(--danger);
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
