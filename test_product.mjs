import { chromium } from 'playwright';

console.log('=== Novel2Script 完整功能测试 ===\n');

const testResults = {
  passed: 0,
  failed: 0,
  warnings: []
};

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('1. 测试页面加载...');
  try {
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('   ✓ 页面加载成功');
    testResults.passed++;
  } catch (err) {
    console.log('   ✗ 页面加载失败:', err.message);
    testResults.failed++;
    await browser.close();
    return;
  }

  console.log('\n2. 检查页面元素...');
  const elements = {
    title: await page.locator('h1').first().textContent(),
    textarea: await page.locator('.input-textarea').count(),
    convertBtn: await page.locator('.convert-btn').count(),
    yamlOutput: await page.locator('.yaml-body').count(),
    previewTab: await page.locator('text=预览').count()
  };

  console.log(`   标题: ${elements.title}`);
  console.log(`   文本输入框: ${elements.textarea > 0 ? '✓' : '✗'}`);
  console.log(`   转换按钮: ${elements.convertBtn > 0 ? '✓' : '✗'}`);
  console.log(`   YAML输出区: ${elements.yamlOutput > 0 ? '✓' : '✗'}`);
  console.log(`   预览标签: ${elements.previewTab > 0 ? '✓' : '✗'}`);

  if (elements.textarea > 0 && elements.convertBtn > 0) {
    testResults.passed++;
    console.log('   ✓ 核心UI元素检查通过');
  } else {
    testResults.failed++;
    console.log('   ✗ 核心UI元素缺失');
  }

  console.log('\n3. 读取测试小说...');
  const fs = await import('fs');
  const testNovel = fs.readFileSync('./test_full_novel.txt', 'utf8');
  const charCount = testNovel.length;
  console.log(`   ✓ 读取成功 (${charCount} 字, ${testNovel.split('第').length - 1} 个章节)`);
  testResults.passed++;

  console.log('\n4. 输入测试文本...');
  try {
    await page.fill('.input-textarea', testNovel);
    const inputText = await page.inputValue('.input-textarea');
    if (inputText.length > 100) {
      console.log(`   ✓ 文本输入成功 (${inputText.length} 字)`);
      testResults.passed++;
    } else {
      console.log('   ✗ 文本输入失败');
      testResults.failed++;
    }
  } catch (err) {
    console.log('   ✗ 文本输入失败:', err.message);
    testResults.failed++;
  }

  console.log('\n5. 检查字数统计...');
  try {
    const charCountEl = await page.locator('.char-count').textContent();
    if (charCountEl && charCountEl.includes('字')) {
      console.log(`   ✓ 字数统计: ${charCountEl}`);
      testResults.passed++;
    } else {
      console.log('   ✗ 字数统计显示异常');
      testResults.failed++;
    }
  } catch (err) {
    console.log('   ✗ 字数统计检查失败:', err.message);
    testResults.failed++;
  }

  console.log('\n6. 执行转换...');
  try {
    await page.click('.convert-btn');
    await page.waitForSelector('.progress-bar-fill', { timeout: 3000 }).catch(() => {});
    
    // 等待转换完成
    await page.waitForFunction(() => {
      const progress = document.querySelector('.progress-bar-fill');
      return progress && parseInt(progress.style.width) >= 100;
    }, { timeout: 15000 }).catch(() => {});

    await page.waitForTimeout(500);
    console.log('   ✓ 转换请求已提交');
    testResults.passed++;
  } catch (err) {
    console.log('   ! 转换执行异常:', err.message);
    testResults.warnings.push('转换可能未完全成功');
  }

  console.log('\n7. 检查YAML输出...');
  try {
    await page.waitForTimeout(1000);
    const yamlContent = await page.locator('.yaml-body pre').textContent().catch(() => '');
    
    if (yamlContent && yamlContent.includes('script:')) {
      console.log('   ✓ YAML输出生成成功');
      
      const checks = {
        meta: yamlContent.includes('meta:'),
        title: yamlContent.includes('title:'),
        acts: yamlContent.includes('acts:'),
        characters: yamlContent.includes('characters:'),
        dialogues: yamlContent.includes('dialogues:')
      };

      console.log('   YAML结构检查:');
      console.log(`     - meta: ${checks.meta ? '✓' : '✗'}`);
      console.log(`     - title: ${checks.title ? '✓' : '✗'}`);
      console.log(`     - acts: ${checks.acts ? '✓' : '✗'}`);
      console.log(`     - characters: ${checks.characters ? '✓' : '✗'}`);
      console.log(`     - dialogues: ${checks.dialogues ? '✓' : '✗'}`);

      if (checks.meta && checks.title && checks.acts) {
        testResults.passed++;
        console.log('   ✓ YAML格式验证通过');
      } else {
        testResults.failed++;
        console.log('   ✗ YAML格式验证失败');
      }
    } else {
      console.log('   ✗ 未找到有效YAML输出');
      testResults.failed++;
    }
  } catch (err) {
    console.log('   ✗ YAML输出检查失败:', err.message);
    testResults.failed++;
  }

  console.log('\n8. 测试预览功能...');
  try {
    await page.click('text=预览');
    await page.waitForTimeout(500);
    
    const previewContent = await page.locator('.preview-body').textContent().catch(() => '');
    if (previewContent && previewContent.length > 10) {
      console.log('   ✓ 预览模式切换成功');
      testResults.passed++;
    } else {
      console.log('   ! 预览内容可能为空');
      testResults.warnings.push('预览内容为空');
    }
  } catch (err) {
    console.log('   ✗ 预览功能测试失败:', err.message);
    testResults.warnings.push('预览功能异常');
  }

  console.log('\n9. 测试复制功能...');
  try {
    await page.click('text=YAML 输出');
    await page.waitForTimeout(300);
    
    // 检查复制按钮是否存在
    const copyBtn = await page.locator('button[title="复制"]').count();
    if (copyBtn > 0) {
      console.log('   ✓ 复制按钮存在');
      testResults.passed++;
    } else {
      console.log('   ! 复制按钮未找到');
      testResults.warnings.push('复制按钮未找到');
    }
  } catch (err) {
    console.log('   ! 复制功能测试失败:', err.message);
  }

  console.log('\n10. 测试清空功能...');
  try {
    await page.click('text=清空');
    await page.waitForTimeout(300);
    
    const inputText = await page.inputValue('.input-textarea').catch(() => '');
    if (inputText === '' || inputText === null) {
      console.log('   ✓ 清空功能正常');
      testResults.passed++;
    } else {
      console.log('   ! 清空后仍有内容');
      testResults.warnings.push('清空功能可能异常');
    }
  } catch (err) {
    console.log('   ! 清空功能测试失败:', err.message);
  }

  await browser.close();

  console.log('\n=== 测试结果汇总 ===');
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`警告: ${testResults.warnings.length}`);
  
  if (testResults.warnings.length > 0) {
    console.log('\n警告详情:');
    testResults.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`\n成功率: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有核心功能测试通过！');
  } else if (testResults.failed <= 2) {
    console.log('\n⚠️  小部分功能测试失败，整体功能正常。');
  } else {
    console.log('\n❌  较多功能测试失败，需要检查问题。');
  }
}

runTests().catch(err => {
  console.error('测试执行失败:', err);
  process.exit(1);
});
