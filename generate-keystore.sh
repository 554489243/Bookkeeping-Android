#!/usr/bin/env bash
# 生成 APK 签名密钥（只需运行一次，密钥必须妥善保管）
#
# 重要：密钥决定应用的"身份"。
#   - 同一个 App 的所有版本必须用同一把密钥签名，否则用户无法覆盖安装
#   - 密钥或密码丢失 → 已安装的用户永远无法收到更新，只能换包名重发
#   - 所以：生成后请立刻把 KEYS/ 目录整个备份到网盘/U盘
#
# 生成后需要手动做三件事：
#   1. 把 KEYS/ 整个目录备份走（丢了就完蛋）
#   2. 把 release.keystore 转成 base64，存到 GitHub Secrets 的 KEYSTORE_BASE64
#   3. 把密码分别存到 KEYSTORE_PASSWORD / KEY_ALIAS / KEY_PASSWORD
#
# 用法：
#   ./generate-keystore.sh            # 交互式输入口令（推荐，不进 shell 历史）
#   ./generate-keystore.sh <口令>      # 命令行传入（方便，但会进 shell 历史）
#
# ⚠️ 不要在本脚本里写死默认口令 —— 本文件会提交到公开仓库。

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Git Bash 下 $SCRIPT_DIR 是 /d/... 形式，Windows 原生的 keytool.exe 不认这种路径。
# 这里统一转成 D:\... 形式再传给 keytool。
if command -v cygpath >/dev/null 2>&1; then
  WIN_DIR="$(cygpath -w "$SCRIPT_DIR")"
else
  WIN_DIR="$SCRIPT_DIR"
fi

TC="$SCRIPT_DIR/.toolchain"

# 自动探测 keytool：优先 .toolchain 内的便携 JDK，其次 PATH，最后系统 JAVA_HOME
JDK_DIR=""
if [ -d "$TC" ]; then
  JDK_DIR="$(find "$TC" -maxdepth 1 -type d -name 'jdk-*' 2>/dev/null | head -1)"
fi

if [ -n "$JDK_DIR" ] && [ -x "$JDK_DIR/bin/keytool.exe" ]; then
  KEYTOOL="$JDK_DIR/bin/keytool.exe"
elif [ -n "$JDK_DIR" ] && [ -x "$JDK_DIR/bin/keytool" ]; then
  KEYTOOL="$JDK_DIR/bin/keytool"
elif command -v keytool >/dev/null 2>&1; then
  KEYTOOL="$(command -v keytool)"
elif [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/keytool" ]; then
  KEYTOOL="$JAVA_HOME/bin/keytool"
else
  echo "❌ 找不到 keytool。请确认 .toolchain/ 内有 JDK，或把 JDK 的 bin 加入 PATH。" >&2
  exit 1
fi

KEYS_DIR="$SCRIPT_DIR/KEYS"
mkdir -p "$KEYS_DIR"

KEYSTORE="$KEYS_DIR/release.keystore"
ALIAS="bookkeeping"

if [ -f "$KEYSTORE" ]; then
  echo "⚠️  密钥已存在：$KEYSTORE"
  echo "   如需重新生成，请先手动删除该文件（注意：会让老用户无法更新！）"
  exit 1
fi

# ---- 取口令：命令行参数 > 环境变量 > 交互输入 ----
if [ -n "$1" ]; then
  STOREPASS="$1"
elif [ -n "$KEYSTORE_PASSWORD" ]; then
  STOREPASS="$KEYSTORE_PASSWORD"
elif [ -t 0 ]; then
  printf '请输入签名密钥口令（至少 6 位，自己记牢，以后每次发版都要用）\n> ' >&2
  read -rs STOREPASS
  echo "" >&2
else
  echo "❌ 非交互环境必须传入口令：./generate-keystore.sh <口令>" >&2
  exit 1
fi

if [ ${#STOREPASS} -lt 6 ]; then
  echo "❌ 口令太短（至少 6 位）" >&2
  exit 1
fi

KEYPASS="$STOREPASS"

echo "=== 生成签名密钥 ==="
"$KEYTOOL" -genkeypair \
  -v \
  -keystore "$WIN_DIR\\KEYS\\release.keystore" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STOREPASS" \
  -keypass "$KEYPASS" \
  -dname "CN=Bookkeeping, OU=Personal, O=Bubu12Money, L=Unknown, ST=Unknown, C=CN" \
  2>&1 | tail -5

# 记录口令（供本地构建脚本读取；此文件必须备份且绝不外传，已在 .gitignore 中）
cat > "$KEYS_DIR/keystore.properties" <<EOF
KEYSTORE_PASSWORD=$STOREPASS
KEY_ALIAS=$ALIAS
KEY_PASSWORD=$KEYPASS
EOF

echo ""
echo "✅ 密钥已生成：$KEYSTORE"
echo "✅ 口令已记录：$KEYS_DIR/keystore.properties"
echo ""
echo "=== 生成 GitHub Secrets 用的 base64 ==="
base64 -w 0 "$KEYSTORE" > "$KEYS_DIR/keystore.base64.txt"
echo "已输出到：$KEYS_DIR/keystore.base64.txt"
echo ""
echo "⚠️  下一步（必做）："
echo "   1. 把 KEYS/ 整个目录备份到你自己的网盘或 U 盘"
echo "   2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加："
echo "      KEYSTORE_BASE64    = keystore.base64.txt 的内容"
echo "      KEYSTORE_PASSWORD  = （你刚才输入的口令）"
echo "      KEY_ALIAS          = $ALIAS"
echo "      KEY_PASSWORD       = （同 KEYSTORE_PASSWORD）"
