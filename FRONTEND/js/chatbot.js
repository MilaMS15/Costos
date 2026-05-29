// FRONTEND/js/chatbot.js - CON VOZ
(function() {
    if (document.querySelector('.chatbot-container')) return;
    
    const usuario = localStorage.getItem('usuario');
    if (!usuario) return;
    
    console.log('Chatbot iniciado con voz');
    
    // ==================== FUNCIÓN DE VOZ ====================

    // ==================== VOZ FEMENINA CORREGIDA ====================
    let vozActiva = false;
    let vocesCargadas = false;

    function hablar(texto) {
        if (!texto || texto.length === 0) return;
        
        // Detener voz anterior
        if (vozActiva) {
            window.speechSynthesis.cancel();
            vozActiva = false;
        }
        
        if (!('speechSynthesis' in window)) return;
        
        vozActiva = true;
        
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        function hablarConVoz() {
            const voices = window.speechSynthesis.getVoices();
            
            // Buscar voz FEMENINA por nombre exacto
            let selectedVoice = null;
            
            // Prioridad: 1. Microsoft Sabina, 2. Google español
            selectedVoice = voices.find(v => v.name === 'Microsoft Sabina - Spanish (Mexico)');
            
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.name === 'Google español');
            }
            
            if (!selectedVoice) {
                // Si no encuentra ninguna, usar cualquier voz femenina disponible
                selectedVoice = voices.find(v => 
                    (v.name.toLowerCase().includes('sabina') ||
                    v.name.toLowerCase().includes('female') ||
                    v.name.toLowerCase().includes('google español')) &&
                    (v.lang === 'es-MX' || v.lang === 'es-ES')
                );
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log('🎤 Usando voz:', selectedVoice.name);
            } else {
                console.log('⚠️ No se encontró voz femenina, usando voz por defecto');
            }
            
            utterance.lang = 'es-MX';  // Español México
            utterance.onend = () => { vozActiva = false; };
            utterance.onerror = () => { vozActiva = false; };
            
            window.speechSynthesis.speak(utterance);
        }
        
        // Cargar voces si es necesario
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                setTimeout(hablarConVoz, 100);
            };
        } else {
            setTimeout(hablarConVoz, 100);
        }
    }
        
    // ==================== ESTILOS ====================
    const style = document.createElement('style');
    style.textContent = `
        .chatbot-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        }
        .chatbot-button {
            width: 55px;
            height: 55px;
            background: #FF9F1C;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.2s;
        }
        .chatbot-button:hover { transform: scale(1.05); }
        .chatbot-window {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: 320px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            overflow: hidden;
            display: none;
            flex-direction: column;
        }
        .chatbot-window.open { display: flex; }
        .chatbot-header {
            background: #1B263B;
            color: white;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chatbot-messages {
            height: 300px;
            overflow-y: auto;
            padding: 12px;
            background: #f5f5f5;
        }
        .message { margin-bottom: 10px; display: flex; }
        .message.bot { justify-content: flex-start; }
        .message.user { justify-content: flex-end; }
        .message-bubble {
            max-width: 85%;
            padding: 8px 12px;
            border-radius: 16px;
            font-size: 13px;
        }
        .message.bot .message-bubble {
            background: white;
            color: #333;
            border-bottom-left-radius: 4px;
        }
        .message.user .message-bubble {
            background: #FF9F1C;
            color: white;
            border-bottom-right-radius: 4px;
        }
        .message-bubble.waiting {
            background: #f0f0f0;
            color: #666;
            font-style: italic;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        .chatbot-input {
            display: flex;
            padding: 10px;
            border-top: 1px solid #ddd;
            background: white;
        }
        .chatbot-input input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
            font-size: 13px;
        }
        .chatbot-input button {
            background: #1B263B;
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            margin-left: 8px;
            cursor: pointer;
        }
        /* Botón de voz */
        .voice-button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            margin-left: 5px;
            padding: 5px;
            border-radius: 50%;
            transition: background 0.2s;
        }
        .voice-button:hover {
            background: #e0e0e0;
        }
    `;
    document.head.appendChild(style);
    
    // ==================== HTML ====================
    const html = `
        <div class="chatbot-container">
            <div class="chatbot-button" id="chatbotButton">
                <span style="font-size: 28px;">🤖</span>
            </div>
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <span>🤖 Asistente Unik'a</span>
                    <span id="closeChatbot" style="cursor: pointer;">✕</span>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="message bot">
                        <div class="message-bubble">¡Hola! Soy Uni, tu asistente amigable. 🌟<br><br>
                        Puedo ayudarte con:<br>
                        • Costos de producción<br>
                        • Materiales y productos<br>
                        • Mano de obra<br>
                        • Órdenes de trabajo<br><br>
                        ¿En qué te ayudo hoy? 😊</div>
                    </div>
                </div>
                <div class="chatbot-input">
                    <input type="text" id="chatbotInput" placeholder="Escribe tu pregunta...">
                    <button id="sendMessage">➤</button>
                    <button id="voiceInputBtn" class="voice-button" title="Hablar en lugar de escribir">🎤</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    // ==================== ELEMENTOS ====================
    const btn = document.getElementById('chatbotButton');
    const windowEl = document.getElementById('chatbotWindow');
    const closeBtn = document.getElementById('closeChatbot');
    const input = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('sendMessage');
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    const messagesContainer = document.getElementById('chatbotMessages');
    
    let isOpen = false;
    let reintentando = false;
    
    btn.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) windowEl.classList.add('open');
        else windowEl.classList.remove('open');
    };
    
    closeBtn.onclick = () => {
        isOpen = false;
        windowEl.classList.remove('open');
    };
    
    // ==================== RECONOCIMIENTO DE VOZ (entrada) ====================
    let recognition = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        voiceInputBtn.onclick = () => {
            voiceInputBtn.textContent = '🎙️';
            voiceInputBtn.style.background = '#FF9F1C';
            recognition.start();
        };
        
        recognition.onresult = (event) => {
            const texto = event.results[0][0].transcript;
            input.value = texto;
            voiceInputBtn.textContent = '🎤';
            voiceInputBtn.style.background = '';
            enviarMensaje();
        };
        
        recognition.onerror = () => {
            voiceInputBtn.textContent = '🎤';
            voiceInputBtn.style.background = '';
        };
        
        recognition.onend = () => {
            voiceInputBtn.textContent = '🎤';
            voiceInputBtn.style.background = '';
        };
    } else {
        voiceInputBtn.style.display = 'none';
    }
    
    // ==================== FUNCIONES ====================
    function agregarMensaje(texto, tipo, esEspera = false) {
        const div = document.createElement('div');
        div.className = `message ${tipo}`;
        if (esEspera) {
            div.innerHTML = `<div class="message-bubble waiting">${texto}</div>`;
        } else {
            div.innerHTML = `<div class="message-bubble">${texto}</div>`;
        }
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return div;
    }
    
    function mostrarPensando() {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.id = 'thinking';
        div.innerHTML = '<div class="message-bubble">🤔 Uni está pensando... ¡Ya vuelvo!</div>';
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return div;
    }
        
    function eliminarPensando() {
        const thinking = document.getElementById('thinking');
        if (thinking) thinking.remove();
    }
    
    async function enviarMensaje() {
        if (reintentando) {
            agregarMensaje("⚠️ Ya estoy procesando una consulta, espera un momento...", 'bot');
            return;
        }
        
        const mensaje = input.value.trim();
        if (!mensaje) return;
        
        agregarMensaje(mensaje, 'user');
        input.value = '';
        
        reintentando = true;
        
        async function hacerPeticion(texto, intentos = 0) {
            const thinkingDiv = mostrarPensando();
            
            try {
                const response = await fetch('/api/ia/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mensaje: texto,
                        pagina: window.location.pathname,
                        intentos: intentos
                    })
                });
                
                const result = await response.json();
                eliminarPensando();
                
                if (result.success) {
                    if (result.reintentar && intentos < 3) {
                        const esperaMsg = agregarMensaje(result.respuesta, 'bot', true);
                        setTimeout(async () => {
                            esperaMsg.remove();
                            await hacerPeticion(result.mensaje_original, intentos + 1);
                        }, 3000);
                        return;
                    }
                    
                    let respuesta = result.respuesta;
                    
                    // Limpiar saludos innecesarios
                    const preguntasSaludo = ['hola', 'buenas', 'saludos'];
                    const esSaludo = preguntasSaludo.some(p => texto.toLowerCase().includes(p));
                    if (!esSaludo && respuesta.toLowerCase().startsWith('hola')) {
                        respuesta = respuesta.replace(/^¡?Hola!?\s*/i, '').trim();
                        if (respuesta === '') respuesta = result.respuesta;
                    }
                    
                    agregarMensaje(respuesta, 'bot');
                    hablar(respuesta); // 👈 HABLAR LA RESPUESTA
                    
                    if (result.navegar_a) {
                        setTimeout(() => {
                            window.location.href = result.navegar_a;
                        }, 1500);
                    }
                } else {
                    agregarMensaje('Error: ' + result.error, 'bot');
                }
            } catch (error) {
                eliminarPensando();
                agregarMensaje('Error de conexión. Por favor, intenta de nuevo.', 'bot');
            } finally {
                reintentando = false;
            }
        }
        
        await hacerPeticion(mensaje);
    }
    
    sendBtn.onclick = enviarMensaje;
    input.onkeypress = (e) => { if (e.key === 'Enter') enviarMensaje(); };
    
    console.log('Chatbot listo con voz');
})();
// FRONTEND/js/chatbot.js - AGREGAR SELECTOR DE MODO

// ... (código existente se mantiene, solo agrega estas líneas)

// ==================== SELECTOR DE MODO ====================
let modoIA = localStorage.getItem('modoIA') || 'gemini'; // 'gemini' o 'deepseek'

function actualizarIndicadorModo() {
    const modoBtn = document.getElementById('modoIaBtn');
    const modoTexto = document.getElementById('modoTexto');
    if (modoBtn) {
        if (modoIA === 'deepseek') {
            modoBtn.textContent = '🧠';
            modoBtn.title = 'Modo: DeepSeek (Tus PDFs) - Cambiar a Gemini';
            modoBtn.style.background = '#10b981';
        } else {
            modoBtn.textContent = '✨';
            modoBtn.title = 'Modo: Gemini (General) - Cambiar a DeepSeek';
            modoBtn.style.background = '#1B263B';
        }
    }
    if (modoTexto) {
        modoTexto.textContent = modoIA === 'deepseek' ? '📚 Modo Curso' : '✨ Modo General';
    }
}

async function verificarEstadoDeepSeek() {
    try {
        const response = await fetch('/api/ia/deepseek/estado');
        const data = await response.json();
        const estadoDeepseek = document.getElementById('estadoDeepseek');
        if (estadoDeepseek) {
            if (data.disponible) {
                estadoDeepseek.innerHTML = '🟢';
                estadoDeepseek.title = data.mensaje;
            } else {
                estadoDeepseek.innerHTML = '🔴';
                estadoDeepseek.title = data.mensaje;
            }
        }
    } catch (error) {
        console.error('Error verificando DeepSeek:', error);
    }
}

function cambiarModo() {
    modoIA = modoIA === 'gemini' ? 'deepseek' : 'gemini';
    localStorage.setItem('modoIA', modoIA);
    actualizarIndicadorModo();
    
    // Mostrar mensaje de confirmación
    const modoMsg = modoIA === 'deepseek' 
        ? '✅ Cambiaste a modo DEEPSEEK. Ahora responderé usando los PDFs de tu curso.' 
        : '✅ Cambiaste a modo GEMINI. Ahora responderé como Uni, tu asistente general.';
    
    agregarMensaje(modoMsg, 'bot');
    verificarEstadoDeepSeek();
}

// Modificar la función enviarMensaje para usar el modo seleccionado
async function enviarMensaje() {
    if (reintentando) {
        agregarMensaje("⚠️ Ya estoy procesando una consulta, espera un momento...", 'bot');
        return;
    }
    
    const mensaje = input.value.trim();
    if (!mensaje) return;
    
    agregarMensaje(mensaje, 'user');
    input.value = '';
    
    reintentando = true;
    
    async function hacerPeticion(texto, intentos = 0) {
        const thinkingDiv = mostrarPensando();
        
        try {
            // 🔥 ENVIAR EL MODO SELECCIONADO
            const response = await fetch('/api/ia/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje: texto,
                    pagina: window.location.pathname,
                    intentos: intentos,
                    modo: modoIA  // <-- NUEVO: enviar el modo actual
                })
            });
            
            const result = await response.json();
            eliminarPensando();
            
            if (result.success) {
                if (result.reintentar && intentos < 3) {
                    const esperaMsg = agregarMensaje(result.respuesta, 'bot', true);
                    setTimeout(async () => {
                        esperaMsg.remove();
                        await hacerPeticion(result.mensaje_original, intentos + 1);
                    }, 3000);
                    return;
                }
                
                let respuesta = result.respuesta;
                
                // Si es modo deepseek y no hay conexión, sugerir cambiar de modo
                if (modoIA === 'deepseek' && respuesta.includes('No puedo conectar')) {
                    respuesta += '\n\n💡 **¿Probar con modo Gemini?** Haz clic en el botón ✨/🧠 para cambiar.';
                }
                
                agregarMensaje(respuesta, 'bot');
                hablar(respuesta);
                
                if (result.navegar_a) {
                    setTimeout(() => {
                        window.location.href = result.navegar_a;
                    }, 1500);
                }
            } else {
                agregarMensaje('Error: ' + result.error, 'bot');
            }
        } catch (error) {
            eliminarPensando();
            agregarMensaje('Error de conexión. Por favor, intenta de nuevo.', 'bot');
        } finally {
            reintentando = false;
        }
    }
    
    await hacerPeticion(mensaje);
}

// Modificar el HTML del chatbot para agregar el selector y estado
function generarHTML() {
    return `
        <div class="chatbot-container">
            <div class="chatbot-button" id="chatbotButton">
                <span style="font-size: 28px;">🤖</span>
            </div>
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <span>🤖 Asistente Unik'a</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span id="estadoDeepseek" style="font-size: 12px;" title="Estado DeepSeek">🔄</span>
                        <button id="modoIaBtn" style="background: #1B263B; border: none; color: white; border-radius: 20px; padding: 4px 10px; cursor: pointer; font-size: 12px;">✨</button>
                        <span id="closeChatbot" style="cursor: pointer;">✕</span>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="message bot">
                        <div class="message-bubble">¡Hola! Soy Uni, tu asistente. 🌟<br><br>
                        <span id="modoTexto" style="font-weight: bold;">✨ Modo General</span><br><br>
                        Puedo ayudarte con:<br>
                        • Costos de producción<br>
                        • Materiales y productos<br>
                        • Mano de obra<br>
                        • Órdenes de trabajo<br><br>
                        💡 **NUEVO:** Haz clic en el botón ✨/🧠 para cambiar al modo DEEPSEEK y responderé SOLO con el contenido de los PDFs que subiste a tu curso.<br><br>
                        ¿En qué te ayudo hoy? 😊</div>
                    </div>
                </div>
                <div class="chatbot-input">
                    <input type="text" id="chatbotInput" placeholder="Escribe tu pregunta...">
                    <button id="sendMessage">➤</button>
                    <button id="voiceInputBtn" class="voice-button" title="Hablar en lugar de escribir">🎤</button>
                </div>
            </div>
        </div>
    `;
}

// Al inicializar, reemplazar el HTML y configurar eventos
// (modifica donde insertas el HTML para usar generarHTML())