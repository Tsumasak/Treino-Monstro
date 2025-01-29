/* 
  script.js
  - Exercicio e Descanso: com intervals
  - Botões mobile só ícones
  - Último Exercício => 2 linhas
  - Tracker => nome bold, tempo normal (injetado no DOM)
  - Modal confetes com fundo glass
  - Novo btn Exportar na modal parabéns
  - Changelog modal
*/

let treinoIniciado=false, treinoEncerrado=false, paused=false;
let accumulatedTime=0; // Exercício
let startPauseTime=0;
let lastCheckTime=0;
let intervalEx=null;   // Interval p/ exercicio
let intervalRest=null; // Interval p/ descanso

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

window.addEventListener('DOMContentLoaded',()=>{
  // Contar checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
    const grp=ch.dataset.group;
    if(grp==='A') totalA++;
    if(grp==='B') totalB++;
    ch.disabled=true;
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

  // Countdown Overlay
  countdownOverlay=document.createElement('div');
  countdownOverlay.style.position='fixed';
  countdownOverlay.style.top='0'; 
  countdownOverlay.style.left='0'; 
  countdownOverlay.style.width='100%'; 
  countdownOverlay.style.height='100%';
  countdownOverlay.style.background='rgba(255,255,255,0.4)';
  countdownOverlay.style.backdropFilter='blur(8px)';
  countdownOverlay.style.zIndex='100000';
  countdownOverlay.style.display='none'; 
  countdownOverlay.style.justifyContent='center'; 
  countdownOverlay.style.alignItems='center';
  document.body.appendChild(countdownOverlay);

  countdownDiv=document.createElement('div');
  countdownDiv.style.fontFamily="'Russo One',sans-serif";
  countdownDiv.style.fontSize='3rem';
  countdownDiv.style.fontWeight='bold';
  countdownDiv.style.color='red';
  countdownOverlay.appendChild(countdownDiv);
});

/* ---------- FUNÇÕES: PLAY/PAUSE/STOP ---------- */
function togglePlayPause(){
  if(treinoEncerrado)return;
  if(!treinoIniciado){
    if(firstStart){
      firstStart=false;
      showCountdown();
    } else {
      iniciarExercicio();
    }
  } else {
    if(!paused){
      pausarTreino();
    } else {
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

  if(intervalEx) clearInterval(intervalEx);
  intervalEx=setInterval(()=>{
    const elapsed=accumulatedTime+(Date.now()-startPauseTime);
    // Desktop
    document.getElementById('exerciseTimeValue').textContent=formatTime(elapsed);
    // Mobile
    document.getElementById('exerciseTimerMobile').textContent=formatTime(elapsed);
  },50);

  // Se estava descansando
  if(restRunning){
    restRunning=false;
    if(intervalRest) clearInterval(intervalRest);
    restTotal+=(Date.now()-restStart);
    updateRestDisplay();
  }

  setCheckBoxesDisabled(false);
  // Botão vira Pausar
  document.getElementById('playPauseBtn').textContent="⏸ Pausar";
  document.getElementById('playPauseBtnMobile').textContent="⏸";
}

function pausarTreino(){
  if(!treinoIniciado||treinoEncerrado||paused)return;
  paused=true;
  accumulatedTime+=(Date.now()-startPauseTime);
  if(intervalEx) clearInterval(intervalEx);
  intervalEx=null;

  setCheckBoxesDisabled(true);

  // Inicia descanso
  restRunning=true;
  restStart=Date.now();
  if(intervalRest) clearInterval(intervalRest);
  intervalRest=setInterval(()=>{
    const r=restTotal+(Date.now()-restStart);
    // Desktop
    document.getElementById('restTimeValue').textContent=formatTime(r);
    // Mobile
    document.getElementById('restTimerMobile').textContent=formatTime(r);
  },50);

  // Botão vira “▶ Retomar” no desktop e “▶” no mobile
  document.getElementById('playPauseBtn').textContent="▶ Retomar";
  document.getElementById('playPauseBtnMobile').textContent="▶";
}

function encerrarTreino(){
  if(!treinoIniciado||treinoEncerrado)return;
  if(!paused){
    accumulatedTime+=(Date.now()-startPauseTime);
    if(intervalEx)clearInterval(intervalEx);
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

/* ---------- TROCAR TREINO ---------- */
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
  document.querySelectorAll('section').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ---------- CHECKBOXES / TRACKER ---------- */
function handleCheck(e){
  if(!treinoIniciado||paused||treinoEncerrado){
    e.target.checked=!e.target.checked;
    alert("O treino precisa estar em andamento para marcar exercícios!");
    return;
  }
  const grp=e.target.dataset.group;
  const exerciseName=e.target.dataset.exercise; 
  if(e.target.checked){
    if(grp==='A') doneA++; else if(grp==='B') doneB++;
    const partial=(accumulatedTime+(Date.now()-startPauseTime))-lastCheckTime;
    lastCheckTime=accumulatedTime+(Date.now()-startPauseTime);

    const strNoMs=formatTimeNoMs(partial); 
    // ex: "12:32"
    // Exemplo de 2 linhas:
    // "Último Exercício:\nCardio Caminhada/Bike 10-15min - ⌚12:32"
    document.getElementById('lastExerciseTime').innerHTML=
      `Último Exercício:<br/>${exerciseName} - ⌚${strNoMs}`;

    document.getElementById('lastExerciseTimeMobile').innerHTML=
      `Último Exercício:<br/>${exerciseName} - ⌚${strNoMs}`;

    // Adiciona no tracker
    exerciseLog.push({
      name:exerciseName,
      timestamp:new Date().toLocaleTimeString(),
      delta:partial
    });
    addToTracker(exerciseName, partial);

    // Se no tempo do <li> quiser ms, use formatTime:
    const tempoSpan=e.target.parentElement.querySelector('.tempo');
    if(tempoSpan) tempoSpan.textContent=formatTime(partial);

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
  // Nome em bold, tempo normal
  const timeStr=formatTime(msVal);
  // ex: <strong>Rosca Biceps</strong> - 03:24.56
  const strHtml=`<strong>${name}</strong> - ${timeStr}`;

  // Desktop
  const dUl=document.getElementById('trackerDesktopList');
  const liD=document.createElement('li');
  liD.innerHTML=strHtml;
  dUl.appendChild(liD);

  // Mobile
  const mUl=document.getElementById('trackerMobileList');
  const liM=document.createElement('li');
  liM.innerHTML=strHtml;
  mUl.appendChild(liM);

  updateRestDisplay();
}

/* Exibe tempo final de descanso */
function updateRestDisplay(){
  document.getElementById('restTimeValue').textContent=formatTime(restTotal);
  document.getElementById('restTimerMobile').textContent=formatTime(restTotal);

  // Tracker desc
  const dUl=document.getElementById('trackerDesktopList');
  let exD=dUl.querySelector('li[data-descanso="true"]');
  if(exD) exD.remove();
  const liD=document.createElement('li');
  liD.dataset.descanso="true";
  liD.innerHTML="Descanso Total - "+formatTime(restTotal);
  dUl.appendChild(liD);

  const mUl=document.getElementById('trackerMobileList');
  let exM=mUl.querySelector('li[data-descanso="true"]');
  if(exM) exM.remove();
  const liM=document.createElement('li');
  liM.dataset.descanso="true";
  liM.innerHTML="Descanso Total - "+formatTime(restTotal);
  mUl.appendChild(liM);
}

/* ---------- EXPORT CSV ---------- */
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

/* Format time com ms */
function formatTime(ms){
  const totalSec=Math.floor(ms/1000);
  const m=Math.floor(totalSec/60);
  const s=totalSec%60;
  const ms2=Math.floor((ms%1000)/10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms2).padStart(2,'0')}`;
}
/* Format time SEM ms - p/ "Ultimo Exercício" */
function formatTimeNoMs(ms){
  const totalSec=Math.floor(ms/1000);
  const m=Math.floor(totalSec/60);
  const s=totalSec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
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

/* GYMRATS / SPOTIFY */
function abrirGymrats(){
  if(/android/i.test(navigator.userAgent)){
    // Android
    window.location.href="intent://com.hasz.gymrats.app#Intent;scheme=gymrats;package=com.hasz.gymrats.app;end";
    setTimeout(()=>{
      window.open("https://play.google.com/store/apps/details?id=com.hasz.gymrats.app","_blank");
    },1500);
  } else if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
    // iOS
    window.location.href="gymrats://";
    setTimeout(()=>{
      window.open("https://apps.apple.com/br/app/gymrats-desafio-fitness/id1453444814","_blank");
    },1500);
  } else {
    window.open("https://play.google.com/store/apps/details?id=com.hasz.gymrats.app","_blank");
  }
}
function abrirSpotify(){
  window.open("https://www.spotify.com/","_blank");
}

/* CAMERA */
function abrirCameraNativo(){
  if(/android/i.test(navigator.userAgent)){
    // Android camera intent
    window.location.href="intent://camera#Intent;action=android.media.action.IMAGE_CAPTURE;end";
  } else if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
    // iOS
    window.location.href="camera://";
  } else {
    alert("Não foi possível abrir a câmera nativa neste dispositivo.");
  }
}
/* TRACKER Toggles */
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

/* CONFETTI */
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

/* MODAL CHANGELOG */
function abrirChangelog(){
  document.getElementById('modalChangelog').classList.add('show');
}
function fecharChangelog(){
  document.getElementById('modalChangelog').classList.remove('show');
}
