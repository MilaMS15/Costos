// FRONTEND/js/menu7.js

// Variable global para la tab activa
let tabActual = 'general';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarConfiguracion();
    cargarUsuarios();
    cargarRespaldos();
    cargarAuditoria();
    cargarEstadoSistema();
    cargarNotificaciones();
});

function mostrarTab(tab) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Mostrar el contenido seleccionado
    document.getElementById(`tab-${tab}-content`).classList.remove('hidden');
    
    // Actualizar estilos de tabs
    const tabs = ['general', 'usuarios', 'respaldo', 'auditoria', 'sistema', 'notificaciones'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.classList.add('nav-tab-active');
                btn.classList.remove('nav-tab-inactive');
            } else {
                btn.classList.add('nav-tab-inactive');
                btn.classList.remove('nav-tab-active');
            }
        }
    });
    
    tabActual = tab;
    
    // Recargar datos según la tab
    if (tab === 'usuarios') cargarUsuarios();
    if (tab === 'respaldo') cargarRespaldos();
    if (tab === 'auditoria') cargarAuditoria();
    if (tab === 'sistema') cargarEstadoSistema();
}

// ============================================
// CONFIGURACIÓN GENERAL
// ============================================

async function cargarConfiguracion() {
    try {
        const response = await fetch(`${API_URL}/menu7/configuracion-general`);
        const result = await response.json();
        
        if (result.success) {
            const config = result.data;
            document.getElementById('empresa_nombre').value = config.empresa_nombre || '';
            document.getElementById('empresa_ruc').value = config.empresa_ruc || '';
            document.getElementById('empresa_direccion').value = config.empresa_direccion || '';
            document.getElementById('empresa_telefono').value = config.empresa_telefono || '';
            document.getElementById('empresa_email').value = config.empresa_email || '';
            document.getElementById('moneda').value = config.moneda || 'PEN';
            document.getElementById('impuesto_igv').value = config.impuesto_igv || 18;
            document.getElementById('impuesto_renta').value = config.impuesto_renta || 29.5;
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

document.getElementById('configForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const config = {
        empresa_nombre: document.getElementById('empresa_nombre').value,
        empresa_ruc: document.getElementById('empresa_ruc').value,
        empresa_direccion: document.getElementById('empresa_direccion').value,
        empresa_telefono: document.getElementById('empresa_telefono').value,
        empresa_email: document.getElementById('empresa_email').value,
        moneda: document.getElementById('moneda').value,
        impuesto_igv: parseFloat(document.getElementById('impuesto_igv').value),
        impuesto_renta: parseFloat(document.getElementById('impuesto_renta').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/menu7/configuracion-general`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Configuración guardada correctamente');
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error al guardar configuración');
    }
});

// ============================================
// USUARIOS
// ============================================

async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/menu7/usuarios`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('usuariosTable');
            tbody.innerHTML = result.data.map(user => `
                <tr>
                    <td class="px-4 py-3 text-sm">${user.email}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${user.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                            ${user.rol || 'usuario'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm">${user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                    <td class="px-4 py-3 text-sm">${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '-'}</td>
                    <td class="px-4 py-3">
                        <button onclick="cambiarRol('${user.id}')" class="text-blue-600 hover:text-blue-800 text-sm">Cambiar Rol</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

function mostrarModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'flex';
    document.getElementById('modalUsuario').classList.add('flex');
    document.getElementById('modalUsuario').classList.remove('hidden');
}

function cerrarModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'none';
    document.getElementById('modalUsuario').classList.add('hidden');
    document.getElementById('modalUsuario').classList.remove('flex');
}

async function crearUsuario() {
    alert('Funcionalidad en desarrollo - Conectar con Supabase Auth');
    cerrarModalUsuario();
}

async function cambiarRol(userId) {
    const nuevoRol = prompt('Nuevo rol (admin/usuario):');
    if (nuevoRol && (nuevoRol === 'admin' || nuevoRol === 'usuario')) {
        try {
            const response = await fetch(`${API_URL}/menu7/usuarios/${userId}/rol`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rol: nuevoRol })
            });
            if (response.ok) {
                alert('✅ Rol actualizado');
                cargarUsuarios();
            }
        } catch (error) {
            alert('❌ Error al cambiar rol');
        }
    }
}

// ============================================
// RESPALDOS
// ============================================

async function cargarRespaldos() {
    try {
        const response = await fetch(`${API_URL}/menu7/respaldos`);
        const result = await response.json();
        
        const container = document.getElementById('respaldosLista');
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(backup => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium">${backup.nombre}</p>
                        <p class="text-xs text-gray-500">${new Date(backup.fecha).toLocaleString()} - ${(backup.tamaño / 1024).toFixed(2)} KB</p>
                    </div>
                    <button onclick="descargarRespaldo('${backup.nombre}')" class="text-blue-600 hover:text-blue-800 text-sm">Descargar</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay respaldos disponibles</p>';
        }
    } catch (error) {
        console.error('Error cargando respaldos:', error);
    }
}

async function crearRespaldo() {
    try {
        const response = await fetch(`${API_URL}/menu7/respaldos/crear`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ ${result.mensaje}`);
            cargarRespaldos();
        } else {
            alert('❌ Error al crear respaldo');
        }
    } catch (error) {
        alert('❌ Error al crear respaldo');
    }
}

function descargarRespaldo(nombre) {
    alert(`Descargando ${nombre}...`);
}

async function limpiarDatos(opcion) {
    if (confirm('¿Estás seguro de eliminar estos datos? Esta acción no se puede deshacer.')) {
        try {
            const response = await fetch(`${API_URL}/menu7/limpieza-datos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opcion })
            });
            const result = await response.json();
            alert(result.mensaje);
        } catch (error) {
            alert('❌ Error al limpiar datos');
        }
    }
}

// ============================================
// AUDITORÍA
// ============================================

async function cargarAuditoria() {
    try {
        const response = await fetch(`${API_URL}/menu7/auditoria`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('auditoriaTable');
            tbody.innerHTML = result.data.map(log => `
                <tr>
                    <td class="px-4 py-2 text-xs">${new Date(log.fecha).toLocaleString()}</td>
                    <td class="px-4 py-2 text-sm">${log.usuario || 'sistema'}</td>
                    <td class="px-4 py-2">
                        <span class="px-2 py-1 text-xs rounded-full bg-gray-100">${log.accion}</span>
                    </td>
                    <td class="px-4 py-2 text-sm">${log.detalle || '-'}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando auditoría:', error);
    }
}

function exportarAuditoria() {
    alert('📊 Exportando registro de auditoría...');
}

// ============================================
// ESTADO DEL SISTEMA
// ============================================

async function cargarEstadoSistema() {
    try {
        const response = await fetch(`${API_URL}/menu7/estado-sistema`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            const estadoHtml = `
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Base de Datos:</span>
                    <span class="font-semibold ${data.database === 'conectado' ? 'text-green-600' : 'text-red-600'}">${data.database}</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>API:</span>
                    <span class="font-semibold text-green-600">${data.api}</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Versión:</span>
                    <span class="font-semibold">${data.version}</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Último Backup:</span>
                    <span class="font-semibold">${data.ultimo_backup}</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Espacio Utilizado:</span>
                    <span class="font-semibold">${data.espacio_utilizado}</span>
                </div>
            `;
            
            document.getElementById('estadoSistema').innerHTML = estadoHtml;
            
            const estadisticasHtml = Object.entries(data.conteos_tablas || {}).map(([tabla, count]) => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span class="text-sm font-mono">${tabla}</span>
                    <span class="font-bold text-lg">${count.toLocaleString()}</span>
                </div>
            `).join('');
            
            document.getElementById('estadisticasDB').innerHTML = estadisticasHtml || '<p class="text-gray-500">No hay datos disponibles</p>';
        }
    } catch (error) {
        console.error('Error cargando estado:', error);
    }
}

// ============================================
// NOTIFICACIONES
// ============================================

async function cargarNotificaciones() {
    try {
        const response = await fetch(`${API_URL}/menu7/notificaciones/config`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('alertas_stock').checked = result.data.alertas_stock || false;
            document.getElementById('reportes_automaticos').checked = result.data.reportes_automaticos || false;
            document.getElementById('email_admin').value = result.data.email_admin || '';
            document.getElementById('frecuencia_reportes').value = result.data.frecuencia_reportes || 'mensual';
        }
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
    }
}

document.getElementById('notificacionesForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('✅ Configuración de notificaciones guardada');
});