from django.shortcuts import render, redirect
from django.views import View
from django.contrib import messages
from django.http import JsonResponse
from core.services import get_api_service
import logging

logger = logging.getLogger(__name__)

class DashboardView(View):
    """Dashboard protegido con verificación de sesión"""
    template_name = 'core/dashboard.html'
    
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
        logger.warning(f"🚫 UNAUTHENTICATED DASHBOARD ACCESS from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        # Limpiar sesión
        request.session.flush()
        
        messages.warning(request, 'Su sesión ha expirado. Inicie sesión nuevamente.')
        return redirect('authentication:login')
    
    def get(self, request):
        user_data = request.session.get('user_data', {})
        
        # Log de acceso exitoso
        logger.info(f"📊 DASHBOARD ACCESS: {user_data.get('correo', 'unknown')}")
        
        return render(request, self.template_name, {
            'user_data': user_data
        })

class UserProfileView(View):
    """Vista para información personal del usuario"""
    template_name = 'core/user_profile.html'
    
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
        logger.warning(f"🚫 UNAUTHENTICATED PROFILE ACCESS from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        request.session.flush()
        messages.warning(request, 'Su sesión ha expirado. Inicie sesión nuevamente.')
        return redirect('authentication:login')
    
    def get(self, request):
        user_data = request.session.get('user_data', {})
        
        # Log de acceso
        logger.info(f"👤 PROFILE ACCESS: {user_data.get('correo', 'unknown')}")
        
        return render(request, self.template_name, {
            'user_data': user_data
        })

class HistorialClinicoView(View):
    """Vista para consultar historial clínico por cédula"""
    template_name = 'core/historial_clinico.html'
    
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
        logger.warning(f"🚫 UNAUTHENTICATED HISTORIAL ACCESS from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        request.session.flush()
        messages.warning(request, 'Su sesión ha expirado. Inicie sesión nuevamente.')
        return redirect('authentication:login')
    
    def get(self, request):
        """Mostrar formulario de búsqueda y filtros"""
        user_data = request.session.get('user_data', {})
        
        # Log de acceso
        logger.info(f"📋 HISTORIAL CLINICO ACCESS: {user_data.get('correo', 'unknown')}")
        
        # Obtener datos para filtros
        api_service = get_api_service()
        
        # Cargar especialidades
        especialidades_result = api_service.obtener_especialidades()
        especialidades = especialidades_result.get('data', []) if especialidades_result.get('success') else []
        
        # Cargar sucursales
        sucursales_result = api_service.obtener_sucursales()
        sucursales = sucursales_result.get('data', []) if sucursales_result.get('success') else []
        
        context = {
            'user_data': user_data,
            'especialidades': especialidades,
            'sucursales': sucursales,
        }
        
        return render(request, self.template_name, context)
    
    def post(self, request):
        """Procesar búsqueda de historial"""
        user_data = request.session.get('user_data', {})
        
        # Obtener cédula del formulario
        cedula = request.POST.get('cedula', '').strip()
        
        if not cedula:
            messages.error(request, 'La cédula es requerida')
            return redirect('core:historial_clinico')
        
        # Obtener filtros del formulario
        filtros = {
            'fecha_desde': request.POST.get('fecha_desde', ''),
            'fecha_hasta': request.POST.get('fecha_hasta', ''),
            'id_especialidad': request.POST.get('id_especialidad', ''),
            'id_doctor': request.POST.get('id_doctor', ''),
            'estado': request.POST.get('estado', ''),
            'id_sucursal': request.POST.get('id_sucursal', ''),
        }
        
        # Limpiar filtros vacíos
        filtros = {k: v for k, v in filtros.items() if v}
        
        logger.info(f"🔍 BUSQUEDA HISTORIAL: {cedula} - Filtros: {filtros}")
        
        api_service = get_api_service()
        
        # Paso 1: Verificar que el paciente existe
        paciente_result = api_service.buscar_paciente_por_cedula(cedula)
        
        if not paciente_result.get('success', False):
            messages.error(request, paciente_result.get('message', 'Paciente no encontrado'))
            return redirect('core:historial_clinico')
        
        # Paso 2: Obtener historial con filtros
        historial_result = api_service.obtener_historial_con_filtros(cedula, filtros)
        
        if not historial_result.get('success', False):
            messages.error(request, historial_result.get('message', 'Error obteniendo historial clínico'))
            return redirect('core:historial_clinico')
        
        # Obtener datos para filtros nuevamente
        especialidades_result = api_service.obtener_especialidades()
        especialidades = especialidades_result.get('data', []) if especialidades_result.get('success') else []
        
        sucursales_result = api_service.obtener_sucursales()
        sucursales = sucursales_result.get('data', []) if sucursales_result.get('success') else []
        
        # Obtener doctores si hay especialidad seleccionada
        doctores = []
        if filtros.get('id_especialidad'):
            doctores_result = api_service.obtener_doctores_por_especialidad(filtros['id_especialidad'])
            doctores = doctores_result.get('data', []) if doctores_result.get('success') else []
        
        # Preparar contexto
        paciente_data = paciente_result.get('data', {}).get('paciente', {})
        historial_data = historial_result.get('data', {})
        citas = historial_data.get('citas', [])
        estadisticas = historial_data.get('estadisticas', {})
        
        context = {
            'user_data': user_data,
            'cedula_buscada': cedula,
            'paciente': paciente_data,
            'citas': citas,
            'estadisticas': estadisticas,
            'filtros_aplicados': filtros,
            'especialidades': especialidades,
            'sucursales': sucursales,
            'doctores': doctores,
            'tiene_resultados': len(citas) > 0,
        }
        
        logger.info(f"✅ HISTORIAL ENCONTRADO: {cedula} - {len(citas)} citas")
        
        return render(request, self.template_name, context)

class DoctoresPorEspecialidadView(View):
    """Vista AJAX para obtener doctores de una especialidad"""
    
    def dispatch(self, request, *args, **kwargs):
        if not self.is_authenticated(request):
            return JsonResponse({'success': False, 'message': 'No autenticado'})
        
        return super().dispatch(request, *args, **kwargs)
    
    def is_authenticated(self, request):
        user_data = request.session.get('user_data')
        is_authenticated = request.session.get('is_authenticated', False)
        return user_data and is_authenticated
    
    def get(self, request, id_especialidad):
        """Obtener doctores de una especialidad específica"""
        api_service = get_api_service()
        
        result = api_service.obtener_doctores_por_especialidad(id_especialidad)
        
        if result.get('success', False):
            doctores = result.get('data', [])
            doctores_data = [
                {
                    'id_doctor': doctor.get('id_doctor'),
                    'nombre_completo': f"{doctor.get('nombres', '')} {doctor.get('apellidos', '')}".strip(),
                    'titulo_profesional': doctor.get('titulo_profesional', '')
                }
                for doctor in doctores
            ]
            
            return JsonResponse({
                'success': True,
                'doctores': doctores_data
            })
        else:
            return JsonResponse({
                'success': False,
                'message': result.get('message', 'Error obteniendo doctores'),
                'doctores': []
            })

class DetalleCitaView(View):
    """Vista AJAX para obtener detalle completo de una cita"""
    
    def dispatch(self, request, *args, **kwargs):
        if not self.is_authenticated(request):
            return JsonResponse({'success': False, 'message': 'No autenticado'})
        
        return super().dispatch(request, *args, **kwargs)
    
    def is_authenticated(self, request):
        user_data = request.session.get('user_data')
        is_authenticated = request.session.get('is_authenticated', False)
        return user_data and is_authenticated
    
    def get(self, request, id_cita):
        """Obtener detalle completo de una cita"""
        api_service = get_api_service()
        
        result = api_service.obtener_detalle_cita(id_cita)
        
        if result.get('success', False):
            return JsonResponse({
                'success': True,
                'detalle': result.get('data', {})
            })
        else:
            return JsonResponse({
                'success': False,
                'message': result.get('message', 'Error obteniendo detalle de cita')
            })
        

class ConsultaCitasView(View):
    """Vista para consulta general de citas médicas"""
    template_name = 'core/consulta_citas.html'
    
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
        logger.warning(f"🚫 UNAUTHENTICATED CONSULTA CITAS ACCESS from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        request.session.flush()
        messages.warning(request, 'Su sesión ha expirado. Inicie sesión nuevamente.')
        return redirect('authentication:login')
    
    def get(self, request):
        """Mostrar página de consulta de citas"""
        user_data = request.session.get('user_data', {})
        
        # Log de acceso
        logger.info(f"🔍 CONSULTA CITAS ACCESS: {user_data.get('correo', 'unknown')}")
        
        # Obtener datos para filtros usando el API service existente
        api_service = get_api_service()
        
        # Cargar especialidades
        especialidades_result = api_service.obtener_especialidades()
        especialidades = especialidades_result.get('data', []) if especialidades_result.get('success') else []
        
        # Cargar sucursales
        sucursales_result = api_service.obtener_sucursales()
        sucursales = sucursales_result.get('data', []) if sucursales_result.get('success') else []
        
        context = {
            'user_data': user_data,
            'title': 'Consulta General de Citas',
            'especialidades': especialidades,
            'sucursales': sucursales,
        }
        
        return render(request, self.template_name, context)

class ApiConsultaGeneralCitasView(View):
    """Vista AJAX para consulta general de citas con filtros"""
    
    def dispatch(self, request, *args, **kwargs):
        if not self.is_authenticated(request):
            return JsonResponse({'success': False, 'message': 'No autenticado'})
        
        return super().dispatch(request, *args, **kwargs)
    
    def is_authenticated(self, request):
        user_data = request.session.get('user_data')
        is_authenticated = request.session.get('is_authenticated', False)
        return user_data and is_authenticated
    
    def get(self, request):
        """API para consulta general de citas médicas con filtros múltiples"""
        try:
            # Obtener filtros de los parámetros GET
            filtros = {
                'fecha_desde': request.GET.get('fecha_desde'),
                'fecha_hasta': request.GET.get('fecha_hasta'),
                'id_especialidad': request.GET.get('id_especialidad'),
                'id_doctor': request.GET.get('id_doctor'),
                'estado': request.GET.get('estado'),
                'id_sucursal': request.GET.get('id_sucursal'),
                'cedula_paciente': request.GET.get('cedula_paciente'),
                'nombre_paciente': request.GET.get('nombre_paciente'),
                'page': int(request.GET.get('page', 1)),
                'per_page': int(request.GET.get('per_page', 20))
            }
            
            logger.info(f"🔍 CONSULTA GENERAL CITAS - Filtros: {filtros}")
            
            # ✅ USAR TU PATRÓN EXISTENTE
            api_service = get_api_service()
            resultado = api_service.consulta_general_citas(filtros)
            
            if resultado.get('success'):
                return JsonResponse(resultado)
            else:
                return JsonResponse(resultado, status=500)
            
        except Exception as e:
            logger.error(f"❌ Error en ApiConsultaGeneralCitasView: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error en consulta general de citas: {str(e)}'
            }, status=500)

class MisCitasMedicoView(View):
    """Vista para que los médicos vean solo sus citas"""
    template_name = 'core/mis_citas_medico.html'
    
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
        logger.warning(f"🚫 UNAUTHENTICATED MIS CITAS ACCESS from {request.META.get('REMOTE_ADDR', 'unknown')}")
        
        request.session.flush()
        messages.warning(request, 'Su sesión ha expirado. Inicie sesión nuevamente.')
        return redirect('authentication:login')
    
    def get(self, request):
        """Mostrar página de mis citas del médico"""
        user_data = request.session.get('user_data', {})
        
        # Verificar que sea un médico
        if user_data.get('tipo_usuario') != 'doctor' or not user_data.get('id_doctor'):
            messages.error(request, 'Solo los médicos pueden acceder a esta sección')
            return redirect('core:dashboard')
        
        # Log de acceso
        logger.info(f"👨‍⚕️ MIS CITAS ACCESS: Dr. {user_data.get('nombre_completo', 'unknown')} (ID: {user_data.get('id_doctor')})")
        
        context = {
            'user_data': user_data,
            'title': 'Mis Citas Médicas',
            'doctor_info': {
                'id_doctor': user_data.get('id_doctor'),
                'nombre_completo': user_data.get('nombre_completo'),
                'especialidad': user_data.get('especialidad'),
                'correo': user_data.get('correo')
            }
        }
        
        return render(request, self.template_name, context)

class ApiMisCitasMedicoView(View):
    """Vista AJAX para obtener las citas del médico logueado"""
    
    def dispatch(self, request, *args, **kwargs):
        if not self.is_authenticated(request):
            return JsonResponse({'success': False, 'message': 'No autenticado'})
        
        return super().dispatch(request, *args, **kwargs)
    
    def is_authenticated(self, request):
        user_data = request.session.get('user_data')
        is_authenticated = request.session.get('is_authenticated', False)
        return user_data and is_authenticated
    
    def get(self, request):
        """API para obtener las citas del médico logueado con filtros"""
        try:
            user_data = request.session.get('user_data', {})
            
            # Verificar que sea un médico
            if user_data.get('tipo_usuario') != 'doctor' or not user_data.get('id_doctor'):
                return JsonResponse({
                    'success': False,
                    'message': 'Solo los médicos pueden acceder a esta función'
                }, status=403)
            
            # Obtener filtros de los parámetros GET
            filtros = {
                'fecha_desde': request.GET.get('fecha_desde'),
                'fecha_hasta': request.GET.get('fecha_hasta'),
                'estado': request.GET.get('estado'),
                'cedula_paciente': request.GET.get('cedula_paciente'),
                'nombre_paciente': request.GET.get('nombre_paciente'),
                'page': int(request.GET.get('page', 1)),
                'per_page': int(request.GET.get('per_page', 20))
            }
            
            # Obtener ID del doctor de la sesión
            id_doctor = user_data.get('id_doctor')
            
            logger.info(f"👨‍⚕️ MIS CITAS MEDICO - Dr. ID: {id_doctor} - Filtros: {filtros}")
            
            # ✅ USAR TU PATRÓN EXISTENTE
            api_service = get_api_service()
            resultado = api_service.obtener_mis_citas_medico(id_doctor, filtros)
            
            if resultado.get('success'):
                return JsonResponse(resultado)
            else:
                return JsonResponse(resultado, status=500)
            
        except Exception as e:
            logger.error(f"❌ Error en ApiMisCitasMedicoView: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error obteniendo mis citas: {str(e)}'
            }, status=500)