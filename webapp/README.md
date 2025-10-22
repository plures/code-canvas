# Code Canvas - Svelte 5 + XState Web Application

Modern canvas editor built with **Svelte 5** (with runes) and **XState v5** for robust state management.

## Features

✨ **Svelte 5 Runes** - Leverages Svelte 5's new reactivity system with `$state`, `$derived`, and `$effect`  
🤖 **XState v5 FSM** - State machines for canvas editor and lifecycle management  
🎨 **Interactive Canvas** - Drag, select, create, and edit nodes and edges  
🔧 **Machine Manager** - CLI tool to create, inspect, and manage XState machines  
📦 **Standalone** - Works as a standalone web app (VS Code extension support planned)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit http://localhost:5173 to see the canvas editor.

## Architecture

### XState Machines

- **lifecycleMachine** - Manages project lifecycle (design → implementation → release)
- **canvasEditorMachine** - Manages canvas operations (idle, editing, creating nodes/edges)

### Components

- **App.svelte** - Main application with lifecycle indicator
- **CanvasEditor.svelte** - Interactive canvas with SVG rendering
- **NodeEditor.svelte** - Modal for editing node properties
- **EdgeEditor.svelte** - Modal for editing edge properties

## XState Machine Manager

Manage XState machines with the CLI tool:

```bash
# List all machines
node xstate-manager.js list

# Create a new machine
node xstate-manager.js create myFeature idle

# Inspect a machine
node xstate-manager.js inspect lifecycle

# Delete a machine
node xstate-manager.js delete oldMachine
```

## Svelte 5 Features Used

### Runes
- `$state` - Reactive state variables
- `$derived` - Computed values
- `$effect` - Side effects and lifecycle

### Store Integration
- XState machines are integrated as Svelte stores
- Use `$snapshot` to access machine state reactively

## Development

### Project Structure

```
webapp/
├── src/
│   ├── components/      # Svelte components
│   ├── machines/        # XState state machines
│   ├── lib/            # Utility functions
│   ├── App.svelte      # Root component
│   └── main.js         # Entry point
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── svelte.config.js    # Svelte 5 config (runes enabled)
└── xstate-manager.js   # Machine management CLI
```

### Adding a New Machine

1. Create machine with CLI: `node xstate-manager.js create myMachine`
2. Edit the generated file in `src/machines/myMachineMachine.js`
3. Import and use in your component with `useMachine(myMachineMachine)`

### Example: Using XState in Svelte 5

```svelte
<script>
  import { useMachine } from '@xstate/svelte';
  import { myMachine } from './machines/myMachine.js';

  const { snapshot, send } = useMachine(myMachine);
  
  // Access state using store subscription
  const currentState = $derived($snapshot.value);
  const data = $derived($snapshot.context.data);
  
  function handleAction() {
    send({ type: 'MY_EVENT' });
  }
</script>

<button onclick={handleAction}>
  State: {currentState}
</button>
```

## Future Enhancements

- [ ] VS Code extension integration
- [ ] File system persistence (save/load canvas files)
- [ ] Real-time collaboration
- [ ] More node types (group, link, file)
- [ ] Advanced edge routing
- [ ] Undo/redo with XState history
- [ ] Export to various formats (PNG, SVG, JSON)

## Technologies

- **Svelte 5** - UI framework with runes
- **XState 5** - State machine library
- **Vite** - Build tool
- **@xstate/svelte** - XState-Svelte integration

## License

ISC
