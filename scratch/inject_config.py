import os
import re

directories = [
    r'c:\Users\Milagros\OneDrive\Desktop\ProyectoCostosHTML\FRONTEND',
    r'c:\Users\Milagros\OneDrive\Desktop\ProyectoCostosHTML\HTMILA'
]

config_script = '<script src="js/config.js"></script>'

for directory in directories:
    if not os.path.exists(directory):
        continue
        
    for filename in os.listdir(directory):
        if filename.endswith('.html'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified = False
            
            # Replace local API_URL with nothing, we rely on config.js
            old_api_str = "const API_URL = 'http://localhost:5000/api';"
            if old_api_str in content:
                content = content.replace(old_api_str, "/* API_URL definido en js/config.js */")
                modified = True
            
            # Inject config.js in head
            current_config_script = config_script
            if 'HTMILA' in directory:
                current_config_script = '<script src="../FRONTEND/js/config.js"></script>'
                
            if current_config_script not in content:
                if '</head>' in content:
                    content = content.replace('</head>', f'    {current_config_script}\n</head>')
                    modified = True
            
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
