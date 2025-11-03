#!/usr/bin/env node

/**
 * Minecraft Image URLs Validation Script
 * 验证minecraft-images.json中的图片URL是否可访问
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// 读取JSON文件
const data = JSON.parse(fs.readFileSync('minecraft-images.json', 'utf8'));

// 收集所有URL
const urlsToCheck = [];
for (const [categoryName, categoryData] of Object.entries(data.categories)) {
  if (categoryData.images) {
    categoryData.images.forEach(image => {
      if (image.url) {
        urlsToCheck.push({
          category: categoryName,
          name: image.name,
          chineseName: image.chineseName,
          url: image.url
        });
      }
    });
  }
}

console.log(`🔍 开始验证 ${urlsToCheck.length} 个图片URL...\n`);

let checkedCount = 0;
let successCount = 0;
let failedCount = 0;
const failedUrls = [];

// 检查单个URL
function checkUrl(item) {
  return new Promise((resolve) => {
    const url = new URL(item.url);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.get(item.url, { timeout: 5000 }, (res) => {
      checkedCount++;
      if (res.statusCode === 200) {
        successCount++;
        console.log(`✅ [${checkedCount}/${urlsToCheck.length}] ${item.name} (${item.chineseName})`);
      } else {
        failedCount++;
        failedUrls.push({...item, status: res.statusCode});
        console.log(`❌ [${checkedCount}/${urlsToCheck.length}] ${item.name} - Status: ${res.statusCode}`);
      }
      resolve();
    });
    
    req.on('error', (error) => {
      checkedCount++;
      failedCount++;
      failedUrls.push({...item, error: error.message});
      console.log(`❌ [${checkedCount}/${urlsToCheck.length}] ${item.name} - Error: ${error.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      req.destroy();
      checkedCount++;
      failedCount++;
      failedUrls.push({...item, error: 'Timeout'});
      console.log(`⏱️  [${checkedCount}/${urlsToCheck.length}] ${item.name} - Timeout`);
      resolve();
    });
  });
}

// 批量检查URL（限制并发数）
async function checkAllUrls() {
  const batchSize = 5; // 每批检查5个URL
  
  for (let i = 0; i < urlsToCheck.length; i += batchSize) {
    const batch = urlsToCheck.slice(i, i + batchSize);
    await Promise.all(batch.map(item => checkUrl(item)));
    
    // 短暂延迟，避免请求过快
    if (i + batchSize < urlsToCheck.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // 输出统计结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果统计:');
  console.log('='.repeat(60));
  console.log(`总计: ${urlsToCheck.length} 个URL`);
  console.log(`成功: ${successCount} 个 (${(successCount/urlsToCheck.length*100).toFixed(1)}%)`);
  console.log(`失败: ${failedCount} 个 (${(failedCount/urlsToCheck.length*100).toFixed(1)}%)`);
  
  if (failedUrls.length > 0) {
    console.log('\n❌ 失败的URL列表:');
    console.log('='.repeat(60));
    failedUrls.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.chineseName})`);
      console.log(`   URL: ${item.url}`);
      console.log(`   原因: ${item.error || 'HTTP ' + item.status}`);
      console.log('');
    });
  }
  
  console.log('='.repeat(60));
  console.log('✨ 验证完成！');
}

// 执行检查
checkAllUrls().catch(console.error);
