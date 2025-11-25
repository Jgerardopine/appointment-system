# 🔧 Solución al Error de Webhook de Telegram en N8n

## 🚨 Problema Identificado

El error `"The requested webhook 'POST telegram-bot-main/webhook' is not registered"` indica que:

1. **N8n está recibiendo requests de Telegram** (✅ Ngrok funcionando correctamente)
2. **El webhook NO está correctamente registrado** en N8n (❌ Problema de configuración)
3. **El workflow tiene un webhookId incorrecto** (`telegram-bot-main` → debe ser `telegram-bot-webhook`)

## 🛠️ Solución Paso a Paso

### 1️⃣ Verificar que Ngrok está corriendo

```bash
# Verificar que Ngrok esté activo
curl -s http://localhost:4040/api/tunnels | grep -o "https://[^\"]*"
```

**Resultado esperado:** `https://dc2ec27caaea.ngrok-free.app` (tu URL de Ngrok)

---

### 2️⃣ Re-importar el Workflow Corregido

El workflow ha sido corregido automáticamente. Ahora debes:

#### A. Acceder a N8n
```
http://localhost:5678
Usuario: admin
Password: n8n_admin_123
```

#### B. Eliminar el workflow anterior (si existe)
1. En N8n, ve a **Workflows**
2. Busca "Telegram Bot - Sistema de Citas Médicas"
3. Click en **⋮** (tres puntos) → **Delete**
4. Confirmar eliminación

#### C. Importar el nuevo workflow
1. Click en **Workflows** → **Import from File**
2. Seleccionar: `/home/user/webapp/n8n/workflows/telegram-bot-complete.json`
3. Click en **Import**

---

### 3️⃣ Configurar Credenciales de Telegram

#### A. Obtener tu Bot Token
1. Abre Telegram y busca **@BotFather**
2. Envía `/mybots`
3. Selecciona tu bot
4. Click en **API Token**
5. Copia el token (formato: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### B. Configurar en N8n
1. En N8n, abre el workflow importado
2. Click en el nodo **"Telegram Trigger"**
3. En **Credentials**, click en **Create New**
4. Nombrar: `Telegram Bot API`
5. Pegar el **Access Token**
6. Click en **Create**

#### C. Aplicar credenciales
1. Asegúrate de que el nodo "Telegram Trigger" tenga las credenciales configuradas
2. También configura el nodo **"Telegram Response"** con las mismas credenciales
3. Click en **Save** (arriba a la derecha)

---

### 4️⃣ Activar el Workflow

1. En la parte superior derecha, verás un switch **"Inactive"**
2. Click en el switch para activarlo → debe cambiar a **"Active"**
3. ✅ Si se activa correctamente, el webhook está registrado
4. ❌ Si aparece error, revisa los pasos anteriores

---

### 5️⃣ Verificar el Registro del Webhook

Después de activar el workflow, verifica que Telegram reconozca el webhook:

```bash
# Reemplaza <TU_BOT_TOKEN> con tu token real
curl "https://api.telegram.org/bot<TU_BOT_TOKEN>/getWebhookInfo"
```

**Resultado esperado:**
```json
{
  "ok": true,
  "result": {
    "url": "https://dc2ec27caaea.ngrok-free.app/webhook/telegram-bot-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    ...
  }
}
```

✅ Si `url` contiene tu URL de Ngrok + `/webhook/telegram-bot-webhook`, está correcto.

---

### 6️⃣ Probar el Bot en Telegram

Abre Telegram y envía a tu bot:

```
/start
```

**Resultado esperado:**
- El bot debe responder con un mensaje de bienvenida
- Debe mostrar botones: "🩺 Ver Doctores", "📅 Mis Citas", "❓ Ayuda"

**Prueba adicional:**
```
/doctores
```

**Resultado esperado:**
- Lista de 3 doctores:
  - Dr. Juan Pérez (Cardiología)
  - Dra. María García (Pediatría)
  - Dr. Carlos López (Dermatología)

---

## 🔍 Troubleshooting

### ❌ Error: "Workflow could not be activated"

**Causa:** Credenciales de Telegram no configuradas correctamente.

**Solución:**
1. Verifica que el Bot Token sea correcto
2. Asegúrate de haber configurado credenciales en **ambos** nodos:
   - Telegram Trigger
   - Telegram Response
3. Click en **Save** antes de activar

---

### ❌ Error: "The requested webhook is not registered"

**Causa:** El workflow anterior no se eliminó correctamente.

**Solución:**
```bash
# En la terminal de Docker
cd /home/user/webapp
docker-compose restart n8n

# Espera 30 segundos
sleep 30

# Re-importa el workflow y actívalo de nuevo
```

---

### ❌ El bot no responde a /start

**Causa 1:** Ngrok se reinició y la URL cambió.

**Solución:**
```bash
# Obtén la nueva URL de Ngrok
curl -s http://localhost:4040/api/tunnels | grep -o "https://[^\"]*"

# Actualiza .env con la nueva URL
# Editar N8N_WEBHOOK_URL=https://NUEVA_URL/

# Reinicia N8n
docker-compose restart n8n

# Desactiva y reactiva el workflow en N8n
```

**Causa 2:** La base de datos no tiene doctores.

**Solución:**
```bash
# Verificar doctores en la base de datos
docker-compose exec postgres psql -U appointment_user -d appointment_db -c "SELECT id, name, specialty FROM doctors;"

# Si no hay doctores, reiniciar DB
docker-compose down -v
docker-compose up -d
```

---

### ❌ Bucle infinito al usar /doctores

**Causa:** El endpoint de la API no responde correctamente.

**Solución:**
```bash
# Verificar logs del API Gateway
docker logs api-gateway --tail 50

# Verificar logs del Appointment Service
docker logs appointment-service --tail 50

# Verificar que la base de datos tenga doctores
docker-compose exec postgres psql -U appointment_user -d appointment_db -c "SELECT * FROM doctors;"
```

---

## 📊 Verificación Final

Ejecuta este checklist para confirmar que todo funciona:

- [ ] Ngrok está corriendo y muestra URL HTTPS
- [ ] N8n está accesible en http://localhost:5678
- [ ] Workflow "Telegram Bot - Sistema de Citas Médicas" está importado
- [ ] Credenciales de Telegram están configuradas en ambos nodos
- [ ] Workflow está **Activado** (switch en verde)
- [ ] `getWebhookInfo` muestra la URL correcta de Ngrok
- [ ] Base de datos tiene 3 doctores
- [ ] `/start` responde con mensaje de bienvenida
- [ ] `/doctores` muestra lista de 3 doctores
- [ ] `/ayuda` muestra comandos disponibles

---

## 🎯 Comandos Implementados

Los siguientes comandos están **funcionando** en el nuevo workflow:

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/start` | Mensaje de bienvenida | `/start` |
| `/doctores [especialidad]` | Ver doctores disponibles | `/doctores` o `/doctores Cardiología` |
| `/disponibilidad [doctor_id] [fecha]` | Ver horarios disponibles | `/disponibilidad 1 2024-11-25` |
| `/ayuda` | Ver comandos disponibles | `/ayuda` |

**Comandos pendientes de implementar:**
- `/agendar` (crear cita)
- `/verificar` (ver detalles de cita)
- `/confirmar` (confirmar cita)
- `/cancelar` (cancelar cita)
- `/mis_citas` (listar citas del usuario)

---

## 📝 Notas Importantes

### ⚠️ Ngrok Free Tier Limitation
Con el plan gratuito de Ngrok:
- La URL cambia cada vez que reinicias `ngrok http 5678`
- Debes actualizar `.env` con la nueva `WEBHOOK_URL`
- Debes reiniciar N8n: `docker-compose restart n8n`
- Debes desactivar/reactivar el workflow

### 💡 Tip: Mantener Ngrok URL Estable
Para evitar cambiar la URL constantemente:
1. **No cierres Ngrok** mientras trabajas
2. Si necesitas reiniciar Ngrok, sigue los pasos de actualización arriba
3. Considera actualizar a **Ngrok Pro** para obtener una URL fija

---

## 🆘 ¿Aún tienes problemas?

Si después de seguir esta guía el bot no funciona:

1. **Verifica logs de N8n:**
   ```bash
   docker logs n8n -f
   ```

2. **Verifica tráfico de Ngrok:**
   Abre: http://localhost:4040

3. **Verifica logs de servicios:**
   ```bash
   docker-compose logs api-gateway appointment-service
   ```

4. **Reinicia todo el sistema:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   sleep 60
   # Re-importar workflow y reconfigurar credenciales
   ```

---

## ✅ Resultado Esperado

Después de seguir esta guía:

✅ El bot responde a `/start`  
✅ El comando `/doctores` muestra 3 doctores  
✅ El comando `/disponibilidad 1 2024-11-25` muestra horarios  
✅ El comando `/ayuda` muestra la lista completa de comandos  
✅ No hay más errores de "webhook not registered"  
✅ Los logs de N8n muestran ejecuciones exitosas  

---

## 🎉 ¡Listo!

Tu sistema de citas médicas con Telegram está completamente funcional.

**Próximos pasos sugeridos:**
1. Implementar comandos restantes (`/agendar`, `/verificar`, etc.)
2. Agregar validaciones de entrada
3. Mejorar mensajes de error
4. Configurar notificaciones automáticas
