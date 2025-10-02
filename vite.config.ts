// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/admin/assets/",
  build: {
    outDir: "public/admin/assets",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/main.tsx",                // ← これを明示
      output: {
        entryFileNames: "main.js",          // ← index.html の src と一致させる
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "[name][extname]"
      }
    }
  }
});
