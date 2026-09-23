/* models/Producto.js — Modelo de Producto */

class Producto {
  constructor({ productoID = 0, nombre = '', descripcion = '', categoriaID = 0,
                costoProduccion = 0, precioUnitario = 0, estado = true } = {}) {
    this.productoID      = productoID;
    this.nombre          = nombre;
    this.descripcion     = descripcion;
    this.categoriaID     = categoriaID;
    this.costoProduccion = costoProduccion;
    this.precioUnitario  = precioUnitario;
    this.estado          = estado;
  }

  static fromAPI(data) { return new Producto(data); }

  toAPI() {
    return {
      productoID:      this.productoID,
      nombre:          this.nombre,
      descripcion:     this.descripcion,
      categoriaID:     this.categoriaID,
      costoProduccion: this.costoProduccion,
      precioUnitario:  this.precioUnitario,
      estado:          this.estado
    };
  }
}
