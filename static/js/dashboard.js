// ===== DASHBOARD.JS - FUNCIONALIDAD DEL LAYOUT =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 MediSys Dashboard initialized');
    
    // Referencias a elementos
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainSidebar = document.getElementById('mainSidebar');
    const mainContent = document.getElementById('mainContent');
    
    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Función para toggle sidebar
    function toggleSidebar() {
        mainSidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // Guardar estado en localStorage
        const isCollapsed = mainSidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        
        console.log('📱 Sidebar toggled:', isCollapsed ? 'collapsed' : 'expanded');
    }
    
    // Restaurar estado del sidebar
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        mainSidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
    
    // Auto-hide sidebar en móviles
    function handleResize() {
        if (window.innerWidth <= 992) {
            mainSidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Ejecutar al cargar
    
    // Cerrar sidebar en móviles al hacer click fuera
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            if (!mainSidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                mainSidebar.classList.remove('show');
            }
        }
    });
    
    // Mostrar sidebar en móviles
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                mainSidebar.classList.toggle('show');
            }
        });
    }
    
    // Auto-dismiss alerts después de 5 segundos
    const alerts = document.querySelectorAll('.alert:not(.alert-important)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    // Activar tooltips si hay
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Verificación de sesión periódica
    setInterval(checkSession, 5 * 60 * 1000); // Cada 5 minutos
    
    function checkSession() {
        fetch(window.location.pathname, {
            method: 'HEAD',
            credentials: 'same-origin'
        }).then(response => {
            if (response.redirected || response.status === 401) {
                console.log('⚠️ Session expired, redirecting to login...');
                Swal.fire({
                    icon: 'warning',
                    title: 'Sesión Expirada',
                    text: 'Su sesión ha expirado. Será redirigido al login.',
                    timer: 3000,
                    showConfirmButton: false,
                    allowOutsideClick: false
                }).then(() => {
                    window.location.href = '/auth/login/';
                });
            }
        }).catch(error => {
            console.log('⚠️ Session check failed:', error);
        });
    }
    
    console.log('✅ Dashboard features loaded');
});