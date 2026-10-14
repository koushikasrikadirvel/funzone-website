const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ---- saved best scores ---- */
function getBest(){try{return JSON.parse(localStorage.getItem('fz_best')||'{}');}catch(e){return {};}}
function saveBest(b){try{localStorage.setItem('fz_best',JSON.stringify(b));}catch(e){}}
function recordBest(k,v,lower){const b=getBest(); const better=b[k]===undefined||(lower?v<b[k]:v>b[k]); if(better){b[k]=v; saveBest(b);} updateHall(); return better;}
function updateHall(){
  const b=getBest(), f=v=>v===undefined?'–':v;
  $('#hMem').textContent=f(b.memory); $('#memBest').textContent=f(b.memory);
  $('#hTap').textContent=f(b.tap); $('#tapBest').textContent=f(b.tap);
  $('#hMath').textContent=f(b.math); $('#mathBest').textContent=f(b.math);
  $('#hTtt').textContent=b.ttt||0; $('#tBest').textContent=b.ttt||0;
}
function celebrate(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const em=['🎉','⭐','✨','🎈','💖','🌈'];
  for(let i=0;i<26;i++){const s=document.createElement('span'); s.className='confetti'; s.textContent=em[i%em.length];
    s.style.left=Math.random()*100+'vw'; s.style.animationDuration=(1.4+Math.random()*1.4)+'s'; s.style.animationDelay=(Math.random()*.4)+'s';
    document.body.appendChild(s); setTimeout(()=>s.remove(),3200);}
}

/* ---- game switching ---- */
const games={memory:{reset:memReset,stop:()=>clearInterval(mTimer)}, tap:{reset:tapIdle,stop:tapStop}, ttt:{reset:tttReset,stop:()=>{}}, math:{reset:mathIdle,stop:mathStop}};
function openGame(id){
  Object.values(games).forEach(g=>g.stop());
  $$('.gcard').forEach(c=>c.classList.toggle('active',c.dataset.game===id));
  $$('.panel').forEach(p=>p.hidden=p.id!=='p-'+id);
  games[id].reset();
}
$$('.gcard').forEach(c=>c.addEventListener('click',()=>{openGame(c.dataset.game); $('#stage').scrollIntoView({behavior:'smooth',block:'start'});}));

/* ---- 1. MEMORY MATCH ---- */
const EM=['🍎','🍌','🍇','🍓','🍉','🍍','🥝','🍒'];
let mFirst=null,mLock=false,mMoves=0,mMatched=0,mSecs=0,mStarted=false,mTimer;
function updMem(){$('#memMoves').textContent=mMoves; $('#memTime').textContent=mSecs+'s';}
function memReset(){
  clearInterval(mTimer); mSecs=0;mMoves=0;mMatched=0;mFirst=null;mLock=false;mStarted=false; updMem();
  const g=$('#memGrid'); g.innerHTML='';
  shuffle([...EM,...EM]).forEach(e=>{
    const b=document.createElement('button'); b.className='mcard'; b.dataset.e=e; b.setAttribute('aria-label','Hidden card');
    b.innerHTML='<span class="in"><span class="face front">❓</span><span class="face back">'+e+'</span></span>';
    b.addEventListener('click',()=>memClick(b)); g.appendChild(b);
  });
  $('#memMsg').textContent='Find all 8 pairs!';
}
function memClick(b){
  if(mLock||b.classList.contains('flip')) return;
  if(!mStarted){mStarted=true; mTimer=setInterval(()=>{mSecs++; updMem();},1000);}
  b.classList.add('flip'); b.setAttribute('aria-label',b.dataset.e);
  if(!mFirst){mFirst=b; return;}
  mMoves++; updMem(); const a=mFirst; mFirst=null;
  if(a.dataset.e===b.dataset.e){
    a.classList.add('done'); b.classList.add('done'); mMatched++;
    if(mMatched===8){clearInterval(mTimer); const rec=recordBest('memory',mMoves,true);
      $('#memMsg').textContent='🎉 Done in '+mMoves+' moves and '+mSecs+'s!'+(rec?' New best!':''); celebrate();}
  } else {
    mLock=true;
    setTimeout(()=>{[a,b].forEach(x=>{x.classList.remove('flip'); x.setAttribute('aria-label','Hidden card');}); mLock=false;},800);
  }
}
$('#memBtn').addEventListener('click',memReset);

/* ---- 2. TAP ATTACK ---- */
let tRun=false,tScore=0,tTime=30,tTick,tSpawn;
const tg=$('#tapGrid');
for(let i=0;i<9;i++){const h=document.createElement('button'); h.className='hole'; h.setAttribute('aria-label','Hole '+(i+1)); h.innerHTML='<span class="crit"></span>'; h.addEventListener('click',()=>tapHit(h)); tg.appendChild(h);}
function updTap(){$('#tapScore').textContent=tScore; $('#tapTime').textContent=tTime;}
function tapClear(){$$('.hole').forEach(h=>{clearTimeout(h._t); h.classList.remove('up');});}
function tapStop(){tRun=false; clearInterval(tTick); clearTimeout(tSpawn); tapClear();}
function tapIdle(){tapStop(); tScore=0; tTime=30; updTap(); $('#tapMsg').textContent='Press Start when you are ready!'; $('#tapBtn').textContent='Start';}
function tapStart(){
  tapStop(); tScore=0; tTime=30; tRun=true; updTap(); $('#tapBtn').textContent='Restart'; $('#tapMsg').textContent='Go go go! 🐹 +1 · 🌟 +3 · 💣 −2';
  tTick=setInterval(()=>{tTime--; updTap(); if(tTime<=0) tapEnd();},1000); tapLoop();
}
function tapLoop(){ if(!tRun) return; popOne(); tSpawn=setTimeout(tapLoop,Math.max(380,760-(30-tTime)*12)); }
function popOne(){
  const free=$$('.hole').filter(h=>!h.classList.contains('up')); if(!free.length) return;
  const h=free[Math.floor(Math.random()*free.length)], r=Math.random(), type=r<.13?'bomb':r<.25?'gold':'mole';
  h.dataset.type=type; h.querySelector('.crit').textContent={bomb:'💣',gold:'🌟',mole:'🐹'}[type]; h.classList.add('up');
  clearTimeout(h._t); h._t=setTimeout(()=>h.classList.remove('up'),Math.max(480,950-(30-tTime)*12));
}
function tapHit(h){
  if(!tRun||!h.classList.contains('up')) return;
  const d={bomb:-2,gold:3,mole:1}[h.dataset.type]; tScore=Math.max(0,tScore+d);
  clearTimeout(h._t); h.classList.remove('up'); h.classList.add('hit'); setTimeout(()=>h.classList.remove('hit'),200); updTap();
}
function tapEnd(){
  tapStop(); const rec=tScore>0&&recordBest('tap',tScore,false);
  $('#tapMsg').textContent='⏰ Time is up! You scored '+tScore+'.'+(rec?' New best! 🎉':''); $('#tapBtn').textContent='Play again'; if(rec) celebrate();
}
$('#tapBtn').addEventListener('click',tapStart);

/* ---- 3. TIC-TAC-TOE ---- */
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let board,tOver,tBusy,sW=0,sL=0,sD=0;
const tt=$('#tttGrid'), cells=[];
for(let i=0;i<9;i++){const c=document.createElement('button'); c.className='cell'; c.setAttribute('aria-label','Square '+(i+1)); c.addEventListener('click',()=>tttPlay(i)); tt.appendChild(c); cells.push(c);}
function tttDraw(){board.forEach((v,i)=>{cells[i].textContent=v==='X'?'❌':v==='O'?'⭕':''; cells[i].className='cell'+(v?' '+v.toLowerCase():'');});}
function winner(b){for(const l of LINES){if(b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]]) return {p:b[l[0]],l};} return null;}
function tttReset(){board=Array(9).fill(''); tOver=false; tBusy=false; tttDraw(); $('#tttMsg').textContent='Your turn — you are ❌'; $('#tW').textContent=sW; $('#tL').textContent=sL; $('#tD').textContent=sD;}
function tttEnd(){
  const w=winner(board); tOver=true;
  if(w){w.l.forEach(i=>cells[i].classList.add('win'));
    if(w.p==='X'){sW++; const b=getBest(); b.ttt=(b.ttt||0)+1; saveBest(b); updateHall(); $('#tttMsg').textContent='🎉 You win!'; celebrate();}
    else{sL++; $('#tttMsg').textContent='🤖 CPU wins this one. Try again!';}
  } else {sD++; $('#tttMsg').textContent="🤝 It's a draw!";}
  $('#tW').textContent=sW; $('#tL').textContent=sL; $('#tD').textContent=sD;
}
function tttPlay(i){
  if(tOver||tBusy||board[i]) return;
  board[i]='X'; tttDraw();
  if(winner(board)||board.every(Boolean)) return tttEnd();
  tBusy=true; $('#tttMsg').textContent='CPU is thinking…';
  setTimeout(()=>{cpuMove(); tttDraw(); tBusy=false;
    if(winner(board)||board.every(Boolean)) tttEnd(); else $('#tttMsg').textContent='Your turn — you are ❌';},450);
}
function cpuMove(){
  const empty=board.map((v,i)=>v?null:i).filter(v=>v!==null);
  const tryWin=p=>{for(const i of empty){board[i]=p; const w=winner(board); board[i]=''; if(w) return i;} return null;};
  let m=tryWin('O'); if(m===null) m=tryWin('X');
  if(m===null && !board[4]) m=4;
  if(m===null){const c=empty.filter(i=>[0,2,6,8].includes(i)); if(c.length) m=c[Math.floor(Math.random()*c.length)];}
  if(m===null) m=empty[Math.floor(Math.random()*empty.length)];
  board[m]='O';
}
$('#tttBtn').addEventListener('click',tttReset);

/* ---- 4. QUICK MATH ---- */
let mathRun=false,mathScore=0,mathTime=30,mathStreak=0,mathAns=0,mathTick;
function updMath(){$('#mathScore').textContent=mathScore; $('#mathStreak').textContent=mathStreak; $('#mathTime').textContent=mathTime;}
function mathStop(){mathRun=false; clearInterval(mathTick);}
function mathIdle(){mathStop(); mathScore=0; mathStreak=0; mathTime=30; updMath(); $('#mathQ').textContent='Ready?'; $('#mathOpts').innerHTML=''; $('#mathMsg').textContent='Press Start to begin!'; $('#mathBtn').textContent='Start';}
function mathStart(){
  mathStop(); mathScore=0; mathStreak=0; mathTime=30; mathRun=true; updMath(); $('#mathBtn').textContent='Restart'; $('#mathMsg').textContent='Go! Pick the right answer.';
  mathTick=setInterval(()=>{mathTime--; updMath(); if(mathTime<=0) mathEnd();},1000); nextQ();
}
function nextQ(){
  const ops=['+','-','×'], op=ops[Math.floor(Math.random()*3)]; let a,b;
  if(op==='+'){a=2+Math.floor(Math.random()*30); b=2+Math.floor(Math.random()*30); mathAns=a+b;}
  else if(op==='-'){a=10+Math.floor(Math.random()*30); b=2+Math.floor(Math.random()*(a-2)); mathAns=a-b;}
  else{a=2+Math.floor(Math.random()*9); b=2+Math.floor(Math.random()*9); mathAns=a*b;}
  $('#mathQ').textContent=a+' '+op+' '+b+' = ?';
  const set=new Set([mathAns]); while(set.size<4){const v=mathAns+Math.floor(Math.random()*13)-6; if(v>=0) set.add(v);}
  const box=$('#mathOpts'); box.innerHTML='';
  shuffle([...set]).forEach(v=>{const bt=document.createElement('button'); bt.className='opt'; bt.textContent=v; bt.addEventListener('click',()=>mathPick(bt,v)); box.appendChild(bt);});
}
function mathPick(bt,v){
  if(!mathRun) return;
  if(v===mathAns){
    mathScore++; mathStreak++; bt.classList.add('good');
    if(mathStreak%5===0){mathTime+=3; $('#mathMsg').textContent='🔥 '+mathStreak+' in a row! +3 seconds';}
  } else {mathStreak=0; bt.classList.add('bad'); $('#mathMsg').textContent='Oops! The answer was '+mathAns+'.';}
  updMath(); setTimeout(()=>{if(mathRun) nextQ();},260);
}
function mathEnd(){
  mathStop(); const rec=mathScore>0&&recordBest('math',mathScore,false);
  $('#mathMsg').textContent='⏰ Time! You got '+mathScore+' right.'+(rec?' New best! 🎉':''); $('#mathBtn').textContent='Play again';
  $('#mathQ').textContent='Score: '+mathScore; $('#mathOpts').innerHTML=''; if(rec) celebrate();
}
$('#mathBtn').addEventListener('click',mathStart);

/* ---- start ---- */
updateHall(); memReset();