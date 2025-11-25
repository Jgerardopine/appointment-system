#!/usr/bin/env node

/**
 * FIX: Check Availability API endpoint missing doctor_id parameter
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('🔍 Fixing Check Availability API endpoint...\n');

const availabilityNode = workflow.nodes.find(node => node.name === 'Check Availability API');

if (!availabilityNode) {
  console.error('❌ ERROR: Check Availability API node not found!');
  process.exit(1);
}

console.log('Current URL:', availabilityNode.parameters.url);

// Update the URL to include doctor_id and parameters
availabilityNode.parameters.url = '=http://appointment-service:3001/appointments/availability/{{ $json.doctorId }}?date={{ $json.date }}&duration_minutes=30';

console.log('New URL:', availabilityNode.parameters.url);

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Check Availability API endpoint fixed!');
console.log('✅ URL now includes: /availability/{doctorId}?date={date}&duration_minutes=30');
