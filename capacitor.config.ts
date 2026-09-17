import type { CapacitorConfig } from '@capacitor/cli'

// Capacitor 配置 —— 内置离线打包，不依赖任何外部服务
//
// 设计要点：
//   - webDir 指向构建产物 dist，Capacitor 会把整个前端打包进 APK。
//   - 不配置 server.url，即完全离线：所有资源来自 APK 内部，不走网络。
//   - androidWebView 使用系统自带 WebView（所有安卓机都有，不依赖 Chrome/Google）。
const config: CapacitorConfig = {
  appId: 'com.bubu12money.app',
  appName: '记账本',
  webDir: 'dist',
  android: {
    // 允许 WebView 使用本地存储（IndexedDB 依赖此项）
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  server: {
    // 关键：不设置 url，表示使用 APK 内置资源，完全离线可用
    androidScheme: 'https'
  }
}

export default config
