import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    rolldownOptions: {
      input: {
        panel: resolve(import.meta.dirname, 'src/devtools/panel/index.html'),
      },
    },
  },
})
