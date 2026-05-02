// ============================================
// GRÁFICOS Y VISUALIZACIONES
// ============================================

// Gráfico de barras simple
function crearGraficoBarras(containerId, datos, color = '#2563eb') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const maxValor = Math.max(...datos.map(d => d.valor));
    
    container.className = 'bar-chart';
    container.innerHTML = datos.map(d => `
        <div class="bar-item">
            <div class="bar-value">${d.valor}</div>
            <div class="bar" style="
                height: ${(d.valor / maxValor) * 150}px;
                background: linear-gradient(to top, ${color}, ${color}88);
            " title="${d.label}: ${d.valor}"></div>
            <div class="bar-label">${d.label}</div>
        </div>
    `).join('');
}

// Gráfico de anillo (progreso)
function crearAnilloProgreso(containerId, porcentaje, color = '#2563eb', label = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const radio = 54;
    const circunferencia = 2 * Math.PI * radio;
    const offset = circunferencia - (porcentaje / 100) * circunferencia;
    
    container.innerHTML = `
        <div class="progress-ring">
            <svg width="120" height="120">
                <circle class="bg-circle" cx="60" cy="60" r="${radio}"></circle>
                <circle class="progress-circle" cx="60" cy="60" r="${radio}"
                    stroke="${color}"
                    stroke-dasharray="${circunferencia}"
                    stroke-dashoffset="${offset}">
                </circle>
            </svg>
            <div class="progress-text">
                <div class="value">${porcentaje}%</div>
                <div class="label">${label}</div>
            </div>
        </div>
    `;
}

// Timeline de producción
function crearTimeline(containerId, eventos) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const colores = ['production', 'materials', 'labor', 'shipping'];
    
    container.className = 'timeline';
    container.innerHTML = eventos.map((e, i) => `
        <div class="timeline-item">
            <div class="timeline-dot ${colores[i % colores.length]}">
                ${e.icono || '📌'}
            </div>
            <div class="timeline-content">
                <h4>${e.titulo}</h4>
                <p>${e.descripcion}</p>
                ${e.fecha ? `<small style="color: var(--gray-400);">${e.fecha}</small>` : ''}
            </div>
        </div>
    `).join('');
}

// Mini gráfico de línea (sparkline)
function crearSparkline(containerId, valores, color = '#2563eb') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const rango = max - min || 1;
    const ancho = 120;
    const alto = 40;
    
    const puntos = valores.map((v, i) => {
        const x = (i / (valores.length - 1)) * ancho;
        const y = alto - ((v - min) / rango) * alto;
        return `${x},${y}`;
    }).join(' ');
    
    container.innerHTML = `
        <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
            <polyline 
                points="${puntos}" 
                fill="none" 
                stroke="${color}" 
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
            </polyline>
            <circle cx="${(valores.length - 1) * (ancho / (valores.length - 1))}" 
                    cy="${alto - ((valores[valores.length - 1] - min) / rango) * alto}" 
                    r="3" fill="${color}">
            </circle>
        </svg>
    `;
}