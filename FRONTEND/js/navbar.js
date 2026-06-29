// Controla el menú lateral unificado y la responsividad del sistema Unik'a

// 📦 INYECCIÓN DINÁMICA DE RECURSOS PARA EL MODO NOCHE (CSS + JS)
(function() {
    // 1. Inyectar css/theme-dark.css con cache-busting para forzar recarga en el navegador
    let link = document.querySelector('link[href*="theme-dark.css"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/theme-dark.css?v=' + Date.now();
        document.head.appendChild(link);
    } else {
        if (!link.href.includes('?v=')) {
            link.href = 'css/theme-dark.css?v=' + Date.now();
        }
    }

    // 2. Inyectar js/theme-manager.js si no existe
    if (!document.querySelector('script[src*="theme-manager.js"]')) {
        const script = document.createElement('script');
        script.src = 'js/theme-manager.js';
        document.body.appendChild(script);
    }
})();

function cargarNavbar() {
    // 🔐 VERIFICAR SI HAY SESIÓN ACTIVA
    const usuarioStr = localStorage.getItem('usuario');
    
    // Si NO hay usuario logueado, NO mostrar la barra
    if (!usuarioStr) {
        console.log('Sin sesión activa - barra oculta');
        return;
    }
    
    let usuario = { user: 'Usuario' };
    try {
        usuario = JSON.parse(usuarioStr);
    } catch(e) {}
    
    // Si ya existe la barra lateral unificada, no la dupliques
    if (document.getElementById('unik-sidebar')) {
        return;
    }
    
    console.log('Sesión activa - mostrando menú lateral unificado');
    
    // 1. INYECTAR CSS RESPONSIVO EN EL HEAD
    const style = document.createElement('style');
    style.innerHTML = `
        /* Ocultar barra superior vieja */
        .top-navbar {
            display: none !important;
        }
        
        /* Ocultar asides viejos hardcoded en las páginas */
        aside:not(.unik-unified-sidebar) {
            display: none !important;
        }
        
        /* Asegurar box-sizing correcto y soporte iOS Safe Areas */
        body {
            box-sizing: border-box;
            margin: 0;
            padding-bottom: env(safe-area-inset-bottom) !important;
            -webkit-text-size-adjust: 100%;
        }
        
        /* Prevenir scroll horizontal en el sidebar unificado y asegurar box-sizing */
        .unik-unified-sidebar,
        .unik-unified-sidebar * {
            box-sizing: border-box !important;
        }
        
        .unik-unified-sidebar {
            overflow-x: hidden !important;
        }
        
        .unik-unified-sidebar nav {
            overflow-x: hidden !important;
        }
        
        /* Desplazamiento momentum fluido en iOS Safari */
        .overflow-y-auto, .overflow-x-auto, nav, main, section, tbody, div {
            -webkit-overflow-scrolling: touch;
        }
        
        /* Prevenir zoom automático en inputs de iOS Safari en móvil */
        @media (max-width: 767px) {
            input, select, textarea {
                font-size: 16px !important;
            }
        }
        
        /* Layout offset para escritorio (pantallas medianas y grandes) */
        @media (min-width: 768px) {
            body {
                padding-left: 280px !important;
                padding-top: 0 !important;
            }
            main, .main-canvas, .flex-1, .ml-72, .ml-64, [class*="ml-72"], [class*="ml-64"] {
                margin-left: 0 !important;
            }
            .unik-mobile-header {
                display: none !important;
            }
            .unik-unified-sidebar {
                transform: translateX(0) !important;
            }
            .unik-unified-sidebar .mobile-close-btn {
                display: none !important;
            }
        }
        
        /* Layout offset y adaptabilidad total para iOS y Android (Móviles) */
        @media (max-width: 767px) {
            body {
                padding-left: 0 !important;
                padding-top: 60px !important;
            }
            main, .main-canvas, .flex-1, .ml-72, .ml-64, [class*="ml-72"], [class*="ml-64"] {
                margin-left: 0 !important;
            }
            .unik-mobile-header {
                display: flex !important;
            }
            .unik-unified-sidebar {
                transform: translateX(-280px);
            }
            .unik-unified-sidebar.open {
                transform: translateX(0);
            }
            .unik-unified-sidebar .mobile-close-btn {
                display: block !important;
            }
            
            /* Colapsar cuadrículas estructurales fijas a 1 columna */
            .grid-cols-4, .grid-cols-3, .grid-cols-12 {
                grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
            }
            .col-span-8, .col-span-4, .col-span-3, .col-span-9, .col-span-6 {
                grid-column: span 1 / span 1 !important;
            }
            
            /* Colapsar paneles divididos (ej. recetas y productos) a vertical */
            .flex-1.flex.p-8.gap-8, .flex.p-8.gap-8 {
                flex-direction: column !important;
                padding: 16px !important;
                overflow-y: auto !important;
            }
            section.w-\[400px\], [class*="w-[400px]"], .w-96, [class*="w-96"] {
                width: 100% !important;
            }
            
            /* Ajustes de espaciados estructurales en pantallas pequeñas */
            .p-12, .px-12, .py-8, .p-8, .p-6, .p-5 {
                padding: 16px !important;
            }
            .px-12, .px-8 {
                padding-left: 16px !important;
                padding-right: 16px !important;
            }
            .py-6, .py-8 {
                padding-top: 16px !important;
                padding-bottom: 16px !important;
            }
            
            /* Encabezados de página apilados y legibles */
            header.flex.justify-between, .flex.justify-between.items-center.w-full {
                padding: 16px !important;
                flex-direction: column !important;
                gap: 12px !important;
                align-items: flex-start !important;
            }
            header.flex.justify-between .flex.items-center, .flex.justify-between.items-center.w-full .flex {
                width: 100% !important;
                justify-content: space-between !important;
            }
            
            /* Optimizar gráficos en móviles */
            .min-h-\[400px\], [class*="min-h-[400px]"], .h-\[400px\], [class*="h-[400px]"] {
                min-height: 260px !important;
                height: 260px !important;
            }
            
            /* Tablas con scroll horizontal cómodo */
            .overflow-x-auto {
                width: 100% !important;
                margin-bottom: 16px !important;
            }
        }
    `;
    document.head.appendChild(style);

    // 2. CREAR Y AGREGAR EL MOBILE HEADER
    const mobileHeaderHtml = `
        <header class="unik-mobile-header" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #1B263B;
            color: white;
            display: none;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 9990;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15);
            font-family: 'Inter', sans-serif;
        ">
            <button onclick="toggleUnikSidebar()" style="background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; padding: 4px;">
                <span class="material-symbols-outlined" style="font-size: 28px;">menu</span>
            </button>
            <span style="font-weight: 800; font-size: 1.15rem; font-family: 'Manrope', sans-serif; tracking-wide">🔵 Unik'a</span>
            <div style="width: 28px;"></div>
        </header>
    `;
    document.body.insertAdjacentHTML('afterbegin', mobileHeaderHtml);

    // 3. GENERAR LOS ENLACES DE NAVEGACIÓN DIVERSIFICADOS
    function generarSidebarHTML() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        
        const secciones = [
            {
                titulo: "Módulos Principales",
                items: [
                    { nombre: "🏠 Dashboard General", href: "index.html" },
                    { nombre: "🛍️ Catálogo y Cotizador", href: "menu1.html" },
                    { nombre: "⚙️ Monitor de Producción", href: "menu2.html" },
                    { nombre: "📦 Logística e Inventario", href: "menu3.html" },
                    { nombre: "📐 Costos Industriales", href: "menu4.html" },
                    { nombre: "👥 Talento Humano / RRHH", href: "menu5.html" },
                    { nombre: "💰 Finanzas de Planta", href: "menu6.html" },
                    { nombre: "🛠️ Configuración General", href: "menu7.html" }
                ]
            },
            {
                titulo: "Gestión Operativa",
                items: [
                    { nombre: "🧵 Materias Primas", href: "materiales.html" },
                    { nombre: "🏷️ Productos y Modelos", href: "productos.html" },
                    { nombre: "👔 Control de Personal", href: "trabajadores.html" }
                ]
            },
            {
                titulo: "Producción y Recetas",
                items: [
                    { nombre: "📋 Plan de Producción", href: "plan_produccion.html" },
                    { nombre: "🔧 Receta x Producto", href: "receta_producto.html" },
                    { nombre: "💵 Cálculo MOD y CIF", href: "mod_cif_producto.html" }
                ]
            },
            {
                titulo: "Control de Órdenes",
                items: [
                    { nombre: "📄 Órdenes de Trabajo", href: "ordenes_trabajo.html" },
                    { nombre: "🧾 Hoja de Costos", href: "hoja_costos.html" }
                ]
            },
            {
                titulo: "Reportes Financieros",
                items: [
                    { nombre: "📈 Estado de Resultados", href: "estado_resultados.html" }
                ]
            },
            // 🔥 NUEVA SECCIÓN: Costeo ABC
            {
                titulo: "Costeo ABC",
                items: [
                    { nombre: "🎯 Análisis ABC", href: "costeo_abc.html" }
                ]
            }
        ];

        let html = "";
        secciones.forEach((sec, idx) => {
            html += `
                <div style="padding: ${idx === 0 ? '0' : '16px'} 24px 8px 24px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #415A77; opacity: 0.8; font-weight: 700; font-family: 'Manrope', sans-serif;">
                    ${sec.titulo}
                </div>
            `;
            
            sec.items.forEach(item => {
                const isActive = currentPath === item.href;
                
                if (isActive) {
                    html += `
                        <a href="${item.href}" style="background: rgba(255, 159, 28, 0.15); color: #FF9F1C; border-left: 4px solid #FF9F1C; padding: 10px 24px; display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.2s;">
                            <span style="font-family: 'Inter', sans-serif;">${item.nombre}</span>
                        </a>
                    `;
                } else {
                    html += `
                        <a href="${item.href}" 
                           style="color: #A3B1C6; padding: 10px 24px; display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 500; text-decoration: none; transition: all 0.2s;"
                           onmouseover="this.style.color='#FFF'; this.style.transform='translateX(4px)'; this.style.background='rgba(255,255,255,0.03)';" 
                           onmouseout="this.style.color='#A3B1C6'; this.style.transform='none'; this.style.background='transparent';">
                            <span style="font-family: 'Inter', sans-serif;">${item.nombre}</span>
                        </a>
                    `;
                }
            });
        });

        return html;
    }

    // 4. CREAR Y AGREGAR EL UNIFIED SIDEBAR
    const email = usuario.user || 'usuario@costos.com';
    const name = email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();

    const sidebarHtml = `
        <aside class="unik-unified-sidebar" id="unik-sidebar" style="
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            background: #1B263B;
            color: #E0E1DD;
            display: flex;
            flex-direction: column;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
            box-shadow: 4px 0 20px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
            overflow-x: hidden;
            box-sizing: border-box;
        ">
            <!-- Header del Sidebar -->
            <div style="padding: 24px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); height: 75px; box-sizing: border-box;">
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="window.location.href='index.html'">
                    <span style="background: #FF9F1C; color: white; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; font-family: 'Manrope', sans-serif;">U</span>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                        <span style="font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 15px; color: white; line-height: 1.2;">Unik'a</span>
                        <span style="font-size: 8px; color: #415A77; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Atelier Financiero</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <!-- Botón de Modo Noche/Día en el Sidebar -->
                    <button id="theme-toggle-sidebar" onclick="if(window.toggleTheme){window.toggleTheme()}else{const isDark=document.documentElement.classList.contains('dark');const newTheme=isDark?'light':'dark';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(newTheme);localStorage.setItem('theme',newTheme);if(window.updateThemeToggleStyles){window.updateThemeToggleStyles(newTheme)}}" style="background: transparent; border: none; color: #A3B1C6; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 8px; transition: all 0.2s;" onmouseover="this.style.color='#FFF'; this.style.background='rgba(255,255,255,0.05)';" onmouseout="this.style.color='#A3B1C6'; this.style.background='transparent';">
                        <span class="material-symbols-outlined" style="font-size: 22px;">dark_mode</span>
                    </button>
                    <!-- Botón de cerrar móvil -->
                    <button onclick="toggleUnikSidebar()" class="mobile-close-btn" style="background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; padding: 4px;">
                        <span class="material-symbols-outlined" style="font-size: 24px;">close</span>
                    </button>
                </div>
            </div>
            
            <!-- Navegación del Sidebar -->
            <nav style="flex: 1; padding: 20px 0; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 2px; box-sizing: border-box;">
                ${generarSidebarHTML()}
            </nav>
            
            <!-- Footer del Sidebar con Usuario y Botón de Salir -->
            <div style="padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.12); box-sizing: border-box;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: #FF9F1C; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-shrink: 0;">${initial}</div>
                    <div style="overflow: hidden; text-align: left;">
                        <div style="font-size: 13px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Inter', sans-serif;">${name}</div>
                        <div style="font-size: 10px; color: #A3B1C6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Inter', sans-serif; opacity: 0.7;">${email}</div>
                    </div>
                </div>
                <button onclick="cerrarSesionDesdeNavbar()" style="width: 100%; padding: 10px 14px; background: #E0E1DD; color: #1B263B; border: none; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; font-family: 'Inter', sans-serif;" onmouseover="this.style.background='#FF9F1C'; this.style.color='white'" onmouseout="this.style.background='#E0E1DD'; this.style.color='#1B263B'">
                    <span class="material-symbols-outlined" style="font-size: 16px;">logout</span> Cerrar Sesión
                </button>
            </div>
        </aside>
    `;
    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

    // Actualizar el estado visual del botón según el tema actual al cargar
    if (window.updateThemeToggleStyles) {
        window.updateThemeToggleStyles();
    } else {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const sidebarBtn = document.getElementById('theme-toggle-sidebar');
        if (sidebarBtn) {
            if (currentTheme === 'dark') {
                sidebarBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 22px; color: #FBBF24;">light_mode</span>';
                sidebarBtn.title = 'Cambiar a modo día';
            } else {
                sidebarBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 22px; color: #A3B1C6;">dark_mode</span>';
                sidebarBtn.title = 'Cambiar a modo noche';
            }
        }
    }

    // 5. INYECTAR CHATBOT DE MANERA DINÁMICA
    if (!document.querySelector('.chatbot-container') && !document.getElementById('chatbot-script')) {
        const chatbotScript = document.createElement('script');
        chatbotScript.id = 'chatbot-script';
        chatbotScript.src = 'js/chatbot.js';
        document.body.appendChild(chatbotScript);
    }
}

// 5. FUNCIONES CONTROLADORAS GLOBALES
function toggleUnikSidebar() {
    const sidebar = document.getElementById('unik-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}
window.toggleUnikSidebar = toggleUnikSidebar;

function cerrarSesionDesdeNavbar() {
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}
window.cerrarSesionDesdeNavbar = cerrarSesionDesdeNavbar;

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarNavbar);
} else {
    cargarNavbar();
}