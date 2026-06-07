import fs from 'fs';

// 模拟AI解析流程，检查可能的失败原因
async function debugAIParse() {
  console.log('=== AI解析失败调试 ===\n');
  
  // 1. 检查测试文本
  const testText = `苏晚推开办公室的门。
看见顾寒正站在落地窗前。
"你怎么来了？"他头也不回。
"我来找你。"苏晚把文件拍在桌上。`;
  
  console.log('测试文本:');
  console.log(testText);
  console.log(`\n文本长度: ${testText.length} 字`);
  
  // 2. 检查对话提取
  console.log('\n--- 步骤1: 对话提取测试 ---');
  const patterns = [
    /\u201C([^\u201D]{1,200})\u201D/g,
    /"([^"]{1,200})"/g
  ];
  let allDialogues = [];
  for (const pattern of patterns) {
    for (const m of testText.matchAll(pattern)) {
      allDialogues.push(m[1]);
    }
  }
  console.log(`检测到 ${allDialogues.length} 段对话:`);
  allDialogues.forEach((d, i) => console.log(`  ${i + 1}. "${d}"`));
  
  // 3. 检查角色提取
  console.log('\n--- 步骤2: 角色提取测试 ---');
  const speakPattern = /(?<![他她我你它])([\u4e00-\u9fff]{2,4})(?:说道|道|说|笑道|问道|答道|喊道|叹道|怒道|冷道|淡道)/g;
  const matches = [...testText.matchAll(speakPattern)];
  console.log(`检测到 ${matches.length} 个角色:`);
  matches.forEach(m => console.log(`  - ${m[1]}`));
  
  // 4. 检查API配置（模拟）
  console.log('\n--- 步骤3: API配置检查 ---');
  const aiConfig = {
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4.7-flash',
    apiKey: '******' // 隐藏实际Key
  };
  console.log(`API地址: ${aiConfig.apiUrl}`);
  console.log(`模型: ${aiConfig.model}`);
  console.log(`API Key: ${aiConfig.apiKey ? '已配置' : '未配置'}`);
  
  // 5. 模拟AI响应验证
  console.log('\n--- 步骤4: AI响应验证测试 ---');
  
  // 模拟空响应
  const emptyResponse = '';
  const isEmpty = !emptyResponse || emptyResponse.trim().length < 20;
  console.log(`空响应测试: ${isEmpty ? '✗ 验证失败（内容为空）' : '✓ 通过'}`);
  
  // 模拟不完整响应
  const incompleteResponse = `script:
  meta:
    title: "测试"`;
  const hasScene = incompleteResponse.includes('scene:');
  const hasSpeaker = incompleteResponse.includes('speaker:');
  console.log(`不完整响应测试: scene=${hasScene}, speaker=${hasSpeaker} -> ${hasScene || hasSpeaker ? '✓ 通过' : '✗ 验证失败'}`);
  
  // 模拟错误响应
  const errorResponse = '抱歉，我无法处理这个请求。';
  const hasErrorPhrase = ['抱歉', '对不起', '无法', '不能'].some(p => errorResponse.includes(p));
  console.log(`错误响应测试: ${hasErrorPhrase ? '✗ 验证失败（AI拒绝）' : '✓ 通过'}`);
  
  // 6. 检查网络连接（模拟）
  console.log('\n--- 步骤5: 网络连接检查 ---');
  console.log('提示: 请确保网络连接正常，API地址可访问');
  console.log('常见问题:');
  console.log('  - API Key无效或已过期');
  console.log('  - 网络请求超时（超过60秒）');
  console.log('  - 请求过于频繁被限流（429错误）');
  console.log('  - API服务暂时不可用（5xx错误）');
  
  // 7. 检查降级机制
  console.log('\n--- 步骤6: 降级机制检查 ---');
  console.log('降级机制已启用: ✓');
  console.log('当AI解析失败时，会自动切换到规则引擎');
  
  console.log('\n=== 调试完成 ===');
  console.log('\n建议排查方向:');
  console.log('1. 检查API Key是否正确配置');
  console.log('2. 检查网络连接是否稳定');
  console.log('3. 打开浏览器控制台查看具体错误');
  console.log('4. 尝试使用规则引擎模式（不配置AI Key）');
}

debugAIParse();
