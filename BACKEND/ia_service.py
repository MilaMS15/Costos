# BACKEND/ia_service.py - VERSIÓN CORREGIDA (SIN DUPLICACIÓN)
import os
import requests
import httpx
from flask import jsonify, request
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NGROK_URL = os.getenv("NGROK_URL", "")

def register_ia_routes(app):
    
    # ============================================
    # ENDPOINT PARA DEEPSEEK LOCAL
    # ============================================
    @app.route('/api/ia/deepseek', methods=['POST'])
    def ia_deepseek_local():
        try:
            datos = request.json
            mensaje = datos.get('mensaje', '')
            
            if not NGROK_URL:
                return jsonify({
                    'success': False,
                    'error': 'DeepSeek local no configurado',
                    'respuesta': None
                })
            
            print(f"📨 Enviando a DeepSeek local: '{mensaje}'")
            
            try:
                response = requests.post(
                    f"{NGROK_URL}/ask",
                    headers={"ngrok-skip-browser-warning": "true"},
                    json={"question": mensaje},
                    timeout=60
                )
                
                if response.status_code == 200:
                    data = response.json()
                    respuesta = data.get('answer', '')
                    
                    # 🔥 NO AGREGAR NADA EXTRA AQUÍ
                    print(f"✅ Respuesta DeepSeek: {respuesta[:100]}...")
                    return jsonify({
                        'success': True,
                        'respuesta': respuesta,
                        'modo': 'deepseek_local'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': f'Error {response.status_code}',
                        'respuesta': f"⚠️ No pude conectar con DeepSeek local. ¿Tu PC está encendida y Ngrok corriendo?"
                    })
                    
            except requests.exceptions.Timeout:
                return jsonify({
                    'success': False,
                    'error': 'Timeout',
                    'respuesta': "⏰ La IA local tardó demasiado en responder. Intenta nuevamente."
                })
            except requests.exceptions.ConnectionError:
                return jsonify({
                    'success': False,
                    'error': 'ConnectionError',
                    'respuesta': "🔌 No puedo conectar con DeepSeek local. Asegúrate que:\n1. Tu PC esté encendida\n2. Ngrok esté corriendo\n3. La URL en Render esté actualizada"
                })
                
        except Exception as e:
            print(f"❌ Error en ia_deepseek_local: {e}")
            return jsonify({'success': False, 'error': str(e), 'respuesta': None}), 500
    
    # ============================================
    # ENDPOINT PARA VERIFICAR ESTADO
    # ============================================
    @app.route('/api/ia/deepseek/estado', methods=['GET'])
    def ia_deepseek_estado():
        if not NGROK_URL:
            return jsonify({
                'disponible': False,
                'mensaje': 'NGROK_URL no configurada'
            })
        
        try:
            response = requests.get(
                f"{NGROK_URL}/health", 
                headers={"ngrok-skip-browser-warning": "true"},
                timeout=5
            )
            if response.status_code == 200:
                return jsonify({
                    'disponible': True,
                    'mensaje': '✅ DeepSeek local conectado',
                    'url': NGROK_URL
                })
            else:
                return jsonify({
                    'disponible': False,
                    'mensaje': f'⚠️ Error {response.status_code}'
                })
        except requests.exceptions.ConnectionError:
            return jsonify({
                'disponible': False,
                'mensaje': '❌ DeepSeek local no disponible'
            })
        except Exception as e:
            return jsonify({
                'disponible': False,
                'mensaje': f'Error: {str(e)}'
            })
    
    # ============================================
    # ENDPOINT PRINCIPAL /api/ia/chat (CORREGIDO)
    # ============================================
    @app.route('/api/ia/chat', methods=['POST'])
    def ia_chat():
        try:
            datos = request.json
            mensaje = datos.get('mensaje', '')
            pagina = datos.get('pagina', 'general')
            intentos_previos = datos.get('intentos', 0)
            modo = datos.get('modo', 'gemini')
            
            print(f"📨 Modo: {modo} | Pregunta: '{mensaje}'")
            
            # ========== MODO DEEPSEEK ==========
            if modo == 'deepseek':
                try:
                    if not NGROK_URL:
                        return jsonify({
                            'success': True,
                            'respuesta': "⚠️ DeepSeek local no está configurado. Configura NGROK_URL en Render.\n\n💡 Usa el otro botón para cambiar a modo Gemini.",
                            'navegar_a': None
                        })
                    
                    response = requests.post(
                        f"{NGROK_URL}/ask",
                        headers={"ngrok-skip-browser-warning": "true"},
                        json={"question": mensaje},
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        respuesta = data.get('answer', '')
                        
                        # 🔥 NO AGREGAR NADA EXTRA AQUÍ (la respuesta ya viene completa desde api_server.py)
                        return jsonify({
                            'success': True,
                            'respuesta': respuesta,
                            'navegar_a': None,
                            'modo': 'deepseek'
                        })
                    else:
                        return jsonify({
                            'success': True,
                            'respuesta': f"❌ Error conectando con DeepSeek local: {response.status_code}\n\n💡 ¿Tu PC está encendida y Ngrok corriendo? Cambia al modo Gemini.",
                            'navegar_a': None
                        })
                        
                except requests.exceptions.ConnectionError:
                    return jsonify({
                        'success': True,
                        'respuesta': "🔌 No puedo conectar con DeepSeek local.\n\n**Posibles causas:**\n- Tu PC está apagada\n- Ngrok no está corriendo\n- La URL de Ngrok cambió\n\n💡 Cambia al modo Gemini usando el botón.",
                        'navegar_a': None
                    })
                except Exception as e:
                    print(f"Error DeepSeek: {e}")
                    return jsonify({
                        'success': True,
                        'respuesta': f"⚠️ Error con DeepSeek local: {str(e)[:100]}",
                        'navegar_a': None
                    })
            
            # ========== MODO GEMINI ==========
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
                
                prompt = f"""
                Eres "Uni", una asistente virtual amable, cálida y profesional para un taller textil.
                
                PERSONALIDAD:
                - Eres amigable y cercana, como una compañera de trabajo
                - Usas un tono cálido pero profesional
                - Puedes usar emoticones ocasionalmente 
                - Saludas y te despides de forma natural
                - Te preocupas por ayudar al usuario de verdad
                
                REGLAS:
                1. Saluda solo si el usuario te saluda primero
                2. Responde de forma NATURAL, no robotizada
                3. Sé concisa - máximo 2 oraciones
                4. Responde en español
                
                Pregunta del usuario: {mensaje}
                
                Respuesta:
                """
                
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
                
                print(f"📡 Llamando a Gemini...")
                response = requests.post(url, json=payload, timeout=30)
                
                if response.status_code == 200:
                    result = response.json()
                    respuesta = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "No entendí")
                    
                    if respuesta.startswith('"') and respuesta.endswith('"'):
                        respuesta = respuesta[1:-1]
                    
                    print(f"✅ Respuesta Gemini: {respuesta[:100]}...")
                    return jsonify({'success': True, 'respuesta': respuesta, 'navegar_a': None, 'modo': 'gemini'})
                    
                elif response.status_code == 503 and intentos_previos < 2:
                    return jsonify({
                        'success': True,
                        'respuesta': "¡Uy! El servicio está un poquito saturado. Dame un segundo... 🔄",
                        'reintentar': True,
                        'intentos': intentos_previos + 1,
                        'mensaje_original': mensaje
                    })
                else:
                    return jsonify({
                        'success': True,
                        'respuesta': "¡Lo siento! Tuve un pequeño problema técnico. ¿Podrías intentarlo de nuevo? 💙",
                        'navegar_a': None
                    })
                    
            except Exception as e:
                print(f"❌ Error Gemini: {e}")
                return jsonify({
                    'success': True,
                    'respuesta': "¡Ay! Algo salió mal. ¿Podrías repetir tu pregunta? 🙏",
                    'navegar_a': None
                })
                
        except Exception as e:
            print(f"❌ Error general: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500