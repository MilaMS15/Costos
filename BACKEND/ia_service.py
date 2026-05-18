# BACKEND/ia_service.py - CON REINTENTOS CONTROLADOS
import os
import time
import requests
from flask import jsonify, request
from dotenv import load_dotenv

load_dotenv()
# Poner la key directamente (solución más rápida)
GEMINI_API_KEY = "AIzaSyD9A_GOlYT93IkkHFXqct_NezK5ZrphFfU"

def register_ia_routes(app):
    @app.route('/api/ia/chat', methods=['POST'])
    def ia_chat():
        try:
            datos = request.json
            mensaje = datos.get('mensaje', '')
            pagina = datos.get('pagina', 'general')
            intentos_previos = datos.get('intentos', 0)  # Recibir intentos del frontend
            
            print(f"📨 Pregunta: '{mensaje}' (intento {intentos_previos + 1})")
            
            if GEMINI_API_KEY:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
                    
                    prompt = f"""
                    Eres "Aurora", un asistente EXPERTO en contabilidad de costos para talleres textiles.
                    
                    REGLAS ESTRICTAS:
                    1. NO saludes al usuario a menos que te diga "hola" explícitamente
                    2. Ve DIRECTAMENTE al grano - responde la pregunta sin introducciones
                    3. Sé CONCISO - máximo 2 oraciones
                    4. Usa términos técnicos de costos (MP, MOD, CIF)
                    5. Responde SIEMPRE en español
                    
                    EJEMPLOS:
                    - Usuario: "qué son los costos de materia prima?" → "Los costos de materia prima (MP) son el valor de los insumos directos como telas, hilos y botones que se incorporan al producto final."
                    - Usuario: "hola" → "¡Hola! Soy Aurora, tu asistente de contabilidad. ¿En qué puedo ayudarte?"

                    Pregunta del usuario: {mensaje}
                    """
                    
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}]
                    }
                    
                    print(f"📡 Llamando a Gemini...")
                    response = requests.post(url, json=payload, timeout=30)
                    
                    if response.status_code == 200:
                        result = response.json()
                        respuesta = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "No entendí")
                        print(f"✅ Respuesta generada")
                        return jsonify({'success': True, 'respuesta': respuesta, 'navegar_a': None})
                    
                    elif response.status_code == 503:
                        print(f"⚠️ Gemini ocupado (503)")
                        
                        # Si ya llevamos 3 intentos, rendirnos
                        if intentos_previos >= 3:
                            return jsonify({
                                'success': True,
                                'respuesta': "🔴 El servicio está con mucha demanda. Por favor, intenta de nuevo en unos momentos.",
                                'navegar_a': None
                            })
                        
                        # Pedir al frontend que reintente con un mensaje de espera
                        return jsonify({
                            'success': True,
                            'respuesta': "🔄 El servicio está con mucha demanda. Reintentando automáticamente...",
                            'reintentar': True,
                            'intentos': intentos_previos + 1,
                            'mensaje_original': mensaje
                        })
                    
                    else:
                        return jsonify({
                            'success': True,
                            'respuesta': f"Lo siento, tuve un problema técnico. Por favor, intenta de nuevo.",
                            'navegar_a': None
                        })
                        
                except Exception as e:
                    print(f"❌ Error: {e}")
                    return jsonify({
                        'success': True,
                        'respuesta': "Lo siento, tuve un problema. Por favor, intenta de nuevo.",
                        'navegar_a': None
                    })
            
            return jsonify({
                'success': True,
                'respuesta': "Hola, soy Aurora. Estoy en modo básico.",
                'navegar_a': None
            })
                
        except Exception as e:
            print(f"❌ Error general: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500