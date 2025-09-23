// ===== 설정 =====
const TURN_LIMIT = 20; // 한 턴 제한 시간(초)

// ===== 참가자 입력 =====
let playersCount = Number(prompt("몇 명이 참가합니까?"));
while (!Number.isInteger(playersCount) || playersCount < 1) {
  playersCount = Number(prompt("1 이상의 정수를 입력하세요:"));
}
const players = [];
for (let i = 1; i <= playersCount; i++) {
  let name = "";
  do { name = (prompt(`${i}번 참가자 이름:`) || "").trim(); }
  while (name === "");
  players.push({ name, alive:true, score:0 });
}

// ===== DOM 요소 =====
const input = document.querySelector("#wordInput");
const button = document.querySelector("#submitBtn");
const wordEl = document.querySelector("#word");
const currentEl = document.querySelector("#currentPlayer");
const playersBoard = document.querySelector("#playersBoard");
const timerEl = document.querySelector("#timer");
const timeBar = document.querySelector("#timeBar");
const popup = document.querySelector("#winnerPopup");
const winnerNameEl = document.querySelector("#winnerName");
const finalScores = document.querySelector("#finalScores");

const eliminateSound = document.querySelector("#eliminateSound");
const winSound = document.querySelector("#winSound");
const bgMusic = document.querySelector("#bgMusic");

const themeToggle = document.querySelector("#themeToggle");
const musicToggle = document.querySelector("#musicToggle");
const bgSelect = document.querySelector("#bgSelect");

// ===== 상태 변수 =====
let currentWord = "";
const usedWords = [];
let turnIdx = 0;
let gameOver = false;
let timer;
let timeLeft = TURN_LIMIT;

// ===== 유틸 함수 =====
function normalize(w){ return (w||"").trim().normalize("NFC").toLowerCase(); }
const first = s=>s[0]; const last = s=>s[s.length-1];
function aliveCount(){ return players.filter(p=>p.alive).length; }
function nextAliveIndex(from){
  let i=from;
  do { i=(i+1)%players.length; } while(!players[i].alive);
  return i;
}

// ===== UI 업데이트 =====
function renderPlayers(){
  playersBoard.innerHTML="";
  players.forEach((p,i)=>{
    const li=document.createElement("li");
    const avatar=document.createElement("div");
    avatar.className="avatar";
    avatar.style.background = ["#2980b9","#e74c3c","#8e44ad","#16a085","#f39c12"][i%5];
    li.appendChild(avatar);

    const name=document.createElement("span");
    name.textContent=`${i+1}번 ${p.name}`;
    li.appendChild(name);

    const score=document.createElement("span");
    score.style.marginLeft="auto"; score.textContent=`${p.score}점`;
    li.appendChild(score);

    if(!p.alive) li.classList.add("out");
    if(i===turnIdx && p.alive) li.classList.add("bold");

    playersBoard.appendChild(li);
  });
}
function updateUI(){
  wordEl.textContent=currentWord||"—";
  currentEl.textContent=`${turnIdx+1}번 ${players[turnIdx].name}`;
  renderPlayers();
}

// ===== 타이머 =====
function startTimer(){
  clearInterval(timer);
  timeLeft=TURN_LIMIT;
  timerEl.textContent=timeLeft;
  timeBar.style.width="100%";
  timer=setInterval(()=>{
    timeLeft--;
    timerEl.textContent=timeLeft;
    timeBar.style.width = `${(timeLeft/TURN_LIMIT)*100}%`;
    if(timeLeft<=0){
      clearInterval(timer);
      eliminateCurrent("시간 초과 ⏰");
    }
  },1000);
}

// ===== 턴 이동 =====
function nextTurn(){
  if(gameOver) return;
  turnIdx=nextAliveIndex(turnIdx);
  updateUI();
  input.value="";
  input.focus();
  startTimer();
}

// ===== 탈락 처리 =====
function eliminateCurrent(reason){
  const p=players[turnIdx];
  p.alive=false;
  eliminateSound.play();
  alert(`${p.name} 탈락 😭 (${reason})`);
  if(aliveCount()===1){ endGame(); return; }
  nextTurn();
}

// ===== 게임 종료 =====
function endGame(){
  clearInterval(timer);
  const winner=players.find(pl=>pl.alive);
  gameOver=true;
  input.disabled=true; button.disabled=true;
  winnerNameEl.textContent=`${winner.name} 🏆`;
  winSound.play();

  finalScores.innerHTML="";
  players.sort((a,b)=>b.score-a.score).forEach((p,idx)=>{
    const li=document.createElement("li");
    const medal = ["🥇","🥈","🥉"];
    li.textContent=`${medal[idx]||""} ${p.name}: ${p.score}점`;
    finalScores.appendChild(li);
  });
  popup.classList.remove("hidden");
}

// ===== 이벤트 =====
button.addEventListener("click",()=>{
  if(gameOver) return;
  const raw=input.value;
  const newWord=normalize(raw);

  if(newWord===""){ input.classList.add("error"); 
    setTimeout(()=>input.classList.remove("error"),500); return; }
  if(usedWords.includes(newWord)){ eliminateCurrent("중복 단어 ❌"); return; }

  if(currentWord===""){
    currentWord=newWord;
    usedWords.push(newWord);
    players[turnIdx].score++;
    input.classList.add("success"); setTimeout(()=>input.classList.remove("success"),500);
    nextTurn(); return;
  }

  if(last(currentWord)!==first(newWord)){
    eliminateCurrent("규칙 위반 ⚠️");
    return;
  }

  currentWord=newWord;
  usedWords.push(newWord);
  players[turnIdx].score++;
  input.classList.add("success"); setTimeout(()=>input.classList.remove("success"),500);
  nextTurn();
});
input.addEventListener("keydown",e=>{ if(e.key==="Enter") button.click(); });

// 테마 토글
themeToggle.addEventListener("click",()=>{
  document.body.classList.toggle("dark");
});

// 배경음악 토글
musicToggle.addEventListener("click",()=>{
  if(bgMusic.paused){ bgMusic.play(); musicToggle.textContent="🔈"; }
  else { bgMusic.pause(); musicToggle.textContent="🔊"; }
});

// 배경 선택
const BACKGROUNDS={
  city:'url("https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1600&auto=format&fit=crop")',
  forest:'url("https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop")',
  ocean:'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop")'
};
function applyBackground(key){ document.documentElement.style.setProperty("--bg-url", BACKGROUNDS[key]); }
bgSelect.addEventListener("change",e=>applyBackground(e.target.value));
applyBackground(bgSelect.value);

// ===== 초기 실행 =====
updateUI();
input.focus();
startTimer();
