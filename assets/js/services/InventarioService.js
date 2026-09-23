/* services/InventarioService.js — Servicio de Inventario */

const InventarioService = {
  getAll:        ()                 => API.get('/api/Inventario'),
  aumentarStock: (productoId, cant) => API.post(`/api/Inventario/AumentarStock?productoId=${productoId}&cantidad=${cant}`),
};
