#!/usr/bin/env node
/**
 * XState Machine Manager Tool
 * Provides CLI commands to create, update, delete, and inspect XState machines
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MACHINES_DIR = path.join(__dirname, '../src/machines');

// Ensure machines directory exists
if (!fs.existsSync(MACHINES_DIR)) {
  fs.mkdirSync(MACHINES_DIR, { recursive: true });
}

const commands = {
  list: listMachines,
  create: createMachine,
  inspect: inspectMachine,
  delete: deleteMachine,
  help: showHelp,
};

function listMachines() {
  console.log('\n📋 Available XState Machines:\n');
  const files = fs.readdirSync(MACHINES_DIR).filter(f => f.endsWith('.js'));
  
  if (files.length === 0) {
    console.log('  No machines found.');
    return;
  }

  files.forEach(file => {
    const content = fs.readFileSync(path.join(MACHINES_DIR, file), 'utf-8');
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const id = idMatch ? idMatch[1] : 'unknown';
    console.log(`  ✓ ${file.replace('.js', '')} (id: ${id})`);
  });
  console.log('');
}

function createMachine(name, initialState = 'idle') {
  if (!name) {
    console.error('❌ Error: Machine name is required');
    console.log('Usage: node xstate-manager.js create <name> [initialState]');
    return;
  }

  const filename = `${name}Machine.js`;
  const filepath = path.join(MACHINES_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.error(`❌ Error: Machine "${name}" already exists`);
    return;
  }

  const template = `import { createMachine, assign } from 'xstate';

/**
 * ${name} Machine
 * Description: Add your machine description here
 */
export const ${name}Machine = createMachine({
  id: '${name}',
  initial: '${initialState}',
  context: {
    // Add your context properties here
  },
  states: {
    ${initialState}: {
      on: {
        // Add your transitions here
      },
    },
  },
});
`;

  fs.writeFileSync(filepath, template);
  console.log(`\n✅ Created new XState machine: ${filename}`);
  console.log(`   Location: ${filepath}\n`);
}

function inspectMachine(name) {
  if (!name) {
    console.error('❌ Error: Machine name is required');
    console.log('Usage: node xstate-manager.js inspect <name>');
    return;
  }

  const filename = `${name}Machine.js`;
  const filepath = path.join(MACHINES_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.error(`❌ Error: Machine "${name}" not found`);
    return;
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  
  // Extract machine details
  const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
  const initialMatch = content.match(/initial:\s*['"]([^'"]+)['"]/);
  const statesMatch = content.match(/states:\s*{([^}]+)}/s);

  console.log(`\n🔍 Machine: ${name}`);
  console.log(`   ID: ${idMatch ? idMatch[1] : 'unknown'}`);
  console.log(`   Initial State: ${initialMatch ? initialMatch[1] : 'unknown'}`);
  
  if (statesMatch) {
    const states = statesMatch[1].match(/(\w+):\s*{/g);
    if (states) {
      console.log(`   States: ${states.map(s => s.replace(':', '').trim()).join(', ')}`);
    }
  }
  
  console.log(`   File: ${filepath}\n`);
}

function deleteMachine(name) {
  if (!name) {
    console.error('❌ Error: Machine name is required');
    console.log('Usage: node xstate-manager.js delete <name>');
    return;
  }

  const filename = `${name}Machine.js`;
  const filepath = path.join(MACHINES_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.error(`❌ Error: Machine "${name}" not found`);
    return;
  }

  fs.unlinkSync(filepath);
  console.log(`\n✅ Deleted machine: ${filename}\n`);
}

function showHelp() {
  console.log(`
📦 XState Machine Manager

Usage: node xstate-manager.js <command> [options]

Commands:
  list                    List all available machines
  create <name> [state]   Create a new machine with optional initial state
  inspect <name>          Show details about a machine
  delete <name>           Delete a machine
  help                    Show this help message

Examples:
  node xstate-manager.js list
  node xstate-manager.js create userAuth loading
  node xstate-manager.js inspect lifecycle
  node xstate-manager.js delete oldMachine
`);
}

// Main CLI handler
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  showHelp();
  process.exit(command ? 1 : 0);
}

commands[command](...args);
