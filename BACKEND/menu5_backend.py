# BACKEND/menu5_backend.py
from flask import jsonify, request
from database import BaseService

# Crear servicio para la tabla específica del Menú 5
Menu5Service = BaseService("menu5_tabla")  # Cambia por el nombre real de la tabla

def register_menu5_routes(app):
    """Registra todas las rutas del Menú 5"""
    
    @app.route('/api/menu5/datos', methods=['GET'])
    def menu5_listar():
        try:
            datos = Menu5Service.listar_todo()
            return jsonify({'success': True, 'data': datos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu5/datos', methods=['POST'])
    def menu5_crear():
        try:
            datos = request.json
            resultado = Menu5Service.insertar(datos)
            return jsonify({'success': True, 'data': resultado}), 201
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu5/datos/<int:id>', methods=['DELETE'])
    def menu5_eliminar(id):
        try:
            Menu5Service.eliminar('id', id)
            return jsonify({'success': True, 'mensaje': 'Eliminado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Agrega más rutas según necesite tu amigo