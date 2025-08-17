from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    
    # ✅ NUEVAS RUTAS PARA HISTORIAL CLÍNICO
    path('historial-clinico/', views.HistorialClinicoView.as_view(), name='historial_clinico'),
    path('api/doctores-especialidad/<int:id_especialidad>/', views.DoctoresPorEspecialidadView.as_view(), name='doctores_especialidad'),
    path('api/detalle-cita/<int:id_cita>/', views.DetalleCitaView.as_view(), name='detalle_cita'),
# ✅ CONSULTA DE CITAS (CORREGIDAS)
    path('consulta-citas/', views.ConsultaCitasView.as_view(), name='consulta_citas'),
    path('api/citas/consulta-general/', views.ApiConsultaGeneralCitasView.as_view(), name='api_consulta_general_citas'),
    path('api/doctores-especialidad/<int:id_especialidad>/', views.DoctoresPorEspecialidadView.as_view(), name='doctores_por_especialidad'),
    path('api/detalle-cita/<int:id_cita>/', views.DetalleCitaView.as_view(), name='detalle_cita'),
        # Mis citas para médicos
    path('mis-citas/', views.MisCitasMedicoView.as_view(), name='mis_citas_medico'),
    path('api/mis-citas/', views.ApiMisCitasMedicoView.as_view(), name='api_mis_citas_medico'),
]