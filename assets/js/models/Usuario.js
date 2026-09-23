/* models/Usuario.js — Modelo de Usuario */

class Usuario {
  constructor({ usuarioID = 0, nombre = '', correo = '', rolID = 2 } = {}) {
    this.usuarioID = usuarioID;
    this.nombre    = nombre;
    this.correo    = correo;
    this.rolID     = rolID;
  }

  static fromAPI(data) { return new Usuario(data); }

  get rolNombre() {
    return this.rolID === 1 ? 'Administrador' : 'Cajero';
  }

  toAPI() {
    return {
      usuarioID: this.usuarioID,
      Nombre:    this.nombre,
      Correo:    this.correo,
      RolID:     this.rolID
    };
  }
}
