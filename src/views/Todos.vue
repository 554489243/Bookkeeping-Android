<template>
  <div class="todo-page">
    <!-- 顶部（Sticky）：日期 + 今日进度 + 筛选 -->
    <div class="topbar-wrap">
      <div class="hero">
        <img class="mascot" :src="mascotFace" alt="" />
        <div class="hero-text">
          <div class="hero-date">{{ todayLabel }}</div>
          <div class="hero-sub">{{ progressText }}</div>
        </div>
        <div class="hero-acts">
          <div class="icon-btn" @click="showAdd = true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </div>
          <div class="icon-btn" :class="{ on: !calendarCollapsed }" @click="calendarCollapsed = !calendarCollapsed">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3.5" width="12" height="10.5" rx="2" stroke="currentColor" stroke-width="1.4" />
              <path d="M2 6.8h12M5.2 2v3M10.8 2v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
          </div>
        </div>
      </div>

      <div class="hero-bar" v-if="todayStat.total > 0">
        <i><b :style="{ width: todayPercent + '%' }"></b></i>
        <em>{{ todayStat.done }}/{{ todayStat.total }}</em>
      </div>

      <div class="chips">
        <div class="chip" :class="{ active: activeFilter === 'undone' }" @click="toggleFilter('undone')">
          未完成 <b>{{ undoneCount }}</b>
        </div>
        <div class="chip" :class="{ active: activeFilter === 'done' }" @click="toggleFilter('done')">
          已完成 <b>{{ doneCount }}</b>
        </div>
        <div class="chip" :class="{ active: activeFilter === 'overdue' }" @click="toggleFilter('overdue')">
          过期 <b>{{ overdueCount }}</b>
        </div>
      </div>
    </div>

    <!-- 日历（展开时才显示，随页面滚动，不常驻） -->
    <div class="calendar-card" v-show="!calendarCollapsed">
      <div class="calendar-nav">
        <div class="nav-btn" @click="prevMonth">‹</div>
        <div class="month">{{ calendarTitle }}</div>
        <div class="nav-btn" @click="nextMonth">›</div>
      </div>
      <div class="weekdays">
        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
      </div>
      <div class="days">
        <div
          v-for="(cell, i) in calendarCells"
          :key="i"
          class="day-cell"
          :class="{
            'other-month': !cell.currentMonth,
            'today': cell.isToday,
            'selected': cell.date === activeDate,
            'cell-undone': cell.cellStatus === 'undone',
          }"
          @click="selectDate(cell.date)"
        >
          <span class="day-num">{{ cell.day }}</span>
          <div class="dots" v-if="cell.todoCount > 0">
            <span
              v-for="(c, ci) in cell.typeColors.slice(0, 3)"
              :key="ci"
              class="dot"
              :style="{ background: c }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 待办列表（按日期分组） -->
    <div class="list-section">
      <!-- 筛选/日期态下的工具栏；不筛选时不占地方 -->
      <div class="list-toolbar" v-if="activeFilter || activeDate">
        <span class="tb-label">{{ listTitle }}</span>
        <span class="tb-count">{{ filteredTodos.length }} 项</span>
        <span class="clear-btn" @click="clearFilter">显示全部</span>
      </div>

      <div class="empty" v-if="groupedTodos.length === 0">
        <img class="empty-mascot" :src="emptyMascot" alt="" />
        <div class="empty-text">{{ emptyText }}</div>
        <div class="empty-sub" v-if="!activeFilter && !activeDate">点右上角的 + ，把想到的事记下来</div>
        <button class="empty-btn" v-if="!activeFilter && !activeDate" @click="showAdd = true">记一条</button>
      </div>

      <div v-for="group in groupedTodos" :key="group.date" class="date-group">
        <div class="date-group-header">
          <span class="dg-label" :class="{ today: group.isToday }">
            <span class="dg-emoji">{{ group.icon }}</span>{{ group.label }}
          </span>
          <span class="dg-right">
            <span class="dg-progress" v-if="group.isToday && todayStat.total > 0">
              <i class="dg-bar"><b :style="{ width: todayPercent + '%' }"></b></i>
              <em>{{ todayStat.done }}/{{ todayStat.total }}</em>
            </span>
            <span class="dg-count" v-else>{{ group.todos.length }} 项</span>
          </span>
        </div>

        <van-swipe-cell v-for="t in group.todos" :key="t.id" class="todo-swipe">
          <div
            class="todo-item"
            :class="[
              'priority-' + priorityClass(t.priority),
              t.done ? 'done' : '',
              t.ignored ? 'ignored' : ''
            ]"
          >
            <div class="todo-avatar" :style="{ background: typeBg(t.type) }">{{ typeIcon(t.type) }}</div>
            <div class="todo-content" @click="openEdit(t)">
              <div class="todo-text">{{ t.content }}</div>
              <div class="todo-meta">
                <span class="todo-tag" :class="'tag-' + t.type">{{ typeLabel(t.type) }}</span>
                <span class="todo-priority" :class="'prio-' + priorityClass(t.priority)">
                  {{ priorityIcon(t.priority) }} {{ priorityLabel(t.priority) }}
                </span>
                <span class="todo-overdue" v-if="isItemOverdue(t)">已过期</span>
                <span class="todo-ignored-tag" v-if="t.ignored">已忽略</span>
              </div>
            </div>
            <div class="todo-acts">
              <div class="todo-ignore" v-if="!t.done" @click.stop="onIgnore(t)">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.1" stroke="currentColor" stroke-width="1.3" />
                  <path d="M4.7 11.3l6.6-6.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                </svg>
              </div>
              <div class="todo-check" :class="{ checked: t.done }" @click="onToggle(t.id!)">
                <span v-if="t.done">✓</span>
              </div>
            </div>
          </div>
          <template #right>
            <div class="swipe-delete" @click="onDelete(t.id!)">🗑 删除</div>
          </template>
        </van-swipe-cell>
      </div>
    </div>

    <!-- 添加弹窗 -->
    <van-popup v-model:show="showAdd" position="bottom" round :style="{ height: 'auto' }">
      <div class="modal">
        <h3>{{ modalTitle }}</h3>
        <input
          v-model="form.content"
          class="modal-input"
          placeholder="要做什么？"
          @keyup.enter="onSubmit"
        />

        <div class="modal-row">
          <div
            v-for="opt in typeOptions"
            :key="opt.value"
            class="opt"
            :class="{ selected: form.type === opt.value }"
            @click="form.type = opt.value"
          >
            <span class="opt-icon">{{ opt.icon }}</span>
            {{ opt.label }}
          </div>
        </div>

        <div class="modal-date" @click="showDatePicker = true">
          📅 <span>{{ form.dueDate }}</span> ›
        </div>

        <div class="modal-row" style="margin-top:12px">
          <div
            v-for="opt in priorityOptions"
            :key="opt.value"
            class="opt"
            :class="{ selected: form.priority === opt.value }"
            @click="form.priority = opt.value"
          >
            <span class="opt-icon">{{ opt.icon }}</span>
            {{ opt.label }}
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showAdd = false; resetForm()">取消</button>
          <button class="btn-confirm" @click="onSubmit">确定</button>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- 底部 Tab -->
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTodoStore } from '@/stores/todoStore'
import { Todo } from '@/api/db'
import dayjs from 'dayjs'
import { showToast } from 'vant'
import TabBar from '@/components/TabBar.vue'
import mascotFace from '@/assets/mascot-face.png'
import mascotBear from '@/assets/mascot-bear.png'
import mascotPanda from '@/assets/mascot-panda.png'

const todoStore = useTodoStore()

const calendarMonth = ref(dayjs())
/** 选中的日期；null = 不限日期 */
const activeDate = ref<string | null>(null)
/** 顶部 chips 的筛选态；null = 不筛选 */
const activeFilter = ref<null | 'undone' | 'done' | 'overdue'>(null)
const showAdd = ref(false)
const showDatePicker = ref(false)
const calendarCollapsed = ref(true)
const datePickerValue = ref(dayjs().format('YYYY-MM-DD').split('-'))
const editingTodo = ref<Todo | null>(null)

const isEditing = computed(() => editingTodo.value !== null)
const modalTitle = computed(() => isEditing.value ? '编辑待办' : '添加待办')

function openEdit(t: Todo) {
  editingTodo.value = t
  form.value = {
    content: t.content,
    type: t.type,
    priority: t.priority,
    dueDate: t.dueDate,
  }
  datePickerValue.value = t.dueDate.split('-')
  showAdd.value = true
}

function resetForm() {
  editingTodo.value = null
  form.value = { content: '', type: 'note', priority: 1, dueDate: dayjs().format('YYYY-MM-DD') }
  datePickerValue.value = dayjs().format('YYYY-MM-DD').split('-')
}

async function onSubmit() {
  if (!form.value.content.trim()) {
    showToast('请输入内容')
    return
  }
  if (isEditing.value && editingTodo.value) {
    await todoStore.updateTodo(editingTodo.value.id!, form.value.content.trim(), form.value.type, form.value.priority, form.value.dueDate)
    showToast('已更新')
  } else {
    await todoStore.addTodo(form.value.content.trim(), form.value.type, form.value.priority, form.value.dueDate)
    showToast('已添加')
  }
  showAdd.value = false
  resetForm()
}

const minDate = new Date(2025, 0, 1)
const maxDate = new Date(2030, 11, 31)

const form = ref({
  content: '',
  type: 'note' as Todo['type'],
  priority: 1 as Todo['priority'],
  dueDate: dayjs().format('YYYY-MM-DD'),
})

const typeOptions = [
  { value: 'money' as const, icon: '💰', label: '钱', color: '#F57C00' },
  { value: 'life' as const, icon: '🏠', label: '生活', color: '#43A047' },
  { value: 'work' as const, icon: '💼', label: '工作', color: '#1976D2' },
  { value: 'note' as const, icon: '📝', label: '备忘', color: '#7B1FA2' },
  { value: 'health' as const, icon: '🏃', label: '健康', color: '#E91E63' },
  { value: 'study' as const, icon: '📚', label: '学习', color: '#00897B' },
]

const priorityOptions = [
  { value: 1 as const, icon: '⚡', label: '普通' },
  { value: 2 as const, icon: '🔥', label: '紧急' },
  { value: 0 as const, icon: '☕', label: '不急' },
]

const typeColors: Record<string, string> = {
  money: '#F57C00',
  life: '#43A047',
  work: '#1976D2',
  note: '#7B1FA2',
  health: '#E91E63',
  study: '#00897B',
}

function priorityLabel(p: number) {
  return ['不急', '普通', '紧急'][p] || '普通'
}

function typeLabel(type: string) {
  return typeOptions.find(o => o.value === type)?.label || '备忘'
}

function priorityClass(p: number) {
  return ['low', 'medium', 'high'][p] || 'medium'
}

/* ===== 小图标 / 情绪价值 ===== */

/** 类型头像：emoji + 浅色底 */
const TYPE_META: Record<string, { icon: string; bg: string }> = {
  money: { icon: '💰', bg: '#FFF3E0' },
  life: { icon: '🏠', bg: '#E8F5E9' },
  work: { icon: '💼', bg: '#E3F2FD' },
  note: { icon: '📝', bg: '#F3E5F5' },
  health: { icon: '🏃', bg: '#FCE4EC' },
  study: { icon: '📚', bg: '#E0F2F1' },
}

function typeIcon(type: string) {
  return TYPE_META[type]?.icon || '📌'
}

function typeBg(type: string) {
  return TYPE_META[type]?.bg || '#F1F5F9'
}

/** 优先级图标：不急 ☕ / 普通 ⚡ / 紧急 🔥 */
function priorityIcon(p: number) {
  return ['☕', '⚡', '🔥'][p] || '⚡'
}

/** 组头小图标 */
function groupIcon(date: string, today: string) {
  const d = dayjs(date)
  const t = dayjs(today)
  if (d.isSame(t, 'day')) return '📌'
  if (d.isSame(t.add(1, 'day'), 'day')) return '🌤'
  if (d.isSame(t.add(2, 'day'), 'day')) return '🗓'
  return '📅'
}

/** 完成一件时的随机夸奖 */
const PRAISE = [
  '🎉 搞定一个！',
  '👍 又清掉一件',
  '✨ 干得漂亮',
  '💪 继续保持',
  '🔥 效率真高',
  '🌟 舒服了',
]

// 日历
const calendarTitle = computed(() => calendarMonth.value.format('YYYY 年 M 月'))

const calendarCells = computed(() => {
  const start = calendarMonth.value.startOf('month')
  const end = calendarMonth.value.endOf('month')
  const startWeek = start.day()
  const totalDays = end.date()
  const cells: Array<{
    date: string; day: number; currentMonth: boolean; isToday: boolean; todoCount: number; typeColors: string[]; cellStatus: string
  }> = []
  const today = dayjs().format('YYYY-MM-DD')

  // 先按日期归集一次（跳过已忽略），避免 42 个格子各自扫一遍全表
  const byDate = new Map<string, Todo[]>()
  for (const t of todoStore.todos) {
    if (t.ignored) continue
    const arr = byDate.get(t.dueDate)
    if (arr) arr.push(t)
    else byDate.set(t.dueDate, [t])
  }

  // 上月填充
  for (let i = startWeek - 1; i >= 0; i--) {
    const d = start.subtract(i + 1, 'day')
    cells.push(makeCell(d, byDate, false, today))
  }
  // 当月
  for (let i = 1; i <= totalDays; i++) {
    const d = start.add(i - 1, 'day')
    cells.push(makeCell(d, byDate, true, today))
  }
  // 下月填充
  const remain = 42 - cells.length
  for (let i = 1; i <= remain; i++) {
    const d = end.add(i, 'day')
    cells.push(makeCell(d, byDate, false, today))
  }
  return cells
})

function makeCell(d: dayjs.Dayjs, byDate: Map<string, Todo[]>, currentMonth: boolean, today: string) {
  const date = d.format('YYYY-MM-DD')
  // 已忽略的条目在归集时就被排除了，这里只需判完成
  const undone = (byDate.get(date) ?? []).filter(t => !t.done)
  return {
    date,
    day: d.date(),
    currentMonth,
    isToday: date === today,
    todoCount: undone.length,
    typeColors: [...new Set(undone.map(t => t.type))].map(t => typeColors[t] || '#999'),
    // 只有「还剩未完成」才标色；已完成 / 已忽略 / 无记录一律无色
    cellStatus: undone.length > 0 ? 'undone' : 'none',
  }
}

function prevMonth() { calendarMonth.value = calendarMonth.value.subtract(1, 'month') }
function nextMonth() { calendarMonth.value = calendarMonth.value.add(1, 'month') }

/** 点日期 → 只看那天；再点同一日期 → 取消，回到全部 */
function selectDate(date: string) {
  if (activeDate.value === date) {
    activeDate.value = null
    return
  }
  activeDate.value = date
  activeFilter.value = null
}

/** 点顶部 chip → 筛选；再点一次取消 */
function toggleFilter(f: 'undone' | 'done' | 'overdue') {
  activeFilter.value = activeFilter.value === f ? null : f
  if (activeFilter.value) activeDate.value = null
}

/** 一键回到全部 */
function clearFilter() {
  activeFilter.value = null
  activeDate.value = null
}

/** 筛选后的扁平列表（已忽略的不算未完成、也不算过期） */
const filteredTodos = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  let list = todoStore.todos.slice()

  if (activeFilter.value === 'undone') list = list.filter(t => !t.done && !t.ignored)
  else if (activeFilter.value === 'done') list = list.filter(t => t.done)
  else if (activeFilter.value === 'overdue') list = list.filter(t => !t.done && !t.ignored && t.dueDate < today)

  if (activeDate.value) list = list.filter(t => t.dueDate === activeDate.value)

  return list
})

/** 单条待办是否「已过期」：过期是条目的属性，跟所属日期组无关 */
function isItemOverdue(t: Todo) {
  return !t.done && !t.ignored && t.dueDate < dayjs().format('YYYY-MM-DD')
}

/** 组头文案：今天 / 明天 / 后天 / 其余按日期；是否过期由单条待办自己标注 */
function groupLabel(date: string, today: string) {
  const d = dayjs(date)
  const t = dayjs(today)
  const wd = d.format('dddd')
  if (d.isSame(t, 'day')) return `今天 · ${d.format('M月D日')} ${wd}`
  if (d.isSame(t.add(1, 'day'), 'day')) return `明天 · ${d.format('M月D日')} ${wd}`
  if (d.isSame(t.add(2, 'day'), 'day')) return `后天 · ${d.format('M月D日')} ${wd}`
  if (d.isSame(t, 'year')) return `${d.format('M月D日')} ${wd}`
  return d.format('YYYY年M月D日')
}

/** 按日期分组，升序（已过期 → 今天 → 未来）；组内未完成在前、已完成沉底 */
const groupedTodos = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const map = new Map<string, Todo[]>()

  filteredTodos.value.forEach(t => {
    if (!map.has(t.dueDate)) map.set(t.dueDate, [])
    map.get(t.dueDate)!.push(t)
  })

  const groups = Array.from(map.entries()).map(([date, todos]) => {
    // 组内排序：未完成在前 → 已完成 → 已忽略（后两类都算「不用管了」，沉底）
    const rank = (t: Todo) => (t.ignored ? 2 : t.done ? 1 : 0)
    const sorted = todos.slice().sort((a, b) => rank(a) - rank(b))
    return {
      date,
      label: groupLabel(date, today),
      icon: groupIcon(date, today),
      isToday: date === today,
      todos: sorted,
    }
  })

  return groups.sort((a, b) => a.date.localeCompare(b.date))
})

/** 今天的完成进度（不受筛选影响，始终反映真实进度；已忽略的不算） */
const todayStat = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const list = todoStore.todos.filter(t => t.dueDate === today && !t.ignored)
  return { total: list.length, done: list.filter(t => t.done).length }
})

const todayPercent = computed(() => {
  if (todayStat.value.total === 0) return 0
  return Math.round((todayStat.value.done / todayStat.value.total) * 100)
})

/** 顶部日期与一句进度文案 */
const todayLabel = computed(() => dayjs().format('M月D日 dddd'))
const progressText = computed(() => {
  const { total, done } = todayStat.value
  if (total === 0) return '今天还没有安排'
  if (done >= total) return '今天全部搞定，漂亮'
  return `今天还剩 ${total - done} 件`
})

const listTitle = computed(() => {
  if (activeFilter.value === 'undone') return '未完成'
  if (activeFilter.value === 'done') return '已完成'
  if (activeFilter.value === 'overdue') return '已过期'
  if (activeDate.value) {
    const d = dayjs(activeDate.value)
    const today = dayjs().startOf('day')
    if (d.isSame(today, 'day')) return '今天 · ' + d.format('M月D日')
    if (d.isSame(today.add(1, 'day'), 'day')) return '明天 · ' + d.format('M月D日')
    return d.format('M月D日')
  }
  return '全部待办'
})

const emptyText = computed(() => {
  if (activeFilter.value === 'done') return '还没有已完成的待办'
  if (activeFilter.value === 'overdue') return '没有过期未完成的事项'
  if (activeDate.value) return '这天没有待办'
  return '还没有待办'
})

/** 空状态配图：清单完全空（全新）用「热爱工作」小熊，筛选/指定日期查无结果时用熊猫 */
const emptyMascot = computed(() => {
  if (!activeFilter.value && !activeDate.value) return mascotBear
  return mascotPanda
})

// 统计数据（已忽略的不计入未完成 / 过期）
const undoneCount = computed(() => todoStore.todos.filter(t => !t.done && !t.ignored).length)
const doneCount = computed(() => todoStore.todos.filter(t => t.done).length)
const overdueCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return todoStore.todos.filter(t => !t.done && !t.ignored && t.dueDate < today).length
})

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.value.dueDate = selectedValues.join('-')
  showDatePicker.value = false
}

async function onToggle(id: number) {
  const before = todoStore.todos.find(t => t.id === id)
  const wasDone = !!before?.done
  await todoStore.toggleTodo(id)
  // 只有「打勾完成」才给正反馈；取消勾选不打扰
  if (!wasDone) {
    const left = todoStore.todos.filter(t => !t.done && !t.ignored).length
    const msg = left === 0 ? '🎊 全部清空，太强了！' : PRAISE[Math.floor(Math.random() * PRAISE.length)]
    showToast({ message: msg, duration: 1200 })
  }
}

/** 忽略 / 取消忽略：不删除，只是不再计入未完成与过期 */
async function onIgnore(t: Todo) {
  const wasIgnored = !!t.ignored
  await todoStore.toggleIgnored(t.id!)
  showToast({ message: wasIgnored ? '↩️ 已恢复，重新计入' : '🙈 已忽略，不再提醒', duration: 1200 })
}

async function onDelete(id: number) {
  await todoStore.deleteTodo(id)
}

onMounted(async () => {
  await todoStore.loadTodos()
  await todoStore.cleanupOldTodos()
})
</script>

<style scoped>
.todo-page {
  padding-bottom: 80px;
  padding-top: 0;
}

/* ===== 顶部（sticky）：日期 + 今日进度 + 筛选 ===== */
.topbar-wrap {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--primary);
  padding-bottom: 12px;
}
/* 叠一层白色高光做出层次（不写死颜色，完全跟随主题） */
.topbar-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 55%);
  pointer-events: none;
}

/* 第一行：头像 + 日期 + 操作按钮 */
.hero {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 0;
}
.mascot {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  flex-shrink: 0;
  display: block;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}
.hero-text { flex: 1; min-width: 0; }
.hero-date {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  line-height: 1.25;
}
.hero-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 2px;
}
.hero-acts {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s;
}
.icon-btn:active { transform: scale(0.9); }
.icon-btn.on { background: #fff; color: var(--primary); }

/* 第二行：今日进度条 */
.hero-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px 0;
}
.hero-bar i {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.26);
  overflow: hidden;
  display: block;
}
.hero-bar i b {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: #fff;
  transition: width 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.hero-bar em {
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

/* 第三行：筛选胶囊 */
.chips {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 6px;
  padding: 10px 14px 0;
}
.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.18s;
  border: 1.5px solid transparent;
}
.chip b { font-weight: 700; }
.chip:active { transform: scale(0.95); }
.chip.active {
  background: #fff;
  color: var(--primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

/* ===== 日历（展开时，随页面滚动） ===== */
.calendar-card {
  margin: 10px 12px 0;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}
.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.calendar-nav .month { font-size: 15px; font-weight: 700; }
.calendar-nav .nav-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
}
.day-cell:active { transform: scale(0.92); }
.day-cell .day-num { font-size: 14px; font-weight: 500; }
.day-cell .dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  height: 4px;
}
.day-cell .dot { width: 4px; height: 4px; border-radius: 50%; }
.day-cell.today { background: var(--primary-light); }
.day-cell.today .day-num { color: var(--primary); font-weight: 700; }
.day-cell.cell-undone { background: var(--danger-light); }
.day-cell.selected { background: var(--primary); }
.day-cell.selected .day-num { color: #fff; }
.day-cell.other-month { opacity: 0.3; }

/* ===== 列表 ===== */
.list-section { padding: 12px 12px 0; }

.list-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding-left: 4px;
}
.list-toolbar .tb-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.list-toolbar .tb-count { font-size: 11px; color: var(--text-secondary); }
.list-toolbar .clear-btn {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-light);
  padding: 3px 10px;
  border-radius: 10px;
  cursor: pointer;
}
.list-toolbar .clear-btn:active { opacity: 0.7; }

.empty {
  text-align: center;
  padding: 44px 0 40px;
}
.empty-mascot {
  height: 88px;
  width: auto;
  margin: 0 auto 16px;
  display: block;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
}
.empty-text { font-size: 14px; font-weight: 600; color: var(--text); }
.empty-sub { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }
.empty .empty-btn { margin-top: 18px; }

/* 日期分组 */
.date-group { margin-bottom: 14px; }
.date-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 6px;
}
.dg-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.dg-label .dg-emoji { font-size: 13px; }
.dg-label.today { color: var(--primary); }
.dg-right { display: flex; align-items: center; gap: 8px; }
.dg-count { font-size: 11px; color: var(--text-secondary); }

/* 今天的完成进度 */
.dg-progress { display: flex; align-items: center; gap: 5px; }
.dg-bar {
  display: block;
  width: 46px;
  height: 4px;
  border-radius: 4px;
  background: var(--border);
  overflow: hidden;
}
.dg-bar b {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--success);
  transition: width 0.35s ease;
}
.dg-progress em {
  font-style: normal;
  font-size: 11px;
  font-weight: 600;
  color: var(--success);
}

.todo-swipe { margin-bottom: 6px; }

.todo-item {
  background: var(--card);
  border-radius: var(--radius-sm);
  padding: 11px 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  transition: transform 0.15s;
}
.todo-item:active { transform: scale(0.985); }
.todo-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.todo-item.priority-high::before { background: var(--danger); }
.todo-item.priority-medium::before { background: var(--warning); }
.todo-item.priority-low::before { background: var(--success); }
/* 已完成：留 ✔ 与灰化，但文字不划线 */
.todo-item.done .todo-text { color: var(--text-secondary); }
.todo-item.done .todo-avatar { filter: grayscale(1); opacity: 0.65; }
.todo-item.done .todo-tag,
.todo-item.done .todo-priority { opacity: 0.55; }

/* 已忽略：文字划掉，整条压暗，左侧优先级色条也退成灰色 */
.todo-item.ignored { opacity: 0.62; }
.todo-item.ignored .todo-text { text-decoration: line-through; color: var(--text-secondary); }
.todo-item.ignored .todo-avatar { filter: grayscale(1); opacity: 0.6; }
.todo-item.ignored::before { background: var(--border); }

/* 类型头像：给列表上色 */
.todo-avatar {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  transition: filter 0.2s, opacity 0.2s;
}

/* 右侧操作区：忽略 + 完成 */
.todo-acts {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.todo-ignore {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.18s, transform 0.18s;
}
.todo-ignore:active { transform: scale(0.85); color: var(--danger); }

.todo-check {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.todo-check:active { transform: scale(0.82); }
.todo-check.checked {
  background: var(--success);
  border-color: var(--success);
  animation: checkPop 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes checkPop {
  0% { transform: scale(0.7); }
  55% { transform: scale(1.28); }
  100% { transform: scale(1); }
}

.todo-content { flex: 1; min-width: 0; }
.todo-text { font-size: 15px; line-height: 1.5; word-break: break-all; }
.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.todo-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}
.tag-money { background: #FFF3E0; color: #F57C00; }
.tag-life { background: #E8F5E9; color: #43A047; }
.tag-work { background: #E3F2FD; color: #1976D2; }
.tag-note { background: #F3E5F5; color: #7B1FA2; }
.tag-health { background: #FCE4EC; color: #E91E63; }
.tag-study { background: #E0F2F1; color: #00897B; }
.todo-priority {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}
.prio-high { background: var(--danger-light); color: var(--danger); }
.prio-medium { background: var(--warning-light); color: var(--warning); }
.prio-low { background: var(--success-light); color: var(--success); }

/* 单条状态标：过期是条目自己的属性 */
.todo-overdue {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--danger-light);
  color: var(--danger);
}
.todo-ignored-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--bg);
  color: var(--text-secondary);
}

/* 右滑删除 */
.swipe-delete {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: var(--danger);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* 弹窗 */
.modal {
  padding: 24px 20px;
}
.modal h3 { font-size: 18px; margin-bottom: 16px; }
.modal-input {
  width: 100%;
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  outline: none;
}
.modal-input:focus { border-color: var(--primary); }
.modal-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.modal-row .opt {
  flex: 1;
  padding: 10px 4px;
  border: 2px solid var(--border);
  border-radius: 12px;
  text-align: center;
  font-size: 12px;
  cursor: pointer;
}
.modal-row .opt.selected { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
.modal-row .opt .opt-icon { font-size: 20px; display: block; margin-bottom: 2px; }
.modal-date {
  margin-top: 12px;
  padding: 12px 14px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.modal-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
}
.btn-cancel { background: var(--bg); color: var(--text-secondary); }
.btn-confirm { background: var(--primary); color: #fff; }
</style>
