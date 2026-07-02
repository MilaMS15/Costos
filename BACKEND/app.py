from unittest import result

from flask import Flask, jsonify, request
from flask_cors import CORS
from ia_service import register_ia_routes
from flask import send_from_directory
from servicios import (
    CIFMensualService, MaterialesService, PersonalService, ProductoService,
    CIFService, GAService, GVService, MODService,
    RecetaProductoService, RecetaManoObraService,
    OrdenTrabajoService, OrdenMaterialesService, 
    OrdenManoObraService, OrdenCIFService  # ← NUEVOS
    
)
from menu1_backend import register_menu1_routes
from menu2_backend import register_menu2_routes
from menu3_backend import register_menu3_routes
from menu4_backend import register_menu4_routes
from menu5_backend import register_menu5_routes
from menu6_backend import register_menu6_routes
from menu7_backend import register_menu7_routes
from datetime import date, datetime
from database import SupabaseBrain  # ← Agregar esta línea
import traceback
import os
from costeo_abc_backend import register_abc_routes
app = Flask(__name__)
register_abc_routes(app)


# ✅ Crear el cliente de Supabase correctamente
try:
    supabase_client = SupabaseBrain.get_client()
    print("✅ Conexión a Supabase establecida correctamente")
except Exception as e:
    print(f"❌ Error al conectar a Supabase: {e}")
    supabase_client = None


# Configuramos las rutas absolutas para no perder el rastro del FRONTEND
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'FRONTEND'))

# Inicializamos Flask apuntando nativamente a la carpeta static dentro de FRONTEND
app = Flask(
    __name__, 
    static_folder=os.path.join(FRONTEND_DIR, 'static'),
    static_url_path='/static'
)

CORS(app)

# ============================================
# RUTA DE BIENVENIDA - Info de la API
# ============================================
@app.route('/')
def info_api():
    return jsonify({
        'nombre': 'API Gestión de Costos - Taller Textil',
        'version': '1.0',
        'endpoints': {
            'materiales': {
                'GET': '/api/materiales',
                'POST': '/api/materiales',
                'PUT': '/api/materiales/<codigo>',
                'DELETE': '/api/materiales/<codigo>'
            },
            'productos': {
                'GET': '/api/productos',
                'POST': '/api/productos',
                'PUT': '/api/productos/<codigo>',
                'DELETE': '/api/productos/<codigo>'
            },
            'trabajadores': {
                'GET': '/api/trabajadores',
                'POST': '/api/trabajadores',
                'PUT': '/api/trabajadores/<codigo>',
                'DELETE': '/api/trabajadores/<codigo>'
            },
            'recetas_producto': {
                'GET': '/api/recetas-producto?codigoproducto=ID',
                'POST': '/api/recetas-producto',
                'DELETE': '/api/recetas-producto/<codigo_material>'
            },
            'recetas_mo': {
                'GET': '/api/recetas-mo?codigoproducto=ID',
                'POST': '/api/recetas-mo',
                'DELETE': '/api/recetas-mo/<codigotrabajador>'
            }
        }
    })

# ============================================
# API MATERIALES
# ============================================
@app.route('/api/materiales', methods=['GET'])
def api_materiales():
    try:
        materiales = MaterialesService.listar_todo()
        return jsonify({'success': True, 'data': materiales})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/materiales/<codigo>', methods=['GET'])
def api_obtener_material(codigo):
    try:
        materiales = MaterialesService.obtener_por_id('codigomaterial', int(codigo))
        if materiales:
            return jsonify({'success': True, 'data': materiales[0]})
        return jsonify({'success': False, 'error': 'Material no encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/materiales', methods=['POST'])
def api_crear_material():
    try:
        datos = request.json
        datos['fecharegistro'] = date.today().isoformat()
        resultado = MaterialesService.insertar(datos)
        return jsonify({'success': True, 'data': resultado}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/materiales/<codigo>', methods=['PUT'])
def api_actualizar_material(codigo):
    try:
        datos = request.json
        MaterialesService.eliminar('codigomaterial', int(codigo))
        datos['codigomaterial'] = int(codigo)
        resultado = MaterialesService.insertar(datos)
        return jsonify({'success': True, 'data': resultado})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/materiales/<codigo>', methods=['DELETE'])
def api_eliminar_material(codigo):
    try:
        MaterialesService.eliminar('codigomaterial', int(codigo))
        return jsonify({'success': True, 'mensaje': 'Material eliminado'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# API PRODUCTOS
# ============================================
@app.route('/api/productos', methods=['GET'])
def api_productos():
    try:
        productos = ProductoService.listar_todo()
        return jsonify({'success': True, 'data': productos})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/productos/<codigo>', methods=['GET'])
def api_obtener_producto(codigo):
    try:
        productos = ProductoService.obtener_por_id('codigoproducto', int(codigo))
        if productos:
            return jsonify({'success': True, 'data': productos[0]})
        return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/productos', methods=['POST'])
def api_crear_producto():
    try:
        datos = request.json
        datos['fecharegistro'] = date.today().isoformat()
        resultado = ProductoService.insertar(datos)
        return jsonify({'success': True, 'data': resultado}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/productos/<codigo>', methods=['PUT'])
def api_actualizar_producto(codigo):
    try:
        datos = request.json
        ProductoService.eliminar('codigoproducto', int(codigo))
        datos['codigoproducto'] = int(codigo)
        resultado = ProductoService.insertar(datos)
        return jsonify({'success': True, 'data': resultado})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/productos/<codigo>', methods=['DELETE'])
def api_eliminar_producto(codigo):
    try:
        ProductoService.eliminar('codigoproducto', int(codigo))
        return jsonify({'success': True, 'mensaje': 'Producto eliminado'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# API RECETAS DE PRODUCTO
# ============================================
@app.route('/api/recetas-producto', methods=['GET'])
def api_recetas_producto():
    try:
        codigo_producto = request.args.get('codigoproducto')
        recetas = RecetaProductoService.listar_todo()
        if codigo_producto:
            recetas = [r for r in recetas if r.get('codigoproducto') == int(codigo_producto)]
        return jsonify({'success': True, 'data': recetas})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recetas-producto', methods=['POST'])
def api_crear_receta_producto():
    try:
        datos = request.json
        datos['fecharegistro'] = date.today().isoformat()
        resultado = RecetaProductoService.insertar(datos)
        return jsonify({'success': True, 'data': resultado}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recetas-producto/<codigo>', methods=['DELETE'])
def api_eliminar_receta_producto(codigo):
    try:
        RecetaProductoService.eliminar('codigomaterial', int(codigo))
        return jsonify({'success': True, 'mensaje': 'Material eliminado de receta'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# API TRABAJADORES
# ============================================
@app.route('/api/trabajadores', methods=['GET'])
def api_trabajadores():
    try:
        if not supabase_client:
            return jsonify({'success': False, 'error': 'No hay conexión a Supabase'}), 500
        
        trabajadores = PersonalService.listar_todo()
        return jsonify({'success': True, 'data': trabajadores})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trabajadores/<codigo>', methods=['GET'])
def api_obtener_trabajador(codigo):
    try:
        trabajadores = PersonalService.obtener_por_id('codigotrabajador', int(codigo))
        if trabajadores:
            return jsonify({'success': True, 'data': trabajadores[0]})
        return jsonify({'success': False, 'error': 'Trabajador no encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trabajadores', methods=['POST'])
def crear_trabajador():
    try:
        if not supabase_client:
            return jsonify({'success': False, 'error': 'No hay conexión a Supabase'}), 500
            
        data = request.json
        sueldobasico = float(data.get('sueldobasico', 0))
        bonificacion = float(data.get('bonificacion', 0))
        asigfamiliar = float(data.get('asigfamiliar', 0))
        
        # Fórmula correcta
        gratificacionjulio = sueldobasico / 24.0
        gratificaciondiciembre = sueldobasico / 24.0
        cts = sueldobasico / 12.0
        sueldo = sueldobasico + bonificacion + asigfamiliar
        essalud = sueldo * 0.09
        sueldototal = sueldo + essalud + gratificacionjulio + gratificaciondiciembre + cts
        
        res = supabase_client.table('tablapersonal').insert({
            'puestotrabajo': data.get('puestotrabajo'),
            'tipotrabajo': data.get('tipotrabajo'),
            'productividad': float(data.get('productividad', 0)),
            'tiempototal_min': int(data.get('tiempototal_min', 0)),
            'apellidosnombres': data.get('apellidosnombres'),
            'sueldobasico': sueldobasico,
            'bonificacion': bonificacion,
            'gratificacionjulio': round(gratificacionjulio, 2),
            'gratificaciondiciembre': round(gratificaciondiciembre, 2),
            'asigfamiliar': asigfamiliar,
            'cts': round(cts, 2),
            'sueldo': round(sueldo, 2),
            'essalud': round(essalud, 2),
            'sueldototal': round(sueldototal, 2)
            # ✅ 'proveedr' eliminado
        }).execute()
        
        return jsonify({'success': True, 'data': res.data}), 201
    except Exception as e:
        print(f"Error en crear_trabajador: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/trabajadores/<id>', methods=['PUT'])
def actualizar_trabajador(id):
    try:
        if not supabase_client:
            return jsonify({'success': False, 'error': 'No hay conexión a Supabase'}), 500
            
        trabajador_id = int(id)
        data = request.json
        
        # ✅ LOG 1: Ver qué llega
        print("="*60)
        print(f"📥 PUT /api/trabajadores/{trabajador_id}")
        print(f"📦 Datos recibidos del frontend: {data}")
        
        # Extraer valores
        sueldobasico = float(data.get('sueldobasico', 0))
        bonificacion = float(data.get('bonificacion', 0))
        asigfamiliar = float(data.get('asigfamiliar', 0))
        productividad = float(data.get('productividad', 0))
        tiempototal_min = int(data.get('tiempototal_min', 0))
        apellidosnombres = data.get('apellidosnombres', '')
        puestotrabajo = data.get('puestotrabajo', '')
        tipotrabajo = data.get('tipotrabajo', '')
        
        print(f"📊 Valores extraídos:")
        print(f"   - sueldobasico: {sueldobasico}")
        print(f"   - bonificacion: {bonificacion}")
        print(f"   - asigfamiliar: {asigfamiliar}")
        print(f"   - productividad: {productividad}")
        print(f"   - tiempototal_min: {tiempototal_min}")
        print(f"   - apellidosnombres: {apellidosnombres}")
        
        # Calcular según fórmula correcta
        gratificacionjulio = sueldobasico / 24.0
        gratificaciondiciembre = sueldobasico / 24.0
        cts = sueldobasico / 12.0
        sueldo = sueldobasico + bonificacion + asigfamiliar
        essalud = sueldo * 0.09
        sueldototal = sueldo + essalud + gratificacionjulio + gratificaciondiciembre + cts
        
        print(f"🧮 Cálculos realizados:")
        print(f"   - gratificacionjulio: {gratificacionjulio:.2f}")
        print(f"   - cts: {cts:.2f}")
        print(f"   - sueldo: {sueldo:.2f}")
        print(f"   - essalud: {essalud:.2f}")
        print(f"   - sueldototal: {sueldototal:.2f}")
        
        update_data = {
            'puestotrabajo': puestotrabajo,
            'tipotrabajo': tipotrabajo,
            'productividad': productividad,
            'tiempototal_min': tiempototal_min,
            'apellidosnombres': apellidosnombres,
            'sueldobasico': sueldobasico,
            'bonificacion': bonificacion,
            'gratificacionjulio': round(gratificacionjulio, 2),
            'gratificaciondiciembre': round(gratificaciondiciembre, 2),
            'asigfamiliar': asigfamiliar,
            'cts': round(cts, 2),
            'sueldo': round(sueldo, 2),
            'essalud': round(essalud, 2),
            'sueldototal': round(sueldototal, 2)
        }
        
        print(f"📝 Datos a enviar a Supabase: {update_data}")
        
        # Verificar si el trabajador existe
        check = supabase_client.table('tablapersonal').select('*').eq('codigotrabajador', trabajador_id).execute()
        print(f"🔍 Verificación: trabajador existe? {len(check.data) > 0}")
        if len(check.data) > 0:
            print(f"   - Nombre actual: {check.data[0].get('apellidosnombres')}")
            print(f"   - Sueldo actual: {check.data[0].get('sueldobasico')}")
        
        # Ejecutar UPDATE
        res = supabase_client.table('tablapersonal').update(update_data).eq('codigotrabajador', trabajador_id).execute()
        
        print(f"✅ Respuesta de Supabase: {res}")
        print(f"📊 Registros afectados: {len(res.data) if res.data else 0}")
        print("="*60)
        
        if res.data and len(res.data) > 0:
            return jsonify({'success': True, 'data': res.data[0]}), 200
        else:
            return jsonify({'success': False, 'error': 'No se pudo actualizar el trabajador'}), 500
            
    except Exception as e:
        print(f"❌ Error en actualizar_trabajador: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/trabajadores/<codigo>', methods=['DELETE'])

def api_eliminar_trabajador(codigo):
    try:
        if not supabase_client:
            return jsonify({'success': False, 'error': 'No hay conexión a Supabase'}), 500
            
        trabajador_id = int(codigo)
        
        # Primero eliminar de recetas_mo si existe
        try:
            supabase_client.table('recetas_mo').delete().eq('codigotrabajador', trabajador_id).execute()
        except:
            pass  # Si no existe la tabla, ignorar
        
        # Eliminar trabajador
        res = supabase_client.table('tablapersonal').delete().eq('codigotrabajador', trabajador_id).execute()
        
        return jsonify({'success': True, 'mensaje': 'Trabajador eliminado'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
# ============================================
# API RECETAS MANO DE OBRA
# ============================================
@app.route('/api/recetas-mo', methods=['GET'])
def api_recetas_mo():
    try:
        codigo_producto = request.args.get('codigoproducto')
        recetas = RecetaManoObraService.listar_todo()
        if codigo_producto:
            recetas = [r for r in recetas if r.get('codigoproducto') == int(codigo_producto)]
        return jsonify({'success': True, 'data': recetas})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recetas-mo', methods=['POST'])
def api_crear_receta_mo():
    try:
        datos = request.json
        datos['fecharegistro'] = date.today().isoformat()
        resultado = RecetaManoObraService.insertar(datos)
        return jsonify({'success': True, 'data': resultado}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recetas-mo/<codigo>', methods=['DELETE'])
def api_eliminar_receta_mo(codigo):
    try:
        RecetaManoObraService.eliminar('codigotrabajador', int(codigo))
        return jsonify({'success': True, 'mensaje': 'Asignación eliminada'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    

# ============================================
# API PLAN DE PRODUCCIÓN (Sofía)
# ============================================

# Datos demo de ventas (mientras no haya tabla real)
VENTAS_DEMO = {
    "2026-01": {21001: (1200, 25.50), 21002: (800, 28.00), 21003: (950, 18.00),
                21004: (400, 55.00), 21005: (320, 48.00)},
    "2026-02": {21001: (1400, 25.50), 21002: (750, 28.00), 21003: (1100, 18.00),
                21004: (380, 55.00), 21005: (410, 48.00)},
    "2026-03": {21001: (1350, 26.00), 21002: (820, 28.50), 21003: (1050, 18.50),
                21004: (420, 56.00), 21005: (360, 49.00)},
    "2026-04": {21001: (7000, 19.00), 21002: (6000, 21.00), 21003: (200, 23.00),
                21004: (200, 28.00), 21005: (200, 25.00)},
    "2026-05": {21001: (7000, 19.00), 21002: (6000, 21.00), 21003: (200, 23.00),
                21004: (200, 28.00), 21005: (200, 25.00)}  
}

MESES_ES = {
    "01":"Enero","02":"Febrero","03":"Marzo","04":"Abril",
    "05":"Mayo","06":"Junio","07":"Julio","08":"Agosto",
    "09":"Septiembre","10":"Octubre","11":"Noviembre","12":"Diciembre"
}

@app.route('/api/plan-produccion/meses', methods=['GET'])
def api_plan_meses():
    """Obtener lista de meses disponibles"""
    try:
        # Intentar obtener meses de Supabase, si no usa demo
        meses = sorted(VENTAS_DEMO.keys(), reverse=True)
        meses_formato = [f"{MESES_ES[m.split('-')[1]]} {m.split('-')[0]}" for m in meses]
        return jsonify({'success': True, 'data': {'meses': meses, 'meses_formato': meses_formato}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/plan-produccion/<year_month>', methods=['GET'])
def api_plan_produccion(year_month):
    """Obtener plan de producción para un mes específico"""
    try:
        # Obtener productos
        productos = ProductoService.listar_todo()
        
        # Obtener ventas del mes (demo o real)
        ventas = VENTAS_DEMO.get(year_month, {})
        
        filas = []
        total_vv = sum(v[0] for v in ventas.values()) if ventas else 0
        total_ventas = sum(v[0] * v[1] for v in ventas.values()) if ventas else 0
        
        for producto in productos:
            codigo = producto.get('codigoproducto')
            nombre = producto.get('producto', '')
            
            if codigo in ventas:
                cantidad, precio = ventas[codigo]
            else:
                cantidad, precio = 0, 0.0
            
            monto_ventas = cantidad * precio
            pct_vv = (cantidad / total_vv * 100) if total_vv else 0.0
            vv_mes = (monto_ventas / cantidad) if cantidad else 0.0
            pct_ventas = (monto_ventas / total_ventas * 100) if total_ventas else 0.0
            
            filas.append({
                "producto": nombre,
                "codigo": codigo,
                "vv": cantidad,
                "pct_vv": round(pct_vv, 1),
                "precio": precio,
                "ventas": round(monto_ventas, 2),
                "vv_mes": round(vv_mes, 2),
                "pct_venta": round(pct_ventas, 1)
            })
        
        totales = {
            "vv": total_vv,
            "ventas": round(total_ventas, 2)
        }
        
        return jsonify({
            'success': True,
            'data': {
                'filas': filas,
                'totales': totales,
                'mes': year_month
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    # ============================================


# API RECETA x PRODUCTO - MATERIA PRIMA (Camila)
# ============================================


@app.route('/api/receta-producto/meses', methods=['GET'])
def api_receta_meses():
    """Obtener meses con productos registrados"""
    try:
        productos = ProductoService.listar_todo()
        meses_set = set()
        
        for p in productos:
            fecha = p.get('fecharegistro', '')
            if fecha:
                try:
                    mes_num = fecha.split('-')[1]
                    meses_set.add(mes_num)
                except:
                    pass
        
        # Ordenar meses
        meses_ordenados = sorted(meses_set, reverse=True)
        meses_formato = [MESES_ES.get(m, m) for m in meses_ordenados]
        
        return jsonify({
            'success': True,
            'data': {
                'meses': meses_ordenados,
                'meses_formato': meses_formato
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/receta-producto/productos-por-mes/<mes>', methods=['GET'])
def api_productos_por_mes(mes):
    """Obtener productos registrados en un mes específico"""
    try:
        productos = ProductoService.listar_todo()
        productos_filtrados = []
        
        for p in productos:
            fecha = p.get('fecharegistro', '')
            if fecha:
                try:
                    if fecha.split('-')[1] == mes:
                        productos_filtrados.append({
                            'codigo': p.get('codigoproducto'),
                            'nombre': p.get('producto'),
                            'descripcion': (p.get('descripcion') or '')[:100]
                        })
                except:
                    pass
        
        return jsonify({'success': True, 'data': productos_filtrados})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/receta-producto/materiales/<int:codigo_producto>', methods=['GET'])
def api_materiales_por_producto(codigo_producto):
    """Obtener materiales y costo total de un producto"""
    try:
        # Obtener receta del producto
        recetas = RecetaProductoService.listar_todo()
        materiales_producto = [r for r in recetas if r.get('codigoproducto') == codigo_producto]
        
        if not materiales_producto:
            return jsonify({
                'success': True,
                'data': {
                    'materiales': [],
                    'costo_total': 0.0,
                    'producto': ''
                }
            })
        
        # Obtener todos los materiales para cruzar costos
        todos_materiales = MaterialesService.listar_todo()
        
        materiales_result = []
        total = 0.0
        
        for item in materiales_producto:
            cod_material = item.get('codigomaterial')
            cantidad = float(item.get('cantidadnecesaria', 0) or 0)
            unidad = item.get('unidadmedida', '')
            nombre_material = item.get('material', '')
            
            # Buscar costo unitario en tabla de materiales
            costo_unitario = 0.0
            for m in todos_materiales:
                if m.get('codigomaterial') == cod_material:
                    costo_unitario = float(m.get('costounitario', 0) or 0)
                    break
            
            subtotal = cantidad * costo_unitario
            total += subtotal
            
            materiales_result.append({
                'codigo_mp': cod_material,
                'material': nombre_material,
                'unidad': unidad,
                'cantidad': cantidad,
                'costo_unitario': costo_unitario,
                'subtotal': subtotal
            })
        
        # Obtener nombre del producto
        productos = ProductoService.listar_todo()
        nombre_producto = ''
        for p in productos:
            if p.get('codigoproducto') == codigo_producto:
                nombre_producto = p.get('producto', '')
                break
        
        return jsonify({
            'success': True,
            'data': {
                'producto': nombre_producto,
                'materiales': materiales_result,
                'costo_total': round(total, 2)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# API MOD y CIF POR PRODUCTO (Tiffany)
# ============================================

def n(valor):
    """Convierte a float de forma segura"""
    try:
        return float(valor or 0)
    except:
        return 0.0

def campo(dic, nombres):
    """Busca un campo por múltiples nombres posibles"""
    for nombre in nombres:
        if nombre in dic:
            return dic.get(nombre)
    return None

@app.route('/api/mod-cif/meses', methods=['GET'])
def api_mod_cif_meses():
    """Obtener meses disponibles de CIF desde cif_mensual"""
    try:
        from datetime import datetime
        
        # Consultar directamente la tabla cif_mensual
        result = supabase_client.table('cif_mensual').select('periodo').execute()
        
        # Extraer períodos únicos
        meses_set = set()
        for r in (result.data or []):
            periodo = r.get('periodo')
            if periodo:
                meses_set.add(periodo)
        
        # Ordenar de más reciente a más antiguo
        meses_ordenados = sorted(meses_set, reverse=True)
        
        # Formatear nombres de meses
        meses_formato = []
        for m in meses_ordenados:
            try:
                mes_num = m.split('-')[1]
                meses_formato.append(MESES_ES.get(mes_num, mes_num))
            except:
                meses_formato.append(m)
        
        print(f"📅 Períodos disponibles en cif_mensual: {meses_ordenados}")
        
        return jsonify({
            'success': True,
            'data': {
                'meses': meses_ordenados,
                'meses_formato': meses_formato
            }
        })
    except Exception as e:
        print(f"Error en api_mod_cif_meses: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/mod-cif/productos', methods=['GET'])
def api_mod_cif_productos():
    """Obtener productos filtrados por período (año-mes)"""
    try:
        periodo = request.args.get('mes', 'TODOS')  # Ahora recibe '2026-04' o 'TODOS'
        productos = ProductoService.listar_todo()
        
        # Si periodo es 'TODOS', mostrar todos los productos
        if periodo == 'TODOS':
            productos_filtrados = []
            for p in productos:
                codigo = campo(p, ['codigoproducto', 'CodigoProducto'])
                nombre = campo(p, ['producto', 'Producto'])
                if codigo and nombre:
                    productos_filtrados.append({
                        'codigo': codigo,
                        'nombre': nombre,
                        'fecha': campo(p, ['fecharegistro', 'FechaRegistro'])
                    })
            return jsonify({'success': True, 'data': productos_filtrados})
        
        # Filtrar productos que tengan fecha de registro en el período
        anio, mes = periodo.split('-')
        productos_filtrados = []
        for p in productos:
            codigo = campo(p, ['codigoproducto', 'CodigoProducto'])
            nombre = campo(p, ['producto', 'Producto'])
            fecha = campo(p, ['fecharegistro', 'FechaRegistro'])
            
            if fecha and codigo and nombre:
                try:
                    fecha_obj = datetime.strptime(str(fecha), "%Y-%m-%d")
                    if fecha_obj.strftime("%Y-%m") == periodo:
                        productos_filtrados.append({
                            'codigo': codigo,
                            'nombre': nombre,
                            'fecha': fecha
                        })
                except:
                    pass
        
        # Si no hay productos con fecha exacta, mostrar todos (o al menos los que existen)
        if not productos_filtrados:
            for p in productos:
                codigo = campo(p, ['codigoproducto', 'CodigoProducto'])
                nombre = campo(p, ['producto', 'Producto'])
                if codigo and nombre:
                    productos_filtrados.append({
                        'codigo': codigo,
                        'nombre': nombre,
                        'fecha': campo(p, ['fecharegistro', 'FechaRegistro'])
                    })
        
        return jsonify({'success': True, 'data': productos_filtrados})
    except Exception as e:
        print(f"Error en api_mod_cif_productos: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/mod-cif/calcular/<int:codigo_producto>', methods=['GET'])
def api_mod_cif_calcular(codigo_producto):
    """
    Calcula MOD, CIF, GA y GV para un producto específico.
    GA y GV se calculan usando % Part. Ventas del producto.
    """
    try:
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        
        # ============================================
        # 1. OBTENER PERÍODO PARA CIF
        # ============================================
        periodo_solicitado = request.args.get('periodo')
        mes_actual = datetime.now().strftime("%Y-%m")
        
        # Determinar período a usar
        if periodo_solicitado:
            if periodo_solicitado == mes_actual:
                periodo_usado = (datetime.now() - relativedelta(months=1)).strftime("%Y-%m")
            else:
                periodo_usado = periodo_solicitado
        else:
            periodo_usado = (datetime.now() - relativedelta(months=1)).strftime("%Y-%m")
        
        print(f"📅 Calculando para período: {periodo_usado}")
        
        # ============================================
        # 2. OBTENER DATOS DE VENTAS DEL PERÍODO
        # ============================================
        # 🔥 NUEVO: Usar VENTAS_DEMO pero estructurado para obtener % ventas
        ventas_mes = VENTAS_DEMO.get(periodo_usado, {})
        
        # Calcular total de ventas del mes (en soles)
        total_ventas_mes = sum(v[0] * v[1] for v in ventas_mes.values()) if ventas_mes else 1
        
        # Obtener ventas del producto específico
        if codigo_producto in ventas_mes:
            cantidad_vendida = ventas_mes[codigo_producto][0]
            precio_producto = ventas_mes[codigo_producto][1]
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
        
        print(f"📊 Ventas producto: S/ {ventas_producto:.2f} ({pct_ventas:.2f}% del total)")
        
        # ============================================
        # 3. OBTENER GA TOTAL (desde tablaga)
        # ============================================
        try:
            ga_result = supabase_client.table('tablaga').select('monto').execute()
            ga_total = sum(float(g.get('monto', 0) or 0) for g in (ga_result.data or []))
            print(f"💰 GA Total desde tablaga: S/ {ga_total:.2f}")
        except Exception as e:
            print(f"❌ Error obteniendo GA: {e}")
            ga_total = 0
        
        # ============================================
        # 4. OBTENER GV TOTAL (desde tablagv)
        # ============================================
        try:
            gv_result = supabase_client.table('tablagv').select('monto').execute()
            gv_total = sum(float(g.get('monto', 0) or 0) for g in (gv_result.data or []))
            print(f"💰 GV Total desde tablagv: S/ {gv_total:.2f}")
        except Exception as e:
            print(f"❌ Error obteniendo GV: {e}")
            gv_total = 0
        
        # ============================================
        # 5. CALCULAR GA Y GV POR PRODUCTO (usando % Ventas)
        # ============================================
        # 🔥 FÓRMULA CORRECTA: GA_producto = GA_total * (%Ventas_producto / 100)
        factor_ventas = pct_ventas / 100 if pct_ventas > 0 else 0
        
        ga_producto = ga_total * factor_ventas
        gv_producto = gv_total * factor_ventas
        
        # GA y GV POR UNIDAD (lo que se muestra en el frontend)
        if cantidad_vendida > 0:
            ga_por_unidad = ga_producto / cantidad_vendida
            gv_por_unidad = gv_producto / cantidad_vendida
        else:
            ga_por_unidad = 0
            gv_por_unidad = 0
        
        print(f"📊 GA asignado al producto: S/ {ga_producto:.2f} (por unidad: S/ {ga_por_unidad:.4f})")
        print(f"📊 GV asignado al producto: S/ {gv_producto:.2f} (por unidad: S/ {gv_por_unidad:.4f})")
        
        # ============================================
        # 6. OBTENER DATOS DE LAS DEMÁS TABLAS
        # ============================================
        personal = PersonalService.listar_todo()
        productos = ProductoService.listar_todo()
        receta_mo = RecetaManoObraService.listar_todo()
        
        # Obtener CIF del período específico desde cif_mensual
        try:
            cif_result = supabase_client.table('cif_mensual').select('*').eq('periodo', periodo_usado).execute()
            cif_data = cif_result.data or []
        except Exception as e:
            print(f"❌ Error consultando cif_mensual: {e}")
            cif_data = []
        
        # ============================================
        # 7. FILTRAR RECETA DEL PRODUCTO
        # ============================================
        receta_producto = [
            r for r in receta_mo
            if str(campo(r, ['codigoproducto', 'CodigoProducto'])) == str(codigo_producto)
        ]
        
        usa_base = False
        if not receta_producto:
            receta_producto = [
                r for r in receta_mo
                if str(campo(r, ['codigoproducto', 'CodigoProducto'])) == "21001"
            ]
            usa_base = True
            print(f"📌 Usando MOD base del producto 21001")
        
        # ============================================
        # 8. CALCULAR MOD (MANO DE OBRA DIRECTA)
        # ============================================
        mod_items = []
        total_mod = 0.0
        minutos_mod_producto = 0.0
        
        # Calcular total de minutos efectivos de TODOS los trabajadores
        total_minutos_efectivos = 0
        
        for p in personal:
            tiempo_total = n(campo(p, ['tiempototal_min', 'TiempoTotal_min']))
            productividad = n(campo(p, ['productividad', 'Productividad']))
            if productividad == 0:
                productividad = 1.0
            tiempo_efectivo = tiempo_total * productividad
            total_minutos_efectivos += tiempo_efectivo
        
        if total_minutos_efectivos == 0:
            total_minutos_efectivos = 1
        
        # Calcular MOD del producto
        for r in receta_producto:
            cod_trabajador = campo(r, ['codigotrabajador', 'CodigoTrabajador'])
            minutos = n(campo(r, ['tiempotrabajo', 'TiempoTrabajo']))
            
            # Buscar trabajador
            trabajador = None
            for p in personal:
                cod_personal = campo(p, ['codigotrabajador', 'CodigoTrabajador'])
                if str(cod_personal) == str(cod_trabajador):
                    trabajador = p
                    break
            
            if trabajador is None:
                continue
            
            puesto = campo(trabajador, ['puestotrabajo', 'PuestoTrabajo']) or 'N/A'
            sueldo_total = n(campo(trabajador, ['sueldototal', 'SueldoTotal']))
            tiempo_total = n(campo(trabajador, ['tiempototal_min', 'TiempoTotal_min']))
            productividad_trab = n(campo(trabajador, ['productividad', 'Productividad']))
            
            if productividad_trab == 0:
                productividad_trab = 1.0
            
            tiempo_efectivo_trab = tiempo_total * productividad_trab
            
            # Costo por minuto
            costo_min = sueldo_total / tiempo_efectivo_trab if tiempo_efectivo_trab else 0
            
            # Importe MOD para este trabajador en este producto
            importe_mod = costo_min * minutos
            total_mod += importe_mod
            
            # Acumular minutos MOD del producto (considerando productividad)
            minutos_mod_producto += minutos * productividad_trab
            
            mod_items.append({
                'personal': puesto,
                'codigo_trabajador': cod_trabajador,
                'sueldo': round(sueldo_total, 2),
                'minutos': round(minutos, 2),
                'minutos_efectivos': round(minutos * productividad_trab, 2),
                'productividad': round(productividad_trab * 100, 1),
                'tiempo_total': round(tiempo_total, 2),
                'tiempo_efectivo': round(tiempo_efectivo_trab, 2),
                'costo_min': round(costo_min, 6),
                'importe': round(importe_mod, 4)
            })
        
        # ============================================
        # 9. CALCULAR CIF (COSTOS INDIRECTOS)
        # ============================================
        cif_items = []
        total_cif = 0.0
        
        if cif_data:
            for c in cif_data:
                codigo_cif = c.get('codigocif', '')
                concepto = c.get('denominacion', 'N/A')
                monto_mensual = n(c.get('monto', 0))
                
                # Distribuir CIF según minutos MOD del producto
                factor_distribucion = minutos_mod_producto / total_minutos_efectivos if total_minutos_efectivos > 0 else 0
                importe_cif = monto_mensual * factor_distribucion
                
                total_cif += importe_cif
                
                cif_items.append({
                    'codigo': codigo_cif,
                    'concepto': concepto,
                    'monto_mensual': round(monto_mensual, 2),
                    'factor_distribucion': round(factor_distribucion * 100, 4),
                    'importe_unitario': round(importe_cif, 4)
                })
        else:
            # Fallback
            cif_static = CIFService.listar_todo()
            for c in cif_static:
                concepto = campo(c, ['denominacion', 'Denominacion']) or 'N/A'
                monto_mensual = n(campo(c, ['monto', 'Monto']))
                
                factor_distribucion = minutos_mod_producto / total_minutos_efectivos if total_minutos_efectivos > 0 else 0
                importe_cif = monto_mensual * factor_distribucion
                total_cif += importe_cif
                
                cif_items.append({
                    'concepto': concepto,
                    'monto_mensual': round(monto_mensual, 2),
                    'factor_distribucion': round(factor_distribucion * 100, 4),
                    'importe_unitario': round(importe_cif, 4),
                    'es_demo': True
                })
        
        # ============================================
        # 10. TOTAL GENERAL DEL PRODUCTO
        # ============================================
        total_general = total_mod + total_cif + ga_por_unidad + gv_por_unidad
        
        # ============================================
        # 11. OBTENER NOMBRE DEL PRODUCTO
        # ============================================
        nombre_producto = ''
        for p in productos:
            if campo(p, ['codigoproducto', 'CodigoProducto']) == codigo_producto:
                nombre_producto = campo(p, ['producto', 'Producto']) or ''
                break
        
        # ============================================
        # 12. RESPONDER CON RESULTADOS
        # ============================================
        return jsonify({
            'success': True,
            'data': {
                'producto': {
                    'codigo': codigo_producto,
                    'nombre': nombre_producto
                },
                'periodo_cif': {
                    'usado': periodo_usado,
                    'solicitado': periodo_solicitado,
                    'hay_datos_cif': len(cif_data) > 0
                },
                'info_plan': {
                    'mes': periodo_usado,
                    'cantidad_vendida': cantidad_vendida,
                    'pct_ventas': round(pct_ventas, 2),
                    'ventas_producto': round(ventas_producto, 2),
                    'total_ventas_mes': round(total_ventas_mes, 2),
                    'ga_total': round(ga_total, 2),
                    'gv_total': round(gv_total, 2),
                    'ga_producto': round(ga_producto, 2),
                    'gv_producto': round(gv_producto, 2)
                },
                'mod': {
                    'items': mod_items,
                    'total': round(total_mod, 4),
                    'minutos_totales_producto': round(minutos_mod_producto, 2)
                },
                'cif': {
                    'items': cif_items,
                    'total': round(total_cif, 4),
                    'total_minutos_efectivos': round(total_minutos_efectivos, 2)
                },
                'ga': round(ga_por_unidad, 4),
                'gv': round(gv_por_unidad, 4),
                'total_general': round(total_general, 4),
                'usa_base_mod': usa_base
            }
        })
        
    except Exception as e:
        print(f"❌ Error en api_mod_cif_calcular: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
# ============================================
# API CIF MENSUAL (NUEVO)
# ============================================

@app.route('/api/cif-mensual/meses-disponibles', methods=['GET'])
def obtener_meses_cif():
    """Obtener meses con CIF registrados (excluye mes actual si no está cerrado)"""
    try:
        from datetime import datetime
        mes_actual = datetime.now().strftime("%Y-%m")
        
        # Obtener meses distintos de la tabla
        result = supabase_client.table('cif_mensual').select('periodo').execute()
        meses = list(set([r['periodo'] for r in result.data])) if result.data else []
        meses.sort(reverse=True)
        
        # Excluir mes actual (porque aún no está cerrado)
        meses_disponibles = [m for m in meses if m != mes_actual]
        
        # Si no hay meses, crear enero 2026 por defecto
        if not meses_disponibles:
            meses_disponibles = ['2026-01']
            
        return jsonify({'success': True, 'data': meses_disponibles})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/cif-mensual', methods=['GET'])
def obtener_cif_por_periodo():
    """Obtener CIF para un período específico"""
    try:
        periodo = request.args.get('periodo')
        if not periodo:
            return jsonify({'success': False, 'error': 'Se requiere periodo'}), 400
            
        result = supabase_client.table('cif_mensual').select('*').eq('periodo', periodo).execute()
        
        # Formatear respuesta
        cif_items = []
        for item in (result.data or []):
            cif_items.append({
                'codigocif': item.get('codigocif'),
                'denominacion': item.get('denominacion'),
                'monto': float(item.get('monto', 0))
            })
            
        return jsonify({'success': True, 'data': cif_items, 'periodo': periodo})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/cif-mensual/ultimos-meses', methods=['GET'])
def obtener_ultimos_meses_cif():
    """Obtener CIF de los últimos N meses (excluye mes actual)"""
    try:
        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta
        
        # Mes actual
        hoy = datetime.now()
        mes_actual = hoy.strftime("%Y-%m")
        
        # Últimos 3 meses completos (excluyendo mes actual)
        meses = []
        for i in range(1, 4):  # 1, 2, 3 meses atrás
            mes = (hoy - relativedelta(months=i)).strftime("%Y-%m")
            meses.append(mes)
        
        # Obtener CIF para cada mes
        resultado = {}
        for mes in meses:
            result = supabase_client.table('cif_mensual').select('*').eq('periodo', mes).execute()
            if result.data:
                resultado[mes] = [{
                    'codigocif': r.get('codigocif'),
                    'denominacion': r.get('denominacion'),
                    'monto': float(r.get('monto', 0))
                } for r in result.data]
            else:
                resultado[mes] = []  # Sin datos para ese mes
                
        return jsonify({'success': True, 'data': resultado, 'mes_actual': mes_actual})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/cif-mensual', methods=['POST'])
def guardar_cif_mensual():
    """Guardar o actualizar CIF para un período"""
    try:
        data = request.json
        periodo = data.get('periodo')
        items = data.get('items', [])
        
        if not periodo:
            return jsonify({'success': False, 'error': 'Se requiere período'}), 400
        
        # Verificar que el período no sea el mes actual
        from datetime import datetime
        mes_actual = datetime.now().strftime("%Y-%m")
        if periodo == mes_actual:
            return jsonify({'success': False, 'error': 'No se puede modificar el mes actual'}), 400
        
        # Guardar cada item (upsert)
        for item in items:
            supabase_client.table('cif_mensual').upsert({
                'codigocif': item.get('codigocif'),
                'denominacion': item.get('denominacion'),
                'periodo': periodo,
                'monto': float(item.get('monto', 0))
            }, on_conflict='codigocif,periodo').execute()
        
        return jsonify({'success': True, 'mensaje': f'CIF guardados para {periodo}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/cif-mensual/<periodo>', methods=['DELETE'])
def eliminar_cif_mensual(periodo):
    """Eliminar todos los CIF de un período"""
    try:
        from datetime import datetime
        mes_actual = datetime.now().strftime("%Y-%m")
        if periodo == mes_actual:
            return jsonify({'success': False, 'error': 'No se puede eliminar el mes actual'}), 400
            
        supabase_client.table('cif_mensual').delete().eq('periodo', periodo).execute()
        return jsonify({'success': True, 'mensaje': f'CIF de {periodo} eliminados'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
# ============================================
# API GA (Gastos Administrativos)
# ============================================

@app.route('/api/ga', methods=['GET'])
def api_listar_ga():
    """Listar todos los gastos administrativos"""
    try:
        result = supabase_client.table('tablaga').select('*').execute()
        return jsonify({'success': True, 'data': result.data or []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ga/total', methods=['GET'])
def api_total_ga():
    """Obtener total de gastos administrativos"""
    try:
        result = supabase_client.table('tablaga').select('monto').execute()
        total = sum(float(r.get('monto', 0) or 0) for r in (result.data or []))
        return jsonify({'success': True, 'total': round(total, 2)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# API GV (Gastos de Ventas)
# ============================================

@app.route('/api/gv', methods=['GET'])
def api_listar_gv():
    """Listar todos los gastos de ventas"""
    try:
        result = supabase_client.table('tablagv').select('*').execute()
        return jsonify({'success': True, 'data': result.data or []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/gv/total', methods=['GET'])
def api_total_gv():
    """Obtener total de gastos de ventas"""
    try:
        result = supabase_client.table('tablagv').select('monto').execute()
        total = sum(float(r.get('monto', 0) or 0) for r in (result.data or []))
        return jsonify({'success': True, 'total': round(total, 2)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# DIAGNÓSTICO CIF MENSUAL
# ============================================

@app.route('/api/debug-cif-directo', methods=['GET'])
def debug_cif_directo():
    """Diagnóstico directo de cif_mensual"""
    try:
        resultados = {}
        
        # Método 1: Usar el servicio
        try:
            from servicios import CIFMensualService
            cif_service = CIFMensualService
            data = cif_service.listar_todo()
            resultados['servicio_listar_todo'] = {
                'registros': len(data),
                'primeros': data[:3] if data else []
            }
        except Exception as e:
            resultados['servicio_error'] = str(e)
        
        # Método 2: Usar supabase_client directamente
        try:
            result = supabase_client.table('cif_mensual').select('*').execute()
            resultados['supabase_directo'] = {
                'registros': len(result.data or []),
                'primeros': (result.data or [])[:3]
            }
        except Exception as e:
            resultados['supabase_error'] = str(e)
        
        # Método 3: Ver si la tabla existe
        try:
            result = supabase_client.table('cif_mensual').select('periodo').limit(1).execute()
            resultados['tabla_existe'] = len(result.data or []) >= 0
        except Exception as e:
            resultados['tabla_existe_error'] = str(e)
        
        return jsonify(resultados)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# AUTENTICACIÓN
# ============================================
# ✅ AGREGAR ESTE ENDPOINT DE PRUEBA AQUÍ (al final de la sección)
@app.route('/api/test-cif', methods=['GET'])
def test_cif():
    """Endpoint de prueba para verificar cif_mensual"""
    try:
        from datetime import datetime
        
        # Probar obtener todos los períodos
        result = supabase_client.table('cif_mensual').select('periodo').execute()
        periodos = list(set([r['periodo'] for r in (result.data or [])]))
        
        # Probar obtener abril 2026 específicamente
        abril_result = supabase_client.table('cif_mensual').select('*').eq('periodo', '2026-04').execute()
        
        # Probar obtener datos completos
        all_result = supabase_client.table('cif_mensual').select('*').execute()
        
        return jsonify({
            'success': True,
            'periodos_disponibles': sorted(periodos),
            'abril_2026': abril_result.data or [],
            'total_registros': len(all_result.data or []),
            'fecha_actual': datetime.now().strftime("%Y-%m-%d"),
            'mensaje': 'Prueba exitosa - CIF mensual funcionando'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/auth/registro', methods=['POST'])
def api_registro():
    """Registrar nuevo usuario"""
    try:
        datos = request.json
        email = datos.get('email')
        password = datos.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email y contraseña requeridos'}), 400
        
        db = SupabaseBrain.get_client()
        result = db.auth.sign_up({
            "email": email,
            "password": password
        })
        
        return jsonify({
            'success': True,
            'data': {
                'user': result.user.email,
                'id': result.user.id
            },
            'mensaje': 'Usuario registrado. Revisa tu correo para confirmar.'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """Iniciar sesión"""
    try:
        datos = request.json
        email = datos.get('email')
        password = datos.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email y contraseña requeridos'}), 400
        
        db = SupabaseBrain.get_client()
        result = db.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        return jsonify({
            'success': True,
            'data': {
                'user': result.user.email,
                'id': result.user.id,
                'token': result.session.access_token
            }
        })
    except Exception as e:
        import traceback
        print("--- ERROR EN LOGIN ---")
        traceback.print_exc()
        # Si es un error de Supabase, a veces viene como un objeto con mensaje
        error_msg = str(e)
        return jsonify({'success': False, 'error': error_msg}), 401

@app.route('/api/auth/cerrar-sesion', methods=['POST'])
def api_logout():
    """Cerrar sesión"""
    try:
        db = SupabaseBrain.get_client()
        db.auth.sign_out()
        return jsonify({'success': True, 'mensaje': 'Sesión cerrada'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# API COSTO TOTAL MENSUAL (NUEVO)
# ============================================

@app.route('/api/costo-total-mensual/<year_month>', methods=['GET'])
def api_costo_total_mensual(year_month):
    """
    Calcula el costo total de producción para un mes específico.
    Fórmula: Σ (cantidad_producida × costo_unitario_total)
    donde costo_unitario_total = costo_MP + costo_MOD + costo_CIF + GA_unit + GV_unit
    """
    try:
        # 1. Obtener plan de producción del mes
        ventas_mes = VENTAS_DEMO.get(year_month, {})
        
        # 2. Obtener todos los productos
        productos = ProductoService.listar_todo()
        
        # 3. Obtener datos necesarios para costos
        todos_materiales = MaterialesService.listar_todo()
        recetas_producto = RecetaProductoService.listar_todo()
        personal = PersonalService.listar_todo()
        receta_mo = RecetaManoObraService.listar_todo()
        cif_data = CIFService.listar_todo()
        ga_data = GAService.listar_todo()
        gv_data = GVService.listar_todo()
        
        # 4. Calcular tiempo total de todos los trabajadores (para prorrateo CIF)
        total_minutos_todos = sum(
            n(campo(p, ['tiempototal_min', 'TiempoTotal_min']))
            for p in personal
        )
        if total_minutos_todos == 0:
            total_minutos_todos = 1  # Evitar división por cero
        
        # 5. Calcular factor de prorrateo para GA y GV
        # Se prorratean entre todos los productos basado en cantidad producida
        total_unidades_mes = sum(v[0] for v in ventas_mes.values()) if ventas_mes else 1
        
        # Totales de GA y GV
        total_ga = sum(n(campo(g, ['monto', 'Monto'])) for g in ga_data)
        total_gv = sum(n(campo(g, ['monto', 'Monto'])) for g in gv_data)
        
        # GA y GV por unidad (prorrateo simple)
        ga_por_unidad = total_ga / total_unidades_mes if total_unidades_mes > 0 else 0
        gv_por_unidad = total_gv / total_unidades_mes if total_unidades_mes > 0 else 0
        
        # 6. Calcular costo por cada producto
        detalle_productos = []
        total_costo_mensual = 0.0
        total_unidades_producidas = 0
        
        for producto in productos:
            codigo_producto = campo(producto, ['codigoproducto', 'CodigoProducto'])
            nombre_producto = campo(producto, ['producto', 'Producto']) or ''
            
            # Cantidad producida este mes
            if codigo_producto in ventas_mes:
                cantidad_producida = ventas_mes[codigo_producto][0]
            else:
                cantidad_producida = 0
            
            if cantidad_producida == 0:
                continue
            
            total_unidades_producidas += cantidad_producida
            
            # ── COSTO DE MATERIA PRIMA ──
            costo_mp_unitario = 0.0
            materiales_detalle = []
            
            # Filtrar receta de este producto
            receta_prod = [r for r in recetas_producto 
                          if str(campo(r, ['codigoproducto', 'CodigoProducto'])) == str(codigo_producto)]
            
            for item in receta_prod:
                cod_material = campo(item, ['codigomaterial', 'CodigoMaterial'])
                cantidad_necesaria = n(campo(item, ['cantidadnecesaria', 'CantidadNecesaria']))
                
                # Buscar costo del material
                costo_unitario_mat = 0.0
                for m in todos_materiales:
                    if campo(m, ['codigomaterial', 'CodigoMaterial']) == cod_material:
                        costo_unitario_mat = n(campo(m, ['costounitario', 'CostoUnitario']))
                        break
                
                subtotal_mat = cantidad_necesaria * costo_unitario_mat
                costo_mp_unitario += subtotal_mat
                
                materiales_detalle.append({
                    'codigo_material': cod_material,
                    'cantidad': cantidad_necesaria,
                    'costo_unitario': costo_unitario_mat,
                    'subtotal': round(subtotal_mat, 4)
                })
            
            # ── COSTO DE MANO DE OBRA DIRECTA (MOD) ──
            costo_mod_unitario = 0.0
            mod_detalle = []

            # Filtrar receta MO de este producto
            receta_mo_prod = [r for r in receta_mo 
                            if str(campo(r, ['codigoproducto', 'CodigoProducto'])) == str(codigo_producto)]

            # Si no tiene receta, usar base 21001
            if not receta_mo_prod:
                receta_mo_prod = [r for r in receta_mo 
                                if str(campo(r, ['codigoproducto', 'CodigoProducto'])) == "21001"]

            for item in receta_mo_prod:
                cod_trabajador = campo(item, ['codigotrabajador', 'CodigoTrabajador'])
                minutos = n(campo(item, ['tiempotrabajo', 'TiempoTrabajo']))
                
                # Buscar trabajador
                trabajador = None
                for p in personal:
                    if str(campo(p, ['codigotrabajador', 'CodigoTrabajador'])) == str(cod_trabajador):
                        trabajador = p
                        break
                
                if trabajador:
                    sueldo_total_trab = n(campo(trabajador, ['sueldototal', 'SueldoTotal']))
                    tiempo_total_trab = n(campo(trabajador, ['tiempototal_min', 'TiempoTotal_min']))
                    productividad_trab = n(campo(trabajador, ['productividad', 'Productividad']))
                    
                    # Si la productividad es 0, usar 1 (100%)
                    if productividad_trab == 0:
                        productividad_trab = 1.0
                    
                    # 🔄 CORRECCIÓN: Tiempo efectivo = Tiempo Total * Productividad
                    tiempo_efectivo_trab = tiempo_total_trab * productividad_trab
                    
                    # Costo por minuto = Sueldo / Tiempo Efectivo
                    costo_min = sueldo_total_trab / tiempo_efectivo_trab if tiempo_efectivo_trab else 0
                    importe_mod = costo_min * minutos
                    costo_mod_unitario += importe_mod
                    
                    mod_detalle.append({
                        'codigotrabajador': cod_trabajador,
                        'minutos': minutos,
                        'productividad': round(productividad_trab * 100, 1),
                        'costo_minuto': round(costo_min, 6),
                        'importe': round(importe_mod, 4)
                    })


            # ── COSTO INDIRECTO (CIF) ──
            costo_cif_unitario = 0.0
            
            # Sumar minutos MOD efectivos de este producto (considerando productividad)
            minutos_mod_producto = 0
            for item in receta_mo_prod:
                cod_trab = campo(item, ['codigotrabajador', 'CodigoTrabajador'])
                minutos_item = n(campo(item, ['tiempotrabajo', 'TiempoTrabajo']))
                
                # Buscar productividad del trabajador
                for p in personal:
                    if str(campo(p, ['codigotrabajador', 'CodigoTrabajador'])) == str(cod_trab):
                        prod = n(campo(p, ['productividad', 'Productividad']))
                        if prod == 0:
                            prod = 1.0
                        minutos_mod_producto += minutos_item * prod
                        break

            # Calcular total de minutos efectivos de todos los trabajadores
            total_minutos_efectivos = 0
            for p in personal:
                tiempo_total_p = n(campo(p, ['tiempototal_min', 'TiempoTotal_min']))
                productividad_p = n(campo(p, ['productividad', 'Productividad']))
                if productividad_p == 0:
                    productividad_p = 1.0
                total_minutos_efectivos += tiempo_total_p * productividad_p

            if total_minutos_efectivos == 0:
                total_minutos_efectivos = 1

            for c in cif_data:
                monto_cif = n(campo(c, ['monto', 'Monto']))
                factor_cif = monto_cif / total_minutos_efectivos
                costo_cif_unitario += factor_cif * minutos_mod_producto
            
            # ── COSTO TOTAL UNITARIO ──
            costo_total_unitario = (
                costo_mp_unitario + 
                costo_mod_unitario + 
                costo_cif_unitario + 
                ga_por_unidad + 
                gv_por_unidad
            )
            
            # ── COSTO TOTAL DEL PRODUCTO EN EL MES ──
            costo_total_producto = costo_total_unitario * cantidad_producida
            total_costo_mensual += costo_total_producto
            
            detalle_productos.append({
                'codigo': codigo_producto,
                'nombre': nombre_producto,
                'cantidad_producida': cantidad_producida,
                'costo_mp_unitario': round(costo_mp_unitario, 4),
                'costo_mod_unitario': round(costo_mod_unitario, 4),
                'costo_cif_unitario': round(costo_cif_unitario, 4),
                'ga_unitario': round(ga_por_unidad, 4),
                'gv_unitario': round(gv_por_unidad, 4),
                'costo_total_unitario': round(costo_total_unitario, 4),
                'costo_total_producto': round(costo_total_producto, 2),
                'materiales_detalle': materiales_detalle,
                'mod_detalle': mod_detalle
            })
        
        # 7. Resumen mensual
        resumen = {
            'mes': year_month,
            'total_unidades_producidas': total_unidades_producidas,
            'total_costo_mensual': round(total_costo_mensual, 2),
            'costo_promedio_unitario': round(total_costo_mensual / total_unidades_producidas, 4) if total_unidades_producidas > 0 else 0,
            'totales_por_concepto': {
                'materia_prima': round(sum(p['costo_mp_unitario'] * p['cantidad_producida'] for p in detalle_productos), 2),
                'mano_obra_directa': round(sum(p['costo_mod_unitario'] * p['cantidad_producida'] for p in detalle_productos), 2),
                'costos_indirectos': round(sum(p['costo_cif_unitario'] * p['cantidad_producida'] for p in detalle_productos), 2),
                'gastos_administrativos': round(total_ga, 2),
                'gastos_ventas': round(total_gv, 2)
            },
            'productos': detalle_productos
        }
        
        return jsonify({
            'success': True,
            'data': resumen
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# También agregamos un endpoint para obtener el mes actual automáticamente
@app.route('/api/costo-total-mensual', methods=['GET'])
def api_costo_total_mensual_actual():
    """Redirige al mes actual"""
    from datetime import datetime
    mes_actual = datetime.now().strftime("%Y-%m")
    return api_costo_total_mensual(mes_actual)

# ============================================
# API ÓRDENES DE TRABAJO
# ============================================

@app.route('/api/ordenes-trabajo', methods=['GET'])
def api_listar_ordenes():
    """Listar todas las órdenes de trabajo"""
    try:
        ordenes = OrdenTrabajoService.listar_todo()
        productos = ProductoService.listar_todo()
        
        # Agregar nombre del producto a cada orden
        for orden in ordenes:
            cod_producto = orden.get('codigo_producto')
            encontrado = False
            for p in productos:
                if p.get('codigoproducto') == cod_producto:
                    orden['producto_nombre'] = p.get('producto', '')
                    encontrado = True
                    break
            if not encontrado:
                orden['producto_nombre'] = f'Producto #{cod_producto}'
        
        return jsonify({'success': True, 'data': ordenes})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ordenes-trabajo/<int:id>', methods=['GET'])
def api_obtener_orden(id):
    """Obtener una orden específica"""
    try:
        ordenes = OrdenTrabajoService.obtener_por_id('id_orden', id)
        if ordenes:
            return jsonify({'success': True, 'data': ordenes[0]})
        return jsonify({'success': False, 'error': 'Orden no encontrada'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ordenes-trabajo', methods=['POST'])
def api_crear_orden_trabajo():
    """Crear nueva orden de trabajo"""
    try:
        datos = request.json
        datos['fecha_registro'] = date.today().isoformat()
        resultado = OrdenTrabajoService.insertar(datos)
        return jsonify({'success': True, 'data': resultado}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ordenes-trabajo/<int:id>', methods=['PUT'])
def api_actualizar_orden_trabajo(id):
    """Actualizar orden existente"""
    try:
        datos = request.json
        OrdenTrabajoService.eliminar('id_orden', id)
        datos['id_orden'] = id
        resultado = OrdenTrabajoService.insertar(datos)
        return jsonify({'success': True, 'data': resultado})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ordenes-trabajo/<int:id>', methods=['DELETE'])
def api_eliminar_orden_trabajo(id):
    """Eliminar orden de trabajo"""
    try:
        OrdenTrabajoService.eliminar('id_orden', id)
        return jsonify({'success': True, 'mensaje': 'Orden eliminada correctamente'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
# ============================================
# API KPIs DEL DASHBOARD
# ============================================

@app.route('/api/dashboard/kpis', methods=['GET'])
def api_dashboard_kpis():
    """Obtener KPIs para el dashboard"""
    try:
        # Obtener datos de órdenes
        ordenes = OrdenTrabajoService.listar_todo()
        
        # Calcular KPIs de órdenes
        activas = [o for o in ordenes if o.get('estado') in ['PENDIENTE', 'EN_PROCESO']]
        en_proceso = [o for o in ordenes if o.get('estado') == 'EN_PROCESO']
        
        # Completadas este mes
        from datetime import datetime
        mes_actual = datetime.now().month
        completadas = [o for o in ordenes 
                      if o.get('estado') == 'COMPLETADA' 
                      and o.get('fecha_emision', '').startswith(datetime.now().strftime('%Y-%m'))]
        
        # Costo promedio
        costos = [float(o.get('costo_total', 0) or 0) for o in ordenes if o.get('costo_total')]
        costo_promedio = sum(costos) / len(costos) if costos else 0
        
        # Obtener costo total del mes
        mes_actual_str = datetime.now().strftime("%Y-%m")
        ventas_mes = VENTAS_DEMO.get(mes_actual_str, {})
        total_unidades = sum(v[0] for v in ventas_mes.values()) if ventas_mes else 0
        
        # Eficiencia (calculada con datos de personal)
        personal = PersonalService.listar_todo()
        if personal:
            productividades = [float(p.get('productividad', 0) or 0) for p in personal]
            eficiencia = (sum(productividades) / len(productividades)) * 100 if productividades else 0
        else:
            eficiencia = 85.5  # Valor demo
        
        # Porcentajes de costo
        # Valores demo basados en los datos de VENTAS_DEMO
        porcentaje_mp = 52.7
        porcentaje_mod = 25.7
        porcentaje_cif = 14.1
        
        return jsonify({
            'success': True,
            'data': {
                'ordenes_activas': len(activas),
                'ordenes_proceso': len(en_proceso),
                'ordenes_completadas': len(completadas),
                'costo_promedio_orden': round(costo_promedio, 2),
                'eficiencia_global': round(eficiencia, 1),
                'porcentaje_mp': porcentaje_mp,
                'porcentaje_mod': porcentaje_mod,
                'porcentaje_cif': porcentaje_cif,
                'total_unidades_mes': total_unidades,
                'total_ordenes': len(ordenes)
            }
        })
        
    except Exception as e:
        # Si falla, devolver datos demo
        return jsonify({
            'success': True,
            'data': {
                'ordenes_activas': 5,
                'ordenes_proceso': 3,
                'ordenes_completadas': 8,
                'costo_promedio_orden': 2450.00,
                'eficiencia_global': 85.5,
                'porcentaje_mp': 52.7,
                'porcentaje_mod': 25.7,
                'porcentaje_cif': 14.1,
                'total_unidades_mes': 3670,
                'total_ordenes': 12
            }
        })

# ============================================
# API ESTADO DE RESULTADOS (NUEVO)
# ============================================

@app.route('/api/estado-resultados/<year_month>', methods=['GET'])
def api_estado_resultados(year_month):
    """
    Genera el Estado de Resultados para un mes específico.
    Incluye:
    - Ventas Netas
    - Costo de Ventas (MP, MOD, CIF)
    - Utilidad Bruta
    - Gastos Operativos (GA, GV)
    - Utilidad antes de Impuestos
    - Impuesto a la Renta (18%)
    - Utilidad Neta
    """
    try:
        # 1. Obtener datos de ventas del mes
        ventas_mes = VENTAS_DEMO.get(year_month, {})
        
        # 2. Obtener datos de costos del endpoint existente
        import requests
        
        # Llamar al endpoint de costo total mensual
        costo_response = api_costo_total_mensual(year_month)
        costo_data = costo_response.get_json()
        
        if not costo_data.get('success'):
            return jsonify({'success': False, 'error': 'No se pudo obtener costos'}), 500
        
        costos = costo_data['data']
        
        # 3. Calcular Ingresos
        ventas_totales = sum(v[0] * v[1] for v in ventas_mes.values()) if ventas_mes else 0
        ventas_netas = ventas_totales  # Sin devoluciones por ahora
        
        # 4. Calcular Costo de Ventas
        costo_mp = costos['totales_por_concepto']['materia_prima']
        costo_mod = costos['totales_por_concepto']['mano_obra_directa']
        costo_cif = costos['totales_por_concepto']['costos_indirectos']
        costo_ventas_total = costo_mp + costo_mod + costo_cif
        
        # 5. Utilidad Bruta
        utilidad_bruta = ventas_netas - costo_ventas_total
        
        # 6. Gastos Operativos
        gastos_admin = costos['totales_por_concepto']['gastos_administrativos']
        gastos_ventas = costos['totales_por_concepto']['gastos_ventas']
        total_gastos_operativos = gastos_admin + gastos_ventas
        
        # 7. Utilidad antes de Impuestos
        utilidad_antes_impuestos = utilidad_bruta - total_gastos_operativos
        
        # 8. Impuesto a la Renta (18%)
        impuesto_renta = utilidad_antes_impuestos * 0.18 if utilidad_antes_impuestos > 0 else 0
        
        # 9. Utilidad Neta
        utilidad_neta = utilidad_antes_impuestos - impuesto_renta
        
        # 10. Margen Neto
        margen_neto = (utilidad_neta / ventas_netas * 100) if ventas_netas > 0 else 0
        
        # 11. Rentabilidad por producto
        productos_rentabilidad = []
        for producto in costos['productos']:
            ventas_producto = 0
            codigo = producto['codigo']
            if codigo in ventas_mes:
                ventas_producto = ventas_mes[codigo][0] * ventas_mes[codigo][1]
            
            costo_producto = producto['costo_total_producto']
            utilidad_producto = ventas_producto - costo_producto
            margen_producto = (utilidad_producto / ventas_producto * 100) if ventas_producto > 0 else 0
            
            productos_rentabilidad.append({
                'nombre': producto['nombre'],
                'ventas': round(ventas_producto, 2),
                'costo': round(costo_producto, 2),
                'utilidad_bruta': round(utilidad_producto, 2),
                'margen': round(margen_producto, 1)
            })
        
        # Ordenar por ventas descendente
        productos_rentabilidad.sort(key=lambda x: x['ventas'], reverse=True)
        
        # Top 5
        top_productos = productos_rentabilidad[:5]
        
        return jsonify({
            'success': True,
            'data': {
                'mes': year_month,
                'ventas_totales': round(ventas_totales, 2),
                'ventas_netas': round(ventas_netas, 2),
                'costos_detalle': {
                    'materia_prima': round(costo_mp, 2),
                    'mano_obra_directa': round(costo_mod, 2),
                    'costos_indirectos': round(costo_cif, 2),
                    'total_costo_ventas': round(costo_ventas_total, 2)
                },
                'utilidad_bruta': round(utilidad_bruta, 2),
                'gastos_administrativos': round(gastos_admin, 2),
                'gastos_ventas': round(gastos_ventas, 2),
                'total_gastos_operativos': round(total_gastos_operativos, 2),
                'utilidad_antes_impuestos': round(utilidad_antes_impuestos, 2),
                'impuesto_renta': round(impuesto_renta, 2),
                'utilidad_neta': round(utilidad_neta, 2),
                'margen_neto': round(margen_neto, 1),
                'productos_rentabilidad': top_productos
            }
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
register_menu1_routes(app)
register_menu2_routes(app)
register_menu3_routes(app)
register_menu4_routes(app)
register_menu5_routes(app)
register_menu6_routes(app)
register_menu7_routes(app)
register_ia_routes(app)
register_abc_routes(app)

# ============================================
# ENRUTAMIENTO DEL FRONTEND
# ============================================

@app.route('/')
def servir_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/kardex_movil.html')
def servir_kardex_celular(): 
    return send_from_directory(FRONTEND_DIR, 'kardex_movil.html')

# El comodín general atrapa dinámicamente páginas como menu1.html, login.html, etc.
@app.route('/<path:path>')
def servir_frontend(path):
    return send_from_directory(FRONTEND_DIR, path)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
