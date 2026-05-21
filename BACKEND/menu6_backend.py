# BACKEND/menu6_backend.py
from flask import jsonify, request
from servicios import GAService, GVService

def register_menu6_routes(app):
    """Registra las rutas del Menú 6 vinculadas a las finanzas reales de la empresa"""
    
    @app.route('/api/menu6/finanzas/gastos-fijos', methods=['GET'])
    def menu6_listar_gastos():
        """
        Extrae y unifica la información real de las tablas maestras 
        'tablaga' y 'tablagv' de Supabase para el desglose del dashboard.
        """
        try:
            # Obtener datos reales de tus servicios de base de datos
            datos_ga = GAService.listar_todo() or []
            datos_gv = GVService.listar_todo() or []
            
            lista_gastos = []
            
            # Formatear Gastos Administrativos (GA)
            for ga in datos_ga:
                lista_gastos.append({
                    'id': ga.get('codigoga'),
                    'tipo': 'Administrativo (GA)',
                    'denominacion': ga.get('denominacion', 'Gasto Administrativo'),
                    'monto': float(ga.get('monto') or 0)
                })
                
            # Formatear Gastos de Ventas (GV)
            for gv in datos_gv:
                lista_gastos.append({
                    'id': gv.get('codigogv'),
                    'tipo': 'Ventas (GV)',
                    'denominacion': gv.get('denominacion', 'Gasto de Ventas'),
                    'monto': float(gv.get('monto') or 0)
                })
                
            # Ordenar los gastos de mayor a menor para una mejor analítica visual
            lista_gastos.sort(key=lambda x: x['monto'], reverse=True)
            
            return jsonify({'success': True, 'data': lista_gastos})
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': f"Error en base de datos: {str(e)}"}), 500