// FRONTEND/js/menu5.js
let trabajadoresData = [];

async function cargarResumenRH() {
    try {
        const response = await fetch(`${API_URL}/rh/resumen`);
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            document.getElementById('totalTrabajadores').innerText = data.total_trabajadores;
            document.getElementById('totalPlanilla').innerText = `S/ ${data.total_planilla.toFixed(2)}`;
            document.getElementById('promedioSueldo').innerText = `S/ ${data.promedio_sueldo.toFixed(2)}`;
            document.getElementById('totalEssalud').innerText = `S/ ${data.total_essalud.toFixed(2)}`;
        } else {
            console.error('Error en resumen:', result.error);
        }
    } catch (error) {
        console.error('Error al cargar resumen:', error);
    }
}

async function cargarTrabajadores() {
    try {
        const response = await fetch(`${API_URL}/rh/trabajadores`);
        const result = await response.json();
        if (result.success) {
            trabajadoresData = result.data;
            renderTabla(trabajadoresData);
            renderTop5Chart(trabajadoresData);
        } else {
            document.getElementById('tablaBody').innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-500">Error: ${result.error}</td></tr>`;
        }
    } catch (error) {
        console.error('Error al cargar trabajadores:', error);
        document.getElementById('tablaBody').innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-500">Error de conexión</td></tr>`;
    }
}

function renderTabla(trabajadores) {
    const tbody = document.getElementById('tablaBody');
    if (!trabajadores.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">No hay trabajadores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = trabajadores.map(t => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-4 py-3 font-medium">${t.codigotrabajador || ''}</td>
            <td class="px-4 py-3">${t.apellidosnombres || 'N/A'}</td>
            <td class="px-4 py-3">${t.puestotrabajo || 'N/A'}</td>
            <td class="px-4 py-3">S/ ${(t.sueldobasico || 0).toFixed(2)}</td>
            <td class="px-4 py-3">S/ ${(t.bonificacion || 0).toFixed(2)}</td>
            <td class="px-4 py-3">S/ ${(t.asigfamiliar || 0).toFixed(2)}</td>
            <td class="px-4 py-3 font-bold text-[#1B263B]">S/ ${(t.sueldototal || 0).toFixed(2)}</td>
        </tr>
    `).join('');
}

function renderTop5Chart(trabajadores) {
    // Ordenar por sueldototal descendente y tomar 5
    const top5 = [...trabajadores]
        .sort((a, b) => (b.sueldototal || 0) - (a.sueldototal || 0))
        .slice(0, 5);

    const labels = top5.map(t => t.apellidosnombres?.split(' ')[0] || `ID ${t.codigotrabajador}`);
    const data = top5.map(t => t.sueldototal || 0);

    const ctx = document.getElementById('costosChart').getContext('2d');
    // Si ya existe un chart, destruirlo para evitar duplicados
    if (window.costosChartInstance) {
        window.costosChartInstance.destroy();
    }
    window.costosChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Costo total (S/.)',
                data: data,
                backgroundColor: '#FF9F1C',
                borderRadius: 8,
                barPercentage: 0.65
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `S/ ${ctx.raw.toFixed(2)}` } }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Soles (S/)' } }
            }
        }
    });
}

function exportarCSV() {
    if (!trabajadoresData.length) {
        alert('No hay datos para exportar');
        return;
    }
    // Definir columnas a exportar
    const columnas = ['codigotrabajador', 'apellidosnombres', 'puestotrabajo', 'sueldobasico', 'bonificacion', 'asigfamiliar', 'sueldototal'];
    const encabezados = ['Código', 'Nombre completo', 'Puesto', 'Sueldo Base', 'Bonificación', 'Asig. Familiar', 'Sueldo Total'];

    const filas = trabajadoresData.map(t => columnas.map(col => t[col] || '').join(','));
    const csvContent = [encabezados.join(','), ...filas].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'planilla_costos_rrhh.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarResumenRH();
    cargarTrabajadores();
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportarCSV);
});