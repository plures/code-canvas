# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Canvas rendering engine (`tools/canvas-renderer.ts`)
  - SVG generation from YAML canvas definitions
  - HTML wrapper with interactive features
  - Support for all node types (box, fsm, control, doc, database)
  - Edge rendering with different styles based on kind
  - Automatic layout with proper positioning and sizing
- Canvas rendering documentation (`docs/canvas-rendering.md`)
- New render-canvas task in `deno.json`
- Authentication flow example canvas (`sot/canvas/auth-example.canvas.yaml`)
- Git ignore file for output directory

### Changed

- Updated demo canvas with proper positioning coordinates
- Enhanced rules.yaml with output directory exclusion
- Fixed button node positioning in demo canvas

### Technical Details

- Canvas renderer uses SVG for scalable vector graphics
- HTML wrapper provides interactivity and styling
- Supports custom colors, sizes, and positioning
- Generates both standalone SVG and embedded HTML output
- Output directory structure: `output/{canvas-name}/`

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
