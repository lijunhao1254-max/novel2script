import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // 将所有 JS/CSS 内联到单个 HTML 文件中
    viteSingleFile(),
    // 在构建完成后后处理 HTML：
    // 1. 移除 crossorigin / type="module"（file:// 兼容）
    // 2. 将 <script> 从 <head> 移到 </body> 前（DOM 就绪后再 mount）
    {
      name: 'postprocess-for-file-protocol',
      closeBundle() {
        const distPath = resolve(__dirname, 'dist/index.html')
        let html = readFileSync(distPath, 'utf-8')

        // 移除 crossorigin 和 type="module"
        html = html.replace(/\s+crossorigin(?:="[^"]*")?/g, '')
        html = html.replace(/\s+type="module"/g, '')

        // 将 <script> 从 <head> 移到 </body> 前
        const headClose = html.indexOf('</head>')
        if (headClose !== -1) {
          const scriptMatch = html.substring(0, headClose).match(/<script>[\s\S]*?<\/script>/)
          if (scriptMatch) {
            html = html.replace(scriptMatch[0], '')
            html = html.replace('</body>', scriptMatch[0] + '\n</body>')
          }
        }

        writeFileSync(distPath, html, 'utf-8')
        console.log('[postprocess] HTML optimized for file:// protocol')
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
})
