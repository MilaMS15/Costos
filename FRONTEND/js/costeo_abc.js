/* =======================================================================
   costeo_abc.js — Módulo de Costeo ABC (Unik'a)
   Ubicar en: FRONTEND/js/costeo_abc.js
   Se usa desde: FRONTEND/costeo_abc.html
   ======================================================================= */

// 🔥 Usar API_URL de config.js correctamente
const API_BASE = (window.CONFIG && window.CONFIG.API_URL) || 
                 (typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5000/api');

console.log('🔍 costeo_abc.js cargado');
console.log('🔍 API_BASE:', API_BASE);

const PERIODO_DEFAULT = '2026-04';
let lastData = null;
let chartComp = null;
let chartAct = null;

const fmt = n => 'S/ ' + Number(n).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
const fmt0 = n => 'S/ ' + Math.round(n).toLocaleString('es-PE');

/* ===================== CARGA DE DATOS ===================== */
async function cargarCosteoABC(periodo = PERIODO_DEFAULT) {
    try {
        console.log('🔄 Cargando costeo ABC para:', periodo);
        console.log('📍 URL completa:', `${API_BASE}/abc/costeo?periodo=${periodo}`);
        
        const res = await fetch(`${API_BASE}/abc/costeo?periodo=${periodo}`);
        
        if (!res.ok) {
            console.error('❌ HTTP Error:', res.status, res.statusText);
            throw new Error(`Respuesta no válida: ${res.status}`);
        }
        
        lastData = await res.json();
        console.log('✅ Datos recibidos:', lastData);
        render(lastData);
        
        // Actualizar el período en el header
        const periodEl = document.querySelector('.period');
        if (periodEl) {
            const meses = {
                '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
                '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
                '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
            };
            const parts = periodo.split('-');
            const mesNombre = meses[parts[1]] || parts[1];
            periodEl.textContent = `📅 ${mesNombre} ${parts[0]}`;
        }
        
    } catch (err) {
        console.error('❌ Error al cargar Costeo ABC:', err);
        
        // Mostrar mensaje de error en la UI
        const cont = document.getElementById('execNarrative');
        if (cont) {
            cont.innerHTML = `⚠️ Error: ${err.message}. Verifica que el backend esté corriendo en ${API_BASE}`;
        }
        
        // 🔥 DATOS MOCK para prueba (se muestran si el backend falla)
        console.log('📊 Usando datos mock para prueba visual');
        const mockData = generarMockData();
        render(mockData);
    }
}

function generarMockData() {
    return {
        periodo: '2026-04',
        cif_total: 45678.90,
        actividades: [
            { codigoactividad: 'ACT-01', nombreactividad: 'Mantenimiento', driver: 'Horas máquina', costo: 12500, total_driver: 840, tasa: 14.88 },
            { codigoactividad: 'ACT-02', nombreactividad: 'Control de calidad', driver: 'Inspecciones', costo: 9800, total_driver: 320, tasa: 30.63 },
            { codigoactividad: 'ACT-03', nombreactividad: 'Logística interna', driver: 'Movimientos', costo: 11200, total_driver: 560, tasa: 20.00 },
            { codigoactividad: 'ACT-04', nombreactividad: 'Setup', driver: 'Cambios de lote', costo: 12178.90, total_driver: 240, tasa: 50.75 }
        ],
        productos: [
            { 
                codigoproducto: 21001, 
                producto: 'Polo Básico', 
                unidades: 1200, 
                ventas: 30600,
                cif_unitario_tradicional: 12.34, 
                cif_unitario_abc: 18.56,
                cif_total_abc: 22272, 
                cif_total_tradicional: 14808,
                diferencia_unitaria: 6.22, 
                porcentaje_distorsion: 50.4,
                detalle_actividades: [
                    { codigoactividad: 'ACT-01', actividad: 'Mantenimiento', driver: 'Horas máquina', cantidad_consumida: 280, tasa: 14.88, monto_asignado: 4166.40 },
                    { codigoactividad: 'ACT-02', actividad: 'Control de calidad', driver: 'Inspecciones', cantidad_consumida: 120, tasa: 30.63, monto_asignado: 3675.60 },
                    { codigoactividad: 'ACT-03', actividad: 'Logística interna', driver: 'Movimientos', cantidad_consumida: 180, tasa: 20.00, monto_asignado: 3600.00 },
                    { codigoactividad: 'ACT-04', actividad: 'Setup', driver: 'Cambios de lote', cantidad_consumida: 60, tasa: 50.75, monto_asignado: 3045.00 }
                ]
            },
            { 
                codigoproducto: 21002, 
                producto: 'Polo Estampado', 
                unidades: 800, 
                ventas: 22400,
                cif_unitario_tradicional: 14.56, 
                cif_unitario_abc: 10.23,
                cif_total_abc: 8184, 
                cif_total_tradicional: 11648,
                diferencia_unitaria: -4.33, 
                porcentaje_distorsion: -29.7,
                detalle_actividades: [
                    { codigoactividad: 'ACT-01', actividad: 'Mantenimiento', driver: 'Horas máquina', cantidad_consumida: 150, tasa: 14.88, monto_asignado: 2232.00 },
                    { codigoactividad: 'ACT-02', actividad: 'Control de calidad', driver: 'Inspecciones', cantidad_consumida: 80, tasa: 30.63, monto_asignado: 2450.40 },
                    { codigoactividad: 'ACT-03', actividad: 'Logística interna', driver: 'Movimientos', cantidad_consumida: 120, tasa: 20.00, monto_asignado: 2400.00 },
                    { codigoactividad: 'ACT-04', actividad: 'Setup', driver: 'Cambios de lote', cantidad_consumida: 40, tasa: 50.75, monto_asignado: 2030.00 }
                ]
            },
            { 
                codigoproducto: 21003, 
                producto: 'Camiseta M/C', 
                unidades: 950, 
                ventas: 17100,
                cif_unitario_tradicional: 9.87, 
                cif_unitario_abc: 7.45,
                cif_total_abc: 7077.50, 
                cif_total_tradicional: 9376.50,
                diferencia_unitaria: -2.42, 
                porcentaje_distorsion: -24.5,
                detalle_actividades: [
                    { codigoactividad: 'ACT-01', actividad: 'Mantenimiento', driver: 'Horas máquina', cantidad_consumida: 120, tasa: 14.88, monto_asignado: 1785.60 },
                    { codigoactividad: 'ACT-02', actividad: 'Control de calidad', driver: 'Inspecciones', cantidad_consumida: 40, tasa: 30.63, monto_asignado: 1225.20 },
                    { codigoactividad: 'ACT-03', actividad: 'Logística interna', driver: 'Movimientos', cantidad_consumida: 90, tasa: 20.00, monto_asignado: 1800.00 },
                    { codigoactividad: 'ACT-04', actividad: 'Setup', driver: 'Cambios de lote', cantidad_consumida: 30, tasa: 50.75, monto_asignado: 1522.50 }
                ]
            },
            { 
                codigoproducto: 21004, 
                producto: 'Chompa', 
                unidades: 400, 
                ventas: 22000,
                cif_unitario_tradicional: 28.90, 
                cif_unitario_abc: 34.20,
                cif_total_abc: 13680, 
                cif_total_tradicional: 11560,
                diferencia_unitaria: 5.30, 
                porcentaje_distorsion: 18.3,
                detalle_actividades: [
                    { codigoactividad: 'ACT-01', actividad: 'Mantenimiento', driver: 'Horas máquina', cantidad_consumida: 180, tasa: 14.88, monto_asignado: 2678.40 },
                    { codigoactividad: 'ACT-02', actividad: 'Control de calidad', driver: 'Inspecciones', cantidad_consumida: 60, tasa: 30.63, monto_asignado: 1837.80 },
                    { codigoactividad: 'ACT-03', actividad: 'Logística interna', driver: 'Movimientos', cantidad_consumida: 120, tasa: 20.00, monto_asignado: 2400.00 },
                    { codigoactividad: 'ACT-04', actividad: 'Setup', driver: 'Cambios de lote', cantidad_consumida: 80, tasa: 50.75, monto_asignado: 4060.00 }
                ]
            },
            { 
                codigoproducto: 21005, 
                producto: 'Canguro', 
                unidades: 320, 
                ventas: 15360,
                cif_unitario_tradicional: 30.45, 
                cif_unitario_abc: 26.80,
                cif_total_abc: 8576, 
                cif_total_tradicional: 9744,
                diferencia_unitaria: -3.65, 
                porcentaje_distorsion: -12.0,
                detalle_actividades: [
                    { codigoactividad: 'ACT-01', actividad: 'Mantenimiento', driver: 'Horas máquina', cantidad_consumida: 110, tasa: 14.88, monto_asignado: 1636.80 },
                    { codigoactividad: 'ACT-02', actividad: 'Control de calidad', driver: 'Inspecciones', cantidad_consumida: 20, tasa: 30.63, monto_asignado: 612.60 },
                    { codigoactividad: 'ACT-03', actividad: 'Logística interna', driver: 'Movimientos', cantidad_consumida: 50, tasa: 20.00, monto_asignado: 1000.00 },
                    { codigoactividad: 'ACT-04', actividad: 'Setup', driver: 'Cambios de lote', cantidad_consumida: 30, tasa: 50.75, monto_asignado: 1522.50 }
                ]
            }
        ]
    };
}

/* ===================== RENDER PRINCIPAL ===================== */
function render(data) {
    if (!data || !data.productos || !data.actividades) {
        console.error('❌ Datos inválidos para renderizar:', data);
        return;
    }
    
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
    setText('kpiWorst', peor ? peor.producto : '—');
    setText('kpiWorstSub', peor && peor.porcentaje_distorsion > 0
        ? `Subcosteado ${peor.porcentaje_distorsion.toFixed(0)}% bajo su costo real`
        : 'Sin riesgo relevante');
    setText('kpiBest', mejor ? mejor.producto : '—');
    setText('kpiBestSub', mejor && mejor.porcentaje_distorsion < 0
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
    if (!subcosteados.length && !sobrecosteados.length) {
        narrative += `Los costos están bien asignados actualmente. La diferencia promedio es de ${(productos.reduce((s, p) => s + Math.abs(p.porcentaje_distorsion), 0) / productos.length).toFixed(1)}%.`;
    }
    setHTML('execNarrative', narrative);
    
    setHTML('execFindings', `
        <div class="finding"><div class="f-val">${fmt0(cif_total)}</div><div class="f-lbl">CIF total del periodo distribuido entre ${productos.length} líneas de producto</div></div>
        <div class="finding"><div class="f-val">${fmt0(misallocated)}</div><div class="f-lbl">Costo indirecto mal asignado por el método tradicional</div></div>
        <div class="finding"><div class="f-val">${peor ? peor.producto : '—'}</div><div class="f-lbl">${peor && peor.porcentaje_distorsion > 0 ? 'Mayor riesgo de venderse por debajo de su costo real' : 'Sin productos subcosteados significativos'}</div></div>
    `);
    
    // Tabla ejecutiva
    setHTML('tblEjecutiva', productos.map(p => {
        const subido = p.porcentaje_distorsion > 8;
        const bajado = p.porcentaje_distorsion < -8;
        const pillClass = subido ? 'red' : (bajado ? 'green' : 'blue');
        const estado = subido ? 'Subcosteado' : (bajado ? 'Sobrecosteado' : 'Equilibrado');
        const barColor = subido ? '#dc2626' : (bajado ? '#16a34a' : '#94a3b8');
        const barWidth = Math.min(Math.abs(p.porcentaje_distorsion), 100);
        return `<tr>
            <td><b>${p.producto}</b><div class="bar-mini"><i style="width:${barWidth}%;background:${barColor}"></i></div></td>
            <td>${fmt(p.cif_unitario_tradicional)}</td>
            <td>${fmt(p.cif_unitario_abc)}</td>
            <td><span class="pill ${pillClass}">${p.porcentaje_distorsion >= 0 ? '+' : ''}${p.porcentaje_distorsion.toFixed(0)}%</span></td>
            <td>${estado}</td>
        </tr>`;
    }).join(''));
    
    // Plan de acción
    const acciones = [];
    productos.filter(p => p.porcentaje_distorsion > 8).sort((a, b) => b.porcentaje_distorsion - a.porcentaje_distorsion).slice(0, 3).forEach(p => {
        const precioRef = p.ventas / p.unidades;
        const sugerido = precioRef + p.diferencia_unitaria;
        acciones.push({ 
            prio: 'high', 
            t: `Revisar precio de ${p.producto}`, 
            n: `Su costo real es ${fmt(p.diferencia_unitaria)} mayor al asignado hoy. Precio de referencia actual: ${fmt(precioRef)} — para mantener el mismo margen, el precio mínimo recomendado es ${fmt(sugerido)}.` 
        });
    });
    productos.filter(p => p.porcentaje_distorsion < -8).sort((a, b) => a.porcentaje_distorsion - b.porcentaje_distorsion).slice(0, 2).forEach(p => {
        acciones.push({ 
            prio: 'low', 
            t: `${p.producto} tiene margen oculto`, 
            n: `Está absorbiendo ${fmt(Math.abs(p.diferencia_unitaria))} más de CIF por unidad de lo que realmente consume. Su rentabilidad real es mejor de lo reportado.` 
        });
    });
    const actividadTop = [...actividades].sort((a, b) => b.costo - a.costo)[0];
    if (actividadTop) {
        acciones.push({ 
            prio: 'med', 
            t: `Foco de eficiencia: ${actividadTop.nombreactividad}`, 
            n: `Es la actividad de mayor costo indirecto (${fmt0(actividadTop.costo)}). Reducir su consumo (driver: ${actividadTop.driver}) impacta el costo de todos los productos en proporción a su uso de esta actividad.` 
        });
    }
    if (acciones.length === 0) {
        acciones.push({ 
            prio: 'low', 
            t: 'Sin acciones urgentes', 
            n: 'Los costos están bien asignados actualmente. Monitorea periódicamente para detectar cambios.' 
        });
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

function setText(id, val) { 
    const el = document.getElementById(id); 
    if (el) el.textContent = val; 
}

function setHTML(id, val) { 
    const el = document.getElementById(id); 
    if (el) el.innerHTML = val; 
}

/* ===================== PANEL DE SUPUESTOS (editable) ===================== */
function renderActividadesTable(actividades) {
    const tbody = document.getElementById('tblActividades');
    if (!tbody) return;
    
    setHTML('tblActividades', actividades.map(a => `
        <tr>
            <td><b>${a.nombreactividad}</b></td>
            <td><span class="pill blue">${a.driver}</span></td>
            <td>${fmt(a.costo)}</td>
            <td>${(a.total_driver || 0).toLocaleString('es-PE')}</td>
            <td><span class="pill green">S/ ${(a.tasa || 0).toFixed(4)}</span></td>
        </tr>`).join(''));
    
    const totalEl = document.getElementById('totalActCost');
    if (totalEl) {
        const total = actividades.reduce((s, a) => s + (a.costo || 0), 0);
        totalEl.textContent = fmt(total);
    }
}

function renderMatrizTable(productos, actividades) {
    const tbl = document.getElementById('tblMatriz');
    if (!tbl) return;
    
    if (productos.length === 0 || actividades.length === 0) {
        tbl.innerHTML = '<tr><td colspan="5">No hay datos disponibles</td></tr>';
        return;
    }
    
    const head = '<thead><tr><th>Producto</th>' + actividades.map(a => `<th>${a.driver}</th>`).join('') + '<th>Unid. producidas</th></tr></thead>';
    
    const body = '<tbody>' + productos.map(p => {
        const cells = actividades.map(a => {
            const det = (p.detalle_actividades || []).find(d => d.codigoactividad === a.codigoactividad);
            const valor = det ? det.cantidad_consumida : 0;
            return `<td><input class="cell-input" type="number" step="0.01" value="${valor}" 
                data-act="${a.codigoactividad}" data-prod="${p.codigoproducto}" 
                onchange="onConsumoChange(event)" onblur="onConsumoChange(event)"></td>`;
        }).join('');
        return `<tr><td><b>${p.producto}</b> <span class="pill purple">${p.codigoproducto}</span></td>${cells}<td>${(p.unidades || 0).toLocaleString('es-PE')}</td></tr>`;
    }).join('') + '</tbody>';
    
    tbl.innerHTML = head + body;
}

async function onConsumoChange(e) {
    const codigoactividad = e.target.dataset.act;
    const codigoproducto = Number(e.target.dataset.prod);
    const cantidad = Number(e.target.value) || 0;
    
    if (!codigoactividad || !codigoproducto) return;
    
    console.log(`📝 Actualizando consumo: Act=${codigoactividad}, Prod=${codigoproducto}, Cant=${cantidad}`);
    
    try {
        const res = await fetch(`${API_BASE}/abc/consumo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                codigoactividad, 
                codigoproducto, 
                periodo: lastData ? lastData.periodo : PERIODO_DEFAULT, 
                cantidad 
            })
        });
        
        if (res.ok) {
            console.log('✅ Consumo actualizado correctamente');
            // Recargar datos para refrescar la vista
            await cargarCosteoABC(lastData ? lastData.periodo : PERIODO_DEFAULT);
        } else {
            console.error('❌ Error actualizando consumo:', await res.text());
        }
    } catch (err) {
        console.error('❌ Error en onConsumoChange:', err);
    }
}

/* ===================== GRÁFICOS ===================== */
function renderCharts(productos, actividades) {
    // Gráfico de comparación
    const ctx1 = document.getElementById('chartComparacion');
    if (ctx1) {
        if (chartComp) {
            chartComp.destroy();
            chartComp = null;
        }
        
        chartComp = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: productos.map(p => p.producto || ''),
                datasets: [
                    { 
                        label: 'CIF unit. Asignado hoy', 
                        data: productos.map(p => p.cif_unitario_tradicional || 0), 
                        backgroundColor: '#94a3b8', 
                        borderRadius: 5,
                        borderSkipped: false
                    },
                    { 
                        label: 'CIF unit. Real (ABC)', 
                        data: productos.map(p => p.cif_unitario_abc || 0), 
                        backgroundColor: '#f59e0b', 
                        borderRadius: 5,
                        borderSkipped: false
                    },
                ]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        labels: { font: { size: 11 } } 
                    } 
                },
                scales: { 
                    x: { 
                        ticks: { font: { size: 10 } } 
                    }, 
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            font: { size: 10 },
                            callback: function(value) {
                                return 'S/' + value.toFixed(0);
                            }
                        } 
                    } 
                }
            }
        });
    }
    
    // Gráfico de actividades
    const ctx2 = document.getElementById('chartActividades');
    if (ctx2) {
        if (chartAct) {
            chartAct.destroy();
            chartAct = null;
        }
        
        const colores = ['#f59e0b', '#2563eb', '#15803d', '#7c3aed', '#dc2626', '#ec4899', '#14b8a6'];
        
        chartAct = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: actividades.map(a => a.nombreactividad || ''),
                datasets: [{ 
                    data: actividades.map(a => a.costo || 0), 
                    backgroundColor: colores.slice(0, actividades.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        labels: { 
                            font: { size: 10 }, 
                            boxWidth: 10,
                            padding: 10
                        } 
                    } 
                },
                cutout: '55%'
            }
        });
    }
}

/* ===================== PANEL TOGGLE (UI) ===================== */
function setupTogglePanel() {
    const panel = document.getElementById('assumptionsPanel');
    const chev = document.getElementById('chev');
    if (!panel) return;
    
    const toggle = () => { 
        panel.classList.toggle('open'); 
        if (chev) chev.classList.toggle('open');
    };
    
    const toggleRow = document.getElementById('toggleRow');
    if (toggleRow) toggleRow.addEventListener('click', toggle);
    
    const btnToggle = document.getElementById('btnToggleAssumptions');
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            if (!panel.classList.contains('open')) toggle();
            setTimeout(() => {
                panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        });
    }
}

/* ===================== SELECTOR DE PERÍODO ===================== */
function setupPeriodSelector() {
    // Por ahora simple, pero se puede expandir para cambiar el período
    // El período se define en la URL o en PERIODO_DEFAULT
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Costeo ABC...');
    
    setupTogglePanel();
    setupPeriodSelector();
    
    const genDate = document.getElementById('genDate');
    if (genDate) {
        genDate.textContent = new Date().toLocaleDateString('es-PE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Cargar datos
    cargarCosteoABC();
    
    console.log('✅ Costeo ABC inicializado correctamente');
});