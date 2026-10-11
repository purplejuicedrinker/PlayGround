/* STARFALL TACTICS — Tetris Roguelike, single-file engine. No external assets. */
'use strict';
const COLS = 10, ROWS = 20, CELL = 30;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const holdCanvas = document.getElementById('hold-canvas');
const hctx = holdCanvas.getContext('2d');
const nextCanvases = [...document.querySelectorAll('.next-canvas')];
const nctxs = nextCanvases.map(c => c.getContext('2d'));

const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
};
const COLORS = { I:'#37e6ff', J:'#5b8cff', L:'#ff9f43', O:'#ffd34d', S:'#59ffa0', T:'#c26bff', Z:'#ff4d6d', G:'#3a3f6e' };
const DARK = { I:'#0e5a68', J:'#22356e', L:'#6e4416', O:'#6e5a16', S:'#166e3c', T:'#53296e', Z:'#6e1626', G:'#23264a' };

/* ---------- Anime heroines ---------- */
function portraitSVG(id){
  const cfg = {
    aiko:{hair:'#ff7ab8',hair2:'#ff4d8d',bg:'#2b1140',ribbon:'#ffd34d',eye:'#7b2ff7'},
    rin:{hair:'#3a4bff',hair2:'#1b256e',bg:'#0b1e4a',ribbon:'#ff4d6d',eye:'#37e6ff'},
    yuki:{hair:'#eaf6ff',hair2:'#9fd8ff',bg:'#123043',ribbon:'#37e6ff',eye:'#2b9fff'},
  }[id];
  return `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="130" fill="${cfg.bg}"/>
    <circle cx="50" cy="46" r="30" fill="${cfg.hair}"/>
    <ellipse cx="50" cy="72" rx="24" ry="28" fill="#ffe3d0"/>
    <path d="M20 60 Q50 0 80 60 L80 40 Q50 -6 20 40Z" fill="${cfg.hair2}"/>
    <circle cx="38" cy="74" r="5.5" fill="#fff"/><circle cx="38" cy="74" r="3" fill="${cfg.eye}"/><circle cx="39" cy="73" r="1" fill="#fff"/>
    <circle cx="62" cy="74" r="5.5" fill="#fff"/><circle cx="62" cy="74" r="3" fill="${cfg.eye}"/><circle cx="63" cy="73" r="1" fill="#fff"/>
    <ellipse cx="38" cy="84" rx="6" ry="3" fill="#ffb3c8" opacity=".7"/><ellipse cx="62" cy="84" rx="6" ry="3" fill="#ffb3c8" opacity=".7"/>
    <path d="M44 88 Q50 93 56 88" stroke="#a34a5a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M26 34 L34 48 L24 46Z" fill="${cfg.ribbon}"/>
    <rect x="30" y="102" width="40" height="28" rx="8" fill="#23265e"/>
    <path d="M42 102 L50 114 L58 102" stroke="${cfg.ribbon}" stroke-width="3" fill="none"/>
  </svg>`;
}
const CHARACTERS = [
  { id:'aiko', name:'Hoshino Aiko', title:'🌸 Idol Star · Lucky Encore', emoji:'🌸',
    desc:'Passive: +1 gold per line. Skill ENCORE (30s): vaporizes the bottom 2 rows & deals 4 dmg.',
    skillName:'🌸 ENCORE', skillCD:30,
    portrait:()=>portraitSVG('aiko') },
  { id:'rin', name:'Kurosawa Rin', title:'⚔️ Ronin Blade · Tetris Slayer', emoji:'⚔️',
    desc:'Passive: Tetris deals +2 dmg. Skill IAI SLASH (25s): 7 true damage to the enemy.',
    skillName:'⚔️ IAI SLASH', skillCD:25,
    portrait:()=>portraitSVG('rin') },
  { id:'yuki', name:'Yukishiro Yuki', title:'❄️ Moon Mage · Time Witch', emoji:'❄️',
    desc:'Passive: gravity 15% slower, enemy timer 10% slower. Skill TIME STOP (35s): freeze enemy 10s + slow fall 10s.',
    skillName:'❄️ TIME STOP', skillCD:35,
    portrait:()=>portraitSVG('yuki') },
];
const ENEMIES = [
  { name:'Poyo Slime-chan', sprite:'🟢', stage:'Stage 1 · Starfall Slums', hp:20, interval:14, garbage:1, dmg:6,  flavor:'Bounces happily. Slams you with goo.' },
  { name:'Golem Senpai',    sprite:'🗿', stage:'Stage 2 · Neon Shrine',    hp:34, interval:13, garbage:1, dmg:8,  flavor:'An ancient vending-machine spirit. Throws rubble.' },
  { name:'Kunoichi Yuna',   sprite:'🥷', stage:'Stage 3 · Electric Dojo',  hp:48, interval:12, garbage:2, dmg:10, flavor:'Throws shuriken garbage when you hesitate.' },
  { name:'Ryu the Dragon',  sprite:'🐉', stage:'Stage 4 · Sky Tower',      hp:65, interval:11, garbage:2, dmg:12, flavor:'Burns the well. Fear the double garbage.' },
  { name:'Demon Lord Akuma',sprite:'👹', stage:'FINAL · Eclipse Throne',   hp:90, interval:10, garbage:2, dmg:14, flavor:'BOSS: enrages under 30% HP. End the run here!' },
];
const RELICS = [
  { id:'blade',   ico:'🗡️', name:'Heavy Blade',    desc:'+1 damage per line cleared. Stacking cuts deeper.' },
  { id:'fang',    ico:'🧛', name:'Vampire Fang',   desc:'Heal 2 HP every time you score a Tetris.' },
  { id:'coin',    ico:'🪙', name:'Golden Mino',    desc:'+2 gold per line cleared. Heal is cheaper when rich.' },
  { id:'feather', ico:'🪶', name:'Sky Feather',    desc:'Gravity 12% slower. Float like an idol.' },
  { id:'hour',    ico:'⏳', name:'Hourglass',      desc:'Enemy attack timer 15% slower. Buy time.' },
  { id:'shield',  ico:'🛡️', name:'Barrier Charm',  desc:'Take 25% less damage from enemy attacks.' },
  { id:'bomb',    ico:'💣', name:'Bomb Collar',    desc:'Every 10 lines: 3 bonus damage. Ka-boom.' },
  { id:'glove',   ico:'🧤', name:'Sticky Gloves',  desc:'HOLD also deals 1 damage. Cooldown removed-ish (2s).' },
  { id:'combo',   ico:'🔥', name:'Combo Soul',     desc:'Combo bonus damage doubled. Keep the chain!' },
  { id:'btb',     ico:'⚡', name:'Backstab Dagger',desc:'Back-to-back Tetris bonus ×2.' },
  { id:'medic',   ico:'💊', name:'Medic Badge',    desc:'Heal 4 HP after each stage. +1 max... morale.' },
  { id:'glass',   ico:'🍷', name:'Glass Cannon',   desc:'+50% ALL damage, but max HP −20. High risk idol arc.' },
];

/* ---------- State ---------- */
const G = {
  screen:'title', char:CHARACTERS[0], grid:[], active:null, bag:[], queue:[],
  hold:null, canHold:true, holdCD:0,
  score:0, gold:0, lines:0, level:1, combo:-1, b2b:false,
  hp:100, maxhp:100, stage:0, enemyHP:1, enemyMax:1, attackT:0,
  relics:[], skillReadyAt:0, freezeUntil:0, slowUntil:0, bombCounter:0,
  dropAcc:0, lastTime:0, over:false, paused:false, muted:false,
  flashT:0, clearAnim:[],
};
const $ = id => document.getElementById(id);
const best = () => Number(localStorage.getItem('starfall_best')||0);
const setBest = v => localStorage.setItem('starfall_best', v);

function emptyGrid(){ return Array.from({length:ROWS},()=>Array(COLS).fill(null)); }
function refillBag(){
  const b = Object.keys(SHAPES).sort(()=>Math.random()-.5);
  G.bag.push(...b);
}
function nextPiece(){
  if(G.bag.length<7) refillBag();
  while(G.queue.length<5){ if(!G.bag.length) refillBag(); G.queue.push(G.bag.shift()); }
  return G.queue.shift();
}
function spawn(){
  const type = nextPiece();
  const m = SHAPES[type].map(r=>r.slice());
  G.active = { type, m, x:3, y: type==='I'?-1:0 };
  G.canHold = G.holdCD<=performance.now() ? true : G.canHold;
  if(collides(G.active.m, G.active.x, G.active.y)){ gameOver('topout'); }
}
function rotate(m, dir){
  const N=m.length, r=Array.from({length:N},()=>Array(N).fill(0));
  for(let y=0;y<N;y++)for(let x=0;x<N;x++) r[y][x]= dir>0? m[N-1-x][y] : m[x][N-1-y];
  return r;
}
function collides(m, px, py){
  for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++){
    if(!m[y][x]) continue;
    const nx=px+x, ny=py+y;
    if(nx<0||nx>=COLS||ny>=ROWS) return true;
    if(ny>=0 && G.grid[ny][nx]) return true;
  }
  return false;
}
function merge(){
  const {m,x,y,type}=G.active;
  for(let r=0;r<m.length;r++)for(let c=0;c<m[r].length;c++){
    if(!m[r][c]) continue;
    const ny=y+r;
    if(ny<0){ gameOver('topout'); return; }
    G.grid[ny][x+c]=type;
  }
}

/* ---------- Audio (procedural, no assets) ---------- */
let AC=null;
function ac(){ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended')AC.resume(); return AC; }
function tone(f=440,d=.08,type='square',v=.06,slide=0){
  if(G.muted) return;
  try{
    const a=ac(),o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.setValueAtTime(f,a.currentTime);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),a.currentTime+d);
    g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);
    o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d);
  }catch(e){}
}

/* ---------- Roguelike math ---------- */
const count = id => G.relics.filter(r=>r===id).length;
function gravityMs(){
  let base = Math.max(90, 800*Math.pow(.85, G.level-1));
  base *= 1 - .12*count('feather');
  if(G.char.id==='yuki') base *= 1.15;
  if(performance.now()<G.slowUntil) base *= 2.2;
  return base;
}
function enemyInterval(){
  const e = ENEMIES[G.stage];
  let t = e.interval * (1-.15*count('hour'));
  if(G.char.id==='yuki') t *= 1.10;
  if(e.name.includes('Akuma') && G.enemyHP < G.enemyMax*.3) t *= .7;
  return t;
}
function lineDamage(n){
  const base = {0:0,1:1,2:3,3:5,4:8}[n]||0;
  let d = base + 1*count('blade');
  let comboBonus = G.combo>0 ? Math.min(G.combo,8)* (count('combo')?1:.5) : 0;
  d += comboBonus;
  if(n===4){
    if(G.char.id==='rin') d+=2;
    if(G.b2b){ d *= count('btb')?2:1.5; }
  }
  if(count('glass')) d*=1.5;
  return Math.round(d*10)/10;
}
function dealDamageToEnemy(d, why){
  if(G.screen!=='play'||G.over) return;
  G.enemyHP = Math.max(0, G.enemyHP-d);
  floatDmg('-'+(Math.round(d*10)/10), true);
  $('enemy-sprite').classList.remove('hurt'); void $('enemy-sprite').offsetWidth;
  $('enemy-sprite').classList.add('hurt');
  tone(220+Math.min(d,10)*40,.12,'sawtooth',.07);
  spawnParticles(8, '#ffd34d');
  log(`<b>${d}</b> dmg → enemy <i>(${why})</i>`);
  if(G.enemyHP<=0) stageClear();
}
function hurtPlayer(d, why){
  let real = d*(1-.25*count('shield'));
  if(count('glass')) real*=1; // glass only cuts max hp
  real = Math.max(1, Math.round(real));
  G.hp -= real;
  canvas.classList.remove('shake'); void canvas.offsetWidth; canvas.classList.add('shake');
  tone(140,.25,'sawtooth',.09,-60);
  log(`💔 <b>${real}</b> damage to YOU (${why})`);
  if(G.hp<=0){ G.hp=0; gameOver('hp'); }
}
function addGarbage(n){
  for(let i=0;i<n;i++){
    G.grid.shift();
    const hole = Math.floor(Math.random()*COLS);
    G.grid.push(Array.from({length:COLS},(_,x)=> x===hole?null:'G'));
  }
}
function enemyAttack(){
  const e = ENEMIES[G.stage];
  addGarbage(e.garbage);
  hurtPlayer(e.dmg, e.name+' attack');
  toast(`⚠ ${e.name} attacks! +${e.garbage} garbage`);
  G.attackT = 0;
}
function stageClear(){
  tone(523,.12,'square',.07); setTimeout(()=>tone(659,.12,'square',.07),120); setTimeout(()=>tone(784,.25,'square',.08),240);
  const bonus = 100*(G.stage+1);
  G.score += bonus; G.gold += 10+G.stage*5+(G.char.id==='aiko'?5:0);
  G.hp = Math.min(G.maxhp, G.hp + 4*count('medic'));
  log(`✅ <b>${ENEMIES[G.stage].name} defeated!</b> +${bonus} score`);
  spawnParticles(30,'#59ffa0');
  if(G.stage>=ENEMIES.length-1){ gameOver('win'); return; }
  setTimeout(openDraft, 900);
}

/* ---------- Draft ---------- */
function draftOptions(){
  const pool=[...RELICS];
  pool.sort(()=>Math.random()-.5);
  return pool.slice(0,3);
}
function openDraft(){
  if(G.over) return;
  G.screen='draft';
  $('screen-draft').classList.remove('hidden');
  $('draft-kicker').textContent = `STAGE ${G.stage+1} CLEAR! ${ENEMIES[G.stage].name} DEFEATED`;
  const opts = draftOptions();
  const dc = $('draft-cards'); dc.innerHTML='';
  opts.forEach(r=>{
    const d=document.createElement('div'); d.className='draft-card';
    d.innerHTML=`<div class="ico">${r.ico}</div><h3>${r.name}</h3><p>${r.desc}</p><div class="stat">click to take</div>`;
    d.onclick=()=>{ takeRelic(r); };
    dc.appendChild(d);
  });
  const cost = Math.max(10, 25-count('coin')*3);
  $('btn-heal').textContent=`💖 HEAL +30 HP (${cost}g · you: ${G.gold}g)`;
  $('btn-heal').onclick=()=>{
    if(G.gold>=cost){ G.gold-=cost; G.hp=Math.min(G.maxhp,G.hp+30); tone(660,.15,'sine',.08); toast('💖 Healed +30 HP'); syncHUD(); $('btn-heal').textContent=`💖 HEALED! (${G.gold}g left)`; }
    else { toast('Not enough gold!'); tone(160,.2,'square',.07); }
  };
  $('btn-next-stage').onclick=()=>{ $('screen-draft').classList.add('hidden'); nextStage(); };
}
function takeRelic(r){
  G.relics.push(r.id);
  if(r.id==='glass') G.maxhp=Math.max(20,G.maxhp-20), G.hp=Math.min(G.hp,G.maxhp);
  tone(880,.2,'triangle',.08); toast(`${r.ico} ${r.name} acquired!`);
  log(`✨ Relic: <b>${r.name}</b> — ${r.desc}`);
  $('screen-draft').classList.add('hidden');
  nextStage();
}
function nextStage(){
  G.stage++;
  startStage(false);
}
function startStage(reset){
  const e = ENEMIES[G.stage];
  G.enemyMax=e.hp + Math.floor(G.stage*2); G.enemyHP=G.enemyMax; G.attackT=0;
  G.grid = reset? emptyGrid() : collapseKeepBoard();
  G.queue=[]; G.bag=[]; G.hold=null; G.canHold=true;
  spawn();
  G.screen='play';
  banner(`STAGE ${G.stage+1}`, `${e.sprite} ${e.name} — ${e.flavor}`);
  log(`—— <b>Stage ${G.stage+1}: ${e.name}</b> (HP ${G.enemyMax}) ——`);
  syncHUD();
}
function collapseKeepBoard(){
  // keep board but clear top 6 rows as mercy between stages
  const g = G.grid.length? G.grid : emptyGrid();
  for(let y=0;y<6;y++) g[y]=Array(COLS).fill(null);
  return g;
}

/* ---------- Line clears ---------- */
function clearLines(){
  let cleared=0;
  for(let y=ROWS-1;y>=0;y--){
    if(G.grid[y].every(c=>c)){ G.grid.splice(y,1); G.grid.unshift(Array(COLS).fill(null)); cleared++; y++; }
  }
  if(cleared>0){
    G.lines+=cleared;
    const newLevel = Math.floor(G.lines/10)+1;
    if(newLevel!==G.level){ G.level=newLevel; toast(`LEVEL ${G.level}! Speed up!`); tone(990,.2,'square',.07); }
    G.combo++;
    const isTetris = cleared===4;
    if(isTetris){ if(G.b2b) toast('BACK-TO-BACK TETRIS!'); G.b2b=true; } else if(cleared>0) G.b2b = cleared===4?G.b2b:false;
    const dmg = lineDamage(cleared);
    const names={1:'SINGLE',2:'DOUBLE',3:'TRIPLE',4:'TETRIS!'};
    toast(`${names[cleared]} → ${dmg} dmg${G.combo>1?` · combo x${G.combo}`:''}`);
    tone(300+cleared*150,.15,'square',.08);
    spawnParticles(cleared*8, COLORS[G.active?.type]||'#fff');
    // rewards
    let gold = cleared*(1+(G.char.id==='aiko'?1:0)+2*count('coin'));
    G.gold+=gold; G.score+= [0,100,300,500,800][cleared]*G.level + G.combo*50;
    if(cleared===4 && count('fang')){ G.hp=Math.min(G.maxhp,G.hp+2); log('🧛 Fang heals +2'); }
    G.bombCounter+=cleared;
    if(G.bombCounter>=10){ G.bombCounter-=10; dealDamageToEnemy(3,'Bomb Collar'); }
    if(G.grid.every(row=>row.every(c=>!c))){ dealDamageToEnemy(0,''); G.score+=1500; dealDamageToEnemy(6,'PERFECT CLEAR!'); toast('✨ PERFECT CLEAR! +6 dmg'); }
    dealDamageToEnemy(dmg, names[cleared]+(G.combo>1?` x${G.combo}`:''));
    G.attackT = Math.max(0, G.attackT - cleared*1.2); // clearing stalls enemy
    if(G.score>best()) setBest(G.score);
  } else G.combo=-1;
}

/* ---------- Skills ---------- */
function useSkill(){
  const now=performance.now();
  if(G.screen!=='play'||G.over) return;
  if(now<G.skillReadyAt){ toast(`Skill ready in ${Math.ceil((G.skillReadyAt-now)/1000)}s`); return; }
  const c=G.char;
  ac();
  if(c.id==='aiko'){
    // destroy bottom 2 rows
    let removed=0;
    for(let k=0;k<2;k++){ const row=G.grid[ROWS-1-k]; if(row.some(x=>x)) removed++; G.grid.splice(ROWS-1-k,1); G.grid.unshift(Array(COLS).fill(null)); }
    dealDamageToEnemy(4,'ENCORE ♪');
    toast('🌸 ENCORE! Bottom rows vaporized!');
    tone(660,.1,'triangle',.08); setTimeout(()=>tone(880,.2,'triangle',.08),100);
  }else if(c.id==='rin'){
    dealDamageToEnemy(7,'IAI SLASH ⚔');
    toast('⚔️ IAI SLASH! 7 damage!');
    tone(200,.2,'sawtooth',.09,600);
  }else{
    G.freezeUntil=now+10000; G.slowUntil=now+10000;
    toast('❄️ TIME STOP! Enemy frozen 10s');
    tone(1200,.4,'sine',.07,-800);
  }
  G.skillReadyAt=now+c.skillCD*1000;
}

/* ---------- Loop ---------- */
function step(dt){
  if(G.screen!=='play'||G.over||G.paused) return;
  // enemy timer
  const frozen = performance.now()<G.freezeUntil;
  if(!frozen){
    G.attackT += dt/1000;
    if(G.attackT>=enemyInterval()) enemyAttack();
  }
  // hold cd
  if(G.holdCD && performance.now()>G.holdCD){ G.holdCD=0; G.canHold=true; }
  // gravity
  G.dropAcc += dt;
  const g = gravityMs();
  while(G.dropAcc>g){
    G.dropAcc-=g;
    if(!collides(G.active.m,G.active.x,G.active.y+1)) G.active.y++;
    else { merge(); if(G.over)return; clearLines(); spawn(); G.dropAcc=0; break; }
  }
}
let raf=null;
function loop(t){
  const dt = Math.min(100, t-(G.lastTime||t)); G.lastTime=t;
  step(dt); render(); syncBars();
  raf=requestAnimationFrame(loop);
}

/* ---------- Render ---------- */
function drawCell(c,x,y,color,ghost=false){
  c.fillStyle = ghost? 'transparent' : (COLORS[color]||'#fff');
  c.globalAlpha = ghost? .28 : 1;
  c.fillStyle = ghost? (COLORS[color]||'#fff') : c.fillStyle;
  const px=x*CELL, py=y*CELL;
  c.fillRect(px+1,py+1,CELL-2,CELL-2);
  if(!ghost){
    c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(px+1,py+1,CELL-2,4);
    c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(px+1,py+CELL-5,CELL-2,4);
    if(color==='G'){ c.fillStyle='#23264a'; c.fillRect(px+1,py+1,CELL-2,CELL-2); c.fillStyle='#ff4d6d'; c.fillRect(px+6,py+6,CELL-12,CELL-12); }
  } else { c.strokeStyle=COLORS[color]; c.strokeRect(px+1.5,py+1.5,CELL-3,CELL-3); }
  c.globalAlpha=1;
}
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#070a24'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#1c1f4d';
  for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL+.5,0);ctx.lineTo(x*CELL+.5,ROWS*CELL);ctx.stroke();}
  for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL+.5);ctx.lineTo(COLS*CELL,y*CELL+.5);ctx.stroke();}
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){ const v=G.grid[y]?.[x]; if(v) drawCell(ctx,x,y,v); }
  if(G.active&&G.screen==='play'){
    // ghost
    let gy=G.active.y;
    while(!collides(G.active.m,G.active.x,gy+1)) gy++;
    const {m,x,type}=G.active;
    for(let r=0;r<m.length;r++)for(let c2=0;c2<m[r].length;c2++) if(m[r][c2]&&gy+r>=0) drawCell(ctx,x+c2,gy+r,type,true);
    for(let r=0;r<m.length;r++)for(let c2=0;c2<m[r].length;c2++) if(m[r][c2]&&G.active.y+r>=0) drawCell(ctx,x+c2,G.active.y+r,type);
  }
  if(G.paused&&G.screen==='play'){ ctx.fillStyle='#000a'; ctx.fillRect(0,0,300,600); ctx.fillStyle='#fff'; ctx.font='bold 28px sans-serif'; ctx.textAlign='center'; ctx.fillText('PAUSED',150,300); }
  drawMini(hctx, G.hold, 120, 80);
  G.queue.slice(0,3).forEach((t,i)=> drawMini(nctxs[i], t, 100, 60));
}
function drawMini(c, type, w, h){
  c.clearRect(0,0,w,h);
  if(!type){ c.fillStyle='#4a4e8a'; c.font='11px sans-serif'; c.textAlign='center'; c.fillText('—',w/2,h/2); return; }
  const m=SHAPES[type];
  const cw=Math.min(22, (w-16)/m[0].length), ch=Math.min(22,(h-16)/m.length);
  const s=Math.min(cw,ch), ox=(w-m[0].length*s)/2, oy=(h-m.length*s)/2;
  for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++) if(m[y][x]){
    c.fillStyle=COLORS[type]; c.fillRect(ox+x*s+1,oy+y*s+1,s-2,s-2);
    c.fillStyle='rgba(255,255,255,.4)'; c.fillRect(ox+x*s+1,oy+y*s+1,s-2,3);
  }
}

/* ---------- HUD ---------- */
function syncHUD(){
  $('hud-stage').textContent=`${Math.min(G.stage+1,5)}/5`;
  $('hud-score').textContent=G.score; $('hud-gold').textContent=G.gold;
  $('hud-best').textContent=best();
  $('hud-combo').textContent='x'+Math.max(0,G.combo);
  $('hud-lines').textContent=G.lines; $('hud-level').textContent=G.level;
  const e=ENEMIES[G.stage];
  $('enemy-name').textContent=e.name; $('enemy-title').textContent=e.stage;
  $('enemy-sprite').textContent=e.sprite;
  $('enemy-intent').textContent=`Attacks every ${enemyInterval().toFixed(1)}s: +${e.garbage} garbage, ${e.dmg} dmg. ${e.flavor}`;
  $('attack-text').textContent=`${G.attackT.toFixed(1)}s / ${enemyInterval().toFixed(1)}s`;
  $('char-name').textContent=G.char.name; $('char-title').textContent=G.char.title;
  $('char-portrait').innerHTML=G.char.portrait();
  $('skill-name').textContent=G.char.skillName+' (E)';
  $('skill-desc').textContent=G.char.desc;
  $('relic-count').textContent=G.relics.length;
  const rl=$('relic-list'); rl.innerHTML='';
  const grouped={}; G.relics.forEach(id=>grouped[id]=(grouped[id]||0)+1);
  Object.entries(grouped).forEach(([id,n])=>{
    const r=RELICS.find(x=>x.id===id);
    const d=document.createElement('div'); d.className='relic-chip'; d.innerHTML=`<b>${r.ico} ${r.name}${n>1?' ×'+n:''}</b><br/>${r.desc}`;
    rl.appendChild(d);
  });
  syncBars();
}
function syncBars(){
  $('hp-text').textContent=`${Math.max(0,Math.ceil(G.hp))}/${G.maxhp}`;
  $('hp-fill').style.width=(100*Math.max(0,G.hp)/G.maxhp)+'%';
  $('enemy-hp-text').textContent=`${Math.ceil(G.enemyHP)}/${G.enemyMax}`;
  $('enemy-hp-fill').style.width=(100*G.enemyHP/G.enemyMax)+'%';
  $('attack-fill').style.width=Math.min(100,100*G.attackT/enemyInterval())+'%';
  $('attack-text').textContent=`${G.attackT.toFixed(1)}s / ${enemyInterval().toFixed(1)}s`;
  if(G.screen==='play'){
    $('hud-score').textContent=G.score; $('hud-gold').textContent=G.gold;
    $('hud-combo').textContent='x'+Math.max(0,G.combo);
    $('hud-lines').textContent=G.lines; $('hud-level').textContent=G.level;
  }
  const now=performance.now();
  const btn=$('btn-skill');
  if(now>=G.skillReadyAt){ $('skill-cd').textContent='READY ✦'; btn.disabled=false; btn.classList.add('ready'); }
  else { $('skill-cd').textContent=Math.ceil((G.skillReadyAt-now)/1000)+'s'; btn.disabled=true; btn.classList.remove('ready'); }
}
function log(html){
  const l=$('log'); const d=document.createElement('div'); d.innerHTML=html;
  l.prepend(d); while(l.children.length>40) l.lastChild.remove();
}
function toast(msg){
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  $('toast-layer').appendChild(t); setTimeout(()=>t.remove(),2200);
}
function floatDmg(txt, enemy){
  const r=canvas.getBoundingClientRect();
  const d=document.createElement('div'); d.className='dmg-num'; d.textContent=txt;
  d.style.left=(r.left+window.scrollX+r.width*(enemy?.75:.25)+Math.random()*30)+'px';
  d.style.top=(r.top+window.scrollY+140+Math.random()*80)+'px';
  if(!enemy) d.style.color='#ff4d6d';
  $('dmg-layer').appendChild(d); setTimeout(()=>d.remove(),1000);
}
function banner(title, sub){
  $('banner-title').textContent=title; $('banner-sub').textContent=sub;
  $('stage-banner').classList.remove('hidden');
  setTimeout(()=>$('stage-banner').classList.add('hidden'),2200);
}
function spawnParticles(n,color){
  const w=$('board-fx');
  const r=w.getBoundingClientRect();
  for(let i=0;i<n;i++){
    const p=document.createElement('div'); p.className='particle';
    p.style.background=color; p.style.left=(20+Math.random()*80)+'%'; p.style.top=(30+Math.random()*50)+'%';
    p.style.setProperty('--dx',(Math.random()*220-110)+'px'); p.style.setProperty('--dy',(Math.random()*220-160)+'px');
    w.appendChild(p); setTimeout(()=>p.remove(),850);
  }
}

/* ---------- Flow ---------- */
function newRun(charId){
  G.char=CHARACTERS.find(c=>c.id===charId)||CHARACTERS[0];
  Object.assign(G,{grid:emptyGrid(),bag:[],queue:[],hold:null,canHold:true,score:0,gold:0,lines:0,level:1,combo:-1,b2b:false,hp:100,maxhp:100,stage:0,relics:[],skillReadyAt:0,freezeUntil:0,slowUntil:0,bombCounter:0,dropAcc:0,over:false,paused:false,attackT:0});
  $('log').innerHTML='';
  $('screen-title').classList.add('hidden'); $('screen-over').classList.add('hidden'); $('screen-draft').classList.add('hidden');
  log(`🌟 Run started with <b>${G.char.name}</b>!`);
  startStage(true);
}
function gameOver(reason){
  if(G.over) return;
  G.over=true; G.screen='over';
  if(G.score>best()) setBest(G.score);
  const win = reason==='win';
  $('over-kicker').textContent = win?'★ VICTORY ★': reason==='hp'?'💔 YOU DIED':'🧱 TOPPED OUT';
  $('over-title').textContent = win?'Demon Lord defeated! The Starfall is yours.':'Run ended at Stage '+(G.stage+1)+' — '+ENEMIES[G.stage].name;
  $('over-stats').textContent=`Score ${G.score} · Lines ${G.lines} · Level ${G.level} · Gold ${G.gold} · Best ${best()}`;
  $('over-relcis').innerHTML = G.relics.length? `<p class="tagline">Relics: ${G.relics.map(id=>RELICS.find(r=>r.id===id).ico+' '+RELICS.find(r=>r.id===id).name).join(' · ')}</p>`:'<p class="tagline">No relics this run.</p>';
  $('screen-over').classList.remove('hidden');
  tone(win?523:.5,.15,'square',.08); setTimeout(()=>tone(win?659:400,.15,'square',.08),150); setTimeout(()=>tone(win?784:300,.3,'square',.08),300);
  log(win?'🏆 <b>VICTORY!</b>':'☠ <b>Game over</b> ('+reason+')');
}

/* ---------- Input ---------- */
function move(dx){
  if(G.screen!=='play'||G.over||G.paused) return;
  if(!collides(G.active.m,G.active.x+dx,G.active.y)){ G.active.x+=dx; tone(200,.03,'square',.03); }
}
function softDrop(){
  if(G.screen!=='play'||G.over||G.paused) return;
  if(!collides(G.active.m,G.active.x,G.active.y+1)){ G.active.y++; G.score+=1; }
  else { merge(); if(G.over)return; clearLines(); spawn(); }
}
function rotateActive(dir){
  if(G.screen!=='play'||G.over||G.paused) return;
  const r=rotate(G.active.m,dir);
  const kicks=[0,-1,1,-2,2];
  for(const k of kicks){ if(!collides(r,G.active.x+k,G.active.y)){ G.active.m=r; G.active.x+=k; tone(330,.04,'square',.04); return; } }
}
function hardDrop(){
  if(G.screen!=='play'||G.over||G.paused) return;
  let d=0; while(!collides(G.active.m,G.active.x,G.active.y+1)){ G.active.y++; d++; }
  G.score+=d*2; tone(150,.08,'square',.07,-60);
  merge(); if(G.over)return; clearLines(); spawn(); G.dropAcc=0;
}
function hold(){
  if(G.screen!=='play'||G.over||G.paused||!G.canHold) return;
  const now=performance.now();
  tone(500,.06,'triangle',.05);
  if(count('glove')){ dealDamageToEnemy(1,'Sticky Gloves 🧤'); G.holdCD=now+2000; }
  else G.canHold=false;
  const cur=G.active.type;
  if(G.hold){ const t=G.hold; G.hold=cur; G.active={type:t,m:SHAPES[t].map(r=>r.slice()),x:3,y:t==='I'?-1:0}; if(collides(G.active.m,G.active.x,G.active.y)) gameOver('topout'); }
  else { G.hold=cur; spawn(); }
  if(!count('glove')) G.canHold=false;
}
document.addEventListener('keydown',e=>{
  if(e.key==='m'||e.key==='M'){ toggleMute(); return; }
  if(e.key==='h'||e.key==='H'){ toggleHelp(); return; }
  if(G.screen==='title'&&(e.key==='Enter'||e.key===' ')){ newRun(G.char.id); return; }
  if(e.key==='p'||e.key==='P'||e.key==='Escape'){
    if(G.screen==='play'){ G.paused=!G.paused; toast(G.paused?'⏸ Paused':'▶ Resumed'); }
    return;
  }
  if(G.screen!=='play') return;
  switch(e.code){
    case 'ArrowLeft': move(-1); e.preventDefault(); break;
    case 'ArrowRight': move(1); e.preventDefault(); break;
    case 'ArrowDown': softDrop(); e.preventDefault(); break;
    case 'ArrowUp': case 'KeyX': rotateActive(1); e.preventDefault(); break;
    case 'KeyZ': rotateActive(-1); break;
    case 'Space': hardDrop(); e.preventDefault(); break;
    case 'KeyC': case 'ShiftLeft': hold(); break;
    case 'KeyE': useSkill(); break;
  }
});
function toggleMute(){ G.muted=!G.muted; $('btn-mute').textContent=G.muted?'✕':'♪'; }
/* mouse: click left/right half to move, double-click hard drop — desktop convenience */
let lastClick=0;
canvas.addEventListener('click',e=>{
  if(G.screen!=='play') return;
  const now=performance.now();
  if(now-lastClick<300){ hardDrop(); lastClick=0; return; }
  lastClick=now;
  const r=canvas.getBoundingClientRect();
  move((e.clientX-r.left)<r.width/2?-1:1);
});

/* ---------- Title char select ---------- */
function buildCharSelect(){
  const el=$('char-select'); el.innerHTML='';
  CHARACTERS.forEach((c,i)=>{
    const d=document.createElement('div'); d.className='char-opt'+(G.char.id===c.id?' sel':'');
    d.innerHTML=`${c.portrait()}<h3>${c.emoji} ${c.name}</h3><div style="font-size:12px;color:var(--cyan)">${c.title}</div><small>${c.desc}</small><div class="stat">CD ${c.skillCD}s · press E in game</div>`;
    d.onclick=()=>{ G.char=c; ac(); tone(600+i*150,.1,'triangle',.06); buildCharSelect(); };
    el.appendChild(d);
  });
}
function toggleHelp(force){
  const h=$('screen-help');
  const show = force!==undefined?force:h.classList.contains('hidden');
  h.classList.toggle('hidden',!show);
}

/* ---------- Wire buttons ---------- */
$('btn-start').onclick=()=>{ ac(); newRun(G.char.id); };
$('btn-retry').onclick=()=>{ newRun(G.char.id); };
$('btn-title').onclick=()=>{ $('screen-over').classList.add('hidden'); G.screen='title'; $('screen-title').classList.remove('hidden'); buildCharSelect(); };
$('btn-restart').onclick=()=>{ if(confirm('Abandon this run?')){ G.over=false; G.screen='title'; $('screen-draft').classList.add('hidden'); $('screen-title').classList.remove('hidden'); buildCharSelect(); } };
$('btn-skill').onclick=useSkill;
$('btn-mute').onclick=toggleMute;
$('btn-help').onclick=()=>toggleHelp(true);
$('btn-close-help').onclick=()=>toggleHelp(false);

/* ---------- Boot ---------- */
buildCharSelect();
G.grid=emptyGrid();
G.screen='title';
syncHUD();
requestAnimationFrame(loop);
setInterval(syncHUD,500);
log('👋 Welcome to <b>STARFALL TACTICS</b>. Pick a heroine and press START.');
