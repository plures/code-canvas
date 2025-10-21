#!/usr/bin/env node
/**
 * YAML to XState Converter
 * Converts lifecycle.yaml FSM definitions to XState machine format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple YAML parser (basic implementation)
function parseYAML(content) {
  const lines = content.split('\n');
  const result = {};
  let currentKey = null;
  let currentArray = null;
  let indent = 0;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (match) {
      const [, spaces, key, value] = match;
      const lineIndent = spaces.length;

      if (value) {
        if (!result[key]) result[key] = value.startsWith('[') ? JSON.parse(value) : value;
      } else {
        currentKey = key;
        indent = lineIndent;
      }
    } else if (line.match(/^\s*-\s+/)) {
      const value = line.replace(/^\s*-\s+/, '').trim();
      if (!currentArray) currentArray = [];
      currentArray.push(value);
      if (currentKey && result[currentKey] === undefined) {
        result[currentKey] = currentArray;
      }
    }
  });

  return result;
}

function convertLifecycleToXState(yamlPath, outputPath) {
  console.log(`\n🔄 Converting ${yamlPath} to XState machine...\n`);

  const content = fs.readFileSync(yamlPath, 'utf-8');
  
  // Parse YAML manually (simplified)
  const lines = content.split('\n');
  let states = [];
  let transitions = [];
  let initial = 'design';
  let currentState = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('initial:')) {
      initial = trimmed.split(':')[1].trim();
    } else if (trimmed.startsWith('- id:')) {
      currentState = { id: trimmed.split(':')[1].trim(), allowedPaths: [], requiredChores: [] };
      states.push(currentState);
    } else if (trimmed.startsWith('label:') && currentState) {
      currentState.label = trimmed.split(':')[1].trim();
    } else if (trimmed.startsWith('- from:')) {
      const from = trimmed.split(':')[1].trim();
      transitions.push({ from });
    } else if (trimmed.startsWith('to:') && transitions.length > 0) {
      transitions[transitions.length - 1].to = trimmed.split(':')[1].trim();
    }
  });

  // Generate XState machine code
  const machineCode = `import { createMachine, assign } from 'xstate';

/**
 * Lifecycle Machine - Auto-generated from sot/lifecycle.yaml
 * 
 * States: ${states.map(s => s.id).join(', ')}
 */
export const lifecycleMachine = createMachine({
  id: 'lifecycle',
  initial: '${initial}',
  context: {
    currentActivity: '${initial}',
    actor: 'human',
    note: '',
    since: new Date().toISOString(),
    changedFiles: [],
  },
  states: {
${states.map(state => `    ${state.id}: {
      meta: {
        label: '${state.label || state.id}',
      },
      on: {
${transitions.filter(t => t.from === state.id).map(t => `        TRANSITION_TO_${t.to.toUpperCase()}: {
          target: '${t.to}',
        },`).join('\n')}
      },
    },`).join('\n')}
  },
});
`;

  fs.writeFileSync(outputPath, machineCode);
  console.log(`✅ Generated XState machine: ${outputPath}\n`);
  
  // Show preview
  console.log('Preview:');
  console.log(machineCode.split('\n').slice(0, 20).join('\n'));
  console.log('...\n');
}

function visualizeMachine(machinePath) {
  console.log(`\n🎨 Visualizing machine: ${machinePath}\n`);
  
  const content = fs.readFileSync(machinePath, 'utf-8');
  
  // Extract states
  const statesMatch = content.match(/states:\s*{([^}]+)}/gs);
  if (!statesMatch) {
    console.error('❌ Could not parse states from machine');
    return;
  }

  const stateMatches = content.matchAll(/(\w+):\s*{\s*(?:meta:\s*{[^}]*label:\s*['"]([^'"]+)['"])?/g);
  const states = Array.from(stateMatches).map(m => ({
    id: m[1],
    label: m[2] || m[1]
  }));

  const transitionMatches = content.matchAll(/(\w+):\s*{\s*target:\s*['"](\w+)['"]/g);
  const transitions = Array.from(transitionMatches).map(m => ({
    event: m[1],
    target: m[2]
  }));

  console.log('States:');
  states.forEach(s => {
    console.log(`  • ${s.id} - "${s.label}"`);
  });

  console.log('\nTransitions:');
  transitions.forEach(t => {
    console.log(`  ${t.event} → ${t.target}`);
  });

  console.log('');
}

// CLI
const [,, command, ...args] = process.argv;

const commands = {
  convert: () => {
    const yamlPath = args[0] || path.join(__dirname, '../sot/lifecycle.yaml');
    const outputPath = args[1] || path.join(__dirname, 'src/machines/lifecycleMachineGenerated.js');
    convertLifecycleToXState(yamlPath, outputPath);
  },
  visualize: () => {
    const machinePath = args[0] || path.join(__dirname, 'src/machines/lifecycleMachine.js');
    visualizeMachine(machinePath);
  },
  help: () => {
    console.log(`
🔧 YAML to XState Converter

Usage: node yaml-to-xstate.js <command> [options]

Commands:
  convert [yaml] [output]    Convert YAML FSM to XState machine
  visualize [machine]        Show machine structure
  help                       Show this help

Examples:
  node yaml-to-xstate.js convert ../sot/lifecycle.yaml
  node yaml-to-xstate.js visualize src/machines/lifecycleMachine.js
`);
  }
};

if (!command || !commands[command]) {
  commands.help();
  process.exit(command ? 1 : 0);
}

commands[command]();
