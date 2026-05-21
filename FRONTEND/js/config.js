
//LOCALMENTE

//const API_URL = window.location.origin + '/api';
//console.log("🔗 API_URL detectada dinámicamente:", API_URL);
// FRONTEND/js/config.js - Configuración Híbrida Automática (PC + Web + Celular)

//En la web

let BASE_URL = "";

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // 💻 1. Si estás en tu PC local probando el sistema:
    BASE_URL = "http://localhost:5000";
} else {
    // 🌐 2. Si estás en la Web o desde el Celular:
    // Apunta directamente a tu servidor real de Render
    BASE_URL = "https://projectcostosgrupo3.onrender.com";
}

// Exportamos la API_URL limpia con el sufijo /api que usan tus scripts
const API_URL = BASE_URL + '/api';

console.log("🔗 Conexión establecida con la API en:", API_URL);

// enlace de inicio sesion : https://projectcostosgrupo3.onrender.com/login.html
// enlace de celular : https://projectcostosgrupo3.onrender.com/kardex_movil.html