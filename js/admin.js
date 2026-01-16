/**
 * Admin Page - Affiliate Routing Configuration Management
 * 
 * Manages affiliate routing configuration stored in KV store.
 * Allows admins to configure which page (index.html or simple.html)
 * to display for different affiliate parameters.
 */
(function(){
  'use strict';

  const CONFIG = {
    API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
    AFFILIATE_CONFIG_KEY: 'museumcheck-affiliate-config',
    // Far future timestamp: year 2124 in Unix seconds
    // Calculated as: new Date('2124-01-01T00:00:00Z').getTime() / 1000 = 4861363200
    // We use a slightly higher value to ensure data persists indefinitely
    TIMESTAMP_2124: 4866674732,
    // Time offset in seconds for marking items as already expired (for deletion)
    TOMBSTONE_EXPIRE_OFFSET: 60
  };

  const qs = new URLSearchParams(location.search);
  const isAdmin = qs.get('admin') === '1';

  const el = {
    app: document.getElementById('app'),
    unauthorized: document.getElementById('unauthorized'),
    reload: document.getElementById('reload'),
    status: document.getElementById('status'),
    tableBody: document.getElementById('configTableBody'),
    newAffiliate: document.getElementById('newAffiliate'),
    newTarget: document.getElementById('newTarget'),
    newDescription: document.getElementById('newDescription'),
    addConfig: document.getElementById('addConfig')
  };

  if (!isAdmin) {
    el.unauthorized.style.display = '';
    return;
  }
  el.app.style.display = '';

  /**
   * Remote Storage API client for affiliate configuration
   */
  const RemoteStorage = {
    /**
     * Fetch all affiliate configurations from KV store
     * @returns {Promise<Array>} Array of affiliate config objects
     */
    async fetchConfigs() {
      const url = `${CONFIG.API_ENDPOINT}?key=${encodeURIComponent(CONFIG.AFFILIATE_CONFIG_KEY)}&sortKey=*`;
      console.log('[Admin] Fetching affiliate configs from:', url);
      
      const res = await fetch(url);
      console.log('[Admin] Fetch response status:', res.status, res.statusText);
      
      if (!res.ok) {
        if (res.status === 404) {
          // No configs yet, return empty array
          return [];
        }
        throw new Error('Failed to fetch configs: ' + res.status);
      }
      
      const data = await res.json();
      console.log('[Admin] API response received, items:', Array.isArray(data) ? data.length : (data?.items?.length || 'N/A'));
      
      const configs = [];
      let itemsArray = null;
      
      // Support multiple response formats
      if (data.items || data.Items) {
        itemsArray = data.items || data.Items;
      } else if (data.value && typeof data.value === 'string') {
        try {
          itemsArray = JSON.parse(data.value);
        } catch (e) {
          console.error('[Admin] Failed to parse value field:', e);
        }
      }
      
      if (itemsArray && Array.isArray(itemsArray)) {
        for (const item of itemsArray) {
          const sortKey = item.sortKey || item.sk || '';
          // Only include affiliate configs (sortKey starts with 'affiliate-')
          if (!sortKey.startsWith('affiliate-')) {
            continue;
          }
          
          try {
            const parsed = JSON.parse(item.value);
            parsed._sortKey = sortKey;
            parsed._expireAt = item.expireAt || item.expire_at || item.ttl;
            configs.push(parsed);
          } catch (e) {
            console.warn('Failed to parse config entry:', e, item);
          }
        }
      }
      
      console.log('[Admin] Parsed configs:', configs.length);
      
      // Sort by affiliate code alphabetically
      configs.sort((a, b) => (a.affiliate || '').localeCompare(b.affiliate || ''));
      
      return configs;
    },

    /**
     * Save or update an affiliate configuration
     * @param {string} affiliate - Affiliate code (e.g., 'KS', 'DY')
     * @param {Object} config - Configuration object
     * @returns {Promise<Object>} API response
     */
    async saveConfig(affiliate, config) {
      const sortKey = `affiliate-${affiliate.toUpperCase()}`;
      const data = {
        ...config,
        affiliate: affiliate.toUpperCase(),
        lastUpdate: Date.now()
      };
      
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: CONFIG.AFFILIATE_CONFIG_KEY,
          sortKey: sortKey,
          value: JSON.stringify(data),
          expireAt: CONFIG.TIMESTAMP_2124
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to save config: ' + res.status);
      }
      
      return res.json();
    },

    /**
     * Delete an affiliate configuration
     * @param {string} affiliate - Affiliate code to delete
     * @returns {Promise<Object>} API response
     */
    async deleteConfig(affiliate) {
      const sortKey = `affiliate-${affiliate.toUpperCase()}`;
      const tombstone = JSON.stringify({ 
        affiliate: affiliate.toUpperCase(), 
        deleted: true, 
        timestamp: Date.now() 
      });
      // Set expiration to past to trigger deletion
      const expireAt = Math.floor(Date.now() / 1000) - CONFIG.TOMBSTONE_EXPIRE_OFFSET;
      
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: CONFIG.AFFILIATE_CONFIG_KEY,
          sortKey: sortKey,
          value: tombstone,
          expireAt: expireAt
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete config: ' + res.status);
      }
      
      return res.json();
    }
  };

  /**
   * Format timestamp for display
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted date string
   */
  function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Create a tag element
   * @param {string} text - Tag text
   * @param {string} type - Tag type ('active' or 'inactive')
   * @returns {HTMLElement} Tag element
   */
  function createTag(text, type = 'active') {
    const span = document.createElement('span');
    span.className = `tag ${type}`;
    span.textContent = text;
    return span;
  }

  /**
   * Get display name for target page
   * @param {string} target - Target page identifier
   * @returns {string} Display name
   */
  function getTargetDisplayName(target) {
    const targets = {
      'index': 'index.html (完整)',
      'simple': 'simple.html (简化)'
    };
    return targets[target] || target;
  }

  /**
   * Render the configuration table
   * @param {Array} configs - Array of configuration objects
   */
  function renderTable(configs) {
    el.tableBody.innerHTML = '';
    
    if (configs.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div style="font-weight: 600; margin-bottom: 12px;">暂无配置</div>
          <div class="muted">使用上方表单添加 affiliate 路由配置</div>
        </td>
      `;
      el.tableBody.appendChild(tr);
      return;
    }
    
    configs.forEach(config => {
      const tr = document.createElement('tr');
      
      // Affiliate code column
      const tdAffiliate = document.createElement('td');
      tdAffiliate.className = 'mono';
      tdAffiliate.textContent = config.affiliate || '-';
      tr.appendChild(tdAffiliate);
      
      // Target page column
      const tdTarget = document.createElement('td');
      tdTarget.textContent = getTargetDisplayName(config.target);
      tr.appendChild(tdTarget);
      
      // Description column
      const tdDesc = document.createElement('td');
      tdDesc.textContent = config.description || '-';
      tdDesc.className = 'muted';
      tr.appendChild(tdDesc);
      
      // Status column
      const tdStatus = document.createElement('td');
      const isActive = config.active !== false; // Default to active if not specified
      tdStatus.appendChild(createTag(isActive ? '启用' : '禁用', isActive ? 'active' : 'inactive'));
      tr.appendChild(tdStatus);
      
      // Last update column
      const tdUpdate = document.createElement('td');
      tdUpdate.className = 'muted';
      tdUpdate.textContent = formatDate(config.lastUpdate);
      tr.appendChild(tdUpdate);
      
      // Preview link column
      const tdPreview = document.createElement('td');
      const previewLink = document.createElement('a');
      previewLink.className = 'preview-link';
      previewLink.href = `/?affiliate=${config.affiliate}`;
      previewLink.target = '_blank';
      previewLink.textContent = `测试链接 →`;
      tdPreview.appendChild(previewLink);
      tr.appendChild(tdPreview);
      
      // Actions column
      const tdActions = document.createElement('td');
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'flex';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'danger';
      deleteBtn.textContent = '🗑️ 删除';
      deleteBtn.onclick = () => deleteConfigConfirm(config);
      actionsDiv.appendChild(deleteBtn);
      
      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);
      
      el.tableBody.appendChild(tr);
    });
  }

  /**
   * Set status message
   * @param {string} text - Status text
   */
  function setStatus(text) {
    el.status.textContent = text || '';
  }

  /**
   * Load all configurations
   */
  async function loadAll() {
    setStatus('加载中...');
    try {
      const configs = await RemoteStorage.fetchConfigs();
      console.log(`[Admin] Loaded ${configs.length} affiliate configs`);
      renderTable(configs);
      setStatus('');
    } catch (e) {
      setStatus('加载失败: ' + e.message);
      console.error('Load error:', e);
    }
  }

  /**
   * Add a new configuration
   */
  async function addNewConfig() {
    const affiliate = (el.newAffiliate.value || '').trim().toUpperCase();
    const target = el.newTarget.value;
    const description = (el.newDescription.value || '').trim();
    
    if (!affiliate) {
      alert('请输入 Affiliate 代码');
      el.newAffiliate.focus();
      return;
    }
    
    if (!/^[A-Z0-9_-]{1,20}$/.test(affiliate)) {
      alert('Affiliate 代码只能包含大写字母、数字、下划线和连字符，长度1-20');
      el.newAffiliate.focus();
      return;
    }
    
    setStatus('保存中...');
    try {
      await RemoteStorage.saveConfig(affiliate, {
        target: target,
        description: description,
        active: true
      });
      
      // Clear form
      el.newAffiliate.value = '';
      el.newDescription.value = '';
      el.newTarget.value = 'index';
      
      setStatus('保存成功');
      await loadAll();
    } catch (e) {
      setStatus('保存失败: ' + e.message);
      alert('保存失败: ' + e.message);
    }
  }

  /**
   * Confirm and delete a configuration
   * @param {Object} config - Configuration to delete
   */
  function deleteConfigConfirm(config) {
    if (!confirm(`确认删除 affiliate "${config.affiliate}" 的配置？\n删除后该 affiliate 将显示默认页面。`)) {
      return;
    }
    
    setStatus('删除中...');
    RemoteStorage.deleteConfig(config.affiliate)
      .then(() => {
        setStatus('删除成功');
        loadAll();
      })
      .catch(e => {
        setStatus('删除失败: ' + e.message);
        alert('删除失败: ' + e.message);
      });
  }

  // Event handlers
  el.reload.onclick = loadAll;
  el.addConfig.onclick = addNewConfig;
  
  // Allow Enter key to submit
  el.newAffiliate.onkeypress = function(e) {
    if (e.key === 'Enter') {
      addNewConfig();
    }
  };
  el.newDescription.onkeypress = function(e) {
    if (e.key === 'Enter') {
      addNewConfig();
    }
  };

  // Initialize
  loadAll();
})();
