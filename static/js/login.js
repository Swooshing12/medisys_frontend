// ===== LOGIN.JS - VERSIÓN SIN CONFLICTOS DE SWEETALERT2 =====

class LoginSystem {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.submitBtn = document.getElementById('loginBtn');
        this.emailInput = document.getElementById('inputCorreo');
        this.passwordInput = document.getElementById('inputPassword');
        this.forgotLink = document.getElementById('forgotPasswordLink');
        
        this.isSubmitting = false;
        this.originalButtonHtml = this.submitBtn.innerHTML;
        
        this.init();
    }
    
    init() {
        console.log('🔐 Initializing MediSys Login System v3.0...');
        
        // Procesar mensajes de Django al cargar
        setTimeout(() => {
            this.processDjangoMessages();
        }, 100);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Reset form state
        this.resetFormState();
        
        console.log('✅ Login system ready');
    }
    
    setupEventListeners() {
        // Form submission - Solo UN listener
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleSubmit();
            return false;
        });
        
        // Prevenir doble submit en el botón
        this.submitBtn.addEventListener('click', (e) => {
            if (this.isSubmitting) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
        
        // Input validations
        this.emailInput.addEventListener('input', () => this.clearFieldError(this.emailInput));
        this.passwordInput.addEventListener('input', () => this.clearFieldError(this.passwordInput));
        
        // Forgot password
        this.forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });
    }
    
    processDjangoMessages() {
        const messagesContainer = document.getElementById('django-messages');
        if (!messagesContainer) {
            console.log('📨 No Django messages container found');
            return;
        }
        
        const messages = messagesContainer.querySelectorAll('.message-item');
        console.log('📨 Processing', messages.length, 'Django messages');
        
        if (messages.length === 0) return;
        
        // Procesar mensajes con delay
        messages.forEach((messageElement, index) => {
            setTimeout(() => {
                const type = messageElement.getAttribute('data-type');
                const text = messageElement.getAttribute('data-text');
                this.showMessage(type, text);
            }, index * 300);
        });
    }
    
    handleSubmit() {
        if (this.isSubmitting) {
            console.log('⚠️ Already submitting, ignoring...');
            return;
        }
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        console.log('🔄 Processing login...');
        console.log('📧 Email:', email);
        
        // Validar antes de enviar
        if (!this.validateInputs(email, password)) {
            return;
        }
        
        // Iniciar envío
        this.startSubmission();
        
        // Enviar formulario
        this.submitToServer();
    }
    
    validateInputs(email, password) {
        this.clearAllErrors();
        
        let isValid = true;
        
        if (!email) {
            this.showFieldError(this.emailInput, 'El correo es requerido');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError(this.emailInput, 'Formato de correo inválido');
            isValid = false;
        }
        
        if (!password) {
            this.showFieldError(this.passwordInput, 'La contraseña es requerida');
            isValid = false;
        }
        
        if (!isValid) {
            this.showWarningAlert('Complete todos los campos correctamente');
        }
        
        return isValid;
    }
    
    async submitToServer() {
        try {
            const formData = new FormData(this.form);
            
            console.log('🌐 Sending to Django...');
            
            const response = await fetch(window.location.href, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.redirected) {
                // SUCCESS
                console.log('✅ Login successful!');
                this.handleSuccess(response.url);
                return;
            }
            
            // ERROR - procesar la respuesta HTML
            const htmlResponse = await response.text();
            console.log('❌ Login failed - processing response');
            this.handleError(htmlResponse);
            
        } catch (error) {
            console.error('🚨 Network error:', error);
            this.handleNetworkError();
        }
    }
    
    handleError(htmlResponse) {
        // Reset form y limpiar password
        this.resetFormState();
        this.passwordInput.value = '';
        
        // Extraer mensajes de la respuesta HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlResponse;
        
        const newMessages = tempDiv.querySelectorAll('#django-messages .message-item');
        console.log('📨 Found', newMessages.length, 'error messages in response');
        
        if (newMessages.length > 0) {
            // Mostrar el primer mensaje de error
            newMessages.forEach(messageElement => {
                const type = messageElement.getAttribute('data-type');
                const text = messageElement.getAttribute('data-text');
                
                console.log('📨 Processing message:', type, '-', text);
                
                if (type === 'error' || type === 'danger') {
                    this.showErrorAlert(text);
                } else {
                    this.showMessage(type, text);
                }
            });
        } else {
            // Error genérico si no hay mensajes específicos
            console.log('⚠️ No specific error messages found, showing generic error');
            this.showErrorAlert('Error de autenticación. Verifique sus credenciales.');
        }
    }
    
    handleSuccess(redirectUrl) {
        this.showSuccessAlert('Redirigiendo al sistema...', () => {
            window.location.href = redirectUrl;
        });
    }
    
    handleNetworkError() {
        this.resetFormState();
        this.showErrorAlert('No se pudo conectar con el servidor. Verifique su conexión a internet.');
    }
    
    showMessage(type, text) {
        if (type === 'success') {
            this.showSuccessAlert(text);
        } else if (type === 'error' || type === 'danger') {
            this.showErrorAlert(text);
        } else if (type === 'warning') {
            this.showWarningAlert(text);
        } else {
            this.showInfoAlert(text);
        }
    }
    
    // ✅ ALERTAS SIN CONFIGURACIÓN GLOBAL CONFLICTIVA
    showErrorAlert(apiMessage) {
        let alertConfig = {
            icon: 'error',
            confirmButtonColor: '#e74c3c',
            confirmButtonText: 'Reintentar',
            allowOutsideClick: true,
            allowEscapeKey: true,
            showConfirmButton: true,
            // ✅ SIN didOpen ni didClose que causan conflictos
        };
        
        // 🔒 DETECTAR TIPO DE ERROR POR EL MENSAJE
        if (apiMessage.toLowerCase().includes('bloqueada') || apiMessage.toLowerCase().includes('bloqueado')) {
            alertConfig.title = '🚫 Cuenta Bloqueada';
            alertConfig.text = apiMessage;
            alertConfig.confirmButtonText = 'Entendido';
            alertConfig.footer = '<span style="color: #e74c3c; font-weight: bold;"><i class="fas fa-ban"></i> Contacte al administrador para desbloquear su cuenta</span>';
        } else if (apiMessage.toLowerCase().includes('deshabilitada')) {
            alertConfig.title = '❌ Cuenta Deshabilitada';
            alertConfig.text = apiMessage;
            alertConfig.confirmButtonText = 'Entendido';
            alertConfig.footer = '<span style="color: #e74c3c;"><i class="fas fa-user-slash"></i> Contacte al administrador del sistema</span>';
        } else if (apiMessage.toLowerCase().includes('credenciales incorrectas')) {
            alertConfig.title = '🔐 Acceso Denegado';
            alertConfig.text = apiMessage;
            alertConfig.confirmButtonText = 'Reintentar';
            alertConfig.footer = '<span style="color: #f39c12;"><i class="fas fa-exclamation-triangle"></i> Verifique sus datos cuidadosamente</span>';
        } else {
            alertConfig.title = '❌ Error de Autenticación';
            alertConfig.text = apiMessage;
            alertConfig.confirmButtonText = 'Reintentar';
        }
        
        console.log('🚨 Showing error alert:', alertConfig.title, '-', alertConfig.text);
        
        Swal.fire(alertConfig).then((result) => {
            // ✅ SIMPLE RESET SIN FORCE
            this.resetFormState();
            
            if (result.isConfirmed && !apiMessage.toLowerCase().includes('bloqueada') && !apiMessage.toLowerCase().includes('deshabilitada')) {
                setTimeout(() => {
                    this.passwordInput.focus();
                }, 100);
            }
        });
    }
    
    showSuccessAlert(message, callback = null) {
        Swal.fire({
            icon: 'success',
            title: '🎉 ¡Bienvenido!',
            text: message,
            confirmButtonColor: '#27ae60',
            timer: 2500,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            timerProgressBar: true
        }).then(() => {
            this.resetFormState();
            if (callback) {
                callback();
            }
        });
    }
    
    showWarningAlert(message) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Datos Incompletos',
            text: message,
            confirmButtonColor: '#f39c12',
            confirmButtonText: 'Corregir',
            allowOutsideClick: true
        }).then(() => {
            this.resetFormState();
        });
    }
    
    showInfoAlert(message) {
        Swal.fire({
            icon: 'info', 
            title: 'ℹ️ Información',
            text: message,
            confirmButtonColor: '#3498db',
            confirmButtonText: 'Entendido',
            allowOutsideClick: true
        }).then(() => {
            this.resetFormState();
        });
    }
    
    // ✅ FORGOT PASSWORD ARREGLADO
    handleForgotPassword() {
        Swal.fire({
            icon: 'question',
            title: '🔑 ¿Olvidaste tu contraseña?',
            text: '¿Quieres solicitar una clave temporal por correo electrónico?',
            showCancelButton: true,
            confirmButtonColor: '#3498db',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Sí, solicitar clave',
            cancelButtonText: 'Cancelar',
            allowOutsideClick: true,
            allowEscapeKey: true,
            showConfirmButton: true,
            showCancelButton: true
        }).then((result) => {
            // ✅ SIMPLE RESET
            this.resetFormState();
            
            if (result.isConfirmed) {
                console.log('🔄 Redirecting to forgot password page...');
                window.location.href = '/auth/forgot-password/';
            }
            // Si result.isDismissed o result.isCancel, no hacer nada
        });
    }
    
    // ESTADO DEL FORMULARIO
    startSubmission() {
        this.isSubmitting = true;
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = `
            <div class="btn-content">
                <div class="spinner"></div>
                <span>Verificando...</span>
            </div>
        `;
        console.log('⏳ Submission started');
    }
    
    resetFormState() {
        this.isSubmitting = false;
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = this.originalButtonHtml;
        this.clearAllErrors();
        console.log('🔄 Form state reset');
    }
    
    // VALIDACIONES DE CAMPOS
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    showFieldError(field, message) {
        field.style.borderColor = '#e74c3c';
        field.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.15)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        field.parentNode.appendChild(errorDiv);
    }
    
    clearFieldError(field) {
        field.style.borderColor = '#e5e7eb';
        field.style.boxShadow = '';
        
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) errorDiv.remove();
    }
    
    clearAllErrors() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        [this.emailInput, this.passwordInput].forEach(field => {
            field.style.borderColor = '#e5e7eb';
            field.style.boxShadow = '';
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting MediSys Login v3.0...');
    window.loginSystem = new LoginSystem();
});