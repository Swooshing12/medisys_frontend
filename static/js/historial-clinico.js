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
                <div class="modal-content">
                    <div class="modal-header">
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
                                <div class="detalle-section">
                                    <h6><i class="fas fa-calendar-check text-primary"></i> Información de la Cita</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="detalle-item">
                                                <span class="detalle-label">📅 Fecha y Hora:</span>
                                                <span class="detalle-value fecha-destacada">
                                                    ${formatDateTime(cita.fecha_hora)}
                                                </span>
                                            </div>
                                            <div class="detalle-item">
                                                <span class="detalle-label">📋 Estado:</span>
                                                <span class="detalle-value">
                                                    <span class="badge estado-${(cita.estado || '').toLowerCase()} fs-6">
                                                        ${getEstadoIcon(cita.estado)} ${cita.estado || 'Sin estado'}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="detalle-item">
                                                <span class="detalle-label">💻 Modalidad:</span>
                                                <span class="detalle-value">
                                                    <span class="badge ${cita.modalidad_cita === 'Virtual' ? 'bg-info' : 'bg-secondary'} fs-6">
                                                        <i class="fas fa-${cita.modalidad_cita === 'Virtual' ? 'video' : 'hospital'}"></i>
                                                        ${cita.modalidad_cita || 'Presencial'}
                                                    </span>
                                                </span>
                                            </div>
                                            <div class="detalle-item">
                                                <span class="detalle-label">🗓️ Tipo de Cita:</span>
                                                <span class="detalle-value">${cita.tipo_cita || 'No especificado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="detalle-item mt-3">
                                        <span class="detalle-label">🩺 Motivo de la Consulta:</span>
                                        <div class="detalle-value-box">
                                            ${cita.motivo || 'No especificado'}
                                        </div>
                                    </div>
                                    
                                    ${cita.notas ? `
                                        <div class="detalle-item mt-3">
                                            <span class="detalle-label">📝 Notas Adicionales:</span>
                                            <div class="detalle-value-box">
                                                ${cita.notas}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${cita.enlace_virtual ? `
                                        <div class="detalle-item mt-3">
                                            <span class="detalle-label">🔗 Enlace Virtual:</span>
                                            <div class="detalle-value">
                                                <a href="${cita.enlace_virtual}" target="_blank" class="btn btn-sm btn-info">
                                                    <i class="fas fa-video"></i> Acceder a la consulta virtual
                                                </a>
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    <div class="detalle-item mt-2">
                                        <span class="detalle-label">📅 Fecha de Creación:</span>
                                        <span class="detalle-value">${formatDateTime(cita.fecha_creacion)}</span>
                                    </div>
                                </div>
                                
                                <!-- Información del Doctor -->
                                <div class="detalle-section">
                                    <h6><i class="fas fa-user-md text-primary"></i> Médico Tratante</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="detalle-item">
                                                <span class="detalle-label">👨‍⚕️ Doctor:</span>
                                                <span class="detalle-value doctor-name">
                                                    ${doctor.nombres || ''} ${doctor.apellidos || ''}
                                                </span>
                                            </div>
                                            <div class="detalle-item">
                                                <span class="detalle-label">🎓 Título:</span>
                                                <span class="detalle-value">${doctor.titulo_profesional || 'No especificado'}</span>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="detalle-item">
                                                <span class="detalle-label">🏥 Especialidad:</span>
                                                <span class="detalle-value">
                                                    <span class="badge bg-primary fs-6">${doctor.especialidad || 'No especificado'}</span>
                                                </span>
                                            </div>
                                            <div class="detalle-item">
                                                <span class="detalle-label">📍 Sucursal:</span>
                                                <span class="detalle-value">
                                                    <i class="fas fa-hospital text-info"></i> ${sucursal.nombre || 'No especificado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${sucursal.direccion ? `
                                        <div class="detalle-item mt-2">
                                            <span class="detalle-label">🗺️ Dirección:</span>
                                            <span class="detalle-value">
                                                <i class="fas fa-map-marker-alt text-danger"></i> ${sucursal.direccion}
                                            </span>
                                        </div>
                                    ` : ''}
                                    
                                    ${sucursal.telefono ? `
                                        <div class="detalle-item mt-2">
                                            <span class="detalle-label">📞 Teléfono:</span>
                                            <span class="detalle-value">
                                                <i class="fas fa-phone text-success"></i> ${sucursal.telefono}
                                            </span>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <!-- Consulta Médica -->
                                ${consulta ? `
                                    <div class="detalle-section consulta-section">
                                        <h6><i class="fas fa-file-medical-alt text-success"></i> Consulta Médica Completada</h6>
                                        
                                        ${consulta.motivo_consulta ? `
                                            <div class="detalle-item mb-3">
                                                <span class="detalle-label">🩺 Motivo de Consulta:</span>
                                                <div class="detalle-value-box">${consulta.motivo_consulta}</div>
                                            </div>
                                        ` : ''}
                                        
                                        ${consulta.sintomatologia ? `
                                            <div class="detalle-item mb-3">
                                                <span class="detalle-label">🤒 Sintomatología:</span>
                                                <div class="detalle-value-box sintomas">
                                                    <i class="fas fa-thermometer-half text-warning"></i>
                                                    ${consulta.sintomatologia}
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        ${consulta.diagnostico ? `
                                            <div class="detalle-item mb-3">
                                                <span class="detalle-label">🔬 Diagnóstico:</span>
                                                <div class="detalle-value-box diagnostico">
                                                    <i class="fas fa-diagnoses text-danger"></i>
                                                    <strong>${consulta.diagnostico}</strong>
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        ${consulta.tratamiento ? `
                                            <div class="detalle-item mb-3">
                                                <span class="detalle-label">💊 Tratamiento Prescrito:</span>
                                                <div class="detalle-value-box tratamiento">
                                                    <i class="fas fa-pills text-primary"></i>
                                                    ${consulta.tratamiento}
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        ${consulta.observaciones ? `
                                            <div class="detalle-item mb-3">
                                                <span class="detalle-label">📋 Observaciones Médicas:</span>
                                                <div class="detalle-value-box observaciones">
                                                    <i class="fas fa-clipboard-list text-info"></i>
                                                    ${consulta.observaciones}
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        ${consulta.fecha_seguimiento ? `
                                            <div class="detalle-item">
                                                <span class="detalle-label">📅 Próximo Seguimiento:</span>
                                                <span class="detalle-value">
                                                    <span class="badge bg-warning text-dark fs-6">
                                                        <i class="fas fa-calendar-plus"></i>
                                                        ${formatDate(consulta.fecha_seguimiento)}
                                                    </span>
                                                </span>
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : `
                                    <div class="detalle-section">
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
                                <div class="detalle-section patient-info">
                                    <h6><i class="fas fa-user-injured text-info"></i> Datos del Paciente</h6>
                                    <div class="patient-summary">
                                        <div class="patient-avatar">
                                            <i class="fas fa-user-circle"></i>
                                        </div>
                                        <div class="patient-details">
                                            <h5 class="patient-name">${paciente.nombres || ''} ${paciente.apellidos || ''}</h5>
                                            <p class="patient-cedula">CI: ${paciente.cedula || 'No especificado'}</p>
                                            <div class="patient-stats">
                                                <div class="stat">
                                                    <span class="stat-label">🎂 Edad:</span>
                                                    <span class="stat-value">${paciente.edad || 0} años</span>
                                                </div>
                                                <div class="stat">
                                                    <span class="stat-label">📅 F. Nacimiento:</span>
                                                    <span class="stat-value">${formatDate(paciente.fecha_nacimiento)}</span>
                                                </div>
                                                ${paciente.tipo_sangre ? `
                                                    <div class="stat">
                                                        <span class="stat-label">🩸 Tipo de Sangre:</span>
                                                        <span class="stat-value blood-type">${paciente.tipo_sangre}</span>
                                                    </div>
                                                ` : ''}
                                                ${paciente.telefono ? `
                                                    <div class="stat">
                                                        <span class="stat-label">📱 Teléfono:</span>
                                                        <span class="stat-value">${paciente.telefono}</span>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${paciente.alergias ? `
                                        <div class="alert alert-warning alert-sm mt-3">
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
                                    <div class="detalle-section triaje-section">
                                        <h6><i class="fas fa-clipboard-check text-warning"></i> Datos de Triaje</h6>
                                        
                                        ${triaje.nivel_urgencia ? `
                                            <div class="urgency-level mb-3">
                                                <span class="badge bg-${getUrgencyColorBadge(triaje.nivel_urgencia)} fs-6">
                                                    <i class="fas fa-exclamation-triangle"></i>
                                                    Nivel de Urgencia: ${triaje.nivel_urgencia}
                                                </span>
                                            </div>
                                        ` : ''}
                                        
                                        <div class="signos-vitales-compact">
                                            ${triaje.signos_vitales?.peso ? `
                                                <div class="signo-vital-compact">
                                                    <div class="signo-icon bg-info"><i class="fas fa-weight"></i></div>
                                                    <div class="signo-info">
                                                        <div class="signo-valor">${triaje.signos_vitales.peso} kg</div>
                                                        <div class="signo-label">Peso</div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${triaje.signos_vitales?.altura ? `
                                                <div class="signo-vital-compact">
                                                    <div class="signo-icon bg-primary"><i class="fas fa-ruler-vertical"></i></div>
                                                    <div class="signo-info">
                                                        <div class="signo-valor">${triaje.signos_vitales.altura} cm</div>
                                                        <div class="signo-label">Altura</div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${triaje.signos_vitales?.imc ? `
                                                <div class="signo-vital-compact">
                                                    <div class="signo-icon bg-success"><i class="fas fa-calculator"></i></div>
                                                    <div class="signo-info">
                                                        <div class="signo-valor">${triaje.signos_vitales.imc}</div>
                                                        <div class="signo-label">IMC</div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${triaje.signos_vitales?.presion_arterial ? `
                                                <div class="signo-vital-compact">
                                                    <div class="signo-icon bg-danger"><i class="fas fa-heartbeat"></i></div>
                                                    <div class="signo-info">
                                                        <div class="signo-valor">${triaje.signos_vitales.presion_arterial}</div>
                                                        <div class="signo-label">Presión Arterial</div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${triaje.signos_vitales?.temperatura ? `
                                                <div class="signo-vital-compact">
                                                    <div class="signo-icon bg-warning"><i class="fas fa-thermometer-half"></i></div>
                                                    <div class="signo-info">
                                                        <div class="signo-valor">${triaje.signos_vitales.temperatura}°C</div>
                                                        <div class="signo-label">Temperatura</div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                            ${triaje.signos_vitales?.frecuencia_cardiaca ? `
                                                <div class="signo-vital-compact">
                                                    <div class="signo-icon bg-secondary"><i class="fas fa-heart"></i></div>
                                                    <div class="signo-info">
                                                        <div class="signo-valor">${triaje.signos_vitales.frecuencia_cardiaca} bpm</div>
                                                        <div class="signo-label">Frecuencia Cardíaca</div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                        
                                        ${triaje.observaciones ? `
                                            <div class="mt-3">
                                                <span class="detalle-label">📝 Observaciones del Triaje:</span>
                                                <div class="detalle-value-box small">${triaje.observaciones}</div>
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : `
                                    <div class="detalle-section">
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