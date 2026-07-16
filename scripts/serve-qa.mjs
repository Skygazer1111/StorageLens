import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'qa')
const PORT = 4173

createServer(async (req, res) => {
  try {
    const file = req.url === '/' || req.url.startsWith('/?') ? 'test-page.html' : req.url.slice(1)
    const body = await readFile(join(root, file))
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}).listen(PORT, () => {
  console.log(`StorageLens QA page running at http://localhost:${PORT}`)
  console.log('Open it in Chrome, click "Seed all storage", then open StorageLens.')
})
