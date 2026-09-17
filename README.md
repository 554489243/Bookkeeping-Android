# 记账本 Android 版（Bookkeeping-Android）

把记账本打包成 **独立 APK**，安装后即为真正的安卓应用。

## 为什么要这个版本

原来的网页版（PWA）在部分手机上装不成 App：

| 手机 | 网页版表现 |
|------|-----------|
| 小米 / Chrome | 能装成 App |
| **荣耀 / 华为** | **只能创建快捷方式，返回就跳浏览器，等于不能用** |

根本原因是国产手机缺少 Google 服务，浏览器无法生成本地 App 包。
**这个 APK 版本完全不依赖任何浏览器或 Google 服务，所有安卓手机一视同仁。**

## 核心设计

| 项 | 方案 | 说明 |
|----|------|------|
| 打包方式 | Capacitor + 内置 WebView | 整个前端打进 APK，**纯离线** |
| 内核依赖 | 系统自带 WebView | 每台安卓机都有，**不用 Chrome** |
| 数据存储 | 设备本地 IndexedDB | 与网页版隔离，用导出/导入迁移 |
| 最低版本 | Android 5.1（API 22） | 覆盖市面几乎所有机型 |
| 包名 | `com.bubu12money.app` | 安装后不可更改 |

## 与网页版的关系

**两个版本完全独立，互不影响。**

```
D:\myData\demo\
├── Bookkeeping-v1.0\Bookkeeping\   ← 网页版，部署到 GitHub Pages
└── Bookkeeping-Android\            ← 本目录，APK 版
```

- 网页版线上地址：https://554489243.github.io/Bubu12Money/
- **本目录的任何改动都不会影响上面的线上站点**（独立仓库、独立构建）

## 数据怎么迁移

两个版本的数据是隔离的，用导出/导入搬运：

```
网页版 → 设置 → 导出 JSON
APK 版 → 设置 → 导入 JSON   ← 数据就过来了
```

反向也一样。建议用户在切换版本前先导出一份备份。

## 构建方式

### 云端构建（推荐，本地无需装任何工具）

打 tag 即自动出包：

```bash
git tag v1.3.1
git push origin v1.3.1
```

APK 会自动附到 GitHub Release 页面，直接下载即可分发。

也可以在 GitHub 仓库的 **Actions** 页手动触发（支持 debug / release 两种）。

### 本地构建（可选）

需要项目内含工具链（`.toolchain/`，约 700MB，不提交到 git）：

```bash
./build-local.sh          # debug 包，免签名
./build-local.sh release  # release 包，需先跑 generate-keystore.sh
```

## 签名密钥（重要）

首次发布前必须生成密钥：

```bash
./generate-keystore.sh
```

**密钥决定 App 的身份，务必妥善保管：**

- 同一 App 的所有版本必须用同一把密钥签名，否则用户无法覆盖安装
- **密钥丢失 → 已安装的用户永远收不到更新**，只能换包名重发（老用户全部流失）
- 生成后**立刻把 `KEYS/` 目录整个备份**到网盘或 U 盘

同时需要把这些值填到 GitHub 仓库的 Secrets 里（Settings → Secrets and variables → Actions）：

| Secret 名 | 值 |
|-----------|-----|
| `KEYSTORE_BASE64` | `KEYS/keystore.base64.txt` 的内容 |
| `KEYSTORE_PASSWORD` | 密钥库密码 |
| `KEY_ALIAS` | `bookkeeping` |
| `KEY_PASSWORD` | 密钥密码 |

## 更新应用

改完代码后：

```bash
# 1. 提升版本号（android/app/build.gradle 里的 versionCode 必须 +1）
# 2. 打 tag 推送
git tag v1.3.2
git push origin v1.3.2
```

**用户需要手动下载新 APK 覆盖安装** —— 这是离线打包的固有代价。
（走应用市场分发的话可以自动更新，但需要开发者资质与备案）

## 目录说明

```
├── src/                    # 源码（从网页版复制而来）
├── public/                 # 静态资源（含 main-icon.png 图标源图）
├── android/                # Capacitor 生成的 Android 原生工程
│   └── app/src/main/res/   # 应用图标（各密度 mipmap）
├── scripts/
│   ├── generate-icons.mjs          # 生成网页图标
│   └── generate-android-icons.mjs  # 生成 Android 应用图标
├── .github/workflows/
│   └── build-apk.yml       # 云端构建流水线
├── .toolchain/             # 本地工具链（JDK + SDK，不提交）
├── KEYS/                   # 签名密钥（绝不提交！）
├── build-local.sh          # 本地构建脚本
└── generate-keystore.sh    # 密钥生成脚本
```

## 常用命令

```bash
npm run build          # 构建前端
npm run sync           # 构建 + 同步到 Android 工程
npm run apk:debug      # 本地出 debug 包
npm run icons          # 重新生成网页图标
node scripts/generate-android-icons.mjs   # 重新生成 Android 图标
```
