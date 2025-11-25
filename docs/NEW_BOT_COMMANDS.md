# 🆕 Nuevos Comandos del Bot de Telegram

## 📋 Comandos Actuales (Ya Implementados)

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/start` | Menú principal | `/start` |
| `/agendar` | Agendar cita | `/agendar Dr. López 2024-12-15 10:00` |
| `/verificar` | Ver detalles de cita | `/verificar 1` |
| `/cancelar` | Cancelar cita | `/cancelar 1` |
| `/mis_citas` | Listar mis citas | `/mis_citas` |
| `/ayuda` | Ver ayuda | `/ayuda` |

---

## ✨ Nuevos Comandos a Implementar

### 1. `/doctores` - Lista de Doctores Disponibles

**Descripción**: Muestra todos los doctores disponibles en el sistema

**Formato**:
```
/doctores
/doctores [especialidad]
```

**Ejemplos**:
```bash
# Ver todos los doctores
/doctores

# Filtrar por especialidad
/doctores cardiologia
/doctores pediatria
/doctores medicina general
```

**Respuesta Esperada**:
```
👨‍⚕️ **Doctores Disponibles (15)**

1. Dr. Juan López
   📋 Especialidad: Medicina General
   📅 Días: Lun, Mar, Mié, Jue, Vie
   ⏰ Horario: 08:00 - 17:00
   🆔 ID: doc_lopez

2. Dra. María García  
   📋 Especialidad: Pediatría
   📅 Días: Lun, Mié, Vie
   ⏰ Horario: 09:00 - 15:00
   🆔 ID: doc_garcia

3. Dr. Carlos Ruiz
   📋 Especialidad: Cardiología
   📅 Días: Mar, Jue
   ⏰ Horario: 10:00 - 16:00
   🆔 ID: doc_ruiz

📄 Página 1 de 3

💡 Usa /disponibilidad [ID] [fecha] para ver horarios
💡 Usa /agendar [doctor] [fecha] [hora] para agendar
```

**API Endpoint**:
```
GET /api/appointments/doctors
GET /api/appointments/doctors?specialty=cardiologia
```

---

### 2. `/disponibilidad` - Ver Disponibilidad de Doctor

**Descripción**: Muestra los horarios disponibles de un doctor en una fecha específica

**Formato**:
```
/disponibilidad [ID_DOCTOR] [FECHA]
```

**Ejemplos**:
```bash
/disponibilidad doc_lopez 2024-12-15
/disponibilidad doc_garcia 2024-12-20
```

**Respuesta Esperada**:
```
📅 **Disponibilidad: Dr. Juan López**

Fecha: Viernes, 15 de diciembre 2024

⏰ **Horarios Disponibles:**

🟢 08:00 - 08:30
🟢 08:30 - 09:00
🟢 09:30 - 10:00
🟢 10:00 - 10:30
🔴 10:30 - 11:00 (Ocupado)
🟢 11:00 - 11:30
🟢 11:30 - 12:00
🟢 14:00 - 14:30
🟢 14:30 - 15:00

✅ 8 horarios disponibles

💡 Usa /agendar doc_lopez 2024-12-15 09:00 para agendar
```

**API Endpoint**:
```
GET /api/appointments/appointments/availability/{doctor_id}?date=2024-12-15&duration_minutes=30
```

---

### 3. `/doctor_info` - Información Detallada del Doctor

**Descripción**: Muestra información completa de un doctor incluyendo próximos horarios disponibles

**Formato**:
```
/doctor_info [ID_DOCTOR]
```

**Ejemplos**:
```bash
/doctor_info doc_lopez
/doctor_info doc_garcia
```

**Respuesta Esperada**:
```
👨‍⚕️ **Dr. Juan López**

📋 **Información:**
Especialidad: Medicina General
Licencia: MED-12345
📧 Email: jlopez@hospital.com
📞 Teléfono: +52 123-456-7890

📅 **Disponibilidad:**
Días: Lunes a Viernes
Horario: 08:00 - 17:00

📊 **Estadísticas:**
✅ Citas completadas: 234
⏰ Duración promedio: 28 min
🔜 Próximas citas: 8

🗓️ **Próximos Horarios Disponibles:**

• Hoy (Lun 11-Dec): 3 espacios disponibles (primer slot: 14:00)
• Mar 12-Dec: 8 espacios disponibles (primer slot: 08:00)
• Mié 13-Dec: 6 espacios disponibles (primer slot: 09:00)

💡 Usa /disponibilidad doc_lopez 2024-12-11 para ver todos los horarios
💡 Usa /agendar doc_lopez 2024-12-11 14:00 para agendar
```

**API Endpoints**:
```
GET /api/appointments/doctors/{doctor_id}
GET /api/appointments/doctors/{doctor_id}/statistics
```

---

### 4. `/confirmar` - Confirmar Cita Programada

**Descripción**: Confirma una cita que está en estado "scheduled"

**Formato**:
```
/confirmar [ID_CITA]
```

**Ejemplos**:
```bash
/confirmar 1
/confirmar 123
```

**Respuesta Esperada**:
```
✅ **Cita Confirmada**

🆔 ID: 123
👨‍⚕️ Doctor: Dr. Juan López
📅 Fecha: Viernes, 15 de diciembre 2024
⏰ Hora: 10:00 AM
⏱ Duración: 30 minutos

📌 Estado: CONFIRMADA ✅

📝 **Recordatorios:**
• Llegar 10 minutos antes
• Traer identificación oficial
• Traer estudios previos (si aplica)

💡 Recibirás un recordatorio 24h antes
❌ Puedes cancelar hasta 2h antes con /cancelar 123
```

**API Endpoint**:
```
POST /api/appointments/appointments/{appointment_id}/confirm
```

---

### 5. `/especialidades` - Lista de Especialidades Disponibles

**Descripción**: Muestra todas las especialidades médicas disponibles

**Formato**:
```
/especialidades
```

**Respuesta Esperada**:
```
📋 **Especialidades Médicas Disponibles**

1. 🫀 **Cardiología** (3 doctores)
2. 👶 **Pediatría** (5 doctores)
3. 🏥 **Medicina General** (8 doctores)
4. 🦴 **Traumatología** (2 doctores)
5. 👁️ **Oftalmología** (3 doctores)
6. 🦷 **Odontología** (4 doctores)
7. 🧠 **Neurología** (2 doctores)
8. 🩺 **Medicina Interna** (3 doctores)

💡 Usa /doctores [especialidad] para ver doctores específicos
Ejemplo: /doctores cardiologia
```

**API Endpoint**:
```
GET /api/appointments/doctors?specialty=GROUP
```

---

### 6. `/buscar` - Búsqueda Avanzada de Citas

**Descripción**: Busca citas por fecha o doctor

**Formato**:
```
/buscar [fecha]
/buscar [doctor_id]
```

**Ejemplos**:
```bash
/buscar 2024-12-15
/buscar doc_lopez
```

**Respuesta Esperada**:
```
🔍 **Resultados de Búsqueda**

Búsqueda: Fecha 15-Dec-2024

✅ **2 citas encontradas:**

1. 🆔 123 - ✅ Confirmada
   👨‍⚕️ Dr. Juan López
   ⏰ 10:00 - 10:30
   
2. 🆔 124 - 📅 Programada
   👨‍⚕️ Dra. María García
   ⏰ 14:00 - 14:30

💡 Usa /verificar [ID] para ver detalles
```

---

### 7. `/recordatorios` - Configurar Recordatorios

**Descripción**: Activa/desactiva recordatorios automáticos

**Formato**:
```
/recordatorios [on|off]
/recordatorios estado
```

**Ejemplos**:
```bash
/recordatorios on
/recordatorios off
/recordatorios estado
```

**Respuesta Esperada**:
```
🔔 **Configuración de Recordatorios**

Estado actual: ✅ ACTIVADO

**Recibirás notificaciones:**
• 📅 24 horas antes de la cita
• ⏰ 2 horas antes de la cita
• ✅ Confirmaciones de cambios

**Opciones:**
/recordatorios off - Desactivar
/recordatorios on - Activar

💡 Los recordatorios te ayudan a no olvidar tus citas
```

---

## 📊 Resumen de APIs Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/doctors` | GET | Lista todos los doctores |
| `/doctors?specialty={specialty}` | GET | Filtra doctores por especialidad |
| `/doctors/{id}` | GET | Info completa de un doctor |
| `/doctors/{id}/statistics` | GET | Estadísticas del doctor |
| `/appointments` | POST | Crear cita |
| `/appointments` | GET | Listar citas (con filtros) |
| `/appointments/{id}` | GET | Ver cita específica |
| `/appointments/{id}` | PUT | Actualizar cita |
| `/appointments/{id}` | DELETE | Cancelar cita |
| `/appointments/{id}/confirm` | POST | Confirmar cita |
| `/appointments/availability/{doctor_id}` | GET | Ver disponibilidad |

---

## 🎯 Prioridad de Implementación

### Alta Prioridad (Esenciales)
1. ✅ `/doctores` - **CRÍTICO**: Sin esto, usuarios no saben qué doctores hay
2. ✅ `/disponibilidad` - **CRÍTICO**: Necesario para ver horarios antes de agendar
3. ✅ `/confirmar` - **IMPORTANTE**: Flujo completo de citas

### Media Prioridad (Mejora UX)
4. `/doctor_info` - Info detallada ayuda a tomar decisiones
5. `/especialidades` - Facilita descubrimiento
6. `/buscar` - Conveniencia para usuarios activos

### Baja Prioridad (Nice to Have)
7. `/recordatorios` - Requiere integración con sistema de notificaciones

---

## 🔄 Flujo de Usuario Mejorado

### Flujo Actual (Limitado):
```
/start → /agendar Dr. López 2024-12-15 10:00 → ¿Quién es Dr. López? ❓
```

### Flujo Nuevo (Completo):
```
/start
  ↓
/doctores → Ver lista completa
  ↓
/doctor_info doc_lopez → Ver detalles y disponibilidad
  ↓
/disponibilidad doc_lopez 2024-12-15 → Ver horarios exactos
  ↓
/agendar doc_lopez 2024-12-15 10:00 → Agendar
  ↓
/confirmar 123 → Confirmar cita
  ↓
/mis_citas → Ver confirmación en lista
```

---

## 📝 Consideraciones para Implementación

### 1. Parser de Comandos
Actualizar `Parse Message` node para reconocer:
```javascript
else if (command === 'doctores') {
  params = {
    specialty: parts[1] || null
  };
} else if (command === 'disponibilidad') {
  params = {
    doctorId: parts[1],
    date: parts[2]
  };
} else if (command === 'doctor_info') {
  params = {
    doctorId: parts[1]
  };
} else if (command === 'confirmar') {
  params = {
    appointmentId: parts[1]
  };
}
```

### 2. Command Router
Agregar nuevas salidas en el Switch node:
- `doctores`
- `disponibilidad`
- `doctor_info`
- `confirmar`
- `especialidades`
- `buscar`
- `recordatorios`

### 3. API Nodes
Crear nodos HTTP Request para cada endpoint nuevo

### 4. Format Nodes
Crear nodos de formateo para cada tipo de respuesta

---

## 🚀 Beneficios de los Nuevos Comandos

### Para el Usuario:
- ✅ **Descubrimiento**: Saber qué doctores hay disponibles
- ✅ **Transparencia**: Ver horarios disponibles antes de agendar
- ✅ **Confianza**: Información completa de cada doctor
- ✅ **Conveniencia**: Confirmar citas directamente desde Telegram
- ✅ **Exploración**: Navegar por especialidades

### Para el Sistema:
- ✅ **Menor fricción**: Menos citas canceladas por mala información
- ✅ **Mejor UX**: Flujo más natural y completo
- ✅ **Más engagement**: Usuarios exploran el sistema
- ✅ **Datos útiles**: Estadísticas de preferencias de usuarios

---

## 📚 Próximos Pasos

1. **Actualizar Parse Message node** con nuevos comandos
2. **Actualizar Command Router** con nuevas rutas
3. **Crear HTTP Request nodes** para cada endpoint
4. **Crear Format nodes** para cada respuesta
5. **Conectar todos los nodos** al Send Message node
6. **Probar cada comando** individualmente
7. **Actualizar documentación** de comandos
8. **Commit y push** al repositorio

---

¿Quieres que implemente estos comandos en el workflow de N8n ahora? 🚀
