#!/usr/bin/env node

/**
 * 快速为博物馆上传KV和更新Meta
 * 用法: node quick-museum-upload.js <museum-id> "<building-url>" "<treasure1-url>|<treasure1-name>|<treasure1-desc>" ...
 */

const fs = require('fs');
const https = require('https');

const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const EXPIRY = 4866674732;

function httpsPost(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function uploadMuseumData(museumId, name, location, buildingUrl, treasures) {
  console.log(`\n📤 上传KV数据: ${name}`);
  
  const kvData = {
    id: museumId,
    name,
    location,
    image: buildingUrl,
    collections: treasures.map(t => ({
      name: t.name,
      imageUrl: t.imageUrl,
      description: t.description
    }))
  };
  
  const result = await httpsPost(KV_ENDPOINT, {
    key: `museum-data-${museumId}`,
    sortKey: 'museum',
    value: JSON.stringify(kvData),
    expireAt: EXPIRY
  });
  
  console.log(`  ${result.status === 200 ? '✅' : '❌'} Status: ${result.status}`);
  return result.status === 200;
}

function updateMeta(museumId, buildingUrl) {
  console.log(`\n📝 更新Meta: ${museumId}`);
  
  const meta = JSON.parse(fs.readFileSync('data/museums-meta.json', 'utf8'));
  const idx = meta.findIndex(m => m.id === museumId);
  
  if (idx >= 0) {
    meta[idx].image = buildingUrl;
    meta[idx].hasCollections = true;
    fs.writeFileSync('data/museums-meta.json', JSON.stringify(meta, null, 2));
    console.log(`  ✅ Meta已更新`);
    return true;
  } else {
    console.log(`  ❌ 未找到博物馆`);
    return false;
  }
}

// 导出函数供外部调用
module.exports = { uploadMuseumData, updateMeta };

// 如果直接运行此脚本
if (require.main === module) {
  console.log('此脚本用于导入其他模块，请使用提供的API');
}
