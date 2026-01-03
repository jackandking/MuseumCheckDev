(function(){
  // Inline Snake Game module - injects overlay and exposes initSnakeInlineGame(taskIndex)
  // Minimal, self-contained implementation adapted from snake-game.js

  function isDebugMode() {
    try {
      if (window.MC_debugMode) {
        // logStatus will print details
        return !!window.MC_debugMode.logStatus('snake-inline isDebugMode check');
      }
      if (window.MC_isDebug) {
        const r = window.MC_isDebug(true);
        console.debug('snake-inline: MC_isDebug ->', r);
        return r;
      }
      // Fallback detection (logs details)
      const params = new URLSearchParams(window.location.search);
      const viaParam = params.get('debug') === 'true' || params.get('debug') === '1';
      const viaStored = (localStorage && localStorage.getItem && localStorage.getItem('mc_debug') === '1');
      const viaWindow = !!window.__MC_DEBUG;
      const result = viaParam || viaStored || viaWindow;
      console.debug('snake-inline fallback debug check', { viaWindow, viaParam, viaStored, result });
      return result;
    } catch (e) { console.warn('snake-inline isDebugMode error', e); }
    return false;
  }

  function debugStatus() {
    let viaWindow = !!(window && window.__MC_DEBUG);
    let viaParam = false;
    let viaStored = false;
    try {
      const params = new URLSearchParams(window.location.search);
      viaParam = params.get('debug') === 'true' || params.get('debug') === '1';
      viaStored = !!(localStorage && localStorage.getItem && localStorage.getItem('mc_debug') === '1');
    } catch (e) {}
    return { viaWindow, viaParam, viaStored, result: (viaWindow || viaParam || viaStored) };
  }

  // Create overlay DOM when first needed
  let overlayCreated = false;
  let overlayElements = null;

  function createOverlay() {
    if (overlayCreated) return;
    overlayCreated = true;

    const style = document.createElement('style');
    style.textContent = `
      .inline-snake-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:9999}
      .inline-snake-panel{width:90%;max-width:640px;background:#0b1220;color:#fff;border-radius:12px;padding:12px;box-shadow:0 10px 40px rgba(0,0,0,0.6);max-height:95vh;display:flex;flex-direction:column;}
      .inline-snake-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
      .inline-snake-canvas{display:block;background:#021; border-radius:8px; width:100%;}
      .inline-snake-controls{display:flex;gap:8px;justify-content:center;margin-top:8px}
      .inline-snake-btn{padding:8px 16px;border-radius:8px;border:none;background:linear-gradient(90deg,#667eea,#764ba2);color:#fff;cursor:pointer}
      .inline-snake-hidden{display:none!important}
      .inline-snake-stats{font-size:14px;color:#cfe}
      .inline-snake-touch-controls{display:none;margin-top:12px;padding:12px 0;}
      .inline-snake-direction-pad{display:grid;grid-template-columns:60px 60px 60px;grid-template-rows:60px 60px;gap:8px;justify-content:center;align-items:center;}
      .inline-snake-touch-btn{width:60px;height:60px;background:rgba(102,126,234,0.3);border:2px solid #667eea;border-radius:12px;color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;touch-action:manipulation;cursor:pointer;}
      .inline-snake-touch-btn:active{background:rgba(102,126,234,0.6);transform:scale(0.95);}
      .inline-snake-touch-btn-up{grid-column:2;grid-row:1;}
      .inline-snake-touch-btn-left{grid-column:1;grid-row:2;}
      .inline-snake-touch-btn-down{grid-column:2;grid-row:2;}
      .inline-snake-touch-btn-right{grid-column:3;grid-row:2;}
      @media (max-width:768px){.inline-snake-touch-controls{display:block;}}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'inline-snake-overlay inline-snake-hidden';

    overlay.innerHTML = `
      <div class="inline-snake-panel" role="dialog" aria-modal="true">
        <div class="inline-snake-header">
          <div class="inline-snake-title">🐍 贪食蛇</div>
          <button id="snakeCloseBtn" class="inline-snake-btn">继续游览 ➡️</button>
        </div>
        <canvas id="snakeInlineCanvas" class="inline-snake-canvas" width="480" height="480"></canvas>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <div class="inline-snake-stats">分数: <span id="snakeInlineScore">0</span></div>
          <div>
            <button id="snakeInlineStartBtn" class="inline-snake-btn">开始</button>
            <button id="snakeInlineRestartBtn" class="inline-snake-btn inline-snake-hidden">再玩一次</button>
          </div>
        </div>
        <div class="inline-snake-touch-controls" id="snakeTouchControls">
          <div class="inline-snake-direction-pad">
            <button class="inline-snake-touch-btn inline-snake-touch-btn-up" id="snakeUpBtn">▲</button>
            <button class="inline-snake-touch-btn inline-snake-touch-btn-left" id="snakeLeftBtn">◀</button>
            <button class="inline-snake-touch-btn inline-snake-touch-btn-down" id="snakeDownBtn">▼</button>
            <button class="inline-snake-touch-btn inline-snake-touch-btn-right" id="snakeRightBtn">▶</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlayElements = {
      overlay, canvas: overlay.querySelector('#snakeInlineCanvas'), closeBtn: overlay.querySelector('#snakeCloseBtn'),
      startBtn: overlay.querySelector('#snakeInlineStartBtn'), restartBtn: overlay.querySelector('#snakeInlineRestartBtn'), scoreEl: overlay.querySelector('#snakeInlineScore'),
      upBtn: overlay.querySelector('#snakeUpBtn'), downBtn: overlay.querySelector('#snakeDownBtn'),
      leftBtn: overlay.querySelector('#snakeLeftBtn'), rightBtn: overlay.querySelector('#snakeRightBtn')
    };

    overlayElements.closeBtn.addEventListener('click', cleanup);
    overlayElements.startBtn.addEventListener('click', startGame);
    overlayElements.restartBtn.addEventListener('click', restartGame);
    
    // Touch control event listeners
    setupTouchControls();
  }

  function setupTouchControls() {
    // Helper function to handle direction changes
    const handleDirection = (newDir, checkAxis) => (e) => {
      e.preventDefault();
      if (state === 'playing') {
        // Check if movement is allowed (not reversing into self)
        if (checkAxis === 'x' && dir.x === 0) {
          nextDir = newDir;
        } else if (checkAxis === 'y' && dir.y === 0) {
          nextDir = newDir;
        }
      }
    };

    // Up button (check y-axis)
    const upHandler = handleDirection({ x: 0, y: -1 }, 'y');
    overlayElements.upBtn.addEventListener('touchstart', upHandler);
    overlayElements.upBtn.addEventListener('click', upHandler);

    // Down button (check y-axis)
    const downHandler = handleDirection({ x: 0, y: 1 }, 'y');
    overlayElements.downBtn.addEventListener('touchstart', downHandler);
    overlayElements.downBtn.addEventListener('click', downHandler);

    // Left button (check x-axis)
    const leftHandler = handleDirection({ x: -1, y: 0 }, 'x');
    overlayElements.leftBtn.addEventListener('touchstart', leftHandler);
    overlayElements.leftBtn.addEventListener('click', leftHandler);

    // Right button (check x-axis)
    const rightHandler = handleDirection({ x: 1, y: 0 }, 'x');
    overlayElements.rightBtn.addEventListener('touchstart', rightHandler);
    overlayElements.rightBtn.addEventListener('click', rightHandler);
  }

  // Game state
  let ctx, gridSize=20, cellSize=24, gridW=20, gridH=20;
  let snake=[], dir={x:1,y:0}, nextDir={x:1,y:0}, food=null, gameLoopId=null, speed=160, score=0, state='idle';
  let petEmoji='🐾', petLevel=1, petData=null;

  function loadPetData() {
    try {
      const saved = localStorage.getItem('virtualPetData');
      if (saved) {
        petData = JSON.parse(saved);
        if (petData.adopted && petData.pet) {
          const pet = petData.pet; petEmoji = pet.emoji || petEmoji;
          const xp = pet.totalXPSpent || 0;
          if (xp>=500) petLevel=5; else if (xp>=300) petLevel=4; else if (xp>=150) petLevel=3; else if (xp>=50) petLevel=2; else petLevel=1;
        }
      }
    } catch(e){}
  }

  function openOverlay() {
    createOverlay();
    loadPetData();
    overlayElements.overlay.classList.remove('inline-snake-hidden');
    // Log debug status when opening
    try { if (window.MC_debugMode) window.MC_debugMode.logStatus('Snake inline opened'); } catch(e) { console.debug('snake-inline log error', e); }
    // resize canvas to fit panel width
    const rect = overlayElements.canvas.getBoundingClientRect();
    const size = Math.min(window.innerWidth*0.8, 560);
    overlayElements.canvas.width = size;
    overlayElements.canvas.height = size;
    cellSize = Math.floor(size / gridSize);
    gridW = gridH = gridSize;
    ctx = overlayElements.canvas.getContext('2d');
    drawIdleScreen();
    configureButtons();
      console.log('snake-inline debug check', debugStatus());
  }

  function configureButtons(){
    if (isDebugMode()){
      overlayElements.restartBtn.classList.remove('inline-snake-hidden');
    } else {
      overlayElements.restartBtn.classList.add('inline-snake-hidden');
    }
  }

  function drawIdleScreen(){
    ctx.fillStyle = '#021'; ctx.fillRect(0,0,overlayElements.canvas.width,overlayElements.canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = `${cellSize*0.8}px serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(petEmoji, overlayElements.canvas.width/2, overlayElements.canvas.height/2 - 20);
  }

  function startGame(){
    // init snake
    snake = [];
    const cx = Math.floor(gridW/2), cy=Math.floor(gridH/2);
    snake.push({x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy});
    dir={x:1,y:0}; nextDir={x:1,y:0};
    score=0; speed=160; state='playing';
    spawnFood(); updateScore();
    document.addEventListener('keydown', onKeyDown);
    overlayElements.startBtn.classList.add('inline-snake-hidden');
    overlayElements.restartBtn.classList.add('inline-snake-hidden');
    loop();
  }

  function loop(){
    if (state!=='playing') return;
    update(); draw();
    gameLoopId = setTimeout(loop, speed);
  }

  function update(){
    dir = {...nextDir};
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    if (head.x<0||head.y<0||head.x>=gridW||head.y>=gridH){ return endGame(); }
    for (let s of snake){ if (s.x===head.x && s.y===head.y) return endGame(); }
    snake.unshift(head);
    if (food && head.x===food.x && head.y===food.y){ score += 10; spawnFood(); updateScore(); speed = Math.max(80, speed - 6); }
    else snake.pop();
  }

  function draw(){
    const w = overlayElements.canvas.width, h = overlayElements.canvas.height;
    ctx.fillStyle='#021'; ctx.fillRect(0,0,w,h);
    // draw grid optional
    // draw food
    if (food){ ctx.fillStyle='#f44'; ctx.font = `${cellSize}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🍎', food.x*cellSize+cellSize/2, food.y*cellSize+cellSize/2); }
    // draw snake
    snake.forEach((seg,i)=>{
      const x = seg.x*cellSize, y = seg.y*cellSize;
      if (i===0){ ctx.font = `${cellSize}px serif`; ctx.fillText(petEmoji, x+cellSize/2, y+cellSize/2); }
      else { ctx.fillStyle = '#4ade80'; ctx.fillRect(x+1,y+1,cellSize-2,cellSize-2); }
    });
  }

  function spawnFood(){
    let f; let ok=false;
    while(!ok){
      f = {x: Math.floor(Math.random()*gridW), y: Math.floor(Math.random()*gridH)};
      ok = !snake.some(s=>s.x===f.x&&s.y===f.y);
    }
    food = f;
  }

  function onKeyDown(e){
    if (state!=='playing') return;
    const key = e.key;
    if ((key==='ArrowUp'||key==='w'||key==='W') && dir.y===0) nextDir={x:0,y:-1};
    else if ((key==='ArrowDown'||key==='s'||key==='S') && dir.y===0) nextDir={x:0,y:1};
    else if ((key==='ArrowLeft'||key==='a'||key==='A') && dir.x===0) nextDir={x:-1,y:0};
    else if ((key==='ArrowRight'||key==='d'||key==='D') && dir.x===0) nextDir={x:1,y:0};
  }

  function updateScore(){ if (overlayElements && overlayElements.scoreEl) overlayElements.scoreEl.textContent = score; }

  function endGame(){
    state='gameover';
    if (gameLoopId) { clearTimeout(gameLoopId); gameLoopId = null; }
    document.removeEventListener('keydown', onKeyDown);
    // award XP similar to page game
    const baseXP = Math.floor(score/10); const multiplier = petLevel>=5?2:1; const xp = Math.max(5, Math.min(30, baseXP))*multiplier;
    try{
      // achievement system hook if present
      if (window.achievementGamification && window.achievementGamification.showXPGainNotification) {
        window.achievementGamification.showXPGainNotification(xp, '贪食蛇胜利');
      }
      // add to achievementPoints
      const pts = localStorage.getItem('achievementPoints'); let cur = pts?parseInt(pts):0; cur += xp; localStorage.setItem('achievementPoints', String(cur));
    }catch(e){}
      // In debug mode show "再玩一次" button; in normal mode show "开始" button to allow restart
      if (isDebugMode()) {
        overlayElements.restartBtn.classList.remove('inline-snake-hidden');
        overlayElements.startBtn.classList.add('inline-snake-hidden');
      } else {
        overlayElements.restartBtn.classList.add('inline-snake-hidden');
        overlayElements.startBtn.classList.remove('inline-snake-hidden');
      }
      console.log('snake-inline endGame debug check', debugStatus());
  }

  function restartGame(){
    cleanup();
    // small delay to ensure cleanup
    setTimeout(()=>{ openOverlay(); startGame(); },50);
  }

  function cleanup(){
    state='idle';
    if (gameLoopId) { clearTimeout(gameLoopId); gameLoopId=null; }
    document.removeEventListener('keydown', onKeyDown);
    if (overlayElements) overlayElements.overlay.classList.add('inline-snake-hidden');
  }

  // Expose API
  window.initSnakeInlineGame = function(taskIndex){
    openOverlay();
  };

  // Intercept any anchor clicks to snake-game.html and open inline overlay instead
  document.addEventListener('click', function(e){
    try {
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // Normalize
      const normalized = href.replace(/^[\.\/]+/, '');
      if (normalized === 'snake-game.html') {
        e.preventDefault();
        if (typeof window.initSnakeInlineGame === 'function') {
          window.initSnakeInlineGame(0);
        }
      }
    } catch (err) { /* ignore */ }
  }, false);

})();
