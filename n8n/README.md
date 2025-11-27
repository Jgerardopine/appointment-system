# n8n Workflow - Sistema de Citas Médicas

Este directorio contiene el workflow de n8n para el bot de Telegram.

## 📁 Archivos

- `workflows/telegram-bot-complete.json` - Workflow completo y optimizado

## 🚀 Importar el Workflow

1. Accede a n8n: http://localhost:5678
2. Login: `admin` / `n8n_admin_123`
3. Menú → **Import from File**
4. Selecciona: `telegram-bot-complete.json`
5. Configura las credenciales de Telegram
6. Activa el workflow

## 📊 Estructura del Workflow

El workflow tiene **29 nodos** organizados en estos flujos:

### 1. Entrada
- **Telegram Trigger**: Recibe mensajes del bot

### 2. Procesamiento
- **Parse Message**: Extrae comando y parámetros
- **Command Router**: Enruta a la función correcta

### 3. Comandos Implementados (9)

#### `/start`
- Format Welcome → Send Message

#### `/doctores`
- Validate Doctores → List Doctores API → Format Doctores Response → Send Message

#### `/disponibilidad [id] [fecha]`
- Validate Disponibilidad → Check Availability API → Format Availability Response → Send Message

#### `/agendar [Doctor] [fecha] [hora]`
- Validate Appointment → Create Appointment API → Format Response → Send Message

#### `/mis_citas`
- List Appointments API → Format List Response → Send Message

#### `/verificar [id]`
- Validate Verify → Get Appointment API → Format Verify Response → Send Message

#### `/confirmar [id]`
- Validate Confirm → Confirm Appointment API → Format Confirm Response → Send Message

#### `/cancelar [id]`
- Validate Cancel → Cancel Appointment API → Format Cancel Response → Send Message

#### `/ayuda`
- Format Help → Send Message

### 4. Salida
- **Send Telegram Message**: Envía respuesta al usuario

## 🔧 Endpoints API Configurados

Todos los nodos HTTP Request usan comunicación directa con `appointment-service:3001`:

| Endpoint | Método | Función |
|----------|--------|---------|
| `/appointments` | POST | Crear cita |
| `/appointments/{id}` | GET | Obtener cita |
| `/appointments/{id}` | DELETE | Cancelar cita |
| `/appointments?patient_id={id}` | GET | Listar citas |
| `/appointments/{id}/confirm` | POST | Confirmar cita |
| `/appointments/availability/{doctor_id}` | GET | Ver disponibilidad |
| `/doctors` | GET | Listar doctores |

## ✅ Verificaciones

### Verificar que el workflow está correcto

```bash
# Debe tener 993 líneas
wc -l workflows/telegram-bot-complete.json

# Debe tener webhookId correcto
grep "webhookId" workflows/telegram-bot-complete.json
# Resultado esperado: "webhookId": "telegram-bot-webhook"

# Debe usar appointment-service (no api-gateway)
grep -c "appointment-service:3001" workflows/telegram-bot-complete.json
# Resultado esperado: 7
```

### Verificar nodos críticos

**Validate Appointment (validación de fecha):**
```bash
grep "todayStr" workflows/telegram-bot-complete.json
# Debe existir (validación de fecha correcta)
```

**Format Response (acceso a chatId):**
```bash
grep "Validate Appointment').item.json.chatId" workflows/telegram-bot-complete.json
# Debe existir (acceso correcto a chatId)
```

## 🐛 Solución de Problemas

### Workflow no se activa

**Solución:**
- Verifica que las credenciales de Telegram estén configuradas
- Verifica que el webhook URL incluya: `/webhook/telegram-bot-webhook`

### Error 404 en APIs

**Causa:** URLs incorrectas en nodos HTTP Request

**Solución:**
- Reimporta el workflow desde `telegram-bot-complete.json`
- Verifica que las URLs usen `appointment-service:3001`, NO `api-gateway:3000`

### Error "Bad request"

**Causa:** `chatId` no accesible en nodos Format Response

**Solución:**
- Reimporta el workflow (ya tiene el fix aplicado)
- Verifica que los nodos Format Response usen:
  ```javascript
  const chatId = $('Validate Appointment').item.json.chatId;
  ```

## 📝 Modificaciones Aplicadas

El workflow actual incluye estos fixes críticos:

1. ✅ **webhookId**: Cambiado a `telegram-bot-webhook`
2. ✅ **Command Router**: Orden correcto de conexiones
3. ✅ **Endpoints API**: URLs directas a `appointment-service:3001`
4. ✅ **Validación de fecha**: Comparación de strings (sin bugs de zona horaria)
5. ✅ **Parsing de `/agendar`**: Soporta nombres de múltiples palabras
6. ✅ **Acceso a chatId**: Desde nodo correcto (5 nodos corregidos)

## 🔄 Volver a Importar

Si necesitas reimportar el workflow:

1. **Elimina** el workflow anterior en n8n
2. **Importa** desde `telegram-bot-complete.json`
3. **Configura** credenciales de Telegram:
   - Telegram Trigger → Credentials → Telegram Bot API
   - Send Telegram Message → Usa las mismas credenciales
4. **Activa** el workflow

## 📊 Estadísticas

- **Líneas de JSON**: 993
- **Nodos totales**: 29
- **Comandos**: 9
- **Endpoints HTTP**: 7
- **Validaciones**: 6
- **Formato de respuestas**: 8

---

Para más información, consulta el [README principal](../README.md).
