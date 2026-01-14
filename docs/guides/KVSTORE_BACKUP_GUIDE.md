# KV Store 备份系统

## 概述

自动在每次从 KV Store 读取或写入博物馆数据时，在 `backup/` 目录保存副本。防止数据丢失，便于追踪数据变化历史。

## 核心模块

### `core/kvstore-backup-helper.js`

提供以下 API：

```javascript
const {
  readFromKVStore,      // 读取 + 自动备份
  batchReadFromKVStore, // 批量读取 + 备份
  createWriteBackup,    // 写入备份（在执行 POST 之后调用）
  listBackupsForMuseum, // 列出某博物馆的所有备份
  getLatestBackup,      // 获取最新备份
  generateBackupReport, // 统计报告
  cleanupOldBackups     // 清理旧备份
} = require('./core/kvstore-backup-helper');
```

## CLI 工具

### `tools/kvstore-backup-cli.js`

快速命令行工具，无需编写代码：

```bash
# 读取单个博物馆并备份
node tools/kvstore-backup-cli.js read forbidden-city

# 批量读取多个博物馆
node tools/kvstore-backup-cli.js batch forbidden-city,national-museum,shanghai-museum

# 列出某博物馆的所有备份
node tools/kvstore-backup-cli.js list forbidden-city

# 获取最新备份内容
node tools/kvstore-backup-cli.js latest forbidden-city

# 查看备份统计
node tools/kvstore-backup-cli.js report

# 清理 7 天前的备份（防止占用空间）
node tools/kvstore-backup-cli.js cleanup 7
```

## 备份文件格式

备份文件命名规范：

```
kvstore-{operation}-{museumId}-{timestamp}.json
```

例如：
- `kvstore-read-forbidden-city-2026-01-14_05:18:23.json` - 读取操作
- `kvstore-write-forbidden-city-2026-01-14_05:19:45.json` - 写入操作

### 读取备份内容

```json
{
  "timestamp": "2026-01-14T05:18:23.000Z",
  "museumId": "forbidden-city",
  "operation": "read",
  "status": 200,
  "ok": true,
  "responseData": {
    "key": "museum-data-forbidden-city",
    "value": "{...JSON...}",
    "sortKey": "museum",
    ...
  }
}
```

### 写入备份内容

```json
{
  "timestamp": "2026-01-14T05:19:45.000Z",
  "museumId": "forbidden-city",
  "operation": "write-7steps-process",
  "payloadData": {
    "id": "forbidden-city",
    "name": "故宫博物院",
    "location": "北京",
    "image": "https://...",
    "collections": [
      {
        "name": "《清明上河图》",
        "imageUrl": "https://...",
        "description": "..."
      },
      ...
    ]
  }
}
```

## 集成到开发脚本

### 在自己的脚本中使用

```javascript
const { readFromKVStore, createWriteBackup } = require('./core/kvstore-backup-helper');

// 读取博物馆数据（自动备份）
const result = await readFromKVStore('forbidden-city', { 
  backup: true,  // 自动保存备份
  verbose: true  // 打印日志
});

if (result.ok) {
  console.log('读取成功，备份已保存:', result.backupPath);
  const data = JSON.parse(result.data.value);
  // 处理数据...
} else {
  console.error('读取失败:', result.status);
}

// 执行写入操作后，备份写入数据
const writePayload = { id: 'forbidden-city', ... };
const backupPath = createWriteBackup('forbidden-city', writePayload, '我的操作');
console.log('写入备份已保存:', backupPath);
```

### 例子：7-Step 流程脚本

`tmp/process-forbidden-city-7steps.js` 已集成备份功能：

```javascript
// 第2步：读取 KV（自动备份）
const kvReadResult = await readFromKVStore(MUSEUM_ID, { backup: true });

// 第4步：写入 KV 并备份
if (needsWrite) {
  const payload = { id, name, collections, ... };
  const backupPath = createWriteBackup(MUSEUM_ID, payload, '7steps-process');
}

// 第5步：回读确认（自动备份）
const kvAfterResult = await readFromKVStore(MUSEUM_ID, { backup: true });
```

## 常见场景

### 场景 1：快速检查数据是否已在 KV 中

```bash
node tools/kvstore-backup-cli.js read forbidden-city
node tools/kvstore-backup-cli.js latest forbidden-city
```

### 场景 2：批量上传前进行备份

```bash
# 先读取现有数据（备份）
node tools/kvstore-backup-cli.js batch forbidden-city,national-museum,shanghai-museum

# 执行上传脚本...

# 上传后再验证
node tools/kvstore-backup-cli.js batch forbidden-city,national-museum,shanghai-museum
```

### 场景 3：恢复数据

如果需要恢复某个博物馆的历史版本，查看备份列表：

```bash
node tools/kvstore-backup-cli.js list forbidden-city
```

找到对应的备份文件，在 `backup/` 目录中查看，手动提取数据重新上传。

### 场景 4：定期清理备份

```bash
# 清理 7 天前的备份
node tools/kvstore-backup-cli.js cleanup 7

# 清理 30 天前的备份
node tools/kvstore-backup-cli.js cleanup 30
```

## 备份存储位置

所有备份文件存储在：

```
/workspaces/MuseumCheck/backup/
```

文件以 `kvstore-` 开头，按时间戳命名，易于排序和查找。

## 性能考虑

- **自动备份开销**：每次读取额外的文件写入（< 5ms），可忽略
- **存储空间**：平均每个备份 1-5 KB，建议定期清理（见 `cleanup` 命令）
- **并发安全**：备份文件使用时间戳确保不会覆盖

## 故障排除

### 备份没有保存

- 检查 `backup/` 目录是否存在且可写
- 确保使用 `readFromKVStore(..., { backup: true })`

### 找不到特定时间的备份

```bash
node tools/kvstore-backup-cli.js list <museumId>
```

列出所有备份文件，按时间逆序排列。

### 备份文件太多

```bash
node tools/kvstore-backup-cli.js cleanup 7
```

删除 7 天前的备份。也可修改 `cleanupOldBackups` 的默认天数。

## 监控和审计

使用 `generateBackupReport()` 定期检查：

```javascript
const { generateBackupReport } = require('./core/kvstore-backup-helper');
const stats = generateBackupReport();
console.log(stats);
// 输出：
// {
//   totalBackups: 150,
//   byOperation: { read: 100, write: 50, check: 0 },
//   byMuseum: { 'forbidden-city': 25, 'national-museum': 20, ... }
// }
```

## 最佳实践

1. **在 7-Step 流程中使用**：所有数据变更都应记录备份
2. **定期清理**：每周运行 `cleanup 7` 防止占用空间
3. **验证备份**：使用 `latest` 和 `list` 命令验证重要数据已备份
4. **监控统计**：定期检查 `report`，了解数据变更频率

---

更新于：2026-01-14
