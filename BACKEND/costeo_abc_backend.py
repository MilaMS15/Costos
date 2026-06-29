"""
costeo_abc_backend.py
=======================================================================
Módulo de Costeo ABC (Activity Based Costing) para Unik'a.

Sigue el mismo patrón que menu1_backend.py ... menu7_backend.py:
expone endpoints REST que el frontend (js/costeo_abc.js) consume con
fetch(). La lógica de cálculo está separada en funciones.

CÓMO REGISTRARLO EN app.py
-----------------------------------------------------------------------
    from costeo_abc_backend import abc_bp
    app.register_blueprint(abc_bp)

IMPORTANTE
-----------------------------------------------------------------------
Este archivo usa SupabaseBrain.get_client() igual que app.py
"""

from flask import Blueprint, jsonify, request
from database import SupabaseBrain
import traceback

abc_bp = Blueprint('costeo_abc', __name__, url_prefix='/api/abc')


def get_supabase():
    """Obtener cliente de Supabase"""
    return SupabaseBrain.get_client()


# =======================================================================
# FUNCIONES DE CÁLCULO
# =======================================================================

def _obtener_actividades_con_costo(periodo):
    """Trae las actividades y suma el CIF del periodo que le corresponde a cada una."""
    supabase = get_supabase()
    
    try:
        actividades = supabase.table('tablaactividad').select('*').execute().data
    except Exception as e:
        print(f"❌ Error obteniendo actividades: {e}")
        actividades = []
    
    try:
        cif_periodo = (
            supabase.table('cif_mensual')
            .select('*')
            .eq('periodo', periodo)
            .execute().data
        )
    except Exception as e:
        print(f"❌ Error obteniendo cif_mensual para {periodo}: {e}")
        cif_periodo = []
    
    # Si no hay actividades, crear algunas de ejemplo
    if not actividades:
        print("⚠️ No se encontraron actividades. Usando datos de ejemplo.")
        actividades = [
            {'codigoactividad': 'ACT-01', 'nombreactividad': 'Mantenimiento', 'driver': 'Horas máquina'},
            {'codigoactividad': 'ACT-02', 'nombreactividad': 'Control de calidad', 'driver': 'Inspecciones'},
            {'codigoactividad': 'ACT-03', 'nombreactividad': 'Logística interna', 'driver': 'Movimientos'},
            {'codigoactividad': 'ACT-04', 'nombreactividad': 'Setup', 'driver': 'Cambios de lote'}
        ]
    
    for act in actividades:
        act['costo'] = sum(
            float(c.get('monto', 0) or 0) for c in cif_periodo
            if str(c.get('codigoactividad', '')) == str(act.get('codigoactividad', ''))
        )
    
    return actividades


def _obtener_consumo(periodo):
    """Obtener consumo de actividades por producto"""
    supabase = get_supabase()
    try:
        consumo = (
            supabase.table('tablaconsumoactividad')
            .select('*')
            .eq('periodo', periodo)
            .execute().data
        )
    except Exception as e:
        print(f"❌ Error obteniendo consumo: {e}")
        consumo = []
    
    return consumo


def _obtener_produccion(periodo):
    """Obtener producción del periodo"""
    supabase = get_supabase()
    try:
        produccion = (
            supabase.table('produccion_mensual')
            .select('*')
            .eq('periodo', periodo)
            .execute().data
        )
    except Exception as e:
        print(f"❌ Error obteniendo producción: {e}")
        produccion = []
    
    # Si no hay producción, crear datos de ejemplo
    if not produccion:
        print("⚠️ No se encontró producción. Usando datos de ejemplo.")
        produccion = [
            {'codigoproducto': 21001, 'unidadesproducidas': 1200, 'ventasestimadas': 30600},
            {'codigoproducto': 21002, 'unidadesproducidas': 800, 'ventasestimadas': 22400},
            {'codigoproducto': 21003, 'unidadesproducidas': 950, 'ventasestimadas': 17100},
            {'codigoproducto': 21004, 'unidadesproducidas': 400, 'ventasestimadas': 22000},
            {'codigoproducto': 21005, 'unidadesproducidas': 320, 'ventasestimadas': 15360}
        ]
    
    return produccion


def _obtener_productos():
    """Obtener nombres de productos desde tablaproducto"""
    supabase = get_supabase()
    try:
        productos = supabase.table('tablaproducto').select('codigoproducto, producto').execute().data
        return {p['codigoproducto']: p['producto'] for p in productos}
    except Exception as e:
        print(f"❌ Error obteniendo productos: {e}")
        return {}


def calcular_costeo_abc(periodo):
    """
    Calcula, para un periodo:
      - la tasa de costo indirecto de cada actividad
      - el CIF asignado a cada producto vía ABC (y su valor unitario)
      - el CIF asignado a cada producto vía el método tradicional
        (prorrateo por participación en ventas)
      - la diferencia y el % de distorsión entre ambos métodos
    """
    actividades = _obtener_actividades_con_costo(periodo)
    consumo = _obtener_consumo(periodo)
    produccion = _obtener_produccion(periodo)
    nombres_productos = _obtener_productos()
    
    # Calcular total de driver por actividad
    for act in actividades:
        total_driver = sum(
            float(c.get('cantidad', 0) or 0) for c in consumo
            if str(c.get('codigoactividad', '')) == str(act.get('codigoactividad', ''))
        )
        act['total_driver'] = total_driver
        act['tasa'] = (act['costo'] / total_driver) if total_driver > 0 else 0
    
    total_cif = sum(a['costo'] for a in actividades)
    total_ventas = sum(float(p.get('ventasestimadas', 0) or 0) for p in produccion) or 1
    
    productos = []
    for p in produccion:
        codigo = p.get('codigoproducto')
        nombre = nombres_productos.get(codigo, f'Producto #{codigo}')
        unidades = float(p.get('unidadesproducidas', 1) or 1)
        ventas = float(p.get('ventasestimadas', 0) or 0)
        
        asignado_abc = 0.0
        detalle = []
        
        for act in actividades:
            # Buscar consumo de esta actividad para este producto
            cant = 0.0
            for c in consumo:
                if (str(c.get('codigoactividad', '')) == str(act.get('codigoactividad', '')) and 
                    str(c.get('codigoproducto', '')) == str(codigo)):
                    cant = float(c.get('cantidad', 0) or 0)
                    break
            
            monto = cant * act['tasa']
            asignado_abc += monto
            detalle.append({
                'codigoactividad': act.get('codigoactividad'),
                'actividad': act.get('nombreactividad'),
                'driver': act.get('driver'),
                'cantidad_consumida': cant,
                'tasa': round(act['tasa'], 4),
                'monto_asignado': round(monto, 2),
            })
        
        unit_abc = asignado_abc / unidades if unidades > 0 else 0
        asignado_trad = total_cif * (ventas / total_ventas) if total_ventas > 0 else 0
        unit_trad = asignado_trad / unidades if unidades > 0 else 0
        dif = unit_abc - unit_trad
        pct_dif = (dif / unit_trad * 100) if unit_trad != 0 else 0
        
        productos.append({
            'codigoproducto': codigo,
            'producto': nombre,
            'unidades': unidades,
            'ventas': ventas,
            'cif_unitario_tradicional': round(unit_trad, 4),
            'cif_unitario_abc': round(unit_abc, 4),
            'cif_total_abc': round(asignado_abc, 2),
            'cif_total_tradicional': round(asignado_trad, 2),
            'diferencia_unitaria': round(dif, 4),
            'porcentaje_distorsion': round(pct_dif, 2),
            'detalle_actividades': detalle,
        })
    
    return {
        'periodo': periodo,
        'cif_total': round(total_cif, 2),
        'actividades': [
            {
                'codigoactividad': a.get('codigoactividad'),
                'nombreactividad': a.get('nombreactividad'),
                'driver': a.get('driver'),
                'costo': round(a.get('costo', 0), 2),
                'total_driver': a.get('total_driver', 0),
                'tasa': round(a.get('tasa', 0), 4),
            } for a in actividades
        ],
        'productos': productos,
    }


# =======================================================================
# ENDPOINTS
# =======================================================================

@abc_bp.route('/actividades', methods=['GET'])
def get_actividades():
    """GET /api/abc/actividades?periodo=2026-04"""
    periodo = request.args.get('periodo', '2026-04')
    try:
        data = _obtener_actividades_con_costo(periodo)
        return jsonify(data)
    except Exception as e:
        print(f"❌ Error en get_actividades: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@abc_bp.route('/consumo', methods=['GET'])
def get_consumo():
    """GET /api/abc/consumo?periodo=2026-04"""
    periodo = request.args.get('periodo', '2026-04')
    try:
        data = _obtener_consumo(periodo)
        return jsonify(data)
    except Exception as e:
        print(f"❌ Error en get_consumo: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@abc_bp.route('/consumo', methods=['PUT'])
def actualizar_consumo():
    """
    PUT /api/abc/consumo
    Body JSON:
      { "codigoactividad": "ACT-01", "codigoproducto": 21001,
        "periodo": "2026-04", "cantidad": 250 }

    Permite editar (o crear) el consumo de una actividad desde el
    panel "Editar supuestos" del dashboard.
    """
    supabase = get_supabase()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Se requiere body JSON'}), 400
    
    required = ['codigoactividad', 'codigoproducto', 'periodo']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Campo requerido: {field}'}), 400
    
    try:
        # Verificar si ya existe
        existente = (
            supabase.table('tablaconsumoactividad')
            .select('id')
            .eq('codigoactividad', data['codigoactividad'])
            .eq('codigoproducto', data['codigoproducto'])
            .eq('periodo', data['periodo'])
            .execute().data
        )
        
        if existente:
            # Actualizar existente
            result = supabase.table('tablaconsumoactividad').update(
                {'cantidad': data['cantidad']}
            ).eq('id', existente[0]['id']).execute()
            return jsonify({'ok': True, 'id': existente[0]['id'], 'updated': True})
        else:
            # Crear nuevo
            result = supabase.table('tablaconsumoactividad').insert(data).execute()
            return jsonify({'ok': True, 'id': result.data[0]['id'], 'created': True})
            
    except Exception as e:
        print(f"❌ Error en actualizar_consumo: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@abc_bp.route('/costeo', methods=['GET'])
def get_costeo():
    """
    GET /api/abc/costeo?periodo=2026-04
    Endpoint principal: devuelve todo lo que necesita el dashboard
    (actividades, tasas, asignación ABC, comparación tradicional).
    """
    periodo = request.args.get('periodo', '2026-04')
    try:
        print(f"🔄 Calculando Costeo ABC para periodo: {periodo}")
        result = calcular_costeo_abc(periodo)
        print(f"✅ Costeo ABC calculado: {len(result['productos'])} productos")
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error en get_costeo: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@abc_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint de salud para verificar que el módulo está funcionando"""
    return jsonify({
        'status': 'ok',
        'module': 'costeo_abc',
        'message': 'Módulo de Costeo ABC funcionando correctamente'
    })


# =======================================================================
# ENDPOINTS PARA CREAR DATOS DE PRUEBA (opcional)
# =======================================================================

@abc_bp.route('/seed/actividades', methods=['POST'])
def seed_actividades():
    """Crear actividades de ejemplo si no existen"""
    supabase = get_supabase()
    actividades = [
        {'codigoactividad': 'ACT-01', 'nombreactividad': 'Mantenimiento', 'driver': 'Horas máquina'},
        {'codigoactividad': 'ACT-02', 'nombreactividad': 'Control de calidad', 'driver': 'Inspecciones'},
        {'codigoactividad': 'ACT-03', 'nombreactividad': 'Logística interna', 'driver': 'Movimientos'},
        {'codigoactividad': 'ACT-04', 'nombreactividad': 'Setup', 'driver': 'Cambios de lote'}
    ]
    
    try:
        for act in actividades:
            # Verificar si ya existe
            existente = supabase.table('tablaactividad').select('*').eq('codigoactividad', act['codigoactividad']).execute()
            if not existente.data:
                supabase.table('tablaactividad').insert(act).execute()
                print(f"✅ Actividad creada: {act['codigoactividad']}")
        return jsonify({'ok': True, 'message': 'Actividades de ejemplo creadas'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@abc_bp.route('/seed/consumo', methods=['POST'])
def seed_consumo():
    """Crear consumo de ejemplo para un periodo"""
    supabase = get_supabase()
    periodo = request.args.get('periodo', '2026-04')
    
    # Datos de ejemplo de consumo por producto y actividad
    consumo_ejemplo = [
        # Producto 21001 - Polo Básico
        {'codigoactividad': 'ACT-01', 'codigoproducto': 21001, 'periodo': periodo, 'cantidad': 280},
        {'codigoactividad': 'ACT-02', 'codigoproducto': 21001, 'periodo': periodo, 'cantidad': 120},
        {'codigoactividad': 'ACT-03', 'codigoproducto': 21001, 'periodo': periodo, 'cantidad': 180},
        {'codigoactividad': 'ACT-04', 'codigoproducto': 21001, 'periodo': periodo, 'cantidad': 60},
        # Producto 21002 - Polo Estampado
        {'codigoactividad': 'ACT-01', 'codigoproducto': 21002, 'periodo': periodo, 'cantidad': 150},
        {'codigoactividad': 'ACT-02', 'codigoproducto': 21002, 'periodo': periodo, 'cantidad': 80},
        {'codigoactividad': 'ACT-03', 'codigoproducto': 21002, 'periodo': periodo, 'cantidad': 120},
        {'codigoactividad': 'ACT-04', 'codigoproducto': 21002, 'periodo': periodo, 'cantidad': 40},
        # Producto 21003 - Camiseta M/C
        {'codigoactividad': 'ACT-01', 'codigoproducto': 21003, 'periodo': periodo, 'cantidad': 120},
        {'codigoactividad': 'ACT-02', 'codigoproducto': 21003, 'periodo': periodo, 'cantidad': 40},
        {'codigoactividad': 'ACT-03', 'codigoproducto': 21003, 'periodo': periodo, 'cantidad': 90},
        {'codigoactividad': 'ACT-04', 'codigoproducto': 21003, 'periodo': periodo, 'cantidad': 30},
        # Producto 21004 - Chompa
        {'codigoactividad': 'ACT-01', 'codigoproducto': 21004, 'periodo': periodo, 'cantidad': 180},
        {'codigoactividad': 'ACT-02', 'codigoproducto': 21004, 'periodo': periodo, 'cantidad': 60},
        {'codigoactividad': 'ACT-03', 'codigoproducto': 21004, 'periodo': periodo, 'cantidad': 120},
        {'codigoactividad': 'ACT-04', 'codigoproducto': 21004, 'periodo': periodo, 'cantidad': 80},
        # Producto 21005 - Canguro
        {'codigoactividad': 'ACT-01', 'codigoproducto': 21005, 'periodo': periodo, 'cantidad': 110},
        {'codigoactividad': 'ACT-02', 'codigoproducto': 21005, 'periodo': periodo, 'cantidad': 20},
        {'codigoactividad': 'ACT-03', 'codigoproducto': 21005, 'periodo': periodo, 'cantidad': 50},
        {'codigoactividad': 'ACT-04', 'codigoproducto': 21005, 'periodo': periodo, 'cantidad': 30},
    ]
    
    try:
        for item in consumo_ejemplo:
            # Verificar si ya existe
            existente = supabase.table('tablaconsumoactividad').select('*').eq('codigoactividad', item['codigoactividad']).eq('codigoproducto', item['codigoproducto']).eq('periodo', item['periodo']).execute()
            if not existente.data:
                supabase.table('tablaconsumoactividad').insert(item).execute()
                print(f"✅ Consumo creado: {item['codigoactividad']} - {item['codigoproducto']}")
        return jsonify({'ok': True, 'message': f'Consumo de ejemplo creado para {periodo}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@abc_bp.route('/seed/produccion', methods=['POST'])
def seed_produccion():
    """Crear producción de ejemplo para un periodo"""
    supabase = get_supabase()
    periodo = request.args.get('periodo', '2026-04')
    
    produccion_ejemplo = [
        {'periodo': periodo, 'codigoproducto': 21001, 'unidadesproducidas': 1200, 'ventasestimadas': 30600},
        {'periodo': periodo, 'codigoproducto': 21002, 'unidadesproducidas': 800, 'ventasestimadas': 22400},
        {'periodo': periodo, 'codigoproducto': 21003, 'unidadesproducidas': 950, 'ventasestimadas': 17100},
        {'periodo': periodo, 'codigoproducto': 21004, 'unidadesproducidas': 400, 'ventasestimadas': 22000},
        {'periodo': periodo, 'codigoproducto': 21005, 'unidadesproducidas': 320, 'ventasestimadas': 15360},
    ]
    
    try:
        for item in produccion_ejemplo:
            existente = supabase.table('produccion_mensual').select('*').eq('periodo', item['periodo']).eq('codigoproducto', item['codigoproducto']).execute()
            if not existente.data:
                supabase.table('produccion_mensual').insert(item).execute()
                print(f"✅ Producción creada: {item['codigoproducto']} - {item['periodo']}")
        return jsonify({'ok': True, 'message': f'Producción de ejemplo creada para {periodo}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500