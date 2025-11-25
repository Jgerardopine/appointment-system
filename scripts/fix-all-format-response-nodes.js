#!/usr/bin/env node

/**
 * FIX: All Format Response nodes accessing chatId incorrectly
 * Problem: Using previousData.chatId instead of accessing from correct node
 * Solution: Access chatId from the validation/router node that has it
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../n8n/workflows/telegram-bot-complete.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('🔍 Fixing all Format Response nodes...\n');

// Map of nodes that need fixing
const nodesToFix = [
  {
    name: 'Format Response',
    correctSource: 'Validate Appointment',
    description: 'Format response after Create Appointment API'
  },
  {
    name: 'Format Verify Response',
    correctSource: 'Validate Verify',
    description: 'Format response after Get Appointment API'
  },
  {
    name: 'Format Cancel Response',
    correctSource: 'Validate Cancel',
    description: 'Format response after Cancel Appointment API'
  },
  {
    name: 'Format List Response',
    correctSource: 'Command Router',
    description: 'Format response after List Appointments API'
  },
  {
    name: 'Format Confirm Response',
    correctSource: 'Validate Confirm',
    description: 'Format response after Confirm Appointment API'
  }
];

let fixCount = 0;

nodesToFix.forEach(nodeInfo => {
  const node = workflow.nodes.find(n => n.name === nodeInfo.name);
  
  if (!node || !node.parameters || !node.parameters.jsCode) {
    console.log(`⚠️  Warning: Node "${nodeInfo.name}" not found or has no jsCode`);
    return;
  }

  const originalCode = node.parameters.jsCode;
  
  // Check if it's using the old pattern
  if (originalCode.includes('previousData.chatId') || 
      originalCode.includes('$input.all()[0].json.chatId')) {
    
    // Replace with correct access pattern
    const newCode = originalCode
      .replace(
        /const previousData = \$input\.all\(\)\[0\]\.json;\s*const chatId = previousData\.chatId;/g,
        `const chatId = $('${nodeInfo.correctSource}').item.json.chatId;`
      )
      .replace(
        /const chatId = previousData\.chatId;/g,
        `const chatId = $('${nodeInfo.correctSource}').item.json.chatId;`
      )
      .replace(
        /const chatId = \$input\.all\(\)\[0\]\.json\.chatId;/g,
        `const chatId = $('${nodeInfo.correctSource}').item.json.chatId;`
      );
    
    node.parameters.jsCode = newCode;
    
    console.log(`✅ Fixed: ${nodeInfo.name}`);
    console.log(`   Source: ${nodeInfo.correctSource}`);
    console.log(`   Description: ${nodeInfo.description}\n`);
    
    fixCount++;
  } else {
    console.log(`ℹ️  Skipped: ${nodeInfo.name} (already correct or different pattern)\n`);
  }
});

// Save the workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log(`\n✅ Fixed ${fixCount} Format Response nodes`);
console.log('✅ Workflow saved to:', workflowPath);

console.log('\n📋 CORRECTED NODES:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Format Response          → chatId from Validate Appointment');
console.log('2. Format Verify Response   → chatId from Validate Verify');
console.log('3. Format Cancel Response   → chatId from Validate Cancel');
console.log('4. Format List Response     → chatId from Command Router');
console.log('5. Format Confirm Response  → chatId from Validate Confirm');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n📝 PATTERN USED:');
console.log('❌ INCORRECT: const chatId = previousData.chatId;');
console.log('✅ CORRECT:   const chatId = $(\'NodeName\').item.json.chatId;');

console.log('\n📝 NEXT STEPS:');
console.log('1. git add .');
console.log('2. git commit -m "fix: Corrección de acceso a chatId en todos los nodos Format Response"');
console.log('3. git push origin main');
console.log('4. Reimportar workflow en n8n (http://localhost:5678)');
console.log('5. Probar: /agendar Dr. López 2025-11-26 10:00');

console.log('\n✅ All Format Response nodes fixed!');
