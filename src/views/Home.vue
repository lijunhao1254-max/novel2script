<template>
  <!-- ========== HERO ========== -->
  <section id="hero">
    <div class="hero-bg-glow"></div>
    <div class="container hero-inner">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          像搭积木一样组织剧本 · 编剧友好
        </div>
        <h1 class="hero-title">把小说变成剧本，<br>每一步都清清楚楚。</h1>
        <p class="hero-subtitle">
          Novel2Script 自动将小说转为结构化剧本——角色、场景、对白，像填表格一样整齐。每一步都可审核、可调整、可导出。
        </p>
        <div class="hero-cta-group">
          <router-link to="/convert" class="btn-primary">粘贴小说，免费生成剧本</router-link>
          <button class="btn-secondary btn-hero-secondary" @click="showDemo = true">看 30 秒演示</button>
        </div>
      </div>

      <!-- Hero 代码预览 -->
      <div class="hero-code-preview">
        <div class="code-window">
          <div class="code-titlebar">
            <span class="code-dot red"></span>
            <span class="code-dot yellow"></span>
            <span class="code-dot green"></span>
            <span class="code-title">output.yaml</span>
          </div>
          <pre class="code-body"><code>
<span class="yaml-comment"># Novel2Script 结构化输出</span>
<span class="yaml-key">script</span><span class="yaml-colon">:</span>
  <span class="yaml-key">meta</span><span class="yaml-colon">:</span>
    <span class="yaml-key">title</span><span class="yaml-colon">:</span> <span class="yaml-value">"深夜咖啡馆"</span>
  <span class="yaml-key">acts</span><span class="yaml-colon">:</span>
    <span class="yaml-dash">-</span> <span class="yaml-key">act</span><span class="yaml-colon">:</span> <span class="yaml-value">1</span>
      <span class="yaml-key">scenes</span><span class="yaml-colon">:</span>
        <span class="yaml-dash">-</span> <span class="yaml-key">location</span><span class="yaml-colon">:</span> <span class="yaml-value">"咖啡馆·室内"</span>
          </code></pre>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== FEATURES ========== -->
  <section id="features">
    <div class="container">
      <div class="section-header reveal">
        <h2 class="section-title">为什么选 Novel2Script？</h2>
        <p class="section-subtitle">不只是换个格式，让每一句对白都能被找到、修改和复用</p>
      </div>
      <div class="features-grid">
        <div class="card-feature reveal" v-for="feat in features" :key="feat.title">
          <div class="card-feature-icon" v-html="feat.icon"></div>
          <h3>{{ feat.title }}</h3>
          <p>{{ feat.desc }}</p>
          <div class="card-feature-stat">
            <span class="stat-value">{{ feat.statA }}</span> · <span class="stat-value">{{ feat.statB }}</span>
          </div>
        </div>
      </div>

      <!-- 结构化的力量：对比展示 -->
      <div class="compare-showcase reveal">
        <h3 class="compare-showcase-title">结构化的力量：传统剧本 vs Novel2Script</h3>
        <div class="compare-showcase-grid">
          <div class="compare-card bad">
            <div class="compare-card-label">传统剧本（纯文本）</div>
            <div class="compare-card-items">
              <div><span class="icon-no">✗</span>想找某角色的对白？全文搜索逐条翻</div>
              <div><span class="icon-no">✗</span>统计场景数量？手动数</div>
              <div><span class="icon-no">✗</span>改角色名？查找替换可能误改</div>
            </div>
          </div>
          <div class="compare-card good">
            <div class="compare-card-label">结构化剧本（Novel2Script）</div>
            <div class="compare-card-items">
              <div><span class="icon-yes">✓</span>按角色一键筛选所有对白</div>
              <div><span class="icon-yes">✓</span>场景数量自动统计</div>
              <div><span class="icon-yes">✓</span>批量替换角色名，零误改</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== PROOF / 效果演示 ========== -->
  <section id="proof">
    <div class="container">
      <div class="proof-inner reveal">
        <div class="proof-label">效果演示</div>
        <h2 class="proof-title">小说进去，结构化剧本出来</h2>
        <p class="proof-subtitle">输入一段小说文本，30 秒内获得可直接编辑的 YAML 结构化剧本</p>

        <div class="proof-demo-grid">
          <!-- 左侧：输入 -->
          <div class="proof-input-panel">
            <div class="panel-header">
              <span class="panel-dot red"></span>
              <span class="panel-dot yellow"></span>
              <span class="panel-dot green"></span>
              <span class="panel-title">输入：小说文本</span>
            </div>
            <div class="panel-body input-body">
              <p>苏晚推开门，看见顾寒正站在落地窗前。"你怎么来了？"他头也不回。</p>
              <p>"合同的事。"苏晚把文件拍在桌上。</p>
              <p>他终于转过身，目光微冷。</p>
            </div>
          </div>
          <!-- 中间箭头 -->
          <div class="proof-arrow">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
          <!-- 右侧：输出 -->
          <div class="proof-output-panel">
            <div class="panel-header">
              <span class="panel-dot red"></span>
              <span class="panel-dot yellow"></span>
              <span class="panel-dot green"></span>
              <span class="panel-title">输出：YAML 结构化剧本</span>
            </div>
            <pre class="panel-body output-body"><code>
<span class="yaml-key">scene</span><span class="yaml-colon">:</span>
  <span class="yaml-key">location</span><span class="yaml-colon">:</span> <span class="yaml-value">"室内·总裁办公室"</span>
  <span class="yaml-key">format</span><span class="yaml-colon">:</span> <span class="yaml-value">"竖屏短剧"</span>
  <span class="yaml-key">characters</span><span class="yaml-colon">:</span> <span class="yaml-value">[苏晚, 顾寒]</span>
  <span class="yaml-key">dialogues</span><span class="yaml-colon">:</span>
    <span class="yaml-dash">-</span> <span class="yaml-key">speaker</span><span class="yaml-colon">:</span> <span class="yaml-value">"顾寒"</span>
      <span class="yaml-key">line</span><span class="yaml-colon">:</span> <span class="yaml-value">"你怎么来了？"</span>
            </code></pre>
          </div>
        </div>

        <div class="proof-cta">
          <p class="proof-stat">内测招募中，前 100 名免费使用 3 个月</p>
          <p class="proof-stat-desc">网文作者、短剧编剧、影视工作室正在用 Novel2Script 将小说转化为结构化剧本。</p>
          <router-link to="/convert" class="btn-primary">申请内测，前 100 名免费 3 个月</router-link>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== SHOWCASE ========== -->
  <section id="showcase">
    <div class="container-wide">
      <!-- Showcase 1：短剧 -->
      <div class="showcase-row reveal">
        <div class="showcase-code">
          <div class="code-block-light">
<span class="yaml-comment"># 输入：短剧小说片段</span>
<span class="yaml-value">"苏晚推开门，看见顾寒正站在落地窗前。'你怎么</span>
<span class="yaml-value">来了？'他头也不回。'合同的事。'苏晚</span>
<span class="yaml-value">把文件拍在桌上。他终于转过身，目光微冷。"</span>

<span class="yaml-comment"># ↓ Novel2Script 输出（短剧格式）</span>

<span class="yaml-key">scene</span><span class="yaml-colon">:</span>
  <span class="yaml-key">location</span><span class="yaml-colon">:</span> <span class="yaml-value">室内·总裁办公室</span>
  <span class="yaml-key">time</span><span class="yaml-colon">:</span> <span class="yaml-value">日</span>
  <span class="yaml-key">format</span><span class="yaml-colon">:</span> <span class="yaml-value">竖屏短剧</span>
  <span class="yaml-key">characters</span><span class="yaml-colon">:</span> <span class="yaml-value">[苏晚, 顾寒]</span>
  <span class="yaml-key">dialogues</span><span class="yaml-colon">:</span>
    <span class="yaml-dash">-</span> <span class="yaml-key">speaker</span><span class="yaml-colon">:</span> <span class="yaml-value">顾寒</span>
      <span class="yaml-key">line</span><span class="yaml-colon">:</span> <span class="yaml-value">"你怎么来了？"</span>
          </div>
        </div>
        <div class="showcase-text">
          <h3>短剧小说 → 结构化剧本</h3>
          <div class="showcase-points">
            <div class="showcase-point" v-for="pt in showcasePoints1" :key="pt.text">
              <div class="showcase-point-icon" v-html="checkSVG"></div>
              <p>{{ pt.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Showcase 2：五步流程 -->
      <div class="showcase-row showcase-row-reverse reveal">
        <div class="showcase-code">
          <div class="code-block-light">
<span class="yaml-comment"># 五步完成，全程可控</span>

<span class="yaml-key">step_1_upload</span><span class="yaml-colon">:</span>  <span class="yaml-comment"># 上传小说文本</span>
<span class="yaml-key">step_2_parse</span><span class="yaml-colon">:</span>   <span class="yaml-comment"># AI 解析角色/场景</span>
<span class="yaml-key">step_3_review</span><span class="yaml-colon">:</span>  <span class="yaml-comment"># 你审核每一幕</span>
<span class="yaml-key">step_4_dialogue</span><span class="yaml-colon">:</span> <span class="yaml-comment"># 心理描写→对白</span>
<span class="yaml-key">step_5_export</span><span class="yaml-colon">:</span>  <span class="yaml-comment"># 导出 YAML / PDF / Fountain</span>
          </div>
        </div>
        <div class="showcase-text">
          <h3>五步完成，全程可控</h3>
          <div class="step-list">
            <div class="step-item" v-for="(s, i) in steps" :key="i">
              <div class="step-num">{{ i + 1 }}</div>
              <div>
                <h4>{{ s.title }}</h4>
                <p>{{ s.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== FLOW ========== -->
  <section id="flow">
    <div class="container">
      <div class="section-header reveal">
        <h2 class="section-title">从小说到剧本，只需五步</h2>
      </div>
      <div class="flow-grid">
        <div class="flow-step flow-node reveal" v-for="(f, i) in flowSteps" :key="i">
          <div class="flow-step-icon" v-html="f.icon"></div>
          <h4>{{ f.title }}</h4>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== PRICING ========== -->
  <section id="pricing">
    <div class="container">
      <div class="section-header reveal">
        <h2 class="section-title">简单透明的定价</h2>
        <p class="section-subtitle">无需签订合同，随时升级或降级</p>
      </div>

      <!-- 月付/年付切换 -->
      <div class="pricing-toggle reveal">
        <span :class="{ active: !isYearly }">月付</span>
        <button class="toggle-switch" @click="isYearly = !isYearly" :aria-label="isYearly ? '切换到月付' : '切换到年付'">
          <span class="toggle-knob" :class="{ right: isYearly }"></span>
        </button>
        <span :class="{ active: isYearly }">年付</span>
        <span class="toggle-save" v-if="isYearly">省 20%</span>
      </div>

      <div class="pricing-grid">
        <div class="pricing-card reveal" v-for="plan in pricingPlans" :key="plan.name"
             :class="{ featured: plan.featured }">
          <div class="pricing-badge" v-if="plan.featured">推荐</div>
          <h3 class="pricing-name">{{ plan.name }}</h3>
          <p class="pricing-desc">{{ plan.desc }}</p>
          <div class="pricing-price">
            <span class="pricing-currency">¥</span>
            <span class="pricing-amount">{{ isYearly ? plan.yearlyPrice : plan.price }}</span>
            <span class="pricing-period" v-if="plan.period">{{ plan.period }}</span>
          </div>
          <div class="pricing-original" v-if="plan.featured && isYearly">
            <span class="pricing-original-price">¥199/月</span>
            <span class="pricing-save-tag">省¥1200/年</span>
          </div>
          <div class="pricing-original" v-else-if="plan.featured && !isYearly">
            <span class="pricing-original-price">¥199/月</span>
          </div>
          <ul class="pricing-feature-list">
            <li class="pricing-feature-item" v-for="feat in plan.features" :key="feat">
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ feat }}
            </li>
          </ul>
          <button class="btn-primary" v-if="plan.featured" @click="openPayment(plan)">{{ plan.cta }}</button>
          <button class="btn-secondary" v-else @click="openPayment(plan)">{{ plan.cta }}</button>
        </div>
      </div>

      <!-- 对比表 -->
      <div class="pricing-compare-wrap reveal">
        <h3 class="pricing-compare-title">完整功能对比</h3>
        <div class="pricing-compare-scroll">
          <table class="pricing-compare-table">
            <thead>
              <tr>
                <th>功能</th>
                <th>免费版</th>
                <th class="compare-highlight">专业版 ⭐</th>
                <th>基础版</th>
                <th>按需版</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in compareRows" :key="row.feature">
                <td class="compare-feature">{{ row.feature }}</td>
                <td class="compare-plan"><span :class="cellClass(row.free)">{{ row.free }}</span></td>
                <td class="compare-plan compare-highlight"><span :class="cellClass(row.pro)">{{ row.pro }}</span></td>
                <td class="compare-plan"><span :class="cellClass(row.basic)">{{ row.basic }}</span></td>
                <td class="compare-plan"><span :class="cellClass(row.paygo)">{{ row.paygo }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="pricing-footer reveal">
        专业版支持 API 调用 · 开源版本可自行部署
      </p>
    </div>
  </section>

  <!-- ========== CTA ========== -->
  <section id="cta">
    <div class="container">
      <div class="cta-inner reveal">
        <h2 class="cta-title">现在开始，你的第一部 AI 剧本只需 30 秒</h2>
        <p class="cta-subtitle">免费开始，无需注册，先试后注册</p>
        <div class="cta-form" style="justify-content:center;">
          <router-link to="/convert" class="btn-primary" style="font-size:16px;padding:14px 40px;">
            立即免费使用
          </router-link>
        </div>
        <p class="cta-security">你的作品数据端到端加密 · 转换完成后原始文本 24 小时内删除 · 随时取消订阅</p>
      </div>
    </div>
  </section>

  <!-- 30秒演示模态框 -->
  <DemoModal :visible="showDemo" @close="showDemo = false" />

  <!-- 支付弹窗 -->
  <PaymentModal
    :visible="showPayment"
    :plan="selectedPlan"
    :yearly="isYearly"
    @close="showPayment = false"
    @success="onPaySuccess"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DemoModal from '@/components/DemoModal.vue'
import PaymentModal from '@/components/PaymentModal.vue'

const router = useRouter()

/* ---- Demo modal ---- */
const showDemo = ref(false)

/* ---- Payment modal ---- */
const showPayment = ref(false)
const selectedPlan = ref(null)

function openPayment(plan) {
  // 免费版直接跳转
  if (!plan.price || plan.price === '0') {
    router.push('/convert')
    return
  }
  selectedPlan.value = plan
  showPayment.value = true
}

function onPaySuccess(info) {
  console.log('支付成功', info)
  // 此处可更新用户订阅状态（接入真实后端后修改）
}

/* ---- Features ---- */
const features = ref([
  {
    title: '零门槛上手',
    desc: '直接粘贴小说文本即可开始，无需学习 YAML 或任何标记语言。转换结果所见即所得，边改边看。',
    statA: '1键转换',
    statB: '0学习成本',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'
  },
  {
    title: '结构化输出',
    desc: '每一句对白、每一个场景、每一个角色，都被整齐地放在对应的"格子"里。随时可查、可改、可导出，就像剧本的 Excel 表格。',
    statA: '格式自动校验',
    statB: '随时可导出',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
  },
  {
    title: '分步可控',
    desc: 'AI 不是黑盒。解析→确认角色→审核场景→生成对白→导出，五步流程每一步都可修改、可撤销，你始终是创作者。',
    statA: '每一步',
    statB: '都可修改、可撤销',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/></svg>'
  }
])

/* ---- Showcase ---- */
const showcasePoints1 = ref([
  { text: '自动识别角色和场景，适配竖屏短剧格式' },
  { text: '心理描写智能转为对白和舞台指示' },
  { text: '标准结构化格式，搜索、替换、统计一键搞定' }
])

const steps = ref([
  { title: '上传小说', desc: '粘贴文本或上传 TXT、DOCX 文件' },
  { title: 'AI 解析', desc: '自动提取角色、分割场景、识别对白' },
  { title: '分步审核', desc: '确认角色、审核场景，每步可修改可回退' },
  { title: '生成对白', desc: '心理描写转为台词和动作，逐条审核' },
  { title: '导出', desc: 'YAML / PDF / Fountain 多格式输出' }
])

/* ---- Flow ---- */
const flowSteps = ref([
  {
    title: '上传小说',
    desc: '粘贴文本或上传 TXT、DOCX 文件',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
  },
  {
    title: 'AI 解析',
    desc: '自动提取角色、分割场景、识别对白',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/></svg>'
  },
  {
    title: '分步审核',
    desc: '确认角色、审核场景，每步可修改可回退',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9"/></svg>'
  },
  {
    title: '生成对白',
    desc: '心理描写转为台词和动作，逐条审核',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'
  },
  {
    title: '导出',
    desc: 'YAML / PDF / Fountain 多格式输出',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
  }
])

/* ---- Pricing ---- */
const isYearly = ref(false)

const pricingPlans = ref([
  {
    name: '免费版',
    desc: '零成本体验',
    price: '0',
    yearlyPrice: '0',
    period: '',
    features: ['每月 3 次转换', '单次 ≤ 5 万字', '转换结果在线预览（不可编辑）', '多格式导出（YAML/PDF/Fountain）'],
    cta: '免费开始',
    featured: false
  },
  {
    name: '专业版',
    desc: '专业编剧和影视工作室',
    price: '99',
    yearlyPrice: '79',
    period: '/月',
    features: ['无限次转换', '单次 ≤ 20 万字', 'API 调用', '批量处理 & 优先支持', '角色库 & 版本对比', '自定义 Schema'],
    cta: '选择专业版',
    featured: true
  },
  {
    name: '基础版',
    desc: '适合网文作者和短剧编剧，日常创作够用',
    price: '39',
    yearlyPrice: '31',
    period: '/月',
    features: ['每月 50 次转换', '单次 ≤ 10 万字', '多格式导出（YAML/PDF/Fountain）', '基础预览'],
    cta: '选择基础版',
    featured: false
  },
  {
    name: '按需版',
    desc: '偶尔使用的用户',
    price: '9.9',
    yearlyPrice: '9.9',
    period: '/次',
    features: ['单次转换 ≤ 10 万字', '无需订阅', '多格式导出（YAML/PDF/Fountain）', '即时转换，用完即走'],
    cta: '按需购买',
    featured: false
  }
])

/* ---- Compare Table ---- */
const compareRows = ref([
  { feature: '每月转换次数', free: '3 次', pro: '无限', basic: '50 次', paygo: '1 次' },
  { feature: '单次字数上限', free: '5 万', pro: '20 万', basic: '10 万', paygo: '10 万' },
  { feature: '多格式导出', free: '✓', pro: '✓', basic: '✓', paygo: '✓' },
  { feature: '角色管理', free: '—', pro: '✓', basic: '✓', paygo: '—' },
  { feature: '版本对比', free: '—', pro: '✓', basic: '—', paygo: '—' },
  { feature: 'API 调用', free: '—', pro: '✓', basic: '—', paygo: '—' },
  { feature: '批量处理', free: '—', pro: '✓', basic: '—', paygo: '—' },
  { feature: '优先支持', free: '—', pro: '✓', basic: '—', paygo: '—' },
  { feature: '自定义 Schema', free: '—', pro: '✓', basic: '—', paygo: '—' },
  { feature: '预览', free: '仅预览', pro: '✓', basic: '✓', paygo: '✓' }
])

function cellClass(val) {
  if (val === '✓') return 'check-yes'
  if (val === '—') return 'check-no'
  return 'check-text'
}

function goConvert() {
  router.push('/convert')
}

function scrollToShowcase() {
  const el = document.getElementById('showcase')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

/* ---- Check SVG ---- */
const checkSVG = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'

/* ---- Reveal on scroll ---- */
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible')
    })
  }, { threshold: 0.1 })

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
})
</script>

<style scoped>
/* ========================================
   HERO
   ======================================== */
#hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: var(--gradient-hero, linear-gradient(160deg, #1E1B4B 0%, #312E81 40%, #4F46E5 100%));
  position: relative;
  overflow: hidden;
  padding-top: 72px;
}
.hero-bg-glow {
  position: absolute;
  width: 800px; height: 800px;
  background: radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%);
  top: -200px; right: -200px;
  pointer-events: none;
}
.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
  padding: 60px 24px 80px;
}
.hero-content { position: relative; z-index: 1; }
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-full);
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  margin-bottom: 24px;
  backdrop-filter: blur(4px);
}
.hero-badge-dot {
  width: 6px; height: 6px;
  background: #6EE7B7;
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.hero-title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  line-height: 1.15;
  color: #fff;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}
.hero-subtitle {
  font-size: clamp(15px, 1.8vw, 18px);
  line-height: 1.7;
  color: rgba(255,255,255,0.7);
  margin-bottom: 36px;
  max-width: 520px;
}
.hero-cta-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  box-shadow: var(--shadow-primary);
  text-decoration: none;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: transparent;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border: 1.5px solid rgba(255,255,255,0.4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.7);
}

/* Code preview */
.hero-code-preview { position: relative; z-index: 1; }
.code-window {
  background: #1E1B4B;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}
.code-titlebar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.code-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
}
.code-dot.red { background: #EF4444; }
.code-dot.yellow { background: #F59E0B; }
.code-dot.green { background: #10B981; }
.code-title {
  margin-left: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  font-family: var(--font-mono);
}
.code-body {
  padding: 20px;
  font-size: 13px;
  line-height: 1.8;
  color: #93C5FD;
  font-family: var(--font-mono);
  overflow-x: auto;
  margin: 0;
}
.yaml-key     { color: #C4B5FD; }
.yaml-value   { color: #93C5FD; }
.yaml-comment { color: #64748B; font-style: italic; }
.yaml-colon   { color: #A5B4FC; }
.yaml-dash    { color: #F472B6; }

/* ========================================
   FEATURES
   ======================================== */
#features {
  padding: 72px 0 56px;
  background: #fff;
  position: relative;
}
.section-header { text-align: center; margin-bottom: 32px; }
.section-title {
  font-size: clamp(22px, 3vw, 36px);
  font-weight: 700;
  color: var(--color-gray-900);
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}
.section-subtitle {
  font-size: 15px;
  color: var(--color-gray-500);
  max-width: 560px;
  margin: 0 auto;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}
.card-feature {
  padding: 24px;
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  transition: all 0.25s;
}
.card-feature:hover {
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}
.card-feature-icon {
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-50);
  color: var(--color-primary-600);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}
.card-feature-icon svg {
  width: 22px; height: 22px;
}
.card-feature h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 8px;
}
.card-feature p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-gray-500);
  margin-bottom: 16px;
}
.card-feature-stat {
  padding-top: 14px;
  border-top: 1px solid var(--color-gray-100);
  font-size: 13px;
  color: var(--color-gray-400);
}
.stat-value { color: var(--color-primary-600); font-weight: 500; }

/* Compare showcase */
.compare-showcase { margin-top: 40px; }
.compare-showcase-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 20px;
}
.compare-showcase-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 860px;
  margin: 0 auto;
}
.compare-card {
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}
.compare-card.good {
  background: rgba(79,70,229,0.03);
  border-color: rgba(79,70,229,0.15);
}
.compare-card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-gray-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}
.compare-card.good .compare-card-label { color: var(--color-primary-600); }
.compare-card-items { display: flex; flex-direction: column; gap: 10px; }
.compare-card-items > div {
  font-size: 14px;
  color: var(--color-gray-600);
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-no { color: var(--color-gray-300); font-weight: 700; }
.icon-yes { color: var(--color-primary-500); font-weight: 700; }

/* ========================================
   PROOF
   ======================================== */
#proof {
  padding: 56px 0;
  background: var(--color-gray-50);
  position: relative;
}
.proof-inner { position: relative; z-index: 1; }
.proof-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary-600);
  background: var(--color-primary-50);
  padding: 4px 16px;
  border-radius: var(--radius-full);
  margin-bottom: 20px;
}
.proof-title {
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 12px;
}
.proof-subtitle {
  font-size: 15px;
  color: var(--color-gray-500);
  margin-bottom: 36px;
}
.proof-demo-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
  margin-bottom: 40px;
}
.proof-input-panel,
.proof-output-panel {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--color-gray-100);
  border-bottom: 1px solid var(--color-gray-200);
}
.panel-dot { width: 10px; height: 10px; border-radius: 50%; }
.panel-dot.red { background: #EF4444; }
.panel-dot.yellow { background: #F59E0B; }
.panel-dot.green { background: #10B981; }
.panel-title { margin-left: 8px; font-size: 12px; color: var(--color-gray-500); font-family: var(--font-mono); }
.panel-body { padding: 20px; font-size: 14px; line-height: 1.8; }
.input-body { background: #fff; color: var(--color-gray-700); }
.input-body p { margin-bottom: 8px; }
.output-body {
  background: #1E1B4B;
  color: #93C5FD;
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-x: auto;
  margin: 0;
}
.proof-arrow { color: var(--color-primary-400); }
.proof-cta { text-align: center; }
.proof-stat {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 8px;
}
.proof-stat-desc {
  font-size: 14px;
  color: var(--color-gray-500);
  margin-bottom: 20px;
}

/* ========================================
   SHOWCASE
   ======================================== */
#showcase {
  padding: 72px 0;
  background: #fff;
}
.showcase-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  margin-bottom: 72px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 24px;
}
.showcase-row-reverse { direction: rtl; }
.showcase-row-reverse > * { direction: ltr; }
.showcase-code { position: relative; }
.code-block-light {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 24px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.9;
  overflow-x: auto;
  color: var(--code-value-light, #2563EB);
}
.showcase-text h3 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 20px;
}
.showcase-points { display: flex; flex-direction: column; gap: 16px; }
.showcase-point {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.showcase-point-icon {
  flex-shrink: 0;
  width: 20px; height: 20px;
  color: var(--color-primary-500);
  margin-top: 2px;
}
.showcase-point p { font-size: 14px; color: var(--color-gray-600); line-height: 1.6; }

.step-list { display: flex; flex-direction: column; gap: 20px; }
.step-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.step-num {
  flex-shrink: 0;
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
}
.step-item h4 { font-size: 15px; font-weight: 600; color: var(--color-gray-900); margin-bottom: 2px; }
.step-item p { font-size: 13px; color: var(--color-gray-500); }

/* ========================================
   FLOW
   ======================================== */
#flow {
  padding: 56px 0 72px;
  background: var(--color-gray-50);
  position: relative;
}
.flow-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}
.flow-step {
  text-align: center;
  padding: 28px 16px;
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  transition: all 0.25s;
}
.flow-step:hover {
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}
.flow-step-icon {
  width: 64px; height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-50);
  color: var(--color-primary-600);
  border-radius: 50%;
  margin: 0 auto 16px;
}
.flow-step-icon svg { width: 28px; height: 28px; }
.flow-step h4 { font-size: 15px; font-weight: 600; color: var(--color-gray-900); margin-bottom: 4px; }
.flow-step p { font-size: 13px; color: var(--color-gray-500); }

/* ========================================
   PRICING
   ======================================== */
#pricing {
  padding: 56px 0 64px;
  background: #fff;
  position: relative;
}
/* 月付/年付切换 */
.pricing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
  font-size: 14px;
  color: var(--color-gray-500);
}
.pricing-toggle span.active {
  color: var(--color-gray-900);
  font-weight: 600;
}
.toggle-switch {
  width: 48px;
  height: 26px;
  background: var(--color-gray-200);
  border-radius: 13px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.25s;
  padding: 0;
}
.toggle-switch:hover { background: var(--color-gray-300); }
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s var(--ease-default);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.toggle-knob.right { transform: translateX(22px); }
.toggle-save {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  background: rgba(16,185,129,0.1);
  color: #059669;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-full);
  margin-left: 4px;
}
/* 锚点划线价 */
.pricing-original {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -4px;
}
.pricing-original-price {
  font-size: 14px;
  color: var(--color-gray-400);
  text-decoration: line-through;
}
.pricing-save-tag {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  background: rgba(16,185,129,0.1);
  padding: 1px 8px;
  border-radius: var(--radius-full);
}
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto 40px;
}
.pricing-card {
  padding: 24px 20px;
  background: #fff;
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.25s;
  position: relative;
}
.pricing-card.featured {
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-primary);
  transform: scale(1.03);
  z-index: 1;
}
.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: var(--radius-full);
}
.pricing-name { font-size: 16px; font-weight: 600; color: var(--color-gray-900); }
.pricing-desc { font-size: 13px; color: var(--color-gray-500); }
.pricing-price { display: flex; align-items: baseline; gap: 2px; }
.pricing-currency { font-size: 22px; font-weight: 600; color: var(--color-gray-900); }
.pricing-amount { font-size: 42px; font-weight: 800; color: var(--color-gray-900); letter-spacing: -0.03em; }
.pricing-period { font-size: 14px; color: var(--color-gray-500); }
.pricing-feature-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.pricing-feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-gray-700);
}
.pricing-feature-item svg {
  flex-shrink: 0;
  width: 16px; height: 16px;
  color: var(--color-primary-500);
  stroke-width: 2.5;
}
.pricing-card .btn-primary,
.pricing-card .btn-secondary {
  width: 100%;
  justify-content: center;
  padding: 12px 24px;
  font-size: 14px;
}
.pricing-card .btn-secondary {
  background: transparent;
  color: var(--color-primary-600);
  border: 1.5px solid var(--color-primary-600);
}
.pricing-compare-wrap { margin-top: 20px; }
.pricing-compare-title { font-size: 18px; font-weight: 600; color: var(--color-gray-900); margin-bottom: 20px; text-align: center; }
.pricing-compare-scroll { overflow-x: auto; }
.pricing-compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.pricing-compare-table th {
  padding: 12px 14px;
  text-align: center;
  font-weight: 600;
  color: var(--color-gray-600);
  border-bottom: 2px solid var(--color-gray-200);
  white-space: nowrap;
}
.pricing-compare-table td {
  padding: 12px 14px;
  text-align: center;
  border-bottom: 1px solid var(--color-gray-100);
  color: var(--color-gray-700);
  white-space: nowrap;
}
.compare-feature { text-align: left !important; font-weight: 500; color: var(--color-gray-900) !important; }
.compare-highlight { background: rgba(79,70,229,0.03); }
.check-yes { color: var(--color-primary-500); font-weight: 600; }
.check-no { color: var(--color-gray-300); }
.check-text { color: var(--color-gray-700); }
.pricing-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: var(--color-gray-400);
}

/* ========================================
   CTA
   ======================================== */
#cta {
  padding: 72px 0;
  background: var(--gradient-primary);
  position: relative;
}
.cta-inner {
  text-align: center;
  color: #fff;
}
.cta-title {
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}
.cta-subtitle { font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 8px; }
.cta-form { display: flex; justify-content: center; margin-top: 24px; }
.cta-security {
  margin-top: 16px;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 1024px) {
  .hero-inner { grid-template-columns: 1fr; gap: 40px; text-align: center; }
  .hero-subtitle { margin: 0 auto 36px; }
  .hero-cta-group { justify-content: center; }
  .hero-code-preview { max-width: 560px; margin: 0 auto; }
  .features-grid { grid-template-columns: 1fr; gap: 20px; }
  .flow-grid { grid-template-columns: repeat(3, 1fr); }
  .pricing-grid { grid-template-columns: repeat(2, 1fr); }
  .showcase-row { grid-template-columns: 1fr; gap: 32px; }
  .showcase-row-reverse { direction: ltr; }
  .proof-demo-grid { grid-template-columns: 1fr; }
  .proof-arrow { transform: rotate(90deg); justify-self: center; }
  .compare-showcase-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .hero-title { font-size: 28px; }
  .flow-grid { grid-template-columns: 1fr 1fr; }
  .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin-left: auto; margin-right: auto; }
  .pricing-card.featured { transform: none; }
  .section-title { font-size: 22px; }
}
</style>
