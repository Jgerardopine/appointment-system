#!/usr/bin/env node

/**
 * Script para corregir el workflow de N8n con webhook de Telegram
 * Este script genera un workflow compatible con N8n 1.0+ usando Telegram Webhook
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');

const workflow = {
  "name": "Telegram Bot - Sistema de Citas Médicas",
  "nodes": [
    {
      "parameters": {
        "updates": ["message"]
      },
      "id": "telegram-trigger",
      "name": "Telegram Trigger",
      "type": "n8n-nodes-base.telegramTrigger",
      "typeVersion": 1.1,
      "position": [240, 500],
      "webhookId": "telegram-bot-webhook",
      "credentials": {
        "telegramApi": {
          "id": "telegram_credentials",
          "name": "Telegram Bot API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": `// Parse incoming Telegram message
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

return results;`
      },
      "id": "parse-message",
      "name": "Parse Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [440, 500]
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "start",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "start"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "doctores",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "doctores"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "disponibilidad",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "disponibilidad"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "agendar",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "agendar"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "verificar",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "verificar"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "cancelar",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "cancelar"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "confirmar",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "confirmar"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "mis_citas",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "mis_citas"
            },
            {
              "conditions": {
                "options": {"caseSensitive": false},
                "conditions": [
                  {
                    "leftValue": "={{ $json.command }}",
                    "rightValue": "ayuda",
                    "operator": {"type": "string", "operation": "equals"}
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "ayuda"
            }
          ]
        },
        "options": {}
      },
      "id": "command-router",
      "name": "Command Router",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [640, 500]
    },
    // Nodo: Format Welcome
    {
      "parameters": {
        "jsCode": `const firstName = $json.firstName || 'Usuario';

const message = \`¡Hola \${firstName}! 👋

Bienvenido al Sistema de Citas Médicas 🏥

📋 *Comandos disponibles:*

🩺 */doctores [especialidad]* - Ver doctores disponibles
📅 */disponibilidad [doctor_id] [fecha]* - Ver horarios disponibles
✅ */agendar [doctor] [fecha] [hora]* - Agendar nueva cita
🔍 */verificar [id_cita]* - Ver detalles de una cita
✅ */confirmar [id_cita]* - Confirmar una cita pendiente
❌ */cancelar [id_cita]* - Cancelar una cita
📋 */mis_citas* - Ver todas tus citas
❓ */ayuda* - Ver esta ayuda

*Ejemplos:*
\\\`/doctores Cardiología\\\`
\\\`/disponibilidad 1 2024-11-25\\\`
\\\`/agendar Dr. López 2024-11-25 10:00\\\`
\\\`/confirmar 123\\\`\`;

return {
  json: {
    chatId: $json.chatId,
    text: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🩺 Ver Doctores', callback_data: '/doctores' },
          { text: '📅 Mis Citas', callback_data: '/mis_citas' }
        ],
        [
          { text: '❓ Ayuda', callback_data: '/ayuda' }
        ]
      ]
    }
  }
};`
      },
      "id": "format-welcome",
      "name": "Format Welcome",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [840, 300]
    },
    // Nodo: Get Doctors API
    {
      "parameters": {
        "method": "GET",
        "url": "http://api-gateway:3000/api/appointments/doctors",
        "authentication": "none",
        "options": {}
      },
      "id": "get-doctors-api",
      "name": "Get Doctors API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [840, 400]
    },
    // Nodo: Format Doctors List
    {
      "parameters": {
        "jsCode": `const doctors = $json.data || [];
const specialty = $('Command Router').item.json.params.specialty;

let message = '';

if (doctors.length === 0) {
  message = '❌ No se encontraron doctores disponibles.';
} else {
  if (specialty) {
    message = \`🩺 *Doctores de \${specialty}:*\\n\\n\`;
  } else {
    message = '🩺 *Doctores Disponibles:*\\n\\n';
  }
  
  doctors.forEach(doctor => {
    message += \`📋 *\${doctor.name}*\\n\`;
    message += \`   👨‍⚕️ Especialidad: \${doctor.specialty}\\n\`;
    message += \`   📧 Email: \${doctor.email}\\n\`;
    message += \`   📞 Teléfono: \${doctor.phone}\\n\`;
    message += \`   🕐 Horario: \${doctor.availability.schedule}\\n\`;
    message += \`   ID: \${doctor.id}\\n\\n\`;
  });
  
  message += \`\\n💡 *Tip:* Usa */disponibilidad [doctor_id] [fecha]* para ver horarios\\nEjemplo: \\\`/disponibilidad 1 2024-11-25\\\`\`;
}

return {
  json: {
    chatId: $('Command Router').item.json.chatId,
    text: message,
    parse_mode: 'Markdown'
  }
};`
      },
      "id": "format-doctors-list",
      "name": "Format Doctors List",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1040, 400]
    },
    // Nodo: Get Availability API
    {
      "parameters": {
        "method": "GET",
        "url": "=http://api-gateway:3000/api/appointments/appointments/availability/{{ $json.params.doctorId }}?date={{ $json.params.date }}",
        "authentication": "none",
        "options": {}
      },
      "id": "get-availability-api",
      "name": "Get Availability API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [840, 520]
    },
    // Nodo: Format Availability
    {
      "parameters": {
        "jsCode": `const availability = $json;
const doctorId = $('Command Router').item.json.params.doctorId;
const date = $('Command Router').item.json.params.date;

let message = \`📅 *Disponibilidad para \${date}*\\n\\n\`;

if (availability.available_slots && availability.available_slots.length > 0) {
  message += '✅ *Horarios Disponibles:*\\n';
  availability.available_slots.forEach(slot => {
    message += \`   • \${slot}\\n\`;
  });
  message += \`\\n💡 Para agendar usa:\\n\\\`/agendar Doctor \${date} [hora]\\\`\`;
} else {
  message += '❌ No hay horarios disponibles para esta fecha.\\n';
  message += '💡 Intenta con otra fecha.';
}

return {
  json: {
    chatId: $('Command Router').item.json.chatId,
    text: message,
    parse_mode: 'Markdown'
  }
};`
      },
      "id": "format-availability",
      "name": "Format Availability",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1040, 520]
    },
    // Nodo: Telegram Response
    {
      "parameters": {
        "chatId": "={{ $json.chatId }}",
        "text": "={{ $json.text }}",
        "additionalFields": {
          "parse_mode": "={{ $json.parse_mode || 'Markdown' }}",
          "reply_markup": "={{ $json.reply_markup ? JSON.stringify($json.reply_markup) : '' }}"
        }
      },
      "id": "telegram-response",
      "name": "Telegram Response",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [1240, 500],
      "credentials": {
        "telegramApi": {
          "id": "telegram_credentials",
          "name": "Telegram Bot API"
        }
      }
    },
    // Nodo: Format Help
    {
      "parameters": {
        "jsCode": `const message = \`❓ *Ayuda - Sistema de Citas Médicas*

📋 *Comandos Disponibles:*

🩺 */doctores [especialidad]* 
   Ver lista de doctores disponibles
   Ejemplo: \\\`/doctores\\\` o \\\`/doctores Cardiología\\\`

📅 */disponibilidad [doctor_id] [fecha]*
   Ver horarios disponibles de un doctor
   Ejemplo: \\\`/disponibilidad 1 2024-11-25\\\`

✅ */agendar [doctor] [fecha] [hora]*
   Crear una nueva cita médica
   Ejemplo: \\\`/agendar Dr. López 2024-11-25 10:00\\\`

✅ */confirmar [id_cita]*
   Confirmar una cita pendiente
   Ejemplo: \\\`/confirmar 123\\\`

🔍 */verificar [id_cita]*
   Ver detalles de una cita
   Ejemplo: \\\`/verificar 123\\\`

❌ */cancelar [id_cita]*
   Cancelar una cita existente
   Ejemplo: \\\`/cancelar 123\\\`

📋 */mis_citas*
   Ver todas tus citas programadas

📅 *Formato de Fechas:* YYYY-MM-DD
🕐 *Formato de Horas:* HH:MM

💡 *Tips:*
• Las fechas deben ser futuras
• Verifica disponibilidad antes de agendar
• Confirma tus citas pendientes\`;

return {
  json: {
    chatId: $json.chatId,
    text: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🩺 Ver Doctores', callback_data: '/doctores' }
        ],
        [
          { text: '📅 Mis Citas', callback_data: '/mis_citas' }
        ],
        [
          { text: '🏠 Menú Principal', callback_data: '/start' }
        ]
      ]
    }
  }
};`
      },
      "id": "format-help",
      "name": "Format Help",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [840, 640]
    }
  ],
  "connections": {
    "Telegram Trigger": {
      "main": [[{ "node": "Parse Message", "type": "main", "index": 0 }]]
    },
    "Parse Message": {
      "main": [[{ "node": "Command Router", "type": "main", "index": 0 }]]
    },
    "Command Router": {
      "main": [
        [{ "node": "Format Welcome", "type": "main", "index": 0 }],
        [{ "node": "Get Doctors API", "type": "main", "index": 0 }],
        [{ "node": "Get Availability API", "type": "main", "index": 0 }],
        [], // agendar (placeholder)
        [], // verificar (placeholder)
        [], // cancelar (placeholder)
        [], // confirmar (placeholder)
        [], // mis_citas (placeholder)
        [{ "node": "Format Help", "type": "main", "index": 0 }]
      ]
    },
    "Format Welcome": {
      "main": [[{ "node": "Telegram Response", "type": "main", "index": 0 }]]
    },
    "Get Doctors API": {
      "main": [[{ "node": "Format Doctors List", "type": "main", "index": 0 }]]
    },
    "Format Doctors List": {
      "main": [[{ "node": "Telegram Response", "type": "main", "index": 0 }]]
    },
    "Get Availability API": {
      "main": [[{ "node": "Format Availability", "type": "main", "index": 0 }]]
    },
    "Format Availability": {
      "main": [[{ "node": "Telegram Response", "type": "main", "index": 0 }]]
    },
    "Format Help": {
      "main": [[{ "node": "Telegram Response", "type": "main", "index": 0 }]]
    }
  },
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [],
  "triggerCount": 1,
  "updatedAt": "2024-11-25T00:00:00.000Z",
  "versionId": "1"
};

// Write workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');

console.log('✅ Workflow corregido exitosamente');
console.log('📁 Archivo:', workflowPath);
console.log('\n🔧 Cambios realizados:');
console.log('   • webhookId cambiado a "telegram-bot-webhook"');
console.log('   • Comandos /doctores, /disponibilidad, /ayuda implementados');
console.log('   • Integración con APIs del backend');
console.log('\n📋 Siguiente paso:');
console.log('   1. Ir a N8n: http://localhost:5678');
console.log('   2. Eliminar el workflow anterior');
console.log('   3. Importar el nuevo workflow desde:');
console.log('      n8n/workflows/telegram-bot-complete.json');
console.log('   4. Configurar credenciales de Telegram');
console.log('   5. Activar el workflow');
console.log('   6. Probar con /start en Telegram');
