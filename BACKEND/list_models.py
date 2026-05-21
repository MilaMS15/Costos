# list_models.py
import requests

API_KEY = "AIzaSyBpvGvcmefxf7Zjm42ABSIRq44izp2J67A"

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

response = requests.get(url)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    models = response.json()
    print("Modelos disponibles:")
    for model in models.get('models', []):
        name = model.get('name', '')
        supported_methods = model.get('supportedGenerationMethods', [])
        if 'generateContent' in supported_methods:
            print(f"  ✅ {name}")
        else:
            print(f"  ❌ {name}")
else:
    print(f"Error: {response.text}")