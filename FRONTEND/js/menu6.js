// FRONTEND/js/menu6.js
let proyeccionChart;

const formatMoney = (amount) => {
    const val = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
};

async function cargarDashboard() {
    const periodo = document.getElementById('periodoSelector').value;
    
    mostrarLoading();
    
    try {
        // Cargar datos en paralelo
        const [flujoCaja, indicadores, alertas, gastos] = await Promise.all([
            fetch(`${API_URL}/menu6/flujo-caja?periodo=${periodo}`).then(r => r.json()),
            fetch(`${API_URL}/menu6/indicadores-financieros`).then(r => r.json()),
            fetch(`${API_URL}/menu6/alertas-financieras`).then(r => r.json()),
            fetch(`${API_URL}/menu6/gastos-fijos`).then(r => r.json())
        ]);
        
        if (flujoCaja.success) renderFlujoCaja(flujoCaja.data);
        if (indicadores.success) renderIndicadores(indicadores.data);
        if (alertas.success) renderAlertas(alertas.data);
        if (gastos.success) renderGastos(gastos.data, gastos.total);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar datos financieros');
    }
}

function renderFlujoCaja(data) {
    document.getElementById('saldoInicial').textContent = formatMoney(data.saldo_inicial);
    document.getElementById('ingresos').textContent = formatMoney(data.ingresos_periodo);
    document.getElementById('egresos').textContent = formatMoney(data.egresos_periodo);
    
    const flujoNeto = data.flujo_caja_periodo;
    const flujoElement = document.getElementById('flujoNeto');
    const cardFlujo = document.getElementById('cardFlujo');
    const flujoIcon = document.getElementById('flujoIcon');
    const flujoDesc = document.getElementById('flujoDescripcion');
    
    flujoElement.textContent = formatMoney(flujoNeto);
    
    if (flujoNeto >= 0) {
        flujoElement.className = 'text-3xl font-bold text-green-600';
        flujoIcon.className = 'material-symbols-outlined text-green-600 text-3xl';
        flujoIcon.textContent = 'trending_up';
        flujoDesc.textContent = 'Flujo de caja positivo ✓';
        cardFlujo.classList.add('border-l-4', 'border-green-500');
    } else {
        flujoElement.className = 'text-3xl font-bold text-red-600';
        flujoIcon.className = 'material-symbols-outlined text-red-600 text-3xl';
        flujoIcon.textContent = 'trending_down';
        flujoDesc.textContent = 'Flujo de caja negativo ⚠️';
        cardFlujo.classList.add('border-l-4', 'border-red-500');
    }
    
    // Renderizar gráfico de proyección con ApexCharts
    const proyecciones = data.proyecciones;
    const opciones = {
        series: [{
            name: 'Ingresos',
            type: 'column',
            data: proyecciones.map(p => p.ingresos)
        }, {
            name: 'Egresos',
            type: 'column',
            data: proyecciones.map(p => p.egresos)
        }, {
            name: 'Flujo Neto',
            type: 'line',
            data: proyecciones.map(p => p.flujo_neto)
        }],
        chart: {
            type: 'line',
            height: 400,
            toolbar: { show: true },
            background: 'transparent'
        },
        colors: ['#3b82f6', '#ef4444', '#10b981'],
        title: { text: undefined },
        xaxis: {
            categories: proyecciones.map(p => p.nombre_mes),
            title: { text: 'Meses' }
        },
        yaxis: {
            title: { text: 'Soles (S/)' },
            labels: {
                formatter: function(val) {
                    return 'S/ ' + val.toLocaleString();
                }
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function(val) {
                    return 'S/ ' + val.toLocaleString();
                }
            }
        },
        stroke: {
            width: [0, 0, 3],
            curve: 'smooth'
        },
        plotOptions: {
            bar: {
                columnWidth: '50%',
                borderRadius: 8
            }
        }
    };
    
    if (proyeccionChart) proyeccionChart.destroy();
    proyeccionChart = new ApexCharts(document.querySelector("#proyeccionChart"), opciones);
    proyeccionChart.render();
}

function renderIndicadores(data) {
    // Liquidez
    const liquidezHtml = `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div>
                <p class="text-sm text-gray-600">Liquidez Corriente</p>
                <p class="text-2xl font-bold ${data.liquidez.liquidez_corriente >= 1.5 ? 'text-green-600' : 'text-red-600'}">${data.liquidez.liquidez_corriente}</p>
            </div>
            <div class="text-right">
                <p class="text-xs text-gray-500">Ideal > 1.5</p>
                <span class="text-xs px-2 py-1 rounded-full ${data.liquidez.liquidez_corriente >= 1.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    ${data.liquidez.rating}
                </span>
            </div>
        </div>
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div>
                <p class="text-sm text-gray-600">Prueba Ácida</p>
                <p class="text-2xl font-bold ${data.liquidez.prueba_acida >= 1 ? 'text-green-600' : 'text-orange-600'}">${data.liquidez.prueba_acida}</p>
            </div>
            <div class="text-right">
                <p class="text-xs text-gray-500">Ideal > 1.0</p>
            </div>
        </div>
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div>
                <p class="text-sm text-gray-600">Días de Cobertura</p>
                <p class="text-2xl font-bold text-blue-600">${data.liquidez.dias_cobertura} días</p>
            </div>
            <div class="text-right">
                <p class="text-xs text-gray-500">Días operando sin ventas</p>
            </div>
        </div>
    `;
    
    // Eficiencia
    const eficienciaHtml = `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div>
                <p class="text-sm text-gray-600">Ciclo de Efectivo</p>
                <p class="text-2xl font-bold text-purple-600">${data.eficiencia.ciclo_conversion_efectivo} días</p>
            </div>
            <div class="text-right">
                <p class="text-xs text-gray-500">Días desde pagar hasta cobrar</p>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
            <div class="text-center p-2 bg-blue-50 rounded-lg">
                <p class="text-xs text-gray-600">Inventario</p>
                <p class="text-lg font-bold text-blue-600">${data.eficiencia.dias_inventario}d</p>
            </div>
            <div class="text-center p-2 bg-green-50 rounded-lg">
                <p class="text-xs text-gray-600">Cobro</p>
                <p class="text-lg font-bold text-green-600">${data.eficiencia.dias_cobro}d</p>
            </div>
            <div class="text-center p-2 bg-orange-50 rounded-lg">
                <p class="text-xs text-gray-600">Pago</p>
                <p class="text-lg font-bold text-orange-600">${data.eficiencia.dias_pago}d</p>
            </div>
        </div>
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div>
                <p class="text-sm text-gray-600">Rentabilidad (ROA)</p>
                <p class="text-2xl font-bold text-green-600">${data.rentabilidad.roa}%</p>
            </div>
            <div class="text-right">
                <p class="text-xs text-gray-500">Retorno sobre activos</p>
            </div>
        </div>
    `;
    
    document.getElementById('indicadoresLiquidez').innerHTML = liquidezHtml;
    document.getElementById('indicadoresEficiencia').innerHTML = eficienciaHtml;
}

function renderAlertas(alertas) {
    const container = document.getElementById('alertasContainer');
    
    if (!alertas || alertas.length === 0) {
        container.innerHTML = `
            <div class="bg-green-50 rounded-xl p-4 text-center">
                <span class="material-symbols-outlined text-green-600">check_circle</span>
                <p class="text-green-700 mt-2">No hay alertas financieras</p>
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

function renderGastos(gastos, total) {
    const container = document.getElementById('gastosLista');
    
    if (!gastos || gastos.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay gastos registrados</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="bg-purple-50 rounded-xl p-3 mb-4">
            <div class="flex justify-between items-center">
                <span class="font-semibold text-gray-700">Total Gastos Fijos:</span>
                <span class="text-2xl font-bold text-purple-600">${formatMoney(total)}</span>
            </div>
        </div>
        ${gastos.map(g => `
            <div class="flex justify-between items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition">
                <div>
                    <p class="font-medium text-gray-800">${g.nombre}</p>
                    <p class="text-xs text-gray-500">${g.tipo}</p>
                </div>
                <p class="font-bold text-gray-700">${formatMoney(g.monto)}</p>
            </div>
        `).join('')}
    `;
}

function mostrarLoading() {
    const container = document.getElementById('saldoInicial');
    if (container) container.textContent = 'Cargando...';
}

function mostrarError(mensaje) {
    console.error(mensaje);
}

// Auto-refresh cada 60 segundos
let interval;
function iniciarAutoRefresh() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        console.log('🔄 Auto-refresh finanzas');
        cargarDashboard();
    }, 60000);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
    iniciarAutoRefresh();
    
    document.getElementById('periodoSelector').addEventListener('change', () => {
        cargarDashboard();
    });
});