'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

// ---- Skins ----
function rrect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

const SKINS = {
  retro: {
    name: 'Retro',
    colors: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#7986cb', '#ffb74d'],
    boardBg: '#1a1a25',
    grid: '#22222e',
    draw(context, x, y, color, size) {
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    },
  },
  neon: {
    name: 'Neon',
    colors: [null, '#00f0ff', '#fff200', '#d500f9', '#39ff14', '#ff1744', '#536dfe', '#ff9100'],
    boardBg: '#000000',
    grid: '#14141c',
    draw(context, x, y, color, size) {
      const px = x * size + 3, py = y * size + 3, s = size - 6;
      context.shadowColor = color;
      context.shadowBlur = 14;
      context.fillStyle = 'rgba(0,0,0,0.85)';
      context.fillRect(px, py, s, s);
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(px, py, s, s);
      context.shadowBlur = 0;
      context.fillStyle = color;
      context.globalAlpha *= 0.35;
      context.fillRect(px + 4, py + 4, s - 8, s - 8);
    },
  },
  pastel: {
    name: 'Pastel',
    colors: [null, '#a8e6ef', '#fff1b8', '#d9b8e6', '#b8e6c1', '#f5b8b8', '#b8c4f0', '#fdd5a8'],
    boardBg: '#f4eef7',
    grid: '#e4dcea',
    draw(context, x, y, color, size) {
      const px = x * size + 2, py = y * size + 2, s = size - 4;
      rrect(context, px, py, s, s, 8);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = 'rgba(255,255,255,0.8)';
      context.lineWidth = 2;
      rrect(context, px + 3, py + 3, s - 6, s - 6, 5);
      context.stroke();
    },
  },
  pixel: {
    name: 'Pixel art',
    colors: [null, '#29b6f6', '#fdd835', '#ab47bc', '#66bb6a', '#ef5350', '#5c6bc0', '#ffa726'],
    boardBg: '#101018',
    grid: '#1c1c28',
    draw(context, x, y, color, size) {
      const px = x * size, py = y * size, u = Math.max(2, Math.round(size / 10));
      context.fillStyle = color;
      context.fillRect(px, py, size, size);
      // textura: checker oscuro/claro
      for (let i = u; i < size - u; i += u) {
        for (let j = u; j < size - u; j += u) {
          if (((i + j) / u) % 2 === 0) {
            context.fillStyle = 'rgba(0,0,0,0.18)';
            context.fillRect(px + i, py + j, u, u);
          }
        }
      }
      // bisel
      context.fillStyle = 'rgba(255,255,255,0.55)';
      context.fillRect(px, py, size, u);
      context.fillRect(px, py, u, size);
      context.fillStyle = 'rgba(0,0,0,0.5)';
      context.fillRect(px, py + size - u, size, u);
      context.fillRect(px + size - u, py, u, size);
    },
  },
};

const SKIN_KEY = 'tetris-skin';
let skinId = 'retro';
try {
  const saved = localStorage.getItem(SKIN_KEY);
  if (saved && SKINS[saved]) skinId = saved;
} catch (_) {}
let COLORS = SKINS[skinId].colors;

function applySkin(id) {
  if (!SKINS[id]) return;
  skinId = id;
  COLORS = SKINS[id].colors;
  document.body.dataset.skin = id;
  document.documentElement.style.setProperty('--board-bg', SKINS[id].boardBg);
  try { localStorage.setItem(SKIN_KEY, id); } catch (_) {}
  document.querySelectorAll('[data-skin-btn]').forEach(b => b.classList.toggle('active', b.dataset.skinBtn === id));
  if (board && current && next) {
    draw();
    drawNext();
  }
}

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const pauseMenu = document.getElementById('pause-menu');
const menuMain = document.getElementById('menu-main');
const menuControls = document.getElementById('menu-controls');
const startLevelEl = document.getElementById('start-level');

const MAX_START_LEVEL = 15;
const RESUME_LOCK_MS = 250;
const overlayMsg = document.getElementById('overlay-msg');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const recordsBox = document.getElementById('records');
const recordsList = document.getElementById('records-list');
const recordsStats = document.getElementById('records-stats');
const resetBtn = document.getElementById('reset-btn');

const STORAGE_KEY = 'tetris.records';
const MAX_RECORDS = 5;

let combo, bestCombo, pendingScore;
let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let startLevel = 1;
let inputLockedUntil = 0;

function intervalForLevel(lvl) {
  return Math.max(100, 1000 - (lvl - 1) * 90);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    combo++;
    bestCombo = Math.max(bestCombo, combo);
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = startLevel + Math.floor(lines / 10);
    dropInterval = intervalForLevel(level);
    updateHUD();
  } else {
    combo = 0;
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  context.save();
  context.globalAlpha = alpha ?? 1;
  SKINS[skinId].draw(context, x, y, COLORS[colorIndex], size);
  context.restore();
}

function drawGrid() {
  ctx.strokeStyle = SKINS[skinId].grid;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

// ---- Records ----
function loadData() {
  const empty = { records: [], bestCombo: 0, maxLines: 0 };
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!d || !Array.isArray(d.records)) return empty;
    return {
      records: d.records.slice(0, MAX_RECORDS),
      bestCombo: d.bestCombo | 0,
      maxLines: d.maxLines | 0,
    };
  } catch {
    return empty;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* almacenamiento no disponible */ }
}

function qualifies(records, pts) {
  return pts > 0 && (records.length < MAX_RECORDS || pts > records[records.length - 1].score);
}

function renderRecords(data, highlight = -1) {
  recordsList.innerHTML = '';
  for (let i = 0; i < MAX_RECORDS; i++) {
    const rec = data.records[i];
    const li = document.createElement('li');
    if (rec) {
      const rank = document.createElement('span');
      rank.textContent = `${i + 1}. ${rec.name}`;
      const pts = document.createElement('span');
      pts.textContent = rec.score.toLocaleString();
      li.append(rank, pts);
      if (i === highlight) li.className = 'new';
    } else {
      li.className = 'empty';
      li.textContent = `${i + 1}. ---`;
    }
    recordsList.appendChild(li);
  }
  recordsStats.textContent = `Mejor combo: ${data.bestCombo} · Líneas máx: ${data.maxLines}`;
  recordsBox.classList.remove('hidden');
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayScore.textContent = text;
  overlayMsg.classList.add('hidden');
  nameForm.classList.add('hidden');
  recordsBox.classList.add('hidden');
  overlay.classList.remove('hidden');
}

function showStart() {
  showOverlay('TETRIS', '');
  restartBtn.textContent = 'Jugar';
  renderRecords(loadData());
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  showOverlay('GAME OVER', `Puntuación: ${score.toLocaleString()}`);
  restartBtn.textContent = 'Reiniciar';

  const data = loadData();
  data.bestCombo = Math.max(data.bestCombo, bestCombo);
  data.maxLines = Math.max(data.maxLines, lines);
  saveData(data);

  if (qualifies(data.records, score)) {
    pendingScore = score;
    const rank = data.records.filter(r => r.score >= score).length + 1;
    overlayMsg.textContent = `¡Nuevo récord! Puesto #${rank}`;
    overlayMsg.classList.remove('hidden');
    nameForm.classList.remove('hidden');
    nameInput.value = '';
    nameInput.focus();
  }
  renderRecords(data);
}

function showMenuView(view) {
  menuMain.classList.toggle('hidden', view !== 'main');
  menuControls.classList.toggle('hidden', view !== 'controls');
  const target = view === 'main' ? 'resume-btn' : 'back-btn';
  document.getElementById(target).focus();
}

function menuButtons() {
  const view = menuMain.classList.contains('hidden') ? menuControls : menuMain;
  return [...view.querySelectorAll('button')];
}

function setStartLevel(n) {
  startLevel = Math.min(MAX_START_LEVEL, Math.max(1, n));
  startLevelEl.textContent = startLevel;
}

function pauseGame() {
  if (gameOver || paused) return;
  paused = true;
  cancelAnimationFrame(animId);
  pauseMenu.classList.remove('hidden');
  showMenuView('main');
}

function resumeGame() {
  if (!paused) return;
  paused = false;
  pauseMenu.classList.add('hidden');
  document.activeElement.blur();
  inputLockedUntil = performance.now() + RESUME_LOCK_MS;
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);
}

function togglePause() {
  if (paused) resumeGame();
  else pauseGame();
}

nameForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = loadData();
  if (pendingScore == null || !qualifies(data.records, pendingScore)) return;
  const name = nameInput.value.trim() || 'Anónimo';
  const entry = { name, score: pendingScore };
  const idx = data.records.filter(r => r.score >= pendingScore).length;
  data.records.splice(idx, 0, entry);
  data.records = data.records.slice(0, MAX_RECORDS);
  saveData(data);
  pendingScore = null;
  nameForm.classList.add('hidden');
  renderRecords(data, idx);
});

resetBtn.addEventListener('click', () => {
  if (!confirm('¿Borrar todos los records?')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  pendingScore = null;
  nameForm.classList.add('hidden');
  overlayMsg.classList.add('hidden');
  renderRecords(loadData());
});

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = startLevel;
  combo = 0;
  bestCombo = 0;
  pendingScore = null;
  paused = false;
  gameOver = false;
  dropInterval = intervalForLevel(level);
  dropAccum = 0;
  lastTime = performance.now();
  inputLockedUntil = lastTime + RESUME_LOCK_MS;
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  document.activeElement.blur();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (!e.repeat) {
      if (paused && e.code === 'Escape' && !menuControls.classList.contains('hidden')) showMenuView('main');
      else togglePause();
    }
    return;
  }
  if (paused) {
    // menú abierto: las teclas del juego no pasan; solo navegación del menú
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.preventDefault();
      const btns = menuButtons();
      const i = btns.indexOf(document.activeElement);
      const step = e.code === 'ArrowDown' ? 1 : -1;
      btns[(i + step + btns.length) % btns.length].focus();
    } else if (e.code === 'Space') {
      e.preventDefault();
    }
    return;
  }
  if (gameOver) return;
  if (performance.now() < inputLockedUntil) {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    return;
  }
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);
document.getElementById('resume-btn').addEventListener('click', resumeGame);
document.getElementById('menu-restart-btn').addEventListener('click', init);
document.getElementById('controls-btn').addEventListener('click', () => showMenuView('controls'));
document.getElementById('back-btn').addEventListener('click', () => showMenuView('main'));
document.getElementById('level-down').addEventListener('click', () => setStartLevel(startLevel - 1));
document.getElementById('level-up').addEventListener('click', () => setStartLevel(startLevel + 1));

const skinBtns = document.querySelectorAll('[data-skin-btn]');
skinBtns.forEach(btn => btn.addEventListener('click', () => {
  applySkin(btn.dataset.skinBtn);
  btn.blur();
}));

applySkin(skinId);
// Pantalla de inicio: el juego espera a pulsar "Jugar"
init();
cancelAnimationFrame(animId);
gameOver = true;
draw();
showStart();
