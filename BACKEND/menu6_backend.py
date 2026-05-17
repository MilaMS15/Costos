# BACKEND/menu6_backend.py
from flask import jsonify, request
from database import BaseService

# Crear servicio para la tabla específica del Menú 6
Menu6Service = BaseService("menu6_tabla")  # Cambia por el nombre real de la tabla

def register_menu6_routes(app):
    """Registra todas las rutas del Menú 6"""
    
    @app.route('/api/menu6/datos', methods=['GET'])
    def menu6_listar():
        try:
            datos = Menu6Service.listar_todo()
            return jsonify({'success': True, 'data': datos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu6/datos', methods=['POST'])
    def menu6_crear():
        try:
            datos = request.json
            resultado = Menu6Service.insertar(datos)
            return jsonify({'success': True, 'data': resultado}), 201
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu6/datos/<int:id>', methods=['DELETE'])
    def menu6_eliminar(id):
        try:
            Menu6Service.eliminar('id', id)
            return jsonify({'success': True, 'mensaje': 'Eliminado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Agrega más rutas según necesite tu amigo