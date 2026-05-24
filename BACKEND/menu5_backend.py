# BACKEND/menu5_backend.py
from flask import jsonify, request
from servicios import PersonalService, MODService, ProductoService, RecetaManoObraService, OrdenTrabajoService
from database import SupabaseBrain
from datetime import datetime, timedelta
from collections import defaultdict
import random

def register_menu5_routes(app):
    """Menú 5: Talento Humano - Productividad y Costos Laborales"""

    @app.route('/api/rh/trabajadores', methods=['GET'])
    def rh_listar_trabajadores():
        """Devuelve todos los trabajadores con datos completos"""
        try:
            trabajadores = PersonalService.listar_todo()
            return jsonify({'success': True, 'data': trabajadores})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/rh/resumen', methods=['GET'])
    def rh_resumen_costos():
        """KPIs de costos laborales completos"""
        try:
            trabajadores = PersonalService.listar_todo()
            if not trabajadores:
                return jsonify({'success': True, 'data': get_resumen_vacio()})

            total_planilla = sum(float(t.get('sueldototal', 0) or 0) for t in trabajadores)
            total_essalud = sum(float(t.get('essalud', 0) or 0) for t in trabajadores)
            total_bonificacion = sum(float(t.get('bonificacion', 0) or 0) for t in trabajadores)
            total_asig_familiar = sum(float(t.get('asigfamiliar', 0) or 0) for t in trabajadores)
            total_gratificaciones = sum(
                (float(t.get('gratificacionjulio', 0) or 0) + float(t.get('gratificaciondiciembre', 0) or 0))
                for t in trabajadores
            )
            total_cts = sum(float(t.get('cts', 0) or 0) for t in trabajadores)
            
            # Calcular productividad promedio
            productividades = [float(t.get('productividad', 0) or 0) for t in trabajadores]
            productividad_promedio = (sum(productividades) / len(productividades)) * 100 if productividades else 0
            
            # Calcular costo por hora promedio
            costo_hora_promedio = 0
            for t in trabajadores:
                sueldo_total = float(t.get('sueldototal', 0) or 0)
                tiempo_total = float(t.get('tiempototal_min', 0) or 0) / 60  # convertir a horas
                productividad = float(t.get('productividad', 0) or 1)
                if productividad == 0:
                    productividad = 1
                horas_efectivas = tiempo_total * productividad
                if horas_efectivas > 0:
                    costo_hora_promedio += sueldo_total / horas_efectivas
            
            costo_hora_promedio = costo_hora_promedio / len(trabajadores) if trabajadores else 0

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
                    'total_cts': round(total_cts, 2),
                    'productividad_promedio': round(productividad_promedio, 1),
                    'costo_hora_promedio': round(costo_hora_promedio, 2)
                }
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/rh/productividad', methods=['GET'])
    def rh_productividad():
        """Análisis de productividad por trabajador"""
        try:
            trabajadores = PersonalService.listar_todo()
            recetas_mo = RecetaManoObraService.listar_todo()
            
            resultados = []
            for t in trabajadores:
                codigo = t.get('codigotrabajador')
                nombre = t.get('apellidosnombres', '')
                puesto = t.get('puestotrabajo', '')
                productividad = float(t.get('productividad', 0) or 0) * 100
                tiempo_total = float(t.get('tiempototal_min', 0) or 0)
                
                # Calcular productos asignados
                productos_asignados = [r.get('codigoproducto') for r in recetas_mo 
                                      if r.get('codigotrabajador') == codigo]
                
                # Calcular horas totales trabajadas
                horas_trabajadas = tiempo_total / 60
                
                # Sueldo por hora efectiva
                sueldo_total = float(t.get('sueldototal', 0) or 0)
                if productividad > 0:
                    horas_efectivas = horas_trabajadas * (productividad / 100)
                    costo_hora_efectiva = sueldo_total / horas_efectivas if horas_efectivas > 0 else 0
                else:
                    costo_hora_efectiva = sueldo_total / horas_trabajadas if horas_trabajadas > 0 else 0
                
                # Nivel de eficiencia
                if productividad >= 90:
                    nivel = "Excelente"
                    color = "green"
                elif productividad >= 75:
                    nivel = "Bueno"
                    color = "blue"
                elif productividad >= 60:
                    nivel = "Regular"
                    color = "yellow"
                else:
                    nivel = "Crítico"
                    color = "red"
                
                resultados.append({
                    'codigo': codigo,
                    'nombre': nombre,
                    'puesto': puesto,
                    'productividad': round(productividad, 1),
                    'horas_totales': round(horas_trabajadas, 1),
                    'costo_hora_efectiva': round(costo_hora_efectiva, 2),
                    'sueldo_total': round(sueldo_total, 2),
                    'productos_asignados': len(set(productos_asignados)),
                    'nivel': nivel,
                    'color': color
                })
            
            # Ordenar por productividad descendente
            resultados.sort(key=lambda x: x['productividad'], reverse=True)
            
            return jsonify({'success': True, 'data': resultados})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/rh/analisis-puestos', methods=['GET'])
    def rh_analisis_puestos():
        """Análisis por puesto de trabajo"""
        try:
            trabajadores = PersonalService.listar_todo()
            
            puestos = defaultdict(lambda: {
                'cantidad': 0,
                'total_sueldo': 0,
                'total_productividad': 0,
                'total_horas': 0
            })
            
            for t in trabajadores:
                puesto = t.get('puestotrabajo', 'No especificado')
                sueldo = float(t.get('sueldototal', 0) or 0)
                productividad = float(t.get('productividad', 0) or 0)
                horas = float(t.get('tiempototal_min', 0) or 0) / 60
                
                puestos[puesto]['cantidad'] += 1
                puestos[puesto]['total_sueldo'] += sueldo
                puestos[puesto]['total_productividad'] += productividad
                puestos[puesto]['total_horas'] += horas
            
            resultados = []
            for puesto, datos in puestos.items():
                resultados.append({
                    'puesto': puesto,
                    'cantidad': datos['cantidad'],
                    'sueldo_promedio': round(datos['total_sueldo'] / datos['cantidad'], 2),
                    'productividad_promedio': round((datos['total_productividad'] / datos['cantidad']) * 100, 1),
                    'horas_promedio': round(datos['total_horas'] / datos['cantidad'], 1),
                    'costo_total': round(datos['total_sueldo'], 2)
                })
            
            # Ordenar por costo total descendente
            resultados.sort(key=lambda x: x['costo_total'], reverse=True)
            
            return jsonify({'success': True, 'data': resultados})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # BACKEND/menu5_backend.py - Endpoint corregido
    @app.route('/api/rh/evolucion-planilla', methods=['GET'])
    def rh_evolucion_planilla():
        """Evolución histórica REAL de costos de planilla desde tablapersonal"""
        try:
            supabase = SupabaseBrain.get_client()
            
            # Obtener todos los trabajadores con fechas de registro
            trabajadores = PersonalService.listar_todo()
            
            if not trabajadores:
                # Si no hay datos, retornar estructura vacía
                return jsonify({
                    'success': True,
                    'data': {
                        'meses': [],
                        'sueldos': [],
                        'essalud': [],
                        'productividad': [],
                        'trabajadores_por_mes': []
                    }
                })
            
            # Agrupar por mes de registro
            from datetime import datetime
            from collections import defaultdict
            
            agrupado = defaultdict(lambda: {
                'total_sueldo': 0,
                'total_essalud': 0,
                'total_productividad': 0,
                'conteo': 0
            })
            
            for t in trabajadores:
                fecha_registro = t.get('fecharegistro')
                if not fecha_registro:
                    continue
                
                # Extraer año-mes de la fecha
                try:
                    if isinstance(fecha_registro, str):
                        fecha_obj = datetime.strptime(fecha_registro, '%Y-%m-%d')
                    else:
                        fecha_obj = fecha_registro
                    
                    mes_key = fecha_obj.strftime('%Y-%m')
                    nombre_mes = fecha_obj.strftime('%b')  # Ene, Feb, Mar, etc.
                    
                    sueldo_total = float(t.get('sueldototal', 0) or 0)
                    essalud = float(t.get('essalud', 0) or 0)
                    productividad = float(t.get('productividad', 0) or 0)
                    
                    agrupado[mes_key]['total_sueldo'] += sueldo_total
                    agrupado[mes_key]['total_essalud'] += essalud
                    agrupado[mes_key]['total_productividad'] += productividad
                    agrupado[mes_key]['conteo'] += 1
                    agrupado[mes_key]['nombre'] = nombre_mes
                    
                except Exception as e:
                    print(f"Error procesando fecha: {e}")
                    continue
            
            # Ordenar por mes
            meses_ordenados = sorted(agrupado.keys())
            
            # Construir respuesta
            meses_nombres = []
            sueldos = []
            essalud = []
            productividad_promedio = []
            trabajadores_por_mes = []
            
            for mes in meses_ordenados:
                datos = agrupado[mes]
                meses_nombres.append(datos['nombre'])
                sueldos.append(round(datos['total_sueldo'], 2))
                essalud.append(round(datos['total_essalud'], 2))
                
                # Productividad promedio del mes
                prod_prom = (datos['total_productividad'] / datos['conteo']) * 100 if datos['conteo'] > 0 else 0
                productividad_promedio.append(round(prod_prom, 1))
                trabajadores_por_mes.append(datos['conteo'])
            
            return jsonify({
                'success': True,
                'data': {
                    'meses': meses_nombres,
                    'sueldos': sueldos,
                    'essalud': essalud,
                    'productividad': productividad_promedio,
                    'trabajadores_por_mes': trabajadores_por_mes,
                    'meses_completos': meses_ordenados
                }
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    def get_resumen_vacio():
        return {
            'total_trabajadores': 0,
            'total_planilla': 0,
            'promedio_sueldo': 0,
            'total_essalud': 0,
            'total_bonificacion': 0,
            'total_asig_familiar': 0,
            'total_gratificaciones': 0,
            'total_cts': 0,
            'productividad_promedio': 0,
            'costo_hora_promedio': 0
        }