// == script.js (обновлённый для прыжка в 1.25× и динамики каждые 1500 очков) ==

// Получаем элементы канваса и контекст
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Размеры канваса будут подстраиваться под контейнер
let width, height;
function setCanvasSize() {
  const container = document.getElementById("gameContainer");
  if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    const navbarHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--tg-nav-bar-height")
      ) || 0;
    container.style.width = "100vw";
    container.style.height = `calc(100vh - ${navbarHeight}px)`;
    container.style.marginTop = `${navbarHeight}px`;
    width = container.clientWidth;
    height = container.clientHeight;
  } else {
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.marginTop = "0";
    width = container.clientWidth;
    height = container.clientHeight;
  }
  canvas.width = width;
  canvas.height = height;
}
setCanvasSize();
window.addEventListener("resize", setCanvasSize);

if (typeof Telegram !== "undefined" && Telegram.WebApp) {
  Telegram.WebApp.ready();
}

// ===== Переменные игры =====
let platforms = [];
const spriteImage = document.getElementById("sprite");
let player, base, spring, platformBrokenSub;

const PLATFORM_COUNT = 10;
let position = 0,
    gravity = 0.2,
    animloop,
    isFalling = 0,
    broken = 0,
    dir = "left",
    score = 0,
    jumpCount = 0;

// ===== Динамические параметры прыжка =====
// Убираем «×2» и ставим «×1.25» от оригинальных значений
let level = 0;              // текущий уровень «усилений»
let nextThreshold = 1500;   // следующий рубеж для повышения уровня
let baseJumpVelocity = -2 * 0.7;   // оригинальный jump = -8, умножаем на 1.25 = -10
let baseSpringVelocity = -6 * 0.7; // оригинальный spring = -16, умножаем на 1.25 = -20

// ===== Класс Base (пол) =====
class Base {
  constructor() {
    this.height = 5;
    this.width = width;
    this.cx = 0;   this.cy = 614;
    this.cw = 100; this.ch = 5;
    this.x = 0;    this.y = height - this.height;
  }
  draw() {
    try {
      ctx.drawImage(
        spriteImage,
        this.cx, this.cy, this.cw, this.ch,
        this.x, this.y, this.width, this.height
      );
    } catch (e) {}
  }
}

// ===== Класс Player =====
class Player {
  constructor() {
    this.vy = 11;
    this.vx = 0;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isDead = false;

    this.width = 60;
    this.height = 60;
    this.x = width / 2 - this.width / 2;
    this.y = height;
    this.img = document.getElementById("playerImg");
  }

  draw() {
    try {
      ctx.drawImage(
        this.img,
        0, 0,
        this.img.width, this.img.height,
        this.x, this.y,
        this.width, this.height
      );
    } catch (e) {}
  }

  // Прыжок от пола
  jump() {
    this.vy = baseJumpVelocity;
  }
  // Прыжок с пружины
  jumpHigh() {
    this.vy = baseSpringVelocity;
  }
}

// ===== Класс Platform =====
class Platform {
  constructor() {
    this.width = 100;
    this.height = 17;
    this.x = Math.random() * (width - this.width);
    this.y = position;
    position += height / PLATFORM_COUNT;
    this.flag = 0;
    this.state = 0;
    this.cx = 0;   this.cy = 0;
    this.cw = 105; this.ch = 31;
    if (score >= 5000) this.types = [2,3,3,3,4,4,4,4];
    else if (score >= 2000) this.types = [2,2,2,3,3,3,3,4,4,4,4];
    else if (score >= 1000) this.types = [2,2,2,3,3,3,3,3];
    else if (score >= 500) this.types = [1,1,1,1,1,2,2,2,2,3,3,3,3];
    else if (score >= 100) this.types = [1,1,1,1,2,2];
    else this.types = [1];
    this.type = this.types[Math.floor(Math.random() * this.types.length)];
    if (this.type === 3 && broken < 1) broken++;
    else if (this.type === 3 && broken >= 1) {
      this.type = 1;
      broken = 0;
    }
    this.vx = 1;
  }
  draw() {
    try {
      if (this.type === 1) this.cy = 0;
      else if (this.type === 2) this.cy = 61;
      else if (this.type === 3 && this.flag === 0) this.cy = 31;
      else if (this.type === 3 && this.flag === 1) this.cy = 1000;
      else if (this.type === 4 && this.state === 0) this.cy = 90;
      else if (this.type === 4 && this.state === 1) this.cy = 1000;
      ctx.drawImage(
        spriteImage,
        this.cx, this.cy, this.cw, this.ch,
        this.x, this.y, this.width, this.height
      );
    } catch (e) {}
  }
}

// ===== Класс PlatformBrokenSub =====
class PlatformBrokenSub {
  constructor() {
    this.height = 30;
    this.width = 100;
    this.x = 0; this.y = 0;
    this.cx = 0;   this.cy = 554;
    this.cw = 105; this.ch = 60;
    this.appearance = false;
  }
  draw() {
    try {
      if (this.appearance) {
        ctx.drawImage(
          spriteImage,
          this.cx, this.cy, this.cw, this.ch,
          this.x, this.y, this.width, this.height
        );
      }
    } catch (e) {}
  }
}

// ===== Класс SpringClass =====
class SpringClass {
  constructor() {
    this.x = 0; this.y = 0;
    this.width = 26; this.height = 30;
    this.cx = 0;   this.cy = 0;
    this.cw = 45; this.ch = 53;
    this.state = 0;
  }
  draw() {
    try {
      if (this.state === 0) this.cy = 445;
      else if (this.state === 1) this.cy = 501;
      ctx.drawImage(
        spriteImage,
        this.cx, this.cy, this.cw, this.ch,
        this.x, this.y, this.width, this.height
      );
    } catch (e) {}
  }
}

// ====================== ФУНКЦИИ ======================

// Очистка экрана
function paintCanvas() {
  ctx.clearRect(0, 0, width, height);
}

// Функция подсчёта и отрисовки игрока
function playerCalc() {
  if (dir === "left") {
    player.dir = "left";
    if (player.vy < -7 && player.vy > -15) player.dir = "left_land";
  } else if (dir === "right") {
    player.dir = "right";
    if (player.vy < -7 && player.vy > -15) player.dir = "right_land";
  }

  // Горизонтальная физика
  if (player.isMovingLeft) {
    player.x += player.vx;
    player.vx -= 0.15;
  } else {
    player.x += player.vx;
    if (player.vx < 0) player.vx += 0.1;
  }
  if (player.isMovingRight) {
    player.x += player.vx;
    player.vx += 0.15;
  } else {
    player.x += player.vx;
    if (player.vx > 0) player.vx -= 0.1;
  }
  if (player.vx > 8) player.vx = 8;
  else if (player.vx < -8) player.vx = -8;

  // Прыжок от базы
  if ((player.y + player.height) > base.y && base.y < height) {
    player.jump();
  }

  // Условие Game Over по падению
  if (
    base.y > height &&
    (player.y + player.height) > height &&
    player.isDead !== "lol"
  ) {
    player.isDead = true;
  }

  // Сквозь стены (растягиваемся по горизонтали)
  if (player.x > width) player.x = -player.width;
  else if (player.x < -player.width) player.x = width;

  // «Экран вверх» и вертикальная физика
  if (player.y >= height / 2 - player.height / 2) {
    player.y += player.vy;
    player.vy += gravity;
  } else {
    // Если игрок поднялся выше середины, двигаем всё вниз
    platforms.forEach((p, i) => {
      if (player.vy < 0) p.y -= player.vy;
      if (p.y > height) {
        platforms[i] = new Platform();
        platforms[i].y = p.y - height;
      }
    });
    base.y -= player.vy;
    player.vy += gravity;
    if (player.vy >= 0) {
      player.y += player.vy;
      player.vy += gravity;
    }
    // Увеличиваем счёт за «подъём»
    score++;

    // Каждые 1500 очков повышаем уровень
    if (score >= nextThreshold) {
      level++;
      nextThreshold += 1500;

      // Слегка увеличиваем силу прыжка и прыжка с пружиной (+5%)
      baseJumpVelocity *= 1.05;
      baseSpringVelocity *= 1.05;
      // Немного уменьшаем гравитацию (-2%)
      gravity *= 0.98;
    }
  }

  collides();
  if (player.isDead) gameOver();
}

// Позиционирование и отрисовка пружины
function springCalc() {
  let s = spring;
  let p = platforms[0];
  if (p.type === 1 || p.type === 2) {
    s.x = p.x + p.width / 2 - s.width / 2;
    s.y = p.y - p.height - 10;
    if (s.y > height / 1.1) s.state = 0;
    s.draw();
  } else {
    s.x = -s.width;
    s.y = -s.height;
  }
}

// Позиционирование и отрисовка платформ
function platformCalc() {
  let subs = platformBrokenSub;
  platforms.forEach((p, i) => {
    if (p.type === 2) {
      if (p.x < 0 || p.x + p.width > width) p.vx *= -1;
      p.x += p.vx;
    }
    if (p.flag === 1 && !subs.appearance && jumpCount === 0) {
      subs.x = p.x;
      subs.y = p.y;
      subs.appearance = true;
      jumpCount++;
    }
    p.draw();
  });
  if (subs.appearance) {
    subs.draw();
    subs.y += 8;
  }
  if (subs.y > height) subs.appearance = false;
}

// Проверка столкновений с платформами и пружиной
function collides() {
  platforms.forEach((p, i) => {
    if (
      player.vy > 0 &&
      p.state === 0 &&
      player.x + 15 < p.x + p.width &&
      player.x + player.width - 15 > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height
    ) {
      if (p.type === 3 && p.flag === 0) {
        p.flag = 1;
        jumpCount = 0;
        return;
      } else if (p.type === 4 && p.state === 0) {
        player.jump();
        p.state = 1;
      } else if (p.flag === 1) {
        return;
      } else {
        player.jump();
      }
    }
  });

  let s = spring;
  if (
    player.vy > 0 &&
    s.state === 0 &&
    player.x + 15 < s.x + s.width &&
    player.x + player.width - 15 > s.x &&
    player.y + player.height > s.y &&
    player.y + player.height < s.y + s.height
  ) {
    s.state = 1;
    player.jumpHigh();
  }
}

// Обновление текста счёта в HUD
function updateScore() {
  document.getElementById("score").innerText = score;
}

// Отправка и получение лидеров (оставляем как есть, замените URL на свой)
async function submitScoreToServer(userId, scoreValue) {
  try {
    const response = await fetch("https://ваш_сервер/api/submit_score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, score: scoreValue })
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error submitting score:", err);
    return null;
  }
}
async function fetchTop10() {
  try {
    const response = await fetch("https://ваш_сервер/api/top10");
    const data = await response.json();
    return data.top10;
  } catch (err) {
    console.error("Error fetching top10:", err);
    return [];
  }
}
async function showLeaderboard(userId, finalScore) {
  const lbDiv = document.getElementById("leaderboard");
  const lbBody = document.getElementById("lb_body");

  const submitResult = await submitScoreToServer(userId, finalScore);
  if (!submitResult) {
    console.warn("Не удалось отправить счёт, получаем только топ-10.");
  }

  const topList = await fetchTop10();
  lbBody.innerHTML = "";

  topList.forEach((item, idx) => {
    const row = document.createElement("tr");
    const cellRank = document.createElement("td");
    const cellName = document.createElement("td");
    const cellScore = document.createElement("td");

    cellRank.innerText = idx + 1;
    cellName.innerText = item.username;
    cellScore.innerText = item.best_score;

    row.appendChild(cellRank);
    row.appendChild(cellName);
    row.appendChild(cellScore);
    lbBody.appendChild(row);
  });

  lbDiv.style.display = "block";
}

// Логика Game Over (плавно опускаем игрока, показываем меню, таблицу лидеров)
async function gameOver() {
  platforms.forEach((p) => (p.y -= 12));
  if (player.y > height / 2 && isFalling === 0) {
    player.y -= 8;
    player.vy = 0;
  } else if (player.y < height / 2) {
    isFalling = 1;
  } else if (player.y + player.height > height) {
    document.getElementById("go_score").textContent = `You scored ${score} points`;
    showGameOverMenu();
    hideScore();

    let userId = null;
    if (typeof Telegram !== "undefined" && Telegram.WebApp) {
      const initData = Telegram.WebApp.initDataUnsafe || {};
      userId = initData.user ? initData.user.id : null;
    }
    userId = userId || 0;
    await showLeaderboard(userId, score);
    player.isDead = "lol";
  }
}

// Главная функция обновления (в каждом кадре)
function update() {
  paintCanvas();
  platformCalc();
  springCalc();
  playerCalc();
  player.draw();
  base.draw();
  updateScore();
}

// Инициализация игры
function init() {
  jumpCount = 0;
  position = height / 3;
  score = 0;
  isFalling = 0;
  broken = 0;
  level = 0;
  nextThreshold = 1500;

  // Сбрасываем начальные значения для прыжка и пружинного прыжка ×1.25
  baseJumpVelocity = -8 * 1.25;   // = −10
  baseSpringVelocity = -16 * 1.25; // = −20
  gravity = 0.2;                  // возвращаем стандартную гравитацию

  base = new Base();
  player = new Player();
  spring = new SpringClass();
  platformBrokenSub = new PlatformBrokenSub();
  platforms = [];
  for (let i = 0; i < PLATFORM_COUNT; i++) {
    platforms.push(new Platform());
  }

  hideGameOverMenu();
  document.getElementById("leaderboard").style.display = "none";

  paintCanvas();
  animloop = function() {
    update();
    requestAnimationFrame(animloop);
  };
  animloop();

  hideMainMenu();
  showScore();
}

// Перезапуск (Reset) — аналог init(), но без запуска анимации (чтобы успели скрыться меню и т. д.)
function reset() {
  hideGameOverMenu();
  document.getElementById("leaderboard").style.display = "none";
  showScore();

  player.isDead = false;
  isFalling = 0;
  broken = 0;
  position = height / 3;
  score = 0;
  jumpCount = 0;
  level = 0;
  nextThreshold = 1500;
  baseJumpVelocity = -8 * 1.25;   // = −10
  baseSpringVelocity = -16 * 1.25; // = −20
  gravity = 0.2;

  base = new Base();
  player = new Player();
  spring = new SpringClass();
  platformBrokenSub = new PlatformBrokenSub();
  platforms = [];
  for (let i = 0; i < PLATFORM_COUNT; i++) {
    platforms.push(new Platform());
  }
}

// Показ/скрытие меню и счётчика
function showMainMenu() {
  document.getElementById("mainMenu").style.display = "flex";
  document.getElementById("gameOverMenu").style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  hideScore();
}
function hideMainMenu() {
  document.getElementById("mainMenu").style.display = "none";
}
function showGameOverMenu() {
  document.getElementById("gameOverMenu").style.display = "flex";
}
function hideGameOverMenu() {
  document.getElementById("gameOverMenu").style.display = "none";
}
function showScore() {
  document.getElementById("scoreBoard").style.display = "flex";
}
function hideScore() {
  document.getElementById("scoreBoard").style.display = "none";
}

// Обработчики кнопок Play/Restart
document.getElementById("btnPlay").addEventListener("click", init);
document.getElementById("btnRestart").addEventListener("click", reset);

// Обработчики зон касания/мыши
const leftZone = document.getElementById("leftZone");
const rightZone = document.getElementById("rightZone");

leftZone.addEventListener("mousedown", () => {
  dir = "left";
  player.isMovingLeft = true;
});
leftZone.addEventListener("mouseup", () => {
  player.isMovingLeft = false;
});
leftZone.addEventListener("mouseleave", () => {
  player.isMovingLeft = false;
});
leftZone.addEventListener("touchstart", (e) => {
  e.preventDefault();
  dir = "left";
  player.isMovingLeft = true;
});
leftZone.addEventListener("touchend", (e) => {
  e.preventDefault();
  player.isMovingLeft = false;
});

rightZone.addEventListener("mousedown", () => {
  dir = "right";
  player.isMovingRight = true;
});
rightZone.addEventListener("mouseup", () => {
  player.isMovingRight = false;
});
rightZone.addEventListener("mouseleave", () => {
  player.isMovingRight = false;
});
rightZone.addEventListener("touchstart", (e) => {
  e.preventDefault();
  dir = "right";
  player.isMovingRight = true;
});
rightZone.addEventListener("touchend", (e) => {
  e.preventDefault();
  player.isMovingRight = false;
});
