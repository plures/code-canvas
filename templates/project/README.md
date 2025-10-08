# Project Templates

This directory contains templates for quickly initializing new Code Canvas projects.

## Basic Template

The `basic/` template includes:

- Minimal FSM lifecycle configuration
- Essential guardian rules
- Sample canvas files
- Setup documentation

## Full Template

The `full/` template includes everything in basic plus:

- Extended FSM with custom states
- Advanced guardian rules
- Multiple canvas examples
- CI/CD integration
- VS Code workspace settings

## Usage

### Option 1: CLI Init (Recommended)

```bash
deno task canvas init --name my-project
```

### Option 2: Manual Copy

```bash
# Copy template
cp -r templates/project/basic/* /path/to/new/project/

# Customize
cd /path/to/new/project
vim sot/state/activity.yaml
vim sot/rules.yaml

# Install hooks
deno task prepare-hooks
```

## Template Structure

```text
templates/project/basic/
├── sot/
│   ├── lifecycle.yaml       # FSM configuration
│   ├── rules.yaml           # Guardian rules
│   ├── state/
│   │   ├── activity.yaml    # Current state
│   │   └── history.yaml     # Transition log
│   ├── canvas/
│   │   └── example.canvas.yaml
│   └── schemas/
│       ├── activity.schema.yaml
│       └── history.schema.yaml
├── docs/
│   └── setup-guide.md
└── .githooks/
    └── pre-commit
```

## Customization

After initialization:

1. **Edit `sot/lifecycle.yaml`** - Add custom activities or modify transitions
2. **Edit `sot/rules.yaml`** - Adjust file size limits, path patterns, chore requirements
3. **Edit `sot/state/activity.yaml`** - Set initial activity
4. **Add canvas files** - Create visual documentation in `sot/canvas/`

## Next Steps

1. Run `deno task prepare-hooks` to install validation
2. Run `deno task canvas activity status` to verify setup
3. Run `deno task test` to ensure everything works
4. Start building!
