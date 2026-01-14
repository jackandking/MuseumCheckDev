#!/usr/bin/env node

/**
 * KV Store 完整数据生成器
 * 
 * 将 meta（基础数据） + collections（扩展数据）合并为 KV 的完整负载
 * 这样打卡页面可以直接读 KV 获得全部信息，无需同时读 meta 和 collections
 * 
 * 用法：
 *   node tools/merge-meta-collections-to-kvstore.js <museumId> [--upload] [--verbose]
 *   node tools/merge-meta-collections-to-kvstore.js <id1,id2,id3> --batch [--upload] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { readFromKVStore, createWriteBackup } = require('../core/kvstore-backup-helper');

const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * 从 meta 读取基础数据
 */
function readMuseumFromMeta(museumId) {
  const metaPath = path.join(__dirname, '../data/museums-meta.json');
  const content = fs.readFileSync(metaPath, 'utf8');
  const museums = JSON.parse(content);
  return museums.find(m => m.id === museumId);
}

/**
 * 获取 collections 数据（这里从样本数据取，实际应从 SAMPLE_COLLECTIONS 或专门的 collections 文件取）
 */
function getCollectionsForMuseum(museumId) {
  const collectionsMap = {
    'forbidden-city': [
      {
        name: '《清明上河图》',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Qingming_Scroll_2008x5605_mt.jpg',
        description: '北宋张择端绘制的社会风俗画，宽25.2厘米，长528.7厘米'
      },
      {
        name: '青花瓷瓶',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Vase_with_cover%2C_Qing_dynasty%2C_Kangxi_period.jpg/640px-Vase_with_cover%2C_Qing_dynasty%2C_Kangxi_period.jpg',
        description: '清代康熙年间制造的精美青花瓷器，反映了当时的工艺水平'
      },
      {
        name: '铜镀金佛像',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Met_07.228.117_view4.jpg',
        description: '明代铜镀金佛像，高约30厘米，工艺精湛'
      }
    ],
    'national-museum': [
      {
        name: '后母戊鼎',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Simuwu_ding.jpg/640px-Simuwu_ding.jpg',
        description: '商代晚期青铜器，中国古代最著名的器物之一'
      },
      {
        name: '人头壶',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Pot_with_human_faces%2C_Yangshao_culture.jpg',
        description: '新石器时代彩陶，距今约7000年'
      },
      {
        name: '唐三彩马',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Tang_Dynasty_tomb_pottery_3_color_horse.jpg',
        description: '唐代陶制骏马，彩釉工艺完美'
      }
    ]
  };
  return collectionsMap[museumId] || [];
}

/**
 * 合并 meta + collections 为完整 KV 负载
 */
function mergeMetaAndCollections(museumId) {
  const meta = readMuseumFromMeta(museumId);
  if (!meta) {
    return null;
  }
  
  const collections = getCollectionsForMuseum(museumId);
  
  return {
    // 基础数据（来自 meta）
    id: meta.id,
    name: meta.name,
    location: meta.location,
    tags: meta.tags || [],
    image: meta.image || '',
    level: meta.level || null,
    hasCollections: collections.length > 0,
    // 扩展数据
    collections: collections,
    // 元数据
    timestamp: new Date().toISOString()
  };
}

/**
 * 上传到 KV Store
 */
async function uploadToKVStore(payload, verbose = false) {
  if (verbose) {
    log(`  📤 上传到 KV Store...`);
  }
  
  const key = `museum-data-${payload.id}`;
  const sortKey = 'museum';
  
  try {
    const response = await fetch(KV_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        sortKey,
        value: JSON.stringify(payload),
        expireAt: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
      })
    });
    
    return {
      ok: response.ok,
      status: response.status,
      text: await response.text()
    };
  } catch (e) {
    return {
      ok: false,
      error: e.message
    };
  }
}

/**
 * 处理单个博物馆
 */
async function processSingleMuseum(museumId, shouldUpload = false, verbose = false) {
  if (verbose) {
    log(`\n📦 处理 ${museumId}...`, 'cyan');
  }
  
  // 合并数据
  const payload = mergeMetaAndCollections(museumId);
  if (!payload) {
    log(`  ❌ 未找到 ${museumId} 的 meta 数据`, 'red');
    return { ok: false, error: 'not_found' };
  }
  
  if (verbose) {
    log(`  ✅ Meta: ${payload.name}`);
    log(`  ✅ Collections: ${payload.collections.length} 件`);
  }
  
  // 可选：上传到 KV
  let uploadResult = { skipped: true };
  if (shouldUpload) {
    uploadResult = await uploadToKVStore(payload, verbose);
    if (uploadResult.ok) {
      log(`  ✅ 已上传到 KV (${uploadResult.status})`, 'green');
      
      // 备份写入操作
      const backupPath = createWriteBackup(museumId, payload, 'merge-meta-collections', false);
      if (verbose) {
        log(`  📁 备份: ${path.basename(backupPath)}`);
      }
    } else {
      log(`  ❌ 上传失败 (${uploadResult.status}): ${uploadResult.text}`, 'red');
    }
  } else {
    if (verbose) {
      log(`  ⏭️  跳过上传（使用 --upload 启用）`, 'gray');
    }
  }
  
  return {
    ok: uploadResult.ok || uploadResult.skipped,
    museumId,
    name: payload.name,
    collections: payload.collections.length,
    uploadResult,
    payload
  };
}

/**
 * 批量处理
 */
async function batchProcess(museumIds, shouldUpload = false, verbose = false) {
  log(`\n📋 批量处理 ${museumIds.length} 个博物馆`, 'cyan');
  
  const results = [];
  for (let i = 0; i < museumIds.length; i++) {
    process.stdout.write(`\r[${i + 1}/${museumIds.length}] `);
    const result = await processSingleMuseum(museumIds[i], shouldUpload, false);
    results.push(result);
    
    // 避免请求过快
    await new Promise(r => setTimeout(r, 300));
  }
  
  process.stdout.write('\r');
  
  // 统计
  const successCount = results.filter(r => r.ok).length;
  const uploadedCount = results.filter(r => r.uploadResult && r.uploadResult.ok).length;
  
  log(`\n📈 结果汇总:`, 'cyan');
  log(`  ✅ 成功合并: ${successCount}/${museumIds.length}`);
  log(`  ✅ 成功上传: ${uploadedCount}/${successCount} (--upload 时)`);
  
  if (verbose) {
    log(`\n📋 详细列表:`, 'cyan');
    results.forEach(r => {
      const status = r.ok ? '✅' : '❌';
      log(`  ${status} ${r.name || r.museumId} - ${r.collections} 件藏品`);
    });
  }
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('\n📦 KV Store 完整数据生成器\n', 'cyan');
    log('用途：将 meta（基础数据）+ collections（镇馆之宝）合并为完整 KV 负载', 'yellow');
    log('这样打卡页面可以直接读 KV 获得全部信息\n', 'yellow');
    log('用法:', 'blue');
    log('  单个博物馆:');
    log('    node tools/merge-meta-collections-to-kvstore.js forbidden-city');
    log('    node tools/merge-meta-collections-to-kvstore.js forbidden-city --upload');
    log('\n  批量处理:');
    log('    node tools/merge-meta-collections-to-kvstore.js forbidden-city,national-museum --batch');
    log('    node tools/merge-meta-collections-to-kvstore.js forbidden-city,national-museum --batch --upload');
    log('\n  选项:');
    log('    --upload   : 上传到 KV Store（默认仅合并，不上传）');
    log('    --verbose  : 详细输出');
    log('    --batch    : 批量模式（处理逗号分隔的 ID 列表）\n');
    process.exit(0);
  }
  
  const isBatch = args.includes('--batch');
  const shouldUpload = args.includes('--upload');
  const verbose = args.includes('--verbose');
  
  const firstArg = args[0];
  const museumIds = isBatch ? firstArg.split(',').map(s => s.trim()) : [firstArg];
  
  if (isBatch) {
    await batchProcess(museumIds, shouldUpload, verbose);
  } else {
    const result = await processSingleMuseum(museumIds[0], shouldUpload, true);
    
    log(`\n${result.ok ? '✅ 成功' : '❌ 失败'}`, result.ok ? 'green' : 'red');
    
    if (result.payload && verbose) {
      log(`\n📋 完整 KV 负载预览:`, 'cyan');
      console.log(JSON.stringify(result.payload, null, 2));
    }
  }
}

main().catch(e => {
  log(`\n❌ 错误: ${e.message}`, 'red');
  process.exit(1);
});
