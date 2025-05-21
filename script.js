// Game elements
const screens = {
  welcome: document.querySelector(".welcome-screen"),
  game: document.querySelector(".game-screen"),
  result: document.querySelector(".result-screen"),
  gameOver: document.querySelector(".game-over-screen"),
};

const playerNameInput = document.getElementById("player-name");
const startBtn = document.getElementById("start-btn");
const playerInfo = document.getElementById("player-info");
const timeInfo = document.getElementById("time-info");
const powerInfo = document.getElementById("power-info");
const player = document.getElementById("player");
const gameContainer = document.querySelector(".game-container");
const resultText = document.getElementById("result-text");
const gameOverText = document.getElementById("game-over-text");
const restartBtns = [
  document.getElementById("result-restart-btn"),
  document.getElementById("game-over-restart-btn"),
];

// Game variables
let playerName = "";
let gameTime = 0;
let power = 50;
let gameInterval;
let powerInterval;
let isPaused = false;
let gameWidth, gameHeight;
let playerY = 0;
let playerHeight = 40;
let walls = [];
let batteries = [];
let wallGap = 200;
let lastWallX = 0;
let keys = {};

function initGame() {
  //определение размеров игровой зоны
  gameWidth = gameContainer.offsetWidth;
  gameHeight = gameContainer.offsetHeight;

  // стартовая позиция игрока
  playerY = (gameHeight - playerHeight) / 2;
  player.style.left = "50px";
  player.style.top = `${playerY}px`;

  // очистка существующих объектов на экране
  walls.forEach((wall) => wall.remove());
  batteries.forEach((battery) => battery.remove());
  walls = [];
  batteries = [];
  lastWallX = gameWidth;

  // обновление статов игры
  gameTime = 0;
  power = 50;
  player.classList.remove("crash-animation");
  updateStats();

  // запуск game loop
  if (gameInterval) clearInterval(gameInterval);
  if (powerInterval) clearInterval(powerInterval);

  gameInterval = setInterval(updateGame, 1000 / 60); // 60 FPS
  powerInterval = setInterval(updatePower, 1000); // Every second
}

// обновление игры
function updateGame() {
  if (isPaused) return;

  // движение стен
  walls.forEach((wall) => {
    const wallX = parseInt(wall.style.left) - 2;
    wall.style.left = `${wallX}px`;

    // удаление стен за экраном
    if (wallX < -parseInt(wall.style.width)) {
      wall.remove();
      walls = walls.filter((w) => w !== wall);
    }
  });

  // движение батареек
  batteries.forEach((battery) => {
    const batteryX = parseInt(battery.style.left) - 2;
    battery.style.left = `${batteryX}px`;

    // удаление батарей за экраном
    if (batteryX < -30) {
      battery.remove();
      batteries = batteries.filter((b) => b !== battery);
    }
  });

  const rightmostWallX =
    walls.length > 0
      ? Math.max(
          ...walls.map((w) => parseInt(w.style.left) + parseInt(w.style.width))
        )
      : 0;

  if (rightmostWallX < gameWidth - wallGap) {
    generateWall();
  }

  // проверка коллизии
  checkCollisions();
}

// функция генерации стен
function generateWall() {
  const wallHeight = Math.floor(Math.random() * 301) + 100; // 100-500px
  const isTopWall = Math.random() > 0.5;

  const wall = document.createElement("div");
  wall.className = "wall";
  wall.style.width = "50px";
  wall.style.height = `${wallHeight}px`;
  wall.style.left = `${gameWidth}px`;
  wall.style.top = isTopWall ? "0" : `${gameHeight - wallHeight}px`;

  gameContainer.appendChild(wall);
  walls.push(wall);

  if (Math.random() < 0.3) {
    generateBattery(wallHeight, isTopWall);
  }
}

// функция генерации батареек
function generateBattery(wallHeight, isTopWall) {
  const minY = isTopWall ? wallHeight + 50 : 50;
  const maxY = isTopWall ? gameHeight - 100 : gameHeight - wallHeight - 100;

  // хватает ли места для батарейки
  if (maxY - minY < 60) return;

  const batteryY = Math.floor(Math.random() * (maxY - minY)) + minY;

  const battery = document.createElement("div");
  battery.className = "battery";
  battery.style.left = `${gameWidth + 150}px`; // Place in the middle of the gap
  battery.style.top = `${batteryY}px`;

  gameContainer.appendChild(battery);
  batteries.push(battery);
}

// обновление уровня энергии
function updatePower() {
  if (isPaused) return;

  power -= 1;
  updateStats();

  if (power <= 0) {
    endGame("power");
  }
}

// функции проверки коллизии
function checkCollisions() {
  const playerRect = player.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();

  //для стен
  for (const wall of walls) {
    const wallRect = wall.getBoundingClientRect();

    if (isColliding(playerRect, wallRect)) {
      endGame("crash");
      return;
    }
  }

  //для батарей
  for (const battery of batteries) {
    const batteryRect = battery.getBoundingClientRect();

    if (isColliding(playerRect, batteryRect)) {
      //подбор батареи
      power = Math.min(100, power + 5);
      updateStats();
      battery.classList.add("battery-collected");

      // анимация и удаление батареи
      setTimeout(() => {
        battery.remove();
        batteries = batteries.filter((b) => b !== battery);
      }, 500);
    }
  }

  // проверка границ
  if (playerRect.top < gameRect.top) {
    playerY = 0;
    player.style.top = "0px";
  } else if (playerRect.bottom > gameRect.bottom) {
    playerY = gameHeight - playerHeight;
    player.style.top = `${playerY}px`;
  }
}

// проверка соприкосновений
function isColliding(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

// обновление статов на экране
function updateStats() {
  const minutes = Math.floor(gameTime / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(gameTime % 60)
    .toString()
    .padStart(2, "0");

  playerInfo.textContent = `Игрок: ${playerName}`;
  timeInfo.textContent = `Время: ${minutes}:${seconds}`;
  powerInfo.textContent = `Заряд: ${power}%`;
}

// окончание игры
function endGame(reason) {
  clearInterval(gameInterval);
  clearInterval(powerInterval);

  const minutes = Math.floor(gameTime / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (gameTime % 60).toString().padStart(2, "0");

  if (reason === "crash") {
    player.classList.add("crash-animation");
    setTimeout(() => {
      showScreen("gameOver");
      gameOverText.textContent = `Вы разбились! Время полёта: ${minutes}:${seconds}`;
    }, 1000);
  } else if (reason === "power") {
    showScreen("result");
    resultText.textContent = `Вы продержались: ${minutes}:${seconds}`;
  }
}

// показать указанный экран
function showScreen(screenName) {
  for (const screen in screens) {
    screens[screen].classList.remove("active");
  }
  screens[screenName].classList.add("active");
}

playerNameInput.addEventListener("input", () => {
  playerName = playerNameInput.value.trim();
  startBtn.disabled = playerName.length === 0;
});

startBtn.addEventListener("click", () => {
  playerName = playerNameInput.value.trim();
  if (playerName.length > 0) {
    showScreen("game");
    initGame();
  }
});

restartBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    showScreen("game");
    initGame();
  });
});

// управление
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  // паузка
  if (e.key === "Escape") {
    isPaused = !isPaused;

    if (isPaused) {
      player.style.animationPlayState = "paused";
      document.querySelectorAll(".wall, .battery").forEach((el) => {
        el.style.animationPlayState = "paused";
      });
    } else {
      requestAnimationFrame(gameLoop);
      player.style.animationPlayState = "running";
      document.querySelectorAll(".wall, .battery").forEach((el) => {
        el.style.animationPlayState = "running";
      });
    }
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// движение игрока
function gameLoop() {
  if (isPaused) return;

  gameTime += 1 / 60;

  const speed = 5;
  if (keys["w"] || keys["ArrowUp"]) {
    playerY = Math.max(0, playerY - speed);
  }
  if (keys["s"] || keys["ArrowDown"]) {
    playerY = Math.min(gameHeight - playerHeight, playerY + speed);
  }

  player.style.top = `${playerY}px`;

  requestAnimationFrame(gameLoop);
}

// запуск игры
requestAnimationFrame(gameLoop);
