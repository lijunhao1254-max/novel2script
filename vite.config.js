import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    modulePreload: false,
    // 代码分割：Element Plus 单独拆包，减小主文件体积
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
})
