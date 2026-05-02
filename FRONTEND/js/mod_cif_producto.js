// Configuración de la API
const API_URL = 'http://localhost:5000/api';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarMeses();
    cargarProductos();
});

// Cargar meses para el filtro
async function cargarMeses() {
    try {
        const response = await fetch(`${API_URL}/mod-cif/meses`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('mesSelect');
            result.data.meses.forEach((mes, index) => {
                const nombreMes = result.data.meses_formato[index];
                select.innerHTML += `<option value="${mes}">${mes} - ${nombreMes}</option>`;
            });
        }
    } catch (error) {
        console.error('Error al cargar meses:', error);
    }
}

// Cargar lista de productos
async function cargarProductos() {
    const mes = document.getElementById('mesSelect').value;
    
    try {
        const response = await fetch(`${API_URL}/mod-cif/productos?mes=${mes}`);
        const result = await response.json();
        
        if (result.success) {
            const container = document.getElementById('listaProductos');
            
            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icono">📭</div>
                        <p>No hay productos en este periodo</p>
                    </div>
                `;
            } else {
                container.innerHTML = result.data.map(p => `
                    <div class="producto-item" onclick="seleccionarProducto(${p.codigo})" id="prod-${p.codigo}">
                        <div class="indicador"></div>
                        <div class="info">
                            <div class="codigo">COD: ${p.codigo}</div>
                            <div class="nombre">${p.nombre}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Seleccionar producto y calcular costos
async function seleccionarProducto(codigo) {
    // Marcar visualmente
    document.querySelectorAll('.producto-item').forEach(item => item.classList.remove('seleccionado'));
    const item = document.getElementById(`prod-${codigo}`);
    if (item) item.classList.add('seleccionado');
    
    try {
        const response = await fetch(`${API_URL}/mod-cif/calcular/${codigo}`);
        const result = await response.json();
        
        if (result.success) {
            renderizarResultados(result.data);
        }
    } catch (error) {
        console.error('Error al calcular:', error);
    }
}

// Renderizar resultados
function renderizarResultados(data) {
    const panel = document.getElementById('panelResultados');
    
    let html = `
        <div class="producto-titulo">
            Producto: ${data.producto.codigo} - ${data.producto.nombre}
        </div>
    `;
    
    if (data.usa_base) {
        html += `<div class="aviso">⚠ Sin receta MOD propia. Se usa MOD base del producto 21001.</div>`;
    }
    
    // ── BLOQUE MOD ──
    html += `
        <div class="bloque">
            <div class="bloque-titulo mod">🔧 Mano de Obra Directa (MOD)</div>
            <div class="bloque-tabla">
                <table>
                    <thead>
                        <tr>
                            <th>PERSONAL</th>
                            <th>SUELDO</th>
                            <th>MINUTOS</th>
                            <th>COSTO MIN.</th>
                            <th>IMPORTE</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (data.mod.items.length === 0) {
        html += `<tr><td colspan="5" style="padding:20px;color:#9ca3af;">Sin datos MOD</td></tr>`;
    } else {
        data.mod.items.forEach(item => {
            html += `
                <tr>
                    <td>${item.personal}</td>
                    <td>${item.sueldo.toFixed(2)}</td>
                    <td>${item.minutos.toFixed(2)}</td>
                    <td>${item.costo_min.toFixed(2)}</td>
                    <td>${item.importe.toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    html += `
                    </tbody>
                </table>
            </div>
            <div class="bloque-total mod">
                TOTAL MOD UNITARIO: S/ ${data.mod.total.toFixed(2)}
            </div>
        </div>
    `;
    
    // ── BLOQUE MOI / CIF ──
    html += `
        <div class="bloque">
            <div class="bloque-titulo moi">🏭 Costos Indirectos de Producción (CIF)</div>
            <div class="bloque-tabla">
                <table>
                    <thead>
                        <tr>
                            <th>CONCEPTO</th>
                            <th>MONTO</th>
                            <th>FACTOR</th>
                            <th>BASE</th>
                            <th>IMPORTE</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (data.moi.items.length === 0) {
        html += `<tr><td colspan="5" style="padding:20px;color:#9ca3af;">Sin datos CIF</td></tr>`;
    } else {
        data.moi.items.forEach(item => {
            html += `
                <tr>
                    <td>${item.concepto}</td>
                    <td>${item.monto.toFixed(2)}</td>
                    <td>${item.factor.toFixed(2)}</td>
                    <td>${item.base.toFixed(2)}</td>
                    <td>${item.importe.toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    html += `
                    </tbody>
                </table>
            </div>
            <div class="bloque-total moi">
                TOTAL MOI / CIF UNITARIO: S/ ${data.moi.total.toFixed(2)}
            </div>
        </div>
    `;
    
    // ── TOTAL GENERAL ──
    html += `
        <div class="total-general">
            COSTO UNITARIO TOTAL DEL PRODUCTO: S/ ${data.total_general.toFixed(2)}
        </div>
    `;
    
    panel.innerHTML = html;
}