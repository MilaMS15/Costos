// FRONTEND/js/menu6.js

let chartCostosInstance = null;
let chartRentabilidadInstance = null;

// Formateador estándar para moneda peruana (Soles)
const formatMoney = (amount) => {
    const val = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
};

async function cargarDashboard() {
    const mesSeleccionado = document.getElementById('mesSelector').value;
    const baseApiUrl = (typeof API_URL !== 'undefined' && API_URL) ? API_URL : 'http://localhost:5000/api';
    
    console.log(`Cargando datos financieros para el periodo: ${mesSeleccionado}`);

    try {
        // 1. Llamada al Estado de Resultados Dinámico de app.py
        const responseER = await fetch(`${baseApiUrl}/estado-resultados/${mesSeleccionado}`);
        const resultER = await responseER.json();
        
        // 2. Llamada al Desglose de Gastos Fijos Reales (GA y GV)
        const responseGastos = await fetch(`${baseApiUrl}/menu6/finanzas/gastos-fijos`);
        const resultGastos = await responseGastos.json();

        // Procesar e inyectar Estado de Resultados si es exitoso
        if (resultER.success && resultER.data) {
            actualizarKPIs(resultER.data);
            renderizarGraficoCostos(resultER.data.costos_detalle);
            renderizarGraficoRentabilidad(resultER.data.productos_rentabilidad || []);
        } else {
            console.warn("No se encontraron cálculos de producción para este periodo. Mostrando valores por defecto.");
            mostrarKPIsVacios();
        }

        // Procesar e inyectar Gastos Fijos (GA / GV)
        if (resultGastos.success && resultGastos.data) {
            actualizarTablaGastos(resultGastos.data);
        } else {
            document.getElementById('tabla-gastos-body').innerHTML = `
                <tr><td colspan="3" class="px-4 py-4 text-center text-gray-500">No se pudieron recuperar las tablas de gastos fijos.</td></tr>
            `;
        }

    } catch (error) {
        console.error('Error crítico al conectar con la API de finanzas:', error);
        mostrarKPIsVacios();
    }
}

function actualizarKPIs(data) {
    document.getElementById('kpi-ventas').textContent = formatMoney(data.ventas_netas);
    document.getElementById('kpi-costos').textContent = formatMoney(data.costos_detalle ? data.costos_detalle.total_costo_ventas : 0);
    document.getElementById('kpi-gastos').textContent = formatMoney(data.total_gastos_operativos);
    
    const utilidad = data.utilidad_neta || 0;
    const utilidadElem = document.getElementById('kpi-utilidad');
    utilidadElem.textContent = formatMoney(utilidad);
    utilidadElem.className = utilidad >= 0 ? "text-2xl font-bold text-green-600" : "text-2xl font-bold text-red-600";
    
    const margen = data.margen_neto || 0;
    const margenElem = document.getElementById('kpi-margen');
    margenElem.textContent = `${margen}%`;
    margenElem.className = margen >= 0 
        ? "text-sm font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full"
        : "text-sm font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full";
}

function mostrarKPIsVacios() {
    document.getElementById('kpi-ventas').textContent = formatMoney(0);
    document.getElementById('kpi-costos').textContent = formatMoney(0);
    document.getElementById('kpi-gastos').textContent = formatMoney(0);
    document.getElementById('kpi-utilidad').textContent = formatMoney(0);
    document.getElementById('kpi-utilidad').className = "text-2xl font-bold text-gray-400";
    document.getElementById('kpi-margen').textContent = "0%";
    document.getElementById('kpi-margen').className = "text-sm font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded-full";
    
    // Resetear gráficos con datos vacíos
    renderizarGraficoCostos({ materia_prima: 0, mano_obra_directa: 0, costos_indirectos: 0 });
    renderizarGraficoRentabilidad([]);
}

function renderizarGraficoCostos(costos) {
    const ctx = document.getElementById('chartEstructuraCostos').getContext('2d');
    if (chartCostosInstance) chartCostosInstance.destroy();

    const mp = costos ? (costos.materia_prima || 0) : 0;
    const mod = costos ? (costos.mano_obra_directa || 0) : 0;
    const cif = costos ? (costos.costos_indirectos || 0) : 0;

    chartCostosInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Materia Prima', 'Mano de Obra (MOD)', 'Costos Indirectos (CIF)'],
            datasets: [{
                data: [mp, mod, cif],
                backgroundColor: ['#2563EB', '#F59E0B', '#10B981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            cutout: '70%'
        }
    });
}

function renderizarGraficoRentabilidad(productos) {
    const ctx = document.getElementById('chartRentabilidad').getContext('2d');
    if (chartRentabilidadInstance) chartRentabilidadInstance.destroy();

    const topProductos = productos.slice(0, 5);
    const labels = topProductos.length > 0 ? topProductos.map(p => p.nombre || `Prod ${p.codigo_producto}`) : ['Sin datos'];
    const dataValues = topProductos.length > 0 ? topProductos.map(p => p.utilidad_bruta || 0) : [0];

    chartRentabilidadInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Utilidad Bruta (S/)',
                data: dataValues,
                backgroundColor: '#6366F1',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#E5E7EB' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function actualizarTablaGastos(gastos) {
    const tbody = document.getElementById('tabla-gastos-body');
    tbody.innerHTML = '';

    if (gastos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-4 text-center text-gray-500">No hay gastos administrativos ni de ventas registrados.</td></tr>`;
        return;
    }

    gastos.forEach(gasto => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors border-b border-gray-100";
        
        const badgeClass = gasto.tipo.includes('GA') ? "bg-purple-100 text-purple-700" : "bg-pink-100 text-pink-700";

        tr.innerHTML = `
            <td class="px-4 py-3">
                <span class="px-2.py-0.5 text-xs font-semibold rounded-full ${badgeClass}">
                    ${gasto.tipo}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 font-medium">${gasto.denominacion}</td>
            <td class="px-4 py-3 text-sm font-bold text-gray-900 text-right">${formatMoney(gasto.monto)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Inicialización automática al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
});