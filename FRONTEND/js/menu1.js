// FRONTEND/js/menu1.js - Gestión Comercial, Carrito y Pasarela Bancaria

let carrito = [];
let listaProductosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogoProductos();
    
    const form = document.getElementById('formCheckout');
    if (form) {
        form.addEventListener('submit', procesarOrdenCompra);
    }
});

// 🔄 1. Jalar los productos reales desde el backend
async function cargarCatalogoProductos() {
    const contenedor = document.getElementById('contenedorProductos');
    if (!contenedor) return;
    
    try {
        const response = await fetch(`${API_URL}/productos`); // Consume tu tabla real de ProductoService
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            listaProductosGlobal = result.data;
            contenedor.innerHTML = '';
            
            result.data.forEach(prod => {
                const id = prod.codigoproducto;
                const nombre = prod.producto || 'Producto';
                const precio = parseFloat(prod.precio_venta || prod.precio || 45.00);
                
                // 🔥 RUTA DE FOTO INTELIGENTE: Si guardas la foto en 'static/imagenes/' con el id de Supabase
                const rutaImagen = `static/imagenes/${id}.jpg`;
                
                const card = document.createElement('div');
                card.className = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between p-4";
                card.innerHTML = `
                    <div>
                        <div class="h-44 bg-gray-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                            <img src="${rutaImagen}" alt="${nombre}" onerror="this.src='https://placehold.co/300x300?text=Textil+Unika'" class="h-full w-full object-cover">
                        </div>
                        <h2 class="font-bold text-gray-800 text-base truncate">${nombre}</h2>
                        <span class="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">ID PT: ${id}</span>
                        <div class="text-lg font-black text-[#1e3a8a] mt-2">S/. ${precio.toFixed(2)}</div>
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
            contenedor.innerHTML = `<p class="col-span-full text-center py-12 text-gray-400 font-medium">No hay productos registrados en el catálogo comercial.</p>`;
        }
    } catch (error) {
        console.error("Error catálogo:", error);
        contenedor.innerHTML = `<p class="col-span-full text-center py-12 text-red-500 font-bold">Error de conexión con la API.</p>`;
    }
}

// 📋 2. Abrir Modal de Ficha Técnica
function verFichaTecnica(id) {
    const prod = listaProductosGlobal.find(p => p.codigoproducto === id);
    if (!prod) return;
    
    document.getElementById('fichaNombre').textContent = prod.producto;
    document.getElementById('fichaCodigo').textContent = `PT - ${prod.codigoproducto}`;
    document.getElementById('fichaPrecio').textContent = `S/. ${parseFloat(prod.precio_venta || 45).toFixed(2)}`;
    document.getElementById('fichaDescripcion').textContent = prod.descripcion || "Prenda de alta costura confeccionada en las instalaciones de Unik'a. Alta durabilidad y excelente acabado en costuras.";
    document.getElementById('fichaImagen').src = `static/imagenes/${id}.jpg`;
    
    const modal = document.getElementById('modalFicha');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function cerrarModalFicha() {
    const modal = document.getElementById('modalFicha');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// 🛒 3. Lógica del Carrito Interno
// FRONTEND/js/menu1.js - Versión Industrial (Lotes Mayoristas y Múltiplos)

// Parámetros industriales configurables
const MINIMO_PEDIDO_MOQ = 100; // Cantidad mínima que se puede pedir
const MULTIPLO_EMPAQUE = 50;   // Múltiplos de producción (Ej: Paquetes de 50 und)

function agregarAlCarrito(id) {
    const prod = listaProductosGlobal.find(p => p.codigoproducto === id);
    if (!prod) return;
    
    // 🏭 Preguntar al cliente la cantidad con la restricción industrial visible
    let cantidadInput = prompt(
        `🏭 PRODUCTO INDUSTRIAL: ${prod.producto}\n\n` +
        `• Pedido Mínimo (MOQ): ${MINIMO_PEDIDO_MOQ} unidades.\n` +
        `• El pedido debe ser en múltiplos de: ${MULTIPLO_EMPAQUE} unidades.\n\n` +
        `¿Qué cantidad en masa desea solicitar?`
    );
    
    if (cantidadInput === null) return; // Si cancela el prompt
    
    let cantidad = parseInt(cantidadInput);
    
    // 🚨 VALIDACIÓN 1: Evaluar el Pedido Mínimo (MOQ)
    if (isNaN(cantidad) || cantidad < MINIMO_PEDIDO_MOQ) {
        alert(`❌ ERROR DE COMPRA:\nLa cantidad solicitada es menor al lote mínimo de producción (${MINIMO_PEDIDO_MOQ} unidades). No cubre los costos de preparación de máquinas.`);
        return;
    }
    
    // 🚨 VALIDACIÓN 2: Evaluar si es múltiplo exacto del empaque industrial
    if (cantidad % MULTIPLO_EMPAQUE !== 0) {
        // Calculamos el múltiplo sugerido más cercano hacia arriba
        let sugerido = Math.ceil(cantidad / MULTIPLO_EMPAQUE) * MULTIPLO_EMPAQUE;
        alert(`❌ ERROR DE EMPAQUE:\nLa cantidad ${cantidad} no coincide con nuestros empaques en masa. Debe solicitar múltiplos de ${MULTIPLO_EMPAQUE} unidades.\n\n💡 Sugerencia para su lote: Solicite ${sugerido} unidades.`);
        return;
    }
    
    // Si pasa el filtro industrial, se añade al carrito
    const itemEnCarrito = carrito.find(item => item.codigoproducto === id);
    if (itemEnCarrito) {
        itemEnCarrito.cantidad += cantidad;
    } else {
        carrito.push({
            codigoproducto: prod.codigoproducto,
            producto: prod.producto,
            precio: parseFloat(prod.precio_venta || prod.precio || 45.00),
            cantidad: cantidad
        });
    }
    actualizarVistaCarrito();
    alert(`📦 ¡Lote de ${cantidad} unidades añadido al carrito con éxito!`);
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('listaCarrito');
    const totalLabel = document.getElementById('totalCarrito');
    const contador = document.getElementById('contadorCarrito');
    
    lista.innerHTML = '';
    let total = 0;
    let itemsTotales = 0;
    
    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        itemsTotales += item.cantidad;
        
        const row = document.createElement('div');
        row.className = "py-3 flex items-center justify-between text-sm";
        row.innerHTML = `
            <div>
                <div class="font-bold text-gray-800">${item.producto}</div>
                <div class="text-xs text-gray-400">S/. ${item.precio.toFixed(2)} x ${item.cantidad}</div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-black text-gray-900">S/. ${subtotal.toFixed(2)}</span>
                <button onclick="eliminarDelCarrito(${index})" class="text-red-500 hover:text-red-700">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            </div>
        `;
        lista.appendChild(row);
    });
    
    totalLabel.textContent = `S/. ${total.toFixed(2)}`;
    contador.textContent = itemsTotales;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarVistaCarrito();
}

function toggleCarrito() {
    const panel = document.getElementById('panelCarrito');
    panel.classList.toggle('translate-x-full');
}

// 💳 4. PROCESAR ORDEN DE COMPRA (PASARELA BANCARIA)
async function procesarOrdenCompra(e) {
    e.preventDefault();
    if (carrito.length === 0) {
        alert("El carrito está vacío. Añade algunos productos textiles antes de pagar.");
        return;
    }
    
    const payload = {
        cliente_nombre: document.getElementById('cliNombre').value,
        cliente_correo: document.getElementById('cliCorreo').value,
        tarjeta_numero: document.getElementById('bankTarjeta').value, // Solo para simular
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
            alert(`🎉 ¡Orden de Compra cargada con éxito!\n\nCódigo de OC: ${result.codigo_orden}\nEstado: VALIDADO Y PAGADO.\nEl inventario ha sido actualizado.`);
            carrito = [];
            actualizarVistaCarrito();
            toggleCarrito();
            document.getElementById('formCheckout').reset();
        } else {
            alert("Error al procesar la compra: " + result.error);
        }
    } catch (error) {
        console.error("Error en checkout:", error);
        alert("Error crítico de conexión al procesar la orden.");
    }
}