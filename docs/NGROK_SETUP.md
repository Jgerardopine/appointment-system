# 🌐 Configuración de Ngrok para N8n Local

## 🎯 ¿Por Qué Ngrok?

Telegram requiere una URL HTTPS pública para webhooks. Como N8n corre en `localhost`, necesitamos exponer el puerto 5678 a internet de forma segura. **Ngrok** es la solución más simple.

---

## ⚡ Setup Rápido (5 minutos)

### 1️⃣ **Instalar Ngrok**

#### Windows
```bash
# Opción 1: Descargar ejecutable
# Ir a: https://ngrok.com/download
# Descargar y descomprimir ngrok.exe

# Opción 2: Con Chocolatey
choco install ngrok
```

#### macOS
```bash
brew install ngrok
```

#### Linux
```bash
# Ubuntu/Debian
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Arch Linux
yay -S ngrok

# Snap (todas las distros)
snap install ngrok
```

**Verificar instalación**:
```bash
ngrok version
```

---

### 2️⃣ **Crear Cuenta en Ngrok (Gratis)**

1. Ve a: https://ngrok.com/signup
2. Regístrate con email o GitHub
3. Confirma tu email

**Plan Gratuito incluye**:
- ✅ 1 sesión en línea simultánea
- ✅ 40 conexiones/minuto
- ✅ Dominios aleatorios HTTPS
- ✅ Suficiente para desarrollo

---

### 3️⃣ **Obtener Authtoken**

1. Inicia sesión en: https://dashboard.ngrok.com/
2. Ve a: **"Your Authtoken"** o https://dashboard.ngrok.com/get-started/your-authtoken
3. Copia el token (algo como: `2abc123def456ghi789jkl`)

---

### 4️⃣ **Configurar Authtoken**

```bash
# Ejecutar una sola vez
ngrok config add-authtoken TU_TOKEN_AQUI
```

Ejemplo:
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl
```

**Respuesta esperada**:
```
Authtoken saved to configuration file: /home/user/.ngrok2/ngrok.yml
```

---

### 5️⃣ **Iniciar Túnel a N8n**

```bash
# Exponer puerto 5678 (N8n) con HTTPS
ngrok http 5678
```

**Salida esperada**:
```
ngrok                                                                 

Session Status                online
Account                       tu_email@ejemplo.com (Plan: Free)
Version                       3.5.0
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:5678

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**📋 IMPORTANTE**: 
- Copia la URL **HTTPS** (ejemplo: `https://abc123def456.ngrok.io`)
- **NO cierres esta terminal**, debe quedarse abierta
- Cada vez que reinicies ngrok, la URL cambiará (en plan gratuito)

---

### 6️⃣ **Configurar N8n con la URL de Ngrok**

#### Opción A: Usando Variables de Entorno (Recomendado)

1. **Editar archivo `.env`**:
```bash
nano .env
# O usar cualquier editor
```

2. **Agregar/actualizar estas líneas**:
```env
# Cambiar de http a https
N8N_PROTOCOL=https

# Usar la URL de ngrok (INCLUIR la barra / al final)
WEBHOOK_URL=https://abc123def456.ngrok.io/
```

3. **Guardar el archivo**

4. **Reiniciar N8n**:
```bash
docker-compose restart n8n
```

#### Opción B: Directamente en N8n UI

1. Ve a N8n: http://localhost:5678
2. Abre tu workflow
3. En el nodo **"Telegram Trigger"**:
   - No necesitas cambiar nada, N8n usará automáticamente `WEBHOOK_URL`

---

### 7️⃣ **Activar el Workflow**

1. En N8n UI: http://localhost:5678
2. Abre tu workflow "Telegram Bot - Sistema de Citas"
3. Click en **"Save"**
4. Cambia el switch a **"Active"** (verde)

**Ahora SÍ debería activarse sin errores** ✅

---

### 8️⃣ **Probar el Bot**

1. Abre Telegram
2. Busca tu bot
3. Envía: `/start`

**Deberías recibir el mensaje de bienvenida** 🎉

---

## 🔍 Verificar Configuración

### Ver Logs de N8n
```bash
docker logs n8n -f
```

Busca líneas como:
```
Webhook waiting for requests at: https://abc123def456.ngrok.io/webhook/...
```

### Ver Tráfico de Ngrok
Abre en navegador: http://localhost:4040

Aquí verás:
- Todas las requests que llegan
- Respuestas
- Tiempos
- Headers
- Body de mensajes

**Muy útil para debugging** 🐛

---

## 🔄 Cada Vez Que Inicies Tu Sistema

### Orden de Inicio:

```bash
# 1. Iniciar Docker Compose
docker-compose up -d

# 2. Iniciar Ngrok (en otra terminal)
ngrok http 5678

# 3. Si la URL de ngrok cambió, actualizar .env
nano .env
# Cambiar WEBHOOK_URL=https://NUEVA_URL.ngrok.io/

# 4. Reiniciar N8n
docker-compose restart n8n

# 5. Verificar en N8n UI que el workflow esté activo
```

---

## 💡 Tips y Trucos

### Mantener la Misma URL (Plan Pago)

Con el plan pago de ngrok ($8/mes):
```bash
# Reservar un dominio fijo
ngrok http 5678 --domain=tu-dominio.ngrok.io
```

Así nunca cambias la URL.

### Usar Archivo de Configuración

Crear archivo `ngrok.yml`:
```yaml
version: "2"
authtoken: TU_TOKEN_AQUI
tunnels:
  n8n:
    proto: http
    addr: 5678
    bind_tls: true
```

Iniciar:
```bash
ngrok start n8n
```

### Alias para Fácil Inicio

En `~/.bashrc` o `~/.zshrc`:
```bash
alias ngrok-n8n='ngrok http 5678'
```

Luego solo ejecuta:
```bash
ngrok-n8n
```

---

## 🐛 Troubleshooting

### Error: "ERR_NGROK_108"
**Causa**: El authtoken no está configurado o es inválido

**Solución**:
```bash
ngrok config add-authtoken TU_TOKEN_CORRECTO
```

### Error: "Tunnel not found"
**Causa**: Ya tienes otro túnel corriendo

**Solución**:
```bash
# Ver procesos de ngrok
ps aux | grep ngrok

# Matar procesos antiguos
killall ngrok

# Reintentar
ngrok http 5678
```

### Error: "Webhook validation failed"
**Causa**: N8n no está recibiendo las requests

**Verificar**:
1. Ngrok está corriendo (no cerraste la terminal)
2. La URL en `.env` es correcta (con `https://` y `/` al final)
3. N8n fue reiniciado después de cambiar `.env`
4. El workflow está activo (switch verde)

**Solución**:
```bash
# Ver logs de ngrok
# Ir a http://localhost:4040

# Ver logs de N8n
docker logs n8n -f
```

### Bot no responde
**Pasos de diagnóstico**:

1. **Verificar ngrok**:
```bash
# Ver la URL actual
curl http://localhost:4040/api/tunnels | jq
```

2. **Probar webhook manualmente**:
```bash
curl https://TU_URL.ngrok.io/webhook-test/telegram-bot-main
```

3. **Ver ejecuciones en N8n**:
   - Ve a "Executions" en el menú lateral
   - Busca errores

4. **Reiniciar todo**:
```bash
docker-compose restart n8n
# Reiniciar ngrok también
```

---

## 🚀 Alternativas a Ngrok

Si ngrok no funciona o prefieres otras opciones:

### LocalTunnel (Gratis)
```bash
npm install -g localtunnel
lt --port 5678 --subdomain mi-n8n
```

### Cloudflare Tunnel (Gratis)
```bash
cloudflared tunnel --url http://localhost:5678
```

### Serveo (Gratis, no requiere registro)
```bash
ssh -R 80:localhost:5678 serveo.net
```

### Pagekite (De pago)
```bash
pagekite.py 5678 minombre.pagekite.me
```

---

## 📊 Comparación

| Herramienta | Gratis | Registro | URL Fija | Límites |
|-------------|--------|----------|----------|---------|
| **Ngrok** | ✅ | ✅ | ❌ (💰 pago) | 40 req/min |
| LocalTunnel | ✅ | ❌ | ✅ (con --subdomain) | Sin límites |
| Cloudflare | ✅ | ✅ | ✅ | Sin límites |
| Serveo | ✅ | ❌ | ❌ | Puede caerse |

**Recomendación**: Ngrok para desarrollo, Cloudflare Tunnel para producción.

---

## 🔐 Seguridad

### Nunca Compartas:
- ❌ Tu authtoken de ngrok
- ❌ Tu URL pública en redes sociales
- ❌ Credenciales de N8n

### Mejores Prácticas:
- ✅ Usa autenticación básica en N8n (ya configurada)
- ✅ Cierra ngrok cuando no lo uses
- ✅ No uses la URL de ngrok en producción
- ✅ Regenera el authtoken si se filtra

---

## 📚 Recursos

- **Documentación Ngrok**: https://ngrok.com/docs
- **Dashboard Ngrok**: https://dashboard.ngrok.com/
- **N8n Webhooks**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- **Telegram Bot API**: https://core.telegram.org/bots/api

---

## ✅ Checklist Rápido

- [ ] Ngrok instalado
- [ ] Cuenta de ngrok creada
- [ ] Authtoken configurado
- [ ] Ngrok corriendo (`ngrok http 5678`)
- [ ] URL HTTPS copiada
- [ ] `.env` actualizado con `WEBHOOK_URL`
- [ ] N8n reiniciado
- [ ] Workflow activado (switch verde)
- [ ] Bot responde en Telegram

---

**¡Listo para usar tu bot de Telegram!** 🎉
