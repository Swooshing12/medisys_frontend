from django.shortcuts import render, redirect
from django.views import View
from django.contrib import messages
from django.urls import reverse
from core.services import get_api_service  # ✅ CAMBIO AQUÍ
import logging

logger = logging.getLogger(__name__)

class LoginView(View):
    """
    ✅ PUNTO 1: Pantalla de inicio de sesión funcional con validación
    ✅ PUNTO 3: Autenticación exitosa usando la API
    ✅ PUNTO 9: Manejo de errores visible en el frontend
    🔒 SEGURIDAD: Sistema de 3 intentos del API manteniendo sesión
    """
    template_name = 'authentication/login.html'
    
    def get(self, request):
        # Si ya está logueado, redirigir al dashboard
        if request.session.get('user_data'):
            return redirect('core:dashboard')
        
        return render(request, self.template_name)
    
    def post(self, request):
        # Obtener datos del formulario
        correo = request.POST.get('correo', '').strip()
        password = request.POST.get('password', '')
        
        # ✅ VALIDACIONES FRONTEND BÁSICAS
        if not correo or not password:
            messages.error(request, 'Complete todos los campos requeridos')
            return render(request, self.template_name, {'correo': correo})
        
        if '@' not in correo:
            messages.error(request, 'Ingrese un formato de correo válido')
            return render(request, self.template_name, {'correo': correo})
        
        # ✅ USAR INSTANCIA GLOBAL PARA MANTENER SESIÓN
        api_service = get_api_service()
        
        # Log para evidencia (PUNTO 10)
        logger.info(f"🔄 LOGIN ATTEMPT: {correo}")
        
        result = api_service.login(correo, password)
        
        # Log del resultado completo para debug
        logger.info(f"📋 API COMPLETE RESPONSE: {result}")
        
        if result.get('success', False):
            # ✅ LOGIN EXITOSO
            user_data = result.get('data', {}).get('usuario', {})

            if user_data.get('requiere_cambio_password', False):
                request.session['user_data'] = user_data
                messages.info(request, 'Debe cambiar su contraseña temporal para continuar')
                return redirect('authentication:change_password')
            
            # Guardar datos en sesión
            request.session['user_data'] = user_data
            request.session['is_authenticated'] = True
            
            # Log de éxito
            logger.info(f"✅ LOGIN SUCCESS: {correo} - Rol: {user_data.get('rol', 'N/A')}")
            
            # Mensaje de éxito
            nombres = user_data.get('nombres', 'Usuario')
            messages.success(request, f"¡Bienvenido, {nombres}!")
            
            # Redirección al dashboard
            return redirect('core:dashboard')
        
        else:
            # ✅ PUNTO 9: Usar el mensaje EXACTO del API
            api_message = result.get('message', 'Error de autenticación')
            api_code = result.get('code', 'N/A')
            api_timestamp = result.get('timestamp', 'N/A')
            
            # Log del error exacto con todos los detalles
            logger.warning(f"❌ LOGIN FAILED: {correo}")
            logger.warning(f"📋 API Message: {api_message}")
            logger.warning(f"📋 API Code: {api_code}")
            logger.warning(f"📋 API Timestamp: {api_timestamp}")
            
            # 🔒 PASAR EL MENSAJE EXACTO DEL API (incluyendo bloqueos)
            messages.error(request, api_message)
            
            return render(request, self.template_name, {
                'correo': correo,
                'api_message': api_message,
                'api_code': api_code
            })
   
        

        

class LogoutView(View):
    """Vista mejorada para cerrar sesión"""
    
    def get(self, request):
        return self.logout_user(request)
    
    def post(self, request):
        return self.logout_user(request)
    
    def logout_user(self, request):
        # Log de logout
        user_data = request.session.get('user_data', {})
        if user_data:
            logger.info(f"👋 LOGOUT: {user_data.get('correo', 'unknown')} from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        # ✅ LIMPIAR COMPLETAMENTE LA SESIÓN
        request.session.flush()
        
        # ✅ LIMPIAR CUALQUIER CACHE DEL NAVEGADOR
        response = redirect('authentication:login')
        
        # Headers para evitar cache
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        messages.info(request, 'Sesión cerrada correctamente')
        
        return response

    


class ForgotPasswordView(View):
    """
    ✅ PUNTO 2: Vista para solicitar clave temporal
    """
    template_name = 'authentication/forgot_password.html'
    
    def get(self, request):
        return render(request, self.template_name)
    
    def post(self, request):
        correo = request.POST.get('correo', '').strip()
        
        # Validaciones básicas
        if not correo:
            messages.error(request, 'El correo electrónico es requerido')
            return render(request, self.template_name, {'correo': correo})
        
        if '@' not in correo:
            messages.error(request, 'Ingrese un formato de correo válido')
            return render(request, self.template_name, {'correo': correo})
        
        # Consumir API
        api_service = get_api_service()
        result = api_service.enviar_clave_temporal(correo)
        
        logger.info(f"🔑 RECOVERY REQUEST: {correo} - Result: {result.get('success', False)}")
        
        if result.get('success', False):
            # Siempre mostrar éxito por seguridad
            messages.success(request, result.get('data', {}).get('mensaje_usuario', 
                'Si el correo existe, recibirás una clave temporal.'))
            return render(request, self.template_name, {'correo': correo, 'success': True})
        else:
            messages.error(request, result.get('message', 'Error procesando la solicitud'))
            return render(request, self.template_name, {'correo': correo})

class ChangePasswordView(View):
    """
    ✅ PUNTO 2: Vista para cambiar contraseña temporal
    """
    template_name = 'authentication/change_password.html'
    
    def get(self, request):
        # Verificar que venga de un login con estado pendiente
        user_data = request.session.get('user_data')
        if not user_data or not user_data.get('requiere_cambio_password'):
            messages.warning(request, 'Acceso no autorizado')
            return redirect('authentication:login')
        
        return render(request, self.template_name, {'user_data': user_data})
    
    def post(self, request):
        user_data = request.session.get('user_data')
        if not user_data or not user_data.get('requiere_cambio_password'):
            return redirect('authentication:login')
        
        # Obtener datos del formulario
        password_temporal = request.POST.get('password_temporal', '')
        password_nueva = request.POST.get('password_nueva', '')
        confirmar_password = request.POST.get('confirmar_password', '')
        
        # Validaciones básicas
        errors = []
        if not password_temporal:
            errors.append('La contraseña temporal es requerida')
        if not password_nueva:
            errors.append('La nueva contraseña es requerida')
        if not confirmar_password:
            errors.append('Debe confirmar la nueva contraseña')
        if password_nueva != confirmar_password:
            errors.append('Las contraseñas no coinciden')
        
        if errors:
            for error in errors:
                messages.error(request, error)
            return render(request, self.template_name, {'user_data': user_data})
        
        # Consumir API para cambiar contraseña
        api_service = get_api_service()
        result = api_service.cambiar_password_temporal(
            user_data['correo'],
            password_temporal,
            password_nueva,
            confirmar_password
        )
        
        logger.info(f"🔄 PASSWORD CHANGE: {user_data['correo']} - Result: {result.get('success', False)}")
        
        if result.get('success', False):
            # Limpiar sesión temporal
            request.session.pop('user_data', None)
            
            messages.success(request, 'Contraseña cambiada exitosamente. Puede iniciar sesión con su nueva contraseña.')
            return redirect('authentication:login')
        else:
            api_message = result.get('message', 'Error cambiando contraseña')
            messages.error(request, api_message)
            return render(request, self.template_name, {'user_data': user_data})


class ChangePasswordLoggedView(View):
    """
    ✅ PUNTO 2: Vista para cambiar contraseña de usuario logueado
    """
    template_name = 'authentication/change_password_logged.html'
    
    def dispatch(self, request, *args, **kwargs):
        """Verificar autenticación antes de cualquier método"""
        if not self.is_authenticated(request):
            return self.handle_unauthenticated(request)
        
        return super().dispatch(request, *args, **kwargs)
    
    def is_authenticated(self, request):
        """Verificar si el usuario está autenticado"""
        user_data = request.session.get('user_data')
        is_authenticated = request.session.get('is_authenticated', False)
        
        return user_data and is_authenticated
    
    def handle_unauthenticated(self, request):
        """Manejar acceso no autenticado"""
        logger.warning(f"🚫 UNAUTHENTICATED CHANGE PASSWORD ACCESS from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        request.session.flush()
        messages.warning(request, 'Su sesión ha expirado. Inicie sesión nuevamente.')
        return redirect('authentication:login')
    
    def get(self, request):
        user_data = request.session.get('user_data', {})
        
        # Log de acceso
        logger.info(f"🔐 CHANGE PASSWORD ACCESS: {user_data.get('correo', 'unknown')}")
        
        return render(request, self.template_name, {'user_data': user_data})
    
    def post(self, request):
        user_data = request.session.get('user_data', {})
        
        # Obtener datos del formulario
        password_actual = request.POST.get('password_actual', '')
        password_nueva = request.POST.get('password_nueva', '')
        confirmar_password = request.POST.get('confirmar_password', '')
        
        # Validaciones básicas
        errors = []
        if not password_actual:
            errors.append('La contraseña actual es requerida')
        if not password_nueva:
            errors.append('La nueva contraseña es requerida')
        if not confirmar_password:
            errors.append('Debe confirmar la nueva contraseña')
        if password_nueva and confirmar_password and password_nueva != confirmar_password:
            errors.append('Las contraseñas no coinciden')
        if password_actual and password_nueva and password_actual == password_nueva:
            errors.append('La nueva contraseña debe ser diferente a la actual')
        
        if errors:
            for error in errors:
                messages.error(request, error)
            return render(request, self.template_name, {'user_data': user_data})
        
        # Consumir API para cambiar contraseña
        api_service = get_api_service()
        result = api_service.cambiar_password_usuario_logueado(
            user_data['id_usuario'],
            password_actual,
            password_nueva,
            confirmar_password
        )
        
        logger.info(f"🔄 PASSWORD CHANGE ATTEMPT: {user_data['correo']} - Result: {result.get('success', False)}")
        
        if result.get('success', False):
            # Cambio exitoso
            messages.success(request, 'Contraseña cambiada exitosamente.')
            
            # Log de éxito
            logger.info(f"✅ PASSWORD CHANGED: {user_data['correo']}")
            
            return redirect('core:user_profile')
        else:
            # Error al cambiar
            api_message = result.get('message', 'Error cambiando contraseña')
            
            # Manejar errores específicos
            if 'data' in result and result['data']:
                # Si hay errores de validación específicos
                error_details = result['data']
                if isinstance(error_details, list):
                    for detail in error_details:
                        messages.error(request, detail)
                else:
                    messages.error(request, api_message)
            else:
                messages.error(request, api_message)
            
            # Log de error
            logger.warning(f"❌ PASSWORD CHANGE FAILED: {user_data['correo']} - {api_message}")
            
            return render(request, self.template_name, {'user_data': user_data})