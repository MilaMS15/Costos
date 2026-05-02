// Configuración de la API
const API_URL = 'http://localhost:5000/api';

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
async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tablaMateriales tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(material => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${material.codigomaterial || ''}</td>
                    <td>${material.material || ''}</td>
                    <td>${(material.descripcion || '').substring(0, 50)}...</td>
                    <td>${material.tipomaterial || ''}</td>
                    <td>${material.unidadmedida || ''}</td>
                    <td>S/. ${(material.costounitario || 0).toFixed(2)}</td>
                    <td>${material.stockseguridad || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editarMaterial('${material.codigomaterial}')">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarMaterial('${material.codigomaterial}')">🗑️</button>
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