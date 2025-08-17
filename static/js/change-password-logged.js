// ===== CHANGE-PASSWORD.JS ===== 

class ChangePasswordSystem {
    constructor() {
        this.form = document.getElementById('changePasswordForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.passwordActualInput = document.getElementById('inputPasswordActual');
        this.passwordNuevaInput = document.getElementById('inputPasswordNueva');
        this.confirmarPasswordInput = document.getElementById('inputConfirmarPassword');
        
        this.isSubmitting = false;
        this.originalButtonHtml = this.submitBtn ? this.submitBtn.innerHTML : '';
        
        this.init();
    }
    
    init() {
        console.log('🔐 Initializing Change Password System...');
        
        if (!this.form || !this.submitBtn) {
            console.error('❌ Form elements not found');
            return;
        }
        
        this.setupEventListeners();
        this.setupPasswordToggles();
        
        console.log('✅ Change Password system ready');
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Input validations
        this.passwordActualInput.addEventListener('input', () => {
            this.clearFieldError(this.passwordActualInput);
        });
        
        this.passwordNuevaInput.addEventListener('input', () => {
            this.clearFieldError(this.passwordNuevaInput);
            this.checkPasswordStrength();
            this.checkPasswordMatch();
        });
        
        this.confirmarPasswordInput.addEventListener('input', () => {
            this.clearFieldError(this.confirmarPasswordInput);
            this.checkPasswordMatch();
        });
        
        // Focus events
        this.passwordNuevaInput.addEventListener('focus', () => {
            this.showPasswordStrength();
        });
    }
    
    setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    button.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    targetInput.type = 'password';
                    button.innerHTML = '<i class="fas fa-eye"></i>';
                }
            });
        });
    }
    
    handleSubmit() {
        if (this.isSubmitting) {
            console.log('⚠️ Already submitting, ignoring...');
            return;
        }
        
        const passwordActual = this.passwordActualInput.value;
        const passwordNueva = this.passwordNuevaInput.value;
        const confirmarPassword = this.confirmarPasswordInput.value;
        
        console.log('🔄 Processing password change...');
        
        // Validar antes de enviar
        if (!this.validateForm(passwordActual, passwordNueva, confirmarPassword)) {
            return;
        }
        
        // Iniciar envío
        this.startSubmission();
        
        // Enviar formulario después de un pequeño delay
        setTimeout(() => {
            this.form.submit();
        }, 300);
    }
    
    validateForm(passwordActual, passwordNueva, confirmarPassword) {
        this.clearAllErrors();
        
        let isValid = true;
        
        // Validar contraseña actual
        if (!passwordActual) {
            this.showFieldError(this.passwordActualInput, 'La contraseña actual es requerida');
            isValid = false;
        }
        
        // Validar nueva contraseña
        if (!passwordNueva) {
            this.showFieldError(this.passwordNuevaInput, 'La nueva contraseña es requerida');
            isValid = false;
        } else {
            const strengthResult = this.validatePasswordStrength(passwordNueva);
            if (!strengthResult.isValid) {
                this.showFieldError(this.passwordNuevaInput, 'La contraseña no cumple los requisitos de seguridad');
                isValid = false;
            }
        }
        
        // Validar confirmación
        if (!confirmarPassword) {
            this.showFieldError(this.confirmarPasswordInput, 'Debe confirmar la nueva contraseña');
            isValid = false;
        } else if (passwordNueva !== confirmarPassword) {
            this.showFieldError(this.confirmarPasswordInput, 'Las contraseñas no coinciden');
            isValid = false;
        }
        
        // Validar que sea diferente a la actual
        if (passwordActual && passwordNueva && passwordActual === passwordNueva) {
            this.showFieldError(this.passwordNuevaInput, 'La nueva contraseña debe ser diferente a la actual');
            isValid = false;
        }
        
        if (!isValid) {
            this.showAlert('warning', 'Datos incompletos', 'Por favor, corrija los errores en el formulario');
        }
        
        return isValid;
    }
    
    checkPasswordStrength() {
        const password = this.passwordNuevaInput.value;
        const result = this.validatePasswordStrength(password);
        
        const strengthDiv = document.getElementById('passwordStrength');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        const strengthRequirements = document.getElementById('strengthRequirements');
        
        if (password && strengthDiv) {
            strengthDiv.style.display = 'block';
            
            // Update strength bar
            strengthFill.className = `strength-fill ${result.level}`;
            
            // Update strength text
            strengthText.className = `strength-text ${result.level}`;
            strengthText.textContent = result.text;
            
            // Update requirements
            strengthRequirements.innerHTML = this.getRequirementsHTML(result.requirements);
        } else if (strengthDiv) {
            strengthDiv.style.display = 'none';
        }
    }
    
    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            noSpaces: !/\s/.test(password)
        };
        
        const metCount = Object.values(requirements).filter(Boolean).length;
        
        let level, text;
        if (metCount < 2) {
            level = 'weak';
            text = 'Muy débil';
        } else if (metCount < 3) {
            level = 'fair';
            text = 'Débil';
        } else if (metCount < 5) {
            level = 'good';
            text = 'Buena';
        } else {
            level = 'strong';
            text = 'Fuerte';
        }
        
        return {
            level,
            text,
            isValid: metCount >= 5,
            requirements
        };
    }
    
    getRequirementsHTML(requirements) {
        const items = [
            { key: 'length', text: 'Mínimo 8 caracteres' },
            { key: 'lowercase', text: 'Una letra minúscula' },
            { key: 'uppercase', text: 'Una letra mayúscula' },
            { key: 'number', text: 'Un número' },
            { key: 'noSpaces', text: 'Sin espacios' }
        ];
        
        return '<ul>' + items.map(item => {
            const className = requirements[item.key] ? 'met' : 'not-met';
            const icon = requirements[item.key] ? '✓' : '✗';
            return `<li class="${className}">${icon} ${item.text}</li>`;
        }).join('') + '</ul>';
    }
    
    checkPasswordMatch() {
        const passwordNueva = this.passwordNuevaInput.value;
        const confirmarPassword = this.confirmarPasswordInput.value;
        const matchDiv = document.getElementById('passwordMatch');
        
        if (confirmarPassword && matchDiv) {
            matchDiv.style.display = 'block';
            
            if (passwordNueva === confirmarPassword) {
                matchDiv.className = 'password-match match';
                matchDiv.innerHTML = '<i class="fas fa-check"></i> Las contraseñas coinciden';
                this.confirmarPasswordInput.classList.add('success');
                this.confirmarPasswordInput.classList.remove('error');
            } else {
                matchDiv.className = 'password-match no-match';
                matchDiv.innerHTML = '<i class="fas fa-times"></i> Las contraseñas no coinciden';
                this.confirmarPasswordInput.classList.add('error');
                this.confirmarPasswordInput.classList.remove('success');
            }
        } else if (matchDiv) {
            matchDiv.style.display = 'none';
            this.confirmarPasswordInput.classList.remove('success', 'error');
        }
    }
    
    showPasswordStrength() {
        const strengthDiv = document.getElementById('passwordStrength');
        if (strengthDiv) {
            strengthDiv.style.display = 'block';
        }
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
        console.log('⏳ Password change submission started');
    }
    
    resetFormState() {
        this.isSubmitting = false;
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = this.originalButtonHtml;
        console.log('🔄 Form state reset');
    }
    
    showFieldError(field, message) {
        // Remove existing error
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        field.parentNode.parentNode.appendChild(errorDiv);
    }
    
    clearFieldError(field) {
        field.classList.remove('error', 'success');
        
        const errorDiv = field.parentNode.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    
    clearAllErrors() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.form-input').forEach(input => {
            input.classList.remove('error', 'success');
        });
    }
    
    showAlert(icon, title, text) {
        if (window.Swal) {
            Swal.fire({
                icon: icon,
                title: title,
                text: text,
                confirmButtonColor: '#007bff',
                confirmButtonText: 'Entendido'
            }).then(() => {
                this.resetFormState();
            });
        } else {
            alert(`${title}: ${text}`);
            this.resetFormState();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Change Password System...');
    window.changePasswordSystem = new ChangePasswordSystem();
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.changePasswordSystem && window.changePasswordSystem.isSubmitting) {
        return 'Hay un cambio de contraseña en proceso. ¿Está seguro que desea salir?';
    }
});