# AI Guardrails Kit: Single Source of Truth + FSM Enforcement

Purpose: enforce lifecycle, tests-first, and conversation control for AI-assisted projects.

## Key ideas
- **sot/** is the single source of truth. Small, focused docs fit in context.
- **FSM** controls allowed activities and file access.
- **guardian** pre-commit gate with comprehensive rules engine: blocks invalid changes, enforces file size limits, validates YAML syntax, and ensures required chores are completed.
- **logs/** capture agent runs and decisions to enable learning.

## Quick start
1. Install Deno 2+.
2. Run `deno task prepare-hooks`.
3. Configure your current activity in `sot/state/activity.yaml`.
4. Commit changes. The hook will validate diffs against the FSM and chores.
5. Use `sot/canvas/*.yaml` to design UI and business flows. Renderers can target Storybook or custom viewers later.

## Structure
```
sot/
  lifecycle.yaml          # project lifecycle FSM
  rules.yaml              # chore rules and invariants
  state/
    activity.yaml         # current activity and actor intent
    history.yaml          # append-only activity changes
  canvas/
    demo.canvas.yaml      # YAML Canvas nodes+edges with FSM refs
  designs/
    demo.md               # design notes kept small
  instructions/
    agent-contract.md     # ironclad agent instruction template
tests/
  sanity.test.md
tools/
  guardian.ts             # Deno CLI pre-commit guardian
  tasks.ts                # utility tasks
.githooks/
  pre-commit              # installs as local hook
deno.json
```

## Commands
- `deno task validate` — validate staged changes
- `deno task prepare-hooks` — install `.githooks/pre-commit` to `.git/hooks/pre-commit`

## Notes
- Extend schemas in `sot/schemas/*`. Keep documents small. Split when >2–3k tokens.
