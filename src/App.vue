<template>
  <div id="app">
    <NavBar />
    <router-view />
    <FooterBar />
  </div>
</template>

<script setup>
import { onErrorCaptured } from 'vue'
import NavBar from '@/components/NavBar.vue'
import FooterBar from '@/components/FooterBar.vue'

onErrorCaptured((err, instance, info) => {
  console.error('[App Error Boundary]', err, info)
  // 将错误显示在页面上
  const appEl = document.getElementById('app')
  if (appEl && !document.getElementById('err-overlay')) {
    const overlay = document.createElement('div')
    overlay.id = 'err-overlay'
    overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#DC2626;color:#fff;padding:12px 20px;font-size:14px;font-family:sans-serif;white-space:pre-wrap;max-height:200px;overflow:auto;'
    overlay.textContent = '页面错误: ' + (err?.message || String(err)) + '\n' + info
    appEl.prepend(overlay)
  }
  return false // 阻止错误继续向上冒泡
})
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
