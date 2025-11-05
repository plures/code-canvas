# Project Template with State-Docs and ADP

This template includes both State-Docs and ADP modules for FSM-controlled AI-assisted development.

## Features

- **State-Docs**: Manage project state and lifecycle
- **ADP**: Automated validation and guardrails
- **Pre-commit Hook**: Guardian validates changes automatically
- **Canvas Support**: Visual design documentation

## Structure

```
my-project/
├── sot/                      # Single Source of Truth
│   ├── lifecycle.yaml        # FSM state definitions
│   ├── rules.yaml            # Validation rules
│   ├── state/
│   │   ├── activity.yaml     # Current activity
│   │   └── history.yaml      # Activity history
│   └── canvas/
│       └── *.canvas.yaml     # Design documents
├── src/                      # Source code
├── tests/                    # Tests
├── docs/                     # Documentation
├── .githooks/
│   └── pre-commit            # Guardian hook
└── deno.json                 # Deno configuration
```

## Getting Started

1. Install Deno 2+
2. Install pre-commit hook:
   ```bash
   deno task prepare-hooks
   ```
3. Check current activity:
   ```bash
   deno task activity
   ```
4. Start developing!

## Available Commands

```bash
# Validation
deno task validate              # Validate current changes
deno task activity              # Show current activity
deno task lifecycle             # Show lifecycle states

# Canvas
deno task canvas                # Render canvas
deno task canvas-server         # Start canvas server

# FSM Management
deno task fsm                   # FSM manager CLI
```

## Workflow

1. Check current activity: `deno task activity`
2. Make changes within allowed paths
3. Commit - guardian validates automatically
4. If validation fails, fix issues and retry

## Integration

### State-Docs

Manages project state:
- Lifecycle definitions in `sot/lifecycle.yaml`
- Activity tracking in `sot/state/`
- Canvas designs in `sot/canvas/`

### ADP

Enforces validation:
- Activity-based file access control
- Required chores enforcement
- Project invariants checking
- Commit size limits

## Configuration

### Lifecycle States

Edit `sot/lifecycle.yaml` to define states:

```yaml
states:
  - id: design
    allowedPaths:
      - "sot/**"
      - "designs/**"
      - "tests/**"
    requiredChores:
      - whenAnyMatches: ["designs/**"]
        mustAlsoChange: ["tests/**"]
```

### Validation Rules

Edit `sot/rules.yaml` to customize rules:

```yaml
invariants:
  - id: small_docs
    description: Keep docs small
    check:
      type: file_size
      patterns: ["docs/**/*.md"]
      max_lines: 200
      max_chars: 8000
```

## License

ISC
