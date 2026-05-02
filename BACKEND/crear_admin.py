import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def crear_usuario_admin():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = create_client(url, key)

    email = "admin.principal@costos.com"
    password = "admin123456"

    try:
        # Intentar registrar al usuario
        # Nota: Esto enviará un correo de confirmación si está activado en Supabase
        res = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        print(f"Usuario {email} creado exitosamente.")
        print("IMPORTANTE: Revisa el correo para confirmar la cuenta si es necesario.")
    except Exception as e:
        print(f"Error al crear usuario: {e}")

if __name__ == "__main__":
    crear_usuario_admin()
