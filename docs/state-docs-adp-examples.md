# State-Docs and ADP Usage Examples

This document provides practical examples of using the State-Docs and ADP modules.

## Basic Usage

### Example 1: Check Current Activity

```bash
$ deno run -A tools/integrated-guardian.ts activity

📌 Current Activity:
  State: implementation
  Actor: human
  Note: Preparing to implement self-managing design canvas system
  Since: 2025-10-12T21:09:45.000Z
```

### Example 2: View Lifecycle States

```bash
$ deno run -A tools/integrated-guardian.ts lifecycle

🔄 Lifecycle States:

  design (Design)
    Allowed paths: sot/**, designs/**, docs/**, tests/**

  implementation (Implementation)
    Allowed paths: src/**, tests/**, tools/**, templates/**

  release (Release)
    Allowed paths: CHANGELOG.md, package.json, sot/**
```

### Example 3: Validate File Access

```bash
$ deno run -A tools/integrated-guardian.ts check-path "src/app.ts"
✅ Path 'src/app.ts' is allowed in activity 'implementation'

$ deno run -A tools/integrated-guardian.ts check-path "README.md"
❌ Path 'README.md' is NOT allowed in activity 'implementation'
```

### Example 4: Validate Changes

```bash
$ deno run -A tools/integrated-guardian.ts validate src/app.ts tests/app.test.ts

🔍 Validating files with ADP Guardian...

✅ All validations passed!
```

## Programmatic Usage

### Example 5: Using State-Docs in TypeScript

```typescript
import { StateDocsManager } from "./modules/state-docs/mod.ts";

// Create manager
const manager = new StateDocsManager("./sot");

// Get current activity
const activity = await manager.getCurrentActivity();
console.log(`Current state: ${activity.activity}`);

// Get lifecycle
const lifecycle = await manager.getLifecycle();
console.log(`States: ${lifecycle.states.map(s => s.id).join(", ")}`);

// Check if path is allowed
const allowed = await manager.isPathAllowed("src/app.ts");
if (allowed) {
  console.log("Path is allowed!");
} else {
  console.log("Path is NOT allowed in current activity");
}

// Get required chores
const chores = await manager.getRequiredChores(["src/app.ts"]);
console.log(`Required patterns: ${chores.join(", ")}`);
```

### Example 6: Using ADP Guardian

```typescript
import { Guardian } from "./modules/adp/mod.ts";
import { StateDocsManager } from "./modules/state-docs/mod.ts";

// Set up
const stateManager = new StateDocsManager("./sot");
const guardian = new Guardian(stateManager);

// Validate file changes
const files = ["src/app.ts", "tests/app.test.ts"];
const result = await guardian.validate(files);

if (result.valid) {
  console.log("✅ Validation passed!");
} else {
  console.log("❌ Validation failed:");
  result.errors.forEach(err => console.log(`  - ${err}`));
}

// Check specific validations
const activityCheck = await guardian.checkActivity(files);
const choresCheck = await guardian.checkChores(files);
const invariantsCheck = await guardian.checkInvariants(files);
```

### Example 7: Using FSM Manager

```typescript
import { FSMManager } from "./modules/adp/mod.ts";
import { StateDocsManager } from "./modules/state-docs/mod.ts";

const stateManager = new StateDocsManager("./sot");
const fsmManager = new FSMManager(stateManager);

// Get current activity
const current = await fsmManager.getCurrentActivity();
console.log(`Current: ${current.activity}`);

// Get available transitions
const transitions = await fsmManager.getAvailableTransitions();
console.log(`Can transition to: ${transitions.join(", ")}`);

// Attempt transition
const result = await fsmManager.transition(
  "release",
  "human",
  "Ready for release"
);

if (result.valid) {
  console.log("✅ Transition successful!");
} else {
  console.log("❌ Transition failed:");
  result.errors.forEach(err => console.log(`  - ${err}`));
}
```

### Example 8: Using Rules Engine

```typescript
import { RulesEngine } from "./modules/adp/mod.ts";

// Match pattern
const matches = RulesEngine.matchPattern("src/**", "src/app.ts");
console.log(`Matches: ${matches}`); // true

// Check multiple patterns
const files = ["src/app.ts", "tests/app.test.ts", "docs/readme.md"];
const patterns = ["src/**", "tests/**"];
const hasMatch = RulesEngine.matchesAny(patterns, files);
console.log(`Has match: ${hasMatch}`); // true

// Get matching files
const srcFiles = RulesEngine.getMatches("src/**", files);
console.log(`Source files: ${srcFiles.join(", ")}`);
// Output: src/app.ts
```

## Error Handling Examples

### Example 9: Handling Validation Errors

```typescript
import { Guardian } from "./modules/adp/mod.ts";
import { StateDocsManager } from "./modules/state-docs/mod.ts";

const stateManager = new StateDocsManager("./sot");
const guardian = new Guardian(stateManager);

// Try to modify files not allowed in current activity
const result = await guardian.validate(["README.md"]);

if (!result.valid) {
  console.log("Validation failed:");
  
  // Show errors
  result.errors.forEach(error => {
    console.log(`  ❌ ${error}`);
  });
  
  // Show warnings (if any)
  result.warnings.forEach(warning => {
    console.log(`  ⚠️  ${warning}`);
  });
  
  // Exit with error code
  Deno.exit(1);
}
```

### Example 10: Missing Required Chores

```typescript
const guardian = new Guardian(stateManager);

// Modify src without updating tests
const result = await guardian.validate(["src/app.ts"]);

if (!result.valid) {
  console.log("Missing required chores:");
  // Output: Required chore not completed: changes must also include files matching 'tests/**'
}
```

## Integration Examples

### Example 11: Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/usr/bin/env bash

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Validate with integrated guardian
echo "$STAGED_FILES" | xargs deno run -A tools/integrated-guardian.ts validate

# Exit with guardian's exit code
exit $?
```

### Example 12: CI/CD Integration

GitHub Actions workflow:

```yaml
name: Validate Changes

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x
      
      - name: Validate with Guardian
        run: |
          # Get changed files
          CHANGED_FILES=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }})
          
          # Validate
          echo "$CHANGED_FILES" | xargs deno run -A tools/integrated-guardian.ts validate
```

### Example 13: VS Code Task

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate Changes",
      "type": "shell",
      "command": "git diff --name-only | xargs deno run -A tools/integrated-guardian.ts validate",
      "problemMatcher": [],
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "Show Current Activity",
      "type": "shell",
      "command": "deno run -A tools/integrated-guardian.ts activity",
      "problemMatcher": []
    }
  ]
}
```

## Project Template Example

### Example 14: Creating a New Project

```bash
# Copy template
cp -r templates/project-with-modules my-project
cd my-project

# Initialize git
git init

# Install hooks
deno task prepare-hooks

# Check current state
deno task activity

# Start development
# ... make changes in allowed paths ...

# Validate before commit
deno task validate

# Commit (guardian runs automatically)
git add .
git commit -m "Initial implementation"
```

## Advanced Usage

### Example 15: Custom Validation Rules

Create custom validator:

```typescript
import { Guardian } from "./modules/adp/mod.ts";
import { StateDocsManager } from "./modules/state-docs/mod.ts";

class CustomGuardian extends Guardian {
  async validateCustomRule(files: string[]): Promise<boolean> {
    // Custom validation logic
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const content = await Deno.readTextFile(file);
        if (content.includes('console.log')) {
          console.log(`⚠️  Warning: ${file} contains console.log`);
          return false;
        }
      }
    }
    return true;
  }
  
  async validate(files: string[]) {
    const baseResult = await super.validate(files);
    const customValid = await this.validateCustomRule(files);
    
    return {
      valid: baseResult.valid && customValid,
      errors: baseResult.errors,
      warnings: baseResult.warnings,
    };
  }
}

// Use custom guardian
const stateManager = new StateDocsManager("./sot");
const guardian = new CustomGuardian(stateManager);
const result = await guardian.validate(["src/app.ts"]);
```

### Example 16: Activity History Tracking

```typescript
import { StateDocsManager } from "./modules/state-docs/mod.ts";

const manager = new StateDocsManager("./sot");

// Record new activity
await manager.recordActivity(
  "implementation",
  "developer-team",
  "Starting new feature implementation"
);

// View history
const history = await manager.getHistory();
history.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.activity} (${entry.actor})`);
  console.log(`  Note: ${entry.note}`);
  if (entry.previousActivity) {
    console.log(`  Previous: ${entry.previousActivity}`);
  }
});
```

## Testing Examples

### Example 17: Testing State-Docs

```typescript
import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { StateDocsManager } from "./modules/state-docs/mod.ts";

Deno.test("StateDocsManager - getCurrentActivity", async () => {
  const manager = new StateDocsManager("./sot");
  const activity = await manager.getCurrentActivity();
  
  assertEquals(typeof activity.activity, "string");
  assertEquals(typeof activity.actor, "string");
});

Deno.test("StateDocsManager - isPathAllowed", async () => {
  const manager = new StateDocsManager("./sot");
  
  // In implementation state, src/** should be allowed
  const allowed = await manager.isPathAllowed("src/app.ts");
  assertEquals(allowed, true);
});
```

### Example 18: Testing ADP Guardian

```typescript
import { Guardian, RulesEngine } from "./modules/adp/mod.ts";
import { StateDocsManager } from "./modules/state-docs/mod.ts";

Deno.test("RulesEngine - pattern matching", () => {
  const matches1 = RulesEngine.matchPattern("src/**", "src/app.ts");
  assertEquals(matches1, true);
  
  const matches2 = RulesEngine.matchPattern("src/**", "tests/app.test.ts");
  assertEquals(matches2, false);
});

Deno.test("Guardian - validate allowed files", async () => {
  const manager = new StateDocsManager("./sot");
  const guardian = new Guardian(manager);
  
  const result = await guardian.checkActivity(["tools/example.ts"]);
  assertEquals(result.valid, true);
});
```

## Troubleshooting

### Issue: "Path not allowed in current activity"

**Solution**: Check current activity and allowed paths:

```bash
$ deno run -A tools/integrated-guardian.ts activity
$ deno run -A tools/integrated-guardian.ts lifecycle
```

Then either:
1. Switch to appropriate activity in `sot/state/activity.yaml`
2. Modify files in allowed paths for current activity

### Issue: "Required chore not completed"

**Solution**: Check what files are required:

```typescript
const manager = new StateDocsManager("./sot");
const chores = await manager.getRequiredChores(["src/app.ts"]);
console.log("Must also change:", chores);
// Output: Must also change: tests/**
```

Add required files and validate again.

## Best Practices

1. **Check activity before starting work**
   ```bash
   deno task activity
   ```

2. **Validate frequently during development**
   ```bash
   deno task validate src/modified-file.ts
   ```

3. **Use pre-commit hooks** to catch issues early

4. **Keep activity.yaml updated** when switching focus

5. **Review lifecycle states** to understand workflow

6. **Document custom rules** in `sot/rules.yaml`

7. **Track activity history** for audit trail

## Reference

### CLI Commands

- `activity` - Show current activity state
- `lifecycle` - Show all lifecycle states and allowed paths
- `check-path <path>` - Check if specific path is allowed
- `validate <files...>` - Validate file changes
- `help` - Show command help

### Module Exports

**State-Docs**:
- `StateDocsManager` - Main state management class
- `StateDocsValidator` - Validation utilities
- Types: `Activity`, `Lifecycle`, `Rules`, `HistoryEntry`

**ADP**:
- `Guardian` - Validation engine
- `FSMManager` - FSM lifecycle manager
- `RulesEngine` - Pattern matching utilities
- Types: `ValidationResult`, `CommitInfo`

## See Also

- [State-Docs README](../modules/state-docs/README.md)
- [ADP README](../modules/adp/README.md)
- [Integration Guide](./state-docs-adp-integration.md)
- [Project Template](../templates/project-with-modules/README.md)
