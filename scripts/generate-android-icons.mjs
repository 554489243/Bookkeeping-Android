/**
 * 从 public/main-icon.png 生成 Android 应用图标。
 *
 * 用法：npm run android:icons
 *
 * 源图 154x151，左侧是小熊（x 0~118），右侧有竖排"记下来"三个字（x 125~153）。
 * 图标只取小熊、去掉文字：手机上图标实际只有 48~96px，三个汉字在这个尺寸下
 * 会糊成一团，且贴在最右侧会被自适应图标的遮罩裁掉一半。
 *
 * 做法就三步：
 *   1. 裁掉右侧文字，只留小熊
 *   2. 补成正方形（小熊是 119x135 竖长比例，不补会被拉伸变形）
 *   3. 缩到安全区大小，四周填满一致的底色
 *
 * 安全区取 0.72：自适应图标画布 108dp，系统只保证中间 72dp（66.7%）可见，
 * 外围按厂商遮罩裁切（MIUI/EMUI 偏圆形，更激进）。0.72 是避开遮罩与
 * 图标不显得太小的折中值。
 */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const source = join(root, 'public', 'main-icon.png')
const resDir = join(root, 'android', 'app', 'src', 'main', 'res')

/** 小熊在源图中的边界（逐像素扫描得出；换源图后需重新测量） */
const CROP = { left: 0, top: 8, width: 119, height: 135 }

/** 内容占画布的比例（自适应图标的安全区） */
const SAFE_RATIO = 0.72

/** 统一底色（暖白，取自小熊的浅色区域） */
const BG = { r: 255, g: 248, b: 240 }

const sourceBuf = await readFile(source)
const meta = await sharp(sourceBuf).metadata()
console.log(`源图 ${meta.width}x${meta.height} → 裁出小熊 ${CROP.width}x${CROP.height}`)

/** 裁出小熊并补成正方形（透明底） */
async function bearSquare() {
  const bear = await sharp(sourceBuf).extract(CROP).png().toBuffer()
  const side = Math.max(CROP.width, CROP.height)
  return sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{
      input: bear,
      top: Math.round((side - CROP.height) / 2),
      left: Math.round((side - CROP.width) / 2)
    }])
    .png()
    .toBuffer()
}

const bearBuf = await bearSquare()

/** 把正方形小熊缩到画布的 SAFE_RATIO，四周填满统一底色 */
async function iconWithBg(size, ratio = SAFE_RATIO) {
  const content = Math.round(size * ratio)
  const scaled = await sharp(bearBuf).resize(content, content).png().toBuffer()
  const offset = Math.round((size - content) / 2)
  return sharp({
    create: { width: size, height: size, channels: 4, background: { ...BG, alpha: 1 } }
  })
    .composite([{ input: scaled, top: offset, left: offset }])
    .png()
    .toBuffer()
}

/** 圆角图标（用于 API 25 及以下的传统图标） */
async function roundIcon(size) {
  const base = await iconWithBg(size)
  const r = Math.round(size * 0.225)
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  )
  return sharp(base).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

/** 全圆图标（ic_launcher_round） */
async function circleIcon(size) {
  const base = await iconWithBg(size)
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  )
  return sharp(base).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

/**
 * 自适应图标前景层：只放小熊，透明底（背景由系统按 ic_launcher_background 填）。
 * 这里不填底色，因为系统有自己的背景层；填了会和背景色叠出双层色块。
 */
async function adaptiveForeground(size) {
  const content = Math.round(size * SAFE_RATIO)
  const scaled = await sharp(bearBuf).resize(content, content).png().toBuffer()
  const offset = Math.round((size - content) / 2)
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: scaled, top: offset, left: offset }])
    .png()
    .toBuffer()
}

// 密度 → 尺寸（1dp = 1px @ mdpi）
const densities = {
  mdpi: { icon: 48, fg: 108 },
  hdpi: { icon: 72, fg: 162 },
  xhdpi: { icon: 96, fg: 216 },
  xxhdpi: { icon: 144, fg: 324 },
  xxxhdpi: { icon: 192, fg: 432 }
}

let count = 0
for (const [density, sizes] of Object.entries(densities)) {
  const dir = join(resDir, `mipmap-${density}`)
  await writeFile(join(dir, 'ic_launcher.png'), await roundIcon(sizes.icon))
  await writeFile(join(dir, 'ic_launcher_round.png'), await circleIcon(sizes.icon))
  await writeFile(join(dir, 'ic_launcher_foreground.png'), await adaptiveForeground(sizes.fg))
  count += 3
  console.log(`  ✓ mipmap-${density}  ${sizes.icon}px / 前景 ${sizes.fg}px`)
}

// 自适应图标的背景色
const hex = '#' + [BG.r, BG.g, BG.b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
await writeFile(
  join(resDir, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${hex}</color>
</resources>
`
)
count += 1
console.log(`  ✓ ic_launcher_background.xml (${hex})`)
console.log(`\n共生成 ${count} 个文件`)
