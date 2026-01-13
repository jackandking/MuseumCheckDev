#!/usr/bin/env node

/**
 * 博物馆数据收集工具
 * 
 * 功能：
 * 1. 检查KV Store是否已有数据，有则跳过收集
 * 2. 验证图片URL可访问性，无效URL被放弃
 * 3. 博物馆图片有效时自动更新Meta文件
 * 4. 上传完整数据到KV Store（包含3个镇馆之宝）
 * 
 * 用法：
 *   node tools/collect-museum-data.js <museum-id>
 *   node tools/collect-museum-data.js nanjing-museum
 *   node tools/collect-museum-data.js --auto  # 自动选择下一个需要处理的博物馆
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  kvEndpoint: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
  metaPath: path.join(__dirname, '../data/museums-meta.json'),
  templatesDir: path.join(__dirname, 'museum-data-templates'),
  validationTimeout: 8000,
  expireAt: 4866674732
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 验证图片URL是否可访问
 */
async function validateImageUrl(url, timeout = CONFIG.validationTimeout) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 从KV Store检查博物馆数据
 */
async function checkKvStore(museumId) {
  const key = `museum-data-${museumId}`;
  const sortKey = 'museum';
  
  try {
    const url = `${CONFIG.kvEndpoint}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      return JSON.parse(data.value);
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 上传数据到KV Store
 */
async function uploadToKvStore(museumId, museumData) {
  const key = `museum-data-${museumId}`;
  const sortKey = 'museum';
  
  const response = await fetch(CONFIG.kvEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: key,
      sortKey: sortKey,
      value: JSON.stringify(museumData),
      expireAt: CONFIG.expireAt
    })
  });
  
  return response.ok;
}

/**
 * 更新Meta文件中的博物馆图片
 */
async function updateMetaFile(museumId, imageUrl) {
  const museums = JSON.parse(fs.readFileSync(CONFIG.metaPath, 'utf8'));
  
  const museum = museums.find(m => m.id === museumId);
  if (museum) {
    museum.image = imageUrl;
    fs.writeFileSync(CONFIG.metaPath, JSON.stringify(museums, null, 2), 'utf8');
    return true;
  }
  return false;
}

/**
 * 从Meta文件获取博物馆基本信息
 */
function getMuseumFromMeta(museumId) {
  const museums = JSON.parse(fs.readFileSync(CONFIG.metaPath, 'utf8'));
  return museums.find(m => m.id === museumId);
}

/**
 * 查找需要处理的博物馆
 */
function findMuseumsNeedingData() {
  const museums = JSON.parse(fs.readFileSync(CONFIG.metaPath, 'utf8'));
  return museums.filter(m => !m.image || m.image === '');
}

/**
 * 从模板文件加载博物馆数据
 */
function loadFromTemplate(museumId) {
  const templatePath = path.join(CONFIG.templatesDir, `${museumId}.js`);
  
  if (!fs.existsSync(templatePath)) {
    return null;
  }
  
  try {
    delete require.cache[require.resolve(templatePath)];
    const data = require(templatePath);
    return data;
  } catch (error) {
    console.error(`   ❌ 加载模板失败: ${error.message}`);
    return null;
  }
}

/**
 * 列出所有可用的模板文件
 */
function listTemplates() {
  if (!fs.existsSync(CONFIG.templatesDir)) {
    return [];
  }
  
  const files = fs.readdirSync(CONFIG.templatesDir);
  return files
    .filter(f => f.endsWith('.js') && f !== 'example-museum.js')
    .map(f => f.replace('.js', ''));
}

// ============================================================================
// 主流程
// ============================================================================

/**
 * 处理单个博物馆的完整流程
 */
async function processMuseum(museumId, museumData = null) {
  console.log('\n' + '═'.repeat(70));
  console.log(`🏛️  处理博物馆: ${museumId}`);
  console.log('═'.repeat(70) + '\n');
  
  // 步骤1: 检查KV Store
  console.log('🔍 第1步：检查KV Store...');
  const existingData = await checkKvStore(museumId);
  
  if (existingData) {
    console.log('✅ KV Store已有数据，跳过收集步骤');
    console.log(`   名称: ${existingData.name}`);
    console.log(`   镇馆之宝: ${existingData.collections?.length || 0} 个\n`);
    
    // 验证现有图片URL
    if (existingData.image) {
      console.log('🔍 验证现有博物馆图片URL...');
      const isValid = await validateImageUrl(existingData.image);
      
      if (isValid) {
        console.log('✅ 图片URL有效');
        console.log('\n📝 更新Meta文件...');
        await updateMetaFile(museumId, existingData.image);
        console.log('✅ Meta文件已更新！\n');
        
        return { success: true, updated: true, imageUrl: existingData.image };
      } else {
        console.log('❌ 图片URL无效，需要重新准备数据\n');
      }
    } else {
      console.log('⚠️ KV Store数据中没有博物馆图片\n');
    }
    
    return { success: false, reason: '需要重新准备数据' };
  }
  
  console.log('📦 KV Store无数据\n');
  
  // 步骤2: 检查是否提供了博物馆数据或从模板加载
  if (!museumData) {
    console.log('📋 第2步：从模板加载数据...');
    museumData = loadFromTemplate(museumId);
    
    if (!museumData) {
      console.log('⚠️ 未找到模板文件');
      console.log(`💡 请在 ${CONFIG.templatesDir} 创建 ${museumId}.js\n`);
      
      const museum = getMuseumFromMeta(museumId);
      if (museum) {
        console.log('📋 博物馆基本信息（来自Meta）:');
        console.log(`   名称: ${museum.name}`);
        console.log(`   位置: ${museum.location}`);
        console.log(`   标签: ${museum.tags?.join(', ') || '无'}\n`);
      }
      
      return { success: false, reason: '需要创建模板文件' };
    }
    
    console.log('✅ 模板加载成功\n');
  } else {
    console.log('📋 第2步：使用提供的数据...');
    console.log('✅ 数据准备完成\n');
  }
  
  // 步骤3: 验证所有图片URL
  console.log('🔍 第3步：验证图片URL...');
  
  // 验证博物馆图片
  if (museumData.image) {
    console.log(`   博物馆图片: ${museumData.image.substring(0, 60)}...`);
    const museumImageValid = await validateImageUrl(museumData.image);
    
    if (!museumImageValid) {
      console.log('   ❌ 博物馆图片无效，放弃使用');
      museumData.image = '';
    } else {
      console.log('   ✅ 博物馆图片有效');
    }
  } else {
    console.log('   ⚠️ 无博物馆图片');
  }
  
  // 验证镇馆之宝图片
  if (museumData.collections && museumData.collections.length > 0) {
    console.log(`\n   验证 ${museumData.collections.length} 个镇馆之宝图片...`);
    
    for (let i = 0; i < museumData.collections.length; i++) {
      const treasure = museumData.collections[i];
      const isValid = await validateImageUrl(treasure.imageUrl);
      
      if (isValid) {
        console.log(`   ✅ ${i + 1}. ${treasure.name} - 图片有效`);
      } else {
        console.log(`   ❌ ${i + 1}. ${treasure.name} - 图片无效`);
        treasure.imageUrl = '';
      }
    }
  }
  
  console.log();
  
  // 步骤4: 上传到KV Store
  console.log('💾 第4步：上传到KV Store...');
  const uploaded = await uploadToKvStore(museumId, museumData);
  
  if (uploaded) {
    console.log('✅ 上传成功\n');
  } else {
    console.log('❌ 上传失败\n');
    return { success: false, reason: 'KV Store上传失败' };
  }
  
  // 步骤5: 如果博物馆图片有效，更新Meta文件
  if (museumData.image) {
    console.log('📝 第5步：更新Meta文件...');
    const updated = await updateMetaFile(museumId, museumData.image);
    
    if (updated) {
      console.log('✅ Meta文件已更新\n');
    } else {
      console.log('❌ Meta文件更新失败\n');
    }
  } else {
    console.log('⏭️  第5步：跳过Meta更新（无有效图片）\n');
  }
  
  // 完成
  console.log('═'.repeat(70));
  console.log('🎉 流程完成！');
  console.log('═'.repeat(70));
  console.log(`📍 博物馆: ${museumData.name}`);
  console.log(`🏛️  位置: ${museumData.location}`);
  console.log(`🖼️  博物馆图片: ${museumData.image || '无'}`);
  console.log(`🎖️  镇馆之宝: ${museumData.collections?.length || 0} 个`);
  console.log('═'.repeat(70) + '\n');
  
  return { 
    success: true, 
    uploaded: true, 
    imageUrl: museumData.image || null,
    treasures: museumData.collections?.length || 0
  };
}

// ============================================================================
// CLI入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
博物馆数据收集工具

用法：
  node tools/collect-museum-data.js <museum-id>     处理指定博物馆
  node tools/collect-museum-data.js --auto          自动选择下一个博物馆
  node tools/collect-museum-data.js --list          列出需要处理的博物馆

示例：
  node tools/collect-museum-data.js nanjing-museum
  node tools/collect-museum-data.js terracotta-warriors
  node tools/collect-museum-data.js --auto

说明：
  - 此工具会自动检查KV Store是否已有数据
  - 验证所有图片URL的可访问性
  - 如博物馆图片有效，会自动更新Meta文件
  - 需要在 tools/museum-data-templates/ 创建对应的数据模板
    `);
    return;
  }
  
  if (args[0] === '--list') {
    const museums = findMuseumsNeedingData();
    console.log(`\n📊 需要图片的博物馆总数: ${museums.length}\n`);
    
    const templates = listTemplates();
    console.log(`📄 已有模板文件: ${templates.length} 个\n`);
    
    museums.slice(0, 20).forEach((m, i) => {
      const hasTemplate = templates.includes(m.id) ? '✅' : '⚠️ ';
      console.log(`${hasTemplate} ${i + 1}. ${m.name} (${m.location})`);
      console.log(`   ID: ${m.id}\n`);
    });
    
    if (museums.length > 20) {
      console.log(`... 还有 ${museums.length - 20} 个博物馆\n`);
    }
    return;
  }
  
  let museumId;
  
  if (args[0] === '--auto') {
    const museums = findMuseumsNeedingData();
    if (museums.length === 0) {
      console.log('✅ 所有博物馆都已有图片！');
      return;
    }
    museumId = museums[0].id;
    console.log(`🎯 自动选择: ${museums[0].name} (${museums[0].location})`);
  } else {
    museumId = args[0];
  }
  
  // 处理博物馆
  const result = await processMuseum(museumId);
  process.exit(result.success ? 0 : 1);
}

// 执行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  });
}

// 导出函数供其他脚本使用
module.exports = {
  processMuseum,
  validateImageUrl,
  checkKvStore,
  uploadToKvStore,
  updateMetaFile,
  getMuseumFromMeta,
  findMuseumsNeedingData,
  loadFromTemplate,
  listTemplates,
  CONFIG
};
