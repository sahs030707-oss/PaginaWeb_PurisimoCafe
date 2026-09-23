/* modules/usuarios.js — Módulo de Usuarios
   PurísimoCafe Sistema de Gestión
   - Solo accesible para Administradores
   - Roles: Administrador (1) y Cajero (2)
   - La API devuelve camelCase en GET pero recibe PascalCase en POST/PUT
*/

if (!initPage('Usuarios', { adminOnly: true })) throw new Error('No auth / No admin');

let allUsuarios = [];

/* ─── CARGA ─── */
async function loadUsuarios() {
  try {
    const raw = await UsuarioService.getAll();
    // Normalizar: la API puede devolver camelCase o PascalCase según el serializer
    allUsuarios = raw.map(u => ({
      usuarioID: u.usuarioID ?? u.UsuarioID ?? 0,
      nombre:    u.nombre    ?? u.Nombre    ?? '',
      correo:    u.correo    ?? u.Correo    ?? '',
      rolID:     u.rolID     ?? u.RolID     ?? 2,
    }));
    renderUsuarios();
  } catch (e) {
    toast('Error al cargar usuarios', 'error');
  }
}

/* ─── RENDER ─── */
function renderUsuarios(filter = '') {
  const tbody = document.getElementById('usuarios-table');
  const q     = (filter || '').toLowerCase();
  const list  = allUsuarios.filter(u =>
    u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)
  );

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data"><i class="fas fa-users"></i> Sin usuarios registrados</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(u => `
    <tr>
      <td><strong>${u.nombre}</strong></td>
      <td>${u.correo}</td>
      <td><span class="badge badge-gold">${getRolNombre(u.rolID)}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editUsuario(${u.usuarioID})" title="Editar">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteUsuario(${u.usuarioID})" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/* ─── BÚSQUEDA ─── */
document.getElementById('search-usr').addEventListener('input', e => renderUsuarios(e.target.value));

/* ─── NUEVO ─── */
document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
  document.getElementById('modal-usr-title').textContent = 'Nuevo Usuario';
  document.getElementById('usr-id').value     = '';
  document.getElementById('usr-nombre').value = '';
  document.getElementById('usr-correo').value = '';
  document.getElementById('usr-pass').value   = '';
  document.getElementById('usr-rol').value    = '2';
  openModal('modal-usuario');
});

/* ─── EDITAR ─── */
function editUsuario(id) {
  const u = allUsuarios.find(x => x.usuarioID === id);
  if (!u) return;
  document.getElementById('modal-usr-title').textContent = 'Editar Usuario';
  document.getElementById('usr-id').value     = u.usuarioID;
  document.getElementById('usr-nombre').value = u.nombre;
  document.getElementById('usr-correo').value = u.correo;
  document.getElementById('usr-pass').value   = '';
  document.getElementById('usr-rol').value    = u.rolID;
  openModal('modal-usuario');
}

/* ─── GUARDAR ─── */
document.getElementById('btn-save-usuario').addEventListener('click', async () => {
  const id    = document.getElementById('usr-id').value;
  const Nombre = document.getElementById('usr-nombre').value.trim();
  const Correo = document.getElementById('usr-correo').value.trim();
  const pass   = document.getElementById('usr-pass').value;
  const RolID  = parseInt(document.getElementById('usr-rol').value, 10);

  if (!Nombre || !Correo) { toast('Nombre y correo son obligatorios', 'error'); return; }
  if (!id && !pass)        { toast('La contraseña es obligatoria para nuevos usuarios', 'error'); return; }

  const btn = document.getElementById('btn-save-usuario');
  btn.disabled = true;

  try {
    if (id) {
      await UsuarioService.update(id, { usuarioID: +id, Nombre, Correo, RolID }, pass || null);
    } else {
      await UsuarioService.create({ usuarioID: 0, Nombre, Correo, RolID }, pass);
    }
    closeModal('modal-usuario');
    await loadUsuarios();
    toast('Usuario guardado correctamente', 'success');
  } catch (e) {
    toast('Error al guardar: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

/* ─── ELIMINAR ─── */
async function deleteUsuario(id) {
  const u = allUsuarios.find(x => x.usuarioID === id);
  if (!confirm(`¿Eliminar al usuario "${u?.nombre || id}"? Esta acción no se puede deshacer.`)) return;
  try {
    await UsuarioService.delete(id);
    await loadUsuarios();
    toast('Usuario eliminado', 'success');
  } catch (e) {
    toast('Error al eliminar: ' + e.message, 'error');
  }
}

/* ─── INIT ─── */
loadUsuarios();
