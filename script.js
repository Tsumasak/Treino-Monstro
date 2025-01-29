/* script.js
   - Confirm STOP
   - Botão Gymrats abrindo o App se instalado (intent://... fallback)
   - Câmera nativa via "camera://" scheme
   - Etc.
*/

let treinoIniciado=false, treinoEncerrado=false, paused=false;
let accumulatedTime=0;
let startPauseTime=0;
let lastCheckTime=0;
let intervalEx=null;
let intervalRest=null;
let restTotal=0, restStart=0, restRunning=false;
let totalA=0, doneA=0, totalB=0, doneB=0;
let exerciseLog=[];
let trocarTreinoId=null;

let confettiCanvas=null, ctx=null, confettiPieces=[];
let confettiTimer=null;
let firstStart=true;
let countdownOverlay=null, countdownDiv=null, countdownVal=5, countdownInterval=null;

/* ON LOAD */
window.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
    if(ch.dataset.group==='A') totalA++;
    else if(ch.dataset.group==='B') totalB++;
    ch.disabled=true;
    ch.addEventListener('change', handleCheck);
  });

  // Desktop buttons
  document.getElementById('playPauseBtnDesktop').addEventListener('click', togglePlayPauseDesktop);
  document.getElementById('stopBtnDesktop').addEventListener('click', confirmStopDesktop);
  document.getElementById('trackerDesktopBtn2').addEventListener('click', toggleTrackerDesktopFlutuante);
  document.getElementById('exportDesktopBtn2').addEventListener('click', exportarCSV);

  // Mobile
  document.getElementById('playPauseBtnMobile').addEventListener('click', togglePlayPauseMobile);
  document.getElementById('stopBtnMobile').addEventListener('click', confirmStopMobile);
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

/* DESKTOP-LIKE FUNCS */
function togglePlayPauseDesktop(){
  if(!treinoIniciado){
    if(firstStart){ firstStart=false; showCountdown(); }
    else iniciarTreino();
  } else {
    if(!paused) pausarTreino();
    else iniciarTreino();
  }
}
function confirmStopDesktop(){
  const confirmMsg=confirm("Tem certeza que deseja encerrar o treino?");
  if(confirmMsg){
    encerrarTreino();
  }
}
function toggleTrackerDesktopFlutuante(){
  const el=document.getElementById('trackerDesktopFlutuante');
  el.style.display=(el.style.display==='none'?'block':'none');
}

/* MOBILE-LIKE FUNCS */
function togglePlayPauseMobile(){
  if(!treinoIniciado){
    if(firstStart){ firstStart=false; showCountdown(); }
    else iniciarTreino();
  } else {
    if(!paused) pausarTreino();
    else iniciarTreino();
  }
}
function confirmStopMobile(){
  const confirmMsg=confirm("Tem certeza que deseja encerrar o treino?");
  if(confirmMsg){
    encerrarTreino();
  }
}

/* GERAL FUNCS DE EXERCICIO */
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
        iniciarTreino();
      },1000);
    }
  },1000);
}
function iniciarTreino(){
  treinoIniciado=true; paused=false;
  startPauseTime=Date.now();

  if(intervalEx) clearInterval(intervalEx);
  intervalEx=setInterval(()=>{
    const elapsed=accumulatedTime+(Date.now()-startPauseTime);
    // Desktop
    document.getElementById('exerciseTimerDesktop').textContent=formatTime(elapsed);
    // Mobile
    document.getElementById('exerciseTimerMobile').textContent=formatTime(elapsed);
  },50);

  if(restRunning){
    restRunning=false;
    if(intervalRest) clearInterval(intervalRest);
    restTotal+=(Date.now()-restStart);
    updateRestDisplay();
  }
}
function pausarTreino(){
  if(!treinoIniciado||treinoEncerrado||paused)return;
  paused=true;
  accumulatedTime+=(Date.now()-startPauseTime);
  if(intervalEx){ clearInterval(intervalEx); intervalEx=null; }

  // Descanso
  restRunning=true; restStart=Date.now();
  if(intervalRest) clearInterval(intervalRest);
  intervalRest=setInterval(()=>{
    const r=restTotal+(Date.now()-restStart);
    document.getElementById('restTimerDesktop').textContent=formatTime(r);
    document.getElementById('restTimerMobile').textContent=formatTime(r);
  },50);
}
function encerrarTreino(){
  if(!treinoIniciado||treinoEncerrado)return;
  if(!paused){
    accumulatedTime+=(Date.now()-startPauseTime);
    if(intervalEx){ clearInterval(intervalEx); intervalEx=null; }
  }
  treinoEncerrado=true; paused=true;
  if(restRunning){
    restRunning=false;
    if(intervalRest){ clearInterval(intervalRest); intervalRest=null; }
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

/* CHECK / TRACKER */
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

    // 2-linhas no "Último Exercício"
    const exerciseName=e.target.dataset.exercise;
    const strNoMs=formatTimeNoMs(partial);
    document.getElementById('lastExerciseDesktop').innerHTML=
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

    // Tempo c/ ms no label
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
      if(intervalEx){ clearInterval(intervalEx); intervalEx=null; }
    }
    treinoEncerrado=true; paused=true;
    if(restRunning){
      restRunning=false;
      if(intervalRest){ clearInterval(intervalRest); intervalRest=null; }
      restTotal+=(Date.now()-restStart);
    }
    updateRestDisplay();
    document.getElementById('modalCongrats').classList.add('show');
    startConfetti();
  }
}
function addToTracker(name,msVal){
  // "<strong>nome</strong> - tempo"
  const htmlStr=`<strong>${name}</strong> - ${formatTime(msVal)}`;

  // Sidebar flutuante desktop
  const dsf=document.getElementById('trackerDesktopListFlutuante');
  const liDsf=document.createElement('li');
  liDsf.innerHTML=htmlStr;
  dsf.appendChild(liDsf);

  // Mobile
  const mobUl=document.getElementById('trackerMobileList');
  const liM=document.createElement('li');
  liM.innerHTML=htmlStr;
  mobUl.appendChild(liM);

  updateRestDisplay();
}
function updateRestDisplay(){
  // Desktop
  document.getElementById('restTimerDesktop').textContent=formatTime(restTotal);
  // Mobile
  document.getElementById('restTimerMobile').textContent=formatTime(restTotal);
}

/* CSV */
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

/* FUNCS UTILS */
function formatTime(ms){
  const totalSec=Math.floor(ms/1000);
  const m=Math.floor(totalSec/60);
  const s=totalSec%60;
  const ms2=Math.floor((ms%1000)/10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms2).padStart(2,'0')}`;
}
function formatTimeNoMs(ms){
  const totalSec=Math.floor(ms/1000);
  const m=Math.floor(totalSec/60);
  const s=totalSec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function fecharLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxImg').src="";
}
function setCheckBoxesDisabled(disabled){
  document.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
    if(!ch.checked) ch.disabled=disabled;
  });
}

/* GYMRATS => Tentar abrir app no Android. 
   Ex: intent:// 
   Se falhar, fallback pro store. 
*/
function abrirGymrats(){
  // Tenta abrir App
  // Uma forma: window.location = "intent://com.hasz.gymrats.app#Intent;scheme=;end";
  // ou custom URI scheme. 
  // Em fallback, abre store.
  if(/android/i.test(navigator.userAgent)){
    // Android
    window.location.href = "intent://com.hasz.gymrats.app#Intent;scheme=gymrats;package=com.hasz.gymrats.app;end";
    setTimeout(()=>{
      window.open("https://play.google.com/store/apps/details?id=com.hasz.gymrats.app","_blank");
    },2000);
  } else if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
    // iOS -> custom URL scheme ou store
    window.location.href = "gymrats://";
    setTimeout(()=>{
      window.open("https://apps.apple.com/br/app/gymrats-desafio-fitness/id1453444814","_blank");
    },2000);
  } else {
    // Desktop fallback
    window.open("https://play.google.com/store/apps/details?id=com.hasz.gymrats.app","_blank");
  }
}
function abrirSpotify(){
  window.open("https://www.spotify.com/","_blank");
}

/* ABRIR CAMERA NATIVA => 'camera://' ou Intents custom */
function abrirCameraNativo(){
  if(/android/i.test(navigator.userAgent)){
    window.location.href="intent://camera#Intent;action=android.media.action.IMAGE_CAPTURE;end";
  } else if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
    // iOS -> "camera://" se tiver scheme, fallback 
    window.location.href="camera://";
  } else {
    alert("Não foi possível abrir a câmera nativa neste dispositivo.");
  }
}

/* CHANGELOG MODAL */
function abrirChangelog(){
  document.getElementById('modalChangelog').classList.add('show');
}
function fecharChangelog(){
  document.getElementById('modalChangelog').classList.remove('show');
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
