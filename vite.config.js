import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  publicDir: false,                // public コピーは使わない
  build: {
    outDir: 'public/admin/assets', // 直接 /admin/assets/ に出す
    emptyOutDir: true,             // 毎回クリア
    rollupOptions: {
      // 入口は TSX（HTMLは触らない）
      input: path.resolve(process.cwd(), 'src/main.tsx'),
      output: {
        inlineDynamicImports: true,     // チャンク分割なし＝1本に束ねる
        entryFileNames: 'main.js',      // 必ず main.js を作る
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})
