/* 
  script.js
  v1.4.0 com Implementação de Local Storage
  - Persistência de dados utilizando Local Storage
  - Restabelecimento do estado do treino ao recarregar a página
  - Salvamento automático após interações relevantes
  - Correção de comportamento dos contadores ao pausar e recarregar a página
  - Limpeza do Local Storage ao encerrar o treino
*/

/* Variáveis Globais */
let treinoIniciado = false,
    treinoEncerrado = false,
    paused = false;
let accumulatedTime = 0; // Exercício
let startPauseTime = 0;
let lastCheckTime = 0;
let intervalEx = null;   // Intervalo para exercício
let intervalRest = null; // Intervalo para descanso

let totalA = 0, doneA = 0, totalB = 0, doneB = 0;
let restTotal = 0;
let restStart = 0;
let restRunning = false;

let exerciseLog = [];

let trocarTreinoId = null;

// Confetti
let confettiCanvas = null, ctx = null;
let confettiPieces = [];
let confettiTimer = null;

// Countdown
let firstStart = true;
let countdownOverlay = null;
let countdownDiv = null;
let countdownVal = 5;
let countdownInterval = null;

// Tracker Visibilidade
let trackerDesktopVisible = false;
let trackerMobileOpen = false;

// Câmera
let cameraStream = null;
let isFrontCamera = true;
let mediaRecorder = null;
let recordedChunks = [];

/* Evento DOMContentLoaded */
window.addEventListener('DOMContentLoaded', () => {
  // Inicialização dos checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(ch => {
    const grp = ch.dataset.group;
    if(grp === 'A') totalA++;
    if(grp === 'B') totalB++;
    ch.disabled = true;
    ch.addEventListener('change', handleCheck);
  });

  // Botões Desktop
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
  // STOP com confirmação
  document.getElementById('stopBtn').removeEventListener('click', encerrarTreino);
  document.getElementById('stopBtn').addEventListener('click', encerrarTreinoConfirm);

  document.getElementById('trackerDesktopBtn').addEventListener('click', toggleTrackerDesktop);
  document.getElementById('exportDesktopBtn').addEventListener('click', exportarCSV);

  // Botões Mobile
  document.getElementById('playPauseBtnMobile').addEventListener('click', togglePlayPause);
  // STOP com confirmação
  document.getElementById('stopBtnMobile').removeEventListener('click', encerrarTreino);
  document.getElementById('stopBtnMobile').addEventListener('click', encerrarTreinoConfirm);

  document.getElementById('trackerToggleBtn').addEventListener('click', toggleTrackerMobile);
  document.getElementById('exportBtnMobile').addEventListener('click', exportarCSV);

  // Lightbox
  const lb = document.getElementById('lightbox');
  lb.addEventListener('click', (e) => { if(e.target === lb) fecharLightbox(); });
  document.querySelectorAll('.thumb-container img').forEach(img => {
    img.addEventListener('click', () => {
      document.getElementById('lightboxImg').src = img.dataset.full;
      lb.classList.add('open');
    });
  });

  // Hide header on scroll
  let lastScrollTop = 0;
  window.addEventListener('scroll', () => {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    const head = document.getElementById('mainHeader');
    if(st > lastScrollTop){
      head.classList.add('header-hidden');
    } else {
      head.classList.remove('header-hidden');
    }
    lastScrollTop = (st <= 0) ? 0 : st;
  });

  // Confetti
  confettiCanvas = document.getElementById('confettiCanvas');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  ctx = confettiCanvas.getContext('2d');

  // Countdown Overlay
  countdownOverlay = document.createElement('div');
  countdownOverlay.style.position = 'fixed';
  countdownOverlay.style.top = '0'; 
  countdownOverlay.style.left = '0'; 
  countdownOverlay.style.width = '100%'; 
  countdownOverlay.style.height = '100%';
  countdownOverlay.style.background = 'rgba(255,255,255,0.4)';
  countdownOverlay.style.backdropFilter = 'blur(8px)';
  countdownOverlay.style.zIndex = '100000';
  countdownOverlay.style.display = 'none'; 
  countdownOverlay.style.justifyContent = 'center'; 
  countdownOverlay.style.alignItems = 'center';
  document.body.appendChild(countdownOverlay);

  countdownDiv = document.createElement('div');
  countdownDiv.style.fontFamily = "'Russo One',sans-serif";
  countdownDiv.style.fontSize = '3rem';
  countdownDiv.style.fontWeight = 'bold';
  countdownDiv.style.color = 'red';
  countdownOverlay.appendChild(countdownDiv);

  // Carregar dados do Local Storage
  loadData();

  document.getElementById("cameraFileInput").addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const img = document.getElementById("pictureFromCamera");
      img.src = window.URL.createObjectURL(file);
      img.style.display = "block";
    }
  });
});

/* ---------- FUNÇÕES: PLAY/PAUSE/STOP ---------- */
function togglePlayPause(){
  if(treinoEncerrado){
    resetTreino();
    saveData();
    return;
  }
  
  if(!treinoIniciado){
    if(firstStart){
      firstStart = false;
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
  countdownVal = 5;
  countdownOverlay.style.display = 'flex';
  countdownDiv.textContent = countdownVal;

  if(countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(()=>{
    countdownVal--;
    if(countdownVal > 0){
      countdownDiv.textContent = countdownVal;
    } else if(countdownVal === 0){
      countdownDiv.textContent = "Bom Treino Monstro!";
    } else {
      clearInterval(countdownInterval);
      setTimeout(()=>{
        countdownOverlay.style.display = 'none';
        iniciarExercicio();
      },1000);
    }
  },1000);
}

function iniciarExercicio(){
  treinoIniciado = true;
  paused = false;
  startPauseTime = Date.now();

  if(intervalEx) clearInterval(intervalEx);
  intervalEx = setInterval(()=>{
    const elapsed = accumulatedTime + (Date.now() - startPauseTime);
    // Desktop
    document.getElementById('exerciseTimeValue').textContent = formatTime(elapsed);
    // Mobile
    document.getElementById('exerciseTimerMobile').textContent = formatTime(elapsed);
  },50);

  // Se estava descansando
  if(restRunning){
    restRunning = false;
    if(intervalRest) clearInterval(intervalRest);
    restTotal += (Date.now() - restStart);
    updateRestDisplay();
  }

  setCheckBoxesDisabled(false);
  // Botão vira Pausar
  document.getElementById('playPauseBtn').textContent = "⏸ Pausar";
  document.getElementById('playPauseBtnMobile').textContent = "⏸";

  saveData();
}

function pausarTreino(){
  if(!treinoIniciado || treinoEncerrado || paused) return;
  paused = true;
  accumulatedTime += (Date.now() - startPauseTime);
  if(intervalEx) clearInterval(intervalEx);
  intervalEx = null;

  setCheckBoxesDisabled(true);

  // Inicia descanso
  restRunning = true;
  restStart = Date.now();
  if(intervalRest) clearInterval(intervalRest);
  intervalRest = setInterval(()=>{
    const r = restTotal + (Date.now() - restStart);
    // Desktop
    document.getElementById('restTimeValue').textContent = formatTime(r);
    // Mobile
    document.getElementById('restTimerMobile').textContent = formatTime(r);
  },50);

  // Botão vira “▶ Retomar”
  document.getElementById('playPauseBtn').textContent = "▶ Retomar";
  document.getElementById('playPauseBtnMobile').textContent = "▶";

  saveData();
}

// Confirmação para encerrar
function encerrarTreinoConfirm(){
  const c = confirm("Deseja realmente encerrar o treino?");
  if(c) encerrarTreino();
}

// Modifique a função encerrarTreino para limpar o local storage
function encerrarTreino(){
  if(!treinoIniciado || treinoEncerrado) return;
  if(!paused){
    accumulatedTime += (Date.now() - startPauseTime);
    if(intervalEx) clearInterval(intervalEx);
    intervalEx = null;
  }
  treinoEncerrado = true; 
  paused = true;

  if(restRunning){
    restRunning = false;
    if(intervalRest) clearInterval(intervalRest);
    intervalRest = null;
    restTotal += (Date.now() - restStart);
  }
  updateRestDisplay();
  document.getElementById('modalCongrats').classList.add('show');
  startConfetti();

  saveData();
  clearLocalStorage(); // Limpar o local storage ao encerrar o treino
}

function fecharCongrats(){
  document.getElementById('modalCongrats').classList.remove('show');
  stopConfetti();
}

/* ---------- TROCAR TREINO ---------- */
function mostrarTreino(id){
  if(treinoIniciado && !paused && !treinoEncerrado){
    trocarTreinoId = id;
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
    trocarTreinoId = null;
  }
}

function cancelarTrocaTreino(){
  document.getElementById('modalTrocarTreino').classList.remove('show');
  trocarTreinoId = null;
}

function doChangeTreino(id){
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ---------- CHECKBOXES / TRACKER ---------- */
function handleCheck(e){
  if(!treinoIniciado || paused || treinoEncerrado){
    e.target.checked = !e.target.checked;
    alert("O treino precisa estar em andamento para marcar exercícios!");
    return;
  }
  const grp = e.target.dataset.group;
  const exerciseName = e.target.dataset.exercise; 

  if(e.target.checked){
    if(grp === 'A') doneA++;
    else if(grp === 'B') doneB++;

    // Registro no Log
    const partial = accumulatedTime + (Date.now() - startPauseTime) - lastCheckTime;
    lastCheckTime = accumulatedTime + (Date.now() - startPauseTime);

    exerciseLog.push({
      name: exerciseName,
      timestamp: new Date().toLocaleTimeString(),
      delta: partial
    });

    addToTracker(exerciseName, partial);

    // Exibir tempo no <li>
    const tempoSpan = e.target.parentElement.querySelector('.tempo');
    if(tempoSpan) tempoSpan.textContent = formatTime(partial);

    checkFinal();
  } else {
    if(grp === 'A') doneA--;
    else if(grp === 'B') doneB--;
    const tempoSpan = e.target.parentElement.querySelector('.tempo');
    if(tempoSpan) tempoSpan.textContent = "00:00";
  }

  saveData();
}

function checkFinal(){
  if(doneA === totalA || doneB === totalB){
    if(!paused){
      accumulatedTime += (Date.now() - startPauseTime);
      if(intervalEx) clearInterval(intervalEx);
      intervalEx = null;
    }
    treinoEncerrado = true; 
    paused = true;
    if(restRunning){
      restRunning = false;
      if(intervalRest) clearInterval(intervalRest);
      intervalRest = null;
      restTotal += (Date.now() - restStart);
    }
    updateRestDisplay();
    document.getElementById('modalCongrats').classList.add('show');
    startConfetti();

    saveData();
  }
}

function addToTracker(name, msVal){
  const timeStr = formatTime(msVal);
  const strHtml = `<strong>${name}</strong> - ${timeStr}`;

  // Desktop
  const dUl = document.getElementById('trackerDesktopList');
  const liD = document.createElement('li');
  liD.innerHTML = strHtml;
  dUl.appendChild(liD);

  // Mobile
  const mUl = document.getElementById('trackerMobileList');
  const liM = document.createElement('li');
  liM.innerHTML = strHtml;
  mUl.appendChild(liM);

  updateRestDisplay();
}

/* Exibe tempo final de descanso */
function updateRestDisplay(){
  document.getElementById('restTimeValue').textContent = formatTime(restTotal);
  document.getElementById('restTimerMobile').textContent = formatTime(restTotal);

  // Tracker descanso
  const dUl = document.getElementById('trackerDesktopList');
  let exD = dUl.querySelector('li[data-descanso="true"]');
  if(exD) exD.remove();
  const liD = document.createElement('li');
  liD.dataset.descanso = "true";
  liD.innerHTML = "Descanso Total - " + formatTime(restTotal);
  dUl.appendChild(liD);

  const mUl = document.getElementById('trackerMobileList');
  let exM = mUl.querySelector('li[data-descanso="true"]');
  if(exM) exM.remove();
  const liM = document.createElement('li');
  liM.dataset.descanso = "true";
  liM.innerHTML = "Descanso Total - " + formatTime(restTotal);
  mUl.appendChild(liM);
}

/* ---------- EXPORT CSV ---------- */
function exportarCSV(){
  if(!treinoIniciado){
    alert("Você não iniciou o treino ainda!");
    return;
  }
  if(exerciseLog.length === 0){
    alert("Nenhum exercício marcado. Nada para exportar.");
    return;
  }
  let csv = "Exercicio,Horario,TempoParcial\n";
  exerciseLog.forEach(item => {
    csv += `"${item.name}","${item.timestamp}","${formatTime(item.delta)}"\n`;
  });
  csv += `"Descanso Total","","${formatTime(restTotal)}"\n`;

  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = "treino.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* Format time com ms */
function formatTime(ms){
  const totalSec = Math.floor(ms/1000);
  const m = Math.floor(totalSec/60);
  const s = totalSec%60;
  const ms2 = Math.floor((ms%1000)/10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms2).padStart(2,'0')}`;
}

/* Format time SEM ms */
function formatTimeNoMs(ms){
  const totalSec = Math.floor(ms/1000);
  const m = Math.floor(totalSec/60);
  const s = totalSec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function setCheckBoxesDisabled(disabled){
  document.querySelectorAll('input[type="checkbox"]').forEach(ch => {
    if(!ch.checked) ch.disabled = disabled;
  });
}

function fecharLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxImg').src = "";
}

/* GYMRATS / SPOTIFY */
function abrirGymrats(){
  const ua = navigator.userAgent.toLowerCase();
  if(/android/.test(ua)){
    window.location.href = "intent://#Intent;scheme=gymrats;package=com.hasz.gymrats.app;end";
    setTimeout(()=>{
      window.location.href = "https://play.google.com/store/apps/details?id=com.hasz.gymrats.app";
    },1500);
  } else if(/iphone|ipad|ipod/.test(ua)){
    window.location.href = "gymrats://";
    setTimeout(()=>{
      window.location.href = "https://apps.apple.com/br/app/gymrats-desafio-fitness/id1453444814";
    },1500);
  } else {
    window.open("https://apps.apple.com/br/app/gymrats-desafio-fitness/id1453444814","_blank");
  }
}
function abrirSpotify(){
  window.open("https://www.spotify.com/","_blank");
}

/* TRACKER Toggles */
function toggleTrackerDesktop(){
  trackerDesktopVisible = !trackerDesktopVisible;
  document.getElementById('trackerDesktop').style.display = trackerDesktopVisible ? "block" : "none";
  saveData();
}

function toggleTrackerMobile(){
  trackerMobileOpen = !trackerMobileOpen;
  document.getElementById('trackerMobile').style.display = trackerMobileOpen ? "block" : "none";
  saveData();
}

/* CONFETTI */
function startConfetti(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  ctx = confettiCanvas.getContext('2d');
  confettiPieces = [];
  for(let i=0; i<80; i++){
    confettiPieces.push({
      x:Math.random()*confettiCanvas.width,
      y:Math.random()*confettiCanvas.height - confettiCanvas.height,
      r:Math.random()*4+2,
      dx:Math.random()*2-1,
      dy:Math.random()*3+3,
      color:`hsl(${Math.random()*360},100%,50%)`
    });
  }
  confettiTimer = setInterval(updateConfetti,30);
}
function updateConfetti(){
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiPieces.forEach(p=>{
    p.x += p.dx; p.y += p.dy;
    if(p.y > confettiCanvas.height){
      p.y = -10; p.x = Math.random()*confettiCanvas.width;
    }
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,2*Math.PI);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
}
function stopConfetti(){
  if(confettiTimer) clearInterval(confettiTimer);
  confettiTimer = null;
  if(ctx){
    ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  }
}

/* MODAL CHANGELOG */
function abrirChangelog(){
  document.getElementById('modalChangelog').classList.add('show');
  saveData();
}
function fecharChangelog(){
  document.getElementById('modalChangelog').classList.remove('show');
  saveData();
}

/* ---------- PERSISTÊNCIA DE DADOS ---------- */
function saveData() {
  const data = {
    treinoIniciado,
    treinoEncerrado,
    paused,
    accumulatedTime,
    restTotal,
    doneA,
    doneB,
    totalA,
    totalB,
    exerciseLog,
    trackerDesktopVisible,
    trackerMobileOpen,
    lastCheckTime,
    restRunning,
    restStart,
    firstStart,
    startPauseTime
  };
  localStorage.setItem('treinoMonstroData', JSON.stringify(data));
}

function loadData() {
  const data = localStorage.getItem('treinoMonstroData');
  if (data) {
    const obj = JSON.parse(data);
    treinoIniciado = obj.treinoIniciado;
    treinoEncerrado = obj.treinoEncerrado;
    paused = obj.paused;
    accumulatedTime = obj.accumulatedTime;
    restTotal = obj.restTotal;
    doneA = obj.doneA;
    doneB = obj.doneB;
    totalA = obj.totalA;
    totalB = obj.totalB;
    exerciseLog = obj.exerciseLog || [];
    trackerDesktopVisible = obj.trackerDesktopVisible || false;
    trackerMobileOpen = obj.trackerMobileOpen || false;
    lastCheckTime = obj.lastCheckTime || 0;
    restRunning = obj.restRunning || false;
    restStart = obj.restStart || 0;
    firstStart = obj.firstStart !== undefined ? obj.firstStart : true;
    startPauseTime = obj.startPauseTime || 0;

    // Calcular o tempo decorrido
    if (treinoIniciado && !paused) {
      const now = Date.now();
      accumulatedTime += now - startPauseTime;
      startPauseTime = now;
    }

    // Atualizar os elementos do DOM com os valores dos contadores
    document.getElementById('exerciseTimeValue').textContent = formatTime(accumulatedTime);
    document.getElementById('exerciseTimerMobile').textContent = formatTime(accumulatedTime);
    document.getElementById('restTimeValue').textContent = formatTime(restTotal);
    document.getElementById('restTimerMobile').textContent = formatTime(restTotal);

    // Restaurar checkboxes estado
    document.querySelectorAll('input[type="checkbox"]').forEach(ch => {
      const grp = ch.dataset.group;
      const exerciseName = ch.dataset.exercise;
      const found = exerciseLog.find(item => item.name === exerciseName);
      if (found) {
        ch.checked = true;
        // Mostrar tempo
        const tempoSpan = ch.parentElement.querySelector('.tempo');
        if(tempoSpan) tempoSpan.textContent = formatTime(found.delta);
      } else {
        ch.checked = false;
      }
      ch.disabled = !treinoIniciado || paused || treinoEncerrado;
    });

    // Restaurar contadores
    if(treinoIniciado){
      if(!paused && !treinoEncerrado){
        iniciarExercicio(); // Reiniciar exercício
      } else if(paused){
        // Atualizar os elementos do DOM com os valores dos contadores
        document.getElementById('exerciseTimeValue').textContent = formatTime(accumulatedTime);
        document.getElementById('exerciseTimerMobile').textContent = formatTime(accumulatedTime);
        document.getElementById('restTimeValue').textContent = formatTime(restTotal);
        document.getElementById('restTimerMobile').textContent = formatTime(restTotal);
      }
    }

    // Restaurar trackers
    const dUl = document.getElementById('trackerDesktopList');
    const mUl = document.getElementById('trackerMobileList');
    dUl.innerHTML = '';
    mUl.innerHTML = '';
    exerciseLog.forEach(item => {
      addToTracker(item.name, item.delta);
    });

    // Restaurar último exercício
    if(exerciseLog.length > 0){
      const lastEx = exerciseLog[exerciseLog.length -1].name;
      const lastTime = formatTime(exerciseLog[exerciseLog.length -1].delta);
      document.getElementById('lastExerciseTime').innerHTML =
        `<strong>Último Exercício:</strong><br/>${lastEx} - ⌚${lastTime}`;
      document.getElementById('lastExerciseTimeMobile').innerHTML =
        `<strong>Último Exercício:</strong><br/>${lastEx} - ⌚${lastTime}`;
    } else {
      document.getElementById('lastExerciseTime').innerHTML =
        `<strong>Último Exercício:</strong><br/>--`;
      document.getElementById('lastExerciseTimeMobile').innerHTML =
        `<strong>Último Exercício:</strong><br/>--`;
    }

    // Restaurar visibilidade dos trackers
    document.getElementById('trackerDesktop').style.display = trackerDesktopVisible ? "block" : "none";
    document.getElementById('trackerMobile').style.display = trackerMobileOpen ? "block" : "none";
  }
}

// Função para salvar os contadores no local storage
function saveCounters() {
    localStorage.setItem('accumulatedTime', accumulatedTime);
    localStorage.setItem('restTotal', restTotal);
    localStorage.setItem('startPauseTime', startPauseTime);
}

// Função para carregar os contadores do local storage
function loadCounters() {
    accumulatedTime = parseInt(localStorage.getItem('accumulatedTime')) || 0;
    restTotal = parseInt(localStorage.getItem('restTotal')) || 0;
    startPauseTime = parseInt(localStorage.getItem('startPauseTime')) || 0;
}

// Função para limpar o local storage
function clearLocalStorage() {
    localStorage.removeItem('treinoMonstroData');
    localStorage.removeItem('accumulatedTime');
    localStorage.removeItem('restTotal');
    localStorage.removeItem('startPauseTime');
}

// Chame a função loadCounters quando a página carregar
window.onload = function() {
    loadCounters();
    loadData();
    // ...existing code...
};

// Atualize os contadores no local storage a cada segundo
setInterval(() => {
    if (treinoIniciado && !paused) {
        saveCounters();
    }
}, 1000);

/* ---------- RESET TREINO ---------- */
function resetTreino(){
  treinoIniciado = false;
  treinoEncerrado = false;
  paused = false;
  accumulatedTime = 0;
  restTotal = 0;
  doneA = 0;
  doneB = 0;
  exerciseLog = [];
  lastCheckTime = 0;
  restRunning = false;
  restStart = 0;
  firstStart = true;

  document.querySelectorAll('input[type="checkbox"]').forEach(ch => {
    ch.checked = false;
    ch.disabled = true;
    const tempoSpan = ch.parentElement.querySelector('.tempo');
    if(tempoSpan) tempoSpan.textContent = "00:00";
  });

  document.getElementById('trackerDesktopList').innerHTML = "";
  document.getElementById('trackerMobileList').innerHTML = "";

  document.getElementById('exerciseTimeValue').textContent = "00:00";
  document.getElementById('restTimeValue').textContent = "00:00";
  document.getElementById('exerciseTimerMobile').textContent = "00:00";
  document.getElementById('restTimerMobile').textContent = "00:00";

  document.getElementById('lastExerciseTime').innerHTML =
    `<strong>Último Exercício:</strong><br/>--`;
  document.getElementById('lastExerciseTimeMobile').innerHTML =
    `<strong>Último Exercício:</strong><br/>--`;

  // Atualizar botões
  document.getElementById('playPauseBtn').textContent = "▶ Iniciar";
  document.getElementById('playPauseBtnMobile').textContent = "▶";

  // Atualizar trackers visíveis
  document.getElementById('trackerDesktop').style.display = "none";
  document.getElementById('trackerMobile').style.display = "none";
  
  saveData();
}

/* ---------- FUNÇÕES AUXILIARES ---------- */
function formatTime(ms){
  const totalSec = Math.floor(ms/1000);
  const m = Math.floor(totalSec/60);
  const s = totalSec%60;
  const ms2 = Math.floor((ms%1000)/10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms2).padStart(2,'0')}`;
}

function formatTimeNoMs(ms){
  const totalSec = Math.floor(ms/1000);
  const m = Math.floor(totalSec/60);
  const s = totalSec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ---------- AUTO SAVE ---------- */
/* Já implementado nos eventos relevantes */

/* ---------- PERSISTÊNCIA DE DADOS ---------- */
/* Funções saveData() e loadData() já implementadas acima */

