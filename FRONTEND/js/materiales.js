// Configuración de la API
// API_URL se toma de config.js


// Elementos del DOM
let modal;
let formMaterial;
let tablaMateriales;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    modal = document.getElementById('modalMaterial');
    formMaterial = document.getElementById('formMaterial');
    cargarMateriales();
});

// Cargar todos los materiales
// Cargar todos los materiales (Versión Automatizada con QR)
// Cargar todos los materiales (Versión corregida sin errores de comillas)
async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tablaMateriales tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(material => {
                const row = tbody.insertRow();
                
                // 1. Aseguramos los datos en variables limpias para evitar que rompan el HTML
                const codigo = material.codigomaterial ? material.codigomaterial.toString() : '';
                const nombre = (material.material || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
                const descripcion = (material.descripcion || '').substring(0, 50) + '...';
                const tipo = material.tipomaterial || 'MP';
                const unidad = material.unidadmedida || 'Kg';
                const costo = (material.costounitario || 0).toFixed(2);
                const stock = material.stockseguridad || '0';
                
                // 2. Inyectamos el HTML usando de forma segura las variables limpias
                row.innerHTML = `
                    <td>${codigo}</td>
                    <td>${material.material || ''}</td>
                    <td>${descripcion}</td>
                    <td>${tipo}</td>
                    <td>${unidad}</td>
                    <td>S/. ${costo}</td>
                    <td>${stock}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="generarYMostrarQR('${codigo}', '${nombre}', 'Materia Prima / Insumo')" title="Ver Código QR">🔲</button>
                        
                        <button class="btn btn-warning btn-sm" onclick="editarMaterial('${codigo}')">✏️</button>
                        
                        <button class="btn btn-danger btn-sm" onclick="eliminarMaterial('${codigo}')">🗑️</button>
                    </td>
                `;
            });
        }
    } catch (error) {
        alert('Error al cargar materiales: ' + error.message);
    }
}

// Abrir formulario para nuevo/editar
function abrirFormulario(material = null) {
    formMaterial.reset();
    
    if (material) {
        document.getElementById('modalTitulo').textContent = 'Editar Material';
        document.getElementById('editando').value = 'true';
        document.getElementById('codigomaterial').value = material.codigomaterial;
        document.getElementById('codigomaterial').readOnly = true;
        document.getElementById('material').value = material.material;
        document.getElementById('descripcion').value = material.descripcion || '';
        document.getElementById('tipomaterial').value = material.tipomaterial || 'MP';
        document.getElementById('unidadmedida').value = material.unidadmedida || 'Kg';
        document.getElementById('proveedor').value = material.proveedor || '';
        document.getElementById('costounitario').value = material.costounitario || '';
        document.getElementById('stockseguridad').value = material.stockseguridad || '';
    } else {
        document.getElementById('modalTitulo').textContent = 'Nuevo Material';
        document.getElementById('editando').value = 'false';
        document.getElementById('codigomaterial').readOnly = false;
    }
    
    modal.classList.add('show');
}

// Cerrar modal
function cerrarModal() {
    modal.classList.remove('show');
}

// Editar material
async function editarMaterial(codigo) {
    try {
        const response = await fetch(`${API_URL}/materiales/${codigo}`);
        const result = await response.json();
        
        if (result.success) {
            abrirFormulario(result.data);
        }
    } catch (error) {
        alert('Error al buscar material');
    }
}

// Guardar material
async function guardarMaterial() {
    const editando = document.getElementById('editando').value === 'true';
    const codigo = document.getElementById('codigomaterial').value;
    
    const datos = {
        codigomaterial: parseInt(codigo),
        material: document.getElementById('material').value,
        descripcion: document.getElementById('descripcion').value,
        tipomaterial: document.getElementById('tipomaterial').value,
        unidadmedida: document.getElementById('unidadmedida').value,
        proveedor: document.getElementById('proveedor').value,
        costounitario: parseFloat(document.getElementById('costounitario').value) || 0,
        stockseguridad: parseFloat(document.getElementById('stockseguridad').value) || 0
    };
    
    if (!datos.codigomaterial || !datos.material) {
        alert('Código y Material son campos requeridos');
        return;
    }
    
    try {
        const url = editando ? `${API_URL}/materiales/${codigo}` : `${API_URL}/materiales`;
        const method = editando ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(editando ? 'Material actualizado' : 'Material creado');
            cerrarModal();
            cargarMateriales();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error al guardar: ' + error.message);
    }
}

// Eliminar material
async function eliminarMaterial(codigo) {
    if (confirm('¿Está seguro de eliminar este material?')) {
        try {
            const response = await fetch(`${API_URL}/materiales/${codigo}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Material eliminado');
                cargarMateriales();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    if (event.target === modal) {
        cerrarModal();
    }
}
// LÓGICA GENERAL PARA EL MODAL DEL CÓDIGO QR
function generarYMostrarQR(idSupabase, nombreItem, tipoItem) {
    document.getElementById('modalQR').classList.remove('hidden');
    document.getElementById('qrModalTitulo').textContent = nombreItem;
    document.getElementById('qrModalSubtitulo').textContent = tipoItem;
    document.getElementById('qrModalCodigo').textContent = `ID: ${idSupabase}`;
    
    const contenedor = document.getElementById('contenedorQR');
    contenedor.innerHTML = ""; // Limpiamos el código QR anterior
    
    // El QR codifica estrictamente el ID numérico que espera tu backend móvil
    new QRCode(contenedor, {
        text: idSupabase.toString(),
        width: 150,
        height: 150,
        correctLevel: QRCode.CorrectLevel.H // Alta tolerancia a reflejos de pantallas
    });
}

function cerrarModalQR() {
    document.getElementById('modalQR').classList.add('hidden');
}
