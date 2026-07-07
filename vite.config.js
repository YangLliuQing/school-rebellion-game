import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    // WebSocket 服务地址，部署时替换为 CloudBase 云函数地址
    'import.meta.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || 'wss://your-env-id.run.tcloudbase.com')
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
