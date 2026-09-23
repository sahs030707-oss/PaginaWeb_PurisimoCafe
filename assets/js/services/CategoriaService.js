/* services/CategoriaService.js — Servicio de Categorías */

const CategoriaService = {
  getAll:  ()         => API.get('/api/Categoria'),
  create:  (data)     => API.post('/api/Categoria', data),
  update:  (id, data) => API.put(`/api/Categoria/${id}`, data),
  delete:  (id)       => API.delete(`/api/Categoria/${id}`),
};
