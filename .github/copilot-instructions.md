# AI Agent Instructions for Code Canvas

## Core Architecture

Code Canvas is an **FSM-controlled AI guardrails system** that enforces lifecycle-based development with strict file access patterns. The key insight: `sot/` (Single Source of Truth) contains small, focused documents that fit in AI context windows.

### Critical FSM Workflow

1. **Always check current activity**: Read `sot/state/activity.yaml` first - determines what files you can modify
2. **Respect lifecycle constraints**: `sot/lifecycle.yaml` defines allowed paths per state (design/implementation/release)  
3. **Honor required chores**: Changing designs→tests, src→tests, package.json→CHANGELOG.md are enforced
4. **Use guardian validation**: `deno task validate` before commits - catches rule violations early

### State Transitions

- **design**: Can modify docs, designs, canvas, tests, tools, README.md
- **implementation**: Can modify src, tests, sot, tools, docs, CHANGELOG.md (NOT README.md)
- **release**: Limited to CHANGELOG.md, package.json, sot

**Switch activities** in `sot/state/activity.yaml` when hitting path restrictions.

## Canvas System Architecture

### Dual Format Support
- **YAML Canvas** (`.canvas.yaml`): Native format with `w/h` properties and FSM refs
- **JSON Canvas** (`.canvas`): Industry standard with `width/height` properties for Obsidian interop

Key files:
- `tools/jsoncanvas-compat.ts`: Bi-directional conversion with property aliasing
- `tools/canvas-server-v2.ts`: Interactive editor with drag-and-drop (port 8082)
- `tools/enhanced-canvas-renderer.ts`: Multi-format SVG generation

### Canvas Node Types
```yaml
nodes:
  - type: fsm     # Links to sot/lifecycle.yaml
  - type: control # UI components with props
  - type: database # Data stores
  - type: doc     # Design references
  - type: text    # JSON Canvas text nodes
  - type: file    # JSON Canvas file attachments
  - type: group   # JSON Canvas containers
```

## Essential Commands

```bash
# FSM & Validation
deno task validate                    # Guardian pre-commit validation
deno run -A tools/guardian.ts        # Manual validation

# Canvas Operations  
deno run -A tools/canvas-server-v2.ts --file canvas.canvas --port 8080  # Interactive editor
deno run -A tools/enhanced-cli.ts render input.canvas                   # Auto-detect format
deno run -A tools/enhanced-cli.ts render --format json input.yaml       # Force conversion

# State Management
deno run -A tools/fsm-manager.ts     # Lifecycle utilities
```

## Guardian Rules Engine

Located in `sot/rules.yaml` with TypeScript validation in `tools/guardian.ts`:

- **File size limits**: Small docs (200 lines, 8000 chars), large docs (800 lines, 60000 chars)
- **Commit size limits**: Max 2500 additions, 25 files per commit  
- **YAML syntax validation**: All .yaml files must parse correctly
- **Required chores**: Design changes → test updates, src changes → test updates

## Property Aliasing Pattern

Critical for JSON Canvas compatibility - always use fallback chains:
```typescript
const width = node.w || node.width || 120;
const height = node.h || node.height || 60;
const fromNode = edge.from || edge.fromNode;
```

## File Organization Conventions

- `sot/`: Single source of truth - keep documents small and focused
- `tools/`: Deno CLI utilities with `-A` permissions
- `tests/`: Markdown-based test specifications following Given/When/Then pattern
- `docs/`: User documentation (allowed in design state)
- `.githooks/pre-commit`: Installed via `deno task prepare-hooks`

## Development Patterns

1. **Start with activity check**: Verify current state allows your intended changes
2. **Design-first workflow**: Create canvas diagrams before implementation
3. **Tests-as-documentation**: Write markdown tests showing expected behavior
4. **Small commits**: Guardian enforces reasonable commit sizes
5. **State-aware development**: Switch activities rather than fighting path restrictions

## Canvas-FSM Integration

Canvas nodes can reference FSM states via `ref: "sot/lifecycle.yaml"` - this creates visual representations of project lifecycle that stay synchronized with actual state machine definitions.