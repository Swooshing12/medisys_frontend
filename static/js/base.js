// ===== BASE.JS - FUNCIONALIDADES PRINCIPALES =====

class MediSysBase {
    constructor() {
        this.init();
    }

    init() {
        this.initClock();
        this.initSidebar();
        this.initUserDropdown();
        this.initGlobalEvents();
    }

    // ✅ RELOJ EN TIEMPO REAL
    initClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('es-ES', { 
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.innerHTML = `
                <div class="time">${timeString}</div>
                <div class="date">${dateString}</div>
            `;
        }
    }

    // ✅ SIDEBAR TOGGLE
    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('mainSidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebarToggle && sidebar && mainContent) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('sidebar-collapsed');
                
                // Guardar estado en localStorage
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });

            // Restaurar estado del sidebar
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('sidebar-collapsed');
            }
        }
    }

    // ✅ DROPDOWN DE USUARIO
    initUserDropdown() {
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            const dropdowns = document.querySelectorAll('.dropdown-menu.show');
            dropdowns.forEach(dropdown => {
                if (!dropdown.closest('.dropdown').contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });
        });
    }

    // ✅ EVENTOS GLOBALES
    initGlobalEvents() {
        // Mejorar UX de los enlaces del menú
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Agregar efecto de loading para navegación
                if (!link.getAttribute('onclick')) {
                    this.showNavigationLoading();
                }
            });
        });

        // Auto-hide alerts después de 5 segundos
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(alert => {
            setTimeout(() => {
                if (alert && alert.parentNode) {
                    alert.style.transition = 'opacity 0.5s ease';
                    alert.style.opacity = '0';
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.remove();
                        }
                    }, 500);
                }
            }, 5000);
        });
    }

    // ✅ FUNCIONES PRINCIPALES
    showUserInfo() {
        if (window.DJANGO_URLS && window.DJANGO_URLS.userProfile) {
            window.location.href = window.DJANGO_URLS.userProfile;
        } else {
            console.error('URL de perfil de usuario no definida');
        }
    }

    // ✅ FUNCIÓN CORREGIDA PARA LOGOUT
confirmLogout() {
    Swal.fire({
        icon: 'question',
        title: '¿Cerrar Sesión?',
        text: '¿Está seguro que desea salir del sistema MediSys?',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Sí, cerrar sesión',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        reverseButtons: true,
        customClass: {
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            // ✅ LOGOUT DIRECTO SIN LOADING QUE SE BUGEA
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = window.DJANGO_URLS.logout;
            
            const csrf = document.createElement('input');
            csrf.type = 'hidden';
            csrf.name = 'csrfmiddlewaretoken';
            csrf.value = window.CSRF_TOKEN;
            form.appendChild(csrf);
            
            document.body.appendChild(form);
            form.submit();
        }
    });
}

    performLogout() {
        // Mostrar loading
        Swal.fire({
            icon: 'info',
            title: 'Cerrando sesión...',
            text: 'Por favor espere...',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Crear formulario para enviar POST al logout
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = window.DJANGO_URLS.logout;
        
        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = 'csrfmiddlewaretoken';
        csrf.value = window.CSRF_TOKEN;
        form.appendChild(csrf);
        
        document.body.appendChild(form);
        form.submit();
    }

    showComingSoon(feature) {
        Swal.fire({
            icon: 'info',
            title: 'Funcionalidad en Desarrollo',
            html: `
                <div class="coming-soon-content">
                    <i class="fas fa-tools fa-3x text-primary mb-3"></i>
                    <p>La funcionalidad <strong>"${feature}"</strong> está siendo desarrollada.</p>
                    <p class="text-muted">Estará disponible en una próxima actualización del sistema.</p>
                    <div class="progress mt-3">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: 60%"></div>
                    </div>
                    <small class="text-muted">Progreso estimado: 60%</small>
                </div>
            `,
            confirmButtonColor: '#007bff',
            confirmButtonText: '<i class="fas fa-check"></i> Entendido',
            customClass: {
                confirmButton: 'btn btn-primary'
            },
            buttonsStyling: false
        });
    }

    showNavigationLoading() {
        // Mostrar indicador de carga para navegación
        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true
        });

        toast.fire({
            icon: 'info',
            title: 'Cargando...'
        });
    }

    // ✅ UTILIDADES
    showToast(type, message, duration = 3000) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: duration,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }

    showError(message) {
        this.showToast('error', message, 5000);
    }

    showSuccess(message) {
        this.showToast('success', message, 3000);
    }

    showWarning(message) {
        this.showToast('warning', message, 4000);
    }

    showInfo(message) {
        this.showToast('info', message, 3000);
    }
}

// ✅ INICIALIZAR CUANDO EL DOM ESTÉ LISTO
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia global
    window.mediSysBase = new MediSysBase();
    
    console.log('🏥 MediSys Base System initialized successfully');
});

// ✅ FUNCIONES GLOBALES PARA EL HTML (mantenemos compatibilidad)
function showUserInfo() {
    if (window.mediSysBase) {
        window.mediSysBase.showUserInfo();
    }
}

function confirmLogout() {
    if (window.mediSysBase) {
        window.mediSysBase.confirmLogout();
    }
}

function showComingSoon(feature) {
    if (window.mediSysBase) {
        window.mediSysBase.showComingSoon(feature);
    }
}

// ✅ UTILIDADES GLOBALES
function showToast(type, message, duration) {
    if (window.mediSysBase) {
        window.mediSysBase.showToast(type, message, duration);
    }
}

function showError(message) {
    if (window.mediSysBase) {
        window.mediSysBase.showError(message);
    }
}

function showSuccess(message) {
    if (window.mediSysBase) {
        window.mediSysBase.showSuccess(message);
    }
}