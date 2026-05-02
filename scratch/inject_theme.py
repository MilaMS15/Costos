import os

directories = [
    r'c:\Users\Milagros\OneDrive\Desktop\ProyectoCostosHTML\FRONTEND',
    r'c:\Users\Milagros\OneDrive\Desktop\ProyectoCostosHTML\HTMILA'
]

css_tag = '<link rel="stylesheet" href="css/theme-dark.css">'
js_tag = '<script src="js/theme-manager.js"></script>'

for directory in directories:
    if not os.path.exists(directory):
        continue
        
    for filename in os.listdir(directory):
        if filename.endswith('.html'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Ajustar rutas si estamos en HTMILA pero los archivos están en FRONTEND/css y FRONTEND/js
            # Espera, ¿dónde están los archivos realmente?
            # Los puse en FRONTEND/css/theme-dark.css y FRONTEND/js/theme-manager.js
            # Si estoy en HTMILA/dashboard.html, necesito ir a ../FRONTEND/css/theme-dark.css
            
            current_css_tag = css_tag
            current_js_tag = js_tag
            
            if 'HTMILA' in directory:
                current_css_tag = '<link rel="stylesheet" href="../FRONTEND/css/theme-dark.css">'
                current_js_tag = '<script src="../FRONTEND/js/theme-manager.js"></script>'
            
            modified = False
            
            # Inject CSS in <head>
            if 'theme-dark.css' not in content:
                if '</head>' in content:
                    content = content.replace('</head>', f'    {current_css_tag}\n</head>')
                    modified = True
            
            # Inject JS before </body>
            if 'theme-manager.js' not in content:
                if '</body>' in content:
                    content = content.replace('</body>', f'    {current_js_tag}\n</body>')
                    modified = True
                elif '</html>' in content:
                    content = content.replace('</html>', f'    {current_js_tag}\n</html>')
                    modified = True
            
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
