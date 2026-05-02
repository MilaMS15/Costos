import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

try:
    supabase = create_client(url, key)
    res = supabase.table("tablaproducto").select("*").limit(1).execute()
    print("SUCCESS")
    print(res.data)
except Exception as e:
    print("FAILURE")
    print(e)
