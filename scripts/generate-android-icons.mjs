/**
 * 从 public/main-icon.png 生成 Android 应用图标（mipmap 各密度）。
 *
 * 用法：npm run android:icons
 *
 * Android 图标两套：
 *   1. 传统图标 ic_launcher.png / ic_launcher_round.png —— 用于 API 25 及以下
 *   2. 自适应图标 ic_launcher_foreground.png + background —— 用于 API 26+
 *      自适应图标分两层：前景（内容，需留安全区）和背景（纯色/图案）。
 *      前景图形实际只占中间 66%，四周 33% 会被系统按形状裁掉或遮罩，
 *      所以这里把图缩小到 72% 居中放置，避免边缘被裁。
 *
 * 密度对照（1dp = 1px @ mdpi）：
 *   mdpi 48 / hdpi 72 / xhdpi 96 / xxhdpi 144 / xxxhdpi 192
 *   自适应前景：mdpi 108 / hdpi 162 / xhdpi 216 / xxhdpi 324 / xxxhdpi 432
 */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const source = join(root, 'public', 'main-icon.png')
const resDir = join(root, 'android', 'app', 'src', 'main', 'res')

const sourceBuf = await readFile(source)
const meta = await sharp(sourceBuf).metadata()
console.log(`源图 ${meta.width}x${meta.height}`)

// 密度 → 图标尺寸
const densities = {
  mdpi: { icon: 48, fg: 108 },
  hdpi: { icon: 72, fg: 162 },
  xhdpi: { icon: 96, fg: 216 },
  xxhdpi: { icon: 144, fg: 324 },
  xxxhdpi: { icon: 192, fg: 432 }
}

/** 圆角 mask */
function maskFor(size, ratio = 0.225) {
  const r = Math.round(size * ratio)
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  )
}

/** 普通圆角图标（带透明） */
async function roundIcon(size) {
  const base = await sharp(sourceBuf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
  return sharp(base)
    .composite([{ input: maskFor(size), blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/** 全圆图标（ic_launcher_round） */
async function circleIcon(size) {
  const base = await sharp(sourceBuf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
  const circle = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  )
  return sharp(base)
    .composite([{ input: circle, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/**
 * 自适应图标前景层：内容缩到 ~72% 居中，四周留透明安全区。
 * 图形本身按满幅方形绘制（系统会自己裁形状），但视觉内容缩小避免被切边。
 */
async function adaptiveForeground(size) {
  const content = Math.round(size * 0.72)
  const offset = Math.round((size - content) / 2)
  const scaled = await sharp(sourceBuf)
    .resize(content, content, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  return canvas
    .composite([{ input: scaled, top: offset, left: offset }])
    .png()
    .toBuffer()
}

let count = 0
for (const [density, sizes] of Object.entries(densities)) {
  const dir = join(resDir, `mipmap-${density}`)

  await writeFile(join(dir, 'ic_launcher.png'), await roundIcon(sizes.icon))
  await writeFile(join(dir, 'ic_launcher_round.png'), await circleIcon(sizes.icon))
  await writeFile(join(dir, 'ic_launcher_foreground.png'), await adaptiveForeground(sizes.fg))
  count += 3
  console.log(`  ✓ mipmap-${density}  ${sizes.icon}px 图标 / ${sizes.fg}px 前景`)
}

// 自适应图标背景色（与源图标主色调一致）
await writeFile(
  join(resDir, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
`
)
console.log('  ✓ values/ic_launcher_background.xml')
count += 1

console.log(`\n共生成 ${count} 个图标文件`)
