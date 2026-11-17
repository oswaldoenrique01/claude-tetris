# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Tetris en JavaScript vanilla + HTML5 Canvas. Sin `package.json`, build, linter ni tests. README y UI en español.

## Ejecutar

Abrir `index.html` directamente, o servidor estático: `python -m http.server 8000` → `http://localhost:8000`.

## Arquitectura

Cuatro archivos (`skins.js` aparte, ver Skins); la lógica del juego está en `game.js` (script global, `'use strict'`, estado en variables `let` de módulo):

- `index.html` define `#board` (300×600), `#next-canvas` (120×120), HUD (`#score`, `#lines`, `#level`) y `#overlay` (pausa/game over). `game.js` los obtiene por id al cargar, así que renombrar ids rompe el juego.
- Tablero: matriz `ROWS×COLS`; `0` = vacío, `1–7` = índice en `COLORS`/`PIECES` (el mismo índice identifica tipo de pieza y color).
- Flujo: `init()` → `spawn()` (next→current, genera nueva next; si colisiona al aparecer llama `endGame()`) → `loop()` con `requestAnimationFrame` acumulando `dropAccum` contra `dropInterval`. `lockPiece()` = `merge()` + `clearLines()` + `spawn()`.
- `clearLines()` actualiza score/nivel/`dropInterval` (`max(100, 1000 − (level−1)*90)`); nivel sube cada 10 líneas.
- Rotación: `rotateCW` + kicks horizontales `[0,-1,1,-2,2]` en `tryRotate`. Ghost piece vía `ghostY()`.
- Pausa cancela/reanuda el rAF manualmente (`togglePause`); `endGame` también cancela el rAF; `init` es el reinicio.

- Skins: `skins.js` (cargado por `<script>` ANTES de `game.js`) define `SKINS` (`retro|neon|pastel|pixel`; cada una con `colors[8]`, `background`, `grid`, `drawBlock`), `loadSkinName`/`saveSkinName` (`localStorage` `tetris.skin`). `game.js` `applySkin(name)` fija `skin`, `COLORS` y clase `skin-<name>` en `<body>`; `drawBlock` delega en `skin`. Selector `#skin-select` (se rellena desde `SKINS`) redibuja `draw()`+`drawNext()`.

## Notas

- Cambiar `COLS`/`ROWS`/`BLOCK` exige ajustar `width`/`height` de `<canvas id="board">` en `index.html` (`COLS*BLOCK` × `ROWS*BLOCK`).
- `drawNext` usa tamaño de bloque fijo 30 sobre una cuadrícula de 4×4.
