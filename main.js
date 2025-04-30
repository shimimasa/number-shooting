<<<<<<< HEAD
// --- Canvas初期設定 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 700;
canvas.style.width = "100%";
canvas.style.maxWidth = "400px";
canvas.style.height = "auto";

// --- 変数初期化 ---
let bullets = [], particles = [], message = null;
let score = 0, timeLeft = 60, enemyLife = 0, messageTimer = 0;
let timerInterval = null, enemy = null;
let selectedProblemType = null, selectedMode = null;
let problemConfig = {}, totalAnswers = 0, correctAnswers = 0;
let modeType = '', problemType = '';

// --- Canvasレスポンシブ対応 ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

// --- メニュー選択 ---
document.querySelectorAll("#typeButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#typeButtons button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedProblemType = btn.dataset.type;
    updateProblemConfig();
  });
});
document.querySelectorAll("#modeButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#modeButtons button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedMode = btn.dataset.mode;
  });
});
document.getElementById("startButton").addEventListener("click", () => {
  if (!selectedProblemType || !selectedMode) return alert("出題タイプとモードを選んでください");
  startGame(selectedMode, selectedProblemType);
});

let selectedDifficulty = "normal";  // デフォルト

document.querySelectorAll("#difficultyButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#difficultyButtons button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedDifficulty = btn.dataset.difficulty;
  });
});

function flashMessage(text, color) {
    message = { text, color, scale: 1.5 }; // ← 拡大表示
    messageTimer = 30;
}  


function updateProblemConfig() {
  problemConfig = {
    integers: selectedProblemType !== 'decimal' && selectedProblemType !== 'fraction',
    decimals: selectedProblemType !== 'integer' && selectedProblemType !== 'fraction',
    fractions: selectedProblemType !== 'integer' && selectedProblemType !== 'decimal',
    max: selectedProblemType === 'integer' ? 99 : 10
  };
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  function createNumber(type) {
    const max = problemConfig.max || 10;
    if (type === 'integer') {
      const v = Math.floor(Math.random() * max) + 1;
      return { text: v.toString(), value: v };
    } else if (type === 'decimal') {
      const v = Math.round((Math.random() * (max - 1) + 1) * 10) / 10;
      return { text: v.toFixed(1), value: v };
    } else {
      let n = Math.floor(Math.random() * 9) + 1;
      let d = Math.floor(Math.random() * 9) + 1;
      while (n >= d) d = Math.floor(Math.random() * 9) + 1;
      return { text: `${n}/${d}`, value: n / d };
    }
  }
  
  function generateNumbers() {
    const types = [];
    if (problemConfig.integers) types.push("integer");
    if (problemConfig.decimals) types.push("decimal");
    if (problemConfig.fractions) types.push("fraction");
    const type1 = randomChoice(types);
    const type2 = randomChoice(types);
    let num1 = createNumber(type1);
    let num2 = createNumber(type2);
    while (num1.value === num2.value) {
      num2 = createNumber(randomChoice(types));
    }
    return { left: num1, right: num2 };
  }
  

// --- ゲーム開始 ---

let enemySpeed = 2; // 初期値

function startGame(mode, type) {

    switch (selectedDifficulty) {
        case "easy": enemySpeed = 1.5; break;
        case "hard": enemySpeed = 3.5; break;
        case "normal":
        default: enemySpeed = 2.5; break;
      }
  document.getElementById("seStart").play();
  document.getElementById("menu").classList.add("fade-out");
  setTimeout(() => {
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    canvas.classList.add("fade-in");
    document.getElementById("quitButton").style.display = "block";
    modeType = mode;
    problemType = type;
    score = 0;
    timeLeft = 60;
    bullets = [];
    particles = [];
    enemy = null;
    totalAnswers = 0;
    correctAnswers = 0;
    spawnEnemy();
    gameLoop();
    if (modeType.includes("ガンガン")) {
      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          showResult();
        }
      }, 1000);
    }
  }, 500);
}

canvas.addEventListener('click', shootBullet);
canvas.addEventListener('touchstart', function (e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    shootBullet({ clientX: touch.clientX, clientY: touch.clientY });
    e.preventDefault();
  }
}, { passive: false });

function shootBullet(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const dx = mouseX - canvas.width / 2;
  const dy = mouseY - (canvas.height - 50);
  const angle = Math.atan2(dy, dx);
  bullets.push({
    x: canvas.width / 2,
    y: canvas.height - 50,
    vx: Math.cos(angle) * 6,
    vy: Math.sin(angle) * 6,
    trail: []
  });
  const se = document.getElementById("seShoot");
  if (se) {
    se.currentTime = 0;
    se.play();
  }
}

// 修正済み: enemyがnullのときはspawnEnemyを即時呼び出す
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2a2e6b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!enemy) {
    spawnEnemy();
  } 

  // --- 敵の描画と移動 ---
  if (enemy) {
    drawEnemy(enemy);
    enemy.y += enemy.speed;
    enemyLife++;
    if (enemyLife > 600 || (enemy.middleState !== "!" && enemyLife > 300)) {
      flashMessage("×", "red");
      totalAnswers++;
      if (selectedMode === "ガンガンモード") timeLeft -= 5;
      document.getElementById("seWrong").currentTime = 0;
      document.getElementById("seWrong").play();
      enemy = null;
    }
  }

  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    b.x += b.vx; b.y += b.vy;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 10) b.trail.shift();
    drawBullet(b);

    if (!enemy) continue;
    const dx = Math.abs(b.x - enemy.x);
    const dy = Math.abs(b.y - enemy.y);

    if (enemy.middleState === "!" && dx < 25 && dy < 30) {
      enemy.middleState = Math.random() < 0.5 ? "大" : "小";
      bullets.splice(i, 1); i--; continue;
    }
    if ((enemy.middleState === "大" || enemy.middleState === "小") && dy < 30) {
      const leftX = enemy.x - 80, rightX = enemy.x + 80;
      if (Math.abs(b.x - leftX) < 40) {
        checkAnswer(enemy.leftNumber.value, enemy.rightNumber.value, "left");
        bullets.splice(i, 1); i--; continue;
      }
      if (Math.abs(b.x - rightX) < 40) {
        checkAnswer(enemy.leftNumber.value, enemy.rightNumber.value, "right");
        bullets.splice(i, 1); i--; continue;
      }
    }
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1); i--;
    }
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.fillStyle = p.color || "gold";
    ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    if (p.life <= 0) { particles.splice(i, 1); i--; }
  }
  function drawPlayer() {
    const x = canvas.width / 2;
    const y = canvas.height - 50;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
    gradient.addColorStop(0, "rgba(0, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(0, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  
    // 本体
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 15, y + 15);
    ctx.lineTo(x + 15, y + 15);
    ctx.closePath();
    ctx.fill();
  
    // 光るエフェクト
    const glowAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 100);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawPlayer();
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  document.getElementById("scoreDisplay").textContent = `スコア: ${score}`;
  if (selectedMode === "ガンガンモード") ctx.fillText("のこり時間: " + timeLeft + "秒", 10, 60);

  if (message && messageTimer > 0) {
    ctx.fillStyle = message.color;
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message.text, canvas.width / 2, canvas.height / 2);
    messageTimer--;
  }
  requestAnimationFrame(gameLoop);
}

// そのほかの関数（drawBullet, drawEnemy, checkAnswerなど）は元のままでOK


  
  function drawBullet(bullet) {
    // 弾の尾にグラデーションを追加
    for (let i = 0; i < bullet.trail.length - 1; i++) {
      const p1 = bullet.trail[i];
      const p2 = bullet.trail[i + 1];
      const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      gradient.addColorStop(0, `rgba(255, 255, 0, ${i / bullet.trail.length})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, ${(i + 1) / bullet.trail.length})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // === 敵の生成と再出現 ===
  function spawnEnemy() {
    const nums = generateNumbers();
    enemy = {
      x: canvas.width / 2,
      y: 0,
      speed: enemySpeed,
      leftNumber: nums.left,
      rightNumber: nums.right,
      middleState: "!"
    };
    enemyLife = 0;
  }
  
  
  
  // === 爆発エフェクト（カラフル） ===
  function createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 40, color });
    }
  }
  
  // === 敵の描画（左右の数＋比較記号） ===
  function drawEnemy(e) {
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    const gap = 80;
    ctx.fillStyle = "#00bfff";
    drawRoundRect(ctx, e.x - gap - 25, e.y - 25, 50, 50, 10);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(e.leftNumber.text, e.x - gap, e.y + 10);
    ctx.fillStyle = "#ff8c00";
    ctx.beginPath(); ctx.arc(e.x, e.y, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(e.middleState, e.x, e.y + 10);
    ctx.fillStyle = "#00bfff";
    drawRoundRect(ctx, e.x + gap - 25, e.y - 25, 50, 50, 10);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(e.rightNumber.text, e.x + gap, e.y + 10);
  }
  
  
  

function checkAnswer(leftValue, rightValue, side) {
    if (!enemy) return;
    let correct = false;
    const l = leftValue, r = rightValue;

    totalAnswers++; // 解答回数を加算
  
    if (enemy.middleState === "大") {
      if (side === "left" && l > r) correct = true;
      if (side === "right" && r > l) correct = true;
    } else if (enemy.middleState === "小") {
      if (side === "left" && l < r) correct = true;
      if (side === "right" && r < l) correct = true;
    }
  
    // 🔊 正誤に応じて再生
    if (correct) {
      document.getElementById("seCorrect").currentTime = 0;
      document.getElementById("seCorrect").play();
      correctAnswers++; // 正解数を加算
      score += getScoreByType(l, r);
      if (modeType === "ガンガン") timeLeft += 3;
      flashMessage("〇", "lime");
    } else {
      document.getElementById("seWrong").currentTime = 0;
      document.getElementById("seWrong").play();
      if (modeType === "ガンガン") timeLeft -= 5;
      flashMessage("×", "red");
    }
  
    createExplosion(enemy.x, enemy.y);
    enemy = null;
    spawnEnemy();
  }
  

function getScoreByType(leftValue, rightValue) {
  if (Number.isInteger(leftValue) && Number.isInteger(rightValue)) return 1;
  if ((isDecimal(leftValue) && Number.isInteger(rightValue)) || (Number.isInteger(leftValue) && isDecimal(rightValue))) return 2;
  return 3;
}

function isDecimal(num) { return num % 1 !== 0; }

function flashMessage(text, color) {
  message = { text, color };
  messageTimer = 60;
}

function showResult() {
    const canvasElement = document.getElementById('gameCanvas');
    const result = document.getElementById('result');
  
    // フェードアウト
    canvasElement.classList.remove('fade-in');
    canvasElement.classList.add('fade-out');
  
    setTimeout(() => {
      canvasElement.style.display = "none";
      result.style.display = "block";
      result.classList.add("fade-in");
  
      const accuracy = totalAnswers === 0 ? 0 : Math.round((correctAnswers / totalAnswers) * 100);
  
      document.getElementById('finalScore').innerHTML = `
        スコア：${score}点<br>
        正解数：${correctAnswers} / ${totalAnswers}<br>
        正解率：${accuracy}%
      `;
  
      if (timerInterval) clearInterval(timerInterval);
    }, 500);
  }
  

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

=======

// --- Canvas初期設定 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 700;
canvas.style.width = "100%";
canvas.style.maxWidth = "400px";
canvas.style.height = "auto";

// --- 変数初期化 ---
let bullets = [], particles = [], message = null;
let score = 0, timeLeft = 60, enemyLife = 0, messageTimer = 0;
let timerInterval = null, enemy = null;
let selectedProblemType = null, selectedMode = null;
let problemConfig = {}, totalAnswers = 0, correctAnswers = 0;
let modeType = '', problemType = '';

// --- Canvasレスポンシブ対応 ---
function resizeCanvas() {
  const maxWidth = 400;
  const maxHeight = 700;
  const windowRatio = window.innerWidth / window.innerHeight;
  const canvasRatio = maxWidth / maxHeight;

  if (windowRatio > canvasRatio) {
    // ウィンドウが横に広い：高さを基準に調整
    canvas.height = Math.min(window.innerHeight, maxHeight);
    canvas.width = canvas.height * canvasRatio;
  } else {
    // ウィンドウが縦に長い：幅を基準に調整
    canvas.width = Math.min(window.innerWidth, maxWidth);
    canvas.height = canvas.width / canvasRatio;
  }

  canvas.style.width = canvas.width + "px";
  canvas.style.height = canvas.height + "px";
}

resizeCanvas(); // 初回実行
window.addEventListener('resize', resizeCanvas); // リサイズ対応

  

// --- メニュー選択 ---
document.querySelectorAll("#typeButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#typeButtons button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedProblemType = btn.dataset.type;
    updateProblemConfig();
  });
});
document.querySelectorAll("#modeButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#modeButtons button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedMode = btn.dataset.mode;
  });
});
document.getElementById("startButton").addEventListener("click", () => {
  if (!selectedProblemType || !selectedMode) return alert("出題タイプとモードを選んでください");
  startGame(selectedMode, selectedProblemType);
});

let selectedDifficulty = "normal";  // デフォルト

document.querySelectorAll("#difficultyButtons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#difficultyButtons button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedDifficulty = btn.dataset.difficulty;
  });
});

function flashMessage(text, color) {
    message = { text, color, scale: 1.5 }; // ← 拡大表示
    messageTimer = 30;
}  


function updateProblemConfig() {
  problemConfig = {
    integers: selectedProblemType !== 'decimal' && selectedProblemType !== 'fraction',
    decimals: selectedProblemType !== 'integer' && selectedProblemType !== 'fraction',
    fractions: selectedProblemType !== 'integer' && selectedProblemType !== 'decimal',
    max: selectedProblemType === 'integer' ? 99 : 10
  };
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  function createNumber(type) {
    const max = problemConfig.max || 10;
    if (type === 'integer') {
      const v = Math.floor(Math.random() * max) + 1;
      return { text: v.toString(), value: v };
    } else if (type === 'decimal') {
      const v = Math.round((Math.random() * (max - 1) + 1) * 10) / 10;
      return { text: v.toFixed(1), value: v };
    } else {
      let n = Math.floor(Math.random() * 9) + 1;
      let d = Math.floor(Math.random() * 9) + 1;
      while (n >= d) d = Math.floor(Math.random() * 9) + 1;
      return { text: `${n}/${d}`, value: n / d };
    }
  }
  
  function generateNumbers() {
    const types = [];
    if (problemConfig.integers) types.push("integer");
    if (problemConfig.decimals) types.push("decimal");
    if (problemConfig.fractions) types.push("fraction");
    const type1 = randomChoice(types);
    const type2 = randomChoice(types);
    let num1 = createNumber(type1);
    let num2 = createNumber(type2);
    while (num1.value === num2.value) {
      num2 = createNumber(randomChoice(types));
    }
    return { left: num1, right: num2 };
  }
  

// --- ゲーム開始 ---

let enemySpeed = 2; // 初期値

function startGame(mode, type) {

    switch (selectedDifficulty) {
        case "easy": enemySpeed = 1.5; break;
        case "hard": enemySpeed = 3.5; break;
        case "normal":
        default: enemySpeed = 2.5; break;
      }
  document.getElementById("seStart").play();
  document.getElementById("menu").classList.add("fade-out");
  setTimeout(() => {
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    canvas.classList.add("fade-in");
    document.getElementById("quitButton").style.display = "block";
    modeType = mode;
    problemType = type;
    score = 0;
    timeLeft = 60;
    bullets = [];
    particles = [];
    enemy = null;
    totalAnswers = 0;
    correctAnswers = 0;
    spawnEnemy();
    gameLoop();
    if (modeType.includes("ガンガン")) {
      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          showResult();
        }
      }, 1000);
    }
  }, 500);
}

canvas.addEventListener('click', shootBullet);
canvas.addEventListener('touchstart', function (e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    shootBullet({ clientX: touch.clientX, clientY: touch.clientY });
    e.preventDefault();
  }
}, { passive: false });

function shootBullet(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const dx = mouseX - canvas.width / 2;
  const dy = mouseY - (canvas.height - 50);
  const angle = Math.atan2(dy, dx);
  bullets.push({
    x: canvas.width / 2,
    y: canvas.height - 50,
    vx: Math.cos(angle) * 6,
    vy: Math.sin(angle) * 6,
    trail: []
  });
  const se = document.getElementById("seShoot");
  if (se) {
    se.currentTime = 0;
    se.play();
  }
}

// 修正済み: enemyがnullのときはspawnEnemyを即時呼び出す
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2a2e6b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!enemy) {
    spawnEnemy();
  } 

  // --- 敵の描画と移動 ---
  if (enemy) {
    drawEnemy(enemy);
    enemy.y += enemy.speed;
    enemyLife++;
    if (enemyLife > 600 || (enemy.middleState !== "!" && enemyLife > 300)) {
      flashMessage("×", "red");
      totalAnswers++;
      if (selectedMode === "ガンガンモード") timeLeft -= 5;
      document.getElementById("seWrong").currentTime = 0;
      document.getElementById("seWrong").play();
      enemy = null;
    }
  }

  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    b.x += b.vx; b.y += b.vy;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 10) b.trail.shift();
    drawBullet(b);

    if (!enemy) continue;
    const dx = Math.abs(b.x - enemy.x);
    const dy = Math.abs(b.y - enemy.y);

    if (enemy.middleState === "!" && dx < 25 && dy < 30) {
      enemy.middleState = Math.random() < 0.5 ? "大" : "小";
      bullets.splice(i, 1); i--; continue;
    }
    if ((enemy.middleState === "大" || enemy.middleState === "小") && dy < 30) {
      const leftX = enemy.x - 80, rightX = enemy.x + 80;
      if (Math.abs(b.x - leftX) < 40) {
        checkAnswer(enemy.leftNumber.value, enemy.rightNumber.value, "left");
        bullets.splice(i, 1); i--; continue;
      }
      if (Math.abs(b.x - rightX) < 40) {
        checkAnswer(enemy.leftNumber.value, enemy.rightNumber.value, "right");
        bullets.splice(i, 1); i--; continue;
      }
    }
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1); i--;
    }
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.fillStyle = p.color || "gold";
    ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    if (p.life <= 0) { particles.splice(i, 1); i--; }
  }
  function drawPlayer() {
    const x = canvas.width / 2;
    const y = canvas.height - 50;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
    gradient.addColorStop(0, "rgba(0, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(0, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  
    // 本体
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 15, y + 15);
    ctx.lineTo(x + 15, y + 15);
    ctx.closePath();
    ctx.fill();
  
    // 光るエフェクト
    const glowAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 100);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawPlayer();
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  document.getElementById("scoreDisplay").textContent = `スコア: ${score}`;
  if (selectedMode === "ガンガンモード") ctx.fillText("のこり時間: " + timeLeft + "秒", 10, 60);

  if (message && messageTimer > 0) {
    ctx.fillStyle = message.color;
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message.text, canvas.width / 2, canvas.height / 2);
    messageTimer--;
  }
  requestAnimationFrame(gameLoop);
}

// そのほかの関数（drawBullet, drawEnemy, checkAnswerなど）は元のままでOK


  
  function drawBullet(bullet) {
    // 弾の尾にグラデーションを追加
    for (let i = 0; i < bullet.trail.length - 1; i++) {
      const p1 = bullet.trail[i];
      const p2 = bullet.trail[i + 1];
      const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      gradient.addColorStop(0, `rgba(255, 255, 0, ${i / bullet.trail.length})`);
      gradient.addColorStop(1, `rgba(255, 255, 0, ${(i + 1) / bullet.trail.length})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // === 敵の生成と再出現 ===
  function spawnEnemy() {
    const nums = generateNumbers();
    enemy = {
      x: canvas.width / 2,
      y: 0,
      speed: enemySpeed,
      leftNumber: nums.left,
      rightNumber: nums.right,
      middleState: "!"
    };
    enemyLife = 0;
  }
  
  
  
  // === 爆発エフェクト（カラフル） ===
  function createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 40, color });
    }
  }
  
  // === 敵の描画（左右の数＋比較記号） ===
  function drawEnemy(e) {
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    const gap = 80;
    ctx.fillStyle = "#00bfff";
    drawRoundRect(ctx, e.x - gap - 25, e.y - 25, 50, 50, 10);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(e.leftNumber.text, e.x - gap, e.y + 10);
    ctx.fillStyle = "#ff8c00";
    ctx.beginPath(); ctx.arc(e.x, e.y, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(e.middleState, e.x, e.y + 10);
    ctx.fillStyle = "#00bfff";
    drawRoundRect(ctx, e.x + gap - 25, e.y - 25, 50, 50, 10);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(e.rightNumber.text, e.x + gap, e.y + 10);
  }
  
  
  

function checkAnswer(leftValue, rightValue, side) {
    if (!enemy) return;
    let correct = false;
    const l = leftValue, r = rightValue;

    totalAnswers++; // 解答回数を加算
  
    if (enemy.middleState === "大") {
      if (side === "left" && l > r) correct = true;
      if (side === "right" && r > l) correct = true;
    } else if (enemy.middleState === "小") {
      if (side === "left" && l < r) correct = true;
      if (side === "right" && r < l) correct = true;
    }
  
    // 🔊 正誤に応じて再生
    if (correct) {
      document.getElementById("seCorrect").currentTime = 0;
      document.getElementById("seCorrect").play();
      correctAnswers++; // 正解数を加算
      score += getScoreByType(l, r);
      if (modeType === "ガンガン") timeLeft += 3;
      flashMessage("〇", "lime");
    } else {
      document.getElementById("seWrong").currentTime = 0;
      document.getElementById("seWrong").play();
      if (modeType === "ガンガン") timeLeft -= 5;
      flashMessage("×", "red");
    }
  
    createExplosion(enemy.x, enemy.y);
    enemy = null;
    spawnEnemy();
  }
  

function getScoreByType(leftValue, rightValue) {
  if (Number.isInteger(leftValue) && Number.isInteger(rightValue)) return 1;
  if ((isDecimal(leftValue) && Number.isInteger(rightValue)) || (Number.isInteger(leftValue) && isDecimal(rightValue))) return 2;
  return 3;
}

function isDecimal(num) { return num % 1 !== 0; }

function flashMessage(text, color) {
  message = { text, color };
  messageTimer = 60;
}

function showResult() {
    const canvasElement = document.getElementById('gameCanvas');
    const result = document.getElementById('result');
  
    // フェードアウト
    canvasElement.classList.remove('fade-in');
    canvasElement.classList.add('fade-out');
  
    setTimeout(() => {
      canvasElement.style.display = "none";
      result.style.display = "block";
      result.classList.add("fade-in");
  
      const accuracy = totalAnswers === 0 ? 0 : Math.round((correctAnswers / totalAnswers) * 100);
  
      document.getElementById('finalScore').innerHTML = `
        スコア：${score}点<br>
        正解数：${correctAnswers} / ${totalAnswers}<br>
        正解率：${accuracy}%
      `;
  
      if (timerInterval) clearInterval(timerInterval);
    }, 500);
  }
  

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

>>>>>>> 7be47cd
