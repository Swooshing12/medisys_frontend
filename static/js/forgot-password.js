// ===== FORGOT-PASSWORD.JS - VERSIÓN SIN CONFLICTOS =====

class ForgotPasswordSystem {
    constructor() {
        this.form = document.getElementById('forgotPasswordForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.emailInput = document.getElementById('inputCorreo');
        
        this.isSubmitting = false;
        this.originalButtonHtml = this.submitBtn ? this.submitBtn.innerHTML : '';
        
        this.init();
    }
    
    init() {
        console.log('🔑 Initializing Forgot Password System v2.0...');
        
        // Procesar mensajes de Django
        setTimeout(() => {
            this.processDjangoMessages();
        }, 100);
        
        // Solo setup si hay formulario (no en página de éxito)
        if (this.form && this.submitBtn) {
            this.setupEventListeners();
        }
        
        console.log('✅ Forgot Password system ready');
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Input validation
        this.emailInput.addEventListener('input', () => this.clearFieldError(this.emailInput));
        this.emailInput.addEventListener('blur', () => this.validateEmail());
    }
    
    processDjangoMessages() {
        const messagesContainer = document.getElementById('django-messages');
        if (!messagesContainer) return;
        
        const messages = messagesContainer.querySelectorAll('.message-item');
        console.log('📨 Processing', messages.length, 'messages');
        
        messages.forEach((messageElement, index) => {
            setTimeout(() => {
                const type = messageElement.getAttribute('data-type');
                const text = messageElement.getAttribute('data-text');
                this.showMessage(type, text);
            }, index * 200);
        });
    }
    
    handleSubmit() {
        if (this.isSubmitting) {
            console.log('⚠️ Already submitting, ignoring...');
            return;
        }
        
        const email = this.emailInput.value.trim();
        
        console.log('🔑 Processing forgot password...');
        console.log('📧 Email:', email);
        
        if (!this.validateForm(email)) {
            return;
        }
        
        this.startSubmission();
        
        // Submit normal form después de un pequeño delay
        setTimeout(() => {
            this.form.submit();
        }, 300);
    }
    
    validateForm(email) {
        this.clearAllErrors();
        
        if (!email) {
            this.showFieldError(this.emailInput, 'El correo es requerido');
            this.showAlert('warning', 'Campo requerido', 'Ingrese su correo electrónico');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showFieldError(this.emailInput, 'Formato de correo inválido');
            this.showAlert('warning', 'Email inválido', 'Ingrese un formato de correo válido');
            return false;
        }
        
        return true;
    }
    
    validateEmail() {
        const email = this.emailInput.value.trim();
        this.clearFieldError(this.emailInput);
        
        if (email && !this.isValidEmail(email)) {
            this.showFieldError(this.emailInput, 'Formato inválido');
        }
    }
    
    showMessage(type, text) {
        if (type === 'success') {
            this.showAlert('success', '✅ Solicitud Enviada', text, 3000);
        } else if (type === 'error' || type === 'danger') {
            this.showAlert('error', '❌ Error', text);
        } else if (type === 'warning') {
            this.showAlert('warning', '⚠️ Atención', text);
        } else {
            this.showAlert('info', 'ℹ️ Información', text);
        }
    }
    
    // ✅ ALERTAS SIMPLES SIN CONFIGURACIONES CONFLICTIVAS
    showAlert(icon, title, text, timer = null) {
        const config = {
            icon: icon,
            title: title,
            text: text,
            confirmButtonText: 'Entendido',
            allowOutsideClick: true,
            allowEscapeKey: true,
            showConfirmButton: true
        };
        
        // Solo agregar timer si se especifica
        if (timer) {
            config.timer = timer;
            config.showConfirmButton = false;
            config.timerProgressBar = true;
        }
        
        // Colores según tipo
        if (icon === 'error') {
            config.confirmButtonColor = '#e74c3c';
        } else if (icon === 'success') {
            config.confirmButtonColor = '#27ae60';
        } else if (icon === 'warning') {
            config.confirmButtonColor = '#f39c12';
        } else {
            config.confirmButtonColor = '#3498db';
        }
        
        console.log('🔔 Showing alert:', config.title);
        
        Swal.fire(config).then(() => {
            this.resetFormState();
        });
    }
    
    startSubmission() {
        this.isSubmitting = true;
        if (this.submitBtn) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = `
                <div class="btn-content">
                    <div class="spinner"></div>
                    <span>Enviando...</span>
                </div>
            `;
        }
        console.log('⏳ Submission started');
    }
    
    resetFormState() {
        this.isSubmitting = false;
        if (this.submitBtn) {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = this.originalButtonHtml;
        }
        console.log('🔄 Form state reset');
    }
    
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
        if (this.emailInput) {
            this.emailInput.style.borderColor = '#e5e7eb';
            this.emailInput.style.boxShadow = '';
        }
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Forgot Password System v2.0...');
    window.forgotPasswordSystem = new ForgotPasswordSystem();
});