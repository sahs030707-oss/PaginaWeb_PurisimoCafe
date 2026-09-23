/* models/Categoria.js — Modelo de Categoría */

class Categoria {
  constructor({ categoriaID = 0, nombre = '', descripcion = '', estado = true } = {}) {
    this.categoriaID = categoriaID;
    this.nombre      = nombre;
    this.descripcion = descripcion;
    this.estado      = estado;
  }

  static fromAPI(data) { return new Categoria(data); }

  toAPI() {
    return {
      categoriaID: this.categoriaID,
      nombre:      this.nombre,
      descripcion: this.descripcion,
      estado:      this.estado
    };
  }
}
