import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/List.vue') },
  { path: '/edit', name: 'edit', component: () => import('@/views/Edit.vue') },
  { path: '/edit/:id', name: 'edit-with-id', component: () => import('@/views/Edit.vue') },
  { path: '/list', name: 'list', component: () => import('@/views/List.vue') },
  { path: '/stats', name: 'stats', component: () => import('@/views/Home.vue') },
  { path: '/profile', name: 'profile', component: () => import('@/views/Profile.vue') },
  { path: '/books', name: 'books', component: () => import('@/views/Books.vue') },
  { path: '/categories', name: 'categories', component: () => import('@/views/Categories.vue') },
  { path: '/manual', name: 'manual', component: () => import('@/views/Manual.vue') },
  { path: '/theme', name: 'theme', component: () => import('@/views/ThemeSettings.vue') },
  { path: '/todos', name: 'todos', component: () => import('@/views/Todos.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
