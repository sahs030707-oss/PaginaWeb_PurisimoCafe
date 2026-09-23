/* modules/productos.js — PurísimoCafe
   Sp_ObtenerProductos ahora devuelve activos e inactivos.
   Filtro Activos / Inactivos / Todos sin sessionStorage.
*/
if (!initPage('Productos')) throw new Error('No auth');

let allProductos  = [];
let allCategorias = [];
let filtroEstado  = 'activos';

function norm(p) {
  return {
    productoID:      p.productoID      ?? p.ProductoID      ?? 0,
    nombre:          p.nombre          ?? p.Nombre          ?? '',
    descripcion:     p.descripcion     ?? p.Descripcion     ?? '',
    categoriaID:     p.categoriaID     ?? p.CategoriaID     ?? 0,
    costoProduccion: p.costoProduccion ?? p.CostoProduccion ?? 0,
    precioUnitario:  p.precioUnitario  ?? p.PrecioUnitario  ?? 0,
    estado:          p.estado          ?? p.Estado          ?? true,
  };
}

async function loadData() {
  try {
    const [prods, cats] = await Promise.all([ProductoService.getAll(), CategoriaService.getAll()]);
    allProductos  = prods.map(norm);
    allCategorias = cats;
    renderProductos();
    fillCatSelect();
  } catch (e) { toast('Error al cargar datos: ' + e.message, 'error'); }
}

function getCatNombre(id) {
  const c = allCategorias.find(x => (x.categoriaID ?? x.CategoriaID) === id);
  return c ? (c.nombre ?? c.Nombre ?? '—') : '—';
}

function fillCatSelect() {
  const sel  = document.getElementById('prod-categoria');
  const opts = allCategorias
    .filter(c => c.estado ?? c.Estado ?? true)
    .map(c => `<option value="${c.categoriaID ?? c.CategoriaID}">${c.nombre ?? c.Nombre}</option>`)
    .join('');
  sel.innerHTML = '<option value="">Selecciona...</option>' + opts;
}

function renderProductos(filter = '') {
  const tbody = document.getElementById('productos-table');
  const q     = (filter || '').toLowerCase();
  let list    = allProductos.filter(p => p.nombre.toLowerCase().includes(q));
  if (filtroEstado === 'activos')   list = list.filter(p =>  p.estado);
  if (filtroEstado === 'inactivos') list = list.filter(p => !p.estado);

  if (!list.length) {
    const msgs = { activos:'Sin productos activos', inactivos:'Sin productos inactivos', todos:'Sin productos' };
    tbody.innerHTML = `<tr><td colspan="7" class="no-data"><i class="fas fa-mug-hot"></i> ${msgs[filtroEstado]}</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(p => {
    const margen = p.precioUnitario > 0
      ? Math.round(((p.precioUnitario - p.costoProduccion) / p.precioUnitario) * 100) : 0;
    return `
    <tr class="${p.estado ? '' : 'row-inactive'}">
      <td><strong>${p.nombre}</strong>${p.descripcion ? `<small>${p.descripcion}</small>` : ''}</td>
      <td>${getCatNombre(p.categoriaID)}</td>
      <td>${fmt(p.costoProduccion)}</td>
      <td><strong>${fmt(p.precioUnitario)}</strong></td>
      <td><span class="margen-badge"><i class="fas fa-chart-line"></i> ${margen}%</span></td>
      <td><span class="badge ${p.estado ? 'badge-active' : 'badge-inactive'}">${p.estado ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editProducto(${p.productoID})" title="Editar"><i class="fas fa-pen"></i></button>
        ${p.estado
          ? `<button class="btn btn-danger btn-sm btn-icon" onclick="desactivarProducto(${p.productoID})" title="Desactivar"><i class="fas fa-ban"></i></button>`
          : `<button class="btn btn-success btn-sm btn-icon" onclick="reactivarProducto(${p.productoID})" title="Reactivar"><i class="fas fa-rotate-left"></i></button>`}
      </td>
    </tr>`;
  }).join('');
}

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filtroEstado = tab.dataset.estado;
    renderProductos(document.getElementById('search-prod').value);
  });
});
document.getElementById('search-prod').addEventListener('input', e => renderProductos(e.target.value));

document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
  document.getElementById('modal-prod-title').textContent = 'Nuevo Producto';
  ['prod-id','prod-nombre','prod-desc','prod-costo','prod-precio'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('prod-categoria').value = '';
  openModal('modal-producto');
});

function editProducto(id) {
  const p = allProductos.find(x => x.productoID === id);
  if (!p) return;
  document.getElementById('modal-prod-title').textContent = 'Editar Producto';
  document.getElementById('prod-id').value        = p.productoID;
  document.getElementById('prod-nombre').value    = p.nombre;
  document.getElementById('prod-desc').value      = p.descripcion || '';
  document.getElementById('prod-costo').value     = p.costoProduccion;
  document.getElementById('prod-precio').value    = p.precioUnitario;
  document.getElementById('prod-categoria').value = p.categoriaID;
  openModal('modal-producto');
}

document.getElementById('btn-save-producto').addEventListener('click', async () => {
  const id              = document.getElementById('prod-id').value;
  const Nombre          = document.getElementById('prod-nombre').value.trim();
  const Descripcion     = document.getElementById('prod-desc').value.trim();
  const CategoriaID     = +document.getElementById('prod-categoria').value;
  const CostoProduccion = +document.getElementById('prod-costo').value;
  const PrecioUnitario  = +document.getElementById('prod-precio').value;
  if (!Nombre || !CategoriaID || !PrecioUnitario) { toast('Completa los campos obligatorios', 'error'); return; }
  if (CostoProduccion > PrecioUnitario) toast('Advertencia: el costo supera el precio de venta', 'warning');
  const btn = document.getElementById('btn-save-producto');
  btn.disabled = true;
  try {
    const p = id ? allProductos.find(x => x.productoID === +id) : null;
    const payload = { ProductoID: +id||0, Nombre, Descripcion, CategoriaID, CostoProduccion, PrecioUnitario, Estado: p?.estado ?? true };
    id ? await ProductoService.update(id, payload) : await ProductoService.create(payload);
    closeModal('modal-producto');
    await loadData();
    toast('Producto guardado', 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  finally { btn.disabled = false; }
});

async function desactivarProducto(id) {
  const p = allProductos.find(x => x.productoID === id);
  if (!p || !confirm(`¿Desactivar "${p.nombre}"?\nSeguirá en inventario mientras tenga stock.`)) return;
  try {
    await ProductoService.update(id, { ProductoID:id, Nombre:p.nombre, Descripcion:p.descripcion,
      CategoriaID:p.categoriaID, CostoProduccion:p.costoProduccion, PrecioUnitario:p.precioUnitario, Estado:false });
    await loadData();
    toast(`"${p.nombre}" desactivado`, 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

async function reactivarProducto(id) {
  const p = allProductos.find(x => x.productoID === id);
  if (!p || !confirm(`¿Reactivar "${p.nombre}"?`)) return;
  try {
    await ProductoService.update(id, { ProductoID:id, Nombre:p.nombre, Descripcion:p.descripcion,
      CategoriaID:p.categoriaID, CostoProduccion:p.costoProduccion, PrecioUnitario:p.precioUnitario, Estado:true });
    await loadData();
    toast(`"${p.nombre}" reactivado`, 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

loadData();
