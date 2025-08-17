// ===== CHANGE-PASSWORD.JS - CAMBIO DE CONTRASEÑA CON VALIDACIONES =====

class ChangePasswordSystem {
    constructor() {
        this.form = document.getElementById('changePasswordForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.passwordTemporalInput = document.getElementById('inputPasswordTemporal');
        this.passwordNuevaInput = document.getElementById('inputPasswordNueva');
        this.confirmarPasswordInput = document.getElementById('inputConfirmarPassword');
        
        this.strengthIndicator = document.getElementById('passwordStrength');
        this.strengthFill = document.getElementById('strengthFill');
        this.strengthText = document.getElementById('strengthText');
        this.strengthRequirements = document.getElementById('strengthRequirements');
        this.passwordMatch = document.getElementById('passwordMatch');
        
        this.isSubmitting = false;
        this.originalButtonHtml = this.submitBtn.innerHTML;
        
        this.init();
    }
    
    init() {
        console.log('🔐 Initializing Change Password System...');
        
        // Procesar mensajes de Django
        setTimeout(() => {
            this.processDjangoMessages();
        }, 100);
        
        this.setupEventListeners();
        
        console.log('✅ Change Password system ready');
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Toggle password buttons
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });
        
        // Password strength monitoring
        this.passwordNuevaInput.addEventListener('input', () => {
            this.checkPasswordStrength();
            this.checkPasswordMatch();
        });
        
        // Password match monitoring
        this.confirmarPasswordInput.addEventListener('input', () => {
            this.checkPasswordMatch();
        });
        
        // Input validations
        this.passwordTemporalInput.addEventListener('input', () => this.clearFieldError(this.passwordTemporalInput));
        this.passwordNuevaInput.addEventListener('input', () => this.clearFieldError(this.passwordNuevaInput));
        this.confirmarPasswordInput.addEventListener('input', () => this.clearFieldError(this.confirmarPasswordInput));
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
        if (this.isSubmitting) return;
        
        const passwordTemporal = this.passwordTemporalInput.value;
        const passwordNueva = this.passwordNuevaInput.value;
        const confirmarPassword = this.confirmarPasswordInput.value;
        
        console.log('🔄 Processing password change...');
        
        if (!this.validateForm(passwordTemporal, passwordNueva, confirmarPassword)) {
            return;
        }
        
        this.startSubmission();
        
        // Submit normal form
        setTimeout(() => {
            this.form.submit();
        }, 500);
    }
    
    validateForm(passwordTemporal, passwordNueva, confirmarPassword) {
        this.clearAllErrors();
        
        let errors = [];
        
        // Validar contraseña temporal
        if (!passwordTemporal) {
            errors.push('La contraseña temporal es requerida');
            this.showFieldError(this.passwordTemporalInput, 'Requerida');
        }
        
        // Validar nueva contraseña
        if (!passwordNueva) {
            errors.push('La nueva contraseña es requerida');
            this.showFieldError(this.passwordNuevaInput, 'Requerida');
        } else {
            const passwordErrors = this.validatePassword(passwordNueva);
            if (passwordErrors.length > 0) {
                errors = errors.concat(passwordErrors);
                this.showFieldError(this.passwordNuevaInput, 'No cumple requisitos');
            }
        }
        
        // Validar confirmación
        if (!confirmarPassword) {
            errors.push('Debe confirmar la nueva contraseña');
            this.showFieldError(this.confirmarPasswordInput, 'Requerida');
        } else if (passwordNueva !== confirmarPassword) {
            errors.push('Las contraseñas no coinciden');
            this.showFieldError(this.confirmarPasswordInput, 'No coincide');
        }
        
        if (errors.length > 0) {
            this.showAlert('warning', 'Errores en el formulario', 
                '<div style="text-align: left;">' + 
                errors.map(error => `• ${error}`).join('<br>') + 
                '</div>');
            return false;
        }
        
        return true;
    }
    
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Debe tener al menos 8 caracteres');
        }
        
        if (password.length > 50) {
            errors.push('No puede tener más de 50 caracteres');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Debe contener al menos una letra minúscula');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Debe contener al menos una letra mayúscula');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Debe contener al menos un número');
        }
        
        if (/\s/.test(password)) {
            errors.push('No puede contener espacios');
        }
        
        // Contraseñas comunes
        const commonPasswords = [
            '12345678', '123456789', 'password', 'qwerty123', 
            'abc12345', '11111111', '22222222', '33333333',
            'password123', 'admin123', 'user1234', 'test1234'
        ];
        
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('La contraseña es demasiado común');
        }
        
        return errors;
    }
    
    checkPasswordStrength() {
        const password = this.passwordNuevaInput.value;
        
        if (!password) {
            this.strengthIndicator.style.display = 'none';
            return;
        }
        
        this.strengthIndicator.style.display = 'block';
        
        let score = 0;
        const requirements = [];
        
        // Evaluar criterios
        if (password.length >= 8) {
            score++;
            requirements.push({ text: 'Mínimo 8 caracteres', met: true });
        } else {
            requirements.push({ text: 'Mínimo 8 caracteres', met: false });
        }
        
        if (/[a-z]/.test(password)) {
            score++;
            requirements.push({ text: 'Letra minúscula', met: true });
        } else {
            requirements.push({ text: 'Letra minúscula', met: false });
        }
        
        if (/[A-Z]/.test(password)) {
            score++;
            requirements.push({ text: 'Letra mayúscula', met: true });
        } else {
            requirements.push({ text: 'Letra mayúscula', met: false });
        }
        
        if (/[0-9]/.test(password)) {
            score++;
            requirements.push({ text: 'Al menos un número', met: true });
        } else {
            requirements.push({ text: 'Al menos un número', met: false });
        }
        
        if (/[^a-zA-Z0-9]/.test(password)) {
            score++;
            requirements.push({ text: 'Carácter especial (opcional)', met: true });
        } else {
            requirements.push({ text: 'Carácter especial (recomendado)', met: false });
        }
        
        // Actualizar barra de fortaleza
        let level, levelClass;
        if (score <= 1) {
            level = 'Muy débil';
            levelClass = 'very-weak';
        } else if (score === 2) {
            level = 'Débil';
            levelClass = 'weak';
        } else if (score === 3) {
            level = 'Moderada';
            levelClass = 'moderate';
        } else if (score === 4) {
            level = 'Fuerte';
            levelClass = 'strong';
        } else {
            level = 'Muy fuerte';
            levelClass = 'very-strong';
        }
        
        // Actualizar UI
        this.strengthFill.className = `strength-fill ${levelClass}`;
        this.strengthText.textContent = level;
        this.strengthText.className = `strength-text ${levelClass}`;
        
        // Mostrar requirements
        this.strengthRequirements.innerHTML = requirements
            .map(req => `
                <div class="requirement ${req.met ? 'met' : 'unmet'}">
                    <i class="fas fa-${req.met ? 'check' : 'times'}"></i>
                    <span>${req.text}</span>
                </div>
            `).join('');
    }
    
    checkPasswordMatch() {
        const password = this.passwordNuevaInput.value;
        const confirm = this.confirmarPasswordInput.value;
        
        if (!confirm) {
            this.passwordMatch.style.display = 'none';
            return;
        }
        
        this.passwordMatch.style.display = 'block';
        
        if (password === confirm) {
            this.passwordMatch.className = 'password-match match';
            this.passwordMatch.innerHTML = '<i class="fas fa-check"></i> Las contraseñas coinciden';
        } else {
            this.passwordMatch.className = 'password-match no-match';
            this.passwordMatch.innerHTML = '<i class="fas fa-times"></i> Las contraseñas no coinciden';
        }
    }
    
    togglePasswordVisibility(e) {
        const button = e.target.closest('.toggle-password');
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
            button.classList.add('active');
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
            button.classList.remove('active');
        }
    }
    
    showMessage(type, text) {
        if (type === 'success') {
            this.showAlert('success', '✅ Contraseña Cambiada', text, 3000, () => {
                // Redirigir al login después del éxito
                window.location.href = '/auth/login/';
            });
        } else if (type === 'error' || type === 'danger') {
            this.showAlert('error', '❌ Error', text);
        } else if (type === 'warning') {
            this.showAlert('warning', '⚠️ Atención', text);
        } else if (type === 'info') {
            this.showAlert('info', 'ℹ️ Información', text);
        }
    }
    
    showAlert(icon, title, text, timer = null, callback = null) {
        const config = {
            icon: icon,
            title: title,
            html: text,
            confirmButtonText: 'Entendido',
            allowOutsideClick: true,
            allowEscapeKey: true
        };
        
        if (timer) {
            config.timer = timer;
            config.showConfirmButton = false;
            config.didOpen = () => {
                if (icon === 'success') {
                    Swal.showLoading();
                }
            };
        }
        
        // Colores según tipo
        if (icon === 'error') {
            config.confirmButtonColor = '#e74c3c';
        } else if (icon === 'success') {
            config.confirmButtonColor = '#28a745';
        } else if (icon === 'warning') {
            config.confirmButtonColor = '#f39c12';
        } else {
            config.confirmButtonColor = '#3498db';
        }
        
        Swal.fire(config).then(() => {
            this.resetFormState();
            if (callback) {
                callback();
            }
        });
    }
    
    startSubmission() {
        this.isSubmitting = true;
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = `
            <div class="btn-content">
                <div class="spinner"></div>
                <span>Cambiando contraseña...</span>
            </div>
        `;
    }
    
    resetFormState() {
        this.isSubmitting = false;
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = this.originalButtonHtml;
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
        [this.passwordTemporalInput, this.passwordNuevaInput, this.confirmarPasswordInput].forEach(field => {
            if (field) {
                field.style.borderColor = '#e5e7eb';
                field.style.boxShadow = '';
            }
        });
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Change Password System...');
    window.changePasswordSystem = new ChangePasswordSystem();
});