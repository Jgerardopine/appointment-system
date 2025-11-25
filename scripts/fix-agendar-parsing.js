#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Encontrar el nodo Parse Message
const parseMessageNode = workflow.nodes.find(n => n.id === 'parse-message');

if (!parseMessageNode) {
  console.error('❌ No se encontró el nodo Parse Message');
  process.exit(1);
}

// Nuevo código JavaScript para Parse Message con parsing mejorado
const newJsCode = `// Parse incoming Telegram message
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
    if (command === 'agendar' && parts.length >= 3) {
      // Parse: /agendar Dr. Carlos López 2024-11-25 10:00
      // Identificar fecha (YYYY-MM-DD) y hora (HH:MM) al final
      const timeRegex = /^\\d{1,2}:\\d{2}$/;
      const dateRegex = /^\\d{4}-\\d{2}-\\d{2}$/;
      
      let time = '';
      let date = '';
      let doctorParts = [];
      
      // Iterar de atrás hacia adelante
      for (let i = parts.length - 1; i >= 1; i--) {
        if (!time && timeRegex.test(parts[i])) {
          time = parts[i];
        } else if (!date && dateRegex.test(parts[i])) {
          date = parts[i];
        } else {
          doctorParts.unshift(parts[i]);
        }
      }
      
      params = {
        doctor: doctorParts.join(' '),
        date: date,
        time: time
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

// Actualizar el código
parseMessageNode.parameters.jsCode = newJsCode;

// Guardar workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');

console.log('✅ Parsing de /agendar corregido exitosamente');
console.log('\n📋 Cambios realizados:');
console.log('   • Parsing mejorado para nombres de doctor con múltiples palabras');
console.log('   • Identificación de fecha (YYYY-MM-DD) y hora (HH:MM) al final');
console.log('   • Hora ahora es opcional (si no se proporciona, será vacío)');
console.log('\n💡 Ejemplos soportados:');
console.log('   /agendar Dr. López 2024-11-25 10:00  ✅');
console.log('   /agendar Dr. Carlos López 2024-11-25 10:00  ✅');
console.log('   /agendar Dr. María García 2024-11-25 14:30  ✅');
console.log('   /agendar Dr. López 2024-11-25  ⚠️  (sin hora, validación lo detectará)');
console.log('\n📁 Archivo modificado:', workflowPath);
