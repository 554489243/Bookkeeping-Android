import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// APK 专用构建配置（Capacitor 内部打包）
//
// 与网页版（Bookkeeping-v1.0）的关键差异：
//   1. base 用相对路径 './'。APK 里资源由 file:// 或本地 WebView 服务加载，
//      不能有 /Bubu12Money/ 这种绝对前缀，否则找不到文件。
//   2. 不启用 VitePWA / Service Worker。APK 内是全量本地资源，
//      本来就不需要网络，Service Worker 反而会干扰更新（改了代码但 SW 缓存旧文件）。
//   3. WebView 兼容目标下调到 Android 5.0（API 21），覆盖所有安卓手机。
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    // Android 5.0 系统 WebView 较老，避免用过新的语法导致白屏
    target: ['es2015', 'chrome61'],
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['vant'],
          charts: ['echarts']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
