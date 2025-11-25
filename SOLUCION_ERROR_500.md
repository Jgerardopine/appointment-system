# 🔧 Solución: Error 500 del Backend

## 🔍 Problema Detectado

N8n está recibiendo error 500 al llamar al endpoint `/api/appointments/doctors`:

```
AxiosError: Request failed with status code 500
message: "{\"detail\":\"Internal server error\"}"
```

## 🐛 Posibles Causas

### 1. **Servicios No Están Corriendo**
El appointment-service puede no estar activo o no responder.

### 2. **Base de Datos Vacía o Sin Inicializar**
La tabla `doctors` no existe o no tiene los 3 doctores de ejemplo.

### 3. **Error de Conexión a Base de Datos**
El servicio no puede conectarse a PostgreSQL.

### 4. **Variables de Entorno Incorrectas**
DATABASE_URL u otras variables no están configuradas.

---

## ✅ Soluciones (Ejecutar en Orden)

### Solución 1: Verificar Estado de Servicios

```bash
# Ver servicios corriendo
docker-compose ps

# Resultado esperado:
# - postgres (healthy)
# - api-gateway (up)
# - appointment-service (up)
# - patient-service (up)
# - notification-service (up)
# - n8n (up)
```

**Si algún servicio está down:**
```bash
docker-compose restart appointment-service
docker-compose restart api-gateway
```

---

### Solución 2: Verificar Logs del Appointment Service

```bash
# Ver últimos errores
docker logs appointment-service --tail 50

# Ver logs en tiempo real
docker logs appointment-service -f
```

**Errores comunes y soluciones:**

#### Error: "could not connect to database"
```bash
# Reiniciar PostgreSQL
docker-compose restart postgres
sleep 10
docker-compose restart appointment-service
```

#### Error: "relation 'doctors' does not exist"
```bash
# Reinicializar base de datos
docker-compose down -v
docker-compose up -d
sleep 60
```

---

### Solución 3: Verificar Base de Datos

```bash
# Conectarse a PostgreSQL
docker-compose exec postgres psql -U appointment_user -d appointment_db

# Dentro de psql, ejecutar:
```

```sql
-- Ver si existe la tabla doctors
\dt

-- Ver cuántos doctores hay
SELECT COUNT(*) FROM doctors;

-- Ver los doctores
SELECT id, name, specialty FROM doctors;

-- Resultado esperado: 3 doctores
--  id |     name      |  specialty
-- ----+---------------+-------------
--   1 | Dr. Juan Pérez | Cardiología
--   2 | Dra. María García | Pediatría
--   3 | Dr. Carlos López | Dermatología
```

**Si la tabla no existe o está vacía:**
```bash
# Salir de psql con: \q

# Reinicializar base de datos completamente
docker-compose down -v
docker-compose up -d

# Esperar a que PostgreSQL inicie completamente
sleep 60

# Verificar que el script de inicialización se ejecutó
docker logs postgres | grep "Database initialization completed"
```

---

### Solución 4: Probar Endpoint Directamente

```bash
# Desde tu máquina, probar:
curl http://localhost:3001/health
# Debe responder: {"status":"ok"}

# Probar endpoint de doctores directamente
curl http://localhost:3001/doctors
# Debe devolver lista de doctores

# Probar a través del API Gateway
curl http://localhost:4000/api/appointments/doctors
# Debe devolver la misma lista
```

---

### Solución 5: Verificar Variables de Entorno

```bash
# Ver variables de entorno del appointment-service
docker exec appointment-service env | grep DATABASE_URL

# Resultado esperado:
# DATABASE_URL=postgresql://appointment_user:SecurePass123!@postgres:5432/appointment_db
```

**Si DATABASE_URL es incorrecta:**

Editar `.env`:
```bash
DATABASE_URL=postgresql://appointment_user:SecurePass123!@postgres:5432/appointment_db
```

Luego:
```bash
docker-compose down
docker-compose up -d
```

---

### Solución 6: Reinicio Completo del Sistema

Si nada funciona, reinicio completo:

```bash
# 1. Detener todo y borrar volúmenes
docker-compose down -v

# 2. Verificar que .env existe y está correcto
cat .env | grep -E "POSTGRES|DATABASE"

# Debe contener:
# POSTGRES_USER=appointment_user
# POSTGRES_PASSWORD=SecurePass123!
# POSTGRES_DB=appointment_db
# DATABASE_URL=postgresql://appointment_user:SecurePass123!@postgres:5432/appointment_db

# 3. Iniciar servicios
docker-compose up -d

# 4. Esperar a que PostgreSQL esté listo
sleep 60

# 5. Verificar logs de PostgreSQL
docker logs postgres | tail -20

# Debe incluir:
# "Database initialization completed successfully!"

# 6. Verificar doctores en BD
docker-compose exec postgres psql -U appointment_user -d appointment_db -c "SELECT COUNT(*) FROM doctors;"

# Debe mostrar: 3

# 7. Probar endpoint
curl http://localhost:3001/doctors
```

---

## 🔧 Solución para Error de X-Forwarded-For

El error persiste porque las variables NO se aplicaron. Docker Compose necesita un rebuild:

```bash
# Opción 1: Rebuild solo N8n
docker-compose up -d --force-recreate n8n

# Opción 2: Rebuild completo
docker-compose down
docker-compose up -d --build
```

**Verificar que las variables se aplicaron:**
```bash
docker exec n8n env | grep -E "N8N_ENFORCE|DB_SQLITE|N8N_RUNNERS|N8N_BLOCK|N8N_GIT"

# Debe mostrar:
# N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
# DB_SQLITE_POOL_SIZE=10
# N8N_RUNNERS_ENABLED=false
# N8N_BLOCK_ENV_ACCESS_IN_NODE=false
# N8N_GIT_NODE_DISABLE_BARE_REPOS=true
```

---

## 📋 Script de Diagnóstico Automático

Ejecuta este script para diagnosticar el problema:

```bash
chmod +x scripts/diagnose-system.sh
./scripts/diagnose-system.sh
```

El script verificará:
- ✅ Estado de contenedores Docker
- ✅ Salud de servicios (health endpoints)
- ✅ Conectividad a base de datos
- ✅ Cantidad de doctores en BD
- ✅ Respuesta del endpoint /doctors
- ✅ Variables de entorno de N8n
- ✅ Logs recientes de cada servicio

---

## 🎯 Checklist de Verificación

Después de aplicar las soluciones:

- [ ] `docker-compose ps` muestra todos los servicios **up**
- [ ] `curl http://localhost:3001/health` responde `{"status":"ok"}`
- [ ] `curl http://localhost:3001/doctors` devuelve lista de 3 doctores
- [ ] `curl http://localhost:4000/api/appointments/doctors` devuelve la misma lista
- [ ] `docker logs appointment-service` no muestra errores
- [ ] `docker logs n8n` no muestra error de X-Forwarded-For
- [ ] Base de datos tiene 3 doctores: `SELECT COUNT(*) FROM doctors;`
- [ ] N8n puede ejecutar el workflow sin error 500

---

## 🚨 Errores Específicos y Soluciones

### Error: "relation 'doctors' does not exist"
**Solución:**
```bash
docker-compose down -v
docker-compose up -d
sleep 60
docker-compose exec postgres psql -U appointment_user -d appointment_db -c "SELECT * FROM doctors;"
```

### Error: "FATAL: database 'appointment_user' does not exist"
**Problema:** Variable POSTGRES_DB está mal configurada.

**Solución:**
```bash
# Editar .env
nano .env

# Asegurarse de que diga:
POSTGRES_DB=appointment_db  # NO appointment_user

# Reiniciar
docker-compose down -v
docker-compose up -d
```

### Error: "password authentication failed"
**Solución:**
```bash
# Verificar .env
cat .env | grep POSTGRES

# Debe tener:
# POSTGRES_PASSWORD=SecurePass123!
# DATABASE_URL=postgresql://appointment_user:SecurePass123!@postgres:5432/appointment_db

# Reiniciar
docker-compose down -v
docker-compose up -d
```

### Error: "Connection refused" o "No route to host"
**Problema:** Servicios no están en la misma red Docker.

**Solución:**
```bash
# Verificar red
docker network inspect appointment-network

# Recrear servicios
docker-compose down
docker-compose up -d
```

---

## 📊 Flujo de Depuración Recomendado

```
1. Verificar servicios corriendo
   ↓
2. Revisar logs del appointment-service
   ↓
3. Verificar base de datos y tabla doctors
   ↓
4. Probar endpoint directamente (curl)
   ↓
5. Probar a través del API Gateway
   ↓
6. Probar desde N8n
   ↓
7. Probar desde Telegram
```

---

## ✅ Resultado Esperado

Después de aplicar las soluciones:

```bash
# Este comando:
curl http://localhost:3001/doctors

# Debe devolver:
{
  "doctors": [
    {
      "id": 1,
      "name": "Dr. Juan Pérez",
      "email": "juan.perez@hospital.com",
      "phone": "+1234567890",
      "specialty": "Cardiología",
      "license_number": "MED-12345",
      "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "available_hours": {"start": "09:00:00", "end": "17:00:00"},
      "created_at": "2024-11-25T..."
    },
    {
      "id": 2,
      "name": "Dra. María García",
      ...
    },
    {
      "id": 3,
      "name": "Dr. Carlos López",
      ...
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 20,
  "has_next": false,
  "has_previous": false
}
```

Y en N8n, el nodo "List Doctores API" debe ejecutarse exitosamente sin error 500.

---

## 🆘 Si Nada Funciona

Como último recurso:

```bash
# 1. Backup de workflows (si es necesario)
cp -r n8n/workflows n8n/workflows.backup

# 2. Limpieza completa
docker-compose down -v
docker system prune -f

# 3. Verificar .env
cat .env

# 4. Iniciar de cero
docker-compose up -d

# 5. Esperar 2 minutos
sleep 120

# 6. Verificar todo
./scripts/diagnose-system.sh
```

---

**Documentación relacionada:**
- `SOLUCION_WEBHOOK_ERROR.md` - Errores de webhook
- `SOLUCION_COMMAND_ROUTER.md` - Problemas de enrutamiento
- `scripts/diagnose-system.sh` - Script de diagnóstico

**Estado:** Pendiente de prueba  
**Prioridad:** Alta ⚠️
