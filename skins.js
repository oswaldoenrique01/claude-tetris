'use strict';

// Skins: cada una define colors[8] (0 = null), background, grid, drawBlock.
function roundedPath(context, x, y, w, h, r) {
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
    label: 'Retro',
    colors: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#7986cb', '#ffb74d'],
    background: '#1a1a25',
    grid: '#22222e',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },

  neon: {
    label: 'Neon',
    colors: [null, '#00f0ff', '#fff200', '#d500f9', '#39ff14', '#ff1744', '#4d6bff', '#ff9100'],
    background: '#000000',
    grid: '#12121a',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      const px = x * size + 3, py = y * size + 3, s = size - 6;
      const a = alpha ?? 1;
      context.globalAlpha = a;
      context.shadowBlur = 12;
      context.shadowColor = color;
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(px, py, s, s);
      context.fillStyle = color;
      context.globalAlpha = a * 0.35;
      context.fillRect(px, py, s, s);
      context.shadowBlur = 0;
      context.shadowColor = 'transparent';
      context.globalAlpha = 1;
    },
  },

  pastel: {
    label: 'Pastel',
    colors: [null, '#a8e6ef', '#fff1a8', '#d9b8f0', '#b8e8c0', '#f7b8b8', '#b8c4f0', '#fcd3a4'],
    background: '#fdf6ee',
    grid: '#eadfd0',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      roundedPath(context, x * size + 2, y * size + 2, size - 4, size - 4, 8);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.45)';
      roundedPath(context, x * size + 6, y * size + 5, size - 12, 4, 2);
      context.fill();
      context.globalAlpha = 1;
    },
  },

  pixel: {
    label: 'Pixel art',
    colors: [null, '#29adff', '#ffec27', '#c2428a', '#00e436', '#ff004d', '#5b6fe0', '#ffa300'],
    background: '#1d2b53',
    grid: '#26376b',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const px = x * size, py = y * size, n = 5, u = (size - 2) / n;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      context.fillRect(px + 1, py + 1, size - 2, size - 2);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === 0 || j === 0) context.fillStyle = 'rgba(255,255,255,0.35)';
          else if (i === n - 1 || j === n - 1) context.fillStyle = 'rgba(0,0,0,0.35)';
          else if ((i + j) % 2 === 0) context.fillStyle = 'rgba(255,255,255,0.12)';
          else continue;
          context.fillRect(px + 1 + i * u, py + 1 + j * u, u, u);
        }
      }
      context.globalAlpha = 1;
    },
  },
};

const SKIN_KEY = 'tetris.skin';
const DEFAULT_SKIN = 'retro';

function loadSkinName() {
  try {
    const v = localStorage.getItem(SKIN_KEY);
    if (Object.prototype.hasOwnProperty.call(SKINS, v)) return v;
  } catch (e) { /* sin storage */ }
  return DEFAULT_SKIN;
}

function saveSkinName(name) {
  try { localStorage.setItem(SKIN_KEY, name); } catch (e) { /* ignorar */ }
}
