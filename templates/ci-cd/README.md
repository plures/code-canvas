# Code Canvas CI/CD Workflows

This directory contains CI/CD templates for integrating Code Canvas validation into your pipelines.

## Available Templates

- `github-actions.yml` - GitHub Actions workflow
- `gitlab-ci.yml` - GitLab CI configuration
- `azure-pipelines.yml` - Azure Pipelines configuration

## Setup Instructions

### GitHub Actions

1. Copy `github-actions.yml` to `.github/workflows/code-canvas.yml`
2. Commit and push to your repository
3. Workflow runs automatically on PRs and pushes

### GitLab CI

1. Merge `gitlab-ci.yml` into your `.gitlab-ci.yml`
2. Commit and push to your repository
3. Pipeline runs automatically

### Azure Pipelines

1. Copy `azure-pipelines.yml` to your repository
2. Create a new pipeline in Azure DevOps pointing to this file
3. Pipeline runs automatically on PRs and main branch

## What Gets Validated

All templates validate:

- ✅ Guardian rules (file paths, sizes, activity constraints)
- ✅ YAML schema compliance
- ✅ FSM state consistency
- ✅ Unit tests
- ✅ Canvas rendering (to catch syntax errors)

## Customization

Adjust the validation steps in each template to match your project needs:

- Add/remove validation checks
- Configure when validation runs
- Set up deployment steps for release activity
