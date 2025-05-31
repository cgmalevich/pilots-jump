// ==================== ПЕРЕМЕННЫЕ CANVAS ====================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width, height;

// Установка размеров canvas при загрузке и при изменении окна
function setCanvasSize() {
  if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    // В WebApp: canvas = 100% контейнера
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
  } else {
    // Локально: фиксированные 422×552
    width = 422;
    height = 552;
  }
  canvas.width = width;
  canvas.height = height;
}
setCanvasSize();
window.addEventListener("resize", setCanvasSize);

// ==================== ИНТЕГРАЦИЯ С Telegram.WebApp ====================
const isTelegram = typeof Telegram !== "undefined" && Telegram.WebApp;
if (isTelegram) {
  Telegram.WebApp.ready();

  function adjustForWebApp() {
    const navbarHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--tg-nav-bar-height")
    ) || 0;
    const container = document.getElementById("gameContainer");
    container.style.width = "100vw";
    container.style.height = `calc(100vh - ${navbarHeight}px)`;
    container.style.marginTop = `${navbarHeight}px`;
    setCanvasSize();
  }

  // Сначала адаптируем container, потом canvas
  adjustForWebApp();
  window.addEventListener("resize", adjustForWebApp);
}

// ==================== ПЕРЕМЕННЫЕ И ОБЪЕКТЫ ИГРЫ ====================
let platforms = [];
const image = document.getElementById("sprite");
let player, base, Spring, platform_broken_substitute;
const platformCount = 10;
let position = 0,
    gravity = 0.2,
    animloop,
    flag = 0,
    broken = 0,
    dir = "left",
    score = 0,
    firstRun = true,
    jumpCount = 0;

// ==================== КЛАССЫ ИГРЫ ====================
class Base {
  constructor() {
    this.height = 5;
    this.width = width;
    this.cx = 0;
    this.cy = 614;
    this.cwidth = 100;
    this.cheight = 5;
    this.x = 0;
    this.y = height - this.height;
  }
  draw() {
    try {
      ctx.drawImage(
        image,
        this.cx,
        this.cy,
        this.cwidth,
        this.cheight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } catch (e) {}
  }
}

class Player {
  constructor() {
    this.vy = 11;
    this.vx = 0;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isDead = false;
    this.width = 55;
    this.height = 40;
    this.cx = 0;
    this.cy = 0;
    this.cwidth = 110;
    this.cheight = 80;
    this.dir = "left";
    this.x = width / 2 - this.width / 2;
    this.y = height;
  }
  draw() {
    try {
      if (this.dir == "right") this.cy = 121;
      else if (this.dir == "left") this.cy = 201;
      else if (this.dir == "right_land") this.cy = 289;
      else if (this.dir == "left_land") this.cy = 371;

      ctx.drawImage(
        image,
        this.cx,
        this.cy,
        this.cwidth,
        this.cheight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } catch (e) {}
  }
  jump() {
    // Сила прыжка: baseJump + небольшое увеличение в зависимости от score
    const baseJump = 6;
    const extra = Math.min(score * 0.0005, 4); // максимум +4
    this.vy = -(baseJump + extra);
  }
  jumpHigh() {
    // Аналогично, но чуть сильнее
    const baseHigh = 12;
    const extraHigh = Math.min(score * 0.0007, 6); // максимум +6
    this.vy = -(baseHigh + extraHigh);
  }
}

class Platform {
  constructor() {
    this.width = 70;
    this.height = 17;
    this.x = Math.random() * (width - this.width);
    this.y = position;
    position += height / platformCount;
    this.flag = 0;
    this.state = 0;
    this.cx = 0;
    this.cy = 0;
    this.cwidth = 105;
    this.cheight = 31;

    if (score >= 5000) this.types = [2, 3, 3, 3, 4, 4, 4, 4];
    else if (score >= 2000 && score < 5000)
      this.types = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
    else if (score >= 1000 && score < 2000)
      this.types = [2, 2, 2, 3, 3, 3, 3, 3];
    else if (score >= 500 && score < 1000)
      this.types = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
    else if (score >= 100 && score < 500) this.types = [1, 1, 1, 1, 2, 2];
    else this.types = [1];

    this.type = this.types[Math.floor(Math.random() * this.types.length)];

    if (this.type == 3 && broken < 1) {
      broken++;
    } else if (this.type == 3 && broken >= 1) {
      this.type = 1;
      broken = 0;
    }
    this.moved = 0;
    this.vx = 1;
  }
  draw() {
    try {
      if (this.type == 1) this.cy = 0;
      else if (this.type == 2) this.cy = 61;
      else if (this.type == 3 && this.flag === 0) this.cy = 31;
      else if (this.type == 3 && this.flag == 1) this.cy = 1000;
      else if (this.type == 4 && this.state === 0) this.cy = 90;
      else if (this.type == 4 && this.state == 1) this.cy = 1000;

      ctx.drawImage(
        image,
        this.cx,
        this.cy,
        this.cwidth,
        this.cheight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } catch (e) {}
  }
}

class PlatformBrokenSub {
  constructor() {
    this.height = 30;
    this.width = 70;
    this.x = 0;
    this.y = 0;
    this.cx = 0;
    this.cy = 554;
    this.cwidth = 105;
    this.cheight = 60;
    this.appearance = false;
  }
  draw() {
    try {
      if (this.appearance === true) {
        ctx.drawImage(
          image,
          this.cx,
          this.cy,
          this.cwidth,
          this.cheight,
          this.x,
          this.y,
          this.width,
          this.height
        );
      }
    } catch (e) {}
  }
}

class SpringClass {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 26;
    this.height = 30;
    this.cx = 0;
    this.cy = 0;
    this.cwidth = 45;
    this.cheight = 53;
    this.state = 0;
  }
  draw() {
    try {
      if (this.state === 0) this.cy = 445;
      else if (this.state == 1) this.cy = 501;
      ctx.drawImage(
        image,
        this.cx,
        this.cy,
        this.cwidth,
        this.cheight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } catch (e) {}
  }
}

// ========== Инициализируем все объекты до старта ==========
base = new Base();
player = new Player();
Spring = new SpringClass();
platform_broken_substitute = new PlatformBrokenSub();

for (let i = 0; i < platformCount; i++) {
  platforms.push(new Platform());
}

// ========== ФУНКЦИИ ОБНОВЛЕНИЯ ИГРЫ ==========
function paintCanvas() {
  ctx.clearRect(0, 0, width, height);
}

function playerCalc() {
  // Выбираем спрайт по направлению и высоте прыжка
  if (dir == "left") {
    player.dir = "left";
    if (player.vy < -7 && player.vy > -15) player.dir = "left_land";
  } else if (dir == "right") {
    player.dir = "right";
    if (player.vy < -7 && player.vy > -15) player.dir = "right_land";
  }

  // Горизонтальное движение: меньшая «чувствительность»
  if (player.isMovingLeft === true) {
    player.x += player.vx;
    player.vx -= 0.08;    // раньше было 0.15
  } else {
    player.x += player.vx;
    if (player.vx < 0) player.vx += 0.05;  // раньше 0.1
  }
  if (player.isMovingRight === true) {
    player.x += player.vx;
    player.vx += 0.08;    // раньше 0.15
  } else {
    player.x += player.vx;
    if (player.vx > 0) player.vx -= 0.05;  // раньше 0.1
  }
  if (player.vx > 8) player.vx = 8;
  else if (player.vx < -8) player.vx = -8;

  // Прыжок от базы
  if ((player.y + player.height) > base.y && base.y < height) {
    player.jump();
  }

  // Game Over, если база оказалась ниже экрана
  if (base.y > height && (player.y + player.height) > height && player.isDead != "lol") {
    player.isDead = true;
  }

  // Проход через стены
  if (player.x > width) player.x = 0 - player.width;
  else if (player.x < 0 - player.width) player.x = width;

  // Вертикальный скролл и падение
  if (player.y >= (height / 2) - (player.height / 2)) {
    player.y += player.vy;
    player.vy += gravity;
  } else {
    platforms.forEach(function(p, i) {
      if (player.vy < 0) {
        p.y -= player.vy;
      }
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
    score++;
  }

  collides();
  if (player.isDead === true) gameOver();
}

function springCalc() {
  let s = Spring;
  let p = platforms[0];
  if (p.type == 1 || p.type == 2) {
    s.x = p.x + p.width / 2 - s.width / 2;
    s.y = p.y - p.height - 10;
    if (s.y > height / 1.1) s.state = 0;
    s.draw();
  } else {
    s.x = 0 - s.width;
    s.y = 0 - s.height;
  }
}

function platformCalc() {
  let subs = platform_broken_substitute;
  platforms.forEach(function(p, i) {
    if (p.type == 2) {
      if (p.x < 0 || p.x + p.width > width) p.vx *= -1;
      p.x += p.vx;
    }
    if (p.flag == 1 && subs.appearance === false && jumpCount === 0) {
      subs.x = p.x;
      subs.y = p.y;
      subs.appearance = true;
      jumpCount++;
    }
    p.draw();
  });
  if (subs.appearance === true) {
    subs.draw();
    subs.y += 8;
  }
  if (subs.y > height) subs.appearance = false;
}

function collides() {
  platforms.forEach(function(p, i) {
    if (
      player.vy > 0 &&
      p.state === 0 &&
      player.x + 15 < p.x + p.width &&
      player.x + player.width - 15 > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height
    ) {
      if (p.type == 3 && p.flag === 0) {
        p.flag = 1;
        jumpCount = 0;
        return;
      } else if (p.type == 4 && p.state === 0) {
        player.jump();
        p.state = 1;
      } else if (p.flag == 1) return;
      else {
        player.jump();
      }
    }
  });

  let s = Spring;
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

function updateScore() {
  let scoreText = document.getElementById("score");
  scoreText.innerText = score;
}

function gameOver() {
  platforms.forEach(function(p, i) {
    p.y -= 12;
  });
  if (player.y > height / 2 && flag === 0) {
    player.y -= 8;
    player.vy = 0;
  } else if (player.y < height / 2) {
    flag = 1;
  } else if (player.y + player.height > height) {
    showGameOverMenu();
    hideScore();
    player.isDead = "lol";
  }
}

function update() {
  paintCanvas();
  platformCalc();
  springCalc();
  playerCalc();
  player.draw();
  base.draw();
  updateScore();
}

// ========== ИНИЦИАЛИЗАЦИЯ ИГРЫ ==========
function init() {
  // При первом запуске объекты уже созданы выше
  jumpCount = 0;
  position = 0;
  score = 0;
  flag = 0;

  base = new Base();
  player = new Player();
  Spring = new SpringClass();
  platform_broken_substitute = new PlatformBrokenSub();
  platforms = [];
  for (let i = 0; i < platformCount; i++) {
    platforms.push(new Platform());
  }

  paintCanvas();
  animloop = function() {
    update();
    requestAnimationFrame(animloop);
  };
  animloop();
  hideMainMenu();
  showScore();
}

function reset() {
  hideGameOverMenu();
  showScore();
  player.isDead = false;
  flag = 0;
  position = 0;
  score = 0;
  jumpCount = 0;

  base = new Base();
  player = new Player();
  Spring = new SpringClass();
  platform_broken_substitute = new PlatformBrokenSub();
  platforms = [];
  for (let i = 0; i < platformCount; i++) {
    platforms.push(new Platform());
  }
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

// Запускаем «демо-цикл» до старта
function menuLoop() {
  update();
  requestAnimationFrame(menuLoop);
}
menuLoop();

// ========== ОБРАБОТЧИКИ КНОПОК ==========
document.getElementById("btnPlay").addEventListener("click", init);
document.getElementById("btnRestart").addEventListener("click", reset);

// ========== НЕВИДИМЫЕ ЗОНЫ ДЛЯ УПРАВЛЕНИЯ ==========
const leftZone = document.getElementById("leftZone");
const rightZone = document.getElementById("rightZone");

// Левая зона: движение влево при mousedown/touchstart
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

// Правая зона: движение вправо при mousedown/touchstart
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
