<template>
  <div class="page edit-page">
    <!-- 顶部导航 -->
    <div class="edit-header">
      <div class="header-side">
        <div class="back-btn" @click="$router.back()">
          <van-icon name="arrow-left" size="20" />
        </div>
      </div>
      <div class="header-center">
        <div class="type-toggle">
          <button
            class="type-btn"
            :class="{ active: recordType === 'expense', expense: recordType === 'expense' }"
            @click="recordType = 'expense'"
          >支出</button>
          <button
            class="type-btn"
            :class="{ active: recordType === 'income', income: recordType === 'income' }"
            @click="recordType = 'income'"
          >收入</button>
        </div>
      </div>
      <div class="header-side right">
        <div v-if="isEdit" class="del-btn" @click="handleDelete">
          <van-icon name="delete-o" size="18" color="#ee0a24" />
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- 金额区 -->
      <div class="amount-area">
        <div class="amount-row">
          <span class="amount-label">{{ recordType === 'expense' ? '支出' : '收入' }} ￥</span>
          <span class="amount-value" :class="recordType">{{ displayAmount }}</span>
        </div>
        <span class="amount-expr" v-if="expression.length > 0">{{ expression }}</span>
      </div>

      <!-- 日期备注 -->
      <div class="date-note-row">
        <div class="dn-item" @click="showDatePicker = true">
          <span>📅</span>
          <span class="dn-text">{{ formatDateShort(selectedDate) }}</span>
        </div>
        <div class="dn-item note">
          <span>✏️</span>
          <input v-model="note" class="dn-input" placeholder="添加备注..." />
        </div>
      </div>

      <!-- 账本选择 -->
      <div class="section">
        <div class="section-title">账本</div>
        <div class="book-grid">
          <div
            v-for="book in bookStore.sortedBooks"
            :key="book.id"
            class="book-cell"
            :class="{ selected: selectedBookId === book.id }"
            :style="selectedBookId === book.id ? { background: book.color + '15', borderColor: book.color, color: book.color } : {}"
            @click="selectedBookId = book.id!"
          >
            <span class="book-cell-icon">{{ book.icon }}</span>
            <span class="book-cell-name">{{ book.name }}</span>
          </div>
        </div>
      </div>

      <!-- 分类选择 -->
      <div class="section">
        <div class="section-title">分类</div>
        <!-- 父分类 -->
        <div class="cat-parent-grid">
          <div
            v-for="cat in parentCategories"
            :key="cat.id"
            class="cat-parent-chip"
            :class="{ selected: selectedParentCategory === cat.id || (!selectedParentCategory && selectedCategory === cat.id) }"
            :style="(selectedParentCategory === cat.id || (!selectedParentCategory && selectedCategory === cat.id)) ? { background: getCategoryColor(cat.name).light, borderColor: getCategoryColor(cat.name).bg, color: getCategoryColor(cat.name).text } : {}"
            @click="onParentClick(cat)"
          >
            <span class="cat-parent-icon">{{ cat.icon }}</span>
            <span class="cat-parent-name">{{ cat.name }}</span>
          </div>
        </div>
        <!-- 子分类 -->
        <div class="cat-grid" v-if="childCategories.length > 0">
          <div
            v-for="cat in childCategories"
            :key="cat.id"
            class="cat-cell"
            :class="{ selected: selectedCategory === cat.id }"
            :style="selectedCategory === cat.id ? { background: getCategoryColor(cat.name).light, borderColor: getCategoryColor(cat.name).bg } : {}"
            @click="onChildClick(cat)"
          >
            <div class="cat-icon-box" :style="selectedCategory === cat.id ? { background: getCategoryColor(cat.name).bg } : { background: getCategoryColor(cat.name).light }">
              <span class="cat-emoji" :style="selectedCategory === cat.id ? { color: '#fff' } : { color: getCategoryColor(cat.name).text }">{{ cat.icon }}</span>
            </div>
            <span class="cat-label">{{ cat.name }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 自定义键盘 -->
    <div class="keypad">
      <div class="keypad-row">
        <button class="kp-key" @click="pressKey('7')">7</button>
        <button class="kp-key" @click="pressKey('8')">8</button>
        <button class="kp-key" @click="pressKey('9')">9</button>
        <button class="kp-key op" @click="pressOp('+')">+</button>
        <button class="kp-key op" @click="pressOp('-')">−</button>
      </div>
      <div class="keypad-row">
        <button class="kp-key" @click="pressKey('4')">4</button>
        <button class="kp-key" @click="pressKey('5')">5</button>
        <button class="kp-key" @click="pressKey('6')">6</button>
        <button class="kp-key op" @click="pressOp('*')">×</button>
        <button class="kp-key op" @click="pressOp('/')">÷</button>
      </div>
      <div class="keypad-row">
        <button class="kp-key" @click="pressKey('1')">1</button>
        <button class="kp-key" @click="pressKey('2')">2</button>
        <button class="kp-key" @click="pressKey('3')">3</button>
        <button class="kp-key op" @click="pressBackspace()">
          <van-icon name="revoke" size="18" />
        </button>
        <button class="kp-key op" @click="pressClear()">C</button>
      </div>
      <div class="keypad-row">
        <button class="kp-key" @click="pressKey('0')">0</button>
        <button class="kp-key" @click="pressKey('.')">.</button>
        <button class="kp-key save" :class="recordType" :disabled="saving" @click="handleSave">
          {{ saving ? '...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择日期"
        :max-date="new Date()"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- 工资单弹窗 -->
    <van-popup v-model:show="showSalaryModal" position="bottom" round :style="{ height: '85%' }">
      <div class="salary-modal">
        <div class="salary-header">
          <span class="salary-title">工资单</span>
          <van-icon name="cross" size="18" color="#969799" @click="showSalaryModal = false" />
        </div>
        <div class="salary-body">
          <!-- 收入项 -->
          <div class="salary-section">
            <div class="salary-section-title">收入项</div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.base }">
              <input type="checkbox" v-model="salaryEnabled.base" class="salary-check" />
              <span class="salary-label">基本工资</span>
              <input v-model="salaryForm.base" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.base" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.computer }">
              <input type="checkbox" v-model="salaryEnabled.computer" class="salary-check" />
              <span class="salary-label">电脑贴</span>
              <input v-model="salaryForm.computer" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.computer" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.subsidy }">
              <input type="checkbox" v-model="salaryEnabled.subsidy" class="salary-check" />
              <span class="salary-label">补助</span>
              <input v-model="salaryForm.subsidy" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.subsidy" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.overtime }">
              <input type="checkbox" v-model="salaryEnabled.overtime" class="salary-check" />
              <span class="salary-label">加班费</span>
              <input v-model="salaryForm.overtime" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.overtime" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.leave }">
              <input type="checkbox" v-model="salaryEnabled.leave" class="salary-check" />
              <span class="salary-label">扣病事假</span>
              <input v-model="salaryForm.leave" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.leave" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.hot }">
              <input type="checkbox" v-model="salaryEnabled.hot" class="salary-check" />
              <span class="salary-label">高温费</span>
              <input v-model="salaryForm.hot" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.hot" />
            </div>
            <div class="salary-row total">
              <span class="salary-label">实得工资</span>
              <span class="salary-value">{{ salaryIncomeTotal.toFixed(2) }}</span>
            </div>
          </div>
          <!-- 扣除项 -->
          <div class="salary-section">
            <div class="salary-section-title">扣除项</div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.pension }">
              <input type="checkbox" v-model="salaryEnabled.pension" class="salary-check" />
              <span class="salary-label">养老保险</span>
              <input v-model="salaryForm.pension" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.pension" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.medical }">
              <input type="checkbox" v-model="salaryEnabled.medical" class="salary-check" />
              <span class="salary-label">医疗保险</span>
              <input v-model="salaryForm.medical" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.medical" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.unemployment }">
              <input type="checkbox" v-model="salaryEnabled.unemployment" class="salary-check" />
              <span class="salary-label">失业保险</span>
              <input v-model="salaryForm.unemployment" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.unemployment" />
            </div>
            <div class="salary-row total">
              <span class="salary-label">三金</span>
              <span class="salary-value">{{ salaryThreeGold.toFixed(2) }}</span>
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.housing }">
              <input type="checkbox" v-model="salaryEnabled.housing" class="salary-check" />
              <span class="salary-label">公积金</span>
              <input v-model="salaryForm.housing" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.housing" />
            </div>
            <div class="salary-row" :class="{ disabled: !salaryEnabled.tax }">
              <input type="checkbox" v-model="salaryEnabled.tax" class="salary-check" />
              <span class="salary-label">个税</span>
              <input v-model="salaryForm.tax" class="salary-input" type="number" placeholder="0" :disabled="!salaryEnabled.tax" />
            </div>
          </div>
          <!-- 汇总 -->
          <div class="salary-section">
            <div class="salary-row total">
              <span class="salary-label">应税金额</span>
              <span class="salary-value">{{ salaryTaxable.toFixed(2) }}</span>
            </div>
            <div class="salary-row total final">
              <span class="salary-label">实支金额</span>
              <span class="salary-value">{{ salaryNet.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="salary-footer">
          <button class="salary-save-defaults" @click="saveSalaryDefaults">保存默认值</button>
          <button class="salary-confirm" @click="onSalaryConfirm">确认</button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog, Icon, DatePicker, Popup } from 'vant'
import { useRecordStore } from '@/stores/recordStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useBookStore } from '@/stores/bookStore'
import { today } from '@/utils/date'
import { yuanToCents } from '@/utils/format'
import { getCategoryColor } from '@/utils/colors'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const recordStore = useRecordStore()
const categoryStore = useCategoryStore()
const bookStore = useBookStore()

const isEdit = computed(() => !!route.params.id)
const editId = computed(() => route.params.id ? Number(route.params.id) : null)

const recordType = ref<'expense' | 'income'>('expense')
const expression = ref('')
const selectedCategory = ref<number | null>(null)
const selectedParentCategory = ref<number | null>(null)
const selectedBookId = ref<number | null>(null)
const selectedDate = ref(today())
const note = ref('')
const showDatePicker = ref(false)

const datePickerValue = ref<string[]>([])
const saving = ref(false)
const autoFilledAmount = ref(false)
const showSalaryModal = ref(false)

const salaryForm = ref({
  base: '', computer: '', subsidy: '', overtime: '', leave: '', hot: '',
  pension: '', medical: '', unemployment: '', housing: '', tax: '',
})

const salaryEnabled = ref<Record<string, boolean>>({
  base: true, computer: true, subsidy: true, overtime: true, leave: true, hot: true,
  pension: true, medical: true, unemployment: true, housing: true, tax: true,
})

const salaryDefaults = ref<Record<string, string>>({})

function loadSalaryDefaults() {
  try {
    const saved = localStorage.getItem('salaryDefaults')
    if (saved) salaryDefaults.value = JSON.parse(saved)
    const savedEnabled = localStorage.getItem('salaryEnabled')
    if (savedEnabled) salaryEnabled.value = JSON.parse(savedEnabled)
  } catch {}
}

function saveSalaryDefaults() {
  localStorage.setItem('salaryDefaults', JSON.stringify(salaryForm.value))
  localStorage.setItem('salaryEnabled', JSON.stringify(salaryEnabled.value))
  salaryDefaults.value = { ...salaryForm.value }
  showToast('默认值已保存')
}

const salaryIncomeTotal = computed(() => {
  const f = salaryForm.value
  const e = salaryEnabled.value
  return (e.base ? Number(f.base || 0) : 0) + (e.computer ? Number(f.computer || 0) : 0) + (e.subsidy ? Number(f.subsidy || 0) : 0) + (e.overtime ? Number(f.overtime || 0) : 0) + (e.hot ? Number(f.hot || 0) : 0) - (e.leave ? Number(f.leave || 0) : 0)
})

const salaryThreeGold = computed(() => {
  const f = salaryForm.value
  const e = salaryEnabled.value
  return (e.pension ? Number(f.pension || 0) : 0) + (e.medical ? Number(f.medical || 0) : 0) + (e.unemployment ? Number(f.unemployment || 0) : 0)
})

const salaryTaxable = computed(() => {
  const e = salaryEnabled.value
  return salaryIncomeTotal.value - salaryThreeGold.value - (e.housing ? Number(salaryForm.value.housing || 0) : 0) - (e.tax ? Number(salaryForm.value.tax || 0) : 0)
})

const salaryNet = computed(() => {
  return salaryTaxable.value
})

const currentCategories = computed(() =>
  recordType.value === 'expense' ? categoryStore.expenseCategories : categoryStore.incomeCategories
)

const parentCategories = computed(() =>
  recordType.value === 'expense' ? categoryStore.expenseParentCategories : categoryStore.incomeParentCategories
)

const childCategories = computed(() =>
  selectedParentCategory.value ? categoryStore.getChildCategories(selectedParentCategory.value) : []
)

const displayedCategories = computed(() =>
  childCategories.value.length > 0 ? childCategories.value : parentCategories.value
)

const displayAmount = computed(() => {
  if (!expression.value) return '0.00'
  const hasOp = expression.value.match(/[+\-*/]/)
  if (hasOp) {
    try {
      const result = evaluate(expression.value)
      if (!isNaN(result) && isFinite(result)) return Number(result).toFixed(2)
    } catch { /* empty */ }
  }
  const num = parseFloat(expression.value)
  return isNaN(num) ? '0.00' : num.toFixed(2)
})

function evaluate(expr: string): number {
  const sanitized = expr.replace(/[^0-9+\-*/.]/g, '')
  if (!sanitized) return NaN
  try {
    // 使用简单计算，支持 + - * /
    const tokens = sanitized.match(/\d+\.?\d*|[+\-*/]/g)
    if (!tokens) return NaN
    const numbers: number[] = []
    const ops: string[] = []
    let i = 0
    while (i < tokens.length) {
      const token = tokens[i]
      if (/[+\-*/]/.test(token)) {
        ops.push(token)
      } else {
        numbers.push(parseFloat(token))
      }
      i++
    }
    // 先算 * 和 /
    let numIdx = 1
    let opIdx = 0
    while (opIdx < ops.length) {
      if (ops[opIdx] === '*' || ops[opIdx] === '/') {
        const a = numbers[numIdx - 1]
        const b = numbers[numIdx]
        const res = ops[opIdx] === '*' ? a * b : (b !== 0 ? a / b : NaN)
        numbers.splice(numIdx - 1, 2, res)
        ops.splice(opIdx, 1)
      } else {
        numIdx++
        opIdx++
      }
    }
    // 再算 + 和 -
    let result = numbers[0]
    for (let j = 0; j < ops.length; j++) {
      if (ops[j] === '+') result += numbers[j + 1]
      else if (ops[j] === '-') result -= numbers[j + 1]
    }
    return result
  } catch {
    return NaN
  }
}

function pressKey(key: string) {
  expression.value += key
}

function pressOp(op: string) {
  const last = expression.value.slice(-1)
  if (['+', '-', '*', '/'].includes(last)) {
    expression.value = expression.value.slice(0, -1) + op
  } else {
    expression.value += op
  }
}

function pressBackspace() {
  expression.value = expression.value.slice(0, -1)
}

function pressClear() {
  expression.value = ''
}

function onParentClick(cat: any) {
  const children = categoryStore.getChildCategories(cat.id!)
  if (children.length > 0) {
    selectedParentCategory.value = cat.id!
    selectedCategory.value = null
    if (autoFilledAmount.value) {
      expression.value = ''
      autoFilledAmount.value = false
    }
  } else {
    selectedParentCategory.value = null
    selectedCategory.value = cat.id!
    if (autoFilledAmount.value && !cat.defaultAmount) {
      expression.value = ''
      autoFilledAmount.value = false
    }
  }
}

function onChildClick(cat: any) {
  selectedCategory.value = cat.id!
  // 工资单特殊处理
  if (cat.name === '工资') {
    showSalaryModal.value = true
    return
  }
  if (cat.defaultAmount) {
    expression.value = (cat.defaultAmount / 100).toFixed(2)
    autoFilledAmount.value = true
  } else if (autoFilledAmount.value) {
    expression.value = ''
    autoFilledAmount.value = false
  }
}

function onSalaryConfirm() {
  const amount = salaryNet.value
  if (amount <= 0) { showToast('请填写工资金额'); return }
  expression.value = amount.toFixed(2)
  // 把工资单明细追加到备注
  const lines = ['—— 工资单 ——']
  const f = salaryForm.value, e = salaryEnabled.value
  if (e.base && f.base) lines.push(`基本工资 ${Number(f.base).toFixed(2)}`)
  if (e.computer && f.computer) lines.push(`电脑贴 ${Number(f.computer).toFixed(2)}`)
  if (e.subsidy && f.subsidy) lines.push(`补助 ${Number(f.subsidy).toFixed(2)}`)
  if (e.overtime && f.overtime) lines.push(`加班费 ${Number(f.overtime).toFixed(2)}`)
  if (e.leave && f.leave) lines.push(`扣病事假 -${Number(f.leave).toFixed(2)}`)
  if (e.hot && f.hot) lines.push(`高温费 ${Number(f.hot).toFixed(2)}`)
  lines.push(`实得工资 ${salaryIncomeTotal.value.toFixed(2)}`)
  if (e.pension && f.pension) lines.push(`养老保险 -${Number(f.pension).toFixed(2)}`)
  if (e.medical && f.medical) lines.push(`医疗保险 -${Number(f.medical).toFixed(2)}`)
  if (e.unemployment && f.unemployment) lines.push(`失业保险 -${Number(f.unemployment).toFixed(2)}`)
  lines.push(`三金 -${salaryThreeGold.value.toFixed(2)}`)
  if (e.housing && f.housing) lines.push(`公积金 -${Number(f.housing).toFixed(2)}`)
  if (e.tax && f.tax) lines.push(`个税 -${Number(f.tax).toFixed(2)}`)
  lines.push(`实支金额 ${salaryNet.value.toFixed(2)}`)
  note.value = lines.join('\n')
  showSalaryModal.value = false
}

watch(recordType, () => {
  selectedCategory.value = null
  selectedParentCategory.value = null
})

watch(showSalaryModal, (val) => {
  if (val) {
    const d = salaryDefaults.value
    salaryForm.value = {
      base: d.base || '', computer: d.computer || '', subsidy: d.subsidy || '',
      overtime: d.overtime || '', leave: d.leave || '', hot: d.hot || '',
      pension: d.pension || '', medical: d.medical || '', unemployment: d.unemployment || '',
      housing: d.housing || '', tax: d.tax || '',
    }
  }
})

function formatDateShort(date: string) {
  const d = new Date(date + 'T00:00:00')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  // 确保日期格式统一为 YYYY-MM-DD（零填充）
  selectedDate.value = dayjs(selectedValues.join('-')).format('YYYY-MM-DD')
  showDatePicker.value = false
}

function getFallbackCategoryId(): number {
  // 查找当前类型的"其他"父类
  const fallback = parentCategories.value.find((c: any) => c.name === '\u5176\u4ed6')
  return fallback?.id ?? parentCategories.value[parentCategories.value.length - 1]?.id ?? 0
}

async function handleSave() {
  const amount = parseFloat(displayAmount.value)
  if (!amount || amount <= 0) { showToast('请输入金额'); return }
  if (!selectedBookId.value) { showToast('请选择账本'); return }

  // 分类：优先子类 > 父类 > 其它
  const categoryId = selectedCategory.value ?? selectedParentCategory.value ?? getFallbackCategoryId()
  if (!categoryId) { showToast('请选择分类'); return }

  saving.value = true
  try {
    const data = {
      type: recordType.value,
      amount: yuanToCents(amount),
      categoryId,
      bookId: selectedBookId.value,
      date: selectedDate.value,
      note: note.value || undefined
    }
    if (isEdit.value && editId.value) {
      await recordStore.updateRecord(editId.value, data)
      showToast('已更新'); router.back()
    } else {
      await recordStore.addRecord(data)
      showToast('已保存')
      expression.value = ''; note.value = ''
      await nextTick()
    }
  } finally { saving.value = false }
}

async function handleDelete() {
  await showConfirmDialog({ title: '删除账单', message: '确定要删除这条账单吗？', confirmButtonText: '删除', confirmButtonColor: '#ee0a24' })
  if (editId.value) { await recordStore.deleteRecord(editId.value); showToast('已删除'); router.back() }
}

onMounted(async () => {
  await bookStore.init()
  await categoryStore.loadCategories()
  loadSalaryDefaults()
  if (isEdit.value && editId.value) {
    const record = recordStore.records.find((r: any) => r.id === editId.value)
    if (record) {
      recordType.value = record.type
      expression.value = (record.amount / 100).toFixed(2)
      selectedCategory.value = record.categoryId
      selectedBookId.value = record.bookId
      selectedDate.value = record.date
      note.value = record.note || ''
      // 设置父分类选中
      const cat = categoryStore.getById(record.categoryId)
      if (cat?.parentId) {
        selectedParentCategory.value = cat.parentId
      }
    }
  } else {
    const defaultBook = bookStore.books.find((b: any) => b.isDefault)
    if (defaultBook) selectedBookId.value = defaultBook.id!
    expression.value = ''
    // 默认选中"其它"父类
    const fallbackId = getFallbackCategoryId()
    if (fallbackId) selectedParentCategory.value = fallbackId
  }
  datePickerValue.value = selectedDate.value.split('-').map(String)
})
</script>

<style scoped>
.edit-page {
  background: var(--bg);
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
  position: relative;
}

/* 顶部导航 */
.edit-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--card);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-side {
  width: 80px;
  display: flex;
  align-items: center;
}
.header-side.right {
  justify-content: flex-end;
}
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}
.back-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.back-btn:active { background: var(--bg); }
.del-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  cursor: pointer;
}
.del-btn:active { background: var(--bg); }

/* 收支切换 */
.type-toggle {
  display: flex;
  background: var(--bg);
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
}
.type-btn {
  padding: 6px 24px;
  border: none;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.type-btn.active.expense {
  background: var(--danger);
  color: #fff;
  box-shadow: 0 2px 8px rgba(238,10,26,0.3);
}
.type-btn.active.income {
  background: var(--success);
  color: #fff;
  box-shadow: 0 2px 8px rgba(7,193,96,0.3);
}

/* 内容区 */
.page-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 16px 200px;
}

/* 金额区 - 吸顶 */
.amount-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: var(--card);
  position: sticky;
  top: 1px;
  z-index: 5;
  border-bottom: 1px solid var(--border);
  border-radius: var(--radius);
}
.amount-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.amount-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}
.amount-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--danger);
  transition: color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  max-width: 100%;
}
.amount-value.income {
  color: var(--success);
}
.amount-expr {
  font-size: 12px;
  color: var(--text-secondary);
  direction: rtl;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 日期备注 */
.date-note-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--card);
}
.dn-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.dn-item.note { flex: 1; }
.dn-text { font-size: 11px; font-weight: 500; }
.dn-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 11px;
  outline: none;
  font-family: inherit;
}
.dn-input::placeholder { color: var(--text-secondary); }

/* 区块 */
.section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 10px;
  padding: 0 2px;
}

/* 账本网格 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.book-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px 4px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.book-cell:active { transform: scale(0.95); }
.book-cell.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}
.book-cell-icon { font-size: 20px; }
.book-cell-name {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: center;
  line-height: 1.3;
  max-height: 26px;
}
.book-cell.selected .book-cell-name {
  color: var(--primary);
  font-weight: 600;
}

/* 分类网格 */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.cat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 2px 2px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-cell:active { transform: scale(0.95); }
.cat-cell.selected { font-weight: 600; }
.cat-icon-box {
  width: 40px; height: 40px;
  border-radius: var(--radius);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.cat-cell.selected .cat-icon-box {
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.cat-emoji { font-size: 20px; transition: transform 0.15s; }
.cat-cell.selected .cat-emoji { transform: scale(1.1); }
.cat-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.2;
}
.cat-cell.selected .cat-label {
  color: var(--primary);
  font-weight: 600;
}

/* 父分类网格 - 最多3行 */
.cat-parent-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 2px 0 8px;
}
.cat-parent-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1.5px solid var(--border);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
  min-height: 38px;
}
.cat-parent-chip.selected {
  font-weight: 700;
}
.cat-parent-icon { font-size: 16px; }
.cat-parent-name { font-size: 10px; font-weight: 500; }
.cat-parent-chip.selected .cat-parent-name { font-weight: 700; }

/* 分类弹窗 */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.popup-title { font-size: 16px; font-weight: 700; }
.popup-body {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}
.popup-cat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.popup-cat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.popup-cat-cell:active { transform: scale(0.95); }
.popup-cat-cell.selected { background: var(--primary-light); }
.popup-cat-icon-box {
  width: 40px; height: 40px;
  border-radius: var(--radius);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.popup-cat-cell.selected .popup-cat-icon-box {
  background: var(--primary);
  box-shadow: 0 2px 8px rgba(25,137,250,0.25);
}
.popup-cat-emoji { font-size: 20px; }
.popup-cat-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
}
.popup-cat-cell.selected .popup-cat-label {
  color: var(--primary);
  font-weight: 600;
}

/* 日期备注 */
.date-note-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.dn-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.dn-item.note { flex: 1; }
.dn-icon { font-size: 14px; }
.dn-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
}
.dn-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}
.dn-input::placeholder { color: var(--text-secondary); }

/* 自定义键盘 */
.keypad {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: var(--card);
  border-top: 1px solid var(--border);
  padding: 6px;
  overflow-x: hidden;
}
.keypad-row {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
}
.keypad-row:last-child { margin-bottom: 0; }
.kp-key {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: var(--radius);
  background: var(--bg);
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}
.kp-key:active { background: #e0e0e0; transform: scale(0.96); }
.kp-key.op {
  background: #f0f5ff;
  color: var(--primary);
  font-size: 20px;
}
.kp-key.op:active { background: #d6e4ff; }
.kp-key.save {
  flex: 2;
  background: linear-gradient(135deg, var(--primary), #40a9ff);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
}
.kp-key.save.income {
  background: linear-gradient(135deg, var(--success), #6dd480);
}
.kp-key.save:disabled { opacity: 0.6; cursor: not-allowed; }
.kp-key.save:active { opacity: 0.85; }

/* 工资单 */
.salary-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.salary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}
.salary-title { font-size: 16px; font-weight: 700; }
.salary-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}
.salary-section {
  background: var(--card);
  border-radius: var(--radius);
  padding: 12px 14px;
  margin-bottom: 10px;
}
.salary-section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.salary-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
}
.salary-label {
  flex: 1;
  font-size: 13px;
}
.salary-input {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  text-align: right;
  background: var(--bg);
  font-family: inherit;
}
.salary-input:focus { border-color: var(--primary); outline: none; }
.salary-row.total .salary-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
  min-width: 100px;
  text-align: right;
}
.salary-row.total.final .salary-value {
  font-size: 18px;
  color: var(--success);
}
.salary-row.disabled .salary-label {
  color: #c8c9cc;
}
.salary-row.disabled .salary-input {
  background: #f7f8fa;
  color: #c8c9cc;
}
.salary-check {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  flex-shrink: 0;
  accent-color: var(--primary);
}
.salary-footer {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
}
.salary-save-defaults {
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}
.salary-save-defaults:active { background: #f2f3f5; }
.salary-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--success), #6dd480);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.salary-confirm:active { opacity: 0.85; }
</style>
