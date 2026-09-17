# 数据归档功能需求

## 概述

将 1 年前的记录从实时表移到历史表，保持实时表轻量，提升查询性能。

## 核心设计

### 归档策略

| 项目 | 值 |
|------|-----|
| 归档 cutoff | 当前日期 - 1 年 |
| 触发频率 | 每周检查一次 + 手动触发 |
| 归档操作 | 批量复制到历史表 → 从实时表删除 |
| 历史数据 | 只读查看，不可编辑/删除 |

### 归档触发方式

1. **自动触发**：每次启动应用时，`main.ts` 调用 `maintainArchive()`，检查是否有超过 1 年的记录需要归档
2. **手动触发**：Profile 页面「数据归档」入口，显示可归档条数，确认后执行

### 数据流

```
启动/手动触发
    ↓
countArchivable(cutoff) → 查实时表 date < cutoff 的数量
    ↓
如果 count > 0 → archiveOldRecords(cutoff)
    ↓
bulkAdd 到 records_history → bulkDelete 从 records
    ↓
完成，返回归档数量
```

### 查询路由

| 查询范围 | 数据源 |
|----------|--------|
| 完全在 1 年内 | 只查 records |
| 完全在 1 年前 | 只查 records_history |
| 跨年 | 查两表后合并 |

### 用户体验

- 明细页选历史月份 → 自动从历史表加载，显示"📦 历史数据（只读）"提示
- 历史记录不可点击编辑、不可删除
- 统计页跨年查询 → 自动合并两表数据

## 技术实现

### 数据库

- v6 新增 `records_history` 表，索引与 `records` 一致
- `archiveOldRecords(cutoffDate)` 方法
- `countArchivable(beforeDate)` 方法
- `getHistoryRecordsByMonth(year, month)` 方法

### 查询函数

- `getCategoryStatsByDateRange()` → 自动合并两表
- `getTrendByDateRange()` → 自动合并两表

### UI

- Profile 页：数据归档菜单项 + 确认弹窗
- List.vue：历史月份检测 + 只读显示 + 删除按钮隐藏

## 状态

✅ 已完成并上线
