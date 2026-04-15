import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(__dirname, '../public/icons')
fs.mkdirSync(iconsDir, { recursive: true })

const svgPath = path.join(__dirname, '../public/favicon.svg')
const svg = fs.readFileSync(svgPath)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  const out = path.join(iconsDir, `icon-${size}.png`)
  await sharp(svg).resize(size, size).png().toFile(out)
  // eslint-disable-next-line no-console
  console.log('wrote', out)
}
