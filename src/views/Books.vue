<template>
  <div class="page books-page">
    <!-- 顶部装饰 -->
    <div class="books-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <div class="title-row">
          <h1>我的账本</h1>
          <span class="book-count">{{ bookStore.books.length }}个</span>
        </div>
        <p class="subtitle">长按拖拽可调整顺序</p>
      </div>
    </div>

    <div class="page-content">
      <!-- 账本卡片列表 -->
      <div class="book-grid">
        <div
          v-for="(book, index) in sortedBooks"
          :key="book.id"
          class="book-card"
          :class="{ 
            hidden: book.hidden,
            'dragging': draggingId === book.id,
            'drag-over': dragOverIndex === index && draggingId !== book.id
          }"
          :style="getCardStyle(book.id!, index)"
        >
          <div class="drag-handle" @touchstart.prevent="onTouchStart($event, book.id!, index)" @touchmove.prevent="onTouchMove($event)" @touchend.prevent="onTouchEnd($event)" @touchcancel.prevent="onTouchEnd($event)">
            <span class="grip-dots">⠿</span>
          </div>
          <div class="book-icon-wrap" :style="{ background: book.color + '20' }">
            <span class="book-icon">{{ book.icon }}</span>
          </div>
          <div class="book-card-body">
            <h3 class="book-name">
              {{ book.name }}
              <div class="book-badges">
                <span v-if="book.isDefault" class="badge default">默认</span>
                <span v-if="book.hidden" class="badge hidden">隐藏</span>
              </div>
            </h3>
            <div class="book-stats">
              <span class="stat">{{ getBookRecordCount(book.id!) }} 条记录</span>
            </div>
          </div>
          <div class="book-card-footer">
            <button class="action-btn" :disabled="book.isDefault" @click.stop="bookStore.toggleHidden(book.id!)">
              <van-icon :name="book.hidden ? 'eye-o' : 'closed-eye'" size="12" />
            </button>
            <button class="action-btn" :disabled="book.isDefault" @click.stop="editBook(book)">
              <van-icon name="edit" size="12" />
            </button>
            <button class="action-btn delete" :disabled="book.isDefault" @click.stop="handleDelete(book.id!)">
              <van-icon name="delete-o" size="12" />
            </button>
          </div>
        </div>

        <!-- 新建账本卡片 -->
        <div class="book-card add-card" @click="showAddModal = true">
          <div class="add-icon">
            <van-icon name="plus" size="28" />
          </div>
          <span class="add-text">新建账本</span>
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <van-popup v-model:show="showAddModal" position="bottom" round :style="{ height: '65%' }">
      <div class="modal-header">
        <button class="modal-cancel" @click="closeModal">取消</button>
        <h2>{{ editingBook ? '编辑账本' : '新建账本' }}</h2>
        <button class="modal-save" @click="saveBook">保存</button>
      </div>
      <div class="modal-content">
        <div class="form-section">
          <label class="form-label">名称</label>
          <input v-model="formName" class="form-input" placeholder="如：国庆旅游" maxlength="15" />
        </div>
        <div class="form-section">
          <label class="form-label">图标</label>
          <div class="icon-grid">
            <div
              v-for="icon in iconOptions"
              :key="icon"
              class="icon-option"
              :class="{ selected: formIcon === icon }"
              @click="formIcon = icon"
            >{{ icon }}</div>
          </div>
        </div>
        <div class="form-section">
          <label class="form-label">颜色</label>
          <div class="color-grid">
            <div
              v-for="color in colorOptions"
              :key="color"
              class="color-option"
              :class="{ selected: formColor === color }"
              :style="{ background: color }"
              @click="formColor = color"
            >
              <van-icon v-if="formColor === color" name="success" size="16" color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { useBookStore } from '@/stores/bookStore'
import { useRecordStore } from '@/stores/recordStore'
import { Book } from '@/api/db'
import TabBar from '@/components/TabBar.vue'

const bookStore = useBookStore()
const recordStore = useRecordStore()

const showAddModal = ref(false)
const editingBook = ref<Book | null>(null)
const formName = ref('')
const formIcon = ref('📱')
const formColor = ref('#1989fa')

// 拖拽状态
const draggingId = ref<number | null>(null)
const dragOverIndex = ref<number>(-1)
const touchStartY = ref(0)
const touchStartX = ref(0)
const currentY = ref(0)
const cardHeight = 72 // 卡片高度 + gap
const dragIndex = ref(-1)
const isDragging = ref(false)
const dragTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const sortedBooks = computed(() => {
  return [...bookStore.books].sort((a, b) => {
    if (a.isDefault) return -1
    if (b.isDefault) return 1
    return a.sort - b.sort
  })
})

const iconOptions = [
  '📱', '💼', '🏖️', '🎮', '🏠', '🚗', '💊', '📚', '🎁', '📈',
  '🍜', '🛒', '🏋️', '✈️', '🎵', '🐱', '💰', '🎓', '🐶', '🌍',
  '🎬', '🍔', '💍', '🎯', '🌈', '🏥', '🎪', '🌻', '🚲', '🎨',
  '🍕', '🏦', '💝', '🦄', '🎭', '🍦', '🚀', '🌺', '🎸', '🏰'
]
const colorOptions = ['#1989fa', '#07c160', '#ff976a', '#ee0a24', '#b37feb', '#36cfc9', '#597ef7', '#ffd666']

function getBookRecordCount(bookId: number) {
  return recordStore.records.filter(r => r.bookId === bookId).length
}

function editBook(book: Book) {
  if (book.isDefault) return
  editingBook.value = book
  formName.value = book.name
  formIcon.value = book.icon
  formColor.value = book.color
  showAddModal.value = true
}

function closeModal() {
  showAddModal.value = false
  editingBook.value = null
  formName.value = ''
  formIcon.value = '📱'
  formColor.value = '#1989fa'
}

async function saveBook() {
  if (!formName.value.trim()) {
    showToast('请输入账本名称')
    return
  }

  if (editingBook.value) {
    await bookStore.updateBook(editingBook.value.id!, {
      name: formName.value.trim(),
      icon: formIcon.value,
      color: formColor.value
    })
    showToast('已更新')
  } else {
    const nonDefaultBooks = bookStore.books.filter(b => !b.isDefault)
    const minSort = nonDefaultBooks.length > 0
      ? Math.min(...nonDefaultBooks.map(b => b.sort)) - 1
      : 0
    await bookStore.addBook({
      name: formName.value.trim(),
      icon: formIcon.value,
      color: formColor.value,
      sort: minSort,
      isDefault: false,
      hidden: false,
      createdAt: Date.now()
    })
    showToast('已创建')
  }

  closeModal()
}

async function handleDelete(id: number) {
  const book = bookStore.getById(id)
  if (!book) return

  if (book.isDefault) {
    showToast('默认账本不可删除')
    return
  }

  if (bookStore.books.length <= 1) {
    showToast('至少保留一个账本')
    return
  }

  await showConfirmDialog({
    title: '删除账本',
    message: `确定要删除"${book.name}"吗？相关记录也会被删除。`,
    confirmButtonText: '删除',
    confirmButtonColor: '#ee0a24'
  })

  await bookStore.deleteBook(id)
  showToast('已删除')
}

// === 触摸拖拽排序 ===
function onTouchStart(e: TouchEvent, bookId: number, index: number) {
  const book = sortedBooks.value[index]
  if (!book || book.isDefault) return
  
  touchStartY.value = e.touches[0].clientY
  touchStartX.value = e.touches[0].clientX
  currentY.value = 0
  dragIndex.value = index
  isDragging.value = false
  
  // 长按 300ms 后进入拖拽模式
  dragTimer.value = setTimeout(() => {
    draggingId.value = bookId
    isDragging.value = true
    dragOverIndex.value = index
    // 震动反馈
    if (navigator.vibrate) navigator.vibrate(50)
  }, 300)
}

function onTouchMove(e: TouchEvent) {
  if (draggingId.value === null) {
    // 还没进入拖拽模式，检查是否移动过多（滚动 vs 拖拽）
    const dy = Math.abs(e.touches[0].clientY - touchStartY.value)
    const dx = Math.abs(e.touches[0].clientX - touchStartX.value)
    if (dy > 10 || dx > 10) {
      // 移动了，取消拖拽计时
      if (dragTimer.value) {
        clearTimeout(dragTimer.value)
        dragTimer.value = null
      }
    }
    return
  }
  
  if (!isDragging.value) return
  
  currentY.value = e.touches[0].clientY - touchStartY.value
  
  // 计算当前拖拽到哪个位置
  const totalMove = currentY.value
  const slots = Math.round(totalMove / cardHeight)
  let newIndex = dragIndex.value + slots
  newIndex = Math.max(0, Math.min(sortedBooks.value.length - 1, newIndex))
  
  if (newIndex !== dragOverIndex.value) {
    dragOverIndex.value = newIndex
  }
}

function onTouchEnd(_e: TouchEvent) {
  if (dragTimer.value) {
    clearTimeout(dragTimer.value)
    dragTimer.value = null
  }
  
  if (isDragging.value && draggingId.value !== null && dragOverIndex.value >= 0) {
    if (dragOverIndex.value !== dragIndex.value) {
      bookStore.reorderBooks(dragIndex.value, dragOverIndex.value)
    }
  }
  
  draggingId.value = null
  dragOverIndex.value = -1
  isDragging.value = false
  currentY.value = 0
  dragIndex.value = -1
}

function getCardStyle(bookId: number, _index: number) {
  if (draggingId.value === bookId && isDragging.value) {
    return {
      transform: `translateY(${currentY.value}px)`,
      zIndex: 1000,
      opacity: 0.9,
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
    }
  }
  if (dragOverIndex.value === _index && draggingId.value !== null) {
    return {
      transform: 'scale(0.97)',
      opacity: 0.7
    }
  }
  return {}
}

onMounted(async () => {
  await bookStore.init()
  await recordStore.loadRecords()
})
</script>

<style scoped>
.books-page {
  background: var(--bg);
}

/* 顶部装饰区 */
.books-header {
  position: relative;
  padding: 20px 20px 24px;
  overflow: hidden;
}
.header-bg {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(25,137,250,0.1), rgba(64,169,255,0.05));
}
.header-content {
  position: relative;
  z-index: 1;
}
.title-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.header-content h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}
.book-count {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--card);
  padding: 2px 10px;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
}

/* 账本网格 */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 80px;
}

.book-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 账本卡片 */
.book-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 14px;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: cardIn 0.4s ease both;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  cursor: default;
  position: relative;
  touch-action: pan-y;
}
.book-card:active {
  transform: scale(0.99);
  box-shadow: var(--shadow-sm);
}
.book-card.hidden {
  opacity: 0.6;
}
.book-card.dragging {
  transition: none;
  cursor: grabbing;
  background: #f0f7ff;
  border: 2px dashed var(--primary);
}
.book-card.drag-over {
  border: 2px dashed var(--primary);
  background: #f0f7ff;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 拖拽手柄 */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 36px;
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.drag-handle:active {
  cursor: grabbing;
  opacity: 1;
}
.grip-dots {
  font-size: 14px;
  line-height: 1;
  letter-spacing: -2px;
  color: var(--text-secondary);
}

.book-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.book-icon {
  font-size: 24px;
}

.book-card-body {
  flex: 1;
  min-width: 0;
}
.book-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book-badges {
  display: flex;
  gap: 4px;
}
.badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}
.badge.default {
  background: var(--primary);
  color: #fff;
}
.badge.hidden {
  background: #969799;
  color: #fff;
}
.book-stats {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 操作按钮 */
.book-card-footer {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.15s;
  font-size: 12px;
}
.action-btn:active {
  background: var(--primary-light);
  color: var(--primary);
}
.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.action-btn.delete:active {
  background: #ffebeb;
  color: var(--danger);
}


/* 新建卡片 */
.add-card {
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed var(--border);
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  padding: 18px;
}
.add-card:active {
  border-color: var(--primary);
  background: var(--primary-light);
}
.add-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.add-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 弹窗 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-header h2 {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
}
.modal-cancel {
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}
.modal-save {
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
}

.modal-content {
  padding: 20px;
}
.form-section {
  margin-bottom: 24px;
}
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 15px;
  font-family: inherit;
  background: var(--bg);
}
.form-input:focus {
  border-color: var(--primary);
  outline: none;
}

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

.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
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
</style>
