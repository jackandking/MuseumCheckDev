(function(){
  'use strict';

  // Normalize database/API rows to the internal poster format
  function normalizeRow(r){
    if(!r) return null;
    const imageUrl = r.imageUrl || r.image_url || r.url || r.path || (r.data && r.data.image_url);
    if(!imageUrl) return null;
    return {
      imageUrl,
      title: r.title || r.name || r.filename || '',
      userName: r.userName || r.user_name || r.uploader || '',
      createdAt: r.createdAt || r.created_at || r.modified || r.date || ''
    };
  }

  async function fetchFromMySQL(){
    const sql = "SELECT image_url AS imageUrl, title, user_name AS userName, created_at AS createdAt FROM achievement_posters WHERE visibility='public' ORDER BY created_at DESC LIMIT 100";
    const resp = await fetch('https://letmetry.cloud/mysql/query', {
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
    posters.forEach(poster=>{
      const card=document.createElement('div');
      card.className='poster-card';
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

  // expose for debug (optional)
  window.MuseumEveryone = { loadPosters, renderPosters };
  document.addEventListener('DOMContentLoaded', ()=> loadPosters());
})();
