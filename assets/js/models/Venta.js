/* models/Venta.js — Modelos de Venta */

class DetalleVenta {
  constructor({ productoID = 0, nombre = '', precioUnitario = 0, cantidad = 1, subtotal = 0 } = {}) {
    this.productoID     = productoID;
    this.nombre         = nombre;
    this.precioUnitario = precioUnitario;
    this.cantidad       = cantidad;
    this.subtotal       = subtotal || precioUnitario * cantidad;
  }
}

class Venta {
  constructor({ ventaID = 0, fecha = null, total = 0, cajero = '', detalles = [], mesaID = null } = {}) {
    this.ventaID  = ventaID;
    this.fecha    = fecha;
    this.total    = total;
    this.cajero   = cajero;
    this.detalles = detalles.map(d => d instanceof DetalleVenta ? d : new DetalleVenta(d));
    this.mesaID   = mesaID;
  }

  static fromAPI(data) { return new Venta(data); }

  get totalCalculado() {
    return this.detalles.reduce((s, d) => s + d.precioUnitario * d.cantidad, 0);
  }

  toAPI() {
    return {
      MesaID:   this.mesaID,
      Detalles: this.detalles.map(d => ({
        productoID:     d.productoID,
        nombre:         d.nombre,
        precioUnitario: d.precioUnitario,
        cantidad:       d.cantidad,
        subtotal:       d.precioUnitario * d.cantidad
      }))
    };
  }
}

class Mesa {
  constructor({ id = 0, numero = 0, disponible = true, nota = '', carrito = [], mesaLabel = '' } = {}) {
    this.id         = id;
    this.numero     = numero || id;
    this.disponible = disponible;
    this.nota       = nota;
    this.carrito    = carrito;
    this.mesaLabel  = mesaLabel || `Mesa ${id}`;
  }

  get total() {
    return this.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  }
}
