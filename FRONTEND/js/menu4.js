// FRONTEND/js/menu4.js

async function verificarEstadoModulo() {
    try {
        const response = await fetch(`${API_URL}/menu4/status`);
        const result = await response.json();
        if (result.success) {
            document.getElementById('status-backend').textContent = result.mensaje;
        }
    } catch (error) {
        console.error('Error al conectar con el backend del Menú 4:', error);
        document.getElementById('status-backend').textContent = 'Error de conexión con el servidor';
        document.getElementById('status-backend').parentElement.classList.replace('bg-gray-50', 'bg-red-50');
    }
}

// Inicialización automática al cargar la interfaz
document.addEventListener('DOMContentLoaded', () => {
    console.log('Módulo de Costos Industriales (Menú 4) listo.');
    verificarEstadoModulo();
});