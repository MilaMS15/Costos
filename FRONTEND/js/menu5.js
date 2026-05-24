// FRONTEND/js/menu5.js

let evolucionChart, puestosChart;

const formatMoney = (amount) => {
    const val = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
};

async function cargarDashboardCompleto() {
    mostrarLoading();
    
    try {
        const [resumen, productividad, puestos, evolucion] = await Promise.all([
            fetch(`${API_URL}/rh/resumen`).then(r => r.json()),
            fetch(`${API_URL}/rh/productividad`).then(r => r.json()),
            fetch(`${API_URL}/rh/analisis-puestos`).then(r => r.json()),
            fetch(`${API_URL}/rh/evolucion-planilla`).then(r => r.json())
        ]);
        
        if (resumen.success) renderKPIs(resumen.data);
        if (productividad.success) renderProductividad(productividad.data);
        if (puestos.success) renderPuestos(puestos.data);
        if (evolucion.success) renderEvolucion(evolucion.data);
        
        renderAlertas(resumen.data, productividad.data);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar datos de RRHH');
    }
}

function renderKPIs(data) {
    const container = document.getElementById('kpisContainer');
    
    const kpis = [
        {
            titulo: 'Total Trabajadores',
            valor: data.total_trabajadores,
            unidad: 'personas',
            icono: 'groups',
            color: 'blue'
        },
        {
            titulo: 'Costo Total Planilla',
            valor: formatMoney(data.total_planilla),
            unidad: 'mensual',
            icono: 'payments',
            color: 'green'
        },
        {
            titulo: 'Productividad Promedio',
            valor: `${data.productividad_promedio}%`,
            unidad: 'eficiencia',
            icono: 'speed',
            color: 'yellow'
        },
        {
            titulo: 'Costo x Hora Efectiva',
            valor: formatMoney(data.costo_hora_promedio),
            unidad: 'por hora',
            icono: 'schedule',
            color: 'purple'
        }
    ];
    
    container.innerHTML = kpis.map(kpi => `
        <div class="glass-card p-6 shadow-md hover:shadow-xl transition-all">
            <div class="flex items-center justify-between mb-3">
                <div class="bg-${kpi.color}-100 p-2 rounded-xl">
                    <span class="material-symbols-outlined text-${kpi.color}-600">${kpi.icono}</span>
                </div>
                <span class="text-xs text-gray-400">${kpi.unidad}</span>
            </div>
            <p class="text-2xl font-bold text-gray-800">${kpi.valor}</p>
            <p class="text-sm text-gray-500 mt-1">${kpi.titulo}</p>
        </div>
    `).join('');
}

function renderProductividad(trabajadores) {
    const tbody = document.getElementById('productividadTable');
    
    if (!trabajadores || trabajadores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No hay datos de productividad</td></tr>';
        return;
    }
    
    tbody.innerHTML = trabajadores.map(t => {
        let bgClass = '';
        let badgeClass = '';
        
        if (t.productividad >= 90) {
            bgClass = 'bg-green-500';
            badgeClass = 'bg-green-100 text-green-700';
        } else if (t.productividad >= 75) {
            bgClass = 'bg-blue-500';
            badgeClass = 'bg-blue-100 text-blue-700';
        } else if (t.productividad >= 60) {
            bgClass = 'bg-yellow-500';
            badgeClass = 'bg-yellow-100 text-yellow-700';
        } else {
            bgClass = 'bg-red-500';
            badgeClass = 'bg-red-100 text-red-700';
        }
        
        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3">
                    <div>
                        <p class="font-medium text-gray-800">${t.nombre}</p>
                        <p class="text-xs text-gray-400">Código: ${t.codigo}</p>
                    </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${t.puesto}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center gap-2">
                        <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="${bgClass} h-2 rounded-full" style="width: ${t.productividad}%"></div>
                        </div>
                        <span class="text-sm font-semibold">${t.productividad}%</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-right font-mono">${formatMoney(t.costo_hora_efectiva)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 text-xs rounded-full ${badgeClass}">${t.nivel}</span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPuestos(puestos) {
    const tbody = document.getElementById('puestosTable');
    
    if (!puestos || puestos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">No hay datos de puestos</td></tr>';
        return;
    }
    
    tbody.innerHTML = puestos.map(p => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-3 py-2 text-sm font-medium text-gray-800">${p.puesto}</td>
            <td class="px-3 py-2 text-center text-sm text-gray-600">${p.cantidad}</td>
            <td class="px-3 py-2 text-right text-sm font-mono font-semibold text-gray-800">${formatMoney(p.costo_total)}</td>
            <td class="px-3 py-2 text-right text-sm font-mono text-gray-600">${formatMoney(p.sueldo_promedio)}</td>
        </tr>
    `).join('');
    
    // Gráfico de puestos
    const ctx = document.getElementById('puestosChart').getContext('2d');
    if (puestosChart) puestosChart.destroy();
    
    puestosChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: puestos.map(p => p.puesto),
            datasets: [{
                data: puestos.map(p => p.costo_total),
                backgroundColor: ['#FF9F1C', '#2A9D8F', '#E9C46A', '#E76F51', '#264653', '#8ECAE6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatMoney(value)}`;
                        }
                    }
                }
            }
        }
    });
}

function renderEvolucion(data) {
    const ctx = document.getElementById('evolucionChart').getContext('2d');
    if (evolucionChart) evolucionChart.destroy();
    
    evolucionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.meses,
            datasets: [
                {
                    label: 'Costo Planilla (S/)',
                    data: data.sueldos,
                    borderColor: '#FF9F1C',
                    backgroundColor: 'rgba(255, 159, 28, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Productividad (%)',
                    data: data.productividad,
                    borderColor: '#2A9D8F',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            let value = context.raw;
                            if (context.dataset.yAxisID === 'y') {
                                return `${label}: ${formatMoney(value)}`;
                            }
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Costo Planilla (S/)' },
                    ticks: { callback: (val) => formatMoney(val) }
                },
                y1: {
                    position: 'right',
                    title: { display: true, text: 'Productividad (%)' },
                    min: 0,
                    max: 100,
                    ticks: { callback: (val) => `${val}%` }
                }
            }
        }
    });
}

function renderAlertas(resumen, productividad) {
    const container = document.getElementById('alertasRHContainer');
    const alertas = [];
    
    // Alerta 1: Baja productividad general
    if (resumen.productividad_promedio < 70) {
        alertas.push({
            tipo: 'critical',
            titulo: '⚠️ Productividad General Baja',
            mensaje: `Productividad promedio del equipo: ${resumen.productividad_promedio}%`,
            accion: 'Implementar programa de capacitación y evaluación de procesos'
        });
    } else if (resumen.productividad_promedio < 85) {
        alertas.push({
            tipo: 'warning',
            titulo: '📊 Productividad Mejorable',
            mensaje: `Productividad promedio: ${resumen.productividad_promedio}% - Por debajo del objetivo (85%)`,
            accion: 'Revisar cargas de trabajo y eficiencia de procesos'
        });
    }
    
    // Alerta 2: Trabajadores con productividad crítica
    if (productividad) {
        const criticos = productividad.filter(p => p.productividad < 60);
        if (criticos.length > 0) {
            alertas.push({
                tipo: 'critical',
                titulo: '🚨 Trabajadores con Bajo Rendimiento',
                mensaje: `${criticos.length} trabajador(es) tienen productividad <60%`,
                accion: `Revisar a: ${criticos.map(c => c.nombre.split(' ')[0]).join(', ')}`
            });
        }
    }
    
    // Alerta 3: Alto costo por hora
    if (resumen.costo_hora_promedio > 50) {
        alertas.push({
            tipo: 'warning',
            titulo: '💰 Costo por Hora Elevado',
            mensaje: `Costo promedio por hora efectiva: ${formatMoney(resumen.costo_hora_promedio)}`,
            accion: 'Evaluar eficiencia y optimización de tiempos'
        });
    }
    
    // Alerta 4: Sin trabajadores
    if (resumen.total_trabajadores === 0) {
        alertas.push({
            tipo: 'info',
            titulo: '📝 Base de Datos sin Trabajadores',
            mensaje: 'No hay trabajadores registrados en el sistema',
            accion: 'Registrar personal en la sección de Trabajadores'
        });
    }
    
    if (alertas.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 rounded-xl p-4 text-center">
                <span class="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                <p class="text-green-700 mt-2">No hay alertas activas</p>
                <p class="text-xs text-green-600 mt-1">El equipo está funcionando dentro de parámetros</p>
            </div>
        `;
        return;
    }
    
    const colores = {
        critical: { bg: 'bg-red-50', border: 'border-red-500', icon: 'error', color: 'text-red-600' },
        warning: { bg: 'bg-yellow-50', border: 'border-yellow-500', icon: 'warning', color: 'text-yellow-600' },
        info: { bg: 'bg-blue-50', border: 'border-blue-500', icon: 'info', color: 'text-blue-600' }
    };
    
    container.innerHTML = alertas.map(alerta => {
        const estilo = colores[alerta.tipo] || colores.info;
        return `
            <div class="${estilo.bg} border-l-4 ${estilo.border} p-4 rounded-xl mb-3">
                <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined ${estilo.color}">${estilo.icon}</span>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800">${alerta.titulo}</p>
                        <p class="text-sm text-gray-600 mt-1">${alerta.mensaje}</p>
                        <p class="text-xs text-gray-500 mt-2">🔧 ${alerta.accion}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function exportarReporteCompleto() {
    alert('📊 Generando reporte ejecutivo de RRHH...\n\nSe descargará un archivo con:\n- KPIs de gestión\n- Ranking de productividad\n- Análisis por puesto\n- Evolución de costos');
    // Aquí se puede implementar exportación a Excel/PDF
}

function mostrarLoading() {
    const container = document.getElementById('kpisContainer');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p class="mt-4 text-gray-500">Cargando dashboard de RRHH...</p>
            </div>
        `;
    }
}

function mostrarError(mensaje) {
    console.error(mensaje);
    const container = document.getElementById('kpisContainer');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                <p class="text-red-700 mt-2">Error al cargar datos</p>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Reintentar</button>
            </div>
        `;
    }
}

// Auto-refresh cada 60 segundos
let intervalo;
function iniciarAutoRefresh() {
    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(() => {
        console.log('🔄 Auto-refresh RRHH');
        cargarDashboardCompleto();
    }, 60000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDashboardCompleto();
    iniciarAutoRefresh();
});