/* ======================================
   script.js
   Explicação:
   - Lida com toda a lógica do countdown,
   - Botões Play/Pause (um único),
   - Exercício e Descanso simultâneos,
   - Tracker,
   - Confetti,
   - Lightbox, etc.
====================================== */

let treinoIniciado=false, treinoEncerrado=false, paused=false;
let accumulatedTime=0; // Exercício
let startPauseTime=0;
let lastCheckTime=0;
let intervalEx=null;  // setInterval do Exercicio
let intervalRest=null; // setInterval do Descanso

let totalA=0, doneA=0, totalB=0, doneB=0;

let restTotal=0;
let restStart=0;
let restRunning=false;

let exerciseLog=[];

let trocarTreinoId=null;

// Confetti
let confettiCanvas=null, ctx=null;
let confettiPieces=[];
let confettiTimer=null;

// Countdown
let firstStart=true; 
let countdownOverlay=null; 
let countdownDiv=null; 
let countdownVal=5; 
let countdownInterval=null;

// Ao carregar...
window.addEventListener('DOMContentLoaded', ()=>{
  // Contar checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
    if(ch.dataset.group==='A') totalA++;
    if(ch.dataset.group==='B') totalB++;
    ch.disabled=true;  // só habilita quando iniciar
    ch.addEventListener('change', handleCheck);
  });

  // Botões Desktop
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
  document.getElementById('stopBtn').addEventListener('click', encerrarTreino);
  document.getElementById('trackerDesktopBtn').addEventListener('click', toggleTrackerDesktop);
  document.getElementById('exportDesktopBtn').addEventListener('click', exportarCSV);

  // Botões Mobile
  document.getElementById('playPauseBtnMobile').addEventListener('click', togglePlayPause);
  document.getElementById('stopBtnMobile').addEventListener('click', encerrarTreino);
  document.getElementById('trackerToggleBtn').addEventListener('click', toggleTrackerMobile);
  document.getElementById('exportBtnMobile').addEventListener('click', exportarCSV);

  // Lightbox
  const lb=document.getElementById('lightbox');
  lb.addEventListener('click',(e)=>{ if(e.target===lb) fecharLightbox(); });
  document.querySelectorAll('.thumb-container img').forEach(img=>{
    img.addEventListener('click',()=>{
      document.getElementById('lightboxImg').src=img.dataset.full;
      lb.classList.add('open');
    });
  });

  // Hide header on scroll
  let lastScrollTop=0;
  window.addEventListener('scroll',()=>{
    const st=window.pageYOffset||document.documentElement.scrollTop;
    const head=document.getElementById('mainHeader');
    if(st>lastScrollTop){
      head.classList.add('header-hidden');
    } else {
      head.classList.remove('header-hidden');
    }
    lastScrollTop=(st<=0?0:st);
  });

  // Confetti
  confettiCanvas=document.getElementById('confettiCanvas');
  confettiCanvas.width=window.innerWidth;
  confettiCanvas.height=window.innerHeight;
  ctx=confettiCanvas.getContext('2d');

  // Countdown overlay
  countdownOverlay=document.createElement('div');
  countdownOverlay.style.position='fixed';
  countdownOverlay.style.top='0'; 
  countdownOverlay.style.left='0'; 
  countdownOverlay.style.width='100%'; 
  countdownOverlay.style.height='100%';
  countdownOverlay.style.backgroundColor='rgba(255,255,255,0.4)';
  countdownOverlay.style.backdropFilter='blur(8px)';
  countdownOverlay.style.zIndex='100000';
  countdownOverlay.style.display='none'; 
  countdownOverlay.style.justifyContent='center'; 
  countdownOverlay.style.alignItems='center';
  document.body.appendChild(countdownOverlay);

  countdownDiv=document.createElement('div');
  countdownDiv.style.fontFamily="'Russo One',sans-serif";
  countdownDiv.style.fontSize='3rem';
  countdownDiv.style.color='red';
  countdownOverlay.appendChild(countdownDiv);
});

/* -------------------------
   FUNÇÕES PLAY/PAUSE/STOP
------------------------- */
function togglePlayPause(){
  if(treinoEncerrado) return;
  if(!treinoIniciado){
    // Primeira vez
    if(firstStart){
      firstStart=false;
      showCountdown();
    } else {
      iniciarExercicio();
    }
  } else {
    // Já iniciou
    if(!paused){
      // Pausar
      pausarTreino();
    } else {
      // Retomar
      iniciarExercicio();
    }
  }
}

function showCountdown(){
  countdownVal=5;
  countdownOverlay.style.display='flex';
  countdownDiv.textContent=countdownVal;

  if(countdownInterval) clearInterval(countdownInterval);
  countdownInterval=setInterval(()=>{
    countdownVal--;
    if(countdownVal>0){
      countdownDiv.textContent=countdownVal;
    } else if(countdownVal===0){
      countdownDiv.textContent="Bom Treino Monstro!";
    } else {
      clearInterval(countdownInterval);
      setTimeout(()=>{
        countdownOverlay.style.display='none';
        iniciarExercicio();
      },1000);
    }
  },1000);
}

function iniciarExercicio(){
  treinoIniciado=true;
  paused=false;
  startPauseTime=Date.now();

  // Interval do exercício
  if(intervalEx) clearInterval(intervalEx);
  intervalEx=setInterval(()=>{
    const elapsed=accumulatedTime+(Date.now()-startPauseTime);
    document.getElementById('exerciseTimer').textContent=formatTime(elapsed);
    document.getElementById('exerciseTimerMobile').textContent=formatTime(elapsed);
  },50);

  // Se estava descansando, paramos
  if(restRunning){
    restRunning=false;
    if(intervalRest) clearInterval(intervalRest);
    restTotal+=(Date.now()-restStart);
    updateRestDisplay();
  }

  setCheckBoxesDisabled(false);

  // Botão vira Pausar
  document.getElementById('playPauseBtn').textContent="⏸ Pausar";
  document.getElementById('playPauseBtnMobile').textContent="⏸ Pausar";
}

function pausarTreino(){
  if(!treinoIniciado||treinoEncerrado||paused) return;
  paused=true;
  accumulatedTime+=(Date.now()-startPauseTime);
  if(intervalEx) clearInterval(intervalEx);
  intervalEx=null;

  setCheckBoxesDisabled(true);

  // Inicia Descanso
  restRunning=true;
  restStart=Date.now();
  if(intervalRest) clearInterval(intervalRest);
  intervalRest=setInterval(()=>{
    const r=restTotal+(Date.now()-restStart);
    document.getElementById('restTimer').textContent=formatTime(r);
    document.getElementById('restTimerMobile').textContent=formatTime(r);
  },50);

  // Botão vira Retomar
  document.getElementById('playPauseBtn').textContent="▶ Retomar";
  document.getElementById('playPauseBtnMobile').textContent="▶ Retomar";
}

function encerrarTreino(){
  if(!treinoIniciado||treinoEncerrado)return;
  if(!paused){
    accumulatedTime+=(Date.now()-startPauseTime);
    if(intervalEx) clearInterval(intervalEx);
    intervalEx=null;
  }
  treinoEncerrado=true; paused=true;
  if(restRunning){
    restRunning=false;
    if(intervalRest) clearInterval(intervalRest);
    intervalRest=null;
    restTotal+=(Date.now()-restStart);
  }
  updateRestDisplay();

  document.getElementById('modalCongrats').classList.add('show');
  startConfetti();
}
function fecharCongrats(){
  document.getElementById('modalCongrats').classList.remove('show');
  stopConfetti();
}

/* -------------------------
   TROCAR TREINO
------------------------- */
function mostrarTreino(id){
  if(treinoIniciado && !paused && !treinoEncerrado){
    trocarTreinoId=id;
    document.getElementById('modalTrocarTreino').classList.add('show');
  } else {
    doChangeTreino(id);
  }
}
function pausarAgora(){
  pausarTreino();
  document.getElementById('modalTrocarTreino').classList.remove('show');
  if(trocarTreinoId){
    doChangeTreino(trocarTreinoId);
    trocarTreinoId=null;
  }
}
function cancelarTrocaTreino(){
  document.getElementById('modalTrocarTreino').classList.remove('show');
  trocarTreinoId=null;
}
function doChangeTreino(id){
  document.querySelectorAll('section').forEach(sec=>sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* -------------------------
   CHECK/ TRACKER
------------------------- */
function handleCheck(e){
  if(!treinoIniciado||paused||treinoEncerrado){
    e.target.checked=!e.target.checked;
    alert("O treino precisa estar em andamento para marcar exercícios!");
    return;
  }
  const grp=e.target.dataset.group;
  if(e.target.checked){
    if(grp==='A') doneA++; else if(grp==='B') doneB++;
    const partial=(accumulatedTime+(Date.now()-startPauseTime))-lastCheckTime;
    lastCheckTime=accumulatedTime+(Date.now()-startPauseTime);
    const str=formatTime(partial);
    document.getElementById('lastExerciseTime').textContent="Último: "+str;
    document.getElementById('lastExerciseTimeMobile').textContent="Último: "+str;

    exerciseLog.push({
      name:e.target.dataset.exercise,
      timestamp:new Date().toLocaleTimeString(),
      delta:partial
    });
    addToTracker(e.target.dataset.exercise, partial);

    const tempoSpan=e.target.parentElement.querySelector('.tempo');
    if(tempoSpan) tempoSpan.textContent=str;

    checkFinal();
  } else {
    if(grp==='A') doneA--;
    else if(grp==='B') doneB--;
    const tempoSpan=e.target.parentElement.querySelector('.tempo');
    if(tempoSpan) tempoSpan.textContent="";
  }
}
function checkFinal(){
  if(doneA===totalA || doneB===totalB){
    if(!paused){
      accumulatedTime+=(Date.now()-startPauseTime);
      if(intervalEx) clearInterval(intervalEx);
      intervalEx=null;
    }
    treinoEncerrado=true; paused=true;
    if(restRunning){
      restRunning=false;
      if(intervalRest) clearInterval(intervalRest);
      intervalRest=null;
      restTotal+=(Date.now()-restStart);
    }
    updateRestDisplay();
    document.getElementById('modalCongrats').classList.add('show');
    startConfetti();
  }
}
function addToTracker(name,msVal){
  const str=name+" - "+formatTime(msVal);
  // Desktop
  const dUl=document.getElementById('trackerDesktopList');
  const liD=document.createElement('li');
  liD.textContent=str;
  dUl.appendChild(liD);
  // Mobile
  const mUl=document.getElementById('trackerMobileList');
  const liM=document.createElement('li');
  liM.textContent=str;
  mUl.appendChild(liM);

  updateRestDisplay();
}

/* Exibe o tempo final de descanso no tracker */
function updateRestDisplay(){
  document.getElementById('restTimer').textContent=formatTime(restTotal);
  document.getElementById('restTimerMobile').textContent=formatTime(restTotal);

  const dUl=document.getElementById('trackerDesktopList');
  let exD=dUl.querySelector('li[data-descanso="true"]');
  if(exD) exD.remove();
  const liD=document.createElement('li');
  liD.dataset.descanso="true";
  liD.textContent="Descanso Total - "+formatTime(restTotal);
  dUl.appendChild(liD);

  const mUl=document.getElementById('trackerMobileList');
  let exM=mUl.querySelector('li[data-descanso="true"]');
  if(exM) exM.remove();
  const liM=document.createElement('li');
  liM.dataset.descanso="true";
  liM.textContent="Descanso Total - "+formatTime(restTotal);
  mUl.appendChild(liM);
}

/* -------------------------
   EXPORT CSV
------------------------- */
function exportarCSV(){
  if(!treinoIniciado){
    alert("Você não iniciou o treino ainda!");
    return;
  }
  if(exerciseLog.length===0){
    alert("Nenhum exercício marcado. Nada para exportar.");
    return;
  }
  let csv="Exercicio,Horario,TempoParcial\n";
  exerciseLog.forEach(item=>{
    csv+=`${item.name},${item.timestamp},${formatTime(item.delta)}\n`;
  });
  csv+=`Descanso Total,,${formatTime(restTotal)}\n`;

  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download="treino.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* -------------------------
   AUX
------------------------- */
function formatTime(ms){
  const totalSec=Math.floor(ms/1000);
  const m=Math.floor(totalSec/60);
  const s=totalSec%60;
  const ms2=Math.floor((ms%1000)/10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms2).padStart(2,'0')}`;
}
function setCheckBoxesDisabled(disabled){
  document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
    if(!ch.checked) ch.disabled=disabled;
  });
}
function fecharLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxImg').src="";
}

/* GymRats/Spotify */
function abrirGymrats(){ 
  window.open("https://apps.apple.com/br/app/gymrats-desafio-fitness/id1453444814","_blank");
}
function abrirSpotify(){
  window.open("https://www.spotify.com/","_blank");
}

/* getUserMedia */
async function abrirCamera(){
  try{
    const st=await navigator.mediaDevices.getUserMedia({video:true});
    alert("Câmera do navegador ativada!");
  } catch(e){
    alert("Não foi possível acessar a câmera: "+e);
  }
}

/* Tracker Toggles */
let trackerDesktopVisible=false;
function toggleTrackerDesktop(){
  trackerDesktopVisible=!trackerDesktopVisible;
  document.getElementById('trackerDesktop').style.display=trackerDesktopVisible?"block":"none";
}
let trackerMobileOpen=false;
function toggleTrackerMobile(){
  trackerMobileOpen=!trackerMobileOpen;
  document.getElementById('trackerMobile').style.display=trackerMobileOpen?"block":"none";
}

/* CONFETTI (menor e mais rápido) */
function startConfetti(){
  confettiCanvas.width=window.innerWidth;
  confettiCanvas.height=window.innerHeight;
  ctx=confettiCanvas.getContext('2d');
  confettiPieces=[];
  for(let i=0;i<80;i++){
    confettiPieces.push({
      x:Math.random()*confettiCanvas.width,
      y:Math.random()*confettiCanvas.height- confettiCanvas.height,
      r:Math.random()*4+2,
      dx:Math.random()*2-1,
      dy:Math.random()*3+3,
      color:`hsl(${Math.random()*360},100%,50%)`
    });
  }
  confettiTimer=setInterval(updateConfetti,30);
}
function updateConfetti(){
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiPieces.forEach(p=>{
    p.x+=p.dx; p.y+=p.dy;
    if(p.y>confettiCanvas.height){
      p.y=-10; p.x=Math.random()*confettiCanvas.width;
    }
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,2*Math.PI);
    ctx.fillStyle=p.color;
    ctx.fill();
  });
}
function stopConfetti(){
  if(confettiTimer) clearInterval(confettiTimer);
  confettiTimer=null;
  if(ctx){
    ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  }
}
