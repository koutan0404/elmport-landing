import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      // 入口HTMLを明示
      input: {
        admin: path.resolve(process.cwd(), 'public/admin/index.html'),
      },
      // 出力を固定
      output: {
        entryFileNames: 'admin/assets/main.js',
        chunkFileNames: 'admin/assets/chunks/[name]-[hash].js',
        assetFileNames: 'admin/assets/assets/[name]-[hash][extname]',
      },
    },
  },
})
