if (!initPage('Movimientos de Inventario', { adminOnly: true })) throw new Error('No auth / No admin');

  const STORAGE_KEY    = 'pc_movimientos';
  let movimientosLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let allInventario    = [];

  async function loadData() {
    try {
      allInventario = await InventarioService.getAll();
      fillProductoSelect();
      renderMovimientos();
    } catch (e) {
      toast('Error al cargar datos', 'error');
    }
  }

  function fillProductoSelect() {
    const sel = document.getElementById('mov-producto');
    sel.innerHTML = '<option value="">Selecciona un producto...</option>'
      + allInventario.map(i =>
          `<option value="${i.productoID}">${i.nombreProducto} (Stock: ${i.stockActual})</option>`
        ).join('');
  }

  function renderMovimientos() {
    const tbody = document.getElementById('movimientos-table');
    if (!movimientosLocal.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data"><i class="fas fa-inbox"></i>No hay movimientos registrados</td></tr>';
      return;
    }
    tbody.innerHTML = [...movimientosLocal].reverse().map(m => `
      <tr>
        <td><strong>#${m.id}</strong></td>
        <td>${m.nombreProducto || m.productoID}</td>
        <td><span class="badge badge-warning">−${m.cantidad}</span></td>
        <td style="font-size:.83rem;">${m.motivo}</td>
        <td><small>${fmtDate(m.fecha)}</small></td>
      </tr>
    `).join('');
  }

  document.getElementById('btn-nuevo-movimiento').addEventListener('click', () => {
    document.getElementById('mov-cantidad').value    = '';
    document.getElementById('mov-motivo').value      = '';
    document.getElementById('mov-motivo-tipo').value = '';
    document.getElementById('mov-producto').value    = '';
    openModal('modal-movimiento');
  });

  document.getElementById('btn-save-movimiento').addEventListener('click', async () => {
    const productoID  = +document.getElementById('mov-producto').value;
    const cantidad    = +document.getElementById('mov-cantidad').value;
    const tipoMotivo  = document.getElementById('mov-motivo-tipo').value;
    const detMotivo   = document.getElementById('mov-motivo').value.trim();
    const motivo      = tipoMotivo
      ? (detMotivo ? `${tipoMotivo}: ${detMotivo}` : tipoMotivo)
      : detMotivo;

    if (!productoID || cantidad < 1 || !motivo) {
      toast('Completa todos los campos requeridos', 'error');
      return;
    }
    try {
      await MovimientoService.create({ productoID, cantidad, motivo, fecha: new Date().toISOString() });
      const inv = allInventario.find(i => i.productoID === productoID);
      movimientosLocal.push({
        id:             movimientosLocal.length + 1,
        productoID,
        cantidad,
        motivo,
        nombreProducto: inv ? inv.nombreProducto : 'Producto',
        fecha:          new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movimientosLocal));
      closeModal('modal-movimiento');
      await loadData();
      renderMovimientos();
      toast('Salida de inventario registrada', 'success');
    } catch (e) {
      toast('Error: ' + e.message, 'error');
    }
  });

  loadData();