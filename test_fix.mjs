import fs from 'fs';

const testText = `苏晚推开办公室的门。
看见顾寒正站在落地窗前。
"你怎么来了？"他头也不回。
"你怎么来了？"他头也不回。
"我来找你。"苏晚把文件拍在桌上。
顾寒转过身，目光冰冷：
"这就是你想要的？"
"没错。"苏晚直视他的眼睛。
"不，这是你想要的。"
苏晚的声音陡然平静。`;

console.log('测试文本长度:', testText.length, '字');
console.log('\n测试文本内容:');
console.log(testText);

console.log('\n=== 测试简化后的正则表达式 ===');

const start = Date.now();

// 测试模式1：XX说/XX道
const pattern1 = /(?<![他她我你它])([\u4e00-\u9fff]{2,4})(?:说道|道|说|笑道|问道|答道|喊道|叹道|怒道|冷道|淡道)/g;
const matches1 = [...testText.matchAll(pattern1)];
console.log('\n模式1 (XX说/XX道):', matches1.length, '个匹配');
matches1.forEach(m => console.log(`  - ${m[1]} + 说/道`));

// 测试模式2：引号后名字
const pattern2 = /[“”"']\s*([\u4e00-\u9fff]{2,4})[，,。\s]*说/g;
const matches2 = [...testText.matchAll(pattern2)];
console.log('\n模式2 (引号后名字):', matches2.length, '个匹配');
matches2.forEach(m => console.log(`  - "${m[1]}"`));

// 测试模式3：XX+动作
const pattern3 = /(?<![他她我你它])([\u4e00-\u9fff]{2,4})(?:站起身|坐下来|推开门|走进来|抬起头|低下头|转过身)/g;
const matches3 = [...testText.matchAll(pattern3)];
console.log('\n模式3 (XX+动作):', matches3.length, '个匹配');
matches3.forEach(m => console.log(`  - ${m[1]} + 动作`));

// 测试模式4：称呼
const pattern4 = /([\u4e00-\u9fff]{2,3})(?:先生|小姐|老师|前辈|公子|少爷|姑娘|大师)/g;
const matches4 = [...testText.matchAll(pattern4)];
console.log('\n模式4 (称呼):', matches4.length, '个匹配');

// 测试模式5：通用
const pattern5 = /(?<![他她我你它])([\u4e00-\u9fff]{2,4})(?:站在|坐在|走在|来到|走到|看向|望着|盯着)/g;
const matches5 = [...testText.matchAll(pattern5)];
console.log('\n模式5 (通用):', matches5.length, '个匹配');
matches5.forEach(m => console.log(`  - ${m[1]} + 动词`));

const end = Date.now();
console.log('\n=== 测试完成 ===');
console.log('总耗时:', end - start, 'ms');

// 提取所有角色
const allMatches = [...matches1, ...matches2, ...matches3, ...matches4, ...matches5];
const characters = [...new Set(allMatches.map(m => m[1]))];
console.log('识别到的角色:', characters);
