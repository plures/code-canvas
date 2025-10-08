# Code Canvas CLI Guide

## Overview

The unified CLI provides intuitive commands for all Code Canvas operations through a single `canvas` command.

## Installation

```bash
# In your project
deno task canvas --help

# Or run directly
deno run -A tools/cli.ts --help
```

## Commands

### Canvas Management

**List all canvas files:**

```bash
deno task canvas canvas list
```

**Render all canvases:**

```bash
deno task canvas canvas render --all
```

**Render specific canvas:**

```bash
deno task canvas canvas render --file sot/canvas/demo.canvas.yaml
```

### Activity Management

**Check current activity:**

```bash
deno task canvas activity status
```

**Switch activity:**

```bash
deno task canvas activity switch --to design
deno task canvas activity switch --to implementation --actor alice
deno task canvas activity switch --to release --note "Ready for v1.0"
```

**View transition history:**

```bash
deno task canvas activity history
```

### Validation

**Validate project rules:**

```bash
deno task canvas validate check
```

**Validate YAML schemas:**

```bash
deno task canvas validate config
```

**Auto-fix issues (coming soon):**

```bash
deno task canvas validate fix
```

### Project Initialization

**Initialize new project:**

```bash
deno task canvas init
deno task canvas init --name my-project
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `canvas canvas list` | List all canvas files |
| `canvas canvas render --all` | Render all canvases |
| `canvas activity status` | Show current FSM state |
| `canvas activity switch --to <activity>` | Change activity |
| `canvas validate check` | Run guardian validation |
| `canvas validate config` | Validate YAML schemas |
| `canvas init` | Initialize new project |

## Examples

**Typical workflow:**

```bash
# Check current state
deno task canvas activity status

# Switch to design
deno task canvas activity switch --to design --note "Planning new feature"

# List available canvases
deno task canvas canvas list

# Render documentation
deno task canvas canvas render --all

# Validate everything
deno task canvas validate check
deno task canvas validate config
```

## Tips

- Use `--help` with any command to see detailed options
- The CLI wraps existing tools for better UX
- All commands respect FSM rules and guardian validation
