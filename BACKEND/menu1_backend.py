from flask import Blueprint, request, jsonify
from datetime import datetime, date
from dateutil.relativedelta import relativedelta  # ← AÑADIR esta importación
# Importamos los servicios necesarios
from servicios import ProductoService, KardexService, PersonalService, RecetaManoObraService
from database import SupabaseBrain

supabase = SupabaseBrain.get_client()

def register_menu1_routes(app):

    @app.route('/api/menu1/productos_costos', methods=['GET'])
    def menu1_obtener_productos_costos():
        try:
            # =========================================================================
            # 1. OBTENER EL MES ANTERIOR (para CIF)
            # =========================================================================
            hoy = datetime.now()
            mes_anterior = (hoy - relativedelta(months=1)).strftime("%Y-%m")
            print(f"📅 Usando CIF del mes: {mes_anterior}")

            # =========================================================================
            # 2. OBTENER CIF DESDE cif_mensual PARA EL MES ANTERIOR
            # =========================================================================
            cif_items = []
            total_cif_mensual = 0.0
            
            try:
                result = supabase.table('cif_mensual').select('*').eq('periodo', mes_anterior).execute()
                if result.data:
                    cif_items = result.data
                    total_cif_mensual = sum(float(item.get('monto', 0)) for item in cif_items)
                    print(f"✅ CIF encontrados: {len(cif_items)} conceptos, Total: S/ {total_cif_mensual:.2f}")
                else:
                    print(f"⚠️ No hay CIF para {mes_anterior}, usando demo")
                    # Demo por si no hay datos
                    cif_items = [
                        {'codigocif': 'CIF001', 'denominacion': 'Mantenimiento', 'monto': 5000.0},
                        {'codigocif': 'CIF002', 'denominacion': 'Energía Eléctrica', 'monto': 3000.0},
                        {'codigocif': 'CIF003', 'denominacion': 'Depreciación', 'monto': 4400.0},
                        {'codigocif': 'CIF004', 'denominacion': 'Supervisión', 'monto': 3000.0},
                    ]
                    total_cif_mensual = 15400.0
            except Exception as e:
                print(f"Error: {e}, usando demo")
                cif_items = [
                    {'codigocif': 'CIF001', 'denominacion': 'Mantenimiento', 'monto': 5000.0},
                    {'codigocif': 'CIF002', 'denominacion': 'Energía Eléctrica', 'monto': 3000.0},
                    {'codigocif': 'CIF003', 'denominacion': 'Depreciación', 'monto': 4400.0},
                    {'codigocif': 'CIF004', 'denominacion': 'Supervisión', 'monto': 3000.0},
                ]
                total_cif_mensual = 15400.0

            # =========================================================================
            # 3. OBTENER DATOS DE PERSONAL para minutos efectivos (necesario para CIF)
            # =========================================================================
            personal = PersonalService.listar_todo()
            receta_mo = RecetaManoObraService.listar_todo()
            
            # Calcular total de minutos efectivos de TODOS los trabajadores
            total_minutos_efectivos = 0
            for p in personal:
                tiempo_total = float(p.get('tiempototal_min') or 0)
                productividad = float(p.get('productividad') or 1.0)
                if productividad == 0:
                    productividad = 1.0
                total_minutos_efectivos += tiempo_total * productividad
            
            if total_minutos_efectivos == 0:
                total_minutos_efectivos = 1
                print("⚠️ Total minutos efectivos = 0, usando 1")
            
            print(f"⏱️ Total minutos efectivos fábrica: {total_minutos_efectivos:.2f}")

            # =========================================================================
            # 4. MAPEO DEL MAESTRO DE MATERIALES (sin cambios)
            # =========================================================================
            diccionario_costos_materiales = {}
            try:
                res_mat = supabase.table('tablamateriales').select('codigomaterial', 'costounitario').execute()
                if res_mat.data:
                    for mat in res_mat.data:
                        id_mat = mat.get('codigomaterial')
                        costo_uni = mat.get('costounitario')
                        if id_mat is not None:
                            diccionario_costos_materiales[id_mat] = float(costo_uni or 0.0)
            except Exception as e:
                print(f"Error cargando materiales: {e}")

            # =========================================================================
            # 5. OBTENER GA Y GV (Gastos fijos)
            # =========================================================================
            total_ga = 8200.0
            total_gv = 4500.0
            
            try:
                res_ga = supabase.table('tablaga').select('monto').execute()
                if res_ga.data:
                    total_ga = sum(float(item.get('monto') or 0) for item in res_ga.data)
                
                res_gv = supabase.table('tablagv').select('monto').execute()
                if res_gv.data:
                    total_gv = sum(float(item.get('monto') or 0) for item in res_gv.data)
            except Exception as e:
                print(f"Aviso: Usando GA/GV predeterminados: {e}")

            # =========================================================================
            # 6. VOLUMEN DE PRODUCCIÓN para prorratear GA/GV
            # =========================================================================
            from app import VENTAS_DEMO
            ventas_mes = VENTAS_DEMO.get(mes_anterior, {})

            # Calcular total de ventas del mes (en soles)
            total_ventas_mes = sum(v[0] * v[1] for v in ventas_mes.values()) if ventas_mes else 1
            print(f"💰 Total ventas mes {mes_anterior}: S/ {total_ventas_mes:.2f}")
            #ga_por_unidad = total_ga / total_unidades_mes if total_unidades_mes > 0 else 0
            #gv_por_unidad = total_gv / total_unidades_mes if total_unidades_mes > 0 else 0
            
            # =========================================================================
            # 7. PRODUCTOS - Calcular costos (MP y MOD igual, CIF nuevo)
            # =========================================================================
            lista_productos = ProductoService.listar_todo()
            productos_con_costos = []
            
            for p in lista_productos:
                id_prod = p.get('codigoproducto')
                nombre_prod = p.get('producto', 'Prenda Textil')
                # ============================================
                # CALCULAR % VENTAS DEL PRODUCTO
                # ============================================
                # Obtener ventas del producto específico
                if id_prod in ventas_mes:
                    cantidad_vendida = ventas_mes[id_prod][0]
                    precio_producto = ventas_mes[id_prod][1]
                    ventas_producto = cantidad_vendida * precio_producto
                else:
                    cantidad_vendida = 0
                    ventas_producto = 0
                    precio_producto = 0
                
                # Calcular % Part. Ventas del producto
                if total_ventas_mes > 0 and ventas_producto > 0:
                    pct_ventas = (ventas_producto / total_ventas_mes) * 100
                else:
                    pct_ventas = 0
                
                # Calcular GA y GV asignados al producto
                factor_ventas = pct_ventas / 100 if pct_ventas > 0 else 0
                ga_producto = total_ga * factor_ventas
                gv_producto = total_gv * factor_ventas
                
                # GA y GV POR UNIDAD
                if cantidad_vendida > 0:
                    ga_por_unidad = ga_producto / cantidad_vendida
                    gv_por_unidad = gv_producto / cantidad_vendida
                else:
                    ga_por_unidad = 0
                    gv_por_unidad = 0
                
                print(f"📊 {nombre_prod}: Ventas={ventas_producto:.2f} ({pct_ventas:.1f}%), GA_unit={ga_por_unidad:.4f}, GV_unit={gv_por_unidad:.4f}")
                # ---------- A. MATERIA PRIMA (sin cambios) ----------
                md_real = 0.0
                try:
                    res_receta = supabase.table('recetaproducto').select('codigomaterial', 'cantidadnecesaria').eq('codigoproducto', id_prod).execute()
                    if res_receta.data:
                        for item in res_receta.data:
                            id_mat_receta = item.get('codigomaterial')
                            cant_necesaria = float(item.get('cantidadnecesaria') or 0.0)
                            costo_unitario_material = diccionario_costos_materiales.get(id_mat_receta, 0.0)
                            md_real += (cant_necesaria * costo_unitario_material)
                    else:
                        if id_prod == 21001: md_real = 9.56
                        elif id_prod == 21002: md_real = 14.18
                        else: md_real = 10.00
                except Exception as e:
                    print(f"Error MP {id_prod}: {e}")
                    md_real = 10.00
                
                # ---------- B. MANO DE OBRA DIRECTA (sin cambios, ya está bien) ----------
                mod_real = 0.0
                minutos_mod_producto = 0.0  # ← NECESARIO PARA CIF
                
                receta_producto = [r for r in receta_mo if str(r.get('codigoproducto')) == str(id_prod)]
                if not receta_producto:
                    receta_producto = [r for r in receta_mo if str(r.get('codigoproducto')) == "21001"]
                
                for r in receta_producto:
                    cod_trabajador = r.get('codigotrabajador')
                    minutos = float(r.get('tiempotrabajo') or 0)
                    
                    trabajador = None
                    for pers in personal:
                        if str(pers.get('codigotrabajador')) == str(cod_trabajador):
                            trabajador = pers
                            break
                    
                    if trabajador:
                        sueldo_total = float(trabajador.get('sueldototal') or 0)
                        tiempo_total = float(trabajador.get('tiempototal_min') or 0)
                        productividad = float(trabajador.get('productividad') or 1.0)
                        if productividad == 0:
                            productividad = 1.0
                        
                        tiempo_efectivo = tiempo_total * productividad
                        costo_min = sueldo_total / tiempo_efectivo if tiempo_efectivo > 0 else 0
                        mod_real += costo_min * minutos
                        
                        # ACUMULAR MINUTOS MOD EFECTIVOS PARA CIF
                        minutos_mod_producto += minutos * productividad
                
                # ---------- C. COSTO INDIRECTO (CIF) - NUEVO! ----------
                # Distribuir los CIF del mes anterior según minutos MOD del producto
                cif_real = 0.0
                for cif_item in cif_items:
                    monto_cif = float(cif_item.get('monto', 0))
                    # Fórmula: (minutos del producto / total minutos fábrica) * monto CIF
                    factor = minutos_mod_producto / total_minutos_efectivos if total_minutos_efectivos > 0 else 0
                    cif_real += monto_cif * factor
                
                # ---------- D. COSTO TOTAL ----------
                costo_total_unitario = md_real + mod_real + cif_real + ga_por_unidad + gv_por_unidad
                precio_neto = costo_total_unitario * 1.10
                precio_venta_publico = precio_neto * 1.18
                
                productos_con_costos.append({
                    'codigoproducto': id_prod,
                    'producto': nombre_prod,
                    'descripcion': p.get('descripcion', 'Prenda textil industrial con costeo real absorbido.'),
                    'materia_prima': round(md_real, 2),
                    'mod': round(mod_real, 4),
                    'cif': round(cif_real, 4),
                    'ga': round(ga_por_unidad, 4),      # ← AGREGAR
                    'gv': round(gv_por_unidad, 4),      # ← AGREGAR
                    'costo_total_unitario': round(costo_total_unitario, 4),
                    'precio_neto': round(precio_neto, 2),
                    'precio_venta_publico': round(precio_venta_publico, 2),
                    'periodo_cif': mes_anterior,
                    'minutos_mod_producto': round(minutos_mod_producto, 2)
                })
                
                print(f"📊 {nombre_prod}: MP={md_real:.2f}, MOD={mod_real:.4f}, CIF={cif_real:.4f} (minutos: {minutos_mod_producto:.1f})")

            return jsonify({
                'success': True,
                'data': productos_con_costos,
                'meta': {
                    'periodo_cif_usado': mes_anterior,
                    'total_cif_mensual': round(total_cif_mensual, 2),
                    'total_minutos_efectivos': round(total_minutos_efectivos, 2)
                }
            }), 200

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    # =========================================================================
    # ORDEN DE COMPRA (sin cambios)
    # =========================================================================
    @app.route('/api/menu1/orden', methods=['POST'])
    def menu1_procesar_orden():
        # ... (código existente, sin cambios) ...
        try:
            data = request.get_json() or {}
            cliente_nombre = data.get('cliente_nombre', 'Cliente Anónimo')
            items = data.get('items', [])

            if not items:
                return jsonify({'success': False, 'error': 'El carrito está vacío.'}), 400

            MINIMO_PEDIDO_MOQ = 100
            MULTIPLO_EMPAQUE = 50

            codigo_oc = f"OC-{datetime.now().strftime('%Y%m%d')}-{int(datetime.now().timestamp()) % 10000}"
            fecha_hoy = date.today().isoformat()
            hora_actual = datetime.now().strftime('%H:%M')

            monto_total_pedido = 0.0

            for item in items:
                id_producto = item.get('codigoproducto')
                cant_comprada = int(item.get('cantidad', 0))
                precio_venta = float(item.get('precio', 0))

                if cant_comprada < MINIMO_PEDIDO_MOQ or cant_comprada % MULTIPLO_EMPAQUE != 0:
                    return jsonify({'success': False, 'error': 'Las cantidades no cumplen con las restricciones de lote industrial.'}), 400

                monto_total_pedido += (cant_comprada * precio_venta)

                detalle_kardex = f"[{hora_actual}] Venta Mayorista - Cliente: {cliente_nombre} ({codigo_oc})"

                movimiento_salida = {
                    'fecharegistro': fecha_hoy,
                    'tipo_item': 'PT',          
                    'codigomaterial': None,
                    'codigoproducto': id_producto,
                    'detalle': detalle_kardex,
                    'tipo_movement': 'SALIDA',   
                    'tipo_movimiento': 'SALIDA',
                    'cantidad': cant_comprada,
                    'costounitario': precio_venta, 
                    'monto_total': cant_comprada * precio_venta
                }

                KardexService.insertar(movimiento_salida)

            return jsonify({
                'success': True,
                'codigo_orden': codigo_oc,
                'monto_pagado': monto_total_pedido,
                'mensaje': 'Orden procesada y Kardex actualizado automáticamente.'
            }), 200

        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500