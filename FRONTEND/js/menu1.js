// FRONTEND/js/menu1.js
async function cargarDatos() {
    try {
        const response = await fetch(`${API_URL}/menu1/datos`);
        const result = await response.json();
        if (result.success) {
            console.log('Datos recibidos:', result.data);
            // Renderizar aquí
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Menú 1 cargado');
});