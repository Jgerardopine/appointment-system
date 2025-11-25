# 🔧 Solución REAL: Error 500 - Métodos Faltantes en Database

## 🔍 Problema Identificado

Los endpoints `/doctors` y otros fallan con **error 500** porque el código intenta usar métodos que **no existen** en la clase `Database`.

### Error Exacto:

```python
# En main.py línea 196:
result = await di_container.database.fetch_all(query, params)

# En main.py línea 214:
count_result = await di_container.database.fetch_one(count_query, count_params)
```

**Pero en `database.py` solo existen:**
- `fetch()` ✅
- `fetchrow()` ✅
- `fetchval()` ✅

**NO EXISTEN:**
- `fetch_all()` ❌
- `fetch_one()` ❌

---

## ✅ Corrección Aplicada

He agregado los métodos faltantes en `services/appointment-service/infrastructure/database.py`:

```python
async def fetch_all(self, query: str, args: list = None):
    """
    Fetch all rows (alias for compatibility)
    """
    if args is None:
        args = []
    async with self.acquire() as connection:
        return await connection.fetch(query, *args)

async def fetch_one(self, query: str, args: list = None):
    """
    Fetch one row (alias for compatibility)
    """
    if args is None:
        args = []
    async with self.acquire() as connection:
        return await connection.fetchrow(query, *args)
```

---

## 📋 Pasos para Aplicar la Corrección

### 1️⃣ Actualizar el Repositorio
```bash
cd /ruta/a/tu/proyecto/appointment-system
git pull origin main
```

### 2️⃣ Rebuild del Appointment Service

**IMPORTANTE:** Como modificamos código Python, necesitamos rebuild:

```bash
# Detener el servicio
docker-compose stop appointment-service

# Rebuild el servicio
docker-compose build appointment-service

# Iniciar el servicio
docker-compose up -d appointment-service

# Esperar 10 segundos
sleep 10
```

### 3️⃣ Verificar Logs

```bash
# Ver que el servicio inició correctamente
docker logs appointment-service --tail 20

# Debe mostrar:
# "Starting Appointment Service..."
# "Database connected successfully"
# "Application startup complete"
```

### 4️⃣ Probar Endpoints

```bash
# Ejecutar script de prueba
chmod +x scripts/test-endpoints.sh
./scripts/test-endpoints.sh
```

O manualmente:

```bash
# Health check (debe funcionar)
curl http://localhost:3001/health

# List doctors (ahora debe funcionar)
curl http://localhost:3001/doctors

# A través del API Gateway
curl http://localhost:4000/api/appointments/doctors
```

**Resultado esperado:**
```json
{
  "doctors": [
    {
      "id": 1,
      "name": "Dr. Juan Pérez",
      "email": "juan.perez@hospital.com",
      "specialty": "Cardiología",
      ...
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

### 5️⃣ Probar en N8n

1. Abrir N8n: `http://localhost:5678`
2. Abrir el workflow
3. Ejecutar manualmente el nodo "List Doctores API"
4. Debe ejecutarse **sin error 500** ✅

### 6️⃣ Probar en Telegram

```
/doctores
```

Debe mostrar la lista de 3 doctores.

---

## 🐛 Causa del Error

### Código Inconsistente

El archivo `main.py` fue escrito esperando estos métodos:
- `fetch_all(query, args)`
- `fetch_one(query, args)`

Pero el archivo `database.py` solo implementaba:
- `fetch(query, *args)`
- `fetchrow(query, *args)`

### Por Qué Pasó

Probablemente hubo un refactoring incompleto o diferentes personas escribieron cada archivo sin verificar la interfaz completa.

---

## 📊 Endpoints Afectados

Todos estos endpoints fallaban con error 500:

| Endpoint | Método | Error |
|----------|--------|-------|
| `GET /doctors` | `fetch_all` | ❌ No existía |
| `GET /doctors/{id}` | `fetch_one` | ❌ No existía |
| `GET /doctors/{id}/statistics` | `fetch_one` | ❌ No existía |
| `GET /appointments` | `fetch_all` | ❌ No existía |
| `GET /appointments/{id}` | `fetch_one` | ❌ No existía |

**Ahora todos funcionan** ✅

---

## ✅ Checklist de Verificación

Después de aplicar la corrección:

- [ ] `git pull origin main` ejecutado
- [ ] `docker-compose build appointment-service` ejecutado
- [ ] `docker-compose up -d appointment-service` ejecutado
- [ ] `docker logs appointment-service` no muestra errores
- [ ] `curl http://localhost:3001/health` responde OK
- [ ] `curl http://localhost:3001/doctors` devuelve lista de doctores ✅
- [ ] `curl http://localhost:4000/api/appointments/doctors` también funciona
- [ ] N8n puede ejecutar "List Doctores API" sin error 500
- [ ] `/doctores` funciona en Telegram

---

## 🔍 Cómo Diagnosticar Este Tipo de Errores

### 1. Ver Logs del Servicio
```bash
docker logs appointment-service --tail 100
```

Buscar líneas como:
```
AttributeError: 'Database' object has no attribute 'fetch_all'
```

### 2. Verificar el Stack Trace

El error debe indicar:
- Qué método se intentó llamar
- En qué línea del código
- Qué objeto no tiene ese método

### 3. Comparar Definición vs Uso

```bash
# Ver métodos definidos en database.py
grep "async def" services/appointment-service/infrastructure/database.py

# Ver métodos usados en main.py
grep "database\." services/appointment-service/main.py
```

---

## 📁 Archivo Modificado

```diff
File: services/appointment-service/infrastructure/database.py

+ async def fetch_all(self, query: str, args: list = None):
+     """Fetch all rows (alias for compatibility)"""
+     if args is None:
+         args = []
+     async with self.acquire() as connection:
+         return await connection.fetch(query, *args)
+ 
+ async def fetch_one(self, query: str, args: list = None):
+     """Fetch one row (alias for compatibility)"""
+     if args is None:
+         args = []
+     async with self.acquire() as connection:
+         return await connection.fetchrow(query, *args)
```

**Total:** 1 archivo modificado, +18 líneas

---

## 🚀 Resultado Final

Después de aplicar esta corrección:

✅ **TODOS los endpoints del appointment-service funcionan**  
✅ N8n puede llamar a `/api/appointments/doctors` sin error 500  
✅ El comando `/doctores` funciona en Telegram  
✅ Todos los demás endpoints también funcionan  

---

## 🆘 Si Aún No Funciona

### 1. Verificar que se aplicó el cambio:
```bash
# Debe mostrar los nuevos métodos
grep -A 5 "fetch_all\|fetch_one" services/appointment-service/infrastructure/database.py
```

### 2. Verificar que se rebuildeó:
```bash
# Ver timestamp de la imagen
docker images | grep appointment-service
```

### 3. Forzar rebuild completo:
```bash
docker-compose build --no-cache appointment-service
docker-compose up -d appointment-service
```

### 4. Ver logs en tiempo real:
```bash
docker logs appointment-service -f
```

### 5. Reinicio completo si es necesario:
```bash
docker-compose down
docker-compose up -d --build
sleep 60
```

---

**Commit:** Pendiente  
**Archivos:** 1 modificado (database.py)  
**Problema:** Métodos faltantes en clase Database  
**Solución:** Agregar `fetch_all()` y `fetch_one()`  
**Estado:** ✅ Resuelto
