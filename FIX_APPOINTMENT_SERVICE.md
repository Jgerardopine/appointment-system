# 🔧 Fix Urgente: Appointment Service Unhealthy

## 🔍 Diagnóstico del Script

```
appointment-service    Up 7 minutes (unhealthy)   ❌
```

El servicio está corriendo pero **UNHEALTHY**, lo que significa:
- ✅ Base de datos tiene 3 doctores
- ✅ Otros servicios están healthy
- ❌ Appointment service está fallando en el healthcheck
- ❌ Endpoint `/doctors` devuelve error 500

## 🚨 Solución Inmediata

### Paso 1: Ver Logs Completos del Appointment Service

```bash
docker logs appointment-service --tail 100
```

**Busca estos errores comunes:**
1. `could not connect to database`
2. `relation "doctors" does not exist`
3. `asyncpg` connection errors
4. Python import errors
5. Port binding errors

---

### Paso 2: Reiniciar Appointment Service

```bash
docker-compose restart appointment-service

# Esperar 10 segundos
sleep 10

# Verificar que esté healthy
docker-compose ps | grep appointment-service
```

**Resultado esperado:** `(healthy)` en lugar de `(unhealthy)`

---

### Paso 3: Probar Endpoint Directamente

```bash
# Probar health
curl http://localhost:3001/health

# Probar doctors
curl http://localhost:3001/doctors
```

---

### Paso 4: Si Sigue Fallando - Ver Logs en Tiempo Real

```bash
# Terminal 1: Ver logs
docker logs appointment-service -f

# Terminal 2: Hacer request
curl http://localhost:3001/doctors
```

**Copia el error exacto que aparezca en los logs.**

---

## 🔧 Soluciones Según el Error

### Error 1: "could not connect to server: Connection refused"

**Causa:** Appointment service no puede conectarse a PostgreSQL.

**Solución:**
```bash
# Verificar que PostgreSQL esté healthy
docker-compose ps | grep postgres

# Reiniciar PostgreSQL primero
docker-compose restart postgres
sleep 10

# Luego appointment service
docker-compose restart appointment-service
sleep 10

# Probar
curl http://localhost:3001/doctors
```

---

### Error 2: "asyncpg.exceptions.InvalidPasswordError"

**Causa:** Contraseña de base de datos incorrecta.

**Solución:**
```bash
# Verificar DATABASE_URL en appointment service
docker exec appointment-service env | grep DATABASE_URL

# Debe ser:
# DATABASE_URL=postgresql://appointment_user:SecurePass123!@postgres:5432/appointment_db

# Si es incorrecta, editar .env y reiniciar
nano .env
docker-compose restart appointment-service
```

---

### Error 3: "relation 'doctors' does not exist"

**Causa:** Tabla no existe (aunque el script dice que sí).

**Solución:**
```bash
# Verificar tabla en la base de datos correcta
docker exec -it postgres psql -U appointment_user -d appointment_db

# Dentro de psql:
\dt
SELECT * FROM doctors;
\q

# Si la tabla no existe:
docker-compose down -v
docker-compose up -d
sleep 60
```

---

### Error 4: "ImportError" o "ModuleNotFoundError"

**Causa:** Dependencias Python no instaladas.

**Solución:**
```bash
# Rebuild del servicio
docker-compose up -d --build appointment-service

# Esperar
sleep 30

# Probar
curl http://localhost:3001/doctors
```

---

### Error 5: "AttributeError" o "NoneType"

**Causa:** Código Python tiene un bug en el endpoint.

**Solución:** Necesitamos ver el error exacto en los logs. Ejecuta:

```bash
docker logs appointment-service --tail 50 2>&1 | grep -A 10 "Error"
```

---

## 📋 Comando Rápido de Diagnóstico

Ejecuta esto y copia TODO el output:

```bash
echo "=== APPOINTMENT SERVICE STATUS ==="
docker-compose ps | grep appointment

echo -e "\n=== LAST 50 LOGS ==="
docker logs appointment-service --tail 50

echo -e "\n=== DATABASE CONNECTION ==="
docker exec appointment-service env | grep DATABASE_URL

echo -e "\n=== PYTHON PROCESS ==="
docker exec appointment-service ps aux | grep python

echo -e "\n=== TEST ENDPOINT ==="
curl -v http://localhost:3001/doctors 2>&1
```

---

## 🔥 Solución Nuclear (Si Nada Funciona)

```bash
# 1. Detener todo
docker-compose down

# 2. Eliminar solo el volumen de appointment service (si existe)
docker volume ls | grep appointment

# 3. Rebuild del appointment service
docker-compose build --no-cache appointment-service

# 4. Iniciar todo
docker-compose up -d

# 5. Esperar
sleep 60

# 6. Ver logs
docker logs appointment-service --tail 50

# 7. Probar
curl http://localhost:3001/doctors
```

---

## 📊 Checklist de Verificación

- [ ] `docker logs appointment-service` revisado
- [ ] Appointment service está `(healthy)` en `docker-compose ps`
- [ ] `curl http://localhost:3001/health` responde `{"status":"ok"}`
- [ ] `curl http://localhost:3001/doctors` devuelve lista de doctores
- [ ] `docker exec appointment-service env | grep DATABASE_URL` es correcto
- [ ] PostgreSQL está `(healthy)`
- [ ] Tabla `doctors` existe y tiene 3 registros

---

## 🆘 Siguiente Paso

**Ejecuta este comando y comparte el resultado completo:**

```bash
docker logs appointment-service --tail 100
```

Eso me dirá **exactamente** por qué está fallando el endpoint `/doctors`.

---

**Nota:** El error 500 es interno del appointment-service, NO de N8n. N8n está funcionando correctamente, pero el backend está fallando.
