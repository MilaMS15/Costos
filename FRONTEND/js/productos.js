// Configuración de la API
// API_URL se toma de config.js


// Elementos del DOM
let modalProducto;
let modalReceta;
let productoSeleccionado = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    modalProducto = document.getElementById('modalProducto');
    modalReceta = document.getElementById('modalReceta');
    cargarProductos();
    cargarProductosEnSelect();
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
// FUNCIONES DE PRODUCTOS
// ============================================
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const result = await response.json();

        if (result.success) {
            const tbody = document.querySelector('#tablaProductos tbody');
            tbody.innerHTML = '';

            result.data.forEach(producto => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${producto.codigoproducto || ''}</td>
                    <td>${producto.producto || ''}</td>
                    <td>${(producto.descripcion || '').substring(0, 50)}...</td>
                    <td>${producto.fecharegistro || ''}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="generarYMostrarQR('${producto.codigoproducto}', '${producto.producto.replace(/'/g, "\\'")}', 'Producto Terminado (PT)')" title="Ver QR">🔲</button>
                        <button class="btn btn-warning btn-sm" onclick="editarProducto('${producto.codigoproducto}')">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${producto.codigoproducto}')">🗑️</button>
                    </td>
                `;
            });
        }
    } catch (error) {
        alert('Error al cargar productos: ' + error.message);
    }
}

function abrirFormularioProducto(producto = null) {
    document.getElementById('formProducto').reset();
    
    if (producto) {
        document.getElementById('modalTituloProducto').textContent = 'Editar Producto';
        document.getElementById('editandoProducto').value = 'true';
        document.getElementById('codigoproducto').value = producto.codigoproducto;
        document.getElementById('codigoproducto').readOnly = true;
        document.getElementById('producto').value = producto.producto;
        document.getElementById('descripcionProducto').value = producto.descripcion || '';
    } else {
        document.getElementById('modalTituloProducto').textContent = 'Nuevo Producto';
        document.getElementById('editandoProducto').value = 'false';
        document.getElementById('codigoproducto').readOnly = false;
    }
    
    modalProducto.classList.add('show');
}

function cerrarModalProducto() {
    modalProducto.classList.remove('show');
}

async function editarProducto(codigo) {
    try {
        const response = await fetch(`${API_URL}/productos/${codigo}`);
        const result = await response.json();
        
        if (result.success) {
            abrirFormularioProducto(result.data);
        }
    } catch (error) {
        alert('Error al buscar producto');
    }
}

async function guardarProducto() {
    const editando = document.getElementById('editandoProducto').value === 'true';
    const codigo = document.getElementById('codigoproducto').value;
    
    const datos = {
        codigoproducto: parseInt(codigo),
        producto: document.getElementById('producto').value,
        descripcion: document.getElementById('descripcionProducto').value
    };
    
    if (!datos.codigoproducto || !datos.producto) {
        alert('Código y Producto son campos requeridos');
        return;
    }
    
    try {
        const url = editando ? `${API_URL}/productos/${codigo}` : `${API_URL}/productos`;
        const method = editando ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(editando ? 'Producto actualizado' : 'Producto creado');
            cerrarModalProducto();
            cargarProductos();
            cargarProductosEnSelect();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error al guardar: ' + error.message);
    }
}

async function eliminarProducto(codigo) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        try {
            const response = await fetch(`${API_URL}/productos/${codigo}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Producto eliminado');
                cargarProductos();
                cargarProductosEnSelect();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }
}

// ============================================
// FUNCIONES DE RECETAS
// ============================================
async function cargarProductosEnSelect() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('productoSelect');
            select.innerHTML = '<option value="">-- Seleccione un producto --</option>';
            
            result.data.forEach(producto => {
                select.innerHTML += `<option value="${producto.codigoproducto}">${producto.codigoproducto} - ${producto.producto}</option>`;
            });
        }
    } catch (error) {
        alert('Error al cargar productos: ' + error.message);
    }
}

async function cargarReceta() {
    const codigoProducto = document.getElementById('productoSelect').value;
    
    if (!codigoProducto) {
        document.querySelector('#tablaRecetas tbody').innerHTML = '';
        return;
    }
    
    productoSeleccionado = {
        codigo: codigoProducto,
        nombre: document.getElementById('productoSelect').selectedOptions[0].text.split(' - ')[1]
    };
    
    try {
        const response = await fetch(`${API_URL}/recetas-producto?codigoproducto=${codigoProducto}`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#tablaRecetas tbody');
            tbody.innerHTML = '';
            
            result.data.forEach(receta => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${receta.codigomaterial || ''}</td>
                    <td>${receta.material || ''}</td>
                    <td>${receta.cantidadnecesaria || ''}</td>
                    <td>${receta.unidadmedida || ''}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="eliminarMaterialReceta('${receta.codigomaterial}')">🗑️</button>
                    </td>
                `;
            });
        }
    } catch (error) {
        alert('Error al cargar receta: ' + error.message);
    }
}

async function agregarMaterialReceta() {
    if (!productoSeleccionado) {
        alert('Primero seleccione un producto');
        return;
    }
    
    // Cargar materiales en el select
    try {
        const response = await fetch(`${API_URL}/materiales`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('materialSelect');
            select.innerHTML = '';
            
            result.data.forEach(material => {
                select.innerHTML += `<option value="${material.codigomaterial}">${material.codigomaterial} - ${material.material}</option>`;
            });
        }
    } catch (error) {
        alert('Error al cargar materiales');
        return;
    }
    
    document.getElementById('formReceta').reset();
    modalReceta.classList.add('show');
}

function cerrarModalReceta() {
    modalReceta.classList.remove('show');
}

async function guardarMaterialReceta() {
    const materialSelect = document.getElementById('materialSelect');
    const cantidad = document.getElementById('cantidadnecesaria').value;
    const unidad = document.getElementById('unidadmedidaReceta').value;
    
    if (!materialSelect.value || !cantidad) {
        alert('Complete todos los campos');
        return;
    }
    
    const materialInfo = materialSelect.selectedOptions[0].text.split(' - ');
    
    const datos = {
        codigoproducto: parseInt(productoSeleccionado.codigo),
        producto: productoSeleccionado.nombre,
        codigomaterial: parseInt(materialInfo[0]),
        material: materialInfo[1],
        cantidadnecesaria: parseFloat(cantidad),
        unidadmedida: unidad
    };
    
    try {
        const response = await fetch(`${API_URL}/recetas-producto`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Material agregado a la receta');
            cerrarModalReceta();
            cargarReceta();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error al guardar: ' + error.message);
    }
}

async function eliminarMaterialReceta(codigoMaterial) {
    if (confirm('¿Eliminar este material de la receta?')) {
        try {
            const response = await fetch(`${API_URL}/recetas-producto/${codigoMaterial}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Material eliminado de la receta');
                cargarReceta();
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
    if (event.target === modalProducto) cerrarModalProducto();
    if (event.target === modalReceta) cerrarModalReceta();
}
function generarYMostrarQR(idSupabase, nombreItem, tipoItem) {
    document.getElementById('modalQR').classList.remove('hidden');
    document.getElementById('qrModalTitulo').textContent = nombreItem;
    document.getElementById('qrModalSubtitulo').textContent = tipoItem;
    document.getElementById('qrModalCodigo').textContent = `ID: ${idSupabase}`;

    const contenedor = document.getElementById('contenedorQR');
    contenedor.innerHTML = "";

    new QRCode(contenedor, {
        text: idSupabase.toString(),
        width: 150,
        height: 150,
        correctLevel: QRCode.CorrectLevel.H
    });
}

function cerrarModalQR() {
    document.getElementById('modalQR').classList.add('hidden');
}