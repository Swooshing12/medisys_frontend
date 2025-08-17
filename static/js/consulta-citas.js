// ===== CONSULTA CITAS JS =====

class ConsultaCitasSystem {
    constructor() {
        this.currentPage = 1;
        this.perPage = 20;
        this.currentFilters = {};
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        console.log('🔍 Iniciando sistema de consulta de citas...');
        
        this.setupEventListeners();
        this.loadInitialData();
        
        console.log('✅ Sistema de consulta de citas listo');
    }
    
    setupEventListeners() {
        // Filtros toggle
        const toggleFilters = document.getElementById('toggleFilters');
        if (toggleFilters) {
            toggleFilters.addEventListener('click', () => {
                this.toggleFilters();
            });
        }
        
        // Especialidad change -> cargar doctores
        const especialidadSelect = document.getElementById('especialidad');
        if (especialidadSelect) {
            especialidadSelect.addEventListener('change', (e) => {
                this.loadDoctoresByEspecialidad(e.target.value);
            });
        }
        
        // Botón buscar
        const btnBuscar = document.getElementById('btnBuscar');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => {
                this.buscarCitas();
            });
        }
        
        // Botón limpiar
        const btnLimpiar = document.getElementById('btnLimpiar');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                this.limpiarFiltros();
            });
        }
        
        // Botón exportar
        const btnExportar = document.getElementById('btnExportar');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => {
                this.exportarResultados();
            });
        }
        
        // Items per page
        const perPageSelect = document.getElementById('perPage');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                this.perPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.buscarCitas();
            });
        }
        
        // Validación de cédula en tiempo real
        const cedulaInput = document.getElementById('cedulaPaciente');
        if (cedulaInput) {
            cedulaInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) {
                    value = value.substring(0, 10);
                }
                e.target.value = value;
            });
        }
        
        // Enter key en filtros
        const filtrosForm = document.getElementById('filtrosForm');
        if (filtrosForm) {
            filtrosForm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.buscarCitas();
                }
            });
        }
    }
    
    toggleFilters() {
        const filtersContent = document.getElementById('filtersContent');
        const toggleBtn = document.getElementById('toggleFilters');
        const icon = toggleBtn.querySelector('i');
        const span = toggleBtn.querySelector('span');
        
        if (filtersContent.style.display === 'none') {
            filtersContent.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
            span.textContent = 'Ocultar Filtros';
        } else {
            filtersContent.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
            span.textContent = 'Mostrar Filtros';
        }
    }
    
    async loadInitialData() {
        console.log('📊 Cargando datos iniciales...');
        await this.buscarCitas();
    }
    
    async loadDoctoresByEspecialidad(especialidadId) {
        const doctorSelect = document.getElementById('doctor');
        
        if (!especialidadId) {
            doctorSelect.innerHTML = '<option value="">Todos los doctores</option>';
            doctorSelect.disabled = false;
            return;
        }
        
        try {
            doctorSelect.innerHTML = '<option value="">Cargando doctores...</option>';
            doctorSelect.disabled = true;
            
            const response = await fetch(`/dashboard/api/doctores-especialidad/${especialidadId}/`);
            const result = await response.json();
            
            if (result.success && result.doctores) {
                this.populateDoctoresSelect(result.doctores);
            } else {
                this.showError('Error cargando doctores: ' + (result.message || 'Error desconocido'));
                doctorSelect.innerHTML = '<option value="">Error cargando doctores</option>';
            }
        } catch (error) {
            console.error('Error loading doctores:', error);
            this.showError('Error de conexión al cargar doctores');
            doctorSelect.innerHTML = '<option value="">Error de conexión</option>';
        } finally {
            doctorSelect.disabled = false;
        }
    }
    
    populateDoctoresSelect(doctores) {
        const doctorSelect = document.getElementById('doctor');
        doctorSelect.innerHTML = '<option value="">Todos los doctores</option>';
        
        doctores.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id_doctor;
            option.textContent = `${doctor.nombre_completo} - ${doctor.titulo_profesional}`;
            doctorSelect.appendChild(option);
        });
    }
    
    getFiltersFromForm() {
        const form = document.getElementById('filtrosForm');
        const formData = new FormData(form);
        const filters = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                filters[key] = value.trim();
            }
        }
        
        // Agregar paginación
        filters.page = this.currentPage;
        filters.per_page = this.perPage;
        
        return filters;
    }
    
    async buscarCitas() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const filters = this.getFiltersFromForm();
            this.currentFilters = filters;
            
            console.log('🔍 Buscando citas con filtros:', filters);
            
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`/dashboard/api/citas/consulta-general/?${queryParams}`);
            const result = await response.json();
            
            if (result.success) {
                this.displayResults(result.data);
                this.updateStats(result.data.estadisticas);
                this.updateResultsCount(result.data.paginacion);
            } else {
                this.showError(result.message || 'Error en la búsqueda');
                this.showEmptyState();
            }
            
        } catch (error) {
            console.error('Error buscando citas:', error);
            this.showError('Error de conexión al buscar citas');
            this.showEmptyState();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    displayResults(data) {
        const citas = data.citas || [];
        const tbody = document.getElementById('citasTableBody');
        const resultsTable = document.getElementById('resultsTable');
        const emptyResults = document.getElementById('emptyResults');
        
        if (citas.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Mostrar tabla y ocultar empty state
        resultsTable.style.display = 'block';
        emptyResults.style.display = 'none';
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        // Llenar tabla
        citas.forEach(cita => {
            const row = this.createCitaRow(cita);
            tbody.appendChild(row);
        });
        
        // Actualizar paginación
        this.updatePagination(data.paginacion);
    }
    
    createCitaRow(cita) {
        const row = document.createElement('tr');
        row.className = 'cita-row';
        row.dataset.citaId = cita.id_cita;
        
        row.innerHTML = `
            <td>
                <div class="fecha-hora">
                    <div class="fecha">${this.formatDate(cita.fecha_hora)}</div>
                    <div class="hora">${this.formatTime(cita.fecha_hora)}</div>
                </div>
            </td>
            <td>
                <div class="paciente-info">
                    <div class="paciente-nombre">${cita.paciente.nombre_completo}</div>
                    <div class="paciente-cedula">CI: ${cita.paciente.cedula}</div>
                </div>
            </td>
            <td>
                <div class="doctor-info">
                    <div class="doctor-nombre">${cita.doctor.nombre_completo}</div>
                    <div class="doctor-titulo">${cita.doctor.titulo_profesional}</div>
                </div>
            </td>
            <td>
                <span class="badge bg-info">${cita.especialidad.nombre}</span>
            </td>
            <td>
                <div class="motivo">${this.truncateText(cita.motivo, 50)}</div>
            </td>
            <td>
                ${this.getEstadoBadge(cita.estado)}
            </td>
            <td>
                <div class="tc-indicators text-center">
                    <span class="badge ${cita.tiene_triaje ? 'bg-success' : 'bg-secondary'}" title="${cita.tiene_triaje ? 'Triaje realizado' : 'Sin triaje'}">
                        T
                    </span>
                    <span class="badge ${cita.tiene_consulta ? 'bg-success' : 'bg-secondary'}" title="${cita.tiene_consulta ? 'Consulta completada' : 'Sin consulta'}">
                        C
                    </span>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetalleCita(${cita.id_cita})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${cita.esta_completada ? `
                        <button class="btn btn-sm btn-outline-success" onclick="verConsulta(${cita.id_cita})" title="Ver consulta">
                            <i class="fas fa-file-medical"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        return row;
    }
    
    getEstadoBadge(estado) {
        const badges = {
            'Pendiente': '<span class="badge estado-pendiente"><i class="fas fa-clock"></i> Pendiente</span>',
            'Confirmada': '<span class="badge estado-confirmada"><i class="fas fa-calendar-check"></i> Confirmada</span>',
            'Completada': '<span class="badge estado-completada"><i class="fas fa-check-circle"></i> Completada</span>',
            'Cancelada': '<span class="badge estado-cancelada"><i class="fas fa-times-circle"></i> Cancelada</span>'
        };
        
        return badges[estado] || `<span class="badge bg-secondary">${estado || 'Sin estado'}</span>`;
    }
    
    updateStats(estadisticas) {
        if (!estadisticas) return;
        
        document.getElementById('statTotal').textContent = estadisticas.total_citas || 0;
        document.getElementById('statPendientes').textContent = estadisticas.pendientes || 0;
        document.getElementById('statConfirmadas').textContent = estadisticas.confirmadas || 0;
        document.getElementById('statCompletadas').textContent = estadisticas.completadas || 0;
    }
    
    updateResultsCount(paginacion) {
        if (!paginacion) return;
        
        const resultsCount = document.getElementById('resultsCount');
        const start = ((paginacion.pagina_actual - 1) * paginacion.per_page) + 1;
        const end = Math.min(start + paginacion.per_page - 1, paginacion.total);
        
        resultsCount.textContent = `Mostrando ${start}-${end} de ${paginacion.total} citas`;
    }
    
    updatePagination(paginacion) {
        const container = document.getElementById('paginationContainer');
        
        if (!paginacion || paginacion.total_paginas <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Botón anterior
        paginationHTML += `
            <li class="page-item ${!paginacion.tiene_anterior ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="consultaCitasSystem.goToPage(${paginacion.anterior_pagina || 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Páginas
        const startPage = Math.max(1, paginacion.pagina_actual - 2);
        const endPage = Math.min(paginacion.total_paginas, paginacion.pagina_actual + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === paginacion.pagina_actual ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="consultaCitasSystem.goToPage(${i})">${i}</a>
                </li>
            `;
        }
        
        // Botón siguiente
        paginationHTML += `
            <li class="page-item ${!paginacion.tiene_siguiente ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="consultaCitasSystem.goToPage(${paginacion.siguiente_pagina || paginacion.total_paginas})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        container.innerHTML = paginationHTML;
    }
    
    goToPage(page) {
        if (this.isLoading) return;
        
        this.currentPage = page;
        this.buscarCitas();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    limpiarFiltros() {
        const form = document.getElementById('filtrosForm');
        form.reset();
        
        // Limpiar doctores
        const doctorSelect = document.getElementById('doctor');
        doctorSelect.innerHTML = '<option value="">Todos los doctores</option>';
        doctorSelect.disabled = false;
        
        // Reset pagination
        this.currentPage = 1;
        
        // Buscar con filtros limpios
        this.buscarCitas();
        
        this.showSuccess('Filtros limpiados exitosamente');
    }
    
    exportarResultados() {
        Swal.fire({
            icon: 'info',
            title: 'Función en Desarrollo',
            text: 'La función de exportación estará disponible pronto',
            confirmButtonColor: '#007bff'
        });
    }
    
    showLoading() {
        document.getElementById('loadingResults').style.display = 'block';
        document.getElementById('resultsTable').style.display = 'none';
        document.getElementById('emptyResults').style.display = 'none';
    }
    
    hideLoading() {
        document.getElementById('loadingResults').style.display = 'none';
    }
    
    showEmptyState() {
        document.getElementById('loadingResults').style.display = 'none';
        document.getElementById('resultsTable').style.display = 'none';
        document.getElementById('emptyResults').style.display = 'block';
        
        // Limpiar stats
        this.updateStats({
            total_citas: 0,
            pendientes: 0,
            confirmadas: 0,
            completadas: 0
        });
    }
    
    // Utility functions
    formatDate(dateTimeString) {
        if (!dateTimeString) return 'Sin fecha';
        
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }
    
    formatTime(dateTimeString) {
        if (!dateTimeString) return '--:--';
        
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '--:--';
        }
    }
    
    truncateText(text, maxLength) {
        if (!text) return 'No especificado';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    showSuccess(message) {
        if (window.Swal) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: message,
                timer: 3000,
                showConfirmButton: false
            });
        }
    }
    
    showError(message) {
        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
                confirmButtonColor: '#dc3545'
            });
        } else {
            alert('Error: ' + message);
        }
    }
}

// Funciones globales para los botones de acción
async function verDetalleCita(idCita) {
   console.log('👁️ Ver detalle cita:', idCita);
   
   try {
       showLoadingOverlay();
       
       const response = await fetch(`/dashboard/api/detalle-cita/${idCita}/`);
       const result = await response.json();
       
       hideLoadingOverlay();
       
       if (result.success && result.detalle) {
           mostrarModalDetalle(result.detalle);
       } else {
           Swal.fire({
               icon: 'error',
               title: 'Error',
               text: result.message || 'No se pudo cargar el detalle de la cita',
               confirmButtonColor: '#dc3545'
           });
       }
   } catch (error) {
       hideLoadingOverlay();
       console.error('Error loading cita detail:', error);
       Swal.fire({
           icon: 'error',
           title: 'Error de Conexión',
           text: 'No se pudo conectar con el servidor',
           confirmButtonColor: '#dc3545'
       });
   }
}

function verConsulta(idCita) {
   console.log('📄 Ver consulta médica:', idCita);
   verDetalleCita(idCita);
}

function mostrarModalDetalle(detalle) {
    const cita = detalle.cita || {};
    const paciente = detalle.paciente || {};
    const doctor = detalle.doctor || {};
    const sucursal = detalle.sucursal || {};
    const triaje = detalle.triaje || null;
    const consulta = detalle.consulta_medica || null;
    
    let modalContent = `
        <div class="modal fade modal-detalle" id="modalDetalleCita" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content border-0 shadow">
                    <!-- ✅ HEADER MEJORADO -->
                    <div class="modal-header text-white border-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div class="d-flex align-items-center">
                            <div class="modal-icon me-3">
                                <i class="fas fa-file-medical-alt fa-2x"></i>
                            </div>
                            <div>
                                <h5 class="modal-title mb-0 fw-bold">Detalle de Cita Médica</h5>
                                <small class="opacity-75">ID: ${cita.id_cita || 'N/A'} • ${formatDateTime(cita.fecha_hora)}</small>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body p-0">
                        <!-- ✅ RESUMEN RÁPIDO EN CARDS -->
                        <div class="quick-summary bg-light p-4 border-bottom">
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <div class="summary-card text-center">
                                        <div class="summary-icon bg-primary text-white rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; line-height: 50px;">
                                            <i class="fas fa-calendar-alt"></i>
                                        </div>
                                        <div class="summary-label small text-muted">FECHA</div>
                                        <div class="summary-value fw-bold text-dark">${formatDate(cita.fecha_hora)}</div>
                                        <div class="summary-extra small text-muted">${formatTime(cita.fecha_hora)}</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="summary-card text-center">
                                        <div class="summary-icon bg-success text-white rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; line-height: 50px;">
                                            <i class="fas fa-user-md"></i>
                                        </div>
                                        <div class="summary-label small text-muted">DOCTOR</div>
                                        <div class="summary-value fw-bold text-dark">${doctor.nombres || ''} ${doctor.apellidos || ''}</div>
                                        <div class="summary-extra small text-muted">${doctor.especialidad || 'Especialidad'}</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="summary-card text-center">
                                        <div class="summary-icon bg-info text-white rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; line-height: 50px;">
                                            <i class="fas fa-hospital"></i>
                                        </div>
                                        <div class="summary-label small text-muted">SUCURSAL</div>
                                        <div class="summary-value fw-bold text-dark">${sucursal.nombre || 'No especificado'}</div>
                                        <div class="summary-extra small text-muted">${cita.modalidad_cita || 'Presencial'}</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="summary-card text-center">
                                        <div class="summary-icon ${getEstadoColorBg(cita.estado)} text-white rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; line-height: 50px;">
                                            ${getEstadoIcon(cita.estado)}
                                        </div>
                                        <div class="summary-label small text-muted">ESTADO</div>
                                        <div class="summary-value fw-bold text-dark">${cita.estado || 'Sin estado'}</div>
                                        <div class="summary-extra small text-muted">${cita.tipo_cita || 'Consulta'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ✅ CONTENIDO PRINCIPAL EN TABS -->
                        <div class="p-4">
                            <ul class="nav nav-pills nav-fill mb-4" id="detalleTab" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="cita-tab" data-bs-toggle="pill" data-bs-target="#cita-content" type="button">
                                        <i class="fas fa-calendar-check me-2"></i>Información de la Cita
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="paciente-tab" data-bs-toggle="pill" data-bs-target="#paciente-content" type="button">
                                        <i class="fas fa-user me-2"></i>Paciente
                                    </button>
                                </li>
                                ${triaje ? `
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="triaje-tab" data-bs-toggle="pill" data-bs-target="#triaje-content" type="button">
                                            <i class="fas fa-clipboard-check me-2"></i>Triaje
                                        </button>
                                    </li>
                                ` : ''}
                                ${consulta ? `
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="consulta-tab" data-bs-toggle="pill" data-bs-target="#consulta-content" type="button">
                                            <i class="fas fa-file-medical me-2"></i>Consulta Médica
                                        </button>
                                    </li>
                                ` : ''}
                            </ul>

                            <!-- ✅ CONTENIDO DE TABS -->
                            <div class="tab-content" id="detalleTabContent">
                                <!-- TAB: INFORMACIÓN DE LA CITA -->
                                <div class="tab-pane fade show active" id="cita-content">
                                    <div class="row g-4">
                                        <div class="col-md-6">
                                            <div class="info-card h-100">
                                                <h6 class="info-card-title text-dark"><i class="fas fa-info-circle text-primary me-2"></i>Detalles de la Cita</h6>
                                                <div class="info-grid">
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Fecha y Hora:</span>
                                                        <span class="info-value text-dark fw-bold">${formatDateTime(cita.fecha_hora)}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Estado:</span>
                                                        <span class="badge ${getEstadoBadgeClass(cita.estado)}">${cita.estado}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Modalidad:</span>
                                                        <span class="info-value text-dark">${cita.modalidad_cita || 'Presencial'}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Tipo:</span>
                                                        <span class="info-value text-dark">${cita.tipo_cita || 'Consulta'}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Creada:</span>
                                                        <span class="info-value text-dark">${formatDateTime(cita.fecha_creacion)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="info-card h-100">
                                                <h6 class="info-card-title text-dark"><i class="fas fa-user-md text-success me-2"></i>Médico y Ubicación</h6>
                                                <div class="info-grid">
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Doctor:</span>
                                                        <span class="info-value fw-bold text-dark">${doctor.nombres} ${doctor.apellidos}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Título:</span>
                                                        <span class="info-value text-dark">${doctor.titulo_profesional}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Especialidad:</span>
                                                        <span class="badge bg-primary">${doctor.especialidad}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Sucursal:</span>
                                                        <span class="info-value text-dark">${sucursal.nombre}</span>
                                                    </div>
                                                    <div class="info-item">
                                                        <span class="info-label text-muted">Dirección:</span>
                                                        <span class="info-value small text-dark">${sucursal.direccion}</span>
                                                    </div>
                                                    ${sucursal.telefono ? `
                                                        <div class="info-item">
                                                            <span class="info-label text-muted">Teléfono:</span>
                                                            <span class="info-value text-dark">${sucursal.telefono}</span>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="info-card">
                                                <h6 class="info-card-title text-dark"><i class="fas fa-stethoscope text-info me-2"></i>Motivo de la Consulta</h6>
                                                <div class="motivo-consulta p-3 bg-light rounded text-dark">
                                                    ${cita.motivo || 'No especificado'}
                                                </div>
                                                ${cita.notas ? `
                                                    <div class="mt-3">
                                                        <h6 class="small text-muted mb-2">Notas Adicionales:</h6>
                                                        <div class="notas p-3 bg-warning bg-opacity-10 rounded text-dark">
                                                            ${cita.notas}
                                                        </div>
                                                    </div>
                                                ` : ''}
                                                ${cita.enlace_virtual ? `
                                                    <div class="mt-3">
                                                        <h6 class="small text-muted mb-2">Enlace Virtual:</h6>
                                                        <a href="${cita.enlace_virtual}" target="_blank" class="btn btn-info">
                                                            <i class="fas fa-video me-2"></i>Acceder a la consulta virtual
                                                        </a>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- TAB: PACIENTE -->
                                <div class="tab-pane fade" id="paciente-content">
                                    <div class="row g-4">
                                        <div class="col-md-4">
                                            <div class="patient-profile text-center">
                                                <div class="patient-avatar mx-auto mb-3" style="width: 100px; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                                    <i class="fas fa-user text-white fa-3x"></i>
                                                </div>
                                                <h5 class="fw-bold text-dark">${paciente.nombres} ${paciente.apellidos}</h5>
                                                <p class="text-muted mb-2">CI: ${paciente.cedula}</p>
                                                <span class="badge bg-secondary">${paciente.edad || 0} años</span>
                                            </div>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="info-card">
                                                <h6 class="info-card-title text-dark"><i class="fas fa-id-card text-info me-2"></i>Información Personal</h6>
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <div class="info-grid">
                                                            <div class="info-item">
                                                                <span class="info-label text-muted">Fecha de Nacimiento:</span>
                                                                <span class="info-value text-dark">${formatDate(paciente.fecha_nacimiento)}</span>
                                                            </div>
                                                            <div class="info-item">
                                                                <span class="info-label text-muted">Sexo:</span>
                                                                <span class="info-value text-dark">${paciente.sexo || 'No especificado'}</span>
                                                            </div>
                                                            <div class="info-item">
                                                                <span class="info-label text-muted">Tipo de Sangre:</span>
                                                                <span class="badge bg-danger">${paciente.tipo_sangre || 'No especificado'}</span>
                                                            </div>
                                                            <div class="info-item">
                                                                <span class="info-label text-muted">Teléfono:</span>
                                                                <span class="info-value text-dark">${paciente.telefono || 'No especificado'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        ${paciente.contacto_emergencia ? `
                                                            <div class="emergency-contact bg-danger bg-opacity-10 p-3 rounded">
                                                                <h6 class="text-danger small mb-2"><i class="fas fa-phone-alt me-1"></i>Contacto de Emergencia</h6>
                                                                <div class="fw-bold text-dark">${paciente.contacto_emergencia}</div>
                                                                <div class="small text-dark">${paciente.telefono_emergencia || ''}</div>
                                                            </div>
                                                        ` : ''}
                                                        ${paciente.numero_seguro ? `
                                                            <div class="mt-2">
                                                                <strong class="text-muted">Número de Seguro:</strong>
                                                                <div class="text-dark">${paciente.numero_seguro}</div>
                                                            </div>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                                ${paciente.alergias ? `
                                                    <div class="mt-3">
                                                        <div class="alert alert-warning">
                                                            <h6 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Alergias Conocidas</h6>
                                                            <p class="mb-0">${paciente.alergias}</p>
                                                        </div>
                                                    </div>
                                                ` : ''}
                                                ${paciente.antecedentes_medicos ? `
                                                    <div class="mt-3">
                                                        <div class="alert alert-info">
                                                            <h6 class="alert-heading"><i class="fas fa-file-medical me-2"></i>Antecedentes Médicos</h6>
                                                            <p class="mb-0">${paciente.antecedentes_medicos}</p>
                                                        </div>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- TAB: TRIAJE -->
                                ${triaje ? `
                                    <div class="tab-pane fade" id="triaje-content">
                                        <div class="row g-4">
                                            <div class="col-12">
                                                <div class="info-card">
                                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                                        <h6 class="info-card-title mb-0 text-dark"><i class="fas fa-clipboard-check text-warning me-2"></i>Evaluación de Triaje</h6>
                                                        ${triaje.nivel_urgencia ? `
                                                            <span class="badge ${getUrgencyBadgeClass(triaje.nivel_urgencia)} fs-6">
                                                                ${triaje.nivel_urgencia}
                                                            </span>
                                                        ` : ''}
                                                    </div>
                                                    <div class="row g-3">
                                                        ${generateSignosVitales(triaje.signos_vitales)}
                                                    </div>
                                                    ${triaje.observaciones ? `
                                                        <div class="mt-4">
                                                            <h6 class="small text-muted mb-2">Observaciones del Triaje:</h6>
                                                            <div class="observaciones-triaje p-3 bg-light rounded text-dark">
                                                                ${triaje.observaciones}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- TAB: CONSULTA MÉDICA -->
                                ${consulta ? `
                                    <div class="tab-pane fade" id="consulta-content">
                                        <div class="row g-4">
                                            <div class="col-12">
                                                <div class="info-card">
                                                    <h6 class="info-card-title text-dark"><i class="fas fa-file-medical-alt text-success me-2"></i>Consulta Médica Completada</h6>
                                                    
                                                    ${consulta.motivo_consulta ? `
                                                        <div class="consulta-section mb-4">
                                                            <h6 class="section-title text-dark">🩺 Motivo de Consulta</h6>
                                                            <div class="section-content text-dark">${consulta.motivo_consulta}</div>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${consulta.sintomatologia ? `
                                                        <div class="consulta-section mb-4">
                                                            <h6 class="section-title text-dark">🤒 Sintomatología</h6>
                                                            <div class="section-content text-dark">
                                                                <i class="fas fa-thermometer-half text-warning me-2"></i>
                                                                ${consulta.sintomatologia}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${consulta.diagnostico ? `
                                                        <div class="consulta-section mb-4">
                                                            <h6 class="section-title text-danger">🔬 Diagnóstico</h6>
                                                            <div class="section-content fw-bold text-dark">
                                                                <i class="fas fa-diagnoses text-danger me-2"></i>
                                                                ${consulta.diagnostico}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${consulta.tratamiento ? `
                                                        <div class="consulta-section mb-4">
                                                            <h6 class="section-title text-primary">💊 Tratamiento Prescrito</h6>
                                                            <div class="section-content text-dark">
                                                                <i class="fas fa-pills text-primary me-2"></i>
                                                                ${consulta.tratamiento}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${consulta.observaciones ? `
                                                        <div class="consulta-section mb-4">
                                                            <h6 class="section-title text-dark">📋 Observaciones Médicas</h6>
                                                            <div class="section-content text-dark">
                                                                <i class="fas fa-clipboard-list text-info me-2"></i>
                                                                ${consulta.observaciones}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${consulta.fecha_seguimiento ? `
                                                        <div class="next-appointment mt-4 p-3 bg-warning bg-opacity-10 rounded">
                                                            <div class="d-flex align-items-center">
                                                                <i class="fas fa-calendar-plus fa-2x text-warning me-3"></i>
                                                                <div>
                                                                    <h6 class="mb-1 text-dark">Próximo Seguimiento</h6>
                                                                    <div class="fw-bold text-dark">${formatDate(consulta.fecha_seguimiento)}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- ✅ FOOTER MEJORADO -->
                    <div class="modal-footer bg-light border-0">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cerrar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="imprimirDetalle()">
                            <i class="fas fa-print me-2"></i>Imprimir
                        </button>
                    
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente
    const existingModal = document.getElementById('modalDetalleCita');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleCita'));
    modal.show();
    
    // Limpiar modal al cerrar
    document.getElementById('modalDetalleCita').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// ✅ FUNCIONES AUXILIARES CORREGIDAS
function getEstadoColorBg(estado) {
    const colores = {
        'Completada': 'bg-success',
        'Pendiente': 'bg-warning', 
        'Confirmada': 'bg-info',
        'Cancelada': 'bg-danger'
    };
    return colores[estado] || 'bg-secondary';
}

function getEstadoBadgeClass(estado) {
    const clases = {
        'Completada': 'bg-success',
        'Pendiente': 'bg-warning text-dark',
        'Confirmada': 'bg-info',
        'Cancelada': 'bg-danger'
    };
    return clases[estado] || 'bg-secondary';
}
function getEstadoIcon(estado) {
    switch (estado?.toLowerCase()) {
        case 'completada': return '<i class="fas fa-check-circle"></i>';
        case 'pendiente': return '<i class="fas fa-clock"></i>';
        case 'cancelada': return '<i class="fas fa-times-circle"></i>';
        case 'confirmada': return '<i class="fas fa-calendar-check"></i>';
        default: return '<i class="fas fa-question-circle"></i>';
    }
}
function getUrgencyBadgeClass(nivel) {
    const clases = {
        'Alta': 'bg-danger',
        'Media': 'bg-warning text-dark',
        'Baja': 'bg-success'
    };
    return clases[nivel] || 'bg-secondary';
}

function generateSignosVitales(signos) {
    if (!signos) return '';
    
    const vitales = [
        { key: 'peso', label: 'Peso', unit: 'kg', icon: 'weight', color: 'info' },
        { key: 'altura', label: 'Altura', unit: 'cm', icon: 'ruler-vertical', color: 'primary' },
        { key: 'imc', label: 'IMC', unit: '', icon: 'calculator', color: 'success' },
        { key: 'presion_arterial', label: 'Presión', unit: '', icon: 'heartbeat', color: 'danger' },
        { key: 'temperatura', label: 'Temperatura', unit: '°C', icon: 'thermometer-half', color: 'warning' },
        { key: 'frecuencia_cardiaca', label: 'Freq. Cardíaca', unit: 'bpm', icon: 'heart', color: 'secondary' }
    ];
    
    return vitales.map(vital => {
        if (signos[vital.key]) {
            return `
                <div class="col-md-4">
                    <div class="vital-card text-center p-3 border rounded">
                        <div class="vital-icon text-${vital.color} mb-2">
                            <i class="fas fa-${vital.icon} fa-2x"></i>
                        </div>
                        <div class="vital-value h4 mb-1 text-dark">${signos[vital.key]}${vital.unit}</div>
                        <div class="vital-label small text-muted">${vital.label}</div>
                    </div>
                </div>
            `;
        }
        return '';
    }).join('');
}

function formatTime(dateTimeString) {
    if (!dateTimeString) return '--:--';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
// Funciones auxiliares
function formatDateTime(dateTimeString) {
   if (!dateTimeString) return 'No especificado';
   
   try {
       const date = new Date(dateTimeString);
       return date.toLocaleDateString('es-ES', {
           year: 'numeric',
           month: 'long',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
       });
   } catch (error) {
       return 'Fecha inválida';
   }
}

function formatDate(dateString) {
   if (!dateString) return 'No especificado';
   
   try {
       const date = new Date(dateString);
       return date.toLocaleDateString('es-ES', {
           year: 'numeric',
           month: 'long',
           day: 'numeric'
       });
   } catch (error) {
       return 'Fecha inválida';
   }
}

function getEstadoBadgeForModal(estado) {
   const badges = {
       'Pendiente': '<span class="badge bg-warning text-dark fs-6"><i class="fas fa-clock"></i> Pendiente</span>',
       'Confirmada': '<span class="badge bg-info fs-6"><i class="fas fa-calendar-check"></i> Confirmada</span>',
       'Completada': '<span class="badge bg-success fs-6"><i class="fas fa-check-circle"></i> Completada</span>',
       'Cancelada': '<span class="badge bg-danger fs-6"><i class="fas fa-times-circle"></i> Cancelada</span>'
   };
   
   return badges[estado] || `<span class="badge bg-secondary fs-6">${estado || 'Sin estado'}</span>`;
}

function getUrgencyColor(nivel) {
   const nivelNum = parseInt(nivel);
   if (nivelNum >= 4) return 'danger';
   if (nivelNum >= 3) return 'warning';
   if (nivelNum >= 2) return 'info';
   return 'success';
}

function showLoadingOverlay() {
   const overlay = document.createElement('div');
   overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
   overlay.style.backgroundColor = 'rgba(255,255,255,0.9)';
   overlay.style.zIndex = '9999';
   overlay.id = 'loadingOverlay';
   overlay.innerHTML = '<div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>';
   document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
   const overlay = document.getElementById('loadingOverlay');
   if (overlay) {
       overlay.remove();
   }
}

function imprimirDetalle() {
   window.print();
}

function descargarReceta() {
   Swal.fire({
       icon: 'info',
       title: 'Función en Desarrollo',
       text: 'La descarga de receta médica estará disponible pronto',
       confirmButtonColor: '#007bff'
   });
}

// Initialize cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
   console.log('🚀 Iniciando sistema de consulta de citas...');
   window.consultaCitasSystem = new ConsultaCitasSystem();
});