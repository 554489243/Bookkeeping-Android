import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ThemeConfig {
  primary: string
  success: string
  danger: string
  bg: string
  card: string
  text: string
  textSecondary: string
  border: string
}

export interface ThemePreset {
  name: string
  config: ThemeConfig
}

const STORAGE_KEY = 'themeConfig'

const defaultTheme: ThemeConfig = {
  primary: '#4F8CFF',
  success: '#34D399',
  danger: '#FB7185',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#94A3B8',
  border: '#E2E8F0',
}

export const presets: ThemePreset[] = [
  {
    name: '清爽蓝',
    config: {
      primary: '#4F8CFF',
      success: '#34D399',
      danger: '#FB7185',
      bg: '#F8FAFC',
      card: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#94A3B8',
      border: '#E2E8F0',
    }
  },
  {
    name: '薄荷绿',
    config: {
      primary: '#34D399',
      success: '#22D3EE',
      danger: '#F87171',
      bg: '#F0FDF9',
      card: '#FFFFFF',
      text: '#134E4A',
      textSecondary: '#6B7280',
      border: '#CCFBF1',
    }
  },
  {
    name: '珊瑚橙',
    config: {
      primary: '#FB923C',
      success: '#34D399',
      danger: '#F43F5E',
      bg: '#FFF8F5',
      card: '#FFFFFF',
      text: '#431407',
      textSecondary: '#9A3412',
      border: '#FED7AA',
    }
  },
  {
    name: '薰衣草',
    config: {
      primary: '#A78BFA',
      success: '#34D399',
      danger: '#FB7185',
      bg: '#FAF5FF',
      card: '#FFFFFF',
      text: '#3B0764',
      textSecondary: '#7C3AED',
      border: '#E9D5FF',
    }
  },
]

function loadFromStorage(): ThemeConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { ...defaultTheme }
}

function applyToDOM(config: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty('--primary', config.primary)
  root.style.setProperty('--success', config.success)
  root.style.setProperty('--danger', config.danger)
  root.style.setProperty('--bg', config.bg)
  root.style.setProperty('--card', config.card)
  root.style.setProperty('--text', config.text)
  root.style.setProperty('--text-secondary', config.textSecondary)
  root.style.setProperty('--border', config.border)

  // 计算衍生色
  root.style.setProperty('--primary-light', config.primary + '18')
  root.style.setProperty('--success-light', config.success + '18')
  root.style.setProperty('--danger-light', config.danger + '15')
}

export const useThemeStore = defineStore('theme', () => {
  const config = ref<ThemeConfig>(loadFromStorage())
  const activePresetIndex = ref(-1)

  // 初始化应用
  applyToDOM(config.value)

  // 保存到 localStorage
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    applyToDOM(config.value)
    // 更新 activePresetIndex
    const idx = presets.findIndex(p =>
      JSON.stringify(p.config) === JSON.stringify(config.value)
    )
    activePresetIndex.value = idx
  }

  // 应用预设
  function applyPreset(index: number) {
    config.value = { ...presets[index].config }
    activePresetIndex.value = index
    save()
  }

  // 重置
  function reset() {
    config.value = { ...defaultTheme }
    activePresetIndex.value = 0
    save()
  }

  // 初始化时检测当前是哪个预设
  const idx = presets.findIndex(p =>
    JSON.stringify(p.config) === JSON.stringify(config.value)
  )
  activePresetIndex.value = idx

  return {
    config,
    activePresetIndex,
    presets,
    save,
    applyPreset,
    reset,
  }
})
