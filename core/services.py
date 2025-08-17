import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class MedisysAPIService:
    """Servicio para consumir la API de MediSys"""
    
    

    def __init__(self):
        self.base_url = settings.API_BASE_URL
        # ✅ USAR SESSION PARA MANTENER COOKIES/SESIONES
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'MediSys-Django-Client/1.0'
        })
    
    
    def login(self, correo, password):
        """
        Consumir endpoint de login manteniendo sesión
        ✅ PUNTO 1 y 3: Autenticación usando la API
        🔒 IMPORTANTE: Mantiene sesión para tracking de intentos
        """
        try:
            url = f"{self.base_url}/auth/login"
            data = {
                'correo': correo,
                'password': password
            }
            
            # Log detallado para debug
            logger.info(f"🔗 API REQUEST URL: {url}")
            logger.info(f"📤 API REQUEST DATA: {data}")
            logger.info(f"🍪 SESSION COOKIES: {dict(self.session.cookies)}")
            
            # ✅ USAR SESSION EN LUGAR DE REQUESTS DIRECTO
            response = self.session.post(url, json=data, timeout=15)
            
            logger.info(f"📥 API RESPONSE STATUS: {response.status_code}")
            logger.info(f"🍪 RESPONSE COOKIES: {dict(response.cookies)}")
            
            # Actualizar cookies de la sesión
            self.session.cookies.update(response.cookies)
            
            if response.status_code == 200:
                # Respuesta exitosa
                result = response.json()
                logger.info(f"✅ API SUCCESS: {result.get('message', 'Login exitoso')}")
                return result
                
            elif response.status_code == 401:
                # Error de autenticación - puede incluir bloqueo
                try:
                    error_result = response.json()
                    error_message = error_result.get('message', 'Error de autenticación')
                    
                    logger.warning(f"❌ API ERROR 401: {error_message}")
                    
                    # 🔒 DEVOLVER EXACTAMENTE LA RESPUESTA DEL API
                    return {
                        'success': False,
                        'message': error_message,
                        'data': error_result.get('data', None),
                        'code': response.status_code,
                        'timestamp': error_result.get('timestamp', '')
                    }
                    
                except ValueError as e:
                    logger.error(f"❌ API RESPONSE NOT JSON: {response.text}")
                    return {
                        'success': False,
                        'message': 'Error de formato en la respuesta del servidor',
                        'data': None
                    }
            
            else:
                # Otros códigos de error
                try:
                    error_result = response.json()
                    error_message = error_result.get('message', f'Error del servidor (Código: {response.status_code})')
                    
                    logger.error(f"❌ API ERROR {response.status_code}: {error_message}")
                    
                    return {
                        'success': False,
                        'message': error_message,
                        'data': error_result.get('data', None),
                        'code': response.status_code
                    }
                    
                except ValueError:
                    logger.error(f"❌ API ERROR {response.status_code}: {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
                
        except requests.exceptions.Timeout:
            logger.error(f"⏰ API TIMEOUT: {url}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 API CONNECTION ERROR: {url} - {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 API UNEXPECTED ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }

    # ✅ MÉTODO DENTRO DE LA CLASE
    def enviar_clave_temporal(self, correo):
        """
        Enviar clave temporal por email
        ✅ PUNTO 2: Funcionalidad de recuperación de contraseña
        """
        try:
            url = f"{self.base_url}/auth/enviar-clave-temporal"
            data = {'correo': correo}
            
            logger.info(f"🔑 RECOVERY REQUEST: {correo}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.post(url, json=data, timeout=15)
            
            logger.info(f"📥 RECOVERY RESPONSE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ RECOVERY SUCCESS: {result.get('message', 'Enviado')}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ RECOVERY ERROR: {response.status_code} - {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error enviando clave temporal'),
                        'data': None
                    }
                except ValueError:
                    logger.error(f"❌ RECOVERY ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
                
        except requests.exceptions.Timeout:
            logger.error(f"⏰ RECOVERY TIMEOUT: {url}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 RECOVERY CONNECTION ERROR: {url} - {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 RECOVERY UNEXPECTED ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error de conexión: {str(e)}',
                'data': None
            }

    # ✅ MÉTODO DENTRO DE LA CLASE
    def cambiar_password_temporal(self, correo, password_temporal, password_nueva, confirmar_password):
        """
        Cambiar contraseña temporal por nueva
        ✅ PUNTO 2: Cambio de contraseña con validaciones
        """
        try:
            url = f"{self.base_url}/auth/change-password"
            data = {
                'correo': correo,
                'password_actual': password_temporal,
                'password_nueva': password_nueva,
                'confirmar_password': confirmar_password
            }
            
            logger.info(f"🔄 PASSWORD CHANGE REQUEST: {correo}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.post(url, json=data, timeout=15)
            
            logger.info(f"📥 PASSWORD CHANGE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ PASSWORD CHANGE SUCCESS")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ PASSWORD CHANGE ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error cambiando contraseña'),
                        'data': None
                    }
                except ValueError:
                    logger.error(f"❌ PASSWORD CHANGE ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
                
        except requests.exceptions.Timeout:
            logger.error(f"⏰ PASSWORD CHANGE TIMEOUT: {url}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 PASSWORD CHANGE CONNECTION ERROR: {url} - {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 PASSWORD CHANGE ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error de conexión: {str(e)}',
                'data': None
            }

    # ✅ MÉTODO ADICIONAL PARA OBTENER HISTORIAL CLÍNICO
    def get_historial_clinico(self, cedula):
        """
        Obtener historial clínico por cédula
        ✅ PUNTO 5: Historial clínico por cédula del paciente
        """
        try:
            url = f"{self.base_url}/historial/paciente/{cedula}"
            
            logger.info(f"📋 HISTORIAL REQUEST: {cedula}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.get(url, timeout=15)
            
            logger.info(f"📥 HISTORIAL RESPONSE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ HISTORIAL SUCCESS")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ HISTORIAL ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo historial'),
                        'data': None
                    }
                except ValueError:
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
                
        except Exception as e:
            logger.error(f"💥 HISTORIAL ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error de conexión: {str(e)}',
                'data': None
            }

    # ✅ MÉTODO PARA BÚSQUEDA DE CITAS
    def buscar_citas_por_fechas_medico(self, fecha_inicio, fecha_fin, cedula_medico, **filtros):
        """
        Buscar citas por rango de fechas y médico
        ✅ PUNTO 7 y 8: Consulta de citas por rango de fechas
        """
        try:
            url = f"{self.base_url}/citas/rango-fechas-medico-cedula"
            data = {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin,
                'cedula_medico': cedula_medico,
                **filtros
            }
            
            logger.info(f"🔍 CITAS SEARCH REQUEST: {fecha_inicio} - {fecha_fin}, Médico: {cedula_medico}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.post(url, json=data, timeout=15)
            
            logger.info(f"📥 CITAS SEARCH STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ CITAS SEARCH SUCCESS")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ CITAS SEARCH ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error buscando citas'),
                        'data': None
                    }
                except ValueError:
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
                
        except Exception as e:
            logger.error(f"💥 CITAS SEARCH ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error de conexión: {str(e)}',
                'data': None
            }

    # ✅ AGREGAR ESTE MÉTODO NUEVO
    def cambiar_password_usuario_logueado(self, id_usuario, password_actual, password_nueva, confirmar_password):
        """
        Cambiar contraseña para usuario logueado (NO temporal)
        ✅ PUNTO 2: Cambio de contraseña con validaciones para usuarios activos
        """
        try:
            url = f"{self.base_url}/auth/change-password-logged"
            data = {
                'id_usuario': id_usuario,
                'password_actual': password_actual,
                'password_nueva': password_nueva,
                'confirmar_password': confirmar_password
            }
            
            logger.info(f"🔄 PASSWORD CHANGE (LOGGED USER): ID {id_usuario}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.post(url, json=data, timeout=15)
            
            logger.info(f"📥 PASSWORD CHANGE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ PASSWORD CHANGE SUCCESS (LOGGED USER)")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ PASSWORD CHANGE ERROR (LOGGED USER): {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error cambiando contraseña'),
                        'data': error_result.get('data', None)
                    }
                except ValueError:
                    logger.error(f"❌ PASSWORD CHANGE ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
            
        except requests.exceptions.Timeout:
            logger.error(f"⏰ PASSWORD CHANGE TIMEOUT")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 PASSWORD CHANGE CONNECTION ERROR: {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 PASSWORD CHANGE ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }
    def buscar_paciente_por_cedula(self, cedula):
        """
        Buscar paciente por cédula para validación inicial
        """
        try:
            url = f"{self.base_url}/pacientes/buscar/{cedula}"
            
            logger.info(f"🔍 BUSCAR PACIENTE: {cedula}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.get(url, timeout=15)
            
            logger.info(f"📥 BUSCAR PACIENTE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ PACIENTE ENCONTRADO: {cedula}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ PACIENTE NO ENCONTRADO: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Paciente no encontrado'),
                        'data': error_result.get('data', None)
                    }
                except ValueError:
                    logger.error(f"❌ BUSCAR PACIENTE ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
            
        except requests.exceptions.Timeout:
            logger.error(f"⏰ BUSCAR PACIENTE TIMEOUT: {cedula}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 BUSCAR PACIENTE CONNECTION ERROR: {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 BUSCAR PACIENTE ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }

    def obtener_historial_con_filtros(self, cedula, filtros=None):
        """
        Obtener historial clínico completo con filtros
        """
        try:
            url = f"{self.base_url}/historial/{cedula}/filtros"
            
            # Preparar parámetros de filtros
            params = {}
            if filtros:
                for key, value in filtros.items():
                    if value:  # Solo agregar filtros con valor
                        params[key] = value
            
            logger.info(f"📋 HISTORIAL CON FILTROS: {cedula}")
            logger.info(f"🔗 API URL: {url}")
            logger.info(f"🔍 FILTROS: {params}")
            
            response = self.session.get(url, params=params, timeout=15)
            
            logger.info(f"📥 HISTORIAL STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ HISTORIAL OBTENIDO: {cedula}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ HISTORIAL ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo historial'),
                        'data': error_result.get('data', None)
                    }
                except ValueError:
                    logger.error(f"❌ HISTORIAL ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
            
        except requests.exceptions.Timeout:
            logger.error(f"⏰ HISTORIAL TIMEOUT: {cedula}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 HISTORIAL CONNECTION ERROR: {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 HISTORIAL ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }

    def obtener_detalle_cita(self, id_cita):
        """
        Obtener detalle completo de una cita específica
        """
        try:
            url = f"{self.base_url}/citas/{id_cita}/detalle"
            
            logger.info(f"📄 DETALLE CITA: {id_cita}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.get(url, timeout=15)
            
            logger.info(f"📥 DETALLE CITA STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ DETALLE CITA OBTENIDO: {id_cita}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ DETALLE CITA ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo detalle de cita'),
                        'data': error_result.get('data', None)
                    }
                except ValueError:
                    logger.error(f"❌ DETALLE CITA ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
            
        except requests.exceptions.Timeout:
            logger.error(f"⏰ DETALLE CITA TIMEOUT: {id_cita}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 DETALLE CITA CONNECTION ERROR: {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 DETALLE CITA ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }

    def obtener_especialidades(self):
        """
        Obtener lista de especialidades para filtros
        """
        try:
            url = f"{self.base_url}/especialidades"
            
            logger.info(f"🏥 OBTENIENDO ESPECIALIDADES")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.get(url, timeout=15)
            
            logger.info(f"📥 ESPECIALIDADES STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ ESPECIALIDADES OBTENIDAS: {len(result.get('data', []))}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ ESPECIALIDADES ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo especialidades'),
                        'data': []
                    }
                except ValueError:
                    logger.error(f"❌ ESPECIALIDADES ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': []
                    }
            
        except Exception as e:
            logger.error(f"💥 ESPECIALIDADES ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': []
            }

    def obtener_doctores_por_especialidad(self, id_especialidad):
        """
        Obtener doctores de una especialidad específica
        """
        try:
            url = f"{self.base_url}/doctores/especialidad/{id_especialidad}"
            
            logger.info(f"👨‍⚕️ OBTENIENDO DOCTORES: Especialidad {id_especialidad}")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.get(url, timeout=15)
            
            logger.info(f"📥 DOCTORES STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ DOCTORES OBTENIDOS: {len(result.get('data', []))}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ DOCTORES ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo doctores'),
                        'data': []
                    }
                except ValueError:
                    logger.error(f"❌ DOCTORES ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': []
                    }
            
        except Exception as e:
            logger.error(f"💥 DOCTORES ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': []
            }

    def obtener_sucursales(self):
        """
        Obtener lista de sucursales para filtros
        """
        try:
            url = f"{self.base_url}/sucursales"
            
            logger.info(f"🏢 OBTENIENDO SUCURSALES")
            logger.info(f"🔗 API URL: {url}")
            
            response = self.session.get(url, timeout=15)
            
            logger.info(f"📥 SUCURSALES STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ SUCURSALES OBTENIDAS: {len(result.get('data', []))}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ SUCURSALES ERROR: {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo sucursales'),
                        'data': []
                    }
                except ValueError:
                    logger.error(f"❌ SUCURSALES ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': []
                    }
            
        except Exception as e:
            logger.error(f"💥 SUCURSALES ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': []
            }

    
    def buscar_citas_por_cedula(self, cedula):
        """
        🔍 Buscar citas específicamente por cédula de paciente
        """
        try:
            url = f"{self.base_url}/citas/consulta-general"
            params = {'cedula_paciente': cedula}
            
            logger.info(f"🔍 BUSCAR CITAS POR CEDULA: {cedula}")
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ BUSQUEDA POR CEDULA SUCCESS: {len(result.get('data', {}).get('citas', []))} citas encontradas")
                return result
            else:
                try:
                    error_result = response.json()
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error buscando citas'),
                        'data': None
                    }
                except ValueError:
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
                
        except Exception as e:
            logger.error(f"💥 BUSCAR CITAS POR CEDULA ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error buscando citas: {str(e)}',
                'data': None
            }

    def obtener_estadisticas_citas(self):
        """
        📊 Obtener estadísticas generales de citas
        """
        try:
            url = f"{self.base_url}/citas/consulta-general"
            params = {'per_page': 1}  # Solo necesitamos las estadísticas
            
            logger.info(f"📊 OBTENIENDO ESTADISTICAS CITAS")
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                estadisticas = result.get('data', {}).get('estadisticas', {})
                logger.info(f"✅ ESTADISTICAS SUCCESS: {estadisticas}")
                return {
                    'success': True,
                    'data': estadisticas,
                    'message': 'Estadísticas obtenidas exitosamente'
                }
            else:
                try:
                    error_result = response.json()
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo estadísticas'),
                        'data': None
                    }
                except ValueError:
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
                
        except Exception as e:
            logger.error(f"💥 ESTADISTICAS ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error obteniendo estadísticas: {str(e)}',
                'data': None
            }
            

    def consulta_general_citas(self, filtros=None):
        """
        🔍 Consultar citas generales con filtros múltiples
        """
        try:
            url = f"{self.base_url}/citas/consulta-general"
            
            # Preparar parámetros de consulta
            params = {}
            if filtros:
                for key, value in filtros.items():
                    if value:  # Solo agregar valores no vacíos
                        params[key] = value
            
            logger.info(f"🔍 CONSULTA CITAS URL: {url}")
            logger.info(f"📋 FILTROS: {params}")
            
            response = self.session.get(url, params=params, timeout=15)
            
            logger.info(f"📥 CONSULTA CITAS RESPONSE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ CONSULTA CITAS SUCCESS: {result.get('message', 'Consulta exitosa')}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ CONSULTA CITAS ERROR: {response.status_code} - {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error consultando citas'),
                        'data': None
                    }
                except ValueError:
                    logger.error(f"❌ CONSULTA CITAS ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
            
        except requests.exceptions.Timeout:
            logger.error(f"⏰ CONSULTA CITAS TIMEOUT: {url}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 CONSULTA CITAS CONNECTION ERROR: {url} - {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 CONSULTA CITAS UNEXPECTED ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }
                

    def obtener_mis_citas_medico(self, id_doctor, filtros=None):
        """
        👨‍⚕️ Obtener las citas del médico especificado con filtros
        """
        try:
            url = f"{self.base_url}/citas/mis-citas"
            
            # Preparar parámetros incluyendo el ID del doctor
            params = {'id_doctor': id_doctor}
            if filtros:
                for key, value in filtros.items():
                    if value:  # Solo agregar valores no vacíos
                        params[key] = value
            
            logger.info(f"👨‍⚕️ MIS CITAS URL: {url}")
            logger.info(f"📋 DOCTOR ID: {id_doctor} - FILTROS: {params}")
            
            response = self.session.get(url, params=params, timeout=15)
            
            logger.info(f"📥 MIS CITAS RESPONSE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ MIS CITAS SUCCESS: {result.get('message', 'Consulta exitosa')}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ MIS CITAS ERROR: {response.status_code} - {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo mis citas'),
                        'data': None
                    }
                except ValueError:
                    logger.error(f"❌ MIS CITAS ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
            
        except Exception as e:
            logger.error(f"💥 MIS CITAS UNEXPECTED ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }

    def obtener_mis_citas_medico(self, id_doctor, filtros=None):
        """
        👨‍⚕️ Obtener las citas del médico especificado con filtros
        """
        try:
            url = f"{self.base_url}/citas/mis-citas"
            
            # Preparar parámetros incluyendo el ID del doctor
            params = {'id_doctor': id_doctor}
            if filtros:
                for key, value in filtros.items():
                    if value:  # Solo agregar valores no vacíos
                        params[key] = value
            
            logger.info(f"👨‍⚕️ MIS CITAS URL: {url}")
            logger.info(f"📋 DOCTOR ID: {id_doctor} - FILTROS: {params}")
            
            response = self.session.get(url, params=params, timeout=15)
            
            logger.info(f"📥 MIS CITAS RESPONSE STATUS: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ MIS CITAS SUCCESS: {result.get('message', 'Consulta exitosa')}")
                return result
            else:
                try:
                    error_result = response.json()
                    logger.warning(f"❌ MIS CITAS ERROR: {response.status_code} - {error_result}")
                    return {
                        'success': False,
                        'message': error_result.get('message', 'Error obteniendo mis citas'),
                        'data': None
                    }
                except ValueError:
                    logger.error(f"❌ MIS CITAS ERROR: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'Error del servidor (Código: {response.status_code})',
                        'data': None
                    }
            
        except requests.exceptions.Timeout:
            logger.error(f"⏰ MIS CITAS TIMEOUT: {url}")
            return {
                'success': False,
                'message': 'Tiempo de espera agotado. Intente nuevamente.',
                'data': None
            }
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🔌 MIS CITAS CONNECTION ERROR: {url} - {str(e)}")
            return {
                'success': False,
                'message': 'Error de conexión con el servidor. Verifique su conexión.',
                'data': None
            }
            
        except Exception as e:
            logger.error(f"💥 MIS CITAS UNEXPECTED ERROR: {str(e)}")
            return {
                'success': False,
                'message': f'Error inesperado: {str(e)}',
                'data': None
            }



# ✅ INSTANCIA GLOBAL PARA MANTENER SESIÓN
_api_service_instance = None

def get_api_service():
    """Obtener instancia única del servicio API para mantener sesión"""
    global _api_service_instance
    if _api_service_instance is None:
        _api_service_instance = MedisysAPIService()
        logger.info("🔧 Created new API service instance")
    return _api_service_instance

