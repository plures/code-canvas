# ADP - AI Development Pattern

A reusable module for AI-assisted development workflows with validation and guardrails.

## Purpose

ADP (AI Development Pattern) provides automated validation, workflow enforcement, and guardrails for AI-assisted software development projects. It integrates with State-Docs to enforce lifecycle-based development patterns.

## Features

- **Pre-commit Validation**: Guardian system that validates changes before commit
- **FSM Enforcement**: Ensures file changes respect current activity state
- **Rules Engine**: Validates invariants, chores, and constraints
- **Workflow Automation**: Automates common development tasks
- **AI Guardrails**: Prevents AI agents from making invalid changes

## Structure

```
adp/
  guardian/
    validator.ts          # Core validation logic
    rules-engine.ts       # Rules evaluation
    hooks/                # Git hooks integration
  workflows/
    fsm-manager.ts        # FSM lifecycle management
    automation.ts         # Workflow automation
  templates/
    pre-commit            # Pre-commit hook template
    agent-contract.md     # AI agent contract template
```

## Usage

### As Pre-commit Hook

```bash
# Install ADP guardian
deno run -A modules/adp/install.ts

# Validates on commit
git commit -m "Add feature"
# → ADP validates changes against current activity
```

### Programmatic Usage

```typescript
import { Guardian } from "./modules/adp/mod.ts";
import { StateDocsManager } from "./modules/state-docs/mod.ts";

const stateManager = new StateDocsManager("./sot");
const guardian = new Guardian(stateManager);

// Validate changes
const result = await guardian.validate(["src/app.ts", "tests/app.test.ts"]);
if (!result.valid) {
  console.error("Validation failed:", result.errors);
}
```

### Integration in Code Canvas

ADP is integrated into Code Canvas to enforce FSM-controlled development:

- Validates file access based on current activity
- Enforces required chores (e.g., tests with src changes)
- Checks file size limits
- Validates YAML syntax

## Components

### Guardian

Core validation engine that:

- Checks if changed files are allowed in current activity
- Verifies required chores are completed
- Validates project invariants
- Enforces file size limits
- Validates YAML syntax

### FSM Manager

Manages lifecycle state transitions:

- Load and parse lifecycle definitions
- Validate transition guards
- Update activity state
- Track state history

### Rules Engine

Evaluates validation rules:

- Pattern matching for file paths
- Content validation
- Commit size checks
- Custom rule evaluation

## Validation Rules

### Activity-Based Validation

Files must be in allowed paths for current activity:

```yaml
# In design activity, can modify:
- sot/**
- designs/**
- tests/**
- docs/**

# Cannot modify:
- src/** # Only allowed in implementation
```

### Required Chores

Changes to certain files require related changes:

```yaml
# Source changes require test updates
when: ["src/**"]
then: ["tests/**"]

# Version changes require changelog
when: ["package.json"]
then: ["CHANGELOG.md"]
```

### Invariants

Project-wide constraints:

```yaml
# Keep docs small
max_lines: 200
max_chars: 8000

# Limit commit size
max_files: 25
max_additions: 2500
```

## Integration Patterns

### Dual Support

ADP can be used in two ways:

1. **Internal**: Govern the code-canvas project itself
2. **External**: Offered as a feature to projects using code-canvas

### With State-Docs

ADP works with State-Docs to provide complete FSM-controlled development:

- State-Docs: Manages state and lifecycle definitions
- ADP: Enforces validation and guardrails

## Configuration

### Install Guardian Hook

```bash
deno run -A modules/adp/install.ts
```

### Configure Rules

Edit `sot/rules.yaml` to customize validation rules:

```yaml
invariants:
  - id: custom_rule
    description: My custom validation
    check:
      type: custom
      # ... configuration
```

### Configure Lifecycle

Edit `sot/lifecycle.yaml` to define states and transitions:

```yaml
states:
  - id: my_state
    allowedPaths:
      - "allowed/**"
    requiredChores:
      - whenAnyMatches: ["src/**"]
        mustAlsoChange: ["tests/**"]
```

## CLI Tools

### Guardian

```bash
# Validate current changes
deno run -A modules/adp/guardian-cli.ts validate

# Check specific files
deno run -A modules/adp/guardian-cli.ts check src/app.ts tests/app.test.ts

# Show current activity
deno run -A modules/adp/guardian-cli.ts activity
```

### FSM Manager

```bash
# Show current state
deno run -A modules/adp/fsm-cli.ts current

# Transition to new state
deno run -A modules/adp/fsm-cli.ts transition design

# Show lifecycle
deno run -A modules/adp/fsm-cli.ts show
```

## For New Projects

Projects created with Code Canvas can include ADP:

```bash
deno run -A tools/create-project.ts my-project --with-adp
```

## API

### Guardian

- `validate(files: string[])`: Validate file changes
- `checkActivity(files: string[])`: Check if files allowed in current activity
- `checkChores(files: string[])`: Verify required chores
- `checkInvariants(files: string[])`: Check project invariants

### Rules Engine

- `evaluateRule(rule: Rule, context: Context)`: Evaluate a validation rule
- `matchPattern(pattern: string, path: string)`: Match file path pattern
- `checkFileSize(path: string, limits: Limits)`: Check file size constraints

## Self-Hosting

ADP uses itself to validate its own development.

## License

ISC
