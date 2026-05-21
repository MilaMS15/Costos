// Archivo de configuración global
// Cambia esta URL cuando despliegues el backend en Render
// Reemplaza "tu-backend-render" por el nombre que te dio Render

//const API_URL = "https://projectcostosgrupo3.onrender.com";

//const API_URL = 'http://localhost:5000/api';
// FRONTEND/js/config.js
//const API_URL = '/api';
// Para desarrollo local, comenta la línea de arriba y descomenta la de abajo:
// const API_URL = 'http://localhost:5000/api';
// FRONTEND/js/config.js
// FRONTEND/js/config.js

// Detecta automáticamente el protocolo y host actual (ej: http://192.168.1.15:5000 o https://xxxx.ngrok-free.app)
//const API_URL = window.location.origin + '/api';

//console.log("🔗 API_URL detectada dinámicamente:", API_URL);
// FRONTEND/js/config.js - Configuración Híbrida Automática (PC + Web + Celular)

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