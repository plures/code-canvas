# AI Guardrails Kit: Single Source of Truth + FSM Enforcement

Purpose: enforce lifecycle, tests-first, and conversation control for AI-assisted projects.

## Key ideas
- **sot/** is the single source of truth. Small, focused docs fit in context.
- **FSM** controls allowed activities and file access.
- **guardian** pre-commit gate with comprehensive rules engine: blocks invalid changes, enforces file size limits, validates YAML syntax, and ensures required chores are completed.
- **logs/** capture agent runs and decisions to enable learning.
- **State-Docs & ADP** modules provide reusable state management and validation for any project.

## Modules (Dual Support)

Code Canvas includes two reusable modules:

- **State-Docs** (`modules/state-docs/`): State documentation management with lifecycle FSM, activity tracking, and canvas support
- **ADP** (`modules/adp/`): AI Development Pattern with Guardian validation, FSM enforcement, and guardrails

These modules are used by Code Canvas itself (internal) and can be integrated into any project created with Code Canvas (external). See [Integration Guide](docs/state-docs-adp-integration.md).

## Quick start
1. Install Deno 2+.
2. Run `deno task prepare-hooks`.
3. Configure your current activity in `sot/state/activity.yaml`.
4. Commit changes. The hook will validate diffs against the FSM and chores.
5. Use `sot/canvas/*.yaml` to design UI and business flows. Supports both YAML Canvas and JSON Canvas formats for interoperability with Obsidian Canvas.

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
modules/
  state-docs/             # State management module
  adp/                    # AI Development Pattern module
tests/
  sanity.test.md
tools/
  guardian.ts             # Deno CLI pre-commit guardian
  integrated-guardian.ts  # Uses State-Docs + ADP modules
  tasks.ts                # utility tasks
templates/
  project-with-modules/   # Template with State-Docs + ADP
.githooks/
  pre-commit              # installs as local hook
deno.json
```

## Commands

- `deno task validate` — validate staged changes
- `deno task prepare-hooks` — install `.githooks/pre-commit` to `.git/hooks/pre-commit`
- `deno run -A tools/canvas-server-v2.ts --file canvas.canvas --port 8080` — interactive canvas editor
- `deno run -A tools/enhanced-cli.ts render canvas.yaml` — render canvas to SVG/HTML

### Integrated Guardian (State-Docs + ADP)

- `deno run -A tools/integrated-guardian.ts validate <files>` — validate with modules
- `deno run -A tools/integrated-guardian.ts activity` — show current activity
- `deno run -A tools/integrated-guardian.ts lifecycle` — show lifecycle states
- `deno run -A tools/integrated-guardian.ts check-path <path>` — check if path allowed

## Notes
- Extend schemas in `sot/schemas/*`. Keep documents small. Split when >2–3k tokens.
