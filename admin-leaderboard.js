(function(){
  'use strict';

  const CONFIG = {
    API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
    LEADERBOARD_KEY: 'museumcheck-leaderboard',
    TIMESTAMP_2124: 4866674732  // Far future timestamp for leaderboard entries
  };

  const qs = new URLSearchParams(location.search);
  const isAdmin = qs.get('admin') === '1';

  const el = {
    app: document.getElementById('app'),
    unauthorized: document.getElementById('unauthorized'),
    reload: document.getElementById('reload'),
    deleteInvalid: document.getElementById('deleteInvalid'),
    exportData: document.getElementById('exportData'),
    status: document.getElementById('status'),
    counts: document.getElementById('counts'),
    tableBody: document.getElementById('leaderboardTableBody')
  };

  if (!isAdmin) {
    el.unauthorized.style.display = '';
    return;
  }
  el.app.style.display = '';

  // Remote Storage API client
  const RemoteStorage = {
    async fetchLeaderboard() {
      const url = `${CONFIG.API_ENDPOINT}?key=${encodeURIComponent(CONFIG.LEADERBOARD_KEY)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch leaderboard: ' + res.status);
      const data = await res.json();
      
      // Parse entries
      const entries = [];
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          try {
            const parsed = JSON.parse(item.value);
            // Add metadata
            parsed._sortKey = item.sortKey || item.sk;
            parsed._expireAt = item.expireAt || item.expire_at || item.ttl;
            entries.push(parsed);
          } catch (e) {
            console.warn('Failed to parse entry:', e, item);
          }
        }
      }
      
      // Sort by visitedCount descending
      entries.sort((a, b) => (b.visitedCount || 0) - (a.visitedCount || 0));
      
      return entries;
    },

    async updateEntry(userId, data) {
      const sortKey = `user-${userId}`;
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: CONFIG.LEADERBOARD_KEY,
          sortKey: sortKey,
          value: JSON.stringify(data),
          ttl: CONFIG.TIMESTAMP_2124
        })
      });
      if (!res.ok) throw new Error('Failed to update entry: ' + res.status);
      return res.json();
    },

    async deleteEntry(userId) {
      // Set expiration to past to delete
      const sortKey = `user-${userId}`;
      const tombstone = JSON.stringify({ userId, deleted: true, timestamp: Date.now() });
      const expireAt = Math.floor(Date.now()/1000) - 60; // Already expired
      
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: CONFIG.LEADERBOARD_KEY,
          sortKey: sortKey,
          value: tombstone,
          expireAt: expireAt
        })
      });
      if (!res.ok) throw new Error('Failed to delete entry: ' + res.status);
      return res.json();
    }
  };

  // Validation
  function validateEntry(entry) {
    const errors = [];
    if (!entry || typeof entry !== 'object') {
      return { ok: false, errors: ['不是有效对象'] };
    }
    
    if (!entry.userId || typeof entry.userId !== 'string') {
      errors.push('缺少userId');
    }
    
    if (!entry.nickname || typeof entry.nickname !== 'string') {
      errors.push('缺少nickname');
    } else if (entry.nickname.length > 50) {
      errors.push('nickname过长');
    }
    
    if (typeof entry.visitedCount !== 'number') {
      errors.push('visitedCount无效');
    } else if (entry.visitedCount < 0) {
      errors.push('visitedCount为负数');
    } else if (entry.visitedCount > 1000) {
      errors.push('visitedCount异常大(>1000)');
    }
    
    if (typeof entry.lastUpdate !== 'number') {
      errors.push('缺少lastUpdate');
    } else {
      const now = Date.now();
      if (entry.lastUpdate > now + 5*60*1000) {
        errors.push('lastUpdate在未来');
      }
      if (entry.lastUpdate < now - 365*24*60*60*1000) {
        errors.push('lastUpdate太旧(>365天)');
      }
    }
    
    return { ok: errors.length === 0, errors };
  }

  // Statistics
  function calculateStats(entries) {
    const total = entries.length;
    const invalid = entries.filter(e => !validateEntry(e).ok).length;
    const totalVisits = entries.reduce((sum, e) => sum + (e.visitedCount || 0), 0);
    const avgVisits = total > 0 ? (totalVisits / total).toFixed(1) : 0;
    
    // Check for duplicate userIds
    const userIds = new Map();
    entries.forEach(e => {
      if (e.userId) {
        userIds.set(e.userId, (userIds.get(e.userId) || 0) + 1);
      }
    });
    const duplicates = [...userIds.values()].filter(c => c > 1).length;
    
    return { total, invalid, duplicates, totalVisits, avgVisits };
  }

  function renderStats(entries) {
    const stats = calculateStats(entries);
    el.counts.innerHTML = `
      <div class="count">
        <span class="count-number">${stats.total}</span>
        <span class="count-label">总用户数</span>
      </div>
      <div class="count">
        <span class="count-number">${stats.totalVisits}</span>
        <span class="count-label">总参观次数</span>
      </div>
      <div class="count">
        <span class="count-number">${stats.avgVisits}</span>
        <span class="count-label">平均参观数</span>
      </div>
      <div class="count">
        <span class="count-number" style="color: ${stats.invalid > 0 ? '#dc2626' : '#059669'}">${stats.invalid}</span>
        <span class="count-label">不合法记录</span>
      </div>
      ${stats.duplicates > 0 ? `
      <div class="count">
        <span class="count-number" style="color: #dc2626">${stats.duplicates}</span>
        <span class="count-label">重复用户ID</span>
      </div>
      ` : ''}
    `;
  }

  function createTag(text, type = 'ok') {
    const span = document.createElement('span');
    span.className = `tag ${type}`;
    span.textContent = text;
    return span;
  }

  function getRankBadge(rank) {
    const badge = document.createElement('span');
    badge.className = `rank-badge ${rank <= 3 ? 'rank-' + rank : 'rank-other'}`;
    if (rank === 1) {
      badge.textContent = '🥇';
    } else if (rank === 2) {
      badge.textContent = '🥈';
    } else if (rank === 3) {
      badge.textContent = '🥉';
    } else {
      badge.textContent = rank;
    }
    return badge;
  }

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

  function renderTable(entries) {
    el.tableBody.innerHTML = '';
    
    if (entries.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div class="muted">暂无排行榜数据</div>
        </td>
      `;
      el.tableBody.appendChild(tr);
      return;
    }
    
    entries.forEach((entry, index) => {
      const rank = index + 1;
      const validation = validateEntry(entry);
      const tr = document.createElement('tr');
      
      // Rank column
      const tdRank = document.createElement('td');
      tdRank.appendChild(getRankBadge(rank));
      tr.appendChild(tdRank);
      
      // User ID column
      const tdUserId = document.createElement('td');
      tdUserId.className = 'mono';
      tdUserId.innerHTML = `
        <div>${entry.userId || '-'}</div>
        ${entry._sortKey ? `<div class="muted" style="font-size: 11px;">${entry._sortKey}</div>` : ''}
      `;
      tr.appendChild(tdUserId);
      
      // Nickname column
      const tdNickname = document.createElement('td');
      tdNickname.textContent = entry.nickname || '-';
      tr.appendChild(tdNickname);
      
      // Visited count column
      const tdCount = document.createElement('td');
      tdCount.innerHTML = `<strong>${entry.visitedCount || 0}</strong> 个`;
      tr.appendChild(tdCount);
      
      // Last update column
      const tdUpdate = document.createElement('td');
      tdUpdate.className = 'muted';
      tdUpdate.textContent = formatDate(entry.lastUpdate);
      tr.appendChild(tdUpdate);
      
      // Validation column
      const tdValidation = document.createElement('td');
      if (validation.ok) {
        tdValidation.appendChild(createTag('正常', 'ok'));
      } else {
        tdValidation.appendChild(createTag('异常', 'error'));
        validation.errors.forEach(err => {
          tdValidation.appendChild(document.createElement('br'));
          tdValidation.appendChild(createTag(err, 'warning'));
        });
      }
      tr.appendChild(tdValidation);
      
      // Actions column
      const tdActions = document.createElement('td');
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'flex';
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️ 编辑';
      editBtn.onclick = () => editEntry(entry, tr);
      actionsDiv.appendChild(editBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'danger';
      deleteBtn.textContent = '🗑️ 删除';
      deleteBtn.onclick = () => deleteEntryConfirm(entry);
      actionsDiv.appendChild(deleteBtn);
      
      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);
      
      el.tableBody.appendChild(tr);
    });
  }

  function editEntry(entry, row) {
    // Simple inline edit implementation
    const newNickname = prompt('修改昵称:', entry.nickname);
    if (newNickname === null) return; // Cancelled
    
    const newCount = prompt('修改参观数:', entry.visitedCount);
    if (newCount === null) return; // Cancelled
    
    const visitedCount = parseInt(newCount, 10);
    if (isNaN(visitedCount) || visitedCount < 0) {
      alert('参观数必须是非负整数');
      return;
    }
    
    setStatus('正在更新...');
    const updatedData = {
      ...entry,
      nickname: newNickname,
      visitedCount: visitedCount,
      lastUpdate: Date.now()
    };
    
    RemoteStorage.updateEntry(entry.userId, updatedData)
      .then(() => {
        setStatus('更新成功');
        loadAll();
      })
      .catch(e => {
        setStatus('更新失败: ' + e.message);
        alert('更新失败: ' + e.message);
      });
  }

  function deleteEntryConfirm(entry) {
    if (!confirm(`确认删除用户 "${entry.nickname}" 的排行榜记录？\nID: ${entry.userId}`)) {
      return;
    }
    
    setStatus('正在删除...');
    RemoteStorage.deleteEntry(entry.userId)
      .then(() => {
        setStatus('删除成功');
        loadAll();
      })
      .catch(e => {
        setStatus('删除失败: ' + e.message);
        alert('删除失败: ' + e.message);
      });
  }

  async function deleteInvalidEntries() {
    if (!confirm('确认批量删除所有不合法的排行榜记录？此操作不可撤销！')) {
      return;
    }
    
    setStatus('正在加载数据...');
    try {
      const entries = await RemoteStorage.fetchLeaderboard();
      const invalidEntries = entries.filter(e => !validateEntry(e).ok);
      
      if (invalidEntries.length === 0) {
        alert('没有发现不合法的记录');
        setStatus('');
        return;
      }
      
      if (!confirm(`发现 ${invalidEntries.length} 条不合法记录，确认删除？`)) {
        setStatus('');
        return;
      }
      
      setStatus(`正在删除 ${invalidEntries.length} 条记录...`);
      let successCount = 0;
      let failCount = 0;
      
      for (const entry of invalidEntries) {
        try {
          await RemoteStorage.deleteEntry(entry.userId);
          successCount++;
        } catch (e) {
          console.error('Delete failed:', e);
          failCount++;
        }
      }
      
      setStatus(`删除完成: 成功 ${successCount} 条, 失败 ${failCount} 条`);
      await loadAll();
    } catch (e) {
      setStatus('批量删除失败: ' + e.message);
      alert('批量删除失败: ' + e.message);
    }
  }

  function exportDataToJSON() {
    setStatus('正在导出...');
    RemoteStorage.fetchLeaderboard()
      .then(entries => {
        const dataStr = JSON.stringify(entries, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leaderboard-export-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('导出成功');
      })
      .catch(e => {
        setStatus('导出失败: ' + e.message);
        alert('导出失败: ' + e.message);
      });
  }

  function setStatus(text) {
    el.status.textContent = text || '';
  }

  async function loadAll() {
    setStatus('加载中...');
    try {
      const entries = await RemoteStorage.fetchLeaderboard();
      renderStats(entries);
      renderTable(entries);
      setStatus('');
    } catch (e) {
      setStatus('加载失败: ' + e.message);
      console.error('Load error:', e);
    }
  }

  // Event handlers
  el.reload.onclick = loadAll;
  el.deleteInvalid.onclick = deleteInvalidEntries;
  el.exportData.onclick = exportDataToJSON;

  // Initialize
  loadAll();
})();
