# BACKEND/menu3_backend.py
from flask import jsonify, request
from database import BaseService

# Crear servicio para la tabla específica del Menú 3
Menu3Service = BaseService("menu3_tabla")  # Cambia por el nombre real de la tabla

def register_menu3_routes(app):
    """Registra todas las rutas del Menú 3"""
    
    @app.route('/api/menu3/datos', methods=['GET'])
    def menu3_listar():
        try:
            datos = Menu3Service.listar_todo()
            return jsonify({'success': True, 'data': datos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu3/datos', methods=['POST'])
    def menu3_crear():
        try:
            datos = request.json
            resultado = Menu3Service.insertar(datos)
            return jsonify({'success': True, 'data': resultado}), 201
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu3/datos/<int:id>', methods=['DELETE'])
    def menu3_eliminar(id):
        try:
            Menu3Service.eliminar('id', id)
            return jsonify({'success': True, 'mensaje': 'Eliminado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Agrega más rutas según necesite tu amigo