#!/usr/bin/env node

/**
 * 批量处理博物馆数据的7步法工具
 * 用法: node batch-process-museums.js <博物馆ID列表> [--limit N]
 */

const fs = require('fs');
const fetch = require('node-fetch');

// KV Store 配置
const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const EXPIRY = 4866674732;

// 读取meta文件
const meta = JSON.parse(fs.readFileSync('data/museums-meta.json', 'utf8'));
const metaMap = new Map(meta.map(m => [m.id, m]));

async function validateUrl(url, timeout = 8000) {
  if (!url) return { valid: false, reason: 'empty' };
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, { method: 'HEAD', signal: controller.signal, timeout });
    return { valid: r.status === 200, status: r.status };
  } catch (e) {
    return { valid: false, reason: e.message };
  } finally {
    clearTimeout(id);
  }
}

async function searchImages(keyword, count = 5) {
  try {
    const res = await fetch('https://letmetry.cloud/image/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, count })
    });
    const data = await res.json();
    return data.images || [];
  } catch (e) {
    console.log(`  ⚠️  搜索失败: ${e.message}`);
    return [];
  }
}

async function uploadToKV(key, sortKey, data) {
  try {
    const res = await fetch(KV_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        sortKey,
        value: JSON.stringify(data),
        expireAt: EXPIRY
      })
    });
    return res.status === 200;
  } catch (e) {
    console.log(`  ❌ KV上传失败: ${e.message}`);
    return false;
  }
}

async function checkKVExists(id) {
  try {
    const key = `museum-data-${id}`;
    const sortKey = 'museum';
    const url = `${KV_ENDPOINT}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function processMuseum(museum) {
  console.log(`\n📍 处理: ${museum.name} (${museum.id})`);
  
  // Step 1: 检查KV是否已存在
  const kvExists = await checkKVExists(museum.id);
  if (kvExists) {
    console.log(`  ✅ KV Store 中已存在数据`);
    // 只更新Meta的image字段（如果为空）
    const metaEntry = metaMap.get(museum.id);
    if (metaEntry && !metaEntry.image) {
      console.log(`  ⚠️  Meta缺少image，需要手动补充`);
    }
    return { status: 'skip', reason: 'kv_exists' };
  }
  
  console.log(`  🔍 开始采集数据...`);
  
  // Step 2: 搜索建筑图片 (使用Wikimedia)
  console.log(`  📸 搜索建筑图片...`);
  let buildingUrl = null;
  const buildingSearches = [
    museum.name,
    museum.name + ' building',
    museum.name + ' exterior'
  ];
  
  for (const query of buildingSearches) {
    // 由于Wikimedia工具脚本复杂，这里用简化方法
    // 实际环境中应该调用tools/search-museum-images-wikimedia.js
    console.log(`    尝试关键词: "${query}"`);
  }
  
  // 为了演示，这里返回pending状态
  // 实际需要手动查询或集成Wikimedia API
  console.log(`  ℹ️  建筑图片搜索需要手动验证或使用Wikimedia工具`);
  
  return { status: 'pending', reason: 'requires_manual_image_search' };
}

async function main() {
  const args = process.argv.slice(2);
  let museumIds = [];
  let limit = 10;
  
  // 解析命令行参数
  if (args.includes('--limit')) {
    const idx = args.indexOf('--limit');
    limit = parseInt(args[idx + 1]) || 10;
  }
  
  // 如果没有指定博物馆，选择前N个需要处理的
  if (museumIds.length === 0) {
    const needProcess = meta.filter(m => !m.image || !m.hasCollections);
    museumIds = needProcess.slice(0, limit).map(m => m.id);
    console.log(`\n开始批量处理博物馆 (前${limit}个)\n`);
  }
  
  let successful = 0, skipped = 0, pending = 0;
  
  for (const museumId of museumIds) {
    const museum = metaMap.get(museumId);
    if (!museum) {
      console.log(`❌ 未找到博物馆: ${museumId}`);
      continue;
    }
    
    const result = await processMuseum(museum);
    if (result.status === 'success') successful++;
    else if (result.status === 'skip') skipped++;
    else if (result.status === 'pending') pending++;
    
    // 避免请求过于频繁
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n\n📊 处理总结:`);
  console.log(`  ✅ 成功: ${successful}`);
  console.log(`  ⏭️  跳过: ${skipped}`);
  console.log(`  ⏳ 待验证: ${pending}`);
}

main().catch(console.error);
