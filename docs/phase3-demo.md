# Phase 3 Demo - Developer Experience

Showcases the new CLI and CI/CD features added in Phase 3.

## 🎨 Unified CLI Interface

### Basic Commands

```bash
# Check version
deno task canvas --version

# List canvas files
deno task canvas canvas list

# Render all canvases
deno task canvas canvas render --all
```

### Activity Management

```bash
# Check current activity
deno task canvas activity status

# Switch activity
deno task canvas activity switch --to implementation

# View history
deno task canvas activity history
```

### Validation

```bash
# Validate rules
deno task canvas validate check

# Validate schemas
deno task canvas validate config
```

## 🔧 CI/CD Templates

### GitHub Actions

```bash
cp templates/ci-cd/github-actions.yml .github/workflows/code-canvas.yml
```

### GitLab CI

```bash
cat templates/ci-cd/gitlab-ci.yml >> .gitlab-ci.yml
```

### Azure Pipelines

```bash
cp templates/ci-cd/azure-pipelines.yml azure-pipelines.yml
```

## 📦 Project Templates

```bash
# Initialize new project
deno task canvas init --name awesome-project
```

## 🚀 Quick Workflow

```bash
# Initialize
deno task canvas init
deno task prepare-hooks

# Check status
deno task canvas activity status

# Render and validate
deno task canvas canvas render --all
deno task canvas validate check

# Run tests
deno task test
```

## 📚 Documentation

- **CLI Guide**: `docs/cli-guide.md`
- **Setup Guide**: `docs/setup-guide.md`
- **CI/CD**: `templates/ci-cd/README.md`
- **Templates**: `templates/project/README.md`

## ✨ Key Improvements

1. **Unified Interface** - Single `canvas` command
2. **Better UX** - Intuitive subcommands
3. **CI/CD Ready** - Production templates
4. **Quick Start** - Initialize in seconds

## 🎯 What's Next

**Phase 3 Remaining:** VS Code extension, auto-fix validator

**Phase 2:** Interactive canvas editor

**Phase 4:** AI agent logging and analytics
