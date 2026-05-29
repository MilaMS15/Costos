// FRONTEND/js/chatbot.js - CON VOZ Y SELECTOR DE MODO
(function() {
    if (document.querySelector('.chatbot-container')) return;
    
    const usuario = localStorage.getItem('usuario');
    if (!usuario) return;
    
    console.log('Chatbot iniciado con selector de modo');
    
    // ==================== VARIABLES GLOBALES ====================
    let modoIA = localStorage.getItem('modoIA') || 'gemini';
    let vozActiva = false;
    let isOpen = false;
    let reintentando = false;
    let recognition = null;
    
    // ==================== FUNCIÓN DE VOZ ====================
    function hablar(texto) {
        if (!texto || texto.length === 0) return;
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
            let selectedVoice = voices.find(v => v.name === 'Microsoft Sabina - Spanish (Mexico)');
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.name === 'Google español');
            }
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log('🎤 Usando voz:', selectedVoice.name);
            }
            utterance.lang = 'es-MX';
            utterance.onend = () => { vozActiva = false; };
            utterance.onerror = () => { vozActiva = false; };
            window.speechSynthesis.speak(utterance);
        }
        
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
            width: 340px;
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
            height: 320px;
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
            gap: 5px;
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
            cursor: pointer;
            font-size: 16px;
        }
        .voice-button {
            background: #f0f0f0 !important;
            color: #333 !important;
        }
        .voice-button:hover {
            background: #e0e0e0 !important;
        }
        .modo-btn {
            background: #1B263B;
            border: none;
            color: white;
            border-radius: 20px;
            padding: 4px 10px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        .estado-deepseek {
            font-size: 14px;
            cursor: help;
        }
        .header-buttons {
            display: flex;
            gap: 8px;
            align-items: center;
        }
    `;
    document.head.appendChild(style);
    
    // ==================== FUNCIONES DEL CHAT ====================
    function agregarMensaje(texto, tipo, esEspera = false) {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const div = document.createElement('div');
        div.className = `message ${tipo}`;
        if (esEspera) {
            div.innerHTML = `<div class="message-bubble waiting">${texto}</div>`;
        } else {
            div.innerHTML = `<div class="message-bubble">${texto.replace(/\n/g, '<br>')}</div>`;
        }
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return div;
    }
    
    function mostrarPensando() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return null;
        
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
    
    // ==================== MODO Y ESTADO ====================
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
            const estadoDeepseek = document.getElementById('estadoDeepseek');
            if (estadoDeepseek) {
                estadoDeepseek.innerHTML = '⚠️';
                estadoDeepseek.title = 'Error verificando conexión';
            }
        }
    }
    
    function cambiarModo() {
        modoIA = modoIA === 'gemini' ? 'deepseek' : 'gemini';
        localStorage.setItem('modoIA', modoIA);
        actualizarIndicadorModo();
        
        const modoMsg = modoIA === 'deepseek' 
            ? '✅ Cambiaste a modo DEEPSEEK. Ahora responderé usando los PDFs de tu curso.' 
            : '✅ Cambiaste a modo GEMINI. Ahora responderé como Uni, tu asistente general.';
        
        agregarMensaje(modoMsg, 'bot');
        verificarEstadoDeepSeek();
    }
    
    // ==================== ENVIAR MENSAJE ====================
    async function enviarMensaje() {
        const input = document.getElementById('chatbotInput');
        if (!input) return;
        
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
            mostrarPensando();
            
            try {
                const response = await fetch('/api/ia/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mensaje: texto,
                        pagina: window.location.pathname,
                        intentos: intentos,
                        modo: modoIA
                    })
                });
                
                const result = await response.json();
                eliminarPensando();
                
                if (result.success) {
                    if (result.reintentar && intentos < 3) {
                        const esperaMsg = agregarMensaje(result.respuesta, 'bot', true);
                        setTimeout(async () => {
                            if (esperaMsg) esperaMsg.remove();
                            await hacerPeticion(result.mensaje_original, intentos + 1);
                        }, 3000);
                        return;
                    }
                    
                    let respuesta = result.respuesta;
                    
                    // Limpiar saludos innecesarios
                    const preguntasSaludo = ['hola', 'buenas', 'saludos'];
                    const esSaludo = preguntasSaludo.some(p => texto.toLowerCase().includes(p));
                    if (!esSaludo && respuesta && respuesta.toLowerCase().startsWith('hola')) {
                        respuesta = respuesta.replace(/^¡?Hola!?\s*/i, '').trim();
                        if (respuesta === '') respuesta = result.respuesta;
                    }
                    
                    if (respuesta) {
                        agregarMensaje(respuesta, 'bot');
                        hablar(respuesta);
                    }
                    
                    if (result.navegar_a) {
                        setTimeout(() => {
                            window.location.href = result.navegar_a;
                        }, 1500);
                    }
                } else {
                    agregarMensaje('Error: ' + (result.error || 'Desconocido'), 'bot');
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
    
    // ==================== HTML DEL CHATBOT ====================
    const html = `
        <div class="chatbot-container">
            <div class="chatbot-button" id="chatbotButton">
                <span style="font-size: 28px;">🤖</span>
            </div>
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <span>🤖 Asistente Unik'a</span>
                    <div class="header-buttons">
                        <span id="estadoDeepseek" class="estado-deepseek" title="Verificando conexión...">🔄</span>
                        <button id="modoIaBtn" class="modo-btn">✨</button>
                        <span id="closeChatbot" style="cursor: pointer;">✕</span>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="message bot">
                        <div class="message-bubble">
                            ¡Hola! Soy Uni, tu asistente. 🌟<br><br>
                            <strong id="modoTexto">✨ Modo General</strong><br><br>
                            Puedo ayudarte con:<br>
                            • Costos de producción<br>
                            • Materiales y productos<br>
                            • Mano de obra<br>
                            • Órdenes de trabajo<br><br>
                            💡 <strong>NUEVO:</strong> Haz clic en el botón <strong>✨/🧠</strong> para cambiar al modo <strong>DEEPSEEK</strong> y responderé SOLO con el contenido de los PDFs de tu curso.<br><br>
                            ¿En qué te ayudo hoy? 😊
                        </div>
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
    
    // ==================== EVENTOS ====================
    const btn = document.getElementById('chatbotButton');
    const windowEl = document.getElementById('chatbotWindow');
    const closeBtn = document.getElementById('closeChatbot');
    const input = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('sendMessage');
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    const modoBtn = document.getElementById('modoIaBtn');
    
    if (btn) {
        btn.onclick = () => {
            isOpen = !isOpen;
            if (isOpen) {
                windowEl.classList.add('open');
                verificarEstadoDeepSeek();
            } else {
                windowEl.classList.remove('open');
            }
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            isOpen = false;
            windowEl.classList.remove('open');
        };
    }
    
    if (sendBtn) sendBtn.onclick = enviarMensaje;
    if (input) input.onkeypress = (e) => { if (e.key === 'Enter') enviarMensaje(); };
    if (modoBtn) modoBtn.onclick = cambiarModo;
    
    // ==================== RECONOCIMIENTO DE VOZ ====================
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        if (voiceInputBtn) {
            voiceInputBtn.onclick = () => {
                voiceInputBtn.textContent = '🎙️';
                voiceInputBtn.style.background = '#FF9F1C';
                recognition.start();
            };
        }
        
        recognition.onresult = (event) => {
            const texto = event.results[0][0].transcript;
            if (input) input.value = texto;
            if (voiceInputBtn) {
                voiceInputBtn.textContent = '🎤';
                voiceInputBtn.style.background = '';
            }
            enviarMensaje();
        };
        
        recognition.onerror = () => {
            if (voiceInputBtn) {
                voiceInputBtn.textContent = '🎤';
                voiceInputBtn.style.background = '';
            }
        };
        
        recognition.onend = () => {
            if (voiceInputBtn) {
                voiceInputBtn.textContent = '🎤';
                voiceInputBtn.style.background = '';
            }
        };
    } else if (voiceInputBtn) {
        voiceInputBtn.style.display = 'none';
    }
    
    // Inicializar
    actualizarIndicadorModo();
    verificarEstadoDeepSeek();
    console.log('Chatbot listo con selector de modo - Modo actual:', modoIA);
})();