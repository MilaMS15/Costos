import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# --- SINGLETON DE CONEXIÓN ---
class SupabaseBrain:
    _instance = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._instance is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            cls._instance = create_client(url, key)
        return cls._instance

# --- CLASE BASE PARA TODAS LAS TABLAS (DRY) ---
class BaseService:
    def __init__(self, table_name: str):
        self.db = SupabaseBrain.get_client()
        self.table_name = table_name

    def listar_todo(self):
        return self.db.table(self.table_name).select("*").execute().data

    def obtener_por_id(self, col_id, valor):
        return self.db.table(self.table_name).select("*").eq(col_id, valor).execute().data

    def insertar(self, datos: dict):
        return self.db.table(self.table_name).insert(datos).execute().data

    def eliminar(self, col_id, valor):
        return self.db.table(self.table_name).delete().eq(col_id, valor).execute().data
    
    # database.py - dentro de class BaseService
    def actualizar(self, col_id, valor, datos: dict):
        """Actualiza un registro por su ID"""
        try:
            result = self.db.table(self.table_name).update(datos).eq(col_id, valor).execute()
            return result.data
        except Exception as e:
            print(f"Error actualizando {self.table_name}: {e}")
            raise
        

# database.py - AGREGAR AL FINAL DEL ARCHIVO

def migrar_agregar_imagenes():
    """Ejecutar una sola vez para agregar columnas de imagen"""
    db = SupabaseBrain.get_client()
    
    try:
        # Agregar columna imagen_url a tablamateriales
        db.table("tablamateriales").update({"imagen_url": ""}).eq("codigomaterial", 0).execute()
        print("✓ Columna imagen_url lista en materiales")
    except:
        print("⚠ Crear columna 'imagen_url' en tablamateriales manualmente")
    
    try:
        # Agregar columna imagen_url a tablaproducto
        db.table("tablaproducto").update({"imagen_url": ""}).eq("codigoproducto", 0).execute()
        print("✓ Columna imagen_url lista en productos")
    except:
        print("⚠ Crear columna 'imagen_url' en tablaproducto manualmente")
    