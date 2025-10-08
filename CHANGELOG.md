# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
