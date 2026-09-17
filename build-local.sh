#!/usr/bin/env bash
# 本地构建 APK —— 所有工具链均来自项目内的 .toolchain/，不依赖系统环境。
#
# 用法：
#   ./build-local.sh            # 构建 debug 包（免签名，可立即安装测试）
#   ./build-local.sh release    # 构建 release 包（需要 KEYS/ 下的签名密钥）
#
# 前置：项目内需有 .toolchain/（JDK 17 + Android SDK），未提交到 git。
#      见 README 的「本地构建」一节的获取方式。
#
# 本脚本不修改任何系统级环境变量，不影响机器上的其他项目。

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Git Bash 会给路径加 /d/ 前缀，Node/Gradle 认不出，统一转成 Windows 原生路径
WIN_DIR="$(cygpath -w "$SCRIPT_DIR" 2>/dev/null || echo "$SCRIPT_DIR")"
TC="$SCRIPT_DIR/.toolchain"

# --- 自动探测项目内 JDK（版本号含 + 号，写死会失效）---
JDK_DIR="$(find "$TC" -maxdepth 1 -type d -name 'jdk-*' | head -1)"
if [ -z "$JDK_DIR" ]; then
  echo "❌ 找不到项目内 JDK，请确认 .toolchain/ 已就绪（见 README）"
  exit 1
fi

export JAVA_HOME="$(cygpath -w "$JDK_DIR" 2>/dev/null || echo "$JDK_DIR")"
export ANDROID_HOME="$WIN_DIR\\.toolchain\\android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$TC/android-sdk/platform-tools:$PATH"

# Gradle 缓存也限制在项目内（默认会写 ~/.gradle，污染系统用户目录）
export GRADLE_USER_HOME="$WIN_DIR\\.toolchain\\gradle-home"
mkdir -p "$TC/gradle-home"

# 阿里云镜像初始化脚本（国内直连 google()/mavenCentral() 极慢）
GRADLE_INIT="$WIN_DIR\\.toolchain\\init-mirror.gradle"

# 自动探测 Node（优先用系统 PATH 里的，找不到再提示）
NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ]; then
  echo "❌ 找不到 node，请确保 node 在 PATH 中"
  exit 1
fi

echo "=== 工具链 ==="
echo "项目目录:   $WIN_DIR"
echo "Node:      $NODE_BIN ($(node -v 2>/dev/null))"
echo "JDK:       $("$JAVA_HOME/bin/java.exe" -version 2>&1 | head -1)"
echo "SDK:       $ANDROID_HOME"
echo "Gradle 缓存: $GRADLE_USER_HOME"
echo ""

BUILD_TYPE="${1:-debug}"
cd "$SCRIPT_DIR"

# --- 1. 构建前端 ---
echo "=== 1/3 构建前端 ==="
node "$WIN_DIR\\node_modules\\vite\\bin\\vite.js" build

# --- 2. 同步到 Android 工程 ---
echo ""
echo "=== 2/3 同步到 Android 工程 ==="
node "$WIN_DIR\\node_modules\\@capacitor\\cli\\bin\\capacitor" sync android

# --- 3. 构建 APK ---
echo ""
echo "=== 3/3 构建 $BUILD_TYPE APK ==="
cd "$SCRIPT_DIR/android"
chmod +x gradlew 2>/dev/null || true

if [ "$BUILD_TYPE" = "release" ]; then
  KEYSTORE="$SCRIPT_DIR/KEYS/release.keystore"
  if [ ! -f "$KEYSTORE" ]; then
    echo "❌ 找不到签名密钥：$KEYSTORE"
    echo "   请先运行 ./generate-keystore.sh 生成密钥"
    exit 1
  fi
  export KEYSTORE_PATH="$(cygpath -w "$KEYSTORE" 2>/dev/null || echo "$KEYSTORE")"
  if [ -f "$SCRIPT_DIR/KEYS/keystore.properties" ]; then
    set -a
    source "$SCRIPT_DIR/KEYS/keystore.properties"
    set +a
  fi
  ./gradlew assembleRelease --init-script "$GRADLE_INIT"
  echo ""
  echo "✅ Release APK: android/app/build/outputs/apk/release/"
else
  ./gradlew assembleDebug --init-script "$GRADLE_INIT"
  echo ""
  echo "✅ Debug APK: android/app/build/outputs/apk/debug/"
fi

ls -lh "$SCRIPT_DIR/android/app/build/outputs/apk/$BUILD_TYPE/"*.apk 2>/dev/null || true
