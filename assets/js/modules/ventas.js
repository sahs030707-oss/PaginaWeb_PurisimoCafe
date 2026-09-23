/* modules/ventas.js — PurísimoCafe
   - Envía Nombre en cada detalle (se guarda en BD)
   - Factura sin cálculo de ganancia (es documento para el cliente)
   - Multi-mesa simultánea
*/
if (!initPage('Nueva Venta')) throw new Error('No auth');

let allProductos  = [];
let allInventario = [];

const MESAS_KEY = 'pc_mesas_v2';
let mesas      = loadMesas();
let mesaActual = null;
let pedidos    = {};

function loadMesas() {
  try {
    const s = localStorage.getItem(MESAS_KEY);
    return s ? JSON.parse(s) : Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
  } catch { return Array.from({ length: 5 }, (_, i) => ({ id: i + 1 })); }
}
function saveMesas() { localStorage.setItem(MESAS_KEY, JSON.stringify(mesas)); }

function normProd(p) {
  return {
    productoID:      p.productoID      ?? p.ProductoID      ?? 0,
    nombre:          p.nombre          ?? p.Nombre          ?? '',
    precioUnitario:  p.precioUnitario  ?? p.PrecioUnitario  ?? 0,
    costoProduccion: p.costoProduccion ?? p.CostoProduccion ?? 0,
    estado:          p.estado          ?? p.Estado          ?? true,
  };
}
function normInv(i) {
  return {
    productoID:  i.productoID  ?? i.ProductoID  ?? 0,
    stockActual: i.stockActual ?? i.StockActual ?? 0,
  };
}

async function loadData() {
  try {
    const [prods, inv] = await Promise.all([
      ProductoService.getAll(),
      InventarioService.getAll()
    ]);
    allProductos  = prods.map(normProd).filter(p => p.estado);
    allInventario = inv.map(normInv);
    renderProductos();
  } catch (e) { toast('Error al cargar productos: ' + e.message, 'error'); }
}

/* ── TABS ── */
function renderMesaTabs() {
  const wrap = document.getElementById('mesa-tabs');
  if (!wrap) return;
  wrap.innerHTML = mesas.map(m => {
    const items  = pedidos[m.id]?.carrito?.length || 0;
    const active = m.id === mesaActual ? 'active' : '';
    const hasPed = items > 0 ? 'has-pedido' : '';
    return `<button class="mesa-tab ${active} ${hasPed}" onclick="selectMesa(${m.id})">
      <i class="fas fa-utensils"></i> Mesa ${m.id}
      ${items > 0 ? `<span class="tab-badge">${items}</span>` : ''}
    </button>`;
  }).join('')
  + `<button class="mesa-tab add-mesa" onclick="agregarMesa()" title="Abrir nueva mesa"><i class="fas fa-plus"></i></button>`;
}

function selectMesa(id) {
  mesaActual = id;
  if (!pedidos[id]) pedidos[id] = { carrito: [] };
  renderMesaTabs();
  renderCarrito();
  const lbl = document.getElementById('mesa-label');
  if (lbl) lbl.textContent = `Mesa ${id}`;
}

function agregarMesa() {
  const newId = mesas.length ? Math.max(...mesas.map(m => m.id)) + 1 : 1;
  mesas.push({ id: newId });
  saveMesas();
  pedidos[newId] = { carrito: [] };
  selectMesa(newId);
  toast(`Mesa ${newId} abierta`, 'success');
}

function getCarrito() {
  if (!mesaActual) return [];
  if (!pedidos[mesaActual]) pedidos[mesaActual] = { carrito: [] };
  return pedidos[mesaActual].carrito;
}

/* ── PRODUCTOS ── */
function renderProductos(filter = '') {
  const grid = document.getElementById('venta-productos');
  const q    = (filter || '').toLowerCase();
  const list = allProductos.filter(p => p.nombre.toLowerCase().includes(q));
  if (!list.length) {
    grid.innerHTML = '<p style="color:var(--cafe-warm);font-size:.85rem;padding:12px;">Sin productos disponibles</p>';
    return;
  }
  grid.innerHTML = list.map(p => {
    const inv   = allInventario.find(i => i.productoID === p.productoID);
    const stock = inv?.stockActual ?? 0;
    return `<div class="prod-card ${stock < 1 ? 'sin-stock' : ''}" onclick="addToCart(${p.productoID})">
      <div class="prod-card-icon">☕</div>
      <div class="prod-card-name">${p.nombre}</div>
      <div class="prod-card-price">${fmt(p.precioUnitario)}</div>
      <div class="prod-card-stock">Stock: ${stock}</div>
    </div>`;
  }).join('');
}

document.getElementById('venta-search').addEventListener('input', e => renderProductos(e.target.value));

/* ── CARRITO ── */
function addToCart(productoID) {
  if (!mesaActual) { toast('Selecciona una mesa primero', 'warning'); return; }
  const p     = allProductos.find(x => x.productoID === productoID);
  const inv   = allInventario.find(i => i.productoID === productoID);
  const stock = inv?.stockActual ?? 0;
  if (!p) return;
  const carrito  = getCarrito();
  const existing = carrito.find(x => x.productoID === productoID);
  if (existing) {
    if (existing.cantidad >= stock) { toast('Stock insuficiente', 'error'); return; }
    existing.cantidad++;
  } else {
    if (stock < 1) { toast('Sin stock disponible', 'error'); return; }
    carrito.push({ productoID, nombre: p.nombre, precio: p.precioUnitario, cantidad: 1 });
  }
  renderCarrito(); renderMesaTabs();
}

function changeQty(idx, delta) {
  const c = getCarrito();
  c[idx].cantidad += delta;
  if (c[idx].cantidad < 1) c.splice(idx, 1);
  renderCarrito(); renderMesaTabs();
}
function removeFromCart(idx) { getCarrito().splice(idx, 1); renderCarrito(); renderMesaTabs(); }

function renderCarrito() {
  const container = document.getElementById('carrito-items');
  const carrito   = getCarrito();
  if (!mesaActual) {
    container.innerHTML = '<p class="empty-cart"><i class="fas fa-utensils"></i><br>Selecciona una mesa para comenzar</p>';
    document.getElementById('cart-sub').textContent   = 'C$0.00';
    document.getElementById('cart-total').textContent = 'C$0.00';
    return;
  }
  if (!carrito.length) {
    container.innerHTML = '<p class="empty-cart">Agrega productos al pedido</p>';
    document.getElementById('cart-sub').textContent   = 'C$0.00';
    document.getElementById('cart-total').textContent = 'C$0.00';
    return;
  }
  container.innerHTML = carrito.map((item, i) => `
    <div class="carrito-item">
      <div class="carrito-item-info">
        <div class="carrito-item-name">${item.nombre}</div>
        <div class="carrito-item-price">${fmt(item.precio)} c/u</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
        <span class="qty-val">${item.cantidad}</span>
        <button class="qty-btn" onclick="changeQty(${i}, 1)">+</button>
      </div>
      <div class="item-subtotal">${fmt(item.precio * item.cantidad)}</div>
      <button class="btn-remove-item" onclick="removeFromCart(${i})"><i class="fas fa-xmark"></i></button>
    </div>`).join('');
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  document.getElementById('cart-sub').textContent   = fmt(total);
  document.getElementById('cart-total').textContent = fmt(total);
}

document.getElementById('btn-limpiar-carrito').addEventListener('click', () => {
  if (!mesaActual || !confirm('¿Limpiar el pedido de esta mesa?')) return;
  pedidos[mesaActual].carrito = [];
  renderCarrito(); renderMesaTabs();
});

/* ── REGISTRAR VENTA ── */
document.getElementById('btn-registrar-venta').addEventListener('click', async () => {
  if (!mesaActual) { toast('Selecciona una mesa', 'error'); return; }
  const carrito = getCarrito();
  if (!carrito.length) { toast('Agrega al menos un producto', 'error'); return; }
  const btn = document.getElementById('btn-registrar-venta');
  btn.innerHTML = '<span class="spinner"></span> Registrando...';
  btn.disabled  = true;
  try {
    const detalles = carrito.map(i => ({
      ProductoID:     i.productoID,
      Nombre:         i.nombre,         // ← se guarda en DetalleVenta.NombreProducto
      PrecioUnitario: i.precio,
      Cantidad:       i.cantidad,
      Subtotal:       i.precio * i.cantidad
    }));
    const res = await VentaService.registrar({ Detalles: detalles });
    const facturaData = {
      detalles:  carrito.map(i => ({ ...i, subtotal: i.precio * i.cantidad })),
      total:     carrito.reduce((s, i) => s + i.precio * i.cantidad, 0),
      fecha:     new Date(),
      mesaLabel: `Mesa ${mesaActual}`,
      ventaId:   res?.VentaID ?? res?.ventaID ?? ''
    };
    pedidos[mesaActual].carrito = [];
    renderCarrito(); renderMesaTabs();
    await loadData();
    mostrarFactura(facturaData);
    toast('Venta registrada correctamente', 'success');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Registrar Venta';
    btn.disabled  = false;
  }
});

/* ── FACTURA (solo info para el cliente, sin costos ni ganancias) ── */
let facturaActual = null;

function buildFacturaHTML(data) {
  const session = Auth.getSession();
  const rows = data.detalles.map(i => `
    <tr>
      <td style="padding:6px 0;">${i.nombre}</td>
      <td style="text-align:center;">${i.cantidad}</td>
      <td style="text-align:right;">${fmt(i.precio ?? i.precioUnitario)}</td>
      <td style="text-align:right;font-weight:700;">${fmt((i.precio ?? i.precioUnitario) * i.cantidad)}</td>
    </tr>`).join('');

  return `
    <div style="font-family:'DM Sans',sans-serif;color:#1a0f00;max-width:400px;margin:0 auto;">
      <div style="text-align:center;border-bottom:2px dashed #c8853a;padding-bottom:14px;margin-bottom:14px;">
        <div style="font-size:2rem;">☕</div>
        <div style="font-size:1.35rem;font-weight:700;color:#5c3317;">PurísimoCafe</div>
        <div style="font-size:.73rem;color:#a0622a;letter-spacing:.05em;">MASATEPE · COMPROBANTE DE VENTA</div>
        ${data.ventaId ? `<div style="font-size:.75rem;color:#7c4a1e;margin-top:3px;">#${data.ventaId}</div>` : ''}
      </div>
      <div style="font-size:.78rem;color:#7c4a1e;margin-bottom:12px;display:flex;flex-direction:column;gap:3px;">
        <div><strong>Fecha:</strong> ${fmtDate(data.fecha)}</div>
        <div><strong>Atendido por:</strong> ${session.usuario || '—'}</div>
        ${data.mesaLabel ? `<div><strong>Mesa:</strong> ${data.mesaLabel}</div>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
        <thead>
          <tr style="border-bottom:1px solid #e8b87a;">
            <th style="text-align:left;padding:5px 0;color:#5c3317;">Producto</th>
            <th style="text-align:center;color:#5c3317;">Cant.</th>
            <th style="text-align:right;color:#5c3317;">Precio</th>
            <th style="text-align:right;color:#5c3317;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="border-top:2px dashed #c8853a;margin-top:12px;padding-top:12px;">
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:800;color:#1a0f00;">
          <span>TOTAL</span><span>${fmt(data.total)}</span>
        </div>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:.74rem;color:#a0622a;">
        ¡Gracias por su preferencia! 🤎
      </div>
    </div>`;
}

function mostrarFactura(data) {
  facturaActual = data;
  document.getElementById('factura-body').innerHTML = buildFacturaHTML(data);
  openModal('modal-factura');
}

document.getElementById('btn-print-factura').addEventListener('click', () => {
  if (!facturaActual) return;
  const el = document.getElementById('factura-print');
  el.innerHTML = buildFacturaHTML(facturaActual);
  el.style.display = 'block';
  window.print();
  el.style.display = 'none';
});

/* ── INIT ── */
loadData().then(() => {
  renderMesaTabs();
  if (mesas.length) selectMesa(mesas[0].id);
});
