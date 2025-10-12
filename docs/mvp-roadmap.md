# Code Canvas MVP Roadmap

## 📋 Project Overview
**Code Canvas** is an AI Guardrails Kit with FSM-controlled project lifecycle enforcement, YAML-based visual design documentation, and pre-commit validation.

## ✅ **Phase 1: Core Validation & FSM (Complete)**

- [x] **Enhanced Guardian Validation** - Complex path matching, better error messages, YAML schema validation  
- [x] **FSM Transition Logic** - Guard conditions, transition history, rollback capability
- [x] **Configuration Management** - Schema validation, CLI commands, comprehensive testing

### Key Deliverables
- FSM manager with transition validation (`tools/fsm-manager.ts`)
- Schema validator for all YAML files (`tools/schema-validator.ts`) 
- Canvas rendering engine with SVG/HTML output (`tools/canvas-renderer.ts`)
- Unit test suite with cross-platform compatibility (`tests/guardian.test.ts`)
- Enhanced CLI: `fsm`, `validate-config`, `render-canvas`, `test`

## ✅ **Phase 2: Canvas & Visualization (Complete)**

- [x] **Interactive Canvas Viewer** - Web-based server with live preview, zoom, search
- [x] **Canvas Editor** - In-browser YAML editor with real-time validation  
- [x] **Drag-and-Drop** - Visual node positioning and layout tools

### Phase 2 Deliverables

- Interactive Canvas Editor V2 with full drag-and-drop editing (`tools/canvas-editor.html`)
- Enhanced canvas server with REST API for persistence (`tools/canvas-server-v2.ts`)
- Side panel YAML editor for advanced node configuration
- Grid-based positioning with 20px snap, modal-based creation/editing
- Real-time canvas updates with server-side logging

## 🔧 **Phase 3: Developer Experience**

- [x] **CLI Enhancement** - Unified `canvas` command with intuitive subcommands
- [x] **JSON Canvas Compatibility** - Full JSON Canvas 1.0 standard support with bi-directional conversion
- [x] **Enhanced Rendering** - Support for text/file/link/group nodes, colors, edge positioning  
- [x] **CI/CD Integration** - GitHub Actions, GitLab CI, Azure Pipelines templates  
- [x] **Project Templates** - Quick start templates for new projects
- [ ] **VS Code Extension** - Syntax highlighting, canvas preview, FSM visualization
- [ ] **Auto-fix Validator** - Smart fixes for common validation issues

## 🤖 **Phase 4: AI Agent Integration**

- [ ] **Agent Logging System** - JSONL logging, run tracing, behavior analytics
- [ ] **Smart Assistance** - Auto-suggest chores, transition recommendations

### Phase 3 Deliverables

- Enhanced CLI v0.3.0 with JSON Canvas support (`tools/cli-enhanced.ts`)
- JSON Canvas compatibility layer with bi-directional conversion (`tools/jsoncanvas-compat.ts`)
- Advanced canvas renderer supporting all JSON Canvas 1.0 features (`tools/enhanced-canvas-renderer.ts`)
- Extended schema supporting both Code Canvas and JSON Canvas formats (`sot/schemas/jsoncanvas.schema.yaml`)
- Demo files showcasing complete JSON Canvas standard compliance (`sot/canvas/jsoncanvas-demo.canvas.yaml`)

## 🎯 **Current Status**

✅ **Phase 1 Complete** - Full FSM lifecycle management with validation systems  
✅ **Phase 2 Complete** - Interactive canvas editor with drag-and-drop and YAML editing  
✅ **Phase 3 Major Progress** - CLI enhancement & JSON Canvas compatibility complete, VS Code extension pending  
🎯 **Next Priority** - Complete Phase 3 (VS Code extension) or begin Phase 4 (AI agent logging)
