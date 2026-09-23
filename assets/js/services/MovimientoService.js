/* services/MovimientoService.js — Servicio de Movimientos de Inventario */

const MovimientoService = {
  create: (data) => API.post('/api/MovimientosInventario', data),
};
