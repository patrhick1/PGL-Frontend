import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  // Parse allowed hosts - can be a single URL or comma-separated list
  const allowedHostsString = env.FRONTEND_LIVE_URL || 'podcastguestlaunch.onrender.com,www.podcastguestlaunch.com'
  const allowedHosts = allowedHostsString
    .split(',')
    .map(url => url.trim())
    .map(url => url.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean)
  
  return {
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
    preview: {
      allowedHosts: allowedHosts,
    },
  }
})