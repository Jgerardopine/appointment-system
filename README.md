# 🏥 Sistema de Gestión de Citas Médicas con Telegram Bot

Sistema completo de gestión de citas médicas con bot de Telegram, construido con microservicios, n8n, y aplicando principios SOLID.

---

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Características](#-características)
- [Quick Start](#-quick-start)
- [Configuración Detallada](#-configuración-detallada)
- [Comandos del Bot](#-comandos-del-bot)
- [Solución de Problemas](#-solución-de-problemas)
- [Desarrollo](#-desarrollo)

---

## 🏗️ Arquitectura

```
┌──────────────┐     ┌──────────┐     ┌────────────┐     ┌─────────────────┐
│   Telegram   │────▶│   n8n    │────▶│   API      │────▶│  Appointment    │
│     Bot      │◀────│ Workflow │◀────│  Gateway   │◀────│    Service      │
└──────────────┘     └──────────┘     └────────────┘     └─────────────────┘
                                              │           ┌─────────────────┐
                                              ├──────────▶│    Patient      │
                                              │           │    Service      │
                                              │           └─────────────────┘
                                              │           ┌─────────────────┐
                                              └──────────▶│  Notification   │
                                                          │    Service      │
                                                          └─────────────────┘
                                                                   │
                                                          ┌────────▼────────┐
                                                          │   PostgreSQL    │
                                                          └─────────────────┘
```

### Stack Tecnológico

- **Frontend**: Telegram Bot
- **Orquestador**: n8n (workflow automation)
- **Backend**: FastAPI (Python) + Node.js
- **Base de Datos**: PostgreSQL
- **Cache**: Redis
- **Túnel**: Ngrok (para desarrollo)
- **Contenedores**: Docker + Docker Compose

---

## ✨ Características

### Para Pacientes
- ✅ Agendar citas con doctores disponibles
- ✅ Ver disponibilidad de doctores por fecha
- ✅ Listar todas tus citas
- ✅ Verificar detalles de una cita
- ✅ Confirmar citas pendientes
- ✅ Cancelar citas
- ✅ Recibir notificaciones automáticas

### Para el Sistema
- ✅ Arquitectura de microservicios
- ✅ Principios SOLID aplicados
- ✅ Clean Architecture
- ✅ Inyección de dependencias
- ✅ Event-driven architecture
- ✅ API Gateway con rate limiting
- ✅ Logs estructurados
- ✅ Healthchecks automáticos

---

## 🚀 Quick Start

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)
- Cuenta de Telegram
- Token de Bot (obtenerlo de [@BotFather](https://t.me/botfather))

### Instalación en 5 Pasos

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/Jgerardopine/appointment-system.git
cd appointment-system
```

#### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y agregar tu bot token
nano .env  # o usa tu editor favorito
```

**Configuración mínima en `.env`:**
```env
# Telegram
TELEGRAM_BOT_TOKEN=tu_token_de_botfather_aquí

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=appointment_db
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/appointment_db

# n8n
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=n8n_admin_123
```

#### 3. Iniciar Servicios

```bash
# Iniciar todos los contenedores
docker-compose up -d

# Esperar a que todos estén saludables (2-3 minutos)
docker-compose ps
```

**Resultado esperado:**
```
NAME                 STATUS
postgres             Up (healthy)
redis                Up (healthy)
api-gateway          Up (healthy)
appointment-service  Up (healthy)
patient-service      Up (healthy)
notification-service Up (healthy)
n8n                  Up (healthy)
```

#### 4. Configurar Ngrok (Túnel para Webhook)

**Opción A: Ngrok Manual**

```bash
# Instalar ngrok (si no lo tienes)
# Mac: brew install ngrok
# Linux: snap install ngrok
# Windows: descarga de https://ngrok.com/download

# Crear túnel
ngrok http 5678
```

**Copiar la URL HTTPS** que aparece (ej: `https://abc123.ngrok-free.app`)

**Opción B: Usar Ngrok en Docker** (recomendado)

Edita `docker-compose.yml` y descomenta la sección de ngrok:

```yaml
ngrok:
  image: ngrok/ngrok:latest
  command: http n8n:5678
  environment:
    - NGROK_AUTHTOKEN=tu_token_de_ngrok
  ports:
    - "4040:4040"
```

Luego reinicia:
```bash
docker-compose up -d ngrok
```

Obtén la URL pública en: http://localhost:4040

#### 5. Configurar n8n y el Workflow

**5.1. Acceder a n8n**
- URL: http://localhost:5678
- Usuario: `admin`
- Password: `n8n_admin_123`

**5.2. Importar el Workflow**

1. Menú → **Workflows**
2. Click en **Import from File**
3. Selecciona: `n8n/workflows/telegram-bot-complete.json`
4. Click **Import**

**5.3. Configurar Credenciales de Telegram**

1. Abre el nodo **"Telegram Trigger"**
2. Click en **Credentials** → **Create New**
3. **Bot Token**: Pega tu token de @BotFather
4. **Save**

5. Abre el nodo **"Send Telegram Message"**
6. Usa las mismas credenciales
7. **Save**

**5.4. Configurar la URL de Webhook**

1. En el nodo **"Telegram Trigger"**
2. **Webhook URL**: Pega tu URL de Ngrok + `/webhook/telegram-bot-webhook`
   - Ejemplo: `https://abc123.ngrok-free.app/webhook/telegram-bot-webhook`
3. **Save**

**5.5. Activar el Workflow**

- Click en el botón **"Active"** (arriba a la derecha)
- Debe cambiar a verde ✅

---

## ⚙️ Configuración Detallada

### Crear el Bot de Telegram

1. Abre Telegram y busca [@BotFather](https://t.me/botfather)
2. Envía `/newbot`
3. Sigue las instrucciones:
   - **Nombre del bot**: Sistema de Citas Médicas
   - **Username**: tu_bot_citas_bot (debe terminar en "bot")
4. Copia el **token** que te da BotFather
5. Pégalo en tu archivo `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Configurar Comandos del Bot

En @BotFather, envía `/setcommands` y luego selecciona tu bot. Pega esto:

```
start - Iniciar el bot y ver menú principal
doctores - Ver lista de doctores disponibles
disponibilidad - Ver horarios disponibles de un doctor
agendar - Agendar una nueva cita
mis_citas - Ver todas tus citas
verificar - Verificar detalles de una cita
confirmar - Confirmar una cita pendiente
cancelar - Cancelar una cita
ayuda - Ver ayuda completa
```

### Verificar la Instalación

#### 1. Verificar Servicios Docker

```bash
docker-compose ps
```

Todos deben estar **Up (healthy)**.

#### 2. Verificar Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it postgres psql -U postgres -d appointment_db

# Verificar doctores (debe mostrar 3)
SELECT COUNT(*) FROM doctors;

# Salir
\q
```

#### 3. Verificar API

```bash
# Listar doctores
curl http://localhost:3001/doctors

# Debe devolver JSON con 3 doctores
```

#### 4. Verificar n8n

- Accede a: http://localhost:5678
- Login: `admin` / `n8n_admin_123`
- Debe mostrar el workflow importado y activo ✅

#### 5. Verificar Webhook de Telegram

```bash
# Reemplaza <TOKEN> con tu bot token
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "result": {
    "url": "https://abc123.ngrok-free.app/webhook/telegram-bot-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## 🤖 Comandos del Bot

### `/start`
Muestra el menú principal con botones interactivos.

**Ejemplo:**
```
Usuario: /start

Bot: 👋 ¡Bienvenido al Sistema de Citas Médicas!

¿Qué deseas hacer?
[ 👨‍⚕️ Ver Doctores ] [ 📅 Mis Citas ]
[ 📋 Agendar Cita ] [ ❓ Ayuda ]
```

---

### `/doctores`
Lista todos los doctores disponibles con sus especialidades y horarios.

**Ejemplo:**
```
Usuario: /doctores

Bot: 👨‍⚕️ Doctores Disponibles:

1. Dr. Carlos López
   🩺 Especialidad: Medicina General
   📅 Disponible: Lunes, Miércoles, Viernes
   🕒 Horario: 09:00 - 18:00
   🆔 ID: doc_001

2. Dra. María García
   💓 Especialidad: Cardiología
   📅 Disponible: Martes, Jueves
   🕒 Horario: 10:00 - 17:00
   🆔 ID: doc_002

3. Dr. Juan Pérez
   🦴 Especialidad: Traumatología
   📅 Disponible: Lunes a Viernes
   🕒 Horario: 08:00 - 16:00
   🆔 ID: doc_003

Para ver disponibilidad:
/disponibilidad doc_001 2025-11-26

[ 📅 Ver Disponibilidad ] [ 📋 Agendar ]
```

---

### `/disponibilidad [doctor_id] [fecha]`
Muestra los horarios disponibles de un doctor en una fecha específica.

**Ejemplo:**
```
Usuario: /disponibilidad doc_001 2025-11-26

Bot: 📅 Disponibilidad: Dr. Carlos López
Fecha: 26 de noviembre de 2025

Horarios disponibles:
🕐 09:00 - 09:30
🕐 10:00 - 10:30
🕐 11:00 - 11:30
🕐 14:00 - 14:30
🕐 15:00 - 15:30

Para agendar:
/agendar Dr. Carlos López 2025-11-26 10:00

[ 📋 Agendar ] [ 🔙 Ver Doctores ]
```

---

### `/agendar [Doctor] [fecha] [hora]`
Crea una nueva cita médica.

**Formato:**
```
/agendar [Nombre del Doctor] [YYYY-MM-DD] [HH:MM]
```

**Ejemplo:**
```
Usuario: /agendar Dr. Carlos López 2025-11-26 10:00

Bot: ✅ ¡Cita Agendada Exitosamente!

📋 Detalles de tu cita:
🆔 ID: apt_12345
👨‍⚕️ Doctor: Dr. Carlos López
📅 Fecha: martes, 26 de noviembre de 2025
⏰ Hora: 10:00
⏱ Duración: 30 minutos
📌 Estado: pendiente

💡 Te enviaremos un recordatorio 24 horas antes.

[ 📋 Ver Mis Citas ] [ 🏠 Menú Principal ]
```

---

### `/mis_citas`
Muestra todas tus citas (pasadas, presentes y futuras).

**Ejemplo:**
```
Usuario: /mis_citas

Bot: 📋 Tus Citas:

1. Cita #apt_12345
   👨‍⚕️ Dr. Carlos López
   📅 26/11/2025 a las 10:00
   📊 Estado: pendiente
   
2. Cita #apt_67890
   👨‍⚕️ Dra. María García
   📅 28/11/2025 a las 15:00
   📊 Estado: confirmada ✅

[ Verificar ] [ Confirmar ] [ Cancelar ]
```

---

### `/verificar [id_cita]`
Muestra los detalles completos de una cita específica.

**Ejemplo:**
```
Usuario: /verificar apt_12345

Bot: 📋 Detalles de la Cita:

🆔 ID: apt_12345
👨‍⚕️ Doctor: Dr. Carlos López
🩺 Especialidad: Medicina General
📅 Fecha: martes, 26 de noviembre de 2025
⏰ Hora: 10:00
⏱ Duración: 30 minutos
📌 Estado: pendiente
📝 Motivo: Consulta general

[ Confirmar ] [ Cancelar ]
```

---

### `/confirmar [id_cita]`
Confirma una cita pendiente.

**Ejemplo:**
```
Usuario: /confirmar apt_12345

Bot: ✅ Cita Confirmada!

📅 ID: apt_12345
👨‍⚕️ Dr. Carlos López
📆 26/11/2025 a las 10:00
📊 Estado: confirmada ✅

📌 Recuerda llegar 10 minutos antes.

[ 📋 Ver Mis Citas ] [ 🏠 Menú ]
```

---

### `/cancelar [id_cita]`
Cancela una cita existente.

**Ejemplo:**
```
Usuario: /cancelar apt_12345

Bot: ✅ Cita Cancelada

📅 ID: apt_12345
📊 Estado: cancelada

Puedes agendar una nueva cita cuando quieras:
/agendar

[ 👨‍⚕️ Ver Doctores ] [ 📋 Agendar ]
```

---

### `/ayuda`
Muestra la ayuda completa con todos los comandos.

**Ejemplo:**
```
Usuario: /ayuda

Bot: 📖 Ayuda del Sistema de Citas

COMANDOS DISPONIBLES:

🏠 /start
   Muestra el menú principal

👨‍⚕️ /doctores
   Lista todos los doctores disponibles

📅 /disponibilidad [doctor_id] [fecha]
   Ver horarios disponibles
   Ejemplo: /disponibilidad doc_001 2025-11-26

📋 /agendar [Doctor] [fecha] [hora]
   Crear una cita
   Ejemplo: /agendar Dr. López 2025-11-26 10:00

📋 /mis_citas
   Ver todas tus citas

🔍 /verificar [id_cita]
   Ver detalles de una cita
   Ejemplo: /verificar apt_12345

✅ /confirmar [id_cita]
   Confirmar una cita
   Ejemplo: /confirmar apt_12345

❌ /cancelar [id_cita]
   Cancelar una cita
   Ejemplo: /cancelar apt_12345

FORMATO DE FECHAS:
📅 YYYY-MM-DD (ej: 2025-11-26)

FORMATO DE HORA:
🕐 HH:MM (ej: 10:00, 15:30)

¿Necesitas ayuda? Escríbenos a soporte@ejemplo.com
```

---

## 🔧 Solución de Problemas

### El bot no responde

**Posibles causas y soluciones:**

1. **Webhook no configurado**
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
   - Si `url` está vacío o incorrecto, revisa la configuración en n8n

2. **n8n workflow no está activo**
   - Accede a http://localhost:5678
   - Verifica que el workflow tenga el indicador verde "Active"

3. **Ngrok no está corriendo**
   ```bash
   # Verifica que ngrok esté activo
   curl http://localhost:4040/api/tunnels
   ```

4. **Servicios Docker caídos**
   ```bash
   docker-compose ps
   # Reiniciar servicios si es necesario
   docker-compose restart n8n appointment-service
   ```

---

### Error "404 Not Found" en n8n

**Causa:** URLs de endpoints incorrectas en el workflow.

**Solución:**
1. Abre n8n → Workflow
2. Verifica que los nodos HTTP Request tengan estas URLs:
   - `http://appointment-service:3001/appointments` (POST - crear cita)
   - `http://appointment-service:3001/doctors` (GET - listar doctores)
   - `http://appointment-service:3001/appointments/availability/{doctor_id}` (GET)

Si están mal, reimporta el workflow desde `n8n/workflows/telegram-bot-complete.json`.

---

### Error "Bad request - please check your parameters"

**Causa:** El nodo "Send Telegram Message" no puede acceder a `chatId`.

**Solución:**
El workflow ya tiene el fix aplicado. Si persiste:

1. Reimporta el workflow desde `n8n/workflows/telegram-bot-complete.json`
2. Verifica que el nodo "Format Response" tenga:
   ```javascript
   const chatId = $('Validate Appointment').item.json.chatId;
   ```
   No debe tener:
   ```javascript
   const chatId = previousData.chatId;  // ❌ INCORRECTO
   ```

---

### Error "No puedes agendar citas en fechas pasadas" con fecha futura

**Causa:** Bug de zona horaria en validación de fechas (ya corregido).

**Solución:**
El workflow actual compara fechas como strings. Si persiste:

1. Reimporta el workflow
2. Verifica que "Validate Appointment" tenga:
   ```javascript
   const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
   
   if (params.date < todayStr) { ... }
   ```

---

### Error 500 del backend

**Verificar logs:**
```bash
docker logs appointment-service --tail 50
docker logs api-gateway --tail 50
```

**Soluciones comunes:**

1. **Base de datos sin doctores:**
   ```bash
   docker exec -it postgres psql -U postgres -d appointment_db -c "SELECT COUNT(*) FROM doctors;"
   ```
   Si devuelve 0, los datos de ejemplo no se insertaron. Reinicia:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Servicio no está healthy:**
   ```bash
   docker-compose ps
   # Reiniciar el servicio problemático
   docker-compose restart appointment-service
   ```

---

### Logs para debugging

```bash
# Ver logs en tiempo real
docker-compose logs -f n8n appointment-service

# Ver logs de un servicio específico
docker logs n8n --tail 100
docker logs appointment-service --tail 100

# Ver todos los logs
docker-compose logs --tail 200
```

---

## 👨‍💻 Desarrollo

### Estructura del Proyecto

```
appointment-system/
├── docker-compose.yml          # Orquestación de servicios
├── .env                        # Variables de entorno
├── .env.example               # Plantilla de variables
├── services/
│   ├── api-gateway/           # API Gateway (Node.js)
│   ├── appointment-service/   # Servicio de citas (Python/FastAPI)
│   ├── patient-service/       # Servicio de pacientes (Python/FastAPI)
│   └── notification-service/  # Servicio de notificaciones (Python/FastAPI)
├── n8n/
│   └── workflows/
│       └── telegram-bot-complete.json  # Workflow de n8n
├── scripts/                   # Scripts de utilidad
└── docs/                      # Documentación adicional
```

### Ejecutar Tests

```bash
# Tests del appointment-service
docker exec -it appointment-service pytest

# Tests del patient-service
docker exec -it patient-service pytest

# Tests del API Gateway
docker exec -it api-gateway npm test
```

### Reiniciar un Servicio

```bash
# Reiniciar un servicio específico
docker-compose restart appointment-service

# Reconstruir un servicio
docker-compose up -d --build appointment-service

# Reiniciar todo
docker-compose down
docker-compose up -d
```

### Acceder a los Servicios

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| n8n | http://localhost:5678 | admin / n8n_admin_123 |
| API Gateway | http://localhost:4000 | - |
| Appointment Service | http://localhost:3001 | - |
| Patient Service | http://localhost:3002 | - |
| Notification Service | http://localhost:3003 | - |
| PostgreSQL | localhost:5432 | postgres / postgres123 |
| Redis | localhost:6379 | - |

### Variables de Entorno

Ver `.env.example` para todas las opciones disponibles.

**Mínimas requeridas:**
```env
TELEGRAM_BOT_TOKEN=          # Token de @BotFather
DATABASE_URL=                # URL de PostgreSQL
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=n8n_admin_123
```

---

## 📚 Documentación Adicional

- [API Documentation](./docs/API.md) - Documentación de todos los endpoints
- [Design Document](./docs/DESIGN.md) - Decisiones de arquitectura y diseño
- [Installation Guide](./docs/INSTALLATION.md) - Guía de instalación detallada
- [N8N Setup](./docs/N8N_SETUP.md) - Configuración avanzada de n8n
- [Ngrok Setup](./docs/NGROK_SETUP.md) - Configuración de túnel Ngrok

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👤 Autor

**Tu Nombre**
- GitHub: [@Jgerardopine](https://github.com/Jgerardopine)
- Proyecto: [appointment-system](https://github.com/Jgerardopine/appointment-system)

---

## 🙏 Agradecimientos

- [n8n.io](https://n8n.io/) - Workflow automation
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Telegram Bot API](https://core.telegram.org/bots/api) - Bot platform
- [Ngrok](https://ngrok.com/) - Secure tunnels to localhost

---

## ✅ Estado del Proyecto

**Versión:** 1.0.0  
**Estado:** ✅ Producción  
**Última actualización:** 2025-11-25

### Funcionalidades Implementadas

- ✅ Bot de Telegram completo con 9 comandos
- ✅ Gestión de citas (CRUD completo)
- ✅ Gestión de doctores
- ✅ Verificación de disponibilidad
- ✅ Sistema de notificaciones
- ✅ Workflow de n8n optimizado
- ✅ API Gateway con rate limiting
- ✅ Microservicios con Clean Architecture
- ✅ Base de datos PostgreSQL
- ✅ Cache con Redis
- ✅ Logs estructurados
- ✅ Healthchecks automáticos
- ✅ Docker Compose completo

---

**¿Necesitas ayuda?** Abre un [Issue](https://github.com/Jgerardopine/appointment-system/issues) en GitHub.
