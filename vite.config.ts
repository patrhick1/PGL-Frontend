import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'client'),
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    open: true,
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    sourcemap: true,
    emptyOutDir: true,
  },
})