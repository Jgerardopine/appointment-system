# Comandos del Bot de Telegram

Esta guía muestra todos los comandos disponibles en el bot de Telegram y cómo usarlos.

## 🤖 Comandos Disponibles

### 1. `/start` - Iniciar el Bot

**Descripción**: Muestra el menú principal con opciones disponibles

**Uso**:
```
/start
```

**Respuesta Esperada**:
```
🏥 ¡Hola [Tu Nombre]! Bienvenido al Sistema de Citas Médicas

Puedo ayudarte con:

📅 /agendar - Agendar nueva cita
🔍 /verificar - Verificar estado de cita
❌ /cancelar - Cancelar cita existente
📋 /mis_citas - Ver todas tus citas
❓ /ayuda - Ver este menú de ayuda

¿Cómo puedo ayudarte hoy?
```

Con botones interactivos:
- 📅 Agendar Cita
- 📋 Mis Citas
- ❓ Ayuda

---

### 2. `/agendar` - Agendar Nueva Cita

**Descripción**: Crea una nueva cita médica

**Formato**:
```
/agendar [Doctor] [Fecha] [Hora]
```

**Parámetros**:
- **Doctor**: Nombre del doctor (puede contener espacios)
- **Fecha**: Formato AAAA-MM-DD (ej: 2024-12-25)
- **Hora**: Formato HH:MM en 24 horas (ej: 10:00, 14:30)

**Ejemplos Válidos**:
```
/agendar Dr. López 2024-12-01 10:00
/agendar Dra. María García 2024-12-15 14:30
/agendar Dr. Juan 2024-12-20 09:00
```

**Ejemplos Inválidos**:
```
/agendar Dr. López 25/12/2024 10:00 AM     ❌ Formato de fecha incorrecto
/agendar Dr. López 2024-12-01 10:00 AM      ❌ No usar AM/PM
/agendar Dr. López 2024-11-20 10:00         ❌ Fecha en el pasado
/agendar Dr. López 2024-12-01 25:00         ❌ Hora inválida
```

**Respuesta Exitosa**:
```
✅ ¡Cita Agendada Exitosamente!

📋 **Detalles de tu cita:**
🆔 ID: 123
👨‍⚕️ Doctor: doc_lopez
📅 Fecha: lunes, 1 de diciembre de 2024
⏰ Hora: 10:00:00
⏱ Duración: 30 minutos

📌 Estado: scheduled

💡 Te enviaremos un recordatorio 24 horas antes de tu cita.
```

Con botones:
- 📋 Ver Mis Citas
- 🏠 Menú Principal

**Errores Comunes**:

1. **Formato Incorrecto**:
```
❌ Formato incorrecto

Usa: /agendar [Doctor] [Fecha] [Hora]

Ejemplo:
/agendar Dr. López 2024-11-25 10:00
```

2. **Fecha Pasada**:
```
❌ No puedes agendar citas en fechas pasadas
```

3. **Hora Inválida**:
```
❌ Formato de hora inválido. Usa formato HH:MM (ej: 10:00)
```

---

### 3. `/verificar` - Verificar Estado de Cita

**Descripción**: Consulta los detalles de una cita específica

**Formato**:
```
/verificar [ID_CITA]
```

**Parámetros**:
- **ID_CITA**: El número de identificación de la cita

**Ejemplos**:
```
/verificar 1
/verificar 123
/verificar 456
```

**Respuesta Exitosa**:
```
📋 **Información de tu Cita**

🆔 ID: 123
✅ Estado: scheduled
👨‍⚕️ Doctor: doc_lopez
📅 Fecha: lunes, 1 de diciembre de 2024
⏰ Hora: 10:00:00
⏱ Duración: 30 minutos
```

Con botones (si la cita está programada):
- ✅ Confirmar
- ❌ Cancelar
- 🏠 Menú Principal

**Estados Posibles**:
- `scheduled` 📅 - Cita programada
- `confirmed` ✅ - Cita confirmada
- `cancelled` ❌ - Cita cancelada
- `completed` ✔️ - Cita completada
- `no_show` ⚠️ - Paciente no se presentó

**Error - Cita No Encontrada**:
```
❌ No se encontró la cita con ese ID

Verifica el ID e intenta nuevamente.
```

**Error - ID Faltante**:
```
❌ Por favor proporciona el ID de la cita

Usa: /verificar [ID_CITA]

Ejemplo:
/verificar 1
```

---

### 4. `/cancelar` - Cancelar Cita

**Descripción**: Cancela una cita existente

**Formato**:
```
/cancelar [ID_CITA]
```

**Parámetros**:
- **ID_CITA**: El número de identificación de la cita a cancelar

**Ejemplos**:
```
/cancelar 1
/cancelar 123
```

**Respuesta Exitosa**:
```
✅ Cita cancelada exitosamente

🆔 ID: 123

Puedes agendar una nueva cita cuando lo necesites.
```

Con botones:
- 📅 Agendar Nueva Cita
- 📋 Mis Citas
- 🏠 Menú Principal

**Error - No se Puede Cancelar**:
```
❌ Error al cancelar la cita

[Mensaje de error específico]

Por favor intenta nuevamente.
```

**Error - ID Faltante**:
```
❌ Por favor proporciona el ID de la cita

Usa: /cancelar [ID_CITA]

Ejemplo:
/cancelar 1
```

---

### 5. `/mis_citas` - Ver Todas las Citas

**Descripción**: Lista todas tus citas programadas

**Uso**:
```
/mis_citas
```

**Respuesta con Citas**:
```
📋 **Tus Citas (3)**

1. ✅ **lun, dic 1** - 10:00:00
   👨‍⚕️ doc_lopez
   🆔 ID: 123

2. 📅 **mié, dic 3** - 14:30:00
   👨‍⚕️ doc_garcia
   🆔 ID: 124

3. ❌ **vie, dic 5** - 09:00:00
   👨‍⚕️ doc_ruiz
   🆔 ID: 125
```

Con botones:
- 📅 Nueva Cita
- 🏠 Menú Principal

**Respuesta Sin Citas**:
```
📋 No tienes citas registradas

¿Quieres agendar una nueva cita?
```

Con botones:
- 📅 Agendar Cita
- 🏠 Menú Principal

**Error de Conexión**:
```
❌ Error al obtener tus citas

Intenta nuevamente más tarde.
```

---

### 6. `/ayuda` - Ver Ayuda

**Descripción**: Muestra la guía completa de uso del bot

**Uso**:
```
/ayuda
```

**Respuesta**:
```
❓ **Ayuda - Sistema de Citas Médicas**

**Comandos Disponibles:**

📅 **/agendar** [Doctor] [Fecha] [Hora]
Agenda una nueva cita médica
Ejemplo: /agendar Dr. López 2024-11-25 10:00

🔍 **/verificar** [ID_Cita]
Verifica el estado de una cita específica
Ejemplo: /verificar 1

❌ **/cancelar** [ID_Cita]
Cancela una cita existente
Ejemplo: /cancelar 1

📋 **/mis_citas**
Muestra todas tus citas programadas

**Formatos Aceptados:**
• Fecha: AAAA-MM-DD (ej: 2024-11-25)
• Hora: HH:MM (ej: 10:00, 14:30)
• Horario: 8:00 AM - 6:00 PM
• Días: Lunes a Viernes

**Tips:**
• Las citas duran 30 minutos por defecto
• No se pueden agendar citas en el pasado
• Recibirás recordatorios 24h antes

¿Necesitas más ayuda? Contacta soporte
```

Con botones:
- 📅 Agendar Cita
- 📋 Mis Citas
- 🏠 Menú Principal

---

## 📱 Botones Interactivos

El bot incluye botones inline que facilitan la navegación:

### Botones Principales
- **📅 Agendar Cita**: Acceso directo para agendar
- **📋 Mis Citas**: Ver lista de citas
- **❓ Ayuda**: Mostrar ayuda
- **🏠 Menú Principal**: Volver al inicio

### Botones de Acciones
- **✅ Confirmar**: Confirmar una cita programada
- **❌ Cancelar**: Cancelar una cita
- **📅 Nueva Cita**: Agendar otra cita

---

## 🎯 Flujos de Uso Comunes

### Flujo 1: Agendar Primera Cita

```
Usuario: /start
Bot: [Menú de bienvenida]

Usuario: /agendar Dr. López 2024-12-01 10:00
Bot: [Confirmación de cita creada con ID]

Usuario: /mis_citas
Bot: [Lista con la nueva cita]
```

### Flujo 2: Verificar y Cancelar

```
Usuario: /mis_citas
Bot: [Lista de citas con IDs]

Usuario: /verificar 123
Bot: [Detalles de la cita 123]

Usuario: /cancelar 123
Bot: [Confirmación de cancelación]
```

### Flujo 3: Uso de Botones

```
Usuario: /start
Bot: [Menú con botones]

Usuario: [Click en "📅 Agendar Cita"]
Bot: [Mensaje con instrucciones]

Usuario: Dr. García 2024-12-05 14:00
Bot: ❌ Formato incorrecto, usa /agendar

Usuario: /agendar Dr. García 2024-12-05 14:00
Bot: ✅ [Confirmación]
```

---

## 🐛 Errores Comunes y Soluciones

### Error 1: "Formato incorrecto"

**Problema**: No estás usando el formato correcto del comando

**Solución**:
- Verifica que incluyas `/` al inicio
- Usa espacios entre parámetros
- Sigue el formato exacto: `/agendar Dr. López 2024-12-01 10:00`

### Error 2: "Fecha en el pasado"

**Problema**: Intentas agendar una cita en una fecha que ya pasó

**Solución**:
- Usa una fecha futura
- Verifica que el año sea correcto (2024, no 2023)

### Error 3: "Hora inválida"

**Problema**: El formato de hora no es correcto

**Solución**:
- Usa formato 24 horas: `10:00` no `10:00 AM`
- Asegúrate de que la hora esté entre 00:00 y 23:59
- Incluye los dos puntos: `10:00` no `1000`

### Error 4: Bot no responde

**Posibles causas**:
1. El workflow en N8n no está activo
2. Las credenciales de Telegram no están configuradas
3. Los servicios backend no están corriendo

**Solución**:
```bash
# Verificar servicios
docker-compose ps

# Ver logs de N8n
docker logs n8n -f

# Ejecutar script de verificación
./scripts/verify-setup.sh
```

### Error 5: "No se encontró la cita"

**Problema**: El ID de cita que proporcionaste no existe

**Solución**:
- Usa `/mis_citas` para ver los IDs válidos
- Verifica que no hayas escrito el ID incorrectamente

---

## 💡 Tips y Mejores Prácticas

### Para Usuarios

1. **Guarda los IDs**: Anota el ID de tu cita cuando la crees
2. **Verifica antes de cancelar**: Usa `/verificar` antes de `/cancelar`
3. **Revisa regularmente**: Usa `/mis_citas` para estar al tanto
4. **Formato de fecha**: Recuerda siempre AAAA-MM-DD
5. **Hora en 24h**: Evita AM/PM, usa formato 24 horas

### Para Administradores

1. **Monitorea ejecuciones**: Revisa "Executions" en N8n
2. **Logs regulares**: Verifica logs de errores
3. **Backups**: Haz respaldos del workflow
4. **Pruebas**: Prueba todos los comandos después de cambios
5. **Documentación**: Mantén esta guía actualizada

---

## 🚀 Comandos Futuros (Por Implementar)

Estos comandos están planificados pero aún no implementados:

### `/doctores` - Ver Lista de Doctores
```
/doctores
```
Mostraría lista de doctores disponibles con especialidades

### `/horarios` - Ver Horarios Disponibles
```
/horarios Dr. López 2024-12-01
```
Mostraría horarios disponibles para un doctor en una fecha

### `/confirmar` - Confirmar Cita
```
/confirmar 123
```
Confirmaría una cita programada

### `/recordatorios` - Configurar Recordatorios
```
/recordatorios activar
/recordatorios desactivar
```
Configuraría preferencias de notificaciones

---

## 📞 Contacto y Soporte

Si tienes problemas con el bot:

1. **Revisa esta guía**: La mayoría de problemas están documentados aquí
2. **Ejecuta verificación**: `./scripts/verify-setup.sh`
3. **Revisa logs**: `docker-compose logs -f`
4. **Consulta documentación**: `docs/N8N_TELEGRAM_SETUP.md`

---

## 📝 Notas de Versión

### v1.0.0 (2024-11-24)
- ✨ Comandos iniciales implementados
- ✅ Integración con API Gateway
- 🤖 Bot de Telegram funcional
- 📋 Gestión completa de citas
- 🔧 Validaciones robustas
