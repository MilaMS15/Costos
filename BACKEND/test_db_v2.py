import os
import time
from dotenv import load_dotenv
print("Loading dotenv...")
load_dotenv()

print("Importing supabase...")
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"URL: {url}")

try:
    print("Creating client...")
    start = time.time()
    supabase = create_client(url, key)
    print(f"Client created in {time.time() - start:.2f}s")
    
    print("Querying tablaproducto...")
    start = time.time()
    res = supabase.table("tablaproducto").select("*").limit(1).execute()
    print(f"Query finished in {time.time() - start:.2f}s")
    print("SUCCESS")
    print(res.data)
except Exception as e:
    print("FAILURE")
    print(e)
