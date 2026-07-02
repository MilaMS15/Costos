/* =======================================================================
   FRONTEND/js/costeo_abc.js
   Módulo de Costeo ABC — Unik'a
   ======================================================================= */

// Usa la misma URL base que el resto de tus módulos (config.js)
const ABC_API = (window.CONFIG?.API_BASE_URL || 'http://localhost:5000');

let _data       = null;
let _chartComp  = null;
let _chartAct   = null;

const fmt  = n => 'S/ ' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmt4 = n => 'S/ ' + Number(n).toFixed(4);

/* ─── CARGA INICIAL ─────────────────────────────────────────────────── */
async function abcCargar(periodo = '2026-04') {
    try {
        const res  = await fetch(`${ABC_API}/api/abc/costeo?periodo=${periodo}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        _data = json.data;
        abcRender(_data);
    } catch (err) {
        console.error('ABC error:', err);
        const el = document.getElementById('execNarrative');
        if (el) el.innerHTML =
            `⚠️ No se pudo conectar con el backend.<br>
             Verificá que <code>register_abc_routes(app)</code> esté en <code>app.py</code>
             y que el servidor Flask esté corriendo.<br><small>${err.message}</small>`;
    }
}

/* ─── RENDER PRINCIPAL ──────────────────────────────────────────────── */
function abcRender(d) {
    const { cif_total, productos, actividades, ventas_totales, periodo, meta } = d;

    // Detectar mayor subcosteado (distorsión positiva) y mayor sobrecosteado
    const subcosteados  = productos.filter(p => p.porcentaje_distorsion >  8)
                                   .sort((a,b) => b.porcentaje_distorsion - a.porcentaje_distorsion);
    const sobrecostados = productos.filter(p => p.porcentaje_distorsion < -8)
                                   .sort((a,b) => a.porcentaje_distorsion - b.porcentaje_distorsion);
    const misallocated  = productos
        .filter(p => p.porcentaje_distorsion > 0)
        .reduce((s, p) => s + (p.cif_total_abc - p.cif_total_tradicional), 0);

    // ── KPIs ────────────────────────────────────────────────────────────
    abcSet('kpiTotalCIF',     fmt(cif_total));
    abcSet('kpiMisallocated', fmt(misallocated));

    if (subcosteados.length) {
        abcSet('kpiWorst',    subcosteados[0].producto);
        abcSet('kpiWorstSub', `Subcosteado +${subcosteados[0].porcentaje_distorsion.toFixed(0)}% — precio puede estar bajo su costo real`);
    }
    if (sobrecostados.length) {
        abcSet('kpiBest',    sobrecostados[0].producto);
        abcSet('kpiBestSub', `Sobrecosteado ${sobrecostados[0].porcentaje_distorsion.toFixed(0)}% — margen real es mejor de lo reportado`);
    }

    // ── Resumen ejecutivo (narrativo automático) ──────────────────────
    let narrative = `Del CIF total de ${fmt(cif_total)} del periodo ${periodo}, el método actual
        (prorrateo por ventas) está trasladando <b>${fmt(misallocated)}</b> hacia productos
        que en realidad consumen menos recursos de planta. `;
    if (subcosteados.length) {
        narrative += `<b>${subcosteados.map(p=>p.producto).join(', ')}</b>
            ${subcosteados.length>1?'tienen un costo real':'tiene un costo real'} de CIF
            hasta ${subcosteados[0].porcentaje_distorsion.toFixed(0)}% mayor al asignado hoy —
            venderlos al precio actual puede significar operar debajo del costo real. `;
    }
    if (sobrecostados.length) {
        narrative += `En el otro extremo, <b>${sobrecostados.map(p=>p.producto).join(', ')}</b>
            absorbe más CIF del que corresponde, ocultando margen real disponible.`;
    }
    abcHTML('execNarrative', narrative);

    abcHTML('execFindings', `
        <div class="finding"><div class="f-val">${fmt(cif_total)}</div>
            <div class="f-lbl">CIF total del periodo entre ${productos.length} líneas de producto</div></div>
        <div class="finding"><div class="f-val">${meta.total_horas_maquina} h</div>
            <div class="f-lbl">Horas-máquina reales calculadas de recetamanoobra</div></div>
        <div class="finding"><div class="f-val">${subcosteados.length > 0 ? subcosteados[0].producto : '—'}</div>
            <div class="f-lbl">Mayor riesgo de precio por debajo del costo real</div></div>
    `);

    // ── Tabla ejecutiva ──────────────────────────────────────────────
    abcHTML('tblEjecutiva', productos.map(p => {
        const sub  = p.porcentaje_distorsion >  8;
        const sobre= p.porcentaje_distorsion < -8;
        const pill = sub ? 'red' : sobre ? 'green' : 'blue';
        const txt  = sub ? 'Subcosteado' : sobre ? 'Sobrecosteado' : 'Equilibrado';
        const bar  = sub ? '#dc2626' : sobre ? '#16a34a' : '#94a3b8';
        return `<tr>
            <td><b>${p.producto}</b>
                <div class="bar-mini"><i style="width:${Math.min(Math.abs(p.porcentaje_distorsion),100)}%;background:${bar}"></i></div>
            </td>
            <td>${fmt4(p.cif_unitario_tradicional)}</td>
            <td>${fmt4(p.cif_unitario_abc)}</td>
            <td><span class="pill ${pill}">${p.porcentaje_distorsion>=0?'+':''}${p.porcentaje_distorsion.toFixed(1)}%</span></td>
            <td>${txt}</td>
        </tr>`;
    }).join(''));

    // ── Tabla detalle de actividades por producto ────────────────────
    abcHTML('tblDetalle', productos.map(p => {
        const rows = p.detalle_abc.map(d => `
            <tr class="det-row">
                <td colspan="1" style="padding-left:24px;color:#6b7280;font-size:11.5px">↳ ${d.actividad}</td>
                <td style="font-size:11.5px;color:#6b7280">${d.consumo.toLocaleString('es-PE')} ${d.driver.split(' ')[0]}</td>
                <td style="font-size:11.5px;color:#6b7280">S/ ${d.tasa}</td>
                <td style="font-size:11.5px;color:#6b7280">${fmt(d.monto)}</td>
                <td></td><td></td>
            </tr>`).join('');
        const sub  = p.porcentaje_distorsion >  8;
        const sobre= p.porcentaje_distorsion < -8;
        const pill = sub ? 'red' : sobre ? 'green' : 'blue';
        return `<tr>
            <td><b>${p.producto}</b></td>
            <td>${p.unidades.toLocaleString('es-PE')}</td>
            <td>—</td>
            <td>${fmt(p.cif_total_abc)}</td>
            <td>${fmt4(p.cif_unitario_abc)}</td>
            <td><span class="pill ${pill}">${p.porcentaje_distorsion>=0?'+':''}${p.porcentaje_distorsion.toFixed(1)}%</span></td>
        </tr>${rows}`;
    }).join(''));

    // ── Plan de acción ───────────────────────────────────────────────
    const acciones = [];
    subcosteados.forEach(p => {
        const precioRef = p.ventas / p.unidades;
        const sugerido  = precioRef + p.diferencia_unitaria;
        acciones.push({ prio:'high',
            t: `Revisar precio de ${p.producto}`,
            n: `El CIF real por unidad es ${fmt(p.cif_unitario_abc)} vs ${fmt(p.cif_unitario_tradicional)} asignado hoy
                (diferencia: ${fmt(p.diferencia_unitaria)}/u). Para mantener el mismo margen el precio mínimo
                recomendado sube de ${fmt(precioRef)} a <b>${fmt(sugerido)}</b>.`
        });
    });
    sobrecostados.forEach(p => {
        acciones.push({ prio:'low',
            t: `${p.producto} tiene margen oculto`,
            n: `Se le asigna ${fmt(Math.abs(p.diferencia_unitaria))}/u más de CIF del que realmente consume.
                Su rentabilidad real es ${Math.abs(p.porcentaje_distorsion).toFixed(0)}% mejor de lo reportado —
                puede sostener una estrategia de precio más competitiva.`
        });
    });
    const actTop = [...actividades].sort((a,b) => b.costo - a.costo)[0];
    if (actTop) acciones.push({ prio:'med',
        t: `Foco de eficiencia: ${actTop.nombreactividad}`,
        n: `Con ${fmt(actTop.costo)} es la actividad de mayor costo (${(actTop.costo/cif_total*100).toFixed(0)}% del CIF total).
            Reducir su consumo por unidad impacta directamente en el costo de todos los productos.`
    });

    abcHTML('planAccion', acciones.map(a => `
        <div class="action">
            <div class="pr ${a.prio}">${a.prio==='high'?'!':a.prio==='med'?'~':'✓'}</div>
            <div><b>${a.t}</b><span class="note">${a.n}</span></div>
        </div>`).join(''));

    // ── Panel de supuestos ───────────────────────────────────────────
    abcHTML('tblActividades', actividades.map(a => `<tr>
        <td>${a.nombreactividad}</td>
        <td><span class="pill blue">${a.driver}</span></td>
        <td>${fmt(a.costo)}</td>
        <td><span style="font-size:11px;color:#6b7280">${a.cuentas_cif.join(', ')}</span></td>
    </tr>`).join(''));
    abcSet('totalActCost', fmt(cif_total));

    abcRenderCharts(productos, actividades);
}

/* ─── GRÁFICOS ──────────────────────────────────────────────────────── */
function abcRenderCharts(productos, actividades) {
    // Barras: Tradicional vs ABC
    const ctx1 = document.getElementById('chartComparacion');
    if (ctx1) {
        if (_chartComp) _chartComp.destroy();
        _chartComp = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: productos.map(p => p.producto.replace('_ST','')),
                datasets: [
                    { label:'CIF/u Tradicional (cotizador)', data: productos.map(p => +p.cif_unitario_tradicional.toFixed(4)), backgroundColor:'#94a3b8', borderRadius:5 },
                    { label:'CIF/u Real (ABC)',               data: productos.map(p => +p.cif_unitario_abc.toFixed(4)),        backgroundColor:'#f59e0b', borderRadius:5 },
                ]
            },
            options:{ responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{ position:'bottom', labels:{font:{size:11}} } },
                scales:{ x:{ticks:{font:{size:10}}}, y:{beginAtZero:true, ticks:{font:{size:10},
                    callback: v => 'S/ ' + v.toFixed(2) }} } }
        });
    }

    // Dona: estructura del CIF por actividad
    const ctx2 = document.getElementById('chartActividades');
    if (ctx2) {
        if (_chartAct) _chartAct.destroy();
        _chartAct = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: actividades.map(a => a.nombreactividad),
                datasets:[{ data: actividades.map(a => a.costo),
                            backgroundColor:['#f59e0b','#2563eb','#15803d'] }]
            },
            options:{ responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{ position:'bottom', labels:{font:{size:10},boxWidth:10} } } }
        });
    }
}

/* ─── HELPERS ───────────────────────────────────────────────────────── */
function abcSet(id, v)  { const e=document.getElementById(id); if(e) e.textContent=v; }
function abcHTML(id, v) { const e=document.getElementById(id); if(e) e.innerHTML=v;   }

/* ─── TOGGLE PANEL SUPUESTOS ────────────────────────────────────────── */
function abcSetupToggle() {
    const panel = document.getElementById('assumptionsPanel');
    const chev  = document.getElementById('chev');
    if (!panel) return;
    const toggle = () => { panel.classList.toggle('open'); chev?.classList.toggle('open'); };
    document.getElementById('toggleRow')?.addEventListener('click', toggle);
    document.getElementById('btnToggleAssumptions')?.addEventListener('click', () => {
        if (!panel.classList.contains('open')) toggle();
        panel.scrollIntoView({ behavior:'smooth', block:'center' });
    });
}

/* ─── INIT ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    abcSetupToggle();
    const genDate = document.getElementById('genDate');
    if (genDate) genDate.textContent = new Date().toLocaleDateString('es-PE',
        { year:'numeric', month:'long', day:'numeric' });

    // Selector de periodo (si existe en el HTML)
    const sel = document.getElementById('selectPeriodo');
    if (sel) sel.addEventListener('change', () => abcCargar(sel.value));

    abcCargar();
});
