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

## 🚀 **Phase 2: Canvas & Visualization**

- [x] **Interactive Canvas Viewer** - Web-based server with live preview, zoom, search
- [ ] **Canvas Editor** - In-browser YAML editor with real-time validation  
- [ ] **Drag-and-Drop** - Visual node positioning and layout tools

## 🔧 **Phase 3: Developer Experience**

- [x] **CLI Enhancement** - Unified `canvas` command with intuitive subcommands
- [x] **CI/CD Integration** - GitHub Actions, GitLab CI, Azure Pipelines templates  
- [x] **Project Templates** - Quick start templates for new projects
- [ ] **VS Code Extension** - Syntax highlighting, canvas preview, FSM visualization
- [ ] **Auto-fix Validator** - Smart fixes for common validation issues

## 🤖 **Phase 4: AI Agent Integration**

- [ ] **Agent Logging System** - JSONL logging, run tracing, behavior analytics
- [ ] **Smart Assistance** - Auto-suggest chores, transition recommendations

## 🎯 **Current Status**

✅ **Phase 1 Complete** - Full FSM lifecycle management with validation systems
✅ **Phase 3 Partial** - CLI enhancement & CI/CD templates ready
✅ **Phase 2 Partial** - Interactive canvas server with live preview
🎯 **Next Phase** - Complete Phase 2 (YAML editor) or Phase 3 (VS Code extension)
