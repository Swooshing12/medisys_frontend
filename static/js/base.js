// =============================================
// MEDISYS BASE.JS - FUNCIONALIDAD COMPLETA
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 MediSys System initialized');
    
    // ========================================
    // REFERENCIAS A ELEMENTOS
    // ========================================
    
    // Elementos del sidebar (compatibilidad con ambas versiones)
    const sidebarToggle = document.getElementById('medisysSidebarToggle') || document.getElementById('sidebarToggle');
    const mainSidebar = document.getElementById('medisysSidebar') || document.getElementById('mainSidebar');
    const mainContent = document.getElementById('medisysMainContent') || document.getElementById('mainContent');
    const overlay = document.getElementById('medisysSidebarOverlay');
    
    console.log('📱 Elements found:', {
        toggle: !!sidebarToggle,
        sidebar: !!mainSidebar,
        content: !!mainContent,
        overlay: !!overlay
    });
    
    // ========================================
    // FUNCIONES PRINCIPALES DEL SIDEBAR
    // ========================================
    
    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            // Comportamiento MOBILE
            if (mainSidebar.classList.contains('medisys-sidebar')) {
                // Nuevo sistema MediSys
                mainSidebar.classList.toggle('medisys-show');
                if (overlay) overlay.classList.toggle('medisys-show');
                document.body.classList.toggle('medisys-sidebar-open');
            } else {
                // Sistema legacy
                mainSidebar.classList.toggle('show');
                document.body.classList.toggle('sidebar-open');
            }
            
            console.log('📱 Mobile sidebar toggled');
        } else {
            // Comportamiento DESKTOP
            if (mainSidebar.classList.contains('medisys-sidebar')) {
                // Nuevo sistema MediSys
                mainSidebar.classList.toggle('medisys-collapsed');
                mainContent.classList.toggle('medisys-expanded');
                
                // Guardar estado
                const isCollapsed = mainSidebar.classList.contains('medisys-collapsed');
                localStorage.setItem('medisysSidebarCollapsed', isCollapsed);
                
                // Animar ícono del toggle
                const toggleIcon = sidebarToggle.querySelector('i');
                if (toggleIcon) {
                    toggleIcon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
                    toggleIcon.style.transition = 'transform 0.3s ease';
                }
            } else {
                // Sistema legacy
                mainSidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
                
                const isCollapsed = mainSidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            }
            
            console.log('💻 Desktop sidebar toggled');
        }
    }
    
    function restoreSidebarState() {
        if (window.innerWidth > 768) {
            // Restaurar estado para sistema MediSys
            const medisysCollapsed = localStorage.getItem('medisysSidebarCollapsed') === 'true';
            if (medisysCollapsed && mainSidebar.classList.contains('medisys-sidebar')) {
                mainSidebar.classList.add('medisys-collapsed');
                mainContent.classList.add('medisys-expanded');
                
                const toggleIcon = sidebarToggle.querySelector('i');
                if (toggleIcon) {
                    toggleIcon.style.transform = 'rotate(180deg)';
                    toggleIcon.style.transition = 'transform 0.3s ease';
                }
            }
            
            // Restaurar estado para sistema legacy
            const legacyCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (legacyCollapsed && !mainSidebar.classList.contains('medisys-sidebar')) {
                mainSidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        }
        
        console.log('🔄 Sidebar state restored');
    }
    
    function handleResize() {
        if (window.innerWidth <= 768) {
            // En mobile, limpiar estados de desktop
            if (mainSidebar.classList.contains('medisys-sidebar')) {
                mainSidebar.classList.remove('medisys-collapsed');
                mainContent.classList.remove('medisys-expanded');
            } else {
                mainSidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
            }
            
            // Resetear ícono del toggle
            const toggleIcon = sidebarToggle.querySelector('i');
            if (toggleIcon) {
                toggleIcon.style.transform = 'rotate(0deg)';
            }
        } else {
            // En desktop, limpiar estados de mobile
            if (mainSidebar.classList.contains('medisys-sidebar')) {
                mainSidebar.classList.remove('medisys-show');
                if (overlay) overlay.classList.remove('medisys-show');
                document.body.classList.remove('medisys-sidebar-open');
                
                // Restaurar estado de desktop
                restoreSidebarState();
            } else {
                mainSidebar.classList.remove('show');
                document.body.classList.remove('sidebar-open');
            }
        }
        
        console.log('📐 Window resized, sidebar adjusted');
    }
    
    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSidebar();
        });
        console.log('✅ Sidebar toggle listener attached');
    }
    
    // Cerrar sidebar en mobile con overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            mainSidebar.classList.remove('medisys-show');
            overlay.classList.remove('medisys-show');
            document.body.classList.remove('medisys-sidebar-open');
            console.log('📱 Sidebar closed via overlay');
        });
    }
    
    // Cerrar sidebar en mobile al hacer click fuera (legacy)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && !mainSidebar.classList.contains('medisys-sidebar')) {
            if (!mainSidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                mainSidebar.classList.remove('show');
                document.body.classList.remove('sidebar-open');
            }
        }
    });
    // Manejar redimensionado de ventana
   window.addEventListener('resize', handleResize);
   
   // ========================================
   // INICIALIZACIÓN
   // ========================================
   
   // Restaurar estado del sidebar al cargar
   restoreSidebarState();
   
   // Ejecutar handleResize al cargar para ajustes iniciales
   handleResize();
   
   // ========================================
   // AUTO-DISMISS ALERTS
   // ========================================
   
   const alerts = document.querySelectorAll('.alert:not(.alert-important), .medisys-alert:not(.medisys-alert-important)');
   alerts.forEach(alert => {
       setTimeout(() => {
           if (alert.parentNode) {
               // Usar Bootstrap Alert si está disponible
               if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                   const bsAlert = new bootstrap.Alert(alert);
                   bsAlert.close();
               } else {
                   // Fallback manual
                   alert.classList.remove('show');
                   setTimeout(() => {
                       if (alert.parentNode) {
                           alert.remove();
                       }
                   }, 150);
               }
           }
       }, 5000);
   });
   
   console.log('⏰ Auto-dismiss alerts configured');
   
   // ========================================
   // TOOLTIPS Y POPOVERS
   // ========================================
   
   // Activar tooltips de Bootstrap si están disponibles
   if (typeof bootstrap !== 'undefined') {
       const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
       tooltipTriggerList.map(function (tooltipTriggerEl) {
           return new bootstrap.Tooltip(tooltipTriggerEl);
       });
       
       // Activar popovers si están disponibles
       const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
       popoverTriggerList.map(function (popoverTriggerEl) {
           return new bootstrap.Popover(popoverTriggerEl);
       });
       
       console.log('🎯 Bootstrap tooltips and popovers initialized');
   }
   
   // ========================================
   // VERIFICACIÓN DE SESIÓN
   // ========================================
   
   let sessionCheckInterval;
   
   function startSessionCheck() {
       // Verificar sesión cada 5 minutos
       sessionCheckInterval = setInterval(checkSession, 5 * 60 * 1000);
       console.log('⏱️ Session check started (5 min intervals)');
   }
   
   function checkSession() {
       fetch(window.location.pathname, {
           method: 'HEAD',
           credentials: 'same-origin',
           cache: 'no-cache'
       }).then(response => {
           if (response.redirected || response.status === 401) {
               console.log('⚠️ Session expired, redirecting to login...');
               handleSessionExpired();
           } else if (response.ok) {
               console.log('✅ Session is valid');
           }
       }).catch(error => {
           console.log('⚠️ Session check failed:', error);
           // No mostrar error si es problema de red temporal
       });
   }
   
   function handleSessionExpired() {
       // Limpiar interval
       if (sessionCheckInterval) {
           clearInterval(sessionCheckInterval);
       }
       
       // Mostrar alerta de sesión expirada
       if (typeof Swal !== 'undefined') {
           Swal.fire({
               icon: 'warning',
               title: 'Sesión Expirada',
               text: 'Su sesión ha expirado por seguridad. Será redirigido al login.',
               timer: 4000,
               timerProgressBar: true,
               showConfirmButton: false,
               allowOutsideClick: false,
               allowEscapeKey: false,
               customClass: {
                   popup: 'medisys-swal-popup'
               }
           }).then(() => {
               // Redirigir al login
               window.location.href = '/auth/login/';
           });
       } else {
           // Fallback sin SweetAlert
           alert('Su sesión ha expirado. Será redirigido al login.');
           window.location.href = '/auth/login/';
       }
   }
   
   // Iniciar verificación de sesión
   startSessionCheck();
   
   // ========================================
   // DETECCIÓN DE INACTIVIDAD
   // ========================================
   
   let inactivityTimer;
   const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos
   
   function resetInactivityTimer() {
       clearTimeout(inactivityTimer);
       inactivityTimer = setTimeout(() => {
           console.log('⚠️ User inactive for 30 minutes');
           if (typeof Swal !== 'undefined') {
               Swal.fire({
                   icon: 'warning',
                   title: 'Inactividad Detectada',
                   text: '¿Sigue utilizando el sistema?',
                   showCancelButton: true,
                   confirmButtonText: 'Sí, continuar',
                   cancelButtonText: 'Cerrar sesión',
                   timer: 60000,
                   timerProgressBar: true,
                   customClass: {
                       popup: 'medisys-swal-popup'
                   }
               }).then((result) => {
                   if (result.isConfirmed) {
                       console.log('👤 User confirmed activity');
                       resetInactivityTimer();
                   } else {
                       console.log('👤 User chose to logout due to inactivity');
                       confirmLogout();
                   }
               });
           }
       }, INACTIVITY_TIME);
   }
   
   // Eventos que resetean el timer de inactividad
   const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
   activityEvents.forEach(event => {
       document.addEventListener(event, resetInactivityTimer, true);
   });
   
   // Iniciar timer de inactividad
   resetInactivityTimer();
   console.log('⏰ Inactivity detection started (30 min)');
   
   // ========================================
   // MEJORAS DE UX
   // ========================================
   
   // Smooth scroll para enlaces internos
   document.querySelectorAll('a[href^="#"]').forEach(anchor => {
       anchor.addEventListener('click', function (e) {
           const target = document.querySelector(this.getAttribute('href'));
           if (target) {
               e.preventDefault();
               target.scrollIntoView({
                   behavior: 'smooth',
                   block: 'start'
               });
           }
       });
   });
   
   // Animación de entrada para elementos con clase .animate-on-load
   const animateElements = document.querySelectorAll('.animate-on-load');
   animateElements.forEach((element, index) => {
       element.style.opacity = '0';
       element.style.transform = 'translateY(20px)';
       
       setTimeout(() => {
           element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
           element.style.opacity = '1';
           element.style.transform = 'translateY(0)';
       }, index * 100);
   });
   
   console.log('✨ UX enhancements loaded');
   console.log('✅ MediSys System fully initialized');
});

// =============================================
// FUNCIONES GLOBALES DE LA APLICACIÓN
// =============================================

/**
* Mostrar información personal del usuario
*/
function showUserInfo() {
   console.log('👤 Showing user info');
   
   // Verificar si existe la URL del perfil
   const profileUrl = '/core/user-profile/'; // Ajustar según tu configuración
   
   // Verificar si la página del perfil existe
   fetch(profileUrl, { method: 'HEAD' })
       .then(response => {
           if (response.ok) {
               window.location.href = profileUrl;
           } else {
               // Fallback: mostrar modal con información básica
               showUserInfoModal();
           }
       })
       .catch(() => {
           showUserInfoModal();
       });
}

/**
* Modal de información del usuario (fallback)
*/
function showUserInfoModal() {
   if (typeof Swal !== 'undefined') {
       // Obtener datos del usuario desde el DOM
       const userName = document.querySelector('.medisys-user-name, .user-name')?.textContent || 'Usuario';
       const userRole = document.querySelector('.medisys-user-role, .user-role')?.textContent || 'Sin rol';
       const userCedula = document.querySelector('.medisys-user-details small')?.textContent || 'No disponible';
       
       Swal.fire({
           icon: 'info',
           title: 'Información Personal',
           html: `
               <div class="medisys-user-info-modal">
                   <div class="user-avatar-modal">
                       <i class="fas fa-user-circle fa-4x text-primary"></i>
                   </div>
                   <div class="user-details-modal mt-3">
                       <p><strong>Nombre:</strong> ${userName}</p>
                       <p><strong>Rol:</strong> ${userRole}</p>
                       <p><strong>Cédula:</strong> ${userCedula}</p>
                       <p><strong>Estado:</strong> <span class="text-success">Activo</span></p>
                   </div>
               </div>
           `,
           confirmButtonText: '<i class="fas fa-check"></i> Cerrar',
           customClass: {
               popup: 'medisys-swal-popup'
           }
       });
   } else {
       alert('Información del usuario no disponible en este momento.');
   }
}

/**
* Confirmar logout con SweetAlert personalizado
*/
function confirmLogout() {
   console.log('🚪 Logout confirmation requested');
   
   if (typeof Swal !== 'undefined') {
       Swal.fire({
           icon: 'question',
           title: '¿Cerrar Sesión?',
           text: '¿Está seguro que desea salir del sistema MediSys?',
           showCancelButton: true,
           confirmButtonColor: '#e74c3c',
           cancelButtonColor: '#95a5a6',
           confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Sí, cerrar sesión',
           cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
           customClass: {
               popup: 'medisys-swal-popup',
               confirmButton: 'medisys-swal-confirm',
               cancelButton: 'medisys-swal-cancel'
           },
           background: '#fff',
           backdrop: 'rgba(44, 62, 80, 0.6)',
           allowOutsideClick: false
       }).then((result) => {
           if (result.isConfirmed) {
               // Mostrar loading
               Swal.fire({
                   title: 'Cerrando sesión...',
                   html: 'Por favor espere mientras procesamos su solicitud...',
                   allowOutsideClick: false,
                   allowEscapeKey: false,
                   showConfirmButton: false,
                   customClass: {
                       popup: 'medisys-swal-popup'
                   },
                   didOpen: () => {
                       Swal.showLoading();
                   }
               });

               // Crear y enviar formulario de logout
               const form = document.createElement('form');
               form.method = 'POST';
               form.action = '/auth/logout/'; // Ajustar según tu configuración
               
               // Obtener CSRF token
               const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                               document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ||
                               getCookie('csrftoken');
               
               if (csrfToken) {
                   const csrf = document.createElement('input');
                   csrf.type = 'hidden';
                   csrf.name = 'csrfmiddlewaretoken';
                   csrf.value = csrfToken;
                   form.appendChild(csrf);
               }
               
               document.body.appendChild(form);
               
               // Delay para mostrar el loading
               setTimeout(() => {
                   form.submit();
               }, 1000);
               
               console.log('🚪 Logout form submitted');
           } else {
               console.log('🚪 Logout cancelled by user');
           }
       });
   } else {
       // Fallback sin SweetAlert
       if (confirm('¿Está seguro que desea cerrar sesión?')) {
           window.location.href = '/auth/logout/';
       }
   }
}

/**
* Mostrar mensaje de funcionalidad próximamente
*/
function showComingSoon(feature) {
   console.log('🚧 Coming soon requested for:', feature);
   
   if (typeof Swal !== 'undefined') {
       Swal.fire({
           icon: 'info',
           title: 'Funcionalidad en Desarrollo',
           html: `
               <div class="medisys-coming-soon">
                   <i class="fas fa-tools medisys-coming-soon-icon fa-3x text-primary mb-3"></i>
                   <p>La funcionalidad <strong>"${feature}"</strong> está siendo desarrollada por nuestro equipo.</p>
                   <p class="text-muted">Estará disponible en una próxima actualización del sistema MediSys.</p>
                   <div class="mt-3">
                       <small class="text-info">
                           <i class="fas fa-info-circle"></i>
                           Mientras tanto, puede utilizar las funcionalidades disponibles en el menú.
                       </small>
                   </div>
               </div>
           `,
           confirmButtonColor: '#3498db',
           confirmButtonText: '<i class="fas fa-check"></i> Entendido',
           customClass: {
               popup: 'medisys-swal-popup'
           },
           timer: 8000,
           timerProgressBar: true
       });
   } else {
       alert(`La funcionalidad "${feature}" estará disponible próximamente.`);
   }
}

/**
* Mostrar notificación de éxito
*/
function showSuccessNotification(title, message, timer = 3000) {
   if (typeof Swal !== 'undefined') {
       Swal.fire({
           icon: 'success',
           title: title,
           text: message,
           timer: timer,
           timerProgressBar: true,
           showConfirmButton: false,
           toast: true,
           position: 'top-end',
           customClass: {
               popup: 'medisys-toast-popup'
           }
       });
   }
}

/**
* Mostrar notificación de error
*/
function showErrorNotification(title, message, timer = 5000) {
   if (typeof Swal !== 'undefined') {
       Swal.fire({
           icon: 'error',
           title: title,
           text: message,
           timer: timer,
           timerProgressBar: true,
           showConfirmButton: true,
           confirmButtonText: 'Cerrar',
           customClass: {
               popup: 'medisys-swal-popup'
           }
       });
   }
}

/**
* Función para obtener cookie (para CSRF token)
*/
function getCookie(name) {
   let cookieValue = null;
   if (document.cookie && document.cookie !== '') {
       const cookies = document.cookie.split(';');
       for (let i = 0; i < cookies.length; i++) {
           const cookie = cookies[i].trim();
           if (cookie.substring(0, name.length + 1) === (name + '=')) {
               cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
               break;
           }
       }
   }
   return cookieValue;
}

/**
* Validar formularios de manera global
*/
function validateForm(formElement) {
   if (!formElement) return false;
   
   const requiredFields = formElement.querySelectorAll('[required]');
   let isValid = true;
   
   requiredFields.forEach(field => {
       if (!field.value.trim()) {
           field.classList.add('is-invalid');
           isValid = false;
       } else {
           field.classList.remove('is-invalid');
           field.classList.add('is-valid');
       }
   });
   
   return isValid;
}

/**
* Formatear números como moneda
*/
function formatCurrency(amount, currency = 'USD') {
   return new Intl.NumberFormat('es-EC', {
       style: 'currency',
       currency: currency
   }).format(amount);
}

/**
* Formatear fechas
*/
function formatDate(date, locale = 'es-EC') {
   return new Date(date).toLocaleDateString(locale, {
       year: 'numeric',
       month: 'long',
       day: 'numeric'
   });
}

/**
* Copiar texto al portapapeles
*/
function copyToClipboard(text, successMessage = 'Copiado al portapapeles') {
   if (navigator.clipboard) {
       navigator.clipboard.writeText(text).then(() => {
           showSuccessNotification('¡Copiado!', successMessage, 2000);
       }).catch(() => {
           fallbackCopyText(text);
       });
   } else {
       fallbackCopyText(text);
   }
}

function fallbackCopyText(text) {
   const textArea = document.createElement('textarea');
   textArea.value = text;
   document.body.appendChild(textArea);
   textArea.focus();
   textArea.select();
   
   try {
       document.execCommand('copy');
       showSuccessNotification('¡Copiado!', 'Texto copiado al portapapeles', 2000);
   } catch (err) {
       console.error('Error copying text: ', err);
   }
   
   document.body.removeChild(textArea);
}

// =============================================
// ESTILOS CSS PARA SWEETALERT (Si no están en CSS)
// =============================================

// Inyectar estilos para SweetAlert si no están definidos
if (typeof Swal !== 'undefined' && !document.querySelector('#medisys-swal-styles')) {
   const style = document.createElement('style');
   style.id = 'medisys-swal-styles';
   style.textContent = `
       .medisys-swal-popup {
           border-radius: 15px !important;
           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
       }
       
       .medisys-swal-confirm {
           border-radius: 8px !important;
           font-weight: 500 !important;
       }
       
       .medisys-swal-cancel {
           border-radius: 8px !important;
           font-weight: 500 !important;
       }
       
       .medisys-coming-soon {
           text-align: center;
           padding: 20px;
       }
       
       .medisys-coming-soon-icon {
           color: #3498db;
           margin-bottom: 15px;
       }
       
       .medisys-toast-popup {
           font-size: 14px !important;
       }
       
       .medisys-user-info-modal {
           text-align: center;
           padding: 10px;
       }
       
       .user-avatar-modal {
           margin-bottom: 20px;
       }
       
       .user-details-modal p {
           margin-bottom: 10px;
           text-align: left;
       }
   `;
   document.head.appendChild(style);
}

console.log('🎯 MediSys Base.js fully loaded and ready!');