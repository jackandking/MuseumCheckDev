#!/usr/bin/env node
/**
 * KV Store 备份辅助工具
 *
 * 提供从 KV Store 读取数据并创建本地备份的工具函数。
 * 被 merge-meta-collections-to-kvstore.js 和 kvstore-backup-cli.js 等脚本使用。
 */

const fs = require('fs');
const path = require('path');

const KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const BACKUP_DIR = path.join(__dirname, '../../backup');

/**
 * 确保备份目录存在
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * 从 KV Store 读取单个博物馆数据
 * @param {string} museumId
 * @returns {Promise<Object|null>}
 */
async function readFromKVStore(museumId) {
  try {
    const key = `museum-data-${museumId}`;
    const sortKey = 'museum';
    const url = `${KV_ENDPOINT}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      console.error(`Failed to read from KV store for ${museumId}: HTTP ${response.status}`);
      return null;
    }
    const result = await response.json();
    if (!result || !result.value) return null;
    return JSON.parse(result.value);
  } catch (e) {
    console.error(`Error reading from KV store for ${museumId}:`, e.message);
    return null;
  }
}

/**
 * 批量从 KV Store 读取博物馆数据
 * @param {string[]} museumIds
 * @returns {Promise<Object>} Map of museumId -> data (or null)
 */
async function batchReadFromKVStore(museumIds) {
  const results = {};
  for (const id of museumIds) {
    results[id] = await readFromKVStore(id);
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

/**
 * 创建写入操作的本地备份
 * @param {string} museumId
 * @param {Object} payload
 * @param {string} source - 来源标识（如 'merge-meta-collections'）
 * @param {boolean} dryRun - 是否为干跑（不实际写入）
 * @returns {string} 备份文件路径
 */
function createWriteBackup(museumId, payload, source = 'unknown', dryRun = false) {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `write-${source}-${museumId}-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  const backup = {
    museumId,
    source,
    dryRun,
    timestamp: new Date().toISOString(),
    payload
  };
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');
  return filepath;
}

/**
 * 列出某个博物馆的所有本地备份
 * @param {string} museumId
 * @returns {string[]} 备份文件路径列表
 */
function listBackupsForMuseum(museumId) {
  ensureBackupDir();
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.includes(museumId) && f.endsWith('.json'))
    .map(f => path.join(BACKUP_DIR, f))
    .sort();
}

/**
 * 获取某个博物馆最新的本地备份内容
 * @param {string} museumId
 * @returns {Object|null}
 */
function getLatestBackup(museumId) {
  const files = listBackupsForMuseum(museumId);
  if (files.length === 0) return null;
  try {
    return JSON.parse(fs.readFileSync(files[files.length - 1], 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * 生成备份状态报告
 * @returns {Object}
 */
function generateBackupReport() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
  const museumIds = new Set();
  files.forEach(f => {
    // Pattern: write-<source>-<museumId>-<timestamp>.json
    // Extract museumId by removing "write-" prefix, known source patterns, and timestamp suffix
    const m = f.match(/^write-[^-]+-([a-z0-9][a-z0-9-]*[a-z0-9])-\d{4}-/);
    if (m) museumIds.add(m[1]);
  });
  return {
    totalFiles: files.length,
    museums: Array.from(museumIds),
    backupDir: BACKUP_DIR
  };
}

/**
 * 清理超过指定天数的旧备份
 * @param {number} days
 * @returns {number} 删除的文件数量
 */
function cleanupOldBackups(days = 30) {
  ensureBackupDir();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let deleted = 0;
  fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).forEach(f => {
    const stat = fs.statSync(path.join(BACKUP_DIR, f));
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
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
