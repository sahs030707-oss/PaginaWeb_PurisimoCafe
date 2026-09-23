/* models/Inventario.js — Modelo de Inventario */

class InventarioItem {
  constructor({ productoID = 0, nombreProducto = '', categoria = '',
                precioUnitario = 0, stockActual = 0, estado = true, fecha = null } = {}) {
    this.productoID      = productoID;
    this.nombreProducto  = nombreProducto;
    this.categoria       = categoria;
    this.precioUnitario  = precioUnitario;
    this.stockActual     = stockActual;
    this.estado          = estado;
    this.fecha           = fecha;
  }

  static fromAPI(data) { return new InventarioItem(data); }

  get stockLevel() {
    if (this.stockActual <= 0) return 'empty';
    if (this.stockActual <= 5) return 'critical';
    if (this.stockActual <= 15) return 'low';
    return 'ok';
  }
}
