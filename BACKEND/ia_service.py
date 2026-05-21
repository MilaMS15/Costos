# BACKEND/ia_service.py - PROMPT MEJORADO (AMIGABLE)
import os
import requests
from flask import jsonify, request
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def register_ia_routes(app):
    @app.route('/api/ia/chat', methods=['POST'])
    def ia_chat():
        try:
            datos = request.json
            mensaje = datos.get('mensaje', '')
            pagina = datos.get('pagina', 'general')
            intentos_previos = datos.get('intentos', 0)
            
            print(f"📨 Pregunta: '{mensaje}' (intento {intentos_previos + 1})")
            
            if not GEMINI_API_KEY:
                print("❌ No hay API Key de Gemini configurada")
                return jsonify({
                    'success': True,
                    'respuesta': "¡Hola! Soy Uni. Estoy en modo básico, pero igual puedo ayudarte. ¿Qué necesitas?",
                    'navegar_a': None
                })
            
            try:
                modelo = "gemini-2.5-flash"
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent?key={GEMINI_API_KEY}"
                
                # PROMPT MEJORADO - MÁS AMIGABLE
                prompt = f"""
                Eres "Uni", una asistente virtual amable, cálida y profesional para un taller textil.
                
                PERSONALIDAD:
                - Eres amigable y cercana, como una compañera de trabajo
                - Usas un tono cálido pero profesional
                - Puedes usar emoticones ocasionalmente 
                - Saludas y te despides de forma natural
                - Te preocupas por ayudar al usuario de verdad
                
                REGLAS:
                1. Saluda solo si el usuario te saluda primero (Hola, Buenos días, etc.)
                2. Responde de forma NATURAL, no robotizada
                3. Explica conceptos técnicos (MP, MOD, CIF) de manera sencilla
                4. Sé útil: si no sabes algo, dilo honestamente
                5. Responde en español, con frases consisas y amables
                6. Sé CONCISO - máximo 2 oraciones
                7. Puedes hacer preguntas para entender mejor lo que necesita
                
                
                EJEMPLOS DE RESPUESTAS:
                - Usuario: "Hola" → "¡Hola! ¿Cómo estás? Soy Uni, tu asistente. ¿En qué te ayudo hoy? "
                - Usuario: "Te quiero" → "¡Qué lindo! Yo también te aprecio mucho. Ahora, ¿en qué puedo ayudarte con tus costos o producción? "
                - Usuario: "Cómo calculo el costo MOD" → "¡Buena pregunta! El costo MOD se calcula así: (sueldo del trabajador × horas trabajadas) / unidades producidas. ¿Quieres que te ayude a calcular uno en específico?"
                - Usuario: "Gracias" → "¡De nada! Para eso estoy aquí. ¿Necesitas algo más? "
                
                Contexto adicional: El usuario está en la página: {pagina}
                
                Pregunta del usuario: {mensaje}
                
                RESPUESTA (sé natural y amigable):
                """
                
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
                
                print(f"📡 Llamando a Gemini con modelo: {modelo}")
                response = requests.post(url, json=payload, timeout=30)
                
                if response.status_code == 200:
                    result = response.json()
                    respuesta = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "No entendí")
                    
                    # Limpiar respuestas que empiecen con comillas
                    if respuesta.startswith('"') and respuesta.endswith('"'):
                        respuesta = respuesta[1:-1]
                    
                    print(f"✅ Respuesta: {respuesta[:100]}...")
                    return jsonify({'success': True, 'respuesta': respuesta, 'navegar_a': None})
                    
                elif response.status_code == 503 and intentos_previos < 2:
                    return jsonify({
                        'success': True,
                        'respuesta': "¡Uy! El servicio está un poquito saturado. Dame un segundo y lo intentamos de nuevo... 🔄",
                        'reintentar': True,
                        'intentos': intentos_previos + 1,
                        'mensaje_original': mensaje
                    })
                else:
                    # Respuesta por defecto amigable
                    return jsonify({
                        'success': True,
                        'respuesta': "¡Lo siento! Tuve un pequeño problema técnico. ¿Podrías intentarlo de nuevo? Te estoy esperando para ayudarte 💙",
                        'navegar_a': None
                    })
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                return jsonify({
                    'success': True,
                    'respuesta': "¡Ay! Algo salió mal. Pero no te preocupes, estoy aquí. ¿Podrías repetir tu pregunta? 🙏",
                    'navegar_a': None
                })
                
        except Exception as e:
            print(f"❌ Error general: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500