import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        admin: path.resolve(process.cwd(), 'public/admin/index.html'),
      },
      output: {
        // ★ 出力は 1 本だけ
        inlineDynamicImports: true,
        entryFileNames: 'admin/assets/main.js',
        // チャンクや資産を作らない（後方互換で残してもOK）
        chunkFileNames: 'admin/assets/main.js',
        assetFileNames: 'admin/assets/[name]-[hash][extname]',
      },
    },
  },
})
