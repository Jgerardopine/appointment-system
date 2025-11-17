# 🚀 Quick Start Guide - Sistema de Citas Médicas con Microservicios

## ✅ Lo que hemos creado

Has recibido un sistema completo de gestión de citas médicas que demuestra:

### 🎯 Principios SOLID Aplicados
- ✅ **S**ingle Responsibility: Cada servicio y clase tiene una única responsabilidad
- ✅ **O**pen/Closed: Extensible sin modificar código existente (ej: nuevos canales de notificación)
- ✅ **L**iskov Substitution: Implementaciones intercambiables (repositorios, estrategias)
- ✅ **I**nterface Segregation: Interfaces específicas para cada contexto
- ✅ **D**ependency Inversion: Dependencia de abstracciones, no concreciones

### 🏗️ Arquitectura Implementada
- **Microservicios**: 4 servicios independientes + API Gateway
- **Clean Architecture**: Separación en capas (Domain, Application, Infrastructure, Interface)
- **Patrones de Diseño**: Repository, Strategy, Factory, Observer, Command
- **Event-Driven**: Comunicación asíncrona entre servicios
- **Containerización**: Docker y Docker Compose

### 🤖 Integración con Telegram
- Bot conversacional completo
- Comandos para agendar, verificar y cancelar citas
- Notificaciones automáticas
- Orquestación con N8N

---

## 📦 Estructura del Proyecto

```
appointment-system/
├── services/
│   ├── api-gateway/          # Punto de entrada único (Node.js)
│   ├── appointment-service/  # Gestión de citas (Python - Clean Architecture)
│   ├── patient-service/      # Gestión de pacientes (Node.js)
│   └── notification-service/ # Envío de notificaciones (Node.js - Strategy Pattern)
├── database/
│   └── init.sql              # Schema PostgreSQL
├── n8n/
│   └── workflows/            # Flujos de trabajo para Telegram
├── docs/
│   ├── INSTALLATION.md      # Guía de instalación completa
│   ├── DESIGN.md            # Documento de diseño
│   ├── API.md               # Documentación de la API
│   ├── N8N_SETUP.md         # Configuración de N8N y Telegram
│   └── TEACHING_GUIDE.md    # Guía para dar la clase
├── docker-compose.yml        # Orquestación de contenedores
├── .env.example             # Variables de entorno
└── README.md                # Este archivo
```

---

## 🚀 Inicio Rápido (5 minutos)

### 1️⃣ Clonar y Configurar

```bash
# Clonar el repositorio (o usar los archivos creados)
cd appointment-system

# Copiar variables de entorno
cp .env.example .env
```

### 2️⃣ Configurar Token de Telegram

1. Abrir Telegram y buscar `@BotFather`
2. Crear bot: `/newbot`
3. Copiar el token
4. Editar `.env` y pegar el token:
```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
```

### 3️⃣ Iniciar el Sistema

```bash
# Construir e iniciar todos los servicios
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Verificar que todos estén corriendo
docker-compose ps
```

### 4️⃣ Verificar Servicios

```bash
# API Gateway
curl http://localhost:3000/health

# Appointment Service
curl http://localhost:3001/health

# Patient Service  
curl http://localhost:3002/health

# Notification Service
curl http://localhost:3003/health

# N8N
# Abrir en navegador: http://localhost:5678
# Usuario: admin
# Password: n8n_admin_123
```

---

## 🧪 Probar el Sistema

### Test 1: Crear un Paciente

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Juan Prueba",
    "phone": "+521234567890"
  }'
```

### Test 2: Bot de Telegram

1. Abrir Telegram
2. Buscar tu bot: `@tu_bot`
3. Enviar: `/start`
4. Probar: `/agendar Dr. López 2024-11-25 10:00`

### Test 3: Configurar N8N

1. Acceder a http://localhost:5678
2. Importar workflow desde: `/n8n/workflows/telegram-bot-complete.json`
3. Configurar credenciales de Telegram
4. Activar el workflow

---

## 📚 Para la Clase

### Materiales Listos

1. **Código Base**: Completamente funcional con principios SOLID aplicados
2. **Documentación**: 
   - Guía de instalación (Windows/Mac)
   - Documento de diseño con explicaciones
   - Guía de enseñanza paso a paso
3. **Ejemplos Prácticos**: Cada principio SOLID con código malo vs bueno
4. **Ejercicios**: Incluidos en la guía de enseñanza

### Flujo de la Clase (4 horas)

1. **Módulo 1 (45 min)**: Fundamentos y Setup
   - Introducción a SOLID
   - Arquitectura del sistema
   - Instalación

2. **Módulo 2 (60 min)**: Principios SOLID en Acción
   - Ejemplos en código real
   - Ejercicios prácticos
   - Refactoring en vivo

3. **Módulo 3 (60 min)**: Docker y APIs
   - Explorar microservicios
   - Testing de APIs
   - Crear nuevo endpoint

4. **Módulo 4 (60 min)**: N8N y Telegram
   - Configurar bot
   - Crear flujos
   - Integración completa

5. **Módulo 5 (35 min)**: Mejores Prácticas
   - Patrones aplicados
   - Escalabilidad
   - Q&A

---

## 🎓 Puntos Clave para Enseñar

### 1. SRP en Acción
```python
# Mostrar en appointment-service/main.py
- DIContainer: Solo inyección de dependencias
- Cada UseCase: Una única operación
- Repository: Solo persistencia
```

### 2. OCP Demostrado
```javascript
// En notification-service/strategies/
- Agregar WhatsApp sin modificar código existente
- Nuevas estrategias implementan la misma interfaz
```

### 3. LSP Visible
```python
# En repositories.py
- PostgreSQLRepository y CachedRepository son intercambiables
- Ambos cumplen el mismo contrato
```

### 4. ISP Aplicado
```python
# En use_cases.py
- IAppointmentRepository: Solo métodos de persistencia
- IEventPublisher: Solo publicación de eventos
- IValidationService: Solo validación
```

### 5. DIP Implementado
```python
# En main.py - DIContainer
- UseCases dependen de interfaces
- Inyección en tiempo de ejecución
```

---

## 🔧 Comandos Útiles

```bash
# Ver logs de un servicio específico
docker-compose logs -f appointment-service

# Reiniciar un servicio
docker-compose restart patient-service

# Ejecutar comandos en contenedor
docker-compose exec postgres psql -U appointment_user -d appointment_db

# Detener todo
docker-compose down

# Limpiar todo (incluyendo volúmenes)
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Problema: Puerto ocupado
```bash
# Cambiar puerto en docker-compose.yml
# O detener proceso que usa el puerto
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows
```

### Problema: N8N no recibe mensajes
```bash
# Configurar webhook manualmente
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=http://tu-ip-publica:5678/webhook/telegram-bot-webhook"
```

### Problema: Base de datos no conecta
```bash
# Verificar que PostgreSQL esté listo
docker-compose logs postgres
# Buscar: "database system is ready to accept connections"
```

---

## 📈 Métricas de Éxito de la Clase

- [ ] Los estudiantes pueden identificar cada principio SOLID en el código
- [ ] Pueden explicar por qué se usa cada patrón de diseño
- [ ] Logran hacer funcionar el bot de Telegram
- [ ] Completan al menos un ejercicio de refactoring
- [ ] Entienden la arquitectura de microservicios

---

## 🎉 ¡Sistema Completo y Listo!

Has recibido:
- ✅ **33+ archivos** de código funcional
- ✅ **5 microservicios** completamente implementados
- ✅ **Principios SOLID** aplicados y documentados
- ✅ **Bot de Telegram** funcional
- ✅ **N8N workflows** configurados
- ✅ **PostgreSQL** con schema completo
- ✅ **Docker** configuración lista
- ✅ **Documentación** completa para enseñar

### Para Comenzar la Clase:
1. Ejecutar: `docker-compose up -d`
2. Verificar: `docker-compose ps`
3. Abrir: http://localhost:5678 (N8N)
4. Telegram: Hablar con tu bot
5. ¡Enseñar SOLID con código real! 🚀

---

## 💡 Tips Finales

1. **Preparación**: Probar todo un día antes
2. **Durante la clase**: Tener código de respaldo funcionando
3. **Ejercicios**: Comenzar simple, aumentar complejidad
4. **Debugging**: Mostrar cómo resolver problemas reales
5. **Cierre**: Dejar tarea práctica para reforzar

¡Éxito con tu clase! 🎓
