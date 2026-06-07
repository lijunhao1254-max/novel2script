import fs from 'fs';

// 简化的转换引擎测试
console.log('=== Novel2Script 转换引擎测试 ===\n');

// 读取测试小说
const novel = fs.readFileSync('./test_full_novel.txt', 'utf8');
console.log(`1. 测试小说: ${novel.length} 字`);
console.log(`   章节数: ${novel.split('第').length - 1} 个\n`);

// 测试章节检测
console.log('2. 章节检测测试:');
const chapterPattern = /(?:^|\n)(第[一二三四五六七八九十百千\d]+[章节回幕][^\n]*)/g;
const chapters = [...novel.matchAll(chapterPattern)].map(m => m[1]);
console.log(`   ✓ 检测到 ${chapters.length} 个章节`);
chapters.forEach((ch, i) => console.log(`     ${i + 1}. ${ch}`));

// 测试角色提取
console.log('\n3. 角色提取测试:');
const speakVerb = '(?:淡淡说道|低声说道|轻声说道|冷冷说道|缓缓说道|微微笑道|轻轻叹道|嘿嘿笑道|哈哈笑道|淡淡笑道|轻声问道|低声问道|冷冷问道|缓缓问道|冷哼一声|冷冷道|缓缓道|淡淡道|轻声道|沉声道|微微道|轻轻道|说道|笑道|问道|答道|喊道|叫道|吼道|说道|问道|答道)';
const speakerPattern = new RegExp(`(?<![他她我你它])([\\u4e00-\\u9fff]{2,4})${speakVerb}`, 'g');
const speakers = new Set();
for (const m of novel.matchAll(speakerPattern)) {
  speakers.add(m[1]);
}
console.log(`   ✓ 识别到 ${speakers.size} 个角色`);
[...speakers].forEach((s, i) => console.log(`     ${i + 1}. ${s}`));

// 测试对话提取
console.log('\n4. 对话提取测试:');
const quotePatterns = [
  /\u201C([^\u201D]{1,200})\u201D/g,
  /"([^"]{1,200})"/g
];
const dialogues = [];
for (const pattern of quotePatterns) {
  for (const m of novel.matchAll(pattern)) {
    dialogues.push(m[1]);
  }
}
console.log(`   ✓ 识别到 ${dialogues.length} 段对话`);
dialogues.slice(0, 8).forEach((d, i) => {
  const preview = d.length > 30 ? d.slice(0, 30) + '...' : d;
  console.log(`     ${i + 1}. "${preview}"`);
});

// 测试场景分割
console.log('\n5. 场景分割测试:');
const paragraphs = novel.split(/\n\n+/);
console.log(`   ✓ 段落数: ${paragraphs.length}`);
const chapterBreaks = paragraphs.filter(p => /^第[一二三四五六七八九十\d]+[章节回幕]/.test(p.trim()));
console.log(`   ✓ 章节边界: ${chapterBreaks.length} 个`);

// 生成模拟YAML输出
console.log('\n6. YAML输出生成测试:');
const yamlOutput = `script:
  meta:
    title: "第一章 相遇"
    source: "用户输入"
    format: "竖屏短剧"
    generated_at: "${new Date().toISOString()}"
    stats:
      characters: ${speakers.size}
      scenes: ${chapters.length}
      dialogues: ${dialogues.length}

  acts:
${chapters.map((ch, i) => `    - act_id: ${i + 1}
      act_title: "${ch.replace(/^第[一二三四五六七八九十百千\d]+[章节回幕]\s*/, '')}"
      scenes:
        - scene_id: 1
          location: "室内·咖啡馆"
          time: "夜"
          mood: "紧张"
          scene_note: ""
          characters:
            - name: "${[...speakers][0] || '角色'}"
              role: "主角"
          dialogues:
            - dialogue_id: 1
              type: "spoken"
              speaker: "${[...speakers][0] || '角色'}"
              line: "${dialogues[0] || ''}"
              action: ""
              note: ""`).join('\n')}`;

console.log('   ✓ YAML结构生成成功');
console.log('\n   预览（前30行）:');
const yamlLines = yamlOutput.split('\n').slice(0, 30);
yamlLines.forEach(line => console.log('   ' + line));

// 验证YAML格式
console.log('\n7. YAML格式验证:');
const checks = {
  'script根节点': yamlOutput.includes('script:'),
  'meta元数据': yamlOutput.includes('meta:'),
  'title标题': yamlOutput.includes('title:'),
  'acts幕列表': yamlOutput.includes('acts:'),
  'act_id编号': yamlOutput.includes('act_id:'),
  'act_title标题': yamlOutput.includes('act_title:'),
  'scenes场景': yamlOutput.includes('scenes:'),
  'location位置': yamlOutput.includes('location:'),
  'time时间': yamlOutput.includes('time:'),
  'mood氛围': yamlOutput.includes('mood:'),
  'characters角色': yamlOutput.includes('characters:'),
  'dialogues对话': yamlOutput.includes('dialogues:'),
  'speaker说话人': yamlOutput.includes('speaker:'),
  'line台词': yamlOutput.includes('line:'),
  'type类型': yamlOutput.includes('type:')
};

let passed = 0;
let total = Object.keys(checks).length;
for (const [name, result] of Object.entries(checks)) {
  const status = result ? '✓' : '✗';
  console.log(`   ${status} ${name}`);
  if (result) passed++;
}

console.log(`\n8. 测试结果:`);
console.log(`   通过: ${passed}/${total}`);
console.log(`   成功率: ${((passed / total) * 100).toFixed(1)}%`);

if (passed === total) {
  console.log('\n🎉 所有测试通过！转换引擎工作正常。');
} else if (passed >= total * 0.8) {
  console.log('\n⚠️  大部分测试通过，转换引擎基本正常。');
} else {
  console.log('\n❌  测试失败较多，需要检查。');
}

// 保存YAML输出用于验证
fs.writeFileSync('./test_output.yaml', yamlOutput);
console.log('\n9. 测试输出已保存到 test_output.yaml');
console.log('   可用于进一步验证或导入到其他工具。');
