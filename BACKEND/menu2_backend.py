# BACKEND/menu2_backend.py
from flask import jsonify, request
from database import SupabaseBrain
from servicios import (
    OrdenTrabajoService, PersonalService, 
    ProductoService, MaterialesService,
    RecetaManoObraService,RecetaProductoService, OrdenMaterialesService
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

def register_menu2_routes(app):
    
    @app.route('/api/menu2/kpis-produccion', methods=['GET'])
    def kpis_produccion():
        """Obtener KPIs completos del módulo de producción"""
        try:
            supabase = SupabaseBrain.get_client()
            hoy = datetime.now()
            
            # 1. KPIs de Eficiencia
            personal = PersonalService.listar_todo()
            productividades = [float(p.get('productividad', 0) or 0) for p in personal]
            eficiencia_promedio = (sum(productividades) / len(productividades)) if productividades else 0
            
            # 2. KPIs de Órdenes
            ordenes = OrdenTrabajoService.listar_todo()
            total_ordenes = len(ordenes)
            completadas = [o for o in ordenes if o.get('estado') == 'COMPLETADA']
            pendientes = [o for o in ordenes if o.get('estado') == 'PENDIENTE']
            en_proceso = [o for o in ordenes if o.get('estado') == 'EN_PROCESO']
            
            # Órdenes atrasadas (fecha_entrega < hoy y no completadas)
            atrasadas = []
            for o in ordenes:
                if o.get('estado') != 'COMPLETADA' and o.get('fecha_entrega'):
                    fecha_entrega = datetime.strptime(o['fecha_entrega'], '%Y-%m-%d')
                    if fecha_entrega < hoy:
                        atrasadas.append(o)
            
            # Tasa de cumplimiento
            entregas_a_tiempo = [o for o in completadas if o.get('fecha_entrega') and 
                                 datetime.strptime(o['fecha_entrega'], '%Y-%m-%d') >= hoy]
            cumplimiento = (len(entregas_a_tiempo) / len(completadas) * 100) if completadas else 0
            
            # 3. KPIs de Tiempos
            tiempos_trabajo = RecetaManoObraService.listar_todo()
            tiempo_promedio_producto = 0
            if tiempos_trabajo:
                suma_tiempos = sum(float(t.get('tiempotrabajo', 0) or 0) for t in tiempos_trabajo)
                tiempo_promedio_producto = suma_tiempos / len(tiempos_trabajo)
            
            # 4. KPIs de Costos de Producción (usando tus datos reales)
            # Costo promedio por orden
            costos_ordenes = [float(o.get('costo_total', 0) or 0) for o in ordenes if o.get('costo_total')]
            costo_promedio_orden = sum(costos_ordenes) / len(costos_ordenes) if costos_ordenes else 0
            
            # Costo MP por orden (desde orden_materiales)
            materiales_orden = OrdenMaterialesService.listar_todo()
            costo_mp_total = sum(float(m.get('subtotal', 0) or 0) for m in materiales_orden)
            
            # 5. Proyecciones
            # Órdenes para próximos 7 días
            fecha_limite = hoy + timedelta(days=7)
            ordenes_proximas = []
            for o in ordenes:
                if o.get('fecha_entrega'):
                    fecha_entrega = datetime.strptime(o['fecha_entrega'], '%Y-%m-%d')
                    if hoy <= fecha_entrega <= fecha_limite and o.get('estado') != 'COMPLETADA':
                        ordenes_proximas.append(o)
            
            # Backlog total
            backlog = sum(o.get('cantidad_solicitada', 0) - o.get('cantidad_producida', 0) 
                         for o in ordenes if o.get('estado') != 'COMPLETADA')
            
            return jsonify({
                'success': True,
                'data': {
                    # KPIs de Eficiencia
                    'eficiencia': {
                        'productividad_promedio': round(eficiencia_promedio * 100, 1),
                        'tiempo_promedio_producto_min': round(tiempo_promedio_producto, 2),
                        'total_trabajadores': len(personal),
                        'horas_totales_mes': sum(p.get('tiempototal_min', 0) for p in personal) / 60
                    },
                    
                    # KPIs de Órdenes
                    'ordenes': {
                        'total': total_ordenes,
                        'completadas': len(completadas),
                        'pendientes': len(pendientes),
                        'en_proceso': len(en_proceso),
                        'atrasadas': len(atrasadas),
                        'cumplimiento_entregas': round(cumplimiento, 1)
                    },
                    
                    # KPIs de Costos
                    'costos': {
                        'costo_promedio_orden': round(costo_promedio_orden, 2),
                        'costo_mp_total': round(costo_mp_total, 2),
                        'costo_mp_por_orden': round(costo_mp_total / total_ordenes, 2) if total_ordenes else 0
                    },
                    
                    # KPIs de Planta
                    'planta': {
                        'backlog_unidades': backlog,
                        'ordenes_proximas_7d': len(ordenes_proximas),
                        'capacidad_utilizada': round((len(en_proceso) / total_ordenes * 100) if total_ordenes else 0, 1),
                        'oee_estimado': round(eficiencia_promedio * 0.85 * 0.95 * 100, 1)  # Ejemplo
                    },
                    
                    # Alertas
                    'alertas': {
                        'produccion_critica': len(atrasadas) > 3,
                        'baja_productividad': eficiencia_promedio < 0.7,
                        'alto_backlog': backlog > 1000
                    },
                    
                    'timestamp': hoy.isoformat()
                }
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500
    
    # Endpoint adicional para KPIs por producto específico
    @app.route('/api/menu2/kpis-producto/<int:codigo_producto>', methods=['GET'])
    def kpis_producto(codigo_producto):
        """KPIs específicos de un producto"""
        try:
            # Obtener producto
            productos = ProductoService.obtener_por_id('codigoproducto', codigo_producto)
            if not productos:
                return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404
            
            producto = productos[0]
            
            # Obtener recetas
            recetas_mp = [r for r in RecetaProductoService.listar_todo() 
                         if r.get('codigoproducto') == codigo_producto]
            recetas_mo = [r for r in RecetaManoObraService.listar_todo() 
                         if r.get('codigoproducto') == codigo_producto]
            
            # Órdenes de este producto
            ordenes = [o for o in OrdenTrabajoService.listar_todo() 
                      if o.get('codigo_producto') == codigo_producto]
            
            # Cálculos
            total_solicitado = sum(o.get('cantidad_solicitada', 0) for o in ordenes)
            total_producido = sum(o.get('cantidad_producida', 0) for o in ordenes)
            
            tiempo_total = sum(float(r.get('tiempotrabajo', 0) or 0) for r in recetas_mo)
            costo_mp_total = sum(float(r.get('cantidadnecesaria', 0) or 0) * 
                                float(MaterialesService.obtener_por_id('codigomaterial', r.get('codigomaterial'))[0].get('costounitario', 0))
                                for r in recetas_mp)
            
            return jsonify({
                'success': True,
                'data': {
                    'producto': producto.get('producto'),
                    'unidades_solicitadas': total_solicitado,
                    'unidades_producidas': total_producido,
                    'cumplimiento': round((total_producido / total_solicitado * 100) if total_solicitado else 0, 1),
                    'tiempo_produccion_min': tiempo_total,
                    'costo_mp_unitario': round(costo_mp_total, 2),
                    'numero_recetas_mp': len(recetas_mp),
                    'numero_trabajadores_asignados': len(recetas_mo),
                    'ordenes_asociadas': len(ordenes)
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500