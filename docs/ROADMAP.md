# code-canvas Roadmap

## Role in Plures Ecosystem
Provides the AI guardrails kit (State-Docs + ADP) that enforces lifecycle FSMs, test-first workflows, and safe file access for agent-driven development across Plures repos.

## Current State
Core Deno-based guardian tooling exists (standalone + integrated guardian), with SOT lifecycle/rules, templates, and a canvas server. Modules for State-Docs and ADP are present, plus a VSCode extension and webapp, but integration guidance, lifecycle enforcement depth, and conversational control are still maturing.

## Milestones

### Near-term (Q2 2026)
- Strengthen lifecycle enforcement: expand allowed activity checks + path gates
- Add tests-first gate templates and enforce test evidence in guardian
- Improve conversation control: explicit prompt contracts + violation reporting
- Publish integration quickstarts for modules and templates
- Validate canvas tooling workflows and stabilize CLI commands

### Mid-term (Q3–Q4 2026)
- Expand guardian rule coverage (schema validation, cross-doc invariants)
- Add CI integration templates for plures-standardization repos
- Improve VSCode extension UX (activity switching, rule hints)
- Add governance logging for agent runs (audit-ready logs)
- Provide migration guide for adopting State-Docs + ADP in existing repos

### Long-term
- Formalize API stability for modules (versioning, deprecation policy)
- Deep integration with OpenClaw orchestration (policy push + centralized configs)
- GUI for lifecycle/FSM authoring and rule simulation
- Ecosystem-wide guardrails catalog and shared policy registry
