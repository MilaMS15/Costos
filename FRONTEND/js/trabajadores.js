/**
 * SISTEMA DE GESTIÓN DE MANO DE OBRA DIRECTA (MOD) - TEXTILCOST
 * Desarrollado para la gestión automatizada de costos laborales.
 * Operaciones matemáticas delegadas a la base de datos (Supabase Trigger).
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 🏛️ 1. DECLARACIÓN DE VARIABLES GLOBALES Y ELEMENTOS DEL DOM
    // =========================================================================
    const trabajadorForm = document.getElementById('trabajadorForm');
    const trabajadoresTableBody = document.getElementById('trabajadoresTableBody');
    const searchInput = document.getElementById('searchInput');
    const filterPuesto = document.getElementById('filterPuesto');
    const filterTipo = document.getElementById('filterTipo');
    
    // Elementos de resumen estadístico en el Dashboard superior
    const totalTrabajadoresEl = document.getElementById('totalTrabajadores');
    const costoPlanillaTotalEl = document.getElementById('costoPlanillaTotal');
    const promedioProductividadEl = document.getElementById('promedioProductividad');
    const totalMinutosAsignadosEl = document.getElementById('totalMinutosAsignados');

    // Instancia del Modal de Bootstrap para creación/edición
    const trabajadorModalEl = document.getElementById('trabajadorModal');
    let trabajadorModal = null;
    if (trabajadorModalEl) {
        trabajadorModal = new bootstrap.Modal(trabajadorModalEl);
    }

    // Array en memoria para almacenar los trabajadores y permitir filtrado rápido
    let trabajadoresMasterList = [];

    // Cargar la base de datos de trabajadores al iniciar la página
    loadTrabajadores();

    // =========================================================================
    // 💳 2. EVENTOS DEL FORMULARIO Y CONTROLADORES DE ACCIÓN
    // =========================================================================
    
    // Escuchador del envío del formulario (Crear o Editar)
    if (trabajadorForm) {
        trabajadorForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validar campos del formulario antes de procesar el JSON
            if (!validateForm()) {
                return;
            }

            const id = document.getElementById('trabajadorId').value;
            const action = id ? 'editar' : 'crear';
            const submitBtn = trabajadorForm.querySelector('button[type="submit"]');

            // Bloquear botón para evitar doble envío (Anti-bounce)
            if (submitBtn) submitBtn.disabled = true;

            // Construcción del objeto JSON con datos numéricos puros (Sin toFixed en el cliente)
            const trabajadorData = {
                puestotrabajo: document.getElementById('puestotrabajo').value,
                tipotrabajo: document.getElementById('tipotrabajo').value,
                productividad: parseFloat(document.getElementById('productividad').value) || 0.0,
                tiempototal_min: parseInt(document.getElementById('tiempototal_min').value) || 0,
                apellidosnombres: document.getElementById('apellidosnombres').value.trim(),
                sueldobasico: parseFloat(document.getElementById('sueldobasico').value) || 0.0,
                bonificacion: parseFloat(document.getElementById('bonificacion').value) || 0.0,
                asigfamiliar: parseFloat(document.getElementById('asigfamiliar').value) || 0.0,
                proveedr: document.getElementById('proveedr').value.trim() || 'PROPIO'
            };

            try {
                let response;
                if (action === 'crear') {
                    response = await fetch('/api/trabajadores', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(trabajadorData)
                    });
                } else {
                    response = await fetch(`/api/trabajadores/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(trabajadorData)
                    });
                }

                const result = await response.json();

                if (result.success) {
                    showNotification(
                        action === 'crear' ? 'Trabajador registrado correctamente.' : 'Datos actualizados en la base de datos.',
                        'success'
                    );
                    resetTrabajadorForm();
                    if (trabajadorModal) trabajadorModal.hide();
                    loadTrabajadores();
                } else {
                    showNotification('Error en la base de datos: ' + result.error, 'danger');
                }
            } catch (error) {
                console.error('Error crítico al comunicar con la API:', error);
                showNotification('Error de red no controlado al intentar guardar.', 'danger');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Formatear automáticamente los inputs numéricos cuando el usuario pierde el foco (blur)
    const numericInputs = ['sueldobasico', 'bonificacion', 'asigfamiliar', 'productividad'];
    numericInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    e.target.value = val.toFixed(2);
                }
            });
        }
    });

    // =========================================================================
    // 🧵 3. FUNCIONES DE CARGA Y PROCESAMIENTO ASÍNCRONO (API FETCH)
    // =========================================================================
    
    // Cargar y listar los trabajadores desde el Backend de Flask
    async function loadTrabajadores() {
        showTableLoading(true);
        try {
            const response = await fetch('/api/trabajadores');
            const result = await response.json();

            if (result.success) {
                // Respaldamos la lista completa en memoria para búsquedas en tiempo real
                trabajadoresMasterList = result.data || [];
                renderTrabajadoresTable(trabajadoresMasterList);
                calculateDashboardMetrics(trabajadoresMasterList);
            } else {
                showNotification('No se pudo estructurar el listado: ' + result.error, 'warning');
            }
        } catch (error) {
            console.error('Error al realizar fetch en /api/trabajadores:', error);
            showNotification('Error de conexión con el servidor de costos.', 'danger');
        } finally {
            showTableLoading(false);
        }
    }

    // =========================================================================
    // 🧮 4. RENDERIZADO DINÁMICO DE LA TABLA Y DASHBOARD (SOLUCIÓN)
    // =========================================================================
    
    // Construir el cuerpo de la tabla aplicando los filtros activos
    function renderTrabajadoresTable(data) {
        if (!trabajadoresTableBody) return;
        trabajadoresTableBody.innerHTML = '';

        if (data.length === 0) {
            trabajadoresTableBody.innerHTML = `
                <tr>
                    <td colspan="17" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open mr-2"></i>No se encontraron registros de personal en el sistema.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(trabajador => {
            const tr = document.createElement('tr');

            // EXTRACCIÓN DIRECTA DESDE SUPABASE (Evitamos operaciones matemáticas redundantes en JS)
            const sueldoBasico = parseFloat(trabajador.sueldobasico) || 0.0;
            const bonificacion = parseFloat(trabajador.bonificacion) || 0.0;
            const asigFamiliar = parseFloat(trabajador.asigfamiliar) || 0.0;
            const gratificacionJulio = parseFloat(trabajador.gratificacionjulio) || 0.0;
            const gratificacionDiciembre = parseFloat(trabajador.gratificaciondiciembre) || 0.0;
            const cts = parseFloat(trabajador.cts) || 0.0;
            const sueldoBruto = parseFloat(trabajador.sueldo) || 0.0;
            const essalud = parseFloat(trabajador.essalud) || 0.0;
            const sueldoTotal = parseFloat(trabajador.sueldototal) || 0.0;

            // Renderizamos los valores exactos calculados por el Trigger SQL
            tr.innerHTML = `
                <td><code>${trabajador.codigo_trabajador || trabajador.id || 'N/A'}</code></td>
                <td><strong>${trabajador.apellidosnombres || 'Sin nombre'}</strong></td>
                <td><span class="badge badge-light text-dark border">${trabajador.puestotrabajo || ''}</span></td>
                <td><span class="badge badge-secondary">${trabajador.tipotrabajo || ''}</span></td>
                <td class="text-center text-info font-weight-bold">${trabajador.productividad || '0.00'}</td>
                <td class="text-center">${trabajador.tiempototal_min || 0} min</td>
                <td>S/. ${sueldoBasico.toFixed(2)}</td>
                <td>S/. ${bonificacion.toFixed(2)}</td>
                <td>S/. ${asigFamiliar.toFixed(2)}</td>
                <td>S/. ${gratificacionJulio.toFixed(2)}</td>
                <td>S/. ${gratificacionDiciembre.toFixed(2)}</td>
                <td>S/. ${cts.toFixed(2)}</td>
                <td class="font-weight-bold text-primary bg-light">S/. ${sueldoBruto.toFixed(2)}</td>
                <td>S/. ${essalud.toFixed(2)}</td>
                <td class="font-weight-bold text-white bg-success">S/. ${sueldoTotal.toFixed(2)}</td>
                <td><small class="text-muted">${trabajador.proveedr || 'PROPIO'}</small></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-warning btn-edit" title="Editar ficha de costos">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-delete" title="Dar de baja en planilla">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            // Asignación de manejadores de eventos con Scope de objeto directo
            tr.querySelector('.btn-edit').addEventListener('click', () => prepareEditForm(trabajador));
            tr.querySelector('.btn-delete').addEventListener('click', () => executeDeleteTrabajador(trabajador.codigo_trabajador || trabajador.id));

            trabajadoresTableBody.appendChild(tr);
        });
    }

    // Calcular y renderizar las tarjetas métricas en el Dashboard superior
    function calculateDashboardMetrics(data) {
        if (!totalTrabajadoresEl || !costoPlanillaTotalEl || !promedioProductividadEl || !totalMinutosAsignadosEl) return;

        const count = data.length;
        if (count === 0) {
            totalTrabajadoresEl.textContent = '0';
            costoPlanillaTotalEl.textContent = 'S/. 0.00';
            promedioProductividadEl.textContent = '0.00%';
            totalMinutosAsignadosEl.textContent = '0 min';
            return;
        }

        let sumaPlanillaTotal = 0.0;
        let sumaProductividad = 0.0;
        let sumaMinutos = 0;

        data.forEach(t => {
            sumaPlanillaTotal += parseFloat(t.sueldototal) || 0.0;
            sumaProductividad += parseFloat(t.productividad) || 0.0;
            sumaMinutos += parseInt(t.tiempototal_min) || 0;
        });

        const promedioProd = sumaProductividad / count;

        // Actualizar indicadores visuales
        totalTrabajadoresEl.textContent = count.toString();
        costoPlanillaTotalEl.textContent = `S/. ${sumaPlanillaTotal.toFixed(2)}`;
        promedioProductividadEl.textContent = `${(promedioProd * 100).toFixed(0)}%`;
        totalMinutosAsignadosEl.textContent = `${sumaMinutos} min`;
    }

    // =========================================================================
    // 🛠️ 5. EDICIÓN, ELIMINACIÓN Y GESTIÓN DE INTERFAZ MODAL
    // =========================================================================
    
    // Cargar los datos de la fila dentro del formulario y abrir el modal
    function prepareEditForm(trabajador) {
        if (!trabajadorForm) return;

        document.getElementById('trabajadorId').value = trabajador.codigo_trabajador || trabajador.id;
        document.getElementById('puestotrabajo').value = trabajador.puestotrabajo || '';
        document.getElementById('tipotrabajo').value = trabajador.tipotrabajo || '';
        document.getElementById('productividad').value = (parseFloat(trabajador.productividad) || 0.0).toFixed(2);
        document.getElementById('tiempototal_min').value = trabajador.tiempototal_min || 0;
        document.getElementById('apellidosnombres').value = trabajador.apellidosnombres || '';
        document.getElementById('sueldobasico').value = (parseFloat(trabajador.sueldobasico) || 0.0).toFixed(2);
        document.getElementById('bonificacion').value = (parseFloat(trabajador.bonificacion) || 0.0).toFixed(2);
        document.getElementById('asigfamiliar').value = (parseFloat(trabajador.asigfamiliar) || 0.0).toFixed(2);
        document.getElementById('proveedr').value = trabajador.proveedr || 'PROPIO';

        // Modificar el encabezado del modal y botón de acción
        const modalTitle = document.getElementById('trabajadorModalLabel');
        if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-user-edit mr-2 text-warning"></i>Editar Ficha Laboral`;
        
        const submitBtn = trabajadorForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.className = 'btn btn-warning';
            submitBtn.innerHTML = `<i class="fas fa-save mr-2"></i>Actualizar Datos`;
        }

        if (trabajadorModal) trabajadorModal.show();
    }

    // Eliminar un trabajador de la planilla
    async function executeDeleteTrabajador(id) {
        if (!id) return;
        
        if (confirm('🚨 ¿Está completamente seguro de dar de BAJA a este trabajador del sistema de costos?\nEsta acción alterará el cálculo del MOD unitario.')) {
            try {
                const response = await fetch(`/api/trabajadores/${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (result.success) {
                    showNotification('Trabajador removido de la planilla industrial.', 'success');
                    loadTrabajadores();
                } else {
                    showNotification('Error al eliminar registro: ' + result.error, 'danger');
                }
            } catch (error) {
                console.error('Error de red en la baja de trabajador:', error);
                showNotification('Error de comunicación al procesar la baja.', 'danger');
            }
        }
    }

    // =========================================================================
    // 🔍 6. BUSCADORES, FILTROS Y VALIDACIONES EN TIEMPO REAL
    // =========================================================================
    
    // Filtros combinados (Buscador general por Nombre + Puesto + Tipo de trabajo)
    function applyCombinedFilters() {
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const puestoValue = filterPuesto ? filterPuesto.value : '';
        const tipoValue = filterTipo ? filterTipo.value : '';

        const filteredList = trabajadoresMasterList.filter(t => {
            const matchesSearch = (t.apellidosnombres || '').toLowerCase().includes(searchText) || 
                                  (t.codigo_trabajador || '').toString().includes(searchText);
            const matchesPuesto = puestoValue === '' || t.puestotrabajo === puestoValue;
            const matchesTipo = tipoValue === '' || t.tipotrabajo === tipoValue;

            return matchesSearch && matchesPuesto && matchesTipo;
        });

        renderTrabajadoresTable(filteredList);
    }

    // Listeners para los inputs de búsqueda y filtros adaptativos
    if (searchInput) searchInput.addEventListener('input', applyCombinedFilters);
    if (filterPuesto) filterPuesto.addEventListener('change', applyCombinedFilters);
    if (filterTipo) filterTipo.addEventListener('change', applyCombinedFilters);

    // Limpieza e inicialización completa del formulario al cerrar el modal
    function resetTrabajadorForm() {
        if (!trabajadorForm) return;
        trabajadorForm.reset();
        document.getElementById('trabajadorId').value = '';

        const modalTitle = document.getElementById('trabajadorModalLabel');
        if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-user-plus mr-2 text-success"></i>Registrar Nuevo Trabajador`;

        const submitBtn = trabajadorForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.className = 'btn btn-success';
            submitBtn.innerHTML = `<i class="fas fa-plus mr-2"></i>Registrar Colaborador`;
        }
    }

    // Listener para resetear el formulario si el modal se cierra por cualquier vía
    if (trabajadorModalEl) {
        trabajadorModalEl.addEventListener('hidden.bs.modal', resetTrabajadorForm);
    }

    // Validaciones preventivas de negocio (Evitar registros basura)
    function validateForm() {
        const nombres = document.getElementById('apellidosnombres').value.trim();
        const sueldoBasico = parseFloat(document.getElementById('sueldobasico').value) || 0;
        const productividad = parseFloat(document.getElementById('productividad').value) || 0;

        if (nombres.length < 5) {
            alert('Por favor, ingrese el nombre completo del colaborador (mínimo 5 caracteres).');
            return false;
        }
        if (sueldoBasico <= 0) {
            alert('El Sueldo Básico ingresado debe ser una cantidad industrial mayor a S/. 0.00.');
            return false;
        }
        if (productividad < 0 || productividad > 2.0) {
            alert('El factor de productividad debe encontrarse en un rango lógico entre 0.00 y 2.00.');
            return false;
        }
        return true;
    }

    // Helper para mostrar un spinner de carga en la tabla HTML
    function showTableLoading(show) {
        if (!trabajadoresTableBody) return;
        if (show) {
            trabajadoresTableBody.innerHTML = `
                <tr>
                    <td colspan="17" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="sr-only">Sincronizando con Supabase ERP...</span>
                        </div>
                        <p class="text-muted mt-2 mb-0">Consultando base de datos laboral en tiempo real...</p>
                    </td>
                </tr>
            `;
        }
    }

    // Helper de notificaciones flotantes temporales de Bootstrap
    function showNotification(message, type = 'info') {
        const alertBox = document.createElement('div');
        alertBox.className = `alert alert-${type} alert-dismissible fade show`;
        alertBox.role = 'alert';
        alertBox.style.position = 'fixed';
        alertBox.style.top = '20px';
        alertBox.style.right = '20px';
        alertBox.style.zIndex = '9999';
        alertBox.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        alertBox.innerHTML = `
            ${type === 'success' ? '<i class="fas fa-check-circle mr-2"></i>' : '<i class="fas fa-exclamation-circle mr-2"></i>'}
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;

        document.body.appendChild(alertBox);

        // Auto-eliminar la notificación a los 4 segundos
        setTimeout(() => {
            $(alertBox).alert('close');
        }, 4000);
    }
});