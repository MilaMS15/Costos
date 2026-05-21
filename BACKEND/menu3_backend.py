from flask import Flask, request, jsonify
from datetime import datetime, date  # <--- IMPORTACIÓN GLOBAL CORREGIDA
from servicios import KardexService, MaterialesService, ProductoService

# LÍNEA 5 CORREGIDA:
def register_menu3_routes(app):

    # 1. ENDPOINT PARA OBTENER LOS MOVIMIENTOS (GET) - COMPLETO Y CORREGIDO
    @app.route('/api/menu3/kardex', methods=['GET'])
    def menu3_listar_kardex():
        try:
            tipo_item = request.args.get('tipo_item')      # 'MP', 'PT' o 'TODOS'
            codigo_item = request.args.get('codigo_item')  # ID específico o 'TODOS'
            
            todos_movimientos = KardexService.listar_todo()
            datos_filtrados = todos_movimientos
            
            # Carga de catálogos en memoria para cruzar los nombres reales en vivo
            materiales = {str(m.get('codigomaterial')): m.get('material') for m in MaterialesService.listar_todo()}
            productos = {str(p.get('codigoproducto')): p.get('producto') for p in ProductoService.listar_todo()}
            
            # Normalización completa de cada registro para el Frontend
            for m in datos_filtrados:
                t_item = m.get('tipo_item')
                cod_mat = str(m.get('codigomaterial') or '')
                cod_prod = str(m.get('codigoproducto') or '')
                
                if t_item == 'MP' and cod_mat in materiales:
                    m['nombre_item'] = materiales[cod_mat]
                elif t_item == 'PT' and cod_prod in productos:
                    m['nombre_item'] = productos[cod_prod]
                else:
                    m['nombre_item'] = f"Item [{cod_mat or cod_prod}]"

                # Aseguramos que existan todos los campos requeridos por el JS
                m['fecharegistro'] = m.get('fecharegistro') or m.get('fecha') or datetime.now().isoformat()
                m['tipo_movimiento'] = m.get('tipo_movimiento') or m.get('tipo') or 'ENTRADA'
                m['cantidad'] = float(m.get('cantidad', 0) or 0)
                m['costounitario'] = float(m.get('costounitario', 0) or 0)
                m['monto_total'] = float(m.get('monto_total') or m.get('costototal') or (m['cantidad'] * m['costounitario']))

            # --- APLICACIÓN DE FILTROS EN BACKEND ---
            # Filtro 1: Tipo de Ítem (Materia Prima o Producto Terminado)
            if tipo_item and tipo_item != 'TODOS' and tipo_item != '':
                datos_filtrados = [m for m in datos_filtrados if m.get('tipo_item') == tipo_item]
                
            # Filtro 2: Código de Ítem Específico
            if codigo_item and codigo_item != 'TODOS' and codigo_item != '':
                datos_filtrados = [
                    m for m in datos_filtrados 
                    if str(m.get('codigomaterial')) == str(codigo_item) or str(m.get('codigoproducto')) == str(codigo_item)
                ]
            
            # 🔥 ORDEN BASE CRONOLÓGICO SEGURO (De antiguo a nuevo)
            # Esto garantiza que el bucle en JS pueda computar el inventario acumulado paso a paso.
            # El frontend se encargará de decidir si voltea la tabla visualmente.
            datos_filtrados.sort(key=lambda x: x.get('idkardex', 0))
            
            return jsonify({'success': True, 'data': datos_filtrados})
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    # 2. ENDPOINT PARA REGISTRAR UN NUEVO MOVIMIENTO (POST) - HORA REAL CORREGIDA
    @app.route('/api/menu3/kardex', methods=['POST'])
    def menu3_registrar_movimiento():
        try:
            # Importamos la librería completa para manejar marcas de tiempo exactas con hora y minutos
            from datetime import datetime, date
            
            datos = request.json
            tipo_item = datos.get('tipo_item') 
            codigo = int(datos.get('codigo_item'))
            
            cantidad = float(datos.get('cantidad', 0) or datos.get('cantidad_fisica', 0))
            
            if 'costo_total' in datos:
                costo_total_recibido = float(datos.get('costo_total', 0))
                costounitario = costo_total_recibido / cantidad if cantidad > 0 else 0
            else:
                costounitario = float(datos.get('costo_unitario', 0))
            
            tipo_mov = datos.get('tipo_movimiento') or datos.get('tipo_operacion')
            
            # Capturamos la hora actual en formato de texto limpio (HH:MM)
            hora_actual_texto = datetime.now().strftime('%H:%M')
            
            # Le sumamos de forma limpia la hora al inicio del detalle del movimiento
            detalle_original = datos.get('detalle') or "Celular Almacén - Lote Escaneado"
            detalle_mov = f"[{hora_actual_texto}] {detalle_original}"
            
            nuevo_movimiento = {
                'fecharegistro': datos.get('fecha', date.today().isoformat()),
                'tipo_item': tipo_item,
                'codigomaterial': codigo if tipo_item == 'MP' else None,
                'codigoproducto': codigo if tipo_item == 'PT' else None,
                'detalle': detalle_mov,
                'tipo_movimiento': tipo_mov, 
                'cantidad': cantidad,
                'costounitario': costounitario,
                'monto_total': cantidad * costounitario
            }
            
            resultado = KardexService.insertar(nuevo_movimiento)
            return jsonify({'success': True, 'data': resultado}), 201
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    # 3. ENDPOINT PARA LEER MATERIALES/PRODUCTOS PARA LOS COMBOS (GET)
    @app.route('/api/menu3/items/<tipo_item>', methods=['GET'])
    def menu3_listar_items(tipo_item):
        try:
            items_formateados = []
            if tipo_item == 'MP':
                lista = MaterialesService.listar_todo()
                for i in lista:
                    items_formateados.append({
                        'codigo': i.get('codigomaterial'),
                        'nombre': i.get('material')
                    })
            elif tipo_item == 'PT':
                lista = ProductoService.listar_todo()
                for i in lista:
                    items_formateados.append({
                        'codigo': i.get('codigoproducto'),
                        'nombre': i.get('producto')
                    })
                    
            return jsonify({'success': True, 'data': items_formateados})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    # 4. ENDPOINT DINÁMICO PARA EL ESCÁNER DEL CELULAR (GET)
    @app.route('/api/menu3/escanear/<id_codigo>', methods=['GET'])
    def menu3_escanear_codigo(id_codigo):
        try:
            try:
                id_buscar = int(id_codigo)
            except ValueError:
                return jsonify({'success': False, 'error': 'El código escaneado no es un ID válido'}), 400

            items_mp = MaterialesService.listar_todo()
            item_encontrado = next((i for i in items_mp if i.get('codigomaterial') == id_buscar), None)
            
            if item_encontrado:
                return jsonify({
                    'success': True,
                    'data': {
                        'tipo_item': 'MP',
                        'codigo_item': id_buscar,
                        'nombre': item_encontrado.get('material', 'Materia Prima')
                    }
                })

            items_pt = ProductoService.listar_todo()
            producto_encontrado = next((i for i in items_pt if i.get('codigoproducto') == id_buscar), None)
            
            if producto_encontrado:
                return jsonify({
                    'success': True,
                    'data': {
                        'tipo_item': 'PT',
                        'codigo_item': id_buscar,
                        'nombre': producto_encontrado.get('producto', 'Producto Terminado')
                    }
                })
                
            return jsonify({'success': False, 'error': f'El ID {id_buscar} no existe en el sistema'}), 404

        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500