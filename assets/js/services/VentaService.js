/* services/VentaService.js — Servicio de Ventas */

const VentaService = {
  getAll:    ()     => API.get('/api/Venta'),
  getById:   (id)   => API.get(`/api/Venta/${id}`),
  registrar: (data) => API.post('/api/Venta/Registrar', data),
};
