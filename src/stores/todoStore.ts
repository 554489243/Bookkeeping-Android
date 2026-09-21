import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, Todo } from '@/api/db'
import dayjs from 'dayjs'

type TodoType = 'money' | 'life' | 'work' | 'note' | 'health' | 'study'

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const loaded = ref(false)

  async function loadTodos() {
    if (loaded.value) return
    todos.value = await db.todos.orderBy('createdAt').reverse().toArray()
    loaded.value = true
  }

  async function addTodo(content: string, type: TodoType, priority: Todo['priority'], dueDate: string) {
    const todo: Todo = {
      content,
      type,
      priority,
      dueDate,
      done: false,
      createdAt: dayjs().toISOString(),
    }
    const id = await db.todos.add(todo)
    todos.value.unshift({ ...todo, id })
  }

  async function updateTodo(id: number, content: string, type: TodoType, priority: Todo['priority'], dueDate: string) {
    const updates = { content, type, priority, dueDate }
    await db.todos.update(id, updates)
    const idx = todos.value.findIndex(t => t.id === id)
    if (idx !== -1) todos.value[idx] = { ...todos.value[idx], ...updates }
  }

  async function toggleTodo(id: number) {
    const t = todos.value.find(t => t.id === id)
    if (!t) return
    t.done = !t.done
    t.doneAt = t.done ? dayjs().toISOString() : undefined
    // 完成与忽略互斥：勾上完成就取消忽略
    if (t.done) t.ignored = false
    await db.todos.update(id, { done: t.done, doneAt: t.doneAt, ignored: t.ignored })
  }

  /** 忽略 / 取消忽略：不删除，只是不再计入未完成与过期 */
  async function toggleIgnored(id: number) {
    const t = todos.value.find(t => t.id === id)
    if (!t) return
    t.ignored = !t.ignored
    // 忽略一条已完成的没有意义，顺手取消完成标记
    if (t.ignored && t.done) {
      t.done = false
      t.doneAt = undefined
    }
    await db.todos.update(id, { ignored: t.ignored, done: t.done, doneAt: t.doneAt })
  }

  async function deleteTodo(id: number) {
    await db.todos.delete(id)
    todos.value = todos.value.filter(t => t.id !== id)
  }

  async function cleanupOldTodos() {
    const cutoff = dayjs().subtract(365, 'day').toISOString()
    const all = await db.todos.toArray()
    const old = all.filter(t => t.done && t.doneAt && t.doneAt < cutoff)
    if (old.length) {
      await db.todos.bulkDelete(old.map(t => t.id!))
      todos.value = todos.value.filter(t => !old.some(o => o.id === t.id))
    }
  }

  return { todos, loaded, loadTodos, addTodo, updateTodo, toggleTodo, toggleIgnored, deleteTodo, cleanupOldTodos }
})
