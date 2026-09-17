<template>
  <div class="tab-bar-wrapper">
    <!-- 浮动记账按钮 -->
    <div class="fab-btn" @click="goTo('/edit')">
      <van-icon name="plus" size="22" />
    </div>

    <!-- 底部Tab栏 -->
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: isActive(tab.path) }"
        @click="goTo(tab.path)"
      >
        <van-icon :name="tab.icon" size="22" :color="isActive(tab.path) ? 'var(--primary)' : 'var(--text-secondary)'" />
        <div class="tab-label">{{ tab.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { path: '/', icon: 'records', label: '明细' },
  { path: '/stats', icon: 'bar-chart-o', label: '统计' },
  { path: '/profile', icon: 'contact-o', label: '我的' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function goTo(path: string) {
  if (route.path === path) return
  router.push(path)
}
</script>

<style scoped>
.tab-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 60px;
  z-index: 100;
}

.tab-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--card);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.fab-btn {
  position: fixed;
  bottom: 65px;
  right: 2%;
  transform: translateX(-50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 101;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.fab-btn:active {
  transform: translateX(-50%) scale(0.92);
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.25);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  min-width: 56px;
  transition: transform 0.15s;
  flex: 1;
}
.tab-item:active { transform: scale(0.92); }
.tab-label { font-size: 10px; color: var(--text-secondary); }
.tab-item.active .tab-label { color: var(--primary); font-weight: 600; }
</style>
