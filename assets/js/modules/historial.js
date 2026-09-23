/* modules/historial.js — PurísimoCafe
   Muestra NombreProducto real desde BD, cajero, costo y ganancia por venta.
   Ganancia = ingresos internos (solo visible para el personal).
*/
if (!initPage('Historial de Ventas')) throw new Error('No auth');

let allVentas = [];

async function loadVentas() {
  try {
    const raw = await VentaService.getAll();
    allVentas = raw.map(v => ({
      ventaID:    v.ventaID    ?? v.VentaID    ?? 0,
      fechaVenta: v.fechaVenta ?? v.FechaVenta ?? null,
      total:      +(v.total      ?? v.Total      ?? 0),
      cajero:     v.cajero     ?? v.Cajero     ?? '—',
      costoTotal: +(v.costoTotal ?? v.CostoTotal ?? 0),
    }));
    renderVentas();
  } catch (e) { toast('Error al cargar ventas: ' + e.message, 'error'); }
}

function renderVentas(filter = '') {
  const tbody = document.getElementById('historial-table');
  const q     = (filter || '').toLowerCase();
  const list  = allVentas.filter(v =>
    v.cajero.toLowerCase().includes(q) || String(v.ventaID).includes(q)
  );
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data"><i class="fas fa-receipt"></i> Sin ventas registradas</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(v => {
    const ganancia = v.total - v.costoTotal;
    const margen   = v.total > 0 ? Math.round((ganancia / v.total) * 100) : 0;
    return `
    <tr>
      <td><strong>#${v.ventaID}</strong></td>
      <td>${fmtDate(v.fechaVenta)}</td>
      <td>${v.cajero}</td>
      <td><strong>${fmt(v.total)}</strong></td>
      <td>${fmt(v.costoTotal)}</td>
      <td>
        <span style="color:${ganancia>=0?'var(--color-success)':'var(--color-danger)'};font-weight:700;">
          ${fmt(ganancia)} <small style="font-weight:400;">(${margen}%)</small>
        </span>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm btn-icon" onclick="verDetalle(${v.ventaID})" title="Ver detalle">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

async function verDetalle(id) {
  try {
    const venta    = await VentaService.getById(id);
    const detalles = (venta.detalles ?? venta.Detalles ?? []).map(d => ({
      nombre:          d.nombre          ?? d.Nombre          ?? d.nombreProducto ?? d.NombreProducto ?? `#${d.productoID??d.ProductoID}`,
      cantidad:        d.cantidad        ?? d.Cantidad        ?? 0,
      precioUnitario:  d.precioUnitario  ?? d.PrecioUnitario  ?? 0,
      subTotal:        d.subtotal        ?? d.Subtotal        ?? d.subTotal ?? d.SubTotal ?? 0,
      costoProduccion: d.costoProduccion ?? d.CostoProduccion ?? 0,
    }));
    const total      = +(venta.total      ?? venta.Total      ?? 0);
    const costoTotal = +(venta.costoTotal ?? venta.CostoTotal ?? 0);
    const ganancia   = total - costoTotal;
    const cajero     =   venta.cajero     ?? venta.Cajero     ?? '—';

    document.getElementById('modal-detalle-title').textContent = `Detalle Venta #${id}`;
    document.getElementById('detalle-cajero').textContent  = cajero;
    document.getElementById('detalle-fecha').textContent   = fmtDate(venta.fechaVenta ?? venta.FechaVenta);
    document.getElementById('detalle-total').textContent   = fmt(total);
    document.getElementById('detalle-costo').textContent   = fmt(costoTotal);
    const ganEl = document.getElementById('detalle-ganancia');
    ganEl.textContent = fmt(ganancia);
    ganEl.style.color = ganancia >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

    document.getElementById('detalle-items').innerHTML = detalles.length
      ? detalles.map(d => {
          const ganItem = (d.precioUnitario - d.costoProduccion) * d.cantidad;
          return `<tr>
            <td>${d.nombre}</td>
            <td style="text-align:center;">${d.cantidad}</td>
            <td style="text-align:right;">${fmt(d.precioUnitario)}</td>
            <td style="text-align:right;font-weight:700;">${fmt(d.subTotal)}</td>
            <td style="text-align:right;color:${ganItem>=0?'var(--color-success)':'var(--color-danger)'};">${fmt(ganItem)}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="5" class="no-data">Sin detalles</td></tr>';

    openModal('modal-detalle');
  } catch (e) { toast('Error al cargar detalle: ' + e.message, 'error'); }
}

document.getElementById('search-hist')?.addEventListener('input', e => renderVentas(e.target.value));
loadVentas();
