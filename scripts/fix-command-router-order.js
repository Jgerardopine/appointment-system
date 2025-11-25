#!/usr/bin/env node

/**
 * Script para corregir el orden de las conexiones del Command Router
 * El problema: las reglas y las conexiones no están alineadas
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Encontrar el nodo Command Router
const commandRouter = workflow.nodes.find(n => n.id === 'command-router');

if (!commandRouter) {
  console.error('❌ No se encontró el nodo Command Router');
  process.exit(1);
}

console.log('📋 Reglas actuales del Command Router:');
const rules = commandRouter.parameters.rules.values;
rules.forEach((rule, index) => {
  console.log(`  ${index}: ${rule.outputKey}`);
});

// El orden correcto debe ser:
const correctOrder = [
  'start',       // 0
  'agendar',     // 1
  'verificar',   // 2
  'cancelar',    // 3
  'mis_citas',   // 4
  'ayuda',       // 5
  'doctores',    // 6
  'disponibilidad', // 7
  'confirmar'    // 8
];

console.log('\n📋 Orden correcto esperado:');
correctOrder.forEach((key, index) => {
  console.log(`  ${index}: ${key}`);
});

// Reordenar las reglas
const reorderedRules = correctOrder.map(key => {
  const rule = rules.find(r => r.outputKey === key);
  if (!rule) {
    console.error(`❌ No se encontró la regla para: ${key}`);
  }
  return rule;
}).filter(Boolean);

commandRouter.parameters.rules.values = reorderedRules;

// Actualizar las conexiones del Command Router
const connections = workflow.connections['Command Router'];
const newConnections = [
  [{ node: 'Format Welcome', type: 'main', index: 0 }],              // 0: start
  [{ node: 'Validate Appointment', type: 'main', index: 0 }],        // 1: agendar
  [{ node: 'Validate Verify', type: 'main', index: 0 }],             // 2: verificar
  [{ node: 'Validate Cancel', type: 'main', index: 0 }],             // 3: cancelar
  [{ node: 'List Appointments API', type: 'main', index: 0 }],       // 4: mis_citas
  [{ node: 'Format Help', type: 'main', index: 0 }],                 // 5: ayuda
  [{ node: 'Validate Doctores', type: 'main', index: 0 }],           // 6: doctores
  [{ node: 'Validate Disponibilidad', type: 'main', index: 0 }],     // 7: disponibilidad
  [{ node: 'Validate Confirm', type: 'main', index: 0 }]             // 8: confirmar
];

workflow.connections['Command Router'].main = newConnections;

console.log('\n✅ Orden de conexiones corregido:');
newConnections.forEach((conn, index) => {
  console.log(`  ${index}: ${correctOrder[index]} → ${conn[0].node}`);
});

// Guardar workflow corregido
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');

console.log('\n✅ Workflow corregido exitosamente');
console.log('📁 Archivo:', workflowPath);
console.log('\n📋 Próximos pasos:');
console.log('   1. Reimportar workflow en N8n');
console.log('   2. Probar /doctores en Telegram');
console.log('   3. Verificar que vaya a "Validate Doctores"');
