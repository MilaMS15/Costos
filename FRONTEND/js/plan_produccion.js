// Configuración de la API
// API_URL se toma de config.js


// Datos actuales
let filasActuales = [];
let totalesActuales = {};
let mesActual = '';
let sortCol = null;
let sortRev = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarMeses();
    verificarConexion();
});

// Verificar conexión con la API
async function verificarConexion() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const result = await response.json();
        const indicator = document.getElementById('conexionIndicator');
        
        if (result.success) {
            indicator.textContent = '● Conectado a Supabase';
            indicator.classList.remove('offline');
        } else {
            indicator.textContent = '● Modo demo';
            indicator.classList.add('offline');
        }
    } catch (error) {
        const indicator = document.getElementById('conexionIndicator');
        indicator.textContent = '● Modo demo (sin BD)';
        indicator.classList.add('offline');
    }
}

// Cargar lista de meses disponibles
async function cargarMeses() {
    try {
        const response = await fetch(`${API_URL}/plan-produccion/meses`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('mesSelect');
            select.innerHTML = '';
            
            result.data.meses.forEach((mes, index) => {
                select.innerHTML += `<option value="${mes}">${result.data.meses_formato[index]}</option>`;
            });
            
            // Cargar el primer mes automáticamente
            if (result.data.meses.length > 0) {
                mesActual = result.data.meses[0];
                cargarPlan();
            }
        }
    } catch (error) {
        console.error('Error al cargar meses:', error);
    }
}

// Cargar plan de producción del mes seleccionado
async function cargarPlan() {
    const mes = document.getElementById('mesSelect').value;
    if (!mes) return;
    
    mesActual = mes;
    
    try {
        const response = await fetch(`${API_URL}/plan-produccion/${mes}`);
        const result = await response.json();
        
        if (result.success) {
            filasActuales = result.data.filas;
            totalesActuales = result.data.totales;
            renderizarTabla(filasActuales, totalesActuales);
        }
    } catch (error) {
        console.error('Error al cargar plan:', error);
    }
}

// Renderizar la tabla
function renderizarTabla(filas, totales) {
    const tbody = document.getElementById('planTableBody');
    tbody.innerHTML = '';
    
    filas.forEach((fila, index) => {
        const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td>${fila.producto}</td>
                <td>${fila.vv.toLocaleString()}</td>
                <td>${fila.pct_vv.toFixed(1)}%</td>
                <td>S/ ${fila.precio.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>S/ ${fila.ventas.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>S/ ${fila.vv_mes.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${fila.pct_venta.toFixed(1)}%</td>
            </tr>
        `;
    });
    
    // Fila de totales
    tbody.innerHTML += `
        <tr class="row-total">
            <td>TOTAL</td>
            <td>${totales.vv.toLocaleString()}</td>
            <td>100.0%</td>
            <td>—</td>
            <td>S/ ${totales.ventas.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>—</td>
            <td>100.0%</td>
        </tr>
    `;
    
    // Actualizar footer
    document.getElementById('totalVV').textContent = `Total unidades vendidas: ${totales.vv.toLocaleString()}`;
    document.getElementById('totalMonto').textContent = `Total ventas: S/ ${totales.ventas.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// Ordenar tabla
function ordenar(col) {
    if (sortCol === col) {
        sortRev = !sortRev;
    } else {
        sortCol = col;
        sortRev = false;
    }
    
    const filasOrdenadas = [...filasActuales].sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (valA < valB) return sortRev ? 1 : -1;
        if (valA > valB) return sortRev ? -1 : 1;
        return 0;
    });
    
    renderizarTabla(filasOrdenadas, totalesActuales);
}

// Exportar PDF (abre ventana de impresión)
function exportarPDF() {
    window.print();
}

// Actualizar automáticamente cada cierto tie