from django.shortcuts import redirect
from django.contrib import messages
from django.urls import reverse
import logging

logger = logging.getLogger(__name__)

class AuthenticationMiddleware:
    """Middleware para verificar autenticación en todas las vistas protegidas"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        # URLs que NO requieren autenticación
        self.public_urls = [
            '/auth/login/',
            '/auth/forgot-password/',
            '/admin/',
            '/static/',
            '/favicon.ico'
        ]
    
    def __call__(self, request):
        # Verificar si la URL requiere autenticación
        path = request.path
        needs_auth = not any(path.startswith(public_url) for public_url in self.public_urls)
        
        if needs_auth:
            # Verificar si el usuario está autenticado
            user_data = request.session.get('user_data')
            is_authenticated = request.session.get('is_authenticated', False)
            
            if not user_data or not is_authenticated:
                logger.warning(f"🚫 UNAUTHORIZED ACCESS ATTEMPT: {path} from {request.META.get('REMOTE_ADDR', 'unknown')}")
                
                # Limpiar cualquier sesión corrupta
                request.session.flush()
                
                messages.warning(request, 'Debe iniciar sesión para acceder a esta página')
                return redirect('authentication:login')
            
            # Log de acceso autorizado
            logger.info(f"✅ AUTHORIZED ACCESS: {user_data.get('correo', 'unknown')} to {path}")
        
        response = self.get_response(request)
        return response