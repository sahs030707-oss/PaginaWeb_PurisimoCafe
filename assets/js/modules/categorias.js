if (!initPage('Categorías')) throw new Error('No auth');

  let allCategorias = [];

  async function loadCategorias() {
    try {
      allCategorias = await CategoriaService.getAll();
      renderCategorias();
    } catch (e) {
      toast('Error al cargar categorías', 'error');
    }
  }

  function renderCategorias(filter = '') {
    const tbody = document.getElementById('categorias-table');
    const list  = allCategorias.filter(c =>
      c.nombre.toLowerCase().includes(filter.toLowerCase())
    );
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data"><i class="fas fa-tags"></i>Sin categorías registradas</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(c => `
      <tr>
        <td>${c.categoriaID}</td>
        <td><strong>${c.nombre}</strong></td>
        <td style="font-size:.85rem;color:var(--cafe-warm);">${c.descripcion || '—'}</td>
        <td><span class="badge ${c.estado ? 'badge-active' : 'badge-inactive'}">${c.estado ? 'Activa' : 'Inactiva'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm btn-icon" onclick="editCategoria(${c.categoriaID})" title="Editar">
            <i class="fas fa-pen"></i>
          </button>
          ${c.estado ? `
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteCategoria(${c.categoriaID})" title="Desactivar">
            <i class="fas fa-trash"></i>
          </button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('search-cat').addEventListener('input', e => renderCategorias(e.target.value));

  document.getElementById('btn-nueva-categoria').addEventListener('click', () => {
    document.getElementById('modal-cat-title').textContent = 'Nueva Categoría';
    document.getElementById('cat-id').value     = '';
    document.getElementById('cat-nombre').value = '';
    document.getElementById('cat-desc').value   = '';
    openModal('modal-categoria');
  });

  function editCategoria(id) {
    const c = allCategorias.find(x => x.categoriaID === id);
    if (!c) return;
    document.getElementById('modal-cat-title').textContent = 'Editar Categoría';
    document.getElementById('cat-id').value     = c.categoriaID;
    document.getElementById('cat-nombre').value = c.nombre;
    document.getElementById('cat-desc').value   = c.descripcion || '';
    openModal('modal-categoria');
  }

  document.getElementById('btn-save-categoria').addEventListener('click', async () => {
    const id          = document.getElementById('cat-id').value;
    const nombre      = document.getElementById('cat-nombre').value.trim();
    const descripcion = document.getElementById('cat-desc').value.trim();
    if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }
    try {
      if (id) {
        await CategoriaService.update(id, { categoriaID:+id, nombre, descripcion, estado:true });
      } else {
        await CategoriaService.create({ nombre, descripcion, estado:true });
      }
      closeModal('modal-categoria');
      await loadCategorias();
      toast('Categoría guardada correctamente', 'success');
    } catch (e) {
      toast('Error: ' + e.message, 'error');
    }
  });

  async function deleteCategoria(id) {
    if (!confirm('¿Desactivar esta categoría?')) return;
    try {
      await CategoriaService.delete(id);
      await loadCategorias();
      toast('Categoría desactivada', 'success');
    } catch (e) {
      toast('Error: ' + e.message, 'error');
    }
  }

  loadCategorias();