# Schema Validation Guide

## Overview

The Schema Validator ensures all YAML configuration files comply with their defined schemas.

## Usage

### Validate All Files

```bash
deno task validate-config
```

### Validate Specific File

```bash
deno run -A tools/schema-validator.ts sot/state/activity.yaml
```

## Supported Files

- `sot/lifecycle.yaml` - FSM lifecycle configuration
- `sot/rules.yaml` - Guardian rules configuration  
- `sot/canvas/*.canvas.yaml` - Canvas definitions
- `sot/state/activity.yaml` - Current activity state
- `sot/state/history.yaml` - State transition history

## Features

- ✅ JSON Schema-like validation
- ✅ Cross-platform pattern matching
- ✅ Detailed error reporting
- ✅ File-specific validation logic
