# Code Canvas Documentation

Welcome to Code Canvas - an AI Guardrails Kit that enforces lifecycle, tests-first, and conversation control for AI-assisted projects.

## 📚 Documentation Index

### Getting Started
- **[Setup Guide](./setup-guide.md)** - Complete installation and configuration instructions
- **[MVP Roadmap](./mvp-roadmap.md)** - Development roadmap and feature checklist

### Core Concepts
- **Single Source of Truth (SoT)** - Centralized project state in `sot/` directory
- **FSM Lifecycle** - Finite State Machine controls for development phases
- **Guardian Validation** - Pre-commit hooks that enforce project rules
- **YAML Canvas** - Visual documentation with nodes and edges

### Key Features

#### 🔒 **FSM-Controlled Development**
- Enforces allowed file changes based on current activity (design/implementation/release)
- Prevents unauthorized modifications outside of current development phase
- Validates required chores (e.g., updating tests when changing code)

#### 🛡️ **Guardian Pre-commit Validation**
- Blocks commits that violate FSM rules
- Ensures required documentation is updated
- Cross-platform compatible (Windows, Mac, Linux)

#### 🎨 **Visual Canvas System**
- YAML-based visual documentation
- Links designs to code and tests
- Supports multiple node types (FSM, controls, documents)
- Enables visual workflow planning

#### 🤖 **AI Agent Contracts**
- Constrains AI behavior to current development activity
- Prevents agents from making unauthorized changes
- Enforces tests-first development methodology

## 🚀 Quick Start

1. **Install Deno 2+** and ensure you're in a git repository
2. **Run setup**: `deno task prepare-hooks`
3. **Set activity**: Edit `sot/state/activity.yaml`
4. **Start developing** with FSM protection enabled

## 📋 Project Structure

```
code-canvas/
├── sot/           # Single Source of Truth
├── designs/       # Design documentation  
├── tests/         # Test specifications
├── tools/         # Development tools
├── docs/          # This documentation
└── .githooks/     # Git hook scripts
```

## 🔄 Development Workflow

The project follows a strict FSM-based workflow:

1. **Design Phase** → Plan and document features
2. **Implementation Phase** → Code with tests-first approach  
3. **Release Phase** → Package and document releases

Each phase has specific allowed file paths and required chores that are enforced by the guardian.

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `deno task validate` | Validate staged changes |
| `deno task prepare-hooks` | Install git pre-commit hook |

## 📖 Additional Resources

- See individual YAML files in `sot/` for configuration examples
- Check `sot/schemas/` for validation schemas
- Review `sot/instructions/agent-contract.md` for AI behavior rules

## 🤝 Contributing

This project enforces its own development methodology:

1. Current activity must be appropriate for your changes
2. Guardian will validate all commits
3. Tests must be updated when changing designs or code
4. Documentation must be updated for releases

For detailed contribution guidelines, see the [Setup Guide](./setup-guide.md).