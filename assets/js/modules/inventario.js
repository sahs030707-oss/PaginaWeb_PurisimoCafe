/* modules/inventario.js — PurísimoCafe
   Sp_ObtenerInventario ahora devuelve campo Estado del producto
   e incluye inactivos con stock > 0. Sin sessionStorage.
*/
if (!initPage('Inventario', { adminOnly: true })) throw new Error('No auth / No admin');

let allInventario = [];
let allProductos  = [];

function normInv(i) {
  return {
    productoID:     i.productoID     ?? i.ProductoID     ?? 0,
    nombreProducto: i.nombreProducto ?? i.NombreProducto ?? '',
    categoria:      i.categoria      ?? i.Categoria      ?? '—',
    precioUnitario: i.precioUnitario ?? i.PrecioUnitario ?? 0,
    estado:         i.estado         ?? i.Estado         ?? true,
    stockActual:    i.stockActual    ?? i.StockActual    ?? 0,
    fecha:          i.fecha          ?? i.Fecha          ?? null,
  };
}
function normProd(p) {
  return {
    productoID:     p.productoID     ?? p.ProductoID     ?? 0,
    nombre:         p.nombre         ?? p.Nombre         ?? '',
    precioUnitario: p.precioUnitario ?? p.PrecioUnitario ?? 0,
    estado:         p.estado         ?? p.Estado         ?? true,
  };
}

async function loadInventario() {
  try {
    [allInventario, allProductos] = await Promise.all([
      InventarioService.getAll(), ProductoService.getAll()
    ]);
    renderInventario();
  } catch (e) { toast('Error al cargar inventario: ' + e.message, 'error'); }
}

function renderInventario(filter = '') {
  const tbody = document.getElementById('inventario-table');
  const q     = (filter || '').toLowerCase();
  const lista = allInventario.map(normInv).filter(i => i.nombreProducto.toLowerCase().includes(q));

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="fas fa-boxes-stacked"></i> Sin registros de inventario</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(i => {
    const stock = i.stockActual;
    const level = stock <= 0 ? 'empty' : stock <= 5 ? 'critical' : stock <= 15 ? 'low' : 'ok';
    const icons = {
      ok:       { icon:'fa-circle-check',         color:'var(--color-success)', label:'Suficiente' },
      low:      { icon:'fa-triangle-exclamation', color:'var(--color-warning)', label:'Bajo' },
      critical: { icon:'fa-circle-exclamation',   color:'var(--color-danger)',  label:'Crítico' },
      empty:    { icon:'fa-circle-xmark',         color:'#aaa',                 label:'Sin stock' }
    };
    const si = icons[level];
    return `
      <tr class="${i.estado ? '' : 'row-inactive'}">
        <td><strong>${i.nombreProducto}</strong></td>
        <td>${i.categoria}</td>
        <td>${fmt(i.precioUnitario)}</td>
        <td>
          <div class="stock-num-cell">
            <span class="stock-number" style="color:${si.color};">${stock}</span>
            <i class="fas ${si.icon} stock-level-icon" style="color:${si.color};" title="${si.label}"></i>
          </div>
        </td>
        <td><span class="badge ${i.estado ? 'badge-active' : 'badge-inactive'}">${i.estado ? 'Activo' : 'Inactivo'}</span></td>
        <td><small>${fmtDateOnly(i.fecha)}</small></td>
        <td>
          ${i.estado
            ? `<div class="quick-stock-ctrl">
                <button class="btn-qs minus"   onclick="qsMinus(${i.productoID})">−</button>
                <span   class="qs-val" id="qs-val-${i.productoID}">1</span>
                <button class="btn-qs plus"    onclick="qsPlus(${i.productoID})">+</button>
                <button class="btn-qs confirm" onclick="qsConfirm(${i.productoID},'${i.nombreProducto.replace(/'/g,"\\'")}')">
                  <i class="fas fa-check"></i>
                </button>
               </div>`
            : `<span style="font-size:.75rem;color:var(--cafe-warm);"><i class="fas fa-info-circle"></i> Desaparece al agotar stock</span>`
          }
        </td>
      </tr>`;
  }).join('');
}

/* ── QUICK STOCK ── */
function qsGetVal(id)      { return parseInt(document.getElementById(`qs-val-${id}`)?.textContent||'1',10); }
function qsSetVal(id, val) { const el=document.getElementById(`qs-val-${id}`); if(el) el.textContent=Math.max(1,val); }
function qsMinus(id)       { qsSetVal(id, qsGetVal(id)-1); }
function qsPlus(id)        { qsSetVal(id, qsGetVal(id)+1); }

async function qsConfirm(productoID, nombre) {
  const cantidad = qsGetVal(productoID);
  if (!confirm(`¿Agregar ${cantidad} unidad(es) al stock de "${nombre}"?`)) return;
  try {
    await InventarioService.aumentarStock(productoID, cantidad);
    await loadInventario();
    toast(`+${cantidad} unidades agregadas a "${nombre}"`, 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

/* ── MODAL AUMENTAR STOCK (con buscador) ── */
function setupStockSearch() {
  const input       = document.getElementById('stock-search-input');
  const suggestions = document.getElementById('stock-suggestions');
  const hiddenId    = document.getElementById('stock-producto-id');
  const selectedLbl = document.getElementById('stock-selected-label');
  if (!input) return;

  function getCandidatos() {
    const invNorm = allInventario.map(normInv);
    const invIds  = new Set(invNorm.map(i => i.productoID));
    return [
      ...invNorm.map(i => ({ id:i.productoID, nombre:i.nombreProducto, stock:i.stockActual })),
      ...allProductos.map(normProd).filter(p => p.estado && !invIds.has(p.productoID))
                     .map(p => ({ id:p.productoID, nombre:p.nombre, stock:0 }))
    ];
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    hiddenId.value = '';
    if (selectedLbl) selectedLbl.textContent = '';
    if (!q) { suggestions.innerHTML=''; suggestions.style.display='none'; return; }
    const matches = getCandidatos().filter(c => c.nombre.toLowerCase().includes(q)).slice(0,8);
    if (!matches.length) {
      suggestions.innerHTML='<div class="stock-suggestion-item no-match">Sin coincidencias</div>';
      suggestions.style.display='block'; return;
    }
    suggestions.innerHTML = matches.map(c =>
      `<div class="stock-suggestion-item" onclick="selectStockProducto(${c.id},'${c.nombre.replace(/'/g,"\\'")}',${c.stock})">
        <span class="ssi-name">${c.nombre}</span>
        <span class="ssi-stock">Stock: ${c.stock}</span>
       </div>`).join('');
    suggestions.style.display='block';
  });
  document.addEventListener('click', e => { if(!e.target.closest('#stock-search-wrap')) suggestions.style.display='none'; });
}

function selectStockProducto(id, nombre, stock) {
  document.getElementById('stock-producto-id').value  = id;
  document.getElementById('stock-search-input').value = nombre;
  const lbl = document.getElementById('stock-selected-label');
  if (lbl) lbl.textContent = `Stock actual: ${stock}`;
  document.getElementById('stock-suggestions').style.display = 'none';
}

document.getElementById('btn-aumentar-stock').addEventListener('click', () => {
  document.getElementById('stock-cantidad').value     = '';
  document.getElementById('stock-search-input').value = '';
  document.getElementById('stock-producto-id').value  = '';
  const lbl = document.getElementById('stock-selected-label');
  if (lbl) lbl.textContent = '';
  document.getElementById('stock-suggestions').style.display = 'none';
  openModal('modal-stock');
});

document.getElementById('btn-save-stock').addEventListener('click', async () => {
  const productoId = +document.getElementById('stock-producto-id').value;
  const cantidad   = +document.getElementById('stock-cantidad').value;
  if (!productoId) { toast('Selecciona un producto', 'error'); return; }
  if (cantidad < 1) { toast('Ingresa una cantidad válida', 'error'); return; }
  try {
    await InventarioService.aumentarStock(productoId, cantidad);
    closeModal('modal-stock');
    await loadInventario();
    toast('Stock actualizado correctamente', 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
});

document.getElementById('search-inv').addEventListener('input', e => renderInventario(e.target.value));
loadInventario().then(setupStockSearch);
