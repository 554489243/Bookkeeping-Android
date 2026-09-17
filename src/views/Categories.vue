<template>
  <div class="page categories-page">
    <div class="page-header">
      <div class="header-btn" @click="$router.back()">
        <van-icon name="arrow-left" size="20" />
      </div>
      <h1>分类管理</h1>
      <div class="header-btn" @click="openAddModal()">
        <van-icon name="plus" size="20" />
      </div>
    </div>

    <!-- 类型切换 -->
    <div class="type-tab-bar">
      <button class="type-tab" :class="{ active: activeType === 'expense', expense: activeType === 'expense' }" @click="activeType = 'expense'">支出</button>
      <button class="type-tab" :class="{ active: activeType === 'income', income: activeType === 'income' }" @click="activeType = 'income'">收入</button>
    </div>

    <div class="page-content">
      <!-- 父分类列表 -->
      <div class="parent-group" v-for="parent in filteredParents" :key="parent.id">
        <div class="parent-header" :style="{ borderLeftColor: colorOf(parent).bg }">
          <span class="parent-icon">{{ parent.icon }}</span>
          <span class="parent-name" :style="{ color: colorOf(parent).text }">{{ parent.name }}</span>
          <span v-if="parent.builtin" class="builtin-tag">内置</span>
          <div class="parent-actions">
            <button class="p-action" @click="openAddModal(parent.id)">
              <van-icon name="plus" size="14" />
            </button>
            <button class="p-action" @click="openEditModal(parent)">
              <van-icon name="edit" size="14" />
            </button>
            <button class="p-action del" :disabled="parent.builtin" :class="{ builtin: parent.builtin }" @click="!parent.builtin && handleDelete(parent.id!)">
              <van-icon name="delete-o" size="14" />
            </button>
          </div>
        </div>
        <!-- 子分类列表 -->
        <div class="child-list" v-if="getChildren(parent.id!).length > 0">
          <div class="child-item" v-for="child in getChildren(parent.id!)" :key="child.id">
            <span class="child-icon" :style="{ background: colorOf(child).light }">{{ child.icon }}</span>
            <span class="child-name">{{ child.name }}</span>
            <span v-if="child.builtin" class="builtin-tag child">内置</span>
            <span v-if="child.defaultAmount" class="child-default">¥{{ (child.defaultAmount / 100).toFixed(0) }}</span>
            <div class="child-actions">
              <button class="c-action" @click="openEditModal(child)">
                <van-icon name="edit" size="12" />
              </button>
              <button class="c-action del" :disabled="child.builtin" :class="{ builtin: child.builtin }" @click="!child.builtin && handleDelete(child.id!)">
                <van-icon name="delete-o" size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredParents.length === 0" class="empty-state">
        <span>暂无分类</span>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <van-popup v-model:show="showModal" position="bottom" round :style="{ height: builtinEditing ? '40%' : '55%' }">
      <div class="modal-header">
        <button class="modal-cancel" @click="showModal = false">取消</button>
        <h2>{{ builtinEditing ? '修改默认金额' : (editingId ? '编辑分类' : (formParentId ? '添加子分类' : '添加父分类')) }}</h2>
        <button class="modal-save" @click="handleSave">保存</button>
      </div>
      <div class="modal-content">
        <!-- 内置分类：只显示默认金额 -->
        <template v-if="builtinEditing">
          <div class="form-section">
            <label class="form-label">{{ formName }} — 默认金额（选填）</label>
            <input v-model="formDefaultAmount" class="form-input" placeholder="如：3000" type="number" />
          </div>
        </template>
        <!-- 自定义分类：完整表单 -->
        <template v-else>
          <div class="form-section">
            <label class="form-label">名称</label>
            <input
              ref="nameInputRef"
              v-model="formName"
              @compositionend="syncNameFromDom"
              class="form-input"
              placeholder="分类名称"
              maxlength="8"
            />
          </div>
          <div class="form-section" v-if="formParentId">
            <label class="form-label">默认金额（选填）</label>
            <input
              v-model="formDefaultAmount"
              class="form-input"
              placeholder="如：3000"
              type="number"
            />
          </div>
          <div class="form-section">
            <label class="form-label">图标</label>
            <div class="icon-grid">
              <div v-for="icon in iconOptions" :key="icon" class="icon-option" :class="{ selected: formIcon === icon }" @click="selectIcon(icon)">{{ icon }}</div>
            </div>
          </div>
          <div class="form-section">
            <label class="form-label">
              颜色
              <span v-if="formColorInherited" class="label-hint">跟随上级</span>
            </label>
            <div class="color-grid">
              <div
                v-for="c in colorOptions"
                :key="c"
                class="color-option"
                :class="{ selected: formColor === c }"
                :style="{ background: c }"
                @click="selectColor(c)"
              >
                <van-icon v-if="formColor === c" name="success" size="16" color="#fff" />
              </div>
              <!-- 清除自定义色，恢复按名称匹配的默认色 -->
              <div
                class="color-option reset"
                :class="{ selected: !formColor }"
                @click="selectColor('')"
              >
                <van-icon v-if="!formColor" name="success" size="16" color="#fff" />
                <span v-else class="reset-glyph">A</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { useCategoryStore } from '@/stores/categoryStore'
import { resolveCategoryColor } from '@/utils/colors'
import { Category } from '@/api/db'

const categoryStore = useCategoryStore()
const activeType = ref<'expense' | 'income'>('expense')
const showModal = ref(false)
const editingId = ref<number | null>(null)
const builtinEditing = ref(false)
const formParentId = ref<number | null>(null)
const formName = ref('')
const formIcon = ref('📦')
const formColor = ref('')
const formDefaultAmount = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)

/** 供选色器使用的预设色板（与账本一致） */
const colorOptions = ['#1989fa', '#07c160', '#ff976a', '#ee0a24', '#b37feb', '#36cfc9', '#597ef7', '#ffd666']

/** 当前未选色、但父分类有色 —— 提示"跟随上级" */
const formColorInherited = computed(() => {
  if (formColor.value) return false
  if (!formParentId.value) return false
  const parent = categoryStore.categories.find(c => c.id === formParentId.value)
  return !!parent?.color
})

/** 按分类对象取色（自定义色 > 继承父色 > 名称匹配内置色表） */
function colorOf(cat: Category) {
  return resolveCategoryColor(cat, categoryStore.categories)
}

const filteredParents = computed(() =>
  categoryStore.categories
    .filter(c => c.type === activeType.value && !c.parentId)
    .sort((a, b) => a.sort - b.sort)
)

const iconOptions = ['🍜','🚗','🛒','🏠','🎮','💊','📚','📱','👔','💅','🎉','✈️','💻','🚙','🐱','🏋️','📖','🚬','🧧','🔧','🤝','🛡️','📦','💰','🎁','📈','💼','📋','↩️','🏘️','🎊','🏆','♻️','💵','⛽','🔌','🚕','👗','🧴','🍪','🎬','🏥','🔬','🎓']

function getChildren(parentId: number) {
  return categoryStore.getChildCategories(parentId)
}

// 移动端（尤其 Android WebView）里，原生 input 的 v-model 在以下场景可能同步不上：
//   1. 中文输入法拼音组合中（composition 未结束）
//   2. 某些输入法的自动填充/联想不派发标准 input 事件
// 处理方式：仍保留 v-model（避免手动改 value 打断输入法组合、导致光标跳尾丢字），
// 额外在 compositionend / blur 时补一次同步，并在保存前再做 DOM 兜底读取。
function syncNameFromDom() {
  const domVal = nameInputRef.value?.value
  if (domVal !== undefined && domVal !== formName.value) {
    formName.value = domVal
  }
}

// 选择图标前先同步一次名称，否则 formIcon 变化触发重渲染时，
// 会用尚未同步的空 formName 覆盖掉输入框里已输入的文本（表现为"选了图标名字就没了"）。
function selectIcon(icon: string) {
  syncNameFromDom()
  formIcon.value = icon
}

// 同上：选颜色也会触发重渲染，必须先同步名称。
// 传空字符串表示"恢复默认色"（清除自定义颜色）。
function selectColor(color: string) {
  syncNameFromDom()
  formColor.value = color
}

function openAddModal(parentId: number | null = null) {
  editingId.value = null
  builtinEditing.value = false
  formParentId.value = parentId
  formName.value = ''
  formIcon.value = '📦'
  formColor.value = ''
  formDefaultAmount.value = ''
  showModal.value = true
}

function openEditModal(cat: Category) {
  editingId.value = cat.id!
  builtinEditing.value = !!cat.builtin
  formParentId.value = cat.parentId || null
  formName.value = cat.name
  formIcon.value = cat.icon
  formColor.value = cat.color || ''
  formDefaultAmount.value = cat.defaultAmount ? (cat.defaultAmount / 100).toFixed(0) : ''
  showModal.value = true
}

async function handleSave() {
  // 兜底：保存前再从 DOM 读一次，覆盖输入法没派发 input 事件的情况。
  // 必须在下面的名称校验之前执行，否则会出现"明明输入了却提示请输入名称"。
  syncNameFromDom()

  // 内置分类：只更新默认金额
  if (builtinEditing.value) {
    if (formDefaultAmount.value) {
      const val = parseFloat(formDefaultAmount.value)
      if (isNaN(val) || val < 0) { showToast('请输入有效的默认金额'); return }
      await categoryStore.updateCategory(editingId.value!, {
        defaultAmount: Math.round(val * 100),
      })
    } else {
      await categoryStore.updateCategory(editingId.value!, {
        defaultAmount: undefined,
      })
    }
    showToast('已更新')
    showModal.value = false
    return
  }

  // 自定义分类：完整校验
  if (!formName.value.trim()) { showToast('请输入名称'); return }

  if (formParentId.value && formDefaultAmount.value) {
    const val = parseFloat(formDefaultAmount.value)
    if (isNaN(val) || val < 0) { showToast('请输入有效的默认金额'); return }
  }

  const maxSort = categoryStore.categories
    .filter(c => c.type === activeType.value && c.parentId === formParentId.value)
    .reduce((max, c) => Math.max(max, c.sort), 0)

  const data: Omit<Category, 'id'> = {
    type: activeType.value,
    name: formName.value.trim(),
    icon: formIcon.value,
    sort: maxSort + 1,
    builtin: false,
    parentId: formParentId.value || undefined,
    // 空字符串表示未选自定义色 → 存 undefined，退回按名称匹配的默认配色
    color: formColor.value || undefined,
    ...(formParentId.value && formDefaultAmount.value ? { defaultAmount: Math.round(parseFloat(formDefaultAmount.value) * 100) } : {}),
  }

  if (editingId.value) {
    await categoryStore.updateCategory(editingId.value, data)
    showToast('已更新')
  } else {
    await categoryStore.addCategory(data)
    showToast('已添加')
  }
  showModal.value = false
}

async function handleDelete(id: number) {
  await showConfirmDialog({ title: '删除分类', message: '确定要删除这个分类吗？', confirmButtonText: '删除', confirmButtonColor: '#ee0a24' })
  // 如果是父分类，先删除所有子分类
  const children = categoryStore.getChildCategories(id)
  for (const child of children) {
    await categoryStore.deleteCategory(child.id!)
  }
  await categoryStore.deleteCategory(id)
  showToast('已删除')
}

onMounted(async () => {
  await categoryStore.loadCategories()
})
</script>

<style scoped>
.categories-page {
  background: var(--bg);
  padding-bottom: 0;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--card);
}
.page-header h1 {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  margin: 0;
}
.header-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  cursor: pointer;
}

/* 类型切换 */
.type-tab-bar {
  display: flex;
  background: var(--bg);
  border-radius: 20px;
  padding: 3px;
  margin: 12px 16px;
  gap: 2px;
}
.type-tab {
  flex: 1;
  padding: 8px 0;
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
.type-tab.active.expense {
  background: var(--danger);
  color: #fff;
}
.type-tab.active.income {
  background: var(--success);
  color: #fff;
}

/* 内容区 */
.page-content {
  padding: 0 16px 80px;
}

/* 父分类组 */
.parent-group {
  background: var(--card);
  border-radius: var(--radius);
  padding: 12px 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
}
.parent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  border-left: 3px solid transparent;
  padding-left: 10px;
}
.parent-icon { font-size: 22px; }
.parent-name { flex: 1; font-size: 13px; font-weight: 700; }
.builtin-tag {
  font-size: 10px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-light);
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}
.builtin-tag.child {
  font-size: 9px;
  padding: 1px 4px;
}
.parent-actions {
  display: flex;
  gap: 4px;
}
.p-action {
  width: 28px; height: 28px;
  border: none;
  background: var(--bg);
  border-radius: 6px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary);
  transition: all 0.15s;
}
.p-action:active { background: var(--primary-light); color: var(--primary); }
.p-action:disabled { opacity: 0.3; cursor: not-allowed; }
.p-action.builtin { opacity: 0.3; cursor: not-allowed; }
.p-action.builtin:active { background: var(--bg); color: var(--text-secondary); }
.p-action.del:active { background: #ffebeb; color: var(--danger); }

/* 子分类列表 */
.child-list {
  padding-top: 6px;
}
.child-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.child-item:last-child { border-bottom: none; }
.child-icon { font-size: 18px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--bg); }
.child-name { flex: 1; font-size: 12px; }
.child-item .builtin-tag { margin-right: 4px; }
.child-default {
  font-size: 11px;
  color: var(--primary);
  font-weight: 600;
  background: var(--primary-light);
  padding: 2px 6px;
  border-radius: 6px;
}
.child-actions {
  display: flex;
  gap: 4px;
}
.c-action {
  width: 24px; height: 24px;
  border: none;
  background: var(--bg);
  border-radius: 4px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary);
  transition: all 0.15s;
  font-size: 10px;
}
.c-action:active { background: var(--primary-light); color: var(--primary); }
.c-action:disabled { opacity: 0.3; cursor: not-allowed; }
.c-action.builtin { opacity: 0.3; cursor: not-allowed; }
.c-action.builtin:active { background: var(--bg); color: var(--text-secondary); }
.c-action.del:active { background: #ffebeb; color: var(--danger); }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

/* 弹窗 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-header h2 { font-size: 17px; font-weight: 700; margin: 0; }
.modal-cancel {
  border: none; background: transparent;
  font-size: 14px; color: var(--text-secondary); cursor: pointer;
}
.modal-save {
  border: none; background: transparent;
  font-size: 14px; color: var(--primary); font-weight: 600; cursor: pointer;
}

.modal-content { padding: 20px; }
.form-section { margin-bottom: 20px; }
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 15px;
  font-family: inherit;
  background: var(--bg);
}
.form-input:focus { border-color: var(--primary); outline: none; }

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}
.icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  border-radius: var(--radius);
  background: var(--bg);
  cursor: pointer;
  font-size: 20px;
  transition: all 0.15s;
}
.icon-option.selected {
  background: var(--primary-light);
  box-shadow: 0 0 0 2px var(--primary);
}

/* 颜色选择器（与账本页保持一致） */
.label-hint {
  font-weight: 400;
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}
.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}
.color-option {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.color-option.selected {
  border-color: var(--text);
  transform: scale(1.1);
}
/* 恢复默认色：白底 + 斜线，视觉上区别于彩色圆点 */
.color-option.reset {
  background: var(--bg);
  border: 1px dashed var(--border);
  color: var(--text-secondary);
}
.color-option.reset.selected {
  border: 3px solid var(--text);
  background: var(--primary-light);
}
.reset-glyph {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
}
</style>
