// FRONTEND/js/menu3.js - Versión Logística con Fecha, Hora y Orden de Inserción Correcto

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('mdFecha')) {
        document.getElementById('mdFecha').value = new Date().toISOString().split('T')[0];
    }
    
    // 1. Escuchas de la BARRA SUPERIOR
    document.getElementById('selectTipoItem').addEventListener('change', actualizarBarraFiltros);
    document.getElementById('selectCodigoItem').addEventListener('change', cargarKardex);
    
    // 2. Escuchas del FORMULARIO MODAL
    document.getElementById('tipoItem').addEventListener('change', actualizarComboModal);
    
    // Inicialización de la pantalla al abrir
    actualizarBarraFiltros();
    actualizarComboModal();
});

// Lógica de la Barra de Filtros Superior
async function actualizarBarraFiltros() {
    const tipo = document.getElementById('selectTipoItem').value;
    const comboFiltro = document.getElementById('selectCodigoItem');
    
    if (tipo === 'TODOS') {
        comboFiltro.innerHTML = '<option value="TODOS">📦 Todos los materiales / productos</option>';
        comboFiltro.disabled = true;
        cargarKardex(); 
        return;
    }
    
    comboFiltro.disabled = false;
    comboFiltro.innerHTML = '<option value="TODOS">Cargando...</option>';
    
    try {
        const response = await fetch(`${API_URL}/menu3/items/${tipo}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            comboFiltro.innerHTML = '<option value="TODOS">📦 Todos los de este tipo</option>';
            result.data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.codigo;
                opt.textContent = `[${item.codigo}] ${item.nombre}`;
                comboFiltro.appendChild(opt);
            });
        } else {
            comboFiltro.innerHTML = '<option value="TODOS">No hay registros</option>';
        }
        cargarKardex();
    } catch (error) {
        console.error('Error al poblar filtros:', error);
        comboFiltro.innerHTML = '<option value="TODOS">Error al cargar</option>';
    }
}

// Cargar y Calcular el Kardex en la pantalla con Orden Inteligente por Filtros
async function cargarKardex() {
    const tipo = document.getElementById('selectTipoItem').value;
    const codigo = document.getElementById('selectCodigoItem').value;
    const tbody = document.getElementById('cuerpoKardex');
    const sinDatos = document.getElementById('sinDatos');
    
    if (!tbody) return;
    
    try {
        const response = await fetch(`${API_URL}/menu3/kardex?tipo_item=${tipo}&codigo_item=${codigo}`);
        const result = await response.json();
        
        tbody.innerHTML = '';
        
        if (result.success && result.data.length > 0) {
            sinDatos.classList.add('hidden');
            
            // Variables para calcular el Saldo Acumulado Promedio Móvil en vivo
            let saldoCantidad = 0;
            let saldoTotalMonto = 0;
            
            // 🔥 LÓGICA DE DETECCIÓN DE VISTA AGRUPADA
            // Es vista agrupada si el primer filtro es 'TODOS' O si el segundo filtro es 'TODOS'
            const esVistaAgrupada = (tipo === 'TODOS' || codigo === 'TODOS' || !codigo);
            
            result.data.forEach(mov => {
                // Si es Vista Agrupada (Todos, Toda la MP o Todo el PT) -> Inserta ARRIBA (0)
                // Si es un Ítem Individual específico -> Inserta ABAJO (-1 tradicional) para el Kardex Clásico
                const row = esVistaAgrupada ? tbody.insertRow(0) : tbody.insertRow();
                
                let fechaFormateada = mov.fecharegistro ? mov.fecharegistro.substring(0, 10) : '-';
                let horaFormateada = "00:00"; 
                let detalleLimpio = mov.detalle || '-';

                // Extraemos la hora si viene en el detalle [HH:MM]
                if (mov.detalle && mov.detalle.startsWith('[')) {
                    const partes = mov.detalle.split('] ');
                    if (partes.length > 1) {
                        horaFormateada = partes[0].substring(1, 6); 
                        detalleLimpio = partes.slice(1).join('] '); 
                    }
                }
                                
                const nombre = mov.nombre_item || 'Item';
                const tipoMov = mov.tipo_movement || mov.tipo_movimiento || 'ENTRADA';
                const cant = parseFloat(mov.cantidad || 0);
                const cu = parseFloat(mov.costounitario || 0);
                const totalRow = parseFloat(mov.monto_total || (cant * cu));
                
                // Lógica matemática de Saldos Acumulados (Se calcula siempre en orden de BD)
                if (tipoMov === 'ENTRADA') {
                    saldoCantidad += cant;
                    saldoTotalMonto += totalRow;
                } else {
                    saldoCantidad -= cant;
                    saldoTotalMonto -= totalRow;
                }
                
                const saldoCu = saldoCantidad > 0 ? (saldoTotalMonto / saldoCantidad) : 0;
                
                let celdaEntrada = `<td>-</td><td>-</td><td>-</td>`;
                let celdaSalida = `<td>-</td><td>-</td><td>-</td>`;
                
                if (tipoMov === 'ENTRADA') {
                    celdaEntrada = `
                        <td class="p-3 text-right text-green-700 font-medium">${cant.toFixed(2)}</td>
                        <td class="p-3 text-right text-green-700">S/. ${cu.toFixed(2)}</td>
                        <td class="p-3 text-right text-green-700 font-bold">S/. ${totalRow.toFixed(2)}</td>
                    `;
                } else {
                    celdaSalida = `
                        <td class="p-3 text-right text-red-700 font-medium">${cant.toFixed(2)}</td>
                        <td class="p-3 text-right text-red-700">S/. ${cu.toFixed(2)}</td>
                        <td class="p-3 text-right text-red-700 font-bold">S/. ${totalRow.toFixed(2)}</td>
                    `;
                }
                
                row.innerHTML = `
                    <td class="p-3 font-semibold text-gray-800 flex flex-col justify-center">
                        <span>${fechaFormateada}</span>
                        <div class="text-[11px] text-gray-500 font-normal bg-gray-100 rounded-md px-1.5 py-0.5 inline-block mt-1 font-mono">🕒 ${horaFormateada}</div>
                    </td>
                    <td class="p-3">
                        <div class="font-bold text-gray-900">${nombre}</div>
                        <div class="text-xs text-gray-400">${detalleLimpio}</div>
                    </td>
                    <td class="p-3 text-center">
                        <span class="px-2.5 py-1 rounded-full text-xs font-black ${tipoMov === 'ENTRADA' ? 'bg-green-100 text-green-800':'bg-red-100 text-red-800'}">${tipoMov}</span>
                    </td>
                    ${celdaEntrada}
                    ${celdaSalida}
                    <td class="p-3 text-right font-semibold text-blue-900 bg-blue-50/30">${saldoCantidad.toFixed(2)}</td>
                    <td class="p-3 text-right text-blue-900 bg-blue-50/30">S/. ${saldoCu.toFixed(2)}</td>
                    <td class="p-3 text-right font-black text-blue-900 bg-blue-50/30">S/. ${saldoTotalMonto.toFixed(2)}</td>
                `;
            });
        } else {
            sinDatos.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error en carga de Kardex:', error);
    }
}
// Lógica del Combo Interno del Modal
async function actualizarComboModal() {
    const tipo = document.getElementById('tipoItem').value;
    const comboModal = document.getElementById('comboItems');
    if (!comboModal) return;
    
    try {
        const response = await fetch(`${API_URL}/menu3/items/${tipo}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            comboModal.innerHTML = '';
            result.data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.codigo;
                opt.textContent = `[${item.codigo}] ${item.nombre}`;
                comboModal.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Error modal combo:', error);
    }
}

// Guardar Movimiento Manual
async function guardarMovimiento(e) {
    e.preventDefault();
    
    const payload = {
        tipo_item: document.getElementById('tipoItem').value,
        codigo_item: document.getElementById('comboItems').value,
        tipo_movimiento: document.getElementById('mdTipoMov').value,
        detalle: document.getElementById('mdDetalle').value,
        cantidad: document.getElementById('mdCantidad').value,
        costo_unitario: document.getElementById('mdCosto').value,
        fecha: document.getElementById('mdFecha').value
    };
    
    try {
        const response = await fetch(`${API_URL}/menu3/kardex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.success) {
            cerrarModalMovimiento();
            actualizarBarraFiltros(); 
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error de conexión.');
    }
}

function abrirModalMovimiento() {
    const modal = document.getElementById('modalMovimiento');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function cerrarModalMovimiento() {
    const modal = document.getElementById('modalMovimiento');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
    document.getElementById('formMovimiento').reset();
    document.getElementById('mdFecha').value = new Date().toISOString().split('T')[0];
}

if (document.getElementById('formMovimiento')) {
    document.getElementById('formMovimiento').addEventListener('submit', guardarMovimiento);
}