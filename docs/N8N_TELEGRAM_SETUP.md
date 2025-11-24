# Guía de Configuración de N8n con Telegram

## 📋 Índice
1. [Prerrequisitos](#prerrequisitos)
2. [Crear Bot de Telegram](#crear-bot-de-telegram)
3. [Configurar N8n](#configurar-n8n)
4. [Importar Workflow](#importar-workflow)
5. [Configurar Credenciales](#configurar-credenciales)
6. [Activar y Probar](#activar-y-probar)
7. [Troubleshooting](#troubleshooting)

## 🔧 Prerrequisitos

Antes de comenzar, asegúrate de tener:
- Docker y Docker Compose instalados
- Los servicios corriendo (`docker-compose up -d`)
- Una cuenta de Telegram

## 🤖 Crear Bot de Telegram

### Paso 1: Abrir BotFather

1. Abre Telegram en tu dispositivo
2. Busca `@BotFather` (es el bot oficial de Telegram)
3. Inicia una conversación con `/start`

### Paso 2: Crear el Bot

1. Envía el comando `/newbot`
2. BotFather te pedirá un nombre para tu bot:
   ```
   Ejemplo: Sistema de Citas Médicas
   ```
3. Luego te pedirá un username (debe terminar en 'bot'):
   ```
   Ejemplo: citas_medicas_bot
   ```
4. **IMPORTANTE**: BotFather te dará un token. Guárdalo, lo necesitarás.
   ```
   Ejemplo de token: 6234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
   ```

### Paso 3: Configurar el Bot (Opcional)

Puedes personalizar tu bot con estos comandos:

```bash
/setdescription - Descripción del bot
/setabouttext - Texto "Acerca de"
/setuserpic - Foto de perfil
/setcommands - Lista de comandos
```

Comandos sugeridos para configurar con `/setcommands`:
```
start - Iniciar el bot y ver el menú principal
agendar - Agendar una nueva cita médica
verificar - Verificar el estado de una cita
cancelar - Cancelar una cita existente
mis_citas - Ver todas mis citas
ayuda - Ver ayuda y comandos disponibles
```

## ⚙️ Configurar N8n

### Paso 1: Acceder a N8n

1. Abre tu navegador y ve a: `http://localhost:5678`
2. Ingresa las credenciales por defecto:
   - Usuario: `admin`
   - Contraseña: `n8n_admin_123`

> **Nota**: Estas credenciales están definidas en el archivo `.env`

### Paso 2: Actualizar Variables de Entorno

1. Detén los contenedores:
   ```bash
   docker-compose down
   ```

2. Edita el archivo `.env` en la raíz del proyecto:
   ```bash
   # Agrega o actualiza esta línea con tu token de Telegram
   TELEGRAM_BOT_TOKEN=6234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
   ```

3. Reinicia los contenedores:
   ```bash
   docker-compose up -d
   ```

## 📥 Importar Workflow

### Método 1: Desde la Interfaz de N8n

1. En N8n, haz clic en el botón **"+ New workflow"** (esquina superior derecha)
2. Haz clic en el menú de tres puntos (⋮) en la esquina superior derecha
3. Selecciona **"Import from file..."**
4. Navega a: `n8n/workflows/telegram-bot-complete.json`
5. Selecciona el archivo y haz clic en **"Open"**
6. El workflow debería cargarse con todos sus nodos

### Método 2: Copiar y Pegar JSON

1. Abre el archivo `n8n/workflows/telegram-bot-complete.json` con un editor de texto
2. Copia todo el contenido (Ctrl+A, Ctrl+C)
3. En N8n, haz clic en **"+ New workflow"**
4. Haz clic en el menú de tres puntos (⋮)
5. Selecciona **"Import from URL / JSON"**
6. Pega el JSON copiado
7. Haz clic en **"Import"**

## 🔐 Configurar Credenciales

### Paso 1: Crear Credenciales de Telegram

1. En el workflow importado, verás varios nodos con **signos de exclamación rojos** (⚠️)
2. Haz clic en el nodo **"Telegram Trigger"** (el primero)
3. En el panel lateral, verás un campo **"Credential to connect with"**
4. Haz clic en **"Create New Credential"**
5. Ingresa la información:
   - **Name**: `Telegram Bot API` (o el nombre que prefieras)
   - **Access Token**: Pega el token que obtuviste de BotFather
6. Haz clic en **"Create"**

### Paso 2: Aplicar Credenciales a Otros Nodos

1. Haz clic en el nodo **"Send Telegram Message"**
2. En el campo de credenciales, selecciona las credenciales que acabas de crear
3. Repite para cualquier otro nodo de Telegram que tenga el símbolo de advertencia

## ✅ Activar y Probar

### Paso 1: Guardar el Workflow

1. Haz clic en el botón **"Save"** en la esquina superior derecha
2. Dale un nombre descriptivo: `Telegram Bot - Sistema de Citas`

### Paso 2: Activar el Workflow

1. En la esquina superior derecha, verás un interruptor **"Inactive"**
2. Haz clic en él para cambiar a **"Active"**
3. El workflow ahora está escuchando mensajes de Telegram

### Paso 3: Probar el Bot

1. Abre Telegram
2. Busca tu bot por el username que creaste (ej: `@citas_medicas_bot`)
3. Envía el comando `/start`
4. Deberías recibir un mensaje de bienvenida con botones interactivos

### Comandos de Prueba

Prueba estos comandos para verificar que todo funciona:

```bash
# Ver menú de ayuda
/start

# Agendar una cita (ejemplo)
/agendar Dr. López 2024-12-01 10:00

# Ver tus citas
/mis_citas

# Ayuda
/ayuda
```

## 🔍 Verificar Estado del Workflow

### Ver Ejecuciones

1. En N8n, ve a **"Executions"** en el menú lateral izquierdo
2. Aquí verás todas las ejecuciones del workflow
3. Haz clic en cualquier ejecución para ver los detalles
4. Puedes ver qué nodos se ejecutaron y qué datos pasaron por cada uno

### Debugging

Si algo no funciona:

1. **Revisa los logs de ejecución**:
   - Ve a "Executions"
   - Busca ejecuciones con errores (marcadas en rojo)
   - Haz clic para ver el detalle del error

2. **Ejecuta manualmente un nodo**:
   - Haz clic en un nodo
   - Haz clic en "Execute node"
   - Verás los datos de entrada y salida

## 🐛 Troubleshooting

### Error: "Workflow could not be imported"

**Causa**: El formato del JSON no es compatible con tu versión de N8n.

**Solución**:
1. Verifica que estás usando N8n v1.0 o superior:
   ```bash
   docker exec n8n n8n --version
   ```
2. Si tienes una versión antigua, actualiza:
   ```bash
   docker-compose pull n8n
   docker-compose up -d n8n
   ```

### Error: "Telegram credentials not configured"

**Causa**: Las credenciales de Telegram no están configuradas correctamente.

**Solución**:
1. Verifica que el token de Telegram es correcto
2. Asegúrate de que no hay espacios extra en el token
3. Prueba crear nuevas credenciales desde cero

### Error: "Cannot reach API Gateway"

**Causa**: Los servicios del backend no están corriendo o no son accesibles.

**Solución**:
1. Verifica que todos los servicios están corriendo:
   ```bash
   docker-compose ps
   ```
2. Todos deben estar en estado "Up"
3. Si alguno está caído, reinícialo:
   ```bash
   docker-compose restart api-gateway
   ```

### Bot no responde a comandos

**Causa**: El webhook de Telegram no está configurado o el workflow no está activo.

**Solución**:
1. Verifica que el workflow está **activo** (switch en verde)
2. Revisa que el nodo "Telegram Trigger" esté configurado correctamente
3. Comprueba los logs de N8n:
   ```bash
   docker logs n8n -f
   ```

### Error: "Invalid appointment date"

**Causa**: El formato de fecha no es correcto.

**Solución**:
Use el formato correcto: `AAAA-MM-DD HH:MM`
```bash
Correcto: /agendar Dr. López 2024-12-01 10:00
Incorrecto: /agendar Dr. López 01/12/2024 10:00 AM
```

## 📊 Verificar Conectividad del API Gateway

Puedes probar manualmente los endpoints del API:

```bash
# Crear una cita de prueba
curl -X POST http://localhost:4000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "123",
    "doctor_id": "doc_lopez",
    "appointment_date": "2024-12-01",
    "appointment_time": "10:00:00",
    "duration_minutes": 30,
    "reason": "Consulta general"
  }'

# Listar citas
curl http://localhost:4000/api/appointments

# Ver una cita específica (reemplaza {id} con un ID real)
curl http://localhost:4000/api/appointments/{id}
```

## 🔄 Reiniciar Todo el Sistema

Si necesitas reiniciar todo desde cero:

```bash
# Detener todos los servicios
docker-compose down

# Opcional: Limpiar volúmenes (CUIDADO: esto borra la base de datos)
docker-compose down -v

# Iniciar nuevamente
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f
```

## 📝 Notas Importantes

1. **Seguridad**: Cambia las credenciales por defecto en producción
2. **Tokens**: Nunca compartas tu token de Telegram
3. **Base de datos**: Haz backups regulares de PostgreSQL
4. **Logs**: Revisa los logs regularmente para detectar problemas
5. **Updates**: Mantén N8n y Docker actualizados

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs:
   ```bash
   docker-compose logs -f n8n
   docker-compose logs -f api-gateway
   ```

2. Verifica el estado de los servicios:
   ```bash
   docker-compose ps
   ```

3. Revisa la documentación oficial:
   - [N8n Documentation](https://docs.n8n.io)
   - [Telegram Bot API](https://core.telegram.org/bots/api)

## ✨ Próximos Pasos

Una vez que todo funcione:

1. Personaliza los mensajes del bot
2. Agrega más comandos personalizados
3. Configura notificaciones automáticas
4. Implementa recordatorios de citas
5. Agrega analytics y reportes
