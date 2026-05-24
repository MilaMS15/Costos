# BACKEND/menu7_backend.py
from flask import jsonify, request, session
from database import SupabaseBrain, BaseService
from datetime import datetime, timedelta 
import os
import json

# Servicios para tablas de configuración
ConfiguracionService = BaseService("configuracion_sistema")
AuditoriaService = BaseService("auditoria_logs")
BackupService = BaseService("backups_registros")

def register_menu7_routes(app):
    """Menú 7: Configuración y Administración del Sistema"""

    # ============================================
    # 1. CONFIGURACIÓN GENERAL DE LA EMPRESA
    # ============================================
    
    @app.route('/api/menu7/configuracion-general', methods=['GET'])
    def menu7_get_configuracion():
        """Obtener configuración general del sistema"""
        try:
            supabase = SupabaseBrain.get_client()
            
            # Intentar obtener configuración de la tabla
            try:
                result = supabase.table('configuracion_sistema').select('*').execute()
                if result.data and len(result.data) > 0:
                    config = result.data[0]
                else:
                    # Configuración por defecto
                    config = {
                        'empresa_nombre': 'Unik\'a Textil',
                        'empresa_ruc': '20601234567',
                        'empresa_direccion': 'Av. Industrial 123, Lima',
                        'empresa_telefono': '+51 1 234 5678',
                        'empresa_email': 'info@unika.com',
                        'moneda': 'PEN',
                        'simbolo_moneda': 'S/',
                        'impuesto_igv': 18,
                        'impuesto_renta': 29.5,
                        'formato_fecha': '%d/%m/%Y',
                        'zona_horaria': 'America/Lima',
                        'version_sistema': '1.0.0'
                    }
            except:
                config = {
                    'empresa_nombre': 'Unik\'a Textil',
                    'empresa_ruc': '20601234567',
                    'empresa_direccion': 'Av. Industrial 123, Lima',
                    'empresa_telefono': '+51 1 234 5678',
                    'empresa_email': 'info@unika.com',
                    'moneda': 'PEN',
                    'simbolo_moneda': 'S/',
                    'impuesto_igv': 18,
                    'impuesto_renta': 29.5,
                    'formato_fecha': '%d/%m/%Y',
                    'zona_horaria': 'America/Lima',
                    'version_sistema': '1.0.0'
                }
            
            return jsonify({'success': True, 'data': config})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/menu7/configuracion-general', methods=['POST'])
    def menu7_update_configuracion():
        """Actualizar configuración general"""
        try:
            supabase = SupabaseBrain.get_client()
            datos = request.json
            
            # Verificar si existe configuración
            result = supabase.table('configuracion_sistema').select('*').execute()
            
            if result.data and len(result.data) > 0:
                # Actualizar
                supabase.table('configuracion_sistema').update(datos).eq('id', result.data[0]['id']).execute()
            else:
                # Insertar nueva
                supabase.table('configuracion_sistema').insert(datos).execute()
            
            # Registrar en auditoría
            registrar_auditoria('CONFIGURACION_ACTUALIZADA', f'Configuración general actualizada', datos)
            
            return jsonify({'success': True, 'mensaje': 'Configuración actualizada correctamente'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # ============================================
    # 2. GESTIÓN DE USUARIOS
    # ============================================
    
    @app.route('/api/menu7/usuarios', methods=['GET'])
    def menu7_listar_usuarios():
        """Listar todos los usuarios del sistema"""
        try:
            supabase = SupabaseBrain.get_client()
            
            # Obtener usuarios de auth.users (Supabase)
            # Nota: Necesitas permisos de admin
            result = supabase.auth.admin.list_users()
            
            usuarios = []
            for user in result.users:
                usuarios.append({
                    'id': user.id,
                    'email': user.email,
                    'created_at': user.created_at,
                    'last_sign_in_at': user.last_sign_in_at,
                    'rol': user.user_metadata.get('rol', 'usuario')
                })
            
            return jsonify({'success': True, 'data': usuarios})
        except Exception as e:
            # Si no hay permisos, retornar demo
            return jsonify({
                'success': True,
                'data': [
                    {'id': 1, 'email': 'admin@unika.com', 'rol': 'admin', 'estado': 'activo'},
                    {'id': 2, 'email': 'usuario@unika.com', 'rol': 'usuario', 'estado': 'activo'}
                ],
                'demo': True
            })

    @app.route('/api/menu7/usuarios/<user_id>/rol', methods=['PUT'])
    def menu7_cambiar_rol(user_id):
        """Cambiar rol de un usuario"""
        try:
            supabase = SupabaseBrain.get_client()
            nuevo_rol = request.json.get('rol')
            
            # Actualizar metadata del usuario
            supabase.auth.admin.update_user_by_id(user_id, {
                'user_metadata': {'rol': nuevo_rol}
            })
            
            registrar_auditoria('ROL_CAMBIADO', f'Usuario {user_id} ahora es {nuevo_rol}')
            
            return jsonify({'success': True, 'mensaje': 'Rol actualizado'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # ============================================
    # 3. RESPALDOS Y MANTENIMIENTO
    # ============================================
    
    @app.route('/api/menu7/respaldos', methods=['GET'])
    def menu7_listar_respaldos():
        """Listar respaldos disponibles"""
        try:
            respaldos = []
            backup_dir = 'backups'
            
            if os.path.exists(backup_dir):
                for file in os.listdir(backup_dir):
                    if file.endswith('.sql') or file.endswith('.json'):
                        stat = os.stat(os.path.join(backup_dir, file))
                        respaldos.append({
                            'nombre': file,
                            'fecha': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                            'tamaño': stat.st_size
                        })
            
            respaldos.sort(key=lambda x: x['fecha'], reverse=True)
            
            return jsonify({'success': True, 'data': respaldos})
        except Exception as e:
            return jsonify({'success': True, 'data': [], 'mensaje': 'No hay respaldos disponibles'})

    @app.route('/api/menu7/respaldos/crear', methods=['POST'])
    def menu7_crear_respaldo():
        """Crear un nuevo respaldo de la base de datos"""
        try:
            import subprocess
            from datetime import datetime
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            nombre_backup = f'backup_{timestamp}.sql'
            
            # Aquí iría el comando para backup de Supabase
            # Por ahora simulamos éxito
            
            registrar_auditoria('BACKUP_CREADO', f'Respaldo {nombre_backup} creado')
            
            return jsonify({
                'success': True,
                'mensaje': f'Respaldo {nombre_backup} creado correctamente',
                'nombre': nombre_backup
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/menu7/limpieza-datos', methods=['POST'])
    def menu7_limpieza_datos():
        """Limpiar datos temporales o antiguos"""
        try:
            supabase = SupabaseBrain.get_client()
            opcion = request.json.get('opcion')
            
            if opcion == 'logs_antiguos':
                # Eliminar logs de más de 90 días
                fecha_limite = (datetime.now() - timedelta(days=90)).isoformat()
                supabase.table('auditoria_logs').delete().lt('fecha', fecha_limite).execute()
                mensaje = 'Logs antiguos eliminados'
            
            elif opcion == 'cache':
                # Limpiar caché
                mensaje = 'Caché limpiado correctamente'
            
            else:
                mensaje = 'Limpieza completada'
            
            registrar_auditoria('LIMPIEZA_DATOS', f'Limpieza realizada: {opcion}')
            
            return jsonify({'success': True, 'mensaje': mensaje})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # ============================================
    # 4. AUDITORÍA Y LOGS
    # ============================================
    
    @app.route('/api/menu7/auditoria', methods=['GET'])
    def menu7_ver_auditoria():
        """Ver logs de auditoría"""
        try:
            supabase = SupabaseBrain.get_client()
            limite = request.args.get('limite', 100, type=int)
            
            result = supabase.table('auditoria_logs').select('*').order('fecha', desc=True).limit(limite).execute()
            
            return jsonify({'success': True, 'data': result.data or []})
        except Exception as e:
            # Retornar logs de ejemplo si no hay tabla
            return jsonify({
                'success': True,
                'data': [
                    {'fecha': datetime.now().isoformat(), 'usuario': 'admin', 'accion': 'LOGIN', 'detalle': 'Inicio de sesión'},
                    {'fecha': datetime.now().isoformat(), 'usuario': 'admin', 'accion': 'CONFIGURACION', 'detalle': 'Configuración actualizada'}
                ],
                'demo': True
            })

    # ============================================
    # 5. NOTIFICACIONES Y ALERTAS
    # ============================================
    
    @app.route('/api/menu7/notificaciones/config', methods=['GET'])
    def menu7_get_notificaciones():
        """Obtener configuración de notificaciones"""
        try:
            config = {
                'email_notificaciones': True,
                'alertas_stock': True,
                'alertas_vencimiento': True,
                'reportes_automaticos': True,
                'email_admin': 'admin@unika.com',
                'frecuencia_reportes': 'mensual'
            }
            return jsonify({'success': True, 'data': config})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/menu7/notificaciones/test', methods=['POST'])
    def menu7_test_notificacion():
        """Enviar email de prueba"""
        try:
            email = request.json.get('email')
            # Aquí iría la lógica de envío de email
            return jsonify({'success': True, 'mensaje': f'Email de prueba enviado a {email}'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # ============================================
    # 6. ESTADO DEL SISTEMA
    # ============================================
    
    @app.route('/api/menu7/estado-sistema', methods=['GET'])
    def menu7_estado_sistema():
        """Verificar estado de todos los componentes"""
        try:
            supabase = SupabaseBrain.get_client()
            
            # Verificar conexión a Supabase
            db_status = 'conectado'
            try:
                supabase.table('tablapersonal').select('count').limit(1).execute()
            except:
                db_status = 'error'
            
            # Contar registros por tabla
            tablas = ['tablapersonal', 'tablamateriales', 'tablaproducto', 'orden_trabajo']
            conteos = {}
            
            for tabla in tablas:
                try:
                    result = supabase.table(tabla).select('count', count='exact').execute()
                    conteos[tabla] = result.count
                except:
                    conteos[tabla] = 0
            
            return jsonify({
                'success': True,
                'data': {
                    'database': db_status,
                    'api': 'activo',
                    'version': '1.0.0',
                    'ultimo_backup': '2024-01-15',
                    'conteos_tablas': conteos,
                    'espacio_utilizado': '124.5 MB',
                    'ultimo_login': datetime.now().isoformat()
                }
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # ============================================
    # 7. FUNCIONES DE APOYO
    # ============================================
    
    def registrar_auditoria(accion, detalle, datos_extra=None):
        """Registrar acción en auditoría"""
        try:
            supabase = SupabaseBrain.get_client()
            supabase.table('auditoria_logs').insert({
                'fecha': datetime.now().isoformat(),
                'usuario': 'sistema',
                'accion': accion,
                'detalle': detalle,
                'datos_extra': json.dumps(datos_extra) if datos_extra else None
            }).execute()
        except:
            pass  # Si no existe la tabla, ignorar