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
    // ⚠️ captureInput 必须保持 false（默认值），不要开启！
    // 开启后 Capacitor 会用自定义 InputConnection 接管输入事件，导致
    // 中文输入法的组合输入（composition）不回传 input/compositionupdate 事件，
    // 表现为：字能显示在输入框里，但 Vue 的 v-model 收不到值 →
    //   1) 点图标等触发重渲染时，输入框内容被空值覆盖（"选了图标名字就没了"）
    //   2) 点保存时校验失败（"明明输入了却提示请输入名称"）
    captureInput: false,
    // 调试时改为 true，可用 Chrome DevTools 远程调试 APK 内的 WebView
    webContentsDebuggingEnabled: false
  },
  server: {
    // 关键：不设置 url，表示使用 APK 内置资源，完全离线可用
    androidScheme: 'https'
  }
}

export default config
