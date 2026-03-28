## [undefined.1.0] — 2026-03-28

- fix: align release workflow with design-dojo pattern (add packages:write, bump input) (c6f02e7)
- docs: add ROADMAP.md (968aa99)
- feat: add Deno fmt config and reusable release pipeline (practices 001 & 005) (#6) (2e71ed2)
- ci: add PR lane event relay to centralized merge FSM (105ccf5)
- Merge pull request #4 from plures/copilot/integrate-state-docs-adp (60d693c)
- Address code review feedback: fix array tracking and remove dynamic imports (868f900)
- Add comprehensive documentation and examples for State-Docs and ADP (310e438)
- Fix YAML parsing and test integrated guardian functionality (06f742d)
- Add State-Docs and ADP modules with integration (dff726c)
- Initial plan (71eb017)
- Merge pull request #2 from plures/copilot/add-svelte5-xstate-support (4d66546)
- Add comprehensive SVELTE5-XSTATE.md summary document (7632c7c)
- Add VS Code extension scaffold with webview integration (660d1d9)
- Add drag-and-drop, tests, machine tools, and comprehensive docs (c77966a)
- Add Svelte 5 + XState integration with interactive canvas editor (c07fde4)
- Initial plan (d2b33c3)
- Fix lifecycle node drill-down from canvas to file mode (ddc167d)
- Consolidate key features section in self-managing canvas docs (5308f51)
- Fix canvas server interactive functionality and add troubleshooting docs (7041f77)
- Fix interactive functionality in self-managing canvas (e85ddde)
- Implement self-managing design canvas system (df49863)
- Add JSON Canvas compatibility and prepare for self-managing canvas (5fd0455)
- Add JSON Canvas compatibility and enhanced CLI (73104ed)
- Add Interactive Canvas Editor V2 with YAML editing (74d3280)
- Add Phase 2 summary documentation (f607192)
- Update roadmap for Phase 2 progress (91fe529)
- Add interactive canvas server (e3faf7f)
- Add Phase 3 demo documentation (0464e10)
- Update roadmap for Phase 3 progress (1a179d8)
- Add CI/CD and project templates (eb51362)
- Add unified CLI interface (049a22d)
- Complete Phase 1: Core MVP systems ready (b215f04)
- Add schema validation system (6b2c821)
- Add FSM manager with transition validation (039f90e)
- Add canvas examples and fixes (26812bf)
- Add canvas rendering engine (8fe2b35)
- Add .gitignore for output directory (dffeeb6)
- Update lifecycle for canvas development (0821f99)
- Optimize setup guide to meet file size constraints (40fa1c3)
- Implement comprehensive rules engine with invariants, chores, and constraints (2c5fdc2)
- Clean up test design file with corresponding test updates (2679436)
- Update documentation with setup instructions and mark completed roadmap items (72642a8)
- Fix Windows path separator issue in guardian and update lifecycle for comprehensive design phase (70770ec)
- Initial Code Canvas setup with docs and Windows compatibility fix (4ca7d4d)

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Repository Best Practices Compliance** (practices 001, 005)
  - Added `fmt`, `lint` configuration to `deno.json` with `deno fmt` / `deno lint` tasks (practice-001)
  - Formatted all Deno/TypeScript source files with `deno fmt` for consistent style
  - Added `.github/workflows/release.yml` calling the Plures reusable release pipeline (practice-005)
  - `deno task fmt` / `deno task fmt:check` / `deno task lint` convenience tasks

- **State-Docs and ADP Modules**- Dual support squared integration
  - `modules/state-docs/`: Reusable state documentation management module
    - Lifecycle FSM management with state transitions
    - Activity tracking and history
    - Validation rules configuration
    - Canvas-based design documentation support
  - `modules/adp/`: AI Development Pattern module for validation and guardrails
    - Guardian validation engine with activity-based file access control
    - FSM enforcement for state-aware development
    - Rules engine for invariants, chores, and constraints
    - Commit size validation and YAML syntax checking
  - `tools/integrated-guardian.ts`: Integration tool using both modules
    - Validate file changes against current activity
    - Show current activity and lifecycle states
    - Check if paths are allowed in current activity
    - CLI interface for all validation operations
  - `templates/project-with-modules/`: Template for projects with State-Docs + ADP
    - Pre-configured sot/ structure
    - Ready-to-use lifecycle and rules definitions
    - Integrated guardian CLI tasks
  - `sot/canvas/state-docs-adp-integration.canvas.yaml`: Visual integration architecture
  - Dual support pattern: Modules used internally by Code Canvas and offered to external projects

- **Self-Managing Design Canvas System** (`tools/self-managing-canvas-server.ts`)
  - Interactive architecture visualization with drill-down capability
  - Visual representation of Code Canvas application itself (meta-canvas)
  - Navigation stack for multi-level canvas exploration
  - File viewer integration for in-browser code inspection
  - VS Code integration for direct file editing from canvas
  - Team collaboration support for human-AI development

- **Architecture Canvas** (`sot/canvas/code-canvas-architecture.canvas.yaml`)
  - Complete visual map of Code Canvas application components
  - Self-referential design where canvas manages itself
  - Drill-down links to implementation files and sub-canvases

- **Interactive Canvas Editor** (`tools/canvas-server-v2.ts`, `tools/canvas-editor.html`)
  - Full drag-and-drop editing with grid snap (20px)
  - Create, edit, and delete nodes and edges via modals
  - Real-time YAML persistence with save functionality
  - Interactive node positioning with visual feedback
  - Side panel with node list and property editor
  - Raw YAML editor for advanced node configuration
  - Zoom controls (In/Out/Fit) and export to YAML
  - Server-side logging for debugging drag operations

- **JSON Canvas 1.0 Standard Compatibility** (`tools/jsoncanvas-compat.ts`, `tools/enhanced-canvas-renderer.ts`)
  - Full support for JSON Canvas node types (text, file, link, group)
  - Bi-directional YAML ↔ JSON Canvas conversion
  - Enhanced rendering with colors, edge positioning, and arrows
  - Auto-format detection and backward compatibility
  - Enhanced CLI v0.3.0 with unified canvas commands
  - Template-based HTML serving with SVG injection
  - REST API endpoints for canvas data management

- **Enhanced Canvas Server** (`tools/canvas-server.ts`)
  - Web-based live preview with auto-reload
  - Interactive node selection and highlighting
  - Hover tooltips with node details
  - Search and filter functionality
  - Pan/zoom controls and export options
  - Dark mode interface optimized for viewing
- **Enhanced CLI** - Added `canvas serve` subcommand
- **Canvas Server Documentation** (`docs/canvas-server.md`)
  - Complete usage guide
  - Interface overview and features
  - Development workflow examples
- **Unified CLI Interface** (`tools/cli.ts`)
  - Single `canvas` command for all operations
  - Subcommands: canvas, activity, validate, init
  - Intuitive command structure with help text
  - Better developer experience over separate tools
- **CI/CD Templates** (`templates/ci-cd/`)
  - GitHub Actions workflow with validation and artifact upload
  - GitLab CI pipeline configuration
  - Azure Pipelines configuration
  - Activity-based validation checks
- **Project Templates** (`templates/project/`)
  - Basic and full project templates
  - Easy initialization with `canvas init`
  - Pre-configured FSM and guardian rules
- **CLI Documentation** (`docs/cli-guide.md`)
  - Complete command reference
  - Usage examples and workflows
  - Quick reference table

### Fixed

- **Canvas Editor Template Replacement Bug**
  - Fixed `.replace()` vs `.replaceAll()` issue causing JavaScript syntax errors
  - Template variables now properly replaced in all occurrences
  - Resolved "Unexpected token '{'" errors that prevented script loading
- **Drag-and-Drop Functionality**
  - Fixed event listener attachment after SVG template injection
  - Removed object literal syntax that caused browser parsing issues
  - Simplified logging calls to avoid optional chaining compatibility problems
- **CLI Command Routing**
  - Fixed "canvas serve" command not routing to correct server
  - Corrected parseArgs import syntax issues
  - Fixed file path handling to prevent double-prepending directories

### Changed

- Migrated from `tools/canvas-server.ts` (read-only viewer) to `tools/canvas-server-v2.ts` (full editor)
- Replaced external JavaScript file with inlined script for better template compatibility
- Enhanced logging system with both browser console and server terminal output
- Updated CLI to route canvas commands to new interactive editor

## [0.2.0] - 2024-10-07 - Phase 1 Complete

### Added

- **FSM Transition Management System** (`tools/fsm-manager.ts`)
  - State transition validation with guard conditions
  - Transition history logging and rollback capability
  - CLI interface for activity management
  - Guard condition evaluation (file, git status, custom)
- **Comprehensive Schema Validation** (`tools/schema-validator.ts`)
  - YAML schema validation for all configuration files
  - Cross-platform file pattern matching
  - Detailed error reporting and validation summaries
  - Activity and history schema definitions
- **Canvas Rendering Engine** (`tools/canvas-renderer.ts`)
  - SVG generation from YAML canvas definitions
  - HTML wrapper with interactive features
  - Support for all node types (box, fsm, control, doc, database)
  - Edge rendering with different styles based on kind
  - Automatic layout with proper positioning and sizing
- **Unit Testing Suite** (`tests/guardian.test.ts`)
  - Comprehensive test coverage for all core systems
  - Integration tests for guardian, FSM, schema validation
  - Cross-platform compatibility testing
- **Enhanced CLI Commands**
  - `deno task fsm` - FSM state management
  - `deno task validate-config` - Configuration validation
  - `deno task test` - Run complete test suite
  - `deno task render-canvas` - Canvas rendering

### Changed

- Updated demo canvas with proper positioning coordinates
- Enhanced rules.yaml with output directory exclusion
- Fixed button node positioning in demo canvas
- Improved lifecycle.yaml to support all activity types
- Enhanced guardian with better error messages

### Phase 1 Completion

- ✅ Enhanced Guardian Validation with complex path matching
- ✅ FSM Transition Logic with guard conditions and history
- ✅ Configuration Management with schema validation
- ✅ Unit testing coverage for all core functionality
- ✅ Cross-platform Windows/Mac/Linux compatibility

## [0.1.0] - 2024-10-07

### Initial Release

- Initial project structure with FSM lifecycle system
- Comprehensive rules engine with three validation layers:
  - Invariants: Universal quality standards
  - Chores: Conditional requirements
  - Constraints: Activity-specific rules
- Cross-platform guardian validation system
- Git hook integration for pre-commit validation
- Complete documentation structure
- Windows compatibility improvements

### Infrastructure

- Deno 2+ runtime with TypeScript support
- YAML-based configuration architecture
- Schema validation for all configuration files
- Cross-platform path handling
