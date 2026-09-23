/* modules/dashboard.js — PurísimoCafe
   KPIs del día: ventas, ingresos, costos, ganancia neta.
   Últimas ventas con cajero y ganancia.
   Espacio reservado para iframe de Power BI.
*/
if (!initPage('Dashboard')) throw new Error('No auth');

const session = Auth.getSession();
document.getElementById('dash-user').textContent = session.usuario || 'Usuario';
document.getElementById('dash-date').textContent = new Date().toLocaleDateString('es-NI', {
  weekday:'long', year:'numeric', month:'long', day:'numeric'
});

async function loadDashboard() {
  try {
    const [prods, ventas] = await Promise.all([
      ProductoService.getAll(),
      VentaService.getAll()
    ]);

    // KPIs base
    const productosActivos = prods.filter(p => (p.estado ?? p.Estado) === true).length;
    document.getElementById('ds-productos').textContent = productosActivos;
    document.getElementById('ds-ventas').textContent    = ventas.length;

    // KPIs de hoy
    const hoy       = new Date().toLocaleDateString('es-NI');
    const ventasHoy = ventas.filter(v => {
      const fecha = v.fechaVenta ?? v.FechaVenta;
      return fecha && new Date(fecha).toLocaleDateString('es-NI') === hoy;
    });

    const ingresosHoy  = ventasHoy.reduce((s,v) => s + +(v.total ?? v.Total ?? 0), 0);
    const costosHoy    = ventasHoy.reduce((s,v) => s + +(v.costoTotal ?? v.CostoTotal ?? 0), 0);
    const gananciaHoy  = ingresosHoy - costosHoy;
    const margenHoy    = ingresosHoy > 0 ? Math.round((gananciaHoy / ingresosHoy) * 100) : 0;

    document.getElementById('ds-ingresos-hoy').textContent  = fmt(ingresosHoy);
    document.getElementById('ds-costos-hoy').textContent    = fmt(costosHoy);
    document.getElementById('ds-ganancia-hoy').textContent  = fmt(gananciaHoy);
    document.getElementById('ds-margen-hoy').textContent    = margenHoy + '%';
    document.getElementById('ds-ventas-hoy').textContent    = ventasHoy.length;

    // Color de ganancia
    const ganEl = document.getElementById('ds-ganancia-hoy');
    ganEl.style.color = gananciaHoy >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    
  } catch (e) { toast('Error al cargar el dashboard', 'error'); }
}

loadDashboard();
