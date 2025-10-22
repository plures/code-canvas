# Svelte 5 + XState Integration Guide

This document explains how Code Canvas integrates Svelte 5 with XState v5 for building the interactive canvas editor.

## Overview

Code Canvas now includes a modern web application built with:
- **Svelte 5**: Latest version with runes-based reactivity
- **XState v5**: Finite state machines for robust state management
- **Vite**: Fast build tool with HMR

## Key Architectural Decisions

### 1. State Management with XState

We use XState for complex state management because:
- **Explicit States**: All states are clearly defined (idle, editing, creating)
- **Transitions**: State transitions are guarded and validated
- **Context**: Centralized data storage (canvas, selection, zoom)
- **Visualizable**: Machines can be visualized and debugged

### 2. Svelte 5 Runes

Svelte 5's runes provide fine-grained reactivity:

```javascript
// $state - reactive variables
let zoom = $state(1.0);

// $derived - computed values  
const nodes = $derived($snapshot?.context?.canvas?.nodes || []);

// $effect - side effects
$effect(() => {
  console.log('Nodes changed:', nodes.length);
});
```

### 3. XState Store Integration

The `@xstate/svelte` package provides seamless integration:

```javascript
const { snapshot, send } = useMachine(canvasEditorMachine);

// Access state reactively with $snapshot
const currentState = $derived($snapshot.value);
const data = $derived($snapshot.context);
```

## Machine Definitions

### Lifecycle Machine

Maps to `sot/lifecycle.yaml` and enforces:
- Design phase (docs, tests, canvas)
- Implementation phase (src, tests)
- Release phase (package.json, changelog)

```javascript
states: {
  design: {
    meta: { allowedPaths: [...], requiredChores: [...] },
    on: { TRANSITION_TO_IMPLEMENTATION: 'implementation' }
  },
  implementation: { ... },
  release: { ... }
}
```

### Canvas Editor Machine

Manages canvas operations:
- **idle**: Default state, can select/create
- **nodeSelected**: Node selected, can edit/delete/move
- **edgeSelected**: Edge selected, can edit/delete
- **creatingNode**: Creating new node
- **creatingEdge**: Creating new edge
- **editingNode**: Modal open for editing
- **editingEdge**: Modal open for editing

## Component Architecture

### App.svelte (Root)
- Displays header with lifecycle state badge
- Embeds CanvasEditor component
- Uses lifecycleMachine to show current phase

### CanvasEditor.svelte (Main Canvas)
- Uses canvasEditorMachine for state management
- Renders SVG canvas with nodes and edges
- Handles selection, creation, deletion
- Manages zoom and pan

### NodeEditor.svelte (Modal)
- Edit node properties (label, type, size)
- Sends UPDATE_NODE event to machine
- Uses Svelte 5 `$props()` for component props

### EdgeEditor.svelte (Modal)
- Edit edge properties (label, kind)
- Sends UPDATE_EDGE event to machine

## Reactivity Patterns

### Pattern 1: Derived State from Machine

```svelte
<script>
  const { snapshot, send } = useMachine(myMachine);
  
  // Reactive derivation from machine context
  const items = $derived($snapshot.context.items);
  const count = $derived(items.length);
</script>

<p>Count: {count}</p>
```

### Pattern 2: Effects with Machine State

```svelte
<script>
  $effect(() => {
    if ($snapshot.value === 'loading') {
      // Perform side effect when entering loading state
      fetchData();
    }
  });
</script>
```

### Pattern 3: Event Handlers

```svelte
<script>
  function handleClick() {
    send({ type: 'SELECT_NODE', nodeId: 'node-123' });
  }
</script>

<button onclick={handleClick}>Select Node</button>
```

## Self-Authoring Capabilities

The system supports self-authoring through:

### 1. Machine Manager CLI

```bash
# Create new machines dynamically
node xstate-manager.js create featureName initialState

# Inspect existing machines
node xstate-manager.js inspect canvasEditor

# List all machines
node xstate-manager.js list
```

### 2. Dynamic Machine Loading

Machines can be created and loaded at runtime:

```javascript
import { createMachine } from 'xstate';

// Dynamically create a machine
const dynamicMachine = createMachine({
  id: 'dynamic',
  initial: 'active',
  states: { active: {} }
});

// Use it like any other machine
const { snapshot, send } = useMachine(dynamicMachine);
```

### 3. Machine Composition

Machines can invoke other machines:

```javascript
states: {
  editing: {
    invoke: {
      id: 'editorMachine',
      src: editorMachine,
      onDone: { target: 'idle' }
    }
  }
}
```

## Integration with Existing Tools

### Deno Tools Compatibility

The Svelte app works alongside existing Deno tools:
- Deno tools validate YAML and FSM rules
- Svelte app provides visual interface
- Both share the same lifecycle concepts

### Guardian Integration

The lifecycle machine enforces rules similar to guardian:
- Allowed paths per state
- Required chores (tests must be updated)
- State transition guards

## VS Code Extension Path

The standalone web app is designed to be embeddable in VS Code:

1. **Webview Integration**: App runs in VS Code webview
2. **Message Passing**: postMessage for file operations
3. **Theme Support**: Respects VS Code theme
4. **File System**: Uses VS Code APIs for saving/loading

## Best Practices

### 1. Keep Machines Small
Each machine should manage one concern (canvas editing, lifecycle, etc.)

### 2. Use Context for Data
Store data in machine context, not component state:
```javascript
context: {
  canvas: { nodes: [], edges: [] },
  selectedNodeId: null
}
```

### 3. Use Assign for Updates
Always use `assign()` to update context:
```javascript
actions: assign({
  selectedNodeId: ({ event }) => event.nodeId
})
```

### 4. Guard Transitions
Validate state transitions with guards:
```javascript
guards: {
  canTransition: ({ context }) => context.isValid
}
```

## Debugging

### XState Inspector

Use XState Inspector to visualize and debug machines:

```javascript
import { inspect } from '@xstate/inspect';

inspect({ iframe: false });
```

### Console Logging

Add logging to understand state changes:

```javascript
$effect(() => {
  console.log('State:', $snapshot.value);
  console.log('Context:', $snapshot.context);
});
```

## Performance Considerations

### 1. Memoization
`$derived` automatically memoizes computed values

### 2. Selective Updates
XState only updates when context actually changes

### 3. Virtual Scrolling
For large canvases, implement virtual scrolling for nodes

## Testing Strategy

### Unit Tests
Test machines in isolation:
```javascript
import { expect, test } from 'vitest';
import { createActor } from 'xstate';

test('transitions to nodeSelected on SELECT_NODE', () => {
  const actor = createActor(canvasEditorMachine);
  actor.start();
  
  actor.send({ type: 'SELECT_NODE', nodeId: 'node-1' });
  
  expect(actor.getSnapshot().value).toBe('nodeSelected');
});
```

### Component Tests
Test Svelte components with Testing Library:
```javascript
import { render, fireEvent } from '@testing-library/svelte';

test('creates node on button click', async () => {
  const { getByText } = render(CanvasEditor);
  await fireEvent.click(getByText('Add Node'));
  // Assert node was created
});
```

## Future Enhancements

1. **Actor Model**: Use XState actors for parallel operations
2. **History States**: Implement undo/redo with history states
3. **Nested Machines**: Sub-canvases with nested machines
4. **Persistence**: Auto-save with machine snapshots
5. **Collaboration**: Multi-user with machine sync

## Resources

- [Svelte 5 Runes Documentation](https://svelte-5-preview.vercel.app/docs/runes)
- [XState v5 Documentation](https://stately.ai/docs/xstate)
- [@xstate/svelte Documentation](https://stately.ai/docs/xstate-svelte)
