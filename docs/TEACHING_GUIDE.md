# 🎓 Guía de Enseñanza - Microservicios con Principios SOLID

## 📋 Información de la Clase

**Duración Total**: 4 horas (con descansos)
**Nivel**: Intermedio-Avanzado
**Prerrequisitos**: Conocimientos básicos de programación, OOP, APIs REST

## 🎯 Objetivos de Aprendizaje

Al finalizar esta clase, los estudiantes serán capaces de:

1. **Implementar** microservicios aplicando principios SOLID
2. **Diseñar** sistemas distribuidos con patrones de diseño
3. **Orquestar** flujos de trabajo con N8N
4. **Integrar** bots de Telegram con sistemas backend
5. **Aplicar** Clean Architecture en proyectos reales
6. **Identificar** dónde y cómo se aplican los principios SOLID en código real

---

## 📚 Estructura de la Clase

### **MÓDULO 1: Fundamentos y Setup** (45 minutos)

#### 1.1 Introducción (10 min)

**Apertura con Pregunta Provocadora:**
> "¿Cuántos de ustedes han trabajado en un proyecto que después de 6 meses se volvió imposible de mantener?"

**Puntos a cubrir:**
- Por qué el código se vuelve difícil de mantener
- Cómo los principios SOLID previenen esto
- Caso de estudio: Sistema de citas médicas

**Actividad Rompehielos:**
```
Pedir a 3 estudiantes que compartan su peor experiencia con código mal diseñado
Tiempo: 2 minutos cada uno
```

#### 1.2 Arquitectura del Sistema (15 min)

**Mostrar diagrama en pizarra:**
```
[Telegram] → [N8N] → [API Gateway] → [Microservicios] → [PostgreSQL]
```

**Explicar cada componente:**
1. **Telegram Bot**: Interfaz de usuario conversacional
2. **N8N**: Orquestador visual de flujos
3. **API Gateway**: Punto de entrada único
4. **Microservicios**: Servicios especializados
5. **PostgreSQL**: Persistencia de datos

**Pregunta de Reflexión:**
> "¿Por qué separamos en microservicios en lugar de hacer un monolito?"

#### 1.3 Instalación y Configuración (20 min)

**Live Coding - Setup Inicial:**

```bash
# Paso 1: Clonar repositorio
git clone [repositorio]
cd appointment-system

# Paso 2: Configurar variables de entorno
cp .env.example .env
# Editar .env con VS Code

# Paso 3: Iniciar servicios
docker-compose up -d

# Paso 4: Verificar servicios
docker-compose ps
```

**Checkpoint:** Todos deben tener servicios corriendo

**Troubleshooting común:**
- Puerto ocupado: Cambiar en docker-compose.yml
- Docker no inicia: Verificar Docker Desktop
- WSL issues: Reiniciar WSL

---

### **MÓDULO 2: Principios SOLID en Acción** (60 minutos)

#### 2.1 Single Responsibility Principle (12 min)

**Ejemplo Malo vs Bueno:**

```python
# ❌ VIOLACIÓN de SRP
class AppointmentManager:
    def create_appointment(self, data):
        # Validación
        if not data.get('date'):
            raise ValueError("Date required")
        
        # Lógica de negocio
        appointment = {
            'id': generate_id(),
            'date': data['date'],
            'status': 'scheduled'
        }
        
        # Persistencia
        connection = psycopg2.connect(DATABASE_URL)
        cursor = connection.cursor()
        cursor.execute("INSERT INTO appointments...")
        
        # Notificación
        send_email(data['patient_email'], "Appointment created")
        send_sms(data['patient_phone'], "Appointment created")
        
        return appointment
```

```python
# ✅ APLICANDO SRP
class AppointmentService:
    def __init__(self, repository, validator, notifier):
        self.repository = repository
        self.validator = validator
        self.notifier = notifier
    
    def create_appointment(self, data):
        self.validator.validate(data)
        appointment = Appointment(**data)
        saved = self.repository.save(appointment)
        self.notifier.notify_creation(saved)
        return saved

class AppointmentValidator:
    def validate(self, data):
        if not data.get('date'):
            raise ValueError("Date required")

class AppointmentRepository:
    def save(self, appointment):
        # Solo lógica de persistencia
        pass

class NotificationService:
    def notify_creation(self, appointment):
        # Solo lógica de notificaciones
        pass
```

**Ejercicio Práctico (5 min):**
> "Identifiquen las responsabilidades en su código actual y sepárenlas"

#### 2.2 Open/Closed Principle (12 min)

**Demostración con Live Coding:**

```python
# Sistema extensible para notificaciones
from abc import ABC, abstractmethod

class NotificationChannel(ABC):
    @abstractmethod
    def send(self, message, recipient):
        pass

class EmailNotification(NotificationChannel):
    def send(self, message, recipient):
        print(f"Email to {recipient}: {message}")

class SMSNotification(NotificationChannel):
    def send(self, message, recipient):
        print(f"SMS to {recipient}: {message}")

# Agregar Telegram sin modificar código existente
class TelegramNotification(NotificationChannel):
    def send(self, message, recipient):
        print(f"Telegram to {recipient}: {message}")

# Uso
notifiers = {
    'email': EmailNotification(),
    'sms': SMSNotification(),
    'telegram': TelegramNotification()  # Nueva funcionalidad
}
```

**Actividad Grupal:**
> "En parejas, diseñen cómo agregar WhatsApp sin tocar el código existente"

#### 2.3 Liskov Substitution Principle (12 min)

**Ejemplo Interactivo:**

```python
# Las subclases deben ser intercambiables
class Repository(ABC):
    @abstractmethod
    def save(self, entity):
        """Debe retornar la entidad guardada"""
        pass
    
    @abstractmethod
    def find_by_id(self, id):
        """Debe retornar entidad o None"""
        pass

class PostgreSQLRepository(Repository):
    def save(self, entity):
        # Guardar en PostgreSQL
        return entity  # ✅ Cumple el contrato
    
    def find_by_id(self, id):
        # Buscar en PostgreSQL
        return entity or None  # ✅ Cumple el contrato

class MongoRepository(Repository):
    def save(self, entity):
        # Guardar en MongoDB
        return entity  # ✅ Mismo comportamiento
    
    def find_by_id(self, id):
        # Buscar en MongoDB
        return entity or None  # ✅ Mismo comportamiento

# Función que usa cualquier Repository
def process_appointment(repo: Repository, data):
    appointment = Appointment(**data)
    saved = repo.save(appointment)  # Funciona con cualquier implementación
    return saved
```

**Pregunta de Reflexión:**
> "¿Qué pasaría si MongoRepository.save() retornara True en lugar de la entidad?"

#### 2.4 Interface Segregation Principle (12 min)

**Mostrar el Problema:**

```python
# ❌ Interface muy grande
class IUserService(ABC):
    @abstractmethod
    def create_user(self): pass
    @abstractmethod
    def authenticate(self): pass
    @abstractmethod
    def send_notification(self): pass
    @abstractmethod
    def generate_report(self): pass
    # Muchos métodos que no todos necesitan

# ✅ Interfaces segregadas
class IUserCRUD(ABC):
    @abstractmethod
    def create_user(self): pass

class IAuthenticable(ABC):
    @abstractmethod
    def authenticate(self): pass

class INotifiable(ABC):
    @abstractmethod
    def send_notification(self): pass
```

**Ejercicio Individual (5 min):**
> "Refactoricen esta interface grande en 3 interfaces pequeñas"

#### 2.5 Dependency Inversion Principle (12 min)

**Live Coding - Inyección de Dependencias:**

```python
# Alto nivel no depende de bajo nivel
class AppointmentUseCase:
    def __init__(
        self,
        repository: IAppointmentRepository,  # Abstracción
        notifier: INotificationService       # Abstracción
    ):
        self.repository = repository
        self.notifier = notifier
    
    def create_appointment(self, data):
        # Lógica de negocio usando abstracciones
        appointment = self.repository.save(data)
        self.notifier.send(appointment)
        return appointment

# En el punto de entrada (main.py)
def create_app():
    # Aquí inyectamos las implementaciones concretas
    repository = PostgreSQLRepository()  # Concreción
    notifier = TelegramNotifier()        # Concreción
    
    use_case = AppointmentUseCase(
        repository=repository,
        notifier=notifier
    )
    return use_case
```

**Discusión Grupal:**
> "¿Cómo esto facilita el testing?"

---

### **MÓDULO 3: Implementación con Docker y APIs** (60 minutos)

#### 3.1 Explorando el Código Base (20 min)

**Tour guiado del código:**

```bash
# Estructura del proyecto
appointment-system/
├── services/
│   ├── api-gateway/        # API Gateway
│   ├── appointment-service/ # Servicio de citas
│   ├── patient-service/    # Servicio de pacientes
│   └── notification-service/# Servicio de notificaciones
├── database/
│   └── init.sql            # Schema de base de datos
├── n8n/
│   └── workflows/          # Flujos de N8N
└── docker-compose.yml      # Orquestación
```

**Analizar un servicio completo:**
1. Abrir `appointment-service/main.py`
2. Identificar cada principio SOLID
3. Marcar con comentarios dónde se aplica cada uno

#### 3.2 Creando un Endpoint Nuevo (20 min)

**Live Coding - Agregar funcionalidad:**

```python
# Nuevo endpoint: Obtener slots disponibles
@app.get("/appointments/available-slots/{doctor_id}")
async def get_available_slots(
    doctor_id: str,
    date: date,
    duration: int = 30
):
    """
    Demostración de:
    - Clean Architecture
    - Separation of Concerns
    - Dependency Injection
    """
    # Usar el servicio de disponibilidad
    slots = await availability_service.get_available_slots(
        doctor_id=doctor_id,
        date=date,
        duration_minutes=duration
    )
    
    return {
        "doctor_id": doctor_id,
        "date": date.isoformat(),
        "available_slots": slots
    }
```

**Ejercicio en Parejas (10 min):**
> "Implementen un endpoint para obtener el historial de un paciente"

#### 3.3 Testing de APIs (10 min)

**Usando Postman/Insomnia:**

```json
// POST /api/appointments
{
    "patient_id": "123",
    "doctor_id": "456",
    "appointment_date": "2024-11-20",
    "appointment_time": "10:00",
    "reason": "Consulta general"
}
```

**Scripts de prueba automatizados:**

```bash
# Test script
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patient_id": "123",
    "doctor_id": "456",
    "appointment_date": "2024-11-20",
    "appointment_time": "10:00"
  }'
```

---

### **MÓDULO 4: N8N y Telegram Bot** (60 minutos)

#### 4.1 Configuración del Bot (15 min)

**Paso a paso con los estudiantes:**

1. Crear bot con @BotFather
2. Obtener token
3. Configurar en .env
4. Test inicial con curl

```bash
# Test del bot
curl https://api.telegram.org/bot<TOKEN>/getMe
```

#### 4.2 Creando Flujos en N8N (25 min)

**Demostración en vivo:**

1. Acceder a N8N: http://localhost:5678
2. Crear webhook para Telegram
3. Agregar nodo de procesamiento
4. Conectar con API Gateway
5. Responder al usuario

**Flujo básico:**
```
[Telegram Webhook] → [Parse Command] → [API Call] → [Format Response] → [Send to Telegram]
```

**Actividad Práctica:**
> "Creen un flujo para el comando /mis_citas"

#### 4.3 Integración Completa (20 min)

**Demo end-to-end:**

1. Usuario envía mensaje a Telegram
2. N8N procesa el comando
3. Llama al API Gateway
4. Gateway rutea al microservicio
5. Microservicio procesa
6. Respuesta vuelve por la cadena
7. Usuario recibe confirmación

**Debugging común:**
- Ver logs de N8N
- Verificar webhooks
- Revisar tokens y credenciales
- Analizar execution history

---

### **MÓDULO 5: Mejores Prácticas y Cierre** (35 minutos)

#### 5.1 Patrones de Diseño Aplicados (15 min)

**Identificar patrones en el código:**

1. **Repository Pattern**: Abstracción de persistencia
2. **Factory Pattern**: Creación de objetos
3. **Strategy Pattern**: Algoritmos intercambiables
4. **Observer Pattern**: Eventos y notificaciones
5. **API Gateway Pattern**: Punto de entrada único

**Quick Quiz Interactivo:**
> Mostrar código y preguntar: "¿Qué patrón ven aquí?"

#### 5.2 Escalabilidad y Producción (10 min)

**Consideraciones para producción:**

```yaml
# docker-compose.production.yml
services:
  appointment-service:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
```

**Temas a considerar:**
- Load balancing
- Service discovery
- Circuit breakers
- Monitoring y logging
- Seguridad y autenticación

#### 5.3 Ejercicio Final y Q&A (10 min)

**Challenge Final:**
> "Diseñen cómo agregarían un sistema de pagos manteniendo SOLID"

**Puntos a evaluar:**
- ¿Nuevo microservicio o extensión?
- ¿Qué interfaces necesitan?
- ¿Cómo se comunica con otros servicios?
- ¿Dónde aplican cada principio SOLID?

**Cierre con Reflexión:**
> "¿Qué principio SOLID les pareció más útil y por qué?"

---

## 🎯 Evaluación y Tareas

### Evaluación Durante la Clase

**Rúbrica de Participación:**
- **Excelente (A)**: Participa activamente, hace preguntas, completa ejercicios
- **Bueno (B)**: Completa ejercicios, ocasionalmente participa
- **Regular (C)**: Presente pero poca participación
- **Necesita Mejorar (D)**: Distraído o no completa actividades

### Tarea para Casa

**Proyecto Individual (1 semana):**

Extender el sistema con una de estas funcionalidades:
1. **Sistema de Recordatorios Múltiples**
   - 48h antes
   - 24h antes
   - 2h antes
   - Aplicar Strategy Pattern

2. **Gestión de Médicos**
   - CRUD completo
   - Horarios disponibles
   - Especialidades
   - Aplicar Repository Pattern

3. **Reportes y Analytics**
   - Citas por día/semana/mes
   - Tasa de no-show
   - Médicos más solicitados
   - Aplicar Observer Pattern

**Criterios de Evaluación:**
- Aplicación correcta de SOLID (40%)
- Funcionalidad completa (30%)
- Código limpio y documentado (20%)
- Creatividad y extras (10%)

---

## 📚 Recursos para Estudiantes

### Lecturas Recomendadas
1. "Clean Architecture" - Robert C. Martin
2. "Design Patterns" - Gang of Four
3. "Building Microservices" - Sam Newman

### Videos Complementarios
1. [SOLID Principles in 10 Minutes](https://youtube.com/...)
2. [Docker for Developers](https://youtube.com/...)
3. [N8N Tutorial Series](https://youtube.com/...)

### Repositorios de Ejemplo
1. [Clean Architecture Python](https://github.com/...)
2. [Microservices Demo](https://github.com/...)
3. [SOLID Examples](https://github.com/...)

---

## 💡 Tips para el Instructor

### Preparación Previa
- [ ] Probar todo el sistema un día antes
- [ ] Tener backup de código funcionando
- [ ] Preparar credenciales extras para estudiantes
- [ ] Tener slides de respaldo para conceptos

### Durante la Clase
- **Pausas**: Cada 45 minutos, descanso de 5-10 min
- **Ritmo**: Verificar comprensión cada 15 min
- **Interacción**: Rotar entre demo, ejercicio, discusión
- **Debugging**: Tener soluciones pre-escritas

### Manejo de Problemas Comunes

**"Docker no funciona en mi máquina"**
- Tener ambiente en la nube como backup
- Usar GitHub Codespaces o GitPod

**"No entiendo SOLID"**
- Usar analogías del mundo real
- Ejemplo: Restaurant (SRP), Legos (OCP)

**"El código es muy complejo"**
- Empezar con versión simplificada
- Construir complejidad gradualmente

### Métricas de Éxito
- 80% completa los ejercicios en clase
- 90% puede explicar al menos 3 principios SOLID
- 70% entrega tarea completa
- 100% tiene sistema funcionando

---

## 🎉 Conclusión de la Clase

**Mensaje Final:**
> "SOLID no es sobre escribir más código, es sobre escribir código que puedas mantener dentro de 6 meses. Los microservicios no son sobre tener muchos servicios, son sobre tener responsabilidades claras y sistemas mantenibles."

**Call to Action:**
1. Aplicar SOLID en su próximo proyecto
2. Compartir su proyecto en GitHub
3. Conectar en LinkedIn para seguimiento

**Feedback:**
- Formulario de Google Forms
- QR code para evaluación inmediata
- Sugerencias para próxima clase

---

## 📧 Soporte Post-Clase

**Canal de Slack/Discord:** [link]
**Office Hours:** Jueves 4-6 PM
**Email:** instructor@example.com
**Repositorio del Curso:** [GitHub link]

¡Éxito en tu clase! 🚀
