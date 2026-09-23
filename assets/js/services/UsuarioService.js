function buildUsuarioPayload({ usuarioID = 0, Nombre, Correo, RolID }) {
  return {
    UsuarioID:  usuarioID,
    Nombre:     Nombre,
    Correo:     Correo,
    Contrasena: '',
    RolID:      RolID,
    Rol: { NombreRol: '' }
  };
}

const UsuarioService = {
  getAll: () => API.get('/api/Usuarios'),

  create: (data, pass) =>
    API.post(
      '/api/Usuarios?Contrase\u00f1a=' + encodeURIComponent(pass),
      buildUsuarioPayload(data)
    ),

  update: (id, data, pass) =>
    API.put(
      '/api/Usuarios/' + id + (pass ? '?Contrase\u00f1a=' + encodeURIComponent(pass) : ''),
      buildUsuarioPayload({ ...data, usuarioID: +id })
    ),

  delete: (id) => API.delete('/api/Usuarios/' + id),
};
