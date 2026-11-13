---
name: playwright-e2e
description: Use when creating, running, reviewing, or debugging Playwright end-to-end tests for the To-Do List application.
---

# Playwright E2E Workflow

Use this skill for E2E test design, execution, and failure analysis. The approved requirements and required scenarios live in `PROJECT_BRIEF.md` (testing section).

## Workflow

1. Inspect `package.json`, lock file, `playwright.config.js`, application entry point, and the relevant existing tests before changing anything.
2. Check the installed Node.js and Playwright versions. Verify compatibility against current official Playwright documentation when selecting or changing package versions.
3. Use Chromium only unless the user approves broader browser coverage.
4. Test observable user outcomes. Prefer accessible locators such as `getByRole`, `getByLabel`, and `getByText`; avoid coupling tests to implementation-only CSS classes.
5. Isolate independent tests. Clear or seed `localStorage` before each independent scenario through the page's origin. Do not clear storage between an action and the reload in the persistence scenario.
6. Cover at least: app startup; empty/whitespace input; add one and multiple tasks; complete and uncomplete; delete only the selected task; persist task text and status after reload; safe handling of malformed stored JSON; keyboard/focus basics; narrow viewport smoke check.
7. Use Playwright's auto-waiting and web-first assertions. Avoid arbitrary fixed sleeps and brittle timing assumptions.
8. Run the focused test while debugging, inspect the full failure and trace/output, fix the root cause, then rerun the affected test. Run the full E2E suite after a meaningful implementation change.
9. Distinguish application defects from test/environment setup failures. Do not weaken an assertion or skip a test just to make the run green without a documented technical reason.
10. Never claim a test passed unless the command completed successfully. Report command, result, browser, and any untested cases.
11. `text-transform` changes only the rendered text: the DOM text and the accessible name stay as authored. Keep role/label locators in the original casing and assert the rendered style through `getComputedStyle`/`evaluate` (for example `font-weight`, `letter-spacing`) with numeric tolerance instead of expecting uppercase text in a locator.
12. When the app ships a self-hosted font, verify it as a user-visible contract: every request goes to the app's own origin (no CDN or third-party font loader), `document.fonts.check` passes for the weights the UI uses, and different weights resolve to different files (a missing weight is silently replaced by the nearest available one).

## READ-ONLY Rule

When the current task is READ-ONLY, do not install packages, launch browser downloads, edit tests/configuration, or mutate storage. Produce only the proposed test strategy and any compatibility findings.
