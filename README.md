# 🎨 Code Canvas - Modern FSM Visual Editor

A modern, web-based visual editor for Finite State Machines (FSMs) built with **Svelte + SvelteKit** and powered by **Robot3** state machines. This project represents a complete refactor and modernization of canvas-based FSM editing capabilities.

![FSM Canvas Editor](https://img.shields.io/badge/Svelte-5.0%2B-ff3e00?style=for-the-badge&logo=svelte)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178c6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0%2B-646cff?style=for-the-badge&logo=vite)

## ✨ Features

### 🎯 **Core Editing (✅ Complete)**
- **Double-click node creation** - Click anywhere on canvas to add nodes
- **Inline label editing** - Double-click node labels to edit them  
- **Interactive edge creation** - Shift+drag between nodes to connect them
- **Visual feedback** - Dashed preview lines during edge creation
- **Node deletion** - X button on each node for easy removal

### 💾 **Persistence & Project Management (✅ Complete)**
- **Auto-save functionality** - Automatic saving every 2 seconds
- **Project manager UI** - Save, load, and delete multiple canvas projects
- **Export/Import JSON** - Full data portability for collaboration
- **Zero data loss** - Canvas state restored automatically on page refresh

### 🔧 **Technical Architecture**
- **Modern Component Design** - Clean Svelte component separation
- **Robot3 FSM Integration** - Functional state machine library
- **TypeScript Throughout** - Full type safety and IntelliSense
- **PluresDB Ready** - Database integration prepared for collaboration
- **Unum Numerical Processing** - Advanced mathematical operations support

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **pnpm**

### Installation
```bash
git clone https://github.com/plures/code-canvas.git
cd code-canvas
git checkout svelte-refactor
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to see the editor.

### Build
```bash
npm run build
npm run preview
```

## 🎮 Usage Guide

### **Creating Nodes**
1. **Double-click** anywhere on the canvas
2. New node appears at click location  
3. Node type adapts to current mode (Canvas/FSM)

### **Editing Node Labels**
1. **Double-click** on any node's text
2. Type your new label
3. Press **Enter** to save or **Escape** to cancel

### **Creating Connections**
1. Hold **Shift** key
2. **Click and drag** from source node to target node
3. Release on target node to create edge
4. Click empty space to cancel

### **Project Management**
1. Click **💾 Projects** button in header
2. **Save** - Type project name and save current canvas
3. **Load** - Click any saved project to restore it
4. **Export** - Download canvas as JSON file
5. **Import** - Paste JSON data to load external canvases

## 🏗️ Architecture

```
src/
├── lib/
│   ├── canvas/          # Canvas editing components
│   │   ├── CanvasEditor.svelte    # Main canvas interface
│   │   ├── NodeComponent.svelte   # Individual node rendering  
│   │   ├── EdgeRenderer.svelte    # Edge/connection rendering
│   │   └── ProjectManager.svelte  # Save/load UI
│   ├── fsm/             # FSM visualization components
│   │   └── FSMVisualizer.svelte   # Robot3 integration
│   ├── stores/          # Svelte reactive stores
│   │   ├── canvasStore.ts         # Canvas state management
│   │   └── fsmStore.ts            # FSM state management
│   ├── types/           # TypeScript definitions
│   │   ├── canvas.ts              # Canvas entity types
│   │   └── fsm.ts                 # FSM entity types
│   └── utils/           # Utility functions
│       └── persistence.ts         # LocalStorage operations
└── App.svelte           # Main application component
```

## 🛣️ Roadmap

### ✅ **Priority 1: Core Editing** (Complete)
- Interactive node creation and editing
- Local storage persistence with auto-save
- Project management with import/export

### 🔄 **Priority 2: FSM Integration** (Next)  
- FSM runtime execution with event triggering
- Current state highlighting and visualization  
- Step-by-step debugging capabilities
- Enhanced FSM editing with guards and actions

### 📋 **Priority 3: Advanced UX** (Planned)
- Multi-node selection and operations
- Canvas navigation (zoom, pan, fit-to-view)
- Undo/redo functionality  
- Keyboard shortcuts

### 🔧 **Priority 4: Professional Tools** (Future)
- Node drilling and hierarchical views
- Auto-layout algorithms  
- Grid snapping and alignment tools
- Advanced canvas manipulation

## 🏆 **Key Improvements Over Legacy**

This modern Svelte implementation replaces a **1600+ line monolithic Deno server** with:

- **Component-Based Architecture** - Clean separation of concerns
- **Modern Build Tools** - Vite for fast development and builds  
- **Type Safety** - Full TypeScript integration throughout
- **Reactive UI** - Svelte's efficient reactivity system
- **Professional UX** - Intuitive editing patterns and visual feedback
- **Zero Configuration** - Works out of the box with sensible defaults

## 🔗 Dependencies

### Core Framework
- **Svelte 5.0+** - Reactive component framework
- **SvelteKit** - Full-stack Svelte framework
- **Vite** - Next-generation build tool
- **TypeScript** - Type safety and enhanced DX

### FSM & Data Processing  
- **robot3** - Functional finite state machines
- **unum** - Numerical processing library
- **pluresdb** - Database integration (planned)

### Visualization
- **d3** - Data visualization and SVG manipulation
- **@types/d3** - TypeScript definitions for D3

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

This is an active development branch (`svelte-refactor`). Contributions welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

## 🌟 Acknowledgments

- Built with [Svelte](https://svelte.dev) and [Robot](https://thisrobot.life)
- Inspired by modern visual programming tools
- Part of the [Plures](https://github.com/plures) ecosystem

---

**🎯 Current Status**: Priority 1 Complete ✅ - Ready for FSM Runtime Implementation 🚀