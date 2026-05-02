import requests
import json

URL = "http://127.0.0.1:5000/api/estado-resultados/2026-05"

try:
    print(f"Calling {URL}...")
    r = requests.get(URL, timeout=10)
    print(f"Status Code: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
