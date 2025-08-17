from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),  # Para usuarios con clave temporal
    path('change-password-logged/', views.ChangePasswordLoggedView.as_view(), name='change_password_logged'),  # ✅ NUEVA: Para usuarios logueados
]