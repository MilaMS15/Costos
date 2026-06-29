/* =======================================================================
   costeo_abc.js — Módulo de Costeo ABC (Unik'a)
   Ubicar en: FRONTEND/js/costeo_abc.js
   Se usa desde: FRONTEND/costeo_abc.html
   ======================================================================= */

// Ajusta esta línea si tu config.js expone la URL base con otro nombre
// (revisa cómo lo hacen materiales.js o productos.js para mantener el patrón).
const API_BASE = (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:5000';

const PERIODO_DEFAULT = '2026-04';
let lastData = null;
let chartComp = null;
let chartAct = null;

const fmt  = n => 'S/ ' + Number(n).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
const fmt0 = n => 'S/ ' + Math.round(n).toLocaleString('es-PE');

/* ===================== CARGA DE DATOS ===================== */
async function cargarCosteoABC(periodo = PERIODO_DEFAULT) {
  try {
    const res = await fetch(`${API_BASE}/api/abc/costeo?periodo=${periodo}`);
    if (!res.ok) throw new Error('Respuesta no válida del backend');
    lastData = await res.json();
    render(lastData);
  } catch (err) {
    console.error('Error al cargar Costeo ABC:', err);
    const cont = document.getElementById('execNarrative');
    if (cont) cont.innerHTML = '⚠ No se pudo conectar con el backend (/api/abc/costeo). Verifica que costeo_abc_backend.py esté registrado en app.py y que el servidor Flask esté corriendo.';
  }
}

/* ===================== RENDER PRINCIPAL ===================== */
function render(data) {
  const { cif_total, productos, actividades } = data;

  const ordenado = [...productos].sort((a, b) => a.porcentaje_distorsion - b.porcentaje_distorsion);
  const mejor = ordenado[0];
  const peor = ordenado[ordenado.length - 1];

  const misallocated = productos
    .filter(p => p.diferencia_unitaria > 0)
    .reduce((s, p) => s + (p.cif_total_abc - p.cif_total_tradicional), 0);

  // KPIs
  setText('kpiTotalCIF', fmt0(cif_total));
  setText('kpiMisallocated', fmt0(misallocated));
  setText('kpiWorst', peor.producto);
  setText('kpiWorstSub', peor.porcentaje_distorsion > 0
    ? `Subcosteado ${peor.porcentaje_distorsion.toFixed(0)}% bajo su costo real`
    : 'Sin riesgo relevante');
  setText('kpiBest', mejor.producto);
  setText('kpiBestSub', mejor.porcentaje_distorsion < 0
    ? `Sobrecosteado ${Math.abs(mejor.porcentaje_distorsion).toFixed(0)}% — mejor margen del que parece`
    : 'Costo bien asignado hoy');

  // Resumen ejecutivo
  const subcosteados = productos.filter(p => p.porcentaje_distorsion > 15).sort((a, b) => b.porcentaje_distorsion - a.porcentaje_distorsion);
  const sobrecosteados = productos.filter(p => p.porcentaje_distorsion < -15).sort((a, b) => a.porcentaje_distorsion - b.porcentaje_distorsion);

  let narrative = `Del CIF total de ${fmt0(cif_total)} gestionado en el periodo ${data.periodo}, el método de asignación actual (por participación en ventas) está moviendo ${fmt0(misallocated)} hacia productos que en realidad consumen menos recursos de planta. `;
  if (subcosteados.length) {
    narrative += `Esto deja a <b>${subcosteados.map(p => p.producto).join(', ')}</b> con un costo real hasta ${subcosteados[0].porcentaje_distorsion.toFixed(0)}% mayor al que hoy se le asigna, inflando artificialmente su margen reportado. `;
  }
  if (sobrecosteados.length) {
    narrative += `En el extremo opuesto, <b>${sobrecosteados.map(p => p.producto).join(', ')}</b> absorbe costos indirectos que no le corresponden, reduciendo su rentabilidad aparente.`;
  }
  setHTML('execNarrative', narrative);

  setHTML('execFindings', `
    <div class="finding"><div class="f-val">${fmt0(cif_total)}</div><div class="f-lbl">CIF total del periodo distribuido entre ${productos.length} líneas de producto</div></div>
    <div class="finding"><div class="f-val">${fmt0(misallocated)}</div><div class="f-lbl">Costo indirecto mal asignado por el método tradicional</div></div>
    <div class="finding"><div class="f-val">${peor.producto}</div><div class="f-lbl">Mayor riesgo de venderse por debajo de su costo real</div></div>
  `);

  // Tabla ejecutiva
  setHTML('tblEjecutiva', productos.map(p => {
    const subido = p.porcentaje_distorsion > 8;
    const bajado = p.porcentaje_distorsion < -8;
    const pillClass = subido ? 'red' : (bajado ? 'green' : 'blue');
    const estado = subido ? 'Subcosteado' : (bajado ? 'Sobrecosteado' : 'Equilibrado');
    const barColor = subido ? '#dc2626' : (bajado ? '#16a34a' : '#94a3b8');
    return `<tr>
      <td><b>${p.producto}</b><div class="bar-mini"><i style="width:${Math.min(Math.abs(p.porcentaje_distorsion), 100)}%;background:${barColor}"></i></div></td>
      <td>${fmt(p.cif_unitario_tradicional)}</td>
      <td>${fmt(p.cif_unitario_abc)}</td>
      <td><span class="pill ${pillClass}">${p.porcentaje_distorsion >= 0 ? '+' : ''}${p.porcentaje_distorsion.toFixed(0)}%</span></td>
      <td>${estado}</td>
    </tr>`;
  }).join(''));

  // Plan de acción
  const acciones = [];
  productos.filter(p => p.porcentaje_distorsion > 8).sort((a, b) => b.porcentaje_distorsion - a.porcentaje_distorsion).forEach(p => {
    const precioRef = p.ventas / p.unidades;
    const sugerido = precioRef + p.diferencia_unitaria;
    acciones.push({ prio: 'high', t: `Revisar precio de ${p.producto}`, n: `Su costo real es ${fmt(p.diferencia_unitaria)} mayor al asignado hoy. Precio de referencia actual: ${fmt(precioRef)} — para mantener el mismo margen, el precio mínimo recomendado es ${fmt(sugerido)}.` });
  });
  productos.filter(p => p.porcentaje_distorsion < -8).sort((a, b) => a.porcentaje_distorsion - b.porcentaje_distorsion).forEach(p => {
    acciones.push({ prio: 'low', t: `${p.producto} tiene margen oculto`, n: `Está absorbiendo ${fmt(Math.abs(p.diferencia_unitaria))} más de CIF por unidad de lo que realmente consume. Su rentabilidad real es mejor de lo reportado.` });
  });
  const actividadTop = [...actividades].sort((a, b) => b.costo - a.costo)[0];
  if (actividadTop) {
    acciones.push({ prio: 'med', t: `Foco de eficiencia: ${actividadTop.nombreactividad}`, n: `Es la actividad de mayor costo indirecto (${fmt0(actividadTop.costo)}). Reducir su consumo (driver: ${actividadTop.driver}) impacta el costo de todos los productos en proporción a su uso de esta actividad.` });
  }
  setHTML('planAccion', acciones.map(a => `
    <div class="action">
      <div class="pr ${a.prio}">${a.prio === 'high' ? '!' : a.prio === 'med' ? '~' : '✓'}</div>
      <div><b>${a.t}</b><span class="note">${a.n}</span></div>
    </div>`).join(''));

  // Panel de supuestos (editable)
  renderActividadesTable(actividades);
  renderMatrizTable(productos, actividades);

  renderCharts(productos, actividades);
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setHTML(id, val) { const el = document.getElementById(id); if (el) el.innerHTML = val; }

/* ===================== PANEL DE SUPUESTOS (editable) ===================== */
function renderActividadesTable(actividades) {
  setHTML('tblActividades', actividades.map(a => `
    <tr>
      <td>${a.nombreactividad}</td>
      <td><span class="pill blue">${a.driver}</span></td>
      <td>${fmt(a.costo)}</td>
      <td>${a.total_driver.toLocaleString('es-PE')}</td>
      <td><span class="pill green">S/ ${a.tasa.toFixed(4)}</span></td>
    </tr>`).join(''));
  setText('totalActCost', fmt(actividades.reduce((s, a) => s + a.costo, 0)));
}

function renderMatrizTable(productos, actividades) {
  const tbl = document.getElementById('tblMatriz');
  if (!tbl) return;
  const head = '<thead><tr><th>Producto</th>' + actividades.map(a => `<th>${a.driver}</th>`).join('') + '<th>Unid. producidas</th></tr></thead>';
  const body = '<tbody>' + productos.map(p => {
    const cells = actividades.map(a => {
      const det = p.detalle_actividades.find(d => d.codigoactividad === a.codigoactividad);
      const valor = det ? det.cantidad_consumida : 0;
      return `<td><input class="cell-input" type="number" step="0.01" value="${valor}"
        data-act="${a.codigoactividad}" data-prod="${p.codigoproducto}" onchange="onConsumoChange(event)"></td>`;
    }).join('');
    return `<tr><td><b>${p.producto}</b> <span class="pill purple">${p.codigoproducto}</span></td>${cells}<td>${p.unidades.toLocaleString('es-PE')}</td></tr>`;
  }).join('') + '</tbody>';
  tbl.innerHTML = head + body;
}

async function onConsumoChange(e) {
  const codigoactividad = e.target.dataset.act;
  const codigoproducto = Number(e.target.dataset.prod);
  const cantidad = Number(e.target.value) || 0;
  await fetch(`${API_BASE}/api/abc/consumo`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigoactividad, codigoproducto, periodo: lastData.periodo, cantidad })
  });
  cargarCosteoABC(lastData.periodo);
}

/* ===================== GRÁFICOS ===================== */
function renderCharts(productos, actividades) {
  const ctx1 = document.getElementById('chartComparacion');
  if (ctx1) {
    if (chartComp) chartComp.destroy();
    chartComp = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: productos.map(p => p.producto),
        datasets: [
          { label: 'CIF unit. Asignado hoy', data: productos.map(p => p.cif_unitario_tradicional), backgroundColor: '#94a3b8', borderRadius: 5 },
          { label: 'CIF unit. Real (ABC)', data: productos.map(p => p.cif_unitario_abc), backgroundColor: '#f59e0b', borderRadius: 5 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { font: { size: 10 } } } }
      }
    });
  }

  const ctx2 = document.getElementById('chartActividades');
  if (ctx2) {
    if (chartAct) chartAct.destroy();
    chartAct = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: actividades.map(a => a.nombreactividad),
        datasets: [{ data: actividades.map(a => a.costo), backgroundColor: ['#f59e0b', '#2563eb', '#15803d', '#7c3aed'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10 } } } }
    });
  }
}

/* ===================== PANEL TOGGLE (UI) ===================== */
function setupTogglePanel() {
  const panel = document.getElementById('assumptionsPanel');
  const chev = document.getElementById('chev');
  if (!panel) return;
  const toggle = () => { panel.classList.toggle('open'); chev.classList.toggle('open'); };
  document.getElementById('toggleRow')?.addEventListener('click', toggle);
  document.getElementById('btnToggleAssumptions')?.addEventListener('click', () => {
    if (!panel.classList.contains('open')) toggle();
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', () => {
  setupTogglePanel();
  const genDate = document.getElementById('genDate');
  if (genDate) genDate.textContent = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  cargarCosteoABC();
});
