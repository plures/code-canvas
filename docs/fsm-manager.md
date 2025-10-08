# FSM Manager Guide

## Overview
The FSM Manager provides state transition validation and history tracking for the Code Canvas lifecycle.

## Usage

### Check Current Status
```bash
deno task fsm --status
```

### Transition to New Activity  
```bash
deno task fsm --to implementation --actor john --note "Starting development"
```

### View History
```bash
deno task fsm --history
```

### Rollback to Previous State
```bash
deno task fsm --rollback
```

## Guard Conditions
- `file:path` - Check if file exists
- `not:file:path` - Check if file doesn't exist  
- `git:clean` - Ensure no uncommitted changes
- `git:staged` - Ensure files are staged

## Features
- ✅ Transition validation with guards
- ✅ Complete history logging
- ✅ Rollback capability
- ✅ Cross-platform support