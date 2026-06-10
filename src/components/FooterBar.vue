<template>
  <footer class="footer">
    <div class="footer-inner container">
      <div class="footer-brand">
        <span class="footer-logo">幕启<span> · MuQi</span></span>
        <p>AI 驱动的结构化剧本引擎。把小说变成剧本，每一步都清清楚楚。</p>
      </div>
      <div class="footer-col">
        <h4>产品</h4>
        <ul>
          <li><a href="#features">功能</a></li>
          <li><router-link to="/">首页</router-link></li>
          <li><router-link to="/convert">开始转换</router-link></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>支持</h4>
        <ul>
          <li><a href="#cta">加入内测</a></li>
          <li><a href="#">隐私政策</a></li>
          <li><a href="#">退款政策</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>公司</h4>
        <ul>
          <li><a href="#cta">联系我们</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} 幕启 MuQi. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  background: var(--color-gray-900);
  color: var(--color-gray-400);
  padding: 56px 0 0;
  margin-top: auto;
}
.footer-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 48px;
}
.footer-logo {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}
.footer-logo span { color: var(--color-primary-400); }
.footer-brand p {
  font-size: 13px;
  line-height: 1.7;
  margin-top: 12px;
  color: var(--color-gray-500);
}
.footer-col h4 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-gray-300);
  margin-bottom: 16px;
}
.footer-col ul { display: flex; flex-direction: column; gap: 10px; }
.footer-col a {
  font-size: 14px;
  color: var(--color-gray-400);
  transition: color 0.15s;
}
.footer-col a:hover { color: #fff; }

.footer-bottom {
  border-top: 1px solid var(--color-gray-800);
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-gray-500);
}

@media (max-width: 768px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
