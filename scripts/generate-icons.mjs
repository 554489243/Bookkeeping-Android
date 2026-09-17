/**
 * 从 public/main-icon.png 生成全平台 PWA 桌面图标。
 *
 * 用法：npm run icons
 *
 * 注意：源图仅 154x151，放大到 512 会有像素感（卡通图容错率较高）。
 * 若日后拿到更大尺寸的原图，直接替换 main-icon.png 再跑一次本脚本即可。
 *
 * 设计要点：
 * - 源图接近正方形，居中裁成正方形再缩放，不拉伸。
 * - 圆角版本：SVG 圆角 mask 叠加，半径 22.5%。
 * - maskable 例外：满幅直角 + 不透明，否则 Android 裁形状时会露白边。
 * - apple-touch（152/167/180）：圆角 + 不透明。iOS 对透明通道处理很差，
 *   透明区域会被渲染成黑色；iOS 还会自己再加一层圆角，故这组圆角取小（18%）。
 *
 * 本脚本只产出「桌面图标」，不影响 index.html 里的 favicon 引用。
 */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const source = join(publicDir, 'main-icon.png')
const sourceBuf = await readFile(source)

const meta = await sharp(sourceBuf).metadata()
const side = Math.min(meta.width, meta.height)
console.log(`源图 ${meta.width}x${meta.height}（比例 ${(meta.width / meta.height).toFixed(3)}）`)
console.log(`→ 居中裁正方形 ${side}x${side}`)
if (side < 512) {
  console.log(`⚠ 源图边长不足 512，放大到 512 会有像素感。建议后续换更大尺寸原图。`)
}

/** 生成圆角 SVG mask */
function maskFor(size, radiusRatio) {
  const r = Math.round(size * radiusRatio)
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  )
}

/** 圆角版（带透明通道） */
async function roundedPng(size, radiusRatio = 0.225) {
  const base = await sharp(sourceBuf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
  return sharp(base)
    .composite([{ input: maskFor(size, radiusRatio), blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/** 圆角 + 不透明版（给 iOS apple-touch） */
async function roundedOpaquePng(size, radiusRatio = 0.18) {
  const base = await sharp(sourceBuf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()
  return sharp(base)
    .composite([{ input: maskFor(size, radiusRatio), blend: 'dest-in' }])
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()
}

/** 满幅直角 + 不透明（给 Android maskable） */
async function flatPng(size) {
  return sharp(sourceBuf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()
}

async function write(name, buf) {
  await writeFile(join(publicDir, name), buf)
  console.log(`  ✓ ${name}  ${buf.length} B`)
}

// 圆角版：Android 主屏 / 高分屏
for (const size of [144, 192, 256, 384, 512]) {
  await write(`icon-${size}.png`, await roundedPng(size))
}

// apple-touch：圆角 + 不透明（iOS 主屏）
for (const size of [152, 167, 180]) {
  await write(`icon-${size}.png`, await roundedOpaquePng(size))
}

// maskable：满幅直角 + 不透明（Android 自适应图标）
await write('icon-maskable-512.png', await flatPng(512))

// 32x32 保留供 favicon 使用（内容对齐，避免与桌面图标观感不一致）
await write('icon-32.png', await roundedPng(32))

console.log('\n桌面图标已生成（源：public/main-icon.png）')
