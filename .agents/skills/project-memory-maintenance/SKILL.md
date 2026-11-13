---
name: project-memory-maintenance
description: Use after a meaningful project iteration or before handing work to another session to verify and update MEMORY.md without inventing status.
---

# Project Memory Maintenance

Use this skill only after a meaningful work iteration, milestone, or context handoff. Do not use it to modify memory during a READ-ONLY task.

## Workflow

1. Read the current `MEMORY.md`.
2. Inspect the actual changed files and the relevant command/test output. Do not treat the old memory entry, a plan, or an agent's claim as proof. If the iteration changed the design system, verify that `docs/design-system.md` still matches `css/settings/tokens.css` before recording the result.
3. Update the compact `Current State` only where facts have changed.
4. Append a dated entry to `Work Log`. Never rewrite or delete previous historical entries.
5. For a meaningful completed iteration, record about 3–5 useful bullets: what changed, files affected, decisions, verification, unresolved issues/next step. Do not manufacture bullets for trivial work.
6. Mark `[DONE]` only when the relevant result has been verified. If work is incomplete, use `[PARTIAL]` or `[BLOCKED]` and state exactly what did not pass or could not be checked.
7. If a planned item already exists, verify it in the repository/tests and mark `[SKIPPED/DONE]`; do not repeat the implementation.

## Keep Memory Useful

- `PROJECT_BRIEF.md` is the source for agreed requirements and architecture.
- `AGENTS.md` is the source for stable agent operating rules.
- `docs/architecture.md` and `docs/design-system.md` contain detailed technical/design documentation when present.
- `MEMORY.md` stores the current project state, important decisions by reference, blockers, next step, and a short append-only work log.
- Do not copy the entire brief, file listings, source code, or conversation history into memory.
- Do not describe planned modules as implemented. Distinguish user-reported environment details from versions verified in the current workspace.
- Do not claim tests passed without their actual successful result.
