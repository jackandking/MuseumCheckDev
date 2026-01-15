/**
 * SQLAdapter - MySQL 适配器
 * 用于关系型数据库操作
 */

class SQLAdapter extends StorageAdapter {
  constructor(config = {}) {
    super({
      name: 'mysql',
      writable: true,
      priority: 2,
      ...config
    });
    
    this.endpoint = config.endpoint || ((typeof API_ENDPOINTS !== 'undefined') ? API_ENDPOINTS.MYSQL.BASE : 'https://letmetry.cloud/mysql');
    this.timeout = config.timeout || 10000; // 10秒超时
    this.defaultTable = config.defaultTable || 'kv_store';
  }

  /**
   * 读取数据
   */
  async get(key, options = {}) {
    const { table = this.defaultTable, idField = 'id' } = options;
    
    try {
      const response = await fetch(`${this.endpoint}/getById`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id: key })
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`SQL error: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error(`[SQL] Get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 写入数据
   */
  async set(key, value, options = {}) {
    const { table = this.defaultTable } = options;
    
    try {
      // 先检查是否存在
      const existing = await this.get(key, options);
      
      const endpoint = existing 
        ? `${this.endpoint}/update`
        : `${this.endpoint}/insert`;
      
      const body = existing
        ? { table, id: key, data: value }
        : { table, data: { id: key, ...value } };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      return response.ok;
    } catch (error) {
      console.error(`[SQL] Set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除数据
   */
  async delete(key, options = {}) {
    const { table = this.defaultTable } = options;
    
    try {
      const response = await fetch(`${this.endpoint}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id: key })
      });
      
      return response.ok;
    } catch (error) {
      console.error(`[SQL] Delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 查询数据
   */
  async query(condition = {}, options = {}) {
    const { table = this.defaultTable } = options;
    const { sql, params } = condition.sql 
      ? condition 
      : this._buildQuery(condition, table);
    
    try {
      const response = await fetch(`${this.endpoint}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params: params || [] })
      });
      
      if (!response.ok) {
        throw new Error(`SQL query error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[SQL] Query error:', error);
      return [];
    }
  }

  /**
   * 构建安全的参数化查询
   */
  _buildQuery(condition, table) {
    const { where, orderBy, limit, offset } = condition;
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    
    if (where) {
      const clauses = Object.entries(where).map(([key, value]) => {
        params.push(value);
        return `${key} = ?`;
      });
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
    
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }
    
    if (offset) {
      sql += ` OFFSET ${parseInt(offset)}`;
    }
    
    return { sql, params };
  }

  /**
   * 批量插入
   */
  async batchInsert(items, options = {}) {
    const { table = this.defaultTable } = options;
    
    if (!Array.isArray(items) || items.length === 0) {
      return { success: [], failed: [] };
    }
    
    try {
      // 构建批量插入 SQL
      const keys = Object.keys(items[0]);
      const placeholders = items.map(() => `(${keys.map(() => '?').join(', ')})`).join(', ');
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${placeholders}`;
      
      const params = items.flatMap(item => keys.map(key => item[key]));
      
      const response = await fetch(`${this.endpoint}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params })
      });
      
      if (response.ok) {
        return { success: items.map((_, i) => i), failed: [] };
      } else {
        return { success: [], failed: items.map((_, i) => i) };
      }
    } catch (error) {
      console.error('[SQL] Batch insert error:', error);
      
      // 降级到单条插入
      return await super.batchSet(
        Object.fromEntries(items.map(item => [item.id, item])),
        options
      );
    }
  }

  /**
   * 健康检查
   */
  async isHealthy() {
    const now = Date.now();
    
    if (now - this.lastHealthCheck < 60000) {
      return this.healthy;
    }
    
    this.lastHealthCheck = now;
    
    try {
      const response = await fetch(`${this.endpoint}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT 1', params: [] })
      });
      
      this.healthy = response.ok;
      return this.healthy;
    } catch (error) {
      console.error('[SQL] Health check failed:', error);
      this.healthy = false;
      return false;
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SQLAdapter;
}

if (typeof window !== 'undefined') {
  window.SQLAdapter = SQLAdapter;
}
