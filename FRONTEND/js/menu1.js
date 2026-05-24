// FRONTEND/js/menu1.js - Versión Optimizada y Corrección de Eventos

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

    // Cierre del modal dando clic afuera (en el fondo oscuro)
    const modalFicha = document.getElementById('modalFicha');
    if(modalFicha) {
        modalFicha.addEventListener('click', function(e) {
            if (e.target === this) {
                window.cerrarModalFicha();
            }
        });
    }
});

async function cargarCatalogoProductos() {
    const contenedor = document.getElementById('productosContainer');
    if (!contenedor) return;
    
    try {
        const response = await fetch(`${API_URL}/menu1/productos_costos`); 
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            listaProductosGlobal = result.data;
            contenedor.innerHTML = ''; 
            
            result.data.forEach(prod => {
                const id = prod.codigoproducto;
                const nombre = prod.producto || "Producto Industrial";
                const md = parseFloat(prod.materia_prima || 0);
                const mod = parseFloat(prod.mod || 0);
                const cif = parseFloat(prod.cif || 0);
                const ga = parseFloat(prod.ga || 0);
                const gv = parseFloat(prod.gv || 0);
                const costoTotalUnitario = parseFloat(prod.costo_total_unitario || 0);
                const precioVentaPublico = parseFloat(prod.precio_venta_publico || 0);
                
                const rutaImagen = `/static/imagenes/${id}.jpg`;
                
                const card = document.createElement('div');
                card.className = "bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-5 group relative";
                card.innerHTML = `
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div class="relative z-10">
                        <div class="h-48 bg-slate-50/50 rounded-2xl overflow-hidden mb-4 flex items-center justify-center border border-slate-50 p-2">
                            <img src="${rutaImagen}" alt="${nombre}" 
                                 onerror="this.onerror=null; this.src='https://placehold.co/300x300/F8FAFC/94A3B8?text=Sin+Imagen';" 
                                 class="h-full w-full object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                        </div>
                        <h2 class="font-extrabold text-brand-dark text-lg leading-tight mb-1">${nombre.replace(/_/g, ' ')}</h2>
                        <span class="text-[10px] font-mono font-bold text-brand-accent bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md inline-block mb-3">COD: ${id}</span>
                        
                        <div class="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl font-inter text-[11px] text-slate-600 border border-slate-200 shadow-inner">
                            <div class="flex justify-between items-center group/item cursor-default">
                                <span class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[15px] text-blue-500 group-hover/item:scale-125 transition-transform">category</span>
                                    <span class="font-medium">Material Directo <span class="text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-1">MD</span></span>
                                </span>
                                <span class="font-mono font-bold text-slate-700">S/. ${md.toFixed(2)}</span>
                            </div>
                            
                            <div class="flex justify-between items-center group/item cursor-default">
                                <span class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[15px] text-amber-500 group-hover/item:scale-125 transition-transform">engineering</span>
                                    <span class="font-medium">Mano de Obra <span class="text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-1">MOD</span></span>
                                </span>
                                <span class="font-mono font-bold text-slate-700">S/. ${mod.toFixed(2)}</span>
                            </div>
                            
                            <div class="flex justify-between items-center group/item cursor-default">
                                <span class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[15px] text-purple-500 group-hover/item:scale-125 transition-transform">factory</span>
                                    <span class="font-medium">Costos Indirectos <span class="text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-1">CIF</span></span>
                                </span>
                                <span class="font-mono font-bold text-slate-700">S/. ${cif.toFixed(2)}</span>
                            </div>
                            
                            <div class="flex justify-between items-center group/item cursor-default">
                                <span class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[15px] text-teal-500 group-hover/item:scale-125 transition-transform">domain</span>
                                    <span class="font-medium">Gastos Admin. <span class="text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-1">GA</span></span>
                                </span>
                                <span class="font-mono font-bold text-slate-700">S/. ${ga.toFixed(2)}</span>
                            </div>
                            
                            <div class="flex justify-between items-center group/item cursor-default">
                                <span class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[15px] text-emerald-500 group-hover/item:scale-125 transition-transform">storefront</span>
                                    <span class="font-medium">Gastos de Ventas <span class="text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-1">GV</span></span>
                                </span>
                                <span class="font-mono font-bold text-slate-700">S/. ${gv.toFixed(2)}</span>
                            </div>
                            
                            <div class="border-t border-slate-200 pt-2.5 mt-2 flex justify-between items-center">
                                <span class="text-brand-dark font-extrabold text-[10px] uppercase tracking-widest">Costo Total Unitario</span>
                                <span class="font-black text-brand-dark text-[13px] font-mono tracking-tight bg-slate-100 px-2 py-1 rounded-lg">S/. ${costoTotalUnitario.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 pt-3 border-t border-dashed border-slate-200">
                            <div class="text-[10px] text-slate-400 font-inter uppercase tracking-wider mb-1">Precio Venta Público</div>
                            <div class="text-2xl font-black text-emerald-600 tracking-tight">
                                S/. ${precioVentaPublico.toFixed(2)} <span class="text-xs font-medium text-slate-400 normal-case">(Inc. IGV)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mt-5 relative z-10">
                        <button onclick="window.verFichaTecnica(${id})" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px]">visibility</span> Detalle
                        </button>
                        <button onclick="window.agregarAlCarrito(${id})" class="text-xs bg-brand-dark hover:bg-slate-800 text-white font-bold py-3 px-2 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-brand-accent">add_shopping_cart</span> Añadir
                        </button>
                    </div>
                `;
                contenedor.appendChild(card);
            });
        } else {
            contenedor.innerHTML = `<p class="col-span-full text-center py-12 text-slate-400 font-medium">No se encontraron productos registrados en la matriz.</p>`;
        }
    } catch (error) {
        contenedor.innerHTML = `<p class="col-span-full text-center py-12 text-red-500 font-bold">Error de conexión con la base de datos industrial.</p>`;
    }
}

// =========================================================================
// 🛒 FUNCIONES GLOBALES (Blindadas contra errores de Clic)
// =========================================================================

window.verFichaTecnica = function(id) {
    const prod = listaProductosGlobal.find(p => p.codigoproducto === id);
    if (!prod) return;
    
    document.getElementById('fichaNombre').textContent = prod.producto ? prod.producto.replace(/_/g, ' ') : 'Producto Industrial';
    document.getElementById('fichaCodigo').textContent = `COD: ${id}`;
    document.getElementById('fichaPrecio').textContent = `S/. ${parseFloat(prod.precio_venta_publico || 0).toFixed(2)}`;
    document.getElementById('fichaDescripcion').innerHTML = `
        Materia Prima Directa: <strong>S/. ${parseFloat(prod.materia_prima || 0).toFixed(2)}</strong><br>
        Mano de Obra Directa: <strong>S/. ${parseFloat(prod.mod || 0).toFixed(2)}</strong><br>
        Costos Indirectos (CIF): <strong>S/. ${parseFloat(prod.cif || 0).toFixed(2)}</strong><br><br>
        <span class="text-xs text-slate-400">*Costos calculados bajo método de absorción total.</span>
    `;
    
    const imgElement = document.getElementById('fichaImagen');
    imgElement.src = `/static/imagenes/${id}.jpg`;
    
    const modal = document.getElementById('modalFicha');
    const modalContent = modal.children[0]; 

    modal.classList.remove('hidden'); 
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
};

window.cerrarModalFicha = function() {
    const modal = document.getElementById('modalFicha');
    if (!modal) return;
    const modalContent = modal.children[0];

    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

window.toggleCarrito = function() { 
    const panel = document.getElementById('panelCarrito'); 
    if (panel) panel.classList.toggle('translate-x-full'); 
};

window.agregarAlCarrito = function(id) {
    const prod = listaProductosGlobal.find(p => p.codigoproducto === id);
    if (!prod) return;
    
    let cantidadInput = prompt(`🏭 PARÁMETROS DE PRODUCCIÓN\n\n• MOQ: ${MINIMO_PEDIDO_MOQ} und.\n• Múltiplos: ${MULTIPLO_EMPAQUE} und.\n\nIngrese la cantidad a producir:`);
    if (cantidadInput === null) return;
    
    let cantidad = parseInt(cantidadInput);
    if (isNaN(cantidad) || cantidad < MINIMO_PEDIDO_MOQ || cantidad % MULTIPLO_EMPAQUE !== 0) {
        alert("⚠️ Infracción de Regla de Negocio: La cantidad ingresada no cumple con el MOQ o los múltiplos de empaque.");
        return;
    }
    
    const itemEnCarrito = carrito.find(item => item.codigoproducto === id);
    if (itemEnCarrito) { 
        itemEnCarrito.cantidad += cantidad; 
    } else {
        carrito.push({
            codigoproducto: prod.codigoproducto,
            producto: prod.producto ? prod.producto.replace(/_/g, ' ') : 'Producto',
            precio: prod.precio_venta_publico, 
            cantidad: cantidad
        });
    }
    window.actualizarVistaCarrito();
    
    const panel = document.getElementById('panelCarrito');
    if (panel && panel.classList.contains('translate-x-full')) {
        window.toggleCarrito();
    }
};

window.actualizarVistaCarrito = function() {
    const lista = document.getElementById('listaCarrito');
    const totalLabel = document.getElementById('totalCarrito');
    const contador = document.getElementById('contadorCarrito');
    
    if (!lista) return; 
    
    if (carrito.length === 0) {
        lista.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center opacity-50">
                <span class="material-symbols-outlined text-6xl text-slate-400 mb-4 animate-float">add_shopping_cart</span>
                <p class="text-slate-600 font-medium">La orden de producción está vacía</p>
                <p class="text-xs font-inter text-slate-400 mt-2">Agrega productos desde el catálogo para cotizar.</p>
            </div>
        `;
        if (totalLabel) totalLabel.textContent = `S/. 0.00`;
        if (contador) contador.textContent = "0";
        return;
    }
    
    lista.innerHTML = ''; 
    let total = 0; 
    let itemsTotales = 0;
    
    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad; 
        total += subtotal; 
        itemsTotales += item.cantidad;
        
        const row = document.createElement('div'); 
        row.className = "bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 flex items-center justify-between";
        row.innerHTML = `
            <div>
                <div class="font-bold text-brand-dark text-sm">${item.producto}</div>
                <div class="text-xs text-slate-500 font-mono mt-1">S/. ${item.precio.toFixed(2)} × ${item.cantidad} und.</div>
            </div>
            <div class="flex flex-col items-end gap-2">
                <span class="font-black text-brand-dark">S/. ${subtotal.toFixed(2)}</span>
                <button onclick="window.eliminarDelCarrito(${index})" class="text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 p-1.5 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </div>
        `;
        lista.appendChild(row);
    });
    
    if (totalLabel) totalLabel.textContent = `S/. ${total.toFixed(2)}`;
    if (contador) contador.textContent = itemsTotales;
};

window.eliminarDelCarrito = function(index) { 
    carrito.splice(index, 1); 
    window.actualizarVistaCarrito(); 
};

async function procesarOrdenCompra(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("El carrito de producción está vacío.");
    
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
            alert(`✅ ¡Orden industrial generada con éxito!\n\nSe ha inyectado en el Kardex y asignado el Código de Orden: ${result.codigo_orden}`);
            carrito = []; 
            window.actualizarVistaCarrito(); 
            window.toggleCarrito(); 
            document.getElementById('formCheckout').reset();
        } else { 
            alert("Error al procesar la orden: " + result.error); 
        }
    } catch (error) { 
        alert("Error de conexión con el servidor Supabase."); 
    }
}