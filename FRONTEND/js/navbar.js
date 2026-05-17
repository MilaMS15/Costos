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
    
    // Si hay sesión, mostrar la barra
    console.log('Sesión activa - mostrando barra de navegación');
    
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
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-family: 'Inter', sans-serif;
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
                🏠 Dashboard
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
                📋 Menú 1
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
                📊 Menú 2
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
                📈 Menú 3
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
                📉 Menú 4
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
                🔧 Menú 5
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
                ⚙️ Menú 6
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
                📦 Menú 7
            </button>
            
            <!-- Botón de Cerrar Sesión al final -->
            <button onclick="cerrarSesionDesdeNavbar()" class="nav-btn" style="
                background: #dc2626;
                border: none;
                color: white;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.2s;
                margin-left: auto;
            " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
                🚪 Cerrar Sesión
            </button>
        </nav>
        <style>
            body {
                padding-top: 70px !important;
                margin: 0;
            }
            @media (max-width: 768px) {
                .top-navbar { flex-wrap: wrap; justify-content: center; }
                .top-navbar button:last-child { margin-left: 0 !important; }
                body { padding-top: 120px !important; }
            }
        </style>
    `;
    
    // Insertar al inicio del body
    document.body.insertAdjacentHTML('afterbegin', navbarHtml);
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