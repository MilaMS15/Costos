from flask import Blueprint, request, jsonify
from datetime import datetime, date
from servicios import KardexService, ProductoService 

def register_menu1_routes(app):

    # 💳 ENDPOINT PARA PROCESAR LA ORDEN DE COMPRA
    @app.route('/api/menu1/orden', methods=['POST'])
    def menu1_procesar_orden():
        try:
            datos = request.json
            cliente_nombre = datos.get('cliente_nombre')
            cliente_correo = datos.get('cliente_correo')
            tarjeta_numero = datos.get('tarjeta_numero')
            items_carrito = datos.get('items', [])

            if not items_carrito:
                return jsonify({'success': False, 'error': 'El carrito de compras está vacío'}), 400

            # 🔒 Simulación de validación de tarjeta
            if len(tarjeta_numero) < 16 or not tarjeta_numero.isdigit():
                return jsonify({'success': False, 'error': 'Transacción rechazada. Tarjeta bancaria inválida.'}), 400

            # =================================================================
            # ✨ AQUÍ VA EL PASO 2: VALIDACIÓN DE PRODUCCIÓN EN MASA EN EL BACKEND
            # =================================================================
            MINIMO_PEDIDO_MOQ = 100
            MULTIPLO_EMPAQUE = 50

            for item in items_carrito:
                cant_comprada = float(item.get('cantidad', 0))
                nombre_prod = item.get('producto', 'Producto')

                # 1. Check de cantidad mínima de lote (MOQ)
                if cant_comprada < MINIMO_PEDIDO_MOQ:
                    return jsonify({
                        'success': False, 
                        'error': f"El producto '{nombre_prod}' no cumple con el lote mínimo de {MINIMO_PEDIDO_MOQ} unidades."
                    }), 400

                # 2. Check de múltiplos exactos de empaque industrial
                if cant_comprada % MULTIPLO_EMPAQUE != 0:
                    return jsonify({
                        'success': False, 
                        'error': f"La cantidad ({cant_comprada}) para '{nombre_prod}' debe ser múltiplo exacto de {MULTIPLO_EMPAQUE} unidades."
                    }), 400
            # =================================================================

            # Generamos el código correlativo de la Orden de Compra (OC)
            hora_actual = datetime.now().strftime('%H:%M')
            fecha_hoy = date.today().isoformat()
            codigo_oc = f"OC-{datetime.now().strftime('%Y%m%d%H%M%S')}"

            monto_total_pedido = 0
            for item in items_carrito:
                cant = float(item.get('cantidad', 1))
                precio = float(item.get('precio', 0))
                monto_total_pedido += (cant * precio)

            # 📉 IMPACTO EN KARDEX (MENU 3) - Descuento automático de Stock por Venta Mayorista
            for item in items_carrito:
                id_producto = int(item.get('codigoproducto'))
                cant_comprada = float(item.get('cantidad', 1))
                precio_venta = float(item.get('precio', 0))

                # Estructuramos el detalle con el truco de la hora para el frontend [menu3.js]
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

                # Insertamos la salida directamente en Supabase [menu3_backend.py]
                KardexService.insertar(movimiento_salida)

            return jsonify({
                'success': True,
                'codigo_orden': codigo_oc,
                'monto_pagado': monto_total_pedido,
                'mensaje': 'Orden procesada y stock actualizado correctamente.'
            }), 201

        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500