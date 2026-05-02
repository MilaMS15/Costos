// Configuración de la API
// API_URL se toma de config.js


// Elementos del DOM
let modalTrabajador;
let modalAsignacion;
let productoSeleccionadoTiempos = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    modalTrabajador = document.getElementById('modalTrabajador');
    modalAsignacion = document.getElementById('modalAsignacion');
    cargarTrabajadores();
    cargarProductosEnSelectTiempos();
});

// ============================================
// FUNCIONES DE PESTAÑAS
// ============================================
function cambiarTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[onclick="cambiarTab('${tab}')"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================
// FUNCIONES DE TRABAJADORES
// ============================================
async function cargarTrabajadores() {
    try {
        const response = await fetch(`${API_URL}/trabajadores`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tablaTrabajadores tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(trabajador => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${trabajador.codigotrabajador || ''}</td>
                    <td>${trabajador.apellidosnombres || ''}</td>
                    <td>${trabajador.puestotrabajo || ''}</td>
                    <td>S/. ${(trabajador.sueldobasico || 0).toFixed(2)}</td>
                    <td>S/. ${(trabajador.sueldototal || 0).toFixed(2)}</td>
                    <td>${trabajador.fecharegistro || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editarTrabajador('${trabajador.codigotrabajador}')">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarTrabajador('${trabajador.codigotrabajador}')">🗑️</button>
                    </td>
                `;
            });
        }
    } catch (error) {
        alert('Error al cargar trabajadores: ' + error.message);
    }
}

function abrirFormularioTrabajador(trabajador = null) {
    document.getElementById('formTrabajador').reset();
    document.getElementById('sueldoPreview').style.display = 'none';
    
    if (trabajador) {
        document.getElementById('modalTituloTrabajador').textContent = 'Editar Trabajador';
        document.getElementById('editandoTrabajador').value = 'true';
        document.getElementById('codigotrabajador').value = trabajador.codigotrabajador;
        document.getElementById('codigotrabajador').readOnly = true;
        document.getElementById('apellidosnombres').value = trabajador.apellidosnombres || '';
        document.getElementById('puestotrabajo').value = trabajador.puestotrabajo || 'Cortador';
        document.getElementById('tipotrabajo').value = trabajador.tipotrabajo || 'MOD';
        document.getElementById('productividad').value = trabajador.productividad || 0.85;
        document.getElementById('sueldobasico').value = trabajador.sueldobasico || 0;
        document.getElementById('bonificacion').value = trabajador.bonificacion || 0;
        document.getElementById('asigfamiliar').value = trabajador.asigfamiliar || 0;
        
        calcularSueldoPreview();
    } else {
        document.getElementById('modalTituloTrabajador').textContent = 'Nuevo Trabajador';
        document.getElementById('editandoTrabajador').value = 'false';
        document.getElementById('codigotrabajador').readOnly = false;
    }
    
    modalTrabajador.classList.add('show');
}

function cerrarModalTrabajador() {
    modalTrabajador.classList.remove('show');
}

function calcularSueldoPreview() {
    const sueldoBase = parseFloat(document.getElementById('sueldobasico').value) || 0;
    const bonificacion = parseFloat(document.getElementById('bonificacion').value) || 0;
    const asigFamiliar = parseFloat(document.getElementById('asigfamiliar').value) || 0;
    
    if (sueldoBase > 0) {
        const sueldo = sueldoBase + bonificacion + asigFamiliar;
        const essalud = sueldo * 0.09;
        const gratificacionJulio = sueldoBase / 6;
        const gratificacionDiciembre = sueldoBase / 6;
        const cts = sueldoBase / 12;
        const sueldoTotal = sueldo + essalud + gratificacionJulio + gratificacionDiciembre + cts;
        
        document.getElementById('sueldoPreview').style.display = 'block';
        document.getElementById('sueldoDetalle').innerHTML = `
            <p>Sueldo Base + Bonif. + Asig. Familiar: <strong>S/. ${sueldo.toFixed(2)}</strong></p>
            <p>Essalud (9%): <strong>S/. ${essalud.toFixed(2)}</strong></p>
            <p>Gratificación Julio: <strong>S/. ${gratificacionJulio.toFixed(2)}</strong></p>
            <p>Gratificación Diciembre: <strong>S/. ${gratificacionDiciembre.toFixed(2)}</strong></p>
            <p>CTS: <strong>S/. ${cts.toFixed(2)}</strong></p>
            <hr>
            <p style="font-size: 1.2rem;">SUELDO TOTAL: <strong style="color: #667eea;">S/. ${sueldoTotal.toFixed(2)}</strong></p>
        `;
    } else {
        document.getElementById('sueldoPreview').style.display = 'none';
    }
}

async function editarTrabajador(codigo) {
    try {
        const response = await fetch(`${API_URL}/trabajadores/${codigo}`);
        const result = await response.json();
        
        if (result.success) {
            abrirFormularioTrabajador(result.data);
        }
    } catch (error) {
        alert('Error al buscar trabajador');
    }
}

async function guardarTrabajador() {
    const editando = document.getElementById('editandoTrabajador').value === 'true';
    const codigo = document.getElementById('codigotrabajador').value;
    
    const datos = {
        codigotrabajador: parseInt(codigo),
        apellidosnombres: document.getElementById('apellidosnombres').value,
        puestotrabajo: document.getElementById('puestotrabajo').value,
        tipotrabajo: document.getElementById('tipotrabajo').value,
        productividad: parseFloat(document.getElementById('productividad').value) || 0.85,
        sueldobasico: parseFloat(document.getElementById('sueldobasico').value) || 0,
        bonificacion: parseFloat(document.getElementById('bonificacion').value) || 0,
        asigfamiliar: parseFloat(document.getElementById('asigfamiliar').value) || 0
    };
    
    if (!datos.codigotrabajador || !datos.apellidosnombres) {
        alert('Código y Nombres son campos requeridos');
        return;
    }
    
    try {
        const url = editando ? `${API_URL}/trabajadores/${codigo}` : `${API_URL}/trabajadores`;
        const method = editando ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(editando ? 'Trabajador actualizado' : 'Trabajador creado');
            cerrarModalTrabajador();
            cargarTrabajadores();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error al guardar: ' + error.message);
    }
}

async function eliminarTrabajador(codigo) {
    if (confirm('¿Está seguro de eliminar este trabajador?')) {
        try {
            const response = await fetch(`${API_URL}/trabajadores/${codigo}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Trabajador eliminado');
                cargarTrabajadores();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }
}

// ============================================
// FUNCIONES DE TIEMPOS POR PRODUCTO
// ============================================
async function cargarProductosEnSelectTiempos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('productoSelectTiempos');
            select.innerHTML = '<option value="">-- Seleccione un producto --</option>';
            
            result.data.forEach(producto => {
                select.innerHTML += `<option value="${producto.codigoproducto}">${producto.codigoproducto} - ${producto.producto}</option>`;
            });
        }
    } catch (error) {
        alert('Error al cargar productos: ' + error.message);
    }
}

async function cargarTiempos() {
    const codigoProducto = document.getElementById('productoSelectTiempos').value;
    
    if (!codigoProducto) {
        document.querySelector('#tablaTiempos tbody').innerHTML = '';
        return;
    }
    
    productoSeleccionadoTiempos = {
        codigo: codigoProducto,
        nombre: document.getElementById('productoSelectTiempos').selectedOptions[0].text.split(' - ')[1]
    };
    
    try {
        // Cargar tiempos
        const responseTiempos = await fetch(`${API_URL}/recetas-mo?codigoproducto=${codigoProducto}`);
        const resultTiempos = await responseTiempos.json();
        
        // Cargar trabajadores para obtener eficiencia
        const responseTrab = await fetch(`${API_URL}/trabajadores`);
        const resultTrab = await responseTrab.json();
        
        if (resultTiempos.success) {
            const tbody = document.querySelector('#tablaTiempos tbody');
            tbody.innerHTML = '';
            
            resultTiempos.data.forEach(tiempo => {
                const trabajador = resultTrab.success 
                    ? resultTrab.data.find(t => t.codigotrabajador == tiempo.codigotrabajador)
                    : null;
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${tiempo.codigotrabajador || ''}</td>
                    <td>${trabajador ? trabajador.puestotrabajo : 'N/A'}</td>
                    <td>${tiempo.tiempotrabajo || ''}</td>
                    <td>${trabajador ? (trabajador.productividad * 100).toFixed(1) + '%' : 'N/A'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="eliminarAsignacion('${tiempo.codigotrabajador}')">🗑️</button>
                    </td>
                `;
            });
        }
    } catch (error) {
        alert('Error al cargar tiempos: ' + error.message);
    }
}

async function asignarTrabajador() {
    if (!productoSeleccionadoTiempos) {
        alert('Primero seleccione un producto');
        return;
    }
    
    // Cargar trabajadores en el select
    try {
        const response = await fetch(`${API_URL}/trabajadores`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('trabajadorSelect');
            select.innerHTML = '';
            
            result.data.forEach(trabajador => {
                select.innerHTML += `<option value="${trabajador.codigotrabajador}">${trabajador.codigotrabajador} - ${trabajador.apellidosnombres} (${trabajador.puestotrabajo})</option>`;
            });
        }
    } catch (error) {
        alert('Error al cargar trabajadores');
        return;
    }
    
    document.getElementById('formAsignacion').reset();
    modalAsignacion.classList.add('show');
}

function cerrarModalAsignacion() {
    modalAsignacion.classList.remove('show');
}

async function guardarAsignacion() {
    const trabajadorSelect = document.getElementById('trabajadorSelect');
    const tiempo = document.getElementById('tiempotrabajo').value;
    
    if (!trabajadorSelect.value || !tiempo) {
        alert('Complete todos los campos');
        return;
    }
    
    const datos = {
        codigoproducto: parseInt(productoSeleccionadoTiempos.codigo),
        producto: productoSeleccionadoTiempos.nombre,
        codigotrabajador: parseInt(trabajadorSelect.value),
        tiempotrabajo: parseFloat(tiempo)
    };
    
    try {
        const response = await fetch(`${API_URL}/recetas-mo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Trabajador asignado correctamente');
            cerrarModalAsignacion();
            cargarTiempos();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error al guardar: ' + error.message);
    }
}

async function eliminarAsignacion(codigoTrabajador) {
    if (confirm('¿Eliminar esta asignación?')) {
        try {
            const response = await fetch(`${API_URL}/recetas-mo/${codigoTrabajador}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Asignación eliminada');
                cargarTiempos();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    if (event.target === modalTrabajador) cerrarModalTrabajador();
    if (event.target === modalAsignacion) cerrarModalAsignacion();
}