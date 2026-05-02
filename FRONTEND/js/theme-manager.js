(function() {
    // 1. Inmediatamente aplicar el tema guardado para evitar "flashing"
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.classList.toggle('light', savedTheme === 'light');

    document.addEventListener('DOMContentLoaded', () => {
        // 2. Crear el botón de toggle
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle';
        toggleBtn.title = 'Cambiar modo noche/día';
        // Estilos base del botón (compatibles con Tailwind)
        toggleBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-outline-variant/20 hover:scale-105 active:scale-95';
        
        // Función para actualizar el icono y colores del botón
        const updateBtnStyle = (theme) => {
            if (theme === 'dark') {
                toggleBtn.innerHTML = '<span class="material-symbols-outlined text-yellow-400">light_mode</span>';
                toggleBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-white/10 bg-slate-800 hover:bg-slate-700 text-yellow-400';
            } else {
                toggleBtn.innerHTML = '<span class="material-symbols-outlined text-slate-600">dark_mode</span>';
                toggleBtn.className = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-slate-600';
            }
        };

        updateBtnStyle(savedTheme);
        
        // 3. Buscar un lugar donde insertar el botón
        // Intentar en el header, cerca del perfil de usuario
        const selectors = [
            '.top-nav-right',
            'header .flex.items-center.gap-4',
            'header .flex.items-center.gap-6',
            '.flex.items-center.gap-3.pl-4', // Específico de materiales.html
            '.sidebar-user',
            'header'
        ];

        let inserted = false;
        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container) {
                // En el caso de materiales.html, queremos que esté antes del perfil
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
            // Fallback: posición fija si no se encuentra un contenedor adecuado
            toggleBtn.style.position = 'fixed';
            toggleBtn.style.bottom = '24px';
            toggleBtn.style.right = '24px';
            toggleBtn.style.zIndex = '9999';
            toggleBtn.classList.add('bg-primary', 'text-white', 'shadow-xl');
            document.body.appendChild(toggleBtn);
        }

        // 4. Lógica del evento click
        toggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            const newTheme = isDark ? 'light' : 'dark';
            
            // Aplicar clases
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(newTheme);
            
            // Guardar preferencia
            localStorage.setItem('theme', newTheme);
            
            // Actualizar botón
            updateBtnStyle(newTheme);
            
            // Feedback visual opcional
            console.log(`Modo ${newTheme} activado`);
        });
    });
})();
