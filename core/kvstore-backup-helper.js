/**
 * KV Store 读取备份助手
 * 
 * 每次从 KV Store 读取博物馆数据时，自动在 backup/ 目录保存一份副本
 * 便于追踪数据变化和防止数据丢失
 */

const fs = require('fs');
const path = require('path');

const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const BACKUP_DIR = path.join(__dirname, '../backup');

/**
 * 确保 backup 目录存在
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * 生成备份文件名
 * @param {string} museumId - 博物馆 ID
 * @param {string} operation - 操作类型 ('read'|'write'|'check')
 * @returns {string} 文件名
 */
function generateBackupFilename(museumId, operation = 'read') {
  const timestamp = new Date().toISOString().split('T').join('_').slice(0, 19);
  return `kvstore-${operation}-${museumId}-${timestamp}.json`;
}

/**
 * 从 KV Store 读取博物馆数据，并自动备份
 * @param {string} museumId - 博物馆 ID
 * @param {Object} options - 选项
 * @param {boolean} options.backup - 是否备份（默认 true）
 * @param {boolean} options.verbose - 是否打印日志（默认 false）
 * @returns {Promise<Object>} { ok, status, data, backupPath }
 */
async function readFromKVStore(museumId, options = {}) {
  const { backup = true, verbose = false } = options;
  const key = `museum-data-${museumId}`;
  const sortKey = 'museum';
  
  const url = `${KV_ENDPOINT}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
  
  if (verbose) {
    console.log(`[KV Read] 正在读取 ${museumId}...`);
    console.log(`  URL: ${url.substring(0, 80)}...`);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    
    const result = {
      ok: response.ok,
      status: response.status,
      data,
      backupPath: null
    };
    
    // 备份响应
    if (backup) {
      ensureBackupDir();
      const filename = generateBackupFilename(museumId, 'read');
      const filepath = path.join(BACKUP_DIR, filename);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        museumId,
        operation: 'read',
        status: response.status,
        ok: response.ok,
        responseData: data
      };
      
      fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
      result.backupPath = filepath;
      
      if (verbose) {
        console.log(`  ✅ 已保存备份: ${path.basename(filepath)}`);
      }
    }
    
    if (verbose) {
      console.log(`  状态: ${response.status} ${response.ok ? 'OK' : 'FAIL'}`);
    }
    
    return result;
  } catch (error) {
    if (verbose) {
      console.error(`  ❌ 错误: ${error.message}`);
    }
    return {
      ok: false,
      status: 0,
      error: error.message,
      backupPath: null
    };
  }
}

/**
 * 批量读取多个博物馆数据并备份
 * @param {string[]} museumIds - 博物馆 ID 列表
 * @param {Object} options - 选项
 * @returns {Promise<Object>} { results, successCount, failureCount, backupDir }
 */
async function batchReadFromKVStore(museumIds, options = {}) {
  const { verbose = false } = options;
  
  if (verbose) {
    console.log(`\n[KV Batch Read] 开始读取 ${museumIds.length} 个博物馆...`);
  }
  
  const results = {};
  let successCount = 0, failureCount = 0;
  
  for (const museumId of museumIds) {
    const result = await readFromKVStore(museumId, { backup: true, verbose });
    results[museumId] = result;
    if (result.ok) successCount++;
    else failureCount++;
    
    // 避免请求过快
    await new Promise(r => setTimeout(r, 300));
  }
  
  if (verbose) {
    console.log(`\n[KV Batch Read] 完成: ${successCount} 成功，${failureCount} 失败`);
  }
  
  return {
    results,
    successCount,
    failureCount,
    backupDir: BACKUP_DIR
  };
}

/**
 * 在 KV Store 写入后，自动备份（用于追踪写入历史）
 * @param {string} museumId - 博物馆 ID
 * @param {Object} payload - 写入的数据
 * @param {string} operation - 操作描述
 * @param {boolean} verbose - 是否打印日志
 */
function createWriteBackup(museumId, payload, operation = 'manual', verbose = false) {
  ensureBackupDir();
  const filename = generateBackupFilename(museumId, 'write');
  const filepath = path.join(BACKUP_DIR, filename);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    museumId,
    operation: `write-${operation}`,
    payloadData: payload
  };
  
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
  
  if (verbose) {
    console.log(`  📝 已保存写入备份: ${path.basename(filepath)}`);
  }
  
  return filepath;
}

/**
 * 列出某个博物馆的所有备份文件
 * @param {string} museumId - 博物馆 ID
 * @returns {string[]} 备份文件路径列表
 */
function listBackupsForMuseum(museumId) {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR);
  return files
    .filter(f => f.includes(`-${museumId}-`))
    .map(f => path.join(BACKUP_DIR, f))
    .sort()
    .reverse(); // 最新的在前
}

/**
 * 获取最新的某个博物馆的备份
 * @param {string} museumId - 博物馆 ID
 * @param {string} type - 备份类型 ('read'|'write'|'check')
 * @returns {Object|null} 备份数据，如果不存在返回 null
 */
function getLatestBackup(museumId, type = 'read') {
  const backups = listBackupsForMuseum(museumId);
  const typeBackups = backups.filter(f => f.includes(`-${type}-`));
  
  if (typeBackups.length === 0) return null;
  
  const content = fs.readFileSync(typeBackups[0], 'utf8');
  return JSON.parse(content);
}

/**
 * 生成备份汇总报告
 * @returns {Object} 备份统计信息
 */
function generateBackupReport() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('kvstore-'));
  
  const grouped = {};
  const stats = {
    totalBackups: files.length,
    byOperation: { read: 0, write: 0, check: 0 },
    byMuseum: {}
  };
  
  files.forEach(f => {
    const match = f.match(/kvstore-(read|write|check)-(.+?)-\d/);
    if (match) {
      const [, op, museumId] = match;
      stats.byOperation[op]++;
      if (!stats.byMuseum[museumId]) stats.byMuseum[museumId] = 0;
      stats.byMuseum[museumId]++;
    }
  });
  
  return stats;
}

/**
 * 清理超过 N 天的备份（防止占用过多空间）
 * @param {number} daysOld - 超过多少天的备份要删除（默认 7 天）
 * @returns {number} 删除的文件数
 */
function cleanupOldBackups(daysOld = 7) {
  ensureBackupDir();
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  const files = fs.readdirSync(BACKUP_DIR);
  
  let deleted = 0;
  files.forEach(f => {
    const filepath = path.join(BACKUP_DIR, f);
    const stat = fs.statSync(filepath);
    if (stat.mtimeMs < cutoffTime) {
      fs.unlinkSync(filepath);
      deleted++;
    }
  });
  
  return deleted;
}

module.exports = {
  readFromKVStore,
  batchReadFromKVStore,
  createWriteBackup,
  listBackupsForMuseum,
  getLatestBackup,
  generateBackupReport,
  cleanupOldBackups,
  BACKUP_DIR
};
