// FRONTEND/js/menu2.js
let ordenesChart, costosChart;

async function cargarKPIs() {
    try {
        const response = await fetch(`${API_URL}/menu2/kpis-produccion`);
        const result = await response.json();
        
        if (result.success) {
            renderKPIs(result.data);
            renderAlertas(result.data.alertas);
            renderCharts(result.data);
        } else {
            console.error('Error:', result.error);
            mostrarError(result.error);
        }
    } catch (error) {
        console.error('Error al cargar KPIs:', error);
        mostrarError('No se pudieron cargar los KPIs');
    }
}

function renderKPIs(data) {
    const grid = document.getElementById('kpisGrid');
    
    const kpis = [
        {
            titulo: 'Eficiencia Global',
            valor: `${data.eficiencia.productividad_promedio}%`,
            subtitulo: 'Productividad promedio',
            icono: 'trending_up',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            titulo: 'Órdenes Completadas',
            valor: `${data.ordenes.completadas}/${data.ordenes.total}`,
            subtitulo: `${data.ordenes.cumplimiento_entregas}% entregas a tiempo`,
            icono: 'assignment_turned_in',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            titulo: 'Backlog',
            valor: data.planta.backlog_unidades.toLocaleString(),
            subtitilo: 'Unidades pendientes',
            icono: 'inventory',
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            titulo: 'Costo Promedio',
            valor: `S/ ${data.costos.costo_promedio_orden.toFixed(2)}`,
            subtitulo: 'Por orden de trabajo',
            icono: 'payments',
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            titulo: 'En Proceso',
            valor: data.ordenes.en_proceso,
            subtitulo: 'Órdenes activas',
            icono: 'settings',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
        },
        {
            titulo: 'Atrasadas',
            valor: data.ordenes.atrasadas,
            subtitulo: data.ordenes.atrasadas > 0 ? '⚠️ Requiere atención' : 'Todo en orden',
            icono: 'warning',
            color: data.ordenes.atrasadas > 0 ? 'text-red-600' : 'text-gray-600',
            bg: data.ordenes.atrasadas > 0 ? 'bg-red-50' : 'bg-gray-50'
        }
    ];
    
    grid.innerHTML = kpis.map(kpi => `
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

function renderAlertas(alertas) {
    const container = document.getElementById('alertasContainer');
    const alertasList = [];
    
    if (alertas.produccion_critica) {
        alertasList.push({
            tipo: 'critical',
            mensaje: '⚠️ Múltiples órdenes atrasadas. Revisar programación urgente.',
            accion: 'Ver órdenes pendientes'
        });
    }
    
    if (alertas.baja_productividad) {
        alertasList.push({
            tipo: 'warning',
            mensaje: '📉 Productividad por debajo del 70%. Evaluar eficiencia de personal.',
            accion: 'Revisar métricas'
        });
    }
    
    if (alertas.alto_backlog) {
        alertasList.push({
            tipo: 'warning',
            mensaje: '📦 Backlog excede capacidad normal. Aumentar recursos.',
            accion: 'Planificar producción'
        });
    }
    
    if (alertasList.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div class="flex items-center">
                    <span class="material-symbols-outlined text-green-600 mr-3">check_circle</span>
                    <div>
                        <p class="font-medium text-green-800">Todo en orden</p>
                        <p class="text-sm text-green-600">No hay alertas activas en este momento</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = alertasList.map(alerta => `
        <div class="${alerta.tipo === 'critical' ? 'alert-critical' : 'alert-warning'} p-4 rounded-lg mb-3">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-semibold">${alerta.mensaje}</p>
                    <button onclick="verDetalles('${alerta.accion}')" class="text-sm mt-2 text-blue-600 hover:text-blue-800">
                        ${alerta.accion} →
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCharts(data) {
    // Gráfico de órdenes
    const ctxOrdenes = document.getElementById('ordenesChart').getContext('2d');
    if (ordenesChart) ordenesChart.destroy();
    
    ordenesChart = new Chart(ctxOrdenes, {
        type: 'bar',
        data: {
            labels: ['Completadas', 'En Proceso', 'Pendientes', 'Atrasadas'],
            datasets: [{
                label: 'Cantidad de Órdenes',
                data: [data.ordenes.completadas, data.ordenes.en_proceso, 
                       data.ordenes.pendientes, data.ordenes.atrasadas],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // Gráfico de costos
    const ctxCostos = document.getElementById('costosChart').getContext('2d');
    if (costosChart) costosChart.destroy();
    
    costosChart = new Chart(ctxCostos, {
        type: 'doughnut',
        data: {
            labels: ['Materia Prima', 'Mano de Obra', 'Costos Indirectos'],
            datasets: [{
                data: [65, 25, 10], // Estos valores los puedes calcular desde tu backend
                backgroundColor: ['#FF9F1C', '#2A9D8F', '#E9C46A'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function verDetalles(accion) {
    alert(`🔍 Navegar a: ${accion}`);
    // Aquí puedes redirigir a secciones específicas
    // window.location.href = '/ordenes_trabajo.html';
}

function mostrarError(mensaje) {
    const grid = document.getElementById('kpisGrid');
    grid.innerHTML = `
        <div class="col-span-full bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <span class="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
            <p class="text-red-700">Error: ${mensaje}</p>
            <button onclick="cargarKPIs()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
                Reintentar
            </button>
        </div>
    `;
}

// Auto-refresh cada 30 segundos
setInterval(cargarKPIs, 30000);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarKPIs();
    console.log('📊 Dashboard de Producción cargado');
});