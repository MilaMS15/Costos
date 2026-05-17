# BACKEND/menu1_backend.py
from flask import jsonify, request
from database import BaseService

# Crear servicio para la tabla específica del Menú 1
Menu1Service = BaseService("menu1_tabla")  # Cambia por el nombre real de la tabla

def register_menu1_routes(app):
    """Registra todas las rutas del Menú 1"""
    
    @app.route('/api/menu1/datos', methods=['GET'])
    def menu1_listar():
        try:
            datos = Menu1Service.listar_todo()
            return jsonify({'success': True, 'data': datos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu1/datos', methods=['POST'])
    def menu1_crear():
        try:
            datos = request.json
            resultado = Menu1Service.insertar(datos)
            return jsonify({'success': True, 'data': resultado}), 201
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu1/datos/<int:id>', methods=['DELETE'])
    def menu1_eliminar(id):
        try:
            Menu1Service.eliminar('id', id)
            return jsonify({'success': True, 'mensaje': 'Eliminado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Agrega más rutas según necesite tu amigo