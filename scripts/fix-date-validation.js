#!/usr/bin/env node

/**
 * FIX: Date validation in 'Validate Appointment' node
 * Problem: new Date('2025-11-26') is being parsed incorrectly causing false "past date" errors
 * Solution: Compare dates as strings in YYYY-MM-DD format instead of Date objects
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('🔍 Fixing date validation in Validate Appointment node...\n');

// Find the Validate Appointment node
const validateNode = workflow.nodes.find(node => node.id === 'validate-appointment');

if (!validateNode) {
  console.error('❌ ERROR: validate-appointment node not found!');
  process.exit(1);
}

console.log('✅ Found "Validate Appointment" node');

// New corrected validation code
const newJsCode = `// Validate appointment parameters
const params = $input.first().json.params;
const chatId = $input.first().json.chatId;
const userId = $input.first().json.userId;

if (!params.doctor || !params.date || !params.time) {
  return [{
    json: {
      valid: false,
      chatId: chatId,
      message: '❌ Formato incorrecto\\n\\nUsa: /agendar [Doctor] [Fecha] [Hora]\\n\\nEjemplo:\\n/agendar Dr. López 2025-11-26 10:00'
    }
  }];
}

// Validate date format YYYY-MM-DD
const dateRegex = /^\\d{4}-\\d{2}-\\d{2}$/;
if (!dateRegex.test(params.date)) {
  return [{
    json: {
      valid: false,
      chatId: chatId,
      message: '❌ Formato de fecha inválido. Usa YYYY-MM-DD (ej: 2025-11-26)'
    }
  }];
}

// Compare dates as strings (YYYY-MM-DD format allows direct string comparison)
const today = new Date();
const todayStr = today.getFullYear() + '-' + 
                 String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(today.getDate()).padStart(2, '0');

if (params.date < todayStr) {
  return [{
    json: {
      valid: false,
      chatId: chatId,
      message: '❌ No puedes agendar citas en fechas pasadas\\n\\nFecha de hoy: ' + todayStr + '\\nFecha ingresada: ' + params.date
    }
  }];
}

// Validate time format
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
if (!timeRegex.test(params.time)) {
  return [{
    json: {
      valid: false,
      chatId: chatId,
      message: '❌ Formato de hora inválido. Usa formato HH:MM (ej: 10:00)'
    }
  }];
}

return [{
  json: {
    valid: true,
    chatId: chatId,
    userId: userId,
    appointment: {
      patient_id: userId.toString(),
      doctor_id: 'doc_' + params.doctor.toLowerCase().replace(/[^a-z0-9]/g, ''),
      appointment_date: params.date,
      appointment_time: params.time + ':00',
      duration_minutes: 30,
      reason: 'Consulta general'
    }
  }
}];`;

// Update the node
validateNode.parameters.jsCode = newJsCode;

console.log('✅ Updated date validation logic');
console.log('   - Changed from Date object comparison to string comparison');
console.log('   - YYYY-MM-DD format allows direct string comparison (2025-11-26 > 2025-11-25)');
console.log('   - Today date is calculated correctly in YYYY-MM-DD format');
console.log('   - Error message now shows both today and input date for debugging\n');

// Save the workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('✅ Workflow saved to:', workflowPath);
console.log('\n📝 NEXT STEPS:');
console.log('1. git add .');
console.log('2. git commit -m "fix: Corrección de validación de fecha en /agendar"');
console.log('3. git push origin main');
console.log('4. Reimportar workflow en n8n (http://localhost:5678)');
console.log('5. Probar: /agendar Dr. López 2025-11-26 10:00');
console.log('\n✅ Date validation fixed!');
