(function(){
  'use strict';

  // Normalize database/API rows to the internal poster format
  function normalizeRow(r){
    if(!r) return null;
    const rawImageUrl = r.imageUrl || r.image_url || r.url || r.path || (r.data && r.data.image_url);
    const imageUrl = (typeof API_ENDPOINTS !== 'undefined' && typeof API_ENDPOINTS.normalizeImageUrl === 'function')
      ? API_ENDPOINTS.normalizeImageUrl(rawImageUrl)
      : rawImageUrl;
    if(!imageUrl) return null;
    return {
      id: r.id,
      imageUrl,
      title: r.title || r.name || r.filename || '',
      userName: r.userName || r.user_name || r.uploader || '',
      createdAt: r.createdAt || r.created_at || r.modified || r.date || '',
      museumId: r.museumId || r.museum_id || ''
    };
  }

  async function fetchFromMySQL(){
    const sql = "SELECT id, image_url AS imageUrl, title, user_name AS userName, museum_id AS museumId, created_at AS createdAt FROM achievement_posters WHERE visibility='public' ORDER BY created_at DESC LIMIT 100";
    // Prefer using LetmetryAPI.queryMysql if available (centralized auth/error handling)
    if (typeof LetmetryAPI !== 'undefined' && typeof LetmetryAPI.queryMysql === 'function') {
      const rows = await LetmetryAPI.queryMysql(sql, []);
      const list = Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
      return list;
    }

    // Fallback: direct fetch to endpoint
    const resp = await fetch((typeof API_ENDPOINTS !== 'undefined') ? API_ENDPOINTS.MYSQL.QUERY : 'https://museumcheck.cn/mysql/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params: [] })
    });
    if(!resp.ok) throw new Error('MySQL query failed: ' + resp.status);
    const rows = await resp.json();
    const list = Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : (Array.isArray(rows.rows) ? rows.rows.map(normalizeRow).filter(Boolean) : []);
    return list;
  }

  // Removed unreliable fallbacks (posters endpoint + file list).
  // Rely on DB-first fetch; surface a clear error if MySQL request fails.

  async function loadPosters(){
    const loadingEl=document.getElementById('loading'), errorEl=document.getElementById('error'), gallery=document.getElementById('posterGallery');
    if(!gallery) return;
    loadingEl && (loadingEl.style.display='');
    errorEl && (errorEl.style.display='none');
    gallery.setAttribute('aria-busy','true');
    gallery.innerHTML='';

    try{
      try{
        const list = await fetchFromMySQL();
        if(list && list.length){ renderPosters(list); return; }
        // No posters in DB yet — show empty state
        renderPosters([]);
        return;
      }catch(e){
        console.error('MySQL fetch failed', e);
        // surface error to UI
        errorEl && (errorEl.style.display='');
        return;
      }
    }finally{
      loadingEl && (loadingEl.style.display='none');
      gallery.setAttribute('aria-busy','false');
    }
  }

  function renderPosters(posters){
    const gallery=document.getElementById('posterGallery');
    if(!gallery) return;
    gallery.innerHTML='';
    if(!Array.isArray(posters) || posters.length===0){
      gallery.innerHTML='<div style="color:#888;text-align:center;width:100%;padding:40px 0">还没有人发布成就海报，快来成为第一个吧！</div>';
      return;
    }
    
    // Get user's published posters from localStorage to check ownership
    const publishedPosters = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
    const userPosterIds = new Set(
      Object.values(publishedPosters)
        .map(p => p.recordId)
        .filter(id => id != null)
    );
    
    posters.forEach(poster=>{
      const card=document.createElement('div');
      card.className='poster-card';
      
      // Check if this is user's own poster
      const isOwnPoster = poster.id && userPosterIds.has(poster.id);
      
      // Add delete button for user's own posters
      if (isOwnPoster) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-poster-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = '删除我的海报';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deletePoster(poster);
        };
        card.appendChild(deleteBtn);
      }
      
      const img=document.createElement('img');
      img.src=poster.imageUrl;
      img.alt=poster.title||'成就海报';
      img.loading='lazy';
      img.onerror=()=>{ img.style.filter='grayscale(100%)'; img.alt = img.alt + '（加载失败）'; };
      card.appendChild(img);
      if(poster.title){
        const title=document.createElement('div');
        title.style.fontWeight='bold';
        title.style.fontSize='14px';
        title.style.margin='6px 0 2px 0';
        title.textContent=poster.title;
        card.appendChild(title);
      }
      const meta=document.createElement('div');
      meta.className='poster-meta';
      meta.textContent = (poster.userName ? poster.userName + ' · ' : '') + (poster.createdAt ? new Date(poster.createdAt).toLocaleDateString() : '');
      card.appendChild(meta);
      gallery.appendChild(card);
    });
  }
  
  // Delete poster function
  async function deletePoster(poster) {
    if (!poster || !poster.id) {
      alert('无法删除：海报信息不完整');
      return;
    }
    
    if (!confirm(`确定要删除海报「${poster.title || '海报'}」吗？删除后将无法恢复。`)) {
      return;
    }
    
    try {
      // Delete from database
      if (typeof LetmetryAPI !== 'undefined' && LetmetryAPI.deleteRecord) {
        await LetmetryAPI.deleteRecord('achievement_posters', poster.id);
        console.log('Poster deleted from database, ID:', poster.id);
      } else {
        // Fallback: direct fetch
        const resp = await fetch((typeof API_ENDPOINTS !== 'undefined') ? API_ENDPOINTS.MYSQL.DELETE : 'https://museumcheck.cn/mysql/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'achievement_posters', id: poster.id })
        });
        if (!resp.ok) {
          throw new Error('删除请求失败: ' + resp.status);
        }
      }
      
      // Remove from localStorage published posters
      const publishedPosters = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
      const museumId = poster.museumId || Object.keys(publishedPosters).find(
        key => publishedPosters[key].recordId === poster.id
      );
      
      if (museumId && publishedPosters[museumId]) {
        delete publishedPosters[museumId];
        localStorage.setItem('publishedPosters', JSON.stringify(publishedPosters));
      }
      
      alert('海报已成功删除');
      
      // Reload posters to refresh the list
      loadPosters();
      
      // Analytics tracking
      if (typeof gtag === 'function') {
        gtag('event', 'achievement_poster_deleted_everyone', {
          poster_id: poster.id,
          museum_id: poster.museumId
        });
      }
      
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败：' + (error.message || error));
    }
  }

  // expose for debug (optional)
  window.MuseumEveryone = { loadPosters, renderPosters, deletePoster };
  document.addEventListener('DOMContentLoaded', ()=> loadPosters());
})();
