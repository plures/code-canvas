# Code Canvas Setup Guide

## Prerequisites

1. **Install Deno 2+**
   - Download from [deno.land](https://deno.land/)
   - Verify installation: `deno --version`

2. **Git Repository**
   - Ensure you're in a git repository
   - If not: `git init`

## Quick Setup

### 1. Install Git Hooks
```bash
deno task prepare-hooks
```
This installs the pre-commit hook that validates changes against your FSM lifecycle.

**Note for Initial Setup**: For the very first commit, you may need to use `git commit --no-verify` to bypass the guardian while establishing the baseline project structure.

### 2. Configure Your Activity
Edit `sot/state/activity.yaml` to set your current development phase:
```yaml
activity: design  # or 'implementation' or 'release'
actor: human
note: "Working on initial design"
since: "2025-10-07T21:20:17.776103Z"
```

### 3. Validate Setup
```bash
deno task validate
```

## Project Structure

```
code-canvas/
├── sot/                    # Single Source of Truth
│   ├── lifecycle.yaml      # FSM states and transitions
│   ├── rules.yaml          # Project rules and chores
│   ├── state/
│   │   ├── activity.yaml   # Current development activity
│   │   └── history.yaml    # Activity change history
│   ├── canvas/
│   │   └── *.canvas.yaml   # Visual design canvases
│   ├── instructions/
│   │   └── agent-contract.md # AI agent behavior rules
│   └── schemas/
│       ├── canvas.schema.yaml
│       └── lifecycle.schema.yaml
├── designs/                # Design documentation
├── tests/                 # Test specifications
├── tools/                 # Development tools
│   ├── guardian.ts        # Pre-commit validator
│   └── tasks.ts           # Utility tasks
├── docs/                  # Project documentation
└── .githooks/
    └── pre-commit         # Git hook script
```

## Development Workflow

### 1. Design Phase
- Edit files in `sot/`, `designs/`, `sot/canvas/`
- Create or update test specifications
- Commit changes (guardian validates against FSM)

### 2. Implementation Phase
- Switch activity: Update `sot/state/activity.yaml`
- Edit `src/` files (must also update `tests/`)
- Guardian enforces test-first development

### 3. Release Phase
- Update version in `package.json`
- Must also update `CHANGELOG.md`
- Guardian enforces release documentation

## Commands Reference

| Command | Description |
|---------|-------------|
| `deno task validate` | Validate staged changes against current activity |
| `deno task prepare-hooks` | Install git pre-commit hook |

## FSM States

### Design
- **Allowed paths**: `sot/**`, `designs/**`, `sot/canvas/**`, `instructions/**`
- **Required chores**: When designs change, must also update tests

### Implementation  
- **Allowed paths**: `src/**`, `tests/**`, `sot/**`, `storybook/**`
- **Required chores**: When src changes, must also update tests

### Release
- **Allowed paths**: `CHANGELOG.md`, `package.json`, `sot/**`
- **Required chores**: When package.json changes, must also update CHANGELOG.md

## Canvas Files

Canvas files (`sot/canvas/*.canvas.yaml`) define visual documentation with:

- **Nodes**: FSMs, controls, documents, boxes
- **Edges**: Relationships between components
- **References**: Links to actual files

Example:
```yaml
nodes:
  - id: app-fsm
    type: fsm
    label: App Lifecycle
    x: 100
    y: 60
    w: 240
    h: 160
    ref: "sot/lifecycle.yaml"

edges:
  - from: design-doc
    to: app-fsm
    label: guides
    kind: docs
```

## Troubleshooting

### Pre-commit Hook Issues
- **Windows**: Hooks should work without chmod, guardian handles this automatically
- **Permission errors**: Ensure git repository is properly initialized
- **Path issues**: Run commands from project root directory

### FSM Validation Failures
- Check current activity in `sot/state/activity.yaml`
- Verify file changes match allowed paths for current state
- Ensure required chores are completed (e.g., update tests when changing designs)

### Agent Contract Enforcement
- AI agents must respect current activity constraints
- See `sot/instructions/agent-contract.md` for behavior rules
- Agents should refuse work outside current FSM state

## Next Steps

1. Review the [MVP Roadmap](./mvp-roadmap.md)
2. Customize `sot/lifecycle.yaml` for your project needs
3. Create canvas files for your specific workflows
4. Set up continuous integration with the validation tools