(function(){
  'use strict';

  // Utilities
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Age reading helper (default 7-12 if not set)
  function getAgeGroup(){
    try { return localStorage.getItem('ageGroup') || '7-12'; } catch(e){ return '7-12'; }
  }
  // Caregiver role helper (default parent)
  function getCaregiverRole(){
    try { return localStorage.getItem('caregiverRole') || 'parent'; } catch(e){ return 'parent'; }
  }

  const state = {
    step: 'select',
    selectedMuseum: null,
    innerTaskIndex: 0,
    prevInnerTaskIndex: 0,
    // workflow runtime (optional)
    workflows: [],
    selectedWorkflow: null,
    wfVisitCount: 0,
    wfMode: false,
    photos: {
      entrance: [],
      victory: []
    }
  };

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
    // Optional: load workflows for this museum
    setupWorkflowPicker(m);
    // Apply default/explicit workflow selection without showing picker
    applyWorkflowSettingForMuseum(m);
    // Only show prep if reservation is required; otherwise jump to enroute
    if(hasReservation(m)){
      preparePrepUIForReservation(m);
      setStep('prep');
    } else {
      setStep('enroute');
    }
    // Reservation link: open a search query for now
    const reserveBtn = $('#sgGoReserve');
    if(reserveBtn){
      reserveBtn.onclick = ()=>{
        const url = (m && m.reservationUrl) ? m.reservationUrl : '';
        if(url){ window.open(url,'_blank'); }
        else {
          const q = encodeURIComponent(`${m.name} 预约 门票`);
          window.open(`https://www.baidu.com/s?wd=${q}`,'_blank');
        }
      };
    }
    // reset prep inputs
    const pack = $('#sgItemPack');
    const wear = $('#sgItemWear');
    if(pack) pack.checked = false;
    if(wear) wear.checked = false;
    updatePrepCTA();
  }

  function updatePrepCTA(){
    // Prep is only for reservation; non-mandatory items removed
    const btn = $('#sgPrepDone');
    if(btn) btn.disabled = false;
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
      const all = (window.WORKFLOWS && window.WORKFLOWS[id]) || [];
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
        const visit = (wf.tasks && Array.isArray(wf.tasks.visit)) ? wf.tasks.visit : [];
        const p = visit.filter(t=>t.role==='parent').length;
        const c = visit.filter(t=>t.role==='child').length;
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
    // Keep legacy picker hidden to reduce cognitive load
    const wrap = $('#sgWorkflowPickerWrap');
    if(wrap) wrap.style.display = 'none';
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
    const wf = state.selectedWorkflow;
    const age = getAgeGroup();
    let tasks = (wf && wf.tasks && Array.isArray(wf.tasks.enroute)) ? wf.tasks.enroute : [];
    // filter by task ages if provided
    tasks = tasks.filter(t => !t.ages || t.ages.includes(age));
    if(!tasks.length){
      box.style.display = 'none';
      return;
    }
    tasks.forEach(t => {
      if(t.type === 'tts' && t.tts){
        const wrap = document.createElement('div');
        wrap.className = 'sg-tts';
        const btn = document.createElement('button');
        btn.className = 'sg-btn sg-btn-secondary';
        btn.textContent = `▶ ${t.title}`;
        btn.onclick = () => speak(t.tts);
        wrap.appendChild(btn);
        box.appendChild(wrap);
      } else if(t.type === 'link' && t.url){
        const wrap = document.createElement('div');
        wrap.className = 'sg-tts';
        const btn = document.createElement('button');
        btn.className = 'sg-btn sg-btn-secondary';
        btn.textContent = t.title || '打开链接';
        btn.onclick = () => window.open(t.url, '_blank');
        wrap.appendChild(btn);
        box.appendChild(wrap);
      }
    });
    box.style.display = '';
  }

  function renderWorkflowVisit(){
    const box = $('#sgWorkflowVisit');
    const staticBox = $('#sgVisitTasks');
    if(!box || !staticBox) return;
    box.innerHTML = '';
    const wf = state.selectedWorkflow;
    const age = getAgeGroup();
    let tasks = (wf && wf.tasks && Array.isArray(wf.tasks.visit)) ? wf.tasks.visit : [];
    tasks = tasks.filter(t => !t.ages || t.ages.includes(age));
    state.wfVisitCount = tasks.length;
    if(!tasks.length){
      box.style.display = 'none';
      staticBox.style.display = '';
      state.wfMode = false;
      return;
    }
    tasks.forEach((t, idx) => {
      const section = document.createElement('div');
      section.className = 'sg-section sg-task-card';
      section.id = `wtask-${idx}`;
      const ttl = document.createElement('div');
      ttl.className = 'sg-title';
      // role badge
      const badge = document.createElement('span');
      badge.className = 'sg-role-badge' + (t.role === 'child' ? ' child' : '');
      badge.textContent = (t.role === 'parent') ? '家长' : (t.role === 'child' ? '孩子' : '');
      ttl.textContent = `步骤${idx+1}：${t.title || '任务'}`;
      const sub = document.createElement('div');
      sub.className = 'sg-subtitle';
      sub.textContent = t.subtitle || '';
      section.appendChild(ttl);
      if(badge.textContent) section.appendChild(badge);
      section.appendChild(sub);

      if(t.type === 'photo'){
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture','environment');
        input.setAttribute('aria-label','打开相机');
        input.addEventListener('change', (e)=> handlePhotoInput(e, `wf-${idx}`, `#wpreview-${idx}`));
        const preview = document.createElement('div');
        preview.className = 'sg-photo';
        preview.id = `wpreview-${idx}`;
        section.appendChild(input);
        section.appendChild(preview);
      } else {
        const actions = document.createElement('div');
        actions.className = 'sg-actions';
        const done = document.createElement('button');
        done.className = 'sg-btn sg-btn-primary';
        done.textContent = '我完成了';
        done.onclick = () => {
          const last = Math.max(0, state.wfVisitCount - 1);
          if(state.innerTaskIndex < last){
            state.prevInnerTaskIndex = state.innerTaskIndex;
            state.innerTaskIndex++;
            updateInnerTaskVisibility();
          }
        };
        actions.appendChild(done);
        section.appendChild(actions);
      }
      box.appendChild(section);
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
    if(camEntrance) camEntrance.addEventListener('change', (e)=> handlePhotoInput(e, 'entrance', '#photoEntrance'));
    if(camVictory) camVictory.addEventListener('change', (e)=> handlePhotoInput(e, 'victory', '#photoVictory'));

    updateInnerTaskVisibility();
  }

  function updateInnerTaskVisibility(){
    if(state.wfMode && state.wfVisitCount > 0){
      // toggle workflow visit sections
      const wsections = Array.from(document.querySelectorAll('[id^="wtask-"]'));
      wsections.forEach((el, idx)=>{
        el.style.display = (idx === state.innerTaskIndex ? 'block' : 'none');
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
    let tasks = (wf && wf.tasks && Array.isArray(wf.tasks.visit)) ? wf.tasks.visit : [];
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
    try{ navigator.vibrate && navigator.vibrate(20); }catch(e){}
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

  function handlePhotoInput(evt, key, previewSel){
    const files = Array.from(evt.target.files || []);
    if(!files.length) return;
    const preview = document.querySelector(previewSel);
    preview.innerHTML = '';
    const limit = Math.min(files.length, 3);
    for(let i=0;i<limit;i++){
      const f = files[i];
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'photo';
      preview.appendChild(img);
    }
    state.photos[key] = files;
  }

  // Poster generation
  function getChildNickname(){
    try {
      const v = localStorage.getItem('childNickname');
      if(v && v.trim()) return v.trim();
    } catch(e) {}
    return '小小探险家';
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

    // title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
    ctx.fillText('今天的博物馆小探险', 40, 100);

    // museum name
    ctx.font = 'bold 36px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
    ctx.fillText(state.selectedMuseum ? state.selectedMuseum.name : '—', 40, 160);

    // nickname
    ctx.font = '28px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
    ctx.fillText(`${getChildNickname()} 今天完成了所有挑战！`, 40, 210);

    // photo slots
    const drawImages = [];
    const readAsImage = (file) => new Promise(resolve=>{
      const img = new Image();
      img.onload = ()=> resolve(img);
      img.src = URL.createObjectURL(file);
    });
    const picks = [];
    if(state.photos.entrance[0]) picks.push(state.photos.entrance[0]);
    if(state.photos.victory[0]) picks.push(state.photos.victory[0]);

    const work = picks.slice(0,2).map(f=> readAsImage(f));
    Promise.all(work).then(images => {
      images.forEach((img, idx)=>{
        const w = 280, h = 280;
        const x = 40 + idx*(w+20);
        const y = 260;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(x-6,y-6,w+12,h+12);
        // cover fit
        const ratio = Math.min(img.width/w, img.height/h);
        const dw = w; const dh = h;
        // simple draw to fit
        ctx.drawImage(img, x, y, dw, dh);
      });

      // footer
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
      const date = new Date().toLocaleDateString('zh-CN');
      ctx.fillText(`MuseumCheck · ${date}`, 40, H-60);

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
    if(save) save.onclick = onSavePoster;
    if(share) share.onclick = onSharePoster;
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
  }

  function saveSettingsImmediate(close){
    const ageSel = $('#sgAgeGroup');
    const roleSel = $('#sgCaregiverRole');
    const wfSel = $('#sgWorkflowSetting');
    try{
      if(ageSel) localStorage.setItem('ageGroup', ageSel.value);
      if(roleSel) localStorage.setItem('caregiverRole', roleSel.value);
      localStorage.setItem('settingsSeen', '1');
      // Persist workflow setting per museum
      const m = state.selectedMuseum;
      if(m && wfSel){ setWorkflowSetting(m.id, wfSel.value || ''); }
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
        // If on enroute/visit, ensure visibility respects new wf/task filters
        renderWorkflowEnroute();
        renderWorkflowVisit();
        updateInnerTaskVisibility();
      }
    }
  }

  function initSettingsUI(){
    const btn = $('#sgSettingsBtn');
    const closeBtn = $('#sgSettingsClose');
    const saveBtn = $('#sgSettingsSave');
    if(btn) btn.addEventListener('click', showSettings);
    if(closeBtn) closeBtn.addEventListener('click', hideSettings);
    if(saveBtn) saveBtn.addEventListener('click', saveSettings);
    // click backdrop to close
    const modal = $('#sgSettingsModal');
    if(modal){
      modal.addEventListener('click', (e)=>{ if(e.target === modal) hideSettings(); });
    }
    // Apply immediately on change (no need to press Save)
    const ageSel = $('#sgAgeGroup');
    const roleSel = $('#sgCaregiverRole');
    const wfSel = $('#sgWorkflowSetting');
    if(ageSel) ageSel.addEventListener('change', ()=> saveSettingsImmediate(false));
    if(roleSel) roleSel.addEventListener('change', ()=> saveSettingsImmediate(false));
    if(wfSel) wfSel.addEventListener('change', ()=> saveSettingsImmediate(false));
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
        else if(step === 'prep' && state.selectedMuseum) setStep('prep');
        else if(step === 'enroute' && state.selectedMuseum) setStep('enroute');
        else if(step === 'visit' && state.selectedMuseum) setStep('visit');
        else if(step === 'share' && state.selectedMuseum) setStep('share');
      });
    });
  }

  function init(){
    initSelect();
    initPrep();
    bindEnrouteTTS();
    initVisitFlow();
    initShare();
    initSettingsUI();
    bindStepperClick();
    setStep('select');
    maybeShowFirstTimeSettings();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
