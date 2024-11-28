const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const players = new Map();
let localPlayer = null;
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

socket.on("connect", () => {
  const nickname = prompt("Введите никнейм:") || "Игрок";
  socket.emit("join", nickname);
});

socket.on("gameState", (state) => {
  state.players.forEach(([id, player]) => {
    players.set(id, player);
  });
});

socket.on("playerJoined", (player) => {
  players.set(player.id, player);
});

socket.on("playerMoved", (player) => {
  players.set(player.id, player);
});

socket.on("playerLeft", (id) => {
  players.delete(id);
});

function handleMovement() {
  const speed = 5;
  let dx = 0,
    dy = 0;

  if (keys.w) dy = -speed; // W key
  if (keys.s) dy = speed; // S key
  if (keys.a) dx = -speed; // A key
  if (keys.d) dx = speed; // D key

  if (localPlayer) {
    localPlayer.x += dx;
    localPlayer.y += dy;
    socket.emit("playerMove", { x: localPlayer.x, y: localPlayer.y, dx, dy });
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "w") keys.w = true;
  if (e.key === "a") keys.a = true;
  if (e.key === "s") keys.s = true;
  if (e.key === "d") keys.d = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "w") keys.w = false;
  if (e.key === "a") keys.a = false;
  if (e.key === "s") keys.s = false;
  if (e.key === "d") keys.d = false;
});

function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  players.forEach((player, id) => {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = id === socket.id ? "red" : "blue";
    ctx.fill();

    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(player.nickname, player.x, player.y - 20);
  });
}

function gameLoop() {
  if (localPlayer) {
    handleMovement();
  }
  drawPlayers();
  requestAnimationFrame(gameLoop);
}

socket.on("gameState", (state) => {
  localPlayer = state.players.find(([id]) => id === socket.id)?.[1];
  gameLoop();
});
