(function(){
  'use strict';

  // Utilities
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Age reading helper (default 7-12 if not set)
  function getAgeGroup(){
    try { return localStorage.getItem('ageGroup') || '7-12'; } catch(e){ return '7-12'; }
  }

  // v3 supported museums (导览模式可用清单)
  const V3_SUPPORTED = ['forbidden-city', 'pinghu-museum'];

  function getUrlParams(){
    try{
      const u = new URL(location.href);
      const p = {};
      u.searchParams.forEach((v,k)=>{ p[k]=v; });
      return p;
    }catch(e){ return {}; }
  }

  function isMvpCombo(museum){
    try{
      const age = getAgeGroup();
      const role = getCaregiverRole();
      return museum && museum.id==='forbidden-city' && age==='3-6' && role==='grandparent';
    }catch(e){ return false; }
  }

  function buildForbiddenCityGrandparentMvpRoute(museum){
    return {
      id: 'route:forbidden-city:grandparent-3-6-mvp',
      name: '祖父母·省心路线',
      description: '门口打卡-找龙椅-数屋顶小兽-胜利合影',
      tasks: {
        enroute: [
          { id: 'act:forbidden-city:enroute-tts-nearby', role: 'parent', type: 'tts', title: '快到啦', subtitle: '还有10分钟就到啦，猜猜大门有几个门钉？', tts: '还有10分钟就到啦！我们再玩个小游戏：猜猜故宫的大门有几个门钉？到了我们一起数一数～', ages:['3-6'] }
        ],
        visit: [
          { id: 'act:forbidden-city:gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在午门或太和殿前合影' },
          { id: 'act:forbidden-city:find-throne', role: 'child', type: 'confirm', title: '找龙椅', subtitle: '找到皇帝的宝座并观察一个细节' },
          { id: 'act:forbidden-city:count-roof-beasts', role: 'child', type: 'confirm', title: '屋顶小兽', subtitle: '抬头数一数屋檐上的小兽' },
          { id: 'act:forbidden-city:victory-photo', role: 'parent', type: 'photo', title: '胜利合影', subtitle: '参观结束前再合影留念' }
        ]
      }
    };
  }
  // Caregiver role helper (default parent)
  function getCaregiverRole(){
    try { return localStorage.getItem('caregiverRole') || 'parent'; } catch(e){ return 'parent'; }
  }

  // Photo required setting helper (default optional - photos not required)
  function isPhotoRequired(){
    try { 
      const setting = localStorage.getItem('photoRequired');
      return setting === 'required';
    } catch(e){ 
      return false; // Default: photos are optional
    }
  }

  // Check if all required settings are configured
  function hasRequiredSettings(){
    try {
      const nickname = localStorage.getItem('childNickname');
      const age = localStorage.getItem('ageGroup');
      const role = localStorage.getItem('caregiverRole');
      // All three should exist and have non-empty values after trimming
      return !!(nickname && nickname.trim() && age && age.trim() && role && role.trim());
    } catch(e) { 
      return false; 
    }
  }

  const state = {
    step: 'select',
    selectedMuseum: null,
    innerTaskIndex: 0,
    prevInnerTaskIndex: 0,
    startAfterSettings: false,
    completedVisit: {},
    workflows: [],
    selectedWorkflow: null,
    wfVisitCount: 0,
    wfMode: false,
    photos: {
      entrance: [],
      victory: []
    },
    wakeLock: null
  };

  function getFeatureFlagClAugment(){
    try{
      const urlFlag = typeof location!=='undefined' && /(?:^|[?&])cl_augment=1(?:&|$)/.test(location.search);
      const ls = localStorage.getItem('feature:cl-augment');
      const lsOn = ls==="1" || ls==="true";
      return !!(urlFlag || lsOn);
    }catch(e){ return false; }
  }

  function __getProgress(){
    try{ return JSON.parse(localStorage.getItem('progress:v1')||'{}'); }catch(e){ return {}; }
  }
  function __setProgress(p){
    try{ localStorage.setItem('progress:v1', JSON.stringify(p||{})); }catch(e){}
  }
  function __markDone(museumId, uid, done){
    const p = __getProgress();
    if(!p[museumId]) p[museumId] = { tasks: {} };
    if(!p[museumId].tasks) p[museumId].tasks = {};
    p[museumId].tasks[uid] = { done: !!done, ts: Date.now() };
    __setProgress(p);
    // Legacy dual-write for checklist-derived IDs: cl:<museumId>:<role>:<age>:<index>
    try{
      if(/^cl:/.test(uid)){
        const parts = uid.split(':');
        // [ 'cl', museumId, role, age, index ]
        if(parts.length>=5){
          const mid = parts[1];
          const role = parts[2];
          const age = parts[3];
          const idx = parseInt(parts[4],10) || 0;
          const key = `${mid}-${role}-${age}`;
          let store = {};
          try{ store = JSON.parse(localStorage.getItem('museumChecklists')||'{}'); }catch(e){ store = {}; }
          const arr = Array.isArray(store[key]) ? store[key].slice() : [];
          const has = arr.includes(idx);
          if(done && !has){ arr.push(idx); }
          if(!done && has){ const i = arr.indexOf(idx); if(i>=0) arr.splice(i,1); }
          store[key] = arr;
          try{ localStorage.setItem('museumChecklists', JSON.stringify(store)); }catch(e){}
        }
      }
    }catch(e){}
  }
  function __isDone(museumId, uid){
    const p = __getProgress();
    const t = p[museumId] && p[museumId].tasks && p[museumId].tasks[uid];
    return !!(t && t.done);
  }
  if(typeof window!=='undefined'){
    window.__progress = { __getProgress, __setProgress, __markDone, __isDone };
  }

  function normalizeTitle(text){
    try{
      const t = (text||'').replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim();
      return t.slice(0, 12);
    }catch(e){ return (text||'').slice(0,12); }
  }
  function dedupeTasks(list){
    const seen = new Set();
    const out = [];
    (list||[]).forEach(t=>{
      const key = (t.title||'')+'|'+(t.subtitle||'')+'|'+(t.type||'');
      if(!seen.has(key)){ seen.add(key); out.push(t); }
    });
    return out;
  }

  function augmentWorkflowWithChecklists(museum, wf){
    try{
      const age = getAgeGroup();
      const cl = museum && museum.checklists || {};
      const parentArr = cl.parent && cl.parent[age] || [];
      const childArr = cl.child && cl.child[age] || [];
      const enrouteAdds = parentArr.slice(0,1).map((text, i)=>({
        id: `cl:${museum.id}:parent:${age}:${i}`,
        role: 'parent', type: 'tts', title: normalizeTitle(text), subtitle: text, ages: [age], source:{from:'checklist', museumId: museum.id, role:'parent', age, index:i}
      }));
      const visitAdds = childArr.slice(0,1).map((text, i)=>({
        id: `cl:${museum.id}:child:${age}:${i}`,
        role: 'child', type: 'confirm', title: normalizeTitle(text), subtitle: text, ages: [age], source:{from:'checklist', museumId: museum.id, role:'child', age, index:i}
      }));
      const collAdds = Array.isArray(museum.collections)
        ? museum.collections.slice(0,3).map((c, i)=>({
            id: `coll:${museum.id}:${i}`,
            role: 'child', type: 'confirm',
            title: normalizeTitle(c.name || '镇馆之宝'),
            subtitle: `镇馆之宝：找到「${c.name||''}」并合影`,
            ages: [age],
            source: { from: 'collections', museumId: museum.id, index: i, name: c && c.name }
          }))
        : [];
      const base = wf || buildDefaultWorkflow(museum);
      const merged = JSON.parse(JSON.stringify(base||{}));
      // New flat task structure - tasks is now just an array
      if(!merged.tasks) merged.tasks = [];
      if(!Array.isArray(merged.tasks)) merged.tasks = [];
      
      // Add any additional tasks if needed
      merged.tasks = dedupeTasks([].concat(merged.tasks, visitAdds, collAdds));
      
      // Ensure poster task is at the end if not already present
      const hasPoster = merged.tasks.some(t => t.type === 'poster');
      if(!hasPoster){
        merged.tasks.push({ 
          id: 'poster', 
          role: 'parent', 
          type: 'poster', 
          title: '成就海报', 
          subtitle: '生成专属成就海报', 
          ages: ['3-6','7-12','13-18'] 
        });
      }
      
      return merged;
    }catch(e){ return wf; }
  }
  if(typeof window!=='undefined'){
    window.__augmentWorkflowWithChecklists = augmentWorkflowWithChecklists;
  }

  function setStep(step){
    state.step = step;
    // toggle sections
    ['select','prep','enroute','visit','share'].forEach(s=>{
      const el = document.getElementById(`step-${s}`);
      if(el){ el.hidden = (s !== step); }
    });
    if(step === 'enroute'){
      renderParentTips();
    }
    // stepper UI
    $$('#sgStepper .sg-step').forEach(el=>{
      el.classList.toggle('active', el.dataset.step === step);
    });
    // lazy actions
    if(step === 'share') {
      generatePoster();
    }
  }

  // Build museum cards
  function renderMuseums(list){
    const grid = $('#sgGrid');
    grid.innerHTML = '';
    list.forEach(m => {
      const card = document.createElement('div');
      card.className = 'sg-card';
      const img = document.createElement('img');
      img.alt = m.name;
      img.loading = 'lazy';
      img.src = m.image || fallbackImage(m);
      const name = document.createElement('div');
      name.className = 'sg-card-name';
      name.textContent = m.name;
      const desc = document.createElement('div');
      desc.className = 'sg-card-desc';
      desc.textContent = (m.description || `${m.location || ''}`);
      card.append(img, name, desc);
      card.onclick = () => onSelectMuseum(m);
      grid.appendChild(card);
    });
  }

  function fallbackImage(m){
    return 'https://img.alicdn.com/imgextra/i1/O1CN01KpFf3i1o3mGq7s4rW_!!6000000005164-2-tps-1200-628.png';
  }

  function hasAvailableWorkflow(museum){
    try {
      const wfs = getWorkflowsForMuseum(museum);
      return Array.isArray(wfs) && wfs.length > 0;
    } catch(e){ return false; }
  }

  function onSelectMuseum(m){
    state.selectedMuseum = m;
    // Update header museum name
    const headerName = document.getElementById('headerMuseumName');
    if(headerName && m){
      headerName.textContent = m.name || '';
    }
    // Optional: load workflows for this museum
    setupWorkflowPicker(m);
    // Apply default/explicit workflow selection without showing picker
    applyWorkflowSettingForMuseum(m);
    // Skip prep/enroute steps for Pinghu Museum (simplified workflow)
    // Simplified flow: after museum selection, show workflow picker in select step
    // User clicks "开始探险" button to start visit step
    renderWorkflowDisplay();
  }

  // Web Speech API TTS
  function speak(text){
    try{
      if('speechSynthesis' in window){
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    }catch(e){
      // no-op
    }
  }

  // Enroute TTS binding
  function bindEnrouteTTS(){
    $$('#step-enroute [data-tts]').forEach(btn => {
      btn.onclick = () => speak(btn.dataset.tts || btn.textContent);
    });
    const arrived = document.getElementById('sgArrived');
    if(arrived){
      arrived.onclick = () => {
        state.innerTaskIndex = 0;
        setStep('visit');
        updateInnerTaskVisibility();
      };
    }
  }

  function getParentTipsFor(museum, age){
    const id = museum && museum.id;
    const generic = [
      { kind: '故事', text: '从前在皇宫里，有一位小太监第一次看见龙纹，他以为是真龙，结果只是屋檐上的“走兽”。' },
      { kind: '谜语', text: '身披绿衣常居园，夏日遮荫不怕寒。猜一植物。（树）' },
      { kind: '笑话', text: '小朋友参观时问：“皇帝为什么要那么多房间？”爸爸答：“因为他作业很多，需要很多书桌。”' },
    ];
    if(id === 'forbidden-city'){
      return [
        { kind: '故事', text: '太和殿是举行大典的地方，古时百官在广场排队等皇帝出场，场面非常壮观。' },
        { kind: '谜语', text: '金瓦映日光，红墙护殿堂，屋檐排小兽，威风把门当。（打一建筑元素）' },
        { kind: '笑话', text: '“门上为什么有那么多门钉？”“因为古代也流行‘防撞条’。”' },
      ];
    }
    if(id === 'national-museum'){
      return [
        { kind: '故事', text: '四羊方尊被称为“青铜艺术的高峰”，上面四只羊寓意吉祥与和谐。' },
        { kind: '谜语', text: '方中见圆口，古人盛礼用。（打一文物器型）' },
        { kind: '笑话', text: '看到大鼎，小朋友问：“煮面会不会粘锅？”爸爸：“得先找一把很大的锅铲。”' },
      ];
    }
    if(id === 'shanghai-museum'){
      return [
        { kind: '故事', text: '青铜器是用铜和锡等金属熔铸而成，陶瓷则是泥土烧制，材料与工艺都不同。' },
        { kind: '谜语', text: '胎白釉青花，火中变彩霞。（打一工艺品）' },
        { kind: '笑话', text: '小朋友看青铜尊：“这是古代的大水杯吗？”家长：“容量可能够全家一起喝。”' },
      ];
    }
    if(id === 'shanghai-science-technology-museum'){
      return [
        { kind: '故事', text: '有些互动展项能展示磁力、光影、声音等科学原理，边玩边学最有效。' },
        { kind: '谜语', text: '看不见会吸铁，隔空也牵连。（打一自然现象）' },
        { kind: '笑话', text: '“我找到重力了！”“它一直都在，只是你今天特别留意。”' },
      ];
    }
    return generic;
  }

  function renderParentTips(){
    const box = document.getElementById('sgParentTips');
    if(!box) return;
    const m = state.selectedMuseum;
    const age = getAgeGroup();
    const tips = getParentTipsFor(m, age);
    if(!tips || !tips.length){ box.innerHTML = ''; return; }
    box.innerHTML = tips.map(t => `<div><strong>${t.kind}</strong>：${t.text}</div>`).join('');
  }

  // ---------- Workflows (optional) ----------
  function getWorkflowsForMuseum(museum){
    try{
      const id = museum && museum.id;
      // Check for workflows in museum object first (centralized data), then fall back to global WORKFLOWS
      let all = [];
      if (museum && Array.isArray(museum.workflows)) {
        all = museum.workflows;
      } else if (window.WORKFLOWS && window.WORKFLOWS[id]) {
        all = window.WORKFLOWS[id];
      }
      const list = Array.isArray(all) ? all : [];
      const age = getAgeGroup();
      // filter by workflow ages if provided
      return list.filter(wf => !wf.ages || wf.ages.includes(age));
    }catch(e){ return []; }
  }

  function setupWorkflowPicker(museum){
    let list = getWorkflowsForMuseum(museum);
    // sort by caregiver suitability (non-destructive)
    const role = getCaregiverRole();
    const score = (wf)=>{
      try{
        const tasks = (wf.tasks && Array.isArray(wf.tasks)) ? wf.tasks : [];
        const p = tasks.filter(t=>t.role==='parent').length;
        const c = tasks.filter(t=>t.role==='child').length;
        const total = Math.max(1, p + c);
        if(role === 'grandparent') return (p/total)*2 + (1 - Math.abs(p - c)/total); // 更偏家长且均衡加分
        if(role === 'parent') return (p/total) + (1 - Math.abs(p - c)/total); // 适度偏家长
        if(role === 'teacher') return (c/total)*2 + (1 - Math.abs(p - c)/total); // 偏孩子任务
        return (1 - Math.abs(p - c)/total); // 其他：更均衡
      }catch(e){ return 0; }
    };
    list = list.slice().sort((a,b)=> score(b) - score(a));
    state.workflows = list;
    state.selectedWorkflow = null;
    state.wfMode = false;
    state.wfVisitCount = 0;
    
    // Show workflow display if workflows exist
    const displayWrap = $('#sgWorkflowDisplayWrap');
    const workflowCard = $('#sgWorkflowCard');
    const pickerSection = $('#sgWorkflowPickerSection');
    const picker = $('#sgWorkflowPicker');
    
    if(list.length === 0){
      // No workflows, hide everything
      if(displayWrap) displayWrap.style.display = 'none';
    } else if(list.length === 1){
      // Single workflow: show as informative card
      if(displayWrap) displayWrap.style.display = 'block';
      if(workflowCard) workflowCard.style.display = 'block';
      if(pickerSection) pickerSection.style.display = 'none';
      
      const wf = list[0];
      const totalTasks = ((wf.tasks?.enroute || []).length + (wf.tasks?.visit || []).length);
      const cardName = $('#sgWorkflowCardName');
      const cardDesc = $('#sgWorkflowCardDesc');
      const cardTasks = $('#sgWorkflowCardTasks');
      
      if(cardName) cardName.textContent = wf.name;
      if(cardDesc) cardDesc.textContent = wf.description;
      if(cardTasks) cardTasks.textContent = `📋 包含 ${totalTasks} 个任务`;
    } else {
      // Multiple workflows: show picker with enhanced display
      if(displayWrap) displayWrap.style.display = 'block';
      if(workflowCard) workflowCard.style.display = 'none';
      if(pickerSection) pickerSection.style.display = 'block';
      
      if(picker){
        // Clear and populate picker
        picker.innerHTML = '<option value="">请选择一个参观路线</option>';
        list.forEach(wf => {
          const opt = document.createElement('option');
          opt.value = wf.id;
          opt.textContent = wf.name;
          picker.appendChild(opt);
        });
        
        // Add change handler to update description
        picker.onchange = ()=>{
          const selectedId = picker.value;
          const wf = list.find(w => w.id === selectedId);
          const descDiv = $('#sgWorkflowPickerDesc');
          
          if(wf && descDiv){
            const totalTasks = ((wf.tasks?.enroute || []).length + (wf.tasks?.visit || []).length);
            descDiv.innerHTML = `<strong>${wf.description}</strong><br><span style="font-size: 13px; color: #6c757d;">📋 包含 ${totalTasks} 个任务</span>`;
            descDiv.style.display = 'block';
            
            // Apply the selected workflow
            setWorkflowSetting(museum.id, selectedId);
            applyWorkflowSettingForMuseum(museum);
          } else if(descDiv){
            descDiv.style.display = 'none';
          }
        };
      }
    }
  }

  function getWorkflowSetting(museumId){
    try{ return localStorage.getItem(`wf:${museumId}`) || ''; }catch(e){ return ''; }
  }

  function setWorkflowSetting(museumId, wfId){
    try{
      if(wfId) localStorage.setItem(`wf:${museumId}`, wfId);
      else localStorage.removeItem(`wf:${museumId}`);
    }catch(e){}
  }

  function chooseDefaultWorkflow(museum){
    const list = state.workflows || [];
    if(!list.length) return null;
    const stored = getWorkflowSetting(museum.id);
    if(stored){
      const found = list.find(x=> x.id === stored);
      if(found) return found;
    }
    // Auto: pick top-scored (already sorted)
    return list[0] || null;
  }

  function applyWorkflowSettingForMuseum(museum){
    let wf = chooseDefaultWorkflow(museum);
    // If no configured workflows available for this age, fall back to default basic workflow
    if(!wf){
      wf = buildDefaultWorkflow(museum);
    }
    try{
      if(isMvpCombo(museum)){
        wf = buildForbiddenCityGrandparentMvpRoute(museum);
      }
    }catch(e){}
    if(getFeatureFlagClAugment()){
      wf = augmentWorkflowWithChecklists(museum, wf);
    }
    state.selectedWorkflow = wf || null;
    state.wfMode = !!wf;
    state.innerTaskIndex = 0;
    renderWorkflowEnroute();
    renderWorkflowVisit();
    updateInnerTaskVisibility();
  }

  function buildDefaultWorkflow(museum){
    // Map the existing static three-step visit flow into a workflow structure
    return {
      id: 'default-basic',
      name: '基础三步走',
      description: '默认路线：门口打卡-馆内寻找-胜利合影',
      tasks: {
        enroute: [],
        visit: [
          { id: 'gate-photo', role: 'parent', type: 'photo', title: '门口打卡', subtitle: '在博物馆门口合影' },
          { id: 'find-treasure', role: 'child', type: 'confirm', title: '寻找宝藏', subtitle: '找到一件喜欢的展品，说出你看到的两个细节' },
          { id: 'victory-photo', role: 'parent', type: 'photo', title: '胜利合影', subtitle: '在大厅或出口处合影' }
        ]
      }
    };
  }

  function renderWorkflowEnroute(){
    const box = $('#sgWorkflowEnroute');
    if(!box) return;
    box.innerHTML = '';
    // No more enroute stage in simplified workflow
    box.style.display = 'none';
  }

  // Helper function to complete a workflow visit task
  function completeWorkflowTask(idx, taskId) {
    state.completedVisit[idx] = true;
    try{ 
      if(state.selectedMuseum && taskId){ 
        __markDone(state.selectedMuseum.id, taskId, true); 
      } 
    }catch(err){}
    
    const last = Math.max(0, state.wfVisitCount - 1);
    if(state.innerTaskIndex < last){
      state.prevInnerTaskIndex = state.innerTaskIndex;
      state.innerTaskIndex++;
      updateInnerTaskVisibility();
    } else if(idx === last) {
      // All workflow tasks completed, advance to share step
      setStep('share');
    }
  }

  function renderWorkflowVisit(){
    const box = $('#sgWorkflowVisit');
    const staticBox = $('#sgVisitTasks');
    if(!box || !staticBox) return;
    box.innerHTML = '';
    const wf = state.selectedWorkflow;
    const age = getAgeGroup();
    // Use flat tasks array, filter out poster tasks for now (they're handled separately in share step)
    let tasks = (wf && wf.tasks && Array.isArray(wf.tasks)) ? wf.tasks.filter(t => t.type !== 'poster') : [];
    tasks = tasks.filter(t => !t.ages || t.ages.includes(age));
    state.wfVisitCount = tasks.length;
    if(!tasks.length){
      box.style.display = 'none';
      staticBox.style.display = '';
      state.wfMode = false;
      return;
    }
    state.completedVisit = {}; // reset completion per render
    tasks.forEach((t, idx) => {
      const section = document.createElement('div');
      section.className = 'sg-section sg-task-card';
      section.id = `wtask-${idx}`;
      section.style.padding = '24px';
      
      // Task number indicator
      const stepNum = document.createElement('div');
      stepNum.style.fontSize = '14px';
      stepNum.style.color = '#6b7280';
      stepNum.style.marginBottom = '8px';
      stepNum.style.fontWeight = '600';
      stepNum.textContent = `第 ${idx+1}/${tasks.length} 步`;
      section.appendChild(stepNum);
      
      // role badge
      const badge = document.createElement('span');
      badge.className = 'sg-role-badge' + (t.role === 'child' ? ' child' : '');
      badge.textContent = (t.role === 'parent') ? '👨‍👩‍👧 家长' : (t.role === 'child' ? '🧒 孩子' : '');
      section.appendChild(badge);
      
      const ttl = document.createElement('div');
      ttl.className = 'sg-title';
      ttl.style.fontSize = '26px';
      ttl.style.fontWeight = '800';
      ttl.style.marginTop = '12px';
      ttl.style.marginBottom = '12px';
      ttl.textContent = t.title || '任务';
      section.appendChild(ttl);
      
      const sub = document.createElement('div');
      sub.className = 'sg-subtitle';
      sub.style.fontSize = '18px';
      sub.style.lineHeight = '1.6';
      sub.style.marginBottom = '16px';
      sub.textContent = t.subtitle || '';
      section.appendChild(sub);
      
      // Optional image preview for collection tasks
      try{
        if(t.imageUrl){
          const imgLabel = document.createElement('div');
          imgLabel.style.fontSize = '14px';
          imgLabel.style.color = '#6b7280';
          imgLabel.style.marginBottom = '8px';
          imgLabel.style.fontWeight = '600';
          imgLabel.textContent = '📸 参考图片：';
          section.appendChild(imgLabel);
          
          const img = document.createElement('img');
          img.src = t.imageUrl;
          img.alt = '镇馆之宝图片';
          img.style.width = '100%';
          img.style.maxHeight = '280px';
          img.style.objectFit = 'contain';
          img.style.borderRadius = '12px';
          img.style.border = '2px solid #e9ecef';
          img.style.marginBottom = '20px';
          img.style.backgroundColor = '#f8f9fa';
          section.appendChild(img);
        }
      }catch(e){}

      if(t.type === 'photo'){
        const cameraHint = document.createElement('div');
        cameraHint.style.fontSize = '16px';
        cameraHint.style.color = '#2e7cf6';
        cameraHint.style.marginBottom = '12px';
        cameraHint.style.fontWeight = '600';
        // Use subtitle text if available to provide specific guidance
        cameraHint.textContent = t.subtitle ? `📷 ${t.subtitle}` : '📷 请拍照完成任务';
        section.appendChild(cameraHint);
        
        // Create wrapper for input and preview
        const photoWrapper = document.createElement('div');
        photoWrapper.id = `photo-wrapper-${idx}`;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture','environment');
        input.setAttribute('aria-label','打开相机');
        input.id = `photo-input-${idx}`;
        input.style.display = 'block';
        input.style.width = '100%';
        input.style.padding = '16px';
        input.style.fontSize = '18px';
        input.style.fontWeight = '700';
        input.style.border = '3px dashed #2e7cf6';
        input.style.borderRadius = '12px';
        input.style.backgroundColor = '#f0f7ff';
        input.style.cursor = 'pointer';
        input.style.marginBottom = '12px';
        
        const preview = document.createElement('div');
        preview.className = 'sg-photo';
        preview.id = `wpreview-${idx}`;
        preview.style.position = 'relative';
        preview.style.marginBottom = '12px';
        
        // Create retake button (initially hidden)
        const retakeBtn = document.createElement('button');
        retakeBtn.className = 'sg-btn sg-btn-secondary';
        retakeBtn.textContent = '🔄 重新拍照';
        retakeBtn.style.display = 'none';
        retakeBtn.style.width = '100%';
        retakeBtn.style.marginTop = '12px';
        retakeBtn.style.fontSize = '16px';
        retakeBtn.style.fontWeight = '700';
        retakeBtn.style.padding = '14px';
        retakeBtn.onclick = () => {
          // Clear preview and show input again
          preview.innerHTML = '';
          input.value = '';
          input.style.display = 'block';
          retakeBtn.style.display = 'none';
          state.completedVisit[idx] = false;
          // Clear stored photos for this task
          delete state.photos[`wf-${idx}`];
          // Update UI to reflect state changes
          updateInnerTaskVisibility();
        };
        
        input.addEventListener('change', async (e)=> {
          // Clear any previous error styling
          input.style.border = '3px dashed #2e7cf6';
          input.style.backgroundColor = '#f0f7ff';
          
          const success = await handlePhotoInput(e, `wf-${idx}`, `#wpreview-${idx}`);
          if(!success) {
            // Highlight input field to encourage retry
            input.style.border = '3px dashed #ef4444';
            input.style.backgroundColor = '#fef2f2';
            // Reset input value so user can select same file again if needed
            input.value = '';
            return;
          }
          
          // Hide input and show retake button after successful photo
          input.style.display = 'none';
          retakeBtn.style.display = 'block';
          
          // Show immediate feedback for treasure photos
          if(t.role === 'child' && t.type === 'photo'){
            showToast('📸 拍照成功！找到宝藏了！');
          } else {
            showToast('📸 照片已保存！');
          }
          
          completeWorkflowTask(idx, t.id);
        });
        
        photoWrapper.appendChild(input);
        photoWrapper.appendChild(preview);
        photoWrapper.appendChild(retakeBtn);
        section.appendChild(photoWrapper);
        
        // Add "Complete" button when photos are optional
        if(!isPhotoRequired()){
          const skipActions = document.createElement('div');
          skipActions.className = 'sg-actions';
          skipActions.style.marginTop = '12px';
          
          const skipBtn = document.createElement('button');
          skipBtn.className = 'sg-btn sg-btn-secondary';
          skipBtn.textContent = '完成（跳过拍照）';
          skipBtn.style.fontSize = '16px';
          skipBtn.style.fontWeight = '700';
          skipBtn.style.padding = '14px';
          skipBtn.onclick = () => {
            showToast('✅ 已完成，进入下一步！');
            completeWorkflowTask(idx, t.id);
          };
          
          skipActions.appendChild(skipBtn);
          section.appendChild(skipActions);
        }
      } else {
        const actions = document.createElement('div');
        actions.className = 'sg-actions';
        const done = document.createElement('button');
        done.className = 'sg-btn sg-btn-primary';
        done.textContent = '我完成了';
        done.onclick = () => {
          completeWorkflowTask(idx, t.id);
        };
        actions.appendChild(done);
        section.appendChild(actions);
      }
      box.appendChild(section);
      
      // Add preview of next task (grayed out)
      if(idx < tasks.length - 1){
        const nextTask = tasks[idx + 1];
        const preview = document.createElement('div');
        preview.className = 'sg-section';
        preview.id = `wpreview-next-${idx}`;
        preview.style.opacity = '0.4';
        preview.style.pointerEvents = 'none';
        preview.style.padding = '16px';
        preview.style.marginTop = '16px';
        preview.style.backgroundColor = '#f8f9fa';
        preview.style.border = '2px dashed #dee2e6';
        
        const previewLabel = document.createElement('div');
        previewLabel.style.fontSize = '14px';
        previewLabel.style.color = '#6b7280';
        previewLabel.style.marginBottom = '8px';
        previewLabel.style.fontWeight = '700';
        previewLabel.textContent = `🔒 下一步：第 ${idx+2}/${tasks.length} 步`;
        preview.appendChild(previewLabel);
        
        const previewTitle = document.createElement('div');
        previewTitle.style.fontSize = '18px';
        previewTitle.style.fontWeight = '700';
        previewTitle.style.marginBottom = '6px';
        previewTitle.textContent = nextTask.title || '任务';
        preview.appendChild(previewTitle);
        
        const previewSub = document.createElement('div');
        previewSub.style.fontSize = '14px';
        previewSub.style.color = '#6b7280';
        previewSub.textContent = nextTask.subtitle || '';
        preview.appendChild(previewSub);
        
        box.appendChild(preview);
      }
    });
    staticBox.style.display = 'none';
    box.style.display = '';
  }

  // Visit flow controls
  function initVisitFlow(){
    const prev = $('#sgVisitPrev');
    const next = $('#sgVisitNext');
    if(prev) prev.onclick = () => {
      if(state.innerTaskIndex > 0){
        state.prevInnerTaskIndex = state.innerTaskIndex;
        state.innerTaskIndex--;
      }
      updateInnerTaskVisibility();
    };
    if(next) next.onclick = () => {
      const lastIndex = state.wfMode ? Math.max(0, state.wfVisitCount - 1) : 2;
      // Gate by completion
      const cur = state.innerTaskIndex;
      const done = !!state.completedVisit[cur];
      if(!done){ showToast('请先完成当前步骤'); return; }
      if(state.innerTaskIndex < lastIndex){
        state.prevInnerTaskIndex = state.innerTaskIndex;
        state.innerTaskIndex++;
      } else setStep('share');
      updateInnerTaskVisibility();
    };

    // Found jade advances a step
    const found = $('#foundJade');
    if(found) found.onclick = () => {
      if(state.innerTaskIndex < 2) {
        state.innerTaskIndex++;
        updateInnerTaskVisibility();
      }
    };

    // Camera inputs
    const camEntrance = $('#camEntrance');
    const camVictory = $('#camVictory');
    if(camEntrance) camEntrance.addEventListener('change', async (e)=> { 
      const success = await handlePhotoInput(e, 'entrance', '#photoEntrance'); 
      if(!success) {
        // Reset input for retry
        camEntrance.value = '';
        return;
      }
      showToast('📸 门口打卡成功！');
      state.completedVisit[0]=true; 
      if(state.innerTaskIndex===0){ state.prevInnerTaskIndex=0; state.innerTaskIndex=1; } 
      updateInnerTaskVisibility(); 
    });
    if(camVictory) camVictory.addEventListener('change', async (e)=> { 
      const success = await handlePhotoInput(e, 'victory', '#photoVictory'); 
      if(!success) {
        // Reset input for retry
        camVictory.value = '';
        return;
      }
      showToast('📸 胜利合影完成！');
      state.completedVisit[2]=true; 
      setStep('share'); 
      updateInnerTaskVisibility(); 
    });

    updateInnerTaskVisibility();
  }

  function updateInnerTaskVisibility(){
    if(state.wfMode && state.wfVisitCount > 0){
      // Show all workflow tasks for smooth one-page scrolling experience
      const wsections = Array.from(document.querySelectorAll('[id^="wtask-"]'));
      wsections.forEach((el, idx)=>{
        // Always show all tasks (not just current + completed)
        el.style.display = 'block';
        
        // Apply visual state classes
        el.classList.remove('sg-task-completed', 'sg-task-current', 'sg-task-upcoming');
        
        if(idx < state.innerTaskIndex){
          // Completed tasks: dimmed with checkmark
          el.classList.add('sg-task-completed');
        } else if(idx === state.innerTaskIndex){
          // Current task: highlighted
          el.classList.add('sg-task-current');
        } else {
          // Upcoming tasks: dimmed and disabled
          el.classList.add('sg-task-upcoming');
        }
      });
      
      // Hide preview sections (not needed since all tasks are visible)
      const previews = Array.from(document.querySelectorAll('[id^="wpreview-next-"]'));
      previews.forEach((el)=>{
        el.style.display = 'none';
      });
      
      // ensure visibility containers state
      const box = $('#sgWorkflowVisit');
      const staticBox = $('#sgVisitTasks');
      if(box) box.style.display = '';
      if(staticBox) staticBox.style.display = 'none';
      // progress bar & hint
      updateVisitProgressAndHint();
      // celebration & toast on forward step
      if(state.prevInnerTaskIndex < state.innerTaskIndex){
        const tasks = getCurrentVisitTasks();
        const completed = tasks[state.prevInnerTaskIndex];
        if(completed && completed.role === 'child'){
          showToast('你观察得真细！✅');
        }
        playMicroCelebrate();
        // Auto-scroll to current task after a short delay
        setTimeout(()=>{
          // Bounds check to ensure valid task index
          if(state.innerTaskIndex >= 0 && state.innerTaskIndex < state.wfVisitCount){
            const currentTask = document.querySelector(`#wtask-${state.innerTaskIndex}`);
            if(currentTask){
              currentTask.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }, 300);
      }
      state.prevInnerTaskIndex = state.innerTaskIndex;
      return;
    }
    // fallback to static 3 tasks
    const steps = ['#task-1','#task-2','#task-3'];
    steps.forEach((sel,i)=>{
      const el = $(sel);
      if(el) el.style.display = (i === state.innerTaskIndex ? 'block' : 'none');
    });
    updateVisitProgressAndHint();
    if(state.prevInnerTaskIndex < state.innerTaskIndex){
      showToast('做得好！继续保持！✅');
      playMicroCelebrate();
    }
    state.prevInnerTaskIndex = state.innerTaskIndex;
  }

  function getCurrentVisitTasks(){
    const wf = state.selectedWorkflow;
    const age = getAgeGroup();
    let tasks = (wf && wf.tasks && Array.isArray(wf.tasks)) ? wf.tasks.filter(t => t.type !== 'poster') : [];
    return tasks.filter(t => !t.ages || t.ages.includes(age));
  }

  function updateVisitProgressAndHint(){
    const progWrap = $('#sgVisitProgress');
    const progText = $('#sgVisitProgressText');
    const progBar = $('#sgVisitProgressBar');
    const hint = $('#sgVisitHint');
    const total = state.wfMode && state.wfVisitCount > 0 ? state.wfVisitCount : 3;
    const cur = state.innerTaskIndex + 1;
    if(progWrap && progText && progBar){
      progWrap.style.display = '';
      progText.textContent = `步骤 ${cur}/${total}`;
      const pct = Math.max(0, Math.min(100, Math.round(cur/total*100)));
      progBar.style.width = pct + '%';
    }
    if(hint){
      // next step hint
      let nextTitle = '';
      if(cur < total){
        if(state.wfMode && state.wfVisitCount > 0){
          const tasks = getCurrentVisitTasks();
          nextTitle = tasks[cur] && tasks[cur].title ? tasks[cur].title : '下一步';
        } else {
          nextTitle = cur===1 ? '寻找宝藏' : '胜利合影';
        }
        hint.textContent = `下一步：${nextTitle}`;
      } else {
        hint.textContent = '完成后生成海报';
      }
    }
  }

  function showToast(msg){
    const t = $('#sgToast');
    if(!t) return;
    t.textContent = msg || '';
    t.style.display = 'block';
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(()=>{ t.style.display = 'none'; }, 1800);
  }

  function playMicroCelebrate(){
    try{ if(navigator.vibrate) navigator.vibrate([10, 25]); }catch(e){}
    // simple emoji burst
    const container = document.body;
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.bottom = '90px';
    el.style.transform = 'translateX(-50%)';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '90';
    const emojis = ['🎉','👏','😊','🌟','🥳'];
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    el.style.fontSize = '28px';
    el.style.opacity = '0.95';
    el.style.transition = 'all .6s ease';
    container.appendChild(el);
    requestAnimationFrame(()=>{
      el.style.bottom = '140px';
      el.style.opacity = '0';
    });
    setTimeout(()=>{ el.remove(); }, 650);
  }

  // Compress photo to reduce memory usage and file size
  // Photos are used for social media posters with multiple images, so aggressive compression is appropriate
  // Default: 800px width, 65% quality - reduces 2MB+ photos to ~100-200KB while maintaining good visual quality
  async function compressPhoto(file, maxWidth = 800, quality = 0.65) {
    return new Promise((resolve, reject) => {
      try {
        // Tiered compression based on file size
        const fileSizeMB = file.size / (1024 * 1024);
        let targetWidth = maxWidth;
        let targetQuality = quality;
        
        // More aggressive compression for larger files to prevent memory issues on mobile devices
        if (fileSizeMB > 5) {
          // Extremely large files (>5MB): maximum compression to prevent memory errors
          targetWidth = Math.min(maxWidth, 600);
          targetQuality = Math.min(quality, 0.55);
        } else if (fileSizeMB > 2) {
          // Large files (2-5MB): aggressive compression
          targetWidth = Math.min(maxWidth, 700);
          targetQuality = Math.min(quality, 0.6);
        } else if (fileSizeMB < 0.5) {
          // Small files: use less aggressive compression
          targetWidth = Math.min(maxWidth, 1000);
          targetQuality = Math.min(quality + 0.1, 0.8);
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              // Calculate new dimensions
              let width = img.width;
              let height = img.height;
              if (width > targetWidth) {
                height = (height * targetWidth) / width;
                width = targetWidth;
              }
              
              // Additional safety: cap maximum pixels to prevent memory issues
              const maxPixels = 1000000; // 1 megapixel max for canvas
              if (width * height > maxPixels) {
                const scale = Math.sqrt(maxPixels / (width * height));
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
              }
              
              // Create canvas and compress
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              
              // Check if context was created successfully
              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }
              
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to blob with tiered quality
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    // Log compression results for monitoring
                    const originalSizeKB = (file.size / 1024).toFixed(2);
                    const compressedSizeKB = (blob.size / 1024).toFixed(2);
                    const compressionRatio = ((1 - blob.size / file.size) * 100).toFixed(1);
                    console.log(`Photo compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${compressionRatio}% reduction)`);
                    
                    // Create a new File object from blob
                    const compressedFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    resolve(compressedFile);
                  } else {
                    reject(new Error('Compression failed'));
                  }
                },
                'image/jpeg',
                targetQuality
              );
            } catch(err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      } catch(err) {
        reject(err);
      }
    });
  }

  // Helper function to create photo preview element
  function createPhotoPreview(url) {
    const imgContainer = document.createElement('div');
    imgContainer.style.position = 'relative';
    imgContainer.style.marginBottom = '12px';
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'photo';
    img.style.width = '100%';
    img.style.maxWidth = '400px';
    img.style.height = 'auto';
    img.style.borderRadius = '12px';
    img.style.border = '3px solid #22c55e';
    img.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.2)';
    
    // Add success badge
    const badge = document.createElement('div');
    badge.textContent = '✅ 拍照成功';
    badge.style.position = 'absolute';
    badge.style.top = '10px';
    badge.style.right = '10px';
    badge.style.background = '#22c55e';
    badge.style.color = 'white';
    badge.style.padding = '6px 12px';
    badge.style.borderRadius = '20px';
    badge.style.fontSize = '14px';
    badge.style.fontWeight = '700';
    badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    
    imgContainer.appendChild(img);
    imgContainer.appendChild(badge);
    return imgContainer;
  }

  // Helper function to check if an error is memory-related
  function isMemoryRelatedError(error) {
    if (!error) return false;
    return (error.message && error.message.toLowerCase().includes('memory')) ||
           error.name === 'QuotaExceededError' ||
           error.name === 'NS_ERROR_OUT_OF_MEMORY';
  }

  // Helper function to show retryable error with clear guidance
  function showRetryableError(previewEl, message) {
    if (!previewEl) return;
    
    // Clear existing content to avoid accumulating error messages
    previewEl.innerHTML = '';
    
    const errorBox = document.createElement('div');
    errorBox.style.padding = '20px';
    errorBox.style.borderRadius = '12px';
    errorBox.style.border = '3px solid #ef4444';
    errorBox.style.backgroundColor = '#fef2f2';
    errorBox.style.marginBottom = '12px';
    errorBox.style.textAlign = 'center';
    
    const errorIcon = document.createElement('div');
    errorIcon.textContent = '⚠️';
    errorIcon.style.fontSize = '36px';
    errorIcon.style.marginBottom = '12px';
    errorBox.appendChild(errorIcon);
    
    const errorMsg = document.createElement('div');
    errorMsg.textContent = message;
    errorMsg.style.fontSize = '16px';
    errorMsg.style.fontWeight = '700';
    errorMsg.style.color = '#dc2626';
    errorMsg.style.marginBottom = '12px';
    errorBox.appendChild(errorMsg);
    
    const retryHint = document.createElement('div');
    retryHint.textContent = '💡 提示：点击上方拍照按钮重试';
    retryHint.style.fontSize = '14px';
    retryHint.style.color = '#6b7280';
    retryHint.style.marginTop = '8px';
    errorBox.appendChild(retryHint);
    
    previewEl.appendChild(errorBox);
    
    // Also show toast for immediate feedback
    showToast(message);
  }

  async function handlePhotoInput(evt, key, previewSel){
    try {
      const files = Array.from(evt.target.files || []);
      if(!files.length) return false;
      const preview = document.querySelector(previewSel);
      if(!preview) return false;
      preview.innerHTML = '';
      
      // Compress photos to reduce memory usage
      const compressedFiles = [];
      const limit = Math.min(files.length, 3);
      for(let i=0;i<limit;i++){
        const f = files[i];
        try {
          // Try to compress, fallback to original if compression fails
          const compressed = await compressPhoto(f);
          compressedFiles.push(compressed);
          
          // Show prominent preview with success indicator
          const url = URL.createObjectURL(compressed);
          preview.appendChild(createPhotoPreview(url));
        } catch(compressErr) {
          const fileSizeKB = (f.size / 1024).toFixed(2);
          console.warn(`Photo compression failed for ${f.name} (${fileSizeKB}KB), using original:`, compressErr.message || compressErr);
          
          // Check if it's a memory-related error
          if (isMemoryRelatedError(compressErr)) {
            // Memory error - don't try to use original file, show specific error
            console.error('Memory error during photo processing:', compressErr);
            showRetryableError(preview, '内存不足 😅 请重新拍照试试');
            return false;
          }
          
          // Other errors - try using original file
          compressedFiles.push(f);
          
          // Show preview with original
          const url = URL.createObjectURL(f);
          preview.appendChild(createPhotoPreview(url));
        }
      }
      
      state.photos[key] = compressedFiles;
      return true;
    } catch(e) {
      console.error('Photo handling error:', e);
      
      // Check if it's a memory-related error
      if (isMemoryRelatedError(e)) {
        const preview = document.querySelector(previewSel);
        showRetryableError(preview, '内存不足 😅 请重新拍照试试');
      } else {
        showToast('照片加载失败，请重试 ⚠️');
      }
      return false;
    }
  }

  // Poster generation
  function getChildNickname(){
    try {
      const v = localStorage.getItem('childNickname');
      if(v && v.trim()) return v.trim();
    } catch(e) {}
    return '小小探险家';
  }

  // Helper function: Draw Minecraft-style corner decorations
  function drawMinecraftCorners(ctx, width, height) {
    const blockSize = 16;
    const cornerColors = ['#4a7c2f', '#8b4513', '#7c4a2f'];
    
    // Draw pixelated corner blocks (3x3 blocks)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const color = cornerColors[Math.floor(Math.random() * cornerColors.length)];
        ctx.fillStyle = color;
        
        // Top-left corner
        ctx.fillRect(20 + i * blockSize, 20 + j * blockSize, blockSize - 2, blockSize - 2);
        // Top-right corner
        ctx.fillRect(width - 20 - (i + 1) * blockSize, 20 + j * blockSize, blockSize - 2, blockSize - 2);
        // Bottom-left corner
        ctx.fillRect(20 + i * blockSize, height - 20 - (j + 1) * blockSize, blockSize - 2, blockSize - 2);
        // Bottom-right corner
        ctx.fillRect(width - 20 - (i + 1) * blockSize, height - 20 - (j + 1) * blockSize, blockSize - 2, blockSize - 2);
      }
    }
  }

  function generatePoster(){
    const canvas = document.getElementById('posterCanvas');
    const preview = document.getElementById('posterPreview');
    if(!canvas || !preview) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    // bg
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#a8d8ea');
    grad.addColorStop(1,'#5ab4d1');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // Minecraft corner decorations
    drawMinecraftCorners(ctx, W, H);

    // title - unified format: {Museum}探索
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
    const museumTitle = state.selectedMuseum ? `${state.selectedMuseum.name}探索` : '博物馆探索';
    ctx.fillText(museumTitle, 40, 100);

    // nickname
    ctx.font = '28px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
    ctx.fillText(`${getChildNickname()} 今天完成了所有挑战！`, 40, 160);

    // photo slots - collect workflow photos if available
    const readAsImage = (file) => new Promise(resolve=>{
      const img = new Image();
      img.onload = ()=> resolve(img);
      img.onerror = ()=> resolve(null);
      img.src = URL.createObjectURL(file);
    });
    const picks = [];
    
    // Collect all workflow photos in order (wf-0, wf-1, wf-2, etc.)
    if(state.wfMode && state.wfVisitCount > 0){
      for(let i = 0; i < state.wfVisitCount; i++){
        const key = `wf-${i}`;
        if(state.photos[key] && state.photos[key][0]){
          picks.push(state.photos[key][0]);
        }
      }
    } else {
      // Fallback to old entrance/victory format for non-workflow mode
      if(state.photos.entrance && state.photos.entrance[0]) picks.push(state.photos.entrance[0]);
      if(state.photos.victory && state.photos.victory[0]) picks.push(state.photos.victory[0]);
    }

    if(picks.length === 0){
      // No user photos available - try to use museum image as fallback
      const museum = state.selectedMuseum;
      if(museum && museum.image){
        // Load museum image as fallback
        const museumImg = new Image();
        // Only set crossOrigin for external domains (CDN images)
        try {
          const imgUrl = new URL(museum.image, window.location.origin);
          if (imgUrl.origin !== window.location.origin) {
            museumImg.crossOrigin = 'anonymous';
          }
        } catch(e) {
          // Invalid URL, continue without crossOrigin
        }
        museumImg.onload = function(){
          // Draw museum image
          const imgWidth = 640;
          const imgHeight = 360;
          const imgX = (W - imgWidth) / 2;
          const imgY = 260;
          
          ctx.save();
          // Rounded corners - use compatible path approach
          ctx.beginPath();
          const radius = 12;
          ctx.moveTo(imgX + radius, imgY);
          ctx.lineTo(imgX + imgWidth - radius, imgY);
          ctx.arcTo(imgX + imgWidth, imgY, imgX + imgWidth, imgY + radius, radius);
          ctx.lineTo(imgX + imgWidth, imgY + imgHeight - radius);
          ctx.arcTo(imgX + imgWidth, imgY + imgHeight, imgX + imgWidth - radius, imgY + imgHeight, radius);
          ctx.lineTo(imgX + radius, imgY + imgHeight);
          ctx.arcTo(imgX, imgY + imgHeight, imgX, imgY + imgHeight - radius, radius);
          ctx.lineTo(imgX, imgY + radius);
          ctx.arcTo(imgX, imgY, imgX + radius, imgY, radius);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(museumImg, imgX, imgY, imgWidth, imgHeight);
          ctx.restore();
          
          // Add text overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(imgX, imgY + imgHeight - 50, imgWidth, 50);
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
          ctx.fillText('藏品照片 · 馆藏精选', imgX + 20, imgY + imgHeight - 20);
          
          // Add footer text
          ctx.fillStyle = '#ffffff';
          ctx.font = '22px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
          ctx.fillText('期待您拍摄更多精彩瞬间！', 40, imgY + imgHeight + 80);
          
          // Display poster
          preview.innerHTML = '';
          const out = new Image();
          out.src = canvas.toDataURL('image/png');
          out.style.maxWidth = '100%';
          out.style.borderRadius = '12px';
          preview.appendChild(out);
          canvas.style.display = 'none';
        };
        museumImg.onerror = function(){
          // Fallback to text-only poster
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
          ctx.fillText('暂无照片，完成任务后会自动生成海报', 40, 300);
          
          preview.innerHTML = '';
          const out = new Image();
          out.src = canvas.toDataURL('image/png');
          out.style.maxWidth = '100%';
          out.style.borderRadius = '12px';
          preview.appendChild(out);
          canvas.style.display = 'none';
        };
        museumImg.src = museum.image;
        return;
      } else {
        // No museum image available - show message only
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
        ctx.fillText('暂无照片，完成任务后会自动生成海报', 40, 300);
        
        // preview
        preview.innerHTML = '';
        const out = new Image();
        out.src = canvas.toDataURL('image/png');
        out.style.maxWidth = '100%';
        out.style.borderRadius = '12px';
        preview.appendChild(out);
        canvas.style.display = 'none';
        return;
      }
    }

    const work = picks.map(f=> readAsImage(f));
    Promise.all(work).then(images => {
      // Filter out null images (failed to load)
      const validImages = images.filter(img => img !== null);
      
      if(validImages.length === 0) return;

      // Dynamic layout based on photo count
      const photoCount = validImages.length;
      let startY = 260;
      let photoSize = 280;
      let cols = 2;
      let padding = 20;
      
      // Adjust layout for different photo counts
      if(photoCount <= 2){
        // 2 photos: side by side
        cols = 2;
        photoSize = 280;
      } else if(photoCount <= 4){
        // 3-4 photos: 2x2 grid
        cols = 2;
        photoSize = 200;
        padding = 15;
      } else {
        // 5+ photos: 3 columns or 2x3 grid
        cols = 3;
        photoSize = 180;
        padding = 12;
      }
      
      validImages.forEach((img, idx)=>{
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = 40 + col * (photoSize + padding);
        const y = startY + row * (photoSize + padding);
        
        // White border around photo
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(x-6, y-6, photoSize+12, photoSize+12);
        
        // Draw photo with aspect ratio fit
        const scale = Math.min(photoSize / img.width, photoSize / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const offsetX = (photoSize - scaledW) / 2;
        const offsetY = (photoSize - scaledH) / 2;
        
        ctx.drawImage(img, x + offsetX, y + offsetY, scaledW, scaledH);
      });

      // footer - adjust position based on number of photos
      const rows = Math.ceil(validImages.length / cols);
      const contentEndY = startY + rows * (photoSize + padding) + 40;
      const footerY = Math.max(contentEndY, H - 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
      const date = new Date().toLocaleDateString('zh-CN');
      ctx.fillText(`MuseumCheck · ${date}`, 40, footerY);

      // Adjust canvas height if needed
      if(contentEndY + 40 > H){
        canvas.height = contentEndY + 80;
      }

      // preview
      preview.innerHTML = '';
      const out = new Image();
      out.src = canvas.toDataURL('image/png');
      out.style.maxWidth = '100%';
      out.style.borderRadius = '12px';
      preview.appendChild(out);
      canvas.style.display = 'none';
    });
  }

  function onSavePoster(){
    const canvas = document.getElementById('posterCanvas');
    if(!canvas) return;
    const a = document.createElement('a');
    a.download = 'museum-poster.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  async function onSharePoster(){
    try{
      const canvas = document.getElementById('posterCanvas');
      if(!canvas) return;
      const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
      const files = [new File([blob], 'museum-poster.png', {type: 'image/png'})];
      if(navigator.canShare && navigator.canShare({ files })){
        await navigator.share({ files, title: '今天的博物馆小探险', text: '和家人分享我们的参观成果' });
      } else {
        onSavePoster();
      }
    } catch(e){
      onSavePoster();
    }
  }

  function filterMuseums(keyword){
    const kw = (keyword || '').trim();
    const base = MUSEUMS.filter(hasAvailableWorkflow);
    if(!kw) return base;
    const lower = kw.toLowerCase();
    return base.filter(m =>
      (m.name && m.name.toLowerCase().includes(lower)) ||
      (m.location && m.location.toLowerCase().includes(lower)) ||
      (Array.isArray(m.tags) && m.tags.some(t => (t||'').toLowerCase().includes(lower)))
    );
  }

  function initSelect(){
    const base = MUSEUMS.filter(hasAvailableWorkflow);
    renderMuseums(base.slice(0, 50)); // initial sample for perf
    const input = $('#sgSearch');
    const clear = $('#sgClear');
    if(input){
      input.addEventListener('input', ()=>{
        const list = filterMuseums(input.value);
        renderMuseums(list.slice(0, 100));
      });
    }
    if(clear){
      clear.onclick = ()=>{ input.value = ''; const base2 = MUSEUMS.filter(hasAvailableWorkflow); renderMuseums(base2.slice(0, 50)); input.focus(); };
    }
    // Bind "开始探险" button
    const startBtn = $('#sgStartWorkflow');
    if(startBtn){
      startBtn.onclick = ()=>{
        if(state.selectedWorkflow && state.selectedMuseum){
          state.innerTaskIndex = 0;
          renderWorkflowVisit();
          setStep('visit');
          updateInnerTaskVisibility();
        }
      };
    }
  }

  function initPrep(){
    const pack = $('#sgItemPack');
    const wear = $('#sgItemWear');
    // Hide non-mandatory items (pack, wear) from prep
    try{
      if(pack && pack.parentElement && pack.parentElement.parentElement){
        pack.parentElement.parentElement.hidden = true;
      }
      if(wear && wear.parentElement && wear.parentElement.parentElement){
        wear.parentElement.parentElement.hidden = true;
      }
    }catch(e){}
    const done = $('#sgPrepDone');
    if(done) done.onclick = ()=> setStep('enroute');
    const tts = $('#sgPrepTTS');
    if(tts) tts.onclick = ()=> speak('出发前，我们先准备好：预约门票、带好水壶和小零食，穿上舒适的鞋子。准备好了就出发！');
  }

  function hasReservation(museum){
    try{
      return !!(museum && (museum.reservationRequired || museum.reservationUrl));
    }catch(e){ return false; }
  }

  function preparePrepUIForReservation(museum){
    // Show only the reservation card, hide others if present
    try{
      const pack = $('#sgItemPack');
      const wear = $('#sgItemWear');
      if(pack && pack.parentElement && pack.parentElement.parentElement){
        pack.parentElement.parentElement.hidden = true;
      }
      if(wear && wear.parentElement && wear.parentElement.parentElement){
        wear.parentElement.parentElement.hidden = true;
      }
      // Ensure CTA enabled
      updatePrepCTA();
      // Update reservation hint text dynamically if needed (optional)
    }catch(e){}
  }

  function initShare(){
    const save = $('#savePoster');
    const share = $('#sharePoster');
    const close = $('#closePoster');
    if(save) save.onclick = onSavePoster;
    if(share) share.onclick = onSharePoster;
    if(close) close.onclick = onClosePoster;
  }

  function onClosePoster(){
    // Go back to previous step (visit step)
    showStep('visit');
  }

  // ---------- Inline Settings Modal ----------
  function showSettings(){
    const modal = $('#sgSettingsModal');
    if(!modal) return;
    // load current values
    try{
      const age = getAgeGroup();
      const role = getCaregiverRole();
      const ageSel = $('#sgAgeGroup');
      const roleSel = $('#sgCaregiverRole');
      if(ageSel) ageSel.value = age;
      if(roleSel) roleSel.value = role;
      // Populate workflow setting options based on selected museum
      const wfSel = $('#sgWorkflowSetting');
      if(wfSel){
        const m = state.selectedMuseum;
        if(m && state.workflows && state.workflows.length){
          const opts = ['<option value="">自动推荐（按年龄与陪同者）</option>'].concat(
            state.workflows.map(x=> `<option value="${x.id}">${x.name}</option>`)
          ).join('');
          wfSel.innerHTML = opts;
          const saved = getWorkflowSetting(m.id);
          wfSel.value = saved || '';
          wfSel.disabled = false;
        } else {
          wfSel.innerHTML = '<option value="">无可选路线</option>';
          wfSel.value = '';
          wfSel.disabled = true;
        }
      }
    }catch(e){}
    modal.style.display = 'flex';
  }

  function hideSettings(){
    const modal = $('#sgSettingsModal');
    if(modal) modal.style.display = 'none';
    try{
      // Only show intro overlay if we haven't started the journey yet (still on select step)
      if(state.startAfterSettings && state.selectedMuseum && state.step === 'select'){
        showIntroOverlay();
        state.startAfterSettings = false; // Clear flag after showing intro
      }
    }catch(e){}
  }

  function showIntroOverlay(){
    const ov = $('#sgFullscreenIntro');
    if(!ov) return;
    // personalize text
    const nick = getChildNickname();
    const museumName = state.selectedMuseum ? state.selectedMuseum.name : '';
    const h = $('#introHeadline');
    const s = $('#introSub');
    if(h) h.textContent = `点击屏幕，开始${nick}的${museumName}之旅`;
    if(s) s.textContent = '轻触任意位置开始';
    ov.style.display = 'flex';
    const start = ()=>{ 
      ov.style.display = 'none'; 
      try{ document.documentElement.classList.add('sg-immersive'); }catch(e){} 
      tryRequestWakeLock(); 
      // Skip prep/enroute for Pinghu Museum (simplified workflow)
      if(state.selectedMuseum){
        state.innerTaskIndex = 0;
        // Ensure workflow is rendered before setting step
        renderWorkflowVisit();
        setStep('visit');
        updateInnerTaskVisibility();
      } else {
        setStep('select');
      }
      document.removeEventListener('click', pageTapOnce, true); 
    };
    const pageTapOnce = (e)=>{
      if(ov.style.display !== 'none'){
        e.stopPropagation();
        start();
      }
    };
    // tap any area to start
    ov.addEventListener('click', start, { once:true });
    // also capture page tap as fallback
    document.addEventListener('click', pageTapOnce, true);
    // topbar buttons
    const introSettingsBtn = $('#introSettingsBtn');
    const introCloseBtn = $('#introCloseBtn');
    if(introSettingsBtn){ introSettingsBtn.onclick = (e)=>{ e.stopPropagation(); ov.style.display='none'; showSettings(); }; }
    if(introCloseBtn){ introCloseBtn.onclick = (e)=>{ e.stopPropagation(); releaseWakeLock(); window.location.href = 'index.html'; }; }
  }

  async function tryRequestWakeLock(){
    try{
      if('wakeLock' in navigator && navigator.wakeLock && navigator.wakeLock.request){
        state.wakeLock = await navigator.wakeLock.request('screen');
        if(state.wakeLock){
          state.wakeLock.addEventListener && state.wakeLock.addEventListener('release', ()=>{ /* no-op */ });
        }
      }
    }catch(e){ /* ignore */ }
  }

  async function releaseWakeLock(){
    try{
      if(state.wakeLock){
        await state.wakeLock.release();
        state.wakeLock = null;
      }
    }catch(e){ /* ignore */ }
  }

  function saveSettingsImmediate(close){
    const ageSel = $('#sgAgeGroup');
    const roleSel = $('#sgCaregiverRole');
    const wfSel = $('#sgWorkflowSetting');
    const nickInp = $('#sgChildNickname');
    const musSel = $('#sgMuseumPicker');
    const photoReqSel = $('#sgPhotoRequired');
    try{
      if(ageSel) localStorage.setItem('ageGroup', ageSel.value);
      if(roleSel) localStorage.setItem('caregiverRole', roleSel.value);
      if(nickInp) localStorage.setItem('childNickname', nickInp.value || '');
      if(photoReqSel) localStorage.setItem('photoRequired', photoReqSel.value || 'optional');
      localStorage.setItem('settingsSeen', '1');
      // Persist workflow setting per museum
      const m = state.selectedMuseum;
      if(m && wfSel){ setWorkflowSetting(m.id, wfSel.value || ''); }
      if(musSel){
        const mid = musSel.value;
        if(mid){
          const newM = (Array.isArray(MUSEUMS)?MUSEUMS:[]).find(x=> x && x.id===mid);
          if(newM && (!m || newM.id!==m.id)){
            onSelectMuseum(newM);
          }
        }
      }
    }catch(e){}
    refreshAfterSettings();
    if(close) hideSettings();
  }

  function saveSettings(){
    // Backward-compatible: Save + close
    saveSettingsImmediate(true);
  }

  function refreshAfterSettings(){
    // Rebuild museum list according to new filters
    const base = MUSEUMS.filter(hasAvailableWorkflow);
    renderMuseums(base.slice(0, 50));
    // If a museum is currently selected, validate and refresh its workflows
    if(state.selectedMuseum){
      if(!hasAvailableWorkflow(state.selectedMuseum)){
        // Current selection no longer valid for new settings
        state.selectedMuseum = null;
        state.selectedWorkflow = null;
        state.wfMode = false;
        state.wfVisitCount = 0;
        state.innerTaskIndex = 0;
        setStep('select');
        alert('当前设置下该博物馆暂无适配路线，请重新选择');
      } else {
        setupWorkflowPicker(state.selectedMuseum);
        applyWorkflowSettingForMuseum(state.selectedMuseum);
        // If on enroute/visit, ensure visibility respects new wf/task filters
        // Note: renderWorkflowEnroute and renderWorkflowVisit are already called in applyWorkflowSettingForMuseum
        updateInnerTaskVisibility();
      }
    }
  }

  function initSettingsUI(){
    const btn = $('#sgSettingsBtn');
    const closeBtn = $('#sgSettingsClose');
    const closeXBtn = $('#sgSettingsCloseX');
    if(btn) btn.addEventListener('click', showSettings);
    if(closeBtn) closeBtn.addEventListener('click', hideSettings);
    if(closeXBtn) closeXBtn.addEventListener('click', hideSettings);
    // click backdrop to close
    const modal = $('#sgSettingsModal');
    if(modal){
      modal.addEventListener('click', (e)=>{ if(e.target === modal) hideSettings(); });
    }
    // Apply immediately on change (no need to press Save)
    const ageSel = $('#sgAgeGroup');
    const roleSel = $('#sgCaregiverRole');
    const wfSel = $('#sgWorkflowSetting');
    const nickInp = $('#sgChildNickname');
    const musSel = $('#sgMuseumPicker');
    function refreshWorkflowOptions(){
      if(!wfSel) return;
      const ag = (ageSel && ageSel.value) || getAgeGroup();
      const role = (roleSel && roleSel.value) || getCaregiverRole();
      const mid = musSel && musSel.value ? musSel.value : (state.selectedMuseum && state.selectedMuseum.id);
      const stored = mid ? getWorkflowSetting(mid) : '';
      const opts = [];
      opts.push({ value: '', label: '自动推荐（按年龄与陪同者）' });
      if(mid === 'forbidden-city' && ag === '3-6'){
        const reco = role === 'grandparent' ? '（推荐）' : '';
        opts.push({ value: 'route:forbidden-city:grandparent-3-6-mvp', label: `祖孙游方案${reco}` });
      }
      wfSel.innerHTML = opts.map(o=> `<option value="${o.value}">${o.label}</option>`).join('');
      // prefer stored if exists
      if(stored){ wfSel.value = stored; }
    }
    if(ageSel) ageSel.addEventListener('change', ()=> { refreshWorkflowOptions(); saveSettingsImmediate(false); });
    if(roleSel) roleSel.addEventListener('change', ()=> { refreshWorkflowOptions(); saveSettingsImmediate(false); });
    if(wfSel) wfSel.addEventListener('change', ()=> saveSettingsImmediate(false));
    if(nickInp) nickInp.addEventListener('input', ()=> saveSettingsImmediate(false));
    if(musSel) musSel.addEventListener('change', ()=> { refreshWorkflowOptions(); saveSettingsImmediate(false); });
    
    const photoReqSel = $('#sgPhotoRequired');
    if(photoReqSel) photoReqSel.addEventListener('change', ()=> saveSettingsImmediate(false));

    // Menu button and modal
    const menuBtn = $('#sgMenuBtn');
    const menuModal = $('#sgMenuModal');
    const menuCloseBtn = $('#sgMenuClose');
    if(menuBtn) menuBtn.addEventListener('click', ()=> { if(menuModal) menuModal.style.display = 'flex'; });
    if(menuCloseBtn) menuCloseBtn.addEventListener('click', ()=> { if(menuModal) menuModal.style.display = 'none'; });
    if(menuModal) menuModal.addEventListener('click', (e)=>{ if(e.target === menuModal) menuModal.style.display = 'none'; });
    
    // Menu actions
    const menuViewParent = $('#sgMenuViewParentTasks');
    const menuViewAssess = $('#sgMenuViewAssessment');
    const menuViewMusFw = $('#sgMenuViewMuseumFireworks');
    const menuViewFw = $('#sgMenuViewFireworks');
    const menuHome = $('#sgMenuBackToHome');
    
    if(menuViewParent) menuViewParent.addEventListener('click', ()=> {
      const mid = state.selectedMuseum ? state.selectedMuseum.id : '';
      const age = getAgeGroup();
      window.location.href = `index.html?museum=${mid}&type=parent&age=${age}`;
    });
    if(menuViewAssess) menuViewAssess.addEventListener('click', ()=> {
      window.location.href = 'index.html?assessment=true';
    });
    if(menuViewMusFw) menuViewMusFw.addEventListener('click', ()=> {
      const mid = state.selectedMuseum ? state.selectedMuseum.id : '';
      window.location.href = `fireworks-wall.html?museum=${mid}`;
    });
    if(menuViewFw) menuViewFw.addEventListener('click', ()=> {
      window.location.href = 'fireworks-wall.html';
    });
    if(menuHome) menuHome.addEventListener('click', ()=> {
      window.location.href = 'index.html';
    });

    try{
      const ag = localStorage.getItem('ageGroup');
      const cr = localStorage.getItem('caregiverRole');
      const nn = localStorage.getItem('childNickname') || '';
      const pr = localStorage.getItem('photoRequired') || 'optional';
      if(ageSel && ag) ageSel.value = ag;
      if(roleSel && cr) roleSel.value = cr;
      if(nickInp) nickInp.value = nn;
      if(photoReqSel) photoReqSel.value = pr;
    }catch(e){}

    if(musSel){
      const all = Array.isArray(MUSEUMS)?MUSEUMS:[];
      const list = all.filter(m=> m && V3_SUPPORTED.includes(m.id)).sort((a,b)=> (a.name||'').localeCompare(b.name||'', 'zh-CN'));
      musSel.innerHTML = '<option value="">请选择博物馆</option>' + list.map(m=> `<option value="${m.id}">${m.name}</option>`).join('');
      const cur = state.selectedMuseum && state.selectedMuseum.id;
      if(cur) musSel.value = cur;
    }
    // initial workflow options
    try{ refreshWorkflowOptions(); }catch(e){}
  }

  function maybeShowFirstTimeSettings(){
    try{
      const seen = localStorage.getItem('settingsSeen');
      const age = localStorage.getItem('ageGroup');
      const role = localStorage.getItem('caregiverRole');
      if(!seen && (!age || !role)){
        // Prefill defaults (helpers will show defaults), then show modal once
        showSettings();
        localStorage.setItem('settingsSeen', '1');
      }
    }catch(e){ /* noop */ }
  }

  function bindStepperClick(){
    // optional: restrict back navigation
    $$('#sgStepper .sg-step').forEach(el => {
      el.addEventListener('click', ()=>{
        const step = el.dataset.step;
        if(step === 'select') setStep('select');
        else if(step === 'visit' && state.selectedMuseum) setStep('visit');
        else if(step === 'share' && state.selectedMuseum) setStep('share');
      });
    });
  }

  function init(){
    initSelect();
    try{
      const p = getUrlParams();
      const mid = p.museum || p.museumId;
      if(mid){
        const m = (Array.isArray(MUSEUMS)?MUSEUMS:[]).find(x=> x && x.id===mid);
        if(m){
          onSelectMuseum(m);
        }
      }
    }catch(e){}
    initPrep();
    bindEnrouteTTS();
    initVisitFlow();
    initShare();
    initSettingsUI();
    bindStepperClick();
    setStep('select');
    // Auto-open settings for confirmation when entering v3.
    try{
      const p = getUrlParams();
      const hasMuseumParam = !!(p.museum || p.museumId);
      const allSettingsConfigured = hasRequiredSettings();
      const hasSelection = !!state.selectedMuseum;
      
      state.startAfterSettings = true; // start tour after closing settings
      
      // Special case: Pinghu Museum - skip settings if museum is pre-selected via URL
      if(state.selectedMuseum && state.selectedMuseum.id === 'pinghu-museum' && hasMuseumParam){
        // For Pinghu Museum with URL parameter, skip settings and go directly to visit
        // Set default settings if not configured
        if(!allSettingsConfigured){
          if(!localStorage.getItem('childNickname')) localStorage.setItem('childNickname', '小淘气');
          if(!localStorage.getItem('ageGroup')) localStorage.setItem('ageGroup', '7-12');
          if(!localStorage.getItem('caregiverRole')) localStorage.setItem('caregiverRole', 'parent');
        }
        // Skip intro and go directly to visit
        document.documentElement.classList.add('sg-immersive');
        tryRequestWakeLock();
        state.innerTaskIndex = 0;
        renderWorkflowVisit();
        setStep('visit');
        updateInnerTaskVisibility();
        return;
      }
      
      // Decision logic for other museums:
      // 1. If all settings configured (nickname, age, role) AND museum selected -> skip settings, go to intro
      // 2. Otherwise -> show settings page
      if(hasSelection && allSettingsConfigured){
        // All required settings exist and museum is selected: skip settings page
        showIntroOverlay();
      } else {
        // Settings incomplete or no museum selected: show settings
        showSettings();
      }
    }catch(e){ showSettings(); }

    // handle visibility changes (reacquire wake lock when visible)
    try{
      document.addEventListener('visibilitychange', ()=>{
        if(document.visibilityState === 'visible' && document.documentElement.classList.contains('sg-immersive')){
          tryRequestWakeLock();
        }
      });
      window.addEventListener('pagehide', releaseWakeLock);
      window.addEventListener('beforeunload', releaseWakeLock);
    }catch(e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
