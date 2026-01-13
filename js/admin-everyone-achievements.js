(function(){
  'use strict';

  const tableBody = document.querySelector('#postersTable tbody');
  const refreshBtn = document.getElementById('refreshBtn');
  const qInput = document.getElementById('qInput');
  const msg = document.getElementById('message');

  function showMessage(t){ msg.textContent = t || ''; }

  function renderRow(r){
    const tr = document.createElement('tr');
    const id = r.id || r._id || r.ID || r.id_value || '';
    const imgUrl = (r.imageUrl || r.image_url || r.url || null) || '';

    tr.innerHTML = `
      <td>${id}</td>
      <td style="width:140px"><img src="${imgUrl}" style="max-width:120px;max-height:80px" alt="" onerror="this.style.opacity=0.5"></td>
      <td><input data-field="title" value="${(r.title||'').replace(/"/g,'&quot;')}" style="width:220px" /></td>
      <td><input data-field="user_name" value="${(r.userName||r.user_name||'').replace(/"/g,'&quot;')}" style="width:140px" /></td>
      <td>${r.createdAt||r.created_at||''}</td>
      <td>
         <select data-field="visibility">
           <option value="public" ${ (r.visibility==='public') ? 'selected' : ''}>public</option>
           <option value="private" ${ (r.visibility==='private') ? 'selected' : ''}>private</option>
         </select>
      </td>
      <td class="admin-actions">
        <button data-action="save">保存</button>
        <button data-action="delete">删除</button>
      </td>
    `;

    // wire actions
    tr.querySelector('[data-action="save"]').addEventListener('click', async ()=>{
      const inputs = tr.querySelectorAll('[data-field]');
      const data = {};
      inputs.forEach(inp => { const k = inp.getAttribute('data-field'); data[k] = inp.value; });
      try{
        showMessage('保存中...');
        if (typeof LetmetryAPI !== 'undefined' && typeof LetmetryAPI.updateRecord === 'function'){
          await LetmetryAPI.updateRecord('achievement_posters', id, data);
        } else {
          await fetch('https://letmetry.cloud/mysql/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ table:'achievement_posters', id, data })});
        }
        showMessage('保存成功');
        loadList();
      }catch(e){ console.error(e); showMessage('保存失败: '+(e.message||e)); }
    });

    tr.querySelector('[data-action="delete"]').addEventListener('click', async ()=>{
      if(!confirm('确认删除此记录？该操作不可恢复')) return;
      try{
        showMessage('删除中...');
        if (typeof LetmetryAPI !== 'undefined' && typeof LetmetryAPI.deleteRecord === 'function'){
          await LetmetryAPI.deleteRecord('achievement_posters', id);
        } else {
          await fetch('https://letmetry.cloud/mysql/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ table:'achievement_posters', id })});
        }
        showMessage('删除成功');
        loadList();
      }catch(e){ console.error(e); showMessage('删除失败: '+(e.message||e)); }
    });

    return tr;
  }

  async function loadList(){
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;padding:18px">加载中...</td></tr>';
    showMessage('');
    const q = (qInput.value||'').trim();
    try{
      const sql = `SELECT id, image_url AS imageUrl, title, user_name AS userName, visibility, created_at AS createdAt FROM achievement_posters ORDER BY created_at DESC LIMIT 500`;
      let rows = [];
      if (typeof LetmetryAPI !== 'undefined' && typeof LetmetryAPI.queryMysql === 'function'){
        rows = await LetmetryAPI.queryMysql(sql, []);
      } else {
        const resp = await fetch('https://letmetry.cloud/mysql/query', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sql, params: [] }) });
        rows = await resp.json();
        if (rows && rows.rows) rows = rows.rows;
      }
      if (!Array.isArray(rows)) rows = [];
      // filter
      if (q) rows = rows.filter(r => (r.title||r.imageUrl||r.userName||'').toString().toLowerCase().includes(q.toLowerCase()));
      tableBody.innerHTML = '';
      if (!rows.length) tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;padding:18px">没有记录</td></tr>';
      rows.forEach(r => {
        tableBody.appendChild(renderRow(r));
      });
    }catch(e){ console.error(e); tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#d33;padding:18px">加载失败</td></tr>'; showMessage('加载失败: '+(e.message||e)); }
  }

  refreshBtn.addEventListener('click', loadList);
  qInput.addEventListener('keyup', (e)=>{ if(e.key==='Enter') loadList(); });

  // initial
  document.addEventListener('DOMContentLoaded', ()=> loadList());

})();
