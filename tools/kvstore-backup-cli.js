#!/usr/bin/env node

/**
 * KV Store 备份管理 CLI
 * 
 * 用法：
 *   node tools/kvstore-backup-cli.js read <museumId>
 *   node tools/kvstore-backup-cli.js batch <id1,id2,id3>
 *   node tools/kvstore-backup-cli.js list <museumId>
 *   node tools/kvstore-backup-cli.js latest <museumId>
 *   node tools/kvstore-backup-cli.js report
 *   node tools/kvstore-backup-cli.js cleanup [days]
 */

const { 
  readFromKVStore,
  batchReadFromKVStore,
  listBackupsForMuseum,
  getLatestBackup,
  generateBackupReport,
  cleanupOldBackups,
  BACKUP_DIR
} = require('../core/kvstore-backup-helper');

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function main() {
  const [, , cmd, ...args] = process.argv;
  
  if (!cmd) {
    log('\n📦 KV Store 备份管理工具\n', 'cyan');
    log('用法:', 'yellow');
    log('  读取单个博物馆: node tools/kvstore-backup-cli.js read <museumId>');
    log('  批量读取:     node tools/kvstore-backup-cli.js batch <id1,id2,id3>');
    log('  列出备份:     node tools/kvstore-backup-cli.js list <museumId>');
    log('  获取最新备份: node tools/kvstore-backup-cli.js latest <museumId>');
    log('  统计报告:     node tools/kvstore-backup-cli.js report');
    log('  清理旧备份:   node tools/kvstore-backup-cli.js cleanup [days]');
    log('\n备份目录: ' + BACKUP_DIR + '\n', 'gray');
    process.exit(0);
  }
  
  switch (cmd) {
    case 'read': {
      const museumId = args[0];
      if (!museumId) {
        log('❌ 请指定博物馆 ID', 'red');
        process.exit(1);
      }
      
      log(`\n📖 读取 ${museumId}...\n`, 'cyan');
      const result = await readFromKVStore(museumId, { backup: true, verbose: true });
      
      if (result.ok) {
        log('\n✅ 读取成功', 'green');
        if (result.data.value) {
          try {
            const val = typeof result.data.value === 'string' ? JSON.parse(result.data.value) : result.data.value;
            log(`   博物馆: ${val.name || '未知'}`);
            log(`   地点: ${val.location || '未知'}`);
            if (val.collections && Array.isArray(val.collections)) {
              log(`   藏品: ${val.collections.length} 件`);
            }
          } catch {}
        }
      } else {
        log('\n❌ 读取失败: ' + result.status, 'red');
      }
      
      if (result.backupPath) {
        log(`\n📁 备份已保存:`, 'green');
        log(`   ${path.relative(process.cwd(), result.backupPath)}`);
      }
      break;
    }
    
    case 'batch': {
      const ids = args[0].split(',').map(s => s.trim());
      log(`\n📊 批量读取 ${ids.length} 个博物馆...\n`, 'cyan');
      const result = await batchReadFromKVStore(ids, { verbose: true });
      
      log(`\n📈 结果汇总`, 'cyan');
      log(`✅ 成功: ${result.successCount}`);
      log(`❌ 失败: ${result.failureCount}`);
      log(`📁 备份目录: ${result.backupDir}`);
      break;
    }
    
    case 'list': {
      const museumId = args[0];
      if (!museumId) {
        log('❌ 请指定博物馆 ID', 'red');
        process.exit(1);
      }
      
      const backups = listBackupsForMuseum(museumId);
      log(`\n📋 ${museumId} 的备份文件 (${backups.length} 个)\n`, 'cyan');
      
      if (backups.length === 0) {
        log('  (无备份)', 'gray');
      } else {
        backups.forEach((f, i) => {
          const stat = fs.statSync(f);
          const size = (stat.size / 1024).toFixed(1);
          log(`  ${i + 1}. ${path.basename(f)} (${size}KB)`);
        });
      }
      break;
    }
    
    case 'latest': {
      const museumId = args[0];
      if (!museumId) {
        log('❌ 请指定博物馆 ID', 'red');
        process.exit(1);
      }
      
      const backup = getLatestBackup(museumId, 'read');
      if (!backup) {
        log(`❌ 未找到 ${museumId} 的备份`, 'red');
        process.exit(1);
      }
      
      log(`\n📄 ${museumId} 的最新备份\n`, 'cyan');
      log(`时间: ${backup.timestamp}`);
      log(`状态: ${backup.status} ${backup.ok ? '✅' : '❌'}`);
      
      if (backup.responseData && backup.responseData.value) {
        try {
          const val = typeof backup.responseData.value === 'string' 
            ? JSON.parse(backup.responseData.value) 
            : backup.responseData.value;
          log(`\n📋 数据预览:`);
          log(`  ID: ${val.id}`);
          log(`  名称: ${val.name}`);
          log(`  地点: ${val.location}`);
          if (val.image) log(`  建筑图: ${val.image.substring(0, 60)}...`);
          if (val.collections && Array.isArray(val.collections)) {
            log(`  藏品: ${val.collections.length} 件`);
            val.collections.forEach((c, i) => {
              log(`    ${i + 1}. ${c.name}`);
            });
          }
        } catch {}
      }
      break;
    }
    
    case 'report': {
      const stats = generateBackupReport();
      log(`\n📊 备份统计报告\n`, 'cyan');
      log(`总备份数: ${stats.totalBackups}`);
      log(`\n按操作分类:`);
      log(`  读取 (read): ${stats.byOperation.read}`);
      log(`  写入 (write): ${stats.byOperation.write}`);
      log(`  检查 (check): ${stats.byOperation.check}`);
      
      log(`\n按博物馆分类 (前 10):`, 'yellow');
      Object.entries(stats.byMuseum)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([museumId, count]) => {
          log(`  ${museumId}: ${count} 个备份`);
        });
      
      log(`\n📁 备份存储位置: ${BACKUP_DIR}\n`, 'gray');
      break;
    }
    
    case 'cleanup': {
      const daysOld = parseInt(args[0]) || 7;
      log(`\n🧹 清理 ${daysOld} 天前的备份...\n`, 'cyan');
      
      const deleted = cleanupOldBackups(daysOld);
      log(`✅ 已删除 ${deleted} 个旧备份文件`, 'green');
      break;
    }
    
    default:
      log(`❌ 未知命令: ${cmd}`, 'red');
      process.exit(1);
  }
}

main().catch(e => {
  log(`\n❌ 错误: ${e.message}`, 'red');
  process.exit(1);
});
