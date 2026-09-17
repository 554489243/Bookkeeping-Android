# 开发架构

## 技术栈

| 层面 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | Vue3 | ^3.4 | 组合式 API，用户擅长 |
| 构建 | Vite | ^5 | 极速 HMR，PWA 插件生态完善 |
| UI 组件 | Vant4 | ^4 | 移动端优先，含 SwipeCell、DatePicker、Toast |
| 状态管理 | Pinia | ^2 | Vue3 官方推荐，轻量 |
| 本地数据库 | Dexie.js | ^4 | IndexedDB 封装，API 友好 |
| 图表 | ECharts | ^5 | 功能强大，支持柱状图、饼图 |
| PWA | vite-plugin-pwa | ^0.20 | 离线缓存，manifest 自动生成 |
| 路由 | Vue Router | ^4 | 官方路由 |

## 数据流图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vue Components                            │
│                                                                   │
│   List.vue    Home.vue    Edit.vue    Profile.vue    Books.vue   │
│   (明细/首页)  (统计)      (记账)      (我的)         (账本管理)  │
│      +           +           +           +              +        │
│   BookSelector  BookSelector BookSelector BookSelector           │
│      +           +                                               │
│   TabBar        Charts(ECharts)                                  │
└──────────┬───────────┬──────────┬──────────┬──────────┬──────────┘
           │           │          │          │          │
           │ dispatch  │ dispatch │ dispatch │ dispatch │ dispatch
           │ actions   │ actions │ actions │ actions  │ actions
           ▼           ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Pinia Stores                              │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  recordStore      │  │  categoryStore   │  │  bookStore    │  │
│  │  - records[]      │  │  - categories[]  │  │  - books[]    │  │
│  │  - historyRecords │  │  - load()        │  │  - currentId  │  │
│  │  - add()          │  │  - add()         │  │  - add()      │  │
│  │  - update()       │  │  - update()      │  │  - update()   │  │
│  │  - delete()       │  │  - delete()      │  │  - delete()   │  │
│  │  - archive()      │  │  - builtin?      │  │  - move()     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬────────┘  │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            │                     │                    │
            │ CRUD operations     │ read               │ CRUD
            ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Dexie.js                                 │
│                                                                   │
│  db.version(6).stores({                                          │
│    records: '++id, type, categoryId, bookId, date, createdAt',   │
│    records_history: '++id, type, categoryId, bookId, date,...',  │
│    categories: '++id, type, sort, parentId',                    │
│    books: '++id, sort, isDefault'                                │
│  })                                                              │
│                                                                   │
│  db.records.add() / .where('date').between() / .orderBy()       │
│  db.records_history.bulkAdd() / .bulkDelete()                   │
│  db.categories.toArray()                                         │
│  db.books.orderBy('sort').toArray()                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ IndexedDB API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        IndexedDB                                 │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  records          │  │  records_history │  │  categories  │  │
│  │  (近1年实时数据)   │  │  (1年前归档数据) │  │  (分类定义)  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                   │
│  ┌──────────────────┐                                            │
│  │  books            │                                            │
│  │  (账本定义)       │                                            │
│  └──────────────────┘                                            │
│                                                                   │
│  Browser-native persistent storage (no server, no network)       │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流说明

1. **用户操作**：在 Vue 组件中触发（如点击保存按钮）
2. **Pinia Action**：组件调用 Store 的 action（如 `recordStore.addRecord()`）
3. **Dexie 操作**：Action 内部调用 Dexie API（如 `db.records.add()`）
4. **IndexedDB 持久化**：数据写入浏览器本地存储
5. **响应式更新**：Dexie 操作完成后，Pinia state 更新，组件自动重新渲染

## 项目目录结构

```
bookkeeping/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions 自动部署
├── public/
│   ├── icon.svg                 # 图标 SVG 源文件
│   ├── icon-192.png             # PWA 图标 192px
│   ├── icon-512.png             # PWA 图标 512px
│   └── bubu.jpg                 # 账本选择器装饰图片
├── src/
│   ├── api/
│   │   ├── db.ts                # Dexie 数据库定义（v6）
│   │   ├── records.ts           # 账单 CRUD + 归档 API
│   │   ├── categories.ts        # 分类 CRUD + 内置数据
│   │   └── books.ts             # 账本 CRUD
│   ├── components/
│   │   ├── BookSelector.vue     # 账本选择器（下拉）
│   │   └── TabBar.vue           # 底部导航栏 + FAB
│   ├── views/
│   │   ├── List.vue             # 明细页（首页 /）
│   │   ├── Home.vue             # 统计页（/stats）
│   │   ├── Edit.vue             # 记账页（/edit, /edit/:id）
│   │   ├── Profile.vue          # 我的页（/profile）
│   │   ├── Books.vue            # 账本管理（/books）
│   │   ├── Categories.vue       # 分类管理（/categories）
│   │   └── Stats.vue            # 已合并到 Home.vue
│   ├── stores/
│   │   ├── recordStore.ts       # 账单状态 + 归档
│   │   ├── categoryStore.ts     # 分类状态
│   │   ├── bookStore.ts         # 账本状态
│   │   └── uiStore.ts           # UI 状态（已精简）
│   ├── utils/
│   │   ├── format.ts            # 金额格式化（分→元）
│   │   ├── date.ts              # 日期工具（周/月/年范围）
│   │   └── colors.ts            # 分类颜色系统
│   ├── router/
│   │   └── index.ts             # 路由配置（Hash 模式）
│   ├── styles/
│   │   └── global.css           # 全局样式 + CSS 变量
│   ├── App.vue
│   └── main.ts
├── docs/                        # 项目文档
│   ├── 01-requirements.md
│   ├── 02-architecture.md
│   ├── 03-database-design.md
│   ├── 04-prototypes.html
│   ├── 05-development-log.md
│   ├── 06-multi-book-requirements.md
│   ├── 07-salary-slip-requirements.md
│   ├── 08-archive-requirements.md
│   └── README.md
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## PWA 配置

```ts
// vite.config.ts
export default defineConfig({
  base: '/Bubu12Money/',  // GitHub Pages 子路径
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '记账本',
        short_name: '记账',
        theme_color: '#1989fa',
        background_color: '#f5f6f8',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}']
      }
    })
  ]
})
```

## 部署方案

- **平台**：GitHub Pages
- **自动部署**：GitHub Actions（push → build → deploy）
- **访问地址**：https://554489243.github.io/Bubu12Money/
- **自定义域名**：可选，留空即用默认地址

## 路由配置

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | List.vue | 明细（首页） |
| `/stats` | Home.vue | 统计图表 |
| `/edit` | Edit.vue | 新建记账 |
| `/edit/:id` | Edit.vue | 编辑已有记录 |
| `/profile` | Profile.vue | 我的 |
| `/books` | Books.vue | 账本管理 |
| `/categories` | Categories.vue | 分类管理 |

## 依赖清单

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "vant": "^4.9.0",
    "dexie": "^4.0.0",
    "echarts": "^5.5.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vite-plugin-pwa": "^0.20.0",
    "typescript": "^5.4.0"
  }
}
```

## 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 路由模式 | createWebHashHistory | PWA 兼容性最佳 |
| 金额存储 | 分（整数） | 避免浮点精度问题 |
| 分类层级 | 两级（父+子） | 兼顾简洁和分类细粒度 |
| 内置标记 | builtin 字段 | 灵活区分内置/自定义 |
| 归档策略 | 双表（实时+历史） | 保持实时表轻量 |
| 图表渲染 | Canvas 模式 | 避免浏览器扩展冲突 |
| 键盘安全 | 简单数学解析器 | 不用 Function()/eval |
| 样式主题 | 蓝白简约 | 用户偏好，拒绝暗黑奢华 |
