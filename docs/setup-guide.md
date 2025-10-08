# Code Canvas Quick Start

## Prerequisites
- Install Deno 2+ from [deno.land](https://deno.land/)
- Ensure you're in a git repository (`git init` if needed)

## Setup Steps

1. **Install Git Hooks**
   ```bash
   deno task prepare-hooks
   ```

2. **Configure Activity** - Edit `sot/state/activity.yaml`:
   ```yaml
   activity: design  # design, implementation, or release
   actor: human
   ```

3. **Validate Setup**
   ```bash
   deno task validate
   ```

## Development Workflow

**Design Phase**: Edit `sot/`, `designs/`, `docs/`, `tests/` - plan and document

**Implementation Phase**: Switch activity, edit `src/` + `tests/` - code with tests

**Release Phase**: Update `package.json` + `CHANGELOG.md` - prepare releases

## FSM States & Rules

| Activity | Allowed Paths | Required Chores |
|----------|---------------|-----------------|
| design | `sot/**`, `designs/**`, `docs/**`, `tests/**` | Design changes → update tests |
| implementation | `src/**`, `tests/**`, `sot/**` | Code changes → update tests |
| release | `CHANGELOG.md`, `package.json`, `sot/**` | Version bump → update changelog |

## Canvas Files

Create visual documentation in `sot/canvas/*.yaml`:
```yaml
nodes:
  - id: app-fsm
    type: fsm
    x: 100
    y: 60
    ref: "sot/lifecycle.yaml"
edges:
  - from: design-doc
    to: app-fsm
    kind: guides
```

## Commands
- `deno task validate` - Validate changes against FSM and rules
- `deno task prepare-hooks` - Install pre-commit validation

## Documentation
- [Rules Engine](./rules-engine.md) - Invariants, chores, constraints
- [MVP Roadmap](./mvp-roadmap.md) - Development roadmap

## Troubleshooting
- **Hook issues**: Ensure git repo root, Windows chmod handled automatically
- **FSM failures**: Check activity in `sot/state/activity.yaml`, complete required chores
- **First commit**: Use `git commit --no-verify` for initial project setup