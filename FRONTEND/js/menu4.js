// FRONTEND/js/menu4.js

let costosChart, comparativaChart;

async function cargarDashboard() {
    const periodo = document.getElementById('periodoSelector').value;
    
    // Mostrar loading
    mostrarLoading();
    
    try {
        const response = await fetch(`${API_URL}/menu4/dashboard?periodo=${periodo}`);
        const result = await response.json();
        
        if (result.success) {
            renderKPIsPrincipales(result.data);
            renderEstructuraCostos(result.data);
            renderKPIsClave(result.data);
            renderTablaProductos(result.data);
            renderAlertas(result.data);
            renderRecomendaciones(result.data);
            renderComparativa(result.data);
        } else {
            mostrarError(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar el dashboard');
    }
}

function renderKPIsPrincipales(data) {
    const container = document.getElementById('kpisPrincipales');
    const resumen = data.resumen_general;
    
    const kpis = [
        {
            titulo: 'Ventas Totales',
            valor: `S/ ${resumen.ventas_totales.toLocaleString()}`,
            subtitulo: `${data.kpis_clave.variacion_ventas_mensual > 0 ? '+' : ''}${data.kpis_clave.variacion_ventas_mensual}% vs mes anterior`,
            icono: 'trending_up',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            titulo: 'Costo Producción',
            valor: `S/ ${resumen.costo_total_produccion.toLocaleString()}`,
            subtitulo: `${data.estructura_costos.materia_prima.porcentaje}% MP | ${data.estructura_costos.mano_obra_directa.porcentaje}% MOD`,
            icono: 'factory',
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            titulo: 'Utilidad Neta',
            valor: `S/ ${resumen.utilidad_neta.toLocaleString()}`,
            subtitulo: `${resumen.margen_neto_pct}% de margen neto`,
            icono: resumen.utilidad_neta > 0 ? 'check_circle' : 'warning',
            color: resumen.utilidad_neta > 0 ? 'text-green-600' : 'text-red-600',
            bg: resumen.utilidad_neta > 0 ? 'bg-green-50' : 'bg-red-50'
        },
        {
            titulo: 'Margen Bruto',
            valor: `${resumen.margen_bruto_pct}%`,
            subtitulo: `S/ ${resumen.utilidad_bruta.toLocaleString()} de utilidad bruta`,
            icono: 'percent',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        }
    ];
    
    container.innerHTML = kpis.map(kpi => `
        <div class="kpi-card bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
                <div class="${kpi.bg} p-3 rounded-xl">
                    <span class="material-symbols-outlined ${kpi.color}">${kpi.icono}</span>
                </div>
                <span class="text-2xl font-bold ${kpi.color}">${kpi.valor}</span>
            </div>
            <h3 class="font-semibold text-gray-800 mb-1">${kpi.titulo}</h3>
            <p class="text-sm text-gray-500">${kpi.subtitulo}</p>
        </div>
    `).join('');
}

function renderEstructuraCostos(data) {
    const ctx = document.getElementById('costosChart').getContext('2d');
    const estructura = data.estructura_costos;
    
    if (costosChart) costosChart.destroy();
    
    costosChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Materia Prima', 'Mano de Obra Directa', 'Costos Indirectos'],
            datasets: [{
                data: [estructura.materia_prima.porcentaje, 
                       estructura.mano_obra_directa.porcentaje, 
                       estructura.costos_indirectos.porcentaje],
                backgroundColor: ['#FF9F1C', '#2A9D8F', '#E9C46A'],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const monto = context.datasetIndex === 0 ? 
                                [estructura.materia_prima.monto, 
                                 estructura.mano_obra_directa.monto, 
                                 estructura.costos_indirectos.monto][context.dataIndex] : 0;
                            return `${label}: ${value}% (S/ ${monto.toLocaleString()})`;
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById('costosTotales').innerHTML = `
        <strong>Costo Total Producción: S/ ${data.resumen_general.costo_total_produccion.toLocaleString()}</strong>
    `;
}

function renderKPIsClave(data) {
    const kpis = data.kpis_clave;
    document.getElementById('puntoEquilibrio').innerHTML = `${Math.round(kpis.punto_equilibrio_unidades).toLocaleString()} unidades`;
    document.getElementById('margenContribucion').innerHTML = `${kpis.margen_contribucion}%`;
    document.getElementById('roi').innerHTML = `${kpis.roi_estimado}%`;
}

function renderTablaProductos(data) {
    const tbody = document.getElementById('tablaProductos');
    const productos = data.rentabilidad_productos.todos;
    
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No hay datos disponibles</td></tr>';
        return;
    }
    
    tbody.innerHTML = productos.map(p => `
        <tr class="hover:bg-gray-50 transition cursor-pointer" onclick="verDetalleProducto(${p.codigo})">
            <td class="px-6 py-4">
                <div>
                    <div class="font-medium text-gray-900">${p.nombre}</div>
                    <div class="text-sm text-gray-500">Código: ${p.codigo}</div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">S/ ${p.ventas.toLocaleString()}</td>
            <td class="px-6 py-4 text-sm text-gray-900">S/ ${p.costo_total.toLocaleString()}</td>
            <td class="px-6 py-4 text-sm ${p.utilidad > 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                S/ ${p.utilidad.toLocaleString()}
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold ${p.margen > 20 ? 'text-green-600' : p.margen > 10 ? 'text-yellow-600' : 'text-red-600'}">
                        ${p.margen}%
                    </span>
                    <div class="w-16 bg-gray-200 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full ${p.margen > 20 ? 'bg-green-600' : p.margen > 10 ? 'bg-yellow-600' : 'bg-red-600'}" 
                             style="width: ${Math.min(p.margen, 100)}%"></div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                ${p.margen > 20 ? 
                    '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✅ Rentable</span>' : 
                    p.margen > 10 ?
                    '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">⚠️ Regular</span>' :
                    '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">❌ Crítico</span>'
                }
            </td>
        </tr>
    `).join('');
}

function renderAlertas(data) {
    const container = document.getElementById('alertasContainer');
    const alertas = data.alertas;
    const alertasList = [];
    
    if (alertas.margen_bajo) {
        alertasList.push({
            tipo: 'warning',
            mensaje: '⚠️ Margen de utilidad bajo (<10%). Revisar estructura de costos.'
        });
    }
    
    if (alertas.costo_mp_alto) {
        alertasList.push({
            tipo: 'critical',
            mensaje: '📦 Costo de materia prima >55% del costo total. Negociar con proveedores.'
        });
    }
    
    if (alertas.punto_equilibrio_lejano) {
        alertasList.push({
            tipo: 'warning',
            mensaje: '🎯 Punto de equilibrio representa >80% de ventas actuales. Aumentar volumen o precios.'
        });
    }
    
    if (alertas.productos_no_rentables > 0) {
        alertasList.push({
            tipo: 'critical',
            mensaje: `❌ ${alertas.productos_no_rentables} producto(s) con margen <10%. Evaluar discontinuación.`
        });
    }
    
    if (alertasList.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 rounded-lg p-4 text-center">
                <span class="material-symbols-outlined text-green-600">check_circle</span>
                <p class="text-green-700 mt-2">No hay alertas activas</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = alertasList.map(alerta => `
        <div class="${alerta.tipo === 'critical' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-yellow-50 border-l-4 border-yellow-500'} p-4 rounded-lg mb-3">
            <p class="font-medium">${alerta.mensaje}</p>
        </div>
    `).join('');
}

function renderRecomendaciones(data) {
    const container = document.getElementById('recomendacionesContainer');
    const estructura = data.estructura_costos;
    const kpis = data.kpis_clave;
    const recomendaciones = [];
    
    if (estructura.materia_prima.porcentaje > 55) {
        recomendaciones.push('🎯 Buscar proveedores alternativos para reducir costo de MP');
    }
    
    if (estructura.mano_obra_directa.porcentaje > 30) {
        recomendaciones.push('👥 Capacitar personal para aumentar productividad y reducir costo MOD');
    }
    
    if (kpis.margen_contribucion < 30) {
        recomendaciones.push('📈 Revisar precios de venta o reducir costos variables');
    }
    
    if (kpis.punto_equilibrio_unidades > data.resumen_general.unidades_vendidas * 0.7) {
        recomendaciones.push('🚀 Estrategia de marketing para aumentar volumen de ventas');
    }
    
    if (recomendaciones.length === 0) {
        recomendaciones.push('✅ Todo en orden. Mantener estrategia actual.');
    }
    
    container.innerHTML = recomendaciones.map(rec => `
        <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg mb-2">
            <span class="material-symbols-outlined text-blue-600">lightbulb</span>
            <p class="text-sm text-gray-700">${rec}</p>
        </div>
    `).join('');
}

function renderComparativa(data) {
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    const resumen = data.resumen_general;
    
    if (comparativaChart) comparativaChart.destroy();
    
    comparativaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ventas', 'Costo Producción', 'Utilidad Neta'],
            datasets: [{
                label: 'Mes Actual',
                data: [resumen.ventas_totales, resumen.costo_total_produccion, resumen.utilidad_neta],
                backgroundColor: '#FF9F1C',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `S/ ${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return 'S/ ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function verDetalleProducto(codigo) {
    const periodo = document.getElementById('periodoSelector').value;
    window.open(`analisis_producto.html?codigo=${codigo}&periodo=${periodo}`, '_blank');
}

function mostrarLoading() {
    const container = document.getElementById('kpisPrincipales');
    container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9F1C] mx-auto"></div>
            <p class="mt-4 text-gray-500">Cargando datos financieros...</p>
        </div>
    `;
}

function mostrarError(mensaje) {
    const container = document.getElementById('kpisPrincipales');
    container.innerHTML = `
        <div class="col-span-full bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <span class="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
            <p class="text-red-700">Error: ${mensaje}</p>
            <button onclick="cargarDashboard()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
                Reintentar
            </button>
        </div>
    `;
}

// Auto-refresh cada 60 segundos
let autoRefreshInterval;
function iniciarAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refresh de costos industriales');
        cargarDashboard();
    }, 60000);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
    iniciarAutoRefresh();
    console.log('💰 Módulo de Costos Industriales cargado');
    
    // Event listener para cambio de período
    document.getElementById('periodoSelector').addEventListener('change', () => {
        cargarDashboard();
    });
});