# BACKEND/menu5_backend.py
from flask import jsonify, request
from servicios import PersonalService, MODService
from database import BaseService

# Servicio genérico por si se necesita para otra tabla
Menu5Service = BaseService("menu5_tabla")

def register_menu5_routes(app):
    """Registra todas las rutas del Menú 5 – Recursos Humanos"""

    @app.route('/api/rh/trabajadores', methods=['GET'])
    def rh_listar_trabajadores():
        """Devuelve todos los trabajadores con todos sus campos de costos"""
        try:
            trabajadores = PersonalService.listar_todo()
            return jsonify({'success': True, 'data': trabajadores})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/rh/resumen', methods=['GET'])
    def rh_resumen_costos():
        """Calcula KPIs de costos laborales: totales, promedios, ESSALUD, etc."""
        try:
            trabajadores = PersonalService.listar_todo()
            if not trabajadores:
                return jsonify({'success': True, 'data': {
                    'total_trabajadores': 0,
                    'total_planilla': 0,
                    'promedio_sueldo': 0,
                    'total_essalud': 0,
                    'total_bonificacion': 0,
                    'total_asig_familiar': 0,
                    'total_gratificaciones': 0,
                    'total_cts': 0
                }})

            total_planilla = sum(float(t.get('sueldototal', 0) or 0) for t in trabajadores)
            total_essalud = sum(float(t.get('essalud', 0) or 0) for t in trabajadores)
            total_bonificacion = sum(float(t.get('bonificacion', 0) or 0) for t in trabajadores)
            total_asig_familiar = sum(float(t.get('asigfamiliar', 0) or 0) for t in trabajadores)
            total_gratificaciones = sum(
                (float(t.get('gratificacionjulio', 0) or 0) + float(t.get('gratificaciondiciembre', 0) or 0))
                for t in trabajadores
            )
            total_cts = sum(float(t.get('cts', 0) or 0) for t in trabajadores)

            return jsonify({
                'success': True,
                'data': {
                    'total_trabajadores': len(trabajadores),
                    'total_planilla': round(total_planilla, 2),
                    'promedio_sueldo': round(total_planilla / len(trabajadores), 2) if trabajadores else 0,
                    'total_essalud': round(total_essalud, 2),
                    'total_bonificacion': round(total_bonificacion, 2),
                    'total_asig_familiar': round(total_asig_familiar, 2),
                    'total_gratificaciones': round(total_gratificaciones, 2),
                    'total_cts': round(total_cts, 2)
                }
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # Ruta genérica de ejemplo (opcional)
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