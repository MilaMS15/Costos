// Configuración de la API
const API_URL = 'http://localhost:5000/api';

// Elementos
let productoSeleccionado = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarMeses();
});

// Cargar meses disponibles
async function cargarMeses() {
    try {
        const response = await fetch(`${API_URL}/receta-producto/meses`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('mesSelect');
            select.innerHTML = '<option value="">-- Seleccione un mes --</option>';
            
            result.data.meses.forEach((mes, index) => {
                const nombreMes = result.data.meses_formato[index];
                select.innerHTML += `<option value="${mes}">${nombreMes}</option>`;
            });
        }
    } catch (error) {
        console.error('Error al cargar meses:', error);
    }
}

// Cargar productos del mes seleccionado
async function cargarProductos() {
    const mes = document.getElementById('mesSelect').value;
    if (!mes) {
        document.getElementById('listaProductos').innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>Seleccione un mes para ver productos</p>
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/receta-producto/productos-por-mes/${mes}`);
        const result = await response.json();
        
        if (result.success) {
            const container = document.getElementById('listaProductos');
            document.getElementById('cantidadProductos').textContent = `(${result.data.length} productos)`;
            
            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📭</div>
                        <p>No hay productos registrados en este mes</p>
                    </div>
                `;
            } else {
                container.innerHTML = result.data.map(p => `
                    <div class="producto-card" onclick="seleccionarProducto(${p.codigo}, '${p.nombre.replace(/'/g, "\\'")}')" 
                         id="prod-${p.codigo}">
                        <div class="codigo">📦 Código: ${p.codigo}</div>
                        <div class="nombre">${p.nombre}</div>
                        <div class="descripcion">${p.descripcion || 'Sin descripción'}</div>
                    </div>
                `).join('');
            }
            
            // Limpiar selección anterior
            productoSeleccionado = null;
            limpiarMateriales();
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Seleccionar producto y cargar sus materiales
async function seleccionarProducto(codigo, nombre) {
    productoSeleccionado = { codigo, nombre };
    
    // Marcar visualmente
    document.querySelectorAll('.producto-card').forEach(card => card.classList.remove('selected'));
    const card = document.getElementById(`prod-${codigo}`);
    if (card) card.classList.add('selected');
    
    document.getElementById('nombreProductoSeleccionado').textContent = `- ${nombre}`;
    
    // Cargar materiales
    try {
        const response = await fetch(`${API_URL}/receta-producto/materiales/${codigo}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            const tbody = document.getElementById('tablaMaterialesBody');
            
            // Actualizar costo total
            document.getElementById('costoTotal').textContent = `S/ ${data.costo_total.toFixed(2)}`;
            
            if (data.materiales.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            <div class="empty-state">
                                <div class="icon">📭</div>
                                <p>Este producto no tiene materiales registrados</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = data.materiales.map(m => `
                    <tr>
                        <td style="font-weight:bold;">${m.codigo_mp || '-'}</td>
                        <td>${m.material || '-'}</td>
                        <td>${m.unidad || '-'}</td>
                        <td>${m.cantidad.toFixed(6)}</td>
                        <td>${m.costo_unitario.toFixed(4)}</td>
                        <td style="font-weight:bold;">${m.subtotal.toFixed(4)}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error al cargar materiales:', error);
    }
}

// Limpiar panel de materiales
function limpiarMateriales() {
    document.getElementById('costoTotal').textContent = 'S/ 0.00';
    document.getElementById('nombreProductoSeleccionado').textContent = '';
    document.getElementById('tablaMaterialesBody').innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    <div class="icon">👈</div>
                    <p>Seleccione un producto para ver sus materiales</p>
                </div>
            </td>
        </tr>
    `;
}