// FRONTEND/js/navbar.js
// Solo muestra la barra de navegación si el usuario ha iniciado sesión

function cargarNavbar() {
    // 🔐 VERIFICAR SI HAY SESIÓN ACTIVA
    const usuario = localStorage.getItem('usuario');
    
    // Si NO hay usuario logueado, NO mostrar la barra
    if (!usuario) {
        console.log('Sin sesión activa - barra oculta');
        return;
    }
    
    // Si ya existe una barra, no la dupliques
    if (document.querySelector('.top-navbar')) {
        return;
    }
    
    console.log('Sesión activa - mostrando barra de navegación');
    
    // 🔧 FUNCIÓN PARA ACTUALIZAR EL PADDING DEL BODY
    function actualizarPaddingBody() {
        const navbar = document.querySelector('.top-navbar');
        if (!navbar) return;
        
        // Obtener la altura REAL de la barra (incluyendo padding y margin)
        const alturaNavbar = navbar.offsetHeight;
        
        // Aplicar padding-top al body
        document.body.style.paddingTop = alturaNavbar + 'px';
        
        console.log(`Altura de la barra: ${alturaNavbar}px - Padding aplicado`);
    }
    
    const navbarHtml = `
        <nav class="top-navbar" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #1B263B;
            color: white;
            padding: 12px 24px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            z-index: 50; /* <--- ¡ESTE ES EL CAMBIO CLAVE! Antes era 1000 */
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-family: 'Inter', sans-serif;
            font-size: 14px;
        ">
            <div style="display: flex; align-items: center; margin-right: 24px;">
                <span style="font-weight: 800; font-size: 1.2rem;">🔵 Unik'a</span>
            </div>
            <button onclick="window.location.href='index.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                🏠 / 📊 Dashboard
            </button>
            <button onclick="window.location.href='menu1.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                🛍️ / 📋 Catálogo Comercial o Cotizador
            </button>
            <button onclick="window.location.href='menu2.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                ⚙️ / 🏗️ Producción
            </button>
            <button onclick="window.location.href='menu3.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                📦 / 🚚 Logística
            </button>
            <button onclick="window.location.href='menu4.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                📐 / 📉 Costos Industriales
            </button>
            <button onclick="window.location.href='menu5.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                👥 / 👔 Talento Humano o RRHH
            </button>
            <button onclick="window.location.href='menu6.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                💰 / 📈 Finanzas
            </button>
            <button onclick="window.location.href='menu7.html'" class="nav-btn" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
            " onmouseover="this.style.background='#FF9F1C'" onmouseout="this.style.background='transparent'">
                ⚙️ / 🛠️ Configuración
            </button>
            
        </nav>
    `;
    
    // Insertar al inicio del body
    document.body.insertAdjacentHTML('afterbegin', navbarHtml);
    
    // Aplicar el padding después de insertar la barra
    actualizarPaddingBody();
    
    // Escuchar cambios de tamaño de ventana (cuando la barra cambia de altura)
    window.addEventListener('resize', function() {
        actualizarPaddingBody();
    });
    
    // También observar si hay cambios en la barra (por si el contenido cambia)
    const observer = new ResizeObserver(function() {
        actualizarPaddingBody();
    });
    
    const navbar = document.querySelector('.top-navbar');
    if (navbar) {
        observer.observe(navbar);
    }
}

// Función para cerrar sesión desde la barra
function cerrarSesionDesdeNavbar() {
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarNavbar);
} else {
    cargarNavbar();
}