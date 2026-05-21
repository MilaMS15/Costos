# BACKEND/menu4_backend.py
from flask import jsonify, request

def register_menu4_routes(app):
    """Rutas iniciales del Menú 4 (Costos Industriales)"""
    @app.route('/api/menu4/status', methods=['GET'])
    def menu4_status():
        return jsonify({'success': True, 'mensaje': 'Módulo de Costos Industriales Activo'})