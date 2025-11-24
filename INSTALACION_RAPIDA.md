# ⚡ Instalación Rápida - 5 Minutos

## 🎯 Objetivo
Tener el sistema funcionando en menos de 5 minutos.

---

## ✅ Pre-requisitos

Antes de empezar, asegúrate de tener:
- [ ] Docker Desktop instalado y corriendo
- [ ] Una cuenta de Telegram

**Verificar Docker**:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Pasos Rápidos

### 1. Clonar/Descargar el Proyecto

```bash
# Si tienes git
git clone <url-del-repo>
cd appointment-system

# O simplemente navega al directorio del proyecto
cd /ruta/al/proyecto
```

### 2. Configurar Variables

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env (solo necesitas el token de Telegram por ahora)
nano .env
# O usar cualquier editor de texto
```

### 3. Obtener Token de Telegram

1. Abre Telegram
2. Busca `@BotFather`
3. Envía: `/newbot`
4. Sigue las instrucciones
5. **Copia el token** que te da

Ejemplo de token: `6234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`

### 4. Agregar Token al .env

Edita el archivo `.env` y pega tu token:

```env
TELEGRAM_BOT_TOKEN=TU_TOKEN_AQUI
```

Guarda el archivo.

### 5. Iniciar Todo

```bash
# Construir e iniciar todos los servicios
docker-compose up --build -d

# Esperar ~2 minutos mientras se construyen los contenedores
```

### 6. Verificar

```bash
# Opción 1: Script automático (recomendado)
chmod +x scripts/verify-setup.sh
./scripts/verify-setup.sh

# Opción 2: Manual
docker-compose ps
# Todos los servicios deben estar "Up"
```

---

## 🤖 Configurar N8N (2 minutos)

### 1. Abrir N8N

Navega a: http://localhost:5678

**Credenciales**:
- Usuario: `admin`
- Contraseña: `n8n_admin_123`

### 2. Importar Workflow

1. Click en **"+ New workflow"**
2. Click en menú **⋮** (tres puntos)
3. **"Import from file..."**
4. Seleccionar: `n8n/workflows/telegram-bot-complete.json`
5. Click **"Open"**

### 3. Configurar Telegram

1. Click en nodo **"Telegram Trigger"** (el primero)
2. Click **"Create New Credential"**
3. Pegar tu token de Telegram
4. Click **"Create"**
5. Click en nodo **"Send Telegram Message"**
6. Seleccionar las mismas credenciales
7. Click **"Save"** (arriba a la derecha)

### 4. Activar

1. Cambiar switch de **"Inactive"** a **"Active"** (debe verse verde)
2. ¡Listo!

---

## 📱 Probar el Bot

### 1. Abrir Telegram

1. Busca tu bot (el username que creaste con BotFather)
2. Click en tu bot

### 2. Iniciar

Envía: `/start`

Deberías ver un mensaje de bienvenida con botones.

### 3. Probar Comando

```
/agendar Dr. Prueba 2024-12-15 10:00
```

⚠️ **Importante**: Usa una fecha futura

Deberías recibir confirmación con el ID de la cita.

---

## ✅ ¡Listo!

Si llegaste hasta aquí y todo funcionó:
- ✅ Sistema completo funcionando
- ✅ Bot de Telegram activo
- ✅ APIs respondiendo
- ✅ Base de datos operativa

---

## 🆘 Si Algo Falla

### El bot no responde

```bash
# 1. Verificar que N8n esté corriendo
docker ps | grep n8n

# 2. Ver logs de N8n
docker logs n8n -f

# 3. Verificar que el workflow esté activo (switch verde en N8n)
```

### Los servicios no inician

```bash
# 1. Ver qué servicio tiene problema
docker-compose ps

# 2. Ver logs del servicio problemático
docker-compose logs [nombre-servicio]

# 3. Reiniciar todo
docker-compose down
docker-compose up -d
```

### Error al importar workflow

**Solución**: Copia el contenido del archivo JSON y pégalo directamente:
1. En N8n: Menú ⋮ → "Import from URL / JSON"
2. Pegar el contenido completo
3. Click "Import"

---

## 📚 Documentación Completa

Para más detalles, consulta:

- **Setup completo**: `CHECKLIST.md`
- **Guía detallada N8n**: `docs/N8N_TELEGRAM_SETUP.md`
- **Comandos del bot**: `docs/TELEGRAM_BOT_COMMANDS.md`
- **Troubleshooting**: `docs/N8N_TELEGRAM_SETUP.md` (sección de problemas)

---

## 🎯 Siguiente Paso

Una vez que todo funcione, lee:
- `README.md` - Visión general del proyecto
- `QUICK_START.md` - Guía completa de inicio
- `docs/` - Documentación técnica detallada

---

## ⏱️ Resumen de Tiempos

| Paso | Tiempo |
|------|--------|
| Pre-requisitos | 1 min |
| Configuración | 1 min |
| Iniciar servicios | 2 min |
| Configurar N8n | 2 min |
| Probar bot | 1 min |
| **TOTAL** | **~7 min** |

---

**¡Disfruta tu sistema de citas médicas!** 🎉
