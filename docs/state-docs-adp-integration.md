# State-Docs and ADP Integration

## Overview

Code Canvas now includes two reusable modules that provide the core functionality:

### State-Docs
A module for managing state documentation in AI-assisted projects. It provides:
- Lifecycle management (FSM definitions)
- State history tracking
- Validation rules configuration
- Canvas-based design documentation

### ADP (AI Development Pattern)
A module for automated validation and guardrails in AI-assisted development. It provides:
- Pre-commit validation (Guardian)
- FSM enforcement
- Rules engine for invariants and chores
- Activity-based file access control

## Dual Support Architecture

Both modules support a "dual support" pattern:

1. **Internal Use**: Code Canvas uses State-Docs and ADP to govern its own development
2. **External Offering**: Projects created with Code Canvas can include these modules

This creates a "squared" effect where:
- Code Canvas → uses State-Docs + ADP
- Projects created by Code Canvas → can also use State-Docs + ADP
- Each level benefits from the same governance patterns

## Module Structure

```
modules/
├── state-docs/
│   ├── README.md           # Module documentation
│   ├── mod.ts              # Main exports
│   ├── mod.test.ts         # Tests
│   └── deno.json           # Module configuration
└── adp/
    ├── README.md           # Module documentation
    ├── mod.ts              # Main exports
    ├── mod.test.ts         # Tests
    └── deno.json           # Module configuration
```

## Integration Points

### 1. Tools Integration

The `integrated-guardian.ts` tool demonstrates how to use both modules:

```bash
# Validate files
deno run -A tools/integrated-guardian.ts validate src/app.ts

# Show current activity
deno run -A tools/integrated-guardian.ts activity

# Show lifecycle states
deno run -A tools/integrated-guardian.ts lifecycle

# Check if path is allowed
deno run -A tools/integrated-guardian.ts check-path src/new-file.ts
```

### 2. Project Templates

The `templates/project-with-modules/` template shows how new projects can include both modules:

```bash
# Copy template to create new project
cp -r templates/project-with-modules my-new-project
cd my-new-project

# Install hooks
deno task prepare-hooks

# Use the integrated tools
deno task activity
deno task validate
```

### 3. API Usage

```typescript
// Import modules
import { StateDocsManager } from "./modules/state-docs/mod.ts";
import { Guardian, FSMManager } from "./modules/adp/mod.ts";

// Set up state management
const stateManager = new StateDocsManager("./sot");

// Use Guardian for validation
const guardian = new Guardian(stateManager);
const result = await guardian.validate(["src/app.ts"]);

// Use FSM Manager for state transitions
const fsmManager = new FSMManager(stateManager);
const transitions = await fsmManager.getAvailableTransitions();
```

## Self-Hosting

Code Canvas itself uses these modules:

1. **sot/**: Contains state documentation (lifecycle, rules, activity)
2. **tools/guardian.ts**: Can be replaced with integrated-guardian.ts
3. **.githooks/pre-commit**: Uses Guardian for validation

This demonstrates the "use itself to develop itself" principle.

## Benefits

### For Code Canvas Development

1. **Modular Architecture**: Core functionality is separated into reusable modules
2. **Better Testing**: Each module has its own tests
3. **Cleaner Code**: Separation of concerns between state management and validation
4. **Self-Validation**: Code Canvas uses its own modules for governance

### For Projects Using Code Canvas

1. **Easy Integration**: Include modules by copying or importing
2. **Consistent Patterns**: Same governance patterns across all projects
3. **Customizable**: Modules can be configured per project
4. **Independent**: Modules work independently or together

## Usage Patterns

### Pattern 1: Full Integration (Both Modules)

Use both State-Docs and ADP for complete FSM-controlled development:

```typescript
const stateManager = new StateDocsManager("./sot");
const guardian = new Guardian(stateManager);
const fsmManager = new FSMManager(stateManager);

// Validate changes
await guardian.validate(files);

// Manage state transitions
await fsmManager.transition("implementation", "human", "Starting implementation");
```

### Pattern 2: State-Docs Only

Use only State-Docs for state management without validation:

```typescript
const stateManager = new StateDocsManager("./sot");

// Read current state
const activity = await stateManager.getCurrentActivity();
const lifecycle = await stateManager.getLifecycle();

// Check permissions
const allowed = await stateManager.isPathAllowed("src/app.ts");
```

### Pattern 3: ADP Only

Use only ADP for validation without full state management:

```typescript
// Minimal state manager
const stateManager = new StateDocsManager("./sot");
const guardian = new Guardian(stateManager);

// Just validate
const result = await guardian.validate(files);
```

## Configuration

### State-Docs Configuration

Configure in `sot/`:

- `lifecycle.yaml`: FSM state definitions
- `rules.yaml`: Validation rules
- `state/activity.yaml`: Current activity
- `state/history.yaml`: Activity history

### ADP Configuration

ADP reads configuration from State-Docs:

- Uses `lifecycle.yaml` for allowed paths
- Uses `rules.yaml` for validation rules
- Uses `state/activity.yaml` for current context

## Future Enhancements

1. **Separate Repositories**: Publish modules as separate npm/JSR packages
2. **Version Management**: Independent versioning for each module
3. **Plugin System**: Allow custom validators and state managers
4. **Web UI**: Visual interface for state management and validation
5. **CI/CD Integration**: GitHub Actions for automated validation

## Migration Path

### From Current Guardian to Integrated Guardian

1. Keep existing `tools/guardian.ts` for backward compatibility
2. Use `tools/integrated-guardian.ts` for new features
3. Gradually migrate existing hooks and tools

### For Existing Projects

1. Add `modules/` directory with State-Docs and ADP
2. Update `deno.json` tasks to use integrated tools
3. Configure `sot/` structure if not already present

## Testing

Run tests for both modules:

```bash
# Test State-Docs
cd modules/state-docs
deno task test

# Test ADP
cd modules/adp
deno task test

# Test integration
deno task test
```

## Documentation

Each module has its own README:

- `modules/state-docs/README.md`: State-Docs documentation
- `modules/adp/README.md`: ADP documentation
- This document: Integration guide

## Examples

See `templates/project-with-modules/` for a complete example of a project using both modules.

## Support

For issues or questions:

1. Check module READMEs for detailed documentation
2. See examples in `templates/project-with-modules/`
3. Review tests in `modules/*/mod.test.ts`
4. Open an issue on GitHub

## License

ISC - Same as Code Canvas project
