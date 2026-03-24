#!/usr/bin/env node
/**
 * KV Store 只读备份脚本
 * 
 * 仅从 KV Store 读取数据并保存到本地，不执行任何写操作
 * 用于安全备份数据，防止覆盖丢失
 * 
 * 使用方法: node scripts/backup-kvstore-readonly.js
 */

const fs = require('fs');
const path = require('path');

// KV Store 配置 (只读)
const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const BACKUP_DIR = path.join(__dirname, '../../backup');

// 要备份的关键 keys
const KEYS_TO_BACKUP = [
  // 排行榜数据
  { key: 'museumcheck-leaderboard', sortKey: '*', description: '排行榜数据' },
  // 可以添加更多 keys
];

// 从 museums-meta.json 获取所有博物馆 ID
function getMuseumIds() {
  const metaPath = path.join(__dirname, '../../data/museums-meta.json');
  if (!fs.existsSync(metaPath)) {
    console.error('❌ museums-meta.json 不存在');
    return [];
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  return meta.map(m => m.id);
}

// 确保备份目录存在
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// 生成时间戳
function getTimestamp() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

// 只读: 从 KV Store 获取数据
async function fetchFromKV(key, sortKey = 'default') {
  const url = `${KV_ENDPOINT}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.status === 404) {
      return { ok: false, status: 404, data: null };
    }
    
    if (!response.ok) {
      return { ok: false, status: response.status, data: null };
    }
    
    const data = await response.json();
    return { ok: true, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, error: error.message, data: null };
  }
}

// 备份博物馆数据
async function backupMuseumData(museumIds) {
  console.log(`\n📦 开始备份博物馆数据 (共 ${museumIds.length} 个)...`);
  
  const results = {
    success: [],
    notFound: [],
    failed: []
  };
  
  const allData = {};
  
  for (let i = 0; i < museumIds.length; i++) {
    const museumId = museumIds[i];
    const key = `museum-data-${museumId}`;
    
    process.stdout.write(`\r  [${i + 1}/${museumIds.length}] 读取 ${museumId}...`);
    
    const result = await fetchFromKV(key, 'museum');
    
    if (result.ok && result.data) {
      results.success.push(museumId);
      allData[museumId] = result.data;
    } else if (result.status === 404) {
      results.notFound.push(museumId);
    } else {
      results.failed.push({ museumId, error: result.error || `HTTP ${result.status}` });
    }
    
    // 避免请求过快
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n');
  
  return { results, allData };
}

// 备份排行榜数据
async function backupLeaderboard() {
  console.log('📊 备份排行榜数据...');
  
  const result = await fetchFromKV('museumcheck-leaderboard', '*');
  
  if (result.ok && result.data) {
    console.log('  ✅ 排行榜数据获取成功');
    return result.data;
  } else {
    console.log(`  ⚠️ 排行榜数据获取失败: ${result.error || `HTTP ${result.status}`}`);
    return null;
  }
}

// 保存备份到文件
function saveBackup(filename, data) {
  ensureBackupDir();
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  💾 已保存: ${filepath}`);
  return filepath;
}

// 主函数
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  KV Store 只读备份工具');
  console.log('  ⚠️  此脚本仅读取数据，不会写入 KV Store');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const timestamp = getTimestamp();
  const backupSummary = {
    timestamp: new Date().toISOString(),
    backupType: 'readonly',
    files: []
  };
  
  // 1. 备份博物馆数据
  const museumIds = getMuseumIds();
  if (museumIds.length > 0) {
    const { results, allData } = await backupMuseumData(museumIds);
    
    console.log(`  ✅ 成功: ${results.success.length}`);
    console.log(`  ⚪ 未找到: ${results.notFound.length}`);
    console.log(`  ❌ 失败: ${results.failed.length}`);
    
    if (Object.keys(allData).length > 0) {
      const museumFile = `kvstore-museums-backup-${timestamp}.json`;
      saveBackup(museumFile, {
        backupTime: new Date().toISOString(),
        type: 'museum-data',
        count: Object.keys(allData).length,
        successList: results.success,
        notFoundList: results.notFound,
        failedList: results.failed,
        data: allData
      });
      backupSummary.files.push(museumFile);
    }
  }
  
  // 2. 备份排行榜数据
  const leaderboardData = await backupLeaderboard();
  if (leaderboardData) {
    const leaderboardFile = `kvstore-leaderboard-backup-${timestamp}.json`;
    saveBackup(leaderboardFile, {
      backupTime: new Date().toISOString(),
      type: 'leaderboard',
      data: leaderboardData
    });
    backupSummary.files.push(leaderboardFile);
  }
  
  // 3. 保存备份摘要
  const summaryFile = `kvstore-backup-summary-${timestamp}.json`;
  saveBackup(summaryFile, backupSummary);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ 备份完成！');
  console.log(`  📁 备份目录: ${BACKUP_DIR}`);
  console.log('  ⚠️  此操作未对 KV Store 进行任何写入');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// 运行
main().catch(err => {
  console.error('备份失败:', err);
  process.exit(1);
});
