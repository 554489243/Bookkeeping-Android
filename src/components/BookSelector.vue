<template>
  <div class="book-selector" ref="selectorRef">
    <div class="book-trigger" @click="showDropdown = !showDropdown">
      <span class="book-icon">{{ displayIcon }}</span>
      <span class="book-name">{{ displayName }}</span>
      <van-icon name="arrow-down" size="12" :class="{ rotated: showDropdown }" />
    </div>

    <div v-if="showDropdown" class="book-dropdown">
      <div
        class="book-option"
        :class="{ active: currentBookId === null }"
        @click="selectBook(null)"
      >
        <span class="icon">📚</span>
        <span class="name">全部</span>
      </div>
      <div
        v-for="book in sortedVisibleBooks"
        :key="book.id"
        class="book-option"
        :class="{ active: currentBookId === book.id }"
        @click="selectBook(book.id)"
      >
        <span class="icon" :style="{ background: book.color + '20', color: book.color }">{{ book.icon }}</span>
        <span class="name">{{ book.name }}</span>
      </div>
      <div class="book-option add" @click="goManageBooks">
        <span class="icon">⚙️</span>
        <span class="name">管理账本</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '@/stores/bookStore'
import { Icon } from 'vant'

const router = useRouter()
const bookStore = useBookStore()
const showDropdown = ref(false)
const selectorRef = ref<HTMLElement>()

const displayName = computed(() => {
  if (bookStore.isAllBooks) return '全部'
  return bookStore.currentBook?.name || '全部'
})

const displayIcon = computed(() => {
  if (bookStore.isAllBooks) return '📚'
  return bookStore.currentBook?.icon || '📚'
})

const sortedVisibleBooks = computed(() => {
  return bookStore.sortedBooks
    .filter(b => !b.hidden)
    .sort((a, b) => {
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      return a.sort - b.sort
    })
})

function selectBook(bookId: number | null | undefined) {
  bookStore.setCurrentBook(bookId)
  showDropdown.value = false
}

function goManageBooks() {
  showDropdown.value = false
  router.push('/books')
}

const currentBookId = computed(() => bookStore.currentBookId)

function handleClickOutside(e: MouseEvent) {
  if (selectorRef.value && !selectorRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 确保账本数据已加载（首次进入统计页时）
  if (bookStore.books.length === 0) {
    bookStore.init()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.book-selector {
  position: relative;
}
.book-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 13px;
 width: 266px;
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.book-trigger:active { background: var(--bg); }
.book-icon { font-size: 14px; }
.book-name {
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.van-icon) {
  transition: transform 0.2s;
  color: var(--text-secondary);
}
:deep(.van-icon.rotated) {
  transform: rotate(180deg);
}

.book-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 150px;
  max-height: 255px;
  overflow-y: auto;
  z-index: 100;
  overflow-x: hidden;
  border: 1px solid var(--border);
  animation: dropdownIn 0.15s ease;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.book-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text);
  transition: background 0.15s;
}
.book-option:active { background: var(--bg); }
.book-option.active { color: var(--primary); font-weight: 600; background: var(--primary-light); }
.book-option.add { border-top: 1px solid var(--border); color: var(--text-secondary); }
.book-option .icon { font-size: 16px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.book-option .name { flex: 1; }
</style>
