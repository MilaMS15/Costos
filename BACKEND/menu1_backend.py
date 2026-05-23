from flask import Blueprint, request, jsonify
from datetime import datetime, date
# Importamos los servicios necesarios y tu cliente de supabase
from servicios import ProductoService, KardexService
from database import SupabaseBrain

# Inicializamos el cliente de Supabase
supabase = SupabaseBrain.get_client()

def register_menu1_routes(app):

    @app.route('/api/menu1/productos_costos', methods=['GET'])
    def menu1_obtener_productos_costos():
        try:
            # =========================================================================
            # 🏛️ 1. CÁLCULO DINÁMICO DE COSTOS FIJOS (CIF, GA, GV)
            # =========================================================================
            total_cif = 15400.00
            total_ga = 8200.00
            total_gv = 4500.00
            volumen_produccion = 10000.0 

            try:
                res_cif = supabase.table('tablacif').select('monto').execute()
                if res_cif.data: 
                    total_cif = sum(float(item.get('monto') or 0) for item in res_cif.data)
                
                res_ga = supabase.table('tablaga').select('monto').execute()
                if res_ga.data: 
                    total_ga = sum(float(item.get('monto') or 0) for item in res_ga.data)
                
                res_gv = supabase.table('tablagv').select('monto').execute()
                if res_gv.data: 
                    total_gv = sum(float(item.get('monto') or 0) for item in res_gv.data)
            except Exception as e:
                print(f"Aviso: Usando CIF/Gastos predeterminados por: {e}")

            costo_fijo_absorbido = (total_cif + total_ga + total_gv) / volumen_produccion

            # =========================================================================
            # 📦 2. MAPEO DEL MAESTRO DE MATERIALES (tablamateriales)
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
                print(f"Error cargando maestro de materiales (tablamateriales): {e}")

            # =========================================================================
            # 🧵 3. EXTRACCIÓN DINÁMICA DE PRODUCTOS Y COSTEO RELACIONAL (recetaproducto)
            # =========================================================================
            lista_productos = []
            try:
                lista_productos = ProductoService.listar_todo()
            except Exception:
                try:
                    res_p = supabase.table('tablaproducto').select('*').execute()
                    lista_productos = res_p.data if res_p.data else []
                except Exception:
                    pass

            productos_con_costos = []

            for p in lista_productos:
                id_prod = p.get('codigoproducto')
                nombre_prod = p.get('producto', 'Prenda Textil')

                # Inicializamos el costo acumulado de Materia Prima (MD)
                md_real = 0.0

                try:
                    # Consultamos las materias primas asociadas en la tabla 'recetaproducto'
                    res_receta = supabase.table('recetaproducto').select('codigomaterial', 'cantidadnecesaria').eq('codigoproducto', id_prod).execute()
                    
                    if res_receta.data and len(res_receta.data) > 0:
                        for item in res_receta.data:
                            id_mat_receta = item.get('codigomaterial')
                            cant_necesaria = float(item.get('cantidadnecesaria') or 0.0)
                            
                            # Buscamos el costo unitario real en el maestro indexado
                            costo_unitario_material = diccionario_costos_materiales.get(id_mat_receta, 0.0)
                            
                            # 🧮 Operación: Cantidad Necesaria * Costo Unitario del Insumo
                            md_real += (cant_necesaria * costo_unitario_material)
                    else:
                        # Fallback histórico de seguridad por si un producto no tiene cargada su receta en BD
                        if id_prod == 21001 or "MC" in nombre_prod:
                            md_real = 9.56
                        elif id_prod == 21002 or "ML" in nombre_prod:
                            md_real = 14.18
                        else:
                            md_real = 10.00
                except Exception as e:
                    print(f"Error procesando costeo dinámico para producto {id_prod}: {e}")
                    md_real = 10.00

                # 🛠️ MANO DE OBRA DIRECTA (MOD)
                if id_prod == 21001 or "MC" in nombre_prod:
                    mod_real = 4.20
                elif id_prod == 21002 or "ML" in nombre_prod:
                    mod_real = 5.50
                else:
                    mod_real = 5.00

                # Fórmulas de la Estructura de Costos Industriales (Absorbido)
                costo_total_unitario = md_real + mod_real + costo_fijo_absorbido
                precio_neto = costo_total_unitario * 1.10  # Margen de Utilidad (10%)
                precio_venta_publico = precio_neto * 1.18  # IGV (18%)

                productos_con_costos.append({
                    'codigoproducto': id_prod,
                    'producto': nombre_prod,
                    'descripcion': p.get('descripcion', 'Prenda textil industrial con costeo real absorbido.'),
                    'materia_prima': round(md_real, 2),
                    'mod': round(mod_real, 2),
                    'cif': round(costo_fijo_absorbido, 2),
                    'costo_total_unitario': round(costo_total_unitario, 2),
                    'precio_neto': round(precio_neto, 2),
                    'precio_venta_publico': round(precio_venta_publico, 2)
                })

            return jsonify({
                'success': True,
                'data': productos_con_costos,
                'global_cif_unidad': round(costo_fijo_absorbido, 2)
            }), 200

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route('/api/menu1/orden', methods=['POST'])
    def menu1_procesar_orden():
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