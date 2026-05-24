# BACKEND/menu4_backend.py
from flask import jsonify, request
from database import SupabaseBrain
from servicios import (
    MaterialesService, PersonalService, ProductoService,
    RecetaProductoService, RecetaManoObraService,
    CIFService, GAService, GVService
)
from datetime import datetime
from dateutil.relativedelta import relativedelta

def register_menu4_routes(app):
    
    @app.route('/api/menu4/dashboard', methods=['GET'])
    def menu4_dashboard():
        """Dashboard completo de costos industriales"""
        try:
            supabase = SupabaseBrain.get_client()
            
            # Obtener período (último mes completado por defecto)
            periodo = request.args.get('periodo')
            if not periodo:
                mes_actual = datetime.now()
                periodo = (mes_actual - relativedelta(months=1)).strftime("%Y-%m")
            
            # ============================================
            # 1. OBTENER DATOS DE VENTAS DEL PERÍODO
            # ============================================
            # Datos demo (reemplazar con tu tabla real de ventas)
            VENTAS_DEMO = {
                "2026-01": {21001: (1200, 25.50), 21002: (800, 28.00), 21003: (950, 18.00),
                           21004: (400, 55.00), 21005: (320, 48.00)},
                "2026-02": {21001: (1400, 25.50), 21002: (750, 28.00), 21003: (1100, 18.00),
                           21004: (380, 55.00), 21005: (410, 48.00)},
                "2026-03": {21001: (1350, 26.00), 21002: (820, 28.50), 21003: (1050, 18.50),
                           21004: (420, 56.00), 21005: (360, 49.00)},
                "2026-04": {21001: (7000, 19.00), 21002: (6000, 21.00), 21003: (200, 23.00),
                           21004: (200, 28.00), 21005: (200, 25.00)}
            }
            
            ventas_mes = VENTAS_DEMO.get(periodo, {})
            ventas_totales = sum(v[0] * v[1] for v in ventas_mes.values())
            unidades_totales = sum(v[0] for v in ventas_mes.values())
            
            # ============================================
            # 2. CALCULAR COSTOS TOTALES
            # ============================================
            
            # Costo de Materia Prima
            materiales = MaterialesService.listar_todo()
            recetas_mp = RecetaProductoService.listar_todo()
            
            costo_mp_total = 0
            costo_mp_por_producto = {}
            
            for producto_id, (cantidad, _) in ventas_mes.items():
                costo_producto = 0
                for receta in recetas_mp:
                    if receta.get('codigoproducto') == producto_id:
                        cod_material = receta.get('codigomaterial')
                        cantidad_necesaria = float(receta.get('cantidadnecesaria', 0) or 0)
                        
                        # Buscar costo unitario del material
                        for m in materiales:
                            if m.get('codigomaterial') == cod_material:
                                costo_unitario = float(m.get('costounitario', 0) or 0)
                                subtotal = cantidad_necesaria * costo_unitario * cantidad
                                costo_producto += subtotal
                                break
                
                costo_mp_total += costo_producto
                costo_mp_por_producto[producto_id] = costo_producto
            
            # Costo de Mano de Obra Directa
            personal = PersonalService.listar_todo()
            recetas_mo = RecetaManoObraService.listar_todo()
            
            costo_mod_total = 0
            
            # Calcular costo por minuto de cada trabajador
            trabajadores_costos = {}
            for p in personal:
                cod_trabajador = p.get('codigotrabajador')
                sueldo_total = float(p.get('sueldototal', 0) or 0)
                tiempo_total = float(p.get('tiempototal_min', 0) or 0)
                productividad = float(p.get('productividad', 0) or 0)
                
                if productividad == 0:
                    productividad = 1.0
                
                tiempo_efectivo = tiempo_total * productividad
                costo_por_minuto = sueldo_total / tiempo_efectivo if tiempo_efectivo > 0 else 0
                trabajadores_costos[cod_trabajador] = costo_por_minuto
            
            # Calcular MOD por producto
            for producto_id, (cantidad, _) in ventas_mes.items():
                for receta in recetas_mo:
                    if receta.get('codigoproducto') == producto_id:
                        cod_trabajador = receta.get('codigotrabajador')
                        minutos = float(receta.get('tiempotrabajo', 0) or 0)
                        costo_minuto = trabajadores_costos.get(cod_trabajador, 0)
                        costo_mod_total += costo_minuto * minutos * cantidad
            
            # Costos Indirectos (CIF)
            cif_data = CIFService.listar_todo()
            costo_cif_total = sum(float(c.get('monto', 0) or 0) for c in cif_data)
            
            # Gastos Administrativos y de Ventas
            ga_data = GAService.listar_todo()
            gv_data = GVService.listar_todo()
            
            costo_ga_total = sum(float(g.get('monto', 0) or 0) for g in ga_data)
            costo_gv_total = sum(float(g.get('monto', 0) or 0) for g in gv_data)
            
            # ============================================
            # 3. CALCULAR KPIs PRINCIPALES
            # ============================================
            
            costo_total_produccion = costo_mp_total + costo_mod_total + costo_cif_total
            costo_total_operativo = costo_total_produccion + costo_ga_total + costo_gv_total
            
            # Margen Bruto
            margen_bruto = ventas_totales - costo_total_produccion
            margen_bruto_pct = (margen_bruto / ventas_totales * 100) if ventas_totales > 0 else 0
            
            # Utilidad Operativa
            utilidad_operativa = ventas_totales - costo_total_operativo
            margen_neto_pct = (utilidad_operativa / ventas_totales * 100) if ventas_totales > 0 else 0
            
            # Estructura de costos (%)
            pct_mp = (costo_mp_total / costo_total_produccion * 100) if costo_total_produccion > 0 else 0
            pct_mod = (costo_mod_total / costo_total_produccion * 100) if costo_total_produccion > 0 else 0
            pct_cif = (costo_cif_total / costo_total_produccion * 100) if costo_total_produccion > 0 else 0
            
            # Costo por unidad
            costo_unitario_promedio = costo_total_produccion / unidades_totales if unidades_totales > 0 else 0
            precio_promedio = ventas_totales / unidades_totales if unidades_totales > 0 else 0
            
            # ============================================
            # 4. RENTABILIDAD POR PRODUCTO
            # ============================================
            
            productos_rentabilidad = []
            productos = ProductoService.listar_todo()
            
            for producto in productos:
                codigo = producto.get('codigoproducto')
                nombre = producto.get('producto')
                
                if codigo in ventas_mes:
                    cantidad, precio = ventas_mes[codigo]
                    ventas_producto = cantidad * precio
                    
                    # Costo MP del producto
                    costo_mp_prod = costo_mp_por_producto.get(codigo, 0)
                    
                    # Costo MOD del producto
                    costo_mod_prod = 0
                    for receta in recetas_mo:
                        if receta.get('codigoproducto') == codigo:
                            cod_trab = receta.get('codigotrabajador')
                            minutos = float(receta.get('tiempotrabajo', 0) or 0)
                            costo_minuto = trabajadores_costos.get(cod_trab, 0)
                            costo_mod_prod += costo_minuto * minutos * cantidad
                    
                    # Costo CIF prorrateado por ventas
                    pct_ventas = ventas_producto / ventas_totales if ventas_totales > 0 else 0
                    costo_cif_prod = costo_cif_total * pct_ventas
                    
                    costo_total_prod = costo_mp_prod + costo_mod_prod + costo_cif_prod
                    utilidad_prod = ventas_producto - costo_total_prod
                    margen_prod = (utilidad_prod / ventas_producto * 100) if ventas_producto > 0 else 0
                    
                    productos_rentabilidad.append({
                        'codigo': codigo,
                        'nombre': nombre,
                        'ventas': round(ventas_producto, 2),
                        'costo_total': round(costo_total_prod, 2),
                        'utilidad': round(utilidad_prod, 2),
                        'margen': round(margen_prod, 1),
                        'cantidad': cantidad,
                        'precio': precio,
                        'costo_unitario': round(costo_total_prod / cantidad, 2) if cantidad > 0 else 0
                    })
            
            # Ordenar por margen (mayor a menor)
            productos_rentabilidad.sort(key=lambda x: x['margen'], reverse=True)
            
            # Top 3 más rentables y top 3 menos rentables
            top_rentables = productos_rentabilidad[:3]
            bottom_rentables = productos_rentabilidad[-3:] if len(productos_rentabilidad) > 3 else []
            
            # ============================================
            # 5. PUNTO DE EQUILIBRIO
            # ============================================
            
            # Costos Fijos (GA + GV + parte de CIF)
            costos_fijos = costo_ga_total + costo_gv_total + (costo_cif_total * 0.7)  # 70% de CIF se asume fijo
            
            # Costos Variables (MP + MOD + resto CIF)
            costos_variables = costo_mp_total + costo_mod_total + (costo_cif_total * 0.3)
            
            # Margen de contribución promedio
            margen_contribucion_promedio = (precio_promedio - costo_unitario_promedio) / precio_promedio if precio_promedio > 0 else 0
            
            # Punto de equilibrio en unidades
            punto_equilibrio_unidades = costos_fijos / (precio_promedio - costo_unitario_promedio) if (precio_promedio - costo_unitario_promedio) > 0 else 0
            
            # Punto de equilibrio en ventas
            punto_equilibrio_ventas = costos_fijos / margen_contribucion_promedio if margen_contribucion_promedio > 0 else 0
            
            # ============================================
            # 6. VARIABLES Y TENDENCIAS
            # ============================================
            
            # Comparativa con mes anterior
            periodo_anterior = (datetime.strptime(periodo, "%Y-%m") - relativedelta(months=1)).strftime("%Y-%m")
            ventas_anterior = VENTAS_DEMO.get(periodo_anterior, {})
            ventas_totales_anterior = sum(v[0] * v[1] for v in ventas_anterior.values())
            
            var_ventas = ((ventas_totales - ventas_totales_anterior) / ventas_totales_anterior * 100) if ventas_totales_anterior > 0 else 0
            
            # Tendencia de costos (simplificada)
            tendencia_costos = "estable"
            if pct_mp > 60:
                tendencia_costos = "preocupante"
            elif pct_mp > 50:
                tendencia_costos = "moderada"
            
            return jsonify({
                'success': True,
                'data': {
                    'periodo': periodo,
                    'resumen_general': {
                        'ventas_totales': round(ventas_totales, 2),
                        'unidades_vendidas': unidades_totales,
                        'costo_total_produccion': round(costo_total_produccion, 2),
                        'costo_total_operativo': round(costo_total_operativo, 2),
                        'utilidad_bruta': round(margen_bruto, 2),
                        'utilidad_neta': round(utilidad_operativa, 2),
                        'margen_bruto_pct': round(margen_bruto_pct, 1),
                        'margen_neto_pct': round(margen_neto_pct, 1)
                    },
                    'estructura_costos': {
                        'materia_prima': {
                            'monto': round(costo_mp_total, 2),
                            'porcentaje': round(pct_mp, 1)
                        },
                        'mano_obra_directa': {
                            'monto': round(costo_mod_total, 2),
                            'porcentaje': round(pct_mod, 1)
                        },
                        'costos_indirectos': {
                            'monto': round(costo_cif_total, 2),
                            'porcentaje': round(pct_cif, 1)
                        },
                        'gastos_administrativos': round(costo_ga_total, 2),
                        'gastos_ventas': round(costo_gv_total, 2)
                    },
                    'kpis_clave': {
                        'costo_unitario_promedio': round(costo_unitario_promedio, 2),
                        'precio_promedio': round(precio_promedio, 2),
                        'margen_contribucion': round(margen_contribucion_promedio * 100, 1),
                        'punto_equilibrio_unidades': round(punto_equilibrio_unidades),
                        'punto_equilibrio_ventas': round(punto_equilibrio_ventas, 2),
                        'roi_estimado': round((utilidad_operativa / costo_total_operativo * 100), 1) if costo_total_operativo > 0 else 0,
                        'variacion_ventas_mensual': round(var_ventas, 1),
                        'tendencia_costos': tendencia_costos
                    },
                    'rentabilidad_productos': {
                        'top_rentables': top_rentables,
                        'bottom_rentables': bottom_rentables,
                        'todos': productos_rentabilidad
                    },
                    'alertas': {
                        'margen_bajo': utilidad_operativa < ventas_totales * 0.1,
                        'costo_mp_alto': pct_mp > 55,
                        'punto_equilibrio_lejano': punto_equilibrio_unidades > unidades_totales * 0.8,
                        'productos_no_rentables': len([p for p in productos_rentabilidad if p['margen'] < 10])
                    }
                }
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu4/producto/<int:codigo>', methods=['GET'])
    def menu4_analisis_producto(codigo):
        """Análisis detallado de costo por producto específico"""
        try:
            periodo = request.args.get('periodo', datetime.now().strftime("%Y-%m"))
            
            # Obtener producto
            productos = ProductoService.obtener_por_id('codigoproducto', codigo)
            if not productos:
                return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404
            
            producto = productos[0]
            
            # Obtener recetas
            recetas_mp = RecetaProductoService.listar_todo()
            recetas_mo = RecetaManoObraService.listar_todo()
            
            # Filtrar por producto
            recetas_mp_prod = [r for r in recetas_mp if r.get('codigoproducto') == codigo]
            recetas_mo_prod = [r for r in recetas_mo if r.get('codigoproducto') == codigo]
            
            # Detalle de materiales
            materiales_detalle = []
            materiales = MaterialesService.listar_todo()
            
            costo_mp_unitario = 0
            for receta in recetas_mp_prod:
                cod_material = receta.get('codigomaterial')
                cantidad = float(receta.get('cantidadnecesaria', 0) or 0)
                unidad = receta.get('unidadmedida', '')
                nombre_material = receta.get('material', '')
                
                # Buscar costo
                costo_unitario = 0
                for m in materiales:
                    if m.get('codigomaterial') == cod_material:
                        costo_unitario = float(m.get('costounitario', 0) or 0)
                        break
                
                subtotal = cantidad * costo_unitario
                costo_mp_unitario += subtotal
                
                materiales_detalle.append({
                    'codigo': cod_material,
                    'nombre': nombre_material,
                    'unidad': unidad,
                    'cantidad': cantidad,
                    'costo_unitario': costo_unitario,
                    'subtotal': round(subtotal, 4)
                })
            
            # Detalle de mano de obra
            personal = PersonalService.listar_todo()
            mo_detalle = []
            costo_mod_unitario = 0
            
            for receta in recetas_mo_prod:
                cod_trabajador = receta.get('codigotrabajador')
                minutos = float(receta.get('tiempotrabajo', 0) or 0)
                
                # Buscar trabajador
                for p in personal:
                    if p.get('codigotrabajador') == cod_trabajador:
                        sueldo_total = float(p.get('sueldototal', 0) or 0)
                        tiempo_total = float(p.get('tiempototal_min', 0) or 0)
                        productividad = float(p.get('productividad', 0) or 0)
                        
                        if productividad == 0:
                            productividad = 1.0
                        
                        tiempo_efectivo = tiempo_total * productividad
                        costo_minuto = sueldo_total / tiempo_efectivo if tiempo_efectivo > 0 else 0
                        importe = costo_minuto * minutos
                        costo_mod_unitario += importe
                        
                        mo_detalle.append({
                            'codigo': cod_trabajador,
                            'nombre': p.get('apellidosnombres', ''),
                            'puesto': p.get('puestotrabajo', ''),
                            'minutos': minutos,
                            'productividad': round(productividad * 100, 1),
                            'costo_minuto': round(costo_minuto, 6),
                            'importe': round(importe, 4)
                        })
                        break
            
            # Costo total unitario (sin CIF, GA, GV)
            costo_total_unitario = costo_mp_unitario + costo_mod_unitario
            
            return jsonify({
                'success': True,
                'data': {
                    'producto': {
                        'codigo': codigo,
                        'nombre': producto.get('producto'),
                        'descripcion': producto.get('descripcion', '')
                    },
                    'costos_unitarios': {
                        'materia_prima': round(costo_mp_unitario, 4),
                        'mano_obra_directa': round(costo_mod_unitario, 4),
                        'total_directo': round(costo_total_unitario, 4)
                    },
                    'detalle_materiales': materiales_detalle,
                    'detalle_mano_obra': mo_detalle,
                    'total_recetas_mp': len(recetas_mp_prod),
                    'total_trabajadores': len(recetas_mo_prod)
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu4/periodos', methods=['GET'])
    def menu4_periodos():
        """Obtener períodos disponibles para análisis"""
        try:
            # Por ahora, retornar períodos demo
            periodos = [
                {'value': '2026-01', 'label': 'Enero 2026'},
                {'value': '2026-02', 'label': 'Febrero 2026'},
                {'value': '2026-03', 'label': 'Marzo 2026'},
                {'value': '2026-04', 'label': 'Abril 2026'}
            ]
            return jsonify({'success': True, 'data': periodos})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500