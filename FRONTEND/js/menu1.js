// FRONTEND/js/menu1.js - Versión Corregida con el ID correcto del HTML

const MINIMO_PEDIDO_MOQ = 100; 
const MULTIPLO_EMPAQUE = 50;   
let carrito = [];
let listaProductosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Frontend de Cotizador Inicializado con éxito!");
    cargarCatalogoProductos();
    
    const form = document.getElementById('formCheckout');
    if (form) {
        form.addEventListener('submit', procesarOrdenCompra);
    }
});

async function cargarCatalogoProductos() {
    // 🎯 USAMOS EL ID EXACTO QUE TIENE TU ARCHIVO MENU1.HTML
    const contenedor = document.getElementById('productosContainer');
    if (!contenedor) {
        console.error("No se encontró el contenedor HTML 'productosContainer'. Verifica tu menu1.html");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/menu1/productos_costos`); 
        const result = await response.json();
        
        console.log("Datos del catálogo recibidos:", result);
        
        if (result.success && result.data && result.data.length > 0) {
            listaProductosGlobal = result.data;
            contenedor.innerHTML = ''; // Limpiamos el contenedor
            
            result.data.forEach(prod => {
                const id = prod.codigoproducto;
                const nombre = prod.producto || "Prenda Unik'a";
                
                // Mapeamos los campos limpios procesados por el backend
                const md = parseFloat(prod.materia_prima || 0);
                const mod = parseFloat(prod.mod || 0);
                const cif = parseFloat(prod.cif || 0);
                const ga = parseFloat(prod.ga || 0);      // ← NUEVO
                const gv = parseFloat(prod.gv || 0);      // ← NUEVO
                const costoTotalUnitario = parseFloat(prod.costo_total_unitario || 0);
                
                const precioNeto = parseFloat(prod.precio_neto || 0);
                const precioVentaPublico = parseFloat(prod.precio_venta_publico || 0);
                
                prod.precio_calculado_publico = precioVentaPublico;
                
                // Ruta de la imagen sirviéndose desde la carpeta del frontend
                const rutaImagen = `/static/imagenes/${id}.jpg`;
                
                const card = document.createElement('div');
                card.className = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between p-4";
                card.innerHTML = `
                    <div>
                        <div class="h-44 bg-gray-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                            <img src="${rutaImagen}" alt="${nombre}" 
                                 onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=Prenda+Industrial';" 
                                 class="h-full w-full object-cover">
                        </div>
                        <h2 class="font-bold text-gray-800 text-base truncate">${nombre.replace(/_/g, ' ')}</h2>
                        <span class="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">COD PT: ${id}</span>
                        
                        <div class="mt-2 text-xs text-gray-500 space-y-0.5 bg-gray-50 p-2 rounded-xl font-mono">
                            <div class="flex justify-between"><span>🧵 Mat. Prima (MD):</span><span class="font-bold text-gray-700">S/. ${md.toFixed(2)}</span></div>
                            <div class="flex justify-between"><span>👥 Mano Obra (MOD):</span><span class="font-bold text-gray-700">S/. ${mod.toFixed(2)}</span></div>
                            <div class="flex justify-between"><span>🏭 Indir. Fab (CIF):</span><span class="font-bold text-gray-700">S/. ${cif.toFixed(2)}</span></div>
                            <div class="flex justify-between"><span>📊 Gastos Admin (GA):</span><span class="font-bold text-gray-700">S/. ${ga.toFixed(2)}</span></div>
                            <div class="flex justify-between"><span>📈 Gastos Ventas (GV):</span><span class="font-bold text-gray-700">S/. ${gv.toFixed(2)}</span></div>
                            <div class="border-t pt-1 mt-1 flex justify-between text-gray-900 font-bold">
                                <span>Total Costo U:</span>
                                <span>S/. ${costoTotalUnitario.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="mt-2 text-xs text-gray-400 space-y-0.5 px-1 font-sans">
                            <div class="flex justify-between"><span>Valor Neto (+10%):</span><span>S/. ${precioNeto.toFixed(2)}</span></div>
                            <div class="flex justify-between"><span>IGV (18%):</span><span>S/. ${(precioNeto * 0.18).toFixed(2)}</span></div>
                        </div>
                        
                        <div class="text-lg font-black text-emerald-600 mt-2 pt-1 border-t border-dashed border-gray-100">
                            S/. ${precioVentaPublico.toFixed(2)} <span class="text-xs font-normal text-gray-400">(c/IGV)</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-gray-50">
                        <button onclick="verFichaTecnica(${id})" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition-all">
                            📋 Detalle
                        </button>
                        <button onclick="agregarAlCarrito(${id})" class="text-xs bg-[#FF9F1C] hover:bg-[#e08a10] text-white font-black py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1">
                            🛒 Añadir
                        </button>
                    </div>
                `;
                contenedor.appendChild(card);
            });
        } else {
            contenedor.innerHTML = `<p class="col-span-full text-center py-12 text-gray-400 font-medium">No se encontraron prendas registradas en la base de datos.</p>`;
        }
    } catch (error) {
        console.error("Error catálogo dinámico:", error);
        contenedor.innerHTML = `<p class="col-span-full text-center py-12 text-red-500 font-bold">Error al procesar la información de costos.</p>`;
    }
}

// =========================================================================
// 🛒 FUNCIONES COMPLEMENTARIAS DEL CARRITO
// =========================================================================
function verFichaTecnica(id) {
    const prod = listaProductosGlobal.find(p => p.codigoproducto === id);
    if (!prod) return;
    document.getElementById('fichaNombre').textContent = prod.producto || 'Prenda';
    document.getElementById('fichaCodigo').textContent = `PT - ${id}`;
    document.getElementById('fichaPrecio').textContent = `S/. ${parseFloat(prod.precio_venta_publico || 45).toFixed(2)}`;
    document.getElementById('fichaDescripcion').textContent = prod.descripcion || "Prenda de alta costura confeccionada en las instalaciones de Unik'a.";
    document.getElementById('fichaImagen').src = `/static/imagenes/${id}.jpg`;
    const modal = document.getElementById('modalFicha');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function cerrarModalFicha() {
    const modal = document.getElementById('modalFicha');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function agregarAlCarrito(id) {
    const prod = listaProductosGlobal.find(p => p.codigoproducto === id);
    if (!prod) return;
    let cantidadInput = prompt(`🏭 PEDIDO INDUSTRIAL MAYORISTA\n\n• MOQ: ${MINIMO_PEDIDO_MOQ} und.\n• Múltiplos: ${MULTIPLO_EMPAQUE} und.\n\n¿Cantidad a solicitar?`);
    if (cantidadInput === null) return;
    let cantidad = parseInt(cantidadInput);
    if (isNaN(cantidad) || cantidad < MINIMO_PEDIDO_MOQ || cantidad % MULTIPLO_EMPAQUE !== 0) {
        alert("Cantidad inválida o no cumple las restricciones de lote.");
        return;
    }
    const itemEnCarrito = carrito.find(item => item.codigoproducto === id);
    if (itemEnCarrito) { itemEnCarrito.cantidad += cantidad; } 
    else {
        carrito.push({
            codigoproducto: prod.codigoproducto,
            producto: prod.producto || 'Prenda',
            precio: prod.precio_venta_publico, 
            cantidad: cantidad
        });
    }
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('listaCarrito');
    const totalLabel = document.getElementById('totalCarrito');
    const contador = document.getElementById('contadorCarrito');
    if (!lista) return; lista.innerHTML = ''; let total = 0; let itemsTotales = 0;
    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad; total += subtotal; itemsTotales += item.cantidad;
        const row = document.createElement('div'); row.className = "py-3 flex items-center justify-between text-sm";
        row.innerHTML = `<div><div class="font-bold text-gray-800">${item.producto}</div><div class="text-xs text-gray-400">S/. ${item.precio.toFixed(2)} x ${item.cantidad}</div></div><div class="flex items-center gap-3"><span class="font-black text-gray-900">S/. ${subtotal.toFixed(2)}</span><button onclick="eliminarDelCarrito(${index})" class="text-red-500"><span class="material-symbols-outlined text-sm">delete</span></button></div>`;
        lista.appendChild(row);
    });
    if (totalLabel) totalLabel.textContent = `S/. ${total.toFixed(2)}`;
    if (contador) contador.textContent = itemsTotales;
}

function eliminarDelCarrito(index) { carrito.splice(index, 1); actualizarVistaCarrito(); }
function toggleCarrito() { const panel = document.getElementById('panelCarrito'); if (panel) panel.classList.toggle('translate-x-full'); }

async function procesarOrdenCompra(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("El carrito está vacío.");
    const payload = {
        cliente_nombre: document.getElementById('cliNombre').value,
        cliente_correo: document.getElementById('cliCorreo').value,
        tarjeta_numero: document.getElementById('bankTarjeta').value, 
        items: carrito
    };
    try {
        const response = await fetch(`${API_URL}/menu1/orden`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            alert(`🎉 Orden cargada con éxito!\nCódigo: ${result.codigo_orden}`);
            carrito = []; actualizarVistaCarrito(); toggleCarrito(); document.getElementById('formCheckout').reset();
        } else { alert("Error: " + result.error); }
    } catch (error) { alert("Error de conexión."); }
}