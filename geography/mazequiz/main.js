const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 400;

const GRID = 5;
const tileSize = canvas.width / GRID;

// Maze (0 = path, 1 = wall)
const maze = [
  [0,0,0,0,0],
  [1,1,0,1,0],
  [0,0,0,1,0],
  [0,1,1,1,0],
  [0,0,0,0,0],
];

let player = {
  x: 0,
  y: 0,
  px: 0,
  py: 0,
  path: [],
  moving: false
};

let answers = [];
let enemies = [];
let hearts = 3;

let questions = [];
let currentQ = 0;

// LOAD QUESTIONS
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data;
    loadQuestion();
    gameLoop();
  });

// LOAD QUESTION
function loadQuestion() {
  const q = questions[currentQ];
  document.getElementById("questionBox").innerText = q.question;

  answers = [
    { x: 4, y: 0, index: 0 },
    { x: 4, y: 2, index: 1 },
    { x: 4, y: 4, index: 2 }
  ];

  player.x = 0;
  player.y = 0;
  player.path = [];
  player.moving = false;

  enemies = [];
}

// TOUCH INPUT
canvas.addEventListener("touchstart", e => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const mx = touch.clientX - rect.left;
  const my = touch.clientY - rect.top;

  // Check answer tap
  answers.forEach(a => {
    if (
      mx > a.x * tileSize &&
      mx < (a.x + 1) * tileSize &&
      my > a.y * tileSize &&
      my < (a.y + 1) * tileSize
    ) {
      const path = findPath(player.x, player.y, a.x, a.y);
      if (path.length > 0) {
        player.path = path;
        player.moving = true;
        player.targetAnswer = a.index;
        spawnEnemy();
      }
    }
  });

  // Attack enemies
  enemies.forEach(e => {
    if (
      mx > e.x && mx < e.x + 20 &&
      my > e.y && my < e.y + 20
    ) {
      e.hp--;
    }
  });
});

// A* PATHFINDING
function findPath(sx, sy, ex, ey) {
  let open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
  let closed = [];

  function heuristic(x, y) {
    return Math.abs(x - ex) + Math.abs(y - ey);
  }

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    let current = open.shift();

    if (current.x === ex && current.y === ey) {
      let path = [];
      while (current) {
        path.push({ x: current.x, y: current.y });
        current = current.parent;
      }
      return path.reverse();
    }

    closed.push(current);

    const dirs = [
      [1,0],[-1,0],[0,1],[0,-1]
    ];

    dirs.forEach(d => {
      let nx = current.x + d[0];
      let ny = current.y + d[1];

      if (
        nx < 0 || ny < 0 ||
        nx >= GRID || ny >= GRID ||
        maze[ny][nx] === 1
      ) return;

      if (closed.find(n => n.x === nx && n.y === ny)) return;

      let g = current.g + 1;
      let h = heuristic(nx, ny);
      let f = g + h;

      let existing = open.find(n => n.x === nx && n.y === ny);
      if (!existing || g < existing.g) {
        open.push({
          x: nx,
          y: ny,
          g,
          f,
          parent: current
        });
      }
    });
  }

  return [];
}

// ENEMIES
function spawnEnemy() {
  enemies.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    hp: 1
  });
}

// UPDATE
function update() {
  // MOVE ALONG PATH
  if (player.moving && player.path.length > 0) {
    let next = player.path[0];

    let targetX = next.x * tileSize;
    let targetY = next.y * tileSize;

    let dx = targetX - player.px;
    let dy = targetY - player.py;

    player.px += dx * 0.2;
    player.py += dy * 0.2;

    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      player.x = next.x;
      player.y = next.y;
      player.path.shift();
    }

    if (player.path.length === 0) {
      player.moving = false;
      checkAnswer(player.targetAnswer);
    }
  }

  // ENEMIES MOVE
  enemies.forEach(e => {
    let dx = player.px - e.x;
    let dy = player.py - e.y;

    e.x += dx * 0.01;
    e.y += dy * 0.01;

    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      hearts--;
      updateHearts();
      e.hp = 0;
    }
  });

  enemies = enemies.filter(e => e.hp > 0);
}

// CHECK ANSWER
function checkAnswer(index) {
  const q = questions[currentQ];

  if (index === q.correct) {
    document.getElementById("feedback").innerText = "Correct!";
    currentQ = (currentQ + 1) % questions.length;
    setTimeout(loadQuestion, 1000);
  } else {
    document.getElementById("feedback").innerText = "Try again!";
    player.x = 0;
    player.y = 0;
    player.px = 0;
    player.py = 0;
  }
}

// HEARTS
function updateHearts() {
  document.getElementById("hearts").innerText = "❤️".repeat(hearts);
  if (hearts <= 0) {
    hearts = 3;
    currentQ = 0;
    loadQuestion();
  }
}

// DRAW
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // DRAW MAZE (PRETTIER)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = "#333";
        roundRect(x * tileSize, y * tileSize, tileSize, tileSize, 10);
        ctx.fill();
      } else {
        ctx.fillStyle = "#eaeaea";
        roundRect(x * tileSize, y * tileSize, tileSize, tileSize, 10);
        ctx.fill();
      }
    }
  }

  // ANSWERS
  ctx.fillStyle = "#4CAF50";
  answers.forEach((a, i) => {
    ctx.fillText(
      ["A","B","C"][i],
      a.x * tileSize + 30,
      a.y * tileSize + 50
    );
  });

  // PLAYER
  ctx.fillStyle = "#2196F3";
  ctx.beginPath();
  ctx.arc(player.px + 20, player.py + 20, 15, 0, Math.PI * 2);
  ctx.fill();

  // ENEMIES
  ctx.fillStyle = "#E53935";
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, 20, 20);
  });
}

// ROUNDED RECT
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// LOOP
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}