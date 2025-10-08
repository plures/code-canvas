# Phase 3 Demo - Developer Experience Enhancements

This demo showcases the new CLI and CI/CD features added in Phase 3.

## 🎨 Unified CLI Interface

### Check Version

```bash
deno task canvas --version
# Output: Code Canvas CLI v0.2.0
```

### Canvas Commands

```bash
# List all canvas files
deno task canvas canvas list

# Render all canvases
deno task canvas canvas render --all

# Render specific canvas
deno task canvas canvas render --file sot/canvas/demo.canvas.yaml
```

### Activity Management

```bash
# Check current activity
deno task canvas activity status

# View transition history
deno task canvas activity history

# Switch activity
deno task canvas activity switch --to implementation
```

### Validation

```bash
# Validate guardian rules
deno task canvas validate check

# Validate YAML schemas
deno task canvas validate config

# Auto-fix (coming soon)
deno task canvas validate fix --dry-run
```

### Project Initialization

```bash
# Initialize new project
deno task canvas init

# Initialize with name
deno task canvas init --name my-project
```

## 🔧 CI/CD Templates

### GitHub Actions

Copy the template to your repo:

```bash
cp templates/ci-cd/github-actions.yml .github/workflows/code-canvas.yml
```

Features:

- ✅ Validates guardian rules on every push/PR
- ✅ Checks YAML schemas
- ✅ Runs unit tests
- ✅ Renders canvases and uploads as artifacts
- ✅ Activity-based validation

### GitLab CI

Merge into your `.gitlab-ci.yml`:

```bash
cat templates/ci-cd/gitlab-ci.yml >> .gitlab-ci.yml
```

Features:

- ✅ Multi-stage pipeline (validate, test, render)
- ✅ Artifact generation for rendered canvases
- ✅ Activity-specific validation rules

### Azure Pipelines

Copy to your repo:

```bash
cp templates/ci-cd/azure-pipelines.yml azure-pipelines.yml
```

Features:

- ✅ Multi-stage validation and testing
- ✅ PR-specific activity checks
- ✅ Artifact publishing for documentation

## 📦 Project Templates

Quick start with pre-configured templates:

```bash
# Basic template
deno task canvas init

# Creates:
# - sot/ directory structure
# - .githooks/ with pre-commit validation
# - docs/ with setup guides
# - tools/ with core utilities
```

## 🚀 Complete Workflow Example

```bash
# 1. Initialize project
deno task canvas init --name awesome-project
cd awesome-project

# 2. Install hooks
deno task prepare-hooks

# 3. Check status
deno task canvas activity status

# 4. List canvases
deno task canvas canvas list

# 5. Render documentation
deno task canvas canvas render --all

# 6. Validate everything
deno task canvas validate check
deno task canvas validate config

# 7. Run tests
deno task test

# 8. Switch to implementation
deno task canvas activity switch --to implementation --note "Starting dev work"

# 9. Build and validate
# ... make code changes ...
deno task canvas validate check

# 10. View history
deno task canvas activity history
```

## 📚 Documentation

- **CLI Guide**: `docs/cli-guide.md` - Complete command reference
- **Setup Guide**: `docs/setup-guide.md` - Getting started
- **CI/CD Templates**: `templates/ci-cd/README.md` - Integration guide
- **Project Templates**: `templates/project/README.md` - Quick start

## ✨ Key Improvements

1. **Unified Interface**: Single `canvas` command instead of multiple tools
2. **Better UX**: Intuitive subcommands with helpful error messages
3. **CI/CD Ready**: Production-ready templates for major platforms
4. **Quick Start**: Initialize new projects in seconds
5. **Documentation**: Comprehensive guides for all features

## 🎯 What's Next?

**Phase 3 Remaining:**

- VS Code extension (syntax highlighting, canvas preview)
- Smart auto-fix validator

**Phase 2 Options:**

- Interactive canvas editor
- Live preview in browser

**Phase 4 Options:**

- AI agent logging and analytics
- Smart recommendations
