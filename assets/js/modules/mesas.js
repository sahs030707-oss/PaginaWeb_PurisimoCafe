/* ═══════════════════════════════════════
   mesas.js — Módulo de mesas
   PurísimoCafe Sistema de Gestión
═══════════════════════════════════════ */

const MesasModule = (() => {
  const STORAGE_KEY = 'pc_mesas';
  let mesas = [];

  /* ─── PERSISTENCIA ─── */
  function load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      mesas = JSON.parse(saved);
    } else {
      mesas = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        disponible: true,
        nota: ''
      }));
      save();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mesas));
  }

  /* ─── RENDER ─── */
  function render() {
    const grid    = document.getElementById('mesas-grid');
    const countEl = document.getElementById('mesas-count');
    if (!grid) return;

    const disponibles = mesas.filter(m => m.disponible).length;
    if (countEl) {
      countEl.textContent = `${disponibles} disponibles / ${mesas.length} en total`;
    }

    grid.innerHTML = mesas.map(m => `
      <div class="mesa-card ${m.disponible ? 'disponible' : 'ocupada'}"
           onclick="MesasModule.toggle(${m.id})">
        <div class="mesa-icon">${m.disponible ? '🟢' : '🔴'}</div>
        <div class="mesa-num">Mesa ${m.id}</div>
        <div class="mesa-status ${m.disponible ? 'ok' : 'busy'}">
          ${m.disponible ? 'Disponible' : 'Ocupada'}
        </div>
        ${m.nota ? `<div class="mesa-nota">${m.nota}</div>` : ''}
      </div>
    `).join('');
  }

  /* ─── ACCIONES ─── */
  function toggle(id) {
    const mesa = mesas.find(m => m.id === id);
    if (!mesa) return;
    mesa.disponible = !mesa.disponible;
    save();
    render();
  }

  function liberarTodas() {
    mesas.forEach(m => { m.disponible = true; m.nota = ''; });
    save();
    render();
    toast('Todas las mesas han sido liberadas', 'success');
  }

  function agregar() {
    const maxId = mesas.length ? Math.max(...mesas.map(m => m.id)) : 0;
    mesas.push({ id: maxId + 1, disponible: true, nota: '' });
    save();
    render();
    toast(`Mesa ${maxId + 1} agregada`, 'success');
  }

  function eliminarUltima() {
    if (mesas.length === 0) return;
    mesas.pop();
    save();
    render();
    toast('Mesa eliminada', 'info');
  }

  /* ─── INIT ─── */
  function init() {
    load();
    render();

    document.getElementById('btn-add-mesa')?.addEventListener('click', agregar);
    document.getElementById('btn-reset-mesas')?.addEventListener('click', liberarTodas);
    document.getElementById('btn-remove-mesa')?.addEventListener('click', eliminarUltima);
  }

  return { init, toggle, liberarTodas, agregar, render };
})();