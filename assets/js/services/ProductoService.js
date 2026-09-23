/* services/ProductoService.js — Servicio de Productos */

const ProductoService = {
  getAll:  ()         => API.get('/api/Producto'),
  create:  (data)     => API.post('/api/Producto', data),
  update:  (id, data) => API.put(`/api/Producto/${id}`, data),
  delete:  (id)       => API.delete(`/api/Producto/${id}`),
};
