# Workflows de N8n para Sistema de Citas Médicas

Este directorio contiene los workflows de N8n para integrar Telegram con el sistema de citas médicas.

## 📁 Estructura

```
n8n/
├── workflows/
│   └── telegram-bot-complete.json   # Workflow principal del bot de Telegram
└── README.md                          # Este archivo
```

## 🤖 Workflow Principal: Telegram Bot

El workflow `telegram-bot-complete.json` proporciona un bot de Telegram completamente funcional para:

### ✨ Funcionalidades

1. **🏠 Menú Principal** (`/start`)
   - Mensaje de bienvenida personalizado
   - Botones interactivos para acciones rápidas
   - Lista de comandos disponibles

2. **📅 Agendar Citas** (`/agendar`)
   - Formato: `/agendar [Doctor] [Fecha] [Hora]`
   - Ejemplo: `/agendar Dr. López 2024-12-01 10:00`
   - Validación de fechas (no permite fechas pasadas)
   - Validación de formato de hora (HH:MM)
   - Confirmación con detalles de la cita

3. **🔍 Verificar Citas** (`/verificar`)
   - Formato: `/verificar [ID_CITA]`
   - Ejemplo: `/verificar 1`
   - Muestra estado actual de la cita
   - Información completa del doctor, fecha y hora
   - Opciones para confirmar o cancelar

4. **❌ Cancelar Citas** (`/cancelar`)
   - Formato: `/cancelar [ID_CITA]`
   - Ejemplo: `/cancelar 1`
   - Confirmación de cancelación
   - Actualización de estado en base de datos

5. **📋 Listar Citas** (`/mis_citas`)
   - Muestra todas las citas del usuario
   - Información resumida de cada cita
   - Estado visual con emojis
   - Botones para acciones rápidas

6. **❓ Ayuda** (`/ayuda`)
   - Guía completa de uso
   - Lista de todos los comandos
   - Formatos aceptados
   - Tips y mejores prácticas

## 🏗️ Arquitectura del Workflow

```
┌─────────────────┐
│ Telegram Trigger│
│   (Webhook)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse Message  │
│  (Extract data) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Command Router  │──┬── /start ──────► Format Welcome
│   (Switch)      │  │
└─────────────────┘  ├── /agendar ────► Validate → API → Response
                     │
                     ├── /verificar ──► Validate → API → Response
                     │
                     ├── /cancelar ───► Validate → API → Response
                     │
                     ├── /mis_citas ──► API → Format List
                     │
                     └── /ayuda ──────► Format Help
```

### Nodos Principales

1. **Telegram Trigger**: Recibe mensajes de Telegram
2. **Parse Message**: Extrae comando y parámetros
3. **Command Router**: Enruta según el comando
4. **Validation Nodes**: Validan entrada del usuario
5. **API Nodes**: Llaman a los microservicios
6. **Format Nodes**: Formatean respuestas para Telegram
7. **Send Message**: Envía respuesta al usuario

## 📥 Importar Workflow

### Método 1: Desde la Interfaz Web

1. Accede a N8n: `http://localhost:5678`
2. Inicia sesión (usuario: `admin`, contraseña: `n8n_admin_123`)
3. Haz clic en **"+ New workflow"**
4. Menú (⋮) → **"Import from file..."**
5. Selecciona `telegram-bot-complete.json`

### Método 2: Usando la API de N8n

```bash
# Importar workflow vía API
curl -X POST http://localhost:5678/rest/workflows \
  -H "Content-Type: application/json" \
  -u admin:n8n_admin_123 \
  -d @n8n/workflows/telegram-bot-complete.json
```

### Método 3: Copiar al Volumen de Docker

```bash
# Copiar directamente al volumen de N8n
docker cp n8n/workflows/telegram-bot-complete.json n8n:/home/node/.n8n/workflows/
```

## ⚙️ Configuración

### 1. Obtener Token de Telegram

```bash
# En Telegram, habla con @BotFather
/newbot
# Sigue las instrucciones y guarda el token
```

### 2. Configurar Credenciales en N8n

1. En el workflow, haz clic en **"Telegram Trigger"**
2. Click en **"Create New Credential"**
3. Ingresa:
   - **Name**: `Telegram Bot API`
   - **Access Token**: Tu token de BotFather
4. **Guarda** las credenciales

### 3. Aplicar Credenciales a Todos los Nodos

El workflow tiene dos nodos que usan Telegram:
- **Telegram Trigger**: Para recibir mensajes
- **Send Telegram Message**: Para enviar respuestas

Aplica las mismas credenciales a ambos nodos.

### 4. Verificar URLs de API

Los nodos HTTP Request usan estas URLs:
- `http://api-gateway:3000/api/appointments` - Crear citas
- `http://api-gateway:3000/api/appointments/{id}` - Obtener/cancelar citas
- `http://api-gateway:3000/api/appointments?patient_id={id}` - Listar citas

Estas URLs funcionan dentro de la red Docker. Si tu configuración es diferente, actualízalas.

## ▶️ Activar Workflow

1. Guarda el workflow: Botón **"Save"**
2. Activa el workflow: Switch en **"Active"**
3. El webhook ahora está escuchando mensajes

## 🧪 Probar el Bot

### Comandos de Prueba

```bash
# Iniciar el bot
/start

# Agendar una cita
/agendar Dr. López 2024-12-15 10:00
/agendar Dra. García 2024-12-16 14:30

# Ver tus citas
/mis_citas

# Verificar una cita (usa el ID de la respuesta anterior)
/verificar 1

# Cancelar una cita
/cancelar 1

# Ver ayuda
/ayuda
```

## 🔧 Personalización

### Modificar Mensajes

Los mensajes están en los nodos **"Format..."**:
- `Format Welcome` - Mensaje de bienvenida
- `Format Response` - Confirmación de cita creada
- `Format Verify Response` - Información de cita
- `Format Cancel Response` - Confirmación de cancelación
- `Format List Response` - Lista de citas
- `Format Help` - Mensaje de ayuda

Para personalizar:
1. Haz clic en el nodo correspondiente
2. Edita el código JavaScript
3. Busca la variable `message` o `welcomeMessage`
4. Modifica el texto según necesites
5. Guarda el workflow

### Agregar Nuevos Comandos

Para agregar un comando nuevo:

1. **Actualizar Command Router**:
   - Agrega una nueva condición en el nodo "Command Router"
   - Define el nuevo comando (ej: `/doctores`)

2. **Crear Nodos de Procesamiento**:
   - Agrega nodos para validación
   - Agrega nodos para llamar APIs
   - Agrega nodo para formatear respuesta

3. **Conectar Nodos**:
   - Conecta la nueva salida del router a tus nodos
   - Conecta el último nodo a "Send Telegram Message"

### Ejemplo: Agregar Comando `/doctores`

```javascript
// En Command Router, agregar condición:
{
  "conditions": {
    "string": [{
      "value1": "={{$json.command}}",
      "value2": "doctores"
    }]
  },
  "outputKey": "doctores"
}

// Crear nuevo nodo "Format Doctors":
const chatId = $input.first().json.chatId;

const doctorsMessage = `👨‍⚕️ **Doctores Disponibles**

1. Dr. Juan López - Medicina General
2. Dra. María García - Pediatría  
3. Dr. Carlos Ruiz - Cardiología

Usa /agendar para agendar una cita`;

const keyboard = {
  inline_keyboard: [
    [{ text: '📅 Agendar Cita', callback_data: '/agendar' }],
    [{ text: '🏠 Menú Principal', callback_data: '/start' }]
  ]
};

return [{
  json: {
    chatId: chatId,
    message: doctorsMessage,
    keyboard: keyboard
  }
}];
```

## 🔍 Debugging

### Ver Ejecuciones

1. En N8n, ve a **"Executions"** en el menú lateral
2. Lista de todas las ejecuciones del workflow
3. Haz clic en una para ver detalles
4. Inspecciona datos que pasaron por cada nodo

### Logs de N8n

```bash
# Ver logs en tiempo real
docker logs n8n -f

# Últimas 100 líneas
docker logs n8n --tail 100

# Buscar errores
docker logs n8n 2>&1 | grep -i error
```

### Probar Nodos Individualmente

1. Haz clic en un nodo
2. Click en **"Execute node"**
3. Proporciona datos de prueba si es necesario
4. Ve el output en el panel

### Errores Comunes

**Error: "Credentials not configured"**
- Solución: Configura las credenciales de Telegram en los nodos

**Error: "Cannot reach API"**
- Solución: Verifica que los servicios backend estén corriendo
- Comando: `docker-compose ps`

**Error: "Invalid date format"**
- Solución: Usa formato AAAA-MM-DD (ej: 2024-12-15)

**Bot no responde**
- Verifica que el workflow esté activo (switch verde)
- Revisa las ejecuciones en N8n para ver errores
- Verifica el token de Telegram

## 📊 Monitoreo

### Métricas Disponibles

N8n expone métricas en: `http://localhost:5678/metrics`

```bash
# Ver métricas
curl http://localhost:5678/metrics
```

### Estadísticas del Workflow

En N8n UI:
- **Executions**: Total de ejecuciones
- **Success Rate**: Porcentaje de éxito
- **Average Time**: Tiempo promedio de ejecución
- **Error Rate**: Tasa de errores

## 🔐 Seguridad

### Mejores Prácticas

1. **Cambia las credenciales por defecto**:
   ```bash
   # En .env
   N8N_BASIC_AUTH_USER=tu_usuario
   N8N_BASIC_AUTH_PASSWORD=tu_contraseña_segura
   ```

2. **No compartas tu token de Telegram**:
   - Nunca lo subas a repositorios públicos
   - Úsalo solo en variables de entorno

3. **Limita acceso a N8n**:
   - Usa firewall para puerto 5678
   - Considera usar HTTPS en producción

4. **Valida entrada de usuarios**:
   - El workflow ya incluye validaciones básicas
   - Agrega validaciones adicionales según necesites

## 🚀 Producción

### Checklist antes de ir a Producción

- [ ] Cambiar credenciales por defecto
- [ ] Configurar HTTPS para N8n
- [ ] Configurar backups de workflows
- [ ] Implementar logging centralizado
- [ ] Configurar alertas de errores
- [ ] Probar todos los comandos
- [ ] Documentar comandos para usuarios
- [ ] Configurar rate limiting en Telegram

### Configuración HTTPS

```yaml
# En docker-compose.yml, agregar:
n8n:
  environment:
    - N8N_PROTOCOL=https
    - N8N_HOST=tu-dominio.com
    - WEBHOOK_URL=https://tu-dominio.com/
```

### Backups

```bash
# Backup de workflows
docker exec n8n tar czf /tmp/n8n-backup.tar.gz /home/node/.n8n

# Extraer backup
docker cp n8n:/tmp/n8n-backup.tar.gz ./backups/

# Automatizar con cron
0 2 * * * docker exec n8n tar czf /tmp/n8n-backup.tar.gz /home/node/.n8n && docker cp n8n:/tmp/n8n-backup.tar.gz /backups/n8n-$(date +\%Y\%m\%d).tar.gz
```

## 📚 Recursos Adicionales

- [Documentación Oficial de N8n](https://docs.n8n.io)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Guía de Configuración Completa](../docs/N8N_TELEGRAM_SETUP.md)
- [Quick Start Guide](../QUICK_START.md)

## 🆘 Soporte

Si tienes problemas:

1. Revisa la [Guía de Troubleshooting](../docs/N8N_TELEGRAM_SETUP.md#troubleshooting)
2. Ejecuta el script de verificación: `./scripts/verify-setup.sh`
3. Revisa los logs: `docker-compose logs -f n8n`
4. Consulta las ejecuciones en N8n UI

## 📝 Changelog

### v1.0.0 - 2024-11-24
- ✨ Workflow inicial con funcionalidad completa
- ✅ Soporte para comandos: start, agendar, verificar, cancelar, mis_citas, ayuda
- 🔧 Integración con API Gateway
- 📱 Botones interactivos en Telegram
- ✅ Validación de entrada de usuarios
- 🐛 Manejo de errores robusto
