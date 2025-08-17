// ===== HISTORIAL-CLINICO.JS =====

class HistorialClinicoSystem {
    constructor() {
        this.form = document.getElementById('historialForm');
        this.btnBuscar = document.getElementById('btnBuscar');
        this.inputCedula = document.getElementById('inputCedula');
        this.toggleFilters = document.getElementById('toggleFilters');
        this.filtersContent = document.getElementById('filtersContent');
        this.selectEspecialidad = document.getElementById('selectEspecialidad');
        this.selectDoctor = document.getElementById('selectDoctor');
        
        this.isSubmitting = false;
        this.originalButtonHtml = this.btnBuscar ? this.btnBuscar.innerHTML : '';
        
        this.init();
    }
    
    init() {
        console.log('📋 Initializing Historial Clinico System...');
        
        this.setupEventListeners();
        this.setupCedulaValidation();
        this.setupFiltersToggle();
        this.setupEspecialidadChange();
        this.setupClearFilters();
        
        console.log('✅ Historial Clinico system ready');
    }
    
    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
        
        // Prevent double submission
        if (this.btnBuscar) {
            this.btnBuscar.addEventListener('click', (e) => {
                if (this.isSubmitting) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
        }
        
        // Clear all filters button
        const clearAllFilters = document.getElementById('clearAllFilters');
        if (clearAllFilters) {
            clearAllFilters.addEventListener('click', () => {
                this.clearAllFiltersAndSearch();
            });
        }
    }
    
    setupCedulaValidation() {
        if (!this.inputCedula) return;
        
        // Solo números
        this.inputCedula.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            e.target.value = value;
            
            // Validar en tiempo real
            this.validateCedula(value);
        });
        
        // Formatear al pegar
        this.inputCedula.addEventListener('paste', (e) => {
            setTimeout(() => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) {
                    value = value.substring(0, 10);
                }
                e.target.value = value;
                this.validateCedula(value);
            }, 10);
        });
    }
    
    validateCedula(cedula) {
        const isValid = this.isValidEcuadorianCedula(cedula);
        
        if (cedula.length === 0) {
            this.inputCedula.classList.remove('is-valid', 'is-invalid');
            return true;
        }
        
        if (isValid) {
            this.inputCedula.classList.remove('is-invalid');
            this.inputCedula.classList.add('is-valid');
            return true;
        } else {
            this.inputCedula.classList.remove('is-valid');
            this.inputCedula.classList.add('is-invalid');
            return false;
        }
    }
    
    isValidEcuadorianCedula(cedula) {
        if (!/^\d{10}$/.test(cedula)) return false;
        
        const digits = cedula.split('').map(Number);
        const province = parseInt(cedula.substring(0, 2));
        
        if (province < 1 || province > 24) return false;
        
        const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        let sum = 0;
        
        for (let i = 0; i < 9; i++) {
            let product = digits[i] * coefficients[i];
            if (product >= 10) product -= 9;
            sum += product;
        }
        
        const verifierDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
        return verifierDigit === digits[9];
    }
    
    setupFiltersToggle() {
        if (!this.toggleFilters || !this.filtersContent) return;
        
        this.toggleFilters.addEventListener('click', () => {
            const isVisible = this.filtersContent.style.display !== 'none';
            
            if (isVisible) {
                this.filtersContent.style.display = 'none';
                this.toggleFilters.classList.remove('rotated');
            } else {
                this.filtersContent.style.display = 'block';
                this.toggleFilters.classList.add('rotated');
            }
        });
    }
    
    setupEspecialidadChange() {
        if (!this.selectEspecialidad || !this.selectDoctor) return;
        
        this.selectEspecialidad.addEventListener('change', (e) => {
            const especialidadId = e.target.value;
            
            if (especialidadId) {
                this.loadDoctoresByEspecialidad(especialidadId);
            } else {
                this.clearDoctoresSelect();
            }
        });
    }
    
    async loadDoctoresByEspecialidad(especialidadId) {
        try {
            this.selectDoctor.innerHTML = '<option value="">Cargando doctores...</option>';
            this.selectDoctor.disabled = true;
            
            const response = await fetch(`/dashboard/api/doctores-especialidad/${especialidadId}/`);
            const result = await response.json();
            
            if (result.success && result.doctores) {
                this.populateDoctoresSelect(result.doctores);
            } else {
                this.showError('Error cargando doctores: ' + (result.message || 'Error desconocido'));
                this.clearDoctoresSelect();
            }
        } catch (error) {
            console.error('Error loading doctores:', error);
            this.showError('Error de conexión al cargar doctores');
            this.clearDoctoresSelect();
        }
    }
    
    populateDoctoresSelect(doctores) {
        this.selectDoctor.innerHTML = '<option value="">Todos los doctores</option>';
        
        doctores.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id_doctor;
            option.textContent = `${doctor.nombre_completo} - ${doctor.titulo_profesional}`;
            this.selectDoctor.appendChild(option);
        });
        
        this.selectDoctor.disabled = false;
    }
    
    clearDoctoresSelect() {
        this.selectDoctor.innerHTML = '<option value="">Todos los doctores</option>';
        this.selectDoctor.disabled = false;
    }
    
    setupClearFilters() {
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }
    
    clearFilters() {
        // Limpiar campos de fecha
        const fechaDesde = document.querySelector('input[name="fecha_desde"]');
        const fechaHasta = document.querySelector('input[name="fecha_hasta"]');
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        
        // Limpiar selects
        if (this.selectEspecialidad) this.selectEspecialidad.value = '';
        if (this.selectDoctor) this.selectDoctor.value = '';
        
        const estadoSelect = document.querySelector('select[name="estado"]');
        const sucursalSelect = document.querySelector('select[name="id_sucursal"]');
        if (estadoSelect) estadoSelect.value = '';
        if (sucursalSelect) sucursalSelect.value = '';
        
        // Limpiar doctores
        this.clearDoctoresSelect();
        
        console.log('🧹 Filtros limpiados');
    }
    
    clearAllFiltersAndSearch() {
        this.clearFilters();
        
        // Mantener solo la cédula y enviar
        const currentCedula = this.inputCedula.value;
        if (currentCedula) {
            this.form.submit();
        }
    }
    
    handleSubmit() {
        if (this.isSubmitting) {
            console.log('⚠️ Already submitting, ignoring...');
            return;
        }
        
        const cedula = this.inputCedula.value.trim();
        
        if (!cedula) {
            this.showError('La cédula es requerida');
            this.inputCedula.focus();
            return;
        }
        
        if (!this.validateCedula(cedula)) {
            this.showError('La cédula ingresada no es válida');
            this.inputCedula.focus();
            return;
        }
        
        console.log('🔍 Searching historial for cedula:', cedula);
        
        this.startSubmission();
        
        // Submit después de un pequeño delay
        setTimeout(() => {
            this.form.submit();
        }, 300);
    }
    
    startSubmission() {
        this.isSubmitting = true;
        if (this.btnBuscar) {
            this.btnBuscar.disabled = true;
            this.btnBuscar.innerHTML = `
                <div class="loading-spinner"></div>
                <span>Buscando...</span>
            `;
        }
        console.log('⏳ Search submission started');
    }
    
    resetFormState() {
        this.isSubmitting = false;
        if (this.btnBuscar) {
            this.btnBuscar.disabled = false;
            this.btnBuscar.innerHTML = this.originalButtonHtml;
        }
        console.log('🔄 Form state reset');
    }
    
    showError(message) {
        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Entendido'
            });
        } else {
            alert('Error: ' + message);
        }
    }
    
    showSuccess(message) {
        if (window.Swal) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: message,
                confirmButtonColor: '#28a745',
                confirmButtonText: 'Entendido'
            });
        } else {
            alert('Éxito: ' + message);
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
    // Esta función se expandirá cuando implementemos la vista de consulta médica
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
// ✅ FUNCIONES AUXILIARES NUEVAS
function getEstadoIcon(estado) {
    switch (estado?.toLowerCase()) {
        case 'completada': return '<i class="fas fa-check-circle"></i>';
        case 'pendiente': return '<i class="fas fa-clock"></i>';
        case 'cancelada': return '<i class="fas fa-times-circle"></i>';
        case 'confirmada': return '<i class="fas fa-calendar-check"></i>';
        default: return '<i class="fas fa-question-circle"></i>';
    }
}

function getUrgencyColorBadge(nivel) {
   if (nivel >= 4) return 'danger';
   if (nivel >= 3) return 'warning';
   if (nivel >= 2) return 'info';
   return 'success';
}

function formatDate(dateString) {
   if (!dateString) return 'No especificado';
   
   const date = new Date(dateString);
   const options = {
       year: 'numeric',
       month: 'long',
       day: 'numeric'
   };
   
   return date.toLocaleDateString('es-ES', options);
}

function formatDateTime(dateTimeString) {
   if (!dateTimeString) return 'No especificado';
   
   const date = new Date(dateTimeString);
   const options = {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
   };
   
   return date.toLocaleDateString('es-ES', options);
}
function exportarHistorial() {
    console.log('📄 Exportar historial');
    Swal.fire({
        icon: 'info',
        title: 'Función en Desarrollo',
        text: 'La función de exportación estará disponible pronto',
        confirmButtonColor: '#007bff'
    });
}

function imprimirDetalle() {
    window.print();
}

function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'No especificado';
    
    const date = new Date(dateTimeString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('es-ES', options);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Historial Clinico System...');
    window.historialClinicoSystem = new HistorialClinicoSystem();
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.historialClinicoSystem && window.historialClinicoSystem.isSubmitting) {
        return 'Hay una búsqueda en proceso. ¿Está seguro que desea salir?';
    }
});

// ✅ AGREGAR AL FINAL DEL ARCHIVO historial-clinico.js

// Event delegation para botones de la tabla
document.addEventListener('click', function(e) {
    // Botón ver detalle
    if (e.target.closest('.btn-ver-detalle')) {
        const button = e.target.closest('.btn-ver-detalle');
        const citaId = button.getAttribute('data-cita-id');
        if (citaId) {
            verDetalleCita(citaId);
        }
    }
    
    // Botón ver consulta
    if (e.target.closest('.btn-ver-consulta')) {
        const button = e.target.closest('.btn-ver-consulta');
        const citaId = button.getAttribute('data-cita-id');
        if (citaId) {
            verConsulta(citaId);
        }
    }
});