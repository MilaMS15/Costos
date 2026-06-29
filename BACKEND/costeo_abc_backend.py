"""
costeo_abc_backend.py
=======================================================================
Módulo de Costeo ABC (Activity Based Costing) para Unik'a.

Sigue el mismo patrón que menu1_backend.py ... menu7_backend.py:
expone endpoints REST que el frontend (js/costeo_abc.js) consume con
fetch(). La lógica de cálculo está separada en funciones (puedes
moverlas a servicios.py si prefieres mantener esa convención).

CÓMO REGISTRARLO EN app.py
-----------------------------------------------------------------------
    from costeo_abc_backend import abc_bp
    app.register_blueprint(abc_bp)

IMPORTANTE
-----------------------------------------------------------------------
Este archivo asume que tu database.py expone un cliente llamado
`supabase` (igual a lo que probablemente ya hacen tus otros
menuX_backend.py). Si tu cliente se llama distinto, ajusta el import
de la línea siguiente.
"""

from flask import Blueprint, jsonify, request
from database import supabase  # <-- ajusta si tu cliente tiene otro nombre

abc_bp = Blueprint('costeo_abc', __name__, url_prefix='/api/abc')


# =======================================================================
# FUNCIONES DE CÁLCULO
# =======================================================================

def _obtener_actividades_con_costo(periodo):
    """Trae las actividades y suma el CIF del periodo que le corresponde a cada una."""
    actividades = supabase.table('tablaactividad').select('*').execute().data
    cif_periodo = (
        supabase.table('cif_mensual')
        .select('*')
        .eq('periodo', periodo)
        .execute().data
    )
    for act in actividades:
        act['costo'] = sum(
            float(c['monto']) for c in cif_periodo
            if c.get('codigoactividad') == act['codigoactividad']
        )
    return actividades


def _obtener_consumo(periodo):
    return (
        supabase.table('tablaconsumoactividad')
        .select('*')
        .eq('periodo', periodo)
        .execute().data
    )


def _obtener_produccion(periodo):
    return (
        supabase.table('produccion_mensual')
        .select('*, tablaproducto(producto)')
        .eq('periodo', periodo)
        .execute().data
    )


def calcular_costeo_abc(periodo):
    """
    Calcula, para un periodo:
      - la tasa de costo indirecto de cada actividad
      - el CIF asignado a cada producto vía ABC (y su valor unitario)
      - el CIF asignado a cada producto vía el método tradicional
        (prorrateo por participación en ventas, igual al que ya usa
        tu módulo de Costos Industriales)
      - la diferencia y el % de distorsión entre ambos métodos
    """
    actividades = _obtener_actividades_con_costo(periodo)
    consumo = _obtener_consumo(periodo)
    produccion = _obtener_produccion(periodo)

    for act in actividades:
        total_driver = sum(
            float(c['cantidad']) for c in consumo
            if c['codigoactividad'] == act['codigoactividad']
        )
        act['total_driver'] = total_driver
        act['tasa'] = (act['costo'] / total_driver) if total_driver > 0 else 0

    total_cif = sum(a['costo'] for a in actividades)
    total_ventas = sum(float(p['ventasestimadas']) for p in produccion) or 1

    productos = []
    for p in produccion:
        codigo = p['codigoproducto']
        nombre = (p.get('tablaproducto') or {}).get('producto', str(codigo))
        unidades = float(p['unidadesproducidas']) or 1
        ventas = float(p['ventasestimadas'])

        asignado_abc = 0.0
        detalle = []
        for act in actividades:
            cant = next(
                (float(c['cantidad']) for c in consumo
                 if c['codigoactividad'] == act['codigoactividad']
                 and c['codigoproducto'] == codigo),
                0.0
            )
            monto = cant * act['tasa']
            asignado_abc += monto
            detalle.append({
                'codigoactividad': act['codigoactividad'],
                'actividad': act['nombreactividad'],
                'driver': act['driver'],
                'cantidad_consumida': cant,
                'tasa': round(act['tasa'], 4),
                'monto_asignado': round(monto, 2),
            })

        unit_abc = asignado_abc / unidades
        asignado_trad = total_cif * (ventas / total_ventas)
        unit_trad = asignado_trad / unidades
        dif = unit_abc - unit_trad
        pct_dif = (dif / unit_trad * 100) if unit_trad else 0

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
                'codigoactividad': a['codigoactividad'],
                'nombreactividad': a['nombreactividad'],
                'driver': a['driver'],
                'costo': round(a['costo'], 2),
                'total_driver': a['total_driver'],
                'tasa': round(a['tasa'], 4),
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
    return jsonify(_obtener_actividades_con_costo(periodo))


@abc_bp.route('/consumo', methods=['GET'])
def get_consumo():
    """GET /api/abc/consumo?periodo=2026-04"""
    periodo = request.args.get('periodo', '2026-04')
    return jsonify(_obtener_consumo(periodo))


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
    data = request.get_json()
    existente = (
        supabase.table('tablaconsumoactividad')
        .select('id')
        .eq('codigoactividad', data['codigoactividad'])
        .eq('codigoproducto', data['codigoproducto'])
        .eq('periodo', data['periodo'])
        .execute().data
    )
    if existente:
        supabase.table('tablaconsumoactividad').update(
            {'cantidad': data['cantidad']}
        ).eq('id', existente[0]['id']).execute()
        return jsonify({'ok': True, 'id': existente[0]['id']})
    else:
        result = supabase.table('tablaconsumoactividad').insert(data).execute()
        return jsonify({'ok': True, 'id': result.data[0]['id']})


@abc_bp.route('/costeo', methods=['GET'])
def get_costeo():
    """
    GET /api/abc/costeo?periodo=2026-04
    Endpoint principal: devuelve todo lo que necesita el dashboard
    (actividades, tasas, asignación ABC, comparación tradicional).
    """
    periodo = request.args.get('periodo', '2026-04')
    return jsonify(calcular_costeo_abc(periodo))
