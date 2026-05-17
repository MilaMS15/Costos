# BACKEND/menu4_backend.py
from flask import jsonify, request
from database import BaseService

# Crear servicio para la tabla específica del Menú 4
Menu4Service = BaseService("menu4_tabla")  # Cambia por el nombre real de la tabla

def register_menu4_routes(app):
    """Registra todas las rutas del Menú 4"""
    
    @app.route('/api/menu4/datos', methods=['GET'])
    def menu4_listar():
        try:
            datos = Menu4Service.listar_todo()
            return jsonify({'success': True, 'data': datos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu4/datos', methods=['POST'])
    def menu4_crear():
        try:
            datos = request.json
            resultado = Menu4Service.insertar(datos)
            return jsonify({'success': True, 'data': resultado}), 201
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu4/datos/<int:id>', methods=['DELETE'])
    def menu4_eliminar(id):
        try:
            Menu4Service.eliminar('id', id)
            return jsonify({'success': True, 'mensaje': 'Eliminado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Agrega más rutas según necesite tu amigo