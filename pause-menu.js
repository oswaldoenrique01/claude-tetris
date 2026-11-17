'use strict';

// Menu de pausa. Depende de globals de game.js: togglePause, init, gameOver,
// paused, startLevel, START_LEVELS, lastTime, dropAccum.
window.PauseMenu = (() => {
  const menu = document.getElementById('pause-menu');
  const mainView = document.getElementById('pause-main');
  const controlsView = document.getElementById('pause-controls');
  const levelValue = document.getElementById('pm-level-value');
  const btn = id => document.getElementById(id);

  const pressed = new Set();   // teclas actualmente mantenidas
  const blocked = new Set();   // mantenidas desde antes de reanudar: ignorar sus repeats
  let open = false;

  function showView(controls) {
    mainView.classList.toggle('hidden', controls);
    controlsView.classList.toggle('hidden', !controls);
    btn(controls ? 'pm-back' : 'pm-resume').focus();
  }

  function renderLevel() { levelValue.textContent = startLevel; }

  function changeLevel(dir) {
    const i = START_LEVELS.indexOf(startLevel);
    const n = Math.min(START_LEVELS.length - 1, Math.max(0, i + dir));
    startLevel = START_LEVELS[n];
    try { localStorage.setItem('tetris.startLevel', String(startLevel)); } catch (e) { /* ignorar */ }
    renderLevel();
  }

  function setOpen(value) {
    if (value === open) return;
    open = value;
    menu.classList.toggle('hidden', !open);
    if (open) {
      renderLevel();
      showView(false);
    } else {
      // al cerrar: teclas aun mantenidas no deben generar movimiento
      blocked.clear();
      pressed.forEach(c => blocked.add(c));
      lastTime = performance.now();
      dropAccum = 0;
      if (document.activeElement) document.activeElement.blur();
    }
  }

  function items() {
    const view = controlsView.classList.contains('hidden') ? mainView : controlsView;
    return [...view.querySelectorAll('button')];
  }

  document.addEventListener('keydown', e => {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const wasPressed = pressed.has(e.code);
    pressed.add(e.code);

    if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat && !gameOver) {
        if (open && !controlsView.classList.contains('hidden') && e.code === 'Escape') showView(false);
        else togglePause();
      }
      return;
    }

    if (open) {
      e.stopImmediatePropagation();
      if (e.repeat) return;
      const list = items();
      const idx = list.indexOf(document.activeElement);
      if (e.code === 'ArrowDown') { e.preventDefault(); list[(idx + 1) % list.length].focus(); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); list[(idx - 1 + list.length) % list.length].focus(); }
      else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        if (document.activeElement && document.activeElement.closest('#pm-level-row'))
          changeLevel(e.code === 'ArrowLeft' ? -1 : 1);
      }
      return;
    }

    if (blocked.has(e.code)) {
      if (e.repeat || wasPressed) { e.stopImmediatePropagation(); return; }
      blocked.delete(e.code);
    }
  }, true);

  document.addEventListener('keyup', e => {
    pressed.delete(e.code);
    blocked.delete(e.code);
  }, true);

  window.addEventListener('blur', () => { pressed.clear(); blocked.clear(); });

  btn('pm-resume').addEventListener('click', () => { if (paused) togglePause(); });
  btn('pm-restart').addEventListener('click', () => init());
  btn('pm-controls').addEventListener('click', () => showView(true));
  btn('pm-back').addEventListener('click', () => showView(false));
  btn('pm-level-dec').addEventListener('click', () => changeLevel(-1));
  btn('pm-level-inc').addEventListener('click', () => changeLevel(1));

  return { setOpen };
})();
