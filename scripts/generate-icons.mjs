import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'icons')
const sourceCandidates = [
  join(outDir, 'icon-source.png'),
  join(root, 'iconstoragelens.png'),
]

mkdirSync(outDir, { recursive: true })

const sourcePath = sourceCandidates.find((path) => existsSync(path))
if (!sourcePath) {
  console.error('No icon source found. Add public/icons/icon-source.png or iconstoragelens.png')
  process.exit(1)
}

if (sourcePath !== join(outDir, 'icon-source.png')) {
  copyFileSync(sourcePath, join(outDir, 'icon-source.png'))
}

const sizes = [16, 32, 48, 128]

for (const size of sizes) {
  const outFile = join(outDir, `icon${size}.png`)
  await sharp(join(outDir, 'icon-source.png'))
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(outFile)
  console.log(`Wrote ${outFile}`)
}

console.log('Extension icons generated in public/icons/')
