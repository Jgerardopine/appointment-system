#!/usr/bin/env node
/**
 * Script para actualizar el workflow de N8n con nuevos comandos
 * 
 * Agrega los siguientes comandos:
 * 1. /doctores - Lista de doctores disponibles
 * 2. /disponibilidad - Ver disponibilidad de un doctor
 * 3. /confirmar - Confirmar una cita
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');

// Leer workflow actual
console.log('📖 Leyendo workflow actual...');
const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));

// Actualizar el nodo Parse Message para incluir nuevos comandos
console.log('🔧 Actualizando Parse Message node...');

const parseMessageNode = workflow.nodes.find(n => n.id === 'parse-message');
if (parseMessageNode) {
  parseMessageNode.parameters.jsCode = `// Parse incoming Telegram message
const items = $input.all();
const results = [];

for (const item of items) {
  const message = item.json.message;
  
  if (!message) {
    continue;
  }
  
  const text = message.text || '';
  const chatId = message.chat?.id;
  const userId = message.from?.id;
  const username = message.from?.username;
  const firstName = message.from?.first_name;
  
  // Parse command and parameters
  let command = '';
  let params = {};
  
  if (text.startsWith('/')) {
    const parts = text.split(' ');
    command = parts[0].substring(1);
    
    // Parse parameters based on command
    if (command === 'agendar' && parts.length >= 4) {
      params = {
        doctor: parts.slice(1, -2).join(' '),
        date: parts[parts.length - 2],
        time: parts[parts.length - 1]
      };
    } else if (command === 'verificar' || command === 'cancelar' || command === 'confirmar') {
      params = {
        appointmentId: parts[1]
      };
    } else if (command === 'doctores') {
      params = {
        specialty: parts.slice(1).join(' ') || null
      };
    } else if (command === 'disponibilidad' && parts.length >= 3) {
      params = {
        doctorId: parts[1],
        date: parts[2]
      };
    } else if (command === 'doctor_info') {
      params = {
        doctorId: parts[1]
      };
    }
  } else {
    command = 'natural';
    params = { text: text };
  }
  
  results.push({
    json: {
      command,
      params,
      chatId,
      userId,
      username,
      firstName,
      originalText: text,
      timestamp: new Date().toISOString()
    }
  });
}

return results;`;

  console.log('✅ Parse Message node actualizado');
}

// Actualizar el Command Router para incluir nuevas rutas
console.log('🔧 Actualizando Command Router...');

const commandRouterNode = workflow.nodes.find(n => n.id === 'command-router');
if (commandRouterNode) {
  // Agregar nuevas condiciones
  const newConditions = [
    {
      "conditions": {
        "options": {
          "caseSensitive": false
        },
        "conditions": [
          {
            "leftValue": "={{ $json.command }}",
            "rightValue": "doctores",
            "operator": {
              "type": "string",
              "operation": "equals"
            }
          }
        ],
        "combinator": "and"
      },
      "renameOutput": true,
      "outputKey": "doctores"
    },
    {
      "conditions": {
        "options": {
          "caseSensitive": false
        },
        "conditions": [
          {
            "leftValue": "={{ $json.command }}",
            "rightValue": "disponibilidad",
            "operator": {
              "type": "string",
              "operation": "equals"
            }
          }
        ],
        "combinator": "and"
      },
      "renameOutput": true,
      "outputKey": "disponibilidad"
    },
    {
      "conditions": {
        "options": {
          "caseSensitive": false
        },
        "conditions": [
          {
            "leftValue": "={{ $json.command }}",
            "rightValue": "confirmar",
            "operator": {
              "type": "string",
              "operation": "equals"
            }
          }
        ],
        "combinator": "and"
      },
      "renameOutput": true,
      "outputKey": "confirmar"
    }
  ];
  
  // Agregar al array de valores existente
  commandRouterNode.parameters.rules.values.push(...newConditions);
  
  console.log('✅ Command Router actualizado con nuevas rutas');
}

// Agregar nuevos nodos

// 1. Nodo para validar comando /doctores
const validateDoctoresNode = {
  "parameters": {
    "jsCode": `// Validate doctores command parameters
const chatId = $input.first().json.chatId;
const params = $input.first().json.params;
const specialty = params.specialty;

return [{
  json: {
    valid: true,
    chatId: chatId,
    specialty: specialty,
    page: 1,
    pageSize: 10
  }
}];`
  },
  "id": "validate-doctores",
  "name": "Validate Doctores",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    840,
    1100
  ]
};

// 2. Nodo para llamar API de doctores
const listDoctoresApiNode = {
  "parameters": {
    "method": "GET",
    "url": "=http://api-gateway:3000/api/appointments/doctors{{ $json.specialty ? '?specialty=' + $json.specialty : '' }}",
    "options": {}
  },
  "id": "list-doctores-api",
  "name": "List Doctores API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    1040,
    1100
  ],
  "continueOnFail": true,
  "alwaysOutputData": true
};

// 3. Nodo para formatear respuesta de doctores
const formatDoctoresResponseNode = {
  "parameters": {
    "jsCode": `// Format doctores list response
const response = $input.first().json;
const previousData = $input.all()[0].json;
const chatId = previousData.chatId;

if (response.error || !response.doctors) {
  return [{
    json: {
      chatId: chatId,
      message: \`❌ Error al obtener la lista de doctores\\n\\nIntenta nuevamente más tarde.\`
    }
  }];
}

const doctors = response.doctors || [];

if (doctors.length === 0) {
  const specialty = previousData.specialty;
  return [{
    json: {
      chatId: chatId,
      message: \`📋 No se encontraron doctores\${specialty ? ' en ' + specialty : ''}\\n\\n¿Quieres ver todas las especialidades?\\n/ayuda\`,
      keyboard: {
        inline_keyboard: [
          [
            { text: '👨‍⚕️ Ver Todos los Doctores', callback_data: '/doctores' },
            { text: '🏠 Menú Principal', callback_data: '/start' }
          ]
        ]
      }
    }
  }];
}

let message = \`👨‍⚕️ **Doctores Disponibles (\${doctors.length})**\\n\\n\`;

doctors.slice(0, 5).forEach((doctor, index) => {
  message += \`\${index + 1}. **\${doctor.name}**\\n\`;
  message += \`   📋 Especialidad: \${doctor.specialty}\\n\`;
  
  // Available days
  const days = Array.isArray(doctor.available_days) ? doctor.available_days.join(', ') : 'No especificado';
  message += \`   📅 Días: \${days}\\n\`;
  
  // Available hours
  if (doctor.available_hours) {
    const hours = doctor.available_hours;
    message += \`   ⏰ Horario: \${hours.start || '08:00'} - \${hours.end || '17:00'}\\n\`;
  }
  
  message += \`   🆔 ID: \${doctor.id}\\n\\n\`;
});

if (doctors.length > 5) {
  message += \`\\n... y \${doctors.length - 5} más\\n\`;
}

message += \`\\n💡 Usa /disponibilidad [ID] [fecha] para ver horarios\`;
message += \`\\n💡 Usa /agendar [ID] [fecha] [hora] para agendar\`;

const keyboard = {
  inline_keyboard: [
    [
      { text: '📅 Agendar Cita', callback_data: '/agendar' },
      { text: '🏠 Menú Principal', callback_data: '/start' }
    ]
  ]
};

return [{
  json: {
    chatId: chatId,
    message: message,
    keyboard: keyboard
  }
}];`
  },
  "id": "format-doctores-response",
  "name": "Format Doctores Response",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    1240,
    1100
  ]
};

// 4. Nodo para validar comando /disponibilidad
const validateDisponibilidadNode = {
  "parameters": {
    "jsCode": `// Validate disponibilidad command parameters
const params = $input.first().json.params;
const chatId = $input.first().json.chatId;

if (!params.doctorId || !params.date) {
  return [{
    json: {
      valid: false,
      chatId: chatId,
      message: \`❌ Formato incorrecto\\n\\nUsa: /disponibilidad [ID_DOCTOR] [FECHA]\\n\\nEjemplo:\\n/disponibilidad doc_lopez 2024-12-15\\n\\n💡 Usa /doctores para ver IDs de doctores\`
    }
  }];
}

// Validate date format
const dateRegex = /^\\d{4}-\\d{2}-\\d{2}$/;
if (!dateRegex.test(params.date)) {
  return [{
    json: {
      valid: false,
      chatId: chatId,
      message: \`❌ Formato de fecha inválido\\n\\nUsa formato AAAA-MM-DD\\nEjemplo: 2024-12-15\`
    }
  }];
}

return [{
  json: {
    valid: true,
    chatId: chatId,
    doctorId: params.doctorId,
    date: params.date
  }
}];`
  },
  "id": "validate-disponibilidad",
  "name": "Validate Disponibilidad",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    840,
    1240
  ]
};

// 5. Nodo para llamar API de disponibilidad
const checkAvailabilityApiNode = {
  "parameters": {
    "method": "GET",
    "url": "=http://api-gateway:3000/api/appointments/appointments/availability/{{ $json.doctorId }}?date={{ $json.date }}&duration_minutes=30",
    "options": {}
  },
  "id": "check-availability-api",
  "name": "Check Availability API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    1040,
    1240
  ],
  "continueOnFail": true,
  "alwaysOutputData": true
};

// 6. Nodo para formatear respuesta de disponibilidad
const formatAvailabilityResponseNode = {
  "parameters": {
    "jsCode": `// Format availability response
const response = $input.first().json;
const previousData = $input.all()[0].json;
const chatId = previousData.chatId;

if (response.error || !response.available_slots) {
  return [{
    json: {
      chatId: chatId,
      message: \`❌ Error al consultar disponibilidad\\n\\n\${response.error || 'Doctor no encontrado'}\\n\\n💡 Usa /doctores para ver doctores disponibles\`
    }
  }];
}

const slots = response.available_slots || [];
const doctorId = response.doctor_id || previousData.doctorId;
const dateStr = response.date || previousData.date;

// Format date
const date = new Date(dateStr);
const dateFormatted = date.toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

if (slots.length === 0) {
  return [{
    json: {
      chatId: chatId,
      message: \`📅 **Disponibilidad: \${doctorId}**\\n\\nFecha: \${dateFormatted}\\n\\n❌ No hay horarios disponibles para esta fecha\\n\\n💡 Intenta con otra fecha\\n💡 Usa /doctores para ver otros doctores\`,
      keyboard: {
        inline_keyboard: [
          [
            { text: '👨‍⚕️ Ver Doctores', callback_data: '/doctores' },
            { text: '🏠 Menú Principal', callback_data: '/start' }
          ]
        ]
      }
    }
  }];
}

let message = \`📅 **Disponibilidad: \${doctorId}**\\n\\nFecha: \${dateFormatted}\\n\\n⏰ **Horarios Disponibles:**\\n\\n\`;

slots.slice(0, 10).forEach(slot => {
  const startTime = slot.start_time.substring(0, 5); // HH:MM
  const endTime = slot.end_time.substring(0, 5);
  message += \`🟢 \${startTime} - \${endTime}\\n\`;
});

if (slots.length > 10) {
  message += \`\\n... y \${slots.length - 10} horarios más\\n\`;
}

message += \`\\n✅ \${slots.length} horarios disponibles\\n\`;
message += \`\\n💡 Usa /agendar \${doctorId} \${dateStr} [hora] para agendar\`;
message += \`\\nEjemplo: /agendar \${doctorId} \${dateStr} \${slots[0].start_time.substring(0, 5)}\`;

const keyboard = {
  inline_keyboard: [
    [
      { text: '📅 Agendar', callback_data: \`/agendar\` },
      { text: '👨‍⚕️ Ver Doctores', callback_data: '/doctores' }
    ],
    [
      { text: '🏠 Menú Principal', callback_data: '/start' }
    ]
  ]
};

return [{
  json: {
    chatId: chatId,
    message: message,
    keyboard: keyboard
  }
}];`
  },
  "id": "format-availability-response",
  "name": "Format Availability Response",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    1240,
    1240
  ]
};

// 7. Nodo para validar comando /confirmar
const validateConfirmNode = {
  "parameters": {
    "jsCode": `// Validate confirm command parameters
const params = $input.first().json.params;
const chatId = $input.first().json.chatId;

if (!params.appointmentId) {
  return [{
    json: {
      valid: false,
      chatId: chatId,
      message: \`❌ Por favor proporciona el ID de la cita\\n\\nUsa: /confirmar [ID_CITA]\\n\\nEjemplo:\\n/confirmar 1\\n\\n💡 Usa /mis_citas para ver tus citas\`
    }
  }];
}

return [{
  json: {
    valid: true,
    chatId: chatId,
    appointmentId: params.appointmentId
  }
}];`
  },
  "id": "validate-confirm",
  "name": "Validate Confirm",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    840,
    1380
  ]
};

// 8. Nodo para confirmar cita via API
const confirmAppointmentApiNode = {
  "parameters": {
    "method": "POST",
    "url": "=http://api-gateway:3000/api/appointments/appointments/{{ $json.appointmentId }}/confirm",
    "options": {}
  },
  "id": "confirm-appointment-api",
  "name": "Confirm Appointment API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    1040,
    1380
  ],
  "continueOnFail": true,
  "alwaysOutputData": true
};

// 9. Nodo para formatear respuesta de confirmación
const formatConfirmResponseNode = {
  "parameters": {
    "jsCode": `// Format confirm response
const response = $input.first().json;
const previousData = $input.all()[0].json;
const chatId = previousData.chatId;

if (response.error || !response.id) {
  return [{
    json: {
      chatId: chatId,
      message: \`❌ Error al confirmar la cita\\n\\n\${response.error || response.message || 'Cita no encontrada o ya confirmada'}\\n\\n💡 Usa /verificar \${previousData.appointmentId} para ver el estado\`
    }
  }];
}

const appointment = response;
const date = new Date(appointment.appointment_date);
const dateStr = date.toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const message = \`✅ **Cita Confirmada**\\n\\n🆔 ID: \${appointment.id}\\n👨‍⚕️ Doctor: \${appointment.doctor_id}\\n📅 Fecha: \${dateStr}\\n⏰ Hora: \${appointment.start_time || appointment.appointment_time}\\n⏱ Duración: \${appointment.duration_minutes} minutos\\n\\n📌 Estado: CONFIRMADA ✅\\n\\n📝 **Recordatorios:**\\n• Llegar 10 minutos antes\\n• Traer identificación oficial\\n• Traer estudios previos (si aplica)\\n\\n💡 Recibirás un recordatorio 24h antes\`;

const keyboard = {
  inline_keyboard: [
    [
      { text: '📋 Mis Citas', callback_data: '/mis_citas' },
      { text: '🏠 Menú Principal', callback_data: '/start' }
    ]
  ]
};

return [{
  json: {
    chatId: chatId,
    message: message,
    keyboard: keyboard
  }
}];`
  },
  "id": "format-confirm-response",
  "name": "Format Confirm Response",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [
    1240,
    1380
  ]
};

// Agregar nuevos nodos al workflow
console.log('➕ Agregando nuevos nodos...');
workflow.nodes.push(
  validateDoctoresNode,
  listDoctoresApiNode,
  formatDoctoresResponseNode,
  validateDisponibilidadNode,
  checkAvailabilityApiNode,
  formatAvailabilityResponseNode,
  validateConfirmNode,
  confirmAppointmentApiNode,
  formatConfirmResponseNode
);

// Actualizar conexiones
console.log('🔗 Actualizando conexiones...');

// Encontrar el índice del Command Router
const commandRouterIndex = workflow.nodes.findIndex(n => n.id === 'command-router');
const sendMessageNodeId = 'telegram-send';

// Agregar nuevas conexiones desde Command Router
if (!workflow.connections["Command Router"]) {
  workflow.connections["Command Router"] = { main: [] };
}

// Asegurarse de que hay suficientes arrays en main
while (workflow.connections["Command Router"].main.length < 10) {
  workflow.connections["Command Router"].main.push([]);
}

// Agregar conexiones para doctores (índice 7)
workflow.connections["Command Router"].main[7] = [
  {
    "node": "Validate Doctores",
    "type": "main",
    "index": 0
  }
];

// Agregar conexiones para disponibilidad (índice 8)
workflow.connections["Command Router"].main[8] = [
  {
    "node": "Validate Disponibilidad",
    "type": "main",
    "index": 0
  }
];

// Agregar conexiones para confirmar (índice 9)
workflow.connections["Command Router"].main[9] = [
  {
    "node": "Validate Confirm",
    "type": "main",
    "index": 0
  }
];

// Conectar flujo de doctores
workflow.connections["Validate Doctores"] = {
  main: [[{ node: "List Doctores API", type: "main", index: 0 }]]
};
workflow.connections["List Doctores API"] = {
  main: [[{ node: "Format Doctores Response", type: "main", index: 0 }]]
};
workflow.connections["Format Doctores Response"] = {
  main: [[{ node: "Send Telegram Message", type: "main", index: 0 }]]
};

// Conectar flujo de disponibilidad
workflow.connections["Validate Disponibilidad"] = {
  main: [[{ node: "Check Availability API", type: "main", index: 0 }]]
};
workflow.connections["Check Availability API"] = {
  main: [[{ node: "Format Availability Response", type: "main", index: 0 }]]
};
workflow.connections["Format Availability Response"] = {
  main: [[{ node: "Send Telegram Message", type: "main", index: 0 }]]
};

// Conectar flujo de confirmar
workflow.connections["Validate Confirm"] = {
  main: [[{ node: "Confirm Appointment API", type: "main", index: 0 }]]
};
workflow.connections["Confirm Appointment API"] = {
  main: [[{ node: "Format Confirm Response", type: "main", index: 0 }]]
};
workflow.connections["Format Confirm Response"] = {
  main: [[{ node: "Send Telegram Message", type: "main", index: 0 }]]
};

// Guardar workflow actualizado
console.log('💾 Guardando workflow actualizado...');
fs.writeFileSync(WORKFLOW_PATH, JSON.stringify(workflow, null, 2));

console.log('✅ Workflow actualizado exitosamente!');
console.log('📁 Archivo: ' + WORKFLOW_PATH);
console.log('');
console.log('🎯 Nuevos comandos agregados:');
console.log('  1. /doctores [especialidad] - Lista de doctores');
console.log('  2. /disponibilidad [doctor_id] [fecha] - Ver disponibilidad');
console.log('  3. /confirmar [cita_id] - Confirmar cita');
console.log('');
console.log('📋 Próximos pasos:');
console.log('  1. Reimportar el workflow en N8n');
console.log('  2. Configurar credenciales de Telegram');
console.log('  3. Activar el workflow');
console.log('  4. Probar los nuevos comandos');
