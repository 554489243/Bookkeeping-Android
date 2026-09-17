<template>
  <div class="page">
    <div class="page-content">
      <van-nav-bar title="主题设置" left-arrow @click-left="$router.back()" />

      <!-- 预设方案 -->
      <div class="section-title">预设方案</div>
      <div class="preset-grid">
        <div
          v-for="(preset, i) in themeStore.presets"
          :key="i"
          class="preset-card"
          :class="{ active: themeStore.activePresetIndex === i }"
          @click="themeStore.applyPreset(i)"
        >
          <div class="preset-preview">
            <div class="preset-circle" :style="{ background: preset.config.primary }"></div>
            <div class="preset-circle" :style="{ background: preset.config.success }"></div>
            <div class="preset-circle" :style="{ background: preset.config.danger }"></div>
          </div>
          <div class="preset-name">{{ preset.name }}</div>
          <div v-if="themeStore.activePresetIndex === i" class="preset-check">✓</div>
        </div>
      </div>

      <!-- 自定义颜色 -->
      <div class="section-title">自定义颜色</div>
      <div class="color-list">
        <div class="color-item">
          <span class="color-label">主色</span>
          <input type="color" v-model="themeStore.config.primary" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.primary }}</span>
        </div>
        <div class="color-item">
          <span class="color-label">成功</span>
          <input type="color" v-model="themeStore.config.success" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.success }}</span>
        </div>
        <div class="color-item">
          <span class="color-label">危险</span>
          <input type="color" v-model="themeStore.config.danger" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.danger }}</span>
        </div>
        <div class="color-item">
          <span class="color-label">背景</span>
          <input type="color" v-model="themeStore.config.bg" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.bg }}</span>
        </div>
        <div class="color-item">
          <span class="color-label">卡片</span>
          <input type="color" v-model="themeStore.config.card" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.card }}</span>
        </div>
        <div class="color-item">
          <span class="color-label">文字</span>
          <input type="color" v-model="themeStore.config.text" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.text }}</span>
        </div>
        <div class="color-item">
          <span class="color-label">次要</span>
          <input type="color" v-model="themeStore.config.textSecondary" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.textSecondary }}</span>
        </div>
        <div class="color-item">
          <span class="color-label">边框</span>
          <input type="color" v-model="themeStore.config.border" @change="onColorChange" class="color-input" />
          <span class="color-hex">{{ themeStore.config.border }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <button class="btn-reset" @click="handleReset">恢复默认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { showConfirmDialog, showToast } from 'vant'

const themeStore = useThemeStore()

function onColorChange() {
  themeStore.activePresetIndex = -1
  themeStore.save()
}

async function handleReset() {
  await showConfirmDialog({
    title: '恢复默认',
    message: '确定要恢复为经典蓝白主题吗？',
    confirmButtonText: '恢复',
    confirmButtonColor: '#1989fa',
  })
  themeStore.reset()
  showToast('已恢复默认主题')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}
.page-content {
  flex: 1;
  padding-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 16px 16px 8px;
}

/* 预设方案 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 16px;
}
.preset-card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
  position: relative;
}
.preset-card.active {
  border-color: var(--primary);
}
.preset-preview {
  display: flex;
  gap: 6px;
}
.preset-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.preset-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}
.preset-check {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 14px;
  color: var(--primary);
  font-weight: 700;
}

/* 颜色列表 */
.color-list {
  background: var(--card);
  border-radius: var(--radius);
  margin: 0 16px;
  overflow: hidden;
}
.color-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}
.color-item:last-child {
  border-bottom: none;
}
.color-label {
  font-size: 14px;
  color: var(--text);
  width: 40px;
  flex-shrink: 0;
}
.color-input {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}
.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}
.color-input::-webkit-color-swatch {
  border: 2px solid var(--border);
  border-radius: 6px;
}
.color-hex {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  margin-left: auto;
}

/* 操作按钮 */
.action-bar {
  padding: 20px 16px;
}
.btn-reset {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-reset:active {
  background: var(--bg);
}
</style>
