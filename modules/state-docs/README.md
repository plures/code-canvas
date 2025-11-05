# State-Docs

A reusable module for managing state documentation in AI-assisted projects.

## Purpose

State-Docs provides a structured approach to maintaining a Single Source of Truth (SoT) for project state, including:
- Lifecycle definitions (FSM)
- Validation rules
- State history tracking
- Canvas-based design documentation

## Features

- **Lifecycle Management**: Define project states and transitions with FSM
- **State History**: Track activity changes over time
- **Validation Rules**: Enforce project invariants and chores
- **Canvas Integration**: Visual design documentation with state references
- **Schema Support**: Type-safe configuration with JSON Schema

## Structure

```
state-docs/
  lifecycle.yaml          # FSM state definitions
  rules.yaml              # Validation rules and invariants
  state/
    activity.yaml         # Current activity state
    history.yaml          # Activity change log
  canvas/
    *.canvas.yaml         # Visual design documents
  schemas/
    *.schema.yaml         # Configuration schemas
  instructions/
    agent-contract.md     # AI agent guidelines
```

## Usage

### As a Standalone Module

```typescript
import { StateDocsManager } from './state-docs/mod.ts';

const manager = new StateDocsManager('./sot');
const currentActivity = await manager.getCurrentActivity();
const lifecycle = await manager.getLifecycle();
```

### Integration in Code Canvas

State-Docs is integrated into Code Canvas to manage project state and enforce development workflows.

### For New Projects

Projects created with Code Canvas automatically include State-Docs structure:

```bash
deno run -A tools/create-project.ts my-project --with-state-docs
```

## API

### StateDocsManager

- `getCurrentActivity()`: Get current activity state
- `getLifecycle()`: Load lifecycle FSM definition
- `getRules()`: Load validation rules
- `validateTransition(from, to)`: Check if transition is allowed
- `recordActivity(activity, actor, note)`: Record new activity
- `getHistory()`: Get activity history

### Validation

- `validateYAML(path)`: Validate YAML syntax
- `checkInvariants(files)`: Check project invariants
- `checkChores(changes)`: Verify required chores are completed

## Integration Patterns

### Dual Support

State-Docs can be used in two ways:
1. **Internal**: Govern the code-canvas project itself
2. **External**: Offered as a feature to projects using code-canvas

### Self-Hosting

State-Docs uses itself to manage its own development lifecycle.

## Configuration

See `schemas/` directory for configuration schemas:
- `lifecycle.schema.yaml` - FSM structure
- `rules.schema.yaml` - Validation rules format
- `activity.schema.yaml` - Activity state format

## License

ISC
