import fs from 'fs';
import path from 'path';

console.log('=== 幕启 MuQi 转换测试 ===\n');

// 读取示例小说
const novelPath = path.join(process.cwd(), 'example_novel.txt');
console.log(`1. 读取示例小说: ${novelPath}`);
let novelText = '';
try {
  novelText = fs.readFileSync(novelPath, 'utf8');
  console.log(`   ✓ 读取成功 (${novelText.length} 字)`);
} catch (err) {
  console.log(`   ✗ 读取失败: ${err.message}`);
  process.exit(1);
}

console.log('\n2. 分析章节结构:');
const chapterPattern = /(?:^|\n)(第[一二三四五六七八九十百千\d]+[章节回幕][^\n]*)/g;
const chapters = [];
for (const m of novelText.matchAll(chapterPattern)) {
  chapters.push(m[1]);
}
console.log(`   ✓ 检测到 ${chapters.length} 个章节:`);
chapters.forEach((ch, i) => {
  console.log(`     ${i + 1}. ${ch}`);
});

console.log('\n3. 分析角色:');
const speakVerb = '(?:淡淡说道|低声说道|轻声说道|冷冷说道|缓缓说道|微微笑道|轻轻叹道|嘿嘿笑道|哈哈笑道|淡淡笑道|轻声问道|低声问道|冷冷问道|缓缓问道|冷哼一声|冷冷道|缓缓道|淡淡道|轻声道|沉声道|微微道|轻轻道|怒声道|冷声道|淡声道|叹声道|哭声道|说道|笑道|问道|答道|喊道|叫道|吼道|怒道|冷道|淡道|叹道|哭道|喝道|嚷道|骂道|喃喃道|嘀咕道|解释道|补充道|回应道|开口道|说|道|问|答|喊|叫|吼)';
const speakerPattern = new RegExp(`(?<![他她我你它])([\\u4e00-\\u9fff]{2,4})${speakVerb}`, 'g');
const speakers = new Set();
for (const m of novelText.matchAll(speakerPattern)) {
  speakers.add(m[1]);
}
console.log(`   ✓ 识别到 ${speakers.size} 个角色:`);
[...speakers].forEach((s, i) => {
  console.log(`     ${i + 1}. ${s}`);
});

console.log('\n4. 分析对话:');
const quotePatterns = [
  /\u201C([^\u201D]{1,200})\u201D/g,
  /\u300C([^\u300D]{1,200})\u300D/g,
  /"([^"]{1,200})"/g
];
const dialogues = [];
for (const pattern of quotePatterns) {
  for (const m of novelText.matchAll(pattern)) {
    dialogues.push(m[1]);
  }
}
console.log(`   ✓ 识别到 ${dialogues.length} 段对话:`);
dialogues.slice(0, 5).forEach((d, i) => {
  console.log(`     ${i + 1}. "${d.slice(0, 40)}${d.length > 40 ? '…' : ''}"`);
});
if (dialogues.length > 5) {
  console.log(`     ... 还有 ${dialogues.length - 5} 段`);
}

console.log('\n=== 测试完成 ===');
console.log('\n项目已准备好，可以运行以下命令启动开发服务器:');
console.log('  npm run dev');
console.log('\n或者构建生产版本:');
console.log('  npm run build');
