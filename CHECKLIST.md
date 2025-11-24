# ✅ Checklist de Configuración del Sistema

## 🎯 Objetivo
Este checklist te ayuda a verificar que todo está correctamente configurado.

---

## 📋 Pre-Requisitos

- [ ] Docker Desktop instalado y corriendo
- [ ] Docker Compose instalado
- [ ] Git instalado (opcional)
- [ ] Cuenta de Telegram activa
- [ ] Editor de texto (VS Code, Sublime, etc.)

**Verificar Docker**:
```bash
docker --version
docker-compose --version
```

---

## 🔧 Configuración Inicial

### 1. Archivos del Proyecto

- [ ] Proyecto descargado/clonado en tu computadora
- [ ] Navegado al directorio del proyecto: `cd /ruta/al/proyecto`
- [ ] Verificada estructura de carpetas con `ls -la`

### 2. Variables de Entorno

- [ ] Archivo `.env.example` existe
- [ ] Copiado `.env.example` a `.env`: `cp .env.example .env`
- [ ] Archivo `.env` creado correctamente

**Verificar**:
```bash
ls -la .env
```

### 3. Token de Telegram

- [ ] Abierto Telegram
- [ ] Buscado `@BotFather`
- [ ] Creado nuevo bot con `/newbot`
- [ ] Proporcionado nombre del bot
- [ ] Proporcionado username del bot (termina en 'bot')
- [ ] **Token recibido y guardado**

**Formato del token**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

- [ ] Token pegado en archivo `.env`:
```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
```

- [ ] Archivo `.env` guardado

---

## 🚀 Iniciar Servicios

### 1. Build de Contenedores

```bash
docker-compose up --build -d
```

- [ ] Comando ejecutado sin errores
- [ ] Proceso de build completado
- [ ] Todos los contenedores iniciados

**Tiempo estimado**: 3-5 minutos la primera vez

### 2. Verificar Estado de Contenedores

```bash
docker-compose ps
```

Deberías ver estos servicios en estado "Up":
- [ ] `postgres` - Base de datos (Puerto 5432)
- [ ] `api-gateway` - Gateway principal (Puerto 4000)
- [ ] `appointment-service` - Servicio de citas (Puerto 3001)
- [ ] `patient-service` - Servicio de pacientes (Puerto 3002)
- [ ] `notification-service` - Servicio de notificaciones (Puerto 3003)
- [ ] `n8n` - Automatización (Puerto 5678)
- [ ] `redis` - Cache (Puerto 6379) [Opcional]

**Si algún servicio está "Exit" o "Restarting"**:
```bash
# Ver logs del servicio problemático
docker-compose logs [nombre-servicio]
```

### 3. Verificar Logs Iniciales

```bash
docker-compose logs -f
```

- [ ] No hay errores críticos visibles
- [ ] PostgreSQL muestra "ready to accept connections"
- [ ] Servicios muestran "Server started on port..."

**Presiona Ctrl+C para salir de los logs**

---

## 🔍 Verificación de Servicios

### Script Automático de Verificación

```bash
chmod +x scripts/verify-setup.sh
./scripts/verify-setup.sh
```

- [ ] Script ejecutado correctamente
- [ ] Todos los checks en verde (✓)
- [ ] Resultado final: "Sistema completamente operativo"

### Verificación Manual de APIs

#### 1. API Gateway
```bash
curl http://localhost:4000/api/health
```
- [ ] Responde con código 200
- [ ] Respuesta JSON con status "ok" o similar

#### 2. Appointment Service
```bash
curl http://localhost:3001/health
```
- [ ] Responde correctamente

#### 3. Patient Service
```bash
curl http://localhost:3002/health
```
- [ ] Responde correctamente

#### 4. N8N Web UI
```bash
# Abrir en navegador
open http://localhost:5678
# O en Windows
start http://localhost:5678
```
- [ ] Página de login de N8n cargó
- [ ] No hay errores de conexión

---

## 🤖 Configuración de N8N

### 1. Acceso a N8N

URL: `http://localhost:5678`

Credenciales por defecto:
- Usuario: `admin`
- Contraseña: `n8n_admin_123`

- [ ] Login exitoso en N8n
- [ ] Dashboard de N8n visible

### 2. Importar Workflow

- [ ] Click en "+ New workflow" (esquina superior derecha)
- [ ] Click en menú de tres puntos (⋮)
- [ ] Seleccionado "Import from file..."
- [ ] Navegado a: `n8n/workflows/telegram-bot-complete.json`
- [ ] Archivo importado sin errores
- [ ] Workflow visible con todos los nodos

**Si hay error de importación**:
- Ver archivo `docs/WORKFLOW_FIXES.md`
- Verificar que el archivo JSON es válido

### 3. Configurar Credenciales de Telegram

- [ ] Click en nodo "Telegram Trigger" (primer nodo)
- [ ] Click en "Create New Credential"
- [ ] Nombre ingresado: "Telegram Bot API" (o el que prefieras)
- [ ] Token de Telegram pegado en campo "Access Token"
- [ ] Click en "Create" o "Save"
- [ ] Credencial creada exitosamente

### 4. Aplicar Credenciales a Nodos

El workflow tiene 2 nodos que necesitan credenciales:

**Nodo 1: Telegram Trigger**
- [ ] Ya configurado en el paso anterior

**Nodo 2: Send Telegram Message**
- [ ] Click en el nodo "Send Telegram Message"
- [ ] En campo "Credential to connect with"
- [ ] Seleccionadas las credenciales creadas
- [ ] Credencial aplicada

### 5. Guardar y Activar Workflow

- [ ] Click en botón "Save" (esquina superior derecha)
- [ ] Nombre del workflow: "Telegram Bot - Sistema de Citas"
- [ ] Workflow guardado correctamente
- [ ] Switch cambiado de "Inactive" a "Active" (debe verse en verde)
- [ ] Workflow activado exitosamente

**Verificar activación**:
- El switch debe estar en verde
- En la lista de workflows debe aparecer con estado "Active"

---

## 📱 Prueba del Bot de Telegram

### 1. Encontrar el Bot

- [ ] Telegram abierto
- [ ] Buscado el username del bot creado en BotFather
- [ ] Bot encontrado en resultados de búsqueda
- [ ] Click en el bot

### 2. Iniciar Conversación

**Comando**: `/start`

- [ ] Comando enviado
- [ ] Bot respondió con mensaje de bienvenida
- [ ] Mensaje incluye botones interactivos
- [ ] Botones visibles: "📅 Agendar Cita", "📋 Mis Citas", "❓ Ayuda"

**Si el bot NO responde**:
1. Verificar que el workflow está activo (switch verde)
2. En N8n, ir a "Executions" y buscar errores
3. Revisar logs: `docker logs n8n -f`
4. Ver guía de troubleshooting: `docs/N8N_TELEGRAM_SETUP.md`

### 3. Probar Comando de Ayuda

**Comando**: `/ayuda`

- [ ] Comando enviado
- [ ] Bot respondió con mensaje de ayuda completo
- [ ] Mensaje muestra todos los comandos disponibles

### 4. Agendar Cita de Prueba

**Comando**: `/agendar Dr. Prueba 2024-12-15 10:00`

⚠️ **Importante**: Usa una fecha futura

- [ ] Comando enviado con fecha futura
- [ ] Bot respondió con confirmación
- [ ] Mensaje incluye:
  - ✅ Símbolo de éxito
  - 🆔 ID de la cita
  - 📅 Fecha de la cita
  - ⏰ Hora de la cita
  - Botones de acción

**Guardar el ID de la cita**: ___________

### 5. Verificar Cita

**Comando**: `/verificar [ID]` (usa el ID de la cita anterior)

Ejemplo: `/verificar 1`

- [ ] Comando enviado con ID correcto
- [ ] Bot respondió con detalles de la cita
- [ ] Información mostrada es correcta
- [ ] Botones de acción visibles

### 6. Listar Citas

**Comando**: `/mis_citas`

- [ ] Comando enviado
- [ ] Bot respondió con lista de citas
- [ ] La cita creada aparece en la lista
- [ ] ID, doctor y fecha son correctos

### 7. Cancelar Cita (Opcional)

**Comando**: `/cancelar [ID]`

- [ ] Comando enviado
- [ ] Bot respondió con confirmación de cancelación
- [ ] Cita marcada como cancelada

---

## 🎯 Verificación Final

### Resumen de Tests

- [ ] **Docker**: Todos los contenedores corriendo
- [ ] **APIs**: Todas respondiendo correctamente
- [ ] **N8N**: Accesible y workflow activo
- [ ] **Telegram**: Bot respondiendo a todos los comandos
- [ ] **Base de Datos**: Datos persistiendo correctamente

### Comandos Probados

- [ ] `/start` - Menú de bienvenida ✅
- [ ] `/ayuda` - Información de ayuda ✅
- [ ] `/agendar` - Crear cita ✅
- [ ] `/verificar` - Ver detalles de cita ✅
- [ ] `/mis_citas` - Listar citas ✅
- [ ] `/cancelar` - Cancelar cita ✅ (opcional)

### Script de Verificación

```bash
./scripts/verify-setup.sh
```

- [ ] Resultado: 100% operativo
- [ ] Todos los checks en verde

---

## 🎉 ¡Sistema Listo!

Si completaste todos los checks anteriores, tu sistema está 100% funcional.

### 📚 Próximos Pasos

1. **Explorar el Código**:
   - Revisar estructura de microservicios en `services/`
   - Ver implementación de principios SOLID
   - Estudiar patrones de diseño aplicados

2. **Personalizar el Bot**:
   - Modificar mensajes en N8n
   - Agregar nuevos comandos
   - Personalizar respuestas

3. **Experimentar con APIs**:
   - Probar endpoints directamente con cURL
   - Usar Postman o Insomnia
   - Crear nuevos endpoints

4. **Leer Documentación**:
   - `README.md` - Visión general
   - `QUICK_START.md` - Guía rápida
   - `docs/N8N_TELEGRAM_SETUP.md` - Guía detallada de N8n
   - `docs/TELEGRAM_BOT_COMMANDS.md` - Referencia de comandos

---

## 🐛 Si Algo No Funciona

### 1. Verificar Estado
```bash
docker-compose ps
./scripts/verify-setup.sh
```

### 2. Ver Logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f [servicio]
```

### 3. Reiniciar Servicios
```bash
# Reiniciar un servicio
docker-compose restart [servicio]

# Reiniciar todo
docker-compose restart

# Si nada funciona, reiniciar desde cero
docker-compose down
docker-compose up -d
```

### 4. Consultar Documentación
- `docs/N8N_TELEGRAM_SETUP.md` - Sección de Troubleshooting
- `docs/WORKFLOW_FIXES.md` - Problemas del workflow
- `docs/TELEGRAM_BOT_COMMANDS.md` - Errores comunes

---

## 📞 Recursos de Ayuda

- **Documentación Completa**: `docs/`
- **Quick Start**: `QUICK_START.md`
- **Script de Verificación**: `./scripts/verify-setup.sh`
- **Logs**: `docker-compose logs -f`

---

## ✨ Tips Finales

1. **Guarda tus IDs de citas** para pruebas futuras
2. **Mantén los logs abiertos** cuando pruebes nuevas funcionalidades
3. **Usa el script de verificación** regularmente
4. **Lee los mensajes de error** completamente antes de buscar soluciones
5. **Revisa la documentación** antes de hacer cambios

**¡Felicidades! Tu sistema está listo para usar.** 🎊
