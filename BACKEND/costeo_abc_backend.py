# BACKEND/costeo_abc_backend.py
"""
Módulo de Costeo ABC para Unik'a.

Usa exactamente los mismos servicios y datos que menu4_backend.py:
  - CIFService.listar_todo()       → tablacif  (mismo CIF total que el cotizador)
  - RecetaManoObraService          → recetamanoobra  (minutos reales)
  - RecetaProductoService          → recetaproducto  (ítems de MP)
  - VENTAS_DEMO                    → mismas unidades/precios que menu4

Así el "Tradicional" del ABC coincide EXACTAMENTE con el cotizador.

REGISTRAR EN app.py:
    from costeo_abc_backend import register_abc_routes
    register_abc_routes(app)
"""

from flask import jsonify, request
from servicios import (
    CIFService, RecetaManoObraService, RecetaProductoService, ProductoService
)

# ── Mismo dict que menu4_backend.py ──────────────────────────────────────────
VENTAS_DEMO = {
    "2026-01": {21001:(1200,25.50), 21002:(800,28.00),  21003:(950,18.00),
                21004:(400,55.00),  21005:(320,48.00)},
    "2026-02": {21001:(1400,25.50), 21002:(750,28.00),  21003:(1100,18.00),
                21004:(380,55.00),  21005:(410,48.00)},
    "2026-03": {21001:(1350,26.00), 21002:(820,28.50),  21003:(1050,18.50),
                21004:(420,56.00),  21005:(360,49.00)},
    "2026-04": {21001:(7000,19.00), 21002:(6000,21.00), 21003:(200,23.00),
                21004:(200,28.00),  21005:(200,25.00)},
}

# ── Agrupación de cuentas CIF en actividades ABC ─────────────────────────────
# Si ya corriste el SQL, esto coincide con tablacif.codigoactividad_abc.
# Lo dejamos aquí también para que el endpoint funcione aunque no hayas
# ejecutado el SQL todavía.
ACTIVIDAD_POR_CIF = {
    'CIF-001': 'ACT-01',   # Alquiler
    'CIF-002': 'ACT-01',   # Mantenimiento
    'CIF-003': 'ACT-01',   # Luz
    'CIF-004': 'ACT-01',   # Agua
    'CIF-005': 'ACT-02',   # Almaceneros
    'CIF-000': 'ACT-03',   # Otros
}

ACTIVIDADES_INFO = {
    'ACT-01': {'nombre': 'Operación y Mantenimiento de Planta', 'driver': 'Horas-máquina'},
    'ACT-02': {'nombre': 'Recepción y Almacenamiento',          'driver': 'Unidades producidas'},
    'ACT-03': {'nombre': 'Supervisión y Control de Calidad',    'driver': 'Ítems de receta × unidades'},
}


# ── Función principal de cálculo ─────────────────────────────────────────────

def _calcular_abc(periodo: str) -> dict:
    """
    Devuelve el costeo ABC completo para un periodo.
    Reproduce exactamente el método tradicional de menu4 y añade el ABC.
    """
    # 1. Datos base
    ventas_mes   = VENTAS_DEMO.get(periodo, {})
    cif_data     = CIFService.listar_todo()
    recetas_mo   = RecetaManoObraService.listar_todo()
    recetas_mp   = RecetaProductoService.listar_todo()
    productos_db = ProductoService.listar_todo()

    nombre_producto = {p['codigoproducto']: p['producto'] for p in productos_db}

    # 2. CIF total y por actividad (idéntico a menu4)
    cif_total = sum(float(c.get('monto', 0) or 0) for c in cif_data)

    costo_por_actividad = {'ACT-01': 0.0, 'ACT-02': 0.0, 'ACT-03': 0.0}
    for c in cif_data:
        act = ACTIVIDAD_POR_CIF.get(c.get('codigocif', ''), 'ACT-03')
        costo_por_actividad[act] += float(c.get('monto', 0) or 0)

    # 3. Ventas totales (idéntico a menu4)
    ventas_totales = sum(und * precio for und, precio in ventas_mes.values())

    # 4. Drivers por producto ─────────────────────────────────────────────────

    # ACT-01 driver: horas-máquina reales desde recetamanoobra
    #   = SUM(tiempotrabajo) por producto × unidades_producidas / 60
    min_por_prod: dict[int, float] = {}
    for r in recetas_mo:
        cod = r.get('codigoproducto')
        if cod in ventas_mes:
            min_por_prod[cod] = min_por_prod.get(cod, 0.0) + float(r.get('tiempotrabajo', 0) or 0)

    hm_por_prod = {
        cod: (min_por_prod.get(cod, 0.0) * und / 60)
        for cod, (und, _) in ventas_mes.items()
    }
    total_hm = sum(hm_por_prod.values()) or 1

    # ACT-02 driver: unidades producidas (carga de almaceneros)
    total_und = sum(und for und, _ in ventas_mes.values()) or 1

    # ACT-03 driver: ítems de receta MP × unidades
    #   (más ítems distintos = más supervisión de materiales)
    items_mp: dict[int, int] = {}
    for r in recetas_mp:
        cod = r.get('codigoproducto')
        if cod in ventas_mes:
            items_mp[cod] = items_mp.get(cod, 0) + 1

    items_ponderados = {
        cod: items_mp.get(cod, 1) * und
        for cod, (und, _) in ventas_mes.items()
    }
    total_items_pond = sum(items_ponderados.values()) or 1

    # 5. Tasas ABC
    tasa01 = costo_por_actividad['ACT-01'] / total_hm
    tasa02 = costo_por_actividad['ACT-02'] / total_und
    tasa03 = costo_por_actividad['ACT-03'] / total_items_pond

    # 6. Resultado por producto
    productos_resultado = []
    for cod, (und, precio) in ventas_mes.items():
        ventas_prod = und * precio

        # ── Tradicional (igual que menu4, línea 167-168) ──
        pct_ventas   = ventas_prod / ventas_totales
        cif_trad_tot = cif_total * pct_ventas
        cif_trad_uni = cif_trad_tot / und

        # ── ABC ──
        cif_act01 = hm_por_prod.get(cod, 0) * tasa01
        cif_act02 = und * tasa02
        cif_act03 = items_ponderados.get(cod, 0) * tasa03
        cif_abc_tot = cif_act01 + cif_act02 + cif_act03
        cif_abc_uni = cif_abc_tot / und

        dif_uni = cif_abc_uni - cif_trad_uni
        pct_dis = (dif_uni / cif_trad_uni * 100) if cif_trad_uni else 0

        productos_resultado.append({
            'codigoproducto':          cod,
            'producto':                nombre_producto.get(cod, str(cod)),
            'unidades':                und,
            'precio':                  precio,
            'ventas':                  round(ventas_prod, 2),
            # Tradicional
            'cif_total_tradicional':   round(cif_trad_tot, 2),
            'cif_unitario_tradicional':round(cif_trad_uni, 4),
            # ABC
            'cif_total_abc':           round(cif_abc_tot, 2),
            'cif_unitario_abc':        round(cif_abc_uni, 4),
            # Detalle por actividad
            'detalle_abc': [
                {'codigoactividad':'ACT-01',
                 'actividad': ACTIVIDADES_INFO['ACT-01']['nombre'],
                 'driver':    ACTIVIDADES_INFO['ACT-01']['driver'],
                 'consumo':   round(hm_por_prod.get(cod, 0), 3),
                 'tasa':      round(tasa01, 4),
                 'monto':     round(cif_act01, 2)},
                {'codigoactividad':'ACT-02',
                 'actividad': ACTIVIDADES_INFO['ACT-02']['nombre'],
                 'driver':    ACTIVIDADES_INFO['ACT-02']['driver'],
                 'consumo':   und,
                 'tasa':      round(tasa02, 6),
                 'monto':     round(cif_act02, 2)},
                {'codigoactividad':'ACT-03',
                 'actividad': ACTIVIDADES_INFO['ACT-03']['nombre'],
                 'driver':    ACTIVIDADES_INFO['ACT-03']['driver'],
                 'consumo':   items_ponderados.get(cod, 0),
                 'tasa':      round(tasa03, 6),
                 'monto':     round(cif_act03, 2)},
            ],
            # Diferencia
            'diferencia_unitaria':     round(dif_uni, 4),
            'porcentaje_distorsion':   round(pct_dis, 2),
        })

    # Ordenar para el frontend (mayor distorsión primero)
    productos_resultado.sort(key=lambda x: x['porcentaje_distorsion'], reverse=True)

    # 7. Actividades para el panel de supuestos
    actividades_out = []
    for act_id, info in ACTIVIDADES_INFO.items():
        actividades_out.append({
            'codigoactividad': act_id,
            'nombreactividad': info['nombre'],
            'driver':          info['driver'],
            'costo':           round(costo_por_actividad[act_id], 2),
            'cuentas_cif':     [k for k, v in ACTIVIDAD_POR_CIF.items() if v == act_id],
        })

    return {
        'periodo':     periodo,
        'cif_total':   round(cif_total, 2),
        'ventas_totales': round(ventas_totales, 2),
        'actividades': actividades_out,
        'productos':   productos_resultado,
        'meta': {
            'total_horas_maquina': round(total_hm, 2),
            'total_unidades':      total_und,
        }
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

def register_abc_routes(app):

    @app.route('/api/abc/costeo', methods=['GET'])
    def abc_costeo():
        """
        GET /api/abc/costeo?periodo=2026-04
        Devuelve el costeo ABC completo del periodo.
        """
        try:
            periodo = request.args.get('periodo', '2026-04')
            return jsonify({'success': True, 'data': _calcular_abc(periodo)})
        except Exception as e:
            import traceback; traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/abc/periodos', methods=['GET'])
    def abc_periodos():
        """GET /api/abc/periodos  →  mismos periodos que menu4"""
        return jsonify({'success': True, 'data': [
            {'value': '2026-01', 'label': 'Enero 2026'},
            {'value': '2026-02', 'label': 'Febrero 2026'},
            {'value': '2026-03', 'label': 'Marzo 2026'},
            {'value': '2026-04', 'label': 'Abril 2026'},
        ]})
