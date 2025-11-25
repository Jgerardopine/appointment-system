#!/usr/bin/env node

/**
 * FIX: Incorrect API endpoints in n8n workflow
 * Problem: URLs like /api/appointments/appointments (duplicated), wrong paths
 * Solution: Correct all API endpoints to match backend routes
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('🔍 Fixing API endpoints in n8n workflow...\n');

// Map of incorrect → correct endpoints
const endpointFixes = [
  {
    name: 'Create Appointment API',
    oldUrl: 'http://api-gateway:3000/api/appointments',
    newUrl: 'http://appointment-service:3001/appointments',
    description: 'POST /appointments - Create new appointment'
  },
  {
    name: 'Get Appointment API',
    oldPattern: /http:\/\/api-gateway:3000\/api\/appointments\/\{\{ \$json\.appointmentId \}\}/,
    newUrl: 'http://appointment-service:3001/appointments/{{ $json.appointmentId }}',
    description: 'GET /appointments/{id} - Get appointment by ID'
  },
  {
    name: 'Cancel Appointment API',
    oldPattern: /http:\/\/api-gateway:3000\/api\/appointments\/\{\{ \$json\.appointmentId \}\}/,
    newUrl: 'http://appointment-service:3001/appointments/{{ $json.appointmentId }}',
    description: 'DELETE /appointments/{id} - Cancel appointment'
  },
  {
    name: 'List Appointments API',
    oldPattern: /http:\/\/api-gateway:3000\/api\/appointments\?patient_id=\{\{ \$json\.userId \}\}/,
    newUrl: 'http://appointment-service:3001/appointments?patient_id={{ $json.userId }}',
    description: 'GET /appointments?patient_id={id} - List user appointments'
  },
  {
    name: 'List Doctores API',
    oldPattern: /http:\/\/api-gateway:3000\/api\/appointments\/doctors/,
    newUrl: 'http://appointment-service:3001/doctors',
    description: 'GET /doctors - List all doctors'
  },
  {
    name: 'Check Availability API',
    oldPattern: /http:\/\/api-gateway:3000\/api\/appointments\/appointments\/availability/,
    newUrl: 'http://appointment-service:3001/appointments/availability',
    description: 'GET /appointments/availability/{doctor_id}?date={date}'
  },
  {
    name: 'Confirm Appointment API',
    oldPattern: /http:\/\/api-gateway:3000\/api\/appointments\/appointments\/\{\{ \$json\.appointmentId \}\}\/confirm/,
    newUrl: 'http://appointment-service:3001/appointments/{{ $json.appointmentId }}/confirm',
    description: 'POST /appointments/{id}/confirm - Confirm appointment'
  }
];

let fixCount = 0;

// Fix each node
workflow.nodes.forEach(node => {
  if (node.type === 'n8n-nodes-base.httpRequest' && node.parameters && node.parameters.url) {
    const originalUrl = node.parameters.url;
    
    // Check all possible fixes
    for (const fix of endpointFixes) {
      let shouldUpdate = false;
      
      if (fix.oldUrl && originalUrl === fix.oldUrl) {
        shouldUpdate = true;
      } else if (fix.oldPattern && fix.oldPattern.test(originalUrl)) {
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        node.parameters.url = fix.newUrl;
        console.log(`✅ Fixed: ${node.name || node.id}`);
        console.log(`   Old: ${originalUrl}`);
        console.log(`   New: ${fix.newUrl}`);
        console.log(`   Description: ${fix.description}\n`);
        fixCount++;
        break;
      }
    }
  }
});

// Save the workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log(`\n✅ Fixed ${fixCount} API endpoints`);
console.log('✅ Workflow saved to:', workflowPath);

console.log('\n📋 CORRECTED ENDPOINTS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. POST   /appointments                          → Create appointment');
console.log('2. GET    /appointments/{id}                     → Get appointment');
console.log('3. DELETE /appointments/{id}                     → Cancel appointment');
console.log('4. GET    /appointments?patient_id={id}          → List appointments');
console.log('5. GET    /doctors                               → List doctors');
console.log('6. GET    /appointments/availability/{doctor_id} → Check availability');
console.log('7. POST   /appointments/{id}/confirm             → Confirm appointment');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📝 NEXT STEPS:');
console.log('1. git add .');
console.log('2. git commit -m "fix: Corrección de endpoints API en workflow n8n"');
console.log('3. git push origin main');
console.log('4. Reimportar workflow en n8n (http://localhost:5678)');
console.log('5. Probar: /agendar Dr. López 2025-11-26 10:00');

console.log('\n✅ API endpoints fixed!');
