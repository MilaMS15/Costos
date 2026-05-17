# BACKEND/menu7_backend.py
from flask import jsonify, request
from database import BaseService

# Crear servicio para la tabla específica del Menú 7
Menu7Service = BaseService("menu7_tabla")  # Cambia por el nombre real de la tabla

def register_menu7_routes(app):
    """Registra todas las rutas del Menú 7"""
    
    @app.route('/api/menu7/datos', methods=['GET'])
    def menu7_listar():
        try:
            datos = Menu7Service.listar_todo()
            return jsonify({'success': True, 'data': datos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu7/datos', methods=['POST'])
    def menu7_crear():
        try:
            datos = request.json
            resultado = Menu7Service.insertar(datos)
            return jsonify({'success': True, 'data': resultado}), 201
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu7/datos/<int:id>', methods=['DELETE'])
    def menu7_eliminar(id):
        try:
            Menu7Service.eliminar('id', id)
            return jsonify({'success': True, 'mensaje': 'Eliminado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Agrega más rutas según necesite tu amigo