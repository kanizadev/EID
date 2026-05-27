const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

const WORLD = {
  width: canvas.width,
  height: canvas.height,
  groundY: canvas.height - 32
};

const COW = {
  x: 80,
  y: WORLD.groundY - 44,
  width: 68,
  height: 44,
  vy: 0,
  gravity: 0.65,
  jumpPower: -12.5
};

let clouds = [];
let hills = [];
let stars = [];
let dust = [];
let sparkles = [];
let obstacles = [];
let coins = [];
let gameOver = false;
let score = 0;
let coinsCollected = 0;
let speed = 5.6;
let spawnTimer = 0;
let spawnInterval = 80;
let coinSpawnTimer = 0;
let coinSpawnInterval = 140;
let frameCount = 0;
let shakeX = 0;
let shakeY = 0;
let dist = 0;
let combo = 0;
let maxCombo = 0;
let highScore = parseInt(localStorage.getItem("cowRunHighScore")) || 0;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnCloud() {
  const w = randomRange(40, 70);
  const h = randomRange(14, 22);
  clouds.push({
    x: WORLD.width + 10,
    y: randomRange(8, WORLD.groundY - 60),
    width: w,
    height: h
  });
}

function spawnHill() {
  hills.push({
    x: WORLD.width + 10,
    width: randomRange(80, 160),
    height: randomRange(20, 50),
    y: WORLD.groundY
  });
}

function spawnSparkle(x, y) {
  for (let i = 0; i < 6; i++) {
    sparkles.push({
      x, y,
      vx: randomRange(-3, 3),
      vy: randomRange(-4, 1),
      life: 1,
      size: randomRange(2, 5)
    });
  }
}

function resetGame() {
  clouds = [];
  hills = [];
  stars = [];
  for (let i = 0; i < 20; i++) spawnStar();
  dust = [];
  sparkles = [];
  obstacles = [];
  coins = [];
  gameOver = false;
  score = 0;
  coinsCollected = 0;
  speed = 5.6;
  spawnTimer = 0;
  spawnInterval = 80;
  coinSpawnTimer = 0;
  coinSpawnInterval = 140;
  frameCount = 0;
  dist = 0;
  combo = 0;
  maxCombo = 0;
  shakeX = 0;
  shakeY = 0;
  COW.y = WORLD.groundY - COW.height;
  COW.vy = 0;
  updateHUD();
}

function spawnObstacle() {
  const width = randomRange(28, 42);
  const height = randomRange(20, 30);
  obstacles.push({
    x: WORLD.width + 2,
    y: WORLD.groundY - height,
    width,
    height
  });
}

function spawnCoin() {
  const size = 14;
  const minY = WORLD.groundY - COW.height - 54;
  const maxY = WORLD.groundY - size - 8;
  coins.push({
    x: WORLD.width + 2,
    y: randomRange(minY, maxY),
    width: size,
    height: size
  });
}

function updateHUD() {
  const spd = Math.floor(speed * 10) / 10;
  scoreEl.textContent = `Score:${Math.floor(score)} Coins:${coinsCollected} SPD:${spd}`;
}

const C = { dark: "#2F5249", mid: "#437057", light: "#97B067", accent: "#E3DE61" };

function getSkyColor() {
  const t = Math.min(1, (speed - 5.6) / 6.4);
  const top = lerpColor(C.light, C.dark, t);
  const mid = lerpColor(C.mid, C.dark, t);
  const bot = lerpColor(C.light, C.mid, t);
  return { top, mid, bot };
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1,3), 16), ag = parseInt(a.slice(3,5), 16), ab = parseInt(a.slice(5,7), 16);
  const br = parseInt(b.slice(1,3), 16), bg = parseInt(b.slice(3,5), 16), bb = parseInt(b.slice(5,7), 16);
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

function spawnStar() {
  stars.push({
    x: randomRange(0, WORLD.width),
    y: randomRange(2, WORLD.groundY * 0.5),
    size: randomRange(1, 3),
    twinkle: Math.random() * Math.PI * 2,
    speed: randomRange(0.02, 0.08)
  });
}

function drawBackground() {
  const c = getSkyColor();
  const grad = ctx.createLinearGradient(0, 0, 0, WORLD.groundY);
  grad.addColorStop(0, c.top);
  grad.addColorStop(0.6, c.mid);
  grad.addColorStop(1, c.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD.width, WORLD.groundY);

  for (const s of stars) {
    const glow = Math.sin(frameCount * s.speed + s.twinkle);
    const alpha = 0.3 + glow * 0.4;
    const sSize = s.size + glow * 0.5;
    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.fillStyle = C.accent;
    ctx.fillRect(s.x, s.y, sSize, sSize);
    if (glow > 0.6) {
      ctx.fillRect(s.x - 1, s.y + sSize / 2 - 0.5, sSize + 2, 1);
      ctx.fillRect(s.x + sSize / 2 - 0.5, s.y - 1, 1, sSize + 2);
    }
  }
  ctx.globalAlpha = 1;
}

function drawHills() {
  const t = Math.min(1, (speed - 5.6) / 6.4);
  ctx.fillStyle = lerpColor(C.mid, C.dark, t);
  for (const h of hills) {
    const hw = h.width / 2;
    ctx.beginPath();
    ctx.arc(h.x + hw, h.y, hw, Math.PI, 0, true);
    ctx.fill();
  }
  ctx.fillStyle = lerpColor(C.light, C.mid, t);
  for (const h of hills) {
    const hw = h.width / 2;
    ctx.beginPath();
    ctx.arc(h.x + hw + 4, h.y, hw - 8, Math.PI, 0, true);
    ctx.fill();
  }
}

function drawClouds() {
  ctx.fillStyle = C.light;
  ctx.globalAlpha = Math.max(0.3, 1 - (speed - 5.6) / 10);
  for (const c of clouds) {
    ctx.fillRect(c.x, c.y + 4, c.width, c.height - 8);
    ctx.fillRect(c.x + 4, c.y, c.width - 8, c.height);
    ctx.fillRect(c.x + 8, c.y + 2, c.width - 16, c.height - 4);
    ctx.fillStyle = C.dark;
    ctx.fillRect(c.x + 12, c.y + 4, 6, 4);
    ctx.fillRect(c.x + c.width - 20, c.y + 6, 5, 3);
    ctx.fillStyle = C.light;
  }
  ctx.globalAlpha = 1;
}

function drawDust() {
  for (const p of dust) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = C.mid;
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  ctx.globalAlpha = 1;
}

function drawSparkles() {
  for (const s of sparkles) {
    ctx.globalAlpha = s.life;
    ctx.fillStyle = C.accent;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

function drawGround() {
  const t = Math.min(1, (speed - 5.6) / 6.4);
  const dirt = lerpColor(C.dark, "#3a5c20", t);
  ctx.fillStyle = dirt;
  ctx.fillRect(0, WORLD.groundY, WORLD.width, WORLD.height - WORLD.groundY);
  ctx.fillStyle = lerpColor(C.mid, C.dark, t);
  ctx.fillRect(0, WORLD.groundY - 4, WORLD.width, 4);
  ctx.fillStyle = lerpColor(C.mid, C.dark, t);
  ctx.fillRect(0, WORLD.groundY - 1, WORLD.width, 1);

  for (let i = 0; i < 10; i++) {
    const gx = ((i * 90 - frameCount * speed * 0.8) % 920) - 10;
    ctx.fillStyle = lerpColor(C.dark, "#3a5c20", t);
    ctx.globalAlpha = 0.3 + t * 0.3;
    ctx.fillRect(gx, WORLD.groundY + 6, 20, 2);
  }
  ctx.globalAlpha = 1;
}

function drawCow() {
    const x = COW.x;
    const y = COW.y;
    const step = Math.floor(frameCount / 6) % 4;
    const onGround = COW.y >= WORLD.groundY - COW.height - 0.1;
    const vy = COW.vy;
    const goingUp = vy < 0;
    const velT = Math.min(1, Math.abs(vy) / 14);
    const bob = onGround ? 0 : -3 - velT * 4;
    const tilt = onGround ? 0 : (goingUp ? -1 : 1);
  
    ctx.fillStyle = C.dark;
    ctx.globalAlpha = 0.3;
    const shadowW = onGround ? 48 : 28 + velT * 10;
    ctx.fillRect(x + 10, WORLD.groundY - 3, shadowW, 4);
    ctx.globalAlpha = 1;

    ctx.fillStyle = C.dark;

    ctx.fillRect(x + 8, y + 14 + bob + tilt, 40, 20);
    ctx.fillRect(x + 40, y + 10 + bob - tilt, 18, 16);
    ctx.fillRect(x + 54, y + 16 + bob - tilt, 8, 8);

    ctx.fillRect(x + 42, y + 6 + bob - tilt, 4, 4);
    ctx.fillRect(x + 52, y + 6 + bob - tilt, 4, 4);

    ctx.fillRect(x + 40, y + 10 + bob - tilt, 3, 3);
    ctx.fillRect(x + 55, y + 10 + bob - tilt, 3, 3);

    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 47, y + 15 + bob - tilt, 2, 2);
    ctx.fillRect(x + 52, y + 15 + bob - tilt, 2, 2);

    ctx.fillRect(x + 14, y + 18 + bob + tilt, 8, 6);
    ctx.fillRect(x + 28, y + 22 + bob + tilt, 6, 5);
    ctx.fillRect(x + 38, y + 17 + bob + tilt, 5, 5);

    const legOffsets = [
      [0, 2, 0, 2],
      [2, 0, 2, 0],
      [0, 1, 0, 1],
      [2, 0, 2, 0]
    ];
    const lo = onGround ? legOffsets[step] : (goingUp ? [2, 5, 2, 5] : [5, 2, 5, 2]);
    ctx.fillStyle = C.dark;
    ctx.fillRect(x + 12, y + 34 + lo[0], 5, 14);
    ctx.fillRect(x + 22, y + 34 + lo[1], 5, 14);
    ctx.fillRect(x + 36, y + 34 + lo[2], 5, 14);
    ctx.fillRect(x + 46, y + 34 + lo[3], 5, 14);

    const tailWag = onGround ? Math.sin(frameCount * 0.15) * 2 : (goingUp ? -3 : 3);
    ctx.fillRect(x + 4, y + 16 + bob, 3, 12);
    ctx.fillRect(x + 1 + Math.round(tailWag), y + 14 + bob, 4, 4);

    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 57, y + 20 + bob - tilt, 2, 1);
  }

function drawObstacle(ob) {
  const x = ob.x;
  const y = ob.y;
  const w = ob.width;
  const h = ob.height;

  ctx.fillStyle = C.dark;

  ctx.fillRect(x + 2, y + 2, w - 4, h - 2);

  ctx.fillStyle = C.accent;
  ctx.fillRect(x + 4, y + 4, 4, 3);
  ctx.fillRect(x + 10, y + 6, 5, 4);
  ctx.fillRect(x + w - 10, y + 4, 5, 3);

  ctx.fillStyle = C.dark;
  ctx.fillRect(x + 6, y + 6, 3, 2);
  ctx.fillRect(x + w - 8, y + 7, 3, 2);
}
  
function drawObstacles() {
  for (const ob of obstacles) {
    drawObstacle(ob);
  }
}

function drawCoin(coin) {
  const pulse = Math.sin(frameCount * 0.08 + coin.x) * 1;
  ctx.fillStyle = C.accent;
  ctx.fillRect(coin.x - pulse, coin.y, coin.width + pulse * 2, coin.height);
  ctx.fillStyle = C.light;
  ctx.fillRect(coin.x + 3 - pulse, coin.y + 3, coin.width - 6 + pulse * 2, coin.height - 6);
}

function drawCoins() {
  for (const coin of coins) {
    if (!coin.collected) drawCoin(coin);
  }
}

function getCollisionBox() {
  return {
    x: COW.x + 2,
    y: COW.y + 2,
    width: COW.width - 10,
    height: COW.height - 2
  };
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updateCow() {
  const wasInAir = COW.y < WORLD.groundY - COW.height - 0.1;
  COW.vy += COW.gravity;
  COW.y += COW.vy;

  const floor = WORLD.groundY - COW.height;
  if (COW.y >= floor) {
    COW.y = floor;
    if (wasInAir) {
      for (let i = 0; i < 4; i++) {
        dust.push({ x: COW.x + i * 10, y: WORLD.groundY - 6, life: 1 });
      }
    }
    COW.vy = 0;
  }

  if (COW.vy === 0 && Math.random() < 0.15) {
    dust.push({ x: COW.x - 2, y: WORLD.groundY - 4, life: 0.8 });
  }
}

function updateClouds() {
  for (const c of clouds) {
    c.x -= speed * 0.25;
  }
  clouds = clouds.filter((c) => c.x + c.width > -20);
}

function updateHills() {
  for (const h of hills) {
    h.x -= speed * 0.15;
  }
  hills = hills.filter((h) => h.x + h.width > -20);
}

function updateDust() {
  for (const p of dust) {
    p.x -= speed;
    p.y -= 1;
    p.life -= 0.02;
  }
  dust = dust.filter((p) => p.life > 0);
}

function updateSparkles() {
  for (const s of sparkles) {
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.03;
  }
  sparkles = sparkles.filter((s) => s.life > 0);
}

function updateObstacles() {
  const cowBox = getCollisionBox();

  for (const ob of obstacles) {
    ob.x -= speed;
    if (intersects(cowBox, ob)) {
      gameOver = true;
      shakeX = 6;
      shakeY = 4;
      if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem("cowRunHighScore", highScore);
      }
    }
  }

  obstacles = obstacles.filter((ob) => ob.x + ob.width > -10);
}

function updateCoins() {
  const cowBox = getCollisionBox();

  for (const coin of coins) {
    coin.x -= speed;

    if (!coin.collected && intersects(cowBox, coin)) {
      coin.collected = true;
      coinsCollected += 1;
      combo += 1;
      if (combo > maxCombo) maxCombo = combo;
      spawnSparkle(coin.x, coin.y);
    }
  }

  coins = coins.filter((coin) => !coin.collected && coin.x + coin.width > -10);
}

function updateScoreAndSpeed() {
  frameCount += 1;
  score += 0.12;
  dist += speed * 0.05;
  speed = Math.min(12, speed + 0.0009);
  if (COW.vy !== 0 || COW.y < WORLD.groundY - COW.height) combo = 0;
  updateHUD();
}

function updateSpawning() {
  spawnTimer += 1;
  coinSpawnTimer += 1;

  if (stars.length < 30 && Math.random() < 0.1) {
    spawnStar();
  }

  cloudSpawnTimer += 1;
  if (cloudSpawnTimer >= 180) {
    spawnCloud();
    cloudSpawnTimer = 0;
  }

  hillSpawnTimer += 1;
  if (hillSpawnTimer >= 300) {
    spawnHill();
    hillSpawnTimer = 0;
  }

  if (spawnTimer >= spawnInterval) {
    spawnObstacle();
    spawnTimer = 0;
    spawnInterval = randomRange(52, 92) - speed * 1.4;
    if (spawnInterval < 38) spawnInterval = 38;
  }

  if (coinSpawnTimer >= coinSpawnInterval) {
    spawnCoin();
    coinSpawnTimer = 0;
    coinSpawnInterval = randomRange(120, 200);
  }
}

function updateShake() {
  if (shakeX !== 0 || shakeY !== 0) {
    ctx.save();
    ctx.translate(
      Math.round((Math.random() - 0.5) * shakeX * 2),
      Math.round((Math.random() - 0.5) * shakeY * 2)
    );
    shakeX *= 0.85;
    shakeY *= 0.85;
    if (Math.abs(shakeX) < 0.5) shakeX = 0;
    if (Math.abs(shakeY) < 0.5) shakeY = 0;
    return true;
  }
  return false;
}

let cloudSpawnTimer = 0;
let hillSpawnTimer = 0;

function drawEidBorder() {
  const w = WORLD.width, h = WORLD.height;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.strokeRect(10, 10, w - 20, h - 20);
  for (let i = 0; i < 16; i++) {
    const bx = 10 + ((w - 20) / 16) * i;
    ctx.fillStyle = i % 2 === 0 ? C.accent : C.dark;
    ctx.fillRect(bx, 6, (w - 20) / 16, 4);
    ctx.fillRect(bx, h - 10, (w - 20) / 16, 4);
  }
}

function drawCrescent(cx, cy, r) {
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.accent;
  ctx.fillRect(cx + r * 0.6, cy - r * 0.15, 3, 3);
  ctx.fillRect(cx + r * 0.75, cy + r * 0.1, 2, 2);
  ctx.fillRect(cx + r * 0.5, cy + r * 0.3, 2, 2);
}

function drawLamp(x, y, s) {
  ctx.fillStyle = C.accent;
  ctx.fillRect(x - s, y, s * 2, s * 0.5);
  ctx.fillRect(x - s * 0.5, y - s, s, s);
  ctx.fillRect(x - s * 0.8, y - s * 1.5, s * 1.6, s * 0.6);
  ctx.fillStyle = C.light;
  ctx.fillRect(x - s * 0.3, y - s * 0.8, s * 0.6, s * 0.6);
}

function drawSpeedBar() {
  const barX = WORLD.width - 140, barY = 8, barW = 130, barH = 8;
  ctx.fillStyle = C.dark;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.globalAlpha = 1;
  const pct = (speed - 5.6) / 6.4;
  ctx.fillStyle = C.accent;
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2);
  ctx.strokeStyle = C.accent;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.globalAlpha = 1;
}

function drawGameOver() {
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  drawBackground();
  drawHills();
  drawClouds();
  drawDust();
  drawSparkles();
  drawGround();
  drawCow();
  drawObstacles();
  drawCoins();

  ctx.fillStyle = C.dark;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.globalAlpha = 1;

  drawEidBorder();

  drawCrescent(WORLD.width / 2 - 120, 68, 18);
  drawCrescent(WORLD.width / 2 + 120, 68, 18);

  drawLamp(60, 60, 8);
  drawLamp(WORLD.width - 60, 60, 8);

  ctx.textAlign = "center";
  ctx.fillStyle = C.accent;
  ctx.font = "18px 'Press Start 2P'";
  ctx.fillText("Eid al-Adha", WORLD.width / 2, 60);
  ctx.fillStyle = C.light;
  ctx.font = "14px 'Press Start 2P'";
  ctx.fillText("MUBARAK", WORLD.width / 2, 82);

  ctx.fillStyle = C.light;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(WORLD.width / 2 - 130, 100, 260, 130);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(WORLD.width / 2 - 130, 100, 260, 130);

  ctx.fillStyle = C.accent;
  ctx.font = "9px 'Press Start 2P'";
  ctx.fillText(`Score: ${Math.floor(score)}`, WORLD.width / 2, 124);
  ctx.fillText(`Coins: ${coinsCollected}`, WORLD.width / 2, 142);
  ctx.fillText(`Distance: ${Math.floor(dist)}m`, WORLD.width / 2, 160);

  if (Math.floor(score) >= highScore && score > 0) {
    ctx.fillStyle = C.accent;
    ctx.fillText("NEW HIGH SCORE!", WORLD.width / 2, 184);
  } else {
    ctx.fillStyle = C.light;
    ctx.fillText(`Best: ${highScore}`, WORLD.width / 2, 184);
  }

  if (maxCombo > 1) {
    ctx.fillStyle = C.accent;
    ctx.fillText(`Combo: ${maxCombo}`, WORLD.width / 2, 204);
  }

  ctx.fillStyle = C.light;
  ctx.font = "8px 'Press Start 2P'";
  ctx.fillText("Press ENTER to replay", WORLD.width / 2, 250);

  ctx.fillStyle = C.light;
  ctx.font = "7px 'Press Start 2P'";
  ctx.fillText("by kanozadev", WORLD.width / 2, 270);
}

function draw() {
  const shaken = updateShake();
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  drawBackground();
  drawHills();
  drawClouds();
  drawDust();
  drawSparkles();
  drawGround();
  drawCow();
  drawObstacles();
  drawCoins();
  drawSpeedBar();
  if (shaken) ctx.restore();
}

function loop() {
  if (!gameOver) {
    updateClouds();
    updateHills();
    updateDust();
    updateSparkles();
    updateCow();
    updateObstacles();
    updateCoins();
    updateSpawning();
    updateScoreAndSpeed();
    draw();
  } else {
    drawGameOver();
  }

  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    const onGround = COW.y >= WORLD.groundY - COW.height - 0.1;
    if (!gameOver && onGround) {
      COW.vy = COW.jumpPower;
    }
  }

  if (event.code === "Enter" && gameOver) {
    resetGame();
  }
});

resetGame();
loop();