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
               <div class="modal-content">
                   <div class="modal-header bg-primary text-white">
                       <h5 class="modal-title">
                           <i class="fas fa-file-medical"></i>
                           Detalle Completo de Cita Médica - ID: ${cita.id_cita || 'N/A'}
                       </h5>
                       <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                   </div>
                   <div class="modal-body">
                       <div class="row">
                           <!-- COLUMNA IZQUIERDA -->
                           <div class="col-lg-8">
                               <!-- Información de la Cita -->
                               <div class="detail-section">
                                   <h6><i class="fas fa-calendar-check text-primary"></i> Información de la Cita</h6>
                                   <div class="row">
                                       <div class="col-md-6">
                                           <div class="detail-item">
                                               <strong>📅 Fecha y Hora:</strong>
                                               <span class="text-primary fw-bold">${formatDateTime(cita.fecha_hora)}</span>
                                           </div>
                                           <div class="detail-item">
                                               <strong>📋 Estado:</strong>
                                               ${getEstadoBadgeForModal(cita.estado)}
                                           </div>
                                       </div>
                                       <div class="col-md-6">
                                           <div class="detail-item">
                                               <strong>💻 Modalidad:</strong>
                                               <span class="badge ${cita.modalidad_cita === 'Virtual' ? 'bg-info' : 'bg-secondary'}">
                                                   <i class="fas fa-${cita.modalidad_cita === 'Virtual' ? 'video' : 'hospital'}"></i>
                                                   ${cita.modalidad_cita || 'Presencial'}
                                               </span>
                                           </div>
                                           <div class="detail-item">
                                               <strong>🗓️ Tipo de Cita:</strong>
                                               <span>${cita.tipo_cita || 'No especificado'}</span>
                                           </div>
                                       </div>
                                   </div>
                                   
                                   <div class="detail-item mt-3">
                                       <strong>🩺 Motivo de la Consulta:</strong>
                                       <div class="alert alert-light mt-2">
                                           ${cita.motivo || 'No especificado'}
                                       </div>
                                   </div>
                                   
                                   ${cita.notas ? `
                                       <div class="detail-item mt-3">
                                           <strong>📝 Notas Adicionales:</strong>
                                           <div class="alert alert-light mt-2">
                                               ${cita.notas}
                                           </div>
                                       </div>
                                   ` : ''}
                                   
                                   ${cita.enlace_virtual ? `
                                       <div class="detail-item mt-3">
                                           <strong>🔗 Enlace Virtual:</strong>
                                           <div class="mt-2">
                                               <a href="${cita.enlace_virtual}" target="_blank" class="btn btn-info btn-sm">
                                                   <i class="fas fa-video"></i> Acceder a la consulta virtual
                                               </a>
                                           </div>
                                       </div>
                                   ` : ''}
                               </div>
                               
                               <!-- Información del Doctor -->
                               <div class="detail-section">
                                   <h6><i class="fas fa-user-md text-primary"></i> Médico Tratante</h6>
                                   <div class="row">
                                       <div class="col-md-6">
                                           <div class="detail-item">
                                               <strong>👨‍⚕️ Doctor:</strong>
                                               <span class="text-info fw-bold">${doctor.nombres || ''} ${doctor.apellidos || ''}</span>
                                           </div>
                                           <div class="detail-item">
                                               <strong>🎓 Título:</strong>
                                               <span>${doctor.titulo_profesional || 'No especificado'}</span>
                                           </div>
                                       </div>
                                       <div class="col-md-6">
                                           <div class="detail-item">
                                               <strong>🏥 Especialidad:</strong>
                                               <span class="badge bg-primary">${doctor.especialidad || 'No especificado'}</span>
                                           </div>
                                           <div class="detail-item">
                                               <strong>📍 Sucursal:</strong>
                                               <span><i class="fas fa-hospital text-info"></i> ${sucursal.nombre || 'No especificado'}</span>
                                           </div>
                                       </div>
                                   </div>
                                   
                                   ${sucursal.direccion ? `
                                       <div class="detail-item mt-2">
                                           <strong>🗺️ Dirección:</strong>
                                           <span><i class="fas fa-map-marker-alt text-danger"></i> ${sucursal.direccion}</span>
                                       </div>
                                   ` : ''}
                               </div>
                               
                               <!-- Consulta Médica -->
                               ${consulta ? `
                                   <div class="detail-section bg-light-success">
                                       <h6><i class="fas fa-file-medical-alt text-success"></i> Consulta Médica Completada</h6>
                                       
                                       ${consulta.motivo_consulta ? `
                                           <div class="detail-item mb-3">
                                               <strong>🩺 Motivo de Consulta:</strong>
                                               <div class="alert alert-info mt-2">${consulta.motivo_consulta}</div>
                                           </div>
                                       ` : ''}
                                       
                                       ${consulta.sintomatologia ? `
                                           <div class="detail-item mb-3">
                                               <strong>🤒 Sintomatología:</strong>
                                               <div class="alert alert-warning mt-2">
                                                   <i class="fas fa-thermometer-half"></i>
                                                   ${consulta.sintomatologia}
                                               </div>
                                           </div>
                                       ` : ''}
                                       
                                       ${consulta.diagnostico ? `
                                           <div class="detail-item mb-3">
                                               <strong>🔬 Diagnóstico:</strong>
                                               <div class="alert alert-danger mt-2">
                                                   <i class="fas fa-diagnoses"></i>
                                                   <strong>${consulta.diagnostico}</strong>
                                               </div>
                                           </div>
                                       ` : ''}
                                       
                                       ${consulta.tratamiento ? `
                                           <div class="detail-item mb-3">
                                               <strong>💊 Tratamiento Prescrito:</strong>
                                               <div class="alert alert-primary mt-2">
                                                   <i class="fas fa-pills"></i>
                                                   ${consulta.tratamiento}
                                               </div>
                                           </div>
                                       ` : ''}
                                       
                                       ${consulta.observaciones ? `
                                           <div class="detail-item mb-3">
                                               <strong>📋 Observaciones Médicas:</strong>
                                               <div class="alert alert-info mt-2">
                                                   <i class="fas fa-clipboard-list"></i>
                                                   ${consulta.observaciones}
                                               </div>
                                           </div>
                                       ` : ''}
                                       
                                       ${consulta.fecha_seguimiento ? `
                                           <div class="detail-item">
                                               <strong>📅 Próximo Seguimiento:</strong>
                                               <span class="badge bg-warning text-dark fs-6">
                                                   <i class="fas fa-calendar-plus"></i>
                                                   ${formatDate(consulta.fecha_seguimiento)}
                                               </span>
                                           </div>
                                       ` : ''}
                                   </div>
                               ` : `
                                   <div class="detail-section">
                                       <h6><i class="fas fa-file-medical text-muted"></i> Consulta Médica</h6>
                                       <div class="alert alert-info">
                                           <i class="fas fa-info-circle"></i>
                                           Esta cita aún no tiene una consulta médica registrada.
                                       </div>
                                   </div>
                               `}
                           </div>
                           
                           <!-- COLUMNA DERECHA -->
                           <div class="col-lg-4">
                               <!-- Información del Paciente -->
                               <div class="detail-section bg-light-info">
                                   <h6><i class="fas fa-user-injured text-info"></i> Datos del Paciente</h6>
                                   <div class="text-center mb-3">
                                       <div class="patient-avatar-large">
                                           <i class="fas fa-user-circle"></i>
                                       </div>
                                       <h5 class="text-primary">${paciente.nombres || ''} ${paciente.apellidos || ''}</h5>
                                       <p class="text-muted">CI: ${paciente.cedula || 'No especificado'}</p>
                                   </div>
                                   
                                   <div class="patient-stats-grid">
                                       <div class="stat-item">
                                           <strong>🎂 Edad:</strong>
                                           <span>${paciente.edad || 0} años</span>
                                       </div>
                                       <div class="stat-item">
                                           <strong>📅 F. Nacimiento:</strong>
                                           <span>${formatDate(paciente.fecha_nacimiento)}</span>
                                       </div>
                                       ${paciente.tipo_sangre ? `
                                           <div class="stat-item">
                                               <strong>🩸 Tipo de Sangre:</strong>
                                               <span class="badge bg-danger">${paciente.tipo_sangre}</span>
                                           </div>
                                       ` : ''}
                                       ${paciente.telefono ? `
                                           <div class="stat-item">
                                               <strong>📱 Teléfono:</strong>
                                               <span>${paciente.telefono}</span>
                                           </div>
                                       ` : ''}
                                   </div>
                                   
                                   ${paciente.alergias ? `
                                       <div class="alert alert-warning mt-3">
                                           <strong><i class="fas fa-exclamation-triangle"></i> Alergias:</strong><br>
                                           ${paciente.alergias}
                                       </div>
                                   ` : ''}
                                   
                                   ${paciente.contacto_emergencia ? `
                                       <div class="emergency-contact mt-3">
                                           <h6 class="text-danger"><i class="fas fa-phone-alt"></i> Contacto de Emergencia</h6>
                                           <p class="mb-1"><strong>${paciente.contacto_emergencia}</strong></p>
                                           ${paciente.telefono_emergencia ? `
                                               <p class="mb-0"><i class="fas fa-phone"></i> ${paciente.telefono_emergencia}</p>
                                           ` : ''}
                                       </div>
                                   ` : ''}
                               </div>
                               
                               <!-- Triaje -->
                               ${triaje ? `
                                   <div class="detail-section bg-light-warning">
                                       <h6><i class="fas fa-clipboard-check text-warning"></i> Datos de Triaje</h6>
                                       
                                       ${triaje.nivel_urgencia ? `
                                           <div class="text-center mb-3">
                                               <span class="badge bg-${getUrgencyColor(triaje.nivel_urgencia)} fs-6">
                                                   <i class="fas fa-exclamation-triangle"></i>
                                                   Nivel de Urgencia: ${triaje.nivel_urgencia}
                                               </span>
                                           </div>
                                       ` : ''}
                                       
                                       <div class="vital-signs-grid">
                                           ${triaje.signos_vitales?.peso ? `
                                               <div class="vital-sign-item">
                                                   <div class="vital-icon bg-info"><i class="fas fa-weight"></i></div>
                                                   <div class="vital-info">
                                                       <div class="vital-value">${triaje.signos_vitales.peso} kg</div>
                                                       <div class="vital-label">Peso</div>
                                                   </div>
                                               </div>
                                           ` : ''}
                                           
                                           ${triaje.signos_vitales?.altura ? `
                                               <div class="vital-sign-item">
                                                   <div class="vital-icon bg-primary"><i class="fas fa-ruler-vertical"></i></div>
                                                   <div class="vital-info">
                                                       <div class="vital-value">${triaje.signos_vitales.altura} cm</div>
                                                       <div class="vital-label">Altura</div>
                                                   </div>
                                               </div>
                                           ` : ''}
                                           
                                           ${triaje.signos_vitales?.imc ? `
                                               <div class="vital-sign-item">
                                                   <div class="vital-icon bg-success"><i class="fas fa-calculator"></i></div>
                                                   <div class="vital-info">
                                                       <div class="vital-value">${triaje.signos_vitales.imc}</div>
                                                       <div class="vital-label">IMC</div>
                                                   </div>
                                               </div>
                                           ` : ''}
                                           
                                           ${triaje.signos_vitales?.presion_arterial ? `
                                               <div class="vital-sign-item">
                                                   <div class="vital-icon bg-danger"><i class="fas fa-heartbeat"></i></div>
                                                   <div class="vital-info">
                                                       <div class="vital-value">${triaje.signos_vitales.presion_arterial}</div>
                                                       <div class="vital-label">Presión</div>
                                                   </div>
                                               </div>
                                           ` : ''}
                                           
                                           ${triaje.signos_vitales?.temperatura ? `
                                               <div class="vital-sign-item">
                                                   <div class="vital-icon bg-warning"><i class="fas fa-thermometer-half"></i></div>
                                                   <div class="vital-info">
                                                       <div class="vital-value">${triaje.signos_vitales.temperatura}°C</div>
                                                       <div class="vital-label">Temperatura</div>
                                                   </div>
                                               </div>
                                           ` : ''}
                                           
                                           ${triaje.signos_vitales?.frecuencia_cardiaca ? `
                                               <div class="vital-sign-item">
                                                   <div class="vital-icon bg-secondary"><i class="fas fa-heart"></i></div>
                                                   <div class="vital-info">
                                                       <div class="vital-value">${triaje.signos_vitales.frecuencia_cardiaca} bpm</div>
                                                       <div class="vital-label">Frecuencia</div>
                                                   </div>
                                               </div>
                                           ` : ''}
                                       </div>
                                       
                                       ${triaje.observaciones ? `
                                           <div class="mt-3">
                                               <strong>📝 Observaciones del Triaje:</strong>
                                               <div class="alert alert-light mt-2">${triaje.observaciones}</div>
                                           </div>
                                       ` : ''}
                                   </div>
                               ` : `
                                   <div class="detail-section">
                                       <h6><i class="fas fa-clipboard text-muted"></i> Triaje</h6>
                                       <div class="alert alert-secondary">
                                           <i class="fas fa-info-circle"></i>
                                           Esta cita no tiene datos de triaje registrados.
                                       </div>
                                   </div>
                               `}
                           </div>
                       </div>
                   </div>
                   <div class="modal-footer">
                       <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                           <i class="fas fa-times"></i>
                           Cerrar
                       </button>
                       <button type="button" class="btn btn-primary" onclick="imprimirDetalle()">
                           <i class="fas fa-print"></i>
                           Imprimir
                       </button>
                       ${consulta ? `
                           <button type="button" class="btn btn-success" onclick="descargarReceta()">
                               <i class="fas fa-prescription"></i>
                               Descargar Receta
                           </button>
                       ` : ''}
                   </div>
               </div>
           </div>
       </div>
   `;
   
   // Remover modal existente si hay uno
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