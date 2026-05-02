import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

tables = ["tablamateriales", "tablaproducto", "tablapersonal", "tablacif", "recetaproducto", "recetamanoobra"]

for t in tables:
    try:
        res = supabase.table(t).select("*", count="exact").limit(1).execute()
        print(f"Table {t}: {res.count} records")
    except Exception as e:
        print(f"Table {t}: ERROR - {e}")
