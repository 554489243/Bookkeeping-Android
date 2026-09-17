#!/usr/bin/env bash
# 生成 APK 签名密钥（只需运行一次，密钥必须妥善保管）
#
# 重要：密钥决定应用的"身份"。
#   - 同一个 App 的所有版本必须用同一把密钥签名，否则用户无法覆盖安装
#   - 密钥或密码丢失 → 已安装的用户永远无法收到更新，只能换包名重发
#   - 所以：生成后请立刻把 KEYS/ 目录整个备份到网盘/U盘
#
# 生成后需要手动做两件事：
#   1. 把 release.keystore 转成 base64，存到 GitHub Secrets 的 KEYSTORE_BASE64
#   2. 把密码分别存到 KEYSTORE_PASSWORD / KEY_ALIAS / KEY_PASSWORD

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TC="$SCRIPT_DIR/.toolchain"
export JAVA_HOME="$TC/jdk-17.0.20.1+1"

KEYS_DIR="$SCRIPT_DIR/KEYS"
mkdir -p "$KEYS_DIR"

KEYSTORE="$KEYS_DIR/release.keystore"
STOREPASS="${1:-bubu12money2026}"
ALIAS="bookkeeping"
KEYPASS="$STOREPASS"

if [ -f "$KEYSTORE" ]; then
  echo "⚠️  密钥已存在：$KEYSTORE"
  echo "   如需重新生成，请先手动删除该文件（注意：会让老用户无法更新！）"
  exit 1
fi

echo "=== 生成签名密钥 ==="
"$JAVA_HOME/bin/keytool.exe" -genkeypair \
  -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STOREPASS" \
  -keypass "$KEYPASS" \
  -dname "CN=Bookkeeping, OU=Personal, O=Bubu12Money, L=Unknown, ST=Unknown, C=CN" \
  2>&1 | tail -5

# 记录密码（供本地构建脚本读取；此文件必须备份且绝不外传）
cat > "$KEYS_DIR/keystore.properties" <<EOF
KEYSTORE_PASSWORD=$STOREPASS
KEY_ALIAS=$ALIAS
KEY_PASSWORD=$KEYPASS
EOF

echo ""
echo "✅ 密钥已生成：$KEYSTORE"
echo "✅ 密码已记录：$KEYS_DIR/keystore.properties"
echo ""
echo "=== 生成 GitHub Secrets 用的 base64 ==="
base64 -w 0 "$KEYSTORE" > "$KEYS_DIR/keystore.base64.txt"
echo "已输出到：$KEYS_DIR/keystore.base64.txt"
echo ""
echo "⚠️  下一步（必做）："
echo "   1. 把 KEYS/ 整个目录备份到你自己的网盘或 U 盘"
echo "   2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加："
echo "      KEYSTORE_BASE64    = keystore.base64.txt 的内容"
echo "      KEYSTORE_PASSWORD  = $STOREPASS"
echo "      KEY_ALIAS          = $ALIAS"
echo "      KEY_PASSWORD       = $KEYPASS"
