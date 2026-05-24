// FRONTEND/js/menu2.js - Versión Corporativa Premium
let ordenesChart, costosChart;

// Configuración global de fuentes para Chart.js
Chart.defaults.font.family = "'Plus Jakarta Sans', 'Inter', sans-serif";
Chart.defaults.color = '#64748b'; // text-slate-500

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
        mostrarError('No se pudieron conectar los sensores de planta.');
    }
}

function renderKPIs(data) {
    const grid = document.getElementById('kpisGrid');
    
    // Mapeo de datos con estilos corporativos (colores, íconos)
    const kpis = [
        {
            titulo: 'Eficiencia Global',
            valor: `${data.eficiencia.productividad_promedio}%`,
            subtitulo: 'Productividad promedio en planta',
            icono: 'monitoring',
            dotColor: 'bg-emerald-500',
            iconColor: 'text-emerald-500'
        },
        {
            titulo: 'Órdenes Completadas',
            valor: `${data.ordenes.completadas}/${data.ordenes.total}`,
            subtitulo: `${data.ordenes.cumplimiento_entregas}% entregas a tiempo`,
            icono: 'check_circle',
            dotColor: 'bg-blue-500',
            iconColor: 'text-blue-500'
        },
        {
            titulo: 'Backlog de Planta',
            valor: data.planta.backlog_unidades.toLocaleString(),
            subtitulo: 'Unidades pendientes por fabricar',
            icono: 'conveyor_belt',
            dotColor: 'bg-amber-500',
            iconColor: 'text-amber-500'
        },
        {
            titulo: 'Costo Promedio',
            valor: `S/ ${data.costos.costo_promedio_orden.toFixed(2)}`,
            subtitulo: 'Costo absorbido por OT',
            icono: 'account_balance_wallet',
            dotColor: 'bg-purple-500',
            iconColor: 'text-purple-500'
        },
        {
            titulo: 'Producción en Proceso',
            valor: data.ordenes.en_proceso,
            subtitulo: 'Órdenes activas en piso',
            icono: 'precision_manufacturing',
            dotColor: 'bg-cyan-500',
            iconColor: 'text-cyan-500'
        },
        {
            titulo: 'Desviaciones (Atrasos)',
            valor: data.ordenes.atrasadas,
            subtitulo: data.ordenes.atrasadas > 0 ? '⚠️ Requiere atención de planner' : 'Operación dentro de SLA',
            icono: 'warning',
            dotColor: data.ordenes.atrasadas > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-300',
            iconColor: data.ordenes.atrasadas > 0 ? 'text-red-500' : 'text-slate-300'
        }
    ];
    
    grid.innerHTML = kpis.map(kpi => `
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div class="absolute -right-4 -top-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform group-hover:scale-110 group-hover:-rotate-12 duration-500 pointer-events-none">
                <span class="material-symbols-outlined text-9xl ${kpi.iconColor}">${kpi.icono}</span>
            </div>
            
            <div class="relative z-10">
                <h4 class="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${kpi.dotColor} shadow-sm"></span> ${kpi.titulo}
                </h4>
                <div class="text-3xl lg:text-4xl font-black text-brand-dark tracking-tight mb-2 font-mono">
                    ${kpi.valor}
                </div>
                <p class="text-[11px] font-inter text-slate-500 font-medium bg-slate-50 inline-block px-2 py-1 rounded-md border border-slate-100">
                    ${kpi.subtitulo}
                </p>
            </div>
        </div>
    `).join('');
}

function renderAlertas(alertas) {
    const container = document.getElementById('alertasContainer');
    const alertasList = [];
    
    if (alertas.produccion_critica) {
        alertasList.push({
            tipo: 'critical',
            mensaje: 'Múltiples órdenes atrasadas. Riesgo de quiebre de stock.',
            accion: 'Reasignar prioridades'
        });
    }
    
    if (alertas.baja_productividad) {
        alertasList.push({
            tipo: 'warning',
            mensaje: 'Productividad de planta por debajo del 70% (Cuello de botella detectado).',
            accion: 'Ver reporte de operarios'
        });
    }
    
    if (alertas.alto_backlog) {
        alertasList.push({
            tipo: 'warning',
            mensaje: 'Backlog excede la capacidad normal instalada.',
            accion: 'Evaluar horas extras'
        });
    }
    
    if (alertasList.length === 0) {
        container.innerHTML = `
            <div class="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
                <div class="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
                    <span class="material-symbols-outlined text-2xl">task_alt</span>
                </div>
                <div>
                    <p class="font-bold text-emerald-800 text-sm">Operación Óptima</p>
                    <p class="text-xs text-emerald-600 font-inter mt-0.5">No se detectan desviaciones en la matriz de producción actual.</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = alertasList.map(alerta => `
        <div class="p-4 rounded-2xl flex items-start gap-4 border ${alerta.tipo === 'critical' ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'} transition-all hover:bg-white hover:shadow-md group">
            <div class="${alerta.tipo === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} p-2 rounded-xl mt-0.5 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-lg">${alerta.tipo === 'critical' ? 'error' : 'warning'}</span>
            </div>
            <div class="flex-1">
                <p class="font-bold text-slate-800 text-sm leading-tight">${alerta.mensaje}</p>
                <button onclick="verDetalles('${alerta.accion}')" class="text-xs mt-2 font-bold ${alerta.tipo === 'critical' ? 'text-red-600 hover:text-red-800' : 'text-amber-600 hover:text-amber-800'} flex items-center gap-1 transition-colors">
                    ${alerta.accion} <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
            </div>
        </div>
    `).join('');
}

function renderCharts(data) {
    // === Gráfico de Órdenes (Barras) ===
    const ctxOrdenes = document.getElementById('ordenesChart').getContext('2d');
    if (ordenesChart) ordenesChart.destroy();
    
    ordenesChart = new Chart(ctxOrdenes, {
        type: 'bar',
        data: {
            labels: ['Completadas', 'En Proceso', 'Pendientes', 'Atrasadas'],
            datasets: [{
                label: 'Volumen (und)',
                data: [data.ordenes.completadas, data.ordenes.en_proceso, data.ordenes.pendientes, data.ordenes.atrasadas],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Emerald
                    'rgba(59, 130, 246, 0.8)', // Blue
                    'rgba(245, 158, 11, 0.8)', // Amber
                    'rgba(239, 68, 68, 0.8)'   // Red
                ],
                hoverBackgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0F172A',
                    padding: 12,
                    titleFont: { size: 13, family: 'Plus Jakarta Sans' },
                    bodyFont: { size: 14, weight: 'bold', family: 'Inter' },
                    displayColors: false,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9', drawBorder: false },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { font: { weight: '600' } }
                }
            }
        }
    });
    
    // === Gráfico de Costos (Doughnut) ===
    const ctxCostos = document.getElementById('costosChart').getContext('2d');
    if (costosChart) costosChart.destroy();
    
    costosChart = new Chart(ctxCostos, {
        type: 'doughnut',
        data: {
            labels: ['Materia Prima (MD)', 'Mano de Obra (MOD)', 'Costos Indirectos (CIF)'],
            datasets: [{
                data: [65, 25, 10], // Ideal si esto también viene del backend
                backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6'], // Blue, Amber, Purple
                hoverOffset: 8,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: '#0F172A',
                    padding: 12,
                    bodyFont: { size: 14, weight: 'bold' },
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

function verDetalles(accion) {
    alert(`Redireccionando módulo para: ${accion}`);
}

function mostrarError(mensaje) {
    const grid = document.getElementById('kpisGrid');
    grid.innerHTML = `
        <div class="col-span-full bg-red-50/50 border border-red-100 rounded-3xl p-10 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-red-500 text-3xl">cloud_off</span>
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-1">Error de Comunicación</h3>
            <p class="text-sm text-slate-500 mb-5 font-inter max-w-md">${mensaje}</p>
            <button onclick="cargarKPIs()" class="px-6 py-2.5 bg-brand-dark text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">refresh</span> Reconectar Sensores
            </button>
        </div>
    `;
}

// Auto-refresh cada 30 segundos (simulación de monitoreo en tiempo real)
setInterval(cargarKPIs, 30000);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarKPIs();
    console.log('📊 Monitor HMI de Producción en Línea');
});