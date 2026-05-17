# BACKEND/menu2_backend.py
from flask import jsonify, request
from database import BaseService

# Crear servicio para la tabla específica del Menú 2
Menu2Service = BaseService("menu2_tabla")  # Cambia por el nombre real de la tabla

def register_menu2_routes(app):
    """Registra todas las rutas del Menú 2"""
    
    @app.route('/api/menu2/datos', methods=['GET'])
    def menu2_listar():
        try:
            datos = Menu2Service.listar_todo()
            return jsonify({'success': True, 'data': datos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu2/datos', methods=['POST'])
    def menu2_crear():
        try:
            datos = request.json
            resultado = Menu2Service.insertar(datos)
            return jsonify({'success': True, 'data': resultado}), 201
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu2/datos/<int:id>', methods=['DELETE'])
    def menu2_eliminar(id):
        try:
            Menu2Service.eliminar('id', id)
            return jsonify({'success': True, 'mensaje': 'Eliminado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Agrega más rutas según necesite tu amigo