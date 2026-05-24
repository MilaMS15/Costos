(function() {
    // 1. Inmediatamente aplicar el tema guardado para evitar "flashing"
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.classList.toggle('light', savedTheme === 'light');

    // Función para actualizar los iconos de los botones según el tema
    window.updateThemeToggleStyles = function(theme) {
        const activeTheme = theme || localStorage.getItem('theme') || 'light';
        
        // A. Botón en el Sidebar
        const sidebarBtn = document.getElementById('theme-toggle-sidebar');
        if (sidebarBtn) {
            if (activeTheme === 'dark') {
                sidebarBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 22px; color: #FBBF24;">light_mode</span>';
                sidebarBtn.title = 'Cambiar a modo día';
            } else {
                sidebarBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 22px; color: #A3B1C6;">dark_mode</span>';
                sidebarBtn.title = 'Cambiar a modo noche';
            }
        }

        // B. Botón de fallback / flotante viejo (si existe en la página)
        const fallbackBtn = document.getElementById('theme-toggle');
        if (fallbackBtn) {
            if (activeTheme === 'dark') {
                fallbackBtn.innerHTML = '<span class="material-symbols-outlined text-yellow-400">light_mode</span>';
                fallbackBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-white/10 bg-slate-800 hover:bg-slate-700 text-yellow-400';
            } else {
                fallbackBtn.innerHTML = '<span class="material-symbols-outlined text-slate-600">dark_mode</span>';
                fallbackBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-slate-600';
            }
        }

        // C. Botón en el Login
        const loginBtn = document.getElementById('theme-toggle-login');
        if (loginBtn) {
            if (activeTheme === 'dark') {
                loginBtn.innerHTML = '<span class="material-symbols-outlined text-yellow-400" style="font-size: 20px;">light_mode</span>';
                loginBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border border-slate-700 bg-slate-800 text-yellow-400 hover:bg-slate-700 hover:scale-105 active:scale-95';
                loginBtn.title = 'Cambiar a modo día';
            } else {
                loginBtn.innerHTML = '<span class="material-symbols-outlined text-slate-600" style="font-size: 20px;">dark_mode</span>';
                loginBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:scale-105 active:scale-95';
                loginBtn.title = 'Cambiar a modo noche';
            }
        }
    };

    // Función central de alternancia de temas
    window.toggleTheme = function() {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        
        // Aplicar clases al html
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        
        // Guardar preferencia en localStorage
        localStorage.setItem('theme', newTheme);
        
        // Actualizar diseño de botones
        window.updateThemeToggleStyles(newTheme);
        console.log(`Modo ${newTheme} activado`);
    };

    function initThemeManager() {
        const sidebarBtn = document.getElementById('theme-toggle-sidebar');
        const loginBtn = document.getElementById('theme-toggle-login');

        // Crear el botón flotante / fallback si no estamos en una página con Sidebar o Login
        if (!sidebarBtn && !loginBtn) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'theme-toggle';
            toggleBtn.title = 'Cambiar modo noche/día';
            toggleBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-outline-variant/20 hover:scale-105 active:scale-95';
            
            // Intentar insertarlo en algún header/perfil o fallback flotante
            const selectors = [
                '.top-nav-right',
                'header .flex.items-center.gap-4',
                'header .flex.items-center.gap-6',
                '.flex.items-center.gap-3.pl-4',
                '.sidebar-user',
                'header'
            ];

            let inserted = false;
            for (const selector of selectors) {
                const container = document.querySelector(selector);
                if (container) {
                    if (selector === '.flex.items-center.gap-3.pl-4') {
                        container.parentNode.insertBefore(toggleBtn, container);
                    } else {
                        container.prepend(toggleBtn);
                    }
                    inserted = true;
                    break;
                }
            }
            
            if (!inserted) {
                // Fallback flotante en la esquina inferior derecha
                toggleBtn.style.position = 'fixed';
                toggleBtn.style.bottom = '24px';
                toggleBtn.style.right = '90px'; // Desplazado del chatbot que está a 20px
                toggleBtn.style.zIndex = '9999';
                toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                document.body.appendChild(toggleBtn);
            }

            toggleBtn.removeEventListener('click', window.toggleTheme);
            toggleBtn.addEventListener('click', window.toggleTheme);
        }

        // Ejecutar primer render de los estilos
        window.updateThemeToggleStyles(savedTheme);
    }

    // Ejecutar inmediatamente o al cargar el DOM según el estado de la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeManager);
    } else {
        initThemeManager();
    }
})();
