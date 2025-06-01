const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player;
let dir = "";
let gameStarted = false;
let gameOver = false;
let score = 0;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 60;
    this.height = 60;
    this.jumpPower = -15;
    this.gravity = 0.5;
    this.img = document.getElementById("playerImg");
    this.facingLeft = false;
  }

  update() {
    if (this.isMovingLeft) {
      this.vx = -5;
      this.facingLeft = true;
    } else if (this.isMovingRight) {
      this.vx = 5;
      this.facingLeft = false;
    } else {
      this.vx = 0;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
  }

  draw() {
    ctx.save();

    if (this.facingLeft) {
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    ctx.restore();
  }

  jump() {
    this.vy = this.jumpPower;
  }
}

function init() {
  player = new Player(canvas.width / 2 - 30, canvas.height - 100);
  gameStarted = true;
  gameOver = false;
  score = 0;
  document.getElementById("score").textContent = "0";
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("gameOverMenu").style.display = "none";
  animate();
}

function endGame() {
  gameOver = true;
  document.getElementById("go_score").textContent = `You scored ${score} points`;
  document.getElementById("gameOverMenu").style.display = "block";
}

function animate() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.update();
  player.draw();
  requestAnimationFrame(animate);
}

// Кнопки
document.getElementById("btnPlay").addEventListener("click", init);
document.getElementById("btnRestart").addEventListener("click", init);

// Клавиатура
window.addEventListener("keydown", (e) => {
  if (!gameStarted) return;
  if (e.key === "ArrowLeft") player.isMovingLeft = true;
  if (e.key === "ArrowRight") player.isMovingRight = true;
  if (e.key === " " || e.key === "Spacebar") player.jump();
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") player.isMovingLeft = false;
  if (e.key === "ArrowRight") player.isMovingRight = false;
});

// Управление касаниями и мышью
const leftZone = document.getElementById("leftZone");
const rightZone = document.getElementById("rightZone");

leftZone.addEventListener("mousedown", () => {
  if (player) player.isMovingLeft = true;
});
leftZone.addEventListener("mouseup", () => {
  if (player) player.isMovingLeft = false;
});
leftZone.addEventListener("mouseleave", () => {
  if (player) player.isMovingLeft = false;
});
leftZone.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (player) player.isMovingLeft = true;
});
leftZone.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (player) player.isMovingLeft = false;
});

rightZone.addEventListener("mousedown", () => {
  if (player) player.isMovingRight = true;
});
rightZone.addEventListener("mouseup", () => {
  if (player) player.isMovingRight = false;
});
rightZone.addEventListener("mouseleave", () => {
  if (player) player.isMovingRight = false;
});
rightZone.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (player) player.isMovingRight = true;
});
rightZone.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (player) player.isMovingRight = false;
});
