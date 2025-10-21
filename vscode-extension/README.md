# Code Canvas VS Code Extension

VS Code extension that embeds the Svelte 5 + XState canvas editor as a webview.

## Features

- 📝 Open `.canvas` and `.yaml` files in visual editor
- 🎨 Interactive canvas with drag-and-drop
- 🤖 Create XState machines from command palette
- 👀 Visualize existing machines
- 💾 Save/load directly to workspace files

## Installation

### Development

1. Build the webapp:
```bash
cd ../webapp
npm install
npm run build
```

2. Open this folder in VS Code

3. Press F5 to start debugging

### Publishing

```bash
npm install
npm run package
```

This creates a `.vsix` file that can be installed in VS Code.

## Commands

- `Code Canvas: Open Editor` - Open canvas editor for current file
- `Code Canvas: Create XState Machine` - Create new machine file
- `Code Canvas: Visualize XState Machine` - Visualize machine in canvas

## Usage

### Opening Canvas Files

1. Right-click on a `.canvas` or `.yaml` file
2. Select "Open Canvas Editor"
3. Edit visually in the webview

### Creating Machines

1. Open command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Code Canvas: Create XState Machine"
3. Enter machine name and initial state
4. File is created and opened

### Editing Machines

1. Open a machine file (`.js`)
2. Command palette → "Code Canvas: Visualize XState Machine"
3. Edit visually in canvas

## Architecture

```
vscode-extension/
├── extension.js       # Main extension code
├── package.json       # Extension manifest
└── README.md          # This file

Integration with:
../webapp/dist/        # Built Svelte app (embedded in webview)
```

## Configuration

Settings available in VS Code preferences:

- `codeCanvas.gridSize` - Grid snap size (default: 20)
- `codeCanvas.autoSave` - Auto-save on changes (default: true)

## Development

### File Structure

```javascript
// extension.js provides:
- activate() - Extension activation
- openEditor command - Opens webview with canvas
- createMachine command - Scaffolds new machine
- visualizeMachine command - Shows machine in canvas
- Message handling - Bidirectional communication

// Webview ↔ Extension communication:
webview.postMessage({ type: 'save', canvas: {...} })
webview.postMessage({ type: 'load', path: '...' })
```

### Testing

1. Build webapp: `cd ../webapp && npm run build`
2. Press F5 in VS Code to start extension host
3. Test commands in the extension development host

## Roadmap

- [x] Extension scaffold
- [x] Webview integration
- [x] Create machine command
- [ ] File system integration (save/load)
- [ ] Machine visualization
- [ ] Live preview for machine files
- [ ] Syntax highlighting for canvas YAML
- [ ] IntelliSense for XState definitions

## Technical Details

### Webview Integration

The extension embeds the production build of the Svelte webapp in a VS Code webview. Resource URIs are rewritten to use the `webview://` protocol.

### Message Passing

```javascript
// Extension → Webview
panel.webview.postMessage({ type: 'loadCanvas', data: {...} });

// Webview → Extension  
panel.webview.onDidReceiveMessage(msg => {
  if (msg.type === 'save') {
    fs.writeFileSync(msg.path, JSON.stringify(msg.canvas));
  }
});
```

### File System Bridge

The extension acts as a bridge between the webapp (no file access) and VS Code's file system API.

## Contributing

1. Make changes to webapp or extension
2. Test with F5 debugging
3. Build: `npm run build`
4. Package: `npm run package`

## License

ISC
