'use strict';

const Records = (() => {
  const KEY = 'tetris.records';
  const MAX = 5;
  const NAME_MAX = 12;

  const defaults = () => ({ top: [], bestCombo: 0, maxLines: 0 });
  const num = v => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const d = JSON.parse(raw);
      if (!d || typeof d !== 'object' || !Array.isArray(d.top)) return defaults();
      const top = d.top
        .filter(e => e && typeof e === 'object' && Number.isFinite(e.score))
        .map(e => ({
          name: String(e.name ?? '').slice(0, NAME_MAX) || 'Anónimo',
          score: num(e.score), lines: num(e.lines), level: num(e.level),
          date: typeof e.date === 'string' ? e.date : '',
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX);
      return { top, bestCombo: num(d.bestCombo), maxLines: num(d.maxLines) };
    } catch (_) {
      return defaults();
    }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { /* sin almacenamiento */ }
  }

  // Posición (0-based) que ocuparía la puntuación en el top, o -1 si no entra.
  function rankFor(data, score) {
    if (score <= 0) return -1;
    let i = data.top.findIndex(e => score > e.score);
    if (i === -1) i = data.top.length;
    return i < MAX ? i : -1;
  }

  const $ = id => document.getElementById(id);

  function renderTable(listEl, data, hlIndex, preview) {
    listEl.textContent = '';
    const rows = data.top.map(e => ({ name: e.name, score: e.score }));
    if (preview) rows.splice(hlIndex, 0, { name: '(tú)', score: preview.score });
    const shown = rows.slice(0, MAX);
    if (!shown.length) {
      const li = document.createElement('li');
      li.className = 'rec-empty';
      li.textContent = 'Sin records todavía';
      listEl.appendChild(li);
      return;
    }
    shown.forEach((r, i) => {
      const li = document.createElement('li');
      if (i === hlIndex) li.className = 'rec-hl';
      const pos = document.createElement('span'); pos.className = 'rec-pos'; pos.textContent = `${i + 1}.`;
      const name = document.createElement('span'); name.className = 'rec-name'; name.textContent = r.name;
      const sc = document.createElement('span'); sc.className = 'rec-score'; sc.textContent = r.score.toLocaleString();
      li.append(pos, name, sc);
      listEl.appendChild(li);
    });
  }

  function renderStats(el, data) {
    el.textContent = `Mejor combo: ${data.bestCombo} · Líneas máx: ${data.maxLines}`;
  }

  function showStart() {
    const data = load();
    renderTable($('start-list'), data, -1);
    renderStats($('start-stats'), data);
    $('start-screen').classList.remove('hidden');
  }

  function hideGameOver() { $('go-records').classList.add('hidden'); }

  function onGameOver(stats) {
    const data = load();
    data.bestCombo = Math.max(data.bestCombo, num(stats.combo));
    data.maxLines = Math.max(data.maxLines, num(stats.lines));
    const rank = rankFor(data, stats.score);
    save(data);

    const form = $('name-form'), input = $('name-input');
    $('go-records').classList.remove('hidden');
    renderStats($('go-stats'), data);
    if (rank === -1) {
      form.classList.add('hidden');
      renderTable($('go-list'), data, -1);
      return;
    }
    renderTable($('go-list'), data, rank, stats);
    form.classList.remove('hidden');
    input.value = '';
    setTimeout(() => input.focus(), 400);
    form.onsubmit = ev => {
      ev.preventDefault();
      const fresh = load();
      const entry = {
        name: input.value.trim().slice(0, NAME_MAX) || 'Anónimo',
        score: stats.score, lines: stats.lines, level: stats.level,
        date: new Date().toISOString(),
      };
      const idx = rankFor(fresh, entry.score);
      if (idx !== -1) {
        fresh.top.splice(idx, 0, entry);
        fresh.top = fresh.top.slice(0, MAX);
        save(fresh);
      }
      form.classList.add('hidden');
      renderTable($('go-list'), fresh, idx);
    };
  }

  function reset() {
    if (!confirm('¿Borrar todos los records?')) return;
    try { localStorage.removeItem(KEY); } catch (_) { /* nada */ }
    const data = defaults();
    renderTable($('start-list'), data, -1);
    renderStats($('start-stats'), data);
    renderTable($('go-list'), data, -1);
    renderStats($('go-stats'), data);
    $('name-form').classList.add('hidden');
  }

  $('play-btn').addEventListener('click', () => {
    $('start-screen').classList.add('hidden');
    init();
  });
  $('reset-start-btn').addEventListener('click', reset);
  $('reset-go-btn').addEventListener('click', reset);
  showStart();

  return { onGameOver, hideGameOver };
})();
