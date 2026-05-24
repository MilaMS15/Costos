# BACKEND/menu6_backend.py
from flask import jsonify, request
from servicios import GAService, GVService
from database import SupabaseBrain
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import random

def register_menu6_routes(app):
    """Menú 6: Finanzas - Flujo de Caja, Tesorería y Proyecciones"""
    
    @app.route('/api/menu6/flujo-caja', methods=['GET'])
    def menu6_flujo_caja():
        """Obtener flujo de caja real y proyectado"""
        try:
            periodo = request.args.get('periodo', datetime.now().strftime("%Y-%m"))
            
            # Datos de ventas (demo - reemplazar con tabla real)
            VENTAS_DEMO = {
                "2026-01": {21001: (1200, 25.50), 21002: (800, 28.00), 21003: (950, 18.00)},
                "2026-02": {21001: (1400, 25.50), 21002: (750, 28.00), 21003: (1100, 18.00)},
                "2026-03": {21001: (1350, 26.00), 21002: (820, 28.50), 21003: (1050, 18.50)},
                "2026-04": {21001: (7000, 19.00), 21002: (6000, 21.00), 21003: (200, 23.00)},
                "2026-05": {21001: (6500, 19.00), 21002: (5800, 21.00), 21003: (250, 23.00)}
            }
            
            # Calcular ingresos del período
            ventas_mes = VENTAS_DEMO.get(periodo, {})
            ingresos_totales = sum(v[0] * v[1] for v in ventas_mes.values())
            
            # Calcular egresos (costos de producción + gastos fijos)
            # Costo de materiales (aproximado 50% de ventas)
            costo_materiales = ingresos_totales * 0.35
            
            # Mano de obra (aproximado 25% de ventas)
            costo_mod = ingresos_totales * 0.20
            
            # Gastos fijos (GA + GV)
            ga_data = GAService.listar_todo() or []
            gv_data = GVService.listar_todo() or []
            gastos_fijos = sum(float(g.get('monto', 0) or 0) for g in ga_data + gv_data)
            
            # Impuestos (18% sobre utilidad estimada)
            utilidad_estimada = ingresos_totales - (costo_materiales + costo_mod + gastos_fijos)
            impuestos = max(0, utilidad_estimada * 0.18)
            
            total_egresos = costo_materiales + costo_mod + gastos_fijos + impuestos
            
            # Flujo de caja del período
            flujo_caja_periodo = ingresos_totales - total_egresos
            
            # Saldo inicial (simulado)
            saldo_inicial = 50000  # S/ 50,000 en caja
            
            # Proyección a 3 meses
            proyecciones = []
            fecha_actual = datetime.strptime(periodo, "%Y-%m")
            
            for i in range(1, 4):
                fecha_prox = fecha_actual + relativedelta(months=i)
                periodo_prox = fecha_prox.strftime("%Y-%m")
                
                # Si no hay datos demo, estimar con crecimiento del 5%
                ventas_prox = VENTAS_DEMO.get(periodo_prox, {})
                if ventas_prox:
                    ingresos_prox = sum(v[0] * v[1] for v in ventas_prox.values())
                else:
                    ingresos_prox = ingresos_totales * (1 + (i * 0.05))
                
                egresos_prox = ingresos_prox * 0.65  # 65% de los ingresos son egresos
                flujo_prox = ingresos_prox - egresos_prox
                
                proyecciones.append({
                    'periodo': periodo_prox,
                    'nombre_mes': fecha_prox.strftime("%B %Y"),
                    'ingresos': round(ingresos_prox, 2),
                    'egresos': round(egresos_prox, 2),
                    'flujo_neto': round(flujo_prox, 2)
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'periodo_actual': periodo,
                    'saldo_inicial': round(saldo_inicial, 2),
                    'ingresos_periodo': round(ingresos_totales, 2),
                    'egresos_periodo': round(total_egresos, 2),
                    'flujo_caja_periodo': round(flujo_caja_periodo, 2),
                    'saldo_final': round(saldo_inicial + flujo_caja_periodo, 2),
                    'proyecciones': proyecciones,
                    'detalle_ingresos': {
                        'ventas_productos': round(ingresos_totales, 2),
                        'otros_ingresos': 0
                    },
                    'detalle_egresos': {
                        'materiales': round(costo_materiales, 2),
                        'mano_obra': round(costo_mod, 2),
                        'gastos_fijos': round(gastos_fijos, 2),
                        'impuestos': round(impuestos, 2)
                    }
                }
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu6/indicadores-financieros', methods=['GET'])
    def menu6_indicadores():
        """Calcular indicadores financieros clave"""
        try:
            # Datos base
            ga_data = GAService.listar_todo() or []
            gv_data = GVService.listar_todo() or []
            
            total_gastos_fijos = sum(float(g.get('monto', 0) or 0) for g in ga_data + gv_data)
            
            # Datos de ventas demo
            VENTAS_DEMO = {
                "2026-04": {21001: (7000, 19.00), 21002: (6000, 21.00), 21003: (200, 23.00)}
            }
            ventas_mes = VENTAS_DEMO.get("2026-04", {})
            ingresos_mensuales = sum(v[0] * v[1] for v in ventas_mes.values())
            
            # Calcular indicadores
            # Liquidez Corriente (simulado)
            activo_corriente = ingresos_mensuales * 1.5
            pasivo_corriente = ingresos_mensuales * 0.8
            liquidez_corriente = activo_corriente / pasivo_corriente if pasivo_corriente > 0 else 0
            
            # Prueba Ácida (sin inventarios)
            inventarios = ingresos_mensuales * 0.3
            prueba_acida = (activo_corriente - inventarios) / pasivo_corriente if pasivo_corriente > 0 else 0
            
            # Días de cobertura
            gasto_diario_promedio = total_gastos_fijos / 30 if total_gastos_fijos > 0 else 0
            dias_cobertura = activo_corriente / gasto_diario_promedio if gasto_diario_promedio > 0 else 0
            
            # Endeudamiento
            pasivo_total = ingresos_mensuales * 1.2
            patrimonio = ingresos_mensuales * 1.5
            endeudamiento = (pasivo_total / patrimonio * 100) if patrimonio > 0 else 0
            
            # EBITDA estimado
            utilidad_neta = ingresos_mensuales * 0.15
            intereses = ingresos_mensuales * 0.02
            impuestos = utilidad_neta * 0.18
            depreciacion = ingresos_mensuales * 0.05
            ebitda = utilidad_neta + intereses + impuestos + depreciacion
            
            # Ciclo de conversión de efectivo
            dias_inventario = 45  # días promedio en inventario
            dias_cobro = 30  # días para cobrar a clientes
            dias_pago = 15  # días para pagar a proveedores
            ciclo_efectivo = dias_inventario + dias_cobro - dias_pago
            
            return jsonify({
                'success': True,
                'data': {
                    'liquidez': {
                        'liquidez_corriente': round(liquidez_corriente, 2),
                        'prueba_acida': round(prueba_acida, 2),
                        'dias_cobertura': round(dias_cobertura, 0),
                        'rating': 'Saludable' if liquidez_corriente > 1.5 else 'Precario'
                    },
                    'endeudamiento': {
                        'ratio_endeudamiento': round(endeudamiento, 1),
                        'nivel': 'Moderado' if endeudamiento < 80 else 'Alto',
                        'recomendacion': 'Reducir deuda' if endeudamiento > 80 else 'Endeudamiento controlado'
                    },
                    'rentabilidad': {
                        'ebitda_mensual': round(ebitda, 2),
                        'margen_ebitda': round((ebitda / ingresos_mensuales * 100), 1) if ingresos_mensuales > 0 else 0,
                        'roa': round((utilidad_neta / activo_corriente * 100), 1) if activo_corriente > 0 else 0
                    },
                    'eficiencia': {
                        'ciclo_conversion_efectivo': ciclo_efectivo,
                        'dias_inventario': dias_inventario,
                        'dias_cobro': dias_cobro,
                        'dias_pago': dias_pago
                    }
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu6/alertas-financieras', methods=['GET'])
    def menu6_alertas():
        """Alertas tempranas financieras"""
        try:
            # Calcular indicadores para detectar alertas
            ga_data = GAService.listar_todo() or []
            gv_data = GVService.listar_todo() or []
            total_gastos_fijos = sum(float(g.get('monto', 0) or 0) for g in ga_data + gv_data)
            
            # Datos demo
            saldo_caja = 50000
            ingresos_promedio = 150000
            deuda_corta = 45000
            
            alertas = []
            
            # Alerta 1: Baja liquidez
            if saldo_caja < ingresos_promedio * 0.2:
                alertas.append({
                    'tipo': 'critical',
                    'titulo': '⚠️ Liquidez Baja',
                    'mensaje': f'Saldo en caja (S/ {saldo_caja:,.0f}) es menor al 20% de ingresos mensuales',
                    'accion': 'Gestionar cobranzas y reducir gastos inmediatos'
                })
            
            # Alerta 2: Alto gasto fijo
            pct_gastos_fijos = (total_gastos_fijos / ingresos_promedio * 100) if ingresos_promedio > 0 else 0
            if pct_gastos_fijos > 40:
                alertas.append({
                    'tipo': 'warning',
                    'titulo': '📊 Alta Estructura de Costos',
                    'mensaje': f'Gastos fijos representan {pct_gastos_fijos:.0f}% de los ingresos',
                    'accion': 'Revisar gastos administrativos y de ventas'
                })
            
            # Alerta 3: Vencimiento de deuda
            if deuda_corta > 0:
                alertas.append({
                    'tipo': 'info',
                    'titulo': '📅 Deuda por Vencer',
                    'mensaje': f'Próximo vencimiento de S/ {deuda_corta:,.0f} en los próximos 30 días',
                    'accion': 'Programar pago o renegociar condiciones'
                })
            
            # Alerta 4: Bajo margen de contribución
            if pct_gastos_fijos > 60:
                alertas.append({
                    'tipo': 'critical',
                    'titulo': '🚨 Riesgo de Quiebra Técnica',
                    'mensaje': 'El punto de equilibrio está muy por encima de las ventas actuales',
                    'accion': 'Revisar urgente estructura de precios y costos'
                })
            
            return jsonify({
                'success': True,
                'data': alertas,
                'resumen': {
                    'total_alertas': len(alertas),
                    'criticas': len([a for a in alertas if a['tipo'] == 'critical']),
                    'advertencias': len([a for a in alertas if a['tipo'] == 'warning'])
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/menu6/gastos-fijos', methods=['GET'])
    def menu6_gastos_fijos():
        """Obtener listado de gastos fijos (GA + GV)"""
        try:
            ga_data = GAService.listar_todo() or []
            gv_data = GVService.listar_todo() or []
            
            gastos = []
            for ga in ga_data:
                gastos.append({
                    'id': ga.get('codigoga'),
                    'tipo': 'Administrativo',
                    'nombre': ga.get('denominacion', 'Gasto Administrativo'),
                    'monto': float(ga.get('monto', 0) or 0)
                })
            
            for gv in gv_data:
                gastos.append({
                    'id': gv.get('codigogv'),
                    'tipo': 'Ventas',
                    'nombre': gv.get('denominacion', 'Gasto de Ventas'),
                    'monto': float(gv.get('monto', 0) or 0)
                })
            
            total = sum(g['monto'] for g in gastos)
            
            return jsonify({
                'success': True,
                'data': gastos,
                'total': round(total, 2)
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500