# 📦 Guía de Instalación Completa

## 🛠️ Herramientas Requeridas

### Lista de Software Necesario

1. **Docker Desktop** (Obligatorio)
   - MacOS: Versión 4.20+ 
   - Windows: Versión 4.20+ con WSL2

2. **Visual Studio Code** (Recomendado)
   - Extensiones recomendadas:
     - Docker
     - Python
     - Remote - WSL (solo Windows)
     - REST Client
     - PostgreSQL

3. **Git** (Obligatorio)
   - Para clonar el repositorio

4. **Node.js 18+** (Opcional - para desarrollo)
   - Solo si quieres ejecutar servicios fuera de Docker

5. **Postman o Insomnia** (Recomendado)
   - Para probar APIs

6. **Telegram Desktop** (Recomendado)
   - Para probar el bot

---

## 🍎 Instalación en MacOS

### Paso 1: Instalar Docker Desktop

1. **Descargar Docker Desktop**
   ```bash
   # Opción A: Descargar desde el sitio web
   # https://www.docker.com/products/docker-desktop/
   
   # Opción B: Usando Homebrew
   brew install --cask docker
   ```

2. **Verificar Instalación**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Configurar Docker Desktop**
   - Abrir Docker Desktop
   - Ir a Preferences → Resources
   - Asignar mínimo: 4GB RAM, 2 CPUs, 20GB disco
   - Click en "Apply & Restart"

### Paso 2: Instalar Git y VS Code

```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Git
brew install git

# Instalar Visual Studio Code
brew install --cask visual-studio-code

# Verificar instalaciones
git --version
code --version
```

### Paso 3: Clonar y Configurar el Proyecto

```bash
# Crear directorio de trabajo
mkdir ~/proyectos-docker
cd ~/proyectos-docker

# Clonar el repositorio
git clone https://github.com/tu-usuario/appointment-system.git
cd appointment-system

# Abrir en VS Code
code .
```

---

## 🪟 Instalación en Windows

### Prerrequisito: Habilitar WSL2

1. **Abrir PowerShell como Administrador**
   ```powershell
   # Habilitar WSL
   wsl --install
   
   # Reiniciar el equipo
   ```

2. **Después del reinicio, configurar WSL2**
   ```powershell
   # Establecer WSL2 como versión por defecto
   wsl --set-default-version 2
   
   # Instalar Ubuntu
   wsl --install -d Ubuntu-22.04
   ```

3. **Configurar Ubuntu**
   - Se abrirá una terminal de Ubuntu
   - Crear usuario y contraseña
   - Actualizar paquetes:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Paso 1: Instalar Docker Desktop para Windows

1. **Requisitos del Sistema**
   - Windows 10 64-bit: Pro, Enterprise, o Education (Build 19041+)
   - Windows 11 64-bit
   - Habilitar virtualización en BIOS
   - WSL2 instalado

2. **Descargar e Instalar**
   - Descargar desde: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
   - Ejecutar el instalador
   - Marcar "Use WSL 2 instead of Hyper-V"
   - Reiniciar cuando se solicite

3. **Configuración Post-Instalación**
   ```powershell
   # En PowerShell, verificar instalación
   docker --version
   docker-compose --version
   
   # Verificar integración con WSL2
   wsl -l -v
   ```

4. **Configurar Docker Desktop**
   - Abrir Docker Desktop
   - Settings → General → Asegurar "Use the WSL 2 based engine" está marcado
   - Settings → Resources → WSL Integration → Habilitar Ubuntu-22.04
   - Settings → Resources → Advanced → Asignar 4GB RAM, 2 CPUs mínimo
   - Apply & Restart

### Paso 2: Instalar Visual Studio Code con WSL

1. **Instalar VS Code**
   - Descargar desde: https://code.visualstudio.com/Download
   - Instalar con opciones por defecto

2. **Instalar Extensión Remote-WSL**
   - Abrir VS Code
   - Ir a Extensions (Ctrl+Shift+X)
   - Buscar "Remote - WSL"
   - Instalar

3. **Instalar Git en WSL**
   ```bash
   # Abrir terminal Ubuntu (desde menú inicio)
   sudo apt install git -y
   
   # Configurar Git
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu@email.com"
   ```

### Paso 3: Configurar el Proyecto en WSL

```bash
# En terminal Ubuntu/WSL
# Crear directorio de trabajo
mkdir ~/proyectos-docker
cd ~/proyectos-docker

# Clonar el repositorio
git clone https://github.com/tu-usuario/appointment-system.git
cd appointment-system

# Abrir en VS Code con WSL
code .
```

---

## 🔧 Configuración Común (MacOS y Windows)

### 1. Crear Token de Bot de Telegram

1. Abrir Telegram
2. Buscar @BotFather
3. Enviar `/newbot`
4. Elegir nombre: `CitasMedicasBot` (o el que prefieras)
5. Elegir username: `citas_medicas_123_bot` (debe ser único)
6. Copiar el token que te proporciona

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env
# MacOS
nano .env

# Windows (en WSL)
nano .env
# O abrir con VS Code y editar
```

Contenido del `.env`:
```env
# Telegram
TELEGRAM_BOT_TOKEN=tu_token_aqui
TELEGRAM_WEBHOOK_URL=http://n8n:5678/webhook/telegram

# PostgreSQL
POSTGRES_USER=appointment_user
POSTGRES_PASSWORD=SecurePass123!
POSTGRES_DB=appointment_db
DATABASE_URL=postgresql://appointment_user:SecurePass123!@postgres:5432/appointment_db

# Services URLs
APPOINTMENT_SERVICE_URL=http://appointment-service:3001
PATIENT_SERVICE_URL=http://patient-service:3002
NOTIFICATION_SERVICE_URL=http://notification-service:3003
API_GATEWAY_URL=http://api-gateway:3000

# N8N
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=n8n_admin_123
N8N_HOST=0.0.0.0
N8N_PORT=5678

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 3. Iniciar los Servicios

```bash
# Construir las imágenes
docker-compose build

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 4. Verificar la Instalación

1. **PostgreSQL**: 
   ```bash
   docker exec -it postgres psql -U appointment_user -d appointment_db
   \dt  # Ver tablas
   \q   # Salir
   ```

2. **API Gateway**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **N8N**:
   - Abrir navegador: http://localhost:5678
   - Login: admin / n8n_admin_123

4. **Servicios**:
   ```bash
   # Appointment Service
   curl http://localhost:3001/health
   
   # Patient Service
   curl http://localhost:3002/health
   
   # Notification Service
   curl http://localhost:3003/health
   ```

---

## ❗ Solución de Problemas Comunes

### Windows - WSL2

**Error: "Docker Desktop - WSL integration is not enabled"**
```powershell
# En PowerShell como Admin
wsl --update
# Reiniciar Docker Desktop
```

**Error: "Cannot connect to the Docker daemon"**
```bash
# En WSL
sudo service docker start
# O reiniciar Docker Desktop
```

### MacOS

**Error: "Cannot connect to Docker daemon"**
```bash
# Verificar que Docker Desktop esté corriendo
open -a Docker
# Esperar que el icono de Docker aparezca en la barra de menú
```

### Ambos Sistemas

**Error: "Port already in use"**
```bash
# Ver qué está usando el puerto
# MacOS
lsof -i :3000

# Windows (PowerShell)
netstat -ano | findstr :3000

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

**Error: "PostgreSQL connection refused"**
```bash
# Esperar que PostgreSQL esté listo
docker-compose logs postgres
# Buscar: "database system is ready to accept connections"
```

---

## ✅ Checklist de Verificación

- [ ] Docker Desktop instalado y corriendo
- [ ] Docker Compose disponible
- [ ] Git instalado
- [ ] VS Code instalado con extensiones
- [ ] Proyecto clonado
- [ ] Archivo .env configurado
- [ ] Token de Telegram obtenido
- [ ] Servicios iniciados con docker-compose
- [ ] PostgreSQL accesible
- [ ] N8N accesible en http://localhost:5678
- [ ] APIs respondiendo en health checks
- [ ] Bot de Telegram funcionando

## 🎉 ¡Instalación Completa!

Si todos los checks están marcados, ¡felicitaciones! Tu sistema está listo para usar.

Siguiente paso: [Configurar N8N y Telegram](./N8N_SETUP.md)
